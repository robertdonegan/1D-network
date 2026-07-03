import { useState, useRef } from "react";
import { A, Icon } from "../assets.jsx";

// Network initial conditions rows
const nicRows = ["M014","M016","M017","M018","M019","M020","M021","M022","M023","M024","M025","M026","M027","M028","M029"]
  .map(l => ({ label: l, y: "Y", flow: "200.000" }));

// A solid dot for a unit on a single reach; a conic-gradient wedge marker
// where multiple reaches meet (a diverging/converging confluence point).
function ReachMark({ reaches }) {
  if (reaches.length === 0) {
    return <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--border-secondary)", flexShrink: 0 }} />;
  }
  if (reaches.length === 1) {
    return <span title={reaches[0].name} style={{ width: 6, height: 6, borderRadius: "50%", background: reaches[0].color, flexShrink: 0 }} />;
  }
  const n = reaches.length;
  const stops = reaches.map((r, i) => `${r.color} ${(i / n) * 100}% ${((i + 1) / n) * 100}%`).join(", ");
  return (
    <span title={`Confluence: ${reaches.map((r) => r.name).join(" + ")} meet here`} style={{
      width: 8, height: 8, borderRadius: "50%", flexShrink: 0,
      background: `conic-gradient(${stops})`, boxShadow: "0 0 0 1px #fff",
    }} />
  );
}

function PanelHeader({ icon, title }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "4px 8px 4px 4px", flexShrink: 0 }}>
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "center", gap: 2, height: 24,
        padding: 4, borderRadius: 2, background: "var(--surface-1)", border: "1px solid var(--border-primary)",
      }}>
        <Icon src={icon} size={16} />
        <Icon src={A.keyDown} size={12} />
      </div>
      <span style={{ fontSize: "var(--fs-s)", fontWeight: 500 }}>{title}</span>
      <div style={{ flex: "1 0 0", display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 8 }}>
        <Icon src={A.labelFilter} size={12} />
        <Icon src={A.layers} size={12} />
      </div>
    </div>
  );
}

function ColHeader({ cols }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 4, height: 28, width: "100%", padding: 8,
      background: "var(--surface-1)", border: "1px solid var(--border-primary)", flexShrink: 0,
    }}>
      {cols.map((c, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 2, height: 8, ...c.style }}>
          <span style={{ fontSize: "var(--fs-xs)", fontWeight: 500 }}>{c.name}</span>
          <Icon src={A.keyDown} size={12} style={{ opacity: 0.5 }} />
          <Icon src={A.labelFilter} size={12} />
        </div>
      ))}
    </div>
  );
}

function Row({ children, zebra, selected, onClick, indent }) {
  return (
    <div onClick={onClick} style={{
      display: "flex", alignItems: "center", gap: 4, padding: 8, paddingLeft: 8 + (indent || 0), width: "100%",
      background: selected ? "rgba(70,138,243,0.14)" : zebra ? "var(--surface-3)" : "var(--surface-1)",
      borderBottom: "1px solid var(--border-primary)",
      borderLeft: selected ? "2px solid var(--blue-700)" : "2px solid transparent",
      cursor: onClick ? "pointer" : "default",
    }}>{children}</div>
  );
}

// Collapsible group header for one reach — click to expand/collapse, click
// the name (or the edit icon) to rename it in place.
function ReachHeader({ reach, count, collapsed, onToggle, onRename }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(reach.name);

  const commit = () => {
    const trimmed = draft.trim();
    if (trimmed && trimmed !== reach.name) onRename(trimmed);
    setEditing(false);
  };

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 6, padding: "6px 8px", width: "100%",
      background: "var(--surface-2)", borderBottom: "1px solid var(--border-primary)", cursor: "pointer",
    }} onClick={() => !editing && onToggle()}>
      <Icon src={A.keyDown} size={12} style={{ transform: collapsed ? "rotate(-90deg)" : "none", flexShrink: 0 }} />
      <span style={{ width: 8, height: 8, borderRadius: "50%", background: reach.color, flexShrink: 0 }} />
      {editing ? (
        <input
          autoFocus
          value={draft}
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => { if (e.key === "Enter") commit(); if (e.key === "Escape") { setDraft(reach.name); setEditing(false); } }}
          style={{
            flex: "1 0 0", minWidth: 0, font: "inherit", fontSize: "var(--fs-xs)", fontWeight: 500,
            border: "1px solid var(--blue-700)", borderRadius: 2, padding: "1px 4px",
          }}
        />
      ) : (
        <span
          onDoubleClick={(e) => { e.stopPropagation(); setEditing(true); }}
          title="Double-click to rename"
          style={{ flex: "1 0 0", minWidth: 0, fontSize: "var(--fs-xs)", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
        >
          {reach.name}
        </span>
      )}
      <span style={{ fontSize: "var(--fs-xxs)", color: "var(--text-tertiary)", flexShrink: 0 }}>{count}</span>
      {!editing && (
        <button onClick={(e) => { e.stopPropagation(); setEditing(true); }} title="Rename reach"
          style={{ border: "none", background: "transparent", cursor: "pointer", padding: 2, display: "flex", flexShrink: 0 }}>
          <Icon src={A.edit} size={12} />
        </button>
      )}
    </div>
  );
}

const cellStyle = { fontSize: "var(--fs-xs)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" };

export default function NetworkPanel({ nodes, edges, selected, setSelected, reachRegistry, reachKeyOfEdge, onRenameReach, width = 232 }) {
  // The divider above "Network initial conditions" drags to resize the
  // top table's viewport height.
  const [topH, setTopH] = useState(320);
  const [collapsed, setCollapsed] = useState({});
  const registryByKey = Object.fromEntries((reachRegistry || []).map((r) => [r.key, r]));

  const reachesForNode = (nodeId) => {
    const keys = [];
    edges.forEach((e) => {
      if (e.from === nodeId || e.to === nodeId) {
        const k = reachKeyOfEdge?.[e.id];
        if (k && !keys.includes(k)) keys.push(k);
      }
    });
    return keys.map((k) => registryByKey[k]).filter(Boolean);
  };

  // Group nodes under the first reach they touch (a confluence node still
  // shows every reach it's part of via its ReachMark wedge).
  const groups = [];
  const groupByKey = {};
  const ungrouped = { key: null, reach: { name: "Ungrouped", color: "var(--border-secondary)" }, rows: [] };
  nodes.forEach((n) => {
    const reaches = reachesForNode(n.id);
    if (reaches.length === 0) { ungrouped.rows.push({ n, reaches }); return; }
    const primary = reaches[0];
    if (!groupByKey[primary.key]) {
      groupByKey[primary.key] = { key: primary.key, reach: primary, rows: [] };
      groups.push(groupByKey[primary.key]);
    }
    groupByKey[primary.key].rows.push({ n, reaches });
  });
  if (ungrouped.rows.length) groups.push(ungrouped);

  const onDividerDown = (e) => {
    e.preventDefault();
    const startY = e.clientY, startH = topH;
    const onMove = (ev) => setTopH(Math.max(80, Math.min(560, startH + (ev.clientY - startY))));
    const onUp = () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  return (
    <div style={{
      width, flexShrink: 0, height: "100%", display: "flex", flexDirection: "column",
      background: "var(--surface-1)", border: "1px solid var(--border-primary)", borderRadius: 4, overflow: "hidden",
    }}>
      <PanelHeader icon={A.network} title="1D Network" />

      {/* Search + prev/next */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 4, padding: "4px 8px", width: "100%", flexShrink: 0 }}>
        <div style={{
          flex: "1 0 0", height: 24, display: "flex", alignItems: "center", gap: 4, padding: 4,
          background: "var(--surface-2)", border: "1px solid var(--border-primary)", borderRadius: 2,
        }}>
          <Icon src={A.search} size={16} />
          <span style={{ color: "var(--text-secondary)", fontSize: "var(--fs-xs)" }}>Search network</span>
        </div>
        <div style={{ display: "flex" }}>
          <div style={{ width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center", background: "var(--surface-1)", border: "1px solid var(--border-primary)", borderRadius: "2px 0 0 2px" }}>
            <Icon src={A.keyUp} size={16} />
          </div>
          <div style={{ width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center", background: "var(--surface-1)", border: "1px solid var(--border-primary)", borderRadius: "0 2px 2px 0", marginLeft: -1 }}>
            <Icon src={A.keyDown} size={16} />
          </div>
        </div>
      </div>

      {/* Network table — mirrors the live nodes on the canvas, grouped by reach.
          Click a group header to collapse/expand; double-click its name to rename it. */}
      <ColHeader cols={[
        { name: "Label", style: { width: 72 } },
        { name: "Unit", style: { flex: "1 0 0" } },
        { name: "Sub unit", style: { width: 80 } },
      ]} />
      <div style={{ display: "flex", flexDirection: "column", overflow: "auto", flexShrink: 0, height: topH, borderBottom: "1px solid var(--border-primary)" }}>
        {groups.map((g) => {
          const isCollapsed = !!collapsed[g.key ?? "__ungrouped"];
          return (
            <div key={g.key ?? "__ungrouped"}>
              <ReachHeader
                reach={g.reach}
                count={g.rows.length}
                collapsed={isCollapsed}
                onToggle={() => setCollapsed((c) => ({ ...c, [g.key ?? "__ungrouped"]: !c[g.key ?? "__ungrouped"] }))}
                onRename={(name) => g.key && onRenameReach(g.key, name)}
              />
              {!isCollapsed && g.rows.map(({ n, reaches }, i) => {
                const subLabel = reaches.length === 0 ? "—" : reaches.length === 1 ? reaches[0].name : "Confluence";
                return (
                  <Row key={n.id} zebra={i % 2 === 1} selected={selected.includes(n.id)} onClick={(e) => setSelected(sel => e.ctrlKey || e.metaKey ? (sel.includes(n.id) ? sel.filter(id => id !== n.id) : [...sel, n.id]) : [n.id])} indent={12}>
                    <div style={{ display: "flex", alignItems: "center", gap: 4, width: 60, flexShrink: 0 }}>
                      <Icon src={A[n.icon]} size={12} />
                      <span style={{ ...cellStyle }}>{n.label}</span>
                    </div>
                    <span style={{ ...cellStyle, flex: "1 0 0", minWidth: 0, display: "flex", alignItems: "center", gap: 5 }}>
                      <ReachMark reaches={reaches} />
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{n.unitLabel || n.icon}</span>
                    </span>
                    <span style={{ ...cellStyle, width: 80, flexShrink: 0 }} title={reaches.map((r) => r.name).join(", ")}>{subLabel}</span>
                  </Row>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Drag to resize the table above */}
      <div onMouseDown={onDividerDown} title="Drag to resize"
        style={{ height: 6, flexShrink: 0, cursor: "row-resize", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--surface-2)", borderBottom: "1px solid var(--border-primary)" }}>
        <div style={{ width: 28, height: 2, borderRadius: 1, background: "var(--border-secondary)" }} />
      </div>

      {/* Network initial conditions */}
      <div style={{ display: "flex", alignItems: "center", height: 32, padding: "12px 8px", flexShrink: 0 }}>
        <span style={{ fontSize: "var(--fs-xs)", fontWeight: 500 }}>Network initial conditions</span>
      </div>
      <ColHeader cols={[
        { name: "Label", style: { width: 72 } },
        { name: "Y", style: { flex: "1 0 0" } },
        { name: "Flow", style: { width: 80 } },
      ]} />
      <div style={{ display: "flex", flexDirection: "column", overflow: "auto", flex: "1 0 0" }}>
        {nicRows.map((r, i) => (
          <Row key={i} zebra={i % 2 === 1}>
            <span style={{ ...cellStyle, width: 72, flexShrink: 0 }}>{r.label}</span>
            <span style={{ ...cellStyle, flex: "1 0 0", minWidth: 0 }}>{r.y}</span>
            <span style={{ ...cellStyle, width: 80, flexShrink: 0 }}>{r.flow}</span>
          </Row>
        ))}
      </div>
    </div>
  );
}
