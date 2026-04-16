const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, 'montana_clone', 'index.html');
let html = fs.readFileSync(targetFile, 'utf-8');

const folderContent = fs.readdirSync(path.join(__dirname, 'montana_clone', 'images', 'Portfolio', 'Branding', 'LUZANA Consulting Holdings'));
const images = folderContent.slice(0, 5); // grab the first 5

let newSliderContent = '';
const categories = ['Branding', 'Logo Design', 'Print / Merch', 'Social Media', 'Web Design'];

images.forEach((img, i) => {
    let imgPath = encodeURI(`images/Portfolio/Branding/LUZANA Consulting Holdings/${img}`);
    newSliderContent += `
                    <!-- Slide ${i + 1} -->
                    <div class="portfolio-slide">
                        <img src="${imgPath}" alt="LUZANA Consulting Holdings" class="portfolio-slide-img" style="object-fit: cover;">
                        <div class="portfolio-slide-content">
                            <span class="slide-category">${categories[i]}</span>
                            <h3 class="slide-title">LUZANA Consulting</h3>
                            <a href="projects.html" class="slide-link">View Case Study <svg viewBox="0 0 24 24"><path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/></svg></a>
                        </div>
                    </div>`;
});

// Since the whole structure inside `<div class="portfolio-slider-track">` to line 311 is explicit, we can match and replace.
const regex = /<div class="portfolio-slider-track">[\s\S]*?<\/div>(\s*)<\/div>\s*<!-- Personal Portfolio List -->/;
html = html.replace(regex, `<div class="portfolio-slider-track">\n${newSliderContent}\n                </div>$1</div>\n\n            <!-- Personal Portfolio List -->`);

fs.writeFileSync(targetFile, html, 'utf-8');
console.log('Successfully injected LUZANA elements into the slider track!');
