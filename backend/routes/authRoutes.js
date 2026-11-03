const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { verifyToken, requireAdmin } = require("../middleware/auth");
const { sendWelcomeEmail, verifyBrevoConfig, sendEmail } = require("../services/emailService");

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "super_secret_library_hub_jwt_key_2026_secure";

// Generate JWT Helper
function generateToken(user) {
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

// POST /api/auth/register
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return res.status(400).json({ message: "Name is required." });
    }
    if (!email || typeof email !== "string" || !/^\S+@\S+\.\S+$/.test(email.trim())) {
      return res.status(400).json({ message: "A valid email address is required." });
    }
    if (!password || typeof password !== "string" || password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters long." });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(409).json({ message: "An account with this email already exists." });
    }

    // Designated admin emails are automatically granted admin privileges
    const designatedAdminEmails = [
      "2024.meet.suhanda@ves.ac.in",
      "admin@libraryhub.com",
    ];
    const assignedRole = designatedAdminEmails.includes(normalizedEmail) ? "admin" : "user";

    // Self-promotion to admin by arbitrary email is strictly disallowed
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: password,
      role: assignedRole,
      isActive: true,
    });

    const token = generateToken(user);

    // Fire welcome email asynchronously
    sendWelcomeEmail(user).catch((err) => console.error("Welcome email error:", err));

    res.status(201).json({
      message: "Registration successful! Welcome to LibraryHub.",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: "Registration failed", error: error.message });
  }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Please provide both email and password." });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    if (!user.isActive) {
      return res.status(403).json({
        message: "Your account is currently deactivated. Please contact the administrator.",
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    // Ensure designated admin accounts safely have the admin role
    const designatedAdminEmails = [
      "2024.meet.suhanda@ves.ac.in",
      "admin@libraryhub.com",
    ];
    if (designatedAdminEmails.includes(user.email) && user.role !== "admin") {
      user.role = "admin";
      await User.updateOne({ _id: user._id }, { $set: { role: "admin" } });
    }

    const token = generateToken(user);

    res.status(200).json({
      message: "Login successful! Welcome back.",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Login failed", error: error.message });
  }
});

// GET /api/auth/me (Get current authenticated user)
router.get("/me", verifyToken, async (req, res) => {
  res.status(200).json({
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      isActive: req.user.isActive,
      createdAt: req.user.createdAt,
    },
  });
});

// GET /api/auth/brevo-status (Admin Only Diagnostic Check)
router.get("/brevo-status", verifyToken, requireAdmin, async (_req, res) => {
  try {
    const status = await verifyBrevoConfig();
    res.json(status);
  } catch (error) {
    res.status(500).json({ message: "Failed to check Brevo status", error: error.message });
  }
});

// POST /api/auth/test-email (Admin Only Test Email Trigger)
router.post("/test-email", verifyToken, requireAdmin, async (req, res) => {
  try {
    const { to } = req.body;
    const recipient = to || req.user.email;
    const result = await sendEmail({
      to: recipient,
      subject: "LibraryHub Test Notification 📬",
      htmlContent: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 580px; margin: auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h2 style="color: #0f172a; margin: 0 0 12px;">LibraryHub Brevo Integration Test</h2>
          <p style="color: #475569;">Hello ${req.user.name},</p>
          <p style="color: #475569;">This is a test notification confirming that Brevo transactional email delivery is functioning properly.</p>
          <div style="background: #f1f5f9; padding: 12px; border-radius: 6px; font-size: 13px; color: #475569; margin: 16px 0;">
            <p style="margin: 0;"><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
            <p style="margin: 4px 0 0;"><strong>Recipient:</strong> ${recipient}</p>
          </div>
          <p style="margin-top: 20px; font-size: 12px; color: #94a3b8;">© 2026 LibraryHub Notifications</p>
        </div>
      `,
    });

    res.json({
      message: result.success ? `Test email sent successfully to ${recipient}!` : `Email delivery failed.`,
      result,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to send test email", error: error.message });
  }
});

module.exports = router;

