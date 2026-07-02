import { A, Icon } from "../assets.jsx";

const menus = ["General", "Project", "Layer", "View", "Window", "Toolbox", "Help"];

export default function OSWindow() {
  return (
    <div style={{
      height: 32, flexShrink: 0, background: "var(--surface-brand-invert)",
      display: "flex", alignItems: "center", justifyContent: "space-between",
      color: "#fff", paddingRight: 4,
    }}>
      {/* Left: logo + menus */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, flex: "1 0 0", minWidth: 0 }}>
        <div style={{ width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Icon src={A.logo} size={32} alt="Flood Modeller" />
        </div>
        <div style={{ display: "flex", alignItems: "center" }}>
          {menus.map(m => (
            <div key={m} style={{
              height: 32, display: "flex", alignItems: "center", justifyContent: "center",
              padding: "0 8px", fontSize: "var(--fs-xs)", cursor: "default", whiteSpace: "nowrap",
            }}>{m}</div>
          ))}
        </div>
      </div>

      {/* Center: global search */}
      <div style={{
        width: 240, height: 24, flexShrink: 0, background: "var(--surface-2)",
        border: "1px solid var(--border-primary)", borderRadius: 2,
        display: "flex", alignItems: "center", gap: 4, padding: 4,
      }}>
        <Icon src={A.search} size={16} />
        <span style={{ color: "var(--text-secondary)", fontSize: "var(--fs-xs)" }}>Search tools and functions</span>
      </div>

      {/* Right: project title + window controls */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 16, flex: "1 0 0", minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center" }}>
          <div style={{ padding: "0 16px", fontSize: "var(--fs-xs)", whiteSpace: "nowrap" }}>
            Upton_Upon_Severn_rev001
          </div>
          {[A.minimise, A.dock, A.cancel].map((ic, i) => (
            <div key={i} style={{ width: 24, height: 32, display: "flex", alignItems: "center", justifyContent: "center", cursor: "default" }}>
              <Icon src={ic} size={12} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
