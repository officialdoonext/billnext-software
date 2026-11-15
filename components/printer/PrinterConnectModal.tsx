"use client";

import React, { useState } from "react";
import { usePrinter } from "@/lib/printer/printer-context";
import {
  Printer,
  Usb,
  Bluetooth,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  FileText,
  LogOut,
  Sparkles,
  HelpCircle,
  Zap,
  Info
} from "lucide-react";

interface PrinterConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PrinterConnectModal({ isOpen, onClose }: PrinterConnectModalProps) {
  const {
    isConnected,
    connectionType,
    deviceName,
    isConnecting,
    error,
    connectUsb,
    connectBluetooth,
    disconnect,
    testPrint,
  } = usePrinter();

  const [testPrintSuccess, setTestPrintSuccess] = useState(false);
  const [isTestPrinting, setIsTestPrinting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleConnectUsb = async () => {
    setLocalError(null);
    const res = await connectUsb();
    if (!res.success && res.error) {
      setLocalError(res.error);
    }
  };

  const handleConnectBluetooth = async () => {
    setLocalError(null);
    const res = await connectBluetooth();
    if (!res.success && res.error) {
      setLocalError(res.error);
    }
  };

  const handleTestPrint = async () => {
    setIsTestPrinting(true);
    setTestPrintSuccess(false);
    setLocalError(null);

    const res = await testPrint();
    setIsTestPrinting(false);

    if (res.success) {
      setTestPrintSuccess(true);
      setTimeout(() => setTestPrintSuccess(false), 4000);
    } else if (res.error) {
      setLocalError(res.error);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-950/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-600">
              <Printer className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                Connect Thermal Receipt Printer
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                  ESC/POS
                </span>
              </h3>
              <p className="text-[11px] text-zinc-500 font-mono">
                Hardware pairing via WebUSB or Web Bluetooth
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4">
          {/* Active Connection Banner */}
          {isConnected ? (
            <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-800/80 bg-emerald-50/70 dark:bg-emerald-950/40 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-semibold text-emerald-900 dark:text-emerald-300">
                    Printer Connected & Ready
                  </span>
                </div>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded font-bold border border-emerald-300 dark:border-emerald-800 bg-white dark:bg-zinc-900 text-emerald-700 dark:text-emerald-400">
                  {connectionType}
                </span>
              </div>

              <div className="text-xs font-mono font-medium text-zinc-800 dark:text-zinc-200 bg-white dark:bg-zinc-900 px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                <span>{deviceName || "Thermal Printer"}</span>
                <span className="text-[10px] text-zinc-400">ESC/POS 203 DPI</span>
              </div>

              {testPrintSuccess && (
                <div className="flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-400 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Test receipt dispatched to printer!</span>
                </div>
              )}

              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={handleTestPrint}
                  disabled={isTestPrinting}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#3ECF8E] hover:bg-[#34b27b] text-black shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isTestPrinting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Printing...</span>
                    </>
                  ) : (
                    <>
                      <FileText className="w-3.5 h-3.5" />
                      <span>Print Test Receipt</span>
                    </>
                  )}
                </button>

                <button
                  onClick={disconnect}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-rose-600 dark:text-rose-400 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Disconnect</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Option 1: USB PRINTER */}
              <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 hover:border-emerald-500 dark:hover:border-emerald-500 transition-all flex flex-col justify-between space-y-3 group">
                <div className="space-y-2">
                  <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-600">
                    <Usb className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                      USB Printer
                    </h4>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 leading-snug">
                      Connect direct via USB cable. High-speed, stable printing for desktop checkout stations.
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleConnectUsb}
                  disabled={isConnecting}
                  className="w-full py-2 px-3 text-xs font-semibold rounded-lg bg-zinc-900 dark:bg-zinc-100 hover:bg-emerald-500 dark:hover:bg-emerald-500 text-white dark:text-zinc-900 hover:text-black dark:hover:text-black transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isConnecting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Pairing...</span>
                    </>
                  ) : (
                    <>
                      <Usb className="w-3.5 h-3.5" />
                      <span>Connect USB</span>
                    </>
                  )}
                </button>
              </div>

              {/* Option 2: BLUETOOTH PRINTER */}
              <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 hover:border-blue-500 dark:hover:border-blue-500 transition-all flex flex-col justify-between space-y-3 group">
                <div className="space-y-2">
                  <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-blue-600">
                    <Bluetooth className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                      Bluetooth Printer
                    </h4>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 leading-snug">
                      Pair wirelessly with portable 58mm / 80mm ESC/POS thermal printers on mobile or tablet.
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleConnectBluetooth}
                  disabled={isConnecting}
                  className="w-full py-2 px-3 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isConnecting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Scanning...</span>
                    </>
                  ) : (
                    <>
                      <Bluetooth className="w-3.5 h-3.5" />
                      <span>Connect Bluetooth</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Error Message */}
          {(error || localError) && (
            <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-300 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-semibold">{error || localError}</span>
                <p className="text-[11px] text-rose-700 dark:text-rose-400 font-mono">
                  Tip: Ensure printer is powered ON and your browser has WebUSB / WebBluetooth permissions allowed.
                </p>
              </div>
            </div>
          )}

          {/* Browser & Compatibility Notice */}
          <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 text-[11px] text-zinc-500 dark:text-zinc-400 space-y-1">
            <div className="flex items-center gap-1.5 font-semibold text-zinc-800 dark:text-zinc-200">
              <Info className="w-3.5 h-3.5 text-emerald-500" />
              <span>Printer Compatibility:</span>
            </div>
            <p>
              Supports all standard 58mm & 80mm ESC/POS thermal printers (Epson, TVS, NGX, POSIFLEX, Rugtek, Everycom, Retsol, HOIN, and generic Bluetooth printers).
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-3.5 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/50 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

