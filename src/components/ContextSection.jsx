import { A, Icon } from "../assets.jsx";

// "Results section" group bar — the Raster/Vector/Check/Logs headers in the
// Results panel (Figma FM-context-section, FMv8.2-TUFLOW-Solver 4002:12396).
// Default = mid-grey fill with a black medium label and a right-hand check
// affordance; Collapse = lighter fill with a muted label. `label` is the
// group heading text; `rhsIcon` hides the right-hand button when false.
// `height` defaults to the component spec (28) but callers can pass 24 to
// match the compact overrides used inside the 2D-results panel.
export function ContextSection({ label = "Section", property1 = "Default", rhsIcon = true, height = 28 }) {
  const collapse = property1 === "Collapse";
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 4, height,
      padding: "4px 8px", borderRadius: 2, flexShrink: 0, width: "100%",
      background: collapse ? "var(--surface-3)" : "var(--surface-4)",
    }}>
      <span style={{
        flex: "1 0 0", minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        fontSize: 12, fontWeight: 500, lineHeight: "normal",
        color: collapse ? "var(--text-tertiary)" : "var(--text-primary-selected)",
      }}>
        {label}
      </span>
      {rhsIcon && (
        <button type="button" style={{
          flexShrink: 0, width: 12, height: 12, padding: 0, cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          background: "var(--neutral-600)", border: "none", borderRadius: 2,
        }}>
          <Icon src={A.check} size={10} />
        </button>
      )}
    </div>
  );
}