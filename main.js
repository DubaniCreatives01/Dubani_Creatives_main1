document.addEventListener("DOMContentLoaded", () => {
    // Environment Switcher Logic
    const initEnvironment = () => {
        const savedEnv = localStorage.getItem('environment') || 'business';
        const body = document.body;
        
        if (savedEnv === 'personal') {
            body.classList.add('is-personal');
        } else {
            body.classList.remove('is-personal');
        }

        // Delay updating UI slightly to ensure DOM is ready
        setTimeout(() => {
            const btns = document.querySelectorAll('.env-switch-btn');
            btns.forEach(btn => {
                if (btn.dataset.env === savedEnv) {
                    btn.classList.add('active');
                } else {
                    btn.classList.remove('active');
                }
            });

            // Add event listeners
            btns.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    // Prevent multiple bindings if initEnvironment called again
                    const targetEnv = e.target.dataset.env;
                    if (localStorage.getItem('environment') === targetEnv) return;

                    localStorage.setItem('environment', targetEnv);
                    
                    if (targetEnv === 'personal') {
                        body.classList.add('is-personal');
                    } else {
                        body.classList.remove('is-personal');
                    }

                    // Update active class
                    btns.forEach(b => b.classList.remove('active'));
                    e.target.classList.add('active');
                    
                    // Re-trigger scrollTrigger calculations if layout changed
                    if(typeof ScrollTrigger !== 'undefined') ScrollTrigger.refresh();
                });
            });
        }, 0);
    };

    initEnvironment();

    // --- Dark/Light Mode Toggle ---
    const initThemeToggle = () => {
        const toggle = document.querySelector('.theme-toggle-track');
        if (!toggle) return;

        const swapLogos = (isLight) => {
            const logos = document.querySelectorAll('.header-logo img');
            logos.forEach(logo => {
                if (isLight) {
                    logo.src = logo.src.replace('logo.png', 'logo1.png');
                } else {
                    logo.src = logo.src.replace('logo1.png', 'logo.png');
                }
            });
        };

        const savedTheme = localStorage.getItem('theme') || 'dark';
        if (savedTheme === 'light') {
            document.body.classList.add('light-mode');
            swapLogos(true);
        }

        const toggleTheme = () => {
            document.body.classList.toggle('light-mode');
            const isLight = document.body.classList.contains('light-mode');
            localStorage.setItem('theme', isLight ? 'light' : 'dark');
            swapLogos(isLight);
        };

        toggle.addEventListener('click', toggleTheme);
        toggle.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                toggleTheme();
            }
        });
    };

    initThemeToggle();

    // Initialize Lenis for smooth scrolling (Desktop Only)
    let lenis;
    if (window.innerWidth >= 992) {
        lenis = new Lenis({
            duration: 1.2,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        });

        function raf(time) {
            if (lenis) lenis.raf(time);
            requestAnimationFrame(raf);
        }
        requestAnimationFrame(raf);
    }

    gsap.registerPlugin(ScrollTrigger);
    // Initial State Settings
    gsap.set(".title-one", { width: "0%" });
    gsap.set(".title-two", { width: "0%" });
    gsap.set(".hero-right", { opacity: 0, y: 30 });
    gsap.set(".hero-center", { opacity: 1 });
    gsap.set(".banner-item", { opacity: 0, y: 20 });
    gsap.set(".main-header", { y: -100 });

    // Header Slide Down
    gsap.to(".main-header", {
        y: 0,
        duration: 1,
        ease: "power3.out",
        delay: 0.2
    });

    // Initial reveal for text and banners (accelerated for instant load feel)
    gsap.to(".hero-right", {
        opacity: 1,
        y: 0,
        duration: 0.8,
        delay: 0.4,
        ease: "power3.out"
    });

    gsap.to(".banner-item", {
        opacity: 1,
        y: 0,
        duration: 0.6,
        delay: 0.6,
        stagger: 0.08,
        ease: "power2.out"
    });

    // Personal Hero Title Animation (original behavior)
    const titleTl = gsap.timeline({
        repeat: -1,
        delay: 0.2
    });

    titleTl.to(".title-one", {
        width: "100%",
        duration: 1.0,
        ease: "power4.inOut"
    })
    .to(".title-one", {
        width: "0%",
        duration: 1.0,
        ease: "power4.inOut",
        delay: 2.5
    })
    .to(".title-two", {
        width: "100%",
        duration: 1.0,
        ease: "power4.inOut",
        delay: 0.1
    })
    .to(".title-two", {
        width: "0%",
        duration: 1.0,
        ease: "power4.inOut",
        delay: 2.5
    });

    // Business Hero Title Animation — text rotator in same position
    const bizTitleTl = gsap.timeline({
        repeat: -1,
        delay: 0.3
    });

    bizTitleTl
    // Title 1 slides up into view
    .to(".biz-title-1", {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: "power3.out"
    })
    // Hold title 1
    .to({}, { duration: 2.5 })
    // Title 1 slides up and out
    .to(".biz-title-1", {
        opacity: 0,
        y: "-100%",
        duration: 0.8,
        ease: "power3.in"
    })
    // Title 2 slides up into view
    .to(".biz-title-2", {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: "power3.out"
    })
    // Hold title 2
    .to({}, { duration: 2.5 })
    // Title 2 slides up and out
    .to(".biz-title-2", {
        opacity: 0,
        y: "-100%",
        duration: 0.8,
        ease: "power3.in"
    })
    // Reset both positions for next loop
    .set(".biz-title-1", { y: "100%" })
    .set(".biz-title-2", { y: "100%" });


    // Marquee Infinite Animation
    const marqueeTrack = document.querySelector(".marquee-track");
    if(marqueeTrack) {
        // Find half the width so we can loop seamlessly
        // We know we duplicated the 5 items, so total items is 10
        // The animation will translate from 0 to -50%
        gsap.to(marqueeTrack, {
            xPercent: -50,
            ease: "none",
            duration: 20,
            repeat: -1
        });
    }

    // Scroll header background transition disabled by user request

    // --- Scroll Animations for new sections ---

    // Desktop-only Scroll Parallax animations to save mobile CPU/battery
    const mm = gsap.matchMedia();
    mm.add("(min-width: 992px)", () => {
        // Hero Section Parallax 
        gsap.to(".hero-bg-img", {
            yPercent: 30,
            scale: 1.1,
            ease: "none",
            scrollTrigger: {
                trigger: ".hero-section",
                start: "top top",
                end: "bottom top",
                scrub: true
            }
        });

        gsap.to(".hero-content, .banner-list-container", {
            y: -100,
            opacity: 0,
            ease: "none",
            scrollTrigger: {
                trigger: ".hero-section",
                start: "top top",
                end: "bottom top",
                scrub: true
            }
        });
    });

    // Fade up sections universally
    const fadeUpSections = gsap.utils.toArray(".section-top");
    fadeUpSections.forEach(section => {
        gsap.from(section, {
            scrollTrigger: {
                trigger: section,
                start: "top 85%",
                toggleActions: "play none none reverse"
            },
            y: 20,
            opacity: 0,
            duration: 0.6,
            ease: "power3.out"
        });
    });

    // Animated line dividers
    const dividerLines = gsap.utils.toArray(".section-divider-line");
    dividerLines.forEach(line => {
        gsap.to(line, {
            scaleX: 1,
            duration: 1.5,
            ease: "power3.inOut",
            scrollTrigger: {
                trigger: line,
                start: "top 95%",
                toggleActions: "play none none reverse"
            }
        });
    });

    // Gallery images stagger (Disabled for large gallery performance)
    /* 
    if (document.querySelector('.gallery-item')) {
        gsap.from(".gallery-item", {
            scrollTrigger: {
                trigger: ".project-section",
                start: "top 70%",
            },
            y: 60,
            opacity: 0,
            stagger: 0.05,
            duration: 0.5,
            ease: "power2.out"
        });
    }
    */

    // Project Blocks Parallax & fade
    const projectBlocks = gsap.utils.toArray(".project-block");
    projectBlocks.forEach(block => {
        const img = block.querySelector(".project-image");
        if(img) {
            mm.add("(min-width: 992px)", () => {
                gsap.set(img, { scale: 1.2, transformOrigin: "center center" });
                gsap.to(img, {
                    yPercent: 20,
                    ease: "none",
                    scrollTrigger: {
                        trigger: block,
                        start: "top bottom",
                        end: "bottom top",
                        scrub: true
                    }
                });
            });
        }
        
        gsap.from(block, {
            scrollTrigger: {
                trigger: block,
                start: "top 80%",
            },
            y: 30,
            opacity: 0,
            duration: 0.7,
            ease: "power3.out"
        });
    });

    // Approach section blocks stagger & parallax
    const approachBlocks = gsap.utils.toArray(".approach-big-block");
    approachBlocks.forEach(block => {
        const bg = block.querySelector(".approach-bg-image");
        if(bg) {
            mm.add("(min-width: 992px)", () => {
                gsap.set(bg, { scale: 1.2, transformOrigin: "center top" });
                gsap.to(bg, {
                    yPercent: 15,
                    ease: "none",
                    scrollTrigger: {
                        trigger: block,
                        start: "top bottom",
                        end: "bottom top",
                        scrub: true
                    }
                });
            });
        }
    });

    gsap.from(".approach-small-block, .approach-big-block", {
        scrollTrigger: {
            trigger: ".approach-section",
            start: "top 70%",
        },
        scale: 0.95,
        opacity: 0,
        stagger: 0.2,
        duration: 0.8,
        ease: "power2.out"
    });

    // Services stagger
    gsap.from(".service-block", {
        scrollTrigger: {
            trigger: ".service-section",
            start: "top 75%",
        },
        y: 50,
        opacity: 0,
        stagger: 0.15,
        duration: 0.8,
        ease: "power3.out"
    });

    // Process blocks
    gsap.from(".process-block", {
        scrollTrigger: {
            trigger: ".process-section",
            start: "top 75%",
        },
        y: 40,
        opacity: 0,
        stagger: 0.2,
        duration: 0.8,
        ease: "back.out(1.2)"
    });

    // Pricing Cards
    gsap.from(".pricing-card", {
        scrollTrigger: {
            trigger: ".pricing-section",
            start: "top 75%",
        },
        y: 40,
        opacity: 0,
        stagger: 0.2,
        duration: 0.8,
        ease: "power2.out"
    });

    // Contact Grid left and right
    gsap.from(".contact-left", {
        scrollTrigger: {
            trigger: ".contact-section",
            start: "top 80%"
        },
        x: -50,
        opacity: 0,
        duration: 0.8,
        ease: "power3.out"
    });
    
    gsap.from(".contact-form-box", {
        scrollTrigger: {
            trigger: ".contact-section",
            start: "top 80%"
        },
        x: 50,
        opacity: 0,
        duration: 0.8,
        ease: "power3.out"
    });

    // Skills Bars Animation
    const skillBars = gsap.utils.toArray(".skill-bar-fill");
    skillBars.forEach(bar => {
        const targetWidth = bar.getAttribute("data-width");
        gsap.to(bar, {
            scrollTrigger: {
                trigger: bar,
                start: "top 90%",
            },
            width: targetWidth,
            duration: 1.5,
            ease: "power3.out"
        });
    });

    // Skill Cards Stagger
    gsap.from(".skill-card", {
        scrollTrigger: {
            trigger: ".skills-grid",
            start: "top 85%",
        },
        y: 40,
        opacity: 0,
        stagger: 0.2,
        duration: 0.8,
        ease: "power2.out"
    });

    // Web Dev Cards Stagger
    gsap.from(".webdev-card", {
        scrollTrigger: {
            trigger: ".webdev-grid",
            start: "top 85%",
        },
        y: 50,
        opacity: 0,
        stagger: 0.15,
        duration: 0.8,
        ease: "power2.out"
    });

    // --- FAQ Accordion ---
    document.querySelectorAll('.faq-question').forEach(btn => {
        btn.addEventListener('click', () => {
            const item = btn.parentElement;
            const isOpen = item.classList.contains('open');
            // Close all others
            document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('open'));
            // Toggle current
            if (!isOpen) item.classList.add('open');
        });
    });

    // Package Cards Stagger
    if (document.querySelector(".packages-grid")) {
        gsap.from(".package-card", {
            scrollTrigger: {
                trigger: ".packages-grid",
                start: "top 85%",
            },
            y: 50,
            opacity: 0,
            stagger: 0.15,
            duration: 0.8,
            ease: "power2.out"
        });
    }

    // --- Hamburger Mobile Menu ---
    const hamburgerBtn = document.getElementById('hamburger-btn');
    const mobileNav = document.getElementById('mobile-nav');

    if (hamburgerBtn && mobileNav) {
        hamburgerBtn.addEventListener('click', () => {
            hamburgerBtn.classList.toggle('active');
            mobileNav.classList.toggle('open');
            document.body.style.overflow = mobileNav.classList.contains('open') ? 'hidden' : '';
        });

        // Close mobile nav when a link is clicked
        const mobileLinks = mobileNav.querySelectorAll('.mobile-nav-link');
        mobileLinks.forEach(link => {
            link.addEventListener('click', () => {
                hamburgerBtn.classList.remove('active');
                mobileNav.classList.remove('open');
                document.body.style.overflow = '';
            });
        });
    }

    // --- Contact Form Handler (Send via WhatsApp) ---
    const contactForms = document.querySelectorAll('.contact-form');
    contactForms.forEach(form => {
        form.addEventListener('submit', (e) => {
            e.preventDefault();

            const inputs = form.querySelectorAll('input, textarea');
            const data = {};
            inputs.forEach(input => {
                const label = input.closest('.form-group')?.querySelector('label')?.textContent || '';
                data[label] = input.value;
            });

            const message = `Hi Dubani! 👋\n\n` +
                `*Name:* ${data['First Name'] || ''} ${data['Last Name'] || ''}\n` +
                `*Email:* ${data['Email'] || ''}\n` +
                `*Message:* ${data['Message'] || ''}\n`;

            const encodedMessage = encodeURIComponent(message);
            const whatsappURL = `https://wa.me/27?text=${encodedMessage}`;

            // Show success feedback
            const submitBtn = form.querySelector('.submit-btn, button[type="submit"]');
            if (submitBtn) {
                const originalText = submitBtn.querySelector('.btn-text')?.textContent;
                if (submitBtn.querySelector('.btn-text')) {
                    submitBtn.querySelector('.btn-text').textContent = '✓ Opening WhatsApp...';
                }
                setTimeout(() => {
                    if (submitBtn.querySelector('.btn-text') && originalText) {
                        submitBtn.querySelector('.btn-text').textContent = originalText;
                    }
                }, 3000);
            }

            window.open(whatsappURL, '_blank');
            form.reset();
        });
    });

    // --- Portfolio Slider Nav and Drag (Transform-based) ---
    const sliderWrapper = document.querySelector('.portfolio-slider-wrapper');
    const slider = document.querySelector('.portfolio-slider-track');
    
    if (sliderWrapper && slider) {
        let currentTranslate = 0;
        let isDown = false;
        let startX;
        let prevTranslate = 0;
        
        const updateSlider = () => {
            const wrapperWidth = sliderWrapper.offsetWidth;
            const trackWidth = slider.offsetWidth;
            
            let maxTranslate = -(trackWidth - wrapperWidth + 100); 
            if (maxTranslate > 0) maxTranslate = 0; 
            
            if (currentTranslate > 0) currentTranslate = 0;
            if (currentTranslate < maxTranslate) currentTranslate = maxTranslate;
            
            slider.style.transform = `translateX(${currentTranslate}px)`;
        };

        // --- Slider Navigation Arrows ---
        const prevBtn = document.querySelector('.prev-btn');
        const nextBtn = document.querySelector('.next-btn');
        if (prevBtn && nextBtn) {
            prevBtn.addEventListener('click', () => {
                currentTranslate += 430;
                updateSlider();
            });
            nextBtn.addEventListener('click', () => {
                currentTranslate -= 430;
                updateSlider();
            });
        }

        // --- Mouse Drag ---
        slider.addEventListener('mousedown', (e) => {
            isDown = true;
            slider.style.cursor = 'grabbing';
            slider.style.transition = 'none'; 
            startX = e.pageX;
            prevTranslate = currentTranslate;
        });
        
        slider.addEventListener('mouseleave', () => {
            isDown = false;
            slider.style.cursor = '';
            slider.style.transition = 'transform 0.6s cubic-bezier(0.25, 1, 0.5, 1)';
            updateSlider();
        });
        
        slider.addEventListener('mouseup', () => {
            isDown = false;
            slider.style.cursor = '';
            slider.style.transition = 'transform 0.6s cubic-bezier(0.25, 1, 0.5, 1)';
            updateSlider();
        });
        
        slider.addEventListener('mousemove', (e) => {
            if (!isDown) return;
            e.preventDefault();
            const x = e.pageX;
            const walk = (x - startX) * 1.5; 
            currentTranslate = prevTranslate + walk;
            slider.style.transform = `translateX(${currentTranslate}px)`;
        });

        // Prevent links from navigating during a drag
        const slides = document.querySelectorAll('.portfolio-slide');
        slides.forEach(slide => {
            slide.addEventListener('click', (e) => {
                if (slider.style.cursor === 'grabbing') {
                    e.preventDefault();
                }
            });
            slide.addEventListener('dragstart', (e) => e.preventDefault());
        });
        
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(updateSlider, 100);
        });
    }

    // --- APPS Password Protection Logic (Password: 4664) ---
    const APPS_PASSWORD = "4664";

    const createAppsPasswordModal = () => {
        if (document.getElementById('apps-pass-modal')) return;

        const modalOverlay = document.createElement('div');
        modalOverlay.id = 'apps-pass-modal';
        modalOverlay.className = 'apps-pass-modal-overlay';
        modalOverlay.innerHTML = `
            <div class="apps-pass-modal-card" id="apps-pass-card">
                <div class="apps-pass-icon">🔒</div>
                <h3 class="apps-pass-title">Dubani Apps Locked</h3>
                <p class="apps-pass-desc">Please enter password to access APPS tools.</p>
                <div class="apps-pass-input-wrapper">
                    <input type="password" id="apps-pass-input" class="apps-pass-input" placeholder="••••" maxlength="10" autocomplete="off">
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
            setTimeout(() => input.focus(), 200);
        };

        const closePasswordModal = () => {
            modalOverlay.classList.remove('active');
            errorEl.textContent = '';
            input.value = '';
        };

        const verifyPassword = () => {
            const entered = input.value.trim();
            if (entered === APPS_PASSWORD) {
                closePasswordModal();
                if (onUnlockSuccess) onUnlockSuccess();
            } else {
                errorEl.textContent = '❌ Incorrect password. Access denied.';
                card.classList.remove('shake');
                void card.offsetWidth; // Force reflow
                card.classList.add('shake');
                input.value = '';
                input.focus();
            }
        };

        submitBtn.addEventListener('click', verifyPassword);
        cancelBtn.addEventListener('click', closePasswordModal);
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') verifyPassword();
            if (e.key === 'Escape') closePasswordModal();
        });
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) closePasswordModal();
        });
    };

    createAppsPasswordModal();

    const requestAppsAccess = (onSuccess) => {
        if (window.openAppsPasswordModal) {
            window.openAppsPasswordModal(onSuccess);
        }
    };

    // --- Apps Sidebar Toggle Logic ---
    const sidebar = document.getElementById('apps-sidebar');
    const sidebarOverlay = document.getElementById('apps-sidebar-overlay');
    const sidebarBtn = document.getElementById('apps-sidebar-btn');
    const mobileSidebarBtn = document.getElementById('mobile-apps-btn');
    const sidebarClose = document.getElementById('sidebar-close');

    const toggleSidebar = (force) => {
        const isOpen = force !== undefined ? force : !sidebar.classList.contains('active');
        if (sidebar) sidebar.classList.toggle('active', isOpen);
        if (sidebarOverlay) sidebarOverlay.classList.toggle('active', isOpen);
        document.body.style.overflow = isOpen ? 'hidden' : '';
    };

    if (sidebarBtn) sidebarBtn.addEventListener('click', () => {
        requestAppsAccess(() => toggleSidebar(true));
    });

    if (mobileSidebarBtn) mobileSidebarBtn.addEventListener('click', (e) => {
        e.preventDefault();
        requestAppsAccess(() => {
            // Close mobile nav first
            const mobileNav = document.getElementById('mobile-nav');
            const hamburgerBtn = document.getElementById('hamburger-btn');
            if (mobileNav && mobileNav.classList.contains('open')) {
                if (hamburgerBtn) hamburgerBtn.classList.remove('active');
                mobileNav.classList.remove('open');
            }
            toggleSidebar(true);
        });
    });

    if (sidebarClose) sidebarClose.addEventListener('click', () => toggleSidebar(false));
    if (sidebarOverlay) sidebarOverlay.addEventListener('click', () => toggleSidebar(false));

    // Intercept any direct links to invoice.html or my-apps.html
    document.querySelectorAll('a[href*="invoice.html"], a[href*="my-apps.html"]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetUrl = link.href;
            requestAppsAccess(() => {
                window.location.href = targetUrl;
            });
        });
    });

    // Close sidebar on Escape key
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && sidebar && sidebar.classList.contains('active')) {
            toggleSidebar(false);
        }
    });

    // --- Hero Statistics Count-Up and Staggered Reveal ---
    const initHeroStats = () => {
        const statsWidget = document.querySelector('.hero-stats-widget');
        if (!statsWidget) return;

        const statItems = statsWidget.querySelectorAll('.stat-item');
        const numSpans = statsWidget.querySelectorAll('.stat-number .num');

        // Create initial hidden state for staggered reveal
        gsap.set(statsWidget, { opacity: 0, y: 35 });
        gsap.set(statItems, { opacity: 0, y: 15 });

        // Build the reveal timeline
        const tl = gsap.timeline({
            delay: 0.6, // Slight delay to run after primary hero text animations
            scrollTrigger: {
                trigger: statsWidget,
                start: "top 95%",
                toggleActions: "play none none none"
            }
        });

        tl.to(statsWidget, {
            opacity: 1,
            y: 0,
            duration: 1.0,
            ease: "power4.out"
        })
        .to(statItems, {
            opacity: 1,
            y: 0,
            duration: 0.8,
            stagger: 0.12,
            ease: "power3.out"
        }, "-=0.6");

        // Staggered count-up of numbers using custom target object for robust count-up rendering
        numSpans.forEach((num, index) => {
            const targetVal = parseInt(num.getAttribute('data-target'), 10);
            if (isNaN(targetVal)) return;

            // Set initial state to 0
            num.textContent = "0";

            const countObj = { val: 0 };
            tl.to(countObj, {
                val: targetVal,
                duration: 1.8,
                ease: "power2.out",
                onUpdate: () => {
                    num.textContent = Math.floor(countObj.val);
                }
            }, `-=${1.6 - index * 0.12}`);
        });
    };

    initHeroStats();

    // --- Fullscreen Image Lightbox Engine ---
    const initImageLightbox = () => {
        // Create modal element if missing
        let modal = document.getElementById("dcLightboxModal");
        if (!modal) {
            modal = document.createElement("div");
            modal.id = "dcLightboxModal";
            modal.className = "dc-lightbox-overlay";
            modal.setAttribute("role", "dialog");
            modal.setAttribute("aria-hidden", "true");
            modal.innerHTML = `
                <div class="dc-lightbox-backdrop"></div>
                <div class="dc-lightbox-container">
                    <header class="dc-lightbox-header">
                        <span class="dc-lightbox-counter" id="dcLightboxCounter">1 / 1</span>
                        <div class="dc-lightbox-actions">
                            <button class="dc-lightbox-btn dc-btn-zoom" id="dcLightboxZoomBtn" title="Toggle Zoom (Z)">
                                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>
                            </button>
                            <button class="dc-lightbox-btn dc-btn-close" id="dcLightboxCloseBtn" title="Close (Esc)">
                                <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                            </button>
                        </div>
                    </header>

                    <button class="dc-lightbox-nav dc-nav-prev" id="dcLightboxPrevBtn" title="Previous (Left Arrow)">‹</button>
                    <button class="dc-lightbox-nav dc-nav-next" id="dcLightboxNextBtn" title="Next (Right Arrow)">›</button>

                    <div class="dc-lightbox-content">
                        <img id="dcLightboxImage" class="dc-lightbox-img" src="" alt="">
                        <div id="dcLightboxCaption" class="dc-lightbox-caption"></div>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
        }

        const backdrop = modal.querySelector(".dc-lightbox-backdrop");
        const closeBtn = document.getElementById("dcLightboxCloseBtn");
        const zoomBtn = document.getElementById("dcLightboxZoomBtn");
        const prevBtn = document.getElementById("dcLightboxPrevBtn");
        const nextBtn = document.getElementById("dcLightboxNextBtn");
        const imgEl = document.getElementById("dcLightboxImage");
        const captionEl = document.getElementById("dcLightboxCaption");
        const counterEl = document.getElementById("dcLightboxCounter");

        let activeImagesList = [];
        let currentIndex = 0;

        const collectImages = () => {
            const allImgs = Array.from(document.querySelectorAll("img"));
            return allImgs.filter(img => {
                if (!img.src || img.src.includes("data:image/svg+xml")) return false;
                // Exclude logos, UI icons, badges, theme toggle
                if (img.closest(".header-logo") || img.closest(".service-icon") || img.closest(".theme-toggle") || img.classList.contains("no-lightbox")) {
                    return false;
                }
                // Exclude tiny icons < 60px
                if (img.naturalWidth > 0 && img.naturalWidth < 60 && img.naturalHeight < 60) return false;
                return true;
            });
        };

        const openLightbox = (index) => {
            activeImagesList = collectImages();
            if (activeImagesList.length === 0) return;

            if (index < 0) index = activeImagesList.length - 1;
            if (index >= activeImagesList.length) index = 0;

            currentIndex = index;
            const targetImg = activeImagesList[currentIndex];

            imgEl.src = targetImg.currentSrc || targetImg.src;
            imgEl.alt = targetImg.alt || "Dubani Creatives Showcase";
            imgEl.classList.remove("is-zoomed");

            const parentTitle = targetImg.closest(".gallery-item, .project-card, .project-block, .portfolio-slide")?.querySelector("h3, h4, .project-title")?.textContent;
            captionEl.textContent = parentTitle || targetImg.alt || "Dubani Creatives Showcase";

            counterEl.textContent = `${currentIndex + 1} / ${activeImagesList.length}`;

            modal.classList.add("active");
            modal.setAttribute("aria-hidden", "false");
            document.body.style.overflow = "hidden";
        };

        const closeLightbox = () => {
            modal.classList.remove("active");
            modal.setAttribute("aria-hidden", "true");
            document.body.style.overflow = "";
            imgEl.classList.remove("is-zoomed");
        };

        const showPrev = () => openLightbox(currentIndex - 1);
        const showNext = () => openLightbox(currentIndex + 1);

        const toggleZoom = () => {
            imgEl.classList.toggle("is-zoomed");
        };

        // Attach click listeners to all valid images & containers
        const bindImageClicks = () => {
            const images = collectImages();
            images.forEach((img) => {
                img.style.cursor = "pointer";
                const parentCard = img.closest(".gallery-item, .project-image-box, .portfolio-slide, .project-card");
                const targets = parentCard ? [img, parentCard] : [img];

                targets.forEach(target => {
                    target.style.cursor = "pointer";
                    target.removeEventListener("click", img._dcLightboxHandler);
                    img._dcLightboxHandler = (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const list = collectImages();
                        const idx = list.indexOf(img);
                        openLightbox(idx >= 0 ? idx : 0);
                    };
                    target.addEventListener("click", img._dcLightboxHandler);
                });
            });
        };

        bindImageClicks();

        // Event bindings for controls
        backdrop.addEventListener("click", closeLightbox);
        closeBtn.addEventListener("click", closeLightbox);
        zoomBtn.addEventListener("click", toggleZoom);
        prevBtn.addEventListener("click", showPrev);
        nextBtn.addEventListener("click", showNext);

        imgEl.addEventListener("click", (e) => {
            e.stopPropagation();
            toggleZoom();
        });

        // Keyboard navigation
        document.addEventListener("keydown", (e) => {
            if (!modal.classList.contains("active")) return;
            if (e.key === "Escape") closeLightbox();
            if (e.key === "ArrowLeft") showPrev();
            if (e.key === "ArrowRight") showNext();
            if (e.key === "z" || e.key === "Z") toggleZoom();
        });

        // Touch Swipe Navigation for Mobile
        let touchStartX = 0;
        let touchEndX = 0;
        modal.addEventListener("touchstart", (e) => {
            touchStartX = e.changedTouches[0].screenX;
        }, { passive: true });

        modal.addEventListener("touchend", (e) => {
            touchEndX = e.changedTouches[0].screenX;
            if (touchStartX - touchEndX > 50) showNext();
            if (touchEndX - touchStartX > 50) showPrev();
        }, { passive: true });

        // Expose trigger for dynamic layout updates
        window.initImageLightbox = bindImageClicks;
    };

    initImageLightbox();

});


