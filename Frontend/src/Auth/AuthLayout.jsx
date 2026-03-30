import React, { useState, useEffect, useRef } from 'react';
import {
  Shield,
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  Building2,
  LogIn,
  UserPlus,
  Sun,
  Moon,
  Fingerprint,
  Key,
  Briefcase,
  ChevronRight,
  Zap,
  Globe,
  Activity,
  CheckCircle2
} from 'lucide-react';
import { api } from '../lib/api.js';

// ─────────────────────────────────────────────
// PARTICLE FIELD (canvas-based, ultra-subtle)
// ─────────────────────────────────────────────
const ParticleField = ({ isDark }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;
    let particles = [];

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    for (let i = 0; i < 38; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 1.5 + 0.4,
        dx: (Math.random() - 0.5) * 0.35,
        dy: (Math.random() - 0.5) * 0.35,
        opacity: Math.random() * 0.5 + 0.15,
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const color = isDark ? '255,255,255' : '99,102,241';

      particles.forEach((p, i) => {
        p.x += p.dx;
        p.y += p.dy;
        if (p.x < 0 || p.x > canvas.width) p.dx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.dy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${color},${p.opacity})`;
        ctx.fill();

        particles.forEach((q, j) => {
          if (j <= i) return;
          const dist = Math.hypot(p.x - q.x, p.y - q.y);
          if (dist < 90) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(q.x, q.y);
            ctx.strokeStyle = `rgba(${color},${0.12 * (1 - dist / 90)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        });
      });
      animId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animId);
    };
  }, [isDark]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ opacity: isDark ? 0.6 : 0.5 }}
    />
  );
};

// ─────────────────────────────────────────────
// ANIMATED LOGO MARK
// ─────────────────────────────────────────────
const JatayuLogo = ({ size = 40 }) => (
  <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="logoGrad" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#818cf8" />
        <stop offset="100%" stopColor="#4f46e5" />
      </linearGradient>
    </defs>
    {/* Eagle-wing silhouette abstraction */}
    <path d="M20 4 C14 10 4 12 4 20 C4 14 12 10 20 12 C28 10 36 14 36 20 C36 12 26 10 20 4Z" fill="url(#logoGrad)" opacity="0.9" />
    <path d="M4 20 C4 28 10 34 20 36 C30 34 36 28 36 20 C32 26 26 28 20 26 C14 28 8 26 4 20Z" fill="url(#logoGrad)" opacity="0.6" />
    <circle cx="20" cy="19" r="3.5" fill="white" opacity="0.95" />
    <circle cx="20" cy="19" r="1.5" fill="url(#logoGrad)" />
  </svg>
);

// ─────────────────────────────────────────────
// INPUT FIELD
// ─────────────────────────────────────────────
const InputField = ({ label, icon: Icon, error, children, delay = 0 }) => (
  <div className="jt-field" style={{ '--delay': `${delay}s` }}>
    {label && (
      <label className="jt-label">{label}</label>
    )}
    <div className="jt-input-wrap">
      {Icon && <Icon className="jt-icon" />}
      {children}
    </div>
    {error && <p className="jt-error">{error}</p>}
  </div>
);

// ─────────────────────────────────────────────
// LOGIN FORM (ADMIN + DEPARTMENTS ONLY)
// ─────────────────────────────────────────────
const LoginForm = ({ onAuthenticated }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '', rememberMe: false, role: 'ADMIN' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
    if (errors.form) setErrors((prev) => ({ ...prev, form: '' }));
  };

  const validate = () => {
    const e = {};
    if (!formData.email) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) e.email = 'Enter a valid email address';
    if (!formData.password) e.password = 'Password is required';
    if (!formData.role) e.role = 'Select your role';
    return e;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    const e = validate();
    if (Object.keys(e).length) {
      setErrors(e);
      return;
    }

    setLoading(true);
    try {
      const payload = {
        email: formData.email,
        password: formData.password,
        role: formData.role,
      };
      const res = await api.login(payload);
      setSuccess(true);
      if (onAuthenticated) {
        onAuthenticated({ token: res.token, user: res.user });
      }
    } catch (error) {
      setErrors((prev) => ({
        ...prev,
        form: error?.data?.message || error?.message || 'Login failed. Please check credentials.',
      }));
    } finally {
      setLoading(false);
    }
  };

  if (success) return (
    <div className="jt-success-state">
      <div className="jt-success-ring">
        <CheckCircle2 size={32} strokeWidth={1.5} />
      </div>
      <p className="jt-success-title">Access Granted</p>
      <p className="jt-success-sub">Redirecting to your dashboard…</p>
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="jt-form" noValidate>
      <InputField label="Official Email" icon={Mail} error={errors.email} delay={0.05}>
        <input
          type="email" name="email" value={formData.email}
          onChange={handleChange} placeholder="name@department.gov.in"
          className={`jt-input${errors.email ? ' jt-input-err' : ''}`}
          autoComplete="email"
        />
      </InputField>

      <InputField label="Role" icon={Building2} error={errors.role} delay={0.08}>
        <select
          name="role"
          value={formData.role}
          onChange={handleChange}
          className={`jt-input jt-select${errors.role ? ' jt-input-err' : ''}`}
        >
          <option value="">Select role…</option>
          <option value="ADMIN">Admin</option>
          <option value="POLICE">Police</option>
          <option value="FIRE">Fire</option>
          <option value="TRAFFIC">Traffic</option>
          <option value="MUNICIPAL">Municipal</option>
        </select>
      </InputField>

      <InputField label="Password" icon={Lock} error={errors.password} delay={0.1}>
        <input
          type={showPassword ? 'text' : 'password'} name="password"
          value={formData.password} onChange={handleChange}
          placeholder="••••••••"
          className={`jt-input jt-input-pr${errors.password ? ' jt-input-err' : ''}`}
          autoComplete="current-password"
        />
        <button type="button" className="jt-eye" onClick={() => setShowPassword(v => !v)} aria-label="Toggle password">
          {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
      </InputField>

      <div className="jt-row-between" style={{ '--delay': '0.15s' }}>
        <label className="jt-check-label">
          <input type="checkbox" name="rememberMe" checked={formData.rememberMe} onChange={handleChange} className="jt-checkbox" />
          <span>Remember me</span>
        </label>
        <button type="button" className="jt-link">Forgot password?</button>
      </div>

      {errors.form && (
        <p className="jt-error" style={{ marginTop: '4px' }}>
          {errors.form}
        </p>
      )}

      <button type="submit" className={`jt-btn-primary${loading ? ' jt-btn-loading' : ''}`} style={{ '--delay': '0.2s' }} disabled={loading}>
        {loading ? (
          <span className="jt-spinner-wrap"><span className="jt-spinner" /><span>Authenticating…</span></span>
        ) : (
          <><LogIn size={15} /><span>Sign in to Dashboard</span><ChevronRight size={14} className="jt-btn-arrow" /></>
        )}
      </button>

      <div className="jt-divider" style={{ '--delay': '0.25s' }}>
        <span>Secure access only</span>
      </div>

      <div className="jt-badges" style={{ '--delay': '0.3s' }}>
        <span className="jt-badge"><Fingerprint size={12} />Biometric ready</span>
        <span className="jt-badge"><Key size={12} />2FA supported</span>
        <span className="jt-badge"><Shield size={12} />256-bit encrypted</span>
      </div>
    </form>
  );
};

// ─────────────────────────────────────────────
// SIGNUP FORM (ADMIN + DEPARTMENTS, WITH OTP)
// ─────────────────────────────────────────────
const SignupForm = ({ onAuthenticated }) => {
  const [showPwd, setShowPwd] = useState(false);
  const [showCpwd, setShowCpwd] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '', email: '', department: '',
    employeeId: '', password: '', confirmPassword: '', acceptTerms: false
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [otpPhase, setOtpPhase] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState('');

  const departments = [
    { value: 'POLICE', label: 'Police Department' },
    { value: 'FIRE', label: 'Fire & Rescue Services' },
    { value: 'MUNICIPAL', label: 'Municipal Corporation' },
    { value: 'TRAFFIC', label: 'Traffic Management' },
    { value: 'ADMIN', label: 'Administration' },
  ];

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const e = {};
    if (!formData.fullName) e.fullName = 'Full name is required';
    if (!formData.email) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) e.email = 'Valid official email required';
    if (!formData.department) e.department = 'Select your department';
    if (!formData.employeeId) e.employeeId = 'Employee ID is required';
    if (!formData.password) e.password = 'Password is required';
    else if (formData.password.length < 8) e.password = 'Minimum 8 characters';
    if (formData.password !== formData.confirmPassword) e.confirmPassword = 'Passwords do not match';
    if (!formData.acceptTerms) e.acceptTerms = 'You must accept the terms';
    return e;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    const e = validate();
    if (Object.keys(e).length) {
      setErrors(e);
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: formData.fullName,
        email: formData.email,
        password: formData.password,
        confirmPass: formData.confirmPassword,
        empID: formData.employeeId,
        role: formData.department,
      };
      await api.signup(payload);
      setOtpPhase(true);
    } catch (error) {
      setErrors((prev) => ({
        ...prev,
        form: error?.data?.message || error?.message || 'Signup failed. Please try again.',
      }));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (ev) => {
    ev.preventDefault();
    if (!otp.trim()) {
      setOtpError('OTP is required');
      return;
    }
    setOtpError('');
    setLoading(true);
    try {
      const res = await api.verifySignupOtp({
        email: formData.email,
        otp: otp.trim(),
        role: formData.department,
      });
      setSuccess(true);
      if (onAuthenticated) {
        onAuthenticated({ token: res.token, user: res.user });
      }
    } catch (error) {
      setOtpError(error?.data?.message || error?.message || 'Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="jt-success-state">
        <div className="jt-success-ring">
          <CheckCircle2 size={32} strokeWidth={1.5} />
        </div>
        <p className="jt-success-title">Access Granted</p>
        <p className="jt-success-sub">Signup completed. Redirecting to your dashboard…</p>
      </div>
    );
  }

  if (otpPhase) {
    return (
      <form onSubmit={handleVerifyOtp} className="jt-form" noValidate>
        <p className="jt-form-sub" style={{ marginBottom: '12px' }}>
          Enter the 6-digit OTP provided to you to complete signup.
        </p>
        <InputField label="OTP" icon={Key} error={otpError} delay={0.05}>
          <input
            type="text"
            name="otp"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            placeholder="123456"
            className={`jt-input${otpError ? ' jt-input-err' : ''}`}
          />
        </InputField>
        <button
          type="submit"
          className={`jt-btn-primary${loading ? ' jt-btn-loading' : ''}`}
          style={{ '--delay': '0.12s' }}
          disabled={loading}
        >
          {loading ? (
            <span className="jt-spinner-wrap"><span className="jt-spinner" /><span>Verifying…</span></span>
          ) : (
            <><CheckCircle2 size={15} /><span>Verify OTP & Activate</span><ChevronRight size={14} className="jt-btn-arrow" /></>
          )}
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="jt-form" noValidate>
      <div className="jt-grid-2">
        <InputField label="Full Name" icon={User} error={errors.fullName} delay={0.05}>
          <input type="text" name="fullName" value={formData.fullName} onChange={handleChange}
            placeholder="e.g. Rajesh Kumar" className={`jt-input${errors.fullName ? ' jt-input-err' : ''}`} />
        </InputField>
        <InputField label="Employee ID" icon={Briefcase} error={errors.employeeId} delay={0.08}>
          <input type="text" name="employeeId" value={formData.employeeId} onChange={handleChange}
            placeholder="GOV/IND/12345" className={`jt-input${errors.employeeId ? ' jt-input-err' : ''}`} />
        </InputField>
      </div>

      <InputField label="Official Email" icon={Mail} error={errors.email} delay={0.12}>
        <input type="email" name="email" value={formData.email} onChange={handleChange}
          placeholder="name@department.gov.in" className={`jt-input${errors.email ? ' jt-input-err' : ''}`} />
      </InputField>

      <InputField label="Department" icon={Building2} error={errors.department} delay={0.16}>
        <select name="department" value={formData.department} onChange={handleChange}
          className={`jt-input jt-select${errors.department ? ' jt-input-err' : ''}`}>
          <option value="">Select department…</option>
          {departments.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
        </select>
      </InputField>

      <div className="jt-grid-2">
        <InputField label="Password" icon={Lock} error={errors.password} delay={0.2}>
          <input type={showPwd ? 'text' : 'password'} name="password" value={formData.password}
            onChange={handleChange} placeholder="Min. 8 chars"
            className={`jt-input jt-input-pr${errors.password ? ' jt-input-err' : ''}`} />
          <button type="button" className="jt-eye" onClick={() => setShowPwd(v => !v)} aria-label="Toggle password">
            {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        </InputField>
        <InputField label="Confirm Password" icon={Lock} error={errors.confirmPassword} delay={0.23}>
          <input type={showCpwd ? 'text' : 'password'} name="confirmPassword" value={formData.confirmPassword}
            onChange={handleChange} placeholder="Re-enter"
            className={`jt-input jt-input-pr${errors.confirmPassword ? ' jt-input-err' : ''}`} />
          <button type="button" className="jt-eye" onClick={() => setShowCpwd(v => !v)} aria-label="Toggle confirm">
            {showCpwd ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        </InputField>
      </div>

      <div className="jt-terms-row" style={{ '--delay': '0.27s' }}>
        <input type="checkbox" name="acceptTerms" checked={formData.acceptTerms} onChange={handleChange} className="jt-checkbox" id="terms" />
        <label htmlFor="terms" className="jt-terms-text">
          I agree to the <button type="button" className="jt-link">Terms of Service</button> and <button type="button" className="jt-link">Privacy Policy</button>
        </label>
      </div>
      {errors.acceptTerms && <p className="jt-error" style={{ marginTop: '-8px' }}>{errors.acceptTerms}</p>}

      {errors.form && (
        <p className="jt-error" style={{ marginTop: '4px' }}>
          {errors.form}
        </p>
      )}

      <button type="submit" className={`jt-btn-primary${loading ? ' jt-btn-loading' : ''}`} style={{ '--delay': '0.32s' }} disabled={loading}>
        {loading ? (
          <span className="jt-spinner-wrap"><span className="jt-spinner" /><span>Creating account…</span></span>
        ) : (
          <><UserPlus size={15} /><span>Create secure account</span><ChevronRight size={14} className="jt-btn-arrow" /></>
        )}
      </button>

      <p className="jt-footnote" style={{ '--delay': '0.38s' }}>
        Your account is activated instantly after OTP verification. No email approval is required.
      </p>
    </form>
  );
};

// ─────────────────────────────────────────────
// STATS TICKER (left panel)
// ─────────────────────────────────────────────
const statItems = [
  { icon: Globe, label: 'Districts covered', value: '28+' },
  { icon: Activity, label: 'Active operators', value: '4,200+' },
  { icon: Zap, label: 'Incidents resolved', value: '1.2M' },
  { icon: Shield, label: 'Uptime SLA', value: '99.97%' },
];

const LeftPanel = ({ isDark }) => {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick(t => (t + 1) % statItems.length), 3000);
    return () => clearInterval(id);
  }, []);

  const stat = statItems[tick];
  const Icon = stat.icon;

  return (
    <div className="jt-left-panel">
      <ParticleField isDark={isDark} />

      {/* Glowing orb */}
      <div className="jt-orb jt-orb-1" />
      <div className="jt-orb jt-orb-2" />

      <div className="jt-left-content">
        {/* Brand */}
        <div className="jt-brand-block">
          <div className="jt-brand-logo-wrap">
            <JatayuLogo size={52} />
          </div>
          <div>
            <div className="jt-brand-name">Jatayu AI</div>
            <div className="jt-brand-tagline">Integrated Public Safety Intelligence</div>
          </div>
        </div>

        {/* Divider */}
        <div className="jt-left-divider" />

        {/* Description */}
        <p className="jt-left-desc">
          India's premier AI-powered command and control platform — built for law enforcement, civil services, and emergency response agencies.
        </p>

        {/* Rotating stat */}
        <div className="jt-stat-card" key={tick}>
          <div className="jt-stat-icon-wrap">
            <Icon size={18} strokeWidth={1.5} />
          </div>
          <div>
            <div className="jt-stat-value">{stat.value}</div>
            <div className="jt-stat-label">{stat.label}</div>
          </div>
        </div>

        {/* Static badges */}
        <div className="jt-left-badges">
          {['ISO 27001 Certified', 'MeitY Compliant', 'End-to-End Encrypted'].map(b => (
            <span key={b} className="jt-left-badge">{b}</span>
          ))}
        </div>

        {/* Grid decorative */}
        <div className="jt-grid-deco" />
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// ROOT COMPONENT
// ─────────────────────────────────────────────
export default function JatayuAuth({ onAuthenticated }) {
  const [tab, setTab] = useState('login');
  const [isDark, setIsDark] = useState(() => {
    if (typeof window === 'undefined') return false;
    const saved = localStorage.getItem('jatayu-theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.setAttribute('data-jatayu-theme', 'dark');
    } else {
      root.setAttribute('data-jatayu-theme', 'light');
    }
    localStorage.setItem('jatayu-theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  return (
    <>
      <style>{CSS}</style>
      <div className="jt-root" data-jatayu-theme={isDark ? 'dark' : 'light'}>
        {/* Background */}
        <div className="jt-bg" />
        <div className="jt-bg-mesh" />

        {/* Card */}
        <div className="jt-card">
          {/* Left */}
          <div className="jt-left-col">
            <LeftPanel isDark={isDark} />
          </div>

          {/* Right */}
          <div className="jt-right-col">
            {/* Header row */}
            <div className="jt-right-header">
              {/* Brand (mobile only) */}
              <div className="jt-mobile-brand">
                <JatayuLogo size={28} />
                <span className="jt-mobile-brand-name">Jatayu AI</span>
              </div>

              {/* Tab switcher */}
              <div className="jt-tabs">
                <button
                  className={`jt-tab${tab === 'login' ? ' jt-tab-active' : ''}`}
                  onClick={() => setTab('login')}
                >
                  <LogIn size={13} /> Login
                </button>
                <button
                  className={`jt-tab${tab === 'signup' ? ' jt-tab-active' : ''}`}
                  onClick={() => setTab('signup')}
                >
                  <UserPlus size={13} /> Sign up
                </button>
              </div>

              {/* Theme toggle */}
              <button
                className="jt-theme-btn"
                onClick={() => setIsDark(v => !v)}
                aria-label="Toggle theme"
              >
                <span className={`jt-theme-icon${isDark ? ' jt-theme-sun' : ' jt-theme-moon'}`}>
                  {isDark ? <Sun size={16} /> : <Moon size={16} />}
                </span>
              </button>
            </div>

            {/* Form title */}
            <div className="jt-form-title-block" key={tab}>
              <h2 className="jt-form-title">
                {tab === 'login' ? 'Welcome back' : 'Create account'}
              </h2>
              <p className="jt-form-sub">
                {tab === 'login'
                  ? 'Sign in to your secure dashboard'
                  : 'Register for authorised platform access'}
              </p>
            </div>

            {/* Form */}
            <div className="jt-form-container" key={`form-${tab}`}>
              {tab === 'login' ? (
                <LoginForm onAuthenticated={onAuthenticated} />
              ) : (
                <SignupForm onAuthenticated={onAuthenticated} />
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────
// ALL CSS (scoped with .jt- prefix)
// ─────────────────────────────────────────────
const CSS = `
  /* ── TOKENS ───────────────────────────────── */
  [data-jatayu-theme="light"] {
    --bg:           #f1f5f9;
    --bg-mesh:      radial-gradient(ellipse 80% 60% at 20% 10%, #e0e7ff 0%, transparent 60%),
                    radial-gradient(ellipse 60% 50% at 80% 80%, #dbeafe 0%, transparent 60%);
    --card-bg:      #ffffff;
    --card-border:  rgba(99,102,241,0.12);
    --card-shadow:  0 32px 80px -12px rgba(99,102,241,0.18), 0 4px 16px rgba(0,0,0,0.06);
    --panel-from:   #312e81;
    --panel-to:     #1e1b4b;
    --text-primary: #0f172a;
    --text-secondary:#475569;
    --text-muted:   #94a3b8;
    --input-bg:     #f8fafc;
    --input-border: #e2e8f0;
    --input-focus:  #6366f1;
    --input-err:    #ef4444;
    --input-text:   #0f172a;
    --input-placeholder: #94a3b8;
    --label:        #334155;
    --link:         #4f46e5;
    --link-hover:   #3730a3;
    --btn-bg:       #4f46e5;
    --btn-hover:    #4338ca;
    --btn-text:     #ffffff;
    --tab-track:    #f1f5f9;
    --tab-active-bg:#ffffff;
    --tab-active-shadow: 0 1px 4px rgba(0,0,0,0.1);
    --tab-text:     #64748b;
    --tab-active-text:#0f172a;
    --theme-btn-bg: #f1f5f9;
    --theme-btn-border:#e2e8f0;
    --theme-btn-text:#475569;
    --badge-bg:     rgba(99,102,241,0.08);
    --badge-text:   #4f46e5;
    --badge-border: rgba(99,102,241,0.2);
    --divider:      #e2e8f0;
    --check-accent: #4f46e5;
    --success-ring: #4f46e5;
    --success-bg:   rgba(99,102,241,0.06);
  }

  [data-jatayu-theme="dark"] {
    --bg:           #060b18;
    --bg-mesh:      radial-gradient(ellipse 80% 60% at 20% 10%, rgba(99,102,241,0.15) 0%, transparent 60%),
                    radial-gradient(ellipse 60% 50% at 80% 80%, rgba(30,27,75,0.4) 0%, transparent 60%);
    --card-bg:      #0d1424;
    --card-border:  rgba(99,102,241,0.18);
    --card-shadow:  0 32px 80px -12px rgba(0,0,0,0.7), 0 0 0 1px rgba(99,102,241,0.1);
    --panel-from:   #1e1b4b;
    --panel-to:     #0d0b2b;
    --text-primary: #f1f5f9;
    --text-secondary:#94a3b8;
    --text-muted:   #64748b;
    --input-bg:     #111827;
    --input-border: #1e293b;
    --input-focus:  #818cf8;
    --input-err:    #f87171;
    --input-text:   #f1f5f9;
    --input-placeholder:#4b5563;
    --label:        #cbd5e1;
    --link:         #818cf8;
    --link-hover:   #a5b4fc;
    --btn-bg:       #4f46e5;
    --btn-hover:    #6366f1;
    --btn-text:     #ffffff;
    --tab-track:    #111827;
    --tab-active-bg:#1e293b;
    --tab-active-shadow: 0 1px 6px rgba(0,0,0,0.4);
    --tab-text:     #64748b;
    --tab-active-text:#f1f5f9;
    --theme-btn-bg: #111827;
    --theme-btn-border:#1e293b;
    --theme-btn-text:#94a3b8;
    --badge-bg:     rgba(99,102,241,0.1);
    --badge-text:   #a5b4fc;
    --badge-border: rgba(99,102,241,0.25);
    --divider:      #1e293b;
    --check-accent: #818cf8;
    --success-ring: #818cf8;
    --success-bg:   rgba(99,102,241,0.08);
  }

  /* ── RESET ────────────────────────────────── */
  .jt-root *, .jt-root *::before, .jt-root *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  /* ── KEYFRAMES ────────────────────────────── */
  @keyframes jt-fade-up {
    from { opacity:0; transform: translateY(18px); }
    to   { opacity:1; transform: translateY(0); }
  }
  @keyframes jt-fade-in {
    from { opacity:0; }
    to   { opacity:1; }
  }
  @keyframes jt-slide-right {
    from { opacity:0; transform: translateX(20px); }
    to   { opacity:1; transform: translateX(0); }
  }
  @keyframes jt-slide-left {
    from { opacity:0; transform: translateX(-20px); }
    to   { opacity:1; transform: translateX(0); }
  }
  @keyframes jt-shake {
    0%,100% { transform:translateX(0); }
    20%     { transform:translateX(-5px); }
    60%     { transform:translateX(5px); }
  }
  @keyframes jt-spin {
    to { transform: rotate(360deg); }
  }
  @keyframes jt-pulse-ring {
    0%   { box-shadow: 0 0 0 0 rgba(99,102,241,0.4); }
    70%  { box-shadow: 0 0 0 10px rgba(99,102,241,0); }
    100% { box-shadow: 0 0 0 0 rgba(99,102,241,0); }
  }
  @keyframes jt-stat-in {
    from { opacity:0; transform:translateY(8px) scale(0.97); }
    to   { opacity:1; transform:translateY(0) scale(1); }
  }
  @keyframes jt-orb-drift {
    0%,100% { transform: translate(0,0) scale(1); }
    50%     { transform: translate(12px,-16px) scale(1.08); }
  }
  @keyframes jt-success-pop {
    0%   { opacity:0; transform:scale(0.7); }
    70%  { transform:scale(1.05); }
    100% { opacity:1; transform:scale(1); }
  }
  @keyframes jt-theme-swap {
    0%   { opacity:0; transform:rotate(-90deg) scale(0.5); }
    100% { opacity:1; transform:rotate(0deg) scale(1); }
  }
  @keyframes jt-field-in {
    from { opacity:0; transform:translateY(10px); }
    to   { opacity:1; transform:translateY(0); }
  }
  @keyframes jt-shimmer {
    0%   { background-position: -200% center; }
    100% { background-position: 200% center; }
  }

  /* ── ROOT / LAYOUT ────────────────────────── */
  .jt-root {
    min-height: 100vh;
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px 16px;
    background: var(--bg);
    transition: background 0.4s ease;
    font-family: 'DM Sans', 'Segoe UI', system-ui, sans-serif;
    position: relative;
    overflow: hidden;
  }

  .jt-bg {
    position: fixed;
    inset: 0;
    background: var(--bg);
    transition: background 0.5s ease;
    z-index: 0;
  }

  .jt-bg-mesh {
    position: fixed;
    inset: 0;
    background: var(--bg-mesh);
    transition: background 0.5s ease;
    pointer-events: none;
    z-index: 0;
  }

  /* ── CARD ─────────────────────────────────── */
  .jt-card {
    position: relative;
    z-index: 1;
    width: 100%;
    max-width: 960px;
    display: grid;
    grid-template-columns: 1fr 1.15fr;
    border-radius: 20px;
    overflow: hidden;
    background: var(--card-bg);
    border: 1px solid var(--card-border);
    box-shadow: var(--card-shadow);
    animation: jt-fade-up 0.6s cubic-bezier(0.22,1,0.36,1) both;
    transition: background 0.4s ease, border-color 0.4s ease, box-shadow 0.4s ease;
  }

  @media (max-width: 700px) {
    .jt-card { grid-template-columns: 1fr; }
  }

  /* ── LEFT PANEL ───────────────────────────── */
  .jt-left-col {
    display: block;
  }
  @media (max-width: 700px) {
    .jt-left-col { display: none; }
  }

  .jt-left-panel {
    position: relative;
    height: 100%;
    min-height: 520px;
    background: linear-gradient(145deg, var(--panel-from), var(--panel-to));
    overflow: hidden;
    padding: 36px 32px;
    display: flex;
    flex-direction: column;
    transition: background 0.5s ease;
  }

  .jt-orb {
    position: absolute;
    border-radius: 50%;
    pointer-events: none;
    filter: blur(48px);
    animation: jt-orb-drift 8s ease-in-out infinite;
  }
  .jt-orb-1 {
    width: 240px; height: 240px;
    background: radial-gradient(circle, rgba(129,140,248,0.3), transparent 70%);
    top: -60px; right: -60px;
    animation-delay: 0s;
  }
  .jt-orb-2 {
    width: 180px; height: 180px;
    background: radial-gradient(circle, rgba(79,70,229,0.25), transparent 70%);
    bottom: 40px; left: -40px;
    animation-delay: -4s;
  }

  .jt-left-content {
    position: relative;
    z-index: 2;
    display: flex;
    flex-direction: column;
    gap: 20px;
    height: 100%;
  }

  .jt-brand-block {
    display: flex;
    align-items: center;
    gap: 14px;
    animation: jt-slide-left 0.7s 0.1s cubic-bezier(0.22,1,0.36,1) both;
  }

  .jt-brand-logo-wrap {
    background: rgba(255,255,255,0.1);
    border: 1px solid rgba(255,255,255,0.15);
    border-radius: 14px;
    padding: 10px;
    backdrop-filter: blur(8px);
    animation: jt-pulse-ring 3s ease-in-out infinite;
    transition: transform 0.3s ease;
  }
  .jt-brand-logo-wrap:hover {
    transform: scale(1.06) rotate(-3deg);
  }

  .jt-brand-name {
    font-size: 22px;
    font-weight: 800;
    letter-spacing: -0.5px;
    color: #ffffff;
    line-height: 1.1;
    text-shadow: 0 1px 12px rgba(99,102,241,0.6);
  }

  .jt-brand-tagline {
    font-size: 10.5px;
    color: rgba(255,255,255,0.55);
    text-transform: uppercase;
    letter-spacing: 0.8px;
    margin-top: 3px;
  }

  .jt-left-divider {
    height: 1px;
    background: linear-gradient(90deg, rgba(255,255,255,0.2), rgba(255,255,255,0.05), transparent);
    animation: jt-fade-in 0.6s 0.3s both;
  }

  .jt-left-desc {
    font-size: 13.5px;
    line-height: 1.7;
    color: rgba(255,255,255,0.65);
    animation: jt-slide-left 0.7s 0.25s cubic-bezier(0.22,1,0.36,1) both;
  }

  .jt-stat-card {
    display: flex;
    align-items: center;
    gap: 14px;
    background: rgba(255,255,255,0.07);
    border: 1px solid rgba(255,255,255,0.12);
    border-radius: 14px;
    padding: 14px 18px;
    backdrop-filter: blur(12px);
    animation: jt-stat-in 0.4s cubic-bezier(0.34,1.56,0.64,1) both;
    transition: transform 0.3s ease;
  }
  .jt-stat-card:hover {
    transform: translateY(-2px);
  }

  .jt-stat-icon-wrap {
    width: 38px; height: 38px;
    border-radius: 10px;
    background: rgba(129,140,248,0.25);
    border: 1px solid rgba(129,140,248,0.3);
    display: flex; align-items:center; justify-content:center;
    color: #a5b4fc;
    flex-shrink: 0;
  }

  .jt-stat-value {
    font-size: 20px;
    font-weight: 800;
    color: #ffffff;
    letter-spacing: -0.5px;
    line-height: 1;
  }

  .jt-stat-label {
    font-size: 11px;
    color: rgba(255,255,255,0.5);
    margin-top: 2px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .jt-left-badges {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: auto;
    animation: jt-fade-in 0.6s 0.5s both;
  }

  .jt-left-badge {
    font-size: 10px;
    padding: 4px 10px;
    border-radius: 999px;
    background: rgba(255,255,255,0.07);
    border: 1px solid rgba(255,255,255,0.12);
    color: rgba(255,255,255,0.55);
    letter-spacing: 0.3px;
  }

  .jt-grid-deco {
    position: absolute;
    inset: 0;
    background-image:
      linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
    background-size: 32px 32px;
    pointer-events: none;
    z-index: 0;
  }

  /* ── RIGHT PANEL ──────────────────────────── */
  .jt-right-col {
    padding: 32px 36px 36px;
    display: flex;
    flex-direction: column;
    gap: 0;
    background: var(--card-bg);
    transition: background 0.4s ease;
    overflow-y: auto;
  }

  @media (max-width: 700px) {
    .jt-right-col { padding: 28px 20px; }
  }

  /* ── RIGHT HEADER ─────────────────────────── */
  .jt-right-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 28px;
    animation: jt-fade-in 0.5s 0.1s both;
  }

  .jt-mobile-brand {
    display: none;
    align-items: center;
    gap: 8px;
    margin-right: auto;
  }
  @media (max-width: 700px) {
    .jt-mobile-brand { display: flex; }
  }

  .jt-mobile-brand-name {
    font-size: 16px;
    font-weight: 800;
    color: var(--text-primary);
    letter-spacing: -0.3px;
    transition: color 0.3s ease;
  }

  /* ── TABS ─────────────────────────────────── */
  .jt-tabs {
    display: flex;
    background: var(--tab-track);
    border-radius: 999px;
    padding: 3px;
    gap: 2px;
    margin-left: auto;
    transition: background 0.3s ease;
  }

  .jt-tab {
    display: flex;
    align-items: center;
    gap: 5px;
    padding: 7px 16px;
    border-radius: 999px;
    border: none;
    background: transparent;
    color: var(--tab-text);
    font-size: 12.5px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.25s ease;
  }

  .jt-tab:hover:not(.jt-tab-active) {
    color: var(--text-primary);
  }

  .jt-tab-active {
    background: var(--tab-active-bg);
    color: var(--tab-active-text);
    box-shadow: var(--tab-active-shadow);
    font-weight: 600;
  }

  /* ── THEME BTN ────────────────────────────── */
  .jt-theme-btn {
    width: 36px; height: 36px;
    border-radius: 50%;
    border: 1px solid var(--theme-btn-border);
    background: var(--theme-btn-bg);
    color: var(--theme-btn-text);
    display: flex; align-items:center; justify-content:center;
    cursor: pointer;
    transition: all 0.3s ease;
    flex-shrink: 0;
    overflow: hidden;
  }
  .jt-theme-btn:hover {
    transform: scale(1.1) rotate(12deg);
    border-color: var(--input-focus);
    color: var(--input-focus);
  }

  .jt-theme-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    animation: jt-theme-swap 0.35s cubic-bezier(0.34,1.56,0.64,1) both;
  }

  /* ── FORM TITLE ───────────────────────────── */
  .jt-form-title-block {
    margin-bottom: 22px;
    animation: jt-slide-right 0.5s 0.15s cubic-bezier(0.22,1,0.36,1) both;
  }

  .jt-form-title {
    font-size: 22px;
    font-weight: 800;
    color: var(--text-primary);
    letter-spacing: -0.5px;
    line-height: 1.2;
    transition: color 0.3s ease;
  }

  .jt-form-sub {
    font-size: 13px;
    color: var(--text-secondary);
    margin-top: 4px;
    transition: color 0.3s ease;
  }

  /* ── FORM CONTAINER ───────────────────────── */
  .jt-form-container {
    animation: jt-slide-right 0.45s 0.1s cubic-bezier(0.22,1,0.36,1) both;
  }

  .jt-form {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  /* ── FIELD ────────────────────────────────── */
  .jt-field {
    display: flex;
    flex-direction: column;
    gap: 5px;
    animation: jt-field-in 0.4s calc(var(--delay, 0s) + 0.1s) both;
  }

  .jt-label {
    font-size: 12.5px;
    font-weight: 600;
    color: var(--label);
    letter-spacing: 0.1px;
    transition: color 0.3s ease;
  }

  .jt-input-wrap {
    position: relative;
    display: flex;
    align-items: center;
  }

  .jt-icon {
    position: absolute;
    left: 12px;
    width: 15px; height: 15px;
    color: var(--text-muted);
    pointer-events: none;
    transition: color 0.2s ease;
    flex-shrink: 0;
  }

  .jt-input-wrap:focus-within .jt-icon {
    color: var(--input-focus);
  }

  .jt-input {
    width: 100%;
    padding: 10px 12px 10px 38px;
    border-radius: 12px;
    border: 1.5px solid var(--input-border);
    background: var(--input-bg);
    color: var(--input-text);
    font-size: 13.5px;
    outline: none;
    transition: all 0.25s ease;
    font-family: inherit;
    -webkit-appearance: none;
  }

  .jt-input::placeholder { color: var(--input-placeholder); }

  .jt-input:hover:not(:focus) {
    border-color: rgba(99,102,241,0.3);
  }

  .jt-input:focus {
    border-color: var(--input-focus);
    background: var(--card-bg);
    box-shadow: 0 0 0 3px rgba(99,102,241,0.12);
  }

  .jt-input-err {
    border-color: var(--input-err) !important;
    box-shadow: 0 0 0 3px rgba(239,68,68,0.08) !important;
  }

  .jt-input-pr { padding-right: 38px; }

  .jt-select {
    cursor: pointer;
    padding-right: 12px;
  }

  .jt-eye {
    position: absolute;
    right: 11px;
    background: transparent;
    border: none;
    color: var(--text-muted);
    cursor: pointer;
    display: flex; align-items:center;
    padding: 3px;
    border-radius: 6px;
    transition: all 0.2s ease;
  }
  .jt-eye:hover {
    color: var(--text-primary);
    background: rgba(99,102,241,0.08);
  }

  .jt-error {
    font-size: 11.5px;
    color: var(--input-err);
    animation: jt-shake 0.3s ease;
    display: flex;
    align-items: center;
    gap: 4px;
  }

  /* ── GRID ─────────────────────────────────── */
  .jt-grid-2 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }
  @media (max-width: 460px) {
    .jt-grid-2 { grid-template-columns: 1fr; }
  }

  /* ── ROW BETWEEN ──────────────────────────── */
  .jt-row-between {
    display: flex;
    align-items: center;
    justify-content: space-between;
    animation: jt-field-in 0.4s calc(var(--delay, 0s) + 0.1s) both;
  }

  /* ── CHECKBOX ─────────────────────────────── */
  .jt-check-label {
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    font-size: 13px;
    color: var(--text-secondary);
    transition: color 0.2s;
  }
  .jt-check-label:hover { color: var(--input-focus); }

  .jt-checkbox {
    width: 15px; height: 15px;
    accent-color: var(--check-accent);
    cursor: pointer;
    border-radius: 4px;
  }

  /* ── LINK ─────────────────────────────────── */
  .jt-link {
    background: none;
    border: none;
    color: var(--link);
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    padding: 0;
    font-family: inherit;
    transition: all 0.2s;
  }
  .jt-link:hover {
    color: var(--link-hover);
    text-decoration: underline;
  }

  /* ── PRIMARY BUTTON ───────────────────────── */
  .jt-btn-primary {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 11px 20px;
    border-radius: 12px;
    border: none;
    background: var(--btn-bg);
    color: var(--btn-text);
    font-size: 14px;
    font-weight: 700;
    font-family: inherit;
    cursor: pointer;
    letter-spacing: 0.2px;
    position: relative;
    overflow: hidden;
    transition: all 0.3s ease;
    animation: jt-field-in 0.4s calc(var(--delay, 0s) + 0.1s) both;
  }

  .jt-btn-primary::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(110deg, transparent 30%, rgba(255,255,255,0.15) 50%, transparent 70%);
    background-size: 200% 100%;
    opacity: 0;
    transition: opacity 0.3s;
  }

  .jt-btn-primary:hover:not(:disabled) {
    background: var(--btn-hover);
    transform: translateY(-1px);
    box-shadow: 0 8px 24px rgba(79,70,229,0.4);
  }
  .jt-btn-primary:hover::before { opacity: 1; animation: jt-shimmer 1s linear; }
  .jt-btn-primary:active:not(:disabled) { transform: translateY(0) scale(0.98); }
  .jt-btn-primary:disabled { opacity: 0.8; cursor: not-allowed; }

  .jt-btn-arrow {
    margin-left: 2px;
    transition: transform 0.2s ease;
  }
  .jt-btn-primary:hover .jt-btn-arrow {
    transform: translateX(3px);
  }

  .jt-btn-loading {
    background: var(--btn-hover) !important;
  }

  .jt-spinner-wrap {
    display: flex;
    align-items: center;
    gap: 9px;
  }

  .jt-spinner {
    width: 15px; height: 15px;
    border: 2px solid rgba(255,255,255,0.3);
    border-top-color: #ffffff;
    border-radius: 50%;
    animation: jt-spin 0.7s linear infinite;
    flex-shrink: 0;
  }

  /* ── DIVIDER ──────────────────────────────── */
  .jt-divider {
    display: flex;
    align-items: center;
    gap: 12px;
    animation: jt-field-in 0.4s calc(var(--delay, 0s) + 0.1s) both;
  }
  .jt-divider::before, .jt-divider::after {
    content: '';
    flex: 1;
    height: 1px;
    background: var(--divider);
    transition: background 0.3s ease;
  }
  .jt-divider span {
    font-size: 11px;
    color: var(--text-muted);
    white-space: nowrap;
    transition: color 0.3s ease;
  }

  /* ── BADGES ───────────────────────────────── */
  .jt-badges {
    display: flex;
    justify-content: center;
    gap: 8px;
    flex-wrap: wrap;
    animation: jt-field-in 0.4s calc(var(--delay, 0s) + 0.1s) both;
  }

  .jt-badge {
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 11px;
    padding: 4px 10px;
    border-radius: 999px;
    background: var(--badge-bg);
    color: var(--badge-text);
    border: 1px solid var(--badge-border);
    transition: all 0.25s ease;
    cursor: default;
  }
  .jt-badge:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 10px rgba(99,102,241,0.15);
  }

  /* ── TERMS ROW ────────────────────────────── */
  .jt-terms-row {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    animation: jt-field-in 0.4s calc(var(--delay, 0s) + 0.1s) both;
  }

  .jt-terms-text {
    font-size: 12.5px;
    color: var(--text-secondary);
    line-height: 1.5;
    cursor: default;
    transition: color 0.3s;
  }

  /* ── FOOTNOTE ─────────────────────────────── */
  .jt-footnote {
    text-align: center;
    font-size: 11.5px;
    color: var(--text-muted);
    line-height: 1.6;
    animation: jt-field-in 0.4s calc(var(--delay, 0s) + 0.1s) both;
    transition: color 0.3s ease;
  }

  /* ── SUCCESS STATE ────────────────────────── */
  .jt-success-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px 20px;
    gap: 12px;
    animation: jt-success-pop 0.5s cubic-bezier(0.34,1.56,0.64,1) both;
    text-align: center;
  }

  .jt-success-ring {
    width: 64px; height: 64px;
    border-radius: 50%;
    background: var(--success-bg);
    border: 2px solid var(--success-ring);
    display: flex; align-items:center; justify-content:center;
    color: var(--success-ring);
    animation: jt-pulse-ring 2s ease-in-out infinite;
    transition: all 0.3s;
  }

  .jt-success-title {
    font-size: 18px;
    font-weight: 800;
    color: var(--text-primary);
    letter-spacing: -0.3px;
    transition: color 0.3s;
  }

  .jt-success-sub {
    font-size: 13px;
    color: var(--text-secondary);
    max-width: 240px;
    line-height: 1.6;
    transition: color 0.3s;
  }
`;