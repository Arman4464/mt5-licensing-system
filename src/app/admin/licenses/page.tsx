import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'

async function generateLicense(formData: FormData) {
  'use server'
  
  const supabase = await createClient()
  
  const productId = formData.get('product_id') as string
  const userEmail = formData.get('user_email') as string
  const durationDays = parseInt(formData.get('duration_days') as string)

  const { data: product } = await supabase
    .from('products')
    .select('*')
    .eq('id', productId)
    .single()

  if (!product) {
    redirect('/admin/licenses?error=Product not found')
  }

  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  const licenseKey = Array.from({ length: 4 }, () => {
    return Array.from({ length: 8 }, () => 
      chars.charAt(Math.floor(Math.random() * chars.length))
    ).join('')
  }).join('-')

  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + (durationDays || product.license_duration_days))

  const { data: existingUser } = await supabase
    .from('users')
    .select('id')
    .eq('email', userEmail)
    .single()

  let userId = existingUser?.id

  if (!userId) {
    const { data: newUser } = await supabase
      .from('users')
      .insert({ email: userEmail, full_name: userEmail.split('@')[0] })
      .select('id')
      .single()
    userId = newUser?.id
  }

  await supabase.from('licenses').insert({
    user_id: userId,
    product_id: productId,
    license_key: licenseKey,
    status: 'active',
    expires_at: expiresAt.toISOString(),
  })

  redirect('/admin/licenses')
}

export default async function LicensesPage() {
  const supabase = await createClient()
  
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    redirect('/login')
  }

  const { data: licenses } = await supabase
    .from('licenses')
    .select('*, products(*), users(email), mt5_accounts(count)')
    .order('created_at', { ascending: false })

  const { data: products } = await supabase
    .from('products')
    .select('*')
    .order('name', { ascending: true })

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between">
            <div className="flex space-x-8">
              <div className="flex flex-shrink-0 items-center">
                <h1 className="text-xl font-bold text-gray-900">MT5 Admin Panel</h1>
              </div>
              <div className="flex space-x-4">
                <Link href="/admin" className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-500 hover:text-gray-900">
                  Dashboard
                </Link>
                <Link href="/admin/licenses" className="inline-flex items-center border-b-2 border-blue-500 px-1 pt-1 text-sm font-medium text-gray-900">
                  Licenses
                </Link>
                <Link href="/admin/products" className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-500 hover:text-gray-900">
                  Products
                </Link>
              </div>
            </div>
            <div className="flex items-center">
              <span className="text-sm text-gray-700">{user.email}</span>
            </div>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 rounded-lg bg-white p-6 shadow">
          <h2 className="text-lg font-semibold text-gray-900">Generate New License</h2>
          <form action={generateLicense} className="mt-4 grid gap-4 md:grid-cols-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">Product</label>
              <select
                name="product_id"
                required
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
              >
                <option value="">Select Product</option>
                {products?.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">User Email</label>
              <input
                type="email"
                name="user_email"
                required
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                placeholder="user@example.com"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Duration (days)</label>
              <input
                type="number"
                name="duration_days"
                required
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                placeholder="365"
              />
            </div>
            
            <div className="md:col-span-3">
              <button
                type="submit"
                className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
              >
                Generate License
              </button>
            </div>
          </form>
        </div>

        <div className="rounded-lg bg-white p-6 shadow">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">All Licenses</h2>
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
                    User
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
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {licenses && licenses.length > 0 ? (
                  licenses.map((license) => (
                    <tr key={license.id}>
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
                        <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                          license.status === 'active' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {license.status}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                        {license.mt5_accounts?.[0]?.count || 0}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                        {license.expires_at ? new Date(license.expires_at).toLocaleDateString() : 'Never'}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                      No licenses yet. Create a product first, then generate licenses!
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
