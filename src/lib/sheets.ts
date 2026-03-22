import { getSheets, getSpreadsheetId } from "./google-auth";
import type { TaxData, IncomeEntry, ExpenseEntry, WithholdingSlip, ReceiptEntry } from "./tax-engine";
import type { JournalEntry } from "./bookkeeping";
import type { FixedAsset } from "./depreciation";
import type { Invoice } from "./consumption-tax";

export interface TaxpayerInfo {
  id: string;
  name: string;
  address: string;
  myNumber: string;
  occupation: string;
  birthDate: string;
  phone: string;
  email: string;
  year: number;
}

const SHEET_NAMES = {
  incomes: "incomes",
  expenses: "expenses",
  slips: "withholding_slips",
  receipts: "receipts",
  journal: "journal_entries",
  fixedAssets: "fixed_assets",
  invoices: "invoices",
  taxpayer: "taxpayer_info",
} as const;

const INCOME_HEADERS = ["id", "date", "year", "amount", "category", "source", "withheld", "note", "yearsOfService"];
const EXPENSE_HEADERS = ["id", "date", "year", "amount", "category", "note"];
const SLIP_HEADERS = ["id", "year", "month", "yearMonth", "payer", "withheldAmount", "note"];
const RECEIPT_HEADERS = ["id", "date", "year", "fileName", "fileId", "thumbnailUrl", "category", "amount", "note"];
const JOURNAL_HEADERS = ["id", "date", "year", "debitCode", "debitName", "creditCode", "creditName", "amount", "description", "taxRate", "taxAmount"];
const FIXED_ASSET_HEADERS = ["id", "name", "category", "acquisitionDate", "acquisitionCost", "usefulLife", "method", "residualRate", "year", "accountCode", "note"];
const INVOICE_HEADERS = ["id", "invoiceNumber", "issueDate", "dueDate", "clientName", "clientAddress", "itemsJson", "subtotal10", "subtotal8", "tax10", "tax8", "total", "note", "year"];
const TAXPAYER_HEADERS = ["id", "name", "address", "myNumber", "occupation", "birthDate", "phone", "email", "year"];

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
      [SHEET_NAMES.journal]: JOURNAL_HEADERS,
      [SHEET_NAMES.fixedAssets]: FIXED_ASSET_HEADERS,
      [SHEET_NAMES.invoices]: INVOICE_HEADERS,
      [SHEET_NAMES.taxpayer]: TAXPAYER_HEADERS,
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

// ── Journal Entries ──────────────────────────────────────────────────────────

function rowToJournal(row: string[]): JournalEntry {
  return {
    id: row[0] || "", date: row[1] || "", year: Number(row[2]) || 0,
    debitCode: row[3] || "", debitName: row[4] || "",
    creditCode: row[5] || "", creditName: row[6] || "",
    amount: Number(row[7]) || 0, description: row[8] || "",
    taxRate: Number(row[9]) || 0, taxAmount: Number(row[10]) || 0,
  };
}

export async function loadJournalEntries(): Promise<JournalEntry[]> {
  await ensureSheets();
  const sheets = getSheets();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: getSpreadsheetId(),
    range: `${SHEET_NAMES.journal}!A2:K`,
  });
  return (res.data.values || []).map(rowToJournal);
}

export async function appendJournalEntry(entry: JournalEntry) {
  await ensureSheets();
  const sheets = getSheets();
  await sheets.spreadsheets.values.append({
    spreadsheetId: getSpreadsheetId(),
    range: `${SHEET_NAMES.journal}!A:K`,
    valueInputOption: "RAW",
    requestBody: {
      values: [[entry.id, entry.date, entry.year, entry.debitCode, entry.debitName,
        entry.creditCode, entry.creditName, entry.amount, entry.description,
        entry.taxRate, entry.taxAmount]],
    },
  });
}

export async function deleteJournalEntry(id: string) {
  return deleteRow(SHEET_NAMES.journal, id);
}

// ── Fixed Assets ─────────────────────────────────────────────────────────────

function rowToFixedAsset(row: string[]): FixedAsset {
  return {
    id: row[0] || "", name: row[1] || "", category: row[2] || "",
    acquisitionDate: row[3] || "", acquisitionCost: Number(row[4]) || 0,
    usefulLife: Number(row[5]) || 0,
    method: (row[6] || "straight") as FixedAsset["method"],
    residualRate: Number(row[7]) || 0, year: Number(row[8]) || 0,
    accountCode: row[9] || "", note: row[10] || "",
  };
}

export async function loadFixedAssets(): Promise<FixedAsset[]> {
  await ensureSheets();
  const sheets = getSheets();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: getSpreadsheetId(),
    range: `${SHEET_NAMES.fixedAssets}!A2:K`,
  });
  return (res.data.values || []).map(rowToFixedAsset);
}

export async function appendFixedAsset(entry: FixedAsset) {
  await ensureSheets();
  const sheets = getSheets();
  await sheets.spreadsheets.values.append({
    spreadsheetId: getSpreadsheetId(),
    range: `${SHEET_NAMES.fixedAssets}!A:K`,
    valueInputOption: "RAW",
    requestBody: {
      values: [[entry.id, entry.name, entry.category, entry.acquisitionDate,
        entry.acquisitionCost, entry.usefulLife, entry.method, entry.residualRate,
        entry.year, entry.accountCode, entry.note]],
    },
  });
}

export async function deleteFixedAsset(id: string) {
  return deleteRow(SHEET_NAMES.fixedAssets, id);
}

// ── Invoices ─────────────────────────────────────────────────────────────────

interface InvoiceRow extends Omit<Invoice, "items"> {
  itemsJson: string;
}

function rowToInvoice(row: string[]): Invoice {
  let items = [];
  try { items = JSON.parse(row[6] || "[]"); } catch { /* empty */ }
  return {
    id: row[0] || "", invoiceNumber: row[1] || "",
    issueDate: row[2] || "", dueDate: row[3] || "",
    clientName: row[4] || "", clientAddress: row[5] || "",
    items,
    subtotal10: Number(row[7]) || 0, subtotal8: Number(row[8]) || 0,
    tax10: Number(row[9]) || 0, tax8: Number(row[10]) || 0,
    total: Number(row[11]) || 0, note: row[12] || "",
    year: Number(row[13]) || 0,
  };
}

export async function loadInvoices(): Promise<Invoice[]> {
  await ensureSheets();
  const sheets = getSheets();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: getSpreadsheetId(),
    range: `${SHEET_NAMES.invoices}!A2:N`,
  });
  return (res.data.values || []).map(rowToInvoice);
}

export async function appendInvoice(entry: Invoice) {
  await ensureSheets();
  const sheets = getSheets();
  await sheets.spreadsheets.values.append({
    spreadsheetId: getSpreadsheetId(),
    range: `${SHEET_NAMES.invoices}!A:N`,
    valueInputOption: "RAW",
    requestBody: {
      values: [[entry.id, entry.invoiceNumber, entry.issueDate, entry.dueDate,
        entry.clientName, entry.clientAddress, JSON.stringify(entry.items),
        entry.subtotal10, entry.subtotal8, entry.tax10, entry.tax8,
        entry.total, entry.note, entry.year]],
    },
  });
}

export async function deleteInvoice(id: string) {
  return deleteRow(SHEET_NAMES.invoices, id);
}

// ── Taxpayer Info ─────────────────────────────────────────────────────────────

function rowToTaxpayer(row: string[]): TaxpayerInfo {
  return {
    id: row[0] || "", name: row[1] || "", address: row[2] || "",
    myNumber: row[3] || "", occupation: row[4] || "",
    birthDate: row[5] || "", phone: row[6] || "",
    email: row[7] || "", year: Number(row[8]) || 0,
  };
}

export async function loadTaxpayerInfo(): Promise<TaxpayerInfo[]> {
  await ensureSheets();
  const sheets = getSheets();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: getSpreadsheetId(),
    range: `${SHEET_NAMES.taxpayer}!A2:I`,
  });
  return (res.data.values || []).map(rowToTaxpayer);
}

export async function appendTaxpayerInfo(entry: TaxpayerInfo) {
  await ensureSheets();
  const sheets = getSheets();
  await sheets.spreadsheets.values.append({
    spreadsheetId: getSpreadsheetId(),
    range: `${SHEET_NAMES.taxpayer}!A:I`,
    valueInputOption: "RAW",
    requestBody: {
      values: [[entry.id, entry.name, entry.address, entry.myNumber,
        entry.occupation, entry.birthDate, entry.phone, entry.email, entry.year]],
    },
  });
}

export async function deleteTaxpayerInfo(id: string) {
  return deleteRow(SHEET_NAMES.taxpayer, id);
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
