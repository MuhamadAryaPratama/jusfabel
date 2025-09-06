import Wishlist from "../models/WishlistModel.js";
import Product from "../models/ProductModel.js";

// @desc    Get user's wishlist
// @route   GET /api/wishlist
// @access  Private
export const getWishlist = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const wishlist = await Wishlist.findByUserId(req.user.id, { page, limit });
    const totalItems = await Wishlist.countByUserId(req.user.id);

    // Add full URL to image paths
    const wishlistWithFullImageUrl = wishlist.map((item) => ({
      ...item,
      product_details: {
        ...item.product_details,
        image: item.product_details.image
          ? `${req.protocol}://${req.get("host")}/${item.product_details.image}`
          : null,
      },
    }));

    res.status(200).json({
      success: true,
      data: wishlistWithFullImageUrl,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalItems / limit),
        totalItems,
        limit,
      },
    });
  } catch (error) {
    console.error("Get wishlist error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching wishlist",
    });
  }
};

// @desc    Add product to wishlist
// @route   POST /api/wishlist/:productId
// @access  Private
export const addToWishlist = async (req, res) => {
  try {
    const { productId } = req.params;

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Check if product is active
    if (!product.is_active) {
      return res.status(400).json({
        success: false,
        message: "Product is not available",
      });
    }

    // Add to wishlist
    await Wishlist.add(req.user.id, productId);

    res.status(200).json({
      success: true,
      message: "Product added to wishlist",
    });
  } catch (error) {
    console.error("Add to wishlist error:", error);

    if (error.message === "Product already in wishlist") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error while adding to wishlist",
    });
  }
};

// @desc    Remove product from wishlist
// @route   DELETE /api/wishlist/:productId
// @access  Private
export const removeFromWishlist = async (req, res) => {
  try {
    const { productId } = req.params;

    const removed = await Wishlist.remove(req.user.id, productId);

    if (!removed) {
      return res.status(404).json({
        success: false,
        message: "Product not found in wishlist",
      });
    }

    res.status(200).json({
      success: true,
      message: "Product removed from wishlist",
    });
  } catch (error) {
    console.error("Remove from wishlist error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while removing from wishlist",
    });
  }
};

// @desc    Check if product is in wishlist
// @route   GET /api/wishlist/check/:productId
// @access  Private
export const checkWishlist = async (req, res) => {
  try {
    const { productId } = req.params;

    const exists = await Wishlist.exists(req.user.id, productId);

    res.status(200).json({
      success: true,
      inWishlist: exists,
    });
  } catch (error) {
    console.error("Check wishlist error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while checking wishlist",
    });
  }
};
