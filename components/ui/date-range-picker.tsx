'use client'

import { useState } from 'react'

const DAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]
const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const DAYS_SHORT   = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

// ─── Exported helpers for call-sites that store dates as YYYY-MM-DD strings ──

export function toDate(s: string | null | undefined): Date | null {
  if (!s) return null
  const [y, m, d] = s.split('-').map(Number)
  if (!y || !m || !d) return null
  return new Date(y, m - 1, d)
}

export function fromDate(d: Date | null): string {
  if (!d) return ''
  const y   = d.getFullYear()
  const m   = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

// ─── Internal utils ───────────────────────────────────────────────────────────

function ds(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
}
function sameDay(a: Date, b: Date)    { return ds(a) === ds(b) }
function beforeDay(a: Date, b: Date)  { return ds(a) < ds(b) }
function afterDay(a: Date, b: Date)   { return ds(a) > ds(b) }
function between(d: Date, s: Date, e: Date) { return ds(d) > ds(s) && ds(d) < ds(e) }

function fmt(d: Date) {
  return `${DAYS_SHORT[d.getDay()]} ${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`
}

function calCells(year: number, month: number): (Date | null)[] {
  const first  = new Date(year, month, 1)
  const offset = (first.getDay() + 6) % 7           // Mon = 0
  const count  = new Date(year, month + 1, 0).getDate()
  const cells: (Date | null)[] = [
    ...Array(offset).fill(null),
    ...Array.from({ length: count }, (_, i) => new Date(year, month, i + 1)),
  ]
  while (cells.length % 7 !== 0) cells.push(null)
  return cells
}

// ─── Component ────────────────────────────────────────────────────────────────

export interface DateRangePickerProps {
  startDate:   Date | null
  endDate:     Date | null
  onChange:    (start: Date | null, end: Date | null) => void
  minDate?:    Date
  maxDate?:    Date
  placeholder?: string
  singleDate?: boolean
}

export default function DateRangePicker({
  startDate,
  endDate,
  onChange,
  minDate,
  maxDate,
  placeholder = 'Select dates',
  singleDate  = false,
}: DateRangePickerProps) {
  const today = new Date()
  const min   = minDate ?? today

  const [open,       setOpen]       = useState(false)
  const [tmpStart,   setTmpStart]   = useState<Date | null>(null)
  const [tmpEnd,     setTmpEnd]     = useState<Date | null>(null)
  const [viewYear,   setViewYear]   = useState(0)
  const [viewMonth,  setViewMonth]  = useState(0)

  function openPicker() {
    const ref = startDate ?? min
    setTmpStart(startDate)
    setTmpEnd(endDate)
    setViewYear(ref.getFullYear())
    setViewMonth(ref.getMonth())
    setOpen(true)
  }

  function close() { setOpen(false) }

  function confirm() {
    if (singleDate) {
      if (tmpStart) onChange(tmpStart, null)
    } else {
      if (tmpStart && tmpEnd) onChange(tmpStart, tmpEnd)
    }
    setOpen(false)
  }

  function tapDay(day: Date) {
    if (beforeDay(day, min))                     return
    if (maxDate && afterDay(day, maxDate))        return

    if (singleDate) {
      // Auto-confirm: tapping a date IS the confirmation
      onChange(day, null)
      setOpen(false)
      return
    }

    if (!tmpStart || (tmpStart && tmpEnd)) {
      setTmpStart(day)
      setTmpEnd(null)
    } else {
      if (!afterDay(day, tmpStart)) {
        setTmpStart(day)
        setTmpEnd(null)
      } else {
        setTmpEnd(day)
      }
    }
  }

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1) }
    else setViewMonth(m => m - 1)
  }

  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1) }
    else setViewMonth(m => m + 1)
  }

  const canGoPrev  = viewYear > min.getFullYear() || (viewYear === min.getFullYear() && viewMonth > min.getMonth())
  const canConfirm = singleDate ? !!tmpStart : !!(tmpStart && tmpEnd)

  const triggerText = (() => {
    if (singleDate) {
      if (!startDate) return null
      return fmt(startDate)
    }
    if (!startDate) return null
    if (!endDate)   return `${fmt(startDate)} → Select end date`
    const nights = Math.round((ds(endDate) - ds(startDate)) / 86400000)
    return `${fmt(startDate)} → ${fmt(endDate)}  ·  ${nights} night${nights !== 1 ? 's' : ''}`
  })()

  const headerText = (() => {
    if (singleDate) return tmpStart ? fmt(tmpStart) : 'Select date'
    if (!tmpStart)  return 'Select start date'
    if (!tmpEnd)    return `${fmt(tmpStart)} → Select end`
    const nights = Math.round((ds(tmpEnd) - ds(tmpStart)) / 86400000)
    return `${fmt(tmpStart)} → ${fmt(tmpEnd)} (${nights} night${nights !== 1 ? 's' : ''})`
  })()

  const cells = open ? calCells(viewYear, viewMonth) : []

  return (
    <>
      {/* Trigger */}
      <button
        type="button"
        onClick={openPicker}
        className="w-full flex items-center gap-3 px-4 py-3 bg-white border border-border-light rounded-xl text-left"
      >
        <span style={{ color: '#D4854A', fontSize: 16, flexShrink: 0 }}>📅</span>
        <span className={`flex-1 text-sm truncate ${triggerText ? 'text-navy' : 'text-gray-400'}`}>
          {triggerText ?? placeholder}
        </span>
      </button>

      {/* Overlay */}
      {open && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/40" onClick={close} />

          {/* Sheet */}
          <div className="relative bg-white rounded-t-2xl shadow-2xl w-full max-w-[480px] mx-auto pb-24 max-h-[90vh] overflow-y-auto">
            {/* Handle */}
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mt-3 mb-4" />

            {/* Header */}
            <div className="flex items-start justify-between px-5 mb-2">
              <div>
                <p className="text-[10px] font-bold text-tx-light uppercase tracking-widest">
                  {singleDate ? 'Select date' : 'Select dates'}
                </p>
                <p className="text-sm font-semibold text-navy mt-0.5">{headerText}</p>
              </div>
              <button
                type="button"
                onClick={close}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-tx-mid text-lg leading-none flex-shrink-0"
              >×</button>
            </div>

            {/* Month navigation */}
            <div className="flex items-center justify-between px-5 py-2">
              <button
                type="button"
                onClick={prevMonth}
                disabled={!canGoPrev}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-navy text-base disabled:opacity-30"
              >‹</button>
              <p className="text-sm font-bold text-navy">{MONTHS[viewMonth]} {viewYear}</p>
              <button
                type="button"
                onClick={nextMonth}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-navy text-base"
              >›</button>
            </div>

            {/* Day-of-week headers */}
            <div className="grid grid-cols-7 px-3 mb-1">
              {DAYS.map(d => (
                <div key={d} className="text-center text-[11px] font-semibold text-tx-light py-1">{d}</div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 px-3 gap-y-0.5">
              {cells.map((day, i) => {
                if (!day) return <div key={i} className="h-10" />

                const disabled = beforeDay(day, min) || (!!maxDate && afterDay(day, maxDate))
                const isStart  = !!tmpStart && sameDay(day, tmpStart)
                const isEnd    = !!tmpEnd   && sameDay(day, tmpEnd)
                const inRange  = !!(tmpStart && tmpEnd && between(day, tmpStart, tmpEnd))
                const isToday  = sameDay(day, today)

                return (
                  <div
                    key={i}
                    className={`relative h-10 flex items-center justify-center ${inRange ? 'bg-[#E8F5F3]' : ''}`}
                  >
                    <button
                      type="button"
                      disabled={disabled}
                      onClick={() => tapDay(day)}
                      className={[
                        'w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors',
                        disabled        ? 'text-gray-300 cursor-not-allowed' :
                        isStart || isEnd ? 'bg-teal text-white' :
                        inRange         ? 'text-navy' :
                        isToday         ? 'ring-1 ring-teal text-navy' :
                                          'text-navy hover:bg-[#E8F5F3] active:bg-teal/20',
                      ].join(' ')}
                    >
                      {day.getDate()}
                    </button>
                  </div>
                )
              })}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-5 pt-5">
              <button
                type="button"
                onClick={() => { setTmpStart(null); setTmpEnd(null); if (singleDate) onChange(null, null) }}
                className="text-sm text-tx-light hover:text-navy"
              >Clear</button>
              {!singleDate && (
                <button
                  type="button"
                  onClick={confirm}
                  disabled={!canConfirm}
                  className="px-6 py-2.5 bg-navy text-white text-sm font-semibold rounded-full disabled:opacity-40 transition-opacity"
                >Confirm</button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
