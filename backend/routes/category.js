const express = require("express");
const router = express.Router();
const controller = require("../controllers/category");

// Public routes
router.get("/", controller.getAllCategories);           // GET all categories
router.get("/:id", controller.getCategoryById);         // GET category by ID

// Admin routes (TODO: add authentication middleware)
router.post("/", controller.createCategory);            // CREATE new category
router.put("/:id", controller.updateCategory);          // UPDATE category
router.delete("/:id", controller.deleteCategory);       // DELETE category

module.exports = router;
