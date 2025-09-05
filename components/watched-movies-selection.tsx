"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"

interface WatchedMoviesSelectionProps {
  userId: string
}

interface Movie {
  id: string
  title: string
  release_year: number
  poster_url: string | null
}

export function WatchedMoviesSelection({ userId }: WatchedMoviesSelectionProps) {
  const [movies, setMovies] = useState<Movie[]>([])
  const [selectedMovies, setSelectedMovies] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const supabase = getSupabaseBrowserClient()
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    let mounted = true
    setLoading(true)
    supabase
      .from("movies_tv_shows")
      .select("id, title, release_year, poster_url")
      .order("title")
      .limit(100)
      .then(({ data, error }) => {
        if (!mounted) return
        if (error) {
          console.error("Error fetching movies:", error)
          toast({
            title: "Error",
            description: "Failed to load movies.",
            variant: "destructive",
          })
        } else {
          setMovies(data || [])
        }
        setLoading(false)
      })
    return () => { mounted = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const filteredMovies = useMemo(() => {
    if (!searchTerm) return movies
    return movies.filter(m =>
      m.title.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [movies, searchTerm])

  const handleCheckboxChange = (movieId: string, isChecked: boolean) => {
    setSelectedMovies(prev =>
      isChecked ? [...prev, movieId] : prev.filter(id => id !== movieId)
    )
  }

  const handleFinishOnboarding = async () => {
    setSaving(true)
    try {
      // 1. Insert selected movies into user_watched_content
      let insertError: any = null
      if (selectedMovies.length > 0) {
        const watchedInserts = selectedMovies.map(movieId => ({
          user_id: userId,
          movie_id: movieId,
          watched_at: new Date().toISOString(),
        }))
        const { error } = await supabase.from("user_watched_content").insert(watchedInserts)
        insertError = error
      }
      if (insertError) throw insertError

      // 2. Mark onboarding as complete for the user
      const { error: updateProfileError } = await supabase
        .from("user_profiles")
        .update({ onboarding_complete: true })
        .eq("user_id", userId)
      if (updateProfileError) throw updateProfileError

      toast({
        title: "Onboarding Complete!",
        description: "Your preferences and watched movies have been saved. Enjoy CineTrack!",
      })
      router.push("/dashboard")
    } catch (err: any) {
      // Show the *real* error, not just {}:
      let msg =
        err?.message ||
        err?.details ||
        err?.hint ||
        (typeof err === "object" ? JSON.stringify(err) : String(err)) ||
        "Failed to complete onboarding."
      console.error("Error finishing onboarding:", err)
      toast({
        title: "Error",
        description: msg,
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="w-full max-w-md space-y-4">
        <Skeleton className="h-10 w-full" />
        <div className="grid grid-cols-2 gap-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="flex items-center space-x-2">
              <Skeleton className="h-4 w-4 rounded-sm" />
              <Skeleton className="h-4 w-24" />
            </div>
          ))}
        </div>
        <Skeleton className="h-10 w-full" />
      </div>
    )
  }

  return (
    <div className="w-full max-w-md space-y-6">
      <Input
        placeholder="Search for movies..."
        value={searchTerm}
        onChange={e => setSearchTerm(e.target.value)}
        className="bg-input border-border text-foreground focus-visible:ring-netflix-red"
      />
      <Card className="bg-card text-card-foreground border-netflix-dark-light">
        <CardContent className="p-4">
          <ScrollArea className="h-60">
            <div className="grid grid-cols-1 gap-4">
              {filteredMovies.length > 0 ? (
                filteredMovies.map(movie => (
                  <div key={movie.id} className="flex items-center space-x-3">
                    <Checkbox
                      id={`movie-${movie.id}`}
                      checked={selectedMovies.includes(movie.id)}
                      onCheckedChange={checked =>
                        handleCheckboxChange(movie.id, checked === true)
                      }
                      className="border-netflix-red data-[state=checked]:bg-netflix-red data-[state=checked]:text-primary-foreground"
                    />
                    {movie.poster_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={movie.poster_url || "/placeholder.svg"}
                        alt={movie.title}
                        className="h-12 w-8 object-cover rounded-sm"
                        onError={e => {
                          e.currentTarget.src = "/placeholder.svg?height=48&width=32"
                        }}
                      />
                    ) : (
                      <div className="h-12 w-8 bg-muted flex items-center justify-center rounded-sm text-xs text-muted-foreground">
                        No Poster
                      </div>
                    )}
                    <Label htmlFor={`movie-${movie.id}`} className="text-foreground text-sm">
                      {movie.title} ({movie.release_year})
                    </Label>
                  </div>
                ))
              ) : (
                <p className="text-center text-muted-foreground">No movies found.</p>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
      <Button
        onClick={handleFinishOnboarding}
        disabled={saving}
        className="w-full bg-primary text-primary-foreground hover:bg-netflix-red-dark"
      >
        {saving ? "Finishing..." : "Finish Onboarding"}
      </Button>
    </div>
  )
}
