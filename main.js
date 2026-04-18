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

    // Initialize Lenis for smooth scrolling
    const lenis = new Lenis({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    });

    function raf(time) {
        lenis.raf(time);
        requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

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

    // Initial reveal for text and banners
    gsap.to(".hero-right", {
        opacity: 1,
        y: 0,
        duration: 1,
        delay: 1.5,
        ease: "power3.out"
    });

    gsap.to(".banner-item", {
        opacity: 1,
        y: 0,
        duration: 0.8,
        delay: 1.8,
        stagger: 0.1,
        ease: "power2.out"
    });

    // Personal Hero Title Animation (original behavior)
    const titleTl = gsap.timeline({
        repeat: -1,
        delay: 0.5
    });

    titleTl.to(".title-one", {
        width: "100%",
        duration: 1.2,
        ease: "power4.inOut"
    })
    .to(".title-one", {
        width: "0%",
        duration: 1.2,
        ease: "power4.inOut",
        delay: 2.5
    })
    .to(".title-two", {
        width: "100%",
        duration: 1.2,
        ease: "power4.inOut",
        delay: 0.2
    })
    .to(".title-two", {
        width: "0%",
        duration: 1.2,
        ease: "power4.inOut",
        delay: 2.5
    });

    // Business Hero Title Animation — text rotator in same position
    const bizTitleTl = gsap.timeline({
        repeat: -1,
        delay: 0.8
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

    // Fade up sections universally
    const fadeUpSections = gsap.utils.toArray(".section-top");
    fadeUpSections.forEach(section => {
        gsap.from(section, {
            scrollTrigger: {
                trigger: section,
                start: "top 85%",
                toggleActions: "play none none reverse"
            },
            y: 40,
            opacity: 0,
            duration: 0.8,
            ease: "power3.out"
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
        }
        
        gsap.from(block, {
            scrollTrigger: {
                trigger: block,
                start: "top 80%",
            },
            y: 80,
            opacity: 0,
            duration: 1,
            ease: "power3.out"
        });
    });

    // Approach section blocks stagger & parallax
    const approachBlocks = gsap.utils.toArray(".approach-big-block");
    approachBlocks.forEach(block => {
        const bg = block.querySelector(".approach-bg-image");
        if(bg) {
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
        
        window.addEventListener('resize', updateSlider);
    }

});
