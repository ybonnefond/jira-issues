import fs from 'fs';
import { join, resolve } from 'path';

import dotenv from 'dotenv';
import * as envVar from 'env-var';

export class Configuration {
  public readonly root: string;
  public readonly output: string;
  public deliveredStatuses: string[];

  public readonly jira: {
    origin: string;
    username: string;
    apiKey: string;
    boardId: number;
    projectKey: string;
    resolvedIssuesFrom: string;
    sprintStartedAtFrom: string;
    issueTypes: string;
    batchSize: number;
    issueJql: string;
  };
  constructor(envValues: NodeJS.ProcessEnv = process.env) {
    const env = envVar.from(envValues);

    this.root = env.get('ROOT').required().asString();
    const output = env.get('OUTPUT').default('output').asString();
    this.output = output[0] === '/' ? output : join(this.root, output);

    const projectKey = env.get('JIRA_PROJECT_KEY').required().asString();
    const resolvedIssuesFrom = env.get('JIRA_RESOLVED_ISSUES_FROM').required().asString();
    const issueTypes = env.get('JIRA_ISSUE_TYPES').required().asString();
    const deliveredStatuses = env.get('JIRA_DELIVERED_STATUSES').required().asString();

    this.deliveredStatuses = deliveredStatuses.split(',').map((status) => status.toLowerCase());

    this.jira = {
      origin: env.get('JIRA_ORIGIN').default('https://voodooio.atlassian.net').asString(),
      username: env.get('JIRA_USERNAME').required().asString(),
      apiKey: env.get('JIRA_API_KEY').required().asString(),
      boardId: env.get('JIRA_BOARD_ID').required().asInt(),
      projectKey,
      resolvedIssuesFrom,
      issueTypes,
      sprintStartedAtFrom: env.get('JIRA_SPRINT_START_DATE').required().asString(),
      batchSize: 100,
      issueJql: `project = ${projectKey} AND updated >= ${resolvedIssuesFrom} AND issuetype in (${issueTypes}) order by created DESC`,
    };
  }

  public static fromEnv(): Configuration {
    const ROOT = resolve(join(__dirname, '..'));
    process.env.ROOT = ROOT;
    dotenv.config({ path: join(ROOT, '.env') });
    return new Configuration(process.env);
  }
}
