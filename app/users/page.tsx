"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import {
  OrgUser,
  PagePermission,
  UserPermissions,
  APP_ROUTES,
  DEFAULT_STAFF_PERMISSIONS,
} from "@/lib/auth/types";
import { fetchOrgUsers, createOrgUser, deleteOrgUser } from "@/lib/data/users";
import {
  Users,
  UserPlus,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  KeyRound,
  Phone,
  Mail,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  Lock,
  Eye,
  EyeOff,
  Building2,
  Sparkles,
  Check,
  Ban,
  FileText
} from "lucide-react";

export const dynamic = "force-dynamic";

export default function UsersPage() {
  const { organization, role, canEdit, profile } = useAuth();
  const [users, setUsers] = useState<OrgUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<OrgUser | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form Fields
  const [name, setName] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [mpin, setMpin] = useState("");
  const [showMpin, setShowMpin] = useState(false);
  const [revealedMpins, setRevealedMpins] = useState<Record<string, boolean>>({});

  // Permissions state for new user
  const [permissions, setPermissions] = useState<UserPermissions>({
    ...DEFAULT_STAFF_PERMISSIONS,
  });

  const hasEditAccess = role === "owner" || canEdit("/users");

  const loadUsers = async () => {
    if (!organization?.id) return;
    setLoading(true);
    try {
      const data = await fetchOrgUsers(organization.id);
      setUsers(data);
    } catch (err) {
      console.error("Failed to load organization users:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [organization?.id]);

  // Filter users by search
  const filteredUsers = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return users;
    return users.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.mobile_number.includes(q) ||
        u.email.toLowerCase().includes(q)
    );
  }, [users, searchQuery]);

  const toggleRevealMpin = (id: string) => {
    setRevealedMpins((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Preset Handlers
  const applyPreset = (type: "cashier" | "manager" | "viewonly" | "clear") => {
    if (type === "cashier") {
      setPermissions({
        "/": "view",
        "/billing": "edit",
        "/sales": "view",
        "/expenses": "none",
        "/customers": "edit",
        "/items": "view",
        "/categories": "none",
        "/users": "none",
        "/settings": "none",
      });
    } else if (type === "manager") {
      setPermissions({
        "/": "edit",
        "/billing": "edit",
        "/sales": "edit",
        "/expenses": "edit",
        "/customers": "edit",
        "/items": "edit",
        "/categories": "edit",
        "/users": "view",
        "/settings": "view",
      });
    } else if (type === "viewonly") {
      const viewAll: UserPermissions = {};
      APP_ROUTES.forEach((r) => {
        viewAll[r.path] = "view";
      });
      setPermissions(viewAll);
    } else if (type === "clear") {
      const clearAll: UserPermissions = {};
      APP_ROUTES.forEach((r) => {
        clearAll[r.path] = "none";
      });
      setPermissions(clearAll);
    }
  };

  const handlePermissionChange = (path: string, level: PagePermission) => {
    setPermissions((prev) => ({
      ...prev,
      [path]: level,
    }));
  };

  const handleOpenAddModal = () => {
    setName("");
    setMobileNumber("");
    setMpin("");
    setShowMpin(false);
    setPermissions({ ...DEFAULT_STAFF_PERMISSIONS });
    setErrorMsg(null);
    setIsAddModalOpen(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organization?.id) return;

    setErrorMsg(null);
    setIsSubmitting(true);

    const cleanMobile = mobileNumber.trim().replace(/\D/g, "");
    if (!name.trim()) {
      setErrorMsg("Please enter user full name.");
      setIsSubmitting(false);
      return;
    }
    if (cleanMobile.length < 10) {
      setErrorMsg("Please enter a valid 10-digit mobile number.");
      setIsSubmitting(false);
      return;
    }
    if (mpin.trim().length < 4) {
      setErrorMsg("MPIN must be at least 4 digits.");
      setIsSubmitting(false);
      return;
    }

    try {
      const res = await createOrgUser(organization.id, {
        name: name.trim(),
        mobile_number: cleanMobile,
        mpin: mpin.trim(),
        permissions,
      });

      if (!res.success) {
        setErrorMsg(res.error || "Failed to create user.");
        setIsSubmitting(false);
        return;
      }

      setSuccessMsg(`User "${name.trim()}" created successfully! Login Email: ${cleanMobile}@bn.com`);
      setIsAddModalOpen(false);
      await loadUsers();
      setTimeout(() => setSuccessMsg(null), 5000);
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!organization?.id || !userToDelete) return;
    try {
      await deleteOrgUser(organization.id, userToDelete.id);
      setSuccessMsg(`User "${userToDelete.name}" deleted.`);
      setUserToDelete(null);
      await loadUsers();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to delete user.");
    }
  };

  // Helper to count allowed pages
  const getAllowedCount = (userPerms: UserPermissions) => {
    return Object.values(userPerms).filter((p) => p !== "none").length;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/80 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                Users & Staff Management
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                  RBAC Active
                </span>
              </h1>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Staff authentication credentials, MPIN passwords & granular page permissions
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {hasEditAccess ? (
            <button
              onClick={handleOpenAddModal}
              className="px-3.5 py-2 text-xs font-medium rounded-lg bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add User</span>
            </button>
          ) : (
            <div className="text-xs font-mono text-zinc-400 dark:text-zinc-500 px-3 py-1.5 rounded-md bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
              View Only Access
            </div>
          )}
        </div>
      </div>

      {/* Global Alerts */}
      {successMsg && (
        <div className="p-3.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-300 text-xs flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-medium">{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-600 hover:text-emerald-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-300 text-xs flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span className="font-medium">{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)} className="text-rose-600 hover:text-rose-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Search and Summary Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search staff by name, mobile, or email..."
            className="w-full text-xs pl-9 pr-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-zinc-500 dark:text-zinc-400">
          <span className="px-2.5 py-1 rounded-md bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
            Total Staff: <strong>{users.length}</strong>
          </span>
          <span className="px-2.5 py-1 rounded-md bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
            Org: <strong>{organization?.name || "Store"}</strong>
          </span>
        </div>
      </div>

      {/* Users Table */}
      <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-900 overflow-hidden shadow-xs">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
            <span className="text-xs text-zinc-500 font-mono">Loading organization staff...</span>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <div className="w-12 h-12 rounded-xl bg-zinc-100 dark:bg-zinc-800 mx-auto flex items-center justify-center text-zinc-400">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                {searchQuery ? "No staff members match your search" : "No staff users added yet"}
              </p>
              <p className="text-xs text-zinc-400 dark:text-zinc-500 max-w-sm mx-auto mt-1">
                Add cashiers and operators with mobile number & MPIN to restrict what pages they can view or edit.
              </p>
            </div>
            {hasEditAccess && !searchQuery && (
              <button
                onClick={handleOpenAddModal}
                className="mt-2 px-3 py-1.5 text-xs rounded-lg bg-emerald-500 text-white font-medium hover:bg-emerald-600 transition-colors inline-flex items-center gap-1.5"
              >
                <UserPlus className="w-3.5 h-3.5" />
                Add First User
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50 dark:bg-zinc-950/50 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 font-medium">
                <tr>
                  <th className="px-4 py-3">Staff Member</th>
                  <th className="px-4 py-3">Mobile & Login Email</th>
                  <th className="px-4 py-3">MPIN</th>
                  <th className="px-4 py-3">Allowed Pages Access</th>
                  <th className="px-4 py-3">Status</th>
                  {hasEditAccess && <th className="px-4 py-3 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {filteredUsers.map((u) => {
                  const isRevealed = revealedMpins[u.id];
                  const allowedCount = getAllowedCount(u.permissions);

                  return (
                    <tr key={u.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/40 transition-colors">
                      {/* Name & Role */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 flex items-center justify-center font-semibold text-emerald-800 dark:text-emerald-300 text-xs">
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-medium text-zinc-900 dark:text-zinc-100">{u.name}</div>
                            <span className="inline-block mt-0.5 text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
                              STAFF OPERATOR
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Mobile & Email */}
                      <td className="px-4 py-3.5 font-mono text-[11px]">
                        <div className="flex items-center gap-1.5 text-zinc-800 dark:text-zinc-200">
                          <Phone className="w-3 h-3 text-zinc-400" />
                          <span>+91 {u.mobile_number}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400 mt-1">
                          <Mail className="w-3 h-3 text-zinc-400" />
                          <span>{u.email}</span>
                        </div>
                      </td>

                      {/* MPIN */}
                      <td className="px-4 py-3.5 font-mono">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs">
                            {isRevealed ? u.mpin : "••••••"}
                          </span>
                          <button
                            onClick={() => toggleRevealMpin(u.id)}
                            className="p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors cursor-pointer"
                            title={isRevealed ? "Hide MPIN" : "Reveal MPIN"}
                          >
                            {isRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </td>

                      {/* Allowed Pages Matrix Summary */}
                      <td className="px-4 py-3.5">
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-zinc-900 dark:text-zinc-100 font-mono text-xs">
                              {allowedCount} / {APP_ROUTES.length} Pages
                            </span>
                            <span className="text-[10px] text-zinc-400 font-mono">
                              ({Math.round((allowedCount / APP_ROUTES.length) * 100)}%)
                            </span>
                          </div>

                          <div className="flex flex-wrap gap-1 max-w-md">
                            {APP_ROUTES.map((route) => {
                              const perm = u.permissions?.[route.path] || "none";
                              if (perm === "none") return null;

                              return (
                                <span
                                  key={route.path}
                                  className={`text-[10px] font-mono px-1.5 py-0.5 rounded border flex items-center gap-1 ${
                                    perm === "edit"
                                      ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/80 text-emerald-700 dark:text-emerald-400"
                                      : "bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800/80 text-blue-700 dark:text-blue-400"
                                  }`}
                                  title={`${route.name}: ${perm.toUpperCase()} access`}
                                >
                                  <span>{route.name}</span>
                                  <span className="opacity-75 font-semibold text-[9px] uppercase">({perm})</span>
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5">
                        <span className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          ACTIVE
                        </span>
                      </td>

                      {/* Actions */}
                      {hasEditAccess && (
                        <td className="px-4 py-3.5 text-right">
                          <button
                            onClick={() => setUserToDelete(u)}
                            className="p-1.5 rounded-md text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                            title="Delete staff user"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ADD USER MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="p-5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-950/40">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-600">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    Add New User / Staff Member
                  </h3>
                  <p className="text-[11px] text-zinc-500 font-mono">
                    Configure mobile credentials, MPIN & granular page access
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form Scrollable Body */}
            <form onSubmit={handleSaveUser} className="overflow-y-auto p-5 space-y-6 flex-1">
              {errorMsg && (
                <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Basic Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full Name */}
                <div className="space-y-1 sm:col-span-2">
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Ramesh Kumar"
                    required
                    className="w-full text-xs px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                {/* Mobile Number */}
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    Mobile Number (10 Digits) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="text-xs font-mono text-zinc-400 absolute left-3 top-2">+91</span>
                    <input
                      type="tel"
                      value={mobileNumber}
                      onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, "").slice(0, 10))}
                      placeholder="9876543210"
                      required
                      className="w-full text-xs pl-10 pr-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                    />
                  </div>
                </div>

                {/* MPIN */}
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    MPIN (Login Password) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <KeyRound className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-2.5" />
                    <input
                      type={showMpin ? "text" : "password"}
                      value={mpin}
                      onChange={(e) => setMpin(e.target.value)}
                      placeholder="e.g. 123456"
                      required
                      className="w-full text-xs pl-9 pr-9 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowMpin(!showMpin)}
                      className="absolute right-2.5 top-2 text-zinc-400 hover:text-zinc-600"
                    >
                      {showMpin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Generated Credential Preview */}
              <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  <span>Generated Authentication Credentials</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono">
                  <div className="p-2 rounded bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                    <span className="text-zinc-400 block text-[10px]">AUTH EMAIL</span>
                    <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                      {mobileNumber ? `${mobileNumber.trim()}@bn.com` : "<mobile_number>@bn.com"}
                    </span>
                  </div>
                  <div className="p-2 rounded bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                    <span className="text-zinc-400 block text-[10px]">AUTH PASSWORD / MPIN</span>
                    <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                      {mpin ? (showMpin ? mpin : "••••••") : "<mpin>"}
                    </span>
                  </div>
                </div>
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
                  Staff member can log in using either their 10-digit mobile number or full email with their MPIN.
                </p>
              </div>

              {/* Permissions Matrix */}
              <div className="space-y-3 pt-2 border-t border-zinc-200 dark:border-zinc-800">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h4 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                      Module Access Control Matrix
                    </h4>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                      Specify what pages this staff user can view or edit (disallowed pages are blocked at URL level)
                    </p>
                  </div>

                  {/* Preset Pills */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => applyPreset("cashier")}
                      className="px-2 py-0.5 text-[10px] rounded-md font-mono bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 transition-colors cursor-pointer"
                    >
                      Cashier POS
                    </button>
                    <button
                      type="button"
                      onClick={() => applyPreset("manager")}
                      className="px-2 py-0.5 text-[10px] rounded-md font-mono bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 transition-colors cursor-pointer"
                    >
                      Store Manager
                    </button>
                    <button
                      type="button"
                      onClick={() => applyPreset("clear")}
                      className="px-2 py-0.5 text-[10px] rounded-md font-mono bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-200 transition-colors cursor-pointer"
                    >
                      None All
                    </button>
                  </div>
                </div>

                {/* Matrix Table */}
                <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden divide-y divide-zinc-200 dark:divide-zinc-800">
                  {APP_ROUTES.map((route) => {
                    const currentPerm: PagePermission = permissions[route.path] || "none";

                    return (
                      <div
                        key={route.path}
                        className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-white dark:bg-zinc-900 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/40 transition-colors"
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-zinc-900 dark:text-zinc-100">
                              {route.name}
                            </span>
                            <span className="text-[10px] font-mono text-zinc-400">
                              {route.path}
                            </span>
                          </div>
                          <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                            {route.description}
                          </p>
                        </div>

                        {/* 3-State Segmented Control */}
                        <div className="flex items-center rounded-lg p-0.5 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 shrink-0 self-start sm:self-auto">
                          {/* None */}
                          <button
                            type="button"
                            onClick={() => handlePermissionChange(route.path, "none")}
                            className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-all cursor-pointer ${
                              currentPerm === "none"
                                ? "bg-rose-500 text-white shadow-xs"
                                : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                            }`}
                          >
                            None
                          </button>

                          {/* View */}
                          <button
                            type="button"
                            onClick={() => handlePermissionChange(route.path, "view")}
                            className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-all cursor-pointer ${
                              currentPerm === "view"
                                ? "bg-blue-600 text-white shadow-xs"
                                : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                            }`}
                          >
                            View
                          </button>

                          {/* Edit */}
                          <button
                            type="button"
                            onClick={() => handlePermissionChange(route.path, "edit")}
                            className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-all cursor-pointer ${
                              currentPerm === "edit"
                                ? "bg-emerald-500 text-white shadow-xs"
                                : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                            }`}
                          >
                            Edit
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Modal Actions */}
              <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3.5 py-2 text-xs font-medium rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-medium rounded-lg bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white shadow-xs transition-colors flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving User...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Save User</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-sm bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 flex items-center justify-center text-rose-600">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  Delete Staff Member?
                </h3>
                <p className="text-xs text-zinc-500">
                  Remove <strong>{userToDelete.name}</strong> from organization.
                </p>
              </div>
            </div>

            <p className="text-xs text-zinc-600 dark:text-zinc-400">
              This staff member will no longer be able to log in with mobile number <strong>{userToDelete.mobile_number}</strong> or access any software pages.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
              <button
                onClick={() => setUserToDelete(null)}
                className="px-3 py-1.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteUser}
                className="px-3.5 py-1.5 text-xs rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-medium transition-colors cursor-pointer"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
