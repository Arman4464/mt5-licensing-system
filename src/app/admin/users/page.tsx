import { requireAdmin } from '@/utils/admin'
import { AdminNav } from '@/components/admin-nav'
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

async function blockUser(formData: FormData) {
  'use server'
  
  const { adminClient } = await requireAdmin()
  const userId = formData.get('user_id') as string

  console.log('[USER-BLOCK]', userId)

  // Suspend all user's licenses
  const { error } = await adminClient
    .from('licenses')
    .update({ status: 'suspended' })
    .eq('user_id', userId)

  if (error) {
    console.error('[USER-BLOCK] Error:', error)
    revalidatePath('/admin/users')
    return redirect('/admin/users?error=' + encodeURIComponent('Failed to block user'))
  }

  console.log('[USER-BLOCK] ✅ Success')
  revalidatePath('/admin/users')
  redirect('/admin/users?success=' + encodeURIComponent('User blocked successfully'))
}

async function unblockUser(formData: FormData) {
  'use server'
  
  const { adminClient } = await requireAdmin()
  const userId = formData.get('user_id') as string

  console.log('[USER-UNBLOCK]', userId)

  // Reactivate all user's licenses
  const { error } = await adminClient
    .from('licenses')
    .update({ status: 'active' })
    .eq('user_id', userId)

  if (error) {
    console.error('[USER-UNBLOCK] Error:', error)
    revalidatePath('/admin/users')
    return redirect('/admin/users?error=' + encodeURIComponent('Failed to unblock user'))
  }

  console.log('[USER-UNBLOCK] ✅ Success')
  revalidatePath('/admin/users')
  redirect('/admin/users?success=' + encodeURIComponent('User unblocked successfully'))
}

async function deleteUser(formData: FormData) {
  'use server'
  
  const { adminClient } = await requireAdmin()
  const userId = formData.get('user_id') as string

  console.log('[USER-DELETE]', userId)

  // Delete all user's licenses and MT5 accounts (cascade)
  const { error } = await adminClient
    .from('users')
    .delete()
    .eq('id', userId)

  if (error) {
    console.error('[USER-DELETE] Error:', error)
    revalidatePath('/admin/users')
    return redirect('/admin/users?error=' + encodeURIComponent('Failed to delete user'))
  }

  console.log('[USER-DELETE] ✅ Success')
  revalidatePath('/admin/users')
  redirect('/admin/users?success=' + encodeURIComponent('User deleted successfully'))
}

export default async function UsersPage({
  searchParams,
}: {
  searchParams: { search?: string }
}) {
  const { user: adminUser, adminClient } = await requireAdmin()

  const searchQuery = searchParams.search || ''

  // Get users with license count
  let query = adminClient
    .from('users')
    .select(`
      *,
      licenses(count, status)
    `)
    .order('created_at', { ascending: false })

  if (searchQuery) {
    query = query.or(`email.ilike.%${searchQuery}%,full_name.ilike.%${searchQuery}%`)
  }

  const { data: users } = await query

  return (
    <div className="min-h-screen gradient-bg">
      <AdminNav userEmail={adminUser.email || ''} />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 page-transition">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight mb-2">Users</h1>
          <p className="text-muted-foreground">
            Manage customer accounts and permissions
          </p>
        </div>

        {/* Search Bar */}
        <Card className="mb-8 glass-card border-0 shadow-xl">
          <CardContent className="p-6">
            <form method="get" className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  name="search"
                  placeholder="Search by email or name..."
                  defaultValue={searchQuery}
                  className="pl-10 bg-background/50 border-border/50 focus:border-[#CFFF04]"
                />
              </div>
              <Button type="submit" className="gap-2 bg-gradient-neon hover:opacity-90 text-black">
                <Search className="h-4 w-4" />
                Search
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Users List */}
        <Card className="glass-card border-0 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UsersIcon className="h-5 w-5 text-[#CFFF04]" />
              All Users
            </CardTitle>
            <CardDescription>
              {users?.length || 0} registered customers
            </CardDescription>
          </CardHeader>
          <CardContent>
            {users && users.length > 0 ? (
              <div className="space-y-4">
                {users.map((user) => {
                  const licensesArray = Array.isArray(user.licenses) ? user.licenses : []
                  const totalLicenses = licensesArray.length
                  const activeLicenses = licensesArray.filter((l: License) => l.status === 'active').length
                  const hasBlockedLicense = licensesArray.some((l: License) => l.status === 'suspended')

                  return (
                    <div
                      key={user.id}
                      className="table-row flex items-center justify-between p-4 rounded-lg border border-border/50"
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <div className="h-12 w-12 rounded-full bg-gradient-neon flex items-center justify-center text-black font-bold text-lg">
                          {user.email.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-semibold">{user.full_name || 'No Name'}</p>
                            {hasBlockedLicense && (
                              <Badge variant="destructive" className="text-xs">
                                <ShieldOff className="h-3 w-3 mr-1" />
                                Blocked
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {user.email}
                            </span>
                            <span className="flex items-center gap-1">
                              <Key className="h-3 w-3" />
                              {activeLicenses}/{totalLicenses} licenses
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/admin/users/${user.id}`}>
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Link>
                        </Button>

                        {hasBlockedLicense ? (
                          <form action={unblockUser}>
                            <input type="hidden" name="user_id" value={user.id} />
                            <Button variant="ghost" size="sm" type="submit" className="text-green-600 hover:text-green-700">
                              <Shield className="h-4 w-4 mr-1" />
                              Unblock
                            </Button>
                          </form>
                        ) : (
                          <form action={blockUser}>
                            <input type="hidden" name="user_id" value={user.id} />
                            <Button variant="ghost" size="sm" type="submit" className="text-yellow-600 hover:text-yellow-700">
                              <ShieldOff className="h-4 w-4 mr-1" />
                              Block
                            </Button>
                          </form>
                        )}

                        <form action={deleteUser}>
                          <input type="hidden" name="user_id" value={user.id} />
                          <Button
                            variant="ghost"
                            size="sm"
                            type="submit"
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </form>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <UsersIcon className="mx-auto h-12 w-12 text-muted-foreground/50 mb-3" />
                <h3 className="text-lg font-semibold mb-1">No users found</h3>
                <p className="text-sm text-muted-foreground">
                  {searchQuery ? 'Try a different search term' : 'Users will appear here as they register'}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
