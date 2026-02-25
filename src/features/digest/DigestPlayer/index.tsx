import { X, BookOpen, CheckCircle, Sparkles } from 'lucide-react';
import { useAppDispatch } from '@/app/hooks';
import { closeDigest, markDone } from '@/app/digestSlice';
import { useGetDigestQuery } from '@/services/api';

export function DigestPlayer() {
  const dispatch = useAppDispatch();
  const { data: digest } = useGetDigestQuery();

  if (!digest) return null;

  const paragraphs = digest.summary.split('\n\n').filter(Boolean);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 backdrop-blur-md animate-fade-in" style={{ background: 'var(--bg-overlay)' }}>
      <div
        className="w-full max-w-2xl max-h-[85vh] flex flex-col rounded-2xl border backdrop-blur-2xl animate-slide-up"
        style={{ background: 'var(--bg-modal)', borderColor: 'var(--border-primary)', boxShadow: 'var(--shadow-elevated)' }}
      >
        <div className="flex items-center justify-between p-5" style={{ borderBottom: '1px solid var(--border-primary)' }}>
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg" style={{ background: 'var(--accent-bg)' }}>
              <BookOpen size={16} style={{ color: 'var(--accent-text)' }} />
            </div>
            <div>
              <h2 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>One-Minute World</h2>
              <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>Your daily briefing</p>
            </div>
          </div>
          <button
            onClick={() => dispatch(closeDigest())}
            className="p-1.5 rounded-lg transition-all"
            style={{ color: 'var(--text-muted)' }}
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {digest.keyTopics && digest.keyTopics.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {digest.keyTopics.map(topic => (
                <span key={topic} className="text-[11px] px-2.5 py-1 rounded-full font-medium"
                  style={{ background: 'var(--accent-bg)', color: 'var(--accent-text)', border: '1px solid var(--border-primary)' }}
                >
                  {topic}
                </span>
              ))}
            </div>
          )}

          {paragraphs.map((paragraph, i) => (
            <p key={i} className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              {paragraph}
            </p>
          ))}
        </div>

        <div className="p-5" style={{ borderTop: '1px solid var(--border-primary)' }}>
          <button
            onClick={() => dispatch(markDone())}
            className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl font-semibold text-sm transition-all shadow-lg hover:-translate-y-0.5 active:translate-y-0"
            style={{ background: 'linear-gradient(135deg, var(--accent-solid), var(--accent-solid-hover))', color: 'var(--text-inverse)', boxShadow: '0 4px 20px rgba(217,119,6,0.25)' }}
          >
            <CheckCircle size={16} />
            {digest.closingLine || "You're caught up."}
          </button>
          {digest.clusterCount && (
            <div className="flex items-center justify-center gap-1.5 mt-3">
              <Sparkles size={10} style={{ color: 'var(--text-muted)' }} />
              <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{digest.clusterCount} stories · {digest.articleCount} articles analyzed</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
