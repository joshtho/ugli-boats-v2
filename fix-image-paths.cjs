const fs = require('fs');
const path = require('path');

const exts = ['.js', '.ts', '.jsx', '.tsx'];
const base = '/ugli-boats-v2';

// Regex: match any string that starts with /IMAGES/ or public/IMAGES/
const regex = /(['"`])(?:\/|public\/)IMAGES\//g;

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let updated = content.replace(regex, `$1${base}/IMAGES/`);
  if (updated !== content) {
    fs.writeFileSync(filePath, updated, 'utf8');
    console.log(`Fixed: ${filePath}`);
  }
}

function walk(dir) {
  fs.readdirSync(dir).forEach(file => {
    const full = path.join(dir, file);
    if (fs.statSync(full).isDirectory()) {
      walk(full);
    } else if (exts.includes(path.extname(full))) {
      fixFile(full);
    }
  });
}

walk(path.join(__dirname, 'src'));