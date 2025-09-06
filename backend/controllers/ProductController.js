import Product from "../models/ProductModel.js";
import Category from "../models/CategoryModel.js";
import { handleFileUpload, deleteFile } from "../utils/fileUpload.js";

// @desc    Get all products
// @route   GET /api/products
// @access  Public
export const getProducts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || "";
    const category_id = req.query.category_id || null;
    const category_name = req.query.category || null;
    const activeOnly = req.query.active !== "false";
    const minPrice = req.query.minPrice ? parseFloat(req.query.minPrice) : null;
    const maxPrice = req.query.maxPrice ? parseFloat(req.query.maxPrice) : null;

    let categoryIdToUse = category_id;
    if (category_name) {
      const category = await Category.findByName(category_name);
      if (category) {
        categoryIdToUse = category.id;
      }
    }

    const products = await Product.findAll({
      page,
      limit,
      search,
      category_id: categoryIdToUse,
      activeOnly,
      minPrice,
      maxPrice,
    });

    const totalProducts = await Product.count({
      search,
      category_id: categoryIdToUse,
      activeOnly,
    });

    const productsWithFullImageUrl = products.map((product) => ({
      ...product,
      image: product.image
        ? `${req.protocol}://${req.get("host")}/${product.image}`
        : null,
    }));

    res.status(200).json({
      success: true,
      data: productsWithFullImageUrl,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalProducts / limit),
        totalProducts,
        limit,
      },
    });
  } catch (error) {
    console.error("Get products error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching products",
    });
  }
};

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Public
export const getProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const productWithFullImageUrl = {
      ...product,
      image: product.image
        ? `${req.protocol}://${req.get("host")}/${product.image}`
        : null,
    };

    res.status(200).json({
      success: true,
      data: productWithFullImageUrl,
    });
  } catch (error) {
    console.error("Get product error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching product",
    });
  }
};

// @desc    Get products by category
// @route   GET /api/categories/:id/products
// @access  Public
export const getProductsByCategory = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const activeOnly = req.query.active !== "false";
    const categoryId = parseInt(req.params.id);

    if (isNaN(categoryId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid category ID",
      });
    }

    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    const products = await Product.findByCategory(categoryId, {
      page,
      limit,
      activeOnly,
    });

    const totalProducts = await Product.count({
      category_id: categoryId,
      activeOnly,
    });

    const productsWithFullImageUrl = products.map((product) => ({
      ...product,
      image: product.image
        ? `${req.protocol}://${req.get("host")}/${product.image}`
        : null,
    }));

    res.status(200).json({
      success: true,
      data: productsWithFullImageUrl,
      category: {
        id: category.id,
        name: category.name,
        description: category.description,
        image: category.image
          ? `${req.protocol}://${req.get("host")}/${category.image}`
          : null,
      },
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalProducts / limit),
        totalProducts,
        limit,
      },
    });
  } catch (error) {
    console.error("Get products by category error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching products",
    });
  }
};

// @desc    Create new product
// @route   POST /api/products
// @access  Private/Admin
export const createProduct = async (req, res) => {
  try {
    const { category_id, name, description, price, stock, sizes } = req.body;
    let imagePath = null;

    if (!category_id || !name || !price) {
      return res.status(400).json({
        success: false,
        message: "Please provide category, name, and price",
      });
    }

    if (price < 0) {
      return res.status(400).json({
        success: false,
        message: "Price cannot be negative",
      });
    }

    if (stock < 0) {
      return res.status(400).json({
        success: false,
        message: "Stock cannot be negative",
      });
    }

    if (sizes && Array.isArray(sizes)) {
      for (const size of sizes) {
        if (!size.size_id) {
          return res.status(400).json({
            success: false,
            message: "Each size must have a size_id",
          });
        }
        if (size.additional_price && size.additional_price < 0) {
          return res.status(400).json({
            success: false,
            message: "Additional price cannot be negative",
          });
        }
        if (size.stock && size.stock < 0) {
          return res.status(400).json({
            success: false,
            message: "Size stock cannot be negative",
          });
        }
      }
    }

    if (req.files && req.files.image) {
      try {
        // Check if the uploaded file is an image
        const allowedMimeTypes = [
          "image/jpeg",
          "image/png",
          "image/gif",
          "image/webp",
        ];
        if (!allowedMimeTypes.includes(req.files.image.mimetype)) {
          return res.status(400).json({
            success: false,
            message:
              "Invalid file type. Please upload an image (JPEG, PNG, GIF, WEBP)",
          });
        }

        // Check file size (max 5MB)
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (req.files.image.size > maxSize) {
          return res.status(400).json({
            success: false,
            message: "File too large. Maximum size is 5MB",
          });
        }

        imagePath = await handleFileUpload(req.files.image, "products");
      } catch (error) {
        console.error("File upload error:", error);
        return res.status(400).json({
          success: false,
          message: error.message || "Error uploading image",
        });
      }
    }

    const category = await Category.findById(category_id);
    if (!category) {
      if (imagePath) {
        deleteFile(imagePath);
      }
      return res.status(400).json({
        success: false,
        message: "Category not found",
      });
    }

    const product = await Product.create({
      category_id,
      name,
      description,
      price,
      image: imagePath,
      stock: stock || 0,
      sizes: sizes || [],
    });

    const productWithFullImageUrl = {
      ...product,
      image: product.image
        ? `${req.protocol}://${req.get("host")}/${product.image}`
        : null,
    };

    res.status(201).json({
      success: true,
      message: "Product created successfully",
      data: productWithFullImageUrl,
    });
  } catch (error) {
    console.error("Create product error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while creating product",
    });
  }
};

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private/Admin
export const updateProduct = async (req, res) => {
  try {
    const { category_id, name, description, price, stock, is_active, sizes } =
      req.body;
    const updateData = {};
    let imagePath = null;

    if (category_id !== undefined) updateData.category_id = category_id;
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (price !== undefined) updateData.price = price;
    if (stock !== undefined) updateData.stock = stock;
    if (is_active !== undefined) updateData.is_active = is_active;
    if (sizes !== undefined) updateData.sizes = sizes;

    if (Object.keys(updateData).length === 0 && !req.files?.image) {
      return res.status(400).json({
        success: false,
        message: "Please provide data to update",
      });
    }

    if (sizes && Array.isArray(sizes)) {
      for (const size of sizes) {
        if (!size.size_id) {
          return res.status(400).json({
            success: false,
            message: "Each size must have a size_id",
          });
        }
        if (size.additional_price && size.additional_price < 0) {
          return res.status(400).json({
            success: false,
            message: "Additional price cannot be negative",
          });
        }
        if (size.stock && size.stock < 0) {
          return res.status(400).json({
            success: false,
            message: "Size stock cannot be negative",
          });
        }
      }
    }

    if (req.files && req.files.image) {
      try {
        imagePath = await handleFileUpload(req.files.image, "products");
        updateData.image = imagePath;
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: error.message || "Error uploading image",
        });
      }
    }

    if (category_id) {
      const category = await Category.findById(category_id);
      if (!category) {
        if (imagePath) {
          deleteFile(imagePath);
        }
        return res.status(400).json({
          success: false,
          message: "Category not found",
        });
      }
    }

    const currentProduct = await Product.findById(req.params.id);

    const updatedProduct = await Product.update(req.params.id, updateData);

    if (imagePath && currentProduct && currentProduct.image) {
      deleteFile(currentProduct.image);
    }

    const productWithFullImageUrl = {
      ...updatedProduct,
      image: updatedProduct.image
        ? `${req.protocol}://${req.get("host")}/${updatedProduct.image}`
        : null,
    };

    res.status(200).json({
      success: true,
      message: "Product updated successfully",
      data: productWithFullImageUrl,
    });
  } catch (error) {
    console.error("Update product error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while updating product",
    });
  }
};

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Private/Admin
export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    if (product.image) {
      deleteFile(product.image);
    }

    await Product.delete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    console.error("Delete product error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while deleting product",
    });
  }
};

// @desc    Update product stock
// @route   PATCH /api/products/:id/stock
// @access  Private/Admin
export const updateProductStock = async (req, res) => {
  try {
    const { stock } = req.body;

    if (stock === undefined || stock < 0) {
      return res.status(400).json({
        success: false,
        message: "Please provide valid stock value",
      });
    }

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    await Product.updateStock(req.params.id, stock);

    res.status(200).json({
      success: true,
      message: "Product stock updated successfully",
    });
  } catch (error) {
    console.error("Update product stock error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while updating product stock",
    });
  }
};

// @desc    Update product size stock
// @route   PATCH /api/products/:id/sizes/:sizeId/stock
// @access  Private/Admin
export const updateProductSizeStock = async (req, res) => {
  try {
    const { stock } = req.body;
    const { id, sizeId } = req.params;

    if (stock === undefined || stock < 0) {
      return res.status(400).json({
        success: false,
        message: "Please provide valid stock value",
      });
    }

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const sizeExists = product.sizes.some(
      (size) => size.size_id === parseInt(sizeId)
    );
    if (!sizeExists) {
      return res.status(404).json({
        success: false,
        message: "Size not found for this product",
      });
    }

    await Product.updateSizeStock(id, sizeId, stock);

    res.status(200).json({
      success: true,
      message: "Product size stock updated successfully",
    });
  } catch (error) {
    console.error("Update product size stock error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while updating product size stock",
    });
  }
};
