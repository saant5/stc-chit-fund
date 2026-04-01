// client/src/pages/Login.jsx
// Fully wired to real backend via AuthContext
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../styles/auth.css";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Fix 1: missing input handler
  const handle = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Fix 2: missing validation
  const validate = () => {
    if (!form.email.trim()) return "Email is required.";
    if (!form.password) return "Password is required.";
    return null;
  };

  // Fix 3: use AuthContext + navigate instead of raw fetch + hard redirect
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const validationErr = validate();
    if (validationErr) {
      setError(validationErr);
      return;
    }

    setLoading(true);

    try {
      const result = await login(form.email.trim(), form.password);

      if (!result?.success) {
        setError(result?.message || "Invalid email or password.");
        setLoading(false);
        return;
      }

      navigate(result.role === "admin" ? "/admin" : "/dashboard");
    } catch {
      setError("Cannot connect to server. Is backend running on port 5000?");
      setLoading(false);
    }
  };

  return (
    <div className="auth-root">
      <div className="auth-bg">
        <div className="bg-circle c1" />
        <div className="bg-circle c2" />
        <div className="bg-circle c3" />
      </div>

      <div className="auth-card">
        <div className="brand">
          <div className="brand-emblem">STC</div>
          <div>
            <div className="brand-name">SAI TULASI</div>
            <div className="brand-sub">Chit Fund · Member Portal</div>
          </div>
        </div>

        <h1 className="auth-title">Welcome Back</h1>
        <p className="auth-hint">
          Sign in to manage your chit groups and payments.
        </p>

        {error && <div className="auth-error">⚠ {error}</div>}

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <div className="field">
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={handle}
              autoComplete="email"
              disabled={loading}
              required
            />
          </div>

          <div className="field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              placeholder="Your password"
              value={form.password}
              onChange={handle}
              autoComplete="current-password"
              disabled={loading}
              required
            />
          </div>

          <div style={{ textAlign: "right", marginTop: "-0.5rem" }}>
            <a
              href="#"
              style={{
                fontSize: "0.78rem",
                color: "#C9922A",
                textDecoration: "none",
                fontFamily: "'Sora', sans-serif",
              }}
            >
              Forgot password?
            </a>
          </div>

          <button className="auth-btn" type="submit" disabled={loading}>
            {loading ? <span className="btn-loader" /> : "Sign In →"}
          </button>
        </form>

        <div
          style={{
            background: "rgba(201,146,42,0.07)",
            border: "1px solid rgba(201,146,42,0.2)",
            borderRadius: 9,
            padding: "0.75rem 1rem",
            marginTop: "1.25rem",
            fontSize: "0.76rem",
            color: "#6b6557",
            lineHeight: 1.6,
          }}
        >
          <strong style={{ color: "#C9922A" }}>First time?</strong>{" "}
          Register an account first, then log in. Admin access requires
          changing your role to{" "}
          <code
            style={{
              background: "rgba(201,146,42,0.12)",
              padding: "1px 5px",
              borderRadius: 4,
            }}
          >
            admin
          </code>{" "}
          in MongoDB.
        </div>

        <p className="auth-switch">
          Don't have an account? <Link to="/register">Create one</Link>
        </p>
      </div>
    </div>
  );
}