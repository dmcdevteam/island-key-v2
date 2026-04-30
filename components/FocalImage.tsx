import type { ImgHTMLAttributes } from 'react'

export type FocalPoint = { x: number; y: number }

interface FocalImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  src:        string
  alt:        string
  focalPoint?: FocalPoint | null
}

/**
 * Drop-in replacement for <img> that respects a focal point for object-fit cover.
 * If focalPoint is null/undefined, defaults to 50% 50% (center).
 */
export function FocalImage({ src, alt, focalPoint, style, ...rest }: FocalImageProps) {
  const x = focalPoint?.x ?? 50
  const y = focalPoint?.y ?? 50
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      style={{
        objectFit:     'cover',
        objectPosition: `${x}% ${y}%`,
        ...style,
      }}
      {...rest}
    />
  )
}
