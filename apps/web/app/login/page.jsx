"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCustomer } from "../../components/CustomerProvider";
import AuthCard3D from "../../components/3d/AuthCard3D";
import Auth3DScene from "../../components/3d/Auth3DScene";
import PasswordInput from "../../components/PasswordInput";
import { Mail, Lock, ArrowRight, AlertCircle, ShieldCheck, Heart, Sparkles } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/";

  const { login } = useCustomer();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(email, password);
      router.push(redirect);
    } catch (err) {
      if (err.code === "EMAIL_NOT_VERIFIED") {
        router.push(`/verify-email?email=${encodeURIComponent(email)}&unverified=true`);
      } else {
        setError(err.message || "Invalid email or password");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-140px)] flex items-center justify-center px-4 py-8 overflow-hidden">
      {/* Interactive 3D WebGL Background Scene */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <Auth3DScene className="w-full h-full opacity-75" interactive={true} />
        {/* Soft radial atmospheric backdrop lights */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-amber-200/30 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-emerald-200/25 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* 3D Perspective Card Container */}
      <div className="relative z-10 w-full max-w-md">
        {/* Quick 3D Pill Switcher Tabs */}
        <div className="flex items-center justify-center gap-1.5 p-1 bg-white/80 backdrop-blur-md rounded-2xl border border-amber-100 shadow-sm max-w-[280px] mx-auto mb-4">
          <button
            type="button"
            className="flex-1 py-1.5 text-xs font-bold rounded-xl bg-gradient-to-r from-amber-400 to-[#FFCB05] text-slate-950 shadow-xs transition-all"
          >
            Sign In
          </button>
          <Link
            href={`/signup?redirect=${encodeURIComponent(redirect)}`}
            className="flex-1 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 text-center rounded-xl hover:bg-amber-50/60 transition-all"
          >
            Sign Up
          </Link>
        </div>

        <AuthCard3D
          badgeIcon="🔐"
          badgeTitle="Welcome Back"
          badgeSubtitle="Sign in to access your Wishlist, prescriptions, and orders"
          floatTags={[
            { text: "💊 100% Genuine Meds", position: "top-left", delay: "0s" },
            { text: "🔒 256-Bit SSL Encrypted", position: "top-right", delay: "1.2s" },
            { text: "❤️ Persistent Wishlist", position: "bottom-right", delay: "0.6s" },
          ]}
        >
          {error && (
            <div className="mb-5 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-xs text-rose-800 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
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

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-[11px] font-bold text-amber-700 hover:text-amber-800 transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <PasswordInput
                id="login-password"
                name="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                disabled={loading}
                leadingIcon={<Lock className="w-4 h-4" />}
                autoComplete="current-password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="relative w-full btn-amber-gradient py-3 rounded-xl font-bold text-xs shadow-lg shadow-amber-300/40 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 transition-all active:scale-[0.98] mt-2 group overflow-hidden"
            >
              {/* Dynamic glossy shimmer sweep */}
              <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none" />
              <span>{loading ? "Signing in..." : "Sign In to Account"}</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-600">
              Don't have an account?{" "}
              <Link
                href={`/signup?redirect=${encodeURIComponent(redirect)}`}
                className="font-bold text-amber-700 hover:text-amber-800 hover:underline inline-flex items-center gap-0.5"
              >
                <span>Create Account</span>
                <Sparkles className="w-3 h-3 text-amber-500" />
              </Link>
            </p>
          </div>

          {/* Benefits strip */}
          <div className="mt-5 pt-3 border-t border-slate-50 flex items-center justify-around text-[10px] text-slate-400">
            <span className="flex items-center gap-1">
              <Heart className="w-3 h-3 text-rose-500" /> Saved Wishlist
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-600" /> 256-Bit Protection
            </span>
          </div>
        </AuthCard3D>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-[60vh] flex items-center justify-center text-xs text-slate-400">Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
