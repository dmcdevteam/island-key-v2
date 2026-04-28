import type { GuestSession, QRParams, Tier, Region } from './types';

const SESSION_KEY = 'ik_session';

// ─── Parse QR parameters from URL ───
export function parseQRParams(searchParams: URLSearchParams): QRParams | null {
  const tier = searchParams.get('tier') as Tier | null;
  const prop = searchParams.get('prop');
  const region = searchParams.get('region') as Region | null;

  if (!tier || !prop || !region) return null;
  if (!['B', 'M', 'P'].includes(tier)) return null;
  if (!['chania', 'rethymno', 'heraklion', 'lasithi'].includes(region)) return null;

  return { tier, prop, region };
}

// ─── Session CRUD ───
export function getSession(): GuestSession | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setSession(session: GuestSession): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearSession(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(SESSION_KEY);
}

export function hasSession(): boolean {
  return getSession() !== null;
}

// ─── Tier display helpers ───
export const TIER_LABELS: Record<Tier, string> = {
  B: 'Explorer',
  M: 'Signature',
  P: 'Premium',
};

export const TIER_COLORS: Record<Tier, { bg: string; text: string }> = {
  B: { bg: 'bg-green-100', text: 'text-green-700' },
  M: { bg: 'bg-blue-100', text: 'text-blue-700' },
  P: { bg: 'bg-amber-100', text: 'text-amber-700' },
};

// ─── Category display helpers ───
export const CATEGORY_LABELS: Record<string, string> = {
  on_water:    'On the Water',
  on_foot:     'On Foot',
  wild_routes: 'Wild Routes',
  culinary:    'Culinary',
  history_art: 'History & Art',
  slow_down:   'Slow Down',
  in_the_air:  'In the Air',
};

export const MOOD_LABELS: Record<string, string> = {
  romantic:   'Romantic',
  family:     'Family',
  low_effort: 'Easy day',
  iconic:     'Iconic',
  off_path:   'Off the path',
  wow_factor: 'Wow factor',
  rainy_day:  'Rainy day',
  sunset:     'Sunset',
  foodie:     'Foodie',
  adrenaline: 'Adrenaline',
  slow:       'Slow',
};

export const ACTIVITY_CATEGORIES = [
  { key: 'all',         label: 'All',           icon: '' },
  { key: 'on_water',    label: 'On the Water',   icon: '🌊' },
  { key: 'on_foot',     label: 'On Foot',        icon: '🥾' },
  { key: 'wild_routes', label: 'Wild Routes',    icon: '🏔️' },
  { key: 'culinary',    label: 'Culinary',       icon: '🍷' },
  { key: 'history_art', label: 'History & Art',  icon: '🏛️' },
  { key: 'slow_down',   label: 'Slow Down',      icon: '🧘' },
  { key: 'in_the_air',  label: 'In the Air',     icon: '🪂' },
] as const;

export const RENTAL_TYPES = [
  { key: 'car', label: 'Car', icon: '🚗', from: 30 },
  { key: 'motorcycle', label: 'Motorcycle', icon: '🏍️', from: 25 },
  { key: 'bike', label: 'Bike / E-Bike', icon: '🚲', from: 12 },
  { key: 'buggy', label: 'Buggy', icon: '🛻', from: 80 },
  { key: 'boat', label: 'Boat', icon: '⛵', from: 120 },
] as const;

export const EVENT_COLORS: Record<string, string> = {
  market: '#1A8A7D',
  food: '#D4854A',
  music: '#1B2D4F',
  art: '#1B2D4F',
  cinema: '#9B59B6',
  wine: '#D4A843',
  wellness: '#D94F4F',
  festival: '#D4854A',
  sport: '#1A8A7D',
  other: '#5A5A5A',
};

// ─── WhatsApp deep link ───
export function whatsappLink(message: string): string {
  const phone = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '306900000000';
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

// ─── Format price ───
export function formatPrice(amount: number): string {
  return `€${amount.toLocaleString('en', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

// ─── Time remaining until expiry ───
export function timeRemaining(expiresAt: string): string {
  const now = new Date().getTime();
  const exp = new Date(expiresAt).getTime();
  const diff = exp - now;
  if (diff <= 0) return 'Expired';
  const hours = Math.floor(diff / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  if (hours > 24) return `${Math.floor(hours / 24)}d ${hours % 24}h left`;
  return `${hours}h ${mins}m left`;
}
