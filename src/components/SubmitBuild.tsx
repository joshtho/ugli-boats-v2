import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Send, X } from 'lucide-react'

// make a contact info object for data so he can save emails and phone numbers
// figure out how to handle the submission without making the page reload and without the session timeout thing copilot added
interface MediaWithCaption {
  file: File
  preview: string
  caption: string
  type: 'image' | 'video'
}

function SubmitBuild() {
  const [formData, setFormData] = useState({
    name: '',
    buildName: '',
    header: '',
    introText: '',
    email: '',
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
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

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
    
    if (!formData.name || !formData.email || !formData.buildName) {
      alert('Please fill in all required fields')
      return
    }

    setSubmitting(true)
    
    try {
      // Create FormData for submission
      const submitData = new FormData()
      submitData.append('name', formData.name)
      submitData.append('email', formData.email)
      submitData.append('buildName', formData.buildName)
      submitData.append('introText', formData.introText)
      submitData.append('header', formData.header)
      
      // Add forSale data
      submitData.append('forSale', JSON.stringify(formData.forSale))
      
      // Add images and send captions as JSON
      const captions: string[] = []
      media.forEach((item) => {
        submitData.append('images', item.file)
        captions.push(item.caption)
      })
      
      // Send captions as JSON string
      if (captions.length > 0) {
        submitData.append('imageCaptions', JSON.stringify(captions))
      }
      
      // Send to backend API
      const response = await fetch('http://localhost:3001/api/submissions', {
        method: 'POST',
        body: submitData
      })
      
      if (!response.ok) {
        throw new Error(`Submission failed: ${response.statusText}`)
      }
      
      const result = await response.json()
      console.log('Submission successful:', result)
      
      // Persist success state with timestamp to survive React StrictMode remounts
      sessionStorage.setItem('buildSubmitted', 'true')
      sessionStorage.setItem('buildSubmissionTime', Date.now().toString())
      setSubmitted(true)
      
    } catch (error) {
      console.error('Submission error:', error)
      alert('Submission failed: ' + (error as Error).message)
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="mx-auto max-w-2xl p-6">
        <Card>
          <CardContent className="text-center py-12">
            <div className="text-green-600 text-6xl mb-4">✓</div>
            <h2 className="text-2xl font-bold mb-4">Submission Received!</h2>
            <p className="text-gray-600 mb-6">
              Thank you for submitting your boat build! We'll review it and get back to you soon.
            </p>
            <div className="space-y-3">
              <Button onClick={() => {
                // Clear persisted state
                sessionStorage.removeItem('buildSubmitted')
                sessionStorage.removeItem('buildSubmissionTime')
                setSubmitted(false)
                setFormData({ 
                  name: '', 
                  buildName: '', 
                  header: '', 
                  introText: '', 
                  email: '',
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
                const fileInput = document.getElementById('images') as HTMLInputElement
                if (fileInput) fileInput.value = ''
              }}>
                Submit Another Build
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
  console.log(formData)
  return (
    <div className="mx-auto max-w-2xl p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Submit Your Boat Build
          </CardTitle>
          <CardDescription>
            Share your Ugli Boat build with the community! We'll review your submission and add it to our builds gallery.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Your Name *</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Enter your name"
                  required
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
            </div>
            
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

            {/* For Sale Section */}
            <div className="space-y-4 border-t pt-4">
              <h3 className="text-lg font-semibold">For Sale Information (Optional)</h3>
              
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
                <Label htmlFor="onMarket">This build is for sale</Label>
              </div>

              {formData.forSale.onMarket && (
                <div className="space-y-4 ml-6 border-l-2 border-gray-200 pl-4">
                  {/* <div>
                    <Label htmlFor="price">Asking Price ($)</Label>
                    <Input
                      id="price"
                      type="price"
                      value={formData.forSale.price}
                      onChange={(e) => 
                        setFormData(prev => ({
                          ...prev,
                          forSale: {
                            ...prev.forSale,
                            price: parseInt(e.target.value) || 0
                          }
                        }))
                      }
                      placeholder="0"
                    />
                  </div> */}
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">$</span>
                    <Input
                      id='price'
                      type="number"
                      className="pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
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
            </div>
            
            <div>
              <Label htmlFor="images">Build Photos and Videos</Label>
              <Input
                className='cursor-pointer'
                id="images and video"
                type="file"
                multiple
                accept="image/*,video/*"
                onChange={handleFileChange}
              />
              <p className="text-sm text-gray-600 mt-1">
                Upload photos and videos (as mp4) of your build (optional, but recommended!)
              </p>
            </div>

            {/* Media Previews with Caption Input */}
            {media.length > 0 && (
              <div className="space-y-4">
                <h3 className="font-medium text-gray-900">Your Build Media</h3>
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
            
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-medium text-blue-900 mb-2">What happens next?</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• We'll review your submission</li>
                <li>• If approved, your build will be added to our gallery</li>
                <li>• We may contact you for additional details</li>
                <li>• Your email will not be shared publicly</li>
              </ul>
            </div>
            
            <Button 
              type="submit" 
              disabled={submitting}
              className="w-full"
            >
              {submitting ? 'Submitting...' : 'Submit Build'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default SubmitBuild
