import { redirect } from "next/navigation"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { ProfileSettingsForm } from "@/components/profile-settings-form"

export default async function ProfileSettingsPage() {
  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/")
  }

  const { data: userProfile, error } = await supabase
    .from("user_profiles")
    .select("username, full_name, avatar_url")
    .eq("user_id", user.id)
    .single()

  // Optionally, show a fallback if error

  return <ProfileSettingsForm user={user} userProfile={userProfile} />
}
