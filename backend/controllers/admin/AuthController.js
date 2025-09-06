import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import Admin from "../../models/AdminModel.js";

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_fallback";
const JWT_EXPIRE = "30d";

const generateToken = (id) => {
  return jwt.sign({ id }, JWT_SECRET, {
    expiresIn: JWT_EXPIRE,
  });
};

// @desc    Register a new admin
// @route   POST /api/admin/auth/register
// @access  Public
export const register = async (req, res) => {
  try {
    const { full_name, email, password, confirm_password } = req.body;

    // Validation
    if (!full_name || !email || !password || !confirm_password) {
      return res.status(400).json({
        success: false,
        message: "Please fill in all fields",
      });
    }

    if (password !== confirm_password) {
      return res.status(400).json({
        success: false,
        message: "Passwords do not match",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters",
      });
    }

    // Check if admin exists
    const existingAdmin = await Admin.findByEmail(email);
    if (existingAdmin) {
      return res.status(400).json({
        success: false,
        message: "Email already registered",
      });
    }

    // Create admin
    await Admin.create({ full_name, email, password });

    res.status(201).json({
      success: true,
      message: "Admin registered successfully",
    });
  } catch (error) {
    console.error("Admin registration error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during registration",
      error: error.message,
    });
  }
};

// @desc    Login admin
// @route   POST /api/admin/auth/login
// @access  Public
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide email and password",
      });
    }

    const admin = await Admin.findByEmail(email);
    if (!admin) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const isMatch = await admin.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const token = generateToken(admin.id);

    res.status(200).json({
      success: true,
      token,
      admin: {
        id: admin.id,
        full_name: admin.full_name,
        email: admin.email,
      },
    });
  } catch (error) {
    console.error("Admin login error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during login",
    });
  }
};

// @desc    Get admin profile
// @route   GET /api/admin/auth/me
// @access  Private (Admin)
export const getMe = async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin.id);

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found",
      });
    }

    res.status(200).json({
      success: true,
      admin: {
        id: admin.id,
        full_name: admin.full_name,
        email: admin.email,
        created_at: admin.created_at,
      },
    });
  } catch (error) {
    console.error("Get admin profile error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// @desc    Update admin details
// @route   PUT /api/admin/auth/updatedetails
// @access  Private (Admin)
export const updateDetails = async (req, res) => {
  try {
    const { full_name, email } = req.body;
    const fieldsToUpdate = {};

    if (full_name) fieldsToUpdate.full_name = full_name;
    if (email) fieldsToUpdate.email = email;

    if (Object.keys(fieldsToUpdate).length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please provide fields to update",
      });
    }

    // Check if email is being updated and if it's already taken
    if (email) {
      const existingAdmin = await Admin.findByEmail(email);
      if (existingAdmin && existingAdmin.id !== req.admin.id) {
        return res.status(400).json({
          success: false,
          message: "Email already in use",
        });
      }
    }

    const updatedAdmin = await Admin.update(req.admin.id, fieldsToUpdate);

    res.status(200).json({
      success: true,
      admin: {
        id: updatedAdmin.id,
        full_name: updatedAdmin.full_name,
        email: updatedAdmin.email,
      },
    });
  } catch (error) {
    console.error("Update admin details error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during update",
    });
  }
};

// @desc    Update admin password
// @route   PUT /api/admin/auth/updatepassword
// @access  Private (Admin)
export const updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Please provide all password fields",
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "New passwords do not match",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters",
      });
    }

    const admin = await Admin.findById(req.admin.id);

    // Check current password
    const isMatch = await admin.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await Admin.update(req.admin.id, { password: hashedPassword });

    res.status(200).json({
      success: true,
      message: "Password updated successfully",
    });
  } catch (error) {
    console.error("Update admin password error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during password update",
    });
  }
};

// @desc    Forgot password
// @route   POST /api/admin/auth/forgotpassword
// @access  Public
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Please provide an email",
      });
    }

    const admin = await Admin.findByEmail(email);
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found with this email",
      });
    }

    // Generate 4-digit reset code (1000-9999)
    const resetCode = Math.floor(1000 + Math.random() * 9000).toString();
    const resetPasswordExpire = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

    await Admin.setResetPasswordToken(admin.id, resetCode, resetPasswordExpire);

    res.status(200).json({
      success: true,
      message: "Password reset code sent to email",
      resetCode, // Remove this in production
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during forgot password",
    });
  }
};

// @desc    Reset password
// @route   PUT /api/admin/auth/resetpassword/:resetcode
// @access  Public
export const resetPassword = async (req, res) => {
  try {
    const { resetcode } = req.params;
    const { password, confirmPassword } = req.body;

    if (!password || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Please provide password and confirmation",
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Passwords do not match",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters",
      });
    }

    // Find admin by reset code
    const admin = await Admin.findByResetToken(resetcode);
    if (!admin) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired code",
      });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Update password and clear reset code
    await Admin.update(admin.id, {
      password: hashedPassword,
      reset_password_token: null,
      reset_password_expire: null,
    });

    res.status(200).json({
      success: true,
      message: "Password reset successful",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during password reset",
    });
  }
};

// @desc    Logout admin
// @route   GET /api/admin/auth/logout
// @access  Private (Admin)
export const logout = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during logout",
    });
  }
};
