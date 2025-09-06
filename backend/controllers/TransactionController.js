import Transaksi from "../models/TransactionModel.js";
import Product from "../models/ProductModel.js";
import { handleFileUpload, deleteFile } from "../utils/fileUpload.js";

// @desc    Create new transaction (single product)
// @route   POST /api/transactions
// @access  Private
export const createTransaction = async (req, res) => {
  try {
    const {
      product_id,
      quantity,
      customer_name,
      customer_email,
      customer_phone,
      customer_address,
      notes,
    } = req.body;

    let paymentProofPath = null;

    // Validation
    if (
      !product_id ||
      !quantity ||
      !customer_name ||
      !customer_email ||
      !customer_phone ||
      !customer_address
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required fields",
      });
    }

    // Handle payment proof upload if provided
    if (req.files && req.files.payment_proof) {
      try {
        paymentProofPath = await handleFileUpload(
          req.files.payment_proof,
          "payment-proofs"
        );
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: error.message || "Error uploading payment proof",
        });
      }
    }

    // Get product details
    const product = await Product.findById(product_id);
    if (!product) {
      // Delete uploaded file if product not found
      if (paymentProofPath) {
        deleteFile(paymentProofPath);
      }
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Check stock
    if (product.stock < quantity) {
      // Delete uploaded file if insufficient stock
      if (paymentProofPath) {
        deleteFile(paymentProofPath);
      }
      return res.status(400).json({
        success: false,
        message: "Insufficient stock",
      });
    }

    const total_price = product.price * quantity;

    // Create transaction
    const transactionId = await Transaksi.create({
      user_id: req.user.id,
      customer_name,
      customer_email,
      customer_phone,
      customer_address,
      notes: notes || "",
      total_items: 1,
      total_quantity: quantity,
      total_price,
      payment_proof: paymentProofPath,
      status: "menunggu pembayaran",
    });

    // Create transaction items
    await Transaksi.createItems(transactionId, [
      {
        product_id,
        product_name: product.name,
        quantity,
        price_per_unit: product.price,
        total_price,
      },
    ]);

    // Update product stock only when transaction is accepted
    // Removed automatic stock update - now only when admin accepts

    const transaction = await Transaksi.findById(transactionId);

    // Add full URL to payment proof
    if (transaction.payment_proof) {
      transaction.payment_proof = `${req.protocol}://${req.get("host")}/${transaction.payment_proof}`;
    }

    res.status(201).json({
      success: true,
      message: "Transaction created successfully",
      data: transaction,
    });
  } catch (error) {
    console.error("Create transaction error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while creating transaction",
    });
  }
};

// @desc    Create transaction from cart
// @route   POST /api/transactions/cart
// @access  Private
export const createTransactionFromCart = async (req, res) => {
  try {
    const {
      items,
      customer_name,
      customer_email,
      customer_phone,
      customer_address,
      notes,
    } = req.body;

    // Validation
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Cart items are required",
      });
    }

    if (
      !customer_name ||
      !customer_email ||
      !customer_phone ||
      !customer_address
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required customer information",
      });
    }

    let total_items = 0;
    let total_quantity = 0;
    let total_price = 0;
    const transactionItems = [];
    let paymentProofPath = null;

    // Handle payment proof upload if provided
    if (req.files && req.files.payment_proof) {
      try {
        paymentProofPath = await handleFileUpload(
          req.files.payment_proof,
          "payment-proofs"
        );
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: error.message || "Error uploading payment proof",
        });
      }
    }

    // Validate each item and calculate totals
    for (const item of items) {
      if (!item.product_id || !item.quantity) {
        // Delete uploaded file if validation fails
        if (paymentProofPath) {
          deleteFile(paymentProofPath);
        }
        return res.status(400).json({
          success: false,
          message: "Each item must have product_id and quantity",
        });
      }

      const product = await Product.findById(item.product_id);
      if (!product) {
        // Delete uploaded file if product not found
        if (paymentProofPath) {
          deleteFile(paymentProofPath);
        }
        return res.status(404).json({
          success: false,
          message: `Product with ID ${item.product_id} not found`,
        });
      }

      if (product.stock < item.quantity) {
        // Delete uploaded file if insufficient stock
        if (paymentProofPath) {
          deleteFile(paymentProofPath);
        }
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for product: ${product.name}`,
        });
      }

      const item_total_price = product.price * item.quantity;

      total_items++;
      total_quantity += item.quantity;
      total_price += item_total_price;

      transactionItems.push({
        product_id: item.product_id,
        product_name: product.name,
        quantity: item.quantity,
        price_per_unit: product.price,
        total_price: item_total_price,
      });
    }

    // Create transaction
    const transactionId = await Transaksi.create({
      user_id: req.user.id,
      customer_name,
      customer_email,
      customer_phone,
      customer_address,
      notes: notes || "",
      total_items,
      total_quantity,
      total_price,
      payment_proof: paymentProofPath,
      status: "menunggu pembayaran",
    });

    // Create transaction items
    await Transaksi.createItems(transactionId, transactionItems);

    // Update stock for all products only when transaction is accepted
    // Removed automatic stock update - now only when admin accepts

    const transaction = await Transaksi.findById(transactionId);

    // Add full URL to payment proof
    if (transaction.payment_proof) {
      transaction.payment_proof = `${req.protocol}://${req.get("host")}/${transaction.payment_proof}`;
    }

    res.status(201).json({
      success: true,
      message: "Transaction created successfully from cart",
      data: transaction,
    });
  } catch (error) {
    console.error("Create cart transaction error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while creating transaction from cart",
    });
  }
};

// @desc    Upload payment proof
// @route   POST /api/transactions/:id/payment-proof
// @access  Private
export const uploadPaymentProof = async (req, res) => {
  try {
    const transaction = await Transaksi.findById(req.params.id);

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found",
      });
    }

    // Check if user owns this transaction
    if (transaction.user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this transaction",
      });
    }

    // Check if transaction status allows payment proof upload
    if (transaction.status !== "menunggu pembayaran") {
      return res.status(400).json({
        success: false,
        message:
          "Payment proof can only be uploaded for transactions waiting for payment",
      });
    }

    let paymentProofPath = null;

    if (req.files && req.files.payment_proof) {
      try {
        paymentProofPath = await handleFileUpload(
          req.files.payment_proof,
          "payment-proofs"
        );
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: error.message || "Error uploading payment proof",
        });
      }
    } else {
      return res.status(400).json({
        success: false,
        message: "Payment proof file is required",
      });
    }

    // Delete old payment proof if exists
    if (transaction.payment_proof) {
      deleteFile(transaction.payment_proof);
    }

    // Update transaction with payment proof
    const updated = await Transaksi.updatePaymentProof(
      req.params.id,
      paymentProofPath
    );

    if (!updated) {
      // Delete uploaded file if update fails
      if (paymentProofPath) {
        deleteFile(paymentProofPath);
      }
      return res.status(400).json({
        success: false,
        message: "Failed to update payment proof",
      });
    }

    // Get updated transaction
    const updatedTransaction = await Transaksi.findById(req.params.id);

    // Add full URL to payment proof
    if (updatedTransaction.payment_proof) {
      updatedTransaction.payment_proof = `${req.protocol}://${req.get("host")}/${updatedTransaction.payment_proof}`;
    }

    res.status(200).json({
      success: true,
      message: "Payment proof uploaded successfully",
      data: updatedTransaction,
    });
  } catch (error) {
    console.error("Upload payment proof error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while uploading payment proof",
    });
  }
};

// @desc    Get user transactions
// @route   GET /api/transactions/user
// @access  Private
export const getUserTransactions = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const { transactions, total } = await Transaksi.findByUserId(req.user.id, {
      page,
      limit,
    });

    // Add full URL to payment proofs
    const transactionsWithFullUrls = transactions.map((transaction) => ({
      ...transaction,
      payment_proof: transaction.payment_proof
        ? `${req.protocol}://${req.get("host")}/${transaction.payment_proof}`
        : null,
    }));

    res.status(200).json({
      success: true,
      data: transactionsWithFullUrls,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalTransactions: total,
        limit,
      },
    });
  } catch (error) {
    console.error("Get user transactions error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching transactions",
    });
  }
};

// @desc    Get transaction by ID
// @route   GET /api/transactions/:id
// @access  Private
export const getTransaction = async (req, res) => {
  try {
    const transaction = await Transaksi.findById(req.params.id);

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found",
      });
    }

    // Check if user owns this transaction or is admin
    if (transaction.user_id !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Not authorized to access this transaction",
      });
    }

    // Add full URL to payment proof
    if (transaction.payment_proof) {
      transaction.payment_proof = `${req.protocol}://${req.get("host")}/${transaction.payment_proof}`;
    }

    res.status(200).json({
      success: true,
      data: transaction,
    });
  } catch (error) {
    console.error("Get transaction error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching transaction",
    });
  }
};

// @desc    Get all transactions (Admin only)
// @route   GET /api/transactions
// @access  Private/Admin
export const getAllTransactions = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const status = req.query.status || null;

    const { transactions, total } = await Transaksi.findAll({
      page,
      limit,
      status,
    });

    // Add full URL to payment proofs
    const transactionsWithFullUrls = transactions.map((transaction) => ({
      ...transaction,
      payment_proof: transaction.payment_proof
        ? `${req.protocol}://${req.get("host")}/${transaction.payment_proof}`
        : null,
    }));

    res.status(200).json({
      success: true,
      data: transactionsWithFullUrls,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalTransactions: total,
        limit,
      },
    });
  } catch (error) {
    console.error("Get all transactions error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching transactions",
    });
  }
};

// @desc    Update transaction status
// @route   PUT /api/transactions/:id/status
// @access  Private/Admin
export const updateTransactionStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (
      !status ||
      !["menunggu pembayaran", "waiting", "accept", "reject"].includes(status)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Valid status is required (menunggu pembayaran, waiting, accept, or reject)",
      });
    }

    const transaction = await Transaksi.findById(req.params.id);
    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found",
      });
    }

    const updated = await Transaksi.updateStatus(req.params.id, status);

    if (!updated) {
      return res.status(400).json({
        success: false,
        message: "Failed to update transaction status",
      });
    }

    // If status is accepted, update product stock
    if (status === "accept") {
      for (const item of transaction.items) {
        const product = await Product.findById(item.product_id);
        if (product) {
          await Product.updateStock(
            item.product_id,
            product.stock - item.quantity
          );
        }
      }
    }

    // Get the updated transaction with items
    const updatedTransaction = await Transaksi.findById(req.params.id);

    // Add full URL to payment proof
    if (updatedTransaction.payment_proof) {
      updatedTransaction.payment_proof = `${req.protocol}://${req.get("host")}/${updatedTransaction.payment_proof}`;
    }

    res.status(200).json({
      success: true,
      message: "Transaction status updated successfully",
      data: updatedTransaction, // Return the updated transaction
    });
  } catch (error) {
    console.error("Update transaction status error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while updating transaction status",
    });
  }
};

// @desc    Delete transaction
// @route   DELETE /api/transactions/:id
// @access  Private/Admin
export const deleteTransaction = async (req, res) => {
  try {
    const transaction = await Transaksi.findById(req.params.id);
    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found",
      });
    }

    const { success, payment_proof } = await Transaksi.delete(req.params.id);

    if (!success) {
      return res.status(400).json({
        success: false,
        message: "Failed to delete transaction",
      });
    }

    // Delete payment proof file if exists
    if (payment_proof) {
      deleteFile(payment_proof);
    }

    res.status(200).json({
      success: true,
      message: "Transaction deleted successfully",
    });
  } catch (error) {
    console.error("Delete transaction error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while deleting transaction",
    });
  }
};

// @desc    Get transaction statistics
// @route   GET /api/transactions/stats/overview
// @access  Private/Admin
export const getTransactionStats = async (req, res) => {
  try {
    const statusCounts = await Transaksi.countByStatus();
    const salesStats = await Transaksi.getSalesStats();

    res.status(200).json({
      success: true,
      data: {
        status_counts: statusCounts,
        sales_stats: salesStats,
      },
    });
  } catch (error) {
    console.error("Get transaction stats error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching transaction statistics",
    });
  }
};

// @desc    Get sales report
// @route   GET /api/transactions/stats/sales-report
// @access  Private/Admin
export const getSalesReport = async (req, res) => {
  try {
    const { startDate, endDate, status } = req.query;

    // Gunakan method yang sudah ada di model Transaksi
    const salesReport = await Transaksi.getSalesReport({
      startDate,
      endDate,
      status,
    });

    res.status(200).json({
      success: true,
      data: salesReport,
    });
  } catch (error) {
    console.error("Get sales report error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching sales report",
    });
  }
};
