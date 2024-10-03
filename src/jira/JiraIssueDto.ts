import { JiraSprintDto, toSprint } from './JiraSprintDto';
import { Issue, IssueProps } from '../entities/Issue';
import { Fields } from './Fields';
import { Columns } from '../Columns';
import { Sprints } from '../Sprints';
import console from 'console';

export interface JiraIssueCustomField {
  id: string;
  value: string;
}

export interface JiraIssueDto {
  id: number;
  key: string;
  link: string;
  fields: {
    [Fields.SUMMARY]: string;
    [Fields.STATUS]: {
      name: string;
      statusCategory: {
        name: string;
      };
    };
    [Fields.PROJECT]: {
      id: string;
      name: string;
      key: string;
    };
    [Fields.STATUS_CATEGORY_CHANGEDATE]: string;
    [Fields.PRIORITY]: {
      name: string;
    };
    [Fields.RESOLUTION]: {
      name: string;
    };
    [Fields.PARENT]: {
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
    [Fields.CREATOR]: {
      displayName: string;
      emailAddress?: string;
    };
    [Fields.REPORTER]: {
      displayName: string;
      emailAddress?: string;
    };
    [Fields.ASSIGNEE]: {
      displayName: string;
      emailAddress?: string;
    };
    [Fields.DESCRIPTION]: {
      content: Array<{
        type: string;
        content: Array<{
          type: string;
          text: string;
        }>;
      }>;
    };
    [Fields.ISSUE_TYPE]: {
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
    [Fields.RESOLUTION_DATE]: string;
    [Fields.CREATED]: string;
    // Sprints
    [Fields.SPRINTS]?: Required<JiraSprintDto>;
    // Estimation
    [Fields.ESTIMATION]: number;
    // Total Time Spent
    [Fields.AGGREGATE_TIME_SPENT]: number;
    [Fields.SUPPORT_DISCOVERED_BY]: JiraIssueCustomField | null | undefined;
    [Fields.SUPPORT_RESOLUTION_TYPE]: JiraIssueCustomField | null | undefined;
    [Fields.PRODUCT_01]: JiraIssueCustomField | null | undefined;
    [Fields.PRODUCT_02]: JiraIssueCustomField | null | undefined;
    [Fields.PRODUCT_03]: JiraIssueCustomField | null | undefined;
    [Fields.PRODUCT_04]: JiraIssueCustomField | null | undefined;
    [Fields.PRODUCT_05]: JiraIssueCustomField | null | undefined;
    [Fields.PRODUCT_06]: JiraIssueCustomField | null | undefined;
    [Fields.PRODUCT_07]: JiraIssueCustomField | null | undefined;
  };
}

export function toIssue(jira: JiraIssueDto, options: { origin: string; deliveredStatuses: string[]; sprints: Sprints; columns: Columns[]; supportProductDefault: string }): Issue {
  const issueProps: IssueProps = {
    id: jira.id,
    key: jira.key,
    link: `${options.origin}/browse/${jira.key}`,
    summary: jira.fields.summary,
    status: jira.fields.status.name,
    assignee: null,
    project: {
      id: jira.fields.project.id,
      key: jira.fields.project.key,
      name: jira.fields.project.name,
    },
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
    product: getCustomFieldsValue({
      fields: [jira.fields[Fields.PRODUCT_07], jira.fields[Fields.PRODUCT_06], jira.fields[Fields.PRODUCT_05], jira.fields[Fields.PRODUCT_04], jira.fields[Fields.PRODUCT_03], jira.fields[Fields.PRODUCT_02], jira.fields[Fields.PRODUCT_01]],
      fallback: options.supportProductDefault,
    }),
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
        link: `${options.origin}/browse/${jira.fields.parent.key}`,
      };
    }
  }

  return new Issue(issueProps, { deliveredStatuses: options.deliveredStatuses, sprints: options.sprints, columns: options.columns });
}

function findSupportDiscoveredBy(jira: JiraIssueDto): string {
  return getCustomFieldValue(jira.fields[Fields.SUPPORT_DISCOVERED_BY]) ?? 'Development Team';
}

function findSupportResolutionType(jira: JiraIssueDto): string | null {
  if (jira.fields.issuetype.name === 'Bug') {
    return 'Bug';
  }

  return getCustomFieldValue(jira.fields[Fields.SUPPORT_RESOLUTION_TYPE]);
}

function getCustomFieldsValue({ fields, fallback }: { fields: Array<JiraIssueCustomField | null | undefined>; fallback: string }): string {
  for (const field of fields) {
    const value = getCustomFieldValue(field);

    if (value !== null) {
      return value;
    }
  }

  return fallback;
}

function getCustomFieldValue(field: JiraIssueCustomField | null | undefined): string | null {
  if (field === null || typeof field === 'undefined') {
    return null;
  }

  const isValid = typeof field.value === 'string' && field.value.length > 0;

  if (!isValid) {
    return null;
  }

  return field.value;
}
