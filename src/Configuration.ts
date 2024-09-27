import { join, resolve } from 'path';

import dotenv from 'dotenv';
import * as envVar from 'env-var';
import { Sprints } from './Sprints';
import { parse } from 'date-fns';
import { Columns } from './Columns';
import { Statuses } from './jira/Statuses';
import { StatusMap } from './StatusMap';

export class Configuration {
  public readonly root: string;
  public readonly output: string;
  public deliveredStatuses: string[];
  public sprints: Sprints;
  public columns: Columns[];
  public supportProductDefault: string;

  public readonly jira: {
    origin: string;
    username: string;
    apiKey: string;
    boardIds: string[];
    projectKey: string;
    resolvedIssuesFrom: string;
    sprintStartedAtFrom: string;
    issueTypes: string;
    batchSize: number;
  };

  public readonly statusMap: StatusMap;

  constructor(envValues: NodeJS.ProcessEnv = process.env) {
    const env = envVar.from(envValues);

    this.root = env.get('ROOT').required().asString();
    const output = env.get('OUTPUT').default('output').asString();
    this.output = output[0] === '/' ? output : join(this.root, output);
    this.columns = env.get('OUTPUT_COLUMNS').required().asArray(',') as Columns[];
    this.supportProductDefault = env.get('SUPPORT_PRODUCT_DEFAULT').required().asString();

    const sprintDuration = env.get('SPRINT_DURATION').required().asIntPositive();
    const sprintNumber = env.get('SPRINT_NUMBER').required().asIntPositive();
    const sprintFirstDay = env.get('SPRINT_FIRST_DAY').required().asString();

    this.sprints = Sprints.fromAnySprint({
      sprintDuration,
      sprintNumber,
      sprintFirstDay: parse(sprintFirstDay, 'yyyy-MM-dd', new Date()),
    });

    const projectKey = env.get('JIRA_PROJECT_KEY').required().asString();
    const resolvedIssuesFrom = env.get('JIRA_RESOLVED_ISSUES_FROM').required().asString();
    const issueTypes = env.get('JIRA_ISSUE_TYPES').required().asString();
    const deliveredStatuses = env.get('JIRA_DELIVERED_STATUSES').required().asString();

    this.deliveredStatuses = deliveredStatuses.split(',').map((status) => status.toLowerCase());

    this.jira = {
      origin: env.get('JIRA_ORIGIN').default('https://voodooio.atlassian.net').asString(),
      username: env.get('JIRA_USERNAME').required().asString(),
      apiKey: env.get('JIRA_API_KEY').required().asString(),
      boardIds: env.get('JIRA_BOARD_IDS').required().asString().split(','),
      projectKey,
      resolvedIssuesFrom,
      issueTypes,
      sprintStartedAtFrom: env.get('JIRA_SPRINT_START_DATE').required().asString(),
      batchSize: 100,
    };

    this.statusMap = {
      [Statuses.TODO]: env.get('STATUS_TODO').required().asArray(',') as string[],
      [Statuses.IN_PROGRESS]: env.get('STATUS_IN_PROGRESS').required().asArray(',') as string[],
      [Statuses.HOLD]: env.get('STATUS_HOLD').required().asArray(',') as string[],
      [Statuses.QA]: env.get('STATUS_QA').required().asArray(',') as string[],
    };
  }

  public static fromEnv(): Configuration {
    const ROOT = resolve(join(__dirname, '..'));
    process.env.ROOT = ROOT;
    dotenv.config({ path: join(ROOT, '.env') });
    return new Configuration(process.env);
  }
}
