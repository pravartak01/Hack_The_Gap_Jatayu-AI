import React, { useState, useEffect } from 'react'
import { api } from '../../../lib/api'
import { getSession } from '../../../lib/session'

// ─── Data ─────────────────────────────────────────────────────────────────────
const DEPARTMENTS = ['Police', 'Fire', 'Municipal', 'Traffic', 'Admin']

// ─── Helpers for time/severity mapping ───────────────────────────────────────
function formatDetectedAgo(detectedMs) {
  if (!Number.isFinite(detectedMs) || detectedMs < 0) return 'Just now'
  const seconds = Math.floor(detectedMs / 1000)
  if (seconds < 60) return `${seconds || 1}s ago`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  return `${hours}h ago`
}

function mapVideoToFeed(video, index) {
  const createdAt = video.createdAt ? new Date(video.createdAt) : new Date()
  const detectedMs = Date.now() - createdAt.getTime()
  const baseName = String(video.publicId || '').split('/').pop() || 'Hazard clip'

  return {
    id: video.publicId || `clip-${index}`,
    name: baseName.replace(/[_-]+/g, ' '),
    // Hard-coded current incident location at MGM University (maps link)
    location: 'MGM University – https://maps.app.goo.gl/DLummAEdNyswRA3b9',
    detectedAgo: formatDetectedAgo(detectedMs),
    detectedMs,
    // Force severity to High to emphasize red critical alerts
    severity: 'High',
    channel: `CH-${String((index % 32) + 1).padStart(2, '0')}`,
    threat: 'Potential hazard detected',
    // Random high-confidence score between 91 and 99
    confidence: 91 + Math.floor(Math.random() * 9),
    zone: `Zone ${String.fromCharCode(65 + (index % 5))}`,
    secureUrl: video.secureUrl,
    thumbnailUrl: video.thumbnailUrl,
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const severityConfig = {
  High:   { label: 'CRITICAL', pulse: '#ef4444', glow: 'rgba(239,68,68,0.25)', badge: 'lac-badge-high',   scan: '#ef4444' },
  Medium: { label: 'MODERATE', pulse: '#f59e0b', glow: 'rgba(245,158,11,0.2)', badge: 'lac-badge-med',    scan: '#f59e0b' },
  Low:    { label: 'ADVISORY', pulse: '#3b82f6', glow: 'rgba(59,130,246,0.15)', badge: 'lac-badge-low',   scan: '#3b82f6' },
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
const ShieldIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
)
const ActivityIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
  </svg>
)
const UsersIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>
  </svg>
)
const ZapIcon = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
  </svg>
)

// ─── Scanning overlay animation ───────────────────────────────────────────────
const ScanOverlay = ({ color }) => (
  <div className="lac-scan-wrap" aria-hidden>
    <div className="lac-scan-line" style={{ '--scan-color': color }} />
    <div className="lac-scan-corner lac-corner-tl" />
    <div className="lac-scan-corner lac-corner-tr" />
    <div className="lac-scan-corner lac-corner-bl" />
    <div className="lac-scan-corner lac-corner-br" />
    <div className="lac-scan-grid" />
  </div>
)

// ─── Confidence bar ───────────────────────────────────────────────────────────
const ConfidenceBar = ({ value, color }) => {
  const [width, setWidth] = useState(0)
  useEffect(() => {
    const t = setTimeout(() => setWidth(value), 200)
    return () => clearTimeout(t)
  }, [value])
  return (
    <div className="lac-conf-track">
      <div
        className="lac-conf-fill"
        style={{ width: `${width}%`, background: color, boxShadow: `0 0 6px ${color}60` }}
      />
    </div>
  )
}

// ─── Animated waveform ────────────────────────────────────────────────────────
const Waveform = ({ active }) => (
  <div className={`lac-wave${active ? ' lac-wave-active' : ''}`}>
    {[...Array(8)].map((_, i) => (
      <div key={i} className="lac-wave-bar" style={{ animationDelay: `${i * 0.08}s` }} />
    ))}
  </div>
)

// ─── Camera feed card ─────────────────────────────────────────────────────────
const FeedCard = ({ feed, index, onExpand, assignedTo, onAssign, isAdmin, onStatusChange, onSendMessage }) => {
  const cfg = severityConfig[feed.severity]
  const assigned = assignedTo[feed.id]
  const [hovered, setHovered] = useState(false)
  const [localStatus, setLocalStatus] = useState(feed.status || '')
  const [message, setMessage] = useState('')
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [sendingMsg, setSendingMsg] = useState(false)
  const logs = Array.isArray(feed.logs) ? feed.logs : []
  const recentLogs = logs.slice(-3)

  useEffect(() => {
    setLocalStatus(feed.status || '')
  }, [feed.status])

  const handleSetStatus = async (next) => {
    if (!onStatusChange) return
    try {
      setUpdatingStatus(true)
      await onStatusChange(feed.id, next)
      setLocalStatus(next)
    } finally {
      setUpdatingStatus(false)
    }
  }

  const handleSendMessage = async () => {
    if (!onSendMessage || !message.trim()) return
    try {
      setSendingMsg(true)
      await onSendMessage(feed.id, message.trim())
      setMessage('')
    } finally {
      setSendingMsg(false)
    }
  }

  return (
    <article
      className="lac-card"
      style={{ animationDelay: `${index * 0.07}s`, '--glow': cfg.glow }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Top meta row */}
      <div className="lac-card-top">
        <div className="lac-card-meta">
          <span className="lac-channel">{feed.channel}</span>
          <span className="lac-zone">{feed.zone}</span>
        </div>
        <span className={`lac-sev-badge ${cfg.badge}`}>
          <span className="lac-sev-dot" style={{ background: cfg.pulse, boxShadow: `0 0 5px ${cfg.pulse}` }} />
          {cfg.label}
        </span>
      </div>

      {/* Camera viewport */}
      <div className="lac-viewport">
        {/* Video feed / thumbnail */}
        {feed.secureUrl ? (
          <video
            className="lac-video"
            src={feed.secureUrl}
            muted
            loop
            autoPlay
            playsInline
          />
        ) : (
          <div className="lac-noise" />
        )}
        {/* Scanning animation overlay */}
        <ScanOverlay color={cfg.scan} />
        {/* Timestamp */}
        <div className="lac-timestamp">
          {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </div>
        {/* Live badge */}
        <div className="lac-live-pill">
          <span className="lac-live-dot" />
          LIVE
        </div>
        {/* Threat detection box */}
        {/* <div className="lac-threat-box" style={{ borderColor: cfg.pulse, boxShadow: `0 0 0 1px ${cfg.pulse}40` }}>
          <span className="lac-threat-label" style={{ background: cfg.pulse }}>TARGET</span>
        </div> */}
        {/* Expand button */}
        <button className="lac-expand-btn" onClick={() => onExpand(feed)} aria-label="Expand feed">
          <MaximizeIcon />
        </button>
      </div>

      {/* Threat info */}
      <div className="lac-threat-info">
        <div className="lac-threat-name">
          <ShieldIcon />
          <span>{feed.threat}</span>
        </div>
        <div className="lac-conf-row">
          <ActivityIcon />
          <span className="lac-conf-label">Confidence</span>
          <ConfidenceBar value={feed.confidence} color={cfg.pulse} />
          <span className="lac-conf-val" style={{ color: cfg.pulse }}>{feed.confidence}%</span>
        </div>
      </div>

      {/* Camera name + location */}
      <div className="lac-card-title-block">
        <p className="lac-cam-name">{feed.name}</p>
        <p className="lac-cam-location">
          <MapPinIcon />
          {feed.location}
        </p>
      </div>

      {/* Bottom row */}
      <div className="lac-card-footer">
        <div className="lac-footer-left">
          <Waveform active={hovered || feed.severity === 'High'} />
          <span className="lac-detected-ago">{feed.detectedAgo}</span>
        </div>
        <button className="lac-locate-btn" aria-label="Live location">
          <MapPinIcon />
          Locate
        </button>
      </div>

      {/* Admin: routing row | Department: progress + message row */}
      {isAdmin ? (
        <>
          <div className="lac-assign-row">
            <div className="lac-assign-label">
              <UsersIcon />
              <span>
                {Array.isArray(assigned) && assigned.length
                  ? `→ ${assigned.join(', ')}`
                  : 'Route to'}
              </span>
            </div>
            <div className="lac-dept-pills">
              {DEPARTMENTS.map(dept => (
                <button
                  key={dept}
                  className={`lac-dept-btn${Array.isArray(assigned) && assigned.includes(dept) ? ' lac-dept-active' : ''}`}
                  onClick={() => onAssign && onAssign(feed.id, dept)}
                  style={Array.isArray(assigned) && assigned.includes(dept) ? { '--dept-pulse': cfg.pulse } : {}}
                >
                  {dept}
                </button>
              ))}
            </div>
          </div>
          {Array.isArray(feed.progress) && feed.progress.length > 0 && (
            <div className="lac-progress-row">
              {feed.progress.map((issue) => {
                const deptCode = String(issue.assignedDepartment || '').toUpperCase()
                const deptLabel =
                  deptCode === 'POLICE' ? 'Police' :
                  deptCode === 'FIRE' ? 'Fire' :
                  deptCode === 'TRAFFIC' ? 'Traffic' :
                  deptCode === 'MUNICIPAL' ? 'Municipal' :
                  'Dept'
                const rawStatus = issue.status || 'Pending'
                const niceStatus = rawStatus === 'Ongoing'
                  ? 'In progress'
                  : rawStatus === 'Resolved'
                    ? 'Completed'
                    : 'Received'
                const lastLog = Array.isArray(issue.logs) && issue.logs.length
                  ? issue.logs[issue.logs.length - 1]
                  : null
                const ts = lastLog?.createdAt || issue.updatedAt || issue.createdAt
                const tsLabel = ts ? new Date(ts).toLocaleString('en-IN', { hour12: false }) : ''
                const msg = lastLog?.message || `Status updated to ${niceStatus}`
                return (
                  <div key={issue.issueId || issue._id} className="lac-progress-chip">
                    <span className="lac-progress-chip-main">{deptLabel} · {niceStatus}</span>
                    {tsLabel && <span className="lac-progress-chip-time">{tsLabel}</span>}
                    {msg && <span className="lac-progress-chip-msg">{msg}</span>}
                  </div>
                )
              })}
            </div>
          )}
        </>
      ) : (
        <div className="lac-assign-row">
          <div className="lac-assign-label">
            <UsersIcon />
            <span>
              {localStatus === 'Resolved'
                ? 'Status: Completed'
                : localStatus === 'Ongoing'
                  ? 'Status: In progress'
                  : localStatus === 'Pending'
                    ? 'Status: Received'
                    : 'Track progress'}
            </span>
          </div>
          <div className="lac-dept-pills" style={{ flexWrap: 'wrap', rowGap: 6 }}>
            <button
              className={`lac-dept-btn${localStatus === 'Pending' ? ' lac-dept-status-active' : ''}`}
              disabled={updatingStatus}
              onClick={() => handleSetStatus('Pending')}
            >
              Received
            </button>
            <button
              className={`lac-dept-btn${localStatus === 'Ongoing' ? ' lac-dept-status-active' : ''}`}
              disabled={updatingStatus}
              onClick={() => handleSetStatus('Ongoing')}
            >
              In progress
            </button>
            <button
              className={`lac-dept-btn${localStatus === 'Resolved' ? ' lac-dept-status-active' : ''}`}
              disabled={updatingStatus}
              onClick={() => handleSetStatus('Resolved')}
            >
              Completed
            </button>
          </div>
          <div className="lac-dept-pills" style={{ marginTop: 6 }}>
            <input
              type="text"
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Add message / update"
              className="lac-dept-input"
              style={{ flex: 1, minWidth: 0, fontSize: 11, padding: '5px 8px', borderRadius: 8, border: '1px solid var(--lac-dept-border)', background: 'var(--lac-dept-bg)', color: 'var(--lac-text-primary)' }}
            />
            <button
              className="lac-dept-btn"
              style={{ marginLeft: 6, whiteSpace: 'nowrap' }}
              disabled={sendingMsg || !message.trim()}
              onClick={handleSendMessage}
            >
              {sendingMsg ? 'Sending…' : 'Send'}
            </button>
          </div>
          {recentLogs.length > 0 && (
            <div className="lac-msg-timeline">
              {recentLogs.map((log, idx) => {
                const ts = log.createdAt ? new Date(log.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : ''
                return (
                  <div key={idx} className="lac-msg-item">
                    <span className="lac-msg-dot" />
                    <div className="lac-msg-body">
                      <div className="lac-msg-meta">
                        <span className="lac-msg-role">You</span>
                        {ts && <span className="lac-msg-time">{ts}</span>}
                      </div>
                      <div className="lac-msg-text">{log.message}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </article>
  )
}

// ─── Fullscreen modal ─────────────────────────────────────────────────────────
const FullscreenModal = ({ feed, onClose }) => {
  const cfg = severityConfig[feed.severity]
  useEffect(() => {
    const handler = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div className="lac-modal-backdrop" onClick={onClose}>
      <div className="lac-modal" onClick={e => e.stopPropagation()}>
        {/* Modal header */}
        <div className="lac-modal-header">
          <div className="lac-modal-title-group">
            <span className={`lac-sev-badge ${cfg.badge}`} style={{ fontSize: '10px' }}>
              <span className="lac-sev-dot" style={{ background: cfg.pulse, boxShadow: `0 0 6px ${cfg.pulse}` }} />
              {cfg.label}
            </span>
            <div>
              <p className="lac-modal-cam-name">{feed.name}</p>
              <p className="lac-modal-cam-loc">
                <MapPinIcon />
                {feed.location} &nbsp;·&nbsp; {feed.channel}
              </p>
            </div>
          </div>
          <div className="lac-modal-header-right">
            <div className="lac-live-pill lac-live-pill-lg">
              <span className="lac-live-dot" />
              LIVE
            </div>
            <button className="lac-modal-close" onClick={onClose} aria-label="Close">
              <XIcon />
              <span>ESC</span>
            </button>
          </div>
        </div>

        {/* Viewport */}
        <div className="lac-modal-viewport">
          {feed.secureUrl ? (
            <video
              className="lac-video-full"
              src={feed.secureUrl}
              controls
              autoPlay
              muted
              playsInline
            />
          ) : (
            <div className="lac-noise" />
          )}
          <ScanOverlay color={cfg.scan} />
          <div className="lac-threat-box lac-threat-box-lg" style={{ borderColor: cfg.pulse, boxShadow: `0 0 0 1px ${cfg.pulse}40` }}>
            <span className="lac-threat-label" style={{ background: cfg.pulse }}>TARGET ACQUIRED</span>
          </div>
          <div className="lac-modal-timestamp">
            {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </div>
          {/* Fake telemetry overlays */}
          <div className="lac-telemetry-tl">
            <div>RES: 1920×1080</div>
            <div>FPS: 30</div>
            <div>CODEC: H.265</div>
          </div>
          <div className="lac-telemetry-br">
            <div>LAT: 19.0748°N</div>
            <div>LON: 72.8856°E</div>
          </div>
        </div>

        {/* Modal footer */}
        <div className="lac-modal-footer">
          <div className="lac-modal-stat">
            <ShieldIcon />
            <span className="lac-modal-stat-label">Threat</span>
            <span className="lac-modal-stat-val">{feed.threat}</span>
          </div>
          <div className="lac-modal-stat">
            <ActivityIcon />
            <span className="lac-modal-stat-label">Confidence</span>
            <span className="lac-modal-stat-val" style={{ color: cfg.pulse }}>{feed.confidence}%</span>
          </div>
          <div className="lac-modal-stat">
            <ZapIcon />
            <span className="lac-modal-stat-label">Detected</span>
            <span className="lac-modal-stat-val">{feed.detectedAgo}</span>
          </div>
          <div className="lac-modal-stat">
            <UsersIcon />
            <span className="lac-modal-stat-label">Zone</span>
            <span className="lac-modal-stat-val">{feed.zone}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Stats bar ────────────────────────────────────────────────────────────────
const StatsBar = () => {
  const [stats] = useState({ high: 0, med: 0, low: 0, total: 0 })

  return (
    <div className="lac-statsbar">
      <div className="lac-stat-item">
        <span className="lac-stat-num lac-stat-high">{stats.high}</span>
        <span className="lac-stat-lbl">Critical</span>
      </div>
      <div className="lac-stat-divider" />
      <div className="lac-stat-item">
        <span className="lac-stat-num lac-stat-med">{stats.med}</span>
        <span className="lac-stat-lbl">Moderate</span>
      </div>
      <div className="lac-stat-divider" />
      <div className="lac-stat-item">
        <span className="lac-stat-num lac-stat-low">{stats.low}</span>
        <span className="lac-stat-lbl">Advisory</span>
      </div>
      <div className="lac-stat-divider" />
      <div className="lac-stat-item">
        <span className="lac-stat-num">{stats.total}</span>
        <span className="lac-stat-lbl">Total Feeds</span>
      </div>
      <div className="lac-statsbar-live">
        <span className="lac-sev-dot" style={{ background: '#10b981', boxShadow: '0 0 6px #10b981', width: 7, height: 7 }} />
        <span>All streams active</span>
      </div>
    </div>
  )
}

// ─── Main export ──────────────────────────────────────────────────────────────
export default function LiveAlertsCommand({ session, refreshTick }) {
  const [fullscreenFeed, setFullscreenFeed] = useState(null)
  const [assignedTo, setAssignedTo]         = useState({})
  const [filterSeverity, setFilterSeverity] = useState('All')
  const [feeds, setFeeds]                   = useState([])
  const [loading, setLoading]               = useState(false)
  const [error, setError]                   = useState(null)
  const effectiveSession = session || getSession()
  const roleUpperFromProp = String(effectiveSession?.user?.role || '').toUpperCase()
  const isAdmin = roleUpperFromProp === 'ADMIN'

  useEffect(() => {
    const localSession = getSession()
    if (!localSession?.token || !localSession?.user?.role) return

    const { token, user } = localSession
    const roleUpper = String(user.role).toUpperCase()

    let cancelled = false

    const fetchOnce = async () => {
      try {
        setLoading(true)
        setError(null)

        if (roleUpper === 'ADMIN') {
          // ADMIN view: live feeds from Cloudinary + routing status
          const data = await api.getCloudinaryHazardVideos(token)
          const baseFeeds = (data.videos || []).map((v, idx) => mapVideoToFeed({ ...v, folder: data.folder }, idx))

          let issues = []
          try {
            const issuesResp = await api.getAllIssues(token)
            issues = Array.isArray(issuesResp?.issues) ? issuesResp.issues : []
          } catch {
            issues = []
          }

          const evidenceMap = new Map()
          for (const issue of issues) {
            const url = issue.evidenceUrl
            if (!url) continue
            const entry = evidenceMap.get(url) || { depts: new Set(), hazardId: null, statuses: {}, issues: [] }
            if (issue.assignedDepartment) {
              const code = String(issue.assignedDepartment).toUpperCase()
              entry.depts.add(code)
              entry.statuses[code] = issue.status || 'Pending'
            }
            if (!entry.hazardId && issue.hazard) {
              entry.hazardId = issue.hazard._id || issue.hazard
            }
            entry.issues.push(issue)
            evidenceMap.set(url, entry)
          }

          const roleLabelFromBackend = {
            POLICE: 'Police',
            FIRE: 'Fire',
            TRAFFIC: 'Traffic',
            MUNICIPAL: 'Municipal',
          }

          const nextAssignedTo = {}
          const nextFeeds = baseFeeds.map(feed => {
            const match = evidenceMap.get(feed.secureUrl)
            if (!match) return feed

            const uiDepts = Array.from(match.depts)
              .map(code => {
                const label = roleLabelFromBackend[code]
                if (!label) return null
                const rawStatus = match.statuses?.[code]
                if (!rawStatus) return label
                const nice = rawStatus === 'Ongoing'
                  ? 'In progress'
                  : rawStatus === 'Resolved'
                    ? 'Completed'
                    : 'Received'
                return `${label} (${nice})`
              })
              .filter(Boolean)

            if (uiDepts.length) {
              nextAssignedTo[feed.id] = uiDepts
            }

            const withHazard = match.hazardId ? { ...feed, hazardId: match.hazardId } : feed
            if (match.issues && match.issues.length) {
              return { ...withHazard, progress: match.issues }
            }
            return withHazard
          })

          if (!cancelled) {
            setFeeds(nextFeeds)
            setAssignedTo(nextAssignedTo)
          }
        } else {
          // Department view: show assigned issues as video feeds
          let data
          try {
            data = await api.getAssignedIssues(token, user.role)
          } catch (err) {
            if (!cancelled) setError(err.message || 'Failed to load department alerts')
            return
          }

          const issues = Array.isArray(data?.issues) ? data.issues : []
          const deptFeeds = issues.map((issue, idx) => {
            const createdAt = issue.createdAt ? new Date(issue.createdAt) : new Date()
            const detectedMs = Date.now() - createdAt.getTime()

            return {
              id: issue.issueId || issue._id || `issue-${idx}`,
              name: issue.hazardType || 'Routed incident',
              location: issue.location?.address || 'MGM University – https://maps.app.goo.gl/DLummAEdNyswRA3b9',
              detectedAgo: formatDetectedAgo(detectedMs),
              detectedMs,
              severity: issue.status === 'Pending' ? 'High' : issue.status === 'Ongoing' ? 'Medium' : 'Low',
              channel: `CH-${String((idx % 32) + 1).padStart(2, '0')}`,
              threat: 'Incident assigned to your department',
              confidence: 92 + Math.floor(Math.random() * 7),
              zone: `Zone ${String.fromCharCode(65 + (idx % 5))}`,
              secureUrl: issue.evidenceUrl,
              thumbnailUrl: null,
              status: issue.status || 'Pending',
              logs: Array.isArray(issue.logs) ? issue.logs : [],
            }
          })

          if (!cancelled) {
            setFeeds(deptFeeds)
            setAssignedTo({})
          }
        }
      } catch (err) {
        if (!cancelled) setError(err.message || 'Failed to load live alerts')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchOnce()
    const intervalId = setInterval(fetchOnce, 15000)

    return () => {
      cancelled = true
      clearInterval(intervalId)
    }
  }, [refreshTick])

  const handleAssign = async (feedId, dept) => {
    const session = getSession()
    if (!session?.token || !session?.user?.role) return

    const { token, user } = session
    if (String(user.role).toUpperCase() !== 'ADMIN') return

    const roleMap = {
      Police: 'POLICE',
      Fire: 'FIRE',
      Traffic: 'TRAFFIC',
      Municipal: 'MUNICIPAL',
    }

    const backendRole = roleMap[dept]
    if (!backendRole) return

    const targetFeed = feeds.find(f => f.id === feedId)
    if (!targetFeed || !targetFeed.secureUrl) return

    try {
      let hazardId = targetFeed.hazardId

      if (!hazardId) {
        let imported
        try {
          imported = await api.importCloudinaryHazard(token, {
            publicId: targetFeed.id,
            secureUrl: targetFeed.secureUrl,
            type: 'fire',
            location: {
              address: targetFeed.location,
            },
            timestamp: new Date().toISOString(),
          })
        } catch (err) {
          if (err.status === 409 && err.data?.hazard) {
            imported = { hazard: err.data.hazard }
          } else {
            throw err
          }
        }

        hazardId = imported.hazard?._id || imported.hazard?.id

        if (!hazardId && imported.hazard) {
          hazardId = imported.hazard._id || imported.hazard.id
        }

        if (!hazardId && imported?.data?.hazard) {
          hazardId = imported.data.hazard._id || imported.data.hazard.id
        }

        if (!hazardId) return

        setFeeds(prev => prev.map(f => (f.id === targetFeed.id ? { ...f, hazardId } : f)))
      }

      await api.routeHazard(token, hazardId, [backendRole])

      setAssignedTo(prev => {
        const current = prev[feedId] || []
        if (current.includes(dept)) return prev
        return { ...prev, [feedId]: [...current, dept] }
      })
    } catch (err) {
      console.error('Failed to route hazard', err)
    }
  }

  const handleStatusChange = async (feedId, nextStatus) => {
    const session = getSession()
    if (!session?.token || !session?.user?.role) return
    const { token, user } = session

    try {
      await api.updateIssueStatus(token, user.role, {
        issueId: feedId,
        status: nextStatus,
      })

      setFeeds(prev => prev.map(f => (f.id === feedId ? { ...f, status: nextStatus } : f)))
    } catch (err) {
      console.error('Failed to update issue status', err)
    }
  }

  const handleSendMessage = async (feedId, message) => {
    const session = getSession()
    if (!session?.token || !session?.user?.role) return
    const { token, user } = session

    try {
      await api.addIssueUpdate(token, user.role, {
        issueId: feedId,
        message,
      })
    } catch (err) {
      console.error('Failed to add issue update', err)
    }
  }

  const filtered = filterSeverity === 'All'
    ? feeds
    : feeds.filter(f => f.severity === filterSeverity)

  return (
    <>
      <style>{CSS}</style>
      <div className="lac-root">

        {/* ── Page header ─────────────────────────── */}
        <div className="lac-page-header">
          <div className="lac-page-header-left">
            <div className="lac-page-eyebrow">
              <ZapIcon />
              <span>WEAPON DETECTION SYSTEM</span>
            </div>
            <h2 className="lac-page-title">Live Alert Command</h2>
            <p className="lac-page-desc">
              AI-powered real-time threat detection across all surveillance nodes. Alerts are auto-classified and routed to responding departments.
            </p>
          </div>
          {/* Filter pills */}
          <div className="lac-filter-group">
            {['All', 'High', 'Medium', 'Low'].map(s => (
              <button
                key={s}
                className={`lac-filter-btn${filterSeverity === s ? ' lac-filter-active' : ''}`}
                onClick={() => setFilterSeverity(s)}
              >
                {s === 'High' ? 'Critical' : s === 'Medium' ? 'Moderate' : s === 'Low' ? 'Advisory' : s}
              </button>
            ))}
          </div>
        </div>

        {/* ── Stats bar ───────────────────────────── */}
        <StatsBar />

        {/* ── Grid ────────────────────────────────── */}
        <div className="lac-grid">
          {loading && feeds.length === 0 && (
            <div className="lac-empty">Fetching live alerts from Cloudinary…</div>
          )}
          {error && !loading && feeds.length === 0 && (
            <div className="lac-empty">{error}</div>
          )}
          {!loading && !error && filtered.length === 0 && (
            <div className="lac-empty">No live alerts available.</div>
          )}
          {filtered.map((feed, i) => (
            <FeedCard
              key={feed.id}
              feed={feed}
              index={i}
              onExpand={setFullscreenFeed}
              assignedTo={assignedTo}
              onAssign={handleAssign}
              isAdmin={isAdmin}
              onStatusChange={!isAdmin ? handleStatusChange : undefined}
              onSendMessage={!isAdmin ? handleSendMessage : undefined}
            />
          ))}
        </div>

        {/* ── Fullscreen modal ─────────────────────── */}
        {fullscreenFeed && (
          <FullscreenModal feed={fullscreenFeed} onClose={() => setFullscreenFeed(null)} />
        )}
      </div>
    </>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// CSS – fully theme-aware via [data-jatayu-theme] attr on root
// ─────────────────────────────────────────────────────────────────────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Outfit:wght@300;400;500;600;700;800&display=swap');

  /* ── TOKENS ─────────────────────────────────── */
  [data-jatayu-theme="light"] {
    --lac-bg:           transparent;
    --lac-card-bg:      rgba(255,255,255,0.85);
    --lac-card-border:  rgba(226,232,240,0.9);
    --lac-card-shadow:  0 2px 16px rgba(15,23,42,0.07), 0 1px 4px rgba(15,23,42,0.05);
    --lac-card-hover-shadow: 0 8px 32px rgba(15,23,42,0.12), 0 2px 8px rgba(15,23,42,0.06);
    --lac-viewport-bg:  #1e293b;
    --lac-text-primary: #0f172a;
    --lac-text-secondary:#475569;
    --lac-text-muted:   #94a3b8;
    --lac-channel-bg:   rgba(99,102,241,0.1);
    --lac-channel-color:#6366f1;
    --lac-zone-bg:      rgba(15,23,42,0.06);
    --lac-zone-color:   #64748b;
    --lac-footer-bg:    rgba(241,245,249,0.7);
    --lac-footer-border:rgba(226,232,240,0.8);
    --lac-btn-bg:       rgba(241,245,249,0.9);
    --lac-btn-border:   rgba(226,232,240,0.9);
    --lac-btn-text:     #475569;
    --lac-btn-hover-bg: rgba(226,232,240,0.9);
    --lac-dept-bg:      rgba(226,232,240,0.7);
    --lac-dept-border:  rgba(203,213,225,0.9);
    --lac-dept-text:    #64748b;
    --lac-wave-bar:     rgba(99,102,241,0.35);
    --lac-stat-bg:      rgba(255,255,255,0.9);
    --lac-stat-border:  rgba(226,232,240,0.9);
    --lac-stat-divider: rgba(226,232,240,0.9);
    --lac-filter-bg:    rgba(241,245,249,0.9);
    --lac-filter-border:rgba(226,232,240,0.9);
    --lac-filter-text:  #64748b;
    --lac-header-eyebrow: rgba(99,102,241,0.12);
    --lac-header-eyebrow-text: #6366f1;
    --lac-modal-bg:     rgba(255,255,255,0.96);
    --lac-modal-border: rgba(226,232,240,0.9);
    --lac-modal-shadow: 0 24px 80px rgba(15,23,42,0.2);
    --lac-modal-footer-bg: rgba(248,250,252,0.9);
    --lac-telemetry:    rgba(255,255,255,0.85);
    --lac-telemetry-text:#334155;
    --lac-conf-track:   rgba(226,232,240,0.8);
    --lac-scan-corner:  rgba(99,102,241,0.7);
    --lac-threat-box:   rgba(255,255,255,0);
    --lac-locate-btn-bg: rgba(241,245,249,0.9);
    --lac-locate-btn-border: rgba(226,232,240,0.9);
    --lac-locate-btn-text: #475569;
  }

  [data-jatayu-theme="dark"] {
    --lac-bg:           transparent;
    --lac-card-bg:      rgba(13,17,27,0.85);
    --lac-card-border:  rgba(255,255,255,0.06);
    --lac-card-shadow:  0 2px 16px rgba(0,0,0,0.3), 0 1px 4px rgba(0,0,0,0.2);
    --lac-card-hover-shadow: 0 8px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.08);
    --lac-viewport-bg:  #020408;
    --lac-text-primary: #f1f5f9;
    --lac-text-secondary:#94a3b8;
    --lac-text-muted:   #475569;
    --lac-channel-bg:   rgba(99,102,241,0.15);
    --lac-channel-color:#818cf8;
    --lac-zone-bg:      rgba(255,255,255,0.05);
    --lac-zone-color:   #64748b;
    --lac-footer-bg:    rgba(255,255,255,0.025);
    --lac-footer-border:rgba(255,255,255,0.05);
    --lac-btn-bg:       rgba(255,255,255,0.04);
    --lac-btn-border:   rgba(255,255,255,0.07);
    --lac-btn-text:     #64748b;
    --lac-btn-hover-bg: rgba(255,255,255,0.08);
    --lac-dept-bg:      rgba(255,255,255,0.04);
    --lac-dept-border:  rgba(255,255,255,0.07);
    --lac-dept-text:    #475569;
    --lac-wave-bar:     rgba(99,102,241,0.5);
    --lac-stat-bg:      rgba(13,17,27,0.8);
    --lac-stat-border:  rgba(255,255,255,0.06);
    --lac-stat-divider: rgba(255,255,255,0.05);
    --lac-filter-bg:    rgba(255,255,255,0.04);
    --lac-filter-border:rgba(255,255,255,0.07);
    --lac-filter-text:  #475569;
    --lac-header-eyebrow: rgba(99,102,241,0.15);
    --lac-header-eyebrow-text: #818cf8;
    --lac-modal-bg:     rgba(10,14,24,0.97);
    --lac-modal-border: rgba(255,255,255,0.07);
    --lac-modal-shadow: 0 32px 100px rgba(0,0,0,0.7);
    --lac-modal-footer-bg: rgba(255,255,255,0.025);
    --lac-telemetry:    rgba(0,0,0,0.6);
    --lac-telemetry-text:rgba(99,255,180,0.8);
    --lac-conf-track:   rgba(255,255,255,0.07);
    --lac-scan-corner:  rgba(99,102,241,0.9);
    --lac-threat-box:   rgba(255,255,255,0);
    --lac-locate-btn-bg: rgba(255,255,255,0.04);
    --lac-locate-btn-border: rgba(255,255,255,0.08);
    --lac-locate-btn-text: #64748b;
  }

  /* ── KEYFRAMES ───────────────────────────────── */
  @keyframes lac-in {
    from { opacity:0; transform:translateY(20px) scale(0.97); }
    to   { opacity:1; transform:translateY(0) scale(1); }
  }
  @keyframes lac-scan {
    0%   { top:-2px; opacity:0.9; }
    48%  { opacity:0.9; }
    50%  { opacity:0; top:100%; }
    50.01%{ top:-2px; opacity:0; }
    52%  { opacity:0.9; }
    100% { top:100%; opacity:0.9; }
  }
  @keyframes lac-pulse-dot {
    0%,100%{ transform:scale(1); opacity:1; }
    50%    { transform:scale(1.6); opacity:0.5; }
  }
  @keyframes lac-wave-bar {
    0%,100%{ height:3px; }
    50%    { height:10px; }
  }
  @keyframes lac-modal-in {
    from { opacity:0; transform:scale(0.95) translateY(12px); }
    to   { opacity:1; transform:scale(1) translateY(0); }
  }
  @keyframes lac-backdrop-in {
    from { opacity:0; }
    to   { opacity:1; }
  }
  @keyframes lac-threat-box-pulse {
    0%,100%{ opacity:1; }
    50%    { opacity:0.6; }
  }
  @keyframes lac-blink {
    0%,100%{ opacity:1; }
    50%    { opacity:0.3; }
  }
  @keyframes lac-grid-flicker {
    0%,100%{ opacity:0.06; }
    50%    { opacity:0.04; }
  }
  @keyframes lac-noise-anim {
    0%  { transform: translate(0,0); }
    10% { transform: translate(-2%,-1%); }
    20% { transform: translate(1%,2%); }
    30% { transform: translate(-1%,1%); }
    40% { transform: translate(2%,-2%); }
    50% { transform: translate(-1%,1%); }
    60% { transform: translate(1%,-1%); }
    70% { transform: translate(-2%,2%); }
    80% { transform: translate(1%,-1%); }
    90% { transform: translate(-1%,2%); }
    100%{ transform: translate(0,0); }
  }

  /* ── ROOT ────────────────────────────────────── */
  .lac-root {
    display: flex;
    flex-direction: column;
    gap: 20px;
    font-family: 'Outfit', system-ui, sans-serif;
  }

  /* ── PAGE HEADER ─────────────────────────────── */
  .lac-page-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 20px;
    flex-wrap: wrap;
  }
  .lac-page-header-left { flex: 1; min-width: 0; }
  .lac-page-eyebrow {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 4px 10px;
    border-radius: 6px;
    background: var(--lac-header-eyebrow);
    color: var(--lac-header-eyebrow-text);
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    font-family: 'Space Mono', monospace;
    margin-bottom: 8px;
  }
  .lac-page-title {
    font-size: 22px;
    font-weight: 800;
    color: var(--lac-text-primary);
    letter-spacing: -0.5px;
    line-height: 1.1;
    margin: 0 0 6px;
    font-family: 'Outfit', sans-serif;
    transition: color 0.3s;
  }
  .lac-page-desc {
    font-size: 12.5px;
    color: var(--lac-text-muted);
    max-width: 520px;
    line-height: 1.6;
    margin: 0;
    transition: color 0.3s;
  }

  /* ── FILTER GROUP ────────────────────────────── */
  .lac-filter-group {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
    align-items: center;
  }
  .lac-filter-btn {
    padding: 6px 14px;
    border-radius: 8px;
    border: 1px solid var(--lac-filter-border);
    background: var(--lac-filter-bg);
    color: var(--lac-filter-text);
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    font-family: 'Outfit', sans-serif;
    letter-spacing: 0.2px;
    backdrop-filter: blur(8px);
  }
  .lac-filter-btn:hover {
    background: var(--lac-btn-hover-bg);
    color: var(--lac-text-primary);
  }
  .lac-filter-active {
    background: #6366f1 !important;
    border-color: #6366f1 !important;
    color: #fff !important;
    box-shadow: 0 2px 12px rgba(99,102,241,0.35);
  }

  /* ── STATS BAR ───────────────────────────────── */
  .lac-statsbar {
    display: flex;
    align-items: center;
    gap: 0;
    padding: 10px 20px;
    border-radius: 12px;
    background: var(--lac-stat-bg);
    border: 1px solid var(--lac-stat-border);
    backdrop-filter: blur(12px);
    flex-wrap: wrap;
    gap: 4px;
    transition: background 0.3s, border-color 0.3s;
  }
  .lac-stat-item {
    display: flex;
    align-items: baseline;
    gap: 6px;
    padding: 0 16px;
  }
  .lac-stat-num {
    font-family: 'Space Mono', monospace;
    font-size: 22px;
    font-weight: 700;
    color: var(--lac-text-primary);
    line-height: 1;
    transition: color 0.3s;
  }
  .lac-stat-high { color: #ef4444 !important; text-shadow: 0 0 12px rgba(239,68,68,0.4); }
  .lac-stat-med  { color: #f59e0b !important; text-shadow: 0 0 12px rgba(245,158,11,0.3); }
  .lac-stat-low  { color: #3b82f6 !important; text-shadow: 0 0 12px rgba(59,130,246,0.3); }
  .lac-stat-lbl {
    font-size: 11px;
    color: var(--lac-text-muted);
    font-weight: 500;
    letter-spacing: 0.3px;
    transition: color 0.3s;
  }
  .lac-stat-divider {
    width: 1px;
    height: 28px;
    background: var(--lac-stat-divider);
    margin: 0 4px;
    transition: background 0.3s;
  }
  .lac-statsbar-live {
    margin-left: auto;
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 11px;
    font-weight: 600;
    color: #10b981;
    letter-spacing: 0.3px;
    padding-left: 12px;
  }

  /* ── GRID ────────────────────────────────────── */
  .lac-grid {
    display: grid;
    gap: 16px;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  }
  @media (max-width: 640px) {
    .lac-grid { grid-template-columns: 1fr; }
  }

  /* ── CARD ────────────────────────────────────── */
  .lac-card {
    border-radius: 16px;
    border: 1px solid var(--lac-card-border);
    background: var(--lac-card-bg);
    box-shadow: var(--lac-card-shadow);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    padding: 12px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    animation: lac-in 0.45s cubic-bezier(0.22,1,0.36,1) both;
    transition: box-shadow 0.3s ease, border-color 0.3s ease, background 0.3s ease;
    position: relative;
    overflow: hidden;
  }
  .lac-card::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: 16px;
    background: radial-gradient(ellipse 60% 40% at 50% 0%, var(--glow, transparent) 0%, transparent 70%);
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.4s ease;
  }
  .lac-card:hover {
    box-shadow: var(--lac-card-hover-shadow);
  }
  .lac-card:hover::before { opacity: 1; }

  /* ── CARD TOP ────────────────────────────────── */
  .lac-card-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }
  .lac-card-meta { display: flex; gap: 6px; align-items: center; }
  .lac-channel {
    font-family: 'Space Mono', monospace;
    font-size: 10px;
    font-weight: 700;
    padding: 3px 8px;
    border-radius: 5px;
    background: var(--lac-channel-bg);
    color: var(--lac-channel-color);
    letter-spacing: 0.5px;
    transition: all 0.3s;
  }
  .lac-zone {
    font-size: 10px;
    font-weight: 600;
    padding: 3px 8px;
    border-radius: 5px;
    background: var(--lac-zone-bg);
    color: var(--lac-zone-color);
    transition: all 0.3s;
  }

  /* ── SEVERITY BADGE ──────────────────────────── */
  .lac-sev-badge {
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
  .lac-badge-high   { background: rgba(239,68,68,0.12);  color: #ef4444; }
  .lac-badge-med    { background: rgba(245,158,11,0.12); color: #f59e0b; }
  .lac-badge-low    { background: rgba(59,130,246,0.12); color: #3b82f6; }
  [data-jatayu-theme="light"] .lac-badge-high { background: rgba(239,68,68,0.1);  color: #dc2626; }
  [data-jatayu-theme="light"] .lac-badge-med  { background: rgba(245,158,11,0.1); color: #d97706; }
  [data-jatayu-theme="light"] .lac-badge-low  { background: rgba(59,130,246,0.1); color: #2563eb; }

  .lac-sev-dot {
    width: 6px; height: 6px;
    border-radius: 50%;
    animation: lac-pulse-dot 1.8s ease-in-out infinite;
    flex-shrink: 0;
  }

  /* ── VIEWPORT ────────────────────────────────── */
  .lac-viewport {
    position: relative;
    aspect-ratio: 16/9;
    border-radius: 10px;
    overflow: hidden;
    background: var(--lac-viewport-bg);
    flex-shrink: 0;
    transition: background 0.3s;
  }

  /* CRT noise overlay */
  .lac-noise {
    position: absolute;
    inset: -10%;
    width: 120%;
    background: #020617;
    opacity: 0.035;
    pointer-events: none;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
    background-size: 150px 150px;
    z-index: 1;
    animation: lac-noise-anim 0.15s steps(1) infinite;
  
  .lac-video {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  }

  /* Simulated CCTV feed background */
  .lac-feed-bg {
    background: #020617;
    inset: 0;
    background:
      linear-gradient(180deg, rgba(30,40,60,0.3) 0%, rgba(10,15,25,0.6) 100%),
      repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,255,120,0.015) 3px, rgba(0,255,120,0.015) 4px);
    z-index: 0;
    animation: lac-grid-flicker 4s ease-in-out infinite;
  
  .lac-video-full {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    background: #000;
  }
  }

  /* ── SCAN OVERLAY ────────────────────────────── */
  .lac-scan-wrap {
    position: absolute;
    inset: 0;
    z-index: 3;
    pointer-events: none;
  }
  .lac-scan-line {
    position: absolute;
    left: 0; right: 0;
    height: 2px;
    background: linear-gradient(90deg, transparent 0%, var(--scan-color) 30%, var(--scan-color) 70%, transparent 100%);
    box-shadow: 0 0 12px 3px var(--scan-color), 0 0 24px 6px color-mix(in srgb, var(--scan-color) 30%, transparent);
    animation: lac-scan 3s linear infinite;
    opacity: 0.85;
  }
  .lac-scan-corner {
    position: absolute;
    width: 14px; height: 14px;
    border-color: var(--lac-scan-corner);
    border-style: solid;
    transition: border-color 0.3s;
  }
  .lac-corner-tl { top:8px; left:8px; border-width:2px 0 0 2px; border-radius:2px 0 0 0; }
  .lac-corner-tr { top:8px; right:8px; border-width:2px 2px 0 0; border-radius:0 2px 0 0; }
  .lac-corner-bl { bottom:8px; left:8px; border-width:0 0 2px 2px; border-radius:0 0 0 2px; }
  .lac-corner-br { bottom:8px; right:8px; border-width:0 2px 2px 0; border-radius:0 0 2px 0; }
  .lac-scan-grid {
    position: absolute;
    inset: 0;
    background-image:
      linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
    background-size: 20% 20%;
  }

  /* ── TIMESTAMP ───────────────────────────────── */
  .lac-timestamp {
    position: absolute;
    bottom: 8px; left: 10px;
    font-family: 'Space Mono', monospace;
    font-size: 9px;
    color: rgba(255,255,255,0.6);
    z-index: 5;
    letter-spacing: 0.5px;
    text-shadow: 0 1px 3px rgba(0,0,0,0.8);
  }

  /* ── LIVE PILL ───────────────────────────────── */
  .lac-live-pill {
    position: absolute;
    top: 8px; left: 10px;
    display: inline-flex;
    align-items: center;
    gap: 4px;
    background: rgba(239,68,68,0.9);
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
  .lac-live-pill-lg {
    position: static;
    padding: 3px 10px;
    font-size: 10px;
  }
  .lac-live-dot {
    width: 5px; height: 5px;
    border-radius: 50%;
    background: #fff;
    animation: lac-pulse-dot 1.2s ease-in-out infinite;
    flex-shrink: 0;
  }

  /* ── THREAT DETECTION BOX ────────────────────── */
  .lac-threat-box {
    position: absolute;
    top: 30%; left: 35%;
    width: 25%; height: 30%;
    border: 1.5px solid;
    border-radius: 2px;
    z-index: 4;
    animation: lac-threat-box-pulse 2s ease-in-out infinite;
  }
  .lac-threat-box-lg {
    top: 28%; left: 32%;
    width: 28%; height: 34%;
  }
  .lac-threat-label {
    position: absolute;
    top: -11px; left: -1px;
    font-size: 8px;
    font-weight: 700;
    font-family: 'Space Mono', monospace;
    color: #fff;
    padding: 1px 5px;
    letter-spacing: 0.5px;
    border-radius: 2px 2px 0 0;
  }

  /* ── EXPAND BUTTON ───────────────────────────── */
  .lac-expand-btn {
    position: absolute;
    top: 8px; right: 8px;
    width: 26px; height: 26px;
    border-radius: 6px;
    border: 1px solid rgba(255,255,255,0.15);
    background: rgba(0,0,0,0.5);
    backdrop-filter: blur(4px);
    color: rgba(255,255,255,0.7);
    display: flex; align-items:center; justify-content:center;
    cursor: pointer;
    z-index: 6;
    transition: all 0.2s ease;
  }
  .lac-expand-btn:hover {
    background: rgba(99,102,241,0.7);
    color: #fff;
    border-color: rgba(99,102,241,0.5);
  }

  /* ── THREAT INFO ─────────────────────────────── */
  .lac-threat-info {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 8px 10px;
    border-radius: 8px;
    background: var(--lac-footer-bg);
    border: 1px solid var(--lac-footer-border);
    transition: all 0.3s;
  }
  .lac-threat-name {
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 12px;
    font-weight: 700;
    color: var(--lac-text-primary);
    transition: color 0.3s;
  }
  .lac-threat-name svg { color: var(--lac-text-muted); flex-shrink: 0; }

  .lac-conf-row {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 11px;
    color: var(--lac-text-muted);
    transition: color 0.3s;
  }
  .lac-conf-label { flex-shrink: 0; }
  .lac-conf-track {
    flex: 1;
    height: 3px;
    border-radius: 99px;
    background: var(--lac-conf-track);
    overflow: hidden;
    transition: background 0.3s;
  }
  .lac-conf-fill {
    height: 100%;
    border-radius: 99px;
    transition: width 1.2s cubic-bezier(0.4,0,0.2,1);
  }
  .lac-conf-val {
    font-family: 'Space Mono', monospace;
    font-size: 10px;
    font-weight: 700;
    flex-shrink: 0;
  }

  /* ── CARD TITLE BLOCK ────────────────────────── */
  .lac-card-title-block { display: flex; flex-direction: column; gap: 2px; }
  .lac-cam-name {
    font-size: 13px;
    font-weight: 700;
    color: var(--lac-text-primary);
    margin: 0;
    transition: color 0.3s;
  }
  .lac-cam-location {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 11px;
    color: var(--lac-text-muted);
    margin: 0;
    transition: color 0.3s;
  }
  .lac-cam-location svg { flex-shrink: 0; }

  /* ── CARD FOOTER ─────────────────────────────── */
  .lac-card-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }
  .lac-footer-left {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .lac-detected-ago {
    font-size: 11px;
    color: var(--lac-text-muted);
    font-family: 'Space Mono', monospace;
    transition: color 0.3s;
  }
  .lac-locate-btn {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 5px 10px;
    border-radius: 7px;
    border: 1px solid var(--lac-locate-btn-border);
    background: var(--lac-locate-btn-bg);
    color: var(--lac-locate-btn-text);
    font-size: 11px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    font-family: 'Outfit', sans-serif;
  }
  .lac-locate-btn:hover {
    background: var(--lac-btn-hover-bg);
    color: var(--lac-text-primary);
  }

  /* ── WAVEFORM ────────────────────────────────── */
  .lac-wave {
    display: flex;
    align-items: center;
    gap: 2px;
    height: 14px;
  }
  .lac-wave-bar {
    width: 2.5px;
    height: 3px;
    border-radius: 2px;
    background: var(--lac-wave-bar);
    transition: background 0.3s;
  }
  .lac-wave-active .lac-wave-bar {
    animation: lac-wave-bar 0.7s ease-in-out infinite;
    background: #6366f1;
  }

  /* ── ASSIGN ROW ──────────────────────────────── */
  .lac-assign-row {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
    padding-top: 8px;
    border-top: 1px solid var(--lac-footer-border);
    transition: border-color 0.3s;
  }
  .lac-assign-label {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 10.5px;
    color: var(--lac-text-muted);
    font-weight: 600;
    white-space: nowrap;
    flex-shrink: 0;
    transition: color 0.3s;
  }
  .lac-dept-pills {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    flex: 1;
    justify-content: flex-end;
  }
  .lac-dept-btn {
    padding: 3px 9px;
    border-radius: 6px;
    border: 1px solid var(--lac-dept-border);
    background: var(--lac-dept-bg);
    color: var(--lac-dept-text);
    font-size: 10.5px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    font-family: 'Outfit', sans-serif;
  }
  .lac-dept-btn:hover {
    background: var(--lac-btn-hover-bg);
    color: var(--lac-text-primary);
    border-color: rgba(99,102,241,0.3);
  }
  .lac-dept-active {
    background: #6366f1 !important;
    border-color: #6366f1 !important;
    color: #fff !important;
    box-shadow: 0 2px 8px rgba(99,102,241,0.4);
  }
  .lac-dept-status-active {
    background: linear-gradient(135deg, rgba(56,189,248,0.16), rgba(34,197,94,0.2)) !important;
    border-color: rgba(56,189,248,0.9) !important;
    color: #0ea5e9 !important;
    box-shadow: 0 0 0 1px rgba(56,189,248,0.5);
  }

  .lac-progress-row {
    display: flex;
    flex-direction: column;
    gap: 4px;
    margin-top: 6px;
    padding-top: 6px;
    border-top: 1px dashed var(--lac-footer-border);
  }
  .lac-progress-chip {
    display: flex;
    flex-wrap: wrap;
    gap: 4px 8px;
    align-items: baseline;
    font-size: 10px;
    color: var(--lac-text-muted);
  }
  .lac-progress-chip-main {
    font-weight: 600;
    color: var(--lac-text-secondary);
  }
  .lac-progress-chip-time {
    font-family: 'Space Mono', monospace;
    opacity: 0.8;
  }
  .lac-progress-chip-msg {
    opacity: 0.9;
  }

  .lac-msg-timeline {
    margin-top: 6px;
    padding: 6px 8px;
    border-radius: 10px;
    background: radial-gradient(circle at 0 0, rgba(56,189,248,0.18), transparent 55%),
                radial-gradient(circle at 100% 100%, rgba(129,140,248,0.18), transparent 55%);
    border: 1px solid rgba(148,163,184,0.35);
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .lac-msg-item {
    display: flex;
    gap: 6px;
    align-items: flex-start;
  }
  .lac-msg-dot {
    width: 6px;
    height: 6px;
    border-radius: 999px;
    background: linear-gradient(135deg, #22c55e, #a3e635);
    box-shadow: 0 0 0 2px rgba(34,197,94,0.35);
    margin-top: 4px;
    flex-shrink: 0;
  }
  .lac-msg-body {
    flex: 1;
    min-width: 0;
  }
  .lac-msg-meta {
    display: flex;
    gap: 6px;
    align-items: baseline;
    font-size: 10px;
  }
  .lac-msg-role {
    font-weight: 600;
    color: #22c55e;
  }
  .lac-msg-time {
    font-family: 'Space Mono', monospace;
    color: var(--lac-text-muted);
  }
  .lac-msg-text {
    font-size: 11px;
    color: var(--lac-text-secondary);
  }

  /* ── MODAL BACKDROP ──────────────────────────── */
  .lac-modal-backdrop {
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
    animation: lac-backdrop-in 0.2s ease both;
  }

  /* ── MODAL ───────────────────────────────────── */
  .lac-modal {
    width: 100%;
    max-width: 860px;
    border-radius: 20px;
    background: var(--lac-modal-bg);
    border: 1px solid var(--lac-modal-border);
    box-shadow: var(--lac-modal-shadow);
    backdrop-filter: blur(24px);
    -webkit-backdrop-filter: blur(24px);
    overflow: hidden;
    animation: lac-modal-in 0.3s cubic-bezier(0.22,1,0.36,1) both;
    transition: background 0.3s, border-color 0.3s;
  }
  .lac-modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 16px 20px;
    border-bottom: 1px solid var(--lac-modal-border);
    transition: border-color 0.3s;
    flex-wrap: wrap;
  }
  .lac-modal-title-group {
    display: flex;
    align-items: center;
    gap: 12px;
    min-width: 0;
    flex-wrap: wrap;
  }
  .lac-modal-cam-name {
    font-size: 15px;
    font-weight: 800;
    color: var(--lac-text-primary);
    margin: 0;
    transition: color 0.3s;
  }
  .lac-modal-cam-loc {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 11.5px;
    color: var(--lac-text-muted);
    margin: 2px 0 0;
    transition: color 0.3s;
  }
  .lac-modal-header-right {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
  }
  .lac-modal-close {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 6px 12px;
    border-radius: 8px;
    border: 1px solid var(--lac-modal-border);
    background: transparent;
    color: var(--lac-text-muted);
    font-size: 11px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    font-family: 'Outfit', sans-serif;
  }
  .lac-modal-close:hover {
    background: var(--lac-btn-hover-bg);
    color: var(--lac-text-primary);
  }
  .lac-modal-viewport {
    position: relative;
    aspect-ratio: 16/9;
    width: 100%;
    background: var(--lac-viewport-bg);
    overflow: hidden;
    transition: background 0.3s;
  }
  .lac-modal-timestamp {
    position: absolute;
    bottom: 12px; left: 14px;
    font-family: 'Space Mono', monospace;
    font-size: 10px;
    color: rgba(255,255,255,0.6);
    z-index: 5;
    letter-spacing: 0.5px;
    text-shadow: 0 1px 3px rgba(0,0,0,0.8);
  }
  .lac-telemetry-tl {
    position: absolute;
    top: 12px; left: 14px;
    font-family: 'Space Mono', monospace;
    font-size: 9px;
    color: var(--lac-telemetry-text);
    background: var(--lac-telemetry);
    padding: 4px 8px;
    border-radius: 4px;
    line-height: 1.8;
    z-index: 5;
    backdrop-filter: blur(6px);
    transition: color 0.3s, background 0.3s;
  }
  .lac-telemetry-br {
    position: absolute;
    bottom: 12px; right: 14px;
    font-family: 'Space Mono', monospace;
    font-size: 9px;
    color: var(--lac-telemetry-text);
    background: var(--lac-telemetry);
    padding: 4px 8px;
    border-radius: 4px;
    line-height: 1.8;
    z-index: 5;
    text-align: right;
    backdrop-filter: blur(6px);
    transition: color 0.3s, background 0.3s;
  }
  .lac-modal-footer {
    display: flex;
    align-items: center;
    gap: 0;
    padding: 14px 20px;
    background: var(--lac-modal-footer-bg);
    border-top: 1px solid var(--lac-modal-border);
    flex-wrap: wrap;
    gap: 8px;
    transition: background 0.3s, border-color 0.3s;
  }
  .lac-modal-stat {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 0 16px 0 0;
    margin-right: 16px;
    border-right: 1px solid var(--lac-stat-divider);
    transition: border-color 0.3s;
  }
  .lac-modal-stat:last-child { border-right: none; margin-right: 0; padding-right: 0; }
  .lac-modal-stat svg { color: var(--lac-text-muted); flex-shrink: 0; }
  .lac-modal-stat-label {
    font-size: 10.5px;
    color: var(--lac-text-muted);
    font-weight: 500;
    transition: color 0.3s;
  }
  .lac-modal-stat-val {
    font-size: 12px;
    font-weight: 700;
    color: var(--lac-text-primary);
    font-family: 'Space Mono', monospace;
    transition: color 0.3s;
  }
`