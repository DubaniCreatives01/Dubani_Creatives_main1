// Dubani Creatives - Core Interactive Application
document.addEventListener('DOMContentLoaded', () => {

  // ==========================================================================
  // 1. Mobile Sidebar Drawer Toggle & Backdrop
  // ==========================================================================
  const mobileMenuBtn = document.getElementById('mobile-menu-btn');
  const sidebar = document.getElementById('site-sidebar');
  const backdrop = document.getElementById('sidebar-backdrop');

  function openSidebar() {
    sidebar?.classList.add('open');
    backdrop?.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeSidebar() {
    sidebar?.classList.remove('open');
    backdrop?.classList.remove('active');
    document.body.style.overflow = '';
  }

  mobileMenuBtn?.addEventListener('click', openSidebar);
  backdrop?.addEventListener('click', closeSidebar);

  // Close sidebar on navigation item click (mobile screens)
  document.querySelectorAll('.sidebar-nav-item').forEach(link => {
    link.addEventListener('click', () => {
      if (window.innerWidth <= 768) {
        closeSidebar();
      }
    });
  });

  // ==========================================================================
  // 2. Animated Smooth Scrolling with Offset Calculation
  // ==========================================================================
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      if (!targetId || targetId === '#') return;
      const targetEl = document.querySelector(targetId);
      if (targetEl) {
        e.preventDefault();
        const headerOffset = 70;
        const elementPosition = targetEl.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });

        // Update URL hash without jump
        if (history.pushState) {
          history.pushState(null, null, targetId);
        }
      }
    });
  });

  // ==========================================================================
  // 3. Scroll-Spy for Sidebar Navigation & Top Bar Indicator
  // ==========================================================================
  const sections = document.querySelectorAll('section.page-section[id]');
  const navItems = document.querySelectorAll('.sidebar-nav-item[data-section]');
  const panelIndicator = document.getElementById('panel-indicator');

  const panelLabels = {
    home: '01. HOME',
    work: '02. WORK',
    services: '03. SERVICES',
    about: '04. ABOUT',
    packages: '05. PACKAGES',
    contact: '06. CONTACT'
  };

  function updateScrollSpy() {
    if (!sections.length) return;
    let currentId = 'home';
    const scrollPos = window.scrollY + 140;

    sections.forEach(sec => {
      const top = sec.offsetTop;
      const height = sec.offsetHeight;
      if (scrollPos >= top && scrollPos < top + height) {
        currentId = sec.getAttribute('id');
      }
    });

    if (currentId) {
      navItems.forEach(item => {
        item.classList.toggle('active', item.dataset.section === currentId);
      });

      if (panelIndicator && panelLabels[currentId]) {
        panelIndicator.textContent = panelLabels[currentId];
      }
    }
  }

  window.addEventListener('scroll', updateScrollSpy, { passive: true });
  updateScrollSpy();

  // ==========================================================================
  // 4. Packages & Process Tab Toggle
  // ==========================================================================
  const packageTabs = document.querySelectorAll('.package-tab-btn');
  const packagesGrid = document.getElementById('packages-tier-grid');
  const processGrid = document.getElementById('process-steps-row');

  packageTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      packageTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const target = tab.dataset.tab;

      if (target === 'packages') {
        if (packagesGrid) packagesGrid.style.display = 'grid';
        if (processGrid) processGrid.style.display = 'none';
      } else {
        if (packagesGrid) packagesGrid.style.display = 'none';
        if (processGrid) processGrid.style.display = 'grid';
      }
    });
  });

  // ==========================================================================
  // 5. Case Studies Filter Dropdown
  // ==========================================================================
  const filterDropdown = document.getElementById('case-filter-dropdown');
  if (filterDropdown) {
    filterDropdown.addEventListener('change', (e) => {
      const cat = e.target.value;
      const cards = document.querySelectorAll('.case-card[data-category]');
      cards.forEach(card => {
        if (cat === 'all' || card.dataset.category.includes(cat)) {
          card.style.display = 'flex';
        } else {
          card.style.display = 'none';
        }
      });
    });
  }

  // ==========================================================================
  // 6. Interactive Case Study Modal Lightbox
  // ==========================================================================
  const caseModal = document.getElementById('case-modal');
  const caseModalContent = document.getElementById('case-modal-body');
  const caseModalClose = document.getElementById('case-modal-close');

  const caseData = {
    fcichs: {
      title: 'Foundation Community Initiative (FCICHS)',
      tags: 'Brand Identity • Company Profile • Social Housing',
      desc: 'Corporate visual identity, official multi-page company capability profile, residential development portfolio booklets, and digital application portals designed for a premier Western Cape social housing and community health organisation.',
      image: 'images/Portfolio/Brochure/FCI Company Profile_1771002467429.webp'
    },
    kct: {
      title: 'Khayelitsha Community Trust (KCT)',
      tags: 'Annual Reports • Stationery • Digital Platform',
      desc: 'Four consecutive editions of audited Annual Reports, official dual-language corporate calendars (English & isiXhosa), graduate achievement certificates, conference identity collaterals, and community development web portals.',
      image: 'images/Portfolio/Brochure/KCT Annual report 4_1771002840899.webp'
    },
    luzana: {
      title: 'LUZANA Consulting Holdings',
      tags: 'Brand Identity • Print • Corporate',
      desc: 'A prestigious visual identity system, corporate stationery, and digital presence designed for a premier African management consultancy and advisory firm.',
      image: 'images/Portfolio/Branding/LUZANA Consulting Holdings/495131422_1276640777802763_8756452767998894368_n.jpg'
    },
    dream: {
      title: 'Dream Area Creative Platform',
      tags: 'Branding • Digital Experience • Community',
      desc: 'Vibrant cultural and community lifestyle branding centered on human potential, spatial storytelling, and expressive modern visual systems.',
      image: 'images/imgi_13_68bd341e34845d434f3fb083_1.png'
    },
    star: {
      title: 'Star Blox Studio',
      tags: 'Brand Identity • Gaming & Web • Art Direction',
      desc: 'An energetic and futuristic visual identity system for an interactive gaming platform empowering creators and players through world-building.',
      image: 'images/imgi_14_68bd33e0e57b111749f34daf_0.png'
    },
    ingelosi: {
      title: 'INGELOSI Employment Law',
      tags: 'Legal Identity • Stationery • Branding',
      desc: 'Authoritative, trustworthy legal brand architecture, business stationery, and professional collateral engineered for corporate legal representation.',
      image: 'images/Portfolio/Branding/INGELOSI/INGELOSI Employment Law_1771003275551.webp'
    },
    cashwave: {
      title: 'CashWave Short-Term Finance',
      tags: 'Brand Identity • FinTech • Print Rollout',
      desc: 'Complete corporate visual identity system, brand mark, credit stationery, and marketing collateral designed for a modern South African short-term finance provider.',
      image: 'images/Portfolio/Branding/5/CashWave Branding 3_1771002250185.webp'
    },
    iraza: {
      title: 'IRAZA Footwear Packaging',
      tags: 'Packaging Design • Product Box & Label',
      desc: 'Premium packaging design, shoe box architecture, custom labels, and retail display assets crafted for a contemporary South African footwear brand.',
      image: 'images/Portfolio/Packaging/IRAZA footwear package design_1771003502648.jpg'
    },
  };

  document.querySelectorAll('[data-case]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const id = btn.dataset.case;
      const data = caseData[id];
      if (data && caseModal && caseModalContent) {
        caseModalContent.innerHTML = `
          <div style="margin-bottom:18px;border-radius:12px;overflow:hidden;max-height:360px;background:#0d1117;">
            <img src="${data.image}" alt="${data.title}" style="width:100%;height:100%;object-fit:cover;display:block;" />
          </div>
          <p style="font-size:12px;color:var(--accent-orange, #ff6324);font-weight:700;letter-spacing:0.06em;text-transform:uppercase;margin-bottom:6px">${data.tags}</p>
          <h2 style="font-family:'Outfit',sans-serif;font-size:24px;color:#fff;margin-bottom:12px">${data.title}</h2>
          <p style="font-size:14px;color:#8e9fb5;line-height:1.6;margin-bottom:22px">${data.desc}</p>
          <div style="display:flex;gap:12px;flex-wrap:wrap;">
            <a href="#contact" class="btn-primary" onclick="document.getElementById('case-modal').classList.remove('active')">Start a project like this →</a>
            <a href="projects.html" class="btn-ghost">View all projects (50+) →</a>
          </div>
        `;
        caseModal.classList.add('active');
      }
    });
  });

  caseModalClose?.addEventListener('click', () => {
    caseModal?.classList.remove('active');
  });

  caseModal?.addEventListener('click', (e) => {
    if (e.target === caseModal) caseModal.classList.remove('active');
  });

  // ==========================================================================
  // 7. APPS Password Protection Modal & Apps Sidebar (PIN: 4664)
  // ==========================================================================
  const APPS_PIN = "4664";
  const appsSidebar = document.getElementById('apps-sidebar');
  const appsOverlay = document.getElementById('apps-sidebar-overlay');
  const appsCloseBtn = document.getElementById('sidebar-close');
  const sidebarAppsLink = document.getElementById('sidebar-apps-link');

  const createAppsModal = () => {
    if (document.getElementById('apps-pass-modal')) return;

    const modalOverlay = document.createElement('div');
    modalOverlay.id = 'apps-pass-modal';
    modalOverlay.className = 'apps-pass-modal-overlay';
    modalOverlay.innerHTML = `
      <div class="apps-pass-modal-card" id="apps-pass-card">
        <div class="apps-pass-icon">🔒</div>
        <h3 class="apps-pass-title">Dubani Apps Locked</h3>
        <p class="apps-pass-desc">Please enter PIN to access internal Dubani tools.</p>
        <div class="apps-pass-input-wrapper">
          <input type="password" id="apps-pass-input" class="apps-pass-input" placeholder="••••" maxlength="10" autocomplete="off" />
        </div>
        <div class="apps-pass-error" id="apps-pass-error"></div>
        <div class="apps-pass-actions">
          <button type="button" class="apps-pass-btn-cancel" id="apps-pass-cancel">Cancel</button>
          <button type="button" class="apps-pass-btn-submit" id="apps-pass-submit">Unlock APPS</button>
        </div>
      </div>
    `;
    document.body.appendChild(modalOverlay);

    const card = document.getElementById('apps-pass-card');
    const input = document.getElementById('apps-pass-input');
    const errorEl = document.getElementById('apps-pass-error');
    const cancelBtn = document.getElementById('apps-pass-cancel');
    const submitBtn = document.getElementById('apps-pass-submit');

    let onUnlockSuccess = null;

    window.openAppsPasswordModal = (callback) => {
      onUnlockSuccess = callback;
      errorEl.textContent = '';
      input.value = '';
      modalOverlay.classList.add('active');
      setTimeout(() => input.focus(), 150);
    };

    const closePassModal = () => {
      modalOverlay.classList.remove('active');
      errorEl.textContent = '';
      input.value = '';
    };

    const verifyPass = () => {
      const entered = input.value.trim();
      if (entered === APPS_PIN) {
        closePassModal();
        if (onUnlockSuccess) onUnlockSuccess();
      } else {
        errorEl.textContent = '❌ Incorrect PIN. Access denied.';
        card.classList.remove('shake');
        void card.offsetWidth;
        card.classList.add('shake');
        input.value = '';
        input.focus();
      }
    };

    submitBtn?.addEventListener('click', verifyPass);
    cancelBtn?.addEventListener('click', closePassModal);
    input?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') verifyPass();
      if (e.key === 'Escape') closePassModal();
    });
    modalOverlay.addEventListener('click', (e) => {
      if (e.target === modalOverlay) closePassModal();
    });
  };

  createAppsModal();

  function openAppsSidebar() {
    if (appsSidebar) appsSidebar.classList.add('active');
    if (appsOverlay) appsOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeAppsSidebar() {
    if (appsSidebar) appsSidebar.classList.remove('active');
    if (appsOverlay) appsOverlay.classList.remove('active');
    document.body.style.overflow = '';
  }

  sidebarAppsLink?.addEventListener('click', (e) => {
    e.preventDefault();
    if (window.innerWidth <= 768) closeSidebar();
    if (window.openAppsPasswordModal) {
      window.openAppsPasswordModal(() => {
        openAppsSidebar();
      });
    }
  });

  appsCloseBtn?.addEventListener('click', closeAppsSidebar);
  appsOverlay?.addEventListener('click', closeAppsSidebar);

  // ==========================================================================
  // 8. Contact Form Submission (WhatsApp Integration)
  // ==========================================================================
  const contactForm = document.getElementById('contact-form');
  contactForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('contact-name')?.value || '';
    const email = document.getElementById('contact-email')?.value || '';
    const project = document.getElementById('contact-project')?.value || '';
    const message = document.getElementById('contact-message')?.value || '';

    const waText = `Hi Dubani Creatives! My name is ${name} (${email}). I'm interested in: ${project}.\n\nProject Details:\n${message}`;
    const waUrl = `https://wa.me/27612481113?text=${encodeURIComponent(waText)}`;

    const submitBtn = contactForm.querySelector('button[type="submit"]');
    if (submitBtn) {
      submitBtn.innerHTML = 'Connecting to WhatsApp...';
      submitBtn.style.background = '#25D366';
      submitBtn.style.borderColor = '#25D366';
    }

    setTimeout(() => {
      window.open(waUrl, '_blank', 'noopener,noreferrer');
      if (submitBtn) {
        submitBtn.innerHTML = 'Message Sent! Thank you.';
      }
    }, 400);
  });

  // ==========================================================================
  // 9. Live Weather & Time Glass Widget Engine (Cape Town, SAST)
  // ==========================================================================
  function initLiveClockAndWeather() {
    const clockEl = document.getElementById('weather-clock');
    const dateEl = document.getElementById('weather-date');
    const tempEl = document.getElementById('weather-temp');
    const conditionEl = document.getElementById('weather-condition');
    const iconEl = document.getElementById('weather-icon');
    const humidityEl = document.getElementById('weather-humidity');
    const windEl = document.getElementById('weather-wind');

    // Update Digital Clock Every Second (SAST - Africa/Johannesburg)
    function updateClock() {
      const now = new Date();
      if (clockEl) {
        clockEl.textContent = now.toLocaleTimeString('en-ZA', {
          timeZone: 'Africa/Johannesburg',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true
        });
      }
      if (dateEl) {
        dateEl.textContent = now.toLocaleDateString('en-ZA', {
          timeZone: 'Africa/Johannesburg',
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        });
      }
    }

    updateClock();
    setInterval(updateClock, 1000);

    // Weather Code to Readable Description and Icon
    function getWeatherMeta(code) {
      if (code === 0) return { text: 'Clear Sky', icon: '☀️' };
      if (code === 1 || code === 2) return { text: 'Partly Cloudy', icon: '⛅' };
      if (code === 3) return { text: 'Overcast', icon: '☁️' };
      if ([45, 48].includes(code)) return { text: 'Misty / Fog', icon: '🌫️' };
      if ([51, 53, 55, 61, 63, 65].includes(code)) return { text: 'Light Rain', icon: '🌦️' };
      if ([80, 81, 82].includes(code)) return { text: 'Rain Showers', icon: '🌧️' };
      if ([95, 96, 99].includes(code)) return { text: 'Thunderstorm', icon: '⛈️' };
      return { text: 'Coastal Breeze', icon: '🌤️' };
    }

    // Fetch live weather from Open-Meteo API for Cape Town (-33.9249, 18.4241)
    async function fetchCapeTownWeather() {
      try {
        const res = await fetch('https://api.open-meteo.com/v1/forecast?latitude=-33.9249&longitude=18.4241&current_weather=true&hourly=relativehumidity_2m');
        if (!res.ok) throw new Error('Network error');
        const data = await res.json();
        const current = data.current_weather;
        if (current) {
          const temp = Math.round(current.temperature);
          const wind = Math.round(current.windspeed);
          const meta = getWeatherMeta(current.weathercode);

          // Get approximate current hour humidity
          let humidity = 64;
          if (data.hourly && data.hourly.relativehumidity_2m && data.hourly.relativehumidity_2m.length) {
            const currentHour = new Date().getHours();
            humidity = data.hourly.relativehumidity_2m[currentHour] || 64;
          }

          if (tempEl) tempEl.textContent = `${temp}°C`;
          if (conditionEl) conditionEl.textContent = meta.text;
          if (iconEl) iconEl.textContent = meta.icon;
          if (humidityEl) humidityEl.textContent = `${humidity}%`;
          if (windEl) windEl.textContent = `${wind} km/h`;
        }
      } catch (err) {
        // Fallback realistic Cape Town climate
        if (tempEl && tempEl.textContent === '--°C') tempEl.textContent = '19°C';
        if (conditionEl && conditionEl.textContent === 'Loading...') conditionEl.textContent = 'Partly Cloudy';
        if (iconEl && iconEl.textContent === '🌤️') iconEl.textContent = '⛅';
        if (humidityEl && humidityEl.textContent === '--%') humidityEl.textContent = '62%';
        if (windEl && windEl.textContent === '-- km/h') windEl.textContent = '14 km/h';
      }
    }

    fetchCapeTownWeather();
    // Refresh weather every 15 minutes
    setInterval(fetchCapeTownWeather, 15 * 60 * 1000);
  }

  initLiveClockAndWeather();

});
