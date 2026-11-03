const mongoose = require("mongoose");

const bookSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Book title is required"],
      trim: true,
      maxlength: [150, "Title cannot exceed 150 characters"],
    },
    author: {
      type: String,
      required: [true, "Author name is required"],
      trim: true,
      maxlength: [100, "Author name cannot exceed 100 characters"],
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      trim: true,
      maxlength: [50, "Category cannot exceed 50 characters"],
    },
    available: {
      type: Boolean,
      default: true,
    },
    favorite: {
      type: Boolean,
      default: false,
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Price cannot be negative"],
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for high performance querying and aggregation (Experiment 5 & 6)
bookSchema.index({ title: "text", author: "text" });
bookSchema.index({ category: 1 });
bookSchema.index({ available: 1 });
bookSchema.index({ price: 1 });
bookSchema.index({ createdAt: -1 });

const Books = mongoose.model("Books", bookSchema);

module.exports = Books;
