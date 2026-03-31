import React, { useEffect, useMemo, useState } from 'react'
import { api } from '../../../lib/api'
import { getSession } from '../../../lib/session'

const DAY_MS = 24 * 60 * 60 * 1000

function toTs(value) {
  if (!value) return 0
  const ts = new Date(value).getTime()
  return Number.isFinite(ts) ? ts : 0
}

function normalizeStatus(status) {
  const raw = String(status || '').trim().toLowerCase()
  if (!raw) return 'In progress'
  if (raw === 'resolved' || raw === 'closed' || raw === 'completed') return 'Resolved'
  if (raw === 'pending') return 'Pending'
  if (raw === 'escalated') return 'Escalated'
  if (raw === 'ongoing' || raw === 'under review' || raw === 'routed' || raw === 'in progress') return 'In progress'
  return 'In progress'
}

function isWeaponText(text) {
  const t = String(text || '').toLowerCase()
  return t.includes('weapon') || t.includes('gun') || t.includes('knife') || t.includes('arms') || t.includes('robbery')
}

function inferCategory(text, fallback = 'camera') {
  const t = String(text || '').toLowerCase()
  if (isWeaponText(t)) return 'weapon'
  if (t.includes('garbage') || t.includes('waste') || t.includes('dump') || t.includes('litter')) return 'garbage'
  if (t.includes('citizen') || t.includes('complaint') || t.includes('report')) return 'citizen'
  return fallback
}

function cleanLocation(value) {
  const raw = String(value || '').trim()
  if (!raw) return 'Unknown'
  return raw.length > 64 ? `${raw.slice(0, 64)}...` : raw
}

function parseLocationFromDescription(description) {
  const text = String(description || '')
  const match = text.match(/Location:\s*(.+)$/im)
  return match ? cleanLocation(match[1]) : 'Unknown'
}

function departmentLabel(code) {
  const raw = String(code || '').toUpperCase()
  if (raw === 'POLICE') return 'Police'
  if (raw === 'FIRE') return 'Fire'
  if (raw === 'TRAFFIC') return 'Traffic'
  if (raw === 'MUNICIPAL') return 'Municipal'
  return 'Admin'
}

function minutesBetween(startTs, endTs) {
  if (!startTs || !endTs || endTs < startTs) return null
  return Math.round((endTs - startTs) / 60000)
}

function pct(value, total) {
  if (!total) return 0
  return Math.round((value / total) * 100)
}

function MetricCard({ title, value, subtitle, tone }) {
  return (
    <article className={`an-metric an-${tone}`}>
      <div className="an-metric-value">{value}</div>
      <div className="an-metric-title">{title}</div>
      <div className="an-metric-sub">{subtitle}</div>
    </article>
  )
}

function EmptyPanel({ text }) {
  return <div className="an-empty">{text}</div>
}

export default function Analytics({ session, refreshTick }) {
  const effectiveSession = session || getSession()
  const token = effectiveSession?.token
  const role = String(effectiveSession?.user?.role || '').toUpperCase()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [issues, setIssues] = useState([])
  const [complaints, setComplaints] = useState([])
  const [hazards, setHazards] = useState([])

  useEffect(() => {
    if (!token) {
      setError('No active session found. Please login again.')
      return
    }

    let cancelled = false

    const load = async () => {
      setLoading(true)
      setError('')

      try {
        if (role === 'ADMIN') {
          const [issuesRes, complaintsRes, hazardsRes] = await Promise.allSettled([
            api.getAllIssues(token),
            api.getAllComplaints(token),
            api.getHazards(token),
          ])

          if (cancelled) return

          setIssues(issuesRes.status === 'fulfilled' ? (issuesRes.value?.issues || []) : [])
          setComplaints(complaintsRes.status === 'fulfilled' ? (complaintsRes.value?.complaints || []) : [])
          setHazards(hazardsRes.status === 'fulfilled' ? (hazardsRes.value?.hazards || []) : [])
        } else {
          const [assignedRes, complaintRes] = await Promise.allSettled([
            api.getAssignedIssues(token, role),
            role === 'MUNICIPAL' ? api.getAllComplaints(token) : Promise.resolve({ complaints: [] }),
          ])

          if (cancelled) return

          setIssues(assignedRes.status === 'fulfilled' ? (assignedRes.value?.issues || []) : [])
          setComplaints(complaintRes.status === 'fulfilled' ? (complaintRes.value?.complaints || []) : [])
          setHazards([])
        }
      } catch (err) {
        if (!cancelled) {
          setError(err?.data?.message || err?.message || 'Failed to load analytics')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [token, role, refreshTick])

  const records = useMemo(() => {
    const mappedIssues = issues.map((issue) => {
      const createdTs = toTs(issue.createdAt)
      const updatedTs = toTs(issue.updatedAt)
      const status = normalizeStatus(issue.status)

      return {
        source: 'issue',
        id: issue.issueId || issue._id,
        category: inferCategory(issue.hazardType, 'camera'),
        location: cleanLocation(issue.location?.address),
        department: departmentLabel(issue.assignedDepartment),
        status,
        createdTs,
        resolvedTs: status === 'Resolved' ? updatedTs : 0,
      }
    })

    const mappedComplaints = complaints.map((complaint) => {
      const createdTs = toTs(complaint.createdAt)
      const updatedTs = toTs(complaint.updatedAt)
      const status = normalizeStatus(complaint.status)
      const category = complaint.category
        ? inferCategory(complaint.category, 'citizen')
        : inferCategory(`${complaint.title} ${complaint.description}`, 'citizen')

      return {
        source: 'complaint',
        id: complaint.complaintId || complaint._id,
        category,
        location: parseLocationFromDescription(complaint.description),
        department: departmentLabel(complaint.assignedDepartment),
        status,
        createdTs,
        resolvedTs: status === 'Resolved' ? updatedTs : 0,
      }
    })

    const issueIds = new Set(issues.map((issue) => String(issue.issueId || '')).filter(Boolean))

    const mappedHazards = hazards
      .filter((hazard) => !hazard.issueId || !issueIds.has(String(hazard.issueId)))
      .map((hazard) => {
        const createdTs = toTs(hazard.createdAt || hazard.timestamp)
        const status = hazard.routed ? 'In progress' : 'Pending'

        return {
          source: 'hazard',
          id: hazard._id,
          category: inferCategory(hazard.type, 'camera'),
          location: cleanLocation(hazard.location?.address),
          department: departmentLabel(hazard.routedDepartment),
          status,
          createdTs,
          resolvedTs: 0,
        }
      })

    return [...mappedIssues, ...mappedComplaints, ...mappedHazards]
  }, [complaints, hazards, issues])

  const analytics = useMemo(() => {
    const total = records.length
    const open = records.filter((r) => r.status !== 'Resolved').length
    const resolved = records.filter((r) => r.status === 'Resolved').length

    const resolutionDurations = records
      .filter((r) => r.resolvedTs && r.createdTs)
      .map((r) => minutesBetween(r.createdTs, r.resolvedTs))
      .filter((v) => Number.isFinite(v))

    const avgResolveMins =
      resolutionDurations.length > 0
        ? Math.round(resolutionDurations.reduce((sum, v) => sum + v, 0) / resolutionDurations.length)
        : 0

    const byCategory = records.reduce(
      (acc, item) => {
        if (!acc[item.category]) acc[item.category] = 0
        acc[item.category] += 1
        return acc
      },
      { weapon: 0, garbage: 0, citizen: 0, camera: 0 },
    )

    const byDepartment = records.reduce((acc, item) => {
      const key = item.department || 'Admin'
      acc[key] = (acc[key] || 0) + 1
      return acc
    }, {})

    const byLocation = records.reduce((acc, item) => {
      const key = item.location || 'Unknown'
      if (!acc[key]) acc[key] = { total: 0, weapon: 0, garbage: 0, citizen: 0 }
      acc[key].total += 1
      if (item.category === 'weapon') acc[key].weapon += 1
      if (item.category === 'garbage') acc[key].garbage += 1
      if (item.category === 'citizen') acc[key].citizen += 1
      return acc
    }, {})

    const topLocations = Object.entries(byLocation)
      .map(([location, counts]) => ({ location, ...counts }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 6)

    const weaponHotspots = Object.entries(byLocation)
      .map(([location, counts]) => ({ location, count: counts.weapon }))
      .filter((row) => row.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    const mostWeaponDetected = weaponHotspots[0] || null

    const now = new Date()
    const daily = []
    for (let i = 6; i >= 0; i -= 1) {
      const day = new Date(now)
      day.setHours(0, 0, 0, 0)
      day.setDate(day.getDate() - i)
      const start = day.getTime()
      const end = start + DAY_MS

      const bucket = {
        day: day.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
        total: 0,
        weapon: 0,
        garbage: 0,
        citizen: 0,
        camera: 0,
      }

      records.forEach((record) => {
        if (record.createdTs >= start && record.createdTs < end) {
          bucket.total += 1
          bucket[record.category] = (bucket[record.category] || 0) + 1
        }
      })

      daily.push(bucket)
    }

    const maxDaily = Math.max(...daily.map((d) => d.total), 1)
    const maxDept = Math.max(...Object.values(byDepartment).map((v) => Number(v) || 0), 1)

    return {
      total,
      open,
      resolved,
      resolutionRate: pct(resolved, total),
      avgResolveMins,
      byCategory,
      byDepartment,
      topLocations,
      weaponHotspots,
      mostWeaponDetected,
      daily,
      maxDaily,
      maxDept,
    }
  }, [records])

  return (
    <>
      <style>{PAGE_CSS}</style>
      <div className="an-root">
        <header className="an-head">
          <div>
            <p className="an-eyebrow">Command Intelligence</p>
            <h2 className="an-title">Analytics & Risk Insights</h2>
            <p className="an-subtitle">
              Unified analysis across alerts, garbage incidents, and citizen reports with hotspot, weapon-pattern,
              trend, and department performance views.
            </p>
          </div>
        </header>

        {error ? <div className="an-error">{error}</div> : null}

        <section className="an-metric-grid">
          <MetricCard title="Total Incidents" value={analytics.total} subtitle="All tracked records" tone="metric-indigo" />
          <MetricCard title="Open Cases" value={analytics.open} subtitle="Pending + In progress" tone="metric-rose" />
          <MetricCard
            title="Resolution Rate"
            value={`${analytics.resolutionRate}%`}
            subtitle={`${analytics.resolved} resolved`}
            tone="metric-emerald"
          />
          <MetricCard
            title="Avg Resolve Time"
            value={analytics.avgResolveMins ? `${analytics.avgResolveMins}m` : '—'}
            subtitle="Resolved records only"
            tone="metric-amber"
          />
        </section>

        <section className="an-grid">
          <article className="an-panel">
            <div className="an-panel-head">
              <h3>7-Day Incident Trend</h3>
              <span>{loading ? 'Loading...' : 'Realtime snapshot'}</span>
            </div>

            {analytics.daily.length === 0 ? (
              <EmptyPanel text="No trend data available." />
            ) : (
              <div className="an-trend-chart">
                {analytics.daily.map((day) => (
                  <div key={day.day} className="an-bar-col">
                    <div className="an-bar-stack" title={`${day.day}: ${day.total} incidents`}>
                      <div
                        className="an-bar an-bar-weapon"
                        style={{ height: `${(day.weapon / analytics.maxDaily) * 140}px` }}
                      />
                      <div
                        className="an-bar an-bar-garbage"
                        style={{ height: `${(day.garbage / analytics.maxDaily) * 140}px` }}
                      />
                      <div
                        className="an-bar an-bar-citizen"
                        style={{ height: `${(day.citizen / analytics.maxDaily) * 140}px` }}
                      />
                      <div
                        className="an-bar an-bar-camera"
                        style={{ height: `${(day.camera / analytics.maxDaily) * 140}px` }}
                      />
                    </div>
                    <span className="an-bar-label">{day.day}</span>
                    <span className="an-bar-total">{day.total}</span>
                  </div>
                ))}
              </div>
            )}
          </article>

          <article className="an-panel">
            <div className="an-panel-head">
              <h3>Department Workload</h3>
              <span>Live distribution</span>
            </div>

            <div className="an-dept-list">
              {Object.entries(analytics.byDepartment)
                .sort((a, b) => b[1] - a[1])
                .map(([department, count]) => (
                  <div key={department} className="an-dept-row">
                    <div className="an-dept-meta">
                      <span>{department}</span>
                      <strong>{count}</strong>
                    </div>
                    <div className="an-dept-bar-track">
                      <div
                        className="an-dept-bar-fill"
                        style={{ width: `${(count / analytics.maxDept) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
            </div>
          </article>
        </section>

        <section className="an-grid an-grid-bottom">
          <article className="an-panel">
            <div className="an-panel-head">
              <h3>Location Hotspots</h3>
              <span>Top incident density</span>
            </div>

            {analytics.topLocations.length === 0 ? (
              <EmptyPanel text="No location data available." />
            ) : (
              <div className="an-hotspot-table">
                <div className="an-hotspot-head">
                  <span>Location</span>
                  <span>Total</span>
                  <span>Weapon</span>
                </div>
                {analytics.topLocations.map((row) => (
                  <div key={row.location} className="an-hotspot-row">
                    <span className="an-hotspot-location">{row.location}</span>
                    <span>{row.total}</span>
                    <span className="an-hotspot-weapon">{row.weapon}</span>
                  </div>
                ))}
              </div>
            )}
          </article>

          <article className="an-panel">
            <div className="an-panel-head">
              <h3>Weapon Detection Analysis</h3>
              <span>Critical focus area</span>
            </div>

            {analytics.mostWeaponDetected ? (
              <div className="an-weapon-highlight">
                <div className="an-weapon-label">Most Weapons Detected</div>
                <div className="an-weapon-location">{analytics.mostWeaponDetected.location}</div>
                <div className="an-weapon-count">{analytics.mostWeaponDetected.count} detections</div>
              </div>
            ) : (
              <EmptyPanel text="No weapon detections found in current data." />
            )}

            <div className="an-weapon-list">
              {analytics.weaponHotspots.map((row) => (
                <div key={row.location} className="an-weapon-row">
                  <span>{row.location}</span>
                  <strong>{row.count}</strong>
                </div>
              ))}
            </div>
          </article>
        </section>

        <section className="an-panel">
          <div className="an-panel-head">
            <h3>Category Split</h3>
            <span>Across all sources</span>
          </div>

          <div className="an-category-grid">
            <div className="an-category-card an-cat-weapon">
              <span>Weapon alerts</span>
              <strong>{analytics.byCategory.weapon}</strong>
            </div>
            <div className="an-category-card an-cat-garbage">
              <span>Garbage incidents</span>
              <strong>{analytics.byCategory.garbage}</strong>
            </div>
            <div className="an-category-card an-cat-citizen">
              <span>Citizen reports</span>
              <strong>{analytics.byCategory.citizen}</strong>
            </div>
            <div className="an-category-card an-cat-camera">
              <span>Camera/other alerts</span>
              <strong>{analytics.byCategory.camera}</strong>
            </div>
          </div>
        </section>
      </div>
    </>
  )
}

const PAGE_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=Space+Mono:wght@400;700&display=swap');

  [data-jatayu-theme="light"] .an-root,
  .an-root {
    --an-panel-bg: #ffffff;
    --an-panel-border: rgba(226,232,240,0.9);
    --an-shadow: 0 2px 10px rgba(15,23,42,0.05), 0 10px 28px rgba(15,23,42,0.05);
    --an-title: #0f172a;
    --an-sub: #64748b;
    --an-text: #334155;
    --an-muted: #94a3b8;
    --an-grid-bg: #f8fafc;
    --an-error-bg: #fff5f5;
    --an-error-text: #b42318;
    --an-error-border: #fecaca;
  }

  [data-jatayu-theme="dark"] .an-root {
    --an-panel-bg: rgba(13,17,27,0.86);
    --an-panel-border: rgba(255,255,255,0.08);
    --an-shadow: 0 2px 10px rgba(0,0,0,0.45);
    --an-title: #f1f5f9;
    --an-sub: #94a3b8;
    --an-text: #cbd5e1;
    --an-muted: #64748b;
    --an-grid-bg: rgba(255,255,255,0.03);
    --an-error-bg: rgba(239,68,68,0.14);
    --an-error-text: #fecaca;
    --an-error-border: rgba(239,68,68,0.4);
  }

  .an-root {
    display: grid;
    gap: 14px;
    font-family: 'Outfit', system-ui, sans-serif;
    color: var(--an-text);
  }

  .an-head,
  .an-panel,
  .an-metric {
    border: 1px solid var(--an-panel-border);
    background: var(--an-panel-bg);
    box-shadow: var(--an-shadow);
    border-radius: 16px;
  }

  .an-head {
    padding: 14px;
  }

  .an-eyebrow {
    margin: 0;
    font-size: 11px;
    letter-spacing: 0.6px;
    text-transform: uppercase;
    color: var(--an-muted);
    font-weight: 700;
  }

  .an-title {
    margin: 5px 0 0;
    font-size: 22px;
    color: var(--an-title);
    font-weight: 800;
  }

  .an-subtitle {
    margin: 7px 0 0;
    color: var(--an-sub);
    font-size: 13px;
    line-height: 1.55;
    max-width: 920px;
  }

  .an-error {
    border: 1px solid var(--an-error-border);
    background: var(--an-error-bg);
    color: var(--an-error-text);
    border-radius: 12px;
    padding: 10px 12px;
    font-size: 12px;
    font-weight: 700;
  }

  .an-metric-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 10px;
  }

  .an-metric {
    padding: 11px;
  }

  .an-metric-value {
    font-family: 'Space Mono', monospace;
    font-size: 22px;
    font-weight: 700;
    line-height: 1;
  }

  .an-metric-title {
    margin-top: 6px;
    font-size: 12px;
    color: var(--an-title);
    font-weight: 700;
  }

  .an-metric-sub {
    margin-top: 3px;
    font-size: 11px;
    color: var(--an-sub);
  }

  .an-metric.an-metric-indigo .an-metric-value { color: #4338ca; }
  .an-metric.an-metric-rose .an-metric-value { color: #be123c; }
  .an-metric.an-metric-emerald .an-metric-value { color: #047857; }
  .an-metric.an-metric-amber .an-metric-value { color: #b45309; }

  .an-grid {
    display: grid;
    grid-template-columns: minmax(0, 1.35fr) minmax(0, 1fr);
    gap: 12px;
  }

  .an-grid-bottom {
    grid-template-columns: 1fr 1fr;
  }

  .an-panel {
    padding: 12px;
  }

  .an-panel-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    margin-bottom: 10px;
  }

  .an-panel-head h3 {
    margin: 0;
    color: var(--an-title);
    font-size: 14px;
    font-weight: 700;
  }

  .an-panel-head span {
    color: var(--an-sub);
    font-size: 11px;
    font-weight: 700;
  }

  .an-empty {
    padding: 22px 10px;
    text-align: center;
    border: 1px dashed var(--an-panel-border);
    border-radius: 12px;
    background: var(--an-grid-bg);
    color: var(--an-sub);
    font-size: 12px;
  }

  .an-trend-chart {
    display: grid;
    grid-template-columns: repeat(7, minmax(0, 1fr));
    gap: 8px;
    align-items: end;
    min-height: 190px;
  }

  .an-bar-col {
    display: grid;
    gap: 6px;
    justify-items: center;
  }

  .an-bar-stack {
    width: 100%;
    max-width: 38px;
    min-height: 140px;
    border-radius: 10px;
    background: var(--an-grid-bg);
    border: 1px solid var(--an-panel-border);
    display: flex;
    flex-direction: column-reverse;
    overflow: hidden;
  }

  .an-bar { width: 100%; }
  .an-bar-weapon { background: #ef4444; }
  .an-bar-garbage { background: #f59e0b; }
  .an-bar-citizen { background: #06b6d4; }
  .an-bar-camera { background: #6366f1; }

  .an-bar-label {
    font-size: 10.5px;
    color: var(--an-sub);
    font-weight: 700;
  }

  .an-bar-total {
    font-family: 'Space Mono', monospace;
    font-size: 11px;
    color: var(--an-title);
    font-weight: 700;
  }

  .an-dept-list {
    display: grid;
    gap: 8px;
  }

  .an-dept-row {
    display: grid;
    gap: 4px;
  }

  .an-dept-meta {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    font-size: 12px;
    color: var(--an-text);
    font-weight: 600;
  }

  .an-dept-meta strong {
    font-family: 'Space Mono', monospace;
    color: var(--an-title);
    font-size: 12px;
  }

  .an-dept-bar-track {
    height: 9px;
    border-radius: 99px;
    background: var(--an-grid-bg);
    border: 1px solid var(--an-panel-border);
    overflow: hidden;
  }

  .an-dept-bar-fill {
    height: 100%;
    border-radius: 99px;
    background: linear-gradient(90deg, #4f46e5, #06b6d4);
  }

  .an-hotspot-table {
    display: grid;
    gap: 6px;
  }

  .an-hotspot-head,
  .an-hotspot-row {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 56px 56px;
    align-items: center;
    gap: 8px;
  }

  .an-hotspot-head {
    font-size: 10.5px;
    color: var(--an-sub);
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.4px;
  }

  .an-hotspot-row {
    font-size: 12px;
    color: var(--an-text);
    border: 1px solid var(--an-panel-border);
    background: var(--an-grid-bg);
    border-radius: 10px;
    padding: 8px;
  }

  .an-hotspot-location {
    color: var(--an-title);
    font-weight: 600;
  }

  .an-hotspot-weapon {
    color: #b91c1c;
    font-weight: 700;
    font-family: 'Space Mono', monospace;
  }

  .an-weapon-highlight {
    border: 1px solid rgba(239,68,68,0.28);
    background: rgba(239,68,68,0.1);
    border-radius: 12px;
    padding: 10px;
    margin-bottom: 10px;
  }

  .an-weapon-label {
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    font-weight: 700;
    color: #7f1d1d;
  }

  .an-weapon-location {
    margin-top: 4px;
    font-size: 13px;
    font-weight: 700;
    color: #7f1d1d;
  }

  .an-weapon-count {
    margin-top: 4px;
    font-size: 12px;
    color: #991b1b;
    font-family: 'Space Mono', monospace;
    font-weight: 700;
  }

  .an-weapon-list {
    display: grid;
    gap: 6px;
  }

  .an-weapon-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    font-size: 12px;
    color: var(--an-text);
    border-bottom: 1px dashed var(--an-panel-border);
    padding-bottom: 6px;
  }

  .an-weapon-row strong {
    font-family: 'Space Mono', monospace;
    color: #b91c1c;
  }

  .an-category-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 8px;
  }

  .an-category-card {
    border: 1px solid var(--an-panel-border);
    border-radius: 12px;
    padding: 10px;
    display: grid;
    gap: 4px;
  }

  .an-category-card span {
    font-size: 11px;
    color: var(--an-sub);
    font-weight: 700;
  }

  .an-category-card strong {
    font-size: 20px;
    font-family: 'Space Mono', monospace;
    font-weight: 700;
    line-height: 1;
  }

  .an-cat-weapon { background: rgba(239,68,68,0.1); }
  .an-cat-weapon strong { color: #b91c1c; }

  .an-cat-garbage { background: rgba(245,158,11,0.12); }
  .an-cat-garbage strong { color: #b45309; }

  .an-cat-citizen { background: rgba(6,182,212,0.12); }
  .an-cat-citizen strong { color: #0e7490; }

  .an-cat-camera { background: rgba(99,102,241,0.12); }
  .an-cat-camera strong { color: #4338ca; }

  @media (max-width: 1100px) {
    .an-metric-grid,
    .an-category-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .an-grid,
    .an-grid-bottom {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 680px) {
    .an-metric-grid,
    .an-category-grid {
      grid-template-columns: 1fr;
    }

    .an-hotspot-head,
    .an-hotspot-row {
      grid-template-columns: minmax(0, 1fr) 44px 44px;
    }
  }
`
