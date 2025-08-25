// scripts/seed.ts
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { fileURLToPath } from 'url';

// Import your actual data from the converted data.ts file
import staticData from '../data/data.js'; // Note: Keep .js extension even for .ts files in ES modules

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// JSON file helpers (same as server)
const dataDir = path.join(__dirname, '../data');
const buildsFile = path.join(dataDir, 'builds.json');

// Define types
interface ImageData {
  alt: string;
  caption: string;
  url: string;
}

interface BuildData {
  name: string;
  buildName: string;
  header: string;
  introText: string;
  forSale?: {
    onMarket: boolean;
    price: number;
    links: {
      craigslistUrl: string;
      facebookUrl: string;
      otherUrl: string;
    };
  };
  images: ImageData[];
}

interface DatabaseBuild extends BuildData {
  id: string;
  createdDate: string;
  isLegacy?: boolean;
}

const writeBuilds = (builds: DatabaseBuild[]): void => {
  try {
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    fs.writeFileSync(buildsFile, JSON.stringify(builds, null, 2));
    console.log(`✅ Wrote ${builds.length} builds to ${buildsFile}`);
  } catch (error) {
    console.error('Error writing builds:', error);
  }
};

const readBuilds = (): DatabaseBuild[] => {
  try {
    if (!fs.existsSync(buildsFile)) return [];
    const data = fs.readFileSync(buildsFile, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading builds:', error);
    return [];
  }
};

// Seed function
async function seedBuilds(): Promise<void> {
  console.log('🌱 Starting database seed...');
  
  // Get static data builds
  const staticBuilds: BuildData[] = staticData.builds;

  // Transform static data to database format (keep same structure as data.tsx)
  const transformedBuilds: DatabaseBuild[] = staticBuilds.map(build => ({
    id: uuidv4(), // Add unique ID for database
    name: build.name,
    buildName: build.buildName,
    header: build.header,
    introText: build.introText,
    images: build.images, // Keep full image objects with alt, caption, url
    createdDate: new Date().toISOString(), // Track when added
    isLegacy: true // Flag to identify original site builds vs new user submissions
  }));

  // Get existing builds
  const existingBuilds = readBuilds();
  
  // Only add builds that don't already exist (by name)
  const existingNames = existingBuilds.map(b => b.name);
  const newBuilds = transformedBuilds.filter(b => !existingNames.includes(b.name));
  
  if (newBuilds.length === 0) {
    console.log('📝 No new builds to seed - all builds already exist');
    return;
  }

  // Add new builds to existing ones
  const allBuilds = [...existingBuilds, ...newBuilds];
  
  // Write to database
  writeBuilds(allBuilds);
  
  console.log(`✅ Seeded ${newBuilds.length} new builds`);
  console.log(`📊 Total builds in database: ${allBuilds.length}`);
}

// Allow running from command line
if (import.meta.url === `file://${process.argv[1]}`) {
  seedBuilds()
    .then(() => {
      console.log('🎉 Seeding completed!');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Seeding failed:', error);
      process.exit(1);
    });
}

export { seedBuilds };
