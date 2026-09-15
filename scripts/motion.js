/** Single source of truth for the OS motion preference. */
export function createMotionController(root) {
  const preference = matchMedia("(prefers-reduced-motion: reduce)");
  const listeners = new Set();
  let paused = preference.matches;
  function update() {
    root.classList.toggle("motion-paused", paused);
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
