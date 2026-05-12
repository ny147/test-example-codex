import { NextResponse } from "next/server";
import {
  parseCatalogCsv,
  validateImportedCatalogRows
} from "@/lib/catalog/import";

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json(
      { rows: [], errors: [{ row: 0, field: "file", message: "Upload a CSV file." }] },
      { status: 400 }
    );
  }

  if (!file.name.toLowerCase().endsWith(".csv")) {
    return NextResponse.json(
      {
        rows: [],
        errors: [{ row: 0, field: "file", message: "Only CSV files are supported." }]
      },
      { status: 400 }
    );
  }

  const text = await file.text();
  const parsed = parseCatalogCsv(text);

  if (parsed.errors.length > 0) {
    return NextResponse.json({ rows: [], errors: parsed.errors }, { status: 400 });
  }

  const result = validateImportedCatalogRows(parsed.rows);
  return NextResponse.json(result, { status: result.errors.length ? 422 : 200 });
}
