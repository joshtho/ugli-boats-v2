import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Upload, Trash2, Eye } from 'lucide-react'

// Photo interface
interface Photo {
  id: string
  image: string
  alt: string
  category: string
  caption: string
  uploadDate: string
}

function PhotoUpload() {
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null)
  const [category, setCategory] = useState('')
  const [uploading, setUploading] = useState(false)
  
  // Photo management state
  const [photos, setPhotos] = useState<Photo[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null)

  const categories = [
    'Historical Ponton',
    'Customized Ponton', 
    'Other Military Boats',
    'Old Aluminum Boats',
    'Custom Aluminum Boats'
  ]

  // Fetch photos from API
  const fetchPhotos = async () => {
    setLoading(true)
    try {
      const response = await fetch('http://localhost:3001/api/photos')
      if (!response.ok) {
        throw new Error(`Failed to fetch photos: ${response.statusText}`)
      }
      const photosData = await response.json()
      
      // Fix image paths for uploaded photos when running locally
      const fixedPhotos = photosData.map((photo: Photo) => ({
        ...photo,
        image: photo.image.startsWith('/ugli-boats-v2/uploads/') 
          ? `http://localhost:3001${photo.image}`
          : photo.image
      }))
      
      setPhotos(fixedPhotos)
    } catch (error) {
      console.error('Error fetching photos:', error)
      alert('Failed to load photos')
    } finally {
      setLoading(false)
    }
  }

  // Load photos on component mount
  useEffect(() => {
    fetchPhotos()
  }, [])

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
      
      // Refresh photos list
      fetchPhotos()
      
    } catch (error) {
      console.error('Upload error:', error)
      alert('Upload failed: ' + (error as Error).message)
    } finally {
      setUploading(false)
    }
  }

  const handleDeletePhoto = async () => {
    if (!selectedPhoto) return

    try {
      const response = await fetch(`http://localhost:3001/api/photos/${selectedPhoto.id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error(`Delete failed: ${response.statusText}`)
      }

      alert('Photo deleted successfully')
      setDeleteDialogOpen(false)
      setSelectedPhoto(null)
      fetchPhotos() // Refresh the list
    } catch (error) {
      console.error('Delete error:', error)
      alert('Failed to delete photo: ' + (error as Error).message)
    }
  }

  const openDeleteDialog = (photo: Photo) => {
    setSelectedPhoto(photo)
    setDeleteDialogOpen(true)
  }

  return (
    <div className="space-y-8">
      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload New Photos
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

      {/* Photo Management Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trash2 className="h-5 w-5" />
            Manage Gallery Photos
          </CardTitle>
          <CardDescription>
            View and delete photos from the gallery ({photos.length} total photos)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-4">Loading photos...</div>
          ) : photos.length === 0 ? (
            <div className="text-center py-4 text-gray-500">No photos found</div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {photos.map((photo) => (
                <div key={photo.id} className="border rounded-lg p-2">
                  <img
                    src={photo.image}
                    alt={photo.alt}
                    className="w-full h-24 object-cover rounded mb-2"
                    onError={(e) => {
                      e.currentTarget.src = '/placeholder-image.png'
                    }}
                  />
                  <div className="text-xs text-gray-600 mb-2">
                    <div className="font-medium truncate">{photo.category}</div>
                    <div className="truncate">{photo.alt}</div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => setPreviewPhoto(photo.image)}
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      View
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="flex-1"
                      onClick={() => openDeleteDialog(photo)}
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this photo? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {selectedPhoto && (
            <div className="flex justify-center py-4">
              <img
                src={selectedPhoto.image}
                alt={selectedPhoto.alt}
                className="max-w-64 max-h-48 object-contain rounded"
              />
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeletePhoto}>
              Delete Photo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Photo Preview Dialog */}
      <Dialog open={!!previewPhoto} onOpenChange={() => setPreviewPhoto(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Photo Preview</DialogTitle>
          </DialogHeader>
          {previewPhoto && (
            <div className="flex justify-center">
              <img
                src={previewPhoto}
                alt="Preview"
                className="max-w-full max-h-[70vh] object-contain"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default PhotoUpload

