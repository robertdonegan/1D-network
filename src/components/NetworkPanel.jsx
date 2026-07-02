import { A, Icon } from "../assets.jsx";

// Network initial conditions rows
const nicRows = ["M014","M016","M017","M018","M019","M020","M021","M022","M023","M024","M025","M026","M027","M028","M029"]
  .map(l => ({ label: l, y: "Y", flow: "200.000" }));

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

function Row({ children, zebra }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 4, padding: 8, width: "100%",
      background: zebra ? "var(--surface-3)" : "var(--surface-1)",
      borderBottom: "1px solid var(--border-primary)",
    }}>{children}</div>
  );
}

const cellStyle = { fontSize: "var(--fs-xs)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" };

export default function NetworkPanel() {
  return (
    <div style={{
      width: 232, flexShrink: 0, height: "100%", display: "flex", flexDirection: "column",
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

      {/* Network table */}
      <ColHeader cols={[
        { name: "Label", style: { width: 72 } },
        { name: "Unit", style: { flex: "1 0 0" } },
        { name: "Sub unit", style: { width: 80 } },
      ]} />
      <div style={{ display: "flex", flexDirection: "column", overflow: "auto", flexShrink: 0, maxHeight: 320, borderBottom: "1px solid var(--border-primary)" }}>
        {networkRows.map((r, i) => (
          <Row key={i} zebra={i % 2 === 1}>
            <div style={{ display: "flex", alignItems: "center", gap: 4, width: 72, flexShrink: 0 }}>
              <Icon src={r.icon} size={12} />
              <span style={{ ...cellStyle }}>{r.label}</span>
            </div>
            <span style={{ ...cellStyle, flex: "1 0 0", minWidth: 0 }}>{r.unit}</span>
            <span style={{ ...cellStyle, width: 80, flexShrink: 0 }}>Section</span>
          </Row>
        ))}
      </div>

      {/* Network initial conditions */}
      <div style={{ display: "flex", alignItems: "center", height: 32, padding: "12px 8px", borderTop: "1px solid var(--border-primary)", flexShrink: 0 }}>
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
