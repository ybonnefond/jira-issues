import { Sprint } from './Sprint';
import { Statuses } from '../jira/Statuses';
import { Columns } from '../Columns';
import { Sprints } from '../Sprints';
import { StringUtils } from '../StringUtils';
import { TimeUtil, WORK_DAY_HOURS, DAY_HOURS } from '../TimeUtil';
import { Changelogs } from './Changelogs';
import { User } from './User';

export type IssueProps = {
  id: number;
  key: string;
  link: string;
  summary: string;
  status: string;
  priority: string;
  resolution: string;
  project: {
    key: string;
    name: string;
    id: string;
  };
  epic: null | {
    id: number;
    key: string;
    summary: string;
    status: string;
    priority: string;
    link: string;
  };
  parent: null | {
    id: number;
    key: string;
    summary: string;
    status: string;
    priority: string;
    type: string;
    assignee: null | User;
  };
  reporter: {
    name: string;
    email: string | null;
  };
  assignee: User | null;
  type: string;
  resolvedAt: Date | null;
  createdAt: Date;
  sprints: Array<Sprint>;
  estimation: number;
  totalTimeSpent: number;
  supportDiscoveredBy: string | null;
  supportResolutionType: string | null;
  product: string | null;
};

export class Issue {
  private changelogs: Changelogs;

  constructor(private readonly props: IssueProps, private readonly options: { deliveredStatuses: string[]; sprints: Sprints; columns: Columns[] }) {
    this.changelogs = new Changelogs({
      changelogs: [],
      statusMap: {
        [Statuses.TODO]: [],
        [Statuses.IN_PROGRESS]: [],
        [Statuses.HOLD]: [],
        [Statuses.QA]: [],
        [Statuses.DONE]: [],
      },
      createdAt: this.props.createdAt,
    });
  }

  public getKey() {
    return this.props.key;
  }

  public setChangelogs(changelogs: Changelogs) {
    this.changelogs = changelogs;
  }

  public getCreatedAt() {
    return this.props.createdAt;
  }

  public getStartedAt(): Date | null {
    const startedAt = this.changelogs.getStartedAt();

    // Never goes to in progress, likely moved to done directly
    // Fallback to creation date
    if (startedAt === null && this.props.resolvedAt !== null) {
      return this.props.createdAt;
    }

    return startedAt;
  }

  public getEpicKey() {
    return this.props.epic?.key ?? null;
  }

  private getLeadTimeMs(): number | null {
    let start = this.getStartedAt();

    // Skip if not started
    if (start === null) {
      return null;
    }

    // Calculate until now if no end date
    const end = this.props.resolvedAt instanceof Date ? this.props.resolvedAt : new Date();

    return end.getTime() - start.getTime();
  }

  private getLeadTimeBusinessMs(): number | null {
    let start = this.getStartedAt();

    // Skip if not started
    if (start === null) {
      return null;
    }

    // Calculate until now if no end date
    const end = this.props.resolvedAt instanceof Date ? this.props.resolvedAt : new Date();

    return TimeUtil.getBusinessDurationMs({ start, end });
  }

  public getIssueType() {
    switch (this.props.type) {
      case 'Sous-tâche':
        return 'subtask';
      default:
        return this.props.type;
    }
  }

  public hasAssignee() {
    return this.props.assignee !== null;
  }

  public getParentKey() {
    return this.props.parent?.key ?? null;
  }

  public getId() {
    return this.props.id;
  }

  public getSummary() {
    return this.props.summary;
  }

  public getStatus() {
    return this.props.status;
  }

  public getPriority() {
    return this.props.priority;
  }

  public getAssignee(): User | null {
    return this.props.assignee;
  }

  public getType() {
    return this.props.type;
  }

  public updateParent(parent: Issue) {
    this.props.parent = {
      id: parent.getId(),
      key: parent.getKey(),
      summary: parent.getSummary(),
      status: parent.getStatus(),
      priority: parent.getPriority(),
      type: parent.getType(),
      assignee: parent.getAssignee() ?? null,
    };
  }

  private getEpicLabel(): string | null {
    return this.props.epic?.summary ? this.props.epic?.summary.replace(/\[.*\]\s*/, '') : null;
  }

  public getValues(): Record<Columns, unknown> {
    const createdAt = this.props.createdAt;
    const startedAt = this.getStartedAt();
    const resolvedAt = this.props.resolvedAt;

    const createdAtSprint = this.options.sprints.findSprint(createdAt);
    const startedAtSprint = this.options.sprints.findSprint(startedAt);
    const resolvedAtSprint = this.options.sprints.findSprint(resolvedAt);

    const leadTimeMs = this.getLeadTimeMs();
    const leadTimeBusinessMs = this.getLeadTimeBusinessMs();

    const leadTimeDays = TimeUtil.toDurationInRoundedDays24h(leadTimeMs);
    const leadTimeBusinessDays = TimeUtil.toDurationInRoundedDaysBusinessHours(leadTimeBusinessMs);

    const durationsByStatus = this.changelogs.getDurations();

    const assignee = this.findAssignee();

    return {
      [Columns.ID]: this.props.id,
      [Columns.TYPE]: this.getIssueType(),
      [Columns.TYPE_NORMALIZED]: StringUtils.toScreamingCase(this.getIssueType()),
      [Columns.PROJECT_KEY]: this.props.project.key,
      [Columns.PROJECT_NAME]: this.props.project.name,
      [Columns.KEY]: this.props.key,
      [Columns.STATUS]: this.props.status,
      [Columns.SUMMARY]: this.props.summary,
      [Columns.ESTIMATION]: this.props.estimation,
      [Columns.TIME_SPENT]: this.props.totalTimeSpent > 0 ? this.props.totalTimeSpent : null,
      [Columns.REPORTER]: this.props.reporter.name,
      [Columns.ASSIGNEE]: assignee instanceof User ? assignee.getName() : null,
      [Columns.ASSIGNEE_SENIORITY]: assignee instanceof User ? assignee.getSeniority() : null,
      [Columns.ASSIGNEE_ROLE]: assignee instanceof User ? assignee.getRole() : null,
      [Columns.PRIORITY]: this.props.priority,
      [Columns.EPIC_KEY]: this.props.epic?.key,
      [Columns.EPIC_SUMMARY]: this.props.epic?.summary,
      [Columns.EPIC_STATUS]: this.props.epic?.status,
      [Columns.EPIC_LABEL]: this.getEpicLabel(),
      [Columns.EPIC_LINK]: this.props.epic?.link,
      [Columns.LINK]: this.props.link,
      [Columns.SUPPORT_DISCOVERED_BY]: this.props.supportDiscoveredBy ?? null,
      [Columns.SUPPORT_RESOLUTION_TYPE]: this.props.supportResolutionType ?? null,
      [Columns.SUPPORT_PRODUCT]: this.props.product ?? null,

      [Columns.IS_STARTED]: startedAt instanceof Date,
      [Columns.IS_DELIVERED]: resolvedAt instanceof Date,
      [Columns.IS_IN_PROGRESS]: startedAt instanceof Date && resolvedAt === null,

      [Columns.CREATED_AT]: this.props.createdAt,
      [Columns.CREATED_SPRINT]: createdAtSprint ? createdAtSprint.label : null,
      [Columns.CREATED_WEEK]: TimeUtil.toWeekOfYear(createdAt),
      [Columns.CREATED_MONTH]: TimeUtil.toMonthOfYear(createdAt),
      [Columns.CREATED_QUARTER]: TimeUtil.toQuarterOfYear(createdAt),

      [Columns.STARTED_AT]: startedAt,
      [Columns.STARTED_SPRINT]: startedAtSprint ? startedAtSprint.label : null,
      [Columns.STARTED_WEEK]: TimeUtil.toWeekOfYear(startedAt),
      [Columns.STARTED_MONTH]: TimeUtil.toMonthOfYear(startedAt),
      [Columns.STARTED_QUARTER]: TimeUtil.toQuarterOfYear(startedAt),

      [Columns.RESOLVED_AT]: this.props.resolvedAt,
      [Columns.RESOLVED_SPRINT]: resolvedAtSprint ? resolvedAtSprint.label : null,
      [Columns.RESOLVED_WEEK]: TimeUtil.toWeekOfYear(resolvedAt),
      [Columns.RESOLVED_MONTH]: TimeUtil.toMonthOfYear(resolvedAt),
      [Columns.RESOLVED_QUARTER]: TimeUtil.toQuarterOfYear(resolvedAt),

      [Columns.LEAD_TIME_SECONDS]: TimeUtil.toDurationInSeconds(leadTimeMs),
      [Columns.LEAD_TIME_HOURS]: TimeUtil.toDurationInHours(leadTimeMs),
      [Columns.LEAD_TIME_DAYS]: leadTimeDays,
      [Columns.LEAD_TIME_DAYS_BUCKET]: this.getLeadTimeDayBucket(leadTimeDays, [7, 14, 21, 28, 35]),

      [Columns.LEAD_TIME_BUSINESS_SECONDS]: TimeUtil.toDurationInSeconds(leadTimeBusinessMs),
      [Columns.LEAD_TIME_BUSINESS_HOURS]: TimeUtil.toDurationInHours(leadTimeBusinessMs),
      [Columns.LEAD_TIME_BUSINESS_DAYS]: leadTimeBusinessDays,
      [Columns.LEAD_TIME_BUSINESS_DAYS_BUCKET]: this.getLeadTimeDayBucket(leadTimeBusinessDays, [5, 10, 15, 20, 30]),

      [Columns.STATUS_DURATION_DAYS_TODO]: TimeUtil.toDurationInRoundedDays24h(durationsByStatus[Statuses.TODO].milliseconds),
      [Columns.STATUS_BUSINESS_DURATION_DAYS_TODO]: TimeUtil.toDurationInRoundedDaysBusinessHours(durationsByStatus[Statuses.TODO].businessMilliseconds),
      [Columns.STATUS_DURATION_DAYS_HOLD]: TimeUtil.toDurationInRoundedDays24h(durationsByStatus[Statuses.HOLD].milliseconds),
      [Columns.STATUS_BUSINESS_DURATION_DAYS_HOLD]: TimeUtil.toDurationInRoundedDaysBusinessHours(durationsByStatus[Statuses.HOLD].businessMilliseconds),
      [Columns.STATUS_DURATION_DAYS_IN_PROGRESS]: TimeUtil.toDurationInRoundedDays24h(durationsByStatus[Statuses.IN_PROGRESS].milliseconds),
      [Columns.STATUS_BUSINESS_DURATION_DAYS_IN_PROGRESS]: TimeUtil.toDurationInRoundedDaysBusinessHours(durationsByStatus[Statuses.IN_PROGRESS].businessMilliseconds),
      [Columns.STATUS_DURATION_DAYS_QA]: TimeUtil.toDurationInRoundedDays24h(durationsByStatus[Statuses.QA].milliseconds),
      [Columns.STATUS_BUSINESS_DURATION_DAYS_QA]: TimeUtil.toDurationInRoundedDaysBusinessHours(durationsByStatus[Statuses.QA].businessMilliseconds),
    };
  }

  private findAssignee(): User | null {
    if (this.props.assignee instanceof User) {
      return this.props.assignee;
    }

    if (this.props.parent?.assignee instanceof User) {
      return this.props.parent.assignee;
    }

    return null;
  }

  private getLeadTimeDayBucket(value: number | null, buckets: number[]) {
    if (value === null) {
      return null;
    }

    let lowerBound = 0;

    for (let i = 0; i < buckets.length; i++) {
      const upperBound = buckets[i];
      if (value <= buckets[i]) {
        return `[${i}] ${String(lowerBound)} to ${String(buckets[i])} days`;
      }

      lowerBound = buckets[i];
    }

    // If value exceeds the largest bucket, assign it to the "30+" bucket
    return `[${buckets.length - 1}] ${buckets[buckets.length - 1]}+ days`;
  }

  public toRow() {
    const values = this.getValues();

    const rows: Record<string, unknown> = {};

    for (const column of this.options.columns) {
      const value = values[column];
      rows[column] = this.formatRowValue({ value });
    }

    return rows;
  }

  private formatRowValue({ value }: { value: unknown }) {
    switch (true) {
      case value === null || typeof value === 'undefined':
        return '';
      case typeof value === 'boolean':
        return value === true ? 'YES' : 'NO';
      case value instanceof Date:
        return TimeUtil.toDate(value as Date);
      default:
        return value;
    }
  }
}
