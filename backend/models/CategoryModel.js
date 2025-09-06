import { db } from "../server.js";

class Category {
  constructor({
    id,
    name,
    description,
    image,
    is_active,
    created_at,
    updated_at,
    product_count = 0,
  }) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.image = image;
    this.is_active = is_active;
    this.created_at = created_at;
    this.updated_at = updated_at;
    this.product_count = product_count;
  }

  // Create category
  static async create({ name, description, image }) {
    try {
      const [result] = await db.execute(
        "INSERT INTO categories (name, description, image) VALUES (?, ?, ?)",
        [name, description, image]
      );

      const [category] = await db.execute(
        "SELECT c.*, COUNT(p.id) as product_count FROM categories c LEFT JOIN products p ON c.id = p.category_id WHERE c.id = ? GROUP BY c.id",
        [result.insertId]
      );
      return new Category(category[0]);
    } catch (error) {
      throw error;
    }
  }

  // Find all categories
  static async findAll({
    page = 1,
    limit = 10,
    search = "",
    activeOnly = true,
  } = {}) {
    try {
      const offset = (page - 1) * limit;
      let query = `
        SELECT c.*, 
               COUNT(p.id) as product_count 
        FROM categories c 
        LEFT JOIN products p ON c.id = p.category_id 
      `;
      let params = [];
      let conditions = [];

      if (search) {
        conditions.push("(c.name LIKE ? OR c.description LIKE ?)");
        params.push(`%${search}%`, `%${search}%`);
      }

      if (activeOnly) {
        conditions.push("c.is_active = TRUE");
      }

      if (conditions.length > 0) {
        query += " WHERE " + conditions.join(" AND ");
      }

      query += " GROUP BY c.id ORDER BY c.created_at DESC LIMIT ? OFFSET ?";
      params.push(limit, offset);

      const [categories] = await db.execute(query, params);
      return categories.map((cat) => new Category(cat));
    } catch (error) {
      throw error;
    }
  }

  // Find category by ID
  static async findById(id) {
    try {
      const [categories] = await db.execute(
        "SELECT c.*, COUNT(p.id) as product_count FROM categories c LEFT JOIN products p ON c.id = p.category_id WHERE c.id = ? GROUP BY c.id",
        [id]
      );
      if (categories.length === 0) return null;
      return new Category(categories[0]);
    } catch (error) {
      throw error;
    }
  }

  // Find category by name
  static async findByName(name) {
    try {
      const [categories] = await db.execute(
        "SELECT c.*, COUNT(p.id) as product_count FROM categories c LEFT JOIN products p ON c.id = p.category_id WHERE c.name = ? GROUP BY c.id",
        [name]
      );
      if (categories.length === 0) return null;
      return new Category(categories[0]);
    } catch (error) {
      throw error;
    }
  }

  // Update category
  static async update(id, data) {
    try {
      const fields = [];
      const values = [];

      for (const [key, value] of Object.entries(data)) {
        if (value !== undefined) {
          fields.push(`${key} = ?`);
          values.push(value);
        }
      }

      if (fields.length === 0) {
        throw new Error("No fields to update");
      }

      values.push(id);

      await db.execute(
        `UPDATE categories SET ${fields.join(", ")} WHERE id = ?`,
        values
      );

      const [category] = await db.execute(
        "SELECT c.*, COUNT(p.id) as product_count FROM categories c LEFT JOIN products p ON c.id = p.category_id WHERE c.id = ? GROUP BY c.id",
        [id]
      );
      return new Category(category[0]);
    } catch (error) {
      throw error;
    }
  }

  // Delete category
  static async delete(id) {
    try {
      const [result] = await db.execute("DELETE FROM categories WHERE id = ?", [
        id,
      ]);
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }

  // Count total categories
  static async count(search = "", activeOnly = true) {
    try {
      let query = `
        SELECT COUNT(DISTINCT c.id) as total 
        FROM categories c 
        LEFT JOIN products p ON c.id = p.category_id 
      `;
      let params = [];
      let conditions = [];

      if (search) {
        conditions.push("(c.name LIKE ? OR c.description LIKE ?)");
        params.push(`%${search}%`, `%${search}%`);
      }

      if (activeOnly) {
        conditions.push("c.is_active = TRUE");
      }

      if (conditions.length > 0) {
        query += " WHERE " + conditions.join(" AND ");
      }

      const [result] = await db.execute(query, params);
      return result[0].total;
    } catch (error) {
      throw error;
    }
  }
}

export default Category;
