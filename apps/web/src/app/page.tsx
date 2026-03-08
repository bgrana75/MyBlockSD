'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import AddressSearch from '@/components/AddressSearch';
import BriefingTab from '@/components/BriefingTab';
import RightNowTab from '@/components/RightNowTab';
import ChatPanel from '@/components/ChatPanel';
import { getBriefing, getStatus } from '@/lib/api';

const Map = dynamic(() => import('@/components/Map'), { ssr: false });

interface BriefingData {
  location: {
    display: string;
    lat: number;
    lng: number;
    neighborhood: string;
    sdpdNeighborhood: string | null;
    zip: string | null;
    councilDistrict: {
      district: number;
      member: string;
      title: string;
      budget?: {
        totalBudget: number;
        fiscalYear: number;
      };
    } | null;
  };
  datasets: {
    getItDone311: {
      items: any[];
      stats: any;
    };
    permits: {
      items: any[];
      stats: any;
    };
  };
  civic?: {
    libraries: any[];
    fireStations: any[];
    recCenters?: any[];
  };
  fireIncidents?: {
    total: number;
    byCategory: { name: string; count: number }[];
    recent: any[];
  };
  trafficCollisions?: {
    total: number;
    totalInjured: number;
    totalKilled: number;
    hitAndRun: number;
    byChargeType: { name: string; count: number }[];
    recent: any[];
  };
  streetSweeping?: {
    found: boolean;
    schedule: string;
    isPosted: boolean;
    segment: any;
    nearbySegments: any[];
  };
}

export default function Home() {
  const [briefing, setBriefing] = useState<BriefingData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [agentAvailable, setAgentAvailable] = useState(false);
  const [searchedAddress, setSearchedAddress] = useState('');
  const [chatOpen, setChatOpen] = useState(false);
  const [detailModal, setDetailModal] = useState<'collisions' | 'fire' | null>(null);

  useEffect(() => {
    getStatus().then((s) => setAgentAvailable(s.agentAvailable)).catch(() => {});
  }, []);

  async function handleSearch(address: string) {
    setLoading(true);
    setError(null);
    setSearchedAddress(address);
    try {
      const data = await getBriefing(address);
      setBriefing(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }

  const loc = briefing?.location;
  const center: [number, number] = loc ? [loc.lat, loc.lng] : [32.7157, -117.1611];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-surface/80 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-[1400px] mx-auto px-4 lg:px-6 py-3 flex flex-col sm:flex-row items-center gap-3">
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4.5 w-4.5 text-white" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
            </div>
            <h1 className="text-base font-bold gradient-text">My Block SD</h1>
          </div>
          <AddressSearch onSearch={handleSearch} isLoading={loading} />
          {loc && (
            <div className="hidden sm:flex items-center gap-2 text-xs text-muted shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-success pulse-dot" />
              <span>{loc.neighborhood}</span>
            </div>
          )}
        </div>
      </header>

      {/* Error */}
      {error && (
        <div className="max-w-[1400px] mx-auto px-4 lg:px-6 mt-4">
          <div className="bg-danger/10 border border-danger/20 text-danger px-4 py-3 rounded-xl text-sm flex items-center gap-2 animate-fade-in">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
        </div>
      )}

      {/* Landing state */}
      {!briefing && !loading && (
        <div className="flex items-center justify-center" style={{ height: 'calc(100vh - 64px)' }}>
          <div className="text-center max-w-md px-4 animate-fade-in">
            <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-accent/20 rounded-2xl flex items-center justify-center mx-auto mb-6 glow-primary">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary-light" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold gradient-text mb-3">Know Your Block</h2>
            <p className="text-muted text-sm leading-relaxed mb-8">
              Enter any San Diego address to see 311 reports, development permits,
              fire incidents, council district info, and live police dispatch.
            </p>
            <div className="grid grid-cols-4 gap-3">
              {[
                { label: '311 Reports', icon: '📋', color: 'from-primary/20 to-primary/5' },
                { label: 'Permits', icon: '🏗️', color: 'from-success/20 to-success/5' },
                { label: 'Collisions', icon: '🚗', color: 'from-danger/20 to-danger/5' },
                { label: 'Sweeping', icon: '🧹', color: 'from-warning/20 to-warning/5' },
              ].map((item) => (
                <div key={item.label} className={`bg-gradient-to-b ${item.color} rounded-xl p-3 border border-border`}>
                  <div className="text-xl mb-1">{item.icon}</div>
                  <div className="text-[10px] text-muted font-medium">{item.label}</div>
                </div>
              ))}
            </div>
            <p className="text-[11px] text-muted/40 mt-8">
              Powered by City of San Diego Open Data + SDPD Online
            </p>
          </div>
        </div>
      )}

      {/* Loading shimmer */}
      {loading && !briefing && (
        <div className="max-w-[1400px] mx-auto px-4 lg:px-6 py-4 space-y-3">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[1,2,3,4].map(i => (
              <div key={i} className="h-24 rounded-xl shimmer" />
            ))}
          </div>
          <div className="h-[300px] sm:h-[400px] rounded-xl shimmer" />
          <div className="h-[300px] rounded-xl shimmer" />
        </div>
      )}

      {/* Main dashboard */}
      {briefing && (
        <div className="max-w-[1400px] mx-auto px-4 lg:px-6 py-4 space-y-4">
          {/* Location bar */}
          {loc && (
            <div className="flex items-center justify-between animate-fade-in">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-bold text-foreground">{loc.neighborhood}</h2>
                <span className="text-xs text-muted hidden sm:inline">{loc.display?.split(',').slice(0, 2).join(',')}</span>
              </div>
              <div className="flex items-center gap-2">
                {loc.zip && (
                  <span className="text-xs text-muted bg-surface-alt px-2.5 py-1 rounded-lg border border-border font-mono">{loc.zip}</span>
                )}
                <a
                  href="https://getitdone.sandiego.gov"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-gradient-to-r from-primary to-accent text-white hover:opacity-90 transition-opacity flex items-center gap-1.5"
                >
                  <span>📢</span> Report to Get It Done!
                </a>
              </div>
            </div>
          )}

          {/* Stats ribbon */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard
              label="311 Reports"
              value={briefing.datasets.getItDone311.stats?.total || 0}
              icon="📋"
              color="primary"
              subtext={`${briefing.datasets.getItDone311.stats?.open || 0} open`}
              delay={0}
            />
            <StatCard
              label="Permits"
              value={briefing.datasets.permits.stats?.total || 0}
              icon="🏗️"
              color="success"
              subtext={`${briefing.datasets.permits.stats?.byType?.[0]?.name || 'Active'}`}
              delay={1}
            />
            <StatCard
              label="Collisions"
              value={briefing.trafficCollisions?.total || 0}
              icon="🚗"
              color="danger"
              subtext={`${briefing.trafficCollisions?.totalInjured || 0} injured · 2yr`}
              delay={2}
              onDetails={() => setDetailModal('collisions')}
            />
            <StatCard
              label="Fire/EMS"
              value={briefing.fireIncidents?.total || 0}
              icon="🚒"
              color="warning"
              subtext={`YTD in ${loc?.zip || 'area'}`}
              delay={3}
              onDetails={() => setDetailModal('fire')}
            />
          </div>

          {/* Map */}
          <div className="h-[300px] sm:h-[400px] rounded-xl overflow-hidden border border-border bg-surface animate-fade-in stagger-4">
            <Map
              center={center}
              radiusMiles={0.5}
              items311={briefing.datasets.getItDone311.items || []}
              permits={briefing.datasets.permits.items || []}
              civic={briefing.civic || null}
              activeTab="briefing"
            />
          </div>

          {/* Live SDPD Dispatch */}
          <div className="bg-surface rounded-xl border border-border overflow-hidden animate-fade-in stagger-5">
            <RightNowTab
              neighborhood={loc?.neighborhood || ''}
              sdpdNeighborhood={loc?.sdpdNeighborhood || null}
            />
          </div>

          {/* Overview */}
          <div className="bg-surface rounded-xl border border-border overflow-hidden animate-fade-in stagger-6">
            <BriefingTab
              stats311={briefing.datasets.getItDone311.stats}
              permitStats={briefing.datasets.permits.stats}
              items311={briefing.datasets.getItDone311.items}
              permits={briefing.datasets.permits.items}
              neighborhood={loc?.neighborhood || ''}
              councilDistrict={loc?.councilDistrict || null}
              civic={briefing.civic || null}
              fireIncidents={briefing.fireIncidents || null}
              trafficCollisions={briefing.trafficCollisions || null}
              streetSweeping={briefing.streetSweeping || null}
              onViewDetails={(type) => setDetailModal(type)}
            />
          </div>

          {/* Data sources footer */}
          <div className="flex flex-wrap items-center justify-center gap-3 py-2 text-[10px] text-muted/40 animate-fade-in">
            {['311/Get It Done', 'Development Permits', 'Traffic Collisions', 'Fire/EMS Incidents', 'Street Sweeping', 'SDPD Dispatch', 'Council Districts', 'Budget', 'Libraries', 'Fire Stations', 'Rec Centers'].map((src) => (
              <span key={src} className="flex items-center gap-1">
                <span className="w-1 h-1 rounded-full bg-muted/30" />
                {src}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {detailModal && briefing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDetailModal(null)} />
          <div className="relative w-full max-w-lg max-h-[80vh] bg-surface border border-border rounded-2xl flex flex-col overflow-hidden animate-fade-in shadow-2xl shadow-black/50 mx-4">
            {/* Modal header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-surface-alt">
              <div className="flex items-center gap-2.5">
                <span className="text-lg">{detailModal === 'collisions' ? '🚗' : '🚒'}</span>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">
                    {detailModal === 'collisions' ? 'Traffic Collisions (2yr)' : 'Fire/EMS Incidents (YTD)'}
                  </h3>
                  <p className="text-[10px] text-muted">
                    {detailModal === 'collisions'
                      ? `${briefing.trafficCollisions?.total || 0} collisions · ${briefing.trafficCollisions?.totalInjured || 0} injured · ${briefing.trafficCollisions?.totalKilled || 0} fatal · ${briefing.trafficCollisions?.hitAndRun || 0} hit & run`
                      : `${briefing.fireIncidents?.total || 0} incidents in ${loc?.zip || 'area'}`}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setDetailModal(null)}
                className="w-8 h-8 rounded-lg hover:bg-surface flex items-center justify-center text-muted hover:text-foreground transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>

            {/* Modal body */}
            <div className="overflow-y-auto flex-1 p-4 space-y-2">
              {detailModal === 'collisions' && briefing.trafficCollisions?.recent?.map((c: any, i: number) => (
                <div key={i} className="bg-surface-alt rounded-lg border border-border p-3 space-y-1">
                  <div className="flex items-start justify-between">
                    <span className="text-sm font-medium text-foreground">{c.chargeDesc || 'Unknown'}</span>
                    {c.hitRunLevel && c.hitRunLevel !== 'Not Hit and Run' && (
                      <span className="text-[10px] bg-danger/20 text-danger px-1.5 py-0.5 rounded font-medium">Hit & Run</span>
                    )}
                  </div>
                  <div className="text-xs text-muted">{c.address || 'No address'}</div>
                  <div className="flex items-center gap-3 text-[11px] text-muted">
                    <span>{new Date(c.dateTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    {c.injured > 0 && <span className="text-danger">⚠ {c.injured} injured</span>}
                    {c.killed > 0 && <span className="text-danger font-bold">☠ {c.killed} fatal</span>}
                  </div>
                </div>
              ))}

              {detailModal === 'fire' && (
                <>
                  {/* Category breakdown */}
                  <div className="bg-surface-alt rounded-lg border border-border p-3 mb-3">
                    <div className="text-[10px] text-muted uppercase tracking-wider mb-2">By Category</div>
                    <div className="space-y-1.5">
                      {briefing.fireIncidents?.byCategory?.slice(0, 8).map((cat: any) => (
                        <div key={cat.name} className="flex items-center justify-between">
                          <span className="text-xs text-foreground truncate flex-1">{cat.name}</span>
                          <span className="text-xs text-warning font-mono ml-2">{cat.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  {/* Recent incidents */}
                  <div className="text-[10px] text-muted uppercase tracking-wider mb-1">Most Recent ({briefing.fireIncidents?.recent?.length || 0})</div>
                  {briefing.fireIncidents?.recent?.map((inc: any, i: number) => (
                    <div key={i} className="bg-surface-alt rounded-lg border border-border p-3 space-y-0.5">
                      <div className="flex items-start justify-between">
                        <span className="text-sm font-medium text-foreground">{inc.problem || inc.category}</span>
                        <span className="text-[10px] text-warning bg-warning/10 px-1.5 py-0.5 rounded">{inc.category}</span>
                      </div>
                      <div className="text-xs text-muted">
                        {new Date(inc.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        {inc.city && ` · ${inc.city}`}
                      </div>
                    </div>
                  ))}
                </>
              )}

              {((detailModal === 'collisions' && (!briefing.trafficCollisions?.recent || briefing.trafficCollisions.recent.length === 0)) ||
                (detailModal === 'fire' && (!briefing.fireIncidents?.recent || briefing.fireIncidents.recent.length === 0))) && (
                <div className="text-center text-muted text-sm py-8">No data available</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Floating AI Chat Button */}
      {briefing && !chatOpen && (
        <button
          onClick={() => setChatOpen(true)}
          className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-gradient-to-br from-primary to-accent shadow-lg shadow-primary/25 flex items-center justify-center text-white hover:scale-110 active:scale-95 transition-all glow-primary"
          aria-label="Ask AI about your neighborhood"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zm-4 0H9v2h2V9z" clipRule="evenodd" />
          </svg>
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-accent rounded-full flex items-center justify-center">
            <span className="text-[8px] font-bold">AI</span>
          </span>
        </button>
      )}

      {/* AI Chat Modal */}
      {chatOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setChatOpen(false)} />
          {/* Panel */}
          <div className="relative w-full sm:max-w-lg h-[85vh] sm:h-[600px] bg-surface border border-border rounded-t-2xl sm:rounded-2xl flex flex-col overflow-hidden animate-fade-in shadow-2xl shadow-black/50">
            {/* Chat header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-surface-alt">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                  <span className="text-sm">✨</span>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Ask AI</h3>
                  <p className="text-[10px] text-muted">Powered by Claude + MCP Tools</p>
                </div>
              </div>
              <button
                onClick={() => setChatOpen(false)}
                className="w-8 h-8 rounded-lg hover:bg-surface flex items-center justify-center text-muted hover:text-foreground transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
            {/* Chat body */}
            <div className="flex-1 overflow-hidden">
              <ChatPanel
                locationContext={loc ? {
                  address: searchedAddress,
                  lat: loc.lat,
                  lng: loc.lng,
                  neighborhood: loc.neighborhood,
                } : undefined}
                agentAvailable={agentAvailable}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, icon, color, subtext, isCurrency, delay, onDetails }: {
  label: string;
  value: number;
  icon: string;
  color: 'primary' | 'success' | 'danger' | 'warning';
  subtext: string;
  isCurrency?: boolean;
  delay: number;
  onDetails?: () => void;
}) {
  const colorMap = {
    primary: 'from-primary/15 to-primary/5 border-primary/20 glow-primary',
    success: 'from-success/15 to-success/5 border-success/20 glow-success',
    danger: 'from-danger/15 to-danger/5 border-danger/20 glow-danger',
    warning: 'from-warning/15 to-warning/5 border-warning/20 glow-warning',
  };
  const textColor = {
    primary: 'text-primary-light',
    success: 'text-success',
    danger: 'text-danger',
    warning: 'text-warning',
  };

  const formatted = isCurrency
    ? value >= 1_000_000
      ? `$${(value / 1_000_000).toFixed(1)}M`
      : value > 0
        ? `$${(value / 1000).toFixed(0)}K`
        : '—'
    : value.toLocaleString();

  return (
    <div className={`bg-gradient-to-b ${colorMap[color]} border rounded-xl p-3.5 animate-fade-in stagger-${delay + 1} transition-transform hover:scale-[1.02]`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-lg">{icon}</span>
        <span className="text-[10px] text-muted font-medium uppercase tracking-wider">{label}</span>
      </div>
      <div className={`text-2xl font-bold ${textColor[color]} tabular-nums animate-count`}>
        {formatted}
      </div>
      <div className="text-[10px] text-muted mt-0.5 truncate">{subtext}</div>
      {onDetails && (
        <button
          onClick={onDetails}
          className="mt-2 w-full text-xs font-semibold py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-foreground border border-white/10 transition-colors cursor-pointer"
        >
          View Details
        </button>
      )}
    </div>
  );
}
