"use client";

import React, { useState, useEffect, useRef } from 'react';
import { getCities, requestOtp, verifyOtp, placeInstantOrder } from '../../lib/api';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const DEFAULT_CITIES = ['Lahore', 'Karachi', 'Islamabad', 'Rawalpindi', 'Faisalabad', 'Multan', 'Peshawar', 'Quetta', 'Gujranwala', 'Sialkot'];

export default function InstantOrderPage() {
  const router = useRouter();
  const otpInputRef = useRef(null);
  const fileInputRef = useRef(null);

  // Form states
  const [customer, setCustomer] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: 'Lahore'
  });

  const [branchDescription, setBranchDescription] = useState('');
  const [prescriptionFile, setPrescriptionFile] = useState(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);

  // OTP states
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpSending, setOtpSending] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [otpFeedback, setOtpFeedback] = useState({ type: '', msg: '' });
  const [resendTimer, setResendTimer] = useState(0);

  // Submission states
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [citiesList, setCitiesList] = useState(DEFAULT_CITIES);

  // Resend timer countdown
  useEffect(() => {
    let timer;
    if (resendTimer > 0) {
      timer = setInterval(() => {
        setResendTimer(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendTimer]);

  // Fetch active cities on mount
  useEffect(() => {
    async function loadCities() {
      try {
        const res = await getCities();
        if (res && res.data && res.data.cities) {
          setCitiesList(res.data.cities.map(c => c.name));
        }
      } catch (err) {
        console.error("Failed to load cities:", err);
      }
    }
    loadCities();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCustomer(prev => ({ ...prev, [name]: value }));
  };

  // Strict File Validation (PDF and Images ONLY — ZIP folders explicitly blocked)
  const validateAndSetFile = (file) => {
    if (!file) {
      setPrescriptionFile(null);
      setFilePreviewUrl(null);
      return;
    }

    const fileName = file.name.toLowerCase();
    const fileType = file.type.toLowerCase();

    // 1. Explicitly Block ZIP folders and archives
    const forbiddenExts = ['.zip', '.rar', '.7z', '.tar', '.gz', '.bz2', '.iso'];
    const isForbiddenExt = forbiddenExts.some(ext => fileName.endsWith(ext));
    const isForbiddenType = fileType.includes('zip') || fileType.includes('compressed') || fileType.includes('archive') || fileType.includes('x-zip');

    if (isForbiddenExt || isForbiddenType) {
      if (fileInputRef.current) fileInputRef.current.value = '';
      setPrescriptionFile(null);
      setFilePreviewUrl(null);
      setErrorMsg("⚠️ Upload Error: ZIP folders and compressed archive files are strictly NOT allowed. Please upload only PDF documents or Image files (JPG, PNG, WEBP).");
      return;
    }

    // 2. Allow PDF and Images ONLY
    const allowedExts = ['.pdf', '.jpg', '.jpeg', '.png', '.webp'];
    const isAllowedExt = allowedExts.some(ext => fileName.endsWith(ext));
    const isAllowedType = fileType.startsWith('image/') || fileType === 'application/pdf';

    if (!isAllowedExt || !isAllowedType) {
      if (fileInputRef.current) fileInputRef.current.value = '';
      setPrescriptionFile(null);
      setFilePreviewUrl(null);
      setErrorMsg("⚠️ Upload Error: Invalid file format. Only PDF documents and Image files (JPG, PNG, WEBP) are allowed.");
      return;
    }

    // 3. Max Size check (15MB)
    if (file.size > 15 * 1024 * 1024) {
      if (fileInputRef.current) fileInputRef.current.value = '';
      setPrescriptionFile(null);
      setFilePreviewUrl(null);
      setErrorMsg("⚠️ Upload Error: File size exceeds the maximum limit of 15MB.");
      return;
    }

    setErrorMsg('');
    setPrescriptionFile(file);

    // Create thumbnail preview if image
    if (fileType.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setFilePreviewUrl(url);
    } else {
      setFilePreviewUrl(null);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    validateAndSetFile(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    validateAndSetFile(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const removeFile = () => {
    if (fileInputRef.current) fileInputRef.current.value = '';
    setPrescriptionFile(null);
    setFilePreviewUrl(null);
  };

  const handleSendOtp = async (overrideSuggestion = false, emailToUse = null) => {
    const isOverride = overrideSuggestion === true;
    const targetEmail = (typeof emailToUse === 'string' ? emailToUse : customer.email || '').trim();
    if (!targetEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(targetEmail)) {
      setErrorMsg("Please enter a valid email address first.");
      setOtpFeedback({ type: 'error', msg: 'Please enter a valid email address.' });
      return;
    }

    setErrorMsg('');
    setOtpFeedback({ type: '', msg: '' });
    setOtpSending(true);

    try {
      const res = await requestOtp(targetEmail, isOverride);
      if (res && res.needsConfirmation) {
        setOtpSent(false);
        setOtpFeedback({
          type: 'suggestion',
          msg: res.message || `Did you mean ${res.suggestion}?`,
          suggestion: res.suggestion,
        });
        return;
      }

      setOtpSent(true);
      setOtpFeedback({ 
        type: 'success', 
        msg: `OTP verification code sent to ${targetEmail}. Please check your inbox.` 
      });
      setResendTimer(60);
      setTimeout(() => {
        if (otpInputRef.current) otpInputRef.current.focus();
      }, 200);
    } catch (err) {
      console.warn("OTP Send error:", err.message);
      setOtpSent(false);
      setOtpFeedback({ 
        type: 'error', 
        msg: err.message || `Failed to send verification code. Please check your email address.` 
      });
    } finally {
      setOtpSending(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otpCode.trim().length !== 6) {
      setOtpFeedback({ type: 'error', msg: "OTP must be exactly 6 digits." });
      return;
    }

    setErrorMsg('');
    setOtpFeedback({ type: '', msg: '' });
    setOtpVerifying(true);

    try {
      await verifyOtp(customer.email, otpCode.trim());
      setOtpVerified(true);
      setOtpFeedback({ type: 'success', msg: "✓ Email verified successfully! Ready to place instant order." });
    } catch (err) {
      setOtpFeedback({ type: 'error', msg: err.message || "Invalid OTP code. Please check and try again." });
    } finally {
      setOtpVerifying(false);
    }
  };

  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    if (!customer.name || !customer.email || !customer.phone || !customer.address || !customer.city) {
      setErrorMsg("Please fill out all required shipping fields.");
      return;
    }
    if (!otpVerified) {
      setErrorMsg("Please request and verify the OTP code first.");
      return;
    }
    if (!prescriptionFile) {
      setErrorMsg("Prescription document or image upload is required for Instant Order.");
      return;
    }

    setErrorMsg('');
    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('customer', JSON.stringify(customer));
      formData.append('paymentMethod', 'cod');
      formData.append('otp', JSON.stringify({
        email: customer.email,
        code: otpCode
      }));
      formData.append('branchDescription', branchDescription);
      formData.append('prescription', prescriptionFile);

      const res = await placeInstantOrder(formData);
      if (res && res.status !== 'fail') {
        const orderId = res._id || res.data?.order?._id;
        router.push(`/order-confirmation/${orderId}`);
      } else {
        throw new Error(res.message || "Failed to place instant order.");
      }
    } catch (err) {
      setErrorMsg(err.message || "An error occurred while submitting your prescription order.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 flex flex-col gap-6">
      {/* Page Header */}
      <div className="flex flex-col gap-2 border-b border-teal-500/20 pb-5">
        <div className="flex items-center gap-3">
          <span className="p-3 bg-emerald-500/20 text-emerald-400 rounded-2xl text-2xl border border-emerald-500/30">
            📄
          </span>
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Instant Prescription Order</h1>
            <p className="text-sm text-slate-500 mt-1">
              Upload your prescription (Image or PDF only). Our licensed pharmacists will price and dispatch your items.
            </p>
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-5 py-4 rounded-2xl text-sm font-medium flex items-center gap-3 shadow-xs animate-fadeIn">
          <span className="text-lg">⚠️</span>
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Order Form */}
      <form 
        onSubmit={handleSubmitOrder} 
        className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-xl flex flex-col gap-7 relative overflow-hidden"
      >
        {/* Section 1: Prescription Upload Zone */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-yellow-400 text-slate-950 text-xs font-black flex items-center justify-center border border-yellow-500/40">1</span>
              Upload Prescription Document / Image
            </h2>
            <span className="text-xs text-amber-900 font-bold bg-amber-100 border border-amber-300 px-3 py-1 rounded-full">
              PDF or Images ONLY
            </span>
          </div>

          {/* Drag & Drop Zone */}
          {!prescriptionFile ? (
            <div 
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3 ${
                isDragOver 
                  ? 'border-yellow-500 bg-yellow-50 scale-[1.01]' 
                  : 'border-slate-300 bg-slate-50/70 hover:border-yellow-400 hover:bg-yellow-50/30'
              }`}
            >
              <div className="w-14 h-14 rounded-full bg-yellow-100 border border-yellow-300 flex items-center justify-center text-yellow-700 text-2xl mb-1 shadow-xs">
                📤
              </div>
              <div>
                <p className="text-slate-900 font-bold text-base">
                  Click to Upload or Drag & Drop Prescription
                </p>
                <p className="text-slate-500 text-xs mt-1">
                  Supported formats: <strong className="text-slate-800">PDF, JPG, PNG, WEBP</strong> (Max 15MB)
                </p>
              </div>
              <div className="mt-2 bg-red-50 border border-red-200 px-3.5 py-1.5 rounded-full text-[11px] text-red-700 font-bold">
                🚫 ZIP files and compressed archives are strictly blocked
              </div>
              
              <input
                ref={fileInputRef}
                type="file"
                id="prescription"
                accept=".pdf,.png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp,application/pdf"
                required
                onChange={handleFileChange}
                disabled={submitting}
                className="hidden"
              />
            </div>
          ) : (
            /* Selected File Preview Box */
            <div className="bg-slate-50 border-2 border-yellow-400/80 p-5 rounded-2xl flex items-center justify-between gap-4 shadow-sm">
              <div className="flex items-center gap-4 min-w-0">
                {filePreviewUrl ? (
                  <img 
                    src={filePreviewUrl} 
                    alt="Prescription preview" 
                    className="w-16 h-16 object-cover rounded-xl border border-slate-200 shadow-xs"
                  />
                ) : (
                  <div className="w-14 h-14 bg-yellow-100 border border-yellow-300 rounded-xl flex items-center justify-center text-yellow-700 text-2xl font-black">
                    📄
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-slate-900 font-black text-sm truncate">{prescriptionFile.name}</p>
                  <p className="text-slate-500 text-xs mt-0.5">
                    {(prescriptionFile.size / (1024 * 1024)).toFixed(2)} MB · {prescriptionFile.type.toUpperCase() || 'PDF Document'}
                  </p>
                  <span className="inline-block mt-1 bg-green-50 text-green-700 border border-green-200 text-[10px] px-2 py-0.5 rounded font-bold">
                    ✓ Format Accepted
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={removeFile}
                className="bg-red-50 hover:bg-red-100 text-red-700 text-xs px-3.5 py-2 rounded-xl border border-red-200 font-bold transition-all cursor-pointer whitespace-nowrap"
              >
                Remove File
              </button>
            </div>
          )}

          {/* Pharmacist Instructions Textarea */}
          <div className="flex flex-col gap-1.5 mt-2">
            <label htmlFor="branchDescription" className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Additional Instructions for Pharmacist (Optional)
            </label>
            <textarea
              id="branchDescription"
              rows={3}
              value={branchDescription}
              onChange={(e) => setBranchDescription(e.target.value)}
              disabled={submitting}
              placeholder="E.g., Specific brand requirements, number of boxes, dosages, or delivery timing..."
              className="border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 rounded-xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400/40 focus:border-yellow-500 transition-all"
            />
          </div>
        </div>

        {/* Section 2: Customer Shipping & OTP Details */}
        <div className="flex flex-col gap-4 border-t border-slate-200 pt-6">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-yellow-400 text-slate-950 text-xs font-black flex items-center justify-center border border-yellow-500/40">2</span>
              Contact & OTP Details
            </h2>
            {otpVerified && (
              <span className="bg-green-50 border border-green-200 text-green-700 text-xs px-3 py-1 rounded-full font-bold">
                ✓ Email Verified
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="name" className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={customer.name}
                onChange={handleInputChange}
                required
                disabled={otpVerified || submitting}
                placeholder="e.g. Ali Ahmed"
                className="border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400/40 focus:border-yellow-500 transition-all disabled:opacity-70"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="phone" className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Phone Number <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={customer.phone}
                onChange={handleInputChange}
                required
                disabled={otpVerified || submitting}
                placeholder="e.g. 03314170744"
                className="border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400/40 focus:border-yellow-500 transition-all disabled:opacity-70"
              />
            </div>

            {/* Email Address + Send OTP Button */}
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Email Address (for OTP Verification) <span className="text-red-500">*</span>
              </label>
              <div className="flex flex-col sm:flex-row gap-2.5">
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={customer.email}
                  onChange={handleInputChange}
                  required
                  disabled={otpVerified || submitting}
                  placeholder="customer@example.com"
                  className="flex-grow border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400/40 focus:border-yellow-500 transition-all disabled:opacity-70"
                />
                {!otpVerified && (
                  <button
                    type="button"
                    onClick={() => handleSendOtp()}
                    disabled={otpSending || !customer.email || resendTimer > 0}
                    className="bg-yellow-400 hover:bg-yellow-500 active:bg-yellow-600 text-slate-950 font-black text-xs px-5 py-3 rounded-xl transition-all shadow-xs border border-yellow-500/40 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer whitespace-nowrap flex items-center justify-center gap-2"
                  >
                    {otpSending ? 'Sending OTP...' : resendTimer > 0 ? `Resend (${resendTimer}s)` : otpSent ? 'Resend OTP' : 'Send OTP Code'}
                  </button>
                )}
              </div>

              {/* Pre-Check Typo Suggestion Banner */}
              {otpFeedback.type === 'suggestion' && (
                <div className="bg-amber-50 border border-amber-300 p-3.5 rounded-xl text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shadow-2xs mt-2">
                  <div className="flex items-center gap-2">
                    <span className="text-amber-700 text-sm">💡</span>
                    <span className="text-amber-950 font-bold">
                      Did you mean <span className="underline font-black text-slate-950">{otpFeedback.suggestion}</span>?
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setCustomer(prev => ({ ...prev, email: otpFeedback.suggestion }));
                        handleSendOtp(false, otpFeedback.suggestion);
                      }}
                      className="px-3 py-1.5 bg-yellow-400 hover:bg-yellow-500 text-slate-950 font-black rounded-lg transition-all shadow-2xs cursor-pointer text-xs"
                    >
                      Use {otpFeedback.suggestion}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSendOtp(true)}
                      className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 font-bold rounded-lg border border-slate-300 transition-all cursor-pointer text-xs"
                    >
                      Send anyway
                    </button>
                  </div>
                </div>
              )}

              {/* Pre-Check Error Banner (e.g. Unroutable domain without MX records) */}
              {otpFeedback.type === 'error' && !otpSent && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl text-xs font-semibold mt-2">
                  {otpFeedback.msg}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <label htmlFor="address" className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Delivery Address <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="address"
                name="address"
                value={customer.address}
                onChange={handleInputChange}
                required
                disabled={otpVerified || submitting}
                placeholder="e.g. House #12, Street 4, Sector F-7, Islamabad"
                className="border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400/40 focus:border-yellow-500 transition-all disabled:opacity-70"
              />
            </div>

            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <label htmlFor="city" className="text-xs font-bold uppercase tracking-wider text-slate-700">
                City <span className="text-red-500">*</span>
              </label>
              <select
                id="city"
                name="city"
                value={customer.city}
                onChange={handleInputChange}
                disabled={otpVerified || submitting}
                className="border border-slate-300 bg-white text-slate-900 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400/40 focus:border-yellow-500 transition-all cursor-pointer disabled:opacity-70"
              >
                {citiesList.map(c => (
                  <option key={c} value={c} className="bg-white text-slate-900">{c}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* OTP Input Block */}
        {otpSent && !otpVerified && (
          <div className="bg-yellow-50/50 p-5 md:p-6 rounded-2xl border-2 border-yellow-400/60 shadow-md flex flex-col gap-4 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-yellow-200 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">📩</span>
                <div>
                  <h3 className="text-sm font-black text-slate-900">Enter OTP Verification Code</h3>
                  <p className="text-xs text-slate-600">Code sent to <span className="text-slate-950 font-bold">{customer.email}</span></p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => { setOtpSent(false); setOtpFeedback({ type: '', msg: '' }); }}
                className="text-xs text-yellow-700 hover:text-yellow-800 underline font-bold cursor-pointer"
              >
                Change Email
              </button>
            </div>

            {otpFeedback.msg && (
              <div className={`p-3 rounded-xl text-xs font-medium ${
                otpFeedback.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' :
                otpFeedback.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' :
                'bg-yellow-100 text-yellow-900 border border-yellow-300'
              }`}>
                {otpFeedback.msg}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 items-stretch">
              <div className="relative flex-grow">
                <input
                  ref={otpInputRef}
                  type="text"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="Enter 6-digit OTP"
                  className="w-full border-2 border-yellow-400/80 bg-white text-slate-950 placeholder:text-slate-400 rounded-xl px-4 py-3 text-center text-lg font-mono font-bold tracking-[0.4em] focus:outline-none focus:border-yellow-500 focus:ring-4 focus:ring-yellow-400/20 transition-all"
                />
              </div>

              <button
                type="button"
                onClick={handleVerifyOtp}
                disabled={otpVerifying || otpCode.length !== 6}
                className="bg-yellow-400 hover:bg-yellow-500 active:bg-yellow-600 text-slate-950 font-black text-sm px-6 py-3 rounded-xl transition-all shadow-sm border border-yellow-500/50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2 whitespace-nowrap"
              >
                {otpVerifying ? 'Verifying...' : 'Verify OTP'}
              </button>
            </div>
          </div>
        )}

        {/* OTP Verified Success Banner */}
        {otpVerified && (
          <div className="bg-green-50 border border-green-200 p-4 rounded-2xl flex items-center justify-between gap-3 text-green-800 text-xs font-semibold shadow-xs">
            <div className="flex items-center gap-2.5">
              <span className="w-6 h-6 rounded-full bg-green-600 text-white flex items-center justify-center font-black text-sm">✓</span>
              <div>
                <p className="font-extrabold text-sm text-green-900">Email Address Verified</p>
                <p className="text-green-700 text-[11px] mt-0.5">OTP verified for {customer.email}</p>
              </div>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={!otpVerified || submitting || !prescriptionFile}
          className={`w-full py-4 rounded-2xl font-black text-sm uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer border ${
            !otpVerified || !prescriptionFile
              ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
              : submitting
              ? 'bg-yellow-500 text-slate-950 opacity-90 border-yellow-500'
              : 'bg-yellow-400 hover:bg-yellow-500 active:bg-yellow-600 text-slate-950 border border-yellow-500/50 shadow-yellow-400/20 active:scale-[0.98]'
          }`}
        >
          {submitting ? (
            <>
              <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
              Submitting Prescription Order...
            </>
          ) : !prescriptionFile ? (
            'Upload Prescription File (PDF/Image) to Proceed'
          ) : !otpVerified ? (
            'Verify OTP Email to Place Order'
          ) : (
            'Submit Instant Prescription Order'
          )}
        </button>
      </form>
    </div>
  );
}
