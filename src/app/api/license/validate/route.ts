import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(request: Request) {
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  try {
    const body = await request.json()
    console.log('Validation request:', { license_key: body.license_key, account: body.account_number })
    
    const { 
      license_key, 
      account_number, 
      ip_address = 'unknown', 
      broker_server = 'unknown', 
      account_name = 'unknown', 
      broker_company = 'unknown'
    } = body

    if (!license_key || !account_number) {
      return NextResponse.json(
        { valid: false, message: 'License key and account number required' },
        { status: 400 }
      )
    }

    // Get license with product
    const { data: license, error: licenseError } = await supabase
      .from('licenses')
      .select('id, license_key, status, expires_at, product_id, products!inner(id, name, price, max_accounts)')
      .eq('license_key', license_key)
      .single()

    if (licenseError) {
      console.error('License query error:', licenseError)
      return NextResponse.json(
        { valid: false, message: 'Invalid license key' },
        { status: 404 }
      )
    }

    if (!license) {
      return NextResponse.json(
        { valid: false, message: 'License not found' },
        { status: 404 }
      )
    }

    // Check status
    if (license.status !== 'active') {
      return NextResponse.json(
        { valid: false, message: `License is ${license.status}` },
        { status: 403 }
      )
    }

    // Check expiration
    if (license.expires_at && new Date(license.expires_at) < new Date()) {
      await supabase
        .from('licenses')
        .update({ status: 'expired' })
        .eq('id', license.id)
      
      return NextResponse.json(
        { valid: false, message: 'License has expired' },
        { status: 403 }
      )
    }

    // Get existing accounts
    const { data: existingAccounts, error: accountsError } = await supabase
      .from('mt5_accounts')
      .select('id, account_number')
      .eq('license_id', license.id)

    if (accountsError) {
      console.error('Accounts query error:', accountsError)
    }

    const accountExists = existingAccounts?.find(acc => acc.account_number === account_number)
    let mt5AccountId = accountExists?.id

    // Check account limit
    if (!accountExists) {
      const product = Array.isArray(license.products) ? license.products[0] : license.products
      const maxAccounts = product?.max_accounts || 3
      const currentAccounts = existingAccounts?.length || 0
      
      if (currentAccounts >= maxAccounts) {
        return NextResponse.json(
          { 
            valid: false, 
            message: `Maximum ${maxAccounts} accounts reached. Remove an account first.`,
          },
          { status: 403 }
        )
      }

      // Register new account
      const { data: newAccount, error: insertError } = await supabase
        .from('mt5_accounts')
        .insert({
          license_id: license.id,
          account_number,
          account_name,
          broker_server,
          broker_company,
          ip_address,
          last_used_at: new Date().toISOString(),
        })
        .select('id')
        .single()

      if (insertError) {
        console.error('Account insert error:', insertError)
      } else {
        mt5AccountId = newAccount?.id
      }
    } else {
      // Update existing
      await supabase
        .from('mt5_accounts')
        .update({
          last_used_at: new Date().toISOString(),
          ip_address,
        })
        .eq('id', accountExists.id)
    }

    // Log usage
    await supabase.from('usage_logs').insert({
      license_id: license.id,
      mt5_account_id: mt5AccountId,
      event_type: 'validation',
      ip_address,
      metadata: {
        account_number,
        broker_server,
        timestamp: new Date().toISOString(),
      },
    })

    const accountsUsed = (existingAccounts?.length || 0) + (accountExists ? 0 : 1)
    const daysRemaining = license.expires_at 
      ? Math.ceil((new Date(license.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      : 999

    const product = Array.isArray(license.products) ? license.products[0] : license.products

    console.log('Validation successful:', { license_key, accounts_used: accountsUsed })

    return NextResponse.json({
      valid: true,
      message: 'License validated successfully',
      product_name: product?.name || 'Unknown',
      expires_at: license.expires_at,
      accounts_used: accountsUsed,
      max_accounts: product?.max_accounts || 3,
      days_remaining: daysRemaining
    }, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    })

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('Validation error:', errorMessage)
    return NextResponse.json(
      { valid: false, message: 'Server error: ' + errorMessage },
      { status: 500 }
    )
  }
}
