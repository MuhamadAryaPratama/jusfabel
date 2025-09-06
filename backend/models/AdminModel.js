import bcrypt from "bcryptjs";
import { db } from "../server.js";

class Admin {
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

  // Create admin
  static async create({ full_name, email, password }) {
    try {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const [result] = await db.execute(
        "INSERT INTO admins (full_name, email, password) VALUES (?, ?, ?)",
        [full_name, email, hashedPassword]
      );

      const [admin] = await db.execute("SELECT * FROM admins WHERE id = ?", [
        result.insertId,
      ]);

      return new Admin(admin[0]);
    } catch (error) {
      throw error;
    }
  }

  // Find admin by email
  static async findByEmail(email) {
    try {
      const [admins] = await db.execute(
        "SELECT * FROM admins WHERE email = ?",
        [email]
      );

      if (admins.length === 0) return null;

      return new Admin(admins[0]);
    } catch (error) {
      throw error;
    }
  }

  // Find admin by ID
  static async findById(id) {
    try {
      const [admins] = await db.execute("SELECT * FROM admins WHERE id = ?", [
        id,
      ]);

      if (admins.length === 0) return null;

      return new Admin(admins[0]);
    } catch (error) {
      throw error;
    }
  }

  // Update admin
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

      const query = `UPDATE admins SET ${fields.join(", ")} WHERE id = ?`;
      console.log("Executing query:", query); // Untuk debugging

      await db.execute(query, values);

      const [admin] = await db.execute("SELECT * FROM admins WHERE id = ?", [
        id,
      ]);
      return new Admin(admin[0]);
    } catch (error) {
      console.error("Update error:", error);
      throw error;
    }
  }

  // Set reset password token
  static async setResetPasswordToken(id, token, expireTime) {
    try {
      await db.execute(
        "UPDATE admins SET reset_password_token = ?, reset_password_expire = ? WHERE id = ?",
        [token, expireTime, id]
      );
    } catch (error) {
      console.error("Error setting reset token:", error);
      throw error;
    }
  }

  // Find by reset token
  static async findByResetToken(token) {
    try {
      const [admins] = await db.execute(
        "SELECT * FROM admins WHERE reset_password_token = ? AND reset_password_expire > NOW()",
        [token]
      );

      if (admins.length === 0) return null;

      return new Admin(admins[0]);
    } catch (error) {
      console.error("Error finding by reset token:", error);
      throw error;
    }
  }

  // Compare password
  async comparePassword(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
  }

  // Create user by admin
  static async createUser({ full_name, email, password }) {
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

      return {
        id: user[0].id,
        full_name: user[0].full_name,
        email: user[0].email,
        created_at: user[0].created_at,
      };
    } catch (error) {
      throw error;
    }
  }
}

export default Admin;
