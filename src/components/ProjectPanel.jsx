import { useState } from "react";
import { A, Icon } from "../assets.jsx";

function SearchField({ placeholder }) {
  return (
    <div style={{ padding: "0 8px", width: "100%", flexShrink: 0 }}>
      <div style={{
        display: "flex", alignItems: "center", gap: 4, height: 24, padding: 4,
        borderRadius: 2, background: "var(--surface-2)", border: "1px solid var(--border-primary)",
      }}>
        <Icon src={A.search} size={16} />
        <span style={{ color: "var(--text-secondary)", fontSize: "var(--fs-xs)" }}>{placeholder}</span>
      </div>
    </div>
  );
}

function SectionHeader({ label, onAdd }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 4, height: 28, width: "100%",
      padding: "8px 8px 4px", flexShrink: 0,
    }}>
      <span style={{ flex: "1 0 0", fontSize: "var(--fs-xs)", fontWeight: 500, color: "var(--text-secondary)" }}>{label}</span>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <Icon src={A.layers} size={12} />
        <Icon src={A.add} size={12} style={onAdd ? { cursor: "pointer" } : undefined} onClick={onAdd} />
      </div>
    </div>
  );
}

const iefs = ["UptonQ_100.IEF", "UptonQ_200.IEF", "UptonQ_300.IEF"];
const components = [
  { icon: A.lhs0, label: "FM 1D model" },
  { icon: A.lhs1, label: "Data library" },
  { icon: A.lhs2, label: "Hydrology+" },
  { icon: A.lhs3, label: "Supporting data" },
];

function Toggle({ on, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        width: 16, height: 10, borderRadius: 6, flexShrink: 0,
        background: on ? "#fff" : "var(--neutral-1000)",
        border: on ? "none" : "1px solid var(--neutral-900)",
        position: "relative", cursor: onClick ? "pointer" : "default",
      }}>
      <div style={{
        position: "absolute", top: 1, width: 8, height: 8, borderRadius: "50%",
        left: on ? 7 : 1, background: on ? "var(--surface-brand)" : "#fff",
      }} />
    </div>
  );
}

// The one "layer item" component design (Figma node 2528-53806), reused
// verbatim for both the static Components tree (icon + label + a
// check-style trailing badge) and the real dynamic Layers list (a colour
// swatch standing in for the icon, a feature-count sublabel, a visibility
// Toggle, and a hover-revealed remove "×") — same row shell, same
// selected/hover treatment, just different trailing content per caller.
function LayerRow({ icon, color, label, sublabel, active, onClick, trailing }) {
  const [hover, setHover] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: "flex", alignItems: "center", gap: 4, padding: 8, borderRadius: 2,
        background: active ? "var(--surface-brand)" : hover && onClick ? "var(--neutral-500)" : "var(--neutral-400)",
        cursor: onClick ? "pointer" : "default",
      }}
    >
      {color
        ? <div style={{ width: 12, height: 12, borderRadius: 2, background: color, flexShrink: 0, border: "1px solid rgba(0,0,0,0.15)" }} />
        : <Icon src={icon} size={12} />}
      <div style={{ flex: "1 0 0", minWidth: 0 }}>
        <div style={{
          fontSize: "var(--fs-xs)", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          color: active ? "var(--text-invert)" : "var(--text-primary)",
        }}>{label}</div>
        {sublabel && (
          <div style={{ fontSize: "var(--fs-xxs)", color: active ? "var(--text-invert)" : "var(--text-tertiary)" }}>{sublabel}</div>
        )}
      </div>
      {trailing}
    </div>
  );
}

// Everything below the panel header — the header itself (icon+dropdown
// switcher, title, filter/layers icons) is owned by the generic PanelSlot
// shell so any slot can swap between this and the other panel views.
// `layers`/`activeLayerId`/`onSetActiveLayer`/`onToggleLayerVisibility`/
// `onDeleteLayer`/`onAddLayer` — the real, user-growable vector layer list
// (see App.jsx); `polygons` supplies each layer's live feature count.
// `polygonLayerVisible`/`setPolygonLayerVisible` were the old single-layer
// toggle — superseded by per-layer visibility on `layers` now that any
// number of layers can exist side by side.
export function ProjectPanelBody({ layers, activeLayerId, onSetActiveLayer, onToggleLayerVisibility, onDeleteLayer, onAddLayer, polygons, tab: tabProp, setTab: setTabProp }) {
  const [tabState, setTabState] = useState("components");
  // Controllable from outside (App.jsx switches this to "layers" right
  // after a new layer is created, so it's immediately visible) but still
  // works standalone with its own state if no controlling props are given.
  const tab = tabProp ?? tabState;
  const setTab = setTabProp ?? setTabState;
  return (
    <div style={{ flex: "1 0 0", minHeight: 0, display: "flex", flexDirection: "column", gap: 4, overflow: "hidden" }}>
      <SearchField placeholder={tab === "layers" ? "Search layers" : "Search project"} />

      {tab === "components" ? (
        <>
      <SectionHeader label="Simulation" />

      {/* Simulations list */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: "0 8px", flexShrink: 0 }}>
        {/* Active simulation with expanded IEFs */}
        <div style={{ borderRadius: 2, overflow: "hidden" }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 4, padding: "8.5px 8px",
            background: "var(--surface-brand)", borderRadius: 2,
          }}>
            <Icon src={A.keyDown} size={12} style={{ filter: "brightness(0) invert(1)" }} />
            <span style={{ flex: "1 0 0", minWidth: 0, fontSize: "var(--fs-xs)", fontWeight: 500, color: "var(--text-invert)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              Upton_003_1D.bat
            </span>
            <span style={{ fontSize: "var(--fs-xxs)", fontWeight: 500, color: "var(--text-invert)", border: "1px solid var(--text-invert)", borderRadius: 2, padding: 4, lineHeight: 1 }}>
              Active
            </span>
            <Toggle on />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4, padding: "12px 8px" }}>
            {iefs.map(f => (
              <div key={f} style={{ display: "flex", alignItems: "center", gap: 4, height: 28, padding: 8, borderRadius: 2 }}>
                <Icon src={A.lhs1} size={12} />
                <span style={{ flex: "1 0 0", minWidth: 0, fontSize: "var(--fs-xs)", color: "var(--text-primary-selected)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f}</span>
              </div>
            ))}
          </div>
        </div>
        {/* Collapsed simulations */}
        {["Upton_002_1D.bat", "Upton_001_1D.bat"].map(s => (
          <div key={s} style={{ display: "flex", alignItems: "center", gap: 4, padding: "10px 8px", borderRadius: 2 }}>
            <Icon src={A.keyDown} size={12} style={{ transform: "rotate(-90deg)" }} />
            <span style={{ flex: "1 0 0", minWidth: 0, fontSize: "var(--fs-xs)", color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s}</span>
            <Toggle on={false} />
          </div>
        ))}
      </div>

      <div style={{ height: 1, background: "var(--border-primary)", margin: "8px 16px", flexShrink: 0 }} />
      <SectionHeader label="Components" onAdd={onAddLayer} />

      {/* Components tree */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: "0 8px", flex: "1 0 0", overflow: "auto" }}>
        {components.map(c => (
          <LayerRow key={c.label} icon={c.icon} label={c.label} trailing={
            <div style={{ width: 12, height: 12, borderRadius: 2, background: "var(--neutral-600)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Icon src={A.check} size={12} />
            </div>
          } />
        ))}
      </div>
        </>
      ) : (
        <>
      <SectionHeader label="Layers" onAdd={onAddLayer} />

      {/* Layers list — every entry (seeded or user-added via "Add GIS
          data") uses the same LayerRow: click to make it the active
          drawing target (so the Pen tool in Live Edit adds new polygons to
          it), toggle to show/hide its shapes on the canvas, "×" to delete
          it and its polygons outright. */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: "0 8px", flex: "1 0 0", overflow: "auto" }}>
        {(layers || []).map((l) => {
          const count = (polygons || []).filter((p) => (p.layerId || "example") === l.id).length;
          const active = l.id === activeLayerId;
          return (
            <LayerRow
              key={l.id}
              color={l.color}
              label={l.name}
              sublabel={`${count} feature${count === 1 ? "" : "s"}${active ? " · active for drawing" : ""}`}
              active={active}
              onClick={() => onSetActiveLayer(l.id)}
              trailing={
                <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                  <Toggle on={l.visible !== false} onClick={(e) => { e.stopPropagation(); onToggleLayerVisibility(l.id); }} />
                  <button
                    onClick={(e) => { e.stopPropagation(); onDeleteLayer(l.id); }}
                    title="Delete layer"
                    style={{
                      width: 16, height: 16, display: "flex", alignItems: "center", justifyContent: "center",
                      border: "none", borderRadius: "50%", cursor: "pointer", padding: 0, fontSize: 12, lineHeight: 1,
                      background: "transparent", color: active ? "var(--text-invert)" : "var(--text-tertiary)",
                    }}
                  >×</button>
                </div>
              }
            />
          );
        })}
        {(!layers || layers.length === 0) && (
          <span style={{ fontSize: "var(--fs-xs)", color: "var(--text-tertiary)" }}>
            No layers yet — use the + above, or Home ▸ Add GIS data, to create one.
          </span>
        )}
      </div>
        </>
      )}

      {/* Footer tabs */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: 8, flexShrink: 0 }}>
        <div style={{ display: "flex", flex: "1 0 0" }}>
          <div
            onClick={() => setTab("components")}
            style={{
              flex: "1 0 0", height: 24, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
              background: tab === "components" ? "var(--surface-4)" : "var(--surface-1)",
              border: `1px solid ${tab === "components" ? "var(--border-secondary)" : "var(--border-primary)"}`,
              borderRadius: "2px 0 0 2px", fontSize: "var(--fs-xs)", fontWeight: 500,
              color: tab === "components" ? "var(--text-primary-selected)" : "var(--text-secondary)",
            }}>Components</div>
          <div
            onClick={() => setTab("layers")}
            style={{
              flex: "1 0 0", height: 24, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
              background: tab === "layers" ? "var(--surface-4)" : "var(--surface-1)",
              border: `1px solid ${tab === "layers" ? "var(--border-secondary)" : "var(--border-primary)"}`,
              borderRadius: "0 2px 2px 0", fontSize: "var(--fs-xs)", fontWeight: 500,
              color: tab === "layers" ? "var(--text-primary-selected)" : "var(--text-secondary)",
            }}>Layers</div>
        </div>
        <div style={{
          width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center",
          background: "var(--surface-1)", border: "1px solid var(--border-primary)", borderRadius: 2,
        }}>
          <Icon src={A.settingsColor} size={16} />
        </div>
      </div>
    </div>
  );
}

