'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useEssentialsCart } from '@/lib/essentials-cart'

const INPUT = 'w-full px-3 py-2.5 border border-border-light rounded-xl text-sm text-navy bg-white outline-none focus:border-navy/40 transition-colors'
const LABEL = 'block text-[11px] font-bold text-tx-mid uppercase tracking-widest mb-1.5'

type EnquiryForm = {
  name:          string
  email:         string
  phone:         string
  property_name: string
  check_in:      string
  check_out:     string
  notes:         string
}

export default function CartPage() {
  const router = useRouter()
  const { items, cartCount, updateQuantity, removeItem, clearCart } = useEssentialsCart()

  const [form, setForm] = useState<EnquiryForm>({
    name: '', email: '', phone: '', property_name: '',
    check_in: '', check_out: '', notes: '',
  })
  const [errors, setErrors] = useState<Partial<EnquiryForm>>({})
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<{ reference_code: string; whatsapp_message: string } | null>(null)

  function setField(k: keyof EnquiryForm, v: string) {
    setForm(f => ({ ...f, [k]: v }))
    setErrors(e => ({ ...e, [k]: '' }))
  }

  const rentalDays = form.check_in && form.check_out
    ? Math.max(1, Math.round((new Date(form.check_out).getTime() - new Date(form.check_in).getTime()) / 86400000))
    : 1

  const total = items.reduce((sum, it) => sum + it.price_per_day * it.quantity * rentalDays, 0)

  function validate(): boolean {
    const errs: Partial<EnquiryForm> = {}
    if (!form.name.trim())  errs.name  = 'Required'
    if (!form.email.trim() || !form.email.includes('@')) errs.email = 'Valid email required'
    if (!form.phone.trim()) errs.phone = 'Required'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  async function handleSubmit() {
    if (!validate() || items.length === 0) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/rentals/essentials-enquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map(it => ({
            id:           it.id,
            name:         it.name,
            price_per_day: it.price_per_day,
            quantity:     it.quantity,
            days:         rentalDays,
          })),
          guest_name:     form.name,
          guest_email:    form.email,
          guest_phone:    form.phone,
          property_name:  form.property_name || undefined,
          check_in:       form.check_in || undefined,
          check_out:      form.check_out || undefined,
          notes:          form.notes || undefined,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setResult(data)
        clearCart()
      }
    } catch (e) {
      console.error(e)
    } finally {
      setSubmitting(false)
    }
  }

  if (result) {
    const waLink = `https://wa.me/306974176759?text=${encodeURIComponent(result.whatsapp_message)}`
    return (
      <div className="min-h-screen bg-cream flex flex-col pb-[90px]">
        <div className="sticky top-0 z-20 bg-cream border-b border-border-light px-4 py-3">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push('/rentals/essentials')} className="text-navy text-sm">←</button>
            <h1 className="font-display text-lg font-medium text-navy">Enquiry Sent</h1>
          </div>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center gap-5">
          <div className="w-16 h-16 rounded-full bg-teal/10 flex items-center justify-center text-3xl">✓</div>
          <div>
            <h2 className="font-display text-2xl text-navy mb-2">Enquiry Received!</h2>
            <p className="text-sm text-tx-light leading-relaxed">
              We'll confirm availability and delivery details within 2 hours.
            </p>
          </div>
          <div className="bg-white rounded-2xl border border-border-light p-4 w-full max-w-[320px]">
            <p className="text-[11px] font-bold text-tx-mid uppercase tracking-widest mb-1">Your Reference</p>
            <p className="text-xl font-bold text-navy tracking-widest">{result.reference_code}</p>
          </div>
          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full max-w-[320px] py-3 bg-teal text-white font-semibold rounded-xl text-sm"
          >
            <span>💬</span> Confirm via WhatsApp
          </a>
          <button
            onClick={() => router.push('/rentals/essentials')}
            className="text-sm text-teal font-semibold"
          >
            Continue Browsing
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-cream flex flex-col pb-[90px]">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-cream border-b border-border-light px-4 py-3">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="text-navy text-sm">←</button>
          <div>
            <h1 className="font-display text-lg font-medium text-navy leading-tight">Your Cart</h1>
            <p className="text-[11px] text-tx-light">{cartCount} item{cartCount !== 1 ? 's' : ''}</p>
          </div>
        </div>
      </div>

      {items.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center px-4 gap-4">
          <p className="text-4xl">🛒</p>
          <p className="text-tx-light text-sm text-center">Your cart is empty.</p>
          <button onClick={() => router.push('/rentals/essentials')} className="text-teal text-sm font-semibold">
            Browse Essentials
          </button>
        </div>
      )}

      {items.length > 0 && (
        <div className="px-4 pt-4 space-y-5">

          {/* Cart items */}
          <div className="space-y-3">
            {items.map(item => (
              <div key={item.id} className="bg-white rounded-2xl border border-border-light p-4 flex gap-3 shadow-sm">
                {item.image_wide ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.image_wide} alt={item.name} className="w-16 h-16 rounded-xl object-cover flex-shrink-0" />
                ) : (
                  <div className="w-16 h-16 rounded-xl bg-sand flex items-center justify-center text-2xl flex-shrink-0">📦</div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-navy leading-tight">{item.name}</p>
                  <p className="text-[11px] text-teal mt-0.5">€{item.price_per_day}/day</p>
                  <p className="text-[11px] text-tx-light">
                    Subtotal: €{(item.price_per_day * item.quantity * rentalDays).toFixed(2)}
                  </p>
                  <div className="flex items-center gap-3 mt-2">
                    <div className="flex items-center gap-2 bg-sand rounded-full px-2 py-0.5">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="w-6 h-6 flex items-center justify-center text-navy font-bold text-base"
                      >−</button>
                      <span className="text-sm font-semibold text-navy w-5 text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="w-6 h-6 flex items-center justify-center text-navy font-bold text-base"
                      >+</button>
                    </div>
                    <button onClick={() => removeItem(item.id)} className="text-[11px] text-red-400 hover:text-red-600">
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Order summary */}
          <div className="bg-white rounded-2xl border border-border-light p-4 shadow-sm">
            <p className="text-[11px] font-bold text-tx-mid uppercase tracking-widest mb-3">Order Summary</p>
            <div className="space-y-1.5 mb-3">
              {items.map(item => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span className="text-tx-mid">{item.name} × {item.quantity}</span>
                  <span className="text-navy font-medium">€{(item.price_per_day * item.quantity * rentalDays).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-border-light pt-3 flex justify-between">
              <span className="text-sm font-bold text-navy">Total estimate</span>
              <span className="text-base font-bold text-navy">€{total.toFixed(2)}</span>
            </div>
            <p className="text-[11px] text-tx-light mt-1">
              {rentalDays} day{rentalDays !== 1 ? 's' : ''} · Based on your check-in/out dates below
            </p>
          </div>

          {/* Enquiry form */}
          <div className="bg-white rounded-2xl border border-border-light p-5 shadow-sm space-y-4">
            <h2 className="font-display text-lg text-navy">Your Details</h2>

            <div>
              <label className={LABEL}>Full Name *</label>
              <input className={`${INPUT} ${errors.name ? 'border-red-300' : ''}`}
                value={form.name} onChange={e => setField('name', e.target.value)} placeholder="Maria Schmidt" />
              {errors.name && <p className="text-[11px] text-red-500 mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className={LABEL}>Email Address *</label>
              <input type="email" className={`${INPUT} ${errors.email ? 'border-red-300' : ''}`}
                value={form.email} onChange={e => setField('email', e.target.value)} placeholder="maria@example.com" />
              {errors.email && <p className="text-[11px] text-red-500 mt-1">{errors.email}</p>}
            </div>

            <div>
              <label className={LABEL}>Phone Number *</label>
              <input type="tel" className={`${INPUT} ${errors.phone ? 'border-red-300' : ''}`}
                value={form.phone} onChange={e => setField('phone', e.target.value)} placeholder="+44 7700 000000" />
              {errors.phone && <p className="text-[11px] text-red-500 mt-1">{errors.phone}</p>}
            </div>

            <div>
              <label className={LABEL}>Property / Villa Name <span className="font-normal normal-case text-tx-light">(optional)</span></label>
              <input className={INPUT}
                value={form.property_name} onChange={e => setField('property_name', e.target.value)} placeholder="e.g. Villa Helios, Platanias" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={LABEL}>Check-in <span className="font-normal normal-case text-tx-light">(optional)</span></label>
                <input type="date" className={INPUT}
                  value={form.check_in} onChange={e => setField('check_in', e.target.value)} />
              </div>
              <div>
                <label className={LABEL}>Check-out <span className="font-normal normal-case text-tx-light">(optional)</span></label>
                <input type="date" className={INPUT}
                  value={form.check_out} onChange={e => setField('check_out', e.target.value)} />
              </div>
            </div>

            <div>
              <label className={LABEL}>Notes <span className="font-normal normal-case text-tx-light">(optional)</span></label>
              <textarea className={INPUT} rows={3}
                value={form.notes} onChange={e => setField('notes', e.target.value)}
                placeholder="Any special requests or delivery instructions…" />
            </div>
          </div>

          {/* CTAs */}
          <div className="space-y-3 pb-4">
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full py-3.5 bg-navy text-white font-semibold rounded-xl text-sm active:scale-[0.98] transition-transform disabled:opacity-60"
            >
              {submitting ? 'Sending…' : 'Send Enquiry →'}
            </button>

            <a
              href={`https://wa.me/306974176759?text=${encodeURIComponent(
                `Hi, I'd like to enquire about vacation essentials:\n${items.map(it => `• ${it.name} ×${it.quantity}`).join('\n')}\nTotal (est.): €${total.toFixed(2)}`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3 bg-teal text-white font-semibold rounded-xl text-sm active:scale-[0.98] transition-transform"
            >
              <span>💬</span> Enquire via WhatsApp
            </a>
          </div>
        </div>
      )}
    </div>
  )
}
