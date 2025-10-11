import { requireAdmin } from '@/utils/admin'
import { AdminNav } from '@/components/admin-nav'
import { Toast } from '@/components/toast'
import { Suspense } from 'react'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

async function createProduct(formData: FormData) {
  'use server'
  
  const { supabase } = await requireAdmin()
  
  try {
    const name = formData.get('name') as string
    const description = formData.get('description') as string
    const price = parseFloat(formData.get('price') as string)
    const duration = parseInt(formData.get('duration') as string)
    const maxAccounts = parseInt(formData.get('max_accounts') as string)

    if (!name || !price || !duration || !maxAccounts) {
      redirect('/admin/products?error=All fields are required')
    }

    const { error } = await supabase.from('products').insert({
      name,
      description,
      price,
      license_duration_days: duration,
      max_accounts: maxAccounts,
    })

    if (error) {
      console.error('Product creation error:', error)
      redirect('/admin/products?error=' + encodeURIComponent(error.message))
    }

    revalidatePath('/admin/products')
    redirect('/admin/products?success=Product created successfully')
  } catch (error) {
    console.error('Unexpected error:', error)
    redirect('/admin/products?error=Failed to create product')
  }
}

async function deleteProduct(formData: FormData) {
  'use server'
  
  const { supabase } = await requireAdmin()
  
  const productId = formData.get('product_id') as string
  
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', productId)

  if (error) {
    redirect('/admin/products?error=' + encodeURIComponent(error.message))
  }

  revalidatePath('/admin/products')
  redirect('/admin/products?success=Product deleted successfully')
}

export default async function ProductsPage() {
  const { user, supabase } = await requireAdmin()

  const { data: products } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-gray-100">
      <AdminNav userEmail={user.email || ''} />
      <Suspense>
        <Toast />
      </Suspense>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Products Management</h1>
          <p className="mt-2 text-sm text-gray-600">
            Create and manage your MT5 EA products and indicators.
          </p>
        </div>

        <div className="mb-8 rounded-lg bg-white p-6 shadow-sm ring-1 ring-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Create New Product</h2>
          <form action={createProduct} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Product Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder-gray-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="e.g., Scalping EA Pro"
                />
              </div>
              
              <div>
                <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
                  Price (USD) *
                </label>
                <input
                  type="number"
                  id="price"
                  name="price"
                  step="0.01"
                  min="0"
                  required
                  className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder-gray-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="99.99"
                />
              </div>
              
              <div>
                <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-1">
                  License Duration (days) *
                </label>
                <input
                  type="number"
                  id="duration"
                  name="duration"
                  min="1"
                  required
                  className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder-gray-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="365"
                />
              </div>
              
              <div>
                <label htmlFor="max_accounts" className="block text-sm font-medium text-gray-700 mb-1">
                  Max MT5 Accounts *
                </label>
                <input
                  type="number"
                  id="max_accounts"
                  name="max_accounts"
                  min="1"
                  max="10"
                  required
                  className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder-gray-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="3"
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                rows={3}
                className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder-gray-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Describe your product features and benefits..."
              />
            </div>
            
            <div className="flex justify-end">
              <button
                type="submit"
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Create Product
              </button>
            </div>
          </form>
        </div>

        <div className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Existing Products</h2>
          {products && products.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {products.map((product) => (
                <div
                  key={product.id}
                  className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <h3 className="font-semibold text-gray-900">{product.name}</h3>
                    <form action={deleteProduct}>
                      <input type="hidden" name="product_id" value={product.id} />
                      <button
                        type="submit"
                        className="text-red-600 hover:text-red-800 text-sm"
                        onClick={(e) => {
                          if (!confirm('Are you sure you want to delete this product?')) {
                            e.preventDefault()
                          }
                        }}
                      >
                        Delete
                      </button>
                    </form>
                  </div>
                  <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                    {product.description || 'No description provided'}
                  </p>
                  <div className="mt-4 space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Price:</span>
                      <span className="font-semibold text-gray-900">${product.price}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Duration:</span>
                      <span className="font-medium text-gray-900">{product.license_duration_days} days</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Max Accounts:</span>
                      <span className="font-medium text-gray-900">{product.max_accounts}</span>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <span className="text-xs text-gray-500">
                      Created {new Date(product.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
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
                  d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No products yet</h3>
              <p className="mt-1 text-sm text-gray-500">Get started by creating a new product above.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
