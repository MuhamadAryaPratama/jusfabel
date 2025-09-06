import { db } from "../server.js";

class Wishlist {
  constructor({
    id,
    user_id,
    product_id,
    created_at,
    updated_at,
    product_details,
  }) {
    this.id = id;
    this.user_id = user_id;
    this.product_id = product_id;
    this.created_at = created_at;
    this.updated_at = updated_at;
    this.product_details = product_details;
  }

  // Add product to wishlist
  static async add(user_id, product_id) {
    try {
      const [result] = await db.execute(
        "INSERT INTO wishlists (user_id, product_id) VALUES (?, ?)",
        [user_id, product_id]
      );

      return result.insertId;
    } catch (error) {
      // Handle duplicate entry error
      if (error.code === "ER_DUP_ENTRY") {
        throw new Error("Product already in wishlist");
      }
      throw error;
    }
  }

  // Remove product from wishlist
  static async remove(user_id, product_id) {
    try {
      const [result] = await db.execute(
        "DELETE FROM wishlists WHERE user_id = ? AND product_id = ?",
        [user_id, product_id]
      );

      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }

  // Get user's wishlist with product details
  static async findByUserId(user_id, { page = 1, limit = 10 } = {}) {
    try {
      const offset = (page - 1) * limit;

      const [items] = await db.execute(
        `SELECT w.*, 
                p.name as product_name, 
                p.price as product_price, 
                p.image as product_image,
                p.stock as product_stock,
                p.is_active as product_active,
                c.name as category_name
         FROM wishlists w
         JOIN products p ON w.product_id = p.id
         LEFT JOIN categories c ON p.category_id = c.id
         WHERE w.user_id = ? AND p.is_active = TRUE
         ORDER BY w.created_at DESC
         LIMIT ? OFFSET ?`,
        [user_id, limit, offset]
      );

      return items.map((item) => ({
        id: item.id,
        user_id: item.user_id,
        product_id: item.product_id,
        created_at: item.created_at,
        updated_at: item.updated_at,
        product_details: {
          name: item.product_name,
          price: item.product_price,
          image: item.product_image,
          stock: item.product_stock,
          is_active: item.product_active,
          category_name: item.category_name,
        },
      }));
    } catch (error) {
      throw error;
    }
  }

  // Check if product is in user's wishlist
  static async exists(user_id, product_id) {
    try {
      const [result] = await db.execute(
        "SELECT id FROM wishlists WHERE user_id = ? AND product_id = ?",
        [user_id, product_id]
      );

      return result.length > 0;
    } catch (error) {
      throw error;
    }
  }

  // Count user's wishlist items
  static async countByUserId(user_id) {
    try {
      const [result] = await db.execute(
        "SELECT COUNT(*) as total FROM wishlists WHERE user_id = ?",
        [user_id]
      );

      return result[0].total;
    } catch (error) {
      throw error;
    }
  }
}

export default Wishlist;
