// scripts/seedInteresting.js
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// JSON file helpers
const dataDir = path.join(__dirname, '../data');
const interestingFile = path.join(dataDir, 'interesting.json');

const readInteresting = () => {
  try {
    if (!fs.existsSync(interestingFile)) return [];
    const data = fs.readFileSync(interestingFile, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading interesting content:', error);
    return [];
  }
};

const writeInteresting = (interesting) => {
  try {
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    fs.writeFileSync(interestingFile, JSON.stringify(interesting, null, 2));
    console.log(`✅ Wrote ${interesting.length} interesting content items to ${interestingFile}`);
  } catch (error) {
    console.error('Error writing interesting content:', error);
  }
};

// Static content from InterestingPage.tsx
const staticInterestingContent = [
  {
    header: "Removable UgliBoat Engine Bracket",
    description: "A specialized engine bracket designed for UgliBoats that can be easily removed when needed.",
    media: [
      {
        id: uuidv4(),
        type: "image",
        alt: "Removable UgliBoat Engine Bracket",
        caption: "Removable UgliBoat Engine Bracket",
        url: "/ugli-boats-v2/IMAGES/Removable Engine Bracket.jpg"
      }
    ]
  },
  {
    header: "UgliBoat in Africa",
    description: "An UgliBoat pushing a raft across a river in pursuit of the African Tiger Fish.",
    media: [
      {
        id: uuidv4(),
        type: "image",
        alt: "UgliBoat in Africa",
        caption: "An UgliBoat pushing a raft across a river in pursuit of the African Tiger Fish.",
        url: "/ugli-boats-v2/IMAGES/UgliBoat inAfrica.jpg"
      }
    ]
  },
  {
    header: "UgliBoat Documentary Trailer",
    description: "You can watch the trailer below:",
    media: [
      {
        id: uuidv4(),
        type: "vimeo",
        alt: "UgliBoat Documentary Trailer",
        caption: "UgliBoat documentary trailer on Vimeo",
        url: "https://player.vimeo.com/video/248079536?h=c5518f6096"
      }
    ]
  },
  {
    header: "TV Show Life Below Zero",
    description: "UgliBoats featured on the TV show Life Below Zero: Sink or Swim.",
    media: [
      {
        id: uuidv4(),
        type: "image",
        alt: "Life Below Zero: Sink or Swim",
        caption: "TV Show Life Below Zero featuring UgliBoats",
        url: "/ugli-boats-v2/IMAGES/life below zero sink or swim.jpg"
      }
    ]
  }
];

// Seed function
async function seedInteresting() {
  console.log('🌱 Starting interesting content seed...');
  
  // Transform static data to database format
  const transformedInteresting = staticInterestingContent.map(item => ({
    id: uuidv4(),
    header: item.header,
    description: item.description,
    media: item.media,
    createdDate: new Date().toISOString(),
    isLegacy: true // Flag to identify original site content vs new admin content
  }));

  // Get existing interesting content
  const existingInteresting = readInteresting();
  
  // Only add content that doesn't already exist (by header)
  const existingHeaders = existingInteresting.map(i => i.header);
  const newInteresting = transformedInteresting.filter(i => !existingHeaders.includes(i.header));
  
  if (newInteresting.length === 0) {
    console.log('📝 No new interesting content to seed - all content already exists');
    return;
  }

  // Add new interesting content to existing ones
  const allInteresting = [...existingInteresting, ...newInteresting];
  
  // Write to database
  writeInteresting(allInteresting);
  
  console.log(`✅ Seeded ${newInteresting.length} new interesting content items`);
  console.log(`📊 Total interesting content items in database: ${allInteresting.length}`);
}

// Allow running from command line
if (import.meta.url === `file://${process.argv[1]}`) {
  seedInteresting()
    .then(() => {
      console.log('🎉 Interesting content seeding completed!');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Interesting content seeding failed:', error);
      process.exit(1);
    });
}

export { seedInteresting };
