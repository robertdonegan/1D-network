import { A, Icon } from "../assets.jsx";

// Max/expand toggle on Results cells (Figma FM-max-icon, FMv8.2-TUFLOW-Solver
// 4002:12455), using the official arrows/display-max Flood glyph and the
// component's exact per-state fills: Default #C8C8C8, Hover #666666, Select
// plain black (used by the cell's "Selected Max" state).
export function FmMaxIcon({ property1 = "Default", onClick, onMouseEnter, onMouseLeave }) {
  const filter =
    property1 === "Hover"
      ? "invert(0.4)"
      : property1 === "Select"
        ? undefined
        : "invert(0.784)";
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