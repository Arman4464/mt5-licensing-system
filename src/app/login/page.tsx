import { login } from './actions'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { LogIn, Sparkles } from 'lucide-react'

export default function LoginPage({
  searchParams,
}: {
  searchParams: { message: string }
}) {
  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center p-4">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#CFFF04] rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse"></div>
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
          <p className="text-muted-foreground">Admin & Staff Access</p>
        </div>

        {/* Login Card */}
        <Card className="glass-card border-0 shadow-2xl">
          <CardHeader className="text-center space-y-2 pb-4">
            <div className="mx-auto w-12 h-12 rounded-full bg-gradient-neon flex items-center justify-center mb-2">
              <LogIn className="h-6 w-6 text-black" />
            </div>
            <CardTitle className="text-2xl">Admin Portal</CardTitle>
            <CardDescription>Sign in to access the dashboard</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={login} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email Address
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="admin@example.com"
                  required
                  className="h-11 bg-background/50 border-border/50 focus:border-[#CFFF04] transition-colors"
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
                  className="h-11 bg-background/50 border-border/50 focus:border-[#CFFF04] transition-colors"
                />
              </div>

              {searchParams?.message && (
                <div className="text-sm text-center text-red-400 bg-red-500/10 p-3 rounded-md border border-red-500/20">
                  {searchParams.message}
                </div>
              )}

              <Button 
                type="submit" 
                className="w-full h-11 bg-gradient-neon hover:opacity-90 text-black font-semibold button-shine"
              >
                <LogIn className="h-4 w-4 mr-2" />
                Sign In
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p className="flex items-center justify-center gap-1">
            <Sparkles className="h-3 w-3 text-[#CFFF04]" />
            Secured with enterprise-grade encryption
          </p>
        </div>
      </div>
    </div>
  )
}
