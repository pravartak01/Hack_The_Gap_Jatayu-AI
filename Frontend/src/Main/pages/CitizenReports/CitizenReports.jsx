import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { api } from '../../../lib/api'
import { getSession } from '../../../lib/session'

const STATUS_OPTIONS = ['Pending', 'Under Review', 'Routed', 'Resolved']
const DEPARTMENT_OPTIONS = ['POLICE', 'FIRE', 'MUNICIPAL', 'TRAFFIC', 'ADMIN']
const CATEGORY_OPTIONS = ['garbage', 'road issue', 'environment', 'electricity']


function statusTone(status) {
  if (status === 'Resolved') return { bg: 'rgba(16,185,129,0.12)', text: '#059669', border: 'rgba(16,185,129,0.25)' }
  if (status === 'Routed') return { bg: 'rgba(59,130,246,0.12)', text: '#2563eb', border: 'rgba(59,130,246,0.25)' }
  if (status === 'Under Review') return { bg: 'rgba(245,158,11,0.12)', text: '#d97706', border: 'rgba(245,158,11,0.25)' }
  return { bg: 'rgba(239,68,68,0.1)', text: '#dc2626', border: 'rgba(239,68,68,0.2)' }
}

function parseLocation(description) {
  const text = String(description || '')
  const match = text.match(/Location:\s*(.+)$/im)
  return match ? match[1].trim() : 'Not shared'
}

function cleanDescription(description) {
  const text = String(description || '')
  return text.replace(/\n\nLocation:\s*(.+)$/is, '').trim()
}

export default function CitizenReports() {
  const session = getSession()
  const token = session?.token
  const role = String(session?.user?.role || '').toUpperCase()
  const canManageProgress = role === 'ADMIN' || role === 'MUNICIPAL'

  const [complaints, setComplaints] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [feedback, setFeedback] = useState('')

  const [statusDraftById, setStatusDraftById] = useState({})
  const [departmentDraftById, setDepartmentDraftById] = useState({})
  const [categoryDraftById, setCategoryDraftById] = useState({})
  const [busyById, setBusyById] = useState({})
  const [expandedComplaintId, setExpandedComplaintId] = useState(null)

  const loadComplaints = useCallback(async () => {
    if (!token) {
      setError('No active session found. Please login again.')
      setLoading(false)
      return
    }

    setLoading(true)
    setError('')

    try {
      const data = await api.getAllComplaints(token)
      const rows = Array.isArray(data?.complaints) ? data.complaints : []
      setComplaints(rows)

      const nextStatusDraft = {}
      const nextDeptDraft = {}
      const nextCategoryDraft = {}
      rows.forEach((item) => {
        nextStatusDraft[item.complaintId] = item.status || 'Pending'
        nextDeptDraft[item.complaintId] = item.assignedDepartment || 'MUNICIPAL'
        nextCategoryDraft[item.complaintId] = item.category || 'garbage'
      })

      setStatusDraftById(nextStatusDraft)
      setDepartmentDraftById(nextDeptDraft)
      setCategoryDraftById(nextCategoryDraft)
    } catch (loadError) {
      setError(loadError?.message || 'Failed to fetch citizen reports')
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    void loadComplaints()
  }, [loadComplaints])

  const metrics = useMemo(() => {
    return complaints.reduce(
      (acc, item) => {
        acc.total += 1
        if (item.status === 'Pending') acc.pending += 1
        if (item.status === 'Under Review') acc.review += 1
        if (item.status === 'Routed') acc.routed += 1
        if (item.status === 'Resolved') acc.resolved += 1
        return acc
      },
      { total: 0, pending: 0, review: 0, routed: 0, resolved: 0 },
    )
  }, [complaints])

  const filtered = useMemo(() => {
    const statusRank = {
      Pending: 0,
      'Under Review': 1,
      Routed: 2,
      Resolved: 3,
    }

    const sorted = [...complaints].sort((a, b) => {
      const aRank = statusRank[a.status] ?? 99
      const bRank = statusRank[b.status] ?? 99
      if (aRank !== bRank) return aRank - bRank
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })

    if (statusFilter === 'ALL') return sorted
    return sorted.filter((item) => item.status === statusFilter)
  }, [complaints, statusFilter])

  const setBusy = (id, value) => {
    setBusyById((prev) => ({ ...prev, [id]: value }))
  }

  const handleStatusUpdate = async (complaintId) => {
    const nextStatus = statusDraftById[complaintId]
    setBusy(complaintId, true)
    setFeedback('')

    try {
      await api.updateComplaintStatus(token, { complaintId, status: nextStatus })
      setFeedback(`Status updated for ${complaintId}`)
      await loadComplaints()
    } catch (updateError) {
      setFeedback(updateError?.message || 'Failed to update status')
    } finally {
      setBusy(complaintId, false)
    }
  }

  const handleRoute = async (complaintId) => {
    setBusy(complaintId, true)
    setFeedback('')

    try {
      await api.routeComplaint(token, {
        complaintId,
        category: categoryDraftById[complaintId] || 'garbage',
        department: departmentDraftById[complaintId] || 'MUNICIPAL',
      })
      setFeedback(`Complaint routed successfully: ${complaintId}`)
      await loadComplaints()
    } catch (routeError) {
      setFeedback(routeError?.message || 'Failed to route complaint')
    } finally {
      setBusy(complaintId, false)
    }
  }

  return (
    <>
      <style>{PAGE_CSS}</style>
      <div className="cit-reports-root">
        <header className="cit-head">
          <div>
            <p className="cit-kicker">Citizen Accountability Console</p>
            <h2 className="cit-title">Citizen Reports</h2>
            <p className="cit-subtitle">
              Live list of all citizens who raised complaints with municipal action tracking and progress controls.
            </p>
          </div>
          <button className="cit-refresh" onClick={() => void loadComplaints()} disabled={loading}>
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </header>

        <section className="cit-metrics">
          <Metric label="Total" value={metrics.total} />
          <Metric label="Pending" value={metrics.pending} />
          <Metric label="Under Review" value={metrics.review} />
          <Metric label="Routed" value={metrics.routed} />
          <Metric label="Resolved" value={metrics.resolved} />
        </section>

        <section className="cit-filters">
          {['ALL', ...STATUS_OPTIONS].map((status) => (
            <button
              key={status}
              className={`cit-filter-btn${statusFilter === status ? ' cit-filter-active' : ''}`}
              onClick={() => setStatusFilter(status)}
            >
              {status}
            </button>
          ))}
        </section>

        {feedback ? <div className="cit-feedback">{feedback}</div> : null}

        {error ? <div className="cit-error">{error}</div> : null}

        {!loading && !error && filtered.length === 0 ? (
          <div className="cit-empty">No complaints found for the selected filter.</div>
        ) : null}

        <section className="cit-list">
          {filtered.map((item) => {
            const tone = statusTone(item.status)
            const busy = Boolean(busyById[item.complaintId])
            const logs = Array.isArray(item.logs) ? [...item.logs].reverse() : []
            const isExpanded = expandedComplaintId === item.complaintId

            return (
              <article className={`cit-card${isExpanded ? ' cit-card-expanded' : ''}`} key={item.complaintId}>
                <button
                  type="button"
                  className="cit-card-head-btn"
                  onClick={() => setExpandedComplaintId((prev) => (prev === item.complaintId ? null : item.complaintId))}
                >
                  <div>
                    <p className="cit-id">{item.complaintId}</p>
                    <h3 className="cit-card-title">{item.title}</h3>
                    <p className="cit-card-sub">{item.citizenName || 'Citizen'} · {new Date(item.createdAt).toLocaleString()}</p>
                  </div>
                  <div className="cit-head-right">
                    <span className="cit-status" style={{ background: tone.bg, color: tone.text, borderColor: tone.border }}>
                      {item.status}
                    </span>
                    <span className={`cit-chevron${isExpanded ? ' cit-chevron-open' : ''}`}>▼</span>
                  </div>
                </button>

                {isExpanded ? (
                  <>
                    <div className="cit-citizen-grid">
                      <Detail label="Citizen Name" value={item.citizenName || 'Unavailable'} />
                      <Detail label="Citizen Email" value={item.citizenEmail || 'Unavailable'} />
                      <Detail label="Issue ID" value={item.issueId || 'Not generated'} />
                      <Detail label="Department" value={item.assignedDepartment || 'Not assigned'} />
                      <Detail label="Location" value={parseLocation(item.description)} />
                      <Detail label="Submitted" value={new Date(item.createdAt).toLocaleString()} />
                    </div>

                    <p className="cit-description">{cleanDescription(item.description)}</p>

                    {Array.isArray(item.media) && item.media.length > 0 ? (
                      <div className="cit-media-row">
                        {item.media.slice(0, 5).map((m, idx) => (
                          <a key={`${item.complaintId}-media-${idx}`} href={m.url} target="_blank" rel="noreferrer" className="cit-media-chip">
                            {m.type}
                          </a>
                        ))}
                      </div>
                    ) : null}

                    <div className="cit-divider" />

                    <div className="cit-progress-head">Municipal Progress Timeline</div>
                    {logs.length ? (
                      <div className="cit-log-list">
                        {logs.slice(0, 4).map((log, idx) => (
                          <div key={`${item.complaintId}-log-${idx}`} className="cit-log-item">
                            <div className="cit-log-dot" />
                            <div>
                              <div className="cit-log-action">{log.action || 'Update'}</div>
                              <div className="cit-log-message">{log.message || 'Progress updated'}</div>
                              <div className="cit-log-time">
                                {log.createdAt ? new Date(log.createdAt).toLocaleString() : 'Time unavailable'}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="cit-no-log">No progress updates yet.</div>
                    )}

                    {canManageProgress ? (
                      <div className="cit-actions-panel">
                        <div className="cit-action-group">
                          <label>Status update</label>
                          <div className="cit-action-row">
                            <select
                              value={statusDraftById[item.complaintId] || 'Pending'}
                              onChange={(e) =>
                                setStatusDraftById((prev) => ({ ...prev, [item.complaintId]: e.target.value }))
                              }
                            >
                              {STATUS_OPTIONS.map((status) => (
                                <option key={status} value={status}>
                                  {status}
                                </option>
                              ))}
                            </select>
                            <button disabled={busy} onClick={() => void handleStatusUpdate(item.complaintId)}>
                              {busy ? 'Saving...' : 'Update'}
                            </button>
                          </div>
                        </div>

                        <div className="cit-action-group">
                          <label>Route to department</label>
                          <div className="cit-action-row">
                            <select
                              value={departmentDraftById[item.complaintId] || 'MUNICIPAL'}
                              onChange={(e) =>
                                setDepartmentDraftById((prev) => ({ ...prev, [item.complaintId]: e.target.value }))
                              }
                            >
                              {DEPARTMENT_OPTIONS.map((dept) => (
                                <option key={dept} value={dept}>
                                  {dept}
                                </option>
                              ))}
                            </select>
                            <select
                              value={categoryDraftById[item.complaintId] || 'garbage'}
                              onChange={(e) =>
                                setCategoryDraftById((prev) => ({ ...prev, [item.complaintId]: e.target.value }))
                              }
                            >
                              {CATEGORY_OPTIONS.map((cat) => (
                                <option key={cat} value={cat}>
                                  {cat}
                                </option>
                              ))}
                            </select>
                            <button disabled={busy} onClick={() => void handleRoute(item.complaintId)}>
                              {busy ? 'Routing...' : 'Route'}
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="cit-readonly">You are in read-only mode. Municipal/Admin role required to update progress.</div>
                    )}
                  </>
                ) : null}
              </article>
            )
          })}
        </section>
      </div>
    </>
  )
}

function Metric({ label, value }) {
  return (
    <div className="cit-metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

function Detail({ label, value }) {
  return (
    <div className="cit-detail">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

const PAGE_CSS = `
  .cit-reports-root {
    display: grid;
    gap: 14px;
    font-family: 'DM Sans', system-ui, sans-serif;
  }

  .cit-head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
    flex-wrap: wrap;
    background: #ffffff;
    border: 1px solid #e5e7eb;
    border-radius: 16px;
    padding: 16px;
  }

  .cit-kicker { margin: 0; font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: .5px; }
  .cit-title { margin: 6px 0 0; font-size: 22px; font-weight: 800; color: #0f172a; }
  .cit-subtitle { margin: 6px 0 0; font-size: 13px; color: #64748b; max-width: 760px; line-height: 1.5; }

  .cit-refresh {
    border: 1px solid #dbe3f0;
    background: #f8fafc;
    color: #0f172a;
    border-radius: 10px;
    padding: 8px 12px;
    font-size: 12px;
    font-weight: 700;
    cursor: pointer;
  }

  .cit-metrics {
    display: grid;
    grid-template-columns: repeat(5, minmax(0,1fr));
    gap: 10px;
  }

  .cit-metric {
    background: #ffffff;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    padding: 10px 12px;
    display: grid;
    gap: 3px;
  }

  .cit-metric span { font-size: 11px; color: #64748b; font-weight: 700; }
  .cit-metric strong { font-size: 20px; color: #0f172a; line-height: 1; }

  .cit-filters {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }

  .cit-filter-btn {
    border: 1px solid #e2e8f0;
    background: #ffffff;
    color: #334155;
    border-radius: 999px;
    padding: 6px 12px;
    font-size: 12px;
    font-weight: 700;
    cursor: pointer;
  }

  .cit-filter-active {
    background: #0f172a;
    color: #ffffff;
    border-color: #0f172a;
  }

  .cit-feedback, .cit-error, .cit-empty, .cit-readonly {
    background: #ffffff;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    padding: 10px 12px;
    font-size: 12px;
  }
  .cit-error { border-color: #f5c2c2; color: #b42318; }
  .cit-feedback { border-color: #b8e0c8; color: #0f7a40; }
  .cit-readonly { color: #64748b; margin-top: 10px; }

  .cit-list {
    display: grid;
    gap: 12px;
  }

  .cit-card {
    background: #ffffff;
    border: 1px solid #e5e7eb;
    border-radius: 16px;
    padding: 14px;
    display: grid;
    gap: 10px;
  }

  .cit-card-expanded {
    box-shadow: 0 10px 24px rgba(15, 23, 42, 0.08);
    border-color: #d7deeb;
  }

  .cit-card-head-btn {
    border: none;
    background: transparent;
    padding: 0;
    width: 100%;
    text-align: left;
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 10px;
    cursor: pointer;
  }

  .cit-head-right {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .cit-card-sub {
    margin: 4px 0 0;
    font-size: 11px;
    color: #64748b;
    font-weight: 600;
  }

  .cit-chevron {
    font-size: 11px;
    color: #64748b;
    font-weight: 800;
    transition: transform 0.2s ease;
    display: inline-block;
  }

  .cit-chevron-open {
    transform: rotate(180deg);
  }

  .cit-card-top {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 10px;
    flex-wrap: wrap;
  }

  .cit-id { margin: 0; font-size: 11px; color: #64748b; font-weight: 700; }
  .cit-card-title { margin: 4px 0 0; font-size: 16px; color: #0f172a; font-weight: 800; }

  .cit-status {
    border: 1px solid transparent;
    border-radius: 999px;
    padding: 4px 10px;
    font-size: 11px;
    font-weight: 800;
    text-transform: uppercase;
  }

  .cit-citizen-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0,1fr));
    gap: 8px;
  }

  .cit-detail {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    padding: 8px 10px;
    display: grid;
    gap: 3px;
  }

  .cit-detail span { font-size: 10px; color: #64748b; font-weight: 700; text-transform: uppercase; letter-spacing: .4px; }
  .cit-detail strong { font-size: 12px; color: #1e293b; font-weight: 700; line-height: 1.4; }

  .cit-description {
    margin: 0;
    font-size: 13px;
    color: #475569;
    line-height: 1.6;
  }

  .cit-media-row {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }

  .cit-media-chip {
    text-decoration: none;
    border: 1px solid #dbeafe;
    background: #eff6ff;
    color: #1d4ed8;
    border-radius: 999px;
    padding: 4px 10px;
    font-size: 11px;
    font-weight: 700;
    text-transform: capitalize;
  }

  .cit-divider { height: 1px; background: #edf2f7; }
  .cit-progress-head { font-size: 11px; font-weight: 800; color: #475569; letter-spacing: .5px; text-transform: uppercase; }

  .cit-log-list { display: grid; gap: 8px; }
  .cit-log-item { display: grid; grid-template-columns: 8px 1fr; gap: 8px; }
  .cit-log-dot { width: 7px; height: 7px; border-radius: 50%; background: #138044; margin-top: 6px; }
  .cit-log-action { font-size: 12px; font-weight: 800; color: #0f172a; }
  .cit-log-message { margin-top: 2px; font-size: 12px; color: #475569; line-height: 1.45; }
  .cit-log-time { margin-top: 2px; font-size: 11px; color: #94a3b8; }
  .cit-no-log { font-size: 12px; color: #94a3b8; font-style: italic; }

  .cit-actions-panel {
    display: grid;
    gap: 10px;
    margin-top: 2px;
  }

  .cit-action-group {
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    padding: 10px;
    background: #f8fafc;
  }

  .cit-action-group label {
    display: block;
    margin-bottom: 8px;
    font-size: 11px;
    color: #475569;
    font-weight: 800;
    letter-spacing: .4px;
    text-transform: uppercase;
  }

  .cit-action-row {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }

  .cit-action-row select,
  .cit-action-row button {
    border-radius: 8px;
    border: 1px solid #cbd5e1;
    background: #ffffff;
    color: #0f172a;
    padding: 7px 10px;
    font-size: 12px;
    font-weight: 700;
  }

  .cit-action-row button {
    cursor: pointer;
    background: #0f172a;
    border-color: #0f172a;
    color: #ffffff;
  }

  .cit-action-row button:disabled { opacity: .6; cursor: not-allowed; }

  @media (max-width: 980px) {
    .cit-metrics { grid-template-columns: repeat(2, minmax(0,1fr)); }
    .cit-citizen-grid { grid-template-columns: repeat(2, minmax(0,1fr)); }
  }

  @media (max-width: 640px) {
    .cit-citizen-grid { grid-template-columns: 1fr; }
    .cit-action-row { flex-direction: column; }
    .cit-action-row select,
    .cit-action-row button { width: 100%; }
  }
`
