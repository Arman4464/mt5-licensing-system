import { requireAdmin } from '@/utils/admin'
import { AdminLayout } from '@/components/admin-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { DollarSign, Key, Users, Activity, ArrowUpRight, Package, Shield } from 'lucide-react'
import Link from 'next/link'
import { StatsCard } from '@/components/stats-card'

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

  const { data: revenueData } = await adminClient
    .from('licenses')
    .select('price')

  const totalRevenue = revenueData?.reduce((sum, item) => sum + (item.price || 0), 0) || 0

  const { data: recentLicenses } = await adminClient
    .from('licenses')
    .select(`
      id,
      created_at,
      status,
      users(email),
      products(name)
    `)
    .order('created_at', { ascending: false })
    .limit(5)

  const statusVariant: { [key: string]: 'neon' | 'secondary' | 'destructive' | 'warning' } = {
    active: 'neon',
    inactive: 'secondary',
    expired: 'destructive',
    cancelled: 'destructive',
    paused: 'warning',
  }

  return (
    <AdminLayout user={user}>
      <div className="page-transition">
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
          <StatsCard
            title="Total Revenue"
            value={`₹${totalRevenue.toLocaleString()}`}
            icon={DollarSign}
            change="+12.5%"
            description="All-time earnings"
            iconColor="text-emerald-400"
          />
          <StatsCard
            title="Active Licenses"
            value={activeLicenses || 0}
            icon={Key}
            description={`${totalLicenses || 0} total licenses`}
            iconColor="text-blue-400"
          />
          <StatsCard
            title="Total Users"
            value={totalUsers || 0}
            icon={Users}
            change="+5.1%"
            description="Registered customers"
            iconColor="text-purple-400"
          />
          <StatsCard
            title="API Validations"
            value="7,846"
            icon={Activity}
            change="+201"
            description="This month"
            iconColor="text-orange-400"
          />
        </div>

        {/* Content Grid */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Recent Licenses */}
          <Card className="glass-card border-0 shadow-xl hover-lift">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Key className="h-6 w-6 text-neon" />
                Recent Activations
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentLicenses && recentLicenses.length > 0 ? (
                <div className="space-y-2">
                  {recentLicenses.map((license) => {
                    const userInfo = Array.isArray(license.users) ? license.users[0] : license.users
                    const product = Array.isArray(license.products) ? license.products[0] : license.products
                    
                    return (
                      <Link
                        key={license.id}
                        href={`/admin/licenses/${license.id}`}
                        className="flex items-center justify-between rounded-lg p-3 -m-3 hover:bg-background/50 transition-colors group"
                      >
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-foreground group-hover:text-neon transition-colors">
                            {userInfo?.email || 'Unknown User'}
                          </p>
                          <p className="text-xs text-muted-foreground">{product?.name || 'Unknown Product'}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant={statusVariant[license.status] || 'secondary'}>
                            {license.status}
                          </Badge>
                          <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-neon transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                        </div>
                      </Link>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Key className="mx-auto h-12 w-12 text-neon/50 mb-3" />
                  <h3 className="text-lg font-semibold text-foreground mb-1">No Licenses Yet</h3>
                  <p className="text-sm">New licenses will appear here as they are created.</p>
                </div>
              )}
              <Link
                href="/admin/licenses"
                className="block mt-4 text-sm text-neon hover:underline text-center group"
              >
                View all licenses
                <ArrowUpRight className="inline h-3 w-3 ml-1 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
              </Link>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="glass-card border-0 shadow-xl hover-lift">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Key className="h-6 w-6 text-neon" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Link href="/admin/licenses" className="quick-action-card">
                <Key className="h-6 w-6 text-blue-400 mb-2" />
                <p className="font-semibold text-foreground">Manage Licenses</p>
                <p className="text-xs text-muted-foreground">View, create, or edit</p>
              </Link>
              <Link href="/admin/products" className="quick-action-card">
                <Package className="h-6 w-6 text-purple-400 mb-2" />
                <p className="font-semibold text-foreground">Manage Products</p>
                <p className="text-xs text-muted-foreground">Add or edit EAs</p>
              </Link>
              <Link href="/admin/analytics" className="quick-action-card">
                <DollarSign className="h-6 w-6 text-emerald-400 mb-2" />
                <p className="font-semibold text-foreground">View Analytics</p>
                <p className="text-xs text-muted-foreground">Revenue & usage</p>
              </Link>
              <Link href="/admin/security" className="quick-action-card">
                <Shield className="h-6 w-6 text-orange-400 mb-2" />
                <p className="font-semibold text-foreground">Security</p>
                <p className="text-xs text-muted-foreground">Monitor activity</p>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  )
}
