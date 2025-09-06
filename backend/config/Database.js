import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

const connectDB = async () => {
  try {
    const connection = await mysql.createConnection({
      host: process.env.MYSQL_HOST || "localhost",
      user: process.env.MYSQL_USER || "root",
      password: process.env.MYSQL_PASSWORD || "",
      database: process.env.MYSQL_DATABASE || "jusfabel_db",
      port: process.env.MYSQL_PORT || 3307,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });

    console.log("MySQL Connected...");
    return connection;
  } catch (err) {
    console.error("Database connection error:", err.message);
    process.exit(1);
  }
};

export default connectDB;
