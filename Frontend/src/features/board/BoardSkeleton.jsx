import { cn } from '@/lib/utils'
import { STATUS_META } from '@/features/dashboard/meta'
import { COLUMN_ORDER } from './constants'

function Block({ className }) {
  return <div className={cn('animate-pulse rounded-md bg-secondary/60', className)} />
}

/** Loading placeholder mirroring the three columns (skeleton, not a spinner). */
export function BoardSkeleton() {
  return (
    <div className="flex gap-4 overflow-hidden">
      {COLUMN_ORDER.map((status) => {
        const meta = STATUS_META[status]
        return (
          <div key={status} className="flex w-72 shrink-0 flex-col sm:w-80">
            <div className="mb-3 flex items-center gap-2 px-1">
              <span className={cn('size-2 rounded-full', meta.dot)} />
              <span className="text-sm font-semibold text-muted-foreground">
                {meta.label}
              </span>
            </div>
            <div className="space-y-2 rounded-xl border border-border/50 bg-secondary/20 p-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="space-y-3 rounded-xl border border-border/70 bg-card p-3"
                >
                  <Block className="h-3 w-3/4" />
                  <div className="flex items-center gap-2">
                    <Block className="h-4 w-12 rounded-md" />
                    <Block className="ml-auto size-6 rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
