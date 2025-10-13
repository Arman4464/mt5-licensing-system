import { requireAdmin } from '@/utils/admin'
import { AdminLayout } from '@/components/admin-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { Settings, Save, Info } from 'lucide-react'
import { Toast } from '@/components/toast'
import { Suspense } from 'react'

async function updateSettings(formData: FormData) {
  'use server'
  
  const { adminClient } = await requireAdmin()
  
  const maxAccounts = formData.get('max_accounts') as string

  const { error } = await adminClient
    .from('global_settings')
    .update({ value: maxAccounts, updated_at: new Date().toISOString() })
    .eq('key', 'max_accounts')

  if (error) {
    console.error('[SETTINGS_UPDATE] Error:', error)
    return redirect('/admin/settings?error=' + encodeURIComponent('Failed to update settings'))
  }

  console.log('[SETTINGS_UPDATE] ✅ Success')
  revalidatePath('/admin/settings')
  revalidatePath('/admin/products/create') // Revalidate create page in case it's open
  redirect('/admin/settings?success=' + encodeURIComponent('Settings updated successfully'))
}

export default async function SettingsPage() {
  const { user, adminClient } = await requireAdmin()

  const { data: settings } = await adminClient
    .from('global_settings')
    .select('value')
    .eq('key', 'max_accounts')
    .single()

  const maxAccounts = settings?.value || '3'

  return (
    <AdminLayout user={user}>
      <Suspense>
        <Toast />
      </Suspense>
      <div className="page-transition max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight mb-2 gradient-text">Global Settings</h1>
          <p className="text-muted-foreground">
            Configure system-wide settings for your licensing system.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Settings Card */}
          <Card className="glass-card border-0 shadow-xl lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Settings className="h-6 w-6 text-neon" />
                License Settings
              </CardTitle>
              <CardDescription>
                These settings apply to all newly created licenses and products.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form action={updateSettings} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="max_accounts">Maximum MT5 Accounts Per License</Label>
                  <Input
                    id="max_accounts"
                    name="max_accounts"
                    type="number"
                    min="1"
                    max="10"
                    defaultValue={maxAccounts}
                    required
                    className="bg-background/50 border-border/50 focus:border-neon max-w-xs"
                  />
                  <p className="text-xs text-muted-foreground">
                    This will be the default for all new licenses. Existing licenses are not affected.
                  </p>
                </div>

                <div className="flex justify-end pt-4">
                  <Button type="submit" className="h-11 gap-2 bg-gradient-neon text-black font-bold button-shine">
                    <Save className="h-4 w-4" />
                    Save Settings
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Info Card */}
          <Card className="glass-card border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-base">
                <Info className="h-5 w-5 text-blue-400" />
                How It Works
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-3">
              <p>
                • When a customer uses their license on a new MT5 account, it gets registered to that license.
              </p>
              <p>
                • Once the max number of accounts is reached, no new accounts can be added.
              </p>
              <p>
                • You can manually remove accounts from a license on its details page.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  )
}
