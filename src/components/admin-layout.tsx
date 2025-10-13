'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Key,
  Package,
  Users,
  BarChart,
  Shield,
  Cog,
  LogOut,
  FileText,
  FileUp,
  FlaskConical,
  ChevronDown,
} from 'lucide-react'
import { Button } from './ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export function AdminLayout({
  children,
  user,
}: {
  children: React.ReactNode
  user: { email?: string }
}) {
  const pathname = usePathname()

  const navigation = [
    { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { name: 'Analytics', href: '/admin/analytics', icon: BarChart },
    { name: 'Licenses', href: '/admin/licenses', icon: Key },
    { name: 'Products', href: '/admin/products', icon: Package },
    { name: 'Users', href: '/admin/users', icon: Users },
    { name: 'Categories', href: '/admin/categories', icon: FileText },
    { name: 'Batch Ops', href: '/admin/batch', icon: FileUp },
    { name: 'Security', href: '/admin/security', icon: Shield },
    { name: 'Settings', href: '/admin/settings', icon: Cog },
    { name: 'Test Area', href: '/admin/test', icon: FlaskConical },
  ]

  return (
    <div className="min-h-screen gradient-bg flex">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 p-4">
        <div className="h-full glass-card p-4 flex flex-col border-0">
          {/* Logo */}
          <div className="text-center mb-8">
            <Link href="/admin" className="inline-flex items-center gap-2 mb-2">
              <div className="text-3xl">📊</div>
              <h1 className="text-2xl font-bold">
                Admin<span className="gradient-text">8</span>
              </h1>
            </Link>
            <p className="text-xs text-muted-foreground">Mark8Pips Panel</p>
          </div>

          {/* Navigation */}
          <nav className="flex-grow space-y-2">
            {navigation.map((item) => {
              const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href))
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all hover-lift ${
                    isActive
                      ? 'bg-neon text-black shadow-lg'
                      : 'text-muted-foreground hover:bg-background/50 hover:text-foreground'
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.name}</span>
                </Link>
              )
            })}
          </nav>

          {/* User Menu */}
          <div className="mt-auto">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="w-full justify-between items-center h-12 hover:bg-background/50">
                  <div className="flex items-center gap-2 text-left">
                    <div className="w-8 h-8 rounded-full bg-gradient-neon flex items-center justify-center text-black font-bold">
                      {user.email?.[0].toUpperCase()}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-medium text-foreground truncate max-w-[100px]">{user.email}</span>
                      <span className="text-xs text-muted-foreground">Admin</span>
                    </div>
                  </div>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 glass-card" align="end">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Link href="/admin/settings" className="w-full flex items-center">
                    <Cog className="h-4 w-4 mr-2" /> Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <form action="/auth/signout" method="post" className="w-full">
                  <DropdownMenuItem asChild>
                    <button type="submit" className="w-full flex items-center cursor-pointer">
                      <LogOut className="h-4 w-4 mr-2" /> Sign Out
                    </button>
                  </DropdownMenuItem>
                </form>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-auto">
        {children}
      </main>
    </div>
  )
}
