"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Skeleton } from "@/components/ui/skeleton"

interface LanguageSelectionProps {
  userId: string
}

export function LanguageSelection({ userId }: LanguageSelectionProps) {
  const [languages, setLanguages] = useState<{ id: number; name: string }[]>([])
  const [selectedLanguages, setSelectedLanguages] = useState<number[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const router = useRouter()
  const supabase = getSupabaseBrowserClient()
  const { toast } = useToast()

  useEffect(() => {
    const fetchLanguages = async () => {
      setLoading(true)
      const { data, error } = await supabase.from("languages").select("id, name").order("name")
      if (error) {
        console.error("Error fetching languages:", error)
        toast({
          title: "Error",
          description: "Failed to load languages.",
          variant: "destructive",
        })
      } else {
        setLanguages(data || [])
      }
      setLoading(false)
    }
    fetchLanguages()
  }, [supabase, toast])

  const handleCheckboxChange = (languageId: number, isChecked: boolean) => {
    setSelectedLanguages((prev) => (isChecked ? [...prev, languageId] : prev.filter((id) => id !== languageId)))
  }

  const handleNext = async () => {
    setSaving(true)
    try {
      // Update user_profiles with preferred languages
      const { error: updateError } = await supabase
        .from("user_profiles")
        .update({ preferred_languages: selectedLanguages })
        .eq("user_id", userId)

      if (updateError) throw updateError

      toast({
        title: "Languages Saved",
        description: "Your preferred languages have been saved.",
      })
      router.push("/onboarding/genres") // Move to the next step
    } catch (error: any) {
      console.error("Error saving languages:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to save languages.",
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
        {languages.map((language) => (
          <div key={language.id} className="flex items-center space-x-2">
            <Checkbox
              id={`lang-${language.id}`}
              checked={selectedLanguages.includes(language.id)}
              onCheckedChange={(checked) => handleCheckboxChange(language.id, checked === true)}
              className="border-netflix-red data-[state=checked]:bg-netflix-red data-[state=checked]:text-primary-foreground"
            />
            <Label htmlFor={`lang-${language.id}`} className="text-foreground">
              {language.name}
            </Label>
          </div>
        ))}
      </div>
      <Button
        onClick={handleNext}
        disabled={selectedLanguages.length === 0 || saving}
        className="w-full bg-primary text-primary-foreground hover:bg-netflix-red-dark"
      >
        {saving ? "Saving..." : "Next"}
      </Button>
    </div>
  )
}
