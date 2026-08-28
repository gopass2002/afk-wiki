(() => {
  "use strict";

  const focusableSelector = [
    "a[href]",
    "button:not([disabled])",
    "input:not([disabled])",
    "select:not([disabled])",
    "textarea:not([disabled])",
    "[tabindex]:not([tabindex='-1'])"
  ].join(",");

  const normalize = (value) => String(value ?? "")
    .normalize("NFKC")
    .toLocaleLowerCase("ko-KR")
    .trim();

  const setupNavigation = () => {
    const nav = document.querySelector("[data-site-nav]");
    const openButton = document.querySelector("[data-nav-open]");
    const closeButton = document.querySelector("[data-nav-close]");
    const backdrop = document.querySelector("[data-nav-backdrop]");
    if (!nav || !openButton || !closeButton || !backdrop) return;

    let returnFocus = null;
    const desktopQuery = window.matchMedia("(min-width: 72rem)");

    const syncNavigation = (isOpen = false) => {
      const isDesktop = desktopQuery.matches;
      const shouldOpen = !isDesktop && isOpen;

      nav.classList.toggle("is-open", shouldOpen);
      nav.inert = !isDesktop && !shouldOpen;
      if (isDesktop || shouldOpen) nav.removeAttribute("aria-hidden");
      else nav.setAttribute("aria-hidden", "true");

      backdrop.hidden = !shouldOpen;
      document.body.classList.toggle("is-locked", shouldOpen);
      openButton.setAttribute("aria-expanded", String(shouldOpen));
    };

    const close = () => {
      const wasOpen = nav.classList.contains("is-open");
      syncNavigation(false);
      if (wasOpen && !desktopQuery.matches) returnFocus?.focus();
    };

    const open = () => {
      if (desktopQuery.matches) return;
      returnFocus = document.activeElement;
      syncNavigation(true);
      closeButton.focus();
    };

    const trapFocus = (event) => {
      if (event.key !== "Tab" || !nav.classList.contains("is-open")) return;
      const focusable = [...nav.querySelectorAll(focusableSelector)].filter((element) => !element.hidden);
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    openButton.addEventListener("click", open);
    closeButton.addEventListener("click", close);
    backdrop.addEventListener("click", close);
    nav.addEventListener("keydown", trapFocus);
    nav.addEventListener("click", (event) => {
      if (event.target.closest("a") && window.matchMedia("(max-width: 71.99rem)").matches) close();
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") close();
    });
    desktopQuery.addEventListener("change", () => syncNavigation(false));
    syncNavigation(false);
  };

  const setupSearch = () => {
    const dialog = document.querySelector("[data-search-dialog]");
    const input = dialog?.querySelector("[data-global-search]");
    const status = dialog?.querySelector("[data-search-status]");
    const results = dialog?.querySelector("[data-search-results]");
    let entries = dialog ? [...dialog.querySelectorAll("[data-search-entry]")] : [];
    const openButtons = [...document.querySelectorAll("[data-search-open]")];
    const closeButton = dialog?.querySelector("[data-search-close]");
    if (!dialog || !input || !status || !entries.length) return;

    let returnFocus = null;

    const filter = () => {
      const tokens = normalize(input.value).split(/\s+/).filter(Boolean);
      let visible = 0;
      entries.forEach((entry) => {
        const haystack = normalize(entry.dataset.searchText);
        const matches = tokens.every((token) => haystack.includes(token));
        entry.hidden = !matches;
        if (matches) visible += 1;
      });
      status.textContent = tokens.length
        ? `${visible.toLocaleString("ko-KR")}개를 찾았습니다.`
        : `데이터 표와 낱장 ${entries.length.toLocaleString("ko-KR")}개`;
    };

    // 개체 낱장은 검색을 열 때 한 번만 내려받는다. 실패해도 표 검색은 그대로 쓸 수 있다.
    let indexLoaded = false;
    const loadEntities = async () => {
      if (indexLoaded || !results) return;
      indexLoaded = true;
      const baseurl = String(document.body.dataset.baseurl || "").replace(/\/+$/, "");
      try {
        const payload = await fetch(`${baseurl}/assets/entity-index.json`).then((response) => {
          if (!response.ok) throw new Error(String(response.status));
          return response.json();
        });
        const fragment = document.createDocumentFragment();
        for (const entry of payload.entries) {
          const link = document.createElement("a");
          link.className = "search-result";
          link.href = `${baseurl}${entry.url}`;
          link.dataset.searchEntry = "";
          link.dataset.searchText = `${entry.name} ${entry.kind} ${entry.meta}`;
          link.innerHTML = `<span><strong></strong><small></small></span><span class="search-result__meta"></span>`;
          link.querySelector("strong").textContent = entry.name;
          link.querySelector("small").textContent = entry.kind;
          link.querySelector(".search-result__meta").textContent = entry.meta;
          fragment.appendChild(link);
        }
        results.appendChild(fragment);
        entries = [...dialog.querySelectorAll("[data-search-entry]")];
        filter();
      } catch {
        indexLoaded = false;
      }
    };

    const open = () => {
      loadEntities();
      returnFocus = document.activeElement;
      if (typeof dialog.showModal === "function") dialog.showModal();
      else dialog.setAttribute("open", "");
      requestAnimationFrame(() => input.focus());
    };

    const close = () => {
      if (!dialog.open) return;
      if (typeof dialog.close === "function") dialog.close();
      else dialog.removeAttribute("open");
    };

    openButtons.forEach((button) => button.addEventListener("click", open));
    closeButton?.addEventListener("click", close);
    input.addEventListener("input", filter);
    dialog.addEventListener("click", (event) => {
      if (event.target === dialog) close();
    });
    dialog.addEventListener("close", () => returnFocus?.focus());
    dialog.addEventListener("cancel", (event) => {
      event.preventDefault();
      close();
    });

    document.addEventListener("keydown", (event) => {
      const target = event.target;
      const isTyping = target instanceof HTMLInputElement
        || target instanceof HTMLTextAreaElement
        || target instanceof HTMLSelectElement
        || target?.isContentEditable;
      if (event.key === "/" && !isTyping && !event.metaKey && !event.ctrlKey && !event.altKey) {
        event.preventDefault();
        open();
      }
    });
  };

  const setupBackToTop = () => {
    const button = document.querySelector("[data-back-to-top]");
    if (!button) return;

    let ticking = false;
    const update = () => {
      button.classList.toggle("is-visible", window.scrollY > 680);
      ticking = false;
    };

    window.addEventListener("scroll", () => {
      if (!ticking) {
        window.requestAnimationFrame(update);
        ticking = true;
      }
    }, { passive: true });

    button.addEventListener("click", () => {
      window.scrollTo({
        top: 0,
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth"
      });
    });
    update();
  };

  setupNavigation();
  setupSearch();
  setupBackToTop();
})();
