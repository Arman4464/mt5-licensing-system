import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'

export default async function CustomerPortalPage() {
  const supabase = await createClient()
  
  let user
  try {
    const { data: { user: authUser } } = await supabase.auth.getUser()
    user = authUser
  } catch (error) {
    console.error('Auth error:', error)
    redirect('/login?redirect=/portal')
  }

  if (!user) {
    redirect('/login?redirect=/portal')
  }

  let customerUser
  let licenses

  try {
    // Get customer's user record
    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('email', user.email)
      .maybeSingle()

    if (!existingUser) {
      // Create user if doesn't exist
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({ 
          email: user.email, 
          full_name: user.email?.split('@')[0] || 'Customer'
        })
        .select()
        .single()
      
      if (createError || !newUser) {
        console.error('User creation error:', createError)
        redirect('/login')
      }
      customerUser = newUser
    } else {
      customerUser = existingUser
    }

    // Get licenses
    const { data: licensesData } = await supabase
      .from('licenses')
      .select(`
        *,
        products(name, description, max_accounts),
        mt5_accounts(*)
      `)
      .eq('user_id', customerUser.id)
      .order('created_at', { ascending: false })

    licenses = licensesData || []
  } catch (error) {
    console.error('Portal data fetch error:', error)
    licenses = []
  }

  const activeLicenses = licenses?.filter(l => l.status === 'active').length || 0
  const totalAccounts = licenses?.reduce((sum, l) => sum + (l.mt5_accounts?.length || 0), 0) || 0

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🛡️</span>
              <h1 className="text-xl font-bold text-gray-900">Mark8Pips Portal</h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">{user.email}</span>
              <form action="/auth/signout" method="post">
                <button className="rounded-md bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300">
                  Sign Out
                </button>
              </form>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Welcome back, {customerUser?.full_name || 'Customer'}!</h2>
          <p className="mt-2 text-gray-600">Manage your licenses and MT5 accounts</p>
        </div>

        {/* Stats Cards */}
        <div className="mb-8 grid gap-6 md:grid-cols-3">
          <div className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Licenses</p>
                <p className="mt-2 text-3xl font-bold text-blue-600">{activeLicenses}</p>
              </div>
              <div className="rounded-full bg-blue-100 p-3">
                <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">MT5 Accounts</p>
                <p className="mt-2 text-3xl font-bold text-green-600">{totalAccounts}</p>
              </div>
              <div className="rounded-full bg-green-100 p-3">
                <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Licenses</p>
                <p className="mt-2 text-3xl font-bold text-purple-600">{licenses?.length || 0}</p>
              </div>
              <div className="rounded-full bg-purple-100 p-3">
                <svg className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-8 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
          <h3 className="text-lg font-semibold">Need More Licenses?</h3>
          <p className="mt-2 text-sm opacity-90">Purchase additional licenses to unlock more features</p>
          <Link
            href="/#products"
            className="mt-4 inline-block rounded-lg bg-white px-6 py-2 text-sm font-semibold text-blue-600 hover:bg-gray-100"
          >
            Browse Products
          </Link>
        </div>

        {/* Licenses List */}
        <div className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Licenses</h3>
          
          {licenses && licenses.length > 0 ? (
            <div className="space-y-4">
              {licenses.map((license) => {
                const product = Array.isArray(license.products) ? license.products[0] : license.products
                const daysRemaining = license.expires_at 
                  ? Math.ceil((new Date(license.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                  : null
                const isExpiringSoon = daysRemaining !== null && daysRemaining <= 7 && daysRemaining > 0
                const isExpired = daysRemaining !== null && daysRemaining < 0

                return (
                  <div key={license.id} className="rounded-lg border border-gray-200 p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h4 className="font-semibold text-gray-900">{product?.name || 'Product'}</h4>
                          <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            license.status === 'active' 
                              ? 'bg-green-100 text-green-800' 
                              : license.status === 'suspended'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {license.status}
                          </span>
                        </div>
                        
                        <div className="mt-3 space-y-2">
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-gray-500">License Key:</span>
                            <code className="rounded bg-gray-100 px-2 py-1 font-mono text-xs text-gray-900">
                              {license.license_key}
                            </code>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(license.license_key)
                                alert('License key copied!')
                              }}
                              className="text-blue-600 hover:text-blue-700"
                            >
                              📋 Copy
                            </button>
                          </div>

                          <div className="flex items-center gap-4 text-sm">
                            <span className="text-gray-500">
                              MT5 Accounts: <strong>{license.mt5_accounts?.length || 0}/{product?.max_accounts || 3}</strong>
                            </span>
                            {daysRemaining !== null && (
                              <span className={`font-medium ${
                                isExpired ? 'text-red-600' : isExpiringSoon ? 'text-yellow-600' : 'text-gray-600'
                              }`}>
                                {isExpired 
                                  ? `Expired ${Math.abs(daysRemaining)} days ago` 
                                  : `${daysRemaining} days remaining`
                                }
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                        <Link
                          href={`/portal/license/${license.id}`}
                          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                        >
                          Manage
                        </Link>
                        {(isExpiringSoon || isExpired) && (
                          <Link
                            href={`/renew?key=${license.license_key}`}
                            className="rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
                          >
                            Renew
                          </Link>
                        )}
                      </div>
                    </div>

                    {/* MT5 Accounts List */}
                    {license.mt5_accounts && license.mt5_accounts.length > 0 && (
                      <div className="mt-4 border-t border-gray-200 pt-4">
                        <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Connected MT5 Accounts</p>
                        <div className="space-y-2">
                          {license.mt5_accounts.map((account: { id: string; account_number: number; broker_server: string; last_used_at: string }) => (
                            <div key={account.id} className="flex items-center justify-between rounded bg-gray-50 px-3 py-2 text-sm">
                              <span className="font-mono text-gray-900">{account.account_number}</span>
                              <span className="text-gray-600">{account.broker_server}</span>
                              <span className="text-xs text-gray-500">
                                {new Date(account.last_used_at).toLocaleDateString()}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">🔑</div>
              <h3 className="text-lg font-medium text-gray-900">No Licenses Yet</h3>
              <p className="mt-2 text-gray-600">Purchase a license to get started</p>
              <Link
                href="/#products"
                className="mt-4 inline-block rounded-md bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Browse Products
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
