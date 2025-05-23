import { Seniority } from './entities/Seniority';
import { UserRole } from './entities/UserRole';
import { Columns } from './Columns';

export type ConfigUser = {
  name: string;
  githubHandle: string;
  jiraHandle: string;
  seniority: Seniority;
  role: UserRole;
};

export type ConfigOutput = {
  issues: {
    columns: Columns[];
  };
};

export type ConfigJira = {
  projects: { key: string; boardId: string }[];
  resolvedIssueFrom: string;
  issueTypes: string[];

  /**
   * The following info will be used to calculate the sprints numbers
   * Indicate any sprint number and its first day
   */
  sprints: {
    // Duration in days
    duration: 14;
    initialSprint: {
      // Initial sprint first date, format: yyyy-MM-dd, ex: 2024-01-01
      startDate: string;
      // Initial sprint number
      number: number;
    };
  };

  issues: {
    // Issues statuses that are considered delivered
    deliveredStatuses: string[];
    // Issue Statuses Mapping
    statusMapping: {
      TODO: string[];
      IN_PROGRESS: string[];
      QA: string[];
      HOLD: string[];
      DONE: string[];
    };
    //Issue type Mapping
    typeMapping: {
      [key: string]: string[];
    };
    incidents: {
      // Product to fallback on incident when empty
      defaultProduct: string;
    };
  };
};

export type ConfigJson = {
  users: ConfigUser[];
  output: ConfigOutput;
  jira: ConfigJira;
  github: {
    organization: string;
    repositories: string[];
    pullRequests: {
      closedFrom: string;
    };
  };
  google: {
    spreadsheet: {
      id: string;
      epicSheet: string;
      issuesSheet: string;
    };
  };
};
