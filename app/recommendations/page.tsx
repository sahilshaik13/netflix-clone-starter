import { Suspense } from "react"
import { redirect } from "next/navigation"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { Recommendations } from "@/components/recommendations"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default async function RecommendationsPage() {
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

  if (profileError || !userProfile?.onboarding_complete) {
    redirect("/onboarding") // Redirect to onboarding if not complete
  }

  return (
    <div className="flex flex-1 flex-col p-4 md:p-8">
      <h1 className="mb-6 text-3xl font-bold text-primary">Your Personalized Recommendations</h1>

      <Card className="bg-card text-card-foreground border-netflix-dark-light">
        <CardHeader>
          <CardTitle className="text-xl text-primary">Recommendations for You</CardTitle>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<div>Generating recommendations...</div>}>
            <Recommendations userId={user.id} />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  )
}
