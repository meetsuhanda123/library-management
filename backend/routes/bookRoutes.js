const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const Books = require("../models/Books");
const { optionalAuth, verifyToken, requireAdmin } = require("../middleware/auth");

const allowedFields = [
  "title",
  "author",
  "category",
  "available",
  "favorite",
  "price",
  "description",
  "isbn",
  "publisher",
  "publicationYear",
  "quantity",
];

const pickBookFields = (body) =>
  Object.fromEntries(
    Object.entries(body || {}).filter(([key]) => allowedFields.includes(key))
  );

const validateBookPayload = (book, partial = false) => {
  const errors = [];
  const required = ["title", "author", "category", "price"];

  if (!partial) {
    for (const field of required) {
      if (book[field] === undefined || book[field] === null || book[field] === "") {
        errors.push(`Field '${field}' is required.`);
      }
    }
  }

  if (book.title !== undefined) {
    if (typeof book.title !== "string" || !book.title.trim()) {
      errors.push("Title must be a non-empty string.");
    } else if (book.title.trim().length > 150) {
      errors.push("Title cannot exceed 150 characters.");
    }
  }

  if (book.author !== undefined) {
    if (typeof book.author !== "string" || !book.author.trim()) {
      errors.push("Author must be a non-empty string.");
    } else if (book.author.trim().length > 100) {
      errors.push("Author name cannot exceed 100 characters.");
    }
  }

  if (book.category !== undefined) {
    if (typeof book.category !== "string" || !book.category.trim()) {
      errors.push("Category must be a non-empty string.");
    }
  }

  if (book.price !== undefined) {
    const numPrice = Number(book.price);
    if (isNaN(numPrice) || numPrice < 0) {
      errors.push("Price must be a valid non-negative number.");
    }
  }

  if (book.quantity !== undefined) {
    const qty = Number(book.quantity);
    if (isNaN(qty) || qty < 0) {
      errors.push("Quantity must be a valid non-negative number.");
    }
  }

  if (book.publicationYear !== undefined && book.publicationYear !== "") {
    const yr = Number(book.publicationYear);
    if (isNaN(yr) || yr < 1000 || yr > 2100) {
      errors.push("Publication year must be a valid 4-digit year.");
    }
  }

  if (book.available !== undefined && typeof book.available !== "boolean") {
    errors.push("Available must be a boolean (true or false).");
  }

  if (book.favorite !== undefined && typeof book.favorite !== "boolean") {
    errors.push("Favorite must be a boolean (true or false).");
  }

  return errors;
};

// =========================================================================
// Experiment 6: MongoDB Aggregation Pipeline for Comprehensive Statistics
// Must be defined before /:id route
// =========================================================================
router.get("/stats", async (_req, res) => {
  try {
    const stats = await Books.aggregate([
      {
        $facet: {
          overallStats: [
            {
              $group: {
                _id: null,
                totalBooks: { $sum: 1 },
                availableBooks: {
                  $sum: { $cond: [{ $eq: ["$available", true] }, 1, 0] },
                },
                borrowedBooks: {
                  $sum: { $cond: [{ $eq: ["$available", false] }, 1, 0] },
                },
                favoritesCount: {
                  $sum: { $cond: [{ $eq: ["$favorite", true] }, 1, 0] },
                },
                totalInventoryValue: { $sum: "$price" },
                avgPrice: { $avg: "$price" },
                minPrice: { $min: "$price" },
                maxPrice: { $max: "$price" },
              },
            },
          ],
          categoryBreakdown: [
            {
              $group: {
                _id: "$category",
                count: { $sum: 1 },
                available: {
                  $sum: { $cond: [{ $eq: ["$available", true] }, 1, 0] },
                },
                borrowed: {
                  $sum: { $cond: [{ $eq: ["$available", false] }, 1, 0] },
                },
                avgPrice: { $avg: "$price" },
              },
            },
            { $sort: { count: -1 } },
          ],
        },
      },
    ]);

    const overall = stats[0].overallStats[0] || {
      totalBooks: 0,
      availableBooks: 0,
      borrowedBooks: 0,
      favoritesCount: 0,
      totalInventoryValue: 0,
      avgPrice: 0,
      minPrice: 0,
      maxPrice: 0,
    };

    const categories = stats[0].categoryBreakdown.map((item) => ({
      name: item._id || "Uncategorized",
      count: item.count,
      available: item.available,
      borrowed: item.borrowed,
      avgPrice: Math.round((item.avgPrice || 0) * 100) / 100,
      percentage: overall.totalBooks > 0
        ? Math.round((item.count / overall.totalBooks) * 100)
        : 0,
    }));

    res.json({
      totalBooks: overall.totalBooks,
      availableBooks: overall.availableBooks,
      borrowedBooks: overall.borrowedBooks,
      favoritesCount: overall.favoritesCount,
      totalCategories: categories.length,
      totalInventoryValue: Math.round(overall.totalInventoryValue * 100) / 100,
      avgPrice: Math.round((overall.avgPrice || 0) * 100) / 100,
      minPrice: overall.minPrice || 0,
      maxPrice: overall.maxPrice || 0,
      categoryStats: categories,
    });
  } catch (error) {
    console.error("Aggregation stats error:", error);
    res.status(500).json({ message: "Error generating book statistics", error: error.message });
  }
});

// =========================================================================
// Experiment 5: Advanced Querying, Server-Side Filtering, Searching, & Pagination
// =========================================================================
router.get("/", async (req, res) => {
  try {
    const {
      search,
      category,
      available,
      sortBy = "createdAt",
      order = "desc",
      page,
      limit,
      paginate,
    } = req.query;

    const query = {};

    // Server-side text search by title or author
    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), "i");
      query.$or = [{ title: regex }, { author: regex }, { category: regex }];
    }

    // Category filter
    if (category && category !== "All") {
      query.category = category.trim();
    }

    // Availability filter
    if (available !== undefined && available !== "" && available !== "all") {
      query.available = available === "true" || available === true;
    }

    // Sorting definition
    const allowedSortFields = ["title", "author", "price", "createdAt", "available"];
    const sortField = allowedSortFields.includes(sortBy) ? sortBy : "createdAt";
    const sortOrder = order === "asc" || order === "1" ? 1 : -1;
    const sortCriteria = { [sortField]: sortOrder };

    const total = await Books.countDocuments(query);

    // If pagination requested
    const isPaginated = paginate === "true" || page !== undefined || limit !== undefined;

    if (isPaginated) {
      const pageNum = Math.max(1, parseInt(page, 10) || 1);
      const limitNum = Math.max(1, parseInt(limit, 10) || 8);
      const skip = (pageNum - 1) * limitNum;

      const books = await Books.find(query)
        .sort(sortCriteria)
        .skip(skip)
        .limit(limitNum);

      return res.json({
        books,
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum) || 1,
        hasMore: pageNum * limitNum < total,
      });
    }

    // Default: Return all matching books as array for seamless backwards compatibility
    const books = await Books.find(query).sort(sortCriteria);
    res.setHeader("X-Total-Count", total);
    res.json(books);
  } catch (error) {
    console.error("Error fetching books:", error);
    res.status(500).json({ message: "Error fetching books", error: error.message });
  }
});

// =========================================================================
// Experiment 4: Get Single Book by ID (View Book)
// =========================================================================
router.get("/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid book ID format." });
    }
    const book = await Books.findById(req.params.id);
    if (!book) {
      return res.status(404).json({ message: "Book not found." });
    }
    res.json(book);
  } catch (error) {
    res.status(500).json({ message: "Error fetching book", error: error.message });
  }
});

// =========================================================================
// Experiment 4 & Admin: Add New Book (Admin Only)
// =========================================================================
router.post("/", verifyToken, requireAdmin, async (req, res) => {
  try {
    const payload = pickBookFields(req.body);
    const errors = validateBookPayload(payload, false);

    if (errors.length > 0) {
      return res.status(400).json({
        message: "Validation failed: " + errors.join(" "),
        errors,
      });
    }

    // Ensure price and quantity are numeric
    payload.price = Number(payload.price);
    if (payload.quantity !== undefined && payload.quantity !== "") {
      payload.quantity = Number(payload.quantity);
      if (payload.available === undefined) {
        payload.available = payload.quantity > 0;
      }
    } else {
      payload.quantity = 1;
      if (payload.available === undefined) payload.available = true;
    }

    if (payload.publicationYear !== undefined && payload.publicationYear !== "") {
      payload.publicationYear = Number(payload.publicationYear);
    }

    if (payload.favorite === undefined) payload.favorite = false;

    const book = await Books.create(payload);

    // Real-time broadcast (Socket.IO)
    const io = req.app.get("io");
    if (io) {
      io.emit("book:added", {
        message: `New book added: "${book.title}"`,
        book,
      });
    }

    res.status(201).json({
      message: `Book "${book.title}" added successfully!`,
      book,
    });
  } catch (error) {
    console.error("Error adding book:", error);
    res.status(400).json({ message: "Error adding book", error: error.message });
  }
});

// =========================================================================
// Experiment 4 & Admin: Update Book Details (Admin Only)
// =========================================================================
router.put("/:id", verifyToken, requireAdmin, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid book ID format." });
    }

    const payload = pickBookFields(req.body);
    if (!Object.keys(payload).length) {
      return res.status(400).json({ message: "No valid fields supplied for update." });
    }

    const errors = validateBookPayload(payload, true);
    if (errors.length > 0) {
      return res.status(400).json({
        message: "Validation failed: " + errors.join(" "),
        errors,
      });
    }

    if (payload.price !== undefined) {
      payload.price = Number(payload.price);
    }

    if (payload.quantity !== undefined && payload.quantity !== "") {
      payload.quantity = Number(payload.quantity);
      if (payload.available === undefined) {
        payload.available = payload.quantity > 0;
      }
    }

    if (payload.publicationYear !== undefined && payload.publicationYear !== "") {
      payload.publicationYear = Number(payload.publicationYear);
    }

    const book = await Books.findByIdAndUpdate(
      req.params.id,
      { $set: payload },
      { new: true, runValidators: true }
    );

    if (!book) {
      return res.status(404).json({ message: "Book not found." });
    }

    // Real-time broadcast (Socket.IO)
    const io = req.app.get("io");
    if (io) {
      io.emit("book:updated", {
        message: `Book "${book.title}" was updated`,
        book,
      });
    }

    res.json({
      message: `Book "${book.title}" updated successfully!`,
      book,
    });
  } catch (error) {
    console.error("Error updating book:", error);
    res.status(400).json({ message: "Error updating book", error: error.message });
  }
});

// =========================================================================
// Experiment 4 & Admin: Delete Book (Admin Only)
// =========================================================================
router.delete("/:id", verifyToken, requireAdmin, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid book ID format." });
    }

    const book = await Books.findByIdAndDelete(req.params.id);
    if (!book) {
      return res.status(404).json({ message: "Book not found." });
    }

    // Real-time broadcast (Socket.IO)
    const io = req.app.get("io");
    if (io) {
      io.emit("book:deleted", {
        message: `Book "${book.title}" was deleted`,
        id: req.params.id,
      });
    }

    res.json({
      message: `Book "${book.title}" deleted successfully!`,
      book,
    });
  } catch (error) {
    console.error("Error deleting book:", error);
    res.status(500).json({ message: "Error deleting book", error: error.message });
  }
});

module.exports = router;
