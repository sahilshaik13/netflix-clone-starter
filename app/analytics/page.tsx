// app/(dashboard)/analytics/page.tsx

import { Suspense } from "react"
import { redirect } from "next/navigation"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { UserAnalytics } from "@/components/user-analytics"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default async function AnalyticsPage() {
  const supabase = await getSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/")
  }

  // Get onboarding status and preferred genres
  const { data: userProfile, error: profileError } = await supabase
    .from("user_profiles")
    .select("onboarding_complete, preferred_genres")
    .eq("user_id", user.id)
    .single()

  if (profileError || !userProfile?.onboarding_complete) {
    redirect("/onboarding")
  }

  // 1. Get all genres and map to id->name:
  const { data: genresData } = await supabase.from("genres").select("*")
  const genreLookup = Object.fromEntries(
    (genresData ?? []).map((g: any) => [g.id.toString(), g.name])
  )

  // 2. List of watched content for this user
  const { data: watched } = await supabase
    .from("user_watched_content")
    .select("movie_id")
    .eq("user_id", user.id)

  const watchedIds = (watched ?? []).map((w: any) => w.movie_id)
  const totalWatched = watchedIds.length

  // 3. Get ratings by this user
  const { data: ratingRows } = await supabase
    .from("ratings")
    .select("rating_value")
    .eq("user_id", user.id)

  // Average rating the user gave
  const ratingNumArr = ratingRows?.map((r: any) => Number(r.rating_value)).filter(Number.isFinite) ?? []
  const averageRating = ratingNumArr.length
    ? ratingNumArr.reduce((a, b) => a + b, 0) / ratingNumArr.length
    : null

  // 4. Genre Distribution (count by genre over watched content)
  // First fetch all watched movies' genre_ids
  const { data: watchedMovies } = await supabase
    .from("movies_tv_shows")
    .select("id,genre_ids")
    .in("id", watchedIds.length ? watchedIds : [""])
  // .in cannot take empty array, hence the fallback [""]

  // Flatten genres
  const genreCount: Record<string, number> = {}
  ;(watchedMovies ?? []).forEach((movie: any) => {
    (movie.genre_ids as number[] ?? []).forEach((gid) => {
      const g = gid.toString()
      genreCount[g] = (genreCount[g] || 0) + 1
    })
  })
  // To array format:
  const genreData = Object.entries(genreCount).map(([gid, count]) => ({
    name: genreLookup[gid] || gid,
    count,
  }))

  // 5. Rating Distribution (how many movies rated 1/2/3/4/5, by this user)
  const ratingData: { rating: number; count: number }[] = [1,2,3,4,5].map(num => ({
    rating: num,
    count: ratingNumArr.filter(v => v === num).length,
  }))

  // 6. Preferred Genres (from user)
  const preferredGenreIds = Array.isArray(userProfile.preferred_genres)
    ? userProfile.preferred_genres.map((g: any) => g.toString())
    : []

  return (
    <div className="flex flex-1 flex-col p-4 md:p-8">
      <h1 className="mb-6 text-3xl font-bold text-primary">Your Viewing Analytics</h1>
      <Card className="bg-card text-card-foreground border-netflix-dark-light">
        <CardHeader>
          <CardTitle className="text-xl text-primary">Viewing Habits Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<div>Loading analytics...</div>}>
            <UserAnalytics
              totalWatched={totalWatched}
              averageRating={averageRating}
              genreData={genreData}
              ratingData={ratingData}
              preferredGenreIds={preferredGenreIds}
              genreLookup={genreLookup}
            />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  )
}
