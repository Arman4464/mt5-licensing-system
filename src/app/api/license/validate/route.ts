import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(request: Request) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    const body = await request.json()
    const { 
      license_key, 
      account_number, 
      ip_address, 
      broker_server, 
      account_name, 
      broker_company
    } = body

    if (!license_key || !account_number) {
      return NextResponse.json(
        { valid: false, message: 'License key and account number required' },
        { status: 400 }
      )
    }

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

    if (license.status !== 'active') {
      return NextResponse.json(
        { valid: false, message: `License is ${license.status}` },
        { status: 403 }
      )
    }

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

    const { data: existingAccounts } = await supabase
      .from('mt5_accounts')
      .select('*')
      .eq('license_id', license.id)

    const accountExists = existingAccounts?.find(acc => acc.account_number === account_number)
    let mt5AccountId = accountExists?.id

    if (!accountExists) {
      const maxAccounts = license.products?.max_accounts || 3
      const activeAccounts = existingAccounts?.length || 0
      
      if (activeAccounts >= maxAccounts) {
        return NextResponse.json(
          { 
            valid: false, 
            message: `Maximum ${maxAccounts} accounts allowed`,
          },
          { status: 403 }
        )
      }

      const { data: newAccount } = await supabase
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
        .select()
        .single()
      
      mt5AccountId = newAccount?.id
    } else {
      await supabase
        .from('mt5_accounts')
        .update({
          last_used_at: new Date().toISOString(),
          ip_address,
        })
        .eq('id', accountExists.id)
    }

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
      : null

    return NextResponse.json({
      valid: true,
      message: 'License validated successfully',
      product_name: license.products?.name,
      expires_at: license.expires_at,
      accounts_used: accountsUsed,
      max_accounts: license.products?.max_accounts || 3,
      days_remaining: daysRemaining
    })

  } catch (error) {
    console.error('Validation error:', error)
    return NextResponse.json(
      { valid: false, message: 'Server error during validation' },
      { status: 500 }
    )
  }
}
