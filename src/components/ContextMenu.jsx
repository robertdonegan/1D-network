import { useRef, useEffect, useLayoutEffect, useState } from "react";
import { createPortal } from "react-dom";

// Right-click menu for map-view selections (single units, multi-selections,
// and grouped units) and the Project panel's layer rows. Row styling matches
// the Figma "fm-v8.0-node-select" component: white card, 1px border-primary,
// 4px radius, 24px rows. Rendered in a portal with fixed positioning so a
// panel's own overflow can never crop it; `x`/`y` are viewport (client)
// coordinates and the card flips/clamps to stay on screen.
export default function ContextMenu({ x, y, items, onClose }) {
  const boxRef = useRef(null);
  const [pos, setPos] = useState({ left: x, top: y });

  useEffect(() => {
    const onDown = (e) => { if (boxRef.current && !boxRef.current.contains(e.target)) onClose(); };
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onKey); };
  }, [onClose]);

  // Keep the whole card inside the viewport (and scrollable if it's taller
  // than the window) — measured before paint so it never flashes off-screen.
  useLayoutEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const pad = 8;
    const w = el.offsetWidth, h = el.offsetHeight;
    const left = Math.max(pad, Math.min(x, window.innerWidth - w - pad));
    const top = Math.max(pad, Math.min(y, window.innerHeight - h - pad));
    setPos({ left, top });
  }, [x, y]);

  if (!items.length) return null;

  return createPortal(
    <div ref={boxRef} onMouseDown={(e) => e.stopPropagation()} onContextMenu={(e) => e.preventDefault()} style={{
      position: "fixed", left: pos.left, top: pos.top, zIndex: 2000, width: 160,
      maxHeight: "calc(100vh - 16px)", overflowY: "auto",
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
    </div>,
    document.body
  );
}
