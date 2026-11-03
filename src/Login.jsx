import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useLibrary } from "./LibraryContext.jsx";
import { useToast } from "./ToastContext.jsx";
import "./Login.css";

export default function Login() {
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState("");

  const { login, register } = useLibrary();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!email.trim() || !password.trim()) {
      setFormError("Please enter both email and password.");
      return;
    }

    if (isRegister) {
      if (!name.trim()) {
        setFormError("Please enter your full name.");
        return;
      }
      if (password.length < 6) {
        setFormError("Password must be at least 6 characters long.");
        return;
      }
      if (password !== confirmPassword) {
        setFormError("Passwords do not match.");
        return;
      }
    }

    setLoading(true);

    try {
      if (isRegister) {
        const res = await register(name.trim(), email.trim(), password);
        showToast(res.message || "Account created successfully! Welcome to LibraryHub.", "success");
      } else {
        const res = await login(email.trim(), password);
        showToast(res.message || "Signed in successfully!", "success");
      }
      navigate("/");
    } catch (err) {
      setFormError(err.message || "Authentication failed. Please check your credentials.");
      showToast(err.message || "Authentication failed.", "error");
    } finally {
      setLoading(false);
    }
  };

  const fillAdminCredentials = () => {
    setIsRegister(false);
    setEmail("admin@libraryhub.com");
    setPassword("Admin@12345");
    setFormError("");
    showToast("Filled demo administrator credentials!", "info");
  };

  return (
    <main className="lh-login-page">
      <section className="lh-login-visual">
        <Link to="/" className="lh-login-brand">
          <span className="lh-brand-icon">📖</span>
          Library<span>Hub</span>
        </Link>

        <div className="lh-visual-content">
          <span className="lh-kicker">
            <span className="lh-kicker-line"></span>
            SECURE ACCESS · EXPERIMENT 07
          </span>

          <h1>
            Every book
            <br />
            opens a <em>new</em>
            <br />
            world.
          </h1>

          <p className="lh-visual-description">
            Sign in to check out books, track your borrowing activity, or administer the digital library catalog.
          </p>

          <div className="lh-book-art">
            <div className="lh-art-circle"></div>
            <div className="lh-art-leaf">✳</div>

            <div className="lh-art-book lh-art-book-one">
              <span>SECURITY &amp; AUTH</span>
            </div>
            <div className="lh-art-book lh-art-book-two">
              <span>Bcrypt &amp; JWT</span>
            </div>
            <div className="lh-art-book lh-art-book-three">
              <span>ROLE-BASED ACCESS</span>
            </div>
          </div>

          <p className="lh-art-caption">A little reading goes a long way.</p>
        </div>

        <div className="lh-visual-footer">
          <span>READ MORE. DREAM MORE.</span>
          <span>EXPERIMENT 07 AUTHENTICATION</span>
        </div>
      </section>

      <section className="lh-login-side">
        <Link to="/" className="lh-back-home">
          <span>←</span> Back to home
        </Link>

        <div className="lh-login-card">
          <div className="lh-welcome-icon">✦</div>

          <p className="lh-form-kicker">
            {isRegister ? "CREATE AN ACCOUNT" : "WELCOME BACK"}
          </p>
          <h2>{isRegister ? "Join LibraryHub." : "Good to see you."}</h2>
          <p className="lh-form-description">
            {isRegister
              ? "Create your reader account to borrow books and access digital shelves."
              : "Sign in and pick up where your imagination left off."}
          </p>

          <form onSubmit={handleSubmit} className="lh-login-form">
            {isRegister && (
              <>
                <label htmlFor="lh-name">Full Name</label>
                <input
                  id="lh-name"
                  type="text"
                  placeholder="e.g. Eleanor Vance"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </>
            )}

            <label htmlFor="lh-email">Email address</label>
            <input
              id="lh-email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />

            <div className="lh-password-heading">
              <label htmlFor="lh-password">Password</label>
            </div>

            <div className="lh-password-field">
              <input
                id="lh-password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter password (min 6 characters)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={isRegister ? "new-password" : "current-password"}
                required
              />

              <button
                type="button"
                className="lh-show-password"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>

            {isRegister && (
              <>
                <div className="lh-password-heading" style={{ marginTop: "12px" }}>
                  <label htmlFor="lh-confirm-password">Confirm Password</label>
                </div>
                <input
                  id="lh-confirm-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Re-type your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                />
              </>
            )}

            {formError && (
              <p className="lh-login-error" role="alert">
                {formError}
              </p>
            )}

            <button className="lh-submit-button" type="submit" disabled={loading}>
              {loading
                ? "Processing..."
                : isRegister
                ? "Register Account →"
                : "Sign in to your library →"}
            </button>
          </form>

          {/* Toggle between Login and Register */}
          <div style={{ marginTop: "16px", textAlign: "center", fontSize: "0.9rem", color: "#64748b" }}>
            {isRegister ? (
              <p>
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setIsRegister(false);
                    setFormError("");
                  }}
                  style={{ background: "none", border: "none", color: "#059669", fontWeight: "700", cursor: "pointer" }}
                >
                  Sign In
                </button>
              </p>
            ) : (
              <p>
                Don't have an account yet?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setIsRegister(true);
                    setFormError("");
                  }}
                  style={{ background: "none", border: "none", color: "#059669", fontWeight: "700", cursor: "pointer" }}
                >
                  Create one now
                </button>
              </p>
            )}
          </div>

          <div className="lh-form-divider">
            <span></span>
            <p>ADMINISTRATOR ACCESS</p>
            <span></span>
          </div>

          <div className="lh-demo-note" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <span>✧</span>
              <p>
                <strong>Evaluation / Admin Login:</strong>
                <br />
                <code>admin@libraryhub.com</code> / <code>Admin@12345</code>
              </p>
            </div>
            <button
              type="button"
              onClick={fillAdminCredentials}
              style={{
                background: "#0f172a",
                color: "#ffffff",
                border: "none",
                borderRadius: "6px",
                padding: "6px 12px",
                fontSize: "0.78rem",
                fontWeight: "600",
                cursor: "pointer",
                whiteSpace: "nowrap",
                marginLeft: "8px",
              }}
            >
              Fill Admin
            </button>
          </div>
        </div>

        <footer className="lh-login-footer">
          <span>📚</span> Made for curious minds.
          <span className="lh-footer-dot">•</span>
          <Link to="/">Explore LibraryHub</Link>
        </footer>
      </section>
    </main>
  );
}
