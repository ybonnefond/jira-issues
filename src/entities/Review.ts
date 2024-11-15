import { PullRequest } from './PullRequest';
import { GithubReviewState } from '../github/GithubReview';
import { TimeUtil } from '../TimeUtil';
import { User } from './User';

export type ReviewProps = {
  id: number;
  pullRequest: PullRequest;
  repository: string;
  author: User;
  body: string;
  state: GithubReviewState;
  link: string;
  submittedAt: Date | null;
  commitId: string | null;
  bodyText?: string;
};

export class Review {
  constructor(private readonly props: ReviewProps) {}

  public getId() {
    return this.props.id;
  }

  public getState() {
    return this.props.state;
  }

  public toRow() {
    const prRow = this.props.pullRequest.toRow();
    return {
      id: this.props.id,
      link: this.props.link,
      repository: this.props.repository,
      author: this.props.author.getName(),
      bodyText: this.props.bodyText,
      state: this.props.state,
      submittedAt: TimeUtil.toDate(this.props.submittedAt),
      submittedAtWeek: TimeUtil.toWeekOfYear(this.props.submittedAt),
      submittedAtMonth: TimeUtil.toMonthOfYear(this.props.submittedAt),
      submittedAtQuarter: TimeUtil.toQuarterOfYear(this.props.submittedAt),
      prNumber: this.props.pullRequest.getNumber(),
      prAuthor: this.props.pullRequest.getAuthor().getName(),
      prClosedAt: TimeUtil.toDate(this.props.pullRequest.getClosedAt()),
      prClosedAtWeek: TimeUtil.toWeekOfYear(this.props.pullRequest.getClosedAt()),
      prClosedAtMonth: TimeUtil.toMonthOfYear(this.props.pullRequest.getClosedAt()),
      prClosedAtQuarter: TimeUtil.toQuarterOfYear(this.props.pullRequest.getClosedAt()),
      authorSeniority: this.props.author.getSeniority(),
      authorRole: this.props.author.getRole(),
      prAuthorSeniority: prRow.authorSeniority,
      prAuthorRole: prRow.authorRole,
    };
  }
}
