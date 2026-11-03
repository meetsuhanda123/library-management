
import { useState } from "react";
import { Link } from "react-router-dom";
import { useLibrary } from "../LibraryContext.jsx";
import {
  Experiment3Provider,
  useExperiment3,
} from "./Experiment3Context.jsx";
import "./Experiment3.css";

function LibraryDashboard() {
  const { user, isAdmin } = useLibrary();
  const {
    books,
    search,
    category,
    availableOnly,
    favoritesOnly,
    filteredBooks,
    dispatch,
    addBook,
    removeBook,
    toggleFavorite,
    loading,
    error,
  } = useExperiment3();

  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [newCategory, setNewCategory] = useState("Fiction");
  const [newPrice, setNewPrice] = useState("350");
  const [formError, setFormError] = useState("");

  const availableCount = books.filter(
    (book) => book.available
  ).length;

  const borrowedCount = books.length - availableCount;

  async function handleAddBook(event) {
    event.preventDefault();

    if (!title.trim() || !author.trim()) {
      setFormError("Please enter both book title and author.");
      return;
    }

    try {
      await addBook({
        title: title.trim(),
        author: author.trim(),
        category: newCategory,
        price: Number(newPrice) || 299,
      });
    } catch (err) {
      setFormError(err.message || "Unable to save book.");
      return;
    }

    setTitle("");
    setAuthor("");
    setNewCategory("Fiction");
    setNewPrice("350");
    setFormError("");
    setShowForm(false);
  }

  return (
    <div className="exp3-page">
      <header className="exp3-navbar">
        <Link to="/" className="exp3-logo">
          Library<span>Hub.</span>
        </Link>

        <nav className="exp3-nav-links">
          <Link to="/">Home</Link>
          <Link to="/search-books">Search Books</Link>
          <Link to="/statistics">Statistics</Link>
          <Link to="/login" className="exp3-login-link">
            Login ↗
          </Link>
        </nav>
      </header>

      <main className="exp3-container">
        <section className="exp3-hero">
          <div>
            <p className="exp3-eyebrow">
              EXPERIMENT 03 · BOOK MANAGEMENT
            </p>

            <h1>
              Your library,
              <br />
              your <em>next story.</em>
            </h1>

            <p className="exp3-description">
              Discover books, manage your collection, and save
              the stories you love in one place.
            </p>

            {isAdmin && (
              <button
                className="exp3-primary-btn"
                onClick={() => setShowForm(!showForm)}
              >
                {showForm ? "Close form −" : "＋ Add a book"}
              </button>
            )}
          </div>

          <div className="exp3-hero-art">
            <div className="exp3-sun"></div>
            <div className="exp3-decor-book decor-book-one">
              <span>READ</span>
            </div>
            <div className="exp3-decor-book decor-book-two">
              <span>DREAM</span>
            </div>
            <div className="exp3-decor-book decor-book-three">
              <span>DISCOVER</span>
            </div>
            <p>One more chapter.</p>
          </div>
        </section>

        <section className="exp3-stats-grid">
          <article className="exp3-stat-card">
            <span className="exp3-stat-icon">▤</span>
            <p>Total books</p>
            <strong>{books.length}</strong>
            <small>In your collection</small>
          </article>

          <article className="exp3-stat-card exp3-stat-available">
            <span className="exp3-stat-icon">✓</span>
            <p>Available books</p>
            <strong>{availableCount}</strong>
            <small>Ready to borrow</small>
          </article>

          <article className="exp3-stat-card exp3-stat-borrowed">
            <span className="exp3-stat-icon">↗</span>
            <p>Borrowed books</p>
            <strong>{borrowedCount}</strong>
            <small>Currently unavailable</small>
          </article>

          <article className="exp3-stat-card exp3-stat-favorites">
            <span className="exp3-stat-icon">♡</span>
            <p>Favourites</p>
            <strong>
              {books.filter((book) => book.favorite).length}
            </strong>
            <small>Your saved reads</small>
          </article>
        </section>

        {error && <p className="exp3-error" role="alert">{error}</p>}
        {isAdmin && showForm && (
          <section className="exp3-form-panel">
            <p className="exp3-eyebrow">GROW YOUR COLLECTION</p>
            <h2>Add a new book.</h2>

            <form onSubmit={handleAddBook}>
              <div className="exp3-form-grid">
                <label>
                  Book title
                  <input
                    type="text"
                    placeholder="Enter book title"
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    required
                  />
                </label>

                <label>
                  Author
                  <input
                    type="text"
                    placeholder="Enter author's name"
                    value={author}
                    onChange={(event) => setAuthor(event.target.value)}
                    required
                  />
                </label>

                <label>
                  Category
                  <select
                    value={newCategory}
                    onChange={(event) =>
                      setNewCategory(event.target.value)
                    }
                  >
                    <option value="Fiction">Fiction</option>
                    <option value="Self-Help">Self-Help</option>
                    <option value="Technology">Technology</option>
                    <option value="Science">Science</option>
                    <option value="History">History</option>
                  </select>
                </label>

                <label>
                  Price (₹)
                  <input
                    type="number"
                    min="0"
                    placeholder="350"
                    value={newPrice}
                    onChange={(event) => setNewPrice(event.target.value)}
                    required
                  />
                </label>
              </div>

              {formError && (
                <p className="exp3-error">{formError}</p>
              )}

              <button className="exp3-primary-btn" type="submit">
                Save book →
              </button>
            </form>
          </section>
        )}

        <section className="exp3-collection">
          <div className="exp3-section-heading">
            <div>
              <p className="exp3-eyebrow">EXPLORE THE SHELVES</p>
              <h2>Find your next <em>read.</em></h2>
            </div>
            <span className="exp3-result-count">
              {filteredBooks.length} books found
            </span>
          </div>

          <div className="exp3-filters">
            <input
              type="search"
              placeholder="Search by title or author..."
              value={search}
              onChange={(event) =>
                dispatch({
                  type: "SET_SEARCH",
                  payload: event.target.value,
                })
              }
              aria-label="Search by title or author"
            />

            <select
              value={category}
              onChange={(event) =>
                dispatch({
                  type: "SET_CATEGORY",
                  payload: event.target.value,
                })
              }
              aria-label="Filter books by category"
            >
              <option value="All">All categories</option>
              <option value="Fiction">Fiction</option>
              <option value="Self-Help">Self-Help</option>
              <option value="Technology">Technology</option>
              <option value="Science">Science</option>
              <option value="History">History</option>
            </select>

            <button
              type="button"
              className={
                availableOnly
                  ? "exp3-filter-btn selected"
                  : "exp3-filter-btn"
              }
              onClick={() =>
                dispatch({ type: "TOGGLE_AVAILABLE" })
              }
            >
              ✓ Available
            </button>

            <button
              type="button"
              className={
                favoritesOnly
                  ? "exp3-filter-btn selected"
                  : "exp3-filter-btn"
              }
              onClick={() =>
                dispatch({ type: "TOGGLE_FAVORITES_FILTER" })
              }
            >
              ♥ Favourites
            </button>

            <button
              type="button"
              className="exp3-reset-btn"
              onClick={() => dispatch({ type: "RESET_FILTERS" })}
            >
              Reset
            </button>
          </div>

          {loading ? <p>Loading books...</p> : filteredBooks.length === 0 ? (
            <div className="exp3-empty-state">
              <span>📚</span>
              <h3>No books found</h3>
              <p>Try another search or reset your filters.</p>
              <button
                className="exp3-primary-btn"
                onClick={() => dispatch({ type: "RESET_FILTERS" })}
              >
                Reset filters
              </button>
            </div>
          ) : (
            <div className="exp3-book-grid">
              {filteredBooks.map((book, index) => (
                <article className="exp3-book-card" key={book.id}>
                  <div
                    className={`exp3-book-cover exp3-cover-${(index % 4) + 1}`}
                  >
                    <span className="exp3-cover-label">
                      LIBRARYHUB COLLECTION
                    </span>

                    <button
                      type="button"
                      className={
                        book.favorite
                          ? "exp3-favorite-btn is-favorite"
                          : "exp3-favorite-btn"
                      }
                      onClick={async () => { try { await toggleFavorite(book); } catch (err) { window.alert(err.message); } }}
                      aria-label={
                        book.favorite
                          ? "Remove from favourites"
                          : "Add to favourites"
                      }
                    >
                      {book.favorite ? "♥" : "♡"}
                    </button>

                    <strong>{book.title}</strong>
                    <span className="exp3-cover-author">
                      {book.author}
                    </span>
                  </div>

                  <div className="exp3-book-info">
                    <span className="exp3-category-tag">
                      {book.category}
                    </span>

                    <h3>{book.title}</h3>
                    <p>By {book.author}</p>

                    <div className="exp3-book-bottom">
                      <span
                        className={
                          book.available
                            ? "exp3-status is-available"
                            : "exp3-status is-borrowed"
                        }
                      >
                        {book.available ? "Available" : "Borrowed"}
                      </span>

                      {isAdmin && (
                        <button
                          type="button"
                          className="exp3-remove-btn"
                          onClick={() => {
                            const confirmed = window.confirm(
                              `Remove "${book.title}" from the collection?`
                            );

                            if (confirmed) {
                              removeBook(book.id).catch((err) => window.alert(err.message));
                            }
                          }}
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>

      <footer className="exp3-footer">
        <Link to="/" className="exp3-logo">
          Library<span>Hub.</span>
        </Link>
        <p>A quiet corner for curious minds.</p>
        <span>Experiment 03 · Library Management System</span>
      </footer>
    </div>
  );
}

export default function Experiment3() {
  return (
    <Experiment3Provider>
      <LibraryDashboard />
    </Experiment3Provider>
  );
}
