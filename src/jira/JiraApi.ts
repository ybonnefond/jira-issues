import axios, { AxiosInstance } from 'axios';
import { JiraIssueChangelogDto, toIssueChangelog } from './JiraIssueChangelogDto';
import { Configuration } from '../Configuration';
import { JiraIssueDto } from './JiraIssueDto';
import { Fields } from './Fields';
import { Issue } from '../entities/Issue';
import { Changelog } from '../entities/Changelog';
import axiosRetry from 'axios-retry';
import * as console from 'console';
import { JiraIssueMapper } from './JiraIssueMapper';

const MAX_RESULTS = 100;

export class JiraApi {
  private readonly axios: AxiosInstance;
  private readonly configuration: Configuration;
  private readonly issueMapper: JiraIssueMapper;

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
    this.issueMapper = new JiraIssueMapper({ configuration: this.configuration });
  }

  public async listIssue({ startAt, maxResults }: { startAt: number; maxResults: number }): Promise<Issue[]> {
    const jql = `project IN (${this.configuration.jira.projectKey.split(',')}) AND updated >= ${this.configuration.jira.resolvedIssuesFrom} AND issuetype in (${this.configuration.jira.issueTypes}) order by created DESC`;

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

    const issues = [];

    for (const jiraIssueDto of response.data.issues) {
      const issue = this.issueMapper.toIssue(jiraIssueDto);

      if (issue !== null) {
        issues.push(issue);
      }
    }

    return issues;
  }

  public async listEpics({ startAt, maxResults }: { startAt: number; maxResults: number }): Promise<Issue[]> {
    const jql = `project IN (${this.configuration.jira.projectKey.split(',')}) AND updated >= ${this.configuration.jira.resolvedIssuesFrom} AND issuetype in (Epic) order by created DESC`;

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

    const issues = [];

    for (const jiraIssueDto of response.data.issues) {
      const issue = this.issueMapper.toIssue(jiraIssueDto);

      if (issue !== null) {
        issues.push(issue);
      }
    }

    return issues;
  }

  private getIssueFields() {
    return [
      Fields.PROJECT,
      Fields.AGGREGATE_TIME_SPENT,
      Fields.ASSIGNEE,
      Fields.CREATED,
      Fields.CREATOR,
      Fields.ESTIMATION,
      Fields.ISSUE_TYPE,
      Fields.KEY,
      Fields.PARENT,
      Fields.PRIORITY,
      Fields.PRODUCT_01,
      Fields.PRODUCT_02,
      Fields.PRODUCT_03,
      Fields.PRODUCT_04,
      Fields.PRODUCT_05,
      Fields.PRODUCT_06,
      Fields.PRODUCT_07,
      Fields.REPORTER,
      Fields.RESOLUTION,
      Fields.RESOLUTION_DATE,
      Fields.SPRINTS,
      Fields.STATUS,
      Fields.STATUS_CATEGORY_CHANGEDATE,
      Fields.SUMMARY,
      Fields.SUPPORT_DISCOVERED_BY,
      Fields.SUPPORT_DISCOVERED_BY_02,
      Fields.SUPPORT_DISCOVERED_BY_03,
      Fields.SUPPORT_RESOLUTION_TYPE,
      Fields.SUPPORT_RESOLUTION_TYPE_02,
      Fields.SUPPORT_RESOLUTION_TYPE_03,
      Fields.SUPPORT_ROOT_CAUSE,
    ];
  }

  public async getIssueChangelogs(issueIdOrKey: string | number, { startAt, maxResults }: { startAt: number; maxResults: number }): Promise<Changelog[]> {
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

    return this.issueMapper.toIssue(response.data);
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
