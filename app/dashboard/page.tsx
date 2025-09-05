import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { UserAnalytics } from "@/components/user-analytics";
import { Recommendations } from "@/components/recommendations";
import { DashboardWatchedMovies } from "@/components/dashboard-watched-movies";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function DashboardPage() {
  const supabase = await getSupabaseServerClient();

  // Get user
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/");
  }

  // Get user profile
  const { data: userProfile, error: profileError } = await supabase
    .from("user_profiles")
    .select("onboarding_complete, preferred_genres")
    .eq("user_id", user.id)
    .single();
  if (profileError || !userProfile?.onboarding_complete) {
    redirect("/onboarding");
  }

  // --- Data Fetching for Analytics (Server-Side) ---

  // Genres lookup
  const { data: genresData } = await supabase.from("genres").select("*");
  const genreLookup = Object.fromEntries(
    (Array.isArray(genresData) ? genresData : []).map((g: any) => [
      g.id.toString(),
      g.name,
    ])
  );

  // Get all watched movie IDs for analytics calculations
  const { data: watched } = await supabase
    .from("user_watched_content")
    .select("movie_id")
    .eq("user_id", user.id);
  const watchedIds = (Array.isArray(watched) ? watched : []).map(
    (w: any) => w.movie_id
  );
  const totalWatched = watchedIds.length;

  // Rating analytics
  const { data: ratingRows } = await supabase
    .from("ratings")
    .select("rating_value")
    .eq("user_id", user.id);
  const ratingNumArr = Array.isArray(ratingRows)
    ? ratingRows
        .map((r: any) => Number(r.rating_value))
        .filter((v) => Number.isFinite(v))
    : [];
  const averageRating =
    ratingNumArr.length > 0
      ? ratingNumArr.reduce((sum, v) => sum + v, 0) / ratingNumArr.length
      : null;
  const ratingData: { rating: number; count: number }[] = [1, 2, 3, 4, 5].map(
    (num) => ({
      rating: num,
      count: ratingNumArr.filter((v) => v === num).length,
    })
  );

  // Genre analytics
  const { data: watchedMoviesAllGenres } = await supabase
    .from("movies_tv_shows")
    .select("id, genre_ids")
    .in("id", watchedIds.length ? watchedIds : [""]);
  const genreCount: Record<string, number> = {};
  (watchedMoviesAllGenres ?? []).forEach((movie: any) => {
    (movie.genre_ids ?? []).forEach((gid: any) => {
      const g = gid.toString();
      genreCount[g] = (genreCount[g] || 0) + 1;
    });
  });
  const genreData = Object.entries(genreCount).map(([gid, count]) => ({
    name: genreLookup[gid] || gid,
    count,
  }));

  const preferredGenreIds = Array.isArray(userProfile.preferred_genres)
    ? userProfile.preferred_genres.map((g: any) => g.toString())
    : [];

  // --- Render UI ---
  return (
    <div className="flex flex-1 flex-col p-4 md:p-8 bg-background">
      <h1 className="mb-6 text-3xl font-bold text-primary">Your Dashboard</h1>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        
        {/* Watched Movies Card with vertical scroll */}
        <Card className="md:col-span-2 lg:col-span-2 bg-card border border-border shadow-lg rounded-xl flex flex-col max-h-[560px]">
          <CardHeader>
            <CardTitle className="text-xl text-primary">
              Recently Watched
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto">
            <DashboardWatchedMovies userId={user.id} />
          </CardContent>
        </Card>

        {/* Analytics Card with vertical scroll */}
        <Card className="bg-card border border-border shadow-lg rounded-xl flex flex-col max-h-[560px]">
          <CardHeader>
            <CardTitle className="text-xl text-primary">
              Your Viewing Habits
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto">
            <Suspense fallback={<div className="p-4">Loading analytics...</div>}>
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

        {/* Recommendations Card with horizontal scroll */}
        <Card className="md:col-span-3 bg-card text-card-foreground border border-border shadow-lg rounded-xl">
          <CardHeader>
            <CardTitle className="text-xl text-primary">
              Personalized Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<div className="p-4">Loading recommendations...</div>}>
              {/* This wrapper enables horizontal scrolling. The <Recommendations /> component should render a non-wrapping flex row. */}
              <div className="overflow-x-auto pb-2">
                <Recommendations userId={user.id} />
              </div>
            </Suspense>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
