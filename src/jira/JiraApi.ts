import axios, { AxiosInstance } from 'axios';
import { JiraSprintDto, toSprint } from './JiraSprintDto';
import { JiraIssueChangelogDto, toIssueChangelog } from './JiraIssueChangelogDto';
import { Configuration } from '../Configuration';
import { JiraIssueDto, toIssue } from './JiraIssueDto';
import { Fields } from './Fields';
import { Sprint } from '../entities/Sprint';
import { Issue } from '../entities/Issue';
import { IssueChangelog } from '../entities/IssueChangelog';
import axiosRetry from 'axios-retry';
import * as console from 'console';

const MAX_RESULTS = 100;

export class JiraApi {
  private readonly axios: AxiosInstance;
  private readonly configuration: Configuration;

  constructor({ configuration }: { configuration: Configuration }) {
    this.configuration = configuration;

    this.axios = axios.create({
      baseURL: this.configuration.jira.origin,
      headers: {
        'Content-Type': 'application/json',
      },
      auth: {
        username: this.configuration.jira.username,
        password: this.configuration.jira.apiKey,
      },
      validateStatus: (status) => true,
      // timeout: 5000,
    });

    axiosRetry(this.axios, { retries: 3, retryDelay: axiosRetry.exponentialDelay });
  }

  public async listIssue({ startAt, maxResults }: { startAt: number; maxResults: number }): Promise<Issue[]> {
    const jql = `project = ${this.configuration.jira.projectKey} AND updated >= ${this.configuration.jira.resolvedIssuesFrom} AND issuetype in (${this.configuration.jira.issueTypes}) order by created DESC`;

    const response = await this.axios.request<{ issues: JiraIssueDto[] }>({
      method: 'POST',
      url: '/rest/api/3/search',
      data: {
        jql: jql,
        startAt,
        maxResults: Math.min(maxResults, MAX_RESULTS),
        fields: this.getIssueFields(),
        // fields: ['*all'],
      },
    });

    return response.data.issues.map((issue) => toIssue(issue, this.configuration.jira.origin));
  }

  private getIssueFields() {
    return [
      Fields.AGGREGATE_TIME_SPENT,
      Fields.ASSIGNEE,
      Fields.CREATED,
      Fields.CREATOR,
      Fields.ESTIMATION,
      Fields.ISSUE_TYPE,
      Fields.KEY,
      Fields.PARENT,
      Fields.PRIORITY,
      Fields.PRODUCT,
      Fields.REPORTER,
      Fields.RESOLUTION,
      Fields.RESOLUTION_DATE,
      Fields.SPRINTS,
      Fields.STATUS,
      Fields.STATUS_CATEGORY_CHANGEDATE,
      Fields.SUMMARY,
      Fields.SUPPORT_DISCOVERED_BY,
      Fields.SUPPORT_RESOLUTION_TYPE,
      Fields.SUPPORT_ROOT_CAUSE,
    ];
  }

  public async listSprints({ startAt, maxResults }: { startAt: number; maxResults: number }): Promise<Sprint[]> {
    const response = await this.axios.request<{ values: JiraSprintDto[] }>({
      method: 'GET',
      url: `/rest/agile/1.0/board/${this.configuration.jira.boardId}/sprint`,
      params: {
        startAt,
        maxResults: Math.min(maxResults, MAX_RESULTS),
      },
    });

    return response.data.values.map(toSprint).filter((sprint: Sprint) => {
      const startDate = sprint.getStartedAt();
      if (null === startDate) {
        return true;
      }

      return startDate >= new Date(this.configuration.jira.sprintStartedAtFrom);
    });
  }
  public async getIssueChangelogs(issueIdOrKey: string | number, { startAt, maxResults }: { startAt: number; maxResults: number }): Promise<IssueChangelog[]> {
    const response = await this.axios.request<{
      values: JiraIssueChangelogDto[];
    }>({
      method: 'GET',
      url: `/rest/api/2/issue/${issueIdOrKey}/changelog`,
      params: {
        startAt,
        maxResults: Math.min(maxResults, MAX_RESULTS),
      },
    });

    return response.data.values.map(toIssueChangelog);
  }

  public async getIssue(issueIdOrKey: string | number) {
    const response = await this.axios.request<JiraIssueDto>({
      method: 'GET',
      url: `/rest/api/3/issue/${issueIdOrKey}`,
      params: {
        fields: this.getIssueFields().join(','),
      },
    });

    return toIssue(response.data, this.configuration.jira.origin);
  }

  public async findFields() {
    const response = await this.axios.request<{ id: string; name: string; key: string }[]>({
      method: 'GET',
      url: `/rest/api/3/field`,
    });

    if (response.status !== 200) {
      console.error(response.data);
      throw new Error(`Failed to fetch fields: ${response.status} ${response.statusText}`);
    }

    return response.data.map((field) => ({
      id: field.id,
      name: field.name,
      key: field.key,
    }));
  }
}
