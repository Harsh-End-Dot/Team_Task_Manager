import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

function Block({ className }) {
  return <div className={cn('animate-pulse rounded-md bg-secondary/60', className)} />
}

/** Loading placeholder mirroring the dashboard layout (skeleton, not a spinner). */
export function DashboardSkeleton() {
  return (
    <div className="space-y-5">
      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="flex items-center gap-4 p-5">
              <Block className="size-11 rounded-xl" />
              <div className="space-y-2">
                <Block className="h-6 w-10" />
                <Block className="h-3 w-16" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Donut + project progress */}
      <div className="grid gap-5 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <Block className="h-4 w-32" />
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            <Block className="size-40 rounded-full" />
            <Block className="h-3 w-48" />
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <Block className="h-4 w-36" />
          </CardHeader>
          <CardContent className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Block className="h-3 w-40" />
                <Block className="h-2 w-full" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Three list panels */}
      <div className="grid gap-5 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-3">
              <Block className="h-4 w-28" />
            </CardHeader>
            <CardContent className="space-y-3">
              {Array.from({ length: 4 }).map((_, j) => (
                <Block key={j} className="h-5 w-full" />
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
