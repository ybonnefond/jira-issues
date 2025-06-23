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
  private readonly cache = new Map<string, Issue>();

  constructor({ jira, writer, configuration }: { jira: JiraApi; writer: Writer; configuration: Configuration }) {
    this.jira = jira;
    this.writer = writer;
    this.configuration = configuration;
  }

  public async process() {
    console.log('Processing issues...');

    await this.writer.begin();
    let total = 0;

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
          this.cache.set(issue.getKey(), issue);
          const changelogs = await this.loadChangelogs(issue.getKey());

          issue.setChangelogs(new Changelogs({ changelogs, statusMap: this.configuration.statusMap, createdAt: issue.getCreatedAt() }));

          rows.push(issue.toRow());
        }

        console.log(`Writing epics batch: ${rows.length} rows`);
        await this.writer.write(rows);

        console.log('');
      },
    });

    console.log(`Total: ${total} epics processed`);

    this.writer.end();
    console.log('');
  }

  public getCache(): Map<string, Issue> {
    return this.cache;
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
