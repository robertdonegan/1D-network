import { useRef, useEffect } from "react";

// Right-click menu for map-view selections (single units, multi-selections,
// and grouped units). Row styling matches the Figma "fm-v8.0-node-select"
// component: white card, 1px border-primary, 4px radius, 24px rows.
export default function ContextMenu({ x, y, items, onClose }) {
  const boxRef = useRef(null);

  useEffect(() => {
    const onDown = (e) => { if (boxRef.current && !boxRef.current.contains(e.target)) onClose(); };
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onKey); };
  }, [onClose]);

  if (!items.length) return null;

  return (
    <div ref={boxRef} onMouseDown={(e) => e.stopPropagation()} onContextMenu={(e) => e.preventDefault()} style={{
      position: "absolute", left: x, top: y, zIndex: 50, width: 160,
      background: "var(--surface-1)", border: "1px solid var(--border-primary)",
      borderRadius: 4, boxShadow: "0 4px 16px rgba(0,0,0,0.16)", padding: 4,
      display: "flex", flexDirection: "column", gap: 4,
    }}>
      {items.map((it, i) => (
        <div key={i}
          onClick={() => { it.onClick(); onClose(); }}
          style={{
            display: "flex", alignItems: "center", gap: 4, height: 24, padding: 4, borderRadius: 2,
            cursor: "pointer", fontSize: "var(--fs-xs)",
            color: it.danger ? "var(--red-700)" : "var(--text-primary)",
          }}
          onMouseOver={(e) => (e.currentTarget.style.background = "var(--surface-3)")}
          onMouseOut={(e) => (e.currentTarget.style.background = "transparent")}
        >
          {it.label}
        </div>
      ))}
    </div>
  );
}
