import { requireAdmin } from '@/utils/admin'
import { AdminNav } from '@/components/admin-nav'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Key, Activity, Copy } from 'lucide-react'

export default async function LicenseDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const { user, adminClient } = await requireAdmin()

  const { data: license } = await adminClient
    .from('licenses')
    .select(`
      *,
      users(email, full_name),
      products(name, description, price),
      mt5_accounts(*)
    `)
    .eq('id', params.id)
    .single()

  if (!license) {
    notFound()
  }

  const product = Array.isArray(license.products) ? license.products[0] : license.products
  const userInfo = Array.isArray(license.users) ? license.users[0] : license.users

  return (
    <div className="min-h-screen gradient-bg">
      <AdminNav userEmail={user.email || ''} />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 page-transition">
        {/* Back Button */}
        <div className="mb-6">
          <Button variant="ghost" asChild className="gap-2">
            <Link href="/admin/licenses">
              <ArrowLeft className="h-4 w-4" />
              Back to Licenses
            </Link>
          </Button>
        </div>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight mb-2">License Details</h1>
          <p className="text-muted-foreground">
            View complete information about this license
          </p>
        </div>

        {/* License Info Card */}
        <Card className="mb-6 glass-card border-0 shadow-xl hover-lift">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5 text-[#CFFF04]" />
              License Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">License Key</p>
                <div className="flex items-center gap-2">
                  <code className="text-sm font-mono bg-muted px-3 py-2 rounded-md flex-1">
                    {license.license_key}
                  </code>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => navigator.clipboard.writeText(license.license_key)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge
                  variant={
                    license.status === 'active'
                      ? 'success'
                      : license.status === 'paused'
                      ? 'warning'
                      : 'destructive'
                  }
                  className="badge-pulse"
                >
                  {license.status.toUpperCase()}
                </Badge>
              </div>

              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Customer Email</p>
                <p className="text-base font-medium">{userInfo?.email || 'N/A'}</p>
              </div>

              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Customer Name</p>
                <p className="text-base font-medium">{userInfo?.full_name || 'N/A'}</p>
              </div>

              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Product</p>
                <p className="text-base font-medium">{product?.name || 'N/A'}</p>
              </div>

              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Price Paid</p>
                <p className="text-base font-medium">₹{product?.price || 0}</p>
              </div>

              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Created At</p>
                <p className="text-base font-medium">
                  {new Date(license.created_at).toLocaleString()}
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Expires At</p>
                <p className="text-base font-medium">
                  {license.expires_at 
                    ? new Date(license.expires_at).toLocaleString() 
                    : 'Never'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* MT5 Accounts Card */}
        <Card className="glass-card border-0 shadow-xl hover-lift">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-[#CFFF04]" />
              Connected MT5 Accounts ({license.mt5_accounts?.length || 0})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {license.mt5_accounts && license.mt5_accounts.length > 0 ? (
              <div className="rounded-md border border-border/50">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border/50 bg-muted/30">
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                          Account Number
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                          Account Name
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                          Broker
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                          Server
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                          IP Address
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                          First Seen
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                          Last Used
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {license.mt5_accounts.map((account: {
                        id: string;
                        account_number: number;
                        account_name: string;
                        broker_company: string;
                        broker_server: string;
                        ip_address: string;
                        created_at: string;
                        last_used_at: string;
                      }) => (
                        <tr key={account.id} className="border-b border-border/50 table-row">
                          <td className="px-4 py-3 text-sm">
                            <code className="font-mono text-xs bg-muted px-2 py-1 rounded">
                              {account.account_number}
                            </code>
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {account.account_name || 'N/A'}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {account.broker_company || 'N/A'}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {account.broker_server || 'N/A'}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <code className="font-mono text-xs">
                              {account.ip_address || 'N/A'}
                            </code>
                          </td>
                          <td className="px-4 py-3 text-xs text-muted-foreground">
                            {new Date(account.created_at).toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-xs text-muted-foreground">
                            {new Date(account.last_used_at).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <Activity className="mx-auto h-12 w-12 text-muted-foreground/50 mb-3" />
                <p className="text-sm text-muted-foreground">No MT5 accounts connected yet</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Accounts will appear here once the EA validates
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
