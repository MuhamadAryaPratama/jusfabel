import { db } from "../server.js";

class Size {
  constructor({ id, name, description, unit, created_at, updated_at }) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.unit = unit;
    this.created_at = created_at;
    this.updated_at = updated_at;
  }

  // Get all sizes
  static async findAll() {
    try {
      const [sizes] = await db.execute("SELECT * FROM sizes ORDER BY name");
      return sizes.map((size) => new Size(size));
    } catch (error) {
      throw error;
    }
  }

  // Find size by ID
  static async findById(id) {
    try {
      const [sizes] = await db.execute("SELECT * FROM sizes WHERE id = ?", [
        id,
      ]);

      if (sizes.length === 0) return null;

      return new Size(sizes[0]);
    } catch (error) {
      throw error;
    }
  }

  // Create new size
  static async create({ name, description, unit }) {
    try {
      const [result] = await db.execute(
        "INSERT INTO sizes (name, description, unit) VALUES (?, ?, ?)",
        [name, description || null, unit]
      );

      const [newSize] = await db.execute("SELECT * FROM sizes WHERE id = ?", [
        result.insertId,
      ]);
      return new Size(newSize[0]);
    } catch (error) {
      throw error;
    }
  }

  // Update size
  static async update(id, { name, description, unit }) {
    try {
      const updateFields = [];
      const updateValues = [];

      if (name !== undefined) {
        updateFields.push("name = ?");
        updateValues.push(name);
      }

      if (description !== undefined) {
        updateFields.push("description = ?");
        updateValues.push(description);
      }

      if (unit !== undefined) {
        updateFields.push("unit = ?");
        updateValues.push(unit);
      }

      if (updateFields.length === 0) {
        throw new Error("No fields to update");
      }

      updateValues.push(id);

      await db.execute(
        `UPDATE sizes SET ${updateFields.join(", ")}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        updateValues
      );

      const [updatedSize] = await db.execute(
        "SELECT * FROM sizes WHERE id = ?",
        [id]
      );
      return new Size(updatedSize[0]);
    } catch (error) {
      throw error;
    }
  }

  // Delete size
  static async delete(id) {
    try {
      const [result] = await db.execute("DELETE FROM sizes WHERE id = ?", [id]);
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }

  // Check if size is used in any active products
  static async isUsedInProducts(id) {
    try {
      const [result] = await db.execute(
        "SELECT COUNT(*) as count FROM product_sizes WHERE size_id = ? AND is_active = TRUE",
        [id]
      );
      return result[0].count > 0;
    } catch (error) {
      throw error;
    }
  }

  // Get products using a specific size
  static async getProductsBySize(id, { page = 1, limit = 10 } = {}) {
    try {
      const offset = (page - 1) * limit;

      const [products] = await db.execute(
        `SELECT p.*, c.name as category_name, ps.additional_price, ps.stock as size_stock
         FROM products p
         JOIN product_sizes ps ON p.id = ps.product_id
         LEFT JOIN categories c ON p.category_id = c.id
         WHERE ps.size_id = ? AND ps.is_active = TRUE AND p.is_active = TRUE
         ORDER BY p.name
         LIMIT ? OFFSET ?`,
        [id, limit, offset]
      );

      const [totalCount] = await db.execute(
        `SELECT COUNT(*) as total
         FROM products p
         JOIN product_sizes ps ON p.id = ps.product_id
         WHERE ps.size_id = ? AND ps.is_active = TRUE AND p.is_active = TRUE`,
        [id]
      );

      return {
        products,
        total: totalCount[0].total,
      };
    } catch (error) {
      throw error;
    }
  }
}

export default Size;
