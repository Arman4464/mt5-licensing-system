import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function POST(request: NextRequest) {
  console.log('[VALIDATION] ==================== NEW VALIDATION REQUEST ====================')
  
  try {
    const body = await request.json()
    console.log('[VALIDATION] Request body:', body)

    const { license_key, account_number, broker_server, account_name, broker_company } = body

    if (!license_key || !account_number) {
      console.error('[VALIDATION] Missing required fields')
      return NextResponse.json(
        { valid: false, message: 'License key and account number required' },
        { status: 400 }
      )
    }

    // Get real IP address (proper header detection)
    const forwardedFor = request.headers.get('x-forwarded-for')
    const realIp = request.headers.get('x-real-ip')
    const cfConnectingIp = request.headers.get('cf-connecting-ip')

    const ipAddress = 
      cfConnectingIp || 
      (forwardedFor ? forwardedFor.split(',')[0].trim() : null) ||
      realIp ||
      'unknown'

    console.log('[VALIDATION] IP Detection:', {
      cfConnectingIp,
      forwardedFor,
      realIp,
      finalIp: ipAddress
    })

    const supabase = await createClient()

    // Get license with product info
    const { data: license, error: licenseError } = await supabase
      .from('licenses')
      .select('*, products(*)')
      .eq('license_key', license_key)
      .single()

    if (licenseError || !license) {
      console.error('[VALIDATION] License not found:', licenseError)
      return NextResponse.json(
        { valid: false, message: 'Invalid license key' },
        { status: 404 }
      )
    }

    console.log('[VALIDATION] License found:', {
      key: license.license_key,
      status: license.status,
      expires_at: license.expires_at
    })

    // Check if paused
    if (license.status === 'paused') {
      console.log('[VALIDATION] License is paused')
      return NextResponse.json(
        { valid: false, message: 'License is paused. Contact support.' },
        { status: 403 }
      )
    }

    // Check if suspended
    if (license.status === 'suspended') {
      console.log('[VALIDATION] License is suspended')
      return NextResponse.json(
        { valid: false, message: 'License suspended. Contact support.' },
        { status: 403 }
      )
    }

    // Check if expired
    if (license.status === 'expired' || (license.expires_at && new Date(license.expires_at) < new Date())) {
      console.log('[VALIDATION] License expired')
      return NextResponse.json(
        { valid: false, message: 'License expired. Please renew.' },
        { status: 403 }
      )
    }

    // Check IP whitelist (if enabled)
    const { data: ipWhitelist } = await supabase
      .from('ip_whitelist')
      .select('*')
      .eq('license_id', license.id)
      .eq('is_active', true)

    if (ipWhitelist && ipWhitelist.length > 0) {
      const isIpAllowed = ipWhitelist.some(entry => entry.ip_address === ipAddress)
      if (!isIpAllowed) {
        console.error('[VALIDATION] IP not whitelisted:', ipAddress)
        return NextResponse.json(
          { valid: false, message: 'IP address not authorized for this license' },
          { status: 403 }
        )
      }
    }

    // Get or create MT5 account
    const { data: existingAccount } = await supabase
      .from('mt5_accounts')
      .select('*')
      .eq('license_id', license.id)
      .eq('account_number', account_number)
      .single()

    if (existingAccount) {
      // Update last used
      await supabase
        .from('mt5_accounts')
        .update({ 
          last_used_at: new Date().toISOString(),
          ip_address: ipAddress
        })
        .eq('id', existingAccount.id)

      console.log('[VALIDATION] Existing account updated:', account_number)
    } else {
      // Check account limit
      const { data: accounts } = await supabase
        .from('mt5_accounts')
        .select('id')
        .eq('license_id', license.id)

      const product = Array.isArray(license.products) ? license.products[0] : license.products
      const maxAccounts = product?.max_accounts || 3

      if (accounts && accounts.length >= maxAccounts) {
        console.error('[VALIDATION] Account limit reached:', accounts.length)
        return NextResponse.json(
          { valid: false, message: `Maximum ${maxAccounts} accounts reached. Remove an account first.` },
          { status: 403 }
        )
      }

      // Register new account
      const { error: accountError } = await supabase
        .from('mt5_accounts')
        .insert({
          license_id: license.id,
          account_number,
          account_name,
          broker_server,
          broker_company,
          ip_address: ipAddress,
          last_used_at: new Date().toISOString(),
        })

      if (accountError) {
        console.error('[VALIDATION] Failed to register account:', accountError)
      } else {
        console.log('[VALIDATION] New account registered:', account_number)
      }
    }

    // Log validation
    await supabase
      .from('usage_logs')
      .insert({
        license_id: license.id,
        event_type: 'validation',
        ip_address: ipAddress,
        metadata: { account_number, broker_server }
      })

    // Update last validated
    await supabase
      .from('licenses')
      .update({ last_validated_at: new Date().toISOString() })
      .eq('id', license.id)

    const product = Array.isArray(license.products) ? license.products[0] : license.products
    const daysRemaining = license.expires_at 
      ? Math.ceil((new Date(license.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      : 999999

    const { data: accountCount } = await supabase
      .from('mt5_accounts')
      .select('id', { count: 'exact' })
      .eq('license_id', license.id)

    console.log('[VALIDATION] ✅ SUCCESS - License valid')
    
    return NextResponse.json({
      valid: true,
      message: 'License validated successfully',
      product_name: product?.name,
      expires_at: license.expires_at,
      accounts_used: accountCount?.length || 0,
      max_accounts: product?.max_accounts || 3,
      days_remaining: daysRemaining,
    })

  } catch (error) {
    console.error('[VALIDATION] ❌ Unexpected error:', error)
    return NextResponse.json(
      { valid: false, message: 'Validation failed. Try again.' },
      { status: 500 }
    )
  }
}
