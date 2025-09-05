"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Home,
  Compass,
  BarChart2,
  Lightbulb,
  Settings,
  User,
  Film,
  Tv,
  ChevronDown,
  ChevronUp,
  LogOut,
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
} from "@/components/ui/sidebar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  const supabase = React.useMemo(() => getSupabaseBrowserClient(), [])
  const { toast } = useToast()
  const router = useRouter()
  const [userEmail, setUserEmail] = React.useState<string | null>(null)

  React.useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        setUserEmail(user.email)
      }
    }
    fetchUser()
  }, [supabase])

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      toast({
        title: "Sign Out Error",
        description: error.message,
        variant: "destructive",
      })
    } else {
      toast({
        title: "Signed Out",
        description: "You have been successfully signed out.",
      })
      router.push("/")
    }
  }

  const mainNavigation = [
    {
      title: "Home",
      href: "/dashboard",
      icon: Home,
    },
    {
      title: "Discover",
      href: "/discover",
      icon: Compass,
    },
    {
      title: "Analytics",
      href: "/analytics",
      icon: BarChart2,
    },
    {
      title: "Recommendations",
      href: "/recommendations",
      icon: Lightbulb,
    },
  ]

  const settingsNavigation = [
    {
      title: "Profile",
      href: "/settings/profile",
      icon: User,
    },
    {
      title: "Preferences",
      href: "/settings/preferences",
      icon: Settings,
    },
  ]

  const mediaTypes = [
    {
      title: "Movies",
      href: "/discover?type=Movie",
      icon: Film,
    },
    {
      title: "TV Shows",
      href: "/discover?type=TV Show",
      icon: Tv,
    },
  ]

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <Link href="/dashboard" className="flex items-center gap-2 px-2 py-4 text-2xl font-bold text-primary">
          <Film className="h-8 w-8" />
          <span>CineTrack</span>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Main Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavigation.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={pathname === item.href}>
                    <Link href={item.href}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        <SidebarGroup>
          <SidebarGroupLabel>Media</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mediaTypes.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={pathname === item.href}>
                    <Link href={item.href}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        <Collapsible defaultOpen className="group/collapsible">
          <SidebarGroup>
            <SidebarGroupLabel asChild>
              <CollapsibleTrigger className="flex w-full items-center justify-between">
                Settings
                <ChevronDown className="ml-auto h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
              </CollapsibleTrigger>
            </SidebarGroupLabel>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu>
                  {settingsNavigation.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild isActive={pathname === item.href}>
                        <Link href={item.href}>
                          <item.icon />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </SidebarGroup>
        </Collapsible>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton>
                  <Avatar className="h-6 w-6">
                    <AvatarImage src="/placeholder-user.jpg" alt="User Avatar" />
                    <AvatarFallback>CN</AvatarFallback>
                  </Avatar>
                  <span>{userEmail || "Guest"}</span>
                  <ChevronUp className="ml-auto h-4 w-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                side="top"
                className="w-(--radix-popper-anchor-width) bg-card text-card-foreground border-netflix-dark-light"
              >
                <DropdownMenuItem onClick={() => router.push("/settings/profile")}>
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
