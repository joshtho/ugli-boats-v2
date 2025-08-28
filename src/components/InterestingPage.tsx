import { getApiUrl, getImageUrl } from '@/config/api'
import { useState, useEffect, useRef } from 'react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel'

// Interfaces for interesting content
interface MediaItem {
  id: string
  type: 'image' | 'video' | 'youtube' | 'vimeo'
  alt: string
  caption: string
  url: string
}

interface InterestingContent {
  id: string
  header: string
  description: string
  media: MediaItem[]
  createdDate: string
}

function InterestingPage() {
  const [interestingContent, setInterestingContent] = useState<InterestingContent[]>([])
  const [loading, setLoading] = useState(true)
  
  // Carousel state - now for ALL media items across all content
  const [open, setOpen] = useState(false)
  const [startIndex, setStartIndex] = useState(0)
  const [carouselIndex, setCarouselIndex] = useState(0)
  const [allMediaItems, setAllMediaItems] = useState<(MediaItem & { contentHeader: string })[]>([])
  const carouselRef = useRef<any>(null)

  // Fetch interesting content from API
  useEffect(() => {
    const fetchInterestingContent = async () => {
      try {
        const response = await fetch(getApiUrl('interesting'))
        if (!response.ok) {
          throw new Error(`Failed to fetch interesting content: ${response.statusText}`)
        }
        const contentData = await response.json()
        
        // Fix media paths for uploaded files when running locally
        const fixedContent = contentData.map((content: InterestingContent) => ({
          ...content,
          media: content.media.map(mediaItem => ({
            ...mediaItem,
            url: mediaItem.url.startsWith('/ugli-boats-v2/uploads/') 
              ? getImageUrl(mediaItem.url)
              : mediaItem.url
          }))
        }))
        
        setInterestingContent(fixedContent)
        
        // Create flat array of all media items with content context
        const flatMediaItems = fixedContent.flatMap((content: InterestingContent) =>
          content.media.map(mediaItem => ({
            ...mediaItem,
            contentHeader: content.header
          }))
        )
        setAllMediaItems(flatMediaItems)
      } catch (error) {
        console.error('Error fetching interesting content:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchInterestingContent()
  }, [])

  const openCarousel = (content: InterestingContent, mediaIndex: number = 0) => {
    // Find the global index of this media item across all content
    let globalIndex = 0
    for (const contentItem of interestingContent) {
      if (contentItem.id === content.id) {
        globalIndex += mediaIndex
        break
      }
      globalIndex += contentItem.media.length
    }
    
    setStartIndex(globalIndex)
    setCarouselIndex(globalIndex)
    setOpen(true)
  }

  const getYoutubeId = (url: string) => {
    const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([^&\n?#]+)/)
    return match ? match[1] : null
  }

  // const getVimeoId = (url: string) => {
  //   const match = url.match(/vimeo\.com\/(?:video\/)?(\d+)/)
  //   return match ? match[1] : null
  // }

  const renderMediaItem = (media: MediaItem, index: number, content: InterestingContent, isClickable = true) => {
    const handleClick = () => {
      if (isClickable) {
        openCarousel(content, index)
      }
    }

    if (media.type === 'image') {
      return (
        <img 
          src={media.url} 
          alt={media.alt}
          className={`object-contain mb-5 max-w-full ${isClickable ? 'cursor-pointer hover:opacity-90 transition-opacity' : ''}`}
          onClick={handleClick}
        />
      )
    } else if (media.type === 'video') {
      return (
        <div className={isClickable ? 'cursor-pointer' : ''} onClick={handleClick}>
          <video 
            src={media.url} 
            className="object-contain mb-5 max-w-full"
            controls={!isClickable}
            muted
          />
        </div>
      )
    } else if (media.type === 'youtube') {
      const youtubeId = getYoutubeId(media.url)
      if (isClickable && youtubeId) {
        // Show thumbnail that opens in carousel
        return (
          <div 
            className="aspect-video max-w-3xl mb-5 cursor-pointer relative group"
            onClick={handleClick}
          >
            <img
              src={`https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`}
              alt={media.alt}
              className="w-full h-full object-cover rounded group-hover:opacity-90 transition-opacity"
            />
            <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center rounded">
              <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center">
                <div className="w-0 h-0 border-l-[8px] border-l-white border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent ml-1"></div>
              </div>
            </div>
          </div>
        )
      } else {
        return (
          <div className="aspect-video max-w-3xl mb-5">
            <iframe  
              title={media.alt}
              src={media.url}
              className="w-full h-full"
              referrerPolicy="strict-origin-when-cross-origin" 
              allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media; web-share"   
              allowFullScreen
            />
          </div>
        )
      }
    } else if (media.type === 'vimeo') {
      if (isClickable) {
        return (
          <div 
            className="aspect-video max-w-3xl mb-5 cursor-pointer"
            onClick={handleClick}
          >
            <iframe  
              title={media.alt}
              src={media.url}
              className="w-full h-full pointer-events-none"
              referrerPolicy="strict-origin-when-cross-origin" 
              allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media; web-share"   
              allowFullScreen
            />
          </div>
        )
      } else {
        return (
          <div className="aspect-video max-w-3xl mb-5">
            <iframe  
              title={media.alt}
              src={media.url}
              className="w-full h-full"
              referrerPolicy="strict-origin-when-cross-origin" 
              allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media; web-share"   
              allowFullScreen
            />
          </div>
        )
      }
    }
  }

  const renderCarouselMediaItem = (media: MediaItem, isActive: boolean) => {
    if (media.type === 'image') {
      return (
        <img
          src={media.url}
          alt={media.alt}
          className="w-full max-w-full max-h-[55vh] object-contain rounded transition-all"
        />
      )
    } else if (media.type === 'video') {
      return (
        <video
          src={media.url}
          controls={isActive}
          autoPlay={isActive}
          muted={!isActive}
          className="w-full max-w-full max-h-[55vh] object-contain rounded transition-all bg-black"
        />
      )
    } else if (media.type === 'youtube') {
      const youtubeId = getYoutubeId(media.url)
      return youtubeId ? (
        <iframe
          src={`https://www.youtube.com/embed/${youtubeId}?autoplay=${isActive ? 1 : 0}`}
          className="w-full max-w-full max-h-[55vh] aspect-video rounded"
          allowFullScreen
          allow="autoplay; encrypted-media"
        />
      ) : null
    } else if (media.type === 'vimeo') {
      return (
        <iframe
          src={media.url}
          className="w-full max-w-full max-h-[55vh] aspect-video rounded"
          allowFullScreen
          allow="autoplay; encrypted-media"
        />
      )
    }
  }

  if (loading) {
    return (
      <div className="bg-muted/50 min-h-[100vh] flex-1 rounded-xl md:min-h-min text-start">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="text-center py-8">Loading interesting content...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-muted/50 min-h-[100vh] flex-1 rounded-xl md:min-h-min text-start">
      <div className="max-w-4xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold mb-4">UgliBoat sightings and interesting miscellaneous material</h1>
        
        {interestingContent.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No interesting content available</div>
        ) : (
          <div className="space-y-8">
            {interestingContent.map((content) => (
              <div key={content.id} className="space-y-4">
                <h2 className="text-xl font-semibold">{content.header}</h2>
                {content.description && (
                  <p className="text-gray-700">{content.description}</p>
                )}
                
                <div className="space-y-4">
                  {content.media.map((media, index) => (
                    <div key={media.id}>
                      {renderMediaItem(media, index, content)}
                      {media.caption && (
                        <p className="text-sm text-gray-600 -mt-4 mb-4">{media.caption}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
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
          {allMediaItems.length > 0 && (
            <div className="relative w-full">
              {/* Media Counter */}
              <div className="absolute top-4 right-4 z-10 bg-black/70 text-white px-3 py-1 rounded-full text-sm font-medium">
                {carouselIndex + 1} of {allMediaItems.length}
              </div>
              
              {/* Content Title */}
              <div className="absolute top-4 left-4 z-10 bg-black/70 text-white px-3 py-1 rounded-full text-sm font-medium max-w-xs truncate">
                {allMediaItems[carouselIndex]?.contentHeader}
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
                  {allMediaItems.map((media, idx) => (
                    <CarouselItem key={`${media.contentHeader}-${media.id}`} className="flex flex-col items-center justify-center">
                      {renderCarouselMediaItem(media, carouselIndex === idx)}
                      {media.caption && (
                        <p className="mt-4 mx-auto px-4 py-2 max-w-xl text-center text-base text-gray-700 bg-white/80 rounded">
                          {media.caption.split('\n').map((line: string, i: number) => (
                            <span key={i}>
                              {line}
                              <br />
                            </span>
                          ))}
                        </p>
                      )}
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

export default InterestingPage