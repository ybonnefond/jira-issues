import { PullRequest } from './PullRequest';
import { TimeUtil } from '../TimeUtil';

export type ReviewCommentProps = {
  id: number;
  pullRequest: PullRequest;
  url: string;
  reviewId: number | null;
  commitId: string;
  inReplyToId: number | null;
  author: string;
  createdAt: Date;
  updatedAt: Date;
  htmlUrl: string;
  text: string;
};

export class ReviewComment {
  constructor(private readonly props: ReviewCommentProps) {}

  public toRow() {
    const prRow = this.props.pullRequest.toRow();

    return {
      id: this.props.id,
      url: this.props.htmlUrl,
      author: this.props.author,
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
    };
  }
}
