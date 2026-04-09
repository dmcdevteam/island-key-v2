'use client';

import { useEffect, useState } from 'react';
import { BottomNav } from '@/components/ui/bottom-nav';
import { EventCard } from '@/components/ui/components';
import { EVENT_COLORS } from '@/lib/utils';
import { createClient } from '@/lib/supabase';
import type { CalendarEvent } from '@/lib/types';
import { clsx } from 'clsx';

// Build a 14-day strip starting from today
function buildDayStrip() {
  const days = [];
  const DW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  for (let i = 0; i < 14; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    days.push({
      date: d.toISOString().slice(0, 10), // YYYY-MM-DD
      dw: DW[d.getDay()],
      dn: d.getDate(),
    });
  }
  return days;
}

function formatDayHeader(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'long' });
}

export default function EventsPage() {
  const [activeTab, setActiveTab] = useState('week');
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const days = buildDayStrip();
  const [selectedDate, setSelectedDate] = useState(days[0].date);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from('upcoming_events')
      .select('*')
      .then(({ data, error }) => {
        if (error) {
          setError(error.message);
        } else {
          const fetched = data ?? [];
          setEvents(fetched);
          // Auto-select first day with events, or stay on today
          const datesWithEvents = new Set(fetched.map((e: CalendarEvent) => e.date));
          const first = days.find(d => datesWithEvents.has(d.date));
          if (first) setSelectedDate(first.date);
        }
        setLoading(false);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Group events by date
  const eventsByDate = events.reduce<Record<string, CalendarEvent[]>>((acc, ev) => {
    (acc[ev.date] ??= []).push(ev);
    return acc;
  }, {});

  const datesWithEvents = new Set(Object.keys(eventsByDate));
  const currentEvents = eventsByDate[selectedDate] ?? [];

  return (
    <div className="min-h-screen bg-cream flex flex-col pb-[90px]">
      <div className="px-5 pt-[52px] pb-3">
        <h1 className="font-display text-xl font-medium text-navy">What's Happening</h1>
        <p className="text-xs text-tx-light mt-0.5">Curated events & happenings across Crete</p>
      </div>

      {/* Time tabs */}
      <div className="flex mx-5 mb-3 bg-white rounded-sm border border-border-light overflow-hidden">
        {['week', 'month', 'upcoming'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={clsx(
              'flex-1 text-center py-2.5 text-[11px] font-semibold transition-all border-r border-border-light last:border-r-0',
              activeTab === tab ? 'bg-navy text-white' : 'text-tx-light'
            )}
          >
            {tab === 'week' ? 'This Week' : tab === 'month' ? 'This Month' : 'Upcoming'}
          </button>
        ))}
      </div>

      {/* Date strip */}
      <div className="flex gap-1.5 px-5 overflow-x-auto no-scrollbar mb-4">
        {loading
          ? Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="min-w-[52px] h-[72px] rounded-sm bg-navy/5 animate-pulse flex-shrink-0" />
            ))
          : days.map(day => {
              const has = datesWithEvents.has(day.date);
              const isSelected = selectedDate === day.date;
              return (
                <button
                  key={day.date}
                  onClick={() => setSelectedDate(day.date)}
                  className={clsx(
                    'min-w-[52px] py-2.5 px-1.5 text-center rounded-sm border-[1.5px] flex-shrink-0 transition-all flex flex-col items-center',
                    isSelected
                      ? 'bg-navy border-navy'
                      : has
                        ? 'bg-white border-teal/30'
                        : 'bg-white border-border-light'
                  )}
                >
                  <span className={clsx('text-[9px] font-bold uppercase mb-0.5', isSelected ? 'text-white/60' : 'text-tx-light')}>
                    {day.dw}
                  </span>
                  <span className={clsx('text-lg font-bold', isSelected ? 'text-white' : 'text-navy')}>
                    {day.dn}
                  </span>
                  <div className={clsx(
                    'w-[5px] h-[5px] rounded-full mt-1',
                    isSelected && has ? 'bg-white' : has ? 'bg-teal' : 'bg-transparent'
                  )} />
                </button>
              );
            })
        }
      </div>

      {/* Events */}
      <div className="flex-1 overflow-y-auto">
        {error && (
          <div className="mx-5 mt-4 p-4 rounded-2xl bg-red-50 text-red-600 text-sm">
            Failed to load events: {error}
          </div>
        )}

        {!loading && !error && currentEvents.length > 0 && (
          <>
            <div className="px-5 mb-2">
              <p className="text-xs font-semibold text-tx-mid">{formatDayHeader(selectedDate)}</p>
            </div>
            {currentEvents.map(ev => (
              <EventCard
                key={ev.id}
                title={ev.title}
                time={ev.time_start ?? undefined}
                isAllDay={ev.is_all_day}
                location={ev.location ?? undefined}
                description={ev.description ?? undefined}
                category={ev.category}
                categoryColor={EVENT_COLORS[ev.category] || '#5A5A5A'}
              />
            ))}
          </>
        )}

        {!loading && !error && currentEvents.length === 0 && (
          <div className="text-center pt-16 px-8">
            <p className="text-3xl mb-3">📅</p>
            <p className="text-sm text-tx-light">No events on this day.</p>
            <p className="text-xs text-tx-light mt-1">Try selecting a day with a teal dot.</p>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
