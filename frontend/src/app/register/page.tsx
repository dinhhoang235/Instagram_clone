"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Instagram } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { useAuth } from "@/components/auth-provider"
import { register, login as loginApi } from "@/lib/services/auth"

export default function RegisterPage() {
  const [email, setEmail] = useState("")
  const [fullName, setFullName] = useState("")
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const router = useRouter()
  const { login } = useAuth()

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Call api
      await register({
        username,
        password,
        email,
        confirm_password: password,
        full_name: fullName,
      })
      
      //auto login after registration
      const token = await loginApi({username_or_email:username, password})

      await login(token)
      router.push("/")
    } catch (error: unknown) {
      console.error("Registration failed:", error)
      
      let message = "Something went wrong."
      
      if (error instanceof Error) {
        message = error.message
      } else if (error && typeof error === 'object' && 'response' in error) {
        const apiError = error as { response?: { data?: { detail?: string } } }
        message = apiError.response?.data?.detail || "Registration failed."
      }
      setErrorMessage(message)
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
            <CardDescription>Sign up to see photos and videos from your friends</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full mb-4" type="button">
              Continue with Facebook
            </Button>

            <div className="relative mb-4">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or</span>
              </div>
            </div>

            <form onSubmit={handleRegister} className="space-y-4">
              {errorMessage && (
                <p className="text-red-500 text-sm text-center">{errorMessage}</p>
              )}  
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Full Name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <div className="text-xs text-muted-foreground text-center">
                <p>
                  People who use our service may have uploaded your contact information to Instagram.{" "}
                  <Link href="#" className="text-blue-600 hover:underline">
                    Learn More
                  </Link>
                </p>
                <p className="mt-2">
                  By signing up, you agree to our{" "}
                  <Link href="#" className="text-blue-600 hover:underline">
                    Terms
                  </Link>
                  ,{" "}
                  <Link href="#" className="text-blue-600 hover:underline">
                    Privacy Policy
                  </Link>{" "}
                  and{" "}
                  <Link href="#" className="text-blue-600 hover:underline">
                    Cookies Policy
                  </Link>
                  .
                </p>
              </div>

              <Button type="submit" className="w-full bg-black text-white text-xs" disabled={isLoading}>
                {isLoading ? "Signing up..." : "Sign up"}
              </Button>
              
            </form>
          </CardContent>
          <CardFooter className="flex justify-center">
            <p className="text-sm text-muted-foreground">
              Have an account?{" "}
              <Link href="/login" className="text-blue-600 hover:underline">
                Log in
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
