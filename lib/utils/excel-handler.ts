import * as XLSX from "xlsx";
import { SampleProduct } from "@/lib/data/sample-products";

/**
 * Downloads a pre-formatted Excel template (.xlsx) with sample data including Stock
 */
export function downloadSampleExcelTemplate() {
  const sampleData = [
    {
      "Item Name": "Royal Basmati Rice 5kg",
      "Short Code": "RIC-001",
      "Category": "Groceries & Staples",
      "Unit": "KG",
      "Price": 540.0,
      "Stock": 50,
    },
    {
      "Item Name": "Amul Pure Cow Ghee 1L Tin",
      "Short Code": "GHE-010",
      "Category": "Oils & Ghee",
      "Unit": "Litre",
      "Price": 650.0,
      "Stock": 30,
    },
    {
      "Item Name": "Britannia Cheddar Cheese 200g",
      "Short Code": "CHS-018",
      "Category": "Dairy & Breakfast",
      "Unit": "Piece",
      "Price": 140.0,
      "Stock": 45,
    },
    {
      "Item Name": "Nescafe Classic Coffee 100g Jar",
      "Short Code": "BEV-022",
      "Category": "Beverages",
      "Unit": "Piece",
      "Price": 320.0,
      "Stock": 60,
    },
    {
      "Item Name": "Tata Crystal Salt 1kg",
      "Short Code": "SLT-004",
      "Category": "Groceries & Staples",
      "Unit": "KG",
      "Price": 28.0,
      "Stock": 100,
    },
  ];

  // Create worksheet
  const worksheet = XLSX.utils.json_to_sheet(sampleData);

  // Set column widths
  worksheet["!cols"] = [
    { wch: 35 }, // Item Name
    { wch: 15 }, // Short Code
    { wch: 25 }, // Category
    { wch: 12 }, // Unit
    { wch: 12 }, // Price
    { wch: 10 }, // Stock
  ];

  // Create workbook
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Items Template");

  // Trigger download in browser
  XLSX.writeFile(workbook, "billnext_sample_items_template.xlsx");
}

/**
 * Parses an uploaded Excel (.xlsx, .xls) or CSV file into SampleProduct array with Stock
 */
export async function parseExcelFile(
  file: File
): Promise<{ products: SampleProduct[]; errors: string[] }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const buffer = e.target?.result as ArrayBuffer;
        const workbook = XLSX.read(buffer, { type: "array" });

        if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
          resolve({ products: [], errors: ["Uploaded spreadsheet has no sheets."] });
          return;
        }

        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rawRows: Record<string, any>[] = XLSX.utils.sheet_to_json(worksheet, {
          defval: "",
        });

        if (rawRows.length === 0) {
          resolve({
            products: [],
            errors: ["Spreadsheet contains no data rows. Please check your file."],
          });
          return;
        }

        const products: SampleProduct[] = [];
        const errors: string[] = [];

        rawRows.forEach((row, index) => {
          const rowNum = index + 2; // header is row 1

          // Flexible header matching (case insensitive & aliases)
          const name = (
            row["Item Name"] ||
            row["item name"] ||
            row["Name"] ||
            row["name"] ||
            row["Product Name"] ||
            row["product name"] ||
            ""
          )
            .toString()
            .trim();

          if (!name) {
            errors.push(`Row ${rowNum}: Missing Item Name (skipped)`);
            return;
          }

          const shortCode = (
            row["Short Code"] ||
            row["short code"] ||
            row["SKU"] ||
            row["sku"] ||
            row["Code"] ||
            row["code"] ||
            `SKU-${Date.now().toString().slice(-4)}${index}`
          )
            .toString()
            .trim();

          const categoryName = (
            row["Category"] ||
            row["category"] ||
            row["Category Name"] ||
            row["category name"] ||
            "General"
          )
            .toString()
            .trim();

          // Normalize Unit: Piece, KG, Litre
          let unitRaw = (
            row["Unit"] ||
            row["unit"] ||
            "Piece"
          )
            .toString()
            .trim()
            .toLowerCase();

          let unit: "Piece" | "KG" | "Litre" = "Piece";
          if (unitRaw.includes("kg") || unitRaw.includes("kilo") || unitRaw.includes("gram")) {
            unit = "KG";
          } else if (unitRaw.includes("lit") || unitRaw.includes("ltr") || unitRaw.includes("l")) {
            unit = "Litre";
          } else {
            unit = "Piece";
          }

          // Parse Price
          const rawPrice =
            row["Price"] ||
            row["price"] ||
            row["Rate"] ||
            row["rate"] ||
            row["MRP"] ||
            row["mrp"] ||
            0;
          const cleanPrice = parseFloat(
            typeof rawPrice === "string" ? rawPrice.replace(/[^0-9.]/g, "") : rawPrice
          );
          const price = isNaN(cleanPrice) || cleanPrice < 0 ? 0 : cleanPrice;

          // Parse Stock
          const rawStock =
            row["Stock"] ||
            row["stock"] ||
            row["Stock Count"] ||
            row["stock count"] ||
            row["Quantity"] ||
            row["quantity"] ||
            row["Qty"] ||
            row["qty"] ||
            0;
          const cleanStock = parseInt(
            typeof rawStock === "string" ? rawStock.replace(/[^0-9]/g, "") : rawStock,
            10
          );
          const stock = isNaN(cleanStock) || cleanStock < 0 ? 0 : cleanStock;

          products.push({
            name,
            short_code: shortCode,
            category_name: categoryName || "General",
            unit,
            price,
            stock,
          });
        });

        resolve({ products, errors });
      } catch (err: any) {
        reject(new Error(err.message || "Failed to parse Excel file"));
      }
    };

    reader.onerror = () => reject(new Error("File read error"));
    reader.readAsArrayBuffer(file);
  });
}
