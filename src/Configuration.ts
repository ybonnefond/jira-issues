import { join, resolve } from 'path';

import dotenv from 'dotenv';
import * as envVar from 'env-var';
import { Sprints } from './Sprints';
import { parse } from 'date-fns';
import { Columns } from './Columns';
import { Statuses } from './jira/Statuses';
import { StatusMap } from './StatusMap';
import configJson from '../config.json';
import { Users } from './entities/Users';
import { User } from './entities/User';
import { parseUserRole } from './entities/UserRole';
import { parseSeniority } from './entities/Seniority';
import { IssueTypeMapper } from './IssueTypeMapper';

export type GithubAuthor = { handle: string; name: string };

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
    issueTypes: string;
    batchSize: number;
  };

  public readonly github: {
    origin: string;
    token: string;
    organization: string;
    authors: Authors;
    repositories: string[];
    prClosedFrom: Date;
    batchSize: number;
  };

  public readonly statusMap: StatusMap;
  public readonly issueTypeMapper: IssueTypeMapper;

  public readonly users: Users;

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
      batchSize: 100,
    };

    this.github = {
      origin: env.get('GITHUB_ORIGIN').default('https://api.github.com').asString(),
      token: env.get('GITHUB_TOKEN').required().asString(),
      organization: env.get('GITHUB_ORGANIZATION').required().asString(),
      authors: new Authors((env.get('GITHUB_AUTHORS').required().asArray(',') as string[]).map(parseAuthor)),
      prClosedFrom: parse(env.get('GITHUB_PR_CLOSED_FROM').required().asString(), 'yyyy-MM-dd', new Date()),
      repositories: env.get('GITHUB_REPOSITORIES').required().asArray(',') as string[],
      batchSize: 100,
    };

    this.statusMap = {
      [Statuses.TODO]: env.get('STATUS_TODO').required().asArray(',') as string[],
      [Statuses.IN_PROGRESS]: env.get('STATUS_IN_PROGRESS').required().asArray(',') as string[],
      [Statuses.HOLD]: env.get('STATUS_HOLD').required().asArray(',') as string[],
      [Statuses.QA]: env.get('STATUS_QA').required().asArray(',') as string[],
      [Statuses.DONE]: env.get('STATUS_DONE').required().asArray(',') as string[],
    };

    this.issueTypeMapper = IssueTypeMapper.fromString(env.get('ISSUE_TYPES').required().asString());

    this.users = new Users(
      configJson.users.map((userData) => {
        return new User({
          name: userData.name,
          githubHandle: userData.githubHandle,
          jiraHandle: userData.jiraHandle,
          role: parseUserRole(userData.role),
          seniority: parseSeniority(userData.seniority),
        });
      }),
    );
  }

  public static fromEnv(): Configuration {
    const ROOT = resolve(join(__dirname, '..'));
    process.env.ROOT = ROOT;
    dotenv.config({ path: join(ROOT, '.env') });
    return new Configuration(process.env);
  }
}

function parseAuthor(author: string) {
  const regex = /^([^()]+)\(([^)]+)\)$/;
  const match = author.match(regex);

  if (!match) {
    throw new Error(`Invalid author format: ${author}`);
  }

  return { handle: match[1], name: match[2] };
}

export class Authors {
  constructor(private readonly authors: GithubAuthor[]) {}

  public findAuthorNameByGithubHandle(handle: string): string | null {
    const author = this.authors.find((author) => author.handle === handle);
    return author ? author.name : null;
  }
}
