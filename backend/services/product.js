const fs = require("fs");
const path = require("path");

const DB_FILE = path.join(__dirname, "..", "products.json");

// Initialize database file if not exists
const initDB = () => {
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify([], null, 2));
    console.log("📁 Created products.json database file");
  }
};

// Read products from file
const readProducts = () => {
  try {
    initDB();
    const data = fs.readFileSync(DB_FILE, "utf8");
    return JSON.parse(data);
  } catch (error) {
    console.error("Error reading products:", error);
    return [];
  }
};

// Write products to file
const writeProducts = (products) => {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(products, null, 2));
  } catch (error) {
    console.error("Error writing products:", error);
    throw error;
  }
};

exports.create = async (data) => {
  const products = readProducts();
  
  const newProduct = {
    id: Date.now(),
    ...data,
    createdAt: new Date().toISOString(),
    status: 'active'
  };

  products.push(newProduct);
  writeProducts(products);

  // Console log the created product
  console.log("\n" + "=".repeat(60));
  console.log("✅ NEW AUCTION CREATED");
  console.log("=".repeat(60));
  console.log("Product ID:", newProduct.id);
  console.log("Name:", newProduct.name);
  console.log("Category:", newProduct.category);
  console.log("Starting Bid: $" + newProduct.startingBid);
  console.log("Images:", newProduct.images?.length || 0, "image(s)");
  console.log("Created At:", new Date().toLocaleString());
  console.log("Total Products:", products.length);
  console.log("💾 Saved to products.json");
  console.log("=".repeat(60) + "\n");

  return newProduct;
};

exports.getAll = async () => {
  return readProducts();
};

exports.getById = async (id) => {
  const products = readProducts();
  return products.find(p => p.id === parseInt(id));
};

exports.update = async (id, data) => {
  const products = readProducts();
  const index = products.findIndex(p => p.id === parseInt(id));
  
  if (index === -1) {
    throw new Error("Product not found");
  }
  
  products[index] = {
    ...products[index],
    ...data,
    updatedAt: new Date().toISOString()
  };
  
  writeProducts(products);
  return products[index];
};

exports.delete = async (id) => {
  const products = readProducts();
  const index = products.findIndex(p => p.id === parseInt(id));
  
  if (index === -1) {
    throw new Error("Product not found");
  }
  
  const deleted = products.splice(index, 1)[0];
  writeProducts(products);
  return deleted;
};
