import { requireAdmin } from '@/utils/admin'
import { AdminNav } from '@/components/admin-nav'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export default async function LicenseDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const { user, adminClient } = await requireAdmin()

  const { data: license } = await adminClient
    .from('licenses')
    .select(`
      *,
      users(email, full_name),
      products(name, description, price),
      mt5_accounts(*)
    `)
    .eq('id', params.id)
    .single()

  if (!license) {
    notFound()
  }

  const product = Array.isArray(license.products) ? license.products[0] : license.products
  const userInfo = Array.isArray(license.users) ? license.users[0] : license.users

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNav userEmail={user.email || ''} />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link
            href="/admin/licenses"
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            ← Back to Licenses
          </Link>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">License Details</h1>
        </div>

        <div className="mb-6 rounded-lg bg-white p-6 shadow-sm ring-1 ring-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">License Information</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm text-gray-600">License Key</p>
              <p className="font-mono text-lg font-semibold text-gray-900">{license.license_key}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Status</p>
              <span className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${
                license.status === 'active' 
                  ? 'bg-green-100 text-green-800'
                  : license.status === 'paused'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-red-100 text-red-800'
              }`}>
                {license.status}
              </span>
            </div>
            <div>
              <p className="text-sm text-gray-600">Customer Email</p>
              <p className="text-gray-900">{userInfo?.email}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Customer Name</p>
              <p className="text-gray-900">{userInfo?.full_name || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Product</p>
              <p className="text-gray-900">{product?.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Price Paid</p>
              <p className="text-gray-900">₹{product?.price}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Created At</p>
              <p className="text-gray-900">{new Date(license.created_at).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Expires At</p>
              <p className="text-gray-900">
                {license.expires_at ? new Date(license.expires_at).toLocaleString() : 'Never'}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Connected MT5 Accounts ({license.mt5_accounts?.length || 0})
          </h2>
          
          {license.mt5_accounts && license.mt5_accounts.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                      Account Number
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                      Account Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                      Broker
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                      Server
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                      IP Address
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                      First Seen
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                      Last Used
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {license.mt5_accounts.map((account: any) => (
                    <tr key={account.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-mono text-gray-900">
                        {account.account_number}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {account.account_name || 'N/A'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {account.broker_company || 'N/A'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {account.broker_server || 'N/A'}
                      </td>
                      <td className="px-4 py-3 text-sm font-mono text-gray-900">
                        {account.ip_address || 'N/A'}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {new Date(account.created_at).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {new Date(account.last_used_at).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No MT5 accounts connected yet
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
