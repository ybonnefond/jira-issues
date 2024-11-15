import { PullRequest } from '../entities/PullRequest';
import { ReviewComment, ReviewCommentProps } from '../entities/ReviewComment';
import { GithubReviewComment } from './GithubReviewComment';
import { Users } from '../entities/Users';

export class GithubReviewCommentMapper {
  private readonly users: Users;

  constructor({ users }: { users: Users }) {
    this.users = users;
  }

  public toReviewComment({ pullRequest, comment }: { pullRequest: PullRequest; comment: GithubReviewComment }): ReviewComment | null {
    const author = this.users.findUserByGithubHandle(comment.user?.login);

    // Skipping unknown users (like bots and co..)
    if (author === null) {
      return null;
    }

    const props: ReviewCommentProps = {
      id: comment.id,
      pullRequest,
      url: comment.url,
      reviewId: comment.pull_request_review_id,
      commitId: comment.commit_id,
      inReplyToId: comment.in_reply_to_id ?? null,
      author,
      createdAt: new Date(comment.created_at),
      updatedAt: new Date(comment.updated_at),
      htmlUrl: comment.html_url,
      text: comment.body,
    };

    return new ReviewComment(props);
  }
}
