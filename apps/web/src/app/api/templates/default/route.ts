import { promises as fs } from "fs";
import path from "path";
import { NextResponse } from "next/server";
import { DEFAULT_INVOICE_TEMPLATE } from "@/lib/document-templates/constants";
import { demoModeResponse, isDemoMode } from "@/lib/demo-mode";

const APP_ROOT = process.cwd();
const DATA_DIR = path.join(APP_ROOT, "data");
const FILE_PATH = path.join(DATA_DIR, "default-template.json");

async function ensureDataDir() {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

export async function GET() {
  try {
    await ensureDataDir();
    const raw = await fs.readFile(FILE_PATH, "utf8");
    return NextResponse.json(JSON.parse(raw), { status: 200 });
  } catch {
    return NextResponse.json(
      { ...DEFAULT_INVOICE_TEMPLATE, id: "default-template", name: "Dream Invoice Standard" },
      { status: 200 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (isDemoMode()) {
      return NextResponse.json(demoModeResponse({ ok: true, template: body }), { status: 200 });
    }

    await ensureDataDir();
    await fs.writeFile(FILE_PATH, JSON.stringify(body, null, 2), "utf8");
    return NextResponse.json({ ok: true, filePath: FILE_PATH }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ ok: false, error: "save failed" }, { status: 500 });
  }
}
