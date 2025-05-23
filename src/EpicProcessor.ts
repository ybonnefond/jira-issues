import { JiraApi } from './jira/JiraApi';
import { CsvWriter } from './CsvWriter';
import { batch } from './batch';
import { Issue } from './entities/Issue';
import { Changelog } from './entities/Changelog';
import * as console from 'console';
import { Configuration } from './Configuration';
import chalk from 'chalk';
import { Changelogs } from './entities/Changelogs';
import { Writer } from './Writer';

export class EpicProcessor {
  private readonly jira: JiraApi;
  private readonly writer: Writer;
  private readonly configuration: Configuration;

  constructor({ jira, writer, configuration }: { jira: JiraApi; writer: Writer; configuration: Configuration }) {
    this.jira = jira;
    this.writer = writer;
    this.configuration = configuration;
  }

  public async process() {
    console.log('Processing issues...');

    await this.writer.begin();
    let total = 0;
    const epics: Map<string, Issue> = new Map();

    await batch({
      batchSize: this.configuration.jira.batchSize,
      load: async ({ startAt, batchSize }) => {
        console.log(`Loading Epic batch [${chalk.bold.white(startAt)}, ${chalk.bold.white(startAt + batchSize)}]`);
        return this.jira.listEpics({ startAt, maxResults: batchSize });
      },
      process: async (batch: Issue[]) => {
        total += batch.length;

        const rows = [];
        for (const issue of batch) {
          const changelogs = await this.loadChangelogs(issue.getKey());

          issue.setChangelogs(new Changelogs({ changelogs, statusMap: this.configuration.statusMap, createdAt: issue.getCreatedAt() }));

          epics.set(issue.getKey(), issue);
          rows.push(issue.toRow());
        }

        console.log(`Writing epics batch: ${rows.length} rows`);
        await this.writer.write(rows);

        console.log('');
      },
    });

    console.log('Epics loaded');

    console.log(`Total: ${total} epics processed`);

    this.writer.end();
    console.log('');
  }

  private async loadChangelogs(issueIdOrKey: string | number): Promise<Changelog[]> {
    let changelogs: Changelog[] = [];
    console.log(` - Loading changelogs for epic ${chalk.cyan(issueIdOrKey)}`);

    await batch({
      batchSize: this.configuration.jira.batchSize,
      load: async ({ startAt, batchSize }) => {
        return this.jira.getIssueChangelogs(issueIdOrKey, { startAt, maxResults: batchSize });
      },
      process: async (batch: Changelog[]) => {
        changelogs.push(...batch);
      },
    });

    return changelogs;
  }
}
