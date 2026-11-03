import { Link, useNavigate, useLocation } from "react-router-dom";
import { useLibrary } from "./LibraryContext.jsx";
import { useToast } from "./ToastContext.jsx";

export default function Navbar() {
  const { user, isAdmin, logout } = useLibrary();
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();

  const handleLogout = () => {
    logout();
    showToast("Signed out successfully. See you soon!", "info");
    navigate("/");
  };

  const isActive = (path) => location.pathname === path;

  return (
    <header className="navbar">
      <Link to="/" className="brand">
        <span className="brand-icon">📖</span>
        <span>
          Library<span className="brand-light">Hub</span>
        </span>
      </Link>

      <nav className="nav-links">
        <Link to="/" className={isActive("/") ? "active" : ""}>
          ⌂ Home
        </Link>
        <Link to="/search-books" className={isActive("/search-books") ? "active" : ""}>
          ⌕ Search Books
        </Link>
        <Link to="/statistics" className={isActive("/statistics") ? "active" : ""}>
          ▥ Statistics
        </Link>
        <Link to="/experiment-3" className={isActive("/experiment-3") ? "active" : ""}>
          📖 Exp 3
        </Link>

        {user && (
          <Link to="/my-books" className={isActive("/my-books") ? "active" : ""}>
            📚 My Books
          </Link>
        )}

        {isAdmin && (
          <Link
            to="/admin"
            className={isActive("/admin") ? "active admin-nav-link" : "admin-nav-link"}
            title="Administrator Dashboard"
          >
            🛡 Admin
          </Link>
        )}

        {user ? (
          <div className="user-nav-actions">
            <span className="nav-user-badge" title={user.email}>
              <span className="user-avatar">{user.name.charAt(0).toUpperCase()}</span>
              <span className="user-name-short">{user.name.split(" ")[0]}</span>
              {isAdmin && <span className="admin-chip">ADMIN</span>}
            </span>
            <button className="login-btn logout-style" onClick={handleLogout}>
              Logout ↗
            </button>
          </div>
        ) : (
          <button className="login-btn" onClick={() => navigate("/login")}>
            ♟ Login
          </button>
        )}
      </nav>
    </header>
  );
}

