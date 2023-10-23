import { Sprint } from './Sprint';
import { IssueChangelog } from './IssueChangelog';

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

  public toRow(sprint: Sprint): Record<string, string | number | boolean> {
    const estimation = this.getEstimation();

    const isCommitted = this.isInSprintCommitment(sprint);
    const sprintCommittedStoryPoints = isCommitted ? estimation : 0;

    const isDelivered = this.isinSprintDelivery(sprint);
    const sprintDeliveredStoryPoint = isDelivered ? estimation : 0;

    return {
      // ⚠️Do not change the order of the keys, this will break the pivot table & charts ⚠️
      id: this.props.id,
      type: this.props.type,
      key: this.props.key,
      status: this.props.status,
      summary: this.props.summary,
      estimation,
      timeSpent: this.props.totalTimeSpent,
      reporter: this.props.reporter.name,
      assignee: this.props.assignee?.name ?? '',
      createdAt: this.props.createdAt.toISOString(),
      resolvedAt: this.props.resolvedAt?.toISOString() ?? '',
      priority: this.props.priority,
      epicKey: this.props.epic?.key ?? '',
      epicSummary: this.props.epic?.summary ?? '',
      link: this.props.link,
      sprintId: sprint.getId(),
      sprintName: sprint.getSprintName(),
      sprintStartedAt: sprint.getStartedAt()?.toISOString() ?? '',
      sprintEndedAt: sprint.getEndedAt()?.toISOString() ?? '',
      sprintCompletedAt: sprint.getCompletedAt()?.toISOString() ?? '',
      isCommitted,
      isDelivered,
      sprintCommittedStoryPoints,
      sprintDeliveredStoryPoint,
      sprintGoal: sprint.getGoal(),
    };
  }
}
