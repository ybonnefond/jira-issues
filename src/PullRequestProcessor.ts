import { JiraApi } from './jira/JiraApi';
import { CsvWriter } from './CsvWriter';
import { batch } from './batch';
import { Issue } from './entities/Issue';
import { Changelog } from './entities/Changelog';
import * as console from 'console';
import { Configuration } from './Configuration';
import chalk from 'chalk';
import { Changelogs } from './entities/Changelogs';
import { GithubApi } from './github/GithubApi';
import { GithubSearchPullRequest } from './github/GithubSearchPullRequest';
import { format } from 'date-fns';
import { TimeUtil } from './TimeUtil';
import { mapGithubPrToRow } from './github/GithubPullRequest';
import { mapGithubReviewsToStateCount } from './github/GithubReview';
import { PullRequestMapper } from './github/GithubPullRequestMapper';

export class PullRequestProcessor {
  private readonly github: GithubApi;
  private readonly prWriter: CsvWriter;
  private readonly commentWriter: CsvWriter;
  private readonly configuration: Configuration;
  private readonly pullRequestMapper: PullRequestMapper;

  constructor({ github, prWriter, configuration, commentWriter }: { github: GithubApi; prWriter: CsvWriter; commentWriter: CsvWriter; configuration: Configuration }) {
    this.github = github;
    this.prWriter = prWriter;
    this.commentWriter = commentWriter;
    this.configuration = configuration;
    this.pullRequestMapper = new PullRequestMapper({ authors: this.configuration.github.authors });
  }

  public async process() {
    console.log('Processing pull requests...');

    await this.prWriter.begin();
    await this.commentWriter.begin();

    let total = 0;

    const repositories = this.configuration.github.repositories;

    for (const repository of repositories) {
      await batch({
        batchSize: this.configuration.github.batchSize,
        load: async ({ page, batchSize, startAt }) => {
          console.log(`Loading pull request batch [${chalk.bold.white(startAt)}, ${chalk.bold.white(startAt + batchSize)}]`);
          const githubPage = page + 1; // GitHub pages are 1-based
          return this.github.listPullRequests({ page: githubPage, maxResults: batchSize, repository });
        },
        process: async (batch: GithubSearchPullRequest[]) => {
          total += batch.length;

          for (const searchPr of batch) {
            if (!searchPr.created_at) {
              console.log('No created_at date found, skipping...');
              continue;
            }

            const author = this.configuration.github.authors.findAuthorNameByGithubHandle(searchPr.user.login);

            if (author === null) {
              console.log(`Unknown author ${searchPr.user.login}, skipping...`);
              continue;
            }

            console.log(`Fetching info for pull request ${repository}#${chalk.blue(searchPr.number)}`);
            const pullRequest = await this.github.getPullRequest({ pullRequestNumber: searchPr.number, repository });

            const githubReviews = await this.github.getPullRequestReviews({ repository, pullRequest });
            const reviewComments = await this.github.listPullRequestReviewComments({ repository, pullRequest });

            const reviewStates = mapGithubReviewsToStateCount(githubReviews);

            this.prWriter.write({
              ...pullRequest.toRow(),
              ...reviewStates,
            });

            if (reviewComments.length > 0) {
              console.log(`Writing comments ${repository}#${chalk.blue(pullRequest.getNumber())}`);

              for (const reviewComment of reviewComments) {
                this.commentWriter.write(reviewComment.toRow());
              }
            }
          }

          console.log('');
        },
      });
    }

    console.log(`Total: ${total} issues processed`);

    this.prWriter.end();
    console.log('');
  }
}
