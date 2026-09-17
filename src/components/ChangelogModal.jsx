import { useEffect } from "react";
import { A, Icon } from "../assets.jsx";

// Developer changelog, surfaced from Help ▸ "Dev – changelog" so anyone
// picking up the prototype can read what has changed. Keep this list hand-
// written and newest-first; it's deliberately prose rather than generated
// from git so the wording stays testable by non-devs.
const TAG_COLOR = {
  New: "var(--surface-brand)",
  Improved: "var(--text-secondary)",
  Fixed: "var(--surface-warning)",
};

const CHANGELOG = [
  {
    area: "GIS & basemaps",
    items: [
      { tag: "New", text: "OS Satellite added alongside Open Street Map (rendered with Esri World Imagery as a keyless stand-in)." },
      { tag: "New", text: "Shift+B cycles through every available basemap (None → Open Street Map → OS Satellite); B still toggles the grid against the last used backdrop." },
      { tag: "New", text: "Zoom to layer (layer right-click) fits the map to that layer's features." },
      { tag: "Improved", text: "Map footer attribution now follows whichever basemap is active." },
      { tag: "Improved", text: "GIS tool rail and pan/zoom controls sit flush against the map edges." },
    ],
  },
  {
    area: "Panels & trees",
    items: [
      { tag: "New", text: "Drag the Project panel's right edge to swipe between the Components and Layers tabs (left → Layers, right → Components)." },
      { tag: "New", text: "Components tree and Simulations expand/collapse; the Simulation list is one scrollable window with a drag-to-resize grabber." },
      { tag: "Improved", text: "Layer rows restyled to the Figma row spec; the selected layer uses the Select variant (brand border, medium label)." },
      { tag: "Improved", text: "Scrollbars are subtle until you hover the scroll area." },
      { tag: "Fixed", text: "Right-click menus are portalled to the page, so they are no longer cropped by the panel they open in." },
    ],
  },
  {
    area: "Network & editing",
    items: [
      { tag: "New", text: "Undo/redo for network edits (Ctrl+Z / Ctrl+Shift+Z), covering drags, vertex changes and topology edits." },
      { tag: "Improved", text: "Default network seeded for reaches M014–M036 with a bridge gap on the map." },
      { tag: "Improved", text: "Live edit and the Pen tool draw into the selected layer." },
    ],
  },
  {
    area: "Dialogs & menus",
    items: [
      { tag: "Improved", text: "Save dialog redesigned with clear danger / secondary / primary actions and a cancel icon." },
      { tag: "New", text: "Escape prompts to save when there are unsaved edits." },
      { tag: "Fixed", text: "Submenus stay open while moving diagonally to them (250 ms close grace)." },
      { tag: "Improved", text: "Location search is limited to UK results." },
    ],
  },
  {
    area: "Search & favourites",
    items: [
      { tag: "Improved", text: "Global search (Ctrl+K) matches tools, units and places; favourites support named lists and drag-to-ribbon." },
    ],
  },
];

export default function ChangelogModal({ onClose }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const total = CHANGELOG.reduce((n, s) => n + s.items.length, 0);

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 2000, background: "rgba(0,0,0,0.35)",
      display: "flex", alignItems: "center", justifyContent: "center",
    }} onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{
        width: 720, maxHeight: "82vh", display: "flex", flexDirection: "column",
        background: "var(--surface-1)", borderRadius: 8, boxShadow: "0 12px 40px rgba(0,0,0,0.3)", overflow: "hidden",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 16px", borderBottom: "1px solid var(--border-primary)", flexShrink: 0 }}>
          <span style={{ fontSize: "var(--fs-s)", fontWeight: 600, flex: "1 0 0" }}>Developers' changelog</span>
          <span style={{ fontSize: "var(--fs-xxs)", color: "var(--text-tertiary)" }}>{total} updates in this prototype</span>
          <button onClick={onClose} title="Close (Esc)" style={{
            border: "none", background: "transparent", cursor: "pointer", width: 24, height: 24,
            display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 2,
          }}>
            <Icon src={A.cancel} size={12} />
          </button>
        </div>

        <div style={{ overflow: "auto", padding: "4px 16px 16px" }}>
          {CHANGELOG.map((s) => (
            <div key={s.area} style={{ marginTop: 12 }}>
              <div style={{ fontSize: "var(--fs-xs)", fontWeight: 600, color: "var(--text-secondary)", padding: "4px 0" }}>{s.area}</div>
              {s.items.map((it, i) => (
                <div key={i} style={{ display: "flex", alignItems: "baseline", gap: 8, padding: "5px 0", borderBottom: "1px solid var(--border-primary)" }}>
                  <span style={{
                    flexShrink: 0, width: 64, fontSize: "var(--fs-xxs)", fontWeight: 500,
                    color: TAG_COLOR[it.tag] || "var(--text-secondary)",
                  }}>{it.tag}</span>
                  <span style={{ flex: "1 0 0", minWidth: 0, fontSize: "var(--fs-xs)", color: "var(--text-primary)" }}>{it.text}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
