"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCustomer } from "../../components/CustomerProvider";
import { ShieldCheck, ArrowRight, AlertCircle, RefreshCw, CheckCircle2 } from "lucide-react";

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailParam = searchParams.get("email") || "";
  const redirect = searchParams.get("redirect") || "/";

  const { verifyEmail, resendVerification } = useCustomer();
  const [email, setEmail] = useState(emailParam);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [infoMessage, setInfoMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const handleVerify = async (e) => {
    e.preventDefault();
    setError("");
    setInfoMessage("");
    setLoading(true);

    try {
      await verifyEmail(email, code);
      router.push(redirect);
    } catch (err) {
      setError(err.message || "Invalid or expired verification code");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError("");
    setInfoMessage("");
    setResending(true);

    try {
      const res = await resendVerification(email, true);
      setInfoMessage(res.message || "A new 6-digit verification code has been sent.");
    } catch (err) {
      setError(err.message || "Failed to resend code. Please wait a moment.");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="max-w-md w-full mx-auto py-8 sm:py-12">
      <div className="bg-white rounded-3xl border border-[#F3EFE6] shadow-xl shadow-amber-900/5 p-6 sm:p-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-400 via-[#FFCB05] to-yellow-400" />

        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-xs text-xl">
            📬
          </div>
          <h1 className="text-2xl font-black text-slate-900 font-heading">
            Verify Your Email
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            We sent a 6-digit verification code to <span className="font-bold text-slate-800">{email || "your email"}</span>
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-xs text-rose-800 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {infoMessage && (
          <div className="mb-6 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-start gap-2.5 text-xs text-emerald-800 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
            <span>{infoMessage}</span>
          </div>
        )}

        <form onSubmit={handleVerify} className="space-y-4">
          {!emailParam && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 text-xs text-slate-800"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 text-center">
              Enter 6-Digit Code
            </label>
            <input
              type="text"
              required
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, ""))}
              placeholder="123456"
              className="w-full text-center tracking-[0.4em] font-mono text-xl py-3 rounded-xl border-2 border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-400 text-slate-900 font-black bg-amber-50/40"
            />
          </div>

          <button
            type="submit"
            disabled={loading || code.length !== 6}
            className="w-full btn-amber-gradient py-3 rounded-xl font-bold text-xs shadow-md shadow-amber-300/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 transition-all mt-2"
          >
            <span>{loading ? "Verifying..." : "Verify & Log In"}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between text-xs">
          <button
            type="button"
            onClick={handleResend}
            disabled={resending || !email}
            className="font-bold text-amber-700 hover:text-amber-800 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${resending ? "animate-spin" : ""}`} />
            <span>Resend Code</span>
          </button>

          <Link
            href="/login"
            className="text-slate-500 hover:text-slate-800"
          >
            Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="max-w-md mx-auto py-12 text-center text-xs text-slate-400">Loading...</div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}
