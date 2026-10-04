"use client";

import { useState, useEffect, useRef } from 'react';
import {
  getDeliveryCharge,
  requestOtp,
  verifyOtp,
  placeStandardOrder,
  getCities,
  placeNarcoticsOrder,
  initiatePayment,
} from '../../lib/api';
import { trackPurchase } from '../../lib/analytics';

const CITIES = ['Lahore'];

/**
 * Custom hook encapsulating Checkout state, validation, OTP cycles, and order placement (SRP).
 */
export function useCheckout({ cart, cartTotal, clearCart, isLoaded, router }) {
  const otpInputRef = useRef(null);
  const hasNarcotics = cart.some((item) => item.isNarcotic);

  // Customer form states
  const [customer, setCustomer] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: 'Lahore',
  });

  const [deliveryCharge, setDeliveryCharge] = useState(200);
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
  const [confirmedOrderId, setConfirmedOrderId] = useState(null);
  const [placedOrderSummary, setPlacedOrderSummary] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [citiesList, setCitiesList] = useState(CITIES);
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [prescriptionFile, setPrescriptionFile] = useState(null);
  const [prescriptionPreviewUrl, setPrescriptionPreviewUrl] = useState(null);

  // Force COD if cart contains narcotics
  useEffect(() => {
    if (hasNarcotics) {
      setPaymentMethod('cod');
    }
  }, [hasNarcotics]);

  // Resend timer effect with session persist
  useEffect(() => {
    const stored = sessionStorage.getItem('otpCooldownUntil');
    if (stored) {
      const remaining = Math.floor((parseInt(stored, 10) - Date.now()) / 1000);
      if (remaining > 0) {
        setResendTimer(remaining);
      }
    }
  }, []);

  useEffect(() => {
    if (resendTimer === 60) {
      sessionStorage.setItem('otpCooldownUntil', Date.now() + 60000);
    }
  }, [resendTimer]);

  useEffect(() => {
    let timer;
    if (resendTimer > 0) {
      timer = setInterval(() => {
        setResendTimer((prev) => {
          if (prev <= 1) sessionStorage.removeItem('otpCooldownUntil');
          return prev - 1;
        });
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
          const names = res.data.cities.map((c) => c.name);
          if (!names.some((n) => n.trim().toLowerCase() === 'other')) {
            names.push('Other');
          }
          setCitiesList(names);
        }
      } catch (err) {
        console.error('Failed to load cities:', err);
        setCitiesList(['Lahore', 'Karachi', 'Islamabad', 'Rawalpindi', 'Faisalabad', 'Other']);
      }
    }
    loadCities();
  }, []);

  // Sync selected city
  useEffect(() => {
    if (citiesList.length > 0 && !citiesList.includes(customer.city)) {
      setCustomer((prev) => ({ ...prev, city: citiesList[0] }));
    }
  }, [citiesList, customer.city]);

  // Auto-switch to Card if city is 'Other'
  useEffect(() => {
    const isOther = (customer.city || '').trim().toLowerCase() === 'other';
    if (isOther && paymentMethod === 'cod') {
      setPaymentMethod('card');
    }
  }, [customer.city, paymentMethod]);

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
        console.error('Failed to load delivery charge:', err);
        setDeliveryCharge(200);
      } finally {
        setLoadingCharge(false);
      }
    }

    updateDelivery();
  }, [customer.city]);

  // Redirect if cart is empty and order not just confirmed
  useEffect(() => {
    if (isLoaded && cart.length === 0 && !confirmedOrderId) {
      alert('Your cart is empty. Redirecting to the store...');
      router.push('/');
    }
  }, [cart, isLoaded, confirmedOrderId, router]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCustomer((prev) => ({ ...prev, [name]: value }));
  };

  const handleSendOtp = async (arg1 = false, arg2 = null) => {
    let overrideSuggestion = false;
    let emailToUse = null;

    if (typeof arg1 === 'boolean') {
      overrideSuggestion = arg1;
      emailToUse = arg2;
    } else if (typeof arg1 === 'string') {
      emailToUse = arg1;
      overrideSuggestion = arg2 === true;
    }

    if (hasNarcotics && !prescriptionFile) {
      setErrorMsg("⚠️ Prescription Required: Your cart contains Rx/Controlled medicine items. You must upload a valid doctor's prescription (PDF or Image) before requesting an OTP verification code.");
      setOtpFeedback({ type: 'error', msg: 'Prescription document is required above before requesting OTP.' });
      return;
    }

    const isOverride = overrideSuggestion === true;
    const targetEmail = (typeof emailToUse === 'string' ? emailToUse : customer.email || '').trim();
    if (!targetEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(targetEmail)) {
      setErrorMsg('Please enter a valid email address first.');
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
        msg: `OTP verification code sent to ${targetEmail}. Please check your Inbox (or Spam/Junk folder).`,
      });
      setResendTimer(60);
      setTimeout(() => {
        if (otpInputRef.current) otpInputRef.current.focus();
      }, 200);
    } catch (err) {
      console.warn('OTP Send error:', err.message);
      setOtpSent(false);
      setOtpFeedback({
        type: 'error',
        msg: err.message || 'Failed to send verification code. Please check your email address.',
      });
    } finally {
      setOtpSending(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otpCode.trim().length !== 6) {
      setOtpFeedback({ type: 'error', msg: 'OTP must be exactly 6 digits.' });
      return;
    }

    setErrorMsg('');
    setOtpFeedback({ type: '', msg: '' });
    setOtpVerifying(true);

    try {
      await verifyOtp(customer.email, otpCode.trim());
      setOtpVerified(true);
      setOtpFeedback({ type: 'success', msg: '✓ Email verified successfully! You can now complete your order.' });
    } catch (err) {
      setOtpFeedback({ type: 'error', msg: err.message || 'Invalid OTP code. Please check and try again.' });
    } finally {
      setOtpVerifying(false);
    }
  };

  const handlePrescriptionChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) {
      setPrescriptionFile(null);
      setPrescriptionPreviewUrl(null);
      return;
    }

    const fileName = file.name.toLowerCase();
    const fileType = file.type.toLowerCase();

    const forbiddenExts = ['.zip', '.rar', '.7z', '.tar', '.gz', '.bz2', '.iso'];
    const isForbiddenExt = forbiddenExts.some((ext) => fileName.endsWith(ext));
    const isForbiddenType =
      fileType.includes('zip') || fileType.includes('compressed') || fileType.includes('archive');

    if (isForbiddenExt || isForbiddenType) {
      e.target.value = '';
      setPrescriptionFile(null);
      setPrescriptionPreviewUrl(null);
      setErrorMsg(
        '⚠️ Upload Error: ZIP folders and compressed archive files are strictly NOT allowed. Please upload a PDF or an Image (JPG, PNG, WEBP).'
      );
      return;
    }

    const allowedExts = ['.pdf', '.jpg', '.jpeg', '.png', '.webp'];
    const isAllowedExt = allowedExts.some((ext) => fileName.endsWith(ext));
    const isAllowedType = fileType.startsWith('image/') || fileType === 'application/pdf';

    if (!isAllowedExt || !isAllowedType) {
      e.target.value = '';
      setPrescriptionFile(null);
      setPrescriptionPreviewUrl(null);
      setErrorMsg('⚠️ Upload Error: Invalid file format. Only PDF documents and Image files (JPG, PNG, WEBP) are allowed.');
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      e.target.value = '';
      setPrescriptionFile(null);
      setPrescriptionPreviewUrl(null);
      setErrorMsg('⚠️ Upload Error: File size exceeds the maximum limit of 15MB.');
      return;
    }

    setErrorMsg('');
    setPrescriptionFile(file);
    if (fileType.startsWith('image/')) {
      setPrescriptionPreviewUrl(URL.createObjectURL(file));
    } else {
      setPrescriptionPreviewUrl(null);
    }
  };

  const PLATFORM_FEE = 10;
  const totalAmount = cartTotal + deliveryCharge + PLATFORM_FEE;

  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    if (submitting) return;
    if (!customer.name || !customer.email || !customer.phone || !customer.address || !customer.city) {
      setErrorMsg('Please fill out all required shipping fields.');
      return;
    }
    if (!otpVerified) {
      setErrorMsg('Please verify your email address using the 6-digit OTP code before proceeding.');
      return;
    }
    if (hasNarcotics && !prescriptionFile) {
      setErrorMsg('Prescription upload (PDF or Image) is required for controlled medicine items.');
      return;
    }
    if (customer.city?.trim().toLowerCase() === 'other' && paymentMethod === 'cod') {
      setErrorMsg(
        "Cash on Delivery (COD) is not available for deliveries in 'Other' cities. Please select Debit / Credit Card payment."
      );
      return;
    }
    setErrorMsg('');
    setSubmitting(true);

    try {
      let orderId;
      if (hasNarcotics) {
        const formData = new FormData();
        formData.append('customer', JSON.stringify(customer));
        formData.append(
          'items',
          JSON.stringify(
            cart.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
            }))
          )
        );
        formData.append('paymentMethod', 'cod');
        formData.append(
          'otp',
          JSON.stringify({
            email: customer.email,
            code: otpCode,
          })
        );
        formData.append('prescription', prescriptionFile);

        const res = await placeNarcoticsOrder(formData);
        if (res && res.status !== 'fail') {
          orderId = res.data?.order?.orderCode || res._id || res.data?.order?._id;
        } else {
          throw new Error(res.message || 'Failed to place order.');
        }
      } else {
        const payload = {
          customer,
          items: cart.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
          })),
          paymentMethod,
          otp: {
            email: customer.email,
            code: otpCode,
          },
        };

        const res = await placeStandardOrder(payload);
        if (res && res.status !== 'fail') {
          orderId = res.data?.order?.orderCode || res._id || res.data?.order?._id;
        } else {
          throw new Error(res.message || 'Failed to place order.');
        }
      }

      if (orderId) {
        trackPurchase({
          orderCode: orderId,
          totals: { total: totalAmount, deliveryCharge },
          paymentMethod,
          items: cart,
        });

        setPlacedOrderSummary({
          total: totalAmount,
          customer: { ...customer },
          paymentMethod,
          type: hasNarcotics ? 'narcotics' : 'standard',
        });
        setConfirmedOrderId(orderId);

        if (paymentMethod === 'card' && !hasNarcotics) {
          try {
            const payRes = await initiatePayment(orderId);
            if (payRes && payRes.redirectUrl) {
              clearCart();
              window.location.href = payRes.redirectUrl;
              return;
            }
          } catch (payErr) {
            console.warn('Card payment gateway notice:', payErr);
          }
          clearCart();
        } else {
          clearCart();
        }
      }
    } catch (err) {
      setErrorMsg(err.message || 'An error occurred while submitting your order.');
    } finally {
      setSubmitting(false);
    }
  };

  return {
    customer,
    setCustomer,
    handleInputChange,
    deliveryCharge,
    loadingCharge,
    otpCode,
    setOtpCode,
    otpSent,
    otpSending,
    otpVerified,
    otpVerifying,
    otpFeedback,
    resendTimer,
    submitting,
    confirmedOrderId,
    placedOrderSummary,
    errorMsg,
    setErrorMsg,
    citiesList,
    paymentMethod,
    setPaymentMethod,
    prescriptionFile,
    prescriptionPreviewUrl,
    hasNarcotics,
    otpInputRef,
    PLATFORM_FEE,
    totalAmount,
    handleSendOtp,
    handleVerifyOtp,
    handlePrescriptionChange,
    handleSubmitOrder,
  };
}
