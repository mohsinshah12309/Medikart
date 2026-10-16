"use client";

import React, { useRef, useState, useEffect } from "react";
import { Upload, Camera, FileText, CheckCircle2, Trash2, AlertCircle } from "lucide-react";

/**
 * Reusable Prescription Upload Card for Cart and Checkout pages.
 * Supports multiple files (up to 5), camera capture, file previews,
 * patient name, notes for pharmacist, and compliance confirmation checkbox.
 */
export default function PrescriptionUploadCard({
  isRequired = false,
  files = [],
  setFiles,
  patientName = "",
  setPatientName,
  notes = "",
  setNotes,
  isConfirmed = false,
  setIsConfirmed,
  errorMsg = "",
  setErrorMsg,
}) {
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const [previews, setPreviews] = useState([]);

  // Generate previews when files change
  useEffect(() => {
    if (!files || files.length === 0) {
      setPreviews([]);
      return;
    }

    const newPreviews = files.map((file) => {
      if (typeof file === "string") {
        return { name: "Prescription", url: file, isPdf: file.toLowerCase().includes(".pdf") };
      }
      const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
      const url = isPdf ? null : URL.createObjectURL(file);
      return { name: file.name, size: file.size, url, isPdf, fileRef: file };
    });

    setPreviews(newPreviews);

    return () => {
      newPreviews.forEach((p) => {
        if (p.url && !p.url.startsWith("http") && !p.url.startsWith("/")) {
          URL.revokeObjectURL(p.url);
        }
      });
    };
  }, [files]);

  const handleFilesAdded = (incomingList) => {
    if (!incomingList || incomingList.length === 0) return;

    const allowedMime = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "application/pdf",
    ];
    const allowedExts = [".jpg", ".jpeg", ".png", ".webp", ".pdf"];
    const maxFiles = 5;
    const maxSizeBytes = 10 * 1024 * 1024; // 10MB per file

    const validNewFiles = [];

    for (let i = 0; i < incomingList.length; i++) {
      const file = incomingList[i];
      const ext = "." + (file.name.split(".").pop() || "").toLowerCase();

      if (!allowedMime.includes(file.type) && !allowedExts.includes(ext)) {
        if (setErrorMsg) setErrorMsg("⚠️ Only JPG, PNG, WebP images and PDF documents are allowed.");
        return;
      }

      if (file.size > maxSizeBytes) {
        if (setErrorMsg) setErrorMsg(`⚠️ "${file.name}" exceeds the 10MB file size limit.`);
        return;
      }

      validNewFiles.push(file);
    }

    if (files.length + validNewFiles.length > maxFiles) {
      if (setErrorMsg) setErrorMsg(`⚠️ You can upload a maximum of ${maxFiles} prescription files per order.`);
      return;
    }

    if (setErrorMsg) setErrorMsg("");
    setFiles((prev) => [...prev, ...validNewFiles]);
  };

  const removeFile = (indexToRemove) => {
    setFiles((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  return (
    <div className={`rounded-3xl p-5 sm:p-6 shadow-sm border-2 transition-all ${
      isRequired
        ? "bg-amber-50/80 border-amber-300"
        : "bg-slate-50/80 border-slate-200"
    }`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-200/80 pb-3">
        <div className="flex items-center gap-2.5">
          <span className="w-8 h-8 rounded-full bg-amber-500 text-white text-sm font-black flex items-center justify-center shadow-xs">
            📋
          </span>
          <div>
            <h3 className="text-sm sm:text-base font-black text-slate-900 flex items-center gap-2">
              <span>Have a prescription? Upload it here</span>
              {isRequired ? (
                <span className="bg-red-500 text-white text-[10px] uppercase font-black px-2 py-0.5 rounded-full">
                  Required
                </span>
              ) : (
                <span className="bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  Optional
                </span>
              )}
            </h3>
            <p className="text-xs text-slate-600 mt-0.5">
              {isRequired
                ? "Mandatory for controlled prescription items in your cart. Licensed pharmacist will verify before dispatch."
                : "Want our pharmacist to review and add prescribed medicines to this order? Attach it here."}
            </p>
          </div>
        </div>

        {files.length > 0 && (
          <span className="bg-green-100 border border-green-300 text-green-800 text-xs px-2.5 py-1 rounded-full font-bold flex items-center gap-1 self-start sm:self-auto">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{files.length} {files.length === 1 ? "file" : "files"} attached</span>
          </span>
        )}
      </div>

      {/* Hidden File Inputs */}
      <input
        type="file"
        ref={fileInputRef}
        multiple
        accept=".pdf,.png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp,application/pdf"
        onChange={(e) => {
          handleFilesAdded(e.target.files);
          e.target.value = "";
        }}
        className="hidden"
      />
      <input
        type="file"
        ref={cameraInputRef}
        accept="image/*"
        capture="environment"
        onChange={(e) => {
          handleFilesAdded(e.target.files);
          e.target.value = "";
        }}
        className="hidden"
      />

      {/* Upload Action Buttons */}
      <div className="mt-4 flex flex-wrap gap-2.5">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={files.length >= 5}
          className="px-4 py-2.5 bg-white hover:bg-slate-50 border-2 border-dashed border-amber-400 hover:border-amber-500 text-slate-900 rounded-xl text-xs font-black flex items-center gap-2 transition-all shadow-2xs cursor-pointer disabled:opacity-50"
        >
          <Upload className="w-4 h-4 text-amber-600" />
          <span>Choose Files (PDF, JPG, PNG, WebP)</span>
        </button>

        <button
          type="button"
          onClick={() => cameraInputRef.current?.click()}
          disabled={files.length >= 5}
          className="px-4 py-2.5 bg-amber-100 hover:bg-amber-200 border border-amber-300 text-amber-950 rounded-xl text-xs font-black flex items-center gap-2 transition-all shadow-2xs cursor-pointer disabled:opacity-50"
        >
          <Camera className="w-4 h-4 text-amber-700" />
          <span>Take Photo (Camera)</span>
        </button>
      </div>

      {/* Thumbnail Previews List */}
      {previews.length > 0 && (
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {previews.map((item, idx) => (
            <div
              key={idx}
              className="bg-white border-2 border-amber-200 rounded-2xl p-2.5 flex flex-col items-center justify-between relative group shadow-2xs"
            >
              <button
                type="button"
                onClick={() => removeFile(idx)}
                className="absolute -top-1.5 -right-1.5 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-xs shadow-xs transition-transform hover:scale-110 cursor-pointer"
                title="Remove file"
                aria-label="Remove file"
              >
                ✕
              </button>

              <div className="w-full aspect-square rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center overflow-hidden mb-2">
                {item.isPdf ? (
                  <div className="flex flex-col items-center justify-center text-red-600 gap-1">
                    <FileText className="w-8 h-8" />
                    <span className="text-[10px] font-black uppercase">PDF</span>
                  </div>
                ) : (
                  <img
                    src={item.url}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>

              <span className="text-[10px] font-bold text-slate-800 truncate w-full text-center">
                {item.name}
              </span>
              {item.size && (
                <span className="text-[9px] text-slate-400 font-medium">
                  {(item.size / 1024).toFixed(0)} KB
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Metadata Fields (Patient Name, Notes & Checkbox) */}
      {(isRequired || files.length > 0) && (
        <div className="mt-4 pt-4 border-t border-amber-200/80 space-y-3.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-1">
                Patient Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                placeholder="e.g. Muhammad Ali"
                required={isRequired}
                className="w-full border border-slate-300 bg-white text-slate-900 rounded-xl px-3.5 py-2 text-xs focus:ring-2 focus:ring-yellow-400 focus:border-yellow-500 outline-none transition-all font-medium"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-1">
                Special Note for Pharmacist (Optional)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Please call before dispatch or verify 30-day course"
                className="w-full border border-slate-300 bg-white text-slate-900 rounded-xl px-3.5 py-2 text-xs focus:ring-2 focus:ring-yellow-400 focus:border-yellow-500 outline-none transition-all font-medium"
              />
            </div>
          </div>

          {/* Compliance Confirmation Checkbox */}
          <label className="flex items-start gap-2.5 cursor-pointer bg-white/90 border border-amber-300 p-3 rounded-xl shadow-2xs">
            <input
              type="checkbox"
              checked={isConfirmed}
              onChange={(e) => setIsConfirmed(e.target.checked)}
              required={isRequired}
              className="mt-0.5 w-4 h-4 rounded border-slate-300 text-yellow-500 focus:ring-yellow-400 cursor-pointer"
            />
            <span className="text-xs text-slate-800 leading-snug font-medium">
              I confirm this is an authentic, valid prescription issued by a registered medical practitioner for the patient named above.
            </span>
          </label>
        </div>
      )}

      {errorMsg && (
        <div className="mt-3 bg-red-50 border border-red-200 text-red-700 p-2.5 rounded-xl text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}
    </div>
  );
}
