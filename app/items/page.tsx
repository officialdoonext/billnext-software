"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth/auth-context";
import { Item, Category } from "@/lib/auth/types";
import { fetchItems, addItem, bulkAddItems, deleteItem } from "@/lib/data/items";
import { fetchCategories, addCategory } from "@/lib/data/categories";
import { compressImageTo60KB } from "@/lib/utils/image-compressor";
import { SAMPLE_50_PRODUCTS, SampleProduct } from "@/lib/data/sample-products";
import { downloadSampleExcelTemplate, parseExcelFile } from "@/lib/utils/excel-handler";
import CustomDropdown from "@/components/ui/CustomDropdown";
import {
  Boxes,
  Plus,
  Search,
  Trash2,
  Loader2,
  UploadCloud,
  ImageIcon,
  CheckCircle2,
  AlertCircle,
  Building2,
  Tag,
  FolderTree,
  Scale,
  Sparkles,
  ArrowRight,
  ExternalLink,
  SlidersHorizontal,
  Info,
  Download,
  FileSpreadsheet,
  FileUp,
  X
} from "lucide-react";

export const dynamic = "force-dynamic";

export default function ItemsPage() {
  const { organization, isLoading: authLoading, role, canEdit } = useAuth();
  const [items, setItems] = useState<Item[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState("all");

  const hasEditAccess = role === "owner" || canEdit("/items");

  // Notifications
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Single Item Add Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [itemName, setItemName] = useState("");
  const [shortCode, setShortCode] = useState("");
  const [unit, setUnit] = useState<"Piece" | "KG" | "Litre">("Piece");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("50");
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Quick inline category add inside item modal
  const [showInlineCat, setShowInlineCat] = useState(false);
  const [inlineCatName, setInlineCatName] = useState("");
  const [isAddingInlineCat, setIsAddingInlineCat] = useState(false);

  // Image upload & 60KB compression state
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [compressedBase64, setCompressedBase64] = useState<string | null>(null);
  const [originalSizeKB, setOriginalSizeKB] = useState<number | null>(null);
  const [compressedSizeKB, setCompressedSizeKB] = useState<number | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Bulk Upload Modal State
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [bulkTab, setBulkTab] = useState<"excel" | "sample">("excel");
  const [isBulkUploading, setIsBulkUploading] = useState(false);

  // Excel Upload State
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [isParsingExcel, setIsParsingExcel] = useState(false);
  const [parsedExcelProducts, setParsedExcelProducts] = useState<SampleProduct[]>([]);
  const [excelParseErrors, setExcelParseErrors] = useState<string[]>([]);
  const excelInputRef = useRef<HTMLInputElement>(null);

  const maxItemsLimit = organization?.items_count ?? 50;
  const currentCount = items.length;
  const isLimitReached = currentCount >= maxItemsLimit;
  const remainingQuota = Math.max(0, maxItemsLimit - currentCount);
  const quotaPercentage = Math.min(100, Math.round((currentCount / maxItemsLimit) * 100));

  // Load items and categories
  const loadData = async () => {
    if (!organization?.id) return;
    try {
      setIsLoading(true);
      const [itemsData, catsData] = await Promise.all([
        fetchItems(organization.id),
        fetchCategories(organization.id),
      ]);
      setItems(itemsData);
      setCategories(catsData);
    } catch (err: any) {
      console.error("Error loading items or categories:", err);
      setErrorMsg("Failed to load inventory data.");
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

  // Handle image selection & auto-compression to <= 60KB
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsCompressing(true);
      setImageFile(file);
      const result = await compressImageTo60KB(file, 60);
      setCompressedBase64(result.base64);
      setCompressedSizeKB(result.sizeKB);
      setOriginalSizeKB(result.originalSizeKB);
    } catch (err) {
      console.error("Image compression error:", err);
      setErrorMsg("Could not compress image. Please choose another image file.");
    } finally {
      setIsCompressing(false);
    }
  };

  // Reset Add Form
  const resetAddForm = () => {
    setItemName("");
    setShortCode("");
    setUnit("Piece");
    setPrice("");
    setStock("50");
    setSelectedCategoryId("");
    setImageFile(null);
    setCompressedBase64(null);
    setOriginalSizeKB(null);
    setCompressedSizeKB(null);
    setShowInlineCat(false);
    setInlineCatName("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Reset Excel Upload State
  const resetExcelState = () => {
    setExcelFile(null);
    setParsedExcelProducts([]);
    setExcelParseErrors([]);
    if (excelInputRef.current) excelInputRef.current.value = "";
  };

  // Handle Excel File Selection & Parse
  const handleExcelFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsParsingExcel(true);
      setExcelFile(file);
      setExcelParseErrors([]);
      const result = await parseExcelFile(file);
      setParsedExcelProducts(result.products);
      setExcelParseErrors(result.errors);
      if (result.products.length === 0 && result.errors.length > 0) {
        setErrorMsg(result.errors[0]);
      }
    } catch (err: any) {
      console.error("Excel parse error:", err);
      setErrorMsg(err.message || "Could not parse Excel file. Please use valid .xlsx or .csv format.");
      setParsedExcelProducts([]);
    } finally {
      setIsParsingExcel(false);
    }
  };

  // Handle Inline Category Creation
  const handleCreateInlineCategory = async () => {
    if (!organization?.id || !inlineCatName.trim()) return;
    try {
      setIsAddingInlineCat(true);
      const newCat = await addCategory(organization.id, inlineCatName.trim());
      setCategories((prev) => [newCat, ...prev]);
      setSelectedCategoryId(newCat.id);
      setInlineCatName("");
      setShowInlineCat(false);
    } catch (e: any) {
      alert(e.message || "Failed to create category");
    } finally {
      setIsAddingInlineCat(false);
    }
  };

  // Handle Add Single Item Submit
  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organization?.id) {
      setErrorMsg("No active organization found. Please login again.");
      return;
    }

    if (isLimitReached) {
      setErrorMsg(
        `Cannot add item: Your organization limit of ${maxItemsLimit} items has been reached.`
      );
      return;
    }

    const trimmedName = itemName.trim();
    if (!trimmedName) {
      setErrorMsg("Item name is required.");
      return;
    }

    const numericPrice = parseFloat(price);
    if (isNaN(numericPrice) || numericPrice < 0) {
      setErrorMsg("Please enter a valid price (greater than or equal to 0).");
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg(null);

      let finalImageUrl: string | null = null;

      // Upload compressed image to ImageKit if provided
      if (compressedBase64) {
        try {
          const uploadRes = await fetch("/api/upload/imagekit", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              imageBase64: compressedBase64,
              fileName: `${shortCode || "product"}_${Date.now()}.webp`,
            }),
          });
          const uploadData = await uploadRes.json();
          if (uploadRes.ok && uploadData.url && uploadData.url.startsWith("http")) {
            finalImageUrl = uploadData.url;
          } else {
            throw new Error(uploadData.error || "Failed to upload image to ImageKit");
          }
        } catch (imgErr: any) {
          console.error("ImageKit upload error:", imgErr);
          setErrorMsg(imgErr.message || "Failed to upload product image to ImageKit.");
          setIsSubmitting(false);
          return;
        }
      }

      // Find category name
      const matchedCat = categories.find((c) => c.id === selectedCategoryId);

      const res = await addItem(
        organization.id,
        {
          name: trimmedName,
          short_code: shortCode.trim() || `ITM-${Date.now().toString().slice(-4)}`,
          unit,
          price: numericPrice,
          stock: Math.max(0, parseInt(stock, 10) || 0),
          category_id: selectedCategoryId || null,
          category_name: matchedCat?.name || "Uncategorized",
          image_url: finalImageUrl,
        },
        maxItemsLimit
      );

      if (res.success && res.item) {
        setItems((prev) => [res.item!, ...prev]);
        setIsAddModalOpen(false);
        resetAddForm();
        setSuccessMsg(`Item "${res.item.name}" added successfully!`);
        setTimeout(() => setSuccessMsg(null), 3000);
      } else {
        setErrorMsg(res.error || "Failed to add item.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to add item.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Delete Item
  const handleDeleteItem = async (id: string, name: string) => {
    if (!organization?.id) return;
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;

    try {
      setDeletingId(id);
      await deleteItem(organization.id, id);
      setItems((prev) => prev.filter((it) => it.id !== id));
      setSuccessMsg(`Item "${name}" removed.`);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to delete item.");
    } finally {
      setDeletingId(null);
    }
  };

  // Handle Upload of Parsed Excel Products
  const handleUploadParsedExcel = async () => {
    if (!organization?.id || parsedExcelProducts.length === 0) return;
    if (isLimitReached) {
      setErrorMsg(`Organization item limit of ${maxItemsLimit} reached. Cannot upload.`);
      return;
    }

    try {
      setIsBulkUploading(true);
      setErrorMsg(null);
      const res = await bulkAddItems(organization.id, parsedExcelProducts, maxItemsLimit);

      if (res.added > 0) {
        const [updatedItems, updatedCats] = await Promise.all([
          fetchItems(organization.id),
          fetchCategories(organization.id),
        ]);
        setItems(updatedItems);
        setCategories(updatedCats);
        setIsBulkModalOpen(false);
        resetExcelState();
        setSuccessMsg(`Successfully imported ${res.added} items from Excel!${res.error || ""}`);
        setTimeout(() => setSuccessMsg(null), 5000);
      } else {
        setErrorMsg(res.error || "No items could be added.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Excel bulk upload failed.");
    } finally {
      setIsBulkUploading(false);
    }
  };

  // Handle Bulk Upload of 50 sample products
  const handleBulkUploadDemo = async () => {
    if (!organization?.id) return;
    if (isLimitReached) {
      setErrorMsg(`Organization item limit of ${maxItemsLimit} reached. Cannot bulk upload.`);
      return;
    }

    try {
      setIsBulkUploading(true);
      setErrorMsg(null);
      const res = await bulkAddItems(organization.id, SAMPLE_50_PRODUCTS, maxItemsLimit);

      if (res.added > 0) {
        const [updatedItems, updatedCats] = await Promise.all([
          fetchItems(organization.id),
          fetchCategories(organization.id),
        ]);
        setItems(updatedItems);
        setCategories(updatedCats);
        setIsBulkModalOpen(false);
        setSuccessMsg(`Successfully uploaded ${res.added} items into your organization!${res.error || ""}`);
        setTimeout(() => setSuccessMsg(null), 5000);
      } else {
        setErrorMsg(res.error || "No items could be added.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Bulk upload failed.");
    } finally {
      setIsBulkUploading(false);
    }
  };

  // Filtered items for display
  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.short_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.category_name || "").toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategoryFilter === "all" ||
      item.category_id === selectedCategoryFilter ||
      item.category_name === selectedCategoryFilter;

    return matchesSearch && matchesCategory;
  });

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
            <span className="text-zinc-900 dark:text-zinc-100 font-medium">Items</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-2.5">
            <Boxes className="w-6 h-6 text-emerald-500" />
            Items & Inventory
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Manage your store catalog with SKU codes, units, 60KB optimized images, and automated limits for{" "}
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
              {organization?.name || "Your Organization"}
            </span>
            .
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Quick Download Sample Template */}
          <button
            onClick={downloadSampleExcelTemplate}
            title="Download formatted sample Excel template (.xlsx)"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800/80 text-zinc-700 dark:text-zinc-300 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-emerald-500" />
            <span className="hidden md:inline">Download</span> Excel Template
          </button>

          {/* Bulk Upload & Add Item Buttons (Hidden if View-Only) */}
          {hasEditAccess ? (
            <>
              {/* Bulk Upload Modal Trigger */}
              <button
                onClick={() => {
                  setErrorMsg(null);
                  setIsBulkModalOpen(true);
                }}
                disabled={isLimitReached}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800/80 text-zinc-700 dark:text-zinc-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
                Bulk Upload
              </button>

              {/* Add Item Modal Trigger */}
              <button
                onClick={() => {
                  setErrorMsg(null);
                  resetAddForm();
                  setIsAddModalOpen(true);
                }}
                disabled={isLimitReached}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-md bg-[#3ECF8E] hover:bg-[#34b27b] text-black shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Add Item
              </button>
            </>
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

      {/* Organization Item Limit Card & Meter */}
      <div className="p-4 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center gap-2">
            <Scale className="w-4 h-4 text-emerald-500" />
            <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
              Organization Items Limit:
            </span>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
              {currentCount} / {maxItemsLimit} items
            </span>
            {isLimitReached ? (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-400 border border-red-200 dark:border-red-800">
                Limit Reached
              </span>
            ) : (
              <span className="text-[10px] font-mono text-zinc-500">
                ({remainingQuota} slots remaining)
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-zinc-500">
            <Building2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>Scoped to: {organization?.name || "This Org"}</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-2 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${
              isLimitReached
                ? "bg-red-500"
                : quotaPercentage > 80
                ? "bg-amber-500"
                : "bg-emerald-500"
            }`}
            style={{ width: `${quotaPercentage}%` }}
          />
        </div>
      </div>

      {/* Main Table Container */}
      <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-sm">
        {/* Table Toolbar */}
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="flex flex-1 items-center gap-3 max-w-xl">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search items by name or short code..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 placeholder:text-zinc-400 text-zinc-900 dark:text-zinc-100"
              />
            </div>

            {/* Category Filter */}
            <div className="w-56 shrink-0">
              <CustomDropdown
                value={selectedCategoryFilter}
                onChange={setSelectedCategoryFilter}
                options={[
                  { value: "all", label: `All Categories (${categories.length})` },
                  ...categories.map((c) => ({ value: c.id, label: c.name })),
                ]}
                size="sm"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400 font-mono">
            <span>
              Showing {filteredItems.length} of {items.length} items
            </span>
          </div>
        </div>

        {/* Content Area */}
        {isLoading ? (
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-emerald-500 mb-2" />
            <p className="text-xs text-zinc-500">Loading catalog items...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800/80 flex items-center justify-center mb-3">
              <Boxes className="w-6 h-6 text-zinc-400" />
            </div>
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              {searchQuery ? "No matching items found" : "No items in catalog yet"}
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mt-1">
              {searchQuery
                ? `No item matched your search "${searchQuery}".`
                : `Upload an Excel sheet, import sample products, or add items individually.`}
            </p>
            {!searchQuery && (
              <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                <button
                  onClick={downloadSampleExcelTemplate}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition-colors"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-500" />
                  Download Excel Template
                </button>
                <button
                  onClick={() => {
                    setBulkTab("excel");
                    setIsBulkModalOpen(true);
                  }}
                  disabled={isLimitReached}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition-colors"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" />
                  Upload Excel File
                </button>
                <button
                  onClick={() => {
                    resetAddForm();
                    setIsAddModalOpen(true);
                  }}
                  disabled={isLimitReached}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-md bg-[#3ECF8E] hover:bg-[#34b27b] text-black shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add First Item
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50 dark:bg-zinc-950/60 border-b border-zinc-200 dark:border-zinc-800 font-medium text-zinc-500 dark:text-zinc-400">
                <tr>
                  <th className="py-3 px-4 w-12 font-mono">#</th>
                  <th className="py-3 px-4 w-16">Image</th>
                  <th className="py-3 px-4">Item Name</th>
                  <th className="py-3 px-4">Short Code</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Unit</th>
                  <th className="py-3 px-4 text-right">Price (₹)</th>
                  <th className="py-3 px-4 text-right">Stock</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {filteredItems.map((item, index) => (
                  <tr
                    key={item.id}
                    className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 transition-colors"
                  >
                    <td className="py-3 px-4 font-mono text-zinc-400">{index + 1}</td>
                    <td className="py-3 px-4">
                      {item.image_url ? (
                        <div className="w-10 h-10 rounded border border-zinc-200 dark:border-zinc-800 overflow-hidden bg-zinc-100 dark:bg-zinc-950 flex items-center justify-center relative group">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={item.image_url}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded border border-dashed border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-zinc-300 dark:text-zinc-700">
                          <ImageIcon className="w-4 h-4" />
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-zinc-900 dark:text-zinc-100">
                        {item.name}
                      </div>
                      <div className="text-[10px] text-zinc-400 font-mono mt-0.5">
                        Org: {organization?.name || "Current"}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
                        {item.short_code}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300">
                        <FolderTree className="w-3 h-3 text-emerald-500" />
                        {item.category_name || "General"}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-mono text-zinc-600 dark:text-zinc-400 font-medium">
                        {item.unit}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-semibold text-zinc-900 dark:text-zinc-100">
                      ₹{Number(item.price).toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${
                          (item.stock || 0) <= 0
                            ? "bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800"
                            : (item.stock || 0) < 10
                            ? "bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800"
                            : "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                        }`}
                      >
                        {item.stock !== undefined ? item.stock : 0} {item.unit}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {hasEditAccess && (
                        <button
                          onClick={() => handleDeleteItem(item.id, item.name)}
                          disabled={deletingId === item.id}
                          title="Delete item"
                          className="inline-flex items-center justify-center w-7 h-7 rounded text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors disabled:opacity-50 cursor-pointer"
                        >
                          {deletingId === item.id ? (
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

      {/* ========================================================================= */}
      {/* ADD SINGLE ITEM MODAL                                                     */}
      {/* ========================================================================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
            {/* Modal Header */}
            <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  <Boxes className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    Add New Product / Item
                  </h3>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    Add an inventory SKU to {organization?.name || "organization"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  if (!isSubmitting) setIsAddModalOpen(false);
                }}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 text-sm font-mono"
              >
                ✕
              </button>
            </div>

            {/* Modal Form Scrollable Body */}
            <form onSubmit={handleAddItem} className="p-5 space-y-4 overflow-y-auto flex-1">
              {/* Image Upload with 60KB Compression Indicator */}
              <div className="p-3.5 rounded-lg border border-dashed border-zinc-300 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-950/50">
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5 flex items-center justify-between">
                  <span>Product Image (Auto-compressed to &le; 60KB & ImageKit Upload)</span>
                  {compressedSizeKB !== null && (
                    <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      Optimized: {compressedSizeKB} KB
                    </span>
                  )}
                </label>

                <div className="flex items-center gap-4">
                  {compressedBase64 ? (
                    <div className="w-16 h-16 rounded border border-zinc-200 dark:border-zinc-800 overflow-hidden relative flex-shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={compressedBase64}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded border border-dashed border-zinc-300 dark:border-zinc-700 flex items-center justify-center text-zinc-400 flex-shrink-0">
                      <ImageIcon className="w-6 h-6" />
                    </div>
                  )}

                  <div className="flex-1 space-y-1">
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/*"
                      onChange={handleImageChange}
                      className="block w-full text-xs text-zinc-500 file:mr-3 file:py-1 file:px-2.5 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-zinc-200 dark:file:bg-zinc-800 file:text-zinc-700 dark:file:text-zinc-200 hover:file:bg-zinc-300 cursor-pointer"
                    />

                    {isCompressing && (
                      <div className="flex items-center gap-1.5 text-[11px] text-zinc-500">
                        <Loader2 className="w-3 h-3 animate-spin text-emerald-500" />
                        <span>Compressing image to strictly under 60KB...</span>
                      </div>
                    )}

                    {originalSizeKB !== null && compressedSizeKB !== null && !isCompressing && (
                      <div className="text-[11px] text-zinc-500 font-mono">
                        Original: <span className="line-through">{originalSizeKB} KB</span> &rarr;{" "}
                        <span className="font-semibold text-emerald-500">
                          {compressedSizeKB} KB
                        </span>{" "}
                        (&le; 60KB ready for ImageKit)
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Item Name */}
              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Item Name <span className="text-emerald-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  placeholder="e.g. Royal Basmati Rice 5kg, Amul Butter 500g"
                  className="w-full px-3 py-2 text-xs bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-500 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400"
                />
              </div>

              {/* Short Code & Unit */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Short Code / SKU <span className="text-emerald-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={shortCode}
                    onChange={(e) => setShortCode(e.target.value)}
                    placeholder="e.g. RIC-001, MLK-014"
                    className="w-full px-3 py-2 text-xs font-mono bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-500 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Unit <span className="text-emerald-500">*</span>
                  </label>
                  <CustomDropdown
                    value={unit}
                    onChange={(val) => setUnit(val as any)}
                    options={[
                      { value: "Piece", label: "Piece" },
                      { value: "KG", label: "KG" },
                      { value: "Litre", label: "Litre" },
                    ]}
                    size="md"
                  />
                </div>
              </div>

              {/* Price, Stock & Category Dropdown */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Price (₹) <span className="text-emerald-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="e.g. 540.00"
                    className="w-full px-3 py-2 text-xs font-mono bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-500 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Stock Count (Qty) <span className="text-emerald-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    placeholder="e.g. 50"
                    className="w-full px-3 py-2 text-xs font-mono bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-500 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                      Category
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowInlineCat(!showInlineCat)}
                      className="text-[11px] text-emerald-500 hover:text-emerald-600 font-medium"
                    >
                      {showInlineCat ? "Select Existing" : "+ New"}
                    </button>
                  </div>

                  {!showInlineCat ? (
                    <CustomDropdown
                      value={selectedCategoryId}
                      onChange={setSelectedCategoryId}
                      placeholder="-- Select Category --"
                      options={[
                        { value: "", label: "-- None / Select Category --" },
                        ...categories.map((c) => ({ value: c.id, label: c.name })),
                      ]}
                      size="md"
                    />
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        value={inlineCatName}
                        onChange={(e) => setInlineCatName(e.target.value)}
                        placeholder="Category name..."
                        className="flex-1 px-2.5 py-1.5 text-xs bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-500 text-zinc-900 dark:text-zinc-100"
                      />
                      <button
                        type="button"
                        disabled={isAddingInlineCat || !inlineCatName.trim()}
                        onClick={handleCreateInlineCategory}
                        className="px-2.5 py-1.5 text-xs font-semibold rounded bg-emerald-500 text-black hover:bg-emerald-600 disabled:opacity-50"
                      >
                        {isAddingInlineCat ? "..." : "Add"}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Organization Data Isolation note */}
              <div className="p-3 rounded-md bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800/80 flex items-start gap-2.5">
                <Building2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                <div className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  Product will be scoped strictly to{" "}
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                    {organization?.name || "Your Organization"}
                  </span>
                  . Organization item limit: {currentCount} / {maxItemsLimit}.
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-200 dark:border-zinc-800">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3.5 py-1.5 text-xs font-medium rounded-md border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !itemName.trim() || isLimitReached}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-md bg-[#3ECF8E] hover:bg-[#34b27b] text-black shadow-sm disabled:opacity-50 transition-all"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Saving Item...
                    </>
                  ) : (
                    "Save Item"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* BULK UPLOAD MODAL (EXCEL FILE & 50 RETAIL DEMO)                            */}
      {/* ========================================================================= */}
      {isBulkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
            {/* Modal Header */}
            <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  <FileSpreadsheet className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    Bulk Upload Products
                  </h3>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    Import via custom Excel spreadsheet (.xlsx, .csv) or sample catalog
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  if (!isBulkUploading) setIsBulkModalOpen(false);
                }}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 text-sm font-mono"
              >
                ✕
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="flex border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/50 px-4">
              <button
                type="button"
                onClick={() => setBulkTab("excel")}
                className={`py-2.5 px-4 text-xs font-semibold border-b-2 flex items-center gap-2 transition-colors ${
                  bulkTab === "excel"
                    ? "border-emerald-500 text-emerald-600 dark:text-emerald-400 bg-white dark:bg-zinc-900"
                    : "border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
                }`}
              >
                <FileUp className="w-3.5 h-3.5" />
                Upload Excel / CSV File
              </button>
              <button
                type="button"
                onClick={() => setBulkTab("sample")}
                className={`py-2.5 px-4 text-xs font-semibold border-b-2 flex items-center gap-2 transition-colors ${
                  bulkTab === "sample"
                    ? "border-emerald-500 text-emerald-600 dark:text-emerald-400 bg-white dark:bg-zinc-900"
                    : "border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
                }`}
              >
                <UploadCloud className="w-3.5 h-3.5" />
                50 Ready-Made Demo SKUs
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-5 space-y-4 overflow-y-auto flex-1">
              {/* Organization Limits Banner */}
              <div className="p-3.5 rounded-lg bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 flex items-start gap-3">
                <Info className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-zinc-700 dark:text-zinc-300 space-y-1">
                  <div className="font-semibold text-zinc-900 dark:text-zinc-100">
                    Organization Limit & Auto-Category Assignment
                  </div>
                  <div>
                    Inventory status: <strong>{currentCount}</strong> / <strong>{maxItemsLimit}</strong> items.
                    {remainingQuota > 0 ? (
                      <span className="text-emerald-600 dark:text-emerald-400 ml-1 font-medium">
                        You can upload up to {remainingQuota} items under {organization?.name || "your organization"}.
                      </span>
                    ) : (
                      <span className="text-red-600 dark:text-red-400 ml-1 font-medium">
                        Maximum limit of {maxItemsLimit} items reached for this organization.
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-zinc-500">
                    * If a category in the spreadsheet does not exist yet, Bill Next will automatically create it under your organization.
                  </div>
                </div>
              </div>

              {/* TAB 1: EXCEL FILE UPLOAD */}
              {bulkTab === "excel" && (
                <div className="space-y-4">
                  {/* Download Template Strip */}
                  <div className="p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="space-y-0.5">
                      <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                        <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
                        Sample Excel Template
                      </div>
                      <p className="text-[11px] text-zinc-500">
                        Includes standard column headers: <strong>Item Name</strong>, <strong>Short Code</strong>, <strong>Category</strong>, <strong>Unit</strong> (Piece, KG, Litre), and <strong>Price</strong>.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={downloadSampleExcelTemplate}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md bg-[#3ECF8E] hover:bg-[#34b27b] text-black shadow-sm shrink-0 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Download Sample Excel (.xlsx)
                    </button>
                  </div>

                  {/* File Upload Drop Area */}
                  <div className="border-2 border-dashed border-zinc-300 dark:border-zinc-700 hover:border-emerald-500 dark:hover:border-emerald-500 rounded-lg p-6 text-center bg-zinc-50/50 dark:bg-zinc-950/50 transition-colors">
                    <input
                      type="file"
                      ref={excelInputRef}
                      accept=".xlsx, .xls, .csv"
                      onChange={handleExcelFileChange}
                      className="hidden"
                      id="excel-file-upload-input"
                    />
                    <label
                      htmlFor="excel-file-upload-input"
                      className="cursor-pointer flex flex-col items-center justify-center space-y-2"
                    >
                      <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                        <FileUp className="w-6 h-6" />
                      </div>
                      <div>
                        <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                          {excelFile ? excelFile.name : "Click to choose Excel file (.xlsx, .xls, .csv)"}
                        </span>
                        <p className="text-[11px] text-zinc-400 mt-0.5">
                          {excelFile
                            ? `${(excelFile.size / 1024).toFixed(1)} KB · ${parsedExcelProducts.length} items parsed`
                            : "or drag and drop your spreadsheet here"}
                        </p>
                      </div>
                    </label>

                    {excelFile && (
                      <button
                        type="button"
                        onClick={resetExcelState}
                        className="mt-3 inline-flex items-center gap-1 text-[11px] text-zinc-400 hover:text-red-500"
                      >
                        <X className="w-3 h-3" />
                        Remove file and select another
                      </button>
                    )}
                  </div>

                  {/* Parse Loading Spinner */}
                  {isParsingExcel && (
                    <div className="p-4 text-center flex items-center justify-center gap-2 text-xs text-zinc-500">
                      <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />
                      Parsing spreadsheet rows...
                    </div>
                  )}

                  {/* Validation errors/warnings */}
                  {excelParseErrors.length > 0 && (
                    <div className="p-3 rounded-md bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 text-xs text-amber-800 dark:text-amber-300 space-y-1">
                      <div className="font-semibold flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5" />
                        Spreadsheet Notes ({excelParseErrors.length}):
                      </div>
                      <div className="max-h-20 overflow-y-auto text-[11px] font-mono space-y-0.5">
                        {excelParseErrors.map((err, i) => (
                          <div key={i}>&bull; {err}</div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Parsed Products Preview Table */}
                  {parsedExcelProducts.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                        <span>Previewing Excel Rows ({parsedExcelProducts.length} items):</span>
                        <span className="text-[11px] text-zinc-400 font-mono">
                          Limit capacity: {Math.min(parsedExcelProducts.length, remainingQuota)} will be added
                        </span>
                      </div>

                      <div className="border border-zinc-200 dark:border-zinc-800 rounded-md overflow-hidden max-h-56 overflow-y-auto divide-y divide-zinc-200 dark:divide-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-xs">
                        {parsedExcelProducts.map((p, idx) => (
                          <div
                            key={idx}
                            className="p-2.5 flex items-center justify-between hover:bg-white dark:hover:bg-zinc-900"
                          >
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-zinc-400 text-[10px] w-6">
                                {idx + 1}
                              </span>
                              <div>
                                <div className="font-medium text-zinc-900 dark:text-zinc-100">
                                  {p.name}
                                </div>
                                <div className="text-[10px] text-zinc-400 font-mono">
                                  {p.short_code} &bull; {p.category_name} &bull; Unit: {p.unit} &bull; Stock: {p.stock ?? 0}
                                </div>
                              </div>
                            </div>
                            <div className="font-mono font-semibold text-zinc-900 dark:text-zinc-100">
                              ₹{Number(p.price).toFixed(2)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: READY-MADE 50 RETAIL DEMO SKUS */}
              {bulkTab === "sample" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    <span>Curated Retail Catalog (50 items):</span>
                    <span className="text-[11px] text-zinc-400 font-mono">
                      Supermarket staples, beverages, dairy & snacks
                    </span>
                  </div>

                  <div className="border border-zinc-200 dark:border-zinc-800 rounded-md overflow-hidden max-h-60 overflow-y-auto divide-y divide-zinc-200 dark:divide-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-xs">
                    {SAMPLE_50_PRODUCTS.map((p, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 flex items-center justify-between hover:bg-white dark:hover:bg-zinc-900"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-zinc-400 text-[10px] w-5">
                            {idx + 1}
                          </span>
                          <div>
                            <div className="font-medium text-zinc-900 dark:text-zinc-100">
                              {p.name}
                            </div>
                            <div className="text-[10px] text-zinc-400 font-mono">
                              {p.short_code} &bull; {p.category_name} &bull; Unit: {p.unit} &bull; Stock: {p.stock ?? 0}
                            </div>
                          </div>
                        </div>
                        <div className="font-mono font-semibold text-zinc-900 dark:text-zinc-100">
                          ₹{p.price.toFixed(2)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-200 dark:border-zinc-800">
                <button
                  type="button"
                  disabled={isBulkUploading}
                  onClick={() => setIsBulkModalOpen(false)}
                  className="px-3.5 py-1.5 text-xs font-medium rounded-md border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition-colors"
                >
                  Cancel
                </button>

                {bulkTab === "excel" ? (
                  <button
                    type="button"
                    disabled={isBulkUploading || parsedExcelProducts.length === 0 || remainingQuota <= 0}
                    onClick={handleUploadParsedExcel}
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-md bg-[#3ECF8E] hover:bg-[#34b27b] text-black shadow-sm disabled:opacity-50 transition-all"
                  >
                    {isBulkUploading ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Uploading Excel Items...
                      </>
                    ) : (
                      `Upload ${Math.min(parsedExcelProducts.length, remainingQuota)} Excel Items`
                    )}
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={isBulkUploading || remainingQuota <= 0}
                    onClick={handleBulkUploadDemo}
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-md bg-[#3ECF8E] hover:bg-[#34b27b] text-black shadow-sm disabled:opacity-50 transition-all"
                  >
                    {isBulkUploading ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Uploading Demo SKUs...
                      </>
                    ) : (
                      `Upload ${Math.min(50, remainingQuota)} Demo Items`
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
