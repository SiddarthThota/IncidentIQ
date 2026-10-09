import { useState } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { LogOut, LayoutDashboard, Search, History, Shield, Menu, X } from 'lucide-react'

export function AppLayout() {
  const { signOut, user } = useAuth()
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const navItems = [
    {
      name: 'Dashboard',
      path: '/dashboard',
      icon: LayoutDashboard,
      isActive: location.pathname === '/' || location.pathname === '/dashboard',
    },
    {
      name: 'New Investigation',
      path: '/investigations/new',
      icon: Search,
      isActive:
        location.pathname === '/investigations/new' ||
        location.pathname === '/investigate' ||
        location.pathname.startsWith('/investigations/'),
    },
    {
      name: 'History',
      path: '/history',
      icon: History,
      isActive: location.pathname === '/history',
    },
  ]

  return (
    <div className="min-h-screen bg-background text-foreground flex font-sans selection:bg-primary/30">
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 border-b border-border bg-card z-40 flex items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-primary/10 text-primary border border-primary/20">
            <Shield className="w-5 h-5" />
          </div>
          <span className="font-bold tracking-tight text-foreground">IncidentIQ</span>
        </Link>
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Mobile Drawer Overlay */}
      {mobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 bg-background/80 backdrop-blur-sm z-50 animate-in fade-in"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar (Desktop fixed, Mobile drawer) */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border flex flex-col transition-transform duration-300 ease-in-out md:translate-x-0 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex-1 flex flex-col">
          {/* Sidebar Header */}
          <div className="h-16 flex items-center justify-between px-5 border-b border-border">
            <Link to="/" className="flex items-center gap-3 group" onClick={() => setMobileMenuOpen(false)}>
              <div className="p-1.5 rounded-lg bg-primary/10 text-primary border border-primary/20 transition-all">
                <Shield className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold tracking-tight text-foreground leading-none">
                  IncidentIQ
                </span>
                <span className="text-[10px] font-mono text-muted-foreground mt-1">
                  Evidence Intelligence
                </span>
              </div>
            </Link>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="md:hidden p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-4 px-3 flex flex-col gap-1">
            {navItems.map(item => {
              const isActive = item.isActive
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`relative flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors overflow-hidden ${
                    isActive
                      ? 'text-primary bg-primary-light font-semibold'
                      : 'text-secondary-foreground hover:text-foreground hover:bg-muted'
                  }`}
                >
                  {/* Active Accent Line */}
                  {isActive && (
                    <div className="absolute left-0 top-1 bottom-1 w-1 bg-primary rounded-r-full" />
                  )}

                  <item.icon className={`w-4 h-4 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                  <span>{item.name}</span>
                </Link>
              )
            })}
          </nav>

          {/* User Profile Area */}
          <div className="p-4 border-t border-border">
            <div className="flex items-center justify-between p-2 rounded-md hover:bg-muted transition-colors">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="w-8 h-8 rounded-full bg-primary-light border border-primary/20 flex items-center justify-center shrink-0">
                  <span className="text-xs font-bold text-primary">
                    {user?.email?.charAt(0).toUpperCase() || 'U'}
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {user?.email || 'Investigator'}
                  </p>
                </div>
              </div>
              <button
                onClick={signOut}
                className="p-2 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive-background transition-colors shrink-0"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 md:pl-64 pt-16 md:pt-0 min-h-screen bg-card-subtle">
        <div className="flex-1 w-full max-w-6xl mx-auto p-4 md:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
