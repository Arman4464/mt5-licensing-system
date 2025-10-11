import { requireAdmin } from '@/utils/admin'
import { AdminNav } from '@/components/admin-nav'
import { Toast } from '@/components/toast'
import { Suspense } from 'react'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

async function batchExtendLicenses(formData: FormData) {
  'use server'
  
  const { adminClient } = await requireAdmin()
  
  const days = parseInt(formData.get('days') as string)
  const status = formData.get('status') as string
  const reactivate = formData.get('reactivate') === 'true'

  if (!days || !status) {
    redirect('/admin/batch?error=Days and status required')
  }

  const { data: licenses } = await adminClient
    .from('licenses')
    .select('id, expires_at, status')
    .eq('status', status)

  if (!licenses || licenses.length === 0) {
    redirect('/admin/batch?error=No licenses found with that status')
  }

  const updates = licenses.map(license => {
    const currentExpiry = license.expires_at ? new Date(license.expires_at) : new Date()
    const newExpiry = new Date(currentExpiry)
    newExpiry.setDate(newExpiry.getDate() + days)
    
    const updateData: Record<string, string> = { expires_at: newExpiry.toISOString() }
    
    if (reactivate && (license.status === 'suspended' || license.status === 'expired')) {
      updateData.status = 'active'
    }
    
    return adminClient
      .from('licenses')
      .update(updateData)
      .eq('id', license.id)
  })

  await Promise.all(updates)

  revalidatePath('/admin/batch')
  redirect(`/admin/batch?success=Extended ${licenses.length} licenses by ${days} days${reactivate ? ' and reactivated' : ''}`)
}

async function batchSuspendExpired() {
  'use server'
  
  const { adminClient } = await requireAdmin()

  const { data: expiredLicenses } = await adminClient
    .from('licenses')
    .select('id')
    .eq('status', 'active')
    .lt('expires_at', new Date().toISOString())

  if (!expiredLicenses || expiredLicenses.length === 0) {
    redirect('/admin/batch?info=No expired licenses found')
  }

  await adminClient
    .from('licenses')
    .update({ status: 'expired' })
    .in('id', expiredLicenses.map(l => l.id))

  revalidatePath('/admin/batch')
  redirect(`/admin/batch?success=Suspended ${expiredLicenses.length} expired licenses`)
}

async function batchDeleteInactive(formData: FormData) {
  'use server'
  
  const { adminClient } = await requireAdmin()

  const daysInactive = parseInt(formData.get('days') as string) || 90
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - daysInactive)

  const { data: inactiveLicenses } = await adminClient
    .from('licenses')
    .select('id')
    .eq('status', 'expired')
    .lt('updated_at', cutoffDate.toISOString())

  if (!inactiveLicenses || inactiveLicenses.length === 0) {
    redirect('/admin/batch?info=No inactive licenses to delete')
  }

  await adminClient
    .from('licenses')
    .delete()
    .in('id', inactiveLicenses.map(l => l.id))

  revalidatePath('/admin/batch')
  redirect(`/admin/batch?success=Deleted ${inactiveLicenses.length} inactive licenses`)
}

export default async function BatchOperationsPage() {
  const { user, adminClient } = await requireAdmin()

  const { count: activeCount } = await adminClient
    .from('licenses')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active')

  const { count: expiredCount } = await adminClient
    .from('licenses')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'expired')

  const { count: suspendedCount } = await adminClient
    .from('licenses')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'suspended')

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNav userEmail={user.email || ''} />
      <Suspense>
        <Toast />
      </Suspense>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Batch Operations</h1>
          <p className="mt-2 text-sm text-gray-600">
            Perform bulk actions on multiple licenses at once
          </p>
        </div>

        {/* Stats Cards */}
        <div className="mb-8 grid gap-6 md:grid-cols-3">
          <div className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-gray-200">
            <p className="text-sm font-medium text-gray-600">Active Licenses</p>
            <p className="mt-2 text-3xl font-bold text-green-600">{activeCount || 0}</p>
          </div>
          <div className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-gray-200">
            <p className="text-sm font-medium text-gray-600">Expired Licenses</p>
            <p className="mt-2 text-3xl font-bold text-red-600">{expiredCount || 0}</p>
          </div>
          <div className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-gray-200">
            <p className="text-sm font-medium text-gray-600">Suspended Licenses</p>
            <p className="mt-2 text-3xl font-bold text-yellow-600">{suspendedCount || 0}</p>
          </div>
        </div>

        {/* Batch Extend */}
        <div className="mb-6 rounded-lg bg-white p-6 shadow-sm ring-1 ring-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">🔄 Batch Extend Licenses</h2>
          <form action={batchExtendLicenses} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  License Status
                </label>
                <select
                  name="status"
                  required
                  className="block w-full rounded-md border border-gray-300 px-3 py-2"
                >
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                  <option value="expired">Expired</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Extend by (days)
                </label>
                <input
                  type="number"
                  name="days"
                  required
                  min="1"
                  defaultValue="30"
                  className="block w-full rounded-md border border-gray-300 px-3 py-2"
                />
              </div>
              <div className="flex items-end">
                <label className="flex items-center gap-2">
                  <input type="checkbox" name="reactivate" value="true" className="rounded" />
                  <span className="text-sm text-gray-700">Reactivate</span>
                </label>
              </div>
              <div className="flex items-end">
                <button
                  type="submit"
                  className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  Extend All
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Batch Suspend Expired */}
        <div className="mb-6 rounded-lg bg-white p-6 shadow-sm ring-1 ring-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">⏸️ Auto-Suspend Expired Licenses</h2>
          <p className="text-sm text-gray-600 mb-4">
            Automatically suspend all licenses that have expired
          </p>
          <form action={batchSuspendExpired}>
            <button
              type="submit"
              className="rounded-md bg-yellow-600 px-6 py-2 text-sm font-semibold text-white hover:bg-yellow-700"
            >
              Suspend All Expired
            </button>
          </form>
        </div>

        {/* Batch Delete Inactive */}
        <div className="rounded-lg bg-red-50 p-6 border border-red-200">
          <h2 className="text-lg font-semibold text-red-900 mb-4">⚠️ Delete Inactive Licenses</h2>
          <p className="text-sm text-red-700 mb-4">
            Permanently delete licenses that have been inactive for a specified period
          </p>
          <form action={batchDeleteInactive} className="space-y-4">
            <div className="max-w-xs">
              <label className="block text-sm font-medium text-red-900 mb-1">
                Days Inactive
              </label>
              <input
                type="number"
                name="days"
                required
                min="30"
                defaultValue="90"
                className="block w-full rounded-md border border-red-300 px-3 py-2"
              />
            </div>
            <button
              type="submit"
              className="rounded-md bg-red-600 px-6 py-2 text-sm font-semibold text-white hover:bg-red-700"
            >
              Delete Inactive Licenses
            </button>
          </form>
        </div>
      </main>
    </div>
  )
}
