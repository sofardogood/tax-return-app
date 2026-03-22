import { NextRequest, NextResponse } from "next/server";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { loadData, loadJournalEntries, loadTaxpayerInfo } from "@/lib/sheets";
import { estimateTax, basicDeduction2025, type EstimateParams } from "@/lib/tax-engine";

const PAGE_W = 595.28; // A4
const PAGE_H = 841.89;
const MARGIN = 50;

function drawText(
  page: ReturnType<PDFDocument["addPage"]>,
  font: Awaited<ReturnType<PDFDocument["embedFont"]>>,
  text: string,
  x: number,
  y: number,
  size = 10,
) {
  page.drawText(text, { x, y, size, font, color: rgb(0, 0, 0) });
}

function drawRow(
  page: ReturnType<PDFDocument["addPage"]>,
  font: Awaited<ReturnType<PDFDocument["embedFont"]>>,
  label: string,
  value: string,
  x: number,
  y: number,
  labelW = 200,
) {
  drawText(page, font, label, x, y, 9);
  drawText(page, font, value, x + labelW, y, 9);
}

function drawTableHeader(
  page: ReturnType<PDFDocument["addPage"]>,
  font: Awaited<ReturnType<PDFDocument["embedFont"]>>,
  title: string,
  y: number,
) {
  page.drawRectangle({
    x: MARGIN,
    y: y - 2,
    width: PAGE_W - MARGIN * 2,
    height: 16,
    color: rgb(0.9, 0.9, 0.95),
  });
  drawText(page, font, title, MARGIN + 4, y, 11);
}

function fmt(n: number): string {
  return n.toLocaleString("en-US");
}

export async function GET(request: NextRequest) {
  const year = Number(request.nextUrl.searchParams.get("year") || new Date().getFullYear());

  const [data, journalEntries, taxpayers] = await Promise.all([
    loadData(),
    loadJournalEntries(),
    loadTaxpayerInfo(),
  ]);

  const taxpayer = taxpayers.find(t => t.year === year);

  const params: EstimateParams = {
    year,
    socialInsurance: 0,
    blueDeduction: 650_000,
    extraExpenses: 0,
    basicDeduction: basicDeduction2025(0),
    residentBasicDeduction: 430_000,
    residentRate: 0.10,
    residentPerCapita: 5_000,
    medicalTotal: 0,
    medicalReimbursement: 0,
    furusatoDonations: 0,
    lifeInsGeneral: 0,
    lifeInsMedical: 0,
    lifeInsPension: 0,
    earthquakeInsurance: 0,
    spouseIncome: -1,
    dependentAges: [],
    ideco: 0,
    disabilityLevel: "none",
    widowType: "none",
    isStudent: false,
    housingLoanBalance: 0,
    housingLoanFirstYear: false,
    housingLoanAcquisitionDate: "",
    otherDonations: 0,
    casualtyLoss: 0,
    casualtyInsurance: 0,
    selfMedicationTotal: 0,
    advanceTaxPayment: 0,
    homeOfficeRatio: 0,
  };

  const result = estimateTax(params, data);

  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // ── Page 1: Kakutei Shinkoku B ──────────────────────────────────────────────
  const p1 = pdfDoc.addPage([PAGE_W, PAGE_H]);
  let y = PAGE_H - MARGIN;

  drawText(p1, fontBold, `Tax Return (Kakutei Shinkoku B) - ${year}`, MARGIN, y, 14);
  y -= 20;
  if (taxpayer) {
    drawText(p1, font, `Name: ${taxpayer.name}  Address: ${taxpayer.address}`, MARGIN, y, 9);
    y -= 14;
    drawText(p1, font, `My Number: ${taxpayer.myNumber}  Occupation: ${taxpayer.occupation}`, MARGIN, y, 9);
    y -= 14;
  }
  y -= 10;

  // Income section
  drawTableHeader(p1, fontBold, "Income (Shuunyuu Kingaku)", y);
  y -= 20;
  const incomeRows: [string, number][] = [
    ["Salary (Kyuuyo)", result.salary],
    ["Business (Jigyou)", result.business],
    ["Real Estate (Fudousan)", result.realEstate],
    ["Dividend (Haitou)", result.dividend],
    ["Capital Gains (Joto)", result.capitalGains],
    ["Occasional (Ichiji)", result.occasional],
    ["Miscellaneous (Zatsu)", result.miscellaneous],
    ["Other (Sonota)", result.other],
  ];
  for (const [label, val] of incomeRows) {
    if (val > 0) {
      drawRow(p1, font, label, fmt(val), MARGIN + 10, y);
      y -= 14;
    }
  }
  y -= 6;

  // Shotoku section
  drawTableHeader(p1, fontBold, "Income Amount (Shotoku Kingaku)", y);
  y -= 20;
  drawRow(p1, font, "Salary Income (Kyuuyo Shotoku)", fmt(result.taxableSalary), MARGIN + 10, y);
  y -= 14;
  drawRow(p1, font, "Business Income (Jigyou Shotoku)", fmt(result.businessTaxable), MARGIN + 10, y);
  y -= 14;
  drawRow(p1, font, "Total Income (Gokei Shotoku)", fmt(result.totalIncome), MARGIN + 10, y);
  y -= 20;

  // Deductions section
  drawTableHeader(p1, fontBold, "Deductions (Shotoku Koujo)", y);
  y -= 20;
  const deductionRows: [string, number][] = [
    ["Social Insurance (Shakai Hoken)", result.deductions.social],
    ["Medical (Iryouhi)", result.deductions.medical],
    ["Life Insurance (Seimei Hoken)", result.deductions.lifeIns],
    ["Earthquake Ins. (Jishin Hoken)", result.deductions.earthquake],
    ["Spouse (Haigusha)", result.deductions.spouse],
    ["Dependent (Fuyou)", result.deductions.dependent],
    ["iDeCo", result.deductions.ideco],
    ["Furusato Nozei", result.deductions.furusato],
    ["Basic (Kiso Koujo)", result.deductions.basic],
    ["Blue Return (Aoiro)", result.deductions.blue],
  ];
  for (const [label, val] of deductionRows) {
    if (val > 0) {
      drawRow(p1, font, label, fmt(val), MARGIN + 10, y);
      y -= 14;
    }
  }
  drawRow(p1, fontBold, "Total Deductions", fmt(result.deductions.total), MARGIN + 10, y);
  y -= 20;

  // Tax calculation section
  drawTableHeader(p1, fontBold, "Tax Calculation (Zei Keisan)", y);
  y -= 20;
  drawRow(p1, font, "Taxable Income (Kazei Shotoku)", fmt(result.incomeTaxable), MARGIN + 10, y);
  y -= 14;
  drawRow(p1, font, "Income Tax (Shotokuzei)", fmt(result.incomeTax), MARGIN + 10, y);
  y -= 14;
  drawRow(p1, font, "Reconstruction Tax (Fukkou Tokubetsuzei)", fmt(result.reconstructionTax), MARGIN + 10, y);
  y -= 14;
  drawRow(p1, font, "Resident Tax (Juuminzei)", fmt(result.residentTax), MARGIN + 10, y);
  y -= 14;
  drawRow(p1, fontBold, "Total Tax (Gokei Zeigaku)", fmt(result.totalTax), MARGIN + 10, y);
  y -= 14;
  drawRow(p1, font, "Withheld (Gensen Choushuu)", fmt(result.withheld), MARGIN + 10, y);
  y -= 14;
  const balanceLabel = result.balance >= 0 ? "Tax Due (Noufu)" : "Refund (Kanpu)";
  drawRow(p1, fontBold, balanceLabel, fmt(Math.abs(result.balance)), MARGIN + 10, y);

  // ── Page 2: Blue Return Decision Sheet ──────────────────────────────────────
  const p2 = pdfDoc.addPage([PAGE_W, PAGE_H]);
  y = PAGE_H - MARGIN;

  drawText(p2, fontBold, `Blue Return (Aoiro Shinkoku Kessansho) - ${year}`, MARGIN, y, 14);
  y -= 30;

  // Revenue
  drawTableHeader(p2, fontBold, "Revenue (Uriage)", y);
  y -= 20;

  const yearJournals = journalEntries.filter(j => j.year === year);
  const revenueEntries = yearJournals.filter(j => j.creditCode.startsWith("4"));
  const totalRevenue = revenueEntries.reduce((s, e) => s + e.amount, 0);

  // Group revenue by credit name
  const revenueByName = new Map<string, number>();
  for (const e of revenueEntries) {
    revenueByName.set(e.creditName, (revenueByName.get(e.creditName) || 0) + e.amount);
  }
  for (const [name, amount] of revenueByName) {
    drawRow(p2, font, name, fmt(amount), MARGIN + 10, y);
    y -= 14;
  }
  if (revenueByName.size === 0) {
    drawRow(p2, font, "Business Revenue", fmt(result.business), MARGIN + 10, y);
    y -= 14;
  }
  drawRow(p2, fontBold, "Total Revenue", fmt(totalRevenue || result.business), MARGIN + 10, y);
  y -= 20;

  // Expenses breakdown
  drawTableHeader(p2, fontBold, "Expenses Breakdown (Keihi Uchiwake)", y);
  y -= 20;

  const expenseEntries = yearJournals.filter(j => j.debitCode.startsWith("5"));
  const expenseByName = new Map<string, number>();
  for (const e of expenseEntries) {
    expenseByName.set(e.debitName, (expenseByName.get(e.debitName) || 0) + e.amount);
  }

  let totalJournalExpenses = 0;
  for (const [name, amount] of expenseByName) {
    drawRow(p2, font, name, fmt(amount), MARGIN + 10, y);
    y -= 14;
    totalJournalExpenses += amount;
  }

  // Also include simple expenses
  const yearExpenses = data.expenses.filter(e => e.year === year);
  const expByCat = new Map<string, number>();
  for (const e of yearExpenses) {
    expByCat.set(e.category, (expByCat.get(e.category) || 0) + e.amount);
  }
  for (const [cat, amount] of expByCat) {
    drawRow(p2, font, cat, fmt(amount), MARGIN + 10, y);
    y -= 14;
    totalJournalExpenses += amount;
  }

  const allExpenses = totalJournalExpenses || result.totalExpenses;
  drawRow(p2, fontBold, "Total Expenses", fmt(allExpenses), MARGIN + 10, y);
  y -= 20;

  // Summary
  drawTableHeader(p2, fontBold, "Summary (Sashihiki Kingaku)", y);
  y -= 20;
  const netIncome = (totalRevenue || result.business) - allExpenses;
  drawRow(p2, font, "Revenue - Expenses", fmt(netIncome), MARGIN + 10, y);
  y -= 14;
  drawRow(p2, font, "Blue Return Deduction", fmt(params.blueDeduction), MARGIN + 10, y);
  y -= 14;
  drawRow(p2, fontBold, "Taxable Business Income", fmt(Math.max(0, netIncome - params.blueDeduction)), MARGIN + 10, y);

  const pdfBytes = await pdfDoc.save();

  return new NextResponse(Buffer.from(pdfBytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="tax-return-${year}.pdf"`,
    },
  });
}
