import { requireAdmin } from '@/utils/admin'
import { AdminNav } from '@/components/admin-nav'
import { Toast } from '@/components/toast'
import { DeleteProductButton } from '@/components/delete-product-button'
import { Suspense } from 'react'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

async function createProduct(formData: FormData) {
  'use server'
  
  const { adminClient } = await requireAdmin()
  
  const name = formData.get('name') as string
  const description = formData.get('description') as string
  const price = parseFloat(formData.get('price') as string)
  const duration = parseInt(formData.get('license_duration_days') as string)
  const maxAccounts = parseInt(formData.get('max_accounts') as string)

  try {
    const { error: insertError } = await adminClient
      .from('products')
      .insert({
        name,
        description,
        price,
        license_duration_days: duration,
        max_accounts: maxAccounts,
      })

    if (insertError) throw insertError
    
    revalidatePath('/admin/products')
    return redirect('/admin/products?success=' + encodeURIComponent('Product created successfully'))
  } catch (err) {
    console.error('Product creation error:', err)
    revalidatePath('/admin/products')
    return redirect('/admin/products?error=' + encodeURIComponent('Failed to create product'))
  }
}

async function deleteProduct(formData: FormData) {
  'use server'
  
  const { adminClient } = await requireAdmin()
  const id = formData.get('id') as string

  try {
    const { error: deleteError } = await adminClient
      .from('products')
      .delete()
      .eq('id', id)

    if (deleteError) throw deleteError

    revalidatePath('/admin/products')
    return redirect('/admin/products?success=' + encodeURIComponent('Product deleted successfully'))
  } catch (err) {
    console.error('Product deletion error:', err)
    revalidatePath('/admin/products')
    return redirect('/admin/products?error=' + encodeURIComponent('Failed to delete product'))
  }
}

export default async function ProductsPage() {
  const { user, adminClient } = await requireAdmin()

  const { data: products } = await adminClient
    .from('products')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNav userEmail={user.email || ''} />
      <Suspense>
        <Toast />
      </Suspense>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Products</h1>
            <p className="mt-2 text-sm text-gray-600">
              Manage your MT5 EA products and pricing
            </p>
          </div>
        </div>

        {/* Create Product Form */}
        <div className="mb-8 rounded-lg bg-white p-6 shadow-sm ring-1 ring-gray-200">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Create New Product</h2>
          <form action={createProduct} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label htmlFor="name" className="mb-1 block text-sm font-medium text-gray-700">
                  Product Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  className="block w-full rounded-md border border-gray-300 px-3 py-2"
                  placeholder="MT5 Gold Scalper EA"
                />
              </div>

              <div>
                <label htmlFor="price" className="mb-1 block text-sm font-medium text-gray-700">
                  Price (₹) *
                </label>
                <input
                  type="number"
                  id="price"
                  name="price"
                  required
                  min="0"
                  step="0.01"
                  className="block w-full rounded-md border border-gray-300 px-3 py-2"
                  placeholder="4999"
                />
              </div>

              <div>
                <label htmlFor="license_duration_days" className="mb-1 block text-sm font-medium text-gray-700">
                  License Duration (days) *
                </label>
                <input
                  type="number"
                  id="license_duration_days"
                  name="license_duration_days"
                  required
                  min="1"
                  className="block w-full rounded-md border border-gray-300 px-3 py-2"
                  placeholder="365"
                />
              </div>

              <div>
                <label htmlFor="max_accounts" className="mb-1 block text-sm font-medium text-gray-700">
                  Max MT5 Accounts *
                </label>
                <input
                  type="number"
                  id="max_accounts"
                  name="max_accounts"
                  required
                  min="1"
                  className="block w-full rounded-md border border-gray-300 px-3 py-2"
                  placeholder="3"
                />
              </div>
            </div>

            <div>
              <label htmlFor="description" className="mb-1 block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                rows={3}
                className="block w-full rounded-md border border-gray-300 px-3 py-2"
                placeholder="Professional gold scalping algorithm for MT5"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Create Product
              </button>
            </div>
          </form>
        </div>

        {/* Products List */}
        <div className="rounded-lg bg-white shadow-sm ring-1 ring-gray-200">
          <div className="p-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Existing Products</h2>
            
            {products && products.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                        Product Name
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                        Price
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                        Duration
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                        Max Accounts
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                        Created
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {products.map((product) => (
                      <tr key={product.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="text-sm font-medium text-gray-900">{product.name}</div>
                          {product.description && (
                            <div className="text-xs text-gray-500">{product.description}</div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          ₹{product.price.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {product.license_duration_days} days
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {product.max_accounts}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500">
                          {new Date(product.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">
                          <DeleteProductButton productId={product.id} onDelete={deleteProduct} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-4xl mb-4">📦</div>
                <h3 className="text-lg font-medium text-gray-900">No products yet</h3>
                <p className="mt-2 text-gray-600">Create your first product to get started</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
