import { requireAdmin } from '@/utils/admin'
import { AdminLayout } from '@/components/admin-layout'
import { Toast } from '@/components/toast'
import { Suspense } from 'react'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Shield, ShieldAlert, Plus, Trash2, ToggleLeft, ToggleRight } from 'lucide-react'
import Link from 'next/link'

// Types
type Mt5Account = {
  license_id: string
  ip_address: string
  licenses: { license_key: string } | null
}

type SuspiciousActivity = {
  licenseId: string
  license_key: string
  ipCount: number
}

async function addIPWhitelist(formData: FormData) {
  'use server'
  
  const { adminClient, user } = await requireAdmin()
  
  const licenseId = formData.get('license_id') as string
  const ipAddress = formData.get('ip_address') as string
  const description = formData.get('description') as string

  if (!licenseId || !ipAddress) {
    return redirect('/admin/security?error=' + encodeURIComponent('License and IP address are required'))
  }

  const { error } = await adminClient
    .from('ip_whitelist')
    .insert({
      license_id: licenseId,
      ip_address: ipAddress,
      description,
      created_by: user.email,
    })

  if (error) {
    return redirect('/admin/security?error=' + encodeURIComponent(error.message))
  }

  revalidatePath('/admin/security')
  redirect('/admin/security?success=' + encodeURIComponent('IP whitelisted successfully'))
}

async function removeIPWhitelist(formData: FormData) {
  'use server'
  
  const { adminClient } = await requireAdmin()
  const id = formData.get('id') as string

  await adminClient.from('ip_whitelist').delete().eq('id', id)

  revalidatePath('/admin/security')
  redirect('/admin/security?success=' + encodeURIComponent('IP removed from whitelist'))
}

async function toggleIPStatus(formData: FormData) {
  'use server'
  
  const { adminClient } = await requireAdmin()
  const id = formData.get('id') as string
  const isActive = formData.get('is_active') === 'true'

  await adminClient.from('ip_whitelist').update({ is_active: !isActive }).eq('id', id)

  revalidatePath('/admin/security')
  redirect('/admin/security?success=' + encodeURIComponent('IP status updated'))
}

export default async function SecurityPage() {
  const { user, adminClient } = await requireAdmin()

  const { data: whitelist } = await adminClient
    .from('ip_whitelist')
    .select('*, licenses(license_key, status)')
    .order('created_at', { ascending: false })

  const { data: licenses } = await adminClient
    .from('licenses')
    .select('id, license_key, status')
    .eq('status', 'active')
    .order('license_key', { ascending: true })

  const { data: mt5Accounts } = await adminClient
    .from('mt5_accounts')
    .select('license_id, ip_address, licenses(license_key)')

  // Group IPs by license
  const ipsByLicense = new Map<string, { license_key: string; ips: Set<string> }>()
  
  if (mt5Accounts) {
    for (const account of mt5Accounts as unknown as Mt5Account[]) {
      if (!account.license_id || !account.licenses?.license_key) continue

      if (!ipsByLicense.has(account.license_id)) {
        ipsByLicense.set(account.license_id, {
          license_key: account.licenses.license_key,
          ips: new Set<string>(),
        })
      }
      ipsByLicense.get(account.license_id)!.ips.add(account.ip_address)
    }
  }

  // Find licenses with > 3 IPs
  const suspicious: SuspiciousActivity[] = []
  ipsByLicense.forEach((data, licenseId) => {
    if (data.ips.size > 3) {
      suspicious.push({
        licenseId,
        license_key: data.license_key,
        ipCount: data.ips.size,
      })
    }
  })

  return (
    <AdminLayout user={user}>
      <Suspense>
        <Toast />
      </Suspense>

      <div className="page-transition">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight mb-2 gradient-text">Security & Monitoring</h1>
          <p className="text-muted-foreground">
            Manage IP whitelisting and monitor suspicious activity.
          </p>
        </div>

        {/* Suspicious Activity Alert */}
        {suspicious.length > 0 && (
          <Card className="mb-8 glass-card border-red-500/50 shadow-red-500/10">
            <CardHeader className="flex-row items-center gap-4">
              <ShieldAlert className="h-8 w-8 text-red-500" />
              <div>
                <CardTitle className="text-red-400">Suspicious Activity Detected</CardTitle>
                <p className="text-sm text-red-400/80">
                  The following licenses show signs of potential account sharing.
                </p>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {suspicious.map((item) => (
                <div key={item.licenseId} className="text-sm text-red-400/90 flex items-center justify-between p-2 rounded-md bg-background/30">
                  <span>
                    License{' '}
                    <Link href={`/admin/licenses/${item.licenseId}`} className="font-mono bg-red-900/50 px-2 py-1 rounded hover:bg-red-900/80 transition-colors">
                      {item.license_key}
                    </Link> 
                    {' '}has been used from <strong>{item.ipCount} different IPs</strong>.
                  </span>
                  <Button variant="outline" size="sm" asChild className="border-red-500/50 text-red-400 hover:bg-red-500/10 hover:text-red-300">
                    <Link href={`/admin/licenses/${item.licenseId}`}>View License</Link>
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Add IP Whitelist Form */}
        <Card className="mb-8 glass-card border-0 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Shield className="h-6 w-6 text-neon" />
              Add IP to Whitelist
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form action={addIPWhitelist} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="license_id">License *</Label>
                  <select
                    id="license_id"
                    name="license_id"
                    required
                    className="flex h-10 w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 focus:border-neon"
                  >
                    <option value="">Select an active license</option>
                    {licenses?.map((license) => (
                      <option key={license.id} value={license.id}>
                        {license.license_key}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ip_address">IP Address *</Label>
                  <Input
                    id="ip_address"
                    name="ip_address"
                    required
                    placeholder="192.168.1.1"
                    className="bg-background/50 border-border/50 focus:border-neon"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Input
                    id="description"
                    name="description"
                    placeholder="e.g., Office IP, Home VPS"
                    className="bg-background/50 border-border/50 focus:border-neon"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button type="submit" className="h-11 gap-2 bg-gradient-neon text-black font-bold button-shine">
                  <Plus className="h-4 w-4" />
                  Add to Whitelist
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Whitelist Table */}
        <Card className="glass-card border-0 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Shield className="h-6 w-6 text-neon" />
              IP Whitelist Entries
            </CardTitle>
          </CardHeader>
          <CardContent>
            {whitelist && whitelist.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="border-b border-border/50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">License</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">IP Address</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">Description</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">Added</th>
                      <th className="px-4 py-3 text-right text-xs font-medium uppercase text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/30">
                    {whitelist.map((item) => {
                      const licenseKey = (item.licenses as { license_key: string })?.license_key
                      return (
                        <tr key={item.id} className="hover:bg-background/30 transition-colors">
                          <td className="px-4 py-3 text-sm font-mono text-foreground/80">
                            <Link href={`/admin/licenses/${(item.licenses as any)?.id}`} className="hover:text-neon">
                              {licenseKey || 'N/A'}
                            </Link>
                          </td>
                          <td className="px-4 py-3 text-sm font-mono text-foreground/80">{item.ip_address}</td>
                          <td className="px-4 py-3 text-sm text-muted-foreground">{item.description || '-'}</td>
                          <td className="px-4 py-3">
                            <Badge variant={item.is_active ? 'neon' : 'secondary'}>
                              {item.is_active ? 'Active' : 'Disabled'}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-xs text-muted-foreground">
                            {new Date(item.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex justify-end gap-1">
                              <form action={toggleIPStatus}>
                                <input type="hidden" name="id" value={item.id} />
                                <input type="hidden" name="is_active" value={String(item.is_active)} />
                                <Button type="submit" variant="ghost" size="icon" className="hover:bg-background/50 hover:text-neon">
                                  {item.is_active ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
                                </Button>
                              </form>
                              <form action={removeIPWhitelist}>
                                <input type="hidden" name="id" value={item.id} />
                                <Button type="submit" variant="ghost" size="icon" className="text-red-500 hover:text-red-400 hover:bg-red-500/10">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </form>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Shield className="mx-auto h-12 w-12 text-neon/50 mb-3" />
                <h3 className="text-lg font-semibold text-foreground mb-1">The Whitelist is Empty</h3>
                <p className="text-sm">Add an IP address using the form above to get started.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}
