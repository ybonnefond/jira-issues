import { JiraApi } from './jira/JiraApi';
import { Configuration } from './Configuration';
import Table from 'cli-table3';

async function main() {
  const configuration = Configuration.fromEnv();
  const jira = new JiraApi({ configuration });

  const fields = await jira.findFields();

  fields.sort((a, b) => a.name.localeCompare(b.name));

  const table = new Table({
    head: ['Field name', 'Jira field key'],
    // colWidths: [200, 300],
  });

  for (const field of fields) {
    table.push([`\x1b[33m${field.name}\x1b[0m`, field.key]);
    // console.log(`- \x1b[33m${field.name}\x1b[0m:\t\t\t${field.key}`);
  }

  console.log(table.toString());
}

void main();
