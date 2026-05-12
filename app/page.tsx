import { CatalogDashboard } from "@/components/catalog/catalog-dashboard";
import { getCatalogItems } from "@/lib/catalog/data";

export default function Home() {
  const items = getCatalogItems();

  return <CatalogDashboard initialItems={items} />;
}
