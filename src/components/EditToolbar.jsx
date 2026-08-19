import { useState, useRef, useEffect } from "react";
import { A, Icon } from "../assets.jsx";

// Figma "FM-v8-GIS-toolbar" / "fm-v8.0-edit-basic-tools" spec (file
// FMv8.0-GIS-Edit-Tools, node 2045:151429) — the middle-top pill toolbar
// that appears only while Live Edit is active. The pen/stop-edit toggle
// itself lives in GisCanvas's left tool rail (its own "fm-v8.0-tool"
// select-state, matching the isolated component at Molecules node
// 3379:1868) — this component is everything to its right.
//
// All the real state (which sub-tool is armed, snapping on/off, undo/redo
// history) lives in GisCanvas, which owns the actual polygon data and
// canvas interactions — this component is a thin controlled view over it,
// same pattern as `dirty`/`setDirty` for the save-flow gate.

function Sep() {
  return <div style={{ width: 1, height: 24, background: "var(--border-primary)", flexShrink: 0 }} />;
}

// Reusable small tool button — mirrors the Figma "fm-v8.0-tool" component's
// default/hover/select states. Selected state is red (not the neutral-grey
// generic ribbon buttons use elsewhere) since every button on this toolbar
// only exists while Live Edit is active — same red language as the rail's
// stop-edit pill and the canvas's red border, so an armed tool reads
// consistently as "you're in edit mode" rather than looking like an
// ordinary selected ribbon action.
function ToolButton({ icon, title, active, disabled, onClick, badge, hasMenu, iconStyle }) {
  const [hover, setHover] = useState(false);
  return (
    <button
      title={title}
      disabled={disabled}
      onClick={onClick}
      onMouseOver={() => setHover(true)}
      onMouseOut={() => setHover(false)}
      style={{
        position: "relative", width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center",
        border: "none", borderRadius: 2, padding: 4, flexShrink: 0,
        cursor: disabled ? "default" : "pointer",
        opacity: disabled ? 0.4 : 1,
        background: active ? "var(--red-700)" : hover && !disabled ? "var(--neutral-200)" : "transparent",
      }}
    >
      <Icon src={icon} size={16} style={{ ...(active ? { filter: "brightness(0) invert(1)" } : null), ...iconStyle }} />
      {badge && (
        <div style={{ position: "absolute", bottom: 2, right: 2, width: 3, height: 3, borderRadius: "50%", background: "var(--surface-brand)" }} />
      )}
      {hasMenu && (
        <div style={{
          position: "absolute", right: 1, bottom: 1, width: 0, height: 0,
          borderLeft: "3.5px solid transparent",
          borderBottom: `3.5px solid ${active ? "#fff" : "var(--text-tertiary)"}`,
          pointerEvents: "none",
        }} />
      )}
    </button>
  );
}

function SnapToLayersDropdown() {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);
  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((v) => !v)}
        title="Snap to layers"
        style={{
          display: "flex", alignItems: "center", gap: 4, height: 24, width: 148, padding: "0 6px",
          background: open ? "var(--neutral-200)" : "var(--surface-2)",
          border: "1px solid var(--border-primary)", borderRadius: 2, cursor: "pointer",
        }}
      >
        <Icon src={A.editLayers} size={14} />
        <span style={{ flex: "1 0 0", fontSize: "var(--fs-xs)", color: "var(--text-secondary)", textAlign: "left", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          Snap to layers
        </span>
        <Icon src={A.keyDown} size={12} style={{ transform: open ? "rotate(180deg)" : "none", opacity: 0.6 }} />
      </button>
      {open && (
        <div style={{
          position: "absolute", top: "100%", left: 0, marginTop: 2, width: 148, zIndex: 60,
          background: "var(--surface-1)", border: "1px solid var(--border-primary)",
          borderRadius: 4, boxShadow: "0 4px 16px rgba(0,0,0,0.12)", padding: 8,
        }}>
          <span style={{ fontSize: "var(--fs-xxs)", color: "var(--text-tertiary)" }}>No other layers loaded in this demo</span>
        </div>
      )}
    </div>
  );
}

// `dirty`/`setDirty` — shared with the left rail's stop-edit button so it
// knows whether to show the Discard/Cancel/Save dialog on exit. `subTool`/
// `setSubTool` arm which polygon tool is active (Pen draws a brand new
// polygon; Add vertex inserts into an existing one; Move polygon drags a
// whole shape; View attribute inspects one — see GisCanvas's onWrapDown/
// polyBodyDown/polyVertexDown for the actual interactions). `snapOn` gates
// GisCanvas's vertex-snap-to-nearby-vertex behaviour and its visual ring.
export default function EditToolbar({ dirty, setDirty, subTool, setSubTool, snapOn, setSnapOn, onUndo, onRedo, canUndo, canRedo }) {
  const pickTool = (id) => setSubTool((v) => (v === id ? null : id));

  return (
    <div style={{
      position: "absolute", top: 6, left: "50%", transform: "translateX(-50%)", zIndex: 12,
      display: "flex", alignItems: "center", gap: 6, padding: "4px 8px",
      background: "var(--surface-1)", border: "1px solid var(--border-primary)", borderRadius: 4,
      boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
    }}>
      <ToolButton icon={A.editPenTool} title="Draw new polygon — click to add points, Enter/dbl-click to finish [V]" active={subTool === "pen"} onClick={() => pickTool("pen")} />
      <Sep />
      <ToolButton icon={A.editAddVertex} title="Add vertex — click a polygon edge" active={subTool === "addVertex"} onClick={() => pickTool("addVertex")} />
      <ToolButton icon={A.editMovePolygon} title="Move polygon — drag a shape" active={subTool === "movePolygon"} onClick={() => pickTool("movePolygon")} />
      <ToolButton icon={A.editSnapPoint} title={snapOn ? "Snapping on — click to turn off" : "Snapping off — click to turn on"} active={snapOn} onClick={() => setSnapOn((v) => !v)} />
      <SnapToLayersDropdown />
      <ToolButton icon={A.editViewAttribute} title="View attribute — click a polygon" active={subTool === "viewAttribute"} onClick={() => pickTool("viewAttribute")} />
      <Sep />
      <ToolButton icon={A.editSave} title={dirty ? "Save changes" : "Nothing to save yet"} disabled={!dirty} onClick={() => setDirty(false)} />
      <Sep />
      <ToolButton icon={A.editUndo} title={canUndo ? "Undo [Ctrl+Z]" : "Nothing to undo yet"} disabled={!canUndo} onClick={onUndo} />
      <ToolButton icon={A.editUndo} title={canRedo ? "Redo [Ctrl+Shift+Z]" : "Nothing to redo yet"} disabled={!canRedo} onClick={onRedo}
        iconStyle={{ transform: "scaleX(-1)" }} />
    </div>
  );
}
