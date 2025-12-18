// /js/ui/sidebar-bottom-follow-scroll.js
document.addEventListener("DOMContentLoaded", () => {
  const bottom = document.getElementById("sidebar-bottom");
  if (!bottom) return;

  const SPEED = 1;

  bottom.style.willChange = "transform";
  bottom.style.transform = "translate3d(0,0,0)";

  let ticking = false;
  let lastY = 0;

  function update() {
    ticking = false;
    bottom.style.transform = `translate3d(0, ${lastY}px, 0)`;
  }

  function onScroll() {
    const y = (window.scrollY || document.documentElement.scrollTop) * SPEED;
    lastY = y;

    if (!ticking) {
      ticking = true;
      requestAnimationFrame(update);
    }
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
});
