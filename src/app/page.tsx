// src/app/page.tsx
// Hardened production-safe homepage with explicit guards for Supabase + RSC

import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  ArrowRight,
  Zap,
  Shield,
  TrendingUp,
  Star,
  Cpu,
  LineChart,
  Sparkles,
  Globe,
  Layers,
  Gauge,
  UserCheck,
} from 'lucide-react'

// Types
type Category = {
  id: string
  name: string
  slug?: string | null
  icon?: string | null
  description?: string | null
}

type Product = {
  id: string
  name: string
  description?: string | null
  price: number
  platform: string
  ea_categories?: Category | Category[] | null
}

// Helpers
function NeonBlob({ className }: { className?: string }) {
  return (
    <div
      className={`pointer-events-none absolute rounded-full blur-3xl opacity-20 mix-blend-screen ${className || ''}`}
      aria-hidden="true"
    />
  )
}

function StatChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="glass-card border border-white/10 rounded-xl p-6 text-center hover-lift">
      <p className="text-4xl md:text-5xl font-extrabold neon-text">{value}</p>
      <p className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
    </div>
  )
}

function FeatureTile({
  icon: Icon,
  title,
  desc,
  accentClass,
}: {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
  title: string
  desc: string
  accentClass: string
}) {
  return (
    <Card className="glass-card border border-white/10 hover-lift h-full">
      <CardHeader className="space-y-4">
        <div className={`h-14 w-14 rounded-xl ${accentClass} flex items-center justify-center`}>
          <Icon className="h-7 w-7" />
        </div>
        <CardTitle className="text-xl">{title}</CardTitle>
        <CardDescription className="leading-relaxed">{desc}</CardDescription>
      </CardHeader>
    </Card>
  )
}

function FeaturedProductCard({ product }: { product: Product }) {
  const raw = product.ea_categories
  const category: Category | undefined =
    Array.isArray(raw) ? (raw[0] as Category | undefined) : (raw ?? undefined)

  return (
    <Link href={`/products/${product.id}`} className="block h-full">
      <Card className="glass-card border border-white/10 hover-lift h-full">
        <CardHeader className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {category?.icon ? (
                <span className="text-2xl" aria-hidden="true">
                  {category.icon}
                </span>
              ) : null}
              <Badge variant={product.platform === 'MT5' ? 'default' : 'secondary'}>
                {product.platform}
              </Badge>
            </div>
            <Star className="h-4 w-4 neon-text" />
          </div>
          <CardTitle className="text-2xl leading-snug">{product.name}</CardTitle>
          {category?.name ? <CardDescription>{category.name}</CardDescription> : null}
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground line-clamp-3">
            {String(product.description ?? '')}
          </p>
          <div className="flex items-center justify-between">
            <p className="text-2xl font-extrabold neon-text">₹{Number(product.price ?? 0)}</p>
            <Button size="sm" className="bg-gradient-neon text-black button-shine">
              View Details
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

function BrandRail() {
  return (
    <div className="mt-16">
      <div className="text-center text-xs uppercase tracking-wider text-muted-foreground">
        Trusted by traders worldwide
      </div>
      <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4 opacity-80">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={`brand-${i}`}
            className="glass-card border border-white/10 rounded-lg py-6 text-center text-muted-foreground"
          >
            <span className="text-sm">Brand {i + 1}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function CategoryCard({
  icon,
  name,
  description,
  href,
}: {
  icon?: string | null
  name: string
  description?: string | null
  href: string
}) {
  return (
    <Link href={href} className="block h-full">
      <Card className="glass-card h-full border border-white/10 hover-lift">
        <CardContent className="p-6 text-center flex flex-col items-center gap-2">
          <div className="text-5xl leading-none">{icon || '📁'}</div>
          <h3 className="mt-2 text-base font-semibold">{name}</h3>
          <p className="text-xs text-muted-foreground">
            {description || 'Well‑tuned strategies'}
          </p>
        </CardContent>
      </Card>
    </Link>
  )
}

function TestimonialCard({
  quote,
  author,
  role,
}: {
  quote: string
  author: string
  role?: string
}) {
  return (
    <Card className="glass-card border border-white/10 hover-lift h-full">
      <CardContent className="p-6 space-y-4">
        <p className="text-sm leading-relaxed text-gray-200">“{quote}”</p>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center">
            <span className="text-lg">👤</span>
          </div>
          <div>
            <div className="text-sm font-medium">{author}</div>
            <div className="text-xs text-muted-foreground">{role || 'Verified Trader'}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function FAQItem({ q, a }: { q: string; a: string }) {
  return (
    <details className="group glass-card border border-white/10 rounded-xl p-4 hover-lift">
      <summary className="cursor-pointer list-none text-sm font-semibold flex items-center justify-between">
        <span>{q}</span>
        <span className="transition-transform group-open:rotate-90">
          <ArrowRight className="h-4 w-4" />
        </span>
      </summary>
      <p className="mt-3 text-sm text-muted-foreground">{a}</p>
    </details>
  )
}

function NewsletterPanel() {
  return (
    <Card className="glass-card border border-white/10">
      <CardContent className="p-8 md:p-10">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <h3 className="text-2xl font-bold">Get Alpha Updates</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Strategy insights, performance notes, and new EA launches—no spam.
            </p>
          </div>
          <form
            className="w-full md:w-auto flex items-center gap-3"
            action="#"
            onSubmit={(e) => e.preventDefault()}
          >
            <input
              type="email"
              required
              placeholder="you@trader.com"
              className="w-full md:w-72 h-11 rounded-md bg-white/5 border border-white/10 px-3 text-sm outline-none focus:border-white/30"
            />
            <Button type="submit" className="h-11 bg-gradient-neon text-black button-shine">
              Subscribe
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  )
}

export default async function HomePage() {
  const supabase = await createClient()

  // Query featured products
  const { data: featuredRaw, error: featuredErr } = await supabase
    .from('products')
    .select('id, name, description, price, platform, ea_categories(name, icon)')
    .eq('is_featured', true)
    .limit(3)

  // If RLS or select fails, use empty list to keep RSC stable
  const featuredProducts: Product[] =
    !featuredErr && Array.isArray(featuredRaw)
      ? featuredRaw.map((p) => ({
          id: String(p.id),
          name: String(p.name ?? ''),
          description: p.description ?? null,
          price: Number(p.price ?? 0),
          platform: String(p.platform ?? ''),
          ea_categories: p.ea_categories ?? null,
        }))
      : []

  // Query categories
  const { data: categoriesRaw, error: catErr } = await supabase
    .from('ea_categories')
    .select('id, name, slug, icon, description')
    .order('name', { ascending: true })

  const categories: Category[] =
    !catErr && Array.isArray(categoriesRaw)
      ? categoriesRaw.map((c) => ({
          id: String(c.id),
          name: String(c.name ?? ''),
          slug: c.slug ?? null,
          icon: c.icon ?? null,
          description: c.description ?? null,
        }))
      : []

  return (
    <div className="relative min-h-screen gradient-bg text-white overflow-clip">
      {/* Decorative blobs */}
      <NeonBlob className="top-[-10%] left-[-10%] w-[36rem] h-[36rem] bg-[rgba(207,255,4,0.6)]" />
      <NeonBlob className="bottom-[-10%] right-[-10%] w-[42rem] h-[42rem] bg-[rgba(56,189,248,0.45)]" />

      {/* Navigation */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-black/70 backdrop-blur">
        <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="text-2xl" aria-hidden="true">
              📊
            </div>
            <span className="text-lg font-bold">
              Mark<span className="neon-text">8</span>Pips
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <Link
              href="/products"
              className="text-sm font-medium text-muted-foreground hover:text-white transition-colors"
            >
              Products
            </Link>
            <Link
              href="/about"
              className="text-sm font-medium text-muted-foreground hover:text-white transition-colors"
            >
              About
            </Link>
            <Link
              href="/contact"
              className="text-sm font-medium text-muted-foreground hover:text-white transition-colors"
            >
              Contact
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild>
              <Link href="/auth/signin">Sign In</Link>
            </Button>
            <Button asChild className="bg-gradient-neon text-black button-shine">
              <Link href="/products">
                Browse EAs
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </nav>
      </header>

      {/* Hero */}
      <section className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-16 pb-14">
        <div className="page-transition">
          <div className="text-center">
            <Badge className="mb-4 bg-white/5 text-white border-white/10">
              Enterprise‑grade automation • Instant activation • Lifetime updates
            </Badge>

            <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight">
              Trade Smarter with
              <span className="block mt-2 gradient-text">AI‑Powered Expert Advisors</span>
            </h1>

            <p className="mt-5 text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
              Premium EAs for MT4 & MT5, engineered for speed, stability, and risk control—backed
              by rigorous backtests and real performance.
            </p>

            <div className="mt-8 flex items-center justify-center gap-4">
              <Button size="lg" asChild className="bg-gradient-neon text-black button-shine">
                <Link href="/products">
                  Explore Products
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/about">Learn More</Link>
              </Button>
            </div>

            {/* Stats */}
            <div className="mt-14 grid grid-cols-2 md:grid-cols-4 gap-5 max-w-4xl mx-auto">
              <StatChip label="Active Traders" value="500+" />
              <StatChip label="Total Profits" value="₹2M+" />
              <StatChip label="User Rating" value="4.9★" />
              <StatChip label="Support" value="24/7" />
            </div>

            <BrandRail />
          </div>
        </div>
      </section>

      {/* Feature grid */}
      <section className="py-20 border-t border-white/10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold">Why Choose Mark8Pips?</h2>
            <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">
              Professional trading tools built by traders, for traders.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <FeatureTile
              icon={Zap}
              title="Lightning Fast"
              desc="Ultra‑optimized execution & minimal latency to ensure entries and exits are never missed."
              accentClass="bg-blue-500/15 text-blue-400"
            />
            <FeatureTile
              icon={Shield}
              title="Risk Management"
              desc="Position sizing, stop logic, equity guards, and drawdown controls for safer automation."
              accentClass="bg-emerald-500/15 text-emerald-400"
            />
            <FeatureTile
              icon={TrendingUp}
              title="Proven Results"
              desc="Backtested strategies with robust metrics, validated on multiple symbols & regimes."
              accentClass="bg-lime-400/15 text-lime-300"
            />
          </div>

          <div className="grid md:grid-cols-3 gap-6 mt-6">
            <FeatureTile
              icon={Cpu}
              title="Smart Engines"
              desc="Adaptive logic reacts to market volatility, sessions, and liquidity for cleaner signals."
              accentClass="bg-fuchsia-500/15 text-fuchsia-400"
            />
            <FeatureTile
              icon={LineChart}
              title="Analytics Ready"
              desc="Transparent performance reporting & exportable logs for your analysis workflow."
              accentClass="bg-sky-500/15 text-sky-400"
            />
            <FeatureTile
              icon={Layers}
              title="Stack Friendly"
              desc="Works seamlessly with your current brokers, VPS setups, and risk dashboards."
              accentClass="bg-amber-500/15 text-amber-400"
            />
          </div>
        </div>
      </section>

      {/* Featured products */}
      {featuredProducts.length > 0 && (
        <section className="py-20 border-t border-white/10">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <Badge className="mb-4 bg-white/5 text-white border-white/10">
                <Star className="h-3 w-3 mr-1" aria-hidden="true" />
                Featured Products
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold">Our Best Sellers</h2>
              <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">
                Top‑rated EAs trusted by traders worldwide.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {featuredProducts.map((p) => (
                <FeaturedProductCard key={p.id} product={p} />
              ))}
            </div>

            <div className="text-center mt-10">
              <Button asChild variant="outline" size="lg" className="hover-lift">
                <Link href="/products">
                  View All Products
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* Categories */}
      {categories.length > 0 && (
        <section className="py-20 border-t border-white/10">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold">Browse by Category</h2>
              <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">
                Explore Expert Advisors by trading style, symbol focus, and behavior.
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
              {categories.map((c) => (
                <CategoryCard
                  key={c.id}
                  icon={c.icon}
                  name={c.name}
                  description={c.description}
                  href={`/products?category=${c.slug ?? c.id}`}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Testimonials */}
      <section className="py-20 border-t border-white/10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold">What Traders Say</h2>
            <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">
              Real results from verified users running our EAs on live accounts.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            <TestimonialCard
              quote="Execution is razor sharp, and the built‑in risk limits saved my month during a volatile spike."
              author="Rajesh P."
              role="Gold & Indices"
            />
            <TestimonialCard
              quote="Setup took minutes. Support clarified session filters and my scalper started printing."
              author="Elena V."
              role="Scalper User"
            />
            <TestimonialCard
              quote="Consistent behavior across brokers with smart filters—exactly what I needed for prop rules."
              author="Marco D."
              role="Funded Account"
            />
          </div>
        </div>
      </section>

      {/* Value props */}
      <section className="py-20 border-t border-white/10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="glass-card border border-white/10">
              <CardContent className="p-6 space-y-2">
                <div className="h-12 w-12 rounded-lg bg-white/5 flex items-center justify-center">
                  <Gauge className="h-6 w-6 text-white/80" />
                </div>
                <h3 className="text-lg font-semibold">Latency‑Aware</h3>
                <p className="text-sm text-muted-foreground">
                  Architecture built for low overhead and consistent behavior under heavy load.
                </p>
              </CardContent>
            </Card>
            <Card className="glass-card border border-white/10">
              <CardContent className="p-6 space-y-2">
                <div className="h-12 w-12 rounded-lg bg-white/5 flex items-center justify-center">
                  <Globe className="h-6 w-6 text-white/80" />
                </div>
                <h3 className="text-lg font-semibold">Broker Friendly</h3>
                <p className="text-sm text-muted-foreground">
                  Works across major brokers and liquidity conditions with configurable filters.
                </p>
              </CardContent>
            </Card>
            <Card className="glass-card border border-white/10">
              <CardContent className="p-6 space-y-2">
                <div className="h-12 w-12 rounded-lg bg-white/5 flex items-center justify-center">
                  <Sparkles className="h-6 w-6 text-white/80" />
                </div>
                <h3 className="text-lg font-semibold">Updates for Life</h3>
                <p className="text-sm text-muted-foreground">
                  Ongoing improvements and refinements aligned with market structure changes.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 border-t border-white/10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold">Frequently Asked Questions</h2>
            <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">
              Short, honest answers so you can make an informed decision.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <FAQItem
              q="Will these EAs work with my broker?"
              a="Yes. Each EA exposes parameters for symbol, session windows, spread and slippage filters, and more."
            />
            <FAQItem
              q="Do I get updates?"
              a="Yes. Lifetime updates are included, and we periodically improve execution logic and risk tooling."
            />
            <FAQItem
              q="How many accounts can I use?"
              a="Licenses specify max accounts; you can upgrade or request additional seats from your dashboard."
            />
            <FAQItem
              q="What about support?"
              a="Fast support with clear guidance on parameterization, VPS setup, and broker nuances."
            />
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-20 border-t border-white/10">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <NewsletterPanel />
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-10">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="text-2xl" aria-hidden="true">
                  📊
                </div>
                <span className="text-lg font-bold">
                  Mark<span className="neon-text">8</span>Pips
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                Professional MT5 trading solutions inspired by modern, world‑class product design.
              </p>
            </div>

            <div>
              <h3 className="text-sm font-semibold mb-3">Products</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="/products" className="hover:text-white transition">
                    All EAs
                  </Link>
                </li>
                <li>
                  <Link href="/products?category=mt5-scalpers" className="hover:text-white transition">
                    Scalpers
                  </Link>
                </li>
                <li>
                  <Link href="/products?category=gold-trading" className="hover:text-white transition">
                    Gold EAs
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-semibold mb-3">Company</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="/about" className="hover:text-white transition">
                    About
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="hover:text-white transition">
                    Contact
                  </Link>
                </li>
                <li>
                  <Link href="/auth/signin" className="hover:text-white transition">
                    Sign In
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-semibold mb-3">Support</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="/contact" className="hover:text-white transition">
                    Help Center
                  </Link>
                </li>
                <li>
                  <Link href="/dashboard" className="hover:text-white transition">
                    My Licenses
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-6 border-t border-white/10 text-center text-xs text-muted-foreground">
            © 2025 Mark8Pips. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}
