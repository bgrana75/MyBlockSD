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
}

export default function Home() {
  const [briefing, setBriefing] = useState<BriefingData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'briefing' | 'rightnow'>('briefing');
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b px-4 py-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center gap-4">
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-gray-900">My Block</h1>
          </div>
          <AddressSearch onSearch={handleSearch} isLoading={loading} />
        </div>
      </header>

      {/* Error */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 mt-4">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        </div>
      )}

      {/* Landing state */}
      {!briefing && !loading && (
        <div className="flex items-center justify-center" style={{ height: 'calc(100vh - 80px)' }}>
          <div className="text-center max-w-md px-4">
            <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Know Your Block</h2>
            <p className="text-gray-500 mb-1">
              Enter any San Diego address to see 311 reports, development permits,
              and live police dispatch — all in one place.
            </p>
            <p className="text-xs text-gray-400 mt-4">
              Data from City of San Diego Open Data Portal · SDPD Online
            </p>
          </div>
        </div>
      )}

      {/* Main content */}
      {(briefing || loading) && (
        <div className="max-w-7xl mx-auto px-4 py-4">
          {loc && (
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-gray-900">{loc.neighborhood}</h2>
              <p className="text-sm text-gray-500">{loc.display}</p>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4" style={{ height: 'calc(100vh - 200px)' }}>
            <div className="lg:col-span-3 h-[400px] lg:h-full rounded-lg overflow-hidden border">
              <Map
                center={center}
                radiusMiles={0.5}
                items311={briefing?.datasets.getItDone311.items || []}
                permits={briefing?.datasets.permits.items || []}
                activeTab={activeTab}
              />
            </div>

            <div className="lg:col-span-2">
              <div className="flex border-b mb-4">
                <button
                  onClick={() => setActiveTab('briefing')}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'briefing'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Briefing
                </button>
                <button
                  onClick={() => setActiveTab('rightnow')}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'rightnow'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Right Now
                </button>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <svg className="animate-spin h-8 w-8 text-blue-600 mx-auto mb-3" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                    <p className="text-sm text-gray-500">Loading neighborhood data...</p>
                  </div>
                </div>
              ) : (
                <>
                  {activeTab === 'briefing' && briefing && (
                    <BriefingTab
                      stats311={briefing.datasets.getItDone311.stats}
                      permitStats={briefing.datasets.permits.stats}
                      items311={briefing.datasets.getItDone311.items}
                      permits={briefing.datasets.permits.items}
                      neighborhood={loc?.neighborhood || ''}
                    />
                  )}
                  {activeTab === 'rightnow' && briefing && (
                    <RightNowTab
                      neighborhood={loc?.neighborhood || ''}
                      sdpdNeighborhood={loc?.sdpdNeighborhood || null}
                    />
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

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

      <div className="fixed bottom-0 left-0 right-0 bg-gray-800 text-gray-400 text-xs text-center py-1 px-4 z-40">
        Data is informational only. If there&apos;s an emergency, call 911. · Powered by City of San Diego Open Data
      </div>
    </div>
  );
}
