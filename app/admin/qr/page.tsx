'use client';

import { useState, useEffect } from 'react';
import QRCode from 'react-qr-code';
import QRCodeLib from 'qrcode';
import { createClient } from '@/lib/supabase';
import type { Tier, Region } from '@/lib/types';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.islandkey.gr';

interface Provider {
  id: string;
  name: string;
  type: string;
  category: string | null;
  region: string;
  contact_phone: string | null;
  whatsapp: string | null;
  commission_rate: number | null;
  notes: string | null;
}

interface PropertyOption {
  id: string;
  slug: string;
  name: string;
  tier: Tier;
  region: Region;
}

// Composites the logo onto a QR canvas and returns a data URL
async function compositeLogoOnQR(qrDataUrl: string, qrSize: number): Promise<string> {
  const canvas = document.createElement('canvas');
  canvas.width = qrSize;
  canvas.height = qrSize;
  const ctx = canvas.getContext('2d')!;

  // Draw QR
  const qrImg = new Image();
  await new Promise<void>((res) => { qrImg.onload = () => res(); qrImg.src = qrDataUrl; });
  ctx.drawImage(qrImg, 0, 0, qrSize, qrSize);

  // Logo dimensions (~24% of QR size)
  const logoSize = Math.round(qrSize * 0.24);
  const bgPad = Math.round(logoSize * 0.18);
  const bgSize = logoSize + bgPad * 2;
  const x = Math.round((qrSize - bgSize) / 2);
  const y = Math.round((qrSize - bgSize) / 2);
  const radius = Math.round(bgSize * 0.15);

  // White rounded-square background
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + bgSize - radius, y);
  ctx.quadraticCurveTo(x + bgSize, y, x + bgSize, y + radius);
  ctx.lineTo(x + bgSize, y + bgSize - radius);
  ctx.quadraticCurveTo(x + bgSize, y + bgSize, x + bgSize - radius, y + bgSize);
  ctx.lineTo(x + radius, y + bgSize);
  ctx.quadraticCurveTo(x, y + bgSize, x, y + bgSize - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#E0E0E0';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Logo (navy icon on white background)
  const logoImg = new Image();
  await new Promise<void>((res) => { logoImg.onload = () => res(); logoImg.src = '/logo_icon_navy.png'; });
  const lx = Math.round((qrSize - logoSize) / 2);
  const ly = Math.round((qrSize - logoSize) / 2);
  ctx.drawImage(logoImg, lx, ly, logoSize, logoSize);

  return canvas.toDataURL('image/png');
}

export default function QRAdminPage() {
  const [properties, setProperties] = useState<PropertyOption[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [loading, setLoading] = useState(true);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [providersLoading, setProvidersLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    async function fetchProperties() {
      const { data } = await supabase
        .from('properties')
        .select('id, slug, name, tier, region')
        .eq('is_active', true)
        .order('name');
      if (data) {
        const typed = data as unknown as PropertyOption[];
        setProperties(typed);
        if (typed.length > 0) setSelectedId(typed[0].id);
      }
      setLoading(false);
    }

    async function fetchProviders() {
      const res = await fetch('/api/providers');
      if (res.ok) {
        const data = await res.json();
        setProviders(data as Provider[]);
      }
      setProvidersLoading(false);
    }

    fetchProperties();
    fetchProviders();
  }, []);

  const selected = properties.find((p) => p.id === selectedId);
  const qrUrl = selected
    ? `${APP_URL}/?p=${selected.slug}&t=${selected.tier}&r=${selected.region}`
    : '';

  async function handleDownload() {
    if (!selected || !qrUrl) return;
    const QR_SIZE = 1024;
    const qrDataUrl = await QRCodeLib.toDataURL(qrUrl, {
      width: QR_SIZE,
      margin: 2,
      errorCorrectionLevel: 'H',
      color: { dark: '#1B2D4F', light: '#FFFFFF' },
    });
    const composited = await compositeLogoOnQR(qrDataUrl, QR_SIZE);
    const a = document.createElement('a');
    a.href = composited;
    a.download = `island-key-qr-${selected.slug}.png`;
    a.click();
  }

  function handlePrint() {
    window.print();
  }

  // Logo overlay style — absolute centred on a relative QR container
  const logoOverlay = (qrSize: number) => {
    const logoSize = Math.round(qrSize * 0.24);
    const bgPad = Math.round(logoSize * 0.18);
    const bgSize = logoSize + bgPad * 2;
    return {
      wrapper: {
        position: 'relative' as const,
        display: 'inline-block',
        lineHeight: 0,
      },
      bg: {
        position: 'absolute' as const,
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: bgSize,
        height: bgSize,
        background: '#FFFFFF',
        borderRadius: 6,
        border: '1px solid #E0E0E0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      },
      logo: {
        width: logoSize,
        height: logoSize,
        objectFit: 'contain' as const,
      },
    };
  };

  return (
    <>
      {/* Print CSS */}
      <style>{`
        @media print {
          @page { size: A6 portrait; margin: 0; }
          body * { visibility: hidden; }
          .tent-card, .tent-card * { visibility: visible; }
          .tent-card {
            position: fixed !important;
            top: 0; left: 0;
            width: 105mm; height: 148mm;
            display: flex !important;
          }
        }
      `}</style>

      {/* Admin UI */}
      <div className="no-print min-h-screen bg-cream px-6 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <p className="text-[11px] font-bold text-tx-mid uppercase tracking-[0.2em] mb-1">Island Key Admin</p>
            <h1 className="font-display text-3xl text-navy">QR Code Generator</h1>
          </div>

          {/* Property selector */}
          <div className="mb-8">
            <label className="text-[11px] font-bold text-tx-mid uppercase tracking-wide mb-1.5 block">
              Select Property
            </label>
            {loading ? (
              <div className="h-12 bg-gray-100 rounded-sm animate-pulse" />
            ) : (
              <select
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value)}
                className="w-full px-3.5 py-3 border-[1.5px] border-border rounded-sm font-body text-sm text-tx bg-white outline-none focus:border-teal"
              >
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} — {p.tier} · {p.region}
                  </option>
                ))}
              </select>
            )}
          </div>

          {selected && (
            <>
              {/* Generated URL */}
              <div className="mb-8 p-4 bg-white border border-border rounded-sm max-w-lg">
                <p className="text-[10px] font-bold text-tx-mid uppercase tracking-wide mb-1.5">Generated URL</p>
                <p className="font-mono text-xs text-teal break-all">{qrUrl}</p>
              </div>

              {/* QR preview */}
              <div className="flex flex-col items-center mb-8 p-8 bg-white border border-border rounded-sm max-w-lg">
                {(() => {
                  const s = logoOverlay(240);
                  return (
                    <div style={s.wrapper}>
                      <QRCode
                        value={qrUrl}
                        size={240}
                        fgColor="#1B2D4F"
                        bgColor="#FFFFFF"
                        level="H"
                      />
                      <div style={s.bg}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src="/logo_icon_navy.png" alt="" style={s.logo} />
                      </div>
                    </div>
                  );
                })()}
                <p className="mt-4 text-xs text-tx-mid">{selected.name}</p>
              </div>

              {/* Actions */}
              <div className="flex gap-3 max-w-lg">
                <button
                  onClick={handleDownload}
                  className="flex-1 px-4 py-3 bg-navy text-white text-sm font-semibold rounded-sm hover:bg-navy/90 transition-colors"
                >
                  Download QR code
                </button>
                <button
                  onClick={handlePrint}
                  className="flex-1 px-4 py-3 border-[1.5px] border-navy text-navy text-sm font-semibold rounded-sm hover:bg-navy/5 transition-colors"
                >
                  Print tent card
                </button>
              </div>
            </>
          )}

          {/* ─── Provider Directory ─── */}
          <div className="mt-16">
            <div className="mb-5">
              <p className="text-[11px] font-bold text-tx-mid uppercase tracking-[0.2em] mb-1">Internal Use Only</p>
              <h2 className="font-display text-2xl text-navy">Provider Directory</h2>
            </div>

            {providersLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-14 bg-white border border-border rounded-sm animate-pulse" />
                ))}
              </div>
            ) : providers.length === 0 ? (
              <p className="text-sm text-tx-light">No providers found.</p>
            ) : (
              <div className="overflow-x-auto rounded-sm border border-border">
                <table className="w-full text-sm bg-white border-collapse">
                  <thead>
                    <tr className="border-b border-border bg-sand">
                      <th className="text-left px-4 py-3 text-[11px] font-bold text-tx-mid uppercase tracking-wide">Name</th>
                      <th className="text-left px-4 py-3 text-[11px] font-bold text-tx-mid uppercase tracking-wide">Type</th>
                      <th className="text-left px-4 py-3 text-[11px] font-bold text-tx-mid uppercase tracking-wide">Category</th>
                      <th className="text-left px-4 py-3 text-[11px] font-bold text-tx-mid uppercase tracking-wide">Region</th>
                      <th className="text-left px-4 py-3 text-[11px] font-bold text-tx-mid uppercase tracking-wide">Commission</th>
                      <th className="text-left px-4 py-3 text-[11px] font-bold text-tx-mid uppercase tracking-wide">Notes</th>
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody>
                    {providers.map((p, i) => (
                      <tr key={p.id} className={`border-b border-border-light last:border-b-0 ${i % 2 === 1 ? 'bg-cream/40' : ''}`}>
                        <td className="px-4 py-3 font-semibold text-navy whitespace-nowrap">{p.name}</td>
                        <td className="px-4 py-3 text-tx-mid capitalize whitespace-nowrap">{p.type}</td>
                        <td className="px-4 py-3 text-tx-mid capitalize whitespace-nowrap">{p.category ?? '—'}</td>
                        <td className="px-4 py-3 text-tx-mid capitalize whitespace-nowrap">{p.region}</td>
                        <td className="px-4 py-3 text-tx-mid whitespace-nowrap">{p.commission_rate != null ? `${p.commission_rate}%` : '—'}</td>
                        <td className="px-4 py-3 text-tx-light text-xs max-w-[280px]">{p.notes ?? '—'}</td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {(p.whatsapp || p.contact_phone) && (
                            <a
                              href={`https://wa.me/${(p.whatsapp || p.contact_phone)!.replace(/\D/g, '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-[#25D366] text-white text-[11px] font-semibold rounded hover:opacity-90 transition-opacity"
                            >
                              💬 WhatsApp
                            </a>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Tent card — hidden on screen, shown only in print */}
      {selected && qrUrl && (
        <div
          className="tent-card"
          style={{
            display: 'none',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '105mm',
            height: '148mm',
            padding: '10mm 8mm',
            background: '#FFFFFF',
            fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          }}
        >
          {/* Top: wordmark */}
          <div style={{ textAlign: 'center' }}>
            <p style={{ margin: 0, fontSize: '9px', fontWeight: 700, letterSpacing: '3px', textTransform: 'uppercase', color: '#9CA3AF' }}>
              ISLAND KEY
            </p>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', marginTop: '4px' }}>
              <span style={{ fontSize: '22px', fontWeight: 700, color: '#1B2D4F', letterSpacing: '-0.5px' }}>Island</span>
              <span style={{ fontSize: '22px', fontWeight: 300, color: '#1B2D4F' }}>Key</span>
              <span style={{ display: 'inline-block', width: '6px', height: '6px', background: '#1A8A7D', borderRadius: '50%', marginBottom: '8px' }} />
            </div>
          </div>

          {/* Center: QR code */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, justifyContent: 'center', gap: '8mm' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo_icon_navy.png" alt="Island Key" style={{ height: '16mm', width: 'auto' }} />
            {/* QR with logo overlay */}
            <div style={{ position: 'relative', display: 'inline-block', lineHeight: 0 }}>
              <QRCode
                value={qrUrl}
                size={200}
                fgColor="#1B2D4F"
                bgColor="#FFFFFF"
                level="H"
              />
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: Math.round(200 * 0.24 * 1.36),
                height: Math.round(200 * 0.24 * 1.36),
                background: '#FFFFFF',
                borderRadius: 6,
                border: '1px solid #E0E0E0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/logo_icon_navy.png"
                  alt=""
                  style={{ width: Math.round(200 * 0.24), height: Math.round(200 * 0.24), objectFit: 'contain' }}
                />
              </div>
            </div>

            {/* Headline + sub-line */}
            <div style={{ textAlign: 'center' }}>
              <p style={{ margin: '0 0 6px', fontSize: '15px', fontWeight: 700, color: '#1B2D4F', letterSpacing: '-0.3px' }}>
                Your island. Unlocked.
              </p>
              <p style={{ margin: 0, fontSize: '9px', color: '#6B7280', lineHeight: 1.5, maxWidth: '75mm' }}>
                Scan for curated local experiences,<br />deals & insider tips
              </p>
            </div>
          </div>

          {/* Bottom: property name + divider */}
          <div style={{ textAlign: 'center', borderTop: '1px solid #E5E7EB', paddingTop: '4mm', width: '100%' }}>
            <p style={{ margin: 0, fontSize: '8px', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: '#9CA3AF' }}>
              Exclusively for guests of
            </p>
            <p style={{ margin: '3px 0 0', fontSize: '11px', fontWeight: 600, color: '#1B2D4F' }}>
              {selected.name}
            </p>
          </div>
        </div>
      )}
    </>
  );
}
