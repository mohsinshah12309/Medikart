"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCustomer } from "../../components/CustomerProvider";
import AuthCard3D from "../../components/3d/AuthCard3D";
import Auth3DScene from "../../components/3d/Auth3DScene";
import { Mail, Lock, User, Phone, ArrowRight, AlertCircle, HelpCircle, Sparkles, CheckCircle } from "lucide-react";
import PasswordInput from "../../components/PasswordInput";

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/";

  const { signup } = useCustomer();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
  });
  const [error, setError] = useState("");
  const [typoSuggestion, setTypoSuggestion] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e, override = false) => {
    if (e) e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await signup({
        ...formData,
        overrideSuggestion: override,
      });

      if (res.needsConfirmation && res.suggestion) {
        setTypoSuggestion(res.suggestion);
        setLoading(false);
        return;
      }

      router.push(`/verify-email?email=${encodeURIComponent(formData.email)}&redirect=${encodeURIComponent(redirect)}`);
    } catch (err) {
      setError(err.message || "Failed to create account. Please check your inputs.");
    } finally {
      setLoading(false);
    }
  };

  const handleApplySuggestion = () => {
    setFormData((prev) => ({ ...prev, email: typoSuggestion }));
    setTypoSuggestion(null);
  };

  return (
    <div className="relative min-h-[calc(100vh-140px)] flex items-center justify-center px-4 py-8 overflow-hidden">
      {/* Interactive 3D WebGL Background Scene */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <Auth3DScene className="w-full h-full opacity-75" interactive={true} />
        {/* Soft radial atmospheric backdrop lights */}
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-amber-200/30 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-emerald-200/25 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* 3D Perspective Card Container */}
      <div className="relative z-10 w-full max-w-md">
        {/* Quick 3D Pill Switcher Tabs */}
        <div className="flex items-center justify-center gap-1.5 p-1 bg-white/80 backdrop-blur-md rounded-2xl border border-amber-100 shadow-sm max-w-[280px] mx-auto mb-4">
          <Link
            href={`/login?redirect=${encodeURIComponent(redirect)}`}
            className="flex-1 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 text-center rounded-xl hover:bg-amber-50/60 transition-all"
          >
            Sign In
          </Link>
          <button
            type="button"
            className="flex-1 py-1.5 text-xs font-bold rounded-xl bg-gradient-to-r from-amber-400 to-[#FFCB05] text-slate-950 shadow-xs transition-all"
          >
            Sign Up
          </button>
        </div>

        <AuthCard3D
          badgeIcon="✨"
          badgeTitle="Create Account"
          badgeSubtitle="Join Medikart to unlock Wishlists, rapid checkout & verified orders"
          floatTags={[
            { text: "⚡ Instant 6-Digit OTP", position: "top-left", delay: "0s" },
            { text: "🔒 Strictly Private", position: "top-right", delay: "1.4s" },
            { text: "💊 Smart Cart Sync", position: "bottom-left", delay: "0.7s" },
          ]}
        >
          {error && (
            <div className="mb-5 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-xs text-rose-800 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {typoSuggestion && (
            <div className="mb-5 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-slate-800 animate-in fade-in space-y-2">
              <div className="flex items-center gap-2 font-bold text-amber-900">
                <HelpCircle className="w-4 h-4 text-amber-600" />
                <span>Did you mean: {typoSuggestion}?</span>
              </div>
              <p className="text-[11px] text-slate-600">
                We detected a potential typo in your email domain.
              </p>
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleApplySuggestion}
                  className="btn-amber-gradient px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer shadow-xs"
                >
                  Yes, use {typoSuggestion}
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    setTypoSuggestion(null);
                    handleSubmit(e, true);
                  }}
                  className="px-3 py-1.5 rounded-lg border border-amber-300 text-xs font-semibold bg-white text-slate-700 hover:bg-amber-50 cursor-pointer"
                >
                  Keep {formData.email}
                </button>
              </div>
            </div>
          )}

          <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Full Name
              </label>
              <div className="relative group">
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Muhammad Ali"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 text-xs text-slate-800 placeholder:text-slate-400 transition-all shadow-xs group-hover:border-amber-300"
                />
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors group-hover:text-amber-500" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Email Address
              </label>
              <div className="relative group">
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="name@example.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 text-xs text-slate-800 placeholder:text-slate-400 transition-all shadow-xs group-hover:border-amber-300"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors group-hover:text-amber-500" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Phone Number (Optional)
              </label>
              <div className="relative group">
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="03001234567"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 text-xs text-slate-800 placeholder:text-slate-400 transition-all shadow-xs group-hover:border-amber-300"
                />
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors group-hover:text-amber-500" />
              </div>
            </div>

            <div>
              <PasswordInput
                id="signup-password"
                name="password"
                label="Password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Min 8 chars with uppercase & number"
                required
                disabled={loading}
                leadingIcon={<Lock className="w-4 h-4" />}
                autoComplete="new-password"
                minLength={8}
              />
              <p className="text-xs text-slate-500 mt-1.5">
                Must contain 8+ characters, uppercase, lowercase, and a number.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="relative w-full btn-amber-gradient py-3 rounded-xl font-bold text-xs shadow-lg shadow-amber-300/40 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 transition-all active:scale-[0.98] mt-3 group overflow-hidden"
            >
              <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none" />
              <span>{loading ? "Creating Account..." : "Create Account"}</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-600">
              Already have an account?{" "}
              <Link
                href={`/login?redirect=${encodeURIComponent(redirect)}`}
                className="font-bold text-amber-700 hover:text-amber-800 hover:underline inline-flex items-center gap-0.5"
              >
                <span>Sign In</span>
                <Sparkles className="w-3 h-3 text-amber-500" />
              </Link>
            </p>
          </div>
        </AuthCard3D>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="min-h-[60vh] flex items-center justify-center text-xs text-slate-400">Loading...</div>}>
      <SignupForm />
    </Suspense>
  );
}
