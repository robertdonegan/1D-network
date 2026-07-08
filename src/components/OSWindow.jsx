import { useState, useRef, useEffect } from "react";
import { A, Icon } from "../assets.jsx";
import { flattenRibbonItems } from "./ModeRibbon.jsx";

const menus = ["General", "Project", "Layer", "View", "Window", "Toolbox", "Help"];
const ALL_ITEMS = flattenRibbonItems();

// View menu (fm-v8.0-menu-view spec) — only "Flow Lines" is wired to real
// behaviour; the rest are visual-only chrome matching the Figma menu, same
// convention as the Home ribbon's not-yet-built dropdowns.
const VIEW_MENU = [
  { label: "Base map", chevron: true },
  { label: "Web Map Services...", sep: true },
  { label: "Map decoration", chevron: true },
  { label: "Nodes", chevron: true },
  { label: "Icons", chevron: true },
  { label: "Links", chevron: true },
  { label: "Overlaps", chevron: true },
  { id: "flowlines", label: "Flow Lines" },
  { id: "groups", label: "Groups", checkbox: true },
  { label: "Map annotations", chevron: true, sep: true },
  { label: "Labels settings...", sep: true },
  { label: "Zoom in", value: "+" },
  { label: "Zoom out", value: "-" },
  { label: "Zoom to extent", value: "0", sep: true },
  { label: "Zoom to selection", value: "Ctrl+↑", disabled: true },
  { label: "UI theme (system)", chevron: true },
];

// `onBeginDrag(e, items, index)` — same signature ModeRibbon uses, so a
// search result can be picked up and dropped onto the GIS canvas exactly
// like a ribbon leaf item. `onGoToLocation(lat, lon)` — a place result was
// picked instead, so pan/zoom the canvas there (see App's `goToLocation`).
// `flowLinesOn`/`setFlowLinesOn` — the View menu's "Flow Lines" toggle,
// owned by App since it also drives GisCanvas's pulse animation and the
// Flow Lines side panel.
export default function OSWindow({ onBeginDrag, onOpenShortcuts, onGoToLocation, flowLinesOn, setFlowLinesOn }) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [places, setPlaces] = useState([]);
  const [placesLoading, setPlacesLoading] = useState(false);
  const [viewMenuOpen, setViewMenuOpen] = useState(false);
  const boxRef = useRef(null);
  const viewRef = useRef(null);

  useEffect(() => {
    const onDown = (e) => { if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  useEffect(() => {
    if (!viewMenuOpen) return;
    const onDown = (e) => { if (viewRef.current && !viewRef.current.contains(e.target)) setViewMenuOpen(false); };
    const onKey = (e) => { if (e.key === "Escape") setViewMenuOpen(false); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onKey); };
  }, [viewMenuOpen]);

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
          {menus.map(m => {
            if (m === "View") {
              return (
                <div key={m} ref={viewRef} style={{ position: "relative" }}>
                  <div
                    onClick={() => setViewMenuOpen((v) => !v)}
                    style={{
                      height: 32, display: "flex", alignItems: "center", justifyContent: "center",
                      padding: "0 8px", fontSize: "var(--fs-xs)", cursor: "pointer", whiteSpace: "nowrap",
                      background: viewMenuOpen ? "rgba(255,255,255,0.15)" : "transparent",
                    }}
                  >{m}</div>
                  {viewMenuOpen && (
                    <div style={{
                      position: "absolute", top: "100%", left: 0, marginTop: 2, width: 200, color: "var(--text-primary)",
                      background: "var(--surface-1)", border: "1px solid var(--border-primary)",
                      borderRadius: 2, boxShadow: "0px 2px 4px rgba(0,0,0,0.1), 0px 3px 6px rgba(0,0,0,0.1)",
                      padding: "4px 0", zIndex: 90,
                    }}>
                      {VIEW_MENU.map((it, i) => {
                        const isFlowLines = it.id === "flowlines";
                        const checked = isFlowLines ? flowLinesOn : it.id === "groups" ? false : undefined;
                        const clickable = isFlowLines && !it.disabled;
                        return (
                          <div key={i}>
                            <div
                              onClick={clickable ? () => { setFlowLinesOn((v) => !v); setViewMenuOpen(false); } : undefined}
                              style={{
                                display: "flex", alignItems: "center", gap: 4, height: 24, margin: "0 4px", padding: "0 4px",
                                borderRadius: 2, cursor: it.disabled ? "default" : clickable ? "pointer" : "default",
                                opacity: it.disabled ? 0.4 : 1,
                                background: isFlowLines && flowLinesOn ? "var(--surface-3)" : "transparent",
                                border: isFlowLines && flowLinesOn ? "1px solid var(--surface-brand)" : "1px solid transparent",
                              }}
                              onMouseOver={(e) => { if (clickable && !flowLinesOn) e.currentTarget.style.background = "var(--surface-3)"; }}
                              onMouseOut={(e) => { if (clickable) e.currentTarget.style.background = isFlowLines && flowLinesOn ? "var(--surface-3)" : "transparent"; }}
                            >
                              <div style={{ width: 16, height: 16, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                {checked !== undefined && checked && <Icon src={A.check} size={16} />}
                              </div>
                              <span style={{
                                flex: "1 0 0", fontSize: "var(--fs-xs)", color: "var(--text-primary)",
                                fontWeight: isFlowLines ? 500 : 400,
                              }}>{it.label}</span>
                              {it.value && <span style={{ fontSize: "var(--fs-xs)", color: "var(--text-tertiary)" }}>{it.value}</span>}
                              {it.chevron && <Icon src={A.keyDown} size={12} style={{ transform: "rotate(-90deg)", opacity: 0.6 }} />}
                            </div>
                            {it.sep && <div style={{ height: 1, background: "var(--border-primary)", margin: "4px 4px" }} />}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }
            return (
              <div key={m}
                onClick={m === "Help" ? onOpenShortcuts : undefined}
                title={m === "Help" ? "Keyboard Shortcuts (Ctrl+Shift+K)" : undefined}
                style={{
                  height: 32, display: "flex", alignItems: "center", justifyContent: "center",
                  padding: "0 8px", fontSize: "var(--fs-xs)", cursor: m === "Help" ? "pointer" : "default", whiteSpace: "nowrap",
                }}>{m}</div>
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
