import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Save, Eye, X, Trash2 } from 'lucide-react'
import BoatPage from '../BoatPage'

interface MediaItem {
  alt: string
  caption: string
  url: string
}

interface NewMediaPreview {
  file: File
  preview: string
  type: 'image' | 'video'
  caption: string
}

interface BuildData {
  id?: string
  name: string
  buildName: string
  header?: string
  introText: string
  email?: string
  forSale?: {
    onMarket: boolean
    price: number
    links: {
      craigslistUrl: string
      facebookUrl: string
      otherUrl: string
    }
  }
  images: MediaItem[]
}

interface EditBuildProps {
  buildData?: BuildData | null
  isSubmission?: boolean
  onSave?: (data: BuildData) => void
  onCancel?: () => void
  onApprove?: () => void
  onReject?: () => void
  onDelete?: () => void
}

function EditBuild({ 
  buildData, 
  isSubmission = false, 
  onSave, 
  onCancel,
  onApprove,
  onReject,
  onDelete 
}: EditBuildProps) {
  const [formData, setFormData] = useState<BuildData>({
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
    },
    images: []
  })
  const [_newFiles, setNewFiles] = useState<File[]>([])
  const [newMediaPreviews, setNewMediaPreviews] = useState<NewMediaPreview[]>([])
  const [previewMode, setPreviewMode] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [imagePreview, setImagePreview] = useState<{ url: string, alt: string, type: 'image' | 'video' } | null>(null)

  // Initialize form data when buildData changes
  useEffect(() => {
    if (buildData) {
      setFormData({
        ...buildData,
        header: buildData.header || '',
        forSale: buildData.forSale || {
          onMarket: false,
          price: 0,
          links: {
            craigslistUrl: '',
            facebookUrl: '',
            otherUrl: ''
          }
        },
        email: buildData.email || ''
      })
    }
  }, [buildData])

  // Cleanup preview URLs on unmount
  useEffect(() => {
    console.log(newMediaPreviews)
    return () => {
      newMediaPreviews.forEach(item => {
        URL.revokeObjectURL(item.preview)
      })
    }
  }, [newMediaPreviews])

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

    const fileArray = Array.from(files)
    
    // Add to existing files instead of replacing
    setNewFiles(prev => [...prev, ...fileArray])

    // Create preview objects for each new file
    const newPreviews: NewMediaPreview[] = fileArray.map(file => {
      const preview = URL.createObjectURL(file)
      const type = file.type.startsWith('video/') ? 'video' : 'image'
      
      return {
        file,
        preview,
        type,
        caption: ''
      }
    })

    // Add to existing previews instead of replacing
    setNewMediaPreviews(prev => [...prev, ...newPreviews])

    // Clear the input so the same files can be selected again if needed
    e.target.value = ''
  }

  const uploadNewFiles = async () => {
    if (newMediaPreviews.length === 0) return []

    const formData = new FormData()
    newMediaPreviews.forEach((preview) => {
      formData.append('images', preview.file)
      formData.append(`captions`, preview.caption || preview.file.name)
    })

    const response = await fetch('http://localhost:3001/api/admin/upload', {
      method: 'POST',
      body: formData
    })

    if (!response.ok) {
      throw new Error('File upload failed')
    }

    const data = await response.json()
    return data.images // Should return array of {alt, url} objects
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      // Upload new files if any
      const uploadedImages = await uploadNewFiles()
      
      // Combine existing and new images
      const updatedBuild = {
        ...formData,
        images: [...formData.images, ...uploadedImages]
      }

      if (onSave) {
        await onSave(updatedBuild)
      }

      setNewFiles([]) // Clear new files after save
      
      // Clean up preview URLs
      newMediaPreviews.forEach(item => {
        URL.revokeObjectURL(item.preview)
      })
      setNewMediaPreviews([])
    } catch (error) {
      console.error('Save error:', error)
      alert('Save failed: ' + (error as Error).message)
    } finally {
      setSaving(false)
    }
  }

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }))
  }

  const updateImageCaption = (index: number, caption: string) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.map((img, i) => 
        i === index ? { ...img, caption } : img
      )
    }))
  }

  const removeNewMedia = (index: number) => {
    const itemToRemove = newMediaPreviews[index]
    if (itemToRemove) {
      URL.revokeObjectURL(itemToRemove.preview)
    }
    
    setNewMediaPreviews(prev => prev.filter((_, i) => i !== index))
    setNewFiles(prev => prev.filter((_, i) => i !== index))
  }

  const updateNewMediaCaption = (index: number, caption: string) => {
    setNewMediaPreviews(prev => 
      prev.map((item, i) => {
        console.log(item)
        return i === index ? { ...item, caption } : item
      })
    )
  }

  const getMediaType = (url: string): 'image' | 'video' => {
    const lowerUrl = url.toLowerCase()
    return (lowerUrl.endsWith('.mp4') || lowerUrl.endsWith('.mov') || 
            lowerUrl.includes('youtube') || lowerUrl.includes('youtu.be')) ? 'video' : 'image'
  }

  const getImageUrl = (url: string): string => {
    if (url.startsWith('http')) return url
    if (url.startsWith('/ugli-boats-v2')) return `http://localhost:3001${url}`
    if (url.startsWith('/uploads')) return `http://localhost:3001${url}`
    return `http://localhost:3001/uploads/${url}`
  }

  if (previewMode) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold">Preview Mode</h2>
          <Button onClick={() => setPreviewMode(false)} variant="outline">
            <X className="h-4 w-4 mr-2" />
            Exit Preview
          </Button>
        </div>
        <BoatPage buildData={formData} />
        {isSubmission && (
          <div className="flex gap-2 justify-end bg-white p-4 border-t sticky bottom-0">
            <Button onClick={onReject} variant="destructive">
              Reject
            </Button>
            <Button onClick={onApprove} className="bg-green-600 hover:bg-green-700">
              Approve & Publish
            </Button>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          <Button onClick={() => setPreviewMode(true)} variant="outline">
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
          {onCancel && (
            <Button onClick={onCancel} variant="outline">
              Cancel
            </Button>
          )}
          
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form Section */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Build Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">Builder Name</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Enter builder name"
                />
              </div>

              {isSubmission && formData.email && (
                <div>
                  <Label htmlFor="email">Contact Email</Label>
                  <Input
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Enter contact email"
                  />
                </div>
              )}

              <div>
                <Label htmlFor="buildName">Build Name</Label>
                <Input
                  id="buildName"
                  name="buildName"
                  value={formData.buildName}
                  onChange={handleInputChange}
                  placeholder="What is this boat called?"
                />
              </div>

              <div>
                <Label htmlFor="header">Header (optional)</Label>
                <Input
                  id="header"
                  name="header"
                  value={formData.header}
                  onChange={handleInputChange}
                  placeholder="Short description or tagline"
                />
              </div>

              <div>
                <Label htmlFor="introText">Description</Label>
                <Textarea
                  id="introText"
                  name="introText"
                  value={formData.introText}
                  onChange={handleInputChange}
                  placeholder="Tell the story of this build..."
                  rows={6}
                />
              </div>

              {/* For Sale Section */}
              <div className="space-y-4 border-t pt-4">
                <h3 className="text-lg font-semibold">For Sale Information</h3>
                
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="onMarket"
                    checked={formData.forSale?.onMarket || false}
                    onChange={(e) => 
                      setFormData(prev => ({
                        ...prev,
                        forSale: {
                          ...prev.forSale!,
                          onMarket: e.target.checked
                        }
                      }))
                    }
                  />
                  <Label htmlFor="onMarket">This build is for sale</Label>
                </div>

                {formData.forSale?.onMarket && (
                  <div className="space-y-4 ml-6 border-l-2 border-gray-200 pl-4">
                    <div>
                      <Label htmlFor="price">Asking Price ($)</Label>
                      <Input
                        id="price"
                        type="number"
                        value={formData.forSale.price === 0 ? '' : formData.forSale.price}
                        onChange={(e) => 
                          setFormData(prev => ({
                            ...prev,
                            forSale: {
                              ...prev.forSale!,
                              price: e.target.value === '' ? 0 : parseInt(e.target.value)
                            }
                          }))
                        }
                        placeholder="Enter price"
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
                              ...prev.forSale!,
                              links: {
                                ...prev.forSale!.links,
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
                              ...prev.forSale!,
                              links: {
                                ...prev.forSale!.links,
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
                              ...prev.forSale!,
                              links: {
                                ...prev.forSale!.links,
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
            </CardContent>
          </Card>

          {/* Add New Files */}
          <Card>
            <CardHeader>
              <CardTitle>Add New Media</CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                <Label htmlFor="newFiles">Upload Images/Videos</Label>
                <Input
                  id="newFiles"
                  type="file"
                  multiple
                  accept="image/*,video/*"
                  onChange={handleFileChange}
                  className="cursor-pointer"
                />
                {newMediaPreviews.length > 0 && (
                  <p className="text-sm text-gray-600 mt-1">
                    {newMediaPreviews.length} file(s) ready to upload
                  </p>
                )}

                {/* New Media Previews */}
                {newMediaPreviews.length > 0 && (
                  <div className="mt-4 space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="font-medium text-gray-900">Preview New Media</h4>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          // Clean up all preview URLs
                          newMediaPreviews.forEach(item => {
                            URL.revokeObjectURL(item.preview)
                          })
                          setNewMediaPreviews([])
                          setNewFiles([])
                        }}
                      >
                        Clear All
                      </Button>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      {newMediaPreviews.map((item, index) => (
                        <Card key={index} className="relative">
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            className="absolute top-2 right-2 z-10"
                            onClick={() => removeNewMedia(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                          
                          {item.type === 'video' ? (
                            <video
                              src={item.preview}
                              className="w-full h-32 object-cover rounded-t cursor-pointer hover:opacity-80 transition-opacity"
                              onClick={() => setImagePreview({ url: item.preview, alt: `New Video ${index + 1}`, type: 'video' })}
                              controls={false}
                              muted
                            />
                          ) : (
                            <img
                              src={item.preview}
                              alt={`Preview ${index + 1}`}
                              className="w-full h-32 object-cover rounded-t cursor-pointer hover:opacity-80 transition-opacity"
                              onClick={() => setImagePreview({ url: item.preview, alt: `New Image ${index + 1}`, type: 'image' })}
                            />
                          )}
                          
                          <CardContent className="p-3">
                            <Label htmlFor={`new-caption-${index}`} className="text-sm">
                              Add a caption (optional)
                            </Label>
                            <Input
                              id={`new-caption-${index}`}
                              value={item.caption}
                              onChange={(e) => updateNewMediaCaption(index, e.target.value)}
                              placeholder={`Tell us about this ${item.type}...`}
                              className="mt-1"
                            />
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Media Section */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Current Media ({formData.images.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {formData.images.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No media files</p>
              ) : (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {formData.images.map((image, index) => {
                    const imageUrl = getImageUrl(image.url)
                    const isVideo = getMediaType(image.url) === 'video'

                    return (
                      <div key={index} className="border rounded-lg p-4 space-y-2">
                        <div className="flex justify-between items-start">
                          <div className="flex gap-3">
                            {isVideo ? (
                              <video
                                src={imageUrl}
                                className="w-16 h-16 object-cover rounded cursor-pointer hover:opacity-80 transition-opacity"
                                onClick={() => setImagePreview({ url: imageUrl, alt: image.alt || `Video ${index + 1}`, type: 'video' })}
                                muted
                              />
                            ) : (
                              <img
                                src={imageUrl}
                                alt={image.alt}
                                className="w-16 h-16 object-cover rounded cursor-pointer hover:opacity-80 transition-opacity"
                                onClick={() => setImagePreview({ url: imageUrl, alt: image.alt || `Image ${index + 1}`, type: 'image' })}
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none'
                                }}
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">
                                {image.alt || `${isVideo ? 'Video' : 'Image'} ${index + 1}`}
                              </p>
                              <p className="text-xs text-gray-500">
                                {isVideo ? 'Video' : 'Image'}
                              </p>
                            </div>
                          </div>
                          <Button
                            onClick={() => removeImage(index)}
                            size="sm"
                            variant="destructive"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                        <div>
                          <Label htmlFor={`caption-${index}`} className="text-xs">
                            Caption
                          </Label>
                          <Input
                            id={`caption-${index}`}
                            value={image.caption}
                            onChange={(e) => updateImageCaption(index, e.target.value)}
                            placeholder="Add a caption..."
                            className="text-sm"
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      {!isSubmission && onDelete && buildData && (
            <Button className='justify-center' onClick={() => setShowDeleteConfirm(true)} variant="destructive">
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Build
            </Button>
          )}
      </div>

      {isSubmission && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-2 justify-end">
              <Button onClick={onReject} variant="destructive">
                Reject Submission
              </Button>
              <Button onClick={onApprove} className="bg-green-600 hover:bg-green-700">
                Approve & Publish
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Build</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-gray-600">
              Are you sure you want to delete <strong>"{buildData?.buildName}"</strong>?
            </p>
            <p className="text-sm text-red-600 mt-2">
              This action cannot be undone. The build and all its images will be permanently removed.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => {
                setShowDeleteConfirm(false)
                if (onDelete) onDelete()
              }}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Permanently
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image Preview Dialog */}
      <Dialog open={!!imagePreview} onOpenChange={() => setImagePreview(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>{imagePreview?.alt}</DialogTitle>
          </DialogHeader>
          {imagePreview && (
            <div className="flex justify-center">
              {imagePreview.type === 'video' ? (
                <video
                  src={imagePreview.url}
                  controls
                  autoPlay
                  className="max-w-full max-h-[70vh] object-contain rounded"
                />
              ) : (
                <img
                  src={imagePreview.url}
                  alt={imagePreview.alt}
                  className="max-w-full max-h-[70vh] object-contain rounded"
                />
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default EditBuild
