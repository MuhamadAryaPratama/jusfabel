import { db } from "../server.js";

class Transaksi {
  constructor({
    id,
    user_id,
    customer_name,
    customer_email,
    customer_phone,
    customer_address,
    notes,
    total_items,
    total_quantity,
    total_price,
    status,
    payment_proof,
    created_at,
    updated_at,
  }) {
    this.id = id;
    this.user_id = user_id;
    this.customer_name = customer_name;
    this.customer_email = customer_email;
    this.customer_phone = customer_phone;
    this.customer_address = customer_address;
    this.notes = notes;
    this.total_items = total_items;
    this.total_quantity = total_quantity;
    this.total_price = total_price;
    this.status = status;
    this.payment_proof = payment_proof;
    this.created_at = created_at;
    this.updated_at = updated_at;
  }

  // Create new transaction
  static async create(transactionData) {
    try {
      const {
        user_id,
        customer_name,
        customer_email,
        customer_phone,
        customer_address,
        notes,
        total_items,
        total_quantity,
        total_price,
        payment_proof = null,
        status = "menunggu pembayaran",
      } = transactionData;

      const [result] = await db.execute(
        `INSERT INTO transactions 
         (user_id, customer_name, customer_email, customer_phone, customer_address, 
          notes, total_items, total_quantity, total_price, payment_proof, status) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          user_id,
          customer_name,
          customer_email,
          customer_phone,
          customer_address,
          notes,
          total_items,
          total_quantity,
          total_price,
          payment_proof,
          status,
        ]
      );

      return result.insertId;
    } catch (error) {
      throw error;
    }
  }

  // Create transaction items
  static async createItems(transactionId, items) {
    try {
      for (const item of items) {
        await db.execute(
          `INSERT INTO transaction_items 
           (transaction_id, product_id, product_name, quantity, price_per_unit, total_price) 
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            transactionId,
            item.product_id,
            item.product_name,
            item.quantity,
            item.price_per_unit,
            item.total_price,
          ]
        );
      }
    } catch (error) {
      throw error;
    }
  }

  // Find transaction by ID with items
  static async findById(id) {
    try {
      const [transactions] = await db.execute(
        "SELECT * FROM transactions WHERE id = ?",
        [id]
      );

      if (transactions.length === 0) return null;

      const [items] = await db.execute(
        `SELECT ti.*, p.image as product_image 
         FROM transaction_items ti 
         LEFT JOIN products p ON ti.product_id = p.id 
         WHERE ti.transaction_id = ?`,
        [id]
      );

      return {
        ...transactions[0],
        items: items || [],
      };
    } catch (error) {
      throw error;
    }
  }

  // Find transactions by user ID
  static async findByUserId(userId, { page = 1, limit = 10 } = {}) {
    try {
      const offset = (page - 1) * limit;

      const [transactions] = await db.execute(
        `SELECT * FROM transactions 
         WHERE user_id = ? 
         ORDER BY created_at DESC 
         LIMIT ? OFFSET ?`,
        [userId, limit, offset]
      );

      const [totalResult] = await db.execute(
        "SELECT COUNT(*) as total FROM transactions WHERE user_id = ?",
        [userId]
      );

      return {
        transactions,
        total: totalResult[0].total,
      };
    } catch (error) {
      throw error;
    }
  }

  // Find all transactions (for admin)
  static async findAll({ page = 1, limit = 10, status = null } = {}) {
    try {
      const offset = (page - 1) * limit;
      let query = "SELECT * FROM transactions";
      let params = [];
      let conditions = [];

      if (status) {
        conditions.push("status = ?");
        params.push(status);
      }

      if (conditions.length > 0) {
        query += " WHERE " + conditions.join(" AND ");
      }

      query += " ORDER BY created_at DESC LIMIT ? OFFSET ?";
      params.push(limit, offset);

      const [transactions] = await db.execute(query, params);

      const [totalResult] = await db.execute(
        `SELECT COUNT(*) as total FROM transactions ${
          status ? "WHERE status = ?" : ""
        }`,
        status ? [status] : []
      );

      return {
        transactions,
        total: totalResult[0].total,
      };
    } catch (error) {
      throw error;
    }
  }

  // Update transaction status
  static async updateStatus(id, status) {
    try {
      const [result] = await db.execute(
        "UPDATE transactions SET status = ?, updated_at = NOW() WHERE id = ?",
        [status, id]
      );

      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }

  // Update payment proof
  static async updatePaymentProof(id, paymentProofPath) {
    try {
      const [result] = await db.execute(
        "UPDATE transactions SET payment_proof = ?, status = 'waiting', updated_at = NOW() WHERE id = ?",
        [paymentProofPath, id]
      );

      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }

  // Delete transaction
  static async delete(id) {
    try {
      await db.execute("START TRANSACTION");

      // Get payment proof path before deletion
      const [transaction] = await db.execute(
        "SELECT payment_proof FROM transactions WHERE id = ?",
        [id]
      );

      // Delete items first
      await db.execute(
        "DELETE FROM transaction_items WHERE transaction_id = ?",
        [id]
      );

      // Then delete transaction
      const [result] = await db.execute(
        "DELETE FROM transactions WHERE id = ?",
        [id]
      );

      await db.execute("COMMIT");

      // Return both deletion result and payment proof path for cleanup
      return {
        success: result.affectedRows > 0,
        payment_proof:
          transaction.length > 0 ? transaction[0].payment_proof : null,
      };
    } catch (error) {
      await db.execute("ROLLBACK");
      throw error;
    }
  }

  // Count transactions by status
  static async countByStatus() {
    try {
      const [result] = await db.execute(
        "SELECT status, COUNT(*) as count FROM transactions GROUP BY status"
      );

      return result;
    } catch (error) {
      throw error;
    }
  }

  // Get sales statistics - only count accepted transactions
  static async getSalesStats() {
    try {
      const [result] = await db.execute(`
        SELECT 
          COUNT(*) as total_transactions,
          SUM(total_price) as total_revenue,
          AVG(total_price) as average_order_value,
          COUNT(DISTINCT user_id) as total_customers
        FROM transactions 
        WHERE status = 'accept'
      `);

      return result[0];
    } catch (error) {
      throw error;
    }
  }

  // Get sales report data
  static async getSalesReport({ startDate, endDate, status } = {}) {
    try {
      // Build query conditions
      let conditions = [];
      let params = [];

      if (startDate && endDate) {
        conditions.push("t.created_at BETWEEN ? AND ?"); // Add table alias 't'
        params.push(startDate, endDate + " 23:59:59");
      }

      if (status && status !== "all") {
        conditions.push("t.status = ?"); // Add table alias 't'
        params.push(status);
      }

      let whereClause = "";
      if (conditions.length > 0) {
        whereClause = "WHERE " + conditions.join(" AND ");
      }

      // Get summary stats
      const [summaryResult] = await db.execute(
        `
      SELECT 
        COUNT(*) as total_transactions,
        SUM(total_price) as total_revenue,
        AVG(total_price) as average_order_value,
        COUNT(DISTINCT user_id) as total_customers
      FROM transactions t
      ${whereClause}
    `,
        params
      );

      // Get transactions
      const [transactions] = await db.execute(
        `
      SELECT * FROM transactions t
      ${whereClause}
      ORDER BY t.created_at DESC
      LIMIT 1000
    `,
        params
      );

      // Get product stats - fixed the ambiguous column issue
      const [productStats] = await db.execute(
        `
      SELECT 
        ti.product_id,
        ti.product_name,
        SUM(ti.quantity) as quantity_sold,
        SUM(ti.total_price) as total_revenue
      FROM transaction_items ti
      INNER JOIN transactions t ON ti.transaction_id = t.id
      ${whereClause}
      GROUP BY ti.product_id, ti.product_name
      ORDER BY total_revenue DESC
      LIMIT 20
    `,
        params
      );

      return {
        summary: summaryResult[0] || {
          total_transactions: 0,
          total_revenue: 0,
          average_order_value: 0,
          total_customers: 0,
        },
        transactions: transactions || [],
        productStats: productStats || [],
      };
    } catch (error) {
      throw error;
    }
  }
}

export default Transaksi;
