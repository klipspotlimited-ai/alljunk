/**
 * All Junk Solutions - Production Interactive Behaviors & Privacy-Safe Tracking
 * Squarespace 7.0 Developer Platform Integration
 */
(function () {
  'use strict';

  let heroSliderTimer = null;
  let reviewSliderTimer = null;

  function getCleanPagePath() {
    var path = (window.location && window.location.pathname) ? window.location.pathname : "/";
    return path.replace(/\/+$/, "") || "/";
  }

  function inferButtonPlacement(el) {
    if (!el) return "page_body";
    if (el.dataset && el.dataset.trackPlacement) return el.dataset.trackPlacement;
    if (el.closest(".mobile-bar")) return "mobile_bar";
    if (el.closest(".mobile-actions")) return "header_mobile";
    if (el.closest(".site-header")) return "header_desktop";
    if (el.closest(".hero, .page-hero")) return "hero";
    if (el.closest("#why-choose")) return "why_choose";
    if (el.closest("#pricing, .pricing")) return "pricing";
    if (el.closest("#demolition, .demolition")) return "demolition";
    if (el.closest("#reviews, .reviews-banner-section, #find-us")) return "reviews";
    if (el.closest("#areas, .areas, .area-hubs-section")) return "areas";
    if (el.closest("#quoteForm")) return "quote_form";
    if (el.closest("#contact, .cta")) return "contact_section";
    if (el.closest("footer, .footer")) return "footer";
    return "page_body";
  }

  function hasAnalyticsConsent() {
    try {
      // Respect Squarespace cookie banner opt-out if present
      var cookie = document.cookie || "";
      if (cookie.indexOf("ss_cookieAllowed=false") !== -1) return false;
      if (window.__alljunkConsentDenied === true) return false;
    } catch (e) {}
    return true;
  }

  function trackEnquiryIntent(eventName, placement) {
    if (!hasAnalyticsConsent()) return;
    // Strictly non-PII payload: clean page_path + button_placement only
    var payload = {
      page_path: getCleanPagePath(),
      button_placement: String(placement || "page_body")
    };
    try {
      if (typeof window.gtag === "function") {
        window.gtag("event", eventName, payload);
      } else if (Array.isArray(window.dataLayer)) {
        window.dataLayer.push({
          event: eventName,
          page_path: payload.page_path,
          button_placement: payload.button_placement
        });
      }
    } catch (e) {}
  }

  function initAllJunk() {
    // 1. Mobile Menu Drawer Navigation
    const siteHeader = document.querySelector(".site-header");
    const menuToggle = document.querySelector(".menu-toggle");
    const mainNav = document.getElementById("mainNav");
    if (siteHeader && menuToggle && mainNav && !menuToggle.dataset.bound) {
      menuToggle.dataset.bound = "true";
      menuToggle.addEventListener("click", () => {
        const isOpen = siteHeader.classList.toggle("menu-open");
        menuToggle.setAttribute("aria-expanded", String(isOpen));
      });
      mainNav.querySelectorAll("a").forEach((link) => {
        link.addEventListener("click", () => {
          siteHeader.classList.remove("menu-open");
          menuToggle.setAttribute("aria-expanded", "false");
        });
      });
    }

    // 2. Hero Background Image Slider (deferred auto-advance)
    const slider = document.querySelector("[data-slider]");
    if (slider && !slider.dataset.bound) {
      slider.dataset.bound = "true";
      const track = slider.querySelector(".hero-bg-track");
      const slides = Array.from(slider.querySelectorAll(".hero-bg-slide"));
      if (track && slides.length > 1) {
        let active = 0;
        const move = (direction) => {
          active = (active + direction + slides.length) % slides.length;
          track.style.transform = "translateX(-" + (active * 100) + "%)";
        };
        const prevBtn = slider.querySelector("[data-prev]");
        if (prevBtn) prevBtn.addEventListener("click", () => move(-1));
        const nextBtn = slider.querySelector("[data-next]");
        if (nextBtn) nextBtn.addEventListener("click", () => move(1));

        if (heroSliderTimer) clearInterval(heroSliderTimer);
        heroSliderTimer = window.setInterval(() => move(1), 6500);
      }
    }

    // 3. Mobile Hero Background Video Player (deferred until post-load / user interaction so mobile LCP stays fast)
    const mobileHeroVideo = document.querySelector(".mobile-hero-video");
    if (mobileHeroVideo && !mobileHeroVideo.dataset.bound) {
      mobileHeroVideo.dataset.bound = "true";
      const mobileHeroSource = mobileHeroVideo.querySelector("source[data-src]");
      if (mobileHeroSource) {
        const mobileViewport = window.matchMedia("(max-width: 767.98px)");
        const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
        let videoLoaded = false;

        const activateMobileVideo = () => {
          if (videoLoaded) return;
          const shouldPlay = mobileViewport.matches && !reducedMotion.matches;
          if (!shouldPlay) return;
          videoLoaded = true;
          if (!mobileHeroSource.hasAttribute("src")) {
            mobileHeroSource.setAttribute("src", mobileHeroSource.dataset.src);
            mobileHeroVideo.load();
          }
          const playback = mobileHeroVideo.play();
          if (playback && typeof playback.catch === "function") {
            playback.catch(() => {});
          }
        };

        const scheduleVideo = () => {
          const onInteract = () => {
            ["scroll", "pointerdown", "touchstart", "keydown"].forEach((evt) =>
              window.removeEventListener(evt, onInteract)
            );
            activateMobileVideo();
          };
          ["scroll", "pointerdown", "touchstart", "keydown"].forEach((evt) =>
            window.addEventListener(evt, onInteract, { passive: true, once: true })
          );
          window.setTimeout(activateMobileVideo, 6000);
        };

        if (document.readyState === "complete") {
          scheduleVideo();
        } else {
          window.addEventListener("load", scheduleVideo, { once: true });
        }
      }
    }

    // 4. Before-and-After Split Comparison Slider
    document.querySelectorAll("[data-before-after]").forEach((comparison) => {
      if (comparison.dataset.bound) return;
      comparison.dataset.bound = "true";
      const range = comparison.querySelector(".ba-range");
      if (!range) return;
      const setSplit = (value) => {
        comparison.style.setProperty("--split", value + "%");
        range.value = value;
      };
      range.addEventListener("input", () => setSplit(range.value));
      comparison.addEventListener("pointerdown", (event) => {
        const rect = comparison.getBoundingClientRect();
        if (!rect.width) return;
        const percent = Math.min(92, Math.max(8, ((event.clientX - rect.left) / rect.width) * 100));
        setSplit(percent.toFixed(1));
      });
    });

    // 5. Interactive FAQ Accordion
    document.querySelectorAll(".faq-q").forEach((button) => {
      if (button.dataset.bound) return;
      button.dataset.bound = "true";
      button.addEventListener("click", () => {
        const item = button.closest(".faq-item");
        if (item) item.classList.toggle("open");
      });
    });

    // 6. Customer Reviews Category Filter Tabs (/testimonials & /reviews)
    const filterButtons = document.querySelectorAll("[data-review-filter]");
    const reviewGrid = document.getElementById("allReviewsGrid");
    if (filterButtons.length && reviewGrid) {
      const cards = Array.from(reviewGrid.querySelectorAll(".g-review-card"));
      filterButtons.forEach((btn) => {
        if (btn.dataset.bound) return;
        btn.dataset.bound = "true";
        btn.addEventListener("click", () => {
          const cat = btn.dataset.reviewFilter;
          filterButtons.forEach((b) => b.classList.toggle("active", b === btn));
          cards.forEach((card) => {
            const match = cat === "all" || card.dataset.reviewCat === cat;
            card.style.display = match ? "" : "none";
          });
        });
      });
    }

    // 7. Active Navigation State for Multipage Architecture
    const currentPath = getCleanPagePath();
    document.querySelectorAll("#mainNav a").forEach((link) => {
      const href = (link.getAttribute("href") || "").split("#")[0].replace(/\/+$/, "") || "/";
      if (href === currentPath && !(link.getAttribute("href") || "").includes("#")) {
        link.setAttribute("aria-current", "page");
      }
    });

    // 8. Privacy-Safe Phone & Direct WhatsApp Click Tracking (fires once per tap, zero PII)
    if (!document.documentElement.dataset.alljunkTrackingBound) {
      document.documentElement.dataset.alljunkTrackingBound = "true";
      document.addEventListener("click", (event) => {
        const link = event.target && event.target.closest ? event.target.closest("a[href]") : null;
        if (!link) return;
        const href = link.getAttribute("href") || "";
        if (href.indexOf("tel:") === 0) {
          trackEnquiryIntent("phone_call_click", inferButtonPlacement(link));
        } else if (href.indexOf("wa.me/") !== -1 || href.indexOf("whatsapp.com/") !== -1) {
          trackEnquiryIntent("whatsapp_quote_click", inferButtonPlacement(link));
        }
      }, { passive: true });
    }

    // 9. Instant Quote Form -> WhatsApp Generator (fires quote_form_whatsapp_open once, zero PII)
    const form = document.getElementById("quoteForm");
    if (form && !form.dataset.bound) {
      form.dataset.bound = "true";
      form.addEventListener("submit", (event) => {
        event.preventDefault();
        if (typeof form.reportValidity === "function" && !form.reportValidity()) return;
        const data = new FormData(form);
        const message = [
          "Hi All Junk Solutions, I'd like a quote.",
          "Name: " + (data.get("name") || ""),
          "Phone: " + (data.get("phone") || ""),
          "Postcode: " + (data.get("postcode") || ""),
          "Type of waste: " + (data.get("waste") || ""),
          "Details: " + (data.get("description") || "")
        ].join("\n");
        trackEnquiryIntent("quote_form_whatsapp_open", inferButtonPlacement(form));
        window.open("https://wa.me/447931935833?text=" + encodeURIComponent(message), "_blank", "noopener");
      });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initAllJunk);
  } else {
    initAllJunk();
  }

  // Squarespace dynamic lifecycle & AJAX navigation hooks
  if (typeof window !== "undefined" && window.Y && window.Y.Squarespace) {
    window.Y.Squarespace.on("initialize", initAllJunk);
  }
})();
