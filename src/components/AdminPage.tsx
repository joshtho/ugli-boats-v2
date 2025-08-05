import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Upload, Plus, Save, Settings, Eye, Check, X, Clock } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'

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
      
      const result = await response.json()
      
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
      
      const result = await response.json()
      
      alert('Build added successfully!')
      setNewBuild({ name: '', description: '', images: [] })
      
      // Reset the file input
      if (fileInput) fileInput.value = ''
      
    } catch (error) {
      console.error('Build creation error:', error)
      alert('Failed to add build: ' + (error as Error).message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
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
  )
}

// Submission review component
function SubmissionReview() {
  const [submissions, setSubmissions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)

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
      
      if (response.ok) {
        alert('Submission approved and converted to build!')
        fetchSubmissions() // Refresh the list
      } else {
        throw new Error('Failed to approve submission')
      }
    } catch (error) {
      console.error('Error approving submission:', error)
      alert('Failed to approve submission')
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
            <div key={submission.id} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{submission.buildName}</h3>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p><strong>Owner:</strong> {submission.ownerName}</p>
                    <p><strong>Email:</strong> {submission.email}</p>
                    <p><strong>Submitted:</strong> {new Date(submission.createdDate).toLocaleDateString()}</p>
                  </div>
                </div>
                <Badge variant="outline" className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Pending
                </Badge>
              </div>
              
              {submission.description && (
                <div>
                  <strong>Description:</strong>
                  <p className="mt-1 text-gray-700">{submission.description}</p>
                </div>
              )}
              
              {submission.images && submission.images.length > 0 && (
                <div>
                  <strong>Images:</strong>
                  <div className="flex gap-2 mt-2">
                    {submission.images.map((image: string, index: number) => (
                      <img 
                        key={index}
                        src={`http://localhost:3001${image}`}
                        alt={`Submission ${index + 1}`}
                        className="w-16 h-16 object-cover rounded border"
                      />
                    ))}
                  </div>
                </div>
              )}
              
              <div className="flex gap-2 pt-2">
                <Button 
                  onClick={() => handleApprove(submission.id)}
                  disabled={processing === submission.id}
                  className="flex items-center gap-2"
                  size="sm"
                >
                  <Check className="h-4 w-4" />
                  {processing === submission.id ? 'Processing...' : 'Approve & Add to Builds'}
                </Button>
                <Button 
                  onClick={() => handleReject(submission.id)}
                  disabled={processing === submission.id}
                  variant="outline"
                  className="flex items-center gap-2"
                  size="sm"
                >
                  <X className="h-4 w-4" />
                  Reject
                </Button>
              </div>
            </div>
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
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  if (!isAuthenticated) {
    return <AdminLogin onLogin={() => setIsAuthenticated(true)} />
  }

  return <AdminDashboard />
}

export default AdminPage
