import { A, Icon } from "../assets.jsx";
import { ResultsCell } from "./ResultsCell.jsx";
import { ContextSection } from "./ContextSection.jsx";

//  2D results viewer panel — the Results-mode right hand dock (Figma
//  fm-v8.0-TUFLOW-viewer, FMv8.2-TUFLOW-Solver 4002:12463). A "View status"
//  section (1 active + 3 idle result cells), a separator, then a "Results
//  type" section grouped into Raster / Vector / Check / Logs bars
//  (FM-context-section) with Flood-Icons per group and a max/expand glyph on
//  Raster, Vector and Logs rows. Demo-only; nothing is wired to real results
//  data. The panel chrome (title switcher + filter/undock icons) lives in
//  PanelSlot's header to match fm-v8.0-panel-title.

const MEDIUM = 500;

function SectionHead({ label }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 4, height: 28,
      padding: "8px 8px 4px", borderRadius: 2, flexShrink: 0,
    }}>
      <span style={{ flex: "1 0 0", fontSize: 12, fontWeight: MEDIUM, color: "var(--text-secondary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
        {label}
      </span>
      <Icon src={A.add} size={12} />
    </div>
  );
}

// fm-v8.0-project-section content rows — a block of result cells, all in the
// Default component state for now (Selected/Hover etc. are implemented in
// ResultsCell but not yet driven by interactions).
function ResultCells({ count, source, withMax, showIcon = true }) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <ResultsCell key={i} property1="Default" icon={source} showIcon={showIcon} showMax={Boolean(withMax)} />
      ))}
    </>
  );
}

// FM-context-section group bars (Raster / Vector / Check / Logs) use the
// reusable ContextSection component — see ContextSection.jsx.
export function ResultsViewerBody() {
  return (
    <div style={{ flex: "1 0 0", minHeight: 0, display: "flex", flexDirection: "column", gap: 4, background: "var(--surface-1)" }}>
      <SectionHead label="View status" />
      {/* fixed 144px band; rows scroll if they outgrow it */}
      <div style={{ height: 144, display: "flex", flexDirection: "column", gap: 8, flexShrink: 0 }}>
        <div style={{ flex: "1 0 0", minHeight: 0, overflowY: "auto", padding: 4, display: "flex", flexDirection: "column", gap: 8 }}>
          <ResultCells count={4} showIcon={false} />
        </div>
      </div>

      <div style={{ padding: "4px 0", flexShrink: 0 }}>
        <div style={{ height: 1, background: "var(--border-primary)" }} />
      </div>

      <SectionHead label="Results type" />
      <div style={{ flex: "1 0 0", minHeight: 0, display: "flex", flexDirection: "column", paddingBottom: 8 }}>
        <div style={{ flex: "1 0 0", minHeight: 0, overflowY: "auto", padding: 8, display: "flex", flexDirection: "column", gap: 8 }}>
          <ContextSection label="Raster" height={24} />
          <ResultCells count={6} source={A.filesRaster} withMax />
          <ContextSection label="Vector" height={24} />
          <ResultCells count={2} source={A.fm2dLine} withMax />
          <ContextSection label="Check" height={24} />
          <ResultCells count={2} source={A.results2dUpload} />
          <ContextSection label="Logs" height={24} />
          <ResultCells count={1} source={A.panelDiagnostics} withMax />
        </div>
      </div>
    </div>
  );
}