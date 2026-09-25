import React, { useState, useRef, useEffect } from "react";

/**
 * SearchableSelect - A robust, accessible dropdown with instant text search
 * Ideal for selecting from hundreds of pharmacy branches, categories, cities, or users.
 */
export default function SearchableSelect({
  options = [],
  value = "",
  onChange,
  placeholder = "Select an option...",
  searchPlaceholder = "Type to search...",
  minWidth = "220px",
  maxWidth = "360px",
  size = "md", // 'sm' | 'md'
  disabled = false,
  className = "",
  style = {},
  showClear = true,
  renderOption = null,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
      // Auto focus input when opened
      setTimeout(() => inputRef.current?.focus(), 50);
    }
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  // Find currently selected option
  const selectedOption = options.find((opt) => String(opt.value) === String(value));

  // Filter options based on search term
  const filteredOptions = options.filter((opt) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    const labelMatch = opt.label && String(opt.label).toLowerCase().includes(term);
    const sublabelMatch = opt.sublabel && String(opt.sublabel).toLowerCase().includes(term);
    const badgeMatch = opt.badge && String(opt.badge).toLowerCase().includes(term);
    const codeMatch = opt.code && String(opt.code).toLowerCase().includes(term);
    const cityMatch = opt.city && String(opt.city).toLowerCase().includes(term);
    return labelMatch || sublabelMatch || badgeMatch || codeMatch || cityMatch;
  });

  const handleSelect = (val) => {
    onChange(val);
    setIsOpen(false);
    setSearchTerm("");
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange("");
    setSearchTerm("");
  };

  const isSmall = size === "sm";

  return (
    <div
      ref={dropdownRef}
      className={`searchable-select-container ${className}`}
      style={{
        position: "relative",
        display: "inline-block",
        minWidth: minWidth,
        maxWidth: maxWidth,
        width: "100%",
        fontFamily: "inherit",
        ...style,
      }}
    >
      {/* Trigger Button */}
      <div
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "0.4rem",
          background: disabled ? "#f1f5f9" : "#ffffff",
          border: isOpen ? "1.5px solid #eab308" : "1px solid #cbd5e1",
          borderRadius: "8px",
          padding: isSmall ? "0.25rem 0.6rem" : "0.45rem 0.75rem",
          fontSize: isSmall ? "0.8rem" : "0.875rem",
          fontWeight: 600,
          color: selectedOption ? "#0f172a" : "#94a3b8",
          cursor: disabled ? "not-allowed" : "pointer",
          boxShadow: isOpen ? "0 0 0 3px rgba(234, 179, 8, 0.2)" : "0 1px 2px rgba(0,0,0,0.05)",
          transition: "all 0.15s ease",
          userSelect: "none",
        }}
        title={selectedOption?.label || placeholder}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
          {selectedOption?.icon && <span>{selectedOption.icon}</span>}
          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          {selectedOption?.badge && (
            <span
              style={{
                fontSize: "0.7rem",
                padding: "0.1rem 0.4rem",
                borderRadius: "4px",
                background: "#fef08a",
                color: "#854d0e",
                fontWeight: 700,
                flexShrink: 0,
              }}
            >
              {selectedOption.badge}
            </span>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.3rem", flexShrink: 0 }}>
          {showClear && value && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              style={{
                background: "transparent",
                border: "none",
                color: "#94a3b8",
                cursor: "pointer",
                padding: "0 0.2rem",
                fontSize: "0.9rem",
                lineHeight: 1,
                display: "flex",
                alignItems: "center",
                borderRadius: "50%",
              }}
              title="Clear selection"
            >
              ✕
            </button>
          )}
          <span style={{ fontSize: "0.65rem", color: "#64748b", transform: isOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s ease" }}>
            ▼
          </span>
        </div>
      </div>

      {/* Floating Dropdown Panel */}
      {isOpen && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            right: 0,
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: "10px",
            boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
            zIndex: 9999,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            animation: "fadeIn 0.15s ease-out",
          }}
        >
          {/* Search Input Box */}
          <div
            style={{
              padding: "0.5rem",
              background: "#f8fafc",
              borderBottom: "1px solid #e2e8f0",
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
            }}
          >
            <span style={{ fontSize: "0.85rem", color: "#64748b" }}>🔍</span>
            <input
              ref={inputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={searchPlaceholder}
              style={{
                width: "100%",
                border: "1px solid #cbd5e1",
                borderRadius: "6px",
                padding: "0.35rem 0.55rem",
                fontSize: "0.8rem",
                outline: "none",
                background: "#ffffff",
                color: "#0f172a",
              }}
              onClick={(e) => e.stopPropagation()}
            />
            {searchTerm && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setSearchTerm("");
                }}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#94a3b8",
                  cursor: "pointer",
                  fontSize: "0.8rem",
                  padding: "0 0.2rem",
                }}
              >
                ✕
              </button>
            )}
          </div>

          {/* Options List */}
          <div
            style={{
              maxHeight: "260px",
              overflowY: "auto",
              padding: "0.3rem",
            }}
          >
            {filteredOptions.length === 0 ? (
              <div
                style={{
                  padding: "1.2rem 0.75rem",
                  textAlign: "center",
                  fontSize: "0.8rem",
                  color: "#94a3b8",
                  fontStyle: "italic",
                }}
              >
                No matching results found for &quot;{searchTerm}&quot;
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = String(opt.value) === String(value);
                return (
                  <div
                    key={opt.value}
                    onClick={() => handleSelect(opt.value)}
                    style={{
                      padding: "0.45rem 0.65rem",
                      borderRadius: "6px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "0.5rem",
                      fontSize: "0.825rem",
                      fontWeight: isSelected ? 700 : 500,
                      background: isSelected ? "#fef08a" : "transparent",
                      color: isSelected ? "#854d0e" : "#1e293b",
                      transition: "background 0.12s ease",
                      marginBottom: "1px",
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) e.currentTarget.style.background = "#f1f5f9";
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) e.currentTarget.style.background = "transparent";
                    }}
                  >
                    {renderOption ? (
                      renderOption(opt, isSelected)
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.1rem", overflow: "hidden", minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                          {opt.icon && <span>{opt.icon}</span>}
                          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {opt.label}
                          </span>
                        </div>
                        {opt.sublabel && (
                          <span style={{ fontSize: "0.72rem", color: isSelected ? "#a16207" : "#64748b" }}>
                            {opt.sublabel}
                          </span>
                        )}
                      </div>
                    )}

                    <div style={{ display: "flex", alignItems: "center", gap: "0.3rem", flexShrink: 0 }}>
                      {opt.badge && (
                        <span
                          style={{
                            fontSize: "0.68rem",
                            padding: "0.1rem 0.35rem",
                            borderRadius: "4px",
                            background: isSelected ? "#fde047" : "#e2e8f0",
                            color: isSelected ? "#713f12" : "#475569",
                            fontWeight: 700,
                          }}
                        >
                          {opt.badge}
                        </span>
                      )}
                      {isSelected && <span style={{ color: "#854d0e", fontWeight: "bold" }}>✓</span>}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer count indicator */}
          <div
            style={{
              padding: "0.3rem 0.6rem",
              background: "#f8fafc",
              borderTop: "1px solid #e2e8f0",
              fontSize: "0.7rem",
              color: "#94a3b8",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span>{filteredOptions.length} of {options.length} options</span>
            {value && (
              <span
                onClick={handleClear}
                style={{ color: "#ca8a04", cursor: "pointer", fontWeight: 600 }}
              >
                Reset selection
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
