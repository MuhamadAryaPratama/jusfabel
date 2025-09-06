import bcrypt from "bcryptjs";
import { db } from "../server.js";

class User {
  constructor({
    id,
    full_name,
    email,
    password,
    reset_password_token,
    reset_password_expire,
    created_at,
    updated_at,
  }) {
    this.id = id;
    this.full_name = full_name;
    this.email = email;
    this.password = password;
    this.reset_password_token = reset_password_token;
    this.reset_password_expire = reset_password_expire;
    this.created_at = created_at;
    this.updated_at = updated_at;
  }

  // Save user to database
  static async create({ full_name, email, password }) {
    try {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const [result] = await db.execute(
        "INSERT INTO users (full_name, email, password) VALUES (?, ?, ?)",
        [full_name, email, hashedPassword]
      );

      const [user] = await db.execute("SELECT * FROM users WHERE id = ?", [
        result.insertId,
      ]);

      return new User(user[0]);
    } catch (error) {
      throw error;
    }
  }

  // Find user by email
  static async findByEmail(email) {
    try {
      const [users] = await db.execute("SELECT * FROM users WHERE email = ?", [
        email,
      ]);

      if (users.length === 0) return null;

      return new User(users[0]);
    } catch (error) {
      throw error;
    }
  }

  // Find user by ID
  static async findById(id) {
    try {
      const [users] = await db.execute("SELECT * FROM users WHERE id = ?", [
        id,
      ]);

      if (users.length === 0) return null;

      return new User(users[0]);
    } catch (error) {
      throw error;
    }
  }

  // Find all users with pagination and search
  static async findAll({ page = 1, limit = 10, search = "" } = {}) {
    try {
      const offset = (page - 1) * limit;
      let query =
        "SELECT id, full_name, email, created_at, updated_at FROM users";
      let params = [];

      if (search) {
        query += " WHERE full_name LIKE ? OR email LIKE ?";
        params.push(`%${search}%`, `%${search}%`);
      }

      query += " ORDER BY created_at DESC LIMIT ? OFFSET ?";
      params.push(limit, offset);

      const [users] = await db.execute(query, params);

      return users.map((user) => ({
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        created_at: user.created_at,
        updated_at: user.updated_at,
      }));
    } catch (error) {
      throw error;
    }
  }

  // Count total users (for pagination)
  static async countUsers(search = "") {
    try {
      let query = "SELECT COUNT(*) as total FROM users";
      let params = [];

      if (search) {
        query += " WHERE full_name LIKE ? OR email LIKE ?";
        params.push(`%${search}%`, `%${search}%`);
      }

      const [result] = await db.execute(query, params);
      return result[0].total;
    } catch (error) {
      throw error;
    }
  }

  // Delete user
  static async delete(id) {
    try {
      const [result] = await db.execute("DELETE FROM users WHERE id = ?", [id]);
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }

  // Update user
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
        `UPDATE users SET ${fields.join(", ")} WHERE id = ?`,
        values
      );

      const [user] = await db.execute("SELECT * FROM users WHERE id = ?", [id]);
      return new User(user[0]);
    } catch (error) {
      throw error;
    }
  }

  // Set reset password token
  static async setResetPasswordToken(id, token, expireTime) {
    try {
      await db.execute(
        "UPDATE users SET reset_password_token = ?, reset_password_expire = ? WHERE id = ?",
        [token, expireTime, id]
      );
    } catch (error) {
      throw error;
    }
  }

  // Find by reset token
  static async findByResetToken(token) {
    try {
      const [users] = await db.execute(
        "SELECT * FROM users WHERE reset_password_token = ? AND reset_password_expire > NOW()",
        [token]
      );

      if (users.length === 0) return null;

      return new User(users[0]);
    } catch (error) {
      throw error;
    }
  }

  // Compare password
  async comparePassword(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
  }
}

export default User;
