
function InterestingPage() {
  return (
    <div className="bg-muted/50 min-h-[100vh] flex-1 rounded-xl md:min-h-min text-start">
      <div className="max-w-4xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold mb-4">UgliBoat sightings and interesting miscellaneous material</h1>
        <p>Removable UgliBoat Engine Bracket</p>
        <img 
        src="/ugli-boats-v2/IMAGES/Removable Engine Bracket.jpg" 
        alt="Removable UgliBoat Engine Bracket" className="object-contain mb-5" />
        <p>An UgliBoat pushing a raft across a river in pursuit of the African Tiger Fish.</p>
        <img 
        src="/ugli-boats-v2/IMAGES/UgliBoat inAfrica.jpg" 
        alt="UgliBoat in Africa" className="object-contain mb-5" />
        <div className="aspect-video max-w-3xl">
            You can watch the trailer below:
        <iframe  
            title="vimeo-player" 
            src="https://player.vimeo.com/video/248079536?h=c5518f6096" 
            className="w-full h-full mb-5"
            referrerPolicy="strict-origin-when-cross-origin" 
            allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media; web-share"   
            allowFullScreen
        />
        TV Show Life Below Zero: 
        <img src="/ugli-boats-v2/IMAGES/life below zero sink or swim.jpg" alt="Life Below Zero: Sink or Swim" className="object-contain mb-5" />

        </div>
      </div>
    </div>
  )
}

export default InterestingPage