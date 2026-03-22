import { google } from "googleapis";

export function getAuth() {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!raw) {
    throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON environment variable is not set");
  }
  // Support both raw JSON and Base64-encoded JSON
  let jsonStr: string;
  try {
    jsonStr = raw.startsWith("{") ? raw : Buffer.from(raw, "base64").toString("utf-8");
  } catch {
    jsonStr = raw;
  }
  const parsed = JSON.parse(jsonStr);
  return new google.auth.GoogleAuth({
    credentials: parsed,
    scopes: [
      "https://www.googleapis.com/auth/spreadsheets",
      "https://www.googleapis.com/auth/drive.file",
      "https://www.googleapis.com/auth/cloud-vision",
    ],
  });
}

export function getSheets() {
  return google.sheets({ version: "v4", auth: getAuth() });
}

export function getDrive() {
  return google.drive({ version: "v3", auth: getAuth() });
}

export function getSpreadsheetId(): string {
  const id = process.env.GOOGLE_SPREADSHEET_ID;
  if (!id) throw new Error("GOOGLE_SPREADSHEET_ID environment variable is not set");
  return id;
}

export function getDriveFolderId(): string {
  return process.env.GOOGLE_DRIVE_FOLDER_ID || "";
}
