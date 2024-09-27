import { Fields } from '../jira/Fields';
import { StringUtils } from '../StringUtils';

export type IssueChangelogProps = {
  changedAt: Date;
  fieldId: string;
  from: string;
  fromString: string | null;
  to: string;
  toString: string | null;
};
export class Changelog {
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

  public getFromStringNormalized() {
    return StringUtils.toScreamingCase(this.props.fromString, { noSpace: true });
  }

  public getTo(): string[] {
    return this.props.to.split(', ');
  }

  public getToStringNormalized() {
    return StringUtils.toScreamingCase(this.props.toString, { noSpace: true });
  }

  public getChangedAt() {
    return this.props.changedAt;
  }
}
