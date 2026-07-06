import { useState, useRef, useCallback, useEffect } from "react";
import { A, Icon } from "../assets.jsx";
import NodePicker from "./NodePicker.jsx";
import ReachPicker from "./ReachPicker.jsx";
import OsmBasemap, { lonLatToWorld, METERS_PER_WORLD_UNIT } from "./OsmBasemap.jsx";
import MapFooter from "./MapFooter.jsx";
import TransectPopup from "./TransectPopup.jsx";
import ContextMenu from "./ContextMenu.jsx";

// Grouped-unit visuals (Figma "1D Grouped Units" — Group select box / Grouped
// state): dashed orange bounding box + translucent orange fill, reused for
// an expanded group's bounding box and a collapsed group's representative box.
const GROUP_BOX_STYLE = {
  border: "1.5px dashed #ce4c00",
  background: "rgba(255,217,177,0.2)",
  borderRadius: 1,
};
const GROUP_PAD = 16; // px, screen-space padding around member nodes for the expanded bbox

// Node geometry (Figma: 28px footprint, 20px icon). Diamonds (Interpolate /
// Replicate) keep the same 20px icon but a tighter footprint so they read
// as compact as the square units instead of floating inside extra padding.
const OUTER = 28,
  ICONSZ = 20;
const DIAMOND = 24;
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

// Left vertical tool rail (select / group-select / measure / query / comment / edit).
// Group-select and Measure each have a right-click submenu (shape picker;
// Transect) — `hasMenu` flags that so the rail can show a small chevron hint.
const railTools = [
  { icon: A.cursorSelect, name: "Select" },
  { icon: A.rectangleSelect, name: "Group select", hasMenu: true },
  { icon: A.measureTool, name: "Measure", hasMenu: true },
  { icon: A.pointQuery, name: "Point query" },
  { icon: A.comment, name: "Comment" },
  { icon: A.edit, name: "Edit" },
];

const GROUP_SELECT_SHAPES = [
  { id: "rect", icon: A.rectangleSelect, label: "Rectangle select" },
  { id: "ellipse", icon: A.ellipticalSelect, label: "Elliptical select" },
  { id: "freeform", icon: A.freeformSelect, label: "Freehand select" },
];

// Point-in-polygon (ray casting) — used for the freeform group-select lasso.
function pointInPolygon(px, py, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i].x, yi = poly[i].y, xj = poly[j].x, yj = poly[j].y;
    const intersect = yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

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
  basemap,
  flyTo,
  onConsumeFlyTo,
  ribbonDrag,
  onConsumeRibbonDrag,
  edgeColors,
  degree,
  reachRegistry,
  edgesByReach,
  reachKeyOfEdge,
  onReassignReach,
  annotateTool,
  setAnnotateTool,
  annotations,
  setAnnotations,
  annotationStyle,
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
  const [contextMenu, setContextMenu] = useState(null); // { x, y, items }

  // Annotation tools (Home tab's Add Content menu): `annotateTool` is armed
  // externally (App owns it, since the Home ribbon lives outside GisCanvas)
  // and stays set across multiple placements until Escape or picking another
  // tool. `annotateDraft` is the in-progress stroke/arrow; `textEditing` is
  // the text box currently being typed (world-space position + live value).
  const [annotateDraft, setAnnotateDraft] = useState(null); // { type:'marker'|'highlighter', points:[world] } | { type:'arrow', from, to }
  const [textEditing, setTextEditing] = useState(null); // { id, x, y, value }

  useEffect(() => {
    setAnnotateDraft(null);
  }, [annotateTool]);

  // Group-select tool: shape (rect/ellipse/freeform, picked via right-click
  // submenu) + the in-progress marquee itself. `mode` on the marquee is
  // replace (plain drag) / add (Shift+drag) / subtract (Alt+drag).
  const [groupSelectShape, setGroupSelectShape] = useState("rect");
  const [groupSelectMenuOpen, setGroupSelectMenuOpen] = useState(false);
  const [marquee, setMarquee] = useState(null); // { mode, shape, x0,y0,x1,y1, path:[{x,y}] }

  // Measure tool: click to add points, Enter/double-click to finish. Each
  // segment shows its own distance plus a running total; `mode` distinguishes
  // a plain measure line from a Transect (finishing one opens the popup).
  const [measure, setMeasure] = useState(null); // { mode:'measure'|'transect', points:[{x,y} world], cursor:{x,y} world }
  const [measureArmedMode, setMeasureArmedMode] = useState("measure"); // which mode a click starts — set by the rail button (measure) or its Transect submenu item
  const [measureMenuOpen, setMeasureMenuOpen] = useState(false);
  const [finishedMeasure, setFinishedMeasure] = useState(null); // last completed measure line, stays drawn until cleared
  const [transectPopup, setTransectPopup] = useState(null); // { lengthM }

  const wrapRef = useRef(null);

  // Close either rail submenu on any click elsewhere (both stopPropagation
  // themselves, so this only fires for genuine outside clicks).
  useEffect(() => {
    if (!groupSelectMenuOpen && !measureMenuOpen) return;
    const onDown = () => { setGroupSelectMenuOpen(false); setMeasureMenuOpen(false); };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [groupSelectMenuOpen, measureMenuOpen]);

  // Switching away from the group-select / measure tools drops whatever was
  // mid-draw for that tool, matching how other tools reset when you leave them.
  useEffect(() => {
    if (activeTool !== 1) setMarquee(null);
    if (activeTool !== 2) { setMeasure(null); setFinishedMeasure(null); }
  }, [activeTool]);

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

  // One-shot "jump to this location" request from the top-bar search.
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
      if (annotateDraft) {
        const w = toWorld(view, p.x, p.y);
        if (annotateDraft.type === "arrow") {
          setAnnotateDraft((d) => d && { ...d, to: w });
        } else {
          setAnnotateDraft((d) => d && { ...d, points: [...d.points, w] });
        }
        return;
      }
      if (marquee) {
        setMarquee((m) => m && { ...m, x1: p.x, y1: p.y, path: [...m.path, p] });
        return;
      }
      if (measure) {
        setMeasure((m) => m && { ...m, cursor: toWorld(view, p.x, p.y) });
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
      dragNode,
      dragVertex,
      dragCurve,
      wire,
      panDrag,
      view,
      ribbonDrag,
      dropHint,
      marquee,
      measure,
      edges,
      groups,
      annotateDraft,
    ],
  );

  const onUp = useCallback(
    (e) => {
      if (annotateDraft) {
        if (annotateDraft.type === "arrow") {
          const dx = annotateDraft.to.x - annotateDraft.from.x, dy = annotateDraft.to.y - annotateDraft.from.y;
          if (Math.hypot(dx, dy) * view.scale > 3) {
            setAnnotations((a) => [
              ...a,
              { id: genId(), type: "arrow", from: annotateDraft.from, to: annotateDraft.to, color: annotationStyle.arrowColor },
            ]);
          }
        } else if (annotateDraft.points.length > 1) {
          setAnnotations((a) => [
            ...a,
            {
              id: genId(),
              type: annotateDraft.type,
              points: annotateDraft.points,
              color: annotateDraft.type === "marker" ? annotationStyle.markerColor : annotationStyle.highlighterColor,
              width: annotateDraft.type === "marker" ? annotationStyle.markerWidth : annotationStyle.highlighterWidth,
            },
          ]);
        }
        setAnnotateDraft(null);
        return;
      }
      if (marquee) {
        const x0 = Math.min(marquee.x0, marquee.x1), x1 = Math.max(marquee.x0, marquee.x1);
        const y0 = Math.min(marquee.y0, marquee.y1), y1 = Math.max(marquee.y0, marquee.y1);
        const hitIds = nodes
          .filter((n) => {
            const c = centerScreen(n, view);
            if (marquee.shape === "ellipse") {
              const rx = (x1 - x0) / 2, ry = (y1 - y0) / 2;
              if (rx <= 0 || ry <= 0) return false;
              const cx = x0 + rx, cy = y0 + ry;
              return ((c.x - cx) / rx) ** 2 + ((c.y - cy) / ry) ** 2 <= 1;
            }
            if (marquee.shape === "freeform") return pointInPolygon(c.x, c.y, marquee.path);
            return c.x >= x0 && c.x <= x1 && c.y >= y0 && c.y <= y1;
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
    [ribbonDrag, wire, snapTo, edges, view, onConsumeRibbonDrag, marquee, nodes, hoverSplice, annotateDraft, annotationStyle],
  );

  // Alt/Option+click on a node or vertex adds a bezier handle to every reach
  // segment touching that point (at the segment midpoint) instead of
  // starting a position-drag. Idempotent — clicking the same point again
  // leaves an already-curved segment alone rather than flattening it back.
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

  // Commits the in-progress text-box annotation (on blur, Escape, or when a
  // new one is started) — a blank box is discarded rather than left as a
  // stray empty annotation.
  const commitTextEditing = () => {
    if (textEditing && textEditing.value.trim()) {
      setAnnotations((a) => [...a, { id: textEditing.id, type: "text", x: textEditing.x, y: textEditing.y, value: textEditing.value }]);
    }
    setTextEditing(null);
  };
  const deleteAnnotation = (id) => setAnnotations((a) => a.filter((an) => an.id !== id));

  // Segment distances + running total, in metres (same ground scale as the
  // footer's scale bar) — used for both the live in-progress readout and the
  // finished measure line's labels.
  const measureDistances = (points) => {
    const segs = [];
    let total = 0;
    for (let i = 0; i < points.length - 1; i++) {
      const dx = points[i + 1].x - points[i].x, dy = points[i + 1].y - points[i].y;
      const m = Math.hypot(dx, dy) * METERS_PER_WORLD_UNIT;
      total += m;
      segs.push(m);
    }
    return { segs, total };
  };

  // Enter/double-click ends the current measure line. A plain measure just
  // stays drawn (with its distance labels) until cleared; a Transect instead
  // opens the demo DEM/water-stage popup for the drawn length.
  const finishMeasure = () => {
    if (!measure || measure.points.length < 2) {
      setMeasure(null);
      return;
    }
    const { total } = measureDistances(measure.points);
    if (measure.mode === "transect") {
      setTransectPopup({ lengthM: total });
    } else {
      setFinishedMeasure({ points: measure.points });
    }
    setMeasure(null);
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
        if (textEditing) { commitTextEditing(); return; }
        if (annotateDraft) return setAnnotateDraft(null);
        if (contextMenu) return setContextMenu(null);
        if (picker) return setPicker(null);
        if (reachPicker) return setReachPicker(null);
        if (confirmId) return setConfirmId(null);
        if (transectPopup) return setTransectPopup(null);
        if (measure) return setMeasure(null);
        if (marquee) return setMarquee(null);
        if (wire) {
          setWire(null);
          setSnapTo(null);
          return;
        }
        if (selectedVertex) return setSelectedVertex(null);
        if (annotateTool) return setAnnotateTool(null);
        return setSelected([]);
      }
      if ((e.key === "Enter" || e.key === "NumpadEnter") && measure && !isTyping(e)) {
        e.preventDefault();
        finishMeasure();
        return;
      }
      if (
        (e.key === "Delete" || e.key === "Backspace") &&
        selected.length &&
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
  }, [selected, selectedVertex, confirmId, picker, reachPicker, wire, spaceHeld, zoomBy, resetView, nodes, togglePanMode, toggleZoomMode, measure, marquee, transectPopup, contextMenu, textEditing, annotateDraft, annotateTool, setAnnotateTool]);

  // Middle-click, space/Pan-tool held drag always pans. A plain left-click
  // hold on empty canvas also pans, but only while nothing is selected —
  // otherwise it deselects (as before).
  const onWrapDown = (e) => {
    setContextMenu(null);
    if (e.button === 1 || ((panMode || spaceHeld) && e.button === 0)) {
      e.preventDefault();
      setPanDrag({ sx: e.clientX, sy: e.clientY, tx0: view.tx, ty0: view.ty });
      return;
    }
    if (annotateTool && e.target === e.currentTarget && e.button === 0) {
      // Prevent the browser's default mousedown behaviour (blurring
      // whatever's focused, since this non-focusable wrap div "wins" the
      // click) — without this, the text box's autoFocus textarea gets
      // immediately un-focused right after mounting.
      e.preventDefault();
      const p = pt(e);
      const w = toWorld(view, p.x, p.y);
      if (annotateTool === "textbox") {
        commitTextEditing();
        setTextEditing({ id: genId(), x: w.x, y: w.y, value: "" });
        return;
      }
      if (annotateTool === "marker" || annotateTool === "highlighter") {
        setAnnotateDraft({ type: annotateTool, points: [w] });
        return;
      }
      if (annotateTool === "arrow") {
        setAnnotateDraft({ type: "arrow", from: w, to: w });
        return;
      }
    }
    if (zoomMode && e.button === 0 && e.target === e.currentTarget) {
      e.preventDefault();
      zoomBy(e.altKey ? 1 / KEY_ZOOM_FACTOR : KEY_ZOOM_FACTOR, pt(e));
      return;
    }
    if (activeTool === 1 && e.target === e.currentTarget && e.button === 0) {
      const p = pt(e);
      const mode = e.shiftKey ? "add" : e.altKey ? "subtract" : "replace";
      setMarquee({ mode, shape: groupSelectShape, x0: p.x, y0: p.y, x1: p.x, y1: p.y, path: [p] });
      return;
    }
    if (activeTool === 2 && e.target === e.currentTarget && e.button === 0) {
      const p = pt(e);
      const w = toWorld(view, p.x, p.y);
      setMeasure((m) => {
        if (!m) return { mode: measureArmedMode, points: [w], cursor: w };
        return { ...m, points: [...m.points, w], cursor: w };
      });
      return;
    }
    // Box-select (marquee) via modifier keys: Ctrl/Shift+drag adds to the
    // selection, Alt+drag removes from it — works on plain empty-canvas
    // drag regardless of which tool is active (rect shape).
    if (e.target === e.currentTarget && e.button === 0) {
      const p = pt(e);
      if (e.ctrlKey || e.shiftKey) {
        setMarquee({ mode: "add", shape: "rect", x0: p.x, y0: p.y, x1: p.x, y1: p.y, path: [p] });
        return;
      }
      if (e.altKey) {
        setMarquee({ mode: "subtract", shape: "rect", x0: p.x, y0: p.y, x1: p.x, y1: p.y, path: [p] });
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
    if (textEditing) return [{ label: "Type your note" }, { label: "Click away or Esc to finish" }];
    if (annotateTool === "textbox") return [{ label: "Click to place a text box" }, { label: "Esc to stop" }];
    if (annotateTool === "marker" || annotateTool === "highlighter") return [{ label: "Drag to draw" }, { label: "Esc to stop" }];
    if (annotateTool === "arrow") return [{ label: "Drag from start to end" }, { label: "Esc to stop" }];
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
    if (measure) return [{ label: "Click to add a point" }, { label: "Enter/double-click to finish" }];
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
                  : annotateTool === "textbox"
                    ? "text"
                    : annotateTool
                      ? "crosshair"
                      : dragNode || dragVertex || dragCurve || wire
                        ? "crosshair"
                        : "default",
        }}
        onMouseMove={onMove}
        onMouseUp={onUp}
        onMouseDown={onWrapDown}
        onDoubleClick={() => measure && finishMeasure()}
        onContextMenu={(e) => { if (e.target === e.currentTarget) { e.preventDefault(); setContextMenu(null); } }}
        onMouseLeave={() => {
          setDragNode(null);
          setDragVertex(null);
          setDragCurve(null);
          setWire(null);
          setSnapTo(null);
          setHovered(null);
          setPanDrag(null);
          setMarquee(null);
          setHoverSplice(null);
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
            top: 12,
            left: 12,
            zIndex: 12,
            display: "flex",
            flexDirection: "column",
            gap: 2,
            padding: 4,
            background: "var(--surface-1)",
            border: "1px solid var(--border-primary)",
            borderRadius: 4,
            boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
          }}
        >
          {railTools.map((t, i) => {
            // The group-select rail icon reflects whichever shape (rect/
            // ellipse/freeform) is currently armed via its submenu.
            const icon = i === 1 ? GROUP_SELECT_SHAPES.find((s) => s.id === groupSelectShape).icon : t.icon;
            return (
              <div key={t.name} style={{ position: "relative" }}>
                <button
                  title={t.name + (t.hasMenu ? " (click for options)" : "")}
                  onClick={() => {
                    setActiveTool(i);
                    if (i === 1) setGroupSelectMenuOpen((v) => !v);
                    if (i === 2) setMeasureMenuOpen((v) => !v);
                  }}
                  style={{
                    width: 28,
                    height: 28,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: "none",
                    borderRadius: 2,
                    cursor: "pointer",
                    background:
                      activeTool === i ? "var(--surface-4)" : "transparent",
                  }}
                  onMouseOver={(e) => {
                    if (activeTool !== i)
                      e.currentTarget.style.background = "var(--surface-3)";
                  }}
                  onMouseOut={(e) => {
                    if (activeTool !== i)
                      e.currentTarget.style.background = "transparent";
                  }}
                >
                  <Icon src={icon} size={16} />
                  {t.hasMenu && (
                    <div
                      style={{
                        position: "absolute",
                        right: 1,
                        bottom: 1,
                        width: 0,
                        height: 0,
                        borderLeft: "3.5px solid transparent",
                        borderBottom: "3.5px solid var(--text-tertiary)",
                        pointerEvents: "none",
                      }}
                    />
                  )}
                </button>

                {i === 1 && groupSelectMenuOpen && (
                  <div
                    onMouseDown={(e) => e.stopPropagation()}
                    style={{
                      position: "absolute", left: "100%", top: 0, marginLeft: 4, zIndex: 30, width: 150,
                      background: "var(--surface-1)", border: "1px solid var(--border-primary)",
                      borderRadius: 2, boxShadow: "0 2px 4px rgba(0,0,0,0.1)", padding: 4,
                      display: "flex", flexDirection: "column", gap: 2,
                    }}
                  >
                    {GROUP_SELECT_SHAPES.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => { setGroupSelectShape(s.id); setActiveTool(1); setGroupSelectMenuOpen(false); }}
                        style={{
                          display: "flex", alignItems: "center", gap: 4, height: 24, padding: 4,
                          border: "none", borderRadius: 2, cursor: "pointer", textAlign: "left",
                          background: groupSelectShape === s.id ? "var(--surface-3)" : "transparent",
                          fontSize: "var(--fs-xs)", color: "var(--text-primary)",
                        }}
                      >
                        <Icon src={s.icon} size={16} />
                        {s.label}
                      </button>
                    ))}
                  </div>
                )}

                {i === 2 && measureMenuOpen && (
                  <div
                    onMouseDown={(e) => e.stopPropagation()}
                    style={{
                      position: "absolute", left: "100%", top: 0, marginLeft: 4, zIndex: 30, width: 150,
                      background: "var(--surface-1)", border: "1px solid var(--border-primary)",
                      borderRadius: 2, boxShadow: "0 2px 4px rgba(0,0,0,0.1)", padding: 4,
                      display: "flex", flexDirection: "column", gap: 2,
                    }}
                  >
                    <button
                      onClick={() => { setMeasureArmedMode("measure"); setActiveTool(2); setMeasureMenuOpen(false); }}
                      style={{
                        display: "flex", alignItems: "center", gap: 4, height: 24, padding: 4,
                        border: "none", borderRadius: 2, cursor: "pointer", textAlign: "left",
                        background: measureArmedMode === "measure" ? "var(--surface-3)" : "transparent",
                        fontSize: "var(--fs-xs)", color: "var(--text-primary)",
                      }}
                    >
                      <Icon src={A.measureTool} size={16} />
                      Measure
                    </button>
                    <button
                      onClick={() => { setMeasureArmedMode("transect"); setActiveTool(2); setMeasureMenuOpen(false); }}
                      style={{
                        display: "flex", alignItems: "center", gap: 4, height: 24, padding: 4,
                        border: "none", borderRadius: 2, cursor: "pointer", textAlign: "left",
                        background: measureArmedMode === "transect" ? "var(--surface-3)" : "transparent",
                        fontSize: "var(--fs-xs)", color: "var(--text-primary)",
                      }}
                    >
                      <Icon src={A.measureTool} size={16} />
                      Transect
                    </button>
                  </div>
                )}
              </div>
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
            top: 12,
            right: 12,
            zIndex: 12,
            display: "flex",
            flexDirection: "column",
            gap: 8,
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
          ].map((b) => (
            <div
              key={b.name}
              title={b.name}
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
                width: 34,
                height: 34,
                borderRadius: "50%",
                background: b.active ? "var(--surface-4)" : "var(--surface-1)",
                border: "1px solid var(--border-primary)",
                boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "grab",
              }}
            >
              <Icon src={b.icon} size={18} style={b.iconStyle} />
            </div>
          ))}
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
                    return (
                      <g key={i}>
                        <path
                          d={`M ${c1.screen.x} ${c1.screen.y} Q ${cs.x} ${cs.y} ${c2.screen.x} ${c2.screen.y}`}
                          stroke={reachStroke}
                          strokeWidth={hoverLine === e.id + ":" + i ? 3.5 : 2.5}
                          fill="none"
                          strokeLinecap="round"
                          style={{ pointerEvents: "stroke", cursor: "pointer" }}
                          onMouseEnter={() => setHoverLine(e.id + ":" + i)}
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
        </svg>

        {/* Group-select marquee + measure/transect overlay — separate layer
            so it doesn't interfere with the reach-editing svg's hit testing. */}
        <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}>
          {marquee && marquee.shape === "rect" && (
            <rect
              x={Math.min(marquee.x0, marquee.x1)} y={Math.min(marquee.y0, marquee.y1)}
              width={Math.abs(marquee.x1 - marquee.x0)} height={Math.abs(marquee.y1 - marquee.y0)}
              fill={marquee.mode === "subtract" ? "rgba(225,69,91,0.1)" : "rgba(70,138,243,0.1)"}
              stroke={marquee.mode === "subtract" ? "var(--red-700)" : "var(--blue-700)"}
              strokeWidth={1} strokeDasharray="4 3"
            />
          )}
          {marquee && marquee.shape === "ellipse" && (
            <ellipse
              cx={(marquee.x0 + marquee.x1) / 2} cy={(marquee.y0 + marquee.y1) / 2}
              rx={Math.abs(marquee.x1 - marquee.x0) / 2} ry={Math.abs(marquee.y1 - marquee.y0) / 2}
              fill={marquee.mode === "subtract" ? "rgba(225,69,91,0.1)" : "rgba(70,138,243,0.1)"}
              stroke={marquee.mode === "subtract" ? "var(--red-700)" : "var(--blue-700)"}
              strokeWidth={1} strokeDasharray="4 3"
            />
          )}
          {marquee && marquee.shape === "freeform" && (
            <polygon
              points={marquee.path.map((p) => `${p.x},${p.y}`).join(" ")}
              fill={marquee.mode === "subtract" ? "rgba(225,69,91,0.1)" : "rgba(70,138,243,0.1)"}
              stroke={marquee.mode === "subtract" ? "var(--red-700)" : "var(--blue-700)"}
              strokeWidth={1} strokeDasharray="4 3"
            />
          )}

          {/* In-progress measure/transect line — each drawn segment gets its
              own distance label, plus a live segment out to the cursor. */}
          {measure && (() => {
            const screenPts = measure.points.map((w) => toScreen(view, w.x, w.y));
            const cursorScreen = toScreen(view, measure.cursor.x, measure.cursor.y);
            const { segs, total } = measureDistances([...measure.points, measure.cursor]);
            const color = measure.mode === "transect" ? "var(--node-selected-border)" : "var(--blue-700)";
            return (
              <g>
                {screenPts.slice(0, -1).map((p1, i) => {
                  const p2 = screenPts[i + 1];
                  return <line key={i} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke={color} strokeWidth={2} />;
                })}
                <line x1={screenPts[screenPts.length - 1].x} y1={screenPts[screenPts.length - 1].y} x2={cursorScreen.x} y2={cursorScreen.y} stroke={color} strokeWidth={2} strokeDasharray="4 3" />
                {screenPts.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r={3.5} fill={color} />)}
                {segs.slice(0, -1).map((m, i) => {
                  const p1 = screenPts[i], p2 = screenPts[i + 1];
                  return (
                    <text key={i} x={(p1.x + p2.x) / 2} y={(p1.y + p2.y) / 2 - 6} textAnchor="middle" fontSize={10} fill="var(--text-primary)" style={{ paintOrder: "stroke", stroke: "#fff", strokeWidth: 3 }}>
                      {m.toFixed(1)}m
                    </text>
                  );
                })}
                <text x={cursorScreen.x} y={cursorScreen.y - 12} textAnchor="middle" fontSize={11} fontWeight={600} fill={color} style={{ paintOrder: "stroke", stroke: "#fff", strokeWidth: 3 }}>
                  {segs[segs.length - 1].toFixed(1)}m · total {total.toFixed(1)}m
                </text>
              </g>
            );
          })()}

          {/* Finished measure line stays drawn (with its labels) until a new
              one starts or the tool changes. */}
          {finishedMeasure && (() => {
            const screenPts = finishedMeasure.points.map((w) => toScreen(view, w.x, w.y));
            const { segs, total } = measureDistances(finishedMeasure.points);
            return (
              <g>
                {screenPts.slice(0, -1).map((p1, i) => {
                  const p2 = screenPts[i + 1];
                  return <line key={i} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="var(--blue-700)" strokeWidth={2} />;
                })}
                {screenPts.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r={3.5} fill="var(--blue-700)" />)}
                {segs.map((m, i) => {
                  const p1 = screenPts[i], p2 = screenPts[i + 1];
                  return (
                    <text key={i} x={(p1.x + p2.x) / 2} y={(p1.y + p2.y) / 2 - 6} textAnchor="middle" fontSize={10} fill="var(--text-primary)" style={{ paintOrder: "stroke", stroke: "#fff", strokeWidth: 3 }}>
                      {m.toFixed(1)}m
                    </text>
                  );
                })}
                <text x={screenPts[screenPts.length - 1].x} y={screenPts[screenPts.length - 1].y - 12} textAnchor="middle" fontSize={11} fontWeight={600} fill="var(--blue-700)" style={{ paintOrder: "stroke", stroke: "#fff", strokeWidth: 3 }}>
                  total {total.toFixed(1)}m
                </text>
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

        {/* Annotation layer (Home tab's Add Content tools) — sits above
            nodes/groups, persists across pan/zoom via world-space points
            like the measure tool. Marker = opaque ink; Highlighter = wide,
            translucent, multiply-blended so it reads like a real highlighter
            over whatever's underneath; Arrows get a filled arrowhead. */}
        <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}>
          <defs>
            {annotations.filter((a) => a.type === "arrow").map((a) => (
              <marker key={a.id} id={`arrowhead-${a.id}`} markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto" markerUnits="userSpaceOnUse">
                <path d="M0,0 L8,4 L0,8 Z" fill={a.color} />
              </marker>
            ))}
            {annotateDraft?.type === "arrow" && (
              <marker id="arrowhead-draft" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto" markerUnits="userSpaceOnUse">
                <path d="M0,0 L8,4 L0,8 Z" fill={annotationStyle.arrowColor} />
              </marker>
            )}
          </defs>
          {annotations.map((a) => {
            if (a.type === "marker" || a.type === "highlighter") {
              const pts = a.points.map((w) => toScreen(view, w.x, w.y));
              const d = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
              return (
                <path key={a.id} d={d} fill="none" stroke={a.color} strokeWidth={a.width}
                  strokeLinecap="round" strokeLinejoin="round"
                  opacity={a.type === "highlighter" ? 0.35 : 1}
                  style={a.type === "highlighter" ? { mixBlendMode: "multiply" } : undefined}
                />
              );
            }
            if (a.type === "arrow") {
              const p1 = toScreen(view, a.from.x, a.from.y), p2 = toScreen(view, a.to.x, a.to.y);
              return (
                <line key={a.id} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke={a.color} strokeWidth={2.5}
                  strokeLinecap="round" markerEnd={`url(#arrowhead-${a.id})`} />
              );
            }
            return null;
          })}
          {annotateDraft && annotateDraft.type !== "arrow" && (() => {
            const pts = annotateDraft.points.map((w) => toScreen(view, w.x, w.y));
            const d = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
            const color = annotateDraft.type === "marker" ? annotationStyle.markerColor : annotationStyle.highlighterColor;
            const width = annotateDraft.type === "marker" ? annotationStyle.markerWidth : annotationStyle.highlighterWidth;
            return (
              <path d={d} fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round"
                opacity={annotateDraft.type === "highlighter" ? 0.35 : 1}
                style={annotateDraft.type === "highlighter" ? { mixBlendMode: "multiply" } : undefined} />
            );
          })()}
          {annotateDraft?.type === "arrow" && (() => {
            const p1 = toScreen(view, annotateDraft.from.x, annotateDraft.from.y), p2 = toScreen(view, annotateDraft.to.x, annotateDraft.to.y);
            return <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke={annotationStyle.arrowColor} strokeWidth={2.5} strokeLinecap="round" markerEnd="url(#arrowhead-draft)" />;
          })()}
        </svg>

        {/* Text box annotations — plain HTML so they're editable in place
            (double-click to re-edit, small × to delete). */}
        {annotations.filter((a) => a.type === "text").map((a) => {
          const s = toScreen(view, a.x, a.y);
          return (
            <div key={a.id}
              onDoubleClick={(e) => {
                e.stopPropagation();
                setTextEditing({ id: a.id, x: a.x, y: a.y, value: a.value });
                deleteAnnotation(a.id);
              }}
              onMouseDown={(e) => e.stopPropagation()}
              title="Double-click to edit"
              style={{
                position: "absolute", left: s.x, top: s.y, maxWidth: 220,
                background: "rgba(255,255,255,0.92)", border: "1.5px solid var(--blue-700)", borderRadius: 3,
                padding: "4px 6px", fontSize: "var(--fs-xs)", color: "var(--text-primary)",
                whiteSpace: "pre-wrap", wordBreak: "break-word", cursor: "text", boxShadow: "0 1px 4px rgba(0,0,0,0.1)",
              }}
            >
              {a.value}
              <button
                onClick={(e) => { e.stopPropagation(); deleteAnnotation(a.id); }}
                onMouseDown={(e) => e.stopPropagation()}
                title="Delete"
                style={{
                  position: "absolute", top: -8, right: -8, width: 16, height: 16, borderRadius: "50%",
                  border: "1px solid var(--border-primary)", background: "#fff", color: "var(--text-tertiary)",
                  fontSize: 10, lineHeight: "14px", cursor: "pointer", padding: 0,
                }}
              >×</button>
            </div>
          );
        })}

        {/* In-progress text box being typed — commits (if non-empty) on
            blur or Escape, matching commitTextEditing. */}
        {textEditing && (() => {
          const s = toScreen(view, textEditing.x, textEditing.y);
          return (
            <textarea
              autoFocus
              value={textEditing.value}
              onChange={(e) => setTextEditing((te) => te && { ...te, value: e.target.value })}
              onBlur={commitTextEditing}
              onMouseDown={(e) => e.stopPropagation()}
              placeholder="Type a note…"
              style={{
                position: "absolute", left: s.x, top: s.y, minWidth: 140, maxWidth: 260, minHeight: 28,
                background: "#fff", border: "1.5px solid var(--blue-700)", borderRadius: 3,
                padding: "4px 6px", fontSize: "var(--fs-xs)", fontFamily: "inherit", color: "var(--text-primary)",
                resize: "both", zIndex: 20, boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
              }}
            />
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
          <MapFooter cursorWorld={cursorWorld} scale={view.scale} guideItems={guideItems} showAttribution={showBasemap} />
        </div>
      </div>

      {transectPopup && (
        <TransectPopup lengthM={transectPopup.lengthM} onClose={() => setTransectPopup(null)} />
      )}
    </div>
  );
}
