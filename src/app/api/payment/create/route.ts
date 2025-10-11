import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const INSTAMOJO_API_KEY = process.env.INSTAMOJO_API_KEY!
const INSTAMOJO_AUTH_TOKEN = process.env.INSTAMOJO_AUTH_TOKEN!
const INSTAMOJO_ENDPOINT = process.env.NODE_ENV === 'production' 
  ? 'https://www.instamojo.com/api/1.1/'
  : 'https://test.instamojo.com/api/1.1/'

export async function POST(request: Request) {
  try {
    const { product_id, user_email } = await request.json()

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get product details
    const { data: product } = await supabase
      .from('products')
      .select('*')
      .eq('id', product_id)
      .single()

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // Create Instamojo payment request
    const paymentData = {
      purpose: `${product.name} License`,
      amount: product.price,
      buyer_name: user_email.split('@')[0],
      email: user_email,
      redirect_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/success`,
      webhook: `${process.env.NEXT_PUBLIC_APP_URL}/api/payment/webhook`,
      send_email: true,
      send_sms: false,
      allow_repeated_payments: false,
    }

    const response = await fetch(`${INSTAMOJO_ENDPOINT}payment-requests/`, {
      method: 'POST',
      headers: {
        'X-Api-Key': INSTAMOJO_API_KEY,
        'X-Auth-Token': INSTAMOJO_AUTH_TOKEN,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(paymentData),
    })

    const result = await response.json()

    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 400 })
    }

    return NextResponse.json({
      payment_url: result.payment_request.longurl,
      payment_id: result.payment_request.id,
    })
  } catch (error) {
    console.error('Payment creation error:', error)
    return NextResponse.json({ error: 'Payment failed' }, { status: 500 })
  }
}
