import { requireAdmin } from '@/utils/admin'
import { AdminNav } from '@/components/admin-nav'
import { StatsCard } from '@/components/stats-card'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { DollarSign, Key, Users, Activity, TrendingUp, Clock } from 'lucide-react'
import Link from 'next/link'

export default async function AdminDashboard() {
  const { user, adminClient } = await requireAdmin()

  // Get stats
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

  // Get recent licenses
  const { data: recentLicenses } = await adminClient
    .from('licenses')
    .select(`
      *,
      users(email),
      products(name)
    `)
    .order('created_at', { ascending: false })
    .limit(5)

  // Calculate revenue (mock for now)
  const { data: products } = await adminClient.from('products').select('price')
  const totalRevenue = products?.reduce((sum, p) => sum + (p.price || 0), 0) || 0

  return (
    <div className="min-h-screen bg-background">
      <AdminNav userEmail={user.email || ''} />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Welcome back! Here&apos;s what&apos;s happening today.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <StatsCard
            title="Total Revenue"
            value={`₹${totalRevenue.toLocaleString()}`}
            icon={DollarSign}
            trend={{ value: 12.5, isPositive: true }}
            description="All-time earnings"
          />
          <StatsCard
            title="Active Licenses"
            value={activeLicenses || 0}
            icon={Key}
            trend={{ value: 8.2, isPositive: true }}
            description={`${totalLicenses || 0} total licenses`}
          />
          <StatsCard
            title="Total Users"
            value={totalUsers || 0}
            icon={Users}
            trend={{ value: 5.1, isPositive: true }}
            description="Registered customers"
          />
          <StatsCard
            title="Validations"
            value={totalValidations || 0}
            icon={Activity}
            description="API calls this month"
          />
        </div>

        {/* Recent Activity */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Recent Licenses */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Licenses</CardTitle>
              <CardDescription>Latest license activations</CardDescription>
            </CardHeader>
            <CardContent>
              {recentLicenses && recentLicenses.length > 0 ? (
                <div className="space-y-4">
                  {recentLicenses.map((license) => {
                    const userInfo = Array.isArray(license.users) ? license.users[0] : license.users
                    const product = Array.isArray(license.products) ? license.products[0] : license.products
                    
                    return (
                      <div
                        key={license.id}
                        className="flex items-center justify-between rounded-lg border p-3 hover:bg-accent transition-colors"
                      >
                        <div className="space-y-1">
                          <p className="text-sm font-medium">{userInfo?.email}</p>
                          <p className="text-xs text-muted-foreground">{product?.name}</p>
                          <p className="text-xs font-mono text-muted-foreground">
                            {license.license_key}
                          </p>
                        </div>
                        <div className="text-right space-y-1">
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
                          <p className="text-xs text-muted-foreground">
                            {new Date(license.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No licenses yet
                </p>
              )}
              <Link
                href="/admin/licenses"
                className="block mt-4 text-sm text-primary hover:underline text-center"
              >
                View all licenses →
              </Link>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common administrative tasks</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link
                href="/admin/licenses"
                className="flex items-center justify-between rounded-lg border p-4 hover:bg-accent transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-blue-500/10 p-2">
                    <Key className="h-5 w-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="font-medium">Generate License</p>
                    <p className="text-xs text-muted-foreground">Create new customer license</p>
                  </div>
                </div>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </Link>

              <Link
                href="/admin/products"
                className="flex items-center justify-between rounded-lg border p-4 hover:bg-accent transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-purple-500/10 p-2">
                    <Activity className="h-5 w-5 text-purple-500" />
                  </div>
                  <div>
                    <p className="font-medium">Manage Products</p>
                    <p className="text-xs text-muted-foreground">Add or edit EAs</p>
                  </div>
                </div>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </Link>

              <Link
                href="/admin/analytics"
                className="flex items-center justify-between rounded-lg border p-4 hover:bg-accent transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-green-500/10 p-2">
                    <Clock className="h-5 w-5 text-green-500" />
                  </div>
                  <div>
                    <p className="font-medium">View Analytics</p>
                    <p className="text-xs text-muted-foreground">Revenue & performance</p>
                  </div>
                </div>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </Link>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
