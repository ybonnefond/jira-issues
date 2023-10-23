import axios, { AxiosInstance } from 'axios';
import { JiraSprintDto, toSprint } from './JiraSprintDto';
import { JiraIssueChangelogDto, toIssueChangelog } from './JiraIssueChangelogDto';
import { Configuration } from '../Configuration';
import { JiraIssueDto, toIssue } from './JiraIssueDto';
import { CustomFields } from './CustomFields';
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
        fields: [
          'key',
          'status',
          'summary',
          'creator',
          'reporter',
          'issuetype',
          'resolutiondate',
          'created',
          'aggregatetimespent',
          'assignee',
          'priority',
          'resolution',
          'parent',
          'statuscategorychangedate',
          // Sprints
          CustomFields.SPRINTS,
          // Estimation
          CustomFields.ESTIMATION,
        ],
        // fields: ["*all"],
      },
    });

    return response.data.issues.map((issue) => toIssue(issue, this.configuration.jira.origin));
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
}
