import { requireAdmin } from '@/utils/admin'
import { AdminLayout } from '@/components/admin-layout'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { sendLicenseCreatedEmail } from '@/lib/email'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  Key, 
  MoreVertical, 
  Eye, 
  Pause, 
  Play, 
  Clock, 
  Trash2,
  Search,
  Filter,
} from 'lucide-react'
import { Toast } from '@/components/toast'
import { Suspense } from 'react'

async function generateLicense(formData: FormData) {
  'use server'
  
  console.log('[LICENSE-GENERATE] Starting license generation...')
  
  const { adminClient } = await requireAdmin()
  
  try {
    const productId = formData.get('product_id') as string
    const userEmail = formData.get('user_email') as string
    const durationDays = parseInt(formData.get('duration_days') as string)

    console.log('[LICENSE-GENERATE] Input:', { productId, userEmail, durationDays })

    if (!productId || !userEmail || !durationDays) {
      console.error('[LICENSE-GENERATE] Missing required fields')
      revalidatePath('/admin/licenses')
      return redirect('/admin/licenses?error=' + encodeURIComponent('All fields required'))
    }

    const { data: product, error: productError } = await adminClient
      .from('products')
      .select('*')
      .eq('id', productId)
      .single()

    if (productError || !product) {
      console.error('[LICENSE-GENERATE] Product not found:', productError)
      revalidatePath('/admin/licenses')
      return redirect('/admin/licenses?error=' + encodeURIComponent('Product not found'))
    }

    console.log('[LICENSE-GENERATE] Product found:', product.name)

    // Get global max_accounts setting
    const { data: settings } = await adminClient
      .from('global_settings')
      .select('value')
      .eq('key', 'max_accounts')
      .single()

    const maxAccounts = settings?.value ? parseInt(settings.value) : 3
    console.log('[LICENSE-GENERATE] Max accounts from global settings:', maxAccounts)

    // Update product's max_accounts to match global setting
    await adminClient
      .from('products')
      .update({ max_accounts: maxAccounts })
      .eq('id', productId)

    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    const licenseKey = Array.from({ length: 4 }, () => {
      return Array.from({ length: 8 }, () =>
        chars.charAt(Math.floor(Math.random() * chars.length))
      ).join('')
    }).join('-')

    console.log('[LICENSE-GENERATE] Generated key:', licenseKey)

    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + durationDays)

    let userId
    const { data: existingUser } = await adminClient
      .from('users')
      .select('id')
      .eq('email', userEmail)
      .maybeSingle()

    if (existingUser) {
      userId = existingUser.id
      console.log('[LICENSE-GENERATE] Existing user found:', userId)
    } else {
      const { data: newUser, error: userError } = await adminClient
        .from('users')
        .insert({
          email: userEmail,
          full_name: userEmail.split('@')[0],
        })
        .select('id')
        .single()

      if (userError || !newUser) {
        console.error('[LICENSE-GENERATE] User creation failed:', userError)
        revalidatePath('/admin/licenses')
        return redirect('/admin/licenses?error=' + encodeURIComponent('Failed to create user'))
      }
      userId = newUser.id
      console.log('[LICENSE-GENERATE] New user created:', userId)
    }

    const { error: licenseError } = await adminClient
      .from('licenses')
      .insert({
        user_id: userId,
        product_id: productId,
        license_key: licenseKey,
        status: 'active',
        expires_at: expiresAt.toISOString(),
      })

    if (licenseError) {
      console.error('[LICENSE-GENERATE] License creation failed:', licenseError)
      revalidatePath('/admin/licenses')
      return redirect('/admin/licenses?error=' + encodeURIComponent('Failed to create license'))
    }

    console.log('[LICENSE-GENERATE] License created successfully')

    try {
      await sendLicenseCreatedEmail(
        userEmail,
        licenseKey,
        product.name,
        expiresAt.toISOString()
      )
      console.log('[LICENSE-GENERATE] Email sent successfully')
    } catch (emailError) {
      console.error('[LICENSE-GENERATE] Email failed (non-blocking):', emailError)
    }

    console.log('[LICENSE-GENERATE] ✅ Complete!')
    revalidatePath('/admin/licenses')
    return redirect('/admin/licenses?success=' + encodeURIComponent(`License generated: ${licenseKey}`))
  } catch (error) {
    console.error('[LICENSE-GENERATE] ❌ Unexpected error:', error)
    revalidatePath('/admin/licenses')
    return redirect('/admin/licenses?error=' + encodeURIComponent('Unexpected error occurred'))
  }
}


async function pauseLicense(formData: FormData) {
  'use server'
  const { adminClient } = await requireAdmin()
  const id = formData.get('id') as string
  console.log('[LICENSE-PAUSE] Pausing license:', id)
  const { error } = await adminClient.from('licenses').update({ status: 'paused' }).eq('id', id)
  if (error) {
    console.error('[LICENSE-PAUSE] Failed:', error)
    revalidatePath('/admin/licenses')
    return redirect('/admin/licenses?error=' + encodeURIComponent('Failed to pause license'))
  }
  console.log('[LICENSE-PAUSE] ✅ Success')
  revalidatePath('/admin/licenses')
  redirect('/admin/licenses?success=' + encodeURIComponent('License paused successfully'))
}

async function resumeLicense(formData: FormData) {
  'use server'
  const { adminClient } = await requireAdmin()
  const id = formData.get('id') as string
  console.log('[LICENSE-RESUME] Resuming license:', id)
  const { error } = await adminClient.from('licenses').update({ status: 'active' }).eq('id', id)
  if (error) {
    console.error('[LICENSE-RESUME] Failed:', error)
    revalidatePath('/admin/licenses')
    return redirect('/admin/licenses?error=' + encodeURIComponent('Failed to resume license'))
  }
  console.log('[LICENSE-RESUME] ✅ Success')
  revalidatePath('/admin/licenses')
  redirect('/admin/licenses?success=' + encodeURIComponent('License resumed successfully'))
}

async function deleteLicense(formData: FormData) {
  'use server'
  const { adminClient } = await requireAdmin()
  const id = formData.get('id') as string
  console.log('[LICENSE-DELETE] Deleting license:', id)
  const { error } = await adminClient.from('licenses').delete().eq('id', id)
  if (error) {
    console.error('[LICENSE-DELETE] Failed:', error)
    revalidatePath('/admin/licenses')
    return redirect('/admin/licenses?error=' + encodeURIComponent('Failed to delete license'))
  }
  console.log('[LICENSE-DELETE] ✅ Success')
  revalidatePath('/admin/licenses')
  redirect('/admin/licenses?success=' + encodeURIComponent('License deleted successfully'))
}

async function extendLicense(formData: FormData) {
  'use server'
  const { adminClient } = await requireAdmin()
  const id = formData.get('id') as string
  const days = parseInt(formData.get('days') as string)
  console.log('[LICENSE-EXTEND] Extending license:', { id, days })
  const { data: license } = await adminClient.from('licenses').select('expires_at').eq('id', id).single()
  if (!license) {
    console.error('[LICENSE-EXTEND] License not found')
    revalidatePath('/admin/licenses')
    return redirect('/admin/licenses?error=' + encodeURIComponent('License not found'))
  }
  const currentExpiry = new Date(license.expires_at)
  const newExpiry = new Date(currentExpiry)
  newExpiry.setDate(newExpiry.getDate() + days)
  console.log('[LICENSE-EXTEND] New expiry:', newExpiry.toISOString())
  const { error } = await adminClient.from('licenses').update({ expires_at: newExpiry.toISOString() }).eq('id', id)
  if (error) {
    console.error('[LICENSE-EXTEND] Failed:', error)
    revalidatePath('/admin/licenses')
    return redirect('/admin/licenses?error=' + encodeURIComponent('Failed to extend license'))
  }
  console.log('[LICENSE-EXTEND] ✅ Success')
  revalidatePath('/admin/licenses')
  redirect('/admin/licenses?success=' + encodeURIComponent(`License extended by ${days} days`))
}

export default async function LicensesPage() {
  const { user, adminClient } = await requireAdmin()

  const { data: licenses } = await adminClient
    .from('licenses')
    .select(`
      *,
      users(email, full_name),
      products(name, max_accounts),
      mt5_accounts(*)
    `)
    .order('created_at', { ascending: false })

  const { data: products } = await adminClient
    .from('products')
    .select('*')
    .order('name', { ascending: true })

  return (
    <AdminLayout user={user}>
      <Suspense>
        <Toast />
      </Suspense>
      <div className="page-transition">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight mb-2 gradient-text">License Management</h1>
          <p className="text-muted-foreground">
            Manage customer licenses and MT5 accounts.
          </p>
        </div>

        {/* Generate License Card */}
        <Card className="mb-8 glass-card border-0 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5 text-neon" />
              Generate New License
            </CardTitle>
            <CardDescription>
              Create a new license for a customer. The license key will be emailed automatically.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={generateLicense} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="product_id">Product *</Label>
                  <select
                    id="product_id"
                    name="product_id"
                    required
                    className="h-11 block w-full rounded-md bg-background/50 border-border/50 focus:border-neon focus:ring-neon transition-colors px-3"
                  >
                    <option value="">Select product</option>
                    {products?.map((product) => (
                      <option key={product.id} value={product.id} className="bg-background">
                        {product.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="user_email">Customer Email *</Label>
                  <Input
                    type="email"
                    id="user_email"
                    name="user_email"
                    required
                    placeholder="customer@example.com"
                    className="h-11 bg-background/50 border-border/50 focus:border-neon"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="duration_days">Duration (days) *</Label>
                  <Input
                    type="number"
                    id="duration_days"
                    name="duration_days"
                    required
                    min="1"
                    defaultValue="365"
                    className="h-11 bg-background/50 border-border/50 focus:border-neon"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button type="submit" className="h-11 gap-2 bg-gradient-neon text-black font-bold button-shine">
                  <Key className="h-4 w-4" />
                  Generate & Email License
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Licenses Table */}
        <Card className="glass-card border-0 shadow-xl">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>All Licenses</CardTitle>
                <CardDescription>
                  {licenses?.length || 0} total licenses
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="icon" className="h-9 w-9 bg-background/50 border-border/50 hover:border-neon hover:text-neon">
                  <Search className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" className="h-9 w-9 bg-background/50 border-border/50 hover:border-neon hover:text-neon">
                  <Filter className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {licenses && licenses.length > 0 ? (
              <div className="border border-border/50 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border/50 bg-background/20 text-xs font-medium uppercase text-muted-foreground">
                        <th className="px-4 py-3 text-left">License Key</th>
                        <th className="px-4 py-3 text-left">Customer</th>
                        <th className="px-4 py-3 text-left">Product</th>
                        <th className="px-4 py-3 text-left">Status</th>
                        <th className="px-4 py-3 text-left">Expires</th>
                        <th className="px-4 py-3 text-left">Accounts</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {licenses.map((license) => {
                        const product = Array.isArray(license.products) ? license.products[0] : license.products
                        const userInfo = Array.isArray(license.users) ? license.users[0] : license.users
                        const daysRemaining = license.expires_at 
                          ? Math.ceil((new Date(license.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                          : null
                        
                        const statusVariant: { [key: string]: string } = {
                          active: 'bg-green-500/20 text-green-400 border-green-500/30',
                          paused: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
                          expired: 'bg-red-500/20 text-red-400 border-red-500/30',
                          cancelled: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
                          suspended: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
                          revoked: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
                        };

                        return (
                          <tr key={license.id} className="hover:bg-background/50 transition-colors">
                            <td className="px-4 py-3">
                              <code className="text-xs font-mono bg-background/50 px-2 py-1 rounded border border-border/50 text-neon">
                                {license.license_key.substring(0, 8)}...
                              </code>
                            </td>
                            <td className="px-4 py-3 text-sm text-muted-foreground">
                              {userInfo?.email || 'N/A'}
                            </td>
                            <td className="px-4 py-3 text-sm text-foreground">
                              {product?.name || 'N/A'}
                            </td>
                            <td className="px-4 py-3">
                              <Badge className={`border ${statusVariant[license.status]}`}>
                                {license.status}
                              </Badge>
                            </td>
                            <td className="px-4 py-3 text-sm text-muted-foreground">
                              {license.expires_at ? (
                                <div>
                                  <div>{new Date(license.expires_at).toLocaleDateString()}</div>
                                  {daysRemaining !== null && daysRemaining > 0 && (
                                    <div className={`text-xs ${daysRemaining <= 7 ? 'text-red-400' : 'text-muted-foreground'}`}>
                                      {daysRemaining} days left
                                    </div>
                                  )}
                                </div>
                              ) : (
                                'Never'
                              )}
                            </td>
                            <td className="px-4 py-3 text-sm text-foreground">
                              {license.mt5_accounts?.length || 0} / {product?.max_accounts || 3}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="hover:bg-background/50">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="glass-card">
                                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                  <DropdownMenuSeparator className="bg-border/50" />
                                  <DropdownMenuItem asChild>
                                    <Link href={`/admin/licenses/${license.id}`} className="flex items-center gap-2 cursor-pointer">
                                      <Eye className="h-4 w-4" />
                                      View Details
                                    </Link>
                                  </DropdownMenuItem>
                                  {license.status === 'active' ? (
                                    <DropdownMenuItem asChild>
                                      <form action={pauseLicense} className="w-full">
                                        <input type="hidden" name="id" value={license.id} />
                                        <button type="submit" className="flex w-full items-center gap-2 cursor-pointer">
                                          <Pause className="h-4 w-4" />
                                          Pause
                                        </button>
                                      </form>
                                    </DropdownMenuItem>
                                  ) : license.status === 'paused' ? (
                                    <DropdownMenuItem asChild>
                                      <form action={resumeLicense} className="w-full">
                                        <input type="hidden" name="id" value={license.id} />
                                        <button type="submit" className="flex w-full items-center gap-2 cursor-pointer">
                                          <Play className="h-4 w-4" />
                                          Resume
                                        </button>
                                      </form>
                                    </DropdownMenuItem>
                                  ) : null}
                                  <DropdownMenuItem>
                                    <Clock className="h-4 w-4 mr-2" />
                                    Extend
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator className="bg-border/50" />
                                  <DropdownMenuItem asChild>
                                    <form action={deleteLicense} className="w-full">
                                      <input type="hidden" name="id" value={license.id} />
                                      <button
                                        type="submit"
                                        className="flex w-full items-center gap-2 text-red-400 cursor-pointer"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                        Delete
                                      </button>
                                    </form>
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <Key className="mx-auto h-12 w-12 text-neon/50 mb-3" />
                <h3 className="mt-4 text-lg font-semibold text-foreground">No licenses yet</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Generate your first license above.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}
