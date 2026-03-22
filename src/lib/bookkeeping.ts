// ── 複式簿記エンジン ──────────────────────────────────────────────────────────

/** 勘定科目マスタ */
export const ACCOUNT_CATEGORIES = {
  assets: "資産",
  liabilities: "負債",
  equity: "純資産",
  revenue: "収益",
  expense: "費用",
} as const;

export type AccountCategory = keyof typeof ACCOUNT_CATEGORIES;

export interface Account {
  code: string;       // 勘定科目コード (e.g. "101")
  name: string;       // 勘定科目名
  category: AccountCategory;
}

/** デフォルト勘定科目 */
export const DEFAULT_ACCOUNTS: Account[] = [
  // 資産
  { code: "101", name: "現金", category: "assets" },
  { code: "102", name: "普通預金", category: "assets" },
  { code: "103", name: "売掛金", category: "assets" },
  { code: "104", name: "事業主貸", category: "assets" },
  { code: "110", name: "建物", category: "assets" },
  { code: "111", name: "建物附属設備", category: "assets" },
  { code: "112", name: "機械装置", category: "assets" },
  { code: "113", name: "車両運搬具", category: "assets" },
  { code: "114", name: "工具器具備品", category: "assets" },
  { code: "115", name: "土地", category: "assets" },
  // 負債
  { code: "201", name: "買掛金", category: "liabilities" },
  { code: "202", name: "未払金", category: "liabilities" },
  { code: "203", name: "預り金", category: "liabilities" },
  { code: "204", name: "借入金", category: "liabilities" },
  { code: "205", name: "事業主借", category: "liabilities" },
  // 純資産
  { code: "301", name: "元入金", category: "equity" },
  // 収益
  { code: "401", name: "売上高", category: "revenue" },
  { code: "402", name: "雑収入", category: "revenue" },
  { code: "403", name: "受取利息", category: "revenue" },
  // 費用
  { code: "501", name: "仕入高", category: "expense" },
  { code: "510", name: "租税公課", category: "expense" },
  { code: "511", name: "荷造運賃", category: "expense" },
  { code: "512", name: "水道光熱費", category: "expense" },
  { code: "513", name: "旅費交通費", category: "expense" },
  { code: "514", name: "通信費", category: "expense" },
  { code: "515", name: "広告宣伝費", category: "expense" },
  { code: "516", name: "接待交際費", category: "expense" },
  { code: "517", name: "損害保険料", category: "expense" },
  { code: "518", name: "修繕費", category: "expense" },
  { code: "519", name: "消耗品費", category: "expense" },
  { code: "520", name: "減価償却費", category: "expense" },
  { code: "521", name: "福利厚生費", category: "expense" },
  { code: "522", name: "給料賃金", category: "expense" },
  { code: "523", name: "外注工賃", category: "expense" },
  { code: "524", name: "利子割引料", category: "expense" },
  { code: "525", name: "地代家賃", category: "expense" },
  { code: "530", name: "雑費", category: "expense" },
];

/** 仕訳エントリ */
export interface JournalEntry {
  id: string;
  date: string;          // YYYY-MM-DD
  year: number;
  debitCode: string;     // 借方勘定科目コード
  debitName: string;
  creditCode: string;    // 貸方勘定科目コード
  creditName: string;
  amount: number;
  description: string;   // 摘要
  taxRate: number;       // 消費税率 (0, 8, 10)
  taxAmount: number;     // 消費税額
}

/** 総勘定元帳の1行 */
export interface LedgerLine {
  date: string;
  counterpart: string;  // 相手勘定
  description: string;
  debit: number;
  credit: number;
  balance: number;
}

/** 勘定科目ごとの元帳を生成 */
export function generateLedger(entries: JournalEntry[], accountCode: string): LedgerLine[] {
  const lines: LedgerLine[] = [];
  let balance = 0;

  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));

  for (const e of sorted) {
    if (e.debitCode === accountCode) {
      balance += e.amount;
      lines.push({
        date: e.date,
        counterpart: e.creditName,
        description: e.description,
        debit: e.amount,
        credit: 0,
        balance,
      });
    } else if (e.creditCode === accountCode) {
      balance -= e.amount;
      lines.push({
        date: e.date,
        counterpart: e.debitName,
        description: e.description,
        debit: 0,
        credit: e.amount,
        balance,
      });
    }
  }
  return lines;
}

/** 試算表（残高試算表）を生成 */
export interface TrialBalanceRow {
  code: string;
  name: string;
  category: AccountCategory;
  debitTotal: number;
  creditTotal: number;
  balance: number;
}

export function generateTrialBalance(entries: JournalEntry[], accounts: Account[]): TrialBalanceRow[] {
  const map = new Map<string, { debit: number; credit: number }>();

  for (const e of entries) {
    if (!map.has(e.debitCode)) map.set(e.debitCode, { debit: 0, credit: 0 });
    if (!map.has(e.creditCode)) map.set(e.creditCode, { debit: 0, credit: 0 });
    map.get(e.debitCode)!.debit += e.amount;
    map.get(e.creditCode)!.credit += e.amount;
  }

  const rows: TrialBalanceRow[] = [];
  for (const acc of accounts) {
    const data = map.get(acc.code);
    if (!data) continue;
    rows.push({
      code: acc.code,
      name: acc.name,
      category: acc.category,
      debitTotal: data.debit,
      creditTotal: data.credit,
      balance: data.debit - data.credit,
    });
  }
  return rows.sort((a, b) => a.code.localeCompare(b.code));
}

/** 貸借対照表 (BS) */
export interface BSData {
  assets: { name: string; amount: number }[];
  liabilities: { name: string; amount: number }[];
  equity: { name: string; amount: number }[];
  totalAssets: number;
  totalLiabilities: number;
  totalEquity: number;
  netIncome: number;
}

export function generateBS(entries: JournalEntry[], accounts: Account[]): BSData {
  const tb = generateTrialBalance(entries, accounts);

  const assets = tb.filter(r => r.category === "assets" && r.balance !== 0)
    .map(r => ({ name: r.name, amount: r.balance }));
  const liabilities = tb.filter(r => r.category === "liabilities" && r.balance !== 0)
    .map(r => ({ name: r.name, amount: -r.balance }));
  const equity = tb.filter(r => r.category === "equity" && r.balance !== 0)
    .map(r => ({ name: r.name, amount: -r.balance }));

  const revenue = tb.filter(r => r.category === "revenue").reduce((s, r) => s + r.balance, 0);
  const expense = tb.filter(r => r.category === "expense").reduce((s, r) => s + r.balance, 0);
  const netIncome = -(revenue - expense); // revenue is negative balance

  const totalAssets = assets.reduce((s, a) => s + a.amount, 0);
  const totalLiabilities = liabilities.reduce((s, a) => s + a.amount, 0);
  const totalEquity = equity.reduce((s, a) => s + a.amount, 0) + netIncome;

  return { assets, liabilities, equity, totalAssets, totalLiabilities, totalEquity, netIncome };
}

/** 損益計算書 (PL) */
export interface PLData {
  revenue: { name: string; amount: number }[];
  expenses: { name: string; amount: number }[];
  totalRevenue: number;
  totalExpenses: number;
  netIncome: number;
}

export function generatePL(entries: JournalEntry[], accounts: Account[]): PLData {
  const tb = generateTrialBalance(entries, accounts);

  const revenue = tb.filter(r => r.category === "revenue" && r.balance !== 0)
    .map(r => ({ name: r.name, amount: -r.balance }));
  const expenses = tb.filter(r => r.category === "expense" && r.balance !== 0)
    .map(r => ({ name: r.name, amount: r.balance }));

  const totalRevenue = revenue.reduce((s, a) => s + a.amount, 0);
  const totalExpenses = expenses.reduce((s, a) => s + a.amount, 0);

  return { revenue, expenses, totalRevenue, totalExpenses, netIncome: totalRevenue - totalExpenses };
}
