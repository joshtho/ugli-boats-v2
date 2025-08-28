import { useState, useEffect } from 'react'
import { getApiUrl, getImageUrl } from '@/config/api'
import { authenticatedFetch } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Upload, Trash2, Eye, X, Edit, Video, Youtube } from 'lucide-react'

// Interfaces for interesting content
interface MediaItem {
  id: string
  type: 'image' | 'video' | 'youtube' | 'vimeo'
  alt: string
  caption: string
  url: string
}

interface InterestingContent {
  id: string
  header: string
  description: string
  media: MediaItem[]
  createdDate: string
  updatedDate?: string
}

interface MediaPreview {
  file?: File
  preview?: string
  type: 'image' | 'video' | 'youtube' | 'vimeo'
  alt: string
  caption: string
  url?: string
}

function EditInteresting() {
  const [interestingContent, setInterestingContent] = useState<InterestingContent[]>([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)

  // Upload form state
  const [uploadForm, setUploadForm] = useState({
    header: '',
    description: ''
  })
  const [mediaPreviews, setMediaPreviews] = useState<MediaPreview[]>([])
  const [youtubeUrl, setYoutubeUrl] = useState('')

  // Helper function to describe media types
  const getMediaTypesDescription = (media: MediaItem[]): string => {
    const counts: { [key: string]: number } = {
      image: 0,
      video: 0,
      youtube: 0,
      vimeo: 0
    }

    media.forEach(item => {
      counts[item.type] = (counts[item.type] || 0) + 1
    })

    const parts: string[] = []
    if (counts.image > 0) parts.push(`${counts.image} image${counts.image !== 1 ? 's' : ''}`)
    if (counts.video > 0) parts.push(`${counts.video} video${counts.video !== 1 ? 's' : ''}`)
    if (counts.youtube > 0) parts.push(`${counts.youtube} YouTube${counts.youtube !== 1 ? ' videos' : ' video'}`)
    if (counts.vimeo > 0) parts.push(`${counts.vimeo} Vimeo${counts.vimeo !== 1 ? ' videos' : ' video'}`)

    return parts.join(', ') || 'No media'
  }

  // Helper function to render small media previews in edit dialog
  const renderEditMediaPreview = (media: MediaItem) => {
    if (media.type === 'image') {
      return (
        <img 
          src={media.url} 
          alt={media.alt}
          className="w-full h-full object-cover"
        />
      )
    } else if (media.type === 'video') {
      return (
        <video 
          src={media.url} 
          className="w-full h-full object-cover"
          muted
        />
      )
    } else if (media.type === 'youtube') {
      const videoId = media.url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/)?.[1]
      const thumbnailUrl = videoId ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg` : null
      
      return thumbnailUrl ? (
        <div className="relative w-full h-full">
          <img 
            src={thumbnailUrl}
            alt={media.alt}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
            <Youtube className="h-3 w-3 text-white" />
          </div>
        </div>
      ) : (
        <div className="w-full h-full bg-gray-200 flex items-center justify-center">
          <Youtube className="h-4 w-4 text-gray-500" />
        </div>
      )
    } else if (media.type === 'vimeo') {
      return (
        <div className="w-full h-full bg-gray-200 flex items-center justify-center">
          <Video className="h-4 w-4 text-gray-500" />
        </div>
      )
    }
  }

  // Management state
  const [selectedContent, setSelectedContent] = useState<InterestingContent | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [editContent, setEditContent] = useState<InterestingContent | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [previewContent, setPreviewContent] = useState<InterestingContent | null>(null)

  // Fetch interesting content from API
  const fetchInterestingContent = async () => {
    setLoading(true)
    try {
      const response = await authenticatedFetch('interesting')
      if (!response.ok) {
        throw new Error(`Failed to fetch interesting content: ${response.statusText}`)
      }
      const contentData = await response.json()
      
      // Fix media paths for uploaded files when running locally
      const fixedContent = contentData.map((content: InterestingContent) => ({
        ...content,
        media: content.media.map(mediaItem => ({
          ...mediaItem,
          url: mediaItem.url.startsWith('/ugli-boats-v2/uploads/') 
            ? getImageUrl(`${mediaItem.url}`)
            : mediaItem.url
        }))
      }))
      
      setInterestingContent(fixedContent)
    } catch (error) {
      console.error('Error fetching interesting content:', error)
      alert('Failed to load interesting content')
    } finally {
      setLoading(false)
    }
  }

  // Load interesting content on component mount
  useEffect(() => {
    fetchInterestingContent()
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    const newPreviews: MediaPreview[] = []
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const preview = URL.createObjectURL(file)
      const type = file.type.startsWith('image/') ? 'image' : 'video'
      
      newPreviews.push({
        file,
        preview,
        type,
        alt: file.name.replace(/\.[^/.]+$/, ""),
        caption: ''
      })
    }
    
    setMediaPreviews(prev => [...prev, ...newPreviews])
  }

  const addYoutubeVideo = () => {
    if (!youtubeUrl.trim()) {
      alert('Please enter a YouTube URL')
      return
    }

    let embedUrl = youtubeUrl
    let type: 'youtube' | 'vimeo' = 'youtube'

    // Convert YouTube URLs to embed format
    if (youtubeUrl.includes('youtube.com/watch?v=')) {
      const videoId = youtubeUrl.split('v=')[1].split('&')[0]
      embedUrl = `https://www.youtube.com/embed/${videoId}`
    } else if (youtubeUrl.includes('youtu.be/')) {
      const videoId = youtubeUrl.split('youtu.be/')[1].split('?')[0]
      embedUrl = `https://www.youtube.com/embed/${videoId}`
    } else if (youtubeUrl.includes('vimeo.com')) {
      type = 'vimeo'
      // Keep Vimeo URLs as is since they're already in embed format usually
    }

    const newPreview: MediaPreview = {
      type,
      alt: 'YouTube/Vimeo video',
      caption: '',
      url: embedUrl
    }

    setMediaPreviews(prev => [...prev, newPreview])
    setYoutubeUrl('')
  }

  const removeMediaPreview = (index: number) => {
    setMediaPreviews(prev => {
      const updated = [...prev]
      // Revoke object URL for files to prevent memory leaks
      if (updated[index].preview) {
        URL.revokeObjectURL(updated[index].preview!)
      }
      updated.splice(index, 1)
      return updated
    })
  }

  const updateMediaPreview = (index: number, field: 'alt' | 'caption', value: string) => {
    setMediaPreviews(prev => {
      const updated = [...prev]
      updated[index][field] = value
      return updated
    })
  }

  const handleUpload = async () => {
    if (!uploadForm.header.trim()) {
      alert('Please enter a header')
      return
    }

    if (mediaPreviews.length === 0) {
      alert('Please add at least one media item')
      return
    }

    setUploading(true)
    try {
      const formData = new FormData()
      
      // Add basic content data
      formData.append('header', uploadForm.header.trim())
      formData.append('description', uploadForm.description.trim())

      // Separate file media from YouTube/Vimeo videos
      const fileMedia: MediaPreview[] = []
      const youtubeMedia: any[] = []

      mediaPreviews.forEach(media => {
        if (media.file) {
          fileMedia.push(media)
        } else {
          youtubeMedia.push({
            type: media.type,
            alt: media.alt,
            caption: media.caption,
            url: media.url
          })
        }
      })

      // Add files to FormData
      fileMedia.forEach(media => {
        if (media.file) {
          formData.append('media', media.file)
        }
      })

      // Add metadata for files
      const mediaMetadata = fileMedia.map(media => ({
        alt: media.alt,
        caption: media.caption
      }))
      formData.append('metadata', JSON.stringify(mediaMetadata))

      // Add YouTube/Vimeo videos
      if (youtubeMedia.length > 0) {
        formData.append('youtubeVideos', JSON.stringify(youtubeMedia))
      }

      const response = await authenticatedFetch('interesting', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Upload failed')
      }

      const result = await response.json()
      console.log('Upload successful:', result)

      // Reset form
      setUploadForm({ header: '', description: '' })
      setMediaPreviews([])
      
      // Refresh interesting content list
      fetchInterestingContent()
      
      alert('Interesting content uploaded successfully!')
    } catch (error) {
      console.error('Upload error:', error)
      alert(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedContent) return

    try {
      const response = await authenticatedFetch(`interesting/${selectedContent.id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Delete failed')
      }

      alert('Interesting content deleted successfully!')
      setDeleteDialogOpen(false)
      setSelectedContent(null)
      fetchInterestingContent()
    } catch (error) {
      console.error('Delete error:', error)
      alert(`Delete failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const handleEdit = async () => {
    if (!editContent) return

    try {
      const response = await authenticatedFetch(`interesting/${editContent.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          header: editContent.header,
          description: editContent.description,
          media: editContent.media
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Update failed')
      }

      alert('Interesting content updated successfully!')
      setEditDialogOpen(false)
      setEditContent(null)
      fetchInterestingContent()
    } catch (error) {
      console.error('Update error:', error)
      alert(`Update failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const renderMediaPreview = (media: MediaPreview, _index: number) => {
    if (media.type === 'image') {
      return (
        <img 
          src={media.preview} 
          alt={media.alt}
          className="w-full h-32 object-cover rounded"
        />
      )
    } else if (media.type === 'video') {
      return (
        <video 
          src={media.preview} 
          className="w-full h-32 object-cover rounded"
          controls={false}
        />
      )
    } else if (media.type === 'youtube' || media.type === 'vimeo') {
      return (
        <div className="w-full h-32 bg-gray-100 rounded flex items-center justify-center">
          {media.type === 'youtube' ? 
            <Youtube className="h-8 w-8 text-red-500" /> : 
            <Video className="h-8 w-8 text-blue-500" />
          }
          <span className="ml-2 text-sm text-gray-600">
            {media.type === 'youtube' ? 'YouTube' : 'Vimeo'} Video
          </span>
        </div>
      )
    }
  }

  const renderMediaItem = (media: MediaItem) => {
    if (media.type === 'image') {
      return (
        <img 
          src={media.url} 
          alt={media.alt}
          className="w-full h-32 object-cover rounded"
        />
      )
    } else if (media.type === 'video') {
      return (
        <video 
          src={media.url} 
          className="w-full h-32 object-cover rounded"
          controls
        />
      )
    } else if (media.type === 'youtube' || media.type === 'vimeo') {
      return (
        <iframe
          src={media.url}
          className="w-full h-32 rounded"
          frameBorder="0"
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
        />
      )
    }
  }

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Add New Interesting Content
          </CardTitle>
          <CardDescription>Upload images, videos, or add YouTube/Vimeo content</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Content Details Form */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="header">Header *</Label>
              <Input
                id="header"
                type="text"
                value={uploadForm.header}
                onChange={(e) => setUploadForm(prev => ({ ...prev, header: e.target.value }))}
                placeholder="Enter content header..."
              />
            </div>
            
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={uploadForm.description}
                onChange={(e) => setUploadForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter content description..."
                rows={3}
              />
            </div>
          </div>

          {/* Media Upload Section */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="media-files">Upload Images/Videos</Label>
              <Input
                id="media-files"
                type="file"
                onChange={handleFileChange}
                accept="image/*,video/*"
                multiple
                className="cursor-pointer"
              />
            </div>

            {/* YouTube/Vimeo URL Input */}
            <div className="flex gap-2">
              <Input
                type="url"
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                placeholder="Enter YouTube or Vimeo URL..."
                className="flex-1"
              />
              <Button type="button" onClick={addYoutubeVideo} variant="outline">
                <Youtube className="h-4 w-4 mr-1" />
                Add Video
              </Button>
            </div>
          </div>

          {/* Media Previews */}
          {mediaPreviews.length > 0 && (
            <div className="space-y-4">
              <Label>Media Previews</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {mediaPreviews.map((media, index) => (
                  <Card key={index} className="relative">
                    <CardContent className="p-3">
                      <Button
                        type="button"
                        onClick={() => removeMediaPreview(index)}
                        className="absolute top-1 right-1 h-6 w-6 p-0"
                        variant="destructive"
                        size="sm"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                      
                      {renderMediaPreview(media, index)}
                      
                      <div className="mt-2 space-y-2">
                        <Input
                          type="text"
                          value={media.alt}
                          onChange={(e) => updateMediaPreview(index, 'alt', e.target.value)}
                          placeholder="Alt text..."
                        />
                        <Input
                          type="text"
                          value={media.caption}
                          onChange={(e) => updateMediaPreview(index, 'caption', e.target.value)}
                          placeholder="Caption..."
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
            disabled={uploading || !uploadForm.header.trim() || mediaPreviews.length === 0}
            className="w-full"
          >
            <Upload className="h-4 w-4 mr-2" />
            {uploading ? 'Uploading...' : 'Upload Interesting Content'}
          </Button>
        </CardContent>
      </Card>

      {/* Manage Existing Content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Manage Interesting Content
          </CardTitle>
          <CardDescription>View, edit, and delete existing interesting content</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading content...</div>
          ) : interestingContent.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No content found</div>
          ) : (
            <div className="space-y-4">
              {interestingContent.map((content) => (
                <Card key={content.id} className="border-l-4 border-blue-500">
                  <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row gap-4">
                      {/* Media Preview */}
                      {content.media && content.media.length > 0 && (
                        <div className="flex-shrink-0 order-2 sm:order-1">
                          <div className="flex gap-2 justify-center sm:justify-start">
                            {content.media.slice(0, 3).map((mediaItem, index) => {
                              if (mediaItem.type === 'image') {
                                return (
                                  <img 
                                    key={index}
                                    src={mediaItem.url}
                                    alt={mediaItem.alt || `Media ${index + 1}`}
                                    className="w-16 h-16 object-cover rounded border"
                                    onError={(e) => {
                                      console.log('Image failed to load:', mediaItem.url)
                                      e.currentTarget.style.display = 'none'
                                    }}
                                  />
                                )
                              } else if (mediaItem.type === 'video') {
                                return (
                                  <video 
                                    key={index}
                                    src={mediaItem.url}
                                    className="w-16 h-16 object-cover rounded border"
                                    muted
                                    onError={(e) => {
                                      console.log('Video failed to load:', mediaItem.url)
                                      e.currentTarget.style.display = 'none'
                                    }}
                                  />
                                )
                              } else if (mediaItem.type === 'youtube') {
                                // Extract video ID from YouTube URL for thumbnail
                                const videoId = mediaItem.url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/)?.[1]
                                const thumbnailUrl = videoId ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg` : null
                                
                                return thumbnailUrl ? (
                                  <div key={index} className="relative w-16 h-16 rounded border overflow-hidden">
                                    <img 
                                      src={thumbnailUrl}
                                      alt={mediaItem.alt || `YouTube Video ${index + 1}`}
                                      className="w-full h-full object-cover"
                                    />
                                    <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
                                      <Youtube className="h-4 w-4 text-white" />
                                    </div>
                                  </div>
                                ) : (
                                  <div key={index} className="w-16 h-16 bg-gray-200 rounded border flex items-center justify-center">
                                    <Youtube className="h-4 w-4 text-gray-500" />
                                  </div>
                                )
                              } else if (mediaItem.type === 'vimeo') {
                                return (
                                  <div key={index} className="w-16 h-16 bg-gray-200 rounded border flex items-center justify-center">
                                    <Video className="h-4 w-4 text-gray-500" />
                                  </div>
                                )
                              }
                              return null
                            })}
                            {content.media.length > 3 && (
                              <div className="w-16 h-16 bg-gray-100 rounded border flex items-center justify-center text-xs text-gray-500">
                                +{content.media.length - 3}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {/* Content Info */}
                      <div className="flex-1 min-w-0 order-1 sm:order-2">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-lg truncate">{content.header}</h3>
                            {content.description && (
                              <p className="text-gray-600 mt-1 line-clamp-2">{content.description}</p>
                            )}
                            <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                              <span>{getMediaTypesDescription(content.media)}</span>
                              <span>Created: {new Date(content.createdDate).toLocaleDateString()}</span>
                            </div>
                          </div>
                          
                          <div className="flex gap-2 flex-shrink-0 justify-center sm:justify-start">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setPreviewContent(content)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditContent(content)
                                setEditDialogOpen(true)
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => {
                                setSelectedContent(content)
                                setDeleteDialogOpen(true)
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Interesting Content</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedContent?.header}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Content Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Interesting Content</DialogTitle>
            <DialogDescription>
              Update the content details
            </DialogDescription>
          </DialogHeader>
          {editContent && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-header">Header</Label>
                <Input
                  id="edit-header"
                  type="text"
                  value={editContent.header}
                  onChange={(e) => setEditContent(prev => prev ? { ...prev, header: e.target.value } : null)}
                />
              </div>
              
              <div>
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={editContent.description}
                  onChange={(e) => setEditContent(prev => prev ? { ...prev, description: e.target.value } : null)}
                  rows={3}
                />
              </div>

              <div>
                <Label>Media Items ({editContent.media.length})</Label>
                <div className="grid grid-cols-1 gap-3 mt-2">
                  {editContent.media.map((media, index) => (
                    <div key={media.id} className="border rounded p-3 relative">
                      {/* Delete button for individual media item */}
                      <Button
                        size="sm"
                        variant="destructive"
                        className="absolute top-2 right-2 h-6 w-6 p-0"
                        onClick={() => {
                          setEditContent(prev => prev ? {
                            ...prev,
                            media: prev.media.filter((_, i) => i !== index)
                          } : null)
                        }}
                        title="Delete this media item"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                      
                      <div className="flex gap-3">
                        {/* Media preview */}
                        <div className="flex-shrink-0">
                          <div className="w-20 h-20 border rounded overflow-hidden">
                            {renderEditMediaPreview(media)}
                          </div>
                          <div className="text-xs text-center mt-1 font-medium text-gray-600">
                            {media.type}
                          </div>
                        </div>
                        
                        {/* Media details */}
                        <div className="flex-1 space-y-2">
                          <div>
                            <Label className="text-xs">Alt Text</Label>
                            <Input
                              type="text"
                              value={media.alt}
                              onChange={(e) => {
                                setEditContent(prev => prev ? {
                                  ...prev,
                                  media: prev.media.map((m, i) => 
                                    i === index ? { ...m, alt: e.target.value } : m
                                  )
                                } : null)
                              }}
                              placeholder="Alt text..."
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Caption</Label>
                            <Input
                              type="text"
                              value={media.caption}
                              onChange={(e) => {
                                setEditContent(prev => prev ? {
                                  ...prev,
                                  media: prev.media.map((m, i) => 
                                    i === index ? { ...m, caption: e.target.value } : m
                                  )
                                } : null)
                              }}
                              placeholder="Caption..."
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {editContent.media.length === 0 && (
                    <div className="text-center py-4 text-gray-500">
                      No media items
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEdit}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Content Dialog */}
      <Dialog open={!!previewContent} onOpenChange={() => setPreviewContent(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{previewContent?.header}</DialogTitle>
            {previewContent?.description && (
              <DialogDescription>{previewContent.description}</DialogDescription>
            )}
          </DialogHeader>
          {previewContent && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {previewContent.media.map((media) => (
                  <div key={media.id} className="space-y-2">
                    {renderMediaItem(media)}
                    {(media.caption || media.alt) && (
                      <div className="text-sm text-gray-600">
                        {media.caption && <p>Caption: {media.caption}</p>}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default EditInteresting
