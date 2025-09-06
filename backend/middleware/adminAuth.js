import jwt from "jsonwebtoken";
import Admin from "../models/AdminModel.js";

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_fallback";

export const adminProtect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(" ")[1];

      // Verify token
      const decoded = jwt.verify(token, JWT_SECRET);

      // Get admin from the token
      const admin = await Admin.findById(decoded.id);

      if (!admin) {
        return res.status(404).json({
          success: false,
          message: "Admin not found",
        });
      }

      // Attach admin to request object dengan format yang sama seperti req.user
      req.user = {
        id: admin.id,
        full_name: admin.full_name,
        email: admin.email,
        role: "admin", // Tambahkan role admin
      };

      // Juga attach ke req.admin untuk backward compatibility
      req.admin = {
        id: admin.id,
        full_name: admin.full_name,
        email: admin.email,
      };

      next();
    } catch (error) {
      console.error("Auth middleware error:", error);
      if (error instanceof jwt.TokenExpiredError) {
        return res.status(401).json({
          success: false,
          message: "Token expired",
        });
      } else if (error instanceof jwt.JsonWebTokenError) {
        return res.status(401).json({
          success: false,
          message: "Invalid token",
        });
      }
      return res.status(500).json({
        success: false,
        message: "Server error during authentication",
      });
    }
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Not authorized, no token provided",
    });
  }
};
