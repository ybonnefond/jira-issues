import { JiraApi } from './jira/JiraApi';
import { Configuration } from './Configuration';
import { CsvWriter } from './CsvWriter';
import { IssueProcessor } from './IssueProcessor';

async function main() {
  const configuration = Configuration.fromEnv();
  const jira = new JiraApi({ configuration });
  const writer = new CsvWriter({ configuration });

  const processor = new IssueProcessor({ jira, writer, configuration });

  await processor.process();
}

void main();
