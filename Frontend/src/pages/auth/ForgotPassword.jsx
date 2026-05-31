import { useState } from 'react'
import { Link } from 'react-router-dom'

import { Input } from '@/components/ui/input'
import { useRequestPasswordReset } from '@/features/auth/hooks'
import { AuthShell } from '@/features/auth/AuthShell'
import { Field, FormError, FormSuccess, SubmitButton } from '@/features/auth/components'
import { getErrorMessage } from '@/lib/apiError'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const reset = useRequestPasswordReset()

  const handleSubmit = (e) => {
    e.preventDefault()
    if (reset.isPending) return
    reset.mutate({ email: email.trim() })
  }

  return (
    <AuthShell
      title="Reset your password"
      subtitle="Enter your email and we'll send you a reset link."
      footer={
        <Link to="/login" className="font-medium text-primary hover:underline">
          Back to sign in
        </Link>
      }
    >
      {reset.isSuccess ? (
        <FormSuccess>
          {reset.data?.message ||
            'If an account with that email exists, a reset link has been sent.'}
        </FormSuccess>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <FormError>
            {reset.isError && getErrorMessage(reset.error, 'Unable to send reset link.')}
          </FormError>

          <Field id="email" label="Email">
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </Field>

          <SubmitButton pending={reset.isPending}>
            {reset.isPending ? 'Sending…' : 'Send reset link'}
          </SubmitButton>
        </form>
      )}
    </AuthShell>
  )
}
