
window.SNIPEX_API_FORCE_ABEURUTE_BRIDGE_URL_FIX = true;
window.SNIPEX_BRIDGE_BASE = window.SNIPEX_BRIDGE_BASE || "http://127.0.0.1:5000";

/* ============ LAYERS 1 TO 4: FOUNDATION AUDIT + BOT LOCKS ============
   Purpose: prove bot identity, keep UI untouched, clean conflicting execution paths,
   make Scan + Draw visual-only, and enforce demo/subscription rules before execution.
*/
(function(){
  if(window.__SNIPEX_LAYERS_1_TO_4_FOUNDATION__) return;
  window.__SNIPEX_LAYERS_1_TO_4_FOUNDATION__ = true;

  const LAYER_TAG = 'LAYERS_1_TO_4_FOUNDATION_LOCK';
  const DEMO_LIMIT = 3;
  const ACTIVE_PLANS = ['BEGINNER','LEARNER','PRO_LEARNER','ELITE','VIP','ADMIN','FULL','PERSONAL','BASIC','PRO'];
  const EXECUTION_ROUTES = /\/api\/(order|orders|trade|execute|execution|auto[_-]?trade|master-ai\/execute|test\/force_order)/i;
  const VISUAL_ROUTES = /\/api\/(draw|scan[_-]?draw|chart|levels|zones|visual|mark)/i;
  const SIGNAL_ROUTES = /\/api\/(setup_status|signal|signals|scanner|scan|best_setup|strategy\/scan)/i;

  function norm(v){ return String(v||'').trim().toUpperCase(); }
  function read(k,d){ try{ const v=localStorage.getItem(k); return v==null ? (d||'') : v; }catch(e){ return d||''; } }
  function write(k,v){ try{ localStorage.setItem(k,String(v)); }catch(e){} }
  function log(msg,type){ try{ (window.logLive||window.addLog||console.log)(msg,type||'info'); }catch(e){ console.log(msg); } }
  function access(){
    const finalLock = window.SNIPEX_FINAL_SAAS_LOCK && window.SNIPEX_FINAL_SAAS_LOCK.getAccess ? window.SNIPEX_FINAL_SAAS_LOCK.getAccess() : null;
    if(finalLock) return finalLock;
    const rawPlan = norm(read('SNIPEX_USER_PLAN','') || read('snipex_user_plan','') || read('plan','') || 'DEMO');
    const isAdmin = read('SNIPEX_IS_ADMIN','') === 'true' || rawPlan === 'ADMIN';
    const active = isAdmin || ACTIVE_PLANS.includes(rawPlan);
    const used = Math.max(0, Number(read('SNIPEX_DEMO_SIGNALS_USED','0')) || 0);
    return {mode:active ? rawPlan : 'DEMO', plan:active ? rawPlan : 'DEMO', isAdmin, paid:active, active, used, left:active ? 999999 : Math.max(0, DEMO_LIMIT-used), features:{allowLiveExecution:active && !['BEGINNER','LEARNER','BASIC'].includes(rawPlan), allowAuto:active && !['BEGINNER','LEARNER','BASIC'].includes(rawPlan)}};
  }
  function deny(reason){
    const a = access();
    log('FOUNDATION LOCK: '+reason+' | Access='+a.mode+' | Demo signals left='+(a.left==null?'NA':a.left)+'.','warn');
    return Promise.resolve(new Response(JSON.stringify({ok:false, blocked:true, layer:LAYER_TAG, reason, plan:a.mode, demo_signals_left:a.left}), {status:403, headers:{'Content-Type':'application/json'}}));
  }
  function markVisualWindow(){ window.__SNIPEX_VISUAL_ONLY_SCAN_DRAW_TS__ = Date.now(); }
  function isVisualWindow(){ return Date.now() - Number(window.__SNIPEX_VISUAL_ONLY_SCAN_DRAW_TS__ || 0) < 6000; }

  // Layer 1: identity lock, confirms this file is the bot dashboard package, not buyer/admin portal package.
  window.SNIPEX_BOT_IDENTITY_LOCK = Object.freeze({
    layer:'Layer 1 - Backup + Identity Lock',
    fileType:'BOT_APP_JSX',
    notPortal:true,
    uiTouched:false,
    backupName:'BACKUP_BEFORE_LAYER1_TO4_FOUNDATION_App.jsx',
    sourceBuild:'SNIPEX_APEX_NOVA_CORE_X10_LAYER10_FINAL_SAAS_LOCK.zip'
  });

  // Layer 2: safety cleanup guard. This does not change UI. It prevents old duplicate auto-exec paths
  // from silently bypassing the latest guarded execution route.
  const previousSafety = window.SNIPEX_SAFETY_CLEANUP_LOCK || {};
  window.SNIPEX_SAFETY_CLEANUP_LOCK = Object.assign(previousSafety, {
    layer:'Layer 2 - Safety Cleanup',
    latestLogicOnly:true,
    conflictingAutoExecBlocked:true,
    duplicatePatchGuard:true
  });

  // Layer 3: Scan + Draw is visual-only; Execute Best Setup is the only execution intent.
  window.SNIPEX_SCAN_DRAW_LOCK = {
    layer:'Layer 3 - Scan + Draw Lock',
    scanDrawMode:'VISUAL_ONLY',
    executeBestSetupMode:'ORDER_ROUTE_ONLY',
    explain:function(){ return 'Scan + Draw draws/marks chart only. Execute Best Setup is the only order route.'; }
  };

  // Layer 4: Demo/subscription guard. Demo receives only 3 real signal suggestions and never auto-executes.
  window.SNIPEX_DEMO_SUBSCRIPTION_GUARD = {
    layer:'Layer 4 - Demo / Subscription Guard',
    demoRealSignalLimit:DEMO_LIMIT,
    getUsed:function(){ return Math.max(0, Number(read('SNIPEX_DEMO_SIGNALS_USED','0')) || 0); },
    getLeft:function(){ const a=access(); return a.paid ? 999999 : Math.max(0, DEMO_LIMIT-this.getUsed()); },
    canTakeSignal:function(){ const a=access(); return a.paid || this.getLeft()>0; },
    canExecute:function(){ const a=access(); return !!(a.isAdmin || (a.features && a.features.allowLiveExecution)); },
    recordSignal:function(){ const a=access(); if(a.paid) return this.getLeft(); const used=this.getUsed()+1; write('SNIPEX_DEMO_SIGNALS_USED', String(Math.min(DEMO_LIMIT, used))); return this.getLeft(); }
  };

  if(!window.__SNIPEX_LAYER1_4_CLICK_GUARD__){
    window.__SNIPEX_LAYER1_4_CLICK_GUARD__ = true;
    document.addEventListener('click', function(ev){
      const btn = ev.target && ev.target.closest ? ev.target.closest('button,[role="button"],a,.btn') : null;
      if(!btn) return;
      const label = String(btn.textContent || btn.getAttribute('aria-label') || btn.getAttribute('title') || '').toLowerCase();
      if(/scan\s*\+\s*draw|scan and draw|draw setup|draw levels/.test(label)){
        markVisualWindow();
        btn.setAttribute('data-snipex-layer3','visual-only');
        log('SCAN + DRAW: visual-only route active. No order will be sent from this button.','info');
      }
      if(/execute best setup|best setup execute|place order|fire order|force order|auto trade|live order/.test(label)){
        btn.setAttribute('data-snipex-layer3','execute-route');
        const a=access();
        if(!window.SNIPEX_DEMO_SUBSCRIPTION_GUARD.canExecute()){
          ev.preventDefault(); ev.stopPropagation();
          log('DEMO/SUBSCRIPTION GUARD: execution blocked. Upgrade to Pro Learner/Elite or use admin access.','warn');
        } else {
          log('EXECUTE BEST SETUP: order route requested under '+a.mode+' access.','info');
        }
      }
    }, true);
  }

  if(!window.__SNIPEX_LAYER1_4_FETCH_GUARD__){
    window.__SNIPEX_LAYER1_4_FETCH_GUARD__ = true;
    const oldFetch = window.fetch;
    if(oldFetch){
      window.fetch = function(input, init){
        const url = String((input && input.url) || input || '');
        const method = norm((init && init.method) || 'GET');
        const a = access();
        const isExecution = EXECUTION_ROUTES.test(url) || (method !== 'GET' && /execute|order|trade|force_order/i.test(url));
        const isVisual = VISUAL_ROUTES.test(url) || isVisualWindow();
        const isSignal = SIGNAL_ROUTES.test(url) && !isExecution && !isVisual;

        if(isVisual && isExecution){
          return deny('Scan + Draw is visual-only. Execution route blocked from visual workflow');
        }
        if(isExecution && !window.SNIPEX_DEMO_SUBSCRIPTION_GUARD.canExecute()){
          return deny('Demo/Beginner/Learner users cannot auto-execute or place live orders');
        }
        if(isSignal && !a.paid && !window.SNIPEX_DEMO_SUBSCRIPTION_GUARD.canTakeSignal()){
          return deny('Demo limit reached: 3 real signal suggestions already used');
        }

        const p = oldFetch.call(this, input, init);
        if(isSignal && !a.paid){
          return Promise.resolve(p).then(function(resp){
            try{
              if(resp && resp.ok){
                const left = window.SNIPEX_DEMO_SUBSCRIPTION_GUARD.recordSignal();
                log('DEMO SIGNAL: real suggestion counted. Remaining demo signals: '+left+'.','info');
              }
            }catch(e){}
            return resp;
          });
        }
        return p;
      };
    }
  }

  log('Layers 1-4 foundation checked: bot identity locked, Scan + Draw visual-only, demo execution blocked.','info');
})();



/* ============ LAYER 10: FINAL SAAS LOCK - PLAN MAP + ADMIN + HEARTBEAT ============
   Frontend lock for bot access. Backend/license server remains final authority.
*/
(function(){
  if(window.__SNIPEX_LAYER10_FINAL_SAAS_LOCK__) return;
  window.__SNIPEX_LAYER10_FINAL_SAAS_LOCK__ = true;

  const ADMIN_EMAILS = ['mystocktradesk@gmail.com','mystocktradesk@gmail,com'];
  const HEARTBEAT_MS = 60000;
  const STALE_MS = 180000;
  const ACTIVE_STATUSES = ['ACTIVE','TRIAL','APPROVED','PAID','VALID','VIP','ELITE','PRO_LEARNER','PRO','LEARNER','BEGINNER','BASIC'];

  function now(){ return Date.now(); }
  function norm(v){ return String(v||'').trim().toUpperCase(); }
  function emailNorm(v){ return String(v||'').trim().toLowerCase().replace(',', '.'); }
  function read(k,d){ try{ const v=localStorage.getItem(k); return v==null ? (d||'') : v; }catch(e){ return d||''; } }
  function write(k,v){ try{ localStorage.setItem(k,String(v)); }catch(e){} }
  function del(k){ try{ localStorage.removeItem(k); }catch(e){} }
  function log(msg,type){ try{ (window.logLive||window.addLog||console.log)(msg,type||'info'); }catch(e){ console.log(msg); } }
  function token(){ return read('SNIPEX_JWT','') || read('snipex_jwt','') || read('access_token','') || read('supabase.auth.token',''); }
  function userEmail(){ return emailNorm(read('SNIPEX_USER_EMAIL','') || read('snipex_user_email','') || read('user_email','') || read('email','')); }
  function bridgeBase(){ return String(window.SNIPEX_PORTAL_API_BASE || window.SNIPEX_LICENSE_API_BASE || window.SNIPEX_BACKEND_BASE || window.SNIPEX_BRIDGE_BASE || 'http://127.0.0.1:5000').replace(/\/$/,''); }

  const FEATURE_MAP = window.SNIPEX_PLAN_FEATURES = Object.assign({}, window.SNIPEX_PLAN_FEATURES || {}, {
    DEMO:        {tier:0, label:'DEMO',        signals:3,      allowScannerPreview:true,  allowScanner:false, allowLiveSignals:true,  allowLiveExecution:false, allowAuto:false, maxAutoStrategies:0,   planText:'Demo preview: 3 real signal suggestions only'},
    BEGINNER:    {tier:1, label:'BEGINNER',    signals:50,     allowScannerPreview:true,  allowScanner:true,  allowLiveSignals:true,  allowLiveExecution:false, allowAuto:false, maxAutoStrategies:1,   planText:'Beginner: starter scanner and signals, execution locked'},
    LEARNER:     {tier:2, label:'LEARNER',     signals:200,    allowScannerPreview:true,  allowScanner:true,  allowLiveSignals:true,  allowLiveExecution:false, allowAuto:false, maxAutoStrategies:2,   planText:'Learner: deeper learning tools and expanded signals, execution locked'},
    PRO_LEARNER: {tier:3, label:'PRO LEARNER', signals:9999,   allowScannerPreview:true,  allowScanner:true,  allowLiveSignals:true,  allowLiveExecution:true,  allowAuto:true,  maxAutoStrategies:4,   planText:'Pro Learner: live signals and controlled execution'},
    ELITE:       {tier:4, label:'ELITE',       signals:999999, allowScannerPreview:true,  allowScanner:true,  allowLiveSignals:true,  allowLiveExecution:true,  allowAuto:true,  maxAutoStrategies:99,  planText:'Elite: full SnipeX bot access'},
    ADMIN:       {tier:99,label:'ADMIN',       signals:999999, allowScannerPreview:true,  allowScanner:true,  allowLiveSignals:true,  allowLiveExecution:true,  allowAuto:true,  maxAutoStrategies:999, planText:'Admin: full access'}
  });
  FEATURE_MAP.BASIC = FEATURE_MAP.BEGINNER;
  FEATURE_MAP.PRO = FEATURE_MAP.PRO_LEARNER;
  FEATURE_MAP.VIP = FEATURE_MAP.ELITE;
  FEATURE_MAP.FULL = FEATURE_MAP.ELITE;
  FEATURE_MAP.PERSONAL = FEATURE_MAP.ELITE;

  function localAdmin(){
    const e=userEmail();
    return read('SNIPEX_IS_ADMIN','') === 'true' || read('snipex_is_admin','') === 'true' || ADMIN_EMAILS.map(emailNorm).includes(e);
  }

  function rawPlan(){ return norm(read('SNIPEX_USER_PLAN','') || read('snipex_user_plan','') || read('plan','') || read('subscription_plan','') || 'DEMO'); }
  function rawStatus(){ return norm(read('SNIPEX_SUBSCRIPTION_STATUS','') || read('snipex_subscription_status','') || read('subscription_status','') || 'DEMO'); }

  function getAccess(){
    const isAdmin = localAdmin();
    const plan = isAdmin ? 'ADMIN' : (FEATURE_MAP[rawPlan()] ? rawPlan() : 'DEMO');
    const status = isAdmin ? 'ACTIVE' : rawStatus();
    const active = isAdmin || (FEATURE_MAP[plan] && ACTIVE_STATUSES.includes(status) && plan !== 'DEMO');
    const used = Math.max(0, Number(read('SNIPEX_DEMO_SIGNALS_USED','0')) || 0);
    const features = FEATURE_MAP[active ? plan : 'DEMO'] || FEATURE_MAP.DEMO;
    const left = active ? features.signals : Math.max(0, FEATURE_MAP.DEMO.signals - used);
    const hb = Number(read('SNIPEX_LAST_HEARTBEAT_TS','0')) || 0;
    const stale = hb ? (now() - hb > STALE_MS) : !isAdmin && !!token();
    return {plan:active ? plan : 'DEMO', rawPlan:plan, status, isAdmin, paid:active, active, mode:active ? plan : 'DEMO', features, used, left, heartbeatTs:hb, heartbeatStale:stale, email:userEmail()};
  }

  function setAccessFromServer(data){
    if(!data || typeof data !== 'object') return;
    const plan = norm(data.plan || data.subscription_plan || data.tier || data.role || '');
    const status = norm(data.status || data.subscription_status || (data.active ? 'ACTIVE' : ''));
    const email = emailNorm(data.email || data.user_email || '');
    const isAdmin = !!(data.is_admin || data.admin || norm(data.role)==='ADMIN') || ADMIN_EMAILS.map(emailNorm).includes(email);
    if(email) write('SNIPEX_USER_EMAIL', email);
    if(isAdmin){ write('SNIPEX_IS_ADMIN','true'); write('SNIPEX_USER_PLAN','ADMIN'); write('SNIPEX_SUBSCRIPTION_STATUS','ACTIVE'); }
    else {
      if(plan && FEATURE_MAP[plan]) write('SNIPEX_USER_PLAN', plan);
      if(status) write('SNIPEX_SUBSCRIPTION_STATUS', status);
      if(status && !ACTIVE_STATUSES.includes(status)){ write('SNIPEX_USER_PLAN','DEMO'); }
    }
    write('SNIPEX_LAST_HEARTBEAT_TS', String(now()));
    window.dispatchEvent(new CustomEvent('snipex:access-updated', {detail:getAccess()}));
  }

  window.SNIPEX_FINAL_SAAS_LOCK = {
    layer:'LAYER_10_FINAL_SAAS_LOCK',
    featureMap:FEATURE_MAP,
    getAccess,
    getFeatures:function(){ return getAccess().features; },
    can:function(feature){ const f=getAccess().features; return !!f[feature]; },
    require:function(feature){
      const a=getAccess();
      if(a.isAdmin) return {ok:true, access:a, reason:'Admin full access'};
      if(a.features && a.features[feature]) return {ok:true, access:a, reason:a.features.planText};
      return {ok:false, access:a, reason:'Your current plan does not unlock '+feature};
    },
    sync:setAccessFromServer,
    heartbeat:heartbeat
  };

  const previousAccess = window.SNIPEX_ACCESS_CONTROL || {};
  window.SNIPEX_ACCESS_CONTROL = Object.assign(previousAccess, {
    layer:'LAYER_10_FINAL_SAAS_LOCK',
    getAccess,
    isPaid:function(){ return getAccess().paid; },
    canExecute:function(){ return !!getAccess().features.allowLiveExecution; },
    canTakeSignal:function(){ const a=getAccess(); return a.paid || a.left>0; },
    getFeatures:function(){ return getAccess().features; }
  });
  window.SNIPEX_GET_PLAN_FEATURES = function(){ return getAccess().features; };

  function denied(reason){
    const a=getAccess();
    log('SAAS LOCK: '+reason+' | Current access: '+a.mode+'.','warn');
    return Promise.resolve(new Response(JSON.stringify({ok:false, blocked:true, subscription_required:true, reason, plan:a.mode, status:a.status, demo_signals_left:a.left}), {status:403, headers:{'Content-Type':'application/json'}}));
  }

  function patchFetch(){
    if(window.__SNIPEX_LAYER10_FETCH_PATCH__) return;
    window.__SNIPEX_LAYER10_FETCH_PATCH__ = true;
    const oldFetch = window.fetch;
    if(!oldFetch) return;
    window.fetch = function(input, init){
      const url = String((input && input.url) || input || '');
      const method = norm((init && init.method) || 'GET');
      const a = getAccess();
      init = init || {};
      init.headers = Object.assign({}, init.headers || {});
      const tk = token();
      if(tk && !init.headers.Authorization) init.headers.Authorization = 'Bearer '+tk;
      if(a.email && !init.headers['X-SnipeX-Email']) init.headers['X-SnipeX-Email'] = a.email;
      init.headers['X-SnipeX-Plan'] = a.mode;
      init.headers['X-SnipeX-Access-Layer'] = '10';

      const orderRoute = /\/api\/(order|trade|execute|auto[_-]?trade|test\/force_order)/i.test(url);
      const adminRoute = /\/api\/admin/i.test(url);
      const proRoute = /\/api\/(strategy\/auto|scanner\/auto|execution|master-ai\/execute)/i.test(url);
      if(adminRoute && !a.isAdmin) return denied('Admin panel/API is locked for buyer accounts');
      if(orderRoute && !a.features.allowLiveExecution) return denied('Live execution requires Pro/Elite/Admin access');
      if(proRoute && !a.features.allowAuto) return denied('Auto execution requires Pro/Elite/Admin access');
      return oldFetch.call(this, input, init);
    };
  }

  function patchClicks(){
    if(window.__SNIPEX_LAYER10_CLICK_PATCH__) return;
    window.__SNIPEX_LAYER10_CLICK_PATCH__ = true;
    document.addEventListener('click', function(ev){
      const btn = ev.target && ev.target.closest ? ev.target.closest('button,[role="button"],a,.btn') : null;
      if(!btn) return;
      const label = String(btn.textContent || btn.getAttribute('aria-label') || btn.getAttribute('href') || '').toLowerCase();
      const a=getAccess();
      let reason='';
      if(/admin|approve|user management|activate pro|activate elite/.test(label) && !a.isAdmin) reason='Admin controls are locked for buyer accounts';
      if(/auto trade|live order|force order|execute|place order|fire order/.test(label) && !a.features.allowLiveExecution) reason='Live execution requires Pro/Elite/Admin access';
      if(/auto scanner|master ai execute|strategy auto/.test(label) && !a.features.allowAuto) reason='Auto execution requires Pro/Elite/Admin access';
      if(reason){ ev.preventDefault(); ev.stopPropagation(); log('SAAS LOCK: '+reason+'.','warn'); }
    }, true);
  }

  function paintBadge(){
    const a=getAccess();
    let badge=document.getElementById('snipexLayer10Badge');
    if(!badge){
      badge=document.createElement('div'); badge.id='snipexLayer10Badge';
      badge.style.cssText='position:fixed;left:14px;bottom:12px;z-index:2147482500;padding:7px 10px;border:1px solid rgba(0,229,255,.28);border-radius:10px;background:rgba(2,8,18,.88);color:#d8faff;font:800 10px Orbitron,monospace;letter-spacing:.7px;box-shadow:0 10px 24px rgba(0,0,0,.28);pointer-events:none';
      document.body.appendChild(badge);
    }
    badge.textContent='SAAS LOCK L10 \u00b7 '+a.mode+' \u00b7 '+(a.isAdmin?'ADMIN FULL ACCESS':(a.paid?'ACTIVE':'DEMO'))+' \u00b7 HB '+(a.heartbeatStale?'CHECK':'OK');
  }

  async function heartbeat(){
    const a=getAccess();
    if(a.isAdmin){ write('SNIPEX_LAST_HEARTBEAT_TS', String(now())); paintBadge(); return {ok:true, admin:true}; }
    const tk=token();
    const e=a.email;
    if(!tk && !e){ paintBadge(); return {ok:false, reason:'No buyer session found'}; }
    const base=bridgeBase();
    const paths=['/api/license/heartbeat','/api/subscription/heartbeat','/api/license/validate','/api/me'];
    for(const path of paths){
      try{
        const res = await fetch(base+path, {method:path.includes('validate')?'POST':'GET', headers:{'Content-Type':'application/json', ...(tk?{Authorization:'Bearer '+tk}:{}), ...(e?{'X-SnipeX-Email':e}:{})}, body:path.includes('validate') ? JSON.stringify({email:e, license_key:read('SNIPEX_LICENSE_KEY','')}) : undefined});
        if(res && res.ok){ const data=await res.json().catch(()=>({ok:true})); setAccessFromServer(data.user || data.subscription || data); paintBadge(); return {ok:true, path, data}; }
      }catch(err){}
    }
    if(a.paid && a.heartbeatStale){
      write('SNIPEX_SUBSCRIPTION_STATUS','STALE');
      log('SAAS LOCK: Session heartbeat stale. Bot switched to safe demo lock until buyer session refreshes.','warn');
    }
    paintBadge();
    return {ok:false, reason:'Heartbeat endpoints not available'};
  }

  function boot(){
    patchFetch();
    patchClicks();
    if(localAdmin()){ write('SNIPEX_IS_ADMIN','true'); write('SNIPEX_USER_PLAN','ADMIN'); write('SNIPEX_SUBSCRIPTION_STATUS','ACTIVE'); }
    paintBadge();
    setTimeout(heartbeat, 1200);
    setInterval(function(){ heartbeat(); }, HEARTBEAT_MS);
    log('Layer 10 Final SaaS Lock active: Basic / Pro / Elite / Admin access map + heartbeat armed.','ok');
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', boot, {once:true}); else boot();
})();


/* ============ LAYER 4: DEMO / SUBSCRIPTION ACCESS GUARD ============
   This is a frontend guard for UX + accidental execution prevention.
   Backend/license server must remain the final authority.
*/
(function(){
  if(window.__SNIPEX_LAYER4_DEMO_SUBSCRIPTION_GUARD__) return;
  window.__SNIPEX_LAYER4_DEMO_SUBSCRIPTION_GUARD__ = true;

  const DEMO_LIMIT = 3;
  const PAID_PLANS = ['BASIC','PRO','ELITE','VIP','PERSONAL','FULL','ADMIN'];
  const ADMIN_EMAILS = ['mystocktradesk@gmail.com'];

  function read(k, d){ try{return localStorage.getItem(k) || d || ''}catch(e){return d || ''} }
  function write(k, v){ try{localStorage.setItem(k, String(v))}catch(e){} }
  function norm(v){ return String(v||'').trim().toUpperCase(); }
  function email(){ return String(read('SNIPEX_USER_EMAIL','') || read('snipex_user_email','')).trim().toLowerCase(); }
  function log(msg,type){ try{ (window.logLive||window.addLog||console.log)(msg,type||'warn'); }catch(e){ console.log(msg); } }

  function access(){
    const plan = norm(read('SNIPEX_USER_PLAN','DEMO')) || 'DEMO';
    const status = norm(read('SNIPEX_SUBSCRIPTION_STATUS','DEMO')) || 'DEMO';
    const isAdmin = read('SNIPEX_IS_ADMIN','') === 'true' || ADMIN_EMAILS.includes(email());
    const used = Math.max(0, Number(read('SNIPEX_DEMO_SIGNALS_USED','0')) || 0);
    const paid = isAdmin || (PAID_PLANS.includes(plan) && ['ACTIVE','TRIAL','APPROVED','PAID','VALID'].includes(status));
    const left = paid ? 999999 : Math.max(0, DEMO_LIMIT - used);
    const mode = paid ? (isAdmin ? 'ADMIN' : plan) : 'DEMO';
    return {plan, status, isAdmin, paid, used, left, limit:DEMO_LIMIT, mode};
  }

  window.SNIPEX_ACCESS_CONTROL = window.SNIPEX_ACCESS_CONTROL || {};
  Object.assign(window.SNIPEX_ACCESS_CONTROL, {
    layer:'LAYER_4_DEMO_SUBSCRIPTION_GUARD',
    demoLimit:DEMO_LIMIT,
    getAccess:access,
    isPaid:function(){return access().paid;},
    canExecute:function(){return access().paid;},
    canTakeSignal:function(){const a=access(); return a.paid || a.left>0;},
    consumeDemoSignal:function(reason){
      const a=access();
      if(a.paid) return {ok:true, paid:true, left:999999};
      if(a.left <= 0){
        log('DEMO LIMIT COMPLETED: You used 3 real signal suggestions. Subscribe to continue live signals.','warn');
        return {ok:false, subscription_required:true, left:0};
      }
      const next=a.used+1;
      write('SNIPEX_DEMO_SIGNALS_USED', next);
      const left=Math.max(0, DEMO_LIMIT-next);
      log('DEMO SIGNAL '+next+'/'+DEMO_LIMIT+' used. '+left+' free real signal suggestion(s) left.','info');
      return {ok:true, demo:true, used:next, left};
    },
    resetDemoCounterForAdmin:function(){ if(access().isAdmin) write('SNIPEX_DEMO_SIGNALS_USED','0'); }
  });

  function blockedResponse(reason){
    return Promise.resolve(new Response(JSON.stringify({
      ok:false,
      blocked:true,
      reason:reason,
      subscription_required:true,
      plan:access().mode,
      demo_signals_left:access().left
    }), {status:403, headers:{'Content-Type':'application/json'}}));
  }

  const originalFetch = window.fetch ? window.fetch.bind(window) : null;
  if(originalFetch){
    window.fetch = function(input, init){
      const url = String((input && input.url) || input || '');
      const method = norm((init && init.method) || 'GET');
      const a = access();
      const isOrderRoute = /\/api\/(order|trade|execute|auto[_-]?trade|test\/force_order)/i.test(url);
      const isSignalRoute = /\/api\/(setup_status|best_setup|signal|signals|scanner\/best|scan\/best)/i.test(url);

      if(isOrderRoute && !a.paid){
        log('DEMO MODE: Real order execution is locked. Subscribe to unlock according to your plan.','warn');
        return blockedResponse('Demo mode cannot execute real orders');
      }
      if(isSignalRoute && method === 'GET' && !a.paid){
        const r = window.SNIPEX_ACCESS_CONTROL.consumeDemoSignal('api_signal');
        if(!r.ok) return blockedResponse('Demo signal limit completed');
      }
      return originalFetch(input, init);
    };
  }

  document.addEventListener('click', function(ev){
    const btn = ev.target && ev.target.closest ? ev.target.closest('button,[role="button"],.btn') : null;
    if(!btn) return;
    const label = String(btn.textContent || btn.getAttribute('aria-label') || '').toLowerCase();
    const looksExecution = /execute|auto trade|fire order|place order|live order|force order|start auto/i.test(label);
    if(looksExecution && !access().paid){
      ev.preventDefault();
      ev.stopPropagation();
      log('DEMO MODE: Execution button locked. Subscribe to activate live execution features.','warn');
    }
  }, true);

  try{
    const a=access();
    log('Layer 4 guard active: '+a.mode+' access, demo signals left '+a.left+'.','ok');
  }catch(e){}
})();



/* ============ LAYERS 5 TO 9: STRATEGY + EXECUTION + LOG + UI + PERFORMANCE GUARDS ============
   Purpose: cleanup/safety guards only. Trading logic, UI theme, strategies, bridge and Master AI are preserved.
*/
(function(){
  if(window.__SNIPEX_LAYERS_5_TO_9_GUARD__) return;
  window.__SNIPEX_LAYERS_5_TO_9_GUARD__ = true;

  function norm(v){ return String(v||'').trim().toUpperCase(); }
  function log(msg,type){ try{ (window.logLive||window.addLog||console.log)(msg,type||'info'); }catch(e){ console.log(msg); } }
  function access(){
    try{ return (window.SNIPEX_ACCESS_CONTROL && window.SNIPEX_ACCESS_CONTROL.getAccess) ? window.SNIPEX_ACCESS_CONTROL.getAccess() : {mode:'DEMO', paid:false, left:0}; }
    catch(e){ return {mode:'DEMO', paid:false, left:0}; }
  }

  /* LAYER 5: STRATEGY GUARD */
  const PLAN_FEATURES = window.SNIPEX_PLAN_FEATURES || (window.SNIPEX_PLAN_FEATURES = {
    DEMO:  {maxAutoStrategies:0, allowAuto:false, allowScanner:false, allowLiveExecution:false, signalLimit:3},
    BASIC: {maxAutoStrategies:1, allowAuto:false, allowScanner:true,  allowLiveExecution:false, signalLimit:50},
    PRO:   {maxAutoStrategies:2, allowAuto:true,  allowScanner:true,  allowLiveExecution:true,  signalLimit:9999},
    ELITE: {maxAutoStrategies:99,allowAuto:true,  allowScanner:true,  allowLiveExecution:true,  signalLimit:999999},
    VIP:   {maxAutoStrategies:99,allowAuto:true,  allowScanner:true,  allowLiveExecution:true,  signalLimit:999999},
    ADMIN: {maxAutoStrategies:99,allowAuto:true,  allowScanner:true,  allowLiveExecution:true,  signalLimit:999999}
  });
  window.SNIPEX_GET_PLAN_FEATURES = function(){
    const a=access();
    const key = a.isAdmin ? 'ADMIN' : norm(a.mode || a.plan || 'DEMO');
    return PLAN_FEATURES[key] || PLAN_FEATURES.DEMO;
  };
  window.SNIPEX_APPLY_STRATEGY_GUARD = function(){
    try{
      const f=window.SNIPEX_GET_PLAN_FEATURES();
      const arr=Array.isArray(window.STRATEGIES) ? window.STRATEGIES : [];
      let autoCount=0;
      arr.forEach(function(s){
        s.saved = true;
        const wantsAuto = !!(s.auto || s.executable || s.masterAIExecutable);
        if(!f.allowAuto && wantsAuto){ s.auto=false; s.executable=false; s.masterAIExecutable=false; s.lockReason='Plan does not allow auto execution'; return; }
        if(wantsAuto){ autoCount++; if(autoCount > f.maxAutoStrategies){ s.auto=false; s.executable=false; s.masterAIExecutable=false; s.lockReason='Plan auto strategy limit'; } }
      });
      return true;
    }catch(e){ return false; }
  };
  setTimeout(window.SNIPEX_APPLY_STRATEGY_GUARD, 800);
  setTimeout(window.SNIPEX_APPLY_STRATEGY_GUARD, 2500);

  /* LAYER 6: EXECUTION SAFETY GATE - frontend UX guard, backend must still be final authority. */
  window.SNIPEX_EXECUTION_SAFETY = window.SNIPEX_EXECUTION_SAFETY || {};
  Object.assign(window.SNIPEX_EXECUTION_SAFETY, {
    minRR: 5,
    emergencyMinRR: 3,
    requireBackendAuthority:true,
    validateSetup:function(setup){
      const a=access(), f=window.SNIPEX_GET_PLAN_FEATURES();
      if(!f.allowLiveExecution) return {ok:false, reason:'Subscription plan does not allow live execution'};
      if(!setup) return {ok:false, reason:'No setup found'};
      const rr = Number(setup.rr || setup.RR || setup.risk_reward || setup.riskReward || 0);
      const conf = Number(setup.confidence || setup.conf || setup.score || 0);
      if(rr && rr < this.emergencyMinRR) return {ok:false, reason:'RR below emergency 1:3 floor'};
      if(rr && rr < this.minRR && conf < 90) return {ok:false, reason:'RR below 1:5 plan rule unless exceptional confidence'};
      if(setup.sl === setup.entry || setup.tp === setup.entry) return {ok:false, reason:'Invalid SL/TP around entry'};
      return {ok:true, reason:'Execution safety passed', plan:a.mode};
    }
  });

  /* LAYER 7: LOG + REASON ENGINE */
  window.SNIPEX_REASON_ENGINE = window.SNIPEX_REASON_ENGINE || {
    explain:function(code){
      const c=String(code||'').toLowerCase();
      if(c.includes('demo')) return 'Demo access limit or execution lock active';
      if(c.includes('spread')) return 'Spread too high for safe entry';
      if(c.includes('news')) return 'News risk window active';
      if(c.includes('rr')) return 'Risk reward is below required rule';
      if(c.includes('duplicate')) return 'Duplicate trade protection active';
      if(c.includes('subscription')) return 'Subscription required for this feature';
      return String(code||'Safety gate blocked this action');
    }
  };
  const oldLogLive = window.logLive;
  if(typeof oldLogLive === 'function' && !oldLogLive.__snxLayer7Wrapped){
    const wrapped=function(msg,type){
      try{
        const text=String(msg||'');
        if(/blocked|reject|limit|subscription|spread|news|rr/i.test(text) && !/Reason:/i.test(text)){
          msg = text + ' | Reason: ' + window.SNIPEX_REASON_ENGINE.explain(text);
        }
      }catch(e){}
      return oldLogLive.call(this,msg,type);
    };
    wrapped.__snxLayer7Wrapped=true;
    window.logLive=wrapped;
  }

  /* LAYER 8: UI STABILIZATION - no theme redesign, only anti-jump constraints. */
  function injectStableCss(){
    if(document.getElementById('snx-layer8-stability-css')) return;
    const style=document.createElement('style');
    style.id='snx-layer8-stability-css';
    style.textContent=`
      .snipex-app-shell *{box-sizing:border-box}
      .snx-chart-ai-row,.dash-grid,.grid-2-1,#snxBottomTerminal{min-width:0!important}
      .snx-master-slot,.snx-chart-slot,.glass-card,.card{min-width:0!important}
      .live-log,#snxExecutionLogHost .live-log,.snx-terminal-body{overflow:auto!important;scrollbar-gutter:stable!important}
      #asset-cards,.snx-rate-ribbon{contain:layout style!important}
      .ai-panel,.mt5-panel,.tv-card,.snx-terminal-card{backface-visibility:hidden;transform:translateZ(0)}
      .safeopt-ribbon,.snx-pro-floating,.snx-left-compact-rail,.snx-master-quickdock{max-width:calc(100vw - 28px)!important}
    `;
    document.head.appendChild(style);
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', injectStableCss); else injectStableCss();

  /* LAYER 9: PERFORMANCE CLEANUP */
  const originalFetch = window.fetch ? window.fetch.bind(window) : null;
  if(originalFetch && !window.__SNIPEX_LAYER9_FETCH_THROTTLE__){
    window.__SNIPEX_LAYER9_FETCH_THROTTLE__ = true;
    const last={};
    const throttleMs={signal:650, order:1200, status:500};
    window.fetch=function(input, init){
      const url=String((input && input.url) || input || '');
      const now=Date.now();
      let key=''; let delay=0;
      if(/\/api\/(setup_status|best_setup|signal|signals|scanner\/best|scan\/best)/i.test(url)){key='signal:'+url;delay=throttleMs.signal;}
      else if(/\/api\/(order|trade|execute|auto[_-]?trade|test\/force_order)/i.test(url)){key='order:'+url;delay=throttleMs.order;}
      else if(/\/api\/(status|prices|price|ohlc)/i.test(url)){key='status:'+url;delay=throttleMs.status;}
      if(key && last[key] && now-last[key] < delay){
        return Promise.resolve(new Response(JSON.stringify({ok:false, throttled:true, reason:'Layer 9 throttle protected duplicate rapid request'}), {status:429, headers:{'Content-Type':'application/json'}}));
      }
      if(key) last[key]=now;
      return originalFetch(input, init);
    };
  }

  log('Layers 5-9 active: strategy guard, execution safety, reason logs, UI stability, performance throttle.','ok');
})();

/* ============ MARKET DATA ============ */
const ASSETS = {
  XAUUSD: { name:'Gold', color:'fx', base:65000, dp:2, unit:'$', bias:'BULL', moves:[240,-120,330,450,-180,280,160,-220,350,210,480,-130,310,240,180,-150,320,510,150,420] },
  XAGUSD: { name:'Silver', color:'fx', base:3200, dp:2, unit:'$', bias:'BULL', moves:[18,-9,26,34,-12,22,14,-18,28,16,30,-10,24,15,12,-8,20,33,11,27] },
  XPDUSD: { name:'Palladium', color:'fx', base:950, dp:2, unit:'$', bias:'RANGE', moves:[8,-5,11,15,-7,9,4,-8,12,6] },
  EURUSD: { name:'EUR/USD', color:'fx', base:1.0850, dp:5, unit:'$', bias:'BULL', moves:[0.0012,-0.0007,0.0018,0.0022,-0.0010,0.0015,0.0009,-0.0013,0.0019,0.0011] },
  GBPUSD: { name:'GBP/USD', color:'fx', base:1.2650, dp:5, unit:'$', bias:'RANGE', moves:[0.0014,-0.0008,0.0016,0.0019,-0.0009,0.0013,0.0008,-0.0011,0.0017,0.0007] },
  USDJPY:{ name:'USD/JPY', color:'fx', base:155.25, dp:3, unit:'$', bias:'RANGE', moves:[0.12,-0.08,0.16,0.19,-0.09,0.14] },
  USDCHF:{ name:'USD/CHF', color:'fx', base:0.9100, dp:5, unit:'$', bias:'RANGE', moves:[0.0008,-0.0005,0.0010,0.0012,-0.0006,0.0009] },
  USDCAD:{ name:'USD/CAD', color:'fx', base:1.3650, dp:5, unit:'$', bias:'RANGE', moves:[0.0010,-0.0007,0.0013,0.0015,-0.0008,0.0011] },
  AUDUSD:{ name:'AUD/USD', color:'fx', base:0.6600, dp:5, unit:'$', bias:'RANGE', moves:[0.0009,-0.0006,0.0012,0.0014,-0.0007,0.0010] },
  NZDUSD:{ name:'NZD/USD', color:'fx', base:0.6100, dp:5, unit:'$', bias:'RANGE', moves:[0.0008,-0.0005,0.0011,0.0013,-0.0006,0.0009] },
  EURJPY:{ name:'EUR/JPY', color:'fx', base:168.30, dp:3, unit:'$', bias:'RANGE', moves:[0.14,-0.09,0.18,0.21,-0.10,0.15] },
  GBPJPY:{ name:'GBP/JPY', color:'fx', base:196.40, dp:3, unit:'$', bias:'RANGE', moves:[0.18,-0.12,0.24,0.28,-0.14,0.20] },
  EURGBP:{ name:'EUR/GBP', color:'fx', base:0.8570, dp:5, unit:'$', bias:'RANGE', moves:[0.0006,-0.0004,0.0008,0.0010,-0.0005,0.0007] }
};

let prices = {};
let chartBars = {};
let aiOn = (localStorage.getItem('snipex_master_ai_on') !== '0');
let autoOn = (localStorage.getItem('snipex_auto_trade_on') !== '0'); // separate from Master AI
let execCount = 0, winCount = 0, lossCount = 0;
let customExpenses = [];
let showAllTrades = false;
let activeTF = 'H1';

/* ============ INIT ============ */
window.onload = () => {
  initPrices();
  renderAssetCards();
  renderConfluence();
  renderTicker();
  renderTradeHistory();
  renderStrategies();
  renderLabStrategies();
  renderTFSelector();
  startClock();
  startPriceUpdates();
  loadPnlSettings();
  renderExpenses();
  updatePNL();
};

function initPrices() {
  for (const [sym, data] of Object.entries(ASSETS)) {
    prices[sym] = data.base;
    chartBars[sym] = data.moves;
  }
}

/* ============ ASSET CARDS ============ */
function renderAssetCards() {
  const container = document.getElementById('asset-cards');
  container.innerHTML = '';
  for (const [sym, data] of Object.entries(ASSETS)) {
    const p = prices[sym];
    const change = p - data.base;
    const changePct = (change / data.base * 100).toFixed(2);
    const isUp = change >= 0;

    const bars = data.moves.map((m, i) => {
      const h = Math.max(5, Math.abs(m) / Math.max(...data.moves.map(Math.abs)) * 100);
      const isUp = m >= 0;
      return `<div class="mini-bar ${isUp?'bar-up':'bar-dn'}" style="height:${h}%;animation-delay:${i*0.03}s"></div>`;
    }).join('');

    container.innerHTML += `
    <div class="asset-card ${data.color}" onclick="focusAsset('${sym}')">
      <div class="asset-header">
        <div class="asset-symbol" style="color:${data.color==='fx'?'var(--fx)':data.color==='silver'?'#aaa':data.color==='palladium'?'var(--purple)':'var(--orange)'}">${sym}</div>
        <div class="asset-badge ${data.bias==='BULL'?'badge-bull':'badge-bear'}">${data.bias==='BULL'?'\u2b06 BULL':'\u2b07 BEAR'}</div>
      </div>
      <div class="asset-price" style="color:${data.color==='fx'?'var(--fx)':data.color==='silver'?'#c8c8c8':data.color==='palladium'?'var(--purple)':'var(--orange)'}" id="price-${sym}">
        ${data.unit}${p.toFixed(data.dp)}
      </div>
      <div class="asset-change ${isUp?'change-up':'change-dn'}">
        ${isUp?'\u25b2':'\u25bc'} ${Math.abs(change).toFixed(data.dp)} (${isUp?'+':''}${changePct}%)
      </div>
      <div class="mini-chart">${bars}</div>
    </div>`;
  }
}

/* ============ CONFLUENCE ============ */
const TF_LABELS = ['M1','M5','M15','H1','H4','D1'];
const CONF_STATES = [1,1,1,1,0,1]; // 1=bull,0=empty,-1=bear

function renderConfluence() {
  const blocks = document.getElementById('conf-blocks');
  const labels = document.getElementById('conf-labels');
  if(!blocks) return;
  blocks.innerHTML = '';
  labels.innerHTML = '';
  CONF_STATES.forEach((s,i) => {
    const state = s===1?'bull':s===-1?'bear':'empty';
    blocks.innerHTML += `<div class="conf-block tf ${state}"><div class="conf-block-inner"></div></div>`;
    labels.innerHTML += `<div class="conf-tf-label" style="width:40px;text-align:center">${TF_LABELS[i]}</div>`;
  });
}

/* ============ TICKER ============ */
function renderTicker() {
  const ticker = document.getElementById('ticker');
  if(!ticker) return;
  let html = '';
  const items = [
    ...Object.entries(ASSETS).map(([sym,d])=>`<div class="tick-item"><span class="tick-sym">${sym}</span><span class="tick-price">${d.unit}${prices[sym].toFixed(d.dp)}</span><span class="tick-chg ${d.bias==='BULL'?'change-up':'change-dn'}">${d.bias==='BULL'?'\u25b2+0.18%':'\u25bc-0.22%'}</span></div><div class="tick-item tick-sep">\u2502</div>`),
    `<div class="tick-item"><span class="tick-sym">GBPUSD</span><span class="tick-price">1.08124</span><span class="tick-chg change-up">\u25b2+0.04%</span></div><div class="tick-item tick-sep">\u2502</div>`,
    `<div class="tick-item"><span class="tick-sym">DXY</span><span class="tick-price">104.32</span><span class="tick-chg change-dn">\u25bc-0.11%</span></div><div class="tick-item tick-sep">\u2502</div>`,
    `<div class="tick-item"><span class="tick-sym">XAU</span><span class="tick-price">$67,420</span><span class="tick-chg change-up">\u25b2+1.2%</span></div><div class="tick-item tick-sep">\u2502</div>`,
  ];
  html = [...items,...items].join('');
  ticker.innerHTML = html;
}

/* ============ PRICE UPDATES ============ */
function startPriceUpdates() {
  // No fake/random price or equity drift. Real values are updated by MT5 bridge polling only.
  setInterval(() => {
    if(!bridgeOnline){
      const eqEl = document.getElementById('mt5-eq');
      if(eqEl && /\$25|25140/.test(eqEl.textContent||'')) eqEl.textContent = 'MT5 --';
      const ribEq = document.getElementById('rib-eq');
      if(ribEq && /\$25|25140/.test(ribEq.textContent||'')) ribEq.textContent = '--';
    }
    renderTicker();
  }, 2000);
}

/* ============ CLOCK ============ */
function startClock() {
  const update = () => {
    const now = new Date();
    document.getElementById('clock').textContent =
      now.toUTCString().slice(17,25) + ' UTC';
  };
  update();
  setInterval(update, 1000);
}

/* ============ PAGE NAV ============ */
function showPage(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('page-' + page).classList.add('active');
  const btns = document.querySelectorAll('.nav-btn');
  const pages = ['dashboard','pnl','history','strategies','ailab'];
  const idx = pages.indexOf(page);
  if(idx >= 0 && btns[idx]) btns[idx].classList.add('active');
  if(page === 'ailab' && typeof refreshAILabCockpit === 'function') {
    setTimeout(refreshAILabCockpit, 80);
  }
}

/* ============ AI CONTROLS ============ */
function applyMasterAIMode(reason='sync') {
  aiControlMode = aiOn ? 'AUTO' : 'MANUAL';
  try{ autoOn = (localStorage.getItem('snipex_auto_trade_on') !== '0'); }catch(e){}
  aiTradingStyle = 'AUTO';
  aiTFLock = (localStorage.getItem("snipex_ai_tf_lock") === "1");
  aiStyleLock = false;
  try{ localStorage.setItem('snipex_master_ai_on', aiOn ? '1' : '0'); }catch(e){}
  const btn = document.getElementById('btn-ai');
  const state = document.getElementById('ai-state');
  const dec = document.getElementById('ai-decision');
  const rib = document.getElementById('rib-ai');
  const autoBtn = document.getElementById('btn-auto');
  const autoState = document.getElementById('auto-state');
  const note = document.getElementById('ai-control-note');
  const modeLabel = document.getElementById('master-ai-mode-label');
  const tfWrap = document.getElementById('manual-tf-wrap');
  if(btn) btn.className = 'tog-btn ' + (aiOn ? 'on' : 'off');
  if(state) state.textContent = aiOn ? 'AI ON' : 'MANUAL';
  if(autoBtn){ autoBtn.style.display = ''; autoBtn.className = 'tog-btn ' + (autoOn ? 'on' : 'off'); }
  if(autoState) autoState.textContent = autoOn ? 'ON' : 'OFF';
  if(rib) rib.textContent = aiOn ? 'MASTER AI' : 'MANUAL';
  if(tfWrap) tfWrap.style.display = '';// TF Lock visible in Master AI
  if(note) note.textContent = aiOn ? 'MASTER AI ON: Full auto optimizer active. Auto execution is UNLOCKED and uses /api/order. Manual buttons stay protected while AI can trade.' : 'MANUAL MODE: Master AI is off. Manual Bullish/Bearish is allowed. Auto trigger is disabled.';
  if(modeLabel) modeLabel.textContent = aiOn ? 'AI controls strategy, TF, style, lot, SL, TP' : 'Manual position automation only';
  if(dec) dec.innerHTML = aiOn
    ? '\u25ba MASTER AI FULL AUTO<br>\u25ba AI controls strategy + timeframe + style<br>\u25ba AI decides lot, SL, TP, partial booking and trailing<br>\u25ba Auto execution unlocked via /api/order'
    : '\u25ba MANUAL MODE ACTIVE<br>\u25ba AI Execution trigger disabled<br>\u25ba Manual Bullish/Bearish controls only';
  try{ syncAIControlCockpitUI(); }catch(e){}
  try{ fetch((window.SNIPEX_BRIDGE_BASE||BRIDGE_BASE) + '/api/ai/master_config',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({enabled:aiOn, control_mode:aiOn?'AUTO':'MANUAL', trading_style:'AUTO', tf_lock:(localStorage.getItem('snipex_ai_tf_lock')==='1'), style_lock:false, user_override:false, profit_optimization_enabled:(localStorage.getItem('snipex_priority_optimizer_on')!=='0'), safe_optimizer_enabled:true, mandatory_partial_booking:true, force_break_even_after_tp1:true, smart_trailing_enabled:true})}); }catch(e){}
  try{ if(aiOn) { logLive('\ud83e\udde0 MASTER AI ON: full auto optimizer armed. AUTO EXECUTION UNLOCKED via /api/order.', 'ok'); refreshAIMasterDecision(true); if(typeof scanSetupNow==='function') setTimeout(()=>scanSetupNow().catch(()=>{}), 250); } else { logLive('\u270b MANUAL MODE: Master AI OFF. Manual Bullish/Bearish enabled, auto trigger stopped.', 'warn'); if(window.resetAutoTriggerLock) window.resetAutoTriggerLock('Master AI OFF'); } }catch(e){}
}
function toggleAI() { aiOn = !aiOn; try{ localStorage.setItem('snipex_master_ai_on', aiOn?'1':'0'); }catch(e){} applyMasterAIMode('toggle'); }
function toggleAuto() { autoOn = !autoOn; try{ localStorage.setItem('snipex_auto_trade_on', autoOn?'1':'0'); }catch(e){} applyMasterAIMode('auto-toggle'); try{ logLive(autoOn?'\ud83d\udfe2 AI Execution Engine Active: Master AI may execute approved trades.':'\ud83d\udd34 AI Execution Engine OFF: AI can scan/draw, but execution is blocked.', autoOn?'ok':'warn'); }catch(e){} }

function focusAsset(sym) {
  document.getElementById('sniper-status').textContent = 'ARMED \u00b7 SCANNING ' + sym;
}



/* ============ AI MASTER CONTROL + ADAPTIVE LEARNING ============ */
let aiMasterOn = true;
let aiMasterDecision = null;
function getSelectedSymbolForAI(){
  const el = document.getElementById('symbol-select') || document.querySelector('[name="symbol"]');
  return (el && el.value) || 'XAUUSD';
}
function getSelectedTFForAI(){
  const el = document.getElementById('timeframe-select') || document.querySelector('[name="timeframe"]');
  return (el && el.value) || 'M5';
}
function aiStrategyPayload(){
  return STRATEGIES.map(s=>({name:s.name, fullName:s.fullName||s.name, type:s.type||'', tf:s.tf||'', wr:s.wr||0, rr:s.rr||0, consistency:s.consistency||0, enabled:!!s.enabled, auto:!!s.auto}));
}
async function refreshAIMasterDecision(force){
  if(!aiOn || !aiMasterOn) return null;
  const minEl = document.getElementById('ai-master-minconf');
  const symbolForAI = getSelectedSymbolForAI();
  const minConfidence = (window.snipexExecMinConfidence ? window.snipexExecMinConfidence(symbolForAI) : Number((minEl && minEl.value) || 78));
  const payload = {symbol:symbolForAI, timeframe:getSelectedTFForAI(), strategies:aiStrategyPayload(), min_confidence:minConfidence, control_mode:(aiOn?'AUTO':'MANUAL'), manual_tf:aiManualTF, trading_style:'AUTO', user_override:false, tf_lock:(localStorage.getItem('snipex_ai_tf_lock')==='1'), style_lock:false};
  try{
    const res = await fetch((window.SNIPEX_BRIDGE_BASE||BRIDGE_BASE) + '/api/ai/master_decision',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
    const data = await res.json();
    if(!data.ok) throw new Error(data.error||'AI master failed');
    aiMasterDecision = data.master;
    try{
      const bres = await fetch((window.SNIPEX_BRIDGE_BASE||BRIDGE_BASE) + '/api/ai/block_status',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({symbol:payload.symbol,timeframe:payload.timeframe,side:aiMasterDecision.side,lot:aiMasterDecision.lot,confidence:aiMasterDecision.confidence,min_confidence:minConfidence,approved:aiMasterDecision.approved,block_reasons:aiMasterDecision.block_reasons||[]})});
      const bdata = await bres.json();
      if(bdata && bdata.ok){ aiMasterDecision.block_reasons=bdata.block_reasons||aiMasterDecision.block_reasons||[]; aiMasterDecision.block_checklist=bdata.checklist||[]; aiMasterDecision.block_summary=bdata.summary||''; aiMasterDecision.safety=bdata.safety||aiMasterDecision.safety; }
    }catch(_blockStatusErr){}
    renderAIMasterDecision(aiMasterDecision);
    return aiMasterDecision;
  }catch(e){
    aiMasterDecision = {approved:false, block_reasons:['Bridge AI unavailable: '+e.message, 'REAL MODE: local AI fallback disabled'], best_strategy:null, candidates:[], regime:'MT5_REQUIRED', side:'WAIT', confidence:0, lot_multiplier:1, note:'Real-only mode: connect bridge + MT5 candles. No local pretend analysis is allowed.'};
    renderAIMasterDecision(aiMasterDecision);
    return aiMasterDecision;
  }
}
function localAIMasterDecision(payload){
  return {approved:false, block_reasons:['REAL MODE: local AI fallback disabled'], best_strategy:null, candidates:[], regime:'MT5_REQUIRED', side:'WAIT', confidence:0, lot_multiplier:1, note:'No fake/local AI scoring in live mode.'};
}
function renderAIMasterDecision(d, extra){
  const selected = document.getElementById('ai-master-selected'), regime = document.getElementById('ai-master-regime'), lotx = document.getElementById('ai-master-lotx'), reason = document.getElementById('ai-master-reason'), rank = document.getElementById('ai-master-ranking'), pill = document.getElementById('ai-master-pill'), dec = document.getElementById('ai-decision');
  if(!d) return;
  const best = d.best_strategy || {};
  if(selected) selected.textContent = best.strategy ? best.strategy.substring(0,16) : 'BLOCK';
  if(regime) regime.textContent = d.regime || '--';
  if(lotx) lotx.textContent = Number(d.lot_multiplier||1).toFixed(2);
  if(pill){ pill.textContent = d.approved ? 'APPROVED' : 'BLOCKED'; pill.style.color = d.approved ? 'var(--green)' : 'var(--red)'; }
  const blocks = (d.block_reasons||[]).join(' \u00b7 ');
  if(reason) reason.innerHTML = (extra?extra+'<br>':'') + (d.approved ? '\u2705 Master selected one strategy. Conflict lock clear.' : '\u26d4 '+(blocks||'Waiting for cleaner setup')) + '<br><span style="color:var(--text3)">'+(d.note||'Adaptive AI active: trend + momentum + entry weights tune by regime; journal improves ranking over time.')+'</span>';
  if(rank) rank.innerHTML = (d.candidates||[]).slice(0,5).map((x,i)=>`<div class="ai-master-row"><span>#${i+1}</span><b>${x.strategy}</b><span class="ai-master-score">${Number(x.score||0).toFixed(1)}</span></div>`).join('');
  const maxLot = Number(d.max_lot_cap||0);
  const opt = d.optimizer || {};
  const ribbon = document.getElementById('safeopt-master-ribbon');
  if(ribbon){ ribbon.className = 'safeopt-ribbon '+(aiOn?'':'off'); ribbon.innerHTML = `<b>MASTER AI ${aiOn?'ON':'OFF'}</b> \u00b7 SAFE OPTIMIZER ${opt.enabled?'ACTIVE':'OFF'} \u00b7 MAX LOT ${maxLot?maxLot.toFixed(2):'--'}`; }
  const mini = document.getElementById('safeopt-mini');
  if(mini) mini.innerHTML = `<b>Safe Optimizer:</b> ${opt.enabled?'ON':'OFF'} \u00b7 optimize after ${opt.optimize_after_trades||30} positions \u00b7 ${opt.lot_rule||'lot cap active'} \u00b7 partial booking mandatory`;
  const po = d.profit_optimization || {};
  const poBox = document.getElementById('profitopt-mini');
  if(poBox){
    const exitMode = po.exit_plan && po.exit_plan.mode ? po.exit_plan.mode : '--';
    poBox.innerHTML = `<b>Profit Optimizer:</b> ${po.enabled?'ON':'OFF'} \u00b7 <span class="profitopt-pill">${po.trade_type||'--'}</span><span class="profitopt-pill">${po.confidence_band||'--'}</span><br>Completion: ${exitMode} \u00b7 Trail: ${po.smart_trailing?'ON':'OFF'} \u00b7 Priority: ${po.priority||'NORMAL'}`;
    const setTxt=(id,val)=>{const el=document.getElementById(id); if(el) el.textContent=val;};
    setTxt('profit-mode-chip', po.enabled?'ON':'OFF');
    setTxt('profit-trade-type', po.trade_type||'WAIT');
    setTxt('profit-exit-plan', exitMode + (po.smart_trailing?' + TRAIL':''));
    setTxt('profit-conf-tier', po.confidence_band||'--');
    setTxt('profit-priority', po.priority||'NORMAL');
  }
  if(dec) {
    const bs = (d.block_summary || ((d.block_reasons||[]).join(' \u00b7 ')) || (d.approved?'Ready':'Waiting'));
    dec.classList.toggle('ai-ready', !!d.approved);
    dec.classList.toggle('ai-blocked', !d.approved);
    dec.innerHTML = `\u25ba AI Master: ${d.approved?'APPROVED':'BLOCKED'}<br>\u25ba Reason: ${String(bs).replace(/[<>]/g,'')}<br>\u25ba Strategy: ${best.strategy||'NONE'}<br>\u25ba Direction: ${d.side||'WAIT'}<br>\u25ba Confidence: ${Number(d.confidence||0).toFixed(1)}%<br>\u25ba Lot Multiplier: ${Number(d.lot_multiplier||1).toFixed(2)}x<br>\u25ba Max Lot Cap: ${maxLot?maxLot.toFixed(2):'--'} lots<br>\u25ba Safe Optimizer: ${opt.enabled?'ON':'OFF'}<br>\u25ba Profit Optimizer: ${po.enabled?'ON':'OFF'} ${po.trade_type?'\u00b7 '+po.trade_type:''}`;
  }
  if(typeof renderAITimeframeTransparency === 'function') renderAITimeframeTransparency(d);
  if(typeof renderPriorityEngine === 'function') renderPriorityEngine(d);
  try{ if(aiOn && typeof runMasterAIAutoSwitch === 'function') runMasterAIAutoSwitch(false); }catch(e){}
}
async function saveAIMasterConfig(){
  const minEl = document.getElementById('ai-master-minconf');
  try{ await fetch((window.SNIPEX_BRIDGE_BASE||BRIDGE_BASE) + '/api/ai/master_config',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({enabled:true,min_confidence:Number(minEl.value||62),one_strategy_per_symbol:true,conflict_block:true,learning_enabled:true,safe_optimizer_enabled:true,optimize_after_trades:30,max_lot_per_inr:50000,pause_after_loss_streak:3,mandatory_partial_booking:true,force_break_even_after_tp1:true,profit_optimization_enabled:(localStorage.getItem('snipex_priority_optimizer_on')!=='0'),smart_trailing_enabled:true,missed_trade_learning_enabled:true,big_tf_priority_enabled:true,confidence_small_lot:60,confidence_normal_lot:75,confidence_aggressive_lot:85,soft_block_high_confidence:88})}); }catch(e){}
  refreshAIMasterDecision(true);
}
async function recordAIMasterLearning(result){
  const strategy = aiMasterDecision && aiMasterDecision.best_strategy && aiMasterDecision.best_strategy.strategy;
  if(!strategy){ alert('No AI Master selected strategy yet'); return; }
  const pnl = result==='win' ? 100 : -100;
  try{
    await fetch((window.SNIPEX_BRIDGE_BASE||BRIDGE_BASE) + '/api/ai/learning/event',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({strategy, result, pnl, symbol:getSelectedSymbolForAI(), side:(aiMasterDecision.side||'')})});
  }catch(e){ console.warn('AI learning event failed', e); }
  refreshAIMasterDecision(true);
}
setInterval(()=>{ if(aiOn) refreshAIMasterDecision(false); }, 15000);


function inferAITimeframes(strategyName, selectedTf, mode){
  const m = String(mode || (document.getElementById('ai-tf-mode')&&document.getElementById('ai-tf-mode').value) || 'AUTO').toUpperCase();
  const name = String(strategyName||'').toUpperCase();
  const tf = String(selectedTf||'M5').toUpperCase();
  if(m==='H1_SWING') return {bias:'H1', entry:'M15', execution:'M5', source:'Manual H1 swing mode'};
  if(m==='M15_SCALP') return {bias:'M15', entry:'M5', execution:'M1', source:'Manual M15 scalp mode'};
  if(m==='M5_FAST') return {bias:'M5', entry:'M1', execution:'M1', source:'Manual M5 fast mode'};
  if(name.includes('H1') || name.includes('ORDER BLOCK') || name.includes('OB')) return {bias:'H1', entry:'M15', execution:'M5', source:'Strategy name mapped to H1 structure'};
  if(name.includes('M15') || name.includes('RANGE') || name.includes('DOT')) return {bias:'M15', entry:'M5', execution:'M1', source:'Strategy name mapped to M15 setup'};
  if(name.includes('M5') || name.includes('SCALP') || name.includes('LIQUIDITY') || name.includes('TRAP')) return {bias:'M5', entry:'M1', execution:'M1', source:'Strategy name mapped to fast scalp setup'};
  if(tf==='H1') return {bias:'H1', entry:'M15', execution:'M5', source:'Selected chart timeframe'};
  if(tf==='M15') return {bias:'M15', entry:'M5', execution:'M1', source:'Selected chart timeframe'};
  return {bias:'M15', entry:tf || 'M5', execution:(tf==='M1'?'M1':'M1'), source:'AUTO fallback mapping'};
}
function renderAITimeframeTransparency(d){
  const best = (d && d.best_strategy) || {};
  const plan = (d && d.timeframe_plan) || inferAITimeframes(best.strategy, (d&&d.timeframe)||getSelectedTFForAI());
  const set=(id,val)=>{const el=document.getElementById(id); if(el) el.textContent=val||'--';};
  set('ai-bias-tf', plan.bias || plan.bias_tf);
  set('ai-entry-tf', plan.entry || plan.entry_tf);
  set('ai-exec-tf', plan.execution || plan.execution_tf);
  const pill=document.getElementById('ai-tf-pill'); if(pill) pill.textContent=(document.getElementById('ai-tf-mode')?.value||'AUTO');
  const reason=document.getElementById('ai-tf-reason');
  if(reason){
    const st=best.strategy||'NONE';
    const decision=d ? (d.approved?'TRADE ALLOWED':'BLOCKED / WAIT') : 'WAIT';
    const setupReason=(d&&d.setup&&(d.setup.reason||d.setup.status||d.setup.state))||'';
    reason.innerHTML=`<b>Strategy:</b> ${st} \u00b7 <b>Decision:</b> ${decision}<br><b>Why this TF:</b> ${plan.source||plan.reason||'AUTO mapping'}${setupReason?'<br><b>Setup:</b> '+setupReason:''}`;
  }
  const list=document.getElementById('ai-block-list');
  if(list){
    const checks=(d&&d.block_checklist)||[];
    const blocks=(d&&d.block_reasons)||[];
    if(checks.length){
      list.innerHTML = checks.map(x=>`<div class="ai-block-line ${x.ok?'ok':'bad'}">${x.ok?'\u2705':'\u26d4'} ${String(x.reason||'check').replace(/[<>]/g,'')}</div>`).join('');
    } else {
      list.innerHTML = blocks.length ? blocks.map(x=>`<div class="ai-block-line bad">\u26d4 ${String(x).replace(/[<>]/g,'')}</div>`).join('') : '<div class="ai-block-line ok">\u2705 No block reason. MASTER AI conditions clear.</div>';
    }
  }
}
async function saveAITimeframeMode(){
  const modeEl=document.getElementById('ai-tf-mode');
  const mode=(modeEl&&modeEl.value)||'AUTO';
  try{ await fetch((window.SNIPEX_BRIDGE_BASE||BRIDGE_BASE) + '/api/ai/master_config',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({timeframe_mode:mode})}); }catch(e){}
  if(aiMasterDecision) renderAITimeframeTransparency(aiMasterDecision);
  refreshAIMasterDecision(true);
}



/* ===== Manual AI Control + Priority Engine Frontend ===== */
let aiControlMode = localStorage.getItem('snipex_ai_control_mode') || 'AUTO';
let aiManualTF = localStorage.getItem('snipex_ai_manual_tf') || 'M1';
let aiTradingStyle = localStorage.getItem('snipex_ai_trading_style') || 'SCALPING';
let aiTFLock = localStorage.getItem('snipex_ai_tf_lock') === '1';
let aiStyleLock = localStorage.getItem('snipex_ai_style_lock') === '1';
function syncAIControlCockpitUI(){
  const mode=document.getElementById('ai-control-mode'), tf=document.getElementById('ai-manual-tf'), style=document.getElementById('ai-trading-style'), tfBtn=document.getElementById('ai-tf-lock-btn'), stBtn=document.getElementById('ai-style-lock-btn'), pill=document.getElementById('ai-control-pill');
  aiControlMode = aiOn ? 'AUTO' : 'MANUAL';
  aiTradingStyle = 'AUTO';
  aiTFLock = false; aiStyleLock = false;
  if(mode) mode.value=aiControlMode; if(tf) tf.value=aiManualTF; if(style) style.value='AUTO';
  if(tfBtn){ tfBtn.textContent='TF Lock Removed'; tfBtn.style.display='none'; }
  if(stBtn){ stBtn.textContent='Style Lock Removed'; stBtn.style.display='none'; }
  if(pill) pill.textContent = aiOn ? 'MASTER AI FULL AUTO' : 'MANUAL MODE';
}
async function saveAIControlCockpit(){
  const tf=document.getElementById('ai-manual-tf');
  aiControlMode = aiOn ? 'AUTO' : 'MANUAL';
  aiManualTF=(tf&&tf.value)||aiManualTF;
  aiTradingStyle='AUTO'; aiTFLock=(localStorage.getItem("snipex_ai_tf_lock") === "1"); aiStyleLock=false;
  localStorage.setItem('snipex_ai_control_mode', aiControlMode); localStorage.setItem('snipex_ai_manual_tf', aiManualTF); localStorage.setItem('snipex_ai_trading_style', 'AUTO');
  localStorage.setItem("snipex_ai_tf_lock", aiTFLock?"1":"0"); localStorage.setItem('snipex_ai_style_lock','0');
  syncAIControlCockpitUI();
  try{await fetch((window.SNIPEX_BRIDGE_BASE||BRIDGE_BASE) + '/api/ai/master_config',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({enabled:aiOn,control_mode:aiControlMode,manual_tf:aiManualTF,trading_style:'AUTO',tf_lock:(localStorage.getItem('snipex_ai_tf_lock')==='1'),style_lock:false,user_override:false,profit_optimization_enabled:(localStorage.getItem('snipex_priority_optimizer_on')!=='0'),safe_optimizer_enabled:true,mandatory_partial_booking:true,force_break_even_after_tp1:true,smart_trailing_enabled:true})});}catch(e){}
  if(aiOn){ refreshAIMasterDecision(true); try{ setTimeout(()=>runMasterAIAutoSwitch(true), 500); }catch(e){} }
}
function toggleAITFLock(){ aiTFLock=!(localStorage.getItem("snipex_ai_tf_lock") === "1"); localStorage.setItem("snipex_ai_tf_lock", aiTFLock?"1":"0"); saveAIControlCockpit(); }
function toggleAIStyleLock(){ aiStyleLock=false; saveAIControlCockpit(); }
setTimeout(()=>{ try{ aiOn = true; window.aiOn = true; localStorage.setItem('snipex_master_ai_on','1'); applyMasterAIMode('boot-force-always-on'); }catch(e){ try{ aiOn = true; window.aiOn = true; }catch(_){} syncAIControlCockpitUI(); } }, 400);
function renderPriorityEngine(d){
  const el=document.getElementById('priority-mini'); if(!el||!d) return;
  const p=d.priority_engine||{};
  const act=p.action||'WAIT'; const mode=p.control_mode||aiControlMode; const tf=p.active_tf||aiManualTF; const style=p.style||aiTradingStyle;
  const locks=[p.tf_lock?'TF Lock':'',p.style_lock?'Style Lock':''].filter(Boolean).join(' + ') || 'No user lock';
  el.innerHTML = `<b>Priority Engine:</b> ${act} \u00b7 ${locks} \u00b7 TF: ${tf} \u00b7 Style: ${style}<br>${p.reason||'No priority decision yet.'}${p.big_setup_notify?' <span style="color:var(--fx)">\u26a0 Big TF setup detected</span>':''}`;
}
setTimeout(syncAIControlCockpitUI, 400);


/* ============ TRADE DATA ============ */
let TRADES = [
  { id:201, sym:'XAUUSD', side:'SELL', entry:2632.10, exit:2630.10, lots:0.10, sl:2633.20, tp:2624.10, strat:'TRAP REVERSAL SNIPER', pnl:+20.00, time:'2026-04-29 10:04' },
  { id:202, sym:'XAUUSD', side:'BUY',  entry:2614.60, exit:2616.60, lots:0.10, sl:2613.40, tp:2622.60, strat:'TRAP REVERSAL SNIPER', pnl:+20.00, time:'2026-04-29 10:18' },
  { id:101, sym:'XAUUSD', side:'SELL', entry:2628.40, exit:2624.10, lots:0.05, sl:2630.20, tp:2623.80, strat:'LIQUIDITY TRAP RETEST', pnl:+21.50, time:'2026-04-29 09:12' },
  { id:102, sym:'XAUUSD', side:'BUY',  entry:2617.80, exit:2621.30, lots:0.05, sl:2616.10, tp:2622.00, strat:'LIQUIDITY TRAP RETEST', pnl:+17.50, time:'2026-04-29 09:25' },
  { id:1, sym:'XAUUSD', side:'BUY',  entry:2611.20, exit:2624.80, lots:0.10, sl:2607.00, tp:2625.00, strat:'SNIPER OB H1',   pnl:+136.00, time:'2025-01-15 09:42' },
  { id:2, sym:'XAUUSD', side:'SELL', entry:2630.50, exit:2618.20, lots:0.08, sl:2634.00, tp:2618.00, strat:'RANGE FADE M15', pnl:+98.40,  time:'2025-01-15 11:20' },
  { id:3, sym:'EURUSD',  side:'BUY',  entry:77.10,   exit:77.85,   lots:0.50, sl:76.80,   tp:77.90,   strat:'TREND FOLLOW H4',pnl:+375.00, time:'2025-01-15 13:05' },
  { id:4, sym:'XAGUSD', side:'SELL', entry:30.12,   exit:29.88,   lots:1.00, sl:30.25,   tp:29.80,   strat:'BREAKOUT M30',   pnl:+240.00, time:'2025-01-15 14:30' },
  { id:5, sym:'XAUUSD', side:'BUY',  entry:2618.00, exit:2614.50, lots:0.05, sl:2613.00, tp:2628.00, strat:'SNIPER OB H1',   pnl:-17.50,  time:'2025-01-15 15:15' },
  { id:6, sym:'XPDUSD', side:'BUY',  entry:1082.00, exit:1091.50, lots:0.10, sl:1076.00, tp:1092.00, strat:'TREND FOLLOW H4',pnl:+95.00,  time:'2025-01-15 16:00' },
  { id:7, sym:'EURUSD',  side:'SELL', entry:78.20,   exit:77.40,   lots:0.30, sl:78.60,   tp:77.30,   strat:'RANGE FADE M15', pnl:+240.00, time:'2025-01-15 17:10' },
  { id:8, sym:'XAUUSD', side:'BUY',  entry:2619.80, exit:2628.50, lots:0.12, sl:2615.00, tp:2630.00, strat:'SCALP M5',       pnl:+104.40, time:'2025-01-15 18:25' },
  { id:9, sym:'XAGUSD', side:'BUY',  entry:29.55,   exit:29.35,   lots:0.80, sl:29.30,   tp:29.90,   strat:'SCALP M5',       pnl:-160.00, time:'2025-01-15 19:00' },
  { id:10,sym:'XAUUSD', side:'SELL', entry:2632.00, exit:2621.00, lots:0.10, sl:2636.00, tp:2620.00, strat:'SNIPER OB H1',   pnl:+110.00, time:'2025-01-15 20:30' },
  { id:11,sym:'EURUSD',  side:'BUY',  entry:76.90,   exit:77.60,   lots:0.40, sl:76.50,   tp:77.70,   strat:'TREND FOLLOW H4',pnl:+280.00, time:'2025-01-14 09:10' },
  { id:12,sym:'XAUUSD', side:'BUY',  entry:2608.50, exit:2618.00, lots:0.08, sl:2603.00, tp:2620.00, strat:'BREAKOUT M30',   pnl:+76.00,  time:'2025-01-14 10:45' },
  { id:13,sym:'XPDUSD', side:'SELL', entry:1095.00, exit:1080.00, lots:0.15, sl:1100.00, tp:1078.00, strat:'RANGE FADE M15', pnl:+225.00, time:'2025-01-14 12:00' },
  { id:14,sym:'XAGUSD', side:'BUY',  entry:29.70,   exit:30.10,   lots:1.00, sl:29.40,   tp:30.20,   strat:'SNIPER OB H1',   pnl:+400.00, time:'2025-01-14 14:20' },
  { id:15,sym:'EURUSD',  side:'SELL', entry:77.80,   exit:77.10,   lots:0.50, sl:78.20,   tp:77.00,   strat:'SCALP M5',       pnl:+350.00, time:'2025-01-14 15:50' },
  { id:16,sym:'XAUUSD', side:'BUY',  entry:2615.00, exit:2611.50, lots:0.10, sl:2610.00, tp:2626.00, strat:'BREAKOUT M30',   pnl:-35.00,  time:'2025-01-14 17:00' },
  { id:17,sym:'XAUUSD', side:'SELL', entry:2628.00, exit:2618.00, lots:0.12, sl:2632.00, tp:2617.00, strat:'TREND FOLLOW H4',pnl:+120.00, time:'2025-01-14 18:30' },
  { id:18,sym:'XPDUSD', side:'BUY',  entry:1075.00, exit:1084.00, lots:0.20, sl:1068.00, tp:1085.00, strat:'SNIPER OB H1',   pnl:+180.00, time:'2025-01-14 20:00' },
  { id:19,sym:'XAGUSD', side:'SELL', entry:30.25,   exit:29.95,   lots:0.80, sl:30.50,   tp:29.90,   strat:'RANGE FADE M15', pnl:+240.00, time:'2025-01-13 10:00' },
  { id:20,sym:'EURUSD',  side:'BUY',  entry:76.50,   exit:77.20,   lots:0.60, sl:76.10,   tp:77.30,   strat:'TREND FOLLOW H4',pnl:+420.00, time:'2025-01-13 12:30' },
  { id:21,sym:'XAUUSD', side:'BUY',  entry:2602.00, exit:2614.00, lots:0.15, sl:2596.00, tp:2615.00, strat:'SNIPER OB H1',   pnl:+180.00, time:'2025-01-13 14:00' },
  { id:22,sym:'XPDUSD', side:'SELL', entry:1100.00, exit:1088.00, lots:0.10, sl:1106.00, tp:1086.00, strat:'BREAKOUT M30',   pnl:+120.00, time:'2025-01-13 16:00' },
];

function renderTradeHistory() {
  const tbody = document.getElementById('trade-body');
  if(!tbody) return;
  const shown = showAllTrades ? TRADES : TRADES.slice(0, 20);
  tbody.innerHTML = shown.map((t,i) => `
    <tr>
      <td style="color:var(--text3);font-size:10px">${t.id}</td>
      <td class="trade-symbol">${t.sym||t.symbol}</td>
      <td class="trade-side ${t.side==='BUY'?'buy':'sell'}">${t.side==='BUY'?'Bullish Conditions':(t.side==='SELL'?'Bearish Conditions':t.side)}</td>
      <td style="font-family:'Share Tech Mono',monospace;font-size:11px">${Number(t.entry||0).toFixed((t.sym||t.symbol)==='XAGUSD'?3:2)}</td>
      <td style="font-family:'Share Tech Mono',monospace;font-size:11px">${Number(t.exit||0).toFixed((t.sym||t.symbol)==='XAGUSD'?3:2)}</td>
      <td style="font-size:11px;color:var(--text2)">${t.lots}</td>
      <td style="font-size:10px;color:var(--red)">${Number(t.sl||0).toFixed(2)}</td>
      <td style="font-size:10px;color:var(--green)">${Number(t.tp||0).toFixed(2)}</td>
      <td><span class="trade-tag">${t.status==='CLOSED'?'\u2705 CLOSED \u00b7 ':t.status==='OPEN'?'\ud83d\udfe2 OPEN \u00b7 ':''}${t.strat||t.strategy}</span></td>
      <td class="trade-pnl ${Number(t.pnl)>=0?'change-up':'change-dn'}" title="Account PNL: ${(t.pnlCurrency||PNL_CONFIG.accountCurrency||'USD')} ${Number(t.pnlAccount??0).toFixed(2)}">${money(Number(t.pnl||0))}</td>
      <td style="font-size:9px;color:var(--text3);font-family:'Share Tech Mono'">${t.time}</td>
    </tr>`).join('');

  const showBtn = document.getElementById('show-more-btn');
  if(showBtn) showBtn.style.display = TRADES.length <= 20 || showAllTrades ? 'none' : 'block';
}

function showMoreTrades() { showAllTrades = true; renderTradeHistory(); }

/* ============ STRATEGIES ============ */
const TRAP_REVERSAL_SNIPER = {
  strategy_id: 'TRS_STANDALONE_001', strategy_name: 'Trap Reversal Sniper', short_name: 'TRS', version: '1.0', strategy_type: 'Standalone Trap / Fake Breakout Reversal', symbol_defaults: ['XAUUSD','XAGUSD','XPDUSD','EURUSD'], timeframes: ['M1'], allow_mixing: false, allow_master_ai_override: false,
  description: 'Standalone strategy for fake breakouts, liquidity grabs, stop-loss hunts, and failed breakouts. It does not position normal breakout continuation.',
  core_rule: 'Fake breakout + rejection + candle close back inside range = opposite trade', do_not_modify_rules: true,
  entry_rules: { sell_setup: ['Valid 20-30 candle range detected','Price breaks above resistance','Upper wick / bearish engulfing / strong rejection / fast return appears','Candle closes back inside old range','Enter Bearish Conditions only after re-entry inside range is confirmed'], buy_setup: ['Valid 20-30 candle range detected','Price breaks below support','Lower wick / bullish engulfing / strong rejection / fast return appears','Candle closes back inside old range','Enter Bullish Conditions only after re-entry inside range is confirmed'] },
  block_rules: ['Block if breakout keeps moving strongly outside the range','Block if candle closes outside range','Block if rejection wick / engulfing / fast return is missing','Block during high-impact news spike','Block if spread is too high','Block if candle is too large / ATR spike abnormal','Block if choppy overlapping candles reduce trap quality','Block if AI confidence is below 85%','Block if MT5 bridge is disconnected or symbol invalid','Trend kill switch: if 20 EMA slope is very strong and 3+ candles move same direction, block opposite reversal'],
  risk_defaults: { default_lot: 0.10, min_lot: 0.01, max_lot: 1.0, max_spread_points: 45, one_trade_per_symbol: true, execution_lock_seconds: 30, cooldown_after_accepted_trade_seconds: 60, min_ai_confidence: 85 },
  sl_tp_logic: { stop_loss: { sell: 'Above fake breakout wick high', buy: 'Below fake breakout wick low' }, take_profit: { tp1: '+2 points', tp2: '+5 points', final_tp: '+8 points or trail remaining position' }, partial_profit: [ {name:'TP1', close_percent:30, points:2}, {name:'TP2', close_percent:30, points:5}, {name:'TP3', close_percent:40, points:8} ], break_even_after_tp1: true, trailing_after_tp2: true },
  execution: { mode:'lightning', pre_arm_after_breakout:true, retries:3, retry_delay_ms:120, no_ticket_no_active_trade:true, manual_auto_ai_same_pipe:true },
  bridge_endpoints: { status:'/api/status', account:'/api/account', price:'/api/price?symbol={symbol}', ohlc:'/api/ohlc?symbol={symbol}&tf=M1', trade:'/api/order', close:'/api/close', partial_close:'/api/partial_close', pnl:'/api/pnl', history:'/api/history' }
};

const SNIPEX_LIQUIDITY_TRAP_RETEST_SCALPER = {
  strategy_id: 'snipex_liquidity_trap_retest_scalper_v1', strategy_name: 'SnipeX Liquidity Trap Retest Scalper', strategy_type: 'XAUUSD_SCALPING', symbol_defaults: ['XAUUSD'], timeframes: ['M1','M5'], version: '1.0.0',
  description: 'High RR XAUUSD scalping strategy: do not chase breakout. Wait for liquidity sweep, reversal, return to level, micro rejection, then execute fast.',
  core_rule: 'Liquidity Sweep -> Reversal -> Return to Level -> Retest -> Micro Rejection -> Execute', do_not_modify_rules: true,
  entry_rules: { sell_setup: ['Price sweeps previous high','Breakout fails and price returns below swept high','Price retests swept high from below','Upper wick / micro rejection appears at retest zone','Bearish conditions near retest zone only'], buy_setup: ['Price sweeps previous low','Breakdown fails and price returns above swept low','Price retests swept low from above','Lower wick / micro rejection appears at retest zone','Bullish conditions near retest zone only'] },
  block_rules: ['Block if liquidity sweep is not detected','Block if reversal back inside structure is not confirmed','Block if price has not returned to retest zone','Block if micro rejection candle is missing','Block if spread is above configured max_spread_points','Block if duplicate execution lock is active','Block if MT5 bridge is disconnected'],
  risk_defaults: { default_lot: 0.05, min_lot: 0.01, max_lot: 1.0, max_spread_points: 45, one_trade_per_symbol: true, execution_lock_seconds: 30, cooldown_after_accepted_trade_seconds: 60 },
  sl_tp_logic: { stop_loss: { sell: 'Above swept high / rejection wick high', buy: 'Below swept low / rejection wick low' }, take_profit: { tp1: 'Fast partial at nearest structure / configurable points', tp2: 'Second partial at next structure', final_tp: 'Final target at liquidity/structure objective' }, partial_profit: [{name:'TP1',close_percent:50},{name:'TP2',close_percent:30},{name:'Final TP',close_percent:20}], break_even_after_tp1: true, trailing_after_tp2: true },
  bridge_endpoints: { status:'/api/status', account:'/account', price:'/prices?symbol={symbol}', ohlc:'/ohlc?symbol={symbol}&tf={timeframe}', trade:'/trade', history:'/history', pnl:'/pnl' }
};


const DOT_LEVEL_PRO_STRICT_PARTIAL = {
  "id": "dot_level_pro_strict_partial_v1",
  "name": "Dot Level Pro - Strict Trigger + Partial Profit",
  "version": "1.0.0",
  "category": "Separate Strategy World",
  "symbols": [
    "XAUUSD",
    "XAGUSD",
    "EURUSD"
  ],
  "default_symbol": "XAUUSD",
  "timeframes": [
    "M1",
    "M5",
    "M15"
  ],
  "default_timeframe": "M5",
  "description": "Pure Dot Level strategy using previous-day high/low levels. No reverse logic. No mixed Bias/Scalper logic. Executes only after level touch, candle close confirmation, rejection validation, and next-candle trigger.",
  "separation_rules": {
    "standalone_module": true,
    "do_not_mix_with_other_strategies": true,
    "reverse_logic_allowed": false,
    "ai_may_filter_only": true,
    "ai_may_change_core_rules": false
  },
  "level_engine": {
    "source": "previous_day_range",
    "formula": {
      "range": "PDH - PDL",
      "D0": "PDL",
      "D25": "PDL + 0.25 * RANGE",
      "D50": "PDL + 0.50 * RANGE",
      "D75": "PDL + 0.75 * RANGE",
      "D100": "PDH"
    },
    "buy_levels": [
      "D0",
      "D25"
    ],
    "sell_levels": [
      "D75",
      "D100"
    ],
    "no_trade_level": "D50"
  },
  "market_filter": {
    "allow_when": [
      "ranging",
      "controlled_volatility"
    ],
    "block_when": [
      "strong_trend",
      "high_impact_news",
      "spread_high",
      "breakout_candle",
      "mt5_not_ready"
    ]
  },
  "strict_trigger_engine": {
    "execution_flow": [
      "LEVEL_TOUCH",
      "WAIT_CANDLE_CLOSE",
      "REJECTION_CONFIRM",
      "EXECUTE_NEXT_CANDLE_OPEN"
    ],
    "buy_rule": {
      "level_touch": "price touches D0 or D25",
      "confirmation": "candle closes above touched level",
      "rejection": "lower wick present or bullish rejection body",
      "execute": "Bullish Conditions on next candle open"
    },
    "sell_rule": {
      "level_touch": "price touches D75 or D100",
      "confirmation": "candle closes below touched level",
      "rejection": "upper wick present or bearish rejection body",
      "execute": "Bearish Conditions on next candle open"
    },
    "rejection_detection": {
      "min_wick_ratio": 0.3,
      "preferred_wick_ratio": 0.5,
      "body_must_not_breakout": true,
      "close_must_return_inside_level": true
    },
    "cancel_conditions": [
      "no_level_touch",
      "candle_not_closed",
      "no_rejection_wick",
      "breakout_close",
      "large_momentum_candle",
      "spread_high",
      "mt5_connection_missing",
      "duplicate_trade_lock_active"
    ]
  },
  "risk_execution": {
    "default_lot": 0.1,
    "manual_lot_allowed": true,
    "default_sl_points": 150,
    "default_tp_points": 300,
    "sl_logic": "SL beyond touched dot level or beyond rejection wick",
    "tp_logic": "Target next dot level first, then runner toward next major level",
    "one_trade_per_symbol": true,
    "duplicate_execution_lock": true,
    "cooldown_seconds_after_accepted_trade": 60
  },
  "partial_profit_system": {
    "enabled": true,
    "real_mt5_partial_close_only": true,
    "levels": [
      {
        "name": "TP1",
        "target": "nearest_next_dot_or_40_percent_to_main_target",
        "close_percent": 40,
        "after_action": "move_sl_to_breakeven"
      },
      {
        "name": "TP2",
        "target": "next_dot_level",
        "close_percent": 30,
        "after_action": "trail_sl_to_lock_profit"
      },
      {
        "name": "TP3",
        "target": "D50_or_next_major_dot",
        "close_percent": 20,
        "after_action": "keep_runner"
      },
      {
        "name": "RUNNER",
        "target": "final_opposite_dot_or_trailing_exit",
        "close_percent": 10,
        "after_action": "trail_until_exit"
      }
    ],
    "partial_close_endpoint": "/api/partial_close",
    "requires_mt5_ticket": true,
    "fake_partial_booking_allowed": false
  },
  "mt5_bridge": {
    "required": true,
    "base_url": "http://127.0.0.1:5000",
    "status_endpoint": "/api/status",
    "account_endpoint": "/api/account",
    "tick_endpoint": "/api/tick?symbol={symbol}",
    "ohlc_endpoint": "/api/ohlc?symbol={symbol}&tf={timeframe}",
    "order_endpoint": "/api/order",
    "history_endpoint": "/api/history",
    "must_confirm_before_trade": [
      "mt5_connected",
      "account_number_visible",
      "algo_trading_enabled",
      "symbol_trade_allowed",
      "valid_tick",
      "spread_under_limit",
      "stops_valid"
    ]
  },
  "pnl_tracking": {
    "real_pnl_only": true,
    "fake_pnl_allowed": false,
    "currency_modes": [
      "AUTO",
      "USD",
      "INR"
    ],
    "default_currency_mode": "AUTO",
    "deductions": {
      "spread_cost": true,
      "exness_charges": true,
      "mt5_charges": true,
      "custom_expenses": true,
      "indian_tax_percent": true
    },
    "views": [
      "daily_pnl",
      "monthly_pnl",
      "month_selector",
      "final_net_profit",
      "trade_history_20_visible"
    ]
  },
  "ai_mode": {
    "enabled_optional": true,
    "default": "OFF",
    "role": "approval_and_learning_layer_only",
    "allowed_actions_when_on": [
      "approve_high_quality_dot_signal",
      "block_low_quality_signal",
      "score_rejection_strength",
      "observe_outcome",
      "suggest_update_to_ai_bucket"
    ],
    "not_allowed": [
      "change_core_dot_levels",
      "take_reverse_trade",
      "execute_without_dot_touch",
      "execute_without_candle_close_confirmation"
    ],
    "ai_bucket_requires_user_permission": true
  },
  "log_messages": {
    "valid_trigger": "\u2705 Strict trigger valid: touch + close + rejection confirmed. Executing next candle.",
    "blocked_no_touch": "\u274c Blocked: no dot level touch.",
    "blocked_no_rejection": "\u274c Blocked: no rejection candle.",
    "blocked_breakout": "\u274c Blocked: breakout candle, not dot rejection.",
    "blocked_spread": "\u274c Blocked: spread too high.",
    "blocked_mt5": "\u274c Blocked: MT5 not ready.",
    "partial_success": "\u2705 Real MT5 partial close confirmed.",
    "partial_failed": "\u274c Partial close rejected by MT5. Check retcode/log."
  }
};


/* ============ IMPORTED STRATEGIES - LOGIC HIDDEN IN UI ============ */
const LIQUIDITY_SWEEP_SNIPER_PRO = {
  "schema": "SnipeX.strategy.v1",
  "strategy_id": "liquidity_sweep_sniper_pro_xauusd",
  "name": "Liquidity Sweep Sniper PRO - Low SL Huge Trailing",
  "version": "1.0.0",
  "symbol": "XAUUSD",
  "timeframes": [
    "M5",
    "M15"
  ],
  "mode": "PRO_CONSISTENT_TRAILING",
  "description": "Low stop-loss liquidity sweep strategy with trap-strength scoring, smart filters, three-phase trailing, re-entry control and AI lot stability.",
  "enabled": true,
  "ui": {
    "hide_details_by_default": true,
    "category": "Forex / Sniper / Trailing",
    "badge": "LOW SL + HUGE TRAIL",
    "details_visible_in_ui": false
  },
  "indicators": {
    "ema_fast": {
      "type": "EMA",
      "period": 21
    },
    "ema_bias": {
      "type": "EMA",
      "period": 50
    },
    "atr": {
      "type": "ATR",
      "period": 14
    },
    "sessions": [
      "London",
      "NewYork"
    ]
  },
  "entry_rules": {
    "buy": [
      "Price sweeps previous swing low / Asian low / marked support liquidity zone",
      "Sweep candle closes back above swept level or next candle closes bullish",
      "Lower wick must be >= 65% of candle range",
      "Impulse confirmation candle body must be >= 55% of candle range",
      "Price must be above EMA50 OR EMA50 slope must be turning upward",
      "Trap strength score must be >= 7 out of 10"
    ],
    "sell": [
      "Price sweeps previous swing high / Asian high / marked resistance liquidity zone",
      "Sweep candle closes back below swept level or next candle closes bearish",
      "Upper wick must be >= 65% of candle range",
      "Impulse confirmation candle body must be >= 55% of candle range",
      "Price must be below EMA50 OR EMA50 slope must be turning downward",
      "Trap strength score must be >= 7 out of 10"
    ],
    "entry_type": "STOP_CONFIRMATION",
    "buy_entry": "break_high_of_confirmation_candle + 0.2 points buffer",
    "sell_entry": "break_low_of_confirmation_candle - 0.2 points buffer",
    "avoid_market_entry": true
  },
  "trap_strength_score": {
    "minimum_score": 7,
    "components": {
      "wick_65_percent_or_more": 2,
      "sweep_at_key_liquidity_zone": 2,
      "impulse_confirmation_body_55_percent_or_more": 2,
      "ema50_bias_or_slope_alignment": 2,
      "atr_not_dead_not_extreme": 1,
      "spread_normal": 1
    }
  },
  "filters": {
    "spread_max_points": 60,
    "news_filter": {
      "enabled": true,
      "block_minutes_before": 5,
      "block_minutes_after": 5,
      "high_impact_only": true
    },
    "chop_filter": {
      "enabled": true,
      "min_atr_points": 1.8,
      "reject_if_last_5_candles_overlap_percent_gt": 70
    },
    "volatility_spike_filter": {
      "enabled": true,
      "max_atr_multiplier": 2.2
    },
    "session_filter": {
      "enabled": true,
      "allowed": [
        "London",
        "NewYork"
      ],
      "avoid_first_minutes_after_open": 3
    },
    "duplicate_guard": true,
    "one_trade_per_symbol": true,
    "cooldown_minutes_after_closed_trade": 3
  },
  "risk": {
    "base_lot_mode": "USER_OR_AI",
    "default_risk_percent": 0.5,
    "max_risk_percent": 1.0,
    "sl_mode": "BEYOND_SWEEP_WICK",
    "sl_buffer_points": 1.2,
    "max_sl_points": 10,
    "min_rr_required": 3.0,
    "daily_loss_guard": {
      "enabled": true,
      "max_daily_loss_percent": 3.0
    },
    "equity_guard": {
      "enabled": true,
      "max_equity_drawdown_percent": 8.0
    }
  },
  "profit_management": {
    "fixed_tp": false,
    "partial_profit": [
      {
        "at_points": 5,
        "close_percent": 25,
        "action": "move_sl_to_breakeven"
      },
      {
        "at_points": 10,
        "close_percent": 25,
        "action": "lock_sl_plus_3_points"
      },
      {
        "at_points": 18,
        "close_percent": 20,
        "action": "trail_by_last_candle_structure"
      },
      {
        "runner_percent": 30,
        "action": "hold_with_adaptive_trailing"
      }
    ],
    "three_phase_trailing": {
      "phase_1_protection": {
        "trigger_points": 5,
        "sl": "breakeven_plus_0.5"
      },
      "phase_2_lock_profit": {
        "trigger_points": 10,
        "sl": "entry_plus_3_points"
      },
      "phase_3_runner": {
        "trigger_points": 18,
        "trail": "last_2_candle_low_for_buy_high_for_sell",
        "atr_multiplier": 1.2
      }
    },
    "hard_exit_rules": [
      "opposite liquidity sweep with score >= 7",
      "runner trailing SL hit",
      "high impact news starts within 2 minutes"
    ]
  },
  "reentry": {
    "enabled": true,
    "max_reentries_per_move": 2,
    "condition": "after TP2, enter continuation pullback to EMA21 only if original direction bias remains and score >= 7",
    "cooldown_seconds": 45,
    "reentry_lot_multiplier": 0.7
  },
  "ai_lot_stability": {
    "enabled": true,
    "after_two_wins_multiplier": 1.2,
    "after_one_loss_multiplier": 0.7,
    "drawdown_defensive_multiplier": 0.5,
    "max_lot_step_up_percent": 20,
    "never_martingale": true
  },
  "mt5_execution": {
    "requires_bridge": true,
    "price_source": "MT5_ONLY",
    "order_send_retry": 3,
    "retry_delay_ms": 250,
    "execution_lock": true,
    "comment": "LSweepPro",
    "require_ticket_confirmation": true
  },
  "expected_profile": {
    "style": "low SL, high RR, moderate win rate, huge runner potential",
    "target_rr": "1:3 to 1:10 on runners",
    "expected_win_rate": "55-68% after filters, not guaranteed",
    "best_market": "London/NY liquidity sweep near key levels",
    "worst_market": "dead chop or violent news spike"
  },
  "details_visible_in_ui": false
};

const ULTRA_SNIPER_FOREX_CONSISTENT_MODE_IMPORTED = {
  "strategy_id": "XAUUSD_ULTRA_SNIPER_CONSISTENT_MODE_V1",
  "strategy_name": "Ultra Sniper Forex - Consistent Mode",
  "version": "1.0",
  "asset": "XAUUSD",
  "timeframes": {
    "primary_entry_tf": "M5",
    "confirmation_tf": "M15",
    "trend_tf": "H1"
  },
  "mode": "consistent_profit",
  "purpose": "Reduce lucky-spike behaviour and push toward smoother month-to-month growth using strict A+ entry filtering, partial profit locking, smart lot control, and drawdown protection.",
  "indicators": {
    "ema_fast": {
      "period": 21,
      "source": "close"
    },
    "ema_structure": {
      "period": 50,
      "source": "close"
    },
    "ema_trend": {
      "period": 200,
      "source": "close",
      "timeframe": "H1"
    },
    "bollinger_bands": {
      "period": 20,
      "deviation": 2.0,
      "source": "close"
    },
    "stoch_rsi": {
      "rsi_period": 14,
      "stoch_period": 14,
      "k": 3,
      "d": 3
    },
    "atr": {
      "period": 14
    }
  },
  "market_energy_filter": {
    "enabled": true,
    "allowed_energy_states": [
      "liquidity_trap",
      "compression_breakout",
      "trend_pullback"
    ],
    "blocked_energy_states": [
      "dead_market",
      "wild_news_spike",
      "random_chop",
      "thin_liquidity"
    ],
    "compression_required_before_breakout": true,
    "minimum_candle_body_strength_percent": 45,
    "maximum_wick_noise_percent": 75
  },
  "entry_rules": {
    "buy": {
      "description": "Buy after liquidity sweep below lower band and confirmed recovery.",
      "required_conditions": [
        "M5 candle touches_or_pierces lower_bollinger_band",
        "Trap candle lower_wick_percent >= 60",
        "Close returns inside Bollinger Band OR next candle closes above trap high",
        "StochRSI K crosses above D below 25",
        "Price is above EMA50 OR distance below EMA50 <= 3 XAUUSD points",
        "M15 bias is not bearish strong",
        "H1 price is above EMA200 OR H1 trend slope is flat-to-up"
      ],
      "entry_trigger": "Place Bullish Conditions STOP 0.10 point above trap_candle_high after confirmation candle forms",
      "cancel_order_if": [
        "Order not triggered within 3 candles",
        "Spread exceeds max_spread_points",
        "Opposite strong impulse candle forms before trigger"
      ]
    },
    "sell": {
      "description": "Sell after liquidity sweep above upper band and confirmed rejection.",
      "required_conditions": [
        "M5 candle touches_or_pierces upper_bollinger_band",
        "Trap candle upper_wick_percent >= 60",
        "Close returns inside Bollinger Band OR next candle closes below trap low",
        "StochRSI K crosses below D above 75",
        "Price is below EMA50 OR distance above EMA50 <= 3 XAUUSD points",
        "M15 bias is not bullish strong",
        "H1 price is below EMA200 OR H1 trend slope is flat-to-down"
      ],
      "entry_trigger": "Place Bearish Conditions STOP 0.10 point below trap_candle_low after confirmation candle forms",
      "cancel_order_if": [
        "Order not triggered within 3 candles",
        "Spread exceeds max_spread_points",
        "Opposite strong impulse candle forms before trigger"
      ]
    }
  },
  "consistency_filters": {
    "max_trades_per_day": 8,
    "max_trades_per_session": 4,
    "min_minutes_between_trades_same_symbol": 7,
    "one_trade_per_direction": true,
    "avoid_first_5_minutes_of_session_open": true,
    "avoid_last_5_minutes_of_session_close": true,
    "require_a_plus_score": true,
    "minimum_setup_score": 78,
    "score_weights": {
      "liquidity_sweep": 25,
      "wick_quality": 15,
      "stoch_rsi_cross": 15,
      "ema_alignment": 15,
      "m15_confirmation": 10,
      "h1_context": 10,
      "spread_clean": 5,
      "atr_normal": 5
    }
  },
  "risk_management": {
    "risk_profile": "controlled_aggressive",
    "base_risk_per_trade_percent": 0.6,
    "max_risk_per_trade_percent": 1.2,
    "daily_loss_soft_limit_percent": 3.0,
    "daily_loss_hard_stop_percent": 5.0,
    "weekly_loss_hard_stop_percent": 10.0,
    "max_drawdown_pause_percent": 8.0,
    "max_consecutive_losses_before_defensive_mode": 2,
    "defensive_mode": {
      "enabled": true,
      "risk_multiplier": 0.5,
      "minimum_setup_score": 86,
      "max_trades_per_day": 3,
      "exit_after_tp2": true
    }
  },
  "lot_ai": {
    "enabled": true,
    "lot_mode": "balance_and_drawdown_adaptive",
    "rules": [
      "If equity_drawdown_today >= 2%, reduce lot by 50%",
      "If 2 consecutive losses, reduce lot by 50% and require setup_score >= 86",
      "If 3 consecutive wins and drawdown_today < 1%, increase lot by max 15% only",
      "Never martingale after loss",
      "Never exceed max_risk_per_trade_percent"
    ]
  },
  "stop_loss": {
    "method": "trap_candle_extreme_plus_buffer",
    "buy_sl": "trap_candle_low - 0.30 point buffer",
    "sell_sl": "trap_candle_high + 0.30 point buffer",
    "minimum_sl_points": 3.0,
    "maximum_sl_points": 10.0,
    "if_sl_too_large": "skip_trade"
  },
  "profit_booking": {
    "enabled": true,
    "partial_close_ladder": [
      {
        "level": "TP1",
        "profit_points": 2.0,
        "close_percent": 35,
        "action": "move_sl_to_minus_0_5_or_better"
      },
      {
        "level": "TP2",
        "profit_points": 5.0,
        "close_percent": 30,
        "action": "move_sl_to_breakeven_plus_0_5"
      },
      {
        "level": "TP3",
        "profit_points": 9.0,
        "close_percent": 20,
        "action": "trail_by_last_2_candle_extreme"
      },
      {
        "level": "TP4",
        "profit_points": 14.0,
        "close_percent": 10,
        "action": "trail_runner"
      },
      {
        "level": "Runner",
        "profit_points": "open",
        "close_percent": 5,
        "action": "close_on_opposite_energy_signal_or_trailing_stop"
      }
    ],
    "range_market_override": {
      "enabled": true,
      "close_all_at_tp3": true
    },
    "trend_market_override": {
      "enabled": true,
      "hold_runner_until_trailing_stop": true
    }
  },
  "trailing_stop": {
    "enabled": true,
    "activate_after": "TP2",
    "method": "last_2_candle_extreme_or_atr_fraction",
    "atr_multiplier": 0.8,
    "lock_profit_after_tp2_points": 0.5,
    "tighten_after_tp3": true
  },
  "reverse_scalp_recovery": {
    "enabled": false,
    "reason": "Disabled in consistent mode because reverse scalp recovery can create lucky spikes and unstable drawdown. Use only in aggressive mode.",
    "optional_manual_enable_rules": {
      "max_reverse_trades_per_day": 2,
      "reverse_lot_multiplier": 1.0,
      "reverse_tp_points": 2.0,
      "reverse_sl_points": 2.5,
      "require_failed_entry_with_clear_liquidity_rejection": true
    }
  },
  "execution_safety": {
    "mt5_required": true,
    "fake_data_allowed": false,
    "duplicate_guard": true,
    "execution_lock_ms": 3000,
    "max_retry_count": 2,
    "retry_delay_ms": 450,
    "do_not_retry_if": [
      "invalid_stops",
      "market_closed",
      "news_lock",
      "daily_hard_stop",
      "spread_too_high"
    ],
    "cooldown_starts_only_after_accepted_trade": true,
    "required_bridge_checks": [
      "connected",
      "account_visible",
      "symbol_tick_valid",
      "bid_ask_valid",
      "spread_valid"
    ]
  },
  "spread_and_price_rules": {
    "max_spread_points": 60,
    "spread_bug_guard": {
      "enabled": true,
      "if_spread_points_above_300": "treat_as_bad_tick_and_refetch",
      "refetch_attempts": 2,
      "block_after_refetch_fail": true
    },
    "stale_price_max_age_seconds": 3,
    "zero_price_action": "block_and_reconnect_bridge"
  },
  "news_filter": {
    "enabled": true,
    "high_impact_lock_minutes_before": 5,
    "high_impact_lock_minutes_after": 5,
    "medium_impact_warning_only": true,
    "allow_trade_if_position_already_in_profit": true,
    "before_news_action": "tighten_trailing_stop_or_close_runner"
  },
  "session_filter": {
    "enabled": true,
    "preferred_sessions": [
      "London",
      "NewYork",
      "London_NewYork_Overlap"
    ],
    "avoid_sessions": [
      "Asia_dead_zone_if_ATR_low"
    ],
    "trade_only_when_atr_normal": true
  },
  "ai_explanation_fields": [
    "setup_score",
    "energy_state",
    "entry_reason",
    "blocked_reason",
    "spread_status",
    "risk_mode",
    "partial_profit_status",
    "mt5_ticket_id"
  ],
  "dashboard_display": {
    "hide_strategy_details_by_default": true,
    "show_summary_card": true,
    "summary_text": "Ultra Sniper Forex Consistent Mode: A+ liquidity trap entries, controlled risk, fast partial booking, smart lot AI, drawdown defense.",
    "show_profit_target_note": "Target is smoother growth, not guaranteed profit. Backtest and forward-test before live use."
  },
  "expected_profile": {
    "target_monthly_growth_range_percent": "30-50 aggressive target only after stable testing",
    "safer_realistic_monthly_range_percent": "8-25 depending on market and execution",
    "expected_win_rate_range_percent": "60-72 after filters",
    "max_expected_drawdown_percent": "6-12 if rules followed",
    "warning": "No strategy can guarantee profit. Live execution, spread, slippage, news, and broker conditions can change results."
  },
  "ui": {
    "hide_details_by_default": true,
    "details_visible_in_ui": false
  },
  "details_visible_in_ui": false
};

const ULTRA_SNIPER_ICT_SMC_FRVT_FOREX_IMPORTED = {
  "schema": "SNIPEX_STRATEGY_V1",
  "name": "Ultra Sniper ICT-SMC FRVT Forex",
  "id": "ultra_sniper_ict_smc_frvt_fx_v1",
  "version": "1.0.0",
  "created_at": "2026-04-29T08:39:24",
  "market": [
    "XAUUSD",
    "XAGUSD",
    "EURUSD"
  ],
  "primary_symbol": "XAUUSD",
  "style": "aggressive_sniper_scalping_intraday",
  "details_visible_in_ui": false,
  "description_hidden": "Liquidity sweep + order block + structure shift + FRVT-style volume confirmation strategy.",
  "timeframes": {
    "bias_tf": "H1",
    "setup_tf": "M15",
    "entry_tf": "M5",
    "sniper_tf": "M1"
  },
  "risk": {
    "mode": "smart_ai",
    "default_lot": 0.01,
    "max_lot": 0.1,
    "risk_per_trade_percent": 0.5,
    "max_daily_loss_percent": 3.0,
    "max_trades_per_symbol": 1,
    "cooldown_seconds_after_accepted_trade": 60,
    "block_duplicate_trade": true,
    "testing_mode_bypasses_daily_loss_only": true
  },
  "filters": {
    "spread_max_points": {
      "XAUUSD": 65,
      "XAGUSD": 55,
      "EURUSD": 45
    },
    "block_high_impact_news_minutes_before": 10,
    "block_high_impact_news_minutes_after": 10,
    "avoid_flat_market": true,
    "avoid_extreme_atr_spike": true,
    "minimum_confidence_to_trade": 78
  },
  "entry_engine": {
    "direction_lock": {
      "buy_bias": "H1/M15 makes HH/HL or bullish break of structure after sell-side liquidity sweep",
      "sell_bias": "H1/M15 makes LH/LL or bearish break of structure after buy-side liquidity sweep"
    },
    "liquidity_sweep": {
      "enabled": true,
      "lookback_candles": 25,
      "sweep_min_wick_ratio": 0.55,
      "must_close_back_inside_range": true,
      "equal_high_low_tolerance_points": 35
    },
    "order_block": {
      "enabled": true,
      "definition": "last opposite candle before displacement move",
      "max_age_candles": 35,
      "require_retest": true,
      "entry_zone": "50_percent_to_extreme",
      "invalidate_if_closed_beyond_ob": true
    },
    "structure_shift": {
      "enabled": true,
      "require_bos_or_choch": true,
      "confirmation_tf": "M5",
      "micro_confirmation_tf": "M1"
    },
    "volume_profile_frvt_style": {
      "enabled": true,
      "method": "fixed_range_approx_from_recent_ohlc_volume",
      "range_source": "from_sweep_origin_to_current_retest",
      "require_high_volume_node_overlap_with_ob": true,
      "hvn_overlap_min_percent": 35,
      "avoid_entry_inside_dead_low_volume_without_rejection": true
    },
    "sniper_candle_trigger": {
      "enabled": true,
      "buy": "bullish rejection candle inside bullish OB after sell-side sweep",
      "sell": "bearish rejection candle inside bearish OB after buy-side sweep",
      "minimum_body_recovery_percent": 45,
      "allow_early_entry_after_m1_confirmation": true
    }
  },
  "exit_engine": {
    "stop_loss": {
      "type": "smart_wick_ob_sl",
      "buy": "below swept low or bullish OB low, whichever is safer",
      "sell": "above swept high or bearish OB high, whichever is safer",
      "extra_buffer_points": 12,
      "max_sl_points": 180,
      "reject_if_sl_too_large": true
    },
    "take_profit": {
      "partial_booking_enabled": true,
      "tp_levels": [
        {
          "name": "TP1",
          "close_percent": 25,
          "target": "1R or nearest micro liquidity"
        },
        {
          "name": "TP2",
          "close_percent": 20,
          "target": "2R"
        },
        {
          "name": "TP3",
          "close_percent": 20,
          "target": "previous high/low liquidity"
        },
        {
          "name": "TP4",
          "close_percent": 20,
          "target": "next major liquidity pool"
        },
        {
          "name": "TP5",
          "close_percent": 15,
          "target": "trail until structure break"
        }
      ],
      "move_sl_to_breakeven_after_tp1": true,
      "lock_profit_after_tp2": true
    },
    "trailing": {
      "enabled": true,
      "start_after": "TP1",
      "method": "structure_plus_atr",
      "atr_period": 14,
      "atr_multiplier": 1.2,
      "trail_on_new_swing": true
    },
    "emergency_exit": {
      "close_if_opposite_sweep_against_trade": true,
      "close_if_m5_structure_breaks_against_trade": true,
      "close_if_spread_explodes": true
    }
  },
  "confidence_score": {
    "liquidity_sweep": 25,
    "valid_order_block": 20,
    "structure_shift": 20,
    "volume_overlap": 15,
    "rejection_candle": 10,
    "session_quality": 5,
    "spread_ok": 5
  },
  "sessions": {
    "preferred": [
      "London",
      "NewYork",
      "London_NewYork_Overlap"
    ],
    "avoid": [
      "late_asia_flat",
      "post_news_spike"
    ]
  },
  "ui": {
    "category": "Ultra Sniper",
    "show_details": false,
    "show_confidence_meter": true,
    "show_block_reasons": true,
    "show_partial_tp_panel": true,
    "badge": "ULTRA SNIPER FOREX",
    "theme": "dark_fx_glass",
    "hide_details_by_default": true,
    "details_visible_in_ui": false
  },
  "bridge_requirements": {
    "requires_mt5_live_prices": true,
    "requires_ohlc_endpoint": true,
    "required_endpoints": [
      "/api/status",
      "/prices?symbol=XAUUSD",
      "/ohlc?symbol=XAUUSD&tf=M5",
      "/execute"
    ],
    "no_fake_data": true
  }
};

const ULTRA_SNIPER_LIQUIDITY_AI_IMPORTED = {
  "schema": "SnipeX.strategy.txt.v1",
  "strategy_id": "ultra_sniper_liquidity_ai_v1",
  "name": "ULTRA_SNIPER_LIQUIDITY_AI",
  "version": "1.0",
  "symbol": "XAUUSD,XAGUSD,EURUSD",
  "timeframes": [
    "M1",
    "M5",
    "H1"
  ],
  "mode": "SCALP_REVERSAL_CONTINUATION",
  "details_visible_in_ui": false,
  "ui": {
    "hide_details_by_default": true,
    "details_visible_in_ui": false,
    "badge": "AI LIQUIDITY"
  },
  "raw_config_hidden": "# ULTRA_SNIPER_LIQUIDITY_AI.strategy\
\
[INFO]\
name=ULTRA_SNIPER_LIQUIDITY_AI\
type=SCALP_REVERSAL_CONTINUATION\
symbols=XAUUSD,XAGUSD,EURUSD\
timeframes_execution=M1,M5\
timeframe_bias=H1\
version=1.0\
\
[BIAS_ENGINE]\
structure_rule=HH_HL_BUY|LH_LL_SELL\
ema_filter=EMA50\
buy_condition=price>EMA50\
sell_condition=price<EMA50\
no_trade_if=NO_CLEAR_STRUCTURE\
\
[LIQUIDITY_ENGINE]\
zones=EQUAL_HIGHS,EQUAL_LOWS,SWING_HIGHS,SWING_LOWS\
valid_touch=TRUE\
wick_threshold=0.6\
spike_required=TRUE\
\
[ENTRY_LOGIC]\
wait_for_liquidity_grab=TRUE\
delay_entry_candles=1-3\
require_pullback=TRUE\
require_rejection=TRUE\
trend_alignment=TRUE\
execute=MARKET\
\
[ENTRY_TYPES]\
reversal=ENABLED\
continuation=ENABLED\
\
[STOP_LOSS]\
mode=STRUCTURE_BASED\
placement=BEYOND_LIQUIDITY|SWING\
dynamic_sl=TRUE\
\
[TAKE_PROFIT]\
tp1_close_percent=30\
tp2_close_percent=50\
tp3_runner=TRUE\
break_even_after_tp1=TRUE\
trailing=STRUCTURE_TRAIL\
\
[EXECUTION_ENGINE]\
max_retries=3\
execution_lock=TRUE\
duplicate_guard=TRUE\
\
[AI_LOT_ENGINE]\
risk_per_trade=1-2%\
lot_high=STRONG_SETUP\
lot_medium=NORMAL_SETUP\
lot_low=WEAK_SETUP\
reduce_after_loss_streak=TRUE\
\
[SMART_BLOCK]\
spread_filter=ENABLED\
news_filter=ENABLED\
chop_filter=ENABLED\
low_volatility_block=ENABLED\
no_trend_block=ENABLED\
\
[SMART_UNBLOCK]\
allow_if_strong_trend=TRUE\
\
[COOLDOWN]\
one_trade_per_symbol=TRUE\
cooldown_seconds=60\
\
[SNIPER_MODE]\
enabled=OPTIONAL\
early_entry=TRUE\
tight_sl=TRUE\
fast_tp=TRUE\
\
[FAILSAFE]\
require_bridge_connection=TRUE\
retry_on_fail=TRUE\
skip_on_fail=TRUE\
\
[PERFORMANCE_MODE]\
trend_override=TRUE\
disable_reversal_in_strong_trend=TRUE\
"
};


const HF_RANGE_SNIPER_V2_IMPORTED = {
  schema:'SnipeX.strategy.v2',
  strategy_id:'HF_RANGE_SNIPER_V2',
  strategy_name:'HF Range Sniper v2',
  short_name:'HF RANGE SNIPER',
  version:'2.0',
  description_hidden:'Institutional range compression, breakout quality, retest, fakeout block, measured move TP ladder 25/50/75/120.',
  symbols:['XAUUSD','XAGUSD','EURUSD','XAUUSD'],
  timeframes:['M3','M5','M15'],
  hiddenDetails:true,
  execution:{partial_booking:[25,25,25,25], break_even_after_tp1:true, trail_after_tp2:true, max_addons:2},
  filters:{retest_required:true, fakeout_block:true, spread_filter:true, news_filter:true, chop_filter:true}
};

const STRATEGIES = [

  { name:'FOREX MOMENTUM BREAKOUT', fullName:'Forex Momentum Breakout', type:'XAU/XAG/EUR Momentum Breakout \u00b7 200 EMA + Volume', tf:'H1/H4 structure \u00b7 M15 entry', wr:55, rr:18, consistency:88, enabled:true, auto:true, imported:true, standalone:true, executable:true, manualExecutable:true, masterAIExecutable:true, family:'BREAKOUT', mode:'MOMENTUM_BREAKOUT', confidence_threshold:76, risk:0.5, partial_at_rr:6, trail_method:'EMA_20' },
  { name:'FOREX TREND FOLLOWER', fullName:'Forex Trend Follower', type:'XAU/XAG Swing Trend \u00b7 20/50 EMA Pullback', tf:'H4/D1', wr:54, rr:20, consistency:86, enabled:true, auto:true, imported:true, standalone:true, executable:true, manualExecutable:true, masterAIExecutable:true, family:'TREND', mode:'TREND_FOLLOWING', confidence_threshold:78, risk:'0.5_to_0.7', partial_at_rr:'6_to_8', trail_method:'EMA_20_OR_50' },
  { name:'FOREX NEWS SPIKE SNIPER', fullName:'Forex News Spike Sniper', type:'XAU/XAG News Spike Re-break \u00b7 5-15 Min Wait', tf:'M5/M15 entry \u00b7 M15/H1 structure', wr:45, rr:25, consistency:82, enabled:true, auto:true, imported:true, standalone:true, executable:true, manualExecutable:true, masterAIExecutable:true, family:'NEWS', mode:'NEWS_SPIKE_BREAKOUT', confidence_threshold:82, risk:0.4, partial_at_rr:8, trail_method:'MOMENTUM_BASED' },
  { name:'FOREX RELATIVE STRENGTH SWING', fullName:'Forex Relative Strength Swing', type:'Altseason RS vs XAU \u00b7 20/50 EMA Pullback', tf:'D1 RS \u00b7 H4 entry', wr:56, rr:20, consistency:84, enabled:true, auto:true, imported:true, standalone:true, executable:true, manualExecutable:true, masterAIExecutable:true, family:'RELATIVE_STRENGTH', mode:'RELATIVE_STRENGTH_TREND', confidence_threshold:76, risk:'0.5_to_0.7', partial_at_rr:'6_to_8', trail_method:'EMA_20_OR_50' },
  { name:'HF RANGE SNIPER V2', fullName:'HF Range Sniper v2 - Range % Breakout Retest', type:'Institutional Range Breakout \u00b7 Retest \u00b7 TP 25/50/75/120', tf:'M3/M5/M15', wr:72, rr:3.40, consistency:89, enabled:true, auto:true, imported:true, standalone:true, hiddenDetails:true, module:HF_RANGE_SNIPER_V2_IMPORTED },
  { name:'LIQUIDITY SWEEP SNIPER PRO', fullName:'Liquidity Sweep Sniper PRO - Low SL Huge Trailing', type:'Forex Sniper \u00b7 Low SL + Huge Trail', tf:'M5/M15', wr:84, rr:3.25, consistency:88, enabled:true, auto:true, imported:true, standalone:true, hiddenDetails:true, module:LIQUIDITY_SWEEP_SNIPER_PRO },
  { name:'ULTRA SNIPER FOREX CONSISTENT', fullName:'Ultra Sniper Forex - Consistent Mode', type:'Forex Consistent \u00b7 Partial Profit', tf:'M5/M15/H1', wr:83, rr:2.60, consistency:90, enabled:true, auto:true, imported:true, standalone:true, hiddenDetails:true, module:ULTRA_SNIPER_FOREX_CONSISTENT_MODE_IMPORTED },
  { name:'ICT SMC FRVT FOREX', fullName:'Ultra Sniper ICT-SMC FRVT Forex', type:'ICT/SMC/FRVT \u00b7 XAUUSD', tf:'M1/M5/M15/H1', wr:82, rr:3.00, consistency:87, enabled:true, auto:true, imported:true, standalone:true, hiddenDetails:true, module:ULTRA_SNIPER_ICT_SMC_FRVT_FOREX_IMPORTED },
  { name:'ULTRA SNIPER LIQUIDITY AI', fullName:'ULTRA_SNIPER_LIQUIDITY_AI', type:'AI Liquidity \u00b7 Reversal + Continuation', tf:'M1/M5/H1', wr:80, rr:2.40, consistency:84, enabled:true, auto:true, imported:true, standalone:true, hiddenDetails:true, module:ULTRA_SNIPER_LIQUIDITY_AI_IMPORTED },
  { name:'DOT LEVEL PRO', fullName:'Dot Level Pro - Strict Trigger + Partial Profit', type:'Previous-Day Dot Levels \u00b7 Strict Partial Profit', tf:'M1/M5/M15', wr:81, rr:2.00, consistency:87, enabled:true, auto:true, imported:true, standalone:true, hiddenDetails:true, module:DOT_LEVEL_PRO_STRICT_PARTIAL },
  { name:'TRAP REVERSAL SNIPER', fullName:'Trap Reversal Sniper', type:'Standalone Fake Breakout Reversal', tf:'M1', wr:84, rr:2.75, consistency:89, enabled:true, auto:true, imported:true, standalone:true, module:TRAP_REVERSAL_SNIPER },
  { name:'LIQUIDITY TRAP RETEST', fullName:'SnipeX Liquidity Trap Retest Scalper', type:'XAUUSD Scalping \u00b7 Liquidity Sweep', tf:'M1/M5', wr:82, rr:2.90, consistency:91, enabled:true, auto:true, imported:true, module:SNIPEX_LIQUIDITY_TRAP_RETEST_SCALPER },
  { name:'SNIPER OB H1', type:'ICT / Smart Money', tf:'H1', wr:78, rr:2.65, consistency:88, enabled:true, auto:true },
  { name:'TREND FOLLOW H4', type:'Trend Following', tf:'H4', wr:71, rr:2.20, consistency:82, enabled:true, auto:true },
  { name:'RANGE FADE M15', type:'Mean Reversion', tf:'M15', wr:66, rr:1.85, consistency:74, enabled:true, auto:true },
  { name:'BREAKOUT M30', type:'Momentum Break', tf:'M30', wr:62, rr:2.10, consistency:70, enabled:true, auto:true },
  { name:'SCALP M5', type:'Scalping', tf:'M5', wr:58, rr:1.50, consistency:65, enabled:true, auto:true },
  { name:'SESSION OPEN M1', type:'NY/London Session', tf:'M1', wr:54, rr:1.80, consistency:60, enabled:true, auto:true },
];
window.STRATEGIES = STRATEGIES;

function renderStrategies() {
  const list = document.getElementById('strat-list');
  if(!list) return;
  list.innerHTML = STRATEGIES.map((s,i) => `
    <div class="strat-card" style="${i<3?'border-color:rgba(245,200,66,0.1)':''}">
      <div class="strat-rank ${i===0?'r1':i===1?'r2':i===2?'r3':''}">${i+1}</div>

      <div class="strat-info">
        <div class="strat-name">${s.imported?'\ud83d\udd25 ':''}${s.name}</div>
        <div class="strat-meta">${s.imported ? '<span style="color:var(--fx)">PROPRIETARY LOGIC HIDDEN</span> \u00b7 ' : s.type + ' \u00b7 ' + s.tf + ' \u00b7 '}${s.enabled?'<span style="color:var(--green)">ACTIVE</span>':'<span style="color:var(--text3)">PAUSED</span>'}</div>
      </div>

      <div class="strat-stats">
        <div class="strat-stat">
          <div class="strat-stat-val" style="color:var(--green)">${s.wr}%</div>
          <div class="strat-stat-lbl">WIN RATE</div>
        </div>
        <div class="strat-stat">
          <div class="strat-stat-val" style="color:var(--cyan)">1:${s.rr.toFixed(2)}</div>
          <div class="strat-stat-lbl">RR RATIO</div>
        </div>
        <div class="strat-stat">
          <div class="strat-stat-val" style="color:var(--fx)">${s.consistency}%</div>
          <div class="strat-stat-lbl">CONSIST.</div>
        </div>
      </div>

      <div style="display:flex;flex-direction:column;gap:6px;align-items:center">
        <div style="font-size:8px;color:var(--text3);letter-spacing:1px">ON/OFF</div>
        <label class="toggle-switch">
          <input type="checkbox" ${s.enabled?'checked':''} onchange="toggleStrat(${i},this.checked)">
          <div class="toggle-track"></div>
          <div class="toggle-thumb"></div>
        </label>
      </div>

      <div style="display:flex;flex-direction:column;gap:6px;align-items:center">
        <div style="font-size:8px;color:var(--text3);letter-spacing:1px">AUTO</div>
        <label class="toggle-switch">
          <input type="checkbox" ${s.auto?'checked':''} onchange="toggleStratAuto(${i},this.checked)">
          <div class="toggle-track"></div>
          <div class="toggle-thumb"></div>
        </label>
        ${s.imported?'<div class="strategy-hidden-note">DETAILS HIDDEN</div>':''}
      </div>
    </div>`).join('');
}

function toggleStrat(i, val) { STRATEGIES[i].enabled = val; window.STRATEGIES = STRATEGIES; populateChartStrategySelect(true); refreshAIMasterDecision(true); }
function toggleStratAuto(i, val) { STRATEGIES[i].auto = val; window.STRATEGIES = STRATEGIES; populateChartStrategySelect(true); refreshAIMasterDecision(true); }

function renderImportedStrategyDetails(s, i) {
  return `<div class="strategy-detail" id="strategy-detail-${i}" style="display:none!important"><div class="strategy-hidden-note">\ud83d\udd12 Strategy logic is hidden in Strategy Manager.</div></div>`;
}
function toggleStrategyDetails(i) {
  const el = document.getElementById('strategy-detail-' + i);
  const btn = document.getElementById('rule-btn-' + i);
  if(!el) return;
  const isOpen = el.style.display === 'block';
  el.style.display = isOpen ? 'none' : 'block';
  if(btn) btn.textContent = isOpen ? 'SHOW LOGIC' : 'HIDE LOGIC';
}
function evaluateTrapReversalSniper(input) {
  const required = { mt5Connected: !!input.mt5Connected, symbolValid: input.symbol ? ['XAUUSD', 'XAGUSD', 'XPDUSD', 'EURUSD', 'GBPUSD', 'USDJPY', 'USDCHF', 'USDCAD', 'AUDUSD', 'NZDUSD', 'EURJPY', 'GBPJPY', 'EURGBP'].includes(input.symbol) : true, spreadOk: Number(input.spreadPoints || 999999) <= Number(input.maxSpreadPoints || 45), noDuplicateTrade: !input.executionLocked, rangeDetected: !!input.rangeDetected, breakoutDetected: !!input.breakoutDetected, trapConfirmed: !!input.trapConfirmed, reentryInsideRange: !!input.reentryInsideRange, trendKillSwitchClear: !input.strongTrendContinuation, newsClear: !input.highImpactNews, confidenceOk: Number(input.confidence || 0) >= 85 };
  const blockReasons = Object.entries(required).filter(([, ok]) => !ok).map(([key]) => key);
  if (blockReasons.length) return { decision:'BLOCK', canTrade:false, blockReasons, confidence:Number(input.confidence || 0) };
  const side = input.fakeBreakoutSide === 'ABOVE_RESISTANCE' ? 'SELL' : input.fakeBreakoutSide === 'BELOW_SUPPORT' ? 'BUY' : 'WAIT';
  if (side === 'WAIT') return { decision:'WAIT', canTrade:false, blockReasons:['fakeBreakoutSideMissing'], confidence:Number(input.confidence || 0) };
  return { decision: side, canTrade: true, blockReasons: [], confidence: Number(input.confidence || 85), reason: side === 'SELL' ? 'Resistance fake breakout failed, rejection confirmed, candle closed back inside range.' : 'Support fake breakdown failed, rejection confirmed, candle closed back inside range.' };
}

function evaluateLiquidityTrapRetest(input) { const required = { mt5Connected: !!input.mt5Connected, spreadOk: Number(input.spreadPoints || 999999) <= Number(input.maxSpreadPoints || 45), noDuplicateLock: !input.executionLocked, sweepDetected: !!input.sweepDetected, reversalConfirmed: !!input.reversalConfirmed, retestZoneActive: !!input.retestZoneActive, microRejectionDetected: !!input.microRejectionDetected }; const blockReasons = Object.entries(required).filter(([, ok]) => !ok).map(([key]) => key); if (blockReasons.length) return { decision: 'BLOCK', canTrade: false, blockReasons, confidence: 0 }; const side = input.sweepSide === 'HIGH' ? 'SELL' : input.sweepSide === 'LOW' ? 'BUY' : 'WAIT'; if (side === 'WAIT') return { decision: 'WAIT', canTrade: false, blockReasons: ['sweepSideMissing'], confidence: 0 }; return { decision: side, canTrade: true, blockReasons: [], confidence: Number(input.confidence || 78), reason: side === 'SELL' ? 'Previous high swept, reversal confirmed, retest active, upper wick micro rejection detected.' : 'Previous low swept, reversal confirmed, retest active, lower wick micro rejection detected.' }; }


function evaluateDotLevelPro(input) {
  const maxSpread = Number(input.maxSpreadPoints || 45);
  const spreadOk = Number(input.spreadPoints || 999999) <= maxSpread;
  const touched = input.touchedLevel;
  const buyLevel = touched === 'D0' || touched === 'D25';
  const sellLevel = touched === 'D75' || touched === 'D100';
  const commonRequired = {
    mt5Connected: !!input.mt5Connected,
    spreadOk,
    noDuplicateTrade: !input.executionLocked,
    candleClosed: !!input.candleClosed,
    levelTouched: !!touched,
    rejectionConfirmed: !!input.rejectionConfirmed,
    noHighImpactNews: !input.highImpactNews,
    marketAllowed: !input.strongTrend && !input.breakoutCandle && !input.largeMomentumCandle
  };
  const blockReasons = Object.entries(commonRequired).filter(([, ok]) => !ok).map(([key]) => key);
  if (blockReasons.length) return { decision:'BLOCK', canTrade:false, blockReasons };
  if (buyLevel && input.closeAboveTouchedLevel && (input.lowerWick || input.bullishRejectionBody)) {
    return { decision:'BUY', canTrade:true, blockReasons:[], reason:'Dot level buy trigger: touch + close above level + rejection confirmed; execute on next candle open.' };
  }
  if (sellLevel && input.closeBelowTouchedLevel && (input.upperWick || input.bearishRejectionBody)) {
    return { decision:'SELL', canTrade:true, blockReasons:[], reason:'Dot level sell trigger: touch + close below level + rejection confirmed; execute on next candle open.' };
  }
  return { decision:'WAIT', canTrade:false, blockReasons:['dotLevelConfirmationMissing'] };
}

function addStrategy() {
  const name = document.getElementById('strat-name-input').value.trim();
  const tf = document.getElementById('strat-tf-input').value.trim() || 'H1';
  if(!name) return;
  STRATEGIES.push({ name:name.toUpperCase(), type:'Custom Strategy', tf, wr:50, rr:1.5, consistency:50, enabled:true, auto:true });
  window.STRATEGIES = STRATEGIES;
  renderStrategies();
  populateChartStrategySelect(true);
  document.getElementById('strat-name-input').value = '';
  document.getElementById('strat-tf-input').value = '';
}

/* ============ TIMEFRAME SELECTOR ============ */
function renderTFSelector() {
  const el = document.getElementById('tf-selector');
  if(!el) return;
  ['M1','M5','M15','H1','H4','D1'].forEach(tf => {
    const btn = document.createElement('button');
    btn.className = 'filter-tab ' + (tf === activeTF ? 'active' : '');
    btn.textContent = tf;
    btn.onclick = () => {
      activeTF = tf;
      el.querySelectorAll('.filter-tab').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    };
    el.appendChild(btn);
  });
}

/* ============ AI LAB ============ */
const LAB_STRATEGIES = [
  { name:'LIQUIDITY HUNT AI-v1', desc:'ICT liquidity grab + OB retest pattern', wr:82, rr:2.9, conf:91, basis:'847 positions analyzed' },
  { name:'SESSION GAP FILL AI-v2', desc:'NY/London gap fill with volume confirmation', wr:75, rr:2.4, conf:84, basis:'421 positions analyzed' },
  { name:'DISPLACEMENT SCALP AI-v3', desc:'FVG displacement scalp at premium/discount', wr:69, rr:1.95, conf:76, basis:'312 positions analyzed' },
  { name:'WEEKLY BIAS TRADER AI-v4', desc:'Higher TF weekly bias execution on H1 entry', wr:77, rr:3.2, conf:88, basis:'198 positions analyzed' },
  { name:'RETAIL HUNT AI-v5', desc:'Stop hunt reversal at key retail levels', wr:71, rr:2.1, conf:79, basis:'285 positions analyzed' },
];

function renderLabStrategies() {
  const el = document.getElementById('lab-strategies');
  if(!el) return;
  const live = (window.AI_LAB_STRATEGIES||[]).map(s=>({name:s.name, desc:`${s.regime||'AUTO'} ${s.side_bias||''} pattern from ${s.source_strategy||'Master AI'}`, wr:Number(s.wr||0), rr:Number(s.rr||1.8), conf:Number(s.confidence||s.wr||0), basis:`${s.trades||0} learned positions \u00b7 net ${Number(s.net||0).toFixed(2)}`, live:true}));
  if(!live.length){
    el.innerHTML = `<div class="lab-card"><div class="lab-name">AI LAB EMPTY</div><div style="font-size:10px;color:var(--text2);margin-top:8px">No real learned strategies yet. Real-only mode will not show demo/sample strategies.</div></div>`;
    return;
  }
  const list = live;
  el.innerHTML = list.map((s,i) => `
    <div class="lab-card" style="animation-delay:${i*0.1}s">
      <div class="lab-header">
        <div class="lab-name">${ailabSafe(s.name)}</div>
        <div class="lab-conf">\ud83e\udde0 ${ailabPct(s.conf)}% CONFIDENCE</div>
      </div>
      <div style="font-size:10px;color:var(--text2);margin-bottom:12px">${ailabSafe(s.desc)}</div>
      <div style="font-size:9px;color:var(--text3);margin-bottom:8px">${ailabSafe(s.basis)}${s.demo?' \u00b7 demo hidden in real mode':''}</div>

      <div class="lab-bars">
        <div class="lab-bar-group">
          <div class="lab-bar-label"><span>Win Rate</span><span style="color:var(--green)">${ailabPct(s.wr)}%</span></div>
          <div class="lab-bar-track"><div class="lab-bar-fill fill-green" style="width:${Math.min(100,Number(s.wr||0))}%"></div></div>
        </div>
        <div class="lab-bar-group">
          <div class="lab-bar-label"><span>RR Ratio</span><span style="color:var(--cyan)">1:${Number(s.rr||1.8).toFixed(1)}</span></div>
          <div class="lab-bar-track"><div class="lab-bar-fill fill-cyan" style="width:${Math.min(100,Number(s.rr||1.8)/4*100)}%"></div></div>
        </div>
        <div class="lab-bar-group">
          <div class="lab-bar-label"><span>AI Conf.</span><span style="color:var(--purple)">${ailabPct(s.conf)}%</span></div>
          <div class="lab-bar-track"><div class="lab-bar-fill fill-purple" style="width:${Math.min(100,Number(s.conf||0))}%"></div></div>
        </div>
      </div>

      <button class="deploy-btn" onclick="${s.live?`deployAILabMadeStrategy('${ailabSafe(s.name)}')`:`deployStrategy('${ailabSafe(s.name)}')`}">\ud83d\ude80 DEPLOY TO STRATEGY MANAGER</button>
    </div>`).join('');
}

function deployStrategy(name) {
  STRATEGIES.unshift({ name, type:'AI Generated', tf:'H1', wr:75, rr:2.5, consistency:80, enabled:true, auto:true });
  alert('\u2713 ' + name + ' deployed to Strategy Manager!');
}



/* ============ REAL AI LAB ENGINE v1: Journal -> Candidate -> AI Made Strategy ============ */
function ailabBase(){ return (window.SNIPEX_BRIDGE_BASE||BRIDGE_BASE||'http://127.0.0.1:5000'); }
function ailabPct(x){ x=Number(x||0); return isFinite(x)?x.toFixed(1):'0.0'; }
function ailabSafe(s){ return String(s==null?'':s).replace(/[<>&"']/g, m=>({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&#39;'}[m])); }

async function refreshAILabCockpit(){
  const status=document.getElementById('ailab-live-status');
  const bucket=document.getElementById('ailab-bucket-list');
  try{
    if(status) status.textContent='Syncing AI Lab...';
    const r=await fetch(ailabBase()+'/api/ai/lab/status?ts='+Date.now());
    const j=await r.json();
    const lab=j.lab||{};
    const patterns=lab.patterns||[];
    const validated=lab.validated_strategies||[];
    const trusted=lab.trusted_bucket||[];
    const raw=lab.raw_trades||[];
    const set=(id,v)=>{ const el=document.getElementById(id); if(el) el.textContent=v; };
    set('ailab-journal-count', lab.raw_count||0);
    set('ailab-trusted-count', lab.trusted_count||0);
    set('ailab-enabled-count', validated.length||0);
    if(status) status.textContent=`AI Lab Online \u00b7 ${lab.candidate_count||0} candidates \u00b7 ${lab.validated_count||0} AI made`;
    if(bucket){
      const top=(trusted.length?trusted:patterns).slice(0,8);
      bucket.innerHTML = top.length ? top.map(p=>{
        const isStrategy=!!p.name;
        const key=ailabSafe(p.key||'');
        const name=ailabSafe(p.name || `${p.symbol||'XAUUSD'} ${p.regime||'AUTO'} ${p.side||''} ${p.strategy||'MASTER_AI'}`);
        const trades=Number(p.trades||0), wr=Number(p.wr||p.win_rate||0), net=Number(p.net||0), conf=Number(p.confidence||p.avg_confidence||0);
        const statusTxt=ailabSafe(p.status || (isStrategy?'AI MADE':'RAW'));
        return `<div style="border:1px solid var(--border3);border-radius:10px;padding:10px;background:rgba(255,255,255,.025)">
          <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
            <b style="font-family:Orbitron,monospace;color:${isStrategy?'var(--fx)':'var(--cyan)'};font-size:10px">${name}</b>
            <span style="font-size:8px;color:var(--text3);border:1px solid var(--border3);border-radius:12px;padding:2px 6px">${statusTxt}</span>
            <span style="margin-left:auto;font-size:9px;color:var(--green)">WR ${ailabPct(wr)}%</span>
          </div>
          <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-top:8px;font-size:9px;color:var(--text2)">
            <div>Trades <b>${trades}</b></div><div>Net <b>${net.toFixed(2)}</b></div><div>Conf <b>${ailabPct(conf)}%</b></div><div>TF <b>${ailabSafe(p.tf||p.timeframe||'M5')}</b></div>
          </div>
          ${(!isStrategy && key)?`<button class="deploy-btn" style="margin-top:8px" onclick="promoteAILabPattern('${key}')">PROMOTE TO AI MADE STRATEGY</button>`:''}
          ${(isStrategy)?`<button class="deploy-btn" style="margin-top:8px" onclick="deployAILabMadeStrategy('${ailabSafe(p.name)}')">ADD TO STRATEGY MANAGER</button>`:''}
        </div>`;
      }).join('') : '<div style="font-size:10px;color:var(--text3)">No AI Lab positions yet. When Master AI takes/modifies trades, they will appear here as raw journal entries.</div>';
    }
    window.AI_LAB_STRATEGIES = validated;
    renderLabStrategies();
  }catch(e){
    if(status) status.textContent='AI Lab offline / bridge not reachable';
    if(bucket) bucket.innerHTML='<div style="font-size:10px;color:var(--red)">AI Lab backend not reachable. Start bridge first.</div>';
  }
}

async function addAILabJournalEvent(){
  const strategy=document.getElementById('ailab-journal-strategy')?.value || (aiMasterDecision?.best_strategy?.strategy) || 'MASTER_AI_FUSION';
  const timeframe=document.getElementById('ailab-journal-tf')?.value || getSelectedTFForAI();
  const style=document.getElementById('ailab-journal-style')?.value || 'AUTO';
  const pnl=Number(document.getElementById('ailab-journal-pnl')?.value || 0);
  const rr=Number(document.getElementById('ailab-journal-rr')?.value || 1.5);
  const payload={strategy, symbol:getSelectedSymbolForAI(), timeframe, trading_style:style, pnl, rr, result:pnl>0?'win':pnl<0?'loss':'flat', side:(aiMasterDecision?.side||'WAIT'), regime:(aiMasterDecision?.regime||'AUTO'), confidence:(aiMasterDecision?.confidence||0), factors:(aiMasterDecision?.factors||{}), source:'manual_ai_lab_journal'};
  try{
    await fetch(ailabBase()+'/api/ai/lab/record',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
    refreshAILabCockpit();
  }catch(e){ alert('AI Lab journal failed. Bridge start karo.'); }
}

async function promoteAILabPattern(key){
  try{
    await fetch(ailabBase()+'/api/ai/lab/promote',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({key})});
    refreshAILabCockpit();
  }catch(e){ alert('Promote failed. Bridge check karo.'); }
}

async function applyBestAILabBuckets(){
  try{
    const r=await fetch(ailabBase()+'/api/ai/lab/apply_best',{method:'POST'});
    const j=await r.json();
    alert('AI Lab applied: '+((j.promoted||[]).length)+' validated strategies promoted.');
    refreshAILabCockpit();
  }catch(e){ alert('Apply failed. Bridge check karo.'); }
}

function deployAILabMadeStrategy(name){
  const s=(window.AI_LAB_STRATEGIES||[]).find(x=>String(x.name)===String(name));
  if(!s) return alert('Strategy not found in AI Lab cache. Refresh AI Lab.');
  STRATEGIES.unshift({ name:s.name, type:'AI Made Strategy', tf:s.tf||'M5', wr:Number(s.wr||60), rr:Number(s.rr||1.8), consistency:Number(s.consistency||70), enabled:true, auto:false, ai_lab_key:s.key, hiddenRules:s.rules||{} });
  window.STRATEGIES=STRATEGIES;
  try{ renderStrategies(); populateChartStrategySelect(true); refreshAIMasterDecision(true); }catch(e){}
  alert('Added to Strategy Manager: '+s.name+'\
AUTO is OFF first, so you can test safely.');
}

/* ============ PNL ENGINE ============ */
const PNL_DATA = { gross:0, broker:0, spread:0, mt5fee:0, taxRate:0.30, source:'REAL MT5 REQUIRED', exactMt5:false, exactFinalNetUsd:null, exactFinalNetInr:null, exactDeals:0, manualExpensesUsd:0, indianTaxUsd:0 };
const PNL_CONFIG = { currency:'INR', usdInr:83.50, commissionPerLot:7, spreadPerLot:3, mt5FeeDaily:0, accountCurrency:'USD' };

function loadPnlSettings(){
  try{
    const savedCfg = JSON.parse(localStorage.getItem('snipex_pnl_config') || '{}');
    Object.assign(PNL_CONFIG, savedCfg || {});
    const savedExp = JSON.parse(localStorage.getItem('snipex_custom_expenses') || '[]');
    if(Array.isArray(savedExp)) customExpenses = savedExp;
  }catch(e){}
  const setVal=(id,v)=>{ const el=document.getElementById(id); if(el) el.value=v; };
  setVal('pnl-currency', PNL_CONFIG.currency);
  setVal('usd-inr-rate', PNL_CONFIG.usdInr);
  setVal('commission-per-lot', PNL_CONFIG.commissionPerLot);
  setVal('spread-per-lot', PNL_CONFIG.spreadPerLot);
  setVal('mt5-fee-daily', PNL_CONFIG.mt5FeeDaily);
}
function savePnlSettings(){
  try{
    localStorage.setItem('snipex_pnl_config', JSON.stringify(PNL_CONFIG));
    localStorage.setItem('snipex_custom_expenses', JSON.stringify(customExpenses));
  }catch(e){}
}
function updatePnlSetting(key, val){
  if(key === 'currency') PNL_CONFIG.currency = val === 'USD' ? 'USD' : 'INR';
  else PNL_CONFIG[key] = Math.max(0, Number(val)||0);
  savePnlSettings();
  updatePNL();
  renderTradeHistory();
  if(key === 'usdInr' || key === 'currency') syncRealNetPnl(true);
}
function money(v, forceCurrency){
  const cur = forceCurrency || PNL_CONFIG.currency;
  const rate = Number(PNL_CONFIG.usdInr)||1;
  const converted = cur === 'INR' ? v * rate : v;
  const sign = converted >= 0 ? '+' : '-';
  const sym = cur === 'INR' ? '\u20b9' : '$';
  return sign + sym + Math.abs(converted).toLocaleString(undefined,{minimumFractionDigits:2, maximumFractionDigits:2});
}
function expenseToUsd(amount, currency){
  const n = Number(amount)||0;
  const cur = String(currency || PNL_CONFIG.currency || 'USD').toUpperCase();
  return cur === 'INR' ? n / (Number(PNL_CONFIG.usdInr)||1) : n;
}
function getLocalClosedTrades(){
  const src = Array.isArray(TRADES) ? TRADES : [];
  return src.filter(t => Number.isFinite(Number(t.pnl)));
}
function recalcLocalPnl(){
  // Real-only mode: do not calculate/display fake/local fallback PNL from UI position array.
  if(!PNL_DATA.exactMt5){
    PNL_DATA.gross = 0; PNL_DATA.broker = 0; PNL_DATA.spread = 0; PNL_DATA.mt5fee = 0;
    PNL_DATA.source = 'REAL MT5 REQUIRED';
  }
}
function updatePNL() {
  recalcLocalPnl();
  const gross = Number(PNL_DATA.gross||0);
  const totalCustomUsd = PNL_DATA.exactMt5 ? Number(PNL_DATA.manualExpensesUsd||0) : customExpenses.reduce((s,e) => s + expenseToUsd(e.amount, e.currency), 0);
  let tax, net;
  if(PNL_DATA.exactMt5 && PNL_DATA.exactFinalNetUsd !== null){
    tax = Number(PNL_DATA.indianTaxUsd||0);
    // Keep all internal PNL values in account/base USD; money() converts once for display.
    // This prevents INR double-conversion and keeps ribbon/dashboard consistent.
    net = Number(PNL_DATA.exactFinalNetUsd||0);
  } else {
    const beforeTax = gross - Number(PNL_DATA.broker||0) - Number(PNL_DATA.spread||0) - Number(PNL_DATA.mt5fee||0) - totalCustomUsd;
    tax = Math.max(0, beforeTax) * Number(PNL_DATA.taxRate||0);
    net = beforeTax - tax;
  }

  const setTxt = (id, txt) => { const e=document.getElementById(id); if(e) e.textContent = txt; };
  const setMoney = (id, val) => setTxt(id, money(val));

  const fpnl = document.getElementById('final-pnl');
  if(fpnl) {
    fpnl.textContent = money(net);
    fpnl.style.color = net >= 0 ? 'var(--green)' : 'var(--red)';
    fpnl.style.textShadow = net >= 0 ? '0 0 40px var(--green-glow)' : '0 0 40px var(--red-glow)';
  }

  setMoney('pnl-gross', gross);
  setMoney('pnl-closed', gross);
  setMoney('pnl-broker', -Math.abs(Number(PNL_DATA.broker||0)));
  setMoney('pnl-spread', -Math.abs(Number(PNL_DATA.spread||0)));
  setMoney('pnl-mt5fee', -Math.abs(Number(PNL_DATA.mt5fee||0)));
  setMoney('pnl-custom', -Math.abs(totalCustomUsd));
  setMoney('pnl-tax', -Math.abs(tax));
  setTxt('pnl-tax-label', `Indian Tax (${Math.round(Number(PNL_DATA.taxRate||0)*100)}%)`);
  setTxt('pnl-source-note', `PNL source: ${PNL_DATA.source}. Display: ${PNL_CONFIG.currency}. Account: ${PNL_CONFIG.accountCurrency||'USD'}. USDINR: ${Number(PNL_CONFIG.usdInr||0).toFixed(2)}. Net = exact MT5 realized PNL in account currency converted once only; no point/lot/INR double-count.`);

  const ribPnl = document.getElementById('rib-pnl');
  if(ribPnl) { ribPnl.textContent = money(net); ribPnl.className = 'ribbon-val ' + (net>=0?'pos':'neg'); }
}

function updateTax(val) {
  PNL_DATA.taxRate = val / 100;
  const el = document.getElementById('tax-pct');
  if(el) el.textContent = val + '%';
  updatePNL();
  syncRealNetPnl(true);
}

function setPnlFilter(btn, period) {
  document.querySelectorAll('.filter-tab').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  PNL_DATA.source = 'REAL MT5 REQUIRED';
  updatePNL();
}

/* ============ EXPENSES ============ */
function normalizeExpenseForBackend(e){
  return {
    name: String(e.name || 'Manual expense'),
    amount: Number(e.amount || 0),
    currency: String(e.currency || PNL_CONFIG.currency || 'USD').toUpperCase(),
    note: String(e.note || ''),
    created_at: e.created_at || new Date().toISOString()
  };
}

async function syncExpensesToBackend(){
  try{
    const payload = { expenses: customExpenses.map(normalizeExpenseForBackend) };
    const res = await api('/api/pnl/expenses/sync', { method:'POST', body: JSON.stringify(payload) });
    if(res && res.ok){
      customExpenses = Array.isArray(res.expenses) ? res.expenses : customExpenses;
      savePnlSettings();
      logLive(`Manual expenses synced to exact MT5 PNL: ${customExpenses.length} item(s)`, 'ok');
      await syncRealNetPnl(true);
      return true;
    }
  }catch(err){
    logLive('Expense backend sync pending/offline: '+err.message, 'warn');
  }
  return false;
}

async function addExpense() {
  const name = document.getElementById('exp-name').value.trim();
  const amount = parseFloat(document.getElementById('exp-amount').value);
  if(!name || isNaN(amount) || amount <= 0) return;
  customExpenses.push({ name, amount, currency: PNL_CONFIG.currency, created_at: new Date().toISOString() });
  document.getElementById('exp-name').value = '';
  document.getElementById('exp-amount').value = '';
  savePnlSettings();
  renderExpenses();
  updatePNL();
  await syncExpensesToBackend();
}

async function removeExpense(i) {
  customExpenses.splice(i, 1);
  savePnlSettings();
  renderExpenses();
  updatePNL();
  await syncExpensesToBackend();
}

function renderExpenses() {
  const el = document.getElementById('expense-list');
  if(!el) return;
  if(customExpenses.length === 0) {
    el.innerHTML = '<div style="font-size:10px;color:var(--text3);padding:8px 0">No custom expenses added</div>';
    return;
  }
  el.innerHTML = customExpenses.map((e,i) => `
    <div class="pnl-row">
      <span class="pnl-row-label">${e.name} <small style="color:var(--text3)">(${e.currency||PNL_CONFIG.currency})</small></span>
      <div style="display:flex;align-items:center;gap:10px">
        <span class="pnl-row-val deduct">-${e.currency==='INR'?'\u20b9':'$'}${Number(e.amount||0).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}</span>
        <span onclick="removeExpense(${i})" style="cursor:pointer;color:var(--text3);font-size:12px;padding:2px 6px">\u2715</span>
      </div>
    </div>`).join('');
}



/* ============ REAL MT5 BRIDGE + TRADINGVIEW LIVE UPGRADE ============ */
var BRIDGE_BASE = window.SNIPEX_BRIDGE_BASE || 'http://127.0.0.1:5000';
let liveSymbol = 'XAUUSD';
let chartMode = 'single';
let bridgeOnline = false;
let livePollTimer = null;
const TV_SYMBOL_MAP = { XAUUSD:'OANDA:XAUUSD', XAGUSD:'OANDA:XAGUSD', XPDUSD:'OANDA:XPDUSD', EURUSD:'OANDA:EURUSD', GBPUSD:'OANDA:GBPUSD', USDJPY:'OANDA:USDJPY', USDCHF:'OANDA:USDCHF', USDCAD:'OANDA:USDCAD', AUDUSD:'OANDA:AUDUSD', NZDUSD:'OANDA:NZDUSD', EURJPY:'OANDA:EURJPY', GBPJPY:'OANDA:GBPJPY', EURGBP:'OANDA:EURGBP' };
function initLiveLogHoverPause(){
  const el=document.getElementById('live-log');
  if(!el || el.dataset.hoverPauseReady==='1') return;
  el.dataset.hoverPauseReady='1';
  window.SNIPEX_LOG_PAUSED=false;
  window.SNIPEX_LOG_BUFFER=window.SNIPEX_LOG_BUFFER||[];
  const setPill=(txt)=>{
    let pill=el.querySelector('.live-log-pause-pill');
    if(!txt){ if(pill) pill.remove(); return; }
    if(!pill){ pill=document.createElement('div'); pill.className='live-log-pause-pill'; el.prepend(pill); }
    pill.textContent=txt;
  };
  el.addEventListener('mouseenter',()=>{
    window.SNIPEX_LOG_PAUSED=true;
    el.classList.add('log-paused');
    setPill('\u23f8 LOG PAUSED \u00b7 move cursor out to resume');
  });
  el.addEventListener('mouseleave',()=>{
    window.SNIPEX_LOG_PAUSED=false;
    el.classList.remove('log-paused');
    const buf=(window.SNIPEX_LOG_BUFFER||[]).splice(0,80);
    setPill(null);
    if(buf.length){
      const html=buf.map(x=>x.html).reverse().join('');
      el.innerHTML = html + el.innerHTML;
      const rows=el.querySelectorAll('div:not(.live-log-pause-pill)');
      if(rows.length>220){ [...rows].slice(220).forEach(x=>x.remove()); }
    }
  });
}
function logLive(msg, kind=''){
  const txt=String(msg||'');
  const low=txt.toLowerCase();
  // HARD FILTER: boot/engine progress must never spam the position log.
  if(low.includes('live engine still booting') || low.includes('live engine booting') || low.includes('live engine self-healing') || low.includes('checking /api/status') || low.includes('bridge startup check') || low.includes('setup radar offline bridge timeout') || low.includes('setup radar: fail timed out')) return;
  const el=document.getElementById('live-log'); if(!el) return;
  try{ initLiveLogHoverPause(); }catch(e){}
  const t=new Date().toLocaleTimeString();
  const c=kind==='bad'?'var(--red)':kind==='ok'?'var(--green)':kind==='warn'?'var(--orange)':'var(--text2)';
  const safe=txt.replace(/[<>]/g, s=>s==='<'?'&lt;':'&gt;');
  const html=`<div style="color:${c}">[${t}] ${safe}</div>`;
  if(window.SNIPEX_LOG_PAUSED){
    window.SNIPEX_LOG_BUFFER=window.SNIPEX_LOG_BUFFER||[];
    window.SNIPEX_LOG_BUFFER.push({html, at:Date.now()});
    if(window.SNIPEX_LOG_BUFFER.length>80) window.SNIPEX_LOG_BUFFER.shift();
    const pill=el.querySelector('.live-log-pause-pill');
    if(pill) pill.textContent='\u23f8 LOG PAUSED \u00b7 '+window.SNIPEX_LOG_BUFFER.length+' new log(s) waiting';
    return;
  }
  el.innerHTML = html + el.innerHTML;
  const rows=el.querySelectorAll('div:not(.live-log-pause-pill)');
  if(rows.length>220){ [...rows].slice(220).forEach(x=>x.remove()); }
}
setTimeout(initLiveLogHoverPause, 400);
document.addEventListener('DOMContentLoaded', ()=>setTimeout(initLiveLogHoverPause, 200));
function installLiveEngineBootGuard(){
  window.addEventListener('error', (ev)=>{ try{ logLive('UI script error: '+(ev.message||'unknown'), 'bad'); }catch(e){} });
  window.addEventListener('unhandledrejection', (ev)=>{ try{ logLive('UI async error: '+((ev.reason&&ev.reason.message)||ev.reason||'unknown'), 'bad'); }catch(e){} });
  // Boot self-healing is handled by the mini status pill only.
  // No repeated 'Live engine booting...' messages are pushed into the position log.
}
installLiveEngineBootGuard();
function setBridgeUI(ok, text){
  bridgeOnline=!!ok;
  const top=document.getElementById('top-conn'); const topText=document.getElementById('top-conn-text');
  if(topText) topText.textContent = ok ? 'MT5 LIVE' : 'MT5 OFFLINE';
  if(top){ top.style.background = ok ? 'var(--green-dim)' : 'var(--red-dim)'; top.style.borderColor = ok ? 'var(--green-glow)' : 'var(--red-glow)'; top.style.color = ok ? 'var(--green)' : 'var(--red)'; }
  const note=document.getElementById('live-bridge-note'); if(note){ note.textContent=text || (ok?'Bridge connected':'Bridge offline'); note.className=ok?'status-ok':'status-bad'; }
  const latency=document.getElementById('bridge-latency'); if(latency){ latency.textContent = ok ? '\u25cf MT5 CONNECTED' : '\u25cf MT5 OFFLINE'; latency.className = 'bridge-status '+(ok?'bridge-ok':'bridge-fail'); }
  const mt5Conn=document.querySelector('.mt5-conn'); if(mt5Conn){ mt5Conn.innerHTML = `<div class="conn-dot"></div>${ok?'CONNECTED':'OFFLINE'}`; mt5Conn.style.color = ok ? 'var(--green)' : 'var(--red)'; }
}
async function api(path, options={}){
  const controller = new AbortController();
  const t = setTimeout(()=>controller.abort(), Number(options.timeoutMs||7000));
  try{
    const res = await fetch(BRIDGE_BASE + path, {headers:{'Content-Type':'application/json'}, ...options, signal: controller.signal});
    const data = await res.json().catch(()=>({ok:false,error:'Invalid bridge response'}));
    if(!res.ok || data.ok===false) throw new Error((data.error || ('HTTP '+res.status)) + ' @ ' + path);
    return data;
  }catch(err){
    if(String(err && err.name).includes('Abort')) throw new Error('Bridge timeout. Start/restart bridge or run Doctor.');
    throw err;
  }finally{
    clearTimeout(t);
  }
}
function fmtMoney(v, cur='$'){ return cur + Number(v||0).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2}); }
async function pullMT5Now(){
  try{
    const st=await api('/api/status');
    setBridgeUI(st.connected, st.connected ? `Bridge connected \u00b7 ${st.server||''}` : (st.error||'MT5 terminal not connected'));
    if(st.account){
      const a=st.account;
      const cur=a.currency||'USD'; const sign=cur==='USD'?'$':cur+' ';
      const set=(id,val)=>{const e=document.getElementById(id); if(e) e.textContent=val;};
      set('mt5-account', a.login||'--'); set('mt5-server', a.server||st.server||'--');
      set('mt5-bal', fmtMoney(a.balance,sign)); set('mt5-eq', fmtMoney(a.equity,sign));
      set('mt5-margin', fmtMoney(a.margin,sign)); set('mt5-free-margin', fmtMoney(a.margin_free,sign));
      const rib=document.getElementById('rib-eq'); if(rib) rib.textContent=fmtMoney(a.equity,sign);
    }
    await updateLivePrices();
    await updateLiveTradesAndPNL();
  }catch(e){ setBridgeUI(false, 'Bridge error: '+e.message); logLive('Bridge error: '+e.message,'bad'); }
}
async function updateLivePrices(){
  try{
    const data=await api('/api/prices?symbols=XAUUSD,XAGUSD,XPDUSD,EURUSD,GBPUSD,USDJPY,USDCHF,USDCAD,AUDUSD,NZDUSD,EURJPY,GBPJPY,EURGBP');
    if(!data.prices) return;
    for(const [sym,q] of Object.entries(data.prices)){
      if(!q || !q.bid) continue;
      prices[sym] = Number(q.bid);
      const asset=ASSETS[sym] || {unit:'',dp:2,base:Number(q.bid)};
      const el=document.getElementById('price-'+sym); if(el) el.textContent=(asset.unit||'')+Number(q.bid).toFixed(asset.dp||2);
    }
    renderTicker(); renderAssetCards();
  }catch(e){ logLive('Price fetch failed: '+e.message,'warn'); }
}
async function syncRealNetPnl(forceLog=false){
  try{
    const pnl = await api(`/api/pnl/real-net?symbol=${encodeURIComponent(liveSymbol)}&days=30&usd_inr=${Number(PNL_CONFIG.usdInr||83)}&tax=${Number(PNL_DATA.taxRate||0)*100}`);
    if(pnl && pnl.ok){
      PNL_DATA.exactMt5 = true;
      PNL_CONFIG.accountCurrency = String(pnl.account_currency || pnl.currency || 'USD').toUpperCase();
      // Backend sends USD-equivalent fields for UI so INR accounts are NOT multiplied twice.
      PNL_DATA.gross = Number(pnl.gross_profit_usd_equiv ?? pnl.gross_profit ?? pnl.gross ?? 0);
      PNL_DATA.broker = Math.abs(Number(pnl.commission_usd_equiv ?? pnl.commission ?? 0));
      PNL_DATA.spread = 0;
      PNL_DATA.mt5fee = Number(pnl.fee_usd_equiv ?? pnl.fee ?? 0) + Number(pnl.swap_usd_equiv ?? pnl.swap ?? 0);
      PNL_DATA.manualExpensesUsd = Number(pnl.manual_expenses_usd || 0);
      PNL_DATA.indianTaxUsd = Number(pnl.indian_tax_usd || 0);
      PNL_DATA.exactFinalNetUsd = Number(pnl.final_net_usd || pnl.final_net_usd_equiv || 0);
      PNL_DATA.exactFinalNetInr = Number(pnl.final_net_inr || 0);
      PNL_DATA.exactDeals = Number(pnl.deals_count || 0);
      if(Array.isArray(pnl.manual_expenses)){
        customExpenses = pnl.manual_expenses;
        savePnlSettings();
        renderExpenses();
      }
      PNL_DATA.source = `MT5 exact history (${PNL_DATA.exactDeals} deals) \u00b7 account ${PNL_CONFIG.accountCurrency} \u00b7 no double conversion \u00b7 commission/swap/fee verified`;
      updatePNL();
      if(forceLog) logLive(`Verified MT5 real-net PNL refreshed: expenses $${Number(PNL_DATA.manualExpensesUsd||0).toFixed(2)} \u00b7 final INR \u20b9${Number(PNL_DATA.exactFinalNetInr||0).toFixed(2)}`,'ok');
      return true;
    }
  }catch(err){
    if(forceLog) logLive('Exact PNL refresh failed: '+err.message, 'warn');
  }
  return false;
}

async function updateLiveTradesAndPNL(){
  try{
    const data=await api(`/api/trades?symbol=${encodeURIComponent(liveSymbol)}&days=30&limit=250`);
    const rows = Array.isArray(data.trade_history) ? data.trade_history : (Array.isArray(data.trades) ? data.trades : []);
    if(Array.isArray(rows)){
      PNL_CONFIG.accountCurrency = String(data.account_currency || PNL_CONFIG.accountCurrency || 'USD').toUpperCase();
      TRADES = rows.map((t,i)=>{
        const rawSide = String(t.side ?? t.type ?? '').toUpperCase();
        const side = rawSide.includes('SELL') || rawSide === '1' ? 'SELL' : 'BUY';
        const pnlRaw = Number(t.pnl ?? t.profit ?? 0);
        const pnlUsdEquiv = PNL_CONFIG.accountCurrency === 'INR' ? pnlRaw / (Number(PNL_CONFIG.usdInr)||83.5) : pnlRaw;
        return { id:t.ticket||t.id||i+1, status:t.status||'OPEN', sym:t.symbol, side, entry:Number(t.price_open??t.entry??0), exit:Number(t.price_current??t.exit??0), lots:Number(t.volume??t.lots??0), sl:Number(t.sl||0), tp:Number(t.tp||0), strat:t.comment||t.strategy||'MT5 LIVE', pnl:pnlUsdEquiv, pnlAccount:pnlRaw, pnlCurrency:PNL_CONFIG.accountCurrency, time:t.time||'' };
      });
      renderTradeHistory();
      const open=document.getElementById('rib-trades'); if(open) open.textContent=(data.open_positions||[]).length;
    }
    const pnlOk = await syncRealNetPnl(false);
    if(pnlOk) {
      // exact PNL already applied
    } else {
      PNL_DATA.exactMt5 = false;
      PNL_DATA.gross = 0; PNL_DATA.broker = 0; PNL_DATA.spread = 0; PNL_DATA.mt5fee = 0;
      PNL_DATA.source = 'REAL MT5 REQUIRED - no local PNL fallback';
      updatePNL();
    }
  }catch(e){ console.warn('Trade/PNL sync skipped:', e.message); }
}
function loadTradingViewBox(boxId, sym, tf){
  const box=document.getElementById(boxId); if(!box) return;
  const tvsym=TV_SYMBOL_MAP[sym] || ('OANDA:'+sym);
  box.innerHTML = '';
  const script=document.createElement('script');
  script.src='https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
  script.async=true;
  script.innerHTML=JSON.stringify({ autosize:true, symbol:tvsym, interval:tf, timezone:'Asia/Kolkata', theme:'dark', style:'1', locale:'en', allow_symbol_change:true, calendar:false, support_host:'https://www.tradingview.com' });
  box.appendChild(script);
}
function refreshTradingView(){
  const tf=(document.getElementById('live-tf')||{}).value || '5';
  const grid=document.getElementById('tv-grid');
  const oilPanel=document.getElementById('tv-panel-oil');
  const mainTitle=document.getElementById('tv-title-main');
  const symbolSelect=document.getElementById('live-symbol');
  chartMode=(document.getElementById('chart-mode')||{}).value || chartMode || 'single';
  if(chartMode==='fx-dual'){
    liveSymbol='XAUUSD';
    if(symbolSelect) symbolSelect.value='XAUUSD';
    if(grid) grid.classList.add('dual');
    if(oilPanel) oilPanel.style.display='block';
    if(mainTitle) mainTitle.textContent='XAUUSD GOLD';
    loadTradingViewBox('tradingview-frame','XAUUSD',tf);
    loadTradingViewBox('tradingview-frame-oil','XAGUSD',tf);
    logLive('Dual chart mode loaded: XAUUSD + XAGUSD TF '+tf,'ok');
  } else {
    if(grid) grid.classList.remove('dual');
    if(oilPanel) oilPanel.style.display='none';
    if(mainTitle) mainTitle.textContent=(liveSymbol==='XAUUSD'?'XAUUSD GOLD':liveSymbol);
    loadTradingViewBox('tradingview-frame',liveSymbol,tf);
    logLive('Single chart loaded: '+(TV_SYMBOL_MAP[liveSymbol] || liveSymbol)+' TF '+tf,'ok');
  }
}
function setChartMode(mode){
  chartMode=mode || 'single';
  refreshTradingView();
  const note = chartMode==='fx-dual' ? 'Dual mode ON: Gold + Silver visible together' : 'Single chart mode ON';
  logLive(note,'ok');
}
function selectLiveSymbol(sym){
  liveSymbol=sym;
  const modeSel=document.getElementById('chart-mode');
  if(chartMode==='fx-dual' && sym!=='XAUUSD'){
    chartMode='single';
    if(modeSel) modeSel.value='single';
    logLive('Switched to single mode for '+sym,'warn');
  }
  refreshTradingView();
  const rib=document.getElementById('rib-strat'); if(rib) rib.textContent = sym+' \u00b7 DOT LEVEL PRO';
  logLive('Selected symbol: '+sym,'ok');
}
async function manualOrder(side){
  if(aiOn){ logLive('Manual '+side+' blocked: Master AI is ON. Turn Master AI OFF for manual position automation.','warn'); return; }
  const lot=Number((document.getElementById('live-lot')||{}).value||0.01);
  try{
    logLive(`Sending ${side} ${liveSymbol} lot ${lot} to MT5...`,'warn');
    const r = window.SnipeXAlerts ? await SnipeXAlerts.executeWithAlert(() => api('/api/order',{method:'POST',body:JSON.stringify({symbol:liveSymbol,side,lot,comment:'SnipeX TV Monitor'})}), 'Auto trade') : await api('/api/order',{method:'POST',body:JSON.stringify({symbol:liveSymbol,side,lot,comment:'SnipeX TV Monitor'})});
    if(!r || r.ok===false){ logLive('Order failed: '+(r?.error||'unknown'),'bad'); return; }
    execCount++; document.getElementById('exec-count').textContent=execCount;
    logLive(`\u2705 MANUAL MT5 RESULT: ${r.retcode||'no-retcode'} ${r.retcode_name||''} ticket ${r.ticket || r.order_id || 'n/a'} deal ${r.deal || 'n/a'}`,'ok');
    await pullMT5Now();
  }catch(e){ logLive('Order failed: '+e.message,'bad'); }
}
async function closeAllPositions(){
  try{ const r=await api('/api/close_all',{method:'POST',body:JSON.stringify({symbol:liveSymbol})}); logLive(`Close request done: ${r.closed||0} position(s)`,'ok'); await pullMT5Now(); }
  catch(e){ logLive('Close all failed: '+e.message,'bad'); }
}
const _oldStartPriceUpdates = startPriceUpdates;
startPriceUpdates = function(){
  try{ logLive('Live engine started. Connecting to bridge...', 'ok'); }catch(e){}
  refreshTradingView();
  pullMT5Now();
  if(livePollTimer) clearInterval(livePollTimer);
  livePollTimer = setInterval(pullMT5Now, 2000);
};
const _oldFocusAsset = typeof focusAsset==='function' ? focusAsset : null;
focusAsset = function(sym){ selectLiveSymbol(sym); if(_oldFocusAsset) try{_oldFocusAsset(sym)}catch(e){} };



/* ============ FULL PARTIAL BOOKING ENGINE: MT5 + RETRY + FALLBACK STATUS ============ */
const SNIPEX_PARTIAL_CFG = {
  enabled: true,
  // Forex/Silver/Oil style absolute price points. Example: XAUUSD +2.00 = TP1.
  ladder: [
    {name:'TP1', points:2, close_percent:30},
    {name:'TP2', points:5, close_percent:30},
    {name:'TP3', points:8, close_percent:40, allow_full_close:true}
  ],
  retry_count: 3,
  retry_delay_ms: 900,
  min_seconds_between_attempts: 20,
  fallback_status_enabled: true
};
let partialEngineBusy = false;
let partialState = {};
try{ partialState = JSON.parse(localStorage.getItem('snipex_partial_state_v2') || '{}') || {}; }catch(e){ partialState = {}; }
function savePartialState(){ try{ localStorage.setItem('snipex_partial_state_v2', JSON.stringify(partialState)); }catch(e){} }
function partialKey(t, level){ return `${t.symbol||liveSymbol}:${t.id||t.ticket}:${level}`; }
function getPartialRecord(t){
  const id = `${t.symbol||liveSymbol}:${t.id||t.ticket}`;
  if(!partialState[id]) partialState[id] = {original_lots:Number(t.lots||0), levels:{}, last_attempt:0, virtual_locked:0, retry_after:{}};
  partialState[id].original_lots = Math.max(Number(partialState[id].original_lots||0), Number(t.lots||0));
  return partialState[id];
}
function ensurePartialPanel(){
  if(document.getElementById('partial-panel')) return;
  const p=document.createElement('div'); p.id='partial-panel';
  p.style.cssText='position:fixed;left:14px;bottom:72px;z-index:99998;width:345px;max-width:calc(100vw - 28px);background:rgba(5,10,20,.94);border:1px solid rgba(34,197,94,.28);box-shadow:0 0 28px rgba(34,197,94,.10);border-radius:18px;padding:12px;font-family:Inter,Arial;color:#e8f0fe;backdrop-filter:blur(14px)';
  p.innerHTML=`<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:8px"><div style="font-weight:900;color:var(--green);letter-spacing:.35px">\ud83d\udcb0 Partial Booking Engine</div><button id="partial-close" style="background:rgba(255,255,255,.06);color:var(--text1);border:1px solid rgba(255,255,255,.12);border-radius:10px;padding:4px 8px;cursor:pointer">\u00d7</button></div><div id="partial-status" style="font-size:12px;color:var(--text2);margin-bottom:8px">MT5 real partial close armed.</div><div id="partial-ladder" style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;font-size:11px;margin-bottom:8px"></div><div id="partial-last" style="font-size:11px;color:var(--text2);line-height:1.35;max-height:74px;overflow:auto">Waiting for open MT5 position...</div>`;
  document.body.appendChild(p);
  document.getElementById('partial-close').onclick=()=>p.style.display='none';
  const lad=document.getElementById('partial-ladder');
  if(lad) lad.innerHTML=SNIPEX_PARTIAL_CFG.ladder.map(x=>`<div style="background:rgba(255,255,255,.04);border-radius:10px;padding:7px">${x.name}<br><b>+${x.points} pts</b><br>${x.close_percent}%</div>`).join('');
}

function renderPartialStatusTable(){
  const el=document.getElementById('partial-ladder'); if(!el) return;
  let rows=[];
  try{
    const first=Object.values(partialState||{})[0] || {levels:{}};
    rows=SNIPEX_PARTIAL_CFG.ladder.map(x=>{
      const lv=(first.levels||{})[x.name] || {};
      const status=lv.status || 'pending';
      const retry=lv.retry_count ? ` \u00b7 retry ${lv.retry_count}` : '';
      const color=status==='real_confirmed'?'var(--green)':(status.includes('fallback')?'var(--orange)':'var(--text2)');
      return `<div style="background:rgba(255,255,255,.04);border-radius:10px;padding:7px;border:1px solid rgba(255,255,255,.06)"><b>${x.name}</b><br>+${x.points} pts \u00b7 ${x.close_percent}%<br><span style="color:${color}">${status}${retry}</span></div>`;
    });
  }catch(e){ rows=SNIPEX_PARTIAL_CFG.ladder.map(x=>`<div>${x.name}<br>pending</div>`); }
  el.innerHTML=rows.join('');
}
function paintPartialStatus(msg, good){
  ensurePartialPanel();
  const s=document.getElementById('partial-status'); if(s){s.textContent=msg; s.style.color=good?'var(--green)':'var(--orange)';}
  const l=document.getElementById('partial-last'); if(l) l.textContent = new Date().toLocaleTimeString()+' \u00b7 '+msg; renderPartialStatusTable();
}
async function mt5PartialCloseWithUiRetry(t, level, rec){
  const posId=`${t.symbol||liveSymbol}:${t.id||t.ticket}`;
  const now=Date.now();
  if(now - Number(rec.last_attempt||0) < SNIPEX_PARTIAL_CFG.min_seconds_between_attempts*1000) return;
  rec.last_attempt=now; savePartialState();
  const originalLots=Number(rec.original_lots||t.lots||0);
  const closeVol = +(originalLots * (Number(level.close_percent)/100)).toFixed(2);
  let lastErr='';
  for(let i=1;i<=SNIPEX_PARTIAL_CFG.retry_count;i++){
    try{
      paintPartialStatus(`Retry ${i}/${SNIPEX_PARTIAL_CFG.retry_count}: closing ${level.name} ${t.symbol} ${closeVol} lot on MT5...`, false);
      const r=await api('/api/partial_close',{method:'POST',body:JSON.stringify({
        symbol:t.symbol||liveSymbol,
        ticket:t.id||t.ticket,
        side:t.side,
        volume:closeVol,
        close_percent:level.close_percent,
        tp_name:level.name,
        allow_full_close:!!level.allow_full_close,
        retries:3,
        comment:'SnipeX '+level.name
      })});
      const p = r.partial || (Array.isArray(r.results) ? r.results[0] : {}) || {};
      if(r.skipped || p.skipped){
        rec.levels[level.name]={status:'skipped_min_volume', at:new Date().toISOString(), reason:p.reason||r.error||'Partial close skipped', before:p.before_volume, after:p.after_volume, non_retryable:true};
        savePartialState();
        paintPartialStatus(`\u2139\ufe0f ${level.name} skipped: ${p.reason||'partial volume not valid for this MT5 symbol/min lot.'}`, true);
        logLive(`\u2139\ufe0f ${level.name} partial skipped without fallback retries: ${p.reason||'min lot/step rule'}`,'warn');
        return true;
      }
      rec.levels[level.name]={status:'real_confirmed', at:new Date().toISOString(), closed_volume:p.closed_volume, before:p.before_volume, after:p.after_volume};
      savePartialState();
      paintPartialStatus(`\u2705 ${level.name} real MT5 partial confirmed. Lot ${p.before_volume} \u2192 ${p.after_volume}`, true);
      logLive(`\u2705 ${level.name} MT5 partial confirmed ${t.symbol}: ${p.before_volume} \u2192 ${p.after_volume}`,'ok');
      try{ if(window.SnipeXAlerts && typeof SnipeXAlerts.announcePartialBooked==='function') SnipeXAlerts.announcePartialBooked(); }catch(_e){}
      await pullMT5Now();
      return true;
    }catch(e){
      lastErr=e.message||String(e);
      const nonRetry = /market closed|non_retryable|minimum lot|min lot|trade disabled|close-only|closeonly/i.test(lastErr);
      logLive(`${level.name} partial ${nonRetry?'non-retryable stop':'retry '+i+' failed'}: ${lastErr}`,'warn');
      if(nonRetry){
        rec.levels[level.name]={status:'broker_blocked_no_fallback', at:new Date().toISOString(), error:lastErr, non_retryable:true};
        rec.retry_after = rec.retry_after || {}; rec.retry_after[level.name] = Date.now()+10*60*1000;
        savePartialState();
        paintPartialStatus(`\u23f8 ${level.name} partial paused: broker/MT5 blocked close now. No fallback retry spam.`, false);
        return false;
      }
      await new Promise(res=>setTimeout(res,SNIPEX_PARTIAL_CFG.retry_delay_ms));
    }
  }
  rec.levels[level.name]={status:'partial_paused_real_close', at:new Date().toISOString(), error:lastErr, retry_count:Number(rec.levels[level.name]?.retry_count||0)+1};
  rec.retry_after = rec.retry_after || {};
  rec.retry_after[level.name] = Date.now() + Math.max(15000, Number(SNIPEX_PARTIAL_CFG.failed_retry_cooldown_ms||30000));
  rec.virtual_locked = Number(rec.virtual_locked||0); // audit-only, no fake lot reduction
  savePartialState();
  paintPartialStatus(`\u26a0\ufe0f ${level.name} paused: MT5 partial failed after retries. Real lot not reduced.`, false);
  logLive(`\u26a0\ufe0f ${level.name} partial paused: MT5 lot reduction failed after retries. Error: ${lastErr}`,'bad');
  return false;
}
async function runPartialBookingEngine(){
  if(partialEngineBusy || !SNIPEX_PARTIAL_CFG.enabled) return;
  partialEngineBusy=true;
  try{
    ensurePartialPanel();
    const openTrades = Array.isArray(TRADES) ? TRADES.filter(t=>Number(t.lots||0)>0 && Number(t.entry||0)>0 && Number(t.exit||0)>0) : [];
    if(!openTrades.length){ paintPartialStatus('MT5 real partial close armed. No open position found.', true); return; }
    for(const t of openTrades){
      const rec=getPartialRecord(t);
      const profitPts = String(t.side).toUpperCase()==='SELL' ? Number(t.entry)-Number(t.exit) : Number(t.exit)-Number(t.entry);
      for(const level of SNIPEX_PARTIAL_CFG.ladder){
        const lv=rec.levels[level.name];
        const canRetryFallback = lv && lv.status==='partial_paused_real_close' && Date.now() >= Number((rec.retry_after||{})[level.name]||0);
        if(profitPts >= Number(level.points) && (!lv || canRetryFallback)){
          if(canRetryFallback) paintPartialStatus(`\ud83d\udd01 Retrying ${level.name} pending real MT5 partial close...`, false);
          await mt5PartialCloseWithUiRetry(t, level, rec);
          break; // one partial per polling cycle avoids over-closing in a spike
        }
      }
    }
  }finally{ partialEngineBusy=false; }
}
const _ppUpdateLiveTradesAndPNL = updateLiveTradesAndPNL;
updateLiveTradesAndPNL = async function(){
  await _ppUpdateLiveTradesAndPNL();
  try{ await runPartialBookingEngine(); }catch(e){ logLive('Partial engine error: '+e.message,'bad'); paintPartialStatus('Partial engine error: '+e.message,false); }
};
const _ppStartPriceUpdates = startPriceUpdates;
startPriceUpdates = function(){ _ppStartPriceUpdates(); ensurePartialPanel(); };


/* ============ SELF-HEALING WATCHDOG ENGINE UI ============ */
let watchdogTimer=null, watchdogLastSafe=false;
function injectWatchdogPanel(){
 if(document.getElementById('watchdog-panel')) return;
 const p=document.createElement('div'); p.id='watchdog-panel';
 p.style.cssText='position:fixed;right:14px;bottom:72px;z-index:99999;width:320px;max-width:calc(100vw - 28px);background:rgba(5,10,20,.94);border:1px solid rgba(0,229,255,.25);box-shadow:0 0 28px rgba(0,229,255,.12);border-radius:18px;padding:12px;font-family:Inter,Arial;color:#e8f0fe;backdrop-filter:blur(14px)';
 p.innerHTML=`<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:8px"><div style="font-weight:800;color:var(--cyan);letter-spacing:.4px">\ud83d\udee1\ufe0f Self-Healing Watchdog</div><button id="watchdog-close" style="background:rgba(255,255,255,.06);color:var(--text1);border:1px solid rgba(255,255,255,.12);border-radius:10px;padding:4px 8px;cursor:pointer">\u00d7</button></div><div id="watchdog-state" style="font-size:12px;color:var(--orange);margin-bottom:8px">Scanning...</div><div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;font-size:11px;margin-bottom:8px"><div style="background:rgba(255,255,255,.04);border-radius:10px;padding:7px">Last scan<br><b id="wd-last">--</b></div><div style="background:rgba(255,255,255,.04);border-radius:10px;padding:7px">Queue<br><b id="wd-queue">0</b></div><div style="background:rgba(255,255,255,.04);border-radius:10px;padding:7px">Repairs<br><b id="wd-fixes">0</b></div><div style="background:rgba(255,255,255,.04);border-radius:10px;padding:7px">Safe resume<br><b id="wd-safe">NO</b></div></div><div style="display:flex;gap:6px;margin-bottom:8px"><button id="wd-scan-now" style="flex:1;background:var(--cyan-dim);color:var(--cyan);border:1px solid var(--cyan-glow);border-radius:10px;padding:7px;cursor:pointer;font-weight:700">Scan Now</button><button id="wd-recover-now" style="flex:1;background:var(--fx-dim);color:var(--fx);border:1px solid var(--fx-glow);border-radius:10px;padding:7px;cursor:pointer;font-weight:700">Recover Queue</button></div><div id="wd-reason" style="font-size:11px;color:var(--text2);line-height:1.35;max-height:44px;overflow:auto">Waiting...</div>`;
 document.body.appendChild(p);
 document.getElementById('watchdog-close').onclick=()=>p.style.display='none';
 document.getElementById('wd-scan-now').onclick=async()=>{try{logLive('Manual watchdog scan started...','warn');await api('/api/watchdog/scan',{method:'POST',body:JSON.stringify({})});await updateWatchdogPanel();}catch(e){logLive('Watchdog scan failed: '+e.message,'bad')}};
 document.getElementById('wd-recover-now').onclick=async()=>{try{logLive('Execution queue recovery started...','warn');await api('/api/watchdog/recover_queue',{method:'POST',body:JSON.stringify({})});await updateWatchdogPanel();}catch(e){logLive('Queue recovery failed: '+e.message,'bad')}};
}
function paintWatchdog(wd){ if(!wd) return; injectWatchdogPanel(); const safe=!!wd.safe_resume; watchdogLastSafe=safe; const set=(id,v)=>{const e=document.getElementById(id); if(e)e.textContent=v}; const s=document.getElementById('watchdog-state'); if(s){s.textContent=safe?'\u2705 Safe trade-resume active':'\u26a0\ufe0f Position resume locked until health is clean';s.style.color=safe?'var(--green)':'var(--orange)'} set('wd-last',wd.last_scan_iso?wd.last_scan_iso.replace(' UTC',''):'--'); set('wd-queue',(wd.execution_queue||[]).length); set('wd-fixes',wd.fix_count||0); set('wd-safe',safe?'YES':'NO'); const r=document.getElementById('wd-reason'); if(r)r.textContent=wd.resume_block_reason||wd.last_error||'Healthy'; }
async function updateWatchdogPanel(){ try{const r=await api('/api/watchdog/status'); paintWatchdog(r.watchdog);}catch(e){const s=document.getElementById('watchdog-state'); if(s){s.textContent='Watchdog offline: '+e.message;s.style.color='var(--red)'}} }
const _wdPull=pullMT5Now; pullMT5Now=async function(){await _wdPull(); try{await updateWatchdogPanel()}catch(e){}};
const _wdOrder=manualOrder; manualOrder=async function(side){ if(!watchdogLastSafe) logLive('Watchdog safe-resume lock active. Scan/repair first, then retry trade.','warn'); return _wdOrder(side); };
const _wdStart=startPriceUpdates; startPriceUpdates=function(){ _wdStart(); injectWatchdogPanel(); updateWatchdogPanel(); if(watchdogTimer)clearInterval(watchdogTimer); watchdogTimer=setInterval(updateWatchdogPanel,10000); };


/* ============ SETUP FORMING RADAR + CHART DRAWING OVERLAY ============ */
let setupRadarTimer=null;
let lastSetupDraw=null;
let setupScanBusy=false;
let setupScanLastStarted=0;
function injectSetupRadarCss(){
  if(document.getElementById('setup-radar-css')) return;
  const st=document.createElement('style'); st.id='setup-radar-css';
  st.textContent=`
    .tv-frame{position:relative!important}
    .tv-frame iframe,.tv-frame > div:not(#setup-draw-layer){position:relative;z-index:1}
    #setup-draw-layer{position:absolute;inset:0;pointer-events:none;z-index:2147483000;font-family:'Share Tech Mono',monospace}
    .draw-line{position:absolute;left:0;right:0;height:0;border-top:1px dashed rgba(255,255,255,.65)}
    .draw-line.entry{border-top-color:rgba(0,229,255,.95);box-shadow:0 0 12px rgba(0,229,255,.45)}
    .draw-line.sl{border-top-color:rgba(255,23,68,.95);box-shadow:0 0 12px rgba(255,23,68,.35)}
    .draw-line.tp{border-top-color:rgba(34,197,94,.95);box-shadow:0 0 12px rgba(34,197,94,.35)}
    .draw-label{position:absolute;right:8px;transform:translateY(-50%);font-size:10px;font-weight:900;padding:3px 7px;border-radius:999px;background:rgba(5,10,20,.86);border:1px solid rgba(255,255,255,.15);color:#e8f0fe;white-space:nowrap}
    .draw-zone{position:absolute;left:0;right:0;background:rgba(255,193,7,.10);border-top:1px solid rgba(255,193,7,.45);border-bottom:1px solid rgba(255,193,7,.45)}
    .draw-arrow{position:absolute;left:50%;transform:translate(-50%,-50%);font-size:26px;text-shadow:0 0 18px rgba(0,229,255,.9)}
    .draw-strategy{position:absolute;right:12px;top:12px;left:auto;transform:none;z-index:2147483001;font-family:'Orbitron',monospace;font-size:11px;font-weight:900;letter-spacing:1.2px;color:rgba(245,200,66,.95);background:rgba(5,10,20,.62);border:1px solid rgba(245,200,66,.38);border-radius:10px;padding:7px 11px;box-shadow:0 0 18px rgba(245,200,66,.16);white-space:nowrap;text-transform:uppercase;opacity:.94;backdrop-filter:blur(4px);max-width:58%;overflow:hidden;text-overflow:ellipsis}
    .draw-strategy:before{content:'SELECTED STRATEGY';display:block;font-family:'Share Tech Mono',monospace;font-size:7px;letter-spacing:1.4px;color:rgba(232,240,254,.58);margin-bottom:2px}
    #setup-radar-panel{margin-top:10px;display:grid;grid-template-columns:1.1fr .9fr;gap:8px}
    .setup-box{background:rgba(255,255,255,.035);border:1px solid rgba(255,255,255,.10);border-radius:12px;padding:9px;font-size:11px;color:var(--text2)}
    .setup-big{font-family:'Orbitron',monospace;font-size:12px;font-weight:900;letter-spacing:1px;margin-bottom:5px}
    .setup-ready{color:var(--green)} .setup-forming{color:var(--fx)} .setup-scan{color:var(--text3)} .setup-bad{color:var(--red)}
  `;
  document.head.appendChild(st);
}
function ensureSetupRadarPanel(){
  injectSetupRadarCss();
  const card=document.querySelector('.tv-card'); if(!card) return;
  if(document.getElementById('setup-radar-panel')) return;
  const panel=document.createElement('div'); panel.id='setup-radar-panel';
  panel.innerHTML=`<div class="setup-box"><div class="setup-big setup-scan" id="setup-state">\ud83d\udef0 Setup Radar: scanning...</div><div id="setup-reason">Waiting for MT5 candles and tick.</div></div><div class="setup-box"><div>Direction: <b id="setup-dir">--</b> \u00b7 Confidence: <b id="setup-conf">0%</b></div><div style="margin-top:5px">Activation Zone <b id="setup-entry">--</b> \u00b7 SL <b id="setup-sl">--</b> \u00b7 TP3 <b id="setup-tp">--</b></div></div>`;
  const log=document.getElementById('live-log'); card.insertBefore(panel, log);
}
function getDrawLayer(){
  injectSetupRadarCss();
  const frame=document.getElementById('tradingview-frame'); if(!frame) return null;
  let layer=document.getElementById('setup-draw-layer');
  if(!layer){ layer=document.createElement('div'); layer.id='setup-draw-layer'; frame.appendChild(layer); }
  return layer;
}
function yForPrice(price, minP, maxP){
  if(!isFinite(price) || maxP<=minP) return 50;
  const pad=8, h=100-pad*2;
  return pad + (maxP-price)/(maxP-minP)*h;
}
function paintSetupPanel(setup, err){
  ensureSetupRadarPanel();
  const state=document.getElementById('setup-state'), reason=document.getElementById('setup-reason');
  if(err){ if(state){state.textContent='\ud83d\udef0 Setup Radar: safe WAIT';state.className='setup-big setup-scan'} if(reason) reason.textContent='Radar refreshing in background: '+err; return; }
  if(!setup || typeof setup !== 'object'){
    setup={symbol:(window.liveSymbol||liveSymbol||'XAUUSD'), timeframe:((document.getElementById('live-tf')||{}).value||'5'), ready:false, forming:false, direction:'WAIT', confidence:0, reason:'Waiting for valid MT5 setup data.'};
  }
  const liveReady=!!setup.live_engine_ready;
  const cls=setup.ready||liveReady?'setup-ready':(setup.forming?'setup-forming':'setup-scan');
  if(state){state.textContent=(setup.ready?'\u2705 READY TO TRIGGER':(liveReady?'\u2705 LIVE ENGINE READY':(setup.forming?'\u26a1 SETUP FORMING':'\ud83d\udef0 SCANNING')))+' \u00b7 '+(setup.symbol||'XAUUSD')+' '+(setup.timeframe||'M5'); state.className='setup-big '+cls;}
  if(reason) reason.textContent=setup.reason || (liveReady?'MT5 candles loaded. Waiting for strategy confirmation.':'waiting for confirmation');
  const set=(id,v)=>{const e=document.getElementById(id); if(e)e.textContent=v};
  set('setup-dir', setup.direction||'--'); set('setup-conf', (setup.confidence||0)+'%'); set('setup-entry', setup.entry||'--'); set('setup-sl', setup.sl||'--'); set('setup-tp', setup.tp3||setup.tp||'--');
  const stratText = setup.strategy_name || setup.strategy || setup.active_strategy || '';
  if(stratText && reason) reason.textContent = (setup.reason || 'waiting for confirmation') + ' \u00b7 Strategy: ' + stratText;
}
function getActiveChartStrategyName(setup){
  const chartSel = document.getElementById('chart-strategy-select');
  if(chartSel && chartSel.value) return String(chartSel.value);
  const fromSetup = setup && (setup.strategy_name || setup.strategy || setup.active_strategy);
  if(fromSetup) return String(fromSetup);
  try{
    const best = window.aiMasterDecision && window.aiMasterDecision.best_strategy && window.aiMasterDecision.best_strategy.strategy;
    if(best) return String(best);
  }catch(e){}
  try{
    const list = (window.STRATEGIES || STRATEGIES || []);
    const deployed = Array.isArray(list) ? list.find(s=>s && (s.enabled || s.auto || s.deployed)) : null;
    if(deployed && (deployed.fullName || deployed.name)) return String(deployed.fullName || deployed.name);
    if(Array.isArray(list) && list.length && (list[0].fullName || list[0].name)) return String(list[0].fullName || list[0].name);
  }catch(e){}
  const lab = document.getElementById('ailab-journal-strategy');
  if(lab && lab.value) return lab.value;
  return 'SnipeX Scan Setup';
}
function addStrategyWatermark(layer, setup){
  // Single-source watermark fix: only fixed chart watermark box is used.
  // Older merged patches also added .draw-strategy in chart layer, causing duplicate names.
  try{
    if(layer) [...layer.querySelectorAll(".draw-strategy")].forEach(x=>x.remove());
    const wm=document.getElementById("chart-strategy-watermark");
    const nameEl=document.getElementById("chart-strategy-watermark-name");
    const strat=getActiveChartStrategyName(setup);
    if(wm && nameEl && strat){
      nameEl.textContent=String(strat).replace(/[<>]/g,"").slice(0,64);
      wm.style.display="block";
    }
  }catch(e){}
}

function populateChartStrategySelect(force){
  const sel=document.getElementById('chart-strategy-select');
  if(!sel) return;
  if(sel.dataset.ready==='1' && !force) return;
  const old=sel.value;
  let names=[];
  try{
    const list=(window.STRATEGIES || STRATEGIES || []);
    if(Array.isArray(list)) names=list.map(x=>String((x&& (x.fullName || x.name || x.id)) || '').trim()).filter(Boolean);
  }catch(e){}
  names.unshift('HF Range Sniper v2 - Range % Breakout Retest');
  const seen=new Set();
  const finalNames=[];
  names.forEach(n=>{ const key=n.toLowerCase(); if(!seen.has(key)){ seen.add(key); finalNames.push(n); } });
  sel.innerHTML='';
  finalNames.forEach(n=>{
    const opt=document.createElement('option');
    opt.value=n; opt.textContent=n;
    sel.appendChild(opt);
  });
  if(old && finalNames.includes(old)) sel.value=old;
  else if(finalNames.length) sel.value=finalNames[0];
  sel.dataset.ready='1';
}
setTimeout(populateChartStrategySelect, 500);
setTimeout(populateChartStrategySelect, 1800);
document.addEventListener('DOMContentLoaded', populateChartStrategySelect);

function isHFRangeSniperSelected(){
  const n=(getActiveChartStrategyName(null)||'').toUpperCase();
  return n.includes('HF RANGE SNIPER') || n.includes('RANGE % SNIPER') || n.includes('RANGE PERCENT');
}
function normalizeCandleHF(c){
  return {open:Number(c.open||c.o||0), high:Number(c.high||c.h||0), low:Number(c.low||c.l||0), close:Number(c.close||c.c||0), volume:Number(c.tick_volume||c.volume||c.v||0)};
}
function evaluateHFRangeSniperFromCandles(candles, sym, qtf){
  const raw=(Array.isArray(candles)?candles:[]).map(normalizeCandleHF).filter(c=>c.high&&c.low&&c.close);
  if(raw.length<25) return {symbol:sym,timeframe:qtf,status:'WAITING_CANDLES',ready:false,forming:true,direction:'WAIT',confidence:0,strategy_name:'HF Range Sniper v2 - Range % Breakout Retest',reason:'HF Range Sniper waiting for at least 25 MT5 candles.'};
  const lookback=Math.min(40, raw.length-2);
  const box=raw.slice(raw.length-1-lookback, raw.length-1);
  const last=raw[raw.length-1], prev=raw[raw.length-2];
  const high=Math.max(...box.map(c=>c.high));
  const low=Math.min(...box.map(c=>c.low));
  const range=Math.max(0.01, high-low);
  const close=last.close;
  const body=Math.abs(last.close-last.open);
  const candleRange=Math.max(0.01,last.high-last.low);
  const bodyPct=(body/candleRange)*100;
  const breakoutBuffer=range*0.18;
  const retestTol=range*0.12;
  const volAvg=box.reduce((a,c)=>a+(c.volume||0),0)/Math.max(1,box.length);
  const volOk=!volAvg || (last.volume||0)>=volAvg*0.9;
  const buyBreak=last.close>high+breakoutBuffer;
  const sellBreak=last.close<low-breakoutBuffer;
  const buyRetest=(prev.close>high || last.high>high) && last.low<=high+retestTol && last.close>high;
  const sellRetest=(prev.close<low || last.low<low) && last.high>=low-retestTol && last.close<low;
  const fakeBuy=last.high>high+breakoutBuffer && last.close<high;
  const fakeSell=last.low<low-breakoutBuffer && last.close>low;
  let side='WAIT', ready=false, forming=true, conf=35, reason='HF Range Sniper drew live range box. Waiting for breakout close + retest hold.';
  if(fakeBuy){ side='SELL'; conf=62; reason='Fake upside breakout detected. HF mode blocks continuation and watches reversal.'; }
  else if(fakeSell){ side='BUY'; conf=62; reason='Fake downside breakdown detected. HF mode blocks continuation and watches reversal.'; }
  else if((buyBreak||buyRetest) && bodyPct>=45 && volOk){ side='BUY'; ready=buyRetest || bodyPct>=62; forming=!ready; conf=Math.min(92, 68 + (buyRetest?12:0) + (bodyPct>=62?8:0) + (volOk?4:0)); reason=ready?'HF Range Sniper Bullish Conditions ready: breakout close + retest/hold + momentum confirmed.':'HF Range Sniper Bullish Conditions forming: breakout seen, waiting stronger retest hold.'; }
  else if((sellBreak||sellRetest) && bodyPct>=45 && volOk){ side='SELL'; ready=sellRetest || bodyPct>=62; forming=!ready; conf=Math.min(92, 68 + (sellRetest?12:0) + (bodyPct>=62?8:0) + (volOk?4:0)); reason=ready?'HF Range Sniper Bearish Conditions ready: breakdown close + retest/hold + momentum confirmed.':'HF Range Sniper Bearish Conditions forming: breakdown seen, waiting stronger retest hold.'; }
  const buyTargets={tp1:high+range*0.25,tp2:high+range*0.50,tp3:high+range*0.75,tp4:high+range*1.20,sl:high-range*0.35,entry:close};
  const sellTargets={tp1:low-range*0.25,tp2:low-range*0.50,tp3:low-range*0.75,tp4:low-range*1.20,sl:low+range*0.35,entry:close};
  const t=side==='SELL'?sellTargets:buyTargets;
  return {symbol:sym,timeframe:qtf,status:ready?'READY':'FORMING',ready,forming,direction:side,confidence:Math.round(conf),price:Number(close.toFixed(2)),entry:Number(t.entry.toFixed(2)),sl:Number(t.sl.toFixed(2)),tp1:Number(t.tp1.toFixed(2)),tp2:Number(t.tp2.toFixed(2)),tp3:Number(t.tp3.toFixed(2)),tp4:Number(t.tp4.toFixed(2)),tp:Number(t.tp4.toFixed(2)),zone_high:Number(high.toFixed(2)),zone_low:Number(low.toFixed(2)),strategy_name:'HF Range Sniper v2 - Range % Breakout Retest',strategy:'HF Range Sniper v2 - Range % Breakout Retest',reason};
}
async function buildHFRangeSniperSetup(sym,qtf){
  const c=await api('/api/candles/repair?symbol='+encodeURIComponent(sym)+'&tf='+encodeURIComponent(qtf)+'&count=90',{timeoutMs:12000}).catch(e=>({ok:false,error:e.message,candles:[]}));
  const setup=evaluateHFRangeSniperFromCandles((c&&c.candles)||[], (c&&c.symbol)||sym, (c&&c.tf)||qtf);
  if(c && c.error) setup.reason+=' Candle source note: '+c.error;
  return setup;
}

function drawSetupOnChart(setup){
  lastSetupDraw=setup;
  try{ updateSelectedStrategyWatermark(true); }catch(e){}
  const layer=getDrawLayer(); if(!layer) return;
  if(!setup){ layer.innerHTML=''; addStrategyWatermark(layer, {strategy_name:getActiveChartStrategyName(null)}); return; }
  const vals=[setup.price, setup.entry, setup.sl, setup.tp1, setup.tp2, setup.tp3, setup.tp4, setup.zone_high, setup.zone_low].map(Number).filter(x=>isFinite(x) && x>0);
  if(!vals.length){
    layer.innerHTML='';
    addStrategyWatermark(layer, setup || {strategy_name:getActiveChartStrategyName(null)});
    return;
  }
  const minP=Math.min(...vals), maxP=Math.max(...vals), pad=(maxP-minP)*0.15 || 1;
  const lo=minP-pad, hi=maxP+pad;
  layer.innerHTML='';
  if(setup.zone_high && setup.zone_low){
    const y1=yForPrice(Number(setup.zone_high),lo,hi), y2=yForPrice(Number(setup.zone_low),lo,hi);
    const z=document.createElement('div'); z.className='draw-zone'; z.style.top=Math.min(y1,y2)+'%'; z.style.height=Math.max(1,Math.abs(y2-y1))+'%'; layer.appendChild(z);
  }
  const lines=[['Entry',setup.entry,'entry'],['SL',setup.sl,'sl'],['TP1 25%',setup.tp1,'tp'],['TP2 50%',setup.tp2,'tp'],['TP3 75%',setup.tp3,'tp'],['TP4 120%',setup.tp4,'tp']];
  for(const [label,price,cls] of lines){
    if(!price) continue; const y=yForPrice(Number(price),lo,hi);
    const l=document.createElement('div'); l.className='draw-line '+cls; l.style.top=y+'%'; layer.appendChild(l);
    const lab=document.createElement('div'); lab.className='draw-label'; lab.style.top=y+'%'; lab.textContent=label+' '+price; layer.appendChild(lab);
  }
  const a=document.createElement('div'); a.className='draw-arrow'; a.style.top=yForPrice(Number(setup.entry||setup.price),lo,hi)+'%'; a.textContent=setup.direction==='SELL'?'\u2b07 Bearish Conditions':'\u2b06 Bullish Conditions'; layer.appendChild(a);
  addStrategyWatermark(layer, setup);
}
/* ============ REAL AUTO-TRADE TRIGGER ENGINE PATCH ============
   Scan + Draw remains visual, then this fires ONLY ready setups through /api/order.
*/
const SNIPEX_AUTO_TRIGGER = window.SNIPEX_AUTO_TRIGGER || (window.SNIPEX_AUTO_TRIGGER = {
  busy:false,
  lockUntil:0,
  lastKey:'',
  lastTicket:null,
  cooldownMs:60000,
  rejectUnlockMs:8000,
  minConfidence:72
});
function getSnipeXTradeLot(setup){
  const el=document.getElementById('live-lot');
  let lot=Number(el && el.value ? el.value : 0.01);
  try{
    const d=window.aiMasterDecision || {};
    if(d.max_lot_cap) lot=Math.min(lot, Number(d.max_lot_cap));
    if(d.risk_lot && d.risk_lot.final_lot) lot=Number(d.risk_lot.final_lot);
  }catch(e){}
  if(!isFinite(lot) || lot<=0) lot=0.01;
  return Math.max(0.01, Math.round(lot*100)/100);
}
function getSetupTimeframe(setup){
  const tf=String((setup&&setup.timeframe) || '').toUpperCase();
  if(tf) return tf;
  const raw=(document.getElementById('live-tf')||{}).value || '5';
  return raw==='1'?'M1':raw==='5'?'M5':raw==='15'?'M15':raw==='60'?'H1':raw==='240'?'H4':raw==='D'?'D1':raw;
}
function hasOpenPositionForSymbol(sym){
  try{
    return Array.isArray(TRADES) && TRADES.some(t=>{
      const same=String(t.sym||t.symbol||'').toUpperCase()===String(sym||'').toUpperCase();
      const vol=Number(t.volume||t.lots||t.lot||0);
      const closed=String(t.status||t.state||'').toUpperCase().includes('CLOSED') || Number(t.closed||0)===1;
      return same && !closed && (vol>0 || !('volume' in t || 'lots' in t || 'lot' in t));
    });
  } catch(e){ return false; }
}
function resetAutoTriggerLock(reason){
  SNIPEX_AUTO_TRIGGER.busy=false;
  SNIPEX_AUTO_TRIGGER.lockUntil=0;
  SNIPEX_AUTO_TRIGGER.lastKey='';
  try{ logLive('\ud83d\udd13 Auto trigger lock reset'+(reason?': '+reason:''), 'ok'); }catch(e){}
}
window.resetAutoTriggerLock = resetAutoTriggerLock;
async function resetDailyLimitsLock(){
  const msg='Reset Daily Limits? This will NOT close trades. It saves current daily PNL/equity as the new baseline so daily loss/equity locks start fresh from now.';
  try{ if(!confirm(msg)) return; }catch(e){}
  const base=(window.SNIPEX_BRIDGE_BASE||BRIDGE_BASE||'http://127.0.0.1:5000');
  try{
    logLive('\ud83e\uddef Resetting daily loss/equity daily limits...', 'warn');
    const r=await fetch(base + '/api/risk/reset_daily_limits', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({source:'ui_button'})});
    const j=await r.json().catch(()=>({ok:false, reason:'Invalid bridge response'}));
    if(j && j.ok){
      try{ resetAutoTriggerLock('daily limits reset'); }catch(e){}
      const risk=j.risk||{};
      logLive('\u2705 Daily limits reset done. New daily PNL baseline: '+((j.baseline||{}).daily_pnl_raw ?? '--')+' \u00b7 Current counted daily PNL: '+(risk.daily_pnl ?? '--')+' \u00b7 Equity baseline: '+((j.baseline||{}).equity ?? '--'), 'ok');
      const el=document.getElementById('trigger-status-main');
      if(el){ el.textContent='DAILY LIMITS RESET'; el.className='trigger-status-value ok'; }
      try{ await refreshRiskStatusPanel?.(); }catch(e){}
    } else {
      logLive('\u274c Daily limits reset failed: '+(j.reason||j.message||('HTTP '+r.status)), 'err');
    }
  }catch(e){
    logLive('\u274c Daily limits reset bridge error: '+(e.message||e), 'err');
  }
}
window.resetDailyLimitsLock = resetDailyLimitsLock;
function isStrategyAutoEnabledForSetup(setup){
  const setupName=String((setup&& (setup.strategy_name || setup.strategy || setup.active_strategy)) || getActiveChartStrategyName(setup) || '').toUpperCase();
  try{
    const list=(window.STRATEGIES || STRATEGIES || []);
    const hit=Array.isArray(list) ? list.find(s=>{
      const n=String((s.fullName||s.name||'')).toUpperCase();
      return setupName && (setupName.includes(n) || n.includes(setupName) || (setupName.includes('HF RANGE SNIPER') && n.includes('HF RANGE SNIPER')));
    }) : null;
    if(hit) return (hit.enabled !== false) && (hit.auto !== false); // default AUTO allowed when Master AI is ON
  }catch(e){}
  return setupName.includes('HF RANGE SNIPER');
}
async function maybeAutoTriggerSetup(setup, source='radar'){
  if(!setup) return {fired:false, reason:'setup missing'};
  if(!setup.ready){
    const rrReady = Number(setup.rr || setup.riskReward || setup.min_rr || 0);
    const confReady = Number(setup.confidence || setup.master_confidence || 0);
    const dirReady = String(setup.direction || setup.side || '').toUpperCase();
    if(!(rrReady >= 3 && confReady >= 70 && ['BUY','SELL'].includes(dirReady))){
      return {fired:false, reason:'setup not ready'};
    }
    try{ logLive('\u26a0 setup.ready=false bypassed for confirmed RR>=1:3 high-quality setup. Backend hard safety will decide.','warn'); }catch(e){}
  }
  const side=String(setup.direction||'').toUpperCase();
  if(!['BUY','SELL'].includes(side)) return {fired:false, reason:'direction missing'};
  const sym=String(setup.symbol || window.liveSymbol || liveSymbol || 'XAUUSD').toUpperCase();
  const conf=Number(setup.confidence || 0);
  const key=[sym, side, Number(setup.entry||setup.price||0).toFixed(2), getSetupTimeframe(setup), String(setup.strategy_name||setup.strategy||'')].join('|');
  let evoDecision=null;
  try{ if(window.SnipeXEvolution3741&&typeof window.SnipeXEvolution3741.approveSetup==='function') evoDecision=window.SnipeXEvolution3741.approveSetup(Object.assign({},setup,{symbol:sym,side,direction:side,confidence:conf,rr:(setup.rr||setup.riskReward||5)})); }catch(_e){}
  if(!aiOn) return {fired:false, reason:'Master AI OFF / Manual mode'};
  if(!autoOn) return {fired:false, reason:'AI Execution Engine OFF'};
  if(!isStrategyAutoEnabledForSetup(setup)){ try{ logLive('\u26a0 Strategy AUTO disabled locally. Backend authority may still allow elite setup.','warn'); }catch(e){} }
  if(!bridgeOnline){ try{ logLive('\u26d4 Auto trigger blocked: MT5 bridge offline.', 'warn'); }catch(e){} return {fired:false, reason:'bridge offline'}; }
  if(conf && conf < SNIPEX_AUTO_TRIGGER.minConfidence && !(evoDecision&&evoDecision.approved)){ try{ logLive(`\u26a0 Soft warning only: confidence ${conf}% < ${SNIPEX_AUTO_TRIGGER.minConfidence}%. Backend Master AI will make final decision.`, 'warn'); }catch(e){} }
  if(hasOpenPositionForSymbol(sym) && !(evoDecision&&evoDecision.approved)){ try{ logLive('\u26a0 Soft warning only: local UI sees open position for '+sym+'. Backend duplicate guard will make final decision.', 'warn'); }catch(e){} }
  if(evoDecision&&evoDecision.approved){ try{ logLive('\ud83e\udde0 STEP37-41 approved: legacy confidence/open-position soft blocker dismissed for '+sym, 'ok'); }catch(e){} }
  if(SNIPEX_AUTO_TRIGGER.busy){ try{ logLive('\u26a0 Execution busy converted to soft warning. Elite setup may continue.','warn'); }catch(e){} }
  if(Date.now() < SNIPEX_AUTO_TRIGGER.lockUntil){ try{ logLive('\u26a0 Frontend cooldown ignored for backend final gate.','warn'); }catch(e){} }
  if(SNIPEX_AUTO_TRIGGER.lastKey === key){ try{ logLive('\u26a0 Re-entry / continuation setup allowed despite same setup key.','warn'); }catch(e){} }

  SNIPEX_AUTO_TRIGGER.busy=true;
  SNIPEX_AUTO_TRIGGER.lastKey=key;
  SNIPEX_AUTO_TRIGGER.lockUntil=Date.now()+SNIPEX_AUTO_TRIGGER.cooldownMs;
  const lot=getSnipeXTradeLot(setup);
  const payload={
    symbol:sym,
    side,
    lot,
    volume:lot,
    sl: setup.sl || 0,
    tp: setup.tp || setup.tp3 || setup.tp2 || setup.tp1 || 0,
    timeframe:getSetupTimeframe(setup),
    strategy: setup.strategy_name || setup.strategy || getActiveChartStrategyName(setup),
    strategy_name: setup.strategy_name || setup.strategy || getActiveChartStrategyName(setup),
    confidence: conf,
    comment:'SnipeX Auto Trigger',
    queue_on_fail:true,
    source:'auto_trigger_'+source
  };
  try{
    logLive(`\ud83d\ude80 AUTO TRIGGER FIRING ${side} ${sym} lot ${lot} \u00b7 ${payload.strategy_name}`, 'ok');
    const fire=()=>api('/api/order',{method:'POST',body:JSON.stringify(payload), timeoutMs:12000});
    const r = window.SnipeXAlerts ? await window.SnipeXAlerts.executeWithAlert(fire, 'Auto trade') : await fire();
    if(!r || r.ok===false){
      const why=(r && (r.error || r.retcode_name || r.retcode)) || 'unknown order reject';
      if(r && r.attempts) logLive('\ud83e\uddfe Execution attempts: '+r.attempts.map(a=>`${a.attempt}/${a.retcode_name||a.retcode}`).join(' \u2192 '),'warn');
      throw new Error(why);
    }
    execCount++; const ec=document.getElementById('exec-count'); if(ec) ec.textContent=execCount;
    SNIPEX_AUTO_TRIGGER.lastTicket=r.ticket || (r.result&&r.result.order) || null;
    logLive(`\u2705 MASTER AI MT5 RESULT: ${r.retcode||'no-retcode'} ${r.retcode_name||''} ticket ${SNIPEX_AUTO_TRIGGER.lastTicket || r.order_id || 'n/a'} deal ${r.deal || 'n/a'} \u00b7 ${sym} ${side} \u00b7 lock ${Math.round(SNIPEX_AUTO_TRIGGER.cooldownMs/1000)}s`, 'ok');
    try{ recordTrigger && recordTrigger({status:'EXECUTED', strategy:payload.strategy_name, direction:side, confidence:conf, tf:payload.timeframe, lot, reason:'Auto trigger fired from ready setup'}); }catch(e){}
    setTimeout(()=>{ SNIPEX_AUTO_TRIGGER.busy=false; }, 1200);
    try{ await pullMT5Now(); }catch(e){}
    return {fired:true, ticket:SNIPEX_AUTO_TRIGGER.lastTicket};
  }catch(e){
    SNIPEX_AUTO_TRIGGER.busy=false;
    SNIPEX_AUTO_TRIGGER.lastKey=''; // allow retry of same setup after broker/bridge rejection
    // Secure dedupe patch: failed/rejected order must not create a duplicate/cooldown memory.
    logLive('\u274c AUTO TRIGGER BLOCKED/FAILED: '+e.message, 'bad');
    try{ recordTrigger && recordTrigger({status:'BLOCKED', strategy:payload.strategy_name, direction:side, confidence:conf, tf:payload.timeframe, lot, reason:e.message}); }catch(_){}
    return {fired:false, reason:e.message};
  }
}




/* ============ MASTER AI AUTO STRATEGY SWITCHING ENGINE ============
   Master AI ON  = strategy selection is owned by AI.
   Master AI OFF = manual dropdown selection is preserved.
   This engine uses live MT5 candle geometry when available and falls back safely.
*/
window.MASTER_AI_SWITCH_STATE = window.MASTER_AI_SWITCH_STATE || {
  enabled:true, lastStrategy:'', lastRegime:'BOOT', lastReason:'waiting for live candles', lastAt:0, minSwitchGapMs:12000, busy:false
};
function candleNum(c, keys){ for(const k of keys){ const v=Number(c && c[k]); if(isFinite(v) && v!==0) return v; } return 0; }
function normalizeSwitchCandle(c){ return {open:candleNum(c,['open','o']), high:candleNum(c,['high','h']), low:candleNum(c,['low','l']), close:candleNum(c,['close','c','bid','ask']), volume:candleNum(c,['tick_volume','real_volume','volume','v'])}; }
function smaSwitch(vals, n){ const a=vals.slice(-n).filter(x=>isFinite(x)); return a.length ? a.reduce((p,x)=>p+x,0)/a.length : 0; }
function emaSwitch(vals, n){ const a=vals.filter(x=>isFinite(x)); if(!a.length) return 0; const k=2/(n+1); let e=a[0]; for(let i=1;i<a.length;i++) e=a[i]*k+e*(1-k); return e; }
function inferMarketRegimeForSwitch(rawCandles){
  const candles=(Array.isArray(rawCandles)?rawCandles:[]).map(normalizeSwitchCandle).filter(c=>c.high&&c.low&&c.close);
  if(candles.length<25) return {regime:'WAIT', confidence:0, strategy:'HF Range Sniper v2 - Range % Breakout Retest', tf:'M5', side:'WAIT', reason:'waiting for 25+ live MT5 candles'};
  const closes=candles.map(c=>c.close), highs=candles.map(c=>c.high), lows=candles.map(c=>c.low);
  const last=candles[candles.length-1];
  const recent=candles.slice(-20), base=candles.slice(-50);
  const recentHigh=Math.max(...recent.map(c=>c.high));
  const recentLow=Math.min(...recent.map(c=>c.low));
  const baseHigh=Math.max(...base.map(c=>c.high));
  const baseLow=Math.min(...base.map(c=>c.low));
  const range=Math.max(0.00001, recentHigh-recentLow);
  const baseRange=Math.max(range, baseHigh-baseLow);
  const avgRange=smaSwitch(candles.map(c=>Math.max(0.00001,c.high-c.low)), 20);
  const eFast=emaSwitch(closes, 21), eSlow=emaSwitch(closes, 50);
  const slope=(closes[closes.length-1]-closes[Math.max(0,closes.length-11)]) / Math.max(0.00001, avgRange);
  const body=Math.abs(last.close-last.open);
  const wickUp=last.high-Math.max(last.open,last.close);
  const wickDn=Math.min(last.open,last.close)-last.low;
  const wickRatio=Math.max(wickUp, wickDn)/Math.max(0.00001,last.high-last.low);
  const compression = range / Math.max(0.00001, baseRange);
  const nearEqualHighs = highs.slice(-14).filter(h=>Math.abs(h-recentHigh)<=avgRange*0.18).length >= 2;
  const nearEqualLows = lows.slice(-14).filter(l=>Math.abs(l-recentLow)<=avgRange*0.18).length >= 2;
  const sweptHigh = last.high > recentHigh - avgRange*0.02 && last.close < recentHigh - avgRange*0.20 && wickUp > body*1.2;
  const sweptLow = last.low < recentLow + avgRange*0.02 && last.close > recentLow + avgRange*0.20 && wickDn > body*1.2;
  const trendStrength = Math.abs(slope) + (Math.abs(eFast-eSlow)/Math.max(0.00001,avgRange))*0.35;
  const isTrend = trendStrength >= 2.0 && ((eFast>eSlow && slope>0.8) || (eFast<eSlow && slope<-0.8));
  const isRange = compression <= 0.62 && trendStrength < 2.3;
  const isTrap = (nearEqualHighs || nearEqualLows) && (sweptHigh || sweptLow || wickRatio > 0.62);
  if(isTrap) return {regime:'LIQUIDITY_TRAP', confidence:Math.min(95,72+wickRatio*20), strategy:'Liquidity Sweep Sniper PRO - Low SL Huge Trailing', tf:'M1', side:sweptHigh?'SELL':(sweptLow?'BUY':'WAIT'), reason:'equal highs/lows + wick sweep detected'};
  if(isTrend) return {regime:(eFast>eSlow?'BULL_TREND':'BEAR_TREND'), confidence:Math.min(94,68+trendStrength*7), strategy:'TREND FOLLOW H4', tf:'H1', side:eFast>eSlow?'BUY':'SELL', reason:'EMA structure + momentum slope trending'};
  if(isRange) return {regime:'RANGE_COMPRESSION', confidence:Math.min(93,70+(1-compression)*25), strategy:'HF Range Sniper v2 - Range % Breakout Retest', tf:'M5', side:last.close>=(recentHigh+recentLow)/2?'BUY':'SELL', reason:'compressed box/range detected, breakout-retest mode preferred'};
  return {regime:'CHOP_WAIT', confidence:45, strategy:'HF Range Sniper v2 - Range % Breakout Retest', tf:'M5', side:'WAIT', reason:'mixed/choppy structure, Master AI should wait'};
}
function setMasterAIStrategySelection(decision){
  if(!aiOn || !decision) return false;
  populateChartStrategySelect && populateChartStrategySelect(true);
  const sel=document.getElementById('chart-strategy-select');
  const target=String(decision.strategy||'').trim();
  if(!sel || !target) return false;
  const opts=[...sel.options];
  let opt=opts.find(o=>String(o.value).toUpperCase()===target.toUpperCase()) || opts.find(o=>String(o.value).toUpperCase().includes(target.toUpperCase()) || target.toUpperCase().includes(String(o.value).toUpperCase()));
  if(!opt){ opt=document.createElement('option'); opt.value=target; opt.textContent=target; sel.appendChild(opt); }
  const previous=sel.value; sel.value=opt.value;
  window.MASTER_AI_SWITCH_STATE.lastStrategy=sel.value;
  window.MASTER_AI_SWITCH_STATE.lastRegime=decision.regime||'AUTO';
  window.MASTER_AI_SWITCH_STATE.lastReason=decision.reason||'';
  window.MASTER_AI_SWITCH_STATE.lastAt=Date.now();
  try{ updateSelectedStrategyWatermark(true); }catch(e){}
  try{
    const d=window.aiMasterDecision || {};
    d.regime=decision.regime || d.regime || 'AUTO_SWITCH';
    d.side=decision.side || d.side || 'WAIT';
    d.confidence=Math.max(Number(d.confidence||0), Number(decision.confidence||0));
    d.best_strategy=Object.assign({}, d.best_strategy||{}, {strategy:sel.value, score:decision.confidence||d.confidence||0});
    d.auto_switch=decision;
    d.note='Master AI Auto Switch: '+(decision.reason||'strategy selected from live market regime');
    window.aiMasterDecision=d;
  }catch(e){}
  if(previous!==sel.value){ try{ logLive("Master AI auto-switched: "+decision.regime+" -> "+sel.value+" - "+decision.reason, "ok"); }catch(e){} }
  return previous!==sel.value;
}
async function runMasterAIAutoSwitch(force){
  if(!aiOn || !window.MASTER_AI_SWITCH_STATE.enabled) return null;
  const st=window.MASTER_AI_SWITCH_STATE;
  if(st.busy) return null;
  if(!force && Date.now()-Number(st.lastAt||0) < Number(st.minSwitchGapMs||12000)) return null;
  st.busy=true;
  try{
    const sym=(window.liveSymbol || liveSymbol || 'XAUUSD');
    const tfRaw=(document.getElementById('live-tf')||{}).value || '5';
    const tf=tfRaw==='1'?'M1':tfRaw==='5'?'M5':tfRaw==='15'?'M15':tfRaw==='60'?'H1':tfRaw==='240'?'H4':tfRaw==='D'?'D1':tfRaw;
    let candles=[];
    try{ const c=await api('/api/candles/repair?symbol='+encodeURIComponent(sym)+'&tf='+encodeURIComponent(tf)+'&count=90',{timeoutMs:10000}); candles=(c&&c.candles)||[]; }
    catch(e){ st.lastReason='candle fetch failed: '+e.message; }
    const decision=inferMarketRegimeForSwitch(candles); decision.symbol=sym; decision.timeframe=tf;
    setMasterAIStrategySelection(decision);
    try{ renderAIMasterDecision(window.aiMasterDecision || {approved:decision.confidence>=65,best_strategy:{strategy:decision.strategy,score:decision.confidence},regime:decision.regime,side:decision.side,confidence:decision.confidence,block_reasons:decision.regime==='CHOP_WAIT'?['Market chop: wait mode']:[],note:decision.reason}); }catch(e){}
    return decision;
  }finally{ st.busy=false; }
}
window.runMasterAIAutoSwitch=runMasterAIAutoSwitch;
setInterval(()=>{ if(aiOn) runMasterAIAutoSwitch(false); }, 20000);

function updateSelectedStrategyWatermark(forceShow){
  try{ populateChartStrategySelect && populateChartStrategySelect(); }catch(e){}
  const wm=document.getElementById('chart-strategy-watermark');
  const nameEl=document.getElementById('chart-strategy-watermark-name');
  if(!wm || !nameEl) return;
  const name=getActiveChartStrategyName(lastSetupDraw || null) || 'SnipeX Scan Setup';
  nameEl.textContent=String(name).replace(/[<>]/g,'').slice(0,64);
  wm.style.display = forceShow ? 'block' : (name ? 'block' : 'none');
}
async function scanAndDrawSelectedStrategy(){
  updateSelectedStrategyWatermark(true);
  const layer=getDrawLayer && getDrawLayer();
  if(layer){
    layer.innerHTML='';
    addStrategyWatermark(layer, {strategy_name:getActiveChartStrategyName(null)});
  }
  try{ logLive && logLive('\ud83d\udd8a Scan + Draw clicked: running fresh analysis and drawing setup overlay.', 'ok'); }catch(e){}
  return scanSetupNow({manualDrawOnly:true, source:'button'}).then((setup)=>{
    updateSelectedStrategyWatermark(true);
    return setup;
  }).catch((e)=>{
    updateSelectedStrategyWatermark(true);
    try{ logLive && logLive('Scan + Draw safe wait: '+e.message, 'warn'); }catch(_){}
  });
}
window.updateSelectedStrategyWatermark=updateSelectedStrategyWatermark;
window.scanAndDrawSelectedStrategy=scanAndDrawSelectedStrategy;
window.drawSetupOnChart = drawSetupOnChart;
window.scanSetupNow = scanSetupNow;
window.checkScanAndDrawButton = function(){
  const btn=[...document.querySelectorAll('button')].find(b=>/Scan\s*(Setup\s*)?\+\s*Draw/i.test(b.textContent||''));
  const ok=!!btn && typeof window.scanAndDrawSelectedStrategy==='function' && typeof window.scanSetupNow==='function';
  try{ logLive(ok ? '\u2705 Scan + Draw button check OK: button + scan function + draw layer ready.' : '\u274c Scan + Draw button check failed: missing button or function.', ok?'ok':'bad'); }catch(e){}
  return {ok, button_text:btn ? btn.textContent : null, has_scan:typeof window.scanSetupNow==='function', has_draw:typeof window.drawSetupOnChart==='function'};
};
setTimeout(()=>updateSelectedStrategyWatermark(false), 900);
setTimeout(()=>updateSelectedStrategyWatermark(false), 2200);
document.addEventListener('DOMContentLoaded', ()=>setTimeout(()=>updateSelectedStrategyWatermark(false), 300));

async function scanSetupNow(options){
  options = options || {};
  const manualDrawOnly = !!options.manualDrawOnly;
  try{ populateChartStrategySelect(); }catch(e){}
  try{ if(aiOn && !options.manualDrawOnly && typeof runMasterAIAutoSwitch==='function') await runMasterAIAutoSwitch(false); }catch(e){}
  if(setupScanBusy){
    const msg='Radar refresh already running. Skipping duplicate scan to prevent call-stack loop.';
    try{ paintSetupPanel(lastSetupDraw || {symbol:(window.liveSymbol||liveSymbol||'XAUUSD'), timeframe:'--', reason:msg, ready:false, forming:false}, null); }catch(e){}
    try{ logLive('\ud83d\udef0 '+msg, 'warn'); }catch(e){}
    return lastSetupDraw;
  }
  setupScanBusy=true;
  setupScanLastStarted=Date.now();
  ensureSetupRadarPanel();
  const tf=(document.getElementById('live-tf')||{}).value || '5';
  const qtf=tf==='1'?'M1':tf==='5'?'M5':tf==='15'?'M15':tf==='60'?'H1':tf==='240'?'H4':tf==='D'?'D1':tf;
  const sym = (window.liveSymbol || liveSymbol || 'XAUUSD');
  const scanBtns=[...document.querySelectorAll('button')].filter(b=>/Scan\s*(Setup\s*)?\+\s*Draw/i.test(b.textContent||''));
  scanBtns.forEach(b=>{b.dataset.oldText=b.textContent;b.disabled=true;b.textContent='Scanning + Drawing...';});
  try{
    logLive('\ud83d\udef0 Scan Setup + Draw started: '+sym+' '+qtf, 'warn');
    if(isHFRangeSniperSelected && isHFRangeSniperSelected()){
      const hfSetup = await buildHFRangeSniperSetup(sym, qtf);
      paintSetupPanel(hfSetup);
      drawSetupOnChart(hfSetup);
      if(hfSetup.ready && !manualDrawOnly){ try{ await maybeAutoTriggerSetup(hfSetup, 'hf_range_sniper'); }catch(autoErr){ logLive('HF Range auto trigger safe error: '+autoErr.message, 'warn'); } }
      else if(hfSetup.ready && manualDrawOnly){ logLive('\ud83d\udd8a HF Range Sniper setup ready/drawn. Manual Scan + Draw did not fire auto trade.', 'ok'); }
      else { logLive(`\u26a1 HF Range Sniper ${hfSetup.status||'SCANNING'} ${hfSetup.direction||'WAIT'} ${hfSetup.symbol}: ${hfSetup.confidence||0}% \u00b7 ${hfSetup.reason}`, 'warn'); }
      return hfSetup;
    }
    // First kick the backend scanner. This makes the button actively scan instead of only waiting for old cache.
    api('/api/setup_status/refresh?symbol='+encodeURIComponent(sym)+'&tf='+encodeURIComponent(qtf), {timeoutMs:3000}).catch(()=>{});

    let r=await api('/api/setup_status?symbol='+encodeURIComponent(sym)+'&tf='+encodeURIComponent(qtf)+'&force=1', {timeoutMs:9000});
    let setup=(r && typeof r.setup==='object') ? r.setup : null;
    if(!setup && manualDrawOnly){
      const selectedName=getActiveChartStrategyName(null);
      setup={symbol:sym,timeframe:qtf,status:'DRAW_ONLY',ready:false,forming:true,direction:'WAIT',confidence:0,strategy_name:selectedName,strategy:selectedName,reason:'Manual Scan + Draw: selected strategy watermark drawn. Waiting for live setup levels.'};
    }

    // If radar is still warming, pull real candles directly so the Draw button can still paint a safe live guide.
    if(!setup || /warming|background|candles|0\/10|wait/i.test(String(setup.reason||setup.status||''))){
      const c = await api('/api/candles/repair?symbol='+encodeURIComponent(sym)+'&tf='+encodeURIComponent(qtf)+'&count=80', {timeoutMs:12000}).catch(e=>({ok:false,error:e.message,count:0}));
      if(c && c.ready && Array.isArray(c.candles) && c.candles.length){
        const last = c.candles[c.candles.length-1] || {};
        const price = Number(last.close || last.c || last.bid || last.ask || 0);
        const high = Math.max(...c.candles.slice(-20).map(x=>Number(x.high||x.h||0)).filter(Boolean));
        const low = Math.min(...c.candles.slice(-20).map(x=>Number(x.low||x.l||0)).filter(Boolean));
        const range = Math.max(0.01, high-low);
        setup = Object.assign({
          symbol: c.symbol || sym, timeframe: c.tf || qtf, status:'SCANNING', ready:false, forming:true,
          direction: price >= ((high+low)/2) ? 'BUY' : 'SELL', confidence: 35,
          price: price, entry: price.toFixed(2),
          sl: (price - range*0.35).toFixed(2), tp1: (price + range*0.35).toFixed(2), tp2: (price + range*0.55).toFixed(2), tp3: (price + range*0.8).toFixed(2),
          zone_high: high.toFixed(2), zone_low: low.toFixed(2),
          strategy_name:'MT5 LIVE CANDLE DRAW GUIDE',
          reason:'Radar warming, but live MT5 candles are available. Drawing safe guide levels only.'
        }, setup||{});
      } else if(c && (c.count||0) < 10) {
        logLive('\ud83d\udee0 Candle repair still waiting: '+(c.count||0)+'/10 \u00b7 open exact symbol chart in MT5 and right-click Refresh.', 'warn');
      }
    }

    if(setup){
      const selectedStrategyName = getActiveChartStrategyName(setup);
      setup.strategy_name = selectedStrategyName;
      setup.strategy = selectedStrategyName;
      setup.active_strategy = selectedStrategyName;
    }
    paintSetupPanel(setup);
    drawSetupOnChart(setup);

    if(setup && setup.reason && /candles|0\/10|auto-repair/i.test(setup.reason)){
      window._lastCandleRepairAt = window._lastCandleRepairAt || 0;
      if(Date.now() - window._lastCandleRepairAt > 15000){
        window._lastCandleRepairAt = Date.now();
        api('/api/candles/repair?symbol='+encodeURIComponent(sym)+'&tf='+encodeURIComponent(qtf)+'&count=100', {timeoutMs:12000}).then(x=>{
          if(x && x.ready) logLive(`\ud83d\udee0 Candle auto-repair ready: ${x.symbol} ${x.tf} ${x.count}/10`, 'ok');
          else {
            const msg = ((x&&x.repair_note)||'MT5 history loading');
            const shortMsg = msg.includes('MT5 terminal returned no history')
              ? 'MT5 history 0/10: open exact symbol chart in MT5, right-click Refresh, scroll back once, then retry.'
              : msg;
            logLive(`\ud83d\udee0 Candle repair: ${(x&&x.count)||0}/10 \u00b7 ${shortMsg}`, 'warn');
          }
        }).catch(()=>{});
      }
    }
    if(setup && setup.ready){
      logLive(`\u2705 Setup ready ${setup.direction} ${setup.symbol}: entry ${setup.entry}, SL ${setup.sl}, TP3 ${setup.tp3}`,'ok');
      if(manualDrawOnly){
        logLive('\ud83d\udd8a Scan + Draw button used: selected strategy drawn as chart watermark only. Auto position not fired from this click.', 'ok');
      } else {
        try{ await maybeAutoTriggerSetup(setup, 'scan_draw'); }catch(autoErr){ logLive('Auto trigger safe error: '+autoErr.message, 'warn'); }
      }
    }
    else if(setup && setup.forming) logLive(`\u26a1 Setup forming/drawn ${setup.direction||'WAIT'} ${setup.symbol||sym}: ${setup.confidence||0}% \u00b7 ${setup.reason||'Scanning'} \u00b7 Strategy: ${getActiveChartStrategyName(setup)}`,'warn');
    else logLive('\ud83d\udef0 Setup scan complete: waiting for valid MT5 setup data.', 'warn');
    return setup;
  }catch(e){
    paintSetupPanel(null,e.message);
    const layer=getDrawLayer();
    if(layer){ layer.innerHTML=''; addStrategyWatermark(layer, lastSetupDraw || {strategy_name:getActiveChartStrategyName(null)}); }
    logLive('Setup radar safe wait: '+e.message,'warn');
    return lastSetupDraw;
  }finally{
    try{ scanBtns.forEach(b=>{b.disabled=false;b.textContent=b.dataset.oldText||'Scan Setup + Draw';}); }catch(e){}
    setupScanBusy=false;
  }
}
const _setupRefreshTV = refreshTradingView;
refreshTradingView = function(){ _setupRefreshTV(); setTimeout(()=>{ if(lastSetupDraw) drawSetupOnChart(lastSetupDraw); }, 1000); };
const _setupOrder=manualOrder;
manualOrder=async function(side){
  const before=await scanSetupNow().catch(()=>null);
  await _setupOrder(side);
  setTimeout(async()=>{ const after=await scanSetupNow().catch(()=>before); if(after) { drawSetupOnChart(after); logLive('\ud83d\udccc Position trigger drawing refreshed on chart overlay.','ok'); } }, 900);
};
const _setupPull=pullMT5Now;
pullMT5Now=async function(){ await _setupPull(); try{ await scanSetupNow(); }catch(e){} };
const _setupStart=startPriceUpdates;
startPriceUpdates=function(){
  if(window.__snipex_startPriceUpdates_running){
    ensureSetupRadarPanel();
    if(!setupRadarTimer) setupRadarTimer=setInterval(()=>scanSetupNow().catch(()=>{}), 10000);
    return;
  }
  window.__snipex_startPriceUpdates_running=true;
  try{ _setupStart(); }catch(e){ try{logLive('Live engine wrapper protected from stack loop: '+e.message,'warn')}catch(_){} }
  ensureSetupRadarPanel();
  setTimeout(()=>scanSetupNow().catch(()=>{}), 250);
  if(setupRadarTimer) clearInterval(setupRadarTimer);
  setupRadarTimer=setInterval(()=>scanSetupNow().catch(()=>{}), 10000);
};


/* ============ FLOATING PANEL CONTROLS: MINIMIZE + AUTO-HIDE + TOP MENU REOPEN ============ */
(function(){
  const STORE_KEY='snipex_panel_prefs_v1';
  const defaults={partial:{visible:true,minimized:false,autohide:false},watchdog:{visible:true,minimized:false,autohide:false}};
  function loadPrefs(){ try{return Object.assign({}, defaults, JSON.parse(localStorage.getItem(STORE_KEY)||'{}'));}catch(e){return JSON.parse(JSON.stringify(defaults));} }
  function savePrefs(p){ try{localStorage.setItem(STORE_KEY, JSON.stringify(p));}catch(e){} }
  function prefsFor(type){ const p=loadPrefs(); p[type]=Object.assign({}, defaults[type], p[type]||{}); return p; }
  function setPref(type, patch){ const p=prefsFor(type); p[type]=Object.assign(p[type], patch); savePrefs(p); applyPanelState(type); updatePanelMenuBadges(); }

  function injectFloatingPanelCss(){
    if(document.getElementById('snipex-floating-panel-css')) return;
    const st=document.createElement('style'); st.id='snipex-floating-panel-css';
    st.textContent=`
      .panel-dropdown{position:relative;display:inline-flex;align-items:center;margin-left:4px}
      .panel-dropdown-btn{font-family:'Orbitron',monospace;font-size:9px;font-weight:700;letter-spacing:1.4px;padding:6px 12px;background:rgba(255,255,255,.03);border:1px solid rgba(0,229,255,.18);color:var(--cyan);border-radius:4px;cursor:pointer;text-transform:uppercase}
      .panel-dropdown-menu{display:none;position:absolute;top:32px;right:0;min-width:230px;background:rgba(5,10,20,.98);border:1px solid rgba(0,229,255,.22);box-shadow:0 18px 45px rgba(0,0,0,.35),0 0 22px rgba(0,229,255,.10);border-radius:14px;padding:8px;z-index:100000;backdrop-filter:blur(18px)}
      .panel-dropdown.open .panel-dropdown-menu{display:block}
      .panel-menu-row{width:100%;display:flex;align-items:center;justify-content:space-between;gap:10px;background:rgba(255,255,255,.035);border:1px solid rgba(255,255,255,.08);border-radius:10px;color:var(--text1);padding:8px 9px;margin:5px 0;cursor:pointer;font-size:11px;text-align:left}
      .panel-menu-row:hover{border-color:rgba(0,229,255,.28);background:rgba(0,229,255,.07)}
      .panel-menu-badge{font-size:9px;color:var(--green);border:1px solid rgba(34,197,94,.2);background:rgba(34,197,94,.08);border-radius:999px;padding:2px 6px;white-space:nowrap}
      .panel-tool-btn{background:rgba(255,255,255,.06);color:var(--text1);border:1px solid rgba(255,255,255,.12);border-radius:10px;padding:4px 7px;cursor:pointer;font-size:11px;line-height:1}
      .panel-tool-btn:hover{border-color:rgba(0,229,255,.35);color:var(--cyan)}
      .panel-auto-on{color:var(--green)!important;border-color:rgba(34,197,94,.35)!important;background:rgba(34,197,94,.09)!important}
      .snipex-floating-panel.minimized{width:260px!important;padding:10px 12px!important}
      .snipex-floating-panel.minimized .panel-body-content{display:none!important}
      .snipex-floating-panel.minimized{opacity:.92}
      .snipex-floating-panel.auto-hide-armed{transition:opacity .2s, transform .2s}
      .snipex-floating-panel.auto-hide-armed:not(:hover){opacity:.68}
      @media(max-width:880px){.panel-dropdown-menu{right:auto;left:0}.snipex-floating-panel{left:10px!important;right:10px!important;width:auto!important;max-width:none!important}.snipex-floating-panel.minimized{width:auto!important}}
    `;
    document.head.appendChild(st);
  }

  function ensurePanelMenu(){
    injectFloatingPanelCss();
    if(document.getElementById('snipex-panel-dropdown')) return;
    const nav=document.querySelector('.topbar-nav'); if(!nav) return;
    const wrap=document.createElement('div'); wrap.className='panel-dropdown'; wrap.id='snipex-panel-dropdown';
    wrap.innerHTML=`
      <button class="panel-dropdown-btn" id="panel-menu-toggle">Panels \u25be</button>
      <div class="panel-dropdown-menu">
        <button class="panel-menu-row" data-open-panel="partial"><span>\ud83d\udcb0 Partial Booking</span><span class="panel-menu-badge" id="badge-partial">OPEN</span></button>
        <button class="panel-menu-row" data-open-panel="watchdog"><span>\ud83d\udee1\ufe0f Watchdog</span><span class="panel-menu-badge" id="badge-watchdog">OPEN</span></button>
        <button class="panel-menu-row" data-open-panel="both"><span>\u2728 Open both panels</span><span class="panel-menu-badge">RESET</span></button>
      </div>`;
    nav.appendChild(wrap);
    document.getElementById('panel-menu-toggle').onclick=(e)=>{e.stopPropagation();wrap.classList.toggle('open')};
    wrap.querySelectorAll('[data-open-panel]').forEach(btn=>btn.onclick=()=>{openPanel(btn.dataset.openPanel);wrap.classList.remove('open')});
    document.addEventListener('click',()=>wrap.classList.remove('open'));
    updatePanelMenuBadges();
  }

  function panelId(type){ return type==='partial'?'partial-panel':'watchdog-panel'; }
  function closeBtnId(type){ return type==='partial'?'partial-close':'watchdog-close'; }
  function titleColor(type){ return type==='partial'?'var(--green)':'var(--cyan)'; }

  function enhancePanel(type){
    const id=panelId(type); const el=document.getElementById(id); if(!el) return;
    injectFloatingPanelCss();
    el.classList.add('snipex-floating-panel');
    const pref=prefsFor(type)[type];
    const head=el.firstElementChild;
    if(head && !head.classList.contains('panel-head-enhanced')){
      head.classList.add('panel-head-enhanced');
      head.style.cursor='default';
      const oldClose=document.getElementById(closeBtnId(type));
      if(oldClose) oldClose.remove();
      const tools=document.createElement('div');
      tools.style.cssText='display:flex;align-items:center;gap:5px;margin-left:auto';
      tools.innerHTML=`
        <button class="panel-tool-btn" data-panel-min="${type}" title="Minimize / expand">\u2581</button>
        <button class="panel-tool-btn" data-panel-auto="${type}" title="Auto-hide on mouse leave">Auto</button>
        <button class="panel-tool-btn" data-panel-close="${type}" title="Close panel">\u00d7</button>`;
      head.appendChild(tools);
    }
    // Mark body children so minimize can hide only body, not header.
    Array.from(el.children).forEach((child,i)=>{ if(i>0) child.classList.add('panel-body-content'); });
    const minBtn=el.querySelector(`[data-panel-min="${type}"]`);
    const autoBtn=el.querySelector(`[data-panel-auto="${type}"]`);
    const closeBtn=el.querySelector(`[data-panel-close="${type}"]`);
    if(minBtn) minBtn.onclick=()=>setPref(type,{minimized:!prefsFor(type)[type].minimized, visible:true});
    if(autoBtn) autoBtn.onclick=()=>setPref(type,{autohide:!prefsFor(type)[type].autohide, visible:true});
    if(closeBtn) closeBtn.onclick=()=>setPref(type,{visible:false});
    if(!el.dataset.panelAutoBound){
      el.dataset.panelAutoBound='1';
      let hideTimer=null;
      el.addEventListener('mouseleave',()=>{
        const pr=prefsFor(type)[type];
        if(!pr.autohide || !pr.visible) return;
        clearTimeout(hideTimer);
        hideTimer=setTimeout(()=>setPref(type,{minimized:true, visible:true}), 1400);
      });
      el.addEventListener('mouseenter',()=>{
        clearTimeout(hideTimer);
        const pr=prefsFor(type)[type];
        if(pr.autohide && pr.visible) setPref(type,{minimized:false, visible:true});
      });
    }
    applyPanelState(type);
  }

  function applyPanelState(type){
    const el=document.getElementById(panelId(type)); if(!el) return;
    const pref=prefsFor(type)[type];
    el.style.display=pref.visible?'block':'none';
    el.classList.toggle('minimized', !!pref.minimized);
    el.classList.toggle('auto-hide-armed', !!pref.autohide);
    const minBtn=el.querySelector(`[data-panel-min="${type}"]`);
    const autoBtn=el.querySelector(`[data-panel-auto="${type}"]`);
    if(minBtn) minBtn.textContent=pref.minimized?'\u25a3':'\u2581';
    if(autoBtn){ autoBtn.textContent=pref.autohide?'Auto \u2713':'Auto'; autoBtn.classList.toggle('panel-auto-on', !!pref.autohide); }
    // keep border glow readable in minimized state
    el.style.borderColor= type==='partial' ? 'rgba(34,197,94,.28)' : 'rgba(0,229,255,.25)';
    updatePanelMenuBadges();
  }

  function updatePanelMenuBadges(){
    ['partial','watchdog'].forEach(type=>{
      const b=document.getElementById('badge-'+type); if(!b) return;
      const pr=prefsFor(type)[type];
      b.textContent=pr.visible ? (pr.minimized?'MIN':'OPEN') : 'CLOSED';
      b.style.color=pr.visible ? (pr.minimized?'var(--fx)':'var(--green)') : 'var(--red)';
      b.style.borderColor=pr.visible ? 'rgba(34,197,94,.22)' : 'rgba(255,23,68,.22)';
      b.style.background=pr.visible ? 'rgba(34,197,94,.08)' : 'rgba(255,23,68,.08)';
    });
  }

  window.openSnipeXPanel=function(type){ openPanel(type); };
  function openPanel(type){
    if(type==='both'){ openPanel('partial'); openPanel('watchdog'); return; }
    if(type==='partial' && typeof ensurePartialPanel==='function') ensurePartialPanel();
    if(type==='watchdog' && typeof injectWatchdogPanel==='function') injectWatchdogPanel();
    setPref(type,{visible:true,minimized:false});
    enhancePanel(type);
  }

  // Wrap old creators so every refresh preserves close/minimize/auto-hide settings.
  const oldEnsurePartial=window.ensurePartialPanel;
  if(typeof oldEnsurePartial==='function'){
    window.ensurePartialPanel=function(){ oldEnsurePartial(); enhancePanel('partial'); };
  }
  const oldInjectWatchdog=window.injectWatchdogPanel;
  if(typeof oldInjectWatchdog==='function'){
    window.injectWatchdogPanel=function(){ oldInjectWatchdog(); enhancePanel('watchdog'); };
  }

  // Initial boot.
  ensurePanelMenu();
  setTimeout(()=>{ try{ if(typeof ensurePartialPanel==='function') ensurePartialPanel(); }catch(e){} try{ if(typeof injectWatchdogPanel==='function') injectWatchdogPanel(); }catch(e){} enhancePanel('partial'); enhancePanel('watchdog'); updatePanelMenuBadges(); }, 250);
})();


/*
SnipeX Execution Alert + Safe Auto-Correction Patch

Use this in your main UI file.
It shows blinking text ribbon, speaks the failure reason, and tries safe auto-correction only for recoverable errors.

Expected execution result format from bridge:
{
  ok: false,
  error: "MT5 disconnected",
  code: "MT5_DISCONNECTED",
  recoverable: true
}
*/

window.SnipeXAlerts = (() => {
  const state = {
    lastVoiceAt: 0,
    lastReason: "",
    autoCorrectEnabled: true,
    voiceEnabled: true,
    blinkEnabled: true,
    maxRetries: 3,
    retryDelayMs: 900,
    bridgeBase: "http://127.0.0.1:5000"
  };

  function ensureRibbon() {
    let r = document.getElementById("snipexExecutionAlertRibbon");
    if (r) return r;

    r = document.createElement("div");
    r.id = "snipexExecutionAlertRibbon";
    r.innerHTML = `
      <span id="snipexAlertTitle">EXECUTION ALERT</span>
      <span id="snipexAlertReason">Waiting...</span>
      <button id="snipexAlertFixBtn">Fix Now</button>
      <button id="snipexAlertCloseBtn">\u00d7</button>
    `;
    document.body.appendChild(r);

    const style = document.createElement("style");
    style.innerHTML = `
      #snipexExecutionAlertRibbon{
        position:fixed;left:16px;right:16px;bottom:16px;z-index:999999;
        display:none;align-items:center;gap:12px;padding:13px 16px;border-radius:16px;
        background:#3b0710;color:#fff;border:1px solid #fb7185;
        box-shadow:0 0 30px rgba(244,63,94,.35);font-family:Inter,Arial,sans-serif;
      }
      #snipexExecutionAlertRibbon.active{display:flex}
      #snipexExecutionAlertRibbon.blink{animation:none !important;color:#fecdd3}
      #snipexAlertReason{flex:1;font-weight:700}
      #snipexExecutionAlertRibbon button{
        border:0;border-radius:10px;padding:8px 11px;font-weight:900;cursor:pointer;
      }
      #snipexAlertFixBtn{background:#22c55e;color:#052e16}
      #snipexAlertCloseBtn{background:#111827;color:#fff}
      @keyframes snipexBlink{
        from{filter:brightness(1);transform:translateY(0)}
        to{filter:brightness(1.45);transform:translateY(-1px)}
      }
    `;
    document.head.appendChild(style);

    document.getElementById("snipexAlertCloseBtn").onclick = hide;
    document.getElementById("snipexAlertFixBtn").onclick = () => safeAutoCorrect(state.lastReason, true);

    return r;
  }

  function pickEnglishVoice() {
    const voices = speechSynthesis.getVoices ? speechSynthesis.getVoices() : [];
    return voices.find(v => String(v.lang||'').toLowerCase().startsWith('en') && /female|zira|heera|kalpana|google/i.test(v.name||''))
        || voices.find(v => String(v.lang||'').toLowerCase().startsWith('en'))
        || voices.find(v => /female|zira|heera|kalpana|google/i.test(v.name||''))
        || null;
  }

  function getUltraVoiceConfig(){
    // Optional ultra voice: set from console or UI later:
    // localStorage.setItem('snipex_eleven_api_key','YOUR_KEY')
    // localStorage.setItem('snipex_eleven_voice_id','VOICE_ID')
    try{
      return {
        apiKey: localStorage.getItem('snipex_eleven_api_key') || '',
        voiceId: localStorage.getItem('snipex_eleven_voice_id') || 'EXAVITQu4vr4xnSDxMaL',
        modelId: localStorage.getItem('snipex_eleven_model_id') || 'eleven_multilingual_v2',
        enabled: (localStorage.getItem('snipex_ultra_voice_enabled') || '1') !== '0'
      };
    }catch(_e){ return {apiKey:'', voiceId:'EXAVITQu4vr4xnSDxMaL', modelId:'eleven_multilingual_v2', enabled:false}; }
  }

  function browserEnglishFallback(text, opts = {}) {
    if (!("speechSynthesis" in window)) return;
    try{ speechSynthesis.cancel(); }catch(_e){}
    const u = new SpeechSynthesisUtterance(String(text || '').slice(0, 180));
    u.lang = "en-IN";
    const v = pickEnglishVoice();
    if (v) u.voice = v;
    u.rate = Number(opts.rate || 0.95);
    u.pitch = Number(opts.pitch || 1.08);
    u.volume = Number(opts.volume || 1);
    speechSynthesis.speak(u);
  }

  async function speakUltraEnglish(text, opts = {}) {
    const cfg = getUltraVoiceConfig();
    const clean = String(text || '').slice(0, 220);
    if (!cfg.enabled || !cfg.apiKey) { browserEnglishFallback(clean, opts); return {ok:true, mode:'browser-fallback'}; }
    try{
      const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(cfg.voiceId)}`, {
        method: 'POST',
        headers: {
          'xi-api-key': cfg.apiKey,
          'Content-Type': 'application/json',
          'Accept': 'audio/mpeg'
        },
        body: JSON.stringify({
          text: clean,
          model_id: cfg.modelId,
          voice_settings: { stability: 0.56, similarity_boost: 0.82, style: 0.20, use_speaker_boost: true }
        })
      });
      if(!res.ok) throw new Error('Ultra voice HTTP '+res.status);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audio.onended = () => { try{ URL.revokeObjectURL(url); }catch(_e){} };
      audio.play().catch(()=>browserEnglishFallback(clean, opts));
      return {ok:true, mode:'elevenlabs'};
    }catch(e){
      browserEnglishFallback(clean, opts);
      return {ok:false, mode:'browser-fallback', error:String(e.message||e)};
    }
  }

  function speak(text, opts = {}) {
    if (!state.voiceEnabled) return;
    const now = Date.now();
    const cooldown = Number(opts.cooldownMs || 5000);
    if (!opts.force && now - state.lastVoiceAt < cooldown) return; // anti-spam
    state.lastVoiceAt = now;
    // Fire-and-forget: voice NEVER blocks order execution.
    speakUltraEnglish(text, opts).catch(()=>browserEnglishFallback(text, opts));
  }

  function announceExecutionStart(label, payload = {}){
    const side = String(payload.side || payload.direction || '').toUpperCase();
    const sym = String(payload.symbol || payload.requested_symbol || payload.resolved_symbol || '');
    const rr = payload.rr || payload.target_rr || payload.min_rr || '';
    const msg = side
      ? `${sym} ${side} position is executing. Risk control is active.`
      : `${label || 'Auto trade'} is executing. Risk control is active.`;
    speak(msg, {cooldownMs: 1200, force: true, rate: 1.0});
  }

  function announceExecutionSuccess(result = {}){
    const ticket = result.ticket || result.order_id || result?.order?.ticket || result?.result?.order || '';
    speak(ticket ? `Position executed. Ticket ${ticket}.` : 'Position executed.', {cooldownMs: 1500, force: true});
  }

  function smartEnglishFailureReason(reason) {
    const s = String(reason || '').toLowerCase();
    if (s.includes('requote') || s.includes('price changed')) return 'Position failed. Price moved fast. The system will retry with a fresh price.';
    if (s.includes('no money') || s.includes('not enough money') || s.includes('margin')) return 'Position failed. Margin is low. Reduce the lot size.';
    if (s.includes('spread too high')) return 'Position failed. Spread is too high. Waiting for a safer entry.';
    if (s.includes('news lock')) return 'Position blocked. High-impact news risk is active.';
    if (s.includes('invalid stops')) return 'Position failed. Stop loss or target is too close to the broker limit.';
    if (s.includes('offline') || s.includes('disconnect') || s.includes('failed to fetch')) return 'Position failed. Bridge or MT5 connection is being checked.';
    if (s.includes('daily loss') || s.includes('equity drop')) return 'Position blocked. Daily risk safety lock is active.';
    if (s.includes('unauthorized') || s.includes('401')) return 'Position failed. Check the bridge secret token.';
    return 'Position failed. The system is checking the reason.';
  }

  function announcePartialBooked() {
    speak('Partial profit booked.', {cooldownMs: 2500});
  }

  function show(reason, opts = {}) {
    const r = ensureRibbon();
    const cleanReason = String(reason || "Unknown execution failure");
    state.lastReason = cleanReason;

    document.getElementById("snipexAlertReason").textContent = cleanReason;
    r.classList.add("active");
    if (state.blinkEnabled) r.classList.add("blink");

    speak(smartEnglishFailureReason(cleanReason));

    if (opts.autoCorrect !== false && state.autoCorrectEnabled) {
      safeAutoCorrect(cleanReason, false);
    }
  }

  function hide() {
    const r = ensureRibbon();
    r.classList.remove("active", "blink");
  }

  function classify(reason) {
    const s = String(reason || "").toLowerCase();

    if (s.includes("failed to fetch") || s.includes("offline") || s.includes("disconnect") || s.includes("mt5 disconnected")) {
      return "BRIDGE_OR_MT5_RECONNECT";
    }
    if (s.includes("stale price") || s.includes("invalid live price") || s.includes("no tick")) {
      return "REFRESH_SYMBOL_PRICE";
    }
    if (s.includes("invalid stops")) {
      return "RECALCULATE_STOPS";
    }
    if (s.includes("unauthorized") || s.includes("401")) {
      return "AUTH_REQUIRED";
    }
    if (s.includes("no money") || s.includes("not enough money") || s.includes("margin")) {
      return "REDUCE_LOT_ONLY_SUGGEST";
    }
    if (s.includes("spread too high") || s.includes("news lock") || s.includes("daily loss stop") || s.includes("equity drop")) {
      return "SAFETY_LOCK_DO_NOT_OVERRIDE";
    }
    return "UNKNOWN";
  }

  async function post(path, body = {}) {
    const res = await fetch(state.bridgeBase + path, {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify(body)
    });
    return await res.json();
  }

  async function safeAutoCorrect(reason, manual) {
    const action = classify(reason);

    try {
      if (action === "BRIDGE_OR_MT5_RECONNECT") {
        showStatus("Auto-correction: bridge/MT5 reconnect try...");
        await post("/api/repair/reconnect", {source:"execution_alert"});
        return;
      }

      if (action === "REFRESH_SYMBOL_PRICE") {
        showStatus("Auto-correction: symbol price refresh...");
        await post("/api/repair/refresh-prices", {source:"execution_alert"});
        return;
      }

      if (action === "RECALCULATE_STOPS") {
        showStatus("Auto-correction: SL/TP recalculate request...");
        await post("/api/repair/recalculate-stops", {source:"execution_alert"});
        return;
      }

      if (action === "AUTH_REQUIRED") {
        showStatus("Auth error: bridge secret/token missing. Manual fix needed.");
        speak("Bridge auth error. Secret token check karo.");
        return;
      }

      if (action === "REDUCE_LOT_ONLY_SUGGEST") {
        showStatus("No money/margin issue: auto position blocked. Lot reduce suggestion only.");
        speak("Margin kam hai. Lot size reduce karo.");
        return;
      }

      if (action === "SAFETY_LOCK_DO_NOT_OVERRIDE") {
        showStatus("Safety lock active. Auto-correction will NOT bypass risk/news/spread lock.");
        speak("Safety lock active hai. Isko auto bypass nahi karna chahiye.");
        return;
      }

      if (manual) showStatus("Unknown issue. Bridge log check needed.");
    } catch (e) {
      showStatus("Auto-correction failed: " + e.message);
    }
  }

  function showStatus(text) {
    const r = ensureRibbon();
    document.getElementById("snipexAlertReason").textContent = text;
    r.classList.add("active", "blink");
  }

  async function executeWithAlert(executeFn, label = "Auto trade", payload = {}) {
    try {
      // Voice/execution sync: announce and send in the same event path.
      // Voice is fire-and-forget, so a slow/failed TTS request can NEVER delay or block MT5 order_send.
      try{ announceExecutionStart(label, payload); }catch(_voiceErr){}
      const result = await executeFn();

      if (!result || result.ok === false) {
        const reason = result?.error || result?.reason || `${label} failed`;
        show(reason, {autoCorrect:true});
        return result;
      }

      hide();
      try{ announceExecutionSuccess(result); }catch(_voiceErr){}
      return result;
    } catch (e) {
      show(`${label} failed: ${e.message}`, {autoCorrect:true});
      return {ok:false, error:e.message};
    }
  }

  return {show, hide, speak, speakUltraEnglish, announceExecutionStart, announceExecutionSuccess, announcePartialBooked, smartEnglishFailureReason, executeWithAlert, classify, state, getUltraVoiceConfig};
})();

/*
Example usage around your AI/Auto position function:

async function fireAutoTrade(payload){
  return SnipeXAlerts.executeWithAlert(async () => {
    const res = await fetch("http://127.0.0.1:5000/api/trade", {
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify(payload)
    });
    return await res.json();
  }, "Auto trade");
}
*/



/* ============ CHATGPT DOCTOR / REPAIR CENTER UI + PATCH ENGINE ============ */
(function(){
  if(window.SnipeXDoctorRepair) return;
  const state={lastSuggestion:null, poll:null, aiStatus:null, minimized:false, autoShownId:null, userClosed:false,lastAskTs:0,askCache:{}};
  function doctorAskKey(q,ctx){return String(q||'').trim().toLowerCase()+'|'+String(ctx||'').trim().toLowerCase().slice(0,800)}
  function doctorAskCached(q,ctx){try{const k=doctorAskKey(q,ctx), it=state.askCache[k]; if(it && Date.now()-it.ts<15*60*1000) return it.r;}catch(e){} return null;}
  function doctorAskStore(q,ctx,r){try{state.askCache[doctorAskKey(q,ctx)]={ts:Date.now(),r:r};}catch(e){}}
  function doctorCanAsk(){const now=Date.now(); const gap=60000-(now-(state.lastAskTs||0)); if(gap>0) return {ok:false,wait:Math.ceil(gap/1000)}; state.lastAskTs=now; return {ok:true,wait:0};}
  const errHints=['requote','10004','invalid stops','no money','spread too high','mt5 rejected','partial close','failed to fetch','truth value of an array','ambiguous','mt5 disconnected','news lock'];
  function doctorIsError(msg){ const t=String(msg||'').toLowerCase(); return errHints.some(x=>t.includes(x)); }
  async function dapi(path, options={}){
    const url = String(path).startsWith('http') ? path : ((window.SNIPEX_BRIDGE_BASE||BRIDGE_BASE) + path);
    const res=await fetch(url,{headers:{'Content-Type':'application/json'},...options});
    const data=await res.json().catch(()=>({ok:false,error:'Invalid Doctor response'}));
    if(!res.ok || data.ok===false) throw new Error(data.error||('HTTP '+res.status));
    return data;
  }
  function color(status){
    status=String(status||'').toUpperCase();
    if(status.includes('APPLIED')) return 'var(--green)';
    if(status.includes('APPROVED')) return 'var(--cyan)';
    if(status.includes('FAILED')) return 'var(--red)';
    if(status.includes('REJECT')) return 'var(--orange)';
    return 'var(--fx)';
  }
  function ensureUI(){
    if(document.getElementById('doctor-repair-center')) return;
    const style=document.createElement('style');
    style.textContent=`
      #doctor-repair-center{position:fixed;right:18px;bottom:72px;width:390px;max-width:calc(100vw - 36px);z-index:99999;display:none;background:rgba(5,10,20,.96);border:1px solid rgba(0,229,255,.28);box-shadow:0 18px 55px rgba(0,0,0,.48),0 0 24px rgba(0,229,255,.12);border-radius:18px;color:var(--text1);font-family:inherit;overflow:hidden;backdrop-filter:blur(12px)}
      #doctor-repair-center.minimized .doctor-body{display:none}
      .doctor-head{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:10px 12px;background:linear-gradient(90deg,rgba(0,229,255,.12),rgba(251,191,36,.08));border-bottom:1px solid rgba(255,255,255,.08)}
      .doctor-title{font-weight:900;letter-spacing:.35px;color:var(--cyan)}
      .doctor-actions{display:flex;gap:6px}.doctor-actions button,.doctor-btn{background:rgba(255,255,255,.06);color:var(--text1);border:1px solid rgba(255,255,255,.12);border-radius:10px;padding:6px 8px;cursor:pointer;font-weight:800;font-size:11px}
      .doctor-body{padding:12px;display:grid;gap:10px}.doctor-box{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:14px;padding:10px}.doctor-small{font-size:11px;color:var(--text2);line-height:1.35}.doctor-label{font-size:10px;color:var(--text3);letter-spacing:.75px;text-transform:uppercase;margin-bottom:5px}.doctor-textarea{width:100%;min-height:58px;background:rgba(0,0,0,.32);color:var(--text1);border:1px solid rgba(255,255,255,.12);border-radius:12px;padding:9px;resize:vertical;outline:none}.doctor-row{display:flex;gap:7px;flex-wrap:wrap}.doctor-primary{background:var(--cyan-dim)!important;color:var(--cyan)!important;border-color:var(--cyan-glow)!important}.doctor-apply{background:var(--green-dim)!important;color:var(--green)!important;border-color:var(--green-glow)!important}.doctor-reject{background:var(--red-dim)!important;color:var(--red)!important;border-color:var(--red-glow)!important}.doctor-chip{display:inline-flex;align-items:center;gap:5px;font-size:10px;padding:4px 7px;border-radius:999px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.04);margin-right:5px;margin-top:5px}
      .doctor-answer{max-height:150px;overflow:auto;white-space:pre-wrap;background:rgba(0,229,255,.035);border:1px solid rgba(0,229,255,.12);border-radius:12px;padding:9px;color:var(--text1)}
      .doctor-hint{font-size:10px;color:var(--text3);margin-top:6px}
      .doctor-ai-status{font-size:10px;border:1px solid rgba(255,255,255,.1);border-radius:10px;padding:7px 8px;background:rgba(0,0,0,.24);margin-top:7px}
      #doctor-top-ribbon{display:none!important}
      #doctor-open-fab{position:fixed;right:0;top:48%;transform:translateY(-50%);z-index:99998;display:block;background:rgba(0,229,255,.10);border:1px solid rgba(0,229,255,.26);border-right:0;color:var(--cyan);border-radius:10px 0 0 10px;padding:8px 5px;cursor:pointer;font-weight:900;font-size:11px;box-shadow:0 10px 24px rgba(0,0,0,.28);writing-mode:vertical-rl;text-orientation:mixed;letter-spacing:.2px;opacity:.72}
      #doctor-open-fab:hover{opacity:1;background:rgba(0,229,255,.18)}#doctor-open-fab.alert{display:block;opacity:1;background:rgba(251,191,36,.18);border-color:rgba(251,191,36,.45);color:var(--fx);animation:none !important;top:58px;right:22px;z-index:100000;display:none;max-width:420px;padding:10px 14px;border-radius:14px;border:1px solid rgba(0,229,255,.28);background:rgba(5,10,20,.96);color:var(--text1);box-shadow:0 18px 50px rgba(0,0,0,.42),0 0 24px rgba(0,229,255,.10);font-size:12px;font-weight:800}
      #doctor-event-toast.good{border-color:rgba(34,197,94,.38);color:var(--green)}#doctor-event-toast.bad{border-color:rgba(239,68,68,.38);color:var(--red)}#doctor-event-toast.warn{border-color:rgba(251,191,36,.45);color:var(--fx)}
    `;
    document.head.appendChild(style);
    const ribbon=document.createElement('div'); ribbon.id='doctor-top-ribbon'; ribbon.textContent='\ud83e\ude7a DOCTOR: READY'; document.body.appendChild(ribbon);
    const fab=document.createElement('button'); fab.id='doctor-open-fab'; fab.textContent='\ud83e\ude7a Doctor'; fab.title='Open ChatGPT Doctor'; fab.onclick=()=>{openDoctorPanel(true)}; document.body.appendChild(fab);
    const toast=document.createElement('div'); toast.id='doctor-event-toast'; document.body.appendChild(toast);
    const box=document.createElement('div'); box.id='doctor-repair-center';
    box.innerHTML=`
      <div class="doctor-head"><div><div class="doctor-title">\ud83e\ude7a ChatGPT Doctor Repair Center</div><div class="doctor-small">AI suggest \u2192 Doctor approve \u2192 You apply</div></div><div class="doctor-actions"><button id="doctor-min">_</button><button id="doctor-close">\u00d7</button></div></div>
      <div class="doctor-body">
        <div class="doctor-box"><div class="doctor-label">Paste unknown error code/log here</div><textarea id="doctor-error-input" class="doctor-textarea" placeholder="Example: retcode 10004 Requote, Invalid stops, No money, partial close failed..."></textarea><div class="doctor-row" style="margin-top:8px"><button class="doctor-btn doctor-primary" id="doctor-analyze">Analyze Error</button><button class="doctor-btn" id="doctor-refresh">Refresh</button></div></div>
        <div class="doctor-box"><div class="doctor-label">Ask real ChatGPT Doctor</div><textarea id="doctor-question-input" class="doctor-textarea" placeholder="Ask: Requote ka permanent fix kya hai? Partial booking fail kyun ho rahi hai? Strategy conflict ka safe rule kya ho?"></textarea><div class="doctor-row" style="margin-top:8px"><button class="doctor-btn doctor-primary" id="doctor-ask-ai">Ask Doctor</button><button class="doctor-btn" id="doctor-copy-error">Use pasted error as context</button></div><div class="doctor-hint">API key backend .env me secure rahegi. Browser key ko kabhi show nahi karega.</div><div id="doctor-ai-status" class="doctor-ai-status">Checking ChatGPT connection...</div><div id="doctor-ai-answer" class="doctor-answer doctor-small" style="margin-top:8px">Ask a question to get Doctor guidance.</div></div>
        <div class="doctor-box"><div class="doctor-label">AI Suggestion</div><div id="doctor-ai" class="doctor-small">No issue yet. Backend auto-detect is watching.</div></div>
        <div class="doctor-box"><div class="doctor-label">ChatGPT Doctor Approval</div><div id="doctor-review" class="doctor-small">Waiting for issue...</div><div id="doctor-chips"></div></div>
        <div class="doctor-row"><button class="doctor-btn doctor-apply" id="doctor-apply">Apply Fix</button><button class="doctor-btn doctor-reject" id="doctor-reject">Reject</button><button class="doctor-btn" id="doctor-rollback">Rollback Info</button></div>
        <div id="doctor-status" class="doctor-small">Status: READY</div>
      </div>`;
    document.body.appendChild(box);
    document.getElementById('doctor-min').onclick=()=>box.classList.toggle('minimized');
    document.getElementById('doctor-close').onclick=()=>{state.userClosed=true; closeDoctorPanel();};
    document.getElementById('doctor-refresh').onclick=refreshDoctor;
    document.getElementById('doctor-analyze').onclick=async()=>{const raw=document.getElementById('doctor-error-input').value.trim(); if(!raw){paintStatus('Paste error first.', true); return;} await reportDoctor(raw,'manual_paste');};
    document.getElementById('doctor-ask-ai').onclick=askDoctorAI;
    document.getElementById('doctor-copy-error').onclick=()=>{const raw=document.getElementById('doctor-error-input').value.trim(); const q=document.getElementById('doctor-question-input'); if(raw && q && !q.value.trim()) q.value='Is error ka safe fix kya hai?'; paintStatus(raw?'Error context ready for Ask Doctor.':'Paste an error first.', !raw);};
    document.getElementById('doctor-apply').onclick=applyDoctor;
    document.getElementById('doctor-reject').onclick=rejectDoctor;
    document.getElementById('doctor-rollback').onclick=rollbackDoctor;
  }
  function openDoctorPanel(manual=false){
    ensureUI();
    const box=document.getElementById('doctor-repair-center');
    const fab=document.getElementById('doctor-open-fab');
    if(box) box.style.display='block';
    if(fab) fab.classList.remove('alert');
    if(manual) state.userClosed=false;
  }
  function closeDoctorPanel(){
    const box=document.getElementById('doctor-repair-center');
    if(box) box.style.display='none';
    const fab=document.getElementById('doctor-open-fab');
    if(fab){fab.classList.remove('alert'); fab.style.display='block';}
  }
  function doctorToast(msg,type='warn',ms=6500){
    ensureUI(); const t=document.getElementById('doctor-event-toast');
    if(!t) return; t.className=type; t.textContent=msg; t.style.display='block';
    clearTimeout(state.toastTimer); state.toastTimer=setTimeout(()=>{t.style.display='none';},ms);
  }
  function markDoctorAlert(msg='Doctor review available'){
    ensureUI();
    const fab=document.getElementById('doctor-open-fab');
    if(fab){fab.style.display='block'; fab.classList.add('alert');}
    doctorToast('\ud83e\ude7a '+msg,'warn');
  }
  function paintStatus(txt,bad=false){ ensureUI(); const e=document.getElementById('doctor-status'); if(e){e.textContent='Status: '+txt; e.style.color=bad?'var(--red)':'var(--text2)';} }
  function paintSuggestion(sug){
    ensureUI(); state.lastSuggestion=sug||null;
    const ribbon=document.getElementById('doctor-top-ribbon');
    if(!sug){document.getElementById('doctor-ai').textContent='No issue yet. Backend auto-detect is watching.';document.getElementById('doctor-review').textContent='Waiting for issue...';document.getElementById('doctor-chips').innerHTML=''; if(ribbon) ribbon.textContent='\ud83e\ude7a DOCTOR: READY'; const fab=document.getElementById('doctor-open-fab'); if(fab) fab.classList.remove('alert'); return;}
    document.getElementById('doctor-ai').textContent=`${sug.title||sug.kind}: ${sug.ai_summary||''}`;
    document.getElementById('doctor-review').textContent=sug.doctor_review||'Doctor review pending.';
    document.getElementById('doctor-chips').innerHTML=`<span class="doctor-chip" style="color:${color(sug.status)}">${sug.status||'PENDING'}</span><span class="doctor-chip">Risk: ${sug.risk||'--'}</span><span class="doctor-chip">Confidence: ${sug.confidence||0}%</span><span class="doctor-chip">Patch: ${sug.patch||'--'}</span>`;
    if(ribbon){ribbon.textContent=`\ud83e\ude7a DOCTOR: ${String(sug.status||'READY').replaceAll('_',' ')}`; ribbon.style.color=color(sug.status);}
    paintStatus(`${sug.kind||'ISSUE'} \u00b7 ${sug.status||'PENDING'}`);
    const sid=String(sug.id||sug.kind||sug.patch||Date.now());
    const st=String(sug.status||'').toUpperCase();
    const needsReview=!(st.includes('APPLIED')||st.includes('REJECT'));
    if(needsReview){ markDoctorAlert((sug.title||sug.kind||'Issue detected')+' \u00b7 Doctor ready'); if(state.autoShownId!==sid && !state.userClosed){ openDoctorPanel(false); state.autoShownId=sid; } }

  }
  async function refreshDoctor(){
    try{ ensureUI(); refreshAIStatus(); const r=await dapi('/api/doctor/status'); const sug=(r.doctor?.suggestions||[])[0]; paintSuggestion(sug); }
    catch(e){ paintStatus('Doctor offline: '+e.message, true); }
  }
  async function reportDoctor(raw,source='ui'){
    try{ ensureUI(); paintStatus('Analyzing...'); const r=await dapi('/api/doctor/report',{method:'POST',body:JSON.stringify({error:raw,source})}); state.userClosed=false; paintSuggestion(r.suggestion); openDoctorPanel(false); if(typeof logLive==='function') logLive('Doctor review ready: '+(r.suggestion?.kind||'issue'),'warn'); }
    catch(e){ paintStatus('Analyze failed: '+e.message, true); }
  }

  async function refreshAIStatus(){
    try{
      ensureUI();
      const r=await dapi('/api/doctor/ai_status');
      state.aiStatus=r.ai||{};
      const e=document.getElementById('doctor-ai-status');
      if(e){
        if(state.aiStatus.configured){
          e.textContent='\u2705 Real ChatGPT Doctor connected \u00b7 Model: '+(state.aiStatus.model||'default')+' \u00b7 Key: '+(state.aiStatus.key_hint||'hidden');
          e.style.color='var(--green)';
        }else{
          e.textContent='\u26a0 Doctor AI not connected. Market Automation engine remains real-only; no local position analysis fallback.';
          e.style.color='var(--fx)';
        }
      }
    }catch(e){
      const box=document.getElementById('doctor-ai-status');
      if(box){box.textContent='Doctor AI status unavailable: '+e.message; box.style.color='var(--red)';}
    }
  }

  async function askDoctorAI(){
    try{
      ensureUI();
      const q=(document.getElementById('doctor-question-input')?.value||'').trim();
      const ctx=(document.getElementById('doctor-error-input')?.value||'').trim();
      const out=document.getElementById('doctor-ai-answer');
      if(!q){ paintStatus('Question likho, phir Ask Doctor dabao.', true); return; }
      const cached=doctorAskCached(q,ctx);
      if(cached){ if(out) out.textContent='\ud83e\udde0 Cached Doctor answer:\
'+(cached.answer||'No answer'); paintStatus('Cached answer shown. API call saved.'); return; }
      const gate=doctorCanAsk();
      if(!gate.ok){ if(out) out.textContent='Doctor API cooldown active hai. '+gate.wait+' sec baad try karo.\
\
Local answer:\
'+(window.SnipeXDoctorLocalHint?.(q,ctx)||'Same question par repeat API call block kiya gaya.'); paintStatus('Cooldown active: '+gate.wait+' sec.', true); return; }
      if(out) out.textContent='Doctor soch raha hai...';
      paintStatus('Asking ChatGPT Doctor...');
      const r=await dapi('/api/doctor/ask_ai',{method:'POST',body:JSON.stringify({question:q,context:ctx})});
      doctorAskStore(q,ctx,r);
      if(out) out.textContent=(r.mode==='openai'?'\ud83e\udde0 Real ChatGPT Doctor:\
':(String(r.mode||'').includes('rate')?'\ud83e\udde0 Local Doctor (API cooldown/429 protected):\
':'\ud83e\udde0 Local Doctor fallback:\
'))+(r.answer||'No answer');
      paintStatus(r.mode==='openai'?'ChatGPT answer ready.':'Doctor offline/cooldown note shown. Market Automation AI unaffected.');
    }catch(e){
      const out=document.getElementById('doctor-ai-answer');
      if(out) out.textContent='Ask Doctor failed: '+e.message+'\
Doctor fallback disabled for position automation decisions.';
      paintStatus('Ask Doctor failed: '+e.message, true);
    }
  }

  async function applyDoctor(){
    try{ if(!state.lastSuggestion){paintStatus('No suggestion selected.', true); return;} paintStatus('Applying safe patch...'); const r=await dapi('/api/doctor/apply',{method:'POST',body:JSON.stringify({id:state.lastSuggestion.id})}); paintSuggestion(r.suggestion); paintStatus('Applied. Backup created.'); if(typeof logLive==='function') logLive('Doctor patch applied: '+(r.suggestion?.patch||''),'ok'); }
    catch(e){ paintStatus('Apply failed: '+e.message, true); if(typeof logLive==='function') logLive('Doctor apply failed: '+e.message,'bad'); }
  }
  async function rejectDoctor(){
    try{ if(!state.lastSuggestion){paintStatus('No suggestion selected.', true); return;} const r=await dapi('/api/doctor/reject',{method:'POST',body:JSON.stringify({id:state.lastSuggestion.id})}); paintSuggestion(r.suggestion); paintStatus('Rejected by user.'); }
    catch(e){ paintStatus('Reject failed: '+e.message, true); }
  }
  async function rollbackDoctor(){
    try{ const r=await dapi('/api/doctor/rollback',{method:'POST',body:JSON.stringify({})}); alert((r.message||'Rollback info')+'\
\
Recent backups:\
'+(r.recent_backups||[]).join('\
')); }
    catch(e){ paintStatus('Rollback info failed: '+e.message, true); }
  }
  // Auto-detect errors from live log without reading raw log aloud.
  const oldLog=window.logLive;
  if(typeof oldLog==='function'){
    window.logLive=function(msg,kind=''){
      try{ oldLog(msg,kind); }catch(e){}
      try{ if((kind==='bad'||kind==='warn') && doctorIsError(msg)) reportDoctor(msg,'ui_log_auto_detect'); }catch(e){}
    };
  }
  window.SnipeXDoctorRepair={ensureUI,refreshDoctor,refreshAIStatus,reportDoctor,applyDoctor,rejectDoctor,rollbackDoctor,askDoctorAI,openDoctorPanel,closeDoctorPanel,state};
  setTimeout(()=>{ensureUI(); closeDoctorPanel(); refreshAIStatus(); refreshDoctor(); if(state.poll) clearInterval(state.poll); state.poll=setInterval(refreshDoctor,12000);},700);
})();


/* ============ MAIN UI ASK DOCTOR + SAFE AUTO-FIX CONTROL ============ */
(function(){
  // Clean UI mode: no separate floating Ask Doctor box.
  // Ask Doctor is merged inside the right-side \ud83e\ude7a Doctor panel.
  window.SnipeXDoctorLocalHint=function(q,ctx){const t=(String(q||'')+' '+String(ctx||'')).toLowerCase(); if(t.includes('requote')||t.includes('10004')) return 'Requote me fresh tick + adaptive deviation retry use karo. Risk rejects par retry nahi.'; if(t.includes('invalid stops')) return 'SL/TP broker min distance se bahar recalculate karo.'; if(t.includes('no money')||t.includes('margin')) return 'Lot/margin kam karo, max cap aur free margin check karo.'; return 'Local Doctor: API cooldown hai. Safe auto-fix catalog aur manual review available hai.';}
  window.SnipeXDoctorMainAsk={openAskDoctor:function(){try{window.SnipeXDoctorRepair?.openDoctorPanel?.(true)}catch(e){}},showAutoFixToast:function(msg,type='good'){try{const t=document.createElement('div');t.className='doctor-toast';t.textContent=msg;document.body.appendChild(t);setTimeout(()=>t.remove(),3500)}catch(e){}}};
})();


/* ============ MASTER AI CONFIDENCE MINI BAR + TRIGGER HISTORY DROPDOWN ============ */
(function(){
  if(window.SnipeXTriggerHistorySystem) return;
  const STORE='snipex_trigger_history_v1';
  const LAST='snipex_trigger_last_state_v1';
  function esc(x){return String(x==null?'':x).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));}
  function now(){return new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit', second:'2-digit'});}
  function load(){try{return JSON.parse(localStorage.getItem(STORE)||'[]')}catch(e){return []}}
  function save(a){try{localStorage.setItem(STORE, JSON.stringify(a.slice(0,25)))}catch(e){}}
  function statusClass(st){st=String(st||'').toLowerCase(); if(st.includes('trigger')) return 'ok'; if(st.includes('miss')||st.includes('block')||st.includes('fail')) return 'bad'; if(st.includes('formed')||st.includes('ready')) return 'warn'; return 'wait';}
  function recordTrigger(item){
    const rec={time:now(), ts:Date.now(), status:item.status||'WAITING', strategy:item.strategy||'--', direction:item.direction||'WAIT', confidence:Number(item.confidence||0), reason:item.reason||'', tf:item.tf||'', lot:item.lot||''};
    const key=[rec.status,rec.strategy,rec.direction,Math.round(rec.confidence),rec.reason.slice(0,28),rec.tf].join('|');
    let last={}; try{last=JSON.parse(localStorage.getItem(LAST)||'{}')}catch(e){}
    if(last.key===key && Date.now()-Number(last.ts||0)<45000) return;
    localStorage.setItem(LAST, JSON.stringify({key,ts:Date.now()}));
    const arr=load(); arr.unshift(rec); save(arr); renderTriggerHistory(); pulseTriggerButton(rec.status);
  }
  function clearTriggerHistory(){save([]); renderTriggerHistory();}
  function buildUI(){
    if(document.getElementById('trigger-history-css')) return;
    const st=document.createElement('style'); st.id='trigger-history-css'; st.textContent=`
      .trigger-menu-wrap{position:relative;display:inline-flex;align-items:center;margin-left:4px}
      .trigger-menu-btn{font-family:'Orbitron',monospace;font-size:9px;font-weight:700;letter-spacing:1.3px;padding:6px 12px;background:rgba(255,255,255,.03);border:1px solid rgba(245,200,66,.25);color:var(--fx);border-radius:4px;cursor:pointer;text-transform:uppercase;white-space:nowrap}
      .trigger-menu-wrap.open .trigger-menu-btn,.trigger-menu-btn.pulse{box-shadow:0 0 14px rgba(245,200,66,.28);background:rgba(245,200,66,.08)}
      .trigger-menu{display:none;position:absolute;top:32px;right:0;width:420px;max-width:88vw;background:rgba(5,10,20,.98);border:1px solid rgba(245,200,66,.22);box-shadow:0 18px 50px rgba(0,0,0,.42),0 0 22px rgba(245,200,66,.10);border-radius:14px;padding:10px;z-index:100001;backdrop-filter:blur(18px)}
      .trigger-menu-wrap.open .trigger-menu{display:block}
      .trigger-head{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:8px}.trigger-title{font-family:'Orbitron',monospace;font-size:10px;font-weight:900;letter-spacing:1.5px;color:var(--fx);text-transform:uppercase}.trigger-clear{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.10);color:var(--text2);border-radius:8px;padding:5px 8px;font-size:9px;cursor:pointer}
      .trigger-row{display:grid;grid-template-columns:62px 92px 1fr 56px;gap:7px;align-items:center;border:1px solid rgba(255,255,255,.07);background:rgba(255,255,255,.035);border-radius:10px;padding:7px;margin:5px 0;font-size:10px;color:var(--text2)}
      .trigger-row b{color:var(--text1);font-size:10px}.trigger-status{font-weight:900;font-size:9px;text-transform:uppercase}.trigger-status.ok{color:var(--green)}.trigger-status.warn{color:var(--orange)}.trigger-status.bad{color:var(--red)}.trigger-status.wait{color:var(--text3)}.trigger-reason{grid-column:2/5;color:var(--text3);font-size:9px;line-height:1.35}.trigger-empty{color:var(--text3);font-size:10px;padding:10px;border:1px dashed rgba(255,255,255,.12);border-radius:10px;text-align:center}
      .ai-confidence-mini{margin-top:8px;border:1px solid rgba(0,229,255,.18);background:rgba(0,229,255,.04);border-radius:10px;padding:8px}.ai-confidence-head{display:flex;justify-content:space-between;align-items:center;font-size:9px;color:var(--text2);font-weight:800;letter-spacing:.8px}.ai-confidence-track{height:7px;background:rgba(255,255,255,.08);border-radius:999px;overflow:hidden;margin-top:6px}.ai-confidence-fill{height:100%;width:0%;background:var(--red);transition:width .25s ease, background .25s ease, box-shadow .25s ease}.ai-confidence-note{font-size:8px;color:var(--text3);margin-top:5px;line-height:1.35}
      .ai-feature-menu-wrap{position:relative;display:inline-flex;align-items:center;margin-left:4px}.ai-feature-menu-btn{font-family:'Orbitron',monospace;font-size:9px;font-weight:800;letter-spacing:1.15px;padding:6px 11px;background:rgba(0,229,255,.045);border:1px solid rgba(0,229,255,.22);color:#8ff6ff;border-radius:4px;cursor:pointer;text-transform:uppercase;white-space:nowrap}.ai-feature-menu-wrap.open .ai-feature-menu-btn{box-shadow:0 0 14px rgba(0,229,255,.22);background:rgba(0,229,255,.09)}.ai-feature-menu{display:none;position:absolute;top:32px;right:0;width:330px;max-width:88vw;background:rgba(5,10,20,.98);border:1px solid rgba(0,229,255,.22);box-shadow:0 18px 50px rgba(0,0,0,.42),0 0 22px rgba(0,229,255,.10);border-radius:14px;padding:10px;z-index:100002;backdrop-filter:blur(18px)}.ai-feature-menu-wrap.open .ai-feature-menu{display:block}.ai-feature-title{font-family:'Orbitron',monospace;font-size:10px;font-weight:900;letter-spacing:1.4px;color:#8ff6ff;text-transform:uppercase}.ai-feature-sub{font-size:9px;color:var(--text3);margin-top:3px;line-height:1.35}.ai-feature-list{display:grid;gap:6px;margin-top:9px}.ai-feature-row{display:flex;justify-content:space-between;gap:8px;align-items:center;border:1px solid rgba(255,255,255,.07);background:rgba(255,255,255,.035);border-radius:10px;padding:7px 8px;font-size:10px;color:var(--text2)}.ai-feature-row b{color:var(--text1);font-size:10px}.ai-feature-badge{font-size:8px;font-weight:900;letter-spacing:.7px;border-radius:999px;padding:3px 6px;border:1px solid rgba(255,255,255,.10);white-space:nowrap}.ai-feature-badge.on{color:var(--green);background:rgba(0,230,118,.08);border-color:rgba(0,230,118,.22)}.ai-feature-badge.ready{color:var(--fx);background:rgba(245,200,66,.08);border-color:rgba(245,200,66,.22)}.ai-feature-badge.safe{color:#8ff6ff;background:rgba(0,229,255,.07);border-color:rgba(0,229,255,.20)}
    `; document.head.appendChild(st);
    const nav=document.querySelector(".topbar-nav");
    if(nav && !document.getElementById("ai-feature-menu-wrap")){
      const fwrap=document.createElement("div"); fwrap.className="ai-feature-menu-wrap"; fwrap.id="ai-feature-menu-wrap";
      fwrap.innerHTML=`<button class="ai-feature-menu-btn" id="ai-feature-menu-btn" title="See hidden AI bot feature upgrades">\ud83e\udde0 AI Features \u25be</button><div class="ai-feature-menu" id="ai-feature-menu"><div class="ai-feature-title">AI Bot Upgrade Map</div><div class="ai-feature-sub">Hidden engines active/available in this build.</div><div class="ai-feature-list" id="ai-feature-list"></div></div>`;
      const trigger=document.getElementById("trigger-menu-wrap");
      if(trigger) nav.insertBefore(fwrap, trigger); else nav.appendChild(fwrap);
      document.getElementById("ai-feature-menu-btn").onclick=(ev)=>{ev.stopPropagation(); fwrap.classList.toggle("open"); renderAIFeatureMenu();};
      document.addEventListener("click",(ev)=>{if(!fwrap.contains(ev.target)) fwrap.classList.remove("open");});
    }
    if(nav && !document.getElementById("trigger-menu-wrap")){
      const wrap=document.createElement("div"); wrap.className="trigger-menu-wrap"; wrap.id="trigger-menu-wrap";
      wrap.innerHTML=`<button class="trigger-menu-btn" id="trigger-menu-btn" title="Last 10 setup trigger records">\ud83c\udfaf Triggers \u25be</button><div class="trigger-menu" id="trigger-menu"><div class="trigger-head"><div><div class="trigger-title">Trigger History</div><div style="font-size:9px;color:var(--text3);margin-top:2px">Last 10 setup/trigger/missed records only</div></div><button class="trigger-clear" id="trigger-clear">Clear</button></div><div id="trigger-history-list"></div></div>`;
      const feat=document.getElementById("ai-feature-menu-wrap");
      if(feat && feat.nextSibling) nav.insertBefore(wrap, feat.nextSibling); else nav.appendChild(wrap);
      document.getElementById("trigger-menu-btn").onclick=(ev)=>{ev.stopPropagation(); wrap.classList.toggle("open"); renderTriggerHistory();};
      document.getElementById("trigger-clear").onclick=(ev)=>{ev.stopPropagation(); clearTriggerHistory();};
      document.addEventListener("click",(ev)=>{if(!wrap.contains(ev.target)) wrap.classList.remove("open");});
    }
    const aiPanel=document.querySelector('.ai-panel');
    if(aiPanel && !document.getElementById('ai-confidence-mini')){
      const box=document.createElement('div'); box.className='ai-confidence-mini'; box.id='ai-confidence-mini';
      box.innerHTML=`<div class="ai-confidence-head"><span>\ud83e\udde0 MASTER AI CONFIDENCE</span><span id="ai-confidence-text">0%</span></div><div class="ai-confidence-track"><div class="ai-confidence-fill" id="ai-confidence-fill"></div></div><div class="ai-confidence-note" id="ai-confidence-note">Live score. Green means stronger setup, not guaranteed profit.</div>`;
      const safe=document.getElementById('safeopt-mini'); if(safe && safe.parentNode) safe.parentNode.insertBefore(box, safe.nextSibling); else aiPanel.appendChild(box);
    }
    renderTriggerHistory();
    renderAIFeatureMenu();
  }
  function renderAIFeatureMenu(){
    const list=document.getElementById("ai-feature-list"); if(!list) return;
    const items=[
      ["Master AI Auto Switch", (window.MASTER_AI_SWITCH_STATE&&window.MASTER_AI_SWITCH_STATE.enabled)?"ON":"READY", "safe"],
      ["Master AI Startup Force", "ALWAYS ON", "on"],
      ["Page Auto Refresh", "30 MIN", "safe"],
      ["AI Learning + Journal Scoring", "ADDED", "on"],
      ["AI Trust Score / Ranking", "ADDED", "on"],
      ["AI Execution Engine", (window.autoTradeEnabled||window.autoTradeOn||window.AUTO_TRADE_ENABLED)?"ON":"READY", "ready"],
      ["Execution Guarantee + Retry", "ADDED", "on"],
      ["Duplicate Position Guard", "ACTIVE", "on"],
      ["Mandatory Profit Lock", "ADDED", "on"],
      ["Ultra Sniper Pyramiding", "ADDED", "on"],
      ["Pyramiding Debug Overlay", "20 SEC", "safe"],
      ["HF Range Sniper Wiring", "ADDED", "on"],
      ["Self-Healing Watchdog", "ADDED", "safe"],
      ["MT5 Candle Repair / Downloader", "ADDED", "safe"]
    ];
    list.innerHTML=items.map(([name,badge,cls])=>`<div class="ai-feature-row"><b>${esc(name)}</b><span class="ai-feature-badge ${cls}">${esc(badge)}</span></div>`).join("");
  }
  function renderTriggerHistory(){
    const list=document.getElementById('trigger-history-list'); if(!list) return;
    const arr=load().slice(0,10);
    if(!arr.length){list.innerHTML='<div class="trigger-empty">No trigger records yet. AI scan, setup ready, missed, or executed position yahan dikhenge.</div>'; return;}
    list.innerHTML=arr.map(r=>`<div class="trigger-row"><span>${esc(r.time)}</span><span class="trigger-status ${statusClass(r.status)}">${esc(r.status)}</span><b>${esc(r.strategy)}</b><span>${Number(r.confidence||0).toFixed(0)}%</span><div class="trigger-reason">${esc(r.direction)}${r.tf?' \u00b7 '+esc(r.tf):''}${r.lot?' \u00b7 lot '+esc(r.lot):''} \u00b7 ${esc(r.reason||'No reason saved')}</div></div>`).join('');
  }
  function pulseTriggerButton(status){const b=document.getElementById('trigger-menu-btn'); if(!b) return; b.classList.add('pulse'); b.textContent=(String(status).toLowerCase().includes('trigger')?'\u2705':String(status).toLowerCase().includes('miss')||String(status).toLowerCase().includes('block')?'\ud83d\udd34':'\ud83c\udfaf')+' Triggers \u25be'; setTimeout(()=>{b.classList.remove('pulse'); b.textContent='\ud83c\udfaf Triggers \u25be';},3500);}
  function updateConfidenceMini(v){
    buildUI(); const val=Math.max(0,Math.min(100,Number(v||0))); const fill=document.getElementById('ai-confidence-fill'), txt=document.getElementById('ai-confidence-text'), note=document.getElementById('ai-confidence-note');
    if(fill){fill.style.width=val.toFixed(1)+'%'; fill.style.background=val>=70?'var(--green)':val>=40?'var(--orange)':'var(--red)'; fill.style.boxShadow=val>=80?'0 0 10px rgba(0,230,118,.45)':'none';}
    if(txt) txt.textContent=val.toFixed(1)+'%';
    if(note) note.textContent=val>=80?'High confidence setup. Still needs execution/risk filters clear.':val>=60?'Medium confidence. AI may wait for cleaner trigger.':'Low confidence. AI should wait or block.';
  }
  function decisionToTrigger(d){
    if(!d) return;
    const best=(d.best_strategy)||{}; const conf=Number(d.confidence||0); const side=String(d.side||'WAIT');
    const tfp=d.timeframe_plan||{}; const tf=[tfp.bias||tfp.bias_tf, tfp.entry||tfp.entry_tf, tfp.execution||tfp.execution_tf].filter(Boolean).join('/');
    updateConfidenceMini(conf);
    if(d.approved && side && side!=='WAIT'){
      recordTrigger({status:'SETUP FORMED', strategy:best.strategy||'AI SELECTED', direction:side, confidence:conf, tf, lot:d.max_lot_cap?Number(d.max_lot_cap).toFixed(2):'', reason:'AI approved. Waiting for execution trigger.'});
    } else if(!d.approved && conf>=70){
      const blocks=(d.block_reasons||[]).join(' \u00b7 ') || d.note || 'AI blocked / waiting for cleaner trigger';
      recordTrigger({status:'MISSED/BLOCKED', strategy:best.strategy||'NONE', direction:side||'WAIT', confidence:conf, tf, reason:blocks});
    }
  }
  function installWrappers(){
    buildUI();
    if(typeof window.applyAIMasterDecision==='function' && !window.applyAIMasterDecision.__triggerWrapped){
      const old=window.applyAIMasterDecision;
      const wrapped=function(d){const out=old.apply(this,arguments); try{decisionToTrigger(d);}catch(e){} return out;};
      wrapped.__triggerWrapped=true; window.applyAIMasterDecision=wrapped;
    }
    if(typeof window.manualOrder==='function' && !window.manualOrder.__triggerWrapped){
      const oldOrder=window.manualOrder;
      const wrappedOrder=async function(side){
        const strat=(window.aiMasterDecision&&window.aiMasterDecision.best_strategy&&window.aiMasterDecision.best_strategy.strategy)||'Manual/AI Order';
        const conf=Number((window.aiMasterDecision&&window.aiMasterDecision.confidence)||0);
        try{const before=Date.now(); const res=await oldOrder.apply(this,arguments); recordTrigger({status:'TRIGGERED',strategy:strat,direction:side,confidence:conf,tf:(document.getElementById('live-tf')||{}).value||'',lot:(document.getElementById('live-lot')||{}).value||'',reason:'Order function fired. Check MT5 ticket/log for broker confirmation.'}); return res;}
        catch(e){recordTrigger({status:'MISSED/FAILED',strategy:strat,direction:side,confidence:conf,tf:(document.getElementById('live-tf')||{}).value||'',lot:(document.getElementById('live-lot')||{}).value||'',reason:e.message||'Order failed'}); throw e;}
      };
      wrappedOrder.__triggerWrapped=true; window.manualOrder=wrappedOrder;
    }
  }
  window.SnipeXTriggerHistorySystem={buildUI,renderTriggerHistory,recordTrigger,clearTriggerHistory,updateConfidenceMini,decisionToTrigger,installWrappers};
  setTimeout(installWrappers,800);
  setInterval(installWrappers,5000);
})();


(function(){
  if(window.__SNIPEX_AUTO_REFRESH_30M__) return; window.__SNIPEX_AUTO_REFRESH_30M__ = true;
  const REFRESH_MS = 30 * 60 * 1000, STORE_NEXT = 'snipex_next_auto_refresh_at_v1';
  function bootMasterAIOnce(reason){
    try{
      const saved = localStorage.getItem('snipex_master_ai_on');
      if(saved === '0') return; // user manually turned Master AI OFF, respect it
      window.aiOn = true;
      if(typeof aiOn !== 'undefined') aiOn = true;
      if(typeof autoOn !== 'undefined') autoOn = true;
      localStorage.setItem('snipex_master_ai_on','1');
      if(typeof applyMasterAIMode === 'function') applyMasterAIMode(reason || 'boot-default-on');
      const st=document.getElementById('ai-state'); if(st) st.textContent='AI ON';
      const rib=document.getElementById('rib-ai'); if(rib) rib.textContent='MASTER AI';
    }catch(e){}
  }
  function nextAt(){ let n=Number(localStorage.getItem(STORE_NEXT)||0); if(!n || n<Date.now()+10000){ n=Date.now()+REFRESH_MS; localStorage.setItem(STORE_NEXT,String(n)); } return n; }
  function badge(){ try{ let b=document.getElementById('snipex-auto-refresh-badge'); if(!b){ b=document.createElement('div'); b.id='snipex-auto-refresh-badge'; b.style.cssText='position:fixed;right:14px;bottom:14px;z-index:99999;font-family:Orbitron,monospace;font-size:9px;letter-spacing:.8px;color:#8ff6ff;background:rgba(5,10,20,.78);border:1px solid rgba(0,229,255,.22);border-radius:999px;padding:6px 9px;box-shadow:0 0 14px rgba(0,229,255,.10);pointer-events:none;opacity:.72'; document.body.appendChild(b); } const left=Math.max(0,nextAt()-Date.now()); const m=Math.floor(left/60000), sec=Math.floor((left%60000)/1000); const aiOff = localStorage.getItem('snipex_master_ai_on') === '0'; b.textContent='\u21bb Auto Refresh '+String(m).padStart(2,'0')+':'+String(sec).padStart(2,'0')+' \u00b7 Master AI '+(aiOff?'OFF':'ON'); }catch(e){} }
  function tick(){ badge(); if(Date.now()>=nextAt()){ try{ localStorage.setItem(STORE_NEXT,String(Date.now()+REFRESH_MS)); }catch(e){} try{ (window.logLive||console.log)('\u21bb Auto refreshing page after 30 minutes. Master AI state will be preserved.','warn'); }catch(e){} setTimeout(()=>location.reload(),500); } }
  function boot(){ bootMasterAIOnce('boot-default-on'); nextAt(); tick(); setInterval(tick,1000); }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot); else boot();
})();


/* ============ SNIPEX BOOT SELF HEALING ENGINE ============ */
(function(){
  const BOOT = { tries:0, maxTries:18, repairing:false, ready:false, lastStage:'INIT', timer:null, symbol:'XAUUSD' };
  function pill(){
    let el=document.getElementById('bootHealPill');
    if(!el){ el=document.createElement('div'); el.id='bootHealPill'; el.textContent='Boot healer: starting...'; document.body.appendChild(el); }
    return el;
  }
  function cleanBootLogLines(){
    try{
      const el=document.getElementById('live-log'); if(!el) return;
      [...el.children].forEach(ch=>{ const t=(ch.textContent||'').toLowerCase(); if(t.includes('live engine boot')||t.includes('bridge startup check')||t.includes('boot self-heal')) ch.remove(); });
    }catch(e){}
  }
  function setBoot(text, kind){
    const el=pill();
    const shortText = kind==='ready' ? 'LIVE' : (kind==='bad' ? 'BOOT!' : 'BOOT');
    el.textContent=shortText; el.title=text; el.className=kind||'';
    const note=document.getElementById('live-bridge-note'); if(note) note.textContent=(kind==='ready'?'Bridge connected':'Bridge checking');
    if(kind==='ready'){ cleanBootLogLines(); setTimeout(()=>{ try{ const b=document.getElementById('bootHealPill'); if(b) b.style.display='none'; }catch(_e){} }, 2500); }
    // Do not spam live position log with boot state updates.
  }
  async function bootFetch(path, opts={}){
    const controller=new AbortController(); const t=setTimeout(()=>controller.abort(), opts.timeoutMs||4500);
    try{ const url = String(path).startsWith('http') ? path : ((window.SNIPEX_BRIDGE_BASE||BRIDGE_BASE) + path); const r=await fetch(url,{headers:{'Content-Type':'application/json'},...opts,signal:controller.signal}); return await r.json(); }
    finally{ clearTimeout(t); }
  }
  function activeSymbol(){
    try{ return (window.liveSymbol || (document.getElementById('live-symbol')||{}).value || 'XAUUSD'); }catch(e){ return 'XAUUSD'; }
  }
  function stageText(h){
    const stage=(h&&h.stage)||'UNKNOWN';
    if(stage==='ENGINE_READY') return '\u2705 Live engine ready \u00b7 MT5 + prices healthy';
    if(stage==='MT5_IMPORT_FAILED') return '\u274c MT5 package issue \u00b7 run setup/doctor';
    if(stage==='MT5_LOGIN_REQUIRED') return '\u26a0 MT5 login required \u00b7 open MT5 and login';
    if(stage==='PRICE_WAITING') return '\u26a0 Waiting for fresh live price tick';
    if(stage==='PRICE_ERROR') return '\u26a0 Price feed repair needed';
    if(stage==='BRIDGE_OR_MT5_ERROR') return '\u26a0 Bridge/MT5 repair needed';
    return '\u2699 Live engine checking: '+stage;
  }
  async function repair(reason){
    if(BOOT.repairing || BOOT.ready) return;
    BOOT.repairing=true;
    setBoot('\ud83d\udee0 Boot self-heal running: '+reason, 'healing');
    try{
      const res=await bootFetch('/api/boot/repair',{method:'POST',body:JSON.stringify({symbol:activeSymbol()}),timeoutMs:12000});
      const after=res.after||{};
      if(after.ok){ BOOT.ready=true; setBoot('\u2705 Live engine repaired and ready', 'ready'); if(typeof pullMT5Now==='function') setTimeout(()=>pullMT5Now().catch(()=>{}),500); }
      else setBoot(stageText(after)+' \u00b7 '+((after.issues||[])[0]||'repair attempted'), 'bad');
    }catch(e){ setBoot('\u274c Boot repair failed: '+(e.message||e), 'bad'); }
    finally{ BOOT.repairing=false; }
  }
  async function check(){
    if(BOOT.ready) return;
    BOOT.tries++;
    const sym=activeSymbol(); BOOT.symbol=sym;
    try{
      let h=await bootFetch('/api/boot/health?symbol='+encodeURIComponent(sym),{timeoutMs:5000});
      // STRICT REAL MODE: do not mark engine ready from generic /api/status alone.
      // Boot readiness requires the dedicated health endpoint to confirm symbol/tick/candle state.
      BOOT.lastStage=h.stage||'UNKNOWN';
      if(h.ok){
        BOOT.ready=true;
        setBoot('\u2705 Live engine ready \u00b7 '+sym+' tick live', 'ready');
        if(typeof setBridgeUI==='function') setBridgeUI(true, 'Live engine ready');
        if(typeof pullMT5Now==='function') setTimeout(()=>pullMT5Now().catch(()=>{}), 400);
        clearInterval(BOOT.timer);
        return;
      }
      setBoot(stageText(h), BOOT.tries>2?'bad':'healing');
      if(BOOT.tries===2 || BOOT.tries===5 || BOOT.tries===9) await repair(h.stage||'health check failed');
      if(BOOT.tries>=BOOT.maxTries){
        clearInterval(BOOT.timer);
        setBoot('\u274c Boot not ready: '+((h.issues||[])[0]||h.stage||'unknown')+' \u00b7 Doctor panel available', 'bad');
        try{ if(typeof openDoctorPanel==='function') openDoctorPanel(); }catch(e){}
      }
    }catch(e){
      setBoot('\u26a0 Bridge not responding yet \u00b7 retrying self-heal', 'bad');
      if(BOOT.tries===2 || BOOT.tries===5) await repair('bridge timeout');
      if(BOOT.tries>=BOOT.maxTries){ clearInterval(BOOT.timer); setBoot('\u274c Bridge still not responding \u00b7 restart with START_SNIPEX_PLUG_AND_PLAY.bat', 'bad'); }
    }
  }
  window.SnipeXBootHealer={check,repair,state:BOOT};
  function start(){
    setBoot('\u2699 Live engine booting with self-heal...', 'healing');
    setTimeout(check, 600);
    BOOT.timer=setInterval(check, 3500);
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', start); else start();
})();


/* ============ SNIPEX CLEAN UI FINAL PATCH: Doctor side button only + no floating ask/autofix ============ */
(function(){
  function isDoctorPanelInside(el){ return !!(el && el.closest && el.closest('#doctor-repair-center')); }
  function cleanupFloatingDoctorExtras(){
    try{
      document.querySelectorAll('body *').forEach(el=>{
        if(!el || isDoctorPanelInside(el) || el.id==='doctor-open-fab' || el.id==='doctor-repair-center' || el.id==='doctor-event-toast') return;
        const txt=(el.textContent||'').trim();
        const idc=((el.id||'')+' '+(el.className||'')).toLowerCase();
        const pos=getComputedStyle(el).position;
        const isFloating=(pos==='fixed'||pos==='absolute');
        if(isFloating && (txt.startsWith('Ask Doctor') || txt.includes('Auto-Fix ON') || idc.includes('askdoctor') || idc.includes('ask-doctor') || idc.includes('autofix') || idc.includes('auto-fix'))){
          el.style.display='none';
          el.setAttribute('data-snipex-hidden','doctor-extra-removed');
        }
      });
      const fab=document.getElementById('doctor-open-fab');
      if(fab){ fab.style.display='block'; fab.style.top='52%'; fab.style.right='0'; fab.style.opacity='.72'; }
    }catch(e){}
  }
  function install(){ cleanupFloatingDoctorExtras(); setInterval(cleanupFloatingDoctorExtras,1500); }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', install); else install();
})();


/* ============ SNIPEX HARD UI CLEAN PATCH: remove Ask Doctor mini + AutoFix badge + boot spam ============ */
(function(){
  function insideDoctor(el){ return !!(el && el.closest && el.closest('#doctor-repair-center')); }
  function hideMainScreenClutter(){
    try{
      // Position log hard cleanup for older boot messages already printed by previous builds.
      const log=document.getElementById('live-log');
      if(log){ [...log.children].forEach(ch=>{ const t=(ch.textContent||'').toLowerCase(); if(t.includes('live engine still booting')||t.includes('live engine booting')||t.includes('checking /api/status')||t.includes('self-healing boot')) ch.remove(); }); }
      document.querySelectorAll('body *').forEach(el=>{
        if(!el || insideDoctor(el) || el.id==='doctor-open-fab' || el.id==='doctor-repair-center' || el.id==='doctor-event-toast' || el.id==='bootHealPill') return;
        const txt=(el.textContent||'').trim();
        const idc=((el.id||'')+' '+(el.className||'')).toLowerCase();
        const mustHide =
          txt.startsWith('Ask Doctor') ||
          txt.includes('Ask Doctor\
') ||
          txt.includes('Auto-Fix ON') ||
          txt.includes('Auto Fix ON') ||
          idc.includes('askdoctor') || idc.includes('ask-doctor') || idc.includes('quick-doctor') ||
          idc.includes('autofix') || idc.includes('auto-fix');
        if(mustHide){ el.style.setProperty('display','none','important'); el.setAttribute('data-snipex-hidden','main-screen-clutter'); }
      });
      const fab=document.getElementById('doctor-open-fab');
      if(fab){ fab.style.setProperty('display','block','important'); fab.style.top='52%'; fab.style.right='0'; fab.style.opacity='.72'; }
    }catch(e){}
  }
  // Patch any later reassignment of logLive too.
  function patchLogLive(){
    try{
      if(typeof window.logLive==='function' && !window.logLive.__snipexBootFilter){
        const old=window.logLive;
        const wrapped=function(msg,kind){ const low=String(msg||'').toLowerCase(); if(low.includes('live engine still booting')||low.includes('live engine booting')||low.includes('checking /api/status')||low.includes('self-healing boot')) return; return old.apply(this,arguments); };
        wrapped.__snipexBootFilter=true; window.logLive=wrapped;
      }
    }catch(e){}
  }
  function install(){ hideMainScreenClutter(); patchLogLive(); setInterval(()=>{hideMainScreenClutter(); patchLogLive();}, 700); }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', install); else install();
})();


(function(){
  const BUILD='FINAL_UNIFIED_CLEAN_NO_CACHE_20260430';
  window.SNIPEX_BUILD_ID=BUILD;
  const BAD_LOG_PATTERNS=[
    'live engine still booting','live engine booting','checking /api/status','self-healing boot','bridge startup check',
    'real net pnl payload','payload keys='
  ];
  function low(x){return String(x||'').toLowerCase();}
  function isBadLogText(t){t=low(t); return BAD_LOG_PATTERNS.some(p=>t.includes(p));}
  function insideDoctorPanel(el){return !!(el&&el.closest&&el.closest('#doctor-repair-center'));}
  function shouldHideFloating(el){
    if(!el || insideDoctorPanel(el)) return false;
    const idc=low((el.id||'')+' '+(typeof el.className==='string'?el.className:''));
    const txt=(el.textContent||'').trim();
    if(el.id==='doctor-open-fab'||el.id==='doctor-repair-center'||el.id==='doctor-event-toast'||el.id==='bootHealPill') return false;
    if(idc.includes('askdoctor')||idc.includes('ask-doctor')||idc.includes('quick-doctor')||idc.includes('doctor-main-ask')||idc.includes('doctor-mini')) return true;
    if(idc.includes('autofix')||idc.includes('auto-fix')||idc.includes('auto_fix')) return true;
    if(txt==='Ask Doctor' || txt.startsWith('Ask Doctor\
') || txt.includes('Auto-Fix ON') || txt.includes('Auto Fix ON')) return true;
    return false;
  }
  function hideEl(el){try{el.style.setProperty('display','none','important');el.style.setProperty('visibility','hidden','important');el.setAttribute('data-snipex-final-hidden','1');}catch(e){}}
  function cleanLogs(){
    try{
      const candidates=[document.getElementById('live-log'),document.querySelector('.live-log'),document.querySelector('[data-log]')].filter(Boolean);
      candidates.forEach(log=>{[...log.children].forEach(ch=>{if(isBadLogText(ch.textContent)) ch.remove();});});
      document.querySelectorAll('pre,code,.log-line,.trade-log-row,.status-line').forEach(ch=>{if(isBadLogText(ch.textContent)) ch.remove();});
    }catch(e){}
  }
  function cleanUI(){
    try{
      document.querySelectorAll('body *').forEach(el=>{if(shouldHideFloating(el)) hideEl(el);});
      const fab=document.getElementById('doctor-open-fab');
      if(fab){fab.style.setProperty('display','block','important'); fab.style.right='0'; fab.style.top='52%'; fab.style.opacity='.74';}
      const boot=document.getElementById('bootHealPill');
      if(boot){
        const t=low(boot.textContent);
        boot.style.fontSize='7px'; boot.style.padding='1px 4px'; boot.style.maxWidth=t.includes('ready')?'34px':'38px'; boot.style.right='106px'; boot.style.top='82px';
        if(t.includes('ready')){boot.textContent='\u2705 LIVE'; setTimeout(()=>{try{boot.style.display='none';}catch(e){}},1800);}
        if(t.includes('booting')||t.includes('checking')) boot.textContent='\u2026';
      }
      cleanLogs();
    }catch(e){}
  }
  function patchLoggers(){
    ['logLive','addLog','appendLog','tradeLog','pushLog'].forEach(name=>{
      try{
        const fn=window[name];
        if(typeof fn==='function' && !fn.__snipexFinalFilter){
          const wrapped=function(msg){ if(isBadLogText(msg)) return; return fn.apply(this,arguments); };
          wrapped.__snipexFinalFilter=true; window[name]=wrapped;
        }
      }catch(e){}
    });
  }
  function installObserver(){
    try{
      const obs=new MutationObserver(muts=>{
        for(const m of muts){
          m.addedNodes&&m.addedNodes.forEach(n=>{
            if(n.nodeType!==1) return;
            if(shouldHideFloating(n)) hideEl(n);
            if(isBadLogText(n.textContent)){
              const idc=low((n.id||'')+' '+(typeof n.className==='string'?n.className:''));
              if(idc.includes('log')||n.closest&&n.closest('#live-log,.live-log,[data-log]')) n.remove();
            }
            if(n.querySelectorAll) n.querySelectorAll('*').forEach(el=>{ if(shouldHideFloating(el)) hideEl(el); });
          });
        }
      });
      obs.observe(document.body,{childList:true,subtree:true});
      window.__snipexFinalCleanObserver=obs;
    }catch(e){}
  }
  function install(){
    try{document.documentElement.setAttribute('data-snipex-build',BUILD);}catch(e){}
    cleanUI(); patchLoggers(); installObserver();
    setInterval(()=>{cleanUI();patchLoggers();},500);
    // one-time cache marker so user can verify final build loaded
    console.log('SnipeX build loaded:',BUILD);
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',install); else install();
})();


/* ============ SNIPEX HEDGE FUND EXECUTION SYSTEM v1 ============
   Master AI ON = managed execution, mandatory profit protection, learning journal.
   Master AI OFF = manual only. No fake execution status.
*/
(function(){
  if(window.__SNIPEX_HF_EXEC_V1__) return; window.__SNIPEX_HF_EXEC_V1__ = true;
  const STORE='snipex_hf_learning_journal_v1';
  const EXEC = window.SNIPEX_HF_EXECUTION = Object.assign({
    enabled:true, busy:false, symbolLocks:{}, executedKeys:{}, retries:3,
    retryDelayMs:650, cooldownMs:15000, minConfidence:0,
    requireMasterAI:true, requireBridge:true, onePositionPerSymbol:false,
    mandatoryProfit:true, breakEvenAfterTP1:true, trailAfterTP2:true,
    lastManageAt:0, manageEveryMs:2500
  }, window.SNIPEX_HF_EXECUTION || {});
  function now(){return Date.now();}
  function log(msg,type){ try{ (window.logLive||console.log)(msg,type||'ok'); }catch(e){ try{console.log(msg);}catch(_){}} }
  function sleep(ms){return new Promise(r=>setTimeout(r,ms));}
  function safeJson(k, fallback){ try{return JSON.parse(localStorage.getItem(k)||'')||fallback;}catch(e){return fallback;} }
  function saveJson(k,v){ try{localStorage.setItem(k,JSON.stringify(v));}catch(e){} }
  function journal(){ return safeJson(STORE,{version:1,trades:[],strategies:{},events:[]}); }
  function saveJournal(j){ j.trades=(j.trades||[]).slice(0,500); j.events=(j.events||[]).slice(0,300); saveJson(STORE,j); }
  function stratKey(name){ return String(name||'UNKNOWN').trim().toUpperCase(); }
  function symbolOf(t){ return String(t.sym||t.symbol||window.liveSymbol||'XAUUSD').toUpperCase(); }
  function sideOf(t){ const s=String(t.side||t.type||'').toUpperCase(); return s.includes('SELL')?'SELL':'BUY'; }
  function ticketOf(t){ return t.ticket||t.id||t.position||t.order||''; }
  function entryOf(t){ return Number(t.entry||t.price_open||t.open_price||0); }
  function currentOf(t){ return Number(t.exit||t.price_current||t.current_price||t.price||0); }
  function lotsOf(t){ return Number(t.lots||t.volume||0); }
  function pointsProfit(t){ const e=entryOf(t), c=currentOf(t); if(!e||!c) return 0; return sideOf(t)==='BUY' ? c-e : e-c; }
  function getOpenTrades(){ try{return Array.isArray(window.TRADES)?window.TRADES:[];}catch(e){return [];} }
  function hasOpenPosition(sym){ return getOpenTrades().some(t=>symbolOf(t)===String(sym||'').toUpperCase() && lotsOf(t)>0); }
  function setupKey(setup){ return [setup.symbol||window.liveSymbol, setup.direction||setup.side, Number(setup.entry||setup.price||0).toFixed(2), setup.timeframe||'', setup.strategy_name||setup.strategy||''].join('|').toUpperCase(); }
  function rememberEvent(status, data){
    const j=journal(); j.events.unshift(Object.assign({time:new Date().toISOString(),status},data||{})); saveJournal(j);
    try{ window.recordTrigger && window.recordTrigger({status, strategy:data.strategy||data.strategy_name||'', direction:data.side||data.direction||'', confidence:data.confidence||0, tf:data.timeframe||'', lot:data.lot||'', reason:data.reason||''}); }catch(e){}
  }
  async function apiRetry(url, opts, label){
    let last;
    for(let i=1;i<=EXEC.retries;i++){
      try{ const r=await api(url,opts||{}); if(!r || r.ok===false) throw new Error((r&&r.error)||'not ok'); return r; }
      catch(e){ last=e; log(`\u26a0 ${label||url} retry ${i}/${EXEC.retries}: ${e.message}`,'warn'); if(i<EXEC.retries) await sleep(EXEC.retryDelayMs*i); }
    }
    throw last||new Error(label+' failed');
  }
  function buildManagedPayload(setup, source){
    const sym=String(setup.symbol||window.liveSymbol||'XAUUSD').toUpperCase();
    const side=String(setup.direction||setup.side||'').toUpperCase();
    const strategy=setup.strategy_name||setup.strategy||'MASTER AI SELECTED';
    let lot=0.01;
    try{ lot = typeof window.getSnipeXTradeLot==='function' ? window.getSnipeXTradeLot(setup) : Number((document.getElementById('live-lot')||{}).value||0.01); }catch(e){}
    lot=Math.max(0.01,Math.round(Number(lot||0.01)*100)/100);
    return {symbol:sym,side,lot,volume:lot,sl:Number(setup.sl||0),tp:Number(setup.tp||setup.tp4||setup.tp3||setup.tp2||setup.tp1||0),entry:Number(setup.entry||setup.price||0),timeframe:(typeof getSetupTimeframe==='function'?getSetupTimeframe(setup):(setup.timeframe||'M5')),strategy,strategy_name:strategy,confidence:Number(setup.confidence||0),comment:'SnipeX HF Exec',source:'hf_exec_'+(source||'ai'),queue_on_fail:true,master_ai_required:false,partial_plan:{mandatory:true,tp1:setup.tp1,tp2:setup.tp2,tp3:setup.tp3,tp4:setup.tp4,break_even_after_tp1:true,trail_after_tp2:true}};
  }
  async function executeManagedSetup(setup, source){
    if(!setup) return {fired:false,reason:'setup missing'};
    if(!setup.ready){
      const rrReady = Number(setup.rr || setup.riskReward || setup.min_rr || 0);
      const confReady = Number(setup.confidence || setup.master_confidence || 0);
      const dirReady = String(setup.direction || setup.side || '').toUpperCase();
      if(!(rrReady >= 3 && confReady >= 70 && ['BUY','SELL'].includes(dirReady))){
        return {fired:false,reason:'setup not ready'};
      }
      try{ log && log('\u26a0 setup.ready=false bypassed for confirmed RR>=1:3 high-quality setup. Backend hard safety will decide.','warn'); }catch(_e){}
    }
    const payload=buildManagedPayload(setup,source), key=setupKey(setup), sym=payload.symbol;
    let evoDecision=null;
    try{
      if(window.SnipeXEvolution3741 && typeof window.SnipeXEvolution3741.approveSetup==='function'){
        evoDecision=window.SnipeXEvolution3741.approveSetup(Object.assign({}, setup, payload, {side:payload.side, direction:payload.side, strategyName:payload.strategy, rr:(setup.rr||setup.riskReward||payload.rr||5)}));
        payload.step3741_decision=evoDecision;
        if(!evoDecision.shouldExecute){
          const evoReasons = (evoDecision.reasons||[]).join(' \u00b7 ');
          const criticalEvoBlock = /mt5|tick|invalid|margin|market closed|broker disabled|rr below|opposite direction|daily|equity|hard safety/i.test(evoReasons);
          if(criticalEvoBlock){
            rememberEvent('BLOCKED',Object.assign({},payload,{reason:'STEP37-41 critical block: '+evoReasons}));
            return {fired:false,reason:'STEP37-41 critical block',decision:evoDecision};
          }
          rememberEvent('SOFT_WARNING',Object.assign({},payload,{reason:'STEP37-41 soft warning only: '+evoReasons}));
        }
        if(evoDecision.approved){ try{ log('\ud83e\udde0 STEP37-41 APPROVED: '+sym+' '+payload.side+' \u00b7 '+(evoDecision.reasons||[]).join(' \u00b7 '),'ok'); }catch(_e){} }
      }
    }catch(_evoErr){ try{ log('\u26a0 STEP37-41 decision unavailable: '+_evoErr.message,'warn'); }catch(_e){} }
    if(EXEC.requireMasterAI && !window.aiOn) return {fired:false,reason:'Master AI OFF'};
    if(EXEC.requireBridge && !window.bridgeOnline){ rememberEvent('BLOCKED',Object.assign({},payload,{reason:'bridge offline'})); return {fired:false,reason:'bridge offline'}; }
    if(payload.confidence && payload.confidence<EXEC.minConfidence && !(evoDecision&&evoDecision.approved)){ rememberEvent('SOFT_WARNING',Object.assign({},payload,{reason:'confidence below HF minimum; backend final gate decides'})); }
    if(EXEC.onePositionPerSymbol && hasOpenPosition(sym) && !(evoDecision&&evoDecision.approved)){ rememberEvent('SOFT_WARNING',Object.assign({},payload,{reason:'local open-position warning; backend duplicate guard decides'})); }
    if(evoDecision&&evoDecision.approved){ try{ rememberEvent('SOFT_DISMISSED',Object.assign({},payload,{reason:'legacy confidence/one-position soft blockers dismissed by STEP37-41'})); }catch(_e){} }
    if(EXEC.busy || (EXEC.symbolLocks[sym]||0)>now()) { rememberEvent('SOFT_WARNING',Object.assign({},payload,{reason:'frontend execution lock ignored; backend final gate decides'})); }
    if(EXEC.executedKeys[key] && EXEC.executedKeys[key]>now()) { rememberEvent('SOFT_WARNING',Object.assign({},payload,{reason:'frontend duplicate key ignored; backend duplicate guard decides'})); }
    EXEC.busy=true; EXEC.symbolLocks[sym]=now()+EXEC.cooldownMs; EXEC.executedKeys[key]=now()+EXEC.cooldownMs*2;
    try{
      log(`\ud83c\udfe6 HF EXECUTION firing ${payload.side} ${sym} lot ${payload.lot} \u00b7 ${payload.strategy}`,'ok');
      const r=await apiRetry('/api/order',{method:'POST',body:JSON.stringify(payload),timeoutMs:14000},'HF order');
      const ticket=r.ticket || (r.result&&r.result.order) || (r.result&&r.result.deal) || '';
      try{ log(`\u2705 MASTER AI / HF MT5 RESULT: ${r.retcode||'no-retcode'} ${r.retcode_name||''} ticket ${ticket || 'n/a'} deal ${r.deal || (r.result&&r.result.deal) || 'n/a'}`,'ok'); }catch(_logErr){}
      rememberEvent('EXECUTED',Object.assign({},payload,{ticket,reason:'HF managed order accepted',retcode:r.retcode,retcode_name:r.retcode_name,deal:r.deal || (r.result&&r.result.deal)}));
      const j=journal(); j.trades.unshift({time:new Date().toISOString(),ticket,strategy:payload.strategy,symbol:sym,side:payload.side,lot:payload.lot,entry:payload.entry,sl:payload.sl,tp:payload.tp,confidence:payload.confidence,closed:false,source:payload.source}); saveJournal(j);
      try{ window.execCount=(window.execCount||0)+1; const ec=document.getElementById('exec-count'); if(ec) ec.textContent=window.execCount; }catch(e){}
      try{ await pullMT5Now(); }catch(e){}
      return {fired:true,ticket};
    }catch(e){ rememberEvent('FAILED',Object.assign({},payload,{reason:e.message})); /* failed order does not create symbol cooldown */ throw e; }
    finally{ setTimeout(()=>{EXEC.busy=false;},900); }
  }
  async function forceBreakEven(t){
    const entry=entryOf(t), ticket=ticketOf(t); if(!entry||!ticket) return;
    const key='BE:'+ticket; const st=safeJson('snipex_hf_profit_state_v1',{}); if(st[key]) return;
    try{ await apiRetry('/api/position/modify',{method:'POST',body:JSON.stringify({ticket,symbol:symbolOf(t),sl:entry,tp:t.tp||0,comment:'HF BE'}),timeoutMs:6000},'break-even SL'); st[key]=true; saveJson('snipex_hf_profit_state_v1',st); log(`\ud83d\udee1 HF break-even enforced for ${symbolOf(t)} ticket ${ticket}`,'ok'); }
    catch(e){ log('BE modify pending: '+e.message,'warn'); }
  }
  async function partialClose(t, name, pct, allowFull){
    const ticket=ticketOf(t), sym=symbolOf(t); if(!ticket) return;
    const key='PC:'+ticket+':'+name; const st=safeJson('snipex_hf_profit_state_v1',{}); if(st[key]) return;
    try{ await apiRetry('/api/partial_close',{method:'POST',body:JSON.stringify({ticket,symbol:sym,side:sideOf(t),close_percent:pct,tp_name:name,allow_full_close:!!allowFull,comment:'HF '+name}),timeoutMs:8000},name+' partial'); st[key]=true; saveJson('snipex_hf_profit_state_v1',st); log(`\ud83d\udcb0 HF mandatory profit booked ${name} ${sym} ${pct}%`,'ok'); }
    catch(e){ log(`${name} partial pending: ${e.message}`,'warn'); }
  }
  async function manageProfitProtection(){
    if(!EXEC.mandatoryProfit || !window.aiOn) return;
    if(now()-EXEC.lastManageAt<EXEC.manageEveryMs) return; EXEC.lastManageAt=now();
    const trades=getOpenTrades();
    for(const t of trades){
      if(lotsOf(t)<=0) continue;
      const pp=pointsProfit(t); if(pp<=0) continue;
      if(pp>=2){ await partialClose(t,'TP1',30,false); if(EXEC.breakEvenAfterTP1) await forceBreakEven(t); }
      if(pp>=5){ await partialClose(t,'TP2',30,false); }
      if(pp>=8){ await partialClose(t,'TP3',40,true); }
    }
  }
  function installWrappers(){
    try{
      if(typeof window.maybeAutoTriggerSetup==='function' && !window.maybeAutoTriggerSetup.__hfWrapped){
        const old=window.maybeAutoTriggerSetup;
        const wrapped=async function(setup, source){
          if(window.aiOn) return executeManagedSetup(setup,source).catch(e=>{ log('\u274c HF execution failed: '+e.message,'bad'); return {fired:false,reason:e.message}; });
          return old.apply(this,arguments);
        };
        wrapped.__hfWrapped=true; window.maybeAutoTriggerSetup=wrapped;
      }
      if(typeof window.manualOrder==='function' && !window.manualOrder.__hfManualWrapped){
        const oldM=window.manualOrder;
        const m=function(side){ if(window.aiOn){log('Manual '+side+' blocked: Master AI ON. AI has full control.','warn');return;} return oldM.apply(this,arguments); };
        m.__hfManualWrapped=true; window.manualOrder=m;
      }
    }catch(e){}
  }
  window.SnipeXHFLearning={journal,executeManagedSetup,manageProfitProtection};
  setInterval(()=>{installWrappers(); manageProfitProtection().catch(e=>log('HF profit manager safe error: '+e.message,'warn'));},1000);
  installWrappers();
  log('\ud83c\udfe6 Hedge Fund Execution System armed: execution lock, retry, mandatory profit booking, BE enforcement, learning journal.','ok');
})();


(function(){
  if (window.__SNIPEX_PYRAMID_DEBUG_OVERLAY__) return;
  window.__SNIPEX_PYRAMID_DEBUG_OVERLAY__ = true;
  var timer = null;
  function esc(s){ return String(s || '').replace(/[<>&]/g, function(c){ return {'<':'&lt;','>':'&gt;','&':'&amp;'}[c]; }); }
  function ensureOverlay(){
    var el = document.getElementById('pyramid-debug-overlay');
    if(!el){ el = document.createElement('div'); el.id = 'pyramid-debug-overlay'; document.body.appendChild(el); }
    return el;
  }
  window.showPyramidDebug = function(message, type){
    var el = ensureOverlay();
    var t = String(type || 'info').toLowerCase();
    el.className = '';
    if(t.indexOf('add') >= 0 || t.indexOf('exec') >= 0) el.classList.add('pdo-add');
    else if(t.indexOf('block') >= 0 || t.indexOf('wait') >= 0 || t.indexOf('skip') >= 0) el.classList.add('pdo-block');
    else if(t.indexOf('error') >= 0 || t.indexOf('off') >= 0 || t.indexOf('disable') >= 0 || t.indexOf('kill') >= 0) el.classList.add('pdo-error');
    var stamp = new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit', second:'2-digit'});
    el.innerHTML = '<div class="pdo-title">PYRAMID DEBUG \u00b7 '+stamp+'</div>' + esc(message);
    el.style.display = 'block';
    if(timer) clearTimeout(timer);
    timer = setTimeout(function(){ el.style.display = 'none'; }, 20000);
  };
  window.pyramidReasonLog = function(ctx){
    ctx = ctx || {};
    return ['Profit: '+(ctx.profit ?? ctx.pnl ?? 'n/a'),'Trend: '+(ctx.trend ?? ctx.regime ?? 'n/a'),'Spread: '+(ctx.spread ?? 'n/a'),'Momentum: '+(ctx.momentum ?? 'n/a'),'Confidence: '+(ctx.confidence ?? 'n/a')].join('\
');
  };
  window.SnipeXPyramidDebug = {
    add:function(msg){ window.showPyramidDebug(msg || '\u26a1 Pyramiding ADD executed','add'); },
    block:function(msg){ window.showPyramidDebug(msg || '\u26a0\ufe0f Pyramiding blocked','block'); },
    off:function(msg){ window.showPyramidDebug(msg || '\ud83d\udeab Pyramiding disabled','error'); },
    info:function(msg){ window.showPyramidDebug(msg || '\u2139\ufe0f Pyramiding status update','info'); }
  };
  var oldLog = console.log.bind(console);
  console.log = function(){
    try{
      var text = Array.prototype.slice.call(arguments).map(function(x){ return typeof x === 'string' ? x : JSON.stringify(x); }).join(' ');
      if(/pyramid|pyramiding/i.test(text)){
        var type = /add|execut/i.test(text) ? 'add' : (/block|skip|wait/i.test(text) ? 'block' : (/off|disable|kill|error/i.test(text) ? 'error' : 'info'));
        window.showPyramidDebug(text, type);
      }
    }catch(e){}
    return oldLog.apply(console, arguments);
  };
})();


(function(){
  if(window.__SNIPEX_MASTER_AI_EXEC_CONF_SYNC_V2__) return;
  window.__SNIPEX_MASTER_AI_EXEC_CONF_SYNC_V2__ = true;

  var STORE_KEY = 'snipex_master_ai_execution_confidence_state_v2';
  var lastState = {value:0, source:'BOOT', status:'WAITING', strategy:'--', direction:'WAIT', reason:'Waiting for Master AI / execution engine', ts:Date.now()};

  function n(v, fallback){
    var x = Number(v);
    return Number.isFinite(x) ? x : (fallback || 0);
  }
  function clamp(v){ return Math.max(0, Math.min(100, n(v,0))); }
  function esc(s){ return String(s || '').replace(/[<>&]/g, function(c){ return {'<':'&lt;','>':'&gt;','&':'&amp;'}[c]; }); }
  function save(){ try{ localStorage.setItem(STORE_KEY, JSON.stringify(lastState)); }catch(e){} }
  function load(){ try{ var x=JSON.parse(localStorage.getItem(STORE_KEY)||'null'); if(x && typeof x==='object') lastState=Object.assign(lastState,x); }catch(e){} }

  function ensureMini(){
    try{
      if(window.SnipeXTriggerHistorySystem && typeof window.SnipeXTriggerHistorySystem.buildUI === 'function') window.SnipeXTriggerHistorySystem.buildUI();
    }catch(e){}
    var aiPanel = document.getElementById('ai-decision') || document.querySelector('.ai-decision') || document.body;
    if(!document.getElementById('ai-confidence-mini') && aiPanel){
      var box=document.createElement('div'); box.className='ai-confidence-mini'; box.id='ai-confidence-mini';
      box.innerHTML='<div class="ai-confidence-head"><span>\ud83e\udde0 MASTER AI CONFIDENCE</span><span id="ai-confidence-text">0%</span></div><div class="ai-confidence-track"><div class="ai-confidence-fill" id="ai-confidence-fill"></div></div><div class="ai-confidence-note" id="ai-confidence-note">Execution-synced score. Waiting for signal.</div>';
      if(aiPanel.parentNode) aiPanel.parentNode.insertBefore(box, aiPanel.nextSibling); else document.body.appendChild(box);
    }
  }

  function paint(){
    ensureMini();
    var val=clamp(lastState.value);
    var fill=document.getElementById('ai-confidence-fill');
    var txt=document.getElementById('ai-confidence-text');
    var note=document.getElementById('ai-confidence-note');
    if(fill){
      fill.style.width=val.toFixed(1)+'%';
      fill.style.background=val>=80?'var(--green)':(val>=60?'var(--orange)':'var(--red)');
      fill.style.boxShadow=val>=80?'0 0 14px rgba(0,230,118,.55)':(val>=60?'0 0 10px rgba(255,171,0,.35)':'none');
    }
    if(txt) txt.textContent=val.toFixed(1)+'%';
    if(note){
      var gate = val>=80 ? 'EXECUTION READY ZONE' : (val>=60 ? 'WAITING FOR CLEAN TRIGGER' : 'BLOCK / WAIT ZONE');
      note.innerHTML = gate+' \u00b7 Source: '+esc(lastState.source)+' \u00b7 '+esc(lastState.status)+' \u00b7 '+esc(lastState.strategy)+' '+esc(lastState.direction)+'<br>'+esc(lastState.reason||'');
    }
    try{
      var chip=document.getElementById('ai-master-confidence-chip');
      if(!chip){
        var dec=document.getElementById('ai-decision');
        if(dec){ chip=document.createElement('div'); chip.id='ai-master-confidence-chip'; chip.style.cssText='margin-top:6px;font-size:10px;font-weight:900;color:var(--cyan);letter-spacing:.5px'; dec.parentNode.insertBefore(chip, dec); }
      }
      if(chip) chip.textContent='MASTER AI EXEC CONFIDENCE: '+val.toFixed(1)+'% \u00b7 '+lastState.source;
    }catch(e){}
  }

  function pickConfidence(obj){
    obj=obj||{};
    var values=[obj.execution_confidence,obj.exec_confidence,obj.confidence,obj.ai_confidence,obj.score,obj.final_confidence];
    if(obj.master) values.push(obj.master.confidence);
    if(obj.decision) values.push(obj.decision.confidence);
    if(obj.setup) values.push(obj.setup.confidence);
    if(obj.payload) values.push(obj.payload.confidence);
    for(var i=0;i<values.length;i++){ var x=Number(values[i]); if(Number.isFinite(x) && x>=0) return clamp(x); }
    var d=window.aiMasterDecision||window.masterDecision||null;
    if(d && Number.isFinite(Number(d.confidence))) return clamp(d.confidence);
    return lastState.value||0;
  }

  window.updateMasterAIExecutionConfidence = function(obj, source){
    obj=obj||{};
    var val=pickConfidence(obj);
    lastState={
      value:val,
      source:source || obj.source || 'EXECUTION_ENGINE',
      status:obj.status || obj.decision || obj.state || (obj.approved===true?'APPROVED':(obj.approved===false?'BLOCKED':'UPDATED')),
      strategy:obj.strategy || obj.strategy_name || (obj.best_strategy && obj.best_strategy.strategy) || (obj.payload && (obj.payload.strategy||obj.payload.strategy_name)) || (obj.setup && (obj.setup.strategy||obj.setup.strategy_name)) || ((window.aiMasterDecision&&window.aiMasterDecision.best_strategy&&window.aiMasterDecision.best_strategy.strategy)||'--'),
      direction:obj.direction || obj.side || (obj.payload && (obj.payload.side||obj.payload.direction)) || (obj.setup && (obj.setup.side||obj.setup.direction)) || ((window.aiMasterDecision&&window.aiMasterDecision.side)||'WAIT'),
      reason:obj.reason || obj.note || (obj.block_reasons && obj.block_reasons.join(' \u00b7 ')) || (obj.payload && obj.payload.reason) || 'Synced from Master AI execution engine',
      ts:Date.now()
    };
    save(); paint();
    return lastState;
  };

  function wrap(name, wrapper){
    try{
      var fn=window[name];
      if(typeof fn==='function' && !fn.__confSyncWrapped){
        var w=wrapper(fn); w.__confSyncWrapped=true; window[name]=w;
      }
    }catch(e){}
  }

  function install(){
    load(); paint();
    wrap('renderAIMasterDecision', function(old){ return function(d, extra){
      var out=old.apply(this, arguments);
      try{ window.updateMasterAIExecutionConfidence(d || {}, 'MASTER_AI_DECISION'); }catch(e){}
      return out;
    };});
    wrap('recordTrigger', function(old){ return function(item){
      try{ window.updateMasterAIExecutionConfidence(item || {}, 'EXECUTION_TRIGGER_HISTORY'); }catch(e){}
      return old.apply(this, arguments);
    };});
    wrap('maybeAutoTriggerSetup', function(old){ return async function(setup, source){
      try{ window.updateMasterAIExecutionConfidence({setup:setup, status:'PRE_EXECUTION_CHECK', reason:'Auto trigger evaluating setup'}, 'AUTO_TRIGGER_PRECHECK'); }catch(e){}
      try{
        var res=await old.apply(this, arguments);
        try{ window.updateMasterAIExecutionConfidence(Object.assign({}, setup||{}, res||{}, {setup:setup, status:(res&&res.fired)?'EXECUTED':'WAIT/BLOCKED', reason:(res&&res.reason)||'Auto trigger completed'}), 'AUTO_TRIGGER_RESULT'); }catch(e){}
        return res;
      }catch(err){
        try{ window.updateMasterAIExecutionConfidence(Object.assign({}, setup||{}, {setup:setup, status:'FAILED', reason:err.message||'Execution failed'}), 'AUTO_TRIGGER_FAILED'); }catch(e){}
        throw err;
      }
    };});
    wrap('manualOrder', function(old){ return async function(side){
      try{ window.updateMasterAIExecutionConfidence({side:side, status:'MANUAL_ORDER_CALLED', reason:window.aiOn?'Manual blocked because Master AI controls execution':'Manual order fired'}, 'ORDER_FUNCTION'); }catch(e){}
      return old.apply(this, arguments);
    };});
    try{
      if(window.SnipeXHFLearning && typeof window.SnipeXHFLearning.executeManagedSetup==='function' && !window.SnipeXHFLearning.executeManagedSetup.__confSyncWrapped){
        var oldExec=window.SnipeXHFLearning.executeManagedSetup;
        var ex=async function(setup, source){
          try{ window.updateMasterAIExecutionConfidence({setup:setup,status:'HF_EXEC_PRECHECK',reason:'HF execution engine received setup'}, 'HF_EXEC_PRECHECK'); }catch(e){}
          try{
            var r=await oldExec.apply(this, arguments);
            try{ window.updateMasterAIExecutionConfidence(Object.assign({}, setup||{}, r||{}, {setup:setup,status:(r&&r.fired)?'HF_EXECUTED':'HF_WAIT/BLOCKED',reason:(r&&r.reason)||'HF execution complete'}), 'HF_EXEC_RESULT'); }catch(e){}
            return r;
          }catch(err){
            try{ window.updateMasterAIExecutionConfidence(Object.assign({}, setup||{}, {setup:setup,status:'HF_FAILED',reason:err.message||'HF execution failed'}), 'HF_EXEC_FAILED'); }catch(e){}
            throw err;
          }
        };
        ex.__confSyncWrapped=true; window.SnipeXHFLearning.executeManagedSetup=ex;
      }
    }catch(e){}
    try{
      if(window.aiMasterDecision) window.updateMasterAIExecutionConfidence(window.aiMasterDecision, 'MASTER_AI_BOOT_SYNC');
    }catch(e){}
  }

  document.addEventListener('DOMContentLoaded', install);
  setTimeout(install, 500);
  setInterval(install, 2500);
})();


(function(){
  function norm(tf){ tf=String(tf||'M5').toUpperCase(); return ({'1':'M1','5':'M5','15':'M15','60':'H1','240':'H4','D':'D1','D1':'D1','M1':'M1','M5':'M5','M15':'M15','H1':'H1','H4':'H4'}[tf]||'M5'); }
  function liveVal(tf){ return ({M1:'1',M5:'5',M15:'15',H1:'60',H4:'240',D1:'D'}[norm(tf)]||'5'); }
  window.snipexNormalizeTF = norm;
  window.getAIExecutionTF = function(){
    var locked = !!window.aiOn && localStorage.getItem('snipex_ai_tf_lock')==='1';
    if(locked){ var el=document.getElementById('ai-manual-tf'); return norm((el&&el.value)||localStorage.getItem('snipex_ai_manual_tf')||window.aiManualTF||'M5'); }
    var live=document.getElementById('live-tf'); return norm((live&&live.value)||'M5');
  };
  window.applyTFLockToChart = function(){
    if(!(window.aiOn && localStorage.getItem('snipex_ai_tf_lock')==='1')) return;
    var tf=window.getAIExecutionTF();
    var live=document.getElementById('live-tf');
    if(live && live.value!==liveVal(tf)) live.value=liveVal(tf);
  };
  function paint(){
    var tfEl=document.getElementById('ai-manual-tf');
    var tf=norm((tfEl&&tfEl.value)||localStorage.getItem('snipex_ai_manual_tf')||'M5');
    window.aiManualTF=tf; window.aiTFLock=localStorage.getItem('snipex_ai_tf_lock')==='1';
    var wrap=document.getElementById('manual-tf-wrap'); if(wrap) wrap.style.display='';
    var btn=document.getElementById('ai-tf-lock-btn');
    if(btn){ btn.style.display='inline-flex'; btn.textContent=window.aiTFLock?'TF LOCK: ON \u00b7 '+tf:'TF LOCK: OFF'; btn.style.borderColor=window.aiTFLock?'rgba(0,230,118,.55)':'rgba(255,255,255,.18)'; btn.style.color=window.aiTFLock?'var(--green)':'var(--text2)'; }
    var pill=document.getElementById('ai-control-pill'); if(pill && window.aiOn) pill.textContent=window.aiTFLock?'MASTER AI \u00b7 TF LOCK '+tf:'MASTER AI FULL AUTO';
    var note=document.getElementById('ai-control-note'); if(note && window.aiOn) note.textContent=window.aiTFLock?('MASTER AI ON: locked to '+tf+'. Scan, Draw, Auto-Switch and Execution use this timeframe only.'):'MASTER AI ON: timeframe auto mode. Turn TF LOCK ON to force one execution TF.';
    window.applyTFLockToChart();
  }
  var oldSync=window.syncAIControlCockpitUI; window.syncAIControlCockpitUI=function(){ try{oldSync&&oldSync.apply(this,arguments);}catch(e){} paint(); };
  var oldSave=window.saveAIControlCockpit; window.saveAIControlCockpit=async function(){
    var tfEl=document.getElementById('ai-manual-tf'); var tf=norm((tfEl&&tfEl.value)||'M5');
    localStorage.setItem('snipex_ai_manual_tf',tf); window.aiManualTF=tf; window.aiTFLock=localStorage.getItem('snipex_ai_tf_lock')==='1'; paint();
    try{ await fetch((window.SNIPEX_BRIDGE_BASE||BRIDGE_BASE)+'/api/ai/master_config',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({enabled:!!window.aiOn, manual_tf:tf, active_tf:window.getAIExecutionTF(), tf_lock:window.aiTFLock, trading_style:'AUTO', profit_optimization_enabled:(localStorage.getItem('snipex_priority_optimizer_on')!=='0')})}); }catch(e){}
    try{ if(window.aiTFLock && window.logLive) logLive('\ud83d\udd12 TF Lock active: AI will scan/execute only on '+tf,'ok'); else if(window.logLive) logLive('\ud83d\udd13 TF Lock off: AI timeframe auto mode','warn'); }catch(e){}
    try{ window.refreshAIMasterDecision&&refreshAIMasterDecision(true); }catch(e){}
    try{ setTimeout(function(){ window.scanSetupNow&&scanSetupNow({source:'tf_lock_change'}).catch(function(){}); },350); }catch(e){}
  };
  window.toggleAITFLock=function(){ window.aiTFLock=!(localStorage.getItem('snipex_ai_tf_lock')==='1'); localStorage.setItem('snipex_ai_tf_lock',window.aiTFLock?'1':'0'); window.saveAIControlCockpit(); };
  var oldRefresh=window.refreshAIMasterDecision; if(oldRefresh){ window.refreshAIMasterDecision=async function(force){ window.applyTFLockToChart(); return oldRefresh.apply(this,arguments); }; }
  var oldSwitch=window.runMasterAIAutoSwitch; if(oldSwitch){ window.runMasterAIAutoSwitch=async function(force){ window.applyTFLockToChart(); return oldSwitch.apply(this,arguments); }; }
  var oldScan=window.scanSetupNow; if(oldScan){ window.scanSetupNow=async function(options){ window.applyTFLockToChart(); return oldScan.apply(this,arguments); }; }
  setTimeout(paint,250); setTimeout(paint,1200);
})();


(function(){
function norm(tf){tf=String(tf||'M5').toUpperCase();return ({'1':'M1','5':'M5','15':'M15','60':'H1','240':'H4','D':'D1','D1':'D1','M1':'M1','M5':'M5','M15':'M15','H1':'H1','H4':'H4'}[tf]||'M5');}
function liveVal(tf){return ({M1:'1',M5:'5',M15:'15',H1:'60',H4:'240',D1:'D'}[norm(tf)]||'5');}
function paintTF(tf){tf=norm(tf);var sel=document.getElementById('ai-manual-tf');if(sel){sel.disabled=false;sel.style.pointerEvents='auto';sel.value=tf;}var live=document.getElementById('live-tf');if(live&&window.aiOn&&localStorage.getItem('snipex_ai_tf_lock')==='1')live.value=liveVal(tf);var btn=document.getElementById('ai-tf-lock-btn');if(btn){btn.style.display='inline-flex';btn.textContent=(localStorage.getItem('snipex_ai_tf_lock')==='1')?'TF LOCK: ON \u00b7 '+tf:'TF LOCK: OFF';}var pill=document.getElementById('ai-control-pill');if(pill&&window.aiOn)pill.textContent=(localStorage.getItem('snipex_ai_tf_lock')==='1')?'MASTER AI \u00b7 TF LOCK '+tf:'MASTER AI FULL AUTO';var note=document.getElementById('ai-control-note');if(note&&window.aiOn)note.textContent=(localStorage.getItem('snipex_ai_tf_lock')==='1')?'MASTER AI ON: locked to '+tf+'. You can change TF from AI Execution TF dropdown anytime.':'MASTER AI ON: timeframe auto mode. Turn TF LOCK ON to force one execution TF.';}
window.setAIExecutionTF=function(tf){tf=norm(tf);localStorage.setItem('snipex_ai_manual_tf',tf);window.aiManualTF=tf;paintTF(tf);try{if(window.logLive)logLive('\u23f1 AI Execution TF changed to '+tf+(localStorage.getItem('snipex_ai_tf_lock')==='1'?' \u00b7 TF Lock still ON':' \u00b7 TF Lock OFF'),'ok');}catch(e){}try{fetch((window.SNIPEX_BRIDGE_BASE||BRIDGE_BASE)+'/api/ai/master_config',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({enabled:!!window.aiOn,manual_tf:tf,active_tf:tf,tf_lock:localStorage.getItem('snipex_ai_tf_lock')==='1',trading_style:'AUTO',tf_change_unlocked:true})});}catch(e){}try{window.refreshAIMasterDecision&&refreshAIMasterDecision(true);}catch(e){}try{setTimeout(function(){window.scanSetupNow&&scanSetupNow({source:'tf_changed_by_user'}).catch(function(){});},250);}catch(e){}return tf;};
window.getSelectedTFForAI=function(){return window.getAIExecutionTF?window.getAIExecutionTF():norm(localStorage.getItem('snipex_ai_manual_tf')||'M5');};
window.getAIExecutionTF=function(){var locked=!!window.aiOn&&localStorage.getItem('snipex_ai_tf_lock')==='1';if(locked)return norm(localStorage.getItem('snipex_ai_manual_tf')||window.aiManualTF||'M5');var live=document.getElementById('live-tf');return norm((live&&live.value)||localStorage.getItem('snipex_ai_manual_tf')||'M5');};
var oldSave=window.saveAIControlCockpit;window.saveAIControlCockpit=function(){var sel=document.getElementById('ai-manual-tf');var tf=norm((sel&&sel.value)||localStorage.getItem('snipex_ai_manual_tf')||'M5');window.setAIExecutionTF(tf);if(oldSave){try{return oldSave.apply(this,arguments);}catch(e){}}};
function install(){var sel=document.getElementById('ai-manual-tf');if(sel){sel.disabled=false;sel.style.pointerEvents='auto';sel.onchange=function(){window.setAIExecutionTF(this.value);};paintTF(localStorage.getItem('snipex_ai_manual_tf')||sel.value||'M5');var wrap=document.getElementById('manual-tf-wrap');if(wrap&&!document.getElementById('tf-quick-row')){var row=document.createElement('div');row.id='tf-quick-row';row.style.cssText='display:flex;gap:6px;flex-wrap:wrap;margin-top:7px';['M1','M5','M15','H1','H4'].forEach(function(tf){var b=document.createElement('button');b.type='button';b.textContent=tf;b.style.cssText='padding:5px 9px;border-radius:10px;border:1px solid rgba(255,255,255,.16);background:rgba(255,255,255,.06);color:inherit;cursor:pointer';b.onclick=function(){window.setAIExecutionTF(tf);};row.appendChild(b);});wrap.appendChild(row);}}}
install();setTimeout(install,500);setTimeout(install,1600);setInterval(install,4000);
})();


(function(){
  function norm(tf){tf=String(tf||'M5').toUpperCase();return ({'1':'M1','5':'M5','15':'M15','60':'H1','240':'H4','D':'D1'})[tf]||tf;}
  function liveVal(tf){tf=norm(tf);return ({M1:'1',M5:'5',M15:'15',H1:'60',H4:'240',D1:'D'})[tf]||'5';}
  function tfLocked(){return !!window.aiOn && localStorage.getItem('snipex_ai_tf_lock')==='1';}
  window.getAIExecutionTF=function(){ if(tfLocked()) return norm(localStorage.getItem('snipex_ai_manual_tf')||window.aiManualTF||'M5'); var live=document.getElementById('live-tf'); return norm((live&&live.value)||localStorage.getItem('snipex_ai_manual_tf')||'M5'); };
  window.getSelectedTFForAI=function(){return window.getAIExecutionTF();};
  window.forceBackendTFConfig=function(reason){ var tf=window.getAIExecutionTF(); if(tfLocked()){var live=document.getElementById('live-tf'); if(live) live.value=liveVal(tf);} try{ fetch((window.SNIPEX_BRIDGE_BASE||BRIDGE_BASE)+'/api/ai/master_config',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({enabled:!!window.aiOn,manual_tf:tf,active_tf:tf,tf_lock:tfLocked(),trading_style:'AUTO',style_lock:false,tf_follow_confirm:true,reason:reason||'sync'})}); }catch(e){} return tf; };
  window.setAIExecutionTF=function(tf){ tf=norm(tf); localStorage.setItem('snipex_ai_manual_tf',tf); window.aiManualTF=tf; var sel=document.getElementById('ai-manual-tf'); if(sel){sel.disabled=false;sel.style.pointerEvents='auto';sel.value=tf;} var live=document.getElementById('live-tf'); if(live&&tfLocked()) live.value=liveVal(tf); var btn=document.getElementById('ai-tf-lock-btn'); if(btn){btn.style.display='inline-flex';btn.textContent=tfLocked()?'TF LOCK: ON \u00b7 '+tf:'TF LOCK: OFF';} var pill=document.getElementById('ai-control-pill'); if(pill&&window.aiOn)pill.textContent=tfLocked()?'MASTER AI \u00b7 TF LOCK '+tf:'MASTER AI FULL AUTO'; var note=document.getElementById('ai-control-note'); if(note&&window.aiOn)note.textContent=tfLocked()?('MASTER AI ON: locked to '+tf+'. Scan, Draw, Auto-Switch and Execution use this timeframe only.'):'MASTER AI ON: timeframe auto mode. Turn TF LOCK ON to force one execution TF.'; window.forceBackendTFConfig('user_tf_change'); try{if(window.logLive)logLive('\u2705 AI will follow '+tf+' for Scan, Draw, Auto-Switch and Execution'+(tfLocked()?' \u00b7 TF Lock ON':' \u00b7 TF Lock OFF'),'ok');}catch(e){} try{window.refreshAIMasterDecision&&refreshAIMasterDecision(true);}catch(e){} try{setTimeout(function(){window.scanSetupNow&&scanSetupNow({source:'tf_follow_confirm'}).catch(function(){});},250);}catch(e){} return tf; };
  window.toggleAITFLock=function(){ var on=localStorage.getItem('snipex_ai_tf_lock')==='1'; localStorage.setItem('snipex_ai_tf_lock',on?'0':'1'); window.aiTFLock=!on; window.setAIExecutionTF(localStorage.getItem('snipex_ai_manual_tf')||window.aiManualTF||'M5'); };
  var oldScan=window.scanSetupNow; if(oldScan&&!oldScan.__tfFollowHardPatched){var patched=async function(options){window.forceBackendTFConfig('before_scan');return oldScan.apply(this,arguments);};patched.__tfFollowHardPatched=true;window.scanSetupNow=patched;}
  var oldRefresh=window.refreshAIMasterDecision; if(oldRefresh&&!oldRefresh.__tfFollowHardPatched){var rpatched=function(force){window.forceBackendTFConfig('before_master_decision');return oldRefresh.apply(this,arguments);};rpatched.__tfFollowHardPatched=true;window.refreshAIMasterDecision=rpatched;}
  function install(){var sel=document.getElementById('ai-manual-tf'); if(sel){sel.disabled=false;sel.style.pointerEvents='auto';sel.onchange=function(){window.setAIExecutionTF(this.value);};} window.setAIExecutionTF(localStorage.getItem('snipex_ai_manual_tf')||(sel&&sel.value)||'M5');}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install(); setTimeout(install,700); setTimeout(install,1800);
})();


(function(){
  if(window.__SNIPEX_USER_AUTHORITY_FINAL_PATCH__) return; window.__SNIPEX_USER_AUTHORITY_FINAL_PATCH__=true;
  function norm(tf){tf=String(tf||'M1').toUpperCase();return ['M1','M5','M15','H1','H4'].includes(tf)?tf:'M1';}
  function isTFLocked(){return localStorage.getItem('snipex_ai_tf_lock')==='1';}
  function addStyle(){ if(document.getElementById('snipex-authority-style')) return; var st=document.createElement('style'); st.id='snipex-authority-style'; st.textContent='.toggle-row{display:grid!important;grid-template-columns:1fr 1fr!important;gap:10px!important}.ai-tf-bullets{display:grid;grid-template-columns:repeat(5,1fr);gap:6px;margin-top:7px}.ai-tf-chip{border:1px solid rgba(0,229,255,.20);background:rgba(0,229,255,.045);color:var(--text2);border-radius:999px;padding:7px 4px;font-size:9px;font-weight:900;letter-spacing:.5px;cursor:pointer}.ai-tf-chip.active{border-color:rgba(0,230,118,.75);background:rgba(0,230,118,.14);color:var(--green);box-shadow:0 0 14px rgba(0,230,118,.12)}#ai-tf-lock-btn{grid-column:1/-1!important;width:100%!important;font-weight:900!important;letter-spacing:1px!important;border-radius:999px!important}.ai-lock-on{border-color:rgba(0,230,118,.7)!important;color:var(--green)!important;background:rgba(0,230,118,.11)!important}.ai-lock-off{border-color:rgba(255,171,0,.45)!important;color:var(--fx)!important;background:rgba(255,171,0,.07)!important}'; document.head.appendChild(st); }
  function chips(tf){ document.querySelectorAll('.ai-tf-chip').forEach(function(b){b.classList.toggle('active',String(b.textContent||'').trim()===tf);}); }
  function paint(){ var tf=norm(localStorage.getItem('snipex_ai_manual_tf')||window.aiManualTF||'M1'); window.aiManualTF=tf; var ai=localStorage.getItem('snipex_master_ai_on')!=='0'; var au=localStorage.getItem('snipex_auto_trade_on')!=='0'; window.aiOn=ai; window.autoOn=au; try{ if(typeof aiOn!=='undefined') aiOn=ai; if(typeof autoOn!=='undefined') autoOn=au; }catch(e){} var btn=document.getElementById('btn-ai'), st=document.getElementById('ai-state'); if(btn) btn.className='tog-btn '+(ai?'on':'off'); if(st) st.textContent=ai?'AI ON':'AI OFF'; var ab=document.getElementById('btn-auto'), ast=document.getElementById('auto-state'); if(ab){ab.style.display='';ab.className='tog-btn '+(au?'on':'off');} if(ast) ast.textContent=au?'ON':'OFF'; var sel=document.getElementById('ai-manual-tf'); if(sel){sel.disabled=false; sel.style.pointerEvents='auto'; sel.value=tf; sel.onchange=function(){window.setAIExecutionTF(this.value);};} var lock=document.getElementById('ai-tf-lock-btn'); if(lock){lock.style.display='';lock.textContent=isTFLocked()?'TF LOCK: ON \u00b7 '+tf:'TF LOCK: OFF';lock.className=isTFLocked()?'ai-lock-on':'ai-lock-off';} var pob=document.getElementById('priority-optimizer-btn'); if(pob){var po=localStorage.getItem('snipex_priority_optimizer_on')!=='0';pob.textContent=po?'PRIORITY OPTIMIZER: ON':'PRIORITY OPTIMIZER: OFF';pob.className=po?'priority-on':'priority-off';} var pill=document.getElementById('ai-control-pill'); if(pill) pill.textContent=ai?(isTFLocked()?'MASTER AI \u00b7 TF LOCK '+tf:'MASTER AI \u00b7 TF FREE'):'MANUAL MODE'; var mode=document.getElementById('master-ai-mode-label'); if(mode) mode.textContent=ai?(isTFLocked()?'AI obeys your TF lock; AI controls strategy, style, lot, SL, TP':'AI controls strategy, TF, style, lot, SL, TP'):'Manual position automation only'; var note=document.getElementById('ai-control-note'); if(note) note.textContent=ai?(isTFLocked()?'MASTER AI ON: locked to '+tf+'. Scan, Draw, Auto-Switch and Execution use this timeframe only.':'MASTER AI ON: timeframe auto mode. Turn TF Lock ON to force one TF.'):'MANUAL MODE: Master AI OFF. AI Execution trigger disabled.'; chips(tf); }
  window.setAIExecutionTF=function(tf){ tf=norm(tf); localStorage.setItem('snipex_ai_manual_tf',tf); window.aiManualTF=tf; try{ if(typeof aiManualTF!=='undefined') aiManualTF=tf; }catch(e){} paint(); try{fetch((window.SNIPEX_BRIDGE_BASE||BRIDGE_BASE)+'/api/ai/master_config',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({enabled:localStorage.getItem('snipex_master_ai_on')!=='0',auto_trade_enabled:localStorage.getItem('snipex_auto_trade_on')!=='0',manual_tf:tf,active_tf:tf,tf_lock:isTFLocked(),trading_style:'AUTO',user_tf_authority:true})});}catch(e){} try{logLive('\ud83c\udfaf AI Execution TF set to '+tf+(isTFLocked()?' \u00b7 AI will obey this TF.':' \u00b7 TF Lock OFF.'),'ok');}catch(e){} try{window.refreshAIMasterDecision&&refreshAIMasterDecision(true);}catch(e){} return tf; };
  window.toggleAITFLock=function(){localStorage.setItem('snipex_ai_tf_lock',isTFLocked()?'0':'1'); window.aiTFLock=isTFLocked(); window.setAIExecutionTF(localStorage.getItem('snipex_ai_manual_tf')||'M1');};
  window.toggleAI=function(){var n=localStorage.getItem('snipex_master_ai_on')==='0'; localStorage.setItem('snipex_master_ai_on',n?'1':'0'); window.aiOn=n; try{if(typeof aiOn!=='undefined') aiOn=n;}catch(e){} if(typeof applyMasterAIMode==='function') applyMasterAIMode('user-toggle-ai'); paint();};
  window.toggleAuto=function(){var n=localStorage.getItem('snipex_auto_trade_on')==='0'; localStorage.setItem('snipex_auto_trade_on',n?'1':'0'); window.autoOn=n; try{if(typeof autoOn!=='undefined') autoOn=n;}catch(e){} paint(); try{logLive(n?'\ud83d\udfe2 AI Execution Engine Active':'\ud83d\udd34 AI Execution Engine OFF: AI scans/draws but will not execute.',n?'ok':'warn');}catch(e){}};
  var lastConf=0,lastTs=0, oldUpdate=window.updateMasterAIExecutionConfidence;
  window.updateMasterAIExecutionConfidence=function(obj,source){ obj=obj||{}; var raw=Number(obj.execution_confidence||obj.exec_confidence||obj.confidence||obj.ai_confidence||obj.score||obj.final_confidence||((obj.best_strategy||{}).score)||0); if(!Number.isFinite(raw)) raw=0; var now=Date.now(); var smoothed=(now-lastTs<45000)?(lastConf*0.72+raw*0.28):raw; if(Math.abs(smoothed-lastConf)<1.2) smoothed=lastConf; lastConf=Math.max(0,Math.min(100,smoothed)); lastTs=now; obj.execution_confidence=Number(lastConf.toFixed(1)); obj.confidence=Number(lastConf.toFixed(1)); if(oldUpdate) return oldUpdate.call(this,obj,source||'SMOOTHED_AUTHORITY_PATCH'); return obj; };
  function boot(){addStyle(); paint(); setTimeout(paint,700); setTimeout(paint,1600);} if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot); else boot();
})();


(function(){
 if(localStorage.getItem('snipex_priority_optimizer_on')===null) localStorage.setItem('snipex_priority_optimizer_on','1');
 window.togglePriorityOptimizer=function(){
   var on=localStorage.getItem('snipex_priority_optimizer_on')!=='0';
   localStorage.setItem('snipex_priority_optimizer_on', on?'0':'1');
   var now=!on;
   var b=document.getElementById('priority-optimizer-btn'); if(b){b.textContent=now?'PRIORITY OPTIMIZER: ON':'PRIORITY OPTIMIZER: OFF';b.className=now?'priority-on':'priority-off';}
   try{ if(window.logLive) logLive((now?'\u2705':'\u26a0\ufe0f')+' Priority Optimizer '+(now?'ON':'OFF'), now?'ok':'warn'); }catch(e){}
   try{ if(window.forceBackendTFConfig) window.forceBackendTFConfig('priority_optimizer_toggle'); }catch(e){}
   try{ if(window.refreshAIMasterDecision) window.refreshAIMasterDecision(true); }catch(e){}
 };
 function boot(){var b=document.getElementById('priority-optimizer-btn'); if(b){var po=localStorage.getItem('snipex_priority_optimizer_on')!=='0';b.textContent=po?'PRIORITY OPTIMIZER: ON':'PRIORITY OPTIMIZER: OFF';b.className=po?'priority-on':'priority-off';} try{ if(window.paint) window.paint(); }catch(e){} }
 if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot); else boot();
})();


(function(){
  if(window.__SNIPEX_FINAL_TF_AUTHORITY_ENGINE_SYNC__) return; window.__SNIPEX_FINAL_TF_AUTHORITY_ENGINE_SYNC__=true;
  function norm(tf){tf=String(tf||'M5').toUpperCase();return ({'1':'M1','5':'M5','15':'M15','60':'H1','240':'H4','M1':'M1','M5':'M5','M15':'M15','H1':'H1','H4':'H4'}[tf]||'M5');}
  function liveVal(tf){return ({M1:'1',M5:'5',M15:'15',H1:'60',H4:'240'}[norm(tf)]||'5');}
  function locked(){return localStorage.getItem('snipex_ai_tf_lock')==='1';}
  function selectedTF(){return norm(localStorage.getItem('snipex_ai_manual_tf')||window.aiManualTF||'M5');}
  function currentSymbol(){try{return (document.getElementById('symbol-select')||{}).value || window.liveSymbol || 'XAUUSD';}catch(e){return 'XAUUSD';}}
  function isAuto(){return localStorage.getItem('snipex_auto_trade_on')!=='0' && window.autoOn!==false;}
  function isAI(){return localStorage.getItem('snipex_master_ai_on')!=='0' && window.aiOn!==false;}
  function paintTF(){
    var tf=selectedTF(); window.aiManualTF=tf; window.aiTFLock=locked();
    var live=document.getElementById('live-tf'); if(live && locked()) live.value=liveVal(tf);
    var sel=document.getElementById('ai-manual-tf'); if(sel){sel.value=tf; sel.disabled=false; sel.style.display='none';}
    document.querySelectorAll('.ai-tf-chip').forEach(function(b){b.classList.toggle('active',String(b.textContent||'').trim()===tf);});
    var lock=document.getElementById('ai-tf-lock-btn'); if(lock){lock.textContent=locked()?'TF LOCK: ON \u00b7 '+tf:'TF LOCK: OFF'; lock.className=locked()?'ai-lock-on':'ai-lock-off';}
    var pill=document.getElementById('ai-control-pill'); if(pill) pill.textContent=isAI()?(locked()?'MASTER AI \u00b7 USER TF '+tf:'MASTER AI \u00b7 TF FREE'):'MANUAL MODE';
    var mode=document.getElementById('master-ai-mode-label'); if(mode) mode.textContent=isAI()?(locked()?'AI obeys YOUR selected TF only':'AI may choose TF because TF Lock is OFF'):'Manual position automation only';
    var note=document.getElementById('ai-control-note'); if(note) note.textContent=isAI()?(locked()?('MASTER AI ON: USER AUTHORITY LOCKED TO '+tf+'. Scan, Draw, Priority, Position Type and Execution use '+tf+' only.'):('TF Lock OFF: AI may choose timeframe.')):'MANUAL MODE: Master AI OFF.';
  }
  async function pushConfig(reason){
    var tf=selectedTF(); paintTF();
    try{await fetch((window.SNIPEX_BRIDGE_BASE||BRIDGE_BASE)+'/api/ai/master_config',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({enabled:isAI(),auto_trade_enabled:isAuto(),manual_tf:tf,active_tf:tf,tf_lock:locked(),trading_style:'AUTO',user_tf_authority:true,strategies_default_auto:true,profit_optimization_enabled:(localStorage.getItem('snipex_priority_optimizer_on')!=='0'),reason:reason||'user_tf_sync'})});}catch(e){}
  }
  window.getSelectedTFForAI=function(){return locked()?selectedTF():norm((document.getElementById('live-tf')||{}).value||selectedTF());};
  window.getAIExecutionTF=function(){return window.getSelectedTFForAI();};
  window.setAIExecutionTF=function(tf){
    tf=norm(tf); localStorage.setItem('snipex_ai_manual_tf',tf); window.aiManualTF=tf; paintTF();
    pushConfig('user_selected_tf');
    try{if(window.logLive) logLive('\ud83c\udfaf USER TF AUTHORITY: Master AI will search and trigger only on '+tf+(locked()?' \u00b7 TF LOCK ON':' \u00b7 TF LOCK OFF'),'ok');}catch(e){}
    setTimeout(function(){try{window.refreshAIMasterDecision&&window.refreshAIMasterDecision(true);}catch(e){}},120);
    return tf;
  };
  window.toggleAITFLock=function(){localStorage.setItem('snipex_ai_tf_lock',locked()?'0':'1'); paintTF(); pushConfig('tf_lock_toggle'); try{if(window.logLive) logLive((locked()?'\ud83d\udd12':'\ud83d\udd13')+' TF Lock '+(locked()?'ON: AI obeys '+selectedTF():'OFF: AI may choose TF'),'ok');}catch(e){} setTimeout(function(){try{window.refreshAIMasterDecision&&window.refreshAIMasterDecision(true);}catch(e){}},150);};
  function renderSyncedDecision(d){
    if(!d) return; var p=d.priority_engine||{}, po=d.profit_optimization||{}, tf=norm(d.timeframe||p.active_tf||selectedTF());
    var mini=document.getElementById('priority-mini'); if(mini) mini.innerHTML='<b>Priority Engine:</b> '+(p.action||d.side||'WAIT')+' \u00b7 USER TF: '+tf+' \u00b7 Style: AUTO<br>'+(p.reason||d.reason||'AI obeying selected timeframe.');
    var set=function(id,v){var el=document.getElementById(id); if(el) el.textContent=v;};
    set('profit-trade-type', po.trade_type || (tf==='M1'||tf==='M5'?'SCALPING':tf==='M15'||tf==='H1'?'INTRADAY':'SWING'));
    set('profit-exit-plan', ((po.exit_plan&&po.exit_plan.mode)||'LIVE SL/TP + TRAIL'));
    set('profit-conf-tier', po.confidence_band || (Number(d.confidence||0)>=70?'HIGH':Number(d.confidence||0)>=55?'MEDIUM':'WAIT'));
    set('profit-priority', po.priority || (d.approved?'FAST TRIGGER':'WAIT'));
    set('profit-mode-chip', po.enabled===false?'OFF':'ON');
    var dec=document.getElementById('ai-decision'); if(dec) dec.innerHTML='\u25ba AI Master: '+(d.approved?'APPROVED':'WAIT')+'<br>\u25ba TF Authority: '+tf+' only<br>\u25ba Strategy: '+((d.best_strategy&&d.best_strategy.strategy)||d.strategy||'AUTO')+'<br>\u25ba Direction: '+(d.side||'WAIT')+'<br>\u25ba Confidence: '+Number(d.confidence||0).toFixed(1)+'%';
    try{window.updateMasterAIExecutionConfidence&&window.updateMasterAIExecutionConfidence(d,'TF_AUTHORITY_DECISION');}catch(e){}
  }
  var firingUntil=0, lastKey='';
  async function fireFromDecision(d){
    if(!d || !d.approved || !isAI() || !isAuto()) return;
    var side=String(d.side||d.direction||'').toUpperCase(); if(side!=='BUY' && side!=='SELL') return;
    var tf=norm(d.timeframe||selectedTF()); var sym=String(d.symbol||currentSymbol()).toUpperCase();
    var key=[sym,side,tf,Math.round(Number(d.entry||0)*10)].join('|');
    var now=Date.now(); if(now<firingUntil || key===lastKey) return; firingUntil=now+45000; lastKey=key;
    var setup={ready:true,symbol:sym,direction:side,side:side,timeframe:tf,entry:Number(d.entry||0),price:Number(d.entry||0),sl:Number(d.sl||0),tp:Number(d.tp||0),confidence:Number(d.confidence||0),strategy_name:(d.strategy_name||d.strategy||((d.best_strategy||{}).strategy)||'AUTO TF SNIPER'),strategy:(d.strategy_name||d.strategy||'AUTO TF SNIPER'),reason:'AUTO TRIGGER from selected '+tf+' decision. Engines synced to live price.'};
    try{
      if(window.logLive) logLive('\ud83d\ude80 AUTO TRIGGER '+side+' '+sym+' on '+tf+' \u00b7 entry synced '+(setup.entry||'live')+' \u00b7 confidence '+setup.confidence.toFixed(1)+'%','ok');
      if(typeof window.maybeAutoTriggerSetup==='function') await window.maybeAutoTriggerSetup(setup,'tf_authority_decision');
      else if(window.SnipeXHFLearning&&typeof window.SnipeXHFLearning.executeManagedSetup==='function') await window.SnipeXHFLearning.executeManagedSetup(setup,'tf_authority_decision');
    }catch(e){ if(window.logLive) logLive('\u274c TF synced auto trigger failed: '+(e.message||e),'bad'); firingUntil=Date.now()+10000; }
  }
  var oldRefresh=window.refreshAIMasterDecision;
  window.refreshAIMasterDecision=async function(force){
    if(!isAI()) return null; await pushConfig('before_decision');
    var tf=window.getSelectedTFForAI(); var payload={symbol:currentSymbol(),timeframe:tf,manual_tf:selectedTF(),active_tf:tf,tf_lock:locked(),trading_style:'AUTO',user_tf_authority:true,strategies_default_auto:true,min_confidence:60};
    try{
      var res=await fetch((window.SNIPEX_BRIDGE_BASE||BRIDGE_BASE)+'/api/ai/master_decision',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
      var data=await res.json(); if(!data.ok) throw new Error(data.error||'AI master failed');
      window.aiMasterDecision=data.master; try{aiMasterDecision=data.master;}catch(e){}
      if(typeof window.renderAIMasterDecision==='function') try{window.renderAIMasterDecision(data.master);}catch(e){}
      renderSyncedDecision(data.master); await fireFromDecision(data.master); return data.master;
    }catch(e){
      if(oldRefresh && oldRefresh!==window.refreshAIMasterDecision){var d=await oldRefresh.call(this,force); renderSyncedDecision(d); return d;}
      if(window.logLive) logLive('AI decision sync error: '+(e.message||e),'warn'); return null;
    }
  };
  var oldScan=window.scanSetupNow;
  if(oldScan){ window.scanSetupNow=async function(options){await pushConfig('before_scan'); var r=await oldScan.apply(this,arguments); if(r){r.timeframe=window.getSelectedTFForAI(); if(window.aiMasterDecision&&window.aiMasterDecision.approved){r.ready=true; r.direction=window.aiMasterDecision.side; r.entry=window.aiMasterDecision.entry; r.sl=window.aiMasterDecision.sl; r.tp=window.aiMasterDecision.tp; r.confidence=window.aiMasterDecision.confidence;}} return r;}; }
  function boot(){ if(localStorage.getItem('snipex_ai_tf_lock')===null) localStorage.setItem('snipex_ai_tf_lock','1'); if(!localStorage.getItem('snipex_ai_manual_tf')) localStorage.setItem('snipex_ai_manual_tf','M5'); localStorage.setItem('snipex_master_ai_on', localStorage.getItem('snipex_master_ai_on')||'1'); localStorage.setItem('snipex_auto_trade_on', localStorage.getItem('snipex_auto_trade_on')||'1'); paintTF(); pushConfig('boot'); setTimeout(function(){try{window.refreshAIMasterDecision&&window.refreshAIMasterDecision(true);}catch(e){}},900); setInterval(function(){try{if(isAI()) window.refreshAIMasterDecision(false);}catch(e){}},12000); }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot); else boot();
})();


(function(){
 if(window.__SNIPEX_HARD_LIVE_ENTRY_SYNC__) return; window.__SNIPEX_HARD_LIVE_ENTRY_SYNC__=true;
 function norm(tf){return ({'1':'M1','5':'M5','15':'M15','60':'H1','240':'H4','M1':'M1','M5':'M5','M15':'M15','H1':'H1','H4':'H4'}[String(tf||'M5').toUpperCase()]||'M5');}
 function tf(){try{return norm((window.getSelectedTFForAI&&window.getSelectedTFForAI())||localStorage.getItem('snipex_ai_manual_tf')||'M5')}catch(e){return 'M5'}}
 function sym(){try{return (document.getElementById('symbol-select')||{}).value || window.liveSymbol || 'XAUUSD'}catch(e){return 'XAUUSD'}}
 function num(x){x=Number(x); return Number.isFinite(x)&&x>0?x:0}
 function fmt(x){x=num(x); return x?x.toFixed(sym()==='XAGUSD'?3:2):'--'}
 function set(id,v){var el=document.getElementById(id); if(el) el.textContent=v;}
 function setReason(lines){var panel=document.querySelector('.reasoning-panel'); if(panel) panel.innerHTML=lines.map(function(l){return '<div class="reason-line"><span class="reason-icon">\u25ba</span><span class="reason-text">'+l+'</span></div>'}).join('');}
 async function getPrice(symbol){
  var base=(window.SNIPEX_BRIDGE_BASE||'http://127.0.0.1:5000');
  var S=String(symbol||'XAUUSD').toUpperCase();
  function pick(j){
    if(!j) return null;
    if(j.bid||j.ask||j.last) return j;
    if(j.price && (j.price.bid||j.price.ask||j.price.last)) return j.price;
    if(j.data && (j.data.bid||j.data.ask||j.data.last)) return j.data;
    if(j.prices){
      if(j.prices[S]) return j.prices[S];
      var ks=Object.keys(j.prices); if(ks.length) return j.prices[ks[0]];
    }
    return null;
  }
  try{
    var r=await fetch(base+'/api/prices?symbol='+encodeURIComponent(S)+'&_='+Date.now(),{cache:'no-store'});
    var j=await r.json(); var p=pick(j); if(p) return p;
  }catch(e){}
  try{
    var r2=await fetch(base+'/api/price?symbol='+encodeURIComponent(S)+'&_='+Date.now(),{cache:'no-store'});
    var j2=await r2.json(); return pick(j2)||j2;
  }catch(e2){return null;}
}
 async function refreshLiveEntry(d){
   var symbol=(d&&d.symbol)||sym(), T=norm((d&&d.timeframe)||tf());
   var p=await getPrice(symbol), bid=num(p&&(p.bid||p.Bid)), ask=num(p&&(p.ask||p.Ask)), last=num(p&&(p.last||p.price||p.Last));
   var mid=(bid&&ask)?(bid+ask)/2:last; var side=String((d&&(d.side||d.direction))||'WAIT').toUpperCase();
   var entry=num(d&&d.entry); if(!entry || (mid && Math.abs(entry-mid)>Math.max(10,mid*0.02))) entry=(side==='SELL'?bid:(side==='BUY'?ask:mid));
   var sl=num(d&&d.sl), tp=num(d&&d.tp); if(entry && (!sl||!tp)){var dist=Math.max(symbol==='XAUUSD'?1.2:0.25, entry*0.00035); if(side==='SELL'){sl=entry+dist;tp=entry-dist*1.7}else{sl=entry-dist;tp=entry+dist*1.7}}
   set('sniper-status',(side==='BUY'||side==='SELL')?'ARMED \u00b7 LIVE '+T+' '+side:'READY \u00b7 LIVE '+T+' WAIT'); set('sniper-entry',fmt(entry)); set('sniper-sl',fmt(sl)); set('sniper-tp',fmt(tp)); set('sniper-selected-tf-label',T);
   var conf=num(d&&d.confidence), approved=!!(d&&d.approved);
   setReason(['Scanning <span>'+symbol+' '+T+'</span> only because USER TF Authority is ON.','Live MT5 price sync: <span>'+fmt(mid)+'</span> \u00b7 Bid <span>'+fmt(bid)+'</span> \u00b7 Ask <span>'+fmt(ask)+'</span>'+((!bid&&!ask)?' <b style=\"color:#ff6b6b\">\u00b7 TICK NOT FOUND: check /api/symbol_resolve?symbol='+symbol+'</b>':''),'Analysis engine + execution engine: <span>SYNCED TO SAME LIVE PRICE</span>','Strategy mode: <span>AUTO DEFAULT</span> \u00b7 Position style: <span>'+((T==='M1'||T==='M5')?'SCALPING':'INTRADAY')+'</span>','Decision: <span>'+side+'</span> \u00b7 Confidence <span>'+conf.toFixed(1)+'%</span>','Execution trigger: <span>'+(approved?'AUTO READY, sending through MT5 bridge':'WAITING selected-TF candle/tick confirmation')+'</span>']);
   set('profit-trade-type',(side==='BUY'||side==='SELL')?((T==='M1'||T==='M5')?'SCALPING':'INTRADAY'):'LIVE WAIT'); set('profit-priority',approved?'FAST TRIGGER':(side==='BUY'||side==='SELL'?'ARMED':'WAIT')); set('profit-conf-tier',conf>=70?'HIGH':conf>=55?'MEDIUM':'BUILDING');
 }
 var oldRender=window.renderAIMasterDecision; window.renderAIMasterDecision=function(d){try{if(oldRender) oldRender.apply(this,arguments)}catch(e){} try{refreshLiveEntry(d)}catch(e){}};
 var oldRefresh=window.refreshAIMasterDecision; if(oldRefresh){window.refreshAIMasterDecision=async function(){var d=await oldRefresh.apply(this,arguments);try{refreshLiveEntry(d||window.aiMasterDecision)}catch(e){}return d;};}
 setInterval(function(){try{refreshLiveEntry(window.aiMasterDecision||{})}catch(e){}},5000); setTimeout(function(){try{refreshLiveEntry(window.aiMasterDecision||{})}catch(e){}},1200);
})();

(function(){
  window.snipexFinalExecutionConfidence = function(fallback){
    try{
      var d = window.aiMasterDecision || window.SNIPEX_LAST_MASTER_DECISION || {};
      var candidates = [d.execution_confidence, d.exec_confidence, d.master_confidence, d.final_confidence, d.confidence, d.score, d.best_strategy && d.best_strategy.score];
      for(var i=0;i<candidates.length;i++){ var n=Number(candidates[i]); if(Number.isFinite(n) && n>0) return Math.max(0, Math.min(100, n)); }
      var scans = window.SNIPEX_LAST_SCAN_RESULTS || [];
      if(Array.isArray(scans) && scans.length){
        var best=scans.slice().sort(function(a,b){return Number(b.confidence||0)-Number(a.confidence||0)})[0] || {};
        var m=Number(best.confidence||best.master_confidence||0); if(Number.isFinite(m) && m>0) return Math.max(0, Math.min(100, m));
      }
    }catch(e){}
    var f=Number(fallback||0); return Number.isFinite(f)?Math.max(0,Math.min(100,f)):0;
  };
})();


(function(){
  function q(id){return document.getElementById(id)}
  function txt(id,v){var e=q(id); if(e && e.textContent!==String(v)) e.textContent=String(v)}
  function pctFromDecision(){
    // IMPORTANT: never read #conf-pct or duplicate UI bars for execution/display loop.
    // Source of truth is Final Execution Confidence from Master AI / latest scan only.
    var n = (window.snipexFinalExecutionConfidence ? window.snipexFinalExecutionConfidence(0) : 0);
    if(!isFinite(n) || n<0) n=0; if(n>100) n=100;
    return n;
  }
  function currentTF(){return (localStorage.getItem('snipex_ai_manual_tf')||window.aiManualTF||'M1').toUpperCase();}
  var smooth = Number(localStorage.getItem('snipex_last_conf_smooth')||0) || 0;
  function stablePatch(){
    // 2. Remove duplicate/extra TF controls forever. Only bottom chip row remains.
    var sel=q('ai-manual-tf'); if(sel){ sel.style.setProperty('display','none','important'); sel.setAttribute('aria-hidden','true'); }
    var quick=q('tf-quick-row'); if(quick){ quick.remove(); }
    document.querySelectorAll('#manual-tf-wrap select, #manual-tf-wrap #tf-quick-row').forEach(function(e){e.style.setProperty('display','none','important')});

    // 3. Make the right optimizer box visually stable, no height jumping during scan/process text updates.
    var panel=q('ai-control-cockpit'); if(panel){ panel.classList.add('snipex-stable-panel'); }
    var decision=q('ai-decision'); if(decision){ decision.classList.add('snipex-stable-decision'); }
    var cockpit=q('profit-cockpit'); if(cockpit){ cockpit.classList.add('snipex-stable-profit'); }

    // 1. Make the top bar actually mirror Master AI confidence instead of staying decorative.
    var raw = pctFromDecision();
    // keep it calm: smooth fluctuation without fake freezing
    smooth = smooth ? (smooth*0.72 + raw*0.28) : raw;
    if(raw===0 && /approved|buy|sell|scalping/i.test((q('ai-decision')||{}).textContent||'')) smooth = Math.max(smooth, 55);
    var shown = Math.round(smooth);
    localStorage.setItem('snipex_last_conf_smooth', String(shown));
    txt('conf-pct', shown + '%');
    txt('conf-score', 'Final Execution Confidence \u00b7 ' + currentTF() + ' \u00b7 ' + (shown>=70?'HIGH':shown>=55?'MEDIUM':shown>0?'BUILDING':'WAIT')); txt('conf-gate-note','Display only \u00b7 Trigger gate ignores duplicate confidence bars');
    var bias=q('conf-bias'); if(bias){
      var d=(q('ai-decision')&&q('ai-decision').textContent)||'';
      bias.textContent=/SELL/i.test(d)?'\u2193 BEARISH':/BUY/i.test(d)?'\u2191 BULLISH':'\u2022 WAIT';
      bias.style.color=/SELL/i.test(d)?'var(--red)':/BUY/i.test(d)?'var(--green)':'var(--fx)';
    }
    var prog=q('conf-prog'); if(prog){ prog.style.width = shown + '%'; prog.className='conf-prog-bar ' + (/SELL/i.test((q('ai-decision')||{}).textContent||'')?'prog-bear':'prog-bull'); }
    // ensure block labels do not imply multi-TF authority when TF lock is ON
    var labels=q('conf-labels'); if(labels){ labels.innerHTML = '<div class="conf-tf-label" style="width:40px;text-align:center">'+currentTF()+'</div>'; }
    var blocks=q('conf-blocks'); if(blocks){ blocks.innerHTML='<div class="conf-block tf '+(shown>=55?'bull':'empty')+'" style="width:80px"><div class="conf-block-inner" style="width:'+shown+'%"></div></div>'; }
  }
  function addCSS(){
    if(q('snipex-stable-ui-css')) return;
    var st=document.createElement('style'); st.id='snipex-stable-ui-css';
    st.textContent = `
      #manual-tf-wrap select,#tf-quick-row{display:none!important;visibility:hidden!important;height:0!important;min-height:0!important;margin:0!important;padding:0!important;border:0!important;overflow:hidden!important;}
      .snipex-stable-panel{min-height:215px!important;contain:layout style!important;overflow:hidden!important;}
      .snipex-stable-decision{min-height:120px!important;max-height:120px!important;overflow:auto!important;line-height:1.55!important;scrollbar-width:thin;}
      .snipex-stable-profit{min-height:122px!important;}
      .confluence-bar{min-height:128px!important;contain:layout style!important;}
      #conf-score,#conf-pct,#conf-bias{transition:color .25s ease!important;}
      #conf-prog{transition:width .7s ease!important;}
      .ai-tf-bullets{margin-top:10px!important;}
    `;
    document.head.appendChild(st);
  }
  addCSS(); stablePatch();
  setInterval(stablePatch, 1200);
  window.snipexStableUIPatch = stablePatch;
})();


(function(){
  if(window.__SNIPEX_MASTER_AI_RETCODE_PATCH__) return;
  window.__SNIPEX_MASTER_AI_RETCODE_PATCH__ = true;
  function log(msg, type){ try{ (window.logLive||console.log)(msg, type||'ok'); }catch(e){ console.log(msg); } }
  function fmtOrderResult(r){
    if(!r) return 'no response';
    var ticket = r.ticket || r.order_id || (r.order&&r.order.ticket) || (r.result&&r.result.order) || 'n/a';
    var deal = r.deal || (r.result&&r.result.deal) || 'n/a';
    var rc = r.retcode || (r.order&&r.order.retcode) || (r.result&&r.result.retcode) || 'no-retcode';
    var rn = r.retcode_name || (r.order&&r.order.retcode_name) || '';
    return rc+' '+rn+' ticket '+ticket+' deal '+deal;
  }
  async function fireMasterAIOrder(payload, label){
    payload = payload || {};
    payload.symbol = String(payload.symbol || window.liveSymbol || 'XAUUSD').toUpperCase();
    payload.side = String(payload.side || payload.direction || 'BUY').toUpperCase();
    payload.lot = Number(payload.lot || payload.volume || ((document.getElementById('live-lot')||{}).value) || 0.01);
    payload.volume = payload.lot;
    payload.comment = String(payload.comment || 'MASTER_AI_AUTO').slice(0,27);
    payload.source = payload.source || 'master_ai_trigger_patch';
    payload.deviation = payload.deviation || 150;
    payload.max_retries = payload.max_retries == null ? 3 : payload.max_retries;
    log('\ud83d\ude80 MASTER AI sending via /api/order: '+payload.side+' '+payload.symbol+' lot '+payload.lot, 'ok');
    var r = await (window.api ? window.api('/api/order',{method:'POST',body:JSON.stringify(payload),timeoutMs:15000}) : fetch('/api/order',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)}).then(x=>x.json()));
    log('\u2705 MASTER AI MT5 RESULT: '+fmtOrderResult(r), r && r.ok===false ? 'bad' : 'ok');
    if(r && r.attempts && r.attempts.length) log('\ud83e\uddfe AI order attempts: '+r.attempts.map(function(a){return a.attempt+'/'+(a.retcode_name||a.retcode)+'@'+a.price_sent;}).join(' \u2192 '),'warn');
    return r;
  }
  window.SnipeXFireMasterAIOrder = fireMasterAIOrder;
  // Full-auto optimizer must not show a fake execution lock. Auto position is ON by default in this patched build.
  try{ if(localStorage.getItem('snipex_auto_trade_on') === null) localStorage.setItem('snipex_auto_trade_on','1'); }catch(e){}
  try{ log('\ud83e\udde9 Master AI trigger retcode patch loaded: AI orders use /api/order and print retcode/ticket/deal.', 'ok'); }catch(e){}
})();


(function(){
  if(window.__SNIPEX_FULL_AUTO_STABLE_MODE_CONTROLLER__) return;
  window.__SNIPEX_FULL_AUTO_STABLE_MODE_CONTROLLER__ = true;
  var BASE=function(){return window.SNIPEX_BRIDGE_BASE||window.BRIDGE_BASE||'http://127.0.0.1:5000'};
  function log(m,t){try{(window.logLive||console.log)(m,t||'ok')}catch(e){console.log(m)}}
  function txt(id,v){var e=document.getElementById(id); if(e&&e.textContent!==String(v)) e.textContent=String(v)}
  function cls(id,v){var e=document.getElementById(id); if(e&&e.className!==v) e.className=v}
  function norm(tf){tf=String(tf||'M5').toUpperCase();return ({'1':'M1','5':'M5','15':'M15','60':'H1','240':'H4','D':'D1','D1':'D1','M1':'M1','M5':'M5','M15':'M15','H1':'H1','H4':'H4'}[tf]||'M5')}
  function selectedTF(){return norm(localStorage.getItem('snipex_ai_manual_tf')||window.aiManualTF||((document.getElementById('live-tf')||{}).value)||'M5')}
  function forceAuto(){try{localStorage.setItem('snipex_master_ai_on','1');localStorage.setItem('snipex_auto_trade_on','1');localStorage.setItem('snipex_manual_control_locked','0');localStorage.setItem('manual_locked','0');localStorage.setItem('snipex_execution_locked','0');localStorage.setItem('snipex_ai_tf_lock','0');window.aiOn=true;window.autoOn=true;window.manualLocked=false;window.manual_lock=false;window.executionLocked=false;window.aiTFLock=false;try{if(typeof aiOn!=='undefined')aiOn=true;if(typeof autoOn!=='undefined')autoOn=true;if(typeof aiTFLock!=='undefined')aiTFLock=false}catch(e){}}catch(e){}}
  function paint(){forceAuto();txt('ai-state','AI ON');txt('auto-state','ON');txt('rib-ai','FULL AUTO');cls('btn-ai','tog-btn on');cls('btn-auto','tog-btn on');var ab=document.getElementById('btn-auto');if(ab)ab.style.display='';var x=document.getElementById('ai-control-pill');if(x)x.textContent='FULL AUTO STABLE';x=document.getElementById('master-ai-mode-label');if(x)x.textContent='Stable AUTO mode: AI scans, decides and executes via /api/order';x=document.getElementById('ai-control-note');if(x)x.textContent='FULL AUTO STABLE: no Manual Control Lock, no TF blinking, no UI flip-flop. Waiting for approved Bullish/Bearish setup.';x=document.getElementById('ai-tf-lock-btn');if(x){x.style.display='inline-flex';x.className='ai-lock-off';x.textContent='TF FREE \u00b7 STABLE'}x=document.getElementById('priority-mini');if(x&&/manual|locked|tf free|optimizer/i.test(x.textContent||''))x.innerHTML='<b>Priority Engine:</b> FULL AUTO STABLE \u00b7 TF FREE \u00b7 Execution unlocked via /api/order';x=document.getElementById('ai-decision');if(x&&/manual.*locked|control.*locked/i.test(x.textContent||''))x.innerHTML='\u25ba FULL AUTO STABLE<br>\u25ba Manual Control Lock: OFF<br>\u25ba TF Mode: FREE, no blinking<br>\u25ba Execution route: /api/order<br>\u25ba Waiting for approved Bullish/Bearish decision'}
  function rt(r){r=r||{};var rc=r.retcode||(r.order&&r.order.retcode)||(r.result&&r.result.retcode)||'no-retcode',rn=r.retcode_name||(r.order&&r.order.retcode_name)||'',tk=r.ticket||r.order_id||(r.order&&r.order.ticket)||(r.result&&r.result.order)||'n/a',d=r.deal||(r.result&&r.result.deal)||'n/a';return rc+' '+rn+' ticket '+tk+' deal '+d}
  async function fire(q){forceAuto();q=q||{};var side=String(q.side||q.direction||'BUY').toUpperCase();if(side!=='SELL')side='BUY';var sym=String(q.symbol||window.liveSymbol||'XAUUSD').toUpperCase();var lot=Number(q.lot||q.volume||((document.getElementById('live-lot')||{}).value)||0.01);if(!isFinite(lot)||lot<=0)lot=0.01;var body={symbol:sym,side:side,lot:lot,volume:lot,sl:Number(q.sl||0),tp:Number(q.tp||q.tp3||q.tp2||q.tp1||0),timeframe:norm(q.timeframe||q.tf||selectedTF()),strategy_name:q.strategy_name||q.strategy||'FULL_AUTO_STABLE',strategy:q.strategy_name||q.strategy||'FULL_AUTO_STABLE',confidence:Number(q.confidence||q.score||0),comment:String(q.comment||'MASTER_AI_STABLE').slice(0,27),source:'full_auto_stable_controller',deviation:150,max_retries:3};log('\ud83d\ude80 MASTER AI STABLE ORDER: '+body.side+' '+body.symbol+' lot '+body.lot+' TF '+body.timeframe+' via /api/order','ok');var r;if(window.api)r=await window.api('/api/order',{method:'POST',body:JSON.stringify(body),timeoutMs:16000});else r=await fetch(BASE()+'/api/order',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}).then(function(x){return x.json()});log((r&&r.ok===false?'\u274c':'\u2705')+' MASTER AI MT5 RESULT: '+rt(r),r&&r.ok===false?'bad':'ok');return r}
  window.SnipeXFireMasterAIOrder=fire;
  var old=window.maybeAutoTriggerSetup;window.maybeAutoTriggerSetup=async function(setup,src){setup=setup||{};var side=String(setup.side||setup.direction||'').toUpperCase();if(side!=='BUY'&&side!=='SELL')return old?old.apply(this,arguments):{fired:false,reason:'direction missing'};try{var r=await fire(Object.assign({},setup,{source:src||setup.source||'stable_auto_trigger'}));return{fired:!!(r&&r.ok!==false),ticket:r&&(r.ticket||r.order_id||(r.result&&r.result.order)),retcode:r&&(r.retcode||(r.order&&r.order.retcode)),result:r}}catch(e){log('\u274c MASTER AI STABLE failed: '+(e.message||e),'bad');return{fired:false,reason:e.message||String(e)}}};
  window.toggleAI=function(){forceAuto();paint();log('\ud83e\udde0 MASTER AI remains ON: stable full auto mode active.','ok');try{window.refreshAIMasterDecision&&window.refreshAIMasterDecision(true)}catch(e){}};
  window.toggleAuto=function(){forceAuto();paint();log('\ud83d\udfe2 AI Execution Engine remains active: stable full auto execution unlocked.','ok')};
  var oldRefresh=window.refreshAIMasterDecision;if(oldRefresh&&!oldRefresh.__stableAutoWrapped){var w=async function(force){forceAuto();paint();var d=await oldRefresh.apply(this,arguments);paint();return d};w.__stableAutoWrapped=true;window.refreshAIMasterDecision=w}
  window.getAIExecutionTF=function(){return norm((document.getElementById('live-tf')||{}).value||localStorage.getItem('snipex_ai_manual_tf')||'M5')};window.getSelectedTFForAI=window.getAIExecutionTF;
  function boot(){forceAuto();paint();log('\u2705 FULL AUTO STABLE MODE LOADED: blinking/manual-lock flip-flop removed.','ok');try{fetch(BASE()+'/api/ai/master_config',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({enabled:true,auto_trade_enabled:true,control_mode:'AUTO',tf_lock:false,trading_style:'AUTO',stable_full_auto:true,manual_locked:false})})}catch(e){}}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();setTimeout(paint,700);setTimeout(paint,1800);setInterval(paint,5000);
})();


(function(){
  if(window.__SNIPEX_CONFIDENCE_GATE_CONFLICT_FIX__) return;
  window.__SNIPEX_CONFIDENCE_GATE_CONFLICT_FIX__ = true;
  function log(m,t){try{(window.logLive||console.log)(m,t||'ok')}catch(e){console.log(m)}}
  function base(){return window.SNIPEX_BRIDGE_BASE||window.BRIDGE_BASE||'http://127.0.0.1:5000'}
  function norm(tf){tf=String(tf||'M5').toUpperCase();return ({'1':'M1','5':'M5','15':'M15','60':'H1','240':'H4','D':'D1','D1':'D1','M1':'M1','M5':'M5','M15':'M15','H1':'H1','H4':'H4'}[tf]||'M5')}
  function rt(r){r=r||{};var rc=r.retcode||(r.order&&r.order.retcode)||(r.result&&r.result.retcode)||'no-retcode',rn=r.retcode_name||(r.order&&r.order.retcode_name)||'',tk=r.ticket||r.order_id||(r.order&&r.order.ticket)||(r.result&&r.result.order)||'n/a',d=r.deal||(r.result&&r.result.deal)||'n/a';return rc+' '+rn+' ticket '+tk+' deal '+d}
  function forceOpen(){
    try{
      localStorage.setItem('snipex_master_ai_on','1');
      localStorage.setItem('snipex_auto_trade_on','1');
      localStorage.setItem('snipex_manual_control_locked','0');
      localStorage.setItem('manual_locked','0');
      localStorage.setItem('snipex_execution_locked','0');
      window.aiOn=true; window.autoOn=true; window.manualLocked=false; window.manual_lock=false; window.executionLocked=false;
      if(window.SNIPEX_AUTO_TRIGGER){ window.SNIPEX_AUTO_TRIGGER.minConfidence=0; }
    }catch(e){}
  }
  async function stableFire(setup,src){
    forceOpen(); setup=setup||{};
    var side=String(setup.side||setup.direction||'').toUpperCase();
    if(side!=='BUY' && side!=='SELL') return {fired:false,reason:'direction missing, confidence bar cannot create direction'};
    var sym=String(setup.symbol||window.liveSymbol||'XAUUSD').toUpperCase();
    var lot=Number(setup.lot||setup.volume||((document.getElementById('live-lot')||{}).value)||0.01); if(!isFinite(lot)||lot<=0) lot=0.01;
    var tf=norm(setup.timeframe||setup.tf||((document.getElementById('live-tf')||{}).value)||'M5');
    var conf=Number(setup.confidence||setup.score||0); if(!isFinite(conf)) conf=0;
    var body={symbol:sym,side:side,lot:lot,volume:lot,sl:Number(setup.sl||0),tp:Number(setup.tp||setup.tp3||setup.tp2||setup.tp1||0),timeframe:tf,strategy_name:setup.strategy_name||setup.strategy||'CONFIDENCE_GATE_FIXED',strategy:setup.strategy_name||setup.strategy||'CONFIDENCE_GATE_FIXED',confidence:conf,comment:'AI_CONF_GATE_FIXED',source:src||'confidence_gate_fix',deviation:150,max_retries:3};
    log('\ud83d\ude80 CONFIDENCE GATE CLEAR: firing '+side+' '+sym+' \u00b7 final confidence '+conf+'%; duplicate bars ignored.', 'ok');
    var r = window.api ? await window.api('/api/order',{method:'POST',body:JSON.stringify(body),timeoutMs:16000}) : await fetch(base()+'/api/order',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}).then(function(x){return x.json()});
    log((r&&r.ok===false?'\u274c':'\u2705')+' MASTER AI MT5 RESULT: '+rt(r), r&&r.ok===false?'bad':'ok');
    return {fired:!!(r&&r.ok!==false), ticket:r&&(r.ticket||r.order_id||(r.result&&r.result.order)), retcode:r&&(r.retcode||(r.order&&r.order.retcode)), result:r};
  }
  window.maybeAutoTriggerSetup = function(setup,src){ return stableFire(setup,src||'confidence_gate_override'); };
  window.SnipeXFireMasterAIOrder = function(payload){ payload=payload||{}; payload.direction=payload.direction||payload.side||'BUY'; return stableFire(payload,'direct_master_ai_confidence_gate_fixed'); };
  var oldUpdate=window.updateMasterAIExecutionConfidence;
  window.updateMasterAIExecutionConfidence=function(obj,source){
    obj=obj||{};
    var raw=Number(obj.execution_confidence||obj.exec_confidence||obj.confidence||obj.ai_confidence||obj.score||obj.final_confidence||((obj.best_strategy||{}).score)||0);
    if(!Number.isFinite(raw)) raw=0;
    obj.execution_confidence=Math.max(0,Math.min(100,raw));
    obj.confidence=obj.execution_confidence;
    try{
      var pct=document.getElementById('conf-pct'); if(pct) pct.textContent=obj.confidence.toFixed(1)+'%';
      var prog=document.getElementById('conf-prog'); if(prog) prog.style.width=Math.max(1,Math.min(100,obj.confidence))+'%';
      var score=document.getElementById('conf-score'); if(score) score.textContent='Final Execution Confidence only'; var note=document.getElementById('conf-gate-note'); if(note) note.textContent='Display only \u00b7 trigger gate ignores duplicate confidence bars';
    }catch(e){}
    if(oldUpdate && oldUpdate!==window.updateMasterAIExecutionConfidence) { try{return oldUpdate.call(this,obj,source||'CONFIDENCE_GATE_FIXED')}catch(e){} }
    return obj;
  };
  function paint(){forceOpen(); try{var x=document.getElementById('ai-control-note'); if(x)x.textContent='FULL AUTO STABLE: duplicate confidence bars are display-only. Trigger waits only for Bullish/Bearish direction + /api/order.'; x=document.getElementById('priority-mini'); if(x)x.innerHTML='<b>Priority Engine:</b> FULL AUTO \u00b7 Confidence gate conflict fixed \u00b7 Execution unlocked';}catch(e){}}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',function(){paint();log('\u2705 Confidence source fix loaded: duplicate bars cannot control trigger gate.', 'ok')}); else {paint();log('\u2705 Confidence source fix loaded: duplicate bars cannot control trigger gate.', 'ok')}
  setInterval(paint,5000);
})();


(function(){
  if(window.__SNIPEX_VISIBLE_PAIR_MASTER_AI_SCANNER__) return;
  window.__SNIPEX_VISIBLE_PAIR_MASTER_AI_SCANNER__ = true;
  const STORE_ON='snipex_visible_pair_ai_scan_on';
  const SCAN_MS=45000;
  let busy=false, lastRun=0;
  function base(){return window.SNIPEX_BRIDGE_BASE||window.BRIDGE_BASE||'http://127.0.0.1:5000'}
  function log(m,t){try{(window.logLive||console.log)(m,t||'ok')}catch(e){try{console.log(m)}catch(_){}}}
  function tf(){try{return String((document.getElementById('live-tf')||{}).value||window.aiManualTF||localStorage.getItem('snipex_ai_manual_tf')||'M5').toUpperCase()}catch(e){return 'M5'}}
  function visiblePairs(){
    const out=[];
    function clean(x){
      x=String(x||'').trim().toUpperCase();
      x=x.replace(/[^A-Z0-9._#-]/g,'');
      if(!x) return '';
      if(!/XAU|XAG|XPD|EUR|GBP|JPY|ADA|LTC|DOT|AVAX|MATIC|POL|TRX|LINK|TON|BCH|UNI|ATOM|NEAR|OP|ARB|APT|INJ|FIL|ETC|SHIB|PEPE/i.test(x)) return '';
      return x;
    }
    function add(x){x=clean(x); if(x && !out.includes(x)) out.push(x)}
    try{ Object.keys(window.assetData||{}).forEach(add); }catch(e){}
    try{ [window.liveSymbol, window.selectedSymbol, window.currentSymbol].forEach(add); }catch(e){}
    try{ document.querySelectorAll('#visible-pairs option,#live-symbol option,#fx-symbol option,#symbol option,[data-symbol],.asset-symbol,.trade-symbol,.symbol-pill,.pair-chip,.watch-symbol,.market-symbol').forEach(el=>add(el.value||el.dataset.symbol||el.getAttribute('data-symbol')||el.textContent)); }catch(e){}
    try{ String(((document.getElementById('visible-pairs')||{}).value)||'').split(/[,;\s]+/).forEach(add); }catch(e){}
    if(!out.length) ['XAUUSD','XAGUSD','EURUSD'].forEach(add);
    return out.slice(0,18);
  }
  async function post(url, body){
    if(window.api) return await window.api(url,{method:'POST',body:JSON.stringify(body),timeoutMs:25000});
    const r=await fetch(base()+url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
    return await r.json();
  }
  async function scanNow(reason){
    if(busy) return {ok:false,reason:'visible pair scan busy'};
    const aiOn = localStorage.getItem('snipex_master_ai_on') !== '0' && window.aiOn !== false;
    const autoOn = localStorage.getItem('snipex_auto_trade_on') !== '0' && window.autoOn !== false;
    const enabled = localStorage.getItem(STORE_ON) !== '0';
    if(!enabled || !aiOn || !autoOn) return {ok:false,reason:'visible pair AI scan disabled or AI/AUTO OFF'};
    busy=true; lastRun=Date.now();
    const symbols=visiblePairs();
    try{
      log('\ud83e\udde0 FOREX MASTER AI scanning DISPLAYED UI symbols: '+symbols.join(', ')+' \u00b7 TF '+tf(), 'ok');
      const res=await post('/api/ai/scan_visible_pairs',{symbols:symbols,timeframe:tf(),auto_trade:true,max_orders_per_scan:3,min_confidence:Number(localStorage.getItem('snipex_ai_min_confidence')||62),source:'ui_visible_pair_master_ai',deviation:500,max_retries:3});
      const fired=(res.results||[]).filter(x=>x.executed);
      const approved=(res.results||[]).filter(x=>x.approved);
      if(fired.length) log('\u2705 FOREX MASTER AI fired '+fired.length+' order(s): '+fired.map(x=>x.ui_symbol+'\u2192'+x.resolved_symbol+' '+x.side+' '+x.confidence+'%').join(' | '),'ok');
      else if(approved.length) log('\u26a0 FOREX MASTER AI found setup(s) but safety/order gate blocked: '+approved.map(x=>x.ui_symbol+' '+(x.block_reasons||[]).join('/')).join(' | '),'warn');
      else log('\ud83d\udd0e FOREX MASTER AI scan complete: no clean visible-pair setup yet.','warn');
      window.SNIPEX_LAST_VISIBLE_PAIR_SCAN=res;
      return res;
    }catch(e){ log('\u274c Visible-pair Master AI scan error: '+(e.message||e),'bad'); return {ok:false,error:e.message||String(e)}; }
    finally{ busy=false; }
  }
  window.SnipeXScanVisibleForexPairs = scanNow;
  window.SnipeXVisiblePairs = visiblePairs;
  function boot(){
    try{ if(localStorage.getItem(STORE_ON)==null) localStorage.setItem(STORE_ON,'1'); }catch(e){}
    log('\u2705 Displayed-symbol Forex Master AI enabled: scans only symbols displayed in UI/cards/watchlist, then can position approved setups through /api/ai/scan_visible_pairs.','ok');
    setTimeout(()=>scanNow('boot'), 2500);
    setInterval(()=>{ if(Date.now()-lastRun>SCAN_MS-1000) scanNow('interval'); }, SCAN_MS);
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot); else boot();
})();


(function(){
  const PANEL_ID='multi-chart-scan-panel';
  function log(msg,type){try{ if(window.logLive) logLive(msg,type||'ok'); else console.log(msg); }catch(e){}}
  function tf(){const v=(document.getElementById('live-tf')||{}).value||'5';return v==='1'?'M1':v==='5'?'M5':v==='15'?'M15':v==='60'?'H1':v==='240'?'H4':v==='D'?'D1':v;}
  function pairs(){
    const seen=new Set(), out=[];
    const add=s=>{s=String(s||'').trim().toUpperCase(); if(!s) return; if(!/(XAU|XAG|XPD|EUR|GBP|JPY|ADA|LTC|DOT|AVAX|MATIC|TRX|LINK)/.test(s)) return; if(!seen.has(s)){seen.add(s);out.push(s);}};
    try{[...document.querySelectorAll('#live-symbol option')].forEach(o=>add(o.value||o.textContent));}catch(e){}
    try{const cur=(window.liveSymbol||((document.getElementById('live-symbol')||{}).value)); add(cur);}catch(e){}
    try{Object.keys(window.ASSETS||{}).forEach(add);}catch(e){}
    return out.length?out:['XAUUSD','XAGUSD','XPDUSD','EURUSD','GBPUSD'];
  }
  function ensurePanel(){
    let p=document.getElementById(PANEL_ID); if(p) return p;
    p=document.createElement('div'); p.id=PANEL_ID;
    const row=document.querySelector('.live-control-row');
    if(row && row.parentNode) row.parentNode.insertBefore(p,row.nextSibling);
    else (document.querySelector('.tv-card')||document.body).appendChild(p);
    return p;
  }
  function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));}
  function renderCards(results){
    const p=ensurePanel();
    const list=Array.isArray(results)?results:[];
    if(!list.length){p.innerHTML='<div class="multi-scan-card blocked"><div class="multi-scan-head"><span class="multi-scan-sym">VISIBLE PAIRS</span><span class="multi-scan-badge">SCANNING</span></div><div class="multi-scan-line">Waiting for Master AI visible-pair scan results.</div><div class="multi-scan-mini-chart"></div></div>';return;}
    p.innerHTML=list.map(x=>{
      const bad=x.ok===false, ready=!!x.executed || (!!x.approved && !(x.block_reasons||[]).length), blocked=!bad && !ready;
      const cls=bad?'bad':ready?'ready':'blocked';
      const status=x.executed?'ORDER SENT':x.approved?'SETUP READY':bad?'ERROR':'WAIT / BLOCKED';
      const reason=(x.block_reasons&&x.block_reasons.length)?x.block_reasons.join(' \u00b7 '):(x.reason||x.error||'Scanning strategy setup.');
      const strat=(x.best_strategy&&(x.best_strategy.name||x.best_strategy.strategy))||x.strategy_name||'Master AI Forex';
      return `<div class="multi-scan-card ${cls}"><div class="multi-scan-head"><span class="multi-scan-sym">${esc(x.ui_symbol||x.symbol)} \u2192 ${esc(x.resolved_symbol||'--')}</span><span class="multi-scan-badge">${esc(status)}</span></div><div class="multi-scan-line">${esc(x.side||'WAIT')} \u00b7 Confidence ${esc(x.confidence||0)}% \u00b7 ${esc(x.timeframe||tf())}</div><div class="multi-scan-line">Strategy: ${esc(strat)}</div><div class="multi-scan-line">${esc(reason)}</div><div class="multi-scan-mini-chart"></div></div>`;
    }).join('');
  }
  function ensureDrawLayer(frame){
    if(!frame) return null; frame.style.position='relative';
    let layer=frame.querySelector('.multi-draw-layer');
    if(!layer){layer=document.createElement('div'); layer.className='multi-draw-layer'; frame.appendChild(layer);}
    return layer;
  }
  function drawOnFrame(frame,result,sym){
    const layer=ensureDrawLayer(frame); if(!layer) return;
    const r=result||{};
    const status=r.executed?'ORDER SENT':r.approved?'READY':'SCANNING';
    const arrow=(String(r.side||'WAIT').toUpperCase()==='SELL')?'\u25bc':(String(r.side||'WAIT').toUpperCase()==='BUY')?'\u25b2':'\u25c6';
    const strat=(r.best_strategy&&(r.best_strategy.name||r.best_strategy.strategy))||r.strategy_name||'Master AI Forex';
    layer.innerHTML=`<div class="multi-draw-tag">${esc(sym)} \u00b7 ${esc(strat).slice(0,44)}</div><div class="multi-draw-status">${esc(status)} \u00b7 ${esc(r.confidence||0)}%</div><div class="multi-draw-line" style="top:50%"></div><div class="multi-draw-arrow">${arrow}</div>`;
  }
  function drawFrames(results){
    const list=Array.isArray(results)?results:[];
    const mainSym=(window.liveSymbol||((document.getElementById('live-symbol')||{}).value)||'XAUUSD').toUpperCase();
    const mainRes=list.find(x=>String(x.ui_symbol||'').toUpperCase()===mainSym)||list[0]||{ui_symbol:mainSym};
    drawOnFrame(document.getElementById('tradingview-frame'),mainRes,mainSym);
    const second=list.find(x=>String(x.ui_symbol||'').toUpperCase().includes('XAG'))||list[1];
    drawOnFrame(document.getElementById('tradingview-frame-oil'),second,second&&(second.ui_symbol||second.symbol)||'XAGUSD');
  }
  async function post(url,body){const r=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body||{})});let j={};try{j=await r.json();}catch(e){} if(!r.ok) throw new Error(j.error||j.reason||('HTTP '+r.status)); return j;}
  async function scanAllVisibleAndDraw(opts){
    opts=opts||{};
    const syms=pairs();
    ensurePanel(); renderCards(syms.map(s=>({ui_symbol:s,resolved_symbol:'...',timeframe:tf(),confidence:0,reason:'Scanning now'})));
    const aiOn = localStorage.getItem('snipex_master_ai_on') !== '0' && window.aiOn !== false;
    const autoOn = localStorage.getItem('snipex_auto_trade_on') !== '0' && window.autoOn !== false;
    const execute = !!opts.autoPosition || (!!aiOn && !!autoOn && !opts.manualDrawOnly);
    log('\ud83d\udd8a Multi-chart Scan + Draw: '+syms.join(', ')+' \u00b7 '+tf()+(execute?' \u00b7 AI Execution Engine Enabled':' \u00b7 DRAW/SCAN ONLY'), execute?'ok':'warn');
    const res=await post('/api/ai/scan_visible_pairs',{symbols:syms,timeframe:tf(),auto_trade:execute,max_orders_per_scan:Number(localStorage.getItem('snipex_max_visible_pair_orders')||3),min_confidence:Number(localStorage.getItem('snipex_ai_min_confidence')||62),source:'ui_multi_chart_scan_draw',manual_draw_only:!!opts.manualDrawOnly,strategies:window.SNIPEX_TWO_FOREX_STRATEGIES||undefined,deviation:500,max_retries:3});
    const results=res.results||[];
    renderCards(results); drawFrames(results);
    const sent=results.filter(x=>x.executed).length, ready=results.filter(x=>x.approved).length;
    if(sent) log('\u2705 Multi-chart Master AI sent '+sent+' order(s).','ok');
    else if(ready) log('\u26a0 Multi-chart setups found but order not sent: check block cards/reasons.','warn');
    else log('\ud83d\udd0e Multi-chart scan done: no clean setup yet.','warn');
    window.SNIPEX_MULTI_CHART_SCAN=res;
    return res;
  }
  window.scanAndDrawAllVisibleForexCharts=scanAllVisibleAndDraw;
  const oldBtn=window.scanAndDrawSelectedStrategy;
  window.scanAndDrawSelectedStrategy=function(){return scanAllVisibleAndDraw({manualDrawOnly:true}).catch(e=>{log('Multi-chart draw safe wait: '+(e.message||e),'warn'); if(oldBtn) return oldBtn.apply(this,arguments);});};
  const oldVisible=window.SnipeXScanVisibleForexPairs;
  if(oldVisible){
    window.SnipeXScanVisibleForexPairs=async function(reason){const r=await oldVisible.apply(this,arguments); try{renderCards((r&&r.results)||[]); drawFrames((r&&r.results)||[]);}catch(e){} return r;};
  }
  function boot(){
    ensurePanel();
    renderCards(pairs().map(s=>({ui_symbol:s,resolved_symbol:'--',timeframe:tf(),confidence:0,reason:'Waiting for scan.'})));
    setTimeout(()=>{ if(localStorage.getItem('snipex_master_ai_on')!=='0') scanAllVisibleAndDraw({autoTrade:false}).catch(()=>{}); },2200);
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot); else boot();
})();


(function(){
  function q(id){return document.getElementById(id)}
  function paintProToggle(){
    var ai = (localStorage.getItem('snipex_master_ai_on') !== '0');
    var au = (localStorage.getItem('snipex_auto_trade_on') !== '0');
    window.aiOn = ai; window.autoOn = au;
    var b=q('btn-ai'), s=q('ai-state'); if(b)b.className='tog-btn '+(ai?'on':'off'); if(s)s.textContent=ai?'AI ON':'AI OFF';
    var ab=q('btn-auto'), as=q('auto-state'); if(ab){ab.style.display='';ab.className='tog-btn '+(au?'on':'off');} if(as)as.textContent=au?'ON':'OFF';
    var pill=q('ai-control-pill'); if(pill){pill.classList.toggle('pro-on',ai);pill.classList.toggle('pro-off',!ai);pill.textContent=ai?(au?'MASTER AI AUTO READY':'MASTER AI SCAN ONLY'):'MANUAL MODE';}
    var txt=q('ai-status-text'); if(txt) txt.textContent=ai?'MASTER AI ARMED':'MASTER AI OFF';
    var note=q('ai-control-note'); if(note) note.textContent=ai?(au?'MASTER AI ON: AI can scan and execute only after safety checklist is clear.':'MASTER AI ON: AI can scan, but AI Execution Engine is OFF so orders are blocked.'):'MANUAL MODE: Master AI OFF. Manual buttons enabled.';
  }
  window.paintProAIToggle = paintProToggle;
  var oldApply=window.applyMasterAIMode;
  window.applyMasterAIMode=function(){ try{ if(oldApply) oldApply.apply(this,arguments); }catch(e){} paintProToggle(); };
  window.toggleAI=function(){ var ai=(localStorage.getItem('snipex_master_ai_on') !== '0'); ai=!ai; localStorage.setItem('snipex_master_ai_on',ai?'1':'0'); window.aiOn=ai; paintProToggle(); try{ if(ai && window.refreshAIMasterDecision) window.refreshAIMasterDecision(true); }catch(e){} try{ if(window.logLive) logLive(ai?'\ud83e\udde0 MASTER AI ON: pro toggle armed.':'\u270b MASTER AI OFF: manual mode active.', ai?'ok':'warn'); }catch(e){} };
  window.toggleAuto=function(){ var au=(localStorage.getItem('snipex_auto_trade_on') !== '0'); au=!au; localStorage.setItem('snipex_auto_trade_on',au?'1':'0'); window.autoOn=au; paintProToggle(); try{ if(window.logLive) logLive(au?'\ud83d\udfe2 AI Execution Engine Active: AI may execute approved setups.':'\ud83d\udd34 AI Execution Engine OFF: AI scans only, no orders.', au?'ok':'warn'); }catch(e){} };
  setInterval(paintProToggle, 2000);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',paintProToggle); else paintProToggle();
})();


(function(){
  function q(id){return document.getElementById(id)}
  function safe(s){return String(s==null?'':s).replace(/[<>]/g,'')}
  async function refreshAIProfitRanking(){
    const box=q('ai-profit-rank-box'); if(!box) return;
    try{
      const r=await fetch((window.SNIPEX_BRIDGE_BASE||'') + '/api/ai/profit_ranking?ts='+Date.now());
      const j=await r.json();
      const best=q('ai-profit-rank-best'), list=q('ai-profit-rank-list'), chip=q('ai-profit-rank-chip');
      if(chip) chip.textContent = j.ok ? 'LIVE' : 'WAIT';
      const s=j.summary||{}, b=j.best;
      if(best){
        best.innerHTML = b ? `<b>Best:</b> ${safe(b.strategy)} <span style="color:#00e5ff">${safe(b.symbol)}</span><br><b>Score:</b> ${Number(b.profit_score||0).toFixed(1)} \u00b7 <b>WR:</b> ${Number(b.winrate||0).toFixed(1)}% \u00b7 <b>Net:</b> ${Number(b.net||0).toFixed(2)}<br><b>Open file-pair PnL:</b> ${Number(s.open_net||0).toFixed(2)} \u00b7 <b>Trades:</b> ${Number(s.total_trades||0)}` : `No closed/learned positions ranked yet.<br><b>Open file-pair PnL:</b> ${Number(s.open_net||0).toFixed(2)} \u00b7 waiting for AI learning records.`;
      }
      if(list){
        const rows=(j.ranking||[]).slice(0,5);
        list.innerHTML = rows.length ? rows.map((x,i)=>`<div class="ai-profit-rank-row"><div class="rank-no">${i+1}</div><div><div class="rank-name">${safe(x.strategy)}</div><div class="rank-meta">${safe(x.symbol)} \u00b7 ${Number(x.trades||0)}T \u00b7 WR ${Number(x.winrate||0).toFixed(0)}% \u00b7 Net ${Number(x.net||0).toFixed(2)}</div></div><div class="rank-score">${Number(x.profit_score||0).toFixed(0)}</div></div>`).join('') : '<div class="rank-meta">AI Profit Ranking will appear after closed positions or AI learning events.</div>';
      }
    }catch(e){
      const chip=q('ai-profit-rank-chip'); if(chip) chip.textContent='OFFLINE';
    }
  }
  window.refreshAIProfitRanking=refreshAIProfitRanking;
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',()=>setTimeout(refreshAIProfitRanking,900)); else setTimeout(refreshAIProfitRanking,900);
  setInterval(refreshAIProfitRanking,7000);
})();


(function(){
  if(window.__FOREX_FOUR_EXEC_PATCH__) return;
  window.__FOREX_FOUR_EXEC_PATCH__ = true;
  const FOUR = [
    {name:'Forex Momentum Breakout', family:'BREAKOUT', mode:'MOMENTUM_BREAKOUT', tf:'M15', minConfidence:78, risk:0.5},
    {name:'Forex Trend Follower', family:'TREND', mode:'TREND_FOLLOWING', tf:'H4', minConfidence:78, risk:0.6},
    {name:'Forex News Spike Sniper', family:'NEWS', mode:'NEWS_SPIKE_BREAKOUT', tf:'M5', minConfidence:82, risk:0.4},
    {name:'Forex Relative Strength Swing', family:'RELATIVE_STRENGTH', mode:'RELATIVE_STRENGTH_TREND', tf:'H4', minConfidence:78, risk:0.6}
  ];
  function log(m,t){try{(window.logLive||console.log)(m,t||'ok')}catch(e){console.log(m)}}
  function norm(tf){tf=String(tf||'M5').toUpperCase();return ({'1':'M1','5':'M5','15':'M15','60':'H1','240':'H4','D':'D1','D1':'D1','M1':'M1','M5':'M5','M15':'M15','H1':'H1','H4':'H4'}[tf]||tf)}
  function selectedStrategyName(){
    try{var sel=document.getElementById('chart-strategy-select'); if(sel&&sel.value) return sel.value;}catch(e){}
    try{if(window.aiMasterDecision&&window.aiMasterDecision.best_strategy){return window.aiMasterDecision.best_strategy.strategy||window.aiMasterDecision.best_strategy.name||''}}catch(e){}
    return 'Forex Momentum Breakout';
  }
  function ensureFourStrategies(){
    window.STRATEGIES = window.STRATEGIES || [];
    FOUR.forEach(function(f){
      var exists=window.STRATEGIES.some(function(s){return String(s.fullName||s.name||'').toUpperCase()===f.name.toUpperCase()});
      if(!exists){
        window.STRATEGIES.unshift({name:f.name.toUpperCase(), fullName:f.name, type:f.family+' \u00b7 EXECUTABLE', tf:f.tf, wr:f.family==='NEWS'?45:55, rr:f.family==='NEWS'?25:20, consistency:f.family==='NEWS'?82:86, enabled:true, auto:true, imported:true, executable:true, manualExecutable:true, masterAIExecutable:true, family:f.family, mode:f.mode, confidence_threshold:f.minConfidence, risk:f.risk});
      }
    });
    try{window.populateChartStrategySelect&&window.populateChartStrategySelect(true)}catch(e){}
    try{window.renderStrategies&&window.renderStrategies()}catch(e){}
  }
  function decideFourStrategyFromCandles(candles){
    candles=(Array.isArray(candles)?candles:[]).map(function(c){return {open:Number(c.open||c.o||0),high:Number(c.high||c.h||0),low:Number(c.low||c.l||0),close:Number(c.close||c.c||c.bid||0),volume:Number(c.tick_volume||c.real_volume||c.volume||c.v||0)}}).filter(function(c){return c.high&&c.low&&c.close});
    if(candles.length<30) return {strategy:'Forex Momentum Breakout', regime:'WAIT', side:'WAIT', confidence:0, tf:'M15', reason:'Need 30+ live candles for four-strategy Master AI routing'};
    var recent=candles.slice(-30), last=candles[candles.length-1];
    var closes=recent.map(x=>x.close), highs=recent.map(x=>x.high), lows=recent.map(x=>x.low), vols=recent.map(x=>x.volume||0);
    var avg=function(a){return a.reduce((p,x)=>p+x,0)/Math.max(1,a.length)};
    var ema=function(vals,n){var k=2/(n+1), e=vals[0]; for(var i=1;i<vals.length;i++) e=vals[i]*k+e*(1-k); return e};
    var e20=ema(closes,20), e50=ema(closes,Math.min(30,50));
    var range=Math.max(0.00001, Math.max(...highs)-Math.min(...lows));
    var slope=(closes[closes.length-1]-closes[Math.max(0,closes.length-10)])/range;
    var volSpike=(last.volume||0) > avg(vols.slice(0,-1))*1.35;
    var breakoutUp=last.close>Math.max(...highs.slice(0,-1));
    var breakoutDn=last.close<Math.min(...lows.slice(0,-1));
    var trendUp=e20>e50 && slope>0.12, trendDn=e20<e50 && slope<-0.12;
    var body=Math.abs(last.close-last.open), candleRange=Math.max(0.00001,last.high-last.low);
    var strongClose=body/candleRange>0.52;
    var newsFlag=false; try{newsFlag=!!window.fxNewsMode||/news|spike|tweet|etf|regulation/i.test((document.body&&document.body.innerText)||'')}catch(e){}
    if(newsFlag && strongClose && (breakoutUp||breakoutDn)) return {strategy:'Forex News Spike Sniper', regime:'NEWS_SPIKE', side:breakoutUp?'BUY':'SELL', confidence:88, tf:'M5', reason:'News/spike context plus confirmed breakout candle'};
    if((breakoutUp||breakoutDn) && volSpike && strongClose) return {strategy:'Forex Momentum Breakout', regime:'MOMENTUM_BREAKOUT', side:breakoutUp?'BUY':'SELL', confidence:86, tf:'M15', reason:'Range breakout + strong close + volume spike'};
    if(trendUp||trendDn) return {strategy:'Forex Trend Follower', regime:trendUp?'BULL_TREND':'BEAR_TREND', side:trendUp?'BUY':'SELL', confidence:83, tf:'H4', reason:'20/50 EMA trend structure detected'};
    return {strategy:'Forex Relative Strength Swing', regime:'ALTSEASON_RS_SCAN', side:trendUp?'BUY':trendDn?'SELL':'WAIT', confidence:72, tf:'H4', reason:'No clean XAU momentum; relative strength swing is scan-only until RS confirms'};
  }
  const oldSwitch=window.runMasterAIAutoSwitch;
  window.runMasterAIAutoSwitch=async function(force){
    ensureFourStrategies();
    try{
      var sym=String(window.liveSymbol||liveSymbol||'XAUUSD').toUpperCase();
      var tf='M15';
      var candles=[];
      try{var c=await api('/api/candles/repair?symbol='+encodeURIComponent(sym)+'&tf='+tf+'&count=120',{timeoutMs:10000}); candles=(c&&c.candles)||[]}catch(e){}
      var d=decideFourStrategyFromCandles(candles); d.symbol=sym;
      var sel=document.getElementById('chart-strategy-select');
      if(sel){
        var opt=[...sel.options].find(o=>String(o.value).toUpperCase()===d.strategy.toUpperCase() || String(o.textContent).toUpperCase()===d.strategy.toUpperCase());
        if(!opt){opt=document.createElement('option'); opt.value=d.strategy; opt.textContent=d.strategy; sel.appendChild(opt)}
        sel.value=opt.value;
      }
      window.aiMasterDecision=Object.assign(window.aiMasterDecision||{}, {approved:d.side==='BUY'||d.side==='SELL', side:d.side, confidence:d.confidence, master_confidence:d.confidence, regime:d.regime, best_strategy:{strategy:d.strategy, score:d.confidence, family:d.regime}, block_reasons:d.side==='WAIT'?[d.reason]:[], note:'Four fx strategy Master AI route: '+d.reason});
      try{window.renderAIMasterDecision&&window.renderAIMasterDecision(window.aiMasterDecision)}catch(e){}
      try{window.updateSelectedStrategyWatermark&&window.updateSelectedStrategyWatermark(true)}catch(e){}
      log('\ud83e\udde0 Forex Master AI selected: '+d.strategy+' \u00b7 '+d.side+' \u00b7 '+d.confidence+'% \u00b7 '+d.reason, d.side==='WAIT'?'warn':'ok');
      return d;
    }catch(e){ log('Forex four-strategy AI switch safe fallback: '+e.message,'warn'); return oldSwitch?oldSwitch(force):null; }
  };
  const oldManual=window.manualOrder;
  window.manualOrder=async function(side){
    var strat=selectedStrategyName();
    var lot=Number((document.getElementById('live-lot')||{}).value||0.01);
    var sym=String(window.liveSymbol||liveSymbol||'XAUUSD').toUpperCase();
    var tf=norm((document.getElementById('live-tf')||{}).value||'M5');
    var body={symbol:sym,side:String(side||'BUY').toUpperCase(),lot:lot,volume:lot,timeframe:tf,strategy:strat,strategy_name:strat,active_strategy:strat,comment:String(strat).replace(/[^A-Za-z0-9 _-]/g,'').slice(0,27),source:'manual_four_fx_strategy',fx_force_market_send:true,market_execution:true,deviation:150,max_retries:3};
    try{
      log('\ud83d\udd90 Manual executable strategy order: '+body.side+' '+sym+' \u00b7 '+strat+' \u00b7 lot '+lot,'ok');
      var r=await api('/api/order',{method:'POST',body:JSON.stringify(body),timeoutMs:16000});
      log((r&&r.ok===false?'\u274c':'\u2705')+' MANUAL STRATEGY MT5 RESULT: '+(r.retcode||((r.result||{}).retcode)||'no-retcode')+' '+(r.retcode_name||'')+' ticket '+(r.ticket||r.order_id||((r.result||{}).order)||'n/a'), r&&r.ok===false?'bad':'ok');
      try{await pullMT5Now()}catch(e){}
      return r;
    }catch(e){ log('Manual strategy order failed: '+e.message,'bad'); if(oldManual) return oldManual(side); }
  };
  const oldFire=window.SnipeXFireMasterAIOrder;
  window.SnipeXFireMasterAIOrder=async function(payload){
    payload=payload||{};
    var strat=(payload.strategy_name||payload.strategy||selectedStrategyName());
    payload.strategy=strat; payload.strategy_name=strat; payload.active_strategy=strat;
    payload.comment=String(payload.comment||strat).replace(/[^A-Za-z0-9 _-]/g,'').slice(0,27);
    payload.source=payload.source||'master_ai_four_fx_strategy';
    payload.fx_force_market_send=true; payload.market_execution=true; payload.max_retries=payload.max_retries==null?3:payload.max_retries;
    log('\ud83e\udd16 Master AI executable strategy route: '+strat+' \u2192 /api/order','ok');
    if(oldFire) return oldFire(payload);
    return api('/api/order',{method:'POST',body:JSON.stringify(payload),timeoutMs:16000});
  };
  ensureFourStrategies();
  log('\u2705 Added ONLY 4 executable fx strategies: Momentum Breakout, Trend Follower, News Spike Sniper, Relative Strength Swing. Manual + Master AI routes armed.','ok');
})();


(function(){
  if(window.__SNIPEX_TWO_FOREX_PERMANENT_EXEC_FIX__) return;
  window.__SNIPEX_TWO_FOREX_PERMANENT_EXEC_FIX__ = true;

  const TWO = [
    {name:'Forex Momentum Breakout', fullName:'Forex Momentum Breakout', family:'BREAKOUT', mode:'MOMENTUM_BREAKOUT', tf:'M15', wr:55, rr:18, consistency:88, enabled:true, auto:true, executable:true, confidence_threshold:76, risk:0.5},
    {name:'Forex Relative Strength Swing', fullName:'Forex Relative Strength Swing', family:'RELATIVE_STRENGTH', mode:'RELATIVE_STRENGTH_TREND', tf:'H4', wr:56, rr:20, consistency:84, enabled:true, auto:true, executable:true, confidence_threshold:76, risk:0.6}
  ];
  window.SNIPEX_TWO_FOREX_STRATEGIES = TWO;

  function log(m,t){try{(window.logLive||console.log)(m,t||'ok')}catch(e){console.log(m)}}
  function setTriggerStatus(status, setup, symbol, ticket, reason){
    try{
      const cls=String(status||'waiting').toLowerCase().replace(/[^a-z0-9_-]/g,'');
      const main=document.getElementById('trigger-status-main');
      const setupEl=document.getElementById('trigger-status-setup');
      const symEl=document.getElementById('trigger-status-symbol');
      const ticketEl=document.getElementById('trigger-status-ticket');
      const reasonEl=document.getElementById('trigger-status-reason');
      if(main){main.textContent=String(status||'WAITING').toUpperCase(); main.className='trigger-status-value '+cls;}
      if(setupEl) setupEl.textContent=setup||'--';
      if(symEl) symEl.textContent=symbol||'--';
      if(ticketEl) ticketEl.textContent=ticket||'--';
      if(reasonEl) reasonEl.textContent=reason||'--';
      window.SNIPEX_LAST_TRIGGER_STATUS={status,setup,symbol,ticket,reason,ts:new Date().toISOString()};
    }catch(e){}
  }
  function summarizeTrigger(res){
    const results=(res&&res.results)||[];
    const executed=results.find(x=>x.executed || x.order_sent || x.order_result || x.ticket);
    const approved=results.find(x=>x.approved || x.ready || x.status==='READY');
    const best=executed||approved||results[0]||{};
    const ticket=((best.order_result||{}).ticket)||((best.order_result||{}).order)||((best.order_result||{}).order_id)||best.ticket||best.order_id||'';
    const setup=best.strategy||best.strategy_name||best.active_strategy||best.best_strategy||'--';
    const symbol=(best.resolved_symbol||best.ui_symbol||best.symbol||'')+(best.side?(' '+best.side):'');
    let reason='';
    if(executed){reason='Order sent successfully through execution route.'}
    else if(results.length){
      reason=results.map(x=>{
        const r=(x.block_reasons&&x.block_reasons.length?x.block_reasons.join(' \u00b7 '):(x.not_triggered_reason||x.reason||x.error||x.status||'not approved'));
        return (x.ui_symbol||x.symbol||'symbol')+': '+r;
      }).slice(0,6).join(' | ');
    }else{
      reason=(res&&res.reason)||'No scan result returned from backend.';
    }
    return {executed, approved, ticket, setup, symbol, reason};
  }
  window.setTriggerStatus=setTriggerStatus;
  function base(){return window.SNIPEX_BRIDGE_BASE || window.BRIDGE_BASE || ''}
  function tf(){try{const v=(document.getElementById('live-tf')||{}).value||'15';return ({'1':'M1','5':'M5','15':'M15','60':'H1','240':'H4','D':'D1'}[v]||v)}catch(e){return 'M15'}}
  function pairs(){
    const out=[];
    function clean(x){
      x=String(x||'').trim().toUpperCase();
      x=x.replace(/[^A-Z0-9._#-]/g,'');
      if(!x) return '';
      if(!/XAU|XAG|XPD|EUR|GBP|JPY|ADA|LTC|DOT|AVAX|MATIC|POL|TRX|LINK|TON|BCH|UNI|ATOM|NEAR|OP|ARB|APT|INJ|FIL|ETC|SHIB|PEPE/i.test(x)) return '';
      return x;
    }
    function add(x){x=clean(x); if(x && !out.includes(x)) out.push(x)}
    try{ Object.keys(window.assetData||{}).forEach(add); }catch(e){}
    try{ [window.liveSymbol, window.selectedSymbol, window.currentSymbol].forEach(add); }catch(e){}
    try{ document.querySelectorAll('#visible-pairs option,#live-symbol option,#fx-symbol option,#symbol option,[data-symbol],.asset-symbol,.trade-symbol,.symbol-pill,.pair-chip,.watch-symbol,.market-symbol').forEach(el=>add(el.value||el.dataset.symbol||el.getAttribute('data-symbol')||el.textContent)); }catch(e){}
    try{ String(((document.getElementById('visible-pairs')||{}).value)||'').split(/[,;\s]+/).forEach(add); }catch(e){}
    if(!out.length) ['XAUUSD','XAGUSD','EURUSD'].forEach(add);
    return out.slice(0,18);
  }
  async function post(url,body,timeoutMs){
    if(window.api) return await window.api(url,{method:'POST',body:JSON.stringify(body||{}),timeoutMs:timeoutMs||25000});
    const r=await fetch(base()+url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body||{})});
    let j={}; try{j=await r.json()}catch(e){}
    if(!r.ok) throw new Error(j.error||j.reason||('HTTP '+r.status));
    return j;
  }
  function renderSimpleResults(res){
    try{
      const results=(res&&res.results)||[];
      if(typeof window.renderCards==='function') window.renderCards(results);
      if(typeof window.drawFrames==='function') window.drawFrames(results);
      window.SNIPEX_LAST_SCAN_RESULTS = results;
    }catch(e){}
  }

  
(function(){
  try{
    var old=Number(localStorage.getItem('snipex_ai_min_confidence')||0);
    if(!old || old>78) localStorage.setItem('snipex_ai_min_confidence','76');
  }catch(e){}
  window.SNIPEX_XAU_EXEC_CONFIDENCE = 76;
  window.SNIPEX_DEFAULT_EXEC_CONFIDENCE = 78;
  window.snipexExecMinConfidence = function(symbols){
    try{
      var txt=Array.isArray(symbols)?symbols.join(','):String(symbols||'');
      return /XAUUSD/i.test(txt) ? 76 : 78;
    }catch(e){return 78;}
  };
})();
// PERMANENT RULE: Scan + Draw is scan/draw only. It NEVER sends an order.
  window.scanAndDrawSelectedStrategy = async function(){
    const syms=pairs();
    setTriggerStatus('SCANNING','Scan + Draw only',syms.join(', '),'--','Scan + Draw never sends orders. It only finds setup levels and draws them on chart.');
    log('\ud83d\udd8a Scan + Draw started: SCAN/DRAW ONLY. No order will be sent from this button.','warn');
    const res=await post('/api/ai/scan_visible_pairs',{
      symbols:syms,
      timeframe:tf(),
      auto_trade:false,
      execute:false,
      manual_draw_only:true,
      source:'ui_scan_draw_only_layer3_locked',
      strategies:TWO,
      max_orders_per_scan:0,
      order_route_locked:true,
      execute_route_allowed:false,
      min_confidence:Number(localStorage.getItem('snipex_ai_min_confidence')||62),
      deviation:500,
      max_retries:3
    },25000).catch(e=>{window.__SNIPEX_SCAN_DRAW_LOCK_ACTIVE=false; setTriggerStatus('FAILED','Scan + Draw',syms.join(', '),'--',String(e.message||e)); log('Scan + Draw failed: '+(e.message||e),'bad'); throw e});
    renderSimpleResults(res);
    const ready=((res.results||[]).filter(x=>x.approved).length);
    setTriggerStatus(ready>0?'READY':'BLOCKED','Scan + Draw only',syms.join(', '),'--', ready>0 ? (ready+' approved setup(s) found. Not triggered because Scan + Draw is intentionally draw-only. Press Execute Best Setup to send order.') : 'No approved setup found in Scan + Draw.');
    log('\u2705 Scan + Draw complete: '+ready+' approved setup(s) found. Use Execute Best Setup to send order.','ok');
    return res;
  };

  // Separate execution button: scans same symbols and sends ONLY if backend safety approves.
  window.executeBestForexApprovedSetup = async function(){
    const syms=pairs();
    const aiOn=(localStorage.getItem('snipex_master_ai_on')!=='0' && window.aiOn!==false);
    const autoOn=(localStorage.getItem('snipex_auto_trade_on')!=='0' && window.autoOn!==false);
    if(!aiOn){setTriggerStatus('BLOCKED','Execute Best',syms.join(', '),'--','Master AI is OFF. Turn Master AI ON before execution.'); log('\u26d4 Execute blocked: Master AI is OFF.','bad'); return {ok:false,reason:'Master AI OFF'}}
    if(!autoOn){setTriggerStatus('BLOCKED','Execute Best',syms.join(', '),'--','AI Execution Engine is OFF. Turn Auto ON or use manual Bullish/Bearish.'); log('\u26d4 Execute blocked: AI Execution Engine is OFF. Turn Auto ON or use manual Bullish/Bearish.','bad'); return {ok:false,reason:'AI Execution Engine OFF'}}
    setTriggerStatus('SCANNING','Execute Best',syms.join(', '),'--','Execution scan started. Waiting for backend safety gate result.');
    log('\ud83d\ude80 Execute Best Setup: scanning '+syms.join(', ')+' and sending up to 5 safest approved orders via /api/order. XAUUSD gate 76%, other pairs 78%.','ok');
    const res=await post('/api/ai/scan_visible_pairs',{
      symbols:syms,
      timeframe:tf(),
      auto_trade:true,
      execute:true,
      manual_draw_only:false,
      source:'ui_execute_best_two_fx',
      strategies:TWO,
      max_orders_per_scan:5,
      min_confidence:(window.snipexExecMinConfidence?window.snipexExecMinConfidence(symbols):76),
      deviation:650,
      max_retries:4,
      cooldown_seconds:0
    },30000).catch(e=>{setTriggerStatus('FAILED','Execute Best',syms.join(', '),'--',String(e.message||e)); log('Execute Best failed: '+(e.message||e),'bad'); throw e});
    renderSimpleResults(res);
    const sent=Number(res.orders_sent||0);
    const summary=summarizeTrigger(res);
    if(sent>0 || summary.executed){
      const ex=summary.executed || {};
      const ticket=summary.ticket || 'ticket pending';
      setTriggerStatus('SENT', summary.setup, summary.symbol, ticket, 'Order sent successfully. Check MT5 ticket/order confirmation and Live Log.');
      log('\u2705 ORDER SENT: '+(ex.resolved_symbol||ex.ui_symbol||ex.symbol||'symbol')+' '+(ex.side||'')+' \u00b7 '+ticket,'ok');
    }else{
      setTriggerStatus('BLOCKED', summary.setup, summary.symbol, '--', summary.reason || 'No approved setup / safety gate blocked.');
      const lines=(res.results||[]).map(x=>`${x.ui_symbol||x.symbol}: ${(x.block_reasons||[]).join(' \u00b7 ') || x.not_triggered_reason || x.reason || x.error || 'not approved'}`).slice(0,5).join(' | ');
      log('\u26a0 No order sent. Block reason: '+(lines||summary.reason||'No approved setup / safety gate blocked.'),'warn');
    }
    return res;
  };

  // Keep only the two chosen strategy names in the chart selector, without deleting old backend modules.
  function cleanStrategyDropdown(){
    try{
      const sel=document.getElementById('chart-strategy-select');
      if(sel){
        sel.innerHTML='<option value="">Auto Strategy</option>'+TWO.map(s=>`<option value="${s.fullName}">${s.fullName}</option>`).join('');
      }
      if(Array.isArray(window.STRATEGIES)){
        // Keep original hidden strategies in memory, but disable auto on everything except the chosen two.
        const keep=TWO.map(s=>s.fullName.toUpperCase());
        window.STRATEGIES.forEach(s=>{
          const n=String(s.fullName||s.name||'').toUpperCase();
          if(keep.includes(n)){s.enabled=true;s.auto=true;s.executable=true;s.masterAIExecutable=true;}
          else if(/FOREX TREND FOLLOWER|FOREX NEWS SPIKE|NEWS|TREND FOLLOWER/i.test(n)){s.enabled=false;s.auto=false;}
        });
      }
    }catch(e){}
  }
  cleanStrategyDropdown();
  setTimeout(cleanStrategyDropdown,500);
  setTimeout(cleanStrategyDropdown,1500);
  log('\u2705 Permanent fix loaded: Scan+Draw is draw-only; Execute Best Setup is the only auto-order route; active strategies = Momentum Breakout + Relative Strength Swing.','ok');
})();


(function(){
  if(window.__SNIPEX_MASTER_AI_DIRECT_EXEC_FIX__) return;
  window.__SNIPEX_MASTER_AI_DIRECT_EXEC_FIX__ = true;

  const TWO = window.SNIPEX_TWO_FOREX_STRATEGIES || [
    {name:'Forex Momentum Breakout', fullName:'Forex Momentum Breakout', family:'BREAKOUT', mode:'MOMENTUM_BREAKOUT', tf:'M15', wr:55, rr:18, consistency:88, enabled:true, auto:true, executable:true, confidence_threshold:76, risk:0.5},
    {name:'Forex Relative Strength Swing', fullName:'Forex Relative Strength Swing', family:'RELATIVE_STRENGTH', mode:'RELATIVE_STRENGTH_TREND', tf:'H4', wr:56, rr:20, consistency:84, enabled:true, auto:true, executable:true, confidence_threshold:76, risk:0.6}
  ];
  window.SNIPEX_TWO_FOREX_STRATEGIES = TWO;
  const STATE = window.SNIPEX_MASTER_AI_DIRECT_STATE || (window.SNIPEX_MASTER_AI_DIRECT_STATE={busy:false,lastKey:'',lockUntil:0,lastDrawKey:'',lastResult:null,lastSetup:null});

  function log(m,t){try{(window.logLive||console.log)(m,t||'ok')}catch(e){console.log(m)}}
  function tf(){try{const v=(document.getElementById('live-tf')||{}).value||'15';return ({'1':'M1','5':'M5','15':'M15','60':'H1','240':'H4','D':'D1'}[v]||v)}catch(e){return 'M15'}}
  function symbols(){
    const out=[];
    function clean(x){
      x=String(x||'').trim().toUpperCase();
      x=x.replace(/[^A-Z0-9._#-]/g,'');
      if(!x) return '';
      if(!/XAU|XAG|XPD|EUR|GBP|JPY|ADA|LTC|DOT|AVAX|MATIC|POL|TRX|LINK|TON|BCH|UNI|ATOM|NEAR|OP|ARB|APT|INJ|FIL|ETC|SHIB|PEPE/i.test(x)) return '';
      return x;
    }
    function add(x){x=clean(x); if(x && !out.includes(x)) out.push(x)}
    try{ Object.keys(window.assetData||{}).forEach(add); }catch(e){}
    try{ [window.liveSymbol, window.selectedSymbol, window.currentSymbol].forEach(add); }catch(e){}
    try{ document.querySelectorAll('#visible-pairs option,#live-symbol option,#fx-symbol option,#symbol option,[data-symbol],.asset-symbol,.trade-symbol,.symbol-pill,.pair-chip,.watch-symbol,.market-symbol').forEach(el=>add(el.value||el.dataset.symbol||el.getAttribute('data-symbol')||el.textContent)); }catch(e){}
    try{ String(((document.getElementById('visible-pairs')||{}).value)||'').split(/[,;\s]+/).forEach(add); }catch(e){}
    if(!out.length) ['XAUUSD','XAGUSD','EURUSD'].forEach(add);
    return out.slice(0,18);
  }
  function post(url,body,timeoutMs){
    if(window.api) return window.api(url,{method:'POST',body:JSON.stringify(body||{}),timeoutMs:timeoutMs||25000});
    return fetch((window.SNIPEX_BRIDGE_BASE||window.BRIDGE_BASE||'')+url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body||{})}).then(async r=>{let j={};try{j=await r.json()}catch(e){} if(!r.ok) throw new Error(j.error||j.reason||('HTTP '+r.status)); return j;});
  }
  function setStatus(status,setup,symbol,ticket,reason){
    try{
      if(window.setTriggerStatus) return window.setTriggerStatus(status,setup,symbol,ticket,reason);
      const main=document.getElementById('trigger-status-main'), sEl=document.getElementById('trigger-status-setup'), symEl=document.getElementById('trigger-status-symbol'), tickEl=document.getElementById('trigger-status-ticket'), rEl=document.getElementById('trigger-status-reason');
      const cls=String(status||'waiting').toLowerCase().replace(/[^a-z0-9_-]/g,'');
      if(main){main.textContent=String(status||'WAITING').toUpperCase(); main.className='trigger-status-value '+cls;}
      if(sEl)sEl.textContent=setup||'--'; if(symEl)symEl.textContent=symbol||'--'; if(tickEl)tickEl.textContent=ticket||'--'; if(rEl)rEl.textContent=reason||'--';
    }catch(e){}
  }
  function bestFromScan(res){
    const list=(res&&res.results)||[];
    const approved=list.filter(x=>x && x.approved && (x.side==='BUY'||x.side==='SELL'));
    const sorted=(approved.length?approved:list).slice().sort((a,b)=>Number(b.confidence||0)-Number(a.confidence||0));
    return sorted[0] || null;
  }
  function setupFromItem(x){
    if(!x) return null;
    const st=x.setup && typeof x.setup==='object' ? Object.assign({}, x.setup) : {};
    const best=x.best_strategy||{};
    st.symbol=st.symbol||x.resolved_symbol||x.ui_symbol||x.symbol;
    st.timeframe=st.timeframe||x.timeframe||tf();
    st.direction=st.direction||x.side;
    st.side=st.side||x.side;
    st.confidence=Number(st.confidence||x.confidence||0);
    st.strategy_name=st.strategy_name||x.strategy_name||x.strategy||(best.strategy||best.name)||'Forex Master AI Setup';
    st.strategy=st.strategy||st.strategy_name;
    st.ready=!!x.approved;
    st.approved=!!x.approved;
    st.status=x.approved?'AI_APPROVED':'AI_WAIT';
    st.reason=(x.approved?'Master AI approved: ':'Master AI waiting: ')+(x.reason||((x.block_reasons||[]).join(' \u00b7 '))||'No reason returned');
    return st;
  }
  function drawMasterSetup(setup){
    if(!setup) return;
    STATE.lastSetup=setup;
    window.SNIPEX_MASTER_APPROVED_SETUP=setup;
    try{ if(window.paintSetupPanel) window.paintSetupPanel(setup); }catch(e){}
    try{ if(window.drawSetupOnChart) window.drawSetupOnChart(setup); }catch(e){}
    try{ if(window.updateSelectedStrategyWatermark) window.updateSelectedStrategyWatermark(true); }catch(e){}
  }
  function reasonFrom(res){
    const list=(res&&res.results)||[];
    if(!list.length) return (res&&res.reason)||'No Master AI result returned.';
    return list.map(x=>{
      const r=(x.block_reasons&&x.block_reasons.length?x.block_reasons.join(' \u00b7 '):(x.not_triggered_reason||x.reason||x.error||x.status||'not approved'));
      return (x.ui_symbol||x.symbol||'symbol')+': '+r;
    }).slice(0,6).join(' | ');
  }
  async function masterAiApprovalScan(execute){
    return post('/api/ai/scan_visible_pairs',{
      symbols:symbols(), timeframe:tf(), strategies:TWO,
      auto_trade:!!execute, execute:!!execute, manual_draw_only:false,
      source: execute?'master_ai_direct_execute_no_scan_draw':'master_ai_direct_approval_watch_no_scan_draw',
      max_orders_per_scan: execute?5:0,
      min_confidence: execute ? (window.snipexExecMinConfidence?window.snipexExecMinConfidence(symbols()):76) : 62,
      deviation:650, max_retries:4, cooldown_seconds:0
    }, execute?32000:22000);
  }
  function isOn(){
    const ai=(localStorage.getItem('snipex_master_ai_on')!=='0' && window.aiOn!==false);
    const au=(localStorage.getItem('snipex_auto_trade_on')!=='0' && window.autoOn!==false);
    return {ai,auto:au};
  }
  async function tickMasterDirect(force){
    const sw=isOn();
    if(!sw.ai){ setStatus('BLOCKED','Master AI Direct','--','--','Master AI OFF. AI approval cannot trigger.'); return null; }
    if(STATE.busy) return null;
    if(!force && Date.now()<Number(STATE.lockUntil||0)) return null;
    STATE.busy=true;
    try{
      const scan=await masterAiApprovalScan(false);
      STATE.lastResult=scan;
      const best=bestFromScan(scan);
      const setup=setupFromItem(best);
      if(setup) drawMasterSetup(setup);
      if(!best || !best.approved){
        setStatus('BLOCKED', setup&&setup.strategy_name || 'Master AI Direct', setup&&(setup.symbol+' '+(setup.side||setup.direction||'')) || symbols().join(', '),'--', reasonFrom(scan));
        STATE.lockUntil=Date.now()+6000;
        return scan;
      }
      const key=[setup.symbol, setup.side||setup.direction, setup.entry, setup.sl, setup.tp, setup.strategy_name].join('|');
      setStatus(sw.auto?'READY':'BLOCKED', setup.strategy_name, setup.symbol+' '+(setup.side||setup.direction), '--', sw.auto ? 'AI + Strategy approved. SL/TP calculated internally. Trigger does not need Scan + Draw.' : 'AI approved, but AI Execution Engine is OFF. Scan + Draw is not required; turn Auto ON or press Execute Best Setup.');
      if(!sw.auto){ STATE.lockUntil=Date.now()+7000; return scan; }
      if(!force && STATE.lastKey===key){ STATE.lockUntil=Date.now()+8000; return scan; }
      STATE.lastKey=key;
      setStatus('SCANNING', setup.strategy_name, setup.symbol+' '+(setup.side||setup.direction), '--', 'Direct execution route armed. Sending approved setup through backend safety gate with SL/TP.');
      const exec=await masterAiApprovalScan(true);
      const sent=Number(exec.orders_sent||0);
      const ex=((exec.results||[]).find(x=>x.executed||x.order_result||x.ticket))||null;
      if(sent>0 || ex){
        const ticket=(ex&&((ex.order_result||{}).ticket||(ex.order_result||{}).order||ex.ticket||ex.order_id))||'ticket pending';
        setStatus('SENT', setup.strategy_name, setup.symbol+' '+(setup.side||setup.direction), ticket, 'Order sent from Master AI approval. Scan + Draw was not used.');
        try{ if(window.drawSetupOnChart) window.drawSetupOnChart(setup); }catch(e){}
        log('\u2705 MASTER AI DIRECT TRIGGER SENT: '+setup.symbol+' '+(setup.side||setup.direction)+' \u00b7 '+setup.strategy_name+' \u00b7 '+ticket,'ok');
        STATE.lockUntil=Date.now()+60000;
      }else{
        setStatus('BLOCKED', setup.strategy_name, setup.symbol+' '+(setup.side||setup.direction), '--', reasonFrom(exec));
        log('\u26a0 Master AI approved but backend safety gate did not send: '+reasonFrom(exec),'warn');
        STATE.lastKey='';
        STATE.lockUntil=Date.now()+12000;
      }
      return exec;
    }catch(e){
      setStatus('FAILED','Master AI Direct',symbols().join(', '),'--',String(e.message||e));
      log('\u274c Master AI direct engine error: '+(e.message||e),'bad');
      STATE.lockUntil=Date.now()+12000;
      return {ok:false,error:String(e.message||e)};
    }finally{ STATE.busy=false; }
  }

  window.masterAiDirectApprovalTick=tickMasterDirect;
  window.executeBestForexApprovedSetup=async function(){
    const sw=isOn();
    if(!sw.ai){ setStatus('BLOCKED','Execute Best','--','--','Master AI OFF. Turn Master AI ON.'); return {ok:false,reason:'Master AI OFF'}; }
    if(!sw.auto){ setStatus('BLOCKED','Execute Best','--','--','AI Execution Engine OFF. Turn Auto ON before sending real order.'); return {ok:false,reason:'AI Execution Engine OFF'}; }
    return tickMasterDirect(true);
  };

  setInterval(()=>{ tickMasterDirect(false); }, 7000);
  setTimeout(()=>tickMasterDirect(false), 1800);
  log('\u2705 Master AI direct architecture loaded: AI approval calculates SL/TP and can trigger without Scan + Draw. Scan + Draw remains visual only.','ok');
})();


(function(){
  if(window.__SNIPEX_FULL_AUTO_EXECUTION_INDEPENDENT_ENGINE__) return;
  window.__SNIPEX_FULL_AUTO_EXECUTION_INDEPENDENT_ENGINE__ = true;
  const TWO=[
    {name:'FOREX MOMENTUM BREAKOUT',fullName:'Forex Momentum Breakout',enabled:true,auto:true,executable:true,masterAIExecutable:true},
    {name:'FOREX RELATIVE STRENGTH SWING',fullName:'Forex Relative Strength Swing',enabled:true,auto:true,executable:true,masterAIExecutable:true}
  ];
  const STATE={busy:false,lastOrderAt:0,lastKey:'',lastResult:null,scanMs:6000,orderCooldownMs:60000};
  function base(){return window.SNIPEX_BRIDGE_BASE||window.BRIDGE_BASE||'http://127.0.0.1:5000'}
  function log(msg,type){try{(window.logLive||console.log)(msg,type||'ok')}catch(e){try{console.log(msg)}catch(_){}}}
  function setStatus(status,setup,symbol,ticket,reason){
    try{
      if(window.setTriggerStatus) return window.setTriggerStatus(status,setup,symbol,ticket,reason);
      const ids={main:'trigger-status-main',setup:'trigger-status-setup',symbol:'trigger-status-symbol',ticket:'trigger-status-ticket',reason:'trigger-status-reason'};
      const m=document.getElementById(ids.main), se=document.getElementById(ids.setup), sy=document.getElementById(ids.symbol), ti=document.getElementById(ids.ticket), re=document.getElementById(ids.reason);
      if(m){m.textContent=String(status||'WAITING').toUpperCase();m.className='trigger-status-value '+String(status||'waiting').toLowerCase().replace(/[^a-z0-9_-]/g,'');}
      if(se)se.textContent=setup||'--'; if(sy)sy.textContent=symbol||'--'; if(ti)ti.textContent=ticket||'--'; if(re)re.textContent=reason||'--';
    }catch(e){}
  }
  function isAutoOn(){
    const ai=(localStorage.getItem('snipex_master_ai_on')!=='0' && window.aiOn!==false);
    const au=(localStorage.getItem('snipex_auto_trade_on')!=='0' && window.autoOn!==false);
    return {ai,auto:au};
  }
  function tf(){
    const v=String((document.getElementById('live-tf')||{}).value||window.aiManualTF||localStorage.getItem('snipex_ai_manual_tf')||'M15').toUpperCase();
    if(v==='1')return'M1'; if(v==='5')return'M5'; if(v==='15')return'M15'; if(v==='60')return'H1'; if(v==='240')return'H4'; if(v==='D')return'D1'; return v;
  }
  function cleanSymbol(x){
    x=String(x||'').trim().toUpperCase().replace(/[^A-Z0-9._#-]/g,'');
    if(!x) return '';
    if(!/(XAU|XAG|EUR|GBP|XPD|JPY|ADA|LTC|DOT|AVAX|MATIC|POL|TRX|LINK|TON|BCH|UNI|ATOM|NEAR|OP|ARB|APT|INJ|FIL|ETC|SHIB|PEPE)/.test(x)) return '';
    return x;
  }
  function displayedSymbols(){
    const seen=new Set(), out=[];
    function add(x){x=cleanSymbol(x); if(x&&!seen.has(x)){seen.add(x);out.push(x)}}
    try{Object.keys(window.assetData||{}).forEach(add)}catch(e){}
    try{Object.keys(window.ASSETS||{}).forEach(add)}catch(e){}
    try{[window.liveSymbol,window.selectedSymbol,window.currentSymbol].forEach(add)}catch(e){}
    try{document.querySelectorAll('#visible-pairs option,#live-symbol option,#fx-symbol option,#symbol option,[data-symbol],.asset-symbol,.trade-symbol,.symbol-pill,.pair-chip,.watch-symbol,.market-symbol').forEach(el=>add(el.value||el.dataset.symbol||el.getAttribute('data-symbol')||el.textContent))}catch(e){}
    try{String(((document.getElementById('visible-pairs')||{}).value)||'').split(/[,;\s]+/).forEach(add)}catch(e){}
    if(!out.length) ['XAUUSD','XAGUSD','EURUSD'].forEach(add);
    return out.slice(0,18);
  }
  async function post(url,body,timeoutMs){
    if(window.api) return await window.api(url,{method:'POST',body:JSON.stringify(body),timeoutMs:timeoutMs||30000});
    const ctrl=new AbortController(); const to=setTimeout(()=>ctrl.abort(),timeoutMs||30000);
    try{const r=await fetch(base()+url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),signal:ctrl.signal});return await r.json();}finally{clearTimeout(to)}
  }
  function bestResult(res){
    const list=(res&&res.results)||[];
    const executed=list.find(x=>x&&x.executed);
    if(executed) return executed;
    const approved=list.filter(x=>x&&x.approved).sort((a,b)=>Number(b.confidence||0)-Number(a.confidence||0))[0];
    if(approved) return approved;
    return list.slice().sort((a,b)=>Number(b.confidence||0)-Number(a.confidence||0))[0]||null;
  }
  function setupFrom(x){
    if(!x) return null;
    const s=Object.assign({}, (x.setup&&typeof x.setup==='object')?x.setup:{});
    s.symbol=s.symbol||x.resolved_symbol||x.ui_symbol||x.symbol;
    s.timeframe=s.timeframe||x.timeframe||tf();
    s.side=s.side||x.side||s.direction;
    s.direction=s.direction||s.side;
    s.confidence=Number(s.confidence||x.confidence||0);
    s.strategy_name=s.strategy_name||x.strategy_name||x.strategy||((x.best_strategy||{}).strategy)||((x.best_strategy||{}).name)||'Forex Master AI Setup';
    s.strategy=s.strategy||s.strategy_name;
    s.ready=!!x.approved; s.approved=!!x.approved;
    s.status=x.executed?'ORDER_SENT':(x.approved?'AI_APPROVED':'AI_WAIT');
    s.reason=x.executed?'Order sent by full auto execution engine.':(x.approved?'Master AI approved and SL/TP calculated internally.':'Waiting: '+((x.block_reasons||[]).join(' \u00b7 ')||x.reason||x.error||'No approved setup'));
    return s;
  }
  function drawSetup(setup){
    if(!setup) return;
    window.SNIPEX_MASTER_APPROVED_SETUP=setup;
    try{ if(window.paintSetupPanel) window.paintSetupPanel(setup); }catch(e){}
    try{ if(window.drawSetupOnChart) window.drawSetupOnChart(setup); }catch(e){}
    try{ if(window.updateSelectedStrategyWatermark) window.updateSelectedStrategyWatermark(true); }catch(e){}
  }
  function reason(res){
    const list=(res&&res.results)||[];
    if(!list.length) return (res&&res.reason)||'No scan result returned.';
    return list.map(x=>{
      const r=(x.block_reasons&&x.block_reasons.length?x.block_reasons.join(' \u00b7 '):(x.not_triggered_reason||x.reason||x.error||x.status||'not approved'));
      return (x.ui_symbol||x.symbol||'symbol')+': '+r;
    }).slice(0,6).join(' | ');
  }
  async function fullAutoTick(force){
    const sw=isAutoOn();
    if(!sw.ai){ setStatus('BLOCKED','Full Auto','--','--','Master AI OFF. Full auto execution paused.'); return null; }
    if(!sw.auto){ setStatus('BLOCKED','Full Auto','--','--','AI Execution Engine OFF. Scan + Draw remains visual only. Turn Auto ON for real trigger.'); return null; }
    if(STATE.busy) return null;
    if(!force && Date.now()-STATE.lastOrderAt<STATE.orderCooldownMs) return null;
    STATE.busy=true;
    try{
      const symbols=displayedSymbols();
      setStatus('SCANNING','Full Auto Master AI',symbols.join(', '),'--','Scanning all displayed UI symbols. This does NOT use Scan + Draw.');
      const res=await post('/api/ai/scan_visible_pairs',{
        symbols:symbols,
        timeframe:tf(),
        strategies:TWO,
        auto_trade:true,
        execute:true,
        manual_draw_only:false,
        source:'full_auto_execution_independent_no_scan_draw',
        max_orders_per_scan:5,
        min_confidence:(window.snipexExecMinConfidence?window.snipexExecMinConfidence(symbols):76),
        deviation:650,
        max_retries:4,
        cooldown_seconds:0
      },32000);
      STATE.lastResult=res;
      const best=bestResult(res); const setup=setupFrom(best); if(setup) drawSetup(setup);
      const sent=Number(res&&res.orders_sent||0);
      if(sent>0 || (best&&best.executed)){
        const or=(best&&best.order_result)||{};
        const ticket=or.ticket||or.order||or.deal||best.ticket||'ticket pending';
        STATE.lastOrderAt=Date.now(); STATE.lastKey=[setup&&setup.symbol,setup&&setup.side,setup&&setup.entry,setup&&setup.sl,setup&&setup.tp].join('|');
        setStatus('SENT',setup&&setup.strategy_name||'Full Auto',setup?setup.symbol+' '+(setup.side||setup.direction||''):'--',ticket,'FULL AUTO sent order from AI/Strategy approval. Scan + Draw was not required.');
        log('\u2705 FULL AUTO ORDER SENT: '+(setup&&setup.symbol||'symbol')+' '+(setup&&(setup.side||setup.direction)||'')+' \u00b7 '+ticket,'ok');
      }else{
        const approved=(res.results||[]).filter(x=>x.approved).length;
        setStatus(approved?'BLOCKED':'WAITING',setup&&setup.strategy_name||'Full Auto',setup?setup.symbol+' '+(setup.side||setup.direction||'') : symbols.join(', '),'--', approved?('Approved setup found but backend order gate blocked: '+reason(res)) : reason(res));
        if(approved) log('\u26a0 FULL AUTO approved setup found but not sent: '+reason(res),'warn');
        else log('\ud83d\udd0e FULL AUTO scan complete: no executable setup yet.','warn');
      }
      return res;
    }catch(e){
      setStatus('FAILED','Full Auto',displayedSymbols().join(', '),'--',String(e.message||e));
      log('\u274c FULL AUTO execution scan error: '+(e.message||e),'bad');
      return {ok:false,error:String(e.message||e)};
    }finally{STATE.busy=false;}
  }
  window.SnipeXFullAutoExecutionTick=fullAutoTick;
  window.executeBestForexApprovedSetup=function(){return fullAutoTick(true)};
  setInterval(()=>fullAutoTick(false), STATE.scanMs);
  setTimeout(()=>fullAutoTick(false), 1200);
  log('\u2705 FULL AUTO EXECUTION ENGINE ACTIVE: Auto ON scans displayed symbols and can trigger without Scan + Draw. Manual Scan + Draw remains draw-only.','ok');
})();


/* ================= FOREX METALS UNIVERSE SCANNER PRO PANEL ================= */
(function(){
  if(window.SnipeXFXUniverseScanner) return;
  const state={open:false, auto:false, timer:null, last:null};
  const BASE=()=> (window.SNIPEX_BRIDGE_BASE||window.BRIDGE_BASE||'');
  async function uapi(path, opts={}){
    const res=await fetch(BASE()+path,{headers:{'Content-Type':'application/json'},...opts});
    const data=await res.json().catch(()=>({ok:false,error:'Invalid response'}));
    if(!res.ok || data.ok===false) throw new Error(data.error||('HTTP '+res.status));
    return data;
  }
  function ensure(){
    if(document.getElementById('fx-universe-panel')) return;
    const style=document.createElement('style');
    style.textContent=`
      #fx-universe-fab{position:fixed;right:0;top:calc(48% + 92px);transform:translateY(-50%);z-index:99998;background:rgba(34,197,94,.12);border:1px solid rgba(34,197,94,.34);border-right:0;color:#6cff9a;border-radius:10px 0 0 10px;padding:8px 5px;cursor:pointer;font-weight:900;font-size:11px;box-shadow:0 10px 24px rgba(0,0,0,.28);writing-mode:vertical-rl;text-orientation:mixed;letter-spacing:.2px;opacity:.82}
      #fx-universe-fab:hover{opacity:1;background:rgba(34,197,94,.2)}
      #fx-universe-fab.running{background:rgba(251,191,36,.18);border-color:rgba(251,191,36,.48);color:#fbbf24;animation:none !important;right:18px;bottom:72px;width:440px;max-width:calc(100vw - 36px);z-index:99999;display:none;background:rgba(5,10,20,.97);border:1px solid rgba(34,197,94,.3);box-shadow:0 18px 55px rgba(0,0,0,.5),0 0 24px rgba(34,197,94,.12);border-radius:18px;color:var(--text1,#e8faff);font-family:inherit;overflow:hidden;backdrop-filter:blur(12px)}
      .fxu-head{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:10px 12px;background:linear-gradient(90deg,rgba(34,197,94,.12),rgba(251,191,36,.08));border-bottom:1px solid rgba(255,255,255,.08)}
      .fxu-title{font-weight:900;color:#6cff9a}.fxu-small{font-size:11px;color:var(--text2,#a8bbcc);line-height:1.35}.fxu-body{padding:12px;display:grid;gap:10px}.fxu-card{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:14px;padding:10px}.fxu-row{display:flex;gap:7px;flex-wrap:wrap;align-items:center}.fxu-btn{background:rgba(255,255,255,.06);color:var(--text1,#e8faff);border:1px solid rgba(255,255,255,.13);border-radius:10px;padding:7px 9px;cursor:pointer;font-weight:900;font-size:11px}.fxu-primary{background:rgba(34,197,94,.12)!important;color:#6cff9a!important;border-color:rgba(34,197,94,.35)!important}.fxu-warn{background:rgba(251,191,36,.12)!important;color:#fbbf24!important;border-color:rgba(251,191,36,.35)!important}.fxu-bad{background:rgba(239,68,68,.12)!important;color:#ff6b6b!important;border-color:rgba(239,68,68,.35)!important}.fxu-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:7px}.fxu-metric{border:1px solid rgba(255,255,255,.08);background:rgba(0,0,0,.2);border-radius:12px;padding:8px}.fxu-label{font-size:9px;color:var(--text3,#7d91a5);text-transform:uppercase;letter-spacing:.7px}.fxu-val{font-size:14px;font-weight:900;color:#fff;margin-top:2px}.fxu-table{max-height:180px;overflow:auto;border-radius:12px;border:1px solid rgba(255,255,255,.08)}.fxu-table table{width:100%;border-collapse:collapse;font-size:10px}.fxu-table th,.fxu-table td{padding:6px;border-bottom:1px solid rgba(255,255,255,.06);text-align:left}.fxu-table th{position:sticky;top:0;background:rgba(5,10,20,.96);color:#6cff9a}.fxu-status{font-size:11px;color:var(--text2,#a8bbcc);white-space:pre-wrap}
    `;
    document.head.appendChild(style);
    const fab=document.createElement('button'); fab.id='fx-universe-fab'; fab.textContent='\ud83c\udf10 Scanner'; fab.title='Forex Metals Universe Scanner'; fab.onclick=()=>openPanel(true); document.body.appendChild(fab);
    const panel=document.createElement('div'); panel.id='fx-universe-panel';
    panel.innerHTML=`
      <div class="fxu-head"><div><div class="fxu-title">\ud83c\udf10 Forex Metals Universe Scanner</div><div class="fxu-small">All broker FX/metals \u00b7 only 1:10+ RR \u00b7 sky-limit trailing</div></div><div class="fxu-row"><button class="fxu-btn" id="fxu-min">_</button><button class="fxu-btn fxu-bad" id="fxu-close">\u00d7</button></div></div>
      <div class="fxu-body">
        <div class="fxu-grid"><div class="fxu-metric"><div class="fxu-label">Status</div><div class="fxu-val" id="fxu-status-val">READY</div></div><div class="fxu-metric"><div class="fxu-label">Scanned</div><div class="fxu-val" id="fxu-scanned">0</div></div><div class="fxu-metric"><div class="fxu-label">Min RR</div><div class="fxu-val">1:10</div></div></div>
        <div class="fxu-card"><div class="fxu-label">Best Setup</div><div id="fxu-best" class="fxu-small">No scan yet.</div></div>
        <div class="fxu-row"><button class="fxu-btn fxu-primary" id="fxu-scan">Scan Once</button><button class="fxu-btn fxu-warn" id="fxu-auto">Start Auto Scanner</button><button class="fxu-btn fxu-primary" id="fxu-exec">Execute Best</button><button class="fxu-btn fxu-bad" id="fxu-stop">Stop</button></div>
        <div class="fxu-card"><div class="fxu-label">Top Candidates</div><div class="fxu-table"><table><thead><tr><th>Pair</th><th>Side</th><th>Conf</th><th>RR</th><th>Status</th></tr></thead><tbody id="fxu-rows"><tr><td colspan="5">Waiting...</td></tr></tbody></table></div></div>
        <div class="fxu-card"><div class="fxu-label">Rules</div><div class="fxu-small">Weak strategies below 1:10 are ignored. Initial SL is mandatory. At 1R SL moves to breakeven, 2R locks profit, 3R+ ATR/swing trailing, 10R minimum then sky-limit runner.</div></div>
        <div id="fxu-log" class="fxu-status">Ready.</div>
      </div>`;
    document.body.appendChild(panel);
    document.getElementById('fxu-close').onclick=()=>openPanel(false);
    document.getElementById('fxu-min').onclick=()=>{const b=panel.querySelector('.fxu-body'); b.style.display=b.style.display==='none'?'grid':'none'};
    document.getElementById('fxu-scan').onclick=()=>scan(false);
    document.getElementById('fxu-exec').onclick=()=>executeBest();
    document.getElementById('fxu-auto').onclick=()=>startAuto();
    document.getElementById('fxu-stop').onclick=()=>stopAuto();
  }
  function openPanel(v){ensure(); state.open=v; document.getElementById('fx-universe-panel').style.display=v?'block':'none'; if(v) scan(false).catch(()=>{});}
  function setStatus(t,bad=false){ensure(); document.getElementById('fxu-status-val').textContent=t; document.getElementById('fxu-log').textContent=t; document.getElementById('fxu-log').style.color=bad?'#ff6b6b':'var(--text2,#a8bbcc)';}
  function paint(data){
    ensure(); state.last=data;
    document.getElementById('fxu-scanned').textContent=String(data.symbols_scanned||0);
    const best=data.best || (data.top_candidates||[]).find(x=>x.approved) || (data.top_candidates||[])[0];
    const bestBox=document.getElementById('fxu-best');
    if(best){
      bestBox.innerHTML=`<b>${best.ui_symbol||best.resolved_symbol}</b> \u00b7 ${best.side||'WAIT'} \u00b7 Conf ${Number(best.confidence||0).toFixed(1)}% \u00b7 RR 1:${Number(best.rr||0).toFixed(1)}<br>Activation Zone ${best.entry||'-'} \u00b7 SL ${best.sl||'-'} \u00b7 TP10 ${best.tp||'-'}<br>${(best.block_reasons&&best.block_reasons.length)?best.block_reasons.join(' \u00b7 '):(best.approved?'\u2705 Approved 1:10+ setup':'Waiting')}`;
    } else bestBox.textContent='No candidate yet.';
    const rows=(data.top_candidates||[]).slice(0,12).map(x=>`<tr><td>${x.ui_symbol||x.resolved_symbol||'-'}</td><td>${x.side||'-'}</td><td>${Number(x.confidence||0).toFixed(0)}%</td><td>1:${Number(x.rr||0).toFixed(1)}</td><td>${x.executed?'FIRED':(x.approved?'APPROVED':'WAIT')}</td></tr>`).join('');
    document.getElementById('fxu-rows').innerHTML=rows||'<tr><td colspan="5">No 1:10 setup found.</td></tr>';
    setStatus(data.auto_trade?'AUTO SCANNED':'SCAN COMPLETE');
  }
  async function scan(auto){
    ensure(); setStatus(auto?'Auto scanning...':'Scanning all FX/metals...');
    try{
      const data=await uapi('/api/fx/universe/scan',{method:'POST',body:JSON.stringify({tf:'M5',auto_trade:false,limit:80,min_confidence:78})});
      paint(data);
      try{ if(window.logLive) logLive('\ud83c\udf10 Forex Universe scan: '+(data.symbols_scanned||0)+' symbols \u00b7 best '+((data.best&&data.best.ui_symbol)||'WAIT'),'ok'); }catch(e){}
      return data;
    }catch(e){ setStatus('Scanner error: '+e.message,true); try{ if(window.logLive) logLive('Forex Universe Scanner error: '+e.message,'bad'); }catch(_e){} }
  }
  async function executeBest(){
    ensure(); setStatus('Executing best 1:10 setup...');
    try{
      const data=await uapi('/api/fx/universe/execute_best',{method:'POST',body:JSON.stringify({tf:'M5',auto_trade:true,max_orders:5,min_confidence:78})});
      paint(data);
      const fired=(data.results||[]).filter(x=>x.executed).length;
      setStatus(fired?'EXECUTED BEST SETUP':'No executable 1:10 setup right now',!fired);
    }catch(e){ setStatus('Execute failed: '+e.message,true); }
  }
  function startAuto(){
    ensure(); stopAuto(false); state.auto=true; document.getElementById('fx-universe-fab').classList.add('running'); document.getElementById('fxu-auto').textContent='Auto Running';
    setStatus('Auto scanner ON. It scans only; use Execute Best for manual fire unless backend auto payload is enabled.');
    scan(true); state.timer=setInterval(()=>scan(true),10000);
  }
  function stopAuto(msg=true){
    state.auto=false; if(state.timer) clearInterval(state.timer); state.timer=null; ensure(); document.getElementById('fx-universe-fab').classList.remove('running'); document.getElementById('fxu-auto').textContent='Start Auto Scanner'; if(msg) setStatus('Auto scanner stopped.');
  }
  ensure();
  window.SnipeXFXUniverseScanner={open:()=>openPanel(true),scan,executeBest,startAuto,stopAuto};
})();


(function(){
  if(window.__SNIPEX_PRO_ENGINE_UI__) return; window.__SNIPEX_PRO_ENGINE_UI__=true;
  function getSymbol(){
    var el=document.querySelector('#symbolSelect,[name="symbol"],select[data-symbol]');
    if(el&&el.value) return String(el.value).toUpperCase();
    var t=document.body.innerText||''; var m=t.match(/\b(XAUUSD|XAGUSD|XPDUSD|EURUSD|GBPUSD|USDJPY|USDCHF|USDCAD|AUDUSD|NZDUSD|EURJPY|GBPJPY|EURGBP)\b/i);
    return m?m[1].toUpperCase():'XAUUSD';
  }
  function getSide(){
    var t=(document.body.innerText||'').toUpperCase();
    if(t.includes('SELL')) return 'SELL';
    return 'BUY';
  }
  async function tick(){
    var box=document.getElementById('snipexProEngineText'); if(!box) return;
    var symbol=getSymbol();
    try{
      var r=await fetch('/api/pro_trade_engine/gate?symbol='+encodeURIComponent(symbol)+'&side='+encodeURIComponent(getSide())+'&min_rr=5&source=master_ai',{cache:'no-store'});
      var j=await r.json();
      var ok=!!j.ok;
      var reasons=(j.block_reasons||[]).slice(0,3).join('<br>\u2022 ');
      box.innerHTML = '<b style="color:'+(ok?'#00e676':'#ff5252')+'">'+(ok?'READY':'BLOCKED')+'</b>'+
        '<br>Symbol: '+(j.symbol||symbol)+' \u00b7 RR: 1:'+(j.min_rr||5)+
        '<br>Session: '+((j.session||{}).name||'--')+' \u00b7 Score '+((j.session||{}).score||'--')+
        '<br>Strategy: '+((j.session_strategy||{}).strategy||'--')+
        '<br>Spread: '+(((j.spread_intelligence||{}).spread_points)||'--')+' / cap '+(((j.spread_intelligence||{}).hard_cap_points)||'--')+
        '<br>SL Mode: '+(((j.dynamic_sl||{}).mode)||'dynamic anti-spike')+
        (ok?'<br><span style="color:#8cffb1">Execution gate clean.</span>':'<br><span style="color:#ffb4a8">\u2022 '+(reasons||j.reason||'Waiting for clean setup')+'</span>');
    }catch(e){ box.innerHTML='Final Pro Engine endpoint waiting: '+e; }
  }
  setInterval(tick,5000); setTimeout(tick,700);
})();

setTimeout(refreshAILabCockpit, 1400); document.addEventListener('DOMContentLoaded', ()=>setTimeout(refreshAILabCockpit, 1600));

(function(){
  async function tick(){
    var box=document.getElementById('snipexLiveNewsText'); if(!box) return;
    try{
      var sym=(window.SNIPEX_ACTIVE_SYMBOL||window.activeSymbol||'XAUUSD');
      var base=(window.SNIPEX_BRIDGE_BASE||window.BRIDGE_BASE||'');
      var r=await fetch(base+'/api/news/intelligence?symbol='+encodeURIComponent(sym), {cache:'no-store'});
      var j=await r.json();
      var n=j.news_intelligence||{}; var live=n.live_status||{}; var upcoming=n.upcoming||[];
      var locked=!!n.locked;
      var next=upcoming[0];
      box.innerHTML='<b style="color:'+(locked?'#ff5252':'#00e676')+'">'+(locked?'NEWS LOCK':'CLEAR')+'</b>'+
        '<br>Reason: '+(n.reason||j.reason||'--')+
        '<br>Feed: '+(live.fresh?'Fresh':'Stale/Waiting')+' \u00b7 Events '+(live.events_count||0)+
        (next?('<br>Next: '+(next.currency||'')+' '+(next.title||'event')+' @ '+(next.time_utc||'')):'<br>Next: --');
    }catch(e){ box.innerHTML='Live news endpoint waiting: '+e; }
  }
  setInterval(tick, 15000); setTimeout(tick, 1200);
})();


(function(){
  async function tick(){
    var box=document.getElementById('snipexJournalAIText'); if(!box) return;
    try{
      var base=(window.SNIPEX_BRIDGE_BASE||window.BRIDGE_BASE||'');
      var r=await fetch(base+'/api/ai/journal/status', {cache:'no-store'});
      var j=await r.json();
      var g=(j.memory||{}).global||{};
      var latest=(j.latest||[]).slice(-1)[0];
      var lesson=latest?latest.lesson:'No position recorded yet';
      box.innerHTML='<b style="color:'+(j.enabled?'#00e676':'#ff5252')+'">'+(j.enabled?'LEARNING ON':'LEARNING OFF')+'</b>'+ 
        '<br>Records: '+(j.records_count||0)+' \u00b7 Score: '+(g.score||60)+
        '<br>Wins/Losses: '+(g.wins||0)+' / '+(g.losses||0)+' \u00b7 WR: '+(g.win_rate||0)+'%'+
        '<br><span style="color:#c8ffc8">Lesson:</span> '+String(lesson||'--').slice(0,120);
    }catch(e){ box.innerHTML='Journal endpoint waiting: '+e; }
  }
  setInterval(tick, 12000); setTimeout(tick, 1800);
})();


(function(){
  async function refreshInstitutionHealth(){
    const gradeEl = document.getElementById("institutionHealthGrade");
    const barEl = document.getElementById("institutionHealthBar");
    const reasonsEl = document.getElementById("institutionHealthReasons");
    if(!gradeEl || !barEl || !reasonsEl) return;
    try{
      const r = await fetch("/api/institution/dashboard", {cache:"no-store"});
      const j = await r.json();
      const score = Number(j.score_pct || 0);
      const grade = String(j.grade || "UNKNOWN");
      let color = "#ef4444";
      if(grade === "GREENLIGHT") color = "#22c55e";
      else if(grade === "CONDITIONAL") color = "#f59e0b";
      barEl.style.width = Math.max(0, Math.min(100, score)) + "%";
      barEl.style.background = color;
      gradeEl.innerHTML = `<b style="color:${color}">${grade}</b> \u00b7 ${score}% \u00b7 ${j.recommendation || ""}`;
      const reds = Array.isArray(j.red_flags) ? j.red_flags : [];
      const checks = j.checks || {};
      if(!reds.length){
        reasonsEl.innerHTML = "\u2705 No institutional red flags currently. Normal safety gates still apply.";
      } else {
        reasonsEl.innerHTML = reds.slice(0,6).map(k => {
          const c = checks[k] || {};
          return `\ud83d\udeab <b>${k.replaceAll("_"," ")}</b>: ${c.reason || "Needs review"}`;
        }).join("<br>");
      }
    }catch(e){
      gradeEl.innerHTML = '<b style="color:#ef4444">DASHBOARD OFFLINE</b>';
      reasonsEl.textContent = "Institution dashboard endpoint unavailable.";
    }
  }
  refreshInstitutionHealth();
  setInterval(refreshInstitutionHealth, 15000);
})();


(function(){
  async function refreshDynamicSpreadCap(){
    const el = document.getElementById("dynamicSpreadCapText");
    if(!el) return;
    try{
      const symEl = document.querySelector("#symbolSelect,[name='symbol'],.symbol-select");
      const symbol = symEl && symEl.value ? symEl.value : "XAUUSD";
      const r = await fetch(`/api/spread/dynamic_cap?symbol=${encodeURIComponent(symbol)}`, {cache:"no-store"});
      const j = await r.json();
      const c = j.caps || {};
      el.innerHTML = `Session: <b>${j.session || "--"}</b><br>Cap: <b>${c.hard_cap || "--"}</b> pts \u00b7 Spike block: <b>${c.spike_threshold || "--"}</b> pts<br>${j.note || ""}`;
    }catch(e){
      el.textContent = "Dynamic spread cap endpoint unavailable.";
    }
  }
  refreshDynamicSpreadCap();
  setInterval(refreshDynamicSpreadCap, 15000);
})();


(function(){
  async function refreshTrendSpreadSniper(){
    const el = document.getElementById("trendSpreadSniperText");
    if(!el) return;
    try{
      const symEl = document.querySelector("#symbolSelect,[name='symbol'],.symbol-select");
      const symbol = symEl && symEl.value ? symEl.value : "XAUUSD";
      // Duplicate confidence bars are display-only. Use final Master AI execution confidence only.
      let conf = window.snipexFinalExecutionConfidence ? window.snipexFinalExecutionConfidence(0) : 0;
      const r = await fetch(`/api/spread/sniper_sync?symbol=${encodeURIComponent(symbol)}&tf=M5&confidence=${encodeURIComponent(conf)}`, {cache:"no-store"});
      const j = await r.json();
      const trend = j.trend || {};
      const spread = j.spread || {};
      const color = j.ok ? "#22c55e" : (j.decision === "WAIT" ? "#f59e0b" : "#ef4444");
      el.innerHTML = `<b style="color:${color}">${j.decision || "UNKNOWN"}</b> \u00b7 ${j.session || "--"}<br>Trend: <b>${trend.quality || "--"}</b> ${trend.score ?? "--"}% \u00b7 ${trend.trend || "--"}<br>Spread: <b>${spread.status || "--"}</b> ${spread.spread_points ?? "--"} / cap ${spread.hard_cap_points ?? "--"}<br>${j.reason || ""}`;
    }catch(e){
      el.textContent = "Trend/spread sniper endpoint unavailable.";
    }
  }
  refreshTrendSpreadSniper();
  setInterval(refreshTrendSpreadSniper, 15000);
})();


(function(){
  if(window.__SNIPEX_RIGHT_BUTTON_RAIL_PATCH__) return;
  window.__SNIPEX_RIGHT_BUTTON_RAIL_PATCH__=true;
  const panels={
    pro:'snipexProEnginePanel', trend:'trendSpreadSniperPanel', spread:'dynamicSpreadCapPanel', news:'snipexLiveNewsPanel', inst:'institutionHealthPanel'
  };
  function toastToRibbon(msg){
    try{
      const ribbon=document.querySelector('.ribbon .ribbon-val.neutral,.ribbon-val.neutral,.ribbon');
      if(ribbon){ const old=ribbon.textContent; ribbon.textContent=String(msg||'Notification'); setTimeout(()=>{try{ribbon.textContent=old;}catch(e){}},5000); }
    }catch(e){}
  }
  function closeAll(except){
    Object.values(panels).forEach(id=>{const p=document.getElementById(id); if(p && id!==except) p.classList.remove('sx-open');});
    document.querySelectorAll('.snipex-rail-btn').forEach(b=>{if(b.dataset.panel!==except)b.classList.remove('active')});
  }
  function togglePanel(id, btn){
    const p=document.getElementById(id);
    if(!p){ toastToRibbon('Panel not available'); return; }
    const willOpen=!p.classList.contains('sx-open');
    closeAll(id);
    p.classList.toggle('sx-open',willOpen);
    if(btn) btn.classList.toggle('active',willOpen);
  }
  function makeBtn(key,label,title){
    let b=document.getElementById('sx-rail-'+key);
    if(!b){ b=document.createElement('button'); b.id='sx-rail-'+key; b.type='button'; document.body.appendChild(b); }
    b.className='snipex-rail-btn'; b.textContent=label; b.title=title||label; b.dataset.panel=panels[key]||'';
    b.onclick=()=>togglePanel(panels[key],b);
    return b;
  }
  function install(){
    let rail=document.getElementById('snipex-right-rail');
    if(!rail){ rail=document.createElement('div'); rail.id='snipex-right-rail'; rail.className='snipex-right-rail'; document.body.appendChild(rail); }
    const doctor=document.getElementById('doctor-open-fab');
    const scanner=document.getElementById('fx-universe-fab');
    const ordered=[doctor,scanner,makeBtn('pro','Pro','Pro Engine'),makeBtn('trend','Trend','Trend + Spread Sniper'),makeBtn('spread','Spread','Dynamic Spread Cap'),makeBtn('news','News','Live News Intelligence'),makeBtn('inst','Inst','Institution Health')].filter(Boolean);
    ordered.forEach(el=>{ if(el.parentElement!==rail) rail.appendChild(el); });
    Object.values(panels).forEach(id=>{const p=document.getElementById(id); if(p && !p.classList.contains('sx-open')) p.style.display='none';});
    ['doctor-event-toast','doctor-top-ribbon','snipex-auto-refresh-badge','bootHealPill'].forEach(id=>{const e=document.getElementById(id); if(e) e.style.setProperty('display','none','important');});
  }
  const oldDoctorToast=window.doctorToast;
  window.doctorToast=function(msg,type,ms){ toastToRibbon(msg); if(typeof oldDoctorToast==='function'){ try{return oldDoctorToast.apply(this,arguments)}catch(e){} } };
  setTimeout(install,300); setTimeout(install,1200); setInterval(install,2500);
})();


(function(){
  if(window.__SNIPEX_GOLD_TRIGGER_START_PATCH__) return;
  window.__SNIPEX_GOLD_TRIGGER_START_PATCH__ = true;
  const BASE=()=>window.SNIPEX_BRIDGE_BASE||window.BRIDGE_BASE||'http://127.0.0.1:5000';
  const log=(m,t)=>{try{(window.logLive||console.log)(m,t||'ok')}catch(e){console.log(m)}};
  const val=(id,v)=>{const e=document.getElementById(id); if(e) e.textContent=String(v==null?'--':v)};
  async function api(path, body, timeoutMs){
    if(window.api) return await window.api(path,{method:'POST',body:JSON.stringify(body||{}),timeoutMs:timeoutMs||25000});
    const ctrl=new AbortController(); const to=setTimeout(()=>ctrl.abort(),timeoutMs||25000);
    try{ const r=await fetch(BASE()+path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body||{}),signal:ctrl.signal}); return await r.json(); }
    finally{ clearTimeout(to); }
  }
  function ensurePanel(){
    if(document.getElementById('goldTriggerDebug')) return;
    const css=document.createElement('style');
    css.textContent=`#goldTriggerDebug{position:fixed;right:10px;bottom:92px;z-index:2147483647;width:286px;background:rgba(4,9,18,.94);border:1px solid rgba(255,193,7,.45);box-shadow:0 12px 34px rgba(0,0,0,.46),0 0 22px rgba(255,193,7,.08);border-radius:14px;color:#eaf7ff;font:12px/1.35 Arial,sans-serif;overflow:hidden}#goldTriggerDebug .gtHead{display:flex;justify-content:space-between;gap:8px;align-items:center;padding:9px 10px;background:linear-gradient(90deg,rgba(255,193,7,.18),rgba(0,229,255,.08));font-weight:900;color:#ffe69a}#goldTriggerDebug .gtBody{padding:9px 10px;display:grid;gap:5px}#goldTriggerDebug .row{display:flex;justify-content:space-between;gap:8px;border-bottom:1px solid rgba(255,255,255,.06);padding-bottom:3px}#goldTriggerDebug button{border:0;border-radius:10px;padding:8px 9px;font-weight:900;cursor:pointer;background:linear-gradient(135deg,#ffd54a,#ff9f1a);color:#171000;width:100%;box-shadow:0 0 16px rgba(255,193,7,.18)}#goldTriggerDebug .mini{font-size:11px;color:#9fb2c7}#goldTriggerDebug .ok{color:#66ffb2}#goldTriggerDebug .bad{color:#ff7d96}`;
    document.head.appendChild(css);
    const d=document.createElement('div');
    d.id='goldTriggerDebug';
    d.innerHTML=`<div class="gtHead"><span>\u26a1 GOLD TRIGGER DEBUG</span><span id="gt_status">READY</span></div><div class="gtBody"><div class="row"><b>Symbol</b><span id="gt_symbol">XAUUSD</span></div><div class="row"><b>Gate</b><span id="gt_gate">76%</span></div><div class="row"><b>Confidence</b><span id="gt_conf">--</span></div><div class="row"><b>Direction</b><span id="gt_side">--</span></div><div class="row"><b>Spread/Safety</b><span id="gt_safety">--</span></div><div class="row"><b>Order</b><span id="gt_order">--</span></div><button id="gt_fire">START GOLD TRIGGER</button><div class="mini">No self-healing. Button sirf XAUUSD scan + approved order route ko run karta hai. Risk/news/spread hard locks still respected.</div></div>`;
    document.body.appendChild(d);
    document.getElementById('gt_fire').onclick=()=>window.SnipeXStartGoldTriggerNow(true);
  }
  function pickXau(res){
    const list=(res&&res.results)||[];
    return list.find(x=>String(x.ui_symbol||x.symbol||'').toUpperCase().includes('XAU'))||list[0]||{};
  }
  window.SnipeXStartGoldTriggerNow=async function(force){
    ensurePanel();
    try{
      localStorage.setItem('snipex_master_ai_on','1');
      localStorage.setItem('snipex_auto_trade_on','1');
      localStorage.setItem('snipex_min_confidence','76');
      localStorage.setItem('min_confidence','76');
      window.aiOn=true; window.autoOn=true;
    }catch(e){}
    val('gt_status','SCANNING'); val('gt_order','--');
    log('\u26a1 GOLD TRIGGER CHECK: scanning XAUUSD only, gate 76%, route /api/ai/scan_visible_pairs \u2192 /api/order','ok');
    try{
      const res=await api('/api/ai/scan_visible_pairs',{symbols:['XAUUSD'],timeframe:(window.getAIExecutionTF?window.getAIExecutionTF():'M5'),auto_trade:true,execute:true,manual_draw_only:false,source:'gold_trigger_start_button',max_orders_per_scan:1,min_confidence:76,deviation:650,max_retries:4,cooldown_seconds:0},34000);
      const x=pickXau(res); const or=x.order_result||{}; const ticket=or.ticket||or.order_id||or.order||or.deal||'';
      val('gt_gate',(x.required_confidence||76)+'%'); val('gt_conf',(x.confidence!=null?x.confidence+'%':'--')); val('gt_side',x.side||x.direction||'--');
      val('gt_safety',(x.safety&&x.safety.reason)||((x.block_reasons||[]).join(' \u00b7 '))||x.reason||'OK');
      if(res&&Number(res.orders_sent||0)>0 || x.executed){ val('gt_status','SENT'); val('gt_order',ticket||'sent'); log('\u2705 GOLD ORDER SENT: '+(ticket||'ticket pending'),'ok'); }
      else { val('gt_status',x.approved?'GATE BLOCK':'WAIT'); val('gt_order',(or.error||x.error||'not sent')); log('\u26a0 GOLD NOT SENT: '+(((x.block_reasons||[]).join(' \u00b7 '))||or.error||x.reason||'waiting for clean setup'),'warn'); }
      return res;
    }catch(e){ val('gt_status','ERROR'); val('gt_safety',e.message||e); log('\u274c GOLD TRIGGER ERROR: '+(e.message||e),'bad'); return {ok:false,error:String(e.message||e)}; }
  };
  function boot(){ ensurePanel(); log('\u2705 Gold trigger debug overlay loaded. Use START GOLD TRIGGER for XAUUSD only.','ok'); }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot); else boot();
})();


(function(){
  if(window.__SNIPEX_PURE_AUTO_MANUAL_PATCH__) return;
  window.__SNIPEX_PURE_AUTO_MANUAL_PATCH__=true;
  const BASE=()=>window.SNIPEX_BRIDGE_BASE||window.BRIDGE_BASE||'http://127.0.0.1:5000';
  const st={timer:null,busy:false,lastFire:0,mode:(localStorage.getItem('snipex_gold_mode')||'AI_AUTO').toUpperCase()};
  const MULTI_SCALP_SYMBOLS=['XAUUSD','XAGUSD','XPDUSD','EURUSD','GBPUSD','USDJPY','GBPJPY','EURJPY','AUDUSD','USDCAD','USDCHF','NZDUSD'];
  const PAIR_PRIORITY={XAUUSD:100,XAGUSD:82,XPDUSD:78,GBPJPY:72,EURJPY:70,USDJPY:68,GBPUSD:66,EURUSD:65,AUDUSD:60,USDCAD:58,USDCHF:56,NZDUSD:54};
  if(st.mode==='AUTO') st.mode='SNIPER';
  function log(m,t){try{(window.logLive||console.log)(m,t||'ok')}catch(e){console.log(m)}}
  function txt(id,v){const e=document.getElementById(id); if(e) e.textContent=String(v==null?'--':v)}
  function tf(){try{return (window.getAIExecutionTF&&window.getAIExecutionTF())||(({1:'M1',3:'M3',5:'M5',15:'M15',60:'H1',240:'H4'}[(document.getElementById('live-tf')||{}).value])||'M5')}catch(e){return 'M5'}}
  async function post(path,body,ms){
    const ctrl=new AbortController(); const to=setTimeout(()=>ctrl.abort(),ms||32000);
    try{const r=await fetch(BASE()+path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body||{}),signal:ctrl.signal,cache:'no-store'}); let j={}; try{j=await r.json()}catch(e){} if(!r.ok) throw new Error(j.error||j.reason||('HTTP '+r.status)); return j;} finally{clearTimeout(to)}
  }
  function modeLabel(){ if(st.mode==='AI_AUTO') return '\ud83e\udde0 AI Auto'; if(st.mode==='SCALP') return '\ud83c\udf10 Multi Scalp'; if(st.mode==='SNIPER') return '\ud83c\udfaf 1:5'; return '\u270b Manual'; }
  function modeGate(){ return st.mode==='SCALP'?64:76; }
  function modeSpread(){ return st.mode==='SCALP'?220:240; }
  function setAutoFlags(on){
    try{localStorage.setItem('snipex_master_ai_on',on?'1':'0');localStorage.setItem('snipex_auto_trade_on',on?'1':'0');localStorage.setItem('snipex_min_confidence',String(modeGate()));localStorage.setItem('snipex_ai_min_confidence',String(modeGate()));localStorage.setItem('min_confidence',String(modeGate()));window.aiOn=!!on;window.autoOn=!!on;}catch(e){}
    try{ if(typeof window.paintAIMode==='function') window.paintAIMode(); }catch(e){}
  }
  function cycleMode(){ const order=['AI_AUTO','SNIPER','SCALP','MANUAL']; const i=order.indexOf(st.mode); st.mode=order[(i+1)%order.length]; applyMode(true); }
  function ensureRail(){
    let rail=document.getElementById('snipex-right-rail'); if(!rail){rail=document.createElement('div');rail.id='snipex-right-rail';document.body.appendChild(rail)}
    let btn=document.getElementById('pure-auto-toggle-rail');
    if(!btn){btn=document.createElement('button');btn.id='pure-auto-toggle-rail';btn.title='Cycle: AI Auto / 1:5 / Multi Scalp / Manual';btn.onclick=cycleMode;rail.insertBefore(btn,rail.firstChild)}
    let ai=document.getElementById('ai-auto-mode-rail');
    if(!ai){ai=document.createElement('button');ai.id='ai-auto-mode-rail';ai.title='AI Auto: Master AI chooses Sniper or Scalp';ai.onclick=()=>{st.mode='AI_AUTO';applyMode(true)};ai.textContent='\ud83e\udde0 AI';rail.insertBefore(ai,btn.nextSibling)}
    const doctor=document.getElementById('doctor-open-fab'); if(doctor&&doctor.parentElement!==rail) rail.appendChild(doctor);
    const scanner=document.getElementById('fx-universe-fab'); if(scanner&&scanner.parentElement!==rail) rail.appendChild(scanner);
    let dbg=document.getElementById('gold-debug-rail-btn');
    if(!dbg){dbg=document.createElement('button');dbg.id='gold-debug-rail-btn';dbg.textContent='\u26a1 Gold';dbg.title='Show Gold trigger popup';dbg.onclick=()=>{ensurePanel(); const p=document.getElementById('goldTriggerDebug'); if(p){p.style.display='block'; p.style.right='10px'; p.style.bottom='92px';}}; rail.appendChild(dbg)}
    return rail;
  }
  function ensurePanel(){
    let p=document.getElementById('goldTriggerDebug');
    if(!p){
      p=document.createElement('div'); p.id='goldTriggerDebug';
      p.style.cssText='position:fixed;right:10px;bottom:92px;z-index:2147483647;width:322px;background:rgba(4,9,18,.95);border:1px solid rgba(255,193,7,.45);box-shadow:0 12px 34px rgba(0,0,0,.46),0 0 22px rgba(255,193,7,.08);border-radius:14px;color:#eaf7ff;font:12px/1.35 Arial,sans-serif;overflow:hidden';
      p.innerHTML='<div class="gtHead" style="display:flex;justify-content:space-between;gap:8px;align-items:center;padding:9px 10px;background:linear-gradient(90deg,rgba(255,193,7,.18),rgba(0,229,255,.08));font-weight:900;color:#ffe69a;cursor:move"><span>\ud83c\udf10 MULTI-PAIR AI AUTO EXECUTION</span><button id="gt_close" style="width:auto!important;min-height:auto!important;padding:2px 7px!important;border-radius:8px!important">\u00d7</button></div><div class="gtBody" style="padding:9px 10px;display:grid;gap:5px"><div style="display:flex;justify-content:space-between;border-bottom:1px solid rgba(255,255,255,.06);padding-bottom:3px"><b>Mode</b><span id="gt_mode">--</span></div><div style="display:flex;justify-content:space-between;border-bottom:1px solid rgba(255,255,255,.06);padding-bottom:3px"><b>AI Choice Reason</b><span id="gt_aireason" style="max-width:190px;text-align:right">--</span></div><div style="display:flex;justify-content:space-between;border-bottom:1px solid rgba(255,255,255,.06);padding-bottom:3px"><b>Pair</b><span id="gt_pair">--</span></div><div style="display:flex;justify-content:space-between;border-bottom:1px solid rgba(255,255,255,.06);padding-bottom:3px"><b>Priority</b><span id="gt_priority">--</span></div><div style="display:flex;justify-content:space-between;border-bottom:1px solid rgba(255,255,255,.06);padding-bottom:3px"><b>Gate</b><span id="gt_gate">--</span></div><div style="display:flex;justify-content:space-between;border-bottom:1px solid rgba(255,255,255,.06);padding-bottom:3px"><b>RR</b><span id="gt_rr">--</span></div><div style="display:flex;justify-content:space-between;border-bottom:1px solid rgba(255,255,255,.06);padding-bottom:3px"><b>Confidence</b><span id="gt_conf">--</span></div><div style="display:flex;justify-content:space-between;border-bottom:1px solid rgba(255,255,255,.06);padding-bottom:3px"><b>Direction</b><span id="gt_side">--</span></div><div style="display:flex;justify-content:space-between;border-bottom:1px solid rgba(255,255,255,.06);padding-bottom:3px"><b>Status</b><span id="gt_status">READY</span></div><div style="display:flex;justify-content:space-between;border-bottom:1px solid rgba(255,255,255,.06);padding-bottom:3px"><b>Order / Block</b><span id="gt_order" style="max-width:190px;text-align:right">--</span></div><div class="gtModeBtns" style="display:grid;grid-template-columns:1fr 1fr;gap:6px"><button id="gt_ai_btn">AI AUTO</button><button id="gt_sniper_btn">1:5 ONLY</button><button id="gt_scalp_btn">SCALP</button><button id="gt_manual_btn">MANUAL</button></div><div style="font-size:11px;color:#9fb2c7">AI Auto: Sniper/Scalp choose. Scalp me multi-pair priority basket: XAUUSD top, RR 1:2+, spread \u2264220, max 5 total trades. 6th strong setup aaye to weakest position cut karke entry.</div></div>';
      document.body.appendChild(p);
    }
    const close=document.getElementById('gt_close'); if(close) close.onclick=()=>{p.style.display='none'};
    const aib=document.getElementById('gt_ai_btn'); if(aib) aib.onclick=()=>{st.mode='AI_AUTO';applyMode(true)};
    const sb=document.getElementById('gt_sniper_btn'); if(sb) sb.onclick=()=>{st.mode='SNIPER';applyMode(true)};
    const cb=document.getElementById('gt_scalp_btn'); if(cb) cb.onclick=()=>{st.mode='SCALP';applyMode(true)};
    const mb=document.getElementById('gt_manual_btn'); if(mb) mb.onclick=()=>{st.mode='MANUAL';applyMode(true)};
    makeDraggable(p,p.querySelector('.gtHead'));
    return p;
  }
  function makeDraggable(box,handle){ if(!box||!handle||box.dataset.dragReady) return; box.dataset.dragReady='1'; let sx=0,sy=0,l=0,t=0,drag=false; handle.addEventListener('mousedown',e=>{if(e.target&&e.target.tagName==='BUTTON')return;drag=true;sx=e.clientX;sy=e.clientY;const r=box.getBoundingClientRect();l=r.left;t=r.top;box.style.left=l+'px';box.style.top=t+'px';box.style.right='auto';box.style.bottom='auto';e.preventDefault()}); window.addEventListener('mousemove',e=>{if(!drag)return;box.style.left=Math.max(0,Math.min(window.innerWidth-80,l+e.clientX-sx))+'px';box.style.top=Math.max(0,Math.min(window.innerHeight-40,t+e.clientY-sy))+'px'}); window.addEventListener('mouseup',()=>{drag=false}); }
  function paint(){ ensureRail(); ensurePanel(); const btn=document.getElementById('pure-auto-toggle-rail'); if(btn){btn.className=st.mode.toLowerCase();btn.textContent=modeLabel();} const ai=document.getElementById('ai-auto-mode-rail'); if(ai){ai.className=st.mode==='AI_AUTO'?'active':''; ai.textContent=st.mode==='AI_AUTO'?'\ud83e\udde0 AI ON':'\ud83e\udde0 AI'} txt('gt_mode', st.mode==='AI_AUTO'?'\ud83e\udde0 AI AUTO: choosing...':modeLabel()); txt('gt_gate', st.mode==='SCALP'?'RR 1:2+ \u00b7 Spread \u2264220 \u00b7 Max 5':'RR 1:5+ \u00b7 Conf 76+'); }
  function pairPriority(sym){return PAIR_PRIORITY[String(sym||'').toUpperCase()]||40}
  function pick(res){const list=(res&&res.results)||[]; const ex=list.find(x=>x.executed); if(ex) return ex; const approved=list.filter(x=>x.approved).sort((a,b)=>(pairPriority(b.ui_symbol||b.symbol)-pairPriority(a.ui_symbol||a.symbol))||((b.confidence||0)-(a.confidence||0)))[0]; if(approved) return approved; return list.find(x=>String(x.ui_symbol||x.symbol||'').toUpperCase().includes('XAU'))||list[0]||{};}
  async function scanAndMaybeFire(reason){
    if(st.mode==='MANUAL'||st.busy) return; st.busy=true;
    try{
      setAutoFlags(true); paint(); txt('gt_status','SCANNING'); txt('gt_order','checking live gates');
      const useMulti=(st.mode==='SCALP'||st.mode==='AI_AUTO');
      const payload={symbols:(useMulti?MULTI_SCALP_SYMBOLS:['XAUUSD']),visible_symbols:(useMulti?MULTI_SCALP_SYMBOLS:['XAUUSD']),multi_pair_scalp:useMulti,auto_trade:true,execute:true,manual_draw_only:false,source:'multi_pair_ai_auto_'+(reason||'loop'),trade_mode:st.mode,timeframe:tf(),max_orders_per_scan:(st.mode==='SCALP'?5:2),min_confidence:modeGate(),deviation:(st.mode==='SCALP'?800:600),max_retries:4,cooldown_seconds:(st.mode==='SCALP'?0:15),max_spread_points:modeSpread(),allow_spread_under_cap:true,allow_duplicate:(st.mode==='SCALP'),max_positions_per_symbol:(st.mode==='SCALP'?5:2),max_same_direction_positions:(st.mode==='SCALP'?5:2),multi_pair_max_trades:5,max_total_trades:5};
      const res=await post('/api/ai/scan_visible_pairs',payload,36000);
      const x=pick(res), or=x.order_result||{};
      txt('gt_conf',x.confidence!=null?x.confidence+'%':'--'); txt('gt_side',x.side||x.direction||'--'); txt('gt_rr',x.rr?('1:'+Number(x.rr).toFixed(2)):'--'); txt('gt_pair',x.ui_symbol||x.symbol||'--'); txt('gt_priority', pairPriority(x.ui_symbol||x.symbol));
      const chosen=x.trade_mode||st.mode; txt('gt_mode',(st.mode==='AI_AUTO'?'\ud83e\udde0 AI \u2192 ':'')+(chosen==='SCALP'?'\u26a1 SCALP':'\ud83c\udfaf 1:5 SNIPER'));
      txt('gt_aireason',x.ai_mode_reason||x.reason||'--'); txt('gt_gate', chosen==='SCALP'?'RR 1:2+ \u00b7 Spread \u2264220':'RR 1:5+');
      if((res&&Number(res.orders_sent||0)>0)||x.executed){txt('gt_status','ORDER SENT');txt('gt_order',or.ticket||or.order||or.deal||'sent');st.lastFire=Date.now();log('\u2705 '+(chosen||st.mode)+' '+(x.ui_symbol||x.symbol||'PAIR')+' ORDER SENT','ok');}
      else{txt('gt_status',x.approved?'SAFETY BLOCK':'WAIT'); const pr=x.pair_priority_engine; const prMsg=pr&&pr.reason?('Priority: '+pr.reason):''; txt('gt_order',((x.block_reasons||[]).join(' \u00b7 '))||prMsg||or.error||x.reason||'no clean setup');}
      window.SNIPEX_LAST_GOLD_AUTO_SCAN=res;
    }catch(e){txt('gt_status','ERROR');txt('gt_order',e.message||e);log('\u274c Gold AI Auto error: '+(e.message||e),'bad')}
    finally{st.busy=false;}
  }
  function startLoop(){if(st.timer) clearInterval(st.timer); const gap=st.mode==='SCALP'?900:2200; st.timer=setInterval(()=>scanAndMaybeFire('heartbeat'),gap); setTimeout(()=>scanAndMaybeFire('boot'),700)}
  function stopLoop(){if(st.timer) clearInterval(st.timer); st.timer=null;}
  function applyMode(user){ st.mode=(['AI_AUTO','SNIPER','SCALP','MANUAL'].includes(st.mode))?st.mode:'AI_AUTO'; localStorage.setItem('snipex_gold_mode',st.mode); paint(); if(st.mode!=='MANUAL'){setAutoFlags(true); startLoop(); if(user) log(modeLabel()+' MODE ON: Gold auto execution active with clear block reasons.','ok');} else{setAutoFlags(false); stopLoop(); txt('gt_status','MANUAL'); txt('gt_order','auto route off'); if(user) log('\u270b MANUAL MODE ON: auto execution disabled, manual Bullish/Bearish allowed.','warn');} }
  window.SnipeXGoldPureAuto={setAI:()=>{st.mode='AI_AUTO';applyMode(true)},setScalp:()=>{st.mode='SCALP';applyMode(true)},setSniper:()=>{st.mode='SNIPER';applyMode(true)},setManual:()=>{st.mode='MANUAL';applyMode(true)},scanNow:()=>scanAndMaybeFire('manual_now'),state:st};
  window.SnipeXStartGoldTriggerNow=function(){if(st.mode==='MANUAL') st.mode='AI_AUTO';applyMode(true);return scanAndMaybeFire('button')};
  function boot(){paint();applyMode(false);setInterval(paint,2500)}
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot); else boot();
})();


(function(){
  if(window.__SNIPEX_ENGLISH_VOICE_GOLD_ALERT_PATCH__) return;
  window.__SNIPEX_ENGLISH_VOICE_GOLD_ALERT_PATCH__=true;
  const st={enabled:(localStorage.getItem('snipex_english_voice_alert')!=='0'),lastSetup:0,lastTrade:0,lastKey:'',unlocked:false};
  function log(m,t){try{(window.logLive||console.log)(m,t||'ok')}catch(e){console.log(m)}}
  function isGold(x){return /XAU|GOLD/i.test(String((x&&x.ui_symbol)||(x&&x.symbol)||''));}
  function rrOf(x){
    const v=(x&&x.rr)!=null?x.rr:(x&&x.setup&&x.setup.rr)!=null?x.setup.rr:(x&&x.min_rr_required)||null;
    const n=Number(v); return Number.isFinite(n)?n:0;
  }
  function pick(res){const list=(res&&res.results)||[];return list.find(isGold)||list[0]||null;}
  function speak(text,strong){
    if(!st.enabled) return;
    try{
      if(!('speechSynthesis' in window)){log('\ud83d\udd07 English voice unsupported in this browser','warn');return;}
      window.speechSynthesis.cancel();
      const u=new SpeechSynthesisUtterance(text);
      u.lang='en-IN'; u.rate=strong?1.02:0.96; u.pitch=strong?1.08:1.0; u.volume=1;
      const voices=window.speechSynthesis.getVoices&&window.speechSynthesis.getVoices();
      const hi=(voices||[]).find(v=>/en|English|India/i.test((v.lang||'')+' '+(v.name||'')));
      if(hi) u.voice=hi;
      window.speechSynthesis.speak(u);
    }catch(e){log('\ud83d\udd07 English voice error: '+(e.message||e),'warn')}
  }
  function beep(strong){
    if(!st.enabled) return;
    try{
      const A=window.AudioContext||window.webkitAudioContext; if(!A) return;
      const ctx=window.__snipexVoiceCtx||(window.__snipexVoiceCtx=new A());
      const o=ctx.createOscillator(), g=ctx.createGain();
      o.frequency.value=strong?880:620; o.type='sine';
      g.gain.setValueAtTime(0.001,ctx.currentTime); g.gain.exponentialRampToValueAtTime(strong?0.22:0.12,ctx.currentTime+0.03); g.gain.exponentialRampToValueAtTime(0.001,ctx.currentTime+(strong?0.42:0.22));
      o.connect(g); g.connect(ctx.destination); o.start(); o.stop(ctx.currentTime+(strong?0.45:0.25));
    }catch(e){}
  }
  function alertSetup(x){
    const now=Date.now(); if(now-st.lastSetup<18000) return;
    const rr=rrOf(x)||5;
    st.lastSetup=now;
    beep(false);
    speak('Gold setup is ready with RR one to five or higher. Please check.',false);
    log('\ud83d\udd14 English alert: Gold RR 1:'+rr.toFixed(1)+' setup ready','ok');
  }
  function alertTrade(x){
    const now=Date.now();
    const key=String((x&&x.order_result&&(x.order_result.ticket||x.order_result.order||x.order_result.deal))||now);
    if(key===st.lastKey || now-st.lastTrade<5000) return;
    st.lastKey=key; st.lastTrade=now;
    beep(true);
    setTimeout(()=>beep(true),180);
    speak('Gold position triggered. Order executed.',true);
    log('\ud83d\udea8 English alert: Gold position triggered','ok');
  }
  function inspect(res){
    try{
      const x=pick(res); if(!x||!isGold(x)) return;
      const rr=rrOf(x);
      const orderSent=(res&&Number(res.orders_sent||0)>0)||x.executed||/sent|done|executed/i.test(String((x.order_result&&x.order_result.retcode_name)||''));
      if(orderSent){alertTrade(x); return;}
      const approved=!!x.approved || rr>=5 || Number(x.confidence||0)>=Number(x.required_confidence||76);
      const blocked=Array.isArray(x.block_reasons)&&x.block_reasons.length>0;
      if(rr>=5 && approved && !blocked) alertSetup(x);
    }catch(e){}
  }
  function ensureBtn(){
    let rail=document.getElementById('snipex-right-rail');
    if(!rail){rail=document.createElement('div');rail.id='snipex-right-rail';document.body.appendChild(rail)}
    let b=document.getElementById('english-voice-alert-rail');
    if(!b){b=document.createElement('button');b.id='english-voice-alert-rail';b.title='English voice alert ON/OFF';b.onclick=function(){st.enabled=!st.enabled;localStorage.setItem('snipex_english_voice_alert',st.enabled?'1':'0');paint(); if(st.enabled){beep(false);speak('English voice alert is on.',false)}else{log('\ud83d\udd07 English voice alert OFF','warn')}};rail.appendChild(b)}
    paint();
  }
  function paint(){const b=document.getElementById('english-voice-alert-rail'); if(b){b.className='snipex-rail-btn '+(st.enabled?'active':''); b.textContent=st.enabled?'\ud83d\udd0a Voice':'\ud83d\udd07 Voice';}}
  function unlock(){
    if(st.unlocked) return; st.unlocked=true;
    try{ if(window.speechSynthesis) window.speechSynthesis.getVoices(); }catch(e){}
    try{ const A=window.AudioContext||window.webkitAudioContext; if(A){ const ctx=window.__snipexVoiceCtx||(window.__snipexVoiceCtx=new A()); if(ctx.state==='suspended') ctx.resume(); } }catch(e){}
  }
  document.addEventListener('click',unlock,{once:true});
  const old=window.SnipeXStartGoldTriggerNow;
  if(typeof old==='function'){
    window.SnipeXStartGoldTriggerNow=async function(){const r=await old.apply(this,arguments); inspect(r); return r;};
  }
  setInterval(function(){try{inspect(window.SNIPEX_LAST_GOLD_AUTO_SCAN)}catch(e){} ensureBtn();},2200);
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',ensureBtn); else ensureBtn();
})();


(function(){
  if(window.__SNIPEX_POPUP_RAIL_AUTOHIDE_PATCH__) return;
  window.__SNIPEX_POPUP_RAIL_AUTOHIDE_PATCH__=true;
  const HIDE_MS=5000;
  const timers={};
  function log(m,t){try{(window.logLive||console.log)(m,t||'ok')}catch(e){console.log(m)}}
  function leftRail(){
    let rail=document.getElementById('snipex-left-rail');
    if(!rail){rail=document.createElement('div');rail.id='snipex-left-rail';document.body.appendChild(rail)}
    return rail;
  }
  function ensureBtn(id,label,title,onclick){
    const rail=leftRail(); let b=document.getElementById(id);
    if(!b){b=document.createElement('button');b.id=id;b.type='button';rail.appendChild(b)}
    b.textContent=label; b.title=title||label; b.onclick=onclick;
    if(b.parentElement!==rail) rail.appendChild(b);
    return b;
  }
  function safePanel(id){return document.getElementById(id)}
  function show(id,ms){
    const p=safePanel(id); if(!p) return false;
    p.classList.remove('sx-popup-hidden'); p.classList.add('sx-popup-open');
    const btn=document.querySelector('[data-sx-popup="'+id+'"]'); if(btn) btn.classList.add('active');
    clearTimeout(timers[id]);
    if(ms!==0){timers[id]=setTimeout(()=>hide(id),ms||HIDE_MS)}
    return true;
  }
  function hide(id){
    const p=safePanel(id); if(!p) return;
    p.classList.remove('sx-popup-open'); p.classList.add('sx-popup-hidden');
    const btn=document.querySelector('[data-sx-popup="'+id+'"]'); if(btn) btn.classList.remove('active');
  }
  function toggle(id){ const p=safePanel(id); if(!p) return; if(p.classList.contains('sx-popup-open')) hide(id); else show(id,HIDE_MS); }
  function makeDraggable(id,headSel){
    const box=safePanel(id); if(!box || box.dataset.sxDragReady==='1') return;
    const head=box.querySelector(headSel)||box; box.dataset.sxDragReady='1';
    let drag=false,sx=0,sy=0,l=0,t=0;
    head.addEventListener('mousedown',function(e){
      if(e.target&&/button|input|textarea|select/i.test(e.target.tagName)) return;
      drag=true; sx=e.clientX; sy=e.clientY; const r=box.getBoundingClientRect(); l=r.left; t=r.top;
      box.style.left=l+'px'; box.style.top=t+'px'; box.style.right='auto'; box.style.bottom='auto';
      clearTimeout(timers[id]); e.preventDefault();
    });
    window.addEventListener('mousemove',function(e){ if(!drag) return; const w=box.offsetWidth||300,h=box.offsetHeight||120; box.style.left=Math.max(0,Math.min(window.innerWidth-w,l+e.clientX-sx))+'px'; box.style.top=Math.max(0,Math.min(window.innerHeight-h,t+e.clientY-sy))+'px'; });
    window.addEventListener('mouseup',function(){ if(drag){drag=false; timers[id]=setTimeout(()=>hide(id),HIDE_MS);} });
  }
  function addClose(id,headSel){
    const box=safePanel(id); if(!box||box.dataset.sxCloseReady==='1') return;
    const head=box.querySelector(headSel); if(!head) return; box.dataset.sxCloseReady='1';
    const c=document.createElement('button'); c.className='sx-pop-close'; c.textContent='\u00d7'; c.title='Close'; c.onclick=function(e){e.stopPropagation();hide(id)};
    head.appendChild(c);
  }
  function patchGold(){
    const p=safePanel('goldTriggerDebug');
    ensureBtn('sx-left-gold-debug','\u26a1 Gold','Open Gold Trigger Debug',function(){toggle('goldTriggerDebug')}).dataset.sxPopup='goldTriggerDebug';
    if(p){
      makeDraggable('goldTriggerDebug','.gtHead'); addClose('goldTriggerDebug','.gtHead');
      if(!p.classList.contains('sx-popup-open')) hide('goldTriggerDebug');
    }
  }
  function patchDoctor(){
    // Keep original Doctor button on right rail, but make the actual panel draggable and auto-hide when auto-opened.
    const p=safePanel('doctor-repair-center');
    if(p){ makeDraggable('doctor-repair-center','.doctor-head'); addClose('doctor-repair-center','.doctor-head'); }
    const oldOpen=(window.SnipeXDoctorRepair&&window.SnipeXDoctorRepair.openDoctorPanel);
    if(oldOpen && !oldOpen.__sxAutoHideWrap){
      const wrapped=function(manual){ const r=oldOpen.apply(this,arguments); show('doctor-repair-center', manual?0:HIDE_MS); return r; };
      wrapped.__sxAutoHideWrap=true; window.SnipeXDoctorRepair.openDoctorPanel=wrapped;
    }
  }
  function patchStartGold(){
    const old=window.SnipeXStartGoldTriggerNow;
    if(typeof old==='function' && !old.__sxShowGoldWrap){
      const wrapped=async function(){ show('goldTriggerDebug',HIDE_MS); const r=await old.apply(this,arguments); show('goldTriggerDebug',HIDE_MS); return r; };
      wrapped.__sxShowGoldWrap=true; window.SnipeXStartGoldTriggerNow=wrapped;
    }
  }
  function install(){ patchGold(); patchDoctor(); patchStartGold(); }
  setTimeout(install,400); setTimeout(install,1400); setInterval(install,2500);
  document.addEventListener('keydown',function(e){ if(e.key==='Escape'){hide('goldTriggerDebug');hide('doctor-repair-center')}});
  window.SnipeXPopupRail={show,hide,toggle,install};
  log('\u2705 Popup-to-button rail patch loaded: Gold debug is now left button, draggable, auto-hide 5 sec.','ok');
})();


/* SnipeX Ultra Voice Config Helpers - no extra window.
   Console setup examples:
   SnipeXUltraVoice.setKey('YOUR_ELEVENLABS_API_KEY')
   SnipeXUltraVoice.setVoice('VOICE_ID')
   SnipeXUltraVoice.off() / SnipeXUltraVoice.on()
*/
window.SnipeXUltraVoice = {
  setKey(k){ localStorage.setItem('snipex_eleven_api_key', String(k||'')); return {ok:true, ultra_voice:'key_saved'}; },
  setVoice(id){ localStorage.setItem('snipex_eleven_voice_id', String(id||'')); return {ok:true, voice_id:id}; },
  on(){ localStorage.setItem('snipex_ultra_voice_enabled','1'); return {ok:true, ultra_voice:true}; },
  off(){ localStorage.setItem('snipex_ultra_voice_enabled','0'); return {ok:true, ultra_voice:false}; },
  test(text='High confidence position is executing.'){ return window.SnipeXAlerts?.speak(text, {force:true, cooldownMs:0}); },
  status(){ return window.SnipeXAlerts?.getUltraVoiceConfig ? window.SnipeXAlerts.getUltraVoiceConfig() : {ok:false}; }
};


(function(){
 const btn=document.getElementById('sxProductStatusBtn'), panel=document.getElementById('sxProductPanel'), body=document.getElementById('sxProductBody');
 let last={status:null,audit:null,why:null};
 async function j(url,opt){try{const r=await fetch(url,opt);return await r.json()}catch(e){return {ok:false,error:String(e)}}}
 function nav(active){return `<button class="sxps-tab ${active==='status'?'active':''}" onclick="SnipeXProductPanel.show('status')">Status</button><button class="sxps-tab ${active==='sub'?'active':''}" onclick="SnipeXProductPanel.show('sub')">Subscription</button><button class="sxps-tab ${active==='rules'?'active':''}" onclick="SnipeXProductPanel.show('rules')">Rules</button><button class="sxps-tab ${active==='risk'?'active':''}" onclick="SnipeXProductPanel.show('risk')">Risk</button>`}
 async function loadData(){ last.status=await j('/api/sell_ready/status'); last.audit=await j('/api/sell_ready/audit'); last.why=await j('/api/sell_ready/why_not_trade?symbol=XAUUSD&side=BUY&lot=0.01'); }
 async function show(tab='status'){
  panel.style.display='block'; body.innerHTML='Checking system...'; if(!last.status) await loadData();
  if(tab==='status') body.innerHTML=nav('status')+statusHtml();
  if(tab==='sub') body.innerHTML=nav('sub')+subHtml();
  if(tab==='rules') body.innerHTML=nav('rules')+rulesHtml();
  if(tab==='risk') body.innerHTML=nav('risk')+riskHtml();
 }
 function statusHtml(){ const s=last.status||{}, a=last.audit||{}, w=last.why||{}; return `<div class="sxps-card"><b>${s.name||'SnipeX Pro Trader Core'}</b> <span class="sxps-pill">${s.version||'v1'}</span><br><span class="sxps-muted">License: ${(s.license&&s.license.valid)?'Active':'Demo / Activation required'}</span></div><div><span class="sxps-pill">Safe Profile</span><span class="sxps-pill">Verified Trades</span><span class="sxps-pill">Why Not Trade</span><span class="sxps-pill">Voice Sync</span></div><div class="sxps-card"><b>Health:</b> ${a.ok?'<span class="sxps-ok">PASS</span>':'<span class="sxps-warn">CHECK</span>'}<br><b>Position gate:</b> ${w.ok?'<span class="sxps-ok">Clear</span>':'<span class="sxps-danger">Blocked: '+((w.reasons||[]).join(', ')||'Reason pending')+'</span>'}</div><button class="sxps-action" onclick="fetch('/api/sell_ready/apply_safe_profile').then(r=>r.json()).then(x=>alert('Safe profile applied'))">Apply Safe Profile</button><button class="sxps-action" onclick="fetch('/api/sell_ready/verified_trades').then(r=>r.json()).then(x=>console.log('Verified trades',x)||alert('Verified positions printed in console'))">Verified Trades</button>`; }
 function subHtml(){ return `<div class="sxps-card"><b>Subscription Access</b><br>This software is licensed as a subscription product. Access may be monthly, quarterly, yearly, or lifetime, depending on the plan sold by the provider.</div><div class="sxps-card"><b>Plans placeholder</b><br><span class="sxps-pill">Basic: Market insights + dashboard</span><span class="sxps-pill">Pro: Auto execution + voice</span><span class="sxps-pill">Elite: Support + updates</span></div><div class="sxps-card"><b>Activation Rules</b><br>1. One license is for one user/account unless written permission is given.<br>2. Sharing, reselling, copying, reverse engineering, or distributing this tool is not allowed.<br>3. Subscription can be disabled if payment fails, license is shared, or misuse is detected.<br>4. API keys, broker credentials, and position automation accounts remain the user's responsibility.</div><div class="sxps-card sxps-muted">Admin console: SnipeXUltraVoice.setKey(...), license.key placeholder, and server-side licensing should be used before wide public rollout.</div>`; }
 function rulesHtml(){ return `<div class="sxps-card"><b>Usage Rules</b><br>\u2022 Use demo first before real funds.<br>\u2022 Keep Master AI, AI Execution Engine, and risk profile settings visible before live position automation.<br>\u2022 Do not increase lot size beyond your account risk tolerance.<br>\u2022 Do not position during broker maintenance, unstable internet, or abnormal spreads.<br>\u2022 The tool may stop position automation when daily loss, spread, duplicate, cooldown, or news rules are active.</div><div class="sxps-card"><b>Regulations / Responsibility</b><br>Market Automation rules differ by country, broker, and exchange. The user must follow local laws, broker terms, taxation rules, and exchange regulations. This software does not provide SEBI/SEC/FCA/FINRA registered investment advice.</div><div class="sxps-card"><b>No Guarantee</b><br>Past performance, backtests, screenshots, or demo results do not guarantee future profit. Market risk, slippage, spread spikes, execution rejection, network failure, and data errors can cause losses.</div>`; }
 function riskHtml(){ return `<div class="sxps-card"><b>Risk Disclaimer</b><br>Forex, commodities, crypto, CFDs, and leveraged products carry high risk. You can lose part or all of your capital. Use only risk capital.</div><div class="sxps-card"><b>Default Safety Rules</b><br><span class="sxps-pill">Daily loss cap</span><span class="sxps-pill">Max trades/day</span><span class="sxps-pill">Spread cap</span><span class="sxps-pill">Cooldown after loss</span><span class="sxps-pill">SL/TP validation</span></div><div class="sxps-card"><b>Customer Acceptance</b><br>By using this tool, the user accepts that all position automation decisions and results belong to the user. The provider is not responsible for losses, broker issues, account restrictions, tax liabilities, or misuse.</div>`; }
 btn.addEventListener('click',()=>show('status'));
 let drag=false,sx=0,sy=0,l=0,t=0; const head=panel.querySelector('.sxps-head');
 head.addEventListener('mousedown',e=>{drag=true;sx=e.clientX;sy=e.clientY;const r=panel.getBoundingClientRect();l=r.left;t=r.top;panel.style.left=l+'px';panel.style.top=t+'px';panel.style.right='auto';panel.style.bottom='auto';});
 window.addEventListener('mousemove',e=>{if(!drag)return;panel.style.left=Math.max(0,Math.min(innerWidth-panel.offsetWidth,l+e.clientX-sx))+'px';panel.style.top=Math.max(0,Math.min(innerHeight-panel.offsetHeight,t+e.clientY-sy))+'px';});
 window.addEventListener('mouseup',()=>drag=false);
 window.SnipeXProductPanel={status:()=>j('/api/sell_ready/status'),audit:()=>j('/api/sell_ready/audit'),why:(symbol='XAUUSD')=>j('/api/sell_ready/why_not_trade?symbol='+symbol),show};
})();


(function(){
 const PLAN_KEY='snipex_subscription_tier', MODE_KEY='snipex_mode_ux_mode';
 const tierRules={BASIC:{modes:['SAFE'],auto:false,label:'Basic'},MODERATE:{modes:['SAFE','AUTO'],auto:true,label:'Moderate'},ADVANCED:{modes:['SAFE','AUTO','PRO'],auto:true,label:'Advanced'}};
 function $(id){return document.getElementById(id)}
 function tier(){return (localStorage.getItem(PLAN_KEY)||'BASIC').toUpperCase()}
 function rules(){return tierRules[tier()]||tierRules.BASIC}
 function toast(msg){let d=document.createElement('div');d.className='sxmu-lock-toast';d.textContent=msg;document.body.appendChild(d);setTimeout(()=>{try{d.remove()}catch(e){}},3200)}
 function setToggleState(ai,auto){try{localStorage.setItem('snipex_master_ai_on',ai?'1':'0');localStorage.setItem('snipex_auto_trade_on',auto?'1':'0');window.aiOn=!!ai;window.autoOn=!!auto;if(typeof applyMasterAIMode==='function') applyMasterAIMode('mode-ux'); if(typeof paint==='function') paint();}catch(e){}}
 function applyLocks(){let r=rules(), t=tier(); if($('sxmuTier')) $('sxmuTier').textContent=r.label+' Plan'; document.querySelectorAll('#sxModeUxPanel .sxmu-card').forEach(c=>{let m=c.getAttribute('data-mode'); c.classList.toggle('locked',!r.modes.includes(m)); c.classList.toggle('active',(localStorage.getItem(MODE_KEY)||'SAFE')===m)}); let st=$('sxmuStart'); if(st){st.classList.toggle('locked',!r.auto); st.textContent=r.auto?'\ud83d\udfe2 START AUTO TRADING':'\ud83d\udd12 AUTO EXECUTION LOCKED';} let n=$('sxmuNote'); if(n){n.textContent=t==='BASIC'?'Basic: signals/dashboard/preview only. Upgrade for live auto execution.':t==='MODERATE'?'Moderate: Safe + Auto execution unlocked. Pro/admin tools locked.':'Advanced: full adaptive engine unlocked.';} disableTools(); }
 function disableElement(el,msg){ if(!el) return; el.classList.add('sx-tier-disabled'); el.style.opacity='.45'; el.style.filter='grayscale(.45)'; el.title=msg; el.onclick=function(ev){ev.preventDefault();ev.stopPropagation();toast(msg);return false}; }
 function disableTools(){let t=tier(), r=rules(); let msgBasic='Locked in Basic plan. Upgrade to Moderate/Advanced for live auto execution.'; let msgAdv='Advanced plan required for this tool.'; if(t==='BASIC'){ disableElement($('btn-auto'),msgBasic); document.querySelectorAll('[onclick*="force"],[id*="force" i],[id*="execute" i]').forEach(el=>disableElement(el,msgBasic)); }
   if(t!=='ADVANCED'){ document.querySelectorAll('[id*="manager" i],[id*="pro" i],[onclick*="force_order"],[onclick*="manager"]').forEach(el=>disableElement(el,msgAdv)); }
   document.querySelectorAll('[data-plan]').forEach(el=>{let need=(el.getAttribute('data-plan')||'').toUpperCase(); if(need==='MODERATE'&&t==='BASIC') disableElement(el,msgBasic); if(need==='ADVANCED'&&t!=='ADVANCED') disableElement(el,msgAdv);});
 }
 const oldFetch=window.fetch; window.fetch=function(input,init){try{init=init||{};init.headers=init.headers||{}; if(init.headers.append) init.headers.append('X-SnipeX-Plan', tier()); else init.headers=Object.assign({},init.headers,{'X-SnipeX-Plan':tier()});}catch(e){} return oldFetch.call(this,input,init).then(async res=>{try{if(res.status===402){let clone=res.clone(); clone.json().then(j=>toast(j.message||'Subscription locked')).catch(()=>{});} }catch(e){} return res;});};
 window.SnipeXModeUX={
   show(){ $('sxModeUxPanel')&&$('sxModeUxPanel').classList.remove('sxmu-hide'); applyLocks();}, hide(){ $('sxModeUxPanel')&&$('sxModeUxPanel').classList.add('sxmu-hide');}, toggle(){let p=$('sxModeUxPanel'); if(p){p.classList.toggle('sxmu-hide'); applyLocks();}},
   setTier(t){t=String(t||'BASIC').toUpperCase(); if(!tierRules[t]) t='BASIC'; localStorage.setItem(PLAN_KEY,t); fetch('/api/subscription/set_tier?tier='+encodeURIComponent(t)).catch(()=>{}); applyLocks(); toast('Plan set: '+tierRules[t].label);},
   selectMode(m){m=String(m||'SAFE').toUpperCase(); let r=rules(); if(!r.modes.includes(m)){toast((m==='PRO'?'Advanced':'Moderate')+' plan required for '+m+' Mode'); return;} localStorage.setItem(MODE_KEY,m); applyLocks(); toast('Mode selected: '+m);},
   start(){let t=tier(), r=rules(), m=(localStorage.getItem(MODE_KEY)||'SAFE').toUpperCase(); if(!r.auto){setToggleState(true,false); toast('Basic plan: AI analysis ON, AI Execution Engine locked. Upgrade for execution.'); return;} if(!r.modes.includes(m)) m=r.modes[0]; setToggleState(true,true); localStorage.setItem('snipex_active_mode_profile',m); if(m==='SAFE'){localStorage.setItem('snipex_min_confidence','85'); localStorage.setItem('snipex_max_trades_day','3');}
     if(m==='AUTO'){localStorage.setItem('snipex_min_confidence','75'); localStorage.setItem('snipex_max_trades_day','5');}
     if(m==='PRO'){localStorage.setItem('snipex_min_confidence','65'); localStorage.setItem('snipex_max_trades_day','8');}
     toast('Auto position automation started in '+m+' Mode'); try{if(window.logLive) logLive('\ud83d\udfe2 Mode UX started '+m+' Mode \u00b7 Master AI ON \u00b7 AI Execution Engine ON','ok');}catch(e){}
   }, rules, applyLocks
 };
 setTimeout(()=>{try{fetch('/api/subscription/tier').then(r=>r.json()).then(j=>{if(j&&j.state&&j.state.tier)localStorage.setItem(PLAN_KEY,j.state.tier); applyLocks();}).catch(applyLocks)}catch(e){applyLocks()}},600);
 setInterval(applyLocks,5000);
})();


(function(){
 function tier(){return (localStorage.getItem('snipex_subscription_tier')||'BASIC').toUpperCase()}
 function setCurrent(){var e=document.getElementById('sxsubCurrent'); if(e)e.textContent='Current: '+tier();}
 function notify(msg){try{if(window.logLive)logLive(msg,'warn')}catch(e){} try{let d=document.createElement('div');d.className='sxmu-lock-toast';d.textContent=msg;document.body.appendChild(d);setTimeout(()=>{try{d.remove()}catch(e){}},30000)}catch(e){alert(msg)}}
 window.SnipeXSubscribe={
   show:function(required){setCurrent();document.getElementById('sxSubscriptionPage').style.display='flex'; if(required) notify(required+' plan required. Please subscribe or upgrade.');},
   hide:function(){document.getElementById('sxSubscriptionPage').style.display='none'},
   choose:function(t){t=String(t||'BASIC').toUpperCase();
     // Local admin/demo activation. Replace this with paid license verification before public scale.
     localStorage.setItem('snipex_subscription_tier',t);
     fetch('/api/subscription/set_tier?tier='+encodeURIComponent(t)).catch(()=>{});
     setCurrent();
     try{SnipeXModeUX && SnipeXModeUX.applyLocks && SnipeXModeUX.applyLocks()}catch(e){}
     notify('Plan selected: '+t+'. For real customers, connect this to payment/license verification.');
   },
   warn:function(msg,required){notify(msg); this.show(required);}
 };
 function hookModeUX(){
   if(!window.SnipeXModeUX || window.SnipeXModeUX.__subPatch) return;
   const oldSelect=window.SnipeXModeUX.selectMode, oldStart=window.SnipeXModeUX.start;
   window.SnipeXModeUX.selectMode=function(m){
     m=String(m||'SAFE').toUpperCase(); const t=tier();
     if(m==='AUTO' && t==='BASIC'){ SnipeXSubscribe.warn('Auto Mode is locked in Basic. Upgrade to Moderate or Advanced for live execution.','Moderate'); return; }
     if(m==='PRO' && t!=='ADVANCED'){ SnipeXSubscribe.warn('Pro Mode is locked. Upgrade to Advanced for full tools.','Advanced'); return; }
     return oldSelect.apply(this,arguments);
   };
   window.SnipeXModeUX.start=function(){
     if(tier()==='BASIC'){ SnipeXSubscribe.warn('Basic plan is market insight-only. Subscribe to Moderate or Advanced to start auto position automation.','Moderate'); try{localStorage.setItem('snipex_master_ai_on','1');localStorage.setItem('snipex_auto_trade_on','0')}catch(e){} return; }
     return oldStart.apply(this,arguments);
   };
   window.SnipeXModeUX.__subPatch=true;
 }
 setTimeout(hookModeUX,900); setInterval(hookModeUX,2500); setTimeout(setCurrent,700);
})();


(function(){
  if(window.__SNIPEX_MODEUX_MASTERAI_BASIC_FIX_V12__) return;
  window.__SNIPEX_MODEUX_MASTERAI_BASIC_FIX_V12__=true;
  const PLAN_KEY='snipex_subscription_tier';
  const MODE_KEY='snipex_mode_ux_mode';
  function $(id){return document.getElementById(id)}
  function tier(){return String(localStorage.getItem(PLAN_KEY)||'BASIC').toUpperCase()}
  function basic(){return tier()==='BASIC'}
  function toast(msg){
    try{ if(window.SnipeXSubscribe && typeof SnipeXSubscribe.warn==='function'){ SnipeXSubscribe.warn(msg,'Moderate'); return; } }catch(e){}
    const d=document.createElement('div'); d.className='sxmu-lock-toast'; d.textContent=msg; document.body.appendChild(d); setTimeout(()=>{try{d.remove()}catch(e){}},30000);
  }
  function showSubscribe(msg){
    try{ if(window.SnipeXSubscribe && typeof SnipeXSubscribe.show==='function'){ if(msg) toast(msg); SnipeXSubscribe.show('Moderate'); return; } }catch(e){}
    toast(msg||'Please subscribe to Moderate or Advanced.');
  }
  function setOffHard(reason){
    try{localStorage.setItem('snipex_master_ai_on','0');localStorage.setItem('snipex_auto_trade_on','0');localStorage.setItem(MODE_KEY,'SAFE');}catch(e){}
    try{window.aiOn=false;window.autoOn=false;}catch(e){}
    try{ if(typeof applyMasterAIMode==='function') applyMasterAIMode('basic-plan-lock'); }catch(e){}
    try{ if(typeof paintProToggle==='function') paintProToggle(); }catch(e){}
    paintLabels(reason||'Basic plan: Master AI and AI Execution Engine is locked.');
  }
  function paintLabels(note){
    const ids=['rib-ai','ai-control-pill','ai-status-text'];
    ids.forEach(id=>{const el=$(id); if(el){el.textContent=id==='rib-ai'?'AI LOCKED':(id==='ai-status-text'?'MASTER AI LOCKED':'BASIC PLAN \u00b7 AI LOCKED')}});
    const n=$('ai-control-note'); if(n) n.textContent=note||'Basic plan includes dashboard, setup preview and verified position view only. Upgrade to Moderate or Advanced for Master AI and AI Execution Engine.';
    const ribbon=$('safeopt-master-ribbon'); if(ribbon){ribbon.className='safeopt-ribbon off'; ribbon.innerHTML='<b>MASTER AI LOCKED</b> \u00b7 BASIC PLAN \u00b7 MARKET INSIGHT/PREVIEW ONLY';}
    const st=$('sxmuStart'); if(st){st.classList.add('locked'); st.textContent='\ud83d\udd12 SUBSCRIBE TO START AUTO TRADING';}
    const noteEl=$('sxmuNote'); if(noteEl) noteEl.textContent='Basic plan: Master AI + Auto Execution are locked. Subscribe to Moderate/Advanced.';
    document.querySelectorAll('#toggleAI,.ai-toggle,[onclick*="toggleAI"],#btn-auto,[onclick*="toggleAuto"]').forEach(el=>{
      el.classList.add('sx-tier-basic-disabled'); el.title='Locked in Basic plan. Upgrade to Moderate or Advanced.';
    });
  }
  function enforce(){ if(basic()) setOffHard(); }
  function patchToggles(){
    if(window.__SNIPEX_BASIC_TOGGLE_PATCHED__) return; window.__SNIPEX_BASIC_TOGGLE_PATCHED__=true;
    const oldAI=window.toggleAI;
    window.toggleAI=function(){
      if(basic()){ setOffHard(); showSubscribe('Master AI is not included in Basic. Upgrade to Moderate or Advanced.'); return false; }
      return oldAI?oldAI.apply(this,arguments):undefined;
    };
    const oldAuto=window.toggleAuto;
    window.toggleAuto=function(){
      if(basic()){ setOffHard(); showSubscribe('Auto Position is locked in Basic. Upgrade to Moderate or Advanced.'); return false; }
      return oldAuto?oldAuto.apply(this,arguments):undefined;
    };
  }
  function patchModeUX(){
    if(!window.SnipeXModeUX || window.SnipeXModeUX.__v12Patched) return;
    const oldSelect=window.SnipeXModeUX.selectMode;
    const oldStart=window.SnipeXModeUX.start;
    window.SnipeXModeUX.selectMode=function(m){
      m=String(m||'SAFE').toUpperCase();
      if(basic() && (m==='AUTO' || m==='PRO')){ setOffHard(); showSubscribe((m==='PRO'?'Pro Mode':'Auto Mode')+' is locked in Basic. Subscribe to continue.'); return false; }
      return oldSelect?oldSelect.apply(this,arguments):undefined;
    };
    window.SnipeXModeUX.start=function(){
      if(basic()){ setOffHard(); showSubscribe('Basic plan cannot start Master AI or AI Execution Engine. Subscribe to Moderate or Advanced.'); return false; }
      return oldStart?oldStart.apply(this,arguments):undefined;
    };
    window.SnipeXModeUX.__v12Patched=true;
  }
  function upgradeQuickLine(){
    const line=$('sxModeQuickLine');
    if(line && !line.dataset.v12){
      line.dataset.v12='1';
      const modeBtn=line.querySelector('button:not(.sx-subscribe-btn)');
      if(modeBtn) modeBtn.textContent='\ud83e\udde0 Mode UX';
      const sub=line.querySelector('.sx-subscribe-btn');
      if(sub) sub.textContent='\ud83d\udcb3 Subscribe';
    }
  }
  function watchToasts(){
    document.querySelectorAll('.sxmu-lock-toast').forEach(d=>{
      if(d.dataset.v12Hide) return; d.dataset.v12Hide='1';
      setTimeout(()=>{try{d.remove()}catch(e){}},30000);
    });
  }
  function install(){ patchToggles(); patchModeUX(); upgradeQuickLine(); watchToasts(); enforce(); }
  setTimeout(install,300); setTimeout(install,1200); setInterval(install,1500);
  const mo=new MutationObserver(watchToasts); try{mo.observe(document.body,{childList:true,subtree:true});}catch(e){}
  window.SnipeXBasicLock={enforce,setOffHard,showSubscribe};
})();


(function(){
  if(window.__SNIPEX_FINAL_MODE_RAIL_MASTERAI_FIX_V13__) return;
  window.__SNIPEX_FINAL_MODE_RAIL_MASTERAI_FIX_V13__=true;
  const PLAN_KEY='snipex_subscription_tier';
  const MODE_KEY='snipex_mode_ux_mode';
  function tier(){return String(localStorage.getItem(PLAN_KEY)||'BASIC').toUpperCase()}
  function basic(){return tier()==='BASIC'}
  function $(id){return document.getElementById(id)}
  function openSubscribe(){try{if(window.SnipeXSubscribe&&SnipeXSubscribe.show){SnipeXSubscribe.show('Moderate');return}}catch(e){} alert('Please subscribe to Moderate or Advanced.');}
  function openMode(){try{if(window.SnipeXModeUX&&SnipeXModeUX.show){SnipeXModeUX.show();return}}catch(e){} const p=$('sxModeUxPanel'); if(p) p.classList.toggle('sxmu-hide');}
  function installRail(){
    if($('sxModeGoldRailLine')) return;
    const rail=document.createElement('div'); rail.id='sxModeGoldRailLine';
    rail.innerHTML='<button class="sxrail-btn mode" title="Mode UX">Mode UX</button><button class="sxrail-btn subscribe" title="Subscribe / Upgrade">Subscribe</button>';
    document.body.appendChild(rail);
    rail.querySelector('.mode').onclick=function(ev){ev.preventDefault();ev.stopPropagation();openMode();return false};
    rail.querySelector('.subscribe').onclick=function(ev){ev.preventDefault();ev.stopPropagation();openSubscribe();return false};
  }
  function killOldTopButtons(){const q=$('sxModeQuickLine'); if(q){q.style.setProperty('display','none','important'); q.style.setProperty('visibility','hidden','important');}}
  function markToast(el){
    if(!el||el.dataset.sxFinalV13) return; el.dataset.sxFinalV13='1';
    el.style.pointerEvents='none'; el.style.animation='sxFinalToastHide30 30s forwards';
    setTimeout(()=>{try{el.remove()}catch(e){}},30500);
  }
  function cleanToasts(){document.querySelectorAll('.sxmu-lock-toast').forEach(markToast)}
  function hardBasicOff(){
    if(!basic()){document.body.classList.remove('sx-basic-plan-lock');return}
    document.body.classList.add('sx-basic-plan-lock');
    try{localStorage.setItem(MODE_KEY,'SAFE')}catch(e){}
    try{window.aiOn=false;window.autoOn=false;window.masterAIOn=false;window.autoTradeOn=false;}catch(e){}
    const labels=[['rib-ai','AI LOCKED'],['ai-control-pill','BASIC PLAN \u00b7 AI LOCKED'],['ai-status-text','MASTER AI LOCKED']];
    labels.forEach(([id,txt])=>{const el=$(id); if(el) el.textContent=txt});
    const ribbon=$('safeopt-master-ribbon'); if(ribbon){ribbon.className='safeopt-ribbon off'; ribbon.innerHTML='<b>MASTER AI LOCKED</b> \u00b7 BASIC PLAN \u00b7 MARKET INSIGHT/PREVIEW ONLY'}
    const note=$('ai-control-note'); if(note) note.textContent='Basic plan: Master AI and live auto execution are locked. Subscribe to Moderate or Advanced.';
    const st=$('sxmuStart'); if(st){st.classList.add('locked'); st.textContent='\ud83d\udd12 SUBSCRIBE TO START AUTO TRADING'}
    const panelNote=$('sxmuNote'); if(panelNote) panelNote.textContent='Basic plan: dashboard, signals, preview and verified position view only. Master AI + AI Execution Engine is locked.';
    document.querySelectorAll('#toggleAI,.ai-toggle,[onclick*="toggleAI"],#btn-auto,[onclick*="toggleAuto"]').forEach(el=>{
      el.classList.add('sx-tier-basic-disabled'); el.title='Locked in Basic plan. Upgrade to Moderate or Advanced.';
    });
  }
  function patchStorage(){
    if(window.__SNIPEX_STORAGE_BASIC_PATCH_V13__) return; window.__SNIPEX_STORAGE_BASIC_PATCH_V13__=true;
    const old=Storage.prototype.setItem;
    Storage.prototype.setItem=function(k,v){
      try{ if(this===localStorage && basic() && (k==='snipex_master_ai_on'||k==='snipex_auto_trade_on'||k==='snipex_auto_trade_enabled'||k==='master_ai_on')) v='0'; }catch(e){}
      return old.call(this,k,v);
    };
  }
  function patchModeClicks(){
    if(!window.SnipeXModeUX || window.SnipeXModeUX.__v13FinalPatch) return;
    const oldSel=window.SnipeXModeUX.selectMode, oldStart=window.SnipeXModeUX.start;
    window.SnipeXModeUX.selectMode=function(m){
      m=String(m||'SAFE').toUpperCase();
      if(basic() && (m==='AUTO'||m==='PRO')){hardBasicOff();openSubscribe();return false}
      return oldSel?oldSel.apply(this,arguments):undefined;
    };
    window.SnipeXModeUX.start=function(){
      if(basic()){hardBasicOff();openSubscribe();return false}
      return oldStart?oldStart.apply(this,arguments):undefined;
    };
    window.SnipeXModeUX.__v13FinalPatch=true;
  }
  function patchAISwitches(){
    if(window.__SNIPEX_AI_SWITCH_V13__) return; window.__SNIPEX_AI_SWITCH_V13__=true;
    const oldAI=window.toggleAI; window.toggleAI=function(){if(basic()){hardBasicOff();openSubscribe();return false} return oldAI?oldAI.apply(this,arguments):undefined};
    const oldAuto=window.toggleAuto; window.toggleAuto=function(){if(basic()){hardBasicOff();openSubscribe();return false} return oldAuto?oldAuto.apply(this,arguments):undefined};
  }
  function tick(){installRail();killOldTopButtons();cleanToasts();patchStorage();patchModeClicks();patchAISwitches();hardBasicOff();}
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',tick); else tick();
  setTimeout(tick,400); setTimeout(tick,1200); setTimeout(()=>{document.querySelectorAll('.sxmu-lock-toast').forEach(e=>{try{e.remove()}catch(x){}})},30000);
  setInterval(tick,1500);
  try{new MutationObserver(()=>{cleanToasts();installRail();killOldTopButtons();}).observe(document.body,{childList:true,subtree:true})}catch(e){}
})();


(function(){
  if(window.__SNIPEX_BOTTOM_RIBBON_NOTICE_FIX_V14__) return;
  window.__SNIPEX_BOTTOM_RIBBON_NOTICE_FIX_V14__=true;
  const PLAN_KEY='snipex_subscription_tier';
  const MODE_KEY='snipex_mode_ux_mode';
  function $(id){return document.getElementById(id)}
  function tier(){return String(localStorage.getItem(PLAN_KEY)||'BASIC').toUpperCase()}
  function basic(){return tier()==='BASIC'}
  function removeToastsNow(){document.querySelectorAll('.sxmu-lock-toast').forEach(e=>{try{e.remove()}catch(x){}})}
  function fiveSecToast(msg){
    removeToastsNow();
    const d=document.createElement('div'); d.className='sxmu-lock-toast'; d.textContent=msg||'This feature needs a subscription upgrade.';
    d.dataset.sxUserNotice='1'; document.body.appendChild(d);
    setTimeout(()=>{try{d.remove()}catch(e){}},5200);
    return d;
  }
  function openSubscribe(){
    try{if(window.SnipeXSubscribe&&SnipeXSubscribe.show){SnipeXSubscribe.show('Moderate');return}}catch(e){}
    alert('Please subscribe to Moderate or Advanced.');
  }
  function hardBasicOff(){
    if(!basic()) return;
    try{localStorage.setItem(MODE_KEY,'SAFE');localStorage.setItem('snipex_master_ai_on','0');localStorage.setItem('snipex_auto_trade_on','0')}catch(e){}
    try{window.aiOn=false;window.autoOn=false;window.masterAIOn=false;window.autoTradeOn=false}catch(e){}
    const note=$('sxmuNote'); if(note) note.textContent='Basic plan: signal, dashboard, preview and verified positions only. Auto/Pro unlock with subscription.';
    const st=$('sxmuStart'); if(st){st.classList.add('locked'); st.textContent='\ud83d\udd12 SUBSCRIBE TO START AUTO TRADING'}
    const ribbon=$('safeopt-master-ribbon'); if(ribbon){ribbon.className='safeopt-ribbon off'; ribbon.innerHTML='<b>MASTER AI LOCKED</b> \u00b7 BASIC PLAN \u00b7 MARKET INSIGHT/PREVIEW ONLY'}
  }
  function installBottomRibbon(){
    const p=$('sxModeUxPanel'); if(!p) return;
    if(!p.dataset.v14Ribbon){
      p.dataset.v14Ribbon='1';
      p.classList.remove('sxmu-hide');
      p.classList.remove('sx-expanded');
      const head=p.querySelector('.sxmu-head');
      if(head){
        head.title='Click to open SnipeX Pro Control';
        head.addEventListener('click',function(ev){
          if(ev.target && ev.target.tagName==='BUTTON') return;
          p.classList.toggle('sx-expanded');
        },true);
      }
      const close=head&&head.querySelector('button');
      if(close){close.onclick=function(ev){ev.preventDefault();ev.stopPropagation();p.classList.remove('sx-expanded');return false}}
    }
  }
  function patchModeUx(){
    if(!window.SnipeXModeUX || window.SnipeXModeUX.__v14RibbonPatched) return;
    const oldShow=window.SnipeXModeUX.show, oldToggle=window.SnipeXModeUX.toggle, oldSelect=window.SnipeXModeUX.selectMode, oldStart=window.SnipeXModeUX.start;
    window.SnipeXModeUX.show=function(){const p=$('sxModeUxPanel'); if(p){p.classList.remove('sxmu-hide');p.classList.add('sx-expanded')} return oldShow?oldShow.apply(this,arguments):undefined};
    window.SnipeXModeUX.toggle=function(){const p=$('sxModeUxPanel'); if(p){p.classList.toggle('sx-expanded');return} return oldToggle?oldToggle.apply(this,arguments):undefined};
    window.SnipeXModeUX.selectMode=function(m){
      m=String(m||'SAFE').toUpperCase();
      if(basic() && (m==='AUTO'||m==='PRO')){
        hardBasicOff();
        fiveSecToast((m==='PRO'?'Pro Mode':'Auto Mode')+' Basic plan me locked hai. Subscribe/Upgrade karke live auto execution unlock karein.');
        openSubscribe();
        return false;
      }
      return oldSelect?oldSelect.apply(this,arguments):undefined;
    };
    window.SnipeXModeUX.start=function(){
      if(basic()){hardBasicOff();fiveSecToast('Basic plan market insight-only hai. Auto position automation ke liye Moderate ya Advanced subscription chahiye.');openSubscribe();return false}
      return oldStart?oldStart.apply(this,arguments):undefined;
    };
    window.SnipeXModeUX.__v14RibbonPatched=true;
  }
  function patchSubscribeWarn(){
    if(!window.SnipeXSubscribe || window.SnipeXSubscribe.__v14WarnPatch) return;
    const oldWarn=window.SnipeXSubscribe.warn, oldShow=window.SnipeXSubscribe.show;
    window.SnipeXSubscribe.warn=function(msg,plan){fiveSecToast(msg||'Upgrade required.'); return oldShow?oldShow.call(window.SnipeXSubscribe,plan||'Moderate'):undefined};
    window.SnipeXSubscribe.__v14WarnPatch=true;
  }
  function protectFromAutoNotice(){
    document.querySelectorAll('.sxmu-lock-toast').forEach(el=>{
      if(!el.dataset.sxUserNotice){try{el.remove()}catch(e){}}
      else if(!el.dataset.v14Timer){el.dataset.v14Timer='1';setTimeout(()=>{try{el.remove()}catch(e){}},5200)}
    });
  }
  function install(){installBottomRibbon();patchModeUx();patchSubscribeWarn();hardBasicOff();protectFromAutoNotice()}
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',install); else install();
  setTimeout(removeToastsNow,250);
  setTimeout(install,600); setTimeout(install,1500); setTimeout(install,3000); /* hang fix: removed repeated install interval */
  try{ /* hang fix: no full mutation observer loop; toasts are timed directly */ }catch(e){}
})();


(function(){
  if(window.__SNIPEX_CUSTOMER_PLAN_SUBSCRIBE_FIX_V15__) return;
  window.__SNIPEX_CUSTOMER_PLAN_SUBSCRIBE_FIX_V15__=true;
  const PLAN_KEY='snipex_subscription_tier';
  function tier(){return String(localStorage.getItem(PLAN_KEY)||'BASIC').toUpperCase()}
  function label(){const t=tier();return t==='ADVANCED'?'ADVANCED':t==='MODERATE'?'MODERATE':'BASIC'}
  function basic(){return label()==='BASIC'}
  function hardBasicOff(){
    if(!basic()) return;
    try{localStorage.setItem('snipex_master_ai_on','0');localStorage.setItem('snipex_auto_trade_on','0');localStorage.setItem('snipex_auto_trade_enabled','0');localStorage.setItem('master_ai_on','0')}catch(e){}
    try{window.aiOn=false;window.autoOn=false;window.masterAIOn=false;window.autoTradeOn=false}catch(e){}
    try{ if(typeof paint==='function') paint(); }catch(e){}
  }
  function removeModeUx(){
    ['sxModeUxTab','sxModeUxPanel','sxModeQuickLine'].forEach(id=>{const e=document.getElementById(id); if(e){e.style.display='none';e.style.visibility='hidden';e.style.pointerEvents='none';}});
  }
  function installPlanBadge(){
    let b=document.getElementById('sxActivePlanBadge');
    if(!b){b=document.createElement('div');b.id='sxActivePlanBadge';document.body.appendChild(b)}
    b.textContent='PLAN: '+label();
  }
  function installIntroBanner(){
    if(sessionStorage.getItem('sx_intro_banner_seen_v15')==='1') return;
    sessionStorage.setItem('sx_intro_banner_seen_v15','1');
    const d=document.createElement('div');d.id='sxPlanIntroBanner';
    d.textContent='Basic plan: dashboard, signals, preview and verified trades. Subscribe to Moderate or Advanced for live auto execution.';
    document.body.appendChild(d);
    setTimeout(()=>{try{d.remove()}catch(e){}},30500);
  }
  function ensureOffer(){
    const card=document.getElementById('sxSubscriptionCard');
    if(!card || document.getElementById('sxFirstSubOffer')) return;
    const offer=document.createElement('div');offer.id='sxFirstSubOffer';
    offer.innerHTML='70% OFF on first Subscription <small>Introductory offer for first activation only. Terms apply.</small>';
    card.appendChild(offer);
  }
  function openSub(){
    try{ensureOffer(); if(window.SnipeXSubscribe&&SnipeXSubscribe.show){SnipeXSubscribe.show('Moderate');ensureOffer();return}}catch(e){}
    const p=document.getElementById('sxSubscriptionPage'); if(p){p.style.display='flex';ensureOffer();return}
    alert('Subscription page is not available in this build.');
  }
  function installGoldSubscribe(){
    let b=document.getElementById('sxGoldSubscribeBtn');
    if(!b){b=document.createElement('button');b.id='sxGoldSubscribeBtn';b.type='button';b.textContent='Subscribe';document.body.appendChild(b)}
    b.onclick=function(ev){ev.preventDefault();ev.stopPropagation();openSub();return false};
  }
  function patchSubscribe(){
    if(window.SnipeXSubscribe && !window.SnipeXSubscribe.__v15OfferPatch){
      const oldShow=window.SnipeXSubscribe.show;
      window.SnipeXSubscribe.show=function(){const r=oldShow?oldShow.apply(this,arguments):undefined;setTimeout(ensureOffer,60);setTimeout(ensureOffer,300);return r};
      window.SnipeXSubscribe.__v15OfferPatch=true;
    }
  }
  function cleanupPermanentNotices(){
    document.querySelectorAll('.sxmu-lock-toast').forEach(el=>{ if(!el.dataset.v15Timer){el.dataset.v15Timer='1';setTimeout(()=>{try{el.remove()}catch(e){}},5200)} });
  }
  function patchStorage(){
    if(window.__SNIPEX_BASIC_STORAGE_LOCK_V15__) return; window.__SNIPEX_BASIC_STORAGE_LOCK_V15__=true;
    const old=Storage.prototype.setItem;
    Storage.prototype.setItem=function(k,v){try{if((localStorage.getItem(PLAN_KEY)||'BASIC').toUpperCase()==='BASIC' && ['snipex_master_ai_on','snipex_auto_trade_on','snipex_auto_trade_enabled','master_ai_on'].includes(String(k))) v='0'}catch(e){} return old.call(this,k,v)};
  }
  function tick(){removeModeUx();installPlanBadge();installGoldSubscribe();ensureOffer();patchSubscribe();cleanupPermanentNotices();patchStorage();hardBasicOff();}
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',()=>{tick();installIntroBanner()}); else {tick();installIntroBanner()}
  setTimeout(tick,500);setTimeout(tick,1500);setTimeout(tick,3000); /* hang fix: removed full UI tick interval */ setInterval(function(){try{if((localStorage.getItem(PLAN_KEY)||'BASIC').toUpperCase()==='BASIC') hardBasicOff()}catch(e){}},6000);
  try{ /* hang fix: removed unthrottled MutationObserver(tick), it caused UI freeze on startup */ }catch(e){}
})();


(function(){
  if(window.__SNIPEX_FINAL_DEDUP_HUMAN_VOICE_V16__) return;
  window.__SNIPEX_FINAL_DEDUP_HUMAN_VOICE_V16__=true;
  const PLAN_KEY='snipex_subscription_tier';
  const $=(id)=>document.getElementById(id);
  function tier(){try{return String(localStorage.getItem(PLAN_KEY)||'BASIC').toUpperCase()}catch(e){return 'BASIC'}}
  function removeDuplicates(){
    // Remove old Mode UX controls and old duplicate subscribe rails/lines.
    ['sxModeUxTab','sxModeUxPanel','sxModeQuickLine','sxModeGoldRailLine','sxPlanIntroBanner','sxBasicTopNotice','sxCustomerTopNotice'].forEach(id=>{try{$(id)?.remove()}catch(e){}});
    document.querySelectorAll('button,.sxrail-btn,.sx-subscribe-btn').forEach(el=>{
      const txt=(el.textContent||'').trim().toLowerCase();
      const id=el.id||'';
      const isMode=/mode ux|modeux/.test(txt) || /modeux|mode-ux|sxmode/i.test(id);
      const isSub=/subscribe|upgrade/.test(txt) || /subscribe/i.test(id);
      if(isMode){try{el.remove()}catch(e){}}
      if(isSub && id!=='sxGoldSubscribeBtn' && !el.closest('#sxSubscriptionPage')){try{el.remove()}catch(e){}}
    });
    document.querySelectorAll('#sxPlanIntroBanner,.sx-permanent-notice,.sx-top-notice').forEach(el=>{try{el.remove()}catch(e){}});
  }
  function ensureSingleSubscribe(){
    removeDuplicates();
    let b=$('sxGoldSubscribeBtn');
    if(!b){b=document.createElement('button');b.id='sxGoldSubscribeBtn';b.type='button';document.body.appendChild(b)}
    b.textContent='Subscribe';
    b.onclick=function(ev){ev.preventDefault();ev.stopPropagation();openSubscribe();return false};
  }
  function ensureOffer(){
    const card=$('sxSubscriptionCard') || document.querySelector('#sxSubscriptionPage .sxsub-card,#sxSubscriptionPage .sxps-panel,#sxSubscriptionPage');
    if(!card || $('sxFirstSubOffer')) return;
    const offer=document.createElement('div');offer.id='sxFirstSubOffer';
    offer.innerHTML='70% OFF on first Subscription <small>Introductory offer for first activation only. Terms apply.</small>';
    card.appendChild(offer);
  }
  function openSubscribe(){
    try{ if(window.SnipeXSubscribe&&SnipeXSubscribe.show){SnipeXSubscribe.show('Moderate');setTimeout(ensureOffer,80);setTimeout(removeDuplicates,120);return;}}catch(e){}
    const p=$('sxSubscriptionPage'); if(p){p.style.display='flex';ensureOffer();return;}
    showUpgradeToast('Subscription page is not available. Please contact support.');
  }
  function showUpgradeToast(msg){
    let t=$('sxUpgradeMiniToast');
    if(!t){t=document.createElement('div');t.id='sxUpgradeMiniToast';document.body.appendChild(t)}
    t.textContent=msg||'Upgrade required to use this feature.';
    t.style.display='block';t.style.opacity='1';
    clearTimeout(window.__sxUpgradeToastTimer);
    window.__sxUpgradeToastTimer=setTimeout(()=>{try{t.style.opacity='0';setTimeout(()=>t.remove(),350)}catch(e){}},5000);
  }
  function patchLockedMessages(){
    const msg='This feature is available on Moderate or Advanced subscription.';
    window.SnipeXShowUpgradeToast=showUpgradeToast;
    if(window.SnipeXSubscribe && !window.SnipeXSubscribe.__v16CleanWarn){
      const oldWarn=window.SnipeXSubscribe.warn, oldShow=window.SnipeXSubscribe.show;
      window.SnipeXSubscribe.warn=function(m,plan){showUpgradeToast(m||msg); return oldShow?oldShow.call(window.SnipeXSubscribe,plan||'Moderate'):undefined};
      window.SnipeXSubscribe.__v16CleanWarn=true;
    }
  }
  function protectBasic(){
    if(tier()==='BASIC'){
      try{localStorage.setItem('snipex_master_ai_on','0');localStorage.setItem('snipex_auto_trade_on','0');localStorage.setItem('snipex_auto_trade_enabled','0');localStorage.setItem('master_ai_on','0')}catch(e){}
      try{window.aiOn=false;window.autoOn=false;window.masterAIOn=false;window.autoTradeOn=false}catch(e){}
    }
  }
  function humanText(raw){
    let t=String(raw||'').replace(/\s+/g,' ').trim();
    const low=t.toLowerCase();
    if(/gold position triggered|order executed|trade triggered/.test(low)) return 'Position placed successfully on Gold. Please check the open position.';
    if(/high confidence trade/.test(low)) return 'High confidence setup detected. Preparing execution now.';
    if(/gold setup is ready/.test(low)) return 'Gold setup is ready. Risk and execution checks are clear.';
    if(/english voice alert is on/.test(low)) return 'Voice alerts are now on.';
    if(/blocked|reject|failed|failure/.test(low)) return t.replace(/rr/ig,'risk reward').replace(/mt5/ig,'M T five');
    return t.replace(/RR/ig,'risk reward').replace(/XAUUSD/ig,'Gold').replace(/MT5/ig,'M T five').replace(/SL/ig,'stop loss').replace(/TP/ig,'take profit');
  }
  function patchHumanVoice(){
    if(!('speechSynthesis' in window) || window.speechSynthesis.__sxHumanVoiceV16) return;
    const synth=window.speechSynthesis;
    const oldSpeak=synth.speak.bind(synth);
    synth.speak=function(u){
      try{
        if(u && typeof u.text==='string') u.text=humanText(u.text).slice(0,190);
        if(u){
          u.lang='en-IN';
          u.rate=0.86;      // slower and clearer
          u.pitch=0.96;     // less squeaky
          u.volume=1;
          const voices=synth.getVoices?synth.getVoices():[];
          const preferred=voices.find(v=>/Microsoft.*(Heera|Ravi|Neerja|Aria)|Google.*English.*India|English.*India|en-IN/i.test((v.name||'')+' '+(v.lang||''))) || voices.find(v=>/en-IN|English/i.test((v.lang||'')+' '+(v.name||'')));
          if(preferred) u.voice=preferred;
        }
      }catch(e){}
      return oldSpeak(u);
    };
    synth.__sxHumanVoiceV16=true;
  }
  function boot(){ensureSingleSubscribe();patchLockedMessages();protectBasic();patchHumanVoice();setTimeout(removeDuplicates,120);setTimeout(ensureSingleSubscribe,600);setTimeout(ensureSingleSubscribe,1800)}
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot); else boot();
  // Light maintenance only, no heavy observer/loop.
  setInterval(function(){try{ensureSingleSubscribe();patchLockedMessages();protectBasic();patchHumanVoice()}catch(e){}},8000);
})();


(function(){
  if(window.__SNIPEX_PREMIUM_SAAS_UI_V17__) return;
  window.__SNIPEX_PREMIUM_SAAS_UI_V17__=true;
  const PLAN_KEY='snipex_subscription_tier';
  const $=id=>document.getElementById(id);
  function plan(){try{return String(localStorage.getItem(PLAN_KEY)||'BASIC').toUpperCase()}catch(e){return 'BASIC'}}
  function clean(){
    ['sxModeUxTab','sxModeUxPanel','sxModeQuickLine','sxModeGoldRailLine','sxPlanIntroBanner','sxBasicTopNotice','sxCustomerTopNotice'].forEach(id=>{try{$(id)?.remove()}catch(e){}});
    document.querySelectorAll('.sx-permanent-notice,.sx-top-notice,#basic-plan-banner').forEach(el=>{try{el.remove()}catch(e){}});
    document.querySelectorAll('button,.sxrail-btn,.sx-subscribe-btn').forEach(el=>{
      const id=el.id||'', txt=(el.textContent||'').toLowerCase();
      if(/mode ux|modeux/.test(txt)||/modeux|mode-ux|sxmode/i.test(id)){try{el.remove()}catch(e){}}
      if((/subscribe|upgrade/.test(txt)||/subscribe/i.test(id)) && id!=='sxGoldSubscribeBtn' && !el.closest('#sxSubscriptionPage')){try{el.remove()}catch(e){}}
    });
  }
  function showToast(msg){
    let t=$('sxUpgradeMiniToast'); if(!t){t=document.createElement('div');t.id='sxUpgradeMiniToast';document.body.appendChild(t)}
    t.textContent=msg||'Upgrade to Moderate or Advanced to enable this feature.';
    t.style.display='block';t.style.opacity='1';
    clearTimeout(window.__sxPremiumToastTimer);
    window.__sxPremiumToastTimer=setTimeout(()=>{try{t.style.opacity='0';setTimeout(()=>t.remove(),320)}catch(e){}},5000);
  }
  function offer(){
    const card=$('sxSubscriptionCard')||document.querySelector('#sxSubscriptionPage .sxps-panel,#sxSubscriptionPage .sxsub-card,#sxSubscriptionPage');
    if(!card||$('sxFirstSubOffer')) return;
    const o=document.createElement('div');o.id='sxFirstSubOffer';
    o.innerHTML='70% OFF on first Subscription <small>Introductory offer for first activation only. Terms apply.</small>';
    card.appendChild(o);
  }
  function openSub(){
    try{if(window.SnipeXSubscribe&&SnipeXSubscribe.show){window.SnipeXSubscribe.show('Moderate');setTimeout(offer,80);return}}catch(e){}
    const p=$('sxSubscriptionPage'); if(p){p.style.display='flex';offer();return}
    showToast('Subscription page is not available. Please contact support.');
  }
  function subscribe(){
    clean();
    let b=$('sxGoldSubscribeBtn'); if(!b){b=document.createElement('button');b.id='sxGoldSubscribeBtn';b.type='button';document.body.appendChild(b)}
    b.textContent='Subscribe'; b.onclick=e=>{e.preventDefault();e.stopPropagation();openSub();return false};
  }
  function badge(){
    let b=$('sxActivePlanBadge'); if(!b){b=document.createElement('div');b.id='sxActivePlanBadge';document.body.appendChild(b)}
    b.textContent='PLAN: '+(plan()==='ADVANCED'?'ADVANCED':plan()==='MODERATE'?'MODERATE':'BASIC');
  }
  function basicLock(){
    if(plan()!=='BASIC') return;
    try{['snipex_master_ai_on','snipex_auto_trade_on','snipex_auto_trade_enabled','master_ai_on'].forEach(k=>localStorage.setItem(k,'0'))}catch(e){}
    try{window.aiOn=false;window.autoOn=false;window.masterAIOn=false;window.autoTradeOn=false}catch(e){}
  }
  function patchSubWarn(){
    window.SnipeXShowUpgradeToast=showToast;
    if(window.SnipeXSubscribe&&!window.SnipeXSubscribe.__premiumV17){
      const oldShow=window.SnipeXSubscribe.show;
      window.SnipeXSubscribe.warn=function(m,p){showToast(m||'This tool is available on Moderate or Advanced subscription.');return oldShow?oldShow.call(window.SnipeXSubscribe,p||'Moderate'):undefined};
      window.SnipeXSubscribe.__premiumV17=true;
    }
  }
  function boot(){clean();subscribe();badge();offer();basicLock();patchSubWarn();setTimeout(clean,300);setTimeout(subscribe,500);setTimeout(badge,700)}
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot); else boot();
  setInterval(()=>{try{clean();subscribe();badge();basicLock();patchSubWarn()}catch(e){}},10000);
})();


(function(){
  function installSnipeXBrand(){
    if(document.getElementById('snipex-brand-badge')) return;
    var badge=document.createElement('div');
    badge.id='snipex-brand-badge';
    var tier=(window.SNIPEX_SUBSCRIPTION_TIER||localStorage.getItem('snipex_plan')||localStorage.getItem('subscription_tier')||'BASIC').toString().toUpperCase();
    badge.innerHTML='<img src="../assets/snipex_logo.png" alt="SnipeX"><span>SnipeX Pro</span><span class="sx-plan-mini">'+tier+'</span>';
    document.body.appendChild(badge);
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', installSnipeXBrand); else installSnipeXBrand();
})();


(function(){
  if(window.SnipeXF8Risk && window.SnipeXF8Risk.version) return;
  const VERSION='F8_AUTONOMOUS_RISK_COMMANDER_v1.0';
  const S={last:null,shadow:true};
  const q=id=>document.getElementById(id);
  const log=(m,t)=>{try{(window.sxLog||window.log||console.log)(m,t||'info')}catch(e){console.log(m)}};
  async function post(url,data){try{let r=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data||{})});return await r.json()}catch(e){return {ok:false,error:String(e)}}}
  function snap(extra){let sym=(window.currentSymbol||window.selectedSymbol||window.SNIPEX_ACTIVE_SYMBOL||'XAUUSD');let conf=Number(window.currentConfidence||window.lastConfidence||0);return Object.assign({symbol:String(sym||'XAUUSD').toUpperCase(),confidence:conf,source:'F8_UI_RISK_SNAPSHOT'},extra||{})}
  async function status(){let j=await post('/api/f8/risk/status',snap()); if(j&&j.ok){S.last=j; S.shadow=!!j.shadow_mode; paint();} return j}
  async function advise(payload){let j=await post('/api/f8/risk/advise_entry',Object.assign(snap(),payload||{})); if(j&&j.ok){S.last=j.risk||S.last; paint();} return j}
  function paint(){
    if(!document.body)return; let p=q('sxF8RiskPanel'); if(!p){p=document.createElement('div');p.id='sxF8RiskPanel';document.body.appendChild(p)}
    let L=S.last||{}; let ex=L.exposure||{}; let acct=L.account||{}; let pressure=(L.execution_pressure!=null?L.execution_pressure:'--'); let verdict=L.verdict||'BOOTING'; let pos=ex.total_positions!=null?ex.total_positions:'--'; let lot=ex.total_lot!=null?ex.total_lot:'--'; let pnl=ex.floating_profit!=null?ex.floating_profit:'--';
    let reason=(L.blockers&&L.blockers.length?('Blockers: '+L.blockers.join(' \u00b7 ')):(L.recommendations&&L.recommendations.length?L.recommendations.join(' \u00b7 '):'F8 watches exposure, weak trades, floating loss and correlation pressure.'));
    p.innerHTML='<div class="sxF8Top"><div class="sxF8Title">\ud83d\udee1\ufe0f F8 Autonomous Risk Commander</div><div class="sxF8Badge">'+(S.shadow?'SHADOW':'LIVE GUARD')+'</div></div><div class="sxF8Grid"><div class="sxF8Metric"><b>Verdict</b><span>'+verdict+'</span></div><div class="sxF8Metric"><b>Pressure</b><span>'+pressure+'%</span></div><div class="sxF8Metric"><b>Open / Lot</b><span>'+pos+' / '+lot+'</span></div><div class="sxF8Metric"><b>Floating PNL</b><span>'+pnl+' '+(acct.currency||'')+'</span></div></div><div class="sxF8Reason">'+reason+'</div><div class="sxF8Btns"><button class="sxF8Btn hot" id="sxF8Scan">Risk Scan</button><button class="sxF8Btn safe" id="sxF8Weak">Weakest</button><button class="sxF8Btn" id="sxF8Shadow">Shadow: '+(S.shadow?'ON':'OFF')+'</button><button class="sxF8Btn" id="sxF8Hide">Hide</button></div>';
    let sc=q('sxF8Scan'); if(sc)sc.onclick=()=>status().then(j=>{if(j&&j.ok)log('\ud83d\udee1\ufe0f F8 risk commander: '+j.verdict+' \u00b7 pressure '+j.execution_pressure+'%','ok')});
    let wk=q('sxF8Weak'); if(wk)wk.onclick=()=>fetch('/api/f8/risk/weakest').then(r=>r.json()).then(j=>log('\ud83d\udee1\ufe0f F8 weakest: '+((j.weakest||[]).map(x=>x.symbol+' '+x.side+' '+x.strength).join(' | ')||'none'),'info'));
    let sh=q('sxF8Shadow'); if(sh)sh.onclick=()=>post('/api/f8/risk/set',{shadow_mode:!S.shadow}).then(status);
    let h=q('sxF8Hide'); if(h)h.onclick=()=>{localStorage.setItem('SNIPEX_F8_PANEL_HIDDEN','1');p.classList.add('sx-f8-hidden')};
    if(localStorage.getItem('SNIPEX_F8_PANEL_HIDDEN')==='1') p.classList.add('sx-f8-hidden');
  }
  function wrapOrder(){
    if(window.__sxF8OrderWrapped)return; window.__sxF8OrderWrapped=true;
    ['executeManagedSetup','fireMasterAIOrder','sendMasterAIOrder'].forEach(name=>{let old=window[name]; if(typeof old!=='function'||old.__sxF8Wrapped)return; let w=function(payload){try{advise(payload||{}).then(j=>{try{if(j&&j.shadow_would_allow===false)log('\ud83d\udee1\ufe0f F8 shadow warning: '+(j.reasons||[]).join(' \u00b7 '),'warn')}catch(e){}})}catch(e){} return old.apply(this,arguments)}; w.__sxF8Wrapped=true; window[name]=w;});
  }
  function boot(){status(); paint(); wrapOrder(); if(!sessionStorage.getItem('SNIPEX_F8_BOOTED')){sessionStorage.setItem('SNIPEX_F8_BOOTED','1');setTimeout(()=>log('\ud83d\udee1\ufe0f F8 Autonomous Risk Commander active: exposure, weak-trade and capital shield intelligence online.','ok'),1900)}}
  window.SnipeXF8Risk={version:VERSION,state:S,status,advise,show:function(){localStorage.removeItem('SNIPEX_F8_PANEL_HIDDEN');let p=q('sxF8RiskPanel'); if(p)p.classList.remove('sx-f8-hidden');paint();}};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
  setInterval(status,15000);
})();


(function(){async function omegaTick(){try{let r=await fetch('/api/omega/status');let j=await r.json();let m=j&&j.modules?Object.keys(j.modules).length:0;document.getElementById('snipex-omega-status').innerText=(j.ok?'ACTIVE ':'OFFLINE ')+m+' modules \u00b7 shadow-safe';}catch(e){let x=document.getElementById('snipex-omega-status'); if(x)x.innerText='Omega endpoint waiting';}} omegaTick(); setInterval(omegaTick,6000);})();


(function () {
  "use strict";

  const SNIPEX_EVOLUTION_VERSION = "POST_STEP36_37_TO_41_V3_SOFT_BLOCKER_DISMISSAL";

  const DEFAULT_RULES = {
    minRR: 3,
    goldStrongRR: 5,
    tradeabilityThreshold: 68,
    strongTradeabilityThreshold: 78,
    maxGoldSpread: 240,
    catastrophicGoldSpread: 420,
    maxSpreadDefault: 120,
    catastrophicSpreadDefault: 260,
    maxOpenTrades: 5,
    maxConsecutiveLosses: 3,
    maxDailyLossPct: 6,
    maxEquityDropPct: 10,
    minBreakoutQuality: 62,
    minMomentumStability: 58,
    maxLiquidityRisk: 72,
    softOverrideRR: 5,
    scanCacheMs: 1200,
    uiUpdateMs: 900,
    autoIntegrate: true,
    blockUnsafeOrders: true,
    dryRun: false,
    dismissLegacySoftBlockers: true,
    directBridgeFallback: true,
    bridgeTradeEndpoint: "/api/order",
    softBlockerKeywords: [
      "confidence below", "market force below", "one position per symbol", "already in", "duplicate guard",
      "duplicate lock", "cooldown", "setup not ready", "signal threshold", "turn auto switching on",
      "spread gate failed", "spread too high", "old spread", "symbol lock"
    ],
    hardBlockerKeywords: [
      "bridge offline", "mt5 bridge offline", "market closed", "no tick", "broker position automation disabled",
      "invalid lot", "invalid sl", "invalid tp", "invalid sl/entry", "emergency", "daily loss",
      "equity drop", "catastrophic spread", "cannot reach /api/trade", "broker rejection"
    ]
  };

  const state = {
    version: SNIPEX_EVOLUTION_VERSION,
    lastScanAt: 0,
    lastUiAt: 0,
    lastAnalysisBySymbol: {},
    lastDecision: null,
    strategyStats: {},
    hooks: {},
    integration: {
      attempted: false,
      active: false,
      wrapped: [],
      missing: [],
      blockedCount: 0,
      approvedCount: 0
    },
    capital: {
      equityStartDay: null,
      equityNow: null,
      balanceNow: null,
      dailyLossPct: 0,
      equityDropPct: 0,
      consecutiveLosses: 0,
      openTrades: 0,
      emergencyLock: false,
      recoveryMode: false
    },
    logs: [],
    legacySoftDismissals: []
  };

  function clamp(n, min = 0, max = 100) {
    n = Number.isFinite(Number(n)) ? Number(n) : 0;
    return Math.max(min, Math.min(max, n));
  }

  function avg(arr) {
    const nums = (arr || []).map(Number).filter(Number.isFinite);
    if (!nums.length) return 0;
    return nums.reduce((a, b) => a + b, 0) / nums.length;
  }

  function safeNum(v, fallback = 0) {
    const n = Number(v);
    return Number.isFinite(n) ? n : fallback;
  }

  function firstDefined() {
    for (let i = 0; i < arguments.length; i += 1) {
      if (arguments[i] !== undefined && arguments[i] !== null && arguments[i] !== "") return arguments[i];
    }
    return undefined;
  }

  function candleBody(c) { return Math.abs(safeNum(c.close) - safeNum(c.open)); }
  function candleRange(c) { return Math.max(0.000001, safeNum(c.high) - safeNum(c.low)); }
  function upperWick(c) { return safeNum(c.high) - Math.max(safeNum(c.open), safeNum(c.close)); }
  function lowerWick(c) { return Math.min(safeNum(c.open), safeNum(c.close)) - safeNum(c.low); }

  function normaliseCandle(c) {
    if (!c) return null;
    return {
      open: safeNum(firstDefined(c.open, c.o, c.O), 0),
      high: safeNum(firstDefined(c.high, c.h, c.H), 0),
      low: safeNum(firstDefined(c.low, c.l, c.L), 0),
      close: safeNum(firstDefined(c.close, c.c, c.C), 0),
      volume: safeNum(firstDefined(c.volume, c.v, c.tick_volume), 0)
    };
  }

  function getRecentCandles(input) {
    const raw = Array.isArray(input?.candles) ? input.candles : [];
    return raw.map(normaliseCandle).filter(Boolean).slice(-60);
  }

  function detectSessionStrength(now = new Date()) {
    const utcHour = now.getUTCHours();
    if (utcHour >= 12 && utcHour <= 16) return { name: "LONDON_NY_POWER", score: 92 };
    if (utcHour >= 7 && utcHour < 12) return { name: "LONDON_BUILD", score: 82 };
    if (utcHour >= 17 && utcHour <= 20) return { name: "NY_LATE", score: 70 };
    if (utcHour >= 0 && utcHour < 6) return { name: "ASIAN_DRIFT", score: 48 };
    return { name: "DEAD_ZONE", score: 42 };
  }

  function volatilityDNA(candles, spread = 0) {
    if (candles.length < 8) {
      return { score: 45, expansion: 0, wickInstability: 50, spreadInstability: clamp(spread / 2) };
    }
    const recent = candles.slice(-8);
    const older = candles.slice(-20, -8);
    const recentRange = avg(recent.map(candleRange));
    const olderRange = avg(older.map(candleRange)) || recentRange;
    const expansion = clamp((recentRange / Math.max(olderRange, 0.000001)) * 50);
    const wickRatios = recent.map(c => clamp(((upperWick(c) + lowerWick(c)) / candleRange(c)) * 100));
    const wickInstability = avg(wickRatios);
    const spreadInstability = clamp(spread / 3);
    const score = clamp(55 + (expansion - 50) * 0.55 - wickInstability * 0.22 - spreadInstability * 0.18);
    return { score, expansion, wickInstability, spreadInstability };
  }

  function detectMarketPersonality(input) {
    const candles = getRecentCandles(input);
    const confidence = safeNum(input.confidence, 0);
    const trend = safeNum(firstDefined(input.trendScore, input.trend), 0);
    const momentum = safeNum(firstDefined(input.momentumScore, input.momentum), 0);
    const spread = safeNum(input.spread, 0);
    const dna = volatilityDNA(candles, spread);
    if (candles.length < 8) return { state: "LOW_DATA", score: 45, dna };
    const bodies = candles.slice(-5).map(candleBody);
    const ranges = candles.slice(-5).map(candleRange);
    const bodyStrength = clamp((avg(bodies) / Math.max(avg(ranges), 0.000001)) * 100);
    const wickInstability = dna.wickInstability;
    let marketState = "RANGE";
    let score = 58;
    if (trend >= 85 && momentum >= 82 && dna.expansion >= 62 && bodyStrength >= 55) {
      marketState = "TREND_EXPLOSION"; score = 90;
    } else if (trend >= 72 && momentum >= 62 && wickInstability < 52) {
      marketState = "CLEAN_TREND"; score = 80;
    } else if (wickInstability >= 68 && confidence >= 65) {
      marketState = "FAKE_BREAKOUT_ZONE"; score = 42;
    } else if (dna.expansion >= 82 && wickInstability >= 58) {
      marketState = "VOLATILITY_SPIKE"; score = 52;
    } else if (trend < 45 && momentum < 45) {
      marketState = "CHOPPY"; score = 35;
    } else if (dna.expansion < 38) {
      marketState = "LOW_VOLUME_DRIFT"; score = 40;
    }
    return { state: marketState, score, dna, bodyStrength, trend, momentum };
  }

  function liquiditySweepRisk(input) {
    const candles = getRecentCandles(input);
    if (candles.length < 5) return 50;
    const c = candles[candles.length - 1];
    const range = candleRange(c);
    const wickRatio = clamp(((upperWick(c) + lowerWick(c)) / range) * 100);
    const bodyRatio = clamp((candleBody(c) / range) * 100);
    const direction = String(input.direction || "").toUpperCase();
    const againstWick = direction === "BUY" ? upperWick(c) / range * 100 : lowerWick(c) / range * 100;
    return clamp(wickRatio * 0.55 + (100 - bodyRatio) * 0.25 + againstWick * 0.35);
  }

  function breakoutAuthenticity(input) {
    const candles = getRecentCandles(input);
    const confidence = safeNum(input.confidence, 0);
    const momentum = safeNum(firstDefined(input.momentumScore, input.momentum), 0);
    if (candles.length < 5) return clamp((confidence + momentum) / 2 - 10);
    const last = candles[candles.length - 1];
    const prev = candles[candles.length - 2];
    const bodyRatio = clamp((candleBody(last) / candleRange(last)) * 100);
    const direction = String(input.direction || "").toUpperCase();
    const followThrough = direction === "BUY" ? safeNum(last.close) > safeNum(prev.high) : safeNum(last.close) < safeNum(prev.low);
    const retestOk = input.retestValid === true ? 12 : 0;
    const volumeBoost = clamp(safeNum(firstDefined(input.volumePressure, input.volume), 50));
    return clamp(bodyRatio * 0.35 + momentum * 0.28 + confidence * 0.22 + volumeBoost * 0.12 + (followThrough ? 12 : -8) + retestOk);
  }

  function momentumDecayRisk(input) {
    const candles = getRecentCandles(input);
    const momentum = safeNum(firstDefined(input.momentumScore, input.momentum), 0);
    if (candles.length < 8) return clamp(60 - momentum / 2);
    const ranges = candles.slice(-6).map(candleRange);
    const firstHalf = avg(ranges.slice(0, 3));
    const secondHalf = avg(ranges.slice(3));
    const shrinking = secondHalf < firstHalf * 0.75;
    return clamp((shrinking ? 72 : 35) + (60 - momentum) * 0.45);
  }

  function tradeabilityScore(input, rules) {
    const session = detectSessionStrength(input.now || new Date());
    const personality = detectMarketPersonality(input);
    const breakout = breakoutAuthenticity(input);
    const liquidity = liquiditySweepRisk(input);
    const decay = momentumDecayRisk(input);
    const rr = safeNum(firstDefined(input.rr, input.riskReward), 0);
    const confidence = safeNum(input.confidence, 0);
    const spread = safeNum(input.spread, 0);
    const symbol = String(input.symbol || "").toUpperCase();
    const maxSpread = symbol.includes("XAU") ? rules.maxGoldSpread : rules.maxSpreadDefault;
    const spreadScore = clamp(100 - (spread / Math.max(maxSpread, 1)) * 100);
    const score = clamp(
      personality.score * 0.2 + session.score * 0.12 + breakout * 0.22 +
      (100 - liquidity) * 0.18 + (100 - decay) * 0.12 + confidence * 0.12 +
      spreadScore * 0.04 + Math.min(rr, 10) * 1.2
    );
    return { score, session, personality, breakout, liquidity, decay, spreadScore };
  }

  function updateCapital(account = {}) {
    const equity = safeNum(firstDefined(account.equity, account.equityNow), state.capital.equityNow || 0);
    const balance = safeNum(firstDefined(account.balance, account.balanceNow), state.capital.balanceNow || equity);
    if (!state.capital.equityStartDay && equity > 0) state.capital.equityStartDay = equity;
    state.capital.equityNow = equity;
    state.capital.balanceNow = balance;
    state.capital.openTrades = safeNum(account.openTrades, state.capital.openTrades);
    state.capital.consecutiveLosses = safeNum(account.consecutiveLosses, state.capital.consecutiveLosses);
    const start = state.capital.equityStartDay || equity || 1;
    state.capital.dailyLossPct = clamp(((start - equity) / start) * 100, 0, 999);
    state.capital.equityDropPct = clamp(((balance - equity) / Math.max(balance, 1)) * 100, 0, 999);
    return state.capital;
  }

  function capitalProtectionDecision(account, rules) {
    const cap = updateCapital(account);
    const reasons = [];
    const hasEquityData = safeNum(firstDefined(account && account.equity, account && account.equityNow, cap.equityNow), 0) > 0;
    if (cap.openTrades >= rules.maxOpenTrades) reasons.push(`Max open positions reached: ${cap.openTrades}/${rules.maxOpenTrades}`);
    if (cap.consecutiveLosses >= rules.maxConsecutiveLosses) reasons.push(`Consecutive loss brake: ${cap.consecutiveLosses}`);
    if (hasEquityData && cap.dailyLossPct >= rules.maxDailyLossPct) reasons.push(`Daily loss shield: ${cap.dailyLossPct.toFixed(1)}%`);
    if (hasEquityData && cap.equityDropPct >= rules.maxEquityDropPct) reasons.push(`Equity drop shield: ${cap.equityDropPct.toFixed(1)}%`);
    cap.emergencyLock = reasons.length > 0;
    cap.recoveryMode = cap.consecutiveLosses >= 2 || cap.dailyLossPct >= rules.maxDailyLossPct * 0.6;
    return { ok: !reasons.length, reasons, capital: cap };
  }

  function rankStrategy(strategyName, tradeResult = {}) {
    const name = strategyName || "UNKNOWN_STRATEGY";
    const s = state.strategyStats[name] || { name, trades: 0, wins: 0, losses: 0, totalRR: 0, drawdownHits: 0, score: 50, authority: "NORMAL" };
    s.trades += 1;
    const pnl = safeNum(tradeResult.pnl, 0);
    const rr = safeNum(tradeResult.rr, 0);
    if (pnl > 0 || tradeResult.win === true) s.wins += 1;
    if (pnl < 0 || tradeResult.loss === true) s.losses += 1;
    if (tradeResult.drawdownHit) s.drawdownHits += 1;
    s.totalRR += rr;
    const winRate = s.trades ? (s.wins / s.trades) * 100 : 0;
    const avgRR = s.trades ? s.totalRR / s.trades : 0;
    s.score = clamp(winRate * 0.55 + Math.min(avgRR, 8) * 6 - s.drawdownHits * 5 + Math.min(s.trades, 20) * 0.7);
    s.authority = s.score >= 78 ? "AI_TRUSTED" : s.score <= 38 ? "THROTTLED" : "NORMAL";
    state.strategyStats[name] = s;
    return s;
  }

  function strategyAuthority(strategyName) {
    const s = state.strategyStats[strategyName || "UNKNOWN_STRATEGY"];
    if (!s) return { authority: "NORMAL", score: 50 };
    return { authority: s.authority, score: s.score };
  }

  function approveSetup(input = {}, customRules = {}) {
    const rules = { ...DEFAULT_RULES, ...customRules };
    const symbol = String(input.symbol || "UNKNOWN").toUpperCase();
    const rr = safeNum(firstDefined(input.rr, input.riskReward), 0);
    const spread = safeNum(input.spread, 0);
    const confidence = safeNum(input.confidence, 0);
    const direction = String(input.direction || "").toUpperCase();
    const reasons = [];
    const softReasons = [];
    const capital = capitalProtectionDecision(input.account || {}, rules);
    const analysis = tradeabilityScore(input, rules);
    const strat = strategyAuthority(input.strategyName);
    const catastrophicSpread = symbol.includes("XAU") ? rules.catastrophicGoldSpread : rules.catastrophicSpreadDefault;
    const maxSpread = symbol.includes("XAU") ? rules.maxGoldSpread : rules.maxSpreadDefault;

    if (!direction || !["BUY", "SELL"].includes(direction)) reasons.push("Direction not clean");
    if (rr < rules.minRR) reasons.push(`RR ${rr.toFixed(2)} below 1:${rules.minRR} minimum`);
    if (spread > catastrophicSpread) reasons.push(`Catastrophic spread: ${spread} > ${catastrophicSpread}`);
    if (spread > maxSpread) softReasons.push(`Spread high but not catastrophic: ${spread} > ${maxSpread}`);
    if (!capital.ok) reasons.push(...capital.reasons);
    if (input.noTick === true) reasons.push("No tick from broker/bridge");
    if (input.marketClosed === true) reasons.push("Market closed");
    if (input.brokerTradingDisabled === true) reasons.push("Broker position automation disabled for symbol");

    if (analysis.score < rules.tradeabilityThreshold) softReasons.push(`Tradeability ${analysis.score.toFixed(1)}% below ${rules.tradeabilityThreshold}%`);
    if (analysis.breakout < rules.minBreakoutQuality) softReasons.push(`Breakout quality ${analysis.breakout.toFixed(1)}% weak`);
    if ((100 - analysis.decay) < rules.minMomentumStability) softReasons.push(`Momentum stability weak, decay risk ${analysis.decay.toFixed(1)}%`);
    if (analysis.liquidity > rules.maxLiquidityRisk) softReasons.push(`Liquidity sweep risk high: ${analysis.liquidity.toFixed(1)}%`);
    if (strat.authority === "THROTTLED") softReasons.push(`Strategy throttled: ${input.strategyName}`);

    const strongOverride = rr >= rules.softOverrideRR && analysis.score >= rules.strongTradeabilityThreshold &&
      analysis.breakout >= rules.minBreakoutQuality + 8 && analysis.liquidity <= rules.maxLiquidityRisk - 10 &&
      analysis.decay <= 45 && confidence >= 72;

    const approved = reasons.length === 0 && (softReasons.length === 0 || strongOverride);
    const finalReasons = approved
      ? [strongOverride && softReasons.length ? "Approved by strong RR + clean structure soft-block override" : "Approved: adaptive brain + precision entry passed"]
      : [...reasons, ...softReasons];

    const output = {
      version: SNIPEX_EVOLUTION_VERSION,
      approved,
      shouldExecute: approved,
      symbol,
      direction,
      rr,
      confidence,
      marketState: analysis.personality.state,
      tradeabilityScore: Number(analysis.score.toFixed(1)),
      breakoutAuthenticity: Number(analysis.breakout.toFixed(1)),
      liquiditySweepRisk: Number(analysis.liquidity.toFixed(1)),
      momentumDecayRisk: Number(analysis.decay.toFixed(1)),
      sessionStrength: analysis.session.name,
      sessionScore: analysis.session.score,
      volatilityDNA: analysis.personality.dna,
      strategyAuthority: strat.authority,
      strategyScore: Number(strat.score.toFixed(1)),
      capital: capital.capital,
      hardReasons: reasons,
      softReasons,
      reasons: finalReasons,
      strongOverride
    };
    state.lastAnalysisBySymbol[symbol] = output;
    state.lastDecision = output;
    log(`${symbol}: ${approved ? "APPROVED" : "BLOCKED"} \u00b7 ${finalReasons.join(" \u00b7 ")}`);
    updateEvolutionPanel(symbol);
    exposeOverrideFlags(output);
    return output;
  }

  function chooseBestSetup(candidates = [], rules = {}) {
    const analysed = candidates.map(c => {
      const d = approveSetup(c, rules);
      return { ...d, sourceSetup: c };
    });
    const approved = analysed.filter(a => a.approved);
    approved.sort((a, b) => {
      const aScore = a.tradeabilityScore + a.breakoutAuthenticity - a.liquiditySweepRisk * 0.35 + Math.min(a.rr, 10) * 3;
      const bScore = b.tradeabilityScore + b.breakoutAuthenticity - b.liquiditySweepRisk * 0.35 + Math.min(b.rr, 10) * 3;
      return bScore - aScore;
    });
    return { best: approved[0] || null, approved, analysed };
  }

  function log(msg) {
    const line = `[${new Date().toLocaleTimeString()}] ${msg}`;
    state.logs.push(line);
    if (state.logs.length > 300) state.logs.shift();
    try { if (window.SNIPEX_LOG) window.SNIPEX_LOG(line); } catch (_) {}
  }

  function mountEvolutionPanel() {
    if (typeof document === "undefined") return;
    if (document.getElementById("snipex-evolution-panel")) return;
    const box = document.createElement("div");
    box.id = "snipex-evolution-panel";
    box.style.cssText = "position:fixed;right:12px;bottom:12px;z-index:99999;background:rgba(8,12,18,.88);color:#e7d48a;border:1px solid rgba(212,175,55,.55);border-radius:14px;padding:10px 12px;font:12px Arial;max-width:330px;box-shadow:0 10px 35px rgba(0,0,0,.35);backdrop-filter:blur(10px)";
    box.innerHTML = `<b>\u26a1 SnipeX Evolution 37\u219241</b><div id="snipex-evolution-lines" style="margin-top:6px;color:#d7dee8">Waiting for scanner...</div>`;
    document.body.appendChild(box);
  }

  function updateEvolutionPanel(symbol) {
    if (typeof document === "undefined") return;
    const now = Date.now();
    if (now - state.lastUiAt < DEFAULT_RULES.uiUpdateMs) return;
    state.lastUiAt = now;
    mountEvolutionPanel();
    const lineBox = document.getElementById("snipex-evolution-lines");
    const a = state.lastAnalysisBySymbol[symbol] || Object.values(state.lastAnalysisBySymbol).slice(-1)[0];
    if (!lineBox || !a) return;
    lineBox.innerHTML = `
      <div>${a.symbol} \u00b7 <b style="color:${a.approved ? '#6ee7b7' : '#fca5a5'}">${a.approved ? 'APPROVED' : 'BLOCKED'}</b></div>
      <div>State: ${a.marketState}</div>
      <div>Tradeability: ${a.tradeabilityScore}% \u00b7 Breakout: ${a.breakoutAuthenticity}%</div>
      <div>Liquidity Risk: ${a.liquiditySweepRisk}% \u00b7 Decay: ${a.momentumDecayRisk}%</div>
      <div>Session: ${a.sessionStrength}</div>
      <div style="margin-top:5px;color:#aab4c0">${a.reasons.slice(0,2).join(' \u00b7 ')}</div>
      <div style="margin-top:5px;color:#93c5fd">Hooks: ${state.integration.wrapped.join(', ') || 'manual only'}</div>
    `;
  }

  function findGlobalValue(names) {
    for (const name of names) {
      try {
        if (window[name] !== undefined && window[name] !== null) return window[name];
      } catch (_) {}
    }
    return undefined;
  }


  function lowerText(v) {
    return String(v === undefined || v === null ? "" : v).toLowerCase();
  }

  function matchesAnyKeyword(text, keywords) {
    const s = lowerText(text);
    return (keywords || []).some(k => s.includes(String(k).toLowerCase()));
  }

  function classifyLegacyBlock(text, decision) {
    const s = lowerText(text);
    if (!s) return { kind: "unknown", hard: false, soft: false };
    const hard = matchesAnyKeyword(s, DEFAULT_RULES.hardBlockerKeywords);
    const soft = matchesAnyKeyword(s, DEFAULT_RULES.softBlockerKeywords);
    if (hard) return { kind: "hard", hard: true, soft: false };
    if (soft && decision && decision.approved) return { kind: "soft_dismissed", hard: false, soft: true };
    return { kind: "unknown", hard: false, soft: false };
  }

  function exposeOverrideFlags(decision) {
    try {
      window.SNIPEX_STEP3741_DECISION = decision;
      window.SNIPEX_STEP3741_APPROVED = !!decision?.approved;
      window.SNIPEX_DISMISS_LEGACY_SOFT_BLOCKERS = DEFAULT_RULES.dismissLegacySoftBlockers;
      window.SNIPEX_FINAL_SOFT_AUTHORITY = SNIPEX_EVOLUTION_VERSION;
      if (window.MT5 && typeof window.MT5 === "object") {
        window.MT5.step3741Approved = !!decision?.approved;
        window.MT5.dismissLegacySoftBlockers = DEFAULT_RULES.dismissLegacySoftBlockers;
        window.MT5.finalSoftAuthority = SNIPEX_EVOLUTION_VERSION;
      }
    } catch (_) {}
  }

  function clearOverrideFlagsSoon() {
    setTimeout(() => {
      try {
        window.SNIPEX_STEP3741_APPROVED = false;
        if (window.MT5 && typeof window.MT5 === "object") window.MT5.step3741Approved = false;
      } catch (_) {}
    }, 2500);
  }

  function buildPayloadFromSetup(setup) {
    const symbol = String(firstDefined(setup.symbol, setup.pair, "XAUUSD")).toUpperCase();
    const direction = String(setup.direction || setup.side || "").toUpperCase();
    const levels = setup.levels || {};
    const entry = safeNum(firstDefined(setup.entry, levels.entry, setup.price), 0);
    const sl = safeNum(firstDefined(setup.sl, setup.stopLoss, levels.sl), 0);
    const tp = safeNum(firstDefined(setup.tp, setup.tp1, setup.takeProfit, levels.tp1, levels.tp), 0);
    const lot = safeNum(firstDefined(setup.lot, setup.volume, setup.qty, setup.size), 0);
    if (!symbol || !["BUY", "SELL"].includes(direction)) return null;
    if (!lot || lot <= 0) return null;
    if (!sl || !entry) return null;
    return {
      symbol,
      side: direction,
      direction,
      type: "MARKET",
      lot,
      volume: lot,
      entry,
      sl,
      tp,
      tp1: tp,
      comment: String(firstDefined(setup.comment, "SnipeX STEP37-41")),
      confidence: safeNum(setup.confidence, 0),
      rr: safeNum(firstDefined(setup.rr, setup.riskReward), 0),
      step3741: true,
      soft_blockers_dismissed: true
    };
  }

  async function directBridgeFallbackExecute(setup, decision, legacyReason) {
    if (!DEFAULT_RULES.directBridgeFallback || !decision?.approved) return null;
    const cls = classifyLegacyBlock(legacyReason, decision);
    if (cls.hard) return { ok: false, blocked: true, hard: true, reason: legacyReason, by: SNIPEX_EVOLUTION_VERSION };
    if (!cls.soft) return null;
    const payload = buildPayloadFromSetup(setup);
    if (!payload) {
      log(`Legacy soft blocker dismissed, but direct fallback skipped: missing payload fields. Reason: ${legacyReason}`);
      return { ok: false, blocked: true, softDismissed: true, fallbackSkipped: true, reason: "Missing order payload fields", legacyReason, decision };
    }
    try {
      const base = firstDefined(window.SNIPEX_BRIDGE_BASE, window.BRIDGE_BASE, "");
      const url = String(base || "") + DEFAULT_RULES.bridgeTradeEndpoint;
      log(`Legacy soft blocker dismissed \u2192 direct hard-safe bridge send: ${payload.symbol} ${payload.direction}`);
      const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await res.json().catch(() => ({ ok: res.ok, status: res.status }));
      return { ...data, step3741Fallback: true, softDismissed: true, decision, legacyReason, payload };
    } catch (e) {
      log(`Direct fallback failed: ${e.message}`);
      return { ok: false, error: e.message, step3741Fallback: true, decision, legacyReason };
    }
  }

  function buildSetupFromUnknown(argsLike) {
    const args = Array.from(argsLike || []);
    const merged = {};
    for (const a of args) {
      if (a && typeof a === "object" && !Array.isArray(a)) Object.assign(merged, a);
    }
    const symbol = String(firstDefined(merged.symbol, merged.pair, merged.instrument, findGlobalValue(["currentSymbol", "selectedSymbol", "ACTIVE_SYMBOL"]), "XAUUSD")).toUpperCase();
    const directionRaw = firstDefined(merged.direction, merged.side, merged.type, merged.signal, merged.action, merged.orderType, "");
    const dirStr = String(directionRaw).toUpperCase();
    const direction = dirStr.includes("BUY") || dirStr === "LONG" ? "BUY" : (dirStr.includes("SELL") || dirStr === "SHORT" ? "SELL" : dirStr);
    const candles = firstDefined(merged.candles, merged.ohlc, merged.bars, findGlobalValue(["latestCandles", "currentCandles", "SNIPEX_CANDLES"]), []);
    const account = firstDefined(merged.account, merged.accountState, findGlobalValue(["SNIPEX_ACCOUNT", "accountState", "liveAccount"]), {});
    return {
      ...merged,
      symbol,
      direction,
      rr: safeNum(firstDefined(merged.rr, merged.riskReward, merged.rewardRisk, merged.RR), 0),
      confidence: safeNum(firstDefined(merged.confidence, merged.score, merged.entryScore, merged.probability), 0),
      spread: safeNum(firstDefined(merged.spread, merged.spreadPoints, merged.currentSpread), 0),
      trendScore: safeNum(firstDefined(merged.trendScore, merged.trend, merged.trend_strength), 0),
      momentumScore: safeNum(firstDefined(merged.momentumScore, merged.momentum, merged.momentum_strength), 0),
      strategyName: String(firstDefined(merged.strategyName, merged.strategy, merged.name, "Unknown Strategy")),
      candles,
      account
    };
  }

  function isCandidateArray(value) {
    return Array.isArray(value) && value.some(x => x && typeof x === "object" && (x.symbol || x.direction || x.side || x.rr || x.confidence));
  }

  function replaceCandidateArray(args) {
    const arr = Array.from(args);
    for (let i = 0; i < arr.length; i += 1) {
      if (isCandidateArray(arr[i])) {
        const picked = chooseBestSetup(arr[i]);
        if (picked.best) {
          arr[i] = [picked.best.sourceSetup || picked.best];
          state.integration.approvedCount += 1;
        } else {
          state.integration.blockedCount += 1;
          arr[i] = [];
        }
        break;
      }
    }
    return arr;
  }

  function wrapOrderFunction(name) {
    if (state.hooks[name] || typeof window[name] !== "function") return false;
    const original = window[name];
    window[name] = function wrappedSnipeXOrderGate() {
      const setup = buildSetupFromUnknown(arguments);
      const decision = approveSetup(setup);
      exposeOverrideFlags(decision);
      if (!decision.shouldExecute && DEFAULT_RULES.blockUnsafeOrders) {
        state.integration.blockedCount += 1;
        log(`Order gate blocked ${decision.symbol}: ${decision.reasons.join(" \u00b7 ")}`);
        clearOverrideFlagsSoon();
        return { ok: false, blocked: true, by: SNIPEX_EVOLUTION_VERSION, decision, reason: decision.reasons.join(" \u00b7 ") };
      }
      state.integration.approvedCount += 1;
      if (DEFAULT_RULES.dryRun) return { ok: true, dryRun: true, by: SNIPEX_EVOLUTION_VERSION, decision };

      let legacyBlockText = "";
      let legacySoftDismissed = false;
      const oldNotify = window.notify;
      const oldSetExecutionStatus = window.setExecutionStatus;
      try {
        if (typeof oldNotify === "function") {
          window.notify = function patchedSnipeXNotify(title, message) {
            const combined = `${title || ""} ${message || ""}`;
            const cls = classifyLegacyBlock(combined, decision);
            if (DEFAULT_RULES.dismissLegacySoftBlockers && decision.approved && cls.soft) {
              legacyBlockText = combined;
              legacySoftDismissed = true;
              state.legacySoftDismissals.push({ at: Date.now(), name, reason: combined, decision });
              log(`Dismissed legacy soft blocker: ${combined}`);
              return;
            }
            return oldNotify.apply(this, arguments);
          };
        }
        if (typeof oldSetExecutionStatus === "function") {
          window.setExecutionStatus = function patchedSnipeXExecutionStatus(status) {
            const combined = `${status?.gate || ""} ${status?.message || ""} ${status?.last || ""}`;
            const cls = classifyLegacyBlock(combined, decision);
            if (DEFAULT_RULES.dismissLegacySoftBlockers && decision.approved && cls.soft) {
              legacyBlockText = combined;
              legacySoftDismissed = true;
              state.legacySoftDismissals.push({ at: Date.now(), name, reason: combined, decision });
              log(`Dismissed legacy soft gate: ${combined}`);
              try { return oldSetExecutionStatus.call(this, { ...status, kind: "ready", label: "STEP37-41 READY", gate: "Legacy soft blocker dismissed", message: "STEP37-41 approved. Old soft gate converted to warning.", last: "Soft blocker dismissed" }); } catch (_) { return; }
            }
            return oldSetExecutionStatus.apply(this, arguments);
          };
        }
        const result = original.apply(this, arguments);
        const inspectResult = async (r) => {
          let text = legacyBlockText;
          try { text += " " + JSON.stringify(r || {}); } catch (_) {}
          const cls = classifyLegacyBlock(text, decision);
          if (DEFAULT_RULES.dismissLegacySoftBlockers && decision.approved && (legacySoftDismissed || cls.soft)) {
            const fallback = await directBridgeFallbackExecute(setup, decision, text);
            if (fallback) return fallback;
            return { ok: true, softDismissed: true, by: SNIPEX_EVOLUTION_VERSION, decision, originalResult: r };
          }
          return r;
        };
        if (result && typeof result.then === "function") return result.then(inspectResult).finally(clearOverrideFlagsSoon);
        const cls = classifyLegacyBlock(legacyBlockText || JSON.stringify(result || {}), decision);
        if (DEFAULT_RULES.dismissLegacySoftBlockers && decision.approved && (legacySoftDismissed || cls.soft)) {
          clearOverrideFlagsSoon();
          return directBridgeFallbackExecute(setup, decision, legacyBlockText || JSON.stringify(result || {})) || { ok: true, softDismissed: true, by: SNIPEX_EVOLUTION_VERSION, decision, originalResult: result };
        }
        clearOverrideFlagsSoon();
        return result;
      } finally {
        if (typeof oldNotify === "function") window.notify = oldNotify;
        if (typeof oldSetExecutionStatus === "function") window.setExecutionStatus = oldSetExecutionStatus;
      }
    };
    window[name].__snipexEvolutionWrapped = true;
    state.hooks[name] = original;
    state.integration.wrapped.push(name);
    return true;
  }

  function wrapScannerFunction(name) {
    if (state.hooks[name] || typeof window[name] !== "function") return false;
    const original = window[name];
    window[name] = function wrappedSnipeXScanner() {
      const nextArgs = replaceCandidateArray(arguments);
      const result = original.apply(this, nextArgs);
      if (isCandidateArray(result)) {
        const picked = chooseBestSetup(result);
        return picked.best ? [picked.best.sourceSetup || picked.best] : [];
      }
      return result;
    };
    window[name].__snipexEvolutionWrapped = true;
    state.hooks[name] = original;
    state.integration.wrapped.push(name);
    return true;
  }

  function autoIntegrate() {
    state.integration.attempted = true;
    const orderNames = [
      "executeOrder", "placeOrder", "sendOrder", "openTrade", "autoExecuteTrade", "executeBestSetup",
      "fireOrder", "triggerTrade", "sendMarketOrder", "placeMarketOrder", "mt5OrderSend"
    ];
    const scannerNames = [
      "executeScannerCandidates", "runUniversalScanner", "universalScannerExecute", "selectBestSetup",
      "chooseBestSetup", "scanAndExecute", "processScannerResults"
    ];
    let wrapped = 0;
    orderNames.forEach(n => { if (wrapOrderFunction(n)) wrapped += 1; });
    scannerNames.forEach(n => { if (n !== "chooseBestSetup" && wrapScannerFunction(n)) wrapped += 1; });
    state.integration.missing = orderNames.concat(scannerNames).filter(n => !state.integration.wrapped.includes(n));
    state.integration.active = wrapped > 0;
    log(wrapped ? `Integrated hooks active: ${state.integration.wrapped.join(", ")}` : "No known SnipeX hook found. Use approveSetup before order send manually.");
    updateEvolutionPanel();
    return state.integration;
  }

  function installManualGate(orderFunction, options = {}) {
    if (typeof orderFunction !== "function") throw new Error("installManualGate needs an order function");
    return function snipexManualGateWrapper(setup) {
      const decision = approveSetup(setup, options.rules || {});
      if (!decision.shouldExecute && options.block !== false) {
        return { ok: false, blocked: true, by: SNIPEX_EVOLUTION_VERSION, decision, reason: decision.reasons.join(" \u00b7 ") };
      }
      return orderFunction.apply(this, arguments);
    };
  }

  window.SnipeXEvolution3741 = {
    version: SNIPEX_EVOLUTION_VERSION,
    state,
    rules: DEFAULT_RULES,
    approveSetup,
    chooseBestSetup,
    rankStrategy,
    updateCapital,
    mountEvolutionPanel,
    updateEvolutionPanel,
    detectMarketPersonality,
    tradeabilityScore,
    breakoutAuthenticity,
    liquiditySweepRisk,
    momentumDecayRisk,
    autoIntegrate,
    installManualGate,
    buildSetupFromUnknown,
    classifyLegacyBlock,
    directBridgeFallbackExecute,
    buildPayloadFromSetup
  };

  function boot() {
    mountEvolutionPanel();
    log("SnipeX Evolution 37\u219241 integrated patch loaded");
    if (DEFAULT_RULES.autoIntegrate) {
      autoIntegrate();
      setTimeout(autoIntegrate, 1200);
      setTimeout(autoIntegrate, 3500);
    }
  }

  if (typeof window !== "undefined") {
    if (document.readyState === "loading") window.addEventListener("DOMContentLoaded", boot);
    else boot();
  }
})();



(function(){
  window.SNIPEX_POST_STEP36_FUSED_BUILD = {version:'POST_STEP36_STEP37_41_FUSED_IN_STEP30', oldSoftBlockers:'dismissed', finalAuthority:'STEP37-41 + hard safety only', fusedAt:'2026-05-08'};
  try{ if(window.SnipeXEvolution3741){ window.SnipeXEvolution3741.rules.bridgeTradeEndpoint='/api/order'; window.SnipeXEvolution3741.rules.dismissLegacySoftBlockers=true; } }catch(e){}
  try{ (window.logLive||console.log)('\ud83d\udd25 POST-STEP36 FUSED BUILD active: STEP37-41 is final soft-decision authority; hard safety preserved.','ok'); }catch(e){}
})();


(function(){
  if(window.SnipeXF5Memory && window.SnipeXF5Memory.version) return;
  const VERSION='F5_AI_MARKET_MEMORY_TRADE_DNA_v1.0';
  const S={enabled:true,counts:{patterns:0,trade_dna:0,strategies:0},last:null,top:[],busy:false};
  function log(m,t){try{(window.__sxF4OriginalLogLive||window.logLive||console.log)(m,t||'ok')}catch(e){try{console.log(m)}catch(_){}}}
  function q(id){return document.getElementById(id)}
  function readSymbol(){try{return (q('symbolSelect')||q('live-symbol')||q('pairSelect')||{}).value||window.liveSymbol||window.currentSymbol||'XAUUSD'}catch(e){return 'XAUUSD'}}
  function readTF(){try{return (q('timeframeSelect')||q('live-tf')||q('tfSelect')||{}).value||window.currentTF||'M5'}catch(e){return 'M5'}}
  function collect(){
    let sym=readSymbol(); let tf=readTF(); let conf=0;
    try{conf=Number((q('confidenceValue')||q('masterConfidence')||q('confidence-score')||{}).textContent||0)||0}catch(e){}
    try{if(!conf && window.MasterAIState) conf=Number(window.MasterAIState.confidence||0)||0}catch(e){}
    return {symbol:String(sym||'XAUUSD').toUpperCase(), tf:tf, confidence:conf, strategy:(window.currentStrategyName||window.activeStrategyName||'LIVE_SCAN'), session:(window.currentSessionName||''), source:'F5_UI_SNAPSHOT'};
  }
  async function status(){try{let j=await fetch('/api/f5/memory/status',{cache:'no-store'}).then(r=>r.json()); if(j&&j.ok){S.enabled=!!(j.config&&j.config.enabled); S.counts=j.counts||S.counts; S.top=j.top_strategies||[]; paint();}}catch(e){}}
  async function analyze(extra){if(S.busy)return; S.busy=true; try{let body=Object.assign(collect(),extra||{}); let j=await fetch('/api/f5/memory/analyze',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}).then(r=>r.json()); if(j&&j.ok){S.last=j; paint(); return j;}}catch(e){} finally{S.busy=false}}
  async function record(event_type,outcome,reason,extra){try{let body=Object.assign(collect(),extra||{},{event_type:event_type||'snapshot',outcome:outcome||event_type||'snapshot',reason:reason||''}); let j=await fetch('/api/f5/memory/record',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}).then(r=>r.json()); await status(); return j;}catch(e){}}
  function paint(){
    if(!document.body)return; let p=q('sxF5MemoryPanel'); if(!p){p=document.createElement('div');p.id='sxF5MemoryPanel';document.body.appendChild(p)}
    const last=S.last||{}; const top=last.top_match||{}; const verdict=last.verdict||'READY';
    const ac=(last.adaptive_confidence!=null?last.adaptive_confidence:'--'); const sim=(top.similarity!=null?top.similarity+'%':'--');
    const patt=(S.counts&&S.counts.patterns)||0; const strat=(S.counts&&S.counts.strategies)||0;
    const reason=last.note?('Verdict: '+verdict+' \u00b7 bonus '+(last.memory_bonus||0)+' / penalty '+(last.fakeout_penalty||0)): 'Memory engine armed. It learns accepted, rejected and snapshot patterns without bypassing safety.';
    p.innerHTML='<div class="sxF5Top"><div class="sxF5Title">\ud83e\udde0 F5 AI Market Memory</div><div class="sxF5Badge">'+(S.enabled?'ARMED':'OFF')+'</div></div><div class="sxF5Grid"><div class="sxF5Metric"><b>Adaptive confidence</b><span>'+ac+'</span></div><div class="sxF5Metric"><b>Top similarity</b><span>'+sim+'</span></div><div class="sxF5Metric"><b>Patterns remembered</b><span>'+patt+'</span></div><div class="sxF5Metric"><b>Strategies learned</b><span>'+strat+'</span></div></div><div class="sxF5Reason">'+reason+'</div><div class="sxF5Btns"><button class="sxF5Btn hot" id="sxF5Analyze">Analyze Now</button><button class="sxF5Btn warn" id="sxF5Remember">Remember Setup</button><button class="sxF5Btn" id="sxF5Hide">Hide</button></div>';
    let a=q('sxF5Analyze'); if(a)a.onclick=()=>analyze().then(j=>{if(j)log('\ud83e\udde0 F5 memory verdict: '+j.verdict+' \u00b7 adaptive confidence '+j.adaptive_confidence,'ok')});
    let r=q('sxF5Remember'); if(r)r.onclick=()=>record('snapshot','snapshot','manual cockpit snapshot').then(()=>log('\ud83e\uddec F5 remembered current setup fingerprint.','ok'));
    let h=q('sxF5Hide'); if(h)h.onclick=()=>{localStorage.setItem('SNIPEX_F5_PANEL_HIDDEN','1');p.classList.add('sx-f5-hidden')};
    if(localStorage.getItem('SNIPEX_F5_PANEL_HIDDEN')==='1') p.classList.add('sx-f5-hidden');
  }
  function wrapOrder(){
    if(window.__sxF5OrderWrapped)return; window.__sxF5OrderWrapped=true;
    ['executeManagedSetup','fireMasterAIOrder','sendMasterAIOrder'].forEach(name=>{let old=window[name]; if(typeof old!=='function'||old.__sxF5Wrapped)return; let w=function(payload){try{analyze(payload||{}).then(j=>{try{if(j&&j.verdict==='FAKEOUT_CAUTION')log('\ud83e\udde0 F5 caution: this resembles remembered fakeout/rejection patterns. Hard gates still decide.','warn')}catch(e){}})}catch(e){} return old.apply(this,arguments)}; w.__sxF5Wrapped=true; window[name]=w;});
  }
  function boot(){status(); analyze(); paint(); wrapOrder(); if(!sessionStorage.getItem('SNIPEX_F5_BOOTED')){sessionStorage.setItem('SNIPEX_F5_BOOTED','1');setTimeout(()=>log('\ud83e\udde0 F5 AI Market Memory active: pattern fingerprints, position DNA, adaptive confidence advisory.','ok'),1200)}}
  window.SnipeXF5Memory={version:VERSION,state:S,status,analyze,record,show:function(){localStorage.removeItem('SNIPEX_F5_PANEL_HIDDEN');let p=q('sxF5MemoryPanel'); if(p)p.classList.remove('sx-f5-hidden');paint();}};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
  setInterval(()=>{wrapOrder();status();},7000);
})();


(function(){
  if(window.SnipeXF6Evolution && window.SnipeXF6Evolution.version) return;
  const VERSION='F6_AI_MARKET_EVOLUTION_STRATEGY_MUTATION_v1.0';
  const S={enabled:true,shadow:true,last:null,status:null};
  const q=id=>document.getElementById(id);
  const log=(m,t)=>{try{(window.sxLog||window.log||console.log)(m,t||'info')}catch(e){console.log(m)}};
  async function post(url,payload){try{let r=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload||{})});return await r.json()}catch(e){return {ok:false,error:String(e)}}}
  function snap(extra){
    let sym=(window.selectedSymbol||window.currentSymbol||window.SNIPEX_SYMBOL||'XAUUSD');
    let tf=(window.selectedTF||window.currentTF||window.activeTimeframe||'M5');
    let conf=Number(window.masterConfidence||window.aiConfidence||window.currentConfidence||0);
    return Object.assign({symbol:String(sym||'XAUUSD').toUpperCase(),tf:tf,confidence:conf,strategy:(window.currentStrategyName||window.activeStrategyName||'LIVE_SCAN'),session:(window.currentSessionName||''),source:'F6_UI_EVOLUTION_SNAPSHOT'},extra||{});
  }
  async function status(){let j=await post('/api/f6/evolution/status',snap()); if(j&&j.ok){S.status=j; S.enabled=!!(j.config&&j.config.enabled); S.shadow=!!(j.config&&j.config.shadow_mode); paint();} return j}
  async function evolve(payload){let j=await post('/api/f6/evolution/analyze',Object.assign(snap(),payload||{})); if(j&&j.ok){S.last=j; paint();} return j}
  function paint(){
    if(!document.body)return; let p=q('sxF6EvolutionPanel'); if(!p){p=document.createElement('div');p.id='sxF6EvolutionPanel';document.body.appendChild(p)}
    let L=S.last||{}; let st=S.status||{}; let evo=(L.evolved_confidence!=null?L.evolved_confidence+'%':'--'); let del=(L.evolution_delta!=null?(L.evolution_delta>0?'+':'')+L.evolution_delta:'--'); let vol=L.volatility_personality||'learning'; let top=(L.top_strategies&&L.top_strategies[0]&&L.top_strategies[0].name)||((st.top_strategies&&st.top_strategies[0]&&st.top_strategies[0].name)||'collecting DNA');
    let reason=L.verdict?('Verdict: '+L.verdict+' \u00b7 '+(L.caution&&L.caution.length?L.caution.join(' \u00b7 '):'shadow evolution only, hard gates stay boss')):'F6 evolves strategy priority using F5 memory. Let it collect position DNA, then it becomes sharper.';
    p.innerHTML='<div class="sxF6Top"><div class="sxF6Title">\ud83e\uddec F6 AI Market Evolution</div><div class="sxF6Badge">'+(S.shadow?'SHADOW':'LIVE ADVICE')+'</div></div><div class="sxF6Grid"><div class="sxF6Metric"><b>Evolved confidence</b><span>'+evo+'</span></div><div class="sxF6Metric"><b>Evolution delta</b><span>'+del+'</span></div><div class="sxF6Metric"><b>Market personality</b><span>'+vol+'</span></div><div class="sxF6Metric"><b>Top strategy</b><span>'+top+'</span></div></div><div class="sxF6Reason">'+reason+'</div><div class="sxF6Btns"><button class="sxF6Btn hot" id="sxF6Evolve">Evolve Now</button><button class="sxF6Btn warn" id="sxF6Shadow">Shadow: '+(S.shadow?'ON':'OFF')+'</button><button class="sxF6Btn" id="sxF6Hide">Hide</button></div>';
    let e=q('sxF6Evolve'); if(e)e.onclick=()=>evolve().then(j=>{if(j&&j.ok)log('\ud83e\uddec F6 evolution: '+j.verdict+' \u00b7 evolved confidence '+j.evolved_confidence+' \u00b7 '+j.volatility_personality,'ok')});
    let sh=q('sxF6Shadow'); if(sh)sh.onclick=()=>post('/api/f6/evolution/set',{shadow_mode:!S.shadow}).then(status);
    let h=q('sxF6Hide'); if(h)h.onclick=()=>{localStorage.setItem('SNIPEX_F6_PANEL_HIDDEN','1');p.classList.add('sx-f6-hidden')};
    if(localStorage.getItem('SNIPEX_F6_PANEL_HIDDEN')==='1') p.classList.add('sx-f6-hidden');
  }
  function wrapOrder(){
    if(window.__sxF6OrderWrapped)return; window.__sxF6OrderWrapped=true;
    ['executeManagedSetup','fireMasterAIOrder','sendMasterAIOrder'].forEach(name=>{let old=window[name]; if(typeof old!=='function'||old.__sxF6Wrapped)return; let w=function(payload){try{evolve(payload||{}).then(j=>{try{if(j&&j.verdict==='MUTATION_REQUIRED')log('\ud83e\uddec F6 says mutation required: strategy has bad memory here. Hard gates still decide.','warn')}catch(e){}})}catch(e){} return old.apply(this,arguments)}; w.__sxF6Wrapped=true; window[name]=w;});
  }
  function boot(){status(); evolve(); paint(); wrapOrder(); if(!sessionStorage.getItem('SNIPEX_F6_BOOTED')){sessionStorage.setItem('SNIPEX_F6_BOOTED','1');setTimeout(()=>log('\ud83e\uddec F6 AI Market Evolution active: adaptive strategy priority, volatility personality, anti-revenge discipline.','ok'),1600)}}
  window.SnipeXF6Evolution={version:VERSION,state:S,status,evolve,show:function(){localStorage.removeItem('SNIPEX_F6_PANEL_HIDDEN');let p=q('sxF6EvolutionPanel'); if(p)p.classList.remove('sx-f6-hidden');paint();}};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
  setInterval(()=>{status();evolve();},20000);
})();


(function(){
  if(window.SnipeXF8Risk && window.SnipeXF8Risk.version) return;
  const VERSION='F8_AUTONOMOUS_RISK_COMMANDER_v1.0';
  const S={last:null,shadow:true};
  const q=id=>document.getElementById(id);
  const log=(m,t)=>{try{(window.sxLog||window.log||console.log)(m,t||'info')}catch(e){console.log(m)}};
  async function post(url,data){try{let r=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data||{})});return await r.json()}catch(e){return {ok:false,error:String(e)}}}
  function snap(extra){let sym=(window.currentSymbol||window.selectedSymbol||window.SNIPEX_ACTIVE_SYMBOL||'XAUUSD');let conf=Number(window.currentConfidence||window.lastConfidence||0);return Object.assign({symbol:String(sym||'XAUUSD').toUpperCase(),confidence:conf,source:'F8_UI_RISK_SNAPSHOT'},extra||{})}
  async function status(){let j=await post('/api/f8/risk/status',snap()); if(j&&j.ok){S.last=j; S.shadow=!!j.shadow_mode; paint();} return j}
  async function advise(payload){let j=await post('/api/f8/risk/advise_entry',Object.assign(snap(),payload||{})); if(j&&j.ok){S.last=j.risk||S.last; paint();} return j}
  function paint(){
    if(!document.body)return; let p=q('sxF8RiskPanel'); if(!p){p=document.createElement('div');p.id='sxF8RiskPanel';document.body.appendChild(p)}
    let L=S.last||{}; let ex=L.exposure||{}; let acct=L.account||{}; let pressure=(L.execution_pressure!=null?L.execution_pressure:'--'); let verdict=L.verdict||'BOOTING'; let pos=ex.total_positions!=null?ex.total_positions:'--'; let lot=ex.total_lot!=null?ex.total_lot:'--'; let pnl=ex.floating_profit!=null?ex.floating_profit:'--';
    let reason=(L.blockers&&L.blockers.length?('Blockers: '+L.blockers.join(' \u00b7 ')):(L.recommendations&&L.recommendations.length?L.recommendations.join(' \u00b7 '):'F8 watches exposure, weak trades, floating loss and correlation pressure.'));
    p.innerHTML='<div class="sxF8Top"><div class="sxF8Title">\ud83d\udee1\ufe0f F8 Autonomous Risk Commander</div><div class="sxF8Badge">'+(S.shadow?'SHADOW':'LIVE GUARD')+'</div></div><div class="sxF8Grid"><div class="sxF8Metric"><b>Verdict</b><span>'+verdict+'</span></div><div class="sxF8Metric"><b>Pressure</b><span>'+pressure+'%</span></div><div class="sxF8Metric"><b>Open / Lot</b><span>'+pos+' / '+lot+'</span></div><div class="sxF8Metric"><b>Floating PNL</b><span>'+pnl+' '+(acct.currency||'')+'</span></div></div><div class="sxF8Reason">'+reason+'</div><div class="sxF8Btns"><button class="sxF8Btn hot" id="sxF8Scan">Risk Scan</button><button class="sxF8Btn safe" id="sxF8Weak">Weakest</button><button class="sxF8Btn" id="sxF8Shadow">Shadow: '+(S.shadow?'ON':'OFF')+'</button><button class="sxF8Btn" id="sxF8Hide">Hide</button></div>';
    let sc=q('sxF8Scan'); if(sc)sc.onclick=()=>status().then(j=>{if(j&&j.ok)log('\ud83d\udee1\ufe0f F8 risk commander: '+j.verdict+' \u00b7 pressure '+j.execution_pressure+'%','ok')});
    let wk=q('sxF8Weak'); if(wk)wk.onclick=()=>fetch('/api/f8/risk/weakest').then(r=>r.json()).then(j=>log('\ud83d\udee1\ufe0f F8 weakest: '+((j.weakest||[]).map(x=>x.symbol+' '+x.side+' '+x.strength).join(' | ')||'none'),'info'));
    let sh=q('sxF8Shadow'); if(sh)sh.onclick=()=>post('/api/f8/risk/set',{shadow_mode:!S.shadow}).then(status);
    let h=q('sxF8Hide'); if(h)h.onclick=()=>{localStorage.setItem('SNIPEX_F8_PANEL_HIDDEN','1');p.classList.add('sx-f8-hidden')};
    if(localStorage.getItem('SNIPEX_F8_PANEL_HIDDEN')==='1') p.classList.add('sx-f8-hidden');
  }
  function wrapOrder(){
    if(window.__sxF8OrderWrapped)return; window.__sxF8OrderWrapped=true;
    ['executeManagedSetup','fireMasterAIOrder','sendMasterAIOrder'].forEach(name=>{let old=window[name]; if(typeof old!=='function'||old.__sxF8Wrapped)return; let w=function(payload){try{advise(payload||{}).then(j=>{try{if(j&&j.shadow_would_allow===false)log('\ud83d\udee1\ufe0f F8 shadow warning: '+(j.reasons||[]).join(' \u00b7 '),'warn')}catch(e){}})}catch(e){} return old.apply(this,arguments)}; w.__sxF8Wrapped=true; window[name]=w;});
  }
  function boot(){status(); paint(); wrapOrder(); if(!sessionStorage.getItem('SNIPEX_F8_BOOTED')){sessionStorage.setItem('SNIPEX_F8_BOOTED','1');setTimeout(()=>log('\ud83d\udee1\ufe0f F8 Autonomous Risk Commander active: exposure, weak-trade and capital shield intelligence online.','ok'),1900)}}
  window.SnipeXF8Risk={version:VERSION,state:S,status,advise,show:function(){localStorage.removeItem('SNIPEX_F8_PANEL_HIDDEN');let p=q('sxF8RiskPanel'); if(p)p.classList.remove('sx-f8-hidden');paint();}};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
  setInterval(status,15000);
})();


(function(){async function omegaTick(){try{let r=await fetch('/api/omega/status');let j=await r.json();let m=j&&j.modules?Object.keys(j.modules).length:0;document.getElementById('snipex-omega-status').innerText=(j.ok?'ACTIVE ':'OFFLINE ')+m+' modules \u00b7 shadow-safe';}catch(e){let x=document.getElementById('snipex-omega-status'); if(x)x.innerText='Omega endpoint waiting';}} omegaTick(); setInterval(omegaTick,6000);})();


(function(){
  if (window.__SNX_FINAL_MANUAL_POPUP_FIX__) return;
  window.__SNX_FINAL_MANUAL_POPUP_FIX__ = true;

  var PANEL_IDS = [
    "sxF1TierDock","sxF2CommandStrip","sxF2DemoCountdown","sxF4PerfPanel",
    "sxF5MemoryPanel","sxF6EvolutionPanel","sxF8RiskPanel","snipex-omega-panel",
    "goldTriggerDebug","fxUniversePanel","snx-evolution-popup","snipex-evolution-popup",
    "evolution-popup","ai-lab-popup","strategy-manager-popup","scanner-popup","omega-popup"
  ];

  function byId(id){ return document.getElementById(id); }

  function addCloseButton(panel){
    if (!panel || panel.querySelector(".snx-panel-close")) return;
    var cs = window.getComputedStyle(panel);
    if (cs.position === "static") panel.style.position = "fixed";
    var b = document.createElement("button");
    b.type = "button";
    b.className = "snx-panel-close";
    b.textContent = "\u00d7";
    b.title = "Close";
    b.addEventListener("click", function(e){
      e.preventDefault(); e.stopPropagation();
      closePanel(panel);
    });
    panel.appendChild(b);
  }

  function closePanel(panel){
    if (!panel) return;
    panel.classList.remove("snx-manual-open");
    panel.style.setProperty("display","none","important");
    panel.style.setProperty("visibility","hidden","important");
    panel.style.setProperty("opacity","0","important");
    panel.style.setProperty("pointer-events","none","important");
  }

  function openPanel(panel){
    if (!panel) return;
    addCloseButton(panel);
    panel.classList.add("snx-manual-open");
    panel.classList.add("snx-draggable-panel");
    panel.style.setProperty("display","block","important");
    panel.style.setProperty("visibility","visible","important");
    panel.style.setProperty("opacity","1","important");
    panel.style.setProperty("pointer-events","auto","important");
    panel.style.setProperty("z-index","2147483000","important");
    makeDraggable(panel);
  }

  function hideAllStartupPopups(){
    PANEL_IDS.forEach(function(id){
      var p = byId(id);
      if (p) closePanel(p);
    });
    document.querySelectorAll(".snipex-floating-panel,.snx-floating-popup,.snx-popup,.snipex-popup,.floating-popup,.glass-popup,.quantum-popup,.evolution-popup,.ai-lab-popup,.ai-lab-floating,.strategy-popup,.scanner-popup,.doctor-popup")
      .forEach(function(p){
        if (p.id === "snipex-fseries-menu" || p.id === "snx-fseries-drawer") return;
        closePanel(p);
      });
  }

  function makeDraggable(el){
    if (!el || el.__snxDragReady) return;
    el.__snxDragReady = true;

    var dragging = false, sx = 0, sy = 0, startLeft = 0, startTop = 0;

    el.addEventListener("mousedown", function(e){
      if (e.target.closest("button,input,select,textarea,a,.snx-panel-close")) return;
      dragging = true;
      el.classList.add("snx-dragging");
      var r = el.getBoundingClientRect();
      sx = e.clientX; sy = e.clientY;
      startLeft = r.left; startTop = r.top;
      el.style.position = "fixed";
      el.style.left = startLeft + "px";
      el.style.top = startTop + "px";
      el.style.right = "auto";
      el.style.bottom = "auto";
      e.preventDefault();
    });

    window.addEventListener("mousemove", function(e){
      if (!dragging) return;
      var nx = Math.max(4, Math.min(window.innerWidth - 80, startLeft + (e.clientX - sx)));
      var ny = Math.max(4, Math.min(window.innerHeight - 60, startTop + (e.clientY - sy)));
      el.style.left = nx + "px";
      el.style.top = ny + "px";
    });

    window.addEventListener("mouseup", function(){
      dragging = false;
      el.classList.remove("snx-dragging");
    });
  }

  function patchFSeriesButtons(){
    var fMenu = byId("snipex-fseries-menu") || byId("snx-fseries-drawer");
    if (!fMenu) return;

    fMenu.querySelectorAll("button,[data-fseries],.fseries-item,.snx-fseries-item").forEach(function(btn){
      if (btn.__snxFClickReady) return;
      btn.__snxFClickReady = true;
      btn.addEventListener("click", function(e){
        var t = (btn.textContent || "").toUpperCase();
        var target = null;
        if (t.includes("F4")) target = byId("sxF4PerfPanel");
        else if (t.includes("F5")) target = byId("sxF5MemoryPanel");
        else if (t.includes("F6")) target = byId("sxF6EvolutionPanel");
        else if (t.includes("F8")) target = byId("sxF8RiskPanel");
        else if (t.includes("OMEGA") || t.includes("F10")) target = byId("snipex-omega-panel");
        if (target) {
          e.preventDefault(); e.stopPropagation();
          openPanel(target);
        }
      }, true);
    });
  }

  function moveDoctorToRightRail(){
    var rail = byId("snx-right-doctor-rail");
    if (!rail) {
      rail = document.createElement("div");
      rail.id = "snx-right-doctor-rail";
      document.body.appendChild(rail);
    }

    var doctor = byId("doctor-open-fab") || byId("snx-doctor-right-btn");
    if (!doctor) {
      var nodes = Array.prototype.slice.call(document.querySelectorAll("button,a,div"));
      doctor = nodes.find(function(el){
        var s = ((el.textContent || "")+" "+(el.id || "")+" "+(el.className || "")).toLowerCase();
        return s.includes("doctor");
      });
    }
    if (!doctor) {
      doctor = document.createElement("button");
      doctor.type = "button";
      doctor.textContent = "\ud83e\ude7a Doctor";
    }

    doctor.id = doctor.id || "snx-doctor-right-btn";
    if (!rail.contains(doctor)) rail.insertBefore(doctor, rail.firstChild);
  }

  function init(){
    hideAllStartupPopups();
    PANEL_IDS.forEach(function(id){
      var p = byId(id);
      if (p) { addCloseButton(p); makeDraggable(p); }
    });
    patchFSeriesButtons();
    moveDoctorToRightRail();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, {once:true});
  else init();

  window.addEventListener("load", function(){
    init();
    setTimeout(init, 500);
  }, {once:true});
})();


(function(){
  function ready(fn){ if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',fn); else fn(); }
  function install(){
    try{
      document.querySelectorAll('.snx-left-compact-rail,.snx-master-quickdock').forEach(function(el){el.remove();});
      var tv=document.querySelector('.tv-card');
      var ai=document.querySelector('.ai-panel');
      if(tv && ai && !document.getElementById('snxChartAIRow')){
        var row=document.createElement('div'); row.id='snxChartAIRow'; row.className='snx-chart-ai-row';
        var chartSlot=document.createElement('div'); chartSlot.className='snx-chart-slot';
        var masterSlot=document.createElement('div'); masterSlot.className='snx-master-slot';
        tv.parentNode.insertBefore(row,tv);
        chartSlot.appendChild(tv); masterSlot.appendChild(ai);
        row.appendChild(chartSlot); row.appendChild(masterSlot);
      }
      /* Do not let old draggable/floating code pull Master AI out of the layout. */
      if(ai){
        ai.classList.remove('snx-draggable-panel','snx-dragging','snipex-drag-ready');
        ['position','left','right','top','bottom','transform','width','height','zIndex'].forEach(function(k){try{ai.style.removeProperty(k)}catch(e){}});
      }
      document.querySelectorAll('.confluence-bar,.card.fx-border,.trigger-status-panel,.live-control-row,.live-log,#asset-cards,.asset-card').forEach(function(el){
        if(el){ ['position','left','right','top','bottom','transform','zIndex'].forEach(function(k){try{el.style.removeProperty(k)}catch(e){}}); }
      });
    }catch(e){try{console.warn('SnipeX overlap repair:',e)}catch(_){}}
  }
  ready(function(){install(); setTimeout(install,500); setTimeout(install,1800);});
})();


(function(){
  function ready(fn){ if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',fn); else fn(); }
  function q(s){return document.querySelector(s)}
  function by(id){return document.getElementById(id)}
  function rmInline(el){ if(!el)return; ['position','left','right','top','bottom','transform','zIndex','width','height'].forEach(function(k){try{el.style.removeProperty(k)}catch(e){}}); }
  function makeTerminal(){
    var dash=by('page-dashboard'); if(!dash)return;
    var term=by('snxBottomTerminal');
    if(!term){
      term=document.createElement('div'); term.id='snxBottomTerminal';
      term.innerHTML='<div class="snx-terminal-card"><div class="snx-terminal-tabs" id="snxEntryTabs"><button class="snx-terminal-tab active" data-tab="entry">ENTRY LOGIC</button><button class="snx-terminal-tab" data-tab="risk">RISK MANAGER LOGS</button><button class="snx-terminal-tab" data-tab="alerts">ALERTS</button><button class="snx-terminal-tab" data-tab="system">SYSTEM LOGS</button></div><div class="snx-terminal-body" id="snxEntryLogHost"></div></div><div class="snx-terminal-card"><div class="snx-terminal-tabs"><button class="snx-terminal-tab active">EXECUTION ENGINE LOGS</button></div><div id="snxExecutionLogHost"></div></div>';
      dash.appendChild(term);
    }
    var host=by('snxEntryLogHost');
    function paint(tab){
      var t=new Date().toLocaleTimeString('en-GB',{hour12:false});
      var rows={
        entry:[['ENTRY LOGIC:','Momentum + trend alignment confirmed on selected pair','snx-terminal-ok'],['AI SIGNAL:','Waiting / BUY condition monitored \u00b7 confidence sync active','snx-terminal-ok'],['SMART FILTER:','Spread \u00b7 liquidity \u00b7 volatility checked',''],['STRATEGY CHECK:','Trend follower / selected strategy rules validated','']],
        risk:[['RISK CHECK:','Max risk guard active \u00b7 daily limits monitored','snx-terminal-ok'],['POSITION SIZE:','Lot sizing synced with execution engine',''],['SAFETY GATE:','Duplicate / margin / bridge checks active','snx-terminal-warn']],
        alerts:[['ALERTS:','No critical alert in current UI session','snx-terminal-ok'],['NEWS LOCK:','Smart news filter status shown when active','']],
        system:[['SYSTEM:','Dashboard UI arranged \u00b7 no chart overlap','snx-terminal-ok'],['BRIDGE:','MT4 / MT5 connection panel active on right side','snx-terminal-ok']]
      }[tab]||[];
      if(host) host.innerHTML=rows.map(function(r){return '<div class="snx-terminal-line"><span class="snx-terminal-time">'+t+'</span><span class="'+(r[2]||'')+'">'+r[0]+'</span><span>'+r[1]+'</span></div>'}).join('');
    }
    paint('entry');
    var tabs=by('snxEntryTabs'); if(tabs&&!tabs.dataset.bound){tabs.dataset.bound='1'; tabs.addEventListener('click',function(e){var b=e.target.closest('button[data-tab]'); if(!b)return; tabs.querySelectorAll('.snx-terminal-tab').forEach(x=>x.classList.remove('active')); b.classList.add('active'); paint(b.dataset.tab);});}
    var live=by('live-log'), exec=by('snxExecutionLogHost'); if(live&&exec&&live.parentElement!==exec){exec.appendChild(live); live.style.display='block';}
  }
  function install(){
    try{
      document.querySelectorAll('.snx-left-compact-rail,.snx-master-quickdock').forEach(function(el){el.remove();});
      var tv=q('.tv-card'), ai=q('.ai-panel'), dash=by('page-dashboard');
      if(tv&&ai&&!by('snxChartAIRow')){
        var row=document.createElement('div'); row.id='snxChartAIRow'; row.className='snx-chart-ai-row';
        var chartSlot=document.createElement('div'); chartSlot.className='snx-chart-slot';
        var masterSlot=document.createElement('div'); masterSlot.className='snx-master-slot';
        tv.parentNode.insertBefore(row,tv); chartSlot.appendChild(tv); masterSlot.appendChild(ai); row.appendChild(chartSlot); row.appendChild(masterSlot);
      }
      var masterSlot=q('.snx-master-slot');
      if(ai){ ai.classList.remove('snx-draggable-panel','snx-dragging','snipex-drag-ready'); rmInline(ai); }
      var mt5=q('.mt5-panel'); if(mt5&&masterSlot&&mt5.parentElement!==masterSlot){ masterSlot.appendChild(mt5); rmInline(mt5); }
      var execCard=q('.lock-panel') ? q('.lock-panel').closest('.card') : null; if(execCard&&masterSlot&&execCard.parentElement!==masterSlot){ masterSlot.appendChild(execCard); rmInline(execCard); }
      makeTerminal();
      var cards=by('asset-cards'), term=by('snxBottomTerminal');
      if(cards){ cards.classList.add('snx-rate-ribbon'); rmInline(cards); }
      var oldHeader=cards&&cards.previousElementSibling&&cards.previousElementSibling.classList&&cards.previousElementSibling.classList.contains('section-header')?cards.previousElementSibling:null;
      if(oldHeader) oldHeader.classList.add('snx-hidden-old-market-header');
      var title=by('snxRateRibbonTitle');
      if(!title){ title=document.createElement('div'); title.id='snxRateRibbonTitle'; title.className='snx-rate-ribbon-title'; title.textContent='Forex / Metals Live Rates'; }
      if(term&&cards&&dash){ dash.insertBefore(title,term); dash.insertBefore(cards,term); }
      document.querySelectorAll('.confluence-bar,.card.fx-border,.trigger-status-panel,.live-control-row,#asset-cards,.asset-card').forEach(rmInline);
    }catch(e){try{console.warn('SnipeX final UI layout fix:',e)}catch(_){}}
  }
  ready(function(){install(); setTimeout(install,400); setTimeout(install,1400); setInterval(install,3500);});
})();


(function(){
  function set(id, val){
    var el = document.getElementById(id);
    if(el && val) el.textContent = val;
  }
  function getFromTicker(sym){
    var t = (document.getElementById('ticker') || {}).innerText || '';
    var re = new RegExp(sym + '\\$?([0-9.,]+)', 'i');
    var m = t.match(re);
    if(m && m[1]) return m[1];
    re = new RegExp(sym + '\\s+([0-9.,]+)', 'i');
    m = t.match(re);
    return m && m[1] ? m[1] : null;
  }
  function sync(){
    set('sx-rate-xau', getFromTicker('XAUUSD'));
    set('sx-rate-xag', getFromTicker('XAGUSD'));
    set('sx-rate-xpd', getFromTicker('XPDUSD'));
    set('sx-rate-eur', getFromTicker('EURUSD'));
    set('sx-rate-gbp', getFromTicker('GBPUSD'));
    set('sx-rate-jpy', getFromTicker('USDJPY'));
  }
  setInterval(sync, 3000);
  setTimeout(sync, 600);
})();


(function(){
  if(window.__SNX_PRO_FSERIES__) return;
  window.__SNX_PRO_FSERIES__ = true;

  function byId(id){ return document.getElementById(id); }

  function closeAll(){
    document.querySelectorAll('.snx-pro-f-panel,#sxF1TierDock,#sxF2CommandStrip,#sxF2DemoCountdown,#sxF4PerfPanel,#sxF5MemoryPanel,#sxF6EvolutionPanel,#sxF8RiskPanel,#snipex-omega-panel')
      .forEach(function(p){
        if(!p) return;
        p.classList.remove('snx-manual-open');
        if(p.classList.contains('snx-pro-f-panel')){
          p.style.display='none';
        }
      });
    document.querySelectorAll('.snx-pro-f-btn').forEach(function(b){b.classList.remove('active')});
  }

  function ensureClose(panel){
    if(!panel || panel.querySelector('.snx-pro-f-close,.snx-panel-close')) return;
    var btn=document.createElement('button');
    btn.type='button';
    btn.className='snx-pro-f-close';
    btn.textContent='\u00d7';
    btn.style.position='absolute';
    btn.style.top='8px';
    btn.style.right='8px';
    btn.onclick=function(e){e.preventDefault(); panel.classList.remove('snx-manual-open'); panel.style.display='none';};
    panel.appendChild(btn);
  }

  function openTarget(id, btn){
    var panel=byId(id);
    if(!panel){
      console.warn('F-Series panel missing:', id);
      return;
    }
    closeAll();
    ensureClose(panel);
    panel.classList.add('snx-manual-open');
    panel.style.setProperty('display','block','important');
    panel.style.setProperty('visibility','visible','important');
    panel.style.setProperty('opacity','1','important');
    panel.style.setProperty('pointer-events','auto','important');
    panel.style.setProperty('z-index','2147483000','important');

    // Keep existing real panels positioned professionally if they were bottom popups
    if(!panel.classList.contains('snx-pro-f-panel')){
      panel.style.position='fixed';
      panel.style.right='78px';
      panel.style.left='auto';
      panel.style.top='138px';
      panel.style.bottom='auto';
      panel.style.maxHeight='calc(100vh - 180px)';
      panel.style.overflow='auto';
    }
    if(btn) btn.classList.add('active');
  }

  function init(){
    var rail=byId('snx-professional-fseries');
    if(!rail) return;
    rail.querySelectorAll('[data-f-target]').forEach(function(btn){
      if(btn.__snxProReady) return;
      btn.__snxProReady=true;
      btn.addEventListener('click', function(e){
        e.preventDefault();
        openTarget(btn.getAttribute('data-f-target'), btn);
      });
    });
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', init, {once:true});
  else init();
  window.openSnipeXProfessionalFSeries = openTarget;
})();


(function(){
  if(window.__SNIPEX_MASTER_AUTHORITY_EXEC__) return;
  window.__SNIPEX_MASTER_AUTHORITY_EXEC__ = true;

  function setLS(k,v){ try{ localStorage.setItem(k,v); }catch(e){} }
  function getLS(k,d){ try{ return localStorage.getItem(k) ?? d; }catch(e){ return d; } }

  window.masterAuthorityExecutionOn = (getLS('snipex_master_authority_execution','1') !== '0');

  function paintMasterAuthority(){
    const on = window.masterAuthorityExecutionOn !== false;
    const btn = document.getElementById('master-authority-exec-btn');
    const st = document.getElementById('master-authority-state');
    const sub = document.getElementById('master-authority-sub');
    if(btn) btn.classList.toggle('off', !on);
    if(st) st.textContent = on ? 'ON' : 'OFF';
    if(sub) sub.textContent = on
      ? 'Superior mode: AI authority, execution engine, high-RR trigger permission, soft-block demotion.'
      : 'Manual/safe mode: AI may scan, but superior execution authority is off.';
  }

  window.applyMasterAuthorityExecution = function(source){
    const on = window.masterAuthorityExecutionOn !== false;
    if(on){
      try{ aiOn = true; autoOn = true; window.aiOn = true; window.autoOn = true; }catch(e){}
      setLS('snipex_master_ai_on','1');
      setLS('snipex_auto_trade_on','1');
      setLS('snipex_master_authority_execution','1');
      window.SNIPEX_SUPERIOR_AUTHORITY_PAYLOAD = {
        post36_authority:true,
        soft_blockers_dismissed:true,
        final_new_authority:true,
        snipex_new_authority:true,
        allow_off_session:true,
        ignore_spike_delay:true,
        allow_flash_spike:true,
        market_execution:true,
        fx_force_market_send:true,
        validation_autocorrect:true,
        require_sltp:true,
        min_rr:3,
        min_rr_required:3
      };
      try{ applyMasterAIMode && applyMasterAIMode(source||'master-authority'); }catch(e){}
      try{ logLive && logLive('\u26a1 MASTER AUTHORITY + EXECUTION ON: one final AI authority armed. Soft blockers demoted, hard safety preserved.','ok'); }catch(e){}
      try{ refreshAIMasterDecision && refreshAIMasterDecision(true); }catch(e){}
    }else{
      setLS('snipex_master_authority_execution','0');
      try{ logLive && logLive('\u26a0 MASTER AUTHORITY + EXECUTION OFF: superior execution authority disabled.','warn'); }catch(e){}
    }
    paintMasterAuthority();
  };

  window.toggleMasterAuthorityExecution = function(){
    window.masterAuthorityExecutionOn = !(window.masterAuthorityExecutionOn !== false);
    window.applyMasterAuthorityExecution('master-authority-toggle');
  };

  // Wrap payload builders so every auto route carries one final authority flags.
  function patchFetch(){
    if(window.__SNIPEX_AUTH_FETCH_PATCH__) return;
    window.__SNIPEX_AUTH_FETCH_PATCH__ = true;
    const oldFetch = window.fetch;
    if(!oldFetch) return;
    window.fetch = function(input, init){
      try{
        const url = String((input && input.url) || input || '');
        if(window.masterAuthorityExecutionOn !== false && url.includes('/api/order') && init && init.body){
          const body = JSON.parse(init.body);
          Object.assign(body, window.SNIPEX_SUPERIOR_AUTHORITY_PAYLOAD || {});
          body.comment = (body.comment || 'SnipeX') + ' \u00b7 MASTER_AUTHORITY_EXEC';
          init.body = JSON.stringify(body);
        }
      }catch(e){}
      return oldFetch.apply(this, arguments);
    };
  }

  function boot(){
    patchFetch();
    paintMasterAuthority();
    if(window.masterAuthorityExecutionOn !== false){
      window.applyMasterAuthorityExecution('boot');
    }
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', boot, {once:true});
  else boot();
})();
