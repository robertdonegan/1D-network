import { A, Icon } from "../assets.jsx";

// Max/expand toggle on Results cells (Figma FM-max-icon, FMv8.2-TUFLOW-Solver
// 4002:12455). Default = plain expand glyph; Hover = interactive button with a
// darkened glyph; Select = brand-tinted, used by the cell's "Selected Max"
// state.
export function FmMaxIcon({ property1 = "Default" }) {
  const filter =
    property1 === "Select"
      ? "brightness(0) saturate(100%) sepia(1) saturate(6) hue-rotate(195deg)"
      : property1 === "Hover"
        ? "brightness(0.7)"
        : undefined;
  const glyph = <Icon src={A.expand} size={16} style={{ filter, cursor: "pointer" }} />;
  if (property1 === "Hover") {
    return (
      <button type="button" style={{ width: 16, height: 16, padding: 0, border: "none", background: "transparent", cursor: "pointer", flexShrink: 0 }}>
        {glyph}
      </button>
    );
  }
  return glyph;
}