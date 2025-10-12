import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Key, Calendar, Activity, Copy, LogOut } from 'lucide-react'

export default async function CustomerDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/signin')
  }

  // Get user's licenses
  const { data: licenses } = await supabase
    .from('licenses')
    .select(`
      *,
      products(name, platform),
      mt5_accounts(count)
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen gradient-bg">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <div className="text-2xl">📊</div>
              <span className="text-xl font-bold">
                Mark<span className="text-[#CFFF04]">8</span>Pips
              </span>
            </Link>

            <div className="flex items-center gap-3">
              <p className="text-sm text-muted-foreground hidden md:block">{user.email}</p>
              <form action="/auth/signout" method="post">
                <Button variant="ghost" size="sm">
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </form>
            </div>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 page-transition">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight mb-2">My Licenses</h1>
          <p className="text-muted-foreground">
            Manage your Expert Advisor licenses
          </p>
        </div>

        {/* Licenses */}
        {licenses && licenses.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2">
            {licenses.map((license) => {
              const product = Array.isArray(license.products) ? license.products[0] : license.products
              const accountsCount = license.mt5_accounts?.[0]?.count || 0
              const daysRemaining = license.expires_at 
                ? Math.ceil((new Date(license.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                : null

              return (
                <Card key={license.id} className="glass-card border-0 shadow-xl hover-lift">
                  <CardHeader>
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <CardTitle className="text-xl">{product?.name}</CardTitle>
                        <CardDescription className="mt-1">
                          {product?.platform} Expert Advisor
                        </CardDescription>
                      </div>
                      <Badge
                        variant={
                          license.status === 'active'
                            ? 'success'
                            : license.status === 'paused'
                            ? 'warning'
                            : 'destructive'
                        }
                      >
                        {license.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">License Key</p>
                        <code className="text-sm font-mono font-semibold">
                          {license.license_key}
                        </code>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigator.clipboard.writeText(license.license_key)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground mb-1 flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Expires
                        </p>
                        <p className="font-medium">
                          {license.expires_at ? new Date(license.expires_at).toLocaleDateString() : 'Never'}
                        </p>
                        {daysRemaining !== null && daysRemaining > 0 && (
                          <p className={`text-xs mt-1 ${daysRemaining <= 7 ? 'text-red-500' : 'text-muted-foreground'}`}>
                            {daysRemaining} days left
                          </p>
                        )}
                      </div>

                      <div>
                        <p className="text-muted-foreground mb-1 flex items-center gap-1">
                          <Activity className="h-3 w-3" />
                          MT5 Accounts
                        </p>
                        <p className="font-medium">
                          {accountsCount} / {product?.max_accounts || 3}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        ) : (
          <Card className="glass-card border-0 shadow-xl">
            <CardContent className="text-center py-16">
              <Key className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No licenses yet</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Purchase an Expert Advisor to get started
              </p>
              <Button asChild className="bg-gradient-neon hover:opacity-90 text-black">
                <Link href="/products">Browse Products</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
