import { requireAdmin } from '@/utils/admin'
import { AdminNav } from '@/components/admin-nav'
import { Toast } from '@/components/toast'
import { Suspense } from 'react'
import { notFound, redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

async function extendLicense(formData: FormData) {
  'use server'
  
  const { adminClient } = await requireAdmin()
  const licenseId = formData.get('license_id') as string
  const days = parseInt(formData.get('days') as string)

  const { data: license } = await adminClient
    .from('licenses')
    .select('expires_at')
    .eq('id', licenseId)
    .single()

  if (!license) {
    redirect('/admin/licenses?error=License not found')
  }

  const currentExpiry = license.expires_at ? new Date(license.expires_at) : new Date()
  const newExpiry = new Date(currentExpiry)
  newExpiry.setDate(newExpiry.getDate() + days)

  await adminClient
    .from('licenses')
    .update({ 
      expires_at: newExpiry.toISOString(),
      status: 'active'
    })
    .eq('id', licenseId)

  revalidatePath(`/admin/licenses/${licenseId}`)
  redirect(`/admin/licenses/${licenseId}?success=License extended by ${days} days`)
}

async function pauseLicense(formData: FormData) {
  'use server'
  
  const { adminClient } = await requireAdmin()
  const licenseId = formData.get('license_id') as string

  await adminClient
    .from('licenses')
    .update({ status: 'suspended' })
    .eq('id', licenseId)

  revalidatePath(`/admin/licenses/${licenseId}`)
  redirect(`/admin/licenses/${licenseId}?success=License paused`)
}

async function resumeLicense(formData: FormData) {
  'use server'
  
  const { adminClient } = await requireAdmin()
  const licenseId = formData.get('license_id') as string

  await adminClient
    .from('licenses')
    .update({ status: 'active' })
    .eq('id', licenseId)

  revalidatePath(`/admin/licenses/${licenseId}`)
  redirect(`/admin/licenses/${licenseId}?success=License resumed`)
}

async function deactivateAccount(formData: FormData) {
  'use server'
  
  const { adminClient } = await requireAdmin()
  const accountId = formData.get('account_id') as string
  const licenseId = formData.get('license_id') as string

  await adminClient
    .from('mt5_accounts')
    .delete()
    .eq('id', accountId)

  revalidatePath(`/admin/licenses/${licenseId}`)
  redirect(`/admin/licenses/${licenseId}?success=MT5 account removed`)
}

async function updateNotes(formData: FormData) {
  'use server'
  
  const { adminClient } = await requireAdmin()
  const licenseId = formData.get('license_id') as string
  const notes = formData.get('notes') as string

  await adminClient
    .from('licenses')
    .update({ notes })
    .eq('id', licenseId)

  revalidatePath(`/admin/licenses/${licenseId}`)
  redirect(`/admin/licenses/${licenseId}?success=Notes updated`)
}

export default async function LicenseDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const { user, adminClient } = await requireAdmin()
  const licenseId = params.id

  const { data: license } = await adminClient
    .from('licenses')
    .select(`
      *,
      products(*),
      users(*)
    `)
    .eq('id', licenseId)
    .single()

  if (!license) {
    notFound()
  }

  const { data: mt5Accounts } = await adminClient
    .from('mt5_accounts')
    .select('*')
    .eq('license_id', licenseId)
    .order('last_used_at', { ascending: false })

  const { data: usageLogs } = await adminClient
    .from('usage_logs')
    .select('*')
    .eq('license_id', licenseId)
    .order('created_at', { ascending: false })
    .limit(50)

  const daysRemaining = license.expires_at 
    ? Math.ceil((new Date(license.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null

  const isExpired = daysRemaining !== null && daysRemaining < 0
  const isExpiringSoon = daysRemaining !== null && daysRemaining <= 7 && daysRemaining > 0

  return (
    <div className="min-h-screen bg-gray-100">
      <AdminNav userEmail={user.email || ''} />
      <Suspense>
        <Toast />
      </Suspense>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 rounded-lg bg-white p-6 shadow-sm ring-1 ring-gray-200">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold font-mono text-gray-900">{license.license_key}</h1>
              <p className="mt-2 text-sm text-gray-600">Product: {license.products?.name}</p>
              <p className="text-sm text-gray-600">Customer: {license.users?.email}</p>
            </div>
            <div className="text-right">
              <span className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${
                license.status === 'active' 
                  ? 'bg-green-100 text-green-800' 
                  : license.status === 'suspended'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-red-100 text-red-800'
              }`}>
                {license.status.toUpperCase()}
              </span>
              {daysRemaining !== null && (
                <p className={`mt-2 text-sm font-medium ${
                  isExpired ? 'text-red-600' : isExpiringSoon ? 'text-yellow-600' : 'text-gray-600'
                }`}>
                  {isExpired 
                    ? `Expired ${Math.abs(daysRemaining)} days ago` 
                    : `${daysRemaining} days remaining`
                  }
                </p>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-6 flex flex-wrap gap-3">
            {license.status === 'active' ? (
              <form action={pauseLicense}>
                <input type="hidden" name="license_id" value={licenseId} />
                <button
                  type="submit"
                  className="rounded-md bg-yellow-600 px-4 py-2 text-sm font-semibold text-white hover:bg-yellow-700"
                >
                  ⏸️ Pause License
                </button>
              </form>
            ) : license.status === 'suspended' ? (
              <form action={resumeLicense}>
                <input type="hidden" name="license_id" value={licenseId} />
                <button
                  type="submit"
                  className="rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
                >
                  ▶️ Resume License
                </button>
              </form>
            ) : null}
            
            <button
              onClick={() => document.getElementById('extend-modal')?.classList.remove('hidden')}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              🔄 Extend License
            </button>
            
            <button
              onClick={() => document.getElementById('notes-modal')?.classList.remove('hidden')}
              className="rounded-md bg-gray-600 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-700"
            >
              📝 Edit Notes
            </button>
          </div>
        </div>

        {/* Notes */}
        {license.notes && (
          <div className="mb-8 rounded-lg bg-blue-50 border border-blue-200 p-4">
            <h3 className="text-sm font-semibold text-blue-900">Admin Notes:</h3>
            <p className="mt-1 text-sm text-blue-700">{license.notes}</p>
          </div>
        )}

        {/* MT5 Accounts */}
        <div className="mb-8 rounded-lg bg-white p-6 shadow-sm ring-1 ring-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            MT5 Accounts ({mt5Accounts?.length || 0}/{license.products?.max_accounts || 3})
          </h2>
          <div className="space-y-3">
            {mt5Accounts && mt5Accounts.length > 0 ? (
              mt5Accounts.map((account) => (
                <div key={account.id} className="flex items-center justify-between border border-gray-200 rounded-lg p-4">
                  <div>
                    <p className="font-mono text-sm font-semibold text-gray-900">
                      Account: {account.account_number}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      Broker: {account.broker_company} | Server: {account.broker_server}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      IP: {account.ip_address} | Last used: {new Date(account.last_used_at).toLocaleString()}
                    </p>
                  </div>
                  <form action={deactivateAccount}>
                    <input type="hidden" name="account_id" value={account.id} />
                    <input type="hidden" name="license_id" value={licenseId} />
                    <button
                      type="submit"
                      className="rounded-md bg-red-600 px-3 py-1 text-xs font-semibold text-white hover:bg-red-700"
                    >
                      🗑️ Remove
                    </button>
                  </form>
                </div>
              ))
            ) : (
              <p className="text-center py-8 text-gray-500">No MT5 accounts registered yet</p>
            )}
          </div>
        </div>

        {/* Usage Logs */}
        <div className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Usage History ({usageLogs?.length || 0} events)
          </h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Event</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">IP Address</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {usageLogs && usageLogs.length > 0 ? (
                  usageLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900">{log.event_type}</td>
                      <td className="px-4 py-3 text-sm font-mono text-gray-600">{log.ip_address || 'N/A'}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="px-4 py-8 text-center text-gray-500">No activity yet</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Extend License Modal */}
      <div id="extend-modal" className="hidden fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Extend License</h3>
          <form action={extendLicense}>
            <input type="hidden" name="license_id" value={licenseId} />
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Extend by (days)
              </label>
              <input
                type="number"
                name="days"
                min="1"
                defaultValue="30"
                required
                className="block w-full rounded-md border border-gray-300 px-3 py-2"
              />
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                className="flex-1 rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
              >
                Extend
              </button>
              <button
                type="button"
                onClick={() => document.getElementById('extend-modal')?.classList.add('hidden')}
                className="flex-1 rounded-md bg-gray-200 px-4 py-2 text-gray-700 hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Notes Modal */}
      <div id="notes-modal" className="hidden fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Edit Admin Notes</h3>
          <form action={updateNotes}>
            <input type="hidden" name="license_id" value={licenseId} />
            <div className="mb-4">
              <textarea
                name="notes"
                rows={4}
                defaultValue={license.notes || ''}
                className="block w-full rounded-md border border-gray-300 px-3 py-2"
                placeholder="Add internal notes about this license..."
              />
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                className="flex-1 rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => document.getElementById('notes-modal')?.classList.add('hidden')}
                className="flex-1 rounded-md bg-gray-200 px-4 py-2 text-gray-700 hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
