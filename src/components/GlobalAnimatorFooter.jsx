import { useEffect, useRef, useState } from "react";
import { A, Icon } from "../assets.jsx";
import { fmtHours } from "./GlobalAnimatorPanel.jsx";
import { PanelSwitcher } from "./PanelSlot.jsx";

// Transport bar (Figma "fm-v8.0-anim-player-v2"): always visible, docked
// underneath the map — a panel in the canvas column like the other
// bottom-docked views, not spanning the side panels and not one of
// PanelSlot's swappable views — see the mount in App.jsx's canvas column.
// Drives (and is driven by) the shared `useAnimator()` playhead any
// animated element reads, so far the Long Section plot's flow chevrons
// and stage rise/fall.

function hashStr(s) {
  let x = 2166136261;
  for (let i = 0; i < s.length; i++) x = Math.imul(x ^ s.charCodeAt(i), 16777619);
  return (x >>> 0) / 4294967295;
}

// Dummy "1D-2D coupled magnitude" per step — a hydrograph-shaped envelope
// (rises, peaks mid-run, falls) plus per-step jitter so it doesn't read as
// a perfect curve. No real timeseries behind this prototype, same spirit
// as the Long Section plot's simulated data.
function waveformValues(totalSteps) {
  const out = [];
  for (let i = 0; i < totalSteps; i++) {
    const t = i / (totalSteps - 1);
    const envelope = Math.sin(t * Math.PI);
    const jitter = hashStr(`ga-wave-${i}`) - 0.5;
    out.push(Math.max(0.08, Math.min(1, 0.12 + 0.72 * envelope + 0.3 * jitter)));
  }
  return out;
}

// Fixed dummy commenters, SoundCloud-style pins on the waveform. `badge`
// picks between a solid-fill chip (like a status badge) and an
// outline chip — the two visual variants in the Figma reference (it uses
// real headshots for one of them; this prototype has no photo backend, so
// both variants are initials-only, just styled differently).
const COMMENTS = [
  { step: 4, name: "Sarah Mitchell", initials: "SM", color: "#00a33b", badge: true, text: "Flow peak looks early here — worth checking the inflow hydrograph." },
  { step: 11, name: "James Doyle", initials: "JD", color: "#0a7dff", badge: false, text: "Bank overtopping starts around this frame." },
  { step: 18, name: "Priya Kapoor", initials: "PK", color: "#e1455b", badge: false, text: "Confirm 2D linkage timing against the coupled model." },
  { step: 23, name: "Tom Walsh", initials: "TW", color: "#f2a63b", badge: true, text: "Recession looks slow compared to the FEH profile." },
  { step: 29, name: "Anya Lindqvist", initials: "AL", color: "#7b5ee8", badge: false, text: "Re-check this timestep after the mesh refinement lands." },
];

// Placeholder animated-layer inventory for the layers drop-up. These are
// the "result layers" a real animator would expose; toggling one only
// changes the local check state + the count on the button for now — there
// is no rendering pipeline behind them in this prototype.
const ANIMATED_LAYERS = [
  { id: "depth", name: "Depth (m)", color: "#2f6fed", on: true },
  { id: "flow", name: "Flow rate (m³/s)", color: "#00a33b", on: true },
  { id: "velocity", name: "Velocity (m/s)", color: "#f2a63b", on: false },
  { id: "level", name: "Water level (mAOD)", color: "#0a7dff", on: true },
  { id: "flood", name: "Flood extent", color: "#e1455b", on: false },
  { id: "shear", name: "Shear stress", color: "#7b5ee8", on: false },
];

function TransportBtn({ icon, iconSize = 16, label, onClick, onLabelClick, title, end, first }) {
  return (
    <div
      onClick={onClick}
      title={title}
      style={{
        display: "flex", alignItems: "center", gap: 2, height: 24, padding: "4px 8px",
        background: "var(--surface-1)", border: "1px solid var(--border-primary)",
        borderRadius: first ? "2px 0 0 2px" : end ? "0 2px 2px 0" : 0,
        marginLeft: first ? 0 : -1, cursor: "pointer", flexShrink: 0,
      }}>
      {icon && <Icon src={icon} size={iconSize} />}
      {label && (
        <span
          onClick={onLabelClick ? (e) => { e.stopPropagation(); onLabelClick(); } : undefined}
          style={{ fontSize: 12, fontWeight: 500, color: "var(--text-secondary)", whiteSpace: "nowrap" }}
        >{label}</span>
      )}
    </div>
  );
}

const SPEEDS = [1, 2, 4];

// Generic drop-up menu for the footer's right-hand controls (layers,
// settings). Grows upward since the bar is pinned to the bottom of the
// viewport, and closes on outside click / Escape — same behaviour as
// PanelSwitcher, but anchored to the trigger's right edge so wide menus
// stay on screen.
function DropUp({ title, trigger, children, width = 200 }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onKey); };
  }, [open]);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <div onClick={() => setOpen((v) => !v)} title={title} style={{ cursor: "pointer" }}>{trigger}</div>
      {open && (
        <div
          onMouseDown={(e) => e.stopPropagation()}
          style={{
            position: "absolute", bottom: "100%", right: 0, marginBottom: 6, width, zIndex: 60,
            background: "var(--surface-1)", border: "1px solid var(--border-primary)",
            borderRadius: 4, boxShadow: "0 4px 16px rgba(0,0,0,0.16)", padding: 4,
            display: "flex", flexDirection: "column", gap: 2,
          }}>
          {children}
        </div>
      )}
    </div>
  );
}

function MenuHeading({ children }) {
  return (
    <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: 0.4, textTransform: "uppercase", color: "var(--text-tertiary)", padding: "4px 8px 2px" }}>
      {children}
    </div>
  );
}

function MenuRow({ children, onClick, active }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: 8, height: 28, padding: "4px 8px",
        border: "none", borderRadius: 2, cursor: "pointer", textAlign: "left", width: "100%",
        background: active ? "var(--surface-4)" : "transparent",
        fontSize: "var(--fs-xs)", color: "var(--text-primary)",
      }}
      onMouseOver={(e) => { if (!active) e.currentTarget.style.background = "var(--surface-3)"; }}
      onMouseOut={(e) => { e.currentTarget.style.background = active ? "var(--surface-4)" : "transparent"; }}
    >
      {children}
    </button>
  );
}

// Checkbox-style toggle row: a check glyph in a fixed slot keeps labels
// aligned whether or not the option is on.
function MenuToggle({ label, checked, onClick }) {
  return (
    <MenuRow onClick={onClick}>
      <span style={{ width: 14, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        {checked && <Icon src={A.check} size={12} />}
      </span>
      <span style={{ flex: "1 0 0" }}>{label}</span>
    </MenuRow>
  );
}

export default function GlobalAnimatorFooter({ animator, onOpenPanel, floating, onUndock, onDock, onDragStart }) {
  const {
    currentStep, seekTo, playing, direction, play, speedIdx, setSpeedIdx, totalSteps,
    trimStart, trimEnd, setTrimStart, setTrimEnd, loop, setLoop,
  } = animator;
  const trackRef = useRef(null);
  const [hoveredPin, setHoveredPin] = useState(null);

  const waveform = useRef(null);
  if (!waveform.current) waveform.current = waveformValues(totalSteps);

  // View options that live only in the footer (the animator itself only
  // cares about the playhead). `loop` is the exception — it's owned by
  // useAnimator so playback can actually honour it.
  // Off by default — the Figma spec (fm-v8.0-anim-player) doesn't show a
  // waveform, just a flat tick line under the ruler (see the track render
  // below). Kept behind the existing settings toggle so it can come back.
  const [showWaveform, setShowWaveform] = useState(false);
  const [showComments, setShowComments] = useState(true);
  const [showRulerLabels, setShowRulerLabels] = useState(true);
  const [layers, setLayers] = useState(ANIMATED_LAYERS);
  const activeLayerCount = layers.filter((l) => l.on).length;

  const toggleLayer = (id) => setLayers((ls) => ls.map((l) => (l.id === id ? { ...l, on: !l.on } : l)));

  const fracFromClientX = (clientX) => {
    const r = trackRef.current.getBoundingClientRect();
    return Math.min(1, Math.max(0, (clientX - r.left) / r.width));
  };
  const stepFromClientX = (clientX) => Math.round(fracFromClientX(clientX) * (totalSteps - 1)) + 1;

  const onScrubDown = (e) => {
    seekTo(stepFromClientX(e.clientX));
    const onMove = (ev) => seekTo(stepFromClientX(ev.clientX));
    const onUp = () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  const onTrimHandleDown = (which) => (e) => {
    e.stopPropagation();
    const onMove = (ev) => {
      const step = stepFromClientX(ev.clientX);
      if (which === "start") setTrimStart(step); else setTrimEnd(step);
    };
    const onUp = () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  const cycleSpeed = () => setSpeedIdx((i) => (i + 1) % SPEEDS.length);

  const pct = (n) => `${((n - 1) / (totalSteps - 1)) * 100}%`;

  return (
    <div style={{
      flexShrink: 0, background: "var(--surface-1)", border: "1px solid var(--border-primary)", borderRadius: 4,
      padding: "6px 8px", display: "flex", flexDirection: "column", gap: 6,
      boxShadow: floating ? "0 8px 24px rgba(0,0,0,0.2)" : "none",
      // The bar is the last thing in the canvas column, so without this its
      // upward comment-pin tooltips paint *under* the map panel above and
      // get clipped by it. A stacking context on the bar keeps them on top.
      position: "relative", zIndex: 100,
    }}>
      {/* Header row */}
      <div style={{ display: "flex", alignItems: "center", gap: 4, height: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 4, flex: "1 0 0", minWidth: 0 }}>
          <PanelSwitcher icon={A.globalAnimatorIcon} openUp
            onSelect={onOpenPanel} title="Open a panel below the map" />
          <span
            onMouseDown={floating ? onDragStart : undefined}
            style={{ fontSize: 14, fontWeight: 500, color: "var(--text-primary-selected)", whiteSpace: "nowrap", cursor: floating ? "grab" : "default" }}
          >Global Animator</span>
        </div>

        <div style={{ display: "flex", alignItems: "center" }}>
          <TransportBtn first icon={A.fastReverseStart} title="Jump to trim start" onClick={() => seekTo(trimStart)} />
          <TransportBtn icon={A.skipBackFrame} title="Previous frame" onClick={() => seekTo(currentStep - 1)} />
          <TransportBtn icon={A.playBack} label={`x${SPEEDS[speedIdx]}`} title={playing && direction === -1 ? "Pause" : "Play reverse"} onClick={() => play(-1)} onLabelClick={cycleSpeed} />
          <TransportBtn icon={playing && direction === 1 ? A.mediaPause : A.mediaPlay} label={`x${SPEEDS[speedIdx]}`} title={playing && direction === 1 ? "Pause" : "Play"} onClick={() => play(1)} onLabelClick={cycleSpeed} />
          <TransportBtn icon={A.skipForwardFrame} title="Next frame" onClick={() => seekTo(currentStep + 1)} />
          <TransportBtn end icon={A.fastForwardEnd} title="Jump to trim end" onClick={() => seekTo(trimEnd)} />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 4, marginLeft: 4 }}>
          <DropUp
            width={216}
            title="Animated layers"
            trigger={
              <div style={{ display: "flex", alignItems: "center", gap: 2, height: 24, padding: "4px 8px", background: "var(--surface-1)", border: "1px solid var(--border-primary)", borderRadius: 2 }}>
                <Icon src={A.layers} size={16} />
                <span style={{ fontSize: 12, fontWeight: 500, color: "var(--text-secondary)" }}>{activeLayerCount}</span>
              </div>
            }
          >
            <MenuHeading>Animated layers</MenuHeading>
            {layers.map((l) => (
              <MenuRow key={l.id} onClick={() => toggleLayer(l.id)}>
                <span style={{ width: 14, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  {l.on
                    ? <span style={{ width: 10, height: 10, borderRadius: 2, background: l.color }} />
                    : <Icon src={A.generalInvisible} size={12} />}
                </span>
                <span style={{ flex: "1 0 0", color: l.on ? "var(--text-primary)" : "var(--text-tertiary)" }}>{l.name}</span>
                {l.on && <Icon src={A.check} size={12} />}
              </MenuRow>
            ))}
            <div style={{ borderTop: "1px solid var(--border-primary)", margin: "4px 0 2px" }} />
            <MenuRow onClick={() => setLayers((ls) => ls.map((l) => ({ ...l, on: true })))}>
              <span style={{ width: 14 }} />
              <span style={{ flex: "1 0 0" }}>Show all</span>
            </MenuRow>
          </DropUp>

          <DropUp
            width={216}
            title="Animator settings"
            trigger={
              <div style={{ display: "flex", alignItems: "center", height: 24, padding: "4px 8px", background: "var(--surface-1)", border: "1px solid var(--border-primary)", borderRadius: 2 }}>
                <Icon src={A.settingsOutline} size={16} style={{ filter: "grayscale(1)" }} />
              </div>
            }
          >
            <MenuHeading>Playback</MenuHeading>
            <MenuToggle label="Loop" checked={loop} onClick={() => setLoop((v) => !v)} />
            <MenuToggle label="Show waveform" checked={showWaveform} onClick={() => setShowWaveform((v) => !v)} />
            <MenuToggle label="Show comment pins" checked={showComments} onClick={() => setShowComments((v) => !v)} />
            <MenuToggle label="Show frame labels" checked={showRulerLabels} onClick={() => setShowRulerLabels((v) => !v)} />
            <div style={{ borderTop: "1px solid var(--border-primary)", margin: "4px 0 2px" }} />
            <MenuHeading>Speed</MenuHeading>
            {SPEEDS.map((s, i) => (
              <MenuToggle key={s} label={`${s}×`} checked={i === speedIdx} onClick={() => setSpeedIdx(i)} />
            ))}
          </DropUp>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 4, flex: "1 0 0", justifyContent: "flex-end", minWidth: 0 }}>
          <span style={{ fontSize: 12, fontWeight: 500, color: "var(--text-secondary)", whiteSpace: "nowrap" }}>
            {fmtHours(currentStep - 1)}/{fmtHours(totalSteps)}
          </span>
          {floating ? (
            <button onClick={onDock} title="Dock back into the layout" style={{ display: "flex", alignItems: "center", border: "none", background: "transparent", cursor: "pointer", padding: 0 }}>
              <Icon src={A.dock} size={12} />
            </button>
          ) : (
            <button onClick={onUndock} title="Undock into a floating window" style={{ display: "flex", alignItems: "center", border: "none", background: "transparent", cursor: "pointer", padding: 0 }}>
              <Icon src={A.newWindow} size={12} />
            </button>
          )}
        </div>
      </div>

      {/* Ruler + waveform + trim, sharing one coordinate space for the playhead */}
      <div ref={trackRef} style={{ position: "relative", padding: "0 6px" }}>
        {/* Ruler */}
        <div onMouseDown={onScrubDown} style={{ display: "flex", justifyContent: "space-between", cursor: "pointer", paddingBottom: 2 }}>
          {showRulerLabels
            ? Array.from({ length: totalSteps }, (_, i) => i + 1).map((n) => (
              <span key={n} style={{ fontSize: 9, color: n === currentStep ? "var(--text-primary)" : "var(--text-tertiary)", fontWeight: n === currentStep ? 600 : 400 }}>{n}</span>
            ))
            : <span style={{ fontSize: 9, color: "var(--text-tertiary)" }}>&nbsp;</span>}
        </div>

        {/* Waveform (optional) over a flat tick line (fm-v8.0-anim-player's
            permanent baseline under the ruler) + comment pins */}
        <div onMouseDown={onScrubDown} style={{ position: "relative", height: 10, display: "flex", alignItems: "flex-end", gap: 1, cursor: "pointer" }}>
          {showWaveform
            ? waveform.current.map((v, i) => (
              <div key={i} style={{ flex: "1 0 0", height: `${v * 100}%`, background: i + 1 <= currentStep ? "#55c7ff" : "#cfe4fb", borderRadius: 1 }} />
            ))
            : Array.from({ length: totalSteps }, (_, i) => (
              <div key={i} style={{ flex: "1 0 0", display: "flex", justifyContent: "center" }}>
                <div style={{ width: 1, height: i % 2 === 0 ? 10 : 5, background: "var(--border-primary)" }} />
              </div>
            ))}
          {showComments && COMMENTS.map((c, i) => (
            <div key={i}
              onMouseEnter={() => setHoveredPin(i)}
              onMouseLeave={() => setHoveredPin((h) => (h === i ? null : h))}
              onMouseDown={(e) => e.stopPropagation()}
              style={{
                position: "absolute", left: pct(c.step), top: 0, transform: "translateX(-50%)",
                width: 12, height: 12, borderRadius: "50%", cursor: "pointer",
                background: c.badge ? c.color : "var(--surface-1)",
                border: c.badge ? "1px solid var(--surface-1)" : `1.5px solid ${c.color}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 0 0 0.5px var(--border-primary)",
              }}>
              <span style={{ fontSize: 6, fontWeight: 600, color: c.badge ? "#fff" : c.color, lineHeight: 1 }}>{c.initials}</span>
              {hoveredPin === i && (
                <div style={{
                  position: "absolute", bottom: 18, left: "50%", transform: "translateX(-50%)", width: 180, zIndex: 3,
                  background: "var(--surface-1)", borderRadius: 2, padding: 8,
                  boxShadow: "0 2px 2px rgba(0,0,0,0.1), 0 3px 3px rgba(0,0,0,0.1)", pointerEvents: "none",
                }}>
                  <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 8 }}>
                    <span style={{ fontSize: 12, fontWeight: 500, color: "var(--text-primary)" }}>{c.name}</span>
                    <span style={{ fontSize: 10, color: "var(--text-tertiary)", whiteSpace: "nowrap" }}>{fmtHours(c.step - 1)}</span>
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 2 }}>{c.text}</div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Trim range */}
        <div style={{ position: "relative", height: 8, marginTop: 6, background: "var(--surface-4)", borderRadius: 8 }}>
          <div style={{ position: "absolute", left: pct(trimStart), right: `${100 - parseFloat(pct(trimEnd))}%`, top: 0, bottom: 0, background: "var(--interface-blue-500, #55c7ff)", borderRadius: 4 }} />
          <div onMouseDown={onTrimHandleDown("start")} title="Drag to trim start"
            style={{ position: "absolute", left: pct(trimStart), top: 0, bottom: 0, width: 4, background: "var(--surface-brand)", cursor: "ew-resize" }} />
          <div onMouseDown={onTrimHandleDown("end")} title="Drag to trim end"
            style={{ position: "absolute", left: pct(trimEnd), top: 0, bottom: 0, width: 4, transform: "translateX(-100%)", background: "var(--surface-brand)", cursor: "ew-resize" }} />
        </div>

        {/* Playhead — numbered flag + needle spanning ruler/waveform/trim */}
        <div style={{ position: "absolute", left: pct(currentStep), top: 0, bottom: 0, transform: "translateX(-50%)", pointerEvents: "none" }}>
          <div style={{ position: "absolute", top: -2, left: "50%", transform: "translateX(-50%)", background: "var(--surface-brand)", color: "#fafafa", borderRadius: 2, padding: "1px 4px", fontSize: 10, fontWeight: 500, whiteSpace: "nowrap" }}>
            {currentStep}
          </div>
          <div style={{ position: "absolute", top: 10, bottom: 0, left: "50%", width: 1, background: "var(--surface-brand)" }} />
        </div>
      </div>
    </div>
  );
}
