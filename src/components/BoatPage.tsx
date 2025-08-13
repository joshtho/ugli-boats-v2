import { useParams } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel'
import { useBuilds } from '@/contexts/BuildsContext'

function BoatPage() {
  const { name } = useParams()
  const [build, setBuild] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [startIndex, setStartIndex] = useState(0)
  const [carouselIndex, setCarouselIndex] = useState(0)
  const carouselRef = useRef<any>(null)
  
  // Use builds context instead of static data
  const { backendBuilds, loading: buildsLoading } = useBuilds()

  useEffect(() => {
    setLoading(true)
    // Look for build by name (which is actually the owner name in our structure)
    const found = backendBuilds.find(b => b.name === name)
    setBuild(found || null)
    setLoading(buildsLoading)
  }, [name, backendBuilds, buildsLoading])

  if (loading) return <div>Loading...</div>
  if (!build) return <div>Boat not found</div>

  // Helper to get proper image URL - same as other components
  const getImageUrl = (url: string): string => {
    if (url.startsWith('http')) {
      return url
    }
    // For local development, use backend server
    if (url.startsWith('/uploads/') || url.includes('/uploads/')) {
      return `http://localhost:3001${url}`
    }
    return url.startsWith('/') ? url : `/${url}`
  }

  // Helper to get media type
  const getMediaType = (url: string): 'image' | 'video' =>
    url.toLowerCase().endsWith('.mp4') || url.toLowerCase().includes('youtu.be') || url.toLowerCase().includes('youtube.com') ? 'video' : 'image'

  // Helper to extract YouTube video ID
  const getYoutubeId = (url: string): string | null => {
    if (url.includes('youtu.be/')) {
      return url.split('youtu.be/')[1].split('?')[0]
    }
    if (url.includes('youtube.com/watch?v=')) {
      return url.split('v=')[1].split('&')[0]
    }
    return null
  }

  return (
    <div className="mx-auto max-w-full p-6">
      <h1 className="text-3xl font-bold mb-5 text-center">{build.name} - {build.buildName}</h1>
      
      {/* Show header when no introText - positioned after main title */}
      {!build.introText?.trim() && build.header && (
        <h2 className="italic text-xl mb-8 text-center text-gray-600">{build.header}</h2>
      )}
      
      {/* Mobile & Medium: Show intro text first, Large+: Use grid layout */}
      <div className="block lg:hidden mb-8">
        {/* Intro Text - Mobile & Medium (shows first) */}
        {/* Jump to Images button for long text */}
        {build.introText.length > 1000 && (
          <div className="text-center mt-4 mb-6">
            <button
              onClick={() => {
                const thumbnailSection = document.getElementById('thumbnail-section')
                thumbnailSection?.scrollIntoView({ behavior: 'smooth', block: 'start' })
              }}
              className="bg-green-700 hover:bg-green-900 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Jump to Images ↓
            </button>
          </div>
        )}
        {build.introText && (
          <div className="mb-6">
            <h1 className='italic text-xl font-stretch-20% mb-10 text-center'>{build.header}</h1>
            <p className="text-lg text-center text-gray-700 bg-white/80 rounded p-4 shadow">
              {build.introText.split('\n').map((line: string, i: number) => (
                <span key={i}>
                  {line}
                  <br />
                </span>
              ))}
            </p>
          </div>
        )}
        
        {/* Images - Mobile & Medium (shows after intro) */}
        <div id="thumbnail-section" className="grid gap-8 sm:grid-cols-2">
          {build.images.map((img: any, idx: number) => {
            const fullImageUrl = getImageUrl(img.url)
            const isVideo = getMediaType(fullImageUrl) === 'video'
            const youtubeId = getYoutubeId(img.url)
            
            return isVideo ? (
              <div
              key={idx}
              className="relative w-full h-40 bg-black rounded cursor-pointer overflow-hidden"
              onClick={() => {
                setStartIndex(idx)
                setOpen(true)
              }}
              >
                {youtubeId ? (
                  <iframe
                    src={`https://www.youtube.com/embed/${youtubeId}`}
                    className="w-full h-full"
                    allowFullScreen
                  />
                ) : (
                  <video
                    src={fullImageUrl}
                    className="w-full h-full object-cover"
                    muted
                    playsInline
                    preload="metadata"
                  />
                )}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <svg className="w-12 h-12 text-white opacity-80" fill="currentColor" viewBox="0 0 24 24">
                    <polygon points="9.5,7.5 16.5,12 9.5,16.5" />
                  </svg>
                </div>
              </div>
            ) : (
              <img
              key={idx}
              src={fullImageUrl}
              alt={img.alt}
              className="w-full h-40 object-cover rounded cursor-pointer transition-transform hover:scale-105"
              onClick={() => {
                setStartIndex(idx)
                setOpen(true)
              }}
              />
            )
          })}
        </div>
      </div>

      {/* Large Desktop: Grid layout (intro text on right side) */}
      <div className={`hidden lg:grid ${build.introText?.trim() ? 'grid-cols-2' : 'grid-cols-1'} gap-8`}>
        {/* Thumbnails */}
        <div className="col-span-1">
          <div className={`grid gap-8 ${build.introText?.trim() ? 'sm:grid-cols-2' : 'sm:grid-cols-2 md:grid-cols-3'}`}>
            {build.images.map((img: any, idx: number) => {
              const fullImageUrl = getImageUrl(img.url)
              const isVideo = getMediaType(fullImageUrl) === 'video'
              const youtubeId = getYoutubeId(img.url)
              
              return isVideo ? (
                <div
                key={idx}
                className="relative w-full h-40 bg-black rounded cursor-pointer overflow-hidden"
                onClick={() => {
                  setStartIndex(idx)
                  setOpen(true)
                }}
                >
                  {youtubeId ? (
                    <iframe
                      src={`https://www.youtube.com/embed/${youtubeId}`}
                      className="w-full h-full"
                      allowFullScreen
                    />
                  ) : (
                    <video
                      src={fullImageUrl}
                      className="w-full h-full object-cover"
                      muted
                      playsInline
                      preload="metadata"
                    />
                  )}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <svg className="w-12 h-12 text-white opacity-80" fill="currentColor" viewBox="0 0 24 24">
                      <polygon points="9.5,7.5 16.5,12 9.5,16.5" />
                    </svg>
                  </div>
                </div>
              ) : (
                <img
                key={idx}
                src={fullImageUrl}
                alt={img.alt}
                className="w-full h-40 object-cover rounded cursor-pointer transition-transform hover:scale-105"
                onClick={() => {
                  setStartIndex(idx)
                  setOpen(true)
                }}
                />
              )
            })}
          </div>
        </div>
        {/* Intro Text - Desktop */}
        {build.introText?.trim() && (
          <div className="col-span-1 flex flex-col justify-start">
            <h1 className='italic text-xl font-stretch-20% mb-10 text-center'>{build.header}</h1>
            <p className="text-lg text-left text-gray-700 bg-white/80 rounded p-4 shadow">
              {build.introText.split('\n').map((line: string, i: number) => (
                <span key={i}>
                  {line}
                  <br />
                </span>
              ))}
            </p>
          </div>
        )}
      </div>
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
          {build.images.length > 0 && (
            <div className="relative w-full">
              {/* Picture Counter */}
              <div className="absolute top-4 right-4 z-10 bg-black/70 text-white px-3 py-1 rounded-full text-sm font-medium">
                {carouselIndex + 1} of {build.images.length}
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
                {build.images.map((img: any, idx: number) => {
                  // Handle both old format (string) and new format (object)
                  let imageUrl = ''
                  let imageAlt = `Image ${idx + 1}`
                  let imageCaption = ''
                  
                  if (typeof img === 'string') {
                    imageUrl = img
                  } else if (img && typeof img === 'object' && img.url) {
                    imageUrl = img.url
                    imageAlt = img.alt || imageAlt
                    imageCaption = img.caption || ''
                  }
                  
                  const fullImageUrl = getImageUrl(imageUrl)
                  const type = getMediaType(fullImageUrl)
                  const youtubeId = getYoutubeId(imageUrl)
                  
                  return (
                    <CarouselItem key={idx} className="flex flex-col items-center justify-center">
                      {type === 'image' ? (
                        <img
                          src={fullImageUrl}
                          alt={imageAlt}
                          className="
                            w-full
                            max-w-full
                            max-h-[55vh]
                            object-contain
                            rounded
                            transition-all
                          "
                        />
                      ) : youtubeId ? (
                        <iframe
                          src={`https://www.youtube.com/embed/${youtubeId}?autoplay=${carouselIndex === idx ? 1 : 0}`}
                          className="
                            w-full
                            max-w-full
                            max-h-[55vh]
                            aspect-video
                            rounded
                          "
                          allowFullScreen
                          allow="autoplay; encrypted-media"
                        />
                      ) : (
                        <video
                          src={fullImageUrl}
                          controls={carouselIndex === idx}
                          autoPlay={carouselIndex === idx}
                          muted={carouselIndex !== idx}
                          className="
                            w-full
                            max-w-full
                            max-h-[55vh]
                            object-contain
                            rounded
                            transition-all
                            bg-black
                          "
                        />
                      )}
                      {imageCaption && (
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
                            
                          "
                        >
                          {imageCaption.split('\n').map((line: string, i: number) => (
                            <span key={i}>
                              {line}
                              <br />
                            </span>
                          ))}
                        </p>
                      )}
                    </CarouselItem>
                  )
                })}
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

export default BoatPage