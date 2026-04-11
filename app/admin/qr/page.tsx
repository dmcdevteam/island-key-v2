'use client';

import { useState, useEffect } from 'react';
import QRCode from 'react-qr-code';
import QRCodeLib from 'qrcode';
import { createClient } from '@/lib/supabase';
import type { Tier, Region } from '@/lib/types';

const APP_URL = 'https://islandkey.gr';

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

  // Logo dimensions (~18% of QR size)
  const logoSize = Math.round(qrSize * 0.18);
  const bgPad = Math.round(logoSize * 0.18);
  const bgSize = logoSize + bgPad * 2;
  const x = Math.round((qrSize - bgSize) / 2);
  const y = Math.round((qrSize - bgSize) / 2);
  const radius = Math.round(bgSize * 0.15);

  // Navy rounded-square background
  ctx.fillStyle = '#1B2D4F';
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

  // Logo (transparent PNG, white version)
  const logoImg = new Image();
  await new Promise<void>((res) => { logoImg.onload = () => res(); logoImg.src = '/logo_icon_transparent.png'; });
  const lx = Math.round((qrSize - logoSize) / 2);
  const ly = Math.round((qrSize - logoSize) / 2);
  ctx.drawImage(logoImg, lx, ly, logoSize, logoSize);

  return canvas.toDataURL('image/png');
}

export default function QRAdminPage() {
  const [properties, setProperties] = useState<PropertyOption[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    async function fetchProperties() {
      const supabase = createClient();
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
    fetchProperties();
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
    const logoSize = Math.round(qrSize * 0.18);
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
        background: '#1B2D4F',
        borderRadius: 6,
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
        <div className="max-w-lg mx-auto">
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
              <div className="mb-8 p-4 bg-white border border-border rounded-sm">
                <p className="text-[10px] font-bold text-tx-mid uppercase tracking-wide mb-1.5">Generated URL</p>
                <p className="font-mono text-xs text-teal break-all">{qrUrl}</p>
              </div>

              {/* QR preview */}
              <div className="flex flex-col items-center mb-8 p-8 bg-white border border-border rounded-sm">
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
                        <img src="/logo_icon_transparent.png" alt="" style={s.logo} />
                      </div>
                    </div>
                  );
                })()}
                <p className="mt-4 text-xs text-tx-mid">{selected.name}</p>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
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
                width: Math.round(200 * 0.18 * 1.36),
                height: Math.round(200 * 0.18 * 1.36),
                background: '#1B2D4F',
                borderRadius: 6,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/logo_icon_transparent.png"
                  alt=""
                  style={{ width: Math.round(200 * 0.18), height: Math.round(200 * 0.18), objectFit: 'contain' }}
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
