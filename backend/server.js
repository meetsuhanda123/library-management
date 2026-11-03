const http = require("http");
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const { Server } = require("socket.io");
require("dotenv").config();

const User = require("./models/User");

const app = express();
const server = http.createServer(app);

// Allowed frontend origins (Local & Production Vercel)
const defaultOrigins = [
  "https://library-management-rose-eight.vercel.app",
  "http://localhost:5273",
  "http://localhost:5173",
  "http://localhost:5174",
  "http://127.0.0.1:5273",
  "http://127.0.0.1:5173",
  "http://localhost:80",
];

const envOrigins = (process.env.CLIENT_URL || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const allowedOrigins = Array.from(new Set([...defaultOrigins, ...envOrigins]));

// Universal origin validator for local dev, Vercel deployments, and Render domains
function isOriginAllowed(origin) {
  if (!origin) return true; // Server-to-server or curl requests
  if (allowedOrigins.includes(origin)) return true;
  if (origin.startsWith("http://localhost:") || origin.startsWith("http://127.0.0.1:")) return true;
  if (origin.endsWith(".vercel.app") || origin.endsWith(".onrender.com")) return true;
  return false;
}

// Socket.IO Setup (Experiment 8 Real-time Notifications)
const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (isOriginAllowed(origin)) {
        return callback(null, true);
      }
      return callback(null, true); // Allow during production handshakes
    },
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  },
});

// Attach socket.io instance to Express app for routes
app.set("io", io);

io.on("connection", (socket) => {
  console.log(`[Socket.IO] Client connected: ${socket.id}`);
  socket.on("disconnect", () => {
    console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
  });
});

// CORS Configuration & Middleware
const corsOptions = {
  origin(origin, callback) {
    if (isOriginAllowed(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`Origin not allowed by CORS: ${origin}`));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));

app.use(express.json({ limit: "2mb" }));

// Health Check
app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    database: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    databaseName: mongoose.connection.name || null,
    time: new Date().toISOString(),
  });
});

// API Routes
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/books", require("./routes/bookRoutes"));
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/borrow", require("./routes/borrowRoutes"));

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// Global Error Handler
app.use((err, _req, res, _next) => {
  console.error("Server Error:", err.message);
  const statusCode = err.message && err.message.startsWith("Origin not allowed by CORS")
    ? 403
    : 500;

  res.status(statusCode).json({
    message: err.message || "Internal server error",
  });
});

// Database & Seed Function
async function seedInitialAdmin() {
  try {
    const adminExists = await User.findOne({ role: "admin" });
    if (!adminExists) {
      const defaultAdmin = await User.create({
        name: "Library Administrator",
        email: "admin@libraryhub.com",
        password: "Admin@12345",
        role: "admin",
        isActive: true,
      });
      console.log("--------------------------------------------------");
      console.log("Seeded Default Admin Account:");
      console.log(`Email: ${defaultAdmin.email}`);
      console.log("Password: Admin@12345");
      console.log("Role: admin");
      console.log("--------------------------------------------------");
    }
  } catch (error) {
    console.error("Error seeding initial admin:", error.message);
  }
}

// Start Server & Connect Database with resilient auto-retry
const PORT = process.env.PORT || 5000;

let isConnecting = false;

async function connectToMongo() {
  if (mongoose.connection.readyState === 1 || isConnecting) return;
  isConnecting = true;

  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is missing in backend/.env");
    }

    await mongoose.connect(process.env.MONGO_URI);

    console.log("-----------------------------------");
    console.log("MongoDB Atlas connected successfully!");
    console.log("Connected Database:", mongoose.connection.name);
    console.log("-----------------------------------");

    await seedInitialAdmin();
  } catch (error) {
    console.warn("[MongoDB Atlas Warning]:", error.message);
    console.warn("Retrying database connection in 5 seconds...");
    setTimeout(connectToMongo, 5000);
  } finally {
    isConnecting = false;
  }
}

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
  console.log("Allowed Frontend Origins:", allowedOrigins);
  connectToMongo();
});
