export interface SampleProduct {
  name: string;
  short_code: string;
  category_name: string;
  unit: "Piece" | "KG" | "Litre";
  price: number;
}

export const SAMPLE_50_PRODUCTS: SampleProduct[] = [
  // 1. Groceries & Staples
  { name: "Royal Basmati Rice 5kg", short_code: "RIC-001", category_name: "Groceries & Staples", unit: "KG", price: 540.0 },
  { name: "Aashirvaad Whole Wheat Atta 10kg", short_code: "ATT-002", category_name: "Groceries & Staples", unit: "KG", price: 420.0 },
  { name: "Organic Toor Dal 1kg", short_code: "DAL-003", category_name: "Groceries & Staples", unit: "KG", price: 165.0 },
  { name: "Tata Crystal Salt 1kg", short_code: "SLT-004", category_name: "Groceries & Staples", unit: "KG", price: 28.0 },
  { name: "Refined Pure Sugar 5kg", short_code: "SGR-005", category_name: "Groceries & Staples", unit: "KG", price: 230.0 },
  { name: "Moong Dal Washed 1kg", short_code: "DAL-006", category_name: "Groceries & Staples", unit: "KG", price: 140.0 },
  { name: "Premium Chana Besan 1kg", short_code: "FLR-007", category_name: "Groceries & Staples", unit: "KG", price: 95.0 },
  { name: "Sona Masoori Rice 10kg", short_code: "RIC-008", category_name: "Groceries & Staples", unit: "KG", price: 620.0 },

  // 2. Oils & Ghee
  { name: "Fortune Sunlite Refined Oil 1L", short_code: "OIL-009", category_name: "Oils & Ghee", unit: "Litre", price: 145.0 },
  { name: "Amul Pure Cow Ghee 1L Tin", short_code: "GHE-010", category_name: "Oils & Ghee", unit: "Litre", price: 650.0 },
  { name: "Dhara Mustard Oil 1L", short_code: "OIL-011", category_name: "Oils & Ghee", unit: "Litre", price: 155.0 },
  { name: "Extra Virgin Olive Oil 500ml", short_code: "OIL-012", category_name: "Oils & Ghee", unit: "Litre", price: 490.0 },
  { name: "Pure Groundnut Cooking Oil 1L", short_code: "OIL-013", category_name: "Oils & Ghee", unit: "Litre", price: 180.0 },

  // 3. Dairy & Breakfast
  { name: "Amul Taaza Homogenised Milk 1L", short_code: "MLK-014", category_name: "Dairy & Breakfast", unit: "Litre", price: 72.0 },
  { name: "Amul Pasteurised Butter 500g", short_code: "BTR-015", category_name: "Dairy & Breakfast", unit: "Piece", price: 275.0 },
  { name: "Fresh Malai Paneer 200g", short_code: "PNR-016", category_name: "Dairy & Breakfast", unit: "Piece", price: 95.0 },
  { name: "Mother Dairy Dahi 1kg", short_code: "CUR-017", category_name: "Dairy & Breakfast", unit: "KG", price: 85.0 },
  { name: "Britannia Cheddar Cheese Slices 200g", short_code: "CHS-018", category_name: "Dairy & Breakfast", unit: "Piece", price: 140.0 },
  { name: "Epigamia Greek Yogurt Strawberry 100g", short_code: "YOG-019", category_name: "Dairy & Breakfast", unit: "Piece", price: 50.0 },
  { name: "Kellogg's Corn Flakes 875g", short_code: "BRK-020", category_name: "Dairy & Breakfast", unit: "Piece", price: 340.0 },
  { name: "Quaker Rolled Oats 1kg", short_code: "OAT-021", category_name: "Dairy & Breakfast", unit: "KG", price: 199.0 },

  // 4. Beverages
  { name: "Nescafe Classic Coffee 100g Jar", short_code: "BEV-022", category_name: "Beverages", unit: "Piece", price: 320.0 },
  { name: "Brooke Bond Red Label Tea 1kg", short_code: "TEA-023", category_name: "Beverages", unit: "KG", price: 490.0 },
  { name: "Tetley Green Tea Lemon 100 Bags", short_code: "TEA-024", category_name: "Beverages", unit: "Piece", price: 410.0 },
  { name: "Bisleri Mineral Water 1L", short_code: "WTR-025", category_name: "Beverages", unit: "Litre", price: 20.0 },
  { name: "Tropicana 100% Orange Juice 1L", short_code: "JUC-026", category_name: "Beverages", unit: "Litre", price: 135.0 },
  { name: "Coca Cola Zero Sugar 750ml", short_code: "SOD-027", category_name: "Beverages", unit: "Piece", price: 45.0 },
  { name: "Real Mixed Fruit Juice 1L", short_code: "JUC-028", category_name: "Beverages", unit: "Litre", price: 125.0 },

  // 5. Snacks & Munchies
  { name: "Lay's Classic Salted Potato Chips 90g", short_code: "SNK-029", category_name: "Snacks & Munchies", unit: "Piece", price: 40.0 },
  { name: "Kurkure Masala Munch 90g", short_code: "SNK-030", category_name: "Snacks & Munchies", unit: "Piece", price: 30.0 },
  { name: "Haldiram's Bhujia Sev 400g", short_code: "SNK-031", category_name: "Snacks & Munchies", unit: "Piece", price: 120.0 },
  { name: "California Roasted Almonds 500g", short_code: "DRY-032", category_name: "Snacks & Munchies", unit: "KG", price: 480.0 },
  { name: "Whole Cashew Nuts W240 250g", short_code: "DRY-033", category_name: "Snacks & Munchies", unit: "KG", price: 290.0 },
  { name: "Cadbury Dairy Milk Silk 150g", short_code: "CHO-034", category_name: "Snacks & Munchies", unit: "Piece", price: 175.0 },
  { name: "Act II Butter Lovers Popcorn 150g", short_code: "POP-035", category_name: "Snacks & Munchies", unit: "Piece", price: 65.0 },
  { name: "Parle-G Gold Glucose Biscuits 1kg", short_code: "BSC-036", category_name: "Snacks & Munchies", unit: "KG", price: 110.0 },

  // 6. Bakery & Confectionery
  { name: "English Oven 100% Whole Wheat Bread 400g", short_code: "BRD-037", category_name: "Bakery & Confectionery", unit: "Piece", price: 55.0 },
  { name: "Britannia Fruit Cake 150g", short_code: "CAK-038", category_name: "Bakery & Confectionery", unit: "Piece", price: 45.0 },
  { name: "Nutella Hazelnut Spread 350g", short_code: "SPR-039", category_name: "Bakery & Confectionery", unit: "Piece", price: 380.0 },
  { name: "Kissan Mixed Fruit Jam 500g", short_code: "JAM-040", category_name: "Bakery & Confectionery", unit: "Piece", price: 170.0 },

  // 7. Personal Care & Hygiene
  { name: "Dettol Antiseptic Liquid 550ml", short_code: "DET-041", category_name: "Personal Care", unit: "Litre", price: 210.0 },
  { name: "Dove Deep Moisture Body Wash 800ml", short_code: "BOD-042", category_name: "Personal Care", unit: "Litre", price: 450.0 },
  { name: "Head & Shoulders Anti-Dandruff 650ml", short_code: "SHP-043", category_name: "Personal Care", unit: "Piece", price: 540.0 },
  { name: "Colgate MaxFresh Spicy Fresh 150g", short_code: "PST-044", category_name: "Personal Care", unit: "Piece", price: 115.0 },
  { name: "Lifebuoy Total Germ Protection Soap 4x125g", short_code: "SOP-045", category_name: "Personal Care", unit: "Piece", price: 145.0 },

  // 8. Household & Cleaning
  { name: "Surf Excel Matic Front Load 2kg", short_code: "DET-046", category_name: "Household & Cleaning", unit: "KG", price: 480.0 },
  { name: "Vim Lemon Dishwash Gel 750ml", short_code: "DSH-047", category_name: "Household & Cleaning", unit: "Litre", price: 160.0 },
  { name: "Lizol Disinfectant Surface Cleaner Citrus 2L", short_code: "CLF-048", category_name: "Household & Cleaning", unit: "Litre", price: 385.0 },
  { name: "Harpic Power Plus Toilet Cleaner 1L", short_code: "HRP-049", category_name: "Household & Cleaning", unit: "Litre", price: 215.0 },
  { name: "Godrej aer Pocket Bathroom Fragrance 10g", short_code: "AER-050", category_name: "Household & Cleaning", unit: "Piece", price: 60.0 },
];

