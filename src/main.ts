import { JiraApi } from './jira/JiraApi';
import { Configuration } from './Configuration';
import { IssueProcessor } from './IssueProcessor';
import { SpreadSheetWriter } from './google/SpreadSheetWriter';

async function main() {
  const configuration = Configuration.fromEnv();
  const jira = new JiraApi({ configuration });
  // const github = new GithubApi({ configuration });

  // const issuesWriter = new CsvWriter({ configuration, filename: 'issues.csv' });
  // const epicsWriter = new CsvWriter({ configuration, filename: 'epics.csv' });

  // const prWriter = new CsvWriter({ configuration, filename: 'pr.csv' });
  // const commentWriter = new CsvWriter({ configuration, filename: 'pr-comments.csv' });
  // const reviewWriter = new CsvWriter({ configuration, filename: 'pr-reviews.csv' });

  const epicsProcessor = new IssueProcessor({
    configuration,
    jira,
    writer: new SpreadSheetWriter({
      configuration,
      sheetName: configuration.google.spreadsheet.epicSheet,
      columns: configuration.columns,
    }),
    label: 'epics',
    load: async ({ nextPageToken, batchSize, jira }) => {
      return jira.listEpics({ nextPageToken, maxResults: batchSize });
    },
  });

  await epicsProcessor.process();

  const issueProcessor = new IssueProcessor({
    configuration,
    jira,
    writer: new SpreadSheetWriter({
      configuration,
      sheetName: configuration.google.spreadsheet.issuesSheet,
      columns: configuration.columns,
    }),
    cache: epicsProcessor.getCache(),
    label: 'issues',
    load: async ({ nextPageToken, batchSize, jira }) => {
      return jira.listIssue({ nextPageToken, maxResults: batchSize });
    },
  });

  await issueProcessor.process();

  // const prProcessor = new PullRequestProcessor({ github, prWriter, commentWriter, reviewWriter, configuration });
  // await prProcessor.process();
}

void main();
