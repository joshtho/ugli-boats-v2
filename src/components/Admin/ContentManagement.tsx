import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Settings, Save } from 'lucide-react'

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

export default ContentManagement
