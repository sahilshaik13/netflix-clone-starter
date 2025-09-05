"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"

export function ProfileSettingsForm({ user, userProfile }: { user: any, userProfile: any }) {
  const supabase = getSupabaseBrowserClient()
  const { toast } = useToast()

  const [username, setUsername] = useState(userProfile?.username || "")
  const [fullName, setFullName] = useState(userProfile?.full_name || "")
  const [avatarUrl, setAvatarUrl] = useState(userProfile?.avatar_url || "")
  const [loading, setLoading] = useState(false)

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase
      .from("user_profiles")
      .update({ username, full_name: fullName, avatar_url: avatarUrl })
      .eq("user_id", user.id)
    setLoading(false)
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" })
    } else {
      toast({ title: "Profile updated!", description: "Profile info saved.", variant: "success" })
    }
  }

  return (
    <div className="flex flex-1 flex-col p-4 md:p-8">
      <h1 className="mb-6 text-3xl font-bold text-primary">Profile Settings</h1>
      <Card className="bg-card text-card-foreground border-netflix-dark-light">
        <CardHeader>
          <CardTitle className="text-xl text-primary">Manage Your Profile</CardTitle>
          <CardDescription className="text-muted-foreground">Update your personal information.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSave}>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={user.email}
                disabled
                className="bg-input border-border text-foreground"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="bg-input border-border text-foreground focus-visible:ring-netflix-red"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                className="bg-input border-border text-foreground focus-visible:ring-netflix-red"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="avatarUrl">Avatar URL</Label>
              <Input
                id="avatarUrl"
                value={avatarUrl}
                onChange={e => setAvatarUrl(e.target.value)}
                className="bg-input border-border text-foreground focus-visible:ring-netflix-red"
              />
            </div>
            <Button type="submit" className="bg-primary text-primary-foreground hover:bg-netflix-red-dark" disabled={loading}>
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
