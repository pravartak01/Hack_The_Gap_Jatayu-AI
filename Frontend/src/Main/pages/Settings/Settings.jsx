import React, { useMemo, useState } from 'react'
import {
  Bell,
  UserCircle2,
  Shield,
  SlidersHorizontal,
  Save,
  RefreshCw,
  Smartphone,
  Mail,
  Link2,
  Siren,
  KeyRound,
  TimerReset,
} from 'lucide-react'

const INITIAL_SETTINGS = {
  profile: {
    displayName: 'Command Admin',
    email: 'admin@jatayu.ai',
    phone: '+91 98765 43210',
    controlRoom: 'Aurangabad Central Command',
  },
  notifications: {
    pushEnabled: true,
    emailEnabled: true,
    smsEnabled: false,
    escalationOnly: true,
    digestFrequency: 'Every 30 minutes',
  },
  alertRules: {
    weaponSensitivity: 88,
    garbageSensitivity: 70,
    falsePositiveGuard: 64,
    autoEscalationMins: 8,
    hotspotTriggerCount: 5,
  },
  integrations: {
    cityCameras: true,
    emergencyMail: true,
    gpsRouter: true,
    citizenApp: false,
  },
  security: {
    mfaRequired: true,
    sessionTimeout: '30 minutes',
    auditTrail: true,
  },
}

function SectionHeader({ icon, title, subtitle }) {
  return (
    <div className="st-sec-head">
      <div className="st-sec-title-wrap">
        <span className="st-sec-icon">{icon}</span>
        <h3>{title}</h3>
      </div>
      <p>{subtitle}</p>
    </div>
  )
}

function LabeledSwitch({ label, hint, checked, onChange }) {
  return (
    <label className="st-switch-row">
      <div>
        <span className="st-switch-label">{label}</span>
        <span className="st-switch-hint">{hint}</span>
      </div>
      <button type="button" className={`st-switch ${checked ? 'is-on' : ''}`} onClick={onChange}>
        <span />
      </button>
    </label>
  )
}

function RangeField({ label, value, min = 0, max = 100, suffix = '', onChange }) {
  return (
    <label className="st-range-wrap">
      <div className="st-range-top">
        <span>{label}</span>
        <strong>
          {value}
          {suffix}
        </strong>
      </div>
      <input type="range" min={min} max={max} value={value} onChange={onChange} className="st-range" />
    </label>
  )
}

export default function Settings() {
  const [settings, setSettings] = useState(INITIAL_SETTINGS)
  const [isSaving, setIsSaving] = useState(false)
  const [saveLabel, setSaveLabel] = useState('Changes are local until saved.')

  const integrationSummary = useMemo(() => {
    const values = Object.values(settings.integrations)
    const active = values.filter(Boolean).length
    return `${active}/${values.length} integrations active`
  }, [settings.integrations])

  const updateProfile = (field) => (event) => {
    const value = event.target.value
    setSettings((prev) => ({
      ...prev,
      profile: {
        ...prev.profile,
        [field]: value,
      },
    }))
  }

  const toggle = (group, field) => () => {
    setSettings((prev) => ({
      ...prev,
      [group]: {
        ...prev[group],
        [field]: !prev[group][field],
      },
    }))
  }

  const updateRule = (field) => (event) => {
    const value = Number(event.target.value)
    setSettings((prev) => ({
      ...prev,
      alertRules: {
        ...prev.alertRules,
        [field]: value,
      },
    }))
  }

  const updateSelect = (group, field) => (event) => {
    const value = event.target.value
    setSettings((prev) => ({
      ...prev,
      [group]: {
        ...prev[group],
        [field]: value,
      },
    }))
  }

  const resetDefaults = () => {
    setSettings(INITIAL_SETTINGS)
    setSaveLabel('Defaults restored. Save to apply system-wide.')
  }

  const handleSave = async () => {
    setIsSaving(true)
    setSaveLabel('Applying updated settings...')

    // Simulate save flow until backend settings endpoint is connected.
    await new Promise((resolve) => setTimeout(resolve, 800))

    setIsSaving(false)
    setSaveLabel(`Settings updated at ${new Date().toLocaleTimeString('en-IN')}`)
  }

  return (
    <>
      <style>{SETTINGS_CSS}</style>
      <div className="st-root">
        <header className="st-head">
          <div>
            <p className="st-eyebrow">Control Center</p>
            <h2 className="st-title">System Settings</h2>
            <p className="st-subtitle">
              Manage identity, alert behavior, delivery channels, and security policies for Jatayu command operations.
            </p>
          </div>

          <div className="st-actions">
            <button type="button" onClick={resetDefaults} className="st-btn st-btn-soft">
              <RefreshCw size={14} />
              Reset Defaults
            </button>
            <button type="button" onClick={handleSave} className="st-btn st-btn-solid" disabled={isSaving}>
              <Save size={14} />
              {isSaving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </header>

        <div className="st-save-hint">{saveLabel}</div>

        <section className="st-grid st-grid-two">
          <article className="st-panel">
            <SectionHeader
              icon={<UserCircle2 size={14} />}
              title="Profile & Command Details"
              subtitle="Primary account and command center information used across alerts and reports."
            />

            <div className="st-form-grid">
              <label className="st-field">
                <span>Display Name</span>
                <input value={settings.profile.displayName} onChange={updateProfile('displayName')} />
              </label>
              <label className="st-field">
                <span>Email</span>
                <input value={settings.profile.email} onChange={updateProfile('email')} />
              </label>
              <label className="st-field">
                <span>Phone</span>
                <input value={settings.profile.phone} onChange={updateProfile('phone')} />
              </label>
              <label className="st-field">
                <span>Control Room</span>
                <input value={settings.profile.controlRoom} onChange={updateProfile('controlRoom')} />
              </label>
            </div>
          </article>

          <article className="st-panel">
            <SectionHeader
              icon={<Bell size={14} />}
              title="Notification Preferences"
              subtitle="Configure who gets informed and how quickly alerts are delivered."
            />

            <div className="st-switch-list">
              <LabeledSwitch
                label="Push Notifications"
                hint="Web and dashboard push alerts"
                checked={settings.notifications.pushEnabled}
                onChange={toggle('notifications', 'pushEnabled')}
              />
              <LabeledSwitch
                label="Email Alerts"
                hint="Department-level mail notifications"
                checked={settings.notifications.emailEnabled}
                onChange={toggle('notifications', 'emailEnabled')}
              />
              <LabeledSwitch
                label="SMS Fallback"
                hint="Use only when primary channels fail"
                checked={settings.notifications.smsEnabled}
                onChange={toggle('notifications', 'smsEnabled')}
              />
              <LabeledSwitch
                label="Escalation-only Night Mode"
                hint="Suppress low-priority alerts after 10 PM"
                checked={settings.notifications.escalationOnly}
                onChange={toggle('notifications', 'escalationOnly')}
              />
            </div>

            <label className="st-field">
              <span>Digest Frequency</span>
              <select
                value={settings.notifications.digestFrequency}
                onChange={updateSelect('notifications', 'digestFrequency')}
              >
                <option>Every 15 minutes</option>
                <option>Every 30 minutes</option>
                <option>Hourly</option>
                <option>Only critical summaries</option>
              </select>
            </label>
          </article>
        </section>

        <section className="st-grid st-grid-two">
          <article className="st-panel">
            <SectionHeader
              icon={<SlidersHorizontal size={14} />}
              title="Alert Rules & Thresholds"
              subtitle="Tune AI confidence and escalation limits to match field conditions."
            />

            <div className="st-range-list">
              <RangeField
                label="Weapon detection sensitivity"
                value={settings.alertRules.weaponSensitivity}
                suffix="%"
                min={50}
                max={100}
                onChange={updateRule('weaponSensitivity')}
              />
              <RangeField
                label="Garbage detection sensitivity"
                value={settings.alertRules.garbageSensitivity}
                suffix="%"
                min={40}
                max={100}
                onChange={updateRule('garbageSensitivity')}
              />
              <RangeField
                label="False positive guard"
                value={settings.alertRules.falsePositiveGuard}
                suffix="%"
                min={30}
                max={100}
                onChange={updateRule('falsePositiveGuard')}
              />
              <RangeField
                label="Auto escalation time"
                value={settings.alertRules.autoEscalationMins}
                suffix=" min"
                min={2}
                max={20}
                onChange={updateRule('autoEscalationMins')}
              />
              <RangeField
                label="Hotspot trigger count"
                value={settings.alertRules.hotspotTriggerCount}
                min={2}
                max={15}
                onChange={updateRule('hotspotTriggerCount')}
              />
            </div>
          </article>

          <article className="st-panel">
            <SectionHeader
              icon={<Link2 size={14} />}
              title="Integrations"
              subtitle="Connection state for connected systems and dispatch channels."
            />

            <div className="st-kpi-strip">{integrationSummary}</div>

            <div className="st-integration-list">
              <LabeledSwitch
                label="City Camera Grid"
                hint="Feeds from zone and traffic cameras"
                checked={settings.integrations.cityCameras}
                onChange={toggle('integrations', 'cityCameras')}
              />
              <LabeledSwitch
                label="Emergency Mail Relay"
                hint="SMTP relay for mass dispatch"
                checked={settings.integrations.emergencyMail}
                onChange={toggle('integrations', 'emergencyMail')}
              />
              <LabeledSwitch
                label="GPS Routing Service"
                hint="Route assignment and nearest-unit mapping"
                checked={settings.integrations.gpsRouter}
                onChange={toggle('integrations', 'gpsRouter')}
              />
              <LabeledSwitch
                label="Citizen Mobile App"
                hint="Complaint and media intake channel"
                checked={settings.integrations.citizenApp}
                onChange={toggle('integrations', 'citizenApp')}
              />
            </div>

            <div className="st-chip-row">
              <span className="st-chip">
                <Mail size={12} /> Mail Relay
              </span>
              <span className="st-chip">
                <Smartphone size={12} /> Mobile Intake
              </span>
              <span className="st-chip">
                <Siren size={12} /> Emergency Trigger
              </span>
            </div>
          </article>
        </section>

        <section className="st-grid st-grid-two">
          <article className="st-panel">
            <SectionHeader
              icon={<Shield size={14} />}
              title="Security Policy"
              subtitle="Session, access, and audit requirements for operation safety."
            />

            <div className="st-switch-list">
              <LabeledSwitch
                label="Require Multi-factor Authentication"
                hint="Mandatory for all command accounts"
                checked={settings.security.mfaRequired}
                onChange={toggle('security', 'mfaRequired')}
              />
              <LabeledSwitch
                label="Immutable Audit Trail"
                hint="Log all state changes and escalations"
                checked={settings.security.auditTrail}
                onChange={toggle('security', 'auditTrail')}
              />
            </div>

            <label className="st-field">
              <span>
                <TimerReset size={13} /> Session Timeout
              </span>
              <select value={settings.security.sessionTimeout} onChange={updateSelect('security', 'sessionTimeout')}>
                <option>15 minutes</option>
                <option>30 minutes</option>
                <option>45 minutes</option>
                <option>1 hour</option>
              </select>
            </label>
          </article>

          <article className="st-panel st-security-note">
            <SectionHeader
              icon={<KeyRound size={14} />}
              title="Security Notes"
              subtitle="Recommended defaults for city-level emergency infrastructure."
            />

            <ul>
              <li>Enable MFA for all Admin and Department users.</li>
              <li>Keep auto escalation below 10 minutes for weapon incidents.</li>
              <li>Maintain immutable logs for post-incident compliance checks.</li>
              <li>Use escalation-only mode overnight to reduce notification noise.</li>
            </ul>
          </article>
        </section>
      </div>
    </>
  )
}

const SETTINGS_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=Space+Mono:wght@400;700&display=swap');

  .st-root {
    --st-panel-bg: #ffffff;
    --st-panel-border: rgba(226,232,240,0.95);
    --st-shadow: 0 2px 10px rgba(15,23,42,0.05), 0 12px 30px rgba(15,23,42,0.06);
    --st-title: #0f172a;
    --st-sub: #64748b;
    --st-text: #334155;
    --st-muted: #94a3b8;
    --st-accent: #0f766e;
    --st-soft: #f8fafc;

    display: grid;
    gap: 14px;
    font-family: 'Outfit', system-ui, sans-serif;
    color: var(--st-text);
  }

  [data-jatayu-theme="dark"] .st-root {
    --st-panel-bg: rgba(13,17,27,0.86);
    --st-panel-border: rgba(255,255,255,0.08);
    --st-shadow: 0 2px 12px rgba(0,0,0,0.5);
    --st-title: #f1f5f9;
    --st-sub: #94a3b8;
    --st-text: #cbd5e1;
    --st-muted: #64748b;
    --st-accent: #14b8a6;
    --st-soft: rgba(255,255,255,0.03);
  }

  .st-head,
  .st-panel {
    border: 1px solid var(--st-panel-border);
    border-radius: 16px;
    background: var(--st-panel-bg);
    box-shadow: var(--st-shadow);
  }

  .st-head {
    padding: 14px;
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
  }

  .st-eyebrow {
    margin: 0;
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.6px;
    font-weight: 700;
    color: var(--st-muted);
  }

  .st-title {
    margin: 4px 0 0;
    font-size: 22px;
    font-weight: 800;
    color: var(--st-title);
  }

  .st-subtitle {
    margin: 7px 0 0;
    font-size: 13px;
    color: var(--st-sub);
    max-width: 760px;
    line-height: 1.55;
  }

  .st-actions {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
    justify-content: flex-end;
  }

  .st-btn {
    border-radius: 10px;
    border: 1px solid var(--st-panel-border);
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 8px 11px;
    font-size: 12px;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .st-btn:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }

  .st-btn-soft {
    background: var(--st-soft);
    color: var(--st-text);
  }

  .st-btn-soft:hover { transform: translateY(-1px); }

  .st-btn-solid {
    background: linear-gradient(135deg, #0f766e, #0284c7);
    color: #ffffff;
    border-color: transparent;
  }

  .st-btn-solid:hover {
    transform: translateY(-1px);
    box-shadow: 0 8px 20px rgba(2,132,199,0.3);
  }

  .st-save-hint {
    border: 1px solid var(--st-panel-border);
    background: var(--st-soft);
    color: var(--st-sub);
    border-radius: 10px;
    padding: 9px 11px;
    font-size: 12px;
    font-weight: 600;
  }

  .st-grid {
    display: grid;
    gap: 12px;
  }

  .st-grid-two {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .st-panel {
    padding: 12px;
    display: grid;
    gap: 10px;
  }

  .st-sec-head {
    display: grid;
    gap: 4px;
  }

  .st-sec-title-wrap {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .st-sec-icon {
    width: 26px;
    height: 26px;
    border-radius: 8px;
    display: grid;
    place-items: center;
    color: var(--st-accent);
    background: color-mix(in srgb, var(--st-accent) 16%, transparent);
    border: 1px solid color-mix(in srgb, var(--st-accent) 24%, transparent);
  }

  .st-sec-head h3 {
    margin: 0;
    font-size: 14px;
    color: var(--st-title);
    font-weight: 700;
  }

  .st-sec-head p {
    margin: 0;
    font-size: 12px;
    color: var(--st-sub);
    line-height: 1.45;
  }

  .st-form-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 8px;
  }

  .st-field {
    display: grid;
    gap: 6px;
  }

  .st-field span {
    font-size: 11px;
    font-weight: 700;
    color: var(--st-sub);
    display: inline-flex;
    align-items: center;
    gap: 5px;
  }

  .st-field input,
  .st-field select {
    border: 1px solid var(--st-panel-border);
    background: var(--st-soft);
    color: var(--st-text);
    border-radius: 10px;
    padding: 9px 10px;
    font-size: 12px;
    outline: none;
  }

  .st-field input:focus,
  .st-field select:focus {
    border-color: color-mix(in srgb, var(--st-accent) 56%, transparent);
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--st-accent) 22%, transparent);
  }

  .st-switch-list,
  .st-integration-list,
  .st-range-list {
    display: grid;
    gap: 6px;
  }

  .st-switch-row {
    border: 1px solid var(--st-panel-border);
    border-radius: 10px;
    padding: 8px 9px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    background: var(--st-soft);
  }

  .st-switch-label {
    display: block;
    font-size: 12px;
    font-weight: 600;
    color: var(--st-title);
  }

  .st-switch-hint {
    display: block;
    margin-top: 2px;
    font-size: 11px;
    color: var(--st-sub);
  }

  .st-switch {
    width: 42px;
    height: 24px;
    border-radius: 999px;
    border: 1px solid var(--st-panel-border);
    background: #cbd5e1;
    position: relative;
    cursor: pointer;
    transition: 0.2s ease;
    flex-shrink: 0;
  }

  .st-switch span {
    position: absolute;
    top: 2px;
    left: 2px;
    width: 18px;
    height: 18px;
    border-radius: 999px;
    background: #ffffff;
    transition: 0.2s ease;
  }

  .st-switch.is-on {
    background: linear-gradient(135deg, #0f766e, #0891b2);
    border-color: transparent;
  }

  .st-switch.is-on span { transform: translateX(18px); }

  .st-range-wrap {
    border: 1px solid var(--st-panel-border);
    border-radius: 10px;
    background: var(--st-soft);
    padding: 8px 10px;
    display: grid;
    gap: 6px;
  }

  .st-range-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 8px;
    font-size: 12px;
    color: var(--st-text);
  }

  .st-range-top strong {
    font-family: 'Space Mono', monospace;
    color: var(--st-title);
    font-size: 12px;
  }

  .st-range {
    width: 100%;
    accent-color: #0f766e;
  }

  .st-kpi-strip {
    border-radius: 10px;
    border: 1px solid var(--st-panel-border);
    background: linear-gradient(140deg, rgba(15,118,110,0.14), rgba(2,132,199,0.12));
    color: var(--st-title);
    font-size: 12px;
    font-weight: 700;
    padding: 8px 10px;
  }

  .st-chip-row {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
  }

  .st-chip {
    border-radius: 999px;
    padding: 6px 8px;
    border: 1px solid var(--st-panel-border);
    background: var(--st-soft);
    font-size: 11px;
    color: var(--st-sub);
    display: inline-flex;
    align-items: center;
    gap: 5px;
    font-weight: 700;
  }

  .st-security-note ul {
    margin: 0;
    padding-left: 18px;
    display: grid;
    gap: 6px;
    color: var(--st-text);
    font-size: 12px;
    line-height: 1.45;
  }

  @media (max-width: 980px) {
    .st-grid-two,
    .st-form-grid {
      grid-template-columns: 1fr;
    }

    .st-head {
      flex-direction: column;
      align-items: stretch;
    }

    .st-actions {
      justify-content: flex-start;
    }
  }
`
