import { useState, useRef, useEffect } from "react";
import { A, Icon } from "../assets.jsx";
import { flattenRibbonItems } from "./ModeRibbon.jsx";

const menus = ["General", "Project", "Layer", "View", "Window", "Toolbox", "Help"];
const ALL_ITEMS = flattenRibbonItems();

// `onBeginDrag(e, items, index)` — same signature ModeRibbon uses, so a
// search result can be picked up and dropped onto the GIS canvas exactly
// like a ribbon leaf item.
export default function OSWindow({ onBeginDrag }) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const boxRef = useRef(null);

  useEffect(() => {
    const onDown = (e) => { if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

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
          {menus.map(m => (
            <div key={m} style={{
              height: 32, display: "flex", alignItems: "center", justifyContent: "center",
              padding: "0 8px", fontSize: "var(--fs-xs)", cursor: "default", whiteSpace: "nowrap",
            }}>{m}</div>
          ))}
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
            value={q}
            onChange={(e) => { setQ(e.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)}
            placeholder="Search tools and functions"
            style={{
              flex: "1 0 0", minWidth: 0, border: "none", outline: "none", background: "transparent",
              font: "inherit", fontSize: "var(--fs-xs)", color: "var(--text-primary)",
            }}
          />
        </div>
        {open && results.length > 0 && (
          <div style={{
            position: "absolute", top: "100%", left: 0, marginTop: 2, width: 260, color: "var(--text-primary)",
            background: "var(--surface-1)", border: "1px solid var(--border-primary)",
            borderRadius: 4, boxShadow: "0 4px 16px rgba(0,0,0,0.16)", padding: 4, zIndex: 80,
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
