import { requireAdmin } from '@/utils/admin'
import { AdminNav } from '@/components/admin-nav'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { Settings, Save } from 'lucide-react'

async function updateSettings(formData: FormData) {
  'use server'
  
  const { adminClient } = await requireAdmin()
  
  const maxAccounts = formData.get('max_accounts') as string

  console.log('[SETTINGS-UPDATE]', { maxAccounts })

  const { error } = await adminClient
    .from('global_settings')
    .update({ value: maxAccounts, updated_at: new Date().toISOString() })
    .eq('key', 'max_accounts')

  if (error) {
    console.error('[SETTINGS-UPDATE] Error:', error)
    revalidatePath('/admin/settings')
    return redirect('/admin/settings?error=' + encodeURIComponent('Failed to update settings'))
  }

  console.log('[SETTINGS-UPDATE] ✅ Success')
  revalidatePath('/admin/settings')
  revalidatePath('/admin/products')
  redirect('/admin/settings?success=' + encodeURIComponent('Settings updated successfully'))
}

export default async function SettingsPage() {
  const { user, adminClient } = await requireAdmin()

  const { data: settings } = await adminClient
    .from('global_settings')
    .select('*')
    .eq('key', 'max_accounts')
    .single()

  const maxAccounts = settings?.value || '3'

  return (
    <div className="min-h-screen gradient-bg">
      <AdminNav userEmail={user.email || ''} />

      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8 page-transition">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight mb-2">Global Settings</h1>
          <p className="text-muted-foreground">
            Configure system-wide settings for your licensing system
          </p>
        </div>

        {/* Settings Card */}
        <Card className="glass-card border-0 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-[#CFFF04]" />
              License Settings
            </CardTitle>
            <CardDescription>
              These settings apply to all licenses and products
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
                  className="bg-background/50 border-border/50 focus:border-[#CFFF04] max-w-xs"
                />
                <p className="text-xs text-muted-foreground">
                  This setting will apply to all new licenses. Existing licenses will not be affected.
                </p>
              </div>

              <div className="flex justify-end pt-4">
                <Button type="submit" className="gap-2 bg-gradient-neon hover:opacity-90 text-black button-shine">
                  <Save className="h-4 w-4" />
                  Save Settings
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="mt-6 glass-card border-0 shadow-xl">
          <CardHeader>
            <CardTitle className="text-base">How Max Accounts Works</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>
              • When a customer validates their license on a new MT5 account, it gets registered to that license.
            </p>
            <p>
              • Once the maximum number of accounts is reached, no new accounts can be added.
            </p>
            <p>
              • You can manually remove accounts from the license details page if needed.
            </p>
            <p>
              • Changing this setting only affects new licenses, not existing ones.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
