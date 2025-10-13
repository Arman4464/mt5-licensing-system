import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { LogIn, Sparkles } from 'lucide-react'

export default async function SignInPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    redirect('/admin')
  }

  async function signIn(formData: FormData) {
    'use server'

    const email = formData.get('email') as string
    const password = formData.get('password') as string

    const supabase = await createClient()

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      redirect('/auth/signin?error=' + encodeURIComponent('Invalid credentials'))
    }

    redirect('/admin')
  }

  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center p-4">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-neon rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse delay-1000"></div>
      </div>

      <div className="w-full max-w-md relative z-10 page-transition">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-2">
            <div className="text-4xl">📊</div>
            <h1 className="text-3xl font-bold">
              Mark<span className="gradient-text">8</span>Pips
            </h1>
          </Link>
          <p className="text-muted-foreground">Professional MT5 Trading Solutions</p>
        </div>

        {/* Login Card */}
        <Card className="glass-card border-0 shadow-2xl">
          <CardHeader className="text-center space-y-2 pb-4">
            <div className="mx-auto w-12 h-12 rounded-full bg-gradient-neon flex items-center justify-center mb-2">
              <LogIn className="h-6 w-6 text-black" />
            </div>
            <CardTitle className="text-2xl">Welcome Back</CardTitle>
            <CardDescription>Sign in to manage your EA licenses</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={signIn} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email Address
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="mark8pips@example.com"
                  required
                  className="h-11 bg-background/50 border-border/50 focus:border-neon transition-colors"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  Password
                </Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  required
                  className="h-11 bg-background/50 border-border/50 focus:border-neon transition-colors"
                />
              </div>

              <Button 
                type="submit" 
                className="w-full h-11 bg-gradient-neon hover:opacity-90 text-black font-semibold button-shine"
              >
                <LogIn className="h-4 w-4 mr-2" />
                Sign In
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Don&apos;t have an account?{' '}
                <Link href="/auth/signup" className="text-neon hover:underline font-medium">
                  Sign Up
                </Link>
              </p>
            </div>

            <div className="mt-4 text-center">
              <Link href="/auth/forgot-password" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                Forgot your password?
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p className="flex items-center justify-center gap-1">
            <Sparkles className="h-3 w-3 text-neon" />
            Secured with enterprise-grade encryption
          </p>
        </div>
      </div>
    </div>
  )
}
