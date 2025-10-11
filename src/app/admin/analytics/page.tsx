import { requireAdmin } from '@/utils/admin'
import { AdminNav } from '@/components/admin-nav'
import { Toast } from '@/components/toast'
import { Suspense } from 'react'
import { RevenueChart } from '@/components/charts/revenue-chart'
import { UsageChart } from '@/components/charts/usage-chart'
import { GeoChart } from '@/components/charts/geo-chart'

export default async function AnalyticsPage() {
  const { user, adminClient } = await requireAdmin()

  // Revenue data
  const { data: licenses } = await adminClient
    .from('licenses')
    .select('created_at, products(price)')
    .order('created_at', { ascending: true })

  const revenueByMonth = licenses?.reduce((acc: Record<string, number>, license) => {
    const month = new Date(license.created_at).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short' 
    })
    const product = Array.isArray(license.products) ? license.products[0] : license.products
    const price = product?.price || 0
    acc[month] = (acc[month] || 0) + price
    return acc
  }, {})

  const revenueData = Object.entries(revenueByMonth || {}).map(([month, revenue]) => ({
    month,
    revenue,
  }))

  // Usage data (validations per day)
  const { data: usageLogs } = await adminClient
    .from('usage_logs')
    .select('created_at, event_type')
    .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
    .order('created_at', { ascending: true })

  const usageByDay = usageLogs?.reduce((acc: Record<string, number>, log) => {
    const day = new Date(log.created_at).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    })
    acc[day] = (acc[day] || 0) + 1
    return acc
  }, {})

  const usageData = Object.entries(usageByDay || {}).map(([day, validations]) => ({
    day,
    validations,
  }))

  // Geographic data (IP addresses)
  const { data: accountsWithIP } = await adminClient
    .from('mt5_accounts')
    .select('ip_address')

  const ipCounts = accountsWithIP?.reduce((acc: Record<string, number>, account) => {
    const ip = account.ip_address || 'Unknown'
    const region = ip.startsWith('192') ? 'Local' : 'International'
    acc[region] = (acc[region] || 0) + 1
    return acc
  }, {})

  const geoData = Object.entries(ipCounts || {}).map(([region, count]) => ({
    region,
    count,
  }))

  // Real-time stats
  const { data: recentSessions } = await adminClient
    .from('usage_logs')
    .select('*, licenses(license_key)')
    .gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString())
    .order('created_at', { ascending: false })
    .limit(10)

  const totalRevenue = licenses?.reduce((sum, l) => {
    const product = Array.isArray(l.products) ? l.products[0] : l.products
    return sum + (product?.price || 0)
  }, 0) || 0

  const { count: activeLicenses } = await adminClient
    .from('licenses')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active')

  const { count: totalValidations } = await adminClient
    .from('usage_logs')
    .select('*', { count: 'exact', head: true })

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNav userEmail={user.email || ''} />
      <Suspense>
        <Toast />
      </Suspense>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="mt-2 text-sm text-gray-600">
            Real-time insights and performance metrics
          </p>
        </div>

        {/* KPI Cards */}
        <div className="mb-8 grid gap-6 md:grid-cols-4">
          <div className="rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 p-6 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium opacity-80">Total Revenue</p>
                <p className="mt-2 text-3xl font-bold">₹{totalRevenue.toLocaleString()}</p>
              </div>
              <div className="rounded-full bg-white/20 p-3">
                <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="rounded-lg bg-gradient-to-br from-green-500 to-green-600 p-6 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium opacity-80">Active Licenses</p>
                <p className="mt-2 text-3xl font-bold">{activeLicenses || 0}</p>
              </div>
              <div className="rounded-full bg-white/20 p-3">
                <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 p-6 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium opacity-80">Total Validations</p>
                <p className="mt-2 text-3xl font-bold">{totalValidations?.toLocaleString()}</p>
              </div>
              <div className="rounded-full bg-white/20 p-3">
                <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 p-6 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium opacity-80">Avg. Revenue/License</p>
                <p className="mt-2 text-3xl font-bold">
                  ₹{licenses?.length ? Math.round(totalRevenue / licenses.length) : 0}
                </p>
              </div>
              <div className="rounded-full bg-white/20 p-3">
                <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Revenue Chart */}
          <div className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Over Time</h3>
            <RevenueChart data={revenueData} />
          </div>

          {/* Usage Chart */}
          <div className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">License Validations (Last 30 Days)</h3>
            <UsageChart data={usageData} />
          </div>

          {/* Geographic Distribution */}
          <div className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Geographic Distribution</h3>
            <GeoChart data={geoData} />
          </div>

          {/* Recent Activity */}
          <div className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              🔴 Live Activity (Last Hour)
            </h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {recentSessions && recentSessions.length > 0 ? (
                recentSessions.map((session) => (
                  <div key={session.id} className="flex items-center justify-between border-l-4 border-green-500 bg-green-50 px-3 py-2 rounded">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {session.event_type}
                      </p>
                      <p className="text-xs text-gray-600">
                        {session.licenses?.license_key}
                      </p>
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(session.created_at).toLocaleTimeString()}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-center py-8 text-gray-500">No recent activity</p>
              )}
            </div>
          </div>
        </div>

        {/* Export Section */}
        <div className="mt-8 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Export Reports</h3>
              <p className="mt-1 text-sm opacity-90">Download detailed analytics data</p>
            </div>
            <div className="flex gap-3">
              <a
                href="/admin/export?type=licenses"
                className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-blue-600 hover:bg-gray-100"
              >
                📊 Licenses CSV
              </a>
              <a
                href="/admin/export?type=accounts"
                className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-blue-600 hover:bg-gray-100"
              >
                📈 Accounts CSV
              </a>
              <a
                href="/admin/export?type=logs"
                className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-blue-600 hover:bg-gray-100"
              >
                📋 Logs CSV
              </a>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
