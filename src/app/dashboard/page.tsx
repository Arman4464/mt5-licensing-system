import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export default async function DashboardPage() {
  const supabase = await createClient()
  
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between">
            <div className="flex">
              <div className="flex flex-shrink-0 items-center">
                <h1 className="text-xl font-bold text-gray-900">MT5 License Manager</h1>
              </div>
            </div>
            <div className="flex items-center">
              <span className="text-sm text-gray-700">{user.email}</span>
            </div>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-lg bg-white p-6 shadow">
          <h2 className="text-2xl font-bold text-gray-900">Welcome to Your Dashboard</h2>
          <p className="mt-2 text-gray-600">
            Your licensing system is now set up and ready to use!
          </p>
          
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-lg border border-gray-200 p-4">
              <h3 className="font-semibold text-gray-900">Active Licenses</h3>
              <p className="mt-2 text-3xl font-bold text-blue-600">0</p>
            </div>
            <div className="rounded-lg border border-gray-200 p-4">
              <h3 className="font-semibold text-gray-900">MT5 Accounts</h3>
              <p className="mt-2 text-3xl font-bold text-green-600">0</p>
            </div>
            <div className="rounded-lg border border-gray-200 p-4">
              <h3 className="font-semibold text-gray-900">Total Users</h3>
              <p className="mt-2 text-3xl font-bold text-purple-600">1</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
