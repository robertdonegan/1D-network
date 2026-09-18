import { A, Icon } from "../assets.jsx";

//  2D results viewer panel (Figma fm-v8.0-TUFLOW-viewer) — shown in the
//  Results mode right-hand dock. A "View status" section plus grouped
//  "Results type" rows (Raster / Vector / Check / Logs), the active row
//  getting the brand border treatment. Demo-only; nothing is wired to real
//  result data.

function SectionHead({ label }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, height: 28, padding: "4px 8px", flexShrink: 0 }}>
      <span style={{ flex: "1 0 0", fontSize: "var(--fs-xs)", fontWeight: 500, color: "var(--text-secondary)" }}>
        {label}
      </span>
      <Icon src={A.add} size={12} />
    </div>
  );
}

function GroupHead({ label }) {
  return (
    <div style={{ padding: "2px 8px 0", fontSize: "var(--fs-xxs)", fontWeight: 600, color: "var(--text-tertiary)", letterSpacing: 0.4 }}>
      {label.toUpperCase()}
    </div>
  );
}

function Cell({ icon, label, active }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 5, height: 24, padding: "3px 6px", margin: "1px 4px",
      borderRadius: 4, cursor: "pointer",
      background: active ? "var(--surface-3)" : "transparent",
      border: active ? "1.5px solid var(--surface-brand)" : "1.5px solid transparent",
      fontSize: "var(--fs-xs)",
      fontWeight: active ? 500 : 400,
      color: active ? "var(--text-primary-selected)" : "var(--text-secondary)",
    }}>
      {icon && <Icon src={icon} size={17} style={active ? { filter: "brightness(0) saturate(100%) sepia(1) saturate(6) hue-rotate(195deg)" } : { opacity: 0.75 }} />}
      <span>{label}</span>
      {active && <div style={{ flex: "1 0 0" }} />}
      {active && <Icon src={A.expand} size={10} />}
    </div>
  );
}

export function ResultsViewerBody() {
  return (
    <div style={{ flex: "1 0 0", minHeight: 0, display: "flex", flexDirection: "column", overflow: "auto", background: "var(--surface-1)" }}>
      <SectionHead label="View status" />
      <div style={{ display: "flex", flexDirection: "column", gap: 1, padding: "0 0 8px" }}>
        <Cell label="Results cell" active />
        <Cell label="Results cell" />
        <Cell label="Results cell" />
      </div>

      <div style={{ height: 1, background: "var(--border-primary)", margin: "0 8px 3px" }} />

      <SectionHead label="Results type" />
      <div style={{ display: "flex", flexDirection: "column", gap: 1, paddingBottom: 8 }}>
        <GroupHead label="Raster" />
        <Cell icon={A.filesRaster} label="Results cell" active />
        <Cell icon={A.filesRaster} label="Results cell" />
        <GroupHead label="Vector" />
        <Cell icon={A.results2dFlowLines} label="Results cell" />
        <Cell icon={A.results2dFlowLines} label="Results cell" />
        <GroupHead label="Check" />
        <Cell icon={A.resultEmbeddedStructures} label="Results cell" />
        <Cell icon={A.resultEmbeddedStructures} label="Results cell" />
        <GroupHead label="Logs" />
        <Cell icon={A.resultsComments} label="Results cell" />
      </div>
    </div>
  );
}