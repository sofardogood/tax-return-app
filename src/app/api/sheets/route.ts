import { NextRequest, NextResponse } from "next/server";
import { loadData, appendIncome, appendExpense, appendSlip, appendReceipt, deleteRow } from "@/lib/sheets";

export async function GET() {
  try {
    const data = await loadData();
    return NextResponse.json(data);
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
