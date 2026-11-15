"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth/auth-context";
import { Item, Category, Customer, BillItem, DraftBill, SplitPayment } from "@/lib/auth/types";
import { fetchItems } from "@/lib/data/items";
import { fetchCategories } from "@/lib/data/categories";
import { fetchCustomers, addCustomer } from "@/lib/data/customers";
import { saveBill, fetchDraftBills, saveDraftBill, deleteDraftBill } from "@/lib/data/bills";
import {
  Receipt,
  Search,
  Plus,
  Minus,
  Trash2,
  Edit2,
  Users,
  CreditCard,
  Banknote,
  QrCode,
  Layers,
  Save,
  Printer,
  CheckCircle2,
  AlertCircle,
  Building2,
  Loader2,
  Scale,
  Sparkles,
  X,
  FileText,
  Phone,
  MapPin,
  ChevronDown,
  ShoppingBag,
  ArrowRight
} from "lucide-react";

export const dynamic = "force-dynamic";

export default function BillingPage() {
  const { organization, isLoading: authLoading, role, canEdit } = useAuth();
  const hasEditAccess = role === "owner" || canEdit("/billing");

  // Inventory & Catalog State
  const [items, setItems] = useState<Item[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoadingItems, setIsLoadingItems] = useState(true);
  const [searchItemQuery, setSearchItemQuery] = useState("");
  const [selectedCatFilter, setSelectedCatFilter] = useState("all");

  // Cart / Order Summary State
  const [cartItems, setCartItems] = useState<BillItem[]>([]);
  const [activeDraftId, setActiveDraftId] = useState<string | null>(null);

  // Customer State
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [customerSearchQuery, setCustomerSearchQuery] = useState("");
  const [isAddingNewCustomer, setIsAddingNewCustomer] = useState(false);
  const [newCustName, setNewCustName] = useState("");
  const [newCustMobile, setNewCustMobile] = useState("");
  const [newCustCity, setNewCustCity] = useState("");

  // Payment Method State
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "UPI" | "CARD" | "SPLIT">("CASH");
  const [splitPayment, setSplitPayment] = useState<SplitPayment>({ upi: 0, cash: 0, card: 0 });
  const [isSplitModalOpen, setIsSplitModalOpen] = useState(false);

  // Weight / Rupees Modal for KG / Litre
  const [weightModalItem, setWeightModalItem] = useState<Item | null>(null);
  const [weightInputMode, setWeightInputMode] = useState<"weight" | "rupees">("weight");
  const [weightValue, setWeightValue] = useState("");
  const [rupeesValue, setRupeesValue] = useState("");

  // Edit Line Item Modal State
  const [editingItem, setEditingItem] = useState<BillItem | null>(null);
  const [editQuantity, setEditQuantity] = useState("");
  const [editPrice, setEditPrice] = useState("");

  // Drafted Bills State
  const [draftBills, setDraftBills] = useState<DraftBill[]>([]);
  const [isDraftsDropdownOpen, setIsDraftsDropdownOpen] = useState(false);

  // Settled Receipt Modal
  const [settledBill, setSettledBill] = useState<any | null>(null);
  const [isSettling, setIsSettling] = useState(false);

  // Notifications
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Load Inventory, Categories, Customers & Drafts
  const loadData = async () => {
    if (!organization?.id) return;
    try {
      setIsLoadingItems(true);
      const [itemsData, catsData, custsData] = await Promise.all([
        fetchItems(organization.id),
        fetchCategories(organization.id),
        fetchCustomers(organization.id),
      ]);
      setItems(itemsData);
      setCategories(catsData);
      setCustomers(custsData);
      setDraftBills(fetchDraftBills(organization.id));
    } catch (err) {
      console.error("Error loading billing data:", err);
    } finally {
      setIsLoadingItems(false);
    }
  };

  useEffect(() => {
    if (organization?.id) {
      loadData();
    } else if (!authLoading) {
      setIsLoadingItems(false);
    }
  }, [organization?.id, authLoading]);

  // Tax and Total Calculations
  const gstEnabled = Boolean(organization?.gst_enabled);
  const gstRate = gstEnabled ? Number(organization?.gst_percentage) || 18 : 0;
  const gstType = organization?.gst_type || "exclusive"; // 'inclusive' or 'exclusive'

  const subtotal = cartItems.reduce((acc, it) => acc + it.total, 0);

  let taxAmount = 0;
  let finalTotal = subtotal;

  if (gstEnabled && subtotal > 0) {
    if (gstType === "exclusive") {
      taxAmount = Math.round((subtotal * gstRate) / 100 * 100) / 100;
      finalTotal = Math.round((subtotal + taxAmount) * 100) / 100;
    } else {
      // Inclusive: Tax is already inside subtotal
      taxAmount = Math.round(((subtotal * gstRate) / (100 + gstRate)) * 100) / 100;
      finalTotal = subtotal;
    }
  }

  // Handle Item Click in Catalog
  const handleItemClick = (item: Item) => {
    setErrorMsg(null);
    const unitUpper = (item.unit || "Piece").toUpperCase();

    // If KG or Litre, open weight/rupees selection prompt
    if (unitUpper === "KG" || unitUpper === "LITRE") {
      setWeightModalItem(item);
      setWeightInputMode("weight");
      setWeightValue("1");
      setRupeesValue(item.price.toString());
      return;
    }

    // Piece: If already in cart, increment quantity; otherwise add
    setCartItems((prev) => {
      const existing = prev.find((it) => it.item_id === item.id && it.unit === "Piece");
      if (existing) {
        return prev.map((it) => {
          if (it.id === existing.id) {
            const nextQty = it.quantity + 1;
            return {
              ...it,
              quantity: nextQty,
              total: Math.round(nextQty * it.price * 100) / 100,
            };
          }
          return it;
        });
      }

      const newLineItem: BillItem = {
        id: "item_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6),
        item_id: item.id,
        name: item.name,
        short_code: item.short_code,
        unit: item.unit,
        price: Number(item.price),
        quantity: 1,
        total: Number(item.price),
        selection_mode: "piece",
      };
      return [newLineItem, ...prev];
    });
  };

  // Add Weighed / Volumetric Item to Cart
  const handleConfirmWeightItem = () => {
    if (!weightModalItem) return;

    let qty = 1;
    let lineTotal = Number(weightModalItem.price);

    if (weightInputMode === "weight") {
      const parsedWeight = parseFloat(weightValue);
      if (isNaN(parsedWeight) || parsedWeight <= 0) {
        alert("Please enter a valid weight or quantity");
        return;
      }
      qty = parsedWeight;
      lineTotal = Math.round(qty * Number(weightModalItem.price) * 100) / 100;
    } else {
      const parsedRupees = parseFloat(rupeesValue);
      if (isNaN(parsedRupees) || parsedRupees <= 0) {
        alert("Please enter a valid rupee amount");
        return;
      }
      lineTotal = parsedRupees;
      qty = Math.round((parsedRupees / Number(weightModalItem.price)) * 1000) / 1000;
    }

    // Always add a NEW line item for KG / Litre (as user requested distinct entries)
    const newLineItem: BillItem = {
      id: "weight_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6),
      item_id: weightModalItem.id,
      name: weightModalItem.name,
      short_code: weightModalItem.short_code,
      unit: weightModalItem.unit,
      price: Number(weightModalItem.price),
      quantity: qty,
      total: lineTotal,
      selection_mode: weightInputMode,
      weight_or_rupees_input: weightInputMode === "weight" ? parseFloat(weightValue) : parseFloat(rupeesValue),
    };

    setCartItems((prev) => [newLineItem, ...prev]);
    setWeightModalItem(null);
  };

  // Quantity Increment / Decrement
  const handleAdjustQuantity = (cartItemId: string, delta: number) => {
    setCartItems((prev) =>
      prev
        .map((it) => {
          if (it.id === cartItemId) {
            const step = it.unit === "Piece" ? 1 : 0.25;
            const newQty = Math.max(0, Math.round((it.quantity + delta * step) * 1000) / 1000);
            return {
              ...it,
              quantity: newQty,
              total: Math.round(newQty * it.price * 100) / 100,
            };
          }
          return it;
        })
        .filter((it) => it.quantity > 0)
    );
  };

  // Remove Item from Cart
  const handleRemoveFromCart = (cartItemId: string) => {
    setCartItems((prev) => prev.filter((it) => it.id !== cartItemId));
  };

  // Open Edit Line Item Modal
  const handleOpenEditItem = (item: BillItem) => {
    setEditingItem(item);
    setEditQuantity(item.quantity.toString());
    setEditPrice(item.price.toString());
  };

  // Save Line Item Edit
  const handleSaveEditItem = () => {
    if (!editingItem) return;
    const qty = parseFloat(editQuantity);
    const prc = parseFloat(editPrice);
    if (isNaN(qty) || qty <= 0 || isNaN(prc) || prc < 0) {
      alert("Please enter valid positive numbers for quantity and price");
      return;
    }

    setCartItems((prev) =>
      prev.map((it) => {
        if (it.id === editingItem.id) {
          return {
            ...it,
            quantity: qty,
            price: prc,
            total: Math.round(qty * prc * 100) / 100,
          };
        }
        return it;
      })
    );
    setEditingItem(null);
  };

  // Save Current Cart as a Draft Bill
  const handleSaveDraft = () => {
    if (!organization?.id) return;
    if (cartItems.length === 0) {
      setErrorMsg("Cannot draft an empty bill. Add items first.");
      return;
    }

    const draftName = selectedCustomer
      ? `${selectedCustomer.name} (${cartItems.length} items)`
      : `Draft #${draftBills.length + 1} (${cartItems.length} items)`;

    const saved = saveDraftBill(organization.id, {
      org_id: organization.id,
      draft_name: draftName,
      customer: selectedCustomer,
      items: cartItems,
      total: finalTotal,
    });

    setDraftBills(fetchDraftBills(organization.id));
    setCartItems([]);
    setSelectedCustomer(null);
    setActiveDraftId(null);
    setSuccessMsg(`Draft "${draftName}" saved to queue.`);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  // Load a Drafted Bill into Active Checkout
  const handleLoadDraft = (draft: DraftBill) => {
    setCartItems(draft.items);
    setSelectedCustomer(draft.customer || null);
    setActiveDraftId(draft.id);
    setIsDraftsDropdownOpen(false);
    setSuccessMsg(`Loaded draft: ${draft.draft_name}`);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  // Delete a Drafted Bill
  const handleDeleteDraft = (e: React.MouseEvent, draftId: string) => {
    e.stopPropagation();
    if (!organization?.id) return;
    deleteDraftBill(organization.id, draftId);
    setDraftBills(fetchDraftBills(organization.id));
    if (activeDraftId === draftId) {
      setActiveDraftId(null);
    }
  };

  // Add Inline Customer from Billing Modal
  const handleAddInlineCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organization?.id) return;
    const trimmedName = newCustName.trim();
    const trimmedMobile = newCustMobile.trim();
    if (!trimmedName || !trimmedMobile) {
      alert("Name and Mobile are required");
      return;
    }

    try {
      const created = await addCustomer(organization.id, {
        name: trimmedName,
        mobile_number: trimmedMobile,
        city: newCustCity.trim(),
      });
      setCustomers((prev) => [created, ...prev]);
      setSelectedCustomer(created);
      setIsAddingNewCustomer(false);
      setIsCustomerModalOpen(false);
      setNewCustName("");
      setNewCustMobile("");
      setNewCustCity("");
    } catch (err: any) {
      alert(err.message || "Failed to create customer");
    }
  };

  // Open Split Payment Modal
  const handleOpenSplit = () => {
    setSplitPayment({
      upi: Math.round((finalTotal / 2) * 100) / 100,
      cash: Math.round((finalTotal / 2) * 100) / 100,
      card: 0,
    });
    setPaymentMethod("SPLIT");
    setIsSplitModalOpen(true);
  };

  // Settle Bill
  const handleSettleBill = async () => {
    if (!organization?.id) {
      setErrorMsg("No active organization found. Please log in.");
      return;
    }

    if (cartItems.length === 0) {
      setErrorMsg("Order summary is empty. Please add items to bill.");
      return;
    }

    // Utility Check: Out-of-stock billing validation
    const allowOutOfStock = organization.allow_out_of_stock_billing !== false;
    if (!allowOutOfStock) {
      const outOfStockItems = cartItems.filter((cartIt) => {
        const catalogItem = items.find((i) => i.id === cartIt.item_id);
        const currentStock = catalogItem?.stock || 0;
        return currentStock < cartIt.quantity;
      });

      if (outOfStockItems.length > 0) {
        const itemNames = outOfStockItems.map((i) => i.name).join(", ");
        setErrorMsg(
          `Cannot settle bill: "${itemNames}" has insufficient inventory and out-of-stock billing is disabled in Settings.`
        );
        return;
      }
    }

    try {
      setIsSettling(true);
      setErrorMsg(null);

      const billNo = `BN-${Date.now().toString().slice(-6)}`;

      const billPayload = {
        org_id: organization.id,
        bill_number: billNo,
        customer_id: selectedCustomer?.id || null,
        customer_name: selectedCustomer?.name || "Walk-in Customer",
        customer_mobile: selectedCustomer?.mobile_number || "",
        items: cartItems,
        subtotal,
        gst_percentage: gstRate,
        tax_amount: taxAmount,
        total_amount: finalTotal,
        payment_method: paymentMethod,
        split_details: paymentMethod === "SPLIT" ? splitPayment : null,
        created_at: new Date().toISOString(),
      };

      const saved = await saveBill(organization.id, billPayload);

      // If this was settled from a draft, remove it from drafts
      if (activeDraftId) {
        deleteDraftBill(organization.id, activeDraftId);
        setDraftBills(fetchDraftBills(organization.id));
        setActiveDraftId(null);
      }

      // Update in-memory item stock
      setItems((prev) =>
        prev.map((it) => {
          const deduction = cartItems.find((ci) => ci.item_id === it.id);
          if (deduction) {
            return {
              ...it,
              stock: Math.max(0, (it.stock || 0) - Math.ceil(deduction.quantity)),
            };
          }
          return it;
        })
      );

      // Show Settled Bill Modal for Print & Close
      setSettledBill(saved);
      setCartItems([]);
      setSelectedCustomer(null);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to settle bill.");
    } finally {
      setIsSettling(false);
    }
  };

  // Filter Catalog Items
  const filteredItems = items.filter((it) => {
    const matchesSearch =
      it.name.toLowerCase().includes(searchItemQuery.toLowerCase()) ||
      it.short_code.toLowerCase().includes(searchItemQuery.toLowerCase());
    const matchesCat =
      selectedCatFilter === "all" ||
      it.category_id === selectedCatFilter ||
      it.category_name === selectedCatFilter;
    return matchesSearch && matchesCat;
  });

  // Filter Customers in Modal
  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(customerSearchQuery.toLowerCase()) ||
      c.mobile_number.includes(customerSearchQuery)
  );

  return (
    <div className="p-4 sm:p-6 max-w-[1600px] mx-auto space-y-4">
      {/* Top Bar: Breadcrumb, Drafts Queue & Quick Controls */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 pb-3 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-zinc-500 mb-0.5">
            <Link href="/" className="hover:text-emerald-500 transition-colors">
              Bill Next
            </Link>
            <span>/</span>
            <span className="text-zinc-400">POS</span>
            <span>/</span>
            <span className="text-zinc-900 dark:text-zinc-100 font-medium">Billing Terminal</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <Receipt className="w-5 h-5 text-emerald-500" />
            POS Billing Register
            <span className="text-xs font-normal font-mono px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300">
              {organization?.name || "Store"}
            </span>
          </h1>
        </div>

        {/* Drafted Bills Dropdown & Quick Actions */}
        <div className="flex items-center gap-2.5">
          {/* Drafts Dropdown Button */}
          <div className="relative">
            <button
              onClick={() => setIsDraftsDropdownOpen(!isDraftsDropdownOpen)}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition-colors"
            >
              <Layers className="w-3.5 h-3.5 text-amber-500" />
              <span>Drafted Bills</span>
              <span className="px-1.5 py-0.2 rounded-full font-mono text-[10px] bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-semibold">
                {draftBills.length}
              </span>
              <ChevronDown className="w-3 h-3 text-zinc-400" />
            </button>

            {/* Dropdown Menu */}
            {isDraftsDropdownOpen && (
              <div className="absolute right-0 mt-1 w-72 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-xl z-30 p-2 space-y-1 max-h-72 overflow-y-auto">
                <div className="text-[11px] font-semibold text-zinc-500 px-2 py-1 flex items-center justify-between">
                  <span>Queued Draft Bills ({draftBills.length})</span>
                  <button
                    onClick={() => setIsDraftsDropdownOpen(false)}
                    className="text-zinc-400 hover:text-zinc-600"
                  >
                    ✕
                  </button>
                </div>
                {draftBills.length === 0 ? (
                  <div className="p-4 text-center text-xs text-zinc-400">
                    No drafted bills in queue. Click &quot;Draft Bill&quot; to hold an active ticket.
                  </div>
                ) : (
                  draftBills.map((draft) => (
                    <div
                      key={draft.id}
                      onClick={() => handleLoadDraft(draft)}
                      className={`p-2 rounded text-xs cursor-pointer flex items-center justify-between transition-colors ${
                        activeDraftId === draft.id
                          ? "bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/60"
                          : "hover:bg-zinc-50 dark:hover:bg-zinc-800/60"
                      }`}
                    >
                      <div className="space-y-0.5 truncate pr-2">
                        <div className="font-medium text-zinc-900 dark:text-zinc-100 truncate">
                          {draft.draft_name}
                        </div>
                        <div className="text-[10px] text-zinc-400 font-mono">
                          {draft.items.length} items &bull; ₹{draft.total.toFixed(2)} &bull;{" "}
                          {new Date(draft.saved_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </div>
                      </div>
                      <button
                        onClick={(e) => handleDeleteDraft(e, draft.id)}
                        title="Delete draft"
                        className="text-zinc-400 hover:text-red-500 p-1 shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          <Link
            href="/customers"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition-colors"
          >
            <Users className="w-3.5 h-3.5 text-emerald-500" />
            <span className="hidden sm:inline">Customers</span>
          </Link>

          <Link
            href="/sales"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition-colors"
          >
            <FileText className="w-3.5 h-3.5 text-emerald-500" />
            <span className="hidden sm:inline">Sales Ledger</span>
          </Link>
        </div>
      </div>

      {/* Notifications / Alerts */}
      {successMsg && (
        <div className="flex items-center gap-2 px-4 py-2.5 text-xs rounded-md bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-500" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="flex items-center gap-2 px-4 py-2.5 text-xs rounded-md bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 text-red-800 dark:text-red-300">
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-500" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Dual Split Layout: Left Catalog Grid, Right Order Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* ========================================================================= */}
        {/* LEFT COLUMN: ITEM CATALOG (GRID OF CARDS)                                 */}
        {/* ========================================================================= */}
        <div className="lg:col-span-7 space-y-3">
          {/* Search Bar & Category Filter Strip */}
          <div className="p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm space-y-2.5">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                value={searchItemQuery}
                onChange={(e) => setSearchItemQuery(e.target.value)}
                placeholder="Search products by name or SKU / short code..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-500 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400"
              />
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
              <button
                type="button"
                onClick={() => setSelectedCatFilter("all")}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors shrink-0 ${
                  selectedCatFilter === "all"
                    ? "bg-[#3ECF8E] text-black font-semibold"
                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                }`}
              >
                All Products
              </button>
              {categories.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedCatFilter(c.id)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors shrink-0 ${
                    selectedCatFilter === c.id
                      ? "bg-[#3ECF8E] text-black font-semibold"
                      : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          {/* Product Items Grid */}
          {isLoadingItems ? (
            <div className="p-16 text-center flex flex-col items-center justify-center bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
              <Loader2 className="w-6 h-6 animate-spin text-emerald-500 mb-2" />
              <p className="text-xs text-zinc-500">Loading catalog items...</p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
              <ShoppingBag className="w-8 h-8 text-zinc-300 dark:text-zinc-700 mx-auto mb-2" />
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                No items found
              </h3>
              <p className="text-xs text-zinc-400 mt-1">
                {searchItemQuery
                  ? `No product matches "${searchItemQuery}".`
                  : "Go to Items page to add products or bulk import items."}
              </p>
              <Link
                href="/items"
                className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded bg-emerald-500 text-black hover:bg-emerald-600"
              >
                Go to Items
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-[calc(100vh-14rem)] overflow-y-auto p-1">
              {filteredItems.map((item) => {
                const isOutOfStock = (item.stock || 0) <= 0;
                return (
                  <div
                    key={item.id}
                    onClick={() => handleItemClick(item)}
                    className="p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-emerald-500 dark:hover:border-emerald-500 hover:shadow-md cursor-pointer transition-all flex flex-col justify-between group select-none"
                  >
                    <div>
                      {/* Image Thumbnail */}
                      <div className="w-full h-20 rounded border border-zinc-100 dark:border-zinc-800 overflow-hidden bg-zinc-50 dark:bg-zinc-950 mb-2 flex items-center justify-center relative">
                        {item.image_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={item.image_url}
                            alt={item.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        ) : (
                          <ShoppingBag className="w-6 h-6 text-zinc-300 dark:text-zinc-700" />
                        )}

                        {/* Unit Badge */}
                        <span className="absolute top-1 right-1 px-1.5 py-0.5 rounded text-[9px] font-mono font-semibold bg-black/70 text-white backdrop-blur-xs">
                          {item.unit}
                        </span>
                      </div>

                      {/* Item Details */}
                      <div className="font-semibold text-xs text-zinc-900 dark:text-zinc-100 line-clamp-2 leading-tight">
                        {item.name}
                      </div>
                      <div className="text-[10px] text-zinc-400 font-mono mt-0.5">
                        {item.short_code} &bull; {item.category_name || "General"}
                      </div>
                    </div>

                    {/* Price & Stock Strip */}
                    <div className="mt-2.5 pt-2 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                      <div className="font-mono font-bold text-xs text-emerald-600 dark:text-emerald-400">
                        ₹{Number(item.price).toFixed(2)}
                      </div>
                      <div
                        className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${
                          isOutOfStock
                            ? "bg-red-50 text-red-600 dark:bg-red-950/60 dark:text-red-400"
                            : (item.stock || 0) < 10
                            ? "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300"
                            : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                        }`}
                      >
                        {isOutOfStock ? "0 Stock" : `${item.stock} ${item.unit}`}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* RIGHT COLUMN: ORDER SUMMARY & CHECKOUT TERMINAL                           */}
        {/* ========================================================================= */}
        <div className="lg:col-span-5 space-y-3">
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm overflow-hidden flex flex-col">
            {/* 1. Customer Selection Area (Above Order Summary) */}
            <div className="p-3.5 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-950/60 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold text-xs">
                  {selectedCustomer ? selectedCustomer.name.charAt(0).toUpperCase() : "W"}
                </div>
                <div>
                  <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                    <span>{selectedCustomer ? selectedCustomer.name : "Walk-in Customer"}</span>
                    {selectedCustomer && (
                      <span className="text-[10px] font-mono text-zinc-400">
                        ({selectedCustomer.mobile_number})
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-zinc-400">
                    {selectedCustomer?.city ? `City: ${selectedCustomer.city}` : "General retail counter sale"}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                {selectedCustomer && (
                  <button
                    onClick={() => setSelectedCustomer(null)}
                    title="Clear customer"
                    className="text-zinc-400 hover:text-red-500 p-1"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsCustomerModalOpen(true)}
                  className="px-2.5 py-1 text-[11px] font-semibold rounded border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
                >
                  {selectedCustomer ? "Change" : "+ Customer"}
                </button>
              </div>
            </div>

            {/* 2. Order Summary Header */}
            <div className="px-4 py-2.5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              <span>Order Summary ({cartItems.length} items)</span>
              {cartItems.length > 0 && (
                <button
                  onClick={() => setCartItems([])}
                  className="text-[11px] text-red-500 hover:text-red-600 font-normal"
                >
                  Clear Cart
                </button>
              )}
            </div>

            {/* 3. Cart Line Items List */}
            <div className="p-3 divide-y divide-zinc-100 dark:divide-zinc-800/80 min-h-[220px] max-h-[340px] overflow-y-auto">
              {cartItems.length === 0 ? (
                <div className="h-44 flex flex-col items-center justify-center text-center text-xs text-zinc-400">
                  <ShoppingBag className="w-8 h-8 text-zinc-300 dark:text-zinc-700 mb-2" />
                  <span>Cart is empty</span>
                  <span className="text-[11px] text-zinc-400">
                    Click items in catalog to start billing
                  </span>
                </div>
              ) : (
                cartItems.map((cartIt) => (
                  <div
                    key={cartIt.id}
                    className="py-2.5 flex items-center justify-between text-xs group"
                  >
                    <div className="flex-1 pr-3">
                      <div className="font-semibold text-zinc-900 dark:text-zinc-100 leading-tight">
                        {cartIt.name}
                      </div>
                      <div className="text-[11px] text-zinc-400 font-mono mt-0.5 flex items-center gap-2">
                        <span>
                          ₹{cartIt.price.toFixed(2)} &times; {cartIt.quantity} {cartIt.unit}
                        </span>
                        <button
                          onClick={() => handleOpenEditItem(cartIt)}
                          title="Edit quantity or rate"
                          className="text-emerald-500 hover:text-emerald-600 flex items-center gap-0.5 text-[10px]"
                        >
                          <Edit2 className="w-3 h-3" />
                          Edit
                        </button>
                      </div>
                    </div>

                    {/* Quantity Controls & Line Total */}
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="flex items-center border border-zinc-200 dark:border-zinc-800 rounded overflow-hidden">
                        <button
                          onClick={() => handleAdjustQuantity(cartIt.id, -1)}
                          className="w-6 h-6 flex items-center justify-center hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-10 text-center font-mono font-semibold text-[11px] text-zinc-900 dark:text-zinc-100">
                          {cartIt.quantity}
                        </span>
                        <button
                          onClick={() => handleAdjustQuantity(cartIt.id, 1)}
                          className="w-6 h-6 flex items-center justify-center hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <div className="font-mono font-bold text-xs text-zinc-900 dark:text-zinc-100 min-w-[60px] text-right">
                        ₹{cartIt.total.toFixed(2)}
                      </div>

                      <button
                        onClick={() => handleRemoveFromCart(cartIt.id)}
                        className="text-zinc-300 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* 4. Totals, GST Breakdown & Net Payable */}
            <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/50 space-y-2 text-xs">
              <div className="flex justify-between text-zinc-500">
                <span>Subtotal</span>
                <span className="font-mono text-zinc-800 dark:text-zinc-200">
                  ₹{subtotal.toFixed(2)}
                </span>
              </div>

              {gstEnabled && (
                <>
                  <div className="flex justify-between text-zinc-500">
                    <span>
                      GST ({gstRate}% {gstType})
                    </span>
                    <span className="font-mono text-zinc-800 dark:text-zinc-200">
                      ₹{taxAmount.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-[11px] text-zinc-400 font-mono">
                    <span>
                      CGST ({(gstRate / 2).toFixed(1)}%): ₹{(taxAmount / 2).toFixed(2)}
                    </span>
                    <span>
                      SGST ({(gstRate / 2).toFixed(1)}%): ₹{(taxAmount / 2).toFixed(2)}
                    </span>
                  </div>
                </>
              )}

              <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 flex justify-between items-baseline">
                <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  Total Payable
                </span>
                <span className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400">
                  ₹{finalTotal.toFixed(2)}
                </span>
              </div>
            </div>

            {/* 5. Payment Methods Selection */}
            <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 space-y-2.5">
              <div className="text-[11px] font-semibold text-zinc-500">
                Payment Tender: <span className="text-emerald-500">{paymentMethod}</span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod("CASH")}
                  className={`py-2 px-1 text-center rounded-md text-xs font-semibold flex flex-col items-center justify-center gap-1 transition-all ${
                    paymentMethod === "CASH"
                      ? "bg-emerald-500 text-black shadow-sm"
                      : "border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
                  }`}
                >
                  <Banknote className="w-4 h-4" />
                  CASH
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod("UPI")}
                  className={`py-2 px-1 text-center rounded-md text-xs font-semibold flex flex-col items-center justify-center gap-1 transition-all ${
                    paymentMethod === "UPI"
                      ? "bg-emerald-500 text-black shadow-sm"
                      : "border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
                  }`}
                >
                  <QrCode className="w-4 h-4" />
                  UPI
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod("CARD")}
                  className={`py-2 px-1 text-center rounded-md text-xs font-semibold flex flex-col items-center justify-center gap-1 transition-all ${
                    paymentMethod === "CARD"
                      ? "bg-emerald-500 text-black shadow-sm"
                      : "border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
                  }`}
                >
                  <CreditCard className="w-4 h-4" />
                  CARD
                </button>

                <button
                  type="button"
                  onClick={handleOpenSplit}
                  className={`py-2 px-1 text-center rounded-md text-xs font-semibold flex flex-col items-center justify-center gap-1 transition-all ${
                    paymentMethod === "SPLIT"
                      ? "bg-emerald-500 text-black shadow-sm"
                      : "border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
                  }`}
                >
                  <Layers className="w-4 h-4" />
                  SPLIT
                </button>
              </div>

              {paymentMethod === "SPLIT" && (
                <div className="p-2 rounded bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-[11px] font-mono text-emerald-800 dark:text-emerald-300 flex justify-between">
                  <span>
                    UPI: ₹{splitPayment.upi} &bull; CASH: ₹{splitPayment.cash} &bull; CARD: ₹{splitPayment.card}
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsSplitModalOpen(true)}
                    className="underline font-semibold"
                  >
                    Adjust
                  </button>
                </div>
              )}
            </div>

            {/* 6. Checkout Action Buttons: Draft & Settle */}
            <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 space-y-2">
              {!hasEditAccess && (
                <div className="text-[11px] text-center text-amber-600 dark:text-amber-400 font-mono py-1">
                  View-Only Mode: Bill settlement requires billing edit permission
                </div>
              )}
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={handleSaveDraft}
                  disabled={cartItems.length === 0 || !hasEditAccess}
                  className="py-2.5 px-3 text-xs font-semibold rounded-md border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  Draft Bill
                </button>

                <button
                  type="button"
                  onClick={handleSettleBill}
                  disabled={isSettling || cartItems.length === 0 || !hasEditAccess}
                  className="py-2.5 px-3 text-xs font-semibold rounded-md bg-[#3ECF8E] hover:bg-[#34b27b] text-black shadow-sm disabled:opacity-50 transition-all flex items-center justify-center gap-1.5 font-sans cursor-pointer"
                >
                  {isSettling ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Settling...
                    </>
                  ) : (
                    <>
                      <Printer className="w-3.5 h-3.5" />
                      Settle Bill (₹{finalTotal.toFixed(2)})
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: WEIGHT / VOLUME (KG / LITRE) PROMPT                              */}
      {/* ========================================================================= */}
      {weightModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  <Scale className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    Weighed Product Selection
                  </h3>
                  <p className="text-[11px] text-zinc-500 font-mono">
                    {weightModalItem.name} &bull; ₹{Number(weightModalItem.price).toFixed(2)} / {weightModalItem.unit}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setWeightModalItem(null)}
                className="text-zinc-400 hover:text-zinc-600 text-sm font-mono"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Mode Toggle: By Weight vs By Rupees */}
              <div className="grid grid-cols-2 p-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setWeightInputMode("weight")}
                  className={`py-1.5 rounded-md transition-colors ${
                    weightInputMode === "weight"
                      ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs"
                      : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
                  }`}
                >
                  By Weight ({weightModalItem.unit})
                </button>
                <button
                  type="button"
                  onClick={() => setWeightInputMode("rupees")}
                  className={`py-1.5 rounded-md transition-colors ${
                    weightInputMode === "rupees"
                      ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs"
                      : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
                  }`}
                >
                  By Rupees (₹)
                </button>
              </div>

              {/* Input Field */}
              {weightInputMode === "weight" ? (
                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Enter Weight in {weightModalItem.unit}
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    min="0.001"
                    autoFocus
                    value={weightValue}
                    onChange={(e) => setWeightValue(e.target.value)}
                    placeholder="e.g. 0.5 for 500g, 1.25 for 1.25kg"
                    className="w-full px-3 py-2 text-sm font-mono bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-500 text-zinc-900 dark:text-zinc-100"
                  />
                  {/* Quick Suggestions for Weight */}
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {[
                      { label: "100g", val: "0.1" },
                      { label: "250g", val: "0.25" },
                      { label: "500g", val: "0.5" },
                      { label: "1 kg", val: "1.0" },
                      { label: "2 kg", val: "2.0" },
                      { label: "5 kg", val: "5.0" },
                    ].map((s) => (
                      <button
                        key={s.label}
                        type="button"
                        onClick={() => setWeightValue(s.val)}
                        className="px-2 py-1 text-[11px] font-mono rounded bg-zinc-100 dark:bg-zinc-800 hover:bg-emerald-100 dark:hover:bg-emerald-950/60 text-zinc-700 dark:text-zinc-300 transition-colors"
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Enter Amount in Rupees (₹)
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    autoFocus
                    value={rupeesValue}
                    onChange={(e) => setRupeesValue(e.target.value)}
                    placeholder="e.g. 50, 100, 200"
                    className="w-full px-3 py-2 text-sm font-mono bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-500 text-zinc-900 dark:text-zinc-100"
                  />
                  {/* Quick Suggestions for Rupees */}
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {["10", "20", "50", "100", "200", "500"].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setRupeesValue(amt)}
                        className="px-2 py-1 text-[11px] font-mono rounded bg-zinc-100 dark:bg-zinc-800 hover:bg-emerald-100 dark:hover:bg-emerald-950/60 text-zinc-700 dark:text-zinc-300 transition-colors"
                      >
                        ₹{amt}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Calculated Summary Preview */}
              <div className="p-3 rounded bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 flex justify-between text-xs font-mono">
                <span className="text-zinc-500">
                  Calculated:{" "}
                  {weightInputMode === "weight"
                    ? `${weightValue || 0} ${weightModalItem.unit}`
                    : `₹${rupeesValue || 0}`}
                </span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  Total: ₹
                  {weightInputMode === "weight"
                    ? (Math.round((parseFloat(weightValue) || 0) * Number(weightModalItem.price) * 100) / 100).toFixed(2)
                    : (parseFloat(rupeesValue) || 0).toFixed(2)}
                </span>
              </div>

              {/* Modal Actions */}
              <div className="flex justify-end gap-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setWeightModalItem(null)}
                  className="px-3 py-1.5 text-xs font-medium rounded border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmWeightItem}
                  className="px-4 py-1.5 text-xs font-semibold rounded bg-[#3ECF8E] hover:bg-[#34b27b] text-black shadow-sm"
                >
                  Add to Order Summary
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: CUSTOMER SELECTOR / INLINE ADD                                   */}
      {/* ========================================================================= */}
      {isCustomerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xl overflow-hidden max-h-[85vh] flex flex-col">
            <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-500" />
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  Select or Register Customer
                </h3>
              </div>
              <button
                onClick={() => {
                  setIsCustomerModalOpen(false);
                  setIsAddingNewCustomer(false);
                }}
                className="text-zinc-400 hover:text-zinc-600 text-sm font-mono"
              >
                ✕
              </button>
            </div>

            <div className="p-4 space-y-3 overflow-y-auto flex-1">
              {!isAddingNewCustomer ? (
                <>
                  {/* Search Input */}
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                    <input
                      type="text"
                      autoFocus
                      value={customerSearchQuery}
                      onChange={(e) => setCustomerSearchQuery(e.target.value)}
                      placeholder="Search by customer name or phone number..."
                      className="w-full pl-9 pr-3 py-2 text-xs bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>

                  {/* Customer Search Results */}
                  <div className="border border-zinc-200 dark:border-zinc-800 rounded-md max-h-52 overflow-y-auto divide-y divide-zinc-200 dark:divide-zinc-800 text-xs">
                    {filteredCustomers.length === 0 ? (
                      <div className="p-6 text-center text-zinc-400">
                        <Users className="w-6 h-6 mx-auto mb-1 text-zinc-300" />
                        <div>No customer found.</div>
                        <button
                          type="button"
                          onClick={() => {
                            setNewCustName(customerSearchQuery);
                            setIsAddingNewCustomer(true);
                          }}
                          className="mt-2 text-emerald-600 dark:text-emerald-400 font-semibold"
                        >
                          + Click here to add &quot;{customerSearchQuery || "New Customer"}&quot;
                        </button>
                      </div>
                    ) : (
                      filteredCustomers.map((cust) => (
                        <div
                          key={cust.id}
                          onClick={() => {
                            setSelectedCustomer(cust);
                            setIsCustomerModalOpen(false);
                          }}
                          className="p-2.5 flex items-center justify-between hover:bg-emerald-50/50 dark:hover:bg-emerald-950/30 cursor-pointer"
                        >
                          <div>
                            <div className="font-semibold text-zinc-900 dark:text-zinc-100">
                              {cust.name}
                            </div>
                            <div className="text-[10px] text-zinc-400 font-mono">
                              {cust.mobile_number} {cust.city ? `&bull; ${cust.city}` : ""}
                            </div>
                          </div>
                          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                            Select &rarr;
                          </span>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="pt-2 flex justify-between items-center text-xs">
                    <button
                      type="button"
                      onClick={() => setIsAddingNewCustomer(true)}
                      className="text-emerald-600 dark:text-emerald-400 font-semibold"
                    >
                      + Register New Customer
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCustomer(null);
                        setIsCustomerModalOpen(false);
                      }}
                      className="text-zinc-400 hover:text-zinc-600"
                    >
                      Use Walk-in Customer
                    </button>
                  </div>
                </>
              ) : (
                /* Inline Add Customer Form */
                <form onSubmit={handleAddInlineCustomer} className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                      Customer Name <span className="text-emerald-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      autoFocus
                      value={newCustName}
                      onChange={(e) => setNewCustName(e.target.value)}
                      placeholder="e.g. Sandeep Varma"
                      className="w-full px-3 py-1.5 text-xs bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-md"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                      Mobile Number <span className="text-emerald-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={newCustMobile}
                      onChange={(e) => setNewCustMobile(e.target.value)}
                      placeholder="e.g. 9876543210"
                      className="w-full px-3 py-1.5 text-xs font-mono bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-md"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                      City
                    </label>
                    <input
                      type="text"
                      value={newCustCity}
                      onChange={(e) => setNewCustCity(e.target.value)}
                      placeholder="e.g. Hyderabad"
                      className="w-full px-3 py-1.5 text-xs bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-md"
                    />
                  </div>

                  <div className="pt-2 flex justify-end gap-2 border-t border-zinc-200 dark:border-zinc-800">
                    <button
                      type="button"
                      onClick={() => setIsAddingNewCustomer(false)}
                      className="px-3 py-1.5 text-xs rounded border border-zinc-200 dark:border-zinc-800"
                    >
                      Back to Search
                    </button>
                    <button
                      type="submit"
                      className="px-3.5 py-1.5 text-xs font-semibold rounded bg-[#3ECF8E] text-black"
                    >
                      Save & Select
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: SPLIT PAYMENT ADJUSTMENT                                         */}
      {/* ========================================================================= */}
      {isSplitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xl p-5 space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-emerald-500" />
                Split Tender Payment
              </h3>
              <p className="text-[11px] text-zinc-500">
                Allocate bill total of <strong>₹{finalTotal.toFixed(2)}</strong> across tenders
              </p>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-zinc-600 dark:text-zinc-400 mb-1 flex items-center gap-1">
                  <QrCode className="w-3.5 h-3.5 text-emerald-500" /> UPI Amount (₹)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={splitPayment.upi}
                  onChange={(e) =>
                    setSplitPayment((p) => ({ ...p, upi: parseFloat(e.target.value) || 0 }))
                  }
                  className="w-full px-3 py-1.5 font-mono bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded"
                />
              </div>

              <div>
                <label className="block text-zinc-600 dark:text-zinc-400 mb-1 flex items-center gap-1">
                  <Banknote className="w-3.5 h-3.5 text-emerald-500" /> Cash Amount (₹)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={splitPayment.cash}
                  onChange={(e) =>
                    setSplitPayment((p) => ({ ...p, cash: parseFloat(e.target.value) || 0 }))
                  }
                  className="w-full px-3 py-1.5 font-mono bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded"
                />
              </div>

              <div>
                <label className="block text-zinc-600 dark:text-zinc-400 mb-1 flex items-center gap-1">
                  <CreditCard className="w-3.5 h-3.5 text-emerald-500" /> Card Amount (₹)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={splitPayment.card}
                  onChange={(e) =>
                    setSplitPayment((p) => ({ ...p, card: parseFloat(e.target.value) || 0 }))
                  }
                  className="w-full px-3 py-1.5 font-mono bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded"
                />
              </div>

              {/* Total Check */}
              <div className="p-2.5 rounded bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 font-mono text-[11px] flex justify-between">
                <span>Sum: ₹{(splitPayment.upi + splitPayment.cash + splitPayment.card).toFixed(2)}</span>
                <span
                  className={
                    Math.abs(splitPayment.upi + splitPayment.cash + splitPayment.card - finalTotal) < 0.01
                      ? "text-emerald-500 font-semibold"
                      : "text-amber-500 font-semibold"
                  }
                >
                  {Math.abs(splitPayment.upi + splitPayment.cash + splitPayment.card - finalTotal) < 0.01
                    ? "Balanced"
                    : `Diff: ₹${(finalTotal - (splitPayment.upi + splitPayment.cash + splitPayment.card)).toFixed(2)}`}
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setIsSplitModalOpen(false)}
                className="px-4 py-1.5 text-xs font-semibold rounded bg-[#3ECF8E] text-black"
              >
                Apply Split
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: EDIT LINE ITEM                                                   */}
      {/* ========================================================================= */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xl p-4 space-y-3">
            <h3 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">
              Edit: {editingItem.name}
            </h3>

            <div className="space-y-2 text-xs">
              <div>
                <label className="block text-zinc-500 mb-1">Quantity ({editingItem.unit})</label>
                <input
                  type="number"
                  step="0.001"
                  min="0.001"
                  autoFocus
                  value={editQuantity}
                  onChange={(e) => setEditQuantity(e.target.value)}
                  className="w-full px-2.5 py-1.5 font-mono bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded"
                />
              </div>

              <div>
                <label className="block text-zinc-500 mb-1">Unit Price (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={editPrice}
                  onChange={(e) => setEditPrice(e.target.value)}
                  className="w-full px-2.5 py-1.5 font-mono bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="px-2.5 py-1 text-xs rounded border border-zinc-200 dark:border-zinc-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEditItem}
                className="px-3 py-1 text-xs font-semibold rounded bg-emerald-500 text-black"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: BILL SETTLED & PRINT RECEIPT                                     */}
      {/* ========================================================================= */}
      {settledBill && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  Bill Settled Successfully!
                </h3>
              </div>
              <button
                onClick={() => setSettledBill(null)}
                className="text-zinc-400 hover:text-zinc-600 text-sm font-mono"
              >
                ✕
              </button>
            </div>

            {/* Printable Thermal Receipt Container */}
            <div
              id="printable-bill-receipt"
              className="p-6 overflow-y-auto font-mono text-xs text-zinc-800 dark:text-zinc-200 space-y-3 bg-zinc-50 dark:bg-zinc-950"
            >
              {/* Store Header */}
              <div className="text-center space-y-1 pb-3 border-b border-dashed border-zinc-300 dark:border-zinc-700">
                {organization?.logo_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={organization.logo_url}
                    alt="Logo"
                    className="w-12 h-12 mx-auto object-contain mb-1"
                  />
                )}
                <div className="font-bold text-sm text-zinc-900 dark:text-zinc-100 uppercase">
                  {organization?.name || "BILL NEXT RETAIL"}
                </div>
                {organization?.address && (
                  <div className="text-[10px] text-zinc-500">{organization.address}</div>
                )}
                {organization?.city && (
                  <div className="text-[10px] text-zinc-500">City: {organization.city}</div>
                )}
                {organization?.mobile_number && (
                  <div className="text-[10px] text-zinc-500">Ph: {organization.mobile_number}</div>
                )}
                {organization?.gst_enabled && organization?.gst_number && (
                  <div className="text-[10px] font-bold text-zinc-700 dark:text-zinc-300">
                    GSTIN: {organization.gst_number}
                  </div>
                )}
              </div>

              {/* Bill Meta */}
              <div className="text-[11px] space-y-0.5 pb-2 border-b border-dashed border-zinc-300 dark:border-zinc-700">
                <div className="flex justify-between">
                  <span>Bill No: {settledBill.bill_number}</span>
                  <span>{new Date(settledBill.created_at).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Customer: {settledBill.customer_name}</span>
                  <span>{new Date(settledBill.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                </div>
                {settledBill.customer_mobile && (
                  <div>Mobile: {settledBill.customer_mobile}</div>
                )}
              </div>

              {/* Items Table */}
              <div className="space-y-1.5 py-2 border-b border-dashed border-zinc-300 dark:border-zinc-700">
                <div className="flex justify-between text-[10px] font-bold text-zinc-500">
                  <span>ITEM / QTY</span>
                  <span>AMT</span>
                </div>
                {settledBill.items?.map((it: BillItem, idx: number) => (
                  <div key={idx} className="flex justify-between text-[11px]">
                    <div className="pr-2">
                      <div>{it.name}</div>
                      <div className="text-[10px] text-zinc-400">
                        {it.quantity} {it.unit} &times; ₹{it.price.toFixed(2)}
                      </div>
                    </div>
                    <div className="font-bold">₹{it.total.toFixed(2)}</div>
                  </div>
                ))}
              </div>

              {/* Totals & Tax */}
              <div className="space-y-1 text-[11px] pt-1">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>₹{settledBill.subtotal.toFixed(2)}</span>
                </div>
                {settledBill.tax_amount > 0 && (
                  <>
                    <div className="flex justify-between text-zinc-500">
                      <span>GST ({settledBill.gst_percentage}%):</span>
                      <span>₹{settledBill.tax_amount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-[10px] text-zinc-400">
                      <span>CGST / SGST:</span>
                      <span>
                        ₹{(settledBill.tax_amount / 2).toFixed(2)} / ₹{(settledBill.tax_amount / 2).toFixed(2)}
                      </span>
                    </div>
                  </>
                )}
                <div className="flex justify-between font-bold text-sm pt-1 border-t border-zinc-300 dark:border-zinc-700">
                  <span>NET TOTAL:</span>
                  <span>₹{settledBill.total_amount.toFixed(2)}</span>
                </div>
                <div className="text-[10px] text-zinc-500 pt-1">
                  Payment Tender: <strong>{settledBill.payment_method}</strong>
                </div>
              </div>

              {/* Footer Note */}
              <div className="text-center text-[10px] text-zinc-400 pt-3 border-t border-dashed border-zinc-300 dark:border-zinc-700">
                Thank you for shopping with us!
              </div>
            </div>

            {/* Actions */}
            <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 flex justify-end gap-2 bg-white dark:bg-zinc-900">
              <button
                type="button"
                onClick={() => setSettledBill(null)}
                className="px-4 py-2 text-xs font-medium rounded border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800"
              >
                Close & Next Order
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded bg-[#3ECF8E] hover:bg-[#34b27b] text-black shadow-sm"
              >
                <Printer className="w-3.5 h-3.5" />
                Print Receipt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
