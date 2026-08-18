import { useState } from "react";
import { A, Icon } from "../assets.jsx";
import SaveModal from "./SaveModal.jsx";

const TOOLBAR_BUTTON_HEIGHT = 46;
const TOOLBAR_BUTTON_WIDTH = 46;

export default function EditToolbar({ liveEdit, setLiveEdit }) {
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [saveDropdownOpen, setSaveDropdownOpen] = useState(false);

  const handleStopEdit = () => {
    setSaveModalOpen(true);
  };

  const handleSave = () => {
    setSaveDropdownOpen(false);
    // TODO: Implement actual save logic
    console.log("Save clicked");
    setLiveEdit(false);
  };

  const handleSaveAs = () => {
    setSaveDropdownOpen(false);
    // TODO: Implement save as logic
    console.log("Save as clicked");
    setLiveEdit(false);
  };

  const handleDiscard = () => {
    setSaveModalOpen(false);
    setLiveEdit(false);
  };

  const handleCancel = () => {
    setSaveModalOpen(false);
  };

  return (
    <>
      {/* Edit Toolbar - Bottom Center */}
      <div
        style={{
          position: "absolute",
          bottom: 48,
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 12,
          display: "flex",
          alignItems: "center",
          gap: 4,
          padding: 4,
          background: "var(--surface-1)",
          border: "1px solid var(--border-primary)",
          borderRadius: 23,
          boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
        }}
      >
        {/* Stop Edit Button - Circular Red */}
        <button
          title="Stop editing"
          onClick={handleStopEdit}
          style={{
            width: TOOLBAR_BUTTON_HEIGHT,
            height: TOOLBAR_BUTTON_HEIGHT,
            borderRadius: "50%",
            background: "var(--red-700)",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon
            src={A.editStop}
            size={20}
            style={{ filter: "brightness(0) invert(1)" }}
          />
        </button>

        {/* Save Button */}
        <div style={{ position: "relative" }}>
          <button
            title="Save"
            onClick={() => setSaveDropdownOpen(!saveDropdownOpen)}
            style={{
              width: TOOLBAR_BUTTON_WIDTH,
              height: TOOLBAR_BUTTON_HEIGHT,
              borderRadius: "50%",
              background: "var(--surface-1)",
              border: "1px solid var(--border-primary)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon
              src={A.check}
              size={20}
              style={{ color: "var(--text-primary)" }}
            />
          </button>

          {/* Save Dropdown */}
          {saveDropdownOpen && (
            <div
              style={{
                position: "absolute",
                bottom: "100%",
                left: "50%",
                transform: "translateX(-50%)",
                marginBottom: 8,
                background: "var(--surface-1)",
                border: "1px solid var(--border-primary)",
                borderRadius: 4,
                boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
                padding: 4,
                minWidth: 120,
                zIndex: 50,
              }}
            >
              <button
                onClick={handleSave}
                style={{
                  display: "block",
                  width: "100%",
                  padding: "8px 12px",
                  background: "transparent",
                  border: "none",
                  textAlign: "left",
                  cursor: "pointer",
                  fontSize: "var(--fs-xs)",
                  color: "var(--text-primary)",
                  borderRadius: 2,
                }}
                onMouseOver={(e) =>
                  (e.currentTarget.style.background = "var(--surface-3)")
                }
                onMouseOut={(e) =>
                  (e.currentTarget.style.background = "transparent")
                }
              >
                Save
              </button>
              <button
                onClick={handleSaveAs}
                style={{
                  display: "block",
                  width: "100%",
                  padding: "8px 12px",
                  background: "transparent",
                  border: "none",
                  textAlign: "left",
                  cursor: "pointer",
                  fontSize: "var(--fs-xs)",
                  color: "var(--text-primary)",
                  borderRadius: 2,
                }}
                onMouseOver={(e) =>
                  (e.currentTarget.style.background = "var(--surface-3)")
                }
                onMouseOut={(e) =>
                  (e.currentTarget.style.background = "transparent")
                }
              >
                Save as
              </button>
            </div>
          )}
        </div>

        {/* Snapping Button - UI Stub */}
        <button
          title="Snapping"
          onClick={() => console.log("Snapping clicked")}
          style={{
            width: TOOLBAR_BUTTON_WIDTH,
            height: TOOLBAR_BUTTON_HEIGHT,
            borderRadius: "50%",
            background: "var(--surface-1)",
            border: "1px solid var(--border-primary)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon
            src={A.cursorSelect}
            size={20}
            style={{ color: "var(--text-primary)" }}
          />
        </button>

        {/* Undo Button - UI Stub */}
        <button
          title="Undo"
          onClick={() => console.log("Undo clicked")}
          style={{
            width: TOOLBAR_BUTTON_WIDTH,
            height: TOOLBAR_BUTTON_HEIGHT,
            borderRadius: "50%",
            background: "var(--surface-1)",
            border: "1px solid var(--border-primary)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon
            src={A.refresh}
            size={20}
            style={{ color: "var(--text-primary)" }}
          />
        </button>
      </div>

      {/* Save Modal */}
      {saveModalOpen && (
        <SaveModal
          onSave={handleSave}
          onDiscard={handleDiscard}
          onCancel={handleCancel}
        />
      )}
    </>
  );
}
