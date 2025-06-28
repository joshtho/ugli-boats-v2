import { useParams } from 'react-router-dom'
import data from '@/assets/data'
import { useEffect, useState } from 'react'
import { Dialog, DialogContent } from '@/components/ui/dialog'

function BoatPage() {
  const { name } = useParams()
  const [build, setBuild] = useState<typeof data.builds[0] | null>(null)
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [selectedImg, setSelectedImg] = useState<{ url: string; alt: string } | null>(null)

  useEffect(() => {
    setLoading(true)
    // Simulate async data fetching (replace with real fetch if needed)
    const found = data.builds.find(b => b.name === name)
    setBuild(found || null)
    setLoading(false)
  }, [name])

  if (loading) return <div>Loading...</div>
  if (!build) return <div>Boat not found</div>

  return (
    <div className="mx-auto max-w-4xl p-6">
      <h1 className="text-3xl font-bold mb-10 text-center">{build.name}</h1>
      <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-3">
        {build.images.map((img, idx) => (
          img.url.includes(".mp4") ?
          <video src={img.url} muted autoPlay preload='metadata'/>
          :
          <img
            key={idx}
            src={img.url}
            alt={img.alt}
            className="w-full h-40 object-cover rounded cursor-pointer transition-transform hover:scale-105"
            onClick={() => {
              setSelectedImg(img)
              setOpen(true)
            }}
          />
        ))}
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className="
            flex flex-col items-center
            w-full
            max-w-full
            sm:max-w-2xl
            md:max-w-3xl
            lg:max-w-5xl
            xl:max-w-6xl
            p-4
            pt-10
          "
        >
          {selectedImg && (
            <img
              src={selectedImg.url}
              alt={selectedImg.alt}
              className="
                w-full
                max-w-full
                max-h-[80vh]
                object-contain
                rounded
                transition-all
              "
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default BoatPage