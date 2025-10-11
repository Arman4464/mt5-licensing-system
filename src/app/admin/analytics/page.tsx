import { requireAdmin } from '@/utils/admin'
import { AdminNav } from '@/components/admin-nav'
import { Toast } from '@/components/toast'
import { Suspense } from 'react'

export default async function AnalyticsPage() {
  const { user, adminClient } = await requireAdmin()

  // Get comprehensive analytics
  const { data: analytics } = await adminClient
    .from('license_analytics')
    .select('*')

  const { data: recentSessions } = await adminClient
    .from('active_sessions')
    .select(`
      *,
      licenses(license_key, status),
      mt5_accounts(account_number, broker_server)
    `)
    .eq('is_online', true)
    .order('last_heartbeat', { ascending: false })

  //const { data: topProducts } = await adminClient
    //.from('licenses')
    //.select('product_id, products(name), count')
    //.limit(5)

  return (
    <div className="min-h-screen bg-gray-100">
      <AdminNav userEmail={user.email || ''} />
      <Suspense>
        <Toast />
      </Suspense>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Analytics & Insights</h1>
          <p className="mt-2 text-sm text-gray-600">
            Real-time monitoring and detailed analytics for your licensing system.
          </p>
        </div>

        {/* Real-time Active Sessions */}
        <div className="mb-8 rounded-lg bg-white p-6 shadow-sm ring-1 ring-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            🟢 Live Sessions ({recentSessions?.length || 0})
          </h2>
          {recentSessions && recentSessions.length > 0 ? (
            <div className="space-y-3">
              {recentSessions.map((session) => {
                const lastSeen = new Date(session.last_heartbeat)
                const minutesAgo = Math.floor((Date.now() - lastSeen.getTime()) / 60000)
                
                return (
                  <div key={session.id} className="flex items-center justify-between border-l-4 border-green-500 bg-green-50 p-3 rounded">
                    <div>
                      <p className="font-mono text-sm font-semibold text-gray-900">
                        {session.licenses?.license_key}
                      </p>
                      <p className="text-xs text-gray-600">
                        Account: {session.mt5_accounts?.account_number} | 
                        Server: {session.mt5_accounts?.broker_server}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-medium text-green-700">
                        {minutesAgo === 0 ? 'Just now' : `${minutesAgo}m ago`}
                      </p>
                      <p className="text-xs text-gray-500">{session.ip_address}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-center py-8 text-gray-500">No active sessions</p>
          )}
        </div>

        {/* License Analytics Table */}
        <div className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">License Performance</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">License</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Product</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">User</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Accounts</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Validations</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Active Days</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Last Activity</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {analytics && analytics.length > 0 ? (
                  analytics.map((item) => (
                    <tr key={item.license_id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-xs font-mono text-gray-900">{item.license_key}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{item.product_name}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{item.user_email}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className="font-semibold">{item.active_accounts}</span>
                        <span className="text-gray-500">/{item.total_accounts}</span>
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-blue-600">{item.total_validations}</td>
                      <td className="px-4 py-3 text-sm font-medium text-purple-600">{item.active_days}</td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {item.last_activity ? new Date(item.last_activity).toLocaleString() : 'Never'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                          item.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-gray-500">No data available</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  )
}
