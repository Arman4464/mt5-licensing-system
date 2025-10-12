import { requireAdmin } from '@/utils/admin'
import { AdminNav } from '@/components/admin-nav'
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
    <div className="min-h-screen bg-background">
      <AdminNav userEmail={user.email || ''} />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Licenses</h1>
          <p className="text-muted-foreground mt-2">
            Manage customer licenses and MT5 accounts
          </p>
        </div>

        {/* Generate License Card */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Generate New License
            </CardTitle>
            <CardDescription>
              Create a new license for a customer
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
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="">Select product</option>
                    {products?.map((product) => (
                      <option key={product.id} value={product.id}>
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
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button type="submit" className="gap-2">
                  <Key className="h-4 w-4" />
                  Generate & Email License
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Licenses Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>All Licenses</CardTitle>
                <CardDescription>
                  {licenses?.length || 0} total licenses
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="icon">
                  <Search className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon">
                  <Filter className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {licenses && licenses.length > 0 ? (
              <div className="rounded-md border">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="px-4 py-3 text-left text-sm font-medium">License Key</th>
                        <th className="px-4 py-3 text-left text-sm font-medium">Customer</th>
                        <th className="px-4 py-3 text-left text-sm font-medium">Product</th>
                        <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
                        <th className="px-4 py-3 text-left text-sm font-medium">Expires</th>
                        <th className="px-4 py-3 text-left text-sm font-medium">Accounts</th>
                        <th className="px-4 py-3 text-right text-sm font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {licenses.map((license) => {
                        const product = Array.isArray(license.products) ? license.products[0] : license.products
                        const userInfo = Array.isArray(license.users) ? license.users[0] : license.users
                        const daysRemaining = license.expires_at 
                          ? Math.ceil((new Date(license.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                          : null

                        return (
                          <tr key={license.id} className="border-b hover:bg-muted/50 transition-colors">
                            <td className="px-4 py-3">
                              <code className="text-xs font-mono bg-muted px-2 py-1 rounded">
                                {license.license_key}
                              </code>
                            </td>
                            <td className="px-4 py-3 text-sm">
                              {userInfo?.email || 'N/A'}
                            </td>
                            <td className="px-4 py-3 text-sm">
                              {product?.name || 'N/A'}
                            </td>
                            <td className="px-4 py-3">
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
                            </td>
                            <td className="px-4 py-3 text-sm">
                              {license.expires_at ? (
                                <div>
                                  <div>{new Date(license.expires_at).toLocaleDateString()}</div>
                                  {daysRemaining !== null && daysRemaining > 0 && (
                                    <div className={`text-xs ${daysRemaining <= 7 ? 'text-red-500' : 'text-muted-foreground'}`}>
                                      {daysRemaining} days left
                                    </div>
                                  )}
                                </div>
                              ) : (
                                'Never'
                              )}
                            </td>
                            <td className="px-4 py-3 text-sm">
                              {license.mt5_accounts?.length || 0} / {product?.max_accounts || 3}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem asChild>
                                    <Link href={`/admin/licenses/${license.id}`} className="flex items-center gap-2">
                                      <Eye className="h-4 w-4" />
                                      View Details
                                    </Link>
                                  </DropdownMenuItem>
                                  {license.status === 'active' ? (
                                    <DropdownMenuItem asChild>
                                      <form action={pauseLicense}>
                                        <input type="hidden" name="id" value={license.id} />
                                        <button type="submit" className="flex w-full items-center gap-2">
                                          <Pause className="h-4 w-4" />
                                          Pause
                                        </button>
                                      </form>
                                    </DropdownMenuItem>
                                  ) : license.status === 'paused' ? (
                                    <DropdownMenuItem asChild>
                                      <form action={resumeLicense}>
                                        <input type="hidden" name="id" value={license.id} />
                                        <button type="submit" className="flex w-full items-center gap-2">
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
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem asChild>
  <form action={deleteLicense}>
    <input type="hidden" name="id" value={license.id} />
    <button
      type="submit"
      className="flex w-full items-center gap-2 text-red-600"
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
                <Key className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">No licenses yet</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Generate your first license above
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
