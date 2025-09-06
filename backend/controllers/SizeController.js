import Size from "../models/SizeModel.js";

// @desc    Get all sizes
// @route   GET /api/sizes
// @access  Public
export const getSizes = async (req, res) => {
  try {
    const sizes = await Size.findAll();

    res.status(200).json({
      success: true,
      data: sizes,
    });
  } catch (error) {
    console.error("Get sizes error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching sizes",
    });
  }
};

// @desc    Get single size
// @route   GET /api/sizes/:id
// @access  Public
export const getSize = async (req, res) => {
  try {
    const size = await Size.findById(req.params.id);

    if (!size) {
      return res.status(404).json({
        success: false,
        message: "Size not found",
      });
    }

    res.status(200).json({
      success: true,
      data: size,
    });
  } catch (error) {
    console.error("Get size error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching size",
    });
  }
};

// @desc    Create new size
// @route   POST /api/sizes
// @access  Private/Admin
export const createSize = async (req, res) => {
  try {
    const { name, description, unit } = req.body;

    // Validation
    if (!name || !unit) {
      return res.status(400).json({
        success: false,
        message: "Please provide name and unit",
      });
    }

    if (!["inch", "cm", "meter"].includes(unit)) {
      return res.status(400).json({
        success: false,
        message: "Unit must be one of: inch, cm, meter",
      });
    }

    const size = await Size.create({
      name,
      description,
      unit,
    });

    res.status(201).json({
      success: true,
      message: "Size created successfully",
      data: size,
    });
  } catch (error) {
    console.error("Create size error:", error);
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(400).json({
        success: false,
        message: "Size with this name already exists",
      });
    }
    res.status(500).json({
      success: false,
      message: "Server error while creating size",
    });
  }
};

// @desc    Update size
// @route   PUT /api/sizes/:id
// @access  Private/Admin
export const updateSize = async (req, res) => {
  try {
    const { name, description, unit } = req.body;
    const sizeId = req.params.id;

    // Validation
    if (!name && !description && !unit) {
      return res.status(400).json({
        success: false,
        message: "Please provide name, description or unit to update",
      });
    }

    if (unit && !["inch", "cm", "meter"].includes(unit)) {
      return res.status(400).json({
        success: false,
        message: "Unit must be one of: inch, cm, meter",
      });
    }

    // Check if size exists
    const existingSize = await Size.findById(sizeId);
    if (!existingSize) {
      return res.status(404).json({
        success: false,
        message: "Size not found",
      });
    }

    const updatedSize = await Size.update(sizeId, {
      name,
      description,
      unit,
    });

    res.status(200).json({
      success: true,
      message: "Size updated successfully",
      data: updatedSize,
    });
  } catch (error) {
    console.error("Update size error:", error);
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(400).json({
        success: false,
        message: "Size with this name already exists",
      });
    }
    res.status(500).json({
      success: false,
      message: "Server error while updating size",
    });
  }
};

// @desc    Delete size
// @route   DELETE /api/sizes/:id
// @access  Private/Admin
export const deleteSize = async (req, res) => {
  try {
    const sizeId = req.params.id;

    // Check if size exists
    const existingSize = await Size.findById(sizeId);
    if (!existingSize) {
      return res.status(404).json({
        success: false,
        message: "Size not found",
      });
    }

    // Check if size is used in any products
    const isUsed = await Size.isUsedInProducts(sizeId);
    if (isUsed) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete size because it is used in active products",
      });
    }

    // Delete the size
    await Size.delete(sizeId);

    res.status(200).json({
      success: true,
      message: "Size deleted successfully",
    });
  } catch (error) {
    console.error("Delete size error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while deleting size",
    });
  }
};

// @desc    Get products using a specific size
// @route   GET /api/sizes/:id/products
// @access  Public
export const getProductsBySize = async (req, res) => {
  try {
    const sizeId = req.params.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    // Check if size exists
    const size = await Size.findById(sizeId);
    if (!size) {
      return res.status(404).json({
        success: false,
        message: "Size not found",
      });
    }

    const { products, total } = await Size.getProductsBySize(sizeId, {
      page,
      limit,
    });

    // Add full URL to image paths
    const productsWithFullImageUrl = products.map((product) => ({
      ...product,
      image: product.image
        ? `${req.protocol}://${req.get("host")}/${product.image}`
        : null,
    }));

    res.status(200).json({
      success: true,
      data: productsWithFullImageUrl,
      size: size,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalProducts: total,
        limit,
      },
    });
  } catch (error) {
    console.error("Get products by size error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching products",
    });
  }
};
