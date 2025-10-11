import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(request: Request) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    const { 
      license_key, 
      account_number, 
      ip_address, 
      broker_server, 
      account_name, 
      broker_company,
      terminal_name,
      terminal_build,
      terminal_company,
      computer_name,
      os_version
    } = await request.json()

    if (!license_key || !account_number) {
      return NextResponse.json(
        { valid: false, message: 'License key and account number required' },
        { status: 400 }
      )
    }

    // Get license with product details
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

    // Check license status
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

    // Check existing MT5 accounts
    const { data: existingAccounts } = await supabase
      .from('mt5_accounts')
      .select('*')
      .eq('license_id', license.id)

    const accountExists = existingAccounts?.find(acc => acc.account_number === account_number)
    let mt5AccountId = accountExists?.id

    // If account doesn't exist, check max limit
    if (!accountExists) {
      const maxAccounts = license.products?.max_accounts || 3
      const activeAccounts = existingAccounts?.filter(acc => acc.is_active).length || 0
      
      if (activeAccounts >= maxAccounts) {
        return NextResponse.json(
          { 
            valid: false, 
            message: `Maximum ${maxAccounts} accounts allowed. Deactivate an account first.`,
            current_accounts: activeAccounts,
            max_accounts: maxAccounts
          },
          { status: 403 }
        )
      }

      // Register new account with full details
      const { data: newAccount } = await supabase
        .from('mt5_accounts')
        .insert({
          license_id: license.id,
          account_number,
          account_name,
          broker_server,
          broker_company,
          ip_address,
          terminal_name,
          terminal_build,
          terminal_company,
          computer_name,
          os_version,
          first_seen_at: new Date().toISOString(),
          last_used_at: new Date().toISOString(),
          is_active: true
        })
        .select()
        .single()
      
      mt5AccountId = newAccount?.id
    } else {
      // Update existing account info
      await supabase
        .from('mt5_accounts')
        .update({
          last_used_at: new Date().toISOString(),
          ip_address,
          terminal_build,
          is_active: true
        })
        .eq('id', accountExists.id)
    }

    // Update last validated timestamp
    await supabase
      .from('licenses')
      .update({ last_validated_at: new Date().toISOString() })
      .eq('id', license.id)

    // Log validation with enhanced details
    await supabase.from('usage_logs').insert({
      license_id: license.id,
      mt5_account_id: mt5AccountId,
      event_type: 'validation',
      ip_address,
      metadata: {
        account_number,
        broker_server,
        broker_company,
        terminal_name,
        terminal_build,
        computer_name,
        os_version,
        timestamp: new Date().toISOString(),
      },
    })

    // Update or create active session
    await supabase
      .from('active_sessions')
      .upsert({
        license_id: license.id,
        mt5_account_id: mt5AccountId,
        last_heartbeat: new Date().toISOString(),
        is_online: true,
        ip_address,
        terminal_info: {
          name: terminal_name,
          build: terminal_build,
          company: terminal_company
        }
      }, {
        onConflict: 'license_id,mt5_account_id'
      })

    const accountsUsed = (existingAccounts?.filter(a => a.is_active).length || 0) + (accountExists ? 0 : 1)

    return NextResponse.json({
      valid: true,
      message: 'License validated successfully',
      product_name: license.products?.name,
      expires_at: license.expires_at,
      accounts_used: accountsUsed,
      max_accounts: license.products?.max_accounts || 3,
      days_remaining: license.expires_at 
        ? Math.ceil((new Date(license.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        : null
    })

  } catch (error) {
    console.error('Validation error:', error)
    return NextResponse.json(
      { valid: false, message: 'Server error during validation' },
      { status: 500 }
    )
  }
}
