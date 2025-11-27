const express = require("express");
const router = express.Router();
const controller = require("../controllers/product");

// RESTful API routes
router.get("/", controller.getAllProducts);           // GET all products
router.get("/:id", controller.getProductById);        // GET product by ID
router.post("/", controller.createProduct);           // CREATE new product
router.put("/:id", controller.updateProduct);         // UPDATE product
router.delete("/:id", controller.deleteProduct);      // DELETE product

module.exports = router;
