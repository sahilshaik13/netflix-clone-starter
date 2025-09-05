import { redirect } from "next/navigation"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { LanguageSelection } from "@/components/language-selection"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default async function OnboardingPage() {
  const supabase = await getSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/") // Not authenticated
  }

  // Fetch user profile (must exist due to DB trigger)
  const { data: userProfile, error: profileError } = await supabase
    .from("user_profiles")
    .select("onboarding_complete")
    .eq("user_id", user.id)
    .single()

  // Handle broken/missing profile [optional: if profileError]
  if (profileError && profileError.code !== "PGRST116") {
    console.error("Error fetching user profile:", profileError)
    // Optionally show error UI or redirect to error page
    // redirect("/error") 
  }

  // Redirect if onboarding already done
  if (userProfile?.onboarding_complete) {
    redirect("/dashboard")
  }

  // Render onboarding card and client selection component
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md bg-card text-card-foreground border-netflix-dark-light">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl text-primary">Welcome to CineTrack!</CardTitle>
          <CardDescription className="text-muted-foreground">
            Let&apos;s personalize your experience. First, select your preferred languages.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Pass userId to "use client" LanguageSelection component */}
          <LanguageSelection userId={user.id} />
        </CardContent>
      </Card>
    </div>
  )
}
