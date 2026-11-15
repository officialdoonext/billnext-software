"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export type PrinterConnectionType = "usb" | "bluetooth" | null;

export interface PrinterContextType {
  isConnected: boolean;
  connectionType: PrinterConnectionType;
  deviceName: string | null;
  isConnecting: boolean;
  error: string | null;
  connectUsb: () => Promise<{ success: boolean; error?: string }>;
  connectBluetooth: () => Promise<{ success: boolean; error?: string }>;
  disconnect: () => Promise<void>;
  printSlip: (data: {
    billNumber: string;
    storeName: string;
    date: string;
    items: { name: string; quantity: number; price: number; total: number; unit?: string }[];
    subtotal: number;
    taxAmount: number;
    totalAmount: number;
    paymentMethod: string;
    customerName?: string;
    customerMobile?: string;
  }) => Promise<{ success: boolean; error?: string }>;
  testPrint: () => Promise<{ success: boolean; error?: string }>;
}

const PrinterContext = createContext<PrinterContextType | undefined>(undefined);

const LOCAL_STORAGE_PRINTER_KEY = "billnext_last_printer";

// Common Bluetooth Printer GATT Service UUIDs
const BLUETOOTH_PRINTER_SERVICES = [
  "000018f0-0000-1000-8000-00805f9b34fb", // Standard ESC/POS printer service
  "e7810a71-73ae-499d-8c15-faa9aef0c3f2",
  "49535343-fe7d-4ae5-8fa9-9fafd205e455", // ISSC serial
  "0000ffe0-0000-1000-8000-00805f9b34fb", // HM-10 transparent
  "0000ff00-0000-1000-8000-00805f9b34fb",
  "0000ae00-0000-1000-8000-00805f9b34fb",
  "00001101-0000-1000-8000-00805f9b34fb", // Serial port profile
];

export function PrinterProvider({ children }: { children: React.ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionType, setConnectionType] = useState<PrinterConnectionType>(null);
  const [deviceName, setDeviceName] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Active hardware handles
  const [usbDevice, setUsbDevice] = useState<any>(null);
  const [usbEndpointNumber, setUsbEndpointNumber] = useState<number>(1);
  const [bluetoothDevice, setBluetoothDevice] = useState<any>(null);
  const [bluetoothCharacteristic, setBluetoothCharacteristic] = useState<any>(null);

  // Restore saved printer metadata
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_PRINTER_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.deviceName && parsed.connectionType) {
          setDeviceName(parsed.deviceName);
          setConnectionType(parsed.connectionType);
        }
      }
    } catch (e) {}
  }, []);

  // Connect via WebUSB
  const connectUsb = async (): Promise<{ success: boolean; error?: string }> => {
    setError(null);
    setIsConnecting(true);

    try {
      // 1. Check browser WebUSB support
      if (typeof navigator === "undefined" || !(navigator as any).usb) {
        const errorMsg =
          "WebUSB is not supported in this browser. Please use Google Chrome, Edge, or a Chromium-based browser over HTTPS or localhost.";
        setError(errorMsg);
        setIsConnecting(false);
        return { success: false, error: errorMsg };
      }

      const usb = (navigator as any).usb;

      // 2. Request USB Device from user
      // Many thermal printers use USB class 7 (Printers) or vendor specific
      const device = await usb.requestDevice({
        filters: [],
      });

      if (!device) {
        throw new Error("No USB device was selected.");
      }

      await device.open();

      if (device.configuration === null) {
        await device.selectConfiguration(1);
      }

      // Find printer interface and OUT endpoint
      let targetInterface = 0;
      let targetEndpoint = 1;

      if (device.configuration?.interfaces) {
        for (const iface of device.configuration.interfaces) {
          for (const alt of iface.alternates) {
            // Check for printer class (7) or find OUT bulk endpoint
            const outEndpoint = alt.endpoints?.find(
              (ep: any) => ep.direction === "out" && ep.type === "bulk"
            );
            if (outEndpoint) {
              targetInterface = iface.interfaceNumber;
              targetEndpoint = outEndpoint.endpointNumber;
              break;
            }
          }
        }
      }

      await device.claimInterface(targetInterface);

      const resolvedName = device.productName || device.manufacturerName || `USB Thermal Printer (${device.vendorId.toString(16)}:${device.productId.toString(16)})`;

      setUsbDevice(device);
      setUsbEndpointNumber(targetEndpoint);
      setIsConnected(true);
      setConnectionType("usb");
      setDeviceName(resolvedName);

      localStorage.setItem(
        LOCAL_STORAGE_PRINTER_KEY,
        JSON.stringify({ deviceName: resolvedName, connectionType: "usb" })
      );

      setIsConnecting(false);
      return { success: true };
    } catch (err: any) {
      console.warn("WebUSB connection error:", err);
      const message = err.message || "Failed to pair with USB thermal printer.";
      setError(message);
      setIsConnecting(false);
      return { success: false, error: message };
    }
  };

  // Connect via Web Bluetooth
  const connectBluetooth = async (): Promise<{ success: boolean; error?: string }> => {
    setError(null);
    setIsConnecting(true);

    try {
      // 1. Check browser Web Bluetooth support
      if (typeof navigator === "undefined" || !(navigator as any).bluetooth) {
        const errorMsg =
          "Web Bluetooth is not supported in this browser. Please use Google Chrome, Edge, or Bluefy (on iOS) over HTTPS or localhost.";
        setError(errorMsg);
        setIsConnecting(false);
        return { success: false, error: errorMsg };
      }

      const bluetooth = (navigator as any).bluetooth;

      // 2. Request Bluetooth Device with thermal printer services
      const device = await bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: BLUETOOTH_PRINTER_SERVICES,
      });

      if (!device) {
        throw new Error("No Bluetooth printer selected.");
      }

      // 3. Connect to GATT server
      const server = await device.gatt.connect();

      // 4. Discover printer service and writable characteristic
      let writeChar: any = null;

      for (const serviceUuid of BLUETOOTH_PRINTER_SERVICES) {
        try {
          const service = await server.getPrimaryService(serviceUuid);
          const chars = await service.getCharacteristics();
          writeChar = chars.find((c: any) => c.properties.write || c.properties.writeWithoutResponse);
          if (writeChar) break;
        } catch (e) {
          // Continue scanning services
        }
      }

      if (!writeChar) {
        // Fallback: try getting any available service
        try {
          const services = await server.getPrimaryServices();
          for (const s of services) {
            const chars = await s.getCharacteristics();
            writeChar = chars.find((c: any) => c.properties.write || c.properties.writeWithoutResponse);
            if (writeChar) break;
          }
        } catch (e) {}
      }

      const resolvedName = device.name || "Bluetooth Thermal Printer";

      setBluetoothDevice(device);
      setBluetoothCharacteristic(writeChar);
      setIsConnected(true);
      setConnectionType("bluetooth");
      setDeviceName(resolvedName);

      // Listen for disconnect
      device.addEventListener("gattserverdisconnected", () => {
        setIsConnected(false);
        setConnectionType(null);
      });

      localStorage.setItem(
        LOCAL_STORAGE_PRINTER_KEY,
        JSON.stringify({ deviceName: resolvedName, connectionType: "bluetooth" })
      );

      setIsConnecting(false);
      return { success: true };
    } catch (err: any) {
      console.warn("Web Bluetooth connection error:", err);
      const message = err.message || "Failed to pair with Bluetooth printer.";
      setError(message);
      setIsConnecting(false);
      return { success: false, error: message };
    }
  };

  // Disconnect active printer
  const disconnect = async () => {
    try {
      if (usbDevice && usbDevice.opened) {
        await usbDevice.close();
      }
      if (bluetoothDevice && bluetoothDevice.gatt && bluetoothDevice.gatt.connected) {
        bluetoothDevice.gatt.disconnect();
      }
    } catch (e) {
      console.warn("Disconnect cleanup error:", e);
    }

    setUsbDevice(null);
    setBluetoothDevice(null);
    setBluetoothCharacteristic(null);
    setIsConnected(false);
    setConnectionType(null);
    setError(null);
  };

  // Helper to send raw byte chunks
  const sendRawBytes = async (data: Uint8Array): Promise<boolean> => {
    try {
      if (connectionType === "usb" && usbDevice) {
        await usbDevice.transferOut(usbEndpointNumber, data);
        return true;
      } else if (connectionType === "bluetooth" && bluetoothCharacteristic) {
        // Bluetooth MTU: slice into 100-byte chunks
        const chunkSize = 100;
        for (let i = 0; i < data.length; i += chunkSize) {
          const chunk = data.slice(i, i + chunkSize);
          if (bluetoothCharacteristic.writeValueWithoutResponse) {
            await bluetoothCharacteristic.writeValueWithoutResponse(chunk);
          } else {
            await bluetoothCharacteristic.writeValue(chunk);
          }
        }
        return true;
      }
      return false;
    } catch (err) {
      console.error("Failed to send raw ESC/POS bytes:", err);
      return false;
    }
  };

  // Format ESC/POS Receipt Command Generator
  const generateEscPosReceipt = (data: {
    billNumber: string;
    storeName: string;
    date: string;
    items: { name: string; quantity: number; price: number; total: number; unit?: string }[];
    subtotal: number;
    taxAmount: number;
    totalAmount: number;
    paymentMethod: string;
    customerName?: string;
    customerMobile?: string;
  }): Uint8Array => {
    const encoder = new TextEncoder();
    const parts: number[] = [];

    // ESC/POS Commands
    const ESC = 0x1b;
    const GS = 0x1d;

    // 1. Initialize printer
    parts.push(ESC, 0x40);

    // 2. Align center
    parts.push(ESC, 0x61, 0x01);

    // 3. Double height + double width for store title
    parts.push(GS, 0x21, 0x11);
    const titleBytes = Array.from(encoder.encode(`${data.storeName || "BILL NEXT STORE"}\n`));
    parts.push(...titleBytes);

    // 4. Normal font
    parts.push(GS, 0x21, 0x00);
    const subtitleBytes = Array.from(
      encoder.encode("TAX INVOICE / POS RECEIPT\n--------------------------------\n")
    );
    parts.push(...subtitleBytes);

    // 5. Align Left
    parts.push(ESC, 0x61, 0x00);
    const metaBytes = Array.from(
      encoder.encode(
        `Invoice: ${data.billNumber}\nDate   : ${data.date}\nPayment: ${data.paymentMethod}\n` +
          (data.customerName ? `Client : ${data.customerName} (${data.customerMobile || ""})\n` : "") +
          "--------------------------------\n" +
          "Item                Qty    Total\n" +
          "--------------------------------\n"
      )
    );
    parts.push(...metaBytes);

    // 6. Line items
    data.items.forEach((item) => {
      const nameCol = item.name.slice(0, 18).padEnd(19, " ");
      const qtyCol = `${item.quantity}${item.unit ? ` ${item.unit[0]}` : ""}`.padStart(5, " ");
      const totalCol = `Rs.${item.total.toFixed(0)}`.padStart(8, " ");
      const lineBytes = Array.from(encoder.encode(`${nameCol}${qtyCol}${totalCol}\n`));
      parts.push(...lineBytes);
    });

    // 7. Totals
    const totalsBytes = Array.from(
      encoder.encode(
        "--------------------------------\n" +
          `Subtotal:             Rs.${data.subtotal.toFixed(2)}\n` +
          `GST Tax :             Rs.${data.taxAmount.toFixed(2)}\n` +
          "--------------------------------\n"
      )
    );
    parts.push(...totalsBytes);

    // 8. Grand Total Bold Double Height
    parts.push(ESC, 0x45, 0x01); // Bold on
    parts.push(GS, 0x21, 0x01); // Double height
    const grandBytes = Array.from(encoder.encode(`TOTAL:  Rs.${data.totalAmount.toFixed(2)}\n`));
    parts.push(...grandBytes);
    parts.push(GS, 0x21, 0x00); // Normal font
    parts.push(ESC, 0x45, 0x00); // Bold off

    // 9. Center footer & cut
    parts.push(ESC, 0x61, 0x01);
    const footerBytes = Array.from(
      encoder.encode(
        "--------------------------------\n" +
          "Thank you for your visit!\n" +
          "Powered by Bill Next POS\n\n\n\n"
      )
    );
    parts.push(...footerBytes);

    // 10. Cut paper command (GS V 0)
    parts.push(GS, 0x56, 0x00);

    return new Uint8Array(parts);
  };

  // Test Print
  const testPrint = async (): Promise<{ success: boolean; error?: string }> => {
    if (!isConnected) {
      return { success: false, error: "Please connect a USB or Bluetooth printer first." };
    }

    const testData = {
      billNumber: `TEST-${Date.now().toString().slice(-4)}`,
      storeName: deviceName || "Bill Next Store",
      date: new Date().toLocaleString("en-IN"),
      items: [
        { name: "Sample Item 1", quantity: 1, price: 100, total: 100, unit: "Pcs" },
        { name: "Thermal Test Slip", quantity: 2, price: 50, total: 100, unit: "Pcs" },
      ],
      subtotal: 200,
      taxAmount: 10,
      totalAmount: 210,
      paymentMethod: "TEST / CASH",
      customerName: "Diagnostic Test",
      customerMobile: "9876543210",
    };

    const bytes = generateEscPosReceipt(testData);
    const success = await sendRawBytes(bytes);
    if (!success) {
      return { success: false, error: "Printer communication failed. Please check cable or power." };
    }
    return { success: true };
  };

  // Print Bill
  const printSlip = async (data: any): Promise<{ success: boolean; error?: string }> => {
    if (!isConnected) {
      return { success: false, error: "No thermal printer connected." };
    }
    const bytes = generateEscPosReceipt(data);
    const success = await sendRawBytes(bytes);
    if (!success) {
      return { success: false, error: "Failed to output bill to thermal printer." };
    }
    return { success: true };
  };

  return (
    <PrinterContext.Provider
      value={{
        isConnected,
        connectionType,
        deviceName,
        isConnecting,
        error,
        connectUsb,
        connectBluetooth,
        disconnect,
        printSlip,
        testPrint,
      }}
    >
      {children}
    </PrinterContext.Provider>
  );
}

export function usePrinter() {
  const context = useContext(PrinterContext);
  if (!context) {
    throw new Error("usePrinter must be used within a PrinterProvider");
  }
  return context;
}

