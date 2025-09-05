import { redirect } from "next/navigation"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { AuthForm } from "@/components/auth-form"

export default async function HomePage() {
  const supabase = await getSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    // Check if user has completed onboarding
    const { data: userProfile, error } = await supabase
      .from("user_profiles")
      .select("onboarding_complete")
      .eq("user_id", user.id)
      .single()

    if (error && error.code !== "PGRST116") {
      // PGRST116 means no rows found, which is expected for new users
      console.error("Error fetching user profile:", error)
      // Optionally, handle this error more gracefully, e.g., redirect to an error page
    }

    if (userProfile?.onboarding_complete) {
      redirect("/dashboard")
    } else {
      redirect("/onboarding")
    }
  }

  return <AuthForm />
}
