import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'

import { cn } from '@/lib/utils'

// On-theme purple family: muted indigo -> primary -> violet bloom.
const SLICES = [
  { key: 'TODO', name: 'To do', color: 'hsl(244 24% 50%)' },
  { key: 'IN_PROGRESS', name: 'In progress', color: 'hsl(256 90% 68%)' },
  { key: 'DONE', name: 'Done', color: 'hsl(276 84% 70%)' },
]

function DonutTooltip({ active, payload, total }) {
  if (!active || !payload?.length) return null
  const { name, value } = payload[0]
  const pct = total ? Math.round((value / total) * 100) : 0
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-1.5 text-xs shadow-xl">
      <span className="font-medium text-foreground">{name}</span>
      <span className="text-muted-foreground">
        {' '}
        - {value} ({pct}%)
      </span>
    </div>
  )
}

/** Donut of tasks by status with a centered total and a legend. */
export function StatusDonut({ counts }) {
  const total = counts.TODO + counts.IN_PROGRESS + counts.DONE
  const data = SLICES.map((s) => ({ ...s, value: counts[s.key] ?? 0 })).filter(
    (d) => d.value > 0,
  )

  return (
    <div>
      <div className="relative h-52 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius="64%"
              outerRadius="90%"
              paddingAngle={data.length > 1 ? 2 : 0}
              stroke="none"
              isAnimationActive={false}
            >
              {data.map((d) => (
                <Cell key={d.key} fill={d.color} />
              ))}
            </Pie>
            <Tooltip
              content={<DonutTooltip total={total} />}
              cursor={false}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold tracking-tight">{total}</span>
          <span className="text-xs text-muted-foreground">tasks</span>
        </div>
      </div>

      <ul className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5">
        {SLICES.map((s) => (
          <li
            key={s.key}
            className="flex items-center gap-1.5 text-xs text-muted-foreground"
          >
            <span
              className={cn('size-2 rounded-full')}
              style={{ backgroundColor: s.color }}
            />
            {s.name}
            <span className="font-medium text-foreground">{counts[s.key] ?? 0}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
