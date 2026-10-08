import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from './contexts/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import { AppLayout } from './components/layout/AppLayout'

// Pages
import { Login } from './pages/Login'
import { Signup } from './pages/Signup'
import { Dashboard } from './pages/Dashboard'
import { NewInvestigation } from './pages/NewInvestigation'
import { InvestigationDetail } from './pages/InvestigationDetail'
import { History } from './pages/History'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 30, // 30 seconds
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />

            {/* Protected Operational Routes */}
            <Route element={<ProtectedRoute />}>
              <Route element={<AppLayout />}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/investigate" element={<Navigate to="/investigations/new" replace />} />
                <Route path="/investigations/new" element={<NewInvestigation />} />
                <Route path="/investigations/:id" element={<InvestigationDetail />} />
                <Route path="/history" element={<History />} />
              </Route>
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  )
}

export default App
