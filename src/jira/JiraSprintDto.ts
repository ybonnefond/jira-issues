import { Sprint } from "../entities/Sprint";

export type JiraSprintState = "future" | "active" | "closed";

export interface JiraSprintDto {
  id: number;
  state: JiraSprintState;
  name: string;
  startDate?: string; // ISO date
  endDate?: string; // ISO date
  completeDate?: string; // ISO date
  originBoardId: number;
  goal: string;
}

export function toSprint(jira: JiraSprintDto): Sprint {
  return new Sprint({
    id: jira.id,
    state: jira.state,
    name: jira.name,
    goal: jira.goal,
    originBoardId: jira.originBoardId,
    startedAt: jira.startDate ? new Date(jira.startDate) : null,
    endedAt: jira.endDate ? new Date(jira.endDate) : null,
    completedAt: jira.completeDate ? new Date(jira.completeDate) : null,
  });
}
