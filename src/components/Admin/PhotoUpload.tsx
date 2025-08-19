import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Upload } from 'lucide-react'

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

export default PhotoUpload
