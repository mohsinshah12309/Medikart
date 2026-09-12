"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCustomer } from "../../components/CustomerProvider";
import AuthCard3D from "../../components/3d/AuthCard3D";
import Auth3DScene from "../../components/3d/Auth3DScene";
import { Lock, ArrowRight, AlertCircle, CheckCircle2, Eye, EyeOff } from "lucide-react";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const { resetPassword } = useCustomer();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!token) {
      setError("Reset token is missing. Please use the link provided in your email.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      await resetPassword(token, password);
      setSuccess(true);
      setTimeout(() => {
        router.push("/login");
      }, 2500);
    } catch (err) {
      setError(err.message || "Failed to reset password. Link may be invalid or expired.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-140px)] flex items-center justify-center px-4 py-8 overflow-hidden">
      {/* Interactive 3D WebGL Background */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <Auth3DScene className="w-full h-full opacity-75" interactive={true} />
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-amber-200/30 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-emerald-200/25 rounded-full blur-3xl pointer-events-none" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <AuthCard3D
          badgeIcon="🔒"
          badgeTitle="Create New Password"
          badgeSubtitle="Choose a strong, unique password for your account"
          floatTags={[
            { text: "🔑 Strong Hash", position: "top-left", delay: "0s" },
            { text: "🛡️ Instant Update", position: "top-right", delay: "1.2s" },
          ]}
        >
          {error && (
            <div className="mb-5 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-xs text-rose-800 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success ? (
            <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 text-center space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
              <p className="font-bold text-sm">Password Reset Successfully!</p>
              <p className="text-[11px] text-emerald-700">
                Redirecting you to the sign in page...
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  New Password
                </label>
                <div className="relative group">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min 8 chars with uppercase & number"
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 text-xs text-slate-800 placeholder:text-slate-400 transition-all shadow-xs group-hover:border-amber-300"
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors group-hover:text-amber-500" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Confirm Password
                </label>
                <div className="relative group">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 text-xs text-slate-800 placeholder:text-slate-400 transition-all shadow-xs group-hover:border-amber-300"
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors group-hover:text-amber-500" />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !password}
                className="relative w-full btn-amber-gradient py-3 rounded-xl font-bold text-xs shadow-lg shadow-amber-300/40 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 transition-all active:scale-[0.98] mt-2 group overflow-hidden"
              >
                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none" />
                <span>{loading ? "Updating Password..." : "Reset Password"}</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </button>
            </form>
          )}

          <div className="mt-6 pt-5 border-t border-slate-100 text-center">
            <Link
              href="/login"
              className="text-xs font-bold text-slate-600 hover:text-amber-700 transition-colors"
            >
              ← Back to Sign In
            </Link>
          </div>
        </AuthCard3D>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-[60vh] flex items-center justify-center text-xs text-slate-400">Loading...</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
