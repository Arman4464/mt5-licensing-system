import { requireAdmin } from '@/utils/admin'
import { AdminNav } from '@/components/admin-nav'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { Folder, Plus, Trash2 } from 'lucide-react'

async function createCategory(formData: FormData) {
  'use server'
  
  const { adminClient } = await requireAdmin()
  
  const name = formData.get('name') as string
  const description = formData.get('description') as string
  const icon = formData.get('icon') as string
  const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')

  console.log('[CATEGORY-CREATE]', { name, slug })

  const { error } = await adminClient
    .from('ea_categories')
    .insert({ name, slug, description, icon })

  if (error) {
    console.error('[CATEGORY-CREATE] Error:', error)
    revalidatePath('/admin/categories')
    return redirect('/admin/categories?error=' + encodeURIComponent('Failed to create category'))
  }

  console.log('[CATEGORY-CREATE] ✅ Success')
  revalidatePath('/admin/categories')
  redirect('/admin/categories?success=' + encodeURIComponent('Category created successfully'))
}

async function deleteCategory(formData: FormData) {
  'use server'
  
  const { adminClient } = await requireAdmin()
  const id = formData.get('id') as string

  console.log('[CATEGORY-DELETE]', id)

  const { error } = await adminClient
    .from('ea_categories')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('[CATEGORY-DELETE] Error:', error)
    revalidatePath('/admin/categories')
    return redirect('/admin/categories?error=' + encodeURIComponent('Failed to delete category'))
  }

  console.log('[CATEGORY-DELETE] ✅ Success')
  revalidatePath('/admin/categories')
  redirect('/admin/categories?success=' + encodeURIComponent('Category deleted successfully'))
}

export default async function CategoriesPage() {
  const { user, adminClient } = await requireAdmin()

  const { data: categories } = await adminClient
    .from('ea_categories')
    .select('*, products(count)')
    .order('created_at', { ascending: true })

  return (
    <div className="min-h-screen gradient-bg">
      <AdminNav userEmail={user.email || ''} />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 page-transition">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight mb-2">EA Categories</h1>
          <p className="text-muted-foreground">
            Organize your Expert Advisors into categories
          </p>
        </div>

        {/* Create Category Card */}
        <Card className="mb-8 glass-card border-0 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-[#CFFF04]" />
              Create New Category
            </CardTitle>
            <CardDescription>
              Add a new category for organizing your EAs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={createCategory} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="name">Category Name *</Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="MT5 Scalpers"
                    required
                    className="bg-background/50 border-border/50 focus:border-[#CFFF04]"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="icon">Icon (Emoji)</Label>
                  <Input
                    id="icon"
                    name="icon"
                    placeholder="⚡"
                    maxLength={2}
                    className="bg-background/50 border-border/50 focus:border-[#CFFF04]"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    name="description"
                    placeholder="Fast scalping strategies"
                    className="bg-background/50 border-border/50 focus:border-[#CFFF04]"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button type="submit" className="gap-2 bg-gradient-neon hover:opacity-90 text-black button-shine">
                  <Plus className="h-4 w-4" />
                  Create Category
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Categories List */}
        <Card className="glass-card border-0 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Folder className="h-5 w-5 text-[#CFFF04]" />
              All Categories
            </CardTitle>
            <CardDescription>
              {categories?.length || 0} categories total
            </CardDescription>
          </CardHeader>
          <CardContent>
            {categories && categories.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {categories.map((category) => (
                  <div
                    key={category.id}
                    className="stat-card glass-card rounded-lg p-4 border border-border/50"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="text-3xl">{category.icon || '📁'}</div>
                        <div>
                          <h3 className="font-semibold text-lg">{category.name}</h3>
                          <p className="text-xs text-muted-foreground">{category.slug}</p>
                        </div>
                      </div>
                      <form action={deleteCategory}>
                        <input type="hidden" name="id" value={category.id} />
                        <Button
                          type="submit"
                          variant="ghost"
                          size="icon"
                          className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </form>
                    </div>
                    
                    {category.description && (
                      <p className="text-sm text-muted-foreground mb-3">
                        {category.description}
                      </p>
                    )}

                    <Badge variant="secondary" className="text-xs">
                      {category.products?.[0]?.count || 0} EAs
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Folder className="mx-auto h-12 w-12 text-muted-foreground/50 mb-3" />
                <p className="text-sm text-muted-foreground">No categories yet</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Create your first category above
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
