import { redirect } from "next/navigation"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { WatchedMoviesSelection } from "@/components/watched-movies-selection"

export default async function WatchedMoviesPage() {
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
      <WatchedMoviesSelection userId={user.id} />
    </div>
  )
}
