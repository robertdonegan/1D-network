import { A, Icon } from "../assets.jsx";

// Max/expand toggle on Results cells (Figma FM-max-icon, FMv8.2-TUFLOW-Solver
// 4002:12455), using the official arrows/display-max Flood glyph.
// Default = plain glyph (clickable); Hover = darkened glyph; Select = brand-
// tinted, used by the cell's "Selected Max" state.
export function FmMaxIcon({ property1 = "Default", onClick, onMouseEnter, onMouseLeave }) {
  const filter =
    property1 === "Select"
      ? "brightness(0) saturate(100%) sepia(1) saturate(6) hue-rotate(195deg)"
      : property1 === "Hover"
        ? "brightness(0.45)"
        : undefined;
  return (
    <button
      type="button"
      tabIndex={-1}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      title="Max"
      style={{ width: 16, height: 16, padding: 0, border: "none", background: "transparent", cursor: onClick ? "pointer" : "default", flexShrink: 0 }}
    >
      <Icon src={A.displayMax} size={16} style={{ filter, cursor: onClick ? "pointer" : "default" }} />
    </button>
  );
}