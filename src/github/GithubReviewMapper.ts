import { PullRequest, PullRequestProps } from '../entities/PullRequest';
import { Review, ReviewProps } from '../entities/Review';
import { GithubReview } from './GithubReview';
import { Users } from '../entities/Users';

export class GithubReviewMapper {
  private readonly users: Users;

  constructor({ users }: { users: Users }) {
    this.users = users;
  }

  public toReview({ pr, repository, review }: { pr: PullRequest; repository: string; review: GithubReview }): Review | null {
    const author = this.users.findUserByGithubHandle(review.user.login);

    // Skipping unknown users (like bots and co..)
    if (author === null) {
      return null;
    }

    const props: ReviewProps = {
      id: review.id,
      author,
      repository,
      body: review.body,
      state: review.state,
      commitId: review.commit_id,
      bodyText: review.body_text,
      link: review.html_url,
      submittedAt: review.submitted_at ? new Date(review.submitted_at) : null,
      pullRequest: pr,
    };

    return new Review(props);
  }
}
