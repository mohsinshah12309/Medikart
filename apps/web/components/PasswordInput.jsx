"use client";

import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

/**
 * PasswordInput — reusable show/hide password field.
 *
 * Props:
 *   id           — forwarded to <input id> and <label htmlFor>
 *   name         — forwarded to <input name>
 *   value        — controlled value
 *   onChange     — change handler (e) => void
 *   placeholder  — input placeholder text
 *   required     — boolean, defaults false
 *   disabled     — boolean, defaults false
 *   label        — optional label text rendered above the input
 *   leadingIcon  — optional React element rendered on the left (e.g. <Lock />)
 *   inputClassName — extra Tailwind classes appended to the <input>
 *   className    — extra classes on the outermost wrapper div
 *   autoComplete — forwarded to <input autoComplete>
 *   minLength    — forwarded to <input minLength>
 */
export default function PasswordInput({
  id,
  name,
  value,
  onChange,
  placeholder = "••••••••",
  required = false,
  disabled = false,
  label,
  leadingIcon,
  inputClassName = "",
  className = "",
  autoComplete,
  minLength,
}) {
  const [showPassword, setShowPassword] = useState(false);

  const baseInput = [
    "w-full py-2.5 rounded-xl border border-slate-200",
    "bg-slate-50/50 focus:bg-white",
    "focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400",
    "text-xs text-slate-800 placeholder:text-slate-400",
    "transition-all shadow-xs group-hover:border-amber-300",
    leadingIcon ? "pl-10" : "pl-3.5",
    "pr-10", // always leave room for the eye button
    inputClassName,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={className}>
      {label && (
        <label
          htmlFor={id}
          className="block text-xs font-bold text-slate-700 mb-1.5"
        >
          {label}
        </label>
      )}

      <div className="relative group">
        <input
          id={id}
          name={name}
          type={showPassword ? "text" : "password"}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          autoComplete={autoComplete}
          minLength={minLength}
          className={baseInput}
        />

        {/* Leading icon (e.g. Lock) */}
        {leadingIcon && (
          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-hover:text-amber-500">
            {leadingIcon}
          </span>
        )}

        {/* Show / Hide toggle */}
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setShowPassword((prev) => !prev)}
          aria-label={showPassword ? "Hide password" : "Show password"}
          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
        >
          {showPassword ? (
            <EyeOff className="w-4 h-4" aria-hidden="true" />
          ) : (
            <Eye className="w-4 h-4" aria-hidden="true" />
          )}
        </button>
      </div>
    </div>
  );
}
