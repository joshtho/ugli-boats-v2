import { useState } from 'react'
import { Dialog, DialogContent } from '@/components/ui/dialog'

// Gallery sections data
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
  "Old Aluminum Boats": {
    description: "Vintage aluminum boats and restorations",
    images: Array.from({ length: 4 }, (_, i) => ({
      url: `/ugli-boats-v2/gallery/Fgallery4-${i + 1}.jpg`,
      alt: `Old Aluminum Boat ${i + 1}`,
      caption: `Vintage aluminum boat ${i + 1}`
    }))
  },
  "Custom Aluminum Boats": {
    description: "Custom-built aluminum boats and projects",
    images: [{
      url: `/ugli-boats-v2/gallery/Fgallery5-1.jpg`,
      alt: `Custom Aluminum Boat 1`,
      caption: `Custom aluminum boat project`
    }]
  }
}

function PhotosPage() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null)

  return (
    <div className="mx-auto max-w-6xl p-6">
      <h1 className="text-3xl font-bold mb-8 text-center">Photo Gallery</h1>
      
      {/* Categories View */}
      <div className="space-y-16">
        {Object.entries(galleryData).map(([sectionName, section], sectionIdx) => (
          <div key={sectionIdx} className="border-b pb-12 last:border-b-0">
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-2">{sectionName}</h2>
              <p className="text-gray-700 mb-6">{section.description}</p>
            </div>
            
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {section.images.map((img, imgIdx) => (
                <div 
                  key={imgIdx}
                  className="cursor-pointer hover:opacity-75 transition-opacity"
                  onClick={() => setSelectedImage(img.url)}
                >
                  <img
                    src={img.url}
                    alt={img.alt}
                    className="w-full h-32 object-cover rounded"
                    onError={(e) => {
                      // Hide broken images
                      e.currentTarget.style.display = 'none'
                    }}
                  />
                  {img.caption && (
                    <p className="text-xs text-gray-600 mt-1 line-clamp-2">{img.caption}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Image Modal */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] w-[95vw] h-[95vh] p-4">
          {selectedImage && (
            <div className="flex items-center justify-center w-full h-full">
              <img
                src={selectedImage}
                alt="Gallery image"
                className="max-w-full max-h-full object-contain cursor-pointer"
                onClick={() => setSelectedImage(null)}
                onLoad={(e) => {
                  // Force high quality rendering
                  const img = e.currentTarget as HTMLImageElement
                  img.style.imageRendering = 'high-quality'
                  // Alternative fallbacks for different browsers
                  img.style.setProperty('image-rendering', '-webkit-optimize-contrast')
                  img.style.setProperty('image-rendering', 'crisp-edges')
                }}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default PhotosPage
