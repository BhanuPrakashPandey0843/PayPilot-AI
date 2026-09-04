# This file should ensure the existence of records required to run the application in every environment (production,
# development, test). The code here should be idempotent so that it can be executed at any point in every environment.
# The data can then be loaded with the bin/rails db:seed command (or created alongside the database with db:setup).

puts "Clearing existing products..."
Product.destroy_all

puts "Creating product catalog..."

# Helper method to create products
def create_product(name:, description:, price:, inventory_quantity:, product_attributes:)
  Product.create!(
    name: name,
    description: description,
    price: price,
    inventory_quantity: inventory_quantity,
    product_attributes: product_attributes
  )
end

# Clothing - Shirts
create_product(
  name: "Classic Red Cotton T-Shirt",
  description: "Comfortable 100% cotton t-shirt in vibrant red. Perfect for casual wear.",
  price: 24.99,
  inventory_quantity: 50,
  product_attributes: {
    color: "red",
    size: "medium",
    category: "clothing",
    subcategory: "shirts",
    material: "cotton",
    gender: "unisex",
    tags: ["casual", "summer", "basic"]
  }
)

create_product(
  name: "Blue Denim Button-Up Shirt",
  description: "Classic denim shirt with button-up front. Versatile and stylish.",
  price: 45.00,
  inventory_quantity: 35,
  product_attributes: {
    color: "blue",
    size: "large",
    category: "clothing",
    subcategory: "shirts",
    material: "denim",
    gender: "unisex",
    tags: ["casual", "classic", "versatile"]
  }
)

create_product(
  name: "White Linen Summer Shirt",
  description: "Lightweight linen shirt perfect for hot summer days. Breathable and comfortable.",
  price: 39.99,
  inventory_quantity: 42,
  product_attributes: {
    color: "white",
    size: "medium",
    category: "clothing",
    subcategory: "shirts",
    material: "linen",
    gender: "unisex",
    tags: ["summer", "lightweight", "breathable"]
  }
)

create_product(
  name: "Black Polo Shirt",
  description: "Smart casual polo shirt in classic black. Great for work or weekend.",
  price: 32.50,
  inventory_quantity: 60,
  product_attributes: {
    color: "black",
    size: "large",
    category: "clothing",
    subcategory: "shirts",
    material: "cotton-blend",
    gender: "unisex",
    tags: ["casual", "smart-casual", "work"]
  }
)

create_product(
  name: "Green Flannel Shirt",
  description: "Warm flannel shirt in forest green. Perfect for cooler weather.",
  price: 48.00,
  inventory_quantity: 28,
  product_attributes: {
    color: "green",
    size: "medium",
    category: "clothing",
    subcategory: "shirts",
    material: "flannel",
    gender: "unisex",
    tags: ["winter", "warm", "outdoor"]
  }
)

# Clothing - Pants
create_product(
  name: "Dark Blue Jeans",
  description: "Classic fit dark blue jeans. Durable and comfortable for everyday wear.",
  price: 59.99,
  inventory_quantity: 45,
  product_attributes: {
    color: "blue",
    size: "32x32",
    category: "clothing",
    subcategory: "pants",
    material: "denim",
    gender: "unisex",
    tags: ["casual", "classic", "everyday"]
  }
)

create_product(
  name: "Black Dress Pants",
  description: "Professional dress pants in black. Perfect for office or formal occasions.",
  price: 69.99,
  inventory_quantity: 30,
  product_attributes: {
    color: "black",
    size: "34x32",
    category: "clothing",
    subcategory: "pants",
    material: "polyester-blend",
    gender: "unisex",
    tags: ["formal", "work", "professional"]
  }
)

create_product(
  name: "Khaki Chinos",
  description: "Versatile khaki chinos. Great for smart casual looks.",
  price: 54.99,
  inventory_quantity: 38,
  product_attributes: {
    color: "khaki",
    size: "32x30",
    category: "clothing",
    subcategory: "pants",
    material: "cotton-twill",
    gender: "unisex",
    tags: ["smart-casual", "versatile", "work"]
  }
)

create_product(
  name: "Gray Joggers",
  description: "Comfortable athletic joggers in heather gray. Perfect for workouts or lounging.",
  price: 42.00,
  inventory_quantity: 55,
  product_attributes: {
    color: "gray",
    size: "medium",
    category: "clothing",
    subcategory: "pants",
    material: "cotton-polyester",
    gender: "unisex",
    tags: ["athletic", "casual", "comfortable"]
  }
)

# Clothing - Outerwear
create_product(
  name: "Navy Blue Windbreaker",
  description: "Lightweight windbreaker jacket. Water-resistant and packable.",
  price: 79.99,
  inventory_quantity: 25,
  product_attributes: {
    color: "blue",
    size: "large",
    category: "clothing",
    subcategory: "outerwear",
    material: "nylon",
    gender: "unisex",
    tags: ["outdoor", "water-resistant", "lightweight"]
  }
)

create_product(
  name: "Black Leather Jacket",
  description: "Classic leather jacket in black. Timeless style and durability.",
  price: 199.99,
  inventory_quantity: 15,
  product_attributes: {
    color: "black",
    size: "medium",
    category: "clothing",
    subcategory: "outerwear",
    material: "leather",
    gender: "unisex",
    tags: ["classic", "premium", "winter"]
  }
)

create_product(
  name: "Red Puffer Jacket",
  description: "Warm puffer jacket in bright red. Insulated for cold weather.",
  price: 129.99,
  inventory_quantity: 20,
  product_attributes: {
    color: "red",
    size: "large",
    category: "clothing",
    subcategory: "outerwear",
    material: "polyester",
    gender: "unisex",
    tags: ["winter", "warm", "insulated"]
  }
)

# Electronics - Phones
create_product(
  name: "Smartphone Pro Max 256GB",
  description: "Latest flagship smartphone with advanced camera system and 5G connectivity.",
  price: 999.99,
  inventory_quantity: 12,
  product_attributes: {
    color: "black",
    category: "electronics",
    subcategory: "phones",
    brand: "TechBrand",
    storage: "256GB",
    features: ["5G", "triple-camera", "OLED-display"],
    tags: ["premium", "flagship", "smartphone"]
  }
)

create_product(
  name: "Budget Smartphone 128GB",
  description: "Affordable smartphone with great battery life and decent camera.",
  price: 299.99,
  inventory_quantity: 35,
  product_attributes: {
    color: "blue",
    category: "electronics",
    subcategory: "phones",
    brand: "ValueTech",
    storage: "128GB",
    features: ["4G", "dual-camera", "LCD-display"],
    tags: ["budget", "affordable", "smartphone"]
  }
)

create_product(
  name: "Smartphone SE 64GB",
  description: "Compact smartphone with powerful performance in a smaller form factor.",
  price: 449.99,
  inventory_quantity: 28,
  product_attributes: {
    color: "white",
    category: "electronics",
    subcategory: "phones",
    brand: "TechBrand",
    storage: "64GB",
    features: ["5G", "single-camera", "compact"],
    tags: ["compact", "mid-range", "smartphone"]
  }
)

# Electronics - Laptops
create_product(
  name: "UltraBook Pro 15-inch",
  description: "Professional laptop with powerful processor and stunning display. Perfect for work and creativity.",
  price: 1499.99,
  inventory_quantity: 8,
  product_attributes: {
    color: "silver",
    category: "electronics",
    subcategory: "laptops",
    brand: "CompuTech",
    screen_size: "15-inch",
    processor: "Intel i7",
    ram: "16GB",
    storage: "512GB SSD",
    tags: ["professional", "premium", "laptop"]
  }
)

create_product(
  name: "Student Laptop 14-inch",
  description: "Affordable laptop perfect for students and everyday tasks.",
  price: 599.99,
  inventory_quantity: 22,
  product_attributes: {
    color: "gray",
    category: "electronics",
    subcategory: "laptops",
    brand: "ValueTech",
    screen_size: "14-inch",
    processor: "Intel i5",
    ram: "8GB",
    storage: "256GB SSD",
    tags: ["budget", "student", "laptop"]
  }
)

create_product(
  name: "Gaming Laptop 17-inch",
  description: "High-performance gaming laptop with dedicated graphics card.",
  price: 1899.99,
  inventory_quantity: 6,
  product_attributes: {
    color: "black",
    category: "electronics",
    subcategory: "laptops",
    brand: "GameTech",
    screen_size: "17-inch",
    processor: "Intel i9",
    ram: "32GB",
    storage: "1TB SSD",
    graphics: "RTX 4060",
    tags: ["gaming", "high-performance", "laptop"]
  }
)

# Electronics - Accessories
create_product(
  name: "Wireless Bluetooth Headphones",
  description: "Premium noise-cancelling headphones with 30-hour battery life.",
  price: 249.99,
  inventory_quantity: 40,
  product_attributes: {
    color: "black",
    category: "electronics",
    subcategory: "accessories",
    brand: "AudioTech",
    features: ["noise-cancelling", "wireless", "bluetooth"],
    tags: ["audio", "premium", "headphones"]
  }
)

create_product(
  name: "USB-C Fast Charger 65W",
  description: "Fast charging adapter compatible with laptops and phones.",
  price: 39.99,
  inventory_quantity: 75,
  product_attributes: {
    color: "white",
    category: "electronics",
    subcategory: "accessories",
    brand: "ChargeTech",
    wattage: "65W",
    features: ["fast-charging", "USB-C", "compact"],
    tags: ["charger", "accessory", "essential"]
  }
)

create_product(
  name: "Wireless Mouse",
  description: "Ergonomic wireless mouse with precision tracking.",
  price: 29.99,
  inventory_quantity: 90,
  product_attributes: {
    color: "gray",
    category: "electronics",
    subcategory: "accessories",
    brand: "CompuTech",
    features: ["wireless", "ergonomic", "rechargeable"],
    tags: ["mouse", "accessory", "office"]
  }
)

create_product(
  name: "Laptop Sleeve 15-inch",
  description: "Protective laptop sleeve with soft interior lining.",
  price: 24.99,
  inventory_quantity: 65,
  product_attributes: {
    color: "blue",
    category: "electronics",
    subcategory: "accessories",
    size: "15-inch",
    material: "neoprene",
    tags: ["protection", "accessory", "laptop"]
  }
)

# Home & Living - Furniture
create_product(
  name: "Ergonomic Office Chair",
  description: "Comfortable office chair with lumbar support and adjustable height.",
  price: 299.99,
  inventory_quantity: 18,
  product_attributes: {
    color: "black",
    category: "home",
    subcategory: "furniture",
    material: "mesh-fabric",
    features: ["ergonomic", "adjustable", "lumbar-support"],
    tags: ["office", "furniture", "comfort"]
  }
)

create_product(
  name: "Standing Desk",
  description: "Adjustable standing desk for healthier work habits.",
  price: 449.99,
  inventory_quantity: 10,
  product_attributes: {
    color: "white",
    category: "home",
    subcategory: "furniture",
    material: "wood-metal",
    features: ["adjustable-height", "electric", "spacious"],
    tags: ["office", "furniture", "ergonomic"]
  }
)

create_product(
  name: "Bookshelf 5-Tier",
  description: "Modern bookshelf with five tiers for storage and display.",
  price: 129.99,
  inventory_quantity: 15,
  product_attributes: {
    color: "brown",
    category: "home",
    subcategory: "furniture",
    material: "wood",
    dimensions: "72x30x12",
    tags: ["storage", "furniture", "organization"]
  }
)

# Home & Living - Decor
create_product(
  name: "Modern Table Lamp",
  description: "Sleek table lamp with adjustable brightness.",
  price: 49.99,
  inventory_quantity: 45,
  product_attributes: {
    color: "silver",
    category: "home",
    subcategory: "decor",
    material: "metal",
    features: ["dimmable", "LED", "modern"],
    tags: ["lighting", "decor", "modern"]
  }
)

create_product(
  name: "Wall Art Canvas Set",
  description: "Set of 3 abstract canvas prints for wall decoration.",
  price: 79.99,
  inventory_quantity: 25,
  product_attributes: {
    color: "multicolor",
    category: "home",
    subcategory: "decor",
    material: "canvas",
    dimensions: "24x36",
    tags: ["art", "decor", "wall"]
  }
)

create_product(
  name: "Decorative Throw Pillows (Set of 2)",
  description: "Soft decorative pillows with geometric patterns.",
  price: 34.99,
  inventory_quantity: 50,
  product_attributes: {
    color: "gray",
    category: "home",
    subcategory: "decor",
    material: "cotton",
    pattern: "geometric",
    tags: ["comfort", "decor", "living-room"]
  }
)

# Sports & Outdoors
create_product(
  name: "Yoga Mat Premium",
  description: "Non-slip yoga mat with extra cushioning for comfort.",
  price: 39.99,
  inventory_quantity: 60,
  product_attributes: {
    color: "purple",
    category: "sports",
    subcategory: "fitness",
    material: "TPE",
    thickness: "6mm",
    features: ["non-slip", "eco-friendly", "cushioned"],
    tags: ["yoga", "fitness", "exercise"]
  }
)

create_product(
  name: "Resistance Bands Set",
  description: "Set of 5 resistance bands for strength training.",
  price: 24.99,
  inventory_quantity: 70,
  product_attributes: {
    color: "multicolor",
    category: "sports",
    subcategory: "fitness",
    material: "latex",
    features: ["portable", "versatile", "durable"],
    tags: ["fitness", "strength-training", "exercise"]
  }
)

create_product(
  name: "Water Bottle 32oz",
  description: "Insulated stainless steel water bottle keeps drinks cold for 24 hours.",
  price: 29.99,
  inventory_quantity: 85,
  product_attributes: {
    color: "blue",
    category: "sports",
    subcategory: "accessories",
    material: "stainless-steel",
    capacity: "32oz",
    features: ["insulated", "leak-proof", "BPA-free"],
    tags: ["hydration", "outdoor", "fitness"]
  }
)

create_product(
  name: "Camping Tent 4-Person",
  description: "Spacious camping tent for family adventures.",
  price: 159.99,
  inventory_quantity: 12,
  product_attributes: {
    color: "green",
    category: "sports",
    subcategory: "camping",
    material: "polyester",
    capacity: "4-person",
    features: ["waterproof", "easy-setup", "ventilated"],
    tags: ["camping", "outdoor", "adventure"]
  }
)

puts "Created #{Product.count} products successfully!"
puts "\nProduct breakdown by category:"
puts "- Clothing: #{Product.where("product_attributes->>'category' = ?", 'clothing').count}"
puts "- Electronics: #{Product.where("product_attributes->>'category' = ?", 'electronics').count}"
puts "- Home: #{Product.where("product_attributes->>'category' = ?", 'home').count}"
puts "- Sports: #{Product.where("product_attributes->>'category' = ?", 'sports').count}"
puts "\nTotal inventory: #{Product.sum(:inventory_quantity)} items"
