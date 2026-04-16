const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, 'montana_clone', 'styles.css');
let css = fs.readFileSync(targetFile, 'utf-8');

// 1. Grid Ratio Update
css = css.replace(
`@media (min-width: 900px) {
    .personal-about-grid {
        grid-template-columns: 1.2fr 1fr;`,
`@media (min-width: 900px) {
    .personal-about-grid {
        grid-template-columns: 1.6fr 1fr;`
);

// Fallback in case of \r\n
css = css.replace('grid-template-columns: 1.2fr 1fr;', 'grid-template-columns: 1.6fr 1fr;');

// 2. Container Maximum Width + Aspect Ratio
const originalContainer = `.personal-about-image-container {
    width: 100%;
    position: relative;`;
const newContainer = `.personal-about-image-container {
    width: 100%;
    max-width: 440px;
    margin: 0 auto;
    aspect-ratio: 3.5 / 4;
    position: relative;`;

css = css.replace(originalContainer, newContainer);
if (!css.includes('max-width: 440px;')) {
    // try fallback
    css = css.replace('.personal-about-image-container {\r\n    width: 100%;\r\n    position: relative;', newContainer);
    css = css.replace('.personal-about-image-container {\n    width: 100%;\n    position: relative;', newContainer);
}

// 3. Image Height Fix
const originalImg = `.personal-portrait-img {
    width: 100%;
    height: auto;
    display: block;`;
const newImg = `.personal-portrait-img {
    width: 100%;
    height: 100%;
    display: block;`;

css = css.replace(originalImg, newImg);
if (!css.includes('height: 100%;')) {
    css = css.replace('.personal-portrait-img {\r\n    width: 100%;\r\n    height: auto;\r\n    display: block;', newImg);
    css = css.replace('.personal-portrait-img {\n    width: 100%;\n    height: auto;\n    display: block;', newImg);
}

fs.writeFileSync(targetFile, css, 'utf-8');
console.log('CSS updated natively to shrink the image frame!');
