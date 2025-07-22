import { Changelog } from './Changelog';
import { Statuses } from '../jira/Statuses';
import { StatusMap } from '../StatusMap';
import { TimeUtil } from '../TimeUtil';

export type StatusDurations = {
  [Statuses.TODO]: { milliseconds: number; businessMilliseconds: number };
  [Statuses.IN_PROGRESS]: { milliseconds: number; businessMilliseconds: number };
  [Statuses.HOLD]: { milliseconds: number; businessMilliseconds: number };
  [Statuses.QA]: { milliseconds: number; businessMilliseconds: number };
};

export class Changelogs {
  private readonly changelogs: Changelog[];
  private readonly durations: StatusDurations;
  private readonly statusMap: StatusMap;
  private readonly startedAt: Date | null = null;
  private readonly createdAt: Date;

  constructor({ changelogs, statusMap, createdAt }: { changelogs: Changelog[]; statusMap: StatusMap; createdAt: Date }) {
    this.changelogs = changelogs.toSorted((a, b) => a.getChangedAt().getTime() - b.getChangedAt().getTime());
    this.statusMap = statusMap;

    this.createdAt = createdAt;
    this.startedAt = this.computeStartedAt();
    this.durations = this.computeStatusDurations();
  }

  public getStartedAt(): Date | null {
    return this.startedAt;
  }

  public getDurations(): StatusDurations {
    return this.durations;
  }

  private computeStatusDurations(): StatusDurations {
    const durations = {
      [Statuses.TODO]: { milliseconds: 0, businessMilliseconds: 0 },
      [Statuses.IN_PROGRESS]: { milliseconds: 0, businessMilliseconds: 0 },
      [Statuses.HOLD]: { milliseconds: 0, businessMilliseconds: 0 },
      [Statuses.QA]: { milliseconds: 0, businessMilliseconds: 0 },
      [Statuses.DONE]: { milliseconds: 0, businessMilliseconds: 0 },
    };

    // Initialize currentStatus and lastChangeTime
    let currentStatus: keyof StatusMap = Statuses.TODO;
    let lastChangeTime: Date | null = this.createdAt;

    // Iterate over the sorted changelogs
    for (const changelog of this.changelogs) {
      if (changelog.isStatusChangelog()) {
        const fromStatusNormalized = changelog.getFromStringNormalized();
        const toStatusNormalized = changelog.getToStringNormalized();
        const changedAt = changelog.getChangedAt();

        // Map the normalized status strings to status keys
        const fromStatus = this.findStatusKeyByNormalizedValue(fromStatusNormalized);
        const toStatus = this.findStatusKeyByNormalizedValue(toStatusNormalized);

        // Set initial currentStatus if not already set
        if (currentStatus === null) {
          if (fromStatus !== null) {
            currentStatus = fromStatus;
          } else if (toStatus !== null) {
            currentStatus = toStatus;
          }
        }

        // Update the duration for the current status
        if (currentStatus !== null && lastChangeTime !== null) {
          const duration = changedAt.getTime() - lastChangeTime.getTime();
          const businessDuration = TimeUtil.getBusinessDurationMs({ start: lastChangeTime, end: changedAt });
          durations[currentStatus].milliseconds += duration;
          durations[currentStatus].businessMilliseconds += businessDuration;
        }

        // Update currentStatus and lastChangeTime for the next iteration
        if (toStatus !== null) {
          currentStatus = toStatus;
        }
        lastChangeTime = changedAt;
      }
    }

    // Handle the duration from the last changelog to the issue end date or current time
    const issueEndDate = new Date(); // Replace with actual issue end date if available
    if (currentStatus !== null && lastChangeTime !== null) {
      const duration = issueEndDate.getTime() - lastChangeTime.getTime();
      const businessDuration = TimeUtil.getBusinessDurationMs({ start: lastChangeTime, end: issueEndDate });
      durations[currentStatus].milliseconds += duration;
      durations[currentStatus].businessMilliseconds += businessDuration;
    }

    // Return the durations map with time spent in each status in milliseconds
    return durations;
  }

  private findStatusKeyByNormalizedValue(normalizedStatus: string | null): keyof StatusMap | null {
    if (normalizedStatus === null) {
      return null;
    }

    for (const statusKey in this.statusMap) {
      const normalizedValues = this.statusMap[statusKey as keyof StatusMap];
      if (normalizedValues.includes(normalizedStatus)) {
        return statusKey as keyof StatusMap;
      }
    }
    return null;
  }

  private computeStartedAt(): Date | null {
    let last: Date | null = null;
    for (const changelog of this.changelogs) {
      if (!changelog.isStatusChangelog()) {
        continue;
      }

      const from = changelog.getFromStringNormalized();
      const to = changelog.getToStringNormalized();

      const fromStatuses = [...this.statusMap[Statuses.TODO], ...this.statusMap[Statuses.HOLD]];

      const isChangingToInProgress = to === Statuses.IN_PROGRESS && fromStatuses.includes((from ?? '') as Statuses);
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
}
