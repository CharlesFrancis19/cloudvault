// src/pages/auth.js
import { useRouter } from "next/router";
import { useState } from "react";
import {
  signup, resendConfirmation, confirmSignup,
  login, loginMfa,
  mfaSetupStart, mfaSetupVerify,
} from "./api/api";
import {
  Mail, Lock, User, Eye, EyeOff, ShieldCheck, Smartphone, CheckCircle2, QrCode
} from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";

export default function AuthPage() {
  const router = useRouter();

  // modes: 'login' | 'signup' | 'confirm' | 'setup' | 'challenge'
  const [mode, setMode] = useState("login");

  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPw, setConfirmPw] = useState("");

  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [code, setCode] = useState("");

  const [challengeName, setChallengeName] = useState(""); // 'MFA_SETUP' | 'SOFTWARE_TOKEN_MFA' | 'SMS_MFA'
  const [session, setSession] = useState("");

  const [totpSecret, setTotpSecret] = useState("");
  const [totpUri, setTotpUri] = useState("");

  const resetTransient = () => {
    setError(""); setInfo(""); setCode(""); setSubmitting(false);
    setChallengeName(""); setSession(""); setTotpSecret(""); setTotpUri("");
  };

  /* ---------- Signup ---------- */
  async function onSignup() {
    setError(""); setInfo("");
    // Match typical Cognito policy (adjust to your pool if needed)
    const policy = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
    if (!policy.test(password)) {
      return setError("Password must include upper, lower, number, and symbol (min 8).");
    }
    if (password !== confirmPw) return setError("Passwords do not match");

    try {
      setSubmitting(true);
      const resp = await signup({ name: name.trim(), email: email.toLowerCase().trim(), password });
      if (resp?.requiresConfirmation) {
        setInfo("We’ve sent a confirmation code to your email.");
        setMode("confirm");
        return;
      }
      setInfo("Check your email for a confirmation code.");
      setMode("confirm");
    } catch (e) {
      setError(e.message || "Signup failed");
    } finally {
      setSubmitting(false);
    }
  }

  async function onResend() {
    setError(""); setInfo("");
    try {
      await resendConfirmation({ email: email.toLowerCase().trim() });
      setInfo("Confirmation code resent. Check your inbox.");
    } catch (e) {
      setError(e.message || "Failed to resend code");
    }
  }

  /* ---------- Confirm email -> MFA_SETUP ---------- */
  async function onConfirmSignup() {
    setError(""); setInfo("");
    try {
      setSubmitting(true);
      const resp = await confirmSignup({
        email: email.toLowerCase().trim(),
        code: code.trim(),
        password, // to start auth challenge server-side
      });

      if (resp?.challengeName === "MFA_SETUP" && resp?.session) {
        const start = await mfaSetupStart({ session: resp.session, email: email.toLowerCase().trim() });
        setTotpSecret(start.secretCode || "");
        setTotpUri(start.otpauth || "");
        setSession(start.session || resp.session); // always keep latest session
        setChallengeName("MFA_SETUP");
        setCode("");
        setInfo("Scan the QR with your authenticator app, then enter the 6-digit code.");
        setMode("setup");
        return;
      }

      setInfo("Email confirmed. Please sign in.");
      setMode("login");
    } catch (e) {
      setError(e.message || "Confirmation failed");
    } finally {
      setSubmitting(false);
    }
  }

  /* ---------- Verify TOTP during setup (single-use session) ---------- */
  async function onTotpVerify() {
    setError(""); setInfo("");
    try {
      setSubmitting(true);
      const resp = await mfaSetupVerify({
        email: email.toLowerCase().trim(),
        code: code.trim(),
        session,
      });

      if (resp?.challengeName === "SOFTWARE_TOKEN_MFA" && resp?.session) {
        // Pool may immediately require TOTP again to complete sign-in; guide user to login
        setInfo("MFA set. Please sign in.");
        setMode("login");
        resetTransient();
        return;
      }

      setInfo("MFA set. Please sign in.");
      setMode("login");
      resetTransient();
    } catch (e) {
      setError(e.message || "TOTP verify failed");
    } finally {
      setSubmitting(false);
    }
  }

  /* ---------- Login + MFA ---------- */
  async function onLogin() {
    setError(""); setInfo("");
    try {
      setSubmitting(true);
      const resp = await login({ email: email.toLowerCase().trim(), password });

      if (resp?.challengeName === "SOFTWARE_TOKEN_MFA" || resp?.challengeName === "SMS_MFA") {
        setChallengeName(resp.challengeName);
        setSession(resp.session); // keep latest session
        setCode("");
        setInfo(resp.challengeName === "SOFTWARE_TOKEN_MFA"
          ? "Enter the code from your authenticator app."
          : "Enter the SMS code sent to your phone.");
        setMode("challenge");
        return;
      }
      if (resp?.challengeName === "MFA_SETUP") {
        const start = await mfaSetupStart({ session: resp.session, email: email.toLowerCase().trim() });
        setTotpSecret(start.secretCode || "");
        setTotpUri(start.otpauth || "");
        setSession(start.session || resp.session);
        setChallengeName("MFA_SETUP");
        setCode("");
        setInfo("Scan the QR with your authenticator app, then enter the 6-digit code.");
        setMode("setup");
        return;
      }

      if (resp?.accessToken) {
        router.push("/dashboard");
        return;
      }

      throw new Error("Unexpected login response");
    } catch (e) {
      if (e?.status === 403 && e?.data?.code === "USER_NOT_CONFIRMED") {
        setInfo("Please confirm your email with the 6-digit code we sent.");
        setError("");
        setCode("");
        setMode("confirm");
        return;
      }
      setError(e.message || "Login failed");
    } finally {
      setSubmitting(false);
    }
  }

  async function onLoginMfa() {
    setError(""); setInfo("");
    try {
      setSubmitting(true);
      const resp = await loginMfa({
        email: email.toLowerCase().trim(),
        code: code.trim(),
        session,
        challengeName,
      });
      if (resp?.accessToken) {
        router.push("/dashboard");
        return;
      }
      throw new Error("Unexpected MFA response");
    } catch (e) {
      setError(e.message || "MFA failed");
    } finally {
      setSubmitting(false);
    }
  }

  function onSubmit(e) {
    e.preventDefault();
    if (submitting) return;

    if (mode === "signup") return onSignup();
    if (mode === "confirm") return onConfirmSignup();
    if (mode === "setup") return onTotpVerify();
    if (mode === "challenge") return onLoginMfa();
    return onLogin();
  }

  const heading = (() => {
    if (mode === "signup") return "Create your account";
    if (mode === "confirm") return "Confirm your email";
    if (mode === "setup") return "Set up your Authenticator";
    if (mode === "challenge") return "Verify your code";
    return "Welcome Back";
  })();

  const sub = (() => {
    if (mode === "signup") return "Join SecureVault in seconds";
    if (mode === "confirm") return "Enter the code we emailed you";
    if (mode === "setup") return "Scan the QR then enter the 6-digit code";
    if (mode === "challenge") return (challengeName === "SOFTWARE_TOKEN_MFA" ? "Authenticator code required" : "SMS code required");
    return "Sign in to continue";
  })();

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="p-8 sm:p-10 md:pt-12 md:pb-10 md:px-10 bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex flex-col items-center text-center space-y-6 sm:space-y-8">
          <span className="flex shrink-0 overflow-hidden rounded-full relative h-20 w-20 sm:h-24 sm:w-24 shadow-lg ring-4 ring-white/50">
            <img className="aspect-square h-full w-full object-cover" alt="SecureVault logo"
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/36178ee92_logo.png" />
          </span>

          <div className="space-y-2 sm:space-y-3">
            <h1 className="text-2xl sm:3xl font-bold text-slate-900 tracking-tight">{heading}</h1>
            <p className="text-slate-500 text-sm sm:text-base font-medium">{sub}</p>
          </div>

          <form className="w-full space-y-5" onSubmit={onSubmit}>
            <div className="space-y-4">
              {mode === "signup" && (
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">Full name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="text" required placeholder="Your name"
                      value={name} onChange={(e) => setName(e.target.value)}
                      className="pl-10 h-11 sm:h-12 w-full bg-slate-50/50 border border-slate-200 focus:border-slate-400 focus:ring-slate-400 rounded-xl placeholder:text-slate-400 text-sm"
                    />
                  </div>
                </div>
              )}

              {/* Email — always visible; read-only during confirm/challenge/setup */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={["confirm","challenge","setup"].includes(mode)}
                    className="pl-10 h-11 sm:h-12 w-full bg-slate-50/50 border border-slate-200 focus:border-slate-400 focus:ring-slate-400 rounded-xl placeholder:text-slate-400 text-sm disabled:bg-slate-100 disabled:text-slate-500"
                  />
                </div>
              </div>

              {/* Password — only on initial login or during signup */}
              {(mode === "signup" || (mode === "login" && !["confirm","challenge","setup"].includes(mode))) && (
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type={showPw ? "text" : "password"}
                      required
                      placeholder={mode === "signup" ? "At least 8 chars; upper/lower/number/symbol" : "••••••••"}
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
              )}

              {/* Confirm password (signup only) */}
              {mode === "signup" && (
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">Confirm password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type={showConfirm ? "text" : "password"} required placeholder="Re-enter password"
                      value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)}
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

              {/* Single code input (confirm/MFA/setup) */}
              {["confirm", "challenge", "setup"].includes(mode) && (
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                    {mode === "confirm"
                      ? <CheckCircle2 className="h-4 w-4 text-slate-500" />
                      : mode === "challenge"
                        ? (challengeName === "SOFTWARE_TOKEN_MFA" ? <ShieldCheck className="h-4 w-4 text-slate-500" /> : <Smartphone className="h-4 w-4 text-slate-500" />)
                        : <ShieldCheck className="h-4 w-4 text-slate-500" />}
                    {mode === "confirm" ? "Email confirmation code" :
                      mode === "challenge" ? (challengeName === "SOFTWARE_TOKEN_MFA" ? "Authenticator code" : "SMS code") :
                      "6-digit code from app"}
                  </label>
                  <input
                    type="text" inputMode="numeric" placeholder="123456" required
                    value={code} onChange={(e) => setCode(e.target.value)}
                    className="h-11 sm:h-12 w-full bg-slate-50/50 border border-slate-200 focus:border-slate-400 focus:ring-slate-400 rounded-xl placeholder:text-slate-400 text-sm px-3 tracking-widest"
                  />
                  {mode === "confirm" && (
                    <button type="button" onClick={onResend} className="text-sm text-slate-600 hover:underline">
                      Resend code
                    </button>
                  )}
                </div>
              )}

              {/* QR during setup */}
              {mode === "setup" && (
                <div className="flex flex-col items-center gap-3">
                  <div className="p-3 border rounded-xl">
                    {totpUri
                      ? <QRCodeCanvas value={totpUri} size={168} includeMargin />
                      : <div className="w-[168px] h-[168px] grid place-items-center text-slate-400"><QrCode className="w-10 h-10" /></div>}
                  </div>
                  <div className="text-xs text-slate-500">
                    Secret: <span className="font-mono">{totpSecret}</span>
                  </div>
                </div>
              )}
            </div>

            {error && <p className="text-red-500 text-sm -mt-2">{error}</p>}
            {info && !error && <p className="text-amber-600 text-sm -mt-2">{info}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center justify-center gap-2 w-full h-11 sm:h-12 bg-slate-900 hover:bg-slate-800 disabled:opacity-70 disabled:cursor-not-allowed text-white font-medium shadow-sm rounded-xl transition-all duration-200"
            >
              {submitting
                ? (mode === "signup" ? "Creating account..." :
                   mode === "confirm" ? "Confirming..." :
                   mode === "setup" ? "Verifying..." :
                   mode === "challenge" ? "Verifying..." :
                   "Signing in...")
                : (mode === "signup" ? "Create account" :
                   mode === "confirm" ? "Confirm email" :
                   mode === "setup" ? "Verify code" :
                   mode === "challenge" ? "Verify code" :
                   "Sign in")}
            </button>
          </form>

          {/* toggles */}
          {["login","signup"].includes(mode) && (
            <div className="mt-4 text-sm text-slate-500">
              {mode === "login" ? (
                <>Need an account? <button type="button" onClick={() => { setMode("signup"); resetTransient(); }} className="font-medium text-slate-700 hover:underline">Sign up</button></>
              ) : (
                <>Already have an account? <button type="button" onClick={() => { setMode("login"); resetTransient(); }} className="font-medium text-slate-700 hover:underline">Sign in</button></>
              )}
            </div>
          )}

          {["confirm","setup","challenge"].includes(mode) && (
            <button type="button" onClick={() => { setMode("login"); resetTransient(); }}
              className="text-sm text-slate-500 hover:underline">
              Click to Login Instead
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
