const fs = require('fs');
const path = require('path');

const cssV2 = `
/* =========================================
   CV / Resume Page Styles (V2 Premium)
========================================= */

.cv-hero {
    position: relative;
    border-bottom: 1px solid rgba(255,94,0,0.2) !important;
    background: radial-gradient(circle at center, rgba(255,94,0,0.05) 0%, var(--dark) 70%) !important;
}

.cv-hero::before {
    content: '';
    position: absolute;
    inset: 0;
    background-image: 
        linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
    background-size: 40px 40px;
    z-index: 0;
    pointer-events: none;
}
.cv-hero .container { position: relative; z-index: 1; }

.cv-heading {
    font-size: 42px; /* Bigger font */
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-bottom: 35px;
    font-family: var(--font-heading);
    background: linear-gradient(90deg, #fff, rgba(255,255,255,0.5));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
}

.accent-dot {
    color: var(--primary-color);
    -webkit-text-fill-color: var(--primary-color);
}

.cv-card {
    background: rgba(255,255,255,0.02);
    border: 1px solid rgba(255,255,255,0.04);
    padding: 40px;
    border-radius: 16px;
    box-shadow: 0 10px 40px rgba(0,0,0,0.2);
    transition: transform 0.3s ease, border-color 0.3s ease;
}

.cv-card:hover { border-color: rgba(255,94,0,0.2); }

.summary-card {
    border-left: 5px solid var(--primary-color);
    font-size: 20px; /* Big font */
    line-height: 1.9;
    color: rgba(255,255,255,0.85);
}

.cv-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 60px;
}

@media (min-width: 900px) {
    .cv-grid { grid-template-columns: 2fr 1.2fr; gap: 100px; }
}

/* Timeline */
.cv-timeline {
    position: relative;
    padding-left: 45px;
}

.cv-timeline::before {
    content: '';
    position: absolute;
    left: 8px;
    top: 20px;
    bottom: 0;
    width: 3px;
    background: linear-gradient(180deg, var(--primary-color) 0%, rgba(255,255,255,0.03) 100%);
}

.timeline-item { position: relative; margin-bottom: 60px; }

.timeline-dot {
    position: absolute;
    left: -44px;
    top: 15px;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: #000;
    border: 4px solid var(--primary-color);
    box-shadow: 0 0 20px rgba(255,94,0,0.6);
}

/* Premium Job Blocks */
.timeline-content {
    background: rgba(255,255,255,0.02);
    border: 1px solid rgba(255,255,255,0.05);
    padding: 40px;
    border-radius: 16px;
    transition: all 0.3s ease;
}
.timeline-content:hover {
    background: rgba(255,255,255,0.04);
    transform: translateY(-5px);
    box-shadow: 0 15px 30px rgba(0,0,0,0.3);
    border-color: rgba(255,94,0,0.3);
}

.timeline-content h3 {
    font-size: 32px; /* Bigger font */
    font-weight: 800;
    margin-bottom: 12px;
    color: #fff;
    font-family: var(--font-heading);
    letter-spacing: -0.5px;
}

.timeline-role {
    display: inline-block;
    color: #fff;
    background: var(--primary-color);
    padding: 8px 18px;
    border-radius: 50px;
    font-weight: 700;
    font-size: 16px;
    margin-bottom: 20px;
}

.timeline-date {
    display: block;
    font-size: 16px;
    color: rgba(255,255,255,0.6);
    margin-bottom: 25px;
    font-family: monospace;
    text-transform: uppercase;
    letter-spacing: 1px;
}

.timeline-content ul { list-style: none; padding: 0; }
.timeline-content ul li {
    position: relative;
    padding-left: 30px;
    margin-bottom: 15px;
    color: rgba(255,255,255,0.8);
    line-height: 1.8;
    font-size: 18px;
}
.timeline-content ul li::before {
    content: '\\2023';
    color: var(--primary-color);
    position: absolute;
    left: 0; top: -2px;
    font-size: 24px;
}

/* Education & Skills */
.ed-card { padding: 30px; }
.ed-card h4 { font-size: 22px; color: #fff; margin-bottom: 12px; font-weight: 700; line-height: 1.4;}
.ed-school { display: block; color: var(--primary-color); font-size: 17px; margin-bottom: 8px; font-weight: 600; }
.ed-date { color: rgba(255,255,255,0.5); font-size: 15px; font-family: monospace; }

.cv-simple-list { list-style: none; padding: 0; }
.cv-simple-list li {
    padding: 18px 0;
    border-bottom: 1px solid rgba(255,255,255,0.05);
    color: rgba(255,255,255,0.85);
    font-size: 18px;
    font-weight: 500;
}

/* Skill Tags */
.cv-skills-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 14px;
}

.skill-tag {
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.1);
    color: rgba(255,255,255,0.9);
    padding: 14px 26px;
    border-radius: 50px;
    font-size: 17px;
    font-weight: 600;
    transition: all 0.3s ease;
    letter-spacing: 0.5px;
}

.skill-tag:hover {
    background: var(--primary-color);
    border-color: var(--primary-color);
    color: #fff;
    transform: translateY(-3px);
    box-shadow: 0 10px 20px rgba(255,94,0,0.3);
}

.soft-skills .skill-tag {
    background: transparent;
    border-style: dashed;
}
`;

// Update styles.css
const stylesPath = path.join(__dirname, 'montana_clone', 'styles.css');
let styles = fs.readFileSync(stylesPath, 'utf8');
const splitPoint = '/* =========================================\r\n   CV / Resume Page Styles\r\n========================================= */';

// Fallback split point if CRLF differs
const fallbackSplitPoint = '/* =========================================\n   CV / Resume Page Styles\n========================================= */';

if (styles.includes(splitPoint)) {
    styles = styles.split(splitPoint)[0];
} else if (styles.includes(fallbackSplitPoint)) {
    styles = styles.split(fallbackSplitPoint)[0];
}

fs.writeFileSync(stylesPath, styles + '\\n' + cssV2);

// Update HTML to match the larger vibe
const cvPath = path.join(__dirname, 'montana_clone', 'cv.html');
let cvHtml = fs.readFileSync(cvPath, 'utf8');
cvHtml = cvHtml.replace(/font-size: 55px/g, 'font-size: clamp(50px, 8vw, 85px); letter-spacing: -2px; font-weight: 900; text-transform: uppercase');
cvHtml = cvHtml.replace(/font-size: 14px/g, 'font-size: 18px');
fs.writeFileSync(cvPath, cvHtml);
console.log('Premium styles injected and HTML upscaled.');
