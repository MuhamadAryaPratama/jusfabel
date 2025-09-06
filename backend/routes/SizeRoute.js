import express from "express";
import {
  getSizes,
  getSize,
  createSize,
  updateSize,
  deleteSize,
  getProductsBySize,
} from "../controllers/SizeController.js";
import { adminProtect } from "../middleware/adminAuth.js";

const router = express.Router();

// Public routes
router.get("/", getSizes);
router.get("/:id", getSize);
router.get("/:id/products", getProductsBySize);

// Admin protected routes
router.post("/", adminProtect, createSize);
router.put("/:id", adminProtect, updateSize);
router.delete("/:id", adminProtect, deleteSize);

export default router;
