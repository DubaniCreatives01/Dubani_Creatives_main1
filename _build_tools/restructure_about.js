const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, 'montana_clone', 'index.html');
let html = fs.readFileSync(targetFile, 'utf-8');

// 1. Remove Personal block from section-top
const personalBlockOriginal = `                    <!-- Personal About -->
                    <div class="section-title-wrap env-personal">
                        <p class="section-subtitle">A Little About Me</p>
                        <h2 class="section-title">Beyond just design,<br>I build from scratch</h2>
                    </div>
                    <div class="section-desc-wrap env-personal">
                        <h3 class="section-heading-two">I've been creative for as long as I can remember. I love designing and building things from scratch. Beyond design, I'm a music lover, a book enthusiast, and a foodie. My faith as a Christian guides me.</h3>
                        <div class="section-btn-box mt-4">
                            <a href="contact.html" class="theme-btn">
                                <div class="btn-bg"></div>
                                <span class="btn-text">Get in touch</span>
                            </a>
                        </div>
                    </div>`;

if (html.includes(personalBlockOriginal)) {
    html = html.replace(personalBlockOriginal, '');
} else {
    console.log("Could not find personalBlockOriginal");
}

// 2. Add env-business to the specific gallery section-top and gallery-grid
// Since we are inside <section class="gallery-section"> we find that exact string
const gallerySectionTopOriginal = `<section class="gallery-section">
            <div class="container">
                <div class="section-top">`;
const gallerySectionTopNew = `<section class="gallery-section">
            <div class="container">
                <div class="section-top env-business">`;

if (html.includes(gallerySectionTopOriginal)) {
    html = html.replace(gallerySectionTopOriginal, gallerySectionTopNew);
} else {
    // try looser replace
    html = html.replace('<section class="gallery-section">\r\n            <div class="container">\r\n                <div class="section-top">', gallerySectionTopNew);
}

const galleryGridOriginal = `<div class="gallery-grid mt-24">
                    <div class="gallery-item"><img src="images/imgi_10_68b32348d0f413c4b0062b3d_1.png" alt="Gallery"></div>`;
const galleryGridNew = `<div class="gallery-grid mt-24 env-business">
                    <div class="gallery-item"><img src="images/imgi_10_68b32348d0f413c4b0062b3d_1.png" alt="Gallery"></div>`;

html = html.replace(galleryGridOriginal, galleryGridNew);

// 3. Inject new Personal Grid
const personalGridToInject = `
                <!-- Custom Personal About Layout -->
                <div class="personal-about-wrapper env-personal" style="padding-top: 50px; padding-bottom: 50px;">
                    <div class="personal-about-grid">
                        <div class="personal-about-text">
                            <p class="section-subtitle">A Little About Me</p>
                            <h2 class="section-title">Beyond just design,<br>I build from scratch</h2>
                            <h3 style="font-size: 24px; line-height: 1.6; color: rgba(255,255,255,0.85); font-weight: 400; margin-top: 30px; margin-bottom: 40px;">
                                I've been creative for as long as I can remember. I love designing and building things from scratch. Beyond design, I'm a music lover, a book enthusiast, and a foodie. My faith as a Christian guides me.
                            </h3>
                            <div class="section-btn-box">
                                <a href="contact.html" class="theme-btn">
                                    <div class="btn-bg orange"></div>
                                    <span class="btn-text text-white">Get in touch</span>
                                </a>
                            </div>
                        </div>
                        <div class="personal-about-image-container">
                            <img src="images/about img.png" alt="Silulamele Dubani Portrait" class="personal-portrait-img">
                        </div>
                    </div>
                </div>
`;

// Inject right after the closing div of gallery-grid
html = html.replace(`                    <div class="gallery-item"><img src="images/imgi_12_68b32348fca04397a297cfeb_3.png" alt="Gallery"></div>\r\n                </div>`, 
                    `                    <div class="gallery-item"><img src="images/imgi_12_68b32348fca04397a297cfeb_3.png" alt="Gallery"></div>\r\n                </div>` + personalGridToInject);
html = html.replace(`                    <div class="gallery-item"><img src="images/imgi_12_68b32348fca04397a297cfeb_3.png" alt="Gallery"></div>\n                </div>`, 
                    `                    <div class="gallery-item"><img src="images/imgi_12_68b32348fca04397a297cfeb_3.png" alt="Gallery"></div>\n                </div>` + personalGridToInject);


fs.writeFileSync(targetFile, html, 'utf-8');
console.log('HTML restructured successfully!');
