import Rating from "../models/RatingModel.js";

// @desc    Create new user rating for a product
// @route   POST /api/ratings
// @access  Private
export const createRating = async (req, res) => {
  try {
    const { product_id, rating, review } = req.body;
    const user_id = req.user.id;

    // Validation
    if (!product_id) {
      return res.status(400).json({
        success: false,
        message: "Please provide a product ID",
      });
    }

    if (!rating) {
      return res.status(400).json({
        success: false,
        message: "Please provide a rating",
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: "Rating must be between 1 and 5",
      });
    }

    // Create new rating (bisa multiple ratings dari user yang sama)
    const newRating = await Rating.create({
      user_id,
      product_id,
      rating,
      review: review || null,
    });

    res.status(201).json({
      success: true,
      data: newRating,
    });
  } catch (error) {
    console.error("Create rating error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Server error while creating rating",
    });
  }
};

// @desc    Get all ratings for a specific product
// @route   GET /api/products/:id/ratings
// @access  Public
export const getProductRatings = async (req, res) => {
  try {
    const productId = req.params.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const reviewsOnly = req.query.reviewsOnly === "true";

    let ratings;
    let totalRatings;

    if (reviewsOnly) {
      ratings = await Rating.getReviewsWithDescription(productId, {
        page,
        limit,
      });
      totalRatings = await Rating.countReviewsWithDescription(productId);
    } else {
      ratings = await Rating.findByProductId(productId, { page, limit });
      totalRatings = await Rating.countByProductId(productId);
    }

    const averageRating = await Rating.getAverageRatingByProduct(productId);
    const reviewsWithDescription =
      await Rating.countReviewsWithDescription(productId);

    res.status(200).json({
      success: true,
      data: ratings,
      meta: {
        average: averageRating.average,
        count: averageRating.count,
        reviews_with_description: reviewsWithDescription,
        total: totalRatings,
        currentPage: page,
        totalPages: Math.ceil(totalRatings / limit),
      },
    });
  } catch (error) {
    console.error("Get product ratings error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching product ratings",
    });
  }
};

// @desc    Get reviews with descriptions for a specific product
// @route   GET /api/products/:id/reviews
// @access  Public
export const getProductReviews = async (req, res) => {
  try {
    const productId = req.params.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const reviews = await Rating.getReviewsWithDescription(productId, {
      page,
      limit,
    });
    const totalReviews = await Rating.countReviewsWithDescription(productId);

    res.status(200).json({
      success: true,
      data: reviews,
      meta: {
        total: totalReviews,
        currentPage: page,
        totalPages: Math.ceil(totalReviews / limit),
      },
    });
  } catch (error) {
    console.error("Get product reviews error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching product reviews",
    });
  }
};

// @desc    Get all ratings (system-wide)
// @route   GET /api/ratings
// @access  Public
export const getAllRatings = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const ratings = await Rating.findAll({ page, limit });
    const averageRating = await Rating.getAverageRating();

    res.status(200).json({
      success: true,
      data: ratings,
      meta: {
        average: averageRating.average,
        count: averageRating.count,
        currentPage: page,
        totalPages: Math.ceil(averageRating.count / limit),
      },
    });
  } catch (error) {
    console.error("Get ratings error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching ratings",
    });
  }
};

// @desc    Update user rating
// @route   PUT /api/ratings/:id
// @access  Private
export const updateRating = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, review } = req.body;
    const user_id = req.user.id;

    // Check if rating exists and belongs to user
    const existingRating = await Rating.findById(id);
    if (!existingRating) {
      return res.status(404).json({
        success: false,
        message: "Rating not found",
      });
    }

    if (existingRating.user_id !== user_id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this rating",
      });
    }

    // Update rating
    const updatedRating = await Rating.update(id, {
      rating,
      review: review || existingRating.review,
    });

    res.status(200).json({
      success: true,
      data: updatedRating,
    });
  } catch (error) {
    console.error("Update rating error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while updating rating",
    });
  }
};

// @desc    Delete user rating
// @route   DELETE /api/ratings/:id
// @access  Private
export const deleteRating = async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.user.id;

    // Check if rating exists and belongs to user
    const existingRating = await Rating.findById(id);
    if (!existingRating) {
      return res.status(404).json({
        success: false,
        message: "Rating not found",
      });
    }

    if (existingRating.user_id !== user_id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this rating",
      });
    }

    // Delete rating
    await Rating.delete(id);

    res.status(200).json({
      success: true,
      message: "Rating deleted successfully",
    });
  } catch (error) {
    console.error("Delete rating error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while deleting rating",
    });
  }
};

// @desc    Get all user's ratings
// @route   GET /api/ratings/me
// @access  Private
export const getMyRatings = async (req, res) => {
  try {
    const user_id = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const ratings = await Rating.findByUserId(user_id, { page, limit });
    const totalRatings = await Rating.countByUserId(user_id);

    res.status(200).json({
      success: true,
      data: ratings,
      meta: {
        currentPage: page,
        totalPages: Math.ceil(totalRatings / limit),
        total: totalRatings,
      },
    });
  } catch (error) {
    console.error("Get user ratings error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching user ratings",
    });
  }
};

// @desc    Check if user has rated a product and get latest rating
// @route   GET /api/products/:id/rating/check
// @access  Private
export const checkUserRating = async (req, res) => {
  try {
    const productId = req.params.id;
    const user_id = req.user.id;

    const latestRating = await Rating.getUserLatestRating(user_id, productId);

    res.status(200).json({
      success: true,
      data: {
        hasRated: latestRating !== null,
        latestRating: latestRating,
      },
    });
  } catch (error) {
    console.error("Check user rating error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while checking user rating",
    });
  }
};

// @desc    Get user's latest rating for a product
// @route   GET /api/products/:id/rating/latest
// @access  Private
export const getUserLatestRating = async (req, res) => {
  try {
    const productId = req.params.id;
    const user_id = req.user.id;

    const latestRating = await Rating.getUserLatestRating(user_id, productId);

    res.status(200).json({
      success: true,
      data: latestRating,
    });
  } catch (error) {
    console.error("Get user latest rating error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching user's latest rating",
    });
  }
};

// @desc    Get all user ratings for a specific product
// @route   GET /api/products/:id/ratings/me
// @access  Private
export const getUserRatingsForProduct = async (req, res) => {
  try {
    const productId = req.params.id;
    const user_id = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const ratings = await Rating.getUserRatingsForProduct(user_id, productId, {
      page,
      limit,
    });
    const totalRatings = await Rating.countByUserId(user_id);

    res.status(200).json({
      success: true,
      data: ratings,
      meta: {
        currentPage: page,
        totalPages: Math.ceil(totalRatings / limit),
        total: totalRatings,
      },
    });
  } catch (error) {
    console.error("Get user ratings for product error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching user ratings for product",
    });
  }
};
