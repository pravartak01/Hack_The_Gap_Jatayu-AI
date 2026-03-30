import React, { useState, useEffect } from 'react'

// ─── Data ─────────────────────────────────────────────────────────────────────
const DEPARTMENTS = ['Police', 'Fire', 'Municipal', 'Traffic', 'Admin']

const NETWORK_CAMERAS = [
  {
    id: 'net-01',
    name: 'Crossroad Junction – North',
    location: 'Ward 12, Junction 4',
    status: 'Online',
    lastSeen: 'Live now',
    streamId: 'STR-01',
    uptime: '99.8%',
    fps: 30,
    res: '1080p',
    bitrate: '4.2 Mbps',
  },
  {
    id: 'net-02',
    name: 'Market Street – Central',
    location: 'Main market, Block C',
    status: 'Online',
    lastSeen: 'Live now',
    streamId: 'STR-08',
    uptime: '98.1%',
    fps: 25,
    res: '1080p',
    bitrate: '3.8 Mbps',
  },
  {
    id: 'net-03',
    name: 'Bus Depot – Entry Gate',
    location: 'Transport hub, Gate 2',
    status: 'Degraded',
    lastSeen: 'Signal weak · 1m ago',
    streamId: 'STR-12',
    uptime: '72.4%',
    fps: 8,
    res: '480p',
    bitrate: '0.9 Mbps',
  },
  {
    id: 'net-04',
    name: 'Hospital – Emergency Bay',
    location: 'City hospital, rear wing',
    status: 'Online',
    lastSeen: 'Live now',
    streamId: 'STR-15',
    uptime: '99.9%',
    fps: 30,
    res: '4K',
    bitrate: '12.1 Mbps',
  },
  {
    id: 'net-05',
    name: 'Industrial Area – Gate B',
    location: 'Industrial estate, Sector 3',
    status: 'Offline',
    lastSeen: 'No signal · 6m ago',
    streamId: 'STR-21',
    uptime: '0%',
    fps: 0,
    res: '—',
    bitrate: '—',
  },
  {
    id: 'net-06',
    name: 'School Zone – South Road',
    location: 'School cluster, South lane',
    status: 'Online',
    lastSeen: 'Live now',
    streamId: 'STR-27',
    uptime: '97.3%',
    fps: 25,
    res: '1080p',
    bitrate: '3.5 Mbps',
  },
]

// ─── Status config ────────────────────────────────────────────────────────────
const statusConfig = {
  Online:   { color: '#10b981', glow: 'rgba(16,185,129,0.2)',  badge: 'cn-badge-online',   label: 'ONLINE',   scanColor: '#10b981' },
  Degraded: { color: '#f59e0b', glow: 'rgba(245,158,11,0.18)', badge: 'cn-badge-degraded', label: 'DEGRADED', scanColor: '#f59e0b' },
  Offline:  { color: '#ef4444', glow: 'rgba(239,68,68,0.18)',  badge: 'cn-badge-offline',  label: 'OFFLINE',  scanColor: '#334155' },
}

// ─── Icons ────────────────────────────────────────────────────────────────────
const MaximizeIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8 3H5a2 2 0 00-2 2v3m18 0V5a2 2 0 00-2-2h-3m0 18h3a2 2 0 002-2v-3M3 16v3a2 2 0 002 2h3"/>
  </svg>
)
const MapPinIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
  </svg>
)
const XIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
)
const WifiIcon = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12.55a11 11 0 0114.08 0"/><path d="M1.42 9a16 16 0 0121.16 0"/><path d="M8.53 16.11a6 6 0 016.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/>
  </svg>
)
const RadioIcon = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12.55a11 11 0 0114.08 0"/><path d="M1.42 9a16 16 0 0121.16 0"/><line x1="12" y1="20" x2="12.01" y2="20"/>
  </svg>
)
const PowerIcon = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18.36 6.64a9 9 0 11-12.73 0"/><line x1="12" y1="2" x2="12" y2="12"/>
  </svg>
)
const ActivityIcon = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
  </svg>
)
const UsersIcon = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>
  </svg>
)
const CameraIcon = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/>
    <circle cx="12" cy="13" r="4"/>
  </svg>
)
const GridIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
  </svg>
)

// ─── Scan overlay (same as LiveAlertsCommand) ─────────────────────────────────
const ScanOverlay = ({ color, active }) => (
  <div className="cn-scan-wrap" aria-hidden>
    {active && <div className="cn-scan-line" style={{ '--scan-color': color }} />}
    <div className="cn-scan-corner cn-corner-tl" style={{ borderColor: color + 'cc' }} />
    <div className="cn-scan-corner cn-corner-tr" style={{ borderColor: color + 'cc' }} />
    <div className="cn-scan-corner cn-corner-bl" style={{ borderColor: color + 'cc' }} />
    <div className="cn-scan-corner cn-corner-br" style={{ borderColor: color + 'cc' }} />
    <div className="cn-scan-grid" />
  </div>
)

// ─── Signal strength bars ─────────────────────────────────────────────────────
const SignalBars = ({ status }) => {
  const levels = status === 'Online' ? 4 : status === 'Degraded' ? 2 : 0
  const color = statusConfig[status].color
  return (
    <div className="cn-signal-bars">
      {[1, 2, 3, 4].map(i => (
        <div
          key={i}
          className="cn-signal-bar"
          style={{
            height: `${i * 3 + 3}px`,
            background: i <= levels ? color : 'var(--cn-bar-inactive)',
            boxShadow: i <= levels ? `0 0 4px ${color}80` : 'none',
            transition: `background 0.4s ${i * 0.05}s`,
          }}
        />
      ))}
    </div>
  )
}

// ─── Uptime mini-chart ────────────────────────────────────────────────────────
const UptimeSparkline = ({ status }) => {
  const bars = 12
  const color = statusConfig[status].color
  return (
    <div className="cn-sparkline">
      {[...Array(bars)].map((_, i) => {
        const isDown = status === 'Offline' || (status === 'Degraded' && (i === 7 || i === 9))
        const h = isDown ? 3 : Math.floor(Math.random() * 10 + 6)
        return (
          <div
            key={i}
            className="cn-spark-bar"
            style={{
              height: `${h}px`,
              background: isDown ? 'var(--cn-bar-inactive)' : color + '99',
              animationDelay: `${i * 0.04}s`,
            }}
          />
        )
      })}
    </div>
  )
}

// ─── Stat pill ────────────────────────────────────────────────────────────────
const StatPill = ({ label, value, mono }) => (
  <div className="cn-stat-pill">
    <span className="cn-stat-label">{label}</span>
    <span className={`cn-stat-val${mono ? ' cn-mono' : ''}`}>{value}</span>
  </div>
)

// ─── Camera card ──────────────────────────────────────────────────────────────
const CameraCard = ({ camera, index, onExpand, assignedTo, onAssign }) => {
  const cfg = statusConfig[camera.status]
  const assigned = assignedTo[camera.id]
  const isOnline = camera.status === 'Online'
  const isOffline = camera.status === 'Offline'

  return (
    <article
      className="cn-card"
      style={{ animationDelay: `${index * 0.07}s`, '--glow': cfg.glow }}
    >
      {/* Top row */}
      <div className="cn-card-top">
        <div className="cn-card-meta">
          <span className="cn-stream-id cn-mono">{camera.streamId}</span>
        </div>
        <span className={`cn-badge ${cfg.badge}`}>
          <span className="cn-badge-dot" style={{ background: cfg.color, boxShadow: `0 0 5px ${cfg.color}` }} />
          {cfg.label}
        </span>
      </div>

      {/* Viewport */}
      <div className="cn-viewport">
        <div className="cn-noise" />
        <div className={`cn-feed-bg${isOffline ? ' cn-feed-offline' : ''}`} />
        <ScanOverlay color={cfg.scanColor} active={isOnline} />

        {/* Offline overlay */}
        {isOffline && (
          <div className="cn-offline-overlay">
            <PowerIcon />
            <span className="cn-mono">NO SIGNAL</span>
          </div>
        )}

        {/* Degraded overlay */}
        {camera.status === 'Degraded' && (
          <div className="cn-degraded-overlay">
            <span className="cn-mono cn-blink">WEAK SIGNAL</span>
          </div>
        )}

        {/* Status pill */}
        {!isOffline && (
          <div className="cn-status-pill" style={{ background: cfg.color + 'ee' }}>
            <span className="cn-status-dot" style={{ background: '#fff', animationPlayState: isOnline ? 'running' : 'paused' }} />
            {isOnline ? 'LIVE' : 'DEGRADED'}
          </div>
        )}

        {/* FPS counter */}
        {!isOffline && (
          <div className="cn-fps-tag cn-mono">{camera.fps} FPS</div>
        )}

        {/* Expand */}
        <button className="cn-expand-btn" onClick={() => onExpand(camera)} aria-label="Expand">
          <MaximizeIcon />
        </button>

        {/* Timestamp */}
        <div className="cn-timestamp cn-mono">
          {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </div>
      </div>

      {/* Camera name + location */}
      <div className="cn-title-block">
        <div className="cn-title-row">
          <p className="cn-cam-name">{camera.name}</p>
          <SignalBars status={camera.status} />
        </div>
        <p className="cn-cam-location">
          <MapPinIcon />
          {camera.location}
        </p>
      </div>

      {/* Stats strip */}
      <div className="cn-stats-strip">
        <StatPill label="Uptime" value={camera.uptime} mono />
        <StatPill label="Res" value={camera.res} mono />
        <StatPill label="Bitrate" value={camera.bitrate} mono />
        <div className="cn-sparkline-wrap">
          <UptimeSparkline status={camera.status} />
        </div>
      </div>

      {/* Footer */}
      <div className="cn-footer">
        <div className="cn-footer-left">
          <ActivityIcon />
          <span className="cn-last-seen cn-mono">{camera.lastSeen}</span>
        </div>
        <button className="cn-locate-btn">
          <MapPinIcon />
          Locate
        </button>
      </div>

      {/* Assign row */}
      <div className="cn-assign-row">
        <div className="cn-assign-label">
          <UsersIcon />
          <span>{assigned ? `→ ${assigned}` : 'Route to'}</span>
        </div>
        <div className="cn-dept-pills">
          {DEPARTMENTS.map(dept => (
            <button
              key={dept}
              className={`cn-dept-btn${assigned === dept ? ' cn-dept-active' : ''}`}
              onClick={() => onAssign(camera.id, dept)}
            >
              {dept}
            </button>
          ))}
        </div>
      </div>
    </article>
  )
}

// ─── Fullscreen modal ─────────────────────────────────────────────────────────
const FullscreenModal = ({ camera, onClose }) => {
  const cfg = statusConfig[camera.status]
  const isOffline = camera.status === 'Offline'

  useEffect(() => {
    const h = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose])

  return (
    <div className="cn-modal-backdrop" onClick={onClose}>
      <div className="cn-modal" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="cn-modal-header">
          <div className="cn-modal-title-group">
            <span className={`cn-badge ${cfg.badge}`} style={{ fontSize: '10px' }}>
              <span className="cn-badge-dot" style={{ background: cfg.color, boxShadow: `0 0 6px ${cfg.color}` }} />
              {cfg.label}
            </span>
            <div>
              <p className="cn-modal-cam-name">{camera.name}</p>
              <p className="cn-modal-cam-loc">
                <MapPinIcon />
                {camera.location}&nbsp;·&nbsp;{camera.streamId}
              </p>
            </div>
          </div>
          <div className="cn-modal-header-right">
            {!isOffline && (
              <div className="cn-status-pill cn-status-pill-lg" style={{ background: cfg.color + 'ee', position: 'static' }}>
                <span className="cn-status-dot" />
                {camera.status === 'Online' ? 'LIVE' : 'DEGRADED'}
              </div>
            )}
            <button className="cn-modal-close" onClick={onClose}>
              <XIcon />
              <span>ESC</span>
            </button>
          </div>
        </div>

        {/* Viewport */}
        <div className="cn-modal-viewport">
          <div className="cn-noise" />
          <div className={`cn-feed-bg${isOffline ? ' cn-feed-offline' : ''}`} />
          <ScanOverlay color={cfg.scanColor} active={!isOffline} />
          {isOffline && (
            <div className="cn-offline-overlay">
              <PowerIcon />
              <span className="cn-mono">NO SIGNAL</span>
            </div>
          )}
          <div className="cn-telemetry-tl cn-mono">
            <div>RES: {camera.res}</div>
            <div>FPS: {camera.fps}</div>
            <div>BITRATE: {camera.bitrate}</div>
          </div>
          <div className="cn-telemetry-br cn-mono">
            <div>UPTIME: {camera.uptime}</div>
            <div>{camera.lastSeen}</div>
          </div>
          <div className="cn-modal-timestamp cn-mono">
            {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </div>
        </div>

        {/* Footer */}
        <div className="cn-modal-footer">
          {[
            { icon: <WifiIcon />, label: 'Status',  val: camera.status },
            { icon: <ActivityIcon />, label: 'Uptime', val: camera.uptime },
            { icon: <CameraIcon />, label: 'Resolution', val: camera.res },
            { icon: <GridIcon />, label: 'Bitrate', val: camera.bitrate },
          ].map(({ icon, label, val }) => (
            <div key={label} className="cn-modal-stat">
              {icon}
              <span className="cn-modal-stat-label">{label}</span>
              <span className="cn-modal-stat-val cn-mono">{val}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Stats bar ────────────────────────────────────────────────────────────────
const StatsBar = () => {
  const online   = NETWORK_CAMERAS.filter(c => c.status === 'Online').length
  const degraded = NETWORK_CAMERAS.filter(c => c.status === 'Degraded').length
  const offline  = NETWORK_CAMERAS.filter(c => c.status === 'Offline').length

  return (
    <div className="cn-statsbar">
      <div className="cn-stat-item">
        <span className="cn-stat-num cn-stat-online">{online}</span>
        <span className="cn-stat-lbl">Online</span>
      </div>
      <div className="cn-stat-divider" />
      <div className="cn-stat-item">
        <span className="cn-stat-num cn-stat-degraded">{degraded}</span>
        <span className="cn-stat-lbl">Degraded</span>
      </div>
      <div className="cn-stat-divider" />
      <div className="cn-stat-item">
        <span className="cn-stat-num cn-stat-offline">{offline}</span>
        <span className="cn-stat-lbl">Offline</span>
      </div>
      <div className="cn-stat-divider" />
      <div className="cn-stat-item">
        <span className="cn-stat-num">{NETWORK_CAMERAS.length}</span>
        <span className="cn-stat-lbl">Total Nodes</span>
      </div>
      <div className="cn-statsbar-live">
        <span className="cn-badge-dot" style={{ background: '#10b981', boxShadow: '0 0 6px #10b981', width: 7, height: 7, flexShrink: 0 }} />
        <span>Network active</span>
      </div>
    </div>
  )
}

// ─── Main export ──────────────────────────────────────────────────────────────
export default function CameraNetwork() {
  const [fullscreenCamera, setFullscreenCamera] = useState(null)
  const [assignedTo, setAssignedTo]             = useState({})
  const [filter, setFilter]                     = useState('All')

  const handleAssign = (id, dept) =>
    setAssignedTo(prev => ({ ...prev, [id]: dept }))

  const filtered = filter === 'All'
    ? NETWORK_CAMERAS
    : NETWORK_CAMERAS.filter(c => c.status === filter)

  return (
    <>
      <style>{CSS}</style>
      <div className="cn-root">

        {/* Page header */}
        <div className="cn-page-header">
          <div className="cn-page-header-left">
            <div className="cn-page-eyebrow">
              <CameraIcon />
              <span>SURVEILLANCE INFRASTRUCTURE</span>
            </div>
            <h2 className="cn-page-title">Camera Network</h2>
            <p className="cn-page-desc">
              City-wide CCTV node health and stream monitoring. View real-time feed status, signal quality, and route oversight to departments.
            </p>
          </div>
          <div className="cn-filter-group">
            {['All', 'Online', 'Degraded', 'Offline'].map(s => (
              <button
                key={s}
                className={`cn-filter-btn${filter === s ? ' cn-filter-active' : ''}`}
                onClick={() => setFilter(s)}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Stats bar */}
        <StatsBar />

        {/* Grid */}
        <div className="cn-grid">
          {filtered.map((cam, i) => (
            <CameraCard
              key={cam.id}
              camera={cam}
              index={i}
              onExpand={setFullscreenCamera}
              assignedTo={assignedTo}
              onAssign={handleAssign}
            />
          ))}
        </div>

        {/* Modal */}
        {fullscreenCamera && (
          <FullscreenModal camera={fullscreenCamera} onClose={() => setFullscreenCamera(null)} />
        )}
      </div>
    </>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// CSS
// ─────────────────────────────────────────────────────────────────────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Outfit:wght@300;400;500;600;700;800&display=swap');

  /* ── TOKENS ─────────────────────────────────── */
  [data-jatayu-theme="light"] {
    --cn-card-bg:             rgba(255,255,255,0.85);
    --cn-card-border:         rgba(226,232,240,0.9);
    --cn-card-shadow:         0 2px 16px rgba(15,23,42,0.07), 0 1px 4px rgba(15,23,42,0.05);
    --cn-card-hover-shadow:   0 8px 32px rgba(15,23,42,0.12), 0 2px 8px rgba(15,23,42,0.06);
    --cn-viewport-bg:         #1e293b;
    --cn-text-primary:        #0f172a;
    --cn-text-secondary:      #475569;
    --cn-text-muted:          #94a3b8;
    --cn-stream-id-bg:        rgba(99,102,241,0.1);
    --cn-stream-id-color:     #6366f1;
    --cn-footer-bg:           rgba(241,245,249,0.7);
    --cn-footer-border:       rgba(226,232,240,0.8);
    --cn-btn-bg:              rgba(241,245,249,0.9);
    --cn-btn-border:          rgba(226,232,240,0.9);
    --cn-btn-text:            #475569;
    --cn-btn-hover:           rgba(226,232,240,0.9);
    --cn-dept-bg:             rgba(226,232,240,0.7);
    --cn-dept-border:         rgba(203,213,225,0.9);
    --cn-dept-text:           #64748b;
    --cn-bar-inactive:        rgba(203,213,225,0.6);
    --cn-stat-bg:             rgba(255,255,255,0.9);
    --cn-stat-border:         rgba(226,232,240,0.9);
    --cn-stat-divider:        rgba(226,232,240,0.9);
    --cn-stat-pill-bg:        rgba(241,245,249,0.7);
    --cn-stat-pill-border:    rgba(226,232,240,0.8);
    --cn-filter-bg:           rgba(241,245,249,0.9);
    --cn-filter-border:       rgba(226,232,240,0.9);
    --cn-filter-text:         #64748b;
    --cn-eyebrow-bg:          rgba(99,102,241,0.12);
    --cn-eyebrow-color:       #6366f1;
    --cn-modal-bg:            rgba(255,255,255,0.96);
    --cn-modal-border:        rgba(226,232,240,0.9);
    --cn-modal-shadow:        0 24px 80px rgba(15,23,42,0.2);
    --cn-modal-footer-bg:     rgba(248,250,252,0.9);
    --cn-telemetry-bg:        rgba(255,255,255,0.85);
    --cn-telemetry-text:      #334155;
    --cn-offline-bg:          rgba(15,23,42,0.7);
  }

  [data-jatayu-theme="dark"] {
    --cn-card-bg:             rgba(13,17,27,0.85);
    --cn-card-border:         rgba(255,255,255,0.06);
    --cn-card-shadow:         0 2px 16px rgba(0,0,0,0.3), 0 1px 4px rgba(0,0,0,0.2);
    --cn-card-hover-shadow:   0 8px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.08);
    --cn-viewport-bg:         #020408;
    --cn-text-primary:        #f1f5f9;
    --cn-text-secondary:      #94a3b8;
    --cn-text-muted:          #475569;
    --cn-stream-id-bg:        rgba(99,102,241,0.15);
    --cn-stream-id-color:     #818cf8;
    --cn-footer-bg:           rgba(255,255,255,0.025);
    --cn-footer-border:       rgba(255,255,255,0.05);
    --cn-btn-bg:              rgba(255,255,255,0.04);
    --cn-btn-border:          rgba(255,255,255,0.07);
    --cn-btn-text:            #64748b;
    --cn-btn-hover:           rgba(255,255,255,0.08);
    --cn-dept-bg:             rgba(255,255,255,0.04);
    --cn-dept-border:         rgba(255,255,255,0.07);
    --cn-dept-text:           #475569;
    --cn-bar-inactive:        rgba(255,255,255,0.08);
    --cn-stat-bg:             rgba(13,17,27,0.8);
    --cn-stat-border:         rgba(255,255,255,0.06);
    --cn-stat-divider:        rgba(255,255,255,0.05);
    --cn-stat-pill-bg:        rgba(255,255,255,0.03);
    --cn-stat-pill-border:    rgba(255,255,255,0.06);
    --cn-filter-bg:           rgba(255,255,255,0.04);
    --cn-filter-border:       rgba(255,255,255,0.07);
    --cn-filter-text:         #475569;
    --cn-eyebrow-bg:          rgba(99,102,241,0.15);
    --cn-eyebrow-color:       #818cf8;
    --cn-modal-bg:            rgba(10,14,24,0.97);
    --cn-modal-border:        rgba(255,255,255,0.07);
    --cn-modal-shadow:        0 32px 100px rgba(0,0,0,0.7);
    --cn-modal-footer-bg:     rgba(255,255,255,0.025);
    --cn-telemetry-bg:        rgba(0,0,0,0.6);
    --cn-telemetry-text:      rgba(99,255,180,0.8);
    --cn-offline-bg:          rgba(0,0,0,0.75);
  }

  /* ── KEYFRAMES ───────────────────────────────── */
  @keyframes cn-in {
    from { opacity:0; transform:translateY(20px) scale(0.97); }
    to   { opacity:1; transform:translateY(0) scale(1); }
  }
  @keyframes cn-scan {
    0%    { top:-2px; opacity:0.85; }
    48%   { opacity:0.85; }
    50%   { opacity:0; top:100%; }
    50.01%{ top:-2px; opacity:0; }
    52%   { opacity:0.85; }
    100%  { top:100%; opacity:0.85; }
  }
  @keyframes cn-pulse-dot {
    0%,100%{ transform:scale(1); opacity:1; }
    50%    { transform:scale(1.7); opacity:0.4; }
  }
  @keyframes cn-modal-in {
    from { opacity:0; transform:scale(0.95) translateY(12px); }
    to   { opacity:1; transform:scale(1) translateY(0); }
  }
  @keyframes cn-backdrop-in {
    from { opacity:0; }
    to   { opacity:1; }
  }
  @keyframes cn-blink {
    0%,100%{ opacity:1; }
    50%    { opacity:0.2; }
  }
  @keyframes cn-spark {
    0%,100%{ transform:scaleY(1); }
    50%    { transform:scaleY(0.4); }
  }
  @keyframes cn-noise {
    0%  { transform:translate(0,0); }
    20% { transform:translate(-1%,1%); }
    40% { transform:translate(1%,-1%); }
    60% { transform:translate(-2%,1%); }
    80% { transform:translate(1%,2%); }
    100%{ transform:translate(0,0); }
  }
  @keyframes cn-grid {
    0%,100%{ opacity:0.05; }
    50%    { opacity:0.03; }
  }
  @keyframes cn-scanbar-in {
    from { transform:scaleX(0); opacity:0; }
    to   { transform:scaleX(1); opacity:1; }
  }

  /* ── ROOT ────────────────────────────────────── */
  .cn-root {
    display: flex;
    flex-direction: column;
    gap: 20px;
    font-family: 'Outfit', system-ui, sans-serif;
  }
  .cn-mono { font-family: 'Space Mono', monospace; }

  /* ── PAGE HEADER ─────────────────────────────── */
  .cn-page-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 20px;
    flex-wrap: wrap;
  }
  .cn-page-header-left { flex: 1; min-width: 0; }
  .cn-page-eyebrow {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 4px 10px;
    border-radius: 6px;
    background: var(--cn-eyebrow-bg);
    color: var(--cn-eyebrow-color);
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    font-family: 'Space Mono', monospace;
    margin-bottom: 8px;
    transition: all 0.3s;
  }
  .cn-page-title {
    font-size: 22px;
    font-weight: 800;
    color: var(--cn-text-primary);
    letter-spacing: -0.5px;
    margin: 0 0 6px;
    font-family: 'Outfit', sans-serif;
    transition: color 0.3s;
  }
  .cn-page-desc {
    font-size: 12.5px;
    color: var(--cn-text-muted);
    max-width: 520px;
    line-height: 1.6;
    margin: 0;
    transition: color 0.3s;
  }

  /* ── FILTER GROUP ────────────────────────────── */
  .cn-filter-group {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
    align-items: center;
  }
  .cn-filter-btn {
    padding: 6px 14px;
    border-radius: 8px;
    border: 1px solid var(--cn-filter-border);
    background: var(--cn-filter-bg);
    color: var(--cn-filter-text);
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    font-family: 'Outfit', sans-serif;
    backdrop-filter: blur(8px);
  }
  .cn-filter-btn:hover {
    background: var(--cn-btn-hover);
    color: var(--cn-text-primary);
  }
  .cn-filter-active {
    background: #6366f1 !important;
    border-color: #6366f1 !important;
    color: #fff !important;
    box-shadow: 0 2px 12px rgba(99,102,241,0.35);
  }

  /* ── STATS BAR ───────────────────────────────── */
  .cn-statsbar {
    display: flex;
    align-items: center;
    padding: 10px 20px;
    border-radius: 12px;
    background: var(--cn-stat-bg);
    border: 1px solid var(--cn-stat-border);
    backdrop-filter: blur(12px);
    flex-wrap: wrap;
    gap: 4px;
    transition: background 0.3s, border-color 0.3s;
  }
  .cn-stat-item {
    display: flex;
    align-items: baseline;
    gap: 6px;
    padding: 0 16px;
  }
  .cn-stat-num {
    font-family: 'Space Mono', monospace;
    font-size: 22px;
    font-weight: 700;
    color: var(--cn-text-primary);
    line-height: 1;
    transition: color 0.3s;
  }
  .cn-stat-online   { color: #10b981 !important; text-shadow: 0 0 12px rgba(16,185,129,0.4); }
  .cn-stat-degraded { color: #f59e0b !important; text-shadow: 0 0 12px rgba(245,158,11,0.3); }
  .cn-stat-offline  { color: #ef4444 !important; text-shadow: 0 0 12px rgba(239,68,68,0.3); }
  .cn-stat-lbl {
    font-size: 11px;
    color: var(--cn-text-muted);
    font-weight: 500;
    transition: color 0.3s;
  }
  .cn-stat-divider {
    width: 1px; height: 28px;
    background: var(--cn-stat-divider);
    margin: 0 4px;
    transition: background 0.3s;
  }
  .cn-statsbar-live {
    margin-left: auto;
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 11px;
    font-weight: 600;
    color: #10b981;
    padding-left: 12px;
  }

  /* ── GRID ────────────────────────────────────── */
  .cn-grid {
    display: grid;
    gap: 16px;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  }
  @media (max-width: 640px) { .cn-grid { grid-template-columns: 1fr; } }

  /* ── CARD ────────────────────────────────────── */
  .cn-card {
    border-radius: 16px;
    border: 1px solid var(--cn-card-border);
    background: var(--cn-card-bg);
    box-shadow: var(--cn-card-shadow);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    padding: 12px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    animation: cn-in 0.45s cubic-bezier(0.22,1,0.36,1) both;
    transition: box-shadow 0.3s, border-color 0.3s, background 0.3s;
    position: relative;
    overflow: hidden;
  }
  .cn-card::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: 16px;
    background: radial-gradient(ellipse 60% 40% at 50% 0%, var(--glow, transparent) 0%, transparent 70%);
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.4s;
  }
  .cn-card:hover { box-shadow: var(--cn-card-hover-shadow); }
  .cn-card:hover::before { opacity: 1; }

  /* ── CARD TOP ────────────────────────────────── */
  .cn-card-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }
  .cn-card-meta { display: flex; gap: 6px; align-items: center; }
  .cn-stream-id {
    font-size: 10px;
    font-weight: 700;
    padding: 3px 8px;
    border-radius: 5px;
    background: var(--cn-stream-id-bg);
    color: var(--cn-stream-id-color);
    letter-spacing: 0.5px;
    transition: all 0.3s;
  }

  /* ── BADGE ───────────────────────────────────── */
  .cn-badge {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 3px 9px;
    border-radius: 6px;
    font-size: 9.5px;
    font-weight: 700;
    letter-spacing: 1px;
    text-transform: uppercase;
    font-family: 'Space Mono', monospace;
  }
  .cn-badge-online   { background: rgba(16,185,129,0.12); color: #10b981; }
  .cn-badge-degraded { background: rgba(245,158,11,0.12); color: #f59e0b; }
  .cn-badge-offline  { background: rgba(239,68,68,0.12);  color: #ef4444; }
  [data-jatayu-theme="light"] .cn-badge-online   { background: rgba(16,185,129,0.1);  color: #059669; }
  [data-jatayu-theme="light"] .cn-badge-degraded { background: rgba(245,158,11,0.1);  color: #d97706; }
  [data-jatayu-theme="light"] .cn-badge-offline  { background: rgba(239,68,68,0.1);   color: #dc2626; }

  .cn-badge-dot {
    width: 6px; height: 6px;
    border-radius: 50%;
    animation: cn-pulse-dot 1.8s ease-in-out infinite;
    flex-shrink: 0;
  }

  /* ── VIEWPORT ────────────────────────────────── */
  .cn-viewport {
    position: relative;
    aspect-ratio: 16/9;
    border-radius: 10px;
    overflow: hidden;
    background: var(--cn-viewport-bg);
    flex-shrink: 0;
    transition: background 0.3s;
  }
  .cn-noise {
    position: absolute;
    inset: -10%; width:120%; height:120%;
    opacity: 0.03;
    pointer-events: none;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
    background-size: 150px 150px;
    z-index: 1;
    animation: cn-noise 0.15s steps(1) infinite;
  }
  .cn-feed-bg {
    position: absolute; inset: 0;
    background:
      linear-gradient(180deg, rgba(30,40,60,0.3) 0%, rgba(10,15,25,0.6) 100%),
      repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,255,120,0.015) 3px, rgba(0,255,120,0.015) 4px);
    z-index: 0;
    animation: cn-grid 4s ease-in-out infinite;
  }
  .cn-feed-offline {
    background: linear-gradient(180deg, #0a0a0a 0%, #050505 100%),
      repeating-linear-gradient(45deg, #111 0px, #111 1px, transparent 1px, transparent 8px);
    filter: grayscale(1);
  }

  /* ── SCAN ────────────────────────────────────── */
  .cn-scan-wrap { position:absolute; inset:0; z-index:3; pointer-events:none; }
  .cn-scan-line {
    position: absolute;
    left:0; right:0; height:2px;
    background: linear-gradient(90deg, transparent 0%, var(--scan-color) 30%, var(--scan-color) 70%, transparent 100%);
    box-shadow: 0 0 12px 3px var(--scan-color), 0 0 24px 6px color-mix(in srgb, var(--scan-color) 30%, transparent);
    animation: cn-scan 3.5s linear infinite;
    opacity: 0.8;
  }
  .cn-scan-corner {
    position:absolute; width:13px; height:13px;
    border-style:solid;
  }
  .cn-corner-tl { top:7px; left:7px; border-width:2px 0 0 2px; border-radius:2px 0 0 0; }
  .cn-corner-tr { top:7px; right:7px; border-width:2px 2px 0 0; border-radius:0 2px 0 0; }
  .cn-corner-bl { bottom:7px; left:7px; border-width:0 0 2px 2px; border-radius:0 0 0 2px; }
  .cn-corner-br { bottom:7px; right:7px; border-width:0 2px 2px 0; border-radius:0 0 2px 0; }
  .cn-scan-grid {
    position:absolute; inset:0;
    background-image:
      linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px);
    background-size:20% 20%;
  }

  /* ── OVERLAYS ────────────────────────────────── */
  .cn-offline-overlay {
    position:absolute; inset:0; z-index:4;
    display:flex; flex-direction:column; align-items:center; justify-content:center;
    gap: 6px;
    background: var(--cn-offline-bg);
    color: #475569;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 2px;
  }
  .cn-offline-overlay svg { opacity: 0.4; width: 18px; height: 18px; }
  .cn-degraded-overlay {
    position:absolute; bottom:8px; left:50%; transform:translateX(-50%);
    z-index:4;
    font-size: 9px;
    font-weight: 700;
    color: #f59e0b;
    letter-spacing: 1.5px;
    text-shadow: 0 0 8px #f59e0b80;
  }
  .cn-blink { animation: cn-blink 1s ease-in-out infinite; }

  /* ── STATUS PILL ─────────────────────────────── */
  .cn-status-pill {
    position: absolute;
    top: 8px; left: 10px;
    display: inline-flex;
    align-items: center;
    gap: 4px;
    backdrop-filter: blur(4px);
    border-radius: 4px;
    padding: 2px 7px;
    font-size: 9px;
    font-weight: 700;
    font-family: 'Space Mono', monospace;
    color: #fff;
    letter-spacing: 1px;
    z-index: 5;
  }
  .cn-status-pill-lg { position: static; padding: 3px 10px; font-size: 10px; }
  .cn-status-dot {
    width: 5px; height: 5px;
    border-radius: 50%;
    background: #fff;
    animation: cn-pulse-dot 1.2s ease-in-out infinite;
    flex-shrink: 0;
  }

  /* ── FPS TAG ─────────────────────────────────── */
  .cn-fps-tag {
    position: absolute;
    top: 8px; right: 36px;
    font-size: 9px;
    color: rgba(255,255,255,0.5);
    z-index: 5;
    letter-spacing: 0.5px;
  }

  /* ── TIMESTAMP ───────────────────────────────── */
  .cn-timestamp {
    position: absolute;
    bottom: 8px; left: 10px;
    font-size: 9px;
    color: rgba(255,255,255,0.5);
    z-index: 5;
    letter-spacing: 0.5px;
    text-shadow: 0 1px 3px rgba(0,0,0,0.8);
  }

  /* ── EXPAND BTN ──────────────────────────────── */
  .cn-expand-btn {
    position: absolute;
    top: 8px; right: 8px;
    width: 26px; height: 26px;
    border-radius: 6px;
    border: 1px solid rgba(255,255,255,0.15);
    background: rgba(0,0,0,0.5);
    backdrop-filter: blur(4px);
    color: rgba(255,255,255,0.65);
    display: flex; align-items:center; justify-content:center;
    cursor: pointer;
    z-index: 6;
    transition: all 0.2s;
  }
  .cn-expand-btn:hover {
    background: rgba(99,102,241,0.7);
    color: #fff;
    border-color: rgba(99,102,241,0.5);
  }

  /* ── TITLE BLOCK ─────────────────────────────── */
  .cn-title-block { display:flex; flex-direction:column; gap:2px; }
  .cn-title-row   { display:flex; align-items:center; justify-content:space-between; gap:6px; }
  .cn-cam-name {
    font-size: 13px;
    font-weight: 700;
    color: var(--cn-text-primary);
    margin: 0;
    transition: color 0.3s;
  }
  .cn-cam-location {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 11px;
    color: var(--cn-text-muted);
    margin: 0;
    transition: color 0.3s;
  }

  /* ── SIGNAL BARS ─────────────────────────────── */
  .cn-signal-bars {
    display: flex;
    align-items: flex-end;
    gap: 2.5px;
    flex-shrink: 0;
  }
  .cn-signal-bar {
    width: 3px;
    border-radius: 2px;
    transition: all 0.4s ease;
  }

  /* ── STATS STRIP ─────────────────────────────── */
  .cn-stats-strip {
    display: flex;
    gap: 6px;
    align-items: center;
    flex-wrap: wrap;
  }
  .cn-stat-pill {
    display: flex;
    flex-direction: column;
    gap: 1px;
    padding: 5px 9px;
    border-radius: 7px;
    background: var(--cn-stat-pill-bg);
    border: 1px solid var(--cn-stat-pill-border);
    transition: all 0.3s;
  }
  .cn-stat-label {
    font-size: 9px;
    color: var(--cn-text-muted);
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    transition: color 0.3s;
  }
  .cn-stat-val {
    font-size: 11px;
    font-weight: 700;
    color: var(--cn-text-primary);
    transition: color 0.3s;
  }

  /* ── SPARKLINE ───────────────────────────────── */
  .cn-sparkline-wrap { margin-left: auto; }
  .cn-sparkline {
    display: flex;
    align-items: flex-end;
    gap: 2px;
    height: 20px;
  }
  .cn-spark-bar {
    width: 3px;
    border-radius: 2px;
    transition: height 0.4s ease, background 0.4s ease;
    animation: cn-spark 1.5s ease-in-out infinite;
  }

  /* ── FOOTER ──────────────────────────────────── */
  .cn-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }
  .cn-footer-left {
    display: flex;
    align-items: center;
    gap: 5px;
    color: var(--cn-text-muted);
    font-size: 10.5px;
    transition: color 0.3s;
  }
  .cn-last-seen { font-size: 10px; }
  .cn-locate-btn {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 5px 10px;
    border-radius: 7px;
    border: 1px solid var(--cn-btn-border);
    background: var(--cn-btn-bg);
    color: var(--cn-btn-text);
    font-size: 11px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    font-family: 'Outfit', sans-serif;
  }
  .cn-locate-btn:hover {
    background: var(--cn-btn-hover);
    color: var(--cn-text-primary);
  }

  /* ── ASSIGN ROW ──────────────────────────────── */
  .cn-assign-row {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
    padding-top: 8px;
    border-top: 1px solid var(--cn-footer-border);
    transition: border-color 0.3s;
  }
  .cn-assign-label {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 10.5px;
    color: var(--cn-text-muted);
    font-weight: 600;
    white-space: nowrap;
    flex-shrink: 0;
    transition: color 0.3s;
  }
  .cn-dept-pills {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    flex: 1;
    justify-content: flex-end;
  }
  .cn-dept-btn {
    padding: 3px 9px;
    border-radius: 6px;
    border: 1px solid var(--cn-dept-border);
    background: var(--cn-dept-bg);
    color: var(--cn-dept-text);
    font-size: 10.5px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    font-family: 'Outfit', sans-serif;
  }
  .cn-dept-btn:hover {
    background: var(--cn-btn-hover);
    color: var(--cn-text-primary);
    border-color: rgba(99,102,241,0.3);
  }
  .cn-dept-active {
    background: #6366f1 !important;
    border-color: #6366f1 !important;
    color: #fff !important;
    box-shadow: 0 2px 8px rgba(99,102,241,0.4);
  }

  /* ── MODAL ───────────────────────────────────── */
  .cn-modal-backdrop {
    position: fixed;
    inset: 0;
    z-index: 50;
    background: rgba(0,0,0,0.75);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 16px;
    animation: cn-backdrop-in 0.2s ease both;
  }
  .cn-modal {
    width: 100%;
    max-width: 860px;
    border-radius: 20px;
    background: var(--cn-modal-bg);
    border: 1px solid var(--cn-modal-border);
    box-shadow: var(--cn-modal-shadow);
    backdrop-filter: blur(24px);
    -webkit-backdrop-filter: blur(24px);
    overflow: hidden;
    animation: cn-modal-in 0.3s cubic-bezier(0.22,1,0.36,1) both;
    transition: background 0.3s, border-color 0.3s;
  }
  .cn-modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 16px 20px;
    border-bottom: 1px solid var(--cn-modal-border);
    flex-wrap: wrap;
    transition: border-color 0.3s;
  }
  .cn-modal-title-group {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
  }
  .cn-modal-cam-name {
    font-size: 15px;
    font-weight: 800;
    color: var(--cn-text-primary);
    margin: 0;
    transition: color 0.3s;
  }
  .cn-modal-cam-loc {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 11.5px;
    color: var(--cn-text-muted);
    margin: 2px 0 0;
    transition: color 0.3s;
  }
  .cn-modal-header-right {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
  }
  .cn-modal-close {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 6px 12px;
    border-radius: 8px;
    border: 1px solid var(--cn-modal-border);
    background: transparent;
    color: var(--cn-text-muted);
    font-size: 11px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    font-family: 'Outfit', sans-serif;
  }
  .cn-modal-close:hover {
    background: var(--cn-btn-hover);
    color: var(--cn-text-primary);
  }
  .cn-modal-viewport {
    position: relative;
    aspect-ratio: 16/9;
    width: 100%;
    background: var(--cn-viewport-bg);
    overflow: hidden;
    transition: background 0.3s;
  }
  .cn-modal-timestamp {
    position: absolute;
    bottom: 12px; left: 14px;
    font-size: 10px;
    color: rgba(255,255,255,0.5);
    z-index: 5;
    letter-spacing: 0.5px;
    text-shadow: 0 1px 3px rgba(0,0,0,0.8);
  }
  .cn-telemetry-tl {
    position: absolute;
    top: 12px; left: 14px;
    font-size: 9px;
    color: var(--cn-telemetry-text);
    background: var(--cn-telemetry-bg);
    padding: 4px 8px;
    border-radius: 4px;
    line-height: 1.8;
    z-index: 5;
    backdrop-filter: blur(6px);
    transition: color 0.3s, background 0.3s;
  }
  .cn-telemetry-br {
    position: absolute;
    bottom: 12px; right: 14px;
    font-size: 9px;
    color: var(--cn-telemetry-text);
    background: var(--cn-telemetry-bg);
    padding: 4px 8px;
    border-radius: 4px;
    line-height: 1.8;
    z-index: 5;
    text-align: right;
    backdrop-filter: blur(6px);
    transition: color 0.3s, background 0.3s;
  }
  .cn-modal-footer {
    display: flex;
    align-items: center;
    padding: 14px 20px;
    background: var(--cn-modal-footer-bg);
    border-top: 1px solid var(--cn-modal-border);
    flex-wrap: wrap;
    gap: 8px;
    transition: background 0.3s, border-color 0.3s;
  }
  .cn-modal-stat {
    display: flex;
    align-items: center;
    gap: 6px;
    padding-right: 16px;
    margin-right: 16px;
    border-right: 1px solid var(--cn-stat-divider);
    transition: border-color 0.3s;
  }
  .cn-modal-stat:last-child { border-right: none; margin-right: 0; padding-right: 0; }
  .cn-modal-stat svg { color: var(--cn-text-muted); flex-shrink: 0; }
  .cn-modal-stat-label {
    font-size: 10.5px;
    color: var(--cn-text-muted);
    font-weight: 500;
    transition: color 0.3s;
  }
  .cn-modal-stat-val {
    font-size: 12px;
    font-weight: 700;
    color: var(--cn-text-primary);
    transition: color 0.3s;
  }
`