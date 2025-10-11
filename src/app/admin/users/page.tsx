import { requireAdmin } from '@/utils/admin'
import { AdminNav } from '@/components/admin-nav'
import { Toast } from '@/components/toast'
import { Suspense } from 'react'
import Link from 'next/link'

export default async function UsersPage() {
  const { user, adminClient } = await requireAdmin()

  const { data: users } = await adminClient
    .from('users')
    .select(`
      *,
      licenses(count)
    `)
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-gray-100">
      <AdminNav userEmail={user.email || ''} />
      <Suspense>
        <Toast />
      </Suspense>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Customer Management</h1>
          <p className="mt-2 text-sm text-gray-600">
            View and manage all your customers and their license details.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {users && users.length > 0 ? (
            users.map((customer) => (
              <Link
                key={customer.id}
                href={`/admin/users/${customer.id}`}
                className="block rounded-lg border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{customer.full_name || 'No Name'}</h3>
                    <p className="mt-1 text-sm text-gray-600">{customer.email}</p>
                  </div>
                  <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-800">
                    {customer.licenses?.[0]?.count || 0} licenses
                  </span>
                </div>
                <div className="mt-4 text-xs text-gray-500">
                  Joined {new Date(customer.created_at).toLocaleDateString()}
                </div>
              </Link>
            ))
          ) : (
            <div className="col-span-3 text-center py-12 text-gray-500">
              No customers yet
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
