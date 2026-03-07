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

type TabId = 'briefing' | 'rightnow' | 'ask';

export default function Home() {
  const [briefing, setBriefing] = useState<BriefingData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>('briefing');
  const [agentAvailable, setAgentAvailable] = useState(false);
  const [searchedAddress, setSearchedAddress] = useState('');

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
        <div className="max-w-[1400px] mx-auto px-4 lg:px-6 py-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
            {[1,2,3,4].map(i => (
              <div key={i} className="h-24 rounded-xl shimmer" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            <div className="lg:col-span-2 h-[400px] rounded-xl shimmer" />
            <div className="h-[400px] rounded-xl shimmer" />
          </div>
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
              {loc.zip && (
                <span className="text-xs text-muted bg-surface-alt px-2.5 py-1 rounded-lg border border-border font-mono">{loc.zip}</span>
              )}
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
            />
            <StatCard
              label="Fire/EMS"
              value={briefing.fireIncidents?.total || 0}
              icon="🚒"
              color="warning"
              subtext={`YTD in ${loc?.zip || 'area'}`}
              delay={3}
            />
          </div>

          {/* Main grid: Map + Tabs */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-3">
            {/* Map */}
            <div className="lg:col-span-3 h-[350px] lg:h-[480px] rounded-xl overflow-hidden border border-border bg-surface animate-fade-in stagger-4">
              <Map
                center={center}
                radiusMiles={0.5}
                items311={briefing.datasets.getItDone311.items || []}
                permits={briefing.datasets.permits.items || []}
                civic={briefing.civic || null}
                activeTab={activeTab}
              />
            </div>

            {/* Side panel with tabs */}
            <div className="lg:col-span-2 flex flex-col bg-surface rounded-xl border border-border overflow-hidden min-h-[480px] animate-fade-in stagger-5">
              {/* Tab bar */}
              <div className="flex border-b border-border">
                {([
                  { id: 'briefing' as TabId, label: 'Overview', icon: '📊' },
                  { id: 'rightnow' as TabId, label: 'Live', icon: '🔴' },
                  { id: 'ask' as TabId, label: 'Ask AI', icon: '✨' },
                ] as const).map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-3 text-xs font-medium transition-all relative ${
                      activeTab === tab.id
                        ? 'text-foreground'
                        : 'text-muted hover:text-foreground/70'
                    }`}
                  >
                    <span className="text-sm">{tab.icon}</span>
                    {tab.label}
                    {tab.id === 'rightnow' && (
                      <span className="w-1.5 h-1.5 rounded-full bg-success pulse-dot" />
                    )}
                    {activeTab === tab.id && (
                      <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-gradient-to-r from-primary to-accent rounded-full" />
                    )}
                  </button>
                ))}
              </div>

              {/* Tab content */}
              <div className="flex-1 overflow-hidden">
                {loading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-3" />
                      <p className="text-xs text-muted">Loading...</p>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className={activeTab === 'briefing' ? 'h-full' : 'hidden'}>
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
                      />
                    </div>
                    <div className={activeTab === 'rightnow' ? 'h-full' : 'hidden'}>
                      <RightNowTab
                        neighborhood={loc?.neighborhood || ''}
                        sdpdNeighborhood={loc?.sdpdNeighborhood || null}
                      />
                    </div>
                    <div className={activeTab === 'ask' ? 'h-full' : 'hidden'}>
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
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Data sources footer */}
          <div className="flex flex-wrap items-center justify-center gap-3 py-2 text-[10px] text-muted/40 animate-fade-in stagger-6">
            {['311/Get It Done', 'Development Permits', 'Traffic Collisions', 'Fire/EMS Incidents', 'Street Sweeping', 'SDPD Dispatch', 'Council Districts', 'Budget', 'Libraries', 'Fire Stations', 'Rec Centers'].map((src) => (
              <span key={src} className="flex items-center gap-1">
                <span className="w-1 h-1 rounded-full bg-muted/30" />
                {src}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, icon, color, subtext, isCurrency, delay }: {
  label: string;
  value: number;
  icon: string;
  color: 'primary' | 'success' | 'danger' | 'warning';
  subtext: string;
  isCurrency?: boolean;
  delay: number;
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
    </div>
  );
}
