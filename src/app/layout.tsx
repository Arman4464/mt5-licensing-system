import type { Metadata } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/sonner'

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
})

export const metadata: Metadata = {
  title: 'Mark8Pips - Professional MT5 Trading Solutions',
  description: 'Premium Expert Advisors for MT4 & MT5. Automated trading strategies backed by years of backtesting and real-world performance.',
  keywords: ['MT5 EA', 'Expert Advisor', 'Forex Trading', 'Automated Trading', 'MT4 Robot'],
  authors: [{ name: 'Mark8Pips' }],
  openGraph: {
    title: 'Mark8Pips - Professional MT5 Trading Solutions',
    description: 'Premium Expert Advisors for automated forex trading',
    type: 'website',
  },
}


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${jetbrainsMono.variable} font-sans`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
