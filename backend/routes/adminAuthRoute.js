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
} from "../controllers/admin/AuthController.js";
import { adminProtect } from "../middleware/adminAuth.js";

const router = express.Router();

// Public routes
router.post("/register", register);
router.post("/login", login);
router.post("/forgotpassword", forgotPassword);
router.put("/resetpassword/:resetcode", resetPassword);

// Protected routes
router.get("/logout", adminProtect, logout);
router.get("/me", adminProtect, getMe);
router.put("/updatedetails", adminProtect, updateDetails);
router.put("/updatepassword", adminProtect, updatePassword);

export default router;
