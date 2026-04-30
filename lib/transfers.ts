// ═══════════════════════════════════════════════
// ISLAND KEY — Transfer constants + pricing logic
// ═══════════════════════════════════════════════

export type VehicleSlug = 'sedan' | 'minivan' | 'minibus' | 'premium_suv';

// ─── Vehicle display constants ───────────────────────────────────────────────
// Swap URLs here without touching any component.

export const VEHICLE_IMAGES: Record<VehicleSlug, string> = {
  sedan:       'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=800',
  minivan:     'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800',
  minibus:     'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800',
  premium_suv: 'https://images.unsplash.com/photo-1609521263047-f8f205293f24?w=800',
};

export const VEHICLE_LABELS: Record<VehicleSlug, string> = {
  sedan:       'Sedan',
  minivan:     'Minivan',
  minibus:     'Minibus',
  premium_suv: 'Premium SUV',
};

export const VEHICLE_CAPACITY: Record<VehicleSlug, { pax: number; luggage: number }> = {
  sedan:       { pax: 3,  luggage: 3  },
  minivan:     { pax: 7,  luggage: 7  },
  minibus:     { pax: 16, luggage: 16 },
  premium_suv: { pax: 6,  luggage: 6  },
};

export const VEHICLE_EXAMPLES: Record<VehicleSlug, string> = {
  sedan:       'Toyota Prius, Skoda Octavia or similar',
  minivan:     'Mercedes Vito, VW Transporter or similar',
  minibus:     'Mercedes Sprinter or similar',
  premium_suv: 'BMW X5, Mercedes GLE or similar',
};

export const VEHICLE_ORDER: VehicleSlug[] = ['sedan', 'minivan', 'minibus', 'premium_suv'];

/**
 * Returns the image URL for a vehicle slug.
 * Prefers DB-stored image_url; falls back to VEHICLE_IMAGES default.
 */
export function getVehicleImage(slug: VehicleSlug, imageUrl?: string | null): string {
  return imageUrl || VEHICLE_IMAGES[slug];
}

// ─── Pricing formulas ────────────────────────────────────────────────────────

type Zone = {
  from_km: number;
  to_km:   number | null;
  flat:    number | null;
  base:    number | null;
  per_km:  number | null;
};

type ZoneFormula = {
  zones: Zone[];
};

type DerivedFormula = {
  derived_from: string;
  multiplier:   number;
};

export type FormulaConfig = ZoneFormula | DerivedFormula;

export interface VehicleFormula {
  zone_config:         FormulaConfig;
  airport_multiplier:  number;
}

// Hardcoded defaults — used when DB formulas haven't loaded yet, or as fallback.
export const HARDCODED_FORMULAS: Record<VehicleSlug, VehicleFormula> = {
  sedan: {
    zone_config: {
      zones: [
        { from_km: 0,   to_km: 25,  flat: 28,   base: null, per_km: null },
        { from_km: 25,  to_km: 60,  flat: null,  base: 15,   per_km: 1.15 },
        { from_km: 60,  to_km: 120, flat: null,  base: 20,   per_km: 1.05 },
        { from_km: 120, to_km: null, flat: null, base: 35,   per_km: 1.15 },
      ],
    },
    airport_multiplier: 1.15,
  },
  minivan: {
    zone_config: {
      zones: [
        { from_km: 0,   to_km: 25,  flat: 48,   base: null, per_km: null },
        { from_km: 25,  to_km: 60,  flat: null,  base: 25,   per_km: 1.80 },
        { from_km: 60,  to_km: 120, flat: null,  base: 38,   per_km: 1.45 },
        { from_km: 120, to_km: null, flat: null, base: 50,   per_km: 1.45 },
      ],
    },
    airport_multiplier: 1.10,
  },
  minibus: {
    zone_config: {
      zones: [
        { from_km: 0,   to_km: 35,  flat: 95,   base: null, per_km: null },
        { from_km: 35,  to_km: 60,  flat: null,  base: 55,   per_km: 2.10 },
        { from_km: 60,  to_km: 120, flat: null,  base: 70,   per_km: 1.85 },
        { from_km: 120, to_km: null, flat: null, base: 90,   per_km: 1.85 },
      ],
    },
    airport_multiplier: 1.10,
  },
  premium_suv: {
    zone_config: { derived_from: 'minivan', multiplier: 1.35 },
    airport_multiplier: 1.10,
  },
};

function calcZones(km: number, zones: Zone[]): number {
  for (const z of zones) {
    if (km >= z.from_km && (z.to_km === null || km < z.to_km)) {
      if (z.flat !== null) return z.flat;
      return (z.base ?? 0) + km * (z.per_km ?? 0);
    }
  }
  return 0;
}

/**
 * Calculate a P2P transfer price.
 * Pass `dbFormulas` to use admin-edited formulas; omit to use hardcoded defaults.
 */
export function calculateP2PPrice(
  distanceKm:  number,
  vehicleSlug: VehicleSlug,
  isAirport:   boolean,
  dbFormulas?: Record<string, VehicleFormula>,
): number {
  const formulas = (dbFormulas ?? HARDCODED_FORMULAS) as Record<string, VehicleFormula>;
  const formula  = formulas[vehicleSlug];
  if (!formula) return 0;

  const cfg = formula.zone_config;
  let base: number;

  if ('derived_from' in cfg) {
    // premium_suv = minivan × multiplier, rounded to nearest €5
    const source = formulas[cfg.derived_from];
    if (!source || !('zones' in source.zone_config)) return 0;
    const srcPrice = calcZones(distanceKm, source.zone_config.zones);
    base = Math.round((srcPrice * cfg.multiplier) / 5) * 5;
  } else {
    base = calcZones(distanceKm, cfg.zones);
  }

  if (isAirport) {
    base = base * formula.airport_multiplier;
  }

  return Math.round(base);
}

/**
 * Parse DB formula rows into the VehicleFormula map.
 * Each DB row: { vehicle_slug, zone_config: FormulaConfig, airport_multiplier }
 */
export function parseDbFormulas(rows: any[]): Record<VehicleSlug, VehicleFormula> {
  const out: Partial<Record<VehicleSlug, VehicleFormula>> = {};
  for (const row of rows) {
    const slug = row.vehicle_slug as VehicleSlug;
    if (slug) {
      out[slug] = {
        zone_config:        row.zone_config,
        airport_multiplier: Number(row.airport_multiplier),
      };
    }
  }
  return { ...HARDCODED_FORMULAS, ...out };
}

// ─── Time helpers ──────────────────────────────────────────────────────────

/** Generate 30-min time slot options: "00:00" … "23:30" */
export function generateTimeSlots(): string[] {
  const slots: string[] = [];
  for (let h = 0; h < 24; h++) {
    for (const m of [0, 30]) {
      slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    }
  }
  return slots;
}

/** Add duration (minutes) to a HH:mm time string → "HH:mm" */
export function addMinutes(time: string, minutes: number): string {
  const [h, m] = time.split(':').map(Number);
  const total  = h * 60 + m + minutes;
  const nh     = Math.floor(total / 60) % 24;
  const nm     = total % 60;
  return `${String(nh).padStart(2, '0')}:${String(nm).padStart(2, '0')}`;
}

/** Format a date string (YYYY-MM-DD) to "Wed, 15 May" */
export function formatTransferDate(date: string): string {
  if (!date) return '';
  return new Date(date + 'T12:00:00').toLocaleDateString('en-GB', {
    weekday: 'short', day: 'numeric', month: 'short',
  });
}
