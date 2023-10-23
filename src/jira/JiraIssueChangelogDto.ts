import { IssueChangelog } from "../entities/IssueChangelog";

export interface JiraIssueChangelogDto {
  id: string;
  author: {
    displayName: string;
    emailAddress?: string;
  };
  created: string;
  items: Array<{
    field: string; // Sprint
    fieldtype: string; // custom
    fieldId: string; // sprint:customfield_10021 || status:status
    from: string;
    fromString: string; // 'TODO'
    to: string;
    toString: string; // VGPC - Sprint 11 || VGPC - Sprint 11, VGPC - Sprint 12 || 'IN PROGRESS'
  }>;
}

export function toIssueChangelog(jira: JiraIssueChangelogDto): IssueChangelog {
  const item = jira.items[0];

  return new IssueChangelog({
    changedAt: new Date(jira.created),
    fieldId: item.fieldId,
    from: item.from,
    fromString: item.fromString,
    to: item.to,
    toString: item.toString,
  });
}
