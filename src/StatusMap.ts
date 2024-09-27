import { Statuses } from './jira/Statuses';

export type StatusMap = {
  [Statuses.TODO]: string[];
  [Statuses.IN_PROGRESS]: string[];
  [Statuses.HOLD]: string[];
  [Statuses.QA]: string[];
};
