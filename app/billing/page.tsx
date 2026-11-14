import ComingSoonView from "@/components/ComingSoonView";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Billing | Bill Next",
  description: "Point of Sale billing, automated GST invoicing, and payment processing.",
};

export default function BillingPage() {
  return (
    <ComingSoonView
      pageName="Billing"
      category="Finance"
      title="Billing & Invoicing Engine"
      description="Next-generation POS billing terminal, automated GST invoice sequencer, multi-tender payment processing, and credit ledger accounting."
      iconType="billing"
      nodeTitle="Bill Next Invoicing Core"
      nodeSubtitle="Realtime tax computing & invoice sequencer (ap-southeast-1)"
      nodeStats="Engine Latency 12ms · GST Engine Online"
      previewMetrics={[
        { label: "Total Invoiced", value: "$0.00", badge: "Live Sync" },
        { label: "Draft Bills", value: "0", badge: "Queue Ready" },
        { label: "Payment Modes", value: "Cash / UPI / Cards", badge: "Multi-tender" },
        { label: "Tax Compliance", value: "HSN / SAC / GST", badge: "Verified" },
      ]}
      roadmap={[
        {
          title: "POS High-Speed Billing Terminal",
          description: "Ultra-fast touch & barcode scanner friendly checkout with custom discounts and item search shortcuts.",
          status: "In Development",
        },
        {
          title: "State-wise GST & Tax Auto-Calculation",
          description: "Automatic CGST, SGST, and IGST breakdowns determined by buyer and seller GSTIN locations.",
          status: "Design Complete",
        },
        {
          title: "WhatsApp & SMS Digital Receipts",
          description: "Dispatch instant downloadable PDF invoices straight to customer mobile devices upon checkout.",
          status: "In Development",
        },
        {
          title: "Customer Credit & Khata Ledger",
          description: "Manage customer credit accounts, track pending dues, and issue monthly statement reminders.",
          status: "Planned",
        },
      ]}
    />
  );
}
