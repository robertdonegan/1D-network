export default function SaveModal({ onSave, onDiscard, onCancel }) {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,0,0.3)",
        zIndex: 100,
      }}
      onClick={onCancel}
    >
      <div
        style={{
          background: "var(--surface-1)",
          border: "1px solid var(--border-primary)",
          borderRadius: 8,
          boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
          padding: 24,
          minWidth: 320,
          maxWidth: 400,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3
          style={{
            margin: "0 0 16px 0",
            fontSize: "var(--fs-m)",
            fontWeight: 600,
            color: "var(--text-primary)",
          }}
        >
          Save changes?
        </h3>
        <p
          style={{
            margin: "0 0 24px 0",
            fontSize: "var(--fs-s)",
            color: "var(--text-secondary)",
            lineHeight: 1.5,
          }}
        >
          You have unsaved changes. Would you like to save them before exiting
          edit mode?
        </p>
        <div
          style={{
            display: "flex",
            gap: 8,
            justifyContent: "flex-end",
          }}
        >
          <button
            onClick={onCancel}
            style={{
              padding: "8px 16px",
              background: "var(--surface-1)",
              border: "1px solid var(--border-primary)",
              borderRadius: 4,
              cursor: "pointer",
              fontSize: "var(--fs-xs)",
              color: "var(--text-primary)",
            }}
            onMouseOver={(e) =>
              (e.currentTarget.style.background = "var(--surface-3)")
            }
            onMouseOut={(e) =>
              (e.currentTarget.style.background = "var(--surface-1)")
            }
          >
            Cancel
          </button>
          <button
            onClick={onDiscard}
            style={{
              padding: "8px 16px",
              background: "var(--surface-1)",
              border: "1px solid var(--border-primary)",
              borderRadius: 4,
              cursor: "pointer",
              fontSize: "var(--fs-xs)",
              color: "var(--red-700)",
            }}
            onMouseOver={(e) =>
              (e.currentTarget.style.background = "var(--surface-3)")
            }
            onMouseOut={(e) =>
              (e.currentTarget.style.background = "var(--surface-1)")
            }
          >
            Discard
          </button>
          <button
            onClick={onSave}
            style={{
              padding: "8px 16px",
              background: "var(--surface-brand)",
              border: "none",
              borderRadius: 4,
              cursor: "pointer",
              fontSize: "var(--fs-xs)",
              color: "#fff",
            }}
            onMouseOver={(e) =>
              (e.currentTarget.style.background = "var(--blue-700)")
            }
            onMouseOut={(e) =>
              (e.currentTarget.style.background = "var(--surface-brand)")
            }
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
