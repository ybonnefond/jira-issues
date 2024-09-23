import { JiraApi } from './jira/JiraApi';
import { Configuration } from './Configuration';
import { CsvWriter } from './CsvWriter';
import { IssueProcessor } from './IssueProcessor';
import { EpicProcessor } from './EpicProcessor';

async function main() {
  const configuration = Configuration.fromEnv();
  const jira = new JiraApi({ configuration });
  const issuesWriter = new CsvWriter({ configuration, filename: 'issues.csv' });
  const epicsWriter = new CsvWriter({ configuration, filename: 'epics.csv' });

  const issueProcessor = new IssueProcessor({ jira, writer: issuesWriter, configuration });
  const epicsProcessor = new EpicProcessor({ jira, writer: epicsWriter, configuration });

  await epicsProcessor.process();
  await issueProcessor.process();
}

void main();
