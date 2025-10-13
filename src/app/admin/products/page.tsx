import { requireAdmin } from '@/utils/admin'
import { AdminLayout } from '@/components/admin-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Package, Plus, Eye, Edit, Trash2, Star } from 'lucide-react'
import Link from 'next/link'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { Toast } from '@/components/toast'
import { Suspense } from 'react'

async function deleteProduct(formData: FormData) {
  'use server'
  
  const { adminClient } = await requireAdmin()
  const id = formData.get('id') as string

  const { error } = await adminClient
    .from('products')
    .delete()
    .eq('id', id)

  if (error) {
    revalidatePath('/admin/products')
    return redirect('/admin/products?error=' + encodeURIComponent('Failed to delete product'))
  }

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
    <AdminLayout user={user}>
      <Suspense>
        <Toast />
      </Suspense>
      <div className="page-transition">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight mb-2 gradient-text">Products</h1>
            <p className="text-muted-foreground">
              Manage your Expert Advisors and their properties.
            </p>
          </div>
          <Button asChild className="h-11 gap-2 bg-gradient-neon text-black font-bold button-shine">
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
                <Card key={product.id} className="glass-card border-0 shadow-xl hover-lift flex flex-col">
                  <CardHeader>
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-3">
                        {category?.icon && (
                          <span className="text-3xl">{category.icon}</span>
                        )}
                        {product.is_featured && (
                          <div className="p-1.5 bg-yellow-500/20 rounded-full">
                            <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                          </div>
                        )}
                      </div>
                      <Badge className="bg-background/50 text-muted-foreground border-border/50">
                        {product.platform || 'MT5'}
                      </Badge>
                    </div>
                    <CardTitle className="text-xl text-foreground">{product.name}</CardTitle>
                    {category && (
                      <CardDescription>{category.name}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="flex-grow flex flex-col justify-between">
                    <div className="space-y-4">
                      {product.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2 h-[40px]">
                          {product.description}
                        </p>
                      )}
                    </div>
                    <div className="mt-4 flex items-end justify-between">
                      <div>
                        <p className="text-3xl font-bold gradient-text">
                          ₹{product.price}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {licensesCount} licenses sold
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" asChild className="hover:bg-background/50 hover:text-neon">
                          <Link href={`/products/${product.id}`} target="_blank">
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button variant="ghost" size="icon" asChild className="hover:bg-background/50 hover:text-neon">
                          <Link href={`/admin/products/create?id=${product.id}`}>
                            <Edit className="h-4 w-4" />
                          </Link>
                        </Button>
                        <form action={deleteProduct}>
                          <input type="hidden" name="id" value={product.id} />
                          <Button
                            type="submit"
                            variant="ghost"
                            size="icon"
                            className="text-red-500 hover:text-red-400 hover:bg-red-500/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </form>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        ) : (
          <Card className="glass-card border-0 shadow-xl">
            <CardContent className="text-center py-16">
              <Package className="mx-auto h-12 w-12 text-neon/50 mb-3" />
              <h3 className="text-lg font-semibold text-foreground mb-1">No products yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Create your first Expert Advisor to get started.
              </p>
              <Button asChild className="h-11 gap-2 bg-gradient-neon text-black font-bold button-shine">
                <Link href="/admin/products/create">
                  <Plus className="h-4 w-4" />
                  Add New EA
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  )
}
