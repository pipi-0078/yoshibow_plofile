/** Single source of truth for the user toggle and OS motion preference. */
export function createMotionController(root, toggle) {
  const preference = matchMedia("(prefers-reduced-motion: reduce)");
  const listeners = new Set();
  let paused = preference.matches;
  function update() {
    root.classList.toggle("motion-paused", paused);
    toggle.setAttribute("aria-pressed", String(paused));
    toggle.textContent = paused ? "動きを再開" : "動きを停止";
    if (paused) {
      document
        .querySelectorAll(".reveal-pending, .media-pending")
        .forEach((el) => {
          el.classList.remove("reveal-pending", "media-pending");
        });
      document.getAnimations().forEach((animation) => animation.cancel());
    }
    listeners.forEach((listener) => listener());
  }
  toggle.addEventListener("click", () => {
    paused = !paused;
    update();
  });
  preference.addEventListener("change", (event) => {
    paused = event.matches;
    update();
  });
  update();
  return {
    get paused() {
      return paused;
    },
    get prefersReducedMotion() {
      return preference.matches;
    },
    onChange(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}
