"use client";

import React, { useState, useEffect } from 'react';
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

  const hasNarcotics = cart.some(item => item.isNarcotic);

  // Form states
  const [customer, setCustomer] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: 'Lahore'
  });

  const [deliveryCharge, setDeliveryCharge] = useState(500); // default fallback charge
  const [loadingCharge, setLoadingCharge] = useState(false);

  // OTP states
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpSending, setOtpSending] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);

  // Order submission states
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [citiesList, setCitiesList] = useState(CITIES);
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [prescriptionFile, setPrescriptionFile] = useState(null);

  // Force COD if cart has narcotics
  useEffect(() => {
    if (hasNarcotics) {
      setPaymentMethod('cod');
    }
  }, [hasNarcotics]);

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

  // Sync selected city if not in citiesList
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
        if (res && res.data) {
          setDeliveryCharge(res.data.deliveryCharge);
        }
      } catch (err) {
        console.error("Failed to load delivery charge:", err);
        setDeliveryCharge(500); // default fallback
      } finally {
        setLoadingCharge(false);
      }
    }
    
    updateDelivery();
  }, [customer.city]);

  // If cart is empty, redirect to shop
  useEffect(() => {
    if (isLoaded && cart.length === 0) {
      router.push('/');
    }
  }, [cart, isLoaded, router]);

  if (!isLoaded || cart.length === 0) {
    return (
      <div className="max-w-4xl mx-auto py-12 text-center">
        <p className="text-slate-400">Redirecting/Loading...</p>
      </div>
    );
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCustomer(prev => ({ ...prev, [name]: value }));
  };

  const handleSendOtp = async () => {
    if (!customer.email) {
      setErrorMsg("Please enter a valid email address first.");
      return;
    }
    setErrorMsg('');
    setOtpSending(true);
    try {
      await requestOtp(customer.email);
      setOtpSent(true);
      alert(`OTP code sent to ${customer.email}. Please check your inbox (or mailtrap).`);
    } catch (err) {
      setErrorMsg(err.message || "Failed to send OTP. Rate limit might be active (max 3/15min).");
    } finally {
      setOtpSending(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otpCode.length !== 6) {
      setErrorMsg("OTP must be exactly 6 digits.");
      return;
    }
    setErrorMsg('');
    setOtpVerifying(true);
    try {
      await verifyOtp(customer.email, otpCode);
      setOtpVerified(true);
      alert("OTP pre-verified successfully!");
    } catch (err) {
      setErrorMsg(err.message || "Failed to verify OTP. Incorrect or expired code.");
    } finally {
      setOtpVerifying(false);
    }
  };

  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    if (!customer.name || !customer.email || !customer.phone || !customer.address || !customer.city) {
      setErrorMsg("Please fill out all shipping fields.");
      return;
    }
    if (!otpVerified) {
      setErrorMsg("Please request and verify the OTP code first.");
      return;
    }
    if (hasNarcotics && !prescriptionFile) {
      setErrorMsg("Prescription upload is required for narcotics items.");
      return;
    }

    setErrorMsg('');
    setSubmitting(true);

    try {
      let orderId;
      if (hasNarcotics) {
        // Multipart/form-data for narcotics order
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
        // Standard JSON payload
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
            setErrorMsg(`Order created successfully but payment failed to initiate: ${payErr.message}. Admin will contact you.`);
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
    <div className="max-w-4xl mx-auto flex flex-col gap-6">
      <h1 className="text-2xl font-extrabold text-slate-100 tracking-tight">Checkout</h1>

      {errorMsg && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-sm font-medium">
          ⚠️ {errorMsg}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
        {/* Checkout Form */}
        <form onSubmit={handleSubmitOrder} className="md:col-span-3 bg-[#0a232a]/45 p-6 rounded-3xl border border-teal-955/65 shadow-2xl backdrop-blur-md flex flex-col gap-6 relative overflow-hidden">
          <h2 className="text-lg font-bold text-slate-200 border-b border-teal-950/60 pb-3">Shipping & OTP Details</h2>

          {/* Shipping fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="name" className="text-xs font-semibold text-slate-400">Full Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={customer.name}
                onChange={handleInputChange}
                required
                disabled={otpVerified || submitting}
                placeholder="Mohsin Shah"
                className="border border-teal-955/80 bg-[#081d23] text-slate-100 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>
            
            <div className="flex flex-col gap-1.5">
              <label htmlFor="phone" className="text-xs font-semibold text-slate-400">Phone Number</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={customer.phone}
                onChange={handleInputChange}
                required
                disabled={otpVerified || submitting}
                placeholder="03001234567"
                className="border border-teal-955/80 bg-[#081d23] text-slate-100 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <label htmlFor="email" className="text-xs font-semibold text-slate-400">Email Address (for OTP Verification)</label>
              <div className="flex gap-2">
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={customer.email}
                  onChange={handleInputChange}
                  required
                  disabled={otpSent || submitting}
                  placeholder="mohsin@example.com"
                  className="flex-grow border border-teal-955/80 bg-[#081d23] text-slate-100 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-emerald-500"
                />
                {!otpSent && (
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={otpSending || !customer.email}
                    className="bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs px-4 rounded-xl transition-colors whitespace-nowrap disabled:opacity-50 cursor-pointer"
                  >
                    {otpSending ? 'Sending...' : 'Send OTP'}
                  </button>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <label htmlFor="address" className="text-xs font-semibold text-slate-400">Delivery Address</label>
              <input
                type="text"
                id="address"
                name="address"
                value={customer.address}
                onChange={handleInputChange}
                required
                disabled={otpVerified || submitting}
                placeholder="House 123, Street 4"
                className="border border-teal-955/80 bg-[#081d23] text-slate-100 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="city" className="text-xs font-semibold text-slate-400">City</label>
              <select
                id="city"
                name="city"
                value={customer.city}
                onChange={handleInputChange}
                disabled={otpVerified || submitting}
                className="border border-teal-955/80 bg-[#081d23] text-slate-100 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-emerald-500 bg-[#081d23]"
              >
                {citiesList.map(c => (
                  <option key={c} value={c} className="bg-[#0a232a]">{c}</option>
                ))}
              </select>
            </div>
          </div>

          {/* OTP Input and Verification section */}
          {otpSent && !otpVerified && (
            <div className="border-t border-teal-955/65 pt-4 flex flex-col gap-3">
              <h3 className="text-sm font-bold text-slate-200">OTP Code Received?</h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="Enter 6-digit OTP"
                  className="flex-grow border border-teal-955/80 bg-[#081d23] text-slate-100 rounded-xl px-3.5 py-2 text-sm tracking-widest text-center font-mono focus:outline-none focus:border-emerald-500"
                />
                <button
                  type="button"
                  onClick={handleVerifyOtp}
                  disabled={otpVerifying || otpCode.length !== 6}
                  className="bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs px-6 rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {otpVerifying ? 'Verifying...' : 'Verify OTP'}
                </button>
              </div>
            </div>
          )}

          {otpVerified && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2">
              ✓ Email Verified! OTP matches. Ready to place order.
            </div>
          )}

          {/* Prescription Upload for Narcotics */}
          {hasNarcotics && (
            <div className="border-t border-teal-955/65 pt-4 flex flex-col gap-2">
              <h3 className="text-xs font-semibold text-slate-400">Prescription Upload (Required)</h3>
              <input
                type="file"
                accept="image/jpeg,image/png,image/jpg,application/pdf"
                required
                onChange={(e) => setPrescriptionFile(e.target.files[0])}
                disabled={submitting}
                className="border border-teal-955/80 bg-[#081d23] text-slate-100 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-emerald-500 w-full"
              />
              <span className="text-xs text-purple-300 italic">Please upload a valid image or PDF copy of your prescription.</span>
            </div>
          )}

          {/* Payment Method selection */}
          <div className="border-t border-teal-955/65 pt-4 flex flex-col gap-2">
            <h3 className="text-xs font-semibold text-slate-400">Payment Method</h3>
            
            <label className="flex items-center gap-3 p-3 bg-[#0a232a]/45 border border-teal-955/40 rounded-xl cursor-pointer hover:border-teal-500/35 transition-colors">
              <input
                type="radio"
                name="paymentMethod"
                value="cod"
                checked={paymentMethod === 'cod'}
                onChange={() => setPaymentMethod('cod')}
                disabled={submitting}
                className="text-emerald-500 focus:ring-emerald-500"
              />
              <div>
                <span className="text-sm font-bold text-slate-100 block">Cash on Delivery (COD)</span>
                <span className="text-xs text-slate-400 block mt-0.5">Pay in cash when your order is delivered to your doorstep.</span>
              </div>
            </label>

            {!hasNarcotics && (
              <label className="flex items-center gap-3 p-3 bg-[#0a232a]/45 border border-teal-955/40 rounded-xl cursor-pointer hover:border-teal-500/35 transition-colors">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="card"
                  checked={paymentMethod === 'card'}
                  onChange={() => setPaymentMethod('card')}
                  disabled={submitting}
                  className="text-emerald-500 focus:ring-emerald-500"
                />
                <div>
                  <span className="text-sm font-bold text-slate-100 block">Card / Online Payment (Kuickpay)</span>
                  <span className="text-xs text-slate-400 block mt-0.5">Pay securely online using Habib Metro hosted checkout.</span>
                </div>
              </label>
            )}
          </div>

          <button
            type="submit"
            disabled={!otpVerified || submitting}
            className={`w-full py-3 rounded-xl font-extrabold text-sm transition-all shadow-md ${
              !otpVerified
                ? 'bg-[#0a232a]/30 text-slate-500 border border-teal-955/35 cursor-not-allowed'
                : submitting
                ? 'bg-emerald-600 text-[#04151a] opacity-95'
                : 'bg-emerald-500 hover:bg-emerald-400 text-[#04151a]'
            }`}
          >
            {submitting ? 'Submitting Order...' : paymentMethod === 'card' ? 'Pay Online & Place Order' : 'Place COD Order'}
          </button>
        </form>

        {/* Sidebar Summary */}
        <div className="md:col-span-2 flex flex-col gap-6">
          <div className="bg-[#0a232a]/55 p-6 rounded-3xl border border-teal-955/65 shadow-2xl backdrop-blur-md flex flex-col gap-4">
            <h2 className="font-bold text-slate-100 text-base border-b border-teal-955/40 pb-3 uppercase tracking-wider">Your Items</h2>
            
            <div className="flex flex-col gap-3 max-h-60 overflow-y-auto pr-1">
              {cart.map((item) => (
                <div key={item.productId} className="flex justify-between items-center gap-4 text-sm border-b border-teal-955/20 pb-2">
                  <div className="min-w-0">
                    <p className="font-bold text-slate-200 truncate">{item.name}</p>
                    <p className="text-xs text-slate-400 mt-0.5">Qty: {item.quantity} × PKR {item.price.toFixed(2)}</p>
                  </div>
                  <span className="font-bold text-slate-200 flex-shrink-0">
                    PKR {(item.price * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            <div className="border-t border-teal-955/40 pt-4 flex flex-col gap-2.5 text-sm">
              <div className="flex justify-between text-slate-400">
                <span>Subtotal</span>
                <span className="font-bold text-slate-100">PKR {cartTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-slate-400">
                <span>Delivery Charge ({customer.city})</span>
                <span className="font-bold text-slate-100">
                  {loadingCharge ? 'Updating...' : `PKR ${deliveryCharge.toFixed(2)}`}
                </span>
              </div>
              <div className="flex justify-between border-t border-teal-955/40 pt-3 text-base font-extrabold">
                <span className="text-slate-100">Total Amount</span>
                <span className="text-emerald-450">PKR {totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
