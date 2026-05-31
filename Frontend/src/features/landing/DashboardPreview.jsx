import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from 'recharts'
import {
  Bell,
  CheckCircle2,
  FolderKanban,
  LayoutDashboard,
  MessageSquare,
  Plus,
  Search,
  Settings,
  Users,
  Zap,
} from 'lucide-react'

const TEAM = [
  { initials: 'AK', color: 'from-violet-500 to-indigo-500' },
  { initials: 'JD', color: 'from-fuchsia-500 to-purple-500' },
  { initials: 'MR', color: 'from-sky-500 to-blue-500' },
  { initials: 'TS', color: 'from-emerald-500 to-teal-500' },
]

const SIDEBAR = [
  { icon: LayoutDashboard, active: true },
  { icon: FolderKanban, active: false },
  { icon: Users, active: false },
  { icon: MessageSquare, active: false },
  { icon: Settings, active: false },
]

const COLUMNS = [
  {
    title: 'To do',
    accent: 'bg-muted-foreground/40',
    cards: [
      { title: 'Design onboarding flow', tag: 'Design', tagColor: 'text-sky-300 bg-sky-500/15', priority: 'bg-amber-400' },
      { title: 'Audit billing webhooks', tag: 'Backend', tagColor: 'text-violet-300 bg-violet-500/15', priority: 'bg-red-400' },
    ],
  },
  {
    title: 'In progress',
    accent: 'bg-primary/70',
    cards: [
      { title: 'Realtime board sync', tag: 'Feature', tagColor: 'text-emerald-300 bg-emerald-500/15', priority: 'bg-primary' },
    ],
  },
  {
    title: 'Done',
    accent: 'bg-emerald-400/70',
    cards: [
      { title: 'Workspace invites', tag: 'Done', tagColor: 'text-emerald-300 bg-emerald-500/15', priority: 'bg-emerald-400', done: true },
    ],
  },
]

const CHART_DATA = [
  { d: 'Mon', v: 12 },
  { d: 'Tue', v: 18 },
  { d: 'Wed', v: 15 },
  { d: 'Thu', v: 27 },
  { d: 'Fri', v: 23 },
  { d: 'Sat', v: 31 },
  { d: 'Sun', v: 38 },
]

function KanbanCard({ card }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.04] p-3 shadow-sm">
      <div className="flex items-center justify-between">
        <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${card.tagColor}`}>
          {card.tag}
        </span>
        <span className={`size-2 rounded-full ${card.priority}`} />
      </div>
      <p className="mt-2 flex items-start gap-1.5 text-[13px] font-medium leading-snug text-foreground/90">
        {card.done && <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-emerald-400" />}
        <span className={card.done ? 'text-foreground/50 line-through' : ''}>{card.title}</span>
      </p>
      <div className="mt-3 flex -space-x-1.5">
        {[0, 1].map((i) => (
          <span
            key={i}
            className="size-5 rounded-full border border-card bg-gradient-to-br from-primary/70 to-brand-bloom/70"
          />
        ))}
      </div>
    </div>
  )
}

/**
 * A real React dashboard mockup (not an image) used as the hero preview.
 * Aria-hidden it is decorative product chrome, not interactive content.
 */
export function DashboardPreview() {
  return (
    <div
      aria-hidden
      className="flex h-full w-full overflow-hidden rounded-[20px] bg-[#0b0a14] text-left"
    >
      {/* Icon sidebar */}
      <aside className="hidden w-14 shrink-0 flex-col items-center gap-1 border-r border-white/10 bg-white/[0.02] py-4 sm:flex">
        <span className="mb-3 flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Zap className="size-4" fill="currentColor" />
        </span>
        {SIDEBAR.map(({ icon: Icon, active }, i) => (
          <span
            key={i}
            className={`flex size-9 items-center justify-center rounded-lg ${
              active ? 'bg-white/10 text-foreground' : 'text-foreground/50'
            }`}
          >
            <Icon className="size-[18px]" />
          </span>
        ))}
      </aside>

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <div className="flex items-center justify-between gap-4 border-b border-white/10 px-4 py-3">
          <div className="flex items-center gap-1 text-xs">
            <span className="rounded-md bg-white/10 px-2.5 py-1 font-medium text-foreground">Board</span>
            <span className="rounded-md px-2.5 py-1 text-foreground/50">Timeline</span>
            <span className="hidden rounded-md px-2.5 py-1 text-foreground/50 sm:inline">Calendar</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden items-center gap-2 rounded-md border border-white/10 bg-white/[0.03] px-2.5 py-1.5 text-xs text-foreground/55 md:flex">
              <Search className="size-3.5" />
              <span>Search tasks…</span>
            </div>
            <span className="flex size-7 items-center justify-center rounded-md text-foreground/50">
              <Bell className="size-4" />
            </span>
            <span className="size-7 rounded-full bg-gradient-to-br from-primary to-brand-bloom" />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden p-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[11px] text-foreground/55">Acme workspace</p>
              <h3 className="text-lg font-semibold tracking-tight">Welcome back, Alex</h3>
            </div>
            <div className="flex items-center gap-3">
              {/* Activity sparkline (unchanged) */}
              <div className="hidden h-12 w-40 sm:block">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={CHART_DATA} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
                    <defs>
                      <linearGradient id="previewArea" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(256 90% 68%)" stopOpacity={0.5} />
                        <stop offset="100%" stopColor="hsl(256 90% 68%)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="d" hide />
                    <Tooltip
                      contentStyle={{
                        background: '#15131f',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: 8,
                        fontSize: 11,
                      }}
                      labelStyle={{ color: '#a78bfa' }}
                      cursor={false}
                    />
                    <Area
                      type="monotone"
                      dataKey="v"
                      stroke="hsl(256 90% 68%)"
                      strokeWidth={2}
                      fill="url(#previewArea)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              {/* Team avatars + "+5" badge */}
              <div className="hidden items-center md:flex">
                <div className="flex -space-x-2">
                  {TEAM.map((m) => (
                    <span
                      key={m.initials}
                      className={`flex size-7 items-center justify-center rounded-full border-2 border-[#0b0a14] bg-gradient-to-br ${m.color} text-[9px] font-semibold text-white`}
                    >
                      {m.initials}
                    </span>
                  ))}
                  <span className="flex size-7 items-center justify-center rounded-full border-2 border-[#0b0a14] bg-white/10 text-[9px] font-semibold text-foreground/70">
                    +5
                  </span>
                </div>
              </div>
              {/* Invite button */}
              <button
                type="button"
                className="inline-flex items-center gap-1 rounded-md bg-primary px-2.5 py-1.5 text-xs font-medium text-primary-foreground shadow-[0_6px_16px_-6px_hsl(var(--primary))] transition-colors hover:bg-primary/90"
              >
                <Plus className="size-3.5" />
                Invite
              </button>
            </div>
          </div>

          {/* Kanban columns */}
          <div className="mt-4 grid grid-cols-3 gap-3">
            {COLUMNS.map((col) => (
              <div key={col.title} className="min-w-0">
                <div className="mb-2 flex items-center gap-2">
                  <span className={`size-1.5 rounded-full ${col.accent}`} />
                  <span className="text-[11px] font-medium text-foreground/60">{col.title}</span>
                  <span className="text-[11px] text-foreground/45">{col.cards.length}</span>
                </div>
                <div className="space-y-2">
                  {col.cards.map((card) => (
                    <KanbanCard key={card.title} card={card} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
