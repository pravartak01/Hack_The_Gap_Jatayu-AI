import React, { useMemo, useState, useEffect } from 'react'
import { api } from '../../../lib/api.js'

// ─── SVG Icons ────────────────────────────────────────────────────────────────
const Ic = {
  filter: (p) => (
    <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
    </svg>
  ),
  clock: (p) => (
    <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
    </svg>
  ),
  checkCircle: (p) => (
    <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
    </svg>
  ),
  alertTriangle: (p) => (
    <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  ),
  trash: (p) => (
    <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"/>
      <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
    </svg>
  ),
  video: (p) => (
    <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
    </svg>
  ),
  mail: (p) => (
    <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
      <polyline points="22 6 12 13 2 6"/>
    </svg>
  ),
  arrowRight: (p) => (
    <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
    </svg>
  ),
  mapPin: (p) => (
    <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
    </svg>
  ),
  zap: (p) => (
    <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
    </svg>
  ),
  fileText: (p) => (
    <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
    </svg>
  ),
  chevronDown: (p) => (
    <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9"/>
    </svg>
  ),
  x: (p) => (
    <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  ),
  shield: (p) => (
    <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  ),
  users: (p) => (
    <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>
    </svg>
  ),
}

// ─── Data ─────────────────────────────────────────────────────────────────────
const TYPE_FILTERS     = [{ id:'all',label:'All types' },{ id:'camera',label:'Camera' },{ id:'garbage',label:'Garbage' },{ id:'citizen',label:'Citizen' }]
const DEPT_FILTERS     = [{ id:'all',label:'All depts' },{ id:'Police',label:'Police' },{ id:'Fire',label:'Fire' },{ id:'Municipal',label:'Municipal' },{ id:'Traffic',label:'Traffic' },{ id:'Admin',label:'Admin' }]
const STATUS_FILTERS   = [{ id:'all',label:'All status' },{ id:'Resolved',label:'Resolved' },{ id:'In progress',label:'In progress' },{ id:'Escalated',label:'Escalated' }]

const SEV_META = {
  High:   { color:'#ef4444', bg:'rgba(239,68,68,0.1)',   border:'rgba(239,68,68,0.25)',   label:'High'   },
  Medium: { color:'#f59e0b', bg:'rgba(245,158,11,0.1)',  border:'rgba(245,158,11,0.25)',  label:'Medium' },
  Low:    { color:'#10b981', bg:'rgba(16,185,129,0.1)',  border:'rgba(16,185,129,0.25)',  label:'Low'    },
}

const STATUS_META = {
  'Resolved':    { color:'#10b981', bg:'rgba(16,185,129,0.1)',  border:'rgba(16,185,129,0.25)',  icon: Ic.checkCircle   },
  'In progress': { color:'#f59e0b', bg:'rgba(245,158,11,0.1)', border:'rgba(245,158,11,0.25)', icon: Ic.clock          },
  'Escalated':   { color:'#ef4444', bg:'rgba(239,68,68,0.1)',  border:'rgba(239,68,68,0.25)',  icon: Ic.alertTriangle },
}

const TYPE_META = {
  camera:  { label:'Camera alert',    icon: Ic.video, color:'#6366f1', bg:'rgba(99,102,241,0.1)'  },
  garbage: { label:'Garbage hotspot', icon: Ic.trash, color:'#f97316', bg:'rgba(249,115,22,0.1)' },
  citizen: { label:'Citizen report',  icon: Ic.mail,  color:'#06b6d4', bg:'rgba(6,182,212,0.1)'  },
}

const DEPT_META = {
  Police:    { color:'#6366f1', bg:'rgba(99,102,241,0.1)'  },
  Fire:      { color:'#ef4444', bg:'rgba(239,68,68,0.1)'   },
  Municipal: { color:'#10b981', bg:'rgba(16,185,129,0.1)'  },
  Traffic:   { color:'#f59e0b', bg:'rgba(245,158,11,0.1)'  },
  Admin:     { color:'#94a3b8', bg:'rgba(148,163,184,0.1)' },
}

const INCIDENTS = [
  { id:'INC-2401', type:'camera',  title:'Weapon detection at East Gate',       raisedFrom:'Live camera alert',       forwardedTo:'Police',    severity:'High',   status:'Resolved',    startedAt:'2026-03-29 08:12', closedAt:'2026-03-29 08:47', location:'Gate 1 · East entry, Block A',             actionSummary:'Nearest patrol team alerted, perimeter secured, no threat found after verification.' },
  { id:'INC-2402', type:'garbage', title:'Illegal dumping beside school wall',   raisedFrom:'Citizen report + camera', forwardedTo:'Municipal', severity:'Medium', status:'In progress', startedAt:'2026-03-29 07:05', closedAt:null,                location:'Ward 5 · Government school, South gate',   actionSummary:'Sanitation supervisor notified, cleaning crew scheduled in morning round.' },
  { id:'INC-2398', type:'citizen', title:'Streetlight failure near park',        raisedFrom:'Citizen helpline',        forwardedTo:'Municipal', severity:'Low',    status:'Resolved',    startedAt:'2026-03-28 21:18', closedAt:'2026-03-29 06:10', location:'Ward 11 · Lake road, park entrance',       actionSummary:'Electrical team repaired two poles, lighting restored; photo confirmation uploaded.' },
  { id:'INC-2395', type:'camera',  title:'Suspicious gathering near depot gate', raisedFrom:'Camera network',          forwardedTo:'Police',    severity:'Medium', status:'Escalated',   startedAt:'2026-03-28 19:40', closedAt:null,                location:'Bus depot · Gate 2',                       actionSummary:'Local police station informed; patrol asked to increase checks in the area.' },
  { id:'INC-2389', type:'garbage', title:'Repeated dumping under flyover',       raisedFrom:'Municipal field team',    forwardedTo:'Municipal', severity:'High',   status:'Resolved',    startedAt:'2026-03-27 06:55', closedAt:'2026-03-27 11:20', location:'Ward 8 · Canal road flyover, pillar 6',    actionSummary:'Garbage cleared, warning board installed, fine notices issued to nearby shops.' },
  { id:'INC-2384', type:'citizen', title:'Traffic congestion near school zone',  raisedFrom:'Citizen mobile app',      forwardedTo:'Traffic',   severity:'Medium', status:'Resolved',    startedAt:'2026-03-26 13:10', closedAt:'2026-03-26 14:00', location:'Ward 2 · School zone, South lane',         actionSummary:'Traffic police deployed one constable, temporary one-way system during school closing time.' },
  { id:'INC-2378', type:'camera',  title:'Closed shop shutters forced open',     raisedFrom:'Camera network',          forwardedTo:'Police',    severity:'High',   status:'Resolved',    startedAt:'2026-03-24 02:32', closedAt:'2026-03-24 03:05', location:'Central market · Lane 3',                  actionSummary:'Night patrol reached location, shop owner informed; no theft reported, shutter fixed.' },
]

// ─── Duration calculator ──────────────────────────────────────────────────────
function calcDuration(start, end) {
  if (!end) return null
  const diff = (new Date(end) - new Date(start)) / 60000
  if (diff < 60) return `${Math.round(diff)}m`
  return `${Math.floor(diff / 60)}h ${Math.round(diff % 60)}m`
}

// ─── Stat card ────────────────────────────────────────────────────────────────
function StatCard({ value, label, color, icon: Icon, delay }) {
  return (
    <div className="ih-stat" style={{ '--delay': `${delay}s`, '--sc': color, '--sb': `${color}14`, '--sborder': `${color}28` }}>
      <div className="ih-stat-icon"><Icon width={14} height={14}/></div>
      <div>
        <div className="ih-stat-num">{value}</div>
        <div className="ih-stat-label">{label}</div>
      </div>
    </div>
  )
}

// ─── Filter group ─────────────────────────────────────────────────────────────
function FilterGroup({ label, filters, active, onChange }) {
  return (
    <div className="ih-filter-group">
      <span className="ih-filter-group-label">{label}</span>
      <div className="ih-filter-pills">
        {filters.map(f => (
          <button
            key={f.id}
            className={`ih-pill${active === f.id ? ' ih-pill-active' : ''}`}
            onClick={() => onChange(f.id)}
          >
            {active === f.id && f.id !== 'all' && <span className="ih-pill-dot"/>}
            {f.label}
            {active === f.id && f.id !== 'all' && (
              <span className="ih-pill-x" onClick={e => { e.stopPropagation(); onChange('all') }}>
                <Ic.x width={9} height={9}/>
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── Expanded row detail ──────────────────────────────────────────────────────
function ExpandedDetail({ incident }) {
  const sm = STATUS_META[incident.status]
  const duration = calcDuration(incident.startedAt, incident.closedAt)

  return (
    <div className="ih-expanded">
      <div className="ih-exp-grid">
        <div className="ih-exp-block">
          <div className="ih-exp-label"><Ic.mapPin width={11} height={11}/>Location</div>
          <div className="ih-exp-val">{incident.location}</div>
        </div>
        <div className="ih-exp-block">
          <div className="ih-exp-label"><Ic.clock width={11} height={11}/>Timeline</div>
          <div className="ih-exp-val">
            <span>Started: {incident.startedAt}</span>
            {incident.closedAt
              ? <><span className="ih-exp-arrow">→</span><span>Closed: {incident.closedAt}</span></>
              : <span style={{ color:'#f59e0b' }}> · Still open</span>
            }
            {duration && <span className="ih-exp-duration">{duration}</span>}
          </div>
        </div>
        <div className="ih-exp-block ih-exp-full">
          <div className="ih-exp-label"><Ic.fileText width={11} height={11}/>Action taken</div>
          <div className="ih-exp-val ih-exp-action">{incident.actionSummary}</div>
        </div>
        {incident.evidenceUrl && (
          <div className="ih-exp-block ih-exp-full">
            <div className="ih-exp-label"><Ic.video width={11} height={11}/>Evidence</div>
            <div className="ih-exp-val">
              <video
                src={incident.evidenceUrl}
                controls
                className="ih-evidence-video"
                style={{ maxWidth: '320px', borderRadius: '10px', border: '1px solid rgba(148,163,184,0.5)' }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Table row ────────────────────────────────────────────────────────────────
function IncidentRow({ incident, index }) {
  const [open, setOpen] = useState(false)

  const tm = TYPE_META[incident.type]
  const sm = STATUS_META[incident.status]
  const sv = SEV_META[incident.severity]
  const dm = DEPT_META[incident.forwardedTo] || DEPT_META.Admin
  const TypeIcon = tm.icon
  const StatusIcon = sm.icon

  return (
    <>
      <tr
        className={`ih-row${open ? ' ih-row-open' : ''}`}
        style={{ '--i': index }}
        onClick={() => setOpen(v => !v)}
      >
        {/* ID + type */}
        <td className="ih-td ih-td-id">
          <div className="ih-id-col">
            <div className="ih-type-icon" style={{ background: tm.bg, color: tm.color }}>
              <TypeIcon width={13} height={13}/>
            </div>
            <div>
              <div className="ih-id-text">{incident.id}</div>
              <div className="ih-type-label" style={{ color: tm.color }}>{tm.label}</div>
            </div>
          </div>
        </td>

        {/* Title */}
        <td className="ih-td ih-td-title">
          <div className="ih-title-text">{incident.title}</div>
          <div className="ih-source-text">{incident.raisedFrom}</div>
        </td>

        {/* Forwarded to */}
        <td className="ih-td">
          <span className="ih-dept-chip" style={{ background: dm.bg, color: dm.color, border:`1px solid ${dm.color}28` }}>
            <Ic.arrowRight width={10} height={10}/>
            {incident.forwardedTo}
          </span>
        </td>

        {/* Severity */}
        <td className="ih-td">
          <span className="ih-sev-chip" style={{ background: sv.bg, color: sv.color, border:`1px solid ${sv.border}` }}>
            {incident.severity}
          </span>
        </td>

        {/* Status */}
        <td className="ih-td">
          <span className="ih-status-chip" style={{ background: sm.bg, color: sm.color, border:`1px solid ${sm.border}` }}>
            <StatusIcon width={10} height={10}/>
            {incident.status}
          </span>
        </td>

        {/* Duration */}
        <td className="ih-td ih-td-dur">
          {incident.closedAt
            ? <span className="ih-duration-val">{calcDuration(incident.startedAt, incident.closedAt)}</span>
            : <span className="ih-open-tag">Open</span>
          }
        </td>

        {/* Expand chevron */}
        <td className="ih-td ih-td-chevron">
          <span className="ih-chevron" style={{ transform: open ? 'rotate(180deg)' : 'none' }}>
            <Ic.chevronDown width={14} height={14}/>
          </span>
        </td>
      </tr>

      {open && (
        <tr className="ih-expanded-row">
          <td colSpan={7} className="ih-expanded-td">
            <ExpandedDetail incident={incident}/>
          </td>
        </tr>
      )}
    </>
  )
}

// ─── Map backend Issue → UI incident row ─────────────────────────────────────
function mapIssueToIncident(issue) {
  const id = issue.issueId || issue._id
  const deptRaw = issue.assignedDepartment || 'Admin'
  const forwardedTo =
    deptRaw === 'POLICE' ? 'Police' :
    deptRaw === 'FIRE' ? 'Fire' :
    deptRaw === 'TRAFFIC' ? 'Traffic' :
    deptRaw === 'MUNICIPAL' ? 'Municipal' :
    'Admin'

  const type = issue.hazardType?.toLowerCase().includes('garbage') ? 'garbage'
    : issue.hazardType?.toLowerCase().includes('citizen') ? 'citizen'
    : 'camera'

  const severity = issue.status === 'Pending' ? 'High'
    : issue.status === 'Ongoing' ? 'Medium'
    : 'Low'

  const startedAt = issue.createdAt ? new Date(issue.createdAt).toISOString().slice(0, 16).replace('T', ' ') : ''
  const closedAt  = issue.status === 'Resolved' && issue.updatedAt ? new Date(issue.updatedAt).toISOString().slice(0, 16).replace('T', ' ') : null

  return {
    id,
    type,
    title: issue.hazardType || 'Field issue',
    raisedFrom: 'Jatayu routing engine',
    forwardedTo,
    severity,
    status: issue.status === 'Ongoing' ? 'In progress' : issue.status || 'In progress',
    startedAt,
    closedAt,
    location: issue.location?.address || '—',
    actionSummary: issue.logs?.[issue.logs.length - 1]?.message || 'Issue created and assigned via Jatayu.',
    evidenceUrl: issue.evidenceUrl || '',
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function IncidentHistory({ session, refreshTick }) {
  const [typeFilter, setTypeFilter]     = useState('all')
  const [deptFilter, setDeptFilter]     = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [rows, setRows]                 = useState(INCIDENTS)
  const [loading, setLoading]           = useState(false)
  const [error, setError]               = useState('')

  // Load incidents from backend when logged in or on refresh
  useEffect(() => {
    const token = session?.token
    const role  = session?.user?.role
    if (!token || !role) return

    let cancelled = false

    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const upperRole = String(role).toUpperCase()
        if (upperRole === 'ADMIN') {
          const data = await api.getAllIssues(token)
          if (cancelled) return
          const issues = data?.issues || []
          setRows(issues.length ? issues.map(mapIssueToIncident) : INCIDENTS)
        } else {
          const data = await api.getAssignedIssues(token, role)
          if (cancelled) return
          const issues = data?.issues || []
          setRows(issues.length ? issues.map(mapIssueToIncident) : INCIDENTS)
        }
      } catch (err) {
        if (cancelled) return
        setError(err?.data?.message || err?.message || 'Failed to load incident history')
        setRows(INCIDENTS)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [session, refreshTick])

  const filtered = useMemo(() => rows.filter(inc => {
    if (typeFilter !== 'all'   && inc.type !== typeFilter)          return false
    if (deptFilter !== 'all'   && inc.forwardedTo !== deptFilter)   return false
    if (statusFilter !== 'all' && inc.status !== statusFilter)      return false
    return true
  }), [rows, typeFilter, deptFilter, statusFilter])

  const totals = useMemo(() => rows.reduce(
    (a, i) => { a.total++; if(i.status==='Resolved') a.resolved++; if(i.status==='In progress') a.progress++; if(i.status==='Escalated') a.escalated++; return a },
    { total:0, resolved:0, progress:0, escalated:0 }
  ), [rows])

  const activeFilters = [typeFilter, deptFilter, statusFilter].filter(f => f !== 'all').length

  return (
    <>
      <style>{IH_CSS}</style>
      <div className="ih-root">

        {/* ── Page header ──────────────────────────── */}
        <div className="ih-page-header">
          <div>
            <h2 className="ih-page-title">Incident History</h2>
            <p className="ih-page-sub">
              Full audit trail of all incidents — cameras, citizen reports, and field alerts — with actions taken and resolution timelines.
            </p>
          </div>
          <div className="ih-stats-row">
            <StatCard value={totals.total}    label="Total"       color="#64748b" icon={Ic.fileText}      delay={0}    />
            <StatCard value={totals.resolved} label="Resolved"    color="#10b981" icon={Ic.checkCircle}   delay={0.05} />
            <StatCard value={totals.progress} label="In progress" color="#f59e0b" icon={Ic.clock}         delay={0.1}  />
            <StatCard value={totals.escalated}label="Escalated"   color="#ef4444" icon={Ic.alertTriangle} delay={0.15} />
          </div>
        </div>

        {/* ── Filters ──────────────────────────────── */}
        <div className="ih-filters">
          <div className="ih-filters-header">
            <div className="ih-filters-icon"><Ic.filter width={12} height={12}/>Filters</div>
            {activeFilters > 0 && (
              <button className="ih-clear-btn" onClick={() => { setTypeFilter('all'); setDeptFilter('all'); setStatusFilter('all') }}>
                Clear all ({activeFilters})
              </button>
            )}
          </div>
          <div className="ih-filter-groups">
            <FilterGroup label="Type"       filters={TYPE_FILTERS}   active={typeFilter}   onChange={setTypeFilter}   />
            <FilterGroup label="Department" filters={DEPT_FILTERS}   active={deptFilter}   onChange={setDeptFilter}   />
            <FilterGroup label="Status"     filters={STATUS_FILTERS} active={statusFilter} onChange={setStatusFilter} />
          </div>
        </div>

        {/* ── Results line ─────────────────────────── */}
        <div className="ih-result-line">
          <span>Showing <strong>{filtered.length}</strong> of {rows.length} incidents</span>
          <span className="ih-result-hint">Click a row to expand details</span>
        </div>

        {/* ── Table ────────────────────────────────── */}
        <div className="ih-table-wrap">
          {error && (
            <div className="ih-result-hint" style={{ color: '#ef4444', marginBottom: '4px' }}>{error}</div>
          )}
          <table className="ih-table">
            <thead>
              <tr>
                <th className="ih-th">ID / Type</th>
                <th className="ih-th">Incident</th>
                <th className="ih-th">Dept</th>
                <th className="ih-th">Severity</th>
                <th className="ih-th">Status</th>
                <th className="ih-th">Duration</th>
                <th className="ih-th ih-th-chevron"></th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={7} className="ih-empty-td">Loading incidents from command centre…</td>
                </tr>
              )}
              {!loading && filtered.map((inc, i) => (
                <IncidentRow key={inc.id} incident={inc} index={i}/>
              ))}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="ih-empty-td">
                    No incidents match the selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// CSS
// ─────────────────────────────────────────────────────────────────────────────
const IH_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:wght@300;400;500;600;700&display=swap');
  @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&display=swap');

  /* ── TOKENS ──────────────────────────────────── */
  [data-jatayu-theme="light"] .ih-root,
  .ih-root {
    --ih-bg:              transparent;
    --ih-title:           #0f172a;
    --ih-sub:             #64748b;
    --ih-text:            #334155;
    --ih-muted:           #94a3b8;
    --ih-stat-bg:         #f8fafc;
    --ih-stat-border:     rgba(226,232,240,0.9);
    --ih-filter-bg:       #f8fafc;
    --ih-filter-border:   rgba(226,232,240,0.9);
    --ih-filter-group-label: #94a3b8;
    --ih-pill-bg:         #f1f5f9;
    --ih-pill-border:     rgba(226,232,240,0.9);
    --ih-pill-text:       #64748b;
    --ih-pill-hover:      #e2e8f0;
    --ih-pill-active-bg:  #4f46e5;
    --ih-pill-active-text:#ffffff;
    --ih-table-bg:        #ffffff;
    --ih-table-border:    rgba(226,232,240,0.9);
    --ih-table-shadow:    0 1px 4px rgba(15,23,42,0.04), 0 4px 20px rgba(15,23,42,0.06);
    --ih-thead-bg:        #f8fafc;
    --ih-thead-text:      #64748b;
    --ih-th-border:       rgba(226,232,240,0.9);
    --ih-row-hover:       rgba(99,102,241,0.03);
    --ih-row-open-bg:     rgba(99,102,241,0.04);
    --ih-row-border:      rgba(226,232,240,0.7);
    --ih-row-text:        #334155;
    --ih-id-text:         #0f172a;
    --ih-type-label:      #64748b;
    --ih-source-text:     #94a3b8;
    --ih-title-text:      #1e293b;
    --ih-duration-val:    #334155;
    --ih-open-tag-color:  #f59e0b;
    --ih-chevron:         #94a3b8;
    --ih-expanded-bg:     #f8fafc;
    --ih-expanded-border: rgba(226,232,240,0.7);
    --ih-exp-label:       #94a3b8;
    --ih-exp-val:         #334155;
    --ih-exp-action-bg:   #ffffff;
    --ih-exp-action-border: rgba(226,232,240,0.8);
    --ih-result-text:     #64748b;
    --ih-clear-text:      #ef4444;
    --ih-clear-bg:        rgba(239,68,68,0.06);
  }

  [data-jatayu-theme="dark"] .ih-root {
    --ih-bg:              transparent;
    --ih-title:           #f1f5f9;
    --ih-sub:             #64748b;
    --ih-text:            #cbd5e1;
    --ih-muted:           #475569;
    --ih-stat-bg:         rgba(255,255,255,0.03);
    --ih-stat-border:     rgba(255,255,255,0.07);
    --ih-filter-bg:       rgba(255,255,255,0.02);
    --ih-filter-border:   rgba(255,255,255,0.06);
    --ih-filter-group-label: #334155;
    --ih-pill-bg:         rgba(255,255,255,0.04);
    --ih-pill-border:     rgba(255,255,255,0.07);
    --ih-pill-text:       #475569;
    --ih-pill-hover:      rgba(255,255,255,0.07);
    --ih-pill-active-bg:  #4f46e5;
    --ih-pill-active-text:#ffffff;
    --ih-table-bg:        #0f1623;
    --ih-table-border:    rgba(255,255,255,0.06);
    --ih-table-shadow:    0 1px 4px rgba(0,0,0,0.3), 0 4px 24px rgba(0,0,0,0.2);
    --ih-thead-bg:        #0a0e1a;
    --ih-thead-text:      #475569;
    --ih-th-border:       rgba(255,255,255,0.05);
    --ih-row-hover:       rgba(99,102,241,0.06);
    --ih-row-open-bg:     rgba(99,102,241,0.07);
    --ih-row-border:      rgba(255,255,255,0.04);
    --ih-row-text:        #94a3b8;
    --ih-id-text:         #e2e8f0;
    --ih-type-label:      #64748b;
    --ih-source-text:     #334155;
    --ih-title-text:      #cbd5e1;
    --ih-duration-val:    #94a3b8;
    --ih-open-tag-color:  #f59e0b;
    --ih-chevron:         #334155;
    --ih-expanded-bg:     rgba(255,255,255,0.02);
    --ih-expanded-border: rgba(255,255,255,0.05);
    --ih-exp-label:       #334155;
    --ih-exp-val:         #94a3b8;
    --ih-exp-action-bg:   rgba(255,255,255,0.02);
    --ih-exp-action-border: rgba(255,255,255,0.06);
    --ih-result-text:     #475569;
    --ih-clear-text:      #f87171;
    --ih-clear-bg:        rgba(239,68,68,0.08);
  }

  /* ── KEYFRAMES ────────────────────────────────── */
  @keyframes ih-fade-up {
    from { opacity:0; transform:translateY(10px); }
    to   { opacity:1; transform:translateY(0); }
  }
  @keyframes ih-fade-in { from{opacity:0} to{opacity:1} }
  @keyframes ih-row-in {
    from { opacity:0; transform:translateX(-6px); }
    to   { opacity:1; transform:translateX(0); }
  }
  @keyframes ih-expand-in {
    from { opacity:0; transform:translateY(-6px); }
    to   { opacity:1; transform:translateY(0); }
  }
  @keyframes ih-stat-in {
    from { opacity:0; transform:translateY(8px) scale(0.97); }
    to   { opacity:1; transform:translateY(0) scale(1); }
  }
  @keyframes ih-pill-pop {
    0%  { transform:scale(0.92); }
    60% { transform:scale(1.04); }
    100%{ transform:scale(1); }
  }

  /* ── ROOT ─────────────────────────────────────── */
  .ih-root {
    font-family: 'DM Sans', system-ui, sans-serif;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  /* ── PAGE HEADER ──────────────────────────────── */
  .ih-page-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 20px;
    flex-wrap: wrap;
    animation: ih-fade-in 0.35s ease both;
  }

  .ih-page-title {
    font-family: 'Syne', sans-serif;
    font-size: 18px;
    font-weight: 800;
    color: var(--ih-title);
    letter-spacing: -0.4px;
    margin: 0;
    transition: color 0.3s;
  }

  .ih-page-sub {
    margin-top: 4px;
    font-size: 12.5px;
    color: var(--ih-sub);
    line-height: 1.6;
    max-width: 480px;
    transition: color 0.3s;
  }

  /* ── STATS ROW ────────────────────────────────── */
  .ih-stats-row {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    flex-shrink: 0;
  }

  .ih-stat {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 9px 14px;
    border-radius: 12px;
    background: var(--sc-bg, var(--ih-stat-bg));
    border: 1px solid var(--sborder, var(--ih-stat-border));
    background-color: var(--sb);
    border-color: var(--sborder);
    animation: ih-stat-in 0.4s calc(var(--delay, 0s) + 0.05s) cubic-bezier(0.34,1.56,0.64,1) both;
    transition: transform 0.2s ease;
  }
  .ih-stat:hover { transform: translateY(-1px); }

  .ih-stat-icon {
    width: 28px; height: 28px;
    border-radius: 8px;
    background: color-mix(in srgb, var(--sc) 15%, transparent);
    color: var(--sc);
    display: flex; align-items:center; justify-content:center;
    flex-shrink: 0;
  }

  .ih-stat-num {
    font-family: 'Syne', sans-serif;
    font-size: 18px;
    font-weight: 800;
    color: var(--sc);
    line-height: 1;
  }

  .ih-stat-label {
    font-size: 10px;
    color: var(--ih-muted);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-top: 1px;
    transition: color 0.3s;
  }

  /* ── FILTERS ──────────────────────────────────── */
  .ih-filters {
    background: var(--ih-filter-bg);
    border: 1px solid var(--ih-filter-border);
    border-radius: 14px;
    padding: 12px 16px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    transition: background 0.3s, border-color 0.3s;
    animation: ih-fade-in 0.4s 0.1s both;
  }

  .ih-filters-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .ih-filters-icon {
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 10.5px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.7px;
    color: var(--ih-muted);
    transition: color 0.3s;
  }

  .ih-clear-btn {
    font-size: 11px;
    font-weight: 600;
    color: var(--ih-clear-text);
    background: var(--ih-clear-bg);
    border: none;
    padding: 3px 10px;
    border-radius: 6px;
    cursor: pointer;
    font-family: 'DM Sans', sans-serif;
    transition: all 0.2s;
  }
  .ih-clear-btn:hover { opacity: 0.8; }

  .ih-filter-groups {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .ih-filter-group {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
  }

  .ih-filter-group-label {
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.7px;
    color: var(--ih-filter-group-label);
    width: 72px;
    flex-shrink: 0;
    transition: color 0.3s;
  }

  .ih-filter-pills {
    display: flex;
    flex-wrap: wrap;
    gap: 5px;
  }

  .ih-pill {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 4px 10px;
    border-radius: 999px;
    border: 1px solid var(--ih-pill-border);
    background: var(--ih-pill-bg);
    color: var(--ih-pill-text);
    font-size: 11.5px;
    font-weight: 500;
    cursor: pointer;
    font-family: 'DM Sans', sans-serif;
    transition: all 0.2s ease;
    white-space: nowrap;
  }

  .ih-pill:hover:not(.ih-pill-active) {
    background: var(--ih-pill-hover);
    color: var(--ih-title);
  }

  .ih-pill-active {
    background: var(--ih-pill-active-bg);
    border-color: var(--ih-pill-active-bg);
    color: var(--ih-pill-active-text);
    font-weight: 700;
    animation: ih-pill-pop 0.25s ease both;
  }

  .ih-pill-dot {
    width: 5px; height: 5px;
    border-radius: 50%;
    background: rgba(255,255,255,0.7);
    flex-shrink: 0;
  }

  .ih-pill-x {
    width: 14px; height: 14px;
    border-radius: 50%;
    background: rgba(255,255,255,0.2);
    display: flex; align-items:center; justify-content:center;
    flex-shrink: 0;
    transition: background 0.15s;
  }
  .ih-pill-x:hover { background: rgba(255,255,255,0.35); }

  /* ── RESULT LINE ──────────────────────────────── */
  .ih-result-line {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 11.5px;
    color: var(--ih-result-text);
    padding: 0 2px;
    animation: ih-fade-in 0.4s 0.15s both;
    transition: color 0.3s;
  }

  .ih-result-line strong {
    color: var(--ih-title);
    transition: color 0.3s;
  }

  .ih-result-hint {
    font-size: 11px;
    color: var(--ih-muted);
    font-style: italic;
    transition: color 0.3s;
  }

  /* ── TABLE ────────────────────────────────────── */
  .ih-table-wrap {
    border-radius: 16px;
    overflow: hidden;
    border: 1px solid var(--ih-table-border);
    box-shadow: var(--ih-table-shadow);
    overflow-x: auto;
    transition: border-color 0.4s, box-shadow 0.4s;
    animation: ih-fade-up 0.4s 0.1s cubic-bezier(0.22,1,0.36,1) both;
  }

  .ih-table {
    width: 100%;
    min-width: 720px;
    border-collapse: collapse;
    background: var(--ih-table-bg);
    transition: background 0.4s;
  }

  /* ── THEAD ────────────────────────────────────── */
  thead tr {
    background: var(--ih-thead-bg);
    transition: background 0.4s;
  }

  .ih-th {
    padding: 10px 14px;
    text-align: left;
    font-size: 10.5px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.7px;
    color: var(--ih-thead-text);
    border-bottom: 1px solid var(--ih-th-border);
    white-space: nowrap;
    transition: color 0.3s, border-color 0.3s;
    font-family: 'DM Sans', sans-serif;
  }

  .ih-th-chevron { width: 36px; }

  /* ── ROWS ─────────────────────────────────────── */
  .ih-row {
    border-bottom: 1px solid var(--ih-row-border);
    cursor: pointer;
    transition: background 0.15s ease;
    animation: ih-row-in 0.35s calc(var(--i, 0) * 0.05s + 0.15s) ease both;
  }

  .ih-row:hover { background: var(--ih-row-hover); }
  .ih-row-open  { background: var(--ih-row-open-bg); }
  .ih-row:last-child { border-bottom: none; }

  .ih-td {
    padding: 11px 14px;
    vertical-align: middle;
    transition: background 0.3s;
  }

  /* ── ID COLUMN ────────────────────────────────── */
  .ih-td-id { width: 140px; }

  .ih-id-col {
    display: flex;
    align-items: center;
    gap: 9px;
  }

  .ih-type-icon {
    width: 28px; height: 28px;
    border-radius: 8px;
    display: flex; align-items:center; justify-content:center;
    flex-shrink: 0;
    transition: all 0.3s;
  }

  .ih-id-text {
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    font-weight: 600;
    color: var(--ih-id-text);
    transition: color 0.3s;
  }

  .ih-type-label {
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.3px;
    margin-top: 1px;
    transition: color 0.3s;
  }

  /* ── TITLE COLUMN ─────────────────────────────── */
  .ih-td-title { min-width: 180px; }

  .ih-title-text {
    font-size: 12.5px;
    font-weight: 600;
    color: var(--ih-title-text);
    line-height: 1.3;
    transition: color 0.3s;
  }

  .ih-source-text {
    font-size: 10.5px;
    color: var(--ih-source-text);
    margin-top: 2px;
    transition: color 0.3s;
  }

  /* ── CHIPS ────────────────────────────────────── */
  .ih-dept-chip, .ih-sev-chip, .ih-status-chip {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 3px 9px;
    border-radius: 999px;
    font-size: 11px;
    font-weight: 600;
    white-space: nowrap;
    transition: all 0.3s;
  }

  /* ── DURATION ─────────────────────────────────── */
  .ih-td-dur { width: 72px; }

  .ih-duration-val {
    font-family: 'JetBrains Mono', monospace;
    font-size: 12px;
    font-weight: 500;
    color: var(--ih-duration-val);
    transition: color 0.3s;
  }

  .ih-open-tag {
    font-size: 11px;
    font-weight: 700;
    color: var(--ih-open-tag-color);
    font-family: 'DM Sans', sans-serif;
  }

  /* ── CHEVRON ──────────────────────────────────── */
  .ih-td-chevron { width: 36px; }

  .ih-chevron {
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--ih-chevron);
    transition: transform 0.25s ease, color 0.2s;
  }
  .ih-row:hover .ih-chevron { color: var(--ih-title); }

  /* ── EXPANDED ROW ─────────────────────────────── */
  .ih-expanded-row {
    background: var(--ih-table-bg);
    transition: background 0.4s;
  }

  .ih-expanded-td {
    padding: 0;
    border-bottom: 1px solid var(--ih-row-border);
  }

  .ih-expanded {
    padding: 12px 14px 14px 56px;
    background: var(--ih-expanded-bg);
    border-top: 1px solid var(--ih-expanded-border);
    animation: ih-expand-in 0.25s cubic-bezier(0.22,1,0.36,1) both;
    transition: background 0.3s, border-color 0.3s;
  }

  .ih-exp-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }

  @media (max-width: 600px) {
    .ih-exp-grid { grid-template-columns: 1fr; }
  }

  .ih-exp-full { grid-column: span 2; }

  .ih-exp-block {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .ih-exp-label {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.6px;
    color: var(--ih-exp-label);
    transition: color 0.3s;
  }

  .ih-exp-val {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 6px;
    font-size: 12px;
    color: var(--ih-exp-val);
    line-height: 1.5;
    transition: color 0.3s;
  }

  .ih-exp-arrow { color: var(--ih-muted); }

  .ih-exp-duration {
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    font-weight: 600;
    padding: 2px 7px;
    border-radius: 5px;
    background: rgba(99,102,241,0.1);
    color: #6366f1;
    border: 1px solid rgba(99,102,241,0.2);
  }

  .ih-exp-action {
    font-size: 12px;
    line-height: 1.6;
    padding: 9px 12px;
    border-radius: 9px;
    background: var(--ih-exp-action-bg);
    border: 1px solid var(--ih-exp-action-border);
    color: var(--ih-exp-val);
    display: block;
    transition: background 0.3s, border-color 0.3s, color 0.3s;
  }

  /* ── EMPTY ────────────────────────────────────── */
  .ih-empty-td {
    padding: 40px;
    text-align: center;
    font-size: 13px;
    color: var(--ih-muted);
    transition: color 0.3s;
  }

  /* ── SCROLLBAR ────────────────────────────────── */
  .ih-table-wrap::-webkit-scrollbar { height: 4px; }
  .ih-table-wrap::-webkit-scrollbar-track { background: transparent; }
  .ih-table-wrap::-webkit-scrollbar-thumb { background: var(--ih-table-border); border-radius: 99px; }
`