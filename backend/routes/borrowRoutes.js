const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const Books = require("../models/Books");
const BorrowRecord = require("../models/BorrowRecord");
const { verifyToken, requireAdmin } = require("../middleware/auth");
const {
  sendBorrowConfirmation,
  sendReturnConfirmation,
} = require("../services/emailService");

// Helper to flag overdue records
function enrichRecord(rec) {
  const obj = rec.toObject ? rec.toObject() : rec;
  if (obj.status === "borrowed" && new Date(obj.dueDate) < new Date()) {
    obj.status = "overdue";
    const daysOverdue = Math.ceil(
      (new Date() - new Date(obj.dueDate)) / (1000 * 60 * 60 * 24)
    );
    obj.daysOverdue = daysOverdue;
    obj.fine = daysOverdue * 5; // e.g., ₹5 per overdue day
  }
  return obj;
}

// =========================================================================
// POST /api/borrow/:bookId - Borrow an available book
// =========================================================================
router.post("/:bookId", verifyToken, async (req, res) => {
  try {
    const { bookId } = req.params;

    if (!mongoose.isValidObjectId(bookId)) {
      return res.status(400).json({ message: "Invalid book ID format." });
    }

    const book = await Books.findById(bookId);
    if (!book) {
      return res.status(404).json({ message: "Book not found." });
    }

    if (!book.available) {
      return res.status(400).json({
        message: `"${book.title}" is currently unavailable for borrowing.`,
      });
    }

    // Check if user already borrowed this book and hasn't returned it yet
    const activeBorrow = await BorrowRecord.findOne({
      user: req.user._id,
      book: book._id,
      status: "borrowed",
    });

    if (activeBorrow) {
      return res.status(400).json({
        message: `You already have "${book.title}" issued on your account.`,
      });
    }

    // Create loan record (14 days lending period)
    const issueDate = new Date();
    const dueDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

    const record = await BorrowRecord.create({
      user: req.user._id,
      book: book._id,
      issueDate,
      dueDate,
      status: "borrowed",
    });

    // Mark book unavailable in library inventory
    book.available = false;
    await book.save();

    // Populate for response
    await record.populate("book", "title author category price");

    // Real-time broadcast
    const io = req.app.get("io");
    if (io) {
      io.emit("book:borrowed", {
        message: `"${book.title}" was borrowed by ${req.user.name}`,
        bookId: book._id,
        user: { name: req.user.name },
      });
    }

    // Brevo email notification
    sendBorrowConfirmation(req.user, book, record).catch((e) =>
      console.error("Borrow email error:", e)
    );

    res.status(201).json({
      message: `Successfully borrowed "${book.title}"! Due date: ${dueDate.toLocaleDateString()}`,
      record,
    });
  } catch (error) {
    console.error("Borrow error:", error);
    res.status(500).json({ message: "Failed to borrow book", error: error.message });
  }
});

// =========================================================================
// POST /api/borrow/return/:recordId - Return a borrowed book
// =========================================================================
router.post("/return/:recordId", verifyToken, async (req, res) => {
  try {
    const { recordId } = req.params;

    if (!mongoose.isValidObjectId(recordId)) {
      return res.status(400).json({ message: "Invalid transaction ID format." });
    }

    const record = await BorrowRecord.findById(recordId).populate("book");
    if (!record) {
      return res.status(404).json({ message: "Borrow record not found." });
    }

    // Only borrower or an admin can confirm return
    if (
      record.user.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        message: "You are not authorized to return this book record.",
      });
    }

    if (record.status === "returned") {
      return res.status(400).json({ message: "This book has already been returned." });
    }

    // Calculate fine if overdue
    const now = new Date();
    let fine = 0;
    if (now > new Date(record.dueDate)) {
      const daysOverdue = Math.ceil(
        (now - new Date(record.dueDate)) / (1000 * 60 * 60 * 24)
      );
      fine = daysOverdue * 5;
    }

    record.returnDate = now;
    record.status = "returned";
    record.fine = fine;
    await record.save();

    // Mark book as available again
    if (record.book) {
      await Books.findByIdAndUpdate(record.book._id, { available: true });
    }

    // Real-time broadcast
    const io = req.app.get("io");
    if (io) {
      io.emit("book:returned", {
        message: `"${record.book ? record.book.title : 'Book'}" has been returned`,
        bookId: record.book ? record.book._id : null,
      });
    }

    // Brevo email notification
    if (record.book) {
      sendReturnConfirmation(req.user, record.book).catch((e) =>
        console.error("Return email error:", e)
      );
    }

    res.json({
      message: `Book "${record.book ? record.book.title : ''}" returned successfully!`,
      record,
    });
  } catch (error) {
    console.error("Return error:", error);
    res.status(500).json({ message: "Failed to return book", error: error.message });
  }
});

// =========================================================================
// GET /api/borrow/my-loans (or /history) - Current user loans
// =========================================================================
router.get(["/my-loans", "/history"], verifyToken, async (req, res) => {
  try {
    const records = await BorrowRecord.find({ user: req.user._id })
      .populate("book")
      .sort({ createdAt: -1 });

    const enriched = records.map(enrichRecord);
    res.json(enriched);
  } catch (error) {
    console.error("Error fetching my loans:", error);
    res.status(500).json({ message: "Failed to fetch loans", error: error.message });
  }
});

// =========================================================================
// GET /api/borrow/all - Admin: View all borrowing transactions
// =========================================================================
router.get("/all", verifyToken, requireAdmin, async (req, res) => {
  try {
    const { status, search } = req.query;
    const filter = {};

    if (status && ["borrowed", "returned", "overdue"].includes(status)) {
      if (status === "overdue") {
        filter.status = "borrowed";
        filter.dueDate = { $lt: new Date() };
      } else {
        filter.status = status;
      }
    }

    const records = await BorrowRecord.find(filter)
      .populate("user", "name email role")
      .populate("book", "title author category price available")
      .sort({ createdAt: -1 });

    let enriched = records.map(enrichRecord);

    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      enriched = enriched.filter(
        (r) =>
          (r.book && r.book.title.toLowerCase().includes(q)) ||
          (r.user && r.user.name.toLowerCase().includes(q)) ||
          (r.user && r.user.email.toLowerCase().includes(q))
      );
    }

    res.json(enriched);
  } catch (error) {
    console.error("Error fetching all loans:", error);
    res.status(500).json({ message: "Failed to fetch transactions", error: error.message });
  }
});

// =========================================================================
// GET /api/borrow/summary - Admin Overview Summary
// =========================================================================
router.get("/summary", verifyToken, requireAdmin, async (_req, res) => {
  try {
    const totalTransactions = await BorrowRecord.countDocuments();
    const activeLoans = await BorrowRecord.countDocuments({ status: "borrowed" });
    const returnedLoans = await BorrowRecord.countDocuments({ status: "returned" });
    const overdueLoans = await BorrowRecord.countDocuments({
      status: "borrowed",
      dueDate: { $lt: new Date() },
    });

    res.json({
      totalTransactions,
      activeLoans,
      returnedLoans,
      overdueLoans,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch borrowing summary", error: error.message });
  }
});

module.exports = router;

