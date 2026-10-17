// The loading screen lives in index.html so it paints before any JS runs. This
// slides it away once the app has mounted, so that the page is uncovered no
// earlier than MIN_MS from navigation start (the blocks get to shuffle once).
// Reduced motion hides it in CSS, so here it just goes.
const MIN_MS = 2000;
const SLIDE_MS = 600; // matches the transition in index.html

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
  }, Math.max(0, MIN_MS - SLIDE_MS - performance.now()));
}
