import { cn } from '@/lib/utils'

/**
 * Small label chip. `color` is an arbitrary backend string (hex or css name);
 * we render it as a coloured dot so any value stays legible on the dark theme.
 */
export function LabelChip({ label, className }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-md border border-border/70 bg-secondary/40 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground',
        className,
      )}
    >
      <span
        className="size-2 rounded-full"
        style={{ backgroundColor: label.color || 'hsl(var(--primary))' }}
      />
      {label.name}
    </span>
  )
}
