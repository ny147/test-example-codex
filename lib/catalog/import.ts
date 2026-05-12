import type { CatalogItem, CatalogStatus, ImportError, ImportResult } from "./types";

type CsvRecord = Record<string, string>;

const requiredHeaders = [
  "name",
  "owner",
  "domain",
  "type",
  "status",
  "sensitivity",
  "freshness",
  "records",
  "description"
];

const statuses = new Set<CatalogStatus>(["Certified", "Draft", "Deprecated"]);
const sensitivities = new Set<CatalogItem["sensitivity"]>([
  "Public",
  "Internal",
  "Confidential"
]);

export function parseCatalogCsv(text: string): { rows: CsvRecord[]; errors: ImportError[] } {
  const lines = text
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0);

  if (lines.length < 2) {
    return {
      rows: [],
      errors: [{ row: 0, field: "file", message: "CSV must include headers and at least one row." }]
    };
  }

  const headers = splitCsvLine(lines[0]).map((header) => header.trim());
  const missingHeaders = requiredHeaders.filter((header) => !headers.includes(header));

  if (missingHeaders.length > 0) {
    return {
      rows: [],
      errors: missingHeaders.map((header) => ({
        row: 1,
        field: header,
        message: `Missing required column "${header}".`
      }))
    };
  }

  const rows = lines.slice(1).map((line) => {
    const values = splitCsvLine(line);
    return headers.reduce<CsvRecord>((record, header, index) => {
      record[header] = values[index]?.trim() ?? "";
      return record;
    }, {});
  });

  return { rows, errors: [] };
}

export function validateImportedCatalogRows(records: CsvRecord[]): ImportResult {
  const errors: ImportError[] = [];
  const rows: CatalogItem[] = [];

  records.forEach((record, index) => {
    const rowNumber = index + 2;

    for (const header of requiredHeaders) {
      if (!record[header]) {
        errors.push({ row: rowNumber, field: header, message: "Value is required." });
      }
    }

    if (record.status && !statuses.has(record.status as CatalogStatus)) {
      errors.push({
        row: rowNumber,
        field: "status",
        message: "Use Certified, Draft, or Deprecated."
      });
    }

    if (
      record.sensitivity &&
      !sensitivities.has(record.sensitivity as CatalogItem["sensitivity"])
    ) {
      errors.push({
        row: rowNumber,
        field: "sensitivity",
        message: "Use Public, Internal, or Confidential."
      });
    }

    const recordCount = Number(record.records);
    if (!Number.isInteger(recordCount) || recordCount < 0) {
      errors.push({
        row: rowNumber,
        field: "records",
        message: "Use a non-negative whole number."
      });
    }

    if (record.freshness && Number.isNaN(Date.parse(record.freshness))) {
      errors.push({
        row: rowNumber,
        field: "freshness",
        message: "Use a valid date such as 2026-05-12."
      });
    }

    rows.push({
      id: slugify(`${record.domain}-${record.name}-${rowNumber}`),
      name: record.name,
      owner: record.owner,
      domain: record.domain,
      type: record.type,
      status: record.status as CatalogStatus,
      sensitivity: record.sensitivity as CatalogItem["sensitivity"],
      freshness: record.freshness,
      records: recordCount,
      description: record.description
    });
  });

  return { rows: errors.length > 0 ? [] : rows, errors };
}

function splitCsvLine(line: string) {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const nextChar = line[index + 1];

    if (char === '"' && nextChar === '"') {
      current += '"';
      index += 1;
      continue;
    }

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === "," && !inQuotes) {
      values.push(current);
      current = "";
      continue;
    }

    current += char;
  }

  values.push(current);
  return values;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
