import React, { createContext, useContext, useState, useEffect } from 'react'
import type { ReactNode } from 'react'
import { getApiUrl } from '@/config/api'

// Backend build interface - matches the unified structure from seed.ts
interface BackendBuild {
  id: string
  name: string
  buildName: string
  header: string
  introText: string
  forSale?: {
    onMarket: boolean
    price: number
    links: {
      craigslistUrl: string
      facebookUrl: string
      otherUrl: string
    }
  }
  images: {
    alt: string
    caption: string
    url: string
  }[]
  createdDate: string
  isLegacy?: boolean
}

interface BuildsContextType {
  backendBuilds: BackendBuild[]
  loading: boolean
  error: string | null
  refetchBuilds: () => Promise<void>
}

const BuildsContext = createContext<BuildsContextType | undefined>(undefined)

export const useBuilds = () => {
  const context = useContext(BuildsContext)
  if (context === undefined) {
    throw new Error('useBuilds must be used within a BuildsProvider')
  }
  return context
}

interface BuildsProviderProps {
  children: ReactNode
}

export const BuildsProvider: React.FC<BuildsProviderProps> = ({ children }) => {
  const [backendBuilds, setBackendBuilds] = useState<BackendBuild[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchBuilds = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const url = getApiUrl('builds')
      console.log('Fetching builds from:', url)
      const response = await fetch(url)
      console.log('Response status:', response.status)
      
      if (response.ok) {
        const builds = await response.json()
        console.log('Fetched builds:', builds.length, 'builds')
        setBackendBuilds(builds)
      } else {
        const errorText = await response.text()
        console.error('Failed to fetch builds:', response.status, errorText)
        setError(`Failed to fetch builds: ${response.status}`)
      }
    } catch (err) {
      console.error('Error fetching builds:', err)
      setError(`Error fetching builds: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  // Fetch builds on mount (only once!)
  useEffect(() => {
    fetchBuilds()
  }, [])

  const refetchBuilds = async () => {
    await fetchBuilds()
  }

  const value: BuildsContextType = {
    backendBuilds,
    loading,
    error,
    refetchBuilds
  }

  return (
    <BuildsContext.Provider value={value}>
      {children}
    </BuildsContext.Provider>
  )
}
