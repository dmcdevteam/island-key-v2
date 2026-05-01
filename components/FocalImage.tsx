import type { ImgHTMLAttributes } from 'react'

export type FocalPoint = { x: number; y: number }

interface FocalImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  src:        string
  alt:        string
  focalPoint?: FocalPoint | null
  /** Pass true for above-fold images to load eagerly; all others default to lazy */
  priority?:  boolean
}

export function FocalImage({ src, alt, focalPoint, priority, loading, style, ...rest }: FocalImageProps) {
  const x = focalPoint?.x ?? 50
  const y = focalPoint?.y ?? 50
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      loading={loading ?? (priority ? 'eager' : 'lazy')}
      style={{
        objectFit:     'cover',
        objectPosition: `${x}% ${y}%`,
        ...style,
      }}
      {...rest}
    />
  )
}
