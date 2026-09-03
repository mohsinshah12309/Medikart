"use client";

import React from "react";

export default function CardFlip3D({
  cardNumber = "",
  cardHolder = "",
  cardExpiry = "",
  cardCvv = "",
  isFlipped = false,
  onFlipToggle,
}) {
  // Format card number to groups of 4: "•••• •••• •••• ••••"
  const formattedNumber = () => {
    const clean = cardNumber.replace(/\s+/g, "");
    let res = "";
    for (let i = 0; i < 16; i++) {
      if (i > 0 && i % 4 === 0) res += " ";
      res += clean[i] || "•";
    }
    return res;
  };

  return (
    <div className="w-full flex flex-col items-center gap-3 my-2">
      {/* 3D Perspective Container */}
      <div
        className="w-full max-w-[320px] sm:max-w-[350px] h-[195px] sm:h-[210px]"
        style={{ perspective: "1000px" }}
      >
        {/* Flippable Card Inner */}
        <div
          className="relative w-full h-full rounded-2xl shadow-xl transition-transform duration-500 ease-out cursor-pointer select-none"
          style={{
            transformStyle: "preserve-3d",
            transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
          }}
          onClick={onFlipToggle}
          title="Click to flip card"
        >
          {/* Card Front Face */}
          <div
            className="absolute inset-0 w-full h-full rounded-2xl p-5 flex flex-col justify-between overflow-hidden border border-yellow-400/80 shadow-md bg-gradient-to-tr from-amber-500 via-yellow-400 to-yellow-300 text-slate-950"
            style={{
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
            }}
          >
            {/* Gloss reflection overlay */}
            <div className="absolute top-0 right-0 -mr-10 -mt-10 w-44 h-44 rounded-full bg-white/30 blur-xl pointer-events-none" />

            {/* Top row: Chip + Brand */}
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-3">
                {/* Golden EMV Chip */}
                <div className="w-10 h-7 rounded-md bg-gradient-to-br from-amber-200 via-amber-400 to-amber-600 border border-amber-500/80 shadow-inner flex items-center justify-center">
                  <div className="w-6 h-4 border border-amber-700/50 rounded-xs opacity-60" />
                </div>
                {/* Contactless wave icon */}
                <svg className="w-5 h-5 text-slate-900/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8.5 16.5a5 5 0 010-9M12 19a8.5 8.5 0 000-14m3.5 17a12 12 0 000-20" />
                </svg>
              </div>

              <div className="text-right">
                <span className="text-[11px] font-black tracking-widest uppercase text-slate-900 block leading-tight">Medikart</span>
                <span className="text-[8px] font-bold tracking-widest text-slate-800 uppercase">Debit / Credit</span>
              </div>
            </div>

            {/* Middle row: Card Number */}
            <div className="relative z-10 my-auto">
              <span className="font-mono font-bold tracking-[0.18em] sm:tracking-[0.22em] text-base sm:text-lg text-slate-950 drop-shadow-xs block">
                {formattedNumber()}
              </span>
            </div>

            {/* Bottom row: Holder name & Expiry */}
            <div className="flex items-end justify-between relative z-10">
              <div className="max-w-[190px]">
                <span className="text-[9px] font-extrabold uppercase text-slate-800 tracking-wider block">Card Holder</span>
                <span className="font-bold text-xs uppercase truncate text-slate-950 block tracking-wide">
                  {cardHolder || "YOUR NAME"}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[9px] font-extrabold uppercase text-slate-800 tracking-wider block">Expires</span>
                <span className="font-mono font-bold text-xs text-slate-950 block">
                  {cardExpiry || "MM/YY"}
                </span>
              </div>
            </div>
          </div>

          {/* Card Back Face */}
          <div
            className="absolute inset-0 w-full h-full rounded-2xl overflow-hidden border border-slate-300 shadow-md bg-gradient-to-tr from-slate-800 via-slate-700 to-slate-900 text-white flex flex-col justify-between py-4"
            style={{
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
            }}
          >
            {/* Magnetic Stripe */}
            <div className="w-full h-9 bg-slate-950 shadow-inner mt-1" />

            {/* Signature + CVV box */}
            <div className="px-5 flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="text-[8px] uppercase tracking-wider text-slate-300 font-semibold">Authorized Signature</span>
                <span className="text-[8px] uppercase tracking-wider text-yellow-400 font-bold">Security Code (CVV)</span>
              </div>
              <div className="w-full bg-white h-7 rounded-sm flex items-center justify-end px-3">
                <span className="font-mono text-xs font-black text-slate-900 tracking-widest">
                  {cardCvv || "•••"}
                </span>
              </div>
            </div>

            {/* Disclaimer */}
            <div className="px-5 text-[8px] text-slate-400 leading-tight">
              Secured sandbox card authorization. Not a real bank charge. Medikart 3D payment gateway.
            </div>
          </div>
        </div>
      </div>

      {/* Manual Touch Flip Button for mobile accessibility */}
      <button
        type="button"
        onClick={onFlipToggle}
        className="text-[11px] font-bold text-slate-600 hover:text-yellow-600 flex items-center gap-1.5 py-1 px-3 rounded-lg hover:bg-yellow-50 transition-colors cursor-pointer"
      >
        <span>🔄</span> {isFlipped ? "Flip to Card Front" : "Flip to Card Back (CVV)"}
      </button>
    </div>
  );
}