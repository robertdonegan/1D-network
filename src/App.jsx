import { useState, useEffect, useMemo, useRef } from "react";
import OSWindow from "./components/OSWindow.jsx";
import ModeRibbon, { modes, DEFAULT_FAVOURITES, DEFAULT_FAVOURITE_LISTS } from "./components/ModeRibbon.jsx";
import PanelSlot from "./components/PanelSlot.jsx";
import GisCanvas from "./components/GisCanvas.jsx";
import KeyboardShortcuts from "./components/KeyboardShortcuts.jsx";
import AnnotationSettings from "./components/AnnotationSettings.jsx";
import AddLayerModal from "./components/AddLayerModal.jsx";
import { ToolboxPanelBody } from "./components/ToolboxPanel.jsx";
import { A, Icon } from "./assets.jsx";
import { resolveReaches } from "./reaches.js";
import { mockFlowForEdge } from "./flowMock.js";

// Nodes/edges are owned here (not inside GisCanvas) so the live network list
// in NetworkPanel can mirror exactly what's on the canvas.
// World coords are real-georeferenced (via OsmBasemap's lonLatToWorld) —
// sampled at 8 evenly-spaced points along the actual River Severn's centre-
// line through Upton-upon-Severn (OpenStreetMap `waterway=river` geometry,
// north from Hanley Road down past the town and on towards Ryall/Naunton),
// so the demo network lines up believably with the OSM backdrop and traces
// a real, recognisable bend instead of an arbitrary straight line. See
// GisCanvas's default `view` for the matching pan/zoom.
const INIT_NODES = [
  { id: "n0", icon: "flowTime",     shape: "square",  x: -488, y: -915, label: "M014",  unitLabel: "Flow-Time" },
  { id: "n1", icon: "crossSection", shape: "square",  x: -623, y: -686, label: "M015",  unitLabel: "River Section" },
  { id: "n2", icon: "interpolate",  shape: "diamond", x: -567, y: -428, label: "M0155", unitLabel: "Interpolate" },
  { id: "n3", icon: "crossSection", shape: "square",  x: -368, y: -255, label: "M016",  unitLabel: "River Section" },
  { id: "n4", icon: "calcPointWeir",shape: "square",  x: -111, y: -172, label: "M017",  unitLabel: "Calc Point Weir" },
  { id: "n5", icon: "interpolate",  shape: "diamond", x: -2,   y: 64,   label: "M0175", unitLabel: "Interpolate" },
  { id: "n6", icon: "crossSection", shape: "square",  x: -29,  y: 333,  label: "M018",  unitLabel: "River Section" },
  { id: "n7", icon: "normalDepth",  shape: "square",  x: -193, y: 531,  label: "M026",  unitLabel: "Normal Depth" },
];
const INIT_EDGES = [["n0","n1"],["n1","n2"],["n2","n3"],["n3","n4"],["n4","n5"],["n5","n6"],["n6","n7"]]
  .map((e, i) => ({ id: "e" + i, from: e[0], to: e[1], points: [] }));

// Two demo shapefiles the user drew in-app with the Pen tool, exported via
// the Layers tab's right-click "Export" and supplied back to seed every
// user's default view with a real, accurate shapefile (rather than the
// blank "Example polygon layer" alone) — same world-space coordinates as
// INIT_NODES above, so they sit exactly where drawn relative to the demo
// network and OSM backdrop, roughly bracketing the river's northern
// (Hanley/Ryall) and southern (Upton/Ryall) floodplain-shaped bends.
const INIT_POLYGONS = [
  {
    id: "dp0", name: "Polygon 1", layerId: "demo-shapefile", holes: [],
    points: [
      { id: "dp0v0", x: -546.0, y: -330.5 },
      { id: "dp0v1", x: -499.3, y: -299.1 },
      { id: "dp0v2", x: -456.2, y: -270.2 },
      { id: "dp0v3", x: -375.3, y: -227.7 },
      { id: "dp0v4", x: -298.6, y: -202.2 },
      { id: "dp0v5", x: -239.9, y: -184.7 },
      { id: "dp0v6", x: -165.1, y: -159.9 },
      { id: "dp0v7", x: -99.3, y: -120.7 },
      { id: "dp0v8", x: -58.9, y: -52.6 },
      { id: "dp0v9", x: -31.3, y: 20.7 },
      { id: "dp0v10", x: -25.4, y: 82.1 },
      { id: "dp0v11", x: -20.7, y: 147.1 },
      { id: "dp0v12", x: -36.2, y: 220.9 },
      { id: "dp0v13", x: -40.1, y: 291.9 },
      { id: "dp0v14", x: -58.8, y: 362.9 },
      { id: "dp0v15", x: -84.4, y: 429.9 },
      { id: "dp0v16", x: -128.9, y: 470.1 },
      { id: "dp0v17", x: -175.4, y: 494.3 },
      { id: "dp0v18", x: -241.5, y: 535.2 },
      { id: "dp0v19", x: -442.9, y: 467.6 },
      { id: "dp0v20", x: -609.9, y: 244.2 },
      { id: "dp0v21", x: -646.7, y: -70.2 },
      { id: "dp0v22", x: -627.0, y: -266.6 },
    ],
  },
  {
    id: "dp1", name: "Polygon 2", layerId: "demo-shapefile", holes: [],
    points: [
      { id: "dp1v0", x: -589.7, y: -698.7 },
      { id: "dp1v1", x: -597.1, y: -631.2 },
      { id: "dp1v2", x: -599.6, y: -564.0 },
      { id: "dp1v3", x: -577.7, y: -498.6 },
      { id: "dp1v4", x: -553.0, y: -447.2 },
      { id: "dp1v5", x: -525.9, y: -390.6 },
      { id: "dp1v6", x: -472.7, y: -335.9 },
      { id: "dp1v7", x: -401.1, y: -292.3 },
      { id: "dp1v8", x: -338.1, y: -261.7 },
      { id: "dp1v9", x: -253.2, y: -236.2 },
      { id: "dp1v10", x: -185.7, y: -221.9 },
      { id: "dp1v11", x: -128.0, y: -204.3 },
      { id: "dp1v12", x: -81.8, y: -178.9 },
      { id: "dp1v13", x: -36.5, y: -137.0 },
      { id: "dp1v14", x: -9.0, y: -92.3 },
      { id: "dp1v15", x: 6.5, y: -43.0 },
      { id: "dp1v16", x: 13.6, y: -3.8 },
      { id: "dp1v17", x: 111.7, y: -2.9 },
      { id: "dp1v18", x: 156.2, y: -81.4 },
      { id: "dp1v19", x: 207.1, y: -181.1 },
      { id: "dp1v20", x: 232.6, y: -316.9 },
      { id: "dp1v21", x: 205.0, y: -459.0 },
      { id: "dp1v22", x: 135.0, y: -537.5 },
      { id: "dp1v23", x: 45.9, y: -658.4 },
      { id: "dp1v24", x: 22.6, y: -753.8 },
      { id: "dp1v25", x: -130.2, y: -915.1 },
      { id: "dp1v26", x: -244.7, y: -1014.8 },
      { id: "dp1v27", x: -350.8, y: -976.6 },
      { id: "dp1v28", x: -429.3, y: -929.9 },
      { id: "dp1v29", x: -505.6, y: -858.6 },
      { id: "dp1v30", x: -551.2, y: -801.7 },
      { id: "dp1v31", x: -571.4, y: -743.5 },
    ],
  },
];
let layerUid = 1;

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
      width: 8, flexShrink: 0, cursor: "col-resize", display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <div style={{ width: 2, height: 32, borderRadius: 1, background: "var(--border-secondary)" }} />
    </div>
  );
}

// Blender-style "drag the gap between panels to reveal a new one". Both
// grips use the same rule: while the panel starts closed (size 0), a small
// release just snaps back shut instead of leaving an awkward sliver open —
// once it's actually open, dragging back down/right to 0 closes it too, no
// separate snap needed.
const REVEAL_MAX = 400, REVEAL_OPEN_MIN = 80, REVEAL_CANCEL_BELOW = 40;

// Invisible strip overlaid on the canvas's bottom edge — takes no layout
// space of its own (position:absolute, not in flow), so the canvas sits
// flush with the same padding as every other panel until this is actually
// dragged. Drag up to reveal the bottom-docked panel, down to shrink it.
function BottomRevealHandle({ height, setHeight }) {
  const onDown = (e) => {
    e.preventDefault();
    const wasOpen = height > 0;
    let lastY = e.clientY;
    const onMove = (ev) => {
      const dy = lastY - ev.clientY; // dragging up = positive
      lastY = ev.clientY;
      setHeight((h) => Math.max(0, Math.min(REVEAL_MAX, h + dy)));
    };
    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      if (!wasOpen) setHeight((h) => (h < REVEAL_CANCEL_BELOW ? 0 : Math.max(REVEAL_OPEN_MIN, h)));
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };
  return (
    <div onMouseDown={onDown} title="Drag up to reveal the Global Animator panel" style={{
      position: "absolute", left: 0, right: 0, bottom: height, height: 8, cursor: "row-resize", zIndex: 15,
    }} />
  );
}

// Invisible hit-zone tucked into the canvas's top-right corner, inside the
// 12px inset before the North/Zoom/Pan nav buttons start — so it never
// overlaps or displaces them. No visible icon; drag left to reveal a new
// vertical panel between the canvas and the right-hand panel, switchable
// via its own title dropdown like any other panel slot.
function CornerRevealGrip({ width, setWidth }) {
  const onDown = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const wasOpen = width > 0;
    let lastX = e.clientX;
    const onMove = (ev) => {
      const dx = lastX - ev.clientX; // dragging left = positive
      lastX = ev.clientX;
      setWidth((w) => Math.max(0, Math.min(REVEAL_MAX + 80, w + dx)));
    };
    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      if (!wasOpen) setWidth((w) => (w < 60 ? 0 : Math.max(180, w)));
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };
  return (
    <div onMouseDown={onDown} title="Drag left to reveal a new panel" style={{
      position: "absolute", top: 0, right: 0, width: 10, height: 10, cursor: "nwse-resize", zIndex: 20,
    }} />
  );
}

// Toolbox > "Open Toolbox..." (OS menu) pops this floating, draggable
// window on top of the UI — same ToolboxPanelBody the docked mid-panel
// slot uses, so search/expand state just isn't shared between the two
// (each is its own mount, matching how every other panel view works).
// The dock icon in its header hands off to the existing corner-panel slot
// (`midPanelView`/`midPanelW` — see CornerRevealGrip) instead of floating.
function FloatingToolbox({ pos, setPos, onDock, onClose }) {
  const onHeaderDown = (e) => {
    e.preventDefault();
    const startX = e.clientX, startY = e.clientY;
    const origin = pos;
    const onMove = (ev) => {
      setPos({ x: origin.x + (ev.clientX - startX), y: origin.y + (ev.clientY - startY) });
    };
    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };
  return (
    <div style={{
      position: "fixed", left: pos.x, top: pos.y, width: 300, height: 680, maxHeight: "85vh", zIndex: 200,
      display: "flex", flexDirection: "column",
      background: "var(--surface-1)", border: "1px solid var(--border-primary)", borderRadius: 4,
      boxShadow: "0 8px 24px rgba(0,0,0,0.2)", overflow: "hidden",
    }}>
      <div
        onMouseDown={onHeaderDown}
        style={{
          display: "flex", alignItems: "center", gap: 6, height: 32, padding: "0 8px", flexShrink: 0,
          cursor: "grab", borderBottom: "1px solid var(--border-primary)", background: "var(--surface-2)",
        }}
      >
        <Icon src={A.toolboxHeaderIcon} size={16} />
        <span style={{ fontSize: "var(--fs-s)", fontWeight: 500, flex: "1 0 0" }}>Toolbox</span>
        <button onClick={onDock} title="Dock into layout" style={{
          border: "none", background: "transparent", cursor: "pointer", padding: 4,
          display: "flex", alignItems: "center", color: "var(--text-tertiary)",
        }}>
          <Icon src={A.dock} size={12} style={{ filter: "invert(1)" }} />
        </button>
        <button onClick={onClose} title="Close" style={{
          border: "none", background: "transparent", cursor: "pointer", padding: 0, fontSize: 14, lineHeight: 1, color: "var(--text-tertiary)",
        }}>×</button>
      </div>
      <ToolboxPanelBody />
    </div>
  );
}

export default function App() {
  const [mode, setMode] = useState("FM 1D");
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [projectW, setProjectW] = useState(232);
  const [networkW, setNetworkW] = useState(232);
  // Which view each side panel slot currently shows — see PanelSlot.jsx's
  // PANEL_VIEWS registry. Defaults match the original fixed layout.
  const [leftView, setLeftView] = useState("project");
  const [rightView, setRightView] = useState("network");
  // Two more slots revealed by dragging the gaps around the canvas
  // (Blender-style area splitting) — both start closed (size 0).
  const [bottomPanelH, setBottomPanelH] = useState(0);
  const [bottomPanelView, setBottomPanelView] = useState("globalanimator");
  const [midPanelW, setMidPanelW] = useState(0);
  const [midPanelView, setMidPanelView] = useState("toolbox");
  // Toolbox > "Open Toolbox..." (OS menu) — floating/undocked window; see
  // FloatingToolbox above. Docking it hands off to the existing mid-panel
  // corner slot instead (`midPanelW`/`midPanelView`).
  const [toolboxFloat, setToolboxFloat] = useState(false);
  const [toolboxPos, setToolboxPos] = useState({ x: 420, y: 90 });
  const [nodes, setNodes] = useState(INIT_NODES);
  const [edges, setEdges] = useState(INIT_EDGES);
  // Vector polygon layers (Live Edit phase 3) — any number of user-created
  // layers (see "Add GIS data" in the Home ribbon / AddLayerModal), plus
  // one seeded "Example polygon layer" for parity with the old single-layer
  // demo. `polygons` stays one flat array (each entry tagged `layerId`) so
  // GisCanvas's existing single-array editing/undo machinery didn't need
  // splitting apart; `layers` is just the per-layer metadata (name, colour,
  // visibility) shown as real, addable/removable/toggleable rows in the
  // Project panel's Layers tab (see ProjectPanel.jsx's LayerRow). Whichever
  // layer is `activeLayerId` is where the Pen tool's next new polygon goes.
  const [polygons, setPolygons] = useState(INIT_POLYGONS);
  const [layers, setLayers] = useState([
    { id: "example", name: "Example polygon layer", color: "var(--orange-900)", visible: true },
    // The two demo shapefiles seeded into INIT_POLYGONS above — blue outline
    // matches the reference screenshot's supplied shapefile styling.
    { id: "demo-shapefile", name: "Demo shapefile", color: "var(--blue-700)", visible: true },
  ]);
  const [activeLayerId, setActiveLayerId] = useState("example");
  const [addLayerModalOpen, setAddLayerModalOpen] = useState(false);
  // Which of the Project panel's own footer tabs is showing — lifted up
  // here (not left as ProjectPanel-local state) purely so creating a layer
  // can force it to "layers", since that's the whole point of the "Create
  // layer..." flow: the new layer should be immediately visible, not left
  // sitting under whichever tab happened to be open before.
  const [projectTab, setProjectTab] = useState("components");
  const addLayer = ({ name, color }) => {
    const id = "layer" + (layerUid++);
    setLayers((ls) => [...ls, { id, name, color, visible: true }]);
    setActiveLayerId(id);
    setAddLayerModalOpen(false);
    setLeftView("project");
    setProjectTab("layers");
  };
  const deleteLayer = (id) => {
    setLayers((ls) => ls.filter((l) => l.id !== id));
    setPolygons((ps) => ps.filter((p) => (p.layerId || "example") !== id));
    setActiveLayerId((cur) => (cur === id ? (layers.find((l) => l.id !== id)?.id ?? "example") : cur));
  };
  const toggleLayerVisibility = (id) => setLayers((ls) => ls.map((l) => (l.id === id ? { ...l, visible: l.visible === false } : l)));
  // Shared with NetworkPanel so a row click selects the node on the canvas.
  // Array of node ids — supports multi-select (Ctrl+click, box-select).
  const [selected, setSelected] = useState([]);
  // Basemap selection ("none" | "osm" | ...), driven by the Home tab's
  // Basemap dropdown and read by GisCanvas to render the backdrop. Only
  // "none"/"osm" are real; `lastBasemap` remembers the last non-none pick so
  // the B shortcut can toggle Grid <-> that basemap. Defaults to "osm" so
  // the seed network's real river-traced path is visibly following the
  // Severn through Upton straight away, not floating over a blank grid.
  const [basemap, setBasemapRaw] = useState("osm");
  const lastBasemapRef = useRef("osm");
  const setBasemap = (id) => {
    if (id !== "none") lastBasemapRef.current = id;
    setBasemapRaw(id);
  };
  const toggleBasemap = () => setBasemapRaw((b) => (b === "none" ? lastBasemapRef.current : "none"));
  // One-shot "pan/zoom here" request from the top-bar location search — same
  // consume-once pattern as ribbonDrag. Turning on the OSM backdrop when a
  // location is picked gives the jump somewhere to actually land visually.
  const [flyTo, setFlyTo] = useState(null);
  const goToLocation = (lat, lon) => {
    setFlyTo({ lat, lon, key: Date.now() });
    if (basemap === "none") setBasemap("osm");
  };
  // In-progress ribbon → canvas drag: { items, index, x, y }. Shared between
  // ModeRibbon/OSWindow (start it, cycle it with Tab) and GisCanvas (consumes it on drop).
  const [ribbonDrag, setRibbonDrag] = useState(null);
  const dragActive = !!ribbonDrag;
  const beginDrag = (e, items, index) => setRibbonDrag({ items, index, x: e.clientX, y: e.clientY });

  // User-managed Favourites (Favourites tab): the tab now holds several
  // named, independent lists (Figma "FMv8.0 Modes / Ribbons" node
  // 2174-36664's leading dropdown chip — "1D/2D Model Build" etc.), not one
  // flat list — `favouriteLists` is just the {id,name} metadata, switchable
  // via the ribbon's dropdown; `favouritesByList` holds each list's actual
  // items keyed by list id. Every item — seeded defaults included, see
  // DEFAULT_FAVOURITES — is treated identically within its list: addable
  // via the star toggle on a global search result (OSWindow) or by
  // dragging a result onto the bar, removable via the chip's "×", and
  // reorderable by dragging one chip onto another (ModeRibbon tracks which
  // chip is hovered mid-drag and reports it back here as `atIndex`). Same
  // `{icon, shape, label, group, top}` shape flattenRibbonItems produces,
  // so a favourite is just as draggable onto the canvas as its original.
  // Persisted to localStorage so favourites/order/lists survive a reload;
  // items are keyed by group+label since that pair is unique across
  // ALL_ITEMS. A legacy single-list save (from before multi-list support)
  // is migrated into the first (default) list on load.
  const [favouriteLists, setFavouriteLists] = useState(() => {
    try {
      const saved = localStorage.getItem("fm-favourite-lists");
      return saved ? JSON.parse(saved) : DEFAULT_FAVOURITE_LISTS;
    } catch { return DEFAULT_FAVOURITE_LISTS; }
  });
  useEffect(() => {
    try { localStorage.setItem("fm-favourite-lists", JSON.stringify(favouriteLists)); } catch { /* ignore */ }
  }, [favouriteLists]);
  const [activeFavouriteListId, setActiveFavouriteListId] = useState(() => {
    try { return localStorage.getItem("fm-active-favourite-list") || DEFAULT_FAVOURITE_LISTS[0].id; } catch { return DEFAULT_FAVOURITE_LISTS[0].id; }
  });
  useEffect(() => {
    try { localStorage.setItem("fm-active-favourite-list", activeFavouriteListId); } catch { /* ignore */ }
  }, [activeFavouriteListId]);
  const [favouritesByList, setFavouritesByList] = useState(() => {
    try {
      const saved = localStorage.getItem("fm-favourites");
      const parsed = saved ? JSON.parse(saved) : null;
      // Legacy shape was a flat array — migrate it onto the default list.
      if (Array.isArray(parsed)) return { [DEFAULT_FAVOURITE_LISTS[0].id]: parsed };
      if (parsed && typeof parsed === "object") return parsed;
      return { [DEFAULT_FAVOURITE_LISTS[0].id]: DEFAULT_FAVOURITES };
    } catch { return { [DEFAULT_FAVOURITE_LISTS[0].id]: DEFAULT_FAVOURITES }; }
  });
  useEffect(() => {
    try { localStorage.setItem("fm-favourites", JSON.stringify(favouritesByList)); } catch { /* ignore */ }
  }, [favouritesByList]);
  const favourites = favouritesByList[activeFavouriteListId] || [];
  const setFavourites = (updater) => setFavouritesByList((byList) => ({
    ...byList,
    [activeFavouriteListId]: typeof updater === "function" ? updater(byList[activeFavouriteListId] || []) : updater,
  }));
  const favouriteKey = (it) => `${it.group}/${it.label}`;
  const isFavourite = (it) => favourites.some((f) => favouriteKey(f) === favouriteKey(it));
  const addFavourite = (it) => setFavourites((favs) => (favs.some((f) => favouriteKey(f) === favouriteKey(it)) ? favs : [...favs, it]));
  const removeFavourite = (it) => setFavourites((favs) => favs.filter((f) => favouriteKey(f) !== favouriteKey(it)));
  const toggleFavourite = (it) => (isFavourite(it) ? removeFavourite(it) : addFavourite(it));
  const selectFavouriteList = (id) => setActiveFavouriteListId(id);
  // "+ Create new list" — adds a new, empty named list and switches to it
  // straight away, same as picking any other list from the dropdown.
  const createFavouriteList = (name) => {
    const id = `${name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}-${Date.now().toString(36)}`;
    setFavouriteLists((lists) => [...lists, { id, name: name.trim() }]);
    setFavouritesByList((byList) => ({ ...byList, [id]: [] }));
    setActiveFavouriteListId(id);
  };
  // Unified add-or-reorder drop handler for the Favourites bar: dropping an
  // *existing* favourite onto another one moves it to that position;
  // dropping a new item (from search/ribbon) inserts it there (or appends
  // if dropped on empty space, atIndex == null).
  const handleFavouriteDrop = (item, atIndex) => {
    setFavourites((favs) => {
      const key = favouriteKey(item);
      const from = favs.findIndex((f) => favouriteKey(f) === key);
      const next = favs.slice();
      if (from !== -1) next.splice(from, 1);
      const insertAt = atIndex == null ? next.length : Math.min(atIndex, next.length);
      next.splice(insertAt, 0, item);
      return next;
    });
  };

  // Global search's "Recents" section: the last 5 distinct results the user
  // has actually picked (dragged onto the canvas, or re-picked from Recents
  // itself), most-recent first — same MRU pattern as a browser's address
  // bar. Persisted to localStorage like Favourites so it survives a reload.
  // Picking an item that's already in the list moves it back to the front
  // rather than duplicating it.
  const [recentSearches, setRecentSearches] = useState(() => {
    try {
      const saved = localStorage.getItem("fm-recent-searches");
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  useEffect(() => {
    try { localStorage.setItem("fm-recent-searches", JSON.stringify(recentSearches)); } catch { /* ignore */ }
  }, [recentSearches]);
  const addRecentSearch = (it) => {
    setRecentSearches((prev) => [it, ...prev.filter((p) => favouriteKey(p) !== favouriteKey(it))].slice(0, 5));
  };

  // Highlighting the ribbon toolbar group a just-picked search/Recents item
  // actually lives in, so users can see where it comes from instead of it
  // just vanishing into the canvas. Global search now spans every mode's
  // ribbon (not just FM 1D — see ModeRibbon's flattenRibbonItems), so switch
  // to whichever mode the picked item actually belongs to (`it.mode`)
  // before highlighting, otherwise the group wouldn't even be rendered.
  // The highlight itself is a brief pulse (cleared after 2.5s, see
  // ModeRibbon's RibbonGroup) rather than a persistent state, so it reads
  // as "here's where that came from" rather than a lasting selection
  // indicator.
  const [highlightedRibbonGroup, setHighlightedRibbonGroup] = useState(null);
  const highlightTimeoutRef = useRef(null);
  const highlightRibbonGroup = (it) => {
    if (!it?.top) return;
    if (it.mode) setMode(it.mode);
    setHighlightedRibbonGroup(it.top);
    clearTimeout(highlightTimeoutRef.current);
    highlightTimeoutRef.current = setTimeout(() => setHighlightedRibbonGroup(null), 2500);
  };
  // Beyond the pulse above, replay whatever clicking the item's actual
  // ribbon button would do (open its file-explorer/placeholder modal, or
  // expand its dropdown menu) — see ModeRibbon's `pendingSearchAction`
  // handling. Stamped with `_ts` so picking the exact same item twice in a
  // row still re-fires the effect (object identity alone wouldn't change).
  const [pendingSearchAction, setPendingSearchAction] = useState(null);
  const handleSelectSearchResult = (it) => {
    addRecentSearch(it);
    highlightRibbonGroup(it);
    setPendingSearchAction({ ...it, _ts: Date.now() });
  };

  // Home tab's Add Content annotation tools: `annotateTool` is armed from
  // the ribbon and read by GisCanvas, which owns the actual draw/place
  // interactions; `annotations` is the persisted list (text/marker/
  // highlighter/arrow), `annotationStyle` the default colour/width for the
  // next stroke, editable via the Annotation settings modal.
  const [annotateTool, setAnnotateTool] = useState(null);
  const [annotations, setAnnotations] = useState([]);
  const [annotationStyle, setAnnotationStyle] = useState({
    markerColor: "#2f6fed", markerWidth: 3,
    highlighterColor: "#ff6100", highlighterWidth: 14,
    arrowColor: "#e1455b",
  });
  const [showAnnotationSettings, setShowAnnotationSettings] = useState(false);

  // View > Flow Lines: `flowLinesOn` gates the pulse animation + the
  // bottom-right velocity widget on the canvas. `flowByEdge` is demo-only
  // per-edge flow data (no real hydraulic model), stable per edge id so it
  // doesn't jitter on every render. The three sub-toggles + velocity range
  // are shared between GisCanvas (rendering) and the Flow Lines side panel
  // (controls) — see PanelSlot.jsx's "flowlines" view.
  const [flowLinesOn, setFlowLinesOn] = useState(false);
  const [flowWidgetOpen, setFlowWidgetOpen] = useState(true);
  const [velocityRange, setVelocityRange] = useState({ min: 0.01, max: 0.99 });
  const [clipOutOfRange, setClipOutOfRange] = useState(false);
  const [flowLabelsOn, setFlowLabelsOn] = useState(false);
  const [flowLabelMetric, setFlowLabelMetric] = useState("rateLps");
  const [flowTracerOn, setFlowTracerOn] = useState(false);
  const flowByEdge = useMemo(
    () => Object.fromEntries(edges.map((e) => [e.id, mockFlowForEdge(e.id)])),
    [edges],
  );
  useEffect(() => {
    if (flowLinesOn) setFlowWidgetOpen(true);
  }, [flowLinesOn]);

  // Reaches (map view line colour + table grouping) computed once here so
  // GisCanvas and NetworkPanel agree on exactly the same grouping. Users can
  // manually reassign a stretch (edge.reach) which overrides the automatic
  // topology-based grouping — see reaches.js. Custom names layer on top of
  // the auto "Reach N" names, keyed by the same stable reach key.
  const [reachNames, setReachNames] = useState({});
  const { registry: autoRegistry, edgeColors, edgesByKey, resolvedKeyByEdge, degree } = useMemo(() => resolveReaches(nodes, edges), [nodes, edges]);
  const registry = useMemo(
    () => autoRegistry.map(r => reachNames[r.key] ? { ...r, name: reachNames[r.key] } : r),
    [autoRegistry, reachNames],
  );
  const reassignReach = (edgeIds, reachKey) => {
    setEdges(es => es.map(e => edgeIds.includes(e.id) ? { ...e, reach: reachKey || undefined } : e));
  };
  const renameReach = (key, name) => {
    setReachNames(rn => ({ ...rn, [key]: name }));
  };

  // Keyboard Shortcuts spec (FM v8.0): General section — mode tabs, search
  // focus, and this shortcuts reference itself.
  useEffect(() => {
    const isTyping = (e) => {
      const t = (e.target.tagName || "").toLowerCase();
      return t === "input" || t === "textarea";
    };
    const onKey = (e) => {
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setShowShortcuts((v) => !v);
        return;
      }
      if (e.ctrlKey && !e.shiftKey && e.key.toLowerCase() === "k") {
        e.preventDefault();
        document.getElementById("fm-global-search")?.focus();
        return;
      }
      if (e.ctrlKey && !e.shiftKey && !isTyping(e) && /^[1-9]$/.test(e.key)) {
        const target = modes[Number(e.key) - 1];
        if (target) { e.preventDefault(); setMode(target); }
      }
      // Toggle the map backdrop between the grid and the last-selected
      // basemap — same bare-letter convention as the canvas's V/G/M/Q/X/Z
      // tool shortcuts (see GisCanvas), so it lives here rather than there
      // since the basemap selection itself is owned by App.
      if (!e.ctrlKey && !e.metaKey && !e.altKey && !isTyping(e) && e.key.toLowerCase() === "b") {
        e.preventDefault();
        toggleBasemap();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

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

  // Shared with BOTH panel slots (either side can show either view — see
  // PanelSlot.jsx) so switching a slot's view never leaves a Body without
  // the props it needs.
  const panelBodyProps = {
    nodes, edges, selected, setSelected,
    edgeColors, reachRegistry: registry, reachKeyOfEdge: resolvedKeyByEdge, onRenameReach: renameReach,
    flowByEdge, velocityRange, setVelocityRange, clipOutOfRange, setClipOutOfRange,
    flowLabelsOn, setFlowLabelsOn, flowLabelMetric, setFlowLabelMetric, flowTracerOn, setFlowTracerOn,
    polygons, layers, activeLayerId, tab: projectTab, setTab: setProjectTab,
    onSetActiveLayer: setActiveLayerId, onToggleLayerVisibility: toggleLayerVisibility,
    onDeleteLayer: deleteLayer, onAddLayer: () => setAddLayerModalOpen(true),
  };

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", background: "var(--surface-3)", overflow: "hidden" }}>
      <OSWindow onBeginDrag={beginDrag} onOpenShortcuts={() => setShowShortcuts(true)} onGoToLocation={goToLocation}
        flowLinesOn={flowLinesOn} setFlowLinesOn={setFlowLinesOn} onOpenToolbox={() => setToolboxFloat(true)}
        basemap={basemap} setBasemap={setBasemap}
        isFavourite={isFavourite} onToggleFavourite={toggleFavourite}
        recentSearches={recentSearches} onSelectResult={handleSelectSearchResult}
        onCreateLayer={() => setAddLayerModalOpen(true)} />
      <ModeRibbon onBeginDrag={beginDrag} mode={mode} setMode={setMode} basemap={basemap} setBasemap={setBasemap}
        annotateTool={annotateTool} setAnnotateTool={setAnnotateTool}
        onOpenAnnotationSettings={() => setShowAnnotationSettings(true)}
        favourites={favourites} onDropFavourite={handleFavouriteDrop} onRemoveFavourite={removeFavourite}
        favouriteLists={favouriteLists} activeFavouriteListId={activeFavouriteListId}
        onSelectFavouriteList={selectFavouriteList} onCreateFavouriteList={createFavouriteList}
        ribbonDrag={ribbonDrag} onConsumeRibbonDrag={() => setRibbonDrag(null)}
        highlightedGroup={highlightedRibbonGroup}
        pendingSearchAction={pendingSearchAction} onConsumeSearchAction={() => setPendingSearchAction(null)}
        onAddLayer={() => setAddLayerModalOpen(true)} />
      <div style={{ flex: "1 0 0", minHeight: 0, display: "flex", padding: 8 }}>
        <PanelSlot width={projectW} viewId={leftView} onChangeView={setLeftView} bodyProps={panelBodyProps}
          onUndockToolbox={() => { setToolboxFloat(true); setLeftView("project"); }} />
        <ResizeHandle onDrag={(dx) => setProjectW(w => Math.max(PANEL_MIN, Math.min(PANEL_MAX, w + dx)))} />

        {/* Canvas column: map + (optionally) the bottom-docked panel below
            it. The corner grip lives here so it tracks the canvas's actual
            top-right corner regardless of how wide the mid panel gets. */}
        <div style={{ flex: "1 0 0", minWidth: 0, display: "flex", flexDirection: "column", position: "relative", gap: 8 }}>
          <GisCanvas
            nodes={nodes} setNodes={setNodes}
            edges={edges} setEdges={setEdges}
            selected={selected} setSelected={setSelected}
            basemap={basemap}
            flyTo={flyTo} onConsumeFlyTo={() => setFlyTo(null)}
            ribbonDrag={ribbonDrag} onConsumeRibbonDrag={() => setRibbonDrag(null)}
            edgeColors={edgeColors} degree={degree} reachRegistry={registry} edgesByReach={edgesByKey}
            reachKeyOfEdge={resolvedKeyByEdge} onReassignReach={reassignReach}
            annotateTool={annotateTool} setAnnotateTool={setAnnotateTool}
            annotations={annotations} setAnnotations={setAnnotations} annotationStyle={annotationStyle}
            flowLinesOn={flowLinesOn} flowByEdge={flowByEdge} velocityRange={velocityRange} setVelocityRange={setVelocityRange}
            clipOutOfRange={clipOutOfRange} flowLabelsOn={flowLabelsOn} flowLabelMetric={flowLabelMetric} flowTracerOn={flowTracerOn}
            flowWidgetOpen={flowWidgetOpen} setFlowWidgetOpen={setFlowWidgetOpen}
            onOpenFlowLinesPanel={() => setRightView("flowlines")}
            polygons={polygons} setPolygons={setPolygons} layers={layers} activeLayerId={activeLayerId}
          />
          <CornerRevealGrip width={midPanelW} setWidth={setMidPanelW} />
          <BottomRevealHandle height={bottomPanelH} setHeight={setBottomPanelH} />
          {bottomPanelH > 0 && (
            <PanelSlot height={bottomPanelH} viewId={bottomPanelView} onChangeView={setBottomPanelView}
              bodyProps={panelBodyProps} onClose={() => setBottomPanelH(0)}
              onUndockToolbox={() => { setToolboxFloat(true); setBottomPanelH(0); }} />
          )}
        </div>

        {midPanelW > 0 && (
          <>
            <ResizeHandle onDrag={(dx) => setMidPanelW(w => Math.max(0, Math.min(REVEAL_MAX + 80, w - dx)))} />
            <PanelSlot width={midPanelW} viewId={midPanelView} onChangeView={setMidPanelView}
              bodyProps={panelBodyProps} onClose={() => setMidPanelW(0)}
              onUndockToolbox={() => { setToolboxFloat(true); setMidPanelW(0); }} />
          </>
        )}

        <ResizeHandle onDrag={(dx) => setNetworkW(w => Math.max(PANEL_MIN, Math.min(PANEL_MAX, w - dx)))} />
        <PanelSlot width={networkW} viewId={rightView} onChangeView={setRightView} bodyProps={panelBodyProps}
          onUndockToolbox={() => { setToolboxFloat(true); setRightView("network"); }} />
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

      {showShortcuts && <KeyboardShortcuts onClose={() => setShowShortcuts(false)} />}
      {addLayerModalOpen && <AddLayerModal onCreate={addLayer} onClose={() => setAddLayerModalOpen(false)} />}
      {toolboxFloat && (
        <FloatingToolbox
          pos={toolboxPos} setPos={setToolboxPos}
          onDock={() => { setMidPanelView("toolbox"); setMidPanelW((w) => (w > 0 ? w : 300)); setToolboxFloat(false); }}
          onClose={() => setToolboxFloat(false)}
        />
      )}
      {showAnnotationSettings && (
        <AnnotationSettings
          style={annotationStyle}
          onChange={(patch) => setAnnotationStyle((s) => ({ ...s, ...patch }))}
          onClose={() => setShowAnnotationSettings(false)}
        />
      )}
    </div>
  );
}
