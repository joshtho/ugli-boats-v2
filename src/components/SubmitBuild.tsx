import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Send, X, Eye, Upload, ImagePlus, Wrench, Ship } from 'lucide-react'
import { getApiUrl } from '@/config/api'
import BoatPage from './BoatPage'

interface MediaWithCaption {
  file: File
  preview: string
  caption: string
  type: 'image' | 'video'
}

type SubmissionType = 'build' | 'for-sale-item'

function SubmitBuild() {
  const [submissionType, setSubmissionType] = useState<SubmissionType | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    buildName: '',
    header: '',
    introText: '',
    email: '',
    phone: '',
    address: '',
    // For-sale-item specific
    itemTitle: '',
    itemCategory: '' as '' | 'parts' | 'accessories' | 'materials' | 'tools' | 'other',
    itemDescription: '',
    // Contact display preferences
    contactPreferences: {
      showName: true,
      showEmail: false,
      showPhone: false,
      showAddress: false,
    },
    forSale: {
      onMarket: false,
      price: 0,
      links: {
        craigslistUrl: '',
        facebookUrl: '',
        otherUrl: ''
      }
    }
  })
  const [media, setMedia] = useState<MediaWithCaption[]>([])
  const [youtubeVideos, setYoutubeVideos] = useState<Array<{ url: string; caption: string }>>([])
  const [youtubeUrl, setYoutubeUrl] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [previewMode, setPreviewMode] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Check for persisted success state on mount
  useEffect(() => {
    const wasSubmitted = sessionStorage.getItem('buildSubmitted')
    const submissionTime = sessionStorage.getItem('buildSubmissionTime')
    
    // Only show success if submitted recently (within last 5 minutes)
    if (wasSubmitted === 'true' && submissionTime) {
      const timeElapsed = Date.now() - parseInt(submissionTime)
      if (timeElapsed < 5 * 60 * 1000) { // 5 minutes
        console.log('Restoring success state from sessionStorage')
        setSubmitted(true)
      } else {
        // Clean up old sessionStorage
        sessionStorage.removeItem('buildSubmitted')
        sessionStorage.removeItem('buildSubmissionTime')
      }
    }
  }, [])

  // Helper to validate and normalize YouTube URLs
  const validateYoutubeUrl = (url: string): string | null => {
    if (!url.trim()) return null
    
    // Check for valid YouTube URL patterns
    const youtubePatterns = [
      /(?:https?:\/\/)?(?:www\.)?youtu\.be\/([a-zA-Z0-9_-]{11})(?:\?.*)?/,
      /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})(?:&.*)?/
    ]
    
    for (const pattern of youtubePatterns) {
      const match = url.match(pattern)
      if (match) {
        // Return normalized youtu.be format for consistency
        return `https://youtu.be/${match[1]}`
      }
    }
    
    return null
  }

  const addYoutubeVideo = () => {
    const normalizedUrl = validateYoutubeUrl(youtubeUrl)
    if (!normalizedUrl) {
      alert('Please enter a valid YouTube URL (e.g., https://youtu.be/videoId or https://youtube.com/watch?v=videoId)')
      return
    }
    
    // Check if URL already exists
    if (youtubeVideos.some(video => video.url === normalizedUrl)) {
      alert('This YouTube video has already been added')
      return
    }
    
    setYoutubeVideos(prev => [...prev, { url: normalizedUrl, caption: '' }])
    setYoutubeUrl('')
  }

  const updateYoutubeCaption = (index: number, caption: string) => {
    setYoutubeVideos(prev => prev.map((video, i) => 
      i === index ? { ...video, caption } : video
    ))
  }

  const removeYoutubeVideo = (index: number) => {
    setYoutubeVideos(prev => prev.filter((_, i) => i !== index))
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    Array.from(files).forEach(file => {
      const isVideo = file.type.startsWith('video/')
      
      if (isVideo) {
        // For videos, use URL.createObjectURL for preview
        const videoUrl = URL.createObjectURL(file)
        setMedia(prev => [...prev, {
          file,
          preview: videoUrl,
          caption: '',
          type: 'video'
        }])
      } else {
        // For images, use FileReader to create base64 preview
        const reader = new FileReader()
        reader.onload = (event) => {
          if (event.target?.result) {
            setMedia(prev => [...prev, {
              file,
              preview: event.target!.result as string,
              caption: '',
              type: 'image'
            }])
          }
        }
        reader.readAsDataURL(file)
      }
    })
  }

  const updateMediaCaption = (index: number, caption: string) => {
    setMedia(prev => prev.map((item, i) => 
      i === index ? { ...item, caption } : item
    ))
  }

  const removeMedia = (index: number) => {
    // Clean up URL object for videos to prevent memory leaks
    const item = media[index]
    if (item.type === 'video') {
      URL.revokeObjectURL(item.preview)
    }
    setMedia(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    // Validate based on submission type
    if (submissionType === 'build' && (!formData.name || !formData.email || !formData.buildName)) {
      alert('Please fill in all required fields (name, email, build name)')
      return
    }
    if (submissionType === 'for-sale-item' && (!formData.email || !formData.itemTitle)) {
      alert('Please fill in all required fields (email, item title)')
      return
    }

    setSubmitting(true)
    
    try {
      // Create FormData for submission
      const submitData = new FormData()
      submitData.append('type', submissionType || 'build')
      submitData.append('name', formData.name)
      submitData.append('email', formData.email)
      
      // Contact info with privacy preferences
      submitData.append('contactInfo', JSON.stringify({
        phone: formData.phone,
        address: formData.address,
        displayPreferences: formData.contactPreferences
      }))
      
      if (submissionType === 'build') {
        submitData.append('buildName', formData.buildName)
        submitData.append('introText', formData.introText)
        submitData.append('header', formData.header)
      } else {
        // for-sale-item
        submitData.append('itemTitle', formData.itemTitle)
        submitData.append('itemCategory', formData.itemCategory)
        submitData.append('itemDescription', formData.itemDescription)
      }
      
      // Add forSale data
      submitData.append('forSale', JSON.stringify(formData.forSale))
      
      // Add images and send captions as JSON
      const captions: string[] = []
      media.forEach((item) => {
        submitData.append('images', item.file)
        captions.push(item.caption)
      })
      
      // Add YouTube videos as image objects
      const youtubeImages = youtubeVideos.map(video => ({
        alt: `YouTube Video: ${video.url}`,
        caption: video.caption,
        url: video.url
      }))
      
      // Send captions as JSON string (includes both file captions and YouTube captions)
      const allCaptions = [...captions, ...youtubeVideos.map(v => v.caption)]
      if (allCaptions.length > 0) {
        submitData.append('imageCaptions', JSON.stringify(allCaptions))
      }
      
      // Send YouTube videos as JSON
      if (youtubeImages.length > 0) {
        submitData.append('youtubeVideos', JSON.stringify(youtubeImages))
      }
      
      // Send to backend API
      const response = await fetch(getApiUrl('submissions'), {
        method: 'POST',
        body: submitData
      })
      
      if (!response.ok) {
        let errorMessage = `${response.status} ${response.statusText}`
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorMessage
        } catch {
          // couldn't parse response body
        }
        throw new Error(errorMessage)
      }
      
      const result = await response.json()
      console.log('Submission successful:', result)
      
      // Persist success state with timestamp to survive React StrictMode remounts
      sessionStorage.setItem('buildSubmitted', 'true')
      sessionStorage.setItem('buildSubmissionTime', Date.now().toString())
      setSubmitted(true)
      
    } catch (error) {
      console.error('Submission error:', error)
      const message = (error as Error).message
      if (message.toLowerCase().includes('file too large') || message.toLowerCase().includes('too large')) {
        alert('One of your files exceeds the 200MB limit. For larger videos, try uploading to YouTube and adding the link instead.')
      } else {
        alert('Submission failed: ' + message)
      }
    } finally {
      setSubmitting(false)
    }
  }

  // Build preview data by combining form data with local media previews
  const buildPreviewData = () => {
    const previewImages = [
      ...media.map(item => ({
        alt: formData.buildName || 'Build image',
        caption: item.caption,
        url: item.preview, // use the local preview URL (base64 for images, blob for video)
        type: item.type // pass through 'image' or 'video' so BoatPage can identify blob URLs
      })),
      ...youtubeVideos.map(video => ({
        alt: `YouTube Video: ${video.url}`,
        caption: video.caption,
        url: video.url
      }))
    ]

    return {
      name: submissionType === 'build' ? (formData.name || 'Your Name') : (formData.name || ''),
      buildName: submissionType === 'build' ? (formData.buildName || 'Your Build') : (formData.itemTitle || 'Your Item'),
      header: submissionType === 'build' ? formData.header : '',
      introText: submissionType === 'build' ? formData.introText : formData.itemDescription,
      email: formData.email,
      forSale: formData.forSale,
      contactInfo: {
        phone: formData.phone,
        address: formData.address,
        displayPreferences: formData.contactPreferences
      },
      images: previewImages
    }
  }

  if (previewMode) {
    return (
      <div className="mx-auto max-w-full p-6 space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold">Preview — This is how your build page will look</h2>
          <Button onClick={() => setPreviewMode(false)} variant="outline">
            <X className="h-4 w-4 mr-2" />
            Back to Editing
          </Button>
        </div>
        <BoatPage buildData={buildPreviewData()} />
        <div className="flex justify-center gap-4 pt-4 border-t">
          <Button onClick={() => setPreviewMode(false)} variant="outline">
            Back to Editing
          </Button>
          <Button
            onClick={() => {
              setPreviewMode(false)
              // Small delay so form is rendered before we try to submit
              setTimeout(() => {
                const form = document.querySelector('form')
                if (form) form.requestSubmit()
              }, 100)
            }}
            disabled={submitting || (submissionType === 'build' ? (!formData.name || !formData.email || !formData.buildName) : (!formData.email || !formData.itemTitle))}
          >
            {submitting ? 'Submitting...' : 'Submit Build'}
          </Button>
        </div>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="mx-auto max-w-2xl p-6">
        <Card>
          <CardContent className="text-center py-12">
            <div className="text-green-600 text-6xl mb-4">✓</div>
            <h2 className="text-2xl font-bold mb-4">Submission Received!</h2>
            <p className="text-gray-600 mb-6">
              Thank you for your submission! We'll review it and get back to you soon.
            </p>
            <div className="space-y-3">
              <Button onClick={() => {
                // Clear persisted state
                sessionStorage.removeItem('buildSubmitted')
                sessionStorage.removeItem('buildSubmissionTime')
                setSubmitted(false)
                setSubmissionType(null)
                setFormData({ 
                  name: '', 
                  buildName: '', 
                  header: '', 
                  introText: '', 
                  email: '',
                  phone: '',
                  address: '',
                  itemTitle: '',
                  itemCategory: '',
                  itemDescription: '',
                  contactPreferences: {
                    showName: true,
                    showEmail: false,
                    showPhone: false,
                    showAddress: false,
                  },
                  forSale: {
                    onMarket: false,
                    price: 0,
                    links: {
                      craigslistUrl: '',
                      facebookUrl: '',
                      otherUrl: ''
                    }
                  }
                })
                setMedia([])
                setYoutubeVideos([])
              }}>
                Submit Another
              </Button>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg mt-8">
              <h3 className="font-medium text-blue-900 mb-2">What happens next?</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• We'll review your submission</li>
                <li>• If approved, your build will be added to our gallery</li>
                <li>• We may contact you for additional details</li>
                <li>• Your email will not be shared publicly</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }
  
  // Type selection screen
  if (!submissionType) {
    return (
      <div className="mx-auto max-w-2xl p-6">
        <h1 className="text-3xl font-bold mb-4 text-center">What would you like to do?</h1>
        <p className="text-center text-gray-600 mb-8">
          Share your build with the UgliBoat community or list an item for sale on our marketplace.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card 
            className="cursor-pointer hover:border-blue-500 hover:shadow-lg transition-all"
            onClick={() => setSubmissionType('build')}
          >
            <CardContent className="flex flex-col items-center text-center p-8">
              <Ship className="h-16 w-16 text-blue-600 mb-4" />
              <h2 className="text-xl font-bold mb-2">Share a Build</h2>
              <p className="text-gray-600 text-sm">
                Show off your UgliBoat build with photos, videos, and your build story. Your build will appear on the Builds page.
              </p>
              <p className="text-xs text-gray-400 mt-3">
                You can also list your completed boat for sale
              </p>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:border-green-500 hover:shadow-lg transition-all"
            onClick={() => {
              setSubmissionType('for-sale-item')
              setFormData(prev => ({
                ...prev,
                forSale: { ...prev.forSale, onMarket: true }
              }))
            }}
          >
            <CardContent className="flex flex-col items-center text-center p-8">
              <Wrench className="h-16 w-16 text-green-600 mb-4" />
              <h2 className="text-xl font-bold mb-2">Sell an Item</h2>
              <p className="text-gray-600 text-sm">
                List boat parts, accessories, flooring, engine brackets, or other items for sale on our marketplace.
              </p>
              <p className="text-xs text-gray-400 mt-3">
                No build page required — goes directly to the For Sale page
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }
  
  return (
    <div className="mx-auto max-w-2xl p-6">
      <div className="flex items-center gap-3 mb-4">
        <Button variant="ghost" size="sm" onClick={() => {
          setSubmissionType(null)
          setFormData({
            name: '',
            buildName: '',
            header: '',
            introText: '',
            email: '',
            phone: '',
            address: '',
            itemTitle: '',
            itemCategory: '',
            itemDescription: '',
            contactPreferences: {
              showName: true,
              showEmail: false,
              showPhone: false,
              showAddress: false,
            },
            forSale: {
              onMarket: false,
              price: 0,
              links: {
                craigslistUrl: '',
                facebookUrl: '',
                otherUrl: ''
              }
            }
          })
          setMedia([])
          setYoutubeVideos([])
        }}>
          ← Back
        </Button>
        <h1 className="text-3xl font-bold">
          {submissionType === 'build' ? 'Share Your UgliBoat Build' : 'List an Item for Sale'}
        </h1>
      </div>
      <p className="mb-6 text-gray-600">
        {submissionType === 'build' 
          ? 'Share your expertise with your fellow UgliBoat enthusiasts. Describe your build process with any tips, tricks, or instructions. You can also optionally list your boat for sale.'
          : 'List your boat parts, accessories, or other items on the UgliBoat Marketplace.'
        }
      </p>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            {submissionType === 'build' ? 'Submit Your Build' : 'List Your Item'}
          </CardTitle>
          <CardDescription>
            We'll review your submission before it goes live.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* === CONTACT INFO SECTION (both types) === */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Your Contact Information</h3>
              <p className="text-sm text-gray-500">We need your contact info for review. You control what's shown publicly below.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Your Name {submissionType === 'build' ? '*' : '(optional)'}</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Enter your name"
                    required={submissionType === 'build'}
                  />
                </div>
                
                <div>
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="your@email.com"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="phone">Phone Number (optional)</Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="(555) 555-5555"
                  />
                </div>

                <div>
                  <Label htmlFor="address">Location / Address (optional)</Label>
                  <Input
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="City, State"
                  />
                </div>
              </div>

              {/* Privacy toggles */}
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <p className="text-sm font-medium text-gray-700 mb-2">What should be shown publicly on your listing?</p>
                
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={formData.contactPreferences.showName}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      contactPreferences: { ...prev.contactPreferences, showName: e.target.checked }
                    }))}
                  />
                  Show my name
                </label>

                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={formData.contactPreferences.showEmail}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      contactPreferences: { ...prev.contactPreferences, showEmail: e.target.checked }
                    }))}
                  />
                  Show my email address
                </label>

                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={formData.contactPreferences.showPhone}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      contactPreferences: { ...prev.contactPreferences, showPhone: e.target.checked }
                    }))}
                  />
                  Show my phone number
                  {!formData.phone && <span className="text-gray-400">(enter a phone number above first)</span>}
                </label>

                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={formData.contactPreferences.showAddress}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      contactPreferences: { ...prev.contactPreferences, showAddress: e.target.checked }
                    }))}
                  />
                  Show my location
                  {!formData.address && <span className="text-gray-400">(enter a location above first)</span>}
                </label>
              </div>
            </div>

            {/* === BUILD-SPECIFIC FIELDS === */}
            {submissionType === 'build' && (
              <div className="space-y-4 border-t pt-4">
                <h3 className="text-lg font-semibold">Build Details</h3>
                
                <div>
                  <Label htmlFor="buildName">Build Name *</Label>
                  <Input
                    id="buildName"
                    name="buildName"
                    value={formData.buildName}
                    onChange={handleInputChange}
                    placeholder="What did you name your boat?"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="header">Build Header (optional)</Label>
                  <Input
                    id="header"
                    name="header"
                    value={formData.header}
                    onChange={handleInputChange}
                    placeholder="Description/story in a couple of words"
                  />
                </div>
                
                <div>
                  <Label htmlFor="introText">Build Description</Label>
                  <Textarea
                    id="introText"
                    name="introText"
                    value={formData.introText}
                    onChange={handleInputChange}
                    placeholder="Tell us about your build - materials used, modifications made, how you use the boat, etc."
                    rows={6}
                  />
                </div>
              </div>
            )}

            {/* === FOR-SALE-ITEM SPECIFIC FIELDS === */}
            {submissionType === 'for-sale-item' && (
              <div className="space-y-4 border-t pt-4">
                <h3 className="text-lg font-semibold">Item Details</h3>
                
                <div>
                  <Label htmlFor="itemTitle">Item Title *</Label>
                  <Input
                    id="itemTitle"
                    name="itemTitle"
                    value={formData.itemTitle}
                    onChange={handleInputChange}
                    placeholder="e.g., Bolt-on Engine Brackets, Boat Flooring Kit"
                    required
                  />
                </div>

                <div>
                  <Label>Item Category</Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-1">
                    {[
                      { value: 'parts', label: 'Parts' },
                      { value: 'accessories', label: 'Accessories' },
                      { value: 'materials', label: 'Materials' },
                      { value: 'tools', label: 'Tools' },
                      { value: 'other', label: 'Other' },
                    ].map(cat => (
                      <Button
                        key={cat.value}
                        type="button"
                        variant={formData.itemCategory === cat.value ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setFormData(prev => ({ ...prev, itemCategory: cat.value as any }))}
                      >
                        {cat.label}
                      </Button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label htmlFor="itemDescription">Item Description</Label>
                  <Textarea
                    id="itemDescription"
                    name="itemDescription"
                    value={formData.itemDescription}
                    onChange={handleInputChange}
                    placeholder="Describe the item, its condition, any details buyers should know..."
                    rows={4}
                  />
                </div>
              </div>
            )}

            {/* === PHOTOS & VIDEOS (both types) === */}
            <div className="border-t pt-4">
              <Label>Photos and Videos</Label>
              <p className="text-sm text-red-600 mb-2">Your first image will be used as the thumbnail</p>
              <div
                className={`relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                  isDragging
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                }`}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault()
                  setIsDragging(true)
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault()
                  setIsDragging(false)
                  const files = e.dataTransfer.files
                  if (files.length > 0) {
                    Array.from(files).forEach(file => {
                      const isVideo = file.type.startsWith('video/')
                      if (isVideo) {
                        const videoUrl = URL.createObjectURL(file)
                        setMedia(prev => [...prev, { file, preview: videoUrl, caption: '', type: 'video' }])
                      } else if (file.type.startsWith('image/')) {
                        const reader = new FileReader()
                        reader.onload = (event) => {
                          if (event.target?.result) {
                            setMedia(prev => [...prev, { file, preview: event.target!.result as string, caption: '', type: 'image' }])
                          }
                        }
                        reader.readAsDataURL(file)
                      }
                    })
                  }
                }}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*,video/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div className="flex flex-col items-center gap-2">
                  {media.length === 0 ? (
                    <>
                      <Upload className="h-10 w-10 text-gray-400" />
                      <p className="text-lg font-medium text-gray-700">Drag & drop photos and videos here</p>
                      <p className="text-sm text-gray-500">or click to browse</p>
                      <p className="text-xs text-gray-400 mt-1">Supports images and MP4 videos up to 200MB</p>
                    </>
                  ) : (
                    <>
                      <ImagePlus className="h-8 w-8 text-gray-400" />
                      <p className="text-sm font-medium text-gray-700">{media.length} file{media.length !== 1 ? 's' : ''} selected</p>
                      <p className="text-sm text-blue-600">Click or drag to add more</p>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* YouTube Video Section */}
            <div>
              <Label htmlFor="youtubeUrl">Add YouTube Video</Label>
              <div className="flex gap-2">
                <Input
                  id="youtubeUrl"
                  type="url"
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  placeholder="https://youtu.be/videoId or https://youtube.com/watch?v=videoId"
                />
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={addYoutubeVideo}
                  disabled={!youtubeUrl.trim()}
                >
                  Add Video
                </Button>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                Add YouTube videos. Supports both youtu.be and youtube.com formats.
              </p>
            </div>

            {/* Media Previews with Caption Input */}
            {media.length > 0 && (
              <div className="space-y-4">
                <h3 className="font-medium text-gray-900">Your Media</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  {media.map((item, index) => (
                    <Card key={index} className="relative">
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2 z-10"
                        onClick={() => removeMedia(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                      
                      {item.type === 'video' ? (
                        <video
                          src={item.preview}
                          className="w-full h-32 object-cover rounded-t"
                          controls={false}
                          muted
                        />
                      ) : (
                        <img
                          src={item.preview}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-32 object-cover rounded-t"
                        />
                      )}
                      
                      <CardContent className="p-3">
                        <Label htmlFor={`caption-${index}`} className="text-sm">
                          Add a caption (optional)
                        </Label>
                        <Input
                          id={`caption-${index}`}
                          value={item.caption}
                          onChange={(e) => updateMediaCaption(index, e.target.value)}
                          placeholder={`Tell us about this ${item.type}...`}
                          className="mt-1"
                        />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* YouTube Videos Preview */}
            {youtubeVideos.length > 0 && (
              <div className="space-y-4">
                <h3 className="font-medium text-gray-900">Your YouTube Videos</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  {youtubeVideos.map((video, index) => (
                    <Card key={index} className="relative">
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2 z-10"
                        onClick={() => removeYoutubeVideo(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                      
                      {(() => {
                        const getYoutubeId = (url: string): string | null => {
                          if (url.includes('youtu.be/')) {
                            return url.split('youtu.be/')[1].split('?')[0]
                          }
                          if (url.includes('youtube.com/watch?v=')) {
                            return url.split('v=')[1].split('&')[0]
                          }
                          return null
                        }
                        
                        const youtubeId = getYoutubeId(video.url)
                        return youtubeId ? (
                          <iframe
                            src={`https://www.youtube.com/embed/${youtubeId}`}
                            className="w-full h-32 rounded-t"
                            allowFullScreen
                          />
                        ) : (
                          <div className="w-full h-32 bg-gray-200 rounded-t flex items-center justify-center">
                            <p className="text-gray-500">Invalid YouTube URL</p>
                          </div>
                        )
                      })()}
                      
                      <CardContent className="p-3">
                        <Label htmlFor={`youtube-caption-${index}`} className="text-sm">
                          Add a caption (optional)
                        </Label>
                        <Input
                          id={`youtube-caption-${index}`}
                          value={video.caption}
                          onChange={(e) => updateYoutubeCaption(index, e.target.value)}
                          placeholder="Tell us about this video..."
                          className="mt-1"
                        />
                        <p className="text-xs text-gray-500 mt-1 truncate">{video.url}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* === FOR SALE SECTION (build type only - for-sale-item always has it) === */}
            {submissionType === 'build' && (
              <div className="space-y-4 border-t pt-4">
                <h3 className="text-lg font-semibold">For Sale Information (Optional)</h3>
                <p className="text-sm text-gray-500">Is your completed boat for sale? If so, it will also appear on the Marketplace page.</p>
                
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="onMarket"
                    checked={formData.forSale.onMarket}
                    onChange={(e) => 
                      setFormData(prev => ({
                        ...prev,
                        forSale: {
                          ...prev.forSale,
                          onMarket: e.target.checked
                        }
                      }))
                    }
                  />
                  <Label htmlFor="onMarket">This boat is for sale</Label>
                </div>
              </div>
            )}

            {/* Price & listing links (shown when for sale) */}
            {formData.forSale.onMarket && (
              <div className="space-y-4 ml-6 border-l-2 border-gray-200 pl-4">
                <div className="relative">
                  <Label htmlFor="price">Asking Price</Label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">$</span>
                    <Input
                      id='price'
                      type="number"
                      className="pl-8"
                      value={formData.forSale.price === 0 ? '' : formData.forSale.price}
                      onChange={(e) => 
                        setFormData(prev => ({
                          ...prev,
                          forSale: {
                            ...prev.forSale,
                            price: e.target.value === '' ? 0 : parseInt(e.target.value)
                          }
                        }))
                      }
                      placeholder='Enter price'
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="craigslistUrl">Craigslist URL (optional)</Label>
                  <Input
                    id="craigslistUrl"
                    type="url"
                    value={formData.forSale.links.craigslistUrl}
                    onChange={(e) => 
                      setFormData(prev => ({
                        ...prev,
                        forSale: {
                          ...prev.forSale,
                          links: {
                            ...prev.forSale.links,
                            craigslistUrl: e.target.value
                          }
                        }
                      }))
                    }
                    placeholder="https://craigslist.org/..."
                  />
                </div>

                <div>
                  <Label htmlFor="facebookUrl">Facebook Marketplace URL (optional)</Label>
                  <Input
                    id="facebookUrl"
                    type="url"
                    value={formData.forSale.links.facebookUrl}
                    onChange={(e) => 
                      setFormData(prev => ({
                        ...prev,
                        forSale: {
                          ...prev.forSale,
                          links: {
                            ...prev.forSale.links,
                            facebookUrl: e.target.value
                          }
                        }
                      }))
                    }
                    placeholder="https://facebook.com/marketplace/..."
                  />
                </div>

                <div>
                  <Label htmlFor="otherUrl">Other Listing URL (optional)</Label>
                  <Input
                    id="otherUrl"
                    type="url"
                    value={formData.forSale.links.otherUrl}
                    onChange={(e) => 
                      setFormData(prev => ({
                        ...prev,
                        forSale: {
                          ...prev.forSale,
                          links: {
                            ...prev.forSale.links,
                            otherUrl: e.target.value
                          }
                        }
                      }))
                    }
                    placeholder="https://..."
                  />
                </div>
              </div>
            )}
            
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-medium text-blue-900 mb-2">What happens next?</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• We'll review your submission</li>
                <li>• If approved, it will appear on the {submissionType === 'build' ? 'Builds page' : 'Marketplace'}</li>
                <li>• We may contact you for additional details</li>
                <li>• Only info you opted to share will be shown publicly</li>
              </ul>
            </div>
            
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setPreviewMode(true)}
              >
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </Button>
              <Button 
                type="submit" 
                disabled={submitting}
                className="flex-1"
              >
                {submitting ? 'Submitting...' : 'Submit'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default SubmitBuild
