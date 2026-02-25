import { useState } from 'react';
import { AlertTriangle, Eye, ExternalLink, Flame, Beaker } from 'lucide-react';
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
  const heatPct = Math.round((article.heatScore || 0) * 100);
  const substancePct = Math.round((article.substanceScore || 0) * 100);

  return (
    <a
      href={article.link}
      target="_blank"
      rel="noopener noreferrer"
      className="block py-3.5 border-b border-white/[0.04] last:border-0 group/article hover:bg-white/[0.02] -mx-2 px-2 rounded-lg transition-colors"
    >
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <Badge label={article.biasLabel} variant={article.biasLabel} />
          <span className="text-[11px] text-white/35">{article.sourceName}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-white/25">{timeAgo}</span>
          <ExternalLink size={10} className="text-white/20 group-hover/article:text-indigo-400/60 transition-colors" />
        </div>
      </div>
      <p className="text-sm text-white/80 font-medium leading-snug mb-1.5">{article.title}</p>
      <p className="text-xs text-white/40 line-clamp-2 leading-relaxed">{article.description}</p>
      {(heatPct > 0 || substancePct > 0) && (
        <div className="flex items-center gap-3 mt-2">
          <span className="flex items-center gap-1 text-[10px] text-orange-400/50">
            <Flame size={8} /> {heatPct}%
          </span>
          <span className="flex items-center gap-1 text-[10px] text-cyan-400/50">
            <Beaker size={8} /> {substancePct}%
          </span>
        </div>
      )}
    </a>
  );
}

function BiasColumn({
  title,
  colorClass,
  borderColor,
  emphasis,
  articles,
}: {
  title: string;
  colorClass: string;
  borderColor: string;
  emphasis: string;
  articles: Article[];
}) {
  return (
    <div className="flex-1 min-w-0">
      <div className={`text-center mb-4 pb-3 border-b ${borderColor}`}>
        <span className={`text-xs font-bold uppercase tracking-widest ${colorClass}`}>{title}</span>
        <span className="text-[10px] text-white/20 ml-2">({articles.length})</span>
      </div>
      <div className="mb-4 p-3 rounded-lg bg-white/[0.02] border border-white/[0.04]">
        <p className="text-sm text-white/60 italic leading-relaxed">"{emphasis}"</p>
      </div>
      <div>
        {articles.length > 0 ? (
          articles.map(a => <ArticleItem key={a.id} article={a} />)
        ) : (
          <p className="text-xs text-white/20 text-center py-6">No coverage from this perspective.</p>
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

  const tabs: { key: Tab; label: string; color: string; count: number }[] = [
    { key: 'left', label: 'Left', color: 'text-blue-400', count: leftArticles.length },
    { key: 'center', label: 'Center', color: 'text-purple-400', count: centerArticles.length },
    { key: 'right', label: 'Right', color: 'text-red-400', count: rightArticles.length },
  ];

  const activeArticles = activeTab === 'left' ? leftArticles : activeTab === 'right' ? rightArticles : centerArticles;
  const activeEmphasis = activeTab === 'left'
    ? cluster.biasAnalysis.leftEmphasizes
    : activeTab === 'right'
    ? cluster.biasAnalysis.rightEmphasizes
    : cluster.biasAnalysis.consistentAcrossAll;

  return (
    <div className="space-y-4">
      <GlassCard className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-1.5 rounded-lg bg-indigo-500/10">
            <Eye size={14} className="text-indigo-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white/90">Bias Mirror</h3>
            <p className="text-[10px] text-white/30">How different perspectives frame this story</p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.04]">
            <span className="text-[10px] text-white/30 uppercase tracking-wider font-medium">Consistent across all</span>
            <p className="text-sm text-white/70 mt-1 leading-relaxed">{cluster.biasAnalysis.consistentAcrossAll}</p>
          </div>
          <div className="flex items-start gap-2.5 p-3 rounded-lg bg-amber-500/[0.06] border border-amber-500/15">
            <AlertTriangle size={14} className="text-amber-400/70 shrink-0 mt-0.5" />
            <div>
              <span className="text-[10px] text-amber-400/80 font-semibold uppercase tracking-wider">What's missing</span>
              <p className="text-xs text-white/50 mt-1 leading-relaxed">{cluster.biasAnalysis.whatsMissing}</p>
            </div>
          </div>
        </div>
      </GlassCard>

      <div className="md:hidden">
        <div className="flex rounded-xl overflow-hidden border border-white/[0.07] mb-4 bg-white/[0.02]">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 py-2.5 text-sm font-medium transition-all ${
                activeTab === tab.key
                  ? 'bg-white/10 text-white shadow-inner'
                  : 'text-white/30 hover:text-white/50'
              }`}
            >
              <span className={activeTab === tab.key ? tab.color : ''}>{tab.label}</span>
              <span className="text-[10px] text-white/20 ml-1">({tab.count})</span>
            </button>
          ))}
        </div>
        <GlassCard className="p-5">
          <div className="mb-4 p-3 rounded-lg bg-white/[0.02] border border-white/[0.04]">
            <p className="text-sm text-white/60 italic leading-relaxed">"{activeEmphasis}"</p>
          </div>
          {activeArticles.length > 0 ? (
            activeArticles.map(a => <ArticleItem key={a.id} article={a} />)
          ) : (
            <p className="text-xs text-white/20 text-center py-6">No coverage from this perspective.</p>
          )}
        </GlassCard>
      </div>

      <div className="hidden md:flex gap-3">
        <GlassCard className="flex-1 p-5">
          <BiasColumn
            title="Left"
            colorClass="text-blue-400"
            borderColor="border-blue-500/20"
            emphasis={cluster.biasAnalysis.leftEmphasizes}
            articles={leftArticles}
          />
        </GlassCard>
        <GlassCard className="flex-1 p-5">
          <BiasColumn
            title="Center"
            colorClass="text-purple-400"
            borderColor="border-purple-500/20"
            emphasis={cluster.biasAnalysis.consistentAcrossAll}
            articles={centerArticles}
          />
        </GlassCard>
        <GlassCard className="flex-1 p-5">
          <BiasColumn
            title="Right"
            colorClass="text-red-400"
            borderColor="border-red-500/20"
            emphasis={cluster.biasAnalysis.rightEmphasizes}
            articles={rightArticles}
          />
        </GlassCard>
      </div>
    </div>
  );
}
