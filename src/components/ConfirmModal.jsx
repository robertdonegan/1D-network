// Generic small confirm/warning dialog — same visual language as SaveModal,
// used for actions destructive enough to need a pause (e.g. "Revert to
// start" discarding every change made since Live Edit began).
export default function ConfirmModal({ title, message, confirmLabel = "Confirm", onConfirm, onCancel }) {
  return (
    <div
      style={{
        position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
        background: "rgba(0,0,0,0.3)", zIndex: 100,
      }}
      onClick={onCancel}
    >
      <div
        style={{
          background: "var(--surface-1)", border: "1px solid var(--border-primary)", borderRadius: 8,
          boxShadow: "0 8px 32px rgba(0,0,0,0.2)", padding: 24, minWidth: 320, maxWidth: 400,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ margin: "0 0 16px 0", fontSize: "var(--fs-m)", fontWeight: 600, color: "var(--text-primary)" }}>
          {title}
        </h3>
        <p style={{ margin: "0 0 24px 0", fontSize: "var(--fs-s)", color: "var(--text-secondary)", lineHeight: 1.5 }}>
          {message}
        </p>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button
            onClick={onCancel}
            style={{
              padding: "8px 16px", background: "var(--surface-1)", border: "1px solid var(--border-primary)",
              borderRadius: 4, cursor: "pointer", fontSize: "var(--fs-xs)", color: "var(--text-primary)",
            }}
            onMouseOver={(e) => (e.currentTarget.style.background = "var(--surface-3)")}
            onMouseOut={(e) => (e.currentTarget.style.background = "var(--surface-1)")}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            style={{
              padding: "8px 16px", background: "var(--red-700)", border: "none",
              borderRadius: 4, cursor: "pointer", fontSize: "var(--fs-xs)", color: "#fff",
            }}
            onMouseOver={(e) => (e.currentTarget.style.opacity = 0.85)}
            onMouseOut={(e) => (e.currentTarget.style.opacity = 1)}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
