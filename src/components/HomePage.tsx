
    'use client'

import { useState } from 'react'
import { Link } from 'react-router-dom'
import {Button} from '@/components/ui/button'


export default function Example() {
  // const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [toggleHidden, setToggleHidden] = useState(true)

  return (
    <div className="bg-white">
      <div className="relative isolate ">
        <div className="mx-auto max-w-2xl py-32 sm:py-48 lg:py-26">
          <div className="text-center">
            <h1 className="text-5xl font-semibold tracking-tight text-balance text-gray-900 sm:text-7xl">
              Welcome to UGLI Boats
            </h1>
            <p className="mt-8 text-lg font-medium text-pretty text-gray-500 sm:text-xl/8">
              A home for enthusiasts of old aluminum boats that can only be described as "Ugli"
            </p>
            <br />
          <div className="sm:mb-8 sm:flex sm:justify-center">
            <Button className=" bg-white relative rounded-full px-3 py-1 text-sm/6 text-gray-600 ring-1 ring-gray-900/10 hover:bg-amber-50">
              {' '}
              <span onClick={() => setToggleHidden(!toggleHidden)} className="hover:pointer-events-auto font-semibold text-[#414d0b]">
                Read more <span aria-hidden="true">&rarr;</span>
              </span>
            </Button>
          </div>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link to="/builds">
                <Button
                className="rounded-md bg-[#414d0b] px-3.5 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-[#727a17] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                >
                  UGLI Builds
                </Button>
              </Link>
              <Link to="/about">
                <Button className="text-sm/6 font-semibold text-white">
                  About us <span aria-hidden="true">→</span>
                </Button>
              </Link>
            </div>
          </div>
          <br />
          <br />
                  <p className={toggleHidden ? "hidden" : "text-lg font-medium text-pretty text-gray-500 sm:text-xl/8"}>
                    Although we are most partial to the Bailey Bridge Boat hulls, this site is dedicated to all fishermen and hunters that are enthusiasts of any old aluminum fishing boats and their restoration and fabrication. If you love old aluminum military boats, work vessels, and unique or unusual old boats, this is the site for you.
      
                    We look at these old vessels like an artist looks at a blank canvass.
      
                    Each person has fabricated their boat to specifically meet their individual tastes and needs. We enjoy sharing this information with each other for entertainment value, as well as a source for new innovative ideas.
      
                    If you are like we are; you have discovered that your tastes and needs for the ideal fishing or hunting boat will not be mass produced... they must be created.
      
                    This site is for you, so take a look around and feel free to contact us with questions or additions to the site that you would like. Please feel free to send us information or photos of any odd, unique or extremely old aluminum vessel pictures, information, and fabrication processes you have about them.
                  </p>
        </div>
        
      </div>
    </div>
  )
}
