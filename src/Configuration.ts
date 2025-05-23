import { join, resolve } from 'path';

import dotenv from 'dotenv';
import * as envVar from 'env-var';
import JSON5 from 'json5';

import { Sprints } from './Sprints';
import { parse } from 'date-fns';
import { Columns } from './Columns';
import { Statuses } from './jira/Statuses';
import { StatusMap } from './StatusMap';
import { Users } from './entities/Users';
import { User } from './entities/User';
import { parseUserRole } from './entities/UserRole';
import { parseSeniority } from './entities/Seniority';
import { IssueTypeMapper } from './IssueTypeMapper';
import { readFileSync } from 'fs';
import { ConfigJson, ConfigUser } from './ConfigJson';

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
    const rawConfig = readFileSync(resolve(__dirname, '..', 'config.json5'), 'utf-8');
    const configJson = JSON5.parse<ConfigJson>(rawConfig);

    const env = envVar.from(envValues);

    this.root = env.get('ROOT').required().asString();
    const output = env.get('OUTPUT').default('output').asString();
    this.output = output[0] === '/' ? output : join(this.root, output);
    this.columns = configJson.output.issues.columns;
    this.supportProductDefault = configJson.jira.issues.incidents.defaultProduct;

    const sprintDuration = configJson.jira.sprints.duration;
    const sprintNumber = configJson.jira.sprints.initialSprint.number;
    const sprintFirstDay = configJson.jira.sprints.initialSprint.startDate;

    this.sprints = Sprints.fromAnySprint({
      sprintDuration,
      sprintNumber,
      sprintFirstDay: parse(sprintFirstDay, 'yyyy-MM-dd', new Date()),
    });

    // const projectKey = env.get('JIRA_PROJECT_KEY').required().asString();
    // const resolvedIssuesFrom = env.get('JIRA_RESOLVED_ISSUES_FROM').required().asString();
    // const issueTypes = env.get('JIRA_ISSUE_TYPES').required().asString();
    // const deliveredStatuses = env.get('JIRA_DELIVERED_STATUSES').required().asString();

    this.deliveredStatuses = configJson.jira.issues.deliveredStatuses.map((status) => status.toLowerCase());

    this.jira = {
      origin: env.get('JIRA_ORIGIN').default('https://voodooio.atlassian.net').asString(),
      username: env.get('JIRA_USERNAME').required().asString(),
      apiKey: env.get('JIRA_API_KEY').required().asString(),
      boardIds: configJson.jira.projects.map(({ boardId }) => boardId),
      projectKey: configJson.jira.projects.map(({ key }) => key).join(','),
      resolvedIssuesFrom: configJson.jira.resolvedIssueFrom,
      issueTypes: configJson.jira.issueTypes.join(','),
      batchSize: 100,
    };

    this.github = {
      origin: env.get('GITHUB_ORIGIN').default('https://api.github.com').asString(),
      token: env.get('GITHUB_TOKEN').required().asString(),
      organization: configJson.github.organization,
      authors: new Authors(configJson.users.map((user: ConfigUser) => ({ handle: user.githubHandle, name: user.name }))),
      prClosedFrom: parse(configJson.github.pullRequests.closedFrom, 'yyyy-MM-dd', new Date()),
      repositories: configJson.github.repositories,
      batchSize: 100,
    };

    this.statusMap = {
      [Statuses.TODO]: configJson.jira.issues.statusMapping.TODO,
      [Statuses.IN_PROGRESS]: configJson.jira.issues.statusMapping.IN_PROGRESS,
      [Statuses.HOLD]: configJson.jira.issues.statusMapping.HOLD,
      [Statuses.QA]: configJson.jira.issues.statusMapping.QA,
      [Statuses.DONE]: configJson.jira.issues.statusMapping.DONE,
    };

    this.issueTypeMapper = new IssueTypeMapper(configJson.jira.issues.typeMapping);

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

export class Authors {
  constructor(private readonly authors: GithubAuthor[]) {}

  public findAuthorNameByGithubHandle(handle: string): string | null {
    const author = this.authors.find((author) => author.handle === handle);
    return author ? author.name : null;
  }
}
