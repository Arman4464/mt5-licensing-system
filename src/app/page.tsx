import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/utils/supabase/server'
import { 
  ArrowRight, 
  Zap, 
  Shield, 
  TrendingUp, 
  Award,
  CheckCircle,
  Star
} from 'lucide-react'

export default async function HomePage() {
  const supabase = await createClient()

  // Get featured products
  const { data: featuredProducts } = await supabase
    .from('products')
    .select('*, ea_categories(name, icon)')
    .eq('is_featured', true)
    .limit(3)

  // Get all categories
  const { data: categories } = await supabase
    .from('ea_categories')
    .select('*')
    .order('name', { ascending: true })

  return (
    <div className="min-h-screen gradient-bg font-sans">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <div className="text-2xl">📊</div>
              <span className="text-xl font-bold font-sans">
                Mark<span className="text-neon">8</span>Pips
              </span>
            </Link>

            <div className="hidden md:flex md:items-center md:gap-6">
              <Link href="/products" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
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
              <Button asChild className="bg-gradient-to-r from-neon to-green-400 hover:opacity-90 text-black button-shine">
                <Link href="/products">
                  Browse EAs
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-neon rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse delay-1000"></div>
        </div>

        <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
          <div className="text-center page-transition">
            <Badge className="mb-4 bg-neon/10 text-neon border-neon/20">
              🚀 Professional Trading Solutions
            </Badge>
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-6">
              Trade Smarter with
              <span className="gradient-text block mt-2">AI-Powered EAs</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
              Premium Expert Advisors for MT4 & MT5. Automated trading strategies backed by years of backtesting and real-world performance.
            </p>
            <div className="flex items-center justify-center gap-4">
              <Button size="lg" asChild className="bg-gradient-to-r from-neon to-green-400 hover:opacity-90 text-black button-shine">
                <Link href="/products">
                  Explore Products
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/about">Learn More</Link>
              </Button>
            </div>

            {/* Stats */}
            <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
              <div className="text-center">
                <p className="text-3xl font-bold text-neon">500+</p>
                <p className="text-sm text-muted-foreground mt-1">Active Traders</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-neon">₹2M+</p>
                <p className="text-sm text-muted-foreground mt-1">Total Profits</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-neon">4.9★</p>
                <p className="text-sm text-muted-foreground mt-1">User Rating</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-neon">24/7</p>
                <p className="text-sm text-muted-foreground mt-1">Support</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 border-t border-border/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Why Choose Mark8Pips?</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Professional trading tools built by traders, for traders
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="glass-card border-0 shadow-xl hover-lift">
              <CardHeader>
                <div className="mb-4 h-12 w-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <Zap className="h-6 w-6 text-blue-500" />
                </div>
                <CardTitle>Lightning Fast</CardTitle>
                <CardDescription>
                  Optimized execution speed ensures you never miss a trade opportunity
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="glass-card border-0 shadow-xl hover-lift">
              <CardHeader>
                <div className="mb-4 h-12 w-12 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <Shield className="h-6 w-6 text-emerald-500" />
                </div>
                <CardTitle>Risk Management</CardTitle>
                <CardDescription>
                  Advanced risk controls and money management systems built-in
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="glass-card border-0 shadow-xl hover-lift">
              <CardHeader>
                <div className="mb-4 h-12 w-12 rounded-lg bg-neon/10 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-neon" />
                </div>
                <CardTitle>Proven Results</CardTitle>
                <CardDescription>
                  Backtested strategies with real verified trading results
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      {featuredProducts && featuredProducts.length > 0 && (
        <section className="py-24 border-t border-border/50">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <Badge className="mb-4 bg-neon/10 text-neon border-neon/20">
                <Star className="h-3 w-3 mr-1" />
                Featured Products
              </Badge>
              <h2 className="text-3xl font-bold mb-4">Our Best Sellers</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Top-rated Expert Advisors trusted by traders worldwide
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {featuredProducts.map((product) => {
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
                          <Star className="h-4 w-4 text-neon fill-neon" />
                        </div>
                        <CardTitle className="text-xl">{product.name}</CardTitle>
                        {category && (
                          <CardDescription>{category.name}</CardDescription>
                        )}
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                          {product.description}
                        </p>
                        <div className="flex items-center justify-between">
                          <p className="text-2xl font-bold text-neon">
                            ₹{product.price}
                          </p>
                          <Button size="sm" className="gap-2 bg-gradient-to-r from-neon to-green-400 hover:opacity-90 text-black">
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

            <div className="text-center mt-12">
              <Button asChild variant="outline" size="lg">
                <Link href="/products">
                  View All Products
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* Categories */}
      {categories && categories.length > 0 && (
        <section className="py-24 border-t border-border/50">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold mb-4">Browse by Category</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Find the perfect EA for your trading style
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {categories.map((category) => (
                <Link key={category.id} href={`/products?category=${category.slug}`}>
                  <Card className="glass-card border-0 shadow-xl hover-lift text-center p-6 cursor-pointer">
                    <div className="text-4xl mb-3">{category.icon || '📁'}</div>
                    <h3 className="font-semibold mb-1">{category.name}</h3>
                    <p className="text-xs text-muted-foreground">
                      {category.description}
                    </p>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-24 border-t border-border/50">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="glass-card rounded-2xl p-12 border-0 shadow-2xl">
            <Award className="h-16 w-16 text-neon mx-auto mb-6" />
            <h2 className="text-3xl font-bold mb-4">Ready to Start Trading?</h2>
            <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join hundreds of traders who trust Mark8Pips for their automated trading needs. 
              Professional support and lifetime updates included.
            </p>
            <div className="flex items-center justify-center gap-4">
              <Button size="lg" asChild className="bg-gradient-to-r from-neon to-green-400 hover:opacity-90 text-black button-shine">
                <Link href="/products">
                  Get Started
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/contact">Contact Us</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="text-2xl">📊</div>
                <span className="text-lg font-bold font-sans">
                  Mark<span className="text-neon">8</span>Pips
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                Professional MT5 trading solutions
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Products</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/products" className="hover:text-foreground">All EAs</Link></li>
                <li><Link href="/products?category=mt5-scalpers" className="hover:text-foreground">Scalpers</Link></li>
                <li><Link href="/products?category=gold-trading" className="hover:text-foreground">Gold EAs</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/about" className="hover:text-foreground">About Us</Link></li>
                <li><Link href="/contact" className="hover:text-foreground">Contact</Link></li>
                <li><Link href="/auth/signin" className="hover:text-foreground">Sign In</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/contact" className="hover:text-foreground">Help Center</Link></li>
                <li><Link href="/dashboard" className="hover:text-foreground">My Licenses</Link></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-border/50 text-center text-sm text-muted-foreground">
            <p>© 2025 Mark8Pips. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
