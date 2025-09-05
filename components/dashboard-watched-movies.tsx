"use client";

import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { MovieCard } from "@/components/movie-card";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

interface DashboardWatchedMoviesProps {
  userId: string;
}

// Interfaces to hold all the necessary data for the MovieCard
interface Movie {
  id: string;
  title: string;
  release_year: number;
  poster_url: string | null;
  overview: string | null;
  type: string;
  genre_ids?: number[];
  language_ids?: string[];
  is_watched?: boolean;
  user_rating?: number | null;
  user_review?: string | null;
  genres?: Genre[]; // This will be populated before rendering
  languages?: Language[]; // This will be populated before rendering
}
interface Genre { id: number; name: string }
interface Language { id: string; name: string }

export function DashboardWatchedMovies({ userId }: DashboardWatchedMoviesProps) {
  const [watchedMovies, setWatchedMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  
  // State to hold genre and language lookups
  const [genres, setGenres] = useState<Genre[]>([]);
  const [languages, setLanguages] = useState<Language[]>([]);

  const supabase = getSupabaseBrowserClient();
  const { toast } = useToast();

  const fetchLookups = async () => {
    // Fetch genres and languages once to use for lookups
    const [{ data: genresData }, { data: languagesData }] = await Promise.all([
      supabase.from("genres").select("id, name"),
      supabase.from("languages").select("id, name"),
    ]);
    if (genresData) setGenres(genresData as Genre[]);
    if (languagesData) setLanguages(languagesData as Language[]);
  };
  
  const fetchWatchedMovies = async () => {
    setLoading(true);

    // 1. Fetch watched movies with their base details
    const { data: watchedContent, error } = await supabase
      .from("user_watched_content")
      .select(
        `
          movie_id,
          movies_tv_shows (
            id,
            title,
            release_year,
            poster_url,
            overview,
            type,
            genre_ids,
            language_ids
          )
        `
      )
      .eq("user_id", userId)
      .order("watched_at", { ascending: false })
      .limit(12);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to load watched movies.",
        variant: "destructive",
      });
      setWatchedMovies([]);
      setLoading(false);
      return;
    }
    
    const moviesData = (watchedContent ?? []).map(item => item.movies_tv_shows).filter(Boolean) as Movie[];
    const movieIds = moviesData.map(m => m.id);

    // 2. Fetch user-specific ratings and reviews for these movies
    let ratingsMap: Record<string, number> = {};
    let reviewsMap: Record<string, string> = {};

    if (userId && movieIds.length) {
      const [{ data: ratingsRows }, { data: reviewsRows }] = await Promise.all([
        supabase.from("ratings").select("movie_id, rating_value").eq("user_id", userId).in("movie_id", movieIds),
        supabase.from("reviews").select("movie_id, review_text").eq("user_id", userId).in("movie_id", movieIds),
      ]);
      (ratingsRows ?? []).forEach((r: any) => { ratingsMap[r.movie_id] = r.rating_value; });
      (reviewsRows ?? []).forEach((r: any) => { reviewsMap[r.movie_id] = r.review_text; });
    }

    // 3. Combine all data into the final movie objects
    const finalMovies: Movie[] = moviesData.map((movie) => ({
      ...movie,
      is_watched: true, // All movies in this list are watched
      user_rating: ratingsMap[movie.id] ?? null,
      user_review: reviewsMap[movie.id] ?? null,
    }));

    setWatchedMovies(finalMovies);
    setLoading(false);
  };
  
  // Fetch lookups once, then fetch movies
  useEffect(() => {
    if (!userId) return;
    fetchLookups();
    fetchWatchedMovies();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const handleUpdate = () => {
    // When a review is submitted or watched status is toggled, re-fetch all data
    // to ensure the UI is perfectly in sync with the database.
    fetchWatchedMovies();
  };

  // Helper functions to convert ID arrays to object arrays for the MovieCard
  function getGenreObjects(ids: number[] = []) {
    return genres.filter((g) => ids.includes(g.id));
  }
  function getLanguageObjects(ids: string[] = []) {
    return languages.filter((l) => ids.includes(l.id));
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-[400px] w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (!watchedMovies.length) {
    return <p className="text-muted-foreground">You haven't watched any movies yet. Start discovering!</p>;
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {watchedMovies.map((movie) => (
        <MovieCard
          key={movie.id}
          movie={{
            ...movie,
            // Populate the genres and languages arrays for the card to use
            genres: getGenreObjects(movie.genre_ids),
            languages: getLanguageObjects(movie.language_ids),
          }}
          onReviewSubmitted={handleUpdate}
          onWatchedStatusChange={handleUpdate}
        />
      ))}
    </div>
  );
}
