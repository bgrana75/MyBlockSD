'use client';

import { useEffect, useState, useCallback } from 'react';
import { getLive } from '@/lib/api';

interface SdpdIncident {
  dateTime: string;
  callType: string;
  division: string;
  neighborhood: string;
  blockAddress: string;
}

interface Props {
  neighborhood: string;
  sdpdNeighborhood: string | null;
}

export default function RightNowTab({ neighborhood, sdpdNeighborhood }: Props) {
  const [incidents, setIncidents] = useState<SdpdIncident[]>([]);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [stale, setStale] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLive = useCallback(async () => {
    const nbr = sdpdNeighborhood || neighborhood;
    if (!nbr) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getLive(nbr);
      setIncidents(data.sdpd?.items || []);
      setLastUpdated(data.sdpd?.lastUpdated || null);
      setStale(data.sdpd?.stale || false);
    } catch (err) {
      setError('Failed to load SDPD dispatch data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [neighborhood, sdpdNeighborhood]);

  useEffect(() => {
    fetchLive();
    const interval = setInterval(fetchLive, 60_000);
    return () => clearInterval(interval);
  }, [fetchLive]);

  const timeAgo = lastUpdated
    ? Math.round((Date.now() - new Date(lastUpdated).getTime()) / 60000)
    : null;

  return (
    <div className="space-y-4 overflow-y-auto max-h-[calc(100vh-320px)] pr-1">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">SDPD Dispatch</h3>
        <div className="flex items-center gap-2">
          {stale && (
            <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">Stale</span>
          )}
          {timeAgo !== null && (
            <span className="text-xs text-gray-500">Updated {timeAgo}m ago</span>
          )}
          <button
            onClick={fetchLive}
            disabled={loading}
            className="text-xs text-blue-600 hover:text-blue-800 disabled:opacity-50"
          >
            Refresh
          </button>
        </div>
      </div>

      <p className="text-sm text-gray-500">
        Active police dispatch calls for {sdpdNeighborhood || neighborhood}.
        These are reported calls, not confirmed incidents.
      </p>

      {loading && incidents.length === 0 && (
        <div className="text-center py-8 text-gray-400">Loading dispatch data...</div>
      )}

      {error && (
        <div className="text-center py-4 text-red-500 text-sm">{error}</div>
      )}

      {!loading && !error && incidents.length === 0 && (
        <div className="text-center py-8 text-gray-400">
          No active dispatch calls for this area right now.
        </div>
      )}

      <div className="space-y-2">
        {incidents.map((inc, i) => (
          <div key={i} className="bg-gray-50 p-3 rounded-lg">
            <div className="flex justify-between items-start">
              <span className="font-medium text-gray-800 text-sm">{inc.callType}</span>
              <span className="text-xs text-gray-500">{inc.dateTime}</span>
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {inc.division} · {inc.neighborhood}
            </div>
          </div>
        ))}
      </div>

      <p className="text-xs text-gray-400 mt-4">
        This is informational only — if there&apos;s an emergency, call 911.
      </p>
    </div>
  );
}
