import * as React from "react"
import { Link } from "react-router-dom"
import { Ship } from 'lucide-react'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar"

import { useIsMobile } from "@/hooks/use-mobile"

// This is sample data.
const data = {
  navMain: [
    {
      title: "Builds",
      url: "builds",
      items: [
        {
          title: "Installation",
          url: "builds",
        },
        {
          title: "Project Structure",
          url: "#",
        },
      ],
    },
    {
      title: "About us",
      url: "about",
      items: [
        {
          title: "Routing",
          url: "#",
        },
      ],
    },
  ],
}

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
                <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                  <Ship className="size-4" />
                  
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-medium">UGLI Boats</span>
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
            <Link to="/about">
              <SidebarMenuButton onClick={handleSidebarToggle}>About us</SidebarMenuButton>
            </Link>
            <Link to="/history">
              <SidebarMenuButton onClick={handleSidebarToggle}>History</SidebarMenuButton>
            </Link>
            <Link to="/for-sale">
              <SidebarMenuButton onClick={handleSidebarToggle}>For Sale</SidebarMenuButton>
            </Link>
            {/* {data.navMain.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild>
                  <a href={item.url} className="font-medium">
                    {item.title}
                  </a>
                </SidebarMenuButton>
                {item.items?.length ? (
                  <SidebarMenuSub>
                    {item.items.map((item) => (
                      <SidebarMenuSubItem key={item.title}>
                        <SidebarMenuSubButton asChild isActive={item.isActive}>
                          <a href={item.url}>{item.title}</a>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                ) : null}
              </SidebarMenuItem>
            ))} */}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}
