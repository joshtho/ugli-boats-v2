import { useParams } from 'react-router-dom'
import data from '@/assets/data'
import { useEffect, useState } from 'react'

function BoatPage() {
  const { name } = useParams()
  const [build, setBuild] = useState<typeof data.builds[0] | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    console.log("URL param name:", name)
    console.log("Build names:", data.builds.map(b => b.name))
    // Simulate async data fetching (replace with real fetch if needed)
    const found = data.builds.find(b => b.name === name)
    setBuild(found || null)
    setLoading(false)
  }, [])

  if (loading) return <div>Loading...</div>
  if (!build) return <div>Boat not found</div>

  return (
    <div className="mx-auto max-w-2xl p-4 lg:max-w-3xl">
      <h1 className="text-2xl font-bold mb-6">{build.name}</h1>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {build.images.map((img, idx) => (
          <img
            key={idx}
            src={img.url}
            alt={img.alt}
            className="w-full h-48 object-cover rounded"
          />
        ))}
      </div>
    </div>
  )
}

export default BoatPage