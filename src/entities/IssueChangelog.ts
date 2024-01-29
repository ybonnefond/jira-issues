import { Fields } from '../jira/Fields';

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
    return this.props.fieldId === Fields.SPRINTS;
  }

  public isStatusChangelog() {
    return this.props.fieldId === Fields.STATUS;
  }

  public getFrom(): string[] {
    return this.props.from.split(', ');
  }

  public getTo(): string[] {
    return this.props.to.split(', ');
  }

  public getChangedAt() {
    return this.props.changedAt;
  }
}
