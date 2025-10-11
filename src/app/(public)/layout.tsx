import { Inter } from 'next/font/google'
import Link from 'next/link'
import '../globals.css'

const inter = Inter({ subsets: ['latin'] })

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <nav className="sticky top-0 z-50 border-b border-gray-200 bg-white/80 backdrop-blur-lg">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 items-center justify-between">
              <Link href="/" className="flex items-center gap-2">
                <span className="text-2xl">🛡️</span>
                <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Mark8Pips
                </span>
              </Link>
              
              <div className="flex items-center gap-6">
                <Link href="/#products" className="text-sm font-medium text-gray-700 hover:text-blue-600">
                  Products
                </Link>
                <Link href="/#features" className="text-sm font-medium text-gray-700 hover:text-blue-600">
                  Features
                </Link>
                <Link href="/docs" className="text-sm font-medium text-gray-700 hover:text-blue-600">
                  Docs
                </Link>
                <Link 
                  href="/login" 
                  className="rounded-full bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
                >
                  Sign In
                </Link>
              </div>
            </div>
          </div>
        </nav>
        
        {children}
        
        <footer className="border-t border-gray-200 bg-gray-50">
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
            <div className="grid gap-8 md:grid-cols-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Mark8Pips</h3>
                <p className="mt-2 text-sm text-gray-600">
                  Professional MT5 Expert Advisors & Indicators
                </p>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-900">Products</h4>
                <ul className="mt-4 space-y-2 text-sm text-gray-600">
                  <li><Link href="/#products">All EAs</Link></li>
                  <li><Link href="/#features">Features</Link></li>
                  <li><Link href="/pricing">Pricing</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-900">Support</h4>
                <ul className="mt-4 space-y-2 text-sm text-gray-600">
                  <li><Link href="/docs">Documentation</Link></li>
                  <li><Link href="/support">Contact</Link></li>
                  <li><Link href="/faq">FAQ</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-900">Legal</h4>
                <ul className="mt-4 space-y-2 text-sm text-gray-600">
                  <li><Link href="/terms">Terms</Link></li>
                  <li><Link href="/privacy">Privacy</Link></li>
                  <li><Link href="/refund">Refund Policy</Link></li>
                </ul>
              </div>
            </div>
            <div className="mt-8 border-t border-gray-200 pt-8 text-center text-sm text-gray-500">
              © 2025 Mark8Pips. All rights reserved.
            </div>
          </div>
        </footer>
      </body>
    </html>
  )
}
