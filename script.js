// Core interactions and GSAP animations for the landing experience
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

  const input = document.querySelector(".nova-panel-input input");
  const sendBtn = document.querySelector(".nova-panel-input button");

  const getLocalReply = lower => {
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
  };

  const fetchNovaReply = async messageText => {
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: messageText })
      });
      if (!res.ok) {
        const detail = await res.json().catch(() => ({}));
        console.error("Chat proxy error", detail);
        return null;
      }
      const data = await res.json();
      return data?.message || null;
    } catch (err) {
      console.error("Chat fetch error", err);
      return null;
    }
  };

  const processMessage = async messageText => {
    appendMessage(messageText, "user");
    const typing = showTyping();
    const lower = messageText.toLowerCase();
    const localFallback = getLocalReply(lower);
    const reply = await fetchNovaReply(messageText);
    if (typing) typing.remove();
    appendMessage(reply || localFallback);
  };

  suggestionChips.forEach(chip => {
    chip.addEventListener("click", () => {
      const text = chip.textContent.trim();
      processMessage(text);
    });
  });

  const handleSend = () => {
    if (!input || !input.value.trim()) return;
    const value = input.value.trim();
    input.value = "";
    processMessage(value);
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
  const updateScrollState = () => {
    const denominator = document.body.scrollHeight - window.innerHeight;
    const scrolled = denominator > 0 ? window.scrollY / denominator : 0;
    if (progress) progress.style.width = `${Math.min(scrolled * 100, 100)}%`;
    if (nav) nav.classList.toggle("shrink", window.scrollY > 6);
  };
  updateScrollState();
  window.addEventListener("scroll", updateScrollState);

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

  // Branding wizard (multi-step game flow)
  const wizardForm = document.getElementById("branding-wizard");
  const wizardCard = document.querySelector(".wizard-card");
  const wizardSteps = wizardForm ? Array.from(wizardForm.querySelectorAll(".wizard-step")) : [];
  const wizardStepLabel = document.getElementById("wizard-step-label");
  const wizardStepName = document.getElementById("wizard-step-name");
  const wizardProgressFill = document.querySelector(".wizard-progress-fill");
  const wizardNext = document.getElementById("wizard-next");
  const wizardBack = document.getElementById("wizard-back");
  const wizardOverlay = document.getElementById("wizard-overlay");
  const wizardLoading = document.getElementById("wizard-loading");
  const wizardSuccess = document.getElementById("wizard-success");
  const wizardSuccessTitle = document.getElementById("wizard-success-title");
  const wizardSuccessBody = document.getElementById("wizard-success-body");
  const wizardRestart = document.getElementById("wizard-restart");
  const wizardError = document.getElementById("wizard-error");
  const wizardErrorBody = document.getElementById("wizard-error-body");
  const wizardErrorRetry = document.getElementById("wizard-error-retry");
  const FORM_ENDPOINT = "https://formsubmit.co/ajax/rawbethwebsites@gmail.com";

  if (wizardForm && wizardSteps.length) {
    let stepIndex = 0;
    const totalSteps = wizardSteps.length;

    const setWizardState = state => {
      if (!wizardOverlay) return;
      if (state === "idle") {
        wizardOverlay.hidden = true;
        if (wizardLoading) wizardLoading.hidden = true;
        if (wizardSuccess) wizardSuccess.hidden = true;
        if (wizardError) wizardError.hidden = true;
        wizardCard?.classList.remove("submitting", "done");
        if (wizardNext) wizardNext.disabled = false;
        if (wizardBack) wizardBack.disabled = false;
      }
      if (state === "loading") {
        wizardOverlay.hidden = false;
        if (wizardLoading) wizardLoading.hidden = false;
        if (wizardSuccess) wizardSuccess.hidden = true;
        if (wizardError) wizardError.hidden = true;
        wizardCard?.classList.add("submitting");
        if (wizardNext) wizardNext.disabled = true;
        if (wizardBack) wizardBack.disabled = true;
      }
      if (state === "success") {
        wizardOverlay.hidden = false;
        if (wizardLoading) wizardLoading.hidden = true;
        if (wizardSuccess) wizardSuccess.hidden = false;
        if (wizardError) wizardError.hidden = true;
        wizardCard?.classList.add("done");
        if (wizardNext) wizardNext.disabled = false;
        if (wizardBack) wizardBack.disabled = false;
      }
      if (state === "error") {
        wizardOverlay.hidden = false;
        if (wizardLoading) wizardLoading.hidden = true;
        if (wizardSuccess) wizardSuccess.hidden = true;
        if (wizardError) wizardError.hidden = false;
        wizardCard?.classList.remove("submitting");
        wizardCard?.classList.remove("done");
        if (wizardNext) wizardNext.disabled = false;
        if (wizardBack) wizardBack.disabled = false;
      }
    };

    const updateStep = () => {
      wizardSteps.forEach((step, idx) => {
        step.classList.toggle("active", idx === stepIndex);
      });
      const current = wizardSteps[stepIndex];
      const title = current?.dataset?.title || current?.querySelector("h3")?.textContent || "Step";
      if (wizardStepLabel) wizardStepLabel.textContent = `Step ${Math.min(stepIndex + 1, totalSteps)} of ${totalSteps}`;
      if (wizardStepName) wizardStepName.textContent = title;
      const progress = totalSteps ? ((stepIndex + 1) / totalSteps) * 100 : 0;
      if (wizardProgressFill) wizardProgressFill.style.width = `${progress}%`;
      if (wizardBack) wizardBack.disabled = stepIndex === 0;
      if (wizardNext) wizardNext.textContent = stepIndex === totalSteps - 1 ? "Submit brief" : "Next";
    };

    const goToStep = newIndex => {
      stepIndex = Math.max(0, Math.min(newIndex, totalSteps - 1));
      updateStep();
      const activeField = wizardSteps[stepIndex]?.querySelector("input, select, textarea");
      if (activeField) activeField.focus();
    };

    const handleNext = () => {
      const currentStep = wizardSteps[stepIndex];
      if (!currentStep) return;
      const field = currentStep.querySelector("input, select, textarea");
      if (field && field.required && !field.checkValidity()) {
        field.reportValidity();
        return;
      }
      if (stepIndex < totalSteps - 1) {
        goToStep(stepIndex + 1);
      } else {
        const formData = new FormData(wizardForm);
        const payload = Object.fromEntries(formData.entries());
        payload._subject = `New Instagram Branding Submission — ${wizardForm.elements.fullName?.value || "Unknown"}`;
        payload._captcha = "false";
        setWizardState("loading");
        fetch(FORM_ENDPOINT, {
          method: "POST",
          headers: { Accept: "application/json", "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        })
          .then(async res => {
            const detail = await res.json().catch(() => ({}));
            if (!res.ok || detail?.success === "false") {
              const msg = detail?.message || "We hit a snag sending your brief.";
              throw new Error(msg);
            }
            return detail;
          })
          .then(() => {
            const rawName = wizardForm.elements.fullName?.value?.trim() || "there";
            const displayName = rawName.startsWith("@") ? rawName : rawName.split(" ")[0] || rawName;
            if (wizardSuccessTitle) wizardSuccessTitle.textContent = `Thanks, ${displayName}!`;
            if (wizardSuccessBody) {
              wizardSuccessBody.textContent =
                "We’re crafting a bio, CTA lineup, and hashtag kit tailored to your Instagram goals.";
            }
            setWizardState("success");
          })
          .catch(err => {
            console.error("Branding submit failed", err);
            if (wizardErrorBody) wizardErrorBody.textContent = err?.message || "Please try again in a moment.";
            // Fallback: attempt normal form POST to FormSubmit (non-AJAX)
            wizardForm.action = "https://formsubmit.co/rawbethwebsites@gmail.com";
            wizardForm.method = "POST";
            wizardForm.submit();
            setWizardState("error");
          });
      }
    };

    const handleBack = () => {
      if (stepIndex === 0) return;
      goToStep(stepIndex - 1);
    };

    if (wizardNext) wizardNext.addEventListener("click", handleNext);
    if (wizardBack) wizardBack.addEventListener("click", handleBack);

    wizardForm.addEventListener("keydown", e => {
      const tag = e.target.tagName.toLowerCase();
      const isTextarea = tag === "textarea";
      if (e.key === "Enter" && !isTextarea) {
        e.preventDefault();
        handleNext();
      }
    });

    if (wizardRestart) {
      wizardRestart.addEventListener("click", () => {
        wizardForm.reset();
        setWizardState("idle");
        goToStep(0);
      });
    }

    if (wizardErrorRetry) {
      wizardErrorRetry.addEventListener("click", () => {
        setWizardState("idle");
      });
    }

    setWizardState("idle");
    updateStep();
  }
});
