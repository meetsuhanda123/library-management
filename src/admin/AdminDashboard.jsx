import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiRequest, normalizeBook } from "../api.js";
import { useLibrary } from "../LibraryContext.jsx";
import { useToast } from "../ToastContext.jsx";
import Navbar from "../Navbar.jsx";
import BookModal from "../BookModal.jsx";
import BookDetailsModal from "../BookDetailsModal.jsx";
import useSocket from "../useSocket.js";
import "./AdminDashboard.css";

export default function AdminDashboard() {
  const { user, isAdmin, loading: authLoading } = useLibrary();
  const { showToast } = useToast();
  const navigate = useNavigate();

  // Active Tab: 'overview' | 'books' | 'users' | 'borrowing'
  const [activeTab, setActiveTab] = useState("overview");

  // Data States
  const [stats, setStats] = useState(null);
  const [books, setBooks] = useState([]);
  const [users, setUsers] = useState([]);
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters inside Admin Tables
  const [bookSearch, setBookSearch] = useState("");
  const [bookCategory, setBookCategory] = useState("All");
  const [bookAvailabilityFilter, setBookAvailabilityFilter] = useState("all");
  const [userSearch, setUserSearch] = useState("");
  const [loanStatusFilter, setLoanStatusFilter] = useState("all");

  // Modals
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [editingBook, setEditingBook] = useState(null);
  const [viewingBook, setViewingBook] = useState(null);
  const [selectedUserDetails, setSelectedUserDetails] = useState(null);

  // Redirect if not admin
  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) {
      showToast("Access Denied. Administrator privileges required.", "error");
      navigate("/");
    }
  }, [user, isAdmin, authLoading, navigate, showToast]);

  // Load all admin data
  const loadAdminData = useCallback(async () => {
    if (!isAdmin) return;
    setLoading(true);

    try {
      const [statsData, booksData, usersData, loansData] = await Promise.all([
        apiRequest("/api/books/stats").catch(() => null),
        apiRequest("/api/books").catch(() => []),
        apiRequest("/api/users").catch(() => []),
        apiRequest("/api/borrow/all").catch(() => []),
      ]);

      if (statsData) setStats(statsData);
      if (Array.isArray(booksData)) setBooks(booksData.map(normalizeBook));
      if (Array.isArray(usersData)) setUsers(usersData);
      if (Array.isArray(loansData)) setLoans(loansData);
    } catch (err) {
      showToast(err.message || "Failed to load admin dashboard data.", "error");
    } finally {
      setLoading(false);
    }
  }, [isAdmin, showToast]);

  useEffect(() => {
    if (isAdmin) {
      loadAdminData();
    }
  }, [isAdmin, loadAdminData]);

  // Real-time synchronization for Admin Dashboard (silent refresh, toasts handled by root App)
  useSocket(loadAdminData, false);

  // Book Handlers
  const handleDeleteBook = async (book) => {
    const confirmed = window.confirm(`Permanently delete "${book.title}" from the library database?`);
    if (!confirmed) return;

    try {
      await apiRequest(`/api/books/${book.id}`, { method: "DELETE" });
      showToast(`Book "${book.title}" was deleted.`, "success");
      loadAdminData();
    } catch (err) {
      showToast(err.message || "Failed to delete book.", "error");
    }
  };

  const handleToggleAvailability = async (book) => {
    try {
      const nextAvailable = !book.available;
      const payload = { available: nextAvailable };
      if (nextAvailable && (!book.quantity || book.quantity <= 0)) {
        payload.quantity = 1;
      } else if (!nextAvailable) {
        payload.quantity = 0;
      }
      await apiRequest(`/api/books/${book.id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      showToast(`Availability for "${book.title}" set to ${nextAvailable ? "Available" : "Borrowed"}.`, "success");
      loadAdminData();
    } catch (err) {
      showToast(err.message || "Failed to update availability.", "error");
    }
  };

  // User Handlers
  const handleToggleUserRole = async (targetUser) => {
    const newRole = targetUser.role === "admin" ? "user" : "admin";
    const confirmed = window.confirm(
      `Change role for ${targetUser.name} to ${newRole.toUpperCase()}?`
    );
    if (!confirmed) return;

    try {
      await apiRequest(`/api/users/${targetUser._id}/role`, {
        method: "PUT",
        body: JSON.stringify({ role: newRole }),
      });
      showToast(`Role updated to ${newRole} for ${targetUser.name}.`, "success");
      loadAdminData();
    } catch (err) {
      showToast(err.message || "Failed to change user role.", "error");
    }
  };

  const handleToggleUserStatus = async (targetUser) => {
    const nextStatus = !targetUser.isActive;
    const actionText = nextStatus ? "activate" : "deactivate";
    const confirmed = window.confirm(`Are you sure you want to ${actionText} ${targetUser.name}'s account?`);
    if (!confirmed) return;

    try {
      await apiRequest(`/api/users/${targetUser._id}/status`, {
        method: "PUT",
        body: JSON.stringify({ isActive: nextStatus }),
      });
      showToast(`Account successfully ${actionText}d.`, "success");
      loadAdminData();
    } catch (err) {
      showToast(err.message || `Failed to ${actionText} account.`, "error");
    }
  };

  const handleViewUserDetails = async (userId) => {
    try {
      const data = await apiRequest(`/api/users/${userId}`);
      setSelectedUserDetails(data);
    } catch (err) {
      showToast(err.message || "Failed to fetch user details.", "error");
    }
  };

  // Loan Return Handler
  const handleAdminReturnBook = async (recordId, bookTitle) => {
    try {
      await apiRequest(`/api/borrow/return/${recordId}`, { method: "POST" });
      showToast(`Returned "${bookTitle}" successfully!`, "success");
      loadAdminData();
    } catch (err) {
      showToast(err.message || "Failed to return book.", "error");
    }
  };

  if (authLoading || !user || !isAdmin) {
    return (
      <div className="library-page">
        <Navbar />
        <main className="inner-page">
          <p className="status-message">Verifying administrator credentials...</p>
        </main>
      </div>
    );
  }

  // Filtered views
  const filteredBooks = books.filter((b) => {
    const matchesSearch = `${b.title} ${b.author} ${b.isbn || ""}`.toLowerCase().includes(bookSearch.toLowerCase());
    const matchesCategory = bookCategory === "All" || b.category === bookCategory;
    const matchesAvail =
      bookAvailabilityFilter === "all" ||
      (bookAvailabilityFilter === "available" ? b.available : !b.available);
    return matchesSearch && matchesCategory && matchesAvail;
  });

  const filteredUsers = users.filter((u) =>
    `${u.name} ${u.email}`.toLowerCase().includes(userSearch.toLowerCase())
  );

  const filteredLoans = loans.filter((l) => {
    if (loanStatusFilter === "all") return true;
    return l.status === loanStatusFilter;
  });

  const categoriesList = ["All", ...new Set(books.map((b) => b.category).filter(Boolean))];

  return (
    <div className="library-page admin-page-wrap">
      <Navbar />

      <main className="admin-container">
        {/* Admin Header */}
        <div className="admin-header">
          <div>
            <span className="admin-eyebrow">CONTROL PANEL · EXPERIMENTS 04–08</span>
            <h1>Administrator Hub</h1>
            <p className="admin-subtitle">
              Manage complete library inventory, registered patrons, lending operations, and access controls.
            </p>
          </div>

          <div className="admin-header-actions">
            <button
              className="admin-btn admin-btn-primary"
              onClick={() => {
                setEditingBook(null);
                setIsBookModalOpen(true);
              }}
            >
              ＋ Add New Book
            </button>
            <button className="admin-btn admin-btn-secondary" onClick={loadAdminData}>
              ⟳ Refresh
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <nav className="admin-tabs">
          <button
            className={`admin-tab ${activeTab === "overview" ? "active" : ""}`}
            onClick={() => setActiveTab("overview")}
          >
            📊 System Overview
          </button>
          <button
            className={`admin-tab ${activeTab === "books" ? "active" : ""}`}
            onClick={() => setActiveTab("books")}
          >
            📖 Book Inventory ({books.length})
          </button>
          <button
            className={`admin-tab ${activeTab === "users" ? "active" : ""}`}
            onClick={() => setActiveTab("users")}
          >
            👥 Registered Users ({users.length})
          </button>
          <button
            className={`admin-tab ${activeTab === "borrowing" ? "active" : ""}`}
            onClick={() => setActiveTab("borrowing")}
          >
            📋 Lending Transactions ({loans.length})
          </button>
        </nav>

        {loading ? (
          <p className="status-message">Loading system data...</p>
        ) : (
          <>
            {/* ========================================================================= */}
            {/* TAB 1: OVERVIEW */}
            {/* ========================================================================= */}
            {activeTab === "overview" && (
              <section className="admin-tab-content">
                <div className="admin-stats-grid">
                  <div className="admin-stat-card card-books">
                    <span className="admin-stat-icon">📖</span>
                    <div>
                      <p>Total Books</p>
                      <h3>{books.length}</h3>
                    </div>
                  </div>

                  <div className="admin-stat-card card-avail">
                    <span className="admin-stat-icon">✓</span>
                    <div>
                      <p>Available on Shelves</p>
                      <h3>{books.filter((b) => b.available).length}</h3>
                    </div>
                  </div>

                  <div className="admin-stat-card card-borrowed">
                    <span className="admin-stat-icon">↗</span>
                    <div>
                      <p>Currently Borrowed</p>
                      <h3>{books.filter((b) => !b.available).length}</h3>
                    </div>
                  </div>

                  <div className="admin-stat-card card-users">
                    <span className="admin-stat-icon">👥</span>
                    <div>
                      <p>Registered Members</p>
                      <h3>{users.length}</h3>
                    </div>
                  </div>

                  <div className="admin-stat-card card-categories">
                    <span className="admin-stat-icon">🏷</span>
                    <div>
                      <p>Total Categories</p>
                      <h3>{categoriesList.length - 1}</h3>
                    </div>
                  </div>

                  <div className="admin-stat-card card-val">
                    <span className="admin-stat-icon">₹</span>
                    <div>
                      <p>Inventory Valuation</p>
                      <h3>₹{stats ? stats.totalInventoryValue?.toLocaleString() : "—"}</h3>
                    </div>
                  </div>
                </div>

                <div className="admin-overview-panels">
                  <div className="admin-panel">
                    <h3>Recent Lending Activity</h3>
                    {loans.slice(0, 5).length > 0 ? (
                      <table className="admin-table">
                        <thead>
                          <tr>
                            <th>Book</th>
                            <th>Patron</th>
                            <th>Status</th>
                            <th>Due Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {loans.slice(0, 5).map((loan) => (
                            <tr key={loan._id}>
                              <td><strong>{loan.book?.title || "Book"}</strong></td>
                              <td>{loan.user?.name || "Member"}</td>
                              <td>
                                <span className={`status-pill pill-${loan.status}`}>
                                  {loan.status}
                                </span>
                              </td>
                              <td>{new Date(loan.dueDate).toLocaleDateString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <p className="empty-hint">No borrowing transactions recorded yet.</p>
                    )}
                  </div>

                  <div className="admin-panel">
                    <h3>Quick Administration Actions</h3>
                    <div className="admin-quick-links">
                      <button
                        className="admin-quick-btn"
                        onClick={() => {
                          setEditingBook(null);
                          setIsBookModalOpen(true);
                        }}
                      >
                        ＋ Add a New Book to Catalog
                      </button>
                      <button className="admin-quick-btn" onClick={() => setActiveTab("users")}>
                        👥 Review Registered Patrons
                      </button>
                      <button className="admin-quick-btn" onClick={() => setActiveTab("borrowing")}>
                        📋 Check Overdue Loans
                      </button>
                      <Link to="/statistics" className="admin-quick-btn">
                        📊 Open MongoDB Aggregations Page →
                      </Link>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* ========================================================================= */}
            {/* TAB 2: BOOKS MANAGEMENT */}
            {/* ========================================================================= */}
            {activeTab === "books" && (
              <section className="admin-tab-content">
                <div className="admin-filter-bar">
                  <input
                    type="search"
                    placeholder="Search books by title or author..."
                    value={bookSearch}
                    onChange={(e) => setBookSearch(e.target.value)}
                    className="admin-search-input"
                  />

                  <select
                    value={bookCategory}
                    onChange={(e) => setBookCategory(e.target.value)}
                    className="admin-select"
                  >
                    {categoriesList.map((c) => (
                      <option key={c} value={c}>
                        {c === "All" ? "All Categories" : c}
                      </option>
                    ))}
                  </select>

                  <select
                    value={bookAvailabilityFilter}
                    onChange={(e) => setBookAvailabilityFilter(e.target.value)}
                    className="admin-select"
                  >
                    <option value="all">All Status</option>
                    <option value="available">Available Only</option>
                    <option value="borrowed">Borrowed Only</option>
                  </select>

                  <button
                    className="admin-btn admin-btn-primary"
                    onClick={() => {
                      setEditingBook(null);
                      setIsBookModalOpen(true);
                    }}
                  >
                    ＋ Add New Book
                  </button>
                </div>

                <div className="table-responsive">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Book Title</th>
                        <th>Author</th>
                        <th>Category</th>
                        <th>ISBN / Year</th>
                        <th>Price</th>
                        <th>Qty</th>
                        <th>Status</th>
                        <th>Availability</th>
                        <th style={{ textAlign: "right" }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredBooks.map((book) => (
                        <tr key={book.id}>
                          <td>
                            <strong
                              style={{ cursor: "pointer", color: "#0f172a" }}
                              onClick={() => setViewingBook(book)}
                            >
                              {book.title}
                            </strong>
                          </td>
                          <td>{book.author}</td>
                          <td>
                            <span className="category-chip">{book.category}</span>
                          </td>
                          <td style={{ fontSize: "0.82rem", color: "#64748b" }}>
                            {book.isbn ? `ISBN: ${book.isbn}` : "—"}
                            {book.publicationYear ? ` (${book.publicationYear})` : ""}
                          </td>
                          <td>₹{book.price}</td>
                          <td>{book.quantity !== undefined ? book.quantity : (book.available ? 1 : 0)}</td>
                          <td>
                            <span className={`status-pill ${book.available ? "pill-available" : "pill-borrowed"}`}>
                              {book.available ? "Available" : "Borrowed"}
                            </span>
                          </td>
                          <td>
                            <button
                              className="admin-action-btn"
                              style={{
                                background: book.available ? "#ecfdf5" : "#fef3c7",
                                color: book.available ? "#065f46" : "#92400e",
                              }}
                              onClick={() => handleToggleAvailability(book)}
                              title="Click to toggle availability and update inventory status"
                            >
                              Toggle: {book.available ? "Set Borrowed" : "Set Available"}
                            </button>
                          </td>
                          <td style={{ textAlign: "right" }}>
                            <div className="table-actions">
                              <button
                                className="admin-action-btn btn-view"
                                onClick={() => setViewingBook(book)}
                              >
                                View
                              </button>
                              <button
                                className="admin-action-btn btn-edit"
                                onClick={() => {
                                  setEditingBook(book);
                                  setIsBookModalOpen(true);
                                }}
                              >
                                Edit
                              </button>
                              <button
                                className="admin-action-btn btn-delete"
                                onClick={() => handleDeleteBook(book)}
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {/* ========================================================================= */}
            {/* TAB 3: USERS MANAGEMENT */}
            {/* ========================================================================= */}
            {activeTab === "users" && (
              <section className="admin-tab-content">
                <div className="admin-filter-bar">
                  <input
                    type="search"
                    placeholder="Search users by name or email..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="admin-search-input"
                  />
                  <span style={{ fontSize: "0.9rem", color: "#64748b" }}>
                    Showing {filteredUsers.length} registered accounts
                  </span>
                </div>

                <div className="table-responsive">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>User Name</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Account Status</th>
                        <th>Joined</th>
                        <th style={{ textAlign: "right" }}>Manage</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map((u) => (
                        <tr key={u._id}>
                          <td>
                            <strong>{u.name}</strong>
                          </td>
                          <td>{u.email}</td>
                          <td>
                            <span className={`role-chip role-${u.role}`}>
                              {u.role.toUpperCase()}
                            </span>
                          </td>
                          <td>
                            <span className={`status-pill ${u.isActive ? "pill-available" : "pill-borrowed"}`}>
                              {u.isActive ? "Active" : "Deactivated"}
                            </span>
                          </td>
                          <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                          <td style={{ textAlign: "right" }}>
                            <div className="table-actions">
                              <button
                                className="admin-action-btn btn-view"
                                onClick={() => handleViewUserDetails(u._id)}
                              >
                                Activity
                              </button>
                              <button
                                className="admin-action-btn"
                                style={{ background: "#f1f5f9", color: "#334155" }}
                                onClick={() => handleToggleUserRole(u)}
                              >
                                {u.role === "admin" ? "Demote to Member" : "Promote to Admin"}
                              </button>
                              <button
                                className="admin-action-btn"
                                style={{
                                  background: u.isActive ? "#fee2e2" : "#dcfce7",
                                  color: u.isActive ? "#991b1b" : "#166534",
                                }}
                                onClick={() => handleToggleUserStatus(u)}
                                disabled={u._id === user._id}
                              >
                                {u.isActive ? "Deactivate" : "Activate"}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {/* ========================================================================= */}
            {/* TAB 4: BORROWING TRANSACTIONS */}
            {/* ========================================================================= */}
            {activeTab === "borrowing" && (
              <section className="admin-tab-content">
                <div className="admin-filter-bar">
                  <select
                    value={loanStatusFilter}
                    onChange={(e) => setLoanStatusFilter(e.target.value)}
                    className="admin-select"
                  >
                    <option value="all">All Lending Records</option>
                    <option value="borrowed">Currently Borrowed</option>
                    <option value="returned">Returned Books</option>
                    <option value="overdue">Overdue Books</option>
                  </select>

                  <span style={{ fontSize: "0.9rem", color: "#64748b" }}>
                    Total Transactions: {filteredLoans.length}
                  </span>
                </div>

                <div className="table-responsive">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Book Title</th>
                        <th>Borrower</th>
                        <th>Issue Date</th>
                        <th>Due Date</th>
                        <th>Return Date</th>
                        <th>Status</th>
                        <th>Fine</th>
                        <th style={{ textAlign: "right" }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredLoans.map((loan) => (
                        <tr key={loan._id}>
                          <td><strong>{loan.book?.title || "Book"}</strong></td>
                          <td>
                            {loan.user?.name}
                            <br />
                            <small style={{ color: "#64748b" }}>{loan.user?.email}</small>
                          </td>
                          <td>{new Date(loan.issueDate).toLocaleDateString()}</td>
                          <td>{new Date(loan.dueDate).toLocaleDateString()}</td>
                          <td>{loan.returnDate ? new Date(loan.returnDate).toLocaleDateString() : "—"}</td>
                          <td>
                            <span className={`status-pill pill-${loan.status}`}>
                              {loan.status.toUpperCase()}
                            </span>
                          </td>
                          <td>{loan.fine > 0 ? `₹${loan.fine}` : "—"}</td>
                          <td style={{ textAlign: "right" }}>
                            {loan.status !== "returned" ? (
                              <button
                                className="admin-action-btn btn-primary-action"
                                onClick={() => handleAdminReturnBook(loan._id, loan.book?.title)}
                              >
                                Confirm Return ✓
                              </button>
                            ) : (
                              <span style={{ color: "#059669", fontSize: "0.85rem", fontWeight: "600" }}>
                                Complete
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}
          </>
        )}
      </main>

      {/* Modals */}
      <BookModal
        isOpen={isBookModalOpen}
        onClose={() => {
          setIsBookModalOpen(false);
          setEditingBook(null);
        }}
        bookToEdit={editingBook}
        onSaved={loadAdminData}
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
      />

      {/* User Activity Modal */}
      {selectedUserDetails && (
        <div
          className="modal-backdrop"
          onClick={() => setSelectedUserDetails(null)}
          role="dialog"
          aria-modal="true"
        >
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <span className="modal-kicker">USER ACTIVITY &amp; LOANS</span>
                <h2>{selectedUserDetails.user.name}</h2>
              </div>
              <button
                className="modal-close-btn"
                onClick={() => setSelectedUserDetails(null)}
              >
                ✕
              </button>
            </div>

            <div style={{ marginBottom: "16px" }}>
              <p style={{ margin: "4px 0", color: "#475569" }}>
                <strong>Email:</strong> {selectedUserDetails.user.email}
              </p>
              <p style={{ margin: "4px 0", color: "#475569" }}>
                <strong>Role:</strong> {selectedUserDetails.user.role.toUpperCase()} ·{" "}
                <strong>Status:</strong> {selectedUserDetails.user.isActive ? "Active" : "Inactive"}
              </p>
              <p style={{ margin: "4px 0", color: "#475569" }}>
                <strong>Total Loans:</strong> {selectedUserDetails.totalBorrowed} (
                {selectedUserDetails.activeLoans} currently checked out)
              </p>
            </div>

            <h3 style={{ fontSize: "1.1rem", marginBottom: "10px", color: "#0f172a" }}>
              Borrowing History
            </h3>
            {selectedUserDetails.borrowHistory.length > 0 ? (
              <div style={{ maxHeight: "250px", overflowY: "auto" }}>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Book</th>
                      <th>Issue Date</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedUserDetails.borrowHistory.map((rec) => (
                      <tr key={rec._id}>
                        <td>{rec.book?.title}</td>
                        <td>{new Date(rec.issueDate).toLocaleDateString()}</td>
                        <td>
                          <span className={`status-pill pill-${rec.status}`}>{rec.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p style={{ color: "#64748b" }}>No loans recorded for this user.</p>
            )}

            <div className="modal-actions" style={{ marginTop: "20px" }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setSelectedUserDetails(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

