import { useState, useRef, useEffect } from "react";
import { A, Icon } from "../assets.jsx";
import { flattenRibbonItems } from "./ModeRibbon.jsx";

const ALL_ITEMS = flattenRibbonItems();

// Small hand-drawn glyphs for the couple of icons this file needs that
// don't have a dedicated uploaded asset yet (same convention as
// GlobalAnimatorPanel's Play/Pause glyphs).
function ExternalLinkGlyph() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" style={{ opacity: 0.6 }}>
      <path d="M3.5 1H9V6.5" stroke="currentColor" strokeWidth="1.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 1L4 6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M6.5 1.5H1.5V8.5H8.5V3.5" stroke="currentColor" strokeWidth="1.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// Figma "fm-v8.0-os-menu" spec (nodes 1:24153-1:24158) — General/Project/
// Layer/Window/Toolbox/Help are visual-only chrome (matching the Home
// ribbon's not-yet-built dropdowns convention), except "Open Toolbox..."
// (id:"open-toolbox") and "Keyboard shortcuts..." (id:"shortcuts"), which
// are genuinely wired. Disabled rows mirror the Figma mockup exactly
// (e.g. no project is "dirty" yet, so Save/Close project are greyed).
const GENERAL_MENU = [
  { label: "Start-up screen", shortcut: "Ctrl+\\" },
  { label: "About Flood Modeller..." },
  { label: "Check for updates...", sep: true },
  { label: "UI theme (system)", chevron: true, sep: true },
  { label: "App settings..." },
  { label: "Close Program", shortcut: "Ctrl+Esc" },
];

const PROJECT_MENU = [
  { label: "Project information...", shortcut: "Ctrl+I" },
  { label: "Set projection...", sep: true },
  { label: "New project...", shortcut: "Ctrl+N" },
  { label: "Open project...", shortcut: "Ctrl+O" },
  { label: "Open recent", chevron: true },
  { label: "Recover last session", sep: true },
  { label: "Save project", shortcut: "Ctrl+S", disabled: true },
  { label: "Save project as...", shortcut: "Ctrl+Shift+S", disabled: true },
  { label: "Save as a copy...", shortcut: "Ctrl+Alt+S", disabled: true, sep: true },
  { label: "Close project", shortcut: "Ctrl+Shift+X", disabled: true, sep: true },
  { label: "Import...", sep: true },
  { label: "Export...", sep: true },
  { label: "Send to Flood Platform...", sep: true },
  { label: "Help...", shortcut: "Ctrl+?" },
];

const LAYER_MENU = [
  { label: "Add layer...", shortcut: "Ctrl+Shift+L" },
  { label: "Create layer...", shortcut: "Ctrl+L" },
  { label: "Add from Data Library...", sep: true },
  { label: "Select", chevron: true },
  { label: "Invert selection", disabled: true, sep: true },
  { label: "Toggle edit on/off", shortcut: "Ctrl+E", sep: true },
  { label: "Hide", chevron: true },
  { label: "Show", chevron: true },
  { label: "Show all", sep: true },
  { label: "Snapping settings..." },
];

const WINDOW_MENU = [
  { label: "Layout", chevron: true },
  { label: "Reset layout", shortcut: "Ctrl+R", disabled: true, sep: true },
  { label: "GIS interface", checked: true },
  { label: "Project hierarchy", checked: true },
  { label: "Data library", checked: true },
  { label: "Global animation player", checked: true },
  { label: "1D network", checked: true },
  { label: "2D build", checked: true },
  { label: "2D timesteps", checked: true },
  { label: "TUFLOW editor", checked: true },
  { label: "SWMM network", checked: true, sep: true },
  { label: "Toggle full screen", shortcut: "Ctrl+F" },
];

const TOOLBOX_MENU = [
  { label: "Open Toolbox...", shortcut: "Ctrl+T", id: "open-toolbox", sep: true },
  { label: "Global edit", chevron: true, sep: true },
  { label: "Model build tools", chevron: true },
  { label: "Model review tools", chevron: true, sep: true },
  { label: "Calibration tools", chevron: true },
  { label: "Model results", chevron: true },
  { label: "Flood mapping", chevron: true, sep: true },
  { label: "Grid tools", chevron: true },
  { label: "Shapefile tools", chevron: true },
  { label: "Forecasting", chevron: true, sep: true },
  { label: "Post-process tools", chevron: true, sep: true },
  { label: "Deprecated tools..." },
];

const HELP_MENU = [
  { label: "Keyboard shortcuts...", shortcut: "Ctrl+Shift+K", id: "shortcuts", sep: true },
  { label: "Knowledge Base", external: true },
  { label: "Video tutorials", external: true },
  { label: "Release notes", external: true, sep: true },
  { label: "Report a bug", external: true },
  { label: "Suggest a feature", external: true, sep: true },
  { label: "System info..." },
  { label: "Legal summary", external: true },
  { label: "Open data notices", external: true },
  { label: "Third party software", external: true },
];

// View > Base map submenu (fm-v8.0-menu-view-base-map spec, node 13:13958)
// — only Open Street Map / None are wired to real basemap state (same two
// options the Home ribbon's Basemap dropdown supports); the OS Ordnance
// Survey layers all need an API key this demo doesn't have.
const BASEMAP_DISABLED_REASON = "Requires an API key — not available in this demo";
function buildBaseMapSubmenu(basemap, setBasemap) {
  const opt = (id, label) => ({
    id: `basemap-${id}`, label, checked: basemap === id,
    onClick: id === "osm" || id === "none" ? () => setBasemap(id) : undefined,
    disabled: !(id === "osm" || id === "none"),
    disabledReason: id === "osm" || id === "none" ? undefined : BASEMAP_DISABLED_REASON,
  });
  return [
    opt("osm", "Open Street Map"),
    opt("os-satellite", "OS Satellite"),
    opt("os-hybrid", "OS Hybrid"),
    opt("os-roads", "OS Roads"),
    opt("os-light", "OS Light"),
    opt("os-outdoor", "OS Outdoor"),
    { ...opt("none", "None"), sep: true },
    { label: "Base map settings...", disabled: true, disabledReason: "Not available in this demo" },
  ];
}

// View menu (fm-v8.0-menu-view spec) — only "Flow Lines" and "Base map" are
// wired to real behaviour; the rest are visual-only chrome matching the
// Figma menu, same convention as the Home ribbon's not-yet-built dropdowns.
const VIEW_MENU = [
  { label: "Base map", chevron: true },
  { label: "Web Map Services...", sep: true },
  { label: "Map decoration", chevron: true },
  { label: "Nodes", chevron: true },
  { label: "Icons", chevron: true },
  { label: "Links", chevron: true },
  { label: "Overlaps", chevron: true },
  { id: "flowlines", label: "Flow Lines" },
  { id: "groups", label: "Groups", checkable: true },
  { label: "Map annotations", chevron: true, sep: true },
  { label: "Labels settings...", sep: true },
  { label: "Zoom in", shortcut: "+" },
  { label: "Zoom out", shortcut: "-" },
  { label: "Zoom to extent", shortcut: "0", sep: true },
  { label: "Zoom to selection", shortcut: "Ctrl+↑", disabled: true },
  { label: "UI theme (system)", chevron: true },
];

function Sep() {
  return <div style={{ height: 1, background: "var(--border-primary)", margin: "4px 4px" }} />;
}

// Flyout submenu (e.g. View > Base map) — same row look as the parent
// dropdown, positioned to the parent row's right, matching the nested
// MenuItem pattern ModeRibbon's ribbon dropdowns already use for their
// own sub-lists (e.g. River > Muskingum).
function SubmenuFlyout({ items, onPick }) {
  return (
    <div
      onMouseDown={(e) => e.stopPropagation()}
      style={{
        position: "absolute", top: -5, left: "100%", marginLeft: 2, width: "max-content", minWidth: 160,
        color: "var(--text-primary)", background: "var(--surface-1)", border: "1px solid var(--border-primary)",
        borderRadius: 2, boxShadow: "0px 2px 4px rgba(0,0,0,0.1), 0px 3px 6px rgba(0,0,0,0.1)",
        padding: "4px 0", zIndex: 95,
      }}
    >
      {items.map((it, i) => (
        <div key={i}>
          <div
            onClick={it.disabled || !it.onClick ? undefined : () => { it.onClick(); onPick(); }}
            title={it.disabled ? it.disabledReason : undefined}
            style={{
              display: "flex", alignItems: "center", gap: 4, height: 24, margin: "0 4px", padding: "0 4px",
              borderRadius: 2, cursor: it.disabled ? "default" : it.onClick ? "pointer" : "default",
              opacity: it.disabled ? 0.4 : 1,
            }}
            onMouseOver={(e) => { if (!it.disabled && it.onClick) e.currentTarget.style.background = "var(--surface-3)"; }}
            onMouseOut={(e) => (e.currentTarget.style.background = "transparent")}
          >
            <div style={{ width: 16, height: 16, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              {it.checked && <Icon src={A.check} size={16} />}
            </div>
            <span style={{ flex: "1 0 0", fontSize: "var(--fs-xs)", whiteSpace: "nowrap", color: it.disabled ? "var(--text-tertiary)" : "var(--text-primary)" }}>
              {it.label}
            </span>
          </div>
          {it.sep && <Sep />}
        </div>
      ))}
    </div>
  );
}

// One top-level OS menu (General/Project/Layer/View/Window/Toolbox/Help) —
// a plain label that toggles a dropdown of `fm-v8.0-menu-row`s. Only rows
// with an `id` do anything (`onItemClick`); rows with a `submenu` open a
// flyout on hover (e.g. View > Base map); the rest are visual-only,
// matching the Figma mockup exactly (including which rows are greyed out).
function MenuTab({ label, items, isOpen, onToggle, onClose, onItemClick, checkedIds }) {
  const ref = useRef(null);
  const [subOpen, setSubOpen] = useState(null);
  useEffect(() => {
    if (!isOpen) return;
    const onDown = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onKey); };
  }, [isOpen, onClose]);
  useEffect(() => { if (!isOpen) setSubOpen(null); }, [isOpen]);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <div
        onClick={onToggle}
        style={{
          height: 32, display: "flex", alignItems: "center", justifyContent: "center",
          padding: "0 8px", fontSize: "var(--fs-xs)", cursor: "pointer", whiteSpace: "nowrap",
          background: isOpen ? "rgba(255,255,255,0.15)" : "transparent",
        }}
      >{label}</div>
      {isOpen && (
        <div style={{
          position: "absolute", top: "100%", left: 0, marginTop: 2, width: "max-content", minWidth: 176,
          color: "var(--text-primary)", background: "var(--surface-1)", border: "1px solid var(--border-primary)",
          borderRadius: 2, boxShadow: "0px 2px 4px rgba(0,0,0,0.1), 0px 3px 6px rgba(0,0,0,0.1)",
          padding: "4px 0", zIndex: 90,
        }}>
          {items.map((it, i) => {
            const checked = checkedIds?.[it.id];
            const hasSub = !!it.submenu;
            const clickable = !!it.id && !it.disabled;
            return (
              <div
                key={i}
                style={{ position: "relative" }}
                onMouseEnter={() => hasSub && setSubOpen(i)}
                onMouseLeave={() => hasSub && setSubOpen((v) => (v === i ? null : v))}
              >
                <div
                  onClick={clickable ? () => onItemClick(it) : undefined}
                  style={{
                    display: "flex", alignItems: "center", gap: 4, height: 24, margin: "0 4px", padding: "0 4px",
                    borderRadius: 2, cursor: it.disabled ? "default" : (clickable || hasSub) ? "pointer" : "default",
                    opacity: it.disabled ? 0.4 : 1,
                    background: (checked || subOpen === i) ? "var(--surface-3)" : "transparent",
                    border: checked ? "1px solid var(--surface-brand)" : "1px solid transparent",
                  }}
                  onMouseOver={(e) => { if (clickable && !checked) e.currentTarget.style.background = "var(--surface-3)"; }}
                  onMouseOut={(e) => { if (clickable) e.currentTarget.style.background = checked ? "var(--surface-3)" : "transparent"; }}
                >
                  <div style={{ width: 16, height: 16, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {it.checked && <Icon src={A.check} size={16} />}
                  </div>
                  <span style={{
                    flex: "1 0 0", fontSize: "var(--fs-xs)", whiteSpace: "nowrap",
                    color: it.disabled ? "var(--text-tertiary)" : "var(--text-primary)",
                    fontWeight: it.id ? 500 : 400,
                  }}>{it.label}</span>
                  {it.shortcut && (
                    <span style={{ fontSize: "var(--fs-xs)", color: "var(--text-tertiary)", whiteSpace: "nowrap" }}>{it.shortcut}</span>
                  )}
                  {it.chevron && <Icon src={A.keyDown} size={12} style={{ transform: "rotate(-90deg)", opacity: 0.6 }} />}
                  {it.external && <ExternalLinkGlyph />}
                </div>
                {hasSub && subOpen === i && <SubmenuFlyout items={it.submenu} onPick={onClose} />}
                {it.sep && <Sep />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// `onBeginDrag(e, items, index)` — same signature ModeRibbon uses, so a
// search result can be picked up and dropped onto the GIS canvas exactly
// like a ribbon leaf item. `onGoToLocation(lat, lon)` — a place result was
// picked instead, so pan/zoom the canvas there (see App's `goToLocation`).
// `flowLinesOn`/`setFlowLinesOn` — the View menu's "Flow Lines" toggle,
// owned by App since it also drives GisCanvas's pulse animation and the
// Flow Lines side panel. `onOpenToolbox` — Toolbox > "Open Toolbox..."
// pops the floating Toolbox window (see App.jsx). `basemap`/`setBasemap` —
// View > Base map submenu, same state the Home ribbon's Basemap dropdown
// drives (see ModeRibbon.jsx).
export default function OSWindow({ onBeginDrag, onOpenShortcuts, onGoToLocation, flowLinesOn, setFlowLinesOn, onOpenToolbox, basemap, setBasemap }) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [places, setPlaces] = useState([]);
  const [placesLoading, setPlacesLoading] = useState(false);
  const [openMenu, setOpenMenu] = useState(null);
  const boxRef = useRef(null);

  useEffect(() => {
    const onDown = (e) => { if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  // Real-world place lookup (e.g. "One Glass Wharf, Bristol"), debounced
  // against OpenStreetMap's public Nominatim geocoder — same "real OSM data,
  // no API key, demo only" spirit as the OSM basemap tiles. Only fires for
  // queries that don't already match a known tool/unit, and only once the
  // query looks like it could be a place (3+ chars).
  useEffect(() => {
    const query = q.trim();
    if (query.length < 3) { setPlaces([]); return; }
    let cancelled = false;
    setPlacesLoading(true);
    const t = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&addressdetails=0&limit=5&q=${encodeURIComponent(query)}`,
        );
        const data = await res.json();
        if (!cancelled) setPlaces(data);
      } catch {
        if (!cancelled) setPlaces([]);
      } finally {
        if (!cancelled) setPlacesLoading(false);
      }
    }, 400);
    return () => { cancelled = true; clearTimeout(t); };
  }, [q]);

  const query = q.trim().toLowerCase();
  const results = query
    ? ALL_ITEMS.filter((it) => it.label.toLowerCase().includes(query) || it.group.toLowerCase().includes(query)).slice(0, 8)
    : [];

  const menuDefs = [
    { label: "General", items: GENERAL_MENU },
    { label: "Project", items: PROJECT_MENU },
    { label: "Layer", items: LAYER_MENU },
    { label: "View", items: VIEW_MENU },
    { label: "Window", items: WINDOW_MENU },
    { label: "Toolbox", items: TOOLBOX_MENU },
    { label: "Help", items: HELP_MENU },
  ];

  const handleItemClick = (it) => {
    if (it.id === "shortcuts") onOpenShortcuts();
    if (it.id === "open-toolbox") onOpenToolbox();
    if (it.id === "flowlines") setFlowLinesOn((v) => !v);
    setOpenMenu(null);
  };

  return (
    <div style={{
      height: 32, flexShrink: 0, background: "var(--surface-brand-invert)",
      display: "flex", alignItems: "center", justifyContent: "space-between",
      color: "#fff", paddingRight: 4,
    }}>
      {/* Left: logo + menus */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, flex: "1 0 0", minWidth: 0 }}>
        <div style={{ width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Icon src={A.logo} size={32} alt="Flood Modeller" />
        </div>
        <div style={{ display: "flex", alignItems: "center" }}>
          {menuDefs.map((m) => {
            const items = m.label === "View"
              ? m.items.map((it) => {
                  if (it.id === "flowlines") return { ...it, checked: flowLinesOn };
                  if (it.label === "Base map") return { ...it, submenu: buildBaseMapSubmenu(basemap, setBasemap) };
                  return it;
                })
              : m.items;
            const checkedIds = m.label === "View" ? { flowlines: flowLinesOn } : undefined;
            return (
              <MenuTab
                key={m.label}
                label={m.label}
                items={items}
                isOpen={openMenu === m.label}
                onToggle={() => setOpenMenu((v) => (v === m.label ? null : m.label))}
                onClose={() => setOpenMenu((v) => (v === m.label ? null : v))}
                onItemClick={handleItemClick}
                checkedIds={checkedIds}
              />
            );
          })}
        </div>
      </div>

      {/* Center: global search — finds 1D units by name; drag a result onto the canvas */}
      <div ref={boxRef} style={{ width: 240, flexShrink: 0, position: "relative" }}>
        <div style={{
          width: "100%", height: 24, background: "var(--surface-2)",
          border: "1px solid var(--border-primary)", borderRadius: 2,
          display: "flex", alignItems: "center", gap: 4, padding: 4,
        }}>
          <Icon src={A.search} size={16} />
          <input
            id="fm-global-search"
            value={q}
            onChange={(e) => { setQ(e.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)}
            placeholder="Search tools and functions (Ctrl+K)"
            style={{
              flex: "1 0 0", minWidth: 0, border: "none", outline: "none", background: "transparent",
              font: "inherit", fontSize: "var(--fs-xs)", color: "var(--text-primary)",
            }}
          />
        </div>
        {open && (results.length > 0 || places.length > 0 || placesLoading) && (
          <div style={{
            position: "absolute", top: "100%", left: 0, marginTop: 2, width: 280, color: "var(--text-primary)",
            background: "var(--surface-1)", border: "1px solid var(--border-primary)",
            borderRadius: 4, boxShadow: "0 4px 16px rgba(0,0,0,0.16)", padding: 4, zIndex: 80,
            maxHeight: 320, overflowY: "auto",
          }}>
            {results.map((it) => (
              <div key={it.group + "/" + it.label}
                onMouseDown={(e) => { e.preventDefault(); setOpen(false); onBeginDrag(e, [it], 0); }}
                style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 8px", borderRadius: 2, cursor: "grab" }}
                onMouseOver={(e) => (e.currentTarget.style.background = "var(--surface-3)")}
                onMouseOut={(e) => (e.currentTarget.style.background = "transparent")}
                title="Drag onto the canvas to place">
                <Icon src={A[it.icon]} size={16} />
                <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
                  <span style={{ fontSize: "var(--fs-xs)", whiteSpace: "nowrap" }}>{it.label}</span>
                  <span style={{ fontSize: "var(--fs-xxs)", color: "var(--text-tertiary)", whiteSpace: "nowrap" }}>{it.group}</span>
                </div>
              </div>
            ))}
            {results.length > 0 && (places.length > 0 || placesLoading) && (
              <div style={{ height: 1, background: "var(--border-primary)", margin: "4px 2px" }} />
            )}
            {placesLoading && places.length === 0 && (
              <div style={{ padding: "6px 8px", fontSize: "var(--fs-xxs)", color: "var(--text-tertiary)" }}>Searching locations…</div>
            )}
            {places.map((p) => (
              <div key={p.place_id}
                onClick={() => { setOpen(false); onGoToLocation(Number(p.lat), Number(p.lon)); }}
                style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 8px", borderRadius: 2, cursor: "pointer" }}
                onMouseOver={(e) => (e.currentTarget.style.background = "var(--surface-3)")}
                onMouseOut={(e) => (e.currentTarget.style.background = "transparent")}
                title="Go to this location on the map">
                <Icon src={A.homeMarker} size={16} />
                <span style={{ fontSize: "var(--fs-xs)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.display_name}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Right: project title + window controls */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 16, flex: "1 0 0", minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center" }}>
          <div style={{ padding: "0 16px", fontSize: "var(--fs-xs)", whiteSpace: "nowrap" }}>
            Upton_Upon_Severn_rev001
          </div>
          {[A.minimise, A.dock, A.cancel].map((ic, i) => (
            <div key={i} style={{ width: 24, height: 32, display: "flex", alignItems: "center", justifyContent: "center", cursor: "default" }}>
              <Icon src={ic} size={12} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
