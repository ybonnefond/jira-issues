import { JiraSprintDto, toSprint } from './JiraSprintDto';
import { Issue, IssueProps } from '../entities/Issue';
import { CustomFields } from './CustomFields';

export interface JiraIssueDto {
  id: number;
  key: string;
  link: string;
  fields: {
    summary: string;
    status: {
      name: string;
      statusCategory: {
        name: string;
      };
    };
    statuscategorychangedate: string;
    priority: {
      name: string;
    };
    resolution: {
      name: string;
    };
    parent: {
      key: string;
      id: number;
      fields: {
        summary: string;
        status: {
          name: string;
        };
        priority: {
          name: string;
        };
        issuetype: {
          name: string;
        };
      };
    };
    creator: {
      displayName: string;
      emailAddress?: string;
    };
    reporter: {
      displayName: string;
      emailAddress?: string;
    };
    assignee: {
      displayName: string;
      emailAddress?: string;
    };
    description: {
      content: Array<{
        type: string;
        content: Array<{
          type: string;
          text: string;
        }>;
      }>;
    };
    issuetype: {
      // self: 'https://voodoo.atlassian.net/rest/api/3/issuetype/10457',
      // id: '10457',
      // description: 'Stories track functionality or features expressed as user goals.',
      // iconUrl: 'https://voodoo.atlassian.net/rest/api/2/universal_avatar/view/type/issuetype/avatar/10315?size=medium',
      name: 'Story';
      // subtask: false,
      // avatarId: 10315,
      // entityId: '7e075dee-fb15-43fd-8133-7fab162e1396',
      // hierarchyLevel: 0
    };
    resolutiondate: string;
    created: string;
    // Sprints
    [CustomFields.SPRINTS]?: Required<JiraSprintDto>;
    // Estimation
    [CustomFields.ESTIMATION]: number;
    // Total Time Spent
    aggregatetimespent: number;
  };
}

export function toIssue(jira: JiraIssueDto, origin: string): Issue {
  const issueProps: IssueProps = {
    id: jira.id,
    key: jira.key,
    link: `${origin}/browse/${jira.key}`,
    summary: jira.fields.summary,
    status: jira.fields.status.name,
    assignee: jira.fields.assignee
      ? {
          name: jira.fields.assignee.displayName ?? null,
          email: jira.fields.assignee.emailAddress ?? null,
        }
      : null,
    reporter: {
      name: jira.fields.reporter.displayName,
      email: jira.fields.reporter.emailAddress ?? null,
    },
    priority: jira.fields.priority.name,
    resolution: jira.fields.resolution?.name ?? '',
    epic: null,
    type: jira.fields.issuetype.name,
    createdAt: new Date(jira.fields.created),
    resolvedAt: jira.fields.resolutiondate ? new Date(jira.fields.resolutiondate) : null,
    estimation: jira.fields.customfield_10016,
    totalTimeSpent: jira.fields.aggregatetimespent,
    sprints: Array.isArray(jira.fields.customfield_10021) ? jira.fields.customfield_10021.map(toSprint) : [],
  };

  if (jira.fields.parent && jira.fields.parent.fields.issuetype.name === 'Epic') {
    issueProps.epic = {
      id: jira.fields.parent.id,
      key: jira.fields.parent.key,
      summary: jira.fields.parent.fields.summary,
      status: jira.fields.parent.fields.status.name,
      priority: jira.fields.parent.fields.priority.name,
    };
  }

  return new Issue(issueProps);
}
