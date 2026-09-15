import { createMotionController } from "./motion.js";
import { initEnso } from "./enso.js";

const root = document.body;
root.classList.add("interactive");
const motion = createMotionController(root);
initMenu();
initApps(motion);
initReveals(motion);
initProgress();
initImageDepth(motion);
initButtonResponse(motion);
initTouchDepth(motion);
initTouchEntrances(motion);
initEnso(root, motion);
initMotionIndicator(motion);

function initMenu() {
  const menu = document.querySelector(".menu-toggle");
  const closeMenu = () => {
    root.classList.remove("menu-open");
    menu.setAttribute("aria-expanded", "false");
  };
  menu.addEventListener("click", () => {
    const open = root.classList.toggle("menu-open");
    menu.setAttribute("aria-expanded", String(open));
  });
  document
    .querySelectorAll("#site-menu a")
    .forEach((a) => a.addEventListener("click", closeMenu));
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && root.classList.contains("menu-open")) {
      closeMenu();
      menu.focus();
    }
  });
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".main-nav")) closeMenu();
  });
}

function initApps(motion) {
  // Preserve the complete four-app catalog when JavaScript is unavailable.
  const appCards = [...document.querySelectorAll(".app-card")];
  const selectorHost = document.querySelector(".app-selectors");
  const selectors = appCards.map((card, i) => {
    card.id = `app-panel-${i}`;
    const button = document.createElement("button");
    button.type = "button";
    button.className = "app-selector";
    button.setAttribute("aria-controls", card.id);
    button.setAttribute("aria-pressed", String(i === 0));
    const image = card.querySelector("img").cloneNode();
    image.alt = "";
    const title = document.createElement("span");
    title.textContent = card.querySelector("h3").textContent;
    const arrow = document.createElement("i");
    arrow.textContent = "↗";
    arrow.setAttribute("aria-hidden", "true");
    button.append(image, title, arrow);
    button.addEventListener("click", () => {
      appCards.forEach((panel, n) => {
        panel.hidden = n !== i;
        selectors[n].setAttribute("aria-pressed", String(n === i));
      });
      if (!motion.paused && !motion.prefersReducedMotion)
        card.animate(
          [
            { opacity: 0.3, transform: "translateY(8px)" },
            { opacity: 1, transform: "translateY(0)" },
          ],
          { duration: 250, easing: "ease-out" },
        );
    });
    selectorHost.append(button);
    card.hidden = i !== 0;
    return button;
  });
  root.classList.add("apps-enhanced");
  selectorHost.addEventListener("keydown", (e) => {
    const i = selectors.indexOf(document.activeElement);
    if (i < 0) return;
    let next;
    if (["ArrowRight", "ArrowDown"].includes(e.key))
      next = (i + 1) % selectors.length;
    if (["ArrowLeft", "ArrowUp"].includes(e.key))
      next = (i + selectors.length - 1) % selectors.length;
    if (e.key === "Home") next = 0;
    if (e.key === "End") next = selectors.length - 1;
    if (next !== undefined) {
      e.preventDefault();
      selectors[next].focus();
      selectors[next].click();
    }
  });
}

function initReveals(motion) {
  // One-time entrances; content remains visible if motion is reduced or paused.
  if ("IntersectionObserver" in window) {
    const revealObserver = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.remove("reveal-pending");
            revealObserver.unobserve(e.target);
          }
        }),
      { threshold: 0.05 },
    );
    document
      .querySelectorAll(
        ".section-intro,.story-card,.youtube-section,.apps-heading,.profile-statement,.featured>.card-image-wrap,.community-overview,.footer-menu",
      )
      .forEach((el) => {
        el.dataset.reveal = "";
        if (!motion.paused && el.getBoundingClientRect().top > innerHeight)
          el.classList.add("reveal-pending");
        revealObserver.observe(el);
      });
  }
  motion.onChange(() => {
    if (motion.paused)
      document
        .querySelectorAll(".reveal-pending")
        .forEach((el) => el.classList.remove("reveal-pending"));
  });
  // Alternate media entrances in document order, with a small stagger for pairs.
  const mediaFrames = [
    ...document.querySelectorAll(
      ".featured > .card-image-wrap, .story-card .card-image-wrap, .youtube-visual",
    ),
  ];
  const directions = ["top", "bottom", "left", "right"];
  if ("IntersectionObserver" in window) {
    const mediaObserver = new IntersectionObserver(
      (entries) => {
        entries
          .filter((entry) => entry.isIntersecting)
          .map((entry) => ({
            observed: entry.target,
            target: entry.target.matches(".youtube-section")
              ? entry.target.querySelector(".youtube-visual")
              : entry.target,
          }))
          .sort(
            (a, b) =>
              mediaFrames.indexOf(a.target) - mediaFrames.indexOf(b.target),
          )
          .forEach((entry, index) => {
            entry.target.style.setProperty(
              "--media-delay",
              `${Math.min(index, 2) * 120}ms`,
            );
            entry.target.classList.remove("media-pending");
            if (!motion.paused) entry.target.classList.add("media-revealed");
            mediaObserver.unobserve(entry.observed);
          });
      },
      { threshold: 0.12 },
    );
    mediaFrames.forEach((el, index) => {
      el.dataset.mediaDirection = directions[index % directions.length];
      if (!motion.paused && el.getBoundingClientRect().top >= innerHeight)
        el.classList.add("media-pending");
      mediaObserver.observe(
        el.matches(".youtube-visual") ? el.closest(".youtube-section") : el,
      );
    });
    const showMedia = () => {
      if (motion.paused)
        mediaFrames.forEach((el) => {
          el.classList.remove("media-pending");
          el.style.setProperty("--media-delay", "0ms");
        });
    };
    motion.onChange(showMedia);
  }
}

function initProgress() {
  let scrollQueued = false;
  const progress = document.querySelector(".reading-progress");
  addEventListener(
    "scroll",
    () => {
      if (scrollQueued) return;
      scrollQueued = true;
      requestAnimationFrame(() => {
        const distance = document.documentElement.scrollHeight - innerHeight;
        progress.style.transform = `scaleX(${distance > 0 ? scrollY / distance : 0})`;
        scrollQueued = false;
      });
    },
    { passive: true },
  );
}

function initImageDepth(motion) {
  // Small, pointer-following depth confined to editorial images.
  // Touch and reduced-motion users retain a stable, fully visible image.
  const finePointer = matchMedia("(hover: hover) and (pointer: fine)");
  const imageFrames = [
    ...document.querySelectorAll(".story-card .card-image-wrap"),
  ];
  imageFrames.forEach((el) => {
    let queued = 0,
      px = 0,
      py = 0;
    const reset = () => {
      el.style.removeProperty("--image-x");
      el.style.removeProperty("--image-y");
      el.style.removeProperty("--image-rx");
      el.style.removeProperty("--image-ry");
      el.style.removeProperty("--light-x");
      el.style.removeProperty("--light-y");
      el.classList.remove("image-active");
    };
    el.addEventListener(
      "pointermove",
      (e) => {
        if (motion.paused || !finePointer.matches || e.pointerType === "touch")
          return;
        const box = el.getBoundingClientRect();
        px = ((e.clientX - box.left) / box.width - 0.5) * 8;
        py = ((e.clientY - box.top) / box.height - 0.5) * 8;
        if (!queued)
          queued = requestAnimationFrame(() => {
            queued = 0;
            if (motion.paused || !finePointer.matches) return;
            el.style.setProperty("--image-x", `${px}px`);
            el.style.setProperty("--image-y", `${py}px`);
            el.style.setProperty("--image-rx", `${-py * 0.6}deg`);
            el.style.setProperty("--image-ry", `${px * 0.6}deg`);
            el.style.setProperty("--light-x", `${50 + px * 12.5}%`);
            el.style.setProperty("--light-y", `${50 + py * 12.5}%`);
            el.classList.add("image-active");
          });
      },
      { passive: true },
    );
    el.addEventListener("pointerleave", () => {
      if (queued) cancelAnimationFrame(queued);
      queued = 0;
      reset();
    });
    motion.onChange(reset);
  });
}

function initButtonResponse(motion) {
  const finePointer = matchMedia("(hover:hover) and (pointer:fine)");
  document.querySelectorAll(".btn-primary").forEach((button) => {
    let frame = 0;
    const reset = () => {
      cancelAnimationFrame(frame);
      frame = 0;
      button.style.removeProperty("--button-x");
      button.style.removeProperty("--button-y");
    };
    button.addEventListener(
      "pointermove",
      (event) => {
        if (
          motion.paused ||
          !finePointer.matches ||
          event.pointerType === "touch"
        )
          return;
        const box = button.getBoundingClientRect();
        const x = ((event.clientX - box.left) / box.width - 0.5) * 6;
        const y = ((event.clientY - box.top) / box.height - 0.5) * 6;
        cancelAnimationFrame(frame);
        frame = requestAnimationFrame(() => {
          frame = 0;
          if (motion.paused || !finePointer.matches) return;
          button.style.setProperty("--button-x", `${x}px`);
          button.style.setProperty("--button-y", `${y}px`);
        });
      },
      { passive: true },
    );
    button.addEventListener("pointerleave", reset);
    button.addEventListener("blur", reset);
    button.addEventListener("focus", reset);
    finePointer.addEventListener("change", reset);
    motion.onChange(reset);
  });
}

// Touch devices use scroll position instead of a mouse pointer.
function initTouchDepth(motion) {
  const touch = matchMedia("(hover: none) and (pointer: coarse)");
  const frames = [
    ...document.querySelectorAll(
      ".featured > .card-image-wrap, .story-card .card-image-wrap",
    ),
  ];
  let frame = 0;
  function update() {
    frame = 0;
    frames.forEach((el) => {
      if (!touch.matches || motion.paused) {
        el.style.removeProperty("--touch-depth");
        return;
      }
      const rect = el.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > innerHeight) return;
      const progress = Math.max(
        -1,
        Math.min(
          1,
          (innerHeight / 2 - rect.top - rect.height / 2) /
            (innerHeight / 2 + rect.height / 2),
        ),
      );
      el.style.setProperty("--touch-depth", `${progress * 14}px`);
    });
  }
  function schedule() {
    if (!frame) frame = requestAnimationFrame(update);
  }
  addEventListener("scroll", schedule, { passive: true });
  addEventListener("resize", schedule, { passive: true });
  touch.addEventListener("change", schedule);
  motion.onChange(schedule);
  schedule();
}

// Replay a visible entrance on touch devices, including after an explicit resume.
function initTouchEntrances(motion) {
  const touch = matchMedia("(max-width: 700px), (pointer: coarse)");
  const visible = new Set();
  const animations = new Map();
  function play(el) {
    animations.get(el)?.cancel();
    if (motion.paused || !touch.matches) return;
    const image = el.querySelector("img") || el;
    const direction = el.dataset.mediaDirection;
    const offset =
      { top: "0,-36px", bottom: "0,36px", left: "-36px,0", right: "36px,0" }[
        direction
      ] || "0,36px";
    animations.set(
      el,
      image.animate(
        [
          { opacity: 0.25, transform: `translate(${offset}) scale(1.16)` },
          { opacity: 1, transform: "translate(0,0) scale(1.12)" },
        ],
        { duration: 1400, easing: "cubic-bezier(.22,1,.36,1)" },
      ),
    );
  }
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          visible.add(entry.target);
          play(entry.target);
        } else {
          visible.delete(entry.target);
          animations.get(entry.target)?.cancel();
          animations.delete(entry.target);
        }
      }
    },
    { threshold: 0.25 },
  );
  document
    .querySelectorAll("[data-media-direction]")
    .forEach((el) => observer.observe(el));
  motion.onChange(() => visible.forEach(play));
  touch.addEventListener("change", () => visible.forEach(play));
}

function initMotionIndicator(motion) {
  const dot = document.querySelector(".status-dot");
  let animation;
  function update() {
    animation?.cancel();
    if (motion.paused) return;
    animation = dot.animate(
      [
        { transform: "scale(1)", boxShadow: "0 0 0 0px #a6e44480" },
        {
          transform: "scale(1.25)",
          boxShadow: "0 0 0 12px #a6e44400",
          offset: 0.7,
        },
        { transform: "scale(1)", boxShadow: "0 0 0 0px #a6e44400" },
      ],
      { duration: 2200, iterations: Infinity },
    );
  }
  motion.onChange(update);
  update();
}
