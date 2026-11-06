/**
 * All Junk Solutions - Production Interactive Behaviors
 * Squarespace 7.0 Developer Platform Integration
 * Quality Assured & Defensively Hardened
 */
(function () {
  'use strict';

  let heroSliderTimer = null;
  let reviewSliderTimer = null;

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

    // 2. Hero Background Image Slider
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

    // 3. Mobile Hero Background Video Player
    const mobileHeroVideo = document.querySelector(".mobile-hero-video");
    if (mobileHeroVideo) {
      const mobileHeroSource = mobileHeroVideo.querySelector("source[data-src]");
      if (mobileHeroSource) {
        const mobileViewport = window.matchMedia("(max-width: 767.98px)");
        const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
        const syncMobileHeroVideo = () => {
          const shouldPlay = mobileViewport.matches && !reducedMotion.matches;
          if (shouldPlay && !mobileHeroSource.hasAttribute("src")) {
            mobileHeroSource.setAttribute("src", mobileHeroSource.dataset.src);
            mobileHeroVideo.load();
          }
          if (shouldPlay) {
            const playback = mobileHeroVideo.play();
            if (playback && typeof playback.catch === "function") {
              playback.catch(() => {});
            }
          } else {
            mobileHeroVideo.pause();
            if (mobileHeroSource.hasAttribute("src")) {
              mobileHeroSource.removeAttribute("src");
              mobileHeroVideo.load();
            }
          }
        };
        syncMobileHeroVideo();
        if (typeof mobileViewport.addEventListener === "function") {
          mobileViewport.addEventListener("change", syncMobileHeroVideo);
          reducedMotion.addEventListener("change", syncMobileHeroVideo);
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

    // 5. Google Reviews Carousel & Verified Fallback Ratings
    const reviewsEl = document.querySelector("[data-google-reviews]");
    if (reviewsEl && !reviewsEl.dataset.bound) {
      reviewsEl.dataset.bound = "true";
      const fallbackReviews = [
        { author_name: "Gary Elliott", text: "James came within 2 hours of the initial inquiry and took away the old sofa no problems, great service good price will definitely use again", relative_time_description: "Customer review" },
        { author_name: "Leia Parry", text: "I had rubbish from a flooded bathroom in the garden for months, but in 20 minutes these guys came and whisked it away. Highly recommend, fair pricing and a fab service.", relative_time_description: "Customer review" },
        { author_name: "Jodie Littlewood", text: "Excellent service as always from the team at All Junk Solutions, quick and efficient and very reasonably priced. I have used them a number of times now and the service is always professional.", relative_time_description: "Customer review" },
        { author_name: "Natasha Gee", text: "Super efficient. Friendly and reliable service. More cost effective than a skip with the added bonus of James and his team loading it all up for you.", relative_time_description: "Customer review" },
        { author_name: "Katherine Mott", text: "Great service and communication. Fast response and reasonable rates. Very friendly and polite, would highly recommend.", relative_time_description: "Customer review" },
        { author_name: "Jane Carrasco", text: "Prompt, polite, efficient service. Would definitely recommend and use again. Thanks guys!", relative_time_description: "Customer review" }
      ];
      const reviewTrack = reviewsEl.querySelector("[data-review-track]");
      const reviewDots = reviewsEl.querySelector("[data-review-dots]");
      const reviewRating = reviewsEl.querySelector("[data-review-rating]");
      const reviewSource = reviewsEl.querySelector("[data-review-source]");
      const endpoint = reviewsEl.dataset.googleReviewsEndpoint;
      let reviewIndex = 0;

      const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (char) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
      }[char]));

      const cleanReview = (review) => ({
        author_name: review.author_name || review.author || "Google reviewer",
        text: review.text || review.review || "",
        relative_time_description: review.relative_time_description || review.date || "Google review"
      });

      const paintReviews = (reviews, meta = {}) => {
        if (!reviewTrack) return;
        const items = reviews.map(cleanReview).filter((review) => review.text).slice(0, 8);
        if (!items.length) return;
        reviewTrack.innerHTML = items.map((review) => `
          <div class="review-slide">
            <blockquote>
              <p>"${escapeHtml(review.text)}"</p>
              <cite>${escapeHtml(review.author_name)}<span class="review-date">${escapeHtml(review.relative_time_description)}</span></cite>
            </blockquote>
          </div>
        `).join("");

        if (reviewDots) {
          reviewDots.innerHTML = items.map((_, index) => `<button class="review-dot${index === 0 ? " active" : ""}" type="button" data-review-dot="${index}" aria-label="Show review ${index + 1}" aria-current="${index === 0 ? "true" : "false"}"></button>`).join("");
        }

        reviewIndex = 0;
        if (reviewRating) {
          reviewRating.textContent = meta.rating ? `${meta.rating} Google rating` : "Google reviews";
        }
        if (reviewSource) {
          reviewSource.textContent = meta.total ? `${meta.total} reviews on Google` : "Showing customer feedback";
        }

        const goToReview = (index) => {
          if (!items.length || !reviewTrack) return;
          reviewIndex = (index + items.length) % items.length;
          reviewTrack.style.transform = `translateX(-${reviewIndex * 100}%)`;
          if (reviewDots) {
            reviewDots.querySelectorAll(".review-dot").forEach((dot, dotIndex) => {
              dot.classList.toggle("active", dotIndex === reviewIndex);
              dot.setAttribute("aria-current", dotIndex === reviewIndex ? "true" : "false");
            });
          }
        };

        const stopReviewTimer = () => {
          if (reviewSliderTimer) clearInterval(reviewSliderTimer);
        };
        const startReviewTimer = () => {
          stopReviewTimer();
          if (items.length > 1 && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
            reviewSliderTimer = window.setInterval(() => goToReview(reviewIndex + 1), 6000);
          }
        };

        const prevBtn = reviewsEl.querySelector("[data-review-prev]");
        if (prevBtn) {
          prevBtn.onclick = () => {
            goToReview(reviewIndex - 1);
            startReviewTimer();
          };
        }
        const nextBtn = reviewsEl.querySelector("[data-review-next]");
        if (nextBtn) {
          nextBtn.onclick = () => {
            goToReview(reviewIndex + 1);
            startReviewTimer();
          };
        }

        if (reviewDots) {
          reviewDots.querySelectorAll("[data-review-dot]").forEach((dot) => {
            dot.addEventListener("click", () => {
              goToReview(Number(dot.dataset.reviewDot));
              startReviewTimer();
            });
          });
        }

        reviewsEl.addEventListener("mouseenter", stopReviewTimer);
        reviewsEl.addEventListener("mouseleave", startReviewTimer);
        reviewsEl.addEventListener("focusin", stopReviewTimer);
        reviewsEl.addEventListener("focusout", startReviewTimer);
        goToReview(0);
        startReviewTimer();
      };

      const loadReviews = async () => {
        if (!endpoint) {
          paintReviews(fallbackReviews);
          return;
        }
        try {
          const response = await fetch(endpoint, { headers: { "Accept": "application/json" } });
          if (!response.ok) throw new Error("Review endpoint failed");
          const data = await response.json();
          const reviews = Array.isArray(data) ? data : data.reviews;
          if (!reviews || !reviews.length) throw new Error("No reviews returned");
          paintReviews(reviews, { rating: data.rating, total: data.user_ratings_total || data.total });
        } catch (error) {
          paintReviews(fallbackReviews);
        }
      };

      loadReviews();
    }

    // 6. Interactive FAQ Accordion
    document.querySelectorAll(".faq-q").forEach((button) => {
      if (button.dataset.bound) return;
      button.dataset.bound = "true";
      button.addEventListener("click", () => {
        const item = button.closest(".faq-item");
        if (item) item.classList.toggle("open");
      });
    });

    // 7. Instant Quote Form -> WhatsApp Generator
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
        window.open("https://wa.me/447931935833?text=" + encodeURIComponent(message), "_blank", "noopener");
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAllJunk);
  } else {
    initAllJunk();
  }

  // Squarespace dynamic lifecycle & AJAX navigation hooks
  if (typeof window !== 'undefined' && window.Y && window.Y.Squarespace) {
    window.Y.Squarespace.on('initialize', initAllJunk);
  }
})();
