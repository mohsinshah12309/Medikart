import React, { useState } from "react";

/**
 * PasswordInput — reusable show/hide password field for the Admin Panel (React/Vite).
 *
 * Props:
 *   id           — forwarded to <input id> and <label htmlFor>
 *   name         — forwarded to <input name>
 *   value        — controlled value
 *   onChange     — change handler (e) => void
 *   placeholder  — input placeholder text
 *   required     — boolean, defaults false
 *   disabled     — boolean, defaults false
 *   label        — optional label text rendered above the input (as a <label> element)
 *   autoComplete — forwarded to <input autoComplete>
 *   minLength    — forwarded to <input minLength>
 *   style        — optional inline style object forwarded to the wrapper div
 */
function PasswordInput({
  id,
  name,
  value,
  onChange,
  placeholder = "••••••••",
  required = false,
  disabled = false,
  label,
  autoComplete,
  minLength,
  style,
}) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="form-group" style={style}>
      {label && (
        <label htmlFor={id}>{label}</label>
      )}

      <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
        <input
          id={id}
          name={name}
          type={showPassword ? "text" : "password"}
          className="form-control"
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          required={required}
          disabled={disabled}
          autoComplete={autoComplete}
          minLength={minLength}
          style={{ paddingRight: "2.5rem" }}
        />

        {/* Show / Hide toggle */}
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setShowPassword((prev) => !prev)}
          aria-label={showPassword ? "Hide password" : "Show password"}
          style={{
            position: "absolute",
            right: "0.625rem",
            background: "none",
            border: "none",
            padding: "0.25rem",
            cursor: "pointer",
            color: "#94a3b8",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            lineHeight: 1,
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#475569")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#94a3b8")}
        >
          {showPassword ? (
            /* Eye-slash SVG — hide */
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
              <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
              <line x1="1" y1="1" x2="23" y2="23" />
            </svg>
          ) : (
            /* Eye SVG — show */
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}

export default PasswordInput;
