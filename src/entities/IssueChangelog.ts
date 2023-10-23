import { CustomFields } from "../jira/CustomFields";

export type IssueChangelogProps = {
  changedAt: Date;
  fieldId: string;
  from: string;
  fromString: string;
  to: string;
  toString: string;
};
export class IssueChangelog {
  constructor(private readonly props: IssueChangelogProps) {}

  public isSprintChangeLog() {
    return this.props.fieldId === CustomFields.SPRINTS;
  }

  public getTo(): string[] {
    return this.props.to.split(", ");
  }

  public getChangedAt() {
    return this.props.changedAt;
  }
}
