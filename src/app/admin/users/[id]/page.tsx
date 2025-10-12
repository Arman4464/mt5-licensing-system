import { requireAdmin } from '@/utils/admin'
import { AdminNav } from '@/components/admin-nav'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
  Globe
} from 'lucide-react'

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

  return (
    <div className="min-h-screen gradient-bg">
      <AdminNav userEmail={adminUser.email || ''} />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 page-transition">
        {/* Back Button */}
        <div className="mb-6">
          <Button variant="ghost" asChild className="gap-2">
            <Link href="/admin/users">
              <ArrowLeft className="h-4 w-4" />
              Back to Users
            </Link>
          </Button>
        </div>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="h-16 w-16 rounded-full bg-gradient-neon flex items-center justify-center text-black font-bold text-2xl">
              {user.email.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{user.full_name || 'No Name'}</h1>
              <p className="text-muted-foreground">{user.email}</p>
            </div>
          </div>
        </div>

        {/* User Info Card */}
        <Card className="mb-6 glass-card border-0 shadow-xl hover-lift">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-[#CFFF04]" />
              User Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{user.email}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Full Name</p>
                <p className="font-medium">{user.full_name || 'Not provided'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Joined</p>
                <p className="font-medium">{new Date(user.created_at).toLocaleDateString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Licenses */}
        <Card className="mb-6 glass-card border-0 shadow-xl hover-lift">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5 text-[#CFFF04]" />
              Licenses ({user.licenses?.length || 0})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {user.licenses && user.licenses.length > 0 ? (
              <div className="space-y-4">
                {user.licenses.map((license: any) => {
                  const product = Array.isArray(license.products) ? license.products[0] : license.products
                  const mt5AccountsCount = license.mt5_accounts?.length || 0

                  return (
                    <div
                      key={license.id}
                      className="table-row p-4 rounded-lg border border-border/50"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <code className="text-sm font-mono bg-muted px-2 py-1 rounded">
                              {license.license_key}
                            </code>
                            <Badge
                              variant={
                                license.status === 'active'
                                  ? 'success'
                                  : license.status === 'paused'
                                  ? 'warning'
                                  : 'destructive'
                              }
                            >
                              {license.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{product?.name}</p>
                        </div>
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/admin/licenses/${license.id}`}>View Details</Link>
                        </Button>
                      </div>

                      <div className="flex items-center gap-6 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Expires: {license.expires_at ? new Date(license.expires_at).toLocaleDateString() : 'Never'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Activity className="h-3 w-3" />
                          {mt5AccountsCount} MT5 accounts
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Key className="mx-auto h-10 w-10 mb-2 opacity-50" />
                <p className="text-sm">No licenses yet</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* MT5 Accounts Summary */}
        <Card className="glass-card border-0 shadow-xl hover-lift">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5 text-[#CFFF04]" />
              MT5 Accounts Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            {user.licenses && user.licenses.some((l: any) => l.mt5_accounts?.length > 0) ? (
              <div className="space-y-3">
                {user.licenses.map((license: any) => 
                  license.mt5_accounts?.map((account: any) => (
                    <div key={account.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                      <div>
                        <p className="font-medium text-sm">Account #{account.account_number}</p>
                        <p className="text-xs text-muted-foreground">
                          {account.broker_company} - {account.broker_server}
                        </p>
                      </div>
                      <div className="text-right text-xs text-muted-foreground">
                        <p>Last used:</p>
                        <p>{new Date(account.last_used_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Globe className="mx-auto h-10 w-10 mb-2 opacity-50" />
                <p className="text-sm">No MT5 accounts connected</p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
