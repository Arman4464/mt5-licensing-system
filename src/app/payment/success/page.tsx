import Link from 'next/link'
import { createClient } from '@supabase/supabase-js'
import { Suspense } from 'react'

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
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Successful!</h1>
        <p className="text-gray-600 mb-6">
          Thank you for your purchase. Your license has been generated.
        </p>

        {order && order.licenses && (
          <div className="bg-blue-50 rounded-lg p-6 mb-6">
            <p className="text-sm text-blue-600 font-semibold mb-2">Your License Key</p>
            <code className="block bg-white rounded px-4 py-3 font-mono text-lg font-bold text-gray-900 break-all">
              {order.licenses.license_key}
            </code>
            <p className="text-xs text-blue-600 mt-2">Also sent to your email</p>
          </div>
        )}

        <div className="space-y-3">
          <Link
            href="/portal"
            className="block w-full rounded-lg bg-blue-600 px-6 py-3 text-white font-semibold hover:bg-blue-700"
          >
            View My Licenses
          </Link>
          <Link
            href="/"
            className="block w-full rounded-lg border-2 border-gray-300 px-6 py-3 text-gray-700 font-semibold hover:bg-gray-50"
          >
            Back to Home
          </Link>
        </div>

        <p className="mt-6 text-xs text-gray-500">
          Need help? Contact support@mark8pips.com
        </p>
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
