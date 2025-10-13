import { requireAdmin } from '@/utils/admin'
import { AdminLayout } from '@/components/admin-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  Key, 
  Activity,
  Package,
  Globe
} from 'lucide-react'

export default async function AnalyticsPage() {
  const { user, adminClient } = await requireAdmin()

  // Revenue Analytics
  const { data: products } = await adminClient
    .from('products')
    .select('name, price, licenses(count)')

  const totalRevenue = products?.reduce((sum, product) => {
    const licensesCount = product.licenses?.[0]?.count || 0
    return sum + (product.price * licensesCount)
  }, 0) || 0

  // License Status Analytics
  const { count: activeLicenses } = await adminClient
    .from('licenses')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active')

  const { count: pausedLicenses } = await adminClient
    .from('licenses')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'paused')

  const { count: expiredLicenses } = await adminClient
    .from('licenses')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'expired')

  const { count: totalLicenses } = await adminClient
    .from('licenses')
    .select('*', { count: 'exact', head: true })

  // User Analytics
  const { count: totalUsers } = await adminClient
    .from('users')
    .select('*', { count: 'exact', head: true })

  // Get new users this month
  const firstDayOfMonth = new Date()
  firstDayOfMonth.setDate(1)
  firstDayOfMonth.setHours(0, 0, 0, 0)

  const { count: newUsersThisMonth } = await adminClient
    .from('users')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', firstDayOfMonth.toISOString())

  // Validation Analytics
  const { count: totalValidations } = await adminClient
    .from('usage_logs')
    .select('*', { count: 'exact', head: true })
    .eq('event_type', 'validation')

  const { count: validationsThisMonth } = await adminClient
    .from('usage_logs')
    .select('*', { count: 'exact', head: true })
    .eq('event_type', 'validation')
    .gte('created_at', firstDayOfMonth.toISOString())

  // Top Products by Revenue
  const productsWithRevenue = products?.map(product => ({
    name: product.name,
    revenue: product.price * (product.licenses?.[0]?.count || 0),
    licensesCount: product.licenses?.[0]?.count || 0
  })).sort((a, b) => b.revenue - a.revenue) || []

  // Broker Analytics
  const { data: mt5Accounts } = await adminClient
    .from('mt5_accounts')
    .select('broker_company')

  const brokerDistribution = mt5Accounts?.reduce((acc, account) => {
    const broker = account.broker_company || 'Unknown'
    acc[broker] = (acc[broker] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const topBrokers = Object.entries(brokerDistribution || {})
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)

  // Calculate growth rates (mock for now)
  const revenueGrowth = 12.5
  const userGrowth = 8.3
  const licenseGrowth = 15.2

  return (
    <AdminLayout user={user}>
      <div className="page-transition">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight mb-2 gradient-text">Analytics Dashboard</h1>
          <p className="text-muted-foreground">
            Track your business performance and growth metrics.
          </p>
        </div>

        {/* Key Metrics */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card className="glass-card border-0 shadow-xl hover-lift">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="rounded-lg bg-green-500/10 p-3">
                  <DollarSign className="h-6 w-6 text-green-400" />
                </div>
                <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +{revenueGrowth}%
                </Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Revenue</p>
                <p className="text-3xl font-bold text-foreground">₹{totalRevenue.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground mt-2">All-time earnings</p>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border-0 shadow-xl hover-lift">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="rounded-lg bg-blue-500/10 p-3">
                  <Key className="h-6 w-6 text-blue-400" />
                </div>
                <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +{licenseGrowth}%
                </Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Active Licenses</p>
                <p className="text-3xl font-bold text-foreground">{activeLicenses || 0}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  {totalLicenses || 0} total licenses
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border-0 shadow-xl hover-lift">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="rounded-lg bg-purple-500/10 p-3">
                  <Users className="h-6 w-6 text-purple-400" />
                </div>
                <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +{userGrowth}%
                </Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Users</p>
                <p className="text-3xl font-bold text-foreground">{totalUsers || 0}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  +{newUsersThisMonth || 0} this month
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border-0 shadow-xl hover-lift">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="rounded-lg bg-orange-500/10 p-3">
                  <Activity className="h-6 w-6 text-orange-400" />
                </div>
                <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">
                  {validationsThisMonth || 0} this month
                </Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">API Validations</p>
                <p className="text-3xl font-bold text-foreground">{totalValidations || 0}</p>
                <p className="text-xs text-muted-foreground mt-2">All-time requests</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Content Grid */}
        <div className="grid gap-6 lg:grid-cols-2 mb-8">
          {/* License Status Breakdown */}
          <Card className="glass-card border-0 shadow-xl hover-lift">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5 text-neon" />
                License Status
              </CardTitle>
              <CardDescription>Distribution by status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-green-500/20 flex items-center justify-center">
                      <TrendingUp className="h-5 w-5 text-green-400" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Active</p>
                      <p className="text-xs text-muted-foreground">Currently active</p>
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-foreground">{activeLicenses || 0}</p>
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-yellow-500/20 flex items-center justify-center">
                      <Activity className="h-5 w-5 text-yellow-400" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Paused</p>
                      <p className="text-xs text-muted-foreground">Temporarily disabled</p>
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-foreground">{pausedLicenses || 0}</p>
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-red-500/20 flex items-center justify-center">
                      <TrendingDown className="h-5 w-5 text-red-400" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Expired</p>
                      <p className="text-xs text-muted-foreground">Past expiry date</p>
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-foreground">{expiredLicenses || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Top Products by Revenue */}
          <Card className="glass-card border-0 shadow-xl hover-lift">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-neon" />
                Top Products
              </CardTitle>
              <CardDescription>By revenue generated</CardDescription>
            </CardHeader>
            <CardContent>
              {productsWithRevenue.length > 0 ? (
                <div className="space-y-4">
                  {productsWithRevenue.slice(0, 5).map((product, index) => (
                    <div key={product.name} className="flex items-center justify-between p-3 rounded-lg hover:bg-background/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold ${
                          index === 0 ? 'bg-neon text-black' :
                          index === 1 ? 'bg-blue-500/20 text-blue-400' :
                          index === 2 ? 'bg-purple-500/20 text-purple-400' :
                          'bg-muted text-muted-foreground'
                        }`}>
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium text-sm text-foreground">{product.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {product.licensesCount} licenses
                          </p>
                        </div>
                      </div>
                      <p className="font-bold text-neon">
                        ₹{product.revenue.toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="mx-auto h-10 w-10 mb-2 opacity-50" />
                  <p className="text-sm">No products yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Broker Distribution */}
        <Card className="glass-card border-0 shadow-xl hover-lift">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-neon" />
              Top Brokers
            </CardTitle>
            <CardDescription>Most popular brokers among users</CardDescription>
          </CardHeader>
          <CardContent>
            {topBrokers.length > 0 ? (
              <div className="space-y-3">
                {topBrokers.map(([broker, count]) => (
                  <div key={broker} className="flex items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium text-foreground">{broker}</p>
                        <p className="text-sm text-muted-foreground">{count} accounts</p>
                      </div>
                      <div className="h-2 bg-muted/50 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-neon rounded-full transition-all"
                          style={{ 
                            width: `${(count / (mt5Accounts?.length || 1)) * 100}%` 
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Globe className="mx-auto h-10 w-10 mb-2 opacity-50" />
                <p className="text-sm">No broker data yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}
