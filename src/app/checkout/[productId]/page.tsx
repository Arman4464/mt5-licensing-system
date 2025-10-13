import { createClient } from '@supabase/supabase-js'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import {
  CreditCard,
  ShieldCheck,
  FileText,
  Clock,
  Users,
  Tag,
  Sparkles,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

async function initiateCheckout(formData: FormData) {
  'use server'

  const productId = formData.get('product_id') as string
  const buyerName = formData.get('buyer_name') as string
  const buyerEmail = formData.get('buyer_email') as string
  const buyerPhone = formData.get('buyer_phone') as string

  if (!productId || !buyerName || !buyerEmail || !buyerPhone) {
    redirect(`/checkout/${productId}?error=All fields are required`)
  }

  // Create payment request
  const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/payment/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      product_id: productId,
      buyer_name: buyerName,
      buyer_email: buyerEmail,
      buyer_phone: buyerPhone,
    }),
  })

  const result = await response.json()

  if (!response.ok || result.error) {
    redirect(`/checkout/${productId}?error=${result.error || 'Payment creation failed'}`)
  }

  // Redirect to payment URL
  redirect(result.payment_url)
}

export default async function CheckoutPage({
  params,
}: {
  params: { productId: string }
}) {
  const supabase = createClient(supabaseUrl, supabaseAnonKey)

  const { data: product } = await supabase
    .from('products')
    .select('*')
    .eq('id', params.productId)
    .single()

  if (!product) {
    notFound()
  }

  return (
    <div className="min-h-screen gradient-bg flex flex-col items-center justify-center p-4">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-neon rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse delay-1000"></div>
      </div>

      <main className="w-full max-w-4xl relative z-10 page-transition">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-2">
            <div className="text-4xl">📊</div>
            <h1 className="text-3xl font-bold">
              Mark<span className="gradient-text">8</span>Pips
            </h1>
          </Link>
          <p className="text-muted-foreground">Secure Checkout</p>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Product Summary */}
          <div className="glass-card p-8 border-0 shadow-2xl">
            <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
              <FileText className="text-neon" /> Order Summary
            </h2>

            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-foreground">{product.name}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{product.description}</p>
              </div>

              <div className="border-t border-border/50 pt-4 space-y-2">
                <div className="flex justify-between text-sm items-center">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <Clock className="h-4 w-4" /> License Duration
                  </span>
                  <span className="font-medium text-foreground">{product.license_duration_days} days</span>
                </div>
                <div className="flex justify-between text-sm items-center">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <Users className="h-4 w-4" /> Max MT5 Accounts
                  </span>
                  <span className="font-medium text-foreground">{product.max_accounts}</span>
                </div>
              </div>

              <div className="border-t border-border/50 pt-4">
                <div className="flex justify-between items-baseline">
                  <span className="text-base font-medium text-foreground flex items-center gap-2">
                    <Tag className="h-4 w-4" /> Total
                  </span>
                  <span className="text-3xl font-bold gradient-text">₹{product.price}</span>
                </div>
              </div>
            </div>

            <div className="mt-6 rounded-lg bg-background/30 p-4 border border-border/50">
              <h4 className="font-semibold text-neon text-sm mb-2">What you&apos;ll get:</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>✓ Instant license key delivery via email</li>
                <li>✓ {product.license_duration_days} days of full access</li>
                <li>✓ Support for {product.max_accounts} MT5 accounts</li>
                <li>✓ 24/7 customer support</li>
                <li>✓ Free updates during license period</li>
              </ul>
            </div>
          </div>

          {/* Checkout Form */}
          <div className="glass-card p-8 border-0 shadow-2xl">
            <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
              <CreditCard className="text-neon" /> Billing Information
            </h2>

            <form action={initiateCheckout} className="space-y-4">
              <input type="hidden" name="product_id" value={product.id} />

              <div>
                <Label htmlFor="buyer_name" className="block text-sm font-medium mb-1">
                  Full Name *
                </Label>
                <Input
                  type="text"
                  id="buyer_name"
                  name="buyer_name"
                  required
                  className="h-11 bg-background/50 border-border/50 focus:border-neon transition-colors"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <Label htmlFor="buyer_email" className="block text-sm font-medium mb-1">
                  Email Address *
                </Label>
                <Input
                  type="email"
                  id="buyer_email"
                  name="buyer_email"
                  required
                  className="h-11 bg-background/50 border-border/50 focus:border-neon transition-colors"
                  placeholder="john@example.com"
                />
                <p className="mt-1 text-xs text-muted-foreground">License key will be sent to this email</p>
              </div>

              <div>
                <Label htmlFor="buyer_phone" className="block text-sm font-medium mb-1">
                  Phone Number *
                </Label>
                <Input
                  type="tel"
                  id="buyer_phone"
                  name="buyer_phone"
                  required
                  className="h-11 bg-background/50 border-border/50 focus:border-neon transition-colors"
                  placeholder="+91 1234567890"
                />
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  className="w-full h-12 rounded-lg bg-gradient-neon text-black font-bold button-shine flex items-center justify-center gap-2"
                >
                  Proceed to Payment - ₹{product.price}
                </button>
              </div>
            </form>

            <div className="mt-6 flex items-center justify-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><ShieldCheck className="h-3 w-3 text-neon" /> Secure Payment</span>
              <span>•</span>
              <span>Powered by Instamojo</span>
            </div>
          </div>
        </div>
        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p className="flex items-center justify-center gap-1">
            <Sparkles className="h-3 w-3 text-neon" />
            Enterprise-grade security protecting your transaction
          </p>
        </div>
      </main>
    </div>
  )
}
