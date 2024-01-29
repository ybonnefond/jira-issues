import { Sprint } from './Sprint';
import { IssueChangelog } from './IssueChangelog';
import { Statuses } from '../jira/Statuses';
import { format } from 'date-fns';

export type IssueProps = {
  id: number;
  key: string;
  link: string;
  summary: string;
  status: string;
  priority: string;
  resolution: string;
  epic: null | {
    id: number;
    key: string;
    summary: string;
    status: string;
    priority: string;
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
  supportDiscoveredBy: string;
  supportResolutionType: string;
};
export class Issue {
  private changelogs: IssueChangelog[] = [];
  constructor(private readonly props: IssueProps) {}

  public getKey() {
    return this.props.key;
  }

  public setChangelogs(changelogs: IssueChangelog[]) {
    this.changelogs = changelogs;
  }

  public getAllSprintIds(): Set<number> {
    const sprintsIds = new Set<number>(this.props.sprints.map((sprint: Sprint) => sprint.getId()));

    for (const changelog of this.changelogs) {
      if (changelog.isSprintChangeLog()) {
        changelog.getTo().forEach((sprintIdStr: string) => {
          const sprintId = parseInt(sprintIdStr);
          if (!isNaN(sprintId)) {
            sprintsIds.add(sprintId);
          }
        });
      }
    }

    return sprintsIds;
  }

  public getEstimation(): number {
    return this.props.estimation;
  }

  public isinSprintDelivery(sprint: Sprint): boolean {
    const sprintCompletedAt = sprint.getCompletedAt();
    const sprintEndeddAt = sprint.getEndedAt();

    const endDate = sprintCompletedAt || sprintEndeddAt;

    // Future sprint with no date set
    if (endDate === null) {
      return false;
    }

    const resolvedAt = this.props.resolvedAt;

    // Issue not resolved yet
    if (resolvedAt === null) {
      return false;
    }

    const sprintStartedAt = sprint.getStartedAt() as Date; // if endedAt is set, startedAt is also set

    return sprintStartedAt <= resolvedAt && resolvedAt <= endDate;
  }

  public isInSprintCommitment(sprint: Sprint): boolean {
    // Sprint is not started, so no commitment yet
    const sprintStartedAt = sprint.getStartedAt();
    if (sprintStartedAt === null) {
      return false;
    }

    const sprintsIdsFromChangelogs = this.getIssueSprintIdsBeforeSprintStart(sprintStartedAt);

    if (sprintsIdsFromChangelogs.includes(sprint.getId())) {
      return true;
    }

    // Issue was added to a sprint before it started
    // but not this one
    if (sprintsIdsFromChangelogs.length > 0) {
      return false;
    }

    // Note: this needs to happen after checking the changelogs
    // The issue might have been added to the sprint but does not belong to it anymore
    // but the changelog will still have a trace of it

    const issueSprintsIds = this.props.sprints.map((sprint: Sprint) => sprint.getId());

    // Issue does not currently belong to the sprint
    if (!issueSprintsIds.includes(sprint.getId())) {
      return false;
    }

    return this.props.createdAt <= sprintStartedAt;
  }

  private getIssueSprintIdsBeforeSprintStart(startedAt: Date) {
    let lastChangelog = null;
    for (const changelog of this.changelogs) {
      if (changelog.isSprintChangeLog()) {
        // Sprint change
        if (changelog.getChangedAt() > startedAt) {
          break;
        }
        lastChangelog = changelog;
      }
    }

    if (lastChangelog === null) {
      return [];
    }

    return lastChangelog.getTo().map((sprintId) => parseInt(sprintId));
  }

  public getStartedAt(): Date | null {
    let last: Date | null = null;
    for (const changelog of this.changelogs) {
      if (changelog.isStatusChangelog() && changelog.getFrom()[0] === Statuses.TODO && changelog.getTo()[0] === Statuses.IN_PROGRESS && (last === null || last < changelog.getChangedAt())) {
        last = changelog.getChangedAt();
      }
    }

    return last;
  }

  public getWorkDuration() {
    const startedAt = this.getStartedAt();
    const resolvedAt = this.props.resolvedAt;

    if (startedAt instanceof Date && resolvedAt instanceof Date) {
      return resolvedAt.getTime() - startedAt.getTime();
    }

    return null;
  }

  public getWorkDurationHours() {
    const duration = this.getWorkDuration();

    if (duration === null) {
      return null;
    }

    const durationHours = duration / 1000 / 60 / 60;
    return Math.round(durationHours * 100) / 100;
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

  public getLink() {
    return this.props.link;
  }

  public toRow(sprint: Sprint): Record<string, string | number | boolean> {
    const estimation = this.getEstimation();

    const isCommitted = this.isInSprintCommitment(sprint);
    const sprintCommittedStoryPoints = isCommitted ? estimation : 0;

    const isDelivered = this.isinSprintDelivery(sprint);
    const sprintDeliveredStoryPoint = isDelivered ? estimation : 0;
    const sprintName = sprint.getSprintName();
    const isActualSprint = sprint.isActualSprint();

    const toDate = (value: Date | null | undefined) => {
      if (!value) {
        return '';
      }

      return format(value, 'yyyy-MM-dd');
    };

    return {
      // ⚠️Do not change the order of the keys, this will break the pivot table & charts ⚠️
      id: this.props.id,
      type: this.getIssueType(),
      key: this.props.key,
      status: this.props.status,
      summary: this.props.summary,
      estimation,
      timeSpent: this.props.totalTimeSpent,
      reporter: this.props.reporter.name,
      assignee: this.props.assignee?.name ?? this.props.parent?.assignee?.name ?? '',
      createdAt: this.props.createdAt.toISOString(),
      resolvedAt: toDate(this.props.resolvedAt),
      priority: this.props.priority,
      epicKey: this.props.epic?.key ?? '',
      epicSummary: this.props.epic?.summary ?? '',
      link: this.props.link,
      sprintId: sprint.getId(),
      sprintName,
      sprintStartedAt: sprint.getStartedAt()?.toISOString() ?? '',
      sprintEndedAt: sprint.getEndedAt()?.toISOString() ?? '',
      sprintCompletedAt: sprint.getCompletedAt()?.toISOString() ?? '',
      isCommitted,
      isDelivered,
      sprintCommittedStoryPoints,
      sprintDeliveredStoryPoint,
      sprintGoal: sprint.getGoal(),
      startedAt: this.getStartedAt()?.toISOString() ?? '',
      workDurationMs: isDelivered ? this.getWorkDuration() ?? '' : '',
      workDurationHrs: isDelivered ? this.getWorkDurationHours() ?? '' : '',
      weekResolvedAt: this.props.resolvedAt ? format(this.props.resolvedAt, 'yyyy-ww') : '',
      supportDiscoveredBy: this.props.supportDiscoveredBy,
      supportResolutionType: this.props.supportResolutionType,
      isActualSprint,
    };
  }
}
