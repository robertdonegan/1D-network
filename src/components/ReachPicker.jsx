import { useRef, useEffect } from "react";

// Floating list of every reach currently on the network, opened by clicking
// a reach line — lets a user reassign the whole clicked stretch to a
// different (already-named) reach, or back to automatic topology grouping.
export default function ReachPicker({ x, y, options, currentKey, onPick, onClose }) {
  const boxRef = useRef(null);

  useEffect(() => {
    const onDown = (e) => { if (boxRef.current && !boxRef.current.contains(e.target)) onClose(); };
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onKey); };
  }, [onClose]);

  return (
    <div ref={boxRef} onMouseDown={(e) => e.stopPropagation()} style={{
      position: "absolute", left: x, top: y, zIndex: 40, width: 200,
      background: "var(--surface-1)", border: "1px solid var(--border-primary)",
      borderRadius: 4, boxShadow: "0 4px 16px rgba(0,0,0,0.16)", padding: 6,
      display: "flex", flexDirection: "column", gap: 2,
    }}>
      <div style={{ fontSize: "var(--fs-xxs)", color: "var(--text-tertiary)", padding: "2px 6px 4px" }}>Assign to reach</div>
      {options.map((r) => (
        <div key={r.key} onClick={() => onPick(r.key)}
          style={{
            display: "flex", alignItems: "center", gap: 8, padding: "6px 8px", borderRadius: 2, cursor: "pointer",
            background: r.key === currentKey ? "var(--surface-3)" : "transparent",
          }}
          onMouseOver={(e) => (e.currentTarget.style.background = "var(--surface-3)")}
          onMouseOut={(e) => (e.currentTarget.style.background = r.key === currentKey ? "var(--surface-3)" : "transparent")}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: r.color, flexShrink: 0 }} />
          <span style={{ fontSize: "var(--fs-xs)" }}>{r.name}</span>
        </div>
      ))}
      <div style={{ height: 1, background: "var(--border-primary)", margin: "4px 2px" }} />
      <div onClick={() => onPick(null)}
        style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 8px", borderRadius: 2, cursor: "pointer" }}
        onMouseOver={(e) => (e.currentTarget.style.background = "var(--surface-3)")}
        onMouseOut={(e) => (e.currentTarget.style.background = "transparent")}>
        <span style={{ width: 8, height: 8, borderRadius: "50%", border: "1px dashed var(--text-tertiary)", flexShrink: 0 }} />
        <span style={{ fontSize: "var(--fs-xs)", color: "var(--text-secondary)" }}>Automatic (topology)</span>
      </div>
    </div>
  );
}
