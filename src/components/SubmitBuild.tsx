import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Send, X } from 'lucide-react'
// make a contact info object for data so he can save emails and phone numbers
// figure out how to handle the submission without making the page reload and without the session timeout thing copilot added
interface ImageWithCaption {
  file: File
  preview: string
  caption: string
}

function SubmitBuild() {
  const [formData, setFormData] = useState({
    name: '',
    buildName: '',
    header: '',
    introText: '',
    email: ''
  })
  const [images, setImages] = useState<ImageWithCaption[]>([])
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
      const reader = new FileReader()
      reader.onload = (event) => {
        if (event.target?.result) {
          setImages(prev => [...prev, {
            file,
            preview: event.target!.result as string,
            caption: ''
          }])
        }
      }
      reader.readAsDataURL(file)
    })
  }

  const updateImageCaption = (index: number, caption: string) => {
    setImages(prev => prev.map((img, i) => 
      i === index ? { ...img, caption } : img
    ))
  }

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index))
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
      submitData.append('ownerName', formData.name) // Map to backend field
      submitData.append('email', formData.email)
      submitData.append('buildName', formData.buildName)
      submitData.append('description', formData.introText) // Map to backend field
      
      // Add images and send captions as JSON
      const captions: string[] = []
      images.forEach((img) => {
        submitData.append('images', img.file)
        captions.push(img.caption)
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
                setFormData({ name: '', buildName: '', header: '', introText: '', email: '' })
                setImages([])
                const fileInput = document.getElementById('images') as HTMLInputElement
                if (fileInput) fileInput.value = ''
              }}>
                Submit Another Build
              </Button>
              <Button variant="outline" onClick={() => {
                // Clear persisted state
                sessionStorage.removeItem('buildSubmitted')
                sessionStorage.removeItem('buildSubmissionTime')
                setSubmitted(false)
              }}>
                Go Back to Form
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

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
            
            <div>
              <Label htmlFor="images">Build Photos</Label>
              <Input
                className='cursor-pointer'
                id="images"
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileChange}
              />
              <p className="text-sm text-gray-600 mt-1">
                Upload photos of your build (optional, but recommended!)
              </p>
            </div>

            {/* Image Previews with Caption Input */}
            {images.length > 0 && (
              <div className="space-y-4">
                <h3 className="font-medium text-gray-900">Your Build Photos</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  {images.map((img, index) => (
                    <Card key={index} className="relative">
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2 z-10"
                        onClick={() => removeImage(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                      <img
                        src={img.preview}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-32 object-cover rounded-t"
                      />
                      <CardContent className="p-3">
                        <Label htmlFor={`caption-${index}`} className="text-sm">
                          Add a caption (optional)
                        </Label>
                        <Input
                          id={`caption-${index}`}
                          value={img.caption}
                          onChange={(e) => updateImageCaption(index, e.target.value)}
                          placeholder="Tell us about this photo..."
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
