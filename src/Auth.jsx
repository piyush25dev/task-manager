import React, { useState } from "react";
import { supabase } from "./supabase-client";
import { Mail, Lock, Eye, EyeOff, AlertCircle, CheckCircle } from "lucide-react";
import "./Auth.css";

export default function Auth() {
  const [isSignIn, setIsSignIn] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Validation
  const validateEmail = (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const validatePassword = (password) => {
    return password.length >= 6;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Validation
    if (!email.trim()) {
      setError("Email is required");
      return;
    }

    if (!validateEmail(email)) {
      setError("Please enter a valid email address");
      return;
    }

    if (!password) {
      setError("Password is required");
      return;
    }

    if (!validatePassword(password)) {
      setError("Password must be at least 6 characters long");
      return;
    }

    try {
      setLoading(true);

      if (isSignIn) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          // Handle specific error messages
          if (error.message.includes("Invalid login credentials")) {
            setError("Invalid email or password. Please try again.");
          } else if (error.message.includes("Email not confirmed")) {
            setError("Please verify your email before signing in.");
          } else {
            setError(error.message || "An error occurred while signing in");
          }
          console.error("Sign In Error:", error);
        } else if (data?.user) {
          setSuccess("✓ Signed in successfully!");
          setEmail("");
          setPassword("");
          // Redirect or handle logged-in state here
          console.log("User signed in:", data.user.email);
        }
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });

        if (error) {
          if (error.message.includes("already registered")) {
            setError("This email is already registered. Please sign in instead.");
          } else {
            setError(error.message || "An error occurred while signing up");
          }
          console.error("Sign Up Error:", error);
        } else if (data?.user) {
          setSuccess(
            "✓ Account created! Please check your email to verify your account."
          );
          setEmail("");
          setPassword("");
          // Optionally switch to sign in view
          setTimeout(() => setIsSignIn(true), 2000);
        }
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
      console.error("Unexpected error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleMode = () => {
    setIsSignIn(!isSignIn);
    setEmail("");
    setPassword("");
    setError("");
    setSuccess("");
    setShowPassword(false);
  };

  // Auto-hide success message after 4 seconds
  React.useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(""), 4000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  return (
    <div className="auth-wrapper">
      {/* Background Decoration */}
      <div className="auth-background">
        <div className="auth-blob auth-blob-1"></div>
        <div className="auth-blob auth-blob-2"></div>
      </div>

      <div className="auth-container">
        {/* Header */}
        <div className="auth-header">
          <div className="auth-icon">
            {isSignIn ? "🔓" : "✨"}
          </div>
          <h1 className="auth-title">
            {isSignIn ? "Welcome Back" : "Join Us Today"}
          </h1>
          <p className="auth-subtitle">
            {isSignIn
              ? "Sign in to manage your tasks"
              : "Create an account to get started"}
          </p>
        </div>

        {/* Alert Messages */}
        {error && (
          <div className="auth-alert auth-alert-error">
            <AlertCircle size={20} />
            <span>{error}</span>
            <button
              onClick={() => setError("")}
              className="auth-alert-close"
              aria-label="Close error"
            >
              ×
            </button>
          </div>
        )}

        {success && (
          <div className="auth-alert auth-alert-success">
            <CheckCircle size={20} />
            <span>{success}</span>
          </div>
        )}

        {/* Form */}
        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          {/* Email Input */}
          <div className="auth-input-group">
            <label htmlFor="email" className="auth-label">
              Email Address
            </label>
            <div className="auth-input-wrapper">
              <Mail size={20} className="auth-input-icon" />
              <input
                id="email"
                type="email"
                placeholder="you@example.com"
                className="auth-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                autoComplete="email"
                required
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="auth-input-group">
            <label htmlFor="password" className="auth-label">
              Password
            </label>
            <div className="auth-input-wrapper">
              <Lock size={20} className="auth-input-icon" />
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                className="auth-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                autoComplete={isSignIn ? "current-password" : "new-password"}
                required
              />
              <button
                type="button"
                className="auth-password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                disabled={loading}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff size={20} />
                ) : (
                  <Eye size={20} />
                )}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="auth-button"
            disabled={loading}
            aria-busy={loading}
          >
            {loading ? (
              <>
                <span className="auth-spinner"></span>
                {isSignIn ? "Signing in..." : "Creating account..."}
              </>
            ) : isSignIn ? (
              "Sign In"
            ) : (
              "Sign Up"
            )}
          </button>
        </form>

        {/* Toggle Sign In / Sign Up */}
        <div className="auth-footer">
          <p className="auth-toggle-text">
            {isSignIn ? "Don't have an account?" : "Already have an account?"}
          </p>
          <button
            className="auth-toggle-button"
            onClick={handleToggleMode}
            disabled={loading}
            type="button"
          >
            {isSignIn ? "Sign Up" : "Sign In"}
          </button>
        </div>

        {/* Divider */}
        <div className="auth-divider">
          <span>or</span>
        </div>

        {/* Social Login Placeholder */}
        <p className="auth-social-hint">
          More sign-in options coming soon
        </p>
      </div>
    </div>
  );
}