"use client";

import React, { useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useCustomer } from "../../components/CustomerProvider";
import AuthCard3D from "../../components/3d/AuthCard3D";
import { Mail, ArrowRight, AlertCircle, CheckCircle2 } from "lucide-react";

// Code-split Three.js 3D background scene
const Auth3DScene = dynamic(() => import("../../components/3d/Auth3DScene"), {
  ssr: false,
});

export default function ForgotPasswordPage() {
  const { forgotPassword } = useCustomer();
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    if (loading) return;
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await forgotPassword(email);
      setSubmitted(true);
    } catch (err) {
      setError(err.message || "Failed to submit request.");
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
          badgeIcon="🔑"
          badgeTitle="Reset Password"
          badgeSubtitle="Enter your account email to receive a secure recovery link"
          floatTags={[
            { text: "🔒 Single-Use Token", position: "top-left", delay: "0s" },
            { text: "⚡ 30-Min Expiry", position: "top-right", delay: "1.2s" },
          ]}
        >
          {error && (
            <div className="mb-5 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-xs text-rose-800 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {submitted ? (
            <div className="text-center space-y-4">
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-start gap-3 text-left">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Instructions Sent!</p>
                  <p className="text-[11px] mt-1 text-emerald-700">
                    If an account exists for <span className="font-semibold">{email}</span>, a secure password reset link has been emailed to you.
                  </p>
                </div>
              </div>

              <Link
                href="/login"
                className="inline-block btn-amber-gradient px-6 py-2.5 rounded-xl font-bold text-xs shadow-md shadow-amber-300/30"
              >
                Back to Sign In
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="reset-email" className="block text-xs font-bold text-slate-700 mb-1.5">
                  Email Address
                </label>
                <div className="relative group">
                  <input
                    id="reset-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 text-xs text-slate-800 placeholder:text-slate-400 transition-all shadow-xs group-hover:border-amber-300"
                  />
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors group-hover:text-amber-500" />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="relative w-full btn-amber-gradient py-3 rounded-xl font-bold text-xs shadow-lg shadow-amber-300/40 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 transition-all active:scale-[0.98] mt-2 group overflow-hidden"
              >
                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none" />
                <span>{loading ? "Sending link..." : "Send Reset Link"}</span>
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
