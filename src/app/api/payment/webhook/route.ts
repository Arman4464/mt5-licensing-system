import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendLicenseCreatedEmail } from '@/lib/email'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const paymentStatus = formData.get('status')
    const paymentId = formData.get('payment_id') as string
    const paymentRequestId = formData.get('payment_request_id') as string
    const buyerEmail = formData.get('buyer_email') as string

    console.log('Webhook received:', { paymentStatus, paymentId, paymentRequestId })

    if (paymentStatus !== 'Credit') {
      console.log('Payment not completed:', paymentStatus)
      return NextResponse.json({ message: 'Payment not completed' })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { data: order } = await supabase
      .from('orders')
      .select('*, products(*), users(id)')
      .eq('payment_request_id', paymentRequestId)
      .single()

    if (!order) {
      console.error('Order not found for payment_request_id:', paymentRequestId)
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    if (order.status === 'completed') {
      console.log('Order already processed:', order.id)
      return NextResponse.json({ message: 'Already processed' })
    }

    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    const licenseKey = Array.from({ length: 4 }, () => {
      return Array.from({ length: 8 }, () =>
        chars.charAt(Math.floor(Math.random() * chars.length))
      ).join('')
    }).join('-')

    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + order.products.license_duration_days)

    const { data: license, error: licenseError } = await supabase
      .from('licenses')
      .insert({
        user_id: order.user_id,
        product_id: order.product_id,
        license_key: licenseKey,
        status: 'active',
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single()

    if (licenseError) {
      console.error('License creation error:', licenseError)
      return NextResponse.json({ error: 'License creation failed' }, { status: 500 })
    }

    await supabase
      .from('orders')
      .update({
        payment_id: paymentId,
        license_id: license.id,
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('id', order.id)

    try {
      await sendLicenseCreatedEmail(
        buyerEmail,
        licenseKey,
        order.products.name,
        expiresAt.toISOString()
      )
      console.log('✅ License email sent to:', buyerEmail)
    } catch (emailError) {
      console.error('❌ Email send failed:', emailError)
    }

    console.log('✅ License auto-generated:', licenseKey, 'for', buyerEmail)

    return NextResponse.json({ success: true, license_key: licenseKey })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}
