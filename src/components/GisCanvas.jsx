import { useState, useRef, useCallback, useEffect, Fragment } from "react";
import { A, Icon } from "../assets.jsx";
import NodePicker from "./NodePicker.jsx";
import ReachPicker from "./ReachPicker.jsx";
import OsmBasemap, { lonLatToWorld } from "./OsmBasemap.jsx";
import MapFooter from "./MapFooter.jsx";
import ContextMenu from "./ContextMenu.jsx";

// Grouped-unit visuals (Figma "1D Grouped Units" — Group select box / Grouped
// state): dashed orange bounding box + translucent orange fill, reused for
// the box-select marquee, an expanded group's bounding box, and a collapsed
// group's single representative box.
const GROUP_BOX_STYLE = {
  border: "1.5px dashed #ce4c00",
  background: "rgba(255,217,177,0.2)",
  borderRadius: 1,
};
const GROUP_PAD = 16; // px, screen-space padding around member nodes for the expanded bbox

// Node geometry (Figma: 28px footprint, 20px icon). Diamonds (Interpolate /
// Replicate) keep the same 20px icon but a tighter footprint so they read
// as compact as the square units instead of floating inside extra padding.
const OUTER = 26,
  ICONSZ = 20;
const DIAMOND = 20;
const PR = 5;
const MIN_SCALE = 0.25,
  MAX_SCALE = 4;
const WHEEL_ZOOM_FACTOR = 1.05; // per wheel notch — gentle
const KEY_ZOOM_FACTOR = 1.2; // per +/- keypress — a deliberate step

let uid = 0;
const genId = () => "g" + uid++;
let mCounter = 30;

const sizeOf = (n) => (n.shape === "diamond" ? DIAMOND : OUTER);

// World <-> screen space. World coords are the node's stored x/y (pan+zoom
// +rotation independent); screen coords are pixels inside the canvas wrap.
// Node boxes are always drawn at their fixed screen size and unrotated, so
// units never grow/shrink/tilt with the view — only their position does.
const toScreen = (view, wx, wy) => {
  const rad = ((view.rotation || 0) * Math.PI) / 180;
  const cos = Math.cos(rad),
    sin = Math.sin(rad);
  const rx = wx * cos - wy * sin,
    ry = wx * sin + wy * cos;
  return { x: rx * view.scale + view.tx, y: ry * view.scale + view.ty };
};
const toWorld = (view, sx, sy) => {
  const ux = (sx - view.tx) / view.scale,
    uy = (sy - view.ty) / view.scale;
  const rad = (-(view.rotation || 0) * Math.PI) / 180;
  const cos = Math.cos(rad),
    sin = Math.sin(rad);
  return { x: ux * cos - uy * sin, y: ux * sin + uy * cos };
};

// A node's screen-space centre. Uses the node's *fixed* on-screen size (not
// scaled), matching how it's actually rendered — computing this by scaling
// world-space half-size instead (as an earlier version did) is what caused
// icons to visibly drift off the ends of their reaches while zooming.
const centerScreen = (n, view) => {
  const s = toScreen(view, n.x, n.y),
    sz = sizeOf(n);
  return { x: s.x + sz / 2, y: s.y + sz / 2 };
};

// World-space position of a chain point, whether it's a real node (centre
// of its footprint) or a plain vertex (its raw stored point).
const pointWorld = (id, ed, nodesArr) => {
  const n = nodesArr.find((x) => x.id === id);
  if (n) {
    const sz = sizeOf(n);
    return { x: n.x + sz / 2, y: n.y + sz / 2 };
  }
  const v = ed.points.find((x) => x.id === id);
  return v ? { x: v.x, y: v.y } : { x: 0, y: 0 };
};

const hit = (n, view, px, py, pad = 6) => {
  const s = toScreen(view, n.x, n.y),
    sz = sizeOf(n);
  return (
    px >= s.x - pad &&
    px <= s.x + sz + pad &&
    py >= s.y - pad &&
    py <= s.y + sz + pad
  );
};

// Closest point on segment (x1,y1)-(x2,y2) to (px,py), plus the distance —
// used to hit-test a dragged ribbon unit against reach lines (splicing it
// into the chain rather than dropping a standalone node).
const closestOnSegment = (px, py, x1, y1, x2, y2) => {
  const dx = x2 - x1,
    dy = y2 - y1;
  const lenSq = dx * dx + dy * dy;
  let t = lenSq === 0 ? 0 : ((px - x1) * dx + (py - y1) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  const cx = x1 + t * dx,
    cy = y1 + t * dy;
  return { x: cx, y: cy, dist: Math.hypot(px - cx, py - cy) };
};
const ports = (n, view) => {
  const s = toScreen(view, n.x, n.y),
    sz = sizeOf(n);
  const c = centerScreen(n, view);
  return [
    { d: "N", x: c.x, y: s.y - PR },
    { d: "E", x: s.x + sz + PR, y: c.y },
    { d: "S", x: c.x, y: s.y + sz + PR },
    { d: "W", x: s.x - PR, y: c.y },
  ];
};

// States match the Flood Component Library's Calculation Point spec:
// Default = white fill, 2px #333 border. Hover = same colours, border
// thickens to 3px. Selected = orange fill/border, overrides hover/default.
function NodeBox({ iconKey, shape, selected, hovered, snap, size }) {
  const diamond = shape === "diamond";
  const borderWidth = hovered ? 3 : 2;
  return (
    <div
      style={{
        width: size,
        height: size,
        boxSizing: "border-box",
        background: selected ? "var(--node-selected-fill)" : "#fff",
        borderRadius: diamond ? 2 : 4,
        border: `${borderWidth}px solid ${selected ? "var(--node-selected-border)" : "var(--text-primary)"}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transform: diamond ? "rotate(45deg)" : "none",
        boxShadow: snap ? "0 0 0 3px rgba(70,138,243,0.5)" : "none",
      }}
    >
      <img
        src={A[iconKey]}
        alt=""
        draggable={false}
        style={{
          width: ICONSZ,
          height: ICONSZ,
          display: "block",
          transform: diamond ? "rotate(-45deg)" : "none",
          pointerEvents: "none",
        }}
      />
    </div>
  );
}

// Left vertical tool rail (select / rectangle / measure / query / comment / edit)
const railTools = [
  { icon: A.cursorSelect, name: "Select (V)" },
  { icon: A.rectangleSelect, name: "Group select (G)" },
  { icon: A.measureTool, name: "Measure (M)" },
  { icon: A.pointQuery, name: "Query (Q)" },
  { icon: A.comment, name: "Comment" },
  { icon: A.edit, name: "Edit" },
];

const btnStyle = {
  font: "inherit",
  fontSize: "var(--fs-xs)",
  padding: "5px 10px",
  borderRadius: 2,
  border: "1px solid var(--border-primary)",
  background: "var(--surface-1)",
  cursor: "pointer",
};

export default function GisCanvas({
  nodes,
  setNodes,
  edges,
  setEdges,
  selected,
  setSelected,
  ribbonDrag,
  onConsumeRibbonDrag,
  edgeColors,
  degree,
  reachRegistry,
  edgesByReach,
  reachKeyOfEdge,
  onReassignReach,
  basemap,
  flyTo,
  onConsumeFlyTo,
}) {
  const showBasemap = basemap === "osm";
  const [hovered, setHovered] = useState(null);
  const [dragNode, setDragNode] = useState(null);
  const [dragVertex, setDragVertex] = useState(null);
  const [selectedVertex, setSelectedVertex] = useState(null); // { edgeId, pid }
  const [hoverSplice, setHoverSplice] = useState(null); // { edgeId, segIndex, x, y } — ribbon-drag hovering a reach line
  const [dragCurve, setDragCurve] = useState(null);
  const [wire, setWire] = useState(null);
  const [snapTo, setSnapTo] = useState(null);
  const [hoverSeg, setHoverSeg] = useState(null);
  const [hoverLine, setHoverLine] = useState(null);
  const [dropHint, setDropHint] = useState(false);
  const [activeTool, setActiveTool] = useState(0);
  const [navHover, setNavHover] = useState(null);
  const [view, setView] = useState({ scale: 1, tx: 0, ty: 0, rotation: 0 });
  const [panMode, setPanMode] = useState(false);
  const [zoomMode, setZoomMode] = useState(false);
  const [spaceHeld, setSpaceHeld] = useState(false);
  const [panDrag, setPanDrag] = useState(null);
  const [toolDrag, setToolDrag] = useState(null);
  const [picker, setPicker] = useState(null);
  const [reachPicker, setReachPicker] = useState(null);
  const [confirmId, setConfirmId] = useState(null);
  const [cursorWorld, setCursorWorld] = useState(null);
  const [groups, setGroups] = useState([]); // { id, name, memberIds, collapsed }
  const [marquee, setMarquee] = useState(null); // { x0,y0,x1,y1, mode: 'add'|'subtract'|'replace' }
  const [contextMenu, setContextMenu] = useState(null); // { x, y, items }
  const wrapRef = useRef(null);

  const pt = (e) => {
    const r = wrapRef.current.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  // Node id -> the group it currently belongs to (a node is a member of at
  // most one group at a time).
  const groupOfNode = {};
  for (const g of groups) for (const id of g.memberIds) groupOfNode[id] = g;

  const groupCentroidWorld = (g) => {
    const members = nodes.filter((n) => g.memberIds.includes(n.id));
    if (!members.length) return { x: 0, y: 0 };
    const cx = members.reduce((s, n) => s + n.x + sizeOf(n) / 2, 0) / members.length;
    const cy = members.reduce((s, n) => s + n.y + sizeOf(n) / 2, 0) / members.length;
    return { x: cx, y: cy };
  };

  // A chain endpoint's effective screen position — substitutes a collapsed
  // group's single representative position for any hidden member node.
  const resolveEndpoint = (nodeId) => {
    const g = groupOfNode[nodeId];
    if (g && g.collapsed) {
      const c = groupCentroidWorld(g);
      return { screen: toScreen(view, c.x, c.y), groupId: g.id };
    }
    const n = nodes.find((x) => x.id === nodeId);
    return n ? { screen: centerScreen(n, view), groupId: null } : null;
  };

  // Create a group from a multi-selection — members already in another
  // group are pulled out of it first (a node belongs to only one group).
  const createGroup = (ids) => {
    if (ids.length < 2) return;
    setGroups((gs) => {
      const cleaned = gs
        .map((g) => ({ ...g, memberIds: g.memberIds.filter((id) => !ids.includes(id)) }))
        .filter((g) => g.memberIds.length > 1);
      return [...cleaned, { id: genId(), name: "Group " + (gs.length + 1), memberIds: ids, collapsed: false }];
    });
    setSelected(ids);
  };
  const toggleGroupCollapsed = (groupId) => {
    setGroups((gs) => gs.map((g) => (g.id === groupId ? { ...g, collapsed: !g.collapsed } : g)));
  };
  const ungroup = (groupId) => {
    setGroups((gs) => gs.filter((g) => g.id !== groupId));
  };

  // Right-click menu contents for a resolved set of node ids — Create Group
  // when they're a plain multi-selection, or Collapse/Expand + Ungroup when
  // the whole selection sits inside one existing group.
  const buildMenuItems = (ids) => {
    const items = [];
    const touchedGroupIds = [...new Set(ids.map((id) => groupOfNode[id]?.id).filter(Boolean))];
    if (touchedGroupIds.length === 1 && ids.every((id) => groupOfNode[id]?.id === touchedGroupIds[0])) {
      const g = groups.find((x) => x.id === touchedGroupIds[0]);
      items.push({
        label: g.collapsed ? "Expand Group" : "Collapse Group",
        onClick: () => toggleGroupCollapsed(g.id),
      });
      items.push({ label: "Ungroup", onClick: () => ungroup(g.id) });
    } else if (ids.length > 1) {
      items.push({ label: "Create Group", onClick: () => createGroup(ids) });
    }
    if (ids.length === 1 && !groupOfNode[ids[0]]) {
      items.push({ label: "Delete", danger: true, onClick: () => setConfirmId(ids[0]) });
    }
    return items;
  };

  const onNodeContext = (e, id) => {
    e.preventDefault();
    e.stopPropagation();
    const ids = selected.includes(id) && selected.length > 1 ? selected : [id];
    if (!(selected.includes(id) && selected.length > 1)) setSelected([id]);
    const p = pt(e);
    setContextMenu({ x: p.x, y: p.y, items: buildMenuItems(ids) });
  };

  const onGroupContext = (e, g) => {
    e.preventDefault();
    e.stopPropagation();
    setSelected(g.memberIds);
    const p = pt(e);
    setContextMenu({ x: p.x, y: p.y, items: buildMenuItems(g.memberIds) });
  };

  // Mousedown on a group's box (expanded bbox or collapsed representative)
  // selects the whole group and drags every member together.
  const groupBoxDown = (e, g) => {
    e.stopPropagation();
    if (e.altKey) {
      setSelected((sel) => sel.filter((x) => !g.memberIds.includes(x)));
      return;
    }
    const p = pt(e);
    setSelectedVertex(null);
    setSelected(g.memberIds);
    const startWorld = toWorld(view, p.x, p.y);
    const startPositions = {};
    g.memberIds.forEach((nid) => {
      const n = nodes.find((x) => x.id === nid);
      if (n) startPositions[nid] = { x: n.x, y: n.y };
    });
    setDragNode({ ids: g.memberIds, startWorld, startPositions });
  };

  const openPicker = (sx, sy, extra) => {
    const el = wrapRef.current;
    const w = el ? el.clientWidth : 800,
      h = el ? el.clientHeight : 600;
    const pw = 244,
      ph = 300;
    const x = Math.min(Math.max(8, sx), Math.max(8, w - pw - 8));
    const y = Math.min(Math.max(8, sy), Math.max(8, h - ph - 8));
    setPicker({ x, y, ...extra });
  };

  const openReachPicker = (sx, sy, edgeId) => {
    const el = wrapRef.current;
    const w = el ? el.clientWidth : 800,
      h = el ? el.clientHeight : 600;
    const pw = 200,
      ph = 220;
    const x = Math.min(Math.max(8, sx), Math.max(8, w - pw - 8));
    const y = Math.min(Math.max(8, sy), Math.max(8, h - ph - 8));
    setReachPicker({ x, y, edgeId });
  };

  const zoomBy = useCallback((factor, center) => {
    const el = wrapRef.current;
    const cx = center ? center.x : el ? el.clientWidth / 2 : 400;
    const cy = center ? center.y : el ? el.clientHeight / 2 : 300;
    setView((v) => {
      const newScale = Math.min(
        MAX_SCALE,
        Math.max(MIN_SCALE, v.scale * factor),
      );
      const w = toWorld(v, cx, cy);
      return {
        ...v,
        scale: newScale,
        tx: cx - w.x * newScale,
        ty: cy - w.y * newScale,
      };
    });
  }, []);

  // Reset view helpers, pivoting around the current viewport centre so the
  // content you're looking at doesn't jump.
  const resetView = () => setView({ scale: 1, tx: 0, ty: 0, rotation: 0 });
  // Pan and Zoom are mutually exclusive persistent tools — turning one on
  // turns the other off, like a normal tool selector.
  const togglePanMode = () => setPanMode((m) => { const next = !m; if (next) setZoomMode(false); return next; });
  const toggleZoomMode = () => setZoomMode((m) => { const next = !m; if (next) setPanMode(false); return next; });
  const resetNorth = () => {
    const el = wrapRef.current;
    const cx = el ? el.clientWidth / 2 : 400,
      cy = el ? el.clientHeight / 2 : 300;
    setView((v) => {
      const w = toWorld(v, cx, cy);
      return {
        ...v,
        rotation: 0,
        tx: cx - w.x * v.scale,
        ty: cy - w.y * v.scale,
      };
    });
  };

  // One-shot "jump to this location" request from the top-bar search (see
  // App's `flyTo`/`goToLocation`) — centres the searched lon/lat, resets
  // rotation, and zooms to a plausible street-level scale.
  const FLY_TO_SCALE = 2;
  useEffect(() => {
    if (!flyTo) return;
    const el = wrapRef.current;
    const cx = el ? el.clientWidth / 2 : 400,
      cy = el ? el.clientHeight / 2 : 300;
    const w = lonLatToWorld(flyTo.lon, flyTo.lat);
    setView({ scale: FLY_TO_SCALE, rotation: 0, tx: cx - w.x * FLY_TO_SCALE, ty: cy - w.y * FLY_TO_SCALE });
    onConsumeFlyTo();
  }, [flyTo, onConsumeFlyTo]);

  // Wheel = zoom, centred on the cursor. Attached natively so preventDefault
  // reliably stops page scroll (React's onWheel is passive by default).
  // Shift slows it down and Alt inverts it, matching the nav-button drag
  // gestures below.
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const onWheel = (e) => {
      e.preventDefault();
      const r = el.getBoundingClientRect();
      const zoomingIn = (e.deltaY < 0) !== e.altKey;
      const base = zoomingIn ? WHEEL_ZOOM_FACTOR : 1 / WHEEL_ZOOM_FACTOR;
      const factor = e.shiftKey ? Math.pow(base, 0.3) : base;
      zoomBy(factor, { x: e.clientX - r.left, y: e.clientY - r.top });
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [zoomBy]);

  // Click-and-hold-drag on the North Star / Zoom / Pan nav buttons: Alt
  // inverts the direction, Shift slows it down. Releasing without moving
  // falls back to each button's plain-click shortcut.
  useEffect(() => {
    if (!toolDrag) return;
    const onMove = (e) => {
      const dx = e.clientX - toolDrag.sx,
        dy = e.clientY - toolDrag.sy;
      if (!toolDrag.moved && Math.hypot(dx, dy) > 4)
        setToolDrag((td) => td && { ...td, moved: true });
      const invert = e.altKey ? -1 : 1;
      const slow = e.shiftKey ? 0.3 : 1;
      const el = wrapRef.current;
      const cx = el ? el.clientWidth / 2 : 400,
        cy = el ? el.clientHeight / 2 : 300;

      if (toolDrag.tool === "rotate") {
        const rotation = toolDrag.startView.rotation + dx * 0.5 * slow * invert;
        const w = toWorld(toolDrag.startView, cx, cy);
        const rad = (rotation * Math.PI) / 180,
          cos = Math.cos(rad),
          sin = Math.sin(rad);
        const scale = toolDrag.startView.scale;
        setView((v) => ({
          ...v,
          rotation,
          tx: cx - (w.x * cos - w.y * sin) * scale,
          ty: cy - (w.x * sin + w.y * cos) * scale,
        }));
      } else if (toolDrag.tool === "zoom") {
        const factor = Math.pow(1.01, -dy * slow * invert);
        const newScale = Math.min(
          MAX_SCALE,
          Math.max(MIN_SCALE, toolDrag.startView.scale * factor),
        );
        const w = toWorld(toolDrag.startView, cx, cy);
        setView((v) => ({
          ...v,
          scale: newScale,
          tx: cx - w.x * newScale,
          ty: cy - w.y * newScale,
        }));
      } else if (toolDrag.tool === "pan") {
        setView((v) => ({
          ...v,
          tx: toolDrag.startView.tx + dx * slow * invert,
          ty: toolDrag.startView.ty + dy * slow * invert,
        }));
      }
    };
    const onUp = () => {
      if (!toolDrag.moved) {
        if (toolDrag.tool === "zoom") toggleZoomMode();
        else if (toolDrag.tool === "pan") togglePanMode();
        else if (toolDrag.tool === "rotate") resetView();
      }
      setToolDrag(null);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [toolDrag, zoomBy, resetView, togglePanMode, toggleZoomMode]);

  // Clear the "drop here" affordance once a ribbon drag ends.
  useEffect(() => {
    if (!ribbonDrag) {
      setDropHint(false);
      setHoverSplice(null);
    }
  }, [ribbonDrag]);

  const onMove = useCallback(
    (e) => {
      const p = pt(e);
      setCursorWorld(toWorld(view, p.x, p.y));
      if (ribbonDrag && !dropHint) setDropHint(true);
      if (marquee) {
        setMarquee((m) => m && { ...m, x1: p.x, y1: p.y });
        return;
      }
      if (panDrag) {
        const slow = e.shiftKey ? 0.3 : 1;
        const invert = e.altKey ? -1 : 1;
        setView((v) => ({
          ...v,
          tx: panDrag.tx0 + (e.clientX - panDrag.sx) * slow * invert,
          ty: panDrag.ty0 + (e.clientY - panDrag.sy) * slow * invert,
        }));
        return;
      }
      const h = nodes.find((n) => hit(n, view, p.x, p.y));
      setHovered(h ? h.id : null);
      // While dragging a ribbon unit, hovering a reach line (and not a
      // node) offers to splice the new unit into that line instead of
      // dropping it as a standalone node — see onUp's ribbonDrag handling.
      if (ribbonDrag) {
        if (h) {
          setHoverSplice(null);
        } else {
          let best = null,
            bestDist = 10;
          edges.forEach((ed) => {
            const fEnd = resolveEndpoint(ed.from),
              tEnd = resolveEndpoint(ed.to);
            if (!fEnd || !tEnd) return;
            if (fEnd.groupId && fEnd.groupId === tEnd.groupId) return;
            const chain = [
              fEnd.screen,
              ...ed.points.map((v) => toScreen(view, v.x, v.y)),
              tEnd.screen,
            ];
            for (let i = 0; i < chain.length - 1; i++) {
              const c = closestOnSegment(p.x, p.y, chain[i].x, chain[i].y, chain[i + 1].x, chain[i + 1].y);
              if (c.dist < bestDist) {
                bestDist = c.dist;
                best = { edgeId: ed.id, segIndex: i, x: c.x, y: c.y };
              }
            }
          });
          setHoverSplice(best);
        }
      }
      if (dragNode) {
        const w = toWorld(view, p.x, p.y);
        const dx = w.x - dragNode.startWorld.x,
          dy = w.y - dragNode.startWorld.y;
        setNodes((ns) =>
          ns.map((n) =>
            dragNode.ids.includes(n.id)
              ? { ...n, x: dragNode.startPositions[n.id].x + dx, y: dragNode.startPositions[n.id].y + dy }
              : n,
          ),
        );
      }
      if (dragVertex) {
        const w = toWorld(view, p.x - dragVertex.ox, p.y - dragVertex.oy);
        setEdges((es) =>
          es.map((ed) =>
            ed.id !== dragVertex.edgeId
              ? ed
              : {
                  ...ed,
                  points: ed.points.map((v) =>
                    v.id === dragVertex.pid ? { ...v, x: w.x, y: w.y } : v,
                  ),
                },
          ),
        );
      }
      if (dragCurve) {
        const w = toWorld(view, p.x - dragCurve.ox, p.y - dragCurve.oy);
        setEdges((es) =>
          es.map((ed) =>
            ed.id !== dragCurve.edgeId
              ? ed
              : {
                  ...ed,
                  curves: {
                    ...(ed.curves || {}),
                    [dragCurve.key]: { x: w.x, y: w.y },
                  },
                },
          ),
        );
      }
      if (wire) {
        const s = nodes.find(
          (n) => n.id !== wire.fromId && hit(n, view, p.x, p.y),
        );
        setSnapTo(s ? s.id : null);
        const c = s ? centerScreen(s, view) : { x: p.x, y: p.y };
        setWire((w) => ({ ...w, x2: c.x, y2: c.y }));
      }
    },
    [
      nodes,
      edges,
      dragNode,
      dragVertex,
      dragCurve,
      wire,
      panDrag,
      marquee,
      view,
      ribbonDrag,
      dropHint,
      groups,
    ],
  );

  const onUp = useCallback(
    (e) => {
      if (marquee) {
        const x0 = Math.min(marquee.x0, marquee.x1), x1 = Math.max(marquee.x0, marquee.x1);
        const y0 = Math.min(marquee.y0, marquee.y1), y1 = Math.max(marquee.y0, marquee.y1);
        const hitIds = nodes
          .filter((n) => {
            const s = toScreen(view, n.x, n.y), sz = sizeOf(n);
            return s.x + sz >= x0 && s.x <= x1 && s.y + sz >= y0 && s.y <= y1;
          })
          .map((n) => n.id);
        setSelected((sel) => {
          if (marquee.mode === "add") return Array.from(new Set([...sel, ...hitIds]));
          if (marquee.mode === "subtract") return sel.filter((id) => !hitIds.includes(id));
          return hitIds;
        });
        setMarquee(null);
        return;
      }
      if (ribbonDrag) {
        const p = pt(e);
        const item = ribbonDrag.items[ribbonDrag.index];
        const sz = sizeOf(item);
        const id = genId();
        const label = "M0" + mCounter++;

        // Dropped on a reach line — splice the new unit into the chain
        // (cross section > line > cross section becomes
        //  cross section > line > new unit > line > cross section)
        // instead of placing a standalone node.
        if (hoverSplice) {
          const edge = edges.find((x) => x.id === hoverSplice.edgeId);
          if (edge) {
            const beforePoints = edge.points.slice(0, hoverSplice.segIndex);
            const afterPoints = edge.points.slice(hoverSplice.segIndex);
            const e1Ids = new Set([edge.from, ...beforePoints.map((v) => v.id)]);
            const e2Ids = new Set([...afterPoints.map((v) => v.id), edge.to]);
            const splitCurves = (idSet) => {
              if (!edge.curves) return undefined;
              const out = {};
              for (const [key, val] of Object.entries(edge.curves)) {
                const [a, b] = key.split("|");
                if (idSet.has(a) && idSet.has(b)) out[key] = val;
              }
              return Object.keys(out).length ? out : undefined;
            };
            const w = toWorld(view, hoverSplice.x, hoverSplice.y);
            setNodes((ns) => [
              ...ns,
              { id, icon: item.icon, shape: item.shape, x: w.x - sz / 2, y: w.y - sz / 2, label, unitLabel: item.label },
            ]);
            setEdges((es) =>
              es.filter((x) => x.id !== hoverSplice.edgeId).concat([
                { id: genId(), from: edge.from, to: id, points: beforePoints, curves: splitCurves(e1Ids), reach: edge.reach },
                { id: genId(), from: id, to: edge.to, points: afterPoints, curves: splitCurves(e2Ids), reach: edge.reach },
              ]),
            );
            setSelected([id]);
            setDropHint(false);
            setHoverSplice(null);
            onConsumeRibbonDrag();
            return;
          }
        }

        const w = toWorld(view, p.x, p.y);
        setNodes((ns) => [
          ...ns,
          {
            id,
            icon: item.icon,
            shape: item.shape,
            x: w.x - sz / 2,
            y: w.y - sz / 2,
            label,
            unitLabel: item.label,
          },
        ]);
        setSelected([id]);
        setDropHint(false);
        onConsumeRibbonDrag();
        return;
      }
      if (panDrag) {
        setPanDrag(null);
        return;
      }
      if (wire) {
        if (snapTo) {
          const dup = edges.some(
            (e2) =>
              (e2.from === wire.fromId && e2.to === snapTo) ||
              (e2.from === snapTo && e2.to === wire.fromId),
          );
          if (!dup)
            setEdges((es) => [
              ...es,
              { id: genId(), from: wire.fromId, to: snapTo, points: [] },
            ]);
        } else {
          openPicker(wire.x2, wire.y2, {
            mode: "create",
            fromId: wire.fromId,
            atWorld: toWorld(view, wire.x2, wire.y2),
          });
        }
      }
      setDragNode(null);
      setDragVertex(null);
      setDragCurve(null);
      setWire(null);
      setSnapTo(null);
    },
    [ribbonDrag, wire, snapTo, edges, view, onConsumeRibbonDrag, marquee, nodes, hoverSplice],
  );

  // Alt/Option+click on a vertex adds a bezier handle to every reach segment
  // touching that point (at the segment midpoint) instead of starting a
  // position-drag. Idempotent — clicking the same point again leaves an
  // already-curved segment alone rather than flattening it back. (Alt+click
  // on a node itself is reserved for deselecting it — see nodeDown.)
  const addCurvesAt = (pointId) => {
    setEdges((es) =>
      es.map((ed) => {
        const chain = [ed.from, ...ed.points.map((p) => p.id), ed.to];
        if (!chain.includes(pointId)) return ed;
        const curves = { ...(ed.curves || {}) };
        let changed = false;
        for (let i = 0; i < chain.length - 1; i++) {
          if (chain[i] !== pointId && chain[i + 1] !== pointId) continue;
          const key = chain[i] + "|" + chain[i + 1];
          if (curves[key]) continue;
          const p1 = pointWorld(chain[i], ed, nodes),
            p2 = pointWorld(chain[i + 1], ed, nodes);
          curves[key] = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
          changed = true;
        }
        return changed ? { ...ed, curves } : ed;
      }),
    );
  };

  // Alt/Option+click directly on a reach segment bends *that* segment,
  // bowing toward the clicked point — idempotent, same as addCurvesAt.
  const addCurveToSegment = (edgeId, key, screenPoint) => {
    const w = toWorld(view, screenPoint.x, screenPoint.y);
    setEdges((es) =>
      es.map((ed) =>
        ed.id !== edgeId || ed.curves?.[key]
          ? ed
          : { ...ed, curves: { ...(ed.curves || {}), [key]: { x: w.x, y: w.y } } },
      ),
    );
  };

  const nodeDown = (e, id) => {
    e.stopPropagation();
    setSelectedVertex(null);
    // Alt+click deselects this specific unit (Keyboard Shortcuts spec —
    // "Deselect: Left-click, Alt+Left-click"). Ctrl/Cmd+click and
    // Shift+click both add-or-toggle it in the current multi-selection.
    if (e.altKey) {
      setSelected((sel) => sel.filter((x) => x !== id));
      return;
    }
    if (e.ctrlKey || e.metaKey || e.shiftKey) {
      setSelected((sel) => (sel.includes(id) ? sel.filter((x) => x !== id) : [...sel, id]));
      return;
    }
    const p = pt(e);
    // Clicking an already-multi-selected node keeps the whole selection (so
    // dragging moves the group); otherwise it replaces the selection.
    const dragIds = selected.includes(id) && selected.length > 1 ? selected : [id];
    if (!(selected.includes(id) && selected.length > 1)) setSelected([id]);
    const startWorld = toWorld(view, p.x, p.y);
    const startPositions = {};
    dragIds.forEach((nid) => {
      const n = nodes.find((x) => x.id === nid);
      if (n) startPositions[nid] = { x: n.x, y: n.y };
    });
    setDragNode({ ids: dragIds, startWorld, startPositions });
  };
  const portDown = (e, fromId, px, py) => {
    e.stopPropagation();
    setWire({ fromId, x1: px, y1: py, x2: px, y2: py });
  };

  const vertexDown = (e, edgeId, pid) => {
    e.stopPropagation();
    if (e.altKey) {
      addCurvesAt(pid);
      return;
    }
    const edge = edges.find((x) => x.id === edgeId);
    const v = edge.points.find((x) => x.id === pid);
    const p = pt(e);
    const s = toScreen(view, v.x, v.y);
    setSelected([]);
    setSelectedVertex({ edgeId, pid });
    setDragVertex({ edgeId, pid, ox: p.x - s.x, oy: p.y - s.y });
  };
  const vertexDouble = (e, edgeId, pid) => {
    e.stopPropagation();
    const edge = edges.find((x) => x.id === edgeId);
    const v = edge.points.find((x) => x.id === pid);
    const s = toScreen(view, v.x, v.y);
    openPicker(s.x, s.y, { mode: "convert", edgeId, pid });
  };
  // Deleting a midpoint vertex merges its two segments back into one — the
  // inverse of addVertex — and drops any curve handle anchored to it.
  const deleteVertex = (edgeId, pid) => {
    setEdges((es) =>
      es.map((ed) => {
        if (ed.id !== edgeId) return ed;
        const points = ed.points.filter((v) => v.id !== pid);
        let curves = ed.curves;
        if (curves) {
          curves = Object.fromEntries(
            Object.entries(curves).filter(([key]) => !key.split("|").includes(pid)),
          );
          if (!Object.keys(curves).length) curves = undefined;
        }
        return { ...ed, points, curves };
      }),
    );
    setSelectedVertex(null);
  };
  const curveDown = (e, edgeId, key) => {
    e.stopPropagation();
    const edge = edges.find((x) => x.id === edgeId);
    const c = edge.curves[key];
    const p = pt(e);
    const s = toScreen(view, c.x, c.y);
    setDragCurve({ edgeId, key, ox: p.x - s.x, oy: p.y - s.y });
  };
  const addVertex = (edgeId, segIndex, worldMid) => {
    setEdges((es) =>
      es.map((ed) => {
        if (ed.id !== edgeId) return ed;
        const pts = [...ed.points];
        pts.splice(segIndex, 0, { id: genId(), x: worldMid.x, y: worldMid.y });
        return { ...ed, points: pts };
      }),
    );
  };

  const delNode = (id) => {
    setNodes((ns) => ns.filter((n) => n.id !== id));
    setEdges((es) => es.filter((e) => e.from !== id && e.to !== id));
    setGroups((gs) => gs.map((g) => ({ ...g, memberIds: g.memberIds.filter((m) => m !== id) })).filter((g) => g.memberIds.length > 1));
    setSelected([]);
  };

  const handlePick = (item) => {
    if (!picker) return;
    const shape = item.shape || "square";
    const sz = shape === "diamond" ? DIAMOND : OUTER;
    if (picker.mode === "create") {
      const id = genId();
      const label = "M0" + mCounter++;
      setNodes((ns) => [
        ...ns,
        {
          id,
          icon: item.icon,
          shape,
          x: picker.atWorld.x - sz / 2,
          y: picker.atWorld.y - sz / 2,
          label,
          unitLabel: item.label,
        },
      ]);
      setEdges((es) => [
        ...es,
        { id: genId(), from: picker.fromId, to: id, points: [] },
      ]);
      setSelected([id]);
    } else if (picker.mode === "convert") {
      const edge = edges.find((x) => x.id === picker.edgeId);
      if (edge) {
        const idx = edge.points.findIndex((x) => x.id === picker.pid);
        const v = edge.points[idx];
        const before = edge.points.slice(0, idx);
        const after = edge.points.slice(idx + 1);
        const id = genId();
        const label = "M0" + mCounter++;
        const e1 = { id: genId(), from: edge.from, to: id, points: before };
        const e2 = { id: genId(), from: id, to: edge.to, points: after };
        setNodes((ns) => [
          ...ns,
          {
            id,
            icon: item.icon,
            shape,
            x: v.x - sz / 2,
            y: v.y - sz / 2,
            label,
            unitLabel: item.label,
          },
        ]);
        setEdges((es) =>
          es.filter((x) => x.id !== picker.edgeId).concat([e1, e2]),
        );
        setSelected([id]);
      }
    }
    setPicker(null);
  };

  // Keyboard: Delete/Backspace opens a confirm dialog (no direct delete);
  // Escape backs out of whatever's active, in priority order; Space pans;
  // =/+ and -/_ step-zoom in/out.
  useEffect(() => {
    const isTyping = (e) => {
      const t = (e.target.tagName || "").toLowerCase();
      return t === "input" || t === "textarea";
    };
    const onKey = (e) => {
      if (e.key === "Escape") {
        if (contextMenu) return setContextMenu(null);
        if (picker) return setPicker(null);
        if (reachPicker) return setReachPicker(null);
        if (confirmId) return setConfirmId(null);
        if (wire) {
          setWire(null);
          setSnapTo(null);
          return;
        }
        if (selectedVertex) return setSelectedVertex(null);
        return setSelected([]);
      }
      if (
        (e.key === "Delete" || e.key === "Backspace") &&
        selected.length === 1 &&
        !confirmId &&
        !picker &&
        !isTyping(e)
      ) {
        e.preventDefault();
        setConfirmId(selected[0]);
      }
      if (
        (e.key === "Delete" || e.key === "Backspace") &&
        selectedVertex &&
        !confirmId &&
        !picker &&
        !isTyping(e)
      ) {
        e.preventDefault();
        deleteVertex(selectedVertex.edgeId, selectedVertex.pid);
      }
      if (e.code === "Space" && !spaceHeld && !isTyping(e)) {
        e.preventDefault();
        setSpaceHeld(true);
      }
      if ((e.key === "=" || e.key === "+") && !isTyping(e)) {
        e.preventDefault();
        zoomBy(KEY_ZOOM_FACTOR);
      }
      if ((e.key === "-" || e.key === "_") && !isTyping(e)) {
        e.preventDefault();
        zoomBy(1 / KEY_ZOOM_FACTOR);
      }
      // Keyboard Shortcuts spec (FM v8.0): View/GUI/FM 1D sections.
      const noMods = !e.ctrlKey && !e.metaKey && !e.altKey;
      if (e.key === "0" && noMods && !isTyping(e)) {
        e.preventDefault();
        resetView();
      }
      if (noMods && !isTyping(e)) {
        const toolKey = { v: 0, g: 1, m: 2, q: 3 }[e.key.toLowerCase()];
        if (toolKey !== undefined) { e.preventDefault(); setActiveTool(toolKey); }
        if (e.key.toLowerCase() === "x") { e.preventDefault(); togglePanMode(); }
        if (e.key.toLowerCase() === "z") { e.preventDefault(); toggleZoomMode(); }
      }
      // Selection shortcuts (Keyboard Shortcuts spec — GUI section).
      if (e.ctrlKey && !e.shiftKey && e.key.toLowerCase() === "a" && !isTyping(e)) {
        e.preventDefault();
        setSelected(nodes.map((n) => n.id));
      }
      if (e.ctrlKey && !e.shiftKey && e.key.toLowerCase() === "d" && !isTyping(e)) {
        e.preventDefault();
        setSelected([]);
      }
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "i" && !isTyping(e)) {
        e.preventDefault();
        setSelected((sel) => nodes.filter((n) => !sel.includes(n.id)).map((n) => n.id));
      }
      if ((e.key === "," || e.key === ".") && selected.length === 1 && !isTyping(e)) {
        e.preventDefault();
        const i = nodes.findIndex((n) => n.id === selected[0]);
        if (i !== -1) {
          const next = e.key === "," ? Math.max(0, i - 1) : Math.min(nodes.length - 1, i + 1);
          setSelected([nodes[next].id]);
        }
      }
    };
    const onKeyUp = (e) => {
      if (e.code === "Space") setSpaceHeld(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("keyup", onKeyUp);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("keyup", onKeyUp);
    };
  }, [selected, selectedVertex, confirmId, picker, reachPicker, wire, spaceHeld, contextMenu, zoomBy, resetView, nodes, togglePanMode, toggleZoomMode]);

  // Middle-click, space/Pan-tool held drag always pans. While the Zoom
  // tool is persistently selected, a plain click on the canvas zooms in
  // (Alt+click zooms out) centred on the click, instead of panning. A
  // plain left-click hold on empty canvas otherwise pans, but only while
  // nothing is selected — otherwise it deselects (as before).
  const onWrapDown = (e) => {
    setContextMenu(null);
    if (e.button === 1 || ((panMode || spaceHeld) && e.button === 0)) {
      e.preventDefault();
      setPanDrag({ sx: e.clientX, sy: e.clientY, tx0: view.tx, ty0: view.ty });
      return;
    }
    if (zoomMode && e.button === 0 && e.target === e.currentTarget) {
      e.preventDefault();
      zoomBy(e.altKey ? 1 / KEY_ZOOM_FACTOR : KEY_ZOOM_FACTOR, pt(e));
      return;
    }
    // Box-select (marquee): Ctrl/Shift+drag adds to the selection, Alt+drag
    // removes from it, and the Group select tool (G) starts a fresh
    // (replacing) box-select on a plain drag.
    if (e.target === e.currentTarget && e.button === 0) {
      const p = pt(e);
      if (e.ctrlKey || e.shiftKey) {
        setMarquee({ x0: p.x, y0: p.y, x1: p.x, y1: p.y, mode: "add" });
        return;
      }
      if (e.altKey) {
        setMarquee({ x0: p.x, y0: p.y, x1: p.x, y1: p.y, mode: "subtract" });
        return;
      }
      if (activeTool === 1) {
        setMarquee({ x0: p.x, y0: p.y, x1: p.x, y1: p.y, mode: "replace" });
        return;
      }
    }
    if (e.target === e.currentTarget) {
      if (e.button === 0 && !selected.length && !selectedVertex) {
        setPanDrag({
          sx: e.clientX,
          sy: e.clientY,
          tx0: view.tx,
          ty0: view.ty,
        });
        return;
      }
      setSelected([]);
      setSelectedVertex(null);
      setPicker(null);
      setReachPicker(null);
    }
  };

  const confirmNode = confirmId ? nodes.find((n) => n.id === confirmId) : null;
  const isPanning = panMode || spaceHeld;

  // Footer guide: reflects whatever the user is actually doing right now,
  // most-specific state first. Falls through to MapFooter's own baseline
  // (Select/Zoom/Options) when nothing below applies.
  const guideItems = (() => {
    if (confirmId) return [{ label: "Click Delete to confirm" }, { label: "Esc to cancel" }];
    if (picker || reachPicker) return [{ label: "Click an item to choose" }, { label: "Esc to cancel" }];
    if (ribbonDrag) return hoverSplice
      ? [{ label: "Tab to cycle the unit type" }, { label: "Release to insert into the reach" }]
      : [{ label: "Tab to cycle the unit type" }, { label: "Drop on the canvas to place, or on a line to insert" }];
    if (toolDrag?.tool === "zoom") return [
      { icon: "mouseLeftDrag", label: "Drag up to zoom in, down to zoom out" },
      { label: "Alt inverts · Shift slows" },
    ];
    if (toolDrag?.tool === "rotate") return [{ label: "Drag to rotate" }, { label: "Alt inverts · Shift slows" }];
    if (toolDrag?.tool === "pan") return [{ label: "Drag to pan" }, { label: "Alt inverts · Shift slows" }];
    if (panDrag) return [{ label: "Drag to pan" }, { label: "Alt inverts · Shift slows" }];
    if (marquee) return [{ label: marquee.mode === "subtract" ? "Release to remove from selection" : "Release to select" }];
    if (wire) return [{ label: "Drop on a node to connect" }, { label: "Release elsewhere to choose a unit" }];
    if (dragNode) return [{ label: "Drag to reposition" }, { label: "Release to drop" }];
    if (dragVertex) return [{ label: "Drag to move the point" }, { label: "Double-click to convert to a unit" }];
    if (dragCurve) return [{ label: "Drag to bend the curve" }];
    if (zoomMode) return [{ label: "Click to zoom in" }, { label: "Alt+Click to zoom out" }];
    if (panMode) return [{ label: "Click-drag to pan" }];
    if (selected.length > 1) return [
      { icon: "mouseRight", label: "Right-click to group" },
      { label: "Shift/Ctrl+Click to add/remove" },
      { label: "Alt+Click to deselect one" },
    ];
    if (selected.length === 1) return [
      { icon: "mouseRight", label: "Right-click for options" },
      { label: "Shift/Ctrl+Click to add another" },
      { label: "Alt+Click to deselect · Del to remove" },
    ];
    if (selectedVertex) return [
      { label: "Double-click to convert to a unit" },
      { label: "Del to remove" },
    ];
    if (hovered) return [
      { icon: "mouseLeft", label: "Click to select" },
      { label: "Shift/Ctrl+Click to multi-select" },
    ];
    if (hoverLine) return [
      { label: "Click midpoint to add a point" },
      { label: "Alt+Click to bend · Click to reassign the reach" },
    ];
    return null;
  })();

  return (
    <div
      style={{
        flex: "1 0 0",
        minWidth: 0,
        height: "100%",
        position: "relative",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        ref={wrapRef}
        style={{
          flex: "1 0 0",
          position: "relative",
          overflow: "hidden",
          background:
            "radial-gradient(var(--neutral-700) 1px, transparent 1px)",
          backgroundSize: `${28 * view.scale}px ${28 * view.scale}px`,
          backgroundPosition: `${view.tx}px ${view.ty}px`,
          backgroundColor: "#eef0ec",
          border: dropHint
            ? "1px dashed var(--blue-700)"
            : "1px solid var(--border-primary)",
          borderRadius: 4,
          cursor: ribbonDrag
            ? "copy"
            : panDrag
              ? "grabbing"
              : isPanning
                ? "grab"
                : zoomMode
                  ? "zoom-in"
                  : dragNode || dragVertex || dragCurve || wire
                    ? "crosshair"
                    : "default",
        }}
        onMouseMove={onMove}
        onMouseUp={onUp}
        onMouseDown={onWrapDown}
        onContextMenu={(e) => { if (e.target === e.currentTarget) { e.preventDefault(); setContextMenu(null); } }}
        onMouseLeave={() => {
          setDragNode(null);
          setDragVertex(null);
          setDragCurve(null);
          setWire(null);
          setSnapTo(null);
          setHovered(null);
          setHoverLine(null);
          setPanDrag(null);
          setMarquee(null);
          setHoverSplice(null);
          setCursorWorld(null);
        }}
      >
        {showBasemap && (
          <OsmBasemap
            view={view}
            width={wrapRef.current?.clientWidth}
            height={wrapRef.current?.clientHeight}
          />
        )}

        {/* Left tool rail */}
        <div
          style={{
            position: "absolute",
            top: 4,
            left: 4,
            zIndex: 12,
            display: "flex",
            flexDirection: "column",
            gap: 8,
            padding: 8,
            background: "var(--surface-1)",
            border: "1px solid var(--border-primary)",
            borderRadius: 4,
            boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
          }}
        >
          {railTools.map((t, i) => {
            const isSel = activeTool === i;
            const isHov = navHover === "rail" + i;
            return (
              <Fragment key={t.name}>
                {i === 5 && (
                  <div style={{ height: 1, background: "var(--border-primary)" }} />
                )}
                <button
                  key={t.name}
                  title={t.name}
                  onClick={() => setActiveTool(i)}
                  onMouseEnter={() => setNavHover("rail" + i)}
                  onMouseLeave={() => setNavHover(null)}
                  style={{
                    width: 24,
                    height: 24,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: "none",
                    borderRadius: 2,
                    cursor: "pointer",
                    background: isSel
                      ? "var(--surface-brand)"
                      : isHov
                        ? "var(--surface-3)"
                        : "var(--surface-1)",
                  }}
                >
                  <Icon
                    src={t.icon}
                    size={16}
                    style={isSel ? { filter: "brightness(0) invert(1)" } : undefined}
                  />
                </button>
              </Fragment>
            );
          })}
        </div>

        {/* Right nav controls — click-and-hold + drag: North Star rotates
            (double-click = true north, click = reset view), Zoom scrubs
            in/out with vertical drag (click = one step in), Pan drags the
            view directly (click = toggle the sticky Pan tool). Alt inverts
            direction, Shift slows any of the three down. */}
        <div
          style={{
            position: "absolute",
            top: 4,
            right: 4,
            zIndex: 12,
            display: "flex",
            flexDirection: "column",
            gap: 4,
          }}
        >
          {[
            {
              icon: A.northStar,
              tool: "rotate",
              name: "Rotate (drag) · double-click = true north · click = reset view (0)",
              active: Math.abs(((view.rotation % 360) + 360) % 360) > 0.5,
              iconStyle: { transform: `rotate(${view.rotation}deg)` },
            },
            {
              icon: A.zoomTool,
              tool: "zoom",
              name: "Zoom (drag up/down) · click = toggle Zoom tool (Z) · while active, click canvas to zoom in, Alt+click to zoom out",
              active: zoomMode,
            },
            {
              icon: A.pan,
              tool: "pan",
              name: "Pan (drag) · click = toggle Pan tool (X)",
              active: panMode,
            },
          ].map((b) => {
            const isHov = navHover === b.tool;
            return (
              <div
                key={b.name}
                title={b.name}
                onMouseEnter={() => setNavHover(b.tool)}
                onMouseLeave={() => setNavHover(null)}
                onMouseDown={(e) => {
                  e.preventDefault();
                  setToolDrag({
                    tool: b.tool,
                    sx: e.clientX,
                    sy: e.clientY,
                    startView: view,
                    moved: false,
                  });
                }}
                onDoubleClick={b.tool === "rotate" ? resetNorth : undefined}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  background: b.active
                    ? "var(--surface-brand)"
                    : isHov
                      ? "var(--surface-3)"
                      : "var(--surface-1)",
                  border: b.active
                    ? "none"
                    : `1px solid ${isHov ? "var(--border-secondary)" : "var(--border-primary)"}`,
                  boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "grab",
                }}
              >
                <Icon
                  src={b.icon}
                  size={16}
                  style={{
                    ...b.iconStyle,
                    ...(b.active ? { filter: "brightness(0) invert(1)" } : {}),
                  }}
                />
              </div>
            );
          })}
        </div>

        {/* Reaches (as editable polylines, optionally curved) + active wire */}
        <svg
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            pointerEvents: "none",
          }}
        >
          {edges.map((e) => {
            const fEnd = resolveEndpoint(e.from),
              tEnd = resolveEndpoint(e.to);
            if (!fEnd || !tEnd) return null;
            // Both ends resolve into the same collapsed group — this reach
            // is entirely internal to it, so it's hidden while collapsed.
            if (fEnd.groupId && fEnd.groupId === tEnd.groupId) return null;
            const chain = [
              { id: e.from, screen: fEnd.screen },
              ...e.points.map((v) => ({
                id: v.id,
                screen: toScreen(view, v.x, v.y),
              })),
              { id: e.to, screen: tEnd.screen },
            ];
            const reachStroke = edgeColors?.[e.id] || "var(--reach)";
            return (
              <g key={e.id}>
                {chain.slice(0, -1).map((c1, i) => {
                  const c2 = chain[i + 1];
                  const key = c1.id + "|" + c2.id;
                  const ctrl = e.curves?.[key];
                  if (ctrl) {
                    const cs = toScreen(view, ctrl.x, ctrl.y);
                    const curveSegKey = e.id + ":" + i;
                    return (
                      <g key={i}>
                        <path
                          d={`M ${c1.screen.x} ${c1.screen.y} Q ${cs.x} ${cs.y} ${c2.screen.x} ${c2.screen.y}`}
                          stroke={reachStroke}
                          strokeWidth={hoverLine === curveSegKey ? 3.5 : 2.5}
                          fill="none"
                          strokeLinecap="round"
                          style={{ pointerEvents: "stroke", cursor: "pointer" }}
                          onMouseEnter={() => setHoverLine(curveSegKey)}
                          onMouseLeave={() => setHoverLine(null)}
                          onClick={(ev) => {
                            ev.stopPropagation();
                            const p = pt(ev);
                            if (ev.altKey) {
                              addCurveToSegment(e.id, key, p);
                              return;
                            }
                            openReachPicker(p.x, p.y, e.id);
                          }}
                        />
                        <line
                          x1={c1.screen.x}
                          y1={c1.screen.y}
                          x2={cs.x}
                          y2={cs.y}
                          stroke="var(--blue-700)"
                          strokeWidth={1}
                          strokeDasharray="3 3"
                          opacity={0.5}
                        />
                        <line
                          x1={c2.screen.x}
                          y1={c2.screen.y}
                          x2={cs.x}
                          y2={cs.y}
                          stroke="var(--blue-700)"
                          strokeWidth={1}
                          strokeDasharray="3 3"
                          opacity={0.5}
                        />
                        <circle
                          cx={cs.x}
                          cy={cs.y}
                          r={5}
                          fill="var(--blue-700)"
                          stroke="#fff"
                          strokeWidth={1.5}
                          style={{
                            pointerEvents: "all",
                            cursor:
                              dragCurve?.key === key ? "grabbing" : "grab",
                          }}
                          onMouseDown={(ev) => curveDown(ev, e.id, key)}
                        />
                      </g>
                    );
                  }
                  const mx = (c1.screen.x + c2.screen.x) / 2,
                    my = (c1.screen.y + c2.screen.y) / 2;
                  const segKey = e.id + ":" + i;
                  const isHov = hoverSeg === segKey;
                  return (
                    <g key={i}>
                      <line
                        x1={c1.screen.x}
                        y1={c1.screen.y}
                        x2={c2.screen.x}
                        y2={c2.screen.y}
                        stroke={reachStroke}
                        strokeWidth={hoverLine === segKey ? 3.5 : 2.5}
                        strokeLinecap="round"
                        style={{ pointerEvents: "stroke", cursor: "pointer" }}
                        onMouseEnter={() => setHoverLine(segKey)}
                        onMouseLeave={() => setHoverLine(null)}
                        onClick={(ev) => {
                          ev.stopPropagation();
                          const p = pt(ev);
                          if (ev.altKey) {
                            addCurveToSegment(e.id, key, p);
                            return;
                          }
                          openReachPicker(p.x, p.y, e.id);
                        }}
                      />
                      <circle
                        cx={mx}
                        cy={my}
                        r={7}
                        fill="transparent"
                        style={{ pointerEvents: "all", cursor: "copy" }}
                        onMouseEnter={() => setHoverSeg(segKey)}
                        onMouseLeave={() => setHoverSeg(null)}
                        onClick={(ev) => {
                          if (ev.altKey) {
                            addCurveToSegment(e.id, key, { x: mx, y: my });
                            return;
                          }
                          addVertex(e.id, i, toWorld(view, mx, my));
                        }}
                      />
                      {isHov && (
                        <g style={{ pointerEvents: "none" }}>
                          <circle
                            cx={mx}
                            cy={my}
                            r={6}
                            fill="var(--blue-700)"
                          />
                          <line
                            x1={mx - 3}
                            y1={my}
                            x2={mx + 3}
                            y2={my}
                            stroke="#fff"
                            strokeWidth={1.4}
                          />
                          <line
                            x1={mx}
                            y1={my - 3}
                            x2={mx}
                            y2={my + 3}
                            stroke="#fff"
                            strokeWidth={1.4}
                          />
                        </g>
                      )}
                    </g>
                  );
                })}
                {e.points.map((v) => {
                  const s = toScreen(view, v.x, v.y);
                  const isVertexSel = selectedVertex?.edgeId === e.id && selectedVertex?.pid === v.id;
                  return (
                    <circle
                      key={v.id}
                      cx={s.x}
                      cy={s.y}
                      r={5}
                      fill={isVertexSel ? "var(--node-selected-fill)" : "#fff"}
                      stroke={isVertexSel ? "var(--node-selected-border)" : reachStroke}
                      strokeWidth={2}
                      style={{
                        pointerEvents: "all",
                        cursor: dragVertex?.pid === v.id ? "grabbing" : "grab",
                      }}
                      onMouseDown={(ev) => vertexDown(ev, e.id, v.id)}
                      onDoubleClick={(ev) => vertexDouble(ev, e.id, v.id)}
                    />
                  );
                })}
              </g>
            );
          })}
          {wire && (
            <line
              x1={wire.x1}
              y1={wire.y1}
              x2={wire.x2}
              y2={wire.y2}
              stroke="var(--blue-700)"
              strokeWidth={2}
              strokeDasharray="6 3"
              strokeLinecap="round"
            />
          )}
          {/* Splice preview — while dragging a ribbon unit over a reach
              line, highlight that segment and mark where it'll be inserted. */}
          {hoverSplice && (() => {
            const edge = edges.find((x) => x.id === hoverSplice.edgeId);
            if (!edge) return null;
            const fEnd = resolveEndpoint(edge.from), tEnd = resolveEndpoint(edge.to);
            if (!fEnd || !tEnd) return null;
            const chain = [fEnd.screen, ...edge.points.map((v) => toScreen(view, v.x, v.y)), tEnd.screen];
            const c1 = chain[hoverSplice.segIndex], c2 = chain[hoverSplice.segIndex + 1];
            if (!c1 || !c2) return null;
            return (
              <g style={{ pointerEvents: "none" }}>
                <line x1={c1.x} y1={c1.y} x2={c2.x} y2={c2.y} stroke="var(--blue-700)" strokeWidth={5} strokeLinecap="round" opacity={0.35} />
                <circle cx={hoverSplice.x} cy={hoverSplice.y} r={7} fill="var(--blue-700)" stroke="#fff" strokeWidth={1.5} />
              </g>
            );
          })()}
        </svg>

        {/* Expanded groups' bounding boxes — sit beneath the node layer so
            member nodes visually read as "inside" the tinted box. */}
        {groups.filter((g) => !g.collapsed).map((g) => {
          const members = nodes.filter((n) => g.memberIds.includes(n.id));
          if (!members.length) return null;
          const rects = members.map((n) => ({ s: toScreen(view, n.x, n.y), sz: sizeOf(n) }));
          const left = Math.min(...rects.map((r) => r.s.x)) - GROUP_PAD;
          const top = Math.min(...rects.map((r) => r.s.y)) - GROUP_PAD;
          const right = Math.max(...rects.map((r) => r.s.x + r.sz)) + GROUP_PAD;
          const bottom = Math.max(...rects.map((r) => r.s.y + r.sz)) + GROUP_PAD;
          return (
            <div key={g.id}
              onMouseDown={(e) => groupBoxDown(e, g)}
              onContextMenu={(e) => onGroupContext(e, g)}
              style={{
                position: "absolute",
                left, top, width: right - left, height: bottom - top,
                cursor: dragNode?.ids?.includes(g.memberIds[0]) ? "grabbing" : "grab",
                ...GROUP_BOX_STYLE,
              }}
            />
          );
        })}

        {/* Nodes */}
        {nodes.map((n) => {
          const memberGroup = groupOfNode[n.id];
          if (memberGroup && memberGroup.collapsed) return null; // rendered as the group's own representative box instead
          const s = toScreen(view, n.x, n.y);
          const sz = sizeOf(n);
          const isHov = hovered === n.id,
            isSel = selected.includes(n.id) || Boolean(memberGroup && !memberGroup.collapsed),
            isSnap = snapTo === n.id;
          const isConfluence = (degree?.[n.id] || 0) >= 3;
          const showPorts =
            isHov && !dragNode && !dragVertex && !dragCurve && !panDrag;
          return (
            <div key={n.id}>
              {(isHov || isSel) && (
                <div
                  style={{
                    position: "absolute",
                    left: s.x + sz / 2,
                    top: s.y - 16,
                    transform: "translateX(-50%)",
                    fontSize: "var(--fs-xxs)",
                    color: "var(--text-secondary)",
                    whiteSpace: "nowrap",
                    pointerEvents: "none",
                  }}
                >
                  {n.label}
                </div>
              )}
              {/* Confluence/diverging-point ring — flags where 3+ reaches meet at this unit */}
              {isConfluence && (
                <div
                  title="Confluence: multiple reaches meet here"
                  style={{
                    position: "absolute",
                    left: s.x - 5,
                    top: s.y - 5,
                    width: sz + 10,
                    height: sz + 10,
                    borderRadius: "50%",
                    border: "1.5px dashed var(--text-tertiary)",
                    pointerEvents: "none",
                  }}
                />
              )}
              <div
                onMouseDown={(e) => nodeDown(e, n.id)}
                onContextMenu={(e) => onNodeContext(e, n.id)}
                title="Shift/Ctrl-click to multi-select · Alt-click to deselect"
                style={{
                  position: "absolute",
                  left: s.x,
                  top: s.y,
                  cursor: dragNode?.ids?.includes(n.id) ? "grabbing" : "grab",
                }}
              >
                <NodeBox
                  iconKey={n.icon}
                  shape={n.shape}
                  selected={isSel}
                  hovered={isHov}
                  snap={isSnap}
                  size={sz}
                />
              </div>
              {showPorts &&
                ports(n, view).map((p) => (
                  <div
                    key={p.d}
                    onMouseDown={(e) => portDown(e, n.id, p.x, p.y)}
                    style={{
                      position: "absolute",
                      left: p.x - (PR + 3),
                      top: p.y - (PR + 3),
                      width: (PR + 3) * 2,
                      height: (PR + 3) * 2,
                      cursor: "crosshair",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <div
                      style={{
                        width: PR * 2,
                        height: PR * 2,
                        borderRadius: "50%",
                        background: "var(--blue-700)",
                        border: "1.5px solid #fff",
                        pointerEvents: "none",
                      }}
                    />
                  </div>
                ))}
            </div>
          );
        })}

        {/* Collapsed groups — a single representative box standing in for
            every hidden member, draggable/selectable as one unit. */}
        {groups.filter((g) => g.collapsed).map((g) => {
          const c = groupCentroidWorld(g);
          const s = toScreen(view, c.x, c.y); // screen-space centre of the group
          const sz = OUTER;
          const half = (sz + GROUP_PAD) / 2;
          const rep = nodes.find((n) => g.memberIds.includes(n.id)) || {};
          return (
            <div key={g.id}
              onMouseDown={(e) => groupBoxDown(e, g)}
              onContextMenu={(e) => onGroupContext(e, g)}
              style={{
                position: "absolute",
                left: s.x - half,
                top: s.y - half,
                width: sz + GROUP_PAD,
                height: sz + GROUP_PAD,
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: dragNode?.ids?.includes(g.memberIds[0]) ? "grabbing" : "grab",
                ...GROUP_BOX_STYLE,
              }}
            >
              {rep.icon && <Icon src={A[rep.icon]} size={ICONSZ} />}
            </div>
          );
        })}

        {/* Group expand/collapse counter badges — "−N" collapses an
            expanded group, "+N" expands a collapsed one. */}
        {groups.map((g) => {
          let anchorX, anchorY;
          if (g.collapsed) {
            const c = groupCentroidWorld(g);
            const s = toScreen(view, c.x, c.y);
            const half = (OUTER + GROUP_PAD) / 2;
            anchorX = s.x + half;
            anchorY = s.y - half;
          } else {
            const members = nodes.filter((n) => g.memberIds.includes(n.id));
            if (!members.length) return null;
            const rects = members.map((n) => ({ s: toScreen(view, n.x, n.y), sz: sizeOf(n) }));
            anchorX = Math.max(...rects.map((r) => r.s.x + r.sz)) + GROUP_PAD;
            anchorY = Math.min(...rects.map((r) => r.s.y)) - GROUP_PAD;
          }
          return (
            <div key={g.id}
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => { e.stopPropagation(); toggleGroupCollapsed(g.id); }}
              title={g.collapsed ? "Expand group" : "Collapse group"}
              style={{
                position: "absolute",
                left: anchorX, top: anchorY,
                transform: "translate(-50%, -50%)",
                zIndex: 13,
                background: "var(--node-selected-border)",
                color: "#fff",
                fontSize: 10,
                fontWeight: 700,
                lineHeight: "20px",
                borderRadius: 16,
                padding: "4.5px 5px",
                cursor: "pointer",
                userSelect: "none",
                boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
              }}
            >
              {(g.collapsed ? "+" : "−") + g.memberIds.length}
            </div>
          );
        })}

        {/* Box-select marquee */}
        {marquee && (() => {
          const left = Math.min(marquee.x0, marquee.x1), top = Math.min(marquee.y0, marquee.y1);
          const width = Math.abs(marquee.x1 - marquee.x0), height = Math.abs(marquee.y1 - marquee.y0);
          return (
            <div style={{ position: "absolute", left, top, width, height, zIndex: 20, pointerEvents: "none", ...GROUP_BOX_STYLE }} />
          );
        })()}

        {/* Right-click menu for the current selection (multi-select → Create
            Group; existing group → Collapse/Expand + Ungroup) */}
        {contextMenu && (
          <ContextMenu
            x={contextMenu.x}
            y={contextMenu.y}
            items={contextMenu.items}
            onClose={() => setContextMenu(null)}
          />
        )}

        {/* Quick-add picker: opened on vertex double-click or a connector dropped on empty canvas */}
        {picker && (
          <NodePicker
            x={picker.x}
            y={picker.y}
            onPick={handlePick}
            onClose={() => setPicker(null)}
          />
        )}

        {/* Reach picker: opened by clicking a reach line, to reassign the whole clicked stretch */}
        {reachPicker && (
          <ReachPicker
            x={reachPicker.x}
            y={reachPicker.y}
            options={reachRegistry}
            currentKey={reachKeyOfEdge?.[reachPicker.edgeId]}
            onPick={(key) => {
              const currentKey = reachKeyOfEdge?.[reachPicker.edgeId];
              const groupEdgeIds = (currentKey &&
                edgesByReach?.[currentKey]) || [reachPicker.edgeId];
              onReassignReach(groupEdgeIds, key);
              setReachPicker(null);
            }}
            onClose={() => setReachPicker(null)}
          />
        )}

        {/* Delete confirmation (replaces the old inline delete button) */}
        {confirmNode &&
          (() => {
            const s = toScreen(view, confirmNode.x, confirmNode.y);
            const sz = sizeOf(confirmNode);
            return (
              <div
                onMouseDown={(e) => e.stopPropagation()}
                style={{
                  position: "absolute",
                  left: Math.min(
                    s.x + sz + 8,
                    (wrapRef.current?.clientWidth || 800) - 220,
                  ),
                  top: Math.max(8, s.y - 8),
                  zIndex: 45,
                  background: "var(--surface-1)",
                  border: "1px solid var(--border-primary)",
                  borderRadius: 4,
                  boxShadow: "0 4px 16px rgba(0,0,0,0.16)",
                  padding: 10,
                  width: 208,
                }}
              >
                <div style={{ fontSize: "var(--fs-xs)", marginBottom: 8 }}>
                  Delete {confirmNode.label}? This removes the unit and its
                  connected reaches.
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    gap: 6,
                  }}
                >
                  <button onClick={() => setConfirmId(null)} style={btnStyle}>
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      delNode(confirmId);
                      setConfirmId(null);
                    }}
                    style={{
                      ...btnStyle,
                      background: "var(--red-700)",
                      color: "#fff",
                      border: "1px solid var(--red-700)",
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })()}

        {/* Scale bar + coordinate/guide status bar, pinned over the bottom
            of the map rather than reserving its own layout space. */}
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, zIndex: 12 }}>
          <MapFooter
            cursorWorld={cursorWorld}
            scale={view.scale}
            guideItems={guideItems}
            showAttribution={showBasemap}
          />
        </div>
      </div>
    </div>
  );
}
