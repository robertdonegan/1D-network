import { useState } from "react";
import { A, Icon } from "../assets.jsx";
import { ResultsCell } from "./ResultsCell.jsx";
import { ContextSection } from "./ContextSection.jsx";
import ContextMenu from "./ContextMenu.jsx";

//  2D results viewer panel — the Results-mode right hand dock (Figma
//  fm-v8.0-TUFLOW-viewer, FMv8.2-TUFLOW-Solver 4002:12463, pulled live via the
//  Figma REST API). A "View status" section (Upton_5m_004.tcf selected +
//  3 idle .tcf runs), a drag bar, then a "Results type" section grouped into
//  Raster (×7: Depth selected, Bed elevation, Velocity, Water level, z0, z0
//  max, Time of Peak h) / Vector (×2: Velocity arrows, Vector velocity) /
//  Check (×6: 1D to 2D check R, bcc check R, DEM Z, DEM Zmin, dom check R, po
//  check R) / Logs (×1: Messages) bars (FM-context-section) with official
//  mono Flood-Icons per group (files/raster, fm2d/line-mono,
//  alerts/file-upload-complete, results/diagnostics-mono) and a display-max
//  glyph on Raster, Vector and Logs rows (Check rows have it switched off).
//  Rows are live ResultsCells: the active View-status and active Raster rows
//  start selected in p2 blue, hover highlights and reveals the options
//  ellipsis, clicking selects, and the max glyph pins the row as the max
//  result. The panel chrome (title switcher + filter/undock icons) lives in
//  PanelSlot's header to match fr-v8.0-panel-title.

const MEDIUM = 500;

// Figma's "View status" rows-only band (Frame 3465356) is a fixed 108px
// auto-layout frame (padding 4, gap 8, clipsContent) sitting under its own
// 28px section header — the 144px total height some earlier work used
// conflated the header into the band. 108 reproduces the same "3 rows +
// a sliver of the 4th" clipped peek the drawing shows.
const VIEW_STATUS_DEFAULT_HEIGHT = 108;
const VIEW_STATUS_MIN_HEIGHT = 64;
const VIEW_STATUS_MAX_HEIGHT = 360;

// Horizontal drag bar between "View status" and "Results type", replacing a
// plain divider line so the two sections can be resized against each other —
// same grabber styling as ProjectPanel's Simulation/Components divider
// (fixed height, surface-2 fill between hairline borders, a static 28x2
// grip) rather than the vertical panel-width ResizeHandle's hover treatment.
// `onDrag` receives the per-move pixel delta (positive = pointer moved down).
function RowResizeHandle({ onDrag }) {
  const onDown = (e) => {
    e.preventDefault();
    let lastY = e.clientY;
    const onMove = (ev) => { onDrag(ev.clientY - lastY); lastY = ev.clientY; };
    const onUp = () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  return (
    <div
      onMouseDown={onDown}
      title="Drag to resize"
      style={{
        height: 6, flexShrink: 0, cursor: "row-resize",
        display: "flex", alignItems: "center", justifyContent: "center",
        background: "var(--surface-2)",
        borderTop: "1px solid var(--border-primary)", borderBottom: "1px solid var(--border-primary)",
      }}
    >
      <div style={{ width: 28, height: 2, borderRadius: 1, background: "var(--border-secondary)" }} />
    </div>
  );
}

function SectionHead({ label }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 4, height: 28,
      padding: "8px 8px 4px", borderRadius: 2, flexShrink: 0,
    }}>
      <span style={{ flex: "1 0 0", fontSize: 12, fontWeight: MEDIUM, color: "var(--text-secondary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
        {label}
      </span>
      {/* Figma's "+" glyph on this row is #999999, not the SVG's raw black
          fill — invert(0.6) is the same black→#999999 conversion used for
          the ResultsCell row icons at rest. */}
      <Icon src={A.add} size={12} style={{ filter: "invert(0.6)" }} />
    </div>
  );
}

// fm-v8.0-project-section content rows — interactive ResultsCells. Rows are
// live: hover highlights, hover reveals the options ellipsis, click selects
// (p2 blue), the max glyph pins the max result. `selectedIndex` starts that
// row Selected, matching the FMv8.2 drawing (only the active View-status row
// and the active Raster result render selected on load — everything else
// starts Default). `groupVisible={false}` freezes every row in its Disabled
// variant instead — the rows stay listed (nothing collapses out of view),
// they just grey out and stop responding to hover/click, matching what the
// header's own checkmark toggles off.
function ResultCells({ labels, source, withMax, showIcon = true, selectedIndex = -1, groupVisible = true, onOpenMenu }) {
  return (
    <>
      {labels.map((label, i) => (
        <ResultsCell
          key={label}
          label={label}
          icon={source}
          showIcon={showIcon}
          showMax={Boolean(withMax)}
          defaultSelected={i === selectedIndex}
          property1={groupVisible ? undefined : "Disabled"}
          onOpenMenu={onOpenMenu ? (e) => onOpenMenu(e, label, source) : undefined}
        />
      ))}
    </>
  );
}

// FM-context-section group bars (Raster / Vector / Check / Logs) use the
// reusable ContextSection component — see ContextSection.jsx.
export function ResultsViewerBody({ onOpenLayerProperties }) {
  const [viewStatusHeight, setViewStatusHeight] = useState(VIEW_STATUS_DEFAULT_HEIGHT);
  // Right-click (or the row's "⋮" on hover) on a Raster/Vector result opens
  // the same Layer Properties modal the Layers panel uses — see App.jsx's
  // `onOpenLayerProperties`. Only these two groups carry real per-result
  // symbology (Check/Logs rows don't render a colour ramp on the map).
  const [resultMenu, setResultMenu] = useState(null); // { x, y, label, source }
  const openResultMenu = (e, label, source) => setResultMenu({ x: e.clientX, y: e.clientY, label, source });
  const resultMenuItems = resultMenu ? [
    { label: "Properties", onClick: () => onOpenLayerProperties?.({ kind: "result", id: resultMenu.label, title: resultMenu.label }) },
  ] : [];
  // Whether each Raster/Vector/Check/Logs group is switched on — the
  // FM-context-section component's own two variants (Default = checked/on,
  // Collapse = unchecked/off) exist to drive this. Clicking a group header
  // (or its check button) toggles that group's visibility; it does NOT hide
  // the group's rows from the list — they stay put, just greyed out and
  // inert (Disabled), the same way turning a layer off in a GIS layer panel
  // dims its sub-items without removing them.
  const [visible, setVisible] = useState({});
  const toggleGroup = (name) => setVisible((v) => ({ ...v, [name]: v[name] === false ? true : false }));
  const isVisible = (name) => visible[name] !== false;

  const onDrag = (dy) => {
    setViewStatusHeight((h) => Math.max(VIEW_STATUS_MIN_HEIGHT, Math.min(VIEW_STATUS_MAX_HEIGHT, h + dy)));
  };

  return (
    <div style={{ flex: "1 0 0", minHeight: 0, display: "flex", flexDirection: "column", gap: 4, background: "var(--surface-1)" }}>
      <SectionHead label="View status" />
      {/* draggable band — Frame 3465356: padding 4, gap 8, clips extra rows */}
      <div style={{
        height: viewStatusHeight, marginTop: 4, flexShrink: 0, overflowY: "auto",
        padding: 4, display: "flex", flexDirection: "column", gap: 8,
      }}>
        <ResultCells
          labels={["Upton_5m_004.tcf", "Upton_5m_003.tcf", "Upton_5m_002.tcf", "Upton_5m_001.tcf"]}
          showIcon={false}
          selectedIndex={0}
        />
      </div>

      <RowResizeHandle onDrag={onDrag} />

      <SectionHead label="Results type" />
      <div style={{ flex: "1 0 0", minHeight: 0, marginTop: 4, overflowY: "auto", padding: 8, display: "flex", flexDirection: "column", gap: 8 }}>
        <ContextSection label="Raster" height={24} property1={isVisible("Raster") ? "Default" : "Collapse"} onToggle={() => toggleGroup("Raster")} />
        <ResultCells
          labels={["Depth", "Bed elevation", "Velocity", "Water level", "z0", "z0 max", "Time of Peak h"]}
          source={A.raster}
          withMax
          selectedIndex={0}
          groupVisible={isVisible("Raster")}
          onOpenMenu={openResultMenu}
        />
        <ContextSection label="Vector" height={24} property1={isVisible("Vector") ? "Default" : "Collapse"} onToggle={() => toggleGroup("Vector")} />
        <ResultCells labels={["Velocity arrows", "Vector velocity"]} source={A.fm2dLine} withMax groupVisible={isVisible("Vector")} onOpenMenu={openResultMenu} />
        <ContextSection label="Check" height={24} property1={isVisible("Check") ? "Default" : "Collapse"} onToggle={() => toggleGroup("Check")} />
        <ResultCells
          labels={["1D to 2D check R", "bcc check R", "DEM Z", "DEM Zmin", "dom check R", "po check R"]}
          source={A.fileUploadComplete}
          groupVisible={isVisible("Check")}
        />
        <ContextSection label="Logs" height={24} property1={isVisible("Logs") ? "Default" : "Collapse"} onToggle={() => toggleGroup("Logs")} />
        <ResultCells labels={["Messages"]} source={A.diagnosticsMono} withMax groupVisible={isVisible("Logs")} />
      </div>
      {resultMenu && (
        <ContextMenu x={resultMenu.x} y={resultMenu.y} items={resultMenuItems} onClose={() => setResultMenu(null)} />
      )}
    </div>
  );
}