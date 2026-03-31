import React, { useMemo, useState, useEffect } from 'react'

// ─── SVG Icons ────────────────────────────────────────────────────────────────
const Ic = {
  mapPin: (p) => (
    <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
    </svg>
  ),
  clock: (p) => (
    <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
    </svg>
  ),
  trash: (p) => (
    <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"/>
      <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
    </svg>
  ),
  users: (p) => (
    <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>
    </svg>
  ),
  building: (p) => (
    <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/>
    </svg>
  ),
  filter: (p) => (
    <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
    </svg>
  ),
  alert: (p) => (
    <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  ),
  checkCircle: (p) => (
    <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
    </svg>
  ),
  zap: (p) => (
    <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
    </svg>
  ),
  eye: (p) => (
    <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
    </svg>
  ),
  calendar: (p) => (
    <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  ),
  arrowUp: (p) => (
    <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/>
    </svg>
  ),
  sun: (p) => (
    <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5"/>
      <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
      <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
    </svg>
  ),
  moon: (p) => (
    <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>
    </svg>
  ),
  sunrise: (p) => (
    <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 18a5 5 0 00-10 0"/><line x1="12" y1="2" x2="12" y2="9"/>
      <line x1="4.22" y1="10.22" x2="5.64" y2="11.64"/><line x1="1" y1="18" x2="3" y2="18"/>
      <line x1="21" y1="18" x2="23" y2="18"/><line x1="18.36" y1="11.64" x2="19.78" y2="10.22"/>
      <line x1="23" y1="22" x2="1" y2="22"/><polyline points="8 6 12 2 16 6"/>
    </svg>
  ),
}

// ─── Data ─────────────────────────────────────────────────────────────────────
const SOURCE_FILTERS = [
  { id: 'all',       label: 'All sources' },
  { id: 'citizen',   label: 'Citizen reports' },
  { id: 'municipal', label: 'Municipal teams' },
]

const STATUS_META = {
  'Pending pickup':          { color: '#ef4444', bg: 'rgba(239,68,68,0.1)',   border: 'rgba(239,68,68,0.25)',   icon: Ic.alert },
  'Scheduled cleaning':      { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.25)', icon: Ic.calendar },
  'Under observation':       { color: '#16a34a', bg: 'rgba(22,163,74,0.1)', border: 'rgba(22,163,74,0.25)', icon: Ic.eye },
  'Cleaned, monitoring':     { color: '#10b981', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.25)', icon: Ic.checkCircle },
  'Escalated to department': { color: '#f97316', bg: 'rgba(249,115,22,0.1)', border: 'rgba(249,115,22,0.25)', icon: Ic.zap },
}

const BAND_META = {
  morning:   { label: 'Morning',   sub: '5–10 AM',  icon: Ic.sunrise, color: '#f59e0b', gradient: 'linear-gradient(90deg,#fbbf24,#f59e0b)' },
  afternoon: { label: 'Afternoon', sub: '12–5 PM',  icon: Ic.sun,     color: '#f97316', gradient: 'linear-gradient(90deg,#fb923c,#f97316)' },
  night:     { label: 'Night',     sub: '8–11 PM',  icon: Ic.moon,    color: '#16a34a', gradient: 'linear-gradient(90deg,#4ade80,#16a34a)' },
}

const HOTSPOTS = [
  { id: 'spot-01', name: 'Market Lane – Corner Plot',      ward: 'Ward 3',  zone: 'Central', citizenReports: 14, municipalReports: 3,  timeBands: ['morning','night'],     mainWindow: '6:30–9:00 AM & 8:00–10:00 PM', status: 'Pending pickup',          lastCleaned: '1 day ago'     },
  { id: 'spot-02', name: 'Canal Road – Under the bridge',  ward: 'Ward 8',  zone: 'East',    citizenReports: 9,  municipalReports: 5,  timeBands: ['night'],               mainWindow: '9:00–11:30 PM',               status: 'Scheduled cleaning',      lastCleaned: '3 days ago'    },
  { id: 'spot-03', name: 'School Wall – South Gate',       ward: 'Ward 5',  zone: 'South',   citizenReports: 7,  municipalReports: 2,  timeBands: ['morning'],             mainWindow: '7:00–8:30 AM',                status: 'Under observation',       lastCleaned: 'Today morning' },
  { id: 'spot-04', name: 'Lake Road – Park Entrance',      ward: 'Ward 11', zone: 'West',    citizenReports: 4,  municipalReports: 6,  timeBands: ['afternoon'],           mainWindow: '1:00–3:30 PM',                status: 'Cleaned, monitoring',     lastCleaned: 'Yesterday'     },
  { id: 'spot-05', name: 'Industrial Yard – Service Lane', ward: 'Ward 2',  zone: 'North',   citizenReports: 3,  municipalReports: 9,  timeBands: ['afternoon','night'],   mainWindow: '2:00–4:00 PM & 10:00–11:30 PM', status: 'Escalated to department', lastCleaned: '4 days ago'    },
]

// ─── Animated bar ─────────────────────────────────────────────────────────────
function AnimBar({ percent, gradient, delay = 0 }) {
  const [width, setWidth] = useState(0)
  useEffect(() => {
    const t = setTimeout(() => setWidth(percent), 120 + delay)
    return () => clearTimeout(t)
  }, [percent, delay])
  return (
    <div className="gm-bar-track">
      <div
        className="gm-bar-fill"
        style={{ width: `${width}%`, background: gradient, transitionDelay: `${delay}ms` }}
      />
    </div>
  )
}

// ─── Report count pill ────────────────────────────────────────────────────────
function CountPill({ value, label, color, icon }) {
  const IconComponent = icon
  return (
    <div className="gm-count-pill" style={{ '--cp-color': color, '--cp-bg': `${color}14`, '--cp-border': `${color}30` }}>
      <IconComponent width={11} height={11} style={{ color }}/>
      <span style={{ color }}>{value}</span>
      <span className="gm-count-label">{label}</span>
    </div>
  )
}

// ─── Hotspot card ─────────────────────────────────────────────────────────────
function HotspotCard({ spot, index }) {
  const [expanded, setExpanded] = useState(false)
  const sm = STATUS_META[spot.status] || STATUS_META['Under observation']
  const StatusIcon = sm.icon
  const total = spot.citizenReports + spot.municipalReports
  const citizenPct = Math.round((spot.citizenReports / total) * 100)

  return (
    <article className="gm-card" style={{ '--i': index }}>
      {/* Heat indicator stripe */}
      <div className="gm-heat-bar" style={{ opacity: Math.min(1, total / 20) }}/>

      <div className="gm-card-inner">
        {/* ── Header row ─────────────────────────── */}
        <div className="gm-card-top">
          {/* Rank badge */}
          <div className="gm-rank-badge">#{index + 1}</div>

          <div className="gm-card-title-block">
            <h3 className="gm-card-name">{spot.name}</h3>
            <div className="gm-card-loc">
              <Ic.mapPin width={11} height={11}/>
              <span>{spot.ward}</span>
              <span className="gm-sep">·</span>
              <span>{spot.zone} Zone</span>
            </div>
          </div>

          {/* Status badge */}
          <span
            className="gm-status-badge"
            style={{ background: sm.bg, border: `1px solid ${sm.border}`, color: sm.color }}
          >
            <StatusIcon width={10} height={10}/>
            {spot.status}
          </span>
        </div>

        {/* ── Report counts + bar ─────────────────── */}
        <div className="gm-counts-row">
          <CountPill value={spot.citizenReports}   label="citizen"   color="#f59e0b" icon={Ic.users}    />
          <CountPill value={spot.municipalReports}  label="municipal" color="#16a34a" icon={Ic.building} />
          <div className="gm-total-chip">
            <span className="gm-total-num">{total}</span>
            <span className="gm-total-label">total</span>
          </div>
        </div>

        {/* Split bar */}
        <div className="gm-split-track">
          <div
            className="gm-split-citizen"
            style={{ width: `${citizenPct}%` }}
            title={`Citizen: ${citizenPct}%`}
          />
          <div
            className="gm-split-municipal"
            style={{ width: `${100 - citizenPct}%` }}
            title={`Municipal: ${100 - citizenPct}%`}
          />
        </div>
        <div className="gm-split-legend">
          <span><span className="gm-dot" style={{ background: '#f59e0b' }}/> Citizen {citizenPct}%</span>
          <span><span className="gm-dot" style={{ background: '#16a34a' }}/> Municipal {100 - citizenPct}%</span>
        </div>

        {/* ── Time bands ──────────────────────────── */}
        <div className="gm-bands-row">
          {spot.timeBands.map(band => {
            const bm = BAND_META[band]
            const BandIcon = bm.icon
            return (
              <span key={band} className="gm-band-chip" style={{ '--bc': bm.color, '--bb': `${bm.color}28` }}>
                <BandIcon width={11} height={11}/>
                <span>{bm.label}</span>
                <span className="gm-band-sub">{bm.sub}</span>
              </span>
            )
          })}
        </div>

        {/* ── Expandable details ──────────────────── */}
        <button className="gm-expand-btn" onClick={() => setExpanded(v => !v)}>
          <span>{expanded ? 'Hide details' : 'Show details'}</span>
          <span className="gm-expand-arrow" style={{ transform: expanded ? 'rotate(180deg)' : 'none' }}>▾</span>
        </button>

        {expanded && (
          <div className="gm-details">
            <div className="gm-detail-row">
              <Ic.clock width={12} height={12} style={{ flexShrink: 0 }}/>
              <div>
                <span className="gm-detail-key">Peak window</span>
                <span className="gm-detail-val">{spot.mainWindow}</span>
              </div>
            </div>
            <div className="gm-detail-row">
              <Ic.checkCircle width={12} height={12} style={{ flexShrink: 0 }}/>
              <div>
                <span className="gm-detail-key">Last cleaned</span>
                <span className="gm-detail-val">{spot.lastCleaned}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </article>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function GarbageMonitoring() {
  const [sourceFilter, setSourceFilter] = useState('all')

  const filteredHotspots = useMemo(() => {
    return HOTSPOTS.filter(s => {
      if (sourceFilter === 'citizen')   return s.citizenReports > 0
      if (sourceFilter === 'municipal') return s.municipalReports > 0
      return true
    })
  }, [sourceFilter])

  const bandStats = useMemo(() => {
    const base = { morning: 0, afternoon: 0, night: 0 }
    filteredHotspots.forEach(s => s.timeBands.forEach(b => { if (b in base) base[b]++ }))
    return base
  }, [filteredHotspots])

  const maxBand = Math.max(...Object.values(bandStats), 1)

  const totals = useMemo(() => filteredHotspots.reduce(
    (a, s) => { a.citizen += s.citizenReports; a.municipal += s.municipalReports; return a },
    { citizen: 0, municipal: 0 }
  ), [filteredHotspots])

  return (
    <>
      <style>{GM_CSS}</style>
      <div className="gm-root">

        {/* ── Page header ─────────────────────────── */}
        <div className="gm-page-header">
          <div className="gm-header-text">
            <h2 className="gm-page-title">Garbage Hotspots &amp; Dumping Patterns</h2>
            <p className="gm-page-sub">
              Combined view of citizen complaints and municipal field reports — identify where and when garbage is dumped to plan targeted cleaning rounds.
            </p>
          </div>

          <div className="gm-header-stats">
            <div className="gm-stat-card">
              <div className="gm-stat-icon" style={{ background: 'rgba(100,116,139,0.1)', color: '#64748b' }}>
                <Ic.trash width={14} height={14}/>
              </div>
              <div>
                <div className="gm-stat-num">{filteredHotspots.length}</div>
                <div className="gm-stat-label">Active hotspots</div>
              </div>
            </div>
            <div className="gm-stat-card">
              <div className="gm-stat-icon" style={{ background: 'rgba(245,158,11,0.15)', color: '#b45309' }}>
                <Ic.users width={14} height={14}/>
              </div>
              <div>
                <div className="gm-stat-num" style={{ color: '#b45309' }}>{totals.citizen}</div>
                <div className="gm-stat-label">Citizen reports</div>
              </div>
            </div>
            <div className="gm-stat-card">
              <div className="gm-stat-icon" style={{ background: 'rgba(22,163,74,0.12)', color: '#166534' }}>
                <Ic.building width={14} height={14}/>
              </div>
              <div>
                <div className="gm-stat-num" style={{ color: '#166534' }}>{totals.municipal}</div>
                <div className="gm-stat-label">Municipal reports</div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Filter strip ────────────────────────── */}
        <div className="gm-filter-strip">
          <div className="gm-filter-icon">
            <Ic.filter width={12} height={12}/>
            <span>Source</span>
          </div>
          <div className="gm-filter-tabs">
            {SOURCE_FILTERS.map(f => (
              <button
                key={f.id}
                className={`gm-filter-tab${sourceFilter === f.id ? ' gm-filter-active' : ''}`}
                onClick={() => setSourceFilter(f.id)}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Main grid ───────────────────────────── */}
        <div className="gm-grid">

          {/* Left – hotspot list */}
          <div className="gm-left">
            {filteredHotspots.length === 0 ? (
              <div className="gm-empty">No hotspots match the selected filters.</div>
            ) : (
              filteredHotspots.map((spot, i) => (
                <HotspotCard key={spot.id} spot={spot} index={i}/>
              ))
            )}
          </div>

          {/* Right – panels */}
          <div className="gm-right">

            {/* Time-of-day panel */}
            <div className="gm-panel">
              <div className="gm-panel-header">
                <div className="gm-panel-icon-wrap">
                  <Ic.clock width={14} height={14}/>
                </div>
                <div>
                  <h3 className="gm-panel-title">Dumping Time Patterns</h3>
                  <p className="gm-panel-sub">Peak activity windows across hotspots</p>
                </div>
                <Ic.alert width={14} height={14} style={{ color: '#b45309', marginLeft: 'auto', flexShrink: 0 }}/>
              </div>

              <div className="gm-time-bars">
                {Object.entries(BAND_META).map(([band, bm], i) => {
                  const BandIcon = bm.icon
                  const count = bandStats[band] ?? 0
                  const pct = Math.max(8, (count / maxBand) * 100)
                  return (
                    <div key={band} className="gm-time-row">
                      <div className="gm-time-left">
                        <div className="gm-time-icon" style={{ background: `${bm.color}18`, color: bm.color }}>
                          <BandIcon width={12} height={12}/>
                        </div>
                        <div>
                          <div className="gm-time-label">{bm.label}</div>
                          <div className="gm-time-sub">{bm.sub}</div>
                        </div>
                      </div>
                      <div className="gm-time-right">
                        <AnimBar percent={pct} gradient={bm.gradient} delay={i * 100}/>
                        <span className="gm-time-count" style={{ color: bm.color }}>{count}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Zone distribution mini-chart */}
            <div className="gm-panel">
              <div className="gm-panel-header">
                <div className="gm-panel-icon-wrap">
                  <Ic.mapPin width={14} height={14}/>
                </div>
                <div>
                  <h3 className="gm-panel-title">Zone Distribution</h3>
                  <p className="gm-panel-sub">Report density by zone</p>
                </div>
              </div>
              <div className="gm-zone-list">
                {filteredHotspots.map((spot, i) => {
                  const total = spot.citizenReports + spot.municipalReports
                  const maxTotal = Math.max(...filteredHotspots.map(s => s.citizenReports + s.municipalReports), 1)
                  const pct = Math.max(6, (total / maxTotal) * 100)
                  return (
                    <div key={spot.id} className="gm-zone-row" style={{ '--i': i }}>
                      <span className="gm-zone-name">{spot.zone}</span>
                      <div className="gm-zone-bar-wrap">
                        <AnimBar percent={pct} gradient="linear-gradient(90deg,#f59e0b,#16a34a)" delay={i * 60}/>
                      </div>
                      <span className="gm-zone-count">{total}</span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Planning notes */}
            <div className="gm-panel gm-notes-panel">
              <div className="gm-panel-header">
                <div className="gm-panel-icon-wrap" style={{ background: 'rgba(245,158,11,0.14)', color: '#b45309' }}>
                  <Ic.zap width={14} height={14}/>
                </div>
                <div>
                  <h3 className="gm-panel-title">Action Planning</h3>
                  <p className="gm-panel-sub">Recommended next steps</p>
                </div>
              </div>
              <ul className="gm-notes-list">
                <li className="gm-note-item" style={{ '--ni': 0 }}>
                  <span className="gm-note-dot" style={{ background: '#f59e0b' }}/>
                  Use morning and night peaks to schedule targeted patrols at high-activity hotspots.
                </li>
                <li className="gm-note-item" style={{ '--ni': 1 }}>
                  <span className="gm-note-dot" style={{ background: '#f59e0b' }}/>
                  Combine citizen and municipal reports to confirm repeat dumping locations.
                </li>
                <li className="gm-note-item" style={{ '--ni': 2 }}>
                  <span className="gm-note-dot" style={{ background: '#16a34a' }}/>
                  Share this view with ward officers during daily briefings for action planning.
                </li>
              </ul>
            </div>

          </div>
        </div>
      </div>
    </>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// CSS
// ─────────────────────────────────────────────────────────────────────────────
const GM_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap');

  /* ── TOKENS ──────────────────────────────────── */
  [data-jatayu-theme="light"] .gm-root,
  .gm-root {
    --gm-bg:              transparent;
    --gm-card-bg:         #ffffff;
    --gm-card-border:     rgba(226,232,240,0.9);
    --gm-card-shadow:     0 1px 4px rgba(15,23,42,0.05), 0 4px 16px rgba(15,23,42,0.06);
    --gm-card-hover-shadow: 0 4px 12px rgba(15,23,42,0.08), 0 12px 32px rgba(15,23,42,0.1);
    --gm-card-hover-border: rgba(245,158,11,0.35);
    --gm-panel-bg:        #ffffff;
    --gm-panel-border:    rgba(226,232,240,0.9);
    --gm-panel-shadow:    0 1px 4px rgba(15,23,42,0.04), 0 4px 12px rgba(15,23,42,0.05);
    --gm-title:           #0f172a;
    --gm-sub:             #64748b;
    --gm-text:            #334155;
    --gm-muted:           #94a3b8;
    --gm-rank-bg:         #f1f5f9;
    --gm-rank-border:     #e2e8f0;
    --gm-rank-text:       #64748b;
    --gm-split-track:     #f1f5f9;
    --gm-legend-text:     #94a3b8;
    --gm-band-border:     rgba(226,232,240,0.9);
    --gm-detail-key:      #94a3b8;
    --gm-detail-val:      #334155;
    --gm-detail-bg:       #f8fafc;
    --gm-detail-border:   rgba(226,232,240,0.7);
    --gm-expand-text:     #b45309;
    --gm-expand-bg:       rgba(245,158,11,0.1);
    --gm-stat-bg:         #f8fafc;
    --gm-stat-border:     rgba(226,232,240,0.8);
    --gm-stat-num:        #0f172a;
    --gm-stat-label:      #94a3b8;
    --gm-filter-bg:       #f1f5f9;
    --gm-filter-border:   rgba(226,232,240,0.8);
    --gm-filter-text:     #64748b;
    --gm-filter-active-bg: #f59e0b;
    --gm-filter-active-text: #ffffff;
    --gm-bar-track:       #f1f5f9;
    --gm-panel-icon-bg:   rgba(245,158,11,0.12);
    --gm-panel-icon-text: #b45309;
    --gm-time-label:      #334155;
    --gm-time-sub:        #94a3b8;
    --gm-zone-name:       #64748b;
    --gm-zone-count:      #334155;
    --gm-note-text:       #475569;
    --gm-heat-color:      rgba(239,68,68,0.04);
    --gm-total-bg:        #f1f5f9;
    --gm-total-border:    rgba(226,232,240,0.9);
    --gm-total-text:      #334155;
    --gm-empty-bg:        #f8fafc;
    --gm-empty-border:    rgba(226,232,240,0.8);
  }

  [data-jatayu-theme="dark"] .gm-root {
    --gm-bg:              transparent;
    --gm-card-bg:         #0f1623;
    --gm-card-border:     rgba(255,255,255,0.06);
    --gm-card-shadow:     0 1px 4px rgba(0,0,0,0.3), 0 4px 20px rgba(0,0,0,0.2);
    --gm-card-hover-shadow: 0 4px 12px rgba(0,0,0,0.4), 0 12px 32px rgba(0,0,0,0.3);
    --gm-card-hover-border: rgba(245,158,11,0.38);
    --gm-panel-bg:        #0f1623;
    --gm-panel-border:    rgba(255,255,255,0.06);
    --gm-panel-shadow:    0 1px 4px rgba(0,0,0,0.3), 0 4px 12px rgba(0,0,0,0.2);
    --gm-title:           #f1f5f9;
    --gm-sub:             #64748b;
    --gm-text:            #cbd5e1;
    --gm-muted:           #475569;
    --gm-rank-bg:         rgba(255,255,255,0.04);
    --gm-rank-border:     rgba(255,255,255,0.07);
    --gm-rank-text:       #475569;
    --gm-split-track:     rgba(255,255,255,0.04);
    --gm-legend-text:     #475569;
    --gm-band-border:     rgba(255,255,255,0.07);
    --gm-detail-key:      #475569;
    --gm-detail-val:      #94a3b8;
    --gm-detail-bg:       rgba(255,255,255,0.02);
    --gm-detail-border:   rgba(255,255,255,0.05);
    --gm-expand-text:     #fbbf24;
    --gm-expand-bg:       rgba(245,158,11,0.18);
    --gm-stat-bg:         rgba(255,255,255,0.03);
    --gm-stat-border:     rgba(255,255,255,0.07);
    --gm-stat-num:        #f1f5f9;
    --gm-stat-label:      #475569;
    --gm-filter-bg:       rgba(255,255,255,0.04);
    --gm-filter-border:   rgba(255,255,255,0.07);
    --gm-filter-text:     #475569;
    --gm-filter-active-bg: #f59e0b;
    --gm-filter-active-text: #ffffff;
    --gm-bar-track:       rgba(255,255,255,0.05);
    --gm-panel-icon-bg:   rgba(245,158,11,0.2);
    --gm-panel-icon-text: #fbbf24;
    --gm-time-label:      #94a3b8;
    --gm-time-sub:        #475569;
    --gm-zone-name:       #475569;
    --gm-zone-count:      #94a3b8;
    --gm-note-text:       #64748b;
    --gm-heat-color:      rgba(239,68,68,0.06);
    --gm-total-bg:        rgba(255,255,255,0.03);
    --gm-total-border:    rgba(255,255,255,0.07);
    --gm-total-text:      #94a3b8;
    --gm-empty-bg:        rgba(255,255,255,0.02);
    --gm-empty-border:    rgba(255,255,255,0.06);
  }

  /* ── KEYFRAMES ────────────────────────────────── */
  @keyframes gm-card-in {
    from { opacity:0; transform:translateY(12px); }
    to   { opacity:1; transform:translateY(0); }
  }
  @keyframes gm-fade-in {
    from { opacity:0; }
    to   { opacity:1; }
  }
  @keyframes gm-details-in {
    from { opacity:0; transform:translateY(-6px); }
    to   { opacity:1; transform:translateY(0); }
  }
  @keyframes gm-note-in {
    from { opacity:0; transform:translateX(-8px); }
    to   { opacity:1; transform:translateX(0); }
  }
  @keyframes gm-bar-grow {
    from { width: 0 !important; }
  }

  /* ── ROOT ─────────────────────────────────────── */
  .gm-root {
    font-family: 'Poppins', sans-serif;
    display: flex;
    flex-direction: column;
    gap: 18px;
    background: var(--gm-bg);
  }

  /* ── PAGE HEADER ──────────────────────────────── */
  .gm-page-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 20px;
    flex-wrap: wrap;
    animation: gm-fade-in 0.35s ease both;
  }

  .gm-page-title {
    font-family: 'Poppins', sans-serif;
    font-size: 26px;
    font-weight: 800;
    color: #000000;
    letter-spacing: -0.2px;
    margin: 0;
    transition: color 0.3s;
  }

  .gm-page-sub {
    margin-top: 5px;
    font-size: 15px;
    line-height: 1.6;
    color: #475569;
    font-weight: 500;
    max-width: 520px;
    transition: color 0.3s;
  }

  .gm-header-stats {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
    flex-shrink: 0;
  }

  .gm-stat-card {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 14px;
    border-radius: 12px;
    background: var(--gm-stat-bg);
    border: 1px solid var(--gm-stat-border);
    transition: all 0.3s;
    animation: gm-fade-in 0.4s 0.1s both;
  }

  .gm-stat-icon {
    width: 30px; height: 30px;
    border-radius: 8px;
    display: flex; align-items:center; justify-content:center;
    flex-shrink: 0;
  }

  .gm-stat-num {
    font-family: 'Poppins', sans-serif;
    font-size: 24px;
    font-weight: 800;
    color: #000000;
    line-height: 1;
    transition: color 0.3s;
  }

  .gm-stat-label {
    font-size: 11px;
    color: var(--gm-stat-label);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-top: 1px;
    transition: color 0.3s;
  }

  /* ── FILTER STRIP ─────────────────────────────── */
  .gm-filter-strip {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
    animation: gm-fade-in 0.4s 0.05s both;
  }

  .gm-filter-icon {
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.6px;
    color: var(--gm-muted);
    flex-shrink: 0;
    transition: color 0.3s;
  }

  .gm-filter-tabs {
    display: flex;
    background: var(--gm-filter-bg);
    border: 1px solid var(--gm-filter-border);
    border-radius: 10px;
    padding: 3px;
    gap: 2px;
    transition: background 0.3s, border-color 0.3s;
  }

  .gm-filter-tab {
    padding: 5px 14px;
    border-radius: 7px;
    border: none;
    background: transparent;
    color: #333333;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    font-family: 'Poppins', sans-serif;
    transition: all 0.2s ease;
    white-space: nowrap;
  }

  .gm-filter-tab:hover:not(.gm-filter-active) {
    color: var(--gm-title);
  }

  .gm-filter-active {
    background: var(--gm-filter-active-bg);
    color: var(--gm-filter-active-text);
    font-weight: 600;
    box-shadow: 0 1px 4px rgba(79,70,229,0.3);
  }

  /* ── GRID ─────────────────────────────────────── */
  .gm-grid {
    display: grid;
    grid-template-columns: minmax(0, 1.8fr) minmax(0, 1fr);
    gap: 14px;
    align-items: start;
  }

  @media (max-width: 860px) {
    .gm-grid { grid-template-columns: 1fr; }
  }

  .gm-left, .gm-right {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .gm-empty {
    padding: 32px;
    text-align: center;
    font-size: 14px;
    color: var(--gm-muted);
    background: var(--gm-empty-bg);
    border: 1px dashed var(--gm-empty-border);
    border-radius: 14px;
    transition: all 0.3s;
  }

  /* ── HOTSPOT CARD ─────────────────────────────── */
  .gm-card {
    position: relative;
    background: var(--gm-card-bg);
    border: 1px solid var(--gm-card-border);
    border-radius: 16px;
    box-shadow: var(--gm-card-shadow);
    overflow: hidden;
    transition: border-color 0.25s, box-shadow 0.25s, transform 0.2s;
    animation: gm-card-in 0.4s calc(var(--i, 0) * 0.07s + 0.1s) cubic-bezier(0.22,1,0.36,1) both;
  }

  .gm-card:hover {
    border-color: var(--gm-card-hover-border);
    box-shadow: var(--gm-card-hover-shadow);
    transform: translateY(-1px);
  }

  /* Heat bar (subtle reddish bg, more intense for high-report items) */
  .gm-heat-bar {
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 3px;
    background: linear-gradient(90deg, #ef4444, #f97316);
    pointer-events: none;
    transition: opacity 0.3s;
  }

  .gm-card-inner {
    padding: 14px 16px 12px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  /* ── CARD TOP ─────────────────────────────────── */
  .gm-card-top {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    flex-wrap: wrap;
  }

  .gm-rank-badge {
    font-family: 'Poppins', sans-serif;
    font-size: 11px;
    font-weight: 700;
    padding: 4px 8px;
    border-radius: 7px;
    background: var(--gm-rank-bg);
    border: 1px solid var(--gm-rank-border);
    color: var(--gm-rank-text);
    flex-shrink: 0;
    line-height: 1;
    transition: all 0.3s;
  }

  .gm-card-title-block {
    flex: 1;
    min-width: 0;
  }

  .gm-card-name {
    font-family: 'Poppins', sans-serif;
    font-size: 16px;
    font-weight: 700;
    color: #000000;
    letter-spacing: 0px;
    line-height: 1.25;
    margin: 0;
    transition: color 0.3s;
  }

  .gm-card-loc {
    display: flex;
    align-items: center;
    gap: 4px;
    margin-top: 3px;
    font-size: 12px;
    color: #555555;
    font-weight: 500;
    transition: color 0.3s;
  }

  .gm-sep { opacity: 0.4; }

  .gm-status-badge {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    font-weight: 600;
    padding: 4px 10px;
    border-radius: 999px;
    white-space: nowrap;
    flex-shrink: 0;
    transition: all 0.3s;
  }

  /* ── COUNT PILLS ──────────────────────────────── */
  .gm-counts-row {
    display: flex;
    align-items: center;
    gap: 7px;
    flex-wrap: wrap;
  }

  .gm-count-pill {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 4px 10px;
    border-radius: 999px;
    background: var(--cp-bg);
    border: 1px solid var(--cp-border);
    font-size: 12px;
    font-weight: 600;
    flex-shrink: 0;
    transition: all 0.2s;
  }

  .gm-count-label {
    font-weight: 400;
    opacity: 0.7;
  }

  .gm-total-chip {
    display: flex;
    align-items: baseline;
    gap: 3px;
    margin-left: auto;
    background: var(--gm-total-bg);
    border: 1px solid var(--gm-total-border);
    padding: 4px 10px;
    border-radius: 8px;
    transition: all 0.3s;
  }

  .gm-total-num {
    font-family: 'Poppins', sans-serif;
    font-size: 20px;
    font-weight: 800;
    color: #000000;
    line-height: 1;
    transition: color 0.3s;
  }

  .gm-total-label {
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.6px;
    color: #666666;
    font-weight: 600;
    transition: color 0.3s;
  }

  /* ── SPLIT BAR ────────────────────────────────── */
  .gm-split-track {
    height: 6px;
    border-radius: 999px;
    background: var(--gm-split-track);
    display: flex;
    overflow: hidden;
    gap: 1px;
    transition: background 0.3s;
  }

  .gm-split-citizen {
    height: 100%;
    background: #f59e0b;
    border-radius: 999px 0 0 999px;
    transition: width 0.7s cubic-bezier(0.22,1,0.36,1);
    min-width: 4px;
  }

  .gm-split-municipal {
    height: 100%;
    background: #10b981;
    border-radius: 0 999px 999px 0;
    transition: width 0.7s cubic-bezier(0.22,1,0.36,1);
    min-width: 4px;
    flex: 1;
  }

  .gm-split-legend {
    display: flex;
    gap: 14px;
    font-size: 11px;
    color: var(--gm-legend-text);
    transition: color 0.3s;
  }

  .gm-split-legend span {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .gm-dot {
    width: 7px; height: 7px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  /* ── TIME BANDS ───────────────────────────────── */
  .gm-bands-row {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
  }

  .gm-band-chip {
    display: flex;
    align-items: center;
    gap: 5px;
    padding: 4px 10px;
    border-radius: 8px;
    background: var(--bb);
    border: 1px solid var(--gm-band-border);
    font-size: 12px;
    font-weight: 500;
    color: var(--bc);
    transition: all 0.2s;
  }

  .gm-band-sub {
    font-size: 10.5px;
    opacity: 0.65;
  }

  /* ── EXPAND / DETAILS ─────────────────────────── */
  .gm-expand-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 5px;
    width: 100%;
    padding: 6px;
    border: none;
    background: var(--gm-expand-bg);
    border-radius: 8px;
    color: #b45309;
    font-size: 12.5px;
    font-weight: 700;
    cursor: pointer;
    font-family: 'Poppins', sans-serif;
    transition: all 0.2s ease;
  }
  .gm-expand-btn:hover { opacity: 0.8; }

  .gm-expand-arrow {
    display: inline-block;
    transition: transform 0.25s ease;
    font-size: 10px;
  }

  .gm-details {
    display: flex;
    flex-direction: column;
    gap: 7px;
    padding: 10px 12px;
    border-radius: 10px;
    background: var(--gm-detail-bg);
    border: 1px solid var(--gm-detail-border);
    animation: gm-details-in 0.25s ease both;
    transition: background 0.3s, border-color 0.3s;
  }

  .gm-detail-row {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    color: var(--gm-muted);
    font-size: 12.5px;
  }

  .gm-detail-row > div {
    display: flex;
    flex-direction: column;
    gap: 1px;
  }

  .gm-detail-key {
    font-size: 10.5px;
    text-transform: uppercase;
    letter-spacing: 0.6px;
    color: var(--gm-detail-key);
    transition: color 0.3s;
  }

  .gm-detail-val {
    font-size: 13px;
    font-weight: 600;
    color: #333333;
    transition: color 0.3s;
  }

  /* ── PANEL ────────────────────────────────────── */
  .gm-panel {
    background: var(--gm-panel-bg);
    border: 1px solid var(--gm-panel-border);
    border-radius: 16px;
    box-shadow: var(--gm-panel-shadow);
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 14px;
    transition: background 0.4s, border-color 0.4s;
    animation: gm-fade-in 0.4s 0.15s both;
  }

  .gm-panel-header {
    display: flex;
    align-items: flex-start;
    gap: 10px;
  }

  .gm-panel-icon-wrap {
    width: 30px; height: 30px;
    border-radius: 8px;
    background: var(--gm-panel-icon-bg);
    color: var(--gm-panel-icon-text);
    display: flex; align-items:center; justify-content:center;
    flex-shrink: 0;
    transition: all 0.3s;
  }

  .gm-panel-title {
    font-family: 'Poppins', sans-serif;
    font-size: 16px;
    font-weight: 700;
    color: #000000;
    letter-spacing: 0px;
    margin: 0;
    line-height: 1.2;
    transition: color 0.3s;
  }

  .gm-panel-sub {
    font-size: 12px;
    color: #666666;
    font-weight: 500;
    margin-top: 2px;
    transition: color 0.3s;
  }

  /* ── TIME BARS ────────────────────────────────── */
  .gm-time-bars {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .gm-time-row {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .gm-time-left {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100px;
    flex-shrink: 0;
  }

  .gm-time-icon {
    width: 26px; height: 26px;
    border-radius: 7px;
    display: flex; align-items:center; justify-content:center;
    flex-shrink: 0;
    transition: all 0.3s;
  }

  .gm-time-label {
    font-size: 13px;
    font-weight: 700;
    color: #333333;
    line-height: 1;
    transition: color 0.3s;
  }

  .gm-time-sub {
    font-size: 10.5px;
    color: var(--gm-time-sub);
    margin-top: 1px;
    transition: color 0.3s;
  }

  .gm-time-right {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
  }

  .gm-time-count {
    font-family: 'Poppins', sans-serif;
    font-size: 16px;
    font-weight: 800;
    color: #000000;
    flex-shrink: 0;
    width: 20px;
    text-align: right;
  }

  /* ── BAR ──────────────────────────────────────── */
  .gm-bar-track {
    flex: 1;
    height: 8px;
    border-radius: 999px;
    background: var(--gm-bar-track);
    overflow: hidden;
    transition: background 0.3s;
  }

  .gm-bar-fill {
    height: 100%;
    border-radius: 999px;
    transition: width 0.7s cubic-bezier(0.22,1,0.36,1);
  }

  /* ── ZONE LIST ────────────────────────────────── */
  .gm-zone-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .gm-zone-row {
    display: flex;
    align-items: center;
    gap: 8px;
    animation: gm-fade-in 0.35s calc(var(--i, 0) * 0.05s + 0.2s) both;
  }

  .gm-zone-name {
    font-size: 12px;
    font-weight: 600;
    color: var(--gm-zone-name);
    width: 56px;
    flex-shrink: 0;
    text-transform: uppercase;
    letter-spacing: 0.4px;
    transition: color 0.3s;
  }

  .gm-zone-bar-wrap {
    flex: 1;
  }

  .gm-zone-count {
    font-family: 'Poppins', sans-serif;
    font-size: 14px;
    font-weight: 700;
    color: #333333;
    width: 24px;
    text-align: right;
    flex-shrink: 0;
    transition: color 0.3s;
  }

  /* ── NOTES ────────────────────────────────────── */
  .gm-notes-panel { }

  .gm-notes-list {
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 0;
    margin: 0;
  }

  .gm-note-item {
    display: flex;
    align-items: flex-start;
    gap: 9px;
    font-size: 13px;
    line-height: 1.6;
    color: #333333;
    font-weight: 500;
    animation: gm-note-in 0.4s calc(var(--ni, 0) * 0.08s + 0.25s) both;
    transition: color 0.3s;
  }

  .gm-note-dot {
    width: 7px; height: 7px;
    border-radius: 50%;
    flex-shrink: 0;
    margin-top: 5px;
  }
`