import { createWriteStream, existsSync } from 'fs';
import { unlink, mkdir } from 'fs/promises';
import { CsvFormatterStream, format } from '@fast-csv/format';
import { Configuration } from './Configuration';

export class CsvWriter {
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

  public write(row: Record<string, unknown>) {
    this.getCsv().write(row);
  }

  public end() {
    this.getCsv().end();
  }

  private getCsv(): CsvFormatterStream<any, any> {
    if (null === this.csv) {
      throw new Error('CsvWriter is not initialized, call begin first');
    }

    return this.csv;
  }
}
