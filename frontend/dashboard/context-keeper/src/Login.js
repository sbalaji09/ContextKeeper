import React, { useState } from "react";
import "./Login.css";

function Login({ onSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Change to your API base URL if different
  const API_BASE = import.meta?.env?.VITE_API_URL || process.env.REACT_APP_API_URL || "http://localhost:3000";

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    // basic validation
    if (!email || !password) {
      setError("Please enter your email and password.");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        credentials: "include", // keeps cookies if your API sets them
      });

      // Handle non-2xx
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Login failed (HTTP ${res.status})`);
      }

      const data = await res.json(); // expect { token, user }
      const token = data?.token;

      // Store token
      if (token) {
        if (remember) {
          localStorage.setItem("token", token);
        } else {
          sessionStorage.setItem("token", token);
        }
      }

      // Notify parent or navigate
      if (typeof onSuccess === "function") {
        onSuccess(data);
      } else {
        // fallback: simple redirect to dashboard
        window.location.href = "/dashboard";
      }
    } catch (err) {
      setError(err.message || "Unable to login. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-container">
      <form className="login-card" onSubmit={handleSubmit} noValidate>
        <h1 className="login-title">Welcome back</h1>
        <p className="login-subtitle">Sign in to continue</p>

        {error && (
          <div className="alert" role="alert" aria-live="assertive">
            {error}
          </div>
        )}

        <label className="field">
          <span className="field-label">Email</span>
          <input
            className="input"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>

        <label className="field">
          <span className="field-label">Password</span>
          <div className="password-wrap">
            <input
              className="input"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              className="toggle"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
        </label>

        <div className="row">
          <label className="checkbox">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
            />
            <span>Remember me</span>
          </label>

          <a className="link" href="/forgot-password">Forgot password?</a>
        </div>

        <button className="btn" type="submit" disabled={loading}>
          {loading ? "Signing in..." : "Sign in"}
        </button>

        <p className="footnote">
          Don’t have an account? <a className="link" href="/signup">Create one</a>
        </p>
      </form>
    </div>
  );
}

export default Login;
