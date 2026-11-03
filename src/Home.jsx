
import React from "react";
import { Link } from "react-router-dom";
import booksData from "./booksData";
import "./Pages.css";

export default function Home() {
  const featuredBooks = booksData.slice(0, 3);

  return (
    <div className="library-page">
      <nav className="site-nav">
        <Link to="/" className="site-logo">
          Library<span>Hub.</span>
        </Link>

        <div className="nav-links">
          <Link to="/" className="active-link">Home</Link>
          <Link to="/search-books">Search Books</Link>
          <Link to="/statistics">Statistics</Link>
          <Link to="/login" className="nav-login">Login ↗</Link>
        </div>
      </nav>

      <main>
        <section className="hero-section">
          <div className="hero-copy">
            <p className="eyebrow">YOUR NEXT CHAPTER STARTS HERE</p>
            <h1>Some stories<br />stay with <em>you.</em></h1>
            <p className="hero-description">
              Discover your next favourite book, explore new ideas,
              and let every page take you somewhere wonderful.
            </p>

            <div className="hero-actions">
              <Link to="/search-books" className="main-button">
                Explore books →
              </Link>
              <Link to="/statistics" className="text-button">
                View library stats ↗
              </Link>
            </div>
          </div>

          <div className="hero-art">
            <div className="sun-circle"></div>
            <div className="book-stack">
              <div className="book book-one">
                <small>A GOOD BOOK</small>
                <strong>opens<br />new worlds.</strong>
              </div>
              <div className="book book-two"></div>
              <div className="book book-three"></div>
            </div>
            <p className="art-caption">READ · DREAM · REPEAT</p>
          </div>
        </section>

        <section className="home-stats">
          <div>
            <strong>{booksData.length}</strong>
            <span>Books in collection</span>
          </div>
          <div>
            <strong>{booksData.filter(b => b.available).length}</strong>
            <span>Available to borrow</span>
          </div>
          <div>
            <strong>{booksData.filter(b => !b.available).length}</strong>
            <span>Currently borrowed</span>
          </div>
        </section>

        <section className="featured-section">
          <div className="section-heading">
            <div>
              <p className="eyebrow">HANDPICKED FOR YOU</p>
              <h2>Featured <em>reads.</em></h2>
            </div>
            <Link to="/search-books" className="text-button">
              View all books →
            </Link>
          </div>

          <div className="book-grid">
            {featuredBooks.map((book, index) => (
              <article className="book-card" key={book.id}>
                <div className={`book-cover cover-${index + 1}`}>
                  <span>LIBRARYHUB COLLECTION</span>
                  <strong>{book.title}</strong>
                  <small>{book.author}</small>
                </div>
                <p className="book-category">{book.category}</p>
                <h3>{book.title}</h3>
                <p className="book-author">{book.author}</p>
                <span className={book.available ? "status available" : "status borrowed"}>
                  {book.available ? "Available" : "Borrowed"}
                </span>
              </article>
            ))}
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <Link to="/" className="site-logo">Library<span>Hub.</span></Link>
        <p>A little more reading, a little more wonder.</p>
      </footer>
    </div>
  );
}
