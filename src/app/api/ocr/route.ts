import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { getAuth } from "@/lib/google-auth";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const base64 = buffer.toString("base64");

    const auth = getAuth();
    const vision = google.vision({ version: "v1", auth });

    const result = await vision.images.annotate({
      requestBody: {
        requests: [
          {
            image: { content: base64 },
            features: [{ type: "TEXT_DETECTION" }],
          },
        ],
      },
    });

    const annotations = result.data.responses?.[0];
    const fullText = annotations?.fullTextAnnotation?.text || "";
    const textAnnotations = annotations?.textAnnotations || [];

    const parsed = parseReceiptText(fullText);

    return NextResponse.json({
      fullText,
      annotations: textAnnotations.slice(0, 20).map(a => ({
        description: a.description,
        boundingPoly: a.boundingPoly,
      })),
      parsed,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "OCR failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

interface ParsedReceipt {
  amount: number | null;
  date: string | null;
  store: string | null;
}

function parseReceiptText(text: string): ParsedReceipt {
  const lines = text.split("\n").map(l => l.trim()).filter(Boolean);

  return {
    amount: extractAmount(text),
    date: extractDate(text),
    store: extractStore(lines),
  };
}

function extractAmount(text: string): number | null {
  const patterns = [
    /(?:合計|Total|TOTAL|総額|お支払い|お買上|税込)[^\d]*[¥￥]?\s*([\d,]+)/,
    /[¥￥]\s*([\d,]+)/g,
    /([\d,]{3,})\s*(?:円|yen)/i,
  ];

  let maxAmount = 0;

  for (const pattern of patterns) {
    const matches = text.matchAll(new RegExp(pattern.source, pattern.flags || "g"));
    for (const match of matches) {
      const num = parseInt(match[1].replace(/,/g, ""), 10);
      if (!isNaN(num) && num > maxAmount) {
        maxAmount = num;
      }
    }
  }

  return maxAmount > 0 ? maxAmount : null;
}

function extractDate(text: string): string | null {
  // YYYY/MM/DD or YYYY-MM-DD
  const isoMatch = text.match(/(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
  if (isoMatch) {
    const [, y, m, d] = isoMatch;
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }

  // Japanese era date: R5.10.15, 令和5年10月15日
  const eraMatch = text.match(/(?:令和|R)\s*(\d{1,2})\s*[年.\/]\s*(\d{1,2})\s*[月.\/]\s*(\d{1,2})/);
  if (eraMatch) {
    const [, eraYear, m, d] = eraMatch;
    const year = 2018 + parseInt(eraYear, 10);
    return `${year}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }

  return null;
}

function extractStore(lines: string[]): string | null {
  if (lines.length === 0) return null;
  // First non-empty line that isn't a date or number
  for (const line of lines.slice(0, 3)) {
    if (/^\d{4}[\/\-]/.test(line)) continue;
    if (/^[\d,¥￥]+$/.test(line)) continue;
    if (line.length > 1) return line;
  }
  return lines[0] || null;
}
