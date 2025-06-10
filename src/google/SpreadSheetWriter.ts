import { google, sheets_v4 } from 'googleapis';
import { Configuration } from '../Configuration';
import { Writer } from '../Writer';
import { Columns } from '../Columns';
import { ConfigColumn } from '../ConfigJson';

export class SpreadSheetWriter implements Writer {
  private readonly spreadsheetId: string;
  private readonly sheetName: string;
  private sheetsApi: sheets_v4.Sheets;
  private sheetId: number | null;
  private headers: string[];
  private readonly columns: Record<Columns, ConfigColumn>;

  constructor({ configuration, sheetName, columns }: { configuration: Configuration; sheetName: string; columns: Record<Columns, ConfigColumn> }) {
    this.spreadsheetId = configuration.google.spreadsheet.id;
    this.sheetName = sheetName;

    this.sheetsApi = google.sheets({
      version: 'v4',
      auth: new google.auth.GoogleAuth({
        keyFile: configuration.google.credentialFile,
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      }),
    });

    this.sheetId = null;
    this.columns = columns;
    this.headers = Object.keys(columns);
  }

  public async begin(): Promise<void> {
    // Clear sheet
    await this.sheetsApi.spreadsheets.values.clear({
      spreadsheetId: this.spreadsheetId,
      range: this.sheetName,
    });

    // Write header row
    await this.sheetsApi.spreadsheets.values.update({
      spreadsheetId: this.spreadsheetId,
      range: this.sheetName,
      valueInputOption: 'RAW',
      requestBody: {
        values: [this.headers],
      },
    });
  }

  public async write(rows: Record<string, unknown>[]) {
    const values = rows.map((row) => this.headers!.map((h) => row[h] ?? ''));

    await this.sheetsApi.spreadsheets.values.append({
      spreadsheetId: this.spreadsheetId,
      range: this.sheetName,
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      requestBody: {
        values,
      },
    });
  }

  public async end(): Promise<void> {
    this.formatColumns();
  }

  private async formatColumns() {
    const sheetId = await this.getSheetId();
    const requests = Object.entries(this.columns).map(([columnName, columnConfig], index) => {
      return {
        repeatCell: {
          range: {
            sheetId,
            startColumnIndex: index, // Column D
            endColumnIndex: index + 1,
          },
          cell: {
            userEnteredFormat: {
              numberFormat: {
                type: columnConfig.format.type,
                pattern: columnConfig.format.pattern,
              },
            },
          },
          fields: 'userEnteredFormat.numberFormat',
        },
      };
    });

    await this.sheetsApi.spreadsheets.batchUpdate({
      spreadsheetId: this.spreadsheetId,
      requestBody: {
        requests,
      },
    });
  }

  public async getSheetId(): Promise<number> {
    if (this.sheetId !== null) {
      return this.sheetId;
    }

    const sheetMeta = await this.sheetsApi.spreadsheets.get({
      spreadsheetId: this.spreadsheetId,
    });

    const sheets = sheetMeta.data.sheets;
    if (!sheets) {
      throw new Error('No sheets found in spreadsheet metadata');
    }

    const yourSheet = sheets.find((s) => s.properties?.title === this.sheetName);

    if (typeof yourSheet?.properties?.sheetId !== 'number') {
      throw new Error(`Sheet with name "${this.sheetName}" not found`);
    }

    this.sheetId = yourSheet.properties.sheetId;

    return this.sheetId;
  }
}
