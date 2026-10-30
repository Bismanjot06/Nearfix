import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './hooks/useAuth.jsx'
import { AppLayout } from './components/layout/AppLayout.jsx'
import { AuthorityLayout } from './components/authority/AuthorityLayout.jsx'
import { AuthorityGuard } from './components/authority/AuthorityGuard.jsx'

// Citizen Pages
import HomePage from './pages/HomePage.jsx'
import ReportPage from './pages/ReportPage.jsx'
import MapPage from './pages/MapPage.jsx'
import TrackPage from './pages/TrackPage.jsx'

// Authority Pages
import LoginPage from './pages/authority/LoginPage.jsx'
import DashboardPage from './pages/authority/DashboardPage.jsx'
import ReportDetailPage from './pages/authority/ReportDetailPage.jsx'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* ── Authority Login (Public) ── */}
          <Route path="/authority/login" element={<LoginPage />} />

          {/* ── Authority Protected Routes ── */}
          <Route
            path="/authority"
            element={
              <AuthorityGuard>
                <AuthorityLayout>
                  <DashboardPage />
                </AuthorityLayout>
              </AuthorityGuard>
            }
          />
          <Route
            path="/authority/reports/:id"
            element={
              <AuthorityGuard>
                <AuthorityLayout>
                  <ReportDetailPage />
                </AuthorityLayout>
              </AuthorityGuard>
            }
          />

          {/* ── Citizen Portal Routes ── */}
          <Route
            path="/"
            element={
              <AppLayout>
                <HomePage />
              </AppLayout>
            }
          />
          <Route
            path="/report"
            element={
              <AppLayout>
                <ReportPage />
              </AppLayout>
            }
          />
          <Route
            path="/map"
            element={
              <AppLayout>
                <MapPage />
              </AppLayout>
            }
          />
          <Route
            path="/track"
            element={
              <AppLayout>
                <TrackPage />
              </AppLayout>
            }
          />
          <Route
            path="/track/:reportId"
            element={
              <AppLayout>
                <TrackPage />
              </AppLayout>
            }
          />

          {/* Catch-all redirect to Home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
