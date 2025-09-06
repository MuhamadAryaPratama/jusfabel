import ShoppingCart from "../models/ShoppingcartModel.js";
import Product from "../models/ProductModel.js";

// @desc    Get user's shopping cart
// @route   GET /api/cart
// @access  Private
export const getCart = async (req, res) => {
  try {
    const cart = await ShoppingCart.findByUserId(req.user.id);
    const summary = await ShoppingCart.getCartSummary(req.user.id);

    // Add full URL to image paths
    const cartWithFullImageUrl = cart.map((item) => ({
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
      data: cartWithFullImageUrl,
      summary,
    });
  } catch (error) {
    console.error("Get cart error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching cart",
    });
  }
};

// @desc    Add product to cart
// @route   POST /api/cart/:productId
// @access  Private
export const addToCart = async (req, res) => {
  try {
    const { productId } = req.params;
    const { quantity = 1 } = req.body;

    if (quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be greater than 0",
      });
    }

    const result = await ShoppingCart.addOrUpdate(
      req.user.id,
      productId,
      quantity
    );

    res.status(200).json({
      success: true,
      message: `Product ${result.action} to cart`,
      action: result.action,
      quantity: result.quantity,
    });
  } catch (error) {
    console.error("Add to cart error:", error);

    if (
      error.message.includes("not found") ||
      error.message.includes("not available")
    ) {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    if (error.message.includes("stock")) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error while adding to cart",
    });
  }
};

// @desc    Update cart item quantity
// @route   PUT /api/cart/:productId
// @access  Private
export const updateCartItem = async (req, res) => {
  try {
    const { productId } = req.params;
    const { quantity } = req.body;

    if (quantity === undefined || quantity < 0) {
      return res.status(400).json({
        success: false,
        message: "Valid quantity is required",
      });
    }

    const result = await ShoppingCart.updateQuantity(
      req.user.id,
      productId,
      quantity
    );

    res.status(200).json({
      success: true,
      message:
        result.action === "removed"
          ? "Product removed from cart"
          : "Cart item updated",
      action: result.action,
      quantity: result.quantity,
    });
  } catch (error) {
    console.error("Update cart error:", error);

    if (
      error.message.includes("not found") ||
      error.message.includes("not available")
    ) {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    if (error.message.includes("stock")) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error while updating cart",
    });
  }
};

// @desc    Remove product from cart
// @route   DELETE /api/cart/:productId
// @access  Private
export const removeFromCart = async (req, res) => {
  try {
    const { productId } = req.params;

    const removed = await ShoppingCart.remove(req.user.id, productId);

    if (!removed) {
      return res.status(404).json({
        success: false,
        message: "Product not found in cart",
      });
    }

    res.status(200).json({
      success: true,
      message: "Product removed from cart",
    });
  } catch (error) {
    console.error("Remove from cart error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while removing from cart",
    });
  }
};

// @desc    Clear user's cart
// @route   DELETE /api/cart
// @access  Private
export const clearCart = async (req, res) => {
  try {
    const clearedCount = await ShoppingCart.clear(req.user.id);

    res.status(200).json({
      success: true,
      message: `Cart cleared successfully`,
      cleared_items: clearedCount,
    });
  } catch (error) {
    console.error("Clear cart error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while clearing cart",
    });
  }
};

// @desc    Get cart summary
// @route   GET /api/cart/summary
// @access  Private
export const getCartSummary = async (req, res) => {
  try {
    const summary = await ShoppingCart.getCartSummary(req.user.id);

    res.status(200).json({
      success: true,
      data: summary,
    });
  } catch (error) {
    console.error("Get cart summary error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching cart summary",
    });
  }
};
