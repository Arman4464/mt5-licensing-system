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
    <div className="min-h-screen flex flex-col gradient-bg">
      <nav className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <div className="text-3xl">�</div>
              <span className="text-xl font-bold">
                Mark<span className="gradient-text">8</span>Pips
              </span>
            </Link>
            
            <div className="flex items-center gap-6">
              <Link href="/#products" className="text-sm font-medium text-muted-foreground hover:text-neon transition-colors">
                Products
              </Link>
              <Link href="/#features" className="text-sm font-medium text-muted-foreground hover:text-neon transition-colors">
                Features
              </Link>
              <Link href="/dashboard" className="text-sm font-medium text-muted-foreground hover:text-neon transition-colors">
                My Licenses
              </Link>
              <Link 
                href="/login" 
                className="rounded-full bg-gradient-neon px-4 py-2 text-sm font-bold text-black button-shine"
              >
                Admin
              </Link>
            </div>
          </div>
        </div>
      </nav>
      
      <main className="flex-grow">
        {children}
      </main>
      
      <footer className="border-t border-border/50 bg-background/50">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid gap-8 md:grid-cols-4">
            <div>
              <h3 className="text-lg font-bold gradient-text">Mark8Pips</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Professional MT5 Trading Solutions
              </p>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-foreground">Products</h4>
              <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                <li><Link href="/#products" className="hover:text-neon transition-colors">All EAs</Link></li>
                <li><Link href="/#features" className="hover:text-neon transition-colors">Features</Link></li>
                <li><Link href="/#pricing" className="hover:text-neon transition-colors">Pricing</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-foreground">Support</h4>
              <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                <li><Link href="/docs" className="hover:text-neon transition-colors">Documentation</Link></li>
                <li><Link href="/support" className="hover:text-neon transition-colors">Contact</Link></li>
                <li><Link href="/faq" className="hover:text-neon transition-colors">FAQ</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-foreground">Legal</h4>
              <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                <li><Link href="/terms" className="hover:text-neon transition-colors">Terms</Link></li>
                <li><Link href="/privacy" className="hover:text-neon transition-colors">Privacy</Link></li>
                <li><Link href="/refund" className="hover:text-neon transition-colors">Refund Policy</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 border-t border-border/50 pt-8 text-center text-sm text-muted-foreground">
            © 2025 Mark8Pips. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}
