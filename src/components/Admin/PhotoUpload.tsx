import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Upload, Trash2, Eye, X, Edit } from 'lucide-react'
import { authenticatedFetch } from '@/lib/auth'
import { getImageUrl } from '@/config/api'

// Photo interface
interface Photo {
  id: string
  image: string
  alt: string
  category: string
  caption: string
  uploadDate: string
}

// Interface for photo previews before upload
interface PhotoPreview {
  file: File
  preview: string
  caption: string
  alt: string
}

interface PreviewPhoto {
  image: string
  caption: string
}

function PhotoUpload() {
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null)
  const [category, setCategory] = useState('')
  const [uploading, setUploading] = useState(false)
  
  // Photo previews before upload
  const [photoPreviews, setPhotoPreviews] = useState<PhotoPreview[]>([])
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  
  // Photo management state
  const [photos, setPhotos] = useState<Photo[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [previewPhoto, setPreviewPhoto] = useState<PreviewPhoto | null>(null)

  // Edit photo state
  const [editPhoto, setEditPhoto] = useState<Photo | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editFormData, setEditFormData] = useState<{alt: string, caption: string, category: string}>({
    alt: '',
    caption: '',
    category: ''
  })

  const categories = [
    'Historical Ponton',
    'Customized Ponton', 
    'Other Military Boats',
    'Custom Aluminum Boats'
  ]

  // Fetch photos from API
  const fetchPhotos = async () => {
    setLoading(true)
    try {
      const response = await authenticatedFetch('photos')
      if (!response.ok) {
        throw new Error(`Failed to fetch photos: ${response.statusText}`)
      }
      const photosData = await response.json()
      
      // Fix image paths for uploaded photos when running locally
      const fixedPhotos = photosData.map((photo: Photo) => ({
        ...photo,
        image: getImageUrl(photo.image)
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
    const files = e.target.files
    if (!files) return

    setSelectedFiles(files)

    // Create preview objects for each file
    const fileArray = Array.from(files)
    const newPreviews: PhotoPreview[] = fileArray.map(file => {
      const preview = URL.createObjectURL(file)
      return {
        file,
        preview,
        caption: '',
        alt: `Photo - ${file.name}`
      }
    })

    // Clean up old previews
    photoPreviews.forEach(item => {
      URL.revokeObjectURL(item.preview)
    })

    setPhotoPreviews(newPreviews)
  }

  // Update caption for a specific preview
  const updatePreviewCaption = (index: number, caption: string) => {
    setPhotoPreviews(prev => 
      prev.map((item, i) => 
        i === index ? { ...item, caption } : item
      )
    )
  }

  // Update alt text for a specific preview
  const updatePreviewAlt = (index: number, alt: string) => {
    setPhotoPreviews(prev => 
      prev.map((item, i) => 
        i === index ? { ...item, alt } : item
      )
    )
  }

  // Remove a preview
  const removePreview = (index: number) => {
    const itemToRemove = photoPreviews[index]
    URL.revokeObjectURL(itemToRemove.preview)

    setPhotoPreviews(prev => prev.filter((_, i) => i !== index))

    // Update selectedFiles to match
    if (selectedFiles) {
      const newFiles = Array.from(selectedFiles).filter((_, i) => i !== index)
      const dt = new DataTransfer()
      newFiles.forEach(file => dt.items.add(file))
      setSelectedFiles(dt.files)
    }
  }

  // Clear all previews
  const clearAllPreviews = () => {
    photoPreviews.forEach(item => {
      URL.revokeObjectURL(item.preview)
    })
    setPhotoPreviews([])
    setSelectedFiles(null)
    
    // Reset the file input
    const fileInput = document.getElementById('photos') as HTMLInputElement
    if (fileInput) fileInput.value = ''
  }

  const handleUpload = async () => {
    if (!selectedFiles || !category || photoPreviews.length === 0) {
      alert('Please select files and category')
      return
    }

    setUploading(true)
    
    try {
      // Create FormData for file upload
      const formData = new FormData()
      formData.append('category', category)
      
      // Add files and their metadata
      photoPreviews.forEach((preview, index) => {
        formData.append('photos', preview.file)
        formData.append(`caption_${index}`, preview.caption)
        formData.append(`alt_${index}`, preview.alt)
      })
      
      // Also send as JSON for debugging
      const metadata = {
        captions: photoPreviews.map(p => p.caption),
        alts: photoPreviews.map(p => p.alt)
      }
      formData.append('metadata', JSON.stringify(metadata))
      
      console.log('Uploading with metadata:', metadata)
      
      // Send to backend API
      const response = await authenticatedFetch('photos/upload', {
        method: 'POST',
        body: formData
      })
      
      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`)
      }
      
      await response.json()
      
      alert(`Successfully uploaded ${selectedFiles.length} photos to ${category}`)
      
      // Clean up
      clearAllPreviews()
      setCategory('')
      
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
      const response = await authenticatedFetch(`photos/${selectedPhoto.id}`, {
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

  // Edit photo functions
  const openEditDialog = (photo: Photo) => {
    setEditPhoto(photo)
    setEditFormData({
      alt: photo.alt,
      caption: photo.caption,
      category: photo.category
    })
    setEditDialogOpen(true)
  }

  const handleEditPhoto = async () => {
    if (!editPhoto) return

    try {
      const response = await authenticatedFetch(`photos/${editPhoto.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          alt: editFormData.alt,
          caption: editFormData.caption,
          category: editFormData.category
        })
      })

      if (!response.ok) {
        throw new Error(`Update failed: ${response.statusText}`)
      }

      alert('Photo updated successfully')
      setEditDialogOpen(false)
      setEditPhoto(null)
      setEditFormData({ alt: '', caption: '', category: '' })
      fetchPhotos() // Refresh the list
    } catch (error) {
      console.error('Update error:', error)
      alert('Failed to update photo: ' + (error as Error).message)
    }
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
              className="cursor-pointer"
            />
            {photoPreviews.length > 0 && (
              <p className="text-sm text-gray-600 mt-1">
                {photoPreviews.length} file(s) ready to upload
              </p>
            )}
          </div>

          {/* Photo Previews */}
          {photoPreviews.length > 0 && (
            <div className="mt-4 space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="font-medium text-gray-900">Preview Photos</h4>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={clearAllPreviews}
                >
                  Clear All
                </Button>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {photoPreviews.map((item, index) => (
                  <Card key={index} className="relative">
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2 z-10"
                      onClick={() => removePreview(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                    
                    <img
                      src={item.preview}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-32 object-cover rounded-t cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => setImagePreview(item.preview)}
                    />
                    
                    <CardContent className="p-3 space-y-2">
                      <div>
                        <Label htmlFor={`alt-${index}`} className="text-xs">
                          Alt Text
                        </Label>
                        <Input
                          id={`alt-${index}`}
                          value={item.alt}
                          onChange={(e) => updatePreviewAlt(index, e.target.value)}
                          placeholder="Describe the photo..."
                          className="text-xs"
                        />
                      </div>
                      <div>
                        <Label htmlFor={`caption-${index}`} className="text-xs">
                          Caption (optional)
                        </Label>
                        <Input
                          id={`caption-${index}`}
                          value={item.caption}
                          onChange={(e) => updatePreviewCaption(index, e.target.value)}
                          placeholder="Add a caption..."
                          className="text-xs"
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          <Button 
            onClick={handleUpload} 
            disabled={!selectedFiles || !category || uploading || photoPreviews.length === 0}
            className="w-full"
          >
            {uploading ? 'Uploading...' : `Upload ${photoPreviews.length} Photos`}
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
            View, edit, and delete photos from the gallery ({photos.length} total photos)
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
                  <div className="text-xs text-gray-600 mb-2 space-y-1">
                    <div className="font-medium truncate">{photo.category}</div>
                    <div className="truncate">{photo.alt}</div>
                    {photo.caption && (
                      <div className="text-gray-500 truncate italic">"{photo.caption}"</div>
                    )}
                  </div>
                  <div className="flex gap-1 flex-wrap">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => setPreviewPhoto({ image: photo.image, caption: photo.caption })}
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      View
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => openEditDialog(photo)}
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="w-full mt-1"
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

      {/* Edit Photo Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Photo</DialogTitle>
            <DialogDescription>
              Update the photo's information and caption.
            </DialogDescription>
          </DialogHeader>
          {editPhoto && (
            <div className="space-y-4">
              <div className="flex justify-center">
                <img
                  src={editPhoto.image}
                  alt={editPhoto.alt}
                  className="max-w-64 max-h-48 object-contain rounded"
                />
              </div>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="edit-category">Category</Label>
                  <Select 
                    value={editFormData.category} 
                    onValueChange={(value) => setEditFormData(prev => ({ ...prev, category: value }))}
                  >
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
                  <Label htmlFor="edit-alt">Alt Text</Label>
                  <Input
                    id="edit-alt"
                    value={editFormData.alt}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, alt: e.target.value }))}
                    placeholder="Describe the photo..."
                  />
                </div>
                
                <div>
                  <Label htmlFor="edit-caption">Caption</Label>
                  <Input
                    id="edit-caption"
                    value={editFormData.caption}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, caption: e.target.value }))}
                    placeholder="Add a caption (optional)..."
                  />
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditPhoto}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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

      {/* Upload Preview Dialog */}
      <Dialog open={!!imagePreview} onOpenChange={() => setImagePreview(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Photo Preview</DialogTitle>
          </DialogHeader>
          {imagePreview && (
            <div className="flex justify-center">
              <img
                src={imagePreview}
                alt="Upload Preview"
                className="max-w-full max-h-[70vh] object-contain"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Photo Preview Dialog */}
      <Dialog open={!!previewPhoto} onOpenChange={() => setPreviewPhoto(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Photo Preview</DialogTitle>
          </DialogHeader>
          {previewPhoto && (
            <div className="flex-col justify-center">
              <img
                src={previewPhoto.image}
                alt="Preview"
                className="max-w-full max-h-[70vh] object-contain"
              />
              {previewPhoto.caption && (
                <p
                  className="
                    mt-4
                    mx-auto
                    px-4
                    py-2
                    max-w-xl
                    text-center
                    text-base
                    text-gray-700
                    bg-white/80
                    rounded
                  "
                >
                  {previewPhoto.caption.split('\n').map((line: string, i: number) => (
                    <span key={i}>
                      {line}
                      <br />
                    </span>
                  ))}
                </p>
              )}
            </div>
          )}
            
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default PhotoUpload

