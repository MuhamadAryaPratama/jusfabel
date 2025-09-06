import express from "express";
import {
  createRating,
  getAllRatings,
  updateRating,
  deleteRating,
  getMyRatings,
  getProductRatings,
  checkUserRating,
  getProductReviews,
  getUserLatestRating,
  getUserRatingsForProduct,
} from "../controllers/RatingController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// Rating management routes
router.post("/", protect, createRating);
router.get("/", getAllRatings);
router.put("/:id", protect, updateRating);
router.delete("/:id", protect, deleteRating);
router.get("/me", protect, getMyRatings);

// Product rating routes
router.get("/products/:id/ratings", getProductRatings);
router.get("/products/:id/reviews", getProductReviews);
router.get("/products/:id/rating/check", protect, checkUserRating);
router.get("/products/:id/rating/latest", protect, getUserLatestRating);
router.get("/products/:id/ratings/me", protect, getUserRatingsForProduct);

export default router;
