import { db } from "../server.js";
import Product from "./ProductModel.js";

class Rating {
  constructor({
    id,
    user_id,
    product_id,
    rating,
    review,
    created_at,
    full_name,
    email,
    product_name,
    has_description = false,
  }) {
    this.id = id;
    this.user_id = user_id;
    this.product_id = product_id;
    this.rating = rating;
    this.review = review;
    this.created_at = created_at;
    this.full_name = full_name;
    this.email = email;
    this.product_name = product_name;
    this.has_description =
      has_description || (review !== null && review !== "");
  }

  // Create a new rating for a product
  static async create({ user_id, product_id, rating, review }) {
    try {
      // Validasi rating
      if (rating < 1 || rating > 5) {
        throw new Error("Rating must be between 1 and 5");
      }

      // Check if product exists
      const [product] = await db.execute(
        "SELECT id FROM products WHERE id = ?",
        [product_id]
      );
      if (product.length === 0) {
        throw new Error("Product not found");
      }

      // Insert new rating (tanpa pemeriksaan duplikat)
      const [result] = await db.execute(
        "INSERT INTO ratings (user_id, product_id, rating, review) VALUES (?, ?, ?, ?)",
        [user_id, product_id, rating, review]
      );

      // Update product rating statistics
      await Product.updateRatingStats(product_id);

      // Get the newly created rating with user and product info
      const [newRating] = await db.execute(
        `SELECT r.*, u.full_name, u.email, p.name as product_name,
              CASE WHEN r.review IS NOT NULL AND r.review != '' THEN TRUE ELSE FALSE END as has_description
       FROM ratings r
       JOIN users u ON r.user_id = u.id
       JOIN products p ON r.product_id = p.id
       WHERE r.id = ?`,
        [result.insertId]
      );

      return new Rating(newRating[0]);
    } catch (error) {
      throw error;
    }
  }

  // Get all ratings for a specific product
  static async findByProductId(productId, { page = 1, limit = 10 } = {}) {
    try {
      const offset = (page - 1) * limit;

      const [ratings] = await db.execute(
        `SELECT r.id, r.user_id, r.product_id, r.rating, r.review, r.created_at, 
                u.full_name, u.email,
                CASE WHEN r.review IS NOT NULL AND r.review != '' THEN TRUE ELSE FALSE END as has_description
         FROM ratings r
         JOIN users u ON r.user_id = u.id
         WHERE r.product_id = ?
         ORDER BY r.created_at DESC
         LIMIT ? OFFSET ?`,
        [productId, limit, offset]
      );

      return ratings.map((rating) => new Rating(rating));
    } catch (error) {
      throw error;
    }
  }

  // Get all ratings (system-wide)
  static async findAll({ page = 1, limit = 10 } = {}) {
    try {
      const offset = (page - 1) * limit;

      const [ratings] = await db.execute(
        `SELECT r.id, r.user_id, r.product_id, r.rating, r.review, r.created_at, 
                u.full_name, u.email,
                p.name as product_name,
                CASE WHEN r.review IS NOT NULL AND r.review != '' THEN TRUE ELSE FALSE END as has_description
         FROM ratings r
         JOIN users u ON r.user_id = u.id
         JOIN products p ON r.product_id = p.id
         ORDER BY r.created_at DESC
         LIMIT ? OFFSET ?`,
        [limit, offset]
      );

      return ratings.map((rating) => new Rating(rating));
    } catch (error) {
      throw error;
    }
  }

  // Get average rating for a specific product
  static async getAverageRatingByProduct(productId) {
    try {
      const [result] = await db.execute(
        `SELECT 
          COALESCE(AVG(rating), 0) as average,
          COALESCE(COUNT(*), 0) as count 
         FROM ratings 
         WHERE product_id = ?`,
        [productId]
      );

      return {
        average: parseFloat(result[0].average) || 0,
        count: result[0].count || 0,
      };
    } catch (error) {
      throw error;
    }
  }

  // Get system-wide average rating
  static async getAverageRating() {
    try {
      const [result] = await db.execute(
        "SELECT COALESCE(AVG(rating), 0) as average, COALESCE(COUNT(*), 0) as count FROM ratings"
      );

      return {
        average: parseFloat(result[0].average) || 0,
        count: result[0].count || 0,
      };
    } catch (error) {
      throw error;
    }
  }

  // Find ratings by user ID
  static async findByUserId(user_id, { page = 1, limit = 10 } = {}) {
    try {
      const offset = (page - 1) * limit;

      const [ratings] = await db.execute(
        `SELECT r.id, r.user_id, r.product_id, r.rating, r.review, r.created_at, 
                u.full_name, u.email,
                p.name as product_name, p.image as product_image,
                CASE WHEN r.review IS NOT NULL AND r.review != '' THEN TRUE ELSE FALSE END as has_description
         FROM ratings r
         JOIN users u ON r.user_id = u.id
         JOIN products p ON r.product_id = p.id
         WHERE r.user_id = ?
         ORDER BY r.created_at DESC
         LIMIT ? OFFSET ?`,
        [user_id, limit, offset]
      );

      return ratings.map((rating) => new Rating(rating));
    } catch (error) {
      throw error;
    }
  }

  // Update a rating
  static async update(id, { rating, review }) {
    try {
      if (rating < 1 || rating > 5) {
        throw new Error("Rating must be between 1 and 5");
      }

      // Get the product_id before updating
      const [currentRating] = await db.execute(
        "SELECT product_id FROM ratings WHERE id = ?",
        [id]
      );

      if (currentRating.length === 0) {
        throw new Error("Rating not found");
      }

      const product_id = currentRating[0].product_id;

      // Update rating
      await db.execute(
        "UPDATE ratings SET rating = ?, review = ? WHERE id = ?",
        [rating, review, id]
      );

      // Update product rating statistics
      await Product.updateRatingStats(product_id);

      // Get updated rating
      const [updatedRating] = await db.execute(
        `SELECT r.*, u.full_name, u.email, p.name as product_name,
                CASE WHEN r.review IS NOT NULL AND r.review != '' THEN TRUE ELSE FALSE END as has_description
         FROM ratings r
         JOIN users u ON r.user_id = u.id
         JOIN products p ON r.product_id = p.id
         WHERE r.id = ?`,
        [id]
      );

      return new Rating(updatedRating[0]);
    } catch (error) {
      throw error;
    }
  }

  // Delete a rating
  static async delete(id) {
    try {
      // Get the product_id before deleting
      const [currentRating] = await db.execute(
        "SELECT product_id FROM ratings WHERE id = ?",
        [id]
      );

      if (currentRating.length === 0) {
        throw new Error("Rating not found");
      }

      const product_id = currentRating[0].product_id;

      // Delete rating
      const [result] = await db.execute("DELETE FROM ratings WHERE id = ?", [
        id,
      ]);

      if (result.affectedRows > 0) {
        // Update product rating statistics
        await Product.updateRatingStats(product_id);
      }

      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }

  // Get rating by ID
  static async findById(id) {
    try {
      const [ratings] = await db.execute(
        `SELECT r.*, u.full_name, u.email,
                CASE WHEN r.review IS NOT NULL AND r.review != '' THEN TRUE ELSE FALSE END as has_description
         FROM ratings r
         JOIN users u ON r.user_id = u.id
         WHERE r.id = ?`,
        [id]
      );

      if (ratings.length === 0) return null;

      return new Rating(ratings[0]);
    } catch (error) {
      throw error;
    }
  }

  // Check if user has rated a product and get latest rating
  static async hasUserRatedProduct(user_id, product_id) {
    try {
      const [result] = await db.execute(
        `SELECT r.* 
         FROM ratings r 
         WHERE r.user_id = ? AND r.product_id = ? 
         ORDER BY r.created_at DESC 
         LIMIT 1`,
        [user_id, product_id]
      );

      return {
        hasRated: result.length > 0,
        latestRating: result.length > 0 ? new Rating(result[0]) : null,
      };
    } catch (error) {
      throw error;
    }
  }

  // Count ratings for a product
  static async countByProductId(productId) {
    try {
      const [result] = await db.execute(
        "SELECT COUNT(*) as total FROM ratings WHERE product_id = ?",
        [productId]
      );
      return result[0].total;
    } catch (error) {
      throw error;
    }
  }

  // Get reviews with descriptions for a product
  static async getReviewsWithDescription(
    productId,
    { page = 1, limit = 10 } = {}
  ) {
    try {
      const offset = (page - 1) * limit;

      const [reviews] = await db.execute(
        `SELECT r.id, r.user_id, r.product_id, r.rating, r.review, r.created_at, 
                u.full_name, u.email,
                CASE WHEN r.review IS NOT NULL AND r.review != '' THEN TRUE ELSE FALSE END as has_description
         FROM ratings r
         JOIN users u ON r.user_id = u.id
         WHERE r.product_id = ? AND r.review IS NOT NULL AND r.review != ''
         ORDER BY r.created_at DESC
         LIMIT ? OFFSET ?`,
        [productId, limit, offset]
      );

      return reviews.map((review) => new Rating(review));
    } catch (error) {
      throw error;
    }
  }

  // Count reviews with descriptions for a product
  static async countReviewsWithDescription(productId) {
    try {
      const [result] = await db.execute(
        "SELECT COUNT(*) as total FROM ratings WHERE product_id = ? AND review IS NOT NULL AND review != ''",
        [productId]
      );
      return result[0].total;
    } catch (error) {
      throw error;
    }
  }

  // Count ratings by user ID
  static async countByUserId(user_id) {
    try {
      const [result] = await db.execute(
        "SELECT COUNT(*) as total FROM ratings WHERE user_id = ?",
        [user_id]
      );
      return result[0].total;
    } catch (error) {
      throw error;
    }
  }

  // Get user's latest rating for a product
  static async getUserLatestRating(user_id, product_id) {
    try {
      const [ratings] = await db.execute(
        `SELECT r.*, u.full_name, u.email,
              CASE WHEN r.review IS NOT NULL AND r.review != '' THEN TRUE ELSE FALSE END as has_description
       FROM ratings r
       JOIN users u ON r.user_id = u.id
       WHERE r.user_id = ? AND r.product_id = ?
       ORDER BY r.created_at DESC
       LIMIT 1`,
        [user_id, product_id]
      );

      if (ratings.length === 0) return null;

      return new Rating(ratings[0]);
    } catch (error) {
      throw error;
    }
  }

  // Get all user ratings for a specific product
  static async getUserRatingsForProduct(
    user_id,
    product_id,
    { page = 1, limit = 10 } = {}
  ) {
    try {
      const offset = (page - 1) * limit;

      const [ratings] = await db.execute(
        `SELECT r.id, r.user_id, r.product_id, r.rating, r.review, r.created_at, 
              u.full_name, u.email,
              CASE WHEN r.review IS NOT NULL AND r.review != '' THEN TRUE ELSE FALSE END as has_description
       FROM ratings r
       JOIN users u ON r.user_id = u.id
       WHERE r.user_id = ? AND r.product_id = ?
       ORDER BY r.created_at DESC
       LIMIT ? OFFSET ?`,
        [user_id, product_id, limit, offset]
      );

      return ratings.map((rating) => new Rating(rating));
    } catch (error) {
      throw error;
    }
  }
}

export default Rating;
