const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'montana_clone');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

files.forEach(file => {
    const target = path.join(dir, file);
    let html = fs.readFileSync(target, 'utf-8');

    // Desktop Nav
    const desktopOriginal = '<a href="services.html" class="nav-link">Services</a>';
    const desktopNew = '<a href="services.html" class="nav-link env-business">Services</a>\n                        <a href="cv.html" class="nav-link env-personal">Resume / CV</a>';
    
    // Mobile Nav
    const mobileOriginal = '<a href="services.html" class="mobile-nav-link">Services</a>';
    const mobileNew = '<a href="services.html" class="mobile-nav-link env-business">Services</a>\n            <a href="cv.html" class="mobile-nav-link env-personal">Resume / CV</a>';

    let updated = false;

    if (html.includes(desktopOriginal)) {
        html = html.replace(desktopOriginal, desktopNew);
        updated = true;
    }
    if (html.includes(mobileOriginal)) {
        html = html.replace(mobileOriginal, mobileNew);
        updated = true;
    }

    if (updated) {
        fs.writeFileSync(target, html, 'utf-8');
        console.log(`Updated navigation in ${file}`);
    }
});
