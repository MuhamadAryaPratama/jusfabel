import express from "express";
import {
  register,
  login,
  logout,
  getMe,
  updateDetails,
  updatePassword,
  forgotPassword,
  resetPassword,
  getAllUsers,
  getUserById,
  deleteUser,
  createUserByAdmin, // Import fungsi baru
} from "../controllers/AuthController.js";
import { protect } from "../middleware/auth.js";
import { adminProtect } from "../middleware/adminAuth.js";

const router = express.Router();

// Public routes
router.post("/register", register);
router.post("/login", login);
router.post("/forgotpassword", forgotPassword);
router.put("/resetpassword/:resetcode", resetPassword);

// Protected routes
router.get("/logout", protect, logout);
router.get("/me", protect, getMe);
router.put("/updatedetails", protect, updateDetails);
router.put("/updatepassword", protect, updatePassword);

// User management routes (protected)
router.get("/users", adminProtect, getAllUsers);
router.get("/user/:id", protect, getUserById);
router.delete("/user/:id", protect, deleteUser);
router.post("/admin/create-user", adminProtect, createUserByAdmin); // Route baru

export default router;
