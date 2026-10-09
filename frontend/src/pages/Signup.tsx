import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Shield, Loader2, Search, LayoutDashboard, CheckCircle, Eye, EyeOff } from 'lucide-react'

export function Signup() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const navigate = useNavigate()

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      navigate('/')
    }
  }

  return (
    <div className="min-h-screen flex bg-background font-sans">
      <div className="hidden lg:flex lg:w-1/2 bg-background flex-col justify-center px-12 xl:px-24 border-r border-border relative overflow-hidden">
        {/* Subtle background decoration */}
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-primary-light rounded-full blur-3xl opacity-50 pointer-events-none" />

        <div className="max-w-lg relative z-10">
          <div className="flex items-center gap-3 mb-10">
            <div className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20">
              <Shield className="w-8 h-8" />
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-bold tracking-tight text-foreground leading-none">
                IncidentIQ
              </span>
              <span className="text-[11px] font-mono text-muted-foreground mt-1 font-semibold uppercase tracking-widest">
                Evidence Intelligence
              </span>
            </div>
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-foreground mb-4 leading-tight">
            Investigate incidents with evidence, not guesses.
          </h1>
          <p className="text-lg text-secondary-foreground mb-12">
            The operational investigation platform that traces evidence and provides reliable conclusions.
          </p>

          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-4 text-sm font-medium text-muted-foreground font-mono">
              <Search className="w-5 h-5 text-primary" /> SEARCH
            </div>
            <div className="w-px h-6 bg-border ml-[9px]" />
            <div className="flex items-center gap-4 text-sm font-medium text-muted-foreground font-mono">
              <LayoutDashboard className="w-5 h-5 text-primary" /> INVESTIGATE
            </div>
            <div className="w-px h-6 bg-border ml-[9px]" />
            <div className="flex items-center gap-4 text-sm font-medium text-muted-foreground font-mono">
              <Shield className="w-5 h-5 text-primary" /> VERIFY
            </div>
            <div className="w-px h-6 bg-border ml-[9px]" />
            <div className="flex items-center gap-4 text-sm font-medium text-primary font-mono font-bold">
              <CheckCircle className="w-5 h-5" /> CONCLUDE
            </div>
          </div>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-20 xl:px-32 bg-card-subtle relative">
        <div className="w-full max-w-md mx-auto">
          {/* Mobile Brand Header */}
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <div className="p-1.5 rounded-lg bg-primary/10 text-primary border border-primary/20">
              <Shield className="w-6 h-6" />
            </div>
            <span className="text-xl font-bold tracking-tight text-foreground">
              IncidentIQ
            </span>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-bold tracking-tight text-foreground">Create your account</h2>
            <p className="mt-2 text-sm text-secondary-foreground">
              Join IncidentIQ to start your operational investigations.
            </p>
          </div>

          <div className="bg-card py-8 px-6 shadow-sm rounded-2xl border border-border">
            <form className="space-y-6" onSubmit={handleSignup}>
              {error && (
                <div className="p-3 text-sm text-destructive bg-destructive-background border border-destructive/20 rounded-lg flex items-center gap-2 font-medium">
                  <Shield className="w-4 h-4" />
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Email address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="block w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-shadow"
                  placeholder="name@company.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Password (min 6 chars)</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="block w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-shadow pr-10"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center py-2.5 px-4 rounded-lg shadow-sm text-sm font-semibold text-primary-foreground bg-primary hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 transition-colors"
                style={{ backgroundColor: loading ? 'var(--primary)' : 'var(--primary)' }} // Inline style fix for missing var
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create Account'}
              </button>
            </form>
          </div>

          <div className="mt-8 text-center text-sm text-secondary-foreground">
            Already have an account? <Link to="/login" className="text-primary font-semibold hover:underline">Sign in</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
