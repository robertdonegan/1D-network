import { useState, useRef, useCallback, useEffect } from "react";
import { A, Icon } from "../assets.jsx";
import { NODE_MIME } from "./ModeRibbon.jsx";

// Node geometry (Figma: 28px footprint, 20px icon)
const OUTER = 28, ICONSZ = 20, PR = 5;

// Nodes carry an icon key (into A) + shape. Initial diagonal network.
const INIT_NODES = [
  { id: "n0", icon: "flowTime",    shape: "square",  x: 300, y: 40,  label: "M014" },
  { id: "n1", icon: "crossSection",shape: "square",  x: 350, y: 108, label: "M015" },
  { id: "n2", icon: "interpolate", shape: "diamond", x: 400, y: 176, label: "M0155" },
  { id: "n3", icon: "crossSection",shape: "square",  x: 450, y: 244, label: "M016" },
  { id: "n4", icon: "calcPointWeir",shape: "square", x: 505, y: 312, label: "M017" },
  { id: "n5", icon: "interpolate", shape: "diamond", x: 560, y: 380, label: "M0175" },
  { id: "n6", icon: "crossSection",shape: "square",  x: 615, y: 448, label: "M018" },
  { id: "n7", icon: "normalDepth", shape: "square",  x: 670, y: 516, label: "M026" },
];
const INIT_EDGES = [["n0","n1"],["n1","n2"],["n2","n3"],["n3","n4"],["n4","n5"],["n5","n6"],["n6","n7"]]
  .map((e, i) => ({ id: "e" + i, from: e[0], to: e[1] }));

let uid = 0;
const genId = () => "g" + (uid++);
let mCounter = 30;
const cx = n => n.x + OUTER / 2;
const cy = n => n.y + OUTER / 2;
const hit = (n, px, py, pad = 6) => px >= n.x - pad && px <= n.x + OUTER + pad && py >= n.y - pad && py <= n.y + OUTER + pad;
const ports = n => [
  { d: "N", x: cx(n), y: n.y - PR },
  { d: "E", x: n.x + OUTER + PR, y: cy(n) },
  { d: "S", x: cx(n), y: n.y + OUTER + PR },
  { d: "W", x: n.x - PR, y: cy(n) },
];

function NodeBox({ iconKey, shape, selected, snap }) {
  const diamond = shape === "diamond";
  return (
    <div style={{
      width: OUTER, height: OUTER, boxSizing: "border-box", background: "#fff", borderRadius: 2,
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

export default function GisCanvas() {
  const [nodes, setNodes] = useState(INIT_NODES);
  const [edges, setEdges] = useState(INIT_EDGES);
  const [hovered, setHovered] = useState(null);
  const [selected, setSelected] = useState(null);
  const [dragNode, setDragNode] = useState(null);
  const [wire, setWire] = useState(null);
  const [snapTo, setSnapTo] = useState(null);
  const [hoverEdge, setHoverEdge] = useState(null);
  const [dropHint, setDropHint] = useState(false);
  const [activeTool, setActiveTool] = useState(0);
  const wrapRef = useRef(null);

  const pt = e => {
    const r = wrapRef.current.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  const onMove = useCallback(e => {
    const p = pt(e);
    const h = nodes.find(n => hit(n, p.x, p.y));
    setHovered(h ? h.id : null);
    if (dragNode) setNodes(ns => ns.map(n => n.id === dragNode.id ? { ...n, x: p.x - dragNode.ox, y: p.y - dragNode.oy } : n));
    if (wire) {
      const s = nodes.find(n => n.id !== wire.fromId && hit(n, p.x, p.y));
      setSnapTo(s ? s.id : null);
      setWire(w => ({ ...w, x2: s ? cx(s) : p.x, y2: s ? cy(s) : p.y }));
    }
  }, [nodes, dragNode, wire]);

  const onUp = useCallback(() => {
    if (wire && snapTo) {
      const dup = edges.some(e => (e.from === wire.fromId && e.to === snapTo) || (e.from === snapTo && e.to === wire.fromId));
      if (!dup) setEdges(es => [...es, { id: genId(), from: wire.fromId, to: snapTo }]);
    }
    setDragNode(null); setWire(null); setSnapTo(null);
  }, [wire, snapTo, edges]);

  // ── Ribbon → canvas drop ────────────────────────────────────────────────────
  const onDrop = useCallback(e => {
    e.preventDefault();
    setDropHint(false);
    const raw = e.dataTransfer.getData(NODE_MIME) || e.dataTransfer.getData("text/plain");
    if (!raw) return;
    let d; try { d = JSON.parse(raw); } catch { return; }
    const p = pt(e);
    const id = genId();
    const label = "M0" + (mCounter++);
    setNodes(ns => [...ns, { id, icon: d.icon || "placeholder", shape: d.shape || "square", x: p.x - OUTER / 2, y: p.y - OUTER / 2, label }]);
    setSelected(id);
  }, []);

  const nodeDown = (e, id) => {
    e.stopPropagation();
    const p = pt(e); const n = nodes.find(x => x.id === id);
    setSelected(id); setDragNode({ id, ox: p.x - n.x, oy: p.y - n.y });
  };
  const portDown = (e, fromId, px, py) => { e.stopPropagation(); setWire({ fromId, x1: px, y1: py, x2: px, y2: py }); };
  const delNode = (id) => {
    setNodes(ns => ns.filter(n => n.id !== id));
    setEdges(es => es.filter(e => e.from !== id && e.to !== id));
    setSelected(null);
  };

  // Keyboard delete for the selected node
  useEffect(() => {
    const onKey = (e) => {
      if ((e.key === "Delete" || e.key === "Backspace") && selected) {
        const tag = (e.target.tagName || "").toLowerCase();
        if (tag !== "input" && tag !== "textarea") { e.preventDefault(); delNode(selected); }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [selected]);

  const selNode = nodes.find(n => n.id === selected);

  return (
    <div style={{ flex: "1 0 0", minWidth: 0, height: "100%", position: "relative", display: "flex", flexDirection: "column" }}>
      <div ref={wrapRef}
        onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "copy"; if (!dropHint) setDropHint(true); }}
        onDragLeave={(e) => { if (e.target === wrapRef.current) setDropHint(false); }}
        onDrop={onDrop}
        style={{
          flex: "1 0 0", position: "relative", overflow: "hidden",
          background: "radial-gradient(var(--neutral-700) 1px, transparent 1px)",
          backgroundSize: "28px 28px", backgroundColor: "#eef0ec",
          border: dropHint ? "1px dashed var(--blue-700)" : "1px solid var(--border-primary)", borderRadius: 4,
          cursor: (dragNode || wire) ? "crosshair" : "default",
        }}
        onMouseMove={onMove} onMouseUp={onUp}
        onMouseDown={e => { if (e.target === e.currentTarget) setSelected(null); }}
        onMouseLeave={() => { setDragNode(null); setWire(null); setSnapTo(null); setHovered(null); }}>

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

        {/* Right nav controls */}
        <div style={{ position: "absolute", top: 12, right: 12, zIndex: 12, display: "flex", flexDirection: "column", gap: 8 }}>
          {[A.northStar, A.zoomTool, A.pan].map((ic, i) => (
            <div key={i} style={{
              width: 34, height: 34, borderRadius: "50%", background: "var(--surface-1)",
              border: "1px solid var(--border-primary)", boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
              display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
            }}>
              <Icon src={ic} size={18} />
            </div>
          ))}
        </div>

        {/* Reaches + active wire */}
        <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}>
          {edges.map(e => {
            const fn = nodes.find(n => n.id === e.from), tn = nodes.find(n => n.id === e.to);
            if (!fn || !tn) return null;
            const mx = (cx(fn) + cx(tn)) / 2, my = (cy(fn) + cy(tn)) / 2;
            return (
              <g key={e.id}>
                <line x1={cx(fn)} y1={cy(fn)} x2={cx(tn)} y2={cy(tn)} stroke="var(--reach)" strokeWidth={2.5} strokeLinecap="round" />
                <circle cx={mx} cy={my} r={7} fill="transparent" style={{ pointerEvents: "all", cursor: "pointer" }}
                  onMouseEnter={() => setHoverEdge(e.id)} onMouseLeave={() => setHoverEdge(null)}
                  onClick={() => setEdges(es => es.filter(x => x.id !== e.id))} />
                {hoverEdge === e.id && <circle cx={mx} cy={my} r={5} fill="var(--reach)" style={{ pointerEvents: "none" }} />}
              </g>
            );
          })}
          {wire && <line x1={wire.x1} y1={wire.y1} x2={wire.x2} y2={wire.y2} stroke="var(--blue-700)" strokeWidth={2} strokeDasharray="6 3" strokeLinecap="round" />}
        </svg>

        {/* Nodes */}
        {nodes.map(n => {
          const isHov = hovered === n.id, isSel = selected === n.id, isSnap = snapTo === n.id;
          const showPorts = isHov && !dragNode;
          return (
            <div key={n.id}>
              {(isHov || isSel) && (
                <div style={{ position: "absolute", left: cx(n), top: n.y - 16, transform: "translateX(-50%)", fontSize: "var(--fs-xxs)", color: "var(--text-secondary)", whiteSpace: "nowrap", pointerEvents: "none" }}>
                  {n.label}
                </div>
              )}
              <div onMouseDown={e => nodeDown(e, n.id)} style={{ position: "absolute", left: n.x, top: n.y, cursor: dragNode?.id === n.id ? "grabbing" : "grab" }}>
                <NodeBox iconKey={n.icon} shape={n.shape} selected={isSel} snap={isSnap} />
              </div>
              {showPorts && ports(n).map(p => (
                <div key={p.d} onMouseDown={e => portDown(e, n.id, p.x, p.y)}
                  style={{ position: "absolute", left: p.x - (PR + 3), top: p.y - (PR + 3), width: (PR + 3) * 2, height: (PR + 3) * 2, cursor: "crosshair", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <div style={{ width: PR * 2, height: PR * 2, borderRadius: "50%", background: "var(--blue-700)", border: "1.5px solid #fff", pointerEvents: "none" }} />
                </div>
              ))}
            </div>
          );
        })}

        {/* Contextual delete for the selected node */}
        {selNode && (
          <button onClick={() => delNode(selNode.id)} title="Delete node (Del)"
            style={{
              position: "absolute", left: selNode.x + OUTER + 4, top: selNode.y - 10, zIndex: 13,
              width: 18, height: 18, borderRadius: "50%", border: "1px solid var(--red-700)",
              background: "#fff", color: "var(--red-700)", cursor: "pointer", fontSize: 11, lineHeight: 1,
              display: "flex", alignItems: "center", justifyContent: "center", padding: 0,
            }}>×</button>
        )}

        {/* Hint */}
        <div style={{ position: "absolute", left: 52, bottom: 12, fontSize: "var(--fs-xxs)", color: "var(--text-tertiary)", pointerEvents: "none" }}>
          Drag a unit from a ribbon menu (e.g. River ▾, Boundaries ▾) onto the canvas · Hover a node for connectors · Click a reach to delete
        </div>
      </div>
    </div>
  );
}
