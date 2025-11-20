// Core interactions and GSAP animations for The Boost Nation landing
document.addEventListener("DOMContentLoaded", () => {
  const isGSAP = typeof gsap !== "undefined";

  if (isGSAP) {
    gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

    // Shared fade/slide effect used across sections
    gsap.registerEffect({
      name: "fadeUp",
      effect: (targets, config) =>
        gsap.fromTo(
          targets,
          { y: config.y, opacity: 0, immediateRender: config.immediateRender ?? false },
          {
            y: 0,
            opacity: 1,
            duration: config.duration,
            ease: config.ease,
            stagger: config.stagger,
            scrollTrigger: config.scrollTrigger
          }
        ),
      defaults: { duration: 0.8, ease: "power3.out", y: 26 },
      extendTimeline: true
    });

    // Hero entrance
    gsap
      .timeline({ defaults: { duration: 1.1, ease: "power3.out", opacity: 0 } })
      .from(".nav", { y: -20, duration: 0.5 })
      .fadeUp(".hero-copy .eyebrow", {}, "-=0.2")
      .fadeUp(".hero-copy h1", {}, "-=0.3")
      .fadeUp(".hero-copy .lede", {}, "-=0.3")
      .fadeUp(".hero-actions button", { stagger: 0.12, immediateRender: true }, "-=0.25")
      .fadeUp(".hero-tags span", { stagger: 0.08, y: 14, immediateRender: true }, "-=0.3")
      .fadeUp(".nova-card", { immediateRender: true }, "-=0.2");

    // Parallax background layers
    gsap.to(".bg-aurora", {
      yPercent: 8,
      scrollTrigger: {
        trigger: ".hero",
        start: "top top",
        end: "bottom top",
        scrub: true
      }
    });
    gsap.to(".orb-1", {
      yPercent: 10,
      scrollTrigger: {
        trigger: ".hero",
        start: "top top",
        end: "bottom top",
        scrub: true
      }
    });
    gsap.to(".orb-2", {
      yPercent: -12,
      xPercent: 6,
      scrollTrigger: {
        trigger: ".hero",
        start: "top top",
        end: "bottom top",
        scrub: true
      }
    });

    // Section reveals and grids
    gsap.utils.toArray("[data-animate]").forEach(el => {
      gsap.effects.fadeUp(el, {
        scrollTrigger: {
          trigger: el,
          start: "top 80%",
          once: true,
          toggleActions: "play none none none"
        }
      });
    });

    // Nova panel reveal origin
    gsap.set(".nova-panel", { transformOrigin: "bottom right" });
  }

  // Smooth scroll for nav anchors via GSAP ScrollTo
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener("click", event => {
      const targetId = link.getAttribute("href");
      const target = document.querySelector(targetId);
      if (target) {
        event.preventDefault();
        if (isGSAP) {
          gsap.to(window, { duration: 1, ease: "power2.out", scrollTo: { y: target.offsetTop, autoKill: true } });
        } else {
          target.scrollIntoView({ behavior: "smooth" });
        }
      }
    });
  });

  // Tilt interaction on cards
  document.querySelectorAll(".tilt-card").forEach(card => {
    const dampen = 20;
    card.addEventListener("mousemove", e => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      const rotateX = (-y / rect.height) * dampen;
      const rotateY = (x / rect.width) * dampen;
      card.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-2px)`;
    });
    card.addEventListener("mouseleave", () => {
      card.style.transform = "";
    });
  });

  // Nova assistant panel
  const novaToggle = document.getElementById("nova-toggle");
  const novaPanel = document.getElementById("nova-panel");
  const novaClose = document.getElementById("nova-close");
  const talkNova = document.getElementById("talk-nova");
  const contactNova = document.getElementById("contact-nova");
  const consultBtn = document.getElementById("schedule-consult");
  const ctaConsult = document.getElementById("cta-consult");
  const suggestionChips = document.querySelectorAll(".suggestions .chip");
  const chatWindow = document.querySelector(".nova-panel-body");

  const openNova = () => {
    if (!novaPanel) return;
    novaPanel.classList.add("open");
    novaPanel.setAttribute("aria-hidden", "false");
    if (isGSAP) {
      gsap.fromTo(
        ".nova-panel",
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.25, ease: "power2.out" }
      );
      gsap.from(".nova-panel-body .chat-bubble", {
        opacity: 0,
        y: 12,
        stagger: 0.08,
        duration: 0.3,
        ease: "power2.out"
      });
    }
  };

  const closeNova = () => {
    if (!novaPanel) return;
    if (isGSAP) {
      gsap.killTweensOf(".nova-panel");
      gsap.to(".nova-panel", {
        duration: 0.2,
        opacity: 0,
        onComplete: () => {
          novaPanel.classList.remove("open");
          novaPanel.setAttribute("aria-hidden", "true");
          gsap.set(".nova-panel", { clearProps: "transform,opacity" });
        }
      });
    } else {
      novaPanel.classList.remove("open");
      novaPanel.setAttribute("aria-hidden", "true");
    }
  };

  const toggleNova = () => {
    if (!novaPanel) return;
    if (novaPanel.classList.contains("open")) {
      closeNova();
    } else {
      openNova();
    }
  };

  [novaToggle, talkNova, contactNova, consultBtn, ctaConsult].forEach(trigger => {
    if (trigger) trigger.addEventListener("click", trigger === novaToggle ? toggleNova : openNova);
  });
  [novaToggle, novaClose].forEach(btn => {
    if (btn) {
      btn.addEventListener("keydown", e => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          btn === novaClose ? closeNova() : toggleNova();
        }
      });
    }
  });
  if (novaClose) novaClose.addEventListener("click", closeNova);
  window.addEventListener("keydown", e => {
    if (e.key === "Escape") closeNova();
  });

  // Synthetic reply helper
  const appendMessage = (text, sender = "bot") => {
    if (!chatWindow) return;
    const bubble = document.createElement("div");
    bubble.classList.add("chat-bubble");
    bubble.textContent = text;
    if (sender === "user") bubble.classList.add("user");
    chatWindow.appendChild(bubble);
    chatWindow.scrollTop = chatWindow.scrollHeight;
  };

  const showTyping = () => {
    if (!chatWindow) return null;
    const typing = document.createElement("div");
    typing.classList.add("chat-bubble", "bot", "typing");
    typing.textContent = "Nova is typing...";
    chatWindow.appendChild(typing);
    chatWindow.scrollTop = chatWindow.scrollHeight;
    return typing;
  };

  const scriptedReplies = {
    "tell me about chatbot features": "Our interactive chatbots are game-changers! They provide instant support, handle FAQs, track orders, schedule appointments, recommend products, generate leads, collect feedback, integrate with CRMs, support multiple languages, and provide detailed analytics. Which feature interests you most?",
    "schedule a consultation": "Perfect! I'd love to set up your FREE 30-minute consultation. We'll discuss your needs and show how our chatbots transform your customer experience. What's the best email to send the scheduling link?",
    "how can chatbots help my business?": "Chatbots boost CSAT with instant answers, reduce support costs, capture leads 24/7, and automate scheduling and follow-ups. Want to focus on conversions, support deflection, or lead gen first?",
    "what's your process?": "We map intents, design flows, integrate CRM, and launch with analytics + continuous tuning. Kickoff starts with a 30-minute consultation—say “consultation” and I’ll book it.",
    "chatbot features": "Our interactive chatbots are game-changers! They provide instant support, handle FAQs, track orders, schedule appointments, recommend products, generate leads, collect feedback, integrate with CRMs, support multiple languages, and provide detailed analytics. Which feature interests you most?",
    pricing: "Chatbot projects typically range from $3,000-$10,000 depending on complexity, features, and integrations. Most clients see ROI within 3-6 months through reduced support costs and increased conversions. Want a custom quote?"
  };

  suggestionChips.forEach(chip => {
    chip.addEventListener("click", () => {
      const key = chip.textContent.trim().toLowerCase();
      appendMessage(chip.textContent, "user");
      const typing = showTyping();
      setTimeout(() => {
        if (typing) typing.remove();
        appendMessage(scriptedReplies[key] || "I can help with chatbots, automation, or scheduling a consultation.");
      }, 450);
    });
  });

  const input = document.querySelector(".nova-panel-input input");
  const sendBtn = document.querySelector(".nova-panel-input button");

  const handleSend = () => {
    if (!input || !input.value.trim()) return;
    const value = input.value.trim();
    appendMessage(value, "user");
    input.value = "";
    const lower = value.toLowerCase();
    const response = (() => {
      if (lower.includes("consultation")) {
        return "Let's book your free 30-minute session! What's your email?";
      }
      if (lower.includes("pricing")) {
        return "Chatbot projects typically range from $3,000-$10,000 depending on complexity, features, and integrations. Most clients see ROI within 3-6 months through reduced support costs and increased conversions. Want to discuss a custom quote for your needs?";
      }
      if (lower.includes("chatbot") || lower.includes("bot")) {
        return "Our interactive chatbots are game-changers! They provide instant support, handle FAQs, track orders, schedule appointments, recommend products, generate leads, collect feedback, integrate with CRMs, support multiple languages, and provide detailed analytics. Which feature interests you most?";
      }
      return scriptedReplies[lower] || "Got it! I can connect you with instant support, automation plans, or set a consult.";
    })();
    const typing = showTyping();
    setTimeout(() => {
      if (typing) typing.remove();
      appendMessage(response);
    }, 450);
  };

  if (sendBtn) sendBtn.addEventListener("click", handleSend);
  if (input) input.addEventListener("keydown", e => {
    if (e.key === "Enter") handleSend();
  });

  // Ripple effect on primary buttons
  document.querySelectorAll(".pill-btn, .ghost-btn").forEach(btn => {
    btn.addEventListener("click", e => {
      const circle = document.createElement("span");
      const size = Math.max(btn.clientWidth, btn.clientHeight);
      const rect = btn.getBoundingClientRect();
      circle.style.width = circle.style.height = `${size}px`;
      circle.style.left = `${e.clientX - rect.left - size / 2}px`;
      circle.style.top = `${e.clientY - rect.top - size / 2}px`;
      circle.classList.add("ripple-circle");
      btn.appendChild(circle);
      setTimeout(() => circle.remove(), 500);
    });
  });

  // Magnetic hover effect
  document.querySelectorAll(".magnetic").forEach(el => {
    const strength = 8;
    el.addEventListener("mousemove", e => {
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      el.style.transform = `translate(${(x / rect.width) * strength}px, ${(y / rect.height) * strength}px)`;
    });
    el.addEventListener("mouseleave", () => {
      el.style.transform = "";
    });
  });

  // Scroll progress + shrinking nav
  const nav = document.querySelector(".nav");
  const progress = document.querySelector(".progress-bar span");
  window.addEventListener("scroll", () => {
    const scrolled = window.scrollY / (document.body.scrollHeight - window.innerHeight);
    if (progress) progress.style.width = `${scrolled * 100}%`;
    if (nav) nav.classList.toggle("shrink", window.scrollY > 40);
  });

  // Mobile menu toggle
  const hamburger = document.querySelector(".hamburger");
  const mobileMenu = document.getElementById("mobile-menu");
  if (hamburger && mobileMenu) {
    hamburger.addEventListener("click", () => {
      const isOpen = mobileMenu.classList.toggle("open");
      hamburger.setAttribute("aria-expanded", isOpen);
    });
    mobileMenu.querySelectorAll("a").forEach(link => {
      link.addEventListener("click", () => {
        mobileMenu.classList.remove("open");
        hamburger.setAttribute("aria-expanded", "false");
      });
    });
  }
});
