import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

function generateLicenseKey(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  const segments = 4
  const segmentLength = 8
  
  const key = Array.from({ length: segments }, () => {
    return Array.from({ length: segmentLength }, () => 
      chars.charAt(Math.floor(Math.random() * chars.length))
    ).join('')
  }).join('-')
  
  return key
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { product_id, user_email, duration_days } = await request.json()

    if (!product_id) {
      return NextResponse.json(
        { error: 'Product ID required' },
        { status: 400 }
      )
    }

    // Get product details
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('*')
      .eq('id', product_id)
      .single()

    if (productError || !product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    // Find or create user
    let targetUserId = user.id
    
    if (user_email && user_email !== user.email) {
      const { data: targetUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', user_email)
        .single()
      
      if (targetUser) {
        targetUserId = targetUser.id
      }
    }

    // Generate license
    const licenseKey = generateLicenseKey()
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + (duration_days || product.license_duration_days || 365))

    const { data: license, error: licenseError } = await supabase
      .from('licenses')
      .insert({
        user_id: targetUserId,
        product_id,
        license_key: licenseKey,
        status: 'active',
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single()

    if (licenseError) {
      console.error('License creation error:', licenseError)
      return NextResponse.json(
        { error: 'Failed to create license' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      license_key: licenseKey,
      product_name: product.name,
      expires_at: expiresAt.toISOString(),
    })

  } catch (error) {
    console.error('Generation error:', error)
    return NextResponse.json(
      { error: 'Server error during generation' },
      { status: 500 }
    )
  }
}
