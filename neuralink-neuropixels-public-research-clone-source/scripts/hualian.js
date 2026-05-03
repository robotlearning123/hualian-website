/* ==========================================================================
   Hualian (幻联科技) — Interactivity
   ========================================================================== */

(function () {
  "use strict";

  /* ---------- Announcement dismiss ---------- */
  var closeButtons = document.querySelectorAll("[data-close]");
  closeButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      var target = document.querySelector(button.dataset.close);
      if (target) target.setAttribute("hidden", "");
    });
  });

  /* ---------- Header scroll state ---------- */
  var header = document.querySelector(".site-header");
  var updateHeader = function () {
    if (!header) return;
    header.classList.toggle("is-scrolled", window.scrollY > window.innerHeight * 0.72);
  };

  updateHeader();
  window.addEventListener("scroll", updateHeader, { passive: true });

  /* ---------- Product Showcase Carousel ---------- */
  document.querySelectorAll("[data-showcase]").forEach(function (showcase) {
    var slides = Array.prototype.slice.call(showcase.querySelectorAll("[data-slide]"));
    var prevBtn = showcase.querySelector("[data-showcase-prev]");
    var nextBtn = showcase.querySelector("[data-showcase-next]");
    var status = showcase.querySelector("[data-showcase-status]");
    var index = 0;

    function render() {
      slides.forEach(function (slide, i) {
        var isActive = i === index;
        slide.classList.toggle("is-active", isActive);
        if (isActive) {
          slide.removeAttribute("hidden");
        } else {
          slide.setAttribute("hidden", "");
        }
      });

      if (status) {
        status.textContent = (index + 1) + " / " + slides.length;
      }
    }

    function goNext() {
      index = (index + 1) % slides.length;
      render();
    }

    function goPrev() {
      index = (index - 1 + slides.length) % slides.length;
      render();
    }

    if (prevBtn) {
      prevBtn.addEventListener("click", goPrev);
    }

    if (nextBtn) {
      nextBtn.addEventListener("click", goNext);
    }

    /* Touch / Swipe support */
    var touchStartX = 0;
    var touchStartY = 0;
    var isSwiping = false;

    showcase.addEventListener(
      "touchstart",
      function (e) {
        touchStartX = e.changedTouches[0].clientX;
        touchStartY = e.changedTouches[0].clientY;
        isSwiping = true;
      },
      { passive: true }
    );

    showcase.addEventListener(
      "touchend",
      function (e) {
        if (!isSwiping) return;
        isSwiping = false;

        var dx = e.changedTouches[0].clientX - touchStartX;
        var dy = e.changedTouches[0].clientY - touchStartY;

        /* Only act on mostly-horizontal swipes with sufficient distance */
        if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) {
          if (dx < 0) {
            goNext();
          } else {
            goPrev();
          }
        }
      },
      { passive: true }
    );

    /* Keyboard support for carousel */
    showcase.setAttribute("tabindex", "0");
    showcase.addEventListener("keydown", function (e) {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        goPrev();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        goNext();
      }
    });

    render();
  });
})();
