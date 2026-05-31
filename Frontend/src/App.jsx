import { lazy, Suspense } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { Loader2 } from 'lucide-react'

import { AuthProvider } from '@/context/AuthContext'
import { ThemeProvider } from '@/context/ThemeProvider'
import { WorkspaceProvider } from '@/context/WorkspaceContext'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { ToastProvider } from '@/components/ToastProvider'
import { AppShell } from '@/components/AppShell'
import { queryClient } from '@/lib/queryClient'

// Route-level code-splitting: each page becomes its own chunk so the initial
// bundle stays small (heavy deps like Recharts ride along only with the routes
// that use them).
const Landing = lazy(() => import('@/pages/Landing'))
const Login = lazy(() => import('@/pages/auth/Login'))
const Signup = lazy(() => import('@/pages/auth/Signup'))
const ForgotPassword = lazy(() => import('@/pages/auth/ForgotPassword'))
const ResetPassword = lazy(() => import('@/pages/auth/ResetPassword'))
const AcceptInvite = lazy(() => import('@/pages/auth/AcceptInvite'))
const Dashboard = lazy(() => import('@/pages/app/Dashboard'))
const Board = lazy(() => import('@/pages/app/Board'))
const Projects = lazy(() => import('@/pages/app/Projects'))
const Team = lazy(() => import('@/pages/app/Team'))
const Settings = lazy(() => import('@/pages/app/Settings'))

function PageLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <Loader2 className="size-6 animate-spin text-muted-foreground" />
    </div>
  )
}

function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <AuthProvider>
            <BrowserRouter>
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  <Route path="/" element={<Landing />} />

                  {/* Auth */}
                  <Route path="/login" element={<Login />} />
                  <Route path="/signup" element={<Signup />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route path="/reset-password" element={<ResetPassword />} />

                  {/* Protected */}
                  <Route
                    path="/accept-invite"
                    element={
                      <ProtectedRoute>
                        <AcceptInvite />
                      </ProtectedRoute>
                    }
                  />

                  {/* Authenticated product - everything renders inside the
                      AppShell, behind the auth gate and current-workspace
                      provider. */}
                  <Route
                    path="/app"
                    element={
                      <ProtectedRoute>
                        <WorkspaceProvider>
                          <AppShell />
                        </WorkspaceProvider>
                      </ProtectedRoute>
                    }
                  >
                    <Route index element={<Dashboard />} />
                    <Route path="board" element={<Board />} />
                    <Route path="projects" element={<Projects />} />
                    <Route path="team" element={<Team />} />
                    <Route path="settings" element={<Settings />} />
                  </Route>
                </Routes>
              </Suspense>
            </BrowserRouter>
          </AuthProvider>
        </ToastProvider>
      </QueryClientProvider>
    </ThemeProvider>
  )
}

export default App
