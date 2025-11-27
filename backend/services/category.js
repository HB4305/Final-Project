const fs = require("fs");
const path = require("path");

const DB_FILE = path.join(__dirname, "..", "categories.json");
const PRODUCTS_FILE = path.join(__dirname, "..", "products.json");

// Initialize database file if not exists
const initDB = () => {
  if (!fs.existsSync(DB_FILE)) {
    const defaultCategories = [
      { id: 1, name: "Electronics", description: "Electronic devices and gadgets", createdAt: new Date().toISOString() },
      { id: 2, name: "Fashion", description: "Clothing and accessories", createdAt: new Date().toISOString() },
      { id: 3, name: "Collectibles", description: "Rare and collectible items", createdAt: new Date().toISOString() },
      { id: 4, name: "Home & Garden", description: "Home decor and garden items", createdAt: new Date().toISOString() }
    ];
    fs.writeFileSync(DB_FILE, JSON.stringify(defaultCategories, null, 2));
    console.log("📁 Created categories.json with default categories");
  }
};

// Read categories from file
const readCategories = () => {
  try {
    initDB();
    const data = fs.readFileSync(DB_FILE, "utf8");
    return JSON.parse(data);
  } catch (error) {
    console.error("Error reading categories:", error);
    return [];
  }
};

// Write categories to file
const writeCategories = (categories) => {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(categories, null, 2));
  } catch (error) {
    console.error("Error writing categories:", error);
    throw error;
  }
};

// Check if category is used by any product
const isCategoryUsed = (categoryName) => {
  try {
    if (!fs.existsSync(PRODUCTS_FILE)) return false;
    const products = JSON.parse(fs.readFileSync(PRODUCTS_FILE, "utf8"));
    return products.some(p => p.category === categoryName);
  } catch (error) {
    console.error("Error checking category usage:", error);
    return false;
  }
};

// Get all categories
exports.getAll = async () => {
  return readCategories();
};

// Get category by ID
exports.getById = async (id) => {
  const categories = readCategories();
  return categories.find(c => c.id === parseInt(id));
};

// Create new category
exports.create = async (data) => {
  const categories = readCategories();
  
  // Check if category name already exists
  const exists = categories.find(c => c.name.toLowerCase() === data.name.toLowerCase());
  if (exists) {
    throw new Error("Category name already exists");
  }
  
  const newCategory = {
    id: Date.now(),
    name: data.name,
    description: data.description || "",
    createdAt: new Date().toISOString()
  };

  categories.push(newCategory);
  writeCategories(categories);

  console.log(`✅ Category created: ${newCategory.name}`);
  return newCategory;
};

// Update category
exports.update = async (id, data) => {
  const categories = readCategories();
  const index = categories.findIndex(c => c.id === parseInt(id));
  
  if (index === -1) {
    throw new Error("Category not found");
  }
  
  // Check if new name conflicts with existing category
  if (data.name) {
    const exists = categories.find(c => 
      c.id !== parseInt(id) && 
      c.name.toLowerCase() === data.name.toLowerCase()
    );
    if (exists) {
      throw new Error("Category name already exists");
    }
  }
  
  categories[index] = {
    ...categories[index],
    ...data,
    updatedAt: new Date().toISOString()
  };
  
  writeCategories(categories);
  console.log(`✅ Category updated: ${categories[index].name}`);
  return categories[index];
};

// Delete category
exports.delete = async (id) => {
  const categories = readCategories();
  const index = categories.findIndex(c => c.id === parseInt(id));
  
  if (index === -1) {
    throw new Error("Category not found");
  }
  
  const category = categories[index];
  
  // Check if category is being used by products
  if (isCategoryUsed(category.name)) {
    throw new Error("Cannot delete category that is being used by products");
  }
  
  const deleted = categories.splice(index, 1)[0];
  writeCategories(categories);
  
  console.log(`✅ Category deleted: ${deleted.name}`);
  return deleted;
};
