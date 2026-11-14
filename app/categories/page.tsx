import ComingSoonView from "@/components/ComingSoonView";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Item Categories | Bill Next",
  description: "Hierarchical product taxonomy, department classification, and tax presets.",
};

export default function CategoriesPage() {
  return (
    <ComingSoonView
      pageName="Item Categories"
      category="Catalog"
      title="Item Categories & Taxonomy"
      description="Hierarchical item classification, department structure, default tax slab inheritance, and touchscreen POS quick-tabs."
      iconType="categories"
      nodeTitle="Taxonomy & Category Service"
      nodeSubtitle="Nested tree graph & tax slab resolver (ap-southeast-1)"
      nodeStats="Hierarchy Active · Tax Inheritance Configured"
      previewMetrics={[
        { label: "Category Tree Depth", value: "Multi-tier", badge: "Nested" },
        { label: "Tax Slab Slices", value: "0% / 5% / 18% / 28%", badge: "Standard GST" },
        { label: "POS Quick-Pads", value: "Customizable", badge: "Touch Ready" },
        { label: "HSN Code Mapper", value: "Automated", badge: "Smart Match" },
      ]}
      roadmap={[
        {
          title: "Drag-and-Drop Nested Category Builder",
          description: "Organize parent and child categories with an intuitive drag-and-drop tree interface.",
          status: "In Development",
        },
        {
          title: "Category-Level Tax & Margin Inheritance",
          description: "Set default GST rates and target profit margins at category level so new items inherit them automatically.",
          status: "Design Complete",
        },
        {
          title: "Touchscreen POS Fast-Category Tiles",
          description: "Color-coded category buttons for high-volume retail stores, supermarkets, and cafes.",
          status: "In Development",
        },
        {
          title: "Category Analytics & Profitability Graph",
          description: "Visual charts detailing highest grossing categories, best sellers, and dead inventory.",
          status: "Planned",
        },
      ]}
    />
  );
}
