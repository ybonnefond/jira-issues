import { google, sheets_v4 } from 'googleapis';
import { Configuration } from '../Configuration';
import { Writer } from '../Writer';

export class SpreadSheetWriter implements Writer {
  private readonly spreadsheetId: string;
  private readonly sheetName: string;
  private sheetsApi: sheets_v4.Sheets;
  private headers: string[];

  constructor({ configuration, sheetName, headers }: { configuration: Configuration; sheetName: string; headers: string[] }) {
    this.spreadsheetId = configuration.google.spreadsheet.id;
    this.sheetName = sheetName;

    this.sheetsApi = google.sheets({
      version: 'v4',
      auth: new google.auth.GoogleAuth({
        keyFile: configuration.google.credentialFile,
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      }),
    });

    this.headers = headers;
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
    // NOOP
  }
}
