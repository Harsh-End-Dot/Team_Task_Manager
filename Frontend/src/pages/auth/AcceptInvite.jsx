import { Link, useNavigate, useSearchParams } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { useAuth } from '@/context/AuthContext'
import { useAcceptInvitation } from '@/features/auth/hooks'
import { AuthShell } from '@/features/auth/AuthShell'
import { FormError, FormSuccess, SubmitButton } from '@/features/auth/components'
import { getErrorMessage } from '@/lib/apiError'

/**
 * Accept a workspace invitation. Rendered behind <ProtectedRoute>, so the user
 * is guaranteed to be signed in (otherwise they're sent to /login first and
 * returned here after authenticating). The token comes from ?token= in the URL.
 */
export default function AcceptInvite() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || ''
  const navigate = useNavigate()
  const { user } = useAuth()
  const accept = useAcceptInvitation()

  if (!token) {
    return (
      <AuthShell
        title="Invalid invitation"
        subtitle="This invitation link is missing or malformed."
        footer={
          <Link to="/app" className="font-medium text-primary hover:underline">
            Go to your workspace
          </Link>
        }
      >
        <FormError>The invitation token is missing.</FormError>
      </AuthShell>
    )
  }

  return (
    <AuthShell
      title="Join workspace"
      subtitle={
        user
          ? `You're signed in as ${user.email}. Accept the invitation to join.`
          : 'Accept the invitation to join the workspace.'
      }
      footer={
        <Link to="/app" className="font-medium text-primary hover:underline">
          Back to your workspace
        </Link>
      }
    >
      {accept.isSuccess ? (
        <div className="space-y-4">
          <FormSuccess>You've joined the workspace.</FormSuccess>
          <Button className="w-full" onClick={() => navigate('/app')}>
            Open workspace
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <FormError>
            {accept.isError &&
              getErrorMessage(accept.error, 'Unable to accept this invitation.')}
          </FormError>
          <SubmitButton
            type="button"
            pending={accept.isPending}
            onClick={() => !accept.isPending && accept.mutate({ token })}
          >
            {accept.isPending ? 'Joining…' : 'Accept invitation'}
          </SubmitButton>
        </div>
      )}
    </AuthShell>
  )
}
