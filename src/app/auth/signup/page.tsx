import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { UserPlus, Sparkles } from 'lucide-react'

export default async function SignUpPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    redirect('/admin')
  }

  async function signUp(formData: FormData) {
    'use server'

    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const fullName = formData.get('full_name') as string

    const supabase = await createClient()

    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    })

    if (signUpError) {
      redirect('/auth/signup?error=' + encodeURIComponent(signUpError.message))
    }

    redirect('/auth/signin?success=' + encodeURIComponent('Account created! Please sign in.'))
  }

  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center p-4">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-neon rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse delay-1000"></div>
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

        {/* Signup Card */}
        <Card className="glass-card border-0 shadow-2xl">
          <CardHeader className="text-center space-y-2 pb-4">
            <div className="mx-auto w-12 h-12 rounded-full bg-gradient-neon flex items-center justify-center mb-2">
              <UserPlus className="h-6 w-6 text-black" />
            </div>
            <CardTitle className="text-2xl">Create Account</CardTitle>
            <CardDescription>Get started with Mark8Pips today</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={signUp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="full_name" className="text-sm font-medium">
                  Full Name
                </Label>
                <Input
                  id="full_name"
                  name="full_name"
                  type="text"
                  placeholder="John Doe"
                  required
                  className="h-11 bg-background/50 border-border/50 focus:border-neon transition-colors"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email Address
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="john@example.com"
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
                  minLength={6}
                  className="h-11 bg-background/50 border-border/50 focus:border-neon transition-colors"
                />
                <p className="text-xs text-muted-foreground">
                  Must be at least 6 characters
                </p>
              </div>

              <Button 
                type="submit" 
                className="w-full h-11 bg-gradient-neon hover:opacity-90 text-black font-semibold button-shine"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Create Account
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Already have an account?{' '}
                <Link href="/auth/signin" className="text-neon hover:underline font-medium">
                  Sign In
                </Link>
              </p>
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
