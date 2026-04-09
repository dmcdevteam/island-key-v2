'use client';

import { useEffect, useState } from 'react';
import { BottomNav } from '@/components/ui/bottom-nav';
import { CategoryChip } from '@/components/ui/components';
import { createClient } from '@/lib/supabase';
import type { Article } from '@/lib/types';

const CATEGORIES = [
  { key: 'all',     label: 'All' },
  { key: 'guide',   label: '📍 Guides' },
  { key: 'food',    label: '🍽️ Food' },
  { key: 'culture', label: '🏛 Culture' },
  { key: 'nature',  label: '🌿 Nature' },
  { key: 'events',  label: '🎵 Events' },
  { key: 'tips',    label: '💡 Tips' },
];

const CATEGORY_STYLES: Record<string, { bg: string; tagColor: string }> = {
  guide:   { bg: 'linear-gradient(135deg,rgba(26,138,125,0.1),rgba(107,123,94,0.07))',   tagColor: '#1A8A7D' },
  food:    { bg: 'linear-gradient(135deg,rgba(212,133,74,0.1),rgba(196,112,63,0.07))',   tagColor: '#D4854A' },
  culture: { bg: 'linear-gradient(135deg,rgba(27,45,79,0.1),rgba(122,107,93,0.07))',     tagColor: '#1B2D4F' },
  nature:  { bg: 'linear-gradient(135deg,rgba(107,123,94,0.1),rgba(26,138,125,0.07))',   tagColor: '#5B7A3D' },
  events:  { bg: 'linear-gradient(135deg,rgba(212,133,74,0.07),rgba(26,138,125,0.07))',  tagColor: '#D94F4F' },
  tips:    { bg: 'linear-gradient(135deg,rgba(212,168,67,0.1),rgba(107,123,94,0.07))',   tagColor: '#D4A843' },
};

const DEFAULT_STYLE = { bg: 'linear-gradient(135deg,rgba(27,45,79,0.05),rgba(107,123,94,0.05))', tagColor: '#5A5A5A' };

export default function InsightsPage() {
  const [activeCat, setActiveCat] = useState('all');
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from('published_articles')
      .select('*')
      .then(({ data, error }) => {
        if (error) setError(error.message);
        else setArticles(data ?? []);
        setLoading(false);
      });
  }, []);

  const filtered = activeCat === 'all' ? articles : articles.filter(a => a.category === activeCat);

  return (
    <div className="min-h-screen bg-cream flex flex-col pb-[90px]">
      <div className="px-5 pt-[52px] pb-3">
        <h1 className="font-display text-xl font-medium text-navy">Local Insights</h1>
        <p className="text-xs text-tx-light mt-0.5">Stories, guides & tips from the island</p>
      </div>

      {/* Category chips */}
      <div className="flex gap-1.5 px-5 overflow-x-auto no-scrollbar mb-3 flex-shrink-0">
        {CATEGORIES.map(cat => (
          <CategoryChip
            key={cat.key}
            label={cat.label}
            active={activeCat === cat.key}
            onClick={() => setActiveCat(cat.key)}
          />
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-5">
        {loading && (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded overflow-hidden border border-border-light">
                <div className="h-[140px] bg-navy/5 animate-pulse" />
                <div className="p-3 space-y-2">
                  <div className="h-4 bg-navy/5 rounded animate-pulse w-3/4" />
                  <div className="h-3 bg-navy/5 rounded animate-pulse" />
                  <div className="h-3 bg-navy/5 rounded animate-pulse w-5/6" />
                </div>
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="mt-4 p-4 rounded-2xl bg-red-50 text-red-600 text-sm">
            Failed to load articles: {error}
          </div>
        )}

        {!loading && !error && (
          <div className="flex flex-col gap-3">
            {filtered.map(article => {
              const style = CATEGORY_STYLES[article.category] ?? DEFAULT_STYLE;
              return (
                <div
                  key={article.id}
                  className="bg-white rounded overflow-hidden border border-border-light cursor-pointer transition-all active:scale-[0.98]"
                >
                  <div className="h-[140px] relative flex items-end p-3" style={{ background: style.bg }}>
                    <span
                      className="absolute top-2.5 left-2.5 text-[9px] font-bold uppercase tracking-wide px-2 py-0.5 rounded text-white"
                      style={{ background: style.tagColor }}
                    >
                      {article.category}
                    </span>
                  </div>
                  <div className="p-3 pb-3.5">
                    <h3 className="font-semibold text-sm text-navy mb-1 leading-snug">{article.title}</h3>
                    <p className="text-xs text-tx-mid leading-relaxed line-clamp-3 mb-2">{article.excerpt}</p>
                    <div className="flex justify-between items-center">
                      <span className="text-[11px] font-semibold text-teal">Read article →</span>
                      <span className="text-[10px] text-tx-light">{article.read_time_min} min read</span>
                    </div>
                  </div>
                </div>
              );
            })}
            {filtered.length === 0 && (
              <p className="text-center text-tx-light text-sm mt-12">No articles in this category yet.</p>
            )}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
