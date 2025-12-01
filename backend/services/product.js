const Product = require("../src/models/Product");
const Category = require("../src/models/Category");
const User = require("../src/models/User");

// Create product
exports.create = async (data) => {
  try {
    const newProduct = new Product({
      name: data.name,
      category: data.category,
      seller: data.seller,
      startPrice: data.startPrice,
      currentPrice: data.currentPrice || data.startPrice,
      stepPrice: data.stepPrice,
      buyNowPrice: data.buyNowPrice,
      endDate: data.endDate,
      isAutoRenew: data.isAutoRenew || false,
      description: data.description,
      images: data.images || [],
      status: 'active'
    });

    const savedProduct = await newProduct.save();

    // Console log the created product
    console.log("\n" + "=".repeat(60));
    console.log("✅ NEW AUCTION CREATED IN MONGODB");
    console.log("=".repeat(60));
    console.log("Product ID:", savedProduct._id);
    console.log("Name:", savedProduct.name);
    console.log("Category:", savedProduct.category);
    console.log("Seller:", savedProduct.seller);
    console.log("Start Price: $" + savedProduct.startPrice);
    console.log("Step Price: $" + savedProduct.stepPrice);
    console.log("Buy Now Price: $" + (savedProduct.buyNowPrice || 'N/A'));
    console.log("End Date:", savedProduct.endDate);
    console.log("Auto Renew:", savedProduct.isAutoRenew);
    console.log("Images:", savedProduct.images?.length || 0, "image(s)");
    console.log("Created At:", new Date().toLocaleString());
    console.log("💾 Saved to MongoDB");
    console.log("=".repeat(60) + "\n");

    return savedProduct;
  } catch (error) {
    console.error("Error creating product:", error);
    throw error;
  }
};

// Get all products
exports.getAll = async () => {
  try {
    const products = await Product.find({ status: 'active' })
      .populate('category', 'name')
      .populate('seller', 'fullName email')
      .sort({ createdAt: -1 });
    console.log(`📦 Fetched ${products.length} products from MongoDB`);
    return products;
  } catch (error) {
    console.error("Error fetching products:", error);
    throw error;
  }
};

// Get product by ID
exports.getById = async (id) => {
  try {
    const product = await Product.findById(id)
      .populate('category', 'name')
      .populate('seller', 'fullName email')
      .populate('highestBidder', 'fullName email');
    
    console.log('📊 Product fetched with populate:', {
      id: product?._id,
      name: product?.name,
      categoryType: typeof product?.category,
      category: product?.category,
      hasPopulatedCategory: product?.category?._id ? true : false
    });
    
    return product;
  } catch (error) {
    console.error("Error fetching product by ID:", error);
    throw error;
  }
};

// Update product
exports.update = async (id, data) => {
  try {
    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      { ...data, updatedAt: new Date() },
      { new: true, runValidators: true }
    );
    
    if (!updatedProduct) {
      throw new Error("Product not found");
    }
    
    console.log(`✅ Product ${id} updated in MongoDB`);
    return updatedProduct;
  } catch (error) {
    console.error("Error updating product:", error);
    throw error;
  }
};

// Delete product
exports.delete = async (id) => {
  try {
    const deletedProduct = await Product.findByIdAndDelete(id);
    
    if (!deletedProduct) {
      throw new Error("Product not found");
    }
    
    console.log(`🗑️ Product ${id} deleted from MongoDB`);
    return deletedProduct;
  } catch (error) {
    console.error("Error deleting product:", error);
    throw error;
  }
};
