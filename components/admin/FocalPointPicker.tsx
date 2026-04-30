'use client'

import { useRef, useCallback, useState } from 'react'

export type FocalPoint = { x: number; y: number }

interface Props {
  imageUrl:   string
  focalPoint: FocalPoint | null
  onChange:   (point: FocalPoint) => void
}

export function FocalPointPicker({ imageUrl, focalPoint, onChange }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [dragging,  setDragging]  = useState(false)

  const pt = focalPoint ?? { x: 50, y: 50 }

  const toPoint = useCallback((clientX: number, clientY: number): FocalPoint => {
    const el   = containerRef.current
    if (!el) return pt
    const rect = el.getBoundingClientRect()
    return {
      x: Math.round(Math.min(100, Math.max(0, ((clientX - rect.left)  / rect.width)  * 100))),
      y: Math.round(Math.min(100, Math.max(0, ((clientY - rect.top)   / rect.height) * 100))),
    }
  }, [pt])

  function handleContainerClick(e: React.MouseEvent) {
    // Only fire if not dragging (drag end clears this flag after settling)
    if (!dragging) onChange(toPoint(e.clientX, e.clientY))
  }

  function handleCrosshairMouseDown(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    setDragging(true)
    onChange(toPoint(e.clientX, e.clientY))

    const onMove = (ev: MouseEvent) => onChange(toPoint(ev.clientX, ev.clientY))
    const onUp   = () => {
      setDragging(false)
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup',   onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup',   onUp)
  }

  return (
    <div>
      <p className="text-[11px] text-tx-mid mb-1.5">Drag to set focal point</p>

      {/* Image canvas */}
      <div
        ref={containerRef}
        onClick={handleContainerClick}
        className="relative w-full rounded-sm border border-border overflow-hidden select-none"
        style={{ aspectRatio: '16/9', cursor: 'crosshair' }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt=""
          draggable={false}
          className="w-full h-full pointer-events-none"
          style={{ objectFit: 'cover', objectPosition: `${pt.x}% ${pt.y}%` }}
        />

        {/* Dim overlay so crosshair is always visible */}
        <div className="absolute inset-0 bg-black/10 pointer-events-none" />

        {/* Grid lines */}
        <div className="absolute inset-0 pointer-events-none" style={{ opacity: 0.15 }}>
          <div className="absolute inset-y-0 bg-white" style={{ left: '33.33%', width: 1 }} />
          <div className="absolute inset-y-0 bg-white" style={{ left: '66.66%', width: 1 }} />
          <div className="absolute inset-x-0 bg-white" style={{ top: '33.33%', height: 1 }} />
          <div className="absolute inset-x-0 bg-white" style={{ top: '66.66%', height: 1 }} />
        </div>

        {/* Crosshair */}
        <div
          onMouseDown={handleCrosshairMouseDown}
          style={{
            position: 'absolute',
            left: `${pt.x}%`,
            top:  `${pt.y}%`,
            transform: 'translate(-50%, -50%)',
            cursor: dragging ? 'grabbing' : 'grab',
            zIndex: 10,
          }}
        >
          {/* Horizontal line */}
          <div style={{
            position: 'absolute', top: '50%', left: '50%',
            width: 24, height: 1,
            background: 'white',
            transform: 'translate(-50%, -50%)',
            boxShadow: '0 0 2px rgba(0,0,0,0.5)',
          }} />
          {/* Vertical line */}
          <div style={{
            position: 'absolute', top: '50%', left: '50%',
            width: 1, height: 24,
            background: 'white',
            transform: 'translate(-50%, -50%)',
            boxShadow: '0 0 2px rgba(0,0,0,0.5)',
          }} />
          {/* Circle */}
          <div style={{
            width: 22, height: 22,
            borderRadius: '50%',
            border: '2.5px solid white',
            background: 'rgba(26,138,125,0.55)',
            boxShadow: '0 0 0 1.5px rgba(0,0,0,0.35), 0 2px 6px rgba(0,0,0,0.3)',
          }} />
        </div>
      </div>

      <p className="text-[11px] text-tx-light mt-1">
        Focal point: {pt.x}% · {pt.y}%
      </p>
    </div>
  )
}
