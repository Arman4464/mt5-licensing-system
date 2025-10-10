import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

async function createProduct(formData: FormData) {
  'use server'
  
  const supabase = await createClient()
  
  const name = formData.get('name') as string
  const description = formData.get('description') as string
  const price = parseFloat(formData.get('price') as string)
  const duration = parseInt(formData.get('duration') as string)
  const maxAccounts = parseInt(formData.get('max_accounts') as string)

  await supabase.from('products').insert({
    name,
    description,
    price,
    license_duration_days: duration,
    max_accounts: maxAccounts,
  })

  redirect('/admin/products')
}

export default async function ProductsPage() {
  const supabase = await createClient()
  
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    redirect('/login')
  }

  const { data: products } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <h1 className="text-xl font-bold text-gray-900">Products Management</h1>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 rounded-lg bg-white p-6 shadow">
          <h2 className="text-lg font-semibold text-gray-900">Create New Product</h2>
          <form action={createProduct} className="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">Product Name</label>
              <input
                type="text"
                name="name"
                required
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                placeholder="My EA Pro"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Price ($)</label>
              <input
                type="number"
                name="price"
                step="0.01"
                required
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                placeholder="99.99"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">License Duration (days)</label>
              <input
                type="number"
                name="duration"
                required
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                placeholder="365"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Max MT5 Accounts</label>
              <input
                type="number"
                name="max_accounts"
                required
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                placeholder="3"
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <textarea
                name="description"
                rows={3}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                placeholder="Product description..."
              />
            </div>
            
            <div className="md:col-span-2">
              <button
                type="submit"
                className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
              >
                Create Product
              </button>
            </div>
          </form>
        </div>

        <div className="rounded-lg bg-white p-6 shadow">
          <h2 className="text-lg font-semibold text-gray-900">Existing Products</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {products && products.length > 0 ? (
              products.map((product) => (
                <div key={product.id} className="rounded-lg border border-gray-200 p-4">
                  <h3 className="font-semibold text-gray-900">{product.name}</h3>
                  <p className="mt-1 text-sm text-gray-600">{product.description}</p>
                  <div className="mt-3 space-y-1 text-sm">
                    <p className="text-gray-700">Price: <span className="font-semibold">${product.price}</span></p>
                    <p className="text-gray-700">Duration: {product.license_duration_days} days</p>
                    <p className="text-gray-700">Max Accounts: {product.max_accounts}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500">No products yet. Create one above!</p>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
