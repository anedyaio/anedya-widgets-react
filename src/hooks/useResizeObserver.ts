import { useRef, useEffect, useState } from "react";

interface ElementSize {
  width: number;
  height: number;
}

export function useResizeObserver(): {
  ref: React.RefObject<HTMLDivElement | null>;
  width: number;
  height: number;
} {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [size, setSize] = useState<ElementSize>({ width: 0, height: 0 });

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;

    // Create the observer (non‑generic)
    const observer = new ResizeObserver((entries) => {
      if (!entries.length) return;
      const { width, height } = entries[0].contentRect;
      setSize({ width, height });
    });

    observer.observe(node);

    // Cleanup
    return () => {
      observer.disconnect();
    };
  }, []); // empty dependency → runs once after mount

  return { ref: containerRef, ...size };
}