import { requireAdmin } from '@/utils/admin'
import { AdminNav } from '@/components/admin-nav'
import { Toast } from '@/components/toast'
import { Suspense } from 'react'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { sendLicenseCreatedEmail } from '@/lib/email'

async function generateLicense(formData: FormData) {
  'use server'
  
  console.log('[LICENSE-GENERATE] Starting license generation...')
  
  const { adminClient } = await requireAdmin()
  
  try {
    const productId = formData.get('product_id') as string
    const userEmail = formData.get('user_email') as string
    const durationDays = parseInt(formData.get('duration_days') as string)

    console.log('[LICENSE-GENERATE] Input:', { productId, userEmail, durationDays })

    if (!productId || !userEmail || !durationDays) {
      console.error('[LICENSE-GENERATE] Missing required fields')
      revalidatePath('/admin/licenses')
      return redirect('/admin/licenses?error=' + encodeURIComponent('All fields required'))
    }

    const { data: product, error: productError } = await adminClient
      .from('products')
      .select('*')
      .eq('id', productId)
      .single()

    if (productError || !product) {
      console.error('[LICENSE-GENERATE] Product not found:', productError)
      revalidatePath('/admin/licenses')
      return redirect('/admin/licenses?error=' + encodeURIComponent('Product not found'))
    }

    console.log('[LICENSE-GENERATE] Product found:', product.name)

    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    const licenseKey = Array.from({ length: 4 }, () => {
      return Array.from({ length: 8 }, () =>
        chars.charAt(Math.floor(Math.random() * chars.length))
      ).join('')
    }).join('-')

    console.log('[LICENSE-GENERATE] Generated key:', licenseKey)

    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + durationDays)

    let userId
    const { data: existingUser } = await adminClient
      .from('users')
      .select('id')
      .eq('email', userEmail)
      .maybeSingle()

    if (existingUser) {
      userId = existingUser.id
      console.log('[LICENSE-GENERATE] Existing user found:', userId)
    } else {
      const { data: newUser, error: userError } = await adminClient
        .from('users')
        .insert({
          email: userEmail,
          full_name: userEmail.split('@')[0],
        })
        .select('id')
        .single()

      if (userError || !newUser) {
        console.error('[LICENSE-GENERATE] User creation failed:', userError)
        revalidatePath('/admin/licenses')
        return redirect('/admin/licenses?error=' + encodeURIComponent('Failed to create user'))
      }
      userId = newUser.id
      console.log('[LICENSE-GENERATE] New user created:', userId)
    }

    const { error: licenseError } = await adminClient
      .from('licenses')
      .insert({
        user_id: userId,
        product_id: productId,
        license_key: licenseKey,
        status: 'active',
        expires_at: expiresAt.toISOString(),
      })

    if (licenseError) {
      console.error('[LICENSE-GENERATE] License creation failed:', licenseError)
      revalidatePath('/admin/licenses')
      return redirect('/admin/licenses?error=' + encodeURIComponent('Failed to create license'))
    }

    console.log('[LICENSE-GENERATE] License created successfully')

    try {
      await sendLicenseCreatedEmail(
        userEmail,
        licenseKey,
        product.name,
        expiresAt.toISOString()
      )
      console.log('[LICENSE-GENERATE] Email sent successfully')
    } catch (emailError) {
      console.error('[LICENSE-GENERATE] Email failed (non-blocking):', emailError)
    }

    console.log('[LICENSE-GENERATE] ✅ Complete!')
    revalidatePath('/admin/licenses')
    return redirect('/admin/licenses?success=' + encodeURIComponent(`License generated: ${licenseKey}`))
  } catch (error) {
    console.error('[LICENSE-GENERATE] ❌ Unexpected error:', error)
    revalidatePath('/admin/licenses')
    return redirect('/admin/licenses?error=' + encodeURIComponent('Unexpected error occurred'))
  }
}

async function pauseLicense(formData: FormData) {
  'use server'
  
  const { adminClient } = await requireAdmin()
  const id = formData.get('id') as string

  console.log('[LICENSE-PAUSE] Pausing license:', id)

  const { error } = await adminClient
    .from('licenses')
    .update({ status: 'paused' })
    .eq('id', id)

  if (error) {
    console.error('[LICENSE-PAUSE] Failed:', error)
    revalidatePath('/admin/licenses')
    return redirect('/admin/licenses?error=' + encodeURIComponent('Failed to pause license'))
  }

  console.log('[LICENSE-PAUSE] ✅ Success')
  revalidatePath('/admin/licenses')
  redirect('/admin/licenses?success=' + encodeURIComponent('License paused successfully'))
}

async function resumeLicense(formData: FormData) {
  'use server'
  
  const { adminClient } = await requireAdmin()
  const id = formData.get('id') as string

  console.log('[LICENSE-RESUME] Resuming license:', id)

  const { error } = await adminClient
    .from('licenses')
    .update({ status: 'active' })
    .eq('id', id)

  if (error) {
    console.error('[LICENSE-RESUME] Failed:', error)
    revalidatePath('/admin/licenses')
    return redirect('/admin/licenses?error=' + encodeURIComponent('Failed to resume license'))
  }

  console.log('[LICENSE-RESUME] ✅ Success')
  revalidatePath('/admin/licenses')
  redirect('/admin/licenses?success=' + encodeURIComponent('License resumed successfully'))
}

async function deleteLicense(formData: FormData) {
  'use server'
  
  const { adminClient } = await requireAdmin()
  const id = formData.get('id') as string

  console.log('[LICENSE-DELETE] Deleting license:', id)

  const { error } = await adminClient
    .from('licenses')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('[LICENSE-DELETE] Failed:', error)
    revalidatePath('/admin/licenses')
    return redirect('/admin/licenses?error=' + encodeURIComponent('Failed to delete license'))
  }

  console.log('[LICENSE-DELETE] ✅ Success')
  revalidatePath('/admin/licenses')
  redirect('/admin/licenses?success=' + encodeURIComponent('License deleted successfully'))
}

async function extendLicense(formData: FormData) {
  'use server'
  
  const { adminClient } = await requireAdmin()
  const id = formData.get('id') as string
  const days = parseInt(formData.get('days') as string)

  console.log('[LICENSE-EXTEND] Extending license:', { id, days })

  const { data: license } = await adminClient
    .from('licenses')
    .select('expires_at')
    .eq('id', id)
    .single()

  if (!license) {
    console.error('[LICENSE-EXTEND] License not found')
    revalidatePath('/admin/licenses')
    return redirect('/admin/licenses?error=' + encodeURIComponent('License not found'))
  }

  const currentExpiry = new Date(license.expires_at)
  const newExpiry = new Date(currentExpiry)
  newExpiry.setDate(newExpiry.getDate() + days)

  console.log('[LICENSE-EXTEND] New expiry:', newExpiry.toISOString())

  const { error } = await adminClient
    .from('licenses')
    .update({ expires_at: newExpiry.toISOString() })
    .eq('id', id)

  if (error) {
    console.error('[LICENSE-EXTEND] Failed:', error)
    revalidatePath('/admin/licenses')
    return redirect('/admin/licenses?error=' + encodeURIComponent('Failed to extend license'))
  }

  console.log('[LICENSE-EXTEND] ✅ Success')
  revalidatePath('/admin/licenses')
  redirect('/admin/licenses?success=' + encodeURIComponent(`License extended by ${days} days`))
}

export default async function LicensesPage() {
  const { user, adminClient } = await requireAdmin()

  const { data: licenses } = await adminClient
    .from('licenses')
    .select(`
      *,
      users(email, full_name),
      products(name, max_accounts),
      mt5_accounts(*)
    `)
    .order('created_at', { ascending: false })

  const { data: products } = await adminClient
    .from('products')
    .select('*')
    .order('name', { ascending: true })

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNav userEmail={user.email || ''} />
      <Suspense>
        <Toast />
      </Suspense>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Licenses</h1>
          <p className="mt-2 text-sm text-gray-600">
            Manage customer licenses and MT5 accounts
          </p>
        </div>

        <div className="mb-8 rounded-lg bg-white p-6 shadow-sm ring-1 ring-gray-200">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Generate New License</h2>
          <form action={generateLicense} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <label htmlFor="product_id" className="mb-1 block text-sm font-medium text-gray-700">
                  Product *
                </label>
                <select
                  id="product_id"
                  name="product_id"
                  required
                  className="block w-full rounded-md border border-gray-300 px-3 py-2"
                >
                  <option value="">Select product</option>
                  {products?.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="user_email" className="mb-1 block text-sm font-medium text-gray-700">
                  Customer Email *
                </label>
                <input
                  type="email"
                  id="user_email"
                  name="user_email"
                  required
                  className="block w-full rounded-md border border-gray-300 px-3 py-2"
                  placeholder="customer@example.com"
                />
              </div>

              <div>
                <label htmlFor="duration_days" className="mb-1 block text-sm font-medium text-gray-700">
                  Duration (days) *
                </label>
                <input
                  type="number"
                  id="duration_days"
                  name="duration_days"
                  required
                  min="1"
                  defaultValue="365"
                  className="block w-full rounded-md border border-gray-300 px-3 py-2"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Generate & Email License
              </button>
            </div>
          </form>
        </div>

        <div className="rounded-lg bg-white shadow-sm ring-1 ring-gray-200">
          <div className="p-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">All Licenses</h2>
            
            {licenses && licenses.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                        License Key
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                        Customer
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                        Product
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                        Expires
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                        Days Left
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                        Accounts
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {licenses.map((license) => {
                      const product = Array.isArray(license.products) ? license.products[0] : license.products
                      const userInfo = Array.isArray(license.users) ? license.users[0] : license.users
                      const daysRemaining = license.expires_at 
                        ? Math.ceil((new Date(license.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                        : null

                      return (
                        <tr key={license.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-mono text-gray-900">
                            {license.license_key}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {userInfo?.email || 'N/A'}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {product?.name || 'N/A'}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                              license.status === 'active' 
                                ? 'bg-green-100 text-green-800'
                                : license.status === 'paused'
                                ? 'bg-yellow-100 text-yellow-800'
                                : license.status === 'suspended'
                                ? 'bg-orange-100 text-orange-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {license.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {license.expires_at ? new Date(license.expires_at).toLocaleDateString() : 'Never'}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {daysRemaining !== null && daysRemaining > 0 ? (
                              <span className={daysRemaining <= 7 ? 'text-red-600 font-semibold' : 'text-gray-600'}>
                                {daysRemaining} days
                              </span>
                            ) : daysRemaining !== null ? (
                              <span className="text-red-600 font-semibold">Expired</span>
                            ) : (
                              <span className="text-gray-400">N/A</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {license.mt5_accounts?.length || 0} / {product?.max_accounts || 3}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex gap-2 flex-wrap">
                              <Link
                                href={`/admin/licenses/${license.id}`}
                                className="text-blue-600 hover:text-blue-700 text-sm"
                              >
                                View
                              </Link>
                              
                              {license.status === 'active' ? (
                                <form action={pauseLicense} className="inline">
                                  <input type="hidden" name="id" value={license.id} />
                                  <button type="submit" className="text-yellow-600 hover:text-yellow-700 text-sm">
                                    Pause
                                  </button>
                                </form>
                              ) : license.status === 'paused' ? (
                                <form action={resumeLicense} className="inline">
                                  <input type="hidden" name="id" value={license.id} />
                                  <button type="submit" className="text-green-600 hover:text-green-700 text-sm">
                                    Resume
                                  </button>
                                </form>
                              ) : null}
                              
                              <button
                                onClick={() => {
                                  const modal = document.getElementById(`extend-modal-${license.id}`)
                                  if (modal) modal.classList.remove('hidden')
                                }}
                                className="text-purple-600 hover:text-purple-700 text-sm"
                              >
                                Extend
                              </button>
                              
                              <form action={deleteLicense} className="inline">
                                <input type="hidden" name="id" value={license.id} />
                                <button
                                  type="submit"
                                  onClick={(e) => {
                                    if (!confirm('Are you sure? This will permanently delete this license and all associated data.')) {
                                      e.preventDefault()
                                    }
                                  }}
                                  className="text-red-600 hover:text-red-700 text-sm"
                                >
                                  Delete
                                </button>
                              </form>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-4xl mb-4">🔑</div>
                <h3 className="text-lg font-medium text-gray-900">No licenses yet</h3>
                <p className="mt-2 text-gray-600">Generate your first license above</p>
              </div>
            )}
          </div>
        </div>

        {licenses?.map((license) => (
          <div
            key={license.id}
            id={`extend-modal-${license.id}`}
            className="hidden fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                e.currentTarget.classList.add('hidden')
              }
            }}
          >
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Extend License
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                License: <code className="font-mono">{license.license_key}</code>
              </p>
              <form action={extendLicense} className="space-y-4">
                <input type="hidden" name="id" value={license.id} />
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
                <div className="flex gap-3 justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      const modal = document.getElementById(`extend-modal-${license.id}`)
                      if (modal) modal.classList.add('hidden')
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700"
                  >
                    Extend License
                  </button>
                </div>
              </form>
            </div>
          </div>
        ))}
      </main>
    </div>
  )
}
