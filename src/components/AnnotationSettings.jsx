const SWATCHES = ["#2f6fed", "#e1455b", "#1f9d55", "#ff6100", "#7c3aed", "#333333"];

function ColorRow({ label, value, onChange }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
      <span style={{ fontSize: "var(--fs-xs)", color: "var(--text-secondary)", width: 84, flexShrink: 0 }}>{label}</span>
      <div style={{ display: "flex", gap: 6 }}>
        {SWATCHES.map((c) => (
          <button
            key={c}
            onClick={() => onChange(c)}
            title={c}
            style={{
              width: 18, height: 18, borderRadius: "50%", background: c, cursor: "pointer",
              border: value === c ? "2px solid var(--text-primary)" : "1px solid var(--border-primary)",
              padding: 0,
            }}
          />
        ))}
      </div>
    </div>
  );
}

function WidthRow({ label, value, min, max, onChange }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
      <span style={{ fontSize: "var(--fs-xs)", color: "var(--text-secondary)", width: 84, flexShrink: 0 }}>{label}</span>
      <input type="range" min={min} max={max} value={value} onChange={(e) => onChange(Number(e.target.value))} style={{ flex: 1 }} />
      <span style={{ fontSize: "var(--fs-xxs)", color: "var(--text-tertiary)", width: 20, textAlign: "right" }}>{value}</span>
    </div>
  );
}

// Home tab's "Annotation settings" — default color/width for the next
// marker/highlighter stroke or arrow drawn (doesn't retroactively restyle
// annotations already on the canvas).
export default function AnnotationSettings({ style, onChange, onClose }) {
  return (
    <div
      onMouseDown={(e) => e.stopPropagation()}
      style={{
        position: "fixed", inset: 0, zIndex: 200, display: "flex",
        alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.25)",
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "var(--surface-1)", border: "1px solid var(--border-primary)",
          borderRadius: 6, boxShadow: "0 8px 32px rgba(0,0,0,0.25)", padding: 16, width: 320,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <div style={{ fontSize: "var(--fs-s)", fontWeight: 600, color: "var(--text-primary)" }}>Annotation settings</div>
          <button onClick={onClose} style={{ border: "none", background: "transparent", cursor: "pointer", fontSize: 16, color: "var(--text-tertiary)", lineHeight: 1 }}>×</button>
        </div>

        <div style={{ fontSize: "var(--fs-xxs)", fontWeight: 600, color: "var(--text-tertiary)", marginBottom: 8, textTransform: "uppercase" }}>Marker</div>
        <ColorRow label="Colour" value={style.markerColor} onChange={(c) => onChange({ markerColor: c })} />
        <WidthRow label="Width" value={style.markerWidth} min={1} max={8} onChange={(w) => onChange({ markerWidth: w })} />

        <div style={{ fontSize: "var(--fs-xxs)", fontWeight: 600, color: "var(--text-tertiary)", margin: "12px 0 8px" }}>HIGHLIGHTER</div>
        <ColorRow label="Colour" value={style.highlighterColor} onChange={(c) => onChange({ highlighterColor: c })} />
        <WidthRow label="Width" value={style.highlighterWidth} min={6} max={28} onChange={(w) => onChange({ highlighterWidth: w })} />

        <div style={{ fontSize: "var(--fs-xxs)", fontWeight: 600, color: "var(--text-tertiary)", margin: "12px 0 8px" }}>ARROWS</div>
        <ColorRow label="Colour" value={style.arrowColor} onChange={(c) => onChange({ arrowColor: c })} />

        <div style={{ fontSize: "var(--fs-xxs)", color: "var(--text-tertiary)", marginTop: 8 }}>
          Applies to the next stroke/arrow drawn — doesn't restyle existing annotations.
        </div>
      </div>
    </div>
  );
}
