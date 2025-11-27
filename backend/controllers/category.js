const service = require("../services/category");

// Get all categories
exports.getAllCategories = async (req, res) => {
  try {
    const categories = await service.getAll();
    res.json({
      success: true,
      count: categories.length,
      data: categories
    });
  } catch (err) {
    res.status(500).json({ 
      success: false,
      message: err.message 
    });
  }
};

// Get category by ID
exports.getCategoryById = async (req, res) => {
  try {
    const category = await service.getById(req.params.id);
    if (!category) {
      return res.status(404).json({ 
        success: false,
        message: "Category not found" 
      });
    }
    res.json({
      success: true,
      data: category
    });
  } catch (err) {
    res.status(500).json({ 
      success: false,
      message: err.message 
    });
  }
};

// Create category (Admin only)
exports.createCategory = async (req, res) => {
  try {
    const result = await service.create(req.body);
    res.status(201).json({
      success: true,
      data: result,
      message: "Category created successfully"
    });
  } catch (err) {
    res.status(400).json({ 
      success: false,
      message: err.message 
    });
  }
};

// Update category (Admin only)
exports.updateCategory = async (req, res) => {
  try {
    const result = await service.update(req.params.id, req.body);
    res.json({
      success: true,
      data: result,
      message: "Category updated successfully"
    });
  } catch (err) {
    res.status(400).json({ 
      success: false,
      message: err.message 
    });
  }
};

// Delete category (Admin only)
exports.deleteCategory = async (req, res) => {
  try {
    const result = await service.delete(req.params.id);
    res.json({
      success: true,
      data: result,
      message: "Category deleted successfully"
    });
  } catch (err) {
    res.status(400).json({ 
      success: false,
      message: err.message 
    });
  }
};
