/**
 * Append daily news to Google Sheets by date.
 * Uses Service Account auth. Sheet must be shared with the service account email.
 */

import { google } from 'googleapis';

const SHEETS_SCOPE = ['https://www.googleapis.com/auth/spreadsheets'];

/**
 * Get authenticated Sheets client from service account JSON (env var).
 * @param {string} serviceAccountJson - JSON string of service account key
 * @returns {Promise<{ sheets: import('googleapis').sheets_v4.Sheets, auth: object }>}
 */
async function getSheetsClient(serviceAccountJson) {
  if (!serviceAccountJson) {
    throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON is not set');
  }
  const key = JSON.parse(serviceAccountJson);
  const auth = new google.auth.GoogleAuth({
    credentials: key,
    scopes: SHEETS_SCOPE,
  });
  const sheets = google.sheets({ version: 'v4', auth });
  return { sheets, auth };
}

/**
 * Append rows to a sheet. Creates sheet and header row if missing.
 * @param {object} opts
 * @param {string} opts.spreadsheetId - Google Sheet ID (from URL)
 * @param {string} opts.sheetName - Tab name (e.g. "Daily News")
 * @param {string[][]} opts.rows - Array of row arrays
 * @param {string} opts.serviceAccountJson
 */
export async function appendToSheet({ spreadsheetId, sheetName, rows, serviceAccountJson }) {
  const { sheets } = await getSheetsClient(serviceAccountJson);

  const range = `${sheetName}!A:Z`;
  const valueInputOption = 'USER_ENTERED';

  const res = await sheets.spreadsheets.values.append({
    spreadsheetId,
    range,
    valueInputOption,
    insertDataOption: 'INSERT_ROWS',
    requestBody: { values: rows },
  });
  return res;
}

/**
 * Ensure sheet exists and has header row. Then append daily news rows.
 * Row format: [ Date, Category, Title (EN then ZH), Summary (EN then ZH), Link, Source ]
 */
export async function appendDailyNews({ spreadsheetId, sheetName, dateStr, categoryResults, serviceAccountJson }) {
  const { sheets } = await getSheetsClient(serviceAccountJson);

  // Get sheet metadata to see if we need to add header
  const meta = await sheets.spreadsheets.get({ spreadsheetId });
  const sheet = meta.data.sheets?.find((s) => s.properties?.title === sheetName);
  let needHeader = true;
  if (sheet) {
    const data = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${sheetName}!A1:F1`,
    });
    needHeader = !data.data.values || data.data.values.length === 0;
  } else {
    // Create new sheet with name sheetName
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [
          {
            addSheet: {
              properties: { title: sheetName },
            },
          },
        ],
      },
    });
  }

  const rows = [];
  if (needHeader) {
    rows.push(['Date', 'Category', 'Title', 'Summary', 'Link', 'Source']);
  }
  for (const { categoryKey, label, articles } of categoryResults) {
    for (const a of articles) {
      const titleEn = a.title || '';
      const summaryEn = a.summary ?? a.description ?? '';
      const titleZh = a.title_zh || '';
      const summaryZh = a.summary_zh || '';
      const titleCell = titleZh ? `${titleEn}\n${titleZh}` : titleEn;
      const summaryCell = summaryZh ? `${summaryEn}\n${summaryZh}` : summaryEn;
      rows.push([
        dateStr,
        label,
        titleCell,
        summaryCell,
        a.url || '',
        a.source || '',
      ]);
    }
  }

  if (rows.length === 0) return { updated: 0 };
  const range = `${sheetName}!A:F`;
  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range,
    valueInputOption: 'USER_ENTERED',
    insertDataOption: 'INSERT_ROWS',
    requestBody: { values: needHeader ? rows : rows.filter((_, i) => i > 0) },
  });
  return { updated: rows.length - (needHeader ? 1 : 0) };
}
