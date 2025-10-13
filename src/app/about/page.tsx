import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Award, Target, Users, Zap } from 'lucide-react'

export default function AboutPage() {
  return (
    <div className="min-h-screen gradient-bg">
      <main className="mx-auto max-w-5xl px-4 py-24 sm:px-6 lg:px-8 page-transition">
        {/* Hero */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold tracking-tight mb-4">
            About <span className="gradient-text">Mark8Pips</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            We&apos;re on a mission to democratize algorithmic trading and make professional 
            trading tools accessible to everyone.
          </p>
        </div>

        {/* Story */}
        <Card className="glass-card border-0 shadow-xl mb-16">
          <CardContent className="p-8">
            <h2 className="text-2xl font-bold mb-4">Our Story</h2>
            <div className="space-y-4 text-muted-foreground">
              <p>
                Founded in 2023, Mark8Pips started with a simple vision: to create reliable, 
                professional-grade Expert Advisors that work for traders of all levels.
              </p>
              <p>
                Our team of experienced traders and developers have spent years backtesting, 
                optimizing, and perfecting our algorithms to deliver consistent results in 
                various market conditions.
              </p>
              <p>
                Today, we serve hundreds of traders worldwide, helping them automate their 
                trading strategies and achieve their financial goals.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Values */}
        <div className="grid md:grid-cols-2 gap-6 mb-16">
          <Card className="glass-card border-0 shadow-xl hover-lift">
            <CardContent className="p-6">
              <div className="h-12 w-12 rounded-lg bg-blue-500/10 flex items-center justify-center mb-4">
                <Target className="h-6 w-6 text-blue-500" />
              </div>
              <h3 className="text-xl font-bold mb-2">Our Mission</h3>
              <p className="text-muted-foreground">
                To empower traders with cutting-edge algorithmic trading solutions that are 
                transparent, reliable, and profitable.
              </p>
            </CardContent>
          </Card>

          <Card className="glass-card border-0 shadow-xl hover-lift">
            <CardContent className="p-6">
              <div className="h-12 w-12 rounded-lg bg-[#CFFF04]/10 flex items-center justify-center mb-4">
                <Zap className="h-6 w-6 text-[#CFFF04]" />
              </div>
              <h3 className="text-xl font-bold mb-2">Our Values</h3>
              <p className="text-muted-foreground">
                Transparency, innovation, and customer success drive everything we do. 
                We believe in honest performance reporting and continuous improvement.
              </p>
            </CardContent>
          </Card>

          <Card className="glass-card border-0 shadow-xl hover-lift">
            <CardContent className="p-6">
              <div className="h-12 w-12 rounded-lg bg-emerald-500/10 flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-emerald-500" />
              </div>
              <h3 className="text-xl font-bold mb-2">Community First</h3>
              <p className="text-muted-foreground">
                Our traders are our family. We provide 24/7 support, regular updates, 
                and a thriving community for knowledge sharing.
              </p>
            </CardContent>
          </Card>

          <Card className="glass-card border-0 shadow-xl hover-lift">
            <CardContent className="p-6">
              <div className="h-12 w-12 rounded-lg bg-purple-500/10 flex items-center justify-center mb-4">
                <Award className="h-6 w-6 text-purple-500" />
              </div>
              <h3 className="text-xl font-bold mb-2">Proven Track Record</h3>
              <p className="text-muted-foreground">
                Years of backtesting, real-world trading results, and satisfied customers 
                speak to the quality of our Expert Advisors.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* CTA */}
        <div className="text-center">
          <Card className="glass-card border-0 shadow-xl">
            <CardContent className="p-12">
              <h2 className="text-2xl font-bold mb-4">Ready to Start Trading?</h2>
              <p className="text-muted-foreground mb-6">
                Join our community of successful traders today
              </p>
              <Button size="lg" asChild className="bg-gradient-neon hover:opacity-90 text-black button-shine">
                <Link href="/products">Browse Products</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
