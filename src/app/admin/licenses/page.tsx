import { requireAdmin } from '@/utils/admin'
import { AdminNav } from '@/components/admin-nav'
import { Toast } from '@/components/toast'
import { Suspense } from 'react'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

async function generateLicense(formData: FormData) {
  'use server'
  
  try {
    const { supabase } = await requireAdmin()
    
    const productId = formData.get('product_id') as string
    const userEmail = formData.get('user_email') as string
    const durationDays = parseInt(formData.get('duration_days') as string)

    console.log('Generating license with:', { productId, userEmail, durationDays })

    if (!productId || !userEmail || !durationDays) {
      console.error('Missing fields:', { productId, userEmail, durationDays })
      redirect('/admin/licenses?error=All fields are required')
    }

    // Get product
    console.log('Fetching product...')
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .single()

    if (productError) {
      console.error('Product error:', productError)
      redirect('/admin/licenses?error=Product error: ' + encodeURIComponent(productError.message))
    }

    if (!product) {
      console.error('Product not found')
      redirect('/admin/licenses?error=Product not found')
    }

    console.log('Product found:', product.name)

    // Generate license key
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    const licenseKey = Array.from({ length: 4 }, () => {
      return Array.from({ length: 8 }, () => 
        chars.charAt(Math.floor(Math.random() * chars.length))
      ).join('')
    }).join('-')

    console.log('Generated key:', licenseKey)

    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + durationDays)

    // Find or create user
    console.log('Checking for existing user...')
    const { data: existingUser, error: existingUserError } = await supabase
      .from('users')
      .select('id')
      .eq('email', userEmail)
      .maybeSingle()

    if (existingUserError) {
      console.error('Error checking user:', existingUserError)
    }

    let userId
    if (existingUser) {
      userId = existingUser.id
      console.log('Using existing user:', userId)
    } else {
      console.log('Creating new user...')
      const { data: newUser, error: userError } = await supabase
        .from('users')
        .insert({ 
          email: userEmail, 
          full_name: userEmail.split('@')[0] 
        })
        .select('id')
        .single()

      if (userError) {
        console.error('User creation error:', userError)
        redirect('/admin/licenses?error=User creation failed: ' + encodeURIComponent(userError.message))
      }
      userId = newUser?.id
      console.log('Created new user:', userId)
    }

    if (!userId) {
      console.error('No user ID obtained')
      redirect('/admin/licenses?error=Failed to get user ID')
    }

    // Create license
    console.log('Creating license...')
    const { data: license, error: licenseError } = await supabase
      .from('licenses')
      .insert({
        user_id: userId,
        product_id: productId,
        license_key: licenseKey,
        status: 'active',
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single()

    if (licenseError) {
      console.error('License creation error:', licenseError)
      redirect('/admin/licenses?error=License creation failed: ' + encodeURIComponent(licenseError.message))
    }

    console.log('License created successfully:', license)

    revalidatePath('/admin/licenses')
    redirect('/admin/licenses?success=License generated successfully: ' + licenseKey)
  } catch (error: any) {
    console.error('Unexpected error in generateLicense:', error)
    redirect('/admin/licenses?error=System error: ' + encodeURIComponent(error?.message || 'Unknown error'))
  }
}


async function updateLicenseStatus(formData: FormData) {
  'use server'
  
  const { supabase } = await requireAdmin()
  
  const licenseId = formData.get('license_id') as string
  const status = formData.get('status') as string
  
  const { error } = await supabase
    .from('licenses')
    .update({ status })
    .eq('id', licenseId)

  if (error) {
    redirect('/admin/licenses?error=' + encodeURIComponent(error.message))
  }

  revalidatePath('/admin/licenses')
  redirect('/admin/licenses?success=License status updated')
}

export default async function LicensesPage() {
  const { user, supabase } = await requireAdmin()

  const { data: licenses } = await supabase
    .from('licenses')
    .select(`
      *,
      products(name, price),
      users(email)
    `)
    .order('created_at', { ascending: false })

  // Get MT5 accounts count for each license
  const licensesWithCounts = await Promise.all(
    (licenses || []).map(async (license) => {
      const { count } = await supabase
        .from('mt5_accounts')
        .select('*', { count: 'exact', head: true })
        .eq('license_id', license.id)
      
      return { ...license, accounts_count: count || 0 }
    })
  )

  const { data: products } = await supabase
    .from('products')
    .select('*')
    .order('name', { ascending: true })

  return (
    <div className="min-h-screen bg-gray-100">
      <AdminNav userEmail={user.email || ''} />
      <Suspense>
        <Toast />
      </Suspense>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">License Management</h1>
          <p className="mt-2 text-sm text-gray-600">
            Generate and manage license keys for your customers.
          </p>
        </div>

        <div className="mb-8 rounded-lg bg-white p-6 shadow-sm ring-1 ring-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Generate New License</h2>
          <form action={generateLicense} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <label htmlFor="product_id" className="block text-sm font-medium text-gray-700 mb-1">
                  Product *
                </label>
                <select
                  id="product_id"
                  name="product_id"
                  required
                  className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">Select a product</option>
                  {products?.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name} (${product.price})
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label htmlFor="user_email" className="block text-sm font-medium text-gray-700 mb-1">
                  Customer Email *
                </label>
                <input
                  type="email"
                  id="user_email"
                  name="user_email"
                  required
                  className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder-gray-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="customer@example.com"
                />
              </div>
              
              <div>
                <label htmlFor="duration_days" className="block text-sm font-medium text-gray-700 mb-1">
                  Duration (days) *
                </label>
                <input
                  type="number"
                  id="duration_days"
                  name="duration_days"
                  min="1"
                  required
                  defaultValue="365"
                  className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder-gray-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="365"
                />
              </div>
            </div>
            
            <div className="flex justify-end">
              <button
                type="submit"
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Generate License Key
              </button>
            </div>
          </form>
        </div>

        <div className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">All Licenses</h2>
          {licensesWithCounts && licensesWithCounts.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      License Key
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Product
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Accounts
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Expires
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {licensesWithCounts.map((license) => (
                    <tr key={license.id} className="hover:bg-gray-50">
                      <td className="whitespace-nowrap px-6 py-4 text-sm font-mono text-gray-900">
                        {license.license_key}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                        {license.products?.name || 'N/A'}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                        {license.users?.email || 'N/A'}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm">
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          license.status === 'active' 
                            ? 'bg-green-100 text-green-800' 
                            : license.status === 'expired'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {license.status}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                        <span className="font-medium">{license.accounts_count}</span>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                        {license.expires_at 
                          ? new Date(license.expires_at).toLocaleDateString()
                          : 'Never'}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm">
                        <form action={updateLicenseStatus} className="inline">
                          <input type="hidden" name="license_id" value={license.id} />
                          <select
                            name="status"
                            defaultValue={license.status}
                            onChange={(e) => e.target.form?.requestSubmit()}
                            className="rounded border-gray-300 text-xs focus:border-blue-500 focus:ring-blue-500"
                          >
                            <option value="active">Active</option>
                            <option value="suspended">Suspended</option>
                            <option value="expired">Expired</option>
                          </select>
                        </form>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No licenses yet</h3>
              <p className="mt-1 text-sm text-gray-500">Generate your first license key above.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
