import { Users } from '../entities/Users';
import { Sprints } from '../Sprints';
import { Columns } from '../Columns';
import { Issue, IssueProps } from '../entities/Issue';
import { Fields } from './Fields';
import { toSprint } from './JiraSprintDto';
import { JiraIssueCustomField, JiraIssueDto } from './JiraIssueDto';
import { Configuration } from '../Configuration';

export class JiraIssueMapper {
  private readonly configuration: Configuration;

  constructor({ configuration }: { configuration: Configuration }) {
    this.configuration = configuration;
  }

  public toIssue(jira: JiraIssueDto): Issue {
    const issueProps: IssueProps = {
      id: jira.id,
      key: jira.key,
      link: `${this.configuration.jira.origin}/browse/${jira.key}`,
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
      type: this.configuration.issueTypeMapper.mapIssueType(jira.fields.issuetype.name),
      createdAt: new Date(jira.fields.created),
      resolvedAt: jira.fields.resolutiondate ? new Date(jira.fields.resolutiondate) : null,
      estimation: jira.fields[Fields.ESTIMATION],
      totalTimeSpent: jira.fields.aggregatetimespent,
      sprints: Array.isArray(jira.fields[Fields.SPRINTS]) ? jira.fields[Fields.SPRINTS].map(toSprint) : [],
      supportDiscoveredBy: this.findSupportDiscoveredBy(jira),
      supportResolutionType: this.findSupportResolutionType(jira),
      product: this.getCustomFieldsValue({
        fields: [jira.fields[Fields.PRODUCT_07], jira.fields[Fields.PRODUCT_06], jira.fields[Fields.PRODUCT_05], jira.fields[Fields.PRODUCT_04], jira.fields[Fields.PRODUCT_03], jira.fields[Fields.PRODUCT_02], jira.fields[Fields.PRODUCT_01]],
        fallback: this.configuration.supportProductDefault,
      }),
    };

    const user = this.configuration.users.findUserByJiraHandle(jira.fields.assignee?.displayName);

    issueProps.assignee = user;

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
          link: `${this.configuration.jira.origin}/browse/${jira.fields.parent.key}`,
        };
      }
    }

    return new Issue(issueProps, { deliveredStatuses: this.configuration.deliveredStatuses, sprints: this.configuration.sprints, columns: this.configuration.columns });
  }

  private findSupportDiscoveredBy(jira: JiraIssueDto): string {
    return this.getCustomFieldValue(jira.fields[Fields.SUPPORT_DISCOVERED_BY]) ?? 'Development Team';
  }

  private findSupportResolutionType(jira: JiraIssueDto): string | null {
    if (jira.fields.issuetype.name === 'Bug') {
      return 'Bug';
    }

    return this.getCustomFieldValue(jira.fields[Fields.SUPPORT_RESOLUTION_TYPE]);
  }

  private getCustomFieldsValue({ fields, fallback }: { fields: Array<JiraIssueCustomField | null | undefined>; fallback: string }): string {
    for (const field of fields) {
      const value = this.getCustomFieldValue(field);

      if (value !== null) {
        return value;
      }
    }

    return fallback;
  }

  private getCustomFieldValue(field: JiraIssueCustomField | null | undefined): string | null {
    if (field === null || typeof field === 'undefined') {
      return null;
    }

    const isValid = typeof field.value === 'string' && field.value.length > 0;

    if (!isValid) {
      return null;
    }

    return field.value;
  }
}
