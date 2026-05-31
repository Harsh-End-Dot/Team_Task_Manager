import { Link } from 'react-router-dom'
import { Zap } from 'lucide-react'

// Inline brand marks - lucide-react (this build) doesn't ship brand icons.
function GithubIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M12 .5C5.37.5 0 5.78 0 12.292c0 5.211 3.438 9.63 8.205 11.188.6.111.82-.254.82-.567 0-.28-.01-1.022-.015-2.005-3.338.711-4.042-1.582-4.042-1.582-.546-1.361-1.335-1.725-1.335-1.725-1.087-.731.084-.716.084-.716 1.205.082 1.838 1.215 1.838 1.215 1.07 1.803 2.809 1.282 3.495.981.108-.763.417-1.282.76-1.577-2.665-.295-5.466-1.309-5.466-5.827 0-1.287.465-2.339 1.235-3.164-.135-.297-.54-1.497.105-3.121 0 0 1.005-.316 3.3 1.209.96-.262 1.98-.392 3-.398 1.02.006 2.04.136 3 .398 2.28-1.525 3.285-1.209 3.285-1.209.645 1.624.24 2.824.12 3.121.765.825 1.23 1.877 1.23 3.164 0 4.53-2.805 5.527-5.475 5.817.42.354.81 1.077.81 2.182 0 1.576-.015 2.846-.015 3.229 0 .309.21.678.825.561C20.565 21.917 24 17.495 24 12.292 24 5.78 18.627.5 12 .5z" />
    </svg>
  )
}

function LinkedinIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.225 0z" />
    </svg>
  )
}

export function Footer() {
  return (
    <footer className="border-t border-border/60 bg-background">
      <div className="mx-auto max-w-7xl px-6 py-12">
        {/* Brand */}
        <Link to="/" className="inline-flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Zap className="size-4" fill="currentColor" />
          </span>
          <span className="text-lg font-semibold tracking-tight">TaskFlow</span>
        </Link>
        <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
          The multi-tenant workspace where teams turn plans into progress.
        </p>

        {/* Bottom bar: copyright + social links */}
        <div className="mt-10 flex flex-col items-start justify-between gap-4 border-t border-border/60 pt-6 text-sm text-muted-foreground sm:flex-row sm:items-center">
          <p>© 2026 TaskFlow</p>
          <div className="flex items-center gap-5">
            <a
              href="https://github.com/Harsh-End-Dot"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 transition-colors hover:text-foreground"
            >
              <GithubIcon className="size-4" />
              GitHub
            </a>
            <a
              href="https://www.linkedin.com/in/harsh-gupta-602bb131b/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 transition-colors hover:text-foreground"
            >
              <LinkedinIcon className="size-4" />
              LinkedIn
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
