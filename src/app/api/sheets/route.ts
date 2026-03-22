import { NextRequest, NextResponse } from "next/server";
import { loadData, appendIncome, appendExpense, appendSlip, appendReceipt, deleteRow } from "@/lib/sheets";

export async function GET(request: NextRequest) {
  const debug = new URL(request.url).searchParams.get("debug") === "1";
  try {
    if (debug) {
      const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON || "";
      let decoded: string;
      try {
        decoded = raw.startsWith("{") ? raw : Buffer.from(raw, "base64").toString("utf-8");
      } catch { decoded = "decode_failed"; }
      let parsed: Record<string, unknown> = {};
      try { parsed = JSON.parse(decoded); } catch { /* */ }
      return NextResponse.json({
        rawLen: raw.length,
        rawFirst10: raw.substring(0, 10),
        decodedLen: decoded.length,
        decodedFirst10: decoded.substring(0, 10),
        projectId: parsed.project_id,
        clientEmail: parsed.client_email,
        sheetId: process.env.GOOGLE_SPREADSHEET_ID,
      });
    }
    const data = await loadData();
    return NextResponse.json(data);
  } catch (e: unknown) {
    const err = e as { message?: string; code?: number; errors?: { message: string }[] };
    return NextResponse.json({
      error: err.message || "Unknown error",
      code: err.code,
      details: err.errors,
    }, { status: 500 });
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
