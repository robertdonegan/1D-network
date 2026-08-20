import { useState, useRef, useEffect } from "react";
import { A, Icon } from "../assets.jsx";

// Figma "FM-v8-Edit-basic-tools" (file "Flood-Modeller-Molecules", node
// 3984:14082) — the middle-top pill toolbar that appears only while Live
// Edit is active. The pen/stop-edit toggle itself lives in GisCanvas's left
// tool rail (its own "fm-v8.0-tool" select-state, matching the isolated
// component at Molecules node 1568:11508 — every tool button here shares
// that same component, which is why an armed tool always highlights red
// rather than the neutral-grey generic ribbon buttons use elsewhere: every
// button on this toolbar only exists while Live Edit is active, so an
// armed tool should read as part of the same "you're editing" state as the
// rail's stop-edit pill and the canvas's red border) — this component is
// everything to its right.
//
// All the real state (which sub-tool is armed, snapping on/off, undo/redo
// history) lives in GisCanvas, which owns the actual polygon data and
// canvas interactions — this component is a thin controlled view over it,
// same pattern as `dirty`/`setDirty` for the save-flow gate. A few of the
// dropdown items below (moveVertex/deleteVertex/rotateShape/reverseShape/
// deleteShape sub-tools, snap style) don't have matching GisCanvas
// interaction logic yet — this pass gets the toolbar's shape and icons
// right per the updated Figma spec; wiring their canvas behaviour is a
// follow-up.

function Sep() {
  return <div style={{ width: 1, height: 24, background: "var(--border-primary)", flexShrink: 0 }} />;
}

// Reusable small tool button — mirrors the Figma "fm-v8.0-tool" component's
// default/hover/select states.
function ToolButton({ icon, title, active, disabled, onClick, iconStyle }) {
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
    </button>
  );
}

// One row inside a dropdown menu — icon + label, optionally disabled (with
// a tooltip explaining why) or showing a checkmark for the current radio
// choice (snap style).
function MenuRow({ icon, label, checked, disabled, disabledReason, onClick }) {
  const [hover, setHover] = useState(false);
  return (
    <div
      title={disabled ? disabledReason : undefined}
      onClick={disabled ? undefined : onClick}
      onMouseOver={() => setHover(true)}
      onMouseOut={() => setHover(false)}
      style={{
        display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", borderRadius: 2,
        cursor: disabled ? "default" : "pointer", opacity: disabled ? 0.4 : 1, whiteSpace: "nowrap",
        background: hover && !disabled ? "var(--surface-3)" : "transparent",
      }}
    >
      <Icon src={icon} size={14} />
      <span style={{ fontSize: "var(--fs-xs)", color: "var(--text-primary)", flex: "1 0 0" }}>{label}</span>
      {checked && <Icon src={A.check} size={12} />}
    </div>
  );
}

function MenuSep() {
  return <div style={{ height: 1, margin: "4px 0", background: "var(--border-primary)" }} />;
}

// A tool button whose main body arms the currently-picked sub-tool (icon
// reflects that choice) while a small corner chevron opens a dropdown to
// change which sub-tool that is — matches Figma's "fm-v8.0-tool" + tiny
// instance-swap corner button pattern used for Vertex/Move/Snap/Save/Undo.
function SplitTool({ icon, title, active, onClick, menu, menuWidth = 180 }) {
  const [hover, setHover] = useState(false);
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
        title={title}
        onClick={onClick}
        onMouseOver={() => setHover(true)}
        onMouseOut={() => setHover(false)}
        style={{
          position: "relative", width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center",
          border: "none", borderRadius: 2, padding: 4, flexShrink: 0, cursor: "pointer",
          background: active ? "var(--red-700)" : open ? "var(--neutral-200)" : hover ? "var(--neutral-200)" : "transparent",
        }}
      >
        <Icon src={icon} size={16} style={active ? { filter: "brightness(0) invert(1)" } : null} />
        <div
          role="button"
          title="More options"
          onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
          style={{
            position: "absolute", right: -1, bottom: -1, width: 9, height: 9,
            display: "flex", alignItems: "flex-end", justifyContent: "flex-end",
          }}
        >
          <div style={{
            width: 0, height: 0, borderLeft: "3.5px solid transparent",
            borderBottom: `3.5px solid ${active ? "#fff" : "var(--text-tertiary)"}`,
          }} />
        </div>
      </button>
      {open && (
        <div style={{
          position: "absolute", top: "100%", left: 0, marginTop: 2, width: menuWidth, zIndex: 60,
          background: "var(--surface-1)", border: "1px solid var(--border-primary)",
          borderRadius: 4, boxShadow: "0 4px 16px rgba(0,0,0,0.12)", padding: 4,
        }}>
          {menu.map((item, i) => item.sep
            ? <MenuSep key={i} />
            : <MenuRow key={item.label} {...item} onClick={() => { item.onClick(); setOpen(false); }} />)}
        </div>
      )}
    </div>
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

const VERTEX_TOOLS = {
  addVertex: { icon: "editAddVertex", label: "Add vertex", hint: "Add vertex — click a line to insert one (hold and drag to place it precisely); once a shape's active, click roughly between two of its points too. Hover an existing vertex and press Delete/Backspace to remove it" },
  moveVertex: { icon: "editMoveVertex", label: "Move vertex", hint: "Move vertex — drag to reposition (move only, no adding or deleting here)" },
  deleteVertex: { icon: "editDeleteVertex", label: "Delete vertex", hint: "Delete vertex — click one to remove it (delete only, no moving or adding here)" },
};
const SHAPE_TOOLS = {
  movePolygon: { icon: "editMovePolygon", label: "Move shape", hint: "Move shape — drag to reposition" },
  rotateShape: { icon: "editRotateShape", label: "Rotate shape", hint: "Rotate shape — drag around its centre; hold Shift for 15° steps" },
  reverseShape: { icon: "editReverseShape", label: "Reverse shape", hint: "Reverse shape — click flips left/right, Alt+click flips top/bottom" },
  deleteShape: { icon: "editDeleteShape", label: "Delete shape", hint: "Delete shape — click to select it, then Delete/Backspace to remove" },
};
const SNAP_STYLES = {
  point: { icon: "editSnapPoint", label: "Snap to point" },
  line: { icon: "editSnapLine", label: "Snap to line" },
  pointOrLine: { icon: "editSnapPointLine", label: "Snap to point or line" },
  endpoint: { icon: "editAddVertex", label: "Snap to endpoint" },
  mapGrid: { icon: "editSnapMapGrid", label: "Snap to map unit grid" },
};

// `dirty`/`setDirty` — shared with the left rail's stop-edit button so it
// knows whether to show the Discard/Cancel/Save dialog on exit. `subTool`/
// `setSubTool` arm which polygon tool is active — Pen draws a brand new
// polygon; the Vertex/Shape split-tools arm whichever sub-op was last
// picked from their dropdown (see GisCanvas's onWrapDown/polyBodyDown/
// polyVertexDown for the interactions already wired: pen, addVertex,
// movePolygon, viewAttribute; moveVertex/deleteVertex/rotateShape/
// reverseShape/deleteShape are new ids GisCanvas doesn't special-case yet).
// `snapOn` gates GisCanvas's vertex-snap-to-nearby-vertex behaviour and its
// visual ring; `snapStyle` (which flavour of snap) is UI-only for now.
export default function EditToolbar({ dirty, setDirty, subTool, setSubTool, snapOn, setSnapOn, onUndo, onRedo, canUndo, canRedo, onRevert }) {
  const [vertexChoice, setVertexChoice] = useState("addVertex");
  const [shapeChoice, setShapeChoice] = useState("movePolygon");
  const [snapStyle, setSnapStyle] = useState("point");
  const pickTool = (id) => setSubTool((v) => (v === id ? null : id));

  return (
    <div style={{
      position: "absolute", top: 6, left: "50%", transform: "translateX(-50%)", zIndex: 12,
      display: "flex", alignItems: "center", gap: 6, padding: "4px 8px",
      background: "var(--surface-1)", border: "1px solid var(--border-primary)", borderRadius: 4,
      boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
    }}>
      <ToolButton icon={A.editPenTool} title="Draw new polygon — click to add points, Enter/dbl-click to finish [P]" active={subTool === "pen"} onClick={() => pickTool("pen")} />

      <SplitTool
        icon={A[VERTEX_TOOLS[vertexChoice].icon]}
        title={VERTEX_TOOLS[vertexChoice].hint}
        active={subTool === vertexChoice}
        onClick={() => pickTool(vertexChoice)}
        menu={Object.entries(VERTEX_TOOLS).map(([id, t]) => ({
          icon: A[t.icon], label: t.label, checked: vertexChoice === id,
          onClick: () => { setVertexChoice(id); setSubTool(id); },
        }))}
      />
      <SplitTool
        icon={A[SHAPE_TOOLS[shapeChoice].icon]}
        title={SHAPE_TOOLS[shapeChoice].hint}
        active={subTool === shapeChoice}
        onClick={() => pickTool(shapeChoice)}
        menu={Object.entries(SHAPE_TOOLS).map(([id, t]) => ({
          icon: A[t.icon], label: t.label, checked: shapeChoice === id,
          onClick: () => { setShapeChoice(id); setSubTool(id); },
        }))}
      />
      <SplitTool
        icon={A.editSnapPoint}
        title={snapOn ? "Snapping on — click to turn off" : "Snapping off — click to turn on"}
        active={snapOn}
        onClick={() => setSnapOn((v) => !v)}
        menuWidth={200}
        menu={[
          ...Object.entries(SNAP_STYLES).map(([id, s]) => ({
            icon: A[s.icon], label: s.label, checked: snapStyle === id,
            onClick: () => { setSnapStyle(id); setSnapOn(true); },
          })),
          { sep: true },
          { icon: A.editTraceLine, label: "Trace along line", onClick: () => {} },
          { sep: true },
          { icon: A.editSnapSettings, label: "Snapping settings", disabled: true, disabledReason: "Not yet implemented", onClick: () => {} },
        ]}
      />
      <SnapToLayersDropdown />
      <ToolButton icon={A.editViewAttribute} title="Layer attributes — click a polygon" active={subTool === "viewAttribute"} onClick={() => pickTool("viewAttribute")} />
      <Sep />

      <SplitTool
        icon={A.editSave}
        title={dirty ? "Save changes" : "Nothing to save yet"}
        onClick={() => setDirty(false)}
        menu={[
          { icon: A.editSave, label: "Save", disabled: !dirty, disabledReason: "Nothing to save yet", onClick: () => setDirty(false) },
          { icon: A.editSaveAs, label: "Save as", disabled: true, disabledReason: "Not yet implemented", onClick: () => {} },
        ]}
      />
      <Sep />

      <SplitTool
        icon={A.editUndo}
        title={canUndo ? "Undo [Ctrl+Z]" : "Nothing to undo yet"}
        onClick={onUndo}
        menu={[
          { icon: A.editUndo, label: "Undo step", disabled: !canUndo, disabledReason: "Nothing to undo yet", onClick: onUndo },
          { icon: A.editRedo, label: "Redo step", disabled: !canRedo, disabledReason: "Nothing to redo yet", onClick: onRedo },
          { sep: true },
          { icon: A.editRevert, label: "Revert to start", onClick: onRevert },
        ]}
      />
    </div>
  );
}
