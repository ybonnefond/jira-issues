import { Sprints, SprintInfo } from './Sprints';
import { parseISO, startOfDay, subDays } from 'date-fns';

describe('SprintCalculator', () => {
  const SPRINT_DURATION = 14;

  describe('findSprint', () => {
    const calculator = new Sprints({
      firstDay: parseISO('2023-04-13'),
      durationDays: 14,
    });

    describe.each([['2024-09-14', 38]])('Given date is %s', (dateStr, sprintNumber) => {
      it(`sprint number should be ${sprintNumber}`, () => {
        const sprint = calculator.findSprint(parseISO(dateStr));
        assertIsNotNull(sprint);

        expect(sprint.num).toBe(sprintNumber);
      });
    });
  });

  describe('getFirstDayOfFirstSprint', () => {
    describe('Given first day of first sprint', () => {
      it('should return same date', () => {
        const date = parseISO('2024-01-01');

        const firstDayOFirstSprint = Sprints.getFirstDayOfFirstSprint({
          sprintDuration: SPRINT_DURATION,
          currentSprint: 1,
          firstDayOfCurrentSprint: date,
        });

        expect(firstDayOFirstSprint).toEqual(date);
      });
    });

    describe('Given first day of second sprint', () => {
      it('should return same date', () => {
        const date = parseISO('2024-09-12');

        const firstDayOFirstSprint = Sprints.getFirstDayOfFirstSprint({
          sprintDuration: SPRINT_DURATION,
          currentSprint: 2,
          firstDayOfCurrentSprint: date,
        });

        expect(firstDayOFirstSprint).toEqual(parseISO('2024-08-29'));
      });
    });

    describe('Given first day of 38th sprint', () => {
      it('should return same date', () => {
        const date = parseISO('2024-09-12');

        const firstDayOFirstSprint = Sprints.getFirstDayOfFirstSprint({
          sprintDuration: SPRINT_DURATION,
          currentSprint: 38,
          firstDayOfCurrentSprint: date,
        });

        expect(firstDayOFirstSprint).toEqual(parseISO('2023-04-13'));
      });
    });
  });

  function assertIsNotNull(sprint: SprintInfo | null): asserts sprint is SprintInfo {
    expect(sprint).not.toBe(null);
  }
});
