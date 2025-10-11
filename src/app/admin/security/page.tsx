import { requireAdmin } from '@/utils/admin'
import { AdminNav } from '@/components/admin-nav'
import { Toast } from '@/components/toast'
import { Suspense } from 'react'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

async function addIPWhitelist(formData: FormData) {
  'use server'
  
  const { adminClient, user } = await requireAdmin()
  
  const licenseId = formData.get('license_id') as string
  const ipAddress = formData.get('ip_address') as string
  const description = formData.get('description') as string

  if (!licenseId || !ipAddress) {
    redirect('/admin/security?error=License and IP required')
  }

  const { error } = await adminClient
    .from('ip_whitelist')
    .insert({
      license_id: licenseId,
      ip_address: ipAddress,
      description,
      created_by: user.email,
    })

  if (error) {
    redirect('/admin/security?error=' + encodeURIComponent(error.message))
  }

  revalidatePath('/admin/security')
  redirect('/admin/security?success=IP whitelisted successfully')
}

async function removeIPWhitelist(formData: FormData) {
  'use server'
  
  const { adminClient } = await requireAdmin()
  
  const id = formData.get('id') as string

  await adminClient
    .from('ip_whitelist')
    .delete()
    .eq('id', id)

  revalidatePath('/admin/security')
  redirect('/admin/security?success=IP removed from whitelist')
}

async function toggleIPStatus(formData: FormData) {
  'use server'
  
  const { adminClient } = await requireAdmin()
  
  const id = formData.get('id') as string
  const isActive = formData.get('is_active') === 'true'

  await adminClient
    .from('ip_whitelist')
    .update({ is_active: !isActive })
    .eq('id', id)

  revalidatePath('/admin/security')
  redirect('/admin/security?success=IP status updated')
}

export default async function SecurityPage() {
  const { user, adminClient } = await requireAdmin()

  const { data: whitelist } = await adminClient
    .from('ip_whitelist')
    .select('*, licenses(license_key, status)')
    .order('created_at', { ascending: false })

  const { data: licenses } = await adminClient
    .from('licenses')
    .select('id, license_key, status')
    .eq('status', 'active')
    .order('license_key', { ascending: true })

  // Get suspicious activity (multiple IPs for same license)
  const { data: suspiciousActivity } = await adminClient
    .from('mt5_accounts')
    .select('license_id, ip_address, licenses(license_key)')

  const ipsByLicense = suspiciousActivity?.reduce((acc: any, account) => {
    const key = account.license_id
    if (!acc[key]) acc[key] = { license_key: account.licenses?.license_key, ips: new Set() }
    acc[key].ips.add(account.ip_address)
    return acc
  }, {})

  const suspicious = Object.entries(ipsByLicense || {})
    .filter(([_, data]: any) => data.ips.size > 3)
    .map(([licenseId, data]: any) => ({
      licenseId,
      license_key: data.license_key,
      ipCount: data.ips.size,
    }))

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNav userEmail={user.email || ''} />
      <Suspense>
        <Toast />
      </Suspense>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Security & Monitoring</h1>
          <p className="mt-2 text-sm text-gray-600">
            Manage IP whitelisting and monitor suspicious activity
          </p>
        </div>

        {/* Suspicious Activity Alert */}
        {suspicious.length > 0 && (
          <div className="mb-8 rounded-lg bg-red-50 border-l-4 border-red-500 p-6">
            <h3 className="text-lg font-semibold text-red-900 mb-2">
              ⚠️ Suspicious Activity Detected
            </h3>
            <div className="space-y-2">
              {suspicious.map((item) => (
                <div key={item.licenseId} className="text-sm text-red-700">
                  License <code className="font-mono bg-red-100 px-2 py-1 rounded">{item.license_key}</code> 
                  {' '}has been used from <strong>{item.ipCount} different IPs</strong>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Add IP Whitelist Form */}
        <div className="mb-8 rounded-lg bg-white p-6 shadow-sm ring-1 ring-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Add IP to Whitelist</h2>
          <form action={addIPWhitelist} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <label htmlFor="license_id" className="block text-sm font-medium text-gray-700 mb-1">
                  License *
                </label>
                <select
                  id="license_id"
                  name="license_id"
                  required
                  className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900"
                >
                  <option value="">Select license</option>
                  {licenses?.map((license) => (
                    <option key={license.id} value={license.id}>
                      {license.license_key}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="ip_address" className="block text-sm font-medium text-gray-700 mb-1">
                  IP Address *
                </label>
                <input
                  type="text"
                  id="ip_address"
                  name="ip_address"
                  required
                  placeholder="192.168.1.1"
                  className="block w-full rounded-md border border-gray-300 px-3 py-2"
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  id="description"
                  name="description"
                  placeholder="Office IP"
                  className="block w-full rounded-md border border-gray-300 px-3 py-2"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Add to Whitelist
              </button>
            </div>
          </form>
        </div>

        {/* Whitelist Table */}
        <div className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">IP Whitelist</h2>
          
          {whitelist && whitelist.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                      License
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                      IP Address
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                      Description
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                      Added
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {whitelist.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-mono text-gray-900">
                        {item.licenses?.license_key}
                      </td>
                      <td className="px-4 py-3 text-sm font-mono text-gray-900">
                        {item.ip_address}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {item.description || '-'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          item.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {item.is_active ? 'Active' : 'Disabled'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {new Date(item.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <form action={toggleIPStatus}>
                            <input type="hidden" name="id" value={item.id} />
                            <input type="hidden" name="is_active" value={String(item.is_active)} />
                            <button
                              type="submit"
                              className="text-blue-600 hover:text-blue-700 text-sm"
                            >
                              {item.is_active ? 'Disable' : 'Enable'}
                            </button>
                          </form>
                          <form action={removeIPWhitelist}>
                            <input type="hidden" name="id" value={item.id} />
                            <button
                              type="submit"
                              className="text-red-600 hover:text-red-700 text-sm"
                            >
                              Remove
                            </button>
                          </form>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-center py-8 text-gray-500">No IP whitelist entries</p>
          )}
        </div>
      </main>
    </div>
  )
}
