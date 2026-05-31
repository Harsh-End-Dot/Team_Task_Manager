import { useRef } from 'react'
import {
  motion,
  useMotionValue,
  useScroll,
  useTransform,
} from 'framer-motion'
import { ArrowRight, Sparkles } from 'lucide-react'

import { CtaButton } from '@/components/CtaButton'
import {
  DashboardReveal,
  Stagger,
  StaggerItem,
  TiltCard,
  useReducedMotion,
} from '@/components/motion'
import { HeroBackground } from './HeroBackground'
import { DashboardPreview } from './DashboardPreview'

export function Hero() {
  const reduce = useReducedMotion()
  const sectionRef = useRef(null)

  // Mouse pointer in [-0.5, 0.5], handed to the background bloom.
  const px = useMotionValue(0)
  const py = useMotionValue(0)

  const handlePointerMove = (e) => {
    if (reduce) return
    const rect = sectionRef.current?.getBoundingClientRect()
    if (!rect) return
    px.set((e.clientX - rect.left) / rect.width - 0.5)
    py.set((e.clientY - rect.top) / rect.height - 0.5)
  }

  // Scroll parallax: background drifts slower than the foreground content.
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end start'],
  })
  const bgY = useTransform(scrollYProgress, [0, 1], ['0%', '12%'])

  return (
    <section
      ref={sectionRef}
      onPointerMove={handlePointerMove}
      className="relative isolate min-h-screen overflow-hidden"
    >
      {/* Background (parallax wrapper owns z + slow drift).
          z-0 (not -z-10) so it stays above the page's opaque bg-background
          but below the z-10 foreground. `isolate` on the section scopes it. */}
      <motion.div
        style={reduce ? undefined : { y: bgY }}
        className="absolute inset-x-0 top-[-12%] z-0 h-[124%]"
      >
        <HeroBackground pointer={{ x: px, y: py }} />
      </motion.div>

      {/* Foreground */}
      <div className="relative z-10 mx-auto flex max-w-6xl flex-col items-center px-6 pb-0 pt-32 text-center sm:pt-36">
        <Stagger className="flex w-full max-w-3xl flex-col items-center" delayChildren={0.15}>
          {/* Badge with a subtle shimmering border */}
          <StaggerItem>
            <span className="relative inline-flex items-center gap-2 overflow-hidden rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-xs font-medium text-foreground/80 backdrop-blur-sm">
              <Sparkles className="size-3.5 text-brand-bloom" />
              New: real-time Kanban boards
              {!reduce && (
                <span className="pointer-events-none absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/15 to-transparent" />
              )}
            </span>
          </StaggerItem>

          {/* Headline (2 lines) */}
          <StaggerItem>
            <h1 className="mt-6 text-balance pb-2 text-5xl font-bold leading-[1.15] tracking-tight sm:text-6xl md:text-7xl">
              <span className="block">Where teams turn</span>
              <span className="block bg-gradient-to-r from-brand-indigo via-primary to-brand-bloom bg-clip-text pb-[0.15em] text-transparent">
                plans into progress
              </span>
            </h1>
          </StaggerItem>

          {/* Subtext */}
          <StaggerItem>
            <p className="mt-5 max-w-xl text-pretty text-base leading-relaxed text-foreground/65 sm:text-lg">
              TaskFlow is the multi-tenant workspace for projects, tasks, and Kanban
              boards, built for teams that move fast without losing the thread.
            </p>
          </StaggerItem>

          {/* CTAs */}
          <StaggerItem>
            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
              <CtaButton to="/signup" size="lg">
                Get started free
                <ArrowRight className="size-4" />
              </CtaButton>
              <CtaButton to="/login" size="lg" variant="outline" glow={false}>
                Live demo
              </CtaButton>
            </div>
          </StaggerItem>
        </Stagger>

        {/* Dashboard preview - a premium product shot that peeks up past the fold.
            Three nested elements each own a separate transform so none collide:
            DashboardReveal (entrance + settling drop shadow) > float wrapper
            (drift) > TiltCard (tilt + lit purple glow). Only transform/opacity and
            box-shadow animate, so the glow/shadow stay cheap. */}
        <DashboardReveal className="mt-14 w-full max-w-5xl [perspective:1600px] sm:mt-16">
          <div className={reduce ? '' : 'animate-float'}>
            <TiltCard
              max={6}
              scale={1}
              className="relative mx-auto aspect-[16/10] w-full rounded-[20px] shadow-[0_0_90px_-18px_hsl(var(--brand-violet)/0.55),0_10px_45px_-12px_hsl(var(--primary)/0.45)] sm:aspect-[16/9]"
            >
              {/* Clipped, masked frame: large radius on top/sides + a bottom fade
                  so the dashboard reads as continuing beyond the fold (no hard
                  bottom edge). The ring is the crisp lit border. */}
              <div className="relative h-full w-full overflow-hidden rounded-[20px] ring-1 ring-white/10 [mask-image:linear-gradient(to_bottom,#000_76%,transparent_100%)]">
                <DashboardPreview />
              </div>
              {/* Faint top rim-light - a 1px violet/white highlight for a glassy
                  premium edge. */}
              <div className="pointer-events-none absolute inset-x-6 top-0 h-px rounded-full bg-gradient-to-r from-transparent via-white/40 to-transparent" />
            </TiltCard>
          </div>
        </DashboardReveal>
      </div>
    </section>
  )
}
