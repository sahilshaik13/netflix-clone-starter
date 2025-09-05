import { redirect } from "next/navigation"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { GenreSelection } from "@/components/genre-selection"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default async function GenresPage() {
  const supabase = await getSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/") // Redirect to login if not authenticated
  }

  const { data: userProfile, error: profileError } = await supabase
    .from("user_profiles")
    .select("onboarding_complete")
    .eq("user_id", user.id)
    .single()

  if (profileError) {
    console.error("Error fetching user profile:", profileError)
    // Handle error, maybe redirect to an error page or show a message
  }

  if (userProfile?.onboarding_complete) {
    redirect("/dashboard") // Redirect to dashboard if onboarding is complete
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md bg-card text-card-foreground border-netflix-dark-light">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl text-primary">Almost There!</CardTitle>
          <CardDescription className="text-muted-foreground">
            Now, select your favorite genres to help us recommend content.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <GenreSelection userId={user.id} />
        </CardContent>
      </Card>
    </div>
  )
}
