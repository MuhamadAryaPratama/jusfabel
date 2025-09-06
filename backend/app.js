import express from "express";
import morgan from "morgan";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";
import fileUpload from "express-fileupload";
import fs from "fs";

// Get __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define allowed origins
const allowedOrigins = ["http://localhost:3000", "http://localhost:3100"];

// Route files
import authRoutes from "./routes/AuthRoute.js";
import adminAuthRoutes from "./routes/adminAuthRoute.js";
import productRoutes from "./routes/ProductRoute.js";
import ratingRoutes from "./routes/RatingRoute.js";
import categoryRoutes from "./routes/CategoryRoute.js";
import wishlistRoutes from "./routes/WishlistRoute.js";
import shoppingCartRoutes from "./routes/ShoppingcartRoute.js";
import sizeRoutes from "./routes/SizeRoute.js";
import transactionRoutes from "./routes/TransactionRoute.js";

const app = express();

// Trust proxy - untuk mendapatkan IP address yang benar
app.set("trust proxy", true);

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Cookie parser
app.use(cookieParser());

// File upload middleware
app.use(
  fileUpload({
    useTempFiles: true,
    tempFileDir: "/tmp/",
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
    abortOnLimit: true,
    createParentPath: true, // Create directories automatically
  })
);

// Create uploads directories if they don't exist
const uploadsDirs = [
  path.join(__dirname, "public", "uploads"),
  path.join(__dirname, "public", "uploads", "categories"),
  path.join(__dirname, "public", "uploads", "products"),
];

uploadsDirs.forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Dev logging middleware
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Enable CORS
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      } else {
        const msg = `CORS policy blocks access from ${origin}`;
        return callback(new Error(msg), false);
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Serve static files (for uploaded images)
app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static(path.join(__dirname, "public", "uploads")));

// Mount routers
app.use("/api/auth", authRoutes);
app.use("/api/admin/auth", adminAuthRoutes);
app.use("/api/products", productRoutes);
app.use("/api/ratings", ratingRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/cart", shoppingCartRoutes);
app.use("/api/sizes", sizeRoutes);
app.use("/api/transactions", transactionRoutes);

// Error middleware
app.use((err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode);
  res.json({
    message: err.message,
    stack: process.env.NODE_ENV === "production" ? null : err.stack,
  });
});

export default app;
