import { requireAdmin } from '@/utils/admin'
import { AdminNav } from '@/components/admin-nav'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Package } from 'lucide-react'

async function createProduct(formData: FormData) {
  'use server'
  
  const { adminClient } = await requireAdmin()
  
  const name = formData.get('name') as string
  const description = formData.get('description') as string
  const price = parseFloat(formData.get('price') as string)
  const categoryId = formData.get('category_id') as string
  const platform = formData.get('platform') as string
  const imageUrl = formData.get('image_url') as string
  const isFeatured = formData.get('is_featured') === 'on'

  // Parse features (comma-separated)
  const featuresRaw = formData.get('features') as string
  const features = featuresRaw ? featuresRaw.split(',').map(f => f.trim()).filter(Boolean) : []

  // Parse requirements (comma-separated)
  const requirementsRaw = formData.get('requirements') as string
  const requirements = requirementsRaw ? requirementsRaw.split(',').map(r => r.trim()).filter(Boolean) : []

  // Get global max_accounts
  const { data: settings } = await adminClient
    .from('global_settings')
    .select('value')
    .eq('key', 'max_accounts')
    .single()

  const maxAccounts = settings?.value ? parseInt(settings.value) : 3

  console.log('[PRODUCT-CREATE]', { name, price, categoryId, platform })

  const { error } = await adminClient
    .from('products')
    .insert({
      name,
      description,
      price,
      category_id: categoryId || null,
      platform,
      image_url: imageUrl || null,
      features,
      requirements,
      is_featured: isFeatured,
      max_accounts: maxAccounts,
    })

  if (error) {
    console.error('[PRODUCT-CREATE] Error:', error)
    revalidatePath('/admin/products')
    return redirect('/admin/products/create?error=' + encodeURIComponent('Failed to create product'))
  }

  console.log('[PRODUCT-CREATE] ✅ Success')
  revalidatePath('/admin/products')
  redirect('/admin/products?success=' + encodeURIComponent('Product created successfully'))
}

export default async function CreateProductPage() {
  const { user, adminClient } = await requireAdmin()

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
    <div className="min-h-screen gradient-bg">
      <AdminNav userEmail={user.email || ''} />

      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8 page-transition">
        {/* Back Button */}
        <div className="mb-6">
          <Button variant="ghost" asChild className="gap-2">
            <Link href="/admin/products">
              <ArrowLeft className="h-4 w-4" />
              Back to Products
            </Link>
          </Button>
        </div>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight mb-2">Create New EA</h1>
          <p className="text-muted-foreground">
            Add a new Expert Advisor to your catalog
          </p>
        </div>

        {/* Form Card */}
        <Card className="glass-card border-0 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-[#CFFF04]" />
              Product Information
            </CardTitle>
            <CardDescription>
              Fill in the details for your new EA. Max accounts per license: {maxAccounts}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={createProduct} className="space-y-6">
              {/* Basic Info */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Product Name *</Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="Scalping EA Pro"
                    required
                    className="bg-background/50 border-border/50 focus:border-[#CFFF04]"
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
                    className="bg-background/50 border-border/50 focus:border-[#CFFF04]"
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
                  className="flex w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 focus:border-[#CFFF04]"
                />
              </div>

              {/* Category & Platform */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="category_id">Category</Label>
                  <select
                    id="category_id"
                    name="category_id"
                    className="flex h-10 w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 focus:border-[#CFFF04]"
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
                    className="flex h-10 w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 focus:border-[#CFFF04]"
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
                  className="bg-background/50 border-border/50 focus:border-[#CFFF04]"
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
                  className="bg-background/50 border-border/50 focus:border-[#CFFF04]"
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
                  className="bg-background/50 border-border/50 focus:border-[#CFFF04]"
                />
                <p className="text-xs text-muted-foreground">
                  Separate requirements with commas
                </p>
              </div>

              {/* Featured Checkbox */}
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_featured"
                  name="is_featured"
                  className="h-4 w-4 rounded border-gray-300 text-[#CFFF04] focus:ring-[#CFFF04]"
                />
                <Label htmlFor="is_featured" className="text-sm font-normal cursor-pointer">
                  Mark as Featured Product
                </Label>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end gap-4 pt-4">
                <Button variant="outline" asChild>
                  <Link href="/admin/products">Cancel</Link>
                </Button>
                <Button type="submit" className="gap-2 bg-gradient-neon hover:opacity-90 text-black button-shine">
                  <Package className="h-4 w-4" />
                  Create Product
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
