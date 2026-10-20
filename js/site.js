/* Public site behaviour.
   Portfolio items live in /portfolio_data.json so new work can be added
   without editing HTML. Each item:
   {
     id, client, title, category, image, alt, summary,
     featured?: boolean, href?: string
   }
   category is one of: branding, print, web, campaigns
*/
(function () {
  const navToggle = document.getElementById("nav-toggle");
  const nav = document.getElementById("site-nav");
  if (navToggle && nav) {
    const sync = () => navToggle.setAttribute("aria-expanded", navToggle.checked ? "true" : "false");
    navToggle.addEventListener("change", sync);
    nav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        navToggle.checked = false;
        sync();
      });
    });
    sync();
  }

  const year = document.getElementById("year");
  if (year) year.textContent = String(new Date().getFullYear());

  document.querySelectorAll("form[data-whatsapp]").forEach(bindForm);

  const grid = document.getElementById("folio-grid");
  if (grid) initPortfolio(grid);

  function bindForm(form) {
    const status = form.querySelector("[data-status]");
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      if (status) status.textContent = "";
      const honey = form.querySelector(".hp input");
      if (honey && honey.value) return;

      const invalid = [...form.querySelectorAll("[required]")].find((field) => !field.checkValidity());
      if (invalid) {
        invalid.focus();
        if (status) status.textContent = "Please complete the highlighted fields.";
        invalid.reportValidity();
        return;
      }

      const data = new FormData(form);
      const lines = [];
      const labels = {
        name: "Name",
        email: "Email",
        phone: "Phone",
        organisation: "Organisation",
        service: "Need",
        timing: "Timing",
        budget: "Budget",
        message: "Message"
      };
      Object.keys(labels).forEach((key) => {
        const value = String(data.get(key) || "").trim();
        if (value) lines.push(labels[key] + ": " + value);
      });
      const intro = form.dataset.whatsapp === "brief"
        ? "Hello Dubani Creatives, I would like to book a free consultation."
        : "Hello Dubani Creatives, I would like to enquire about a project.";
      const text = intro + "\n\n" + lines.join("\n");
      const url = "https://wa.me/27733464805?text=" + encodeURIComponent(text);
      if (status) {
        status.textContent = "Opening WhatsApp with your message. If it does not open, email dubanicreatives@gmail.com.";
      }
      window.open(url, "_blank", "noopener");
    });
  }

  function initPortfolio(gridEl) {
    const filters = document.getElementById("folio-filters");
    const status = document.getElementById("folio-status");
    const dialog = document.getElementById("lightbox");
    const lbImg = document.getElementById("lb-img");
    const lbCaption = document.getElementById("lb-caption");
    let items = [];
    let visible = [];
    let active = "all";
    let index = 0;

    fetch("/portfolio_data.json")
      .then((response) => {
        if (!response.ok) throw new Error("Could not load work");
        return response.json();
      })
      .then((data) => {
        items = Array.isArray(data) ? data : [];
        if (!items.length) throw new Error("No work listed");
        render();
      })
      .catch(() => {
        if (status) status.textContent = "The work grid could not be loaded. You can still view projects on Behance.";
      });

    if (filters) {
      filters.addEventListener("click", (event) => {
        const button = event.target.closest("button[data-filter]");
        if (!button) return;
        active = button.dataset.filter;
        filters.querySelectorAll("button").forEach((btn) => {
          btn.setAttribute("aria-pressed", btn === button ? "true" : "false");
        });
        render();
      });
    }

    function render() {
      visible = items.filter((item) => active === "all" || item.category === active);
      if (status) {
        status.textContent = visible.length ? "" : "Nothing in this category yet.";
      }
      gridEl.innerHTML = visible.map((item, i) => card(item, i)).join("");
    }

    function card(item, i) {
      const caseLink = item.href
        ? '<a class="folio-case" href="' + esc(item.href) + '">Read the case study</a>'
        : "";
      const fit = item.fit === "contain" ? " contain" : "";
      return (
        '<article class="folio-card">' +
          '<button type="button" class="folio-open" data-index="' + i + '">' +
            '<img class="' + fit.trim() + '" src="' + esc(encodeURI(item.image)) + '" alt="' + esc(item.alt || item.title) + '" width="' + Number(item.width || 800) + '" height="' + Number(item.height || 600) + '" loading="lazy">' +
          "</button>" +
          '<p class="folio-kicker">' + esc(item.client) + "</p>" +
          "<h3>" + esc(item.title) + "</h3>" +
          '<p class="summary">' + esc(item.summary || "") + "</p>" +
          caseLink +
        "</article>"
      );
    }

    gridEl.addEventListener("click", (event) => {
      const button = event.target.closest(".folio-open");
      if (!button || !dialog) return;
      open(Number(button.dataset.index));
    });

    function open(i) {
      index = i;
      const item = visible[index];
      if (!item) return;
      lbImg.src = encodeURI(item.image);
      lbImg.alt = item.alt || item.title;
      lbCaption.textContent = item.client + " — " + item.title;
      if (typeof dialog.showModal === "function") dialog.showModal();
      else dialog.setAttribute("open", "");
    }

    function step(delta) {
      if (!visible.length) return;
      open((index + delta + visible.length) % visible.length);
    }

    document.getElementById("lb-prev")?.addEventListener("click", () => step(-1));
    document.getElementById("lb-next")?.addEventListener("click", () => step(1));
    document.getElementById("lb-close")?.addEventListener("click", () => dialog.close());
  }

  function esc(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, (ch) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    }[ch]));
  }
})();
