import { useState, useEffect } from 'react'
import { authenticatedFetch } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Eye, Clock, ArrowLeft } from 'lucide-react'
import { useBuilds } from '@/contexts/BuildsContext'
import EditBuild from './EditBuild'

function SubmissionReview() {
  const [submissions, setSubmissions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)
  const [previewingSubmission, setPreviewingSubmission] = useState<any | null>(null)
  const [imagePreview, setImagePreview] = useState<{ url: string, alt: string } | null>(null)
  
  // Get refetch function from builds context
  const { refetchBuilds } = useBuilds()

  const fetchSubmissions = async () => {
    try {
      const response = await authenticatedFetch('submissions')
      if (response.ok) {
        const data = await response.json()
        setSubmissions(data)
      }
    } catch (error) {
      console.error('Error fetching submissions:', error)
    } finally {
      setLoading(false)
      console.log(submissions)
    }
  }

  useEffect(() => {
    fetchSubmissions()
  }, [])

  const handleApprove = async (submissionId: string) => {
    setProcessing(submissionId)
    try {
      const response = await authenticatedFetch(`submissions/${submissionId}/approve`, {
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
      setPreviewingSubmission(null) // Close preview
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
      const response = await authenticatedFetch(`submissions/${submissionId}/reject`, {
        method: 'POST'
      })
      
      if (response.ok) {
        alert('Submission rejected')
        setPreviewingSubmission(null) // Close preview
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

  const handlePreviewSubmission = (submission: any) => {
    // Transform submission data to EditBuild format
    const buildData = {
      id: submission.id,
      type: submission.type || 'build',
      name: submission.name,
      buildName: submission.type === 'for-sale-item' ? (submission.itemTitle || submission.buildName) : submission.buildName,
      header: submission.header, 
      introText: submission.introText,
      email: submission.email,
      contactInfo: submission.contactInfo || null,
      itemCategory: submission.itemCategory || null,
      itemTitle: submission.itemTitle || null,
      forSale: submission.forSale || {
        onMarket: false,
        price: 0,
        links: {
          craigslistUrl: '',
          facebookUrl: '',
          otherUrl: ''
        }
      },
      images: submission.images || [],
      status: 'pending',
      createdDate: submission.createdDate
    }
    
    setPreviewingSubmission(buildData)
  }

  const handleSaveSubmission = async (updatedData: any) => {
    setProcessing(previewingSubmission.id)
    try {
      console.log('Saving submission data:', updatedData)
      
      const response = await authenticatedFetch(`submissions/${previewingSubmission.id}`, {
        method: 'PUT',
        body: JSON.stringify(updatedData)
      })
      
      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorMessage
        } catch (parseError) {
          // If we can't parse JSON, try to read as text
          try {
            const errorText = await response.text()
            errorMessage = errorText || errorMessage
          } catch (textError) {
            // If we can't read text either, use the default message
            console.error('Could not read error response:', textError)
          }
        }
        throw new Error(errorMessage)
      }

      const result = await response.json()
      console.log('Save successful:', result)

      // Refresh submissions list
      await fetchSubmissions()
      
      // Update the previewing submission with new data
      setPreviewingSubmission(updatedData)
      
      alert('Submission updated successfully!')
    } catch (error) {
      console.error('Error updating submission:', error)
      alert('Failed to update submission: ' + (error as Error).message)
    } finally {
      setProcessing(null)
    }
  }

  const handleCancelEdit = () => {
    setPreviewingSubmission(null)
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

  // Show preview if a submission is selected
  if (previewingSubmission) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <Button 
            onClick={() => setPreviewingSubmission(null)}
            variant="outline"
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Submissions
          </Button>
          <h2 className="text-xl font-semibold">Review Submission</h2>
        </div>
        
        <EditBuild
          buildData={previewingSubmission}
          isSubmission={true}
          onSave={handleSaveSubmission}
          onCancel={handleCancelEdit}
          onApprove={() => handleApprove(previewingSubmission.id)}
          onReject={() => handleReject(previewingSubmission.id)}
        />
      </div>
    )
  }

  return (
    <div>
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
                  {/* Header */}
                  <div className="mb-6">
                    <div className="flex items-center gap-2 mb-2 justify-center">
                      <Badge variant={submission.type === 'for-sale-item' ? 'secondary' : 'default'}>
                        {submission.type === 'for-sale-item' ? '🏷️ For Sale Item' : '🚤 Build'}
                      </Badge>
                      {submission.itemCategory && (
                        <Badge variant="outline">{submission.itemCategory}</Badge>
                      )}
                    </div>
                    <h1 className="text-2xl font-bold mb-2 text-center">
                      {submission.type === 'for-sale-item' 
                        ? (submission.itemTitle || submission.buildName)
                        : `${submission.name} - ${submission.buildName}`
                      }
                    </h1>
                    <div className="flex items-center mb-4">
                      <div className="text-sm text-gray-600">
                        <p><strong>Email:</strong> {submission.email}</p>
                        {submission.name && <p><strong>Name:</strong> {submission.name}</p>}
                        <p><strong>Submitted:</strong> {new Date(submission.createdDate).toLocaleDateString()}</p>
                        {submission.header && <p><strong>Header:</strong> {submission.header}</p>}
                        {submission.contactInfo?.phone && <p><strong>Phone:</strong> {submission.contactInfo.phone}</p>}
                        {submission.contactInfo?.address && <p><strong>Location:</strong> {submission.contactInfo.address}</p>}
                        {submission.contactInfo?.displayPreferences && (
                          <p className="text-xs text-gray-400 mt-1">
                            <strong>Public display:</strong>{' '}
                            {[
                              submission.contactInfo.displayPreferences.showName && 'Name',
                              submission.contactInfo.displayPreferences.showEmail && 'Email',
                              submission.contactInfo.displayPreferences.showPhone && 'Phone',
                              submission.contactInfo.displayPreferences.showAddress && 'Location',
                            ].filter(Boolean).join(', ') || 'Nothing'}
                          </p>
                        )}
                        {submission.forSale?.onMarket && (
                          <p><strong>Price:</strong> ${submission.forSale.price}</p>
                        )}
                      </div>
                    </div>
                      <Badge className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Pending Review
                      </Badge>
                  </div>

                  {/* Main content */}
                  <div className="gap-8 mb-6">
                    <h3 className="font-semibold mb-4">Photos - {submission.images?.length || 0}</h3>

                    <div className='flex justify-start'>
                      {submission.introText && (
                        <div>
                          <h3 className="font-semibold mb-4">Description</h3>
                          <div className="text-base text-gray-700 bg-white/80 rounded p-4 shadow border">
                          {submission.header && <h2 className='font-bold'>{submission.header}</h2>}
                            <p>{submission.introText.slice(0,200)}.....</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Action buttons at bottom */}
                  <div className="flex gap-3 pt-4 border-t">
                    <Button 
                      onClick={() => handlePreviewSubmission(submission)}
                      disabled={processing === submission.id}
                      className="flex items-center gap-2 flex-1"
                      size="lg"
                    >
                      <Eye className="h-4 w-4" />
                      Preview to Approve Build
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </CardContent>
      </Card>

      {/* Image Preview Dialog */}
      <Dialog open={!!imagePreview} onOpenChange={() => setImagePreview(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{imagePreview?.alt}</DialogTitle>
          </DialogHeader>
          {imagePreview && (
            <div className="flex justify-center">
              <img
                src={imagePreview.url}
                alt={imagePreview.alt}
                className="max-w-full max-h-[80vh] object-contain"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default SubmissionReview
