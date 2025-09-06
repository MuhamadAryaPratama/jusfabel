import { db } from "../server.js";

class ShoppingCart {
  constructor({
    id,
    user_id,
    product_id,
    quantity,
    created_at,
    updated_at,
    product_details,
  }) {
    this.id = id;
    this.user_id = user_id;
    this.product_id = product_id;
    this.quantity = quantity;
    this.created_at = created_at;
    this.updated_at = updated_at;
    this.product_details = product_details;
  }

  // Add product to cart or update quantity
  static async addOrUpdate(user_id, product_id, quantity = 1) {
    try {
      // Check if product exists and is active
      const [product] = await db.execute(
        "SELECT id, stock, is_active FROM products WHERE id = ? AND is_active = TRUE",
        [product_id]
      );

      if (product.length === 0) {
        throw new Error("Product not found or not available");
      }

      if (product[0].stock < quantity) {
        throw new Error("Insufficient stock");
      }

      // Check if item already exists in cart
      const [existing] = await db.execute(
        "SELECT id, quantity FROM shopping_carts WHERE user_id = ? AND product_id = ?",
        [user_id, product_id]
      );

      if (existing.length > 0) {
        const newQuantity = existing[0].quantity + quantity;
        if (newQuantity > product[0].stock) {
          throw new Error("Insufficient stock for the requested quantity");
        }

        await db.execute(
          "UPDATE shopping_carts SET quantity = ? WHERE id = ?",
          [newQuantity, existing[0].id]
        );

        return { action: "updated", quantity: newQuantity };
      } else {
        await db.execute(
          "INSERT INTO shopping_carts (user_id, product_id, quantity) VALUES (?, ?, ?)",
          [user_id, product_id, quantity]
        );

        return { action: "added", quantity };
      }
    } catch (error) {
      throw error;
    }
  }

  // Update cart item quantity
  static async updateQuantity(user_id, product_id, quantity) {
    try {
      if (quantity <= 0) {
        // Remove item if quantity is 0 or negative
        await this.remove(user_id, product_id);
        return { action: "removed" };
      }

      // Check product stock
      const [product] = await db.execute(
        "SELECT stock FROM products WHERE id = ? AND is_active = TRUE",
        [product_id]
      );

      if (product.length === 0) {
        throw new Error("Product not found or not available");
      }

      if (quantity > product[0].stock) {
        throw new Error("Insufficient stock");
      }

      const [result] = await db.execute(
        "UPDATE shopping_carts SET quantity = ? WHERE user_id = ? AND product_id = ?",
        [quantity, user_id, product_id]
      );

      if (result.affectedRows === 0) {
        throw new Error("Cart item not found");
      }

      return { action: "updated", quantity };
    } catch (error) {
      throw error;
    }
  }

  // Remove product from cart
  static async remove(user_id, product_id) {
    try {
      const [result] = await db.execute(
        "DELETE FROM shopping_carts WHERE user_id = ? AND product_id = ?",
        [user_id, product_id]
      );

      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }

  // Clear user's cart
  static async clear(user_id) {
    try {
      const [result] = await db.execute(
        "DELETE FROM shopping_carts WHERE user_id = ?",
        [user_id]
      );

      return result.affectedRows;
    } catch (error) {
      throw error;
    }
  }

  // Get user's cart with product details
  static async findByUserId(user_id) {
    try {
      const [items] = await db.execute(
        `SELECT sc.*, 
                p.name as product_name, 
                p.price as product_price, 
                p.image as product_image,
                p.stock as product_stock,
                p.is_active as product_active,
                c.name as category_name
         FROM shopping_carts sc
         JOIN products p ON sc.product_id = p.id
         LEFT JOIN categories c ON p.category_id = c.id
         WHERE sc.user_id = ? AND p.is_active = TRUE
         ORDER BY sc.created_at DESC`,
        [user_id]
      );

      return items.map((item) => ({
        id: item.id,
        user_id: item.user_id,
        product_id: item.product_id,
        quantity: item.quantity,
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

  // Get cart total and item count
  static async getCartSummary(user_id) {
    try {
      const [result] = await db.execute(
        `SELECT 
           COUNT(*) as item_count,
           SUM(sc.quantity) as total_quantity,
           SUM(sc.quantity * p.price) as total_price
         FROM shopping_carts sc
         JOIN products p ON sc.product_id = p.id
         WHERE sc.user_id = ? AND p.is_active = TRUE`,
        [user_id]
      );

      return {
        item_count: result[0].item_count || 0,
        total_quantity: result[0].total_quantity || 0,
        total_price: result[0].total_price || 0,
      };
    } catch (error) {
      throw error;
    }
  }

  // Check if product is in user's cart
  static async exists(user_id, product_id) {
    try {
      const [result] = await db.execute(
        "SELECT id, quantity FROM shopping_carts WHERE user_id = ? AND product_id = ?",
        [user_id, product_id]
      );

      return result.length > 0 ? result[0] : null;
    } catch (error) {
      throw error;
    }
  }
}

export default ShoppingCart;
