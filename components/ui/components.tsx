'use client';

import Link from 'next/link';
import { clsx } from 'clsx';
import type { Tier, ActivityCategory, Deal } from '@/lib/types';
import { TIER_LABELS, TIER_COLORS, CATEGORY_LABELS, formatPrice, timeRemaining } from '@/lib/utils';
import { useFavourites } from '@/app/_components/favourites-provider';
import type { FavouriteToggleItem } from '@/app/_components/favourites-provider';
import { FocalImage } from '@/components/FocalImage';
import type { FocalPoint } from '@/components/FocalImage';

// ─── HEART BUTTON ───
export function HeartButton({ item, className }: { item: FavouriteToggleItem; className?: string }) {
  const { isFavourited, toggleFavourite } = useFavourites()
  const faved = isFavourited(item.id)
  return (
    <button
      onClick={e => { e.stopPropagation(); toggleFavourite(item) }}
      aria-label={faved ? 'Remove from saved' : 'Save'}
      className={clsx(
        'w-8 h-8 rounded-full flex items-center justify-center transition-all active:scale-90',
        faved ? 'bg-white/90 text-red-500' : 'bg-white/70 text-tx-light hover:text-red-400',
        className
      )}
      style={{ backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)' }}
    >
      <span className="text-[16px] leading-none select-none">{faved ? '♥' : '♡'}</span>
    </button>
  )
}

// ─── BUTTON ───
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'outline' | 'whatsapp' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  children: React.ReactNode;
}

export function Button({ variant = 'primary', size = 'md', fullWidth, className, children, ...props }: ButtonProps) {
  return (
    <button
      className={clsx(
        'font-semibold rounded-sm transition-all active:scale-[0.97] cursor-pointer',
        {
          'bg-navy text-white': variant === 'primary',
          'bg-transparent text-navy border-[1.5px] border-navy hover:bg-navy hover:text-white': variant === 'outline',
          'bg-whatsapp text-white': variant === 'whatsapp',
          'bg-transparent text-tx-mid': variant === 'ghost',
        },
        {
          'px-4 py-2 text-xs': size === 'sm',
          'px-6 py-3 text-sm': size === 'md',
          'px-8 py-3.5 text-[15px]': size === 'lg',
        },
        fullWidth && 'w-full',
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

// ─── BOOK BUTTON (Teal) ───
export function BookButton({ onClick, className }: { onClick?: () => void; className?: string }) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        'flex-1 py-3 bg-teal text-white rounded-sm font-bold text-sm transition-all active:scale-[0.97]',
        className
      )}
    >
      Check Availability
    </button>
  );
}

// ─── WHATSAPP BUTTON (Square) ───
export function WhatsAppButton({ onClick, className }: { onClick?: () => void; className?: string }) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        'w-11 h-11 bg-whatsapp rounded-sm flex items-center justify-center text-xl flex-shrink-0 transition-all active:scale-95',
        className
      )}
    >
      💬
    </button>
  );
}

// ─── TIER BADGE ───
export function TierBadge({ tier }: { tier: Tier }) {
  const colors = TIER_COLORS[tier];
  return (
    <span className={clsx('text-[10px] font-bold tracking-wide uppercase px-2.5 py-1 rounded-full', colors.bg, colors.text)}>
      {TIER_LABELS[tier]}
    </span>
  );
}

// ─── CATEGORY CHIP ───
interface ChipProps {
  label: string;
  icon?: string;
  active?: boolean;
  onClick?: () => void;
}

export function CategoryChip({ label, icon, active, onClick }: ChipProps) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        'px-3.5 py-[7px] rounded-full text-[11px] font-semibold whitespace-nowrap transition-all border-[1.5px] flex-shrink-0',
        active
          ? 'bg-navy text-white border-navy'
          : 'bg-white text-tx-mid border-border hover:border-navy/30'
      )}
    >
      {icon && <span className="mr-1">{icon}</span>}
      {label}
    </button>
  );
}

// ─── SELECTION CHIP (for onboarding) ───
export function SelectionChip({ label, selected, onClick }: { label: string; selected?: boolean; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        'px-4 py-2 rounded-full text-xs font-medium transition-all border-[1.5px]',
        selected
          ? 'bg-navy text-white border-navy'
          : 'bg-white text-tx-mid border-border'
      )}
    >
      {label}
    </button>
  );
}

// ─── ACTIVITY CARD (List item) ───
const CATEGORY_ICONS: Record<string, string> = {
  on_water: '🌊', on_foot: '🥾', wild_routes: '🏔️', culinary: '🍷',
  history_art: '🏛️', slow_down: '🧘', in_the_air: '🪂',
};

interface ActivityCardProps {
  title: string;
  description: string;
  category: string;
  priceFrom: number;
  duration: string;
  imageUrl?: string | null;
  focalPoint?: FocalPoint | null;
  externalRating?: number | null;
  externalRatingCount?: number | null;
  externalRatingSource?: string | null;
  heartItem?: FavouriteToggleItem;
  priority?: boolean;
  // kept for legacy call sites that still pass these — unused when imageUrl is present
  icon?: string;
  bgGradient?: string;
  onClick?: () => void;
}

export function ActivityCard({ title, description, category, priceFrom, duration, imageUrl, focalPoint, externalRating, externalRatingCount, externalRatingSource, heartItem, priority, onClick }: ActivityCardProps) {
  const icon = CATEGORY_ICONS[category] ?? '🌟';
  return (
    <div
      onClick={onClick}
      className="bg-white rounded border border-border-light cursor-pointer transition-all active:scale-[0.98] active:bg-sand overflow-hidden"
    >
      {/* 16:9 image */}
      <div style={{ aspectRatio: '16/9', overflow: 'hidden', background: '#1B2D4F', position: 'relative' }}>
        {imageUrl ? (
          <FocalImage
            src={imageUrl}
            alt={title}
            focalPoint={focalPoint}
            priority={priority}
            style={{ width: '100%', height: '100%', display: 'block' }}
          />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
            <span style={{ fontSize: 28 }}>{icon}</span>
            <span style={{ fontSize: 10, fontWeight: 700, color: '#F5F0E8', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{CATEGORY_LABELS[category] ?? category}</span>
          </div>
        )}
        {heartItem && (
          <div className="absolute top-2 right-2 z-10">
            <HeartButton item={heartItem} />
          </div>
        )}
      </div>
      {/* Text */}
      <div className="p-2.5">
        <h3 className="font-semibold text-[13px] text-navy mb-0.5">{title}</h3>
        {externalRating && (
          <div className="flex items-center gap-1 mb-1">
            <span className="text-amber-400 text-[11px] leading-none">{'★'.repeat(Math.round(externalRating))}</span>
            <span className="text-[11px] font-semibold text-navy">{externalRating.toFixed(1)}</span>
            {externalRatingCount && <span className="text-[10px] text-tx-light">({externalRatingCount.toLocaleString()})</span>}
            {externalRatingSource && <span className="text-[9px] text-tx-light bg-sand px-1 py-0.5 rounded">{externalRatingSource}</span>}
          </div>
        )}
        <p className="text-[11px] text-tx-light leading-snug mb-1.5 line-clamp-2">{description}</p>
        <div className="flex justify-between items-center">
          <span className="text-xs font-bold text-teal">From {formatPrice(priceFrom)}pp</span>
          <span className="text-[10px] text-tx-light">{duration}</span>
        </div>
      </div>
    </div>
  );
}

// ─── ACTIVITY MINI CARD (Horizontal scroll — Home screen) ───
export function ActivityMiniCard({ title, subtitle, priceFrom, category, imageUrl, focalPoint, heartItem, onClick }: {
  title: string; subtitle: string; priceFrom: number; category: string; imageUrl?: string | null;
  focalPoint?: FocalPoint | null;
  heartItem?: FavouriteToggleItem;
  // kept for legacy call sites
  icon?: string; bgGradient?: string;
  onClick?: () => void;
}) {
  const icon = CATEGORY_ICONS[category] ?? '🌟';
  return (
    <div
      onClick={onClick}
      className="w-[200px] min-w-[200px] snap-start bg-white rounded overflow-hidden border border-border-light cursor-pointer flex-shrink-0 transition-transform active:scale-[0.97]"
    >
      {/* 16:9 image — 200px wide → ~112px tall */}
      <div style={{ aspectRatio: '16/9', overflow: 'hidden', background: '#1B2D4F', position: 'relative' }}>
        {imageUrl ? (
          <FocalImage
            src={imageUrl}
            alt={title}
            focalPoint={focalPoint}
            style={{ width: '100%', height: '100%', display: 'block' }}
          />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
            <span style={{ fontSize: 26 }}>{icon}</span>
            <span style={{ fontSize: 9, fontWeight: 700, color: '#F5F0E8', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{CATEGORY_LABELS[category] ?? category}</span>
          </div>
        )}
        {heartItem && (
          <div className="absolute top-1.5 right-1.5 z-10">
            <HeartButton item={heartItem} />
          </div>
        )}
      </div>
      <div className="p-2.5">
        <h3 className="font-semibold text-xs text-navy mb-0.5">{title}</h3>
        <p className="text-[10px] text-tx-light">{subtitle}</p>
        <p className="text-[11px] font-bold text-teal mt-1">From {formatPrice(priceFrom)}pp</p>
      </div>
    </div>
  );
}

// ─── DEAL CARD ───
export function DealCard({ deal, onClick }: { deal: Deal; onClick?: () => void }) {
  return (
    <div
      onClick={onClick}
      className="p-3.5 bg-white rounded border border-border-light cursor-pointer relative overflow-hidden transition-all active:scale-[0.98] pl-4"
    >
      <div className="absolute top-0 left-0 bottom-0 w-1 bg-terra" />
      <span className="inline-block bg-terra text-white text-[10px] font-bold px-1.5 py-0.5 rounded mb-1.5">
        {deal.savings_pct}% OFF
      </span>
      <h3 className="text-[13px] font-semibold text-navy mb-0.5">{deal.title}</h3>
      <div className="flex gap-2.5 text-[10px] text-tx-light mb-1.5">
        {deal.available_seats && <span>{deal.available_seats} seats left</span>}
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-[11px] text-tx-light line-through">{formatPrice(deal.original_price)}</span>
        <span className="text-[15px] font-bold text-terra">{formatPrice(deal.deal_price)}pp</span>
      </div>
      <p className="text-[10px] font-semibold text-deal mt-1">⏱ {timeRemaining(deal.expires_at)}</p>
    </div>
  );
}

// ─── EVENT CARD ───
export function EventCard({ title, time, isAllDay, location, description, category, categoryColor }: {
  title: string; time?: string; isAllDay?: boolean; location?: string; description?: string;
  category: string; categoryColor: string;
}) {
  return (
    <div className="mx-5 mb-2.5 p-3.5 bg-white rounded border border-border-light flex gap-3.5 items-start cursor-pointer transition-all active:scale-[0.98] active:bg-sand">
      <div className="min-w-[48px] text-center flex-shrink-0">
        {isAllDay ? (
          <span className="text-[10px] font-semibold text-teal">All day</span>
        ) : (
          <>
            <div className="text-[15px] font-bold text-navy">{time?.split(':')[0]}:{time?.split(':')[1]?.slice(0,2)}</div>
            <div className="text-[9px] font-semibold text-tx-light uppercase">
              {time && parseInt(time) >= 12 ? 'PM' : 'AM'}
            </div>
          </>
        )}
      </div>
      <div className="w-0.5 self-stretch rounded-full flex-shrink-0" style={{ background: categoryColor }} />
      <div className="flex-1">
        <h3 className="text-sm font-semibold text-navy mb-0.5 leading-snug">{title}</h3>
        {location && <p className="text-[11px] text-tx-light mb-1.5 flex items-center gap-1">📍 {location}</p>}
        {description && <p className="text-[11px] text-tx-mid leading-relaxed">{description}</p>}
        <span
          className="inline-block text-[9px] font-bold uppercase tracking-wide px-2 py-0.5 rounded text-white mt-1.5"
          style={{ background: categoryColor }}
        >
          {category}
        </span>
      </div>
    </div>
  );
}

// ─── BLOG/ARTICLE CARD ───
export function ArticleCard({ title, excerpt, category, readTime, bgGradient, tagColor, image, onClick }: {
  title: string; excerpt: string; category: string; readTime: number;
  bgGradient: string; tagColor: string; image?: string | null; onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className="min-w-[240px] bg-white rounded overflow-hidden border border-border-light cursor-pointer flex-shrink-0 transition-transform active:scale-[0.97]"
    >
      <div className="h-[120px] relative flex items-end p-2.5" style={image ? undefined : { background: bgGradient }}>
        {image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt={title} className="absolute inset-0 w-full h-full object-cover" />
        )}
        <span className="absolute top-2 left-2 text-[9px] font-bold uppercase tracking-wide px-2 py-0.5 rounded text-white z-10" style={{ background: tagColor }}>
          {category}
        </span>
      </div>
      <div className="p-2.5 pb-3">
        <h3 className="font-semibold text-[13px] text-navy mb-0.5 leading-snug">{title}</h3>
        <p className="text-[11px] text-tx-light leading-snug line-clamp-2">{excerpt}</p>
        <p className="text-[10px] font-semibold text-teal mt-1.5">Read · {readTime} min</p>
      </div>
    </div>
  );
}

// ─── RENTAL TYPE CARD ───
export function RentalTypeCard({ icon, name, priceFrom, description, onClick }: {
  icon: string; name: string; priceFrom: number; description: string; onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className="p-4 bg-white rounded border border-border-light cursor-pointer text-center transition-all active:scale-[0.96] active:bg-sand"
    >
      <span className="text-3xl block mb-2">{icon}</span>
      <p className="text-[13px] font-semibold text-navy mb-0.5">{name}</p>
      <p className="text-[11px] font-semibold text-teal">From {formatPrice(priceFrom)}/day</p>
      <p className="text-[10px] text-tx-light mt-0.5">{description}</p>
    </div>
  );
}

// ─── INFO CATEGORY CARD ───
export function InfoCard({ icon, title, onClick }: { icon: string; title: string; onClick?: () => void }) {
  return (
    <div
      onClick={onClick}
      className="p-4 bg-white rounded border border-border-light cursor-pointer text-center transition-all active:scale-[0.96] active:bg-sand"
    >
      <span className="text-2xl block mb-1.5">{icon}</span>
      <p className="text-xs font-semibold text-navy">{title}</p>
    </div>
  );
}

// ─── SECTION HEADER ───
export function SectionHeader({ title, linkText, href, onLink }: { title: string; linkText?: string; href?: string; onLink?: () => void }) {
  return (
    <div className="flex justify-between items-baseline px-5 mb-2.5">
      <h2 className="font-display text-[16px] font-medium text-navy">{title}</h2>
      {linkText && href && (
        <Link href={href} className="text-[11px] font-semibold text-teal">{linkText}</Link>
      )}
      {linkText && !href && onLink && (
        <button onClick={onLink} className="text-[11px] font-semibold text-teal">{linkText}</button>
      )}
    </div>
  );
}

// ─── ACCOMMODATION ID CARD (Onboarding) ───
export function AccommodationCard({ name, onChangeProperty }: { name: string; onChangeProperty: () => void }) {
  return (
    <div className="flex items-center gap-3 p-3 bg-teal-light border-[1.5px] border-teal/20 rounded-sm mb-5">
      <span className="text-xl">🏠</span>
      <div className="flex-1">
        <p className="text-[10px] font-bold text-teal uppercase tracking-wide">You're staying at</p>
        <p className="text-sm font-semibold text-navy mt-0.5">{name}</p>
      </div>
      <button
        onClick={onChangeProperty}
        className="text-[11px] font-semibold text-teal px-3 py-1.5 border-[1.5px] border-teal rounded-full bg-white whitespace-nowrap"
      >
        Change
      </button>
    </div>
  );
}
