import { useState, useRef, useCallback, useEffect } from "react";
import { A, Icon } from "../assets.jsx";
import NodePicker from "./NodePicker.jsx";

// Node geometry (Figma: 28px footprint, 20px icon). Diamonds (Interpolate /
// Replicate) keep the same 20px icon but a tighter footprint so they read
// as compact as the square units instead of floating inside extra padding.
const OUTER = 28, ICONSZ = 20;
const DIAMOND = 24;
const PR = 5;
const MIN_SCALE = 0.25, MAX_SCALE = 4;
const WHEEL_ZOOM_FACTOR = 1.05;   // per wheel notch — gentle
const KEY_ZOOM_FACTOR = 1.2;      // per +/- keypress — a deliberate step

let uid = 0;
const genId = () => "g" + (uid++);
let mCounter = 30;

const sizeOf = n => (n.shape === "diamond" ? DIAMOND : OUTER);

// World <-> screen space. World coords are the node's stored x/y (pan+zoom
// independent); screen coords are pixels inside the canvas wrap. Node boxes
// are always drawn at their fixed screen size, so units never grow/shrink
// with zoom, only their position does.
const toScreen = (view, wx, wy) => ({ x: wx * view.scale + view.tx, y: wy * view.scale + view.ty });
const toWorld = (view, sx, sy) => ({ x: (sx - view.tx) / view.scale, y: (sy - view.ty) / view.scale });

// A node's screen-space centre. Uses the node's *fixed* on-screen size (not
// scaled), matching how it's actually rendered — computing this by scaling
// world-space half-size instead (as an earlier version did) is what caused
// icons to visibly drift off the ends of their reaches while zooming.
const centerScreen = (n, view) => {
  const s = toScreen(view, n.x, n.y), sz = sizeOf(n);
  return { x: s.x + sz / 2, y: s.y + sz / 2 };
};

// World-space position of a chain point, whether it's a real node (centre
// of its footprint) or a plain vertex (its raw stored point).
const pointWorld = (id, ed, nodesArr) => {
  const n = nodesArr.find(x => x.id === id);
  if (n) { const sz = sizeOf(n); return { x: n.x + sz / 2, y: n.y + sz / 2 }; }
  const v = ed.points.find(x => x.id === id);
  return v ? { x: v.x, y: v.y } : { x: 0, y: 0 };
};

const hit = (n, view, px, py, pad = 6) => {
  const s = toScreen(view, n.x, n.y), sz = sizeOf(n);
  return px >= s.x - pad && px <= s.x + sz + pad && py >= s.y - pad && py <= s.y + sz + pad;
};
const ports = (n, view) => {
  const s = toScreen(view, n.x, n.y), sz = sizeOf(n);
  const c = centerScreen(n, view);
  return [
    { d: "N", x: c.x, y: s.y - PR },
    { d: "E", x: s.x + sz + PR, y: c.y },
    { d: "S", x: c.x, y: s.y + sz + PR },
    { d: "W", x: s.x - PR, y: c.y },
  ];
};

function NodeBox({ iconKey, shape, selected, snap, size }) {
  const diamond = shape === "diamond";
  return (
    <div style={{
      width: size, height: size, boxSizing: "border-box", background: "#fff",
      borderRadius: diamond ? 2 : 4,
      border: `2px solid ${selected ? "var(--blue-700)" : "var(--text-primary)"}`,
      display: "flex", alignItems: "center", justifyContent: "center",
      transform: diamond ? "rotate(45deg)" : "none",
      boxShadow: snap ? "0 0 0 3px rgba(70,138,243,0.5)" : "none",
    }}>
      <img src={A[iconKey]} alt="" draggable={false}
        style={{ width: ICONSZ, height: ICONSZ, display: "block", transform: diamond ? "rotate(-45deg)" : "none", pointerEvents: "none" }} />
    </div>
  );
}

// Left vertical tool rail (select / rectangle / measure / query / comment / edit)
const railTools = [
  { icon: A.cursorSelect,   name: "Select" },
  { icon: A.rectangleSelect,name: "Rectangle select" },
  { icon: A.measureTool,    name: "Measure" },
  { icon: A.pointQuery,     name: "Point query" },
  { icon: A.comment,        name: "Comment" },
  { icon: A.edit,           name: "Edit" },
];

const btnStyle = {
  font: "inherit", fontSize: "var(--fs-xs)", padding: "5px 10px", borderRadius: 2,
  border: "1px solid var(--border-primary)", background: "var(--surface-1)", cursor: "pointer",
};

export default function GisCanvas({ nodes, setNodes, edges, setEdges, selected, setSelected, ribbonDrag, onConsumeRibbonDrag }) {
  const [hovered, setHovered] = useState(null);
  const [dragNode, setDragNode] = useState(null);
  const [dragVertex, setDragVertex] = useState(null);
  const [dragCurve, setDragCurve] = useState(null);
  const [wire, setWire] = useState(null);
  const [snapTo, setSnapTo] = useState(null);
  const [hoverSeg, setHoverSeg] = useState(null);
  const [dropHint, setDropHint] = useState(false);
  const [activeTool, setActiveTool] = useState(0);
  const [view, setView] = useState({ scale: 1, tx: 0, ty: 0 });
  const [panMode, setPanMode] = useState(false);
  const [spaceHeld, setSpaceHeld] = useState(false);
  const [panDrag, setPanDrag] = useState(null);
  const [picker, setPicker] = useState(null);
  const [confirmId, setConfirmId] = useState(null);
  const wrapRef = useRef(null);

  const pt = e => {
    const r = wrapRef.current.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  const openPicker = (sx, sy, extra) => {
    const el = wrapRef.current;
    const w = el ? el.clientWidth : 800, h = el ? el.clientHeight : 600;
    const pw = 244, ph = 300;
    const x = Math.min(Math.max(8, sx), Math.max(8, w - pw - 8));
    const y = Math.min(Math.max(8, sy), Math.max(8, h - ph - 8));
    setPicker({ x, y, ...extra });
  };

  const zoomBy = useCallback((factor, center) => {
    const el = wrapRef.current;
    const cx = center ? center.x : (el ? el.clientWidth / 2 : 400);
    const cy = center ? center.y : (el ? el.clientHeight / 2 : 300);
    setView(v => {
      const newScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, v.scale * factor));
      const w = toWorld(v, cx, cy);
      return { scale: newScale, tx: cx - w.x * newScale, ty: cy - w.y * newScale };
    });
  }, []);

  // Wheel = zoom, centred on the cursor. Attached natively so preventDefault
  // reliably stops page scroll (React's onWheel is passive by default).
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const onWheel = (e) => {
      e.preventDefault();
      const r = el.getBoundingClientRect();
      zoomBy(e.deltaY < 0 ? WHEEL_ZOOM_FACTOR : 1 / WHEEL_ZOOM_FACTOR, { x: e.clientX - r.left, y: e.clientY - r.top });
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [zoomBy]);

  // Clear the "drop here" affordance once a ribbon drag ends.
  useEffect(() => { if (!ribbonDrag) setDropHint(false); }, [ribbonDrag]);

  const onMove = useCallback(e => {
    const p = pt(e);
    if (ribbonDrag && !dropHint) setDropHint(true);
    if (panDrag) {
      setView(v => ({ ...v, tx: panDrag.tx0 + (e.clientX - panDrag.sx), ty: panDrag.ty0 + (e.clientY - panDrag.sy) }));
      return;
    }
    const h = nodes.find(n => hit(n, view, p.x, p.y));
    setHovered(h ? h.id : null);
    if (dragNode) {
      const w = toWorld(view, p.x - dragNode.ox, p.y - dragNode.oy);
      setNodes(ns => ns.map(n => n.id === dragNode.id ? { ...n, x: w.x, y: w.y } : n));
    }
    if (dragVertex) {
      const w = toWorld(view, p.x - dragVertex.ox, p.y - dragVertex.oy);
      setEdges(es => es.map(ed => ed.id !== dragVertex.edgeId ? ed : {
        ...ed, points: ed.points.map(v => v.id === dragVertex.pid ? { ...v, x: w.x, y: w.y } : v),
      }));
    }
    if (dragCurve) {
      const w = toWorld(view, p.x - dragCurve.ox, p.y - dragCurve.oy);
      setEdges(es => es.map(ed => ed.id !== dragCurve.edgeId ? ed : {
        ...ed, curves: { ...(ed.curves || {}), [dragCurve.key]: { x: w.x, y: w.y } },
      }));
    }
    if (wire) {
      const s = nodes.find(n => n.id !== wire.fromId && hit(n, view, p.x, p.y));
      setSnapTo(s ? s.id : null);
      const c = s ? centerScreen(s, view) : { x: p.x, y: p.y };
      setWire(w => ({ ...w, x2: c.x, y2: c.y }));
    }
  }, [nodes, dragNode, dragVertex, dragCurve, wire, panDrag, view, ribbonDrag, dropHint]);

  const onUp = useCallback(e => {
    if (ribbonDrag) {
      const p = pt(e);
      const w = toWorld(view, p.x, p.y);
      const item = ribbonDrag.items[ribbonDrag.index];
      const sz = sizeOf(item);
      const id = genId(); const label = "M0" + (mCounter++);
      setNodes(ns => [...ns, { id, icon: item.icon, shape: item.shape, x: w.x - sz / 2, y: w.y - sz / 2, label, unitLabel: item.label }]);
      setSelected(id);
      setDropHint(false);
      onConsumeRibbonDrag();
      return;
    }
    if (panDrag) { setPanDrag(null); return; }
    if (wire) {
      if (snapTo) {
        const dup = edges.some(e2 => (e2.from === wire.fromId && e2.to === snapTo) || (e2.from === snapTo && e2.to === wire.fromId));
        if (!dup) setEdges(es => [...es, { id: genId(), from: wire.fromId, to: snapTo, points: [] }]);
      } else {
        openPicker(wire.x2, wire.y2, { mode: "create", fromId: wire.fromId, atWorld: toWorld(view, wire.x2, wire.y2) });
      }
    }
    setDragNode(null); setDragVertex(null); setDragCurve(null); setWire(null); setSnapTo(null);
  }, [ribbonDrag, wire, snapTo, edges, view, onConsumeRibbonDrag]);

  // Alt/Option+click on a node or vertex toggles a bezier handle on every
  // reach segment touching that point (adds one at the segment midpoint if
  // absent, removes it if present) instead of starting a position-drag.
  const toggleCurvesAt = (pointId) => {
    setEdges(es => es.map(ed => {
      const chain = [ed.from, ...ed.points.map(p => p.id), ed.to];
      if (!chain.includes(pointId)) return ed;
      const curves = { ...(ed.curves || {}) };
      let changed = false;
      for (let i = 0; i < chain.length - 1; i++) {
        if (chain[i] !== pointId && chain[i + 1] !== pointId) continue;
        const key = chain[i] + "|" + chain[i + 1];
        if (curves[key]) {
          delete curves[key];
        } else {
          const p1 = pointWorld(chain[i], ed, nodes), p2 = pointWorld(chain[i + 1], ed, nodes);
          curves[key] = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
        }
        changed = true;
      }
      return changed ? { ...ed, curves } : ed;
    }));
  };

  const nodeDown = (e, id) => {
    e.stopPropagation();
    if (e.altKey) { toggleCurvesAt(id); return; }
    const p = pt(e); const n = nodes.find(x => x.id === id);
    const s = toScreen(view, n.x, n.y);
    setSelected(id); setDragNode({ id, ox: p.x - s.x, oy: p.y - s.y });
  };
  const portDown = (e, fromId, px, py) => { e.stopPropagation(); setWire({ fromId, x1: px, y1: py, x2: px, y2: py }); };

  const vertexDown = (e, edgeId, pid) => {
    e.stopPropagation();
    if (e.altKey) { toggleCurvesAt(pid); return; }
    const edge = edges.find(x => x.id === edgeId);
    const v = edge.points.find(x => x.id === pid);
    const p = pt(e); const s = toScreen(view, v.x, v.y);
    setDragVertex({ edgeId, pid, ox: p.x - s.x, oy: p.y - s.y });
  };
  const vertexDouble = (e, edgeId, pid) => {
    e.stopPropagation();
    const edge = edges.find(x => x.id === edgeId);
    const v = edge.points.find(x => x.id === pid);
    const s = toScreen(view, v.x, v.y);
    openPicker(s.x, s.y, { mode: "convert", edgeId, pid });
  };
  const curveDown = (e, edgeId, key) => {
    e.stopPropagation();
    const edge = edges.find(x => x.id === edgeId);
    const c = edge.curves[key];
    const p = pt(e); const s = toScreen(view, c.x, c.y);
    setDragCurve({ edgeId, key, ox: p.x - s.x, oy: p.y - s.y });
  };
  const addVertex = (edgeId, segIndex, worldMid) => {
    setEdges(es => es.map(ed => {
      if (ed.id !== edgeId) return ed;
      const pts = [...ed.points];
      pts.splice(segIndex, 0, { id: genId(), x: worldMid.x, y: worldMid.y });
      return { ...ed, points: pts };
    }));
  };

  const delNode = (id) => {
    setNodes(ns => ns.filter(n => n.id !== id));
    setEdges(es => es.filter(e => e.from !== id && e.to !== id));
    setSelected(null);
  };

  const handlePick = (item) => {
    if (!picker) return;
    const shape = item.shape || "square";
    const sz = shape === "diamond" ? DIAMOND : OUTER;
    if (picker.mode === "create") {
      const id = genId(); const label = "M0" + (mCounter++);
      setNodes(ns => [...ns, { id, icon: item.icon, shape, x: picker.atWorld.x - sz / 2, y: picker.atWorld.y - sz / 2, label, unitLabel: item.label }]);
      setEdges(es => [...es, { id: genId(), from: picker.fromId, to: id, points: [] }]);
      setSelected(id);
    } else if (picker.mode === "convert") {
      const edge = edges.find(x => x.id === picker.edgeId);
      if (edge) {
        const idx = edge.points.findIndex(x => x.id === picker.pid);
        const v = edge.points[idx];
        const before = edge.points.slice(0, idx);
        const after = edge.points.slice(idx + 1);
        const id = genId(); const label = "M0" + (mCounter++);
        const e1 = { id: genId(), from: edge.from, to: id, points: before };
        const e2 = { id: genId(), from: id, to: edge.to, points: after };
        setNodes(ns => [...ns, { id, icon: item.icon, shape, x: v.x - sz / 2, y: v.y - sz / 2, label, unitLabel: item.label }]);
        setEdges(es => es.filter(x => x.id !== picker.edgeId).concat([e1, e2]));
        setSelected(id);
      }
    }
    setPicker(null);
  };

  // Keyboard: Delete/Backspace opens a confirm dialog (no direct delete);
  // Escape backs out of whatever's active, in priority order; Space pans;
  // =/+ and -/_ step-zoom in/out.
  useEffect(() => {
    const isTyping = (e) => { const t = (e.target.tagName || "").toLowerCase(); return t === "input" || t === "textarea"; };
    const onKey = (e) => {
      if (e.key === "Escape") {
        if (picker) return setPicker(null);
        if (confirmId) return setConfirmId(null);
        if (wire) { setWire(null); setSnapTo(null); return; }
        return setSelected(null);
      }
      if ((e.key === "Delete" || e.key === "Backspace") && selected && !confirmId && !picker && !isTyping(e)) {
        e.preventDefault(); setConfirmId(selected);
      }
      if (e.code === "Space" && !spaceHeld && !isTyping(e)) { e.preventDefault(); setSpaceHeld(true); }
      if ((e.key === "=" || e.key === "+") && !isTyping(e)) { e.preventDefault(); zoomBy(KEY_ZOOM_FACTOR); }
      if ((e.key === "-" || e.key === "_") && !isTyping(e)) { e.preventDefault(); zoomBy(1 / KEY_ZOOM_FACTOR); }
    };
    const onKeyUp = (e) => { if (e.code === "Space") setSpaceHeld(false); };
    document.addEventListener("keydown", onKey);
    document.addEventListener("keyup", onKeyUp);
    return () => { document.removeEventListener("keydown", onKey); document.removeEventListener("keyup", onKeyUp); };
  }, [selected, confirmId, picker, wire, spaceHeld, zoomBy]);

  // Middle-click, space/Pan-tool held drag always pans. A plain left-click
  // hold on empty canvas also pans, but only while nothing is selected —
  // otherwise it deselects (as before).
  const onWrapDown = (e) => {
    if (e.button === 1 || ((panMode || spaceHeld) && e.button === 0)) {
      e.preventDefault();
      setPanDrag({ sx: e.clientX, sy: e.clientY, tx0: view.tx, ty0: view.ty });
      return;
    }
    if (e.target === e.currentTarget) {
      if (e.button === 0 && !selected) {
        setPanDrag({ sx: e.clientX, sy: e.clientY, tx0: view.tx, ty0: view.ty });
        return;
      }
      setSelected(null); setPicker(null);
    }
  };

  const confirmNode = confirmId ? nodes.find(n => n.id === confirmId) : null;
  const isPanning = panMode || spaceHeld;

  return (
    <div style={{ flex: "1 0 0", minWidth: 0, height: "100%", position: "relative", display: "flex", flexDirection: "column" }}>
      <div ref={wrapRef}
        style={{
          flex: "1 0 0", position: "relative", overflow: "hidden",
          background: "radial-gradient(var(--neutral-700) 1px, transparent 1px)",
          backgroundSize: `${28 * view.scale}px ${28 * view.scale}px`,
          backgroundPosition: `${view.tx}px ${view.ty}px`,
          backgroundColor: "#eef0ec",
          border: dropHint ? "1px dashed var(--blue-700)" : "1px solid var(--border-primary)", borderRadius: 4,
          cursor: ribbonDrag ? "copy" : panDrag ? "grabbing" : isPanning ? "grab" : (dragNode || dragVertex || dragCurve || wire) ? "crosshair" : "default",
        }}
        onMouseMove={onMove} onMouseUp={onUp}
        onMouseDown={onWrapDown}
        onMouseLeave={() => { setDragNode(null); setDragVertex(null); setDragCurve(null); setWire(null); setSnapTo(null); setHovered(null); setPanDrag(null); }}>

        {/* Left tool rail */}
        <div style={{
          position: "absolute", top: 12, left: 12, zIndex: 12,
          display: "flex", flexDirection: "column", gap: 2, padding: 4,
          background: "var(--surface-1)", border: "1px solid var(--border-primary)", borderRadius: 4,
          boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
        }}>
          {railTools.map((t, i) => (
            <button key={t.name} title={t.name} onClick={() => setActiveTool(i)}
              style={{
                width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center",
                border: "none", borderRadius: 2, cursor: "pointer",
                background: activeTool === i ? "var(--surface-4)" : "transparent",
              }}
              onMouseOver={(e) => { if (activeTool !== i) e.currentTarget.style.background = "var(--surface-3)"; }}
              onMouseOut={(e) => { if (activeTool !== i) e.currentTarget.style.background = "transparent"; }}>
              <Icon src={t.icon} size={16} />
            </button>
          ))}
        </div>

        {/* Right nav controls: reset view / zoom in / toggle pan */}
        <div style={{ position: "absolute", top: 12, right: 12, zIndex: 12, display: "flex", flexDirection: "column", gap: 8 }}>
          {[
            { icon: A.northStar, name: "Reset view", onClick: () => setView({ scale: 1, tx: 0, ty: 0 }), active: false },
            { icon: A.zoomTool,  name: "Zoom in (or press =)", onClick: () => zoomBy(KEY_ZOOM_FACTOR), active: false },
            { icon: A.pan,       name: "Pan",         onClick: () => setPanMode(m => !m), active: panMode },
          ].map((b) => (
            <div key={b.name} title={b.name} onClick={b.onClick} style={{
              width: 34, height: 34, borderRadius: "50%", background: b.active ? "var(--surface-4)" : "var(--surface-1)",
              border: "1px solid var(--border-primary)", boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
              display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
            }}>
              <Icon src={b.icon} size={18} />
            </div>
          ))}
        </div>

        {/* Reaches (as editable polylines, optionally curved) + active wire */}
        <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}>
          {edges.map(e => {
            const fn = nodes.find(n => n.id === e.from), tn = nodes.find(n => n.id === e.to);
            if (!fn || !tn) return null;
            const chain = [
              { id: e.from, screen: centerScreen(fn, view) },
              ...e.points.map(v => ({ id: v.id, screen: toScreen(view, v.x, v.y) })),
              { id: e.to, screen: centerScreen(tn, view) },
            ];
            return (
              <g key={e.id}>
                {chain.slice(0, -1).map((c1, i) => {
                  const c2 = chain[i + 1];
                  const key = c1.id + "|" + c2.id;
                  const ctrl = e.curves?.[key];
                  if (ctrl) {
                    const cs = toScreen(view, ctrl.x, ctrl.y);
                    return (
                      <g key={i}>
                        <path d={`M ${c1.screen.x} ${c1.screen.y} Q ${cs.x} ${cs.y} ${c2.screen.x} ${c2.screen.y}`}
                          stroke="var(--reach)" strokeWidth={2.5} fill="none" strokeLinecap="round" />
                        <line x1={c1.screen.x} y1={c1.screen.y} x2={cs.x} y2={cs.y} stroke="var(--blue-700)" strokeWidth={1} strokeDasharray="3 3" opacity={0.5} />
                        <line x1={c2.screen.x} y1={c2.screen.y} x2={cs.x} y2={cs.y} stroke="var(--blue-700)" strokeWidth={1} strokeDasharray="3 3" opacity={0.5} />
                        <circle cx={cs.x} cy={cs.y} r={5} fill="var(--blue-700)" stroke="#fff" strokeWidth={1.5}
                          style={{ pointerEvents: "all", cursor: dragCurve?.key === key ? "grabbing" : "grab" }}
                          onMouseDown={(ev) => curveDown(ev, e.id, key)} />
                      </g>
                    );
                  }
                  const mx = (c1.screen.x + c2.screen.x) / 2, my = (c1.screen.y + c2.screen.y) / 2;
                  const segKey = e.id + ":" + i;
                  const isHov = hoverSeg === segKey;
                  return (
                    <g key={i}>
                      <line x1={c1.screen.x} y1={c1.screen.y} x2={c2.screen.x} y2={c2.screen.y} stroke="var(--reach)" strokeWidth={2.5} strokeLinecap="round" />
                      <circle cx={mx} cy={my} r={7} fill="transparent" style={{ pointerEvents: "all", cursor: "copy" }}
                        onMouseEnter={() => setHoverSeg(segKey)} onMouseLeave={() => setHoverSeg(null)}
                        onClick={() => addVertex(e.id, i, toWorld(view, mx, my))} />
                      {isHov && (
                        <g style={{ pointerEvents: "none" }}>
                          <circle cx={mx} cy={my} r={6} fill="var(--blue-700)" />
                          <line x1={mx - 3} y1={my} x2={mx + 3} y2={my} stroke="#fff" strokeWidth={1.4} />
                          <line x1={mx} y1={my - 3} x2={mx} y2={my + 3} stroke="#fff" strokeWidth={1.4} />
                        </g>
                      )}
                    </g>
                  );
                })}
                {e.points.map(v => {
                  const s = toScreen(view, v.x, v.y);
                  return (
                    <circle key={v.id} cx={s.x} cy={s.y} r={5} fill="#fff" stroke="var(--reach)" strokeWidth={2}
                      style={{ pointerEvents: "all", cursor: dragVertex?.pid === v.id ? "grabbing" : "grab" }}
                      onMouseDown={(ev) => vertexDown(ev, e.id, v.id)}
                      onDoubleClick={(ev) => vertexDouble(ev, e.id, v.id)} />
                  );
                })}
              </g>
            );
          })}
          {wire && <line x1={wire.x1} y1={wire.y1} x2={wire.x2} y2={wire.y2} stroke="var(--blue-700)" strokeWidth={2} strokeDasharray="6 3" strokeLinecap="round" />}
        </svg>

        {/* Nodes */}
        {nodes.map(n => {
          const s = toScreen(view, n.x, n.y);
          const sz = sizeOf(n);
          const isHov = hovered === n.id, isSel = selected === n.id, isSnap = snapTo === n.id;
          const showPorts = isHov && !dragNode && !dragVertex && !dragCurve && !panDrag;
          return (
            <div key={n.id}>
              {(isHov || isSel) && (
                <div style={{ position: "absolute", left: s.x + sz / 2, top: s.y - 16, transform: "translateX(-50%)", fontSize: "var(--fs-xxs)", color: "var(--text-secondary)", whiteSpace: "nowrap", pointerEvents: "none" }}>
                  {n.label}
                </div>
              )}
              <div onMouseDown={e => nodeDown(e, n.id)} title="Alt/Option-click to add a curve handle" style={{ position: "absolute", left: s.x, top: s.y, cursor: dragNode?.id === n.id ? "grabbing" : "grab" }}>
                <NodeBox iconKey={n.icon} shape={n.shape} selected={isSel} snap={isSnap} size={sz} />
              </div>
              {showPorts && ports(n, view).map(p => (
                <div key={p.d} onMouseDown={e => portDown(e, n.id, p.x, p.y)}
                  style={{ position: "absolute", left: p.x - (PR + 3), top: p.y - (PR + 3), width: (PR + 3) * 2, height: (PR + 3) * 2, cursor: "crosshair", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <div style={{ width: PR * 2, height: PR * 2, borderRadius: "50%", background: "var(--blue-700)", border: "1.5px solid #fff", pointerEvents: "none" }} />
                </div>
              ))}
            </div>
          );
        })}

        {/* Quick-add picker: opened on vertex double-click or a connector dropped on empty canvas */}
        {picker && <NodePicker x={picker.x} y={picker.y} onPick={handlePick} onClose={() => setPicker(null)} />}

        {/* Delete confirmation (replaces the old inline delete button) */}
        {confirmNode && (() => {
          const s = toScreen(view, confirmNode.x, confirmNode.y);
          const sz = sizeOf(confirmNode);
          return (
            <div onMouseDown={(e) => e.stopPropagation()} style={{
              position: "absolute", left: Math.min(s.x + sz + 8, (wrapRef.current?.clientWidth || 800) - 220), top: Math.max(8, s.y - 8), zIndex: 45,
              background: "var(--surface-1)", border: "1px solid var(--border-primary)",
              borderRadius: 4, boxShadow: "0 4px 16px rgba(0,0,0,0.16)", padding: 10, width: 208,
            }}>
              <div style={{ fontSize: "var(--fs-xs)", marginBottom: 8 }}>
                Delete {confirmNode.label}? This removes the unit and its connected reaches.
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 6 }}>
                <button onClick={() => setConfirmId(null)} style={btnStyle}>Cancel</button>
                <button onClick={() => { delNode(confirmId); setConfirmId(null); }}
                  style={{ ...btnStyle, background: "var(--red-700)", color: "#fff", border: "1px solid var(--red-700)" }}>
                  Delete
                </button>
              </div>
            </div>
          );
        })()}

        {/* Hint */}
        <div style={{ position: "absolute", left: 52, bottom: 12, fontSize: "var(--fs-xxs)", color: "var(--text-tertiary)", pointerEvents: "none" }}>
          Drag a unit onto the canvas (hold Tab to cycle the type) · Scroll or +/- to zoom · Click-hold empty canvas to pan · Click a reach to add a point · Alt/Option-click a point to curve it
        </div>
      </div>
    </div>
  );
}
