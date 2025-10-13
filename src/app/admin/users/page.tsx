import { requireAdmin } from '@/utils/admin'
import { AdminLayout } from '@/components/admin-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  Users as UsersIcon, 
  Search, 
  Mail, 
  Key,
  Shield,
  ShieldOff,
  Trash2,
  Eye
} from 'lucide-react'
import Link from 'next/link'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import type { License } from '@/types'
import { Toast } from '@/components/toast'
import { Suspense } from 'react'

async function blockUser(formData: FormData) {
  'use server'
  
  const { adminClient } = await requireAdmin()
  const userId = formData.get('user_id') as string

  const { error } = await adminClient
    .from('licenses')
    .update({ status: 'paused' }) // Use 'paused' instead of 'suspended'
    .eq('user_id', userId)

  if (error) {
    revalidatePath('/admin/users')
    return redirect('/admin/users?error=' + encodeURIComponent('Failed to block user'))
  }

  revalidatePath('/admin/users')
  redirect('/admin/users?success=' + encodeURIComponent('User and their licenses have been paused'))
}

async function unblockUser(formData: FormData) {
  'use server'
  
  const { adminClient } = await requireAdmin()
  const userId = formData.get('user_id') as string

  const { error } = await adminClient
    .from('licenses')
    .update({ status: 'active' })
    .eq('user_id', userId)
    .eq('status', 'paused') // Only unblock paused licenses

  if (error) {
    revalidatePath('/admin/users')
    return redirect('/admin/users?error=' + encodeURIComponent('Failed to unblock user'))
  }

  revalidatePath('/admin/users')
  redirect('/admin/users?success=' + encodeURIComponent('User unblocked successfully'))
}

async function deleteUser(formData: FormData) {
  'use server'
  
  const { adminClient } = await requireAdmin()
  const userId = formData.get('user_id') as string

  // Supabase is configured with cascading delete, so deleting a user will delete their licenses.
  const { error } = await adminClient
    .from('users')
    .delete()
    .eq('id', userId)

  if (error) {
    revalidatePath('/admin/users')
    return redirect('/admin/users?error=' + encodeURIComponent('Failed to delete user'))
  }

  revalidatePath('/admin/users')
  redirect('/admin/users?success=' + encodeURIComponent('User and all associated data deleted'))
}

export default async function UsersPage({
  searchParams,
}: {
  searchParams: { search?: string }
}) {
  const { user: adminUser, adminClient } = await requireAdmin()

  const searchQuery = searchParams.search || ''

  let query = adminClient
    .from('users')
    .select(`
      id,
      email,
      full_name,
      created_at,
      licenses(count, status)
    `)
    .order('created_at', { ascending: false })

  if (searchQuery) {
    query = query.or(`email.ilike.%${searchQuery}%,full_name.ilike.%${searchQuery}%`)
  }

  const { data: users } = await query

  return (
    <AdminLayout user={adminUser}>
      <Suspense>
        <Toast />
      </Suspense>
      <div className="page-transition">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight mb-2 gradient-text">Users</h1>
          <p className="text-muted-foreground">
            Manage customer accounts and their license status.
          </p>
        </div>

        {/* Search Bar */}
        <Card className="mb-8 glass-card border-0 shadow-xl">
          <CardContent className="p-6">
            <form method="get" className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  name="search"
                  placeholder="Search by email or name..."
                  defaultValue={searchQuery}
                  className="pl-10 bg-background/50 border-border/50 focus:border-neon h-11"
                />
              </div>
              <Button type="submit" className="h-11 gap-2 bg-gradient-neon text-black font-bold button-shine">
                <Search className="h-4 w-4" />
                Search
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Users List */}
        <Card className="glass-card border-0 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <UsersIcon className="h-6 w-6 text-neon" />
              All Users
            </CardTitle>
            <CardDescription>
              {users?.length || 0} registered customers found.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {users && users.length > 0 ? (
              <div className="space-y-3">
                {users.map((user) => {
                  const licensesArray = (Array.isArray(user.licenses) ? user.licenses : []) as { status: License['status'] }[]
                  const totalLicenses = licensesArray.length
                  const activeLicenses = licensesArray.filter((l) => l.status === 'active').length
                  const hasPausedLicense = licensesArray.some((l) => l.status === 'paused')

                  return (
                    <div
                      key={user.id}
                      className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-lg border border-border/50 hover:bg-background/30 transition-colors"
                    >
                      <div className="flex items-center gap-4 flex-1 mb-4 sm:mb-0">
                        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-neon/50 to-neon/80 flex items-center justify-center text-black font-bold text-xl shadow-lg">
                          {user.email?.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-semibold text-foreground">{user.full_name || 'No Name Provided'}</p>
                            {hasPausedLicense && (
                              <Badge variant="warning" className="text-xs">
                                <ShieldOff className="h-3 w-3 mr-1" />
                                Paused
                              </Badge>
                            )}
                          </div>
                          <div className="flex flex-col sm:flex-row sm:items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1.5">
                              <Mail className="h-3 w-3" />
                              {user.email}
                            </span>
                            <span className="flex items-center gap-1.5">
                              <Key className="h-3 w-3" />
                              {activeLicenses} of {totalLicenses} licenses active
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 w-full sm:w-auto justify-end">
                        <Button variant="ghost" size="icon" asChild className="hover:bg-background/50 hover:text-neon">
                          <Link href={`/admin/users/${user.id}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>

                        {hasPausedLicense ? (
                          <form action={unblockUser}>
                            <input type="hidden" name="user_id" value={user.id} />
                            <Button variant="ghost" size="icon" type="submit" className="text-green-500 hover:text-green-400 hover:bg-green-500/10">
                              <Shield className="h-4 w-4" />
                            </Button>
                          </form>
                        ) : (
                          <form action={blockUser}>
                            <input type="hidden" name="user_id" value={user.id} />
                            <Button variant="ghost" size="icon" type="submit" className="text-yellow-500 hover:text-yellow-400 hover:bg-yellow-500/10">
                              <ShieldOff className="h-4 w-4" />
                            </Button>
                          </form>
                        )}

                        <form action={deleteUser}>
                          <input type="hidden" name="user_id" value={user.id} />
                          <Button variant="ghost" size="icon" type="submit" className="text-red-500 hover:text-red-400 hover:bg-red-500/10">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </form>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-16 text-muted-foreground">
                <UsersIcon className="mx-auto h-12 w-12 text-neon/50 mb-3" />
                <h3 className="text-lg font-semibold text-foreground mb-1">No Users Found</h3>
                <p className="text-sm">
                  {searchQuery ? 'Try a different search term.' : 'Users will appear here as they register.'}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}
