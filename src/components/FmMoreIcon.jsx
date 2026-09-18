import { A, Icon } from "../assets.jsx";

// The "more" affordance on Results cells (Figma FM-more-icon, FMv8.2-TUFLOW-
// Solver 4002:12403) — a vertical ellipsis that is invisible (but reserves
// its slot) in the Default state and only appears on Hover, tinted to the
// asset's #999999 grey. The 16px glyph is laid out inside a 12x16 hit area
// like the spec's inset overlay.
export function FmMoreIcon({ property1 = "Default" }) {
  const show = property1 === "Hover";
  return (
    <div style={{ width: 12, height: 16, position: "relative", flexShrink: 0, opacity: show ? 1 : 0 }}>
      <div style={{ position: "absolute", inset: "0 -2px" }}>
        <Icon src={A.ellipsisVert} size={16} style={{ filter: show ? "invert(0.6)" : undefined }} />
      </div>
    </div>
  );
}