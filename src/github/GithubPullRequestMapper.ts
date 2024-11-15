import { TimeUtil } from '../TimeUtil';
import { PullRequest, PullRequestProps } from '../entities/PullRequest';
import { Authors } from '../Configuration';
import { GithubPullRequest } from './GithubPullRequest';
import { Users } from '../entities/Users';

export class PullRequestMapper {
  private readonly users: Users;

  constructor({ users }: { users: Users }) {
    this.users = users;
  }

  public toPullRequest({ pr, repository }: { pr: GithubPullRequest; repository: string }): PullRequest | null {
    const author = this.users.findUserByGithubHandle(pr.user?.login);

    if (author === null) {
      return null;
    }

    const countComments = pr.comments ?? 0;
    const countReviewComments = pr.review_comments ?? 0;
    const additions = pr.additions ?? 0;
    const deletions = pr.deletions ?? 0;
    const changedFiles = pr.changed_files ?? 0;
    const commits = pr.commits ?? 0;

    const props: PullRequestProps = {
      id: pr.id,
      url: pr.url,
      title: pr.title,
      number: pr.number,
      link: pr.html_url,
      author,
      repository,
      createdAt: new Date(pr.created_at),
      updatedAt: new Date(pr.updated_at),
      closedAt: pr.closed_at ? new Date(pr.closed_at) : null,
      countComments,
      countReviewComments,
      totalComments: countComments + countReviewComments,
      additions,
      deletions,
      changedFiles,
      commits,
    };

    return new PullRequest(props);
  }
}
