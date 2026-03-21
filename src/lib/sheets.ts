import { getSheets, getSpreadsheetId } from "./google-auth";
import type { TaxData, IncomeEntry, ExpenseEntry, WithholdingSlip, ReceiptEntry } from "./tax-engine";

const SHEET_NAMES = {
  incomes: "incomes",
  expenses: "expenses",
  slips: "withholding_slips",
  receipts: "receipts",
} as const;

const INCOME_HEADERS = ["id", "date", "year", "amount", "category", "source", "withheld", "note", "yearsOfService"];
const EXPENSE_HEADERS = ["id", "date", "year", "amount", "category", "note"];
const SLIP_HEADERS = ["id", "year", "month", "yearMonth", "payer", "withheldAmount", "note"];
const RECEIPT_HEADERS = ["id", "date", "year", "fileName", "fileId", "thumbnailUrl", "category", "amount", "note"];

async function ensureSheets() {
  const sheets = getSheets();
  const spreadsheetId = getSpreadsheetId();

  const meta = await sheets.spreadsheets.get({ spreadsheetId });
  const existing = meta.data.sheets?.map(s => s.properties?.title) || [];

  const toCreate = Object.values(SHEET_NAMES).filter(name => !existing.includes(name));
  if (toCreate.length > 0) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: toCreate.map(title => ({ addSheet: { properties: { title } } })),
      },
    });
    // Add headers
    const headerMap: Record<string, string[]> = {
      [SHEET_NAMES.incomes]: INCOME_HEADERS,
      [SHEET_NAMES.expenses]: EXPENSE_HEADERS,
      [SHEET_NAMES.slips]: SLIP_HEADERS,
      [SHEET_NAMES.receipts]: RECEIPT_HEADERS,
    };
    for (const name of toCreate) {
      const headers = headerMap[name];
      if (headers) {
        await sheets.spreadsheets.values.update({
          spreadsheetId,
          range: `${name}!A1`,
          valueInputOption: "RAW",
          requestBody: { values: [headers] },
        });
      }
    }
  }
}

function rowToIncome(row: string[]): IncomeEntry {
  return {
    id: row[0] || "", date: row[1] || "", year: Number(row[2]) || 0,
    amount: Number(row[3]) || 0, category: (row[4] || "other") as IncomeEntry["category"],
    source: row[5] || "", withheld: Number(row[6]) || 0, note: row[7] || "",
    yearsOfService: row[8] ? Number(row[8]) : undefined,
  };
}

function rowToExpense(row: string[]): ExpenseEntry {
  return {
    id: row[0] || "", date: row[1] || "", year: Number(row[2]) || 0,
    amount: Number(row[3]) || 0, category: row[4] || "", note: row[5] || "",
  };
}

function rowToSlip(row: string[]): WithholdingSlip {
  return {
    id: row[0] || "", year: Number(row[1]) || 0, month: Number(row[2]) || 0,
    yearMonth: row[3] || "", payer: row[4] || "", withheldAmount: Number(row[5]) || 0, note: row[6] || "",
  };
}

function rowToReceipt(row: string[]): ReceiptEntry {
  return {
    id: row[0] || "", date: row[1] || "", year: Number(row[2]) || 0,
    fileName: row[3] || "", fileId: row[4] || "", thumbnailUrl: row[5] || "",
    category: row[6] || "", amount: Number(row[7]) || 0, note: row[8] || "",
  };
}

export async function loadData(): Promise<TaxData> {
  await ensureSheets();
  const sheets = getSheets();
  const spreadsheetId = getSpreadsheetId();

  const [incRes, expRes, slipRes, recRes] = await Promise.all([
    sheets.spreadsheets.values.get({ spreadsheetId, range: `${SHEET_NAMES.incomes}!A2:I` }),
    sheets.spreadsheets.values.get({ spreadsheetId, range: `${SHEET_NAMES.expenses}!A2:F` }),
    sheets.spreadsheets.values.get({ spreadsheetId, range: `${SHEET_NAMES.slips}!A2:G` }),
    sheets.spreadsheets.values.get({ spreadsheetId, range: `${SHEET_NAMES.receipts}!A2:I` }),
  ]);

  return {
    incomes: (incRes.data.values || []).map(rowToIncome),
    expenses: (expRes.data.values || []).map(rowToExpense),
    withholding_slips: (slipRes.data.values || []).map(rowToSlip),
    receipts: (recRes.data.values || []).map(rowToReceipt),
  };
}

export async function appendIncome(entry: IncomeEntry) {
  await ensureSheets();
  const sheets = getSheets();
  await sheets.spreadsheets.values.append({
    spreadsheetId: getSpreadsheetId(),
    range: `${SHEET_NAMES.incomes}!A:I`,
    valueInputOption: "RAW",
    requestBody: {
      values: [[entry.id, entry.date, entry.year, entry.amount, entry.category,
        entry.source, entry.withheld, entry.note, entry.yearsOfService || ""]],
    },
  });
}

export async function appendExpense(entry: ExpenseEntry) {
  await ensureSheets();
  const sheets = getSheets();
  await sheets.spreadsheets.values.append({
    spreadsheetId: getSpreadsheetId(),
    range: `${SHEET_NAMES.expenses}!A:F`,
    valueInputOption: "RAW",
    requestBody: {
      values: [[entry.id, entry.date, entry.year, entry.amount, entry.category, entry.note]],
    },
  });
}

export async function appendSlip(entry: WithholdingSlip) {
  await ensureSheets();
  const sheets = getSheets();
  await sheets.spreadsheets.values.append({
    spreadsheetId: getSpreadsheetId(),
    range: `${SHEET_NAMES.slips}!A:G`,
    valueInputOption: "RAW",
    requestBody: {
      values: [[entry.id, entry.year, entry.month, entry.yearMonth, entry.payer, entry.withheldAmount, entry.note]],
    },
  });
}

export async function appendReceipt(entry: ReceiptEntry) {
  await ensureSheets();
  const sheets = getSheets();
  await sheets.spreadsheets.values.append({
    spreadsheetId: getSpreadsheetId(),
    range: `${SHEET_NAMES.receipts}!A:I`,
    valueInputOption: "RAW",
    requestBody: {
      values: [[entry.id, entry.date, entry.year, entry.fileName, entry.fileId,
        entry.thumbnailUrl || "", entry.category, entry.amount, entry.note]],
    },
  });
}

export async function deleteRow(sheetName: string, id: string) {
  await ensureSheets();
  const sheets = getSheets();
  const spreadsheetId = getSpreadsheetId();
  const res = await sheets.spreadsheets.values.get({ spreadsheetId, range: `${sheetName}!A:A` });
  const rows = res.data.values || [];
  const rowIndex = rows.findIndex(r => r[0] === id);
  if (rowIndex < 0) return;

  const meta = await sheets.spreadsheets.get({ spreadsheetId });
  const sheet = meta.data.sheets?.find(s => s.properties?.title === sheetName);
  if (!sheet?.properties?.sheetId && sheet?.properties?.sheetId !== 0) return;

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: {
      requests: [{
        deleteDimension: {
          range: {
            sheetId: sheet.properties.sheetId,
            dimension: "ROWS",
            startIndex: rowIndex,
            endIndex: rowIndex + 1,
          },
        },
      }],
    },
  });
}
