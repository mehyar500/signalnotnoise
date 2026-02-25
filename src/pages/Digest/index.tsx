import { BookOpen, CheckCircle, Sparkles, Calendar, Zap } from 'lucide-react';
import { GlassCard } from '@/components/GlassCard';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { markDone } from '@/app/digestSlice';
import { useGetDigestQuery } from '@/services/api';

export function Digest() {
  const dispatch = useAppDispatch();
  const { isDone } = useAppSelector(s => s.digest);
  const { data: digest, isLoading, isError } = useGetDigestQuery();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse rounded-2xl h-16" style={{ background: 'var(--bg-card)' }} />
        <div className="animate-pulse rounded-2xl h-48" style={{ background: 'var(--bg-card)' }} />
      </div>
    );
  }

  if (isError || !digest) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl" style={{ background: 'var(--accent-bg)' }}>
            <BookOpen size={18} style={{ color: 'var(--accent-text)' }} />
          </div>
          <div>
            <h1 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Daily Digest</h1>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Your daily briefing</p>
          </div>
        </div>
        <GlassCard>
          <div className="text-center py-12 space-y-3 p-6">
            <Zap size={32} style={{ color: 'var(--text-muted)' }} className="mx-auto" />
            <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
              No digest available yet
            </p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              The daily digest is generated once enough stories are collected
            </p>
          </div>
        </GlassCard>
      </div>
    );
  }

  const paragraphs = digest.summary.split('\n\n').filter(Boolean);
  const digestDate = new Date(digest.digestDate).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl" style={{ background: 'var(--accent-bg)' }}>
            <BookOpen size={18} style={{ color: 'var(--accent-text)' }} />
          </div>
          <div>
            <h1 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>One-Minute World</h1>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Calendar size={10} style={{ color: 'var(--text-muted)' }} />
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{digestDate}</p>
            </div>
          </div>
        </div>
        {isDone && (
          <span className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full"
            style={{ background: 'var(--success-bg)', color: 'var(--success-text)' }}
          >
            <CheckCircle size={12} />
            Caught up
          </span>
        )}
      </div>

      {digest.keyTopics && digest.keyTopics.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {digest.keyTopics.map(topic => (
            <span key={topic} className="text-[11px] px-2.5 py-1 rounded-full font-medium"
              style={{
                background: 'var(--accent-bg)',
                color: 'var(--accent-text)',
                border: '1px solid var(--border-primary)',
              }}
            >
              {topic}
            </span>
          ))}
        </div>
      )}

      <GlassCard>
        <div className="p-6 sm:p-8 space-y-5">
          {paragraphs.map((paragraph, i) => (
            <p key={i} className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              {paragraph}
            </p>
          ))}
        </div>
      </GlassCard>

      {!isDone && (
        <button
          onClick={() => dispatch(markDone())}
          className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl font-semibold text-sm transition-all shadow-lg hover:-translate-y-0.5 active:translate-y-0"
          style={{
            background: 'linear-gradient(135deg, var(--accent-solid), var(--accent-solid-hover))',
            color: 'var(--text-inverse)',
            boxShadow: '0 4px 20px rgba(217,119,6,0.3)',
          }}
        >
          <CheckCircle size={16} />
          {digest.closingLine || "You're caught up."}
        </button>
      )}

      <div className="flex items-center justify-center gap-1.5">
        <Sparkles size={10} style={{ color: 'var(--text-muted)' }} />
        <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
          {digest.clusterCount} stories · {digest.articleCount} articles analyzed
        </p>
      </div>
    </div>
  );
}
