import { db } from "../server.js";

class Product {
  constructor({
    id,
    category_id,
    name,
    description,
    price,
    image,
    stock,
    is_active,
    created_at,
    updated_at,
    category_name,
    sizes = [],
    average_rating = 0,
    total_ratings = 0,
    total_reviews = 0,
  }) {
    this.id = id;
    this.category_id = category_id;
    this.name = name;
    this.description = description;
    this.price = price;
    this.image = image;
    this.stock = stock;
    this.is_active = is_active;
    this.created_at = created_at;
    this.updated_at = updated_at;
    this.category_name = category_name;
    this.sizes = sizes;
    this.average_rating = average_rating;
    this.total_ratings = total_ratings;
    this.total_reviews = total_reviews;
  }

  // Add this method to the Product class in ProductModel.js
  static async create(productData) {
    try {
      const {
        category_id,
        name,
        description,
        price,
        image,
        stock,
        sizes = [],
      } = productData;

      // Insert the main product
      const [result] = await db.execute(
        `INSERT INTO products (category_id, name, description, price, image, stock) 
       VALUES (?, ?, ?, ?, ?, ?)`,
        [category_id, name, description, price, image, stock || 0]
      );

      const productId = result.insertId;

      // Insert sizes if provided
      if (sizes.length > 0) {
        for (const size of sizes) {
          await db.execute(
            `INSERT INTO product_sizes (product_id, size_id, additional_price, stock) 
           VALUES (?, ?, ?, ?)`,
            [
              productId,
              size.size_id,
              size.additional_price || 0,
              size.stock || 0,
            ]
          );
        }
      }

      // Return the created product with all details
      return await this.findById(productId);
    } catch (error) {
      console.error("Error creating product:", error);
      throw error;
    }
  }

  // Get rating statistics for a product
  static async getProductRatingStats(productId) {
    try {
      const [result] = await db.execute(
        `SELECT 
          COALESCE(AVG(rating), 0) as average_rating,
          COALESCE(COUNT(*), 0) as total_ratings
         FROM ratings 
         WHERE product_id = ?`,
        [productId]
      );

      return {
        average_rating: parseFloat(result[0].average_rating) || 0,
        total_ratings: result[0].total_ratings || 0,
      };
    } catch (error) {
      console.error("Error getting rating stats:", error);
      return {
        average_rating: 0,
        total_ratings: 0,
      };
    }
  }

  // Get review statistics for a product
  static async getProductReviewStats(productId) {
    try {
      const [result] = await db.execute(
        `SELECT 
          COALESCE(COUNT(CASE WHEN review IS NOT NULL AND review != '' THEN 1 END), 0) as total_reviews
         FROM ratings 
         WHERE product_id = ?`,
        [productId]
      );

      return {
        total_reviews: result[0].total_reviews || 0,
      };
    } catch (error) {
      console.error("Error getting review stats:", error);
      return {
        total_reviews: 0,
      };
    }
  }

  // Update product rating stats
  static async updateRatingStats(productId) {
    try {
      const ratingStats = await this.getProductRatingStats(productId);
      const reviewStats = await this.getProductReviewStats(productId);

      await db.execute(
        "UPDATE products SET average_rating = ?, total_ratings = ?, total_reviews = ? WHERE id = ?",
        [
          ratingStats.average_rating,
          ratingStats.total_ratings,
          reviewStats.total_reviews,
          productId,
        ]
      );

      return { ...ratingStats, ...reviewStats };
    } catch (error) {
      console.error("Error updating rating stats:", error);
      throw error;
    }
  }

  // Find all products with category info, sizes, and rating stats
  static async findAll({
    page = 1,
    limit = 10,
    search = "",
    category_id = null,
    activeOnly = true,
    minPrice = null,
    maxPrice = null,
  } = {}) {
    try {
      const offset = (page - 1) * limit;
      let query = `
        SELECT p.*, c.name as category_name 
        FROM products p 
        LEFT JOIN categories c ON p.category_id = c.id
      `;

      let params = [];
      let conditions = [];

      if (search) {
        conditions.push("(p.name LIKE ? OR p.description LIKE ?)");
        params.push(`%${search}%`, `%${search}%`);
      }

      if (category_id) {
        conditions.push("p.category_id = ?");
        params.push(category_id);
      }

      if (minPrice !== null) {
        conditions.push("p.price >= ?");
        params.push(minPrice);
      }

      if (maxPrice !== null) {
        conditions.push("p.price <= ?");
        params.push(maxPrice);
      }

      if (activeOnly) {
        conditions.push("p.is_active = TRUE");
        conditions.push("c.is_active = TRUE");
      }

      if (conditions.length > 0) {
        query += " WHERE " + conditions.join(" AND ");
      }

      query += " ORDER BY p.created_at DESC LIMIT ? OFFSET ?";
      params.push(limit, offset);

      const [products] = await db.execute(query, params);

      const productsWithSizesAndRatings = await Promise.all(
        products.map(async (prod) => {
          const sizes = await this.getProductSizes(prod.id);
          const ratingStats = await this.getProductRatingStats(prod.id);
          const reviewStats = await this.getProductReviewStats(prod.id);
          return new Product({
            ...prod,
            sizes,
            ...ratingStats,
            ...reviewStats,
          });
        })
      );

      return productsWithSizesAndRatings;
    } catch (error) {
      throw error;
    }
  }

  // Find product by ID with sizes and rating stats
  static async findById(id) {
    try {
      const [products] = await db.execute(
        `SELECT p.*, c.name as category_name 
         FROM products p 
         LEFT JOIN categories c ON p.category_id = c.id 
         WHERE p.id = ?`,
        [id]
      );

      if (products.length === 0) return null;

      const sizes = await this.getProductSizes(id);
      const ratingStats = await this.getProductRatingStats(id);
      const reviewStats = await this.getProductReviewStats(id);

      return new Product({
        ...products[0],
        sizes,
        ...ratingStats,
        ...reviewStats,
      });
    } catch (error) {
      throw error;
    }
  }

  // Get sizes for a product
  static async getProductSizes(productId) {
    try {
      const [sizes] = await db.execute(
        `SELECT ps.*, s.name, s.description, s.unit
       FROM product_sizes ps
       JOIN sizes s ON ps.size_id = s.id
       WHERE ps.product_id = ? AND ps.is_active = TRUE
       ORDER BY s.name`,
        [productId]
      );
      return sizes;
    } catch (error) {
      throw error;
    }
  }

  // Find products by category with sizes and rating stats
  static async findByCategory(
    category_id,
    { page = 1, limit = 10, activeOnly = true } = {}
  ) {
    try {
      const offset = (page - 1) * limit;
      let query = `
      SELECT p.*, c.name as category_name 
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id 
      WHERE p.category_id = ?
    `;

      let params = [category_id];

      if (activeOnly) {
        query += " AND p.is_active = TRUE AND c.is_active = TRUE";
      }

      query += " ORDER BY p.created_at DESC LIMIT ? OFFSET ?";
      params.push(limit, offset);

      const [products] = await db.execute(query, params);

      const productsWithSizesAndRatings = await Promise.all(
        products.map(async (prod) => {
          const sizes = await this.getProductSizes(prod.id);
          const ratingStats = await this.getProductRatingStats(prod.id);
          const reviewStats = await this.getProductReviewStats(prod.id);
          return new Product({
            ...prod,
            sizes,
            ...ratingStats,
            ...reviewStats,
          });
        })
      );

      return productsWithSizesAndRatings;
    } catch (error) {
      console.error("Error in findByCategory:", error);
      throw error;
    }
  }

  // Update product with sizes
  static async update(id, data) {
    try {
      // First update the basic product info
      const allowedFields = [
        "category_id",
        "name",
        "description",
        "price",
        "image",
        "stock",
        "is_active",
      ];
      const updateFields = {};

      for (const [key, value] of Object.entries(data)) {
        if (allowedFields.includes(key) && value !== undefined) {
          updateFields[key] = value;
        }
      }

      if (Object.keys(updateFields).length > 0) {
        const fields = Object.keys(updateFields).map((field) => `${field} = ?`);
        const values = Object.values(updateFields);
        values.push(id);

        await db.execute(
          `UPDATE products SET ${fields.join(", ")} WHERE id = ?`,
          values
        );
      }

      // Then handle sizes if provided
      if (data.sizes !== undefined) {
        await this.updateProductSizes(id, data.sizes);
      }

      const product = await this.findById(id);
      return product;
    } catch (error) {
      console.error("Error in update method:", error);
      throw error;
    }
  }

  // Helper method to update product sizes
  static async updateProductSizes(productId, sizes) {
    try {
      // Deactivate all existing sizes
      await db.execute(
        "UPDATE product_sizes SET is_active = FALSE WHERE product_id = ?",
        [productId]
      );

      if (sizes && sizes.length > 0) {
        for (const size of sizes) {
          const [existing] = await db.execute(
            "SELECT id FROM product_sizes WHERE product_id = ? AND size_id = ?",
            [productId, size.size_id]
          );

          if (existing.length > 0) {
            await db.execute(
              "UPDATE product_sizes SET additional_price = ?, stock = ?, is_active = TRUE WHERE product_id = ? AND size_id = ?",
              [
                size.additional_price || 0,
                size.stock || 0,
                productId,
                size.size_id,
              ]
            );
          } else {
            await db.execute(
              "INSERT INTO product_sizes (product_id, size_id, additional_price, stock) VALUES (?, ?, ?, ?)",
              [
                productId,
                size.size_id,
                size.additional_price || 0,
                size.stock || 0,
              ]
            );
          }
        }
      }
    } catch (error) {
      console.error("Error updating product sizes:", error);
      throw error;
    }
  }

  // Delete product
  static async delete(id) {
    try {
      const [result] = await db.execute("DELETE FROM products WHERE id = ?", [
        id,
      ]);
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }

  // Update stock
  static async updateStock(id, newStock) {
    try {
      await db.execute("UPDATE products SET stock = ? WHERE id = ?", [
        newStock,
        id,
      ]);
    } catch (error) {
      throw error;
    }
  }

  // Update size stock
  static async updateSizeStock(productId, sizeId, newStock) {
    try {
      await db.execute(
        "UPDATE product_sizes SET stock = ? WHERE product_id = ? AND size_id = ?",
        [newStock, productId, sizeId]
      );
    } catch (error) {
      throw error;
    }
  }

  // Count total products
  static async count({
    search = "",
    category_id = null,
    activeOnly = true,
  } = {}) {
    try {
      let query = "SELECT COUNT(*) as total FROM products p";
      let params = [];
      let conditions = [];

      if (search) {
        conditions.push("(p.name LIKE ? OR p.description LIKE ?)");
        params.push(`%${search}%`, `%${search}%`);
      }

      if (category_id !== null && category_id !== undefined) {
        conditions.push("p.category_id = ?");
        params.push(category_id);
      }

      if (activeOnly) {
        conditions.push("p.is_active = TRUE");
      }

      if (conditions.length > 0) {
        query += " WHERE " + conditions.join(" AND ");
      }

      const [result] = await db.execute(query, params);
      return result[0].total;
    } catch (error) {
      console.error("Error in count method:", error);
      throw error;
    }
  }
}

export default Product;
