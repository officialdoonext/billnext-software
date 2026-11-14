import ComingSoonView from "@/components/ComingSoonView";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Settings | Bill Next",
  description: "Store profile, receipt printers, GSTIN, and system configuration.",
};

export default function SettingsPage() {
  return (
    <ComingSoonView
      pageName="Settings"
      category="Configuration"
      title="Store & Hardware Settings"
      description="Store profile information, ESC/POS thermal receipt printer drivers, GSTIN tax configuration, cloud backup retention, and API webhooks."
      iconType="settings"
      nodeTitle="Hardware & Integration Hub"
      nodeSubtitle="Printer drivers & secure credential vault (ap-southeast-1)"
      nodeStats="Hardware Gateway Ready · API v1.0 Active"
      previewMetrics={[
        { label: "Receipt Printer", value: "ESC/POS Raw", badge: "USB / BT / LAN" },
        { label: "Paper Standard", value: "80mm & 58mm", badge: "Auto-cut" },
        { label: "Cloud Backups", value: "Every 24 Hours", badge: "Encrypted" },
        { label: "Webhooks", value: "Outbound HTTP", badge: "Event-driven" },
      ]}
      roadmap={[
        {
          title: "Browser Direct ESC/POS Thermal Printing",
          description: "Zero-latency printing to 80mm/58mm thermal printers over USB, Bluetooth, or local network without popup dialogs.",
          status: "In Development",
        },
        {
          title: "Drag-and-Drop Receipt Template Designer",
          description: "Customize your thermal bill: add store logo, contact numbers, UPI QR code for fast payments, and return policy.",
          status: "Design Complete",
        },
        {
          title: "GSTIN Profile & Multiple Branch Registration",
          description: "Store official GSTIN numbers, state codes, and branch-specific bill series prefixes.",
          status: "In Development",
        },
        {
          title: "Accounting Software Sync (Tally / Zoho Books)",
          description: "Export daily sales and tax reports directly to Tally Prime XML or Zoho Books API.",
          status: "Planned",
        },
      ]}
    />
  );
}
