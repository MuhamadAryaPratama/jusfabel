import Category from "../models/CategoryModel.js";
import { handleFileUpload, deleteFile } from "../utils/fileUpload.js";

// @desc    Get all categories
// @route   GET /api/categories
// @access  Public
export const getCategories = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || "";
    const activeOnly = req.query.active !== "false";

    const categories = await Category.findAll({
      page,
      limit,
      search,
      activeOnly,
    });
    const totalCategories = await Category.count(search, activeOnly);

    // Add full URL to image paths
    const categoriesWithFullImageUrl = categories.map((category) => ({
      ...category,
      image: category.image
        ? `${req.protocol}://${req.get("host")}/${category.image}`
        : null,
    }));

    res.status(200).json({
      success: true,
      data: categoriesWithFullImageUrl,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCategories / limit),
        totalCategories,
        limit,
      },
    });
  } catch (error) {
    console.error("Get categories error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching categories",
    });
  }
};

// @desc    Get single category
// @route   GET /api/categories/:id
// @access  Public
export const getCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    // Add full URL to image path
    const categoryWithFullImageUrl = {
      ...category,
      image: category.image
        ? `${req.protocol}://${req.get("host")}/${category.image}`
        : null,
    };

    res.status(200).json({
      success: true,
      data: categoryWithFullImageUrl,
    });
  } catch (error) {
    console.error("Get category error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching category",
    });
  }
};

// @desc    Create new category
// @route   POST /api/categories
// @access  Private/Admin
export const createCategory = async (req, res) => {
  try {
    const { name, description } = req.body;
    let imagePath = null;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Please provide category name",
      });
    }

    // Handle file upload
    if (req.files && req.files.image) {
      try {
        imagePath = await handleFileUpload(req.files.image, "categories");
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: error.message || "Error uploading image",
        });
      }
    }

    // Check if category already exists
    const existingCategory = await Category.findByName(name);
    if (existingCategory) {
      // Delete uploaded file if category already exists
      if (imagePath) {
        deleteFile(imagePath);
      }
      return res.status(400).json({
        success: false,
        message: "Category already exists",
      });
    }

    const category = await Category.create({
      name,
      description,
      image: imagePath,
    });

    // Add full URL to image path
    const categoryWithFullImageUrl = {
      ...category,
      image: category.image
        ? `${req.protocol}://${req.get("host")}/${category.image}`
        : null,
    };

    res.status(201).json({
      success: true,
      message: "Category created successfully",
      data: categoryWithFullImageUrl,
    });
  } catch (error) {
    console.error("Create category error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while creating category",
    });
  }
};

// @desc    Update category
// @route   PUT /api/categories/:id
// @access  Private/Admin
export const updateCategory = async (req, res) => {
  try {
    const { name, description, is_active } = req.body;
    const updateData = {};
    let imagePath = null;

    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (is_active !== undefined) updateData.is_active = is_active;

    if (Object.keys(updateData).length === 0 && !req.files?.image) {
      return res.status(400).json({
        success: false,
        message: "Please provide data to update",
      });
    }

    // Handle file upload
    if (req.files && req.files.image) {
      try {
        imagePath = await handleFileUpload(req.files.image, "categories");
        updateData.image = imagePath;
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: error.message || "Error uploading image",
        });
      }
    }

    // Check if name is being updated and if it's already taken
    if (name) {
      const existingCategory = await Category.findByName(name);
      if (existingCategory && existingCategory.id !== parseInt(req.params.id)) {
        // Delete uploaded file if name is taken
        if (imagePath) {
          deleteFile(imagePath);
        }
        return res.status(400).json({
          success: false,
          message: "Category name already exists",
        });
      }
    }

    // Get current category to delete old image if needed
    const currentCategory = await Category.findById(req.params.id);

    const updatedCategory = await Category.update(req.params.id, updateData);

    // Delete old image if a new image was uploaded
    if (imagePath && currentCategory && currentCategory.image) {
      deleteFile(currentCategory.image);
    }

    // Add full URL to image path
    const categoryWithFullImageUrl = {
      ...updatedCategory,
      image: updatedCategory.image
        ? `${req.protocol}://${req.get("host")}/${updatedCategory.image}`
        : null,
    };

    res.status(200).json({
      success: true,
      message: "Category updated successfully",
      data: categoryWithFullImageUrl,
    });
  } catch (error) {
    console.error("Update category error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while updating category",
    });
  }
};

// @desc    Delete category
// @route   DELETE /api/categories/:id
// @access  Private/Admin
export const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    // Delete associated image file
    if (category.image) {
      deleteFile(category.image);
    }

    await Category.delete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Category deleted successfully",
    });
  } catch (error) {
    console.error("Delete category error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while deleting category",
    });
  }
};
