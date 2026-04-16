const fs = require('fs');
const path = require('path');

const cvHtmlStr = `
<section class="hero-section cv-hero" style="min-height: 45vh; padding-top: 150px; background: var(--dark); border-bottom: 1px solid rgba(255,255,255,0.05);">
    <div class="container text-center">
        <h1 class="hero-title" style="font-size: 55px; margin-bottom: 10px;">Silulamele Dubani</h1>
        <p class="hero-subtitle mb-4" style="color: var(--primary-color);">Creative Designer &bull; Visual Communicator &bull; Digital Marketing</p>
        <div class="cv-contact-bar mt-4" style="display: flex; justify-content: center; flex-wrap: wrap; gap: 20px; font-size: 14px; color: rgba(255,255,255,0.7);">
            <span><i class="fas fa-map-marker-alt"></i> Cape Town, SA</span>
            <span><i class="fas fa-envelope"></i> silulamele4664@gmail.com</span>
            <span><i class="fas fa-phone"></i> +27 73 346 4805 / +27 63 180 2483</span>
            <a href="https://dubanicreatives.tech" style="color: #fff; text-decoration: none;"><i class="fas fa-globe"></i> Website</a>
        </div>
        <div class="mt-5">
            <a href="#" class="theme-btn cv-download-btn">
                <div class="btn-bg outline-only"></div>
                <span class="btn-text" style="color: white;">Download PDF Resume</span>
            </a>
        </div>
    </div>
</section>

<section class="cv-body-section" style="padding: 100px 0; background-color: var(--primary-bg);">
    <div class="container">
        
        <!-- Summary -->
        <div class="cv-block mb-5">
            <h2 class="cv-heading">Professional Summary <span class="accent-dot">.</span></h2>
            <div class="cv-card summary-card">
                <p>Resourceful and detail-driven Graphic Designer with 6+ years of experience delivering engaging and brand-aligned visual content for corporate, NGO, and public-facing sectors. Adept in Adobe Creative Suite, UI/UX layout design, social media marketing support, and print/digital branding. Proven ability to collaborate with cross-functional teams and clients to meet deadlines and drive brand visibility.</p>
            </div>
        </div>

        <div class="cv-grid">
            <!-- Left Column: Experience -->
            <div class="cv-left">
                <h2 class="cv-heading">Work Experience <span class="accent-dot">.</span></h2>
                <div class="cv-timeline">
                    
                    <div class="timeline-item">
                        <div class="timeline-dot"></div>
                        <div class="timeline-content">
                            <h3>Santam Insurance</h3>
                            <span class="timeline-role">Freelance Graphic Designer</span>
                            <span class="timeline-date">Remote | Oct 2025 - Present</span>
                        </div>
                    </div>
                    
                    <div class="timeline-item">
                        <div class="timeline-dot"></div>
                        <div class="timeline-content">
                            <h3>VNL (Village n Life)</h3>
                            <span class="timeline-role">Senior Graphic Designer</span>
                            <span class="timeline-date">Cape Town | Sep 2024 – Mar 2025</span>
                            <ul>
                                <li>Designed brand-consistent digital and print collateral for hospitality clients including signage, vehicle wraps, brochures, and web banners.</li>
                                <li>Collaborated with the marketing team to develop visual campaigns across multiple platforms.</li>
                                <li>Introduced a new design system that reduced turnaround times by 25%.</li>
                            </ul>
                        </div>
                    </div>

                    <div class="timeline-item">
                        <div class="timeline-dot"></div>
                        <div class="timeline-content">
                            <h3>ASSA (Actuarial Society of SA)</h3>
                            <span class="timeline-role">Design and Marketing Assistant</span>
                            <span class="timeline-date">Cape Town | Apr 2023 – Nov 2023</span>
                            <ul>
                                <li>Produced graphics for web and email marketing (Mailchimp, Google Analytics reporting support).</li>
                                <li>Managed social media visuals and layout designs.</li>
                                <li>Assisted with website content updates and campaign design execution.</li>
                            </ul>
                        </div>
                    </div>

                    <div class="timeline-item">
                        <div class="timeline-dot"></div>
                        <div class="timeline-content">
                            <h3>Pixelfaerie</h3>
                            <span class="timeline-role">Graphic/Creative Designer</span>
                            <span class="timeline-date">Cape Town | Dec 2021 – Mar 2023</span>
                            <ul>
                                <li>Created visual assets for international clients using Adobe Illustrator and After Effects.</li>
                                <li>Supported pitch deck and layout design for business presentations.</li>
                                <li>Worked in a fast-paced environment with tight turnaround requirements.</li>
                            </ul>
                        </div>
                    </div>

                    <div class="timeline-item">
                        <div class="timeline-dot"></div>
                        <div class="timeline-content">
                            <h3>Dubani Creatives</h3>
                            <span class="timeline-role">Creative Director & Graphic Designer</span>
                            <span class="timeline-date">Remote | Jan 2019 – Present</span>
                            <ul>
                                <li>Built brand identities, flyers, posters, packaging, and social content for local SMEs.</li>
                                <li>Consulted with clients on concept development and digital transformation through design.</li>
                                <li>Developed and maintained client websites using WordPress.</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Right Column -->
            <div class="cv-right">
                <h2 class="cv-heading">Education <span class="accent-dot">.</span></h2>
                <div class="cv-card mb-4 ed-card">
                    <h4>BTech: Graphic Design (Cum Laude)</h4>
                    <span class="ed-school">Durban University of Technology</span>
                    <small class="ed-date">Jan 2014 – Nov 2017</small>
                </div>
                <div class="cv-card mb-4 ed-card">
                    <h4>NC: IT Systems Development</h4>
                    <span class="ed-school">CapaCiTi Tech Accelerator</span>
                    <small class="ed-date">Mar 2020 – Mar 2021</small>
                </div>
                <div class="cv-card mb-4 ed-card">
                    <h4>National Senior Certificate</h4>
                    <span class="ed-school">Intsebenziswano Senior Secondary</span>
                    <small class="ed-date">2013</small>
                </div>

                <div class="spacer" style="height: 40px;"></div>

                <h2 class="cv-heading">Certifications <span class="accent-dot">.</span></h2>
                <ul class="cv-simple-list">
                    <li>Graphic Design Careers (LinkedIn, 2021)</li>
                    <li>Intro to Graphic Design (LinkedIn, 2021)</li>
                    <li>Certificate in Graphic Design (Alison, 2021)</li>
                </ul>

                <div class="spacer" style="height: 40px;"></div>

                <h2 class="cv-heading">Technical Skills <span class="accent-dot">.</span></h2>
                <div class="cv-skills-grid">
                    <span class="skill-tag">Photoshop</span><span class="skill-tag">Illustrator</span>
                    <span class="skill-tag">After Effects</span><span class="skill-tag">InDesign</span>
                    <span class="skill-tag">Lightroom</span><span class="skill-tag">WordPress</span>
                    <span class="skill-tag">Mailchimp</span><span class="skill-tag">Google Analytics</span>
                    <span class="skill-tag">Print Layout</span><span class="skill-tag">UI/UX</span>
                </div>

                <div class="spacer" style="height: 40px;"></div>

                <h2 class="cv-heading">Soft Skills <span class="accent-dot">.</span></h2>
                <div class="cv-skills-grid soft-skills">
                    <span class="skill-tag">Creative Problem Solving</span>
                    <span class="skill-tag">Client Communication</span>
                    <span class="skill-tag">Deadline Management</span>
                    <span class="skill-tag">Attention to Detail</span>
                    <span class="skill-tag">Team Collaboration</span>
                </div>
            </div>
        </div>
    </div>
</section>
`;

let servicesHtml = fs.readFileSync(path.join(__dirname, 'montana_clone', 'services.html'), 'utf-8');
const parts = servicesHtml.split('<!-- Page Header -->');
let head = parts[0];
let tail = parts[1].substring(parts[1].indexOf('<footer class="main-footer">'));
head = head.replace('<title>Dubani Creatives - Services</title>', '<title>Silulamele Dubani - CV / Resume</title>');

fs.writeFileSync(path.join(__dirname, 'montana_clone', 'cv.html'), head + '<main id="cv-main">\n' + cvHtmlStr + '\n</main>\n\n' + tail, 'utf-8');
