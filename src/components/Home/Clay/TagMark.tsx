// A label on a clay scene: uppercase mono text with a 1px leader back to its anchor (the
// element's own origin). Shared by the live scene and by the stills, so both read the same.
// Offsets are px on an 890px-wide stage and scale with it (cqw).
const u = (px: number) => `${(px / 8.9).toFixed(3)}cqw`;

export function TagMark({ dx, dy, children }: { dx: number; dy: number; children: string }) {
  return (
    <>
      {(dx !== 0 || dy !== 0) && <i style={{ width: u(Math.hypot(dx, dy)), transform: `rotate(${Math.atan2(dy, dx)}rad)` }} />}
      <span style={{ left: u(dx), top: u(dy), transform: `translate(-50%, ${dy < 0 ? '-100%' : dy > 0 ? '0' : '-50%'})` }}>{children}</span>
    </>
  );
}
