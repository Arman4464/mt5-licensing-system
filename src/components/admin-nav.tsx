'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export function AdminNav({ userEmail }: { userEmail: string }) {
  const pathname = usePathname()

  const navigation = [
    { name: 'Dashboard', href: '/admin', current: pathname === '/admin' },
    { name: 'Licenses', href: '/admin/licenses', current: pathname === '/admin/licenses' },
    { name: 'Products', href: '/admin/products', current: pathname === '/admin/products' },
  ]

  return (
    <nav className="border-b border-gray-200 bg-white shadow-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 justify-between">
          <div className="flex">
            <div className="flex flex-shrink-0 items-center">
              <span className="text-xl font-bold text-blue-600">MT5 License Manager</span>
            </div>
            <div className="ml-10 flex space-x-8">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium transition-colors ${
                    item.current
                      ? 'border-blue-500 text-gray-900'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  }`}
                >
                  {item.name}
                </Link>
              ))}
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium text-gray-700">{userEmail}</span>
            <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
              Admin
            </span>
          </div>
        </div>
      </div>
    </nav>
  )
}
