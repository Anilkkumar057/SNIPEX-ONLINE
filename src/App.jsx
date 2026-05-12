import React, { useEffect, useState, useRef } from 'react'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta?.env?.VITE_SUPABASE_URL || 'https://leoiwwyepvxsrwbtzgrc.supabase.co'
const SUPABASE_ANON_KEY = import.meta?.env?.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxlb2l3d3llcHZ4c3J3YnR6Z3JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgyMjg0NzYsImV4cCI6MjA5MzgwNDQ3Nn0.O5Ti_FprfgxzccV5aHtnhQgDlMHS-5CG-tORtVCHBBE'

const BACKEND_URL = (import.meta?.env?.VITE_BACKEND_URL || 'http://127.0.0.1:8000').replace(/\/$/, '')
const FRONTEND_URL = (import.meta?.env?.VITE_FRONTEND_URL && !import.meta.env.VITE_FRONTEND_URL.includes('localhost')) ? import.meta.env.VITE_FRONTEND_URL.replace(/\/$/, '') : window.location.origin
const UPI_QR_IMAGE_URL = import.meta?.env?.VITE_UPI_QR_IMAGE_URL || 'https://snipex-portal-frontend.vercel.app/SNIPEXAI.jpeg'
const UPI_ID = import.meta?.env?.VITE_UPI_ID || 'Snipexaili@ptyes'
const ADMIN_EMAIL = 'mystocktradesk@gmail.com'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    storage: window.localStorage
  }
})


function normalizeIndianPhone(mobile) {
  const digits = String(mobile || '').replace(/\D/g, '')
  if (digits.length === 10 && /^[6-9]/.test(digits)) return `+91${digits}`
  if (digits.length === 12 && digits.startsWith('91')) return `+${digits}`
  return ''
}
function isValidEmail(email) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').trim()) }
function isAdminUser(user) { return String(user?.email || '').toLowerCase() === ADMIN_EMAIL }

// ─── GLOBAL STYLES ───────────────────────────────────────────────────────────
const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;500;600;700&family=Share+Tech+Mono&family=Exo+2:wght@300;400;500;600;700;800&display=swap');

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    :root {
      --gold: #f0c040;
      --gold2: #ffd700;
      --teal: #00d4aa;
      --teal2: #00ffcc;
      --red: #ff4560;
      --green: #00e396;
      --blue: #4ca3ff;
      --purple: #a78bfa;
      --bg0: #040810;
      --bg1: #070d1a;
      --bg2: #0b1525;
      --bg3: #101e35;
      --border: rgba(240,192,64,0.18);
      --border2: rgba(0,212,170,0.15);
      --text: #e2e8f0;
      --text2: #94a3b8;
      --text3: #64748b;
      --glass: rgba(11,21,37,0.82);
      --glow-gold: 0 0 20px rgba(240,192,64,0.25);
      --glow-teal: 0 0 20px rgba(0,212,170,0.25);
    }

    body { background: var(--bg0); color: var(--text); font-family: 'Exo 2', sans-serif; overflow-x: hidden; }
    ::-webkit-scrollbar { width: 4px; }
    ::-webkit-scrollbar-track { background: var(--bg1); }
    ::-webkit-scrollbar-thumb { background: var(--gold); border-radius: 2px; }

    @keyframes pulse-gold { 0%,100%{box-shadow:0 0 8px rgba(240,192,64,0.4)} 50%{box-shadow:0 0 20px rgba(240,192,64,0.8)} }
    @keyframes pulse-teal { 0%,100%{box-shadow:0 0 8px rgba(0,212,170,0.4)} 50%{box-shadow:0 0 20px rgba(0,212,170,0.8)} }
    @keyframes pulse-red  { 0%,100%{box-shadow:0 0 8px rgba(255,69,96,0.4)}  50%{box-shadow:0 0 20px rgba(255,69,96,0.8)}  }
    @keyframes tick { 0%{opacity:1} 49%{opacity:1} 50%{opacity:0} 100%{opacity:0} }
    @keyframes scanline { 0%{transform:translateY(-100%)} 100%{transform:translateY(100vh)} }
    @keyframes fadeSlideIn { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
    @keyframes marquee { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
    @keyframes shimmer { 0%{background-position:-200% center} 100%{background-position:200% center} }
    @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.3} }
    @keyframes barGrow { from{width:0} to{width:var(--w)} }
    @keyframes rotateRing { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
    @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-4px)} }

    .fade-in { animation: fadeSlideIn 0.4s ease both; }

    .glass-card {
      background: var(--glass);
      border: 1px solid var(--border);
      border-radius: 14px;
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      position: relative;
      overflow: hidden;
    }
    .glass-card::before {
      content: '';
      position: absolute;
      top: 0; left: 0; right: 0;
      height: 1px;
      background: linear-gradient(90deg, transparent, var(--gold), transparent);
      opacity: 0.6;
    }

    .teal-card { border-color: var(--border2); }
    .teal-card::before { background: linear-gradient(90deg, transparent, var(--teal), transparent); }

    .btn-gold {
      background: linear-gradient(135deg, #c8950a, #f0c040, #c8950a);
      background-size: 200%;
      color: #040810;
      border: none;
      border-radius: 8px;
      font-family: 'Rajdhani', sans-serif;
      font-weight: 700;
      font-size: 13px;
      letter-spacing: 1px;
      cursor: pointer;
      padding: 8px 16px;
      text-transform: uppercase;
      transition: all 0.3s;
    }
    .btn-gold:hover { background-position: right; box-shadow: 0 0 16px rgba(240,192,64,0.5); }

    .btn-teal {
      background: linear-gradient(135deg, #007a62, #00d4aa, #007a62);
      background-size: 200%;
      color: #040810;
      border: none;
      border-radius: 8px;
      font-family: 'Rajdhani', sans-serif;
      font-weight: 700;
      font-size: 13px;
      letter-spacing: 1px;
      cursor: pointer;
      padding: 8px 16px;
      text-transform: uppercase;
      transition: all 0.3s;
    }
    .btn-teal:hover { background-position: right; box-shadow: 0 0 16px rgba(0,212,170,0.5); }

    .mono { font-family: 'Share Tech Mono', monospace; }
    .rajdhani { font-family: 'Rajdhani', sans-serif; }

    .label-gold { color: var(--gold); font-size: 10px; letter-spacing: 2px; text-transform: uppercase; font-weight: 600; font-family: 'Rajdhani', sans-serif; }
    .label-teal { color: var(--teal); font-size: 10px; letter-spacing: 2px; text-transform: uppercase; font-weight: 600; font-family: 'Rajdhani', sans-serif; }

    .toggle-switch { position: relative; display: inline-block; width: 44px; height: 24px; }
    .toggle-switch input { opacity: 0; width: 0; height: 0; }
    .toggle-slider {
      position: absolute; cursor: pointer;
      top: 0; left: 0; right: 0; bottom: 0;
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 24px;
      transition: 0.3s;
    }
    .toggle-slider:before {
      content: '';
      position: absolute;
      width: 16px; height: 16px;
      left: 3px; bottom: 3px;
      background: #64748b;
      border-radius: 50%;
      transition: 0.3s;
    }
    .toggle-switch input:checked + .toggle-slider { background: rgba(0,212,170,0.2); border-color: var(--teal); }
    .toggle-switch input:checked + .toggle-slider:before { transform: translateX(20px); background: var(--teal); box-shadow: 0 0 8px var(--teal); }
    .toggle-switch.gold input:checked + .toggle-slider { background: rgba(240,192,64,0.2); border-color: var(--gold); }
    .toggle-switch.gold input:checked + .toggle-slider:before { background: var(--gold); box-shadow: 0 0 8px var(--gold); }

    .confidence-bar-wrap { height: 6px; background: rgba(255,255,255,0.06); border-radius: 3px; overflow: hidden; }
    .confidence-bar { height: 100%; border-radius: 3px; transition: width 1s ease; }

    .dot-live { width: 8px; height: 8px; border-radius: 50%; background: var(--green); animation: blink 1.2s infinite; display: inline-block; }
    .dot-warn { background: var(--gold); }
    .dot-off  { background: var(--text3); animation: none; }

    .nav-item {
      display: flex; align-items: center; gap: 10px;
      padding: 10px 14px; border-radius: 10px;
      cursor: pointer; transition: all 0.2s;
      color: var(--text2); font-size: 13px;
      font-family: 'Rajdhani', sans-serif; font-weight: 600; letter-spacing: 0.5px;
      border: 1px solid transparent;
    }
    .nav-item:hover { background: rgba(240,192,64,0.07); color: var(--gold); border-color: rgba(240,192,64,0.15); }
    .nav-item.active { background: rgba(240,192,64,0.12); color: var(--gold); border-color: rgba(240,192,64,0.3); }
    .nav-item.active .nav-icon { color: var(--gold); }

    .pair-row { display: flex; align-items: center; padding: 9px 0; border-bottom: 1px solid rgba(255,255,255,0.04); transition: background 0.2s; }
    .pair-row:hover { background: rgba(255,255,255,0.02); border-radius: 6px; }
    .pair-row:last-child { border-bottom: none; }

    .badge {
      padding: 2px 8px; border-radius: 4px; font-size: 10px;
      font-family: 'Rajdhani', sans-serif; font-weight: 700; letter-spacing: 1px; text-transform: uppercase;
    }
    .badge-buy  { background: rgba(0,227,150,0.15); color: var(--green); border: 1px solid rgba(0,227,150,0.3); }
    .badge-sell { background: rgba(255,69,96,0.15);  color: var(--red);   border: 1px solid rgba(255,69,96,0.3); }
    .badge-hold { background: rgba(240,192,64,0.15); color: var(--gold);  border: 1px solid rgba(240,192,64,0.3); }
    .badge-active { background: rgba(0,212,170,0.15); color: var(--teal); border: 1px solid rgba(0,212,170,0.3); }

    .exec-log-item { padding: 6px 10px; border-radius: 6px; margin-bottom: 4px; font-size: 11px; font-family: 'Share Tech Mono', monospace; }
    .exec-buy  { background: rgba(0,227,150,0.06); border-left: 2px solid var(--green); }
    .exec-sell { background: rgba(255,69,96,0.06);  border-left: 2px solid var(--red); }
    .exec-sys  { background: rgba(100,116,139,0.1); border-left: 2px solid var(--text3); }

    .ring-chart { position: relative; display: flex; align-items: center; justify-content: center; }

    table { width: 100%; border-collapse: collapse; }
    thead th { padding: 8px 10px; text-align: left; font-size: 10px; letter-spacing: 1.5px; color: var(--text3); font-family: 'Rajdhani', sans-serif; font-weight: 600; text-transform: uppercase; border-bottom: 1px solid rgba(255,255,255,0.06); }
    tbody td { padding: 9px 10px; font-size: 12px; border-bottom: 1px solid rgba(255,255,255,0.03); }
    tbody tr:hover td { background: rgba(255,255,255,0.02); }

    .scanline-overlay {
      position: fixed; top: 0; left: 0; right: 0; bottom: 0; pointer-events: none; z-index: 9999;
      background: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px);
    }
  `}</style>
)

// ─── LIVE CLOCK ──────────────────────────────────────────────────────────────
function LiveClock() {
  const [t, setT] = useState(new Date())
  useEffect(() => { const id = setInterval(() => setT(new Date()), 1000); return () => clearInterval(id) }, [])
  const pad = n => String(n).padStart(2, '0')
  return (
    <span className="mono" style={{ color: 'var(--gold)', fontSize: 13 }}>
      {pad(t.getUTCHours())}:{pad(t.getUTCMinutes())}:{pad(t.getUTCSeconds())} UTC
    </span>
  )
}

// ─── MARKET RIBBON ───────────────────────────────────────────────────────────
const ribbonData = [
  { sym: 'XAUUSD', price: '2,341.50', chg: '+0.42%', up: true },
  { sym: 'EURUSD', price: '1.08742', chg: '+0.18%', up: true },
  { sym: 'GBPUSD', price: '1.26881', chg: '-0.09%', up: false },
  { sym: 'USDJPY', price: '154.320', chg: '+0.31%', up: true },
  { sym: 'BTCUSDT', price: '67,241', chg: '+1.24%', up: true },
  { sym: 'ETHUSDT', price: '3,512.8', chg: '+0.87%', up: true },
  { sym: 'USOIL', price: '78.340', chg: '-0.55%', up: false },
  { sym: 'AUDUSD', price: '0.65412', chg: '-0.12%', up: false },
  { sym: 'NASDAQ', price: '18,241.3', chg: '+0.68%', up: true },
  { sym: 'SP500',  price: '5,241.2', chg: '+0.45%', up: true },
]

function MarketRibbon() {
  const doubled = [...ribbonData, ...ribbonData]
  return (
    <div style={{ background: 'var(--bg1)', borderBottom: '1px solid var(--border)', overflow: 'hidden', height: 34, display: 'flex', alignItems: 'center' }}>
      <div style={{ whiteSpace: 'nowrap', display: 'inline-flex', animation: 'marquee 32s linear infinite', gap: 0 }}>
        {doubled.map((d, i) => (
          <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '0 24px', borderRight: '1px solid rgba(255,255,255,0.06)' }}>
            <span className="rajdhani" style={{ color: 'var(--text2)', fontSize: 12, fontWeight: 600, letterSpacing: 1 }}>{d.sym}</span>
            <span className="mono" style={{ fontSize: 12, color: 'var(--text)' }}>{d.price}</span>
            <span className="mono" style={{ fontSize: 11, color: d.up ? 'var(--green)' : 'var(--red)' }}>{d.chg}</span>
          </span>
        ))}
      </div>
    </div>
  )
}

// ─── SIDEBAR ─────────────────────────────────────────────────────────────────
const navItems = [
  { id: 'buyer',      icon: '◐', label: 'Buyer Portal' },
  { id: 'admin',      icon: '♛', label: 'Admin Panel' },
]

function Sidebar({ active, onNav }) {
  return (
    <div style={{
      width: 200, flexShrink: 0,
      background: 'linear-gradient(180deg, var(--bg1) 0%, var(--bg2) 100%)',
      borderRight: '1px solid var(--border)',
      display: 'flex', flexDirection: 'column',
      padding: '16px 10px', gap: 2,
      overflowY: 'auto'
    }}>
      <div style={{ padding: '4px 14px 16px', borderBottom: '1px solid var(--border)', marginBottom: 8 }}>
        <div className="rajdhani" style={{ fontSize: 18, fontWeight: 800, background: 'linear-gradient(90deg,var(--gold),var(--teal))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>SnipeX AI</div>
        <div style={{ fontSize: 10, color: 'var(--text3)', letterSpacing: 2, marginTop: 2 }}>SAAS PORTAL</div>
      </div>
      {navItems.map(n => (
        <div key={n.id} className={`nav-item${active === n.id ? ' active' : ''}`} onClick={() => onNav(n.id)}>
          <span style={{ fontSize: 14 }}>{n.icon}</span>
          <span>{n.label}</span>
        </div>
      ))}
      <div style={{ flex: 1 }} />
      <div style={{ padding: '10px 14px', borderTop: '1px solid var(--border)', marginTop: 8 }}>
        <div className="label-gold" style={{ marginBottom: 6 }}>Portal</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--green)' }}>
          <span className="dot-live" /> SaaS Online
        </div>
      </div>
    </div>
  )
}

// ─── TOGGLE ──────────────────────────────────────────────────────────────────
function Toggle({ checked, onChange, gold }) {
  return (
    <label className={`toggle-switch${gold ? ' gold' : ''}`}>
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} />
      <span className="toggle-slider" />
    </label>
  )
}

// ─── CONFIDENCE METER ────────────────────────────────────────────────────────
function ConfidenceMeter({ label, value, color = 'var(--teal)' }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: 11, color: 'var(--text2)' }}>{label}</span>
        <span className="mono" style={{ fontSize: 11, color }}>{value}%</span>
      </div>
      <div className="confidence-bar-wrap">
        <div className="confidence-bar" style={{ width: `${value}%`, background: `linear-gradient(90deg,${color}88,${color})` }} />
      </div>
    </div>
  )
}

// ─── RING CHART ──────────────────────────────────────────────────────────────
function RingChart({ value, max = 100, size = 80, color = 'var(--teal)', label }) {
  const pct = value / max
  const r = (size - 12) / 2
  const circ = 2 * Math.PI * r
  const dash = circ * pct
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={6} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={6}
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 4px ${color})`, transition: 'stroke-dasharray 1s ease' }} />
        <text x={size/2} y={size/2} textAnchor="middle" dominantBaseline="central"
          style={{ transform: 'rotate(90deg)', transformOrigin: `${size/2}px ${size/2}px`, fill: 'var(--text)', fontSize: 14, fontWeight: 700, fontFamily: 'Rajdhani' }}>
          {value}%
        </text>
      </svg>
      {label && <span style={{ fontSize: 10, color: 'var(--text3)', letterSpacing: 1 }}>{label}</span>}
    </div>
  )
}

// ─── STAT CARD ───────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, color = 'var(--text)', glow, icon }) {
  return (
    <div className="glass-card" style={{ padding: '16px 18px', animation: 'fadeSlideIn 0.4s ease both' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div className="label-gold" style={{ marginBottom: 8 }}>{label}</div>
          <div className="rajdhani" style={{ fontSize: 26, fontWeight: 700, color, lineHeight: 1, ...(glow ? { textShadow: `0 0 12px ${color}` } : {}) }}>{value}</div>
          {sub && <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 6 }}>{sub}</div>}
        </div>
        {icon && <div style={{ fontSize: 24, opacity: 0.5 }}>{icon}</div>}
      </div>
    </div>
  )
}

// ─── PAIR ROW ────────────────────────────────────────────────────────────────
function PairRow({ sym, price, chg, signal, conf }) {
  const up = !chg.startsWith('-')
  const sigClass = signal === 'BUY' ? 'badge-buy' : signal === 'SELL' ? 'badge-sell' : 'badge-hold'
  return (
    <div className="pair-row">
      <div style={{ flex: 1 }}>
        <div className="rajdhani" style={{ fontWeight: 700, fontSize: 13, color: 'var(--text)' }}>{sym}</div>
        <div className="mono" style={{ fontSize: 10, color: 'var(--text3)' }}>{price}</div>
      </div>
      <div style={{ width: 70, textAlign: 'right' }}>
        <span className="mono" style={{ fontSize: 11, color: up ? 'var(--green)' : 'var(--red)' }}>{chg}</span>
      </div>
      <div style={{ width: 60, textAlign: 'center' }}>
        <span className={`badge ${sigClass}`}>{signal}</span>
      </div>
      <div style={{ width: 50, textAlign: 'right' }}>
        <span className="mono" style={{ fontSize: 11, color: 'var(--teal)' }}>{conf}%</span>
      </div>
    </div>
  )
}

// ─── SECTION: OVERVIEW ────────────────────────────────────────────────────────
function OverviewSection({ masterAI, setMasterAI, autoTrade, setAutoTrade }) {
  const pnlCards = [
    { label: 'Today P&L', value: '+$1,248.40', sub: '+3.12% from yesterday', color: 'var(--green)', icon: '↑' },
    { label: 'Open Positions', value: '7', sub: '4 BUY · 3 SELL', color: 'var(--gold)', icon: '⬡' },
    { label: 'Win Rate', value: '76.4%', sub: '128 of 167 trades', color: 'var(--teal)', icon: '◎' },
    { label: 'Weekly P&L', value: '+$6,840', sub: '+8.2% this week', color: 'var(--green)', icon: '↑' },
    { label: 'Drawdown', value: '-2.1%', sub: 'Max allowed: 5%', color: 'var(--red)', icon: '⬡' },
    { label: 'Equity', value: '$52,481', sub: 'Balance: $51,233', color: 'var(--text)', icon: '◈' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {/* Master Controls */}
      <div className="glass-card" style={{ padding: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
          <div>
            <div className="label-gold" style={{ marginBottom: 8 }}>Master AI Engine</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Toggle checked={masterAI} onChange={setMasterAI} gold />
              <span className="rajdhani" style={{ fontSize: 14, color: masterAI ? 'var(--gold)' : 'var(--text3)', fontWeight: 700 }}>
                {masterAI ? '● ONLINE' : '○ OFFLINE'}
              </span>
            </div>
          </div>
          <div style={{ width: 1, height: 40, background: 'var(--border)' }} />
          <div>
            <div className="label-teal" style={{ marginBottom: 8 }}>Auto Trade</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Toggle checked={autoTrade} onChange={setAutoTrade} />
              <span className="rajdhani" style={{ fontSize: 14, color: autoTrade ? 'var(--teal)' : 'var(--text3)', fontWeight: 700 }}>
                {autoTrade ? '● EXECUTING' : '○ PAUSED'}
              </span>
            </div>
          </div>
          <div style={{ width: 1, height: 40, background: 'var(--border)' }} />
          <div style={{ display: 'flex', gap: 24 }}>
            <RingChart value={82} color="var(--gold)" label="CONFLUENCE" />
            <RingChart value={76} color="var(--teal)" label="WIN RATE" />
            <RingChart value={91} color="var(--green)" label="SYSTEM" />
          </div>
          <div style={{ marginLeft: 'auto' }}>
            <div className="label-gold" style={{ marginBottom: 4 }}>Session</div>
            <LiveClock />
            <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>NEW YORK SESSION ACTIVE</div>
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }}>
        {pnlCards.map((c, i) => <StatCard key={i} {...c} />)}
      </div>

      {/* AI Engine Status + Confidence */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <div className="glass-card" style={{ padding: 18 }}>
          <div className="label-gold" style={{ marginBottom: 14 }}>AI Engine Layers</div>
          <ConfidenceMeter label="EMA 200 Trend" value={88} color="var(--gold)" />
          <ConfidenceMeter label="RSI Divergence" value={74} color="var(--teal)" />
          <ConfidenceMeter label="MACD Momentum" value={81} color="var(--blue)" />
          <ConfidenceMeter label="Order Block" value={92} color="var(--gold)" />
          <ConfidenceMeter label="Fair Value Gap" value={67} color="var(--purple)" />
          <ConfidenceMeter label="Market Structure" value={85} color="var(--teal)" />
          <ConfidenceMeter label="Session Bias" value={79} color="var(--green)" />
          <ConfidenceMeter label="Liquidity Grab" value={71} color="var(--red)" />
        </div>
        <div className="glass-card teal-card" style={{ padding: 18 }}>
          <div className="label-teal" style={{ marginBottom: 14 }}>Live News Events</div>
          {[
            { time: '14:30', event: 'US CPI Data Release', impact: 'HIGH', clr: 'var(--red)' },
            { time: '16:00', event: 'Fed Chair Speech', impact: 'HIGH', clr: 'var(--red)' },
            { time: '18:30', event: 'USD Initial Claims', impact: 'MED', clr: 'var(--gold)' },
            { time: '20:00', event: 'FOMC Minutes', impact: 'HIGH', clr: 'var(--red)' },
            { time: '22:00', event: 'AUD Employment', impact: 'MED', clr: 'var(--gold)' },
          ].map((ev, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
              <span className="mono" style={{ fontSize: 11, color: 'var(--text3)', width: 36 }}>{ev.time}</span>
              <span style={{ flex: 1, fontSize: 12, color: 'var(--text)' }}>{ev.event}</span>
              <span className="badge" style={{ background: `${ev.clr}18`, color: ev.clr, border: `1px solid ${ev.clr}44`, fontSize: 9 }}>{ev.impact}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── SECTION: SCANNER ────────────────────────────────────────────────────────
function ScannerSection() {
  const pairs = [
    { sym: 'XAUUSD', price: '2,341.50', chg: '+0.42%', signal: 'BUY',  conf: 92 },
    { sym: 'EURUSD', price: '1.08742',  chg: '+0.18%', signal: 'BUY',  conf: 78 },
    { sym: 'GBPUSD', price: '1.26881',  chg: '-0.09%', signal: 'SELL', conf: 71 },
    { sym: 'USDJPY', price: '154.320',  chg: '+0.31%', signal: 'BUY',  conf: 85 },
    { sym: 'BTCUSDT',price: '67,241',   chg: '+1.24%', signal: 'BUY',  conf: 88 },
    { sym: 'ETHUSDT',price: '3,512.8',  chg: '+0.87%', signal: 'HOLD', conf: 62 },
    { sym: 'AUDUSD', price: '0.65412',  chg: '-0.12%', signal: 'SELL', conf: 74 },
    { sym: 'USOIL',  price: '78.340',   chg: '-0.55%', signal: 'SELL', conf: 80 },
    { sym: 'USDCAD', price: '1.36540',  chg: '+0.08%', signal: 'HOLD', conf: 58 },
    { sym: 'NZDUSD', price: '0.59812',  chg: '-0.21%', signal: 'SELL', conf: 69 },
  ]
  return (
    <div className="glass-card" style={{ padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <div className="label-gold">Universal Market Scanner</div>
          <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 4 }}>ICT Confluence Engine · 9-Layer Analysis</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn-gold" style={{ fontSize: 11, padding: '6px 12px' }}>⟳ Refresh</button>
          <button className="btn-teal" style={{ fontSize: 11, padding: '6px 12px' }}>▸ Auto Scan</button>
        </div>
      </div>
      <div style={{ display: 'flex', padding: '0 0 6px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <span style={{ flex: 1, fontSize: 10, color: 'var(--text3)', letterSpacing: 1 }}>PAIR</span>
        <span style={{ width: 70, textAlign: 'right', fontSize: 10, color: 'var(--text3)', letterSpacing: 1 }}>CHANGE</span>
        <span style={{ width: 60, textAlign: 'center', fontSize: 10, color: 'var(--text3)', letterSpacing: 1 }}>SIGNAL</span>
        <span style={{ width: 50, textAlign: 'right', fontSize: 10, color: 'var(--text3)', letterSpacing: 1 }}>CONF</span>
      </div>
      {pairs.map((p, i) => <PairRow key={i} {...p} />)}
    </div>
  )
}

// ─── SECTION: GOLD ────────────────────────────────────────────────────────────
function GoldSection() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
        <StatCard label="XAUUSD Bid" value="2,341.40" color="var(--gold)" glow />
        <StatCard label="XAUUSD Ask" value="2,341.60" color="var(--gold)" />
        <StatCard label="Daily Range" value="$34.80" sub="2,308 – 2,343" color="var(--text)" />
        <StatCard label="Signal" value="STRONG BUY" color="var(--green)" glow />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 14 }}>
        <div className="glass-card" style={{ padding: 18 }}>
          <div className="label-gold" style={{ marginBottom: 14 }}>ICT Analysis – XAUUSD</div>
          {[
            { name: 'Order Block (H4)', status: 'BULLISH OB @ 2,318', active: true },
            { name: 'Fair Value Gap', status: 'FVG filled · watching 2,330', active: true },
            { name: 'Liquidity Grab', status: 'BSL swept @ 2,338.50', active: false },
            { name: 'Market Structure', status: 'BOS confirmed → Bullish', active: true },
            { name: 'Session Bias', status: 'NY Open → Buy bias', active: true },
            { name: 'Judas Swing', status: 'Asia low taken · reversed', active: false },
          ].map((r, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
              <span style={{ fontSize: 12, color: 'var(--text2)' }}>{r.name}</span>
              <span style={{ fontSize: 11, color: r.active ? 'var(--green)' : 'var(--text3)' }}>{r.status}</span>
            </div>
          ))}
        </div>
        <div className="glass-card" style={{ padding: 18 }}>
          <div className="label-gold" style={{ marginBottom: 14 }}>Gold Confidence</div>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
            <RingChart value={92} size={110} color="var(--gold)" label="OVERALL" />
          </div>
          <ConfidenceMeter label="Trend Align" value={95} color="var(--gold)" />
          <ConfidenceMeter label="Entry Timing" value={88} color="var(--teal)" />
          <ConfidenceMeter label="News Risk" value={60} color="var(--red)" />
          <div style={{ marginTop: 14 }}>
            <button className="btn-gold" style={{ width: '100%', padding: 12, fontSize: 14 }}>⚡ Place XAUUSD BUY</button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── SECTION: FOREX ───────────────────────────────────────────────────────────
function ForexSection() {
  const pairs = [
    { sym: 'EURUSD', price: '1.08742', bid: '1.08741', ask: '1.08743', chg: '+0.18%', signal: 'BUY',  conf: 78, spread: '0.2' },
    { sym: 'GBPUSD', price: '1.26881', bid: '1.26879', ask: '1.26883', chg: '-0.09%', signal: 'SELL', conf: 71, spread: '0.4' },
    { sym: 'USDJPY', price: '154.320', bid: '154.318', ask: '154.322', chg: '+0.31%', signal: 'BUY',  conf: 85, spread: '0.2' },
    { sym: 'AUDUSD', price: '0.65412', bid: '0.65411', ask: '0.65413', chg: '-0.12%', signal: 'SELL', conf: 74, spread: '0.3' },
    { sym: 'USDCAD', price: '1.36540', bid: '1.36539', ask: '1.36541', chg: '+0.08%', signal: 'HOLD', conf: 58, spread: '0.3' },
    { sym: 'NZDUSD', price: '0.59812', bid: '0.59811', ask: '0.59813', chg: '-0.21%', signal: 'SELL', conf: 69, spread: '0.4' },
    { sym: 'EURGBP', price: '0.85710', bid: '0.85709', ask: '0.85711', chg: '+0.06%', signal: 'HOLD', conf: 55, spread: '0.2' },
    { sym: 'EURJPY', price: '167.840', bid: '167.838', ask: '167.842', chg: '+0.28%', signal: 'BUY',  conf: 80, spread: '0.4' },
  ]
  return (
    <div className="glass-card" style={{ padding: 20 }}>
      <div className="label-gold" style={{ marginBottom: 16 }}>Forex Pairs – Live Analysis</div>
      <table>
        <thead>
          <tr>
            <th>Pair</th><th>Bid</th><th>Ask</th><th>Spread</th><th>Change</th><th>Signal</th><th>Confidence</th><th>Action</th>
          </tr>
        </thead>
        <tbody>
          {pairs.map((p, i) => (
            <tr key={i}>
              <td><span className="rajdhani" style={{ fontWeight: 700, fontSize: 13 }}>{p.sym}</span></td>
              <td className="mono" style={{ fontSize: 12 }}>{p.bid}</td>
              <td className="mono" style={{ fontSize: 12 }}>{p.ask}</td>
              <td className="mono" style={{ fontSize: 11, color: 'var(--text3)' }}>{p.spread}</td>
              <td className="mono" style={{ fontSize: 12, color: p.chg.startsWith('+') ? 'var(--green)' : 'var(--red)' }}>{p.chg}</td>
              <td><span className={`badge badge-${p.signal.toLowerCase()}`}>{p.signal}</span></td>
              <td>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div className="confidence-bar-wrap" style={{ width: 60 }}>
                    <div className="confidence-bar" style={{ width: `${p.conf}%`, background: 'var(--teal)' }} />
                  </div>
                  <span className="mono" style={{ fontSize: 10, color: 'var(--teal)' }}>{p.conf}%</span>
                </div>
              </td>
              <td>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button style={{ padding: '3px 8px', borderRadius: 5, border: '1px solid var(--green)', background: 'rgba(0,227,150,0.1)', color: 'var(--green)', fontSize: 10, cursor: 'pointer', fontFamily: 'Rajdhani', fontWeight: 700 }}>B</button>
                  <button style={{ padding: '3px 8px', borderRadius: 5, border: '1px solid var(--red)', background: 'rgba(255,69,96,0.1)', color: 'var(--red)', fontSize: 10, cursor: 'pointer', fontFamily: 'Rajdhani', fontWeight: 700 }}>S</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ─── SECTION: CRYPTO ──────────────────────────────────────────────────────────
function CryptoSection() {
  const coins = [
    { sym: 'BTCUSDT', price: '67,241',   chg: '+1.24%', signal: 'BUY',  conf: 88, vol: '42.1B', mc: '1.32T' },
    { sym: 'ETHUSDT', price: '3,512.8',  chg: '+0.87%', signal: 'HOLD', conf: 62, vol: '18.4B', mc: '421B' },
    { sym: 'SOLUSDT', price: '178.40',   chg: '+2.41%', signal: 'BUY',  conf: 84, vol: '4.2B',  mc: '82B'  },
    { sym: 'BNBUSDT', price: '562.30',   chg: '-0.32%', signal: 'HOLD', conf: 55, vol: '1.8B',  mc: '84B'  },
    { sym: 'XRPUSDT', price: '0.5812',   chg: '+0.61%', signal: 'BUY',  conf: 73, vol: '2.4B',  mc: '31B'  },
  ]
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
        <StatCard label="BTC Dominance" value="52.4%" color="var(--gold)" />
        <StatCard label="Crypto Total MC" value="$2.41T" color="var(--teal)" />
        <StatCard label="Fear & Greed" value="72 – Greed" color="var(--green)" />
      </div>
      <div className="glass-card" style={{ padding: 20 }}>
        <div className="label-gold" style={{ marginBottom: 16 }}>Crypto Pairs – ICT Engine</div>
        <table>
          <thead><tr><th>Coin</th><th>Price</th><th>Change</th><th>Volume</th><th>Market Cap</th><th>Signal</th><th>Confidence</th></tr></thead>
          <tbody>
            {coins.map((c, i) => (
              <tr key={i}>
                <td><span className="rajdhani" style={{ fontWeight: 700, fontSize: 13 }}>{c.sym}</span></td>
                <td className="mono" style={{ fontSize: 12 }}>${c.price}</td>
                <td className="mono" style={{ fontSize: 12, color: c.chg.startsWith('+') ? 'var(--green)' : 'var(--red)' }}>{c.chg}</td>
                <td className="mono" style={{ fontSize: 11, color: 'var(--text2)' }}>{c.vol}</td>
                <td className="mono" style={{ fontSize: 11, color: 'var(--text2)' }}>{c.mc}</td>
                <td><span className={`badge badge-${c.signal.toLowerCase()}`}>{c.signal}</span></td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div className="confidence-bar-wrap" style={{ width: 60 }}>
                      <div className="confidence-bar" style={{ width: `${c.conf}%`, background: 'linear-gradient(90deg,var(--purple)88,var(--purple))' }} />
                    </div>
                    <span className="mono" style={{ fontSize: 10, color: 'var(--purple)' }}>{c.conf}%</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── SECTION: AUTO TRADE ──────────────────────────────────────────────────────
function AutoTradeSection({ autoTrade, setAutoTrade }) {
  const [lotSize, setLotSize] = useState('0.10')
  const [slPts, setSlPts] = useState('150')
  const [tpPts, setTpPts] = useState('300')
  const [maxTrades, setMaxTrades] = useState('5')
  const [trailSL, setTrailSL] = useState(true)
  const [barLock, setBarLock] = useState(true)

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
      <div className="glass-card" style={{ padding: 20 }}>
        <div className="label-gold" style={{ marginBottom: 16 }}>Auto Trade Engine</div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div>
            <div className="rajdhani" style={{ fontWeight: 700, fontSize: 15 }}>Auto Trade</div>
            <div style={{ fontSize: 11, color: 'var(--text3)' }}>Execute signals automatically via MT5</div>
          </div>
          <Toggle checked={autoTrade} onChange={setAutoTrade} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div>
            <div className="rajdhani" style={{ fontWeight: 700, fontSize: 15 }}>Trailing Stop Loss</div>
            <div style={{ fontSize: 11, color: 'var(--text3)' }}>Dynamic ATR-based trailing SL</div>
          </div>
          <Toggle checked={trailSL} onChange={setTrailSL} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0' }}>
          <div>
            <div className="rajdhani" style={{ fontWeight: 700, fontSize: 15 }}>Bar-Lock Auto Trade</div>
            <div style={{ fontSize: 11, color: 'var(--text3)' }}>Lock trade at candle close</div>
          </div>
          <Toggle checked={barLock} onChange={setBarLock} gold />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 4 }}>
          {[
            { label: 'Lot Size', val: lotSize, set: setLotSize },
            { label: 'Max Trades', val: maxTrades, set: setMaxTrades },
            { label: 'SL (Points)', val: slPts, set: setSlPts },
            { label: 'TP (Points)', val: tpPts, set: setTpPts },
          ].map((f, i) => (
            <div key={i}>
              <div className="label-gold" style={{ marginBottom: 4 }}>{f.label}</div>
              <input value={f.val} onChange={e => f.set(e.target.value)}
                style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'rgba(0,0,0,0.3)', color: 'var(--text)', fontSize: 13, outline: 'none', fontFamily: 'Share Tech Mono' }} />
            </div>
          ))}
        </div>
        <button className="btn-gold" style={{ width: '100%', padding: 12, marginTop: 14, fontSize: 14 }}>💾 Save Configuration</button>
      </div>

      <div className="glass-card teal-card" style={{ padding: 20 }}>
        <div className="label-teal" style={{ marginBottom: 16 }}>Strategy Presets</div>
        {[
          { name: 'ICT Scalper Pro', desc: 'M5/M15 · OB + FVG · London/NY', active: true },
          { name: 'Gold Sniper', desc: 'H1 · XAUUSD only · Session bias', active: false },
          { name: 'Swing Trader', desc: 'H4/D1 · MSS + OB · Multi-pair', active: false },
          { name: 'News Avoidance', desc: 'Pauses 30min before high-impact', active: true },
          { name: 'Equity Guardian', desc: 'Auto-halt at 3% daily drawdown', active: true },
        ].map((s, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
            <div>
              <div className="rajdhani" style={{ fontWeight: 600, fontSize: 13, color: s.active ? 'var(--teal)' : 'var(--text2)' }}>{s.name}</div>
              <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 2 }}>{s.desc}</div>
            </div>
            <span className={`badge ${s.active ? 'badge-active' : ''}`} style={!s.active ? { background: 'rgba(100,116,139,0.15)', color: 'var(--text3)', border: '1px solid rgba(100,116,139,0.3)' } : {}}>
              {s.active ? 'ACTIVE' : 'OFF'}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── SECTION: RISK ────────────────────────────────────────────────────────────
function RiskSection() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
        <StatCard label="Account Balance" value="$51,233" color="var(--text)" />
        <StatCard label="Used Margin" value="$3,214" sub="6.3% of balance" color="var(--gold)" />
        <StatCard label="Free Margin" value="$48,019" color="var(--green)" />
        <StatCard label="Margin Level" value="1,594%" color="var(--teal)" />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <div className="glass-card" style={{ padding: 20 }}>
          <div className="label-gold" style={{ marginBottom: 14 }}>Risk Limits</div>
          {[
            { label: 'Daily Loss Limit', current: '-$241', limit: '-$1,024', pct: 23 },
            { label: 'Max Drawdown', current: '-2.1%', limit: '-5.0%', pct: 42 },
            { label: 'Max Lot Per Trade', current: '0.10', limit: '0.50', pct: 20 },
            { label: 'Open Position Limit', current: '7', limit: '10', pct: 70 },
          ].map((r, i) => (
            <div key={i} style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 12, color: 'var(--text2)' }}>{r.label}</span>
                <span className="mono" style={{ fontSize: 11, color: 'var(--text3)' }}>{r.current} / {r.limit}</span>
              </div>
              <div className="confidence-bar-wrap">
                <div className="confidence-bar" style={{ width: `${r.pct}%`, background: r.pct > 75 ? 'var(--red)' : r.pct > 50 ? 'var(--gold)' : 'var(--green)' }} />
              </div>
            </div>
          ))}
        </div>
        <div className="glass-card teal-card" style={{ padding: 20 }}>
          <div className="label-teal" style={{ marginBottom: 14 }}>Open Positions</div>
          <table>
            <thead><tr><th>Pair</th><th>Dir</th><th>Lots</th><th>P&L</th></tr></thead>
            <tbody>
              {[
                { pair: 'XAUUSD', dir: 'BUY',  lots: '0.10', pnl: '+$248.40', pos: true },
                { pair: 'EURUSD', dir: 'BUY',  lots: '0.05', pnl: '+$31.20',  pos: true },
                { pair: 'GBPUSD', dir: 'SELL', lots: '0.05', pnl: '-$12.80',  pos: false },
                { pair: 'BTCUSD', dir: 'BUY',  lots: '0.01', pnl: '+$84.10',  pos: true },
                { pair: 'USDJPY', dir: 'BUY',  lots: '0.10', pnl: '+$62.40',  pos: true },
              ].map((p, i) => (
                <tr key={i}>
                  <td className="rajdhani" style={{ fontWeight: 700 }}>{p.pair}</td>
                  <td><span className={`badge badge-${p.dir.toLowerCase()}`}>{p.dir}</span></td>
                  <td className="mono" style={{ fontSize: 12 }}>{p.lots}</td>
                  <td className="mono" style={{ fontSize: 12, color: p.pos ? 'var(--green)' : 'var(--red)' }}>{p.pnl}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ─── SECTION: HISTORY ────────────────────────────────────────────────────────
function HistorySection() {
  const trades = [
    { id: '#1082', pair: 'XAUUSD', dir: 'BUY',  open: '2,318.40', close: '2,341.50', lots: '0.10', pnl: '+$231.10', dur: '3h 12m', result: 'WIN' },
    { id: '#1081', pair: 'EURUSD', dir: 'SELL', open: '1.08950', close: '1.08742', lots: '0.05', pnl: '+$10.40',  dur: '1h 44m', result: 'WIN' },
    { id: '#1080', pair: 'GBPUSD', dir: 'BUY',  open: '1.27100', close: '1.26881', lots: '0.10', pnl: '-$21.90',  dur: '2h 08m', result: 'LOSS' },
    { id: '#1079', pair: 'BTCUSD', dir: 'BUY',  open: '65,800',  close: '67,241',  lots: '0.01', pnl: '+$144.10', dur: '5h 30m', result: 'WIN' },
    { id: '#1078', pair: 'USDJPY', dir: 'SELL', open: '155.100', close: '154.320', lots: '0.10', pnl: '+$50.80',  dur: '4h 15m', result: 'WIN' },
    { id: '#1077', pair: 'USOIL',  dir: 'SELL', open: '79.120',  close: '78.340',  lots: '0.10', pnl: '+$78.00',  dur: '2h 55m', result: 'WIN' },
    { id: '#1076', pair: 'XAUUSD', dir: 'SELL', open: '2,330.00', close: '2,334.20', lots: '0.10', pnl: '-$42.00',  dur: '0h 38m', result: 'LOSS' },
  ]
  return (
    <div className="glass-card" style={{ padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div className="label-gold">Trade History</div>
        <div style={{ display: 'flex', gap: 8 }}>
          {['Today', 'Week', 'Month', 'All'].map(f => (
            <button key={f} style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid var(--border)', background: f === 'Today' ? 'rgba(240,192,64,0.15)' : 'transparent', color: f === 'Today' ? 'var(--gold)' : 'var(--text3)', fontSize: 11, cursor: 'pointer', fontFamily: 'Rajdhani', fontWeight: 600 }}>{f}</button>
          ))}
        </div>
      </div>
      <table>
        <thead><tr><th>ID</th><th>Pair</th><th>Dir</th><th>Open</th><th>Close</th><th>Lots</th><th>Duration</th><th>P&L</th><th>Result</th></tr></thead>
        <tbody>
          {trades.map((t, i) => (
            <tr key={i}>
              <td className="mono" style={{ fontSize: 11, color: 'var(--text3)' }}>{t.id}</td>
              <td><span className="rajdhani" style={{ fontWeight: 700, fontSize: 13 }}>{t.pair}</span></td>
              <td><span className={`badge badge-${t.dir.toLowerCase()}`}>{t.dir}</span></td>
              <td className="mono" style={{ fontSize: 11 }}>{t.open}</td>
              <td className="mono" style={{ fontSize: 11 }}>{t.close}</td>
              <td className="mono" style={{ fontSize: 11 }}>{t.lots}</td>
              <td style={{ fontSize: 11, color: 'var(--text3)' }}>{t.dur}</td>
              <td className="mono" style={{ fontSize: 12, fontWeight: 700, color: t.pnl.startsWith('+') ? 'var(--green)' : 'var(--red)' }}>{t.pnl}</td>
              <td><span className={`badge ${t.result === 'WIN' ? 'badge-buy' : 'badge-sell'}`}>{t.result}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ─── SECTION: LOGS ────────────────────────────────────────────────────────────
function LogsSection() {
  const logs = [
    { type: 'buy',  time: '14:32:11', msg: 'ORDER PLACED · XAUUSD BUY 0.10 @ 2,341.50 · SL:2,318.00 TP:2,388.00' },
    { type: 'sys',  time: '14:31:58', msg: 'SIGNAL CONFIRMED · XAUUSD · Confluence 92% · ICT OB+FVG+MSS aligned' },
    { type: 'sys',  time: '14:30:45', msg: 'NY SESSION OPEN · Bias: BULLISH · Expected range: 2,308–2,348' },
    { type: 'sell', time: '14:28:30', msg: 'ORDER CLOSED · GBPUSD SELL 0.05 @ 1.26881 · PNL: +$10.40' },
    { type: 'sys',  time: '14:25:12', msg: 'AI ENGINE · 9-layer scan complete · 3 BUY signals · 1 SELL signal' },
    { type: 'buy',  time: '14:18:04', msg: 'ORDER PLACED · EURUSD BUY 0.05 @ 1.08742 · SL:1.08500 TP:1.09100' },
    { type: 'sys',  time: '14:15:00', msg: 'NEWS EVENT · USD CPI @ 14:30 · Auto-pause activated for 15min' },
    { type: 'sell', time: '14:12:39', msg: 'TRAILING SL MOVED · USDJPY · New SL: 153.980 (ATR: 0.340)' },
    { type: 'sys',  time: '14:08:21', msg: 'EQUITY CHECK · Balance: $51,233 · Drawdown: -2.1% · Within limits' },
    { type: 'buy',  time: '14:02:55', msg: 'ORDER PLACED · BTCUSDT BUY 0.01 @ 67,241 · SL:65,800 TP:69,400' },
  ]
  return (
    <div className="glass-card" style={{ padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div className="label-gold">Execution Logs</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="dot-live" />
          <span style={{ fontSize: 11, color: 'var(--green)' }}>LIVE</span>
        </div>
      </div>
      <div style={{ maxHeight: 380, overflowY: 'auto' }}>
        {logs.map((l, i) => (
          <div key={i} className={`exec-log-item exec-${l.type}`}>
            <span style={{ color: 'var(--text3)', marginRight: 10 }}>[{l.time}]</span>
            <span style={{ color: l.type === 'buy' ? 'var(--green)' : l.type === 'sell' ? 'var(--red)' : 'var(--text2)' }}>{l.msg}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── SECTION: STRATEGY ───────────────────────────────────────────────────────
function StrategySection() {
  const strategies = [
    { name: 'ICT Scalper Pro', tf: 'M5/M15', pairs: '8 pairs', status: 'ACTIVE', pnl: '+$1,248', wr: '78%', trades: 42 },
    { name: 'Gold Sniper',     tf: 'H1',     pairs: 'XAUUSD', status: 'ACTIVE', pnl: '+$840',   wr: '82%', trades: 18 },
    { name: 'Swing Master',    tf: 'H4',     pairs: '5 pairs', status: 'PAUSED', pnl: '+$320',  wr: '71%', trades: 7  },
    { name: 'Crypto ICT',      tf: 'H1/H4',  pairs: 'BTC/ETH', status: 'ACTIVE', pnl: '+$512', wr: '75%', trades: 12 },
  ]
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 14 }}>
        {strategies.map((s, i) => (
          <div key={i} className={`glass-card${s.status === 'ACTIVE' ? '' : ' teal-card'}`} style={{ padding: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <div>
                <div className="rajdhani" style={{ fontWeight: 700, fontSize: 16, color: 'var(--text)' }}>{s.name}</div>
                <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{s.tf} · {s.pairs}</div>
              </div>
              <span className={`badge ${s.status === 'ACTIVE' ? 'badge-active' : 'badge-hold'}`}>{s.status}</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
              <div>
                <div className="label-gold" style={{ fontSize: 9 }}>P&L</div>
                <div className="mono" style={{ fontSize: 14, color: 'var(--green)', marginTop: 4 }}>{s.pnl}</div>
              </div>
              <div>
                <div className="label-gold" style={{ fontSize: 9 }}>WIN RATE</div>
                <div className="mono" style={{ fontSize: 14, color: 'var(--teal)', marginTop: 4 }}>{s.wr}</div>
              </div>
              <div>
                <div className="label-gold" style={{ fontSize: 9 }}>TRADES</div>
                <div className="mono" style={{ fontSize: 14, color: 'var(--text)', marginTop: 4 }}>{s.trades}</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button className="btn-teal" style={{ flex: 1, fontSize: 11, padding: '6px 0' }}>{s.status === 'ACTIVE' ? '⏸ Pause' : '▸ Start'}</button>
              <button style={{ flex: 1, padding: '6px 0', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text2)', fontSize: 11, cursor: 'pointer', fontFamily: 'Rajdhani', fontWeight: 600 }}>⚙ Config</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}



// ─── SECTION: ADMIN PANEL ───────────────────────────────────────────────────
function AdminPanelSection() {
  const [adminSecret, setAdminSecret] = useState(localStorage.getItem('snx_admin_secret') || 'SnipeXAdminControl2026')
  const [stats, setStats] = useState(null)
  const [users, setUsers] = useState([])
  const [licenses, setLicenses] = useState([])
  const [payments, setPayments] = useState([])
  const [manualQrPayments, setManualQrPayments] = useState([])
  const [message, setMessage] = useState('Admin panel ready. Load data to sync backend.')
  const [loading, setLoading] = useState(false)
  const [newEmail, setNewEmail] = useState('')
  const [newPlan, setNewPlan] = useState('PRO')
  const [changeEmail, setChangeEmail] = useState('')
  const [changePlan, setChangePlan] = useState('PRO')

  const adminHeaders = () => ({
    'Content-Type': 'application/json',
    'X-Admin-Secret': adminSecret.trim()
  })

  async function adminFetch(path, options = {}) {
    const res = await fetch(`${BACKEND_URL}${path}`, {
      ...options,
      headers: { ...adminHeaders(), ...(options.headers || {}) }
    })
    const text = await res.text()
    let data = {}
    try { data = text ? JSON.parse(text) : {} } catch { data = { ok: false, message: text } }
    if (!res.ok) throw new Error(data.detail || data.message || `HTTP ${res.status}`)
    return data
  }


  async function loadManualQrPayments() {
    const { data, error } = await supabase.from('manual_qr_payments').select('*').order('created_at', { ascending: false }).limit(100)
    if (error) { console.warn('manual_qr_payments load failed:', error); return }
    setManualQrPayments(data || [])
  }

  async function setManualPaymentStatus(row, status) {
    try {
      setLoading(true)
      setMessage(`${status} manual payment for ${row.email}...`)
      const { error } = await supabase.from('manual_qr_payments').update({ status }).eq('id', row.id)
      if (error) throw error
      if (status === 'approved') {
        setNewEmail(row.email || '')
        setNewPlan(row.plan || 'PRO')
      }
      await loadManualQrPayments()
      setMessage(`Manual payment ${status}. ${status === 'approved' ? 'Now create/activate license from Create License panel.' : ''}`)
    } catch (err) {
      setMessage(`Manual payment update failed: ${err.message}`)
    } finally { setLoading(false) }
  }

  async function openManualProof(row) {
    try {
      if (row.screenshot_url) { window.open(row.screenshot_url, '_blank'); return }
      if (!row.screenshot_path) { setMessage('No screenshot path available.'); return }
      const { data, error } = await supabase.storage.from('payment-proofs').createSignedUrl(row.screenshot_path, 60 * 15)
      if (error) throw error
      window.open(data.signedUrl, '_blank')
    } catch (err) { setMessage(`Open proof failed: ${err.message}`) }
  }

  async function loadAdminData() {
    try {
      setLoading(true)
      localStorage.setItem('snx_admin_secret', adminSecret.trim())
      setMessage('Loading admin data...')
      const [statsData, usersData, licensesData, paymentsData] = await Promise.all([
        adminFetch('/admin/stats'),
        adminFetch('/admin/users'),
        adminFetch('/admin/licenses'),
        adminFetch('/admin/payments')
      ])
      setStats(statsData)
      setUsers(usersData.users || [])
      setLicenses(licensesData.licenses || [])
      setPayments(paymentsData.payments || [])
      await loadManualQrPayments()
      setMessage('Admin data synced successfully.')
    } catch (err) {
      console.error(err)
      setMessage(`Admin sync failed: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadAdminData(); loadManualQrPayments() }, [])

  async function createLicense() {
    try {
      setLoading(true)
      setMessage('Creating license...')
      const data = await adminFetch('/admin/create-license', {
        method: 'POST',
        body: JSON.stringify({ email: newEmail.trim(), plan: newPlan, status: 'active', days: 30 })
      })
      setMessage(`License created: ${data.license?.license_key || 'OK'}`)
      setNewEmail('')
      await loadAdminData()
    } catch (err) {
      setMessage(`Create license failed: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  async function updatePlan() {
    if (!changeEmail.trim()) { setMessage('Enter user email first.'); return }
    try {
      setLoading(true)
      setMessage('Updating plan...')
      await adminFetch('/admin/change-plan', {
        method: 'POST',
        body: JSON.stringify({ email: changeEmail.trim(), plan: changePlan, status: 'active' })
      })
      setMessage(`Plan updated for ${changeEmail.trim()} to ${changePlan}.`)
      await loadAdminData()
    } catch (err) {
      setMessage(`Plan update failed: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  async function setLicenseStatus(licenseKey, status) {
    try {
      setLoading(true)
      setMessage(`${status} license ${licenseKey}...`)
      await adminFetch('/admin/license-status', {
        method: 'POST',
        body: JSON.stringify({ license_key: licenseKey, status })
      })
      await loadAdminData()
      setMessage(`License ${licenseKey} set to ${status}.`)
    } catch (err) {
      setMessage(`License status failed: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  async function resetDevice(licenseKey) {
    try {
      setLoading(true)
      setMessage(`Resetting device binding for ${licenseKey}...`)
      await adminFetch('/admin/reset-device', {
        method: 'POST',
        body: JSON.stringify({ license_key: licenseKey })
      })
      await loadAdminData()
      setMessage(`Device binding reset for ${licenseKey}.`)
    } catch (err) {
      setMessage(`Reset device failed: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }


  async function extendLicense(licenseKey, days = 30) {
    try {
      setLoading(true)
      setMessage(`Extending ${licenseKey} by ${days} days...`)
      await adminFetch('/admin/extend-license', {
        method: 'POST',
        body: JSON.stringify({ license_key: licenseKey, days })
      })
      await loadAdminData()
      setMessage(`License ${licenseKey} extended by ${days} days.`)
    } catch (err) {
      setMessage(`Extend license failed: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  async function revokeLicense(licenseKey) {
    try {
      setLoading(true)
      setMessage(`Revoking ${licenseKey}...`)
      await adminFetch('/admin/revoke-license', {
        method: 'POST',
        body: JSON.stringify({ license_key: licenseKey })
      })
      await loadAdminData()
      setMessage(`License ${licenseKey} revoked.`)
    } catch (err) {
      setMessage(`Revoke license failed: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const statCards = [
    ['USERS', stats?.users ?? '—', 'var(--gold)'],
    ['LICENSES', stats?.licenses ?? '—', 'var(--teal)'],
    ['ACTIVE LICENSES', stats?.active_licenses ?? '—', 'var(--green)'],
    ['EXPIRED', stats?.expired_licenses ?? '—', 'var(--purple)']
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div className="glass-card" style={{ padding: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
          <div>
            <div className="label-gold">Secure Admin Control</div>
            <div className="rajdhani" style={{ fontSize: 22, fontWeight: 800, marginTop: 4 }}>SnipeX SaaS Admin Panel</div>
            <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 3 }}>Users, licenses, plans, payments and device binding control.</div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <input value={adminSecret} onChange={e => setAdminSecret(e.target.value)} placeholder="Admin Secret" type="password"
              style={{ minWidth: 260, padding: 10, borderRadius: 8, border: '1px solid var(--border)', background: 'rgba(0,0,0,0.28)', color: 'var(--text)', outline: 'none', fontFamily: 'Share Tech Mono' }} />
            <button className="btn-gold" onClick={loadAdminData} disabled={loading}>{loading ? 'SYNCING...' : '↻ Sync Admin'}</button>
          </div>
        </div>
        <div style={{ marginTop: 12, padding: 10, borderRadius: 8, border: '1px solid rgba(0,212,170,0.18)', background: 'rgba(0,212,170,0.06)', color: message.includes('failed') ? 'var(--red)' : 'var(--teal)', fontSize: 12 }}>
          {message}
        </div>
      </div>


      <div className="glass-card gold-card" style={{ padding: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, gap: 10, flexWrap: 'wrap' }}>
          <div>
            <div className="label-gold">Manual QR Payment Approvals</div>
            <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>View proof screenshots and approve/reject buyer payments.</div>
          </div>
          <button className="btn-teal" onClick={loadManualQrPayments}>↻ Refresh QR Payments</button>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table>
            <thead><tr><th>Email</th><th>Mobile</th><th>Plan</th><th>Amount</th><th>UTR</th><th>Status</th><th>Proof</th><th>Action</th></tr></thead>
            <tbody>
              {manualQrPayments.map(row => (
                <tr key={row.id}>
                  <td>{row.email || '—'}</td>
                  <td>{row.mobile || '—'}</td>
                  <td><span className="badge badge-active">{row.plan || '—'}</span></td>
                  <td>₹{row.amount || '—'}</td>
                  <td className="mono">{row.utr || '—'}</td>
                  <td><span className={row.status === 'approved' ? 'badge badge-active' : row.status === 'rejected' ? 'badge badge-expired' : 'badge badge-warn'}>{row.status || 'pending'}</span></td>
                  <td><button className="btn-teal" onClick={() => openManualProof(row)}>View Proof</button></td>
                  <td style={{ display: 'flex', gap: 6 }}>
                    <button className="btn-gold" onClick={() => setManualPaymentStatus(row, 'approved')} disabled={loading}>Approve</button>
                    <button className="btn-red" onClick={() => setManualPaymentStatus(row, 'rejected')} disabled={loading}>Reject</button>
                  </td>
                </tr>
              ))}
              {!manualQrPayments.length && <tr><td colSpan="8" style={{ color: 'var(--text3)' }}>No manual QR payment submissions found.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(150px, 1fr))', gap: 12 }}>
        {statCards.map(([label, value, color]) => (
          <div key={label} className="glass-card" style={{ padding: 16 }}>
            <div className="label-gold" style={{ fontSize: 9 }}>{label}</div>
            <div className="mono" style={{ color, fontSize: 26, marginTop: 8 }}>{value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <div className="glass-card" style={{ padding: 16 }}>
          <div className="label-teal">Create License</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px auto', gap: 8, marginTop: 12 }}>
            <input value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="buyer@email.com"
              style={{ padding: 10, borderRadius: 8, border: '1px solid var(--border)', background: 'rgba(0,0,0,0.28)', color: 'var(--text)', outline: 'none' }} />
            <select value={newPlan} onChange={e => setNewPlan(e.target.value)} style={{ padding: 10, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg2)', color: 'var(--text)' }}>
              <option>FREE</option><option>BASIC</option><option>PRO</option><option>ELITE</option><option>VIP</option>
            </select>
            <button className="btn-teal" onClick={createLicense} disabled={loading}>Create</button>
          </div>
        </div>
        <div className="glass-card" style={{ padding: 16 }}>
          <div className="label-gold">Change User Plan</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px auto', gap: 8, marginTop: 12 }}>
            <input value={changeEmail} onChange={e => setChangeEmail(e.target.value)} placeholder="user@email.com"
              style={{ padding: 10, borderRadius: 8, border: '1px solid var(--border)', background: 'rgba(0,0,0,0.28)', color: 'var(--text)', outline: 'none' }} />
            <select value={changePlan} onChange={e => setChangePlan(e.target.value)} style={{ padding: 10, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg2)', color: 'var(--text)' }}>
              <option>FREE</option><option>BASIC</option><option>PRO</option><option>ELITE</option><option>VIP</option>
            </select>
            <button className="btn-gold" onClick={updatePlan} disabled={loading}>Update</button>
          </div>
        </div>
      </div>

      <div className="glass-card" style={{ padding: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <div><div className="label-gold">Users</div><div style={{ fontSize: 11, color: 'var(--text3)' }}>Live from Supabase via secured backend</div></div>
          <span className="badge badge-active">{users.length} rows</span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table>
            <thead><tr><th>Email</th><th>Name</th><th>Plan</th><th>Status</th><th>Created</th></tr></thead>
            <tbody>
              {users.map((u, i) => (
                <tr key={u.id || u.email || i}>
                  <td className="mono">{u.email || '—'}</td>
                  <td>{u.name || u.full_name || '—'}</td>
                  <td><span className="badge badge-active">{u.plan || 'FREE'}</span></td>
                  <td>{u.status || '—'}</td>
                  <td className="mono">{(u.created_at || '').slice(0, 19).replace('T', ' ') || '—'}</td>
                </tr>
              ))}
              {!users.length && <tr><td colSpan="5" style={{ color: 'var(--text3)' }}>No users loaded.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <div className="glass-card" style={{ padding: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <div><div className="label-teal">Licenses</div><div style={{ fontSize: 11, color: 'var(--text3)' }}>Activate, deactivate and reset device binding</div></div>
          <span className="badge badge-active">{licenses.length} rows</span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table>
            <thead><tr><th>License Key</th><th>Email</th><th>Plan</th><th>Status</th><th>Expiry</th><th>Bound</th><th>Actions</th></tr></thead>
            <tbody>
              {licenses.map((l, i) => {
                const key = l.license_key || l.key || ''
                const active = String(l.status || '').toLowerCase() === 'active'
                return (
                  <tr key={l.id || key || i}>
                    <td className="mono" style={{ color: 'var(--gold)' }}>{key || '—'}</td>
                    <td>{l.email || l.bound_email || l.used_by || '—'}</td>
                    <td><span className="badge badge-active">{l.plan || 'PRO'}</span></td>
                    <td><span className={`badge ${active ? 'badge-buy' : 'badge-sell'}`}>{l.status || '—'}</span></td>
                    <td className="mono">{(l.expires_at || '').slice(0, 10) || '—'}</td>
                    <td className="mono">{l.device_id ? 'DEVICE LOCKED' : (l.bound_email || l.used_by ? 'EMAIL BOUND' : 'FREE')}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        <button onClick={() => setLicenseStatus(key, active ? 'inactive' : 'active')} disabled={!key || loading} style={{ padding: '5px 8px', borderRadius: 6, border: '1px solid var(--border)', background: 'transparent', color: active ? 'var(--red)' : 'var(--green)', cursor: 'pointer', fontSize: 11 }}>{active ? 'Deactivate' : 'Activate'}</button>
                        <button onClick={() => resetDevice(key)} disabled={!key || loading} style={{ padding: '5px 8px', borderRadius: 6, border: '1px solid var(--border2)', background: 'transparent', color: 'var(--teal)', cursor: 'pointer', fontSize: 11 }}>Reset Device</button>
                        <button onClick={() => extendLicense(key, 30)} disabled={!key || loading} style={{ padding: '5px 8px', borderRadius: 6, border: '1px solid var(--border2)', background: 'transparent', color: 'var(--gold)', cursor: 'pointer', fontSize: 11 }}>+30 Days</button>
                        <button onClick={() => revokeLicense(key)} disabled={!key || loading} style={{ padding: '5px 8px', borderRadius: 6, border: '1px solid var(--border2)', background: 'transparent', color: 'var(--red)', cursor: 'pointer', fontSize: 11 }}>Revoke</button>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {!licenses.length && <tr><td colSpan="7" style={{ color: 'var(--text3)' }}>No licenses loaded.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <div className="glass-card teal-card" style={{ padding: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <div><div className="label-teal">Payments / Activations</div><div style={{ fontSize: 11, color: 'var(--text3)' }}>Current backend maps payment history to activations table</div></div>
          <span className="badge badge-active">{payments.length} rows</span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table>
            <thead><tr><th>Email</th><th>Plan</th><th>Status</th><th>Payment ID</th><th>Order ID</th></tr></thead>
            <tbody>
              {payments.map((p, i) => (
                <tr key={p.id || i}>
                  <td>{p.email || '—'}</td>
                  <td>{p.plan || '—'}</td>
                  <td>{p.status || '—'}</td>
                  <td className="mono">{p.razorpay_payment_id || '—'}</td>
                  <td className="mono">{p.razorpay_order_id || '—'}</td>
                </tr>
              ))}
              {!payments.length && <tr><td colSpan="5" style={{ color: 'var(--text3)' }}>No payments/activations loaded.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}


// ─── SECTION: BUYER PORTAL ──────────────────────────────────────────────────
function BuyerPortalSection({ user }) {
  const buyerEmail = user?.email || localStorage.getItem('snx_license_email') || ''
  const savedPlan = localStorage.getItem('snx_plan') || 'FREE'
  const savedLicense = localStorage.getItem('snx_license') || ''
  const [email, setEmail] = useState(buyerEmail)
  const [licenseKey, setLicenseKey] = useState(savedLicense)
  const [buyerPlan, setBuyerPlan] = useState(savedPlan)
  const [subscriptionStatus, setSubscriptionStatus] = useState(localStorage.getItem('snx_license_validated') === 'true' ? 'active' : 'inactive')
  const [deviceStatus, setDeviceStatus] = useState('checking')
  const [paymentHistory, setPaymentHistory] = useState([])
  const [activatedAt, setActivatedAt] = useState(localStorage.getItem('snx_license_activated_at') || '')
  const [expiresAt, setExpiresAt] = useState(localStorage.getItem('snx_license_expires_at') || '')
  const [message, setMessage] = useState('Buyer portal ready. Sync your plan, license and upgrade flow.')
  const [loading, setLoading] = useState(false)
  const [manualPlan, setManualPlan] = useState('PRO')
  const [manualAmount, setManualAmount] = useState(5999)
  const [manualUtr, setManualUtr] = useState('')
  const [manualProof, setManualProof] = useState(null)
  const [manualMobile, setManualMobile] = useState('')

  async function buyerFetch(path, options = {}) {
    const res = await fetch(`${BACKEND_URL}${path}`, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...(options.headers || {}) }
    })
    const text = await res.text()
    let data = {}
    try { data = text ? JSON.parse(text) : {} } catch { data = { ok: false, message: text } }
    if (!res.ok) throw new Error(data.detail || data.message || `HTTP ${res.status}`)
    return data
  }

  function saveActivationStamp() {
    const stamp = localStorage.getItem('snx_license_activated_at') || new Date().toLocaleString()
    localStorage.setItem('snx_license_activated_at', stamp)
    setActivatedAt(stamp)
  }

  async function copyLicense() {
    if (!licenseKey) { setMessage('No license key available yet. Buy or sync a plan first.'); return }
    try {
      await navigator.clipboard.writeText(licenseKey)
      setMessage(`License copied: ${licenseKey}`)
    } catch {
      setMessage('Copy failed. Select the license and copy manually.')
    }
  }

  async function syncBuyerStatus() {
    try {
      setLoading(true)
      setMessage('Syncing buyer subscription...')
      const key = (licenseKey || localStorage.getItem('snx_license') || '').trim()
      const mail = (email || buyerEmail || localStorage.getItem('snx_license_email') || '').trim()

      if (key && mail) {
        const data = await buyerFetch('/license/validate', {
          method: 'POST',
          body: JSON.stringify({ license_key: key, email: mail, device_id: localStorage.getItem('snx_device_id') || 'local-device' })
        })
        if (data.ok) {
          setBuyerPlan(data.plan || 'PRO')
          setSubscriptionStatus('active')
          setDeviceStatus('bound / verified')
          localStorage.setItem('snx_plan', data.plan || 'PRO')
          localStorage.setItem('snx_license', key)
          localStorage.setItem('snx_license_email', mail)
          localStorage.setItem('snx_license_validated', 'true')
          if (data.expires_at) { localStorage.setItem('snx_license_expires_at', data.expires_at); setExpiresAt(data.expires_at) }
          saveActivationStamp()
          setMessage(`License synced. Active plan: ${data.plan || 'PRO'}`)
        } else {
          setSubscriptionStatus('inactive')
          setDeviceStatus('unverified')
          setMessage(data.message || 'License not active.')
        }
      } else if (mail) {
        const details = await buyerFetch(`/buyer/details?email=${encodeURIComponent(mail)}`)
        if (details.ok && details.license_key) {
          setLicenseKey(details.license_key)
          setBuyerPlan(details.plan || 'PRO')
          setSubscriptionStatus((details.status || 'active').toLowerCase() === 'active' ? 'active' : details.status)
          setDeviceStatus('license found')
          setPaymentHistory(details.payments || [])
          localStorage.setItem('snx_plan', details.plan || 'PRO')
          localStorage.setItem('snx_license', details.license_key)
          localStorage.setItem('snx_license_email', mail)
          localStorage.setItem('snx_license_validated', 'true')
          if (data.expires_at) { localStorage.setItem('snx_license_expires_at', data.expires_at); setExpiresAt(data.expires_at) }
          saveActivationStamp()
          setMessage(`License found: ${details.license_key}`)
        } else {
          setSubscriptionStatus(localStorage.getItem('snx_license_validated') === 'true' ? 'active' : 'inactive')
          setDeviceStatus('unbound')
          setMessage(details.message || 'No license found yet. Buy plan to auto-generate license.')
        }
      } else {
        setSubscriptionStatus(localStorage.getItem('snx_license_validated') === 'true' ? 'active' : 'inactive')
        setDeviceStatus(key ? 'saved locally' : 'unbound')
        setMessage('No license needed before purchase. Choose a plan to auto-generate license after payment.')
      }
    } catch (err) {
      console.error(err)
      setSubscriptionStatus('error')
      setDeviceStatus('check failed')
      setMessage(`Buyer sync failed: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }


  function loadRazorpayScript() {
    return new Promise((resolve, reject) => {
      if (window.Razorpay) return resolve(true)
      const script = document.createElement('script')
      script.src = 'https://checkout.razorpay.com/v1/checkout.js'
      script.onload = () => resolve(true)
      script.onerror = () => reject(new Error('Razorpay checkout script failed to load'))
      document.body.appendChild(script)
    })
  }

  async function upgradePlan(plan) {
    try {
      setLoading(true)
      const buyer = email || buyerEmail || localStorage.getItem('snx_license_email') || ''
      if (!buyer) {
        setMessage('Email missing. Login or enter buyer email first.')
        return
      }

      setMessage(`Creating ${plan} Razorpay order...`)
      const amountMap = { BASIC: 99900, PRO: 249900, ELITE: 499900, VIP: 799900 }
      const data = await buyerFetch('/payments/create-order', {
        method: 'POST',
        body: JSON.stringify({ plan, amount: amountMap[plan] || 249900, email: buyer })
      })

      const order = data.order || {}
      const razorpayOrderId = order.id || data.order_id || data.razorpay_order_id || 'order_DEV_PLACEHOLDER'
      const amount = order.amount || amountMap[plan] || 249900
      const currency = order.currency || 'INR'

      // If backend is in dev-placeholder mode, activate locally through verify route.
      if (data.mode === 'dev-placeholder' || !data.key_id) {
        const verified = await buyerFetch('/payments/verify', {
          method: 'POST',
          body: JSON.stringify({
            plan,
            email: buyer,
            razorpay_order_id: razorpayOrderId,
            razorpay_payment_id: 'pay_DEV_PLACEHOLDER',
            razorpay_signature: ''
          })
        })

        setBuyerPlan(verified.plan || plan)
        setSubscriptionStatus('active')
        localStorage.setItem('snx_plan', verified.plan || plan)
        localStorage.setItem('snx_license_email', buyer)
        if (verified.license_key) { localStorage.setItem('snx_license', verified.license_key); setLicenseKey(verified.license_key); saveActivationStamp() }
        if (verified.expires_at) { localStorage.setItem('snx_license_expires_at', verified.expires_at); setExpiresAt(verified.expires_at) }

        setPaymentHistory(prev => [{
          plan: verified.plan || plan,
          status: 'active-dev',
          razorpay_payment_id: verified.razorpay_payment_id,
          razorpay_order_id: verified.razorpay_order_id
        }, ...prev])

        setMessage(`${plan} activated in dev mode. License: ${verified.license_key || 'generated'}`)
        await syncBuyerStatus()
        return
      }

      await loadRazorpayScript()

      const options = {
        key: data.key_id,
        amount,
        currency,
        name: 'SnipeX',
        description: `${plan} Subscription`,
        order_id: razorpayOrderId,
        prefill: { email: buyer },
        notes: { plan, email: buyer },
        theme: { color: '#0f172a' },
        handler: async function (response) {
          try {
            setMessage('Verifying Razorpay payment...')
            const verified = await buyerFetch('/payments/verify', {
              method: 'POST',
              body: JSON.stringify({
                plan,
                email: buyer,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature
              })
            })

            setBuyerPlan(verified.plan || plan)
            setSubscriptionStatus('active')
            localStorage.setItem('snx_plan', verified.plan || plan)
            localStorage.setItem('snx_license_email', buyer)
            if (verified.license_key) { localStorage.setItem('snx_license', verified.license_key); setLicenseKey(verified.license_key); saveActivationStamp() }
        if (verified.expires_at) { localStorage.setItem('snx_license_expires_at', verified.expires_at); setExpiresAt(verified.expires_at) }

            setPaymentHistory(prev => [{
              plan: verified.plan || plan,
              status: 'verified',
              razorpay_payment_id: verified.razorpay_payment_id,
              razorpay_order_id: verified.razorpay_order_id
            }, ...prev])

            setMessage(`${verified.plan || plan} activated successfully. License: ${verified.license_key || 'generated'}`)
            await syncBuyerStatus()
          } catch (err) {
            console.error(err)
            setMessage(`Payment verify failed: ${err.message}`)
          }
        },
        modal: {
          ondismiss: function () {
            setMessage('Payment popup closed before completion.')
          }
        }
      }

      const rz = new window.Razorpay(options)
      rz.open()
      setMessage(`${plan} payment popup opened.`)
    } catch (err) {
      console.error(err)
      setMessage(`Upgrade failed: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }


  async function submitManualQrPayment() {
    const buyer = (email || buyerEmail || localStorage.getItem('snx_user_email') || '').trim()
    if (!buyer || !isValidEmail(buyer)) { setMessage('Enter a valid buyer email before submitting manual QR payment.'); return }
    if (!manualUtr.trim()) { setMessage('Enter UTR / Transaction ID.'); return }
    if (!manualProof) { setMessage('Upload payment screenshot first.'); return }
    try {
      setLoading(true)
      setMessage('Uploading payment proof...')
      const ext = (manualProof.name.split('.').pop() || 'png').toLowerCase()
      const safeEmail = buyer.replace(/[^a-zA-Z0-9@._-]/g, '_')
      const filePath = `${safeEmail}/proof_${Date.now()}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('payment-proofs')
        .upload(filePath, manualProof, { cacheControl: '3600', upsert: false, contentType: manualProof.type || 'image/png' })
      if (uploadError) throw uploadError
      const { data: signedData } = await supabase.storage
        .from('payment-proofs')
        .createSignedUrl(filePath, 60 * 60 * 24 * 7)
      const { error: insertError } = await supabase.from('manual_qr_payments').insert({
        email: buyer,
        mobile: manualMobile.trim(),
        plan: manualPlan,
        amount: manualAmount,
        utr: manualUtr.trim(),
        screenshot_path: filePath,
        screenshot_url: signedData?.signedUrl || '',
        status: 'pending'
      })
      if (insertError) throw insertError
      setPaymentHistory(prev => [{ plan: manualPlan, status: 'manual-pending', razorpay_payment_id: manualUtr.trim(), razorpay_order_id: 'QR-UPI' }, ...prev])
      setManualUtr('')
      setManualProof(null)
      setMessage('Payment proof uploaded successfully. Admin will verify it manually.')
      alert('Payment proof uploaded successfully. Admin will verify it manually.')
    } catch (err) {
      console.error(err)
      setMessage(`Manual QR submit failed: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { syncBuyerStatus() }, [])

  const buyerCards = [
    ['CURRENT PLAN', buyerPlan, 'var(--gold)'],
    ['SUBSCRIPTION', subscriptionStatus, subscriptionStatus === 'active' ? 'var(--green)' : 'var(--red)'],
    ['DEVICE STATUS', deviceStatus, 'var(--teal)'],
    ['LICENSE', licenseKey ? 'SAVED' : 'AUTO AFTER PAYMENT', licenseKey ? 'var(--green)' : 'var(--gold)']
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div className="glass-card" style={{ padding: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          <div>
            <div className="label-gold">Buyer Control Center</div>
            <div className="rajdhani" style={{ fontSize: 22, fontWeight: 800, marginTop: 4 }}>SnipeX Subscription Portal</div>
            <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 3 }}>Buy plan first. License auto-generates after payment. Expiry and device binding are checked by backend.</div>
          </div>
          <button className="btn-teal" onClick={syncBuyerStatus} disabled={loading}>{loading ? 'SYNCING...' : '↻ Sync Buyer'}</button>
        </div>
        <div style={{ marginTop: 12, padding: 10, borderRadius: 8, border: '1px solid rgba(0,212,170,0.18)', background: 'rgba(0,212,170,0.06)', color: message.includes('failed') || message.includes('error') ? 'var(--red)' : 'var(--teal)', fontSize: 12 }}>
          {message}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(150px, 1fr))', gap: 12 }}>
        {buyerCards.map(([label, value, color]) => (
          <div key={label} className="glass-card" style={{ padding: 16 }}>
            <div className="label-gold" style={{ fontSize: 9 }}>{label}</div>
            <div className="mono" style={{ color, fontSize: 22, marginTop: 8 }}>{value}</div>
          </div>
        ))}
      </div>

      <div className="glass-card teal-card" style={{ padding: 18, border: '1px solid rgba(0,212,170,0.35)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
          <div>
            <div className="label-teal">Your Active License</div>
            <div className="mono" style={{ color: licenseKey ? 'var(--green)' : 'var(--gold)', fontSize: 30, marginTop: 8, letterSpacing: 1 }}>
              {licenseKey || 'AUTO-GENERATES AFTER PAYMENT'}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 8 }}>
              Plan: <b style={{ color: 'var(--gold)' }}>{buyerPlan}</b> · Status: <b style={{ color: subscriptionStatus === 'active' ? 'var(--green)' : 'var(--red)' }}>{subscriptionStatus}</b> · Activated: {activatedAt || 'not activated yet'} · Expiry: {(expiresAt || '').slice(0, 10) || 'not set'}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button className="btn-teal" onClick={copyLicense} disabled={!licenseKey}>Copy License</button>
            <button className="btn-gold" onClick={syncBuyerStatus} disabled={loading}>{loading ? 'SYNCING...' : 'Refresh License'}</button>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: 14 }}>
        <div className="glass-card" style={{ padding: 16 }}>
          <div className="label-teal">Manual License Sync (Optional)</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 8, marginTop: 12 }}>
            <input value={email} onChange={e => setEmail(e.target.value)} placeholder="buyer@email.com"
              style={{ padding: 10, borderRadius: 8, border: '1px solid var(--border)', background: 'rgba(0,0,0,0.28)', color: 'var(--text)', outline: 'none' }} />
            <input value={licenseKey} onChange={e => setLicenseKey(e.target.value)} placeholder="SNX-XXXX-XXXX"
              style={{ padding: 10, borderRadius: 8, border: '1px solid var(--border)', background: 'rgba(0,0,0,0.28)', color: 'var(--text)', outline: 'none', fontFamily: 'Share Tech Mono' }} />
            <button className="btn-gold" onClick={syncBuyerStatus} disabled={loading}>Validate</button>
          </div>
          <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 10 }}>Optional: use only when you already have a license key. New buyers should use Quick Upgrade.</div>
        </div>

        <div className="glass-card teal-card" style={{ padding: 16 }}>
          <div className="label-gold">Quick Upgrade</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 8, marginTop: 12 }}>
            {['BASIC', 'PRO', 'ELITE', 'VIP'].map(plan => (
              <button key={plan} className={plan === 'PRO' || plan === 'VIP' ? 'btn-gold' : 'btn-teal'} onClick={() => upgradePlan(plan)} disabled={loading} style={{ padding: '10px 8px' }}>
                Upgrade {plan}
              </button>
            ))}
          </div>
        </div>
      </div>


      <div className="glass-card gold-card" style={{ padding: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          <div>
            <div className="label-gold">Manual UPI / QR Payment</div>
            <div className="rajdhani" style={{ fontSize: 20, fontWeight: 800, marginTop: 4 }}>Scan QR, pay and upload proof</div>
            <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 3 }}>Private bucket: payment-proofs · Admin approval required</div>
          </div>
          <span className="badge badge-active">70% OFF LIVE</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 16, marginTop: 14, alignItems: 'start' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ background: '#fff', padding: 10, borderRadius: 14, display: 'inline-block', boxShadow: '0 0 24px rgba(240,192,64,0.22)' }}>
              <img src={UPI_QR_IMAGE_URL} alt="SnipeX AI UPI QR" style={{ width: 240, maxWidth: '100%', display: 'block', borderRadius: 10 }} />
            </div>
            <div className="mono" style={{ color: 'var(--teal)', marginTop: 10, fontSize: 12 }}>UPI ID: {UPI_ID}</div>
            <button className="btn-teal" style={{ marginTop: 8 }} onClick={() => { navigator.clipboard.writeText(UPI_ID); setMessage('UPI ID copied.') }}>Copy UPI ID</button>
          </div>
          <div style={{ display: 'grid', gap: 10 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <select value={manualPlan} onChange={e => { const p=e.target.value; setManualPlan(p); setManualAmount(p === 'STARTER' ? 999 : p === 'LEARNER' ? 2999 : p === 'ELITE' ? 12999 : 5999) }} style={{ padding: 10, borderRadius: 8, border: '1px solid var(--border)', background: 'rgba(0,0,0,0.28)', color: 'var(--text)' }}>
                <option value="STARTER">STARTER ₹999</option>
                <option value="LEARNER">LEARNER ₹2999</option>
                <option value="PRO">PRO LEARNER ₹5999</option>
                <option value="ELITE">ELITE ₹12999</option>
              </select>
              <input value={manualAmount} onChange={e => setManualAmount(Number(e.target.value) || 0)} placeholder="Amount" type="number" style={{ padding: 10, borderRadius: 8, border: '1px solid var(--border)', background: 'rgba(0,0,0,0.28)', color: 'var(--text)' }} />
            </div>
            <input value={manualMobile} onChange={e => setManualMobile(e.target.value)} placeholder="Mobile number" style={{ padding: 10, borderRadius: 8, border: '1px solid var(--border)', background: 'rgba(0,0,0,0.28)', color: 'var(--text)' }} />
            <input value={manualUtr} onChange={e => setManualUtr(e.target.value)} placeholder="UTR / Transaction ID" style={{ padding: 10, borderRadius: 8, border: '1px solid var(--border)', background: 'rgba(0,0,0,0.28)', color: 'var(--text)' }} />
            <label style={{ fontSize: 11, color: 'var(--gold)', fontWeight: 700 }}>Upload payment screenshot</label>
            <input type="file" accept="image/png,image/jpeg,image/webp" onChange={e => setManualProof(e.target.files?.[0] || null)} style={{ padding: 10, borderRadius: 8, border: '1px solid var(--border)', background: 'rgba(0,0,0,0.28)', color: 'var(--text)' }} />
            {manualProof && <div style={{ fontSize: 11, color: 'var(--text2)' }}>Selected: {manualProof.name}</div>}
            <button className="btn-gold" onClick={submitManualQrPayment} disabled={loading}>{loading ? 'UPLOADING...' : 'Submit Manual QR Proof'}</button>
          </div>
        </div>
      </div>

      <div className="glass-card" style={{ padding: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <div><div className="label-teal">Payment / Upgrade History</div><div style={{ fontSize: 11, color: 'var(--text3)' }}>Local test history from backend payment route. Webhook history can be wired next.</div></div>
          <span className="badge badge-active">{paymentHistory.length} rows</span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table>
            <thead><tr><th>Plan</th><th>Status</th><th>Payment ID</th><th>Order ID</th></tr></thead>
            <tbody>
              {paymentHistory.map((p, i) => (
                <tr key={i}>
                  <td><span className="badge badge-active">{p.plan}</span></td>
                  <td>{p.status}</td>
                  <td className="mono">{p.razorpay_payment_id || '—'}</td>
                  <td className="mono">{p.razorpay_order_id || '—'}</td>
                </tr>
              ))}
              {!paymentHistory.length && <tr><td colSpan="4" style={{ color: 'var(--text3)' }}>No buyer upgrades tested yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ─── MAIN DASHBOARD ──────────────────────────────────────────────────────────
function SnipeXDashboard({ user, onLogout }) {
  const [activeNav, setActiveNav] = useState('buyer')
  const [masterAI, setMasterAI] = useState(true)
  const [autoTrade, setAutoTrade] = useState(false)

  const email = user?.email || localStorage.getItem('snx_license_email') || 'user@snipex.io'
  const plan = localStorage.getItem('snx_plan') || 'PRO'

  const renderSection = () => {
    switch (activeNav) {
      case 'buyer':     return <BuyerPortalSection user={user} />
      case 'admin':     return <AdminPanelSection />
      default:          return <BuyerPortalSection user={user} />
    }
  }

  return (
    <>
      <GlobalStyles />
      <div className="scanline-overlay" />
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>

        {/* Top Navbar */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 20px', height: 54,
          background: 'linear-gradient(90deg, var(--bg1), var(--bg2))',
          borderBottom: '1px solid var(--border)', flexShrink: 0, gap: 16
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 8,
                background: 'linear-gradient(135deg, var(--gold), var(--teal))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 16, fontWeight: 900, color: '#040810', fontFamily: 'Rajdhani'
              }}>S</div>
              <div>
                <div className="rajdhani" style={{ fontSize: 15, fontWeight: 800, letterSpacing: 1, color: 'var(--gold)' }}>SNIPEX AI</div>
                <div style={{ fontSize: 9, color: 'var(--text3)', letterSpacing: 2, marginTop: -2 }}>SAAS PORTAL</div>
              </div>
            </div>

          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 11, color: 'var(--text3)' }}>{email}</div>
              <div style={{ fontSize: 10, color: 'var(--gold)', letterSpacing: 1 }}>PLAN: {plan}</div>
            </div>
            <div style={{ width: 1, height: 28, background: 'var(--border)' }} />
            <LiveClock />
            <div style={{ width: 1, height: 28, background: 'var(--border)' }} />
            <button onClick={onLogout} style={{
              padding: '6px 14px', borderRadius: 8, border: '1px solid var(--border)',
              background: 'transparent', color: 'var(--text2)', fontSize: 12, cursor: 'pointer',
              fontFamily: 'Rajdhani', fontWeight: 600, letterSpacing: 0.5,
              transition: 'all 0.2s'
            }}>⏻ LOGOUT</button>
          </div>
        </div>


        {/* Main body */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          <Sidebar active={activeNav} onNav={setActiveNav} />
          <div style={{ flex: 1, overflowY: 'auto', padding: 18 }} key={activeNav} className="fade-in">
            <div style={{ marginBottom: 14 }}>
              <div className="rajdhani" style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)' }}>
                {navItems.find(n => n.id === activeNav)?.label}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>
                SnipeX Portal · SaaS Access Control · {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </div>
            </div>
            {renderSection()}
          </div>
        </div>
      </div>
    </>
  )
}

// ─── AUTH GATE (UNCHANGED) ────────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(null)
  const [licenseKey, setLicenseKey] = useState('')
  const [status, setStatus] = useState('Checking session...')
  const [loading, setLoading] = useState(false)
  const [signupMode, setSignupMode] = useState(false)
  const [signupMethod, setSignupMethod] = useState('phone')
  const [signupName, setSignupName] = useState('')
  const [signupMobile, setSignupMobile] = useState('')
  const [signupEmail, setSignupEmail] = useState('')
  const [signupOtp, setSignupOtp] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [licenseValidated, setLicenseValidated] = useState(
    localStorage.getItem('snx_license_validated') === 'true'
  )

  useEffect(() => {
    bootAuth()
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('SnipeX AUTH EVENT:', event, session)
      saveSession(session)
      if (session?.user) {
        setUser(session.user)
        if (localStorage.getItem('snx_license_validated') === 'true') {
          setLicenseValidated(true)
          setStatus('Access granted.')
        } else {
          setStatus('Google login successful. Buyer portal opened. Buy a plan to auto-generate license.')
        }
      }
    })
    return () => subscription?.unsubscribe()
  }, [])

  async function bootAuth() {
    try {
      setLoading(true)
      const params = new URLSearchParams(window.location.search)
      const code = params.get('code')
      if (code) {
        const { data, error } = await supabase.auth.exchangeCodeForSession(code)
        if (error) { console.error('exchangeCodeForSession error:', error); setStatus(error.message) }
        else {
          saveSession(data.session)
          if (data.session?.user) setUser(data.session.user)
          window.history.replaceState({}, document.title, '/')
        }
      }
      captureHashSession()
      const { data: { session }, error } = await supabase.auth.getSession()
      if (error) { console.error('getSession error:', error); setStatus(error.message); return }
      saveSession(session)
      if (session?.user) {
        setUser(session.user)
        if (localStorage.getItem('snx_license_validated') === 'true') { setLicenseValidated(true); setStatus('Access granted.') }
        else { setStatus('Google login found. Buyer portal opened. Buy a plan to auto-generate license.') }
      } else { setStatus('Please sign in with Google.') }
    } catch (err) { console.error(err); setStatus('Session boot failed') }
    finally { setLoading(false) }
  }

  function saveSession(session) {
    if (!session) return
    if (session.access_token) { localStorage.setItem('snx_jwt', session.access_token); localStorage.setItem('snx_access_token', session.access_token) }
    if (session.refresh_token) localStorage.setItem('snx_refresh_token', session.refresh_token)
    if (session.user) { localStorage.setItem('snx_session', JSON.stringify(session)); localStorage.setItem('snx_user_email', session.user.email || '') }
  }

  function captureHashSession() {
    const hash = window.location.hash || ''
    if (!hash.includes('access_token=')) return
    const params = new URLSearchParams(hash.replace('#', ''))
    const accessToken = params.get('access_token'); const refreshToken = params.get('refresh_token')
    const expiresAt = params.get('expires_at'); const tokenType = params.get('token_type')
    if (accessToken) localStorage.setItem('snx_jwt', accessToken)
    if (accessToken) localStorage.setItem('snx_access_token', accessToken)
    if (refreshToken) localStorage.setItem('snx_refresh_token', refreshToken)
    if (expiresAt) localStorage.setItem('snx_expires_at', expiresAt)
    if (tokenType) localStorage.setItem('snx_token_type', tokenType)
    window.history.replaceState({}, document.title, '/')
  }

  async function loginWithGoogle() {
    setLoading(true); setStatus('Opening Google login...')
    try {
      const { error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: FRONTEND_URL, queryParams: { access_type: 'offline', prompt: 'select_account' } } })
      if (error) { console.error(error); setStatus(error.message) }
    } catch (err) { console.error(err); setStatus('Google login failed') }
    finally { setLoading(false) }
  }



  async function saveUserProfile(sessionUser = user) {
    const email = (signupEmail || sessionUser?.email || localStorage.getItem('snx_user_email') || '').trim()
    if (!signupName.trim() || !signupMobile.trim() || !email) throw new Error('Name, mobile and email are required.')
    const { error } = await supabase.from('users').upsert({ email, name: signupName.trim(), mobile: signupMobile.trim() }, { onConflict: 'email' })
    if (error) throw error
  }

  async function sendSignupOtp() {
    const email = signupEmail.trim()
    const phone = normalizeIndianPhone(signupMobile)
    if (!signupName.trim()) { setStatus('Enter full name.'); return }
    if (!phone) { setStatus('Enter valid Indian mobile number.'); return }
    if (!isValidEmail(email)) { setStatus('Enter valid email.'); return }
    setLoading(true); setStatus(signupMethod === 'phone' ? 'Sending mobile OTP...' : 'Sending email OTP...')
    try {
      const { error } = signupMethod === 'phone'
        ? await supabase.auth.signInWithOtp({ phone, options: { data: { name: signupName.trim(), mobile: signupMobile.trim(), email } } })
        : await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: true, emailRedirectTo: FRONTEND_URL, data: { name: signupName.trim(), mobile: signupMobile.trim() } } })
      if (error) throw error
      setOtpSent(true); setSignupOtp('')
      setStatus(signupMethod === 'phone' ? 'Mobile OTP sent. Enter OTP to complete signup.' : 'Email OTP sent. Enter OTP to complete signup.')
    } catch (err) { console.error(err); setStatus(`OTP failed: ${err.message}`) }
    finally { setLoading(false) }
  }

  async function verifySignupOtp() {
    const email = signupEmail.trim()
    const phone = normalizeIndianPhone(signupMobile)
    if (!signupOtp.trim()) { setStatus('Enter OTP.'); return }
    setLoading(true); setStatus('Verifying OTP...')
    try {
      const { data, error } = signupMethod === 'phone'
        ? await supabase.auth.verifyOtp({ phone, token: signupOtp.trim(), type: 'sms' })
        : await supabase.auth.verifyOtp({ email, token: signupOtp.trim(), type: 'email' })
      if (error) throw error
      saveSession(data.session)
      if (data.session?.user) setUser(data.session.user)
      await saveUserProfile(data.session?.user)
      setStatus('Signup complete. Opening SnipeX Portal...')
    } catch (err) { console.error(err); setStatus(`OTP verification failed: ${err.message}`) }
    finally { setLoading(false) }
  }

  async function validateLicense() {
    const email = user?.email || localStorage.getItem('snx_user_email') || ''
    if (!email) { setStatus('Google login required first'); return }
    if (!licenseKey.trim()) { setStatus('Please enter license key'); return }
    setLoading(true); setStatus('Validating license...')
    try {
      const response = await fetch(`${BACKEND_URL}/license/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('snx_jwt') || ''}` },
        body: JSON.stringify({ license_key: licenseKey.trim(), email })
      })
      const result = await response.json()
      console.log('SnipeX license result:', result)
      if (result.ok) {
        localStorage.setItem('snx_license', licenseKey.trim()); localStorage.setItem('snx_plan', result.plan || 'PRO')
        localStorage.setItem('snx_license_email', email); localStorage.setItem('snx_license_validated', 'true')
        setStatus('License validated successfully. Opening dashboard...'); setLicenseValidated(true)
      } else { setStatus(result.message || 'License validation failed') }
    } catch (err) { console.error(err); setStatus('Backend connection failed. Check http://127.0.0.1:8000') }
    finally { setLoading(false) }
  }

  async function logout() {
    await supabase.auth.signOut()
    const keys = ['snx_jwt','snx_access_token','snx_refresh_token','snx_session','snx_user_email','snx_license','snx_plan','snx_license_email','snx_license_validated']
    keys.forEach(key => localStorage.removeItem(key))
    setUser(null); setLicenseValidated(false); setLicenseKey(''); setStatus('Logged out')
  }

  if (user || licenseValidated) return <SnipeXDashboard user={user} onLogout={logout} />

  return (
    <>
      <GlobalStyles />
      <div style={{
        minHeight: '100vh',
        background: 'radial-gradient(ellipse at 30% 20%, #0a1628 0%, #040810 60%)',
        color: 'white', display: 'flex', justifyContent: 'center', alignItems: 'center',
        fontFamily: "'Exo 2', sans-serif", padding: 20,
        backgroundImage: `radial-gradient(ellipse at 30% 20%, #0a1628 0%, #040810 60%),
          repeating-linear-gradient(0deg, transparent, transparent 40px, rgba(240,192,64,0.02) 40px, rgba(240,192,64,0.02) 41px),
          repeating-linear-gradient(90deg, transparent, transparent 40px, rgba(240,192,64,0.02) 40px, rgba(240,192,64,0.02) 41px)`
      }}>
        <div style={{ width: '100%', maxWidth: 440, animation: 'fadeSlideIn 0.5s ease' }}>
          {/* Logo */}
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div style={{
              width: 60, height: 60, borderRadius: 16, margin: '0 auto 12px',
              background: 'linear-gradient(135deg, #c8950a, #f0c040, #00d4aa)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 28, fontWeight: 900, color: '#040810', fontFamily: 'Rajdhani',
              boxShadow: '0 0 30px rgba(240,192,64,0.4), 0 0 60px rgba(0,212,170,0.2)'
            }}>S</div>
            <div className="rajdhani" style={{ fontSize: 28, fontWeight: 800, background: 'linear-gradient(90deg,var(--gold),var(--teal))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>SnipeX AI</div>
            <div style={{ fontSize: 11, color: 'var(--text3)', letterSpacing: 3, marginTop: 2 }}>SAAS PORTAL</div>
          </div>

          <div className="glass-card" style={{ padding: 28 }}>
            <div className="label-gold" style={{ marginBottom: 4, textAlign: 'center' }}>Access Portal</div>
            <p style={{ opacity: 0.6, marginBottom: 20, textAlign: 'center', fontSize: 13, color: 'var(--text2)' }}>
              Google Login → Buyer Portal → Payment → Auto License
            </p>

            {!user ? (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
                  <button onClick={() => setSignupMode(false)} className={!signupMode ? 'btn-gold' : 'btn-teal'} style={{ padding: 10 }}>Sign In</button>
                  <button onClick={() => setSignupMode(true)} className={signupMode ? 'btn-gold' : 'btn-teal'} style={{ padding: 10 }}>New Signup</button>
                </div>

                {!signupMode ? (
                  <button onClick={loginWithGoogle} disabled={loading} style={{
                    width: '100%', padding: 14, borderRadius: 12, border: 'none',
                    background: 'linear-gradient(135deg, #1a56db, #2563eb)',
                    color: 'white', fontSize: 15, cursor: 'pointer', opacity: loading ? 0.7 : 1,
                    fontFamily: 'Rajdhani', fontWeight: 700, letterSpacing: 1, display: 'flex',
                    alignItems: 'center', justifyContent: 'center', gap: 8
                  }}>
                    <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#fff" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#fff" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#fff" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#fff" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                    Sign in with Google
                  </button>
                ) : (
                  <div className="glass-card" style={{ padding: 12, marginBottom: 12 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
                      <button className={signupMethod === 'phone' ? 'btn-gold' : 'btn-teal'} onClick={() => { setSignupMethod('phone'); setOtpSent(false); setSignupOtp('') }} style={{ padding: 9 }}>Mobile OTP</button>
                      <button className={signupMethod === 'email' ? 'btn-gold' : 'btn-teal'} onClick={() => { setSignupMethod('email'); setOtpSent(false); setSignupOtp('') }} style={{ padding: 9 }}>Email OTP</button>
                    </div>
                    <input value={signupName} onChange={e => setSignupName(e.target.value)} placeholder="Full Name" style={{ width: '100%', boxSizing: 'border-box', marginBottom: 8, padding: 10, borderRadius: 8, border: '1px solid var(--border)', background: 'rgba(0,0,0,0.28)', color: 'var(--text)' }} />
                    <input value={signupMobile} onChange={e => setSignupMobile(e.target.value)} placeholder="Mobile Number" style={{ width: '100%', boxSizing: 'border-box', marginBottom: 8, padding: 10, borderRadius: 8, border: '1px solid var(--border)', background: 'rgba(0,0,0,0.28)', color: 'var(--text)' }} />
                    <input value={signupEmail} onChange={e => setSignupEmail(e.target.value)} placeholder="Gmail / Email" style={{ width: '100%', boxSizing: 'border-box', marginBottom: 8, padding: 10, borderRadius: 8, border: '1px solid var(--border)', background: 'rgba(0,0,0,0.28)', color: 'var(--text)' }} />
                    {otpSent && <input value={signupOtp} onChange={e => setSignupOtp(e.target.value)} placeholder="Enter OTP" style={{ width: '100%', boxSizing: 'border-box', marginBottom: 8, padding: 10, borderRadius: 8, border: '1px solid var(--border)', background: 'rgba(0,0,0,0.28)', color: 'var(--text)' }} />}
                    {!otpSent ? <button className="btn-gold" onClick={sendSignupOtp} disabled={loading} style={{ width: '100%' }}>{loading ? 'SENDING...' : signupMethod === 'phone' ? 'Send Mobile OTP' : 'Send Email OTP'}</button> : <button className="btn-gold" onClick={verifySignupOtp} disabled={loading} style={{ width: '100%' }}>{loading ? 'VERIFYING...' : 'Verify OTP & Signup'}</button>}
                    <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 8 }}>Mobile OTP requires Supabase Phone Provider + SMS provider.</div>
                  </div>
                )}
              </div>            ) : (
              <div>
                <div style={{ padding: 12, background: 'rgba(0,212,170,0.08)', borderRadius: 10, marginBottom: 14, border: '1px solid rgba(0,212,170,0.2)', fontSize: 12, color: 'var(--teal)' }}>
                  ✓ Signed in as <strong style={{ color: 'var(--text)' }}>{user.email}</strong>
                </div>
                <input type="text" value={licenseKey} onChange={e => setLicenseKey(e.target.value)}
                  placeholder="Enter License Key (SNX-XXXX-XXXX)"
                  style={{ width: '100%', boxSizing: 'border-box', padding: 13, borderRadius: 10, border: '1px solid var(--border)', background: 'rgba(0,0,0,0.3)', color: 'var(--text)', marginBottom: 12, outline: 'none', fontFamily: 'Share Tech Mono', fontSize: 13 }} />
                <button onClick={validateLicense} disabled={loading} className="btn-teal" style={{ width: '100%', padding: 14, fontSize: 15, borderRadius: 12 }}>⚡ Activate License</button>
                <button onClick={logout} style={{ width: '100%', padding: 11, borderRadius: 10, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text3)', fontSize: 13, marginTop: 10, cursor: 'pointer', fontFamily: 'Rajdhani', fontWeight: 600 }}>Logout</button>
              </div>
            )}

            <div style={{ marginTop: 16, padding: 11, borderRadius: 10, background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border)', color: 'var(--text2)', fontSize: 13, minHeight: 22, wordBreak: 'break-word', fontFamily: 'Share Tech Mono' }}>
              {status}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
