import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(request: Request) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    const { product_id, user_email, duration_days } = await request.json()

    if (!product_id || !user_email || !duration_days) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      )
    }

    const { data: product } = await supabase
      .from('products')
      .select('*')
      .eq('id', product_id)
      .single()

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    const licenseKey = Array.from({ length: 4 }, () => {
      return Array.from({ length: 8 }, () =>
        chars.charAt(Math.floor(Math.random() * chars.length))
      ).join('')
    }).join('-')

    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + parseInt(duration_days))

    let userId
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', user_email)
      .maybeSingle()

    if (existingUser) {
      userId = existingUser.id
    } else {
      const { data: newUser, error: userError } = await supabase
        .from('users')
        .insert({
          email: user_email,
          full_name: user_email.split('@')[0],
        })
        .select('id')
        .single()

      if (userError) {
        return NextResponse.json({ error: userError.message }, { status: 500 })
      }
      userId = newUser?.id
    }

    const { error: licenseError } = await supabase
      .from('licenses')
      .insert({
        user_id: userId,
        product_id: product_id,
        license_key: licenseKey,
        status: 'active',
        expires_at: expiresAt.toISOString(),
      })

    if (licenseError) {
      return NextResponse.json({ error: licenseError.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      license_key: licenseKey,
      expires_at: expiresAt.toISOString(),
    })
  } catch (error) {
    console.error('License generation error:', error)
    return NextResponse.json({ error: 'Failed to generate license' }, { status: 500 })
  }
}
