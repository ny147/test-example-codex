import type { CatalogItem } from "./types";

const catalogItems: CatalogItem[] = [
  {
    id: "cust-360",
    name: "Customer 360 Profile",
    owner: "Growth Analytics",
    domain: "Customer",
    type: "Warehouse Table",
    status: "Certified",
    sensitivity: "Confidential",
    freshness: "2026-05-11",
    records: 1842300,
    description: "Unified customer identity, lifecycle stage, account fit, and engagement metrics."
  },
  {
    id: "orders-daily",
    name: "Daily Orders Fact",
    owner: "Revenue Data",
    domain: "Sales",
    type: "Incremental Model",
    status: "Certified",
    sensitivity: "Internal",
    freshness: "2026-05-12",
    records: 932100,
    description: "Order revenue, discounts, channel attribution, and fulfillment timestamps by day."
  },
  {
    id: "product-events",
    name: "Product Event Stream",
    owner: "Product Insights",
    domain: "Product",
    type: "Event Stream",
    status: "Draft",
    sensitivity: "Internal",
    freshness: "2026-05-12",
    records: 12680900,
    description: "Application events used for activation funnels, retention cohorts, and feature usage."
  },
  {
    id: "support-quality",
    name: "Support Quality Scores",
    owner: "Service Ops",
    domain: "Support",
    type: "Dashboard Dataset",
    status: "Certified",
    sensitivity: "Internal",
    freshness: "2026-05-10",
    records: 72140,
    description: "Ticket quality audit scores, resolution times, escalation flags, and CSAT feedback."
  },
  {
    id: "legacy-inventory",
    name: "Legacy Inventory Snapshot",
    owner: "Supply Chain",
    domain: "Operations",
    type: "Flat File",
    status: "Deprecated",
    sensitivity: "Internal",
    freshness: "2026-04-28",
    records: 53220,
    description: "Weekly inventory export retained while warehouse migration completes."
  }
];

export function getCatalogItems() {
  return catalogItems;
}
