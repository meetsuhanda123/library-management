import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { apiRequest } from "./api.js";
import Navbar from "./Navbar.jsx";
import "./Pages.css";

export default function Statistics() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadStats() {
      setLoading(true);
      setError("");
      try {
        const data = await apiRequest("/api/books/stats");
        setStats(data);
      } catch (err) {
        setError(err.message || "Failed to fetch aggregated statistics.");
      } finally {
        setLoading(false);
      }
    }

    loadStats();
  }, []);

  return (
    <div className="library-page">
      <Navbar />

      <main className="inner-page">
        <p className="eyebrow">MONGODB AGGREGATION PIPELINE · EXPERIMENT 06</p>
        <h1>
          Real-Time Data &amp;
          <br />
          <em>Library Analytics.</em>
        </h1>
        <p className="page-description">
          Calculated dynamically via server-side MongoDB aggregation stages ($facet, $group, $sort, $avg, $cond).
        </p>

        {error && <p role="alert" className="status-message" style={{ color: "#ef4444" }}>{error}</p>}

        {loading ? (
          <p className="status-message">Computing MongoDB aggregation pipeline...</p>
        ) : stats ? (
          <>
            {/* Primary Stat Cards */}
            <section className="stats-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
              <article className="stat-card stat-dark">
                <span className="stat-icon">▤</span>
                <p>Total Books</p>
                <strong>{stats.totalBooks}</strong>
                <small>Active in collection</small>
              </article>

              <article className="stat-card stat-green">
                <span className="stat-icon">✓</span>
                <p>Available Books</p>
                <strong>{stats.availableBooks}</strong>
                <small>Ready on shelves</small>
              </article>

              <article className="stat-card stat-cream">
                <span className="stat-icon">↗</span>
                <p>Borrowed Books</p>
                <strong>{stats.borrowedBooks}</strong>
                <small>Currently in circulation</small>
              </article>

              <article className="stat-card stat-dark">
                <span className="stat-icon">🏷</span>
                <p>Categories</p>
                <strong>{stats.totalCategories}</strong>
                <small>Distinct classifications</small>
              </article>

              <article className="stat-card stat-green">
                <span className="stat-icon">₹</span>
                <p>Inventory Valuation</p>
                <strong>₹{stats.totalInventoryValue.toLocaleString()}</strong>
                <small>Total catalog value</small>
              </article>

              <article className="stat-card stat-cream">
                <span className="stat-icon">⌀</span>
                <p>Average Book Price</p>
                <strong>₹{stats.avgPrice}</strong>
                <small>Range: ₹{stats.minPrice} – ₹{stats.maxPrice}</small>
              </article>
            </section>

            {/* Circulation Ratio Visual Indicator */}
            <section className="category-panel" style={{ marginTop: "30px" }}>
              <p className="eyebrow">CIRCULATION STATUS BREAKDOWN</p>
              <h2>Available vs Borrowed Ratio</h2>

              <div style={{ marginTop: "16px", background: "#f8fafc", padding: "20px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", fontWeight: "600", fontSize: "0.95rem" }}>
                  <span style={{ color: "#059669" }}>
                    ✓ Available: {stats.availableBooks} ({stats.totalBooks ? Math.round((stats.availableBooks / stats.totalBooks) * 100) : 0}%)
                  </span>
                  <span style={{ color: "#d97706" }}>
                    ↗ Borrowed: {stats.borrowedBooks} ({stats.totalBooks ? Math.round((stats.borrowedBooks / stats.totalBooks) * 100) : 0}%)
                  </span>
                </div>

                <div className="bar-track" style={{ height: "16px", borderRadius: "8px", overflow: "hidden", display: "flex" }}>
                  <div
                    style={{
                      height: "100%",
                      width: `${stats.totalBooks ? (stats.availableBooks / stats.totalBooks) * 100 : 0}%`,
                      background: "#059669",
                      transition: "width 0.6s ease",
                    }}
                    title="Available Books"
                  />
                  <div
                    style={{
                      height: "100%",
                      width: `${stats.totalBooks ? (stats.borrowedBooks / stats.totalBooks) * 100 : 0}%`,
                      background: "#f59e0b",
                      transition: "width 0.6s ease",
                    }}
                    title="Borrowed Books"
                  />
                </div>
              </div>
            </section>

            {/* Category Breakdown (Aggregation stage $group) */}
            <section className="category-panel" style={{ marginTop: "30px" }}>
              <p className="eyebrow">COLLECTION BREAKDOWN BY CATEGORY</p>
              <h2>Category Distribution &amp; Average Pricing</h2>

              <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginTop: "20px" }}>
                {stats.categoryStats && stats.categoryStats.length > 0 ? (
                  stats.categoryStats.map((item) => (
                    <div className="category-row" key={item.name} style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      <div className="category-label" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontWeight: 600, color: "#0f172a" }}>
                          {item.name}
                          <span style={{ fontSize: "0.82rem", color: "#64748b", fontWeight: "normal", marginLeft: "10px" }}>
                            ({item.available} available, {item.borrowed} borrowed · avg ₹{item.avgPrice})
                          </span>
                        </span>
                        <strong style={{ color: "#0f172a" }}>
                          {item.count} {item.count === 1 ? "book" : "books"} ({item.percentage}%)
                        </strong>
                      </div>
                      <div className="bar-track">
                        <div
                          className="bar-fill"
                          style={{
                            width: `${item.percentage}%`,
                            transition: "width 0.6s ease",
                          }}
                        />
                      </div>
                    </div>
                  ))
                ) : (
                  <p style={{ color: "#64748b" }}>No category records found in the database.</p>
                )}
              </div>
            </section>

            <div style={{ marginTop: "30px", display: "flex", gap: "12px" }}>
              <Link to="/search-books" className="main-button">
                Explore collection catalog →
              </Link>
            </div>
          </>
        ) : null}
      </main>

      <footer className="site-footer">
        <Link to="/" className="site-logo">
          Library<span>Hub.</span>
        </Link>
        <p>Better libraries begin with better discoveries.</p>
      </footer>
    </div>
  );
}
