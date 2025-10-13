import { requireAdmin } from '@/utils/admin'
import { AdminLayout } from '@/components/admin-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Package, Save } from 'lucide-react'
import { Toast } from '@/components/toast'
import { Suspense } from 'react'

async function createOrUpdateProduct(formData: FormData) {
  'use server'
  
  const { adminClient } = await requireAdmin()
  
  const id = formData.get('id') as string | null
  const name = formData.get('name') as string
  const description = formData.get('description') as string
  const price = parseFloat(formData.get('price') as string)
  const categoryId = formData.get('category_id') as string
  const platform = formData.get('platform') as string
  const imageUrl = formData.get('image_url') as string
  const isFeatured = formData.get('is_featured') === 'on'

  const featuresRaw = formData.get('features') as string
  const features = featuresRaw ? featuresRaw.split(',').map(f => f.trim()).filter(Boolean) : []

  const requirementsRaw = formData.get('requirements') as string
  const requirements = requirementsRaw ? requirementsRaw.split(',').map(r => r.trim()).filter(Boolean) : []

  const productData = {
    name,
    description,
    price,
    category_id: categoryId || null,
    platform,
    image_url: imageUrl || null,
    features,
    requirements,
    is_featured: isFeatured,
  }

  let error

  if (id) {
    // Update existing product
    const { error: updateError } = await adminClient
      .from('products')
      .update(productData)
      .eq('id', id)
    error = updateError
  } else {
    // Create new product
    const { data: settings } = await adminClient
      .from('global_settings')
      .select('value')
      .eq('key', 'max_accounts')
      .single()
    const maxAccounts = settings?.value ? parseInt(settings.value) : 3

    const { error: insertError } = await adminClient
      .from('products')
      .insert({ ...productData, max_accounts: maxAccounts })
    error = insertError
  }

  if (error) {
    console.error('[PRODUCT_SAVE] Error:', error)
    const errorMessage = id ? 'Failed to update product' : 'Failed to create product'
    const redirectUrl = id ? `/admin/products/create?id=${id}&error=${encodeURIComponent(errorMessage)}` : `/admin/products/create?error=${encodeURIComponent(errorMessage)}`
    return redirect(redirectUrl)
  }

  console.log(`[PRODUCT_SAVE] ✅ Success (${id ? 'Updated' : 'Created'})`)
  revalidatePath('/admin/products')
  revalidatePath(`/admin/products/create?id=${id}`)
  const successMessage = id ? 'Product updated successfully' : 'Product created successfully'
  redirect('/admin/products?success=' + encodeURIComponent(successMessage))
}

export default async function CreateProductPage({ searchParams }: { searchParams: { id?: string } }) {
  const { user, adminClient } = await requireAdmin()
  const editMode = !!searchParams.id
  let product = null

  if (editMode) {
    const { data } = await adminClient
      .from('products')
      .select('*')
      .eq('id', searchParams.id)
      .single()
    product = data
  }

  const { data: categories } = await adminClient
    .from('ea_categories')
    .select('*')
    .order('name', { ascending: true })

  const { data: settings } = await adminClient
    .from('global_settings')
    .select('value')
    .eq('key', 'max_accounts')
    .single()

  const maxAccounts = settings?.value || '3'

  return (
    <AdminLayout user={user}>
      <Suspense>
        <Toast />
      </Suspense>
      <div className="page-transition max-w-4xl mx-auto">
        {/* Back Button */}
        <div className="mb-6">
          <Button variant="ghost" asChild className="gap-2 text-muted-foreground hover:text-foreground">
            <Link href="/admin/products">
              <ArrowLeft className="h-4 w-4" />
              Back to Products
            </Link>
          </Button>
        </div>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight mb-2 gradient-text">
            {editMode ? 'Edit EA' : 'Create New EA'}
          </h1>
          <p className="text-muted-foreground">
            {editMode ? 'Update the details for this Expert Advisor.' : 'Add a new Expert Advisor to your catalog.'}
          </p>
        </div>

        {/* Form Card */}
        <Card className="glass-card border-0 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Package className="h-6 w-6 text-neon" />
              Product Information
            </CardTitle>
            {!editMode && (
              <CardDescription>
                Max accounts per license will be set to the global default: {maxAccounts}
              </CardDescription>
            )}
          </CardHeader>
          <CardContent>
            <form action={createOrUpdateProduct} className="space-y-6">
              {editMode && <input type="hidden" name="id" value={product?.id} />}
              
              {/* Basic Info */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Product Name *</Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="Scalping EA Pro"
                    required
                    defaultValue={product?.name}
                    className="bg-background/50 border-border/50 focus:border-neon"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="price">Price (₹) *</Label>
                  <Input
                    id="price"
                    name="price"
                    type="number"
                    step="0.01"
                    placeholder="999.00"
                    required
                    defaultValue={product?.price}
                    className="bg-background/50 border-border/50 focus:border-neon"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <textarea
                  id="description"
                  name="description"
                  rows={3}
                  placeholder="A powerful scalping EA designed for..."
                  defaultValue={product?.description || ''}
                  className="flex w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 focus:border-neon"
                />
              </div>

              {/* Category & Platform */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="category_id">Category</Label>
                  <select
                    id="category_id"
                    name="category_id"
                    defaultValue={product?.category_id || ''}
                    className="flex h-10 w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 focus:border-neon"
                  >
                    <option value="">No Category</option>
                    {categories?.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.icon} {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="platform">Platform *</Label>
                  <select
                    id="platform"
                    name="platform"
                    required
                    defaultValue={product?.platform || 'MT5'}
                    className="flex h-10 w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 focus:border-neon"
                  >
                    <option value="MT5">MT5</option>
                    <option value="MT4">MT4</option>
                  </select>
                </div>
              </div>

              {/* Image URL */}
              <div className="space-y-2">
                <Label htmlFor="image_url">Image URL (Optional)</Label>
                <Input
                  id="image_url"
                  name="image_url"
                  type="url"
                  placeholder="https://example.com/ea-image.jpg"
                  defaultValue={product?.image_url || ''}
                  className="bg-background/50 border-border/50 focus:border-neon"
                />
                <p className="text-xs text-muted-foreground">
                  Upload image to any hosting service and paste the URL here
                </p>
              </div>

              {/* Features */}
              <div className="space-y-2">
                <Label htmlFor="features">Features (Optional)</Label>
                <Input
                  id="features"
                  name="features"
                  placeholder="Low drawdown, High win rate, 24/7 support"
                  defaultValue={Array.isArray(product?.features) ? product.features.join(', ') : ''}
                  className="bg-background/50 border-border/50 focus:border-neon"
                />
                <p className="text-xs text-muted-foreground">
                  Separate features with commas
                </p>
              </div>

              {/* Requirements */}
              <div className="space-y-2">
                <Label htmlFor="requirements">Requirements (Optional)</Label>
                <Input
                  id="requirements"
                  name="requirements"
                  placeholder="Min deposit: $500, ECN broker required, VPS recommended"
                  defaultValue={Array.isArray(product?.requirements) ? product.requirements.join(', ') : ''}
                  className="bg-background/50 border-border/50 focus:border-neon"
                />
                <p className="text-xs text-muted-foreground">
                  Separate requirements with commas
                </p>
              </div>

              {/* Featured Checkbox */}
              <div className="flex items-center space-x-3 pt-2">
                <input
                  type="checkbox"
                  id="is_featured"
                  name="is_featured"
                  defaultChecked={product?.is_featured}
                  className="peer h-4 w-4 shrink-0 rounded-sm border border-neon ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-neon data-[state=checked]:text-primary-foreground"
                />
                <Label htmlFor="is_featured" className="text-sm font-normal cursor-pointer">
                  Mark as Featured Product
                </Label>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end gap-4 pt-4">
                <Button variant="outline" asChild className="hover:bg-background/50 hover:border-border/80">
                  <Link href="/admin/products">Cancel</Link>
                </Button>
                <Button type="submit" className="h-11 gap-2 bg-gradient-neon text-black font-bold button-shine">
                  {editMode ? <Save className="h-4 w-4" /> : <Package className="h-4 w-4" />}
                  {editMode ? 'Save Changes' : 'Create Product'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}
