import { requireAdmin } from '@/utils/admin'
import { AdminNav } from '@/components/admin-nav'
import { StatsCard } from '@/components/stats-card'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { DollarSign, Key, Users, Activity, TrendingUp, Zap, ArrowUpRight } from 'lucide-react'
import Link from 'next/link'

export default async function AdminDashboard() {
  const { user, adminClient } = await requireAdmin()

  const { count: totalLicenses } = await adminClient
    .from('licenses')
    .select('*', { count: 'exact', head: true })

  const { count: activeLicenses } = await adminClient
    .from('licenses')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active')

  const { count: totalUsers } = await adminClient
    .from('users')
    .select('*', { count: 'exact', head: true })

  const { count: totalValidations } = await adminClient
    .from('usage_logs')
    .select('*', { count: 'exact', head: true })
    .eq('event_type', 'validation')

  const { data: recentLicenses } = await adminClient
    .from('licenses')
    .select(`
      *,
      users(email),
      products(name)
    `)
    .order('created_at', { ascending: false })
    .limit(5)

  const { data: products } = await adminClient.from('products').select('price')
  const totalRevenue = products?.reduce((sum, p) => sum + (p.price || 0), 0) || 0

  return (
    <div className="min-h-screen gradient-bg">
      <AdminNav userEmail={user.email || ''} />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 page-transition">
        {/* Hero Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold tracking-tight mb-2">
            Welcome back, <span className="gradient-text">{user.email?.split('@')[0]}</span>
          </h1>
          <p className="text-muted-foreground text-lg">
            Here&apos;s what&apos;s happening with your business today.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <div className="stat-card glass-card rounded-xl p-6 hover-lift">
            <div className="flex items-center justify-between mb-4">
              <div className="rounded-lg bg-emerald-500/10 p-3">
                <DollarSign className="h-6 w-6 text-emerald-500" />
              </div>
              <Badge variant="success" className="badge-pulse">+12.5%</Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Total Revenue</p>
              <p className="text-3xl font-bold">₹{totalRevenue.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground mt-2">All-time earnings</p>
            </div>
          </div>

          <div className="stat-card glass-card rounded-xl p-6 hover-lift">
            <div className="flex items-center justify-between mb-4">
              <div className="rounded-lg bg-blue-500/10 p-3">
                <Key className="h-6 w-6 text-blue-500" />
              </div>
              <Badge variant="default">Active</Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Active Licenses</p>
              <p className="text-3xl font-bold">{activeLicenses || 0}</p>
              <p className="text-xs text-muted-foreground mt-2">{totalLicenses || 0} total licenses</p>
            </div>
          </div>

          <div className="stat-card glass-card rounded-xl p-6 hover-lift">
            <div className="flex items-center justify-between mb-4">
              <div className="rounded-lg bg-purple-500/10 p-3">
                <Users className="h-6 w-6 text-purple-500" />
              </div>
              <Badge variant="secondary">+5.1%</Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Total Users</p>
              <p className="text-3xl font-bold">{totalUsers || 0}</p>
              <p className="text-xs text-muted-foreground mt-2">Registered customers</p>
            </div>
          </div>

          <div className="stat-card glass-card rounded-xl p-6 hover-lift">
            <div className="flex items-center justify-between mb-4">
              <div className="rounded-lg bg-orange-500/10 p-3">
                <Activity className="h-6 w-6 text-orange-500" />
              </div>
              <Zap className="h-5 w-5 text-orange-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">API Validations</p>
              <p className="text-3xl font-bold">{totalValidations || 0}</p>
              <p className="text-xs text-muted-foreground mt-2">This month</p>
            </div>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Recent Licenses */}
          <Card className="glass-card border-0 hover-lift">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5 text-[#CFFF04]" />
                Recent Licenses
              </CardTitle>
              <CardDescription>Latest activations</CardDescription>
            </CardHeader>
            <CardContent>
              {recentLicenses && recentLicenses.length > 0 ? (
                <div className="space-y-3">
                  {recentLicenses.map((license) => {
                    const userInfo = Array.isArray(license.users) ? license.users[0] : license.users
                    const product = Array.isArray(license.products) ? license.products[0] : license.products
                    
                    return (
                      <Link
                        key={license.id}
                        href={`/admin/licenses/${license.id}`}
                        className="table-row flex items-center justify-between rounded-lg border border-border/50 p-4 group"
                      >
                        <div className="space-y-1">
                          <p className="text-sm font-medium group-hover:text-[#CFFF04] transition-colors">
                            {userInfo?.email}
                          </p>
                          <p className="text-xs text-muted-foreground">{product?.name}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge
                            variant={
                              license.status === 'active'
                                ? 'success'
                                : license.status === 'paused'
                                ? 'warning'
                                : 'destructive'
                            }
                            className="badge-pulse"
                          >
                            {license.status}
                          </Badge>
                          <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-[#CFFF04] transition-colors" />
                        </div>
                      </Link>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Key className="mx-auto h-12 w-12 text-muted-foreground/50 mb-3" />
                  <p className="text-sm text-muted-foreground">No licenses yet</p>
                </div>
              )}
              <Link
                href="/admin/licenses"
                className="block mt-4 text-sm text-[#CFFF04] hover:underline text-center group"
              >
                View all licenses
                <ArrowUpRight className="inline h-3 w-3 ml-1 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
              </Link>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="glass-card border-0 hover-lift">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-[#CFFF04]" />
                Quick Actions
              </CardTitle>
              <CardDescription>Common tasks</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link
                href="/admin/licenses"
                className="table-row flex items-center gap-4 rounded-lg border border-border/50 p-4 group button-shine"
              >
                <div className="rounded-lg bg-blue-500/10 p-3 group-hover:bg-blue-500/20 transition-colors">
                  <Key className="h-6 w-6 text-blue-500" />
                </div>
                <div className="flex-1">
                  <p className="font-medium group-hover:text-[#CFFF04] transition-colors">Generate License</p>
                  <p className="text-xs text-muted-foreground">Create new customer license</p>
                </div>
                <TrendingUp className="h-5 w-5 text-muted-foreground group-hover:text-[#CFFF04] transition-colors" />
              </Link>

              <Link
                href="/admin/products"
                className="table-row flex items-center gap-4 rounded-lg border border-border/50 p-4 group button-shine"
              >
                <div className="rounded-lg bg-purple-500/10 p-3 group-hover:bg-purple-500/20 transition-colors">
                  <Activity className="h-6 w-6 text-purple-500" />
                </div>
                <div className="flex-1">
                  <p className="font-medium group-hover:text-[#CFFF04] transition-colors">Manage Products</p>
                  <p className="text-xs text-muted-foreground">Add or edit EAs</p>
                </div>
                <TrendingUp className="h-5 w-5 text-muted-foreground group-hover:text-[#CFFF04] transition-colors" />
              </Link>

              <Link
                href="/admin/analytics"
                className="table-row flex items-center gap-4 rounded-lg border border-border/50 p-4 group button-shine"
              >
                <div className="rounded-lg bg-emerald-500/10 p-3 group-hover:bg-emerald-500/20 transition-colors">
                  <DollarSign className="h-6 w-6 text-emerald-500" />
                </div>
                <div className="flex-1">
                  <p className="font-medium group-hover:text-[#CFFF04] transition-colors">View Analytics</p>
                  <p className="text-xs text-muted-foreground">Revenue & performance</p>
                </div>
                <TrendingUp className="h-5 w-5 text-muted-foreground group-hover:text-[#CFFF04] transition-colors" />
              </Link>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
