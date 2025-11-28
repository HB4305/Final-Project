const Category = require("../src/models/Category");
const Product = require("../src/models/Product");

// Initialize default categories
const initDefaultCategories = async () => {
  try {
    const count = await Category.countDocuments();
    if (count === 0) {
      const defaultCategories = [
        { name: "Electronics", description: "Electronic devices and gadgets" },
        { name: "Fashion", description: "Clothing and accessories" },
        { name: "Collectibles", description: "Rare and collectible items" },
        { name: "Home & Garden", description: "Home decor and garden items" }
      ];
      await Category.insertMany(defaultCategories);
      console.log("📁 Created default categories in MongoDB");
    }
  } catch (error) {
    console.error("Error initializing categories:", error);
  }
};

// Call init on module load
initDefaultCategories();

// Get all categories
exports.getAll = async () => {
  try {
    const categories = await Category.find().sort({ createdAt: 1 });
    return categories;
  } catch (error) {
    console.error("Error fetching categories:", error);
    throw error;
  }
};

// Get category by ID
exports.getById = async (id) => {
  try {
    const category = await Category.findById(id);
    return category;
  } catch (error) {
    console.error("Error fetching category:", error);
    throw error;
  }
};

// Create new category
exports.create = async (data) => {
  try {
    // Check if category name already exists
    const exists = await Category.findOne({ 
      name: { $regex: new RegExp(`^${data.name}$`, 'i') } 
    });
    
    if (exists) {
      throw new Error("Category name already exists");
    }
    
    const newCategory = new Category({
      name: data.name,
      description: data.description || ""
    });

    const savedCategory = await newCategory.save();
    console.log(`✅ Category created in MongoDB: ${savedCategory.name}`);
    return savedCategory;
  } catch (error) {
    console.error("Error creating category:", error);
    throw error;
  }
};

// Update category
exports.update = async (id, data) => {
  try {
    // Check if new name conflicts with existing category
    if (data.name) {
      const exists = await Category.findOne({
        _id: { $ne: id },
        name: { $regex: new RegExp(`^${data.name}$`, 'i') }
      });
      
      if (exists) {
        throw new Error("Category name already exists");
      }
    }
    
    const updatedCategory = await Category.findByIdAndUpdate(
      id,
      { ...data, updatedAt: new Date() },
      { new: true, runValidators: true }
    );
    
    if (!updatedCategory) {
      throw new Error("Category not found");
    }
    
    console.log(`✅ Category updated in MongoDB: ${updatedCategory.name}`);
    return updatedCategory;
  } catch (error) {
    console.error("Error updating category:", error);
    throw error;
  }
};

// Delete category
exports.delete = async (id) => {
  try {
    const category = await Category.findById(id);
    
    if (!category) {
      throw new Error("Category not found");
    }
    
    // Check if category is being used by products (using ObjectId reference)
    const productCount = await Product.countDocuments({ category: id });
    if (productCount > 0) {
      throw new Error("Cannot delete category that is being used by products");
    }
    
    const deletedCategory = await Category.findByIdAndDelete(id);
    console.log(`🗑️ Category deleted from MongoDB: ${deletedCategory.name}`);
    return deletedCategory;
  } catch (error) {
    console.error("Error deleting category:", error);
    throw error;
  }
};
