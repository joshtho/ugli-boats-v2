
import { useState } from "react"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "./ui/carousel"

function HistoryPage() {
  const dialogImages = [
  {
    img: "/IMAGES/Mil-eng-898pdf.png",
    alt: "Military Engineer Interior",
    description: "Page 907 of the Military Engineer showing a footbridge across the Marne built by the Yankee Division.",
  },
  {
    img: "public/IMAGES/mil-eng-908.png",
    alt: "Military Engineer Interior",
    description: "Page 908 of the Military Engineer.",
  },
  {
    img: "/IMAGES/mil-eng-909.png",
    alt: "Military Engineer Interior",
    description: "Page 909 of the Military Engineer",
  },
  {
    img: "/IMAGES/mil-eng-910.png",
    alt: "Military Engineer Interior",
    description: "Page 910 of the Military Engineer",
  },
  {
    img: "/IMAGES/mil-eng-1024.png",
    alt: "Military Engineer Interior",
    description: "Page 1024 of the Military Engineer ",
  },
  {
    img: "/IMAGES/mil-eng-1025.png",
    alt: "Military Engineer Interior",
    description: "Page 1025 of the Military Engineer ",
  },
  {
    img: "/IMAGES/mil-eng-1026.png",
    alt: "Military Engineer Interior",
    description: "Page 1026 of the Military Engineer ",
  },
  {
    img: "/IMAGES/mil-eng-1027.png",
    alt: "Military Engineer Interior",
    description: "Page 1027 of the Military Engineer ",
  },
  {
    img: "/IMAGES/mil-eng-1028.png",
    alt: "Military Engineer Interior",
    description: "Page 1028 of the Military Engineer ",
  },
  {
    img: "/IMAGES/mil-eng-1029.png",
    alt: "Military Engineer Interior",
    description: "Page 1029 of the Military Engineer ",
  },
  {
    img: "/IMAGES/mil-eng-1030.png",
    alt: "Military Engineer Interior",
    description: "Page 1030 of the Military Engineer ",
  },
  {
    img: "/IMAGES/mil-eng-1031.png",
    alt: "Military Engineer Interior",
    description: "Page 1031 of the Military Engineer ",
  },
  {
    img: "/IMAGES/mil-eng-1032.png",
    alt: "Military Engineer Interior",
    description: "Page 1032 of the Military Engineer",
  },
  {
    img: "/IMAGES/mil-eng-pon1.png",
    alt: "Military Engineer Interior",
    description: "Page 1070 of the Military Engineer",
  },
  {
    img: "/IMAGES/mil-eng-pon2.png",
    alt: "Military Engineer Interior",
    description: "Page 1090 of the Military Engineer.",
  },
  {
    img: "/IMAGES/mil-eng-pon3.png",
    alt: "Military Engineer Interior",
    description: "Page 1091 of the Military Engineer",
  },
  ]
  
  return (
    <div className="bg-muted/50 min-h-[100vh] flex-1 rounded-xl md:min-h-min text-start">
      <h1 className="text-2xl font-bold p-4">History of the Half-Ponton Bridge Boat</h1>
      <h1 className="text-xl text-left p-4">"The Bailey Boat"</h1>
      <p className="p-4">
        Our favorite boat is the Military Ponton Bridge Half Section. They have a Spoon Bow, High Chin, and railing around the exterior for carrying these in combat. These 685 lb aluminum boats were made to link with others and add planking to create bridges across rivers.
        <br />
        <br />
        These aluminum boat platforms have the roominess and stability to be whatever you want them to be. THEY ARE LITERALLY A BLANK CANVASS and I consider each UgliBoat owner and fabricator to be an artist.
        <br />
        <br />
        They are built sturdy enough to withstand the rigors of combat, and have proven their mettle with anything we have put them to test on.
        <br />
        <br />
        </p>
        <div className="flex items-center p-4">
          <span className="relative flex size-3">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
          <span className="relative inline-flex size-3 rounded-full bg-red-500"></span>
          </span>
          <p className="ml-2">Notice!</p>
        </div>

        <p className='animate-pulse p-4'>
        IF YOU KNOW WHERE ANY OF THESE ARE FOR SALE, PLEASE CONTACT ME AT Greg@UgliBoats.com
        </p>
        <br />
        <p className='p-4'>
        We will either buy them from you or post them on this site for you.
        <br />
        <br />

        I tracked down many false leads, scouring all the government auction sites and calling military bases nationwide. It wasn't too long before I realized that the days of buying a stack of these at a military surplus auction are long gone. I didn't have any luck finding one, but my luck was starting to change when I struck up a friendship with a guy that is a good boat mechanic, and quite a craigslist boat section expert.
        <br />
        </p>
        <hr/>
        <h1 className="text-xl text-left p-4">HISTORY AND MILITARY DETAILS</h1>
        <p className='p-4'>
        The following is directly from the field manual for these Light tactical rafts (LTRs) and bridges :
        <h3 className="text-xl text-left p-4">Chapter 7 Half-Ponton:</h3>
        <img src='/IMAGES/PHpage pic.jpg' />
        The aluminum alloy half-ponton has an effective length of 18 feet 6 inches, is 6 feet 8.5 inches wide, and 2 feet 10 inches high. The bow of each half-ponton is raised approximately 7 inches higher than the stem to prevent the ponton from swamping when rafting in swift currents. The half-ponton weighs approximately 650 pounds and has a displacement of 6.25 tons. Two half-pontons are joined stem to stem to form a whole ponton which supports the light floating bridge or raft.

        
        </p>
        <hr />
        <p className='p-4'>Entire Field manual links: </p>
        <h1 className="text-xl text-left p-4 text-decoration-line: underline">Military Float Bridging Equipment</h1>
        <h3 className="text-l text-left p-4">Table of Contents</h3>
        
        <a
          href="/PDF/ch1rivercrossingconcepts.pdf"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 underline hover:text-blue-800 font-semibold block p-4"
          >
            Field Manual PDF (Chapter 1: River Crossing Concepts)
        </a>
        <a
          href="/PDF/ch2watermanshipandsafety.pdf"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 underline hover:text-blue-800 font-semibold block p-4"
          >
            Field Manual PDF (Chapter 2: Watermanship and Saftey)
        </a>
        <a
          href="/PDF/ch3boatsandmotors.pdf"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 underline hover:text-blue-800 font-semibold block p-4"
          >
             Field Manual PDF (Chapter 3: Boats and Motors)
        </a>
        <a
          href="/PDF/ch4improvedfloatbridgeribbon.pdf"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 underline hover:text-blue-800 font-semibold block p-4"
          >
             Field Manual PDF (Chapter 4: Imporved Float Bridge (Ribbon))
        </a>
        <a
          href="/PDF/ch5floatingbridgesandrafts.pdf"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 underline hover:text-blue-800 font-semibold block p-4"
          >
             Field Manual PDF (Chapter 5: M4T6 Floating Bridges and Rafts)
        </a>
        <a
          href="/PDF/ch6floatingbridge.pdf"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 underline hover:text-blue-800 font-semibold block p-4"
          >
             Field Manual PDF (Chapter 6: Class 60 Floating Bridge)
        </a>
        <a
          href="/PDF/ch7lighttacticalraftsandbridges.pdf"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 underline hover:text-blue-800 font-semibold block p-4"
          >
             Field Manual PDF (Chapter 7: Light Tactical Rafts and Bridges)
        </a>
        <a
          href="/PDF/ch8anchorageoffloatingbridges.pdf"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 underline hover:text-blue-800 font-semibold block p-4"
          >
             Field Manual PDF (Chapter 8: Anchorage of Floating Bridges)
        </a>
        <a
          href="public/PDF/ch9floatbridgeprotectivedevices.pdf"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 underline hover:text-blue-800 font-semibold block p-4"
          >
             Field Manual PDF (Chapter 9: Flot Bridge Protective Devices)
        </a>
        <a
          href="/PDF/apaaknotsandlashings.pdf"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 underline hover:text-blue-800 font-semibold block p-4"
          >
             Field Manual PDF (Appendix A - Knots and Lashings)
        </a>
        <a
          href="/PDF/appbairliftops.pdf"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 underline hover:text-blue-800 font-semibold block p-4"
          >
            Field Manual PDF (Appendix B - Airlift Operations)
        </a>
        <a
          href="/PDF/appcexpediantdesignofanchorsystems.pdf"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 underline hover:text-blue-800 font-semibold block p-4"
          >
            APPENDIX C - EXPEDIENT DESIGN OF OVERHEAD ANCHORAGE SYSTEMS
        </a>
        <a
          href="/PDF/appdexpediantanchorages.pdf"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 underline hover:text-blue-800 font-semibold block p-4"
          >
            APPENDIX D - EXPEDIENT ANCHORAGES
        </a>
        <a
          href="/PDF/appealuminumfloatingfootbridges.pdf"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 underline hover:text-blue-800 font-semibold block p-4"
          >
            APPENDIX E - ALUMINUM FLOATING FOOTBRIDGE
        </a>
        <a
          href="/PDF/appfaccessandegressroadwayaers.pdf"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 underline hover:text-blue-800 font-semibold block p-4"
          >
            APPENDIX F - ACCESS/EGRESS ROADWAY SYSTEM (AERS)
        </a>
        <a
          href="/PDF/glossary.pdf"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 underline hover:text-blue-800 font-semibold block p-4"
          >
            Glossary
        </a>
        <a
          href="/PDF/references.pdf"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 underline hover:text-blue-800 font-semibold block p-4"
          >
            REFERENCES
        </a>
        <a
          href="/PDF/TC5210authorizationletter.pdf"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 underline hover:text-blue-800 font-semibold block p-4"
          >
            AUTHORIZATION LETTER
        </a>
        <a
          href="/PDF/toc.pdf"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 underline hover:text-blue-800 font-semibold block p-4"
          >
            Table of Contents
        </a>
        <h3 className="p-4">DISTRIBUTION RESTRICTION: Approved for public release; distribution is unlimited.</h3>
        <hr/>
        <a
          href="/PDF/spoonbow high chin ponton milspecs.pdf"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 underline hover:text-blue-800 font-semibold block p-4"
          >
            SpoonBow High Chin Ponton MILSECS PDF
        </a>
        <p className="p-4">This document shows the manufacturing processes and quality assurance standards that were established for manufacturing companies that supplied the Ponton Bridge Boat to the military.</p>
        <hr/>
        <a
          href="public/PDF/baileybridgebook.pdf"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 underline hover:text-blue-800 font-semibold block p-4"
          >
            Article: The Bailey: The Amazing, All-Purpose Bridge - WWII
        </a>
        <p className="p-4">This pdf is an article about building Bailey bridges during WW2</p>
        <hr />
        <h1 className="text-xl text-left p-4 pb-0.5">Book: The Military Engineer</h1>
        <p className="text-s text-left p-4 pt-0">January 1920 through December 1921</p>
        <img className="md:max-w-[500px]" src="public/IMAGES/PHpage Military Engineer Cover Pic.jpg"/>
        <br />
        <p className="text-s text-left p-4 pt-0">
          These 1146 pages chronicle two years of articles for military engineers. There are several sections of interest that include articles and pictures of ponton bridges. You can download the complete PDF{' '}
          <a
            href="https://drive.google.com/file/d/1iaYZbBT8YPq8tTO9Q6UuWK_VQ7a-fZoj/view?usp=drive_link"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 underline hover:text-blue-800"
          >
            here
          </a>
          . <br/> I have complied some of the most interesting and relevant pages below.
        </p>
        <div className="my-8">
          <Carousel className="w-full max-w-xl mx-auto">
            <CarouselContent>
              {dialogImages.map((item, idx) => (
                <CarouselItem key={idx} className="flex flex-col items-center">
                  <img
                    key={idx}
                    src={item.img}
                    alt={item.alt}
                    className="w-full max-w-xs sm:max-w-md md:max-w-lg h-auto mx-auto rounded"
                    style={{ maxHeight: '70vh' }}
                  />
                  <p className="text-sm text-gray-600 mt-2 text-center">{item.description}</p>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious />
            <CarouselNext />
          </Carousel>
        </div>
    </div>
  )
}

export default HistoryPage