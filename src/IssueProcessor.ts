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

export class IssueProcessor {
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

    await batch({
      batchSize: this.configuration.jira.batchSize,
      load: async ({ startAt, batchSize }) => {
        console.log(`Loading issue batch [${chalk.bold.white(startAt)}, ${chalk.bold.white(startAt + batchSize)}]`);
        return this.jira.listIssue({ startAt, maxResults: batchSize });
      },
      process: async (batch: Issue[]) => {
        total += batch.length;

        const rows = [];
        for (const issue of batch) {
          const changelogs = await this.loadChangelogs(issue.getKey());

          issue.setChangelogs(new Changelogs({ changelogs, statusMap: this.configuration.statusMap, createdAt: issue.getCreatedAt() }));

          if (!issue.hasAssignee()) {
            const parentKey = issue.getParentKey();
            if (parentKey) {
              const parent = await this.jira.getIssue(parentKey);
              issue.updateParent(parent);
            }
          }

          rows.push(issue.toRow());
        }

        console.log(`Writing issue batch: ${rows.length} rows`);
        await this.writer.write(rows);

        console.log('');
      },
    });

    console.log(`Total: ${total} issues processed`);

    await this.writer.end();
    console.log('');
  }

  private async loadChangelogs(issueIdOrKey: string | number): Promise<Changelog[]> {
    let changelogs: Changelog[] = [];
    console.log(` - Loading changelogs for issue ${chalk.cyan(issueIdOrKey)}`);

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
