import { AppSidebar } from "@/components/app-sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"

import { Routes, Route, Link, useLocation } from "react-router-dom"
import BuildPage from "@/components/BuildPage"
import ForSalePage from "@/components/ForSalePage"
import HistoryPage from "@/components/HistoryPage"
import AboutPage from "@/components/AboutPage"
import HomePage from "@/components/HomePage"
import BoatPage from "@/components/BoatPage"
import InterestingPage from "@/components/InterestingPage"
import PhotosPage from "@/components/PhotosPage"
import AdminPage from "@/components/Admin/AdminPage"
import SubmitBuild from "@/components/SubmitBuild"
import ContactPage from "@/components/ContactPage"
import FooterSection from "@/components/FooterSection"

export default function App() {
  const location = useLocation()
  const pathnames = location.pathname.split("/").filter(Boolean)

  // Helper to build the URL for each breadcrumb
  const buildPath = (idx: number) =>
    "/" + pathnames.slice(0, idx + 1).join("/")

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b">
          
          <div className="flex items-center gap-2 px-3 flex-1">
            <SidebarTrigger />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb className="flex-1">
              <BreadcrumbList>
                <BreadcrumbItem>
                  <Link to="/">UGLI Home</Link>
                </BreadcrumbItem>
                {pathnames.map((segment, idx) => (
                  <span key={idx} className="flex items-center">
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                      {idx === pathnames.length - 1 ? (
                        <BreadcrumbPage>
                          {decodeURIComponent(segment)
                            .split("-")
                            .map(
                              (word) =>
                                word.charAt(0).toUpperCase() + word.slice(1)
                            )
                            .join(" ")}
                        </BreadcrumbPage>
                      ) : (
                        <BreadcrumbLink asChild>
                          <Link to={buildPath(idx)}>
                            {decodeURIComponent(segment)
                              .split("-")
                              .map(
                                (word) =>
                                  word.charAt(0).toUpperCase() + word.slice(1)
                              )
                              .join(" ")}
                          </Link>
                        </BreadcrumbLink>
                      )}
                    </BreadcrumbItem>
                  </span>
                ))}
              </BreadcrumbList>
            </Breadcrumb>
            
            {/* Banner in header on large screens */}
            <div className="hidden lg:block ml-auto">
              <img
                src="/ugli-boats-v2/IMAGES/Ugli-banner.png"
                alt="ugliboats.com banner"
                className="h-12 object-contain"
              />
            </div>
          </div>
        </header>
        
        {/* Banner below header on mobile/medium screens */}
        <div className="lg:hidden">
          <img
            src="/ugli-boats-v2/IMAGES/Ugli-banner.png"
            alt="ugliboats.com banner"
            className="object-contain lg:h-50 w-full"
            style={{ maxWidth: '100%' }}
          />
        </div>
        <div className="flex flex-1 flex-col gap-4 p-4">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/builds" element={<BuildPage />} />
              <Route path="/history" element={<HistoryPage />} />
              <Route path="/for-sale" element={<ForSalePage />} />
              <Route path='/about' element={<AboutPage />} />
              <Route path='/interesting' element={<InterestingPage />} />
              <Route path='/photos' element={<PhotosPage />} />
              <Route path='/admin' element={<AdminPage />} />
              <Route path='/submit-build' element={<SubmitBuild />} />
              <Route path='/contact' element={<ContactPage />} />
              <Route path="/builds/:name" element={<BoatPage />} />
            </Routes>
        </div>
            <FooterSection />
      </SidebarInset>
    </SidebarProvider>
  )
}