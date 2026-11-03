import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiRequest, normalizeBook } from "./api.js";
import { useLibrary } from "./LibraryContext.jsx";
import { useToast } from "./ToastContext.jsx";
import Navbar from "./Navbar.jsx";
import BookModal from "./BookModal.jsx";
import BookDetailsModal from "./BookDetailsModal.jsx";
import useSocket from "./useSocket.js";
import "./Pages.css";

const CATEGORIES = [
  "All",
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

export default function SearchBooks() {
  const { user, isAdmin } = useLibrary();
  const { showToast } = useToast();
  const navigate = useNavigate();

  // Experiment 5 Server-Side Query States
  const [books, setBooks] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [availableFilter, setAvailableFilter] = useState("all");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [page, setPage] = useState(1);
  const [limit] = useState(8);
  const [totalPages, setTotalPages] = useState(1);
  const [totalBooks, setTotalBooks] = useState(0);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Modals
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingBook, setEditingBook] = useState(null);
  const [viewingBook, setViewingBook] = useState(null);

  // Fetch books from backend using query parameters (Experiment 5)
  const fetchBooks = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams({
        paginate: "true",
        page: String(page),
        limit: String(limit),
        sortBy,
        order: sortOrder,
      });

      if (search.trim()) params.set("search", search.trim());
      if (category !== "All") params.set("category", category);
      if (availableFilter !== "all") params.set("available", availableFilter === "available" ? "true" : "false");

      const data = await apiRequest(`/api/books?${params.toString()}`);

      if (data.books) {
        setBooks(data.books.map(normalizeBook));
        setTotalPages(data.totalPages || 1);
        setTotalBooks(data.total || 0);
      } else if (Array.isArray(data)) {
        setBooks(data.map(normalizeBook));
        setTotalPages(1);
        setTotalBooks(data.length);
      }
    } catch (err) {
      setError(err.message || "Failed to load books from server.");
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, category, availableFilter, sortBy, sortOrder]);

  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  // Real-time synchronization (silent refresh, toasts handled by root App)
  useSocket(fetchBooks, false);

  // Reset to page 1 whenever search, category, or availability changes
  const handleSearchChange = (val) => {
    setSearch(val);
    setPage(1);
  };

  const handleCategoryChange = (val) => {
    setCategory(val);
    setPage(1);
  };

  const handleAvailableFilterChange = (val) => {
    setAvailableFilter(val);
    setPage(1);
  };

  // Borrow Book Handler (Experiment 8)
  const handleBorrowBook = async (book) => {
    if (!user) {
      showToast("Please log in to borrow books from LibraryHub.", "warning");
      navigate("/login");
      return;
    }

    try {
      const res = await apiRequest(`/api/borrow/${book.id}`, { method: "POST" });
      showToast(res.message || `Successfully borrowed "${book.title}"!`, "success");
      fetchBooks();
    } catch (err) {
      showToast(err.message || "Unable to borrow book.", "error");
    }
  };

  return (
    <div className="library-page">
      <Navbar />

      <main className="inner-page">
        <p className="eyebrow">THE BOOKSHELF · EXPERIMENT 05</p>
        <h1>
          Advanced Querying &amp;
          <br />
          <em>Server Search.</em>
        </h1>
        <p className="page-description">
          Fast backend pagination, multi-field search, category filtering, and sorting directly powered by MongoDB.
        </p>

        {/* Experiment 5 Query Controls */}
        <section className="search-panel" style={{ flexWrap: "wrap", gap: "12px" }}>
          <input
            type="search"
            placeholder="Search by title, author, or keyword..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            aria-label="Search books or authors"
            style={{ minWidth: "240px", flex: "1 1 240px" }}
          />

          <select
            value={category}
            onChange={(e) => handleCategoryChange(e.target.value)}
            aria-label="Filter by category"
          >
            {CATEGORIES.map((item) => (
              <option key={item} value={item}>
                {item === "All" ? "All Categories" : item}
              </option>
            ))}
          </select>

          <select
            value={availableFilter}
            onChange={(e) => handleAvailableFilterChange(e.target.value)}
            aria-label="Filter availability"
          >
            <option value="all">All Availability</option>
            <option value="available">✓ Available Only</option>
            <option value="borrowed">↗ Borrowed Only</option>
          </select>

          <select
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [sb, so] = e.target.value.split("-");
              setSortBy(sb);
              setSortOrder(so);
              setPage(1);
            }}
            aria-label="Sort books"
          >
            <option value="createdAt-desc">Newest Additions</option>
            <option value="createdAt-asc">Oldest Additions</option>
            <option value="title-asc">Title: A to Z</option>
            <option value="title-desc">Title: Z to A</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
          </select>

          {isAdmin && (
            <button
              type="button"
              className="main-button"
              style={{ padding: "8px 16px", fontSize: "0.88rem" }}
              onClick={() => {
                setEditingBook(null);
                setIsEditModalOpen(true);
              }}
            >
              ＋ Add Book
            </button>
          )}
        </section>

        <div className="results-heading">
          <h2>Library Collection</h2>
          <span>
            {totalBooks} {totalBooks === 1 ? "book" : "books"} found (Page {page} of {totalPages})
          </span>
        </div>

        {error && (
          <p role="alert" className="status-message" style={{ color: "#ef4444" }}>
            {error}
          </p>
        )}

        {loading ? (
          <p className="status-message">Loading books from database...</p>
        ) : books.length > 0 ? (
          <>
            <div className="book-grid">
              {books.map((book, index) => (
                <article className="book-card" key={book.id}>
                  <div
                    className={`book-cover cover-${(index % 4) + 1}`}
                    onClick={() => setViewingBook(book)}
                    style={{ cursor: "pointer" }}
                    title="Click to view details"
                  >
                    <span>LIBRARYHUB COLLECTION</span>
                    <strong>{book.title}</strong>
                    <small>{book.author}</small>
                  </div>

                  <div className="book-info">
                    <p className="book-category">{book.category}</p>
                    <h3 onClick={() => setViewingBook(book)} style={{ cursor: "pointer" }}>
                      {book.title}
                    </h3>
                    <p className="book-author">By {book.author}</p>
                    <p className="book-price">₹{book.price}</p>

                    <div style={{ margin: "8px 0" }}>
                      <span className={book.available ? "status available" : "status borrowed"}>
                        {book.available ? "✓ Available" : "↗ Borrowed"}
                      </span>
                    </div>

                    {/* Book Actions: Borrow & Edit */}
                    <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
                      {book.available ? (
                        <button
                          type="button"
                          className="main-button"
                          style={{
                            padding: "6px 12px",
                            fontSize: "0.8rem",
                            background: "#059669",
                            flex: 1,
                          }}
                          onClick={() => handleBorrowBook(book)}
                        >
                          Borrow 📖
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled
                          className="main-button"
                          style={{
                            padding: "6px 12px",
                            fontSize: "0.8rem",
                            background: "#94a3b8",
                            opacity: 0.7,
                            flex: 1,
                            cursor: "not-allowed",
                          }}
                        >
                          Unavailable
                        </button>
                      )}

                      {isAdmin && (
                        <button
                          type="button"
                          className="main-button"
                          style={{
                            padding: "6px 10px",
                            fontSize: "0.8rem",
                            background: "#334155",
                          }}
                          onClick={() => {
                            setEditingBook(book);
                            setIsEditModalOpen(true);
                          }}
                          title="Edit Book Details (Experiment 4)"
                        >
                          ✎ Edit
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  gap: "12px",
                  marginTop: "40px",
                  padding: "16px 0",
                }}
              >
                <button
                  type="button"
                  className="main-button"
                  style={{ padding: "8px 16px", fontSize: "0.85rem" }}
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  ← Previous
                </button>

                <span style={{ fontWeight: 600, color: "#334155", fontSize: "0.9rem" }}>
                  Page {page} of {totalPages}
                </span>

                <button
                  type="button"
                  className="main-button"
                  style={{ padding: "8px 16px", fontSize: "0.85rem" }}
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  Next →
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="empty-state">
            <h2>No books found</h2>
            <p>Try refining your search terms or resetting filters.</p>
            <button
              className="main-button"
              onClick={() => {
                setSearch("");
                setCategory("All");
                setAvailableFilter("all");
                setSortBy("createdAt");
                setSortOrder("desc");
                setPage(1);
              }}
            >
              Reset All Filters
            </button>
          </div>
        )}
      </main>

      {/* Book Modals */}
      <BookModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingBook(null);
        }}
        bookToEdit={editingBook}
        onSaved={() => fetchBooks()}
      />

      <BookDetailsModal
        isOpen={Boolean(viewingBook)}
        book={viewingBook}
        onClose={() => setViewingBook(null)}
        onEdit={
          isAdmin
            ? (b) => {
              setViewingBook(null);
              setEditingBook(b);
              setIsEditModalOpen(true);
            }
            : null
        }
        onBorrow={(b) => handleBorrowBook(b)}
      />

      <footer className="site-footer">
        <Link to="/" className="site-logo">
          Library<span>Hub.</span>
        </Link>
        <p>Every book holds a new possibility.</p>
      </footer>
    </div>
  );
}
