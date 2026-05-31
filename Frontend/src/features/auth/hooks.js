import { useMutation } from '@tanstack/react-query'

import { useAuth } from '@/context/AuthContext'
import {
  acceptInvitation,
  confirmPasswordReset,
  requestPasswordReset,
} from './api'

// login / signup run through the AuthContext so the session (token + user) is
// updated as a side effect; the mutation just gives the form its
// pending/error/success state.
export function useLogin() {
  const { login } = useAuth()
  return useMutation({ mutationFn: login })
}

export function useSignup() {
  const { signup } = useAuth()
  return useMutation({ mutationFn: signup })
}

export function useRequestPasswordReset() {
  return useMutation({ mutationFn: requestPasswordReset })
}

export function useConfirmPasswordReset() {
  return useMutation({ mutationFn: confirmPasswordReset })
}

export function useAcceptInvitation() {
  return useMutation({ mutationFn: acceptInvitation })
}
