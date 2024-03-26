import { JiraSprintDto, toSprint } from './JiraSprintDto';
import { Issue, IssueProps } from '../entities/Issue';
import { Fields } from './Fields';

export interface JiraIssueCustomField {
  id: string;
  value: string;
}

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
      name: string;
      // subtask: false,
      // avatarId: 10315,
      // entityId: '7e075dee-fb15-43fd-8133-7fab162e1396',
      // hierarchyLevel: 0
    };
    resolutiondate: string;
    created: string;
    // Sprints
    [Fields.SPRINTS]?: Required<JiraSprintDto>;
    // Estimation
    [Fields.ESTIMATION]: number;
    // Total Time Spent
    aggregatetimespent: number;
    [Fields.SUPPORT_DISCOVERED_BY]: JiraIssueCustomField | null | undefined;
    [Fields.SUPPORT_RESOLUTION_TYPE]: JiraIssueCustomField | null | undefined;
    [Fields.PRODUCT]: JiraIssueCustomField | null | undefined;
  };
}

export function toIssue(jira: JiraIssueDto, origin: string): Issue {
  const issueProps: IssueProps = {
    id: jira.id,
    key: jira.key,
    link: `${origin}/browse/${jira.key}`,
    summary: jira.fields.summary,
    status: jira.fields.status.name,
    assignee: null,
    reporter: {
      name: jira.fields.reporter.displayName,
      email: jira.fields.reporter.emailAddress ?? null,
    },
    priority: jira.fields.priority.name,
    resolution: jira.fields.resolution?.name ?? '',
    epic: null,
    parent: null,
    type: jira.fields.issuetype.name,
    createdAt: new Date(jira.fields.created),
    resolvedAt: jira.fields.resolutiondate ? new Date(jira.fields.resolutiondate) : null,
    estimation: jira.fields[Fields.ESTIMATION],
    totalTimeSpent: jira.fields.aggregatetimespent,
    sprints: Array.isArray(jira.fields[Fields.SPRINTS]) ? jira.fields[Fields.SPRINTS].map(toSprint) : [],
    supportDiscoveredBy: findSupportDiscoveredBy(jira),
    supportResolutionType: findSupportResolutionType(jira),
    product: getCustomFieldValue(jira.fields[Fields.PRODUCT]),
  };

  if (jira.fields.assignee) {
    issueProps.assignee = {
      name: jira.fields.assignee.displayName,
      email: jira.fields.assignee.emailAddress ?? null,
    };
  }

  if (jira.fields.parent) {
    if (jira.fields.parent.fields.issuetype.name !== 'Epic') {
      issueProps.parent = {
        id: jira.fields.parent.id,
        key: jira.fields.parent.key,
        summary: jira.fields.parent.fields.summary,
        status: jira.fields.parent.fields.status.name,
        priority: jira.fields.parent.fields.priority.name,
        type: jira.fields.parent.fields.issuetype.name,
        assignee: null,
      };
    }

    if (jira.fields.parent.fields.issuetype.name === 'Epic') {
      issueProps.epic = {
        id: jira.fields.parent.id,
        key: jira.fields.parent.key,
        summary: jira.fields.parent.fields.summary,
        status: jira.fields.parent.fields.status.name,
        priority: jira.fields.parent.fields.priority.name,
      };
    }
  }

  return new Issue(issueProps);
}

function findSupportDiscoveredBy(jira: JiraIssueDto): string {
  return getCustomFieldValue(jira.fields[Fields.SUPPORT_DISCOVERED_BY]) ?? '';
}

function findSupportResolutionType(jira: JiraIssueDto): string {
  return getCustomFieldValue(jira.fields[Fields.SUPPORT_RESOLUTION_TYPE]) ?? '';
}

function getCustomFieldValue(field: JiraIssueCustomField | null | undefined): string | null {
  if (field === null || typeof field === 'undefined') {
    return null;
  }

  return field.value;
}
