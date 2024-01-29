import { JiraApi } from './jira/JiraApi';
import { Configuration } from './Configuration';
import { CsvWriter } from './CsvWriter';
import { IssueProcessor } from './IssueProcessor';

async function main() {
  const configuration = Configuration.fromEnv();
  const jira = new JiraApi({ configuration });

  const fields = await jira.findFields();

  for (const field of fields) {
    console.log(`${field.name}: ${field.key}`);
  }
}

void main();
