import ComingSoonView from "@/components/ComingSoonView";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Sales | Bill Next",
  description: "Sales transactions, orders, revenue reporting, and order history.",
};

export default function SalesPage() {
  return (
    <ComingSoonView
      pageName="Sales"
      category="Transactions"
      title="Sales & Order Management"
      description="Point-of-sale transaction ledger, daily sales reporting, customer order tracking, return & refund processing, and revenue stream analytics."
      iconType="sales"
      nodeTitle="Sales Transaction Engine"
      nodeSubtitle="Real-time order pipeline & revenue streaming (ap-southeast-1)"
      nodeStats="Daily Orders 0 · Revenue $0.00"
      previewMetrics={[
        { label: "Today's Sales", value: "$0.00", badge: "Live Sync" },
        { label: "Total Orders", value: "0 Completed", badge: "Register 1" },
        { label: "Avg Order Value", value: "$0.00", badge: "Real-time" },
        { label: "Returns / Voids", value: "0 Invoices", badge: "Audit Safe" },
      ]}
      roadmap={[
        {
          title: "Real-Time Sales Register & Order Ledger",
          description: "Search and filter completed, pending, and refunded orders with instant receipt reprinting and digital shares.",
          status: "In Development",
        },
        {
          title: "Returns, Refunds & Credit Note Workflows",
          description: "Process partial or full returns, auto-adjust stock inventory levels, and issue customer store credit notes.",
          status: "Design Complete",
        },
        {
          title: "End-of-Day Daily Z-Report & Drawer Summary",
          description: "Generate end-of-day sales reconciliation reports breaking down cash, card, UPI, and total collected taxes.",
          status: "In Development",
        },
        {
          title: "Sales Analytics & Peak Hour Heatmaps",
          description: "Interactive visual dashboards showing hourly sales trends, top performing staff, and high-margin product sales.",
          status: "Planned",
        },
      ]}
    />
  );
}

