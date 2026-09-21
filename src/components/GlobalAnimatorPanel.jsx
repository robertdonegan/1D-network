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
  const [direction, setDirection] = useState(1); // 1 = forward, -1 = reverse
  const [speedIdx, setSpeedIdx] = useState(0);
  const [trimStart, setTrimStartRaw] = useState(1);
  const [trimEnd, setTrimEndRaw] = useState(TOTAL_STEPS);
  const [loop, setLoop] = useState(true);

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

  // Toggles play in a given direction — clicking the same-direction play
  // button again pauses; clicking the other direction's button switches
  // direction and keeps playing.
  const play = (dir) => {
    setPlaying((wasPlaying) => {
      if (wasPlaying && direction === dir) return false;
      setDirection(dir);
      return true;
    });
  };

  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => {
      setCurrentStepRaw((s) => {
        if (direction > 0) {
          if (s >= trimEnd) return loop ? trimStart : s;
          return s + 1;
        }
        if (s <= trimStart) return loop ? trimEnd : s;
        return s - 1;
      });
    }, 500 / SPEEDS[speedIdx]);
    return () => clearInterval(id);
  }, [playing, direction, speedIdx, trimStart, trimEnd, loop]);

  // When looping is off, playback parks on the trim boundary instead of
  // wrapping — stop the transport as soon as it gets there.
  useEffect(() => {
    if (loop || !playing) return;
    if ((direction > 0 && currentStep >= trimEnd) || (direction < 0 && currentStep <= trimStart)) {
      setPlaying(false);
    }
  }, [loop, playing, direction, currentStep, trimStart, trimEnd]);

  return {
    currentStep, seekTo, playing, setPlaying, direction, play, speedIdx, setSpeedIdx,
    totalSteps: TOTAL_STEPS, trimStart, trimEnd, setTrimStart, setTrimEnd,
    loop, setLoop,
  };
}
