const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const User = require("../models/User");
const BorrowRecord = require("../models/BorrowRecord");
const { verifyToken, requireAdmin } = require("../middleware/auth");

// All user management routes require admin privileges
router.use(verifyToken, requireAdmin);

// GET /api/users - List all users
router.get("/", async (req, res) => {
  try {
    const { search, role, status } = req.query;
    const query = {};

    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), "i");
      query.$or = [{ name: regex }, { email: regex }];
    }

    if (role && ["user", "admin"].includes(role)) {
      query.role = role;
    }

    if (status !== undefined && status !== "") {
      query.isActive = status === "active" || status === "true";
    }

    const users = await User.find(query).select("-password").sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Failed to fetch users", error: error.message });
  }
});

// GET /api/users/:id - Get single user details and their borrowing activity
router.get("/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid user ID format." });
    }

    const user = await User.findById(req.params.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const borrowHistory = await BorrowRecord.find({ user: user._id })
      .populate("book", "title author category price available")
      .sort({ createdAt: -1 });

    res.json({
      user,
      borrowHistory,
      totalBorrowed: borrowHistory.length,
      activeLoans: borrowHistory.filter((b) => b.status === "borrowed").length,
    });
  } catch (error) {
    console.error("Error fetching user details:", error);
    res.status(500).json({ message: "Failed to fetch user details", error: error.message });
  }
});

// PUT /api/users/:id/role - Update user role (admin / user)
router.put("/:id/role", async (req, res) => {
  try {
    const { role } = req.body;
    if (!role || !["user", "admin"].includes(role)) {
      return res.status(400).json({ message: "Role must be either 'user' or 'admin'." });
    }

    const targetUser = await User.findById(req.params.id);
    if (!targetUser) {
      return res.status(404).json({ message: "User not found." });
    }

    // Safety check: Prevent demoting the last active administrator
    if (targetUser.role === "admin" && role === "user") {
      const adminCount = await User.countDocuments({ role: "admin", isActive: true });
      if (adminCount <= 1) {
        return res.status(400).json({
          message: "Cannot demote the only remaining active administrator.",
        });
      }
    }

    targetUser.role = role;
    await targetUser.save();

    res.json({
      message: `User role successfully changed to ${role}.`,
      user: targetUser,
    });
  } catch (error) {
    console.error("Error updating user role:", error);
    res.status(500).json({ message: "Failed to update role", error: error.message });
  }
});

// PUT /api/users/:id/status - Toggle activate/deactivate account
router.put("/:id/status", async (req, res) => {
  try {
    const { isActive } = req.body;
    if (typeof isActive !== "boolean") {
      return res.status(400).json({ message: "isActive must be a boolean." });
    }

    if (req.user._id.toString() === req.params.id && !isActive) {
      return res.status(400).json({ message: "You cannot deactivate your own account." });
    }

    const targetUser = await User.findById(req.params.id);
    if (!targetUser) {
      return res.status(404).json({ message: "User not found." });
    }

    targetUser.isActive = isActive;
    await targetUser.save();

    res.json({
      message: `User account has been ${isActive ? "activated" : "deactivated"}.`,
      user: targetUser,
    });
  } catch (error) {
    console.error("Error updating user status:", error);
    res.status(500).json({ message: "Failed to update status", error: error.message });
  }
});

module.exports = router;

