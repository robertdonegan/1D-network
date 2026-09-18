import { useEffect } from "react";
import { A, Icon } from "../assets.jsx";

// Developer changelog, surfaced from Help ▸ "Developer changelog" so anyone
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
    area: "Icons & panel switcher",
    items: [
      { tag: "New", text: "Panel-switcher dropdown icons are Flood Icons: 1D Flow Lines recoloured brand blue, and Toolbox swapped to the mono toolbox glyph in brand blue." },
      { tag: "Improved", text: "Results ▸ 1D Results & 2D Results all show official Flood colour icons for every option." },
      { tag: "Improved", text: "TUFLOW ▸ Topography menu icon updated to the Flood define-topo colour icon." },
      { tag: "Fixed", text: "Hydrology+ ▸ View River Station restores the \"Off (none)\" option." },
    ],
  },
  {
    area: "GIS & basemaps",
    items: [
      { tag: "Improved", text: "The North Star button now reorientates the map to north only — it no longer zooms back out to the full project extent; the \"0\" key still resets the whole view." },
      { tag: "New", text: "Four more keyless basemaps: Humanitarian OSM, OpenTopoMap, Esri Street Map and Esri Topo (the OS/Azure rows still need an API key)." },
      { tag: "Improved", text: "\"Base map\" menu labels renamed to \"Basemap\"." },
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
      { tag: "Improved", text: "2D Results is now represented by the official Flood mono 2D-results glyph in brand blue, matching the other panel-switcher icons." },
      { tag: "New", text: "Results rows are now interactive like in FMv8.2: hovering a row highlights it and reveals its options ellipsis, clicking selects it with the blue focus border, clicking its max \u25b8 glyph pins it as the max result (max turns blue), and tabbing to a row shows the black keyboard focus ring." },
      { tag: "Improved", text: "Every icon in the 2D-results panel now comes clean from the official Flood-Icons set: the raster tiles show the raster glyph, Vector shows the FM 2D line, Logs shows the diagnostics-mono glyph, the row max toggle is the display-max glyph, and the section headers use the standard add icon." },
      { tag: "Improved", text: "The 2D-results panel's layout now mirrors the FMv8.2 drawing exactly: the View status list sits in a fixed-height scrollable band, the divider line floats with padding around it, the results-type groups use the compact 24px section bars, and the Vector group shows the official FM 2D Line icon." },
      { tag: "Improved", text: "Every panel's header now follows the FMv8.2 panel-title spec: even 4px padding, the 14px title, and Filter + New-window (undock) icons on the right." },
      { tag: "New", text: "Results cells' max/expand toggle matches the FMv8.2 Max-icon component (Default / Hover / Select states); the Select state tints it brand blue for the \u201cmax\u201d cell." },
      { tag: "New", text: "Results cells now carry the official \"options\" affordance (a vertical ellipsis) that appears on hover, matching the FMv8.2 more-icon component; the ellipsis glyph was pulled from the Flood-Icons set." },
      { tag: "Improved", text: "The Raster / Vector / Check / Logs group headers in Results now match the FMv8.2 section component (\u201cSection\u201d bar) with its Default and Collapse states ready to use." },
      { tag: "New", text: "Results-mode list rows are now proper \"Results cells\" matching the FMv8.2 component — every state (Default, hover, selected, focus, disabled and selected-max) is implemented ready for wiring up; the Results panel shows them all in the Default state for now." },
      { tag: "Improved", text: "Results mode's 2D-results panel now matches the FMv8.2 spec exactly: a \"View status\" list with a selected result cell, and Raster/Vector/Check/Logs groups with their official Flood icons and expand buttons." },
      { tag: "New", text: "The panels re-arrange to match the mode you pick on the ribbon, just like Flood Modeller 8: FM 1D/FM 2D, SWMM and Hydrology+ show the 1D Network on the right, TUFLOW shows a wider TUFLOW editor (a syntax-coloured demo .tcf file), and Results shows a 2D-results viewer with the Global Animator open beneath the map. Home, Simulation and Favourites hide the right panel for a full-width map." },
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
      { tag: "Improved", text: "The status bar now says \"Dbl-click: open unit\" while hovering or selecting a Weir, so double-click-to-edit is discoverable." },
      { tag: "Improved", text: "Double-clicking any Weir unit already on the map reopens the 1D Weir unit form, prefilled with its saved values, so you can edit it in place." },
      { tag: "New", text: "The top-level Weir drops straight onto the map as a unit (slotted into a reach when dropped on a line); double-click it to open the 1D Weir unit form (name, description, upstream/downstream, coefficients and 2D dimensions) and set its details." },
      { tag: "New", text: "Undo/redo for network edits (Ctrl+Z / Ctrl+Shift+Z), covering drags, vertex changes and topology edits." },
      { tag: "Improved", text: "Default network seeded for reaches M014–M036 with a bridge gap on the map." },
      { tag: "Improved", text: "Live edit and the Pen tool draw into the selected layer." },
    ],
  },
  {
    area: "Plots & visualisations",
    items: [
      { tag: "New", text: "Right-click two or more selected 1D network units (on the map or in the 1D Network table) and pick \"Plot long section\": a Flood Modeller-style Long Section window opens along the stretch of network, showing the bed, stage and left/right bank levels, per-station markers and a live timestep readout." },
    ],
  },
  {
    area: "Dialogs & menus",
    items: [
      { tag: "Improved", text: "Help ▸ \"Dev – changelog\" is now \"Developer changelog\"." },
      { tag: "Improved", text: "Save dialog redesigned with clear danger / secondary / primary actions and a cancel icon." },
      { tag: "New", text: "Escape prompts to save when there are unsaved edits." },
      { tag: "Fixed", text: "Submenus stay open while moving diagonally to them (250 ms close grace)." },
      { tag: "Improved", text: "Location search is limited to UK results." },
    ],
  },
  {
    area: "Search & favourites",
    items: [
      { tag: "New", text: "Global search resolves what3words-style addresses: type the ///word.word.word shown in the status bar and it jumps straight to that spot (simulated in-app, matching the footer's addresses)." },
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
