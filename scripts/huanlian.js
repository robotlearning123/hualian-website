(function () {
  const body = document.body;
  const header = document.querySelector("[data-site-header]");
  const navToggle = document.querySelector("[data-nav-toggle]");
  const primaryNav = document.querySelector("[data-primary-nav]");

  if (header) {
    const updateHeaderScroll = () => {
      header.classList.toggle("is-scrolled", window.scrollY > 24);
    };
    updateHeaderScroll();
    window.addEventListener("scroll", updateHeaderScroll, { passive: true });
  }

  if (navToggle && primaryNav) {
    navToggle.addEventListener("click", () => {
      const nextState = navToggle.getAttribute("aria-expanded") !== "true";
      navToggle.setAttribute("aria-expanded", String(nextState));
      body.classList.toggle("nav-open", nextState);
    });

    primaryNav.addEventListener("click", (event) => {
      if (event.target instanceof HTMLAnchorElement) {
        navToggle.setAttribute("aria-expanded", "false");
        body.classList.remove("nav-open");
      }
    });
  }

  const activePage = body.dataset.page;
  document.querySelectorAll("[data-nav-link]").forEach((link) => {
    if (link.dataset.navLink === activePage) {
      link.classList.add("is-active");
      link.setAttribute("aria-current", "page");
    }
  });

  document.querySelectorAll("[data-module-tabs]").forEach((root) => {
    const tabs = Array.from(root.querySelectorAll("[data-tab]"));
    const panels = Array.from(root.querySelectorAll("[data-panel]"));

    tabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        const target = tab.dataset.tab;

        tabs.forEach((item) => {
          item.setAttribute("aria-selected", String(item === tab));
        });

        panels.forEach((panel) => {
          const isActive = panel.dataset.panel === target;
          panel.toggleAttribute("hidden", !isActive);
          panel.classList.toggle("is-active", isActive);
        });
      });
    });
  });

  const canvas = document.getElementById("signalCanvas");
  if (!(canvas instanceof HTMLCanvasElement)) {
    return;
  }

  const context = canvas.getContext("2d");
  if (!context) {
    return;
  }

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let width = 0;
  let height = 0;
  let frame = 0;

  function resizeCanvas() {
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    width = canvas.clientWidth;
    height = canvas.clientHeight;
    canvas.width = Math.max(1, Math.floor(width * pixelRatio));
    canvas.height = Math.max(1, Math.floor(height * pixelRatio));
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  }

  function drawSignal() {
    context.clearRect(0, 0, width, height);
    context.lineWidth = 1;

    const lanes = Math.max(5, Math.floor(height / 120));
    for (let lane = 0; lane < lanes; lane += 1) {
      const yBase = (height / (lanes + 1)) * (lane + 1);
      const hueColor = lane % 2 === 0 ? "rgba(126, 228, 189, 0.32)" : "rgba(215, 173, 98, 0.24)";

      context.beginPath();
      for (let x = 0; x <= width; x += 8) {
        const pulse = Math.sin((x + frame * (1.6 + lane * 0.24)) * 0.026 + lane);
        const spike = Math.sin((x + frame * 2.1) * 0.082 + lane * 1.7);
        const y = yBase + pulse * 14 + Math.max(0, spike) * 9;

        if (x === 0) {
          context.moveTo(x, y);
        } else {
          context.lineTo(x, y);
        }
      }
      context.strokeStyle = hueColor;
      context.stroke();
    }

    context.fillStyle = "rgba(246, 241, 232, 0.18)";
    for (let i = 0; i < 90; i += 1) {
      const x = (i * 97 + frame * 0.7) % width;
      const y = (i * 53) % height;
      context.fillRect(x, y, 1, 1);
    }

    frame += prefersReducedMotion.matches ? 0 : 1;
    window.requestAnimationFrame(drawSignal);
  }

  resizeCanvas();
  drawSignal();
  window.addEventListener("resize", resizeCanvas);
})();
