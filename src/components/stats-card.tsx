import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StatsCardProps {
  title: string
  value: string | number
  description?: string
  icon: LucideIcon
  change?: string
  iconColor?: string
}

export function StatsCard({
  title,
  value,
  description,
  icon: Icon,
  change,
  iconColor,
}: StatsCardProps) {
  return (
    <Card className="glass-card border-0 shadow-xl p-6 hover-lift">
      <div className="flex items-center justify-between mb-4">
        <div
          className={cn(
            'rounded-lg bg-background/50 p-3',
            iconColor?.replace('text-', 'bg-') + '/10'
          )}
        >
          <Icon className={cn('h-6 w-6 text-neon', iconColor)} />
        </div>
        {change && (
          <Badge className="bg-background/50 text-muted-foreground border-border/50">
            {change}
          </Badge>
        )}
      </div>
      <div>
        <p className="text-sm text-muted-foreground mb-1">{title}</p>
        <p className="text-3xl font-bold">{value}</p>
        {description && (
          <p className="text-xs text-muted-foreground mt-2">{description}</p>
        )}
      </div>
    </Card>
  )
}
