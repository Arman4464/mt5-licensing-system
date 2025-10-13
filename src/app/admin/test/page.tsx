import { requireAdmin } from '@/utils/admin'
import { AdminLayout } from '@/components/admin-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle, XCircle } from 'lucide-react'

interface TestResult {
  title: string
  success: boolean
  data: any
}

export default async function TestPage() {
  const { user, adminClient } = await requireAdmin()

  const results: TestResult[] = []

  // Test 1: Check admin status
  try {
    const { data, error } = await adminClient.rpc('is_admin')
    if (error) throw error
    results.push({ title: 'Admin Check (is_admin RPC)', success: data === true, data: { isAdmin: data } })
  } catch (error: any) {
    results.push({ title: 'Admin Check (is_admin RPC)', success: false, data: error.message })
  }

  // Test 2: Can we read products?
  try {
    const { data, error, count } = await adminClient.from('products').select('*', { count: 'exact', head: true })
    if (error) throw error
    results.push({ title: 'Read Products Table', success: true, data: { count } })
  } catch (error: any) {
    results.push({ title: 'Read Products Table', success: false, data: error.message })
  }

  // Test 3: Can we read users?
  try {
    const { data, error, count } = await adminClient.from('users').select('*', { count: 'exact', head: true })
    if (error) throw error
    results.push({ title: 'Read Users Table', success: true, data: { count } })
  } catch (error: any) {
    results.push({ title: 'Read Users Table', success: false, data: error.message })
  }

  // Test 4: Can we insert to users? (and then delete)
  try {
    const testEmail = 'test-' + Date.now() + '@test.com'
    const { data: insertedUser, error: insertError } = await adminClient
      .from('users')
      .insert({ email: testEmail, full_name: 'Test User' })
      .select()
      .single()
    
    if (insertError) throw insertError

    const { error: deleteError } = await adminClient
      .from('users')
      .delete()
      .eq('id', insertedUser.id)

    if (deleteError) throw deleteError

    results.push({ title: 'Insert & Delete User', success: true, data: { insertedId: insertedUser.id, deleted: true } })
  } catch (error: any) {
    results.push({ title: 'Insert & Delete User', success: false, data: error.message })
  }

  return (
    <AdminLayout user={user}>
      <div className="page-transition max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight mb-2 gradient-text">Database Connection Test</h1>
          <p className="text-muted-foreground">
            Verifying Supabase connection and RLS policies for the admin user.
          </p>
        </div>

        <div className="space-y-6">
          {results.map((result, index) => (
            <Card key={index} className="glass-card border-0 shadow-xl">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-3">
                  {result.success ? (
                    <CheckCircle className="h-6 w-6 text-green-400" />
                  ) : (
                    <XCircle className="h-6 w-6 text-red-400" />
                  )}
                  {index + 1}. {result.title}
                </CardTitle>
                <span className={`font-bold ${result.success ? 'text-green-400' : 'text-red-400'}`}>
                  {result.success ? 'PASS' : 'FAIL'}
                </span>
              </CardHeader>
              <CardContent>
                <pre className="bg-background/50 p-4 rounded-md text-xs overflow-auto border border-border/50">
                  {JSON.stringify(result.data, null, 2)}
                </pre>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AdminLayout>
  )
}
