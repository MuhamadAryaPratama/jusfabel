import express from "express";
import {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  updateProductStock,
  updateProductSizeStock,
} from "../controllers/ProductController.js";
import { adminProtect } from "../middleware/adminAuth.js";

const router = express.Router();

// Public routes
router.get("/", getProducts);
router.get("/:id", getProduct);

// Admin protected routes
router.post("/", adminProtect, createProduct);
router.put("/:id", adminProtect, updateProduct);
router.delete("/:id", adminProtect, deleteProduct);
router.patch("/:id/stock", adminProtect, updateProductStock);
router.patch("/:id/sizes/:sizeId/stock", adminProtect, updateProductSizeStock);

export default router;
