import { JiraApi } from './jira/JiraApi';
import { Configuration } from './Configuration';
import { CsvWriter } from './CsvWriter';
import { IssueProcessor } from './IssueProcessor';
import { EpicProcessor } from './EpicProcessor';
import { PullRequestProcessor } from './PullRequestProcessor';
import { GithubApi } from './github/GithubApi';
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

  const issueProcessor = new IssueProcessor({
    configuration,
    jira,
    writer: new SpreadSheetWriter({
      configuration,
      sheetName: configuration.google.spreadsheet.issuesSheet,
      columns: configuration.columns,
    }),
  });

  const epicsProcessor = new EpicProcessor({
    configuration,
    jira,
    writer: new SpreadSheetWriter({
      configuration,
      sheetName: configuration.google.spreadsheet.epicSheet,
      columns: configuration.columns,
    }),
  });

  await epicsProcessor.process();
  await issueProcessor.process();

  // const prProcessor = new PullRequestProcessor({ github, prWriter, commentWriter, reviewWriter, configuration });
  // await prProcessor.process();
}

void main();
