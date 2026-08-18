import { A, Icon } from "../assets.jsx";

// Generic stand-in dialog for ribbon buttons that don't have a dropdown but
// aren't wired to real functionality in this demo — matches Figma's
// "fm-v8.0-modal-frame" shell (title bar + close + body), just with plain
// placeholder body content instead of a bespoke form.
export default function PlaceholderModal({ title, icon, onClose }) {
  return (
    <div
      style={{
        position: "fixed", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
        background: "rgba(0,0,0,0.3)", zIndex: 200,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "var(--surface-1)", border: "1px solid var(--border-primary)", borderRadius: 4,
          boxShadow: "0 2px 10px 2px rgba(0,0,0,0.25)", padding: 8, width: 360,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 16 }}>
          <Icon src={A[icon] || A.settingsOutline} size={16} />
          <span style={{ flex: "1 0 0", fontSize: "var(--fs-s)", fontWeight: 500, color: "var(--text-primary-selected)" }}>{title}</span>
          <button
            onClick={onClose}
            style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 20, height: 20, border: "none", background: "transparent", cursor: "pointer", borderRadius: 2 }}
            onMouseOver={(e) => (e.currentTarget.style.background = "var(--surface-3)")}
            onMouseOut={(e) => (e.currentTarget.style.background = "transparent")}
          >
            <Icon src={A.cancel} size={12} />
          </button>
        </div>
        <p style={{ margin: "0 0 24px 0", fontSize: "var(--fs-s)", color: "var(--text-secondary)", lineHeight: 1.5 }}>
          This is a placeholder for the "{title}" dialog — not wired up to real functionality in this demo.
        </p>
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button
            onClick={onClose}
            style={{
              padding: "8px 16px", background: "var(--surface-brand)", border: "none", borderRadius: 4,
              cursor: "pointer", fontSize: "var(--fs-xs)", color: "#fff",
            }}
            onMouseOver={(e) => (e.currentTarget.style.background = "var(--blue-700)")}
            onMouseOut={(e) => (e.currentTarget.style.background = "var(--surface-brand)")}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
