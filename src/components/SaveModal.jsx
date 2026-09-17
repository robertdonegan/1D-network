import cancel from "../assets/cancel.svg";
import { Icon } from "../assets.jsx";

// Matches the fm-v8.0-modal-frame design: white 4px-radius frame, an
// icon+title header row, a body message and a right-aligned footer row of
// Danger (Discard) / Secondary (Cancel) / Primary (Save & exit) buttons.
export default function SaveModal({ onSave, onDiscard, onCancel, layerName = "1D Network" }) {
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
          borderRadius: 4,
          boxShadow: "0px 2px 10px 2px rgba(0,0,0,0.25)",
          padding: "var(--sp-s)",
          width: 460,
          display: "flex",
          flexDirection: "column",
          gap: "var(--sp-m)",
          fontFamily: "var(--font-system)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Title row: icon + "Exit Live-Edit Mode?" + modal-function button */}
        <div
          style={{
            display: "flex",
            gap: 4,
            alignItems: "center",
            width: "100%",
          }}
        >
          <div style={{ display: "flex", flex: "1 0 0", gap: 4, alignItems: "center", minWidth: 0 }}>
            <Icon
              src={cancel}
              size={14}
              style={{ filter: "invert(0.6)" }}
            />
            <div
              style={{
                flex: "1 0 0",
                minWidth: 0,
                fontSize: "var(--fs-s)",
                fontWeight: 500,
                lineHeight: 1.4,
                color: "var(--text-primary-selected)",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              Exit Live-Edit Mode?
            </div>
          </div>
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 24,
              height: 24,
              borderRadius: 2,
            }}
            onMouseOver={(e) => (e.currentTarget.style.background = "var(--surface-3)")}
            onMouseOut={(e) => (e.currentTarget.style.background = "transparent")}
            title="Window options"
          >
            {/* fm-v8-modal-function: vertical ellipsis */}
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <circle cx="2" cy="2" r="1.2" fill="#666666" />
              <circle cx="6" cy="2" r="1.2" fill="#666666" />
              <circle cx="10" cy="2" r="1.2" fill="#666666" />
              <circle cx="2" cy="6" r="1.2" fill="#666666" />
              <circle cx="6" cy="6" r="1.2" fill="#666666" />
              <circle cx="10" cy="6" r="1.2" fill="#666666" />
              <circle cx="2" cy="10" r="1.2" fill="#666666" />
              <circle cx="6" cy="10" r="1.2" fill="#666666" />
              <circle cx="10" cy="10" r="1.2" fill="#666666" />
            </svg>
          </div>
        </div>

        {/* Body: message + footer buttons */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "var(--sp-m)",
            padding: "var(--sp-xs)",
            width: "100%",
          }}
        >
          <div
            style={{
              paddingTop: 7,
              fontSize: "var(--fs-s)",
              fontWeight: 400,
              lineHeight: 1.4,
              color: "var(--text-primary)",
            }}
          >
            Save changes to layer ‘{layerName}’ and return this file to
            Read-Only mode.
          </div>
          <div
            style={{
              display: "flex",
              gap: 8,
              alignItems: "flex-end",
              justifyContent: "flex-end",
              height: 40,
              paddingTop: "var(--sp-s)",
              width: "100%",
            }}
          >
            <button
              onClick={onDiscard}
              style={{
                height: 32,
                padding: "0 var(--sp-m)",
                background: "var(--surface-warning)",
                border: "none",
                borderRadius: 2,
                cursor: "pointer",
                fontSize: "var(--fs-s)",
                fontWeight: 500,
                color: "var(--text-invert)",
              }}
              onMouseOver={(e) =>
                (e.currentTarget.style.background = "#b52c46")
              }
              onMouseOut={(e) =>
                (e.currentTarget.style.background = "var(--surface-warning)")
              }
            >
              Discard changes
            </button>
            <button
              onClick={onCancel}
              style={{
                height: 32,
                padding: "0 var(--sp-m)",
                background: "var(--surface-1)",
                border: "1px solid var(--border-primary)",
                borderRadius: 2,
                cursor: "pointer",
                fontSize: "var(--fs-s)",
                fontWeight: 500,
                color: "var(--text-secondary)",
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
              onClick={onSave}
              style={{
                height: 32,
                padding: "0 var(--sp-m)",
                background: "var(--surface-brand)",
                border: "none",
                borderRadius: 2,
                cursor: "pointer",
                fontSize: "var(--fs-s)",
                fontWeight: 500,
                color: "var(--text-invert)",
              }}
              onMouseOver={(e) =>
                (e.currentTarget.style.background = "#0a6cdc")
              }
              onMouseOut={(e) =>
                (e.currentTarget.style.background = "var(--surface-brand)")
              }
            >
              Save &amp; exit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}