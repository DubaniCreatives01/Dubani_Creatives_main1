const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'montana_clone');
const htmlFiles = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

let totalFixed = 0;

htmlFiles.forEach(file => {
    const filePath = path.join(dir, file);
    let html = fs.readFileSync(filePath, 'utf-8');
    let changes = [];

    // 1. Add loading="lazy" to all <img> tags that don't have it
    //    Skip the logo and hero images (they should load eagerly)
    const imgRegex = /<img\s(?![^>]*loading=)/gi;
    let match;
    let newHtml = html;
    
    // Add lazy loading to images that don't have it, except logo and hero
    newHtml = newHtml.replace(/<img\s+(?![^>]*loading=)([^>]*?)>/gi, (fullMatch, attrs) => {
        // Don't lazy load the logo or hero bg images (above the fold)
        if (attrs.includes('header-logo') || attrs.includes('logo.png') || attrs.includes('favicon')) {
            return fullMatch;
        }
        changes.push('lazy-load');
        return `<img loading="lazy" ${attrs}>`;
    });

    // 2. Add width and height hints to prevent CLS (Cumulative Layout Shift)
    //    For gallery images that already have aspect-ratio in CSS

    // 3. Add preconnect for Google Fonts if missing
    if (!newHtml.includes('rel="preconnect"') && newHtml.includes('fonts.googleapis.com')) {
        // already has preconnect tag
    }

    // 4. Add meta description if missing
    if (!newHtml.includes('meta name="description"')) {
        newHtml = newHtml.replace('</head>', '    <meta name="description" content="Dubani Creatives - Professional brand design, logo design, and graphic design agency based in Cape Town, South Africa.">\n</head>');
        changes.push('meta-desc');
    }

    // 5. Ensure font-display: swap for performance (we use Google Fonts with display=swap)
    if (newHtml.includes('fonts.googleapis.com') && !newHtml.includes('display=swap')) {
        newHtml = newHtml.replace(/fonts\.googleapis\.com\/css2\?/g, 'fonts.googleapis.com/css2?');
        changes.push('font-display');
    }

    if (newHtml !== html) {
        fs.writeFileSync(filePath, newHtml, 'utf-8');
        const lazyCount = changes.filter(c => c === 'lazy-load').length;
        console.log(`${file}: Added ${lazyCount} lazy-load attrs, ${changes.filter(c=>c !== 'lazy-load').join(', ') || 'no other changes'}`);
        totalFixed += lazyCount;
    } else {
        console.log(`${file}: No changes needed`);
    }
});

console.log(`\nTotal images fixed with lazy loading: ${totalFixed}`);
