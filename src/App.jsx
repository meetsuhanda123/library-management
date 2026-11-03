import { useState } from "react";
import {
  Link,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import Login from "./Login.jsx";
import { useLibrary } from "./LibraryContext.jsx";
import { useToast } from "./ToastContext.jsx";
import useBooks from "./useBooks.js";
import useSocket from "./useSocket.js";
import Navbar from "./Navbar.jsx";
import BookModal from "./BookModal.jsx";
import BookDetailsModal from "./BookDetailsModal.jsx";
import SearchBooks from "./SearchBooks.jsx";
import Statistics from "./Statistics.jsx";
import MyBooks from "./MyBooks.jsx";
import AdminDashboard from "./admin/AdminDashboard.jsx";
import Experiment3 from "./experiment3/Experiment3.jsx";
import { apiRequest } from "./api.js";
import "./App.css";

function Dashboard() {
  const { user } = useLibrary();
  const { showToast } = useToast();

  const {
    books = [],
    search = "",
    setSearch,
    category = "All",
    setCategory,
    loading = false,
    error = "",
    filteredBooks = [],
    refreshBooks,
  } = useBooks();

  // Experiment 8 Real-time WebSocket connection
  useSocket(() => {
    refreshBooks();
  });

  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [editingBook, setEditingBook] = useState(null);
  const [viewingBook, setViewingBook] = useState(null);

  const collection = filteredBooks || books;

  const handleBorrowBook = async (book) => {
    if (!user) {
      showToast("Please log in to borrow books from LibraryHub.", "warning");
      return;
    }

    try {
      const res = await apiRequest(`/api/borrow/${book.id}`, { method: "POST" });
      showToast(res.message || `Successfully borrowed "${book.title}"!`, "success");
      refreshBooks();
    } catch (err) {
      showToast(err.message || "Failed to borrow book.", "error");
    }
  };

  return (
    <div className="library-app">
      <Navbar />

      <main>
        <section className="hero" id="home">
          <div className="hero-copy">
            <div className="eyebrow">
              <span></span> WELCOME TO YOUR DIGITAL LIBRARY
            </div>

            <h1>
              Discover Your Next
              <br />
              Favourite Book<span className="gold-dot">.</span>
            </h1>

            <p>
              Explore a world of knowledge, discover inspiring stories, and make reading a part of your everyday life.
            </p>

            <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
              <Link className="explore-btn" to="/search-books">
                Explore Books <span>→</span>
              </Link>
              <button
                type="button"
                className="explore-btn"
                style={{ background: "#104536", color: "#f8f7f0", border: "1px solid #d6bd80" }}
                onClick={() => {
                  setEditingBook(null);
                  setIsBookModalOpen(true);
                }}
              >
                ＋ Add a Book
              </button>
            </div>
          </div>

          <div className="hero-art" aria-label="Illustration of stacked books">
            <div className="art-glow"></div>
            <span className="leaf leaf-one">🌿</span>

            <div className="book-stack">
              <div className="illustrated-book book-one">
                <span>Better Than Yesterday</span>
              </div>
              <div className="illustrated-book book-two">
                <span>Atomic Habits</span>
              </div>
              <div className="illustrated-book book-three">
                <span>The Alchemist</span>
              </div>
            </div>

            <p className="art-caption">Good books, better days ♡</p>
          </div>
        </section>

        <section className="stats" id="statistics">
          <div className="stat-card">
            <div className="stat-icon mint">📖</div>
            <div>
              <h2>{books.length}</h2>
              <p>Books in Library</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon blue">♟</div>
            <div>
              <h2>{user ? "Active" : "Guest"}</h2>
              <p>{user ? user.role.toUpperCase() : "Member Area"}</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon yellow">✓</div>
            <div>
              <h2>{books.filter((book) => book.available).length}</h2>
              <p>Books Available</p>
            </div>
          </div>
        </section>

        <section className="collection" id="collection">
          <div className="collection-heading">
            <div>
              <div className="eyebrow">
                <span></span> OUR COLLECTION
              </div>

              <h2>Explore Books.</h2>
              <p>Find books by title, author, or category.</p>
            </div>

            <div className="search-tools">
              <label className="search-box">
                <span>⌕</span>
                <input
                  type="search"
                  placeholder="Search books, authors, or categories..."
                  value={search}
                  onChange={(e) => setSearch?.(e.target.value)}
                />
              </label>

              <select
                className="category-select"
                value={category}
                onChange={(e) => setCategory?.(e.target.value)}
                aria-label="Filter by category"
              >
                <option value="All">All Categories</option>
                {[...new Set(books.map((book) => book.category).filter(Boolean))].map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {error ? (
            <p className="status-message" role="alert" style={{ color: "#ef4444" }}>
              {error}
            </p>
          ) : loading ? (
            <p className="status-message">Loading your collection...</p>
          ) : collection.length === 0 ? (
            <div className="empty-state">
              <span>📚</span>
              <h3>Your next favourite book awaits.</h3>
              <p>No books found. Try another search.</p>
            </div>
          ) : (
            <div className="book-grid">
              {collection.slice(0, 8).map((book, index) => (
                <article className="book-card" key={book.book_id ?? book.id ?? index}>
                  <div
                    className={`book-cover cover-${index % 4}`}
                    onClick={() => setViewingBook(book)}
                    style={{ cursor: "pointer" }}
                  >
                    <span className="cover-symbol">✳</span>

                    <span className="cover-title">
                      {book.title || book.name || "Untitled Book"}
                    </span>

                    <span className="cover-line"></span>

                    <span className="cover-author">
                      {book.author_name || book.author || "Library Collection"}
                    </span>
                  </div>

                  <div className="book-info">
                    <span className="book-category">{book.category || "General"}</span>

                    <h3 onClick={() => setViewingBook(book)} style={{ cursor: "pointer" }}>
                      {book.title || book.name || "Untitled Book"}
                    </h3>

                    <p>By {book.author_name || book.author || "Unknown Author"}</p>
                    <p style={{ fontWeight: 700, color: "#104536", margin: "4px 0" }}>
                      ₹{book.price}
                    </p>

                    <div className="book-bottom">
                      <span
                        className="availability"
                        style={{
                          color: book.available ? "#065f46" : "#991b1b",
                          fontWeight: "600",
                        }}
                      >
                        <span></span> {book.available ? "Available" : "Borrowed"}
                      </span>

                      <div style={{ display: "flex", gap: "6px" }}>
                        <button
                          type="button"
                          className="admin-action-btn btn-view"
                          onClick={() => setViewingBook(book)}
                          title="View Details"
                        >
                          👁
                        </button>
                        <button
                          type="button"
                          className="admin-action-btn btn-edit"
                          onClick={() => {
                            setEditingBook(book);
                            setIsBookModalOpen(true);
                          }}
                          title="Edit Book Details (Exp 4)"
                        >
                          ✎
                        </button>
                        {book.available && (
                          <button
                            type="button"
                            className="admin-action-btn btn-primary-action"
                            onClick={() => handleBorrowBook(book)}
                            title="Borrow Book (Exp 8)"
                          >
                            📖 Borrow
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}

          <div className="collection-footer">
            <span>A little reading goes a long way.</span>
            <Link to="/search-books">Browse all books with pagination &amp; sorting →</Link>
          </div>
        </section>
      </main>

      {/* Book Modals */}
      <BookModal
        isOpen={isBookModalOpen}
        onClose={() => {
          setIsBookModalOpen(false);
          setEditingBook(null);
        }}
        bookToEdit={editingBook}
        onSaved={refreshBooks}
      />

      <BookDetailsModal
        isOpen={Boolean(viewingBook)}
        book={viewingBook}
        onClose={() => setViewingBook(null)}
        onEdit={(b) => {
          setViewingBook(null);
          setEditingBook(b);
          setIsBookModalOpen(true);
        }}
        onBorrow={(b) => handleBorrowBook(b)}
      />

      <footer className="site-footer">
        <Link to="/" className="footer-brand">
          📖 LibraryHub
        </Link>
        <p>A quiet corner for curious minds.</p>
        <span>© 2026 LibraryHub · Experiments 01 to 08 Full-Stack System</span>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/search-books" element={<SearchBooks />} />
      <Route path="/statistics" element={<Statistics />} />
      <Route path="/login" element={<Login />} />
      <Route path="/experiment-3" element={<Experiment3 />} />
      <Route path="/my-books" element={<MyBooks />} />
      <Route path="/admin" element={<AdminDashboard />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
