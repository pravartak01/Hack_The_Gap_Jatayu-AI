import React, { useState, useEffect } from 'react'
import Sidebar from './Sidebar.jsx'
import { api } from '../lib/api.js'
import LiveAlertsCommand from './pages/LiveAlertsCommand/LiveAlertsCommand.jsx'
import GarbageMonitoring from './pages/GarbageMonitoring/GarbageMonitoring.jsx'
import CitizenReports from './pages/CitizenReports/CitizenReports.jsx'
import CameraNetwork from './pages/CameraNetwork/CameraNetwork.jsx'
import IncidentHistory from './pages/IncidentHistory/IncidentHistory.jsx'
import Analytics from './pages/Analytics/Analytics.jsx'
import DepartmentPanel from './pages/DepartmentPanel/DepartmentPanel.jsx'
import Settings from './pages/Settings/Settings.jsx'

// ─── Page registry ────────────────────────────────────────────────────────────
const PAGES = {
  'live-alerts':        { component: LiveAlertsCommand, label: 'Live Alerts Command',  sub: 'Real-time incident tracking across all districts', props: { alertMode: 'all' } },
  'hazard-alerts':      { component: LiveAlertsCommand, label: 'Hazard Alerts',        sub: 'All non-garbage hazard alerts and operational status', props: { alertMode: 'hazard' } },
  'garbage-alerts':     { component: LiveAlertsCommand, label: 'Garbage Alerts',       sub: 'Waste-specific alerts and their departmental progress', props: { alertMode: 'garbage' } },
  'garbage-monitoring': { component: GarbageMonitoring, label: 'Waste Monitoring',      sub: 'Municipal sanitation coverage and complaint tracking' },
  'citizen-reports':    { component: CitizenReports,    label: 'Citizen Reports',       sub: 'Incoming civic issues filed by the public' },
  'camera-network':     { component: CameraNetwork,     label: 'Camera Network',        sub: 'CCTV feeds and surveillance infrastructure' },
  'incident-history':   { component: IncidentHistory,   label: 'Incident History',      sub: 'Closed and archived case records' },
  analytics:            { component: Analytics,         label: 'Analytics',             sub: 'AI-generated insights and trend analysis' },
  'department-panel':   { component: DepartmentPanel,   label: 'Department Panel',      sub: 'Inter-agency coordination and resource allocation' },
  settings:             { component: Settings,          label: 'Settings',              sub: 'Platform configuration and access management' },
}

// ─── Icon components ──────────────────────────────────────────────────────────
const BellIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/>
  </svg>
)

const SearchIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
)

const ChevronRight = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6"/>
  </svg>
)

const MenuIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
  </svg>
)

const RefreshIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/>
    <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/>
  </svg>
)

// ─── Breadcrumb ───────────────────────────────────────────────────────────────
const Breadcrumb = ({ page }) => (
  <div className="ml-breadcrumb">
    <span className="ml-bc-root">Jatayu AI</span>
    <ChevronRight />
    <span className="ml-bc-current">{page?.label ?? 'Dashboard'}</span>
  </div>
)

// ─── Live clock ───────────────────────────────────────────────────────────────
const LiveClock = () => {
  const [time, setTime] = useState('')
  const [date, setDate] = useState('')

  useEffect(() => {
    const update = () => {
      const now = new Date()
      setTime(now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }))
      setDate(now.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }))
    }
    update()
    const id = setInterval(update, 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="ml-clock">
      <span className="ml-clock-time">{time}</span>
      <span className="ml-clock-date">{date}</span>
    </div>
  )
}

// ─── Search bar ───────────────────────────────────────────────────────────────
const SearchBar = () => {
  const [focused, setFocused] = useState(false)
  return (
    <div className={`ml-search${focused ? ' ml-search-focused' : ''}`}>
      <SearchIcon />
      <input
        type="text"
        placeholder="Search incidents, reports…"
        className="ml-search-input"
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
      <kbd className="ml-search-kbd">⌘K</kbd>
    </div>
  )
}

// ─── Notification bell with dot ───────────────────────────────────────────────
const NotificationBtn = () => (
  <button className="ml-icon-btn ml-notif-btn" aria-label="Notifications">
    <BellIcon />
    <span className="ml-notif-dot" />
  </button>
)

// ─── Page transition wrapper ──────────────────────────────────────────────────
const PageTransition = ({ children, pageKey }) => {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 30)
    return () => clearTimeout(t)
  }, [])

  return (
    <div key={pageKey} className={`ml-page-transition${visible ? ' ml-page-visible' : ''}`}>
      {children}
    </div>
  )
}

// ─── Main Layout ──────────────────────────────────────────────────────────────
export default function MainLayout({ session, onLogout = () => {} }) {
  const [activePage, setActivePage]   = useState('live-alerts')
  const [collapsed, setCollapsed]     = useState(false)
  const [isDark, setIsDark]           = useState(() => {
    if (typeof window === 'undefined') return false
    const s = localStorage.getItem('jatayu-theme')
    if (s) return s === 'dark'
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })
  const [refreshing, setRefreshing]   = useState(false)
  const [refreshTick, setRefreshTick] = useState(0)
  const [mobileOpen, setMobileOpen]   = useState(false)
  const [badgeCounts, setBadgeCounts] = useState({})

  const userName = session?.user?.name || ''
  const userRole = (session?.user?.role || '').toUpperCase()
  const userInitials = userName
    ? userName
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map(part => part[0].toUpperCase())
        .join('')
    : 'JA'

  const isAdmin = userRole === 'ADMIN'
  const restrictedForNonAdmin = new Set(['hazard-alerts', 'garbage-alerts', 'garbage-monitoring', 'department-panel', 'analytics'])
  const allowedPageIds = Object.keys(PAGES).filter(id => isAdmin || !restrictedForNonAdmin.has(id))

  // Ensure activePage is always one of the allowed pages for this role
  useEffect(() => {
    if (!allowedPageIds.includes(activePage)) {
      setActivePage(allowedPageIds[0] || 'live-alerts')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userRole])

  // Sync theme with DOM
  useEffect(() => {
    document.documentElement.setAttribute('data-jatayu-theme', isDark ? 'dark' : 'light')
    localStorage.setItem('jatayu-theme', isDark ? 'dark' : 'light')
  }, [isDark])

  useEffect(() => {
    const token = session?.token
    const role = String(session?.user?.role || '').toUpperCase()

    if (!token || !role) {
      setBadgeCounts({})
      return
    }

    let cancelled = false

    const readArray = (result, key) => {
      if (result.status !== 'fulfilled') return []
      const rows = result.value?.[key]
      return Array.isArray(rows) ? rows : []
    }

    const isGarbageIssue = (issue) => {
      const hazardType = String(issue?.hazardType || '').toLowerCase()
      return hazardType.includes('garbage') || hazardType.includes('waste') || hazardType.includes('litter')
    }

    const unresolvedIssueCount = (issues) =>
      issues.filter((issue) => String(issue.status || '').toUpperCase() !== 'RESOLVED').length

    const unresolvedComplaintCount = (complaints) =>
      complaints.filter((item) => String(item.status || '').toUpperCase() !== 'RESOLVED').length

    const loadBadgeCounts = async () => {
      try {
        if (role === 'ADMIN') {
          const [issuesRes, weaponVideosRes, garbageVideosRes, hazardVideosRes, complaintsRes] = await Promise.allSettled([
            api.getAllIssues(token),
            api.getWeaponAlertVideos(token),
            api.getGarbageAlertVideos(token),
            api.getHazardAlertVideos(token),
            api.getAllComplaints(token),
          ])

          const issues = readArray(issuesRes, 'issues')
          const complaints = readArray(complaintsRes, 'complaints')

          const typedVideos = [
            ...readArray(weaponVideosRes, 'videos').map((video) => ({ ...video, __kind: 'Weapon' })),
            ...readArray(garbageVideosRes, 'videos').map((video) => ({ ...video, __kind: 'Garbage' })),
            ...readArray(hazardVideosRes, 'videos').map((video) => ({ ...video, __kind: 'Hazard' })),
          ]

          const seenVideoIds = new Set()
          const uniqueVideos = []
          for (const video of typedVideos) {
            const key = String(video?.publicId || video?.secureUrl || '').trim()
            if (!key || seenVideoIds.has(key)) continue
            seenVideoIds.add(key)
            uniqueVideos.push(video)
          }

          const issuesByEvidence = new Map()
          for (const issue of issues) {
            const url = String(issue?.evidenceUrl || '').trim()
            if (!url) continue
            if (!issuesByEvidence.has(url)) {
              issuesByEvidence.set(url, [])
            }
            issuesByEvidence.get(url).push(issue)
          }

          const activeVideoFeeds = uniqueVideos.filter((video) => {
            const url = String(video?.secureUrl || '').trim()
            const linkedIssues = url ? (issuesByEvidence.get(url) || []) : []

            if (!linkedIssues.length) return true
            return linkedIssues.some((issue) => String(issue?.status || '').toUpperCase() !== 'RESOLVED')
          })

          const knownEvidenceUrls = new Set(activeVideoFeeds.map((video) => String(video?.secureUrl || '').trim()).filter(Boolean))
          const activeIssueOnlyFeeds = issues.filter((issue) => {
            const status = String(issue?.status || '').toUpperCase()
            if (status === 'RESOLVED') return false
            const url = String(issue?.evidenceUrl || '').trim()
            if (!url) return true
            return !knownEvidenceUrls.has(url)
          })

          const activeHazardFromVideos = activeVideoFeeds.filter((video) => video.__kind !== 'Garbage').length
          const activeGarbageFromVideos = activeVideoFeeds.filter((video) => video.__kind === 'Garbage').length

          const activeHazardFromIssues = activeIssueOnlyFeeds.filter((issue) => !isGarbageIssue(issue)).length
          const activeGarbageFromIssues = activeIssueOnlyFeeds.filter((issue) => isGarbageIssue(issue)).length

          const liveAlertCount = activeVideoFeeds.length + activeIssueOnlyFeeds.length
          const hazardAlertCount = activeHazardFromVideos + activeHazardFromIssues
          const garbageAlertCount = activeGarbageFromVideos + activeGarbageFromIssues

          if (!cancelled) {
            setBadgeCounts({
              'live-alerts': liveAlertCount,
              'hazard-alerts': hazardAlertCount,
              'garbage-alerts': garbageAlertCount,
              'camera-network': activeVideoFeeds.length,
              'citizen-reports': unresolvedComplaintCount(complaints),
            })
          }
          return
        }

        if (role === 'MUNICIPAL') {
          const [issuesRes, complaintsRes] = await Promise.allSettled([
            api.getAssignedIssues(token, role),
            api.getAllComplaints(token),
          ])

          const issues = readArray(issuesRes, 'issues')
          const complaints = readArray(complaintsRes, 'complaints')

          if (!cancelled) {
            setBadgeCounts({
              'live-alerts': unresolvedIssueCount(issues),
              'hazard-alerts': null,
              'garbage-alerts': null,
              'camera-network': issues.length,
              'citizen-reports': unresolvedComplaintCount(complaints),
            })
          }
          return
        }

        const issueData = await api.getAssignedIssues(token, role)
        const issues = Array.isArray(issueData?.issues) ? issueData.issues : []

        if (!cancelled) {
          setBadgeCounts({
            'live-alerts': unresolvedIssueCount(issues),
            'hazard-alerts': null,
            'garbage-alerts': null,
            'camera-network': issues.length,
            'citizen-reports': null,
          })
        }
      } catch {
        if (!cancelled) {
          setBadgeCounts({})
        }
      }
    }

    void loadBadgeCounts()

    return () => {
      cancelled = true
    }
  }, [session?.token, session?.user?.role, refreshTick])

  const safePageKey = allowedPageIds.includes(activePage) ? activePage : (allowedPageIds[0] || 'live-alerts')
  const page = PAGES[safePageKey]
  const ActiveComponent = page?.component ?? LiveAlertsCommand
  const activePageProps = page?.props || {}

  const handleRefresh = () => {
    setRefreshing(true)
    setRefreshTick(t => t + 1)
    setTimeout(() => setRefreshing(false), 900)
  }

  const handlePageChange = (id) => {
    if (!allowedPageIds.includes(id)) return
    setActivePage(id)
    setMobileOpen(false)
  }

  return (
    <>
      <style>{LAYOUT_CSS}</style>
      <div className="ml-root" data-jatayu-theme={isDark ? 'dark' : 'light'}>

        {/* ── Mobile overlay ─────────────────────────── */}
        {mobileOpen && (
          <div className="ml-mobile-overlay" onClick={() => setMobileOpen(false)} />
        )}

        {/* ── Sidebar ────────────────────────────────── */}
        <div className={`ml-sidebar-wrap${mobileOpen ? ' ml-sidebar-mobile-open' : ''}`}>
          <Sidebar
            active={activePage}
            onChange={handlePageChange}
            isDark={isDark}
            onThemeToggle={() => setIsDark(v => !v)}
            collapsed={collapsed}
            onCollapse={() => setCollapsed(v => !v)}
            session={session}
            badgeCounts={badgeCounts}
          />
        </div>

        {/* ── Main ───────────────────────────────────── */}
        <div className="ml-main">

          {/* ── Top Header ───────────────────────── */}
          <header className="ml-header">
            {/* Mobile menu */}
            <button
              className="ml-mobile-menu-btn"
              onClick={() => setMobileOpen(v => !v)}
              aria-label="Open menu"
            >
              <MenuIcon />
            </button>

            {/* Breadcrumb + title */}
            <div className="ml-header-left">
              <Breadcrumb page={page} />
              <h1 className="ml-page-title">{page?.label ?? 'Dashboard'}</h1>
            </div>

            {/* Right controls */}
            <div className="ml-header-right">
              <SearchBar />

              <button
                className={`ml-icon-btn${refreshing ? ' ml-refreshing' : ''}`}
                onClick={handleRefresh}
                aria-label="Refresh"
                title="Refresh"
              >
                <RefreshIcon />
              </button>

              <NotificationBtn />

              <button
                type="button"
                className="ml-logout-btn"
                onClick={onLogout}
              >
                Logout
              </button>

              {/* Avatar */}
              <div className="ml-header-avatar" title={userName || 'Jatayu AI'}>
                <span>{userInitials}</span>
              </div>
            </div>
          </header>

          {/* ── Page subtitle bar ────────────────── */}
          <div className="ml-subheader" key={activePage}>
            <p className="ml-page-sub">{page?.sub ?? ''}</p>
            <div className="ml-status-pills">
              <span className="ml-pill ml-pill-green">
                <span className="ml-pill-dot" style={{ background: '#10b981' }}/>
                Live Data
              </span>
              <span className="ml-pill">
                Updated just now
              </span>
            </div>
          </div>

          {/* ── Content ──────────────────────────── */}
          <main className="ml-content">
            <PageTransition pageKey={activePage}>
              <ActiveComponent session={session} refreshTick={refreshTick} {...activePageProps} />
            </PageTransition>
          </main>
        </div>
      </div>
    </>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// CSS
// ─────────────────────────────────────────────────────────────────────────────
const LAYOUT_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400&display=swap');

  /* ── TOKENS ─────────────────────────────────── */
  [data-jatayu-theme="light"] {
    --ml-bg:            #f0f4fa;
    --ml-bg-mesh:       radial-gradient(ellipse 60% 50% at 80% 0%, rgba(199,210,254,0.4) 0%, transparent 60%);
    --ml-main-bg:       #f8fafc;
    --ml-header-bg:     rgba(255,255,255,0.88);
    --ml-header-border: rgba(226,232,240,0.9);
    --ml-header-shadow: 0 1px 12px rgba(15,23,42,0.06);
    --ml-subheader-bg:  rgba(241,245,249,0.9);
    --ml-subheader-border: rgba(226,232,240,0.7);
    --ml-text-primary:  #0f172a;
    --ml-text-secondary:#475569;
    --ml-text-muted:    #94a3b8;
    --ml-search-bg:     #f1f5f9;
    --ml-search-border: #e2e8f0;
    --ml-search-focus-bg: #fff;
    --ml-search-focus-border: rgba(99,102,241,0.5);
    --ml-search-shadow: 0 0 0 3px rgba(99,102,241,0.1);
    --ml-search-text:   #0f172a;
    --ml-search-placeholder:#94a3b8;
    --ml-kbd-bg:        #e2e8f0;
    --ml-kbd-text:      #64748b;
    --ml-icon-btn-bg:   #f1f5f9;
    --ml-icon-btn-border:#e2e8f0;
    --ml-icon-btn-text: #64748b;
    --ml-icon-btn-hover:#e2e8f0;
    --ml-avatar-bg:     linear-gradient(135deg,#6366f1,#4f46e5);
    --ml-bc-root:       #94a3b8;
    --ml-bc-current:    #475569;
    --ml-title:         #0f172a;
    --ml-sub:           #64748b;
    --ml-pill-bg:       rgba(255,255,255,0.8);
    --ml-pill-border:   rgba(226,232,240,0.8);
    --ml-pill-text:     #475569;
    --ml-content-bg:    transparent;
    --ml-notif-dot:     #ef4444;
    --ml-clock-time:    #1e293b;
    --ml-clock-date:    #94a3b8;
  }

  [data-jatayu-theme="dark"] {
    --ml-bg:            #060b18;
    --ml-bg-mesh:       radial-gradient(ellipse 60% 50% at 80% 0%, rgba(99,102,241,0.12) 0%, transparent 60%);
    --ml-main-bg:       #0a0f1e;
    --ml-header-bg:     rgba(10,14,26,0.92);
    --ml-header-border: rgba(255,255,255,0.05);
    --ml-header-shadow: 0 1px 24px rgba(0,0,0,0.4);
    --ml-subheader-bg:  rgba(13,17,27,0.8);
    --ml-subheader-border: rgba(255,255,255,0.04);
    --ml-text-primary:  #f1f5f9;
    --ml-text-secondary:#94a3b8;
    --ml-text-muted:    #475569;
    --ml-search-bg:     rgba(255,255,255,0.04);
    --ml-search-border: rgba(255,255,255,0.07);
    --ml-search-focus-bg: rgba(255,255,255,0.06);
    --ml-search-focus-border: rgba(129,140,248,0.5);
    --ml-search-shadow: 0 0 0 3px rgba(99,102,241,0.12);
    --ml-search-text:   #f1f5f9;
    --ml-search-placeholder:#334155;
    --ml-kbd-bg:        rgba(255,255,255,0.07);
    --ml-kbd-text:      #475569;
    --ml-icon-btn-bg:   rgba(255,255,255,0.04);
    --ml-icon-btn-border:rgba(255,255,255,0.07);
    --ml-icon-btn-text: #64748b;
    --ml-icon-btn-hover:rgba(99,102,241,0.15);
    --ml-avatar-bg:     linear-gradient(135deg,#818cf8,#6366f1);
    --ml-bc-root:       #334155;
    --ml-bc-current:    #64748b;
    --ml-title:         #f1f5f9;
    --ml-sub:           #64748b;
    --ml-pill-bg:       rgba(255,255,255,0.03);
    --ml-pill-border:   rgba(255,255,255,0.07);
    --ml-pill-text:     #475569;
    --ml-content-bg:    transparent;
    --ml-notif-dot:     #f87171;
    --ml-clock-time:    #e2e8f0;
    --ml-clock-date:    #334155;
  }

  /* ── KEYFRAMES ───────────────────────────────── */
  @keyframes ml-fade-up {
    from { opacity:0; transform:translateY(16px); }
    to   { opacity:1; transform:translateY(0); }
  }
  @keyframes ml-fade-in {
    from { opacity:0; }
    to   { opacity:1; }
  }
  @keyframes ml-slide-down {
    from { opacity:0; transform:translateY(-8px); }
    to   { opacity:1; transform:translateY(0); }
  }
  @keyframes ml-refresh-spin {
    to { transform:rotate(360deg); }
  }
  @keyframes ml-notif-blink {
    0%,100%{ opacity:1; transform:scale(1); }
    50%    { opacity:0.6; transform:scale(0.7); }
  }

  /* ── ROOT ────────────────────────────────────── */
  .ml-root {
    display: flex;
    height: 100vh;
    max-height: 100vh;
    overflow: hidden;
    background: var(--ml-bg);
    font-family: 'Poppins', 'Segoe UI', sans-serif;
    transition: background 0.4s ease;
    position: relative;
  }

  /* ── SIDEBAR WRAP ────────────────────────────── */
  .ml-sidebar-wrap {
    flex-shrink: 0;
    height: 100%;
    z-index: 20;
    transition: transform 0.3s cubic-bezier(0.4,0,0.2,1);
  }

  @media (max-width: 768px) {
    .ml-sidebar-wrap {
      position: fixed;
      top: 0; left: 0; bottom: 0;
      transform: translateX(-100%);
    }
    .ml-sidebar-mobile-open {
      transform: translateX(0);
    }
  }

  .ml-mobile-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.5);
    z-index: 19;
    backdrop-filter: blur(2px);
    animation: ml-fade-in 0.2s ease;
  }

  /* ── MAIN ────────────────────────────────────── */
  .ml-main {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
    background: var(--ml-main-bg);
    transition: background 0.4s ease;
    position: relative;
  }

  /* Subtle top-right mesh */
  .ml-main::before {
    content: '';
    position: absolute;
    inset: 0;
    background: var(--ml-bg-mesh);
    pointer-events: none;
    z-index: 0;
    transition: background 0.4s ease;
  }

  /* ── HEADER ──────────────────────────────────── */
  .ml-header {
    position: relative;
    z-index: 10;
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 0 24px;
    height: 60px;
    min-height: 60px;
    background: var(--ml-header-bg);
    border-bottom: 1px solid var(--ml-header-border);
    box-shadow: var(--ml-header-shadow);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    transition: background 0.4s, border-color 0.4s, box-shadow 0.4s;
    flex-shrink: 0;
    animation: ml-slide-down 0.4s cubic-bezier(0.22,1,0.36,1) both;
  }

  .ml-mobile-menu-btn {
    display: none;
    background: var(--ml-icon-btn-bg);
    border: 1px solid var(--ml-icon-btn-border);
    color: var(--ml-icon-btn-text);
    border-radius: 8px;
    width: 34px; height: 34px;
    align-items: center; justify-content: center;
    cursor: pointer;
    transition: all 0.2s;
    flex-shrink: 0;
  }
  @media (max-width: 768px) {
    .ml-mobile-menu-btn { display: flex; }
  }
  .ml-mobile-menu-btn:hover {
    background: var(--ml-icon-btn-hover);
    color: var(--ml-text-primary);
  }

  .ml-header-left {
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 1px;
    flex: 1;
    min-width: 0;
  }

  .ml-breadcrumb {
    display: flex;
    align-items: center;
    gap: 5px;
    animation: ml-fade-in 0.4s 0.1s both;
  }

  .ml-bc-root {
    font-size: 11.5px;
    color: var(--ml-bc-root);
    font-weight: 500;
    letter-spacing: 0.2px;
    transition: color 0.3s;
  }

  .ml-breadcrumb svg { color: var(--ml-bc-root); opacity: 0.6; }

  .ml-bc-current {
    font-size: 11.5px;
    color: var(--ml-bc-current);
    font-weight: 600;
    transition: color 0.3s;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 180px;
  }

  .ml-page-title {
    font-family: 'Poppins', sans-serif;
    font-size: 19px;
    font-weight: 800;
    color: var(--ml-title);
    letter-spacing: -0.4px;
    line-height: 1.1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    transition: color 0.3s;
    animation: ml-fade-in 0.3s 0.05s both;
  }

  .ml-header-right {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
  }

  /* ── SEARCH ──────────────────────────────────── */
  .ml-search {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 0 12px;
    height: 34px;
    border-radius: 10px;
    border: 1px solid var(--ml-search-border);
    background: var(--ml-search-bg);
    color: var(--ml-text-muted);
    width: 200px;
    transition: all 0.25s ease;
    cursor: text;
  }

  .ml-search-focused {
    width: 260px;
    background: var(--ml-search-focus-bg);
    border-color: var(--ml-search-focus-border);
    box-shadow: var(--ml-search-shadow);
    color: var(--ml-text-primary);
  }

  .ml-search-input {
    flex: 1;
    background: transparent;
    border: none;
    outline: none;
    font-size: 13.5px;
    color: var(--ml-search-text);
    font-family: 'Poppins', sans-serif;
    min-width: 0;
  }
  .ml-search-input::placeholder { color: var(--ml-search-placeholder); }

  .ml-search-kbd {
    font-size: 10.5px;
    padding: 2px 5px;
    border-radius: 4px;
    background: var(--ml-kbd-bg);
    color: var(--ml-kbd-text);
    font-family: monospace;
    letter-spacing: 0.5px;
    flex-shrink: 0;
    transition: all 0.3s;
  }

  @media (max-width: 900px) {
    .ml-search { display: none; }
  }

  /* ── ICON BUTTON ─────────────────────────────── */
  .ml-icon-btn {
    width: 34px; height: 34px;
    border-radius: 9px;
    border: 1px solid var(--ml-icon-btn-border);
    background: var(--ml-icon-btn-bg);
    color: var(--ml-icon-btn-text);
    display: flex; align-items:center; justify-content:center;
    cursor: pointer;
    transition: all 0.22s ease;
    position: relative;
    flex-shrink: 0;
  }
  .ml-icon-btn:hover {
    background: var(--ml-icon-btn-hover);
    color: var(--ml-text-primary);
    transform: scale(1.06);
  }

  .ml-refreshing svg {
    animation: ml-refresh-spin 0.7s linear infinite;
  }

  .ml-notif-btn { position: relative; }

  .ml-notif-dot {
    position: absolute;
    top: 6px; right: 6px;
    width: 7px; height: 7px;
    border-radius: 50%;
    background: var(--ml-notif-dot);
    border: 1.5px solid var(--ml-header-bg);
    animation: ml-notif-blink 2.5s ease-in-out infinite;
    transition: background 0.3s, border-color 0.3s;
  }

  .ml-logout-btn {
    height: 34px;
    padding: 0 10px;
    border-radius: 9px;
    border: 1px solid var(--ml-icon-btn-border);
    background: var(--ml-icon-btn-bg);
    color: var(--ml-icon-btn-text);
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 6px;
    transition: all 0.22s ease;
    flex-shrink: 0;
  }
  .ml-logout-btn:hover {
    background: var(--ml-icon-btn-hover);
    color: var(--ml-text-primary);
    transform: scale(1.03);
  }

  /* ── AVATAR ──────────────────────────────────── */
  .ml-header-avatar {
    width: 34px; height: 34px;
    border-radius: 9px;
    background: var(--ml-avatar-bg);
    display: flex; align-items:center; justify-content:center;
    font-size: 12px;
    font-weight: 700;
    color: #fff;
    flex-shrink: 0;
    cursor: pointer;
    letter-spacing: 0.3px;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
    box-shadow: 0 2px 8px rgba(99,102,241,0.3);
  }
  .ml-header-avatar:hover {
    transform: scale(1.08);
    box-shadow: 0 4px 14px rgba(99,102,241,0.45);
  }

  /* ── CLOCK ───────────────────────────────────── */
  .ml-clock {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 0;
    flex-shrink: 0;
  }

  .ml-clock-time {
    font-size: 14px;
    font-weight: 700;
    color: var(--ml-clock-time);
    font-variant-numeric: tabular-nums;
    letter-spacing: 0.5px;
    line-height: 1.1;
    transition: color 0.3s;
    font-family: 'Poppins', sans-serif;
  }

  .ml-clock-date {
    font-size: 10.5px;
    color: var(--ml-clock-date);
    transition: color 0.3s;
  }

  @media (max-width: 1024px) {
    .ml-clock { display: none; }
  }

  /* ── SUBHEADER ───────────────────────────────── */
  .ml-subheader {
    position: relative;
    z-index: 9;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 9px 24px;
    background: var(--ml-subheader-bg);
    border-bottom: 1px solid var(--ml-subheader-border);
    flex-shrink: 0;
    animation: ml-slide-down 0.4s 0.05s both;
    transition: background 0.4s, border-color 0.4s;
    gap: 12px;
    flex-wrap: wrap;
  }

  .ml-page-sub {
    font-size: 13px;
    color: var(--ml-sub);
    flex: 1;
    min-width: 0;
    transition: color 0.3s;
  }

  .ml-status-pills {
    display: flex;
    gap: 6px;
    flex-shrink: 0;
    flex-wrap: wrap;
  }

  .ml-pill {
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 11.5px;
    padding: 3px 10px;
    border-radius: 999px;
    background: var(--ml-pill-bg);
    border: 1px solid var(--ml-pill-border);
    color: var(--ml-pill-text);
    font-weight: 500;
    transition: all 0.3s;
  }

  .ml-pill-dot {
    width: 6px; height: 6px;
    border-radius: 50%;
    animation: ml-notif-blink 2s ease-in-out infinite;
  }

  .ml-pill-green {
    background: rgba(16,185,129,0.07);
    border-color: rgba(16,185,129,0.2);
    color: #059669;
  }

  [data-jatayu-theme="dark"] .ml-pill-green {
    background: rgba(16,185,129,0.08);
    border-color: rgba(16,185,129,0.2);
    color: #6ee7b7;
  }

  /* ── CONTENT ─────────────────────────────────── */
  .ml-content {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
    padding: 24px;
    position: relative;
    z-index: 1;
    scrollbar-width: thin;
    scrollbar-color: var(--ml-header-border) transparent;
  }

  .ml-content::-webkit-scrollbar { width: 4px; }
  .ml-content::-webkit-scrollbar-track { background: transparent; }
  .ml-content::-webkit-scrollbar-thumb { background: var(--ml-header-border); border-radius: 99px; }

  /* ── PAGE TRANSITION ─────────────────────────── */
  .ml-page-transition {
    opacity: 0;
    transform: translateY(12px);
    transition: opacity 0.3s ease, transform 0.35s cubic-bezier(0.22,1,0.36,1);
  }
  .ml-page-visible {
    opacity: 1;
    transform: translateY(0);
  }
`