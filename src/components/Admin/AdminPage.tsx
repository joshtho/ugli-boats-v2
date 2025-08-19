import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import SubmissionReview from './SubmissionReview'
import PhotoUpload from './PhotoUpload'
import BuildManagement from './BuildManagement'
import ContentManagement from './ContentManagement'

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
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    // Check sessionStorage for existing authentication
    return sessionStorage.getItem('adminAuthenticated') === 'true'
  })

  const handleLogin = () => {
    setIsAuthenticated(true)
    sessionStorage.setItem('adminAuthenticated', 'true')
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
    sessionStorage.removeItem('adminAuthenticated')
  }

  if (!isAuthenticated) {
    return <AdminLogin onLogin={handleLogin} />
  }

  return (
    <div>
      <div className="flex justify-between items-center p-4 border-b">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <Button onClick={handleLogout} variant="outline">
          Logout
        </Button>
      </div>
      <AdminDashboard />
    </div>
  )
}

export default AdminPage
