import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel'
import { Link, useSearchParams } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import { Grid, List, FileText, Search } from 'lucide-react'
import { useBuilds } from '@/contexts/BuildsContext'

type ViewMode = 'thumbnail' | 'list' | 'all'
type SortMode = 'newest' | 'owner-alpha' | 'boat-alpha'

function BuildPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [viewMode, setViewMode] = useState<ViewMode>('thumbnail')
  const [sortMode, setSortMode] = useState<SortMode>('newest')
  const [searchTerm, setSearchTerm] = useState('')
  const [open, setOpen] = useState(false)
  const [startIndex, setStartIndex] = useState(0)
  const [currentBuild, setCurrentBuild] = useState<any>(null)
  const [carouselIndex, setCarouselIndex] = useState(0)
  const scrollPositionRef = useRef<number>(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const carouselRef = useRef<any>(null)
  
  // Use the builds context instead of local state
  const { backendBuilds, loading, error } = useBuilds()
  const allBuilds = backendBuilds.map(build => ({
    name: build.name,
    buildName: build.buildName,
    header: build.header,
    introText: build.introText,
    createdDate: build.createdDate, // Include createdDate for sorting
    images: build.images.map(img => ({
      alt: build.buildName || 'Build image',
      caption: img.caption || '',
      url: img.url
    }))
  }))

  // Filter builds based on search term - match beginning of names only
  const filteredBuilds = allBuilds.filter(build => 
    build.name.toLowerCase().startsWith(searchTerm.toLowerCase()) ||
    build.buildName.toLowerCase().startsWith(searchTerm.toLowerCase())
  )

  // Sort builds based on sort mode
  const sortedBuilds = [...filteredBuilds].sort((a, b) => {
    switch (sortMode) {
      case 'newest':
        // Sort by creation date, newest first
        return new Date(b.createdDate || 0).getTime() - new Date(a.createdDate || 0).getTime()
      case 'owner-alpha':
        // Sort alphabetically by owner name
        return a.name.localeCompare(b.name)
      case 'boat-alpha':
        // Sort alphabetically by boat name
        return a.buildName.localeCompare(b.buildName)
      default:
        return 0
    }
  })

  // Initialize view mode from URL params
  useEffect(() => {
    const viewParam = searchParams.get('view') as ViewMode
    const scrollParam = searchParams.get('scroll')
    
    if (viewParam && ['thumbnail', 'list', 'all'].includes(viewParam)) {
      setViewMode(viewParam)
    } else {
      // Fallback to sessionStorage if no URL params
      const savedState = sessionStorage.getItem('buildsState')
      if (savedState) {
        try {
          const { view } = JSON.parse(savedState)
          if (view && ['thumbnail', 'list', 'all'].includes(view)) {
            setViewMode(view)
          }
        } catch (e) {
          // Invalid JSON, ignore
        }
      }
    }
    
    // Restore scroll position after a short delay to ensure content is rendered
    if (scrollParam) {
      const scrollPosition = parseInt(scrollParam, 10)
      setTimeout(() => {
        window.scrollTo(0, scrollPosition)
      }, 100)
    } else {
      // Fallback to sessionStorage
      const savedState = sessionStorage.getItem('buildsState')
      if (savedState) {
        try {
          const { scroll } = JSON.parse(savedState)
          if (scroll) {
            setTimeout(() => {
              window.scrollTo(0, scroll)
            }, 100)
          }
        } catch (e) {
          // Invalid JSON, ignore
        }
      }
    }
    
    // Clear sessionStorage after restoring
    sessionStorage.removeItem('buildsState')
  }, [searchParams])

  // Update URL when view mode changes
  const handleViewModeChange = (newViewMode: ViewMode) => {
    setViewMode(newViewMode)
    const newSearchParams = new URLSearchParams(searchParams)
    newSearchParams.set('view', newViewMode)
    // Remove scroll param when changing views
    newSearchParams.delete('scroll')
    setSearchParams(newSearchParams)
  }

  // Save scroll position before navigating
  const handleBuildClick = () => {
    scrollPositionRef.current = window.scrollY
    const currentParams = new URLSearchParams(searchParams)
    currentParams.set('view', viewMode)
    currentParams.set('scroll', scrollPositionRef.current.toString())
    
    // Store the current state in sessionStorage as backup
    sessionStorage.setItem('buildsState', JSON.stringify({
      view: viewMode,
      scroll: scrollPositionRef.current
    }))
  }

  // Helper to get media type
  const getMediaType = (url: string): 'image' | 'video' =>
    url.toLowerCase().endsWith('.mp4') ? 'video' : 'image'

  // Helper to get proper image URL for different environments
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

  // Enhanced Link component that preserves state
  const StatefulLink = ({ to, children, className }: { to: string, children: React.ReactNode, className?: string }) => {
    const buildUrl = () => {
      const currentParams = new URLSearchParams(searchParams)
      currentParams.set('view', viewMode)
      currentParams.set('scroll', window.scrollY.toString())
      return `${to}?${currentParams.toString()}`
    }

    return (
      <Link
        to={buildUrl()}
        className={className}
        onClick={handleBuildClick}
      >
        {children}
      </Link>
    )
  }

  // Simple universal loading component
  const LoadingBuilds = () => (
    <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-3">
      {Array.from({ length: 6 }).map((_, idx) => (
        <Card key={idx} className="flex flex-col h-full shadow-md border border-gray-200 bg-white">
          <Skeleton className="w-full h-40 rounded-t" />
          <CardHeader className="flex-1 flex items-center justify-center">
            <Skeleton className="h-6 w-3/4" />
          </CardHeader>
          <CardContent />
        </Card>
      ))}
    </div>
  )

  // Thumbnail View (current default view)
  const ThumbnailView = () => (
    <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-3">
      {sortedBuilds.map((build, idx) => {
        const firstImage = build.images[0]
        return (
          <StatefulLink
            key={idx}
            to={`/builds/${encodeURIComponent(build.name)}`}
            className="block"
          >
            <Card className="flex flex-col h-full shadow-md border border-gray-200 hover:shadow-xl transition-shadow duration-200 bg-white">
              {firstImage && (
                <img
                  src={getImageUrl(firstImage.url)}
                  alt={firstImage.alt}
                  className="w-full h-40 object-cover rounded-t"
                />
              )}
              <CardHeader className="flex-1 flex items-center justify-center">
                <CardTitle className="text-center text-lg font-semibold">{build.name}</CardTitle>
              </CardHeader>
              <CardContent />
            </Card>
          </StatefulLink>
        )
      })}
    </div>
  )

  // List View (Craigslist-style)
  const ListView = () => (
    <div className="space-y-4">
      {sortedBuilds.map((build, idx) => {
        const firstImage = build.images[0]
        return (
          <StatefulLink
            key={idx}
            to={`/builds/${encodeURIComponent(build.name)}`}
            className="block"
          >
            <Card className="hover:shadow-lg transition-shadow duration-200 bg-white">
              <div className="flex p-4 gap-4">
                {firstImage && (
                  <img
                    src={getImageUrl(firstImage.url)}
                    alt={firstImage.alt}
                    className="w-32 h-24 object-cover rounded flex-shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-xl font-semibold mb-2 text-blue-600 hover:text-blue-800">
                    {build.name}
                  </CardTitle>
                  <p className="text-sm text-gray-600 mb-1 font-medium">{build.buildName}</p>
                  <p className="text-sm text-gray-700 line-clamp-2">
                    {build.introText || build.header}
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    {build.images.length} image{build.images.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
            </Card>
          </StatefulLink>
        )
      })}
    </div>
  )

  // All Builds View (show full boat page layout for each build)
  const AllBuildsView = () => (
    <div className="space-y-24">
      {sortedBuilds.map((build, buildIdx) => (
        <div key={buildIdx} className="border-b pb-16 last:border-b-0">
          {/* Build Header */}
          <h2 className="text-3xl font-bold mb-5 text-center">{build.name} - {build.buildName || build.name}</h2>
          <h3 className='italic text-xl mb-10 text-center'>{build.header}</h3>
          
          {/* Mobile Layout: Intro first, then images */}
          <div className="block md:hidden mb-8">
            {/* Intro Text - Mobile */}
            {build.introText && (
              <div className="mb-6">
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
            
            {/* Images - Mobile */}
            <div className="grid gap-8 sm:grid-cols-2">
              {build.images.map((img: any, imgIdx: number) => {
                const fullImageUrl = getImageUrl(img.url)
                const isVideo = getMediaType(fullImageUrl) === 'video'
                
                return isVideo ? (
                  <div
                    key={imgIdx}
                    className="relative w-full h-40 bg-black rounded cursor-pointer overflow-hidden"
                    onClick={() => {
                      setStartIndex(imgIdx)
                      setCurrentBuild(build)
                      setOpen(true)
                    }}
                  >
                    <video
                      src={fullImageUrl}
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
                    key={imgIdx}
                    src={fullImageUrl}
                    alt={img.alt || `Image ${imgIdx + 1}`}
                    className="w-full h-40 object-cover rounded cursor-pointer transition-transform hover:scale-105"
                    onClick={() => {
                      setStartIndex(imgIdx)
                      setCurrentBuild(build)
                      setOpen(true)
                    }}
                  />
                )
              })}
            </div>
          </div>

          {/* Desktop Layout: Side by side */}
          <div className="hidden md:grid grid-cols-3 gap-8">
            {/* Images - Desktop */}
            <div className="col-span-2">
              <div className="grid gap-8 sm:grid-cols-2">
                {build.images.map((img: any, imgIdx: number) => {
                  const fullImageUrl = getImageUrl(img.url)
                  const isVideo = getMediaType(fullImageUrl) === 'video'
                  
                  return isVideo ? (
                    <div
                      key={imgIdx}
                      className="relative w-full h-40 bg-black rounded cursor-pointer overflow-hidden"
                      onClick={() => {
                        setStartIndex(imgIdx)
                        setCurrentBuild(build)
                        setOpen(true)
                      }}
                    >
                      <video
                        src={fullImageUrl}
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
                      key={imgIdx}
                      src={fullImageUrl}
                      alt={img.alt || `Image ${imgIdx + 1}`}
                      className="w-full h-40 object-cover rounded cursor-pointer transition-transform hover:scale-105"
                      onClick={() => {
                        setStartIndex(imgIdx)
                        setCurrentBuild(build)
                        setOpen(true)
                      }}
                    />
                  )
                })}
              </div>
            </div>
            
            {/* Intro Text - Desktop */}
            {build.introText && (
              <div className="col-span-1 flex flex-col justify-start">
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
        </div>
      ))}
    </div>
  )

  return (
    <div ref={containerRef} className="mx-auto max-w-6xl p-6">
      <h1 className="text-3xl font-bold mb-8 text-center">Builds</h1>
      
      {/* Search and Sort Controls */}
      <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mb-6">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            type="text"
            placeholder="Search builds by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 w-full"
          />
        </div>
        <div className="w-full max-w-48">
          <Select value={sortMode} onValueChange={(value: SortMode) => setSortMode(value)}>
            <SelectTrigger>
              <SelectValue placeholder="Sort by..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="owner-alpha">Owner A-Z</SelectItem>
              <SelectItem value="boat-alpha">Boat Name A-Z</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {/* Results count */}
      {searchTerm && (
        <div className="text-center text-gray-600 mb-4">
          {sortedBuilds.length} build{sortedBuilds.length !== 1 ? 's' : ''} found for "{searchTerm}"
        </div>
      )}
      
      {/* View Mode Toggle */}
      <div className="flex justify-center mb-8">
        <div className="flex bg-gray-100 rounded-lg p-1">
          <Button
            variant={viewMode === 'thumbnail' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => handleViewModeChange('thumbnail')}
            className="flex items-center gap-2"
          >
            <Grid size={16} />
            Thumbnail
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => handleViewModeChange('list')}
            className="flex items-center gap-2"
          >
            <List size={16} />
            List
          </Button>
          <Button
            variant={viewMode === 'all' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => handleViewModeChange('all')}
            className="flex items-center gap-2"
          >
            <FileText size={16} />
            All Builds
          </Button>
        </div>
      </div>

      {/* Render current view */}
      {loading ? (
        <LoadingBuilds />
      ) : error ? (
        <div className="text-center py-8">
          <p className="text-red-600 mb-4">Error loading builds: {error}</p>
          <Button onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      ) : sortedBuilds.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600 text-lg mb-4">
            {searchTerm ? `No builds found matching "${searchTerm}"` : 'No builds available'}
          </p>
          {searchTerm && (
            <Button 
              onClick={() => setSearchTerm('')}
              variant="outline"
            >
              Clear Search
            </Button>
          )}
        </div>
      ) : (
        <>
          {viewMode === 'thumbnail' && <ThumbnailView />}
          {viewMode === 'list' && <ListView />}
          {viewMode === 'all' && <AllBuildsView />}
        </>
      )}

      {/* Image Modal Dialog */}
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
          {currentBuild && currentBuild.images.length > 0 && (
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
                {currentBuild.images.map((img: any, idx: number) => {
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
                  
                  return (
                    <CarouselItem key={idx} className="flex flex-col items-center justify-center">
                      {type === 'image' ? (
                        <img
                          src={fullImageUrl}
                          alt={imageAlt}
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
                          src={fullImageUrl}
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
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
export default BuildPage