import { A, Icon } from "../assets.jsx";
import { FmMoreIcon } from "./FmMoreIcon.jsx";
import { FmMaxIcon } from "./FmMaxIcon.jsx";

// "Results cell" row — the reusable Results-panel list item (Figma
// FM-results-max-cell, FMv8.2-TUFLOW-Solver 4002:12408). Implements every
// component variant: Default, Hover, Selected, Selected Max, Focus and
// Disabled. The default slot icon can be overridden via `icon` (the results
// group supplies its own Flood icon, e.g. files-raster / fm2d-z-line-polyline).
// Structure per variant:
//   [dropdown?] [16px icon] [label — flex-1] [max/expand?] [more — reserved]
// The "more" affordance renders invisible but keeps the row's trailing width
// balance, exactly like the spec's opacity-0 ellipsis.

const LONG_TEXT = "Results cell";

const isSelectedLike = (p) => p === "Selected" || p === "Selected Max" || p === "Focus";

export function ResultsCell({
  property1 = "Default",
  showDropdown = false,
  showIcon = true,
  showMax = true,
  showMore = true,
  icon = null,
  label = LONG_TEXT,
}) {
  const isButton = property1 === "Hover" || property1 === "Selected" || property1 === "Selected Max";
  const selected = isSelectedLike(property1);
  const disabled = property1 === "Disabled";
  const focus = property1 === "Focus";

  const textStyle = {
    flex: "1 0 0", minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
    fontSize: 12, lineHeight: "normal", textAlign: "left",
    fontWeight: selected ? 500 : 400,
    color: selected
      ? "var(--text-primary-selected)"
      : property1 === "Hover"
        ? "var(--text-primary)"
        : disabled
          ? "var(--text-tertiary)"
          : "var(--text-secondary)",
  };

  const rowStyle = {
    width: "100%", flexShrink: 0,
    display: "flex",
    alignItems: property1 === "Default" ? "flex-start" : "center",
    padding: "4px 2px 4px 4px",
    borderRadius: selected ? 4 : 2,
    background: property1 === "Hover" || selected ? "var(--surface-3)" : "transparent",
    border: selected
      ? `2px solid ${focus ? "var(--text-primary-selected)" : "var(--surface-brand)"}`
      : "2px solid transparent",
    cursor: isButton ? "pointer" : undefined,
  };

  const content = (
    <div style={{ flex: "1 0 0", display: "flex", alignItems: "center", gap: 4, minWidth: 0 }}>
      {showDropdown && (
        <div role="button" tabIndex={0} onClick={() => {}} style={{ cursor: "pointer", flexShrink: 0 }}>
          <Icon src={A.keyDown} size={12} />
        </div>
      )}
      {showIcon && <Icon src={icon} size={16} style={{ opacity: disabled ? 0.7 : 1 }} />}
      <span style={textStyle}>{label}</span>
      {property1 !== "Disabled" && showMax && (
        <FmMaxIcon property1={property1 === "Selected Max" ? "Select" : "Default"} />
      )}
      {showMore && <FmMoreIcon />}
    </div>
  );

  if (isButton) {
    return <button type="button" style={rowStyle}>{content}</button>;
  }
  return <div style={rowStyle}>{content}</div>;
}