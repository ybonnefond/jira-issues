import { Sprint } from './Sprint';
import { IssueChangelog } from './IssueChangelog';
import { Statuses } from '../jira/Statuses';
import { format, startOfDay, endOfDay, isWeekend, addDays } from 'date-fns';
import { Columns } from '../Columns';
import { Sprints } from '../Sprints';
import { StringUtils } from '../StringUtils';

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
    assignee: null | {
      name: string;
      email: string | null;
    };
  };
  reporter: {
    name: string;
    email: string | null;
  };
  assignee: null | {
    name: string;
    email: string | null;
  };
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

const ONE_HOUR = 60 * 60 * 1000;
const SIX_HOURS = 6 * ONE_HOUR;
const WORK_START_HOUR = 9; // 9 AM
const WORK_END_HOUR = 18; // 6 PM

// 8 hours per day, accounting for a 1-hour lunch break
const WORK_DAY_HOURS = (WORK_END_HOUR - WORK_START_HOUR) * ONE_HOUR - ONE_HOUR;
const DAY_HOURS = 24 * ONE_HOUR;

export class Issue {
  private changelogs: IssueChangelog[] = [];

  constructor(private readonly props: IssueProps, private readonly options: { deliveredStatuses: string[]; sprints: Sprints; columns: Columns[] }) {}

  public getKey() {
    return this.props.key;
  }

  public setChangelogs(changelogs: IssueChangelog[]) {
    this.changelogs = changelogs;
  }

  public getStartedAt(): Date | null {
    let last: Date | null = null;
    for (const changelog of this.changelogs) {
      if (!changelog.isStatusChangelog()) {
        continue;
      }

      const from = changelog.getFromStringNormalized();
      const to = changelog.getToStringNormalized();

      const isChangingToInProgress = to === Statuses.IN_PROGRESS && [Statuses.TODO, Statuses.DRAFT].includes((from ?? '') as Statuses);
      if (!isChangingToInProgress) {
        continue;
      }

      const isFirstTimeSwitchedToInProgress = last === null || last < changelog.getChangedAt();
      if (isFirstTimeSwitchedToInProgress) {
        last = changelog.getChangedAt();
      }
    }

    return last;
  }

  public getEpicKey() {
    return this.props.epic?.key ?? null;
  }

  private getLeadTimeMs(): number | null {
    let start = this.getStartedAt();

    // Skip if not started
    if (start === null) {
      // Not started & not resolved
      if (this.props.resolvedAt === null) {
        return null;
      }

      // Resolved but not start date, mean that directly switched to done without being set to "in progress"
      // falling back to creation date
      start = this.props.createdAt;
    }

    // Calculate until now if no end date
    const end = this.props.resolvedAt instanceof Date ? this.props.resolvedAt : new Date();

    return end.getTime() - start.getTime();
  }

  private getLeadTimeBusinessMs(): number | null {
    let start = this.getStartedAt();

    // Skip if not started
    if (start === null) {
      // Not started & not resolved
      if (this.props.resolvedAt === null) {
        return null;
      }

      // Resolved but not start date, mean that directly switched to done without being set to "in progress"
      // falling back to creation date
      start = this.props.createdAt;
    }

    // Calculate until now if no end date
    const end = this.props.resolvedAt instanceof Date ? this.props.resolvedAt : new Date();

    let totalDuration = 0;
    let current = startOfDay(start);
    const endOfPeriod = endOfDay(end);

    const startDay = this.toDate(start);
    const endDay = this.toDate(end);

    while (current <= endOfPeriod) {
      if (!isWeekend(current)) {
        const currentDay = this.toDate(current);
        // Define workday start and end
        const startOfWorkDay = new Date(current);
        startOfWorkDay.setHours(WORK_START_HOUR, 0, 0, 0);

        const endOfWorkDay = new Date(current);
        endOfWorkDay.setHours(WORK_END_HOUR, 0, 0, 0);

        // Calculate the effective work start and end time for this day
        const taskStart = currentDay === startDay ? start : startOfWorkDay;
        const taskEnd = currentDay === endDay ? end : endOfWorkDay;

        let durationMs = taskEnd.getTime() - taskStart.getTime();
        // Subtract 1 hour for lunch break if the work period is greater than SIX_HOURS
        if (durationMs > SIX_HOURS) {
          durationMs -= ONE_HOUR; // Lunch break
        }
        totalDuration += durationMs;
      }
      current = addDays(current, 1); // Move to next day
    }

    return totalDuration;
  }

  private toDurationInSeconds(durationMs: number | null): number | null {
    if (durationMs === null) {
      return null;
    }

    return Math.round(durationMs / 1000);
  }

  private toDurationInHours(durationMs: number | null): number | null {
    if (durationMs === null) {
      return null;
    }

    const durationHours = durationMs / ONE_HOUR;
    const duration = Math.round(durationHours * 2) / 2; // Round to nearest half-hour

    if (duration === 0 && durationMs > 0) {
      return 0.5;
    }

    return duration;
  }

  private toDurationInRoundedDays(durationMs: number | null, hoursInADay: number): number | null {
    if (durationMs === null) {
      return null;
    }

    // Calculate total workdays rounded to the nearest half-day
    const durationDays = durationMs / hoursInADay;
    const duration = Math.round(durationDays * 2) / 2; // Round to nearest half-day

    if (duration === 0 && durationMs > 0) {
      return 0.5;
    }

    return duration;
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

  public getAssignee() {
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
      assignee: parent.getAssignee(),
    };
  }

  private toDate(value: Date | null | undefined, returnNull: boolean = false) {
    if (!value) {
      return returnNull ? null : '';
    }

    return format(value, 'yyyy-MM-dd');
  }

  private getEpicLabel(): string | null {
    return this.props.epic?.summary ? this.props.epic?.summary.replace(/\[.*\]\s*/, '') : null;
  }

  private toWeekOfYear(date: Date | null) {
    if (date === null) {
      return null;
    }

    return `W${format(date, 'yyyy-ww')}`;
  }

  private toMonthOfYear(date: Date | null) {
    if (date === null) {
      return null;
    }

    return `M${format(date, 'yyyy-MM')}`;
  }

  private toQuarterOfYear(date: Date | null) {
    if (date === null) {
      return null;
    }

    return `Q${format(date, 'yyyy-QQQ')}`;
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

    const leadTimeDays = this.toDurationInRoundedDays(leadTimeMs, DAY_HOURS);
    const leadTimeBusinessDays = this.toDurationInRoundedDays(leadTimeBusinessMs, WORK_DAY_HOURS);

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
      [Columns.ASSIGNEE]: this.props.assignee?.name ?? this.props.parent?.assignee?.name ?? null,
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
      [Columns.CREATED_WEEK]: this.toWeekOfYear(createdAt),
      [Columns.CREATED_MONTH]: this.toMonthOfYear(createdAt),
      [Columns.CREATED_QUARTER]: this.toQuarterOfYear(createdAt),

      [Columns.STARTED_AT]: startedAt,
      [Columns.STARTED_SPRINT]: startedAtSprint ? startedAtSprint.label : null,
      [Columns.STARTED_WEEK]: this.toWeekOfYear(startedAt),
      [Columns.STARTED_MONTH]: this.toMonthOfYear(startedAt),
      [Columns.STARTED_QUARTER]: this.toQuarterOfYear(startedAt),

      [Columns.RESOLVED_AT]: this.props.resolvedAt,
      [Columns.RESOLVED_SPRINT]: resolvedAtSprint ? resolvedAtSprint.label : null,
      [Columns.RESOLVED_WEEK]: this.toWeekOfYear(resolvedAt),
      [Columns.RESOLVED_MONTH]: this.toMonthOfYear(resolvedAt),
      [Columns.RESOLVED_QUARTER]: this.toQuarterOfYear(resolvedAt),

      [Columns.LEAD_TIME_SECONDS]: this.toDurationInSeconds(leadTimeMs),
      [Columns.LEAD_TIME_HOURS]: this.toDurationInHours(leadTimeMs),
      [Columns.LEAD_TIME_DAYS]: leadTimeDays,
      [Columns.LEAD_TIME_DAYS_BUCKET]: this.getLeadTimeDayBucket(leadTimeDays, [7, 14, 21, 28, 35]),

      [Columns.LEAD_TIME_BUSINESS_SECONDS]: this.toDurationInSeconds(leadTimeBusinessMs),
      [Columns.LEAD_TIME_BUSINESS_HOURS]: this.toDurationInHours(leadTimeBusinessMs),
      [Columns.LEAD_TIME_BUSINESS_DAYS]: leadTimeBusinessDays,
      [Columns.LEAD_TIME_BUSINESS_DAYS_BUCKET]: this.getLeadTimeDayBucket(leadTimeBusinessDays, [5, 10, 15, 20, 30]),
    };
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
        return this.toDate(value as Date);
      default:
        return value;
    }
  }

  // public toRow(sprint: Sprint): Record<string, string | number | boolean> {
  //   const estimation = this.getEstimation();
  //
  //   const isCommitted = this.isInSprintCommitment(sprint);
  //   const sprintCommittedStoryPoints = isCommitted ? estimation : 0;
  //
  //   // Use only done status as
  //   const isDelivered = this.isinSprintDelivery(sprint);
  //   const sprintDeliveredStoryPoint = isDelivered ? estimation : 0;
  //   const sprintName = sprint.getSprintName();
  //   const isActualSprint = sprint.isActualSprint();
  //   const startedInSprint = this.startedInSprint(sprint);
  //   const resolvedInSprint = this.resolvedInSprint(sprint);
  //   const createdInSprint = this.createdInSprint(sprint);
  //   const startedAt = this.getStartedAt();
  //   const worDurationMs = this.getLeadTimeMs();
  //
  //   const epicLabel = this.props.epic?.summary ? this.props.epic?.summary.replace(/\[.*\]\s*/, '') : '';
  //
  //   return {
  //     // ⚠️Do not change the order of the keys, this will break the pivot table & charts ⚠️
  //     id: this.props.id,
  //     type: this.getIssueType(),
  //     key: this.props.key,
  //     status: this.props.status,
  //     summary: this.props.summary,
  //     estimation,
  //     timeSpent: this.props.totalTimeSpent,
  //     reporter: this.props.reporter.name,
  //     assignee: this.props.assignee?.name ?? this.props.parent?.assignee?.name ?? '',
  //     createdAt: this.props.createdAt.toISOString(),
  //     resolvedAt: this.toDate(this.props.resolvedAt),
  //     priority: this.props.priority,
  //     epicKey: this.props.epic?.key ?? '',
  //     epicSummary: this.props.epic?.summary ?? '',
  //     link: this.props.link,
  //     sprintId: sprint.getId(),
  //     sprintName,
  //     sprintStartedAt: sprint.getStartedAt()?.toISOString() ?? '',
  //     sprintEndedAt: sprint.getEndedAt()?.toISOString() ?? '',
  //     sprintCompletedAt: sprint.getCompletedAt()?.toISOString() ?? '',
  //     isCommitted,
  //     isDelivered,
  //     sprintCommittedStoryPoints,
  //     sprintDeliveredStoryPoint,
  //     sprintGoal: sprint.getGoal(),
  //     startedAt: this.getStartedAt()?.toISOString() ?? '',
  //     workDurationMs: isDelivered ? worDurationMs ?? '' : '',
  //     workDurationHrs: isDelivered ? this.toDurationInHours(worDurationMs) ?? '' : '',
  //     weekResolvedAt: this.props.resolvedAt ? 'W' + format(this.props.resolvedAt, 'yyyy-ww') : '',
  //     supportDiscoveredBy: this.props.supportDiscoveredBy,
  //     supportResolutionType: this.props.supportResolutionType,
  //     isActualSprint,
  //     startedInSprint: startedInSprint ? 'YES' : '',
  //     resolvedInSprint: resolvedInSprint ? 'YES' : '',
  //     createdInSprint: createdInSprint ? 'YES' : '',
  //     product: this.props.product ?? '',
  //     epicLabel,
  //     fortnightResolvedAt: this.props.resolvedAt ? 'F' + this.getFortnight(this.props.resolvedAt) : '',
  //     monthResolvedAt: this.props.resolvedAt ? 'M' + format(this.props.resolvedAt, 'yyyy-MM') : '',
  //     quarterResolvedAt: this.props.resolvedAt ? 'Q' + format(this.props.resolvedAt, 'yyyy-QQQ') : '',
  //
  //     weekCreatedAt: 'W' + format(this.props.createdAt, 'yyyy-ww'),
  //     fortnightCreatedAt: this.getFortnight(this.props.createdAt),
  //     monthCreatedAt: format(this.props.createdAt, 'yyyy-MM'),
  //     quarterCreatedAt: format(this.props.createdAt, 'yyyy-QQQ'),
  //
  //     weekStartedAt: startedAt ? 'W' + format(startedAt, 'yyyy-ww') : '',
  //     fortnightStartedAt: startedAt ? 'F' + this.getFortnight(startedAt) : '',
  //     monthStartedAt: startedAt ? 'M' + format(startedAt, 'yyyy-MM') : '',
  //     quarterStartedAt: startedAt ? 'Q' + format(startedAt, 'yyyy-QQQ') : '',
  //     workDurationDays: this.toDurationInRoundedDays(worDurationMs) ?? '',
  //   };
  // }

  // private getFortnight(date: Date): string {
  //   // Get the start of the year for the given date
  //   const year = date.getFullYear();
  //   const startOfYearDate = startOfYear(date);
  //
  //   // Calculate the difference in days from the start of the year
  //   const diffInDays = differenceInDays(date, startOfYearDate);
  //
  //   // Calculate the fortnight number
  //   const fortnightNumber = Math.floor(diffInDays / 14) + 1;
  //
  //   // Return the fortnight ID in the format "YYYY-FN"
  //   return `${year}-${fortnightNumber.toString().padStart(2, '0')}`;
  // }
  //
  // private round(value: number, decimalPlaces: number = 2): number {
  //   const factor = Math.pow(10, decimalPlaces);
  //   return Math.round(value * factor) / factor;
  // }
}
