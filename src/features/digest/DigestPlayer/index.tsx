import { X, BookOpen, CheckCircle, Sparkles } from 'lucide-react';
import { GlassCard } from '@/components/GlassCard';
import { useAppDispatch } from '@/app/hooks';
import { closeDigest, markDone } from '@/app/digestSlice';
import { useGetDigestQuery } from '@/services/api';

export function DigestPlayer() {
  const dispatch = useAppDispatch();
  const { data: digest } = useGetDigestQuery();

  if (!digest) return null;

  const paragraphs = digest.summary.split('\n\n').filter(Boolean);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-2xl max-h-[85vh] flex flex-col rounded-2xl border border-white/[0.08] bg-[#0f172a]/95 backdrop-blur-2xl shadow-2xl shadow-indigo-500/10 animate-slide-up">
        <div className="flex items-center justify-between p-5 border-b border-white/[0.06]">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-indigo-500/15">
              <BookOpen size={16} className="text-indigo-400" />
            </div>
            <div>
              <h2 className="font-semibold text-white text-sm">One-Minute World</h2>
              <p className="text-[10px] text-white/30 mt-0.5">Your daily briefing</p>
            </div>
          </div>
          <button
            onClick={() => dispatch(closeDigest())}
            className="p-1.5 rounded-lg text-white/30 hover:text-white/70 hover:bg-white/5 transition-all"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {digest.keyTopics && digest.keyTopics.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {digest.keyTopics.map(topic => (
                <span key={topic} className="text-[11px] px-2.5 py-1 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/20 font-medium">
                  {topic}
                </span>
              ))}
            </div>
          )}

          {paragraphs.map((paragraph, i) => (
            <p key={i} className="text-white/75 text-sm leading-relaxed">
              {paragraph}
            </p>
          ))}
        </div>

        <div className="p-5 border-t border-white/[0.06]">
          <button
            onClick={() => dispatch(markDone())}
            className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl font-semibold text-sm transition-all bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 hover:-translate-y-0.5 active:translate-y-0"
          >
            <CheckCircle size={16} />
            {digest.closingLine || "You're caught up."}
          </button>
          {digest.clusterCount && (
            <div className="flex items-center justify-center gap-1.5 mt-3">
              <Sparkles size={10} className="text-white/20" />
              <p className="text-white/25 text-[11px]">{digest.clusterCount} stories · {digest.articleCount} articles analyzed</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
