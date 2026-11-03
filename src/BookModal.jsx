import { useState, useEffect } from "react";
import { apiRequest } from "./api.js";
import { useToast } from "./ToastContext.jsx";
import "./BookModal.css";

const CATEGORIES = [
  "Fiction",
  "Non-Fiction",
  "Technology",
  "Science",
  "Self-Help",
  "History",
  "Biography",
  "Philosophy",
  "Business & Finance",
  "Art & Design",
];

export default function BookModal({ isOpen, onClose, bookToEdit, onSaved }) {
  const { showToast } = useToast();

  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [category, setCategory] = useState("Fiction");
  const [price, setPrice] = useState("");
  const [available, setAvailable] = useState(true);
  const [isbn, setIsbn] = useState("");
  const [publisher, setPublisher] = useState("");
  const [publicationYear, setPublicationYear] = useState(new Date().getFullYear());
  const [quantity, setQuantity] = useState("1");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (bookToEdit) {
      setTitle(bookToEdit.title || "");
      setAuthor(bookToEdit.author || bookToEdit.author_name || "");
      setCategory(bookToEdit.category || "Fiction");
      setPrice(bookToEdit.price !== undefined ? String(bookToEdit.price) : "299");
      setAvailable(bookToEdit.available !== undefined ? bookToEdit.available : true);
      setIsbn(bookToEdit.isbn || "");
      setPublisher(bookToEdit.publisher || "");
      setPublicationYear(bookToEdit.publicationYear || new Date().getFullYear());
      setQuantity(bookToEdit.quantity !== undefined ? String(bookToEdit.quantity) : "1");
      setDescription(bookToEdit.description || "");
    } else {
      setTitle("");
      setAuthor("");
      setCategory("Fiction");
      setPrice("350");
      setAvailable(true);
      setIsbn("");
      setPublisher("");
      setPublicationYear(new Date().getFullYear());
      setQuantity("1");
      setDescription("");
    }
    setErrors({});
  }, [bookToEdit, isOpen]);

  if (!isOpen) return null;

  const validate = () => {
    const errs = {};
    if (!title.trim()) {
      errs.title = "Book title is required.";
    } else if (title.trim().length > 150) {
      errs.title = "Title cannot exceed 150 characters.";
    }

    if (!author.trim()) {
      errs.author = "Author name is required.";
    } else if (author.trim().length > 100) {
      errs.author = "Author name cannot exceed 100 characters.";
    }

    if (!category.trim()) {
      errs.category = "Please select or enter a category.";
    }

    const numPrice = Number(price);
    if (price === "" || isNaN(numPrice)) {
      errs.price = "Price must be a valid number.";
    } else if (numPrice < 0) {
      errs.price = "Price cannot be negative.";
    }

    const numQty = Number(quantity);
    if (quantity !== "" && (isNaN(numQty) || numQty < 0)) {
      errs.quantity = "Quantity cannot be negative.";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      showToast("Please correct form errors before saving.", "error");
      return;
    }

    setSubmitting(true);
    const parsedQty = Number(quantity) || 0;
    const payload = {
      title: title.trim(),
      author: author.trim(),
      category: category.trim(),
      price: Number(price),
      available: parsedQty > 0 ? available : false,
      isbn: isbn.trim(),
      publisher: publisher.trim(),
      publicationYear: publicationYear ? Number(publicationYear) : undefined,
      quantity: parsedQty,
      description: description.trim(),
    };

    try {
      let result;
      if (bookToEdit && bookToEdit.id) {
        // Edit Operation (PUT)
        result = await apiRequest(`/api/books/${bookToEdit.id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        showToast(result.message || `Updated "${title}" successfully!`, "success");
      } else {
        // Add Operation (POST)
        result = await apiRequest("/api/books", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        showToast(result.message || `Added "${title}" to library!`, "success");
      }

      if (onSaved) onSaved(result.book);
      onClose();
    } catch (err) {
      showToast(err.message || "Failed to save book.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <span className="modal-kicker">EXPERIMENT 04 · BOOK FORM</span>
            <h2>{bookToEdit ? "Edit Book Details" : "Add New Book"}</h2>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close dialog">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form" noValidate>
          <div className="form-group">
            <label htmlFor="modal-title">
              Book Title <span className="req">*</span>
            </label>
            <input
              id="modal-title"
              type="text"
              placeholder="e.g. Sapiens: A Brief History of Humankind"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={errors.title ? "input-error" : ""}
              required
            />
            {errors.title && <p className="field-error">{errors.title}</p>}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="modal-author">
                Author <span className="req">*</span>
              </label>
              <input
                id="modal-author"
                type="text"
                placeholder="e.g. Yuval Noah Harari"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                className={errors.author ? "input-error" : ""}
                required
              />
              {errors.author && <p className="field-error">{errors.author}</p>}
            </div>

            <div className="form-group">
              <label htmlFor="modal-category">
                Category <span className="req">*</span>
              </label>
              <select
                id="modal-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className={errors.category ? "input-error" : ""}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              {errors.category && <p className="field-error">{errors.category}</p>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="modal-isbn">ISBN / Barcode (Optional)</label>
              <input
                id="modal-isbn"
                type="text"
                placeholder="e.g. 978-0062315007"
                value={isbn}
                onChange={(e) => setIsbn(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="modal-publisher">Publisher (Optional)</label>
              <input
                id="modal-publisher"
                type="text"
                placeholder="e.g. HarperOne"
                value={publisher}
                onChange={(e) => setPublisher(e.target.value)}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="modal-price">
                Price (₹) <span className="req">*</span>
              </label>
              <input
                id="modal-price"
                type="number"
                min="0"
                step="1"
                placeholder="399"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className={errors.price ? "input-error" : ""}
                required
              />
              {errors.price && <p className="field-error">{errors.price}</p>}
            </div>

            <div className="form-group">
              <label htmlFor="modal-year">Publication Year (Optional)</label>
              <input
                id="modal-year"
                type="number"
                min="1000"
                max="2100"
                placeholder="e.g. 2024"
                value={publicationYear}
                onChange={(e) => setPublicationYear(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="modal-qty">Quantity in Stock</label>
              <input
                id="modal-qty"
                type="number"
                min="0"
                step="1"
                placeholder="1"
                value={quantity}
                onChange={(e) => {
                  const val = e.target.value;
                  setQuantity(val);
                  if (Number(val) === 0) setAvailable(false);
                  else if (Number(val) > 0) setAvailable(true);
                }}
                className={errors.quantity ? "input-error" : ""}
              />
              {errors.quantity && <p className="field-error">{errors.quantity}</p>}
            </div>
          </div>

          <div className="form-group checkbox-group" style={{ marginBottom: "16px" }}>
            <label className="checkbox-label" htmlFor="modal-available">
              <input
                id="modal-available"
                type="checkbox"
                checked={available}
                onChange={(e) => setAvailable(e.target.checked)}
              />
              <span>Mark book as Available for Borrowing</span>
            </label>
          </div>

          <div className="form-group">
            <label htmlFor="modal-desc">Description / Synopsis (Optional)</label>
            <textarea
              id="modal-desc"
              rows="3"
              placeholder="Brief summary or subject matter..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? "Saving to Database..." : bookToEdit ? "Save Changes →" : "Add Book →"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

