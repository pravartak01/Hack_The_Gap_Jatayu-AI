import React, { useState } from 'react'

// ─── Lucide-style SVG icon components (no external dep needed) ───────────────
const icons = {
  alert: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  ),
  trash2: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
      <line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/>
    </svg>
  ),
  messageSquare: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
    </svg>
  ),
  camera: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/>
      <circle cx="12" cy="13" r="4"/>
    </svg>
  ),
  fileText: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
      <polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/>
      <line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
    </svg>
  ),
  barChart2: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/>
      <line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/>
    </svg>
  ),
  users: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>
    </svg>
  ),
  settings: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
    </svg>
  ),
  chevronLeft: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6"/>
    </svg>
  ),
  shield: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  ),
  activity: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
    </svg>
  ),
  logOut: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
      <polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  ),
}

const NAV_SECTIONS = [
  {
    group: 'Operations',
    items: [
      { id: 'live-alerts',        label: 'Live Alerts',        icon: icons.alert,         badgeColor: '#ef4444' },
      { id: 'hazard-alerts',      label: 'Hazard Alerts',      icon: icons.shield,        badgeColor: '#ef4444' },
      { id: 'garbage-alerts',     label: 'Garbage Alerts',     icon: icons.trash2,        badgeColor: '#f97316' },
      { id: 'camera-network',     label: 'Camera Network',     icon: icons.camera,        badgeColor: '#10b981' },
      { id: 'citizen-reports',    label: 'Citizen Reports',    icon: icons.messageSquare, badgeColor: '#f59e0b' },
    ],
  },
  {
    group: 'Management',
    items: [
      { id: 'garbage-monitoring', label: 'Waste Monitoring',   icon: icons.trash2 },
      { id: 'incident-history',   label: 'Incident History',   icon: icons.fileText },
      { id: 'department-panel',   label: 'Department Panel',   icon: icons.users },
    ],
  },
  {
    group: 'Intelligence',
    items: [
      { id: 'analytics',          label: 'Analytics',          icon: icons.barChart2 },
    ],
  },
  {
    group: 'System',
    items: [
      { id: 'settings',           label: 'Settings',           icon: icons.settings },
    ],
  },
]

// ─── Logo mark (reuse from auth) ──────────────────────────────────────────────
const JatayuMark = ({ size = 32 }) => (
  <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
    <defs>
      <linearGradient id="sbLogoGrad" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#818cf8"/>
        <stop offset="100%" stopColor="#4f46e5"/>
      </linearGradient>
    </defs>
    <path d="M20 4C14 10 4 12 4 20C4 14 12 10 20 12C28 10 36 14 36 20C36 12 26 10 20 4Z" fill="url(#sbLogoGrad)" opacity="0.9"/>
    <path d="M4 20C4 28 10 34 20 36C30 34 36 28 36 20C32 26 26 28 20 26C14 28 8 26 4 20Z" fill="url(#sbLogoGrad)" opacity="0.6"/>
    <circle cx="20" cy="19" r="3.5" fill="white" opacity="0.95"/>
    <circle cx="20" cy="19" r="1.5" fill="url(#sbLogoGrad)"/>
  </svg>
)

// ─── Status dot ───────────────────────────────────────────────────────────────
const StatusDot = () => (
  <span style={{
    display: 'inline-block', width: 7, height: 7,
    borderRadius: '50%', background: '#10b981',
    boxShadow: '0 0 0 2px rgba(16,185,129,0.25)',
    animation: 'sb-pulse 2s ease-in-out infinite',
    flexShrink: 0,
  }}/>
)

export default function Sidebar({ active, onChange, isDark, onThemeToggle, collapsed, onCollapse, session, badgeCounts = {} }) {
  const [hovered, setHovered] = useState(null)
  const isCollapsed = collapsed

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

  const roleLabelMap = {
    ADMIN: 'Administrator',
    POLICE: 'Police Department',
    FIRE: 'Fire Department',
    TRAFFIC: 'Traffic Department',
    MUNICIPAL: 'Municipal Department',
  }

  const resolvedRoleLabel = userRole ? (roleLabelMap[userRole] || userRole) : 'Official'

  const isAdmin = userRole === 'ADMIN'
  const adminOnlyIds = new Set(['hazard-alerts', 'garbage-alerts', 'garbage-monitoring', 'department-panel', 'analytics'])
  const visibleSections = NAV_SECTIONS.map(section => ({
    ...section,
    items: section.items.filter(item => isAdmin || !adminOnlyIds.has(item.id)),
  })).filter(section => section.items.length > 0)

  return (
    <>
      <style>{SIDEBAR_CSS}</style>
      <aside className={`jtsb-root${isCollapsed ? ' jtsb-collapsed' : ''}`} data-jatayu-theme={isDark ? 'dark' : 'light'}>

        {/* ── Header ─────────────────────────────── */}
        <div className="jtsb-header">
          <div className="jtsb-brand">
            <div className="jtsb-logo-wrap">
              <JatayuMark size={28}/>
            </div>
            {!isCollapsed && (
              <div className="jtsb-brand-text">
                <span className="jtsb-brand-name">Jatayu AI</span>
                <span className="jtsb-brand-sub">Command Centre</span>
              </div>
            )}
          </div>
          <button
            className="jtsb-collapse-btn"
            onClick={onCollapse}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={isCollapsed ? 'Expand' : 'Collapse'}
          >
            <span style={{ transform: isCollapsed ? 'rotate(180deg)' : 'none', display:'flex', transition:'transform 0.3s ease' }}>
              {icons.chevronLeft}
            </span>
          </button>
        </div>

        {/* ── System Status ──────────────────────── */}
        {!isCollapsed && (
          <div className="jtsb-status-bar">
            <StatusDot/>
            <span className="jtsb-status-text">All systems operational</span>
            <span className="jtsb-status-time" id="jtsb-clock">—</span>
          </div>
        )}

        {/* ── Navigation ─────────────────────────── */}
        <nav className="jtsb-nav">
          {visibleSections.map((section, si) => (
            <div key={section.group} className="jtsb-section" style={{ '--si': si }}>
              {!isCollapsed && (
                <p className="jtsb-section-label">{section.group}</p>
              )}
              <ul className="jtsb-list">
                {section.items.map((item, ii) => {
                  const isActive = item.id === active
                  return (
                    <li key={item.id} style={{ '--ii': ii, '--si': si }}>
                      <button
                        type="button"
                        className={`jtsb-item${isActive ? ' jtsb-item-active' : ''}`}
                        onClick={() => onChange?.(item.id)}
                        onMouseEnter={() => setHovered(item.id)}
                        onMouseLeave={() => setHovered(null)}
                        title={isCollapsed ? item.label : undefined}
                        aria-current={isActive ? 'page' : undefined}
                      >
                        {/* Active track */}
                        {isActive && <span className="jtsb-active-track"/>}

                        <span className="jtsb-item-icon">{item.icon}</span>

                        {!isCollapsed && (
                          <span className="jtsb-item-label">{item.label}</span>
                        )}

                        {!isCollapsed && badgeCounts[item.id] != null && (
                          <span className="jtsb-badge" style={{ '--bc': item.badgeColor }}>
                            {badgeCounts[item.id]}
                          </span>
                        )}

                        {/* Collapsed tooltip */}
                        {isCollapsed && hovered === item.id && (
                          <span className="jtsb-tooltip">{item.label}</span>
                        )}
                      </button>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* ── Footer ─────────────────────────────── */}
        <div className="jtsb-footer">
          {!isCollapsed && (
            <div className="jtsb-user">
              <div className="jtsb-avatar">
                <span>{userInitials}</span>
                <StatusDot/>
              </div>
              <div className="jtsb-user-info">
                <span className="jtsb-user-name">{userName || 'Jatayu Official'}</span>
                <span className="jtsb-user-role">{resolvedRoleLabel}</span>
              </div>
            </div>
          )}
          <div className="jtsb-footer-actions">
            <button
              className="jtsb-icon-btn"
              onClick={onThemeToggle}
              aria-label="Toggle theme"
              title="Toggle theme"
            >
              {isDark ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
                  <circle cx="12" cy="12" r="5"/>
                  <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                  <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
                  <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>
                </svg>
              )}
            </button>
            <button className="jtsb-icon-btn jtsb-logout-btn" aria-label="Sign out" title="Sign out">
              {icons.logOut}
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// CSS
// ─────────────────────────────────────────────────────────────────────────────
const SIDEBAR_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap');

  [data-jatayu-theme="light"] .jtsb-root {
    --sb-bg:          #ffffff;
    --sb-border:      rgba(226,232,240,0.8);
    --sb-header-bg:   #f8fafc;
    --sb-text:        #0f172a;
    --sb-sub:         #64748b;
    --sb-muted:       #94a3b8;
    --sb-section:     #94a3b8;
    --sb-item-hover:  rgba(99,102,241,0.07);
    --sb-item-text:   #334155;
    --sb-item-active-bg: rgba(79,70,229,0.08);
    --sb-item-active-text: #3730a3;
    --sb-track:       #4f46e5;
    --sb-icon-active: #4f46e5;
    --sb-icon:        #64748b;
    --sb-status-bg:   rgba(16,185,129,0.06);
    --sb-status-border: rgba(16,185,129,0.15);
    --sb-status-text: #065f46;
    --sb-footer-bg:   #f8fafc;
    --sb-avatar-bg:   linear-gradient(135deg,#6366f1,#4f46e5);
    --sb-icon-btn:    rgba(100,116,139,0.08);
    --sb-icon-btn-hover: rgba(99,102,241,0.12);
    --sb-icon-btn-text: #475569;
    --sb-tooltip-bg:  #1e1b4b;
    --sb-tooltip-text:#f1f5f9;
    --sb-shadow:      4px 0 24px rgba(0,0,0,0.06);
    --sb-collapse-bg: rgba(100,116,139,0.08);
    --sb-collapse-hover: rgba(99,102,241,0.12);
  }

  [data-jatayu-theme="dark"] .jtsb-root {
    --sb-bg:          #0d1117;
    --sb-border:      rgba(255,255,255,0.06);
    --sb-header-bg:   #0a0e1a;
    --sb-text:        #f1f5f9;
    --sb-sub:         #64748b;
    --sb-muted:       #475569;
    --sb-section:     #334155;
    --sb-item-hover:  rgba(99,102,241,0.1);
    --sb-item-text:   #94a3b8;
    --sb-item-active-bg: rgba(99,102,241,0.15);
    --sb-item-active-text: #a5b4fc;
    --sb-track:       #818cf8;
    --sb-icon-active: #818cf8;
    --sb-icon:        #475569;
    --sb-status-bg:   rgba(16,185,129,0.08);
    --sb-status-border: rgba(16,185,129,0.2);
    --sb-status-text: #6ee7b7;
    --sb-footer-bg:   #0a0e1a;
    --sb-avatar-bg:   linear-gradient(135deg,#818cf8,#6366f1);
    --sb-icon-btn:    rgba(255,255,255,0.05);
    --sb-icon-btn-hover: rgba(99,102,241,0.2);
    --sb-icon-btn-text: #64748b;
    --sb-tooltip-bg:  #1e293b;
    --sb-tooltip-text:#f1f5f9;
    --sb-shadow:      4px 0 32px rgba(0,0,0,0.4);
    --sb-collapse-bg: rgba(255,255,255,0.05);
    --sb-collapse-hover: rgba(99,102,241,0.2);
  }

  @keyframes sb-fade-in { from{opacity:0;transform:translateX(-8px)} to{opacity:1;transform:translateX(0)} }
  @keyframes sb-pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.6;transform:scale(0.85)} }
  @keyframes sb-item-in {
    from { opacity:0; transform:translateX(-10px); }
    to   { opacity:1; transform:translateX(0); }
  }
  @keyframes sb-tooltip-in {
    from { opacity:0; transform:translateX(-4px); }
    to   { opacity:1; transform:translateX(0); }
  }
  @keyframes sb-track-in {
    from { transform:scaleY(0); opacity:0; }
    to   { transform:scaleY(1); opacity:1; }
  }

  .jtsb-root {
    height: 100%;
    width: 240px;
    min-width: 240px;
    display: flex;
    flex-direction: column;
    background: var(--sb-bg);
    border-right: 1px solid var(--sb-border);
    box-shadow: var(--sb-shadow);
    transition: width 0.3s cubic-bezier(0.4,0,0.2,1),
                min-width 0.3s cubic-bezier(0.4,0,0.2,1),
                background 0.4s ease,
                border-color 0.4s ease;
    position: relative;
    overflow: hidden;
    font-family: 'Poppins', 'Segoe UI', sans-serif;
    z-index: 10;
  }

  .jtsb-collapsed {
    width: 64px;
    min-width: 64px;
  }

  /* ── Header ───────────────────────────────── */
  .jtsb-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 12px 14px;
    background: var(--sb-header-bg);
    border-bottom: 1px solid var(--sb-border);
    min-height: 64px;
    transition: background 0.4s ease, border-color 0.4s ease;
    flex-shrink: 0;
  }

  .jtsb-brand {
    display: flex;
    align-items: center;
    gap: 10px;
    overflow: hidden;
    min-width: 0;
  }

  .jtsb-logo-wrap {
    width: 38px; height: 38px;
    border-radius: 10px;
    background: rgba(99,102,241,0.1);
    border: 1px solid rgba(99,102,241,0.2);
    display: flex; align-items:center; justify-content:center;
    flex-shrink: 0;
    transition: transform 0.3s ease;
  }
  .jtsb-logo-wrap:hover { transform: scale(1.06) rotate(-4deg); }

  .jtsb-brand-text {
    display: flex;
    flex-direction: column;
    min-width: 0;
    animation: sb-fade-in 0.3s ease both;
  }

  .jtsb-brand-name {
    font-family: 'Poppins', sans-serif;
    font-size: 16px;
    font-weight: 800;
    color: var(--sb-text);
    letter-spacing: -0.3px;
    line-height: 1.1;
    white-space: nowrap;
    transition: color 0.3s;
  }

  .jtsb-brand-sub {
    font-size: 11px;
    color: var(--sb-muted);
    text-transform: uppercase;
    letter-spacing: 0.7px;
    margin-top: 1px;
    white-space: nowrap;
    transition: color 0.3s;
  }

  .jtsb-collapse-btn {
    width: 26px; height: 26px;
    border-radius: 7px;
    border: 1px solid var(--sb-border);
    background: var(--sb-collapse-bg);
    color: var(--sb-muted);
    display: flex; align-items:center; justify-content:center;
    cursor: pointer;
    flex-shrink: 0;
    transition: all 0.25s ease;
    padding: 0;
  }
  .jtsb-collapse-btn svg { width:14px; height:14px; }
  .jtsb-collapse-btn:hover {
    background: var(--sb-collapse-hover);
    color: var(--sb-track);
    border-color: rgba(99,102,241,0.3);
  }

  /* ── Status bar ───────────────────────────── */
  .jtsb-status-bar {
    display: flex;
    align-items: center;
    gap: 7px;
    padding: 8px 14px;
    background: var(--sb-status-bg);
    border-bottom: 1px solid var(--sb-status-border);
    flex-shrink: 0;
    animation: sb-fade-in 0.4s 0.1s both;
    transition: background 0.4s, border-color 0.4s;
  }

  .jtsb-status-text {
    font-size: 11.5px;
    color: var(--sb-status-text);
    font-weight: 500;
    flex: 1;
    transition: color 0.3s;
  }

  .jtsb-status-time {
    font-size: 10.5px;
    color: var(--sb-muted);
    font-variant-numeric: tabular-nums;
    transition: color 0.3s;
  }

  /* ── Nav ──────────────────────────────────── */
  .jtsb-nav {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
    padding: 8px 0 4px;
    scrollbar-width: thin;
    scrollbar-color: var(--sb-border) transparent;
  }

  .jtsb-section {
    padding: 6px 8px 2px;
    animation: sb-fade-in 0.4s calc(var(--si, 0) * 0.05s + 0.15s) both;
  }

  .jtsb-section-label {
    font-size: 10.5px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: var(--sb-section);
    padding: 4px 8px 6px;
    white-space: nowrap;
    transition: color 0.3s;
  }

  .jtsb-list {
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 1px;
  }

  .jtsb-list li {
    animation: sb-item-in 0.35s calc((var(--si, 0) * 3 + var(--ii, 0)) * 0.04s + 0.2s) both;
  }

  .jtsb-item {
    position: relative;
    width: 100%;
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 10px;
    border-radius: 10px;
    border: none;
    background: transparent;
    color: var(--sb-item-text);
    cursor: pointer;
    text-align: left;
    transition: background 0.2s ease, color 0.2s ease, transform 0.15s ease;
    font-family: 'Poppins', 'Segoe UI', sans-serif;
    font-size: 14px;
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    min-width: 0;
  }

  .jtsb-item:hover:not(.jtsb-item-active) {
    background: var(--sb-item-hover);
    color: var(--sb-text);
    transform: translateX(2px);
  }

  .jtsb-item-active {
    background: var(--sb-item-active-bg);
    color: var(--sb-item-active-text);
    font-weight: 600;
  }

  .jtsb-active-track {
    position: absolute;
    left: 0;
    top: 20%;
    height: 60%;
    width: 3px;
    border-radius: 0 3px 3px 0;
    background: var(--sb-track);
    animation: sb-track-in 0.25s cubic-bezier(0.34,1.56,0.64,1) both;
    transform-origin: center;
  }

  .jtsb-item-icon {
    width: 18px; height: 18px;
    display: flex; align-items:center; justify-content:center;
    flex-shrink: 0;
    color: var(--sb-icon);
    transition: color 0.2s;
  }
  .jtsb-item-icon svg { width:16px; height:16px; }
  .jtsb-item-active .jtsb-item-icon { color: var(--sb-icon-active); }
  .jtsb-item:hover:not(.jtsb-item-active) .jtsb-item-icon { color: var(--sb-track); }

  .jtsb-item-label {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    transition: opacity 0.2s;
  }

  .jtsb-badge {
    font-size: 10.5px;
    font-weight: 700;
    padding: 2px 6px;
    border-radius: 999px;
    background: var(--bc, #6366f1);
    color: #fff;
    flex-shrink: 0;
    letter-spacing: 0.2px;
    animation: sb-fade-in 0.3s ease both;
  }

  .jtsb-tooltip {
    position: absolute;
    left: calc(100% + 10px);
    top: 50%;
    transform: translateY(-50%);
    background: var(--sb-tooltip-bg);
    color: var(--sb-tooltip-text);
    font-size: 13px;
    font-weight: 500;
    padding: 5px 10px;
    border-radius: 7px;
    white-space: nowrap;
    pointer-events: none;
    z-index: 100;
    animation: sb-tooltip-in 0.2s ease both;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
  }
  .jtsb-tooltip::before {
    content:'';
    position: absolute;
    right: 100%;
    top: 50%;
    transform:translateY(-50%);
    border: 5px solid transparent;
    border-right-color: var(--sb-tooltip-bg);
  }

  /* ── Footer ───────────────────────────────── */
  .jtsb-footer {
    background: var(--sb-footer-bg);
    border-top: 1px solid var(--sb-border);
    padding: 12px 10px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    flex-shrink: 0;
    transition: background 0.4s, border-color 0.4s;
  }

  .jtsb-user {
    display: flex;
    align-items: center;
    gap: 9px;
    animation: sb-fade-in 0.4s 0.4s both;
    min-width: 0;
  }

  .jtsb-avatar {
    width: 32px; height: 32px;
    border-radius: 9px;
    background: var(--sb-avatar-bg);
    display: flex; align-items:center; justify-content:center;
    font-size: 12px;
    font-weight: 700;
    color: #fff;
    flex-shrink: 0;
    position: relative;
    letter-spacing: 0.3px;
  }
  .jtsb-avatar > span:last-child {
    position: absolute;
    bottom: -2px; right: -2px;
  }

  .jtsb-user-info {
    display: flex;
    flex-direction: column;
    min-width: 0;
    flex: 1;
  }

  .jtsb-user-name {
    font-size: 12px;
    font-weight: 600;
    color: var(--sb-text);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    transition: color 0.3s;
  }

  .jtsb-user-role {
    font-size: 11px;
    color: var(--sb-muted);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    transition: color 0.3s;
  }

  .jtsb-footer-actions {
    display: flex;
    gap: 6px;
    justify-content: flex-end;
  }

  .jtsb-icon-btn {
    width: 30px; height: 30px;
    border-radius: 8px;
    border: 1px solid var(--sb-border);
    background: var(--sb-icon-btn);
    color: var(--sb-icon-btn-text);
    display: flex; align-items:center; justify-content:center;
    cursor: pointer;
    transition: all 0.25s ease;
    padding: 0;
  }
  .jtsb-icon-btn svg { width:15px; height:15px; }
  .jtsb-icon-btn:hover {
    background: var(--sb-icon-btn-hover);
    color: var(--sb-track);
    border-color: rgba(99,102,241,0.3);
    transform: scale(1.08);
  }

  .jtsb-logout-btn:hover {
    background: rgba(239,68,68,0.1) !important;
    color: #ef4444 !important;
    border-color: rgba(239,68,68,0.25) !important;
  }

  /* Scrollbar */
  .jtsb-nav::-webkit-scrollbar { width: 3px; }
  .jtsb-nav::-webkit-scrollbar-track { background: transparent; }
  .jtsb-nav::-webkit-scrollbar-thumb { background: var(--sb-border); border-radius: 99px; }
`