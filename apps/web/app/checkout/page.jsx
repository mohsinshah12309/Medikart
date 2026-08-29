"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useCart } from '../../components/CartProvider';
import { getDeliveryCharge, requestOtp, verifyOtp, placeStandardOrder, getCities, placeNarcoticsOrder, initiatePayment } from '../../lib/api';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const CITIES = [
  'Lahore',
  'Karachi',
  'Islamabad',
  'Rawalpindi',
  'Faisalabad',
  'Multan',
  'Peshawar',
  'Quetta',
  'Gujranwala',
  'Sialkot'
];

export default function CheckoutPage() {
  const { cart, cartTotal, clearCart, isLoaded } = useCart();
  const router = useRouter();
  const otpInputRef = useRef(null);

  const hasNarcotics = cart.some(item => item.isNarcotic);

  // Customer form states
  const [customer, setCustomer] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: 'Lahore'
  });

  const [deliveryCharge, setDeliveryCharge] = useState(200); // default delivery charge
  const [loadingCharge, setLoadingCharge] = useState(false);

  // OTP states
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpSending, setOtpSending] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [otpFeedback, setOtpFeedback] = useState({ type: '', msg: '' });
  const [resendTimer, setResendTimer] = useState(0);

  // Order submission states
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [citiesList, setCitiesList] = useState(CITIES);
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [prescriptionFile, setPrescriptionFile] = useState(null);

  // Force COD if cart contains narcotics
  useEffect(() => {
    if (hasNarcotics) {
      setPaymentMethod('cod');
    }
  }, [hasNarcotics]);

  // Resend timer effect
  useEffect(() => {
    let timer;
    if (resendTimer > 0) {
      timer = setInterval(() => {
        setResendTimer(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendTimer]);

  // Load active cities
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

  // Sync selected city
  useEffect(() => {
    if (citiesList.length > 0 && !citiesList.includes(customer.city)) {
      setCustomer(prev => ({ ...prev, city: citiesList[0] }));
    }
  }, [citiesList, customer.city]);

  // Fetch delivery charge whenever city changes
  useEffect(() => {
    if (!customer.city) return;
    
    async function updateDelivery() {
      setLoadingCharge(true);
      try {
        const res = await getDeliveryCharge(customer.city);
        if (res && res.data && typeof res.data.deliveryCharge === 'number') {
          setDeliveryCharge(res.data.deliveryCharge);
        } else if (res && typeof res.deliveryCharge === 'number') {
          setDeliveryCharge(res.deliveryCharge);
        } else {
          setDeliveryCharge(200);
        }
      } catch (err) {
        console.error("Failed to load delivery charge:", err);
        setDeliveryCharge(200);
      } finally {
        setLoadingCharge(false);
      }
    }
    
    updateDelivery();
  }, [customer.city]);

  // Redirect if cart is empty
  useEffect(() => {
    if (isLoaded && cart.length === 0) {
      router.push('/');
    }
  }, [cart, isLoaded, router]);

  if (!isLoaded || cart.length === 0) {
    return (
      <div className="max-w-4xl mx-auto py-20 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-400 mb-4"></div>
        <p className="text-slate-400 font-medium">Loading checkout details...</p>
      </div>
    );
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCustomer(prev => ({ ...prev, [name]: value }));
  };

  const handleSendOtp = async () => {
    if (!customer.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email)) {
      setErrorMsg("Please enter a valid email address first.");
      setOtpFeedback({ type: 'error', msg: 'Please enter a valid email address.' });
      return;
    }
    
    setErrorMsg('');
    setOtpFeedback({ type: '', msg: '' });
    setOtpSending(true);
    
    // Always set otpSent to true so the OTP input box is GUARANTEED to appear for the user
    setOtpSent(true);

    try {
      await requestOtp(customer.email);
      setOtpFeedback({ 
        type: 'success', 
        msg: `OTP verification code sent to ${customer.email}. Please check your inbox.` 
      });
      setResendTimer(60);
      setTimeout(() => {
        if (otpInputRef.current) otpInputRef.current.focus();
      }, 200);
    } catch (err) {
      console.warn("OTP Send notice:", err.message);
      setOtpFeedback({ 
        type: 'info', 
        msg: err.message || `OTP section unlocked. Check your email for code.` 
      });
      setResendTimer(30);
      setTimeout(() => {
        if (otpInputRef.current) otpInputRef.current.focus();
      }, 200);
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
      setOtpFeedback({ type: 'success', msg: "✓ Email verified successfully! You can now complete your order." });
    } catch (err) {
      setOtpFeedback({ type: 'error', msg: err.message || "Invalid OTP code. Please check and try again." });
    } finally {
      setOtpVerifying(false);
    }
  };

  const handlePrescriptionChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) {
      setPrescriptionFile(null);
      return;
    }

    const fileName = file.name.toLowerCase();
    const fileType = file.type.toLowerCase();

    // Explicitly block ZIP and compressed folders
    const forbiddenExts = ['.zip', '.rar', '.7z', '.tar', '.gz', '.bz2', '.iso'];
    const isForbiddenExt = forbiddenExts.some(ext => fileName.endsWith(ext));
    const isForbiddenType = fileType.includes('zip') || fileType.includes('compressed') || fileType.includes('archive');

    if (isForbiddenExt || isForbiddenType) {
      e.target.value = '';
      setPrescriptionFile(null);
      setErrorMsg("⚠️ Upload Error: ZIP folders and compressed archive files are strictly NOT allowed. Please upload a PDF or an Image (JPG, PNG, WEBP).");
      return;
    }

    const allowedExts = ['.pdf', '.jpg', '.jpeg', '.png', '.webp'];
    const isAllowedExt = allowedExts.some(ext => fileName.endsWith(ext));
    const isAllowedType = fileType.startsWith('image/') || fileType === 'application/pdf';

    if (!isAllowedExt || !isAllowedType) {
      e.target.value = '';
      setPrescriptionFile(null);
      setErrorMsg("⚠️ Upload Error: Invalid file format. Only PDF documents and Image files (JPG, PNG, WEBP) are allowed.");
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      e.target.value = '';
      setPrescriptionFile(null);
      setErrorMsg("⚠️ Upload Error: File size exceeds the maximum limit of 15MB.");
      return;
    }

    setErrorMsg('');
    setPrescriptionFile(file);
  };

  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    if (!customer.name || !customer.email || !customer.phone || !customer.address || !customer.city) {
      setErrorMsg("Please fill out all required shipping fields.");
      return;
    }
    if (!otpVerified) {
      setErrorMsg("Please verify your email address using the 6-digit OTP code before proceeding.");
      return;
    }
    if (hasNarcotics && !prescriptionFile) {
      setErrorMsg("Prescription upload (PDF or Image) is required for controlled medicine items.");
      return;
    }

    setErrorMsg('');
    setSubmitting(true);

    try {
      let orderId;
      if (hasNarcotics) {
        const formData = new FormData();
        formData.append('customer', JSON.stringify(customer));
        formData.append('items', JSON.stringify(cart.map(item => ({
          productId: item.productId,
          quantity: item.quantity
        }))));
        formData.append('paymentMethod', 'cod');
        formData.append('otp', JSON.stringify({
          email: customer.email,
          code: otpCode
        }));
        formData.append('prescription', prescriptionFile);

        const res = await placeNarcoticsOrder(formData);
        if (res && res.status !== 'fail') {
          orderId = res._id || res.data?.order?._id;
        } else {
          throw new Error(res.message || "Failed to place order.");
        }
      } else {
        const payload = {
          customer,
          items: cart.map(item => ({
            productId: item.productId,
            quantity: item.quantity
          })),
          paymentMethod,
          otp: {
            email: customer.email,
            code: otpCode
          }
        };

        const res = await placeStandardOrder(payload);
        if (res && res.status !== 'fail') {
          orderId = res._id || res.data?.order?._id;
        } else {
          throw new Error(res.message || "Failed to place order.");
        }
      }

      if (orderId) {
        clearCart();
        
        if (paymentMethod === 'card' && !hasNarcotics) {
          try {
            const payRes = await initiatePayment(orderId);
            if (payRes && payRes.redirectUrl) {
              window.location.href = payRes.redirectUrl;
              return;
            }
          } catch (payErr) {
            console.error("Payment initiation failed:", payErr);
            router.push(`/order-confirmation/${orderId}?paymentFailed=true`);
            return;
          }
        }
        
        router.push(`/order-confirmation/${orderId}`);
      }
    } catch (err) {
      setErrorMsg(err.message || "An error occurred while submitting your order.");
    } finally {
      setSubmitting(false);
    }
  };

  const totalAmount = cartTotal + deliveryCharge;

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 flex flex-col gap-6">
      {/* Header & Flow Indicator */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-teal-500/20 pb-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-100 tracking-tight">Checkout</h1>
          <p className="text-sm text-slate-400 mt-1">Complete your shipping and OTP verification to place your order</p>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center gap-2 bg-[#072126] border border-teal-500/30 px-4 py-2 rounded-2xl text-xs">
          <span className={`px-2.5 py-1 rounded-full font-bold ${otpVerified ? 'bg-emerald-500 text-slate-950' : 'bg-teal-700 text-white'}`}>
            1. Details
          </span>
          <span className="text-slate-600">→</span>
          <span className={`px-2.5 py-1 rounded-full font-bold ${otpVerified ? 'bg-emerald-500 text-slate-950' : otpSent ? 'bg-amber-500 text-slate-950 animate-pulse' : 'bg-slate-800 text-slate-400'}`}>
            2. OTP Verify
          </span>
          <span className="text-slate-600">→</span>
          <span className={`px-2.5 py-1 rounded-full font-bold ${otpVerified ? 'bg-teal-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
            3. Order Place
          </span>
        </div>
      </div>

      {errorMsg && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-300 px-5 py-4 rounded-2xl text-sm font-medium flex items-center gap-3 shadow-lg">
          <span className="text-lg">⚠️</span>
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Main Checkout Form Container */}
        <form 
          onSubmit={handleSubmitOrder} 
          className="lg:col-span-7 bg-[#072126]/90 p-6 md:p-8 rounded-3xl border border-teal-500/25 shadow-2xl backdrop-blur-xl flex flex-col gap-7 relative overflow-hidden"
        >
          {/* Subtle glowing ambient accent */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Section 1: Customer & Shipping Details */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-teal-500/20 pb-3">
              <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                <span className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-black flex items-center justify-center border border-emerald-500/30">1</span>
                Shipping & OTP Details
              </h2>
              {otpVerified && (
                <span className="bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs px-3 py-1 rounded-full font-bold flex items-center gap-1.5">
                  ✓ Verified
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="name" className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Full Name <span className="text-emerald-400">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={customer.name}
                  onChange={handleInputChange}
                  required
                  disabled={otpVerified || submitting}
                  placeholder="Muhammad Mohsin Ali"
                  className="border border-teal-500/30 bg-[#041517] text-slate-100 placeholder:text-slate-500 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-400 transition-all disabled:opacity-70"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="phone" className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Phone Number <span className="text-emerald-400">*</span>
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={customer.phone}
                  onChange={handleInputChange}
                  required
                  disabled={otpVerified || submitting}
                  placeholder="03074043799"
                  className="border border-teal-500/30 bg-[#041517] text-slate-100 placeholder:text-slate-500 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-400 transition-all disabled:opacity-70"
                />
              </div>

              {/* Email Address with Send/Resend OTP Button */}
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    Email Address (for OTP Verification) <span className="text-emerald-400">*</span>
                  </label>
                  {otpSent && !otpVerified && (
                    <span className="text-[11px] text-amber-400 font-semibold flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" /> OTP Sent
                    </span>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row gap-2.5">
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={customer.email}
                    onChange={handleInputChange}
                    required
                    disabled={otpVerified || submitting}
                    placeholder="alishahmohsin938@gmail.com"
                    className="flex-grow border border-teal-500/30 bg-[#041517] text-slate-100 placeholder:text-slate-500 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-400 transition-all disabled:opacity-70"
                  />
                  {!otpVerified && (
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      disabled={otpSending || !customer.email || resendTimer > 0}
                      className="bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-slate-950 font-black text-xs px-5 py-3 rounded-xl transition-all shadow-md hover:shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer whitespace-nowrap flex items-center justify-center gap-2"
                    >
                      {otpSending ? (
                        <>
                          <span className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                          Sending OTP...
                        </>
                      ) : resendTimer > 0 ? (
                        `Resend OTP (${resendTimer}s)`
                      ) : otpSent ? (
                        'Resend OTP'
                      ) : (
                        'Send OTP Code'
                      )}
                    </button>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <label htmlFor="address" className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Delivery Address <span className="text-emerald-400">*</span>
                </label>
                <input
                  type="text"
                  id="address"
                  name="address"
                  value={customer.address}
                  onChange={handleInputChange}
                  required
                  disabled={otpVerified || submitting}
                  placeholder="Tech Town, satiana road, Block-H, House#41"
                  className="border border-teal-500/30 bg-[#041517] text-slate-100 placeholder:text-slate-500 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-400 transition-all disabled:opacity-70"
                />
              </div>

              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <label htmlFor="city" className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  City <span className="text-emerald-400">*</span>
                </label>
                <select
                  id="city"
                  name="city"
                  value={customer.city}
                  onChange={handleInputChange}
                  disabled={otpVerified || submitting}
                  className="border border-teal-500/30 bg-[#041517] text-slate-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-400 transition-all cursor-pointer disabled:opacity-70"
                >
                  {citiesList.map(c => (
                    <option key={c} value={c} className="bg-[#072126] text-slate-100">{c}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: OTP Verification Block (Visible when OTP sent or when requested) */}
          {otpSent && !otpVerified && (
            <div className="bg-[#041517] p-5 md:p-6 rounded-2xl border-2 border-emerald-500/40 shadow-xl flex flex-col gap-4 animate-fadeIn">
              <div className="flex items-center justify-between border-b border-teal-500/20 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl">📩</span>
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-100">Enter OTP Verification Code</h3>
                    <p className="text-xs text-slate-400">Code sent to <span className="text-emerald-400 font-semibold">{customer.email}</span></p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => { setOtpSent(false); setOtpFeedback({ type: '', msg: '' }); }}
                  className="text-xs text-teal-400 hover:text-teal-300 underline font-medium cursor-pointer"
                >
                  Change Email
                </button>
              </div>

              {otpFeedback.msg && (
                <div className={`p-3 rounded-xl text-xs font-medium ${
                  otpFeedback.type === 'error' ? 'bg-red-500/15 text-red-300 border border-red-500/30' :
                  otpFeedback.type === 'success' ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30' :
                  'bg-teal-500/15 text-teal-300 border border-teal-500/30'
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
                    className="w-full border-2 border-emerald-500/40 bg-[#072126] text-emerald-400 placeholder:text-slate-600 rounded-xl px-4 py-3 text-center text-lg font-mono font-bold tracking-[0.4em] focus:outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/20 transition-all"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono text-slate-500">
                    {otpCode.length}/6
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleVerifyOtp}
                  disabled={otpVerifying || otpCode.length !== 6}
                  className="bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-slate-950 font-black text-sm px-6 py-3 rounded-xl transition-all shadow-lg hover:shadow-emerald-500/20 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2 whitespace-nowrap"
                >
                  {otpVerifying ? (
                    <>
                      <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    'Verify OTP'
                  )}
                </button>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                <span>Didn't receive the code? Check spam or resend.</span>
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={resendTimer > 0 || otpSending}
                  className="text-emerald-400 hover:text-emerald-300 font-bold underline disabled:opacity-50 disabled:no-underline cursor-pointer"
                >
                  {resendTimer > 0 ? `Resend code in ${resendTimer}s` : 'Resend Code'}
                </button>
              </div>
            </div>
          )}

          {/* OTP Verified Success Banner */}
          {otpVerified && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 p-4 rounded-2xl flex items-center justify-between gap-3 text-emerald-300 text-xs font-semibold shadow-inner">
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center font-black text-sm">✓</span>
                <div>
                  <p className="font-extrabold text-sm text-emerald-400">Email Address Verified</p>
                  <p className="text-slate-300 text-[11px] mt-0.5">OTP code verified for {customer.email}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => { setOtpVerified(false); setOtpSent(false); setOtpCode(''); }}
                className="text-xs text-slate-400 hover:text-slate-200 underline font-medium cursor-pointer"
              >
                Reset
              </button>
            </div>
          )}

          {/* Section 3: Narcotics Prescription Upload if applicable */}
          {hasNarcotics && (
            <div className="flex flex-col gap-3 border-t border-teal-500/20 pt-5">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <span>📋</span> Controlled Medicine Prescription (Required)
              </h3>
              <input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp,application/pdf"
                required
                onChange={handlePrescriptionChange}
                disabled={submitting}
                className="border border-teal-500/30 bg-[#041517] text-slate-100 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-emerald-400 w-full"
              />
              <span className="text-[11px] text-amber-400 italic">
                Notice: Your cart includes controlled items. Only PDF documents or Images (JPG, PNG, WEBP) are allowed. ZIP archives are blocked.
              </span>
            </div>
          )}

          {/* Section 4: Payment Method Selection */}
          <div className="flex flex-col gap-3 border-t border-teal-500/20 pt-5">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300">Payment Method</h2>
            
            <div className="grid grid-cols-1 gap-3">
              <label className={`flex items-start gap-3.5 p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                paymentMethod === 'cod' 
                  ? 'bg-[#041517] border-emerald-500/70 shadow-lg shadow-emerald-500/5' 
                  : 'bg-[#041517]/50 border-teal-500/20 hover:border-teal-500/40'
              }`}>
                <input
                  type="radio"
                  name="paymentMethod"
                  value="cod"
                  checked={paymentMethod === 'cod'}
                  onChange={() => setPaymentMethod('cod')}
                  disabled={submitting}
                  className="mt-1 accent-emerald-500 w-4 h-4 cursor-pointer"
                />
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-extrabold text-slate-100 flex items-center gap-2">
                    Cash on Delivery (COD)
                    <span className="bg-emerald-500/20 text-emerald-400 text-[10px] px-2 py-0.5 rounded-full font-bold">Popular</span>
                  </span>
                  <span className="text-xs text-slate-400">Pay in cash when your order is delivered to your doorstep.</span>
                </div>
              </label>

              {!hasNarcotics && (
                <label className={`flex items-start gap-3.5 p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                  paymentMethod === 'card' 
                    ? 'bg-[#041517] border-emerald-500/70 shadow-lg shadow-emerald-500/5' 
                    : 'bg-[#041517]/50 border-teal-500/20 hover:border-teal-500/40'
                }`}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="card"
                    checked={paymentMethod === 'card'}
                    onChange={() => setPaymentMethod('card')}
                    disabled={submitting}
                    className="mt-1 accent-emerald-500 w-4 h-4 cursor-pointer"
                  />
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-extrabold text-slate-100 flex items-center gap-2">
                      Card / Online Payment (Kuickpay)
                      <span className="bg-teal-500/20 text-teal-300 text-[10px] px-2 py-0.5 rounded-full font-bold">Instant</span>
                    </span>
                    <span className="text-xs text-slate-400">Pay securely online using Habib Metro hosted checkout.</span>
                  </div>
                </label>
              )}
            </div>
          </div>

          {/* Submit Order Button */}
          <button
            type="submit"
            disabled={!otpVerified || submitting}
            className={`w-full py-4 rounded-2xl font-black text-sm uppercase tracking-wider transition-all shadow-xl flex items-center justify-center gap-2 cursor-pointer ${
              !otpVerified
                ? 'bg-slate-800/80 text-slate-500 border border-slate-700/50 cursor-not-allowed'
                : submitting
                ? 'bg-emerald-600 text-slate-950 opacity-90'
                : 'bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-slate-950 shadow-emerald-500/20'
            }`}
          >
            {submitting ? (
              <>
                <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                Processing Order...
              </>
            ) : !otpVerified ? (
              'Verify OTP Email to Place Order'
            ) : paymentMethod === 'card' ? (
              'Pay Online & Complete Order'
            ) : (
              'Place Order Now'
            )}
          </button>
        </form>

        {/* Sidebar Summary Panel */}
        <div className="lg:col-span-5 flex flex-col gap-6 sticky top-6">
          <div className="bg-[#072126]/90 p-6 md:p-7 rounded-3xl border border-teal-500/25 shadow-2xl backdrop-blur-xl flex flex-col gap-5">
            <div className="flex items-center justify-between border-b border-teal-500/20 pb-3.5">
              <h2 className="font-black text-slate-100 text-base uppercase tracking-wider flex items-center gap-2">
                <span>🛒</span> Your Items
              </h2>
              <span className="bg-teal-500/20 text-teal-300 text-xs px-2.5 py-0.5 rounded-full font-bold">
                {cart.reduce((acc, item) => acc + item.quantity, 0)} Items
              </span>
            </div>
            
            <div className="flex flex-col gap-3.5 max-h-72 overflow-y-auto pr-1 custom-scrollbar">
              {cart.map((item) => (
                <div key={item.productId} className="flex justify-between items-start gap-3 text-sm border-b border-teal-500/10 pb-3">
                  <div className="min-w-0 flex-grow">
                    <p className="font-bold text-slate-200 text-sm truncate">{item.name}</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Qty: <span className="text-emerald-400 font-semibold">{item.quantity}</span> × PKR {item.price.toFixed(2)}
                    </p>
                  </div>
                  <span className="font-extrabold text-slate-100 text-sm flex-shrink-0">
                    PKR {(item.price * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            <div className="border-t border-teal-500/20 pt-4 flex flex-col gap-3 text-sm">
              <div className="flex justify-between text-slate-400">
                <span>Subtotal</span>
                <span className="font-bold text-slate-200">PKR {cartTotal.toFixed(2)}</span>
              </div>

              <div className="flex justify-between items-center text-slate-400">
                <span className="flex items-center gap-1.5">
                  Delivery Charge ({customer.city})
                </span>
                <span className="font-bold text-slate-200">
                  {loadingCharge ? (
                    <span className="text-xs text-teal-400 animate-pulse">Calculating...</span>
                  ) : (
                    `PKR ${deliveryCharge.toFixed(2)}`
                  )}
                </span>
              </div>

              <div className="border-t-2 border-dashed border-teal-500/30 pt-3.5 flex justify-between items-baseline">
                <div>
                  <span className="text-base font-black text-slate-100 uppercase tracking-wider block">Total Amount</span>
                  <span className="text-[11px] text-slate-400">(Inclusive of all taxes)</span>
                </div>
                <span className="text-2xl font-black text-emerald-400 tracking-tight">
                  PKR {totalAmount.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Trust badge */}
            <div className="bg-[#041517] p-3.5 rounded-2xl border border-teal-500/20 flex items-center gap-3 text-xs text-slate-400 mt-1">
              <span className="text-xl">🔒</span>
              <div>
                <p className="font-bold text-slate-200">100% Authentic Medicines</p>
                <p className="text-[11px] text-slate-400">Verified & dispatched directly by licensed Medikart pharmacy</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
