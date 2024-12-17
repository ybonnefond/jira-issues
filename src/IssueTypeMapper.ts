export type IssueTypeMap = Record<string, string[]>;

export class IssueTypeMapper {
  constructor(private readonly map: IssueTypeMap) {}

  public mapIssueType(issueType: string): string {
    for (const key in this.map) {
      if (this.map[key].includes(issueType)) {
        return key;
      }
    }
    return issueType;
  }

  public static fromString(str: string): IssueTypeMapper {
    const regex = /(\w+)\(([^)]+)\)/g;
    const record: IssueTypeMap = {};

    let match;
    while ((match = regex.exec(str)) !== null) {
      const key = match[1];
      const values = match[2].split(';');
      record[key] = values;
    }

    return new IssueTypeMapper(record);
  }
}
