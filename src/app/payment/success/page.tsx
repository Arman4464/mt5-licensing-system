import Link from 'next/link'
import { createClient } from '@supabase/supabase-js'
import { Suspense } from 'react'
import { CheckCircle, Home, LayoutDashboard } from 'lucide-react'
import { CopyLicenseButton } from '@/components/copy-license-button'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

async function PaymentSuccessContent({
  searchParams,
}: {
  searchParams: { payment_id?: string; payment_request_id?: string }
}) {
  const supabase = createClient(supabaseUrl, supabaseAnonKey)

  let order = null
  if (searchParams.payment_request_id) {
    const { data } = await supabase
      .from('orders')
      .select('*, products(name), licenses(license_key)')
      .eq('payment_request_id', searchParams.payment_request_id)
      .single()
    order = data
  }

  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md relative z-10 page-transition">
        <div className="glass-card border-0 shadow-2xl p-8 text-center">
          <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6 ring-4 ring-green-500/30">
            <CheckCircle className="w-10 h-10 text-neon" />
          </div>

          <h1 className="text-3xl font-bold text-foreground mb-2">Payment Successful!</h1>
          <p className="text-muted-foreground mb-6">
            Thank you for your purchase. Your license has been generated and sent to your email.
          </p>

          {order && order.licenses && (
            <div className="bg-background/50 rounded-lg p-4 mb-6 border border-border/50">
              <p className="text-sm text-muted-foreground font-semibold mb-2">Your License Key</p>
              <div className="flex items-center justify-between p-3 rounded-lg bg-background/50">
                <code className="block font-mono text-lg font-bold text-neon break-all text-left">
                  {order.licenses.license_key}
                </code>
                <CopyLicenseButton licenseKey={order.licenses.license_key} />
              </div>
            </div>
          )}

          <div className="space-y-3">
            <Link
              href="/dashboard"
              className="flex items-center justify-center w-full h-11 rounded-lg bg-gradient-neon text-black font-bold button-shine"
            >
              <LayoutDashboard className="h-4 w-4 mr-2" />
              View My Licenses
            </Link>
            <Link
              href="/"
              className="flex items-center justify-center w-full h-11 rounded-lg border-2 border-border/50 text-foreground font-semibold hover:bg-background/50 hover:border-neon transition-colors"
            >
              <Home className="h-4 w-4 mr-2" />
              Back to Home
            </Link>
          </div>

          <p className="mt-6 text-xs text-muted-foreground">
            Need help? Contact <a href="mailto:support@mark8pips.com" className="text-neon hover:underline">support@mark8pips.com</a>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function PaymentSuccessPage({
  searchParams,
}: {
  searchParams: { payment_id?: string; payment_request_id?: string }
}) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PaymentSuccessContent searchParams={searchParams} />
    </Suspense>
  )
}
