import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'

import { Input } from '@/components/ui/input'
import { useAuth } from '@/context/AuthContext'
import { useSignup } from '@/features/auth/hooks'
import { AuthShell } from '@/features/auth/AuthShell'
import { Field, FormError, SubmitButton } from '@/features/auth/components'
import { getErrorMessage } from '@/lib/apiError'

export default function Signup() {
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const redirectTo = location.state?.from?.pathname || '/app'

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const signup = useSignup()

  if (isAuthenticated) return <Navigate to={redirectTo} replace />

  // Light client-side validation mirroring the backend schema.
  const validate = () => {
    const errors = {}
    if (!name.trim()) errors.name = 'Please enter your name.'
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) errors.email = 'Enter a valid email.'
    if (password.length < 8) errors.password = 'At least 8 characters.'
    return errors
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (signup.isPending) return
    const errors = validate()
    setFieldErrors(errors)
    if (Object.keys(errors).length) return
    signup.mutate(
      { name: name.trim(), email: email.trim(), password },
      { onSuccess: () => navigate(redirectTo, { replace: true }) },
    )
  }

  return (
    <AuthShell
      title="Create your account"
      subtitle="Start turning plans into progress."
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <FormError>
          {signup.isError && getErrorMessage(signup.error, 'Unable to create account.')}
        </FormError>

        <Field id="name" label="Name" error={fieldErrors.name}>
          <Input
            id="name"
            autoComplete="name"
            placeholder="Alex Kim"
            value={name}
            onChange={(e) => setName(e.target.value)}
            aria-invalid={Boolean(fieldErrors.name)}
            required
          />
        </Field>

        <Field id="email" label="Email" error={fieldErrors.email}>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-invalid={Boolean(fieldErrors.email)}
            required
          />
        </Field>

        <Field
          id="password"
          label="Password"
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

        <SubmitButton pending={signup.isPending}>
          {signup.isPending ? 'Creating account…' : 'Create account'}
        </SubmitButton>
      </form>
    </AuthShell>
  )
}
