import { useState, useRef } from "react";
import { A, Icon } from "../assets.jsx";
import { FmMoreIcon } from "./FmMoreIcon.jsx";
import { FmMaxIcon } from "./FmMaxIcon.jsx";

// "Results cell" row — the reusable Results-panel list item (Figma
// FM-results-max-cell, FMv8.2-TUFLOW-Solver 4002:12408). Implements every
// component variant — Default, Hover, Selected, Selected Max, Focus, Disabled —
// and is interactive out of the box:
//   hover  → Hover variant (light fill, darker text) + the options ellipsis
//            reveals at the far right, whether the row is Default or Selected
//   click  → toggles Selected / back to Default (blue border, matching the
//            Figma "Selected" variant — a mouse click must never show the
//            black Focus ring; see the focus-visible note below)
//   max ▸  → marks the row "Selected Max" (brand-tinted max glyph)
//   tab    → Focus variant (black focus ring) — keyboard navigation only
// `defaultSelected` starts the row in its Selected state (the design begins
// with the first View-status and first Raster row selected). Pass
// `property1` explicitly to freeze a single static variant, otherwise the
// cell drives its own state. `icon` overrides the default slot icon so each
// results group supplies its own official mono Flood glyph. Icon colour is
// driven per-state from the Figma asset fills (#999999 grey at rest, #666666
// on hover, #0A7DFF brand blue when selected/focused, #B1B1B1 when disabled).
const LONG_TEXT = "Results cell";

// filters map our black mono SVGs onto the design's exact per-state colours
const GREY = "invert(0.6)"; //                   #999999 — default
const GREY_DARK = "invert(0.4)"; //              #666666 — hover
const GREY_DISABLED = "invert(0.694)"; //        #B1B1B1 — disabled
const BRAND_BLUE = "invert(0.4) sepia(0.8) saturate(100) hue-rotate(190deg) brightness(1.5)"; // ≈#0A7DFF

export function ResultsCell({
  property1,
  showDropdown = false,
  showIcon = true,
  showMax = true,
  showMore = true,
  icon = null,
  label = LONG_TEXT,
  defaultSelected = false,
  onOpenMenu,
}) {
  const [sel, setSel] = useState(defaultSelected ? "Selected" : null); // null | "Selected" | "Selected Max"
  const [hover, setHover] = useState(false);
  const [maxHover, setMaxHover] = useState(false);
  const [focus, setFocus] = useState(false);
  // Standard focus-visible technique: a plain mouse click focuses the row
  // natively (it's a tabIndex button) but must render as Selected (blue), not
  // Focus (black ring) — the ring is reserved for keyboard navigation. A
  // mousedown fires just before the browser's focus event, so flagging it
  // here lets onFocus tell the two apart.
  const pointerFocusRef = useRef(false);

  const controlled = property1 !== undefined;
  const state = controlled ? property1 : focus ? "Focus" : hover ? sel ?? "Hover" : sel ?? "Default";

  const selected = state === "Selected" || state === "Selected Max";
  const selectedMax = state === "Selected Max";
  const disabled = state === "Disabled";

  // Light  fill only for the non-selected hover look; the ellipsis reveals on
  // hover no matter which variant the row is currently in.
  const flatHover = !controlled && !selected && !focus && hover;
  const revealMore = !controlled && showMore && hover;

  const textColor = selected || state === "Focus"
    ? "var(--text-primary-selected)"
    : disabled
      ? "var(--text-tertiary)"
      : state === "Hover"
        ? "var(--text-primary)"
        : "var(--text-secondary)";

  const rowStyle = {
    height: 24, boxSizing: "border-box", flexShrink: 0, width: "100%",
    display: "flex", alignItems: "center", gap: 4,
    padding: "0 2px 0 4px",
    borderRadius: selected || state === "Focus" ? 4 : 2,
    background: !disabled && (selected || state === "Focus" || flatHover) ? "var(--surface-3)" : "transparent",
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
            filter: disabled
              ? GREY_DISABLED
              : selected || state === "Focus"
                ? BRAND_BLUE
                : hover && !controlled
                  ? GREY_DARK
                  : GREY,
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
            if (!controlled && !disabled) {
              e.stopPropagation();
              setSel(sel === "Selected Max" ? "Selected" : "Selected Max");
            }
          }}
          onMouseEnter={() => setMaxHover(true)}
          onMouseLeave={() => setMaxHover(false)}
        />
      )}
      <FmMoreIcon property1={revealMore ? "Hover" : "Default"} onClick={onOpenMenu ? (e) => onOpenMenu(e) : undefined} />
    </div>
  );

  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      onClick={toggleSelect}
      onContextMenu={onOpenMenu && !disabled ? (e) => { e.preventDefault(); onOpenMenu(e); } : undefined}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onMouseDown={() => { pointerFocusRef.current = true; }}
      onFocus={() => {
        if (!pointerFocusRef.current) setFocus(true);
        pointerFocusRef.current = false;
      }}
      onBlur={() => setFocus(false)}
      style={rowStyle}
    >
      {content}
    </div>
  );
}