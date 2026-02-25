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
      className="block py-3.5 last:border-0 group/article -mx-2 px-2 rounded-lg transition-colors"
      style={{
        borderBottom: '1px solid var(--border-subtle)',
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--bg-inset)'; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
    >
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <Badge label={article.biasLabel} variant={article.biasLabel} />
          <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{article.sourceName}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{timeAgo}</span>
          <ExternalLink size={10} className="transition-colors" style={{ color: 'var(--text-faint)' }} />
        </div>
      </div>
      <div className="flex gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium leading-snug mb-1.5" style={{ color: 'var(--text-secondary)' }}>{article.title}</p>
          <p className="text-xs line-clamp-2 leading-relaxed" style={{ color: 'var(--text-tertiary)' }}>{article.description}</p>
          {(heatPct > 0 || substancePct > 0) && (
            <div className="flex items-center gap-3 mt-2">
              <span className="flex items-center gap-1 text-[10px]" style={{ color: 'var(--heat-text)', opacity: 0.7 }}>
                <Flame size={8} /> {heatPct}%
              </span>
              <span className="flex items-center gap-1 text-[10px]" style={{ color: 'var(--substance-text)', opacity: 0.7 }}>
                <Beaker size={8} /> {substancePct}%
              </span>
            </div>
          )}
        </div>
        {article.imageUrl && (
          <div className="shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden" style={{ background: 'var(--bg-inset)' }}>
            <img
              src={article.imageUrl}
              alt=""
              className="w-full h-full object-cover"
              loading="lazy"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          </div>
        )}
      </div>
    </a>
  );
}

function BiasColumn({
  title,
  biasKey,
  emphasis,
  articles,
}: {
  title: string;
  biasKey: 'left' | 'center' | 'right';
  emphasis: string;
  articles: Article[];
}) {
  const colorVar = `var(--bias-${biasKey})`;
  const borderVar = `var(--bias-${biasKey}-border)`;

  return (
    <div className="flex-1 min-w-0">
      <div className="text-center mb-4 pb-3" style={{ borderBottom: `1px solid ${borderVar}` }}>
        <span className="text-xs font-bold uppercase tracking-widest" style={{ color: colorVar }}>{title}</span>
        <span className="text-[10px] ml-2" style={{ color: 'var(--text-faint)' }}>({articles.length})</span>
      </div>
      <div className="mb-4 p-3 rounded-lg" style={{ background: 'var(--bg-inset)', border: '1px solid var(--border-subtle)' }}>
        <p className="text-sm italic leading-relaxed" style={{ color: 'var(--text-tertiary)' }}>"{emphasis}"</p>
      </div>
      <div>
        {articles.length > 0 ? (
          articles.map(a => <ArticleItem key={a.id} article={a} />)
        ) : (
          <p className="text-xs text-center py-6" style={{ color: 'var(--text-faint)' }}>No coverage from this perspective.</p>
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

  const tabs: { key: Tab; label: string; colorVar: string; count: number }[] = [
    { key: 'left', label: 'Left', colorVar: 'var(--bias-left)', count: leftArticles.length },
    { key: 'center', label: 'Center', colorVar: 'var(--bias-center)', count: centerArticles.length },
    { key: 'right', label: 'Right', colorVar: 'var(--bias-right)', count: rightArticles.length },
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
          <div className="p-1.5 rounded-lg" style={{ background: 'var(--accent-bg)' }}>
            <Eye size={14} style={{ color: 'var(--accent-text)' }} />
          </div>
          <div>
            <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Bias Mirror</h3>
            <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>How different perspectives frame this story</p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="p-3 rounded-lg" style={{ background: 'var(--bg-inset)', border: '1px solid var(--border-subtle)' }}>
            <span className="text-[10px] uppercase tracking-wider font-medium" style={{ color: 'var(--text-muted)' }}>Consistent across all</span>
            <p className="text-sm mt-1 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{cluster.biasAnalysis.consistentAcrossAll}</p>
          </div>
          <div className="flex items-start gap-2.5 p-3 rounded-lg" style={{ background: 'var(--warning-bg)', border: '1px solid var(--warning-border)' }}>
            <AlertTriangle size={14} className="shrink-0 mt-0.5" style={{ color: 'var(--warning-text)', opacity: 0.7 }} />
            <div>
              <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--warning-text)' }}>What's missing</span>
              <p className="text-xs mt-1 leading-relaxed" style={{ color: 'var(--text-tertiary)' }}>{cluster.biasAnalysis.whatsMissing}</p>
            </div>
          </div>
        </div>
      </GlassCard>

      <div className="md:hidden">
        <div className="flex rounded-xl overflow-hidden mb-4" style={{ border: '1px solid var(--border-primary)', background: 'var(--bg-inset)' }}>
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className="flex-1 py-2.5 text-sm font-medium transition-all"
              style={{
                background: activeTab === tab.key ? 'var(--bg-elevated)' : 'transparent',
                color: activeTab === tab.key ? 'var(--text-primary)' : 'var(--text-muted)',
              }}
            >
              <span style={{ color: activeTab === tab.key ? tab.colorVar : undefined }}>{tab.label}</span>
              <span className="text-[10px] ml-1" style={{ color: 'var(--text-faint)' }}>({tab.count})</span>
            </button>
          ))}
        </div>
        <GlassCard className="p-5">
          <div className="mb-4 p-3 rounded-lg" style={{ background: 'var(--bg-inset)', border: '1px solid var(--border-subtle)' }}>
            <p className="text-sm italic leading-relaxed" style={{ color: 'var(--text-tertiary)' }}>"{activeEmphasis}"</p>
          </div>
          {activeArticles.length > 0 ? (
            activeArticles.map(a => <ArticleItem key={a.id} article={a} />)
          ) : (
            <p className="text-xs text-center py-6" style={{ color: 'var(--text-faint)' }}>No coverage from this perspective.</p>
          )}
        </GlassCard>
      </div>

      <div className="hidden md:flex gap-3">
        <GlassCard className="flex-1 p-5">
          <BiasColumn
            title="Left-leaning"
            biasKey="left"
            emphasis={cluster.biasAnalysis.leftEmphasizes}
            articles={leftArticles}
          />
        </GlassCard>
        <GlassCard className="flex-1 p-5">
          <BiasColumn
            title="Center"
            biasKey="center"
            emphasis={cluster.biasAnalysis.consistentAcrossAll}
            articles={centerArticles}
          />
        </GlassCard>
        <GlassCard className="flex-1 p-5">
          <BiasColumn
            title="Right-leaning"
            biasKey="right"
            emphasis={cluster.biasAnalysis.rightEmphasizes}
            articles={rightArticles}
          />
        </GlassCard>
      </div>
    </div>
  );
}
