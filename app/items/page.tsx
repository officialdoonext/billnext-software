import ComingSoonView from "@/components/ComingSoonView";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Items | Bill Next",
  description: "Manage inventory, product items, SKUs, and stock tracking.",
};

export default function ItemsPage() {
  return (
    <ComingSoonView
      pageName="Items"
      category="Catalog"
      title="Items & Inventory Management"
      description="Centralized product catalog, automated SKU and barcode generation, unit conversions, multi-location stock tracking, and reorder alerts."
      iconType="items"
      nodeTitle="Inventory Indexer & Barcode Service"
      nodeSubtitle="Sub-millisecond item lookup & stock sync (ap-southeast-1)"
      nodeStats="Catalog Store 0 SKUs · Sync Active"
      previewMetrics={[
        { label: "Active Products", value: "0 SKUs", badge: "Catalog" },
        { label: "Stock Alerts", value: "0 Items", badge: "Realtime" },
        { label: "Barcode Types", value: "EAN / UPC / QR", badge: "Enabled" },
        { label: "Valuation Method", value: "FIFO / Weighted", badge: "Standard" },
      ]}
      roadmap={[
        {
          title: "SKU & Barcode Auto-Generator",
          description: "Generate standard barcodes and print printable adhesive labels directly from the browser.",
          status: "In Development",
        },
        {
          title: "Bulk CSV & Excel Product Importer",
          description: "Import thousands of existing items, opening balances, purchase prices, and MRPs with one click.",
          status: "Design Complete",
        },
        {
          title: "Product Variants & Unit Conversions",
          description: "Manage size, color, weight, and multi-unit conversions (e.g., box to piece) seamlessly.",
          status: "In Development",
        },
        {
          title: "Batch & Expiry Date Alert Engine",
          description: "Track pharmaceutical or food batches with automated notifications before stock expires.",
          status: "Planned",
        },
      ]}
    />
  );
}
