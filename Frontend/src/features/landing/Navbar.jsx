import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Zap } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { CtaButton } from '@/components/CtaButton'
import { cn } from '@/lib/utils'

export function Navbar() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-50 transition-colors duration-300',
        scrolled
          ? 'border-b border-border/60 bg-background/70 backdrop-blur-md'
          : 'border-b border-transparent bg-transparent',
      )}
    >
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-[0_0_20px_-4px_hsl(var(--primary))]">
            <Zap className="size-4" fill="currentColor" />
          </span>
          <span className="text-lg font-semibold tracking-tight">TaskFlow</span>
        </Link>

        {/* Right actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          <Button variant="ghost" size="sm" asChild className="hidden sm:inline-flex">
            <Link to="/login">Login</Link>
          </Button>
          <CtaButton to="/signup" size="sm">
            Get started
          </CtaButton>
        </div>
      </nav>
    </header>
  )
}
