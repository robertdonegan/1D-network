import { useState, useEffect, useMemo } from "react";
import OSWindow from "./components/OSWindow.jsx";
import ModeRibbon from "./components/ModeRibbon.jsx";
import ProjectPanel from "./components/ProjectPanel.jsx";
import GisCanvas from "./components/GisCanvas.jsx";
import NetworkPanel from "./components/NetworkPanel.jsx";
import { A, Icon } from "./assets.jsx";
import { resolveReaches } from "./reaches.js";

// Nodes/edges are owned here (not inside GisCanvas) so the live network list
// in NetworkPanel can mirror exactly what's on the canvas.
const INIT_NODES = [
  { id: "n0", icon: "flowTime",     shape: "square",  x: 300, y: 40,  label: "M014",  unitLabel: "Flow-Time" },
  { id: "n1", icon: "crossSection", shape: "square",  x: 350, y: 108, label: "M015",  unitLabel: "River Section" },
  { id: "n2", icon: "interpolate",  shape: "diamond", x: 400, y: 176, label: "M0155", unitLabel: "Interpolate" },
  { id: "n3", icon: "crossSection", shape: "square",  x: 450, y: 244, label: "M016",  unitLabel: "River Section" },
  { id: "n4", icon: "calcPointWeir",shape: "square",  x: 505, y: 312, label: "M017",  unitLabel: "Calc Point Weir" },
  { id: "n5", icon: "interpolate",  shape: "diamond", x: 560, y: 380, label: "M0175", unitLabel: "Interpolate" },
  { id: "n6", icon: "crossSection", shape: "square",  x: 615, y: 448, label: "M018",  unitLabel: "River Section" },
  { id: "n7", icon: "normalDepth",  shape: "square",  x: 670, y: 516, label: "M026",  unitLabel: "Normal Depth" },
];
const INIT_EDGES = [["n0","n1"],["n1","n2"],["n2","n3"],["n3","n4"],["n4","n5"],["n5","n6"],["n6","n7"]]
  .map((e, i) => ({ id: "e" + i, from: e[0], to: e[1], points: [] }));

const PANEL_MIN = 180, PANEL_MAX = 520;

// Thin vertical drag bar between a side panel and the canvas; `onDrag`
// receives the per-move pixel delta (positive = pointer moved right).
function ResizeHandle({ onDrag }) {
  const onDown = (e) => {
    e.preventDefault();
    let lastX = e.clientX;
    const onMove = (ev) => { onDrag(ev.clientX - lastX); lastX = ev.clientX; };
    const onUp = () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };
  return (
    <div onMouseDown={onDown} title="Drag to resize" style={{
      width: 10, flexShrink: 0, cursor: "col-resize", display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <div style={{ width: 2, height: 32, borderRadius: 1, background: "var(--border-secondary)" }} />
    </div>
  );
}

export default function App() {
  const [mode, setMode] = useState("FM 1D");
  const [projectW, setProjectW] = useState(232);
  const [networkW, setNetworkW] = useState(232);
  const [nodes, setNodes] = useState(INIT_NODES);
  const [edges, setEdges] = useState(INIT_EDGES);
  // Shared with NetworkPanel so a row click selects the node on the canvas.
  const [selected, setSelected] = useState(null);
  // In-progress ribbon → canvas drag: { items, index, x, y }. Shared between
  // ModeRibbon/OSWindow (start it, cycle it with Tab) and GisCanvas (consumes it on drop).
  const [ribbonDrag, setRibbonDrag] = useState(null);
  const dragActive = !!ribbonDrag;
  const beginDrag = (e, items, index) => setRibbonDrag({ items, index, x: e.clientX, y: e.clientY });

  // Reaches (map view line colour + table grouping) computed once here so
  // GisCanvas and NetworkPanel agree on exactly the same grouping. Users can
  // manually reassign a stretch (edge.reach) which overrides the automatic
  // topology-based grouping — see reaches.js.
  const { registry, edgeColors, edgesByKey, resolvedKeyByEdge, degree } = useMemo(() => resolveReaches(nodes, edges), [nodes, edges]);
  const reassignReach = (edgeIds, reachKey) => {
    setEdges(es => es.map(e => edgeIds.includes(e.id) ? { ...e, reach: reachKey || undefined } : e));
  };

  useEffect(() => {
    if (!dragActive) return;
    const onMove = (e) => setRibbonDrag(rd => rd && { ...rd, x: e.clientX, y: e.clientY });
    const onKey = (e) => {
      if (e.key === "Tab") {
        e.preventDefault();
        setRibbonDrag(rd => {
          if (!rd || rd.items.length < 2) return rd;
          const dir = e.shiftKey ? -1 : 1;
          return { ...rd, index: (rd.index + dir + rd.items.length) % rd.items.length };
        });
      } else if (e.key === "Escape") {
        setRibbonDrag(null);
      }
    };
    // Fallback clear for a release outside the canvas; GisCanvas's own
    // mouseup (fired first, during bubbling) already consumes+clears a drop
    // that lands on it, so this only fires for drops elsewhere.
    const onUp = () => setRibbonDrag(null);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("keydown", onKey);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mouseup", onUp);
    };
  }, [dragActive]);

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", background: "var(--surface-4)", overflow: "hidden" }}>
      <OSWindow onBeginDrag={beginDrag} />
      <ModeRibbon onBeginDrag={beginDrag} mode={mode} setMode={setMode} />
      <div style={{ flex: "1 0 0", minHeight: 0, display: "flex", padding: 8 }}>
        <ProjectPanel width={projectW} empty={mode === "Home"} />
        <ResizeHandle onDrag={(dx) => setProjectW(w => Math.max(PANEL_MIN, Math.min(PANEL_MAX, w + dx)))} />
        <GisCanvas
          nodes={mode === "FM 1D" ? nodes : []} setNodes={setNodes}
          edges={mode === "FM 1D" ? edges : []} setEdges={setEdges}
          selected={selected} setSelected={setSelected}
          ribbonDrag={ribbonDrag} onConsumeRibbonDrag={() => setRibbonDrag(null)}
          edgeColors={edgeColors} degree={degree} reachRegistry={registry} edgesByReach={edgesByKey}
          reachKeyOfEdge={resolvedKeyByEdge} onReassignReach={reassignReach}
        />
        {mode === "FM 1D" && (
          <>
            <ResizeHandle onDrag={(dx) => setNetworkW(w => Math.max(PANEL_MIN, Math.min(PANEL_MAX, w - dx)))} />
            <NetworkPanel width={networkW} nodes={nodes} edges={edges} selected={selected} setSelected={setSelected}
              edgeColors={edgeColors} reachRegistry={registry} reachKeyOfEdge={resolvedKeyByEdge} />
          </>
        )}
      </div>

      {ribbonDrag && (
        <div style={{
          position: "fixed", left: ribbonDrag.x, top: ribbonDrag.y, transform: "translate(-50%, -50%)",
          zIndex: 999, pointerEvents: "none", display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: 4, background: "#fff", border: "1px solid var(--border-primary)",
            boxShadow: "0 2px 8px rgba(0,0,0,0.2)", display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Icon src={A[ribbonDrag.items[ribbonDrag.index].icon]} size={20} />
          </div>
          <div style={{ fontSize: "var(--fs-xxs)", background: "#333", color: "#fff", padding: "2px 6px", borderRadius: 2, whiteSpace: "nowrap" }}>
            {ribbonDrag.items[ribbonDrag.index].label}{ribbonDrag.items.length > 1 ? " · Tab to cycle" : ""}
          </div>
        </div>
      )}
    </div>
  );
}
