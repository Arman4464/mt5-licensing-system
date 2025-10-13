import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/utils/supabase/server'
import { notFound } from 'next/navigation'
import { 
  ArrowLeft, 
  Star, 
  CheckCircle, 
  Shield,
  TrendingUp,
  Clock,
  Award
} from 'lucide-react'

export default async function ProductDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = await createClient()

  const { data: product } = await supabase
    .from('products')
    .select('*, ea_categories(name, icon)')
    .eq('id', params.id)
    .single()

  if (!product) {
    notFound()
  }

  const category = Array.isArray(product.ea_categories) 
    ? product.ea_categories[0] 
    : product.ea_categories

  return (
    <div className="min-h-screen gradient-bg">
      <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8 page-transition">
        {/* Back Button */}
        <div className="mb-6">
          <Button variant="ghost" asChild>
            <Link href="/products">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Products
            </Link>
          </Button>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Product Header */}
            <Card className="glass-card border-0 shadow-xl">
              <CardHeader>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {category?.icon && (
                      <span className="text-4xl">{category.icon}</span>
                    )}
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant={product.platform === 'MT5' ? 'default' : 'secondary'}>
                          {product.platform}
                        </Badge>
                        {product.is_featured && (
                          <Badge className="bg-[#CFFF04]/10 text-[#CFFF04] border-[#CFFF04]/20">
                            <Star className="h-3 w-3 mr-1 fill-[#CFFF04]" />
                            Featured
                          </Badge>
                        )}
                      </div>
                      <h1 className="text-3xl font-bold">{product.name}</h1>
                      {category && (
                        <p className="text-muted-foreground">{category.name}</p>
                      )}
                    </div>
                  </div>
                </div>
                <p className="text-muted-foreground">
                  {product.description || 'Professional Expert Advisor for automated trading'}
                </p>
              </CardHeader>
            </Card>

            {/* Features */}
            {product.features && product.features.length > 0 && (
              <Card className="glass-card border-0 shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-[#CFFF04]" />
                    Key Features
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-3">
                    {product.features.map((feature: string, index: number) => (
                      <div key={index} className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-[#CFFF04] mt-0.5 flex-shrink-0" />
                        <p className="text-sm">{feature}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Requirements */}
            {product.requirements && product.requirements.length > 0 && (
              <Card className="glass-card border-0 shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-blue-500" />
                    Requirements
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {product.requirements.map((req: string, index: number) => (
                      <p key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                        <span className="text-blue-500">•</span> {req}
                      </p>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Purchase Card */}
            <Card className="glass-card border-0 shadow-xl sticky top-24">
              <CardContent className="p-6">
                <div className="mb-6">
                  <p className="text-sm text-muted-foreground mb-2">Price</p>
                  <p className="text-4xl font-bold text-[#CFFF04]">₹{product.price}</p>
                </div>

                <Button size="lg" className="w-full mb-4 bg-gradient-neon hover:opacity-90 text-black button-shine">
                  Purchase Now
                </Button>

                <div className="space-y-3 pt-4 border-t border-border/50">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle className="h-4 w-4 text-[#CFFF04]" />
                    <span>Lifetime updates</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle className="h-4 w-4 text-[#CFFF04]" />
                    <span>24/7 support</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle className="h-4 w-4 text-[#CFFF04]" />
                    <span>{product.max_accounts || 3} MT5 accounts</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle className="h-4 w-4 text-[#CFFF04]" />
                    <span>Instant delivery</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Info Cards */}
            <Card className="glass-card border-0 shadow-xl">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Proven Strategy</p>
                    <p className="text-xs text-muted-foreground">Backtested results</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-[#CFFF04]/10 flex items-center justify-center">
                    <Clock className="h-5 w-5 text-[#CFFF04]" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">24/7 Trading</p>
                    <p className="text-xs text-muted-foreground">Fully automated</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
                    <Award className="h-5 w-5 text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Professional Grade</p>
                    <p className="text-xs text-muted-foreground">Used by traders</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
