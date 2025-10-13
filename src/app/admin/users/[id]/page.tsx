import { requireAdmin } from '@/utils/admin'
import { AdminLayout } from '@/components/admin-layout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { 
  ArrowLeft, 
  Mail, 
  Calendar, 
  Key, 
  Activity,
  Server,
  Globe,
  Eye
} from 'lucide-react'
import type { License, Product, MT5Account } from '@/types'

export default async function UserDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const { user: adminUser, adminClient } = await requireAdmin()

  const { data: user } = await adminClient
    .from('users')
    .select(`
      *,
      licenses(
        *,
        products(name, platform),
        mt5_accounts(*)
      )
    `)
    .eq('id', params.id)
    .single()

  if (!user) {
    notFound()
  }

  const allMt5Accounts = user.licenses?.flatMap((l: License) => l.mt5_accounts || []) || []

  const statusVariant: { [key: string]: 'neon' | 'secondary' | 'destructive' | 'warning' } = {
    active: 'neon',
    inactive: 'secondary',
    expired: 'destructive',
    cancelled: 'destructive',
    paused: 'warning',
  }

  return (
    <AdminLayout user={adminUser}>
      <div className="page-transition max-w-7xl mx-auto">
        {/* Back Button */}
        <div className="mb-6">
          <Button variant="ghost" asChild className="gap-2 text-muted-foreground hover:text-foreground">
            <Link href="/admin/users">
              <ArrowLeft className="h-4 w-4" />
              Back to All Users
            </Link>
          </Button>
        </div>

        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="h-16 w-16 rounded-full bg-gradient-to-br from-neon/50 to-neon/80 flex items-center justify-center text-black font-bold text-3xl shadow-lg">
            {user.email?.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-4xl font-bold tracking-tight gradient-text">{user.full_name || 'No Name Provided'}</h1>
            <p className="text-muted-foreground flex items-center gap-2 mt-1">
              <Mail className="h-4 w-4" /> {user.email}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - User Info & Licenses */}
          <div className="lg:col-span-2 space-y-8">
            {/* Licenses */}
            <Card className="glass-card border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Key className="h-6 w-6 text-neon" />
                  Licenses
                </CardTitle>
                <CardDescription>
                  This user has {user.licenses?.length || 0} licenses.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {user.licenses && user.licenses.length > 0 ? (
                  <div className="space-y-4">
                    {user.licenses.map((license: License) => {
                      const product = (license.products as Product)
                      const mt5AccountsCount = license.mt5_accounts?.length || 0

                      return (
                        <div
                          key={license.id}
                          className="p-4 rounded-lg border border-border/50 hover:bg-background/30 transition-colors"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <p className="text-sm font-semibold text-foreground">{product?.name || 'Unknown Product'}</p>
                                <Badge variant={statusVariant[license.status] || 'secondary'}>
                                  {license.status}
                                </Badge>
                              </div>
                              <code className="text-xs font-mono bg-background/50 px-2 py-1 rounded">
                                {license.license_key}
                              </code>
                            </div>
                            <Button variant="outline" size="sm" asChild className="hover:bg-background/50 hover:border-border/80 hover:text-neon">
                              <Link href={`/admin/licenses/${license.id}`}>
                                <Eye className="h-4 w-4 mr-2" />
                                View
                              </Link>
                            </Button>
                          </div>

                          <div className="flex items-center gap-6 text-xs text-muted-foreground border-t border-border/50 pt-3 mt-3">
                            <span className="flex items-center gap-1.5">
                              <Calendar className="h-3 w-3" />
                              Expires: {license.expires_at ? new Date(license.expires_at).toLocaleDateString() : 'Never'}
                            </span>
                            <span className="flex items-center gap-1.5">
                              <Activity className="h-3 w-3" />
                              {mt5AccountsCount} / {license.max_accounts || 'N/A'} accounts used
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Key className="mx-auto h-12 w-12 text-neon/50 mb-3" />
                    <h3 className="text-lg font-semibold text-foreground mb-1">No Licenses Found</h3>
                    <p className="text-sm">This user has not purchased any licenses yet.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - MT5 Accounts */}
          <div className="space-y-8">
            <Card className="glass-card border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Server className="h-6 w-6 text-neon" />
                  MT5 Accounts
                </CardTitle>
                <CardDescription>
                  All accounts used across all licenses.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {allMt5Accounts.length > 0 ? (
                  <div className="space-y-3">
                    {allMt5Accounts.map((account: MT5Account) => (
                      <div key={account.id} className="flex items-center justify-between p-3 rounded-lg bg-background/50">
                        <div>
                          <p className="font-semibold text-sm text-foreground">#{account.account_number}</p>
                          <p className="text-xs text-muted-foreground">
                            {account.broker_company}
                          </p>
                        </div>
                        <div className="text-right text-xs text-muted-foreground">
                          <p>Last Used:</p>
                          <p>{new Date(account.last_used_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Globe className="mx-auto h-12 w-12 text-neon/50 mb-3" />
                    <h3 className="text-lg font-semibold text-foreground mb-1">No Accounts Connected</h3>
                    <p className="text-sm">MT5 accounts will appear here once a license is used.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
