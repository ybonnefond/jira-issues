import { createWriteStream, existsSync } from 'fs';
import { unlink, mkdir } from 'fs/promises';
import { CsvFormatterStream, format } from '@fast-csv/format';
import { Configuration } from './Configuration';

export interface Writer {
  begin(): Promise<void>;

  write(row: Record<string, unknown>[]): Promise<void>;

  end(): Promise<void>;
}
