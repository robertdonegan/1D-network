import { useState } from "react";
import { A, Icon } from "../assets.jsx";
import { FmMoreIcon } from "./FmMoreIcon.jsx";
import { FmMaxIcon } from "./FmMaxIcon.jsx";

// "Results cell" row — the reusable Results-panel list item (Figma
// FM-results-max-cell, FMv8.2-TUFLOW-Solver 4002:12408). Implements every
// component variant — Default, Hover, Selected, Selected Max, Focus, Disabled —
// and is interactive out of the box:
//   hover  → Hover variant (light fill, darker text, ellipsis appears)
//   click  → toggles Selected / back to Default
//   max ▸  → marks the row "Selected Max" (brand-tinted max glyph)
//   tab    → Focus variant (black focus ring)
// Pass `property1` explicitly to freeze a single static variant (used by
// callers that want to control state, e.g. a preselected row), otherwise the
// cell drives its own state. `icon` overrides the default slot icon so each
// results group supplies its own official Flood glyph.
const LONG_TEXT = "Results cell";

const BRAND_FILTER = "brightness(0) saturate(100%) sepia(1) saturate(6) hue-rotate(195deg)";

export function ResultsCell({
  property1,
  showDropdown = false,
  showIcon = true,
  showMax = true,
  showMore = true,
  icon = null,
  label = LONG_TEXT,
}) {
  const [sel, setSel] = useState(null); // null | "Selected" | "Selected Max"
  const [hover, setHover] = useState(false);
  const [maxHover, setMaxHover] = useState(false);
  const [focus, setFocus] = useState(false);

  const controlled = property1 !== undefined;
  const state = controlled ? property1 : focus ? "Focus" : hover ? sel ?? "Hover" : sel ?? "Default";

  const selected = state === "Selected" || state === "Selected Max";
  const selectedMax = state === "Selected Max";
  const disabled = state === "Disabled";
  const hovered = !controlled && !selected && !focus && hover;

  const textColor = selected || state === "Focus"
    ? "var(--text-primary-selected)"
    : disabled
      ? "var(--text-tertiary)"
      : hover || state === "Hover"
        ? "var(--text-primary)"
        : "var(--text-secondary)";

  const rowStyle = {
    height: 24, boxSizing: "border-box", flexShrink: 0, width: "100%",
    display: "flex", alignItems: "center", gap: 4,
    padding: "0 2px 0 4px",
    borderRadius: selected || state === "Focus" ? 4 : 2,
    background: !disabled && (selected || state === "Focus" || hovered) ? "var(--surface-3)" : "transparent",
    border: `2px solid ${
      state === "Focus"
        ? "var(--text-primary-selected)"
        : selected
          ? "var(--surface-brand)"
          : "transparent"
    }`,
    cursor: disabled ? "default" : "pointer",
    outline: "none",
  };

  const toggleSelect = (e) => {
    if (controlled || disabled) return;
    e.stopPropagation();
    setSel(sel === "Selected" || sel === "Selected Max" ? null : "Selected");
  };

  const content = (
    <div style={{ flex: "1 0 0", display: "flex", alignItems: "center", gap: 4, minWidth: 0 }}>
      {showDropdown && (
        <span role="button" tabIndex={0} title="Options" style={{ cursor: "pointer", flexShrink: 0, display: "flex" }}>
          <Icon src={A.keyDown} size={12} />
        </span>
      )}
      {showIcon && (
        <Icon
          src={icon}
          size={16}
          style={{
            opacity: disabled ? 0.6 : 0.9,
            filter: selected || state === "Focus" ? BRAND_FILTER : undefined,
          }}
        />
      )}
      <span style={{
        flex: "1 0 0", minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        fontSize: 12, lineHeight: "normal", textAlign: "left",
        fontWeight: selected || state === "Focus" ? 500 : 400,
        color: textColor,
      }}>
        {label}
      </span>
      {!disabled && showMax && (
        <FmMaxIcon
          property1={selectedMax ? "Select" : maxHover ? "Hover" : "Default"}
          onClick={(e) => {
            if (controlled || disabled) return;
            e.stopPropagation();
            setSel("Selected Max");
          }}
          onMouseEnter={() => setMaxHover(true)}
          onMouseLeave={() => setMaxHover(false)}
        />
      )}
      {showMore && <FmMoreIcon property1={hovered ? "Hover" : "Default"} />}
    </div>
  );

  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      onClick={toggleSelect}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onFocus={() => setFocus(true)}
      onBlur={() => setFocus(false)}
      style={rowStyle}
    >
      {content}
    </div>
  );
}