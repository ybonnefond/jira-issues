import { startOfDay, subDays, addDays, parse, format, toDate } from 'date-fns';

export type SprintInfo = {
  id: string;
  label: string;
  num: number;
  start: Date;
  // Strictly lower than
  end: Date;
};

export class Sprints {
  private readonly sprints = new Map<string, SprintInfo>();
  private days = new Map<string, SprintInfo>();

  constructor(private readonly config: { firstDay: Date; durationDays: number }) {
    const endDate = parse(`${new Date().getFullYear() + 1}-01-01`, 'yyyy-MM-dd', new Date());

    let currentDay = startOfDay(this.config.firstDay);
    let currentSprint = 1;
    let currentDaysOfSprint = 1;
    let start = currentDay;
    let end = addDays(currentDay, this.config.durationDays);

    while (currentDay < endDate) {
      const numLabel = String(currentSprint).padStart(2, '0');
      const sprint: SprintInfo = {
        id: `sprint-${numLabel}`,
        label: `Sprint ${numLabel}`,
        num: currentSprint,
        start,
        end,
      };

      this.sprints.set(sprint.id, sprint);
      this.days.set(this.getDayKey(currentDay), sprint);

      if (currentDaysOfSprint === this.config.durationDays) {
        currentSprint += 1;
        start = addDays(start, this.config.durationDays);
        end = addDays(start, this.config.durationDays);
      }

      currentDaysOfSprint = currentDaysOfSprint < this.config.durationDays ? currentDaysOfSprint + 1 : 1;
      currentDay = addDays(currentDay, 1);
    }
  }

  private getDayKey(date: Date): string {
    return format(date, 'yyyy-MM-dd');
  }

  public findSprint(date: Date | null): SprintInfo | null {
    if (date === null) {
      return null;
    }

    const key = this.getDayKey(date);
    const sprint = this.days.get(key);

    return sprint ?? null;
  }

  public static fromAnySprint({ sprintNumber, sprintDuration, sprintFirstDay }: { sprintDuration: number; sprintNumber: number; sprintFirstDay: Date }): Sprints {
    // Calculate the total days from the start of the first sprint to the start of the current sprint
    const daysFromFirstSprint = (sprintNumber - 1) * sprintDuration;

    // Calculate the first day of the first sprint
    const firstDayOfFirstSprint = subDays(sprintFirstDay, daysFromFirstSprint);

    return new Sprints({
      durationDays: sprintDuration,
      firstDay: startOfDay(firstDayOfFirstSprint),
    });
  }
}
