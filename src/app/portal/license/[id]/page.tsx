import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'

export default async function LicenseDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const licenseId = params.id

  // Get customer user
  const { data: customerUser } = await supabase
    .from('users')
    .select('id')
    .eq('email', user.email)
    .single()

  if (!customerUser) {
    redirect('/login')
  }

  // Get license (only if it belongs to this user)
  const { data: license } = await supabase
    .from('licenses')
    .select(`
      *,
      products(name, description, max_accounts),
      mt5_accounts(*)
    `)
    .eq('id', licenseId)
    .eq('user_id', customerUser.id)
    .single()

  if (!license) {
    notFound()
  }

  const { data: usageLogs } = await supabase
    .from('usage_logs')
    .select('*')
    .eq('license_id', licenseId)
    .order('created_at', { ascending: false })
    .limit(20)

  const daysRemaining = license.expires_at 
    ? Math.ceil((new Date(license.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/portal" className="text-blue-600 hover:text-blue-700">
            ← Back to Portal
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">{license.products?.name}</h1>
          <p className="mt-2 text-gray-600">{license.products?.description}</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* License Info */}
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">License Information</h3>
              <dl className="space-y-3">
                <div className="flex justify-between">
                  <dt className="text-gray-600">License Key</dt>
                  <dd className="font-mono text-sm text-gray-900">{license.license_key}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-600">Status</dt>
                  <dd>
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      license.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {license.status}
                    </span>
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-600">Expires</dt>
                  <dd className="text-gray-900">
                    {license.expires_at ? new Date(license.expires_at).toLocaleDateString() : 'Never'}
                    {daysRemaining !== null && ` (${daysRemaining} days)`}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-600">MT5 Accounts</dt>
                  <dd className="text-gray-900">
                    {license.mt5_accounts?.length || 0} / {license.products?.max_accounts || 3}
                  </dd>
                </div>
              </dl>
            </div>

            {/* MT5 Accounts */}
            <div className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Connected MT5 Accounts</h3>
              {license.mt5_accounts && license.mt5_accounts.length > 0 ? (
                <div className="space-y-3">
                  {license.mt5_accounts.map((account: { id: string; account_number: number; broker_server: string; last_used_at: string }) => (
                    <div key={account.id} className="rounded-lg border border-gray-200 p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-mono text-sm font-semibold text-gray-900">
                            {account.account_number}
                          </p>
                          <p className="text-sm text-gray-600">{account.broker_server}</p>
                        </div>
                        <div className="text-right text-sm text-gray-500">
                          Last used: {new Date(account.last_used_at).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center py-8 text-gray-500">No MT5 accounts connected yet</p>
              )}
            </div>

            {/* Usage History */}
            <div className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
              {usageLogs && usageLogs.length > 0 ? (
                <div className="space-y-2">
                  {usageLogs.map((log) => (
                    <div key={log.id} className="flex items-center justify-between border-b border-gray-100 py-2">
                      <span className="text-sm text-gray-900">{log.event_type}</span>
                      <span className="text-xs text-gray-500">
                        {new Date(log.created_at).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center py-8 text-gray-500">No activity yet</p>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="rounded-lg bg-blue-50 p-6 border border-blue-200">
              <h4 className="font-semibold text-blue-900 mb-2">Need Help?</h4>
              <p className="text-sm text-blue-700 mb-4">
                Check our documentation or contact support
              </p>
              <div className="space-y-2">
                <Link
                  href="/docs"
                  className="block rounded-md bg-blue-600 px-4 py-2 text-center text-sm font-semibold text-white hover:bg-blue-700"
                >
                  📖 Documentation
                </Link>
                <a
                  href="mailto:support@mark8pips.com"
                  className="block rounded-md bg-white px-4 py-2 text-center text-sm font-semibold text-blue-600 hover:bg-gray-50"
                >
                  📧 Contact Support
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
