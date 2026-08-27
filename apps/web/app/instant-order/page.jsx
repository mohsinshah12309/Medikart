"use client";

import React, { useState, useEffect } from 'react';
import { getCities, requestOtp, verifyOtp, placeInstantOrder } from '../../lib/api';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function InstantOrderPage() {
  const router = useRouter();

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

  // OTP states
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpSending, setOtpSending] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);

  // Submission states
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [citiesList, setCitiesList] = useState([]);

  // Fetch active cities on mount
  useEffect(() => {
    async function loadCities() {
      try {
        const res = await getCities();
        if (res && res.data && res.data.cities) {
          setCitiesList(res.data.cities.map(c => c.name));
        } else {
          setCitiesList(['Lahore', 'Karachi', 'Islamabad', 'Rawalpindi', 'Faisalabad', 'Multan', 'Peshawar', 'Quetta', 'Gujranwala', 'Sialkot']);
        }
      } catch (err) {
        console.error("Failed to load cities:", err);
        setCitiesList(['Lahore', 'Karachi', 'Islamabad', 'Rawalpindi', 'Faisalabad', 'Multan', 'Peshawar', 'Quetta', 'Gujranwala', 'Sialkot']);
      }
    }
    loadCities();
  }, []);

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
      setErrorMsg(err.message || "Failed to send OTP.");
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
      alert("OTP verified successfully!");
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
    if (!prescriptionFile) {
      setErrorMsg("Prescription upload is required for instant orders.");
      return;
    }

    setErrorMsg('');
    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('customer', JSON.stringify(customer));
      formData.append('paymentMethod', 'cod'); // Defaults to COD for review
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
      setErrorMsg(err.message || "An error occurred while submitting your order.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-gray-950">Instant Prescription Order</h1>
        <p className="text-sm text-gray-500">
          Upload your prescription, fill in your details, and our pharmacist will review, price, and contact you to confirm the items.
        </p>
      </div>

      {errorMsg && (
        <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-lg text-sm font-medium">
          ⚠️ {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmitOrder} className="bg-white p-6 rounded-xl border border-gray-150 shadow-sm flex flex-col gap-6">
        <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-3">Prescription & Shipping Details</h2>

        {/* Prescription File Input */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="prescription" className="text-xs font-semibold text-gray-700">Upload Prescription (Required)</label>
          <input
            type="file"
            id="prescription"
            accept="image/jpeg,image/png,image/jpg,application/pdf"
            required
            onChange={(e) => setPrescriptionFile(e.target.files[0])}
            disabled={submitting}
            className="border border-gray-300 rounded-lg px-3.5 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-green-500 w-full"
          />
          <span className="text-xs text-gray-400">Accepted formats: JPG, JPEG, PNG, PDF (Max 10MB)</span>
        </div>

        {/* Additional instructions */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="branchDescription" className="text-xs font-semibold text-gray-700">Add Instructions (Optional)</label>
          <textarea
            id="branchDescription"
            rows={3}
            value={branchDescription}
            onChange={(e) => setBranchDescription(e.target.value)}
            disabled={submitting}
            placeholder="Type any specific instructions for the pharmacist, e.g., preferred brand, dose, quantity, or specific items..."
            className="border border-gray-300 rounded-lg px-3.5 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-green-500 w-full"
          />
        </div>

        {/* Shipping fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-gray-150 pt-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="name" className="text-xs font-semibold text-gray-700">Full Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={customer.name}
              onChange={handleInputChange}
              required
              disabled={otpVerified || submitting}
              placeholder="Mohsin Shah"
              className="border border-gray-300 rounded-lg px-3.5 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
            />
          </div>
          
          <div className="flex flex-col gap-1.5">
            <label htmlFor="phone" className="text-xs font-semibold text-gray-700">Phone Number</label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={customer.phone}
              onChange={handleInputChange}
              required
              disabled={otpVerified || submitting}
              placeholder="03001234567"
              className="border border-gray-300 rounded-lg px-3.5 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
            />
          </div>

          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <label htmlFor="email" className="text-xs font-semibold text-gray-700">Email Address (for OTP Verification)</label>
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
                className="flex-grow border border-gray-300 rounded-lg px-3.5 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
              />
              {!otpSent && (
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={otpSending || !customer.email}
                  className="bg-green-600 hover:bg-green-700 text-white font-medium text-xs px-4 rounded-lg transition-colors whitespace-nowrap disabled:opacity-50"
                >
                  {otpSending ? 'Sending...' : 'Send OTP'}
                </button>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <label htmlFor="address" className="text-xs font-semibold text-gray-700">Delivery Address</label>
            <input
              type="text"
              id="address"
              name="address"
              value={customer.address}
              onChange={handleInputChange}
              required
              disabled={otpVerified || submitting}
              placeholder="House 123, Street 4"
              className="border border-gray-300 rounded-lg px-3.5 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="city" className="text-xs font-semibold text-gray-700">City</label>
            <select
              id="city"
              name="city"
              value={customer.city}
              onChange={handleInputChange}
              disabled={otpVerified || submitting}
              className="border border-gray-300 rounded-lg px-3.5 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-green-500 bg-white"
            >
              {citiesList.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        {/* OTP Verification Section */}
        {otpSent && !otpVerified && (
          <div className="border-t border-gray-150 pt-4 flex flex-col gap-3">
            <h3 className="text-sm font-bold text-gray-800">OTP Code Received?</h3>
            <div className="flex gap-2">
              <input
                type="text"
                maxLength={6}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                placeholder="Enter 6-digit OTP"
                className="flex-grow border border-gray-300 rounded-lg px-3.5 py-2 text-sm tracking-widest text-center font-mono focus:outline-none focus:ring-1 focus:ring-green-500"
              />
              <button
                type="button"
                onClick={handleVerifyOtp}
                disabled={otpVerifying || otpCode.length !== 6}
                className="bg-green-600 hover:bg-green-700 text-white font-medium text-xs px-6 rounded-lg transition-colors disabled:opacity-50"
              >
                {otpVerifying ? 'Verifying...' : 'Verify OTP'}
              </button>
            </div>
          </div>
        )}

        {otpVerified && (
          <div className="bg-green-50 border border-green-200 text-green-800 p-3 rounded-lg text-xs font-semibold flex items-center gap-2">
            ✓ Email Verified! OTP matches. Ready to place order.
          </div>
        )}

        <button
          type="submit"
          disabled={!otpVerified || submitting || !prescriptionFile}
          className={`w-full py-3 rounded-lg font-bold text-sm transition-all shadow-sm ${
            !otpVerified || !prescriptionFile
              ? 'bg-gray-150 text-gray-400 cursor-not-allowed border border-gray-200'
              : submitting
              ? 'bg-green-700 text-white opacity-95'
              : 'bg-green-600 hover:bg-green-700 text-white'
          }`}
        >
          {submitting ? 'Submitting Prescription...' : 'Place Instant Order'}
        </button>
      </form>
    </div>
  );
}
