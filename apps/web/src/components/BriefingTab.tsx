'use client';

interface StatsData {
  total: number;
  open: number;
  topCategories: { name: string; count: number }[];
  avgCloseDaysByCategory?: { name: string; days: number }[];
}

interface PermitStats {
  total: number;
  byType: { name: string; count: number }[];
  byStatus: { name: string; count: number }[];
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
  councilDistrict: {
    district: number;
    member: string;
    title: string;
  } | null;
  civic: {
    libraries: { item: { name: string; address: string; phone: string; lat: number; lng: number }; distanceMiles: number }[];
    fireStations: { item: { name: string; stationNum: string; type: string; phone: string; lat: number; lng: number }; distanceMiles: number }[];
  } | null;
}

function StatBar({ label, count, max }: { label: string; count: number; max: number }) {
  const pct = max > 0 ? (count / max) * 100 : 0;
  return (
    <div className="mb-2.5">
      <div className="flex justify-between text-xs mb-1">
        <span className="text-foreground/70 truncate mr-2">{label}</span>
        <span className="text-foreground font-semibold tabular-nums">{count}</span>
      </div>
      <div className="w-full bg-primary/5 rounded-full h-1.5">
        <div className="bg-gradient-to-r from-primary to-accent h-1.5 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function BriefingTab({ stats311, permitStats, items311, permits: _permits, neighborhood, councilDistrict, civic }: Props) {
  const topCats = stats311?.topCategories || [];
  const maxCount = topCats.length > 0 ? topCats[0].count : 1;

  const permitTypes = permitStats?.byType?.slice(0, 5) || [];
  const maxPermit = permitTypes.length > 0 ? permitTypes[0].count : 1;

  return (
    <div className="space-y-5 overflow-y-auto h-full p-4">
      {/* Council District */}
      {councilDistrict && (
        <section className="bg-gradient-to-r from-primary/5 to-accent/5 rounded-xl p-3.5 border border-primary/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <span className="text-lg font-bold text-primary">{councilDistrict.district}</span>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Council District {councilDistrict.district}</h3>
              <p className="text-xs text-muted">{councilDistrict.title} {councilDistrict.member}</p>
            </div>
          </div>
        </section>
      )}

      {/* Nearby Civic Amenities */}
      {civic && (civic.libraries.length > 0 || civic.fireStations.length > 0) && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 rounded-lg bg-sky-500/10 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-sky-600" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
            </div>
            <h3 className="text-sm font-semibold text-foreground">Nearby Services</h3>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {civic.libraries.slice(0, 2).map((lib) => (
              <div key={lib.item.name} className="bg-background rounded-xl p-2.5">
                <div className="flex items-center gap-1.5 mb-1">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-sky-500 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
                  </svg>
                  <span className="text-[10px] font-medium text-sky-600 uppercase">Library</span>
                </div>
                <p className="text-xs font-medium text-foreground truncate">{lib.item.name}</p>
                <p className="text-[10px] text-muted">{lib.distanceMiles} mi away</p>
              </div>
            ))}
            {civic.fireStations.slice(0, 2).map((fs) => (
              <div key={fs.item.name} className="bg-background rounded-xl p-2.5">
                <div className="flex items-center gap-1.5 mb-1">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-red-500 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" />
                  </svg>
                  <span className="text-[10px] font-medium text-red-500 uppercase">Fire Station</span>
                </div>
                <p className="text-xs font-medium text-foreground truncate">Station {fs.item.stationNum}</p>
                <p className="text-[10px] text-muted">{fs.distanceMiles} mi away</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 311 Stats */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-primary" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">311 Service Requests</h3>
              <p className="text-[11px] text-muted">
                {stats311 ? `${stats311.total.toLocaleString()} open near ${neighborhood}` : 'No data'}
              </p>
            </div>
          </div>
          <a
            href="https://getitdone.sandiego.gov"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs px-3 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 font-medium transition-colors shrink-0"
          >
            Report Issue to Get It Done
          </a>
        </div>
        {topCats.length > 0 && (
          <div className="bg-background rounded-xl p-3">
            <h4 className="text-[11px] font-medium text-muted uppercase tracking-wider mb-2">Top Categories</h4>
            {topCats.slice(0, 5).map((cat) => (
              <StatBar key={cat.name} label={cat.name} count={cat.count} max={maxCount} />
            ))}
          </div>
        )}
        {stats311?.avgCloseDaysByCategory && stats311.avgCloseDaysByCategory.length > 0 && (
          <div className="mt-3">
            <h4 className="text-[11px] font-medium text-muted uppercase tracking-wider mb-2">Avg Response Time</h4>
            <div className="grid grid-cols-3 gap-2">
              {stats311.avgCloseDaysByCategory.slice(0, 6).map((item) => (
                <div key={item.name} className="bg-background rounded-xl p-2.5 text-center">
                  <div className="text-lg font-bold text-primary tabular-nums">{item.days}<span className="text-xs font-normal text-muted">d</span></div>
                  <div className="text-[10px] text-muted truncate mt-0.5">{item.name}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Permits Stats */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-6 h-6 rounded-lg bg-emerald-500/10 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-emerald-600" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Development Permits</h3>
            <p className="text-[11px] text-muted">
              {permitStats ? `${permitStats.total.toLocaleString()} permits nearby` : 'No data'}
            </p>
          </div>
        </div>
        {permitTypes.length > 0 && (
          <div className="bg-background rounded-xl p-3">
            <h4 className="text-[11px] font-medium text-muted uppercase tracking-wider mb-2">By Type</h4>
            {permitTypes.map((item) => (
              <StatBar key={item.name} label={item.name} count={item.count} max={maxPermit} />
            ))}
          </div>
        )}
      </section>

      {/* Recent 311 items list */}
      <section>
        <h3 className="text-[11px] font-medium text-muted uppercase tracking-wider mb-2">Recent 311 Requests</h3>
        <div className="space-y-1.5">
          {[...items311].sort((a, b) => b.dt.localeCompare(a.dt)).slice(0, 15).map((item) => (
            <div key={item.id} className="bg-background rounded-xl px-3 py-2.5 flex items-center justify-between gap-2">
              <div className="min-w-0 flex-1">
                <span className="text-xs font-medium text-foreground block truncate">{item.svc}</span>
                <span className="text-[10px] text-muted">
                  {item.dt} {item.age !== undefined && `· ${item.age}d old`}
                </span>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0 ${
                item.st === 'I' ? 'bg-amber-100 text-amber-700' : 'bg-primary/10 text-primary'
              }`}>
                {item.st === 'I' ? 'In Process' : 'New'}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
