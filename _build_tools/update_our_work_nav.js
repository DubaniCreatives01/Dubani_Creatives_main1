const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'montana_clone');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

files.forEach(file => {
    const target = path.join(dir, file);
    let html = fs.readFileSync(target, 'utf-8');
    let updated = false;

    // Normal Desktop
    const dOrig = '<a href="projects.html" class="nav-link env-business">Projects</a>';
    const dNew = '<a href="projects.html" class="nav-link env-business">Our work</a>';
    if (html.includes(dOrig)) { html = html.replace(dOrig, dNew); updated = true; }

    // Active Desktop
    const aOrig = '<a href="projects.html" class="nav-link active env-business">Projects</a>';
    const aNew = '<a href="projects.html" class="nav-link active env-business">Our work</a>';
    if (html.includes(aOrig)) { html = html.replace(aOrig, aNew); updated = true; }

    // Mobile
    const mOrig = '<a href="projects.html" class="mobile-nav-link env-business">Projects</a>';
    const mNew = '<a href="projects.html" class="mobile-nav-link env-business">Our work</a>';
    if (html.includes(mOrig)) { html = html.replace(mOrig, mNew); updated = true; }

    // Mobile Active
    const maOrig = '<a href="projects.html" class="mobile-nav-link active env-business">Projects</a>';
    const maNew = '<a href="projects.html" class="mobile-nav-link active env-business">Our work</a>';
    if (html.includes(maOrig)) { html = html.replace(maOrig, maNew); updated = true; }

    if (updated) {
        fs.writeFileSync(target, html, 'utf-8');
        console.log(`Updated nav logic in ${file}`);
    }
});
