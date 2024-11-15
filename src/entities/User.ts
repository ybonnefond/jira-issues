import { Seniority } from './Seniority';
import { UserRole } from './UserRole';

export type UserProps = {
  name: string;
  githubHandle: string;
  jiraHandle: string;
  seniority: Seniority;
  role: UserRole;
};

export class User {
  constructor(private readonly props: UserProps) {}

  public getName(): string {
    return this.props.name;
  }

  public getRole(): UserRole {
    return this.props.role;
  }

  public getSeniority(): Seniority {
    return this.props.seniority;
  }

  public getGithubHandle(): string {
    return this.props.githubHandle;
  }

  public getJiraHandle(): string {
    return this.props.jiraHandle;
  }
}
