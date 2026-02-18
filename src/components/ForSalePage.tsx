
import { useBuilds } from '@/contexts/BuildsContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ExternalLink, DollarSign, Phone, MapPin, Mail } from 'lucide-react'
import { Link } from 'react-router-dom'

function ForSalePage() {
  const { backendBuilds } = useBuilds()
  
  // Builds marked for sale (type=build with forSale.onMarket)
  const forSaleBuilds = backendBuilds.filter(build => 
    (!build.type || build.type === 'build') && build.forSale?.onMarket
  )
  
  // Standalone for-sale items (type=for-sale-item)
  const forSaleItems = backendBuilds.filter(build => build.type === 'for-sale-item')

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
      return `${import.meta.env.DEV ? 'http://localhost:3001' : ''}${url}`
    }
    return url.startsWith('/') ? url : `/${url}`
  }

  return (
    <div className="bg-muted/50 min-h-[100vh] flex-1 rounded-xl md:min-h-min text-start">
      <h1 className="text-4xl font-bold mb-2 text-center">UgliBoat Marketplace</h1>
      <p className="text-center italic  mb-6">Where you can find Unobtanium</p>
      
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

                  {/* Contact info for builds with display preferences */}
                  {build.contactInfo && (
                    <div className="text-sm space-y-1">
                      {build.contactInfo.displayPreferences?.showPhone && build.contactInfo.phone && (
                        <p className="flex items-center gap-1 text-gray-600">
                          <Phone className="h-3 w-3" /> {build.contactInfo.phone}
                        </p>
                      )}
                      {build.contactInfo.displayPreferences?.showAddress && build.contactInfo.address && (
                        <p className="flex items-center gap-1 text-gray-600">
                          <MapPin className="h-3 w-3" /> {build.contactInfo.address}
                        </p>
                      )}
                    </div>
                  )}

                  <div className="flex flex-col gap-2">
                    <Link to={`/builds/${build.id}`}>
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

      {/* Standalone For Sale Items */}
      {forSaleItems.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4 text-center">Parts & Accessories for Sale</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {forSaleItems.map((item) => (
              <Card key={item.id} className="relative">
                <Badge className="absolute top-2 right-2 bg-green-600 hover:bg-green-700">
                  {item.itemCategory ? item.itemCategory.toUpperCase() : 'FOR SALE'}
                </Badge>

                <CardHeader>
                  <CardTitle className="pr-20">
                    {item.itemTitle || item.buildName}
                  </CardTitle>
                  {item.contactInfo?.displayPreferences?.showName && item.name && (
                    <p className="text-sm text-muted-foreground">by {item.name}</p>
                  )}
                  {item.forSale && (
                    <div className="flex items-center gap-2 text-lg font-bold text-green-600">
                      <DollarSign className="h-5 w-5" />
                      {formatPrice(item.forSale.price)}
                    </div>
                  )}
                </CardHeader>

                <CardContent className="space-y-4">
                  {item.images.length > 0 && (
                    <img
                      src={getImageUrl(item.images[0].url)}
                      alt={item.images[0].alt}
                      className="w-full h-48 object-cover rounded"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                      }}
                    />
                  )}

                  <p className="text-sm text-gray-600 line-clamp-3">
                    {item.introText}
                  </p>

                  {/* Contact info based on display preferences */}
                  {item.contactInfo && (
                    <div className="text-sm space-y-1 border-t pt-2">
                      {item.contactInfo.displayPreferences?.showEmail && (
                        <p className="flex items-center gap-1 text-gray-600">
                          <Mail className="h-3 w-3" /> {(item as any).email}
                        </p>
                      )}
                      {item.contactInfo.displayPreferences?.showPhone && item.contactInfo.phone && (
                        <p className="flex items-center gap-1 text-gray-600">
                          <Phone className="h-3 w-3" /> {item.contactInfo.phone}
                        </p>
                      )}
                      {item.contactInfo.displayPreferences?.showAddress && item.contactInfo.address && (
                        <p className="flex items-center gap-1 text-gray-600">
                          <MapPin className="h-3 w-3" /> {item.contactInfo.address}
                        </p>
                      )}
                    </div>
                  )}

                  {item.forSale && (
                    <div className="flex gap-2 flex-wrap">
                      {item.forSale.links.craigslistUrl && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => window.open(item.forSale!.links.craigslistUrl, '_blank')}
                        >
                          <ExternalLink className="h-4 w-4 mr-1" />
                          Craigslist
                        </Button>
                      )}
                      {item.forSale.links.facebookUrl && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => window.open(item.forSale!.links.facebookUrl, '_blank')}
                        >
                          <ExternalLink className="h-4 w-4 mr-1" />
                          Facebook
                        </Button>
                      )}
                      {item.forSale.links.otherUrl && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => window.open(item.forSale!.links.otherUrl, '_blank')}
                        >
                          <ExternalLink className="h-4 w-4 mr-1" />
                          View Listing
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* No items message */}
      {forSaleBuilds.length === 0 && forSaleItems.length === 0 && (
        <div className="text-center py-8 mb-8">
          <p className="text-gray-500 text-lg">No items currently for sale from the community.</p>
          <p className="text-gray-400 text-sm mt-2">
            Have something to sell? Visit the Submit page to list your item!
          </p>
        </div>
      )}

      {/* Original Content */}
      <div className="border-t pt-8">
        {/* <h2 className="text-2xl font-bold mb-4 text-center">Where you can find Unobtanium</h2>
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
        <br/> */}
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