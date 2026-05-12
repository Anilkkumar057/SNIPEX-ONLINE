import React, { useEffect, useMemo, useState } from "react";
import "./style.css";

const SYMBOLS = ["XAUUSD", "XAGUSD", "XPDUSD", "EURUSD", "GBPUSD", "USDJPY", "USDCHF", "USDCAD", "AUDUSD"];
const API_BASE = (import.meta.env.VITE_API_BASE || "").replace(/\/$/, "");

function api(path) {
  return API_BASE ? `${API_BASE}${path}` : path;
}

async function getJson(path) {
  const res = await fetch(api(path), { headers: { "Content-Type": "application/json" } });
  const text = await res.text();
  let data = {};
  try { data = text ? JSON.parse(text) : {}; } catch { data = { ok: false, error: text || "Invalid JSON" }; }
  if (!res.ok) throw new Error(data.error || data.message || `HTTP ${res.status}`);
  return data;
}

function n(v, d = 3) {
  const x = Number(v);
  if (!Number.isFinite(x)) return "--";
  return x.toLocaleString(undefined, { maximumFractionDigits: d });
}

function spread(p) {
  const ask = Number(p?.ask), bid = Number(p?.bid);
  if (!Number.isFinite(ask) || !Number.isFinite(bid)) return null;
  return Math.round((ask - bid) / 0.001);
}

export default function App() {
  const [status, setStatus] = useState(null);
  const [prices, setPrices] = useState({});
  const [setup, setSetup] = useState({});
  const [error, setError] = useState("");
  const [updated, setUpdated] = useState("");
  const [auto, setAuto] = useState(true);

  async function refresh() {
    setError("");
    try {
      const [s, p] = await Promise.all([
        getJson("/api/status"),
        getJson(`/api/prices?symbols=${SYMBOLS.join(",")}`)
      ]);
      setStatus(s);
      setPrices(p.data || {});

      const next = {};
      await Promise.all(SYMBOLS.map(async sym => {
        try {
          next[sym] = await getJson(`/api/setup_status?symbol=${encodeURIComponent(sym)}`);
        } catch (e) {
          next[sym] = { ok: false, error: e.message };
        }
      }));
      setSetup(next);
      setUpdated(new Date().toLocaleTimeString());
    } catch (e) {
      setError(e.message || String(e));
    }
  }

  useEffect(() => { refresh(); }, []);
  useEffect(() => {
    if (!auto) return;
    const id = setInterval(refresh, 5000);
    return () => clearInterval(id);
  }, [auto]);

  const connected = Boolean(status?.ok && (status?.connected || status?.mt5_connected || status?.bridge_ok));
  const account = status?.account || {};

  const rows = useMemo(() => SYMBOLS.map(sym => {
    const p = prices[sym] || {};
    const s = setup[sym] || {};
    const confidence = s.confidence ?? s.master_confidence ?? s.setup?.confidence ?? s.data?.confidence ?? s.result?.confidence;
    const direction = s.direction ?? s.side ?? s.setup?.direction ?? s.data?.direction ?? s.result?.direction ?? "WAIT";
    const strategy = s.strategy ?? s.strategy_name ?? s.setup?.strategy_name ?? s.data?.strategy ?? s.result?.strategy_name ?? "Scanning";
    const ready = Boolean(s.ready ?? s.setup?.ready ?? s.data?.ready ?? s.result?.ready);
    return { sym, p, s, confidence, direction, strategy, ready, sp: spread(p) };
  }), [prices, setup]);

  return (
    <main className="app">
      <header className="top">
        <div className="brand">
          <div className="bolt">⚡</div>
          <div>
            <h1>SNIPEX LIGHT LIVE CORE</h1>
            <p>Fast online dashboard · real API data · no heavy scripts</p>
          </div>
        </div>
        <div className="pills">
          <span className={connected ? "pill good" : "pill bad"}>{connected ? "MT5 LIVE" : "MT5 OFF"}</span>
          <span className="pill">API: {API_BASE || "same-origin"}</span>
          <span className="pill">Updated: {updated || "--"}</span>
        </div>
      </header>

      <section className="stats">
        <div><span>Balance</span><b>{account.currency || "INR"} {n(account.balance, 2)}</b></div>
        <div><span>Equity</span><b>{account.currency || "INR"} {n(account.equity, 2)}</b></div>
        <div><span>Free Margin</span><b>{account.currency || "INR"} {n(account.margin_free, 2)}</b></div>
        <div><span>Server</span><b>{status?.server || account.server || "--"}</b></div>
      </section>

      <section className="controls">
        <button onClick={refresh}>Refresh</button>
        <button className={auto ? "on" : ""} onClick={() => setAuto(v => !v)}>Auto {auto ? "ON" : "OFF"}</button>
        {error && <span className="error">API Error: {error}</span>}
      </section>

      {!API_BASE && (
        <div className="notice">
          Online deploy ke liye <b>VITE_API_BASE</b> ko live backend URL par set karo. Public site PC ke localhost ko read nahi kar sakti.
        </div>
      )}

      <section className="grid">
        {rows.map(r => (
          <article className="card" key={r.sym}>
            <div className="head">
              <div><h2>{r.sym}</h2><p>{r.strategy}</p></div>
              <em className={r.ready ? "ready" : "wait"}>{r.ready ? "READY" : "WAIT"}</em>
            </div>
            <div className="prices">
              <div><span>Bid</span><b>{n(r.p.bid)}</b></div>
              <div><span>Ask</span><b>{n(r.p.ask)}</b></div>
              <div><span>Spread</span><b className={r.sp > 250 ? "bad" : r.sp > 140 ? "warn" : "good"}>{r.sp ?? "--"}</b></div>
            </div>
            <div className="confidence">
              <div><span>Confidence</span><b>{Number.isFinite(Number(r.confidence)) ? Number(r.confidence).toFixed(1) + "%" : "--"}</b></div>
              <i><u style={{ width: `${Math.max(0, Math.min(100, Number(r.confidence) || 0))}%` }} /></i>
            </div>
            <div className="decision">
              <span>Direction</span>
              <b className={String(r.direction).toUpperCase() === "BUY" ? "good" : String(r.direction).toUpperCase() === "SELL" ? "bad" : ""}>{String(r.direction).toUpperCase()}</b>
            </div>
            {!r.s?.ok && r.s?.error && <small>{r.s.error}</small>}
          </article>
        ))}
      </section>

      <footer>Backend hard safety: MT5 · live tick · RR&lt;1:3 · SL/TP · margin · daily/equity · spread max.</footer>
    </main>
  );
}
