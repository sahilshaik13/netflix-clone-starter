import { Suspense } from "react"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { DiscoverContent } from "@/components/discover-content"

export default async function DiscoverPage() {
  const supabase = await getSupabaseServerClient()

  // User fetch
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Genre/lang fetch
  const { data: genres, error: genresError } = await supabase
    .from("genres")
    .select("id, name")
    .order("name")
  const { data: languages, error: languagesError } = await supabase
    .from("languages")
    .select("id, name")
    .order("name")

  if (genresError) console.error("Error fetching genres:", genresError)
  if (languagesError) console.error("Error fetching languages:", languagesError)

  return (
    <div className="flex flex-1 flex-col p-4 md:p-8">
      <h1 className="mb-6 text-3xl font-bold text-primary">Discover Movies & TV Shows</h1>
      <Suspense fallback={<div>Loading content...</div>}>
        <DiscoverContent
          genres={Array.isArray(genres) ? genres : []}
          languages={Array.isArray(languages) ? languages : []}
          userId={user?.id || ""}
        />
      </Suspense>
    </div>
  )
}
