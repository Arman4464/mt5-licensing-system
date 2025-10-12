import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/utils/supabase/server'
import { ArrowRight, Star, Filter, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: { category?: string; search?: string }
}) {
  const supabase = await createClient()

  const categorySlug = searchParams.category
  const searchQuery = searchParams.search

  // Get products with filtering
  let query = supabase
    .from('products')
    .select('*, ea_categories(name, icon, slug)')
    .order('is_featured', { ascending: false })
    .order('created_at', { ascending: false })

  if (categorySlug) {
    const { data: category } = await supabase
      .from('ea_categories')
      .select('id')
      .eq('slug', categorySlug)
      .single()

    if (category) {
      query = query.eq('category_id', category.id)
    }
  }

  if (searchQuery) {
    query = query.or(`name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`)
  }

  const { data: products } = await query

  // Get all categories for filter
  const { data: categories } = await supabase
    .from('ea_categories')
    .select('*')
    .order('name', { ascending: true })

  return (
    <div className="min-h-screen gradient-bg">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <div className="text-2xl">📊</div>
              <span className="text-xl font-bold">
                Mark<span className="text-[#CFFF04]">8</span>Pips
              </span>
            </Link>

            <div className="hidden md:flex md:items-center md:gap-6">
              <Link href="/products" className="text-sm font-medium text-foreground">
                Products
              </Link>
              <Link href="/about" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                About
              </Link>
              <Link href="/contact" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Contact
              </Link>
            </div>

            <div className="flex items-center gap-3">
              <Button variant="ghost" asChild>
                <Link href="/auth/signin">Sign In</Link>
              </Button>
              <Button asChild className="bg-gradient-neon hover:opacity-90 text-black button-shine">
                <Link href="/dashboard">My Licenses</Link>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 page-transition">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold tracking-tight mb-4">
            Expert Advisors Marketplace
          </h1>
          <p className="text-muted-foreground text-lg">
            Professional trading robots for MT4 & MT5
          </p>
        </div>

        {/* Search & Filter */}
        <div className="mb-8 flex flex-col md:flex-row gap-4">
          <form method="get" className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                name="search"
                placeholder="Search products..."
                defaultValue={searchQuery}
                className="pl-10 bg-background/50 border-border/50 focus:border-[#CFFF04]"
              />
            </div>
          </form>
          <div className="flex gap-2 overflow-x-auto">
            <Link href="/products">
              <Badge variant={!categorySlug ? 'default' : 'outline'} className="cursor-pointer whitespace-nowrap">
                All Products
              </Badge>
            </Link>
            {categories?.map((category) => (
              <Link key={category.id} href={`/products?category=${category.slug}`}>
                <Badge 
                  variant={categorySlug === category.slug ? 'default' : 'outline'}
                  className="cursor-pointer whitespace-nowrap"
                >
                  {category.icon} {category.name}
                </Badge>
              </Link>
            ))}
          </div>
        </div>

        {/* Products Grid */}
        {products && products.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => {
              const category = Array.isArray(product.ea_categories) 
                ? product.ea_categories[0] 
                : product.ea_categories

              return (
                <Link key={product.id} href={`/products/${product.id}`}>
                  <Card className="glass-card border-0 shadow-xl hover-lift h-full">
                    <CardHeader>
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {category?.icon && (
                            <span className="text-2xl">{category.icon}</span>
                          )}
                          <Badge variant={product.platform === 'MT5' ? 'default' : 'secondary'}>
                            {product.platform}
                          </Badge>
                        </div>
                        {product.is_featured && (
                          <Star className="h-4 w-4 text-[#CFFF04] fill-[#CFFF04]" />
                        )}
                      </div>
                      <CardTitle className="text-xl">{product.name}</CardTitle>
                      {category && (
                        <CardDescription>{category.name}</CardDescription>
                      )}
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                        {product.description || 'No description available'}
                      </p>

                      {product.features && product.features.length > 0 && (
                        <div className="mb-4 space-y-1">
                          {product.features.slice(0, 3).map((feature: string, index: number) => (
                            <p key={index} className="text-xs text-muted-foreground flex items-center gap-1">
                              <span className="text-[#CFFF04]">✓</span> {feature}
                            </p>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-4 border-t border-border/50">
                        <p className="text-2xl font-bold text-[#CFFF04]">
                          ₹{product.price}
                        </p>
                        <Button size="sm" className="gap-2 bg-gradient-neon hover:opacity-90 text-black">
                          View Details
                          <ArrowRight className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>
        ) : (
          <Card className="glass-card border-0 shadow-xl">
            <CardContent className="text-center py-16">
              <div className="text-4xl mb-4">🔍</div>
              <h3 className="text-lg font-semibold mb-2">No products found</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {searchQuery ? 'Try a different search term' : 'No products in this category yet'}
              </p>
              <Button asChild variant="outline">
                <Link href="/products">View All Products</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
