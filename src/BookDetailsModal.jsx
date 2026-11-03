import { Link } from "react-router-dom";
import { useLibrary } from "./LibraryContext";
import "./BookModal.css";

export default function BookDetailsModal({ book, isOpen, onClose, onEdit, onBorrow }) {
  const { user } = useLibrary();
  if (!isOpen || !book) return null;

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <span className="modal-kicker">BOOK DETAILS</span>
            <h2>{book.title}</h2>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close dialog">
            ✕
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "16px", padding: "10px 0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #f1f5f9", paddingBottom: "12px" }}>
            <span style={{ color: "#64748b", fontSize: "0.9rem" }}>Author:</span>
            <strong style={{ color: "#0f172a", fontSize: "1rem" }}>{book.author || book.author_name}</strong>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #f1f5f9", paddingBottom: "12px" }}>
            <span style={{ color: "#64748b", fontSize: "0.9rem" }}>Category:</span>
            <span style={{ background: "#f1f5f9", padding: "4px 10px", borderRadius: "12px", fontWeight: "600", fontSize: "0.85rem", color: "#334155" }}>
              {book.category}
            </span>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #f1f5f9", paddingBottom: "12px" }}>
            <span style={{ color: "#64748b", fontSize: "0.9rem" }}>Price / Inventory Valuation:</span>
            <strong style={{ color: "#059669", fontSize: "1.1rem" }}>₹{book.price}</strong>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #f1f5f9", paddingBottom: "12px" }}>
            <span style={{ color: "#64748b", fontSize: "0.9rem" }}>Circulation Status:</span>
            <span
              style={{
                background: book.available ? "#ecfdf5" : "#fef2f2",
                color: book.available ? "#065f46" : "#991b1b",
                padding: "4px 12px",
                borderRadius: "16px",
                fontWeight: "700",
                fontSize: "0.82rem",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <span>{book.available ? "● Available to Borrow" : "● Currently Borrowed"}</span>
            </span>
          </div>

          {book.description && (
            <div style={{ borderBottom: "1px solid #f1f5f9", paddingBottom: "12px" }}>
              <span style={{ color: "#64748b", fontSize: "0.85rem", display: "block", marginBottom: "4px" }}>
                Description:
              </span>
              <p style={{ margin: 0, color: "#334155", lineHeight: "1.5", fontSize: "0.92rem" }}>
                {book.description}
              </p>
            </div>
          )}

          <div style={{ fontSize: "0.78rem", color: "#94a3b8" }}>
            Database ID: <code>{book.id || book._id}</code>
          </div>
        </div>

        <div className="modal-actions" style={{ marginTop: "16px" }}>
          {onEdit && (
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                onClose();
                onEdit(book);
              }}
            >
              ✎ Edit Book
            </button>
          )}

          {book.available && onBorrow ? (
            <button
              type="button"
              className="btn-primary"
              onClick={() => {
                onClose();
                onBorrow(book);
              }}
            >
              📖 Borrow This Book →
            </button>
          ) : !user && book.available ? (
            <Link to="/login" className="btn-primary" style={{ textDecoration: "none", display: "inline-block" }}>
              Login to Borrow →
            </Link>
          ) : (
            <button type="button" className="btn-secondary" onClick={onClose}>
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

