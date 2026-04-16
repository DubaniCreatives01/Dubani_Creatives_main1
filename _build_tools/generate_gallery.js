const fs = require('fs');
const path = require('path');

const portfolioDir = path.join(__dirname, 'montana_clone', 'images', 'Portfolio');
const outputFile = path.join(__dirname, 'gallery_output.html');
const sliderOutputFile = path.join(__dirname, 'slider_output.html');

const mapping = {
  'Branding': 'branding',
  'Logo Design': 'logo',
  'Packaging': 'packaging',
  'Web Design': 'web',
  'Posters': 'social',
  'Banners': 'social',
  'Flyer': 'social',
  'Random': 'social',
  'Aparel': 'print',
  'Brochure': 'print',
  'Signage': 'print',
  'Stationery': 'print'
};

const getCategory = (dirName) => {
    return mapping[dirName] || 'social';
};

const getTag = (dirName, category) => {
    if (dirName === 'Logo Design') return 'Logo Design';
    if (category === 'branding') return 'Branding';
    if (category === 'packaging') return 'Packaging';
    if (category === 'web') return 'Web Design';
    if (category === 'social') return 'Social Media';
    if (category === 'print') return 'Print / Merch';
    return dirName;
};

// SVG Icon string
const viewBtnHtml = `<span class="gallery-view-btn"><svg viewBox="0 0 24 24"><path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/></svg> View Case Study</span>`;

let standardHtmlBlocks = [];
let printHtmlBlocks = [];
let itemsArr = [];

const walkSync = (dir, filelist = []) => {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const dpath = path.join(dir, file);
    if (fs.statSync(dpath).isDirectory()) {
      walkSync(dpath, filelist);
    } else {
        if (file.match(/\.(jpg|jpeg|png|webp|gif)$/i)) {
            filelist.push(dpath);
        }
    }
  }
  return filelist;
};

const allFiles = walkSync(portfolioDir);

allFiles.forEach(file => {
    const relativePath = path.relative(path.join(__dirname, 'montana_clone'), file).replace(/\\/g, '/');
    const folderParts = relativePath.split('/');
    // Path looks like images/Portfolio/Web Design/Regimed/123.jpg
    const topFolder = folderParts[2]; // e.g. Web Design
    
    // Extract base name without extension for alternate text
    const baseName = path.basename(file, path.extname(file));
    let title = baseName.replace(/_/g, ' ');
    if (title.length > 20) { title = title.substring(0, 20) + '...'; } // short title

    const category = getCategory(topFolder);
    const tag = getTag(topFolder, category);

    // Ensure it properly supports URL-friendly paths (whitespace handling)
    const encodedPath = encodeURI(relativePath);

    // Build standard gallery item HTML
    const htmlBlock = `
        <div class="gallery-item" data-category="${category}">
            <span class="gallery-tag">${tag}</span>
            <img src="${encodedPath}" alt="${title}" class="gallery-item-img" loading="lazy">
            <div class="gallery-overlay">
                <h4>${title}</h4>
                ${viewBtnHtml}
            </div>
        </div>`;
    if (category === 'print') {
        printHtmlBlocks.push(htmlBlock);
    } else {
        standardHtmlBlocks.push(htmlBlock);
    }
    
    // Save info for slider
    itemsArr.push({ encodedPath, tag, category });
});

fs.writeFileSync(outputFile, standardHtmlBlocks.join('') + printHtmlBlocks.join(''));

// --- Generate 10 random slides for the homepage slider ---
const shuffle = (array) => {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
};

const randomItems = shuffle(itemsArr).slice(0, 10);
let sliderHtml = '';

randomItems.forEach(item => {
    sliderHtml += `
    <div class="portfolio-slide">
        <img src="${item.encodedPath}" alt="Portfolio Shot" class="portfolio-slide-img" style="object-fit: cover;">
        <div class="portfolio-slide-content">
            <span class="slide-category">${item.tag}</span>
            <span class="gallery-view-btn slide-overlay-link"><svg viewBox="0 0 24 24"><path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/></svg> View</span>
        </div>
    </div>`;
});

fs.writeFileSync(sliderOutputFile, sliderHtml);

console.log('Successfully generated HTML for ' + allFiles.length + ' images.');
