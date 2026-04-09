'use client';

import { useEffect, useState } from 'react';
import { BottomNav } from '@/components/ui/bottom-nav';
import { Button, SelectionChip } from '@/components/ui/components';
import { formatPrice } from '@/lib/utils';
import { createClient } from '@/lib/supabase';
import type { Transfer } from '@/lib/types';

const VEHICLE_ICONS: Record<string, string> = {
  sedan:       '🚗',
  minivan:     '🚐',
  premium_suv: '🚙',
  minibus:     '🚌',
};

const VEHICLE_LABELS: Record<string, string> = {
  sedan:       'Sedan',
  minivan:     'Minivan',
  premium_suv: 'Premium SUV',
  minibus:     'Minibus',
};

function routeKey(t: Transfer) {
  return `${t.route_from}||${t.route_to}`;
}

export default function TransfersPage() {
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRouteKey, setSelectedRouteKey] = useState<string | null>(null);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [paxRange, setPaxRange] = useState('1-3');

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from('transfers')
      .select('*')
      .eq('is_active', true)
      .order('route_from')
      .order('price')
      .then(({ data, error }) => {
        if (error) {
          setError(error.message);
        } else {
          const rows = data ?? [];
          setTransfers(rows);
          // Auto-select first route
          if (rows.length > 0) setSelectedRouteKey(routeKey(rows[0]));
        }
        setLoading(false);
      });
  }, []);

  // Unique routes preserving order
  const routes = transfers.reduce<{ key: string; from: string; to: string }[]>((acc, t) => {
    const key = routeKey(t);
    if (!acc.find(r => r.key === key)) acc.push({ key, from: t.route_from, to: t.route_to });
    return acc;
  }, []);

  const vehiclesForRoute = transfers.filter(t => routeKey(t) === selectedRouteKey);
  const selectedRoute = routes.find(r => r.key === selectedRouteKey) ?? null;

  return (
    <div className="min-h-screen bg-cream flex flex-col pb-[90px]">
      <div className="px-5 pt-[52px] pb-3">
        <h1 className="font-display text-xl font-medium text-navy">Transfers</h1>
        <p className="text-xs text-tx-light mt-0.5">Airport, port & inter-city</p>
      </div>

      <div className="flex-1 overflow-y-auto px-5">
        {/* Route selector chips */}
        {loading && (
          <div className="flex gap-2 mb-4 overflow-x-auto no-scrollbar">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-8 w-32 rounded-full bg-navy/5 animate-pulse flex-shrink-0" />
            ))}
          </div>
        )}

        {error && (
          <div className="mb-4 p-4 rounded-2xl bg-red-50 text-red-600 text-sm">
            Failed to load transfers: {error}
          </div>
        )}

        {!loading && !error && routes.length > 0 && (
          <div className="flex gap-2 mb-4 overflow-x-auto no-scrollbar">
            {routes.map(r => (
              <button
                key={r.key}
                onClick={() => { setSelectedRouteKey(r.key); setSelectedVehicleId(null); }}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-[11px] font-semibold border transition-all ${
                  selectedRouteKey === r.key
                    ? 'bg-navy text-white border-navy'
                    : 'bg-white text-tx-mid border-border-light'
                }`}
              >
                {r.from.split(' ')[0]} → {r.to.split(' ')[0]}
              </button>
            ))}
          </div>
        )}

        {/* Route display */}
        <div className="p-3 bg-white rounded border border-border-light mb-2">
          <p className="text-[10px] font-bold text-tx-light uppercase tracking-wide mb-1">Pick-up</p>
          <p className="text-sm font-semibold text-navy">
            {selectedRoute ? `✈️ ${selectedRoute.from}` : '—'}
          </p>
        </div>
        <div className="w-8 h-8 rounded-full bg-sand flex items-center justify-center mx-auto -my-1.5 relative z-10 border-2 border-cream text-sm">
          ↕
        </div>
        <div className="p-3 bg-white rounded border border-border-light mb-4">
          <p className="text-[10px] font-bold text-tx-light uppercase tracking-wide mb-1">Drop-off</p>
          <p className="text-sm font-semibold text-navy">
            {selectedRoute ? `🏨 ${selectedRoute.to}` : '—'}
          </p>
        </div>

        {/* Date/time */}
        <div className="mb-3">
          <label className="text-[11px] font-bold text-tx-mid uppercase tracking-wide mb-1.5 block">When</label>
          <input
            type="datetime-local"
            defaultValue="2026-05-15T14:00"
            className="w-full px-3.5 py-3 border-[1.5px] border-border rounded-sm font-body text-sm text-tx bg-white outline-none focus:border-teal"
          />
        </div>

        {/* Passengers */}
        <div className="mb-4">
          <label className="text-[11px] font-bold text-tx-mid uppercase tracking-wide mb-1.5 block">Passengers</label>
          <div className="flex gap-2">
            {['1-3', '4-6', '7+'].map(r => (
              <SelectionChip key={r} label={r} selected={paxRange === r} onClick={() => setPaxRange(r)} />
            ))}
          </div>
        </div>

        {/* Vehicle options */}
        {!loading && !error && (
          <>
            <h3 className="text-[11px] font-bold text-navy uppercase tracking-wide mb-2">
              {selectedRoute ? 'Available vehicles' : 'Select a route above'}
            </h3>
            <div className="flex flex-col gap-2">
              {vehiclesForRoute.map(t => (
                <div
                  key={t.id}
                  onClick={() => setSelectedVehicleId(selectedVehicleId === t.id ? null : t.id)}
                  className={`flex items-center gap-3 p-3 bg-white rounded-sm border-[1.5px] cursor-pointer transition-all ${
                    selectedVehicleId === t.id ? 'border-teal bg-teal-light' : 'border-border'
                  }`}
                >
                  <span className="text-xl">{VEHICLE_ICONS[t.vehicle_type] ?? '🚗'}</span>
                  <div className="flex-1">
                    <p className="text-[13px] font-semibold text-navy">{VEHICLE_LABELS[t.vehicle_type] ?? t.vehicle_type}</p>
                    <p className="text-[10px] text-tx-light">{t.vehicle_description}</p>
                  </div>
                  <span className="text-sm font-bold text-teal">{formatPrice(t.price)}</span>
                </div>
              ))}
              {!loading && vehiclesForRoute.length === 0 && routes.length === 0 && (
                <p className="text-center text-tx-light text-sm mt-4">No transfers available yet.</p>
              )}
            </div>
          </>
        )}

        <Button variant="primary" size="lg" fullWidth className="mt-4 mb-4">
          Book Transfer
        </Button>
      </div>

      <BottomNav />
    </div>
  );
}
