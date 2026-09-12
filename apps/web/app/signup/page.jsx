"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCustomer } from "../../components/CustomerProvider";
import { Mail, Lock, User, Phone, ArrowRight, AlertCircle, HelpCircle, CheckCircle } from "lucide-react";

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
    <div className="max-w-md w-full mx-auto py-8 sm:py-12">
      <div className="bg-white rounded-3xl border border-[#F3EFE6] shadow-xl shadow-amber-900/5 p-6 sm:p-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-400 via-[#FFCB05] to-yellow-400" />

        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-xs text-xl">
            ✨
          </div>
          <h1 className="text-2xl font-black text-slate-900 font-heading">
            Create an Account
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Join Medikart to save your Wishlist and enjoy seamless ordering
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-xs text-rose-800 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {typoSuggestion && (
          <div className="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-slate-800 animate-in fade-in space-y-2">
            <div className="flex items-center gap-2 font-bold text-amber-900">
              <HelpCircle className="w-4 h-4 text-amber-600" />
              <span>Did you mean: {typoSuggestion}?</span>
            </div>
            <p className="text-[11px] text-slate-600">
              We noticed a possible typo in your email domain.
            </p>
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={handleApplySuggestion}
                className="btn-amber-gradient px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer"
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
            <div className="relative">
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Muhammad Ali"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 text-xs text-slate-800 placeholder:text-slate-400 transition-all"
              />
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="name@example.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 text-xs text-slate-800 placeholder:text-slate-400 transition-all"
              />
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Phone Number (Optional)
            </label>
            <div className="relative">
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="03001234567"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 text-xs text-slate-800 placeholder:text-slate-400 transition-all"
              />
              <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Password
            </label>
            <div className="relative">
              <input
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Min 8 chars with uppercase & number"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 text-xs text-slate-800 placeholder:text-slate-400 transition-all"
              />
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              Must contain 8+ characters, uppercase, lowercase, and a number.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-amber-gradient py-3 rounded-xl font-bold text-xs shadow-md shadow-amber-300/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 transition-all mt-4"
          >
            <span>{loading ? "Creating Account..." : "Create Account"}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-600">
            Already have an account?{" "}
            <Link
              href={`/login?redirect=${encodeURIComponent(redirect)}`}
              className="font-bold text-amber-700 hover:text-amber-800 hover:underline"
            >
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="max-w-md mx-auto py-12 text-center text-xs text-slate-400">Loading...</div>}>
      <SignupForm />
    </Suspense>
  );
}
