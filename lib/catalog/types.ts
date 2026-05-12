export type CatalogStatus = "Certified" | "Draft" | "Deprecated";

export type CatalogItem = {
  id: string;
  name: string;
  owner: string;
  domain: string;
  type: string;
  status: CatalogStatus;
  sensitivity: "Public" | "Internal" | "Confidential";
  freshness: string;
  records: number;
  description: string;
};

export type ImportError = {
  row: number;
  field: string;
  message: string;
};

export type ImportResult = {
  rows: CatalogItem[];
  errors: ImportError[];
};
