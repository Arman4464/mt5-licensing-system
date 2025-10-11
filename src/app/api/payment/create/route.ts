import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const INSTAMOJO_API_KEY = process.env.INSTAMOJO_API_KEY!
const INSTAMOJO_AUTH_TOKEN = process.env.INSTAMOJO_AUTH_TOKEN!
const INSTAMOJO_ENDPOINT = process.env.NODE_ENV === 'production' 
  ? 'https://www.instamojo.com/api/1.1/'
  : 'https://test.instamojo.com/api/1.1/'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(request: Request) {
  try {
    const { product_id, buyer_name, buyer_email, buyer_phone } = await request.json()

    if (!product_id || !buyer_name || !buyer_email || !buyer_phone) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
    }

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

    // Find or create user
    let userId
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', buyer_email)
      .maybeSingle()

    if (existingUser) {
      userId = existingUser.id
    } else {
      const { data: newUser } = await supabase
        .from('users')
        .insert({
          email: buyer_email,
          full_name: buyer_name,
        })
        .select('id')
        .single()
      userId = newUser?.id
    }

    // Create Instamojo payment request
    const paymentData = new URLSearchParams({
      purpose: `${product.name} License`,
      amount: product.price.toString(),
      buyer_name: buyer_name,
      email: buyer_email,
      phone: buyer_phone,
      redirect_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/success`,
      webhook: `${process.env.NEXT_PUBLIC_APP_URL}/api/payment/webhook`,
      send_email: 'True',
      send_sms: 'False',
      allow_repeated_payments: 'False',
    })

    const response = await fetch(`${INSTAMOJO_ENDPOINT}payment-requests/`, {
      method: 'POST',
      headers: {
        'X-Api-Key': INSTAMOJO_API_KEY,
        'X-Auth-Token': INSTAMOJO_AUTH_TOKEN,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: paymentData.toString(),
    })

    const result = await response.json()

    if (!result.success) {
      console.error('Instamojo error:', result)
      return NextResponse.json({ error: result.message || 'Payment creation failed' }, { status: 400 })
    }

    // Store order in database
    await supabase.from('orders').insert({
      user_id: userId,
      product_id: product_id,
      payment_request_id: result.payment_request.id,
      amount: product.price,
      buyer_email: buyer_email,
      buyer_name: buyer_name,
      buyer_phone: buyer_phone,
      payment_url: result.payment_request.longurl,
      status: 'pending',
      metadata: {
        product_name: product.name,
        license_duration_days: product.license_duration_days,
        max_accounts: product.max_accounts,
      },
    })

    return NextResponse.json({
      payment_url: result.payment_request.longurl,
      payment_request_id: result.payment_request.id,
    })
  } catch (error) {
    console.error('Payment creation error:', error)
    return NextResponse.json({ error: 'Payment failed' }, { status: 500 })
  }
}
