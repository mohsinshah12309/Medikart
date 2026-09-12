"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useCustomer } from "../../components/CustomerProvider";
import { Mail, ArrowRight, AlertCircle, CheckCircle2 } from "lucide-react";

export default function ForgotPasswordPage() {
  const { forgotPassword } = useCustomer();
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
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
    <div className="max-w-md w-full mx-auto py-8 sm:py-12">
      <div className="bg-white rounded-3xl border border-[#F3EFE6] shadow-xl shadow-amber-900/5 p-6 sm:p-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-400 via-[#FFCB05] to-yellow-400" />

        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-xs text-xl">
            🔑
          </div>
          <h1 className="text-2xl font-black text-slate-900 font-heading">
            Reset Password
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Enter your account email to receive a password reset link
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-xs text-rose-800 animate-in fade-in">
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
              className="inline-block btn-amber-gradient px-6 py-2.5 rounded-xl font-bold text-xs"
            >
              Back to Sign In
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 text-xs text-slate-800 placeholder:text-slate-400 transition-all"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-amber-gradient py-3 rounded-xl font-bold text-xs shadow-md shadow-amber-300/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 transition-all mt-2"
            >
              <span>{loading ? "Sending link..." : "Send Reset Link"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        <div className="mt-8 pt-6 border-t border-slate-100 text-center">
          <Link
            href="/login"
            className="text-xs font-bold text-slate-600 hover:text-amber-700"
          >
            ← Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
