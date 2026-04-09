import { Card, CardContent } from "@workspace/ui/components/card"
import { type ReactNode } from "react"

interface MetricCardProps {
  title: string
  value: string | number
  icon?: ReactNode
  description?: string
}

export function MetricCard({ title, value, icon, description }: MetricCardProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="mt-2 text-3xl font-bold">{value}</p>
            {description && <p className="mt-1 text-xs text-muted-foreground">{description}</p>}
          </div>
          {icon && <div className="ml-4 text-3xl">{icon}</div>}
        </div>
      </CardContent>
    </Card>
  )
}
