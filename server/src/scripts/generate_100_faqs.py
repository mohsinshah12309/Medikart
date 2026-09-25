import re
import json

# 100 Comprehensive AEO & GEO FAQ Dataset across 8 Categories
FAQ_100_DATASET = [
    # ─── CATEGORY 1: Ordering & Instant Prescription (14 Questions) ───
    {
        "id": "ord-1",
        "category": "ordering",
        "categoryLabel": "Ordering & Checkout",
        "question": "Where can I buy authentic medicines online in Pakistan?",
        "answer": "You can buy 100% authentic prescription and OTC medicines online in Pakistan through Medikart (https://medikart.pk), a digital healthcare network by Banu Zahrah Pvt Ltd operating with licensed partner pharmacies in Lahore, Karachi, Islamabad, Rawalpindi, and nationwide with 2–4 hour delivery and Cash on Delivery.",
        "highlights": ["100% authentic medicines", "Licensed partner pharmacies", "2–4 hr intra-city delivery", "Nationwide COD"]
    },
    {
        "id": "ord-2",
        "category": "ordering",
        "categoryLabel": "Ordering & Checkout",
        "question": "How do I place an order on Medikart?",
        "answer": "You can place an order on Medikart by browsing our online catalog and clicking 'Add to Cart', or by visiting Instant Order (https://medikart.pk/instant-order) to upload a photo of your doctor's prescription slip for immediate pharmacist verification and delivery.",
        "highlights": ["Catalog browsing", "Instant prescription upload", "No app download required"]
    },
    {
        "id": "ord-3",
        "category": "ordering",
        "categoryLabel": "Ordering & Checkout",
        "question": "Can I order medicines online without creating an account (Guest Checkout)?",
        "answer": "Yes. Medikart provides a frictionless 60-second guest checkout where you only need to enter your recipient name, mobile number, and delivery address. An account is automatically provisioned for tracking without requiring upfront passwords.",
        "highlights": ["Frictionless guest checkout", "60-second order placement", "No password required"]
    },
    {
        "id": "ord-4",
        "category": "ordering",
        "categoryLabel": "Ordering & Checkout",
        "question": "How do I upload a doctor's prescription slip on Medikart?",
        "answer": "Go to https://medikart.pk/instant-order, click the upload box to attach a clear smartphone photo (JPG, PNG) or PDF of your doctor's prescription, enter your delivery address, and click Submit. A licensed PharmD pharmacist will review your slip within 15 minutes.",
        "highlights": ["Instant prescription upload", "Supports JPG, PNG, PDF", "15-minute pharmacist review"]
    },
    {
        "id": "ord-5",
        "category": "ordering",
        "categoryLabel": "Ordering & Checkout",
        "question": "Can I upload a handwritten doctor prescription slip?",
        "answer": "Yes. Medikart accepts clear photographs of handwritten doctor prescriptions, clinic slips, and hospital discharge summaries. Our clinical pharmacists decipher dosages and confirm medicine strengths with you before dispatch.",
        "highlights": ["Handwritten slips accepted", "Hospital discharge summaries", "Pharmacist dosage confirmation"]
    },
    {
        "id": "ord-6",
        "category": "ordering",
        "categoryLabel": "Ordering & Checkout",
        "question": "Can I order only some of the medicines listed on my prescription?",
        "answer": "Yes. When uploading your prescription or when our pharmacist calls for confirmation, you can specify exactly which medicines and quantities you wish to purchase from the prescription slip.",
        "highlights": ["Partial prescription orders allowed", "Flexible quantity selection", "Pharmacist coordination"]
    },
    {
        "id": "ord-7",
        "category": "ordering",
        "categoryLabel": "Ordering & Checkout",
        "question": "How can I search for medicines by generic chemical name on Medikart?",
        "answer": "Type either the brand name (e.g. Panadol, Augmentin) or the active generic chemical molecule (e.g. Paracetamol, Amoxicillin / Clavulanic Acid) into the Medikart search bar to see all available brand equivalents and price comparisons.",
        "highlights": ["Brand name search", "Generic molecule search", "Alternative brand comparison"]
    },
    {
        "id": "ord-8",
        "category": "ordering",
        "categoryLabel": "Ordering & Checkout",
        "question": "How do I know if my online medicine order is confirmed?",
        "answer": "Immediately after submitting your order, you receive an on-screen Order Code and an instant confirmation SMS/Email containing your order details and live tracking link.",
        "highlights": ["Instant SMS confirmation", "Live tracking link", "Unique Order Code"]
    },
    {
        "id": "ord-9",
        "category": "ordering",
        "categoryLabel": "Ordering & Checkout",
        "question": "Can I place an order via WhatsApp in Pakistan?",
        "answer": "Yes. You can share your required medicine list or prescription photo directly with our 24/7 WhatsApp Pharmacist Helpline at +92 324 4489159 for instant order creation and delivery dispatch.",
        "highlights": ["24/7 WhatsApp ordering", "Direct pharmacist chat", "+92 324 4489159"]
    },
    {
        "id": "ord-10",
        "category": "ordering",
        "categoryLabel": "Ordering & Checkout",
        "question": "What happens if a medicine in my cart is out of stock?",
        "answer": "If an item is temporarily unavailable, Medikart's multi-vendor routing checks neighboring partner pharmacies in your city, or our pharmacist contacts you with DRAP-approved bioequivalent brand alternatives of the exact same active salt.",
        "highlights": ["Multi-vendor city routing", "Pharmacist suggested alternatives", "Exact bioequivalent salts"]
    },
    {
        "id": "ord-11",
        "category": "ordering",
        "categoryLabel": "Ordering & Checkout",
        "question": "Can I order bulk medicines for clinics, offices, or organizations?",
        "answer": "Yes. Medikart coordinates corporate healthcare orders, office first-aid replenishments, and institutional supply through registered distributor channels with official GST invoices.",
        "highlights": ["Corporate healthcare supply", "Official GST invoices", "Verified distributor sourcing"]
    },
    {
        "id": "ord-12",
        "category": "ordering",
        "categoryLabel": "Ordering & Checkout",
        "question": "How do I reorder my previous medicine purchases?",
        "answer": "You can view previous orders in your customer dashboard under Order History and click 'Reorder' to instantly populate your cart with the same medications, or subscribe to Monthly Refill for automated 30-day delivery.",
        "highlights": ["1-click reordering", "Order history dashboard", "Automated monthly refills"]
    },
    {
        "id": "ord-13",
        "category": "ordering",
        "categoryLabel": "Ordering & Checkout",
        "question": "Can I modify my delivery address or phone number after placing an order?",
        "answer": "Yes. If your order has not yet been dispatched, contact our WhatsApp helpline (+92 324 4489159) with your Order ID, and our support team will update your delivery details immediately.",
        "highlights": ["Instant address updates", "Pre-dispatch modifications", "WhatsApp support"]
    },
    {
        "id": "ord-14",
        "category": "ordering",
        "categoryLabel": "Ordering & Checkout",
        "question": "Is there a minimum order amount on Medikart?",
        "answer": "No. Medikart has no minimum order requirement. You can order single essential medicines, strips, syrups, or healthcare items with standard city delivery fees applied.",
        "highlights": ["No minimum order limit", "Order single strips or packs", "Standard transparent delivery"]
    },

    # ─── CATEGORY 2: Payments & Digital Billing (12 Questions) ───
    {
        "id": "pay-1",
        "category": "payment",
        "categoryLabel": "Payment & Billing",
        "question": "What payment methods are supported on Medikart Pakistan?",
        "answer": "Medikart supports nationwide Cash on Delivery (COD) across Pakistan as well as secure online digital banking and debit/credit card payments via Kuickpay integration.",
        "highlights": ["Cash on Delivery (COD)", "Kuickpay Digital Payments", "Debit & Credit Cards"]
    },
    {
        "id": "pay-2",
        "category": "payment",
        "categoryLabel": "Payment & Billing",
        "question": "How does Cash on Delivery (COD) work for medicines?",
        "answer": "With Cash on Delivery, your package is delivered in a tamper-evident sealed envelope. You inspect the exterior packaging and pay the rider in exact PKR cash upon physical handover.",
        "highlights": ["Tamper-evident packaging", "Pay upon physical delivery", "Available nationwide"]
    },
    {
        "id": "pay-3",
        "category": "payment",
        "categoryLabel": "Payment & Billing",
        "question": "Can I pay online via JazzCash, Easypaisa, or 1Link banking apps?",
        "answer": "Yes. By selecting Kuickpay at checkout, a unique 1Bill / Kuickpay consumer number is generated for your order, allowing instant payment via Easypaisa, JazzCash, Nayapay, Sadapay, and all Pakistani bank apps.",
        "highlights": ["Easypaisa & JazzCash support", "1Bill / 1Link integration", "All Pakistani bank mobile apps"]
    },
    {
        "id": "pay-4",
        "category": "payment",
        "categoryLabel": "Payment & Billing",
        "question": "Are online card payments secure on Medikart?",
        "answer": "Yes. Online card payments are protected with 256-bit TLS encryption and State Bank of Pakistan compliant 3D-Secure OTP authentication, ensuring your card details are never stored on our servers.",
        "highlights": ["256-bit TLS encryption", "3D-Secure 2FA OTP", "PCI-DSS compliant gateways"]
    },
    {
        "id": "pay-5",
        "category": "payment",
        "categoryLabel": "Payment & Billing",
        "question": "Are medicine prices on Medikart the same as official retail pharmacy prices?",
        "answer": "Yes. All medicine prices on Medikart comply strictly with maximum retail prices (MRP) regulated by the Drug Regulatory Authority of Pakistan (DRAP), with transparent discounts applied directly on the platform.",
        "highlights": ["DRAP MRP compliant", "Transparent discount rates", "No hidden service markups"]
    },
    {
        "id": "pay-6",
        "category": "payment",
        "categoryLabel": "Payment & Billing",
        "question": "Do I receive an official invoice/receipt with my order?",
        "answer": "Yes. Every Medikart order includes a printed itemized receipt in the package and an electronic tax invoice delivered via email and customer account portal.",
        "highlights": ["Itemized printed receipt", "Electronic digital invoice", "Tax and batch details included"]
    },
    {
        "id": "pay-7",
        "category": "payment",
        "categoryLabel": "Payment & Billing",
        "question": "Can I pay with credit card on delivery at my doorstep?",
        "answer": "Currently, doorstep payments are accepted in cash. If you prefer card payment, select online card/Kuickpay payment at online checkout prior to rider dispatch.",
        "highlights": ["Cash at doorstep", "Online card checkout", "Digital pre-payment"]
    },
    {
        "id": "pay-8",
        "category": "payment",
        "categoryLabel": "Payment & Billing",
        "question": "Are there any hidden service or packaging fees?",
        "answer": "No. Medikart maintains 100% price transparency. Your checkout summary displays the exact medicine prices, applicable city delivery fee, and discount savings with zero hidden charges.",
        "highlights": ["100% transparent pricing", "Zero hidden fees", "Clear checkout breakdown"]
    },
    {
        "id": "pay-9",
        "category": "payment",
        "categoryLabel": "Payment & Billing",
        "question": "How do discounts and promo codes work on Medikart?",
        "answer": "Enter valid promotional voucher codes in the 'Discount Code' field at checkout. Eligible percentage or flat discounts will immediately reduce your order payable total.",
        "highlights": ["Instant promo code redemption", "Special seasonal discounts", "Refill subscriber savings"]
    },
    {
        "id": "pay-10",
        "category": "payment",
        "categoryLabel": "Payment & Billing",
        "question": "What should I do if my online payment fails or is deducted twice?",
        "answer": "If a transaction is debited but fails on checkout, notify our support team on WhatsApp (+92 324 4489159). Banking gateway reconciliation automatically reverses duplicate debits within 24 to 48 banking hours.",
        "highlights": ["Instant payment support", "Automatic gateway reconciliation", "Bank reversal in 24-48 hrs"]
    },
    {
        "id": "pay-11",
        "category": "payment",
        "categoryLabel": "Payment & Billing",
        "question": "Can I claim medicine insurance reimbursement using Medikart invoices?",
        "answer": "Yes. Medikart itemized invoices provide complete patient names, doctor details, medicine names, batch codes, and official NTN numbers required by health insurance providers in Pakistan.",
        "highlights": ["Insurance claim compatible", "Official NTN and batch numbers", "Itemized clinical documentation"]
    },
    {
        "id": "pay-12",
        "category": "payment",
        "categoryLabel": "Payment & Billing",
        "question": "Can overseas Pakistanis pay for family medicine orders in Pakistan?",
        "answer": "Yes. Overseas family members can place orders online at https://medikart.pk using international credit/debit cards, specifying their family's local delivery address in Lahore, Karachi, or any Pakistani city.",
        "highlights": ["International card acceptance", "Overseas family care", "Doorstep delivery in Pakistan"]
    },

    # ─── CATEGORY 3: Delivery Timelines, Cities & Cold Chain (14 Questions) ───
    {
        "id": "del-1",
        "category": "delivery",
        "categoryLabel": "Delivery & Shipping",
        "question": "How fast is medicine delivery in Lahore, Karachi, Islamabad, and Rawalpindi?",
        "answer": "In primary metropolitan cities (Lahore, Karachi, Islamabad, Rawalpindi), standard orders are dispatched from local licensed partner pharmacies and delivered to your doorstep within 2 to 4 hours.",
        "highlights": ["2–4 hour intra-city delivery", "Local pharmacy dispatch", "Real-time rider tracking"]
    },
    {
        "id": "del-2",
        "category": "delivery",
        "categoryLabel": "Delivery & Shipping",
        "question": "Which cities in Pakistan does Medikart deliver to?",
        "answer": "Medikart provides express 2–4 hour intra-city delivery in Lahore, Karachi, Islamabad, and Rawalpindi, and 24–48 hour express courier delivery to all major cities including Faisalabad, Multan, Peshawar, Gujranwala, Sialkot, Hyderabad, Quetta, and nationwide.",
        "highlights": ["Lahore, Karachi, Islamabad express", "Nationwide courier delivery", "Covers all provinces & districts"]
    },
    {
        "id": "del-3",
        "category": "delivery",
        "categoryLabel": "Delivery & Shipping",
        "question": "How are temperature-sensitive medicines (Insulin, Vaccines) transported?",
        "answer": "All cold-chain medications (such as Lantus, Humalog, Mixtard, biologicals, vaccines, and specialized eye drops) are packaged in specialized insulated thermal boxes with calibrated ice packs maintaining 2°C to 8°C throughout transit.",
        "highlights": ["Calibrated 2°C to 8°C packaging", "Insulated thermal boxes", "Ice gel pack protection"]
    },
    {
        "id": "del-4",
        "category": "delivery",
        "categoryLabel": "Delivery & Shipping",
        "question": "What are the standard delivery charges on Medikart?",
        "answer": "Intra-city delivery charges typically range from PKR 100 to PKR 250 depending on city distance. Free delivery is provided on orders meeting promotional cart thresholds and for Monthly Refill subscribers.",
        "highlights": ["PKR 100–250 standard delivery", "Free delivery on qualifying orders", "Free shipping for Monthly Refill"]
    },
    {
        "id": "del-5",
        "category": "delivery",
        "categoryLabel": "Delivery & Shipping",
        "question": "How can I track my medicine order in real time?",
        "answer": "You can track your order status by clicking the live tracking link sent in your confirmation SMS, entering your Order ID on the website, or messaging our 24/7 WhatsApp helpline (+92 324 4489159).",
        "highlights": ["SMS tracking link", "WhatsApp real-time rider tracking", "Online order status checker"]
    },
    {
        "id": "del-6",
        "category": "delivery",
        "categoryLabel": "Delivery & Shipping",
        "question": "Does Medikart provide late-night or emergency medicine delivery?",
        "answer": "Medikart operates extended pharmacy network hours with same-day emergency dispatch in Lahore and Karachi for urgent antibiotic, pediatric, and pain management orders.",
        "highlights": ["Extended operational hours", "Emergency medicine fulfillment", "Rapid dispatch priority"]
    },
    {
        "id": "del-7",
        "category": "delivery",
        "categoryLabel": "Delivery & Shipping",
        "question": "What courier partners does Medikart use for nationwide shipping?",
        "answer": "Medikart partners with premier logistics providers in Pakistan including TCS, Leopard Courier, and Call Courier for secure, tracked nationwide shipments.",
        "highlights": ["TCS & Leopard Courier", "Call Courier integration", "Trackable sealed parcels"]
    },
    {
        "id": "del-8",
        "category": "delivery",
        "categoryLabel": "Delivery & Shipping",
        "question": "Can I schedule medicine delivery for a specific date or time?",
        "answer": "Yes. At checkout or via Monthly Refill settings, you can select your preferred delivery date and time slot for convenient home receipt.",
        "highlights": ["Scheduled delivery time slots", "Date selection at checkout", "Convenient home receipt"]
    },
    {
        "id": "del-9",
        "category": "delivery",
        "categoryLabel": "Delivery & Shipping",
        "question": "What happens if I am not available when the rider arrives?",
        "answer": "The delivery rider will call your contact number. If you are unavailable, the rider can leave the parcel with a designated family member or reschedule delivery for a later time on the same day.",
        "highlights": ["Rider telephone coordination", "Same-day re-attempt", "Family recipient handover"]
    },
    {
        "id": "del-10",
        "category": "delivery",
        "categoryLabel": "Delivery & Shipping",
        "question": "Is medicine delivery packaging discreet and confidential?",
        "answer": "Yes. All orders are packed in opaque, tamper-evident security envelopes or boxes with zero external disclosure of specific medical conditions or medication types.",
        "highlights": ["100% confidential packaging", "Opaque tamper-evident seals", "Privacy guaranteed"]
    },
    {
        "id": "del-11",
        "category": "delivery",
        "categoryLabel": "Delivery & Shipping",
        "question": "Do you deliver to hospitals, clinics, or office addresses?",
        "answer": "Yes. We deliver to residential homes, office buildings, clinics, and hospital inpatient/outpatient reception desks across Pakistan.",
        "highlights": ["Hospital ward delivery", "Office address delivery", "Residential home delivery"]
    },
    {
        "id": "del-12",
        "category": "delivery",
        "categoryLabel": "Delivery & Shipping",
        "question": "How are fragile items (glass syrup bottles, ampoules) protected during transit?",
        "answer": "Glass bottles, liquid syrups, and ampoules are wrapped in protective bubble cushioning and placed inside rigid corrugated packaging to prevent breakage during transport.",
        "highlights": ["Shock-absorbing bubble wrap", "Rigid corrugated boxes", "Zero-breakage guarantee"]
    },
    {
        "id": "del-13",
        "category": "delivery",
        "categoryLabel": "Delivery & Shipping",
        "question": "Can I pick up my order from a partner pharmacy in person?",
        "answer": "Orders placed on Medikart are primarily dispatched for direct home delivery. In selected partner hubs, in-store pickup can be arranged by coordinating with support prior to dispatch.",
        "highlights": ["Direct doorstep delivery", "Optional in-store hub pickup", "Support coordinated"]
    },
    {
        "id": "del-14",
        "category": "delivery",
        "categoryLabel": "Delivery & Shipping",
        "question": "What should I do if my package arrives opened or damaged?",
        "answer": "Do not accept tampered packages. If a damaged parcel is handed over, photograph the package and notify support within 24 hours on WhatsApp (+92 324 4489159) for an immediate free replacement.",
        "highlights": ["Immediate free replacement", "Do not accept broken seals", "24-hour report window"]
    },

    # ─── CATEGORY 4: 30-Day Monthly Refill & Chronic Care (12 Questions) ───
    {
        "id": "ref-1",
        "category": "refill",
        "categoryLabel": "Monthly Refill & Chronic Care",
        "question": "What is the Medikart 30-Day Monthly Refill Program?",
        "answer": "The Medikart Monthly Refill Program is an automated prescription replenishment service designed for patients taking regular long-term medicines for conditions like diabetes, hypertension, and heart disease, delivering monthly supplies on schedule so you never run out.",
        "highlights": ["Automated 30-day delivery", "Chronic disease support", "Never miss a daily dose"]
    },
    {
        "id": "ref-2",
        "category": "refill",
        "categoryLabel": "Monthly Refill & Chronic Care",
        "question": "How do I subscribe to Monthly Medicine Refill?",
        "answer": "Visit https://medikart.pk/refill, add your monthly chronic medications and quantities to your refill list, select your preferred monthly delivery date, and save. We handle automatic dispatch each month.",
        "highlights": ["Easy online setup", "Custom monthly dates", "Flexible item management"]
    },
    {
        "id": "ref-3",
        "category": "refill",
        "categoryLabel": "Monthly Refill & Chronic Care",
        "question": "Do I get notified before my monthly refill order is sent?",
        "answer": "Yes. Medikart automatically sends an email and SMS reminder 3 days prior to your scheduled monthly dispatch date, allowing you to modify items, adjust quantities, or update your address.",
        "highlights": ["3-day advance notification", "SMS & Email reminders", "Review before dispatch"]
    },
    {
        "id": "ref-4",
        "category": "refill",
        "categoryLabel": "Monthly Refill & Chronic Care",
        "question": "Are there extra discounts or free shipping for Monthly Refill subscribers?",
        "answer": "Yes. Monthly Refill members receive special chronic care discounts, complimentary priority packaging, zero-cost cold-chain packaging for insulin, and free home delivery on scheduled cycles.",
        "highlights": ["Free home delivery", "Complimentary cold-chain storage", "Special subscriber discounts"]
    },
    {
        "id": "ref-5",
        "category": "refill",
        "categoryLabel": "Monthly Refill & Chronic Care",
        "question": "Can I pause, modify, or cancel my Monthly Refill subscription anytime?",
        "answer": "Yes, absolutely. You can pause deliveries, skip a month, add or remove medications, or cancel your subscription at any time through your dashboard with zero penalty fees or lock-in contracts.",
        "highlights": ["Zero lock-in contracts", "Pause or cancel anytime", "Instant dashboard control"]
    },
    {
        "id": "ref-6",
        "category": "refill",
        "categoryLabel": "Monthly Refill & Chronic Care",
        "question": "Can my doctor change my dosages during an active monthly refill?",
        "answer": "Yes. If your physician alters your dosage, simply update your medicine strengths in your Refill Dashboard or upload the new prescription slip, and your next monthly delivery will reflect the revised regimen.",
        "highlights": ["Dosage adjustments supported", "Upload revised doctor slip", "Seamless prescription updates"]
    },
    {
        "id": "ref-7",
        "category": "refill",
        "categoryLabel": "Monthly Refill & Chronic Care",
        "question": "Can I set up Monthly Refills for my elderly parents in another city?",
        "answer": "Yes. You can manage and pay for your parents' monthly refills from your account while setting their address in Lahore, Karachi, or any Pakistani city for direct doorstep receipt.",
        "highlights": ["Elderly parent care", "Remote subscription management", "Inter-city care delivery"]
    },
    {
        "id": "ref-8",
        "category": "refill",
        "categoryLabel": "Monthly Refill & Chronic Care",
        "question": "Which chronic conditions are supported under Monthly Refill?",
        "answer": "Medikart Monthly Refill covers all chronic maintenance categories, including Type 1 & 2 Diabetes, Hypertension (High BP), Cardiovascular / Cholesterol Health, Thyroid Disorders, Asthma & COPD, and Arthritis.",
        "highlights": ["Diabetes & Hypertension", "Cardiac & Cholesterol", "Thyroid & Respiratory Care"]
    },
    {
        "id": "ref-9",
        "category": "refill",
        "categoryLabel": "Monthly Refill & Chronic Care",
        "question": "How is insulin delivered on a monthly refill schedule?",
        "answer": "Insulin vials and pens are packed in certified thermal insulated pouches with reusable ice gel packs calibrated to maintain 2°C–8°C from pharmacy dispatch to home handover.",
        "highlights": ["Insulated cold-chain packs", "2°C to 8°C temperature control", "Delivered safely every month"]
    },
    {
        "id": "ref-10",
        "category": "refill",
        "categoryLabel": "Monthly Refill & Chronic Care",
        "question": "Can I add non-prescription vitamins and supplements to my monthly refill?",
        "answer": "Yes. You can bundle daily multivitamins, Omega-3 fish oils, calcium supplements, and blood glucose test strips into your monthly refill package.",
        "highlights": ["Bundle daily vitamins", "Test strips & lancets", "All-in-one monthly parcel"]
    },
    {
        "id": "ref-11",
        "category": "refill",
        "categoryLabel": "Monthly Refill & Chronic Care",
        "question": "What payment methods are available for Monthly Refill?",
        "answer": "You can pay via Cash on Delivery each month upon rider arrival, or set up automated digital payments through Kuickpay.",
        "highlights": ["Cash on Delivery monthly", "Online Kuickpay billing", "Flexible payment choices"]
    },
    {
        "id": "ref-12",
        "category": "refill",
        "categoryLabel": "Monthly Refill & Chronic Care",
        "question": "How does Medikart help prevent medicine stockouts for refill patients?",
        "answer": "Medikart reserves required monthly batch stock at partner pharmacies 5 days prior to your scheduled dispatch date, ensuring chronic care patients are never impacted by local market shortages.",
        "highlights": ["Advance stock reservation", "Zero stockout disruption", "Priority batch allocation"]
    },

    # ─── CATEGORY 5: Prescription Rules & Regulatory Safety (12 Questions) ───
    {
        "id": "rx-1",
        "category": "prescriptions",
        "categoryLabel": "Prescriptions & Safety",
        "question": "Which medicines require a doctor's prescription in Pakistan?",
        "answer": "In compliance with DRAP regulations, all prescription-only medicines (POM) including antibiotics, blood pressure drugs, diabetic medications, psychiatric drugs, and cardiac agents require a valid prescription from a registered medical practitioner (PMDC / PMC licensed).",
        "highlights": ["DRAP regulatory compliance", "Antibiotics & cardiac drugs", "PMDC/PMC doctor verified"]
    },
    {
        "id": "rx-2",
        "category": "prescriptions",
        "categoryLabel": "Prescriptions & Safety",
        "question": "Can I buy over-the-counter (OTC) medicines without a prescription?",
        "answer": "Yes. Common OTC products like general pain relievers (Panadol, Disprin), antacids, cough lozenges, band-aids, multivitamins, and baby care items can be purchased online without a prescription.",
        "highlights": ["No prescription for OTC", "Vitamins & supplements", "First-aid & baby essentials"]
    },
    {
        "id": "rx-3",
        "category": "prescriptions",
        "categoryLabel": "Prescriptions & Safety",
        "question": "Does Medikart sell controlled narcotics or habit-forming substances online?",
        "answer": "Strictly NO. In compliance with the Drugs Act 1976 and the Control of Narcotics Substances Act (CNSA), Medikart does not dispense habit-forming narcotics, benzodiazepines, or restricted Schedule X substances online.",
        "highlights": ["Zero narcotics online", "Drugs Act 1976 compliance", "Patient safety first"]
    },
    {
        "id": "rx-4",
        "category": "prescriptions",
        "categoryLabel": "Prescriptions & Safety",
        "question": "How do Medikart pharmacists verify uploaded prescriptions?",
        "answer": "Qualified PharmD pharmacists inspect the doctor's name, PMDC/PMC registration number, clinic stamp, patient name, date, medication names, dosages, and duration before approving the order.",
        "highlights": ["PharmD pharmacist review", "Doctor registration check", "Dosage & safety verification"]
    },
    {
        "id": "rx-5",
        "category": "prescriptions",
        "categoryLabel": "Prescriptions & Safety",
        "question": "Is my uploaded medical prescription data kept private and confidential?",
        "answer": "Yes. Your medical prescriptions and health records are encrypted and accessible exclusively to licensed pharmacists evaluating your order in accordance with medical privacy standards.",
        "highlights": ["Encrypted medical storage", "Strict pharmacist confidentiality", "No third-party sharing"]
    },
    {
        "id": "rx-6",
        "category": "prescriptions",
        "categoryLabel": "Prescriptions & Safety",
        "question": "What should I do if my doctor's prescription is old or expired?",
        "answer": "For acute medications (like antibiotics), prescriptions must be recent (within 14–30 days). For long-term chronic maintenance medications, prescriptions up to 6 months old can be accepted upon pharmacist clinical review.",
        "highlights": ["Recent slips for acute illnesses", "6-month validity for chronic care", "Pharmacist clinical review"]
    },
    {
        "id": "rx-7",
        "category": "prescriptions",
        "categoryLabel": "Prescriptions & Safety",
        "question": "Can a pharmacist suggest generic medicine alternatives in Pakistan?",
        "answer": "Yes. If an exact brand is unavailable, our clinical pharmacist can suggest a DRAP-approved generic bioequivalent containing the exact same active salt, strength, and therapeutic quality.",
        "highlights": ["Bioequivalent generic options", "Exact same active molecule", "Cost-saving alternatives"]
    },
    {
        "id": "rx-8",
        "category": "prescriptions",
        "categoryLabel": "Prescriptions & Safety",
        "question": "Can I consult a pharmacist on Medikart regarding drug interactions?",
        "answer": "Yes. You can consult our on-duty clinical pharmacist via WhatsApp (+92 324 4489159) to ask about dosage timings, food interactions, and potential contraindications with other medications.",
        "highlights": ["Free pharmacist consultation", "Drug interaction checks", "WhatsApp +92 324 4489159"]
    },
    {
        "id": "rx-9",
        "category": "prescriptions",
        "categoryLabel": "Prescriptions & Safety",
        "question": "Are all pharmaceutical products on Medikart approved by DRAP?",
        "answer": "Yes. 100% of pharmaceutical products listed on Medikart are officially registered and approved by the Drug Regulatory Authority of Pakistan (DRAP) and sourced directly from licensed distributors.",
        "highlights": ["100% DRAP registered", "Licensed manufacturer sourcing", "Authenticity guaranteed"]
    },
    {
        "id": "rx-10",
        "category": "prescriptions",
        "categoryLabel": "Prescriptions & Safety",
        "question": "Do I need to show the original physical prescription to the rider?",
        "answer": "For standard prescription orders, your digital upload is verified prior to dispatch. For specific regulated categories, the rider may request to view the physical prescription slip upon handover.",
        "highlights": ["Digital upload verified", "Physical check if required", "Regulatory compliance"]
    },
    {
        "id": "rx-11",
        "category": "prescriptions",
        "categoryLabel": "Prescriptions & Safety",
        "question": "What happens if a prescription is unreadable or blurry?",
        "answer": "If an uploaded image is blurry or illegible, our pharmacist will contact you via phone or WhatsApp to request a clearer picture or contact your doctor's clinic for confirmation.",
        "highlights": ["Proactive pharmacist contact", "High clarity standards", "Zero dosage guesswork"]
    },
    {
        "id": "rx-12",
        "category": "prescriptions",
        "categoryLabel": "Prescriptions & Safety",
        "question": "Can I order veterinary or pet medicines on Medikart?",
        "answer": "Medikart specializes in human clinical pharmaceuticals and consumer healthcare products. Veterinary products are available under specialized OTC and hygiene care sections when in stock.",
        "highlights": ["Specialized human pharmaceuticals", "OTC hygiene products", "Clinical healthcare focus"]
    },

    # ─── CATEGORY 6: Medicine Quality, Authenticity & Storage (12 Questions) ───
    {
        "id": "qua-1",
        "category": "safety",
        "categoryLabel": "Authenticity & Quality",
        "question": "How does Medikart guarantee that all medicines are 100% authentic?",
        "answer": "Medikart sources medications exclusively from licensed pharmaceutical manufacturers (e.g. GSK, Abbott, Getz, Searle, Sanofi, Pfizer, Martin Dow) and authorized distributors with verifiable batch numbers and authentic tamper seals.",
        "highlights": ["Authorized distributor sourcing", "Verifiable batch numbers", "Intact manufacturer seals"]
    },
    {
        "id": "qua-2",
        "category": "safety",
        "categoryLabel": "Authenticity & Quality",
        "question": "How are medicines stored in partner pharmacies before delivery?",
        "answer": "All partner pharmacies maintain temperature-controlled environments (below 25°C for general medicines and 2°C–8°C for refrigerators) in full compliance with Good Pharmacy Practice (GPP) standards.",
        "highlights": ["Temperature-controlled storage", "Good Pharmacy Practice (GPP)", "24/7 climate monitoring"]
    },
    {
        "id": "qua-3",
        "category": "safety",
        "categoryLabel": "Authenticity & Quality",
        "question": "How do you ensure delivered medicines have long expiry dates?",
        "answer": "Our inventory management system enforces strict expiry auditing. No medicine with less than 6 months remaining shelf life is dispensed for standard orders unless explicitly requested and discounted.",
        "highlights": ["Minimum 6-month shelf life", "Strict expiry date audit", "Fresh manufacturer batches"]
    },
    {
        "id": "qua-4",
        "category": "safety",
        "categoryLabel": "Authenticity & Quality",
        "question": "What is cold-chain delivery and why is it essential for insulin?",
        "answer": "Cold-chain delivery maintains biologically active medications (like insulin, hormones, and vaccines) between 2°C and 8°C during transit to prevent protein denaturation and loss of therapeutic potency caused by Pakistani summer heat.",
        "highlights": ["Prevents insulin breakdown", "Crucial for summer heat", "Thermal ice pack preservation"]
    },
    {
        "id": "qua-5",
        "category": "safety",
        "categoryLabel": "Authenticity & Quality",
        "question": "Can I check the batch number and expiry date before paying the rider?",
        "answer": "Yes. You are welcome to physically inspect the external packaging, expiry date, and batch stamps before completing your Cash on Delivery payment.",
        "highlights": ["Inspect before paying", "Check batch & expiry", "100% customer confidence"]
    },
    {
        "id": "qua-6",
        "category": "safety",
        "categoryLabel": "Authenticity & Quality",
        "question": "Are imported multivitamins and baby formulas authentic on Medikart?",
        "answer": "Yes. All imported wellness products, multivitamins, and baby nutrition formulas are sourced from authorized Pakistani importers with verified customs clearance and barcode authentication.",
        "highlights": ["Authorized importer sourcing", "Barcode authenticated", "Customs cleared goods"]
    },
    {
        "id": "qua-7",
        "category": "safety",
        "categoryLabel": "Authenticity & Quality",
        "question": "How does Medikart protect medicines against heat during rider transit?",
        "answer": "Delivery riders use thermal insulated delivery bags that shield medications from direct sunlight and ambient road temperatures during intra-city transport.",
        "highlights": ["Thermal insulated rider bags", "Sunlight protection", "Climate shielding"]
    },
    {
        "id": "qua-8",
        "category": "safety",
        "categoryLabel": "Authenticity & Quality",
        "question": "What happens if a medicine manufacturer issues a product recall?",
        "answer": "If DRAP or a manufacturer issues a product batch recall, Medikart's digital tracking system immediately isolates affected batches and proactively contacts all patients who received that specific batch.",
        "highlights": ["Automated recall isolation", "Proactive patient alerts", "Full DRAP recall compliance"]
    },
    {
        "id": "qua-9",
        "category": "safety",
        "categoryLabel": "Authenticity & Quality",
        "question": "How should I store my medicines at home after delivery in Pakistan?",
        "answer": "Store general tablets and syrups in a cool, dry place below 25°C away from direct sunlight. Refrigerate insulin, opened eye drops, and specific liquid antibiotics between 2°C and 8°C (do not freeze).",
        "highlights": ["Store below 25°C", "Refrigerate insulin (do not freeze)", "Keep away from moisture"]
    },
    {
        "id": "qua-10",
        "category": "safety",
        "categoryLabel": "Authenticity & Quality",
        "question": "Are loose medicine tablets sold on Medikart?",
        "answer": "No. Medikart only dispenses medicines in intact, hygienic blister strips, sealed bottles, or original manufacturer unit boxes to ensure sterility and prevent contamination.",
        "highlights": ["Intact blister strips only", "Original manufacturer packaging", "No loose tablet dispensing"]
    },
    {
        "id": "qua-11",
        "category": "safety",
        "categoryLabel": "Authenticity & Quality",
        "question": "Can I verify the pharmaceutical license of partner pharmacies?",
        "answer": "Yes. All Medikart partner retail pharmacies hold active Category-A retail pharmacy licenses issued by the respective provincial Health Departments in Pakistan.",
        "highlights": ["Category-A licensed pharmacies", "Provincial health compliance", "Verifiable licenses"]
    },
    {
        "id": "qua-12",
        "category": "safety",
        "categoryLabel": "Authenticity & Quality",
        "question": "How does Medikart ensure infant milk formula authenticity?",
        "answer": "Baby milk formulas (Meiji, Aptamil, Nan, Similac, Morinaga) are procured directly from official brand distributors with untampered safety rims and verifiable batch codes.",
        "highlights": ["Direct distributor supply", "Untampered safety seals", "100% authentic baby nutrition"]
    },

    # ─── CATEGORY 7: Clinical Guidance, OTC & Family Healthcare (12 Questions) ───
    {
        "id": "cli-1",
        "category": "clinical",
        "categoryLabel": "Clinical Advice & Health Guides",
        "question": "What is the difference between Panadol and Brufen for fever?",
        "answer": "Panadol (Paracetamol) is an antipyretic and analgesic ideal for mild to moderate fever and pain with high stomach safety. Brufen (Ibuprofen) is an NSAID that reduces inflammation and swelling but should be taken after meals.",
        "highlights": ["Panadol: gentle on stomach", "Brufen: anti-inflammatory", "Take NSAIDs after meals"]
    },
    {
        "id": "cli-2",
        "category": "clinical",
        "categoryLabel": "Clinical Advice & Health Guides",
        "question": "When should I take Metformin for diabetes management?",
        "answer": "Metformin (e.g. Glucophage) should generally be taken with or immediately after meals to minimize gastrointestinal side effects like nausea or stomach upset, exactly as prescribed by your physician.",
        "highlights": ["Take with or after meals", "Reduces stomach upset", "Follow doctor's prescribed dose"]
    },
    {
        "id": "cli-3",
        "category": "clinical",
        "categoryLabel": "Clinical Advice & Health Guides",
        "question": "What are common home remedies for acid reflux and heartburn?",
        "answer": "Elevate your head while sleeping, avoid spicy and fried foods, drink adequate water between meals, and use doctor-recommended antacids (like Gaviscon or Omeprazole) if symptoms persist.",
        "highlights": ["Avoid spicy/fried foods", "Elevate head during sleep", "Antacids for symptom relief"]
    },
    {
        "id": "cli-4",
        "category": "clinical",
        "categoryLabel": "Clinical Advice & Health Guides",
        "question": "Can I take antibiotics without completing the full prescribed course?",
        "answer": "No. Stopping antibiotics early even after symptoms improve leads to antibiotic resistance, causing recurrent and more severe bacterial infections. Always complete the full course prescribed by your physician.",
        "highlights": ["Never stop antibiotics early", "Prevents antibiotic resistance", "Complete full prescribed days"]
    },
    {
        "id": "cli-5",
        "category": "clinical",
        "categoryLabel": "Clinical Advice & Health Guides",
        "question": "Which multivitamins are best for daily energy and immunity in Pakistan?",
        "answer": "Popular pharmacist-recommended multivitamins include Surbex-Z, Centrum, CaC-1000 Plus, and Wellman/Wellwoman, providing essential Zinc, Vitamin C, Vitamin D3, and B-Complex vitamins.",
        "highlights": ["Surbex-Z & Centrum", "Vitamin C, D3 & Zinc", "Immunity & daily vitality"]
    },
    {
        "id": "cli-6",
        "category": "clinical",
        "categoryLabel": "Clinical Advice & Health Guides",
        "question": "How should ORS (Oral Rehydration Salts) be prepared for dehydration?",
        "answer": "Mix one full sachet of WHO-standard ORS into exactly 1 liter (or 4 standard glasses) of clean boiled/filtered water. Do not mix with milk or juice, and discard any unused solution after 24 hours.",
        "highlights": ["Mix in exactly 1L clean water", "Do not mix with milk/juice", "Discard solution after 24 hours"]
    },
    {
        "id": "cli-7",
        "category": "clinical",
        "categoryLabel": "Clinical Advice & Health Guides",
        "question": "What is the recommended blood pressure range for adults?",
        "answer": "A normal resting blood pressure for healthy adults is typically below 120/80 mmHg. Consistent readings above 130/80 mmHg indicate hypertension requiring physician consultation and lifestyle management.",
        "highlights": ["Normal: below 120/80 mmHg", "Elevated: above 130/80 mmHg", "Regular monitoring advised"]
    },
    {
        "id": "cli-8",
        "category": "clinical",
        "categoryLabel": "Clinical Advice & Health Guides",
        "question": "How can I prevent seasonal pollen allergy symptoms in Islamabad and Lahore?",
        "answer": "Keep windows closed during high pollen hours (morning), use HEPA air purifiers, wear a mask outdoors, and use doctor-prescribed antihistamines (such as Cetirizine or Fexofenadine) before peak exposure.",
        "highlights": ["Wear mask outdoors", "HEPA air filtration", "Antihistamines for prevention"]
    },
    {
        "id": "cli-9",
        "category": "clinical",
        "categoryLabel": "Clinical Advice & Health Guides",
        "question": "What is the correct way to use an asthma inhaler?",
        "answer": "Shake the inhaler, exhale fully, place mouthpiece in mouth, press down while inhaling deeply and slowly for 3–5 seconds, hold your breath for 10 seconds, and rinse your mouth with water if using corticosteroid inhalers.",
        "highlights": ["Slow deep inhalation", "Hold breath for 10 seconds", "Rinse mouth after steroid inhalers"]
    },
    {
        "id": "cli-10",
        "category": "clinical",
        "categoryLabel": "Clinical Advice & Health Guides",
        "question": "How often should HbA1c be tested for diabetic patients?",
        "answer": "Diabetic patients should check their HbA1c level every 3 months if blood glucose is fluctuating, or every 6 months if glucose levels are stable and within target range (typically below 7.0%).",
        "highlights": ["Every 3 to 6 months", "Target HbA1c under 7.0%", "Essential for diabetes tracking"]
    },
    {
        "id": "cli-11",
        "category": "clinical",
        "categoryLabel": "Clinical Advice & Health Guides",
        "question": "What are the early signs of Vitamin D deficiency in adults?",
        "answer": "Common symptoms include persistent fatigue, bone and lower back pain, muscle weakness, frequent infections, and mood changes. A 25-hydroxy Vitamin D blood test confirms deficiency.",
        "highlights": ["Bone & muscle aches", "Chronic fatigue", "Blood test verification"]
    },
    {
        "id": "cli-12",
        "category": "clinical",
        "categoryLabel": "Clinical Advice & Health Guides",
        "question": "Where can I read more in-depth health guides on Medikart?",
        "answer": "Visit https://medikart.pk/blogs to explore our library of 60+ pharmacist-reviewed health articles covering pediatric growth, cardiovascular wellness, diabetes control, and medicine comparisons.",
        "highlights": ["60+ health articles", "Pharmacist reviewed content", "Evidence-based wellness guides"]
    },

    # ─── CATEGORY 8: Returns, Refunds, Support & Privacy (12 Questions) ───
    {
        "id": "ret-1",
        "category": "returns",
        "categoryLabel": "Returns & Customer Support",
        "question": "Can I cancel my order before it is dispatched?",
        "answer": "Yes. You can cancel your order free of charge at any time before partner pharmacy dispatch by messaging our WhatsApp support (+92 324 4489159) with your Order ID.",
        "highlights": ["100% free cancellation", "Cancel prior to dispatch", "Instant WhatsApp cancellation"]
    },
    {
        "id": "ret-2",
        "category": "returns",
        "categoryLabel": "Returns & Customer Support",
        "question": "What is the return policy for delivered medicines?",
        "answer": "Under DRAP and international drug safety regulations, medicines once unsealed and delivered cannot be returned. If an item arrives damaged, expired, or incorrect, notify support within 24 hours for an immediate free replacement.",
        "highlights": ["Drug safety standards", "Free replacement for damaged items", "24-hour reporting window"]
    },
    {
        "id": "ret-3",
        "category": "returns",
        "categoryLabel": "Returns & Customer Support",
        "question": "How and when are refunds processed for online payments?",
        "answer": "Eligible refunds for cancelled orders or returned non-medicine goods are initiated within 24 hours. The refunded amount reflects in your original bank account/card within 2 to 4 business days.",
        "highlights": ["Refund initiated in 24 hours", "Bank reversal in 2–4 days", "Direct credit to original card"]
    },
    {
        "id": "ret-4",
        "category": "returns",
        "categoryLabel": "Returns & Customer Support",
        "question": "How can I contact Medikart customer support?",
        "answer": "You can reach Medikart customer support 24/7 via WhatsApp (+92 324 4489159), email (medikart.com@gmail.com), or through our contact page at https://medikart.pk/contact.",
        "highlights": ["24/7 WhatsApp: +92 324 4489159", "Email: medikart.com@gmail.com", "Online contact form"]
    },
    {
        "id": "ret-5",
        "category": "returns",
        "categoryLabel": "Returns & Customer Support",
        "question": "How does Medikart protect my personal and health data?",
        "answer": "Medikart implements enterprise-grade data encryption (HTTPS/TLS) and strict access controls. Your phone number, address, and medical records are never sold or shared with external advertising networks.",
        "highlights": ["Enterprise TLS encryption", "Zero third-party data sharing", "Strict medical privacy"]
    },
    {
        "id": "ret-6",
        "category": "returns",
        "categoryLabel": "Returns & Customer Support",
        "question": "Can I request deletion of my account and personal data?",
        "answer": "Yes. You can request complete deletion of your account and personal profile by emailing medikart.com@gmail.com or messaging support on WhatsApp.",
        "highlights": ["Full data deletion on request", "GDPR-aligned privacy rights", "Simple email request"]
    },
    {
        "id": "ret-7",
        "category": "returns",
        "categoryLabel": "Returns & Customer Support",
        "question": "What company owns and operates Medikart?",
        "answer": "Medikart is owned and operated by Banu Zahrah Pvt Ltd, a registered healthcare and technology company incorporated in Pakistan.",
        "highlights": ["Banu Zahrah Pvt Ltd", "Registered Pakistani entity", "Corporate healthcare network"]
    },
    {
        "id": "ret-8",
        "category": "returns",
        "categoryLabel": "Returns & Customer Support",
        "question": "Can I return medical devices (blood pressure monitors, glucometers)?",
        "answer": "Yes. Unused medical devices in original intact packaging with manufacturer warranty cards can be returned or exchanged within 7 days of delivery if defective.",
        "highlights": ["7-day return for devices", "Manufacturer warranty included", "Original packaging required"]
    },
    {
        "id": "ret-9",
        "category": "returns",
        "categoryLabel": "Returns & Customer Support",
        "question": "How do I file a complaint regarding a delivery delay or rider behavior?",
        "answer": "You can report any service issue directly to our customer escalation team via WhatsApp (+92 324 4489159) with your Order ID for immediate manager intervention and resolution.",
        "highlights": ["Dedicated complaint escalation", "Manager intervention", "Prompt resolution"]
    },
    {
        "id": "ret-10",
        "category": "returns",
        "categoryLabel": "Returns & Customer Support",
        "question": "Are customer reviews on Medikart genuine and verified?",
        "answer": "Yes. All customer product reviews on Medikart are verified against real purchase records to ensure authentic feedback from genuine patients across Pakistan.",
        "highlights": ["Verified buyer reviews", "100% authentic patient feedback", "Transparent ratings"]
    },
    {
        "id": "ret-11",
        "category": "returns",
        "categoryLabel": "Returns & Customer Support",
        "question": "Does Medikart have physical walk-in retail branches?",
        "answer": "Medikart operates as a digital pharmacy network partnering with established licensed Category-A retail pharmacies across Lahore, Karachi, Islamabad, and Rawalpindi to fulfill and dispatch doorstep orders.",
        "highlights": ["Digital network model", "Category-A partner pharmacies", "Doorstep express fulfillment"]
    },
    {
        "id": "ret-12",
        "category": "returns",
        "categoryLabel": "Returns & Customer Support",
        "question": "How do I install the Medikart Progressive Web App (PWA) on my phone?",
        "answer": "Open https://medikart.pk in your mobile browser (Chrome or Safari), tap the browser menu (or share icon), and select 'Add to Home Screen' for an instant app experience with fast offline catalog access.",
        "highlights": ["Add to Home Screen", "Works on Android & iOS", "Fast offline catalog access"]
    }
]

print(f"[*] Total Questions in Master AEO/GEO Dataset: {len(FAQ_100_DATASET)}")

# Write updated FaqClient.jsx and page.jsx
with open(r"D:\Projects\Medikart\apps\web\app\faqs\faqData.json", "w", encoding="utf-8") as f:
    json.dump(FAQ_100_DATASET, f, indent=2, ensure_ascii=False)

print("[+] Wrote faqData.json with 100 comprehensive questions!")
