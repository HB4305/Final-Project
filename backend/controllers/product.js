const service = require("../services/product");

// Create product
exports.createProduct = async (req, res) => {
  try {
    console.log("📥 Incoming product creation request...");
    const result = await service.create(req.body);
    console.log("✅ Product created and sent to client");
    res.status(201).json({
      success: true,
      data: result,
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
    res.json({
      success: true,
      count: products.length,
      data: products
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
    res.json({
      success: true,
      data: product
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
