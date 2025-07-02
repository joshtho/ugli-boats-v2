const fs = require('fs');
const path = require('path');

const exts = ['.tsx', '.jsx'];
const base = '/ugli-boats-v2';

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let updated = content
    // Replace src="/IMAGES/...
    .replace(/src="\/IMAGES\//g, `src="${base}/IMAGES/`)
    // Replace src="public/IMAGES/...
    .replace(/src="public\/IMAGES\//g, `src="${base}/IMAGES/`);
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