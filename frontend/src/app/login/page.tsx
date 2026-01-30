"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Instagram, Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { useAuth } from "@/components/auth-provider"
import { login  as loginApi } from "@/lib/services/auth"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [usernameError, setUsernameError] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const router = useRouter()
  const { login } = useAuth()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setUsernameError(null)
    setPasswordError(null)
    try {
      const token = await loginApi({
        username_or_email:email,
        password
      })
      await login({
        access: token.access,
        refresh: token.refresh,
      })
      router.push("/")
    } catch (error: unknown) {
      console.error("Login failed:", error)
      let message = "Login failed."
      if (error && typeof error === 'object' && 'response' in error) {
        const apiError = error as { response?: { data?: unknown } }
        const data = apiError.response?.data as Record<string, unknown> | undefined

        const firstMsg = (v: unknown): string | null => {
          if (v == null) return null
          if (Array.isArray(v)) return String(v[0])
          if (typeof v === 'string') return v
          return String(v)
        }

        if (data) {
          const usernameVal = (data['username_or_email'] ?? data['username'] ?? data['email']) as unknown
          const passwordVal = data['password'] as unknown
          const nonField = data['non_field_errors'] as unknown
          const detail = data['detail'] as unknown

          const u = firstMsg(usernameVal) || "No user found with this username or email."
          const p = firstMsg(passwordVal) || "Invalid password."

          if (usernameVal) {
            setUsernameError(u)
          }
          if (passwordVal) {
            setPasswordError(p)
          }

          if (nonField) {
            message = firstMsg(nonField) || message
            setError(message)
          }

          if (!usernameVal && !passwordVal && !nonField && detail) {
            message = firstMsg(detail) || message
            setError(message)
          }
        } else {
          setError(message)
        }
      } else if (error instanceof Error) {
        message = error.message
        setError(message)
      }
    } finally {
      setIsLoading(false)
    }

  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <Card className="border-none shadow-lg">
          <CardHeader className="space-y-4 items-center text-center">
            <Instagram className="w-12 h-12" />
            <CardTitle className="text-2xl">Instagram</CardTitle>
            <CardDescription>Sign in to your account to continue</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email or username</Label>
                <Input
                  id="email"
                  type="text"
                  placeholder="Email or username"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setUsernameError(null); }}
                  required
                />
                {usernameError && (
                  <p className="mt-2 text-sm text-red-600" role="alert">{usernameError}</p>
                )}
              </div>
              <div className="space-y-2">
                <div className="flex items-center">
                  <Label htmlFor="password">Password</Label>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setPasswordError(null); }}
                    className="pr-10"
                    required
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    onClick={() => setShowPassword((s) => !s)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <div className="flex justify-end mt-2">
                  <Link href="/forgot-password" className="text-xs text-blue-600 hover:underline">
                    Forgot password?
                  </Link>
                </div>
                {passwordError && (
                  <p className="mt-2 text-sm text-red-600" role="alert">
                    {passwordError}
                  </p>
                )}
              </div>
              <Button type="submit" className="w-full bg-black text-white text-xs" disabled={isLoading}>
                {isLoading ? "Signing in..." : "Sign in"}
              </Button>
              {error && (
                <p className="mt-3 text-sm text-red-600 text-center" role="alert">{error}</p>
              )}
            </form>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <Separator className="w-full" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
                </div>
              </div>

              <div className="mt-4">
                <Button variant="outline" className="w-full" type="button">
                  Continue with Facebook
                </Button>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-center">
            <p className="text-sm text-muted-foreground">
              Don&apos;t have an account?{" "}
              <Link href="/register" className="text-blue-600 hover:underline">
                Sign up
              </Link>
            </p>
          </CardFooter>
        </Card>

        <div className="text-center text-sm text-muted-foreground">
          <p>Get the app.</p>
          <div className="flex justify-center space-x-4 mt-4">
            <div className="h-10 w-32 bg-black rounded-md flex items-center justify-center text-white text-xs">
              App Store
            </div>
            <div className="h-10 w-32 bg-black rounded-md flex items-center justify-center text-white text-xs">
              Google Play
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
