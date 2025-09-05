"use client";

import * as React from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { MovieCard } from "@/components/movie-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Sparkles } from "lucide-react";
import { marked } from "marked";

// Types
interface RecommendedContent {
  id: string;
  title: string;
  description: string | null;
  overview?: string | null;
  release_year: number | null;
  type: "movie" | "tv_show";
  poster_url: string | null;
  language_ids: string[];
  genre_ids: string[];
  languages?: { name: string }[] | null;
  movie_ott_platforms?: { ott_platforms: { name: string; icon_url: string | null } }[];
  ott_platforms?: { name: string; icon_url: string | null }[];
}

interface RecommendationsProps {
  content?: string | null | undefined;
}

export function Recommendations({ content }: RecommendationsProps) {
  const { toast } = useToast();
  const [recommendations, setRecommendations] = React.useState<RecommendedContent[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [allGenres, setAllGenres] = React.useState<{ id: string; name: string }[]>([]);
  const [allOttPlatforms, setAllOttPlatforms] = React.useState<
    { id: string; name: string; icon_url: string | null }[]
  >([]);
  const [allLanguages, setAllLanguages] = React.useState<{ id: string; name: string }[]>([]);
  const [userId, setUserId] = React.useState<string | null>(null);

  const supabase = getSupabaseBrowserClient();

  // Fetch user id
  React.useEffect(() => {
    let isCancelled = false;
    async function fetchUser() {
      const { data: { user }, error } = await supabase.auth.getUser();
      console.log("Fetched userId:", user?.id, "error:", error);
      if (!isCancelled) setUserId(user?.id ?? null);
    }
    fetchUser();
    return () => { isCancelled = true; };
  }, [supabase]);

  // Main fetch recommendations logic
  React.useEffect(() => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    const fetchRecommendations = async () => {
      setIsLoading(true);

      // Lookups
      const [
        { data: genresData },
        { data: ottData },
        { data: languagesData }
      ] = await Promise.all([
        supabase.from("genres").select("id, name"),
        supabase.from("ott_platforms").select("id, name, icon_url"),
        supabase.from("languages").select("id, name"),
      ]);
      setAllGenres(genresData ?? []);
      setAllOttPlatforms(ottData ?? []);
      setAllLanguages(languagesData ?? []);

      // Watched content
      const { data: watchedContent, error: watchedError } = await supabase
        .from("user_watched_content")
        .select(`
          movies_tv_shows (
            id,
            title,
            type,
            language_ids,
            genre_ids
          )
        `)
        .eq("user_id", userId);

      if (watchedError) {
        toast({ title: "Error fetching watched content", description: watchedError.message, variant: "destructive" });
        setIsLoading(false);
        return;
      }

      const currentWatchedCount = (watchedContent ?? []).length;

      // Fetch stored recommendations
      const { data: storedRecs, error: storedError } = await supabase
        .from("user_recommendations")
        .select("recommendations, watched_count")
        .eq("user_id", userId)
        .single();

      if (storedError && storedError.code !== "PGRST116") {
        toast({ title: "Error fetching stored recommendations", description: storedError.message, variant: "destructive" });
        setIsLoading(false);
        return;
      }

      // Check if we can use stored recommendations
      if (storedRecs && storedRecs.watched_count === currentWatchedCount) {
        console.log("Using stored recommendations:", storedRecs.recommendations);
        setRecommendations(storedRecs.recommendations ?? []);
        setIsLoading(false);
        return;
      }

      // Prepare watched IDs
      const watchedIds = (watchedContent ?? [])
        .map((item) => item.movies_tv_shows?.id)
        .filter(Boolean);

      // Fetch user's preferences
      const { data: userProfile } = await supabase
        .from("user_profiles")
        .select("preferred_language_ids, preferred_genre_ids")
        .eq("user_id", userId)
        .single();

      // Use lookups for watched summary
      const watchedMoviesSummary = (watchedContent ?? [])
        .filter((item) => item.movies_tv_shows)
        .map((item) => {
          const content = item.movies_tv_shows;
          const displayLangs = Array.isArray(content.language_ids) && content.language_ids.length
            ? content.language_ids.map(
                (langId) => languagesData?.find((lang) => lang.id === langId)?.name
              ).filter(Boolean).join(", ")
            : "N/A";
          const displayGenres = Array.isArray(content.genre_ids) && content.genre_ids.length
            ? content.genre_ids.map(
                (genreId) => genresData?.find((g) => g.id === genreId)?.name
              ).filter(Boolean).join(", ")
            : "N/A";
          return `${content.title} (${content.type}, ${displayLangs}, ${displayGenres})`;
        })
        .join("\n") ?? "";

      let preferredLanguages = "any";
      let preferredGenres = "any";
      if (userProfile) {
        if (Array.isArray(userProfile.preferred_language_ids) && userProfile.preferred_language_ids.length) {
          preferredLanguages = userProfile.preferred_language_ids
            .map((langId: string) => languagesData?.find((l) => l.id === langId)?.name)
            .filter(Boolean).join(", ");
        }
        if (Array.isArray(userProfile.preferred_genre_ids) && userProfile.preferred_genre_ids.length) {
          preferredGenres = userProfile.preferred_genre_ids
            .map((genreId: string) => genresData?.find((g) => g.id === genreId)?.name)
            .filter(Boolean).join(", ") || "any";
        }
      }

      // Construct AI prompt
      const prompt = `
        The user has watched the following content:
        ${watchedMoviesSummary || "No content watched yet."}

        Their preferred languages are: ${preferredLanguages}
        Their preferred genres are: ${preferredGenres}

        Based on this information, recommend 5-10 movies or TV shows.
        For each recommendation, provide only the title, type (movie/tv_show), and a very brief one-sentence overview.
        Format your response as a JSON array of objects, like this:
        [
          { "title": "Movie Title 1", "type": "movie", "overview": "Brief overview." },
          { "title": "TV Show Title 1", "type": "tv_show", "overview": "Brief overview." }
        ]
        Ensure the recommendations are distinct from the watched content and align with their preferences.
      `;

      try {
        // Fetch AI recommendations from API
        const response = await fetch("/api/recommend", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, prompt }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to fetch recommendations from AI.");
        }

        const { recommendations: aiRecommendations } = await response.json();

        // Pull recommended titles
        const recommendedTitles = Array.isArray(aiRecommendations)
          ? aiRecommendations.map((rec: any) => rec.title)
          : [];

        console.log("AI recommended titles:", recommendedTitles);

        // Fetch real content for recommendations - MAKE SURE poster_url is selected
        let dbContent: any[] = [];
        if (recommendedTitles.length > 0) {
          const { data, error: dbError } = await supabase
            .from("movies_tv_shows")
            .select(`
              id,
              title,
              overview,
              release_year,
              type,
              poster_url,
              language_ids,
              genre_ids,
              languages (name),
              movie_ott_platforms (
                ott_platforms (name, icon_url)
              )
            `)
            .in("title", recommendedTitles);

          if (dbError) {
            toast({
              title: "Error fetching recommended content details",
              description: dbError.message,
              variant: "destructive",
            });
          }
          
          dbContent = data ?? [];
          console.log("DB content with poster URLs:", dbContent.map(item => ({ 
            title: item.title, 
            poster_url: item.poster_url 
          })));
        }

        // Merge/Annotate: prefers DB content; fallbacks for non-existent
        const finalRecommendations: RecommendedContent[] = [];
        const seen = new Set<string>();

        for (const aiRec of aiRecommendations || []) {
          const foundInDb = dbContent?.find((dbItem) => 
            dbItem.title.toLowerCase().trim() === aiRec.title.toLowerCase().trim()
          );

          let rec: RecommendedContent;
          if (foundInDb) {
            console.log(`Found in DB: ${foundInDb.title}, poster_url: ${foundInDb.poster_url}`);
            rec = {
              id: foundInDb.id,
              title: foundInDb.title,
              description: foundInDb.overview ?? aiRec.overview ?? null,
              overview: foundInDb.overview ?? aiRec.overview ?? null,
              release_year: foundInDb.release_year,
              type: foundInDb.type,
              // IMPORTANT: Make sure poster_url is properly assigned
              poster_url: foundInDb.poster_url,
              language_ids: foundInDb.language_ids || [],
              genre_ids: foundInDb.genre_ids || [],
              languages: foundInDb.languages,
              ott_platforms: Array.isArray(foundInDb.movie_ott_platforms)
                ? foundInDb.movie_ott_platforms.map((p: any) => ({
                    name: p.ott_platforms?.name || "",
                    icon_url: p.ott_platforms?.icon_url || null,
                  }))
                : [],
            };
          } else {
            console.log(`NOT found in DB: ${aiRec.title}`);
            rec = {
              id: `ai-rec-${aiRec.title.replace(/\s/g, "-").toLowerCase()}-${aiRec.type}`,
              title: aiRec.title,
              description: aiRec.overview ?? null,
              overview: aiRec.overview ?? null,
              type: aiRec.type || "movie",
              poster_url: null,
              release_year: null,
              genre_ids: [],
              language_ids: [],
              languages: null,
              ott_platforms: [],
            };
          }
          
          if (!seen.has(rec.id)) {
            finalRecommendations.push(rec);
            seen.add(rec.id);
          }
        }

        console.log("Final recommendations with poster URLs:", 
          finalRecommendations.map(r => ({ title: r.title, poster_url: r.poster_url }))
        );

        // Store the new recommendations
        const { error: storeError } = await supabase
          .from("user_recommendations")
          .upsert({
            user_id: userId,
            recommendations: finalRecommendations,
            watched_count: currentWatchedCount,
            generated_at: new Date().toISOString(),
          }, { onConflict: "user_id" });

        if (storeError) {
          toast({ title: "Error storing recommendations", description: storeError.message, variant: "destructive" });
        }

        setRecommendations(finalRecommendations);
      } catch (error: any) {
        toast({
          title: "Recommendation Error",
          description: error.message,
          variant: "destructive",
        });
        console.error("AI Recommendation Error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecommendations();
  }, [userId, supabase, toast]);

  // UI: show loader while fetching
  if (isLoading) {
    return (
      <div className="flex min-h-[calc(100vh-64px)] items-center justify-center p-4 bg-background text-foreground">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="ml-4 text-lg">Generating personalized recommendations...</p>
      </div>
    );
  }

  // UI: not logged in
  if (!userId) {
    return (
      <div className="flex min-h-[calc(100vh-64px)] items-center justify-center p-4 bg-background text-foreground">
        <p className="text-lg">You must be logged in to see recommendations.</p>
      </div>
    );
  }

  // UI: main result
  return (
    <Card className="w-full max-w-7xl mx-auto bg-card text-card-foreground border-border p-6">
      <CardHeader>
        <CardTitle className="text-3xl font-bold text-primary flex items-center">
          <Sparkles className="h-7 w-7 mr-2" /> AI-Powered Recommendations
        </CardTitle>
        <Separator className="my-4 bg-border" />
      </CardHeader>
      <CardContent>
        {recommendations.length === 0 ? (
          <p className="text-center text-muted-foreground text-lg">
            No recommendations available yet. Watch and rate more movies to get better suggestions!
          </p>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 md:gap-8">
              {recommendations.map((movie) => {
                console.log(`Rendering MovieCard for ${movie.title} with poster_url: ${movie.poster_url}`);
                
                return (
                  <div
                    key={movie.id}
                    className="rounded-2xl shadow-lg overflow-hidden border border-border bg-card"
                  >
                    <MovieCard
                      movie={{
                        id: movie.id,
                        title: movie.title,
                        release_year: movie.release_year || 0,
                        poster_url: movie.poster_url, // This should now work
                        overview: movie.description || movie.overview || null,
                        genres: allGenres.filter(g => movie.genre_ids.includes(g.id)).map(g => ({ name: g.name })),
                        languages: allLanguages.filter(l => movie.language_ids.includes(l.id)).map(l => ({ name: l.name })),
                        ott_platforms: movie.ott_platforms?.map(p => ({ name: p.name })) || [],
                      }}
                      readOnlyRating
                      variant="full"
                    />
                  </div>
                );
              })}
            </div>
          </>
        )}
        {content && (
          <div className="prose prose-invert max-w-none mt-6">
            <div dangerouslySetInnerHTML={{ __html: marked(content ?? "") }} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
