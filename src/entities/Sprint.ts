import { JiraSprintState } from '../jira/JiraSprintDto';

export type SprintProps = {
  id: number;
  state: JiraSprintState;
  name: string;
  startedAt: Date | null; // ISO date
  endedAt: Date | null; // ISO date
  completedAt: Date | null; // ISO date
  originBoardId: number;
  goal: string;
};

export class Sprint {
  constructor(private readonly props: SprintProps) {}

  public getId() {
    return this.props.id;
  }

  public getStartedAt() {
    return this.props.startedAt;
  }

  public getEndedAt() {
    return this.props.endedAt;
  }

  public getCompletedAt() {
    return this.props.completedAt;
  }

  public getGoal() {
    return this.props.goal;
  }

  public getOriginalSprintName() {
    return this.props.name;
  }

  public getSprintName() {
    const regex = /Sprint (\d+)(.*)/i; // Regular expression to match "Sprint " followed by a number
    const match = this.props.name.match(regex);

    if (match) {
      return `Sprint ${match[1].padStart(2, '0')}`; // Return the matched string
    } else {
      return this.props.name; // Return the original string if no match is found
    }
  }

  public isActualSprint() {
    const name = this.getSprintName();
    return name.startsWith('Sprint ');
  }
}
