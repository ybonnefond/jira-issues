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
