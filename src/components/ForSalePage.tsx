
import { useBuilds } from '@/contexts/BuildsContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ExternalLink, DollarSign } from 'lucide-react'
import { Link } from 'react-router-dom'

function ForSalePage() {
  const { backendBuilds } = useBuilds()
  
  // Filter builds that are marked for sale
  const forSaleBuilds = backendBuilds.filter(build => build.forSale?.onMarket)

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(price)
  }

  const getImageUrl = (url: string): string => {
    if (url.startsWith('http')) {
      return url
    }
    // For local development, use backend server
    if (url.startsWith('/uploads/') || url.includes('/uploads/')) {
      return getImageUrl(url)
    }
    return url.startsWith('/') ? url : `/${url}`
  }

  return (
    <div className="bg-muted/50 min-h-[100vh] flex-1 rounded-xl md:min-h-min text-start">
      <h1 className="text-3xl font-bold mb-6 text-center">UgliBoats For Sale</h1>
      
      {/* Builds for Sale Section */}
      {forSaleBuilds.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4 text-center">Community Builds for Sale</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {forSaleBuilds.map((build) => (
              <Card key={build.id} className="relative">
                <Badge className="absolute top-2 right-2 bg-green-600 hover:bg-green-700">
                  FOR SALE
                </Badge>
                
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span className="truncate">{build.buildName}</span>
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">by {build.name}</p>
                  {build.forSale && (
                    <div className="flex items-center gap-2 text-lg font-bold text-green-600">
                      <DollarSign className="h-5 w-5" />
                      {formatPrice(build.forSale.price)}
                    </div>
                  )}
                </CardHeader>

                <CardContent className="space-y-4">
                  {build.images.length > 0 && (
                    <img
                      src={getImageUrl(build.images[0].url)}
                      alt={build.images[0].alt}
                      className="w-full h-48 object-cover rounded"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                      }}
                    />
                  )}
                  
                  <p className="text-sm text-gray-600 line-clamp-3">
                    {build.introText}
                  </p>

                  <div className="flex flex-col gap-2">
                    <Link to={`/builds/${encodeURIComponent(build.name)}`}>
                      <Button variant="outline" className="w-full">
                        View Full Build
                      </Button>
                    </Link>
                    
                    {build.forSale && (
                      <div className="flex gap-2">
                        {build.forSale.links.craigslistUrl && (
                          <Button
                            variant="secondary"
                            size="sm"
                            className="flex-1"
                            onClick={() => window.open(build.forSale!.links.craigslistUrl, '_blank')}
                          >
                            <ExternalLink className="h-4 w-4 mr-1" />
                            Craigslist
                          </Button>
                        )}
                        
                        {build.forSale.links.facebookUrl && (
                          <Button
                            variant="secondary"
                            size="sm"
                            className="flex-1"
                            onClick={() => window.open(build.forSale!.links.facebookUrl, '_blank')}
                          >
                            <ExternalLink className="h-4 w-4 mr-1" />
                            Facebook
                          </Button>
                        )}
                        
                        {build.forSale.links.otherUrl && (
                          <Button
                            variant="secondary"
                            size="sm"
                            className="flex-1"
                            onClick={() => window.open(build.forSale!.links.otherUrl, '_blank')}
                          >
                            <ExternalLink className="h-4 w-4 mr-1" />
                            Other
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Original Content */}
      <div className="border-t pt-8">
        <h2 className="text-2xl font-bold mb-4 text-center">Looking for UgliBoat Hulls?</h2>
        <p className="text-lg text-center mb-4 ">
          You have finally found your very own UgliBoat. These are made of UNOBTANIUM.... as rare as hens teeth..... grab yours now or regret it later. 
          <br />
          <br />
          We have these last 3 unmolested UgliBoats left. We are in the DFW area of North Texas. Call UgliGreg @ 817-808-8970
        </p>
        <img src='/ugli-boats-v2/IMAGES/Last-Ugliboats-2023.jpg'/>
        <br/>
        <img src='/ugli-boats-v2/IMAGES/UgliBoat-Flooring - 2023.jpg'/>
        <br/>
        <br/>
        <div className="flex items-center p-4">
            <span className="relative flex size-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex size-3 rounded-full bg-red-500"></span>
            </span>
            <p className="ml-2">Notice!</p>
          </div>

          <p className='animate-pulse p-4'>
          If you know where any of these are for sale, PLEASE CONTACT ME AT greg@ugliboats.com or call (817) 808-8970
          <br />
          </p>
          <p className='p-4'>
          Here are the key words that I have had some success with when searching marketplaces: <br/><br/> ponton bridge half-section, ponton bridge boat for sale, bailey bridge boat for sale, big aluminum boat for sale, 18.5' aluminum boat for sale, aluminum military surplus boat for sale, corps of engineers boat for sale, the perfect duck boat for sale, wide aluminum boat for sale, aluminum guide boat for sale, striper boat for sale, very stable boat for sale, aluminum river boat for sale.
          <br />
          </p>
      </div>
    </div>
  )
}

export default ForSalePage