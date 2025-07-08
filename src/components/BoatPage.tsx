import { useParams } from 'react-router-dom'
import data from '@/assets/data'
import { useEffect, useRef, useState } from 'react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel'

// type Media = { url: string; alt: string; type: 'image' | 'video' }

function BoatPage() {
  const { name } = useParams()
  const [build, setBuild] = useState<typeof data.builds[0] | null>(null)
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [startIndex, setStartIndex] = useState(0)
  const [carouselIndex, setCarouselIndex] = useState(0)
  const carouselRef = useRef<any>(null)

  useEffect(() => {
    setLoading(true)
    const found = data.builds.find(b => b.name === name)
    setBuild(found || null)
    setLoading(false)
  }, [name])

  if (loading) return <div>Loading...</div>
  if (!build) return <div>Boat not found</div>

  // Helper to get media type
  const getMediaType = (url: string): 'image' | 'video' =>
    url.toLowerCase().endsWith('.mp4') ? 'video' : 'image'

  return (
    <div className="mx-auto max-w-4xl p-6">
      <h1 className="text-3xl font-bold mb-5 text-center">{build.name} - {build.buildName}</h1>
      <h1 className='italic text-xl font-stretch-20% mb-10 text-center'>{build.header}</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Thumbnails */}
        <div className="md:col-span-2">
          <div className="grid gap-8 sm:grid-cols-2">
            {build.images.map((img, idx) => {
              const isVideo = getMediaType(img.url) === 'video'
              return isVideo ? (
                <div
                  key={idx}
                  className="relative w-full h-40 bg-black rounded cursor-pointer overflow-hidden"
                  onClick={() => {
                    setStartIndex(idx)
                    setOpen(true)
                  }}
                >
                  <video
                    src={img.url}
                    className="w-full h-full object-cover"
                    muted
                    playsInline
                    preload="metadata"
                  />
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <svg className="w-12 h-12 text-white opacity-80" fill="currentColor" viewBox="0 0 24 24">
                      <polygon points="9.5,7.5 16.5,12 9.5,16.5" />
                    </svg>
                  </div>
                </div>
              ) : (
                <img
                  key={idx}
                  src={img.url}
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
        {/* Intro Text */}
        {build.introText && (
          <div className="md:col-span-1 flex flex-col justify-start">
            <p className="text-lg mb-6 text-center md:text-left text-gray-700 bg-white/80 rounded p-4 shadow">
              {build.introText.split('\n').map((line, i) => (
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
            max-w-full
            sm:max-w-2xl
            md:max-w-3xl
            lg:max-w-5xl
            xl:max-w-6xl
            p-4
            pt-10
          "
        >
          {build.images.length > 0 && (
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
                {build.images.map((img, idx) => {
                  const type = getMediaType(img.url)
                  return (
                    <CarouselItem key={idx} className="flex flex-col items-center justify-center">
                      {type === 'image' ? (
                        <img
                          src={img.url}
                          alt={img.alt}
                          className="
                            w-full
                            max-w-full
                            max-h-[80vh]
                            object-contain
                            rounded
                            transition-all
                          "
                        />
                        
                      ) : (
                        <video
                          src={img.url}
                          controls={carouselIndex === idx}
                          autoPlay={carouselIndex === idx}
                          muted={carouselIndex !== idx}
                          className="
                            w-full
                            max-w-full
                            max-h-[80vh]
                            object-contain
                            rounded
                            transition-all
                            bg-black
                          "
                        />
                      )}
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
                        {img.caption.split('\n').map((line, i) => (
                          <span key={i}>
                            {line}
                            <br />
                          </span>
                        ))}
                      </p>
                    </CarouselItem>
                  )
                })}
              </CarouselContent>
              <CarouselPrevious />
              <CarouselNext />
            </Carousel>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default BoatPage