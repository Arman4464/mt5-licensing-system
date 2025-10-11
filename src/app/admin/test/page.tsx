import { requireAdmin } from '@/utils/admin'

export default async function TestPage() {
  const { supabase } = await requireAdmin()

  // Test 1: Check admin status
  const { data: adminCheck, error: adminError } = await supabase
    .rpc('is_admin')

  // Test 2: Can we read products?
  const { data: products, error: productsError } = await supabase
    .from('products')
    .select('*')

  // Test 3: Can we read users?
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('*')

  // Test 4: Can we insert to users?
  const { data: testUser, error: testUserError } = await supabase
    .from('users')
    .insert({ email: 'test-' + Date.now() + '@test.com', full_name: 'Test' })
    .select()
    .single()

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <h1 className="text-2xl font-bold">Database Connection Test</h1>

        <div className="rounded-lg bg-white p-6 shadow">
          <h2 className="font-semibold mb-2">1. Admin Check</h2>
          <pre className="bg-gray-50 p-4 rounded text-xs overflow-auto">
            {JSON.stringify({ data: adminCheck, error: adminError }, null, 2)}
          </pre>
        </div>

        <div className="rounded-lg bg-white p-6 shadow">
          <h2 className="font-semibold mb-2">2. Products Query</h2>
          <pre className="bg-gray-50 p-4 rounded text-xs overflow-auto">
            {JSON.stringify({ count: products?.length, error: productsError }, null, 2)}
          </pre>
        </div>

        <div className="rounded-lg bg-white p-6 shadow">
          <h2 className="font-semibold mb-2">3. Users Query</h2>
          <pre className="bg-gray-50 p-4 rounded text-xs overflow-auto">
            {JSON.stringify({ count: users?.length, error: usersError }, null, 2)}
          </pre>
        </div>

        <div className="rounded-lg bg-white p-6 shadow">
          <h2 className="font-semibold mb-2">4. User Insert Test</h2>
          <pre className="bg-gray-50 p-4 rounded text-xs overflow-auto">
            {JSON.stringify({ data: testUser, error: testUserError }, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  )
}
