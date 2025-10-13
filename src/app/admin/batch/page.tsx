import { requireAdmin } from '@/utils/admin'
import { AdminLayout } from '@/components/admin-layout'
import { Toast } from '@/components/toast'
import { Suspense } from 'react'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  FileUp,
  Clock,
  Trash2,
  Play,
  Pause,
  CheckCircle,
  XCircle,
  AlertTriangle,
} from 'lucide-react'

async function batchExtendLicenses(formData: FormData) {
  'use server'
  
  const { adminClient } = await requireAdmin()
  
  const days = parseInt(formData.get('days') as string)
  const status = formData.get('status') as string
  const reactivate = formData.get('reactivate') === 'on'

  if (isNaN(days) || !status) {
    redirect('/admin/batch?error=Days and status required')
  }

  const { data: licenses } = await adminClient
    .from('licenses')
    .select('id, expires_at, status')
    .eq('status', status)

  if (!licenses || licenses.length === 0) {
    redirect('/admin/batch?error=No licenses found with that status')
  }

  const updates = licenses.map(license => {
    const currentExpiry = license.expires_at ? new Date(license.expires_at) : new Date()
    const newExpiry = new Date(currentExpiry)
    newExpiry.setDate(newExpiry.getDate() + days)
    
    const updateData: Record<string, any> = { expires_at: newExpiry.toISOString() }
    
    if (reactivate && (license.status === 'suspended' || license.status === 'expired')) {
      updateData.status = 'active'
    }
    
    return adminClient
      .from('licenses')
      .update(updateData)
      .eq('id', license.id)
  })

  await Promise.all(updates)

  revalidatePath('/admin/batch')
  redirect(`/admin/batch?success=Extended ${licenses.length} licenses by ${days} days${reactivate ? ' and reactivated' : ''}`)
}

async function batchSuspendExpired() {
  'use server'
  
  const { adminClient } = await requireAdmin()

  const { data: expiredLicenses } = await adminClient
    .from('licenses')
    .select('id')
    .eq('status', 'active')
    .lt('expires_at', new Date().toISOString())

  if (!expiredLicenses || expiredLicenses.length === 0) {
    redirect('/admin/batch?info=No currently active licenses have expired.')
  }

  await adminClient
    .from('licenses')
    .update({ status: 'expired' })
    .in('id', expiredLicenses.map(l => l.id))

  revalidatePath('/admin/batch')
  redirect(`/admin/batch?success=Set ${expiredLicenses.length} expired licenses to 'expired' status.`)
}

async function batchDeleteInactive(formData: FormData) {
  'use server'
  
  const { adminClient } = await requireAdmin()

  const daysInactive = parseInt(formData.get('days') as string) || 90
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - daysInactive)

  const { data: inactiveLicenses } = await adminClient
    .from('licenses')
    .select('id')
    .eq('status', 'expired')
    .lt('updated_at', cutoffDate.toISOString())

  if (!inactiveLicenses || inactiveLicenses.length === 0) {
    redirect('/admin/batch?info=No inactive licenses to delete')
  }

  await adminClient
    .from('licenses')
    .delete()
    .in('id', inactiveLicenses.map(l => l.id))

  revalidatePath('/admin/batch')
  redirect(`/admin/batch?success=Deleted ${inactiveLicenses.length} inactive licenses`)
}

export default async function BatchOperationsPage() {
  const { user, adminClient } = await requireAdmin()

  const { count: activeCount } = await adminClient
    .from('licenses')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active')

  const { count: expiredCount } = await adminClient
    .from('licenses')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'expired')

  const { count: suspendedCount } = await adminClient
    .from('licenses')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'suspended')

  return (
    <AdminLayout user={user}>
      <Suspense>
        <Toast />
      </Suspense>
      <div className="page-transition">
        <div className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight mb-2 gradient-text">Batch Operations</h1>
          <p className="text-muted-foreground">
            Perform bulk actions on multiple licenses at once. Use with caution.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="mb-8 grid gap-6 md:grid-cols-3">
          <Card className="glass-card border-0 shadow-xl">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Licenses</p>
                <p className="mt-2 text-3xl font-bold text-foreground">{activeCount || 0}</p>
              </div>
              <div className="p-3 rounded-lg bg-green-500/10">
                <CheckCircle className="h-6 w-6 text-green-400" />
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card border-0 shadow-xl">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Expired Licenses</p>
                <p className="mt-2 text-3xl font-bold text-foreground">{expiredCount || 0}</p>
              </div>
              <div className="p-3 rounded-lg bg-red-500/10">
                <XCircle className="h-6 w-6 text-red-400" />
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card border-0 shadow-xl">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Suspended Licenses</p>
                <p className="mt-2 text-3xl font-bold text-foreground">{suspendedCount || 0}</p>
              </div>
              <div className="p-3 rounded-lg bg-yellow-500/10">
                <Pause className="h-6 w-6 text-yellow-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-8">
          {/* Batch Extend */}
          <Card className="glass-card border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Clock className="text-neon" /> Batch Extend Licenses</CardTitle>
              <CardDescription>Extend the expiry date for a group of licenses.</CardDescription>
            </CardHeader>
            <CardContent>
              <form action={batchExtendLicenses} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-4">
                  <div>
                    <Label htmlFor="status-extend">License Status</Label>
                    <select
                      id="status-extend"
                      name="status"
                      required
                      className="mt-1 block w-full rounded-md bg-background/50 border-border/50 focus:border-neon focus:ring-neon transition-colors h-11 px-3"
                    >
                      <option value="active">Active</option>
                      <option value="suspended">Suspended</option>
                      <option value="expired">Expired</option>
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="days-extend">Extend by (days)</Label>
                    <Input
                      id="days-extend"
                      type="number"
                      name="days"
                      required
                      min="1"
                      defaultValue="30"
                      className="mt-1 h-11 bg-background/50 border-border/50 focus:border-neon"
                    />
                  </div>
                  <div className="flex items-end">
                    <div className="flex items-center gap-2">
                      <Checkbox id="reactivate" name="reactivate" className="h-4 w-4 rounded border-border/50 bg-background/50 text-neon focus:ring-neon" />
                      <Label htmlFor="reactivate" className="text-sm">Reactivate</Label>
                    </div>
                  </div>
                  <div className="flex items-end">
                    <Button type="submit" className="w-full h-11 bg-gradient-neon text-black font-bold button-shine">
                      <FileUp className="h-4 w-4 mr-2" /> Extend All
                    </Button>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Batch Suspend Expired */}
          <Card className="glass-card border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Pause className="text-neon" /> Auto-Set Expired Status</CardTitle>
              <CardDescription>Find all 'active' licenses with an expiry date in the past and set their status to 'expired'.</CardDescription>
            </CardHeader>
            <CardContent>
              <form action={batchSuspendExpired}>
                <Button type="submit" variant="outline" className="h-11 border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/10 hover:text-yellow-300">
                  <Play className="h-4 w-4 mr-2" /> Run Task
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Batch Delete Inactive */}
          <Card className="glass-card border-red-500/30 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-400"><AlertTriangle /> Delete Inactive Licenses</CardTitle>
              <CardDescription className="text-red-400/80">Permanently delete 'expired' licenses that have not been updated for a specified period.</CardDescription>
            </CardHeader>
            <CardContent>
              <form action={batchDeleteInactive} className="flex items-end gap-4">
                <div>
                  <Label htmlFor="days-delete" className="text-red-400">Days Inactive</Label>
                  <Input
                    id="days-delete"
                    type="number"
                    name="days"
                    required
                    min="30"
                    defaultValue="90"
                    className="mt-1 h-11 bg-background/50 border-red-500/50 focus:border-red-400"
                  />
                </div>
                <Button type="submit" className="h-11 bg-red-600 hover:bg-red-700 text-white font-bold">
                  <Trash2 className="h-4 w-4 mr-2" /> Delete Inactive
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  )
}
