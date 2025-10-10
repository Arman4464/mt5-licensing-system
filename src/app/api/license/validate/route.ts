import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { license_key, account_number, ip_address, broker_server, account_name, broker_company } = await request.json()

    if (!license_key || !account_number) {
      return NextResponse.json(
        { valid: false, message: 'License key and account number required' },
        { status: 400 }
      )
    }

    // Check if license exists and is active
    const { data: license, error: licenseError } = await supabase
      .from('licenses')
      .select('*, products(*)')
      .eq('license_key', license_key)
      .single()

    if (licenseError || !license) {
      return NextResponse.json(
        { valid: false, message: 'Invalid license key' },
        { status: 404 }
      )
    }

    // Check if license is expired
    if (license.status !== 'active') {
      return NextResponse.json(
        { valid: false, message: 'License is not active' },
        { status: 403 }
      )
    }

    if (license.expires_at && new Date(license.expires_at) < new Date()) {
      return NextResponse.json(
        { valid: false, message: 'License has expired' },
        { status: 403 }
      )
    }

    // Check existing MT5 accounts for this license
    const { data: existingAccounts } = await supabase
      .from('mt5_accounts')
      .select('*')
      .eq('license_id', license.id)

    const accountExists = existingAccounts?.find(acc => acc.account_number === account_number)

    // If account doesn't exist, check if we've reached max accounts
    if (!accountExists) {
      const maxAccounts = license.products?.max_accounts || 3
      if (existingAccounts && existingAccounts.length >= maxAccounts) {
        return NextResponse.json(
          { valid: false, message: `Maximum ${maxAccounts} accounts allowed per license` },
          { status: 403 }
        )
      }

      // Register new account
      await supabase.from('mt5_accounts').insert({
        license_id: license.id,
        account_number,
        account_name,
        broker_server,
        broker_company,
        ip_address,
        last_used_at: new Date().toISOString(),
      })
    } else {
      // Update existing account's last used time
      await supabase
        .from('mt5_accounts')
        .update({
          last_used_at: new Date().toISOString(),
          ip_address,
        })
        .eq('id', accountExists.id)
    }

    // Log the validation
    await supabase.from('usage_logs').insert({
      license_id: license.id,
      mt5_account_id: accountExists?.id,
      event_type: 'validation',
      ip_address,
      metadata: {
        account_number,
        broker_server,
        timestamp: new Date().toISOString(),
      },
    })

    return NextResponse.json({
      valid: true,
      message: 'License validated successfully',
      product_name: license.products?.name,
      expires_at: license.expires_at,
      accounts_used: (existingAccounts?.length || 0) + (accountExists ? 0 : 1),
      max_accounts: license.products?.max_accounts || 3,
    })

  } catch (error) {
    console.error('Validation error:', error)
    return NextResponse.json(
      { valid: false, message: 'Server error during validation' },
      { status: 500 }
    )
  }
}
