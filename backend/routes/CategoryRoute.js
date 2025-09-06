import express from "express";
import {
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../controllers/CategoryController.js";
import { getProductsByCategory } from "../controllers/ProductController.js";
import { adminProtect } from "../middleware/adminAuth.js";

const router = express.Router();

// Public routes
router.get("/", getCategories);
router.get("/:id", getCategory);
router.get("/:id/products", getProductsByCategory);

// Admin protected routes
router.post("/", adminProtect, createCategory);
router.put("/:id", adminProtect, updateCategory);
router.delete("/:id", adminProtect, deleteCategory);

export default router;
