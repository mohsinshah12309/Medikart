import React, { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";

/**
 * SearchableSelect - A robust, accessible dropdown with instant text search
 * Features portal-based floating display so it is never clipped by table overflow or cards.
 */
export default function SearchableSelect({
  options = [],
  value = "",
  onChange,
  placeholder = "Select an option...",
  searchPlaceholder = "Type to search...",
  minWidth = "220px",
  maxWidth = "360px",
  dropdownMinWidth = "380px",
  dropdownMaxWidth = "520px",
  size = "md", // 'sm' | 'md'
  disabled = false,
  className = "",
  style = {},
  showClear = true,
  renderOption = null,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 380, placement: "bottom" });

  const dropdownRef = useRef(null);
  const panelRef = useRef(null);
  const inputRef = useRef(null);

  // Recalculate portal popup position relative to viewport
  const updatePosition = useCallback(() => {
    if (!dropdownRef.current) return;
    const rect = dropdownRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const estimatedHeight = 340;
    const openUpward = spaceBelow < estimatedHeight && rect.top > estimatedHeight;

    const minW = parseInt(dropdownMinWidth, 10) || 380;
    const maxW = parseInt(dropdownMaxWidth, 10) || 520;
    let computedWidth = Math.max(rect.width, minW);
    if (computedWidth > maxW) computedWidth = maxW;

    let left = rect.left;
    if (left + computedWidth > window.innerWidth - 12) {
      left = Math.max(12, window.innerWidth - computedWidth - 12);
    }

    setCoords({
      top: openUpward ? rect.top - 6 : rect.bottom + 6,
      left: Math.max(12, left),
      width: computedWidth,
      placement: openUpward ? "top" : "bottom",
    });
  }, [dropdownMinWidth, dropdownMaxWidth]);

  // Handle outside click across trigger & portal panel
  useEffect(() => {
    const handleOutsideClick = (e) => {
      const isInsideTrigger = dropdownRef.current && dropdownRef.current.contains(e.target);
      const isInsidePanel = panelRef.current && panelRef.current.contains(e.target);
      if (!isInsideTrigger && !isInsidePanel) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      updatePosition();
      document.addEventListener("mousedown", handleOutsideClick);
      window.addEventListener("scroll", updatePosition, true);
      window.addEventListener("resize", updatePosition);

      // Focus input when opened
      const timer = setTimeout(() => inputRef.current?.focus(), 50);
      return () => {
        clearTimeout(timer);
        document.removeEventListener("mousedown", handleOutsideClick);
        window.removeEventListener("scroll", updatePosition, true);
        window.removeEventListener("resize", updatePosition);
      };
    }
  }, [isOpen, updatePosition]);

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
          padding: isSmall ? "0.3rem 0.65rem" : "0.45rem 0.75rem",
          fontSize: isSmall ? "0.82rem" : "0.875rem",
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

      {/* Portal Floating Dropdown Panel */}
      {isOpen && typeof document !== "undefined" && createPortal(
        <div
          ref={panelRef}
          style={{
            position: "fixed",
            top: coords.placement === "top" ? "auto" : `${coords.top}px`,
            bottom: coords.placement === "top" ? `${window.innerHeight - coords.top}px` : "auto",
            left: `${coords.left}px`,
            width: `${coords.width}px`,
            minWidth: dropdownMinWidth || "380px",
            maxWidth: dropdownMaxWidth || "520px",
            background: "#ffffff",
            border: "1px solid #cbd5e1",
            borderRadius: "10px",
            boxShadow: "0 20px 40px -5px rgba(0, 0, 0, 0.25), 0 10px 15px -3px rgba(0, 0, 0, 0.12)",
            zIndex: 9999999,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            animation: "fadeIn 0.12s ease-out",
          }}
        >
          {/* Search Input Box */}
          <div
            style={{
              padding: "0.55rem 0.65rem",
              background: "#f8fafc",
              borderBottom: "1px solid #e2e8f0",
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
            }}
          >
            <span style={{ fontSize: "0.9rem", color: "#64748b" }}>🔍</span>
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
                padding: "0.45rem 0.65rem",
                fontSize: "0.825rem",
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
                  fontSize: "0.85rem",
                  padding: "0 0.25rem",
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
              padding: "0.35rem",
            }}
          >
            {filteredOptions.length === 0 ? (
              <div
                style={{
                  padding: "1.2rem 0.75rem",
                  textAlign: "center",
                  fontSize: "0.825rem",
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
                      padding: "0.55rem 0.75rem",
                      borderRadius: "7px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "0.75rem",
                      fontSize: "0.85rem",
                      fontWeight: isSelected ? 700 : 500,
                      background: isSelected ? "#fef08a" : "transparent",
                      color: isSelected ? "#854d0e" : "#1e293b",
                      transition: "background 0.12s ease",
                      marginBottom: "2px",
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
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem", overflow: "hidden", minWidth: 0, flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                          {opt.icon && <span style={{ flexShrink: 0 }}>{opt.icon}</span>}
                          <span style={{ fontWeight: isSelected ? 700 : 600, color: isSelected ? "#854d0e" : "#0f172a", whiteSpace: "nowrap" }}>
                            {opt.label}
                          </span>
                        </div>
                        {opt.sublabel && (
                          <span style={{ fontSize: "0.74rem", color: isSelected ? "#a16207" : "#64748b", whiteSpace: "normal", lineHeight: 1.35 }}>
                            {opt.sublabel}
                          </span>
                        )}
                      </div>
                    )}

                    <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", flexShrink: 0 }}>
                      {opt.badge && (
                        <span
                          style={{
                            fontSize: "0.7rem",
                            padding: "0.12rem 0.45rem",
                            borderRadius: "4px",
                            background: isSelected ? "#fde047" : "#e2e8f0",
                            color: isSelected ? "#713f12" : "#334155",
                            fontWeight: 700,
                          }}
                        >
                          {opt.badge}
                        </span>
                      )}
                      {isSelected && <span style={{ color: "#854d0e", fontWeight: "bold", fontSize: "0.9rem" }}>✓</span>}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer count indicator */}
          <div
            style={{
              padding: "0.35rem 0.65rem",
              background: "#f8fafc",
              borderTop: "1px solid #e2e8f0",
              fontSize: "0.72rem",
              color: "#64748b",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span>{filteredOptions.length} of {options.length} options</span>
            {value && (
              <span
                onClick={handleClear}
                style={{ color: "#ca8a04", cursor: "pointer", fontWeight: 700 }}
              >
                Reset selection
              </span>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
