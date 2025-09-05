"use client"

import { Label } from "@/components/ui/label"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { StarRating } from "@/components/star-rating"
import { useToast } from "@/hooks/use-toast"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

interface ReviewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  movieId: string
  initialRating?: number
  initialReview?: string
  onReviewSubmitted: () => void
}

export function ReviewDialog({
  open,
  onOpenChange,
  movieId,
  initialRating = 0,
  initialReview = "",
  onReviewSubmitted,
}: ReviewDialogProps) {
  const [rating, setRating] = useState(initialRating)
  const [reviewText, setReviewText] = useState(initialReview)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const supabase = getSupabaseBrowserClient()

  const handleSubmitReview = async () => {
    setLoading(true)
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to submit a review.",
        variant: "destructive",
      })
      setLoading(false)
      return
    }

    try {
      // Check if a rating already exists for this user and movie
      const { data: existingRating, error: fetchError } = await supabase
        .from("ratings")
        .select("id")
        .eq("user_id", user.id)
        .eq("movie_id", movieId)
        .single()

      if (fetchError && fetchError.code !== "PGRST116") {
        // PGRST116 means no rows found, which is fine for new ratings
        throw fetchError
      }

      if (existingRating) {
        // Update existing rating
        const { error: updateRatingError } = await supabase
          .from("ratings")
          .update({ rating_value: rating, updated_at: new Date().toISOString() })
          .eq("id", existingRating.id)

        if (updateRatingError) throw updateRatingError
      } else {
        // Insert new rating
        const { error: insertRatingError } = await supabase.from("ratings").insert({
          user_id: user.id,
          movie_id: movieId,
          rating_value: rating,
        })
        if (insertRatingError) throw insertRatingError
      }

      // Handle review text (insert or update)
      if (reviewText.trim()) {
        const { data: existingReview, error: fetchReviewError } = await supabase
          .from("reviews")
          .select("id")
          .eq("user_id", user.id)
          .eq("movie_id", movieId)
          .single()

        if (fetchReviewError && fetchReviewError.code !== "PGRST116") {
          throw fetchReviewError
        }

        if (existingReview) {
          const { error: updateReviewError } = await supabase
            .from("reviews")
            .update({ review_text: reviewText.trim(), updated_at: new Date().toISOString() })
            .eq("id", existingReview.id)
          if (updateReviewError) throw updateReviewError
        } else {
          const { error: insertReviewError } = await supabase.from("reviews").insert({
            user_id: user.id,
            movie_id: movieId,
            review_text: reviewText.trim(),
          })
          if (insertReviewError) throw insertReviewError
        }
      }

      toast({
        title: "Success",
        description: "Your review and rating have been submitted!",
      })
      onReviewSubmitted()
      onOpenChange(false)
    } catch (error: any) {
      console.error("Error submitting review:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to submit review.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-card text-card-foreground border-netflix-dark-light">
        <DialogHeader>
          <DialogTitle className="text-primary">Rate & Review</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Share your thoughts on this movie/TV show.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex items-center gap-4">
            <Label htmlFor="rating" className="text-right">
              Rating
            </Label>
            <StarRating initialRating={rating} onRatingChange={setRating} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="review">Review</Label>
            <Textarea
              id="review"
              placeholder="Write your review here..."
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              className="min-h-[100px] bg-input border-border text-foreground focus-visible:ring-netflix-red"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmitReview} disabled={loading || rating === 0}>
            {loading ? "Submitting..." : "Submit Review"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
