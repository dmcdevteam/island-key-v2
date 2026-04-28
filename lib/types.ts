// ═══════════════════════════════════════════
// ISLAND KEY — TypeScript Types
// Generated from Supabase schema
// ═══════════════════════════════════════════

export type Tier = 'B' | 'M' | 'P';
export type Region = 'chania' | 'rethymno' | 'heraklion' | 'lasithi';
export type GroupType = 'couple' | 'family' | 'friends' | 'solo';
export type ActivityCategory = 'sea' | 'land' | 'table' | 'culture' | 'adventure' | 'wellness';
export type RentalType = 'car' | 'motorcycle' | 'bike' | 'buggy' | 'boat';
export type EventCategory = 'market' | 'food' | 'music' | 'art' | 'cinema' | 'wine' | 'wellness' | 'festival' | 'sport' | 'other';
export type ArticleCategory = 'guide' | 'food' | 'culture' | 'nature' | 'events' | 'tips';
export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'refunded';
export type PaymentMethod = 'stripe' | 'whatsapp' | 'cash' | 'pending';
export type ItemType = 'activity' | 'deal' | 'transfer' | 'rental';
export type ProviderType = 'activity' | 'transfer' | 'rental' | 'multi';

export interface Property {
  id: string;
  slug: string;
  name: string;
  region: Region;
  tier: Tier;
  host_name: string | null;
  host_phone: string | null;
  host_email: string | null;
  commission_rate: number;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Provider {
  id: string;
  name: string;
  type: ProviderType;
  category: string | null;
  region: Region | 'island-wide';
  contact_name: string | null;
  contact_phone: string | null;
  whatsapp: string | null;
  email: string | null;
  website: string | null;
  commission_rate: number;
  notes: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Guest {
  id: string;
  first_name: string | null;
  property_id: string | null;
  tier: Tier | null;
  region: Region | null;
  check_in: string | null;
  check_out: string | null;
  group_type: GroupType | null;
  whatsapp_number: string | null;
  whatsapp_opted_in: boolean;
  user_agent: string | null;
  created_at: string;
}

export interface Activity {
  id: string;
  title: string;
  slug: string;
  description: string;
  category: ActivityCategory;
  region: Region | 'island-wide';
  tier_visibility: Tier[];
  price_from: number | null;
  price_to: number | null;
  currency: string;
  duration: string | null;
  season: string | null;
  availability_text: string | null;
  max_group_size: number | null;
  languages: string[];
  meeting_point: string | null;
  meeting_coords: string | null;
  includes: string[] | null;
  not_included: string[] | null;
  good_to_know: string | null;
  cancellation_policy: string | null;
  provider_id: string | null;
  images: string[] | null;
  image_alts: string[] | null;
  external_rating: number | null;
  external_rating_count: number | null;
  external_rating_source: string | null;
  sort_order: number;
  item_type: 'activity' | 'service';
  is_featured: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Deal {
  id: string;
  title: string;
  activity_id: string | null;
  description: string | null;
  original_price: number;
  deal_price: number;
  savings_pct: number;
  available_seats: number | null;
  expires_at: string;
  region: Region;
  tier_visibility: Tier[];
  provider_id: string | null;
  provider_name: string | null;
  category: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Transfer {
  id: string;
  route_from: string;
  route_to: string;
  route_code: string | null;
  vehicle_type: 'sedan' | 'minivan' | 'premium_suv' | 'minibus';
  vehicle_description: string | null;
  capacity: number | null;
  price: number;
  currency: string;
  tier_visibility: Tier[];
  provider_id: string | null;
  region: string;
  is_active: boolean;
  created_at: string;
}

export interface Rental {
  id: string;
  type: RentalType;
  name: string;
  description: string | null;
  specs: Record<string, any> | null;
  price_per_day: number;
  currency: string;
  min_days: number;
  insurance_included: boolean;
  delivery_available: boolean;
  tier_visibility: Tier[];
  provider_id: string | null;
  region: string;
  images: string[] | null;
  is_active: boolean;
  created_at: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  description: string | null;
  date: string;
  time_start: string | null;
  time_end: string | null;
  is_all_day: boolean;
  location: string | null;
  location_coords: string | null;
  region: Region | 'island-wide';
  category: EventCategory;
  image_url: string | null;
  external_link: string | null;
  is_recurring: boolean;
  recurrence_rule: string | null;
  is_free: boolean;
  price_info: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Article {
  id: string;
  title: string;
  slug: string;
  body: string;
  excerpt: string | null;
  category: ArticleCategory;
  region: Region | 'island-wide' | null;
  image_url: string | null;
  author: string;
  read_time_min: number;
  is_published: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Booking {
  id: string;
  confirmation_code: string;
  guest_id: string | null;
  property_id: string | null;
  item_type: ItemType;
  item_id: string;
  item_title: string;
  booking_date: string;
  booking_time: string | null;
  pax: number;
  days: number;
  unit_price: number;
  total_price: number;
  currency: string;
  commission_rate: number | null;
  commission_amount: number | null;
  host_commission_rate: number | null;
  host_commission_amount: number | null;
  provider_payout: number | null;
  payment_method: PaymentMethod;
  stripe_payment_id: string | null;
  stripe_session_id: string | null;
  status: BookingStatus;
  guest_name: string | null;
  guest_email: string | null;
  guest_notes: string | null;
  provider_id: string | null;
  action_token: string | null;
  confirmed_at: string | null;
  cancelled_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AccessKey {
  id: string;
  key: string;
  label: string | null;
  uses_remaining: number | null;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
  total_uses: number;
}

export interface InfoPage {
  id: string;
  title: string;
  slug: string;
  icon: string | null;
  content: string;
  category: string | null;
  region: Region | 'island-wide' | null;
  sort_order: number;
  is_active: boolean;
  updated_at: string;
}

// ─── New full-schema types (2025 rebuild) ────────────────────────────────────

export interface DealFull {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  short_description: string | null;
  provider_id: string | null;
  property_id: string | null;
  category: string | null;
  discount_type: string | null;
  discount_value: number | null;
  discount_label: string | null;
  original_price: number | null;
  deal_price: number | null;
  currency: string;
  code: string | null;
  terms: string | null;
  valid_from: string | null;
  valid_until: string | null;
  max_redemptions: number | null;
  total_redemptions: number;
  region: string;
  tier_visibility: string[];
  images: string[] | null;
  is_featured: boolean;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

export interface EventFull {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  short_description: string | null;
  category: string | null;
  start_date: string;
  end_date: string | null;
  all_day: boolean;
  recurring: boolean;
  recurring_pattern: string | null;
  location_name: string | null;
  location_address: string | null;
  location_lat: number | null;
  location_lng: number | null;
  price_from: number | null;
  price_label: string | null;
  is_free: boolean;
  booking_url: string | null;
  organiser: string | null;
  region: string;
  tier_visibility: string[];
  images: string[] | null;
  is_featured: boolean;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

export interface ArticleFull {
  id: string;
  title: string;
  slug: string;
  subtitle: string | null;
  body: string | null;
  excerpt: string | null;
  category: string | null;
  author: string;
  author_bio: string | null;
  read_time_minutes: number | null;
  cover_image: string | null;
  images: string[] | null;
  tags: string[] | null;
  meta_title: string | null;
  meta_description: string | null;
  og_image: string | null;
  region: string;
  is_featured: boolean;
  is_active: boolean;
  sort_order: number;
  published_at: string | null;
  created_at: string;
}

export interface InfoPageFull {
  id: string;
  title: string;
  slug: string;
  category: string | null;
  icon: string | null;
  content: string | null;
  sections: { heading: string; content: string }[] | null;
  region: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

// ─── Session state (stored in localStorage) ───
export interface GuestSession {
  guest_id: string | null;
  first_name: string;
  property_id: string;
  property_name: string;
  tier: Tier;
  region: Region;
  check_in: string;
  check_out: string;
  group_type: GroupType;
  whatsapp_opted_in: boolean;
  whatsapp_number: string | null;
}

// ─── QR params decoded from URL ───
export interface QRParams {
  tier: Tier;
  prop: string;   // property slug
  region: Region;
}

// ─── Supabase Database type ───
// Must satisfy GenericSchema: Tables + Views + Functions, with Relationships on every table.
type TableDef<T> = {
  Row: T;
  Insert: Partial<T>;
  Update: Partial<T>;
  Relationships: never[];
};

export interface Database {
  public: {
    Tables: {
      properties: TableDef<Property>;
      providers:  TableDef<Provider>;
      guests:     TableDef<Guest>;
      activities: TableDef<Activity>;
      deals:      TableDef<Deal>;
      transfers:  TableDef<Transfer>;
      rentals:    TableDef<Rental>;
      events:     TableDef<CalendarEvent>;
      articles:   TableDef<Article>;
      bookings:   TableDef<Booking>;
      info_pages:  TableDef<InfoPage>;
      access_keys: TableDef<AccessKey>;
    };
    Views:          Record<string, never>;
    Functions:      Record<string, never>;
    Enums:          Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
