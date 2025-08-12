import { useState } from 'react'
import { Link } from 'react-router-dom'
import {Button} from '@/components/ui/button'


export default function HomePage() {
  const [toggleHidden, setToggleHidden] = useState(true)

  return (
    <div className="bg-white">
      <div className="relative isolate ">
        <div className="mx-auto max-w-2xl py-5">
          <div className="text-center flex flex-col items-center justify-center">
            <h1 className="mb-8 text-5xl font-semibold tracking-tight text-balance sm:text-7xl" style={{ color: '#414d0b' }}>
              Welcome to UGLI Boats
            </h1>
            <img className='flex justify-center' src='/ugli-boats-v2/IMAGES/Ugli 2 Build Pics/ugli 2 with top down.jpg' />
            <p className="mt-8 text-lg font-medium text-pretty text-gray-500 sm:text-xl/8">
              A home for enthusiasts of old aluminum boats that can only be described as "Ugli"
            </p>
            <br />
            <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-md mx-auto">
              <Link to="/builds">
                <Button className="w-full rounded-md bg-[#202704] px-3.5 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-[#727a17] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">
                  UGLI Builds
                </Button>
              </Link>
              <Link to="/about">
                <Button className="w-full text-sm/6 font-semibold text-white bg-[#414d0b] hover:bg-[#727a17]">
                  About us
                </Button>
              </Link>
              <Link to="/for-sale">
                <Button className="w-full rounded-md bg-[#202704] px-3.5 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-[#727a17] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">
                  For Sale
                </Button>
              </Link>
              <Link to="/history">
                <Button className="w-full text-sm/6 font-semibold text-white bg-[#414d0b] hover:bg-[#727a17]">
                  Ugli-History
                </Button>
              </Link>
            </div>
          </div>
          <br />
          <div className='flex items-center justify-center'>
            <Button className=" bg-white relative rounded-full px-3 py-1 text-sm/6 text-gray-600 ring-1 ring-gray-900/10 hover:bg-amber-50">
              {' '}
              <span onClick={() => setToggleHidden(!toggleHidden)} className="hover:pointer-events-auto font-semibold text-[#414d0b]">
                Read {toggleHidden ? "More" : "Less"} <span aria-hidden="true">&rarr;</span>
              </span>
            </Button>
          </div>
          <br />
                  <p className={toggleHidden ? "hidden" : "text-lg font-medium text-pretty text-gray-500 sm:text-xl/8"}>
                    Although we are most partial to the Bailey Bridge Boat hulls, this site is dedicated to all fishermen and hunters that are enthusiasts of any old aluminum fishing boats and their restoration and fabrication. If you love old aluminum military boats, work vessels, and unique or unusual old boats, this is the site for you.<br />
                    <br />
      
                    We look at these old vessels like an artist looks at a blank canvass.<br />
                    <br />
      
                    Each person has fabricated their boat to specifically meet their individual tastes and needs. We enjoy sharing this information with each other for entertainment value, as well as a source for new innovative ideas.<br />
                    <br />
      
      
                    If you are like we are; you have discovered that your tastes and needs for the ideal fishing or hunting boat will not be mass produced... they must be created.<br />
                    <br />
      
      
                    This site is for you, so take a look around and feel free to contact us with questions or additions to the site that you would like. Please feel free to send us information or photos of any odd, unique or extremely old aluminum vessel pictures, information, and fabrication processes you have about them.
                  </p>
        </div>
        
      </div>
    </div>
  )
}
