'use client'

import { useState, useEffect, useCallback } from 'react'

interface ImageItem {
  name: string
  url: string
}

interface Props {
  apiUrl: string
  title: string
  subtitle?: string
  emptyMessage?: string
}

export function SectionImageBrowser({ apiUrl, title, subtitle, emptyMessage }: Props) {
  const [images, setImages] = useState<ImageItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState<string | null>(null)

  const fetchImages = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(apiUrl)
      if (!res.ok) throw new Error(`Failed to load (${res.status})`)
      const data = await res.json()

      // Handle flat { images: [] } format
      if (Array.isArray(data.images)) {
        setImages(data.images)
        return
      }

      // Handle folder-based { folders: [{ name, urls, fileNames }] } format
      if (Array.isArray(data.folders)) {
        const flat: ImageItem[] = []
        for (const folder of data.folders) {
          for (let i = 0; i < folder.urls.length; i++) {
            flat.push({ name: `${folder.name}/${folder.fileNames[i]}`, url: folder.urls[i] })
          }
        }
        setImages(flat)
        return
      }

      setImages([])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load images')
    } finally {
      setLoading(false)
    }
  }, [apiUrl])

  useEffect(() => { fetchImages() }, [fetchImages])

  async function copyUrl(url: string) {
    await navigator.clipboard.writeText(url)
    setCopied(url)
    setTimeout(() => setCopied(null), 1500)
  }

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl text-navy">{title}</h1>
          {subtitle && <p className="text-sm text-tx-mid mt-1">{subtitle}</p>}
        </div>
        <button
          onClick={fetchImages}
          className="px-3 py-1.5 text-xs font-semibold border border-border rounded-sm text-tx-mid hover:text-tx hover:border-navy transition-colors flex-shrink-0"
        >
          Refresh
        </button>
      </div>

      {loading && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="aspect-square bg-sand rounded border border-border animate-pulse" />
          ))}
        </div>
      )}

      {!loading && error && (
        <div className="bg-red-50 border border-red-200 rounded-sm px-4 py-3 text-sm text-red-600">
          {error}
          <button onClick={fetchImages} className="ml-3 underline">Retry</button>
        </div>
      )}

      {!loading && !error && images.length === 0 && (
        <div className="text-center py-16 text-tx-light text-sm">
          {emptyMessage ?? 'No images uploaded yet. Images appear here when uploaded via listings.'}
        </div>
      )}

      {!loading && !error && images.length > 0 && (
        <>
          <p className="text-xs text-tx-light mb-4">{images.length} image{images.length !== 1 ? 's' : ''}</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {images.map(img => (
              <div key={img.url} className="group relative rounded border border-border overflow-hidden bg-white">
                <a href={img.url} target="_blank" rel="noopener noreferrer" className="block aspect-square">
                  <img
                    src={img.url}
                    alt={img.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </a>
                <div className="px-2 py-1.5 border-t border-border bg-white">
                  <p className="text-[10px] text-tx-light truncate" title={img.name}>{img.name.split('/').pop()}</p>
                </div>
                <button
                  onClick={() => copyUrl(img.url)}
                  className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity px-2 py-1 bg-navy text-white text-[10px] font-semibold rounded shadow"
                >
                  {copied === img.url ? 'Copied!' : 'Copy URL'}
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
