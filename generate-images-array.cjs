const fs = require('fs');
const path = require('path');

const buildName = "William Shelton Build";
const imagesDir = path.join(__dirname, 'public', 'IMAGES', 'WilliamSheltonBuild');
const basePath = '/ugli-boats-v2/IMAGES/WilliamSheltonBuild/';

const files = fs.readdirSync(imagesDir).filter(f =>
  /\.(jpg|jpeg|png|bmp|gif|webp)$/i.test(f)
);

const imagesArray = files.map(filename => ({
  alt: filename.replace(/\.[^/.]+$/, ''), // filename without extension
  caption: "",
  url: basePath + filename
}));

console.log(`{
  name: "${buildName}",
  images: ${JSON.stringify(imagesArray, null, 2)}
},`);