import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiRequest } from "./api.js";
import { useLibrary } from "./LibraryContext.jsx";
import { useToast } from "./ToastContext.jsx";
import Navbar from "./Navbar.jsx";
import "./Pages.css";

export default function MyBooks() {
  const { user, loading: authLoading } = useLibrary();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("active"); // 'active' | 'history'

  const fetchLoans = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError("");

    try {
      const data = await apiRequest("/api/borrow/my-loans");
      setLoans(data);
    } catch (err) {
      setError(err.message || "Failed to load borrowed books.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading && !user) {
      showToast("Please sign in to view your borrowed books.", "info");
      navigate("/login");
      return;
    }
    if (user) {
      fetchLoans();
    }
  }, [user, authLoading, navigate, fetchLoans, showToast]);

  const handleReturnBook = async (recordId, bookTitle) => {
    try {
      const res = await apiRequest(`/api/borrow/return/${recordId}`, {
        method: "POST",
      });
      showToast(res.message || `Returned "${bookTitle}" successfully!`, "success");
      fetchLoans();
    } catch (err) {
      showToast(err.message || "Failed to return book.", "error");
    }
  };

  const activeLoans = loans.filter((l) => l.status === "borrowed" || l.status === "overdue");
  const returnedHistory = loans.filter((l) => l.status === "returned");

  return (
    <div className="library-page">
      <Navbar />

      <main className="inner-page">
        <p className="eyebrow">PATRON LOANS · EXPERIMENT 08</p>
        <h1>
          My Borrowed Books &amp;
          <br />
          <em>Reading History.</em>
        </h1>
        <p className="page-description">
          Review currently checked out books, observe return due dates, and return books back to the shelves.
        </p>

        {/* Tab switch */}
        <div style={{ display: "flex", gap: "10px", margin: "24px 0" }}>
          <button
            className={`main-button ${tab === "active" ? "" : "btn-secondary"}`}
            style={{
              padding: "10px 18px",
              background: tab === "active" ? "#0f172a" : "#ffffff",
              color: tab === "active" ? "#ffffff" : "#475569",
              border: "1px solid #cbd5e1",
            }}
            onClick={() => setTab("active")}
          >
            📖 Currently Borrowed ({activeLoans.length})
          </button>
          <button
            className={`main-button ${tab === "history" ? "" : "btn-secondary"}`}
            style={{
              padding: "10px 18px",
              background: tab === "history" ? "#0f172a" : "#ffffff",
              color: tab === "history" ? "#ffffff" : "#475569",
              border: "1px solid #cbd5e1",
            }}
            onClick={() => setTab("history")}
          >
            ✓ Reading History ({returnedHistory.length})
          </button>
        </div>

        {error && <p role="alert" className="status-message" style={{ color: "#ef4444" }}>{error}</p>}

        {loading ? (
          <p className="status-message">Loading your library loans...</p>
        ) : tab === "active" ? (
          activeLoans.length > 0 ? (
            <div className="book-grid">
              {activeLoans.map((loan, index) => {
                const book = loan.book || {};
                const isOverdue = loan.status === "overdue" || new Date(loan.dueDate) < new Date();
                const dueDateFormatted = new Date(loan.dueDate).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                });

                return (
                  <article className="book-card" key={loan._id}>
                    <div className={`book-cover cover-${(index % 4) + 1}`}>
                      <span>LIBRARY LOAN</span>
                      <strong>{book.title || "Book Title"}</strong>
                      <small>{book.author || "Author"}</small>
                    </div>

                    <div className="book-info">
                      <p className="book-category">{book.category || "General"}</p>
                      <h3>{book.title}</h3>
                      <p className="book-author">By {book.author}</p>

                      <div
                        style={{
                          margin: "12px 0",
                          padding: "10px",
                          borderRadius: "8px",
                          background: isOverdue ? "#fef2f2" : "#f0fdf4",
                          border: `1px solid ${isOverdue ? "#fecaca" : "#bbf7d0"}`,
                        }}
                      >
                        <p
                          style={{
                            margin: 0,
                            fontSize: "0.82rem",
                            fontWeight: "700",
                            color: isOverdue ? "#991b1b" : "#166534",
                          }}
                        >
                          {isOverdue ? "⚠ OVERDUE" : "✓ ON LOAN"}
                        </p>
                        <p style={{ margin: "4px 0 0", fontSize: "0.8rem", color: "#475569" }}>
                          Due Date: <strong>{dueDateFormatted}</strong>
                        </p>
                        {loan.fine > 0 && (
                          <p style={{ margin: "4px 0 0", fontSize: "0.8rem", color: "#dc2626", fontWeight: "600" }}>
                            Late Fine: ₹{loan.fine}
                          </p>
                        )}
                      </div>

                      <button
                        type="button"
                        className="main-button"
                        style={{ width: "100%", background: "#059669", padding: "10px" }}
                        onClick={() => handleReturnBook(loan._id, book.title)}
                      >
                        Return to Library ↺
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="empty-state">
              <span>📚</span>
              <h2>No books currently checked out</h2>
              <p>Explore the collection catalog and borrow books to start reading.</p>
              <Link to="/search-books" className="main-button">
                Browse Books to Borrow →
              </Link>
            </div>
          )
        ) : (
          /* Reading History Tab */
          returnedHistory.length > 0 ? (
            <div className="table-responsive" style={{ background: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Book Title</th>
                    <th>Author</th>
                    <th>Category</th>
                    <th>Issued On</th>
                    <th>Returned On</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {returnedHistory.map((rec) => (
                    <tr key={rec._id}>
                      <td><strong>{rec.book?.title}</strong></td>
                      <td>{rec.book?.author}</td>
                      <td><span className="category-chip">{rec.book?.category}</span></td>
                      <td>{new Date(rec.issueDate).toLocaleDateString()}</td>
                      <td>{rec.returnDate ? new Date(rec.returnDate).toLocaleDateString() : "—"}</td>
                      <td><span className="status-pill pill-returned">Returned</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">
              <h2>No past borrowing history</h2>
              <p>Books returned in the future will be listed here.</p>
            </div>
          )
        )}
      </main>

      <footer className="site-footer">
        <Link to="/" className="site-logo">
          Library<span>Hub.</span>
        </Link>
        <p>A quiet corner for curious minds.</p>
      </footer>
    </div>
  );
}

