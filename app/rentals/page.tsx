'use client';

import { useEffect, useState } from 'react';
import { BottomNav } from '@/components/ui/bottom-nav';
import { RentalTypeCard, Button } from '@/components/ui/components';
import { RENTAL_TYPES, formatPrice } from '@/lib/utils';
import { createClient } from '@/lib/supabase';
import type { Rental } from '@/lib/types';

const TYPE_ICON: Record<string, string> = Object.fromEntries(
  RENTAL_TYPES.map(rt => [rt.key, rt.icon])
);

export default function RentalsPage() {
  const [selectedVehicle, setSelectedVehicle] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string | null>(null);
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from('rentals')
      .select('*')
      .eq('is_active', true)
      .order('type')
      .order('name')
      .then(({ data, error }) => {
        if (error) setError(error.message);
        else setRentals(data ?? []);
        setLoading(false);
      });
  }, []);

  const filtered = filterType ? rentals.filter(r => r.type === filterType) : rentals;

  return (
    <div className="min-h-screen bg-cream flex flex-col pb-[90px]">
      <div className="px-5 pt-[52px] pb-3">
        <h1 className="font-display text-xl font-medium text-navy">Rentals</h1>
        <p className="text-xs text-tx-light mt-0.5">Cars, bikes, boats & off-road — delivered to you</p>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Category grid */}
        <div className="grid grid-cols-3 gap-2 px-5 mb-4">
          {RENTAL_TYPES.map(rt => (
            <RentalTypeCard
              key={rt.key}
              icon={rt.icon}
              name={rt.label}
              priceFrom={rt.from}
              description=""
              onClick={() => setFilterType(filterType === rt.key ? null : rt.key)}
            />
          ))}
        </div>

        {/* How it works */}
        <div className="px-5">
          <h3 className="text-[11px] font-bold text-navy uppercase tracking-wide mb-2 mt-2">How it works</h3>
          <div className="flex gap-2.5 mb-4">
            {[
              { num: '1️⃣', title: 'Choose', desc: 'Pick type & dates' },
              { num: '2️⃣', title: 'Book', desc: 'Online or WhatsApp' },
              { num: '3️⃣', title: 'Delivered', desc: 'To your door' },
            ].map(step => (
              <div key={step.title} className="flex-1 text-center p-3 bg-white rounded-sm border border-border-light">
                <span className="text-lg block mb-1">{step.num}</span>
                <p className="text-[11px] font-semibold text-navy">{step.title}</p>
                <p className="text-[10px] text-tx-light">{step.desc}</p>
              </div>
            ))}
          </div>

          {/* Vehicle listing */}
          <h3 className="text-[11px] font-bold text-navy uppercase tracking-wide mb-2">
            {filterType ? `${RENTAL_TYPES.find(r => r.key === filterType)?.label || 'All'} vehicles` : 'Available vehicles'}
          </h3>

          {loading && (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-[60px] rounded-sm bg-navy/5 animate-pulse" />
              ))}
            </div>
          )}

          {error && (
            <div className="p-4 rounded-2xl bg-red-50 text-red-600 text-sm">
              Failed to load rentals: {error}
            </div>
          )}

          {!loading && !error && (
            <div className="flex flex-col gap-2">
              {filtered.map(r => (
                <div
                  key={r.id}
                  onClick={() => setSelectedVehicle(selectedVehicle === r.id ? null : r.id)}
                  className={`flex items-center gap-3 p-3 bg-white rounded-sm border-[1.5px] cursor-pointer transition-all ${
                    selectedVehicle === r.id ? 'border-teal bg-teal-light' : 'border-border'
                  }`}
                >
                  <span className="text-xl">{TYPE_ICON[r.type] ?? '🚗'}</span>
                  <div className="flex-1">
                    <p className="text-[13px] font-semibold text-navy">{r.name}</p>
                    <p className="text-[10px] text-tx-light">{r.description}</p>
                  </div>
                  <span className="text-sm font-bold text-teal">{formatPrice(r.price_per_day)}/d</span>
                </div>
              ))}
              {filtered.length === 0 && (
                <p className="text-center text-tx-light text-sm mt-6">No vehicles available in this category.</p>
              )}
            </div>
          )}

          <Button variant="primary" size="lg" fullWidth className="mt-4 mb-4">
            Book Rental
          </Button>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
