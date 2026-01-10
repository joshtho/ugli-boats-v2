import * as React from "react"
import { Link } from "react-router-dom"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar"

import { useIsMobile } from "@/hooks/use-mobile"



export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { toggleSidebar } = useSidebar()
  const isMobile = useIsMobile()
  function handleSidebarToggle() {
    if (isMobile) {
      toggleSidebar() 
    }
  }
  
  return (
    <Sidebar {...props}> 
      <SidebarHeader className="font-home text-3xl h-16 flex items-center justify-center">
        UGLIBOATS
      </SidebarHeader>
      <SidebarContent className="bg-[url('/ugli-boats-v2/IMAGES/bguglibanner-vertical.jpg')] bg-transparent border-b-gray-900">
        <SidebarGroup>
          <SidebarMenu>
            
            <Link to="/builds">
            <SidebarMenuButton className="text-secondary" onClick={handleSidebarToggle} >Ugli Builds</SidebarMenuButton>
            </Link>
            <Link to="/submit-build">
              <SidebarMenuButton onClick={handleSidebarToggle} className="text-secondary" >
                Submit Your Build
              </SidebarMenuButton>
            </Link>
            <Link to="/for-sale">
              <SidebarMenuButton onClick={handleSidebarToggle} className="text-secondary">For Sale</SidebarMenuButton>
            </Link>
            <Link to="/history">
              <SidebarMenuButton onClick={handleSidebarToggle} className="text-secondary">History of Ugliboats</SidebarMenuButton>
            </Link>
            <Link to="/photos">
              <SidebarMenuButton onClick={handleSidebarToggle} className="text-secondary">Random Photos</SidebarMenuButton>
            </Link>
            <Link to="/interesting">
              <SidebarMenuButton onClick={handleSidebarToggle} className="text-secondary">Interesting Finds</SidebarMenuButton>
            </Link>
            <Link to="/about">
              <SidebarMenuButton onClick={handleSidebarToggle} className="text-secondary">About us</SidebarMenuButton>
            </Link>
            <Link to="/contact">
              <SidebarMenuButton onClick={handleSidebarToggle} className="text-secondary">Contact us</SidebarMenuButton>
            </Link>
          </SidebarMenu>
        </SidebarGroup>
        
        {/* Admin Section */}
        <SidebarGroup className="absolute inset-x-0 bottom-0 mb-4">
          <SidebarMenu>
            <Link to="/admin">
              <SidebarMenuButton onClick={handleSidebarToggle} className="text-orange-600 hover:text-orange-700">
                Admin
              </SidebarMenuButton>
            </Link>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}
