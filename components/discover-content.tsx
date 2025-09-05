"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { XCircle } from "lucide-react"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { MovieCard } from "@/components/movie-card"

interface Movie {
  id: string
  title: string
  overview: string | null
  release_year: number | null
  poster_url: string | null
  type: string
  genre_ids: number[]
  language_ids: string[]
  avg_rating?: number | null
  is_watched?: boolean
  user_rating?: number | null
  user_review?: string | null
}
interface Genre { id: number; name: string }
interface Language { id: string; name: string }

export function DiscoverContent({
  genres,
  languages,
  userId,
}: { genres: Genre[]; languages: Language[]; userId: string }) {
  const supabase = getSupabaseBrowserClient()
  const { toast } = useToast()

  const [searchQuery, setSearchQuery] = useState("")
  const [genreFilter, setGenreFilter] = useState("all")
  const [languageFilter, setLanguageFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")
  const [movies, setMovies] = useState<Movie[]>([])
  const [loading, setLoading] = useState(false)
  const [refresh, setRefresh] = useState(0)

  useEffect(() => {
    let active = true
    setLoading(true)
    supabase.rpc("get_movies_with_avg_ratings", {
      q: searchQuery || null,
      genre: genreFilter !== "all" ? Number(genreFilter) : null,
      language: languageFilter !== "all" ? languageFilter : null,
    }).then(async ({ data, error }) => {
      if (!active) return
      let filtered: Movie[] = Array.isArray(data) ? data : []
      if (typeFilter !== "all") filtered = filtered.filter(m => m.type === typeFilter)

      // --- USER-STATE FETCH (watched/rated/reviewed) ---
      let watchedSet = new Set<string>()
      let ratingsMap: Record<string, number> = {}
      let reviewsMap: Record<string, string> = {}
      const movieIds = filtered.map(m => m.id)
      if (userId && movieIds.length) {
        const [{ data: watchedRows }, { data: ratingsRows }, { data: reviewsRows }] = await Promise.all([
          supabase.from("user_watched_content").select("movie_id").eq("user_id", userId).in("movie_id", movieIds),
          supabase.from("ratings").select("movie_id, rating_value").eq("user_id", userId).in("movie_id", movieIds),
          supabase.from("reviews").select("movie_id, review_text").eq("user_id", userId).in("movie_id", movieIds),
        ])
        watchedSet = new Set((watchedRows ?? []).map((x: any) => x.movie_id))
        ;(ratingsRows ?? []).forEach((r: any) => { ratingsMap[r.movie_id] = r.rating_value })
        ;(reviewsRows ?? []).forEach((r: any) => { reviewsMap[r.movie_id] = r.review_text })
      }

      filtered = filtered.map((m: Movie) => ({
        ...m,
        is_watched: watchedSet.has(m.id),
        user_rating: ratingsMap[m.id] ?? null,
        user_review: reviewsMap[m.id] ?? null,
      }))

      setMovies(filtered)
      if (error) toast({ title: "Error", description: error.message, variant: "destructive" })
      setLoading(false)
    })
    return () => { active = false }
  }, [searchQuery, genreFilter, languageFilter, typeFilter, userId, refresh])

  const handleClearFilters = () => {
    setSearchQuery("")
    setGenreFilter("all")
    setLanguageFilter("all")
    setTypeFilter("all")
  }
  const refetchAll = () => setRefresh(r => r + 1)

  function getGenreObjects(ids: number[]) {
    return Array.isArray(ids) ? genres.filter((g) => ids.includes(g.id)) : []
  }
  function getLanguageObjects(ids: string[]) {
    return Array.isArray(ids) ? languages.filter((l) => ids.includes(l.id)) : []
  }

  return (
    <div className="container mx-auto p-4">
      <form
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8"
        onSubmit={e => e.preventDefault()}
      >
        <div>
          <Input
            id="query"
            name="query"
            placeholder="Search by title…"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
        <div>
          <Select value={genreFilter} onValueChange={setGenreFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Select a genre" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Genres</SelectItem>
              {genres.map((genre) => (
                <SelectItem key={genre.id} value={genre.id.toString()}>{genre.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Select value={languageFilter} onValueChange={setLanguageFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Select a language" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Languages</SelectItem>
              {languages.map((lang) => (
                <SelectItem key={lang.id} value={lang.id}>{lang.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="Movie">Movie</SelectItem>
              <SelectItem value="TV Show">TV Show</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {(searchQuery || genreFilter !== "all" || languageFilter !== "all" || typeFilter !== "all") && (
          <Button variant="outline" onClick={handleClearFilters} className="flex-shrink-0 bg-transparent sm:col-span-4">
            <XCircle className="h-4 w-4 mr-2" /> Clear Filters
          </Button>
        )}
      </form>

      {/* Movies Listing */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="aspect-[2/3] w-full rounded-md bg-muted animate-pulse" />
          ))}
        </div>
      ) : movies.length === 0 ? (
        <div className="text-center text-muted-foreground py-8">
          <p>No content found matching your criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {movies.map((movie) => (
            <MovieCard
              key={movie.id}
              movie={{
                ...movie,
                genres: getGenreObjects(movie.genre_ids ?? []),
                languages: getLanguageObjects(movie.language_ids ?? []),
              }}
              onWatchedStatusChange={refetchAll}
              onReviewSubmitted={refetchAll}
            />
          ))}
        </div>
      )}
    </div>
  )
}
