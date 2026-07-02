import OSWindow from "./components/OSWindow.jsx";
import ModeRibbon from "./components/ModeRibbon.jsx";
import ProjectPanel from "./components/ProjectPanel.jsx";
import GisCanvas from "./components/GisCanvas.jsx";
import NetworkPanel from "./components/NetworkPanel.jsx";

export default function App() {
  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", background: "var(--surface-4)", overflow: "hidden" }}>
      <OSWindow />
      <ModeRibbon />
      <div style={{ flex: "1 0 0", minHeight: 0, display: "flex", gap: 8, padding: 8 }}>
        <ProjectPanel />
        <GisCanvas />
        <NetworkPanel />
      </div>
    </div>
  );
}
