"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { formatILS } from "@/lib/format";

/** Counts a shekel amount up from zero once, on first paint. Shows the final value straight away when motion is reduced. */
export function CountUp({ value, duration = 1100 }: { value: number; duration?: number }) {
  const [shown, setShown] = useState(value);
  const done = useRef(false);
  useLayoutEffect(() => {
    if (done.current) { setShown(value); return; }
    done.current = true;
    if (value === 0 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 4);
      setShown(t === 1 ? value : Math.round(value * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    setShown(0);
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);
  return <>{formatILS(shown)}</>;
}
