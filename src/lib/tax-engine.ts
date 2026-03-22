// ── Japanese Tax Calculation Engine (2025 reform) ────────────────────────────

/** 給与所得控除（令和7年/2025年改正） */
export function employmentIncomeDeduction(salary: number): number {
  if (salary <= 1_900_000) return 650_000;
  if (salary <= 3_600_000) return Math.floor(salary * 0.3 + 80_000);
  if (salary <= 6_600_000) return Math.floor(salary * 0.2 + 440_000);
  if (salary <= 8_500_000) return Math.floor(salary * 0.1 + 1_100_000);
  return 1_950_000;
}

/** 所得税の速算表（7段階） */
const TAX_BRACKETS = [
  { upTo: 1_950_000, rate: 0.05, deduction: 0 },
  { upTo: 3_300_000, rate: 0.10, deduction: 97_500 },
  { upTo: 6_950_000, rate: 0.20, deduction: 427_500 },
  { upTo: 9_000_000, rate: 0.23, deduction: 636_000 },
  { upTo: 18_000_000, rate: 0.33, deduction: 1_536_000 },
  { upTo: 40_000_000, rate: 0.40, deduction: 2_796_000 },
  { upTo: Infinity, rate: 0.45, deduction: 4_796_000 },
] as const;

/** 所得税を計算 */
export function calcIncomeTax(taxableIncome: number): number {
  if (taxableIncome <= 0) return 0;
  for (const b of TAX_BRACKETS) {
    if (taxableIncome <= b.upTo) {
      return Math.floor(taxableIncome * b.rate - b.deduction);
    }
  }
  return 0;
}

/** 復興特別所得税（2.1%、2037年まで） */
export function calcReconstructionTax(incomeTax: number): number {
  return Math.floor(incomeTax * 0.021);
}

/** 基礎控除（2025年改正） */
export function basicDeduction2025(income: number): number {
  if (income <= 1_320_000) return 950_000;
  if (income <= 2_160_000) return 880_000;
  if (income <= 2_350_000) return 580_000;
  if (income <= 2_400_000) return 480_000;
  if (income <= 2_450_000) return 320_000;
  if (income <= 2_500_000) return 160_000;
  return 0;
}

/** 医療費控除 */
export function calcMedicalDeduction(total: number, reimbursed: number, income: number): number {
  const threshold = Math.max(100_000, Math.floor(income * 0.05));
  return Math.min(Math.max(0, total - reimbursed - threshold), 2_000_000);
}

/** ふるさと納税 所得税控除分 */
export function calcFurusatoDeduction(donations: number): number {
  return Math.max(0, donations - 2_000);
}

/** ふるさと納税 上限目安 */
export function calcFurusatoLimit(taxableIncome: number, residentRate = 0.10): number {
  if (taxableIncome <= 0) return 0;
  let marginal = 0.05;
  const brackets: [number, number][] = [
    [1_950_000, 0.05], [3_300_000, 0.10], [6_950_000, 0.20],
    [9_000_000, 0.23], [18_000_000, 0.33], [40_000_000, 0.40],
  ];
  for (const [lim, rate] of brackets) {
    if (taxableIncome <= lim) { marginal = rate; break; }
    marginal = 0.45;
  }
  return Math.max(0, Math.floor(
    taxableIncome * residentRate / (1 - marginal * 1.021 - residentRate) + 2_000
  ));
}

/** 生命保険料控除（1枠） */
function lifeInsSlot(premium: number): number {
  if (premium <= 0) return 0;
  if (premium <= 20_000) return premium;
  if (premium <= 40_000) return Math.floor(premium * 0.5 + 10_000);
  if (premium <= 80_000) return Math.floor(premium * 0.25 + 20_000);
  return 40_000;
}

/** 生命保険料控除（3枠合計、上限12万） */
export function calcLifeInsuranceDeduction(general: number, medical: number, pension: number): number {
  return Math.min(lifeInsSlot(general) + lifeInsSlot(medical) + lifeInsSlot(pension), 120_000);
}

/** 地震保険料控除（上限5万） */
export function calcEarthquakeDeduction(premium: number): number {
  return Math.min(Math.max(0, premium), 50_000);
}

/** 配偶者控除 */
export function calcSpouseDeduction(taxpayerIncome: number, spouseIncome: number): number {
  if (taxpayerIncome > 10_000_000 || spouseIncome < 0) return 0;
  const earnings = spouseIncome <= 1_500_000 ? Math.max(0, spouseIncome - 550_000) : spouseIncome;
  if (earnings > 1_330_000) return 0;
  if (earnings <= 480_000) {
    if (taxpayerIncome <= 9_000_000) return 380_000;
    if (taxpayerIncome <= 9_500_000) return 260_000;
    return 130_000;
  }
  const table: [number, number, number, number][] = [
    [950_000, 380_000, 260_000, 130_000], [1_000_000, 360_000, 240_000, 120_000],
    [1_050_000, 310_000, 210_000, 110_000], [1_100_000, 260_000, 180_000, 90_000],
    [1_150_000, 210_000, 140_000, 70_000], [1_200_000, 160_000, 110_000, 60_000],
    [1_250_000, 110_000, 80_000, 40_000], [1_300_000, 60_000, 40_000, 20_000],
    [1_330_000, 30_000, 20_000, 10_000],
  ];
  for (const [lim, d1, d2, d3] of table) {
    if (earnings <= lim) {
      if (taxpayerIncome <= 9_000_000) return d1;
      if (taxpayerIncome <= 9_500_000) return d2;
      return d3;
    }
  }
  return 0;
}

/** 扶養控除 */
export function calcDependentDeduction(ages: number[]): number {
  let total = 0;
  for (const age of ages) {
    if (age < 16) continue;
    else if (age < 19) total += 380_000;
    else if (age < 23) total += 630_000;
    else if (age < 70) total += 380_000;
    else total += 480_000;
  }
  return total;
}

/** 障害者控除 */
export function calcDisabilityDeduction(level: "general" | "special" | "cohabiting_special"): number {
  if (level === "cohabiting_special") return 750_000;
  if (level === "special") return 400_000;
  return 270_000; // general
}

/** 寡婦控除・ひとり親控除 */
export function calcWidowDeduction(type: "widow" | "single_parent"): number {
  return type === "single_parent" ? 350_000 : 270_000;
}

/** 勤労学生控除 */
export function calcStudentDeduction(): number {
  return 270_000;
}

/** 住宅ローン控除 */
export function calcHousingLoanDeduction(loanBalance: number, isFirstYear: boolean, acquisitionDate: string): number {
  if (loanBalance <= 0) return 0;
  const acqYear = new Date(acquisitionDate).getFullYear();
  // 2024年以降の新築は0.7%、上限3000万円
  const maxBalance = acqYear >= 2024 ? 30_000_000 : 40_000_000;
  const rate = 0.007;
  const capped = Math.min(loanBalance, maxBalance);
  return Math.floor(capped * rate);
}

/** 寄附金控除（ふるさと納税以外） */
export function calcOtherDonationDeduction(donations: number): number {
  return Math.max(0, donations - 2_000);
}

/** 雑損控除 */
export function calcCasualtyDeduction(loss: number, insurance: number, income: number): number {
  if (loss <= 0) return 0;
  const netLoss = Math.max(0, loss - insurance);
  const a = Math.max(0, netLoss - Math.floor(income * 0.1));
  const b = Math.max(0, netLoss - 50_000);
  return Math.max(a, b);
}

/** セルフメディケーション税制 */
export function calcSelfMedicationDeduction(total: number): number {
  if (total <= 12_000) return 0;
  return Math.min(total - 12_000, 88_000);
}

/** 退職所得の分離課税 */
export function calcRetirementTax(income: number, yearsOfService: number) {
  if (income <= 0 || yearsOfService <= 0) return { deduction: 0, taxable: 0, tax: 0, reconstruction: 0, total: 0 };
  const deduction = yearsOfService <= 20
    ? Math.max(800_000, 400_000 * yearsOfService)
    : 8_000_000 + 700_000 * (yearsOfService - 20);
  const taxable = Math.floor(Math.max(0, income - deduction) / 2);
  const tax = Math.max(0, calcIncomeTax(taxable));
  const reconstruction = calcReconstructionTax(tax);
  return { deduction, taxable, tax, reconstruction, total: tax + reconstruction };
}

// ── Types ────────────────────────────────────────────────────────────────────

export type IncomeCategory =
  | "salary" | "business" | "dividend" | "real_estate" | "retirement"
  | "capital_gains" | "occasional" | "miscellaneous" | "other";

export interface IncomeEntry {
  id: string;
  date: string;
  year: number;
  amount: number;
  category: IncomeCategory;
  source: string;
  withheld: number;
  note: string;
  yearsOfService?: number;
}

export interface ExpenseEntry {
  id: string;
  date: string;
  year: number;
  amount: number;
  category: string;
  note: string;
}

export interface WithholdingSlip {
  id: string;
  year: number;
  month: number;
  yearMonth: string;
  payer: string;
  withheldAmount: number;
  note: string;
}

export interface ReceiptEntry {
  id: string;
  date: string;
  year: number;
  fileName: string;
  fileId: string;       // Google Drive file ID
  thumbnailUrl?: string;
  category: string;
  amount: number;
  note: string;
}

export interface TaxData {
  incomes: IncomeEntry[];
  expenses: ExpenseEntry[];
  withholding_slips: WithholdingSlip[];
  receipts: ReceiptEntry[];
}

export interface TaxpayerInfo {
  name: string;
  address: string;
  myNumber: string;
  occupation: string;
  birthDate: string;
  phone: string;
  email: string;
  year: number;
}

export interface EstimateParams {
  year: number;
  socialInsurance: number;
  blueDeduction: number;
  extraExpenses: number;
  basicDeduction: number;
  residentBasicDeduction: number;
  residentRate: number;
  residentPerCapita: number;
  medicalTotal: number;
  medicalReimbursement: number;
  furusatoDonations: number;
  lifeInsGeneral: number;
  lifeInsMedical: number;
  lifeInsPension: number;
  earthquakeInsurance: number;
  spouseIncome: number; // -1 = no spouse
  dependentAges: number[];
  ideco: number;
  // Extended fields
  disabilityLevel: "none" | "general" | "special" | "cohabiting_special";
  widowType: "none" | "widow" | "single_parent";
  isStudent: boolean;
  housingLoanBalance: number;
  housingLoanFirstYear: boolean;
  housingLoanAcquisitionDate: string;
  otherDonations: number;
  casualtyLoss: number;
  casualtyInsurance: number;
  selfMedicationTotal: number;
  advanceTaxPayment: number;
  homeOfficeRatio: number; // 0-100
}

/** メイン概算計算 */
export function estimateTax(params: EstimateParams, data: TaxData) {
  const yearIncomes = data.incomes.filter(i => i.year === params.year);
  const yearExpenses = data.expenses.filter(e => e.year === params.year);

  const salary = yearIncomes.filter(i => i.category === "salary").reduce((s, i) => s + i.amount, 0);
  const business = yearIncomes.filter(i => i.category === "business").reduce((s, i) => s + i.amount, 0);
  const other = yearIncomes.filter(i => i.category === "other").reduce((s, i) => s + i.amount, 0);
  const dividend = yearIncomes.filter(i => i.category === "dividend").reduce((s, i) => s + i.amount, 0);
  const realEstate = yearIncomes.filter(i => i.category === "real_estate").reduce((s, i) => s + i.amount, 0);
  const capitalGains = yearIncomes.filter(i => i.category === "capital_gains").reduce((s, i) => s + i.amount, 0);
  const occasional = yearIncomes.filter(i => i.category === "occasional").reduce((s, i) => s + i.amount, 0);
  const miscellaneous = yearIncomes.filter(i => i.category === "miscellaneous").reduce((s, i) => s + i.amount, 0);
  const withheld = yearIncomes.reduce((s, i) => s + i.withheld, 0);
  const totalExpenses = yearExpenses.reduce((s, e) => s + e.amount, 0) + params.extraExpenses;

  const salaryDeduction = salary > 0 ? employmentIncomeDeduction(salary) : 0;
  const taxableSalary = Math.max(0, salary - salaryDeduction);
  const businessTaxable = Math.max(0, business - totalExpenses - params.blueDeduction);
  const occasionalTaxable = Math.floor(Math.max(0, occasional - 500_000) / 2);

  const totalIncome = taxableSalary + businessTaxable + other + dividend + realEstate
    + capitalGains + occasionalTaxable + miscellaneous;

  // Deductions
  const medicalDed = params.medicalTotal > 0
    ? calcMedicalDeduction(params.medicalTotal, params.medicalReimbursement, totalIncome) : 0;
  const furusatoDed = params.furusatoDonations > 2_000 ? calcFurusatoDeduction(params.furusatoDonations) : 0;
  const lifeInsDed = calcLifeInsuranceDeduction(params.lifeInsGeneral, params.lifeInsMedical, params.lifeInsPension);
  const earthquakeDed = calcEarthquakeDeduction(params.earthquakeInsurance);
  const spouseDed = params.spouseIncome >= 0 ? calcSpouseDeduction(totalIncome, params.spouseIncome) : 0;
  const dependentDed = calcDependentDeduction(params.dependentAges);
  const idecoDed = Math.max(0, params.ideco);

  // New deductions
  const disabilityDed = params.disabilityLevel && params.disabilityLevel !== "none"
    ? calcDisabilityDeduction(params.disabilityLevel) : 0;
  const widowDed = params.widowType && params.widowType !== "none"
    ? calcWidowDeduction(params.widowType) : 0;
  const studentDed = params.isStudent ? calcStudentDeduction() : 0;
  const otherDonationDed = params.otherDonations > 0
    ? calcOtherDonationDeduction(params.otherDonations) : 0;
  const casualtyDed = params.casualtyLoss > 0
    ? calcCasualtyDeduction(params.casualtyLoss, params.casualtyInsurance || 0, totalIncome) : 0;
  const selfMedDed = params.selfMedicationTotal > 0 && medicalDed === 0
    ? calcSelfMedicationDeduction(params.selfMedicationTotal) : 0;

  const allDeductions = params.socialInsurance + medicalDed + furusatoDed + lifeInsDed
    + earthquakeDed + spouseDed + dependentDed + idecoDed
    + disabilityDed + widowDed + studentDed + otherDonationDed + casualtyDed + selfMedDed;

  const incomeTaxable = Math.max(0, totalIncome - allDeductions - params.basicDeduction);
  const rawIncomeTax = Math.max(0, calcIncomeTax(incomeTaxable));

  // Housing loan deduction (tax credit, applied after tax calculation)
  const housingLoanDed = params.housingLoanBalance > 0
    ? calcHousingLoanDeduction(
        params.housingLoanBalance,
        params.housingLoanFirstYear || false,
        params.housingLoanAcquisitionDate || "",
      )
    : 0;
  const incomeTax = Math.max(0, rawIncomeTax - housingLoanDed);
  const reconstructionTax = calcReconstructionTax(incomeTax);

  const residentTaxable = Math.max(0, totalIncome - allDeductions - params.residentBasicDeduction);
  const residentTax = Math.max(0, Math.floor(residentTaxable * params.residentRate + params.residentPerCapita));

  // Retirement (separate)
  const retirementEntries = yearIncomes.filter(i => i.category === "retirement");
  let retirementResult = null;
  if (retirementEntries.length > 0) {
    const retTotal = retirementEntries.reduce((s, i) => s + i.amount, 0);
    const retYears = Math.max(1, Math.max(...retirementEntries.map(i => i.yearsOfService || 1)));
    retirementResult = calcRetirementTax(retTotal, retYears);
  }

  const furusatoLimit = calcFurusatoLimit(incomeTaxable, params.residentRate);

  const advanceTaxPayment = Math.max(0, params.advanceTaxPayment || 0);
  const totalTax = incomeTax + reconstructionTax + residentTax + (retirementResult?.total || 0);
  const balance = totalTax - withheld - advanceTaxPayment;

  return {
    salary, business, other, dividend, realEstate, capitalGains, occasional, miscellaneous,
    salaryDeduction, taxableSalary, businessTaxable, totalExpenses,
    totalIncome, withheld,
    deductions: {
      social: params.socialInsurance, medical: medicalDed, furusato: furusatoDed,
      lifeIns: lifeInsDed, earthquake: earthquakeDed, spouse: spouseDed,
      dependent: dependentDed, ideco: idecoDed, blue: params.blueDeduction,
      basic: params.basicDeduction, total: allDeductions + params.basicDeduction,
      disability: disabilityDed, widow: widowDed, student: studentDed,
      otherDonation: otherDonationDed, casualty: casualtyDed,
      selfMedication: selfMedDed, housingLoan: housingLoanDed,
    },
    incomeTaxable, incomeTax, reconstructionTax,
    residentTaxable, residentTax,
    retirementResult, furusatoLimit,
    totalTax, balance, advanceTaxPayment,
    incomeCount: yearIncomes.length,
    expenseCount: yearExpenses.length,
    effectiveRate: totalIncome > 0 ? totalTax / totalIncome : 0,
    homeOfficeRatio: params.homeOfficeRatio || 0,
  };
}
