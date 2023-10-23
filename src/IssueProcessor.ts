import { JiraApi } from './jira/JiraApi';
import { CsvWriter } from './CsvWriter';
import { batch } from './batch';
import { Issue } from './entities/Issue';
import { Sprint } from './entities/Sprint';
import { IssueChangelog } from './entities/IssueChangelog';
import * as console from 'console';
import { Configuration } from './Configuration';

export class IssueProcessor {
  private readonly jira: JiraApi;
  private readonly writer: CsvWriter;
  private readonly configuration: Configuration;

  constructor({ jira, writer, configuration }: { jira: JiraApi; writer: CsvWriter; configuration: Configuration }) {
    this.jira = jira;
    this.writer = writer;
    this.configuration = configuration;
  }

  public async process() {
    const sprints = await this.loadSprints();

    console.log('Processing issues...');
    console.info(`JQL Filter: ${this.configuration.jira.issueJql}`);

    await this.writer.begin();
    let total = 0;

    await batch({
      batchSize: this.configuration.jira.batchSize,
      load: async ({ startAt, batchSize }) => {
        console.log(`Loading batch ${startAt}...${startAt + batchSize}`);
        return this.jira.listIssue({ startAt, maxResults: batchSize });
      },
      process: async (batch: Issue[]) => {
        total += batch.length;

        for (const issue of batch) {
          const changelogs = await this.loadChangelogs(issue.getKey());

          issue.setChangelogs(changelogs);

          const issueSprints = issue.getAllSprintIds();

          for (const sprintId of issueSprints) {
            const sprint = sprints.get(sprintId);
            if (sprint instanceof Sprint) {
              this.writer.write(issue.toRow(sprint));
            } else {
              console.warn('Sprint not found for issue', { issueKey: issue.getKey(), sprintId: sprintId });
            }
          }
        }
      },
    });

    console.log(`Total: ${total} issues processed`);

    this.writer.end();
    console.log('');
  }

  private async loadSprints(): Promise<Map<number, Sprint>> {
    console.log('Loading sprints...');
    let sprints = new Map<number, Sprint>();

    await batch({
      batchSize: this.configuration.jira.batchSize,
      load: async ({ startAt, batchSize }) => {
        console.log(`Loading batch ${startAt}...${startAt + batchSize}`);
        return this.jira.listSprints({ startAt, maxResults: batchSize });
      },
      process: async (batch: Sprint[]) => {
        for (const sprint of batch) {
          sprints.set(sprint.getId(), sprint);
        }
      },
    });

    console.log('Sprints loaded:');

    for (const sprint of sprints.values()) {
      console.log(` - Sprint ${sprint.getId()}: ${sprint.getSprintName()}`);
    }

    return sprints;
  }

  private async loadChangelogs(issueIdOrKey: string | number): Promise<IssueChangelog[]> {
    let changelogs: IssueChangelog[] = [];
    console.log(`Loading changelogs for issue ${issueIdOrKey}`);

    await batch({
      batchSize: this.configuration.jira.batchSize,
      load: async ({ startAt, batchSize }) => {
        return this.jira.getIssueChangelogs(issueIdOrKey, { startAt, maxResults: batchSize });
      },
      process: async (batch: IssueChangelog[]) => {
        changelogs.push(...batch);
      },
    });

    return changelogs;
  }
}
