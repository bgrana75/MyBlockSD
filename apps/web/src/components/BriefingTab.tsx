'use client';

interface StatsData {
  total: number;
  open: number;
  topCategories: { name: string; count: number }[];
  avgCloseDays?: Record<string, { n: number; avg: number }>;
}

interface PermitStats {
  total: number;
  byType: Record<string, number>;
  byStatus: Record<string, number>;
}

interface Item {
  id: string;
  svc?: string;
  type?: string;
  st: string;
  dt: string;
  age?: number;
  nbr?: string;
  addr?: string;
  ttl?: string;
  val?: number;
}

interface Props {
  stats311: StatsData | null;
  permitStats: PermitStats | null;
  items311: Item[];
  permits: Item[];
  neighborhood: string;
}

function StatBar({ label, count, max }: { label: string; count: number; max: number }) {
  const pct = max > 0 ? (count / max) * 100 : 0;
  return (
    <div className="mb-2">
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-700 truncate mr-2">{label}</span>
        <span className="text-gray-500 font-medium">{count}</span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-2">
        <div className="bg-blue-500 h-2 rounded-full transition-all" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function BriefingTab({ stats311, permitStats, items311, permits, neighborhood }: Props) {
  const topCats = stats311?.topCategories || [];
  const maxCount = topCats.length > 0 ? topCats[0].count : 1;

  const permitTypes = permitStats
    ? Object.entries(permitStats.byType).sort((a, b) => b[1] - a[1]).slice(0, 5)
    : [];
  const maxPermit = permitTypes.length > 0 ? permitTypes[0][1] : 1;

  return (
    <div className="space-y-6 overflow-y-auto max-h-[calc(100vh-320px)] pr-1">
      {/* 311 Stats */}
      <section>
        <h3 className="text-lg font-semibold text-gray-900 mb-1">311 Service Requests</h3>
        <p className="text-sm text-gray-500 mb-3">
          {stats311 ? `${stats311.total.toLocaleString()} open cases near ${neighborhood}` : 'No data'}
        </p>
        {topCats.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-600 mb-2">Top Categories</h4>
            {topCats.slice(0, 6).map((cat) => (
              <StatBar key={cat.name} label={cat.name} count={cat.count} max={maxCount} />
            ))}
          </div>
        )}
        {stats311?.avgCloseDays && Object.keys(stats311.avgCloseDays).length > 0 && (
          <div className="mt-4">
            <h4 className="text-sm font-medium text-gray-600 mb-2">Avg Response Time (days)</h4>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(stats311.avgCloseDays).slice(0, 6).map(([cat, d]) => (
                <div key={cat} className="bg-gray-50 p-2 rounded text-sm">
                  <div className="text-gray-700 truncate">{cat}</div>
                  <div className="text-xl font-bold text-blue-600">{d.avg}d</div>
                  <div className="text-xs text-gray-400">{d.n} resolved</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Permits Stats */}
      <section>
        <h3 className="text-lg font-semibold text-gray-900 mb-1">Development Permits</h3>
        <p className="text-sm text-gray-500 mb-3">
          {permitStats ? `${permitStats.total.toLocaleString()} permits nearby` : 'No data'}
        </p>
        {permitTypes.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-600 mb-2">By Type</h4>
            {permitTypes.map(([type, count]) => (
              <StatBar key={type} label={type} count={count} max={maxPermit} />
            ))}
          </div>
        )}
      </section>

      {/* Recent 311 items list */}
      <section>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Recent 311 Requests</h3>
        <div className="space-y-2">
          {items311.slice(0, 20).map((item) => (
            <div key={item.id} className="bg-gray-50 p-3 rounded-lg">
              <div className="flex justify-between items-start">
                <span className="font-medium text-gray-800 text-sm">{item.svc}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${item.st === 'I' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'}`}>
                  {item.st === 'I' ? 'In Process' : 'New'}
                </span>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {item.dt} {item.age !== undefined && `· ${item.age} days old`}
              </div>
            </div>
          ))}
        </div>
        <a
          href="https://getitdone.sandiego.gov"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-block text-sm text-blue-600 hover:text-blue-800 font-medium"
        >
          Report an issue on Get It Done →
        </a>
      </section>
    </div>
  );
}
