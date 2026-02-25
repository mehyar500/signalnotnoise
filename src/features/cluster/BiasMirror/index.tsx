import { useState } from 'react';
import { AlertCircle, Eye } from 'lucide-react';
import { GlassCard } from '@/components/GlassCard';
import { Badge } from '@/components/Badge';
import { useTimeAgo } from '@/hooks/useTimeAgo';
import type { Cluster, Article } from '@/types';

interface BiasMirrorProps {
  cluster: Cluster;
}

type Tab = 'left' | 'center' | 'right';

function ArticleItem({ article }: { article: Article }) {
  const timeAgo = useTimeAgo(article.publishedAt);
  return (
    <div className="py-3 border-b border-white/5 last:border-0">
      <div className="flex items-center gap-2 mb-1">
        <Badge label={article.biasLabel} variant={article.biasLabel} />
        <span className="text-xs text-white/40">{article.sourceName} · {timeAgo}</span>
      </div>
      <p className="text-sm text-white/80 font-medium leading-snug">{article.title}</p>
      <p className="text-xs text-white/50 mt-1 line-clamp-2">{article.description}</p>
    </div>
  );
}

function BiasColumn({
  title,
  color,
  emphasis,
  articles,
}: {
  title: string;
  color: string;
  emphasis: string;
  articles: Article[];
}) {
  return (
    <div className="flex-1 min-w-0">
      <div className={`text-center mb-4 pb-3 border-b ${color}`}>
        <span className={`text-sm font-bold uppercase tracking-widest`}>{title}</span>
      </div>
      <p className="text-sm text-white/70 italic mb-4 leading-relaxed">"{emphasis}"</p>
      <div>
        {articles.length > 0 ? (
          articles.map(a => <ArticleItem key={a.id} article={a} />)
        ) : (
          <p className="text-xs text-white/30 text-center py-4">No articles from this perspective in this story yet.</p>
        )}
      </div>
    </div>
  );
}

export function BiasMirror({ cluster }: BiasMirrorProps) {
  const [activeTab, setActiveTab] = useState<Tab>('center');

  const leftArticles = cluster.articles.filter(a => a.biasLabel === 'left' || a.biasLabel === 'center-left');
  const centerArticles = cluster.articles.filter(a => a.biasLabel === 'center');
  const rightArticles = cluster.articles.filter(a => a.biasLabel === 'right' || a.biasLabel === 'center-right');

  const tabs: { key: Tab; label: string; color: string }[] = [
    { key: 'left', label: 'Left', color: 'text-blue-400' },
    { key: 'center', label: 'Center', color: 'text-purple-400' },
    { key: 'right', label: 'Right', color: 'text-red-400' },
  ];

  const activeArticles = activeTab === 'left' ? leftArticles : activeTab === 'right' ? rightArticles : centerArticles;
  const activeEmphasis = activeTab === 'left'
    ? cluster.biasAnalysis.leftEmphasizes
    : activeTab === 'right'
    ? cluster.biasAnalysis.rightEmphasizes
    : cluster.biasAnalysis.consistentAcrossAll;

  return (
    <div className="space-y-6">
      <GlassCard className="p-5">
        <div className="flex items-center gap-2 mb-3">
          <Eye size={16} className="text-indigo-400" />
          <h3 className="text-sm font-semibold text-white/90 uppercase tracking-wider">Bias Mirror</h3>
        </div>
        <p className="text-xs text-white/50 mb-4">How different perspectives frame this story</p>

        <div className="space-y-3">
          <div>
            <span className="text-xs text-white/40 uppercase tracking-wider">Consistent across all</span>
            <p className="text-sm text-white/80 mt-1">{cluster.biasAnalysis.consistentAcrossAll}</p>
          </div>
          <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <AlertCircle size={14} className="text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="text-xs text-amber-400 font-medium">What's missing</span>
              <p className="text-xs text-white/60 mt-0.5">{cluster.biasAnalysis.whatsMissing}</p>
            </div>
          </div>
        </div>
      </GlassCard>

      <div className="md:hidden">
        <div className="flex rounded-xl overflow-hidden border border-white/10 mb-4">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? 'bg-white/10 text-white'
                  : 'text-white/40 hover:text-white/60'
              }`}
            >
              <span className={tab.color}>{tab.label}</span>
            </button>
          ))}
        </div>
        <GlassCard className="p-5">
          <p className="text-sm text-white/70 italic mb-4">"{activeEmphasis}"</p>
          {activeArticles.length > 0 ? (
            activeArticles.map(a => <ArticleItem key={a.id} article={a} />)
          ) : (
            <p className="text-xs text-white/30 text-center py-4">No articles from this perspective yet.</p>
          )}
        </GlassCard>
      </div>

      <div className="hidden md:flex gap-4">
        <GlassCard className="flex-1 p-5">
          <BiasColumn
            title="Left"
            color="border-blue-500/30 text-blue-400"
            emphasis={cluster.biasAnalysis.leftEmphasizes}
            articles={leftArticles}
          />
        </GlassCard>
        <GlassCard className="flex-1 p-5">
          <BiasColumn
            title="Center"
            color="border-purple-500/30 text-purple-400"
            emphasis={cluster.biasAnalysis.consistentAcrossAll}
            articles={centerArticles}
          />
        </GlassCard>
        <GlassCard className="flex-1 p-5">
          <BiasColumn
            title="Right"
            color="border-red-500/30 text-red-400"
            emphasis={cluster.biasAnalysis.rightEmphasizes}
            articles={rightArticles}
          />
        </GlassCard>
      </div>
    </div>
  );
}
