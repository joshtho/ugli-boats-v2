import { useState } from 'react'
import { authenticatedFetch } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, Settings, Eye, ArrowLeft, Edit } from 'lucide-react'
import { useBuilds } from '@/contexts/BuildsContext'
import EditBuild from './EditBuild'

function BuildManagement() {
  const [newBuild, setNewBuild] = useState({
    name: '',
    introText: '',
    forSale: {
      onMarket: false,
      price: 0,
      links: {
        craigslistUrl: '',
        facebookUrl: '',
        otherUrl: ''
      }
    },
    images: [] as string[]
  })
  const [editingBuild, setEditingBuild] = useState<any | null>(null)
  const [addingBuild, setAddingBuild] = useState(false)
  
  // Get builds and refetch function from builds context
  const { backendBuilds, refetchBuilds } = useBuilds()

  // Helper to get proper image URL - same as BuildPage
  const getImageUrl = (url: string): string => {
    if (url.startsWith('http')) {
      return url
    }
    // For local development, use backend server
    if (url.startsWith('/uploads/') || url.includes('/uploads/')) {
      return `${import.meta.env.DEV ? 'http://localhost:3001' : ''}${url}`
    }
    return url.startsWith('/') ? url : `/${url}`
  }

  // @ts-ignore
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _handleAddBuild = async () => {
    if (!newBuild.name) {
      alert('Build name is required')
      return
    }

    try {
      // Create FormData for build submission
      const formData = new FormData()
      formData.append('name', newBuild.name)
      formData.append('introText', newBuild.introText)
      
      // Add images if any were selected
      const fileInput = document.getElementById('buildImages') as HTMLInputElement
      if (fileInput && fileInput.files) {
        Array.from(fileInput.files).forEach(file => {
          formData.append('images', file)
        })
      }
      
      // Send to backend API
      const response = await authenticatedFetch('builds', {
        method: 'POST',
        body: formData
      })
      
      if (!response.ok) {
        throw new Error(`Failed to add build: ${response.statusText}`)
      }
      
      await response.json()
      
      alert('Build added successfully!')
      setNewBuild({ 
        name: '', 
        introText: '', 
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
      refetchBuilds() // Refresh the builds cache globally!
      
      // Reset the file input
      if (fileInput) fileInput.value = ''
      
    } catch (error) {
      console.error('Build creation error:', error)
      alert('Failed to add build: ' + (error as Error).message)
    } finally {
      // Build creation complete
    }
  }

  // @ts-ignore
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleDeleteBuild = async (buildId: string, buildName: string) => {
    console.log('Attempting to delete build:', { buildId, buildName })
    
    if (!confirm(`Are you sure you want to delete "${buildName}"? This action cannot be undone.`)) {
      return
    }

    try {
      console.log('Making DELETE request to:', `/api/builds/${buildId}`)
      const response = await authenticatedFetch(`builds/${buildId}`, {
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
      // Delete operation complete
    }
  }

  const handleEditBuild = (build: any) => {
    // Transform build data to EditBuild format
    const buildData = {
      id: build.id,
      name: build.name,
      buildName: build.buildName || build.name,
      header: build.header,
      introText: build.introText,
      email: build.email || '',
      forSale: build.forSale || {
        onMarket: false,
        price: 0,
        links: {
          craigslistUrl: '',
          facebookUrl: '',
          otherUrl: ''
        }
      },
      images: build.images || [],
      status: 'published',
      createdDate: build.createdDate
    }
    
    setEditingBuild(buildData)
  }

  const handleSaveBuild = async (updatedData: any) => {
    try {
      const response = await authenticatedFetch(`builds/${editingBuild.id}`, {
        method: 'PUT',
        body: JSON.stringify(updatedData)
      })
      
      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorMessage
        } catch {
          const errorText = await response.text()
          errorMessage = errorText || errorMessage
        }
        throw new Error(errorMessage)
      }

      await response.json()
      alert('Build updated successfully!')
      refetchBuilds()
      setEditingBuild(null)
      
    } catch (error) {
      console.error('Error updating build:', error)
      alert('Failed to update build: ' + (error as Error).message)
    }
  }

  const handleAddNewBuild = () => {
    const emptyBuildData = {
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
      images: [],
      status: 'draft'
    }
    
    setEditingBuild(emptyBuildData)
    setAddingBuild(true)
  }

  const handleSaveNewBuild = async (buildData: any) => {
    try {
      const response = await authenticatedFetch('builds', {
        method: 'POST',
        body: JSON.stringify(buildData)
      })
      
      if (!response.ok) {
        throw new Error(`Failed to create build: ${response.statusText}`)
      }
      
      await response.json()
      alert('Build created successfully!')
      refetchBuilds()
      setEditingBuild(null)
      setAddingBuild(false)
      
    } catch (error) {
      console.error('Error creating build:', error)
      alert('Failed to create build: ' + (error as Error).message)
    }
  }

  const handleDeleteCurrentBuild = () => {
    if (editingBuild && editingBuild.id) {
      handleDeleteBuild(editingBuild.id, editingBuild.buildName)
      // After deletion, go back to main list
      setEditingBuild(null)
      setAddingBuild(false)
    }
  }

  const handleCancelEdit = () => {
    setEditingBuild(null)
    setAddingBuild(false)
  }

  // Show edit mode if a build is being edited
  if (editingBuild) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <Button 
            onClick={handleCancelEdit}
            variant="outline"
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Builds
          </Button>
          <h2 className="text-xl font-semibold">
            {addingBuild ? 'Add New Build' : 'Edit Build'}
          </h2>
        </div>
        
        <EditBuild
          buildData={editingBuild}
          isSubmission={false}
          onSave={addingBuild ? handleSaveNewBuild : handleSaveBuild}
          onCancel={handleCancelEdit}
          onDelete={!addingBuild ? handleDeleteCurrentBuild : undefined}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Add Build Button */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Build Management</h2>
        <Button onClick={handleAddNewBuild} className="flex items-center gap-2">
          <Plus className="h-5 w-5" />
          Add Build
        </Button>
      </div>
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
                    <strong>Media Preview:</strong>
                    <div className="flex gap-2 mt-2">
                      {build.images.slice(0, 3).map((image, index) => {
                        const imageUrl = getImageUrl(image.url)
                        const isVideo = imageUrl.toLowerCase().endsWith('.mov') || 
                                      imageUrl.toLowerCase().endsWith('.mp4') || 
                                      imageUrl.toLowerCase().includes('youtube') ||
                                      imageUrl.toLowerCase().includes('youtu.be')
                        
                        return isVideo ? (
                          <video 
                            key={index}
                            src={imageUrl}
                            className="w-16 h-16 object-cover rounded border"
                            muted
                            onError={(e) => {
                              console.log('Video failed to load:', imageUrl)
                              e.currentTarget.style.display = 'none'
                            }}
                          />
                        ) : (
                          <img 
                            key={index}
                            src={imageUrl}
                            alt={image.alt || `Image ${index + 1}`}
                            className="w-16 h-16 object-cover rounded border"
                            onError={(e) => {
                              console.log('Image failed to load:', imageUrl)
                              e.currentTarget.style.display = 'none'
                            }}
                          />
                        )
                      })}
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
                    onClick={() => handleEditBuild(build)}
                    variant="outline"
                    className="flex items-center gap-2"
                    size="sm"
                  >
                    <Edit className="h-4 w-4" />
                    Preview and Edit
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

export default BuildManagement
