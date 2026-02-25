import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, Plus, Trash2, RefreshCw, Cpu, CheckCircle, XCircle, Loader2, ChevronDown, ChevronUp, Rss, Database, Upload } from 'lucide-react';
import { GlassCard } from '@/components/GlassCard';
import { useAppSelector } from '@/app/hooks';
import {
  useGetAdminSourcesQuery,
  useGetStatsQuery,
  useAddSourceMutation,
  useUpdateSourceMutation,
  useDeleteSourceMutation,
  useValidateFeedMutation,
  useTriggerSyncMutation,
  useTriggerEnrichMutation,
  useTriggerDigestMutation,
} from '@/services/api';

const BIAS_OPTIONS = ['left', 'center-left', 'center', 'center-right', 'right', 'international'];

export function Admin() {
  const navigate = useNavigate();
  const { user } = useAppSelector(s => s.auth);

  if (!user?.isAdmin) {
    return (
      <div className="text-center py-20">
        <Settings size={32} style={{ color: 'var(--text-muted)' }} className="mx-auto mb-3" />
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Admin access required</p>
        <button onClick={() => navigate('/')} className="mt-4 text-xs underline" style={{ color: 'var(--accent-text)' }}>
          Go back
        </button>
      </div>
    );
  }

  return <AdminDashboard />;
}

function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'sources' | 'pipeline'>('sources');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl" style={{ background: 'rgba(245,158,11,0.1)' }}>
            <Settings size={18} style={{ color: '#f59e0b' }} />
          </div>
          <div>
            <h1 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Admin</h1>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Manage sources and pipeline</p>
          </div>
        </div>
      </div>

      <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-primary)' }}>
        {(['sources', 'pipeline'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all capitalize"
            style={{
              color: activeTab === tab ? 'var(--text-primary)' : 'var(--text-muted)',
              background: activeTab === tab ? 'var(--bg-elevated)' : 'transparent',
            }}
          >
            {tab === 'sources' ? 'Sources' : 'Pipeline'}
          </button>
        ))}
      </div>

      {activeTab === 'sources' && <SourcesTab />}
      {activeTab === 'pipeline' && <PipelineTab />}
    </div>
  );
}

function PipelineTab() {
  const { data: stats } = useGetStatsQuery(undefined, { pollingInterval: 10000 });
  const [triggerSync, { isLoading: isSyncing }] = useTriggerSyncMutation();
  const [triggerEnrich, { isLoading: isEnriching }] = useTriggerEnrichMutation();
  const [triggerDigest, { isLoading: isDigesting }] = useTriggerDigestMutation();
  const [lastResult, setLastResult] = useState<string | null>(null);

  async function runAction(action: () => Promise<unknown>, label: string) {
    try {
      const result = await action();
      setLastResult(`${label}: ${JSON.stringify(result)}`);
    } catch {
      setLastResult(`${label}: failed`);
    }
  }

  return (
    <div className="space-y-4">
      {stats && (
        <GlassCard>
          <div className="p-5 grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatItem label="Active Sources" value={stats.activeSources} />
            <StatItem label="Total Articles" value={stats.totalArticles.toLocaleString()} />
            <StatItem label="Active Clusters" value={stats.activeClusters.toLocaleString()} />
            <StatItem label="AI Available" value={stats.aiAvailable ? 'Yes' : 'No'} icon={stats.aiAvailable ? <Cpu size={12} className="text-emerald-400" /> : undefined} />
          </div>
        </GlassCard>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <GlassCard>
          <button
            onClick={() => runAction(() => triggerSync().unwrap(), 'Sync')}
            disabled={isSyncing}
            className="w-full p-4 text-left space-y-2"
          >
            <div className="flex items-center gap-2">
              <RefreshCw size={16} className={isSyncing ? 'animate-spin' : ''} style={{ color: '#6366f1' }} />
              <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Sync Feeds</span>
            </div>
            <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Fetch all RSS feeds and cluster articles</p>
          </button>
        </GlassCard>
        <GlassCard>
          <button
            onClick={() => runAction(() => triggerEnrich().unwrap(), 'Enrich')}
            disabled={isEnriching}
            className="w-full p-4 text-left space-y-2"
          >
            <div className="flex items-center gap-2">
              <Cpu size={16} className={isEnriching ? 'animate-pulse' : ''} style={{ color: '#8b5cf6' }} />
              <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>AI Enrich</span>
            </div>
            <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Run AI summaries and bias analysis</p>
          </button>
        </GlassCard>
        <GlassCard>
          <button
            onClick={() => runAction(() => triggerDigest().unwrap(), 'Digest')}
            disabled={isDigesting}
            className="w-full p-4 text-left space-y-2"
          >
            <div className="flex items-center gap-2">
              <Database size={16} className={isDigesting ? 'animate-pulse' : ''} style={{ color: '#f59e0b' }} />
              <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Generate Digest</span>
            </div>
            <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Create today's daily briefing</p>
          </button>
        </GlassCard>
      </div>

      {lastResult && (
        <GlassCard>
          <div className="p-4">
            <p className="text-xs font-mono break-all" style={{ color: 'var(--text-tertiary)' }}>{lastResult}</p>
          </div>
        </GlassCard>
      )}
    </div>
  );
}

function StatItem({ label, value, icon }: { label: string; value: string | number; icon?: React.ReactNode }) {
  return (
    <div className="text-center space-y-1">
      <div className="flex items-center justify-center gap-1">
        {icon}
        <p className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{value}</p>
      </div>
      <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{label}</p>
    </div>
  );
}

function SourcesTab() {
  const { data, isLoading } = useGetAdminSourcesQuery();
  const [showAdd, setShowAdd] = useState(false);
  const [filter, setFilter] = useState('');
  const [biasFilter, setBiasFilter] = useState('all');

  const sources = data?.sources || [];
  const filtered = sources.filter(s => {
    const matchesText = !filter || s.name.toLowerCase().includes(filter.toLowerCase()) || s.feed_url.toLowerCase().includes(filter.toLowerCase());
    const matchesBias = biasFilter === 'all' || s.bias_label === biasFilter;
    return matchesText && matchesBias;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <input
            type="text"
            value={filter}
            onChange={e => setFilter(e.target.value)}
            placeholder="Filter sources..."
            className="flex-1 min-w-[200px] px-3 py-2 rounded-lg text-sm outline-none transition-colors"
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-primary)',
              color: 'var(--text-primary)',
            }}
          />
          <select
            value={biasFilter}
            onChange={e => setBiasFilter(e.target.value)}
            className="px-3 py-2 rounded-lg text-sm outline-none cursor-pointer"
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-primary)',
              color: 'var(--text-primary)',
            }}
          >
            <option value="all">All bias</option>
            {BIAS_OPTIONS.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all"
          style={{
            background: showAdd ? 'rgba(239,68,68,0.1)' : 'rgba(99,102,241,0.1)',
            color: showAdd ? '#ef4444' : '#6366f1',
          }}
        >
          {showAdd ? <XCircle size={14} /> : <Plus size={14} />}
          {showAdd ? 'Cancel' : 'Add Source'}
        </button>
      </div>

      {showAdd && <AddSourceForm onDone={() => setShowAdd(false)} />}

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map(i => <div key={i} className="animate-pulse rounded-xl h-14" style={{ background: 'var(--bg-card)' }} />)}
        </div>
      ) : (
        <div className="space-y-1">
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {filtered.length} of {sources.length} sources
          </p>
          {filtered.map(source => (
            <SourceRow key={source.id} source={source} />
          ))}
        </div>
      )}
    </div>
  );
}

function AddSourceForm({ onDone }: { onDone: () => void }) {
  const [name, setName] = useState('');
  const [feedUrl, setFeedUrl] = useState('');
  const [biasLabel, setBiasLabel] = useState('center');
  const [subSource, setSubSource] = useState('');
  const [addSource, { isLoading }] = useAddSourceMutation();
  const [validateFeed, { isLoading: isValidating }] = useValidateFeedMutation();
  const [status, setStatus] = useState<{ type: 'success' | 'error' | 'info'; msg: string } | null>(null);

  async function handleValidate() {
    if (!feedUrl) return;
    setStatus({ type: 'info', msg: 'Validating feed...' });
    try {
      const result = await validateFeed({ feedUrl }).unwrap();
      if (result.valid) {
        setStatus({ type: 'success', msg: `Valid feed: "${result.title}" with ${result.itemCount} items` });
        if (!name && result.title) setName(result.title);
      } else {
        setStatus({ type: 'error', msg: `Invalid feed: ${result.error}` });
      }
    } catch {
      setStatus({ type: 'error', msg: 'Validation request failed' });
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !feedUrl) return;
    setStatus({ type: 'info', msg: 'Adding source...' });
    try {
      const result = await addSource({ name, feedUrl, biasLabel, subSource: subSource || undefined }).unwrap();
      setStatus({ type: 'success', msg: `Added "${result.source.name}" (${result.validation.itemCount} items)` });
      setName(''); setFeedUrl(''); setSubSource('');
      setTimeout(onDone, 1500);
    } catch (err: unknown) {
      const message = (err as { data?: { error?: string } })?.data?.error || 'Failed to add source';
      setStatus({ type: 'error', msg: message });
    }
  }

  return (
    <GlassCard>
      <form onSubmit={handleSubmit} className="p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Feed URL</label>
            <div className="flex gap-2">
              <input
                type="url"
                value={feedUrl}
                onChange={e => setFeedUrl(e.target.value)}
                placeholder="https://example.com/rss"
                required
                className="flex-1 px-3 py-2 rounded-lg text-sm outline-none"
                style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)' }}
              />
              <button
                type="button"
                onClick={handleValidate}
                disabled={!feedUrl || isValidating}
                className="px-3 py-2 rounded-lg text-xs font-medium transition-all disabled:opacity-40"
                style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}
              >
                {isValidating ? <Loader2 size={12} className="animate-spin" /> : <Rss size={12} />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Source Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Reuters World"
              required
              className="w-full px-3 py-2 rounded-lg text-sm outline-none"
              style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)' }}
            />
          </div>
          <div>
            <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Bias Label</label>
            <select
              value={biasLabel}
              onChange={e => setBiasLabel(e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-sm outline-none cursor-pointer"
              style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)' }}
            >
              {BIAS_OPTIONS.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Sub-source (optional)</label>
            <input
              type="text"
              value={subSource}
              onChange={e => setSubSource(e.target.value)}
              placeholder="e.g. World, Politics"
              className="w-full px-3 py-2 rounded-lg text-sm outline-none"
              style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)' }}
            />
          </div>
        </div>

        {status && (
          <div className="px-3 py-2 rounded-lg text-xs" style={{
            background: status.type === 'success' ? 'rgba(52,211,153,0.1)' : status.type === 'error' ? 'rgba(239,68,68,0.1)' : 'rgba(99,102,241,0.1)',
            color: status.type === 'success' ? '#34d399' : status.type === 'error' ? '#ef4444' : '#6366f1',
            border: `1px solid ${status.type === 'success' ? 'rgba(52,211,153,0.2)' : status.type === 'error' ? 'rgba(239,68,68,0.2)' : 'rgba(99,102,241,0.2)'}`,
          }}>
            {status.msg}
          </div>
        )}

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onDone}
            className="px-4 py-2 rounded-lg text-sm transition-all"
            style={{ color: 'var(--text-muted)' }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading || !name || !feedUrl}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-40 text-white"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
          >
            {isLoading ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
            Add Source
          </button>
        </div>
      </form>
    </GlassCard>
  );
}

function SourceRow({ source }: { source: { id: string; name: string; sub_source: string | null; feed_url: string; bias_label: string; is_active: boolean; last_fetched_at: string | null; created_at: string } }) {
  const [expanded, setExpanded] = useState(false);
  const [updateSource] = useUpdateSourceMutation();
  const [deleteSource] = useDeleteSourceMutation();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const biasColor: Record<string, string> = {
    left: '#3b82f6', 'center-left': '#6366f1', center: '#8b5cf6',
    'center-right': '#f97316', right: '#ef4444', international: '#10b981',
  };

  return (
    <GlassCard>
      <div className="px-4 py-3">
        <button onClick={() => setExpanded(!expanded)} className="w-full flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: source.is_active ? '#34d399' : '#ef4444' }} />
            <span className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{source.name}</span>
            {source.sub_source && (
              <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}>
                {source.sub_source}
              </span>
            )}
            <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium" style={{ backgroundColor: `${biasColor[source.bias_label] || '#8b5cf6'}20`, color: biasColor[source.bias_label] || '#8b5cf6' }}>
              {source.bias_label}
            </span>
          </div>
          {expanded ? <ChevronUp size={14} style={{ color: 'var(--text-muted)' }} /> : <ChevronDown size={14} style={{ color: 'var(--text-muted)' }} />}
        </button>

        {expanded && (
          <div className="mt-3 pt-3 space-y-3" style={{ borderTop: '1px solid var(--border-primary)' }}>
            <div className="text-xs break-all" style={{ color: 'var(--text-tertiary)' }}>
              {source.feed_url}
            </div>
            <div className="flex items-center gap-4 text-[10px]" style={{ color: 'var(--text-muted)' }}>
              <span>Added: {new Date(source.created_at).toLocaleDateString()}</span>
              {source.last_fetched_at && <span>Last fetched: {new Date(source.last_fetched_at).toLocaleString()}</span>}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => updateSource({ id: source.id, isActive: !source.is_active })}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                style={{
                  background: source.is_active ? 'rgba(239,68,68,0.1)' : 'rgba(52,211,153,0.1)',
                  color: source.is_active ? '#ef4444' : '#34d399',
                }}
              >
                {source.is_active ? <XCircle size={11} /> : <CheckCircle size={11} />}
                {source.is_active ? 'Disable' : 'Enable'}
              </button>
              {!confirmDelete ? (
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                  style={{ background: 'rgba(239,68,68,0.08)', color: '#ef4444' }}
                >
                  <Trash2 size={11} />
                  Delete
                </button>
              ) : (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => deleteSource(source.id)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-600 text-white"
                  >
                    Confirm
                  </button>
                  <button
                    onClick={() => setConfirmDelete(false)}
                    className="px-3 py-1.5 rounded-lg text-xs"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </GlassCard>
  );
}
