import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import SubmissionReview from './SubmissionReview'
import PhotoUpload from './PhotoUpload'
import BuildManagement from './BuildManagement'
import EditInteresting from './EditInteresting'
import { getToken, setToken, logout } from '@/lib/auth'
import { API_BASE_URL } from '@/config/api'

// Secure admin authentication
function AdminLogin({ onLogin }: { onLogin: () => void }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    if (!password.trim()) {
      setError('Password is required')
      return
    }
    
    setLoading(true)
    setError('')
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        // Handle specific "admin already logged in" error
        if (response.status === 423 && data.code === 'ADMIN_ALREADY_ACTIVE') {
          throw new Error('⚠️ Admin already logged in! Please wait for the current session to expire (24 hours) or ask them to logout.')
        }
        throw new Error(data.error || 'Login failed')
      }
      
      // Store the JWT token
      setToken(data.token)
      onLogin()
      
    } catch (error) {
      console.error('Login error:', error)
      setError(error instanceof Error ? error.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary-foreground/10 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Admin Login</CardTitle>
          <CardDescription>Enter your password to access the admin panel</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !loading && handleLogin()}
              disabled={loading}
            />
            {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
          </div>
          <Button 
            onClick={handleLogin} 
            className="w-full" 
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

function AdminDashboard() {
  const handleLogout = async () => {
    await logout()
    window.location.reload()
  }

  return (
    <div className="mx-auto max-w-6xl p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <Button 
          onClick={handleLogout} 
          variant="outline"
          className="ml-auto"
        >
          Logout
        </Button>
      </div>
      
      <Tabs defaultValue="submissions" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="submissions">Submissions</TabsTrigger>
          <TabsTrigger value="photos">Photos</TabsTrigger>
          <TabsTrigger value="builds">Builds</TabsTrigger>
          <TabsTrigger value="for-sale">For Sale</TabsTrigger>
          <TabsTrigger value="interesting">Interesting</TabsTrigger>
        </TabsList>
        
        <TabsContent value="submissions" className="mt-6">
          <SubmissionReview />
        </TabsContent>
        
        <TabsContent value="photos" className="mt-6">
          <PhotoUpload />
        </TabsContent>
        
        <TabsContent value="builds" className="mt-6">
          <BuildManagement filterType="build" />
        </TabsContent>
        
        <TabsContent value="for-sale" className="mt-6">
          <BuildManagement filterType="for-sale-item" />
        </TabsContent>
        
        <TabsContent value="interesting" className="mt-6">
          <EditInteresting />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)

  // Check authentication status on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = getToken()
      
      if (!token) {
        setLoading(false)
        return
      }
      
      try {
        const response = await fetch(`${API_BASE_URL}/api/auth/verify`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        })
        
        if (response.ok) {
          setIsAuthenticated(true)
        } else {
          // Token invalid, remove it
          await logout()
        }
      } catch (error) {
        console.error('Auth check failed:', error)
        await logout()
      }
      
      setLoading(false)
    }
    
    checkAuth()
  }, [])

  const handleLogin = () => {
    setIsAuthenticated(true)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Checking authentication...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <AdminLogin onLogin={handleLogin} />
  }

  return <AdminDashboard />
}

export default AdminPage
