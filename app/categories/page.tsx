"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import { Category } from "@/lib/auth/types";
import { fetchCategories, addCategory, deleteCategory } from "@/lib/data/categories";
import {
  FolderTree,
  Plus,
  Search,
  Trash2,
  Loader2,
  Building2,
  CheckCircle2,
  AlertCircle,
  Tag,
  Boxes,
  ArrowRight
} from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default function CategoriesPage() {
  const { organization, isLoading: authLoading, role, canEdit } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const hasEditAccess = role === "owner" || canEdit("/categories");

  // Load categories for this organization
  const loadData = async () => {
    if (!organization?.id) return;
    try {
      setIsLoading(true);
      const data = await fetchCategories(organization.id);
      setCategories(data);
    } catch (err: any) {
      console.error("Error loading categories:", err);
      setErrorMsg("Failed to load categories. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (organization?.id) {
      loadData();
    } else if (!authLoading) {
      setIsLoading(false);
    }
  }, [organization?.id, authLoading]);

  // Handle Add Category
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organization?.id) {
      setErrorMsg("No active organization found. Please re-login.");
      return;
    }

    const trimmed = newCategoryName.trim();
    if (!trimmed) {
      setErrorMsg("Please enter a category name");
      return;
    }

    // Duplicate check
    const exists = categories.some(
      (c) => c.name.toLowerCase() === trimmed.toLowerCase()
    );
    if (exists) {
      setErrorMsg(`A category named "${trimmed}" already exists.`);
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg(null);
      const created = await addCategory(organization.id, trimmed);
      setCategories((prev) => [created, ...prev]);
      setNewCategoryName("");
      setIsModalOpen(false);
      setSuccessMsg(`Category "${created.name}" created successfully!`);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to add category.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Delete
  const handleDelete = async (id: string, name: string) => {
    if (!organization?.id) return;
    if (!confirm(`Are you sure you want to delete category "${name}"?`)) return;

    try {
      setDeletingId(id);
      await deleteCategory(organization.id, id);
      setCategories((prev) => prev.filter((c) => c.id !== id));
      setSuccessMsg(`Category "${name}" deleted.`);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to delete category.");
    } finally {
      setDeletingId(null);
    }
  };

  const filteredCategories = categories.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Breadcrumb & Navigation Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-zinc-500 mb-1">
            <Link href="/" className="hover:text-emerald-500 transition-colors">
              Bill Next
            </Link>
            <span>/</span>
            <span className="text-zinc-400">Catalog</span>
            <span>/</span>
            <span className="text-zinc-900 dark:text-zinc-100 font-medium">
              Item Categories
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-2.5">
            <FolderTree className="w-6 h-6 text-emerald-500" />
            Item Categories
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Group your store catalog into organized departments and categories. Scoped exclusively to{" "}
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
              {organization?.name || "Your Organization"}
            </span>
            .
          </p>
        </div>

        {/* Action Button */}
        <div className="flex items-center gap-3">
          <Link
            href="/items"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800/80 text-zinc-700 dark:text-zinc-300 transition-colors"
          >
            <Boxes className="w-3.5 h-3.5" />
            View Items
            <ArrowRight className="w-3 h-3 text-zinc-400" />
          </Link>
          {hasEditAccess ? (
            <button
              onClick={() => {
                setErrorMsg(null);
                setIsModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-md bg-[#3ECF8E] hover:bg-[#34b27b] text-black shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-900 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Add Category
            </button>
          ) : (
            <span className="text-xs font-mono text-zinc-400 px-3 py-1.5 rounded-md bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
              View Only
            </span>
          )}
        </div>
      </div>

      {/* Notifications / Alerts */}
      {successMsg && (
        <div className="flex items-center gap-2 px-4 py-3 text-xs rounded-md bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-500" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="flex items-center gap-2 px-4 py-3 text-xs rounded-md bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 text-red-800 dark:text-red-300">
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-500" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Stats & Multi-Tenant Isolation Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
            <span>Total Categories</span>
            <FolderTree className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-zinc-900 dark:text-zinc-100">
            {categories.length}
          </div>
          <p className="text-[11px] text-zinc-400 mt-1">Available for item classification</p>
        </div>

        <div className="p-4 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
            <span>Organization Isolation</span>
            <Building2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2 text-sm font-semibold truncate text-zinc-900 dark:text-zinc-100">
            {organization?.name || "Loading..."}
          </div>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
              Strict Multi-Tenancy Enforced
            </p>
          </div>
        </div>

        <div className="p-4 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
            <span>Storage & Sync</span>
            <Tag className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Supabase Cloud + Local Cache
          </div>
          <p className="text-[11px] text-zinc-400 mt-1">
            Real-time persistence with offline fallback
          </p>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-sm">
        {/* Table Toolbar */}
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter categories by name..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 placeholder:text-zinc-400"
            />
          </div>
          <span className="text-xs text-zinc-500 dark:text-zinc-400 font-mono">
            Showing {filteredCategories.length} of {categories.length} categories
          </span>
        </div>

        {/* Content Area */}
        {isLoading ? (
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-emerald-500 mb-2" />
            <p className="text-xs text-zinc-500">Loading categories...</p>
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800/80 flex items-center justify-center mb-3">
              <FolderTree className="w-6 h-6 text-zinc-400" />
            </div>
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              {searchQuery ? "No matching categories" : "No categories yet"}
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mt-1">
              {searchQuery
                ? `No category found matching "${searchQuery}". Try clearing your search.`
                : `Categories organize your store's inventory. Add your first category or import sample products.`}
            </p>
            {!searchQuery && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md bg-[#3ECF8E] hover:bg-[#34b27b] text-black shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Your First Category
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50 dark:bg-zinc-950/60 border-b border-zinc-200 dark:border-zinc-800 font-medium text-zinc-500 dark:text-zinc-400">
                <tr>
                  <th className="py-3 px-4 w-12 font-mono">#</th>
                  <th className="py-3 px-4">Category Name</th>
                  <th className="py-3 px-4">Organization Scope</th>
                  <th className="py-3 px-4">Identifier</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {filteredCategories.map((cat, index) => (
                  <tr
                    key={cat.id}
                    className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 transition-colors"
                  >
                    <td className="py-3 px-4 font-mono text-zinc-400">{index + 1}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold text-[10px]">
                          {cat.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium text-zinc-900 dark:text-zinc-100">
                          {cat.name}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
                        <Building2 className="w-3 h-3 text-emerald-500" />
                        {organization?.name || "This Org"}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-zinc-400 text-[11px] truncate max-w-[140px]">
                      {cat.id}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {hasEditAccess && (
                        <button
                          onClick={() => handleDelete(cat.id, cat.name)}
                          disabled={deletingId === cat.id}
                          title="Delete category"
                          className="inline-flex items-center justify-center w-7 h-7 rounded text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors disabled:opacity-50 cursor-pointer"
                        >
                          {deletingId === cat.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-red-500" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Category Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  <FolderTree className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    Add New Category
                  </h3>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    Create a taxonomy category for your items
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  if (!isSubmitting) setIsModalOpen(false);
                }}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 text-sm font-mono"
              >
                ✕
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleAddCategory} className="p-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Category Name <span className="text-emerald-500">*</span>
                </label>
                <input
                  type="text"
                  autoFocus
                  required
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="e.g. Dairy & Breakfast, Beverages, Groceries"
                  className="w-full px-3 py-2 text-xs bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400"
                />
              </div>

              {/* Organization Scope Notification */}
              <div className="p-3 rounded-md bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800/80 flex items-start gap-2.5">
                <Building2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                <div className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  This category will be saved specifically under{" "}
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                    {organization?.name || "Your Organization"}
                  </span>
                  . Other organizations will not see or modify it.
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 text-xs font-medium rounded-md border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !newCategoryName.trim()}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-md bg-[#3ECF8E] hover:bg-[#34b27b] text-black shadow-sm disabled:opacity-50 transition-all"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Category"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
