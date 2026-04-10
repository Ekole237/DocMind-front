import { Card, CardContent } from "@workspace/ui/components/card"

interface MetricCardProps {
  label: string
  value: number
  description?: string
  variant?: "default" | "warning" | "danger"
}

export function MetricCard({ label, value, description, variant = "default" }: MetricCardProps) {
  const valueColor =
    variant === "danger" && value > 0
      ? "text-destructive"
      : variant === "warning" && value > 0
        ? "text-orange-500"
        : "text-foreground"

  return (
    <Card>
      <CardContent className="pt-6">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <p className={`mt-2 text-4xl font-bold ${valueColor}`}>{value}</p>
        {description && <p className="mt-1 text-xs text-muted-foreground">{description}</p>}
      </CardContent>
    </Card>
  )
}
