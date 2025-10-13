import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowRight, Check, Shield, Zap, BarChart } from 'lucide-react'

export default async function HomePage() {
  const supabase = await createClient()
  
  const { data: products } = await supabase
    .from('products')
    .select(`
      *,
      ea_categories(name, icon)
    `)
    .eq('is_featured', true)
    .order('created_at', { ascending: false })

  const features = [
    {
      icon: Shield,
      title: 'Secure Licensing',
      description: 'Advanced license validation with hardware protection and account limits.',
    },
    {
      icon: Zap,
      title: 'Instant Activation',
      description: 'Receive your license key instantly via email. Start trading within minutes.',
    },
    {
      icon: BarChart,
      title: 'Real-time Analytics',
      description: 'Track your EA performance with detailed analytics and usage statistics.',
    },
  ]

  return (
    <div className="page-transition">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 gradient-bg opacity-80"></div>
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-neon rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse delay-1000"></div>
        </div>
        
        <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8 z-10">
          <div className="text-center">
            <h1 className="text-5xl font-bold tracking-tight text-foreground sm:text-6xl lg:text-7xl">
              Professional MT5
              <span className="block gradient-text">
                Expert Advisors
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
              Advanced trading algorithms designed for consistent profits. Fully automated, secure licensing, and professional support.
            </p>
            <div className="mt-10 flex items-center justify-center gap-4">
              <Button asChild size="lg" className="h-12 px-8 text-base bg-gradient-neon text-black font-bold button-shine">
                <Link href="#products">
                  View Products
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-12 px-8 text-base hover:bg-background/50 hover:border-border/80">
                <Link href="/docs">
                  Documentation
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold gradient-text">Why Choose Mark8Pips?</h2>
            <p className="mt-4 text-muted-foreground">Industry-leading features for professional traders</p>
          </div>
          
          <div className="grid gap-8 md:grid-cols-3">
            {features.map((feature, i) => (
              <Card key={i} className="glass-card border-0 shadow-xl hover-lift text-center">
                <CardContent className="p-8">
                  <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-gradient-neon flex items-center justify-center">
                    <feature.icon className="h-8 w-8 text-black" />
                  </div>
                  <h3 className="mt-4 text-xl font-semibold text-foreground">{feature.title}</h3>
                  <p className="mt-2 text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Products Section */}
      <section id="products" className="py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold gradient-text">Featured Expert Advisors</h2>
            <p className="mt-4 text-muted-foreground">Choose the perfect EA for your trading strategy</p>
          </div>
          
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {products && products.length > 0 ? (
              products.map((product) => {
                const category = Array.isArray(product.ea_categories) 
                  ? product.ea_categories[0] 
                  : product.ea_categories

                return (
                  <Card key={product.id} className="glass-card border-0 shadow-xl hover-lift flex flex-col">
                    <CardHeader>
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-3">
                          {category?.icon && (
                            <span className="text-3xl">{category.icon}</span>
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
                        <ul className="text-sm space-y-2 text-muted-foreground">
                          {Array.isArray(product.features) && product.features.slice(0, 2).map((feature: string, i: number) => (
                            <li key={i} className="flex items-center gap-2">
                              <Check className="h-4 w-4 text-neon" />
                              <span>{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="mt-6 flex items-center justify-between">
                        <div>
                          <p className="text-3xl font-bold gradient-text">
                            ₹{product.price}
                          </p>
                          <p className="text-xs text-muted-foreground">one-time payment</p>
                        </div>
                        <Button asChild className="bg-gradient-neon text-black font-bold button-shine">
                          <Link href={`/checkout/${product.id}`}>
                            Buy Now <ArrowRight className="h-4 w-4 ml-2" />
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })
            ) : (
              <Card className="col-span-3 glass-card border-0 shadow-xl text-center py-16">
                <CardContent>
                  <h3 className="text-lg font-semibold text-foreground">No featured products available</h3>
                  <p className="text-sm text-muted-foreground mt-2">Please check back later.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
