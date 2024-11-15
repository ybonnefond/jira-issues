import { PullRequest } from './PullRequest';
import { User } from './User';

export type ReviewCommentProps = {
  id: number;
  pullRequest: PullRequest;
  url: string;
  reviewId: number | null;
  commitId: string;
  inReplyToId: number | null;
  author: User;
  createdAt: Date;
  updatedAt: Date;
  htmlUrl: string;
  text: string;
};

export class ReviewComment {
  constructor(private readonly props: ReviewCommentProps) {}

  public getReviewId() {
    return this.props.reviewId;
  }

  public toRow() {
    const prRow = this.props.pullRequest.toRow();

    return {
      id: this.props.id,
      url: this.props.htmlUrl,
      author: this.props.author.getName(),
      reviewId: this.props.reviewId,
      commitId: this.props.commitId,

      isReply: this.props.inReplyToId === null ? 'FALSE' : 'TRUE',
      text: this.props.text,

      repository: prRow.repository,

      prAuthor: prRow.author,
      prCreatedAt: prRow.createdAt,
      prCreatedAtWeek: prRow.createdAtWeek,
      prCreatedAtMonth: prRow.createdAtMonth,
      prCreatedAtQuarter: prRow.createdAtQuarter,
      prUpdatedAt: prRow.updatedAt,
      prUpdatedAtWeek: prRow.updatedAtWeek,
      prUpdatedAtMonth: prRow.updatedAtMonth,
      prUpdatedAtQuarter: prRow.updatedAtQuarter,
      prClosedAt: prRow.closedAt,
      prClosedAtWeek: prRow.closedAtWeek,
      prClosedAtMonth: prRow.closedAtMonth,
      prClosedAtQuarter: prRow.closedAtQuarter,
      authorSeniority: this.props.author.getSeniority(),
      authorRole: this.props.author.getRole(),
      prAuthorSeniority: prRow.authorSeniority,
      prAuthorRole: prRow.authorRole,
    };
  }
}
