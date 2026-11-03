const mongoose = require("mongoose");

const borrowRecordSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    book: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Books",
      required: true,
    },
    issueDate: {
      type: Date,
      default: Date.now,
    },
    dueDate: {
      type: Date,
      default: () => new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days lending period
    },
    returnDate: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ["borrowed", "returned", "overdue"],
      default: "borrowed",
    },
    fine: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

borrowRecordSchema.index({ user: 1, status: 1 });
borrowRecordSchema.index({ book: 1, status: 1 });
borrowRecordSchema.index({ dueDate: 1 });

const BorrowRecord = mongoose.model("BorrowRecord", borrowRecordSchema);

module.exports = BorrowRecord;

