// Dubani Creatives - Core Interactive Application
document.addEventListener('DOMContentLoaded', () => {
  // Mobile Sidebar Drawer Toggle
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

  // Close sidebar on navigation item click (mobile)
  document.querySelectorAll('.sidebar-nav-item').forEach(link => {
    link.addEventListener('click', () => {
      if (window.innerWidth <= 768) {
        closeSidebar();
      }
    });
  });

  // Animated Smooth Scrolling with Offset Calculation
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#' || targetId === '') return;
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
        history.pushState(null, null, targetId);
      }
    });
  });

  // Scroll-Spy for Sidebar Navigation
  const sections = document.querySelectorAll('section[id]');
  const navItems = document.querySelectorAll('.sidebar-nav-item[data-section]');

  function updateScrollSpy() {
    if (!sections.length || !navItems.length) return;
    let currentId = '';
    const scrollPos = window.scrollY + 120;

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
    }
  }

  window.addEventListener('scroll', updateScrollSpy, { passive: true });
  updateScrollSpy();

  // Packages & Process Tab Toggle
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

  // Case Studies Filter Dropdown
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

  // Interactive Case Study Modal Lightbox
  const caseModal = document.getElementById('case-modal');
  const caseModalContent = document.getElementById('case-modal-body');
  const caseModalClose = document.getElementById('case-modal-close');

  const caseData = {
    luzana: {
      title: 'LUZANA Consulting',
      tags: 'Brand Identity · Print · Digital',
      desc: 'A full visual identity, corporate stationery system, typography hierarchy, and branded digital assets designed for a high-growth South African management consultancy firm.',
      image: 'images/case_luzana.jpg'
    },
    dream: {
      title: 'Dream Area',
      tags: 'Branding · Social Content · Campaign',
      desc: 'Vibrant cultural and community lifestyle branding centered on human potential, spatial storytelling, and expressive modern visual systems.',
      image: 'images/case_dream_area.jpg'
    },
    star: {
      title: 'Star Blox',
      tags: 'Brand Identity · Web · Campaign',
      desc: 'A playful and futuristic brand identity system for an interactive educational learning platform empowering children through creativity and building.',
      image: 'images/case_star_blox.jpg'
    },
    various: {
      title: 'Various Studio Projects',
      tags: 'Print · Campaign · Social Content',
      desc: 'A curated selection of packaging, apparel mockups, editorial print, and high-impact social media assets developed for local and international brands.',
      image: 'images/case_various.jpg'
    }
  };

  document.querySelectorAll('[data-case]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const id = btn.dataset.case;
      const data = caseData[id];
      if (data && caseModal && caseModalContent) {
        caseModalContent.innerHTML = `
          <div style="margin-bottom:16px;border-radius:8px;overflow:hidden;max-height:360px">
            <img src="${data.image}" alt="${data.title}" style="width:100%;height:100%;object-fit:cover" />
          </div>
          <p style="font-size:11px;color:#00d2ff;font-weight:700;margin-bottom:6px">${data.tags}</p>
          <h2 style="font-family:'Outfit',sans-serif;font-size:24px;color:#fff;margin-bottom:10px">${data.title}</h2>
          <p style="font-size:13.5px;color:#8e9fb5;line-height:1.6;margin-bottom:20px">${data.desc}</p>
          <a href="#contact" class="btn-primary" onclick="document.getElementById('case-modal').classList.remove('active')">Start a project like this →</a>
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

  // Contact Form Submission (WhatsApp Direct + Form Handling)
  const contactForm = document.getElementById('contact-form');
  contactForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('contact-name')?.value || '';
    const email = document.getElementById('contact-email')?.value || '';
    const project = document.getElementById('contact-project')?.value || '';
    const message = document.getElementById('contact-message')?.value || '';

    const waText = `Hi Dubani Creatives! My name is ${name} (${email}). I am interested in: ${project}.\n\nProject Details:\n${message}`;
    const waUrl = `https://api.whatsapp.com/send?phone=27711234567&text=${encodeURIComponent(waText)}`;

    // Show success confirmation
    const submitBtn = contactForm.querySelector('button[type="submit"]');
    if (submitBtn) {
      submitBtn.innerHTML = 'Opening WhatsApp...';
      submitBtn.style.background = '#25D366';
      submitBtn.style.borderColor = '#25D366';
    }

    setTimeout(() => {
      window.open(waUrl, '_blank', 'noopener');
      if (submitBtn) {
        submitBtn.innerHTML = 'Message Sent! Thank you.';
      }
    }, 600);
  });
});
