import { createWriteStream, existsSync } from 'fs';
import { unlink, mkdir } from 'fs/promises';
import { CsvFormatterStream, format } from '@fast-csv/format';
import { Configuration } from './Configuration';
import { Writer } from './Writer';

export class CsvWriter implements Writer {
  private readonly configuration: Configuration;
  private readonly filename: string;
  private csv: CsvFormatterStream<any, any> | null = null;

  constructor({ configuration, filename }: { configuration: Configuration; filename: string }) {
    this.configuration = configuration;
    this.filename = filename;
  }

  public async begin() {
    await mkdir(this.configuration.output, { recursive: true });

    const output = `${this.configuration.output}/${this.filename}`;

    if (existsSync(output)) {
      await unlink(output);
    }

    this.csv = format({ headers: true });
    const fileStream = createWriteStream(output);
    this.csv.pipe(fileStream);
  }

  public async write(rows: Record<string, unknown>[]) {
    for (const row of rows) {
      this.getCsv().write(row);
    }
  }

  public async end() {
    this.getCsv().end();
  }

  private getCsv(): CsvFormatterStream<any, any> {
    if (null === this.csv) {
      throw new Error('CsvWriter is not initialized, call begin first');
    }

    return this.csv;
  }
}
