import { useState, useRef, useEffect } from "react";
import { A, Icon } from "../assets.jsx";

// Transcribed from the FM v8.0 Keyboard Shortcuts spec (Confluence).
// `live: true` rows are actually wired up in this prototype; everything
// else is reference documentation for the fuller concept (dialogs, panels,
// and subsystems — Simulation, Results, TUFLOW, Layers — that don't exist
// here yet).
const SECTIONS = [
  {
    title: "General",
    rows: [
      { fn: "Toggle through functions", keys: "Tab", desc: "Cycle through functions – Menu, Ribbons" },
      { fn: "Toggle through visible panels", keys: "Ctrl+Tab", desc: "Cycle through panels on-screen – Components, Layers, 1D Network" },
      { fn: "Access menu or ribbon", keys: "Enter", desc: "Access one level down – Ribbon > Actions" },
      { fn: "Move through Actions", keys: "↑ / → / ↓ / ←", desc: "When Tab (or Shift below) focus activated, navigate sub-menus with arrow keys" },
      { fn: "'General' menu", keys: "Shift+1", desc: "Open 'General' drop-down menu" },
      { fn: "'Project' menu", keys: "Shift+2", desc: "Open 'Project' drop-down menu" },
      { fn: "'Layer' menu", keys: "Shift+3", desc: "Open 'Layer' drop-down menu" },
      { fn: "'View' menu", keys: "Shift+4", desc: "Open 'View' drop-down menu" },
      { fn: "'Window' menu", keys: "Shift+5", desc: "Open 'Window' drop-down menu" },
      { fn: "'Toolbox' menu", keys: "Shift+6", desc: "Open 'Toolbox' drop-down menu" },
      { fn: "'Help' menu", keys: "Shift+7", desc: "Open 'Help' drop-down menu" },
      { fn: "'Home' tab", keys: "Ctrl+1", desc: "Switch to 'Home' Ribbon", live: true },
      { fn: "'FM 1D' tab", keys: "Ctrl+2", desc: "Switch to 'FM 1D' Ribbon", live: true },
      { fn: "'FM 2D' tab", keys: "Ctrl+3", desc: "Switch to 'FM 2D' Ribbon", live: true },
      { fn: "'TUFLOW' tab", keys: "Ctrl+4", desc: "Switch to 'TUFLOW' Ribbon", live: true },
      { fn: "'SWMM' tab", keys: "Ctrl+5", desc: "Switch to 'SWMM' Ribbon", live: true },
      { fn: "'Hydrology+' tab", keys: "Ctrl+6", desc: "Switch to 'Hydrology+' Ribbon", live: true },
      { fn: "'Simulation' tab", keys: "Ctrl+7", desc: "Switch to 'Simulation' Ribbon", live: true },
      { fn: "'Results' tab", keys: "Ctrl+8", desc: "Switch to 'Results' Ribbon", live: true },
      { fn: "'Favourites' tab", keys: "Ctrl+9", desc: "Switch to 'Favourites' Ribbon", live: true },
      { fn: "Search Bar", keys: "Ctrl+K", desc: "Activates the Search Bar in the top bar for global search of tools and functions", live: true },
      { fn: "Knowledge Base", keys: "Ctrl+?", desc: "Launch Knowledge Base in default browser" },
      { fn: "Start-up splash screen", keys: "Ctrl+\\", desc: "Launch Start-up splash screen with quick access" },
      { fn: "Close Flood Modeller", keys: "Ctrl+Esc", desc: "Completely close program (dialog prompt to save before exit)" },
    ],
  },
  {
    title: "Project",
    rows: [
      { fn: "Project Information", keys: "Ctrl+I", desc: "Open Project Information dialog window" },
      { fn: "Open Project", keys: "Ctrl+O", desc: "Open file OS window" },
      { fn: "Save Project", keys: "Ctrl+S", desc: "Open file OS window" },
      { fn: "New Project", keys: "Ctrl+N", desc: "Open New Project dialog window" },
      { fn: "Save Project As", keys: "Ctrl+Shift+S", desc: "Open file OS window" },
      { fn: "Save as copy", keys: "Ctrl+Alt+S", desc: "Open file OS window" },
      { fn: "Close Project", keys: "Ctrl+W", desc: "Close Project – prompt to save if not accomplished" },
      { fn: "Open River Network", keys: "Ctrl+Shift+O", desc: "Open file OS window" },
      { fn: "Save River Network", keys: "Ctrl+Shift+S", desc: "Open file OS window" },
      { fn: "New River Network", keys: "Ctrl+Shift+N", desc: "Open New River Network dialog window" },
    ],
  },
  {
    title: "Layer",
    rows: [
      { fn: "Add Layer", keys: "Ctrl+Shift+L", desc: "Open file OS window" },
      { fn: "Create Layer", keys: "Ctrl+L", desc: "Open New Layer dialog window" },
      { fn: "Toggle edit on/off", keys: "Ctrl+E", desc: "Activate editing of selected layer" },
    ],
  },
  {
    title: "View",
    rows: [
      { fn: "Zoom in (25%)", keys: "=", desc: "Zoom in to screen using increments", live: true },
      { fn: "Zoom out (25%)", keys: "-", desc: "Zoom out of screen using increments", live: true },
      { fn: "Zoom to project extent", keys: "0", desc: "Zoom in/out to Project extent set by user", live: true },
    ],
  },
  {
    title: "Window",
    rows: [
      { fn: "Reset layout", keys: "Alt+R", desc: "Return program view to default settings" },
      { fn: "Toggle full screen", keys: "Ctrl+F", desc: "Force program in or out of full screen mode" },
    ],
  },
  {
    title: "Toolbox",
    rows: [{ fn: "Open Toolbox", keys: "Ctrl+T", desc: "Open Toolbox dialog window" }],
  },
  {
    title: "Help",
    rows: [{ fn: "Keyboard Shortcuts", keys: "Ctrl+Shift+K", desc: "Open Keyboard Shortcuts dialog window", live: true }],
  },
  {
    title: "Mouse Configuration",
    rows: [
      { fn: "Select", keys: "Left-click", desc: "Selects the underlying object, if applicable (e.g. 1D unit)", live: true },
      { fn: "Multi-select", keys: "Ctrl+Left-click", desc: "Adds to selection" },
      { fn: "Select all", keys: "Ctrl+A", desc: "Select all available objects" },
      { fn: "Deselect", keys: "Left-click, Alt+Left-click", desc: "Deselects the selected object(s) away from any objects, or the underlying object if applicable", live: true },
      { fn: "Deselect all", keys: "Ctrl+D", desc: "Deselect all available objects", live: true },
      { fn: "Invert selection", keys: "Ctrl+Shift+I", desc: "Invert selected and unselected objects" },
      { fn: "Pan", keys: "Left-click+Hold", desc: "Temporarily pan around Map view on X, Y axis – if no active objects underneath left-click", live: true },
      { fn: "Fast Pan", keys: "Ctrl+Left-click+Hold", desc: "Temporarily pan faster around Map view" },
      { fn: "Zoom", keys: "Scroll-Wheel", desc: "Temporarily zoom in/out of Map view", live: true },
      { fn: "Fast Zoom", keys: "Ctrl+Scroll-Wheel", desc: "Temporarily zoom faster in/out of Map view" },
      { fn: "Group selection", keys: "Ctrl+Left-click+Hold, Shift+Left-click+Hold", desc: "Invoke box select to encapsulate any active underlying objects" },
      { fn: "Continuous group selection", keys: "Ctrl+Left-click+Hold", desc: "Continue to add new group selections to current selection" },
      { fn: "Group unselect", keys: "Alt+Left-click+Hold", desc: "Remove group selections from current selection" },
      { fn: "Options", keys: "Right-click", desc: "Contextually view options – based on underlying object or DTM" },
    ],
  },
  {
    title: "GUI",
    rows: [
      { fn: "Cursor select tool", keys: "V", desc: "Default – persistently select relevant objects, and pan map view when left-clicked over non-interactive areas", live: true },
      { fn: "Group select tool", keys: "G", desc: "Persistently box select relevant underlying objects", live: true },
      { fn: "Measure tool", keys: "M", desc: "Persistently measure between 2 or more points on the Map view", live: true },
      { fn: "Query tool", keys: "Q", desc: "Persistently query underlying data at location selected", live: true },
      { fn: "Live edit", keys: "Ctrl+E", desc: "Activate editing of selected layer, prompt Save dialog window on exit if changes made" },
      { fn: "Snapping on/off", keys: "S", desc: "Toggle on/off Snapping" },
      { fn: "Tracing on/off", keys: "T", desc: "Toggle on/off Tracing" },
      { fn: "North star tool", keys: "N", desc: "Persistently rotate view around the north axis" },
      { fn: "Zoom tool", keys: "Z", desc: "Persistently zoom in/out of screen using left-click and drag", live: true },
      { fn: "Zoom in (25%)", keys: "=", desc: "Zoom in to screen using increments", live: true },
      { fn: "Zoom in (50%)", keys: "Ctrl+=", desc: "Zoom in to screen using increments" },
      { fn: "Zoom out (25%)", keys: "-", desc: "Zoom out of screen using increments", live: true },
      { fn: "Zoom out (50%)", keys: "Ctrl+-", desc: "Zoom out of screen using increments" },
      { fn: "Zoom to project extent", keys: "0", desc: "Zoom in/out to Project extent set by user", live: true },
      { fn: "Move map up (25%)", keys: "↑", desc: "Pan Map view upwards 25%" },
      { fn: "Move map right (25%)", keys: "→", desc: "Pan Map view right by 25%" },
      { fn: "Move map down (25%)", keys: "↓", desc: "Pan Map view downwards 25%" },
      { fn: "Move map left (25%)", keys: "←", desc: "Pan Map view left by 25%" },
      { fn: "Move map up (50%)", keys: "Ctrl+↑", desc: "Pan Map view upwards 50%" },
      { fn: "Move map right (50%)", keys: "Ctrl+→", desc: "Pan Map view right by 50%" },
      { fn: "Move map down (50%)", keys: "Ctrl+↓", desc: "Pan Map view downwards 50%" },
      { fn: "Move map left (50%)", keys: "Ctrl+←", desc: "Pan Map view left by 50%" },
      { fn: "Pan tool", keys: "X", desc: "Persistently pan around Map view on X, Y axis", live: true },
      { fn: "Temporary Pan", keys: "Spacebar", desc: "Overrides current selected tool when depressed and held, reverts on release", live: true },
      { fn: "Copy", keys: "Ctrl+C", desc: "Copy selected object" },
      { fn: "Cut", keys: "Ctrl+X", desc: "Cut selected object" },
      { fn: "Paste", keys: "Ctrl+V", desc: "Paste selected object" },
      { fn: "Undo", keys: "Ctrl+Z", desc: "Undo action in Map view only" },
      { fn: "Redo", keys: "Ctrl+Y", desc: "Redo action in Map view only" },
      { fn: "Open Attributes Table", keys: "A", desc: "Open Attributes Table for selected layer" },
      { fn: "Layer Properties", keys: "Ctrl+Shift+P", desc: "Opens Properties dialog window for selected Layer" },
      { fn: "Zoom to layer/selection", keys: "Double-click", desc: "Map view zooms to layer selection bounds" },
      { fn: "Select inclusive Layers", keys: "Shift+Left-click", desc: "Select multiple consecutive Layers" },
      { fn: "Select multiple Layers", keys: "Ctrl+Left-click", desc: "Select multiple non-consecutive Layers" },
      { fn: "Group Layers", keys: "Ctrl+G", desc: "Group selected layers into a sub-folder" },
      { fn: "Expand grouped layers", keys: "Ctrl+→", desc: "When active in Layers panel, expand sub-folder to show contents" },
      { fn: "Collapse grouped layers", keys: "Ctrl+←", desc: "When active in Layers panel, collapse sub-folder to hide contents" },
      { fn: "Ungroup Layers", keys: "Ctrl+Shift+G", desc: "Ungroup sub-folder into layers" },
      { fn: "Rename Layer", keys: "Left-click+Enter", desc: "Press Enter on Layer select to rename" },
      { fn: "Select all Layers", keys: "Ctrl+A", desc: "When active in Layers panel, select all visible layers (not locked)" },
      { fn: "Bring Layer forward", keys: "Ctrl+]", desc: "Move layer up 1 in stack" },
      { fn: "Send Layer backward", keys: "Ctrl+[", desc: "Move layer down 1 in stack" },
      { fn: "Unlock/lock Layer", keys: "Ctrl+/", desc: "Lock Layer (typically on by default)" },
    ],
  },
  {
    title: "GIS",
    rows: [
      { fn: "User bookmarks", keys: "1–9", desc: "User-defined zoom and location bookmarks" },
      { fn: "New GIS Layer", keys: "Ctrl+Shift+L", desc: "Open GIS/WMS dialog window" },
    ],
  },
  {
    title: "FM 1D",
    rows: [
      { fn: "Previous unit", keys: ",", desc: "In relation to selection, move up 1 unit on 1D Network list", live: true },
      { fn: "Next unit", keys: ".", desc: "In relation to selection, move down 1 unit on 1D Network list", live: true },
      { fn: "Move 1D Unit", keys: ";", desc: "Activate move selected 1D unit, press again to set position and deactivate" },
      { fn: "Toggle selected 1D unit", keys: "Left-click+Hold+Drag+Tab", desc: "When dragging in the primary 1D unit e.g. Cross-Section, press Tab to cycle through the available sub units", live: true },
    ],
  },
  {
    title: "FM 2D",
    rows: [
      { fn: "Generate iMesh", keys: "Ctrl+M", desc: "Example description" },
      { fn: "Modify iMesh", keys: "Ctrl+Shift+M", desc: "Example description" },
    ],
  },
  {
    title: "TUFLOW",
    rows: [{ fn: "Tuflow Tools", keys: "Ctrl+U", desc: "Open Tools dialog window" }],
  },
  {
    title: "SWMM",
    rows: [],
    note: "Intentionally no shortcuts nominated",
  },
  {
    title: "Hydrology+",
    rows: [
      { fn: "Zoom to H+ Project", keys: "H", desc: "Zoom to bounds of active H+ project" },
      { fn: "View River Stations", keys: "Ctrl+R", desc: "Toggle on/off River Stations" },
      { fn: "View FEH catchments", keys: "Ctrl+Shift+F", desc: "Toggle on/off FEH Catchments" },
      { fn: "FEH Tabular View", keys: "Ctrl+Alt+F", desc: "Toggle on/off FEH Tabular View" },
      { fn: "View Calculation Points", keys: "Ctrl+Shift+C", desc: "Toggle on/off Calculation Points" },
    ],
  },
  {
    title: "Simulation",
    rows: [
      { fn: "Simulation Builder", keys: "Ctrl+B", desc: "Open Simulation Builder dialog window" },
      { fn: "Run Simulation", keys: "Ctrl+Shift+R", desc: "Runs selected Simulation at maximum parallelisation" },
      { fn: "Run batch simulations", keys: "Ctrl+Alt+R", desc: "Open Batch Run Simulations dialog window" },
      { fn: "Play/Pause time-steps", keys: "Ctrl+Space", desc: "Play/Pause time-steps for Simulation results" },
      { fn: "First step", keys: "Ctrl+<", desc: "Go to first time-step" },
      { fn: "End step", keys: "Ctrl+>", desc: "Go to last time-step" },
      { fn: "Maxima", keys: "Ctrl+|", desc: "Show available result Maximums" },
    ],
  },
  {
    title: "Results",
    rows: [
      { fn: "XY Series Plot", keys: "Ctrl+Alt+X", desc: "Open XY Series Plot dialog window" },
      { fn: "Time Series Plot", keys: "Ctrl+Alt+T", desc: "Open Time Series Plot dialog window" },
      { fn: "Long Section Plot", keys: "Ctrl+Alt+L", desc: "Open Long Section Plot dialog window" },
    ],
  },
];

function KeyChip({ keys }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
      {keys.split(", ").map((combo) => (
        <span key={combo} style={{
          fontSize: "var(--fs-xxs)", fontFamily: "ui-monospace, monospace", color: "var(--text-primary)",
          background: "var(--surface-2)", border: "1px solid var(--border-primary)", borderRadius: 3,
          padding: "1px 6px", whiteSpace: "nowrap",
        }}>{combo}</span>
      ))}
    </div>
  );
}

export default function KeyboardShortcuts({ onClose }) {
  const [q, setQ] = useState("");
  const boxRef = useRef(null);

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const query = q.trim().toLowerCase();
  const sections = SECTIONS.map((s) => ({
    ...s,
    rows: query ? s.rows.filter((r) => r.fn.toLowerCase().includes(query) || r.keys.toLowerCase().includes(query) || r.desc.toLowerCase().includes(query)) : s.rows,
  })).filter((s) => s.rows.length || (!query && s.note));

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 2000, background: "rgba(0,0,0,0.35)",
      display: "flex", alignItems: "center", justifyContent: "center",
    }} onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div ref={boxRef} style={{
        width: 720, maxHeight: "80vh", display: "flex", flexDirection: "column",
        background: "var(--surface-1)", borderRadius: 8, boxShadow: "0 12px 40px rgba(0,0,0,0.3)", overflow: "hidden",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 16px", borderBottom: "1px solid var(--border-primary)", flexShrink: 0 }}>
          <span style={{ fontSize: "var(--fs-s)", fontWeight: 600, flex: "1 0 0" }}>Keyboard Shortcuts</span>
          <span style={{ fontSize: "var(--fs-xxs)", color: "var(--text-tertiary)" }}>● wired up in this prototype</span>
          <button onClick={onClose} title="Close (Esc)" style={{
            border: "none", background: "transparent", cursor: "pointer", width: 24, height: 24,
            display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 2,
          }}>
            <Icon src={A.cancel} size={12} />
          </button>
        </div>

        <div style={{ padding: "8px 16px", borderBottom: "1px solid var(--border-primary)", flexShrink: 0 }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 4, height: 28, padding: 4,
            background: "var(--surface-2)", border: "1px solid var(--border-primary)", borderRadius: 2,
          }}>
            <Icon src={A.search} size={16} />
            <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search shortcuts…"
              style={{ flex: "1 0 0", border: "none", outline: "none", background: "transparent", font: "inherit", fontSize: "var(--fs-xs)" }} />
          </div>
        </div>

        <div style={{ overflow: "auto", padding: "4px 16px 16px" }}>
          {sections.map((s) => (
            <div key={s.title} style={{ marginTop: 12 }}>
              <div style={{ fontSize: "var(--fs-xs)", fontWeight: 600, color: "var(--text-secondary)", padding: "4px 0" }}>{s.title}</div>
              {s.note && <div style={{ fontSize: "var(--fs-xxs)", color: "var(--text-tertiary)", fontStyle: "italic", padding: "2px 0 6px" }}>{s.note}</div>}
              {s.rows.map((r, i) => (
                <div key={r.fn + i} style={{
                  display: "flex", alignItems: "center", gap: 12, padding: "6px 0",
                  borderBottom: "1px solid var(--border-primary)",
                }}>
                  <span style={{ width: 6, textAlign: "center", color: "var(--surface-brand)", flexShrink: 0 }}>{r.live ? "●" : ""}</span>
                  <span style={{ width: 190, flexShrink: 0, fontSize: "var(--fs-xs)" }}>{r.fn}</span>
                  <div style={{ width: 180, flexShrink: 0 }}><KeyChip keys={r.keys} /></div>
                  <span style={{ flex: "1 0 0", minWidth: 0, fontSize: "var(--fs-xxs)", color: "var(--text-secondary)" }}>{r.desc}</span>
                </div>
              ))}
            </div>
          ))}
          {sections.every((s) => s.rows.length === 0) && (
            <div style={{ padding: "24px 0", textAlign: "center", fontSize: "var(--fs-xs)", color: "var(--text-tertiary)" }}>No matching shortcuts</div>
          )}
        </div>
      </div>
    </div>
  );
}
