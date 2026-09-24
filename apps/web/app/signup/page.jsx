"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { useCustomer } from "../../components/CustomerProvider";
import AuthCard3D from "../../components/3d/AuthCard3D";
import {
  Mail,
  Lock,
  User,
  Phone,
  ArrowRight,
  AlertCircle,
  HelpCircle,
  Sparkles,
  Check,
  X,
} from "lucide-react";
import PasswordInput from "../../components/PasswordInput";

// Code-split Three.js 3D background scene
const Auth3DScene = dynamic(() => import("../../components/3d/Auth3DScene"), {
  ssr: false,
});

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
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState("");
  const [typoSuggestion, setTypoSuggestion] = useState(null);
  const [loading, setLoading] = useState(false);

  // Password requirement checks
  const passLength = formData.password.length >= 8;
  const passUpper = /[A-Z]/.test(formData.password);
  const passLower = /[a-z]/.test(formData.password);
  const passNumber = /[0-9]/.test(formData.password);
  const isPasswordValid = passLength && passUpper && passLower && passNumber;

  const validateClientSide = () => {
    const errors = {};

    if (!formData.name.trim()) {
      errors.name = "Please enter your full name.";
    } else if (formData.name.trim().length < 2) {
      errors.name = "Full name must be at least 2 characters long.";
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      errors.email = "Please enter your email address.";
    } else if (!emailRegex.test(formData.email.trim())) {
      errors.email = "Please provide a valid email address (e.g., name@example.com).";
    }

    if (formData.phone.trim()) {
      const cleanPhone = formData.phone.replace(/[\s-]/g, "");
      if (!/^(\+92|0)?3[0-9]{9}$/.test(cleanPhone) && !/^\d{7,15}$/.test(cleanPhone)) {
        errors.phone = "Please enter a valid mobile number (e.g., 03001234567).";
      }
    }

    if (!formData.password) {
      errors.password = "Please choose a secure password.";
    } else if (!isPasswordValid) {
      errors.password = "Password does not meet all the security requirements below.";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
    if (error) setError("");
  };

  const handleSubmit = async (e, override = false) => {
    if (loading) return;
    if (e) e.preventDefault();
    setError("");

    if (!override && !validateClientSide()) {
      setError("Please fix the highlighted fields below to continue.");
      return;
    }

    setLoading(true);

    try {
      const res = await signup({
        ...formData,
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        overrideSuggestion: override,
      });

      if (res.needsConfirmation && res.suggestion) {
        setTypoSuggestion(res.suggestion);
        setLoading(false);
        return;
      }

      router.push(`/verify-email?email=${encodeURIComponent(formData.email.trim().toLowerCase())}&redirect=${encodeURIComponent(redirect)}`);
    } catch (err) {
      // Map server validation details to specific fields if present
      if (err.details && Array.isArray(err.details)) {
        const mappedErrors = {};
        err.details.forEach((d) => {
          if (d.field) mappedErrors[d.field] = d.message;
        });
        setFieldErrors(mappedErrors);
      }
      setError(err.message || "Failed to create account. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleApplySuggestion = () => {
    setFormData((prev) => ({ ...prev, email: typoSuggestion }));
    setTypoSuggestion(null);
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next.email;
      return next;
    });
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
              <div className="flex-1">
                <span className="font-bold block">Action Required</span>
                <span className="text-[11px] leading-relaxed text-rose-700">{error}</span>
              </div>
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

          <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-3.5" noValidate>
            {/* Full Name */}
            <div>
              <label htmlFor="signup-name" className="block text-xs font-bold text-slate-700 mb-1.5">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative group">
                <input
                  id="signup-name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="e.g. Muhammad Ali"
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-xs text-slate-800 placeholder:text-slate-400 transition-all shadow-xs ${
                    fieldErrors.name
                      ? "border-rose-300 bg-rose-50/40 focus:ring-2 focus:ring-rose-400 focus:border-rose-400"
                      : "border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 group-hover:border-amber-300"
                  }`}
                />
                <User className={`w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors ${
                  fieldErrors.name ? "text-rose-500" : "text-slate-400 group-hover:text-amber-500"
                }`} />
              </div>
              {fieldErrors.name && (
                <p className="text-[11px] text-rose-600 font-semibold mt-1 flex items-center gap-1">
                  <span>⚠️</span> {fieldErrors.name}
                </p>
              )}
            </div>

            {/* Email Address */}
            <div>
              <label htmlFor="signup-email" className="block text-xs font-bold text-slate-700 mb-1.5">
                Email Address <span className="text-rose-500">*</span>
              </label>
              <div className="relative group">
                <input
                  id="signup-email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  placeholder="name@example.com"
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-xs text-slate-800 placeholder:text-slate-400 transition-all shadow-xs ${
                    fieldErrors.email
                      ? "border-rose-300 bg-rose-50/40 focus:ring-2 focus:ring-rose-400 focus:border-rose-400"
                      : "border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 group-hover:border-amber-300"
                  }`}
                />
                <Mail className={`w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors ${
                  fieldErrors.email ? "text-rose-500" : "text-slate-400 group-hover:text-amber-500"
                }`} />
              </div>
              {fieldErrors.email && (
                <p className="text-[11px] text-rose-600 font-semibold mt-1 flex items-center gap-1">
                  <span>⚠️</span> {fieldErrors.email}
                </p>
              )}
            </div>

            {/* Phone Number */}
            <div>
              <label htmlFor="signup-phone" className="block text-xs font-bold text-slate-700 mb-1.5">
                Phone Number <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <div className="relative group">
                <input
                  id="signup-phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  placeholder="03001234567"
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-xs text-slate-800 placeholder:text-slate-400 transition-all shadow-xs ${
                    fieldErrors.phone
                      ? "border-rose-300 bg-rose-50/40 focus:ring-2 focus:ring-rose-400 focus:border-rose-400"
                      : "border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 group-hover:border-amber-300"
                  }`}
                />
                <Phone className={`w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors ${
                  fieldErrors.phone ? "text-rose-500" : "text-slate-400 group-hover:text-amber-500"
                }`} />
              </div>
              {fieldErrors.phone && (
                <p className="text-[11px] text-rose-600 font-semibold mt-1 flex items-center gap-1">
                  <span>⚠️</span> {fieldErrors.phone}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <PasswordInput
                id="signup-password"
                name="password"
                label="Password"
                value={formData.password}
                onChange={(e) => handleInputChange("password", e.target.value)}
                placeholder="Choose a strong password"
                required
                disabled={loading}
                leadingIcon={<Lock className="w-4 h-4" />}
                autoComplete="new-password"
              />

              {fieldErrors.password && (
                <p className="text-[11px] text-rose-600 font-semibold mt-1 flex items-center gap-1">
                  <span>⚠️</span> {fieldErrors.password}
                </p>
              )}

              {/* Real-Time Password Requirements Checklist */}
              <div className="mt-2.5 p-2.5 bg-slate-50/80 rounded-xl border border-slate-200/80 text-[11px] space-y-1.5">
                <span className="font-bold text-slate-700 block text-[10px] uppercase tracking-wider">
                  Password Requirements:
                </span>
                <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                  <span className={`flex items-center gap-1.5 font-medium transition-colors ${
                    passLength ? "text-emerald-700 font-bold" : "text-slate-500"
                  }`}>
                    {passLength ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <X className="w-3.5 h-3.5 text-slate-300" />}
                    8+ characters
                  </span>
                  <span className={`flex items-center gap-1.5 font-medium transition-colors ${
                    passUpper ? "text-emerald-700 font-bold" : "text-slate-500"
                  }`}>
                    {passUpper ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <X className="w-3.5 h-3.5 text-slate-300" />}
                    Uppercase letter (A-Z)
                  </span>
                  <span className={`flex items-center gap-1.5 font-medium transition-colors ${
                    passLower ? "text-emerald-700 font-bold" : "text-slate-500"
                  }`}>
                    {passLower ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <X className="w-3.5 h-3.5 text-slate-300" />}
                    Lowercase letter (a-z)
                  </span>
                  <span className={`flex items-center gap-1.5 font-medium transition-colors ${
                    passNumber ? "text-emerald-700 font-bold" : "text-slate-500"
                  }`}>
                    {passNumber ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <X className="w-3.5 h-3.5 text-slate-300" />}
                    At least 1 number (0-9)
                  </span>
                </div>
              </div>
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
