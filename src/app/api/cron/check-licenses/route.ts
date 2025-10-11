import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { sendLicenseExpiringEmail, sendLicenseExpiredEmail } from '@/lib/email'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  try {
    const now = new Date()
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

    // Find licenses expiring in 7 days
    const { data: expiringSoon } = await supabase
      .from('licenses')
      .select('*, products(name), users(email)')
      .eq('status', 'active')
      .gte('expires_at', now.toISOString())
      .lte('expires_at', sevenDaysFromNow.toISOString())

    // Send expiring emails
    for (const license of expiringSoon || []) {
      const daysRemaining = Math.ceil(
        (new Date(license.expires_at).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      )
      
      await sendLicenseExpiringEmail(
        license.users.email,
        license.license_key,
        license.products.name,
        daysRemaining
      )
    }

    // Find and expire old licenses
    const { data: expired } = await supabase
      .from('licenses')
      .select('*, products(name), users(email)')
      .eq('status', 'active')
      .lt('expires_at', now.toISOString())

    // Update expired licenses
    for (const license of expired || []) {
      await supabase
        .from('licenses')
        .update({ status: 'expired' })
        .eq('id', license.id)

      await sendLicenseExpiredEmail(
        license.users.email,
        license.license_key,
        license.products.name
      )
    }

    return NextResponse.json({
      success: true,
      expiring_soon: expiringSoon?.length || 0,
      expired: expired?.length || 0,
    })
  } catch (error) {
    console.error('Cron error:', error)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
