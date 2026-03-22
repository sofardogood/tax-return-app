// ── 消費税・インボイス計算エンジン ────────────────────────────────────────────

/** 消費税区分 */
export type TaxClassification = "taxable_10" | "taxable_8" | "exempt" | "non_taxable" | "export";

export const TAX_CLASSIFICATIONS: { value: TaxClassification; label: string; rate: number }[] = [
  { value: "taxable_10", label: "課税（10%）", rate: 0.10 },
  { value: "taxable_8", label: "課税（軽減8%）", rate: 0.08 },
  { value: "exempt", label: "免税", rate: 0 },
  { value: "non_taxable", label: "非課税", rate: 0 },
  { value: "export", label: "輸出免税", rate: 0 },
];

/** 消費税の計算方式 */
export type TaxCalcMethod = "general" | "simplified";

/** 簡易課税のみなし仕入率 */
export const SIMPLIFIED_RATES: { type: number; label: string; rate: number }[] = [
  { type: 1, label: "第1種（卸売業）", rate: 0.90 },
  { type: 2, label: "第2種（小売業）", rate: 0.80 },
  { type: 3, label: "第3種（製造業等）", rate: 0.70 },
  { type: 4, label: "第4種（その他）", rate: 0.60 },
  { type: 5, label: "第5種（サービス業等）", rate: 0.50 },
  { type: 6, label: "第6種（不動産業）", rate: 0.40 },
];

/** 消費税計算入力 */
export interface ConsumptionTaxInput {
  // 課税売上
  taxableSales10: number;      // 10%対象売上（税抜）
  taxableSales8: number;       // 8%対象売上（税抜）
  exportSales: number;         // 輸出免税売上
  exemptSales: number;         // 非課税売上

  // 課税仕入
  taxablePurchases10: number;  // 10%対象仕入（税込）
  taxablePurchases8: number;   // 8%対象仕入（税込）

  // 計算方式
  method: TaxCalcMethod;
  simplifiedType: number;      // 簡易課税の事業区分 (1-6)
}

/** 消費税計算結果 */
export interface ConsumptionTaxResult {
  // 売上に係る消費税
  salesTax10: number;
  salesTax8: number;
  totalSalesTax: number;

  // 仕入税額控除
  purchaseTax10: number;
  purchaseTax8: number;
  totalPurchaseTax: number;

  // 納付税額
  consumptionTax: number;     // 消費税額
  localConsumptionTax: number; // 地方消費税額
  totalTaxPayable: number;     // 合計納付額

  // 参考
  method: TaxCalcMethod;
  taxableRatio: number;        // 課税売上割合
}

/** 消費税を計算 */
export function calcConsumptionTax(input: ConsumptionTaxInput): ConsumptionTaxResult {
  // 売上に係る消費税
  const salesTax10 = Math.floor(input.taxableSales10 * 0.10);
  const salesTax8 = Math.floor(input.taxableSales8 * 0.08);
  const totalSalesTax = salesTax10 + salesTax8;

  // 課税売上割合
  const totalTaxableSales = input.taxableSales10 + input.taxableSales8 + input.exportSales;
  const totalSales = totalTaxableSales + input.exemptSales;
  const taxableRatio = totalSales > 0 ? totalTaxableSales / totalSales : 1;

  let totalPurchaseTax: number;
  let purchaseTax10: number;
  let purchaseTax8: number;

  if (input.method === "simplified") {
    // 簡易課税
    const rate = SIMPLIFIED_RATES.find(r => r.type === input.simplifiedType)?.rate || 0.50;
    totalPurchaseTax = Math.floor(totalSalesTax * rate);
    purchaseTax10 = Math.floor(salesTax10 * rate);
    purchaseTax8 = Math.floor(salesTax8 * rate);
  } else {
    // 一般課税（本則課税）
    purchaseTax10 = Math.floor(input.taxablePurchases10 * 10 / 110);
    purchaseTax8 = Math.floor(input.taxablePurchases8 * 8 / 108);
    totalPurchaseTax = purchaseTax10 + purchaseTax8;

    // 課税売上割合が95%未満の場合は按分
    if (taxableRatio < 0.95) {
      totalPurchaseTax = Math.floor(totalPurchaseTax * taxableRatio);
      purchaseTax10 = Math.floor(purchaseTax10 * taxableRatio);
      purchaseTax8 = Math.floor(purchaseTax8 * taxableRatio);
    }
  }

  // 納付消費税 = 売上消費税 - 仕入税額控除
  const rawTax = Math.max(0, totalSalesTax - totalPurchaseTax);
  // 国税分: 消費税10%のうち7.8%が国税、8%のうち6.24%が国税
  // 簡易計算: rawTax * 78/100
  const consumptionTax = Math.floor(rawTax * 78 / 100);

  // 地方消費税（国税の22/78）
  const localConsumptionTax = Math.floor(consumptionTax * 22 / 78);

  return {
    salesTax10, salesTax8, totalSalesTax,
    purchaseTax10, purchaseTax8, totalPurchaseTax,
    consumptionTax: Math.max(0, consumptionTax),
    localConsumptionTax: Math.max(0, localConsumptionTax),
    totalTaxPayable: Math.max(0, consumptionTax + localConsumptionTax),
    method: input.method,
    taxableRatio,
  };
}

/** 免税事業者かどうかの判定（基準期間の課税売上が1000万円以下） */
export function isExemptBusiness(basePeriodSales: number): boolean {
  return basePeriodSales <= 10_000_000;
}

/** インボイス（適格請求書）データ */
export interface Invoice {
  id: string;
  invoiceNumber: string;    // インボイス番号（T+13桁）
  issueDate: string;
  dueDate: string;
  clientName: string;
  clientAddress: string;
  items: InvoiceItem[];
  subtotal10: number;
  subtotal8: number;
  tax10: number;
  tax8: number;
  total: number;
  note: string;
  year: number;
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: 10 | 8;
  amount: number;
}

/** インボイスの合計を計算 */
export function calcInvoiceTotals(items: InvoiceItem[]): {
  subtotal10: number; subtotal8: number;
  tax10: number; tax8: number; total: number;
} {
  const subtotal10 = items.filter(i => i.taxRate === 10).reduce((s, i) => s + i.amount, 0);
  const subtotal8 = items.filter(i => i.taxRate === 8).reduce((s, i) => s + i.amount, 0);
  const tax10 = Math.floor(subtotal10 * 0.10);
  const tax8 = Math.floor(subtotal8 * 0.08);
  return { subtotal10, subtotal8, tax10, tax8, total: subtotal10 + subtotal8 + tax10 + tax8 };
}
