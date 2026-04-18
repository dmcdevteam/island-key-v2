'use client'

import { useState } from 'react'
import { loginAction } from './actions'

export default function AdminLoginPage() {
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const formData = new FormData(e.currentTarget)
    const result = await loginAction(formData)
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-sand flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2.5">
            <span className="font-display text-2xl text-navy font-bold tracking-tight">Island Key</span>
            <span className="text-[10px] font-bold text-tx-mid tracking-[0.2em] uppercase border border-border rounded px-1.5 py-0.5">Admin</span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-card p-8 border border-border">
          <h1 className="font-display text-xl text-navy mb-6">Sign in to Admin</h1>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold text-tx-mid uppercase tracking-wide mb-1.5">
                Email
              </label>
              <input
                name="email"
                type="email"
                required
                autoFocus
                autoComplete="email"
                className="w-full px-3 py-2.5 border border-border rounded-sm text-sm text-tx bg-white outline-none focus:border-navy transition-colors"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-tx-mid uppercase tracking-wide mb-1.5">
                Password
              </label>
              <input
                name="password"
                type="password"
                required
                autoComplete="current-password"
                className="w-full px-3 py-2.5 border border-border rounded-sm text-sm text-tx bg-white outline-none focus:border-navy transition-colors"
              />
            </div>

            {error && (
              <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-sm">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-navy text-white text-sm font-semibold rounded-sm hover:bg-navy-light transition-colors disabled:opacity-50"
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
