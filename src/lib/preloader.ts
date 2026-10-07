// The loading screen lives in index.html so it paints before any JS runs. This
// slides it away once the app has mounted, never before MIN_MS from navigation
// start, so the blocks get to shuffle at least once. Reduced motion hides it
// in CSS, so here it just goes.
const MIN_MS = 1700;

export function dismissPreloader() {
  const el = document.getElementById("preloader");
  if (!el) return;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduced) {
    el.remove();
    return;
  }
  const remove = () => el.remove();
  window.setTimeout(() => {
    el.classList.add("is-done");
    el.addEventListener("transitionend", remove, { once: true });
    // Hidden tabs do not run transitions; do not leave a wall over the page.
    window.setTimeout(remove, 900);
  }, Math.max(0, MIN_MS - performance.now()));
}
