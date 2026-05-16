import { promises as fs } from "fs";
import path from "path";
import { NextResponse } from "next/server";
import { DEFAULT_INVOICE_TEMPLATE } from "@/lib/document-templates/constants";

type TemplateRecord = {
  id: string;
  name: string;
  type: "invoice" | "offer";
  active?: boolean;
  updatedAt: string;
  data: any;
};

const DATA_DIR = path.join(process.cwd(), "data");
const FILE_PATH = path.join(DATA_DIR, "templates.json");

async function ensureStore() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(FILE_PATH);
  } catch {
    const seed: TemplateRecord[] = [
      {
        id: "default-invoice",
        name: "Standard Rechnung",
        type: "invoice",
        active: true,
        updatedAt: new Date().toISOString(),
        data: { ...DEFAULT_INVOICE_TEMPLATE, id: "default-invoice", name: "Standard Rechnung" },
      },
    ];
    await fs.writeFile(FILE_PATH, JSON.stringify(seed, null, 2), "utf8");
  }
}

async function readAll(): Promise<TemplateRecord[]> {
  await ensureStore();
  const raw = await fs.readFile(FILE_PATH, "utf8");
  return JSON.parse(raw);
}

async function writeAll(items: TemplateRecord[]) {
  await ensureStore();
  await fs.writeFile(FILE_PATH, JSON.stringify(items, null, 2), "utf8");
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const type = searchParams.get("type");

  const all = await readAll();

  if (id) {
    const found = all.find((t) => t.id === id);
    if (!found) return NextResponse.json({ error: "not_found" }, { status: 404 });
    return NextResponse.json(found, { status: 200 });
  }

  const list = type ? all.filter((t) => t.type === type) : all;
  return NextResponse.json(list, { status: 200 });
}

export async function POST(request: Request) {
  const body = await request.json();
  const all = await readAll();

  const id = body.id || `tpl-${Math.random().toString(36).slice(2, 8)}`;
  const now = new Date().toISOString();

  const incoming: TemplateRecord = {
    id,
    name: body.name || "Neue Vorlage",
    type: body.type || "invoice",
    active: !!body.active,
    updatedAt: now,
    data: body.data ?? body,
  };

  const idx = all.findIndex((t) => t.id === id);
  if (idx >= 0) {
    all[idx] = { ...all[idx], ...incoming, updatedAt: now };
  } else {
    all.push(incoming);
  }

  if (incoming.active) {
    for (const t of all) {
      if (t.type === incoming.type && t.id !== incoming.id) t.active = false;
    }
  }

  await writeAll(all);
  return NextResponse.json({ ok: true, id }, { status: 200 });
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "missing_id" }, { status: 400 });

  const all = await readAll();
  const next = all.filter((t) => t.id !== id);

  if (next.length === all.length) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  await writeAll(next);
  return NextResponse.json({ ok: true }, { status: 200 });
}
