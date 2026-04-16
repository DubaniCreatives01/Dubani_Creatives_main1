const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'montana_clone', 'styles.css');
let css = fs.readFileSync(file, 'utf-8');

// FIX 1: The global `img { max-width: 100%; height: auto; }` is breaking 
// images inside containers that rely on height: 100% + object-fit: cover.
// Replace it with a safer, scoped version.
css = css.replace(
`img {\r\n    max-width: 100%;\r\n    height: auto;\r\n}`,
`/* Global image safety - scoped to avoid breaking object-fit containers */
img:not(.gallery-item-img):not(.project-image):not(.hero-bg-img):not(.portfolio-slide-img):not(.personal-portrait-img):not(.service-icon img) {
    max-width: 100%;
}`
);

// Fallback for \n line endings
css = css.replace(
`img {\n    max-width: 100%;\n    height: auto;\n}`,
`/* Global image safety - scoped to avoid breaking object-fit containers */
img:not(.gallery-item-img):not(.project-image):not(.hero-bg-img):not(.portfolio-slide-img):not(.personal-portrait-img):not(.service-icon img) {
    max-width: 100%;
}`
);

fs.writeFileSync(file, css, 'utf-8');
console.log('Fixed the global img rule that was breaking layouts!');
