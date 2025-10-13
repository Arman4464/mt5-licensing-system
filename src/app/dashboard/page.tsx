import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CopyLicenseButton } from '@/components/copy-license-button'
import { Key, Calendar, Activity, LogOut, ShoppingCart } from 'lucide-react'

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
      products(name, platform, max_accounts),
      mt5_accounts(count)
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen gradient-bg">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <div className="text-3xl">📊</div>
              <span className="text-xl font-bold">
                Mark<span className="gradient-text">8</span>Pips
              </span>
            </Link>

            <div className="flex items-center gap-3">
              <p className="text-sm text-muted-foreground hidden md:block">{user.email}</p>
              <form action="/auth/signout" method="post">
                <Button variant="ghost" size="sm" className="hover:bg-background/50 hover:text-neon">
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
          <h1 className="text-4xl font-bold tracking-tight mb-2 gradient-text">My Licenses</h1>
          <p className="text-muted-foreground">
            Manage your Expert Advisor licenses and MT5 accounts.
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

              const statusVariantMap: { [key: string]: string } = {
                active: 'bg-green-500/20 text-green-400 border-green-500/30',
                paused: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
                expired: 'bg-red-500/20 text-red-400 border-red-500/30',
                cancelled: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
              };
              const statusVariant = statusVariantMap[license.status] || statusVariantMap['cancelled'];


              return (
                <Card key={license.id} className="glass-card border-0 shadow-xl hover-lift">
                  <CardHeader>
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <CardTitle className="text-xl text-foreground">{product?.name}</CardTitle>
                        <CardDescription className="mt-1">
                          {product?.platform} Expert Advisor
                        </CardDescription>
                      </div>
                      <Badge
                        className={`border ${statusVariant}`}
                      >
                        {license.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-background/50 border border-border/50">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">License Key</p>
                        <code className="text-sm font-mono font-semibold text-neon">
                          {license.license_key}
                        </code>
                      </div>
                      <CopyLicenseButton licenseKey={license.license_key} />
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground mb-1 flex items-center gap-1.5">
                          <Calendar className="h-4 w-4 text-neon" />
                          Expires
                        </p>
                        <p className="font-medium text-foreground">
                          {license.expires_at ? new Date(license.expires_at).toLocaleDateString() : 'Never'}
                        </p>
                        {daysRemaining !== null && daysRemaining > 0 && (
                          <p className={`text-xs mt-1 ${daysRemaining <= 7 ? 'text-red-400' : 'text-muted-foreground'}`}>
                            {daysRemaining} days left
                          </p>
                        )}
                      </div>

                      <div>
                        <p className="text-muted-foreground mb-1 flex items-center gap-1.5">
                          <Activity className="h-4 w-4 text-neon" />
                          MT5 Accounts
                        </p>
                        <p className="font-medium text-foreground">
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
              <Key className="mx-auto h-12 w-12 text-neon/50 mb-4" />
              <h3 className="text-xl font-semibold mb-2 text-foreground">No licenses yet</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Your purchased licenses will appear here.
              </p>
              <Button asChild className="bg-gradient-neon h-11 text-black font-bold button-shine">
                <Link href="/">
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Browse Products
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
