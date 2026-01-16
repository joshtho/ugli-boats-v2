import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { fileURLToPath } from 'url';

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Gallery sections data - extracted from PhotosPage.tsx
const galleryData = {
  "Historical Ponton": {
    description: "Historical military ponton boats and bridge sections",
    images: Array.from({ length: 28 }, (_, i) => ({
      url: `/ugli-boats-v2/gallery/Fgallery1-${i + 1}.jpg`,
      alt: `Historical Ponton ${i + 1}`,
      caption: `Historical ponton boat image ${i + 1}`
    }))
  },
  "Customized Ponton": {
    description: "Customized and modified ponton boats by enthusiasts",
    images: Array.from({ length: 57 }, (_, i) => ({
      url: `/ugli-boats-v2/gallery/Fgallery2-${i + 1}.jpg`,
      alt: `Customized Ponton ${i + 1}`,
      caption: `Customized ponton boat ${i + 1}`
    })).concat([{
      url: `/ugli-boats-v2/gallery/Fgallery2-18a.jpg`,
      alt: `Customized Ponton 18a`,
      caption: `Customized ponton boat 18a`
    }])
  },
  "Other Military Boats": {
    description: "Various military boats and watercraft",
    images: Array.from({ length: 18 }, (_, i) => ({
      url: `/ugli-boats-v2/gallery/Fgallery3-${i + 1}.jpg`,
      alt: `Military Boat ${i + 1}`,
      caption: `Military boat ${i + 1}`
    })).filter(img => !img.url.includes('Fgallery3-7.jpg')) // Skip missing Fgallery3-7
  },
  "Custom Aluminum Boats": {
    description: "Custom-built aluminum boats and projects",
    images: [{
      url: `/ugli-boats-v2/gallery/Fgallery5-1.jpg`,
      alt: `Custom Aluminum Boat 1`,
      caption: `Custom aluminum boat project`
    }]
  }
};

// Function to create photos array
function createPhotosArray() {
  const photos = [];
  
  // Iterate through each category
  Object.entries(galleryData).forEach(([categoryName, categoryData]) => {
    categoryData.images.forEach((image) => {
      photos.push({
        id: uuidv4(),
        image: image.url,
        alt: image.alt,
        category: categoryName,
        caption: image.caption,
        uploadDate: new Date().toISOString()
      });
    });
  });
  
  return photos;
}

// Function to seed photos.json
function seedPhotos() {
  try {
    const photos = createPhotosArray();
    const photosFilePath = path.join(__dirname, '../data/photos.json');
    
    // Write to photos.json
    fs.writeFileSync(photosFilePath, JSON.stringify(photos, null, 2));
    
    console.log(`✅ Successfully seeded ${photos.length} photos to photos.json`);
    console.log('📁 Categories seeded:');
    
    // Show summary by category
    Object.keys(galleryData).forEach(category => {
      const count = photos.filter(photo => photo.category === category).length;
      console.log(`   - ${category}: ${count} photos`);
    });
    
  } catch (error) {
    console.error('❌ Error seeding photos:', error);
    process.exit(1);
  }
}

// Run the seed function if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedPhotos();
}

export { seedPhotos, createPhotosArray };
