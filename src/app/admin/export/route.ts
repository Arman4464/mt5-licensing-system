import { requireAdmin } from '@/utils/admin'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { adminClient } = await requireAdmin()
    
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'licenses'

    let data, filename

    switch(type) {
      case 'licenses':
        const { data: licenses } = await adminClient
          .from('licenses')
          .select('*, products(name), users(email)')
        data = licenses
        filename = 'licenses_export.csv'
        break
      
      case 'accounts':
        const { data: accounts } = await adminClient
          .from('mt5_accounts')
          .select('*, licenses(license_key)')
        data = accounts
        filename = 'mt5_accounts_export.csv'
        break
      
      case 'logs':
        const { data: logs } = await adminClient
          .from('usage_logs')
          .select('*, licenses(license_key)')
          .limit(1000)
        data = logs
        filename = 'usage_logs_export.csv'
        break
      
      default:
        return NextResponse.json({ error: 'Invalid export type' }, { status: 400 })
    }

    if (!data) {
      return NextResponse.json({ error: 'No data found' }, { status: 404 })
    }

    // Convert to CSV
    const headers = Object.keys(data[0] || {}).join(',')
    const rows = data.map(row => 
      Object.values(row).map(val => 
        typeof val === 'object' ? JSON.stringify(val) : val
      ).join(',')
    )
    const csv = [headers, ...rows].join('\n')

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json({ error: 'Export failed' }, { status: 500 })
  }
}
