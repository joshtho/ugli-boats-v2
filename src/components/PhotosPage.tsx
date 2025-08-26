import { useState, useEffect, useRef } from 'react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel'

// Photo interface
interface Photo {
  id: string
  image: string
  alt: string
  category: string
  caption: string
  uploadDate: string
}

function PhotosPage() {
  const [photos, setPhotos] = useState<Photo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Carousel state
  const [open, setOpen] = useState(false)
  const [startIndex, setStartIndex] = useState(0)
  const [carouselIndex, setCarouselIndex] = useState(0)
  const carouselRef = useRef<any>(null)

  // Fetch photos from API on component mount
  useEffect(() => {
    const fetchPhotos = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/photos')
        if (!response.ok) {
          throw new Error(`Failed to fetch photos: ${response.statusText}`)
        }
        const photosData = await response.json()
        
        // Fix image paths for uploaded photos when running locally
        const fixedPhotos = photosData.map((photo: Photo) => ({
          ...photo,
          image: photo.image.startsWith('/ugli-boats-v2/uploads/') 
            ? `http://localhost:3001${photo.image}`
            : photo.image
        }))
        
        setPhotos(fixedPhotos)
      } catch (err) {
        console.error('Error fetching photos:', err)
        setError(err instanceof Error ? err.message : 'Failed to load photos')
      } finally {
        setLoading(false)
      }
    }

    fetchPhotos()
  }, [])

  // Group photos by category
  const photosByCategory = photos.reduce((acc, photo) => {
    if (!acc[photo.category]) {
      acc[photo.category] = []
    }
    acc[photo.category].push(photo)
    return acc
  }, {} as Record<string, Photo[]>)

  // Category descriptions
  const categoryDescriptions: Record<string, string> = {
    "Historical Ponton": "Historical military ponton boats and bridge sections",
    "Customized Ponton": "Customized and modified ponton boats by enthusiasts", 
    "Other Military Boats": "Various military boats and watercraft",
    "Old Aluminum Boats": "Vintage aluminum boats and restorations",
    "Custom Aluminum Boats": "Custom-built aluminum boats and projects"
  }

  // Function to open carousel at specific photo
  const openCarousel = (photoIndex: number) => {
    setStartIndex(photoIndex)
    setCarouselIndex(photoIndex)
    setOpen(true)
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl p-6">
        <h1 className="text-3xl font-bold mb-8 text-center">Photo Gallery</h1>
        <div className="text-center py-12">Loading photos...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="mx-auto max-w-6xl p-6">
        <h1 className="text-3xl font-bold mb-8 text-center">Photo Gallery</h1>
        <div className="text-center py-12 text-red-600">
          Error loading photos: {error}
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl p-6">
      <h1 className="text-3xl font-bold mb-8 text-center">Photo Gallery</h1>
      
      {/* Categories View */}
      <div className="space-y-16">
        {Object.entries(photosByCategory).map(([categoryName, categoryPhotos]) => (
          <div key={categoryName} className="border-b pb-12 last:border-b-0">
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-2">{categoryName}</h2>
              <p className="text-gray-700 mb-6">
                {categoryDescriptions[categoryName] || 'Photo gallery category'}
              </p>
              <p className="text-sm text-gray-500">
                {categoryPhotos.length} photo{categoryPhotos.length !== 1 ? 's' : ''}
              </p>
            </div>
            
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {categoryPhotos.map((photo, photoIndex) => {
                // Calculate global index across all photos
                const globalIndex = photos.findIndex(p => p.id === photo.id)
                
                return (
                  <div 
                    key={photo.id}
                    className="cursor-pointer hover:opacity-75 transition-opacity"
                    onClick={() => openCarousel(globalIndex)}
                  >
                    <img
                      src={photo.image}
                      alt={photo.alt}
                      className="w-full h-32 object-cover rounded"
                      onError={(e) => {
                        // Hide broken images
                        e.currentTarget.style.display = 'none'
                      }}
                    />
                    {photo.caption && (
                      <p className="text-xs text-gray-600 mt-1 truncate">
                        {photo.caption}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Carousel Modal */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className="
            flex flex-col items-center
            w-full
            max-w-[95vw]
            max-h-[95vh]
            sm:max-w-2xl
            md:max-w-4xl
            lg:max-w-5xl
            xl:max-w-6xl
            p-4
            pt-12
            overflow-hidden
          "
        >
          {photos.length > 0 && (
            <div className="relative w-full">
              {/* Picture Counter */}
              <div className="absolute top-4 right-4 z-10 bg-black/70 text-white px-3 py-1 rounded-full text-sm font-medium">
                {carouselIndex + 1} of {photos.length}
              </div>
              
              <Carousel
                opts={{ startIndex }}
                className="w-full"
                setApi={api => {
                  if (api) {
                    carouselRef.current = api
                    api.on('select', () => setCarouselIndex(api.selectedScrollSnap()))
                    setCarouselIndex(api.selectedScrollSnap())
                  }
                }}
              >
                <CarouselContent>
                  {photos.map((photo, idx) => (
                    <CarouselItem key={photo.id} className="flex flex-col items-center justify-center">
                      <img
                        src={photo.image}
                        alt={photo.alt}
                        className="
                          w-full
                          max-w-full
                          max-h-[55vh]
                          object-contain
                          rounded
                          transition-all
                        "
                        onLoad={(e) => {
                          // Force high quality rendering
                          const img = e.currentTarget as HTMLImageElement
                          img.style.imageRendering = 'high-quality'
                          // Alternative fallbacks for different browsers
                          img.style.setProperty('image-rendering', '-webkit-optimize-contrast')
                          img.style.setProperty('image-rendering', 'crisp-edges')
                        }}
                      />
                      {photo.caption && (
                        <p
                          className="
                            mt-4
                            mx-auto
                            px-4
                            py-2
                            max-w-xl
                            text-center
                            text-base
                            text-gray-700
                            bg-white/80
                            rounded
                          "
                        >
                          {photo.caption.split('\n').map((line: string, i: number) => (
                            <span key={i}>
                              {line}
                              <br />
                            </span>
                          ))}
                        </p>
                      )}
                      {/* Photo details */}
                      {/* <div className="mt-2 text-center">
                        <p className="text-sm text-gray-600 font-medium">{photo.category}</p>
                        <p className="text-xs text-gray-500">{photo.alt}</p>
                      </div> */}
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious />
                <CarouselNext />
              </Carousel>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default PhotosPage
