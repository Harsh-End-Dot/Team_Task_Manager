import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'

import { Input } from '@/components/ui/input'
import { useConfirmPasswordReset } from '@/features/auth/hooks'
import { AuthShell } from '@/features/auth/AuthShell'
import { Field, FormError, FormSuccess, SubmitButton } from '@/features/auth/components'
import { getErrorMessage } from '@/lib/apiError'

export default function ResetPassword() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || ''
  const navigate = useNavigate()

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const confirmReset = useConfirmPasswordReset()

  const validate = () => {
    const errors = {}
    if (password.length < 8) errors.password = 'At least 8 characters.'
    if (confirm !== password) errors.confirm = 'Passwords do not match.'
    return errors
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (confirmReset.isPending) return
    const errors = validate()
    setFieldErrors(errors)
    if (Object.keys(errors).length) return
    confirmReset.mutate({ token, new_password: password })
  }

  // No token in the URL → the link is malformed/expired.
  if (!token) {
    return (
      <AuthShell
        title="Invalid reset link"
        subtitle="This password reset link is missing or malformed."
        footer={
          <Link to="/forgot-password" className="font-medium text-primary hover:underline">
            Request a new link
          </Link>
        }
      >
        <FormError>
          The reset token is missing. Please request a new reset link.
        </FormError>
      </AuthShell>
    )
  }

  return (
    <AuthShell
      title="Choose a new password"
      subtitle="Enter a new password for your account."
      footer={
        <Link to="/login" className="font-medium text-primary hover:underline">
          Back to sign in
        </Link>
      }
    >
      {confirmReset.isSuccess ? (
        <div className="space-y-4">
          <FormSuccess>
            {confirmReset.data?.message || 'Your password has been reset.'}
          </FormSuccess>
          <SubmitButton pending={false} onClick={() => navigate('/login')} type="button">
            Continue to sign in
          </SubmitButton>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <FormError>
            {confirmReset.isError &&
              getErrorMessage(confirmReset.error, 'Unable to reset password.')}
          </FormError>

          <Field
            id="password"
            label="New password"
            error={fieldErrors.password}
            hint="At least 8 characters."
          >
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-invalid={Boolean(fieldErrors.password)}
              required
            />
          </Field>

          <Field id="confirm" label="Confirm new password" error={fieldErrors.confirm}>
            <Input
              id="confirm"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              aria-invalid={Boolean(fieldErrors.confirm)}
              required
            />
          </Field>

          <SubmitButton pending={confirmReset.isPending}>
            {confirmReset.isPending ? 'Resetting…' : 'Reset password'}
          </SubmitButton>
        </form>
      )}
    </AuthShell>
  )
}
