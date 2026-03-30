import React, { useState, useEffect, useCallback } from 'react'

// ─── SVG Icon set ─────────────────────────────────────────────────────────────
const Icon = {
  mapPin: (p) => (
    <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
    </svg>
  ),
  image: (p) => (
    <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
      <circle cx="8.5" cy="8.5" r="1.5"/>
      <polyline points="21 15 16 10 5 21"/>
    </svg>
  ),
  alertTriangle: (p) => (
    <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  ),
  user: (p) => (
    <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
    </svg>
  ),
  clock: (p) => (
    <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
    </svg>
  ),
  send: (p) => (
    <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
    </svg>
  ),
  users: (p) => (
    <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>
    </svg>
  ),
  chevronLeft: (p) => (
    <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6"/>
    </svg>
  ),
  chevronRight: (p) => (
    <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6"/>
    </svg>
  ),
  maximize: (p) => (
    <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 3H5a2 2 0 00-2 2v3m18 0V5a2 2 0 00-2-2h-3m0 18h3a2 2 0 002-2v-3M3 16v3a2 2 0 002 2h3"/>
    </svg>
  ),
  x: (p) => (
    <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  ),
  phone: (p) => (
    <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.7A2 2 0 012.18 1H5.1a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 8.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/>
    </svg>
  ),
  smartphone: (p) => (
    <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
      <line x1="12" y1="18" x2="12.01" y2="18"/>
    </svg>
  ),
  messageCircle: (p) => (
    <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
    </svg>
  ),
  checkCircle: (p) => (
    <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
    </svg>
  ),
  download: (p) => (
    <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/>
      <line x1="12" y1="15" x2="12" y2="3"/>
    </svg>
  ),
}

// ─── Mock image palette (colored gradient placeholders) ───────────────────────
const MOCK_IMAGES = [
  { id: 1, label: 'Scene overview',    bg: 'linear-gradient(135deg,#1e3a5f,#0f2440)', accent: '#3b82f6' },
  { id: 2, label: 'Close-up evidence', bg: 'linear-gradient(135deg,#3d1a00,#5c2900)', accent: '#f97316' },
  { id: 3, label: 'Street view',       bg: 'linear-gradient(135deg,#0d2f1c,#143d25)', accent: '#22c55e' },
  { id: 4, label: 'Citizen video',     bg: 'linear-gradient(135deg,#2d1654,#3d1f6e)', accent: '#a855f7' },
]

const DEPARTMENTS = ['Police', 'Fire', 'Municipal', 'Traffic', 'Admin']

const SEVERITY = [
  { id: 'low',    label: 'Low',    color: '#10b981', dimColor: 'rgba(16,185,129,0.12)',  border: 'rgba(16,185,129,0.3)' },
  { id: 'medium', label: 'Medium', color: '#f59e0b', dimColor: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)' },
  { id: 'high',   label: 'High',   color: '#ef4444', dimColor: 'rgba(239,68,68,0.12)',  border: 'rgba(239,68,68,0.3)' },
]

const CHANNEL_ICON = {
  'Mobile app':       Icon.smartphone,
  'WhatsApp Helpline': Icon.messageCircle,
  'Call Centre':      Icon.phone,
}

const REPORTS = [
  {
    id: 'r-101',
    title: 'Unattended bag near bus stop',
    citizenName: 'Anita Sharma',
    channel: 'Mobile app',
    submittedAt: '2 minutes ago',
    locationText: 'Ward 8 · City Bus Stop – Pillar 3',
    locationLink: 'https://maps.google.com/?q=28.6139,77.2090',
    summary: 'Citizen noticed an unattended bag placed near the third pillar of the main city bus stop. Crowd starting to gather around the area.',
    images: [MOCK_IMAGES[0], MOCK_IMAGES[1], MOCK_IMAGES[2]],
  },
  {
    id: 'r-102',
    title: 'Garbage dumping beside school wall',
    citizenName: 'Ravi Kumar',
    channel: 'WhatsApp Helpline',
    submittedAt: '7 minutes ago',
    locationText: 'Ward 3 · Government School, South Gate',
    locationLink: 'https://maps.google.com/?q=28.6200,77.2000',
    summary: 'Multiple garbage bags and construction debris dumped right outside the school boundary wall causing foul smell and obstruction.',
    images: [MOCK_IMAGES[2], MOCK_IMAGES[3]],
  },
  {
    id: 'r-103',
    title: 'Streetlight not working – dark stretch',
    citizenName: 'Meena Patil',
    channel: 'Call Centre',
    submittedAt: '15 minutes ago',
    locationText: 'Ward 11 · Lake Road, Sector 2',
    locationLink: 'https://maps.google.com/?q=28.6050,77.2200',
    summary: 'Several streetlights are not working on the stretch of Lake Road near the park, making it very dark for pedestrians.',
    images: [MOCK_IMAGES[1], MOCK_IMAGES[3], MOCK_IMAGES[0], MOCK_IMAGES[2]],
  },
  {
    id: 'r-104',
    title: 'Water logging near market lane',
    citizenName: 'Shaikh Imran',
    channel: 'Mobile app',
    submittedAt: '25 minutes ago',
    locationText: 'Ward 6 · Old Market Lane, near shop 23',
    locationLink: 'https://maps.google.com/?q=28.6180,77.2150',
    summary: 'Heavy water logging reported after rain, making it difficult for vehicles and pedestrians to move. Risk of slipping and vehicle breakdown.',
    images: [MOCK_IMAGES[0], MOCK_IMAGES[2]],
  },
]

// ─── Lightbox ─────────────────────────────────────────────────────────────────
function Lightbox({ images, startIndex, onClose }) {
  const [current, setCurrent] = useState(startIndex)

  const prev = useCallback(() => setCurrent(i => (i - 1 + images.length) % images.length), [images.length])
  const next = useCallback(() => setCurrent(i => (i + 1) % images.length), [images.length])

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'ArrowLeft')  prev()
      if (e.key === 'ArrowRight') next()
      if (e.key === 'Escape')     onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [prev, next, onClose])

  const img = images[current]

  return (
    <div className="cr-lb-overlay" onClick={onClose}>
      <div className="cr-lb-box" onClick={e => e.stopPropagation()}>
        {/* Close */}
        <button className="cr-lb-close" onClick={onClose} aria-label="Close">
          <Icon.x width={18} height={18}/>
        </button>

        {/* Counter */}
        <div className="cr-lb-counter">{current + 1} / {images.length}</div>

        {/* Image area */}
        <div className="cr-lb-img-wrap" style={{ background: img.bg }}>
          <div className="cr-lb-img-inner">
            <Icon.image width={56} height={56} style={{ color: img.accent, opacity: 0.5 }}/>
            <span className="cr-lb-img-label">{img.label}</span>
          </div>
        </div>

        {/* Navigation */}
        {images.length > 1 && (
          <>
            <button className="cr-lb-nav cr-lb-nav-prev" onClick={prev} aria-label="Previous">
              <Icon.chevronLeft width={22} height={22}/>
            </button>
            <button className="cr-lb-nav cr-lb-nav-next" onClick={next} aria-label="Next">
              <Icon.chevronRight width={22} height={22}/>
            </button>
          </>
        )}

        {/* Footer strip */}
        <div className="cr-lb-footer">
          <div className="cr-lb-thumbs">
            {images.map((im, i) => (
              <button
                key={im.id}
                className={`cr-lb-thumb${i === current ? ' cr-lb-thumb-active' : ''}`}
                onClick={() => setCurrent(i)}
                style={{ background: im.bg }}
                aria-label={im.label}
              />
            ))}
          </div>
          <div className="cr-lb-actions">
            <button className="cr-lb-action-btn" title="Download">
              <Icon.download width={14} height={14}/>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Image Gallery strip ──────────────────────────────────────────────────────
function ImageGallery({ images, onOpen }) {
  const [hovered, setHovered] = useState(null)
  const shown = images.slice(0, 4)
  const overflow = images.length - 4

  return (
    <div className="cr-gallery">
      {shown.map((img, i) => (
        <button
          key={img.id}
          className={`cr-gallery-item${hovered === i ? ' cr-gallery-item-hovered' : ''}`}
          style={{ background: img.bg }}
          onMouseEnter={() => setHovered(i)}
          onMouseLeave={() => setHovered(null)}
          onClick={() => onOpen(i)}
          aria-label={`View ${img.label}`}
        >
          <div className="cr-gallery-icon">
            <Icon.image width={18} height={18} style={{ color: img.accent }}/>
          </div>
          <span className="cr-gallery-label">{img.label}</span>
          <div className="cr-gallery-hover-overlay">
            <Icon.maximize width={16} height={16}/>
          </div>
          {/* Last item overlay for overflow */}
          {i === 3 && overflow > 0 && (
            <div className="cr-gallery-overflow">+{overflow}</div>
          )}
        </button>
      ))}
    </div>
  )
}

// ─── Report card ──────────────────────────────────────────────────────────────
function ReportCard({ report, index, severity, assigned, onSeverity, onAssign }) {
  const [lightboxIndex, setLightboxIndex] = useState(null)
  const sev = SEVERITY.find(s => s.id === severity) || SEVERITY[1]
  const ChannelIcon = CHANNEL_ICON[report.channel] || Icon.messageCircle

  return (
    <>
      {lightboxIndex !== null && (
        <Lightbox
          images={report.images}
          startIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}

      <article className="cr-card" style={{ '--i': index }}>
        {/* Severity accent bar */}
        <div className="cr-accent-bar" style={{ background: sev.color }}/>

        {/* ── Card header ─────────────────────── */}
        <div className="cr-card-header">
          <div className="cr-avatar">
            <Icon.user width={14} height={14}/>
          </div>
          <div className="cr-card-meta">
            <h3 className="cr-card-title">{report.title}</h3>
            <div className="cr-card-byline">
              <span>{report.citizenName}</span>
              <span className="cr-dot">·</span>
              <ChannelIcon width={11} height={11} style={{ flexShrink: 0 }}/>
              <span>{report.channel}</span>
              <span className="cr-dot">·</span>
              <Icon.clock width={11} height={11} style={{ flexShrink: 0 }}/>
              <span>{report.submittedAt}</span>
            </div>
          </div>

          {/* Severity selector */}
          <div className="cr-severity-group">
            <span className="cr-severity-label">Severity</span>
            <div className="cr-severity-btns">
              {SEVERITY.map(s => (
                <button
                  key={s.id}
                  className={`cr-sev-btn${severity === s.id ? ' cr-sev-active' : ''}`}
                  style={severity === s.id
                    ? { background: s.dimColor, border: `1.5px solid ${s.border}`, color: s.color }
                    : {}}
                  onClick={() => onSeverity(s.id)}
                >
                  {severity === s.id && <span className="cr-sev-dot" style={{ background: s.color }}/>}
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Card body ───────────────────────── */}
        <div className="cr-card-body">
          {/* Image gallery */}
          <ImageGallery images={report.images} onOpen={setLightboxIndex}/>

          {/* Info column */}
          <div className="cr-info-col">
            <p className="cr-summary">{report.summary}</p>

            {/* Location */}
            <div className="cr-location">
              <button
                className="cr-location-btn"
                onClick={() => window.open(report.locationLink, '_blank', 'noopener,noreferrer')}
              >
                <Icon.mapPin width={13} height={13}/>
                <span>View on map</span>
              </button>
              <span className="cr-location-text">{report.locationText}</span>
            </div>

            {/* Department routing */}
            <div className="cr-routing">
              <div className="cr-routing-header">
                <Icon.users width={12} height={12}/>
                <span>Route to department</span>
              </div>
              <div className="cr-dept-btns">
                {DEPARTMENTS.map(dept => (
                  <button
                    key={dept}
                    className={`cr-dept-btn${assigned === dept ? ' cr-dept-active' : ''}`}
                    onClick={() => onAssign(dept)}
                  >
                    {assigned === dept && <Icon.checkCircle width={11} height={11}/>}
                    {dept}
                  </button>
                ))}
              </div>

              {/* Assignment status */}
              <div className={`cr-assign-status${assigned ? ' cr-assign-done' : ''}`}>
                <Icon.send width={11} height={11}/>
                {assigned ? `Dispatched → ${assigned} Department` : 'Awaiting assignment'}
              </div>
            </div>
          </div>
        </div>
      </article>
    </>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function CitizenReports() {
  const [severityById, setSeverityById] = useState({})
  const [assignedById, setAssignedById] = useState({})
  const [filter, setFilter] = useState('all')

  const filtered = filter === 'all'
    ? REPORTS
    : REPORTS.filter(r => (severityById[r.id] || 'medium') === filter)

  return (
    <>
      <style>{CR_CSS}</style>
      <div className="cr-root">

        {/* ── Page header ──────────────────────── */}
        <div className="cr-page-header">
          <div>
            <h2 className="cr-page-title">Citizen Reports Inbox</h2>
            <p className="cr-page-sub">
              Incoming complaints, calls, and app submissions — review evidence, mark severity, route to department.
            </p>
          </div>

          <div className="cr-header-right">
            {/* Filter tabs */}
            <div className="cr-filter-tabs">
              {['all', 'high', 'medium', 'low'].map(f => (
                <button
                  key={f}
                  className={`cr-filter-tab${filter === f ? ' cr-filter-active' : ''}`}
                  onClick={() => setFilter(f)}
                >
                  {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>

            {/* Open count badge */}
            <span className="cr-open-badge">
              <Icon.alertTriangle width={11} height={11}/>
              {REPORTS.length} open
            </span>
          </div>
        </div>

        {/* ── Report list ──────────────────────── */}
        <div className="cr-list">
          {filtered.map((report, i) => (
            <ReportCard
              key={report.id}
              report={report}
              index={i}
              severity={severityById[report.id] || 'medium'}
              assigned={assignedById[report.id]}
              onSeverity={lv => setSeverityById(p => ({ ...p, [report.id]: lv }))}
              onAssign={dept => setAssignedById(p => ({ ...p, [report.id]: dept }))}
            />
          ))}
          {filtered.length === 0 && (
            <div className="cr-empty">No reports match the current filter.</div>
          )}
        </div>
      </div>
    </>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// CSS
// ─────────────────────────────────────────────────────────────────────────────
const CR_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:wght@300;400;500;600;700&display=swap');

  /* ── TOKENS ──────────────────────────────────── */
  [data-jatayu-theme="light"] .cr-root,
  .cr-root {
    --cr-bg:              transparent;
    --cr-card-bg:         #ffffff;
    --cr-card-border:     rgba(226,232,240,0.9);
    --cr-card-shadow:     0 1px 3px rgba(15,23,42,0.04), 0 4px 16px rgba(15,23,42,0.06);
    --cr-card-hover-shadow: 0 2px 8px rgba(15,23,42,0.06), 0 12px 32px rgba(15,23,42,0.1);
    --cr-card-hover-border: rgba(99,102,241,0.25);
    --cr-title:           #0f172a;
    --cr-sub:             #64748b;
    --cr-text:            #334155;
    --cr-muted:           #94a3b8;
    --cr-byline:          #64748b;
    --cr-avatar-bg:       linear-gradient(135deg,#e0e7ff,#c7d2fe);
    --cr-avatar-text:     #4f46e5;
    --cr-sev-label:       #64748b;
    --cr-sev-btn-bg:      #f8fafc;
    --cr-sev-btn-border:  rgba(226,232,240,0.9);
    --cr-sev-btn-text:    #64748b;
    --cr-sev-btn-hover:   #f1f5f9;
    --cr-gallery-bg:      #f1f5f9;
    --cr-gallery-border:  rgba(226,232,240,0.8);
    --cr-gallery-hover:   rgba(226,232,240,0.5);
    --cr-summary-text:    #475569;
    --cr-location-btn-bg: #f8fafc;
    --cr-location-btn-border: rgba(226,232,240,1);
    --cr-location-btn-text: #334155;
    --cr-location-btn-hover: #f1f5f9;
    --cr-location-text:   #94a3b8;
    --cr-routing-header:  #94a3b8;
    --cr-dept-bg:         #f8fafc;
    --cr-dept-border:     rgba(226,232,240,0.9);
    --cr-dept-text:       #475569;
    --cr-dept-hover-bg:   #f1f5f9;
    --cr-dept-active-bg:  rgba(79,70,229,0.08);
    --cr-dept-active-border: rgba(79,70,229,0.3);
    --cr-dept-active-text: #4338ca;
    --cr-assign-bg:       #f8fafc;
    --cr-assign-border:   rgba(226,232,240,0.8);
    --cr-assign-text:     #94a3b8;
    --cr-assign-done-bg:  rgba(16,185,129,0.06);
    --cr-assign-done-border: rgba(16,185,129,0.2);
    --cr-assign-done-text: #059669;
    --cr-filter-bg:       #f1f5f9;
    --cr-filter-border:   rgba(226,232,240,0.8);
    --cr-filter-text:     #64748b;
    --cr-filter-active-bg: #ffffff;
    --cr-filter-active-shadow: 0 1px 4px rgba(0,0,0,0.08);
    --cr-filter-active-text: #0f172a;
    --cr-open-badge-bg:   rgba(99,102,241,0.08);
    --cr-open-badge-border: rgba(99,102,241,0.2);
    --cr-open-badge-text: #4f46e5;
    --cr-lb-overlay:      rgba(0,0,0,0.85);
    --cr-lb-bg:           #0d1117;
    --cr-lb-border:       rgba(255,255,255,0.08);
    --cr-lb-text:         #f1f5f9;
    --cr-lb-muted:        #64748b;
    --cr-lb-btn-bg:       rgba(255,255,255,0.06);
    --cr-lb-btn-hover:    rgba(255,255,255,0.14);
  }

  [data-jatayu-theme="dark"] .cr-root {
    --cr-bg:              transparent;
    --cr-card-bg:         #0f1623;
    --cr-card-border:     rgba(255,255,255,0.06);
    --cr-card-shadow:     0 1px 3px rgba(0,0,0,0.3), 0 4px 20px rgba(0,0,0,0.2);
    --cr-card-hover-shadow: 0 4px 12px rgba(0,0,0,0.4), 0 16px 40px rgba(0,0,0,0.3);
    --cr-card-hover-border: rgba(99,102,241,0.3);
    --cr-title:           #f1f5f9;
    --cr-sub:             #64748b;
    --cr-text:            #cbd5e1;
    --cr-muted:           #475569;
    --cr-byline:          #64748b;
    --cr-avatar-bg:       linear-gradient(135deg,#312e81,#1e1b4b);
    --cr-avatar-text:     #a5b4fc;
    --cr-sev-label:       #475569;
    --cr-sev-btn-bg:      rgba(255,255,255,0.04);
    --cr-sev-btn-border:  rgba(255,255,255,0.07);
    --cr-sev-btn-text:    #64748b;
    --cr-sev-btn-hover:   rgba(255,255,255,0.07);
    --cr-gallery-bg:      rgba(255,255,255,0.03);
    --cr-gallery-border:  rgba(255,255,255,0.06);
    --cr-gallery-hover:   rgba(255,255,255,0.05);
    --cr-summary-text:    #94a3b8;
    --cr-location-btn-bg: rgba(255,255,255,0.04);
    --cr-location-btn-border: rgba(255,255,255,0.08);
    --cr-location-btn-text: #94a3b8;
    --cr-location-btn-hover: rgba(255,255,255,0.07);
    --cr-location-text:   #475569;
    --cr-routing-header:  #475569;
    --cr-dept-bg:         rgba(255,255,255,0.03);
    --cr-dept-border:     rgba(255,255,255,0.07);
    --cr-dept-text:       #64748b;
    --cr-dept-hover-bg:   rgba(255,255,255,0.06);
    --cr-dept-active-bg:  rgba(99,102,241,0.15);
    --cr-dept-active-border: rgba(99,102,241,0.35);
    --cr-dept-active-text: #a5b4fc;
    --cr-assign-bg:       rgba(255,255,255,0.02);
    --cr-assign-border:   rgba(255,255,255,0.05);
    --cr-assign-text:     #334155;
    --cr-assign-done-bg:  rgba(16,185,129,0.08);
    --cr-assign-done-border: rgba(16,185,129,0.2);
    --cr-assign-done-text: #6ee7b7;
    --cr-filter-bg:       rgba(255,255,255,0.04);
    --cr-filter-border:   rgba(255,255,255,0.07);
    --cr-filter-text:     #475569;
    --cr-filter-active-bg: rgba(255,255,255,0.08);
    --cr-filter-active-shadow: 0 1px 6px rgba(0,0,0,0.3);
    --cr-filter-active-text: #f1f5f9;
    --cr-open-badge-bg:   rgba(99,102,241,0.1);
    --cr-open-badge-border: rgba(99,102,241,0.25);
    --cr-open-badge-text: #a5b4fc;
    --cr-lb-overlay:      rgba(0,0,0,0.92);
    --cr-lb-bg:           #080e1a;
    --cr-lb-border:       rgba(255,255,255,0.07);
    --cr-lb-text:         #f1f5f9;
    --cr-lb-muted:        #475569;
    --cr-lb-btn-bg:       rgba(255,255,255,0.06);
    --cr-lb-btn-hover:    rgba(255,255,255,0.14);
  }

  /* ── KEYFRAMES ────────────────────────────────── */
  @keyframes cr-card-in {
    from { opacity:0; transform:translateY(14px); }
    to   { opacity:1; transform:translateY(0); }
  }
  @keyframes cr-lb-in {
    from { opacity:0; transform:scale(0.93); }
    to   { opacity:1; transform:scale(1); }
  }
  @keyframes cr-overlay-in {
    from { opacity:0; }
    to   { opacity:1; }
  }
  @keyframes cr-thumb-active {
    from { transform:scaleX(0); }
    to   { transform:scaleX(1); }
  }
  @keyframes cr-fade-in {
    from { opacity:0; }
    to   { opacity:1; }
  }
  @keyframes cr-assign-pop {
    0%  { transform:scale(0.96); }
    60% { transform:scale(1.02); }
    100%{ transform:scale(1); }
  }

  /* ── ROOT ─────────────────────────────────────── */
  .cr-root {
    font-family: 'DM Sans', system-ui, sans-serif;
    display: flex;
    flex-direction: column;
    gap: 20px;
    background: var(--cr-bg);
  }

  /* ── PAGE HEADER ──────────────────────────────── */
  .cr-page-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 14px;
    animation: cr-fade-in 0.35s ease both;
  }

  .cr-page-title {
    font-family: 'Syne', sans-serif;
    font-size: 18px;
    font-weight: 800;
    color: var(--cr-title);
    letter-spacing: -0.4px;
    line-height: 1.1;
    transition: color 0.3s;
  }

  .cr-page-sub {
    margin-top: 4px;
    font-size: 12.5px;
    color: var(--cr-sub);
    max-width: 480px;
    line-height: 1.5;
    transition: color 0.3s;
  }

  .cr-header-right {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
  }

  /* ── FILTER TABS ──────────────────────────────── */
  .cr-filter-tabs {
    display: flex;
    background: var(--cr-filter-bg);
    border: 1px solid var(--cr-filter-border);
    border-radius: 10px;
    padding: 3px;
    gap: 2px;
    transition: background 0.3s, border-color 0.3s;
  }

  .cr-filter-tab {
    padding: 5px 14px;
    border-radius: 7px;
    border: none;
    background: transparent;
    color: var(--cr-filter-text);
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    font-family: 'DM Sans', sans-serif;
    transition: all 0.2s ease;
  }

  .cr-filter-active {
    background: var(--cr-filter-active-bg);
    color: var(--cr-filter-active-text);
    box-shadow: var(--cr-filter-active-shadow);
    font-weight: 600;
  }

  .cr-open-badge {
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 11.5px;
    font-weight: 600;
    padding: 5px 12px;
    border-radius: 999px;
    background: var(--cr-open-badge-bg);
    border: 1px solid var(--cr-open-badge-border);
    color: var(--cr-open-badge-text);
    transition: all 0.3s;
  }

  /* ── LIST ─────────────────────────────────────── */
  .cr-list {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  .cr-empty {
    text-align: center;
    padding: 40px;
    font-size: 13px;
    color: var(--cr-muted);
  }

  /* ── CARD ─────────────────────────────────────── */
  .cr-card {
    position: relative;
    background: var(--cr-card-bg);
    border: 1px solid var(--cr-card-border);
    border-radius: 16px;
    box-shadow: var(--cr-card-shadow);
    overflow: hidden;
    transition: border-color 0.25s ease, box-shadow 0.25s ease, transform 0.2s ease;
    animation: cr-card-in 0.4s calc(var(--i, 0) * 0.07s + 0.05s) cubic-bezier(0.22,1,0.36,1) both;
  }

  .cr-card:hover {
    border-color: var(--cr-card-hover-border);
    box-shadow: var(--cr-card-hover-shadow);
    transform: translateY(-1px);
  }

  /* Left accent bar */
  .cr-accent-bar {
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 3px;
    border-radius: 0;
    transition: background 0.3s ease;
  }

  /* ── CARD HEADER ──────────────────────────────── */
  .cr-card-header {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 16px 18px 12px 21px;
    flex-wrap: wrap;
  }

  .cr-avatar {
    width: 34px; height: 34px;
    border-radius: 10px;
    background: var(--cr-avatar-bg);
    color: var(--cr-avatar-text);
    display: flex; align-items:center; justify-content:center;
    flex-shrink: 0;
    transition: background 0.3s;
  }

  .cr-card-meta {
    flex: 1;
    min-width: 0;
  }

  .cr-card-title {
    font-family: 'Syne', sans-serif;
    font-size: 14px;
    font-weight: 700;
    color: var(--cr-title);
    letter-spacing: -0.2px;
    line-height: 1.3;
    transition: color 0.3s;
    margin: 0;
  }

  .cr-card-byline {
    display: flex;
    align-items: center;
    gap: 5px;
    flex-wrap: wrap;
    margin-top: 3px;
    font-size: 11.5px;
    color: var(--cr-byline);
    transition: color 0.3s;
  }

  .cr-dot { opacity: 0.4; }

  /* ── SEVERITY ─────────────────────────────────── */
  .cr-severity-group {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 5px;
    flex-shrink: 0;
  }

  .cr-severity-label {
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.7px;
    color: var(--cr-sev-label);
    transition: color 0.3s;
  }

  .cr-severity-btns {
    display: flex;
    gap: 4px;
  }

  .cr-sev-btn {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 4px 10px;
    border-radius: 999px;
    border: 1.5px solid var(--cr-sev-btn-border);
    background: var(--cr-sev-btn-bg);
    color: var(--cr-sev-btn-text);
    font-size: 11px;
    font-weight: 500;
    cursor: pointer;
    font-family: 'DM Sans', sans-serif;
    transition: all 0.2s ease;
  }

  .cr-sev-btn:hover:not(.cr-sev-active) {
    background: var(--cr-sev-btn-hover);
  }

  .cr-sev-active {
    font-weight: 700;
  }

  .cr-sev-dot {
    width: 6px; height: 6px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  /* ── CARD BODY ────────────────────────────────── */
  .cr-card-body {
    display: flex;
    gap: 14px;
    padding: 0 18px 16px 21px;
    flex-wrap: wrap;
  }

  /* ── GALLERY ──────────────────────────────────── */
  .cr-gallery {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 5px;
    width: 164px;
    min-width: 164px;
    flex-shrink: 0;
  }

  @media (max-width: 600px) {
    .cr-gallery { width: 100%; min-width: 0; grid-template-columns: repeat(4, 1fr); }
  }

  .cr-gallery-item {
    position: relative;
    height: 72px;
    border-radius: 10px;
    border: 1px solid var(--cr-gallery-border);
    overflow: hidden;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 4px;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }

  .cr-gallery-item:hover {
    transform: scale(1.04);
    box-shadow: 0 4px 14px rgba(0,0,0,0.3);
  }

  .cr-gallery-item:first-child {
    grid-column: span 2;
    height: 80px;
  }

  .cr-gallery-icon {
    opacity: 0.7;
    transition: opacity 0.2s;
  }

  .cr-gallery-label {
    font-size: 9px;
    font-weight: 600;
    color: rgba(255,255,255,0.7);
    letter-spacing: 0.3px;
    text-align: center;
    padding: 0 6px;
    line-height: 1.2;
    z-index: 1;
  }

  .cr-gallery-hover-overlay {
    position: absolute;
    inset: 0;
    background: rgba(0,0,0,0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    color: #ffffff;
    transition: opacity 0.2s ease;
    backdrop-filter: blur(2px);
  }

  .cr-gallery-item:hover .cr-gallery-hover-overlay {
    opacity: 1;
  }

  .cr-gallery-overflow {
    position: absolute;
    inset: 0;
    background: rgba(0,0,0,0.65);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 15px;
    font-weight: 800;
    color: #ffffff;
    letter-spacing: -0.5px;
    backdrop-filter: blur(4px);
  }

  /* ── INFO COLUMN ──────────────────────────────── */
  .cr-info-col {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .cr-summary {
    font-size: 12.5px;
    line-height: 1.65;
    color: var(--cr-summary-text);
    transition: color 0.3s;
    margin: 0;
  }

  /* ── LOCATION ─────────────────────────────────── */
  .cr-location {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }

  .cr-location-btn {
    display: flex;
    align-items: center;
    gap: 5px;
    padding: 5px 12px;
    border-radius: 8px;
    border: 1px solid var(--cr-location-btn-border);
    background: var(--cr-location-btn-bg);
    color: var(--cr-location-btn-text);
    font-size: 11.5px;
    font-weight: 500;
    cursor: pointer;
    font-family: 'DM Sans', sans-serif;
    transition: all 0.2s ease;
    white-space: nowrap;
  }

  .cr-location-btn:hover {
    background: var(--cr-location-btn-hover);
    transform: translateY(-1px);
  }

  .cr-location-text {
    font-size: 11px;
    color: var(--cr-location-text);
    transition: color 0.3s;
  }

  /* ── ROUTING ──────────────────────────────────── */
  .cr-routing {
    display: flex;
    flex-direction: column;
    gap: 7px;
  }

  .cr-routing-header {
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 10.5px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.6px;
    color: var(--cr-routing-header);
    transition: color 0.3s;
  }

  .cr-dept-btns {
    display: flex;
    flex-wrap: wrap;
    gap: 5px;
  }

  .cr-dept-btn {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 4px 11px;
    border-radius: 999px;
    border: 1px solid var(--cr-dept-border);
    background: var(--cr-dept-bg);
    color: var(--cr-dept-text);
    font-size: 11.5px;
    font-weight: 500;
    cursor: pointer;
    font-family: 'DM Sans', sans-serif;
    transition: all 0.2s ease;
  }

  .cr-dept-btn:hover:not(.cr-dept-active) {
    background: var(--cr-dept-hover-bg);
    transform: translateY(-1px);
  }

  .cr-dept-active {
    background: var(--cr-dept-active-bg);
    border-color: var(--cr-dept-active-border);
    color: var(--cr-dept-active-text);
    font-weight: 700;
    animation: cr-assign-pop 0.3s ease both;
  }

  /* ── ASSIGN STATUS ────────────────────────────── */
  .cr-assign-status {
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 11px;
    font-weight: 500;
    padding: 5px 10px;
    border-radius: 7px;
    background: var(--cr-assign-bg);
    border: 1px solid var(--cr-assign-border);
    color: var(--cr-assign-text);
    transition: all 0.3s ease;
    width: fit-content;
  }

  .cr-assign-done {
    background: var(--cr-assign-done-bg);
    border-color: var(--cr-assign-done-border);
    color: var(--cr-assign-done-text);
    animation: cr-assign-pop 0.3s ease both;
  }

  /* ── LIGHTBOX ─────────────────────────────────── */
  .cr-lb-overlay {
    position: fixed;
    inset: 0;
    z-index: 9999;
    background: var(--cr-lb-overlay);
    display: flex;
    align-items: center;
    justify-content: center;
    animation: cr-overlay-in 0.2s ease both;
    padding: 20px;
  }

  .cr-lb-box {
    position: relative;
    width: 100%;
    max-width: 860px;
    background: var(--cr-lb-bg);
    border: 1px solid var(--cr-lb-border);
    border-radius: 20px;
    overflow: hidden;
    animation: cr-lb-in 0.3s cubic-bezier(0.22,1,0.36,1) both;
    display: flex;
    flex-direction: column;
    max-height: 90vh;
  }

  .cr-lb-close {
    position: absolute;
    top: 14px; right: 14px;
    z-index: 10;
    width: 34px; height: 34px;
    border-radius: 8px;
    border: 1px solid var(--cr-lb-border);
    background: var(--cr-lb-btn-bg);
    color: var(--cr-lb-text);
    display: flex; align-items:center; justify-content:center;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  .cr-lb-close:hover {
    background: var(--cr-lb-btn-hover);
    transform: scale(1.08);
  }

  .cr-lb-counter {
    position: absolute;
    top: 16px; left: 18px;
    font-size: 11px;
    font-weight: 600;
    color: var(--cr-lb-muted);
    letter-spacing: 0.5px;
    z-index: 10;
  }

  .cr-lb-img-wrap {
    flex: 1;
    min-height: 360px;
    max-height: 520px;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    overflow: hidden;
    transition: background 0.35s ease;
  }

  .cr-lb-img-inner {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    animation: cr-fade-in 0.3s ease both;
  }

  .cr-lb-img-label {
    font-family: 'Syne', sans-serif;
    font-size: 14px;
    font-weight: 600;
    color: rgba(255,255,255,0.8);
    letter-spacing: 0.2px;
  }

  .cr-lb-nav {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    width: 40px; height: 40px;
    border-radius: 10px;
    border: 1px solid var(--cr-lb-border);
    background: var(--cr-lb-btn-bg);
    color: var(--cr-lb-text);
    display: flex; align-items:center; justify-content:center;
    cursor: pointer;
    z-index: 10;
    transition: all 0.2s ease;
  }
  .cr-lb-nav:hover {
    background: var(--cr-lb-btn-hover);
    transform: translateY(-50%) scale(1.06);
  }

  .cr-lb-nav-prev { left: 14px; }
  .cr-lb-nav-next { right: 14px; }

  .cr-lb-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 18px;
    border-top: 1px solid var(--cr-lb-border);
    background: rgba(0,0,0,0.2);
  }

  .cr-lb-thumbs {
    display: flex;
    gap: 7px;
    align-items: center;
  }

  .cr-lb-thumb {
    width: 42px; height: 30px;
    border-radius: 6px;
    border: 2px solid transparent;
    cursor: pointer;
    transition: all 0.2s ease;
    opacity: 0.5;
    flex-shrink: 0;
  }

  .cr-lb-thumb:hover { opacity: 0.8; transform: scale(1.05); }

  .cr-lb-thumb-active {
    border-color: #6366f1;
    opacity: 1;
    transform: scale(1.06);
    box-shadow: 0 0 0 2px rgba(99,102,241,0.3);
  }

  .cr-lb-actions {
    display: flex;
    gap: 6px;
  }

  .cr-lb-action-btn {
    width: 30px; height: 30px;
    border-radius: 7px;
    border: 1px solid var(--cr-lb-border);
    background: var(--cr-lb-btn-bg);
    color: var(--cr-lb-muted);
    display: flex; align-items:center; justify-content:center;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  .cr-lb-action-btn:hover {
    background: var(--cr-lb-btn-hover);
    color: var(--cr-lb-text);
  }
`