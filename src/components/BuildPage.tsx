import data from '@/assets/data'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Link, useSearchParams } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import { Grid, List, FileText } from 'lucide-react'

type ViewMode = 'thumbnail' | 'list' | 'all'

function BuildPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [viewMode, setViewMode] = useState<ViewMode>('thumbnail')
  const scrollPositionRef = useRef<number>(0)
  const containerRef = useRef<HTMLDivElement>(null)

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

  // Thumbnail View (current default view)
  const ThumbnailView = () => (
    <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-3">
      {data.builds.map((build, idx) => {
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
                  src={firstImage.url}
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
      {data.builds.map((build, idx) => {
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
                    src={firstImage.url}
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

  // All Builds View (show all boat pages on one page)
  const AllBuildsView = () => (
    <div className="space-y-16">
      {data.builds.map((build, buildIdx) => (
        <div key={buildIdx} className="border-b pb-12 last:border-b-0">
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-2">{build.name} - {build.buildName}</h2>
            <h3 className="italic text-lg mb-4">{build.header}</h3>
            <p className="text-gray-700 mb-6">{build.introText}</p>
            <StatefulLink 
              to={`/builds/${encodeURIComponent(build.name)}`}
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              View Full Build Details →
            </StatefulLink>
          </div>
          
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {build.images.slice(0, 8).map((img, imgIdx) => {
              const isVideo = getMediaType(img.url) === 'video'
              return isVideo ? (
                <div key={imgIdx} className="relative">
                  <video
                    src={img.url}
                    className="w-full h-32 object-cover rounded"
                    controls
                    playsInline
                  />
                  {img.caption && (
                    <p className="text-xs text-gray-600 mt-1 line-clamp-2">{img.caption}</p>
                  )}
                </div>
              ) : (
                <div key={imgIdx}>
                  <img
                    src={img.url}
                    alt={img.alt}
                    className="w-full h-32 object-cover rounded"
                  />
                  {img.caption && (
                    <p className="text-xs text-gray-600 mt-1 line-clamp-2">{img.caption}</p>
                  )}
                </div>
              )
            })}
          </div>
          
          {build.images.length > 8 && (
            <p className="text-sm text-gray-500 mt-4">
              Showing 8 of {build.images.length} images. 
              <StatefulLink 
                to={`/builds/${encodeURIComponent(build.name)}`}
                className="text-blue-600 hover:text-blue-800 ml-1"
              >
                View all →
              </StatefulLink>
            </p>
          )}
        </div>
      ))}
    </div>
  )

  return (
    <div ref={containerRef} className="mx-auto max-w-6xl p-6">
      <h1 className="text-3xl font-bold mb-8 text-center">Builds</h1>
      
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
      {viewMode === 'thumbnail' && <ThumbnailView />}
      {viewMode === 'list' && <ListView />}
      {viewMode === 'all' && <AllBuildsView />}
    </div>
  )
}
export default BuildPage