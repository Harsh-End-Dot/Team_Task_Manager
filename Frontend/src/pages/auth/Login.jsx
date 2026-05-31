import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  Eye,
  EyeOff,
  ListChecks,
  Lock,
  Mail,
  Sparkles,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FadeUp, Stagger, StaggerItem } from '@/components/motion'
import { useAuth } from '@/context/AuthContext'
import { useLogin } from '@/features/auth/hooks'
import { FormError, SubmitButton } from '@/features/auth/components'
import { getErrorMessage } from '@/lib/apiError'

// Served from public/ - referenced by URL, not bundled. Bright purple
// light-forms frame the far left/right edges; the wide dark center holds the
// content; a soft bloom glows at the bottom-center.
const authBg = '/auth-bg.png'

const FEATURES = [
  {
    icon: Users,
    title: 'Collaborate seamlessly',
    desc: 'Real-time collaboration with your team',
  },
  {
    icon: ListChecks,
    title: 'Stay organized',
    desc: 'Tasks, deadlines, and priorities in one view',
  },
  {
    icon: TrendingUp,
    title: 'Track progress',
    desc: 'Powerful insights to ship work on time',
  },
]

function BrandLogo({ className }) {
  return (
    <Link to="/" className={className}>
      <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-[0_0_20px_-4px_hsl(var(--primary))]">
        <Zap className="size-4" fill="currentColor" />
      </span>
      <span className="text-lg font-semibold tracking-tight">TaskFlow</span>
    </Link>
  )
}

export default function Login() {
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const redirectTo = location.state?.from?.pathname || '/app'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const login = useLogin()

  if (isAuthenticated) return <Navigate to={redirectTo} replace />

  const handleSubmit = (e) => {
    e.preventDefault()
    if (login.isPending) return
    login.mutate(
      { email: email.trim(), password, remember },
      { onSuccess: () => navigate(redirectTo, { replace: true }) },
    )
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#07060e] lg:flex">
      {/* Page-wide hero background + ambient glow - bleeds behind the card too,
          so the whole page carries the landing's purple aesthetic. */}
      <div aria-hidden className="absolute inset-0 z-0">
        {/* The auth asset - bright purple light-forms frame the far left/right
            edges, the wide dark center carries the content, and a soft bloom
            glows at the bottom-center. cover + center keeps both side forms at
            the edges. */}
        <img
          src={authBg}
          alt=""
          className="absolute inset-0 h-full w-full scale-[1.45] object-cover object-center"
        />
        {/* Moderate dark veil ON TOP - light enough that the purple glow clearly
            shows through, dark enough that headline + card stay legible. */}
        <div className="absolute inset-0 bg-[#07060e]/45" />
        {/* Gentle top/bottom depth; the middle stays clear so the side
            light-forms keep their brightness at the edges. */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#07060e]/45 via-transparent to-[#07060e]/35" />
        {/* Prominent purple bloom rising from the bottom-center, reinforcing the
            image's own bottom glow. */}
        <div className="absolute -bottom-[12%] left-1/2 h-[55%] w-[75%] -translate-x-1/2 rounded-[50%] bg-brand-violet/30 blur-[130px]" />
      </div>

      {/* LEFT - branding (hidden on mobile) */}
      <aside className="relative z-10 hidden flex-col justify-between p-10 lg:flex lg:w-1/2 lg:pl-16 xl:p-14 xl:pl-24">
        <BrandLogo className="flex items-center gap-2 text-foreground" />

        <Stagger className="max-w-md" delayChildren={0.08}>
          <StaggerItem>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-xs font-medium text-foreground/80 backdrop-blur-sm">
              <Sparkles className="size-3.5 text-brand-bloom" />
              The all-in-one workspace for modern teams
            </span>
          </StaggerItem>

          <StaggerItem>
            <h1 className="mt-6 pb-1 text-4xl font-bold leading-[1.1] tracking-tight xl:text-5xl">
              Take control of your{' '}
              <span className="bg-gradient-to-r from-brand-indigo via-primary to-brand-bloom bg-clip-text text-transparent">
                projects
              </span>
            </h1>
          </StaggerItem>

          <StaggerItem>
            <p className="mt-4 max-w-md text-pretty text-base leading-relaxed text-foreground/65">
              Plan, organize, and ship work faster. Everything your team needs, in
              one place.
            </p>
          </StaggerItem>

          <StaggerItem>
            <ul className="mt-10 space-y-5">
              {FEATURES.map(({ icon: Icon, title, desc }) => (
                <li key={title} className="flex items-start gap-3.5">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-brand-bloom text-primary-foreground shadow-[0_6px_18px_-6px_hsl(var(--primary)/0.85)] ring-1 ring-white/15">
                    <Icon className="size-[18px]" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{title}</p>
                    <p className="text-sm text-foreground/60">{desc}</p>
                  </div>
                </li>
              ))}
            </ul>
          </StaggerItem>
        </Stagger>

        {/* keeps the logo / content / baseline spaced via justify-between */}
        <div aria-hidden />
      </aside>

      {/* RIGHT - login card */}
      <section className="relative z-10 flex min-h-screen w-full items-center justify-center px-6 py-12 lg:min-h-screen lg:w-1/2">
        <FadeUp className="mx-auto w-full min-w-0 max-w-md">
          {/* Mobile-only logo (left panel is hidden < lg) */}
          <BrandLogo className="mb-8 flex items-center justify-center gap-2 text-foreground lg:hidden" />

          <div className="rounded-2xl border border-white/10 bg-[#0c0a16]/70 p-7 shadow-[0_30px_80px_-40px_rgba(0,0,0,0.9),0_0_70px_-28px_hsl(var(--primary)/0.5)] backdrop-blur-xl sm:p-8">
            <h2 className="text-2xl font-semibold tracking-tight">Welcome back</h2>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Sign in to your account and continue
            </p>

            <form onSubmit={handleSubmit} className="mt-7 space-y-4" noValidate>
              <FormError>
                {login.isError && getErrorMessage(login.error, 'Unable to sign in.')}
              </FormError>

              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-9"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-9 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {showPassword ? (
                      <EyeOff className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-0.5">
                <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="size-4 rounded border-input bg-background/40 accent-[hsl(var(--primary))]"
                  />
                  Remember me
                </label>
                <Link
                  to="/forgot-password"
                  className="text-sm font-medium text-primary hover:underline"
                >
                  Forgot password?
                </Link>
              </div>

              <SubmitButton pending={login.isPending}>
                {login.isPending ? (
                  'Signing in…'
                ) : (
                  <>
                    Sign in
                    <ArrowRight className="size-4" />
                  </>
                )}
              </SubmitButton>
            </form>
          </div>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{' '}
            <Link to="/signup" className="font-medium text-primary hover:underline">
              Sign up
            </Link>
          </p>
        </FadeUp>
      </section>
    </main>
  )
}
