// src/pages/auth.js
import { useRouter } from "next/router";
import { useState } from "react";
import { apiFetch, setAuth } from "../pages/api/api";
import { Mail, Lock, User, Eye, EyeOff } from "lucide-react";

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState("login"); // "login" | "signup"

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Enable bypass in dev or when explicitly allowed via env
  const allowBypass =
    process.env.NEXT_PUBLIC_ADMIN_BYPASS === "true" ||
    process.env.NODE_ENV !== "production";

  const devBypassIfAdmin = async () => {
    if (!allowBypass) return false;
    const isAdminCreds = email.trim() === "admin" && password === "admin";
    if (!isAdminCreds) return false;

    // Create a fake admin session for local/dev
    const fakeUser = { name: "Administrator", email: "admin@local", role: "admin" };
    setAuth("dev-admin-token", fakeUser);
    router.push("/dashboard"); // or "/admin" if you have an admin page
    return true;
  };

  const handleLogin = async () => {
    setError("");
    try {
      setSubmitting(true);

      // Dev bypass: admin / admin
      const usedBypass = await devBypassIfAdmin();
      if (usedBypass) return;

      const normalizedEmail = email.toLowerCase().trim();
      const { accessToken, user } = await apiFetch("/login", {
        method: "POST",
        body: { email: normalizedEmail, password },
      });
      if (!accessToken) throw new Error("No access token returned");

      setAuth(accessToken, user);
      router.push("/dashboard");
    } catch (e) {
      setError(e.message || "Login failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSignUp = async () => {
    setError("");
    if (password.length < 8) return setError("Password must be at least 8 characters");
    if (password !== confirm) return setError("Passwords do not match");

    try {
      setSubmitting(true);
      const normalizedEmail = email.toLowerCase().trim();
      const cleanName = name.trim();
      const { accessToken } = await apiFetch("/signup", {
        method: "POST",
        body: { name: cleanName, email: normalizedEmail, password },
      });
      if (!accessToken) throw new Error("No access token returned");

      setAuth(accessToken, { email: normalizedEmail, name: cleanName });
      router.push("/dashboard");
    } catch (e) {
      setError(e.message || "Sign up failed");
    } finally {
      setSubmitting(false);
    }
  };

  const onSubmit = (e) => {
    e.preventDefault();
    if (submitting) return;
    if (mode === "login") handleLogin();
    else handleSignUp();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="p-8 sm:p-10 md:pt-12 md:pb-10 md:px-10 bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex flex-col items-center text-center space-y-6 sm:space-y-8">
          {/* Logo */}
          <span className="flex shrink-0 overflow-hidden rounded-full relative h-20 w-20 sm:h-24 sm:w-24 shadow-lg ring-4 ring-white/50">
            <img
              className="aspect-square h-full w-full object-cover"
              alt="SecureVault logo"
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/36178ee92_logo.png"
            />
          </span>

          {/* Heading */}
          <div className="space-y-2 sm:space-y-3">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              {mode === "login" ? "Welcome back" : "Create your account"}
            </h1>
            <p className="text-slate-500 text-sm sm:text-base font-medium">
              {mode === "login" ? "Sign in to continue" : "Join SecureVault in seconds"}
            </p>
            {allowBypass && (
              <p className="text-xs text-slate-400">
                Dev bypass enabled: use <span className="font-mono">admin / admin</span>
              </p>
            )}
          </div>

          {/* Form */}
          <form className="w-full space-y-5" onSubmit={onSubmit} noValidate>
            <div className="space-y-4">
              {mode === "signup" && (
                <div className="space-y-1.5">
                  <label htmlFor="name" className="text-sm font-medium text-slate-700">
                    Full name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      id="name"
                      placeholder="Your name"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="pl-10 h-11 sm:h-12 w-full bg-slate-50/50 border border-slate-200 focus:border-slate-400 focus:ring-slate-400 rounded-xl placeholder:text-slate-400 text-sm"
                    />
                  </div>
                </div>
              )}

              {/* Email */}
              <div className="space-y-1.5">
                <label htmlFor="email" className="text-sm font-medium text-slate-700">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="email"
                    id="email"
                    placeholder="you@example.com (or 'admin' in dev)"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-11 sm:h-12 w-full bg-slate-50/50 border border-slate-200 focus:border-slate-400 focus:ring-slate-400 rounded-xl placeholder:text-slate-400 text-sm"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label htmlFor="password" className="text-sm font-medium text-slate-700">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type={showPw ? "text" : "password"}
                    id="password"
                    placeholder={mode === "signup" ? "At least 8 characters" : "••••••••"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 h-11 sm:h-12 w-full bg-slate-50/50 border border-slate-200 focus:border-slate-400 focus:ring-slate-400 rounded-xl placeholder:text-slate-400 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm password (signup only) */}
              {mode === "signup" && (
                <div className="space-y-1.5">
                  <label htmlFor="confirm" className="text-sm font-medium text-slate-700">
                    Confirm password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type={showConfirm ? "text" : "password"}
                      id="confirm"
                      placeholder="Re-enter password"
                      required
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      className="pl-10 pr-10 h-11 sm:h-12 w-full bg-slate-50/50 border border-slate-200 focus:border-slate-400 focus:ring-slate-400 rounded-xl placeholder:text-slate-400 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm((s) => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {error && <p className="text-red-500 text-sm -mt-2">{error}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center justify-center gap-2 w-full h-11 sm:h-12 bg-slate-900 hover:bg-slate-800 disabled:opacity-70 disabled:cursor-not-allowed text-white font-medium shadow-sm rounded-xl transition-all duration-200"
            >
              {submitting
                ? mode === "login"
                  ? "Signing in..."
                  : "Creating account..."
                : mode === "login"
                ? "Sign in"
                : "Create account"}
            </button>
          </form>

          {/* Toggle */}
          <div className="mt-4 text-sm text-slate-500">
            {mode === "login" ? (
              <>
                Need an account?{" "}
                <button
                  type="button"
                  onClick={() => setMode("signup")}
                  className="font-medium text-slate-700 hover:underline"
                >
                  Sign up
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => setMode("login")}
                  className="font-medium text-slate-700 hover:underline"
                >
                  Sign in
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
