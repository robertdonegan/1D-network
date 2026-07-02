import { useState, useMemo, useRef, useEffect } from "react";
import { A, Icon } from "../assets.jsx";
import { flattenRibbonItems } from "./ModeRibbon.jsx";

const ITEMS = flattenRibbonItems();

// Floating searchable list of every 1D node group / sub-group, used to
// quickly pick a unit type for a new vertex or a dropped connector.
export default function NodePicker({ x, y, onPick, onClose }) {
  const [q, setQ] = useState("");
  const inputRef = useRef(null);
  const boxRef = useRef(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  useEffect(() => {
    const onDown = (e) => { if (boxRef.current && !boxRef.current.contains(e.target)) onClose(); };
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onKey); };
  }, [onClose]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return ITEMS;
    return ITEMS.filter((it) => it.label.toLowerCase().includes(s) || it.group.toLowerCase().includes(s));
  }, [q]);

  return (
    <div ref={boxRef} onMouseDown={(e) => e.stopPropagation()} style={{
      position: "absolute", left: x, top: y, zIndex: 40, width: 244,
      background: "var(--surface-1)", border: "1px solid var(--border-primary)",
      borderRadius: 4, boxShadow: "0 4px 16px rgba(0,0,0,0.16)", padding: 6,
      display: "flex", flexDirection: "column", gap: 4,
    }}>
      <input ref={inputRef} value={q} onChange={(e) => setQ(e.target.value)}
        placeholder="Search 1D units…"
        style={{
          font: "inherit", fontSize: "var(--fs-xs)", padding: "6px 8px",
          border: "1px solid var(--border-primary)", borderRadius: 2, outline: "none",
        }} />
      <div style={{ maxHeight: 260, overflowY: "auto", display: "flex", flexDirection: "column" }}>
        {filtered.length === 0 && (
          <div style={{ padding: "8px 6px", fontSize: "var(--fs-xxs)", color: "var(--text-tertiary)" }}>No matches</div>
        )}
        {filtered.map((it, i) => (
          <div key={it.group + "/" + it.label + i}
            onClick={() => onPick(it)}
            style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 8px", borderRadius: 2, cursor: "pointer" }}
            onMouseOver={(e) => (e.currentTarget.style.background = "var(--surface-3)")}
            onMouseOut={(e) => (e.currentTarget.style.background = "transparent")}>
            <Icon src={A[it.icon]} size={16} />
            <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
              <span style={{ fontSize: "var(--fs-xs)", whiteSpace: "nowrap" }}>{it.label}</span>
              <span style={{ fontSize: "var(--fs-xxs)", color: "var(--text-tertiary)", whiteSpace: "nowrap" }}>{it.group}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
