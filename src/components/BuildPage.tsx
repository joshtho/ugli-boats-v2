import data from '@/assets/data'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Link } from 'react-router-dom'

function BuildPage() {
  return (
    <div className="mx-auto max-w-2xl p-4">
      <h1 className="text-2xl font-bold mb-6">Builds</h1>
      <div className="grid gap-6 sm:grid-cols-2">
        {data.builds.map((build, idx) => {
          const firstImage = build.images[0]
          return (
            <Link
              key={idx}
              to={`/boats/${encodeURIComponent(build.name)}`}
              className="hover:scale-[1.03] transition-transform"
            >
              <Card className="flex flex-col items-center cursor-pointer">
                {firstImage && (
                  <img
                    src={firstImage.url}
                    alt={firstImage.alt}
                    className="w-40 h-32 object-cover rounded mb-2"
                  />
                )}
                <CardHeader>
                  <CardTitle className="text-center">{build.name}</CardTitle>
                </CardHeader>
                <CardContent />
              </Card>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

export default BuildPage