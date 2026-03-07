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
    councilDistrict: {
      district: number;
      member: string;
      title: string;
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
  };
}

type TabId = 'briefing' | 'rightnow' | 'ask';

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  {
    id: 'briefing',
    label: 'Briefing',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
        <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
        <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
      </svg>
    ),
  },
  {
    id: 'rightnow',
    label: 'Live',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M5.05 3.636a1 1 0 010 1.414 7 7 0 000 9.9 1 1 0 11-1.414 1.414 9 9 0 010-12.728 1 1 0 011.414 0zm9.9 0a1 1 0 011.414 0 9 9 0 010 12.728 1 1 0 11-1.414-1.414 7 7 0 000-9.9 1 1 0 010-1.414zM7.879 6.464a1 1 0 010 1.414 3 3 0 000 4.243 1 1 0 11-1.415 1.414 5 5 0 010-7.07 1 1 0 011.415 0zm4.242 0a1 1 0 011.415 0 5 5 0 010 7.072 1 1 0 01-1.415-1.415 3 3 0 000-4.242 1 1 0 010-1.415zM10 9a1 1 0 011 1v.01a1 1 0 11-2 0V10a1 1 0 011-1z" clipRule="evenodd" />
      </svg>
    ),
  },
  {
    id: 'ask',
    label: 'Ask AI',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zm-4 0H9v2h2V9z" clipRule="evenodd" />
      </svg>
    ),
  },
];

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
      <header className="bg-surface border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-2.5 flex flex-col sm:flex-row items-center gap-3">
          <h1 className="text-base font-bold text-foreground shrink-0">My Block SD</h1>
          <AddressSearch onSearch={handleSearch} isLoading={loading} />
        </div>
      </header>

      {/* Error */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 mt-4">
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
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
          <div className="text-center max-w-sm px-4">
            <div className="w-14 h-14 bg-gradient-to-br from-primary/10 to-accent/10 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-primary" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Know Your Block SD</h2>
            <p className="text-muted text-sm leading-relaxed">
              Enter any San Diego address to see 311 reports, development permits,
              and live police dispatch — all in one place.
            </p>
            <div className="flex items-center justify-center gap-4 mt-6 text-[11px] text-muted/60">
              <span>City of San Diego Open Data</span>
              <span>·</span>
              <span>SDPD Online</span>
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      {(briefing || loading) && (
        <div className="max-w-7xl mx-auto px-4 py-3">
          {loc && (
            <div className="mb-2 flex items-baseline gap-2">
              <h2 className="text-sm font-semibold text-foreground">{loc.neighborhood}</h2>
              <p className="text-xs text-muted">{loc.display}</p>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-3">
            {/* Map */}
            <div className="lg:col-span-3 h-[350px] lg:h-[500px] rounded-xl overflow-hidden border border-border shadow-sm">
              <Map
                center={center}
                radiusMiles={0.5}
                items311={briefing?.datasets.getItDone311.items || []}
                permits={briefing?.datasets.permits.items || []}
                civic={briefing?.civic || null}
                activeTab={activeTab}
              />
            </div>

            {/* Side panel */}
            <div className="lg:col-span-2 flex flex-col bg-surface rounded-xl border border-border shadow-sm overflow-hidden min-h-[600px] lg:min-h-[700px]">
              {/* Tabs */}
              <div className="flex border-b border-border bg-surface">
                {TABS.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-medium transition-all relative ${
                      activeTab === tab.id
                        ? 'text-primary'
                        : 'text-muted hover:text-foreground'
                    }`}
                  >
                    {tab.icon}
                    {tab.label}
                    {tab.id === 'rightnow' && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 pulse-dot" />
                    )}
                    {activeTab === tab.id && (
                      <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-primary rounded-full" />
                    )}
                  </button>
                ))}
              </div>

              {/* Tab content */}
              <div className="flex-1 overflow-hidden">
                {loading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-3" />
                      <p className="text-xs text-muted">Loading neighborhood data...</p>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className={activeTab === 'briefing' ? 'h-full' : 'hidden'}>
                      {briefing && (
                        <BriefingTab
                          stats311={briefing.datasets.getItDone311.stats}
                          permitStats={briefing.datasets.permits.stats}
                          items311={briefing.datasets.getItDone311.items}
                          permits={briefing.datasets.permits.items}
                          neighborhood={loc?.neighborhood || ''}
                          councilDistrict={loc?.councilDistrict || null}
                          civic={briefing.civic || null}
                        />
                      )}
                    </div>
                    <div className={activeTab === 'rightnow' ? 'h-full' : 'hidden'}>
                      {briefing && (
                        <RightNowTab
                          neighborhood={loc?.neighborhood || ''}
                          sdpdNeighborhood={loc?.sdpdNeighborhood || null}
                        />
                      )}
                    </div>
                    <div className={activeTab === 'ask' ? 'h-full' : 'hidden'}>
                      {briefing && (
                        <ChatPanel
                          locationContext={loc ? {
                            address: searchedAddress,
                            lat: loc.lat,
                            lng: loc.lng,
                            neighborhood: loc.neighborhood,
                          } : undefined}
                          agentAvailable={agentAvailable}
                        />
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
