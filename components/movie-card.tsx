"use client";

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ReviewDialog } from "@/components/review-dialog"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { Plus, Check } from "lucide-react"

type MovieCardVariant = "full" | "compact";

interface MovieCardProps {
  movie: {
    id: string
    title: string
    release_year: number
    poster_url: string | null
    overview: string | null
    genres?: { name: string }[]
    languages?: { name: string }[]
    ott_platforms?: { name: string }[]
    user_rating?: number | null
    user_review?: string | null
    is_watched?: boolean
  }
  onWatchedStatusChange?: () => void
  onReviewSubmitted?: () => void
  readOnlyRating?: boolean
  variant?: MovieCardVariant
}

export function MovieCard({
  movie,
  onWatchedStatusChange,
  onReviewSubmitted,
  readOnlyRating = false,
  variant = "full"
}: MovieCardProps) {
  const [isWatched, setIsWatched] = useState(!!movie.is_watched)
  useEffect(() => {
    setIsWatched(!!movie.is_watched)
  }, [movie.is_watched, movie.title])

  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false)
  const [loadingWatchStatus, setLoadingWatchStatus] = useState(false)
  const supabase = getSupabaseBrowserClient()
  const { toast } = useToast()

  const handleToggleWatched = async () => {
    setLoadingWatchStatus(true)
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) {
      toast({
        title: "Error",
        description: error?.message || "You must be logged in to mark content as watched.",
        variant: "destructive",
      })
      setLoadingWatchStatus(false)
      return
    }
    try {
      if (isWatched) {
        // Unwatch
        const { error: delError } = await supabase
          .from("user_watched_content").delete()
          .eq("user_id", user.id)
          .eq("movie_id", movie.id)
        if (delError) throw delError
        setIsWatched(false)
        toast({ title: "Removed from Watched", description: movie.title })
      } else {
        // Watch (upsert for idempotency)
        const { error: upsertError } = await supabase
          .from("user_watched_content").upsert({
            user_id: user.id,
            movie_id: movie.id,
            watched_at: new Date().toISOString(),
          }, { onConflict: ["user_id", "movie_id"] })
        if (upsertError) throw upsertError
        setIsWatched(true)
        toast({ title: "Added to Watched", description: movie.title })
      }
      onWatchedStatusChange?.()
    } catch (err: any) {
      toast({ title: "Error", description: err?.message, variant: "destructive" })
    } finally {
      setLoadingWatchStatus(false)
    }
  }

  // --- COMPACT MODE ---
  if (variant === "compact") {
    return (
      <Card className="flex items-center gap-3 p-2 bg-muted border-none shadow-none rounded-lg min-h-[96px] max-w-full">
        <div className="relative flex-shrink-0 w-14 h-20 bg-muted rounded overflow-hidden">
          {movie.poster_url ? (
            <img
              src={movie.poster_url}
              alt={movie.title}
              className="h-20 w-14 object-cover rounded"
              loading="lazy"
              onError={e => { e.currentTarget.src = "/placeholder.svg?height=128&width=96" }}
            />
          ) : (
            <div className="h-20 w-14 flex items-center justify-center text-muted-foreground text-xs">No Poster</div>
          )}
        </div>
        <div className="flex-1 flex flex-col min-w-0">
          <div className="truncate font-semibold text-base leading-tight">{movie.title}</div>
          <div className="truncate text-xs text-muted-foreground">{movie.release_year}</div>
          <div className="flex gap-1 flex-wrap mt-1">
            {(movie.genres ?? []).slice(0,1).map(g => (
              <Badge key={g.name} variant="secondary" className="text-xs">{g.name}</Badge>
            ))}
            {(movie.languages ?? []).slice(0,1).map(l => (
              <Badge key={l.name} variant="outline" className="text-xs">{l.name}</Badge>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-1 justify-center items-end">
          {!readOnlyRating && (
            <Button
              size="sm"
              variant={isWatched ? "secondary" : "outline"}
              onClick={handleToggleWatched}
              disabled={loadingWatchStatus}
              className="text-xs px-2 py-1"
              type="button"
            >
              {loadingWatchStatus ? "…" : isWatched ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            </Button>
          )}
          {!readOnlyRating && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsReviewDialogOpen(true)}
              className="text-xs px-2 py-1"
              type="button"
            >
              {movie.user_rating || movie.user_review ? "Edit" : "Review"}
            </Button>
          )}
          {!readOnlyRating && (
            <ReviewDialog
              open={isReviewDialogOpen}
              onOpenChange={setIsReviewDialogOpen}
              movieId={movie.id}
              initialRating={movie.user_rating || 0}
              initialReview={movie.user_review || ""}
              onReviewSubmitted={onReviewSubmitted}
            />
          )}
        </div>
      </Card>
    );
  }

  // --- FULL MODE ---
  return (
    <Card className="min-w-[230px] flex flex-col overflow-hidden rounded-lg shadow bg-card h-full">
      <div className="relative w-full aspect-[2/3] bg-muted">
        {movie.poster_url ? (
          <img
            src={movie.poster_url}
            alt={movie.title}
            className="h-full w-full object-cover"
            loading="lazy"
            onError={e => { e.currentTarget.src = "/placeholder.svg?height=192&width=384" }}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground text-xs">No Poster</div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
        <div className="absolute bottom-0 left-0 p-3 w-full">
          <CardTitle className="truncate text-lg font-bold text-primary-foreground drop-shadow-md">
            {movie.title}
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">{movie.release_year}</CardDescription>
        </div>
      </div>
      <CardContent className="flex-1 flex flex-col gap-2 p-3">
        <div className="text-xs text-muted-foreground mb-2 line-clamp-3">{movie.overview}</div>
        <div className="flex flex-wrap gap-1 mb-1">
          {(movie.genres ?? []).map((genre: any) =>
            <Badge key={genre.name} variant="secondary" className="bg-secondary text-secondary-foreground text-xs">{genre.name}</Badge>
          )}
          {(movie.languages ?? []).map((lang: any) =>
            <Badge key={lang.name} variant="outline" className="border-border text-muted-foreground text-xs">{lang.name}</Badge>
          )}
        </div>
      </CardContent>
      {!readOnlyRating && (
        <CardFooter className="
          flex flex-col gap-1 px-3 pb-3 pt-0
          sm:flex-row sm:items-center sm:gap-2
          w-full
        ">
          <Button
            variant={isWatched ? "secondary" : "default"}
            onClick={handleToggleWatched}
            disabled={loadingWatchStatus}
            className="w-full sm:w-auto flex-1 text-xs"
            type="button"
          >
            {loadingWatchStatus ? (
              "Loading..."
            ) : isWatched ? (
              <>
                <Check className="mr-2 h-4 w-4" /> Watched
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" /> Mark as Watched
              </>
            )}
          </Button>
          <Button
            variant="outline"
            onClick={() => setIsReviewDialogOpen(true)}
            className="w-full sm:w-auto flex-1 text-xs"
            type="button"
          >
            {movie.user_rating || movie.user_review ? "Edit Review" : "Add Review"}
          </Button>
        </CardFooter>
      )}
      {!readOnlyRating && (
        <ReviewDialog
          open={isReviewDialogOpen}
          onOpenChange={setIsReviewDialogOpen}
          movieId={movie.id}
          initialRating={movie.user_rating || 0}
          initialReview={movie.user_review || ""}
          onReviewSubmitted={onReviewSubmitted}
        />
      )}
    </Card>
  );
}
