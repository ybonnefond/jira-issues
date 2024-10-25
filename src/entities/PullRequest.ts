import { TimeUtil } from '../TimeUtil';

export interface PullRequestProps {
  id: number;
  url: string;
  title: string;
  number: number;
  link: string;
  author: string;
  repository: string;
  createdAt: Date;
  updatedAt: Date;
  closedAt: Date | null;
  countComments: number;
  countReviewComments: number;
  totalComments: number;
  additions: number;
  deletions: number;
  changedFiles: number;
  commits: number;
}

export class PullRequest {
  constructor(private readonly props: PullRequestProps) {}

  public getNumber() {
    return this.props.number;
  }

  public toRow() {
    const leadTimeMs = this.props.closedAt ? this.props.closedAt.getTime() - this.props.createdAt.getTime() : null;
    const businessLeadTimeMs = this.props.closedAt ? TimeUtil.getBusinessDurationMs({ start: this.props.createdAt, end: this.props.closedAt }) : null;

    return {
      id: this.props.id,
      url: this.props.url,
      title: this.props.title,
      number: this.props.number,
      link: this.props.link,
      author: this.props.author,
      repository: this.props.repository,
      createdAt: TimeUtil.toDate(this.props.createdAt),
      createdAtWeek: TimeUtil.toWeekOfYear(this.props.createdAt),
      createdAtMonth: TimeUtil.toMonthOfYear(this.props.createdAt),
      createdAtQuarter: TimeUtil.toQuarterOfYear(this.props.createdAt),
      updatedAt: TimeUtil.toDate(this.props.updatedAt),
      updatedAtWeek: TimeUtil.toWeekOfYear(this.props.updatedAt),
      updatedAtMonth: TimeUtil.toMonthOfYear(this.props.updatedAt),
      updatedAtQuarter: TimeUtil.toQuarterOfYear(this.props.updatedAt),
      closedAt: TimeUtil.toDate(this.props.closedAt),
      closedAtWeek: TimeUtil.toWeekOfYear(this.props.closedAt),
      closedAtMonth: TimeUtil.toMonthOfYear(this.props.closedAt),
      closedAtQuarter: TimeUtil.toQuarterOfYear(this.props.closedAt),
      countComments: this.props.countComments,
      countReviewComments: this.props.countReviewComments,
      totalComments: this.props.totalComments,
      additions: this.props.additions,
      deletions: this.props.deletions,
      changed_files: this.props.changedFiles,
      commits: this.props.commits,
      leadTimeMs,
      leadTimeDays: leadTimeMs ? TimeUtil.toDurationInRoundedDays24h(leadTimeMs) : null,
      businessLeadTimeMs: businessLeadTimeMs ? TimeUtil.toDurationInRoundedDaysBusinessHours(businessLeadTimeMs) : null,
    };
  }
}
