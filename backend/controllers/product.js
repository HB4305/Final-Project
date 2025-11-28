const service = require("../services/product");

// Create product
exports.createProduct = async (req, res) => {
  try {
    console.log("📥 Incoming product creation request...");
    console.log("Request body:", req.body);
    const result = await service.create(req.body);
    console.log("✅ Product saved to DB with ID:", result._id);
    
    // Populate and transform the created product
    const populatedProduct = await service.getById(result._id);
    console.log("📊 Populated product category:", populatedProduct.category);
    
    const transformedProduct = {
      id: populatedProduct._id,
      name: populatedProduct.name,
      category: populatedProduct.category ? {
        id: populatedProduct.category._id || populatedProduct.category,
        name: populatedProduct.category.name || 'Unknown'
      } : null,
      seller: populatedProduct.seller ? {
        id: populatedProduct.seller._id,
        fullName: populatedProduct.seller.fullName,
        email: populatedProduct.seller.email
      } : null,
      startPrice: populatedProduct.startPrice,
      currentPrice: populatedProduct.currentPrice,
      stepPrice: populatedProduct.stepPrice,
      buyNowPrice: populatedProduct.buyNowPrice,
      endDate: populatedProduct.endDate,
      isAutoRenew: populatedProduct.isAutoRenew,
      description: populatedProduct.description,
      images: populatedProduct.images,
      status: populatedProduct.status,
      postDate: populatedProduct.postDate,
      createdAt: populatedProduct.createdAt
    };
    
    console.log("✅ Product created and sent to client");
    res.status(201).json({
      success: true,
      data: transformedProduct,
      message: "Product created successfully"
    });
  } catch (err) {
    console.error("❌ Error creating product:", err.message);
    res.status(400).json({ 
      success: false,
      message: err.message 
    });
  }
};

// Get all products
exports.getAllProducts = async (req, res) => {
  try {
    const products = await service.getAll();
    
    // Transform MongoDB _id to id for frontend compatibility
    const transformedProducts = products.map(product => ({
      id: product._id,
      name: product.name,
      category: product.category ? {
        id: product.category._id,
        name: product.category.name
      } : null,
      seller: product.seller ? {
        id: product.seller._id,
        fullName: product.seller.fullName,
        email: product.seller.email
      } : null,
      startPrice: product.startPrice,
      currentPrice: product.currentPrice,
      stepPrice: product.stepPrice,
      buyNowPrice: product.buyNowPrice,
      highestBidder: product.highestBidder,
      endDate: product.endDate,
      isAutoRenew: product.isAutoRenew,
      description: product.description,
      images: product.images,
      status: product.status,
      postDate: product.postDate,
      createdAt: product.createdAt
    }));
    
    res.json({
      success: true,
      count: transformedProducts.length,
      data: transformedProducts
    });
  } catch (err) {
    res.status(500).json({ 
      success: false,
      message: err.message 
    });
  }
};

// Get product by ID
exports.getProductById = async (req, res) => {
  try {
    const product = await service.getById(req.params.id);
    if (!product) {
      return res.status(404).json({ 
        success: false,
        message: "Product not found" 
      });
    }
    
    // Transform MongoDB _id to id for frontend compatibility
    const productData = {
      id: product._id,
      name: product.name,
      category: product.category ? {
        id: product.category._id,
        name: product.category.name
      } : null,
      seller: product.seller ? {
        id: product.seller._id,
        fullName: product.seller.fullName,
        email: product.seller.email
      } : null,
      startPrice: product.startPrice,
      currentPrice: product.currentPrice,
      stepPrice: product.stepPrice,
      buyNowPrice: product.buyNowPrice,
      highestBidder: product.highestBidder ? {
        id: product.highestBidder._id,
        fullName: product.highestBidder.fullName,
        email: product.highestBidder.email
      } : null,
      endDate: product.endDate,
      isAutoRenew: product.isAutoRenew,
      description: product.description,
      images: product.images,
      status: product.status,
      postDate: product.postDate,
      createdAt: product.createdAt
    };
    
    res.json({
      success: true,
      data: productData
    });
  } catch (err) {
    res.status(500).json({ 
      success: false,
      message: err.message 
    });
  }
};

// Update product
exports.updateProduct = async (req, res) => {
  try {
    const result = await service.update(req.params.id, req.body);
    res.json({
      success: true,
      data: result,
      message: "Product updated successfully"
    });
  } catch (err) {
    res.status(400).json({ 
      success: false,
      message: err.message 
    });
  }
};

// Delete product
exports.deleteProduct = async (req, res) => {
  try {
    const result = await service.delete(req.params.id);
    res.json({
      success: true,
      data: result,
      message: "Product deleted successfully"
    });
  } catch (err) {
    res.status(400).json({ 
      success: false,
      message: err.message 
    });
  }
};
