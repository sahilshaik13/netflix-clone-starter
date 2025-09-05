"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Skeleton } from "@/components/ui/skeleton"

interface GenreSelectionProps {
  userId: string
}

export function GenreSelection({ userId }: GenreSelectionProps) {
  const [genres, setGenres] = useState<{ id: number; name: string }[]>([])
  const [selectedGenres, setSelectedGenres] = useState<number[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const router = useRouter()
  const supabase = getSupabaseBrowserClient()
  const { toast } = useToast()

  useEffect(() => {
    const fetchGenres = async () => {
      setLoading(true)
      const { data, error } = await supabase.from("genres").select("id, name").order("name")
      if (error) {
        console.error("Error fetching genres:", error)
        toast({
          title: "Error",
          description: "Failed to load genres.",
          variant: "destructive",
        })
      } else {
        setGenres(data || [])
      }
      setLoading(false)
    }
    fetchGenres()
  }, [supabase, toast])

  const handleCheckboxChange = (genreId: number, isChecked: boolean) => {
    setSelectedGenres((prev) => (isChecked ? [...prev, genreId] : prev.filter((id) => id !== genreId)))
  }

  const handleNext = async () => {
    setSaving(true)
    try {
      // Update user_profiles with preferred genres
      const { error: updateError } = await supabase
        .from("user_profiles")
        .update({ preferred_genres: selectedGenres })
        .eq("user_id", userId)

      if (updateError) throw updateError

      toast({
        title: "Genres Saved",
        description: "Your preferred genres have been saved.",
      })
      router.push("/onboarding/watched-movies") // Move to the next step
    } catch (error: any) {
      console.error("Error saving genres:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to save genres.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-4">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="flex items-center space-x-2">
            <Skeleton className="h-4 w-4 rounded-sm" />
            <Skeleton className="h-4 w-24" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 max-h-60 overflow-y-auto pr-2">
        {genres.map((genre) => (
          <div key={genre.id} className="flex items-center space-x-2">
            <Checkbox
              id={`genre-${genre.id}`}
              checked={selectedGenres.includes(genre.id)}
              onCheckedChange={(checked) => handleCheckboxChange(genre.id, checked === true)}
              className="border-netflix-red data-[state=checked]:bg-netflix-red data-[state=checked]:text-primary-foreground"
            />
            <Label htmlFor={`genre-${genre.id}`} className="text-foreground">
              {genre.name}
            </Label>
          </div>
        ))}
      </div>
      <Button
        onClick={handleNext}
        disabled={selectedGenres.length === 0 || saving}
        className="w-full bg-primary text-primary-foreground hover:bg-netflix-red-dark"
      >
        {saving ? "Saving..." : "Next"}
      </Button>
    </div>
  )
}
