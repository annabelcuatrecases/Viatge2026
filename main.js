/* main.js — Florida & Bahamas 2026 */
(function () {
  "use strict";

  function safe(fn, name) {
    try { fn(); } catch(e) { console.warn("[" + name + "]", e.message); }
  }

  /* ====== SPLASH ====== */
  function initSplash() {
    var splash = document.getElementById("splash");
    if (!splash) return;
    // JS backup: hide after 2s
    setTimeout(function () {
      splash.classList.add("hidden");
    }, 2000);
  }

  /* ====== CUSTOM CURSOR ====== */
  function initCursor() {
    var root = document.querySelector("[data-cursor-root]");
    if (!root || !matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    document.documentElement.classList.add("has-cursor");
    var ring = root.querySelector(".cursor-ring");
    var dot  = root.querySelector(".cursor-dot");
    var tx = 0, ty = 0, rx = 0, ry = 0, firstMove = false;

    window.addEventListener("mousemove", function(e) {
      tx = e.clientX; ty = e.clientY;
      if (dot) dot.style.transform = "translate3d(" + tx + "px," + ty + "px,0)";
      if (!firstMove) {
        firstMove = true; rx = tx; ry = ty;
        if (ring) ring.style.transform = "translate3d(" + rx + "px," + ry + "px,0)";
        root.classList.add("is-ready");
      }
    }, { passive: true });

    function tick() {
      rx += (tx - rx) * 0.14; ry += (ty - ry) * 0.14;
      if (ring) ring.style.transform = "translate3d(" + rx + "px," + ry + "px,0)";
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);

    var HOVER = ".bento-card, .tl-event, .tool-btn, a, button, .chip";
    document.addEventListener("mouseover", function(e) {
      if (e.target.closest(HOVER)) root.classList.add("is-interactive");
    });
    document.addEventListener("mouseout", function(e) {
      if (e.target.closest(HOVER)) root.classList.remove("is-interactive");
    });
  }

  /* ====== NAV SCROLL ====== */
  function initNav() {
    var nav = document.getElementById("nav");
    if (!nav) return;
    window.addEventListener("scroll", function() {
      nav.classList.toggle("scrolled", window.scrollY > 60);
    }, { passive: true });
    // Smooth anchor
    document.addEventListener("click", function(e) {
      var a = e.target.closest('a[href^="#"]');
      if (!a) return;
      var id = a.getAttribute("href");
      if (!id || id === "#") return;
      var el = document.querySelector(id);
      if (!el) return;
      e.preventDefault();
      window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 72, behavior: "smooth" });
    });
  }

  /* ====== GSAP HERO REVEAL ====== */
  function initHeroGSAP() {
    if (typeof gsap === "undefined") return;
    var tl = gsap.timeline({ delay: 1.8 });
    tl.fromTo(".hero-eyebrow",
      { y: 20, opacity: 0 },
      { y: 0, opacity: 1, duration: .8, ease: "power3.out" }
    )
    .fromTo(".hero-line",
      { y: "100%", opacity: 0 },
      { y: "0%", opacity: 1, duration: 1.1, ease: "power4.out", stagger: .12 },
      "-=.4"
    )
    .fromTo(".hero-desc",
      { y: 20, opacity: 0 },
      { y: 0, opacity: 1, duration: .8, ease: "power3.out" },
      "-=.6"
    )
    .fromTo(".hero-chips",
      { y: 16, opacity: 0 },
      { y: 0, opacity: 1, duration: .7, ease: "power3.out" },
      "-=.5"
    )
    .fromTo(".hero-stats-bar",
      { y: 30, opacity: 0 },
      { y: 0, opacity: 1, duration: .9, ease: "power3.out" },
      "-=.4"
    );
  }

  /* ====== SCROLL REVEAL ====== */
  function initReveal() {
    // Only animate if IntersectionObserver + no reduced motion preference
    var days = document.querySelectorAll(".tl-day");

    // Safety: always visible regardless
    days.forEach(function(el) { el.classList.add("revealed"); });

    // Optionally add subtle entrance if IO available
    if (!window.IntersectionObserver) return;
    var io = new IntersectionObserver(function(entries) {
      entries.forEach(function(en) {
        if (!en.isIntersecting) return;
        en.target.classList.add("revealed");
        en.target.classList.remove("animate-in");
        io.unobserve(en.target);
      });
    }, { threshold: 0.04 });

    days.forEach(function(el, i) {
      el.classList.add("animate-in");
      el.classList.remove("revealed");
      el.style.transitionDelay = Math.min(i * 0.05, 0.25) + "s";
      io.observe(el);
    });

    // Hard safety net at 1.5s — never leave days hidden
    setTimeout(function() {
      days.forEach(function(el) {
        el.classList.add("revealed");
        el.classList.remove("animate-in");
      });
    }, 1500);
  }

  /* ====== GSAP SCROLL ANIMATIONS ====== */
  function initScrollGSAP() {
    if (typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") return;
    gsap.registerPlugin(ScrollTrigger);

    // Bento cards stagger
    gsap.fromTo(".bento-card",
      { y: 60, opacity: 0 },
      {
        y: 0, opacity: 1,
        duration: 1, ease: "power3.out",
        stagger: .12,
        scrollTrigger: { trigger: ".bento", start: "top 80%", once: true }
      }
    );

    // Section heads
    document.querySelectorAll(".section-head, .cruise-header, .tl-header").forEach(function(el) {
      gsap.fromTo(el,
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: .9, ease: "power3.out",
          scrollTrigger: { trigger: el, start: "top 85%", once: true } }
      );
    });

    // cruise stops
    gsap.fromTo(".cstop",
      { y: 24, opacity: 0 },
      { y: 0, opacity: 1, duration: .7, ease: "power2.out", stagger: .07,
        scrollTrigger: { trigger: ".cruise-stops", start: "top 80%", once: true } }
    );

    // tool cards
    gsap.fromTo(".tool-card",
      { y: 40, opacity: 0 },
      { y: 0, opacity: 1, duration: .9, ease: "power3.out",
        stagger: .15,
        scrollTrigger: { trigger: "#compra", start: "top 80%", once: true } }
    );
  }

  /* ====== BENTO CARD TILT ====== */
  function initTilt() {
    if (!matchMedia("(hover: hover)").matches) return;
    document.querySelectorAll("[data-tilt]").forEach(function(card) {
      card.addEventListener("mousemove", function(e) {
        var r = card.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width  - .5;
        var y = (e.clientY - r.top)  / r.height - .5;
        card.style.transform = "perspective(800px) rotateY(" + (x * 8) + "deg) rotateX(" + (-y * 8) + "deg) scale(1.02)";
        card.style.boxShadow = "0 24px 60px rgba(232,97,42," + (0.12 + Math.abs(x)*0.1) + ")";
      });
      card.addEventListener("mouseleave", function() {
        card.style.transform = "";
        card.style.boxShadow = "";
      });
    });
  }

  /* ====== TIMELINE FILTERS ====== */
  function initTimelineFilters() {
    var btns = document.querySelectorAll(".tl-filter");
    if (!btns.length) return;
    btns.forEach(function(btn) {
      btn.addEventListener("click", function() {
        btns.forEach(function(b) { b.classList.remove("active"); });
        btn.classList.add("active");
        var show = btn.dataset.show;
        document.querySelectorAll(".tl-day").forEach(function(day) {
          var zone = day.dataset.zone || "";
          if (show === "all" || zone === show) {
            day.classList.remove("hidden");
          } else {
            day.classList.add("hidden");
          }
        });
      });
    });
  }

  /* ====== MARQUEE PAUSE ON HOVER ====== */
  function initMarquee() {
    var track = document.querySelector(".marquee-track");
    if (!track) return;
    var wrap = track.closest(".marquee-wrap");
    if (wrap) {
      wrap.addEventListener("mouseenter", function() {
        track.style.animationPlayState = "paused";
      });
      wrap.addEventListener("mouseleave", function() {
        track.style.animationPlayState = "running";
      });
    }
  }

  /* ====== BOOT ====== */
  function boot() {
    safe(initSplash,          "splash");
    safe(initCursor,          "cursor");
    safe(initNav,             "nav");
    safe(initHeroGSAP,        "heroGSAP");
    safe(initReveal,          "reveal");
    safe(initScrollGSAP,      "scrollGSAP");
    safe(initTilt,            "tilt");
    safe(initTimelineFilters, "tlFilters");
    safe(initMarquee,         "marquee");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }

})();
