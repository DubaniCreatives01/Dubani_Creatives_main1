const fs = require('fs');
const path = require('path');

const projectsPath = path.join(__dirname, 'montana_clone', 'projects.html');
const indexPath = path.join(__dirname, 'montana_clone', 'index.html');

const galleryHtml = fs.readFileSync(path.join(__dirname, 'gallery_output.html'), 'utf-8');
const sliderHtml = fs.readFileSync(path.join(__dirname, 'slider_output.html'), 'utf-8');

// --- Update projects.html ---
let projectsContent = fs.readFileSync(projectsPath, 'utf-8');

// 1. Add Print / Merch button
if (!projectsContent.includes('data-filter="print"')) {
    projectsContent = projectsContent.replace(
        '<button class="filter-btn" data-filter="social">Social Media</button>',
        '<button class="filter-btn" data-filter="social">Social Media</button>\n                    <button class="filter-btn" data-filter="print">Print / Merch</button>'
    );
}

// 2. Replace the gallery grid contents
// We find <div class="gallery-grid-filter" id="gallery-grid"> and the next line <!-- Gallery Filter Script -->
const parts = projectsContent.split('<div class="gallery-grid-filter" id="gallery-grid">');
if (parts.length > 1) {
    const endParts = parts[1].split('<!-- Gallery Filter Script -->');
    if (endParts.length > 1) {
        projectsContent = parts[0] + '<div class="gallery-grid-filter" id="gallery-grid">\n' + galleryHtml + '\n                </div>\n\n        ' + '<!-- Gallery Filter Script -->' + endParts[1];
    }
}

fs.writeFileSync(projectsPath, projectsContent);

console.log('projects.html updated!');

// --- Update index.html ---
let indexContent = fs.readFileSync(indexPath, 'utf-8');

const iparts = indexContent.split('<div class="portfolio-slider-track">');
if (iparts.length > 1) {
    const endParts = iparts[1].split('<!-- Drag icon instruction -->');
    if (endParts.length > 1) {
        // Wait, the end of the track is a closing </div> before the drag icon instruction!
        // Actually, let's just find the closing tag of portfolio-slider-track
        const trackStart = iparts[0] + '<div class="portfolio-slider-track">\n';
        // Let's use regex to replace everything inside portfolio-slider-track
        indexContent = indexContent.replace(/<div class="portfolio-slider-track">[\s\S]*?<\/div>\s*<!-- Drag icon instruction -->/g, '<div class="portfolio-slider-track">\n' + sliderHtml + '\n</div>\n<!-- Drag icon instruction -->');
    }
}

fs.writeFileSync(indexPath, indexContent);
console.log('index.html updated!');

