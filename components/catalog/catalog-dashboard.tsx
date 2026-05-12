"use client";

import { ChangeEvent, useMemo, useRef, useState } from "react";
import type { CatalogItem, ImportError, ImportResult } from "@/lib/catalog/types";

type Props = {
  initialItems: CatalogItem[];
};

const statusOptions = ["All", "Certified", "Draft", "Deprecated"] as const;

export function CatalogDashboard({ initialItems }: Props) {
  const [items, setItems] = useState(initialItems);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<(typeof statusOptions)[number]>("All");
  const [domain, setDomain] = useState("All");
  const [importErrors, setImportErrors] = useState<ImportError[]>([]);
  const [importedRows, setImportedRows] = useState<CatalogItem[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [notice, setNotice] = useState("Ready to import a CSV file.");
  const inputRef = useRef<HTMLInputElement>(null);

  const domains = useMemo(
    () => ["All", ...Array.from(new Set(items.map((item) => item.domain))).sort()],
    [items]
  );

  const filteredItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return items.filter((item) => {
      const matchesQuery =
        normalizedQuery.length === 0 ||
        [item.name, item.owner, item.domain, item.type, item.description]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery);
      const matchesStatus = status === "All" || item.status === status;
      const matchesDomain = domain === "All" || item.domain === domain;

      return matchesQuery && matchesStatus && matchesDomain;
    });
  }, [domain, items, query, status]);

  const certifiedCount = items.filter((item) => item.status === "Certified").length;
  const totalRecords = items.reduce((sum, item) => sum + item.records, 0);
  const latestFreshness = items
    .map((item) => item.freshness)
    .sort()
    .at(-1);

  async function importFile(file: File) {
    setIsImporting(true);
    setImportErrors([]);
    setImportedRows([]);
    setNotice(`Validating ${file.name}...`);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/catalog/import", {
        method: "POST",
        body: formData
      });
      const result = (await response.json()) as ImportResult;

      if (!response.ok || result.errors.length > 0) {
        setImportErrors(result.errors);
        setNotice(`Found ${result.errors.length} issue${result.errors.length === 1 ? "" : "s"}.`);
        return;
      }

      setItems((currentItems) => [...result.rows, ...currentItems]);
      setImportedRows(result.rows);
      setNotice(`Imported ${result.rows.length} catalog item${result.rows.length === 1 ? "" : "s"}.`);
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    } catch {
      setImportErrors([{ row: 0, field: "network", message: "Import failed. Try again." }]);
      setNotice("Import failed.");
    } finally {
      setIsImporting(false);
    }
  }

  async function loadExampleFile() {
    setIsImporting(true);
    setNotice("Loading example file...");

    try {
      const response = await fetch("/examples/data-catalog.csv");
      const blob = await response.blob();
      const file = new File([blob], "data-catalog-example.csv", { type: "text/csv" });
      await importFile(file);
    } finally {
      setIsImporting(false);
    }
  }

  function onFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) {
      void importFile(file);
    }
  }

  function resetFilters() {
    setQuery("");
    setStatus("All");
    setDomain("All");
  }

  return (
    <main className="catalog-shell">
      <aside className="sidebar" aria-label="Primary">
        <div className="brand-mark">A</div>
        <nav className="nav-list" aria-label="Catalog sections">
          <a className="active" href="#catalog">Catalog</a>
          <a href="#import">Import</a>
          <a href="#quality">Quality</a>
        </nav>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">Atlas Data Catalog</p>
            <h1>Data assets</h1>
          </div>
          <div className="topbar-actions">
            <a className="button secondary" href="/examples/data-catalog.csv" download>
              Download example
            </a>
            <button className="button primary" type="button" onClick={loadExampleFile} disabled={isImporting}>
              {isImporting ? "Importing..." : "Load example"}
            </button>
          </div>
        </header>

        <section className="summary-grid" aria-label="Catalog summary">
          <Metric label="Assets" value={items.length.toLocaleString()} tone="blue" />
          <Metric label="Certified" value={certifiedCount.toLocaleString()} tone="green" />
          <Metric label="Records tracked" value={compactNumber(totalRecords)} tone="amber" />
          <Metric label="Freshest asset" value={latestFreshness ?? "No data"} tone="slate" />
        </section>

        <section className="catalog-panel" id="catalog">
          <div className="toolbar">
            <label className="search-field">
              <span>Search assets</span>
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Name, owner, domain, type"
              />
            </label>

            <label>
              <span>Status</span>
              <select value={status} onChange={(event) => setStatus(event.target.value as typeof status)}>
                {statusOptions.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            </label>

            <label>
              <span>Domain</span>
              <select value={domain} onChange={(event) => setDomain(event.target.value)}>
                {domains.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            </label>

            <button className="button ghost" type="button" onClick={resetFilters}>
              Clear
            </button>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Asset</th>
                  <th>Owner</th>
                  <th>Domain</th>
                  <th>Status</th>
                  <th>Sensitivity</th>
                  <th>Freshness</th>
                  <th>Records</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <strong>{item.name}</strong>
                      <span>{item.type}</span>
                      <p>{item.description}</p>
                    </td>
                    <td>{item.owner}</td>
                    <td>{item.domain}</td>
                    <td>
                      <StatusBadge status={item.status} />
                    </td>
                    <td>{item.sensitivity}</td>
                    <td>{item.freshness}</td>
                    <td>{item.records.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredItems.length === 0 ? (
            <div className="empty-state">
              <h2>No assets match those filters</h2>
              <p>Clear the filters or import the example catalog to add more searchable rows.</p>
            </div>
          ) : null}
        </section>

        <section className="import-panel" id="import">
          <div>
            <p className="eyebrow">CSV import</p>
            <h2>Import catalog data</h2>
            <p>
              Upload a CSV with name, owner, domain, type, status, sensitivity, freshness, records,
              and description columns.
            </p>
          </div>

          <div className="upload-zone">
            <input ref={inputRef} id="catalog-file" type="file" accept=".csv,text/csv" onChange={onFileChange} />
            <label htmlFor="catalog-file">Choose CSV file</label>
            <button className="button secondary" type="button" onClick={loadExampleFile} disabled={isImporting}>
              Try example file
            </button>
          </div>

          <div className="import-status" role="status" aria-live="polite">
            {notice}
          </div>

          {importErrors.length > 0 ? (
            <div className="validation-list" id="quality">
              <h3>Validation issues</h3>
              <ul>
                {importErrors.map((error, index) => (
                  <li key={`${error.row}-${error.field}-${index}`}>
                    <strong>Row {error.row}</strong> {error.field}: {error.message}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {importedRows.length > 0 ? (
            <div className="preview-list">
              <h3>Last import preview</h3>
              <ul>
                {importedRows.map((row) => (
                  <li key={row.id}>
                    <strong>{row.name}</strong>
                    <span>{row.domain} / {row.status}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </section>
      </section>
    </main>
  );
}

function Metric({
  label,
  value,
  tone
}: {
  label: string;
  value: string;
  tone: "blue" | "green" | "amber" | "slate";
}) {
  return (
    <article className={`metric metric-${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

function StatusBadge({ status }: { status: CatalogItem["status"] }) {
  return <span className={`status status-${status.toLowerCase()}`}>{status}</span>;
}

function compactNumber(value: number) {
  return Intl.NumberFormat("en", {
    notation: "compact",
    maximumFractionDigits: 1
  }).format(value);
}
