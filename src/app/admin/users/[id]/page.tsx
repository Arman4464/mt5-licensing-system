import { requireAdmin } from '@/utils/admin'
import { AdminNav } from '@/components/admin-nav'
import { Toast } from '@/components/toast'
import { Suspense } from 'react'
import { notFound } from 'next/navigation'

export default async function UserDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const { user, adminClient } = await requireAdmin()
  const userId = params.id

  const { data: customer } = await adminClient
    .from('users')
    .select('*')
    .eq('id', userId)
    .single()

  if (!customer) {
    notFound()
  }

  const { data: licenses } = await adminClient
    .from('licenses')
    .select(`
      *,
      products(name, price),
      mt5_accounts(*)
    `)
    .eq('user_id', userId)

  const { data: allMT5Accounts } = await adminClient
    .from('mt5_accounts')
    .select(`
      *,
      licenses(license_key, products(name))
    `)
    .in('license_id', licenses?.map(l => l.id) || [])

  const { data: recentActivity } = await adminClient
    .from('usage_logs')
    .select(`
      *,
      licenses(license_key)
    `)
    .in('license_id', licenses?.map(l => l.id) || [])
    .order('created_at', { ascending: false })
    .limit(20)

  const totalLicenses = licenses?.length || 0
  const activeLicenses = licenses?.filter(l => l.status === 'active').length || 0
  const totalAccounts = allMT5Accounts?.length || 0

  return (
    <div className="min-h-screen bg-gray-100">
      <AdminNav userEmail={user.email || ''} />
      <Suspense>
        <Toast />
      </Suspense>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Customer Header */}
        <div className="mb-8 rounded-lg bg-white p-6 shadow-sm ring-1 ring-gray-200">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{customer.full_name || 'Customer'}</h1>
              <p className="mt-1 text-sm text-gray-600">{customer.email}</p>
              <p className="mt-2 text-xs text-gray-500">
                Customer since {new Date(customer.created_at).toLocaleDateString()}
              </p>
            </div>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-blue-600">{totalLicenses}</p>
                <p className="text-xs text-gray-500">Total Licenses</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">{activeLicenses}</p>
                <p className="text-xs text-gray-500">Active</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-600">{totalAccounts}</p>
                <p className="text-xs text-gray-500">MT5 Accounts</p>
              </div>
            </div>
          </div>
        </div>

        {/* Licenses */}
        <div className="mb-8 rounded-lg bg-white p-6 shadow-sm ring-1 ring-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Licenses</h2>
          <div className="space-y-3">
            {licenses && licenses.length > 0 ? (
              licenses.map((license) => (
                <div key={license.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-mono text-sm font-semibold text-gray-900">{license.license_key}</p>
                      <p className="mt-1 text-sm text-gray-600">{license.products?.name}</p>
                      <p className="mt-1 text-xs text-gray-500">
                        Expires: {license.expires_at ? new Date(license.expires_at).toLocaleDateString() : 'Never'}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        license.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {license.status}
                      </span>
                      <p className="mt-2 text-xs text-gray-500">
                        {license.mt5_accounts?.length || 0} accounts
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center py-4 text-gray-500">No licenses</p>
            )}
          </div>
        </div>

        {/* MT5 Accounts */}
        <div className="mb-8 rounded-lg bg-white p-6 shadow-sm ring-1 ring-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">MT5 Trading Accounts</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Account #</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Broker</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Server</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Terminal</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">IP Address</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Last Active</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {allMT5Accounts && allMT5Accounts.length > 0 ? (
                  allMT5Accounts.map((account) => (
                    <tr key={account.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-mono text-gray-900">{account.account_number}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{account.broker_company || 'N/A'}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{account.broker_server || 'N/A'}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {account.terminal_name || 'N/A'} 
                        {account.terminal_build && ` (${account.terminal_build})`}
                      </td>
                      <td className="px-4 py-3 text-sm font-mono text-gray-600">{account.ip_address || 'N/A'}</td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {account.last_used_at ? new Date(account.last_used_at).toLocaleString() : 'Never'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                          account.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {account.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-gray-500">No MT5 accounts registered</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Activity Log */}
        <div className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
          <div className="space-y-2">
            {recentActivity && recentActivity.length > 0 ? (
              recentActivity.map((log) => (
                <div key={log.id} className="flex items-center justify-between border-b border-gray-100 py-2">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{log.event_type}</p>
                    <p className="text-xs text-gray-500">License: {log.licenses?.license_key}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-600">{log.ip_address || 'N/A'}</p>
                    <p className="text-xs text-gray-500">{new Date(log.created_at).toLocaleString()}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center py-4 text-gray-500">No activity recorded</p>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
