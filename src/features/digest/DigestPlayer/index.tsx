import { X, BookOpen, CheckCircle } from 'lucide-react';
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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <GlassCard className="w-full max-w-2xl max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <div className="flex items-center gap-2">
            <BookOpen size={18} className="text-indigo-400" />
            <h2 className="font-semibold text-white">One-Minute World</h2>
          </div>
          <button
            onClick={() => dispatch(closeDigest())}
            className="text-white/40 hover:text-white/80 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {digest.keyTopics && digest.keyTopics.length > 0 && (
            <div className="flex gap-2 flex-wrap mb-2">
              {digest.keyTopics.map(topic => (
                <span key={topic} className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {topic}
                </span>
              ))}
            </div>
          )}

          {paragraphs.map((paragraph, i) => (
            <p key={i} className="text-white/80 text-sm leading-relaxed">
              {paragraph}
            </p>
          ))}
        </div>

        <div className="p-5 border-t border-white/10">
          <button
            onClick={() => dispatch(markDone())}
            className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl font-semibold text-sm transition-all bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg"
          >
            <CheckCircle size={16} />
            {digest.closingLine || "You're caught up."}
          </button>
          {digest.clusterCount && (
            <p className="text-center text-white/30 text-xs mt-2">{digest.clusterCount} stories · {digest.articleCount} articles</p>
          )}
        </div>
      </GlassCard>
    </div>
  );
}
