import { useState, useEffect } from "react";

const TOTAL_STEPS = 32;
const SPEEDS = [1, 2, 4];

export function fmtHours(steps) {
  const h = String(steps).padStart(2, "0");
  return `${h}:00:00`;
}

// Lifted here (rather than kept local to the footer) so any animated
// element — the Long Section plot's flow chevrons and stage rise/fall,
// the footer's own transport controls — reads the same playhead. See
// `animator` in App.jsx. Demo-only: no time-varying simulation data exists
// behind this prototype, so play/pause just steps `currentStep` through
// 1..32 on an interval.
//
// `trimStart`/`trimEnd` are the After Effects-style loop range: playback
// wraps within them instead of the full 1..totalSteps span, and `seekTo`
// (the only way to move the playhead — step buttons, scrub-drag, and the
// trim handles themselves all go through it) clamps into the same range.
export function useAnimator() {
  const [currentStep, setCurrentStepRaw] = useState(1);
  const [playing, setPlaying] = useState(false);
  const [speedIdx, setSpeedIdx] = useState(0);
  const [trimStart, setTrimStartRaw] = useState(1);
  const [trimEnd, setTrimEndRaw] = useState(TOTAL_STEPS);

  const seekTo = (n) => setCurrentStepRaw(Math.max(trimStart, Math.min(trimEnd, n)));
  const setTrimStart = (n) => {
    const clamped = Math.max(1, Math.min(n, trimEnd - 1));
    setTrimStartRaw(clamped);
    setCurrentStepRaw((s) => Math.max(s, clamped));
  };
  const setTrimEnd = (n) => {
    const clamped = Math.min(TOTAL_STEPS, Math.max(n, trimStart + 1));
    setTrimEndRaw(clamped);
    setCurrentStepRaw((s) => Math.min(s, clamped));
  };

  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => {
      setCurrentStepRaw((s) => (s >= trimEnd ? trimStart : s + 1));
    }, 500 / SPEEDS[speedIdx]);
    return () => clearInterval(id);
  }, [playing, speedIdx, trimStart, trimEnd]);

  return {
    currentStep, seekTo, playing, setPlaying, speedIdx, setSpeedIdx,
    totalSteps: TOTAL_STEPS, trimStart, trimEnd, setTrimStart, setTrimEnd,
  };
}
