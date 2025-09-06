import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const handleFileUpload = (file, folder = "general") => {
  return new Promise((resolve, reject) => {
    if (!file) {
      return resolve(null);
    }

    // Validate file type
    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
    ];
    if (!allowedTypes.includes(file.mimetype)) {
      return reject(new Error("Invalid file type. Only images are allowed."));
    }

    // Create folder if it doesn't exist
    const uploadDir = path.join(__dirname, "..", "public", "uploads", folder);
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Generate unique filename
    const fileExtension = path.extname(file.name);
    const fileName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${fileExtension}`;
    const filePath = path.join(uploadDir, fileName);
    const relativePath = path
      .join("uploads", folder, fileName)
      .replace(/\\/g, "/");

    // Move file to upload directory
    file.mv(filePath, (err) => {
      if (err) {
        console.error("File upload error:", err);
        return reject(err);
      }
      resolve(relativePath);
    });
  });
};

export const deleteFile = (filePath) => {
  if (!filePath) return;

  const fullPath = path.join(__dirname, "..", "public", filePath);
  if (fs.existsSync(fullPath)) {
    fs.unlink(fullPath, (err) => {
      if (err) {
        console.error("Error deleting file:", err);
      }
    });
  }
};
