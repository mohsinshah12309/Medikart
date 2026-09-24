"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { useCustomer } from "../../components/CustomerProvider";
import AuthCard3D from "../../components/3d/AuthCard3D";
import { ArrowRight, AlertCircle, RefreshCw, CheckCircle2, ShieldCheck, Mail } from "lucide-react";

// Code-split Three.js 3D background scene
const Auth3DScene = dynamic(() => import("../../components/3d/Auth3DScene"), {
  ssr: false,
});

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
    <div className="relative min-h-[calc(100vh-140px)] flex items-center justify-center px-4 py-8 overflow-hidden">
      {/* Interactive 3D WebGL Background */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <Auth3DScene className="w-full h-full opacity-75" interactive={true} />
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-amber-200/30 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-emerald-200/25 rounded-full blur-3xl pointer-events-none" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <AuthCard3D
          badgeIcon="📬"
          badgeTitle="Verify Your Email"
          badgeSubtitle={`We sent a 6-digit code to ${email || "your registered email"}`}
          floatTags={[
            { text: "⚡ 6-Digit PIN", position: "top-left", delay: "0s" },
            { text: "🔒 100% Protected", position: "top-right", delay: "1.2s" },
          ]}
        >
          {error && (
            <div className="mb-5 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-xs text-rose-800 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {infoMessage && (
            <div className="mb-5 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-start gap-2.5 text-xs text-emerald-800 animate-in fade-in">
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
                <div className="relative group">
                  <input
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
            )}

            <div>
              <label htmlFor="otp-code" className="block text-xs font-bold text-slate-700 mb-1.5 text-center">
                Enter 6-Digit Code
              </label>
              <input
                id="otp-code"
                type="text"
                required
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, ""))}
                placeholder="123456"
                className="w-full text-center tracking-[0.4em] font-mono text-2xl py-3 rounded-2xl border-2 border-amber-300 focus:outline-none focus:ring-4 focus:ring-amber-200 text-slate-900 font-black bg-amber-50/50 shadow-inner"
              />
            </div>

            <button
              type="submit"
              disabled={loading || code.length !== 6}
              className="relative w-full btn-amber-gradient py-3 rounded-xl font-bold text-xs shadow-lg shadow-amber-300/40 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 transition-all active:scale-[0.98] mt-2 group overflow-hidden"
            >
              <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none" />
              <span>{loading ? "Verifying..." : "Verify & Sign In"}</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={handleResend}
              disabled={resending || !email}
              className="font-bold text-amber-700 hover:text-amber-800 flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${resending ? "animate-spin" : ""}`} />
              <span>Resend Code</span>
            </button>

            <Link
              href="/login"
              className="text-slate-500 hover:text-slate-800 font-medium transition-colors"
            >
              Back to Sign In
            </Link>
          </div>
        </AuthCard3D>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="min-h-[60vh] flex items-center justify-center text-xs text-slate-400">Loading...</div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}
