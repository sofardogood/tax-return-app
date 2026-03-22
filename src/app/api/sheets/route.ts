import { NextRequest, NextResponse } from "next/server";
import {
  loadData, appendIncome, appendExpense, appendSlip, appendReceipt,
  loadJournalEntries, appendJournalEntry, deleteJournalEntry,
  loadFixedAssets, appendFixedAsset, deleteFixedAsset,
  loadInvoices, appendInvoice, deleteInvoice,
  loadTaxpayerInfo, appendTaxpayerInfo, deleteTaxpayerInfo,
  deleteRow,
} from "@/lib/sheets";

export async function GET() {
  try {
    const [data, journal, fixedAssets, invoices, taxpayerInfo] = await Promise.all([
      loadData(),
      loadJournalEntries(),
      loadFixedAssets(),
      loadInvoices(),
      loadTaxpayerInfo(),
    ]);
    return NextResponse.json({ ...data, journal, fixedAssets, invoices, taxpayerInfo });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, entry } = body;

    switch (type) {
      case "income":
        await appendIncome(entry);
        break;
      case "expense":
        await appendExpense(entry);
        break;
      case "slip":
        await appendSlip(entry);
        break;
      case "receipt":
        await appendReceipt(entry);
        break;
      case "journal":
        await appendJournalEntry(entry);
        break;
      case "fixed_asset":
        await appendFixedAsset(entry);
        break;
      case "invoice":
        await appendInvoice(entry);
        break;
      case "taxpayer":
        await appendTaxpayerInfo(entry);
        break;
      default:
        return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }
    return NextResponse.json({ success: true });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sheet = searchParams.get("sheet");
    const id = searchParams.get("id");
    if (!sheet || !id) {
      return NextResponse.json({ error: "Missing sheet or id" }, { status: 400 });
    }
    await deleteRow(sheet, id);
    return NextResponse.json({ success: true });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
