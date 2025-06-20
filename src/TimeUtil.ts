import { addDays, endOfDay, format, isWeekend, startOfDay } from 'date-fns';

export const ONE_HOUR = 60 * 60 * 1000;
export const SIX_HOURS = 6 * ONE_HOUR;
export const WORK_START_HOUR = 9; // 9 AM
export const WORK_END_HOUR = 18; // 6 PM

// 8 hours per day, accounting for a 1-hour lunch break
export const WORK_DAY_HOURS = (WORK_END_HOUR - WORK_START_HOUR) * ONE_HOUR - ONE_HOUR;
export const DAY_HOURS = 24 * ONE_HOUR;

export class TimeUtil {
  public static getBusinessDurationMs({ start, end }: { start: Date; end: Date }): number {
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

  public static toDate(value: Date | null | undefined, returnNull: boolean = false) {
    if (!value) {
      return returnNull ? null : '';
    }

    return format(value, 'yyyy-MM-dd');
  }

  public static toWeekOfYear(date: Date | null) {
    if (date === null) {
      return null;
    }

    return `W${format(date, 'yyyy-ww')}`;
  }

  public static toMonthOfYear(date: Date | null) {
    if (date === null) {
      return null;
    }

    return `M${format(date, 'yyyy-MM')}`;
  }

  public static toQuarterOfYear(date: Date | null) {
    if (date === null) {
      return null;
    }

    return `Q${format(date, 'yyyy-QQQ')}`;
  }

  public static toSemesterOfYear(date: Date | null) {
    if (date === null) {
      return null;
    }
    const year = format(date, 'yyyy');
    const month = date.getMonth(); // 0-based: Jan = 0, Dec = 11
    const semester = month < 6 ? '1' : '2';

    return `S${year}-${semester}`;
  }

  public static toDurationInRoundedDays24h(durationMs: number | null, { roundToHalfDay }: { roundToHalfDay: boolean } = { roundToHalfDay: true }): number | null {
    return this.toDurationInRoundedDays(durationMs, { hoursInADay: DAY_HOURS, roundToHalfDay });
  }

  public static toDurationInRoundedDaysBusinessHours(durationMs: number | null, { roundToHalfDay }: { roundToHalfDay: boolean } = { roundToHalfDay: true }): number | null {
    return this.toDurationInRoundedDays(durationMs, { hoursInADay: WORK_DAY_HOURS, roundToHalfDay });
  }

  private static toDurationInRoundedDays(durationMs: number | null, { hoursInADay, roundToHalfDay }: { hoursInADay: number; roundToHalfDay: boolean }): number | null {
    if (durationMs === null) {
      return null;
    }

    const durationDays = durationMs / hoursInADay;
    if (roundToHalfDay) {
      // Calculate total workdays rounded to the nearest half-day
      const duration = Math.round(durationDays * 2) / 2; // Round to nearest half-day

      if (duration === 0 && durationMs > 0) {
        return 0.5;
      }

      return duration;
    }

    // round to 0.1 day
    return Math.round(durationDays * 100) / 100;
  }

  public static toDurationInSeconds(durationMs: number | null): number | null {
    if (durationMs === null) {
      return null;
    }

    return Math.round(durationMs / 1000);
  }

  public static toDurationInHours(durationMs: number | null, { roundToHalfHour }: { roundToHalfHour?: boolean } = {}): number | null {
    if (durationMs === null) {
      return null;
    }

    const durationHours = durationMs / ONE_HOUR;

    if (roundToHalfHour === true) {
      const duration = Math.round(durationHours * 2) / 2; // Round to nearest half-hour

      if (duration === 0 && durationMs > 0) {
        return 0.5;
      }

      return duration;
    }

    return Math.round(durationHours * 10) / 10; // round to 0.1 hour
  }
}
