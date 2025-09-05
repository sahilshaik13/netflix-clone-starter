import { redirect } from "next/navigation"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { MultiSelect } from "@/components/ui/multi-select" // Assuming you have or will create this component
import { Button } from "@/components/ui/button"

export default async function PreferencesSettingsPage() {
  const supabase = await getSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/")
  }

  const { data: userProfile, error: profileError } = await supabase
    .from("user_profiles")
    .select("preferred_genres, preferred_languages")
    .eq("user_id", user.id)
    .single()

  const { data: genres, error: genresError } = await supabase.from("genres").select("id, name").order("name")
  const { data: languages, error: languagesError } = await supabase.from("languages").select("id, name").order("name")

  if (profileError) console.error("Error fetching user preferences:", profileError)
  if (genresError) console.error("Error fetching genres:", genresError)
  if (languagesError) console.error("Error fetching languages:", languagesError)

  const availableGenres = genres?.map((g) => ({ label: g.name, value: g.id.toString() })) || []
  const availableLanguages = languages?.map((l) => ({ label: l.name, value: l.id.toString() })) || []

  const defaultSelectedGenres = userProfile?.preferred_genres?.map(String) || []
  const defaultSelectedLanguages = userProfile?.preferred_languages?.map(String) || []

  return (
    <div className="flex flex-1 flex-col p-4 md:p-8">
      <h1 className="mb-6 text-3xl font-bold text-primary">Preferences Settings</h1>
      <Card className="bg-card text-card-foreground border-netflix-dark-light">
        <CardHeader>
          <CardTitle className="text-xl text-primary">Manage Your Preferences</CardTitle>
          <CardDescription className="text-muted-foreground">Customize your content recommendations.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="preferredGenres">Preferred Genres</Label>
            {/* You'll need to implement a MultiSelect component or use a library */}
            {/* For now, this is a placeholder */}
            <MultiSelect
              options={availableGenres}
              defaultValue={defaultSelectedGenres}
              placeholder="Select preferred genres"
              className="bg-input border-border text-foreground focus-visible:ring-netflix-red"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="preferredLanguages">Preferred Languages</Label>
            {/* Placeholder for MultiSelect */}
            <MultiSelect
              options={availableLanguages}
              defaultValue={defaultSelectedLanguages}
              placeholder="Select preferred languages"
              className="bg-input border-border text-foreground focus-visible:ring-netflix-red"
            />
          </div>
          <Button className="bg-primary text-primary-foreground hover:bg-netflix-red-dark">Save Changes</Button>
        </CardContent>
      </Card>
    </div>
  )
}
