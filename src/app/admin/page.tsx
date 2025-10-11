import { requireAdmin } from '@/utils/admin'
import { AdminNav } from '@/components/admin-nav'
import { Toast } from '@/components/toast'
import { Suspense } from 'react'

export default async function AdminPage() {
  const { user, supabase } = await requireAdmin()

  const { count: licensesCount } = await supabase
    .from('licenses')
    .select('*', { count: 'exact', head: true })

  const { count: accountsCount } = await supabase
    .from('mt5_accounts')
    .select('*', { count: 'exact', head: true })

  const { count: productsCount } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })

  const { data: recentLogs } = await supabase
    .from('usage_logs')
    .select('*, licenses(license_key)')
    .order('created_at', { ascending: false })
    .limit(10)

  return (
    <div className="min-h-screen bg-gray-100">
      <AdminNav userEmail={user.email || ''} />
      <Suspense>
        <Toast />
      </Suspense>
      
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="mt-2 text-sm text-gray-600">
            Welcome back! Here&apos;s an overview of your licensing system.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-gray-200">
            <h3 className="text-sm font-medium text-gray-500">Total Licenses</h3>
            <p className="mt-2 text-3xl font-bold text-blue-600">{licensesCount || 0}</p>
            <p className="mt-1 text-xs text-gray-500">Active license keys</p>
          </div>

          <div className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-gray-200">
            <h3 className="text-sm font-medium text-gray-500">MT5 Accounts</h3>
            <p className="mt-2 text-3xl font-bold text-green-600">{accountsCount || 0}</p>
            <p className="mt-1 text-xs text-gray-500">Connected trading accounts</p>
          </div>

          <div className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-gray-200">
            <h3 className="text-sm font-medium text-gray-500">Products</h3>
            <p className="mt-2 text-3xl font-bold text-purple-600">{productsCount || 0}</p>
            <p className="mt-1 text-xs text-gray-500">Available EA products</p>
          </div>
        </div>

        <div className="mt-8 rounded-lg bg-white p-6 shadow-sm ring-1 ring-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
          <div className="overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    License Key
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Event
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    IP Address
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Time
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {recentLogs && recentLogs.length > 0 ? (
                  recentLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="whitespace-nowrap px-6 py-4 text-sm font-mono text-gray-900">
                        {log.licenses?.license_key || 'N/A'}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                        <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                          {log.event_type}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                        {log.ip_address || 'N/A'}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-sm text-gray-500">
                      No activity yet. Create products and licenses to get started!
                    </td>
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
