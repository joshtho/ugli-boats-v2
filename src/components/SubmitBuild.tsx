import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Send } from 'lucide-react'

function SubmitBuild() {
  const [formData, setFormData] = useState({
    ownerName: '',
    email: '',
    buildName: '',
    description: ''
  })
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedFiles(e.target.files)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!formData.ownerName || !formData.email || !formData.buildName) {
      alert('Please fill in all required fields')
      return
    }

    setSubmitting(true)
    
    try {
      // Create FormData for submission
      const submitData = new FormData()
      submitData.append('ownerName', formData.ownerName)
      submitData.append('email', formData.email)
      submitData.append('buildName', formData.buildName)
      submitData.append('description', formData.description)
      
      // Add images if any were selected
      if (selectedFiles) {
        Array.from(selectedFiles).forEach(file => {
          submitData.append('images', file)
        })
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
            <Button onClick={() => {
              setSubmitted(false)
              setFormData({ ownerName: '', email: '', buildName: '', description: '' })
              setSelectedFiles(null)
              const fileInput = document.getElementById('images') as HTMLInputElement
              if (fileInput) fileInput.value = ''
            }}>
              Submit Another Build
            </Button>
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
                <Label htmlFor="ownerName">Your Name *</Label>
                <Input
                  id="ownerName"
                  name="ownerName"
                  value={formData.ownerName}
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
                placeholder="e.g., My Custom Ponton Build"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="description">Build Description</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Tell us about your build - materials used, modifications made, how you use the boat, etc."
                rows={6}
              />
            </div>
            
            <div>
              <Label htmlFor="images">Build Photos</Label>
              <Input
                id="images"
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileChange}
              />
              <p className="text-sm text-gray-600 mt-1">
                Upload photos of your build (optional, but recommended!)
              </p>
              {selectedFiles && (
                <p className="text-sm text-gray-600 mt-1">
                  {selectedFiles.length} file(s) selected
                </p>
              )}
            </div>
            
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
