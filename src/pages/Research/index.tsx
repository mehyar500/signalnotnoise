import { BookMarked, Plus, Sparkles } from 'lucide-react';
import { GlassCard } from '@/components/GlassCard';

export function Research() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Research</h1>
          <p className="text-white/40 text-sm mt-1">Your collections and saved stories</p>
        </div>
        <button className="flex items-center gap-1.5 text-sm text-indigo-400 hover:text-indigo-300 transition-colors font-medium">
          <Plus size={14} />
          New collection
        </button>
      </div>

      <GlassCard className="p-8 flex flex-col items-center text-center">
        <div className="p-4 rounded-2xl bg-indigo-500/10 mb-4">
          <BookMarked size={32} className="text-indigo-400" />
        </div>
        <h3 className="font-semibold text-white mb-2">No collections yet</h3>
        <p className="text-white/50 text-sm max-w-xs leading-relaxed">
          Save stories from the feed to track them. You'll get notified when a new source covers the story or framing shifts significantly.
        </p>
        <div className="mt-6 flex items-center gap-2 text-xs text-indigo-400/70">
          <Sparkles size={12} />
          <span>Collections keep your research organized</span>
        </div>
      </GlassCard>
    </div>
  );
}
