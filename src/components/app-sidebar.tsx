import * as React from "react"
import { Link } from "react-router-dom"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
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
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
              <Link to="/">
            <SidebarMenuButton onClick={handleSidebarToggle} size="lg" >
                <div className=" text-sidebar-primary-foreground flex aspect-square size-15 items-center justify-center">
                  <img src="/ugli-boats-v2/IMAGES/leftsidebarpic-2.jpg" />
                </div>
            </SidebarMenuButton>
              </Link>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            <Link to="/builds">
            <SidebarMenuButton onClick={handleSidebarToggle}>Builds</SidebarMenuButton>
            </Link>
            <Link to="/for-sale">
              <SidebarMenuButton onClick={handleSidebarToggle}>For Sale</SidebarMenuButton>
            </Link>
            <Link to="/history">
              <SidebarMenuButton onClick={handleSidebarToggle}>History</SidebarMenuButton>
            </Link>
            <Link to="/photos">
              <SidebarMenuButton onClick={handleSidebarToggle}>Photos</SidebarMenuButton>
            </Link>
            <Link to="/interesting">
              <SidebarMenuButton onClick={handleSidebarToggle}>Interesting</SidebarMenuButton>
            </Link>
            <Link to="/about">
              <SidebarMenuButton onClick={handleSidebarToggle}>About us</SidebarMenuButton>
            </Link>
            <Link to="/contact">
              <SidebarMenuButton onClick={handleSidebarToggle}>Contact us</SidebarMenuButton>
            </Link>
            <Link to="/submit-build">
              <SidebarMenuButton onClick={handleSidebarToggle} className="text-blue-600 hover:text-blue-700">
                Submit Your Build
              </SidebarMenuButton>
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
