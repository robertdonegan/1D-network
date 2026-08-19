import { useState } from "react";
import { A, Icon } from "../assets.jsx";

// The actual field set/labels here are a stand-in for whatever the real
// Figma "Create layer" form (FMv8.0-GIS-Edit-Tools, node 2078-151995)
// turns out to specify in full — kept deliberately small (name + colour)
// since those are the only two things the rest of the pipeline (the
// Layers tab's LayerRow, canvas polygon styling) actually needs today.
// Swap the body out once the real design is supplied; the onCreate
// contract (name, color) => void can stay the same. Reachable from both
// the Layer menu's "Create layer..." (OSWindow.jsx) and the Home ribbon's
// "Add GIS data" (ModeRibbon.jsx) — same dialog, same result either way:
// a brand-new, empty, real layer added to the Layers tab (as a plain
// LayerRow — dismissible/reorderable/toggleable exactly like every other
// layer there, never the Simulation list's toggle-row treatment).
const PRESET_COLORS = [
  "var(--surface-brand)", "var(--red-700)", "#2e9b5c", "#e08a1e", "#8a5cf6", "#e0518f",
];

export default function AddLayerModal({ onCreate, onClose }) {
  const [name, setName] = useState("New layer");
  const [color, setColor] = useState(PRESET_COLORS[0]);

  const submit = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    onCreate({ name: trimmed, color });
  };

  return (
    <div
      style={{
        position: "fixed", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
        background: "rgba(0,0,0,0.3)", zIndex: 200,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "var(--surface-1)", border: "1px solid var(--border-primary)", borderRadius: 4,
          boxShadow: "0 2px 10px 2px rgba(0,0,0,0.25)", padding: 8, width: 320,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 16 }}>
          <Icon src={A.homeAddGis} size={16} />
          <span style={{ flex: "1 0 0", fontSize: "var(--fs-s)", fontWeight: 500, color: "var(--text-primary-selected)" }}>Create layer</span>
          <button
            onClick={onClose}
            style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 20, height: 20, border: "none", background: "transparent", cursor: "pointer", borderRadius: 2 }}
            onMouseOver={(e) => (e.currentTarget.style.background = "var(--surface-3)")}
            onMouseOut={(e) => (e.currentTarget.style.background = "transparent")}
          >
            <Icon src={A.cancel} size={12} />
          </button>
        </div>

        <label style={{ display: "block", fontSize: "var(--fs-xs)", fontWeight: 500, color: "var(--text-secondary)", marginBottom: 4 }}>
          Layer name
        </label>
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
          style={{
            width: "100%", boxSizing: "border-box", padding: "6px 8px", marginBottom: 16,
            border: "1px solid var(--border-primary)", borderRadius: 2, fontSize: "var(--fs-xs)",
            background: "var(--surface-1)", color: "var(--text-primary)",
          }}
        />

        <label style={{ display: "block", fontSize: "var(--fs-xs)", fontWeight: 500, color: "var(--text-secondary)", marginBottom: 4 }}>
          Geometry type
        </label>
        <div style={{
          display: "flex", alignItems: "center", gap: 4, padding: "6px 8px", marginBottom: 16,
          border: "1px solid var(--border-primary)", borderRadius: 2, background: "var(--surface-2)",
        }}>
          <Icon src={A.editMovePolygon} size={14} />
          <span style={{ fontSize: "var(--fs-xs)", color: "var(--text-primary)" }}>Polygon</span>
          <span style={{ marginLeft: "auto", fontSize: "var(--fs-xxs)", color: "var(--text-tertiary)" }}>Line/Point — TBC</span>
        </div>

        <label style={{ display: "block", fontSize: "var(--fs-xs)", fontWeight: 500, color: "var(--text-secondary)", marginBottom: 4 }}>
          Colour
        </label>
        <div style={{ display: "flex", gap: 6, marginBottom: 24 }}>
          {PRESET_COLORS.map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              title={c}
              style={{
                width: 20, height: 20, borderRadius: "50%", background: c, cursor: "pointer", padding: 0,
                border: color === c ? "2px solid var(--text-primary)" : "1px solid rgba(0,0,0,0.15)",
              }}
            />
          ))}
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <button
            onClick={onClose}
            style={{
              padding: "8px 16px", background: "var(--surface-1)", border: "1px solid var(--border-primary)", borderRadius: 4,
              cursor: "pointer", fontSize: "var(--fs-xs)", color: "var(--text-primary)",
            }}
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={!name.trim()}
            style={{
              padding: "8px 16px", background: name.trim() ? "var(--surface-brand)" : "var(--neutral-400)", border: "none", borderRadius: 4,
              cursor: name.trim() ? "pointer" : "default", fontSize: "var(--fs-xs)", color: "#fff",
            }}
          >
            Create layer
          </button>
        </div>
      </div>
    </div>
  );
}
