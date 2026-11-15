"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth/auth-context";
import { compressImageTo60KB } from "@/lib/utils/image-compressor";
import {
  Settings as SettingsIcon,
  Building2,
  Receipt,
  Wrench,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ImageIcon,
  UploadCloud,
  Sparkles,
  MapPin,
  Phone,
  ShieldCheck,
  Percent,
  Sliders,
  Scale
} from "lucide-react";

export const dynamic = "force-dynamic";

export default function SettingsPage() {
  const { organization, updateOrganization, isLoading: authLoading, role, canEdit } = useAuth();
  const hasEditAccess = role === "owner" || canEdit("/settings");

  // Tab State
  const [activeTab, setActiveTab] = useState<"profile" | "gst" | "utilities">("profile");

  // Notifications
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Tab 1: Profile State
  const [orgName, setOrgName] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  // Logo upload & 60KB compression
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [compressedLogoBase64, setCompressedLogoBase64] = useState<string | null>(null);
  const [compressedSizeKB, setCompressedSizeKB] = useState<number | null>(null);
  const [isCompressingLogo, setIsCompressingLogo] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Tab 2: GST Configuration State
  const [gstEnabled, setGstEnabled] = useState(false);
  const [gstNumber, setGstNumber] = useState("");
  const [gstPercentage, setGstPercentage] = useState("18");
  const [cgstPercentage, setCgstPercentage] = useState("9");
  const [sgstPercentage, setSgstPercentage] = useState("9");
  const [gstType, setGstType] = useState<"inclusive" | "exclusive">("exclusive");

  // Tab 3: Utilities State
  const [allowOutOfStockBilling, setAllowOutOfStockBilling] = useState(true);

  // Load existing organization values
  useEffect(() => {
    if (organization) {
      setOrgName(organization.name || "");
      setMobileNumber(organization.mobile_number || "");
      setCity(organization.city || "");
      setAddress(organization.address || "");
      setLogoUrl(organization.logo_url || null);

      setGstEnabled(Boolean(organization.gst_enabled));
      setGstNumber(organization.gst_number || "");
      const totalGst = organization.gst_percentage !== undefined ? organization.gst_percentage : 18;
      setGstPercentage(totalGst.toString());
      setCgstPercentage(
        organization.cgst_percentage !== undefined
          ? organization.cgst_percentage.toString()
          : (totalGst / 2).toString()
      );
      setSgstPercentage(
        organization.sgst_percentage !== undefined
          ? organization.sgst_percentage.toString()
          : (totalGst / 2).toString()
      );
      setGstType((organization.gst_type as any) === "inclusive" ? "inclusive" : "exclusive");

      setAllowOutOfStockBilling(
        organization.allow_out_of_stock_billing !== undefined
          ? Boolean(organization.allow_out_of_stock_billing)
          : true
      );
    }
  }, [organization]);

  // When total GST changes, auto-split CGST and SGST equally
  const handleTotalGstChange = (val: string) => {
    setGstPercentage(val);
    const num = parseFloat(val);
    if (!isNaN(num) && num >= 0) {
      const half = (num / 2).toFixed(2).replace(/\.00$/, "");
      setCgstPercentage(half);
      setSgstPercentage(half);
    }
  };

  // Logo file selection & auto compression to <= 60KB
  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsCompressingLogo(true);
      setLogoFile(file);
      const res = await compressImageTo60KB(file, 60);
      setCompressedLogoBase64(res.base64);
      setCompressedSizeKB(res.sizeKB);
    } catch (err) {
      console.error("Logo compression error:", err);
      setErrorMsg("Failed to compress logo image.");
    } finally {
      setIsCompressingLogo(false);
    }
  };

  // Save Settings Handler
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organization?.id) {
      setErrorMsg("No active organization found. Please log in.");
      return;
    }

    try {
      setIsSaving(true);
      setErrorMsg(null);

      let finalLogoUrl = logoUrl;

      // If user selected a new logo, upload to ImageKit
      if (compressedLogoBase64) {
        const uploadRes = await fetch("/api/upload/imagekit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            imageBase64: compressedLogoBase64,
            fileName: `org_logo_${organization.id.slice(0, 8)}_${Date.now()}.webp`,
          }),
        });

        const uploadData = await uploadRes.json();
        if (uploadRes.ok && uploadData.url && uploadData.url.startsWith("http")) {
          finalLogoUrl = uploadData.url;
          setLogoUrl(uploadData.url);
          setCompressedLogoBase64(null);
        } else {
          throw new Error(uploadData.error || "Failed to upload logo to ImageKit");
        }
      }

      // Prepare updates payload
      const updates = {
        name: orgName.trim() || organization.name,
        mobile_number: mobileNumber.trim() || organization.mobile_number,
        city: city.trim(),
        address: address.trim(),
        logo_url: finalLogoUrl,
        gst_enabled: gstEnabled,
        gst_number: gstEnabled ? gstNumber.trim() : null,
        gst_percentage: gstEnabled ? parseFloat(gstPercentage) || 0 : 0,
        cgst_percentage: gstEnabled ? parseFloat(cgstPercentage) || 0 : 0,
        sgst_percentage: gstEnabled ? parseFloat(sgstPercentage) || 0 : 0,
        gst_type: gstEnabled ? gstType : "exclusive",
        allow_out_of_stock_billing: allowOutOfStockBilling,
      };

      const result = await updateOrganization(updates);
      if (result.success) {
        setSuccessMsg("Organization settings updated successfully!");
        setTimeout(() => setSuccessMsg(null), 3500);
      } else {
        setErrorMsg(result.error || "Failed to update settings.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to save settings.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Breadcrumb & Navigation Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-zinc-500 mb-1">
            <Link href="/" className="hover:text-emerald-500 transition-colors">
              Bill Next
            </Link>
            <span>/</span>
            <span className="text-zinc-400">Configuration</span>
            <span>/</span>
            <span className="text-zinc-900 dark:text-zinc-100 font-medium">Settings</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-2.5">
            <SettingsIcon className="w-6 h-6 text-emerald-500" />
            Store Settings
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Configure store profile, ImageKit logo, GST compliance, and billing utilities for{" "}
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
              {organization?.name || "Your Organization"}
            </span>
            .
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            Tenant Scoped
          </span>
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

      {/* Main Settings Card */}
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-sm">
        {/* Navigation Tabs */}
        <div className="flex border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/50 px-4">
          <button
            type="button"
            onClick={() => setActiveTab("profile")}
            className={`py-3 px-4 text-xs font-semibold border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === "profile"
                ? "border-emerald-500 text-emerald-600 dark:text-emerald-400 bg-white dark:bg-zinc-900"
                : "border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
            }`}
          >
            <Building2 className="w-4 h-4" />
            Store Profile
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("gst")}
            className={`py-3 px-4 text-xs font-semibold border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === "gst"
                ? "border-emerald-500 text-emerald-600 dark:text-emerald-400 bg-white dark:bg-zinc-900"
                : "border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
            }`}
          >
            <Receipt className="w-4 h-4" />
            GST Configuration
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("utilities")}
            className={`py-3 px-4 text-xs font-semibold border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === "utilities"
                ? "border-emerald-500 text-emerald-600 dark:text-emerald-400 bg-white dark:bg-zinc-900"
                : "border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
            }`}
          >
            <Wrench className="w-4 h-4" />
            Billing Utilities
          </button>
        </div>

        {/* Form Container */}
        <form onSubmit={handleSave} className="p-6 space-y-6">
          {/* ========================================================================= */}
          {/* TAB 1: STORE PROFILE                                                      */}
          {/* ========================================================================= */}
          {activeTab === "profile" && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div>
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  Organization Profile & Brand Identity
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Update your retail brand name, location, contact details, and receipt logo.
                </p>
              </div>

              {/* Logo Upload with ImageKit & 60KB Compression */}
              <div className="p-4 rounded-lg border border-dashed border-zinc-300 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-950/50">
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-2 flex items-center justify-between">
                  <span>Store Logo (Auto-compressed to &le; 60KB & uploaded to ImageKit)</span>
                  {compressedSizeKB && (
                    <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      Optimized: {compressedSizeKB} KB
                    </span>
                  )}
                </label>

                <div className="flex items-center gap-4">
                  {compressedLogoBase64 || logoUrl ? (
                    <div className="w-20 h-20 rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden bg-white dark:bg-zinc-950 p-1 flex items-center justify-center shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={compressedLogoBase64 || logoUrl || ""}
                        alt="Store Logo"
                        className="w-full h-full object-contain"
                      />
                    </div>
                  ) : (
                    <div className="w-20 h-20 rounded-lg border border-dashed border-zinc-300 dark:border-zinc-700 flex flex-col items-center justify-center text-zinc-400 shrink-0">
                      <ImageIcon className="w-6 h-6" />
                      <span className="text-[10px] mt-1">No Logo</span>
                    </div>
                  )}

                  <div className="flex-1 space-y-1.5">
                    <input
                      type="file"
                      ref={logoInputRef}
                      accept="image/*"
                      onChange={handleLogoChange}
                      className="block w-full text-xs text-zinc-500 file:mr-3 file:py-1 file:px-2.5 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-zinc-200 dark:file:bg-zinc-800 file:text-zinc-700 dark:file:text-zinc-200 hover:file:bg-zinc-300 cursor-pointer"
                    />
                    {isCompressingLogo && (
                      <div className="flex items-center gap-1 text-[11px] text-zinc-500">
                        <Loader2 className="w-3 h-3 animate-spin text-emerald-500" />
                        <span>Compressing logo to &le; 60KB...</span>
                      </div>
                    )}
                    <p className="text-[11px] text-zinc-400">
                      PNG, WebP, or JPG. Displayed on POS invoices, printed thermal receipts, and portal headers.
                    </p>
                  </div>
                </div>
              </div>

              {/* Name & Mobile Number */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Organisation Name <span className="text-emerald-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    placeholder="e.g. Doonext Supermarket"
                    className="w-full px-3 py-2 text-xs bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-500 text-zinc-900 dark:text-zinc-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Mobile Number <span className="text-emerald-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value)}
                    placeholder="e.g. 9876543210"
                    className="w-full px-3 py-2 text-xs font-mono bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-500 text-zinc-900 dark:text-zinc-100"
                  />
                </div>
              </div>

              {/* City & Address */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    City <span className="text-emerald-500">*</span>
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="e.g. Hyderabad, Mumbai, Bangalore"
                      className="w-full pl-9 pr-3 py-2 text-xs bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-500 text-zinc-900 dark:text-zinc-100"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Store Address
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="e.g. Shop #4, Main Market Road, Near Metro Station"
                    className="w-full px-3 py-2 text-xs bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-500 text-zinc-900 dark:text-zinc-100"
                  />
                </div>
              </div>

              {/* Readonly Account Meta Strip */}
              <div className="p-3.5 rounded-lg bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <span className="text-zinc-400 text-[11px]">Account Status</span>
                  <div className="font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5 capitalize">
                    {organization?.status || "Active"}
                  </div>
                </div>
                <div>
                  <span className="text-zinc-400 text-[11px]">Product Limit</span>
                  <div className="font-mono font-semibold text-zinc-800 dark:text-zinc-200 mt-0.5">
                    {organization?.items_count ?? 50} Items Max
                  </div>
                </div>
                <div>
                  <span className="text-zinc-400 text-[11px]">License Expiry</span>
                  <div className="font-mono text-zinc-600 dark:text-zinc-400 mt-0.5">
                    {organization?.expiry_date
                      ? new Date(organization.expiry_date).toLocaleDateString()
                      : "Active"}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: GST CONFIGURATION                                                  */}
          {/* ========================================================================= */}
          {activeTab === "gst" && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div>
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  GST & Tax Compliance
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Configure Goods and Services Tax (GST) rules, GSTIN number, and tax computation method.
                </p>
              </div>

              {/* Enable GST Toggle Switch */}
              <div className="p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/50 flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                    Enable GST on Invoices
                  </div>
                  <p className="text-[11px] text-zinc-500 mt-0.5">
                    When enabled, GST, CGST, and SGST breakdowns will be applied to order totals and printed on bills.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={gstEnabled}
                    onChange={(e) => setGstEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#3ECF8E]"></div>
                </label>
              </div>

              {/* Conditional GST Inputs */}
              {gstEnabled ? (
                <div className="space-y-4 pt-2">
                  {/* GST Number */}
                  <div>
                    <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                      GST Number (GSTIN) <span className="text-emerald-500">*</span>
                    </label>
                    <input
                      type="text"
                      required={gstEnabled}
                      value={gstNumber}
                      onChange={(e) => setGstNumber(e.target.value.toUpperCase())}
                      placeholder="e.g. 36AABCU9603R1ZM"
                      className="w-full px-3 py-2 text-xs font-mono uppercase bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-500 text-zinc-900 dark:text-zinc-100"
                    />
                  </div>

                  {/* GST Percentage, CGST & SGST */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                        Total GST Rate (%) <span className="text-emerald-500">*</span>
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        required={gstEnabled}
                        value={gstPercentage}
                        onChange={(e) => handleTotalGstChange(e.target.value)}
                        placeholder="e.g. 18"
                        className="w-full px-3 py-2 text-xs font-mono bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-500 text-zinc-900 dark:text-zinc-100"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                        CGST Rate (%)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        value={cgstPercentage}
                        onChange={(e) => setCgstPercentage(e.target.value)}
                        placeholder="e.g. 9"
                        className="w-full px-3 py-2 text-xs font-mono bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-500 text-zinc-900 dark:text-zinc-100"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                        SGST Rate (%)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        value={sgstPercentage}
                        onChange={(e) => setSgstPercentage(e.target.value)}
                        placeholder="e.g. 9"
                        className="w-full px-3 py-2 text-xs font-mono bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-500 text-zinc-900 dark:text-zinc-100"
                      />
                    </div>
                  </div>

                  {/* Inclusive or Exclusive Selection */}
                  <div className="space-y-2 pt-2">
                    <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                      Tax Calculation Mode <span className="text-emerald-500">*</span>
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <label
                        className={`p-3 rounded-lg border cursor-pointer flex items-start gap-3 transition-colors ${
                          gstType === "exclusive"
                            ? "border-emerald-500 bg-emerald-50/20 dark:bg-emerald-950/20"
                            : "border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/40"
                        }`}
                      >
                        <input
                          type="radio"
                          name="gstType"
                          value="exclusive"
                          checked={gstType === "exclusive"}
                          onChange={() => setGstType("exclusive")}
                          className="mt-0.5 text-emerald-500 focus:ring-emerald-500"
                        />
                        <div>
                          <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                            Exclusive (Tax Added to Price)
                          </div>
                          <p className="text-[11px] text-zinc-500 mt-0.5">
                            GST is calculated and added on top of product prices at checkout.
                          </p>
                        </div>
                      </label>

                      <label
                        className={`p-3 rounded-lg border cursor-pointer flex items-start gap-3 transition-colors ${
                          gstType === "inclusive"
                            ? "border-emerald-500 bg-emerald-50/20 dark:bg-emerald-950/20"
                            : "border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/40"
                        }`}
                      >
                        <input
                          type="radio"
                          name="gstType"
                          value="inclusive"
                          checked={gstType === "inclusive"}
                          onChange={() => setGstType("inclusive")}
                          className="mt-0.5 text-emerald-500 focus:ring-emerald-500"
                        />
                        <div>
                          <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                            Inclusive (Tax Included in Price)
                          </div>
                          <p className="text-[11px] text-zinc-500 mt-0.5">
                            Product prices already include GST; the tax portion is extracted and shown on the receipt.
                          </p>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-lg bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-500">
                  GST is currently disabled. Orders will be generated without tax lines or GSTIN numbers.
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: UTILITIES                                                          */}
          {/* ========================================================================= */}
          {activeTab === "utilities" && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div>
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  Billing & Inventory Utilities
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Configure checkout validation rules and point-of-sale operational behavior.
                </p>
              </div>

              {/* Make bill if product is out of stock toggle */}
              <div className="p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/50 flex items-center justify-between">
                <div className="space-y-0.5 pr-4">
                  <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                    Make bill if product is out of stock
                  </div>
                  <p className="text-[11px] text-zinc-500">
                    Allow cashiers to add items and settle bills even when product inventory count is 0 or negative. If disabled, out-of-stock items will block bill settlement.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={allowOutOfStockBilling}
                    onChange={(e) => setAllowOutOfStockBilling(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#3ECF8E]"></div>
                </label>
              </div>
            </div>
          )}

          {/* Form Actions Footer */}
          <div className="flex items-center justify-between gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
            {!hasEditAccess ? (
              <span className="text-xs text-amber-600 dark:text-amber-400 font-mono">
                View-Only Access: Settings editing requires administrative permissions.
              </span>
            ) : <div />}
            <button
              type="submit"
              disabled={isSaving || !hasEditAccess}
              className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold rounded-md bg-[#3ECF8E] hover:bg-[#34b27b] text-black shadow-sm disabled:opacity-50 transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving Settings...
                </>
              ) : (
                "Save Settings"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
