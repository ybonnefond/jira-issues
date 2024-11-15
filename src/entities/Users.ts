import { User } from './User';

export class Users {
  constructor(private readonly users: User[]) {}

  public findUserByGithubHandle(handle: string): User | null {
    return this.users.find((user) => user.getGithubHandle() === handle) ?? null;
  }

  public findUserByJiraHandle(handle: string): User | null {
    return this.users.find((user) => user.getJiraHandle() === handle) ?? null;
  }
}
