import http from "http";
import dotenv from "dotenv";
import app from "./app.js";
import connectDB from "./config/Database.js";

// Load environment variables
dotenv.config();

// Connect to database and make it available globally
let db;
(async () => {
  db = await connectDB();

  const PORT = process.env.PORT || 5000;
  const server = http.createServer(app);

  server.listen(PORT, () => {
    console.log(
      `Server running in ${process.env.NODE_ENV} mode on port ${PORT}`
    );
  });

  // Handle unhandled promise rejections
  process.on("unhandledRejection", (err, promise) => {
    console.log(`Error: ${err.message}`);
    if (db) db.end(); // Close MySQL connection
    server.close(() => process.exit(1));
  });

  // Graceful shutdown
  const gracefulShutdown = () => {
    console.log("Shutting down gracefully");
    if (db) db.end(); // Close MySQL connection
    server.close(() => {
      console.log("Process terminated");
      process.exit(0);
    });
  };

  process.on("SIGTERM", gracefulShutdown);
  process.on("SIGINT", gracefulShutdown);
})();

export { db };
