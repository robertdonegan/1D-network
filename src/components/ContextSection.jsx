import { A, Icon } from "../assets.jsx";

// "Results section" group bar — the Raster/Vector/Check/Logs headers in the
// Results panel (Figma FM-context-section, FMv8.2-TUFLOW-Solver 4002:12396).
// Default = mid-grey fill with a black medium label and a checked right-hand
// box (this group is switched on); Collapse = lighter fill with a muted
// label and the same box with its checkmark hidden (switched off). Despite
// the variant's Figma name, this is a visibility toggle for the whole
// group — not a row-collapser: clicking the header (or its check button)
// flips the group on/off, and callers grey out that group's own rows
// (Disabled) rather than removing them from the list. `label` is the group
// heading text; `rhsIcon` hides the right-hand button when false. `height`
// defaults to the component spec (28) but callers can pass 24 to match the
// compact overrides used inside the 2D-results panel.
export function ContextSection({ label = "Section", property1 = "Default", rhsIcon = true, height = 28, onToggle }) {
  const collapse = property1 === "Collapse";
  return (
    <div
      role={onToggle ? "button" : undefined}
      tabIndex={onToggle ? 0 : undefined}
      onClick={onToggle}
      style={{
        display: "flex", alignItems: "center", gap: 4, height,
        padding: "4px 8px", borderRadius: 2, flexShrink: 0, width: "100%",
        background: collapse ? "var(--surface-3)" : "var(--surface-4)",
        cursor: onToggle ? "pointer" : "default",
      }}
    >
      <span style={{
        flex: "1 0 0", minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        fontSize: 12, fontWeight: 500, lineHeight: "normal",
        color: collapse ? "var(--text-tertiary)" : "var(--text-primary-selected)",
      }}>
        {label}
      </span>
      {rhsIcon && (
        <button type="button" tabIndex={-1} style={{
          flexShrink: 0, width: 12, height: 12, padding: 0, cursor: onToggle ? "pointer" : "default",
          display: "flex", alignItems: "center", justifyContent: "center",
          background: "var(--neutral-600)", border: "none", borderRadius: 2,
        }}>
          <Icon src={A.check} size={10} style={{ opacity: collapse ? 0 : 1 }} />
        </button>
      )}
    </div>
  );
}