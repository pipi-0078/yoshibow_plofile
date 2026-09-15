/** Animate while the page is visible; suspend work in background tabs. */
export function createMotionController(root) {
  const listeners = new Set();
  let paused = document.hidden;
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
  document.addEventListener("visibilitychange", () => {
    paused = document.hidden;
    update();
  });
  update();
  return {
    get paused() {
      return paused;
    },
    onChange(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}
