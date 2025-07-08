const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'assets', 'data.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Find the builds array
const buildsRegex = /builds:\s*\[(.*)\],?\s*\n?\}/s;
const match = content.match(buildsRegex);

if (!match) {
  console.error('Could not find builds array in data.tsx');
  process.exit(1);
}

let buildsStr = match[1];

// Add new fields to each build object
// This regex finds each build object in the array
buildsStr = buildsStr.replace(
  /{([^{}]*name:\s*["'][^"']+["'][^{}]*images:\s*\[[\s\S]*?\])}/g,
  (build) => {
    // Only add if not already present
    if (
      build.includes('buildName:') ||
      build.includes('header:') ||
      build.includes('introText:')
    ) {
      return build;
    }
    // Extract the name for buildName and header
    const nameMatch = build.match(/name:\s*["']([^"']+)["']/);
    const name = nameMatch ? nameMatch[1] : '';
    return (
      build.replace(
        /(name:\s*["'][^"']+["']\s*,)/,
        `$1\n  buildName: "${name}",\n  header: "${name} Build",\n  introText: "Intro text for ${name}.",`
      )
    );
  }
);

// Replace the builds array in the original content
const newContent = content.replace(buildsRegex, (full, builds) =>
  full.replace(builds, buildsStr)
);

fs.writeFileSync(filePath, newContent, 'utf8');
console.log('Added buildName, header, and introText to all builds!');