import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'

/** A labelled form field with an optional inline error message. */
export function Field({ id, label, error, hint, children }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="text-xs text-destructive">
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  )
}

/** Red alert box for request-level errors (bad credentials, duplicate email…). */
export function FormError({ children }) {
  if (!children) return null
  return (
    <div
      role="alert"
      className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
    >
      <AlertCircle className="mt-0.5 size-4 shrink-0" />
      <span>{children}</span>
    </div>
  )
}

/** Emerald alert box for success states (reset link sent, password updated…). */
export function FormSuccess({ children }) {
  if (!children) return null
  return (
    <div
      role="status"
      className="flex items-start gap-2 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300"
    >
      <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
      <span>{children}</span>
    </div>
  )
}

/** Full-width submit button that shows a spinner while pending. */
export function SubmitButton({ pending, children, ...props }) {
  return (
    <Button type="submit" className="w-full" disabled={pending} {...props}>
      {pending && <Loader2 className="size-4 animate-spin" />}
      {children}
    </Button>
  )
}
