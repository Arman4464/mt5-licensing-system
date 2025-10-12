import { requireAdmin } from '@/utils/admin'
import { AdminNav } from '@/components/admin-nav'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Package, Plus, Eye, Edit, Trash2, Star } from 'lucide-react'
import Link from 'next/link'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

async function deleteProduct(formData: FormData) {
  'use server'
  
  const { adminClient } = await requireAdmin()
  const id = formData.get('id') as string

  console.log('[PRODUCT-DELETE]', id)

  const { error } = await adminClient
    .from('products')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('[PRODUCT-DELETE] Error:', error)
    revalidatePath('/admin/products')
    return redirect('/admin/products?error=' + encodeURIComponent('Failed to delete product'))
  }

  console.log('[PRODUCT-DELETE] ✅ Success')
  revalidatePath('/admin/products')
  redirect('/admin/products?success=' + encodeURIComponent('Product deleted successfully'))
}

export default async function ProductsPage() {
  const { user, adminClient } = await requireAdmin()

  const { data: products } = await adminClient
    .from('products')
    .select(`
      *,
      ea_categories(name, icon),
      licenses(count)
    `)
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen gradient-bg">
      <AdminNav userEmail={user.email || ''} />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 page-transition">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-2">Products</h1>
            <p className="text-muted-foreground">
              Manage your Expert Advisors
            </p>
          </div>
          <Button asChild className="gap-2 bg-gradient-neon hover:opacity-90 text-black button-shine">
            <Link href="/admin/products/create">
              <Plus className="h-4 w-4" />
              Add New EA
            </Link>
          </Button>
        </div>

        {/* Products Grid */}
        {products && products.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => {
              const category = Array.isArray(product.ea_categories) 
                ? product.ea_categories[0] 
                : product.ea_categories
              const licensesCount = product.licenses?.[0]?.count || 0

              return (
                <Card key={product.id} className="glass-card border-0 shadow-xl hover-lift">
                  <CardHeader>
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {category?.icon && (
                          <span className="text-2xl">{category.icon}</span>
                        )}
                        {product.is_featured && (
                          <Star className="h-4 w-4 text-[#CFFF04] fill-[#CFFF04]" />
                        )}
                      </div>
                      <Badge variant={product.platform === 'MT5' ? 'default' : 'secondary'}>
                        {product.platform || 'MT5'}
                      </Badge>
                    </div>
                    <CardTitle className="text-xl">{product.name}</CardTitle>
                    {category && (
                      <CardDescription>{category.name}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {product.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {product.description}
                        </p>
                      )}

                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-2xl font-bold text-[#CFFF04]">
                            ₹{product.price}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {licensesCount} licenses sold
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="icon" asChild>
                            <Link href={`/admin/products/${product.id}`}>
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button variant="ghost" size="icon" asChild>
                            <Link href={`/admin/products/${product.id}/edit`}>
                              <Edit className="h-4 w-4" />
                            </Link>
                          </Button>
                          <form action={deleteProduct}>
                            <input type="hidden" name="id" value={product.id} />
                            <Button
                              type="submit"
                              variant="ghost"
                              size="icon"
                              className="text-red-500 hover:text-red-600"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </form>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        ) : (
          <Card className="glass-card border-0 shadow-xl">
            <CardContent className="text-center py-12">
              <Package className="mx-auto h-12 w-12 text-muted-foreground/50 mb-3" />
              <h3 className="text-lg font-semibold mb-1">No products yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Create your first Expert Advisor to get started
              </p>
              <Button asChild className="gap-2 bg-gradient-neon hover:opacity-90 text-black">
                <Link href="/admin/products/create">
                  <Plus className="h-4 w-4" />
                  Add New EA
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
