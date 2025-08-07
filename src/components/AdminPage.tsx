import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Upload, Plus, Save, Settings, Eye, Check, X, Clock, Trash2 } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { useBuilds } from '@/contexts/BuildsContext'

// Admin authentication (simple password check for now)
function AdminLogin({ onLogin }: { onLogin: () => void }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleLogin = () => {
    // Simple password check - in production, use proper authentication
    if (password === 'ugliboats2025') {
      onLogin()
    } else {
      setError('Invalid password')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Admin Login</CardTitle>
          <CardDescription>Enter the admin password to access the management panel</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
            />
            {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
          </div>
          <Button onClick={handleLogin} className="w-full">
            Login
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

// Photo upload component
function PhotoUpload() {
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null)
  const [category, setCategory] = useState('')
  const [uploading, setUploading] = useState(false)

  const categories = [
    'Historical Ponton',
    'Customized Ponton', 
    'Other Military Boats',
    'Old Aluminum Boats',
    'Custom Aluminum Boats'
  ]

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedFiles(e.target.files)
  }

  const handleUpload = async () => {
    if (!selectedFiles || !category) {
      alert('Please select files and category')
      return
    }

    setUploading(true)
    
    try {
      // Create FormData for file upload
      const formData = new FormData()
      formData.append('category', category)
      
      // Add all selected files
      Array.from(selectedFiles).forEach(file => {
        formData.append('photos', file)
      })
      
      // Send to backend API
      const response = await fetch('http://localhost:3001/api/photos/upload', {
        method: 'POST',
        body: formData
      })
      
      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`)
      }
      
      await response.json()
      
      alert(`Successfully uploaded ${selectedFiles.length} photos to ${category}`)
      setSelectedFiles(null)
      setCategory('')
      
      // Reset the file input
      const fileInput = document.getElementById('photos') as HTMLInputElement
      if (fileInput) fileInput.value = ''
      
    } catch (error) {
      console.error('Upload error:', error)
      alert('Upload failed: ' + (error as Error).message)
    } finally {
      setUploading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Upload Photos
        </CardTitle>
        <CardDescription>Add new photos to the gallery</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="category">Category</Label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger>
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label htmlFor="photos">Select Photos</Label>
          <Input
            id="photos"
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileChange}
          />
          {selectedFiles && (
            <p className="text-sm text-gray-600 mt-1">
              {selectedFiles.length} file(s) selected
            </p>
          )}
        </div>

        <Button 
          onClick={handleUpload} 
          disabled={!selectedFiles || !category || uploading}
          className="w-full"
        >
          {uploading ? 'Uploading...' : 'Upload Photos'}
        </Button>
      </CardContent>
    </Card>
  )
}

// Build management component
function BuildManagement() {
  const [newBuild, setNewBuild] = useState({
    name: '',
    description: '',
    images: [] as string[]
  })
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  
  // Get builds and refetch function from builds context
  const { backendBuilds, refetchBuilds } = useBuilds()

  // Helper to get proper image URL - same as BuildPage
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

  const handleAddBuild = async () => {
    if (!newBuild.name) {
      alert('Build name is required')
      return
    }

    setSubmitting(true)
    
    try {
      // Create FormData for build submission
      const formData = new FormData()
      formData.append('name', newBuild.name)
      formData.append('description', newBuild.description)
      
      // Add images if any were selected
      const fileInput = document.getElementById('buildImages') as HTMLInputElement
      if (fileInput && fileInput.files) {
        Array.from(fileInput.files).forEach(file => {
          formData.append('images', file)
        })
      }
      
      // Send to backend API
      const response = await fetch('http://localhost:3001/api/builds', {
        method: 'POST',
        body: formData
      })
      
      if (!response.ok) {
        throw new Error(`Failed to add build: ${response.statusText}`)
      }
      
      await response.json()
      
      alert('Build added successfully!')
      setNewBuild({ name: '', description: '', images: [] })
      refetchBuilds() // Refresh the builds cache globally!
      
      // Reset the file input
      if (fileInput) fileInput.value = ''
      
    } catch (error) {
      console.error('Build creation error:', error)
      alert('Failed to add build: ' + (error as Error).message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteBuild = async (buildId: string, buildName: string) => {
    console.log('Attempting to delete build:', { buildId, buildName })
    
    if (!confirm(`Are you sure you want to delete "${buildName}"? This action cannot be undone.`)) {
      return
    }

    setDeleting(buildId)
    
    try {
      console.log('Making DELETE request to:', `/api/builds/${buildId}`)
      const response = await fetch(`http://localhost:3001/api/builds/${buildId}`, {
        method: 'DELETE'
      })
      
      console.log('Response status:', response.status)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('Delete failed:', errorText)
        throw new Error(`Failed to delete build: ${response.status} - ${errorText}`)
      }
      
      await response.json()
      console.log('Delete successful')
      
      alert('Build deleted successfully!')
      refetchBuilds() // Refresh the builds cache globally!
      
    } catch (error) {
      console.error('Build deletion error:', error)
      alert('Failed to delete build: ' + (error as Error).message)
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Add New Build Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Add New Build
          </CardTitle>
          <CardDescription>Add a new boat build to the builds page</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="buildName">Build Name</Label>
            <Input
              id="buildName"
              value={newBuild.name}
              onChange={(e) => setNewBuild({ ...newBuild, name: e.target.value })}
              placeholder="e.g., John's Custom Ponton"
            />
          </div>
          
          <div>
            <Label htmlFor="buildDescription">Description</Label>
            <Textarea
              id="buildDescription"
              value={newBuild.description}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewBuild({ ...newBuild, description: e.target.value })}
              placeholder="Describe the build..."
              rows={4}
            />
          </div>

          <div>
            <Label htmlFor="buildImages">Build Images</Label>
            <Input
              id="buildImages"
              type="file"
              multiple
              accept="image/*"
            />
          </div>

          <Button onClick={handleAddBuild} disabled={submitting} className="w-full">
            {submitting ? 'Adding Build...' : 'Add Build'}
          </Button>
        </CardContent>
      </Card>

      {/* Manage Existing Builds Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Manage Existing Builds
            {backendBuilds.length > 0 && (
              <Badge variant="secondary">{backendBuilds.length} builds</Badge>
            )}
          </CardTitle>
          <CardDescription>View and delete existing builds</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {backendBuilds.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No builds found</p>
          ) : (
            backendBuilds.map((build) => (
              <div key={build.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{build.buildName}</h3>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p><strong>Owner:</strong> {build.name}</p>
                      <p><strong>Header:</strong> {build.header}</p>
                      <p><strong>Created:</strong> {new Date(build.createdDate).toLocaleDateString()}</p>
                      <p><strong>Images:</strong> {build.images.length} image{build.images.length !== 1 ? 's' : ''}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    Published
                  </Badge>
                </div>
                
                {build.introText && (
                  <div>
                    <strong>Description:</strong>
                    <p className="mt-1 text-gray-700 line-clamp-3">{build.introText}</p>
                  </div>
                )}
                
                {build.images && build.images.length > 0 && (
                  <div>
                    <strong>Images Preview:</strong>
                    <div className="flex gap-2 mt-2">
                      {build.images.slice(0, 3).map((image, index) => (
                        <img 
                          key={index}
                          src={getImageUrl(image.url)}
                          alt={image.alt || `Image ${index + 1}`}
                          className="w-16 h-16 object-cover rounded border"
                          onError={(e) => {
                            console.log('Image failed to load:', getImageUrl(image.url))
                            e.currentTarget.style.display = 'none'
                          }}
                        />
                      ))}
                      {build.images.length > 3 && (
                        <div className="w-16 h-16 bg-gray-100 rounded border flex items-center justify-center text-xs text-gray-500">
                          +{build.images.length - 3} more
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                <div className="flex gap-2 pt-2">
                  <Button 
                    onClick={() => handleDeleteBuild(build.id, build.buildName)}
                    disabled={deleting === build.id}
                    variant="destructive"
                    className="flex items-center gap-2"
                    size="sm"
                  >
                    <Trash2 className="h-4 w-4" />
                    {deleting === build.id ? 'Deleting...' : 'Delete Build'}
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// Submission review component
function SubmissionReview() {
  const [submissions, setSubmissions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)
  
  // Get refetch function from builds context
  const { refetchBuilds } = useBuilds()

  const fetchSubmissions = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/submissions')
      if (response.ok) {
        const data = await response.json()
        setSubmissions(data)
      }
    } catch (error) {
      console.error('Error fetching submissions:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSubmissions()
  }, [])

  const handleApprove = async (submissionId: string) => {
    setProcessing(submissionId)
    try {
      const response = await fetch(`http://localhost:3001/api/submissions/${submissionId}/approve`, {
        method: 'POST'
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('Approval failed:', errorText)
        throw new Error(`Failed to approve submission: ${response.status} - ${errorText}`)
      }
      
      const result = await response.json()
      console.log('Approval successful:', result)
      
      alert('Submission approved and converted to build!')
      fetchSubmissions() // Refresh the submissions list
      refetchBuilds() // Refresh the builds cache globally!
    } catch (error) {
      console.error('Error approving submission:', error)
      alert('Failed to approve submission: ' + (error as Error).message)
    } finally {
      setProcessing(null)
    }
  }

  const handleReject = async (submissionId: string) => {
    setProcessing(submissionId)
    try {
      const response = await fetch(`http://localhost:3001/api/submissions/${submissionId}/reject`, {
        method: 'POST'
      })
      
      if (response.ok) {
        alert('Submission rejected')
        fetchSubmissions() // Refresh the list
      } else {
        throw new Error('Failed to reject submission')
      }
    } catch (error) {
      console.error('Error rejecting submission:', error)
      alert('Failed to reject submission')
    } finally {
      setProcessing(null)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <p>Loading submissions...</p>
        </CardContent>
      </Card>
    )
  }
console.log(submissions)
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Eye className="h-5 w-5" />
          Review Submissions
          {submissions.length > 0 && (
            <Badge variant="secondary">{submissions.length} pending</Badge>
          )}
        </CardTitle>
        <CardDescription>Review and approve user-submitted boat builds</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {submissions.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No pending submissions</p>
        ) : (
          submissions.map((submission) => (
            <Card key={submission.id} className="border rounded-lg">
              <CardContent className="p-6">
                {/* Header - like BoatPage */}
                <div className="mb-6">
                  <h1 className="text-2xl font-bold mb-2 text-center">
                    {submission.ownerName} - {submission.buildName}
                  </h1>
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-sm text-gray-600">
                      <p><strong>Email:</strong> {submission.email}</p>
                      <p><strong>Submitted:</strong> {new Date(submission.createdDate).toLocaleDateString()}</p>
                    </div>
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Pending Review
                    </Badge>
                  </div>
                </div>

                {/* Main content grid - like BoatPage */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-6">
                  {/* Images - left side (2/3 width) */}
                  {submission.images && submission.images.length > 0 && (
                    <div className="md:col-span-2">
                      <h3 className="font-semibold mb-4">Build Photos</h3>
                      <div className="grid gap-4 sm:grid-cols-2">
                        {submission.images.map((image: any, index: number) => {
                          // Handle both string URLs and image objects
                          let imageUrl = ''
                          let imageAlt = `Build photo ${index + 1}`
                          
                          if (typeof image === 'string') {
                            imageUrl = image
                          } else if (image && typeof image === 'object' && image.url) {
                            imageUrl = image.url
                            imageAlt = image.alt || imageAlt
                          }
                          
                          // Make sure URL includes the localhost prefix if needed
                          const fullImageUrl = imageUrl.startsWith('http') 
                            ? imageUrl 
                            : `http://localhost:3001${imageUrl.startsWith('/') ? imageUrl : '/' + imageUrl}`
                          
                          return (
                            <div key={index} className="relative">
                              <img
                                src={fullImageUrl}
                                alt={imageAlt}
                                className="w-full h-40 object-cover rounded transition-transform hover:scale-105"
                                onError={(e) => {
                                  console.log('Submission image failed to load:', fullImageUrl)
                                  e.currentTarget.style.display = 'none'
                                }}
                              />
                              {image.caption && (
                                <div className="mt-2 p-2 bg-gray-50 rounded text-sm text-gray-700">
                                  {image.caption}
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                  
                  {/* Description - right side (1/3 width) */}
                  <div className={`${submission.images && submission.images.length > 0 ? 'md:col-span-1' : 'md:col-span-3'} flex flex-col justify-start`}>
                    {submission.description && (
                      <div>
                        <h3 className="font-semibold mb-4">Build Description</h3>
                        <div className="text-base text-gray-700 bg-white/80 rounded p-4 shadow border">
                          {submission.description.split('\n').map((line: string, i: number) => (
                            <span key={i}>
                              {line}
                              <br />
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Action buttons at bottom */}
                <div className="flex gap-3 pt-4 border-t">
                  <Button 
                    onClick={() => handleApprove(submission.id)}
                    disabled={processing === submission.id}
                    className="flex items-center gap-2 flex-1"
                    size="lg"
                  >
                    <Check className="h-4 w-4" />
                    {processing === submission.id ? 'Processing...' : 'Approve & Add to Builds'}
                  </Button>
                  <Button 
                    onClick={() => handleReject(submission.id)}
                    disabled={processing === submission.id}
                    variant="outline"
                    className="flex items-center gap-2"
                    size="lg"
                  >
                    <X className="h-4 w-4" />
                    Reject
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </CardContent>
    </Card>
  )
}

// Content management component
function ContentManagement() {
  const [pages] = useState([
    'Home',
    'About',
    'History',
    'For Sale',
    'Interesting'
  ])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Manage Content
        </CardTitle>
        <CardDescription>Edit page content and settings</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {pages.map((page) => (
          <Dialog key={page}>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full justify-start">
                Edit {page} Page
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Edit {page} Page</DialogTitle>
                <DialogDescription>
                  Update the content for the {page} page
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor={`${page}-content`}>Page Content</Label>
                  <Textarea
                    id={`${page}-content`}
                    placeholder={`Enter content for ${page} page...`}
                    rows={10}
                  />
                </div>
                <Button className="w-full">
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        ))}
      </CardContent>
    </Card>
  )
}

function AdminDashboard() {
  return (
    <div className="mx-auto max-w-6xl p-6">
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>
      
      <Tabs defaultValue="submissions" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="submissions">Submissions</TabsTrigger>
          <TabsTrigger value="photos">Photos</TabsTrigger>
          <TabsTrigger value="builds">Builds</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
        </TabsList>
        
        <TabsContent value="submissions" className="mt-6">
          <SubmissionReview />
        </TabsContent>
        
        <TabsContent value="photos" className="mt-6">
          <PhotoUpload />
        </TabsContent>
        
        <TabsContent value="builds" className="mt-6">
          <BuildManagement />
        </TabsContent>
        
        <TabsContent value="content" className="mt-6">
          <ContentManagement />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    // Check sessionStorage for existing authentication
    return sessionStorage.getItem('adminAuthenticated') === 'true'
  })

  const handleLogin = () => {
    setIsAuthenticated(true)
    sessionStorage.setItem('adminAuthenticated', 'true')
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
    sessionStorage.removeItem('adminAuthenticated')
  }

  if (!isAuthenticated) {
    return <AdminLogin onLogin={handleLogin} />
  }

  return (
    <div>
      <div className="flex justify-between items-center p-4 border-b">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <Button onClick={handleLogout} variant="outline">
          Logout
        </Button>
      </div>
      <AdminDashboard />
    </div>
  )
}

export default AdminPage
