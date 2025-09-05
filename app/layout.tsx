import type React from "react"
import "./globals.css"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { cookies } from "next/headers" // Import cookies

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "CineTrack",
  description: "Your personalized movie and TV show tracker.",
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const supabase = await getSupabaseServerClient() // Await the Supabase client
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Get sidebar default open state from cookie [^4]
  const cookieStore = await cookies() // Await the cookies() call
  const defaultOpen = cookieStore.get("sidebar:state")?.value === "true"

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          <SidebarProvider defaultOpen={defaultOpen}>
            {session && <AppSidebar />} {/* Only render sidebar if session exists */}
            <SidebarInset className={session ? "" : "ml-0"}>
              {session && (
                <header className="flex h-16 shrink-0 items-center gap-2 border-b border-netflix-dark-light px-4">
                  <SidebarTrigger className="-ml-1" />
                  <span className="text-xl font-semibold text-primary">CineTrack</span>
                </header>
              )}
              {children}
            </SidebarInset>
          </SidebarProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
