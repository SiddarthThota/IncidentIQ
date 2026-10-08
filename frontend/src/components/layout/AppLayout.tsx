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
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-40">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground md:hidden"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <Link to="/" className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-primary text-primary-foreground">
                <Shield className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-base font-bold tracking-tight text-foreground leading-none">
                  IncidentIQ
                </span>
                <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mt-0.5">
                  Evidence Intelligence
                </span>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            {user?.email && (
              <span className="text-xs font-mono text-muted-foreground hidden sm:inline-block px-2.5 py-1 rounded bg-muted/60 border border-border">
                {user.email}
              </span>
            )}
            <button
              onClick={signOut}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors border border-transparent hover:border-border"
              title="Sign Out"
              aria-label="Sign Out"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border bg-card px-4 py-3 space-y-1 animate-in slide-in-from-top-2">
            {navItems.map(item => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  item.isActive
                    ? 'bg-primary/10 text-primary font-semibold'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.name}
              </Link>
            ))}
          </div>
        )}
      </header>

      {/* Main Body Layout */}
      <div className="flex-1 container mx-auto px-4 py-6 sm:py-8 flex flex-col md:flex-row gap-6 lg:gap-8">
        {/* Desktop Sidebar Navigation */}
        <aside className="hidden md:block w-56 shrink-0">
          <nav className="flex flex-col gap-1.5 sticky top-24">
            {navItems.map(item => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm transition-all ${
                  item.isActive
                    ? 'bg-primary/10 text-primary font-semibold shadow-xs'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground font-medium'
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.name}
              </Link>
            ))}
          </nav>
        </aside>

        {/* Page Main Content Area */}
        <main className="flex-1 min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
