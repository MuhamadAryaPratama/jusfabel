import express from "express";
import {
  createTransaction,
  createTransactionFromCart,
  getUserTransactions,
  getTransaction,
  getAllTransactions,
  updateTransactionStatus,
  deleteTransaction,
  getTransactionStats,
  uploadPaymentProof,
  getSalesReport, // Tambahkan ini
} from "../controllers/TransactionController.js";
import { protect } from "../middleware/auth.js";
import { adminProtect } from "../middleware/adminAuth.js";

const router = express.Router();

// User routes
router.post("/", protect, createTransaction);
router.post("/cart", protect, createTransactionFromCart);
router.post("/:id/payment-proof", protect, uploadPaymentProof);
router.get("/user", protect, getUserTransactions);
router.get("/:id", protect, getTransaction);

// Admin routes
router.get("/", adminProtect, getAllTransactions);
router.put("/:id/status", adminProtect, updateTransactionStatus);
router.delete("/:id", adminProtect, deleteTransaction);
router.get("/stats/overview", adminProtect, getTransactionStats);
router.get("/stats/sales-report", adminProtect, getSalesReport); // Tambahkan route untuk sales report

export default router;
