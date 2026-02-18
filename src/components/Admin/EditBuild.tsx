import { useState, useEffect } from 'react'
import { authenticatedFetch } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
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
  type?: 'build' | 'for-sale-item'
  contactInfo?: {
    phone?: string
    address?: string
    displayPreferences?: {
      showName: boolean
      showEmail: boolean
      showPhone: boolean
      showAddress: boolean
    }
  }
  itemCategory?: string
  itemTitle?: string
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
    type: 'build',
    contactInfo: {
      phone: '',
      address: '',
      displayPreferences: {
        showName: true,
        showEmail: true,
        showPhone: false,
        showAddress: false
      }
    },
    itemCategory: '',
    itemTitle: '',
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
  const [youtubeVideos, setYoutubeVideos] = useState<Array<{ url: string; caption: string }>>([])
  const [youtubeUrl, setYoutubeUrl] = useState('')
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
        type: buildData.type || 'build',
        contactInfo: buildData.contactInfo || {
          phone: '',
          address: '',
          displayPreferences: {
            showName: true,
            showEmail: true,
            showPhone: false,
            showAddress: false
          }
        },
        itemCategory: buildData.itemCategory || '',
        itemTitle: buildData.itemTitle || '',
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

    const response = await authenticatedFetch('admin/upload', {
      method: 'POST',
      body: formData
    })

    if (!response.ok) {
      throw new Error('File upload failed')
    }

    const data = await response.json()
    return data.images // Should return array of {alt, url} objects
  }

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

  const handleSave = async () => {
    setSaving(true)
    try {
      // Upload new files if any
      const uploadedImages = await uploadNewFiles()
      
      // Create YouTube video objects
      const youtubeImages = youtubeVideos.map(video => ({
        alt: `YouTube Video: ${video.url}`,
        caption: video.caption,
        url: video.url
      }))
      
      // Combine existing, uploaded, and YouTube images
      const updatedBuild = {
        ...formData,
        images: [...formData.images, ...uploadedImages, ...youtubeImages]
      }

      if (onSave) {
        await onSave(updatedBuild)
      }

      setNewFiles([]) // Clear new files after save
      setYoutubeVideos([]) // Clear YouTube videos after save
      setYoutubeUrl('') // Clear YouTube URL input
      
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
    if (url.startsWith('/ugli-boats-v2') || url.startsWith('/uploads')) {
      return `${import.meta.env.DEV ? 'http://localhost:3001' : ''}${url}`
    }
    return `/uploads/${url}`
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
              <CardTitle className="flex items-center gap-2">
                {formData.type === 'for-sale-item' ? '🏷️ Item Information' : '🚤 Build Information'}
                <Badge variant={formData.type === 'for-sale-item' ? 'secondary' : 'default'}>
                  {formData.type === 'for-sale-item' ? 'For Sale Item' : 'Build'}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Submission Type */}
              <div>
                <Label htmlFor="type">Submission Type</Label>
                <select
                  id="type"
                  value={formData.type || 'build'}
                  onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as 'build' | 'for-sale-item' }))}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="build">Build</option>
                  <option value="for-sale-item">For Sale Item</option>
                </select>
              </div>

              <div>
                <Label htmlFor="name">{formData.type === 'for-sale-item' ? 'Seller Name' : 'Builder Name'}</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder={formData.type === 'for-sale-item' ? 'Enter seller name' : 'Enter builder name'}
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

              {/* For-sale-item specific fields */}
              {formData.type === 'for-sale-item' && (
                <>
                  <div>
                    <Label htmlFor="itemTitle">Item Title</Label>
                    <Input
                      id="itemTitle"
                      name="itemTitle"
                      value={formData.itemTitle || ''}
                      onChange={handleInputChange}
                      placeholder="What are you selling?"
                    />
                  </div>
                  <div>
                    <Label htmlFor="itemCategory">Category</Label>
                    <select
                      id="itemCategory"
                      value={formData.itemCategory || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, itemCategory: e.target.value }))}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="">Select a category</option>
                      <option value="parts">Parts</option>
                      <option value="accessories">Accessories</option>
                      <option value="materials">Materials</option>
                      <option value="tools">Tools</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </>
              )}

              {formData.type !== 'for-sale-item' && (
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
              )}

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

              {/* Contact Info Section */}
              <div className="space-y-4 border-t pt-4">
                <h3 className="text-lg font-semibold">Contact Information</h3>
                
                <div>
                  <Label htmlFor="phone">Phone (optional)</Label>
                  <Input
                    id="phone"
                    value={formData.contactInfo?.phone || ''}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      contactInfo: {
                        ...prev.contactInfo,
                        phone: e.target.value,
                        displayPreferences: prev.contactInfo?.displayPreferences || {
                          showName: true, showEmail: true, showPhone: false, showAddress: false
                        }
                      }
                    }))}
                    placeholder="Phone number"
                  />
                </div>

                <div>
                  <Label htmlFor="address">Location (optional)</Label>
                  <Input
                    id="address"
                    value={formData.contactInfo?.address || ''}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      contactInfo: {
                        ...prev.contactInfo,
                        address: e.target.value,
                        displayPreferences: prev.contactInfo?.displayPreferences || {
                          showName: true, showEmail: true, showPhone: false, showAddress: false
                        }
                      }
                    }))}
                    placeholder="City, State or full address"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Public Display Preferences</Label>
                  <p className="text-xs text-gray-500">Control what contact info visitors can see</p>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { key: 'showName', label: 'Name' },
                      { key: 'showEmail', label: 'Email' },
                      { key: 'showPhone', label: 'Phone' },
                      { key: 'showAddress', label: 'Location' },
                    ].map(({ key, label }) => (
                      <div key={key} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`display-${key}`}
                          checked={formData.contactInfo?.displayPreferences?.[key as keyof typeof formData.contactInfo.displayPreferences] ?? (key === 'showName' || key === 'showEmail')}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            contactInfo: {
                              ...prev.contactInfo,
                              displayPreferences: {
                                showName: true,
                                showEmail: true,
                                showPhone: false,
                                showAddress: false,
                                ...prev.contactInfo?.displayPreferences,
                                [key]: e.target.checked
                              }
                            }
                          }))}
                        />
                        <Label htmlFor={`display-${key}`} className="text-sm">{label}</Label>
                      </div>
                    ))}
                  </div>
                </div>
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

                {/* YouTube Video Section */}
                <div className="mt-6">
                  <Label htmlFor="youtubeUrl">Add YouTube Video</Label>
                  <div className="flex gap-2 mt-2">
                    <Input
                      id="youtubeUrl"
                      type="url"
                      value={youtubeUrl}
                      onChange={(e) => setYoutubeUrl(e.target.value)}
                      placeholder="https://youtu.be/videoId or https://youtube.com/watch?v=videoId"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          addYoutubeVideo()
                        }
                      }}
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
                    Add YouTube videos of your build. Supports both youtu.be and youtube.com formats.
                  </p>
                </div>

                {/* YouTube Videos Preview */}
                {youtubeVideos.length > 0 && (
                  <div className="mt-6 space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="font-medium text-gray-900">YouTube Videos to Add</h4>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setYoutubeVideos([])}
                      >
                        Clear All
                      </Button>
                    </div>
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
                    const isYoutube = image.url.includes('youtube') || image.url.includes('youtu.be') ? true : false

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
                                {isYoutube ? 'YouTube: ' : ""}
                                {`${isVideo ? 'Video' : 'Image'} ${index + 1}`}
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
