import { Link } from 'react-router-dom'
import { Zap } from 'lucide-react'

import { Stagger, StaggerItem } from '@/components/motion'

/**
 * Shared premium dark frame for every auth page: the auth-bg.png glow asset
 * (purple light-forms framing the edges, bloom at the bottom-center), the
 * TaskFlow mark, and a glassy card holding the form - consistent with the login
 * page. Entrance stagger respects reduced motion.
 */
export function AuthShell({ title, subtitle, children, footer }) {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#07060e] px-6 py-16">
      {/* Page-wide auth background: real image + light veil + bottom bloom.
          The centered card sits over the dark center between the edge forms. */}
      <div aria-hidden className="absolute inset-0 z-0">
        <img
          src="/auth-bg.png"
          alt=""
          className="absolute inset-0 h-full w-full scale-[1.45] object-cover object-center"
        />
        <div className="absolute inset-0 bg-[#07060e]/45" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#07060e]/45 via-transparent to-[#07060e]/35" />
        <div className="absolute -bottom-[12%] left-1/2 h-[55%] w-[75%] -translate-x-1/2 rounded-[50%] bg-brand-violet/30 blur-[130px]" />
      </div>

      <Stagger className="relative z-10 w-full max-w-sm" delayChildren={0.05}>
        <StaggerItem>
          <Link
            to="/"
            className="mb-8 flex items-center justify-center gap-2 text-foreground"
          >
            <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-[0_0_20px_-4px_hsl(var(--primary))]">
              <Zap className="size-5" fill="currentColor" />
            </span>
            <span className="text-xl font-semibold tracking-tight">TaskFlow</span>
          </Link>
        </StaggerItem>

        <StaggerItem>
          <div className="rounded-2xl border border-border/60 bg-card/60 p-7 shadow-[0_30px_80px_-40px_rgba(0,0,0,0.9)] backdrop-blur-sm">
            <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
            {subtitle && (
              <p className="mt-1.5 text-sm text-muted-foreground">{subtitle}</p>
            )}
            <div className="mt-6">{children}</div>
          </div>
        </StaggerItem>

        {footer && (
          <StaggerItem>
            <p className="mt-6 text-center text-sm text-muted-foreground">
              {footer}
            </p>
          </StaggerItem>
        )}
      </Stagger>
    </main>
  )
}
