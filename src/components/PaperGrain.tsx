/**
 * PaperGrain — pure-CSS subtle paper texture applied as a fixed, pointer-events-none
 * overlay. Sits below content (z-0) and above the body background. Repeating-linear-gradient
 * at ~1% opacity adds just enough texture to evoke paper without repaint cost — the
 * element never scrolls or animates so the GPU doesn't re-rasterize it.
 */
export function PaperGrain() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 bg-[repeating-linear-gradient(45deg,transparent_0_2px,rgba(237,234,227,0.012)_2px_3px)]"
    />
  );
}
