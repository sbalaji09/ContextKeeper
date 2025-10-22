import React, { useState } from "react";
import { supabase } from "./supabaseClient";
import "./Login.css"; // reuse the same styles

function SignUp({ onSuccess }) {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!username || !email || !password || !confirm) {
      setError("Please fill in all fields.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    try {
      setLoading(true);

      // Sign up with Supabase Auth (with email confirmation disabled)
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: username, // Store username in user metadata
          },
          emailRedirectTo: undefined, // Disable email confirmation redirect
        },
      },
      {
        // This disables email confirmation requirement
        emailConfirm: false
      });

      if (signUpError) {
        throw signUpError;
      }

      if (!data.user) {
        throw new Error("Signup failed - no user returned");
      }

      // After signup, insert user record into the users table
      // Note: We let the database auto-generate the INTEGER id, and store the Supabase auth UUID separately
      const { error: insertError } = await supabase
        .from('users')
        .insert([
          {
            auth_user_id: data.user.id, // Store Supabase Auth UUID
            username: username,
            email: email,
            password_hash: 'handled_by_supabase_auth', // Placeholder since Supabase handles passwords
          },
        ]);

      if (insertError) {
        console.error("Error inserting user into users table:", insertError);
        // Don't throw - auth user was created successfully
      }

      // User is automatically logged in (email verification disabled) - redirect to dashboard
      if (typeof onSuccess === "function") {
        onSuccess(data);
      } else {
        window.location.href = "/dashboard";
      }
    } catch (err) {
      console.error("Signup error:", err);
      setError(err.message || "Unable to sign up. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-container">
      <form className="login-card" onSubmit={handleSubmit} noValidate>
        <div className="brand">
          <div className="brand-icon">📦</div>
          <div className="brand-name">ContextKeeper</div>
        </div>
        <h1 className="login-title">Create your account</h1>
        <p className="login-subtitle">Join us in a few steps</p>

        {error && (
          <div className="alert" role="alert" aria-live="assertive">
            {error}
          </div>
        )}

        <label className="field">
          <span className="field-label">Username</span>
          <input
            className="input"
            type="text"
            placeholder="adalovelace"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </label>

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
              autoComplete="new-password"
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

        <label className="field">
          <span className="field-label">Confirm password</span>
          <input
            className="input"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            placeholder="••••••••"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
          />
        </label>

        <button className="btn" type="submit" disabled={loading}>
          {loading ? "Creating account..." : "Create account"}
        </button>

        <p className="footnote">
          Already have an account? <a className="link" href="/login">Sign in</a>
        </p>
      </form>
    </div>
  );
}

export default SignUp;