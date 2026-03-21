import { NextRequest, NextResponse } from "next/server";
import { getDrive, getDriveFolderId } from "@/lib/google-auth";
import { Readable } from "stream";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const drive = getDrive();
    const folderId = getDriveFolderId();

    const buffer = Buffer.from(await file.arrayBuffer());
    const stream = new Readable();
    stream.push(buffer);
    stream.push(null);

    const fileMetadata: { name: string; parents?: string[] } = {
      name: `${Date.now()}_${file.name}`,
    };
    if (folderId) {
      fileMetadata.parents = [folderId];
    }

    const res = await drive.files.create({
      requestBody: fileMetadata,
      media: {
        mimeType: file.type,
        body: stream,
      },
      fields: "id,name,thumbnailLink,webViewLink",
    });

    return NextResponse.json({
      fileId: res.data.id,
      fileName: res.data.name,
      thumbnailUrl: res.data.thumbnailLink || "",
      webViewLink: res.data.webViewLink || "",
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
