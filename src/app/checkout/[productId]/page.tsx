import { createClient } from '@supabase/supabase-js'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'

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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl">🛡️</span>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Mark8Pips
            </span>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Product Summary */}
          <div className="rounded-lg bg-white p-8 shadow-sm ring-1 ring-gray-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Order Summary</h2>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{product.name}</h3>
                <p className="mt-2 text-sm text-gray-600">{product.description}</p>
              </div>

              <div className="border-t border-gray-200 pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">License Duration</span>
                  <span className="font-medium text-gray-900">{product.license_duration_days} days</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Max MT5 Accounts</span>
                  <span className="font-medium text-gray-900">{product.max_accounts}</span>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <div className="flex justify-between">
                  <span className="text-base font-medium text-gray-900">Total</span>
                  <span className="text-2xl font-bold text-blue-600">₹{product.price}</span>
                </div>
              </div>
            </div>

            <div className="mt-6 rounded-lg bg-blue-50 p-4">
              <h4 className="font-semibold text-blue-900 text-sm mb-2">What you&apos;ll get:</h4>
              <ul className="space-y-1 text-sm text-blue-700">
                <li>✓ Instant license key delivery via email</li>
                <li>✓ {product.license_duration_days} days of full access</li>
                <li>✓ Support for {product.max_accounts} MT5 accounts</li>
                <li>✓ 24/7 customer support</li>
                <li>✓ Free updates during license period</li>
              </ul>
            </div>
          </div>

          {/* Checkout Form */}
          <div className="rounded-lg bg-white p-8 shadow-sm ring-1 ring-gray-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Billing Information</h2>

            <form action={initiateCheckout} className="space-y-4">
              <input type="hidden" name="product_id" value={product.id} />

              <div>
                <label htmlFor="buyer_name" className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  id="buyer_name"
                  name="buyer_name"
                  required
                  className="block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label htmlFor="buyer_email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  id="buyer_email"
                  name="buyer_email"
                  required
                  className="block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="john@example.com"
                />
                <p className="mt-1 text-xs text-gray-500">License key will be sent to this email</p>
              </div>

              <div>
                <label htmlFor="buyer_phone" className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  id="buyer_phone"
                  name="buyer_phone"
                  required
                  className="block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="+91 1234567890"
                />
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  className="w-full rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-3 text-base font-semibold text-white shadow-lg hover:opacity-90 transition-opacity"
                >
                  Proceed to Payment - ₹{product.price}
                </button>
              </div>
            </form>

            <div className="mt-6 flex items-center justify-center gap-4 text-xs text-gray-500">
              <span>🔒 Secure Payment</span>
              <span>•</span>
              <span>Powered by Instamojo</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
