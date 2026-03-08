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
    budget?: {
      totalBudget: number;
      fiscalYear: number;
    };
  } | null;
  civic: {
    libraries: { item: { name: string; address: string; phone: string; lat: number; lng: number }; distanceMiles: number }[];
    fireStations: { item: { name: string; stationNum: string; type: string; phone: string; lat: number; lng: number }; distanceMiles: number }[];
    recCenters?: { item: { name: string; parkName: string; address: string; neighborhood: string; hasGymnasium: boolean; lat: number; lng: number }; distanceMiles: number }[];
  } | null;
  fireIncidents: {
    total: number;
    byCategory: { name: string; count: number }[];
    recent: any[];
  } | null;
  trafficCollisions: {
    total: number;
    totalInjured: number;
    totalKilled: number;
    hitAndRun: number;
    byChargeType: { name: string; count: number }[];
    recent: any[];
  } | null;
  streetSweeping: {
    found: boolean;
    schedule: string;
    isPosted: boolean;
    segment: any;
    nearbySegments: any[];
  } | null;
  onViewDetails?: (type: 'collisions' | 'fire' | '311' | 'permits') => void;
}

function StatBar({ label, count, max, color = 'from-primary to-accent' }: { label: string; count: number; max: number; color?: string }) {
  const pct = max > 0 ? (count / max) * 100 : 0;
  return (
    <div className="mb-2.5">
      <div className="flex justify-between text-xs mb-1">
        <span className="text-foreground/60 truncate mr-2">{label}</span>
        <span className="text-foreground font-semibold tabular-nums">{count}</span>
      </div>
      <div className="w-full bg-border/30 rounded-full h-1.5">
        <div
          className={`bg-gradient-to-r ${color} h-1.5 rounded-full transition-all duration-700 ease-out`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function BriefingTab({ stats311, permitStats, items311, neighborhood, councilDistrict, civic, fireIncidents, trafficCollisions, streetSweeping, onViewDetails }: Props) {
  const topCats = stats311?.topCategories || [];
  const maxCount = topCats.length > 0 ? topCats[0].count : 1;

  const permitTypes = permitStats?.byType?.slice(0, 5) || [];
  const maxPermit = permitTypes.length > 0 ? permitTypes[0].count : 1;

  const fireCats = fireIncidents?.byCategory || [];
  const maxFire = fireCats.length > 0 ? fireCats[0].count : 1;

  return (
    <div className="space-y-4 overflow-y-auto h-full p-4">
      {/* Council District */}
      {councilDistrict && (
        <section className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-xl p-3 border border-primary/15 animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shrink-0">
              <span className="text-lg font-bold text-white">{councilDistrict.district}</span>
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-semibold text-foreground">Council District {councilDistrict.district}</h3>
              <p className="text-xs text-muted truncate">{councilDistrict.title} {councilDistrict.member}</p>
            </div>
          </div>
        </section>
      )}

      {/* Nearby Services */}
      {civic && (civic.libraries.length > 0 || civic.fireStations.length > 0) && (
        <section className="animate-fade-in stagger-1">
          <h3 className="text-[11px] font-medium text-muted uppercase tracking-wider mb-2">Nearby Services</h3>
          <div className="grid grid-cols-2 gap-2">
            {civic.libraries.slice(0, 2).map((lib) => (
              <div key={lib.item.name} className="bg-surface-alt rounded-xl p-2.5 border border-border hover:border-accent/30 transition-colors">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-xs">📚</span>
                  <span className="text-[10px] font-medium text-accent uppercase">Library</span>
                </div>
                <p className="text-xs font-medium text-foreground truncate">{lib.item.name}</p>
                <p className="text-[10px] text-muted truncate">{lib.item.address}</p>
                <p className="text-[10px] text-muted">{lib.distanceMiles} mi</p>
              </div>
            ))}
            {civic.fireStations.slice(0, 2).map((fs) => (
              <div key={fs.item.name} className="bg-surface-alt rounded-xl p-2.5 border border-border hover:border-danger/30 transition-colors">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-xs">🚒</span>
                  <span className="text-[10px] font-medium text-danger uppercase">Fire Station</span>
                </div>
                <p className="text-xs font-medium text-foreground truncate">Station {fs.item.stationNum}</p>
                <p className="text-[10px] text-muted truncate">{fs.item.name}</p>
                <p className="text-[10px] text-muted">{fs.distanceMiles} mi</p>
              </div>
            ))}
            {civic.recCenters?.slice(0, 2).map((rc) => (
              <div key={rc.item.name} className="bg-surface-alt rounded-xl p-2.5 border border-border hover:border-success/30 transition-colors">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-xs">🏀</span>
                  <span className="text-[10px] font-medium text-success uppercase">Rec Center</span>
                </div>
                <p className="text-xs font-medium text-foreground truncate">{rc.item.name}</p>
                <p className="text-[10px] text-muted truncate">{rc.item.address}</p>
                <p className="text-[10px] text-muted">{rc.distanceMiles} mi{rc.item.hasGymnasium ? ' · Gym' : ''}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Street Sweeping */}
      {streetSweeping && streetSweeping.schedule && (
        <section className="animate-fade-in stagger-1">
          <h3 className="text-[11px] font-medium text-muted uppercase tracking-wider mb-2">Street Sweeping</h3>
          <div className="bg-surface-alt rounded-xl p-3 border border-border">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-base">🧹</span>
              <span className="text-xs font-semibold text-foreground">{streetSweeping.schedule}</span>
            </div>
            <div className="flex items-center gap-2 text-[10px]">
              {streetSweeping.isPosted ? (
                <span className="px-2 py-0.5 rounded-full bg-warning/15 text-warning font-medium">Posted — No Parking Enforced</span>
              ) : (
                <span className="px-2 py-0.5 rounded-full bg-success/15 text-success font-medium">Not Posted — Voluntary</span>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Traffic Collisions */}
      {trafficCollisions && trafficCollisions.total > 0 && (
        <section className="animate-fade-in stagger-2">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-[11px] font-medium text-muted uppercase tracking-wider">Traffic Collisions (2yr)</h3>
            <div className="flex items-center gap-2">
              {onViewDetails && (
                <button
                  onClick={() => onViewDetails('collisions')}
                  className="text-[10px] font-semibold text-foreground bg-white/10 hover:bg-white/20 px-2.5 py-1 rounded-md border border-white/10 transition-colors cursor-pointer"
                >
                  View Details
                </button>
              )}
              <span className="text-[10px] text-danger font-semibold tabular-nums">{trafficCollisions.total.toLocaleString()}</span>
            </div>
          </div>
          <div className="bg-surface-alt rounded-xl p-3 border border-border">
            <div className="grid grid-cols-3 gap-2 mb-3">
              <div className="text-center">
                <div className="text-lg font-bold text-danger tabular-nums">{trafficCollisions.totalInjured}</div>
                <div className="text-[9px] text-muted">Injured</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-danger tabular-nums">{trafficCollisions.totalKilled}</div>
                <div className="text-[9px] text-muted">Fatal</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-warning tabular-nums">{trafficCollisions.hitAndRun}</div>
                <div className="text-[9px] text-muted">Hit & Run</div>
              </div>
            </div>
            {trafficCollisions.byChargeType.slice(0, 4).map((ct) => (
              <StatBar key={ct.name} label={ct.name} count={ct.count} max={trafficCollisions.byChargeType[0]?.count || 1} color="from-danger to-warning" />
            ))}
          </div>
        </section>
      )}

      {/* Fire/EMS Incidents */}
      {fireIncidents && fireIncidents.total > 0 && (
        <section className="animate-fade-in stagger-2">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-[11px] font-medium text-muted uppercase tracking-wider">Fire/EMS Incidents (YTD)</h3>
            <div className="flex items-center gap-2">
              {onViewDetails && (
                <button
                  onClick={() => onViewDetails('fire')}
                  className="text-[10px] font-semibold text-foreground bg-white/10 hover:bg-white/20 px-2.5 py-1 rounded-md border border-white/10 transition-colors cursor-pointer"
                >
                  View Details
                </button>
              )}
              <span className="text-[10px] text-danger font-semibold tabular-nums">{fireIncidents.total.toLocaleString()}</span>
            </div>
          </div>
          <div className="bg-surface-alt rounded-xl p-3 border border-border">
            {fireCats.slice(0, 5).map((cat) => (
              <StatBar key={cat.name} label={cat.name} count={cat.count} max={maxFire} color="from-danger to-warning" />
            ))}
          </div>
        </section>
      )}

      {/* 311 Stats */}
      <section className="animate-fade-in stagger-3">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-[11px] font-medium text-muted uppercase tracking-wider">311 Service Requests</h3>
          <div className="flex items-center gap-2">
            {onViewDetails && (
              <button
                onClick={() => onViewDetails('311')}
                className="text-[10px] font-semibold text-foreground bg-white/10 hover:bg-white/20 px-2.5 py-1 rounded-md border border-white/10 transition-colors cursor-pointer"
              >
                View Details
              </button>
            )}
            <a
              href="https://getitdone.sandiego.gov"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] px-2.5 py-1 rounded-lg bg-primary/10 text-primary-light hover:bg-primary/20 font-medium transition-colors"
            >
              Report Issue
            </a>
          </div>
        </div>
        <p className="text-[10px] text-muted/60 mb-2">Currently open requests within 0.5 mi · updated daily from City of San Diego</p>
        {topCats.length > 0 && (
          <div className="bg-surface-alt rounded-xl p-3 border border-border">
            {topCats.slice(0, 5).map((cat) => (
              <StatBar key={cat.name} label={cat.name} count={cat.count} max={maxCount} />
            ))}
          </div>
        )}
        {stats311?.avgCloseDaysByCategory && stats311.avgCloseDaysByCategory.length > 0 && (
          <div className="mt-2">
            <h4 className="text-[10px] font-medium text-muted uppercase tracking-wider mb-2">Avg Response</h4>
            <div className="grid grid-cols-3 gap-1.5">
              {stats311.avgCloseDaysByCategory.slice(0, 6).map((item) => (
                <div key={item.name} className="bg-surface-alt rounded-xl p-2 text-center border border-border">
                  <div className="text-base font-bold text-primary-light tabular-nums">{item.days}<span className="text-[10px] font-normal text-muted">d</span></div>
                  <div className="text-[9px] text-muted truncate">{item.name}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Permits Stats */}
      <section className="animate-fade-in stagger-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-[11px] font-medium text-muted uppercase tracking-wider">Development Permits</h3>
          <div className="flex items-center gap-2">
            {onViewDetails && (
              <button
                onClick={() => onViewDetails('permits')}
                className="text-[10px] font-semibold text-foreground bg-white/10 hover:bg-white/20 px-2.5 py-1 rounded-md border border-white/10 transition-colors cursor-pointer"
              >
                View Details
              </button>
            )}
            <span className="text-[10px] text-success font-semibold tabular-nums">{permitStats?.total?.toLocaleString() || 0}</span>
          </div>
        </div>
        <p className="text-[10px] text-muted/60 mb-2">Active permits within 0.5 mi · since 2024</p>
        {permitTypes.length > 0 && (
          <div className="bg-surface-alt rounded-xl p-3 border border-border">
            {permitTypes.map((item) => (
              <StatBar key={item.name} label={item.name} count={item.count} max={maxPermit} color="from-success to-accent" />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
