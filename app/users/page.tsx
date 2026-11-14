import ComingSoonView from "@/components/ComingSoonView";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Users & Staff | Bill Next",
  description: "User roles, cashier shifts, permissions, and security audit logs.",
};

export default function UsersPage() {
  return (
    <ComingSoonView
      pageName="Users"
      category="Administration"
      title="User Management & Staff Permissions"
      description="Multi-user role-based access control (RBAC), cashier shift registers, cash drawer opening/closing balancing, and security audit logs."
      iconType="users"
      nodeTitle="Identity & RBAC Access Gateway"
      nodeSubtitle="Granular permission evaluator & session warden (ap-southeast-1)"
      nodeStats="1 Active Admin · Auth Guard Online"
      previewMetrics={[
        { label: "Active Admins", value: "1 Account", badge: "Superuser" },
        { label: "Cashier Stations", value: "0 Logged in", badge: "Shift Ready" },
        { label: "Drawer Balancing", value: "Enforced", badge: "Audit Safe" },
        { label: "2FA Protection", value: "Authenticator", badge: "Secured" },
      ]}
      roadmap={[
        {
          title: "Role-Based Access Control (RBAC)",
          description: "Predefined roles for Super Admin, Store Manager, Cashier, and Accountant with custom privilege overrides.",
          status: "In Development",
        },
        {
          title: "Cashier Shift Reconciliation",
          description: "Track cash in drawer at shift start, monitor cash drops, and balance expected vs actual totals during shift handovers.",
          status: "Design Complete",
        },
        {
          title: "Fine-Grained POS Permissions",
          description: "Require manager PIN approval for bill voiding, manual discounts exceeding 10%, or reprint operations.",
          status: "In Development",
        },
        {
          title: "Complete System Audit Trail",
          description: "Immutable log of all user activities: invoice creations, stock adjustments, deletions, and logins.",
          status: "Planned",
        },
      ]}
    />
  );
}
