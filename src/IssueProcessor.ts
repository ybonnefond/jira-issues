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

export type IssueProcessorLoadFn = ({}: { nextPageToken?: string; batchSize: number; jira: JiraApi }) => Promise<{ items: Issue[]; nextPageToken?: string }>;

export class IssueProcessor {
  private readonly jira: JiraApi;
  private readonly writer: Writer;
  private readonly configuration: Configuration;
  private readonly cache = new Map<string, Issue>();
  private readonly label: string;
  private readonly load: IssueProcessorLoadFn;

  constructor({ jira, writer, configuration, cache, label, load }: { jira: JiraApi; writer: Writer; configuration: Configuration; cache?: Map<string, Issue>; label: string; load: IssueProcessorLoadFn }) {
    this.jira = jira;
    this.writer = writer;
    this.configuration = configuration;
    this.label = label;
    this.load = load;

    if (cache) {
      this.cache = cache;
    }
  }

  public async process() {
    console.log(`Processing ${this.label}...`);

    await this.writer.begin();
    let total = 0;

    await batch({
      batchSize: this.configuration.jira.batchSize,
      load: async ({ nextPageToken, batchSize, startAt }) => {
        console.log(`Loading ${this.label} batch [${chalk.bold.white(startAt)}, ${chalk.bold.white(startAt + batchSize)}]`);
        return this.load({ nextPageToken, batchSize, jira: this.jira });
      },
      process: async (batch: Issue[]) => {
        total += batch.length;

        const rows = [];
        for (const issue of batch) {
          this.cache.set(issue.getKey(), issue);
          const changelogs = await this.loadChangelogs(issue.getKey());

          issue.setChangelogs(new Changelogs({ changelogs, statusMap: this.configuration.statusMap, createdAt: issue.getCreatedAt() }));

          const parentKey = issue.getParentKey();
          if (parentKey) {
            const parent = this.cache.get(parentKey) ?? (await this.jira.getIssue(parentKey));
            this.cache.set(parentKey, parent);
            issue.updateParent(parent);
          }

          const row = issue.toRow();
          rows.push(row);
        }

        console.log(`Writing ${this.label} batch: ${rows.length} rows`);
        await this.writer.write(rows);

        console.log('');
      },
    });

    console.log(`Total: ${total} ${this.label} processed`);

    await this.writer.end();
    console.log('');
  }

  public getCache(): Map<string, Issue> {
    return this.cache;
  }

  private async loadChangelogs(issueIdOrKey: string | number): Promise<Changelog[]> {
    let changelogs: Changelog[] = [];
    console.log(` - Loading changelogs for ${this.label} ${chalk.cyan(issueIdOrKey)}`);

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
