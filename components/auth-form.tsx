"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"

export function AuthForm() {
  const [isSigningUp, setIsSigningUp] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = getSupabaseBrowserClient()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    let error = null
    if (isSigningUp) {
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${location.origin}/auth/callback`,
        },
      })
      error = signUpError
    } else {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      error = signInError
    }

    if (error) {
      toast({
        title: "Authentication Error",
        description: error.message,
        variant: "destructive",
      })
    } else {
      toast({
        title: "Success",
        description: isSigningUp ? "Account created! Check your email for verification." : "Logged in successfully!",
      })
      // Redirect to onboarding or dashboard based on session
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        const { data: userProfile, error: profileError } = await supabase
          .from("user_profiles")
          .select("onboarding_complete")
          .eq("user_id", user.id)
          .single()

        if (profileError && profileError.code !== "PGRST116") {
          // PGRST116 means no rows found
          console.error("Error fetching user profile:", profileError)
          toast({
            title: "Error",
            description: "Failed to fetch user profile.",
            variant: "destructive",
          })
        } else if (userProfile?.onboarding_complete) {
          router.push("/dashboard")
        } else {
          router.push("/onboarding")
        }
      }
    }
    setLoading(false)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">{isSigningUp ? "Create an account" : "Sign In"}</CardTitle>
          <CardDescription>
            {isSigningUp
              ? "Enter your email and password to create an account"
              : "Enter your email and password to sign in"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Loading..." : isSigningUp ? "Sign Up" : "Sign In"}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            {isSigningUp ? "Already have an account?" : "Don't have an account?"}{" "}
            <Button variant="link" onClick={() => setIsSigningUp(!isSigningUp)} className="p-0 h-auto">
              {isSigningUp ? "Sign In" : "Sign Up"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
