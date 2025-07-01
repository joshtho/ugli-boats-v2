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



export default function Page() {
  const location = useLocation()
  console.log("Current location:", location)
  const pathnames = location.pathname.split("/").filter(Boolean)

  // Helper to build the URL for each breadcrumb
  const buildPath = (idx: number) =>
    "/" + pathnames.slice(0, idx + 1).join("/")

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b">
          
          <div className="flex items-center gap-2 px-3">
            <SidebarTrigger />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
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
          </div>
        </header>
        <img
          src="/IMAGES/ugliboatsbanner.jpg"
          alt="ugliboats.com banner"
          className="object-contain lg:h-25"
          style={{ maxWidth: '100%' }}
        />
        <div className="flex flex-1 flex-col gap-4 p-4">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/builds" element={<BuildPage />} />
              <Route path="/history" element={<HistoryPage />} />
              <Route path="/for-sale" element={<ForSalePage />} />
              <Route path='/about' element={<AboutPage />} />
              <Route path="/builds/:name" element={<BoatPage />} />
              {/* Add more routes as needed */}
            </Routes>
          {/* <div className="grid auto-rows-min gap-4 md:grid-cols-3">
            </div> */}
            {/* <div className="bg-muted/50 aspect-video rounded-xl" />
            <div className="bg-muted/50 aspect-video rounded-xl" />
            <div className="bg-muted/50 aspect-video rounded-xl" /> */}
          {/* <div className="bg-muted/50 min-h-[100vh] flex-1 rounded-xl md:min-h-min" /> */}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
