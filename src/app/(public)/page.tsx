import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export default async function HomePage() {
  const supabase = createClient(supabaseUrl, supabaseAnonKey)
  
  const { data: products } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <main>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-5xl font-bold tracking-tight text-gray-900 sm:text-6xl lg:text-7xl">
              Professional MT5
              <span className="block bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Expert Advisors
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-600">
              Advanced trading algorithms designed for consistent profits. Fully automated, secure licensing, and professional support.
            </p>
            <div className="mt-10 flex items-center justify-center gap-4">
              <Link
                href="#products"
                className="rounded-full bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-4 text-lg font-semibold text-white shadow-lg hover:opacity-90"
              >
                View Products
              </Link>
              <Link
                href="/docs"
                className="rounded-full border-2 border-gray-300 px-8 py-4 text-lg font-semibold text-gray-700 hover:border-gray-400"
              >
                Documentation
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="bg-white py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900">Why Choose Mark8Pips?</h2>
            <p className="mt-4 text-gray-600">Industry-leading features for professional traders</p>
          </div>
          
          <div className="mt-16 grid gap-8 md:grid-cols-3">
            <div className="rounded-2xl border border-gray-200 p-8 hover:shadow-lg transition-shadow">
              <div className="text-4xl">🔐</div>
              <h3 className="mt-4 text-xl font-semibold text-gray-900">Secure Licensing</h3>
              <p className="mt-2 text-gray-600">
                Advanced license validation system with hardware protection and account limits
              </p>
            </div>
            
            <div className="rounded-2xl border border-gray-200 p-8 hover:shadow-lg transition-shadow">
              <div className="text-4xl">⚡</div>
              <h3 className="mt-4 text-xl font-semibold text-gray-900">Instant Activation</h3>
              <p className="mt-2 text-gray-600">
                Receive your license key instantly via email. Start trading within minutes
              </p>
            </div>
            
            <div className="rounded-2xl border border-gray-200 p-8 hover:shadow-lg transition-shadow">
              <div className="text-4xl">📊</div>
              <h3 className="mt-4 text-xl font-semibold text-gray-900">Real-time Analytics</h3>
              <p className="mt-2 text-gray-600">
                Track your EA performance with detailed analytics and usage statistics
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Products Section */}
      <section id="products" className="bg-gray-50 py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900">Our Expert Advisors</h2>
            <p className="mt-4 text-gray-600">Choose the perfect EA for your trading strategy</p>
          </div>
          
          <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {products && products.length > 0 ? (
              products.map((product) => (
                <div
                  key={product.id}
                  className="rounded-2xl border border-gray-200 bg-white p-8 hover:shadow-xl transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{product.name}</h3>
                      <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                        {product.description || 'Professional trading algorithm'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-6 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Duration:</span>
                      <span className="font-semibold text-gray-900">
                        {product.license_duration_days} days
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Max Accounts:</span>
                      <span className="font-semibold text-gray-900">{product.max_accounts}</span>
                    </div>
                  </div>
                  
                  <div className="mt-6 flex items-center justify-between">
                    <div>
                      <p className="text-3xl font-bold text-gray-900">${product.price}</p>
                      <p className="text-xs text-gray-500">one-time payment</p>
                    </div>
                    <Link
                      href={`/product/${product.id}`}
                      className="rounded-full bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700"
                    >
                      Buy Now
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-3 text-center py-12 text-gray-500">
                No products available yet
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  )
}
