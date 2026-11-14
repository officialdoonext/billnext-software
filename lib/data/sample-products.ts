export interface SampleProduct {
  name: string;
  short_code: string;
  category_name: string;
  unit: "Piece" | "KG" | "Litre";
  price: number;
  stock?: number;
}

export const SAMPLE_50_PRODUCTS: SampleProduct[] = [
  // 1. Groceries & Staples
  { name: "Royal Basmati Rice 5kg", short_code: "RIC-001", category_name: "Groceries & Staples", unit: "KG", price: 540.0, stock: 45 },
  { name: "Aashirvaad Whole Wheat Atta 10kg", short_code: "ATT-002", category_name: "Groceries & Staples", unit: "KG", price: 420.0, stock: 50 },
  { name: "Organic Toor Dal 1kg", short_code: "DAL-003", category_name: "Groceries & Staples", unit: "KG", price: 165.0, stock: 60 },
  { name: "Tata Crystal Salt 1kg", short_code: "SLT-004", category_name: "Groceries & Staples", unit: "KG", price: 28.0, stock: 120 },
  { name: "Refined Pure Sugar 5kg", short_code: "SGR-005", category_name: "Groceries & Staples", unit: "KG", price: 230.0, stock: 35 },
  { name: "Moong Dal Washed 1kg", short_code: "DAL-006", category_name: "Groceries & Staples", unit: "KG", price: 140.0, stock: 40 },
  { name: "Premium Chana Besan 1kg", short_code: "FLR-007", category_name: "Groceries & Staples", unit: "KG", price: 95.0, stock: 55 },
  { name: "Sona Masoori Rice 10kg", short_code: "RIC-008", category_name: "Groceries & Staples", unit: "KG", price: 620.0, stock: 30 },

  // 2. Oils & Ghee
  { name: "Fortune Sunlite Refined Oil 1L", short_code: "OIL-009", category_name: "Oils & Ghee", unit: "Litre", price: 145.0, stock: 65 },
  { name: "Amul Pure Cow Ghee 1L Tin", short_code: "GHE-010", category_name: "Oils & Ghee", unit: "Litre", price: 650.0, stock: 25 },
  { name: "Dhara Mustard Oil 1L", short_code: "OIL-011", category_name: "Oils & Ghee", unit: "Litre", price: 155.0, stock: 40 },
  { name: "Extra Virgin Olive Oil 500ml", short_code: "OIL-012", category_name: "Oils & Ghee", unit: "Litre", price: 490.0, stock: 20 },
  { name: "Pure Groundnut Cooking Oil 1L", short_code: "OIL-013", category_name: "Oils & Ghee", unit: "Litre", price: 180.0, stock: 35 },

  // 3. Dairy & Breakfast
  { name: "Amul Taaza Homogenised Milk 1L", short_code: "MLK-014", category_name: "Dairy & Breakfast", unit: "Litre", price: 72.0, stock: 80 },
  { name: "Amul Pasteurised Butter 500g", short_code: "BTR-015", category_name: "Dairy & Breakfast", unit: "Piece", price: 275.0, stock: 45 },
  { name: "Fresh Malai Paneer 200g", short_code: "PNR-016", category_name: "Dairy & Breakfast", unit: "Piece", price: 95.0, stock: 30 },
  { name: "Mother Dairy Dahi 1kg", short_code: "CUR-017", category_name: "Dairy & Breakfast", unit: "KG", price: 85.0, stock: 40 },
  { name: "Britannia Cheddar Cheese Slices 200g", short_code: "CHS-018", category_name: "Dairy & Breakfast", unit: "Piece", price: 140.0, stock: 50 },
  { name: "Epigamia Greek Yogurt Strawberry 100g", short_code: "YOG-019", category_name: "Dairy & Breakfast", unit: "Piece", price: 50.0, stock: 60 },
  { name: "Kellogg's Corn Flakes 875g", short_code: "BRK-020", category_name: "Dairy & Breakfast", unit: "Piece", price: 340.0, stock: 25 },
  { name: "Quaker Rolled Oats 1kg", short_code: "OAT-021", category_name: "Dairy & Breakfast", unit: "KG", price: 199.0, stock: 35 },

  // 4. Beverages
  { name: "Nescafe Classic Coffee 100g Jar", short_code: "BEV-022", category_name: "Beverages", unit: "Piece", price: 320.0, stock: 50 },
  { name: "Brooke Bond Red Label Tea 1kg", short_code: "TEA-023", category_name: "Beverages", unit: "KG", price: 490.0, stock: 40 },
  { name: "Tetley Green Tea Lemon 100 Bags", short_code: "TEA-024", category_name: "Beverages", unit: "Piece", price: 410.0, stock: 30 },
  { name: "Bisleri Mineral Water 1L", short_code: "WTR-025", category_name: "Beverages", unit: "Litre", price: 20.0, stock: 150 },
  { name: "Tropicana 100% Orange Juice 1L", short_code: "JUC-026", category_name: "Beverages", unit: "Litre", price: 135.0, stock: 45 },
  { name: "Coca Cola Zero Sugar 750ml", short_code: "SOD-027", category_name: "Beverages", unit: "Piece", price: 45.0, stock: 75 },
  { name: "Real Mixed Fruit Juice 1L", short_code: "JUC-028", category_name: "Beverages", unit: "Litre", price: 125.0, stock: 40 },

  // 5. Snacks & Munchies
  { name: "Lay's Classic Salted Potato Chips 90g", short_code: "SNK-029", category_name: "Snacks & Munchies", unit: "Piece", price: 40.0, stock: 100 },
  { name: "Kurkure Masala Munch 90g", short_code: "SNK-030", category_name: "Snacks & Munchies", unit: "Piece", price: 30.0, stock: 90 },
  { name: "Haldiram's Bhujia Sev 400g", short_code: "SNK-031", category_name: "Snacks & Munchies", unit: "Piece", price: 120.0, stock: 50 },
  { name: "California Roasted Almonds 500g", short_code: "DRY-032", category_name: "Snacks & Munchies", unit: "KG", price: 480.0, stock: 30 },
  { name: "W320 Raw Cashews 500g", short_code: "DRY-033", category_name: "Snacks & Munchies", unit: "KG", price: 420.0, stock: 25 },
  { name: "Cadbury Dairy Milk Silk 150g", short_code: "CHO-034", category_name: "Snacks & Munchies", unit: "Piece", price: 175.0, stock: 60 },
  { name: "Oreo Original Vanilla Biscuits 120g", short_code: "BIS-035", category_name: "Snacks & Munchies", unit: "Piece", price: 35.0, stock: 110 },
  { name: "Act II Butter Lovers Popcorn 85g", short_code: "SNK-036", category_name: "Snacks & Munchies", unit: "Piece", price: 40.0, stock: 70 },

  // 6. Bakery & Confectionery
  { name: "English Oven 100% Whole Wheat Bread 400g", short_code: "BRD-037", category_name: "Bakery & Confectionery", unit: "Piece", price: 55.0, stock: 30 },
  { name: "Britannia Daily Fresh Pav 6pcs", short_code: "PAV-038", category_name: "Bakery & Confectionery", unit: "Piece", price: 35.0, stock: 40 },
  { name: "Chocolate Hazelnut Cream Croissant", short_code: "PAS-039", category_name: "Bakery & Confectionery", unit: "Piece", price: 95.0, stock: 20 },
  { name: "Classic French Baguette 250g", short_code: "BRD-040", category_name: "Bakery & Confectionery", unit: "Piece", price: 65.0, stock: 15 },
  { name: "Blueberry Muffin 100g", short_code: "PAS-041", category_name: "Bakery & Confectionery", unit: "Piece", price: 75.0, stock: 25 },

  // 7. Personal Care & Hygiene
  { name: "Dettol Original Bathing Soap 125g (Pack of 3)", short_code: "SOP-042", category_name: "Personal Care", unit: "Piece", price: 165.0, stock: 40 },
  { name: "Colgate MaxFresh Peppermint 150g", short_code: "PST-043", category_name: "Personal Care", unit: "Piece", price: 110.0, stock: 60 },
  { name: "Head & Shoulders Anti-Dandruff 340ml", short_code: "SHM-044", category_name: "Personal Care", unit: "Piece", price: 340.0, stock: 35 },
  { name: "Nivea Soft Moisturizing Cream 200ml", short_code: "CRM-045", category_name: "Personal Care", unit: "Piece", price: 299.0, stock: 30 },
  { name: "Dettol Liquid Handwash Refill 750ml", short_code: "HND-046", category_name: "Personal Care", unit: "Litre", price: 120.0, stock: 50 },

  // 8. Household Essentials
  { name: "Surf Excel Matic Front Load Powder 2kg", short_code: "DET-047", category_name: "Household Essentials", unit: "KG", price: 460.0, stock: 40 },
  { name: "Vim Lemon Dishwash Gel 750ml Bottle", short_code: "CLF-048", category_name: "Household Essentials", unit: "Litre", price: 155.0, stock: 45 },
  { name: "Lizol Disinfectant Surface Cleaner 1L", short_code: "CLF-049", category_name: "Household Essentials", unit: "Litre", price: 215.0, stock: 50 },
  { name: "Origami Super Absorbent Kitchen Towel 2 Rolls", short_code: "PPR-050", category_name: "Household Essentials", unit: "Piece", price: 140.0, stock: 60 },
];
