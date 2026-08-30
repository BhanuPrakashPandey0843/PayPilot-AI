/**
 * MOCK DATA — for frontend demonstration only.
 * Shapes loosely mirror the real `products` table in the PayPilot AI
 * backend (see backend/src/db/schema/products.ts) but every value here
 * is synthetic and never touches the live API.
 */

export type MockProduct = {
  id: string;
  name: string;
  slug: string;
  category: string;
  tags: string[];
  price: number; // INR, minor units (paise)
  inventory: number;
  isActive: boolean;
  description: string;
};

export const MOCK_PRODUCTS: MockProduct[] = [
  {
    id: "prod_01",
    name: "Trailrunner Mesh Sneaker",
    slug: "trailrunner-mesh-sneaker",
    category: "Footwear",
    tags: ["running", "breathable", "unisex"],
    price: 449900,
    inventory: 128,
    isActive: true,
    description: "Lightweight daily trainer with a breathable mesh upper.",
  },
  {
    id: "prod_02",
    name: "Compression Runner Socks (3-pack)",
    slug: "compression-runner-socks",
    category: "Accessories",
    tags: ["running", "recovery"],
    price: 79900,
    inventory: 340,
    isActive: true,
    description: "Graduated compression for faster recovery on long runs.",
  },
  {
    id: "prod_03",
    name: "Hydration Vest 5L",
    slug: "hydration-vest-5l",
    category: "Gear",
    tags: ["running", "trail", "hydration"],
    price: 329900,
    inventory: 54,
    isActive: true,
    description: "Race-ready vest with two soft flasks and a 2L bladder pocket.",
  },
  {
    id: "prod_04",
    name: "Recovery Slide",
    slug: "recovery-slide",
    category: "Footwear",
    tags: ["recovery", "post-run"],
    price: 189900,
    inventory: 0,
    isActive: true,
    description: "Cushioned slide for post-run recovery days.",
  },
];

export const MOCK_CATALOG_FIELDS = [
  "slug",
  "tags[] (GIN indexed)",
  "price (bigint, minor units)",
  "inventory_quantity",
  "is_active",
  "category",
  "AI-shaped `reasons[]` for upsell / cross-sell",
];
