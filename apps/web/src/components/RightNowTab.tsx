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
    <div className="overflow-y-auto h-full p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-success/10 flex items-center justify-center">
            <span className="w-2 h-2 rounded-full bg-success pulse-dot" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">SDPD Dispatch</h3>
            <p className="text-[10px] text-muted">{sdpdNeighborhood || neighborhood}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {stale && (
            <span className="text-[10px] bg-warning/15 text-warning px-2 py-0.5 rounded-full font-medium">Stale</span>
          )}
          {timeAgo !== null && (
            <span className="text-[10px] text-muted">{timeAgo}m ago</span>
          )}
          <button
            onClick={fetchLive}
            disabled={loading}
            className="text-[10px] text-primary-light hover:text-primary disabled:opacity-50 font-medium transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      <p className="text-xs text-muted/60 leading-relaxed">
        Active police dispatch calls. These are reported calls, not confirmed incidents.
      </p>

      {loading && incidents.length === 0 && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-2" />
            <span className="text-xs text-muted">Loading dispatch data...</span>
          </div>
        </div>
      )}

      {error && (
        <div className="text-center py-4 text-danger text-xs bg-danger/10 rounded-xl px-3 border border-danger/20">{error}</div>
      )}

      {!loading && !error && incidents.length === 0 && (
        <div className="text-center py-12">
          <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center mx-auto mb-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-success" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
          <p className="text-xs text-muted">No active dispatch calls for this area.</p>
        </div>
      )}

      <div className="space-y-1.5">
        {incidents.map((inc, i) => (
          <div key={i} className="bg-surface-alt rounded-lg px-3 py-2.5 border border-border hover:border-warning/20 transition-colors">
            <div className="flex justify-between items-start gap-2">
              <span className="text-xs font-medium text-foreground">{inc.callType}</span>
              <span className="text-[10px] text-muted shrink-0 tabular-nums">{inc.dateTime}</span>
            </div>
            <div className="text-[10px] text-muted mt-0.5">
              {inc.division} · {inc.neighborhood}
            </div>
          </div>
        ))}
      </div>

      <p className="text-[10px] text-muted/40 text-center pt-2">
        Informational only — if there&apos;s an emergency, call 911.
      </p>
    </div>
  );
}
