import { Configuration } from '../Configuration';
import axiosRetry from 'axios-retry';
import axios, { AxiosInstance } from 'axios';
import { format } from 'date-fns';
import { GithubSearchPullRequest } from './GithubSearchPullRequest';
import { GithubPullRequest } from './GithubPullRequest';
import { GithubReviewComment } from './GithubReviewComment';
import { batch } from '../batch';
import { GithubReview } from './GithubReview';
import { PullRequestMapper } from './GithubPullRequestMapper';
import { PullRequest, PullRequestProps } from '../entities/PullRequest';
import { GithubReviewCommentMapper } from './GithubReviewCommentMapper';
import { ReviewComment } from '../entities/ReviewComment';

export class GithubApi {
  private readonly axios: AxiosInstance;
  private readonly configuration: Configuration;
  private readonly pullRequestMapper: PullRequestMapper;
  private readonly reviewCommentMapper: GithubReviewCommentMapper;

  constructor({ configuration }: { configuration: Configuration }) {
    this.configuration = configuration;

    this.axios = axios.create({
      baseURL: this.configuration.github.origin,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.configuration.github.token}`,
        'X-GitHub-Api-Version': '2022-11-28',
      },
      validateStatus: () => true,
      // timeout: 5000,
    });

    axiosRetry(this.axios, { retries: 3, retryDelay: axiosRetry.exponentialDelay });

    this.pullRequestMapper = new PullRequestMapper({ authors: this.configuration.github.authors });
    this.reviewCommentMapper = new GithubReviewCommentMapper({ authors: this.configuration.github.authors });
  }

  public async listPullRequests({ page, maxResults, repository }: { page: number; maxResults: number; repository: string }): Promise<GithubSearchPullRequest[]> {
    const query = `is:pr is:merged repo:${this.configuration.github.organization}/${repository} closed:>${format(this.configuration.github.prClosedFrom, 'yyyy-MM-dd')}`;
    const results = await this.axios.get<{ total_count: number; items: GithubSearchPullRequest[] }>('/search/issues', {
      params: {
        q: query,
        page,
        per_page: maxResults,
        sort: 'number',
        order: 'desc',
      },
    });

    return results.data.items ?? [];
  }

  public async getPullRequest({ pullRequestNumber, repository }: { pullRequestNumber: number; repository: string }): Promise<PullRequest> {
    const result = await this.axios.get<GithubPullRequest>(`/repos/${this.configuration.github.organization}/${repository}/pulls/${pullRequestNumber}`);

    return this.pullRequestMapper.toPullRequest({ pr: result.data, repository });
  }

  public async getPullRequestReviews({ repository, pullRequest }: { repository: string; pullRequest: PullRequest }): Promise<GithubReview[]> {
    const reviews: GithubReview[] = [];

    await batch({
      batchSize: 100,
      load: async ({ page, batchSize, startAt }) => {
        const result = await this.axios.get<GithubReview[]>(`/repos/${this.configuration.github.organization}/${repository}/pulls/${pullRequest.getNumber()}/reviews`, {
          params: {
            per_page: batchSize,
            page,
            since: this.configuration.github.prClosedFrom.toISOString(),
            sort: 'created_at',
            order: 'desc',
          },
        });

        return result.data;
      },
      process: async (batch: GithubReview[]) => {
        reviews.push(...batch);
      },
    });

    return reviews;
  }

  public async listPullRequestReviewComments({ repository, pullRequest }: { repository: string; pullRequest: PullRequest }): Promise<ReviewComment[]> {
    const comments: ReviewComment[] = [];

    await batch({
      batchSize: 100,
      load: async ({ page, batchSize, startAt }) => {
        const results = await this.axios.get<GithubReviewComment[]>(`/repos/${this.configuration.github.organization}/${repository}/pulls/${pullRequest.getNumber()}/comments`, {
          params: {
            per_page: batchSize,
            page,
            since: this.configuration.github.prClosedFrom.toISOString(),
            sort: 'created_at',
            order: 'desc',
          },
        });

        return results.data;
      },
      process: async (batch: GithubReviewComment[]) => {
        batch.forEach((comment) => {
          const reviewComment = this.reviewCommentMapper.toReviewComment({ pullRequest, comment });

          if (reviewComment !== null) {
            comments.push(reviewComment);
          }
        });
      },
    });

    return comments;
  }
}
