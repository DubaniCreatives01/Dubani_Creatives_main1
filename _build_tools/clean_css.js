const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'montana_clone', 'styles.css');
let css = fs.readFileSync(file, 'utf-8');

// Remove stray \n literal text
css = css.replace('\\n\n', '\n');
css = css.replace('\\n\r\n', '\r\n');

fs.writeFileSync(file, css, 'utf-8');
console.log('Cleaned stray escape character from CSS');
