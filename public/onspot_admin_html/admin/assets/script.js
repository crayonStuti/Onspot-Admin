/* ==========================================================================
   S.P.O.T. — Combined Script
   All page scripts extracted from individual HTML files.
   Per-page code is wrapped in an IIFE guarded by a body.page-<name> class
   so only the active page's code runs.
   ========================================================================== */

(function () {
  var body = document.body;
  if (!body) return;

  /* ==========================================================================
     RESPONSIVE — inject a hamburger button into the topbar and wire the
     mobile sidebar toggle. Runs on every page.
     ========================================================================== */
  (function setupResponsive() {
    var topbar = document.querySelector('.topbar');
    var sidebar = document.querySelector('.sidebar');
    if (!topbar || !sidebar) return;

    // Hamburger
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'menu-toggle';
    btn.setAttribute('aria-label', 'Toggle menu');
    btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>';
    topbar.insertBefore(btn, topbar.firstChild);

    // Backdrop
    var backdrop = document.createElement('div');
    backdrop.className = 'sidebar-backdrop';
    document.body.appendChild(backdrop);

    function close() { body.classList.remove('sidebar-open'); }
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      body.classList.toggle('sidebar-open');
    });
    backdrop.addEventListener('click', close);
    // Close when a sidebar nav link is tapped (navigation about to happen)
    sidebar.addEventListener('click', function (e) {
      if (e.target.closest('a')) close();
    });
    // Close if the viewport grows past the mobile breakpoint
    window.addEventListener('resize', function () {
      if (window.innerWidth > 1024) close();
    });
  })();

  /* ==========================================================================
     CHART TOOLTIPS — any element carrying a [data-tip] attribute shows a
     floating tooltip with its details on hover. Runs on every page so it
     covers every donut/pie chart in the site.
     ========================================================================== */
  (function setupChartTooltips() {
    var tip = document.createElement('div');
    tip.className = 'chart-tip';
    tip.style.display = 'none';
    document.body.appendChild(tip);

    function place(x, y) {
      tip.style.left = (x + 14) + 'px';
      tip.style.top = (y + 14) + 'px';
    }
    function hide() { tip.style.display = 'none'; }

    document.addEventListener('mouseover', function (e) {
      var t = e.target.closest && e.target.closest('[data-tip]');
      if (!t) return;
      tip.textContent = t.getAttribute('data-tip');
      tip.style.display = 'block';
      place(e.clientX, e.clientY);
    });
    document.addEventListener('mousemove', function (e) {
      if (tip.style.display !== 'block') return;
      var t = e.target.closest && e.target.closest('[data-tip]');
      if (t) place(e.clientX, e.clientY);
      else hide();
    });
    document.addEventListener('mouseout', function (e) {
      if (e.target.closest && e.target.closest('[data-tip]')) hide();
    });
  })();

  /* ==========================================================================
     PAGE: index  (from index.html)
     ========================================================================== */
  if (body.classList.contains('page-index')) {
    /* ============================================================
       DASHBOARD CHART DATA
       ----------------------------------------------------------
       Edit the values inside dashboardData to update any chart.
       Call dashboardCharts.render() after changing data, or use
       the helper setters (e.g. dashboardCharts.setSparkline(...)).
    ============================================================ */
    (function () {
      'use strict';
    
      const dashboardData = {
        // Sparkline values: higher = higher on the chart.
        sparklines: {
          totalUsers:        { values: [11, 18, 16, 26, 28, 36, 38, 44, 46], trend: 'up' },
          activeUsers:       { values: [14, 16, 24, 22, 32, 30, 38, 42, 48], trend: 'up' },
          freeMembers:       { values: [12, 20, 18, 26, 28, 34, 36, 42, 44], trend: 'up' },
          premiumMembers:    { values: [36, 34, 26, 28, 22, 24, 18, 16, 12], trend: 'down' },
          expiringMembers:   { values: [18, 26, 34, 40, 38, 30, 26, 20, 16], trend: 'down' },
          licensesUploaded:  { values: [12, 18, 24, 28, 34, 38, 42, 46, 48], trend: 'up' },
          reportsPending:    { values: [16, 22, 28, 34, 36, 30, 26, 20, 14], trend: 'down' },
          revenue:           { values: [10, 16, 14, 22, 24, 32, 36, 42, 46], trend: 'up' }
        },
    
        states: [
          { name: 'Texas',          value: 2100 },
          { name: 'Florida',        value: 2950 },
          { name: 'Ohio',           value: 1100 },
          { name: 'Michigan',       value: 750  },
          { name: 'Pennslviana',    value: 2600 },
          { name: 'Wisconsin',      value: 2200 },
          { name: 'Georgia',        value: 350  },
          { name: 'Illionis',       value: 900  },
          { name: 'North Carolina', value: 1400 },
          { name: 'Tennesses',      value: 150  }
        ],
    
        growth: [
          { label: 'Jan', value: 0     },
          { label: 'Feb', value: 12000 },
          { label: 'Mar', value: 20000 },
          { label: 'Apr', value: 33000 },
          { label: 'May', value: 40000 },
          { label: 'Jun', value: 50000 }
        ],
    
        conversion: [
          { label: 'Free',    value: 58.4, color: '#3a5230' },
          { label: 'Basic',   value: 21.3, color: '#d4c79a' },
          { label: 'Premium', value: 20.3, color: '#5da3f5' }
        ],
    
        conversionCenter: { total: '24,564', label: 'Total Users' },
    
        // Variants the dropdowns can switch between
        growthVariants: {
          7:   [ {label:'Mon',value:6500},{label:'Tue',value:7200},{label:'Wed',value:6900},{label:'Thu',value:8400},{label:'Fri',value:9100},{label:'Sat',value:7800},{label:'Sun',value:8600} ],
          30:  [ {label:'Jan',value:0},{label:'Feb',value:12000},{label:'Mar',value:20000},{label:'Apr',value:33000},{label:'May',value:40000},{label:'Jun',value:50000} ],
          90:  [ {label:'Apr',value:33000},{label:'May',value:40000},{label:'Jun',value:50000},{label:'Jul',value:62000},{label:'Aug',value:74000},{label:'Sep',value:88000} ],
          365: [ {label:'Q1',value:32000},{label:'Q2',value:58000},{label:'Q3',value:84000},{label:'Q4',value:110000} ]
        },
        conversionVariants: {
          7:  [ {label:'Free',value:62.1,color:'#3a5230'},{label:'Basic',value:19.0,color:'#d4c79a'},{label:'Premium',value:18.9,color:'#5da3f5'} ],
          30: [ {label:'Free',value:58.4,color:'#3a5230'},{label:'Basic',value:21.3,color:'#d4c79a'},{label:'Premium',value:20.3,color:'#5da3f5'} ],
          90: [ {label:'Free',value:54.0,color:'#3a5230'},{label:'Basic',value:23.5,color:'#d4c79a'},{label:'Premium',value:22.5,color:'#5da3f5'} ]
        },
    
        users: [
          { id:1, name:'John Smith',   email:'JohnS@gmail.com',     avatar:12, plan:'Premium', joined:'2026-04-03', status:'Active'   },
          { id:2, name:'Sarah Michael',email:'SarahMic@gmail.com',  avatar:47, plan:'Premium', joined:'2026-04-03', status:'Active'   },
          { id:3, name:'Mike Thomson', email:'Miketh@gmail.com',    avatar:33, plan:'Free',    joined:'2026-03-27', status:'Inactive' },
          { id:4, name:'John Smith',   email:'JohnSim@gmail.com',   avatar:15, plan:'Premium', joined:'2026-03-25', status:'Active'   },
          { id:5, name:'Jessica Lee',  email:'Jesslee@gmail.com',   avatar:45, plan:'Free',    joined:'2026-03-16', status:'Active'   },
          { id:6, name:'Davin William',email:'Davwiliam@gmail.com', avatar:52, plan:'Basic',   joined:'2026-03-25', status:'Inactive' }
        ]
      };
    
      const dashState = { topSearch: '', usersView: 'recent' };
    
      /* ---------- Helpers ---------- */
      function fmtNum(n) {
        if (n >= 1000) {
          const k = n / 1000;
          return (k >= 10 ? Math.round(k) : k.toFixed(1).replace(/\.0$/, '')) + 'k';
        }
        return Math.round(n).toString();
      }
    
      function setHTML(el, html) { el.innerHTML = html; }
    
      /* ---------- Sparkline ---------- */
      function renderSparkline(svg, values, trend) {
        if (!values || values.length < 2) { svg.innerHTML = ''; return; }
        const w = 200, h = 56;
        const max = Math.max(...values), min = Math.min(...values);
        const range = (max - min) || 1;
    
        const pts = values.map((v, i) => {
          const x = (i / (values.length - 1)) * w;
          const y = h - 8 - ((v - min) / range) * (h - 18);
          return [x.toFixed(1), y.toFixed(1)];
        });
    
        const line = pts.map((p, i) => (i ? 'L' : 'M') + p[0] + ',' + p[1]).join(' ');
        const area = line + ` L${w},${h} L0,${h} Z`;
    
        const up = trend === 'up';
        const stroke = up ? '#34A853' : '#d24a4a';
        const fill   = up ? '#34A853' : '#e88080';
        const gid    = 'sg_' + Math.random().toString(36).slice(2, 9);

        setHTML(svg,
          `<defs><linearGradient id="${gid}" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stop-color="${fill}" stop-opacity="1"/>
            <stop offset="100%" stop-color="${fill}" stop-opacity="0"/>
          </linearGradient></defs>
          <path d="${area}" fill="url(#${gid})"/>
          <path d="${line}" fill="none" stroke="${stroke}" stroke-width="1.6"/>`);
      }
    
      /* ---------- States bar chart ---------- */
      function renderStates(svg, items) {
        if (!items.length) { svg.innerHTML = ''; return; }
        const chartX = 105, chartW = 260, rowH = 30, startY = 12;
        const max = Math.max(...items.map(i => i.value)) || 1;
    
        // Pick a nice step so axis labels read cleanly (0, 500, 1k, 1.5k, …)
        const step    = max < 3000 ? 500 : max < 6000 ? 1000 : 2000;
        const niceMax = Math.ceil(max / step) * step;
        const ticks   = niceMax / step + 1;
        const bottomY = startY + items.length * rowH;
    
        // State name labels (left axis)
        let html = '<g font-size="11" fill="#7a7a7a" font-family="Segoe UI">';
        items.forEach((it, i) => {
          const y = startY + i * rowH + 12;
          html += `<text x="0" y="${y}">${it.name}</text>`;
        });
        html += '</g>';
    
        // Vertical grid lines — warm dashed
        html += '<g stroke="#e8c896" stroke-dasharray="1 5" stroke-width="0.8" stroke-linecap="round">';
        for (let t = 0; t < ticks; t++) {
          const x = chartX + (t / (ticks - 1)) * chartW;
          html += `<line x1="${x}" y1="0" x2="${x}" y2="${bottomY}"/>`;
        }
        html += '</g>';
    
        // Sage green bars
        html += '<g fill="#5e7d5a">';
        items.forEach((it, i) => {
          const y  = startY + i * rowH + 4;
          const bw = (it.value / niceMax) * chartW;
          html += `<rect x="${chartX}" y="${y}" width="${bw.toFixed(1)}" height="13" rx="2"/>`;
        });
        html += '</g>';
    
        // X-axis tick labels
        html += '<g font-size="10" fill="#9a9a9a" font-family="Segoe UI" text-anchor="middle">';
        for (let t = 0; t < ticks; t++) {
          const x = chartX + (t / (ticks - 1)) * chartW;
          const v = t * step;
          const lbl = v === 0 ? '0' : fmtNum(v);
          html += `<text x="${x}" y="${bottomY + 20}">${lbl}</text>`;
        }
        html += '</g>';
    
        setHTML(svg, html);
      }
    
      /* ---------- Growth line/area chart ---------- */
      function renderGrowth(svg, pts) {
        if (pts.length < 2) { svg.innerHTML = ''; return; }
        const W = 460, H = 230, pL = 40, pR = 10, pT = 20, pB = 25;
        const cw = W - pL - pR, ch = H - pT - pB;
        const max = Math.max(...pts.map(p => p.value)) || 1;
        const niceMax = Math.ceil(max / 10000) * 10000 || max * 1.1;
        const yTicks = 5;
    
        let html = '<g stroke="#f1f1ed" stroke-dasharray="2 4">';
        for (let i = 0; i < yTicks; i++) {
          const y = pT + (i / (yTicks - 1)) * ch;
          html += `<line x1="${pL}" y1="${y}" x2="${W - pR}" y2="${y}"/>`;
        }
        html += '</g>';
    
        html += '<g font-size="10" fill="#999" font-family="Segoe UI">';
        for (let i = 0; i < yTicks; i++) {
          const v = niceMax * (1 - i / (yTicks - 1));
          const y = pT + (i / (yTicks - 1)) * ch;
          html += `<text x="6" y="${y + 4}">${fmtNum(v)}</text>`;
        }
        html += '</g>';
    
        const points = pts.map((p, i) => ({
          x: pL + (i / (pts.length - 1)) * cw,
          y: pT + ch - (p.value / niceMax) * ch,
          label: p.label
        }));
    
        const linePath = points.map((p, i) => (i ? 'L' : 'M') + p.x.toFixed(1) + ',' + p.y.toFixed(1)).join(' ');
        const areaPath = linePath + ` L${points[points.length - 1].x.toFixed(1)},${pT + ch} L${points[0].x.toFixed(1)},${pT + ch} Z`;
    
        html += `<defs><linearGradient id="grow_grad" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stop-color="#5da3f5" stop-opacity=".45"/>
          <stop offset="100%" stop-color="#5da3f5" stop-opacity="0"/>
        </linearGradient></defs>
        <path d="${areaPath}" fill="url(#grow_grad)"/>
        <path d="${linePath}" fill="none" stroke="#3a86d6" stroke-width="2.2"/>`;
    
        html += '<g fill="#fff" stroke="#3a86d6" stroke-width="2">';
        points.forEach(p => { html += `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="4"/>`; });
        html += '</g>';
    
        html += '<g font-size="10" fill="#999" font-family="Segoe UI" text-anchor="middle">';
        points.forEach(p => { html += `<text x="${p.x.toFixed(1)}" y="${H - 8}">${p.label}</text>`; });
        html += '</g>';
    
        setHTML(svg, html);
      }
    
      /* ---------- Donut ---------- */
      function renderDonut(svg, segs, center) {
        if (!segs.length) { svg.innerHTML = ''; return; }
        const cx = 100, cy = 100, r = 70, sw = 40;
        const total = segs.reduce((s, x) => s + x.value, 0) || 1;
    
        let html = `<g transform="rotate(-90 ${cx} ${cy})">`;
        let offset = 0;
        segs.forEach(s => {
          const pct = (s.value / total) * 100;
          html += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none"
            stroke="${s.color}" stroke-width="${sw}" pathLength="100"
            stroke-dasharray="${pct.toFixed(2)} ${(100 - pct).toFixed(2)}"
            stroke-dashoffset="${(-offset).toFixed(2)}"
            class="donut-seg" data-tip="${s.label} — ${pct.toFixed(1)}%"/>`;
          offset += pct;
        });
        html += '</g>';
    
        if (center) {
          html += `<text x="${cx}" y="${cy - 2}" text-anchor="middle" font-size="18" font-weight="700" fill="#1f1f1f" font-family="Segoe UI">${center.total}</text>
            <text x="${cx}" y="${cy + 14}" text-anchor="middle" font-size="9" fill="#888" font-family="Segoe UI">${center.label}</text>`;
        }

        let cum = 0;
        segs.forEach(s => {
          const pct = (s.value / total) * 100;
          const mid = cum + pct / 2;
          const a = (mid / 100) * 2 * Math.PI - Math.PI / 2;
          const lx = cx + r * Math.cos(a);
          const ly = cy + r * Math.sin(a);
          html += `<text x="${lx.toFixed(1)}" y="${(ly + 3).toFixed(1)}" text-anchor="middle" font-size="11" font-weight="700" fill="#fff" font-family="Segoe UI">${pct.toFixed(1)}%</text>`;
          cum += pct;
        });

        setHTML(svg, html);
      }
    
      /* ---------- Users table on dashboard ---------- */
      function fmtDate(iso) {
        const d = new Date(iso);
        if (isNaN(d)) return iso;
        return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
      }
      function pillClass(plan) {
        if (plan === 'Free')  return 'pill free';
        if (plan === 'Basic') return 'pill basic';
        return 'pill';
      }
      function renderUsersTable() {
        const tbody = document.getElementById('dash-users-tbody');
        const empty = document.getElementById('dash-users-empty');
        if (!tbody) return;
    
        const q = dashState.topSearch.toLowerCase().trim();
        let rows = dashboardData.users.filter(u => {
          if (dashState.usersView === 'active'   && u.status !== 'Active')   return false;
          if (dashState.usersView === 'inactive' && u.status !== 'Inactive') return false;
          if (dashState.usersView === 'premium'  && u.plan   !== 'Premium')  return false;
          if (q) {
            const hay = (u.name + ' ' + u.email).toLowerCase();
            if (!q.split(/\s+/).every(w => hay.includes(w))) return false;
          }
          return true;
        });
    
        tbody.innerHTML = rows.map(u => `
          <tr>
            <td><div class="user-cell"><img class="avatar" src="https://i.pravatar.cc/60?img=${u.avatar}" alt=""> ${u.name}</div></td>
            <td class="muted">${u.email}</td>
            <td><span class="${pillClass(u.plan)}">${u.plan}</span></td>
            <td class="muted">${fmtDate(u.joined)}</td>
            <td><span class="status ${u.status.toLowerCase()}"><span class="dot"></span>${u.status}</span></td>
            <td class="actions-cell">
              <button class="act-btn" type="button" title="View" aria-label="View">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z"/><circle cx="12" cy="12" r="3"/></svg>
              </button>
              <div class="act-menu-wrap">
                <button class="act-btn act-more" type="button" aria-label="More actions">
                  <svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="1.7"/><circle cx="12" cy="12" r="1.7"/><circle cx="12" cy="19" r="1.7"/></svg>
                </button>
                <div class="act-menu" role="menu">
                  <a href="#" role="menuitem"><span class="mi-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8"/></svg></span>View Profile</a>
                  <a href="#" role="menuitem"><span class="mi-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z"/></svg></span>Edit Membership</a>
                  <a href="#" role="menuitem"><span class="mi-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><line x1="12" y1="8" x2="12" y2="12"/><circle cx="12" cy="16" r="0.6" fill="currentColor"/></svg></span>Suspend Account</a>
                  <a href="#" role="menuitem"><span class="mi-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg></span>Reset Password</a>
                  <a href="#" role="menuitem"><span class="mi-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="2" y="7" width="20" height="12" rx="2"/><line x1="2" y1="11" x2="22" y2="11"/></svg></span>View Uploaded Licenses</a>
                </div>
              </div>
            </td>
          </tr>
        `).join('');
    
        if (empty) empty.style.display = rows.length === 0 ? 'block' : 'none';
      }
    
      /* ---------- Render everything ---------- */
      function renderAll() {
        document.querySelectorAll('[data-spark]').forEach(svg => {
          const key = svg.getAttribute('data-spark');
          const cfg = dashboardData.sparklines[key];
          if (cfg) renderSparkline(svg, cfg.values, cfg.trend);
        });
    
        const s = document.getElementById('chart-states');
        if (s) renderStates(s, dashboardData.states);
    
        const g = document.getElementById('chart-growth');
        if (g) renderGrowth(g, dashboardData.growth);
    
        const c = document.getElementById('chart-conversion');
        if (c) renderDonut(c, dashboardData.conversion, dashboardData.conversionCenter);
    
        renderUsersTable();
      }
    
      /* ---------- Wire up controls ---------- */
      function wireControls() {
        const ts = document.getElementById('top-search');
        if (ts) ts.addEventListener('input', e => {
          dashState.topSearch = e.target.value;
          renderUsersTable();
        });
    
        const uv = document.getElementById('users-view');
        if (uv) uv.addEventListener('change', e => {
          dashState.usersView = e.target.value;
          renderUsersTable();
        });
    
        const sr = document.getElementById('states-range');
        if (sr) sr.addEventListener('change', e => {
          const v = e.target.value;
          const sorted = [...dashboardData.states].sort((a,b) => b.value - a.value);
          const slice = v === 'all' ? sorted : sorted.slice(0, +v);
          const svg = document.getElementById('chart-states');
          if (svg) renderStates(svg, slice);
        });
    
        const gr = document.getElementById('growth-range');
        if (gr) gr.addEventListener('change', e => {
          const next = dashboardData.growthVariants[e.target.value];
          if (next) {
            dashboardData.growth = next;
            const svg = document.getElementById('chart-growth');
            if (svg) renderGrowth(svg, next);
          }
        });
    
        const cr = document.getElementById('conversion-range');
        if (cr) cr.addEventListener('change', e => {
          const next = dashboardData.conversionVariants[e.target.value];
          if (next) {
            dashboardData.conversion = next;
            const svg = document.getElementById('chart-conversion');
            if (svg) renderDonut(svg, next, dashboardData.conversionCenter);
          }
        });
      }
    
      /* ---------- Public API ---------- */
      window.dashboardCharts = {
        data: dashboardData,
        render: renderAll,
        setSparkline(key, values, trend) {
          dashboardData.sparklines[key] = { values, trend: trend || (dashboardData.sparklines[key] && dashboardData.sparklines[key].trend) || 'up' };
          renderAll();
        },
        setStates(items)     { dashboardData.states     = items;   renderAll(); },
        setGrowth(items)     { dashboardData.growth     = items;   renderAll(); },
        setConversion(segs, center) {
          dashboardData.conversion = segs;
          if (center) dashboardData.conversionCenter = center;
          renderAll();
        }
      };
    
      /* ----- Actions 3-dot menu toggle (dashboard users table) ----- */
      function wireActionsMenu() {
        const tbody = document.getElementById('dash-users-tbody');
        if (!tbody) return;
        tbody.addEventListener('click', e => {
          const trigger = e.target.closest('.act-more');
          if (trigger) {
            e.stopPropagation();
            const wrap = trigger.parentElement;
            const wasOpen = wrap.classList.contains('open');
            document.querySelectorAll('.act-menu-wrap.open').forEach(el => el.classList.remove('open'));
            if (!wasOpen) wrap.classList.add('open');
            return;
          }
          if (e.target.closest('.act-menu a')) {
            document.querySelectorAll('.act-menu-wrap.open').forEach(el => el.classList.remove('open'));
          }
        });
        document.addEventListener('click', () => {
          document.querySelectorAll('.act-menu-wrap.open').forEach(el => el.classList.remove('open'));
        });
      }

      function init() {
        renderAll();
        wireControls();
        wireActionsMenu();
      }
    
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
      } else {
        init();
      }
    })();
  }

  /* ==========================================================================
     PAGE: users  (from users.html)
     ========================================================================== */
  if (body.classList.contains('page-users')) {
    /* =============================================================
       USERS PAGE — data + filter wiring
       ----------------------------------------------------------
       Edit `usersData` to change the table contents. All filters
       (name, state, plan, status, date, top search) update live.
    ============================================================= */
    (function () {
      'use strict';
    
      const usersData = [
        { id:1, name:'John Smith',   email:'JohnS@gmail.com',     avatar:12, plan:'Premium', joined:'2026-04-03', status:'Active',   state:'Texas' },
        { id:2, name:'Sarah Michael',email:'SarahMic@gmail.com',  avatar:47, plan:'Premium', joined:'2026-04-03', status:'Active',   state:'Florida' },
        { id:3, name:'Mike Thomson', email:'Miketh@gmail.com',    avatar:33, plan:'Free',    joined:'2026-03-27', status:'Inactive', state:'Ohio' },
        { id:4, name:'John Smith',   email:'JohnSim@gmail.com',   avatar:15, plan:'Premium', joined:'2026-03-25', status:'Active',   state:'Michigan' },
        { id:5, name:'Jessica Lee',  email:'Jesslee@gmail.com',   avatar:45, plan:'Free',    joined:'2026-03-16', status:'Active',   state:'Pennsylvania' },
        { id:6, name:'Davin William',email:'Davwiliam@gmail.com', avatar:52, plan:'Basic',   joined:'2026-03-25', status:'Inactive', state:'Georgia' },
        { id:7, name:'John Smith',   email:'JohnS@gmail.com',     avatar:22, plan:'Premium', joined:'2026-04-03', status:'Active',   state:'Texas' },
        { id:8, name:'Emma Michael', email:'emmamic@gmail.com',   avatar:48, plan:'Premium', joined:'2026-04-03', status:'Active',   state:'Florida' }
      ];
    
      const filters = { name:'', state:'', plan:'', status:'', date:'', topSearch:'', view:'all' };
      const selectedIds = new Set();
    
      const $ = id => document.getElementById(id);
      const tbody  = $('users-tbody');
      const empty  = $('users-empty');
      const count  = $('users-count');
    
      function fmtDate(iso) {
        if (!iso) return '';
        const d = new Date(iso);
        if (isNaN(d)) return iso;
        const dd = String(d.getDate()).padStart(2,'0');
        const mm = String(d.getMonth()+1).padStart(2,'0');
        return `${dd}/${mm}/${d.getFullYear()}`;
      }
    
      function pillClass(plan) {
        if (plan === 'Free')  return 'pill free';
        if (plan === 'Basic') return 'pill basic';
        return 'pill';
      }
    
      function applyFilters() {
        const q = (filters.name + ' ' + filters.topSearch).toLowerCase().trim();
        return usersData.filter(u => {
          if (q) {
            const hay = (u.name + ' ' + u.email).toLowerCase();
            // require every search word to appear
            const words = q.split(/\s+/).filter(Boolean);
            if (!words.every(w => hay.includes(w))) return false;
          }
          if (filters.state  && u.state  !== filters.state)  return false;
          if (filters.plan   && u.plan   !== filters.plan)   return false;
          if (filters.status && u.status !== filters.status) return false;
          if (filters.date   && u.joined !== filters.date)   return false;
          if (filters.view === 'active'   && u.status !== 'Active')   return false;
          if (filters.view === 'inactive' && u.status !== 'Inactive') return false;
          if (filters.view === 'premium'  && u.plan   !== 'Premium')  return false;
          return true;
        });
      }
    
      function renderTable() {
        const rows = applyFilters();
    
        tbody.innerHTML = rows.map(u => `
          <tr data-id="${u.id}">
            <td><input type="checkbox" class="checkbox row-check" data-id="${u.id}" ${selectedIds.has(u.id) ? 'checked' : ''}></td>
            <td><div class="user-cell"><img class="avatar" src="https://i.pravatar.cc/60?img=${u.avatar}" alt=""> ${u.name}</div></td>
            <td class="muted">${u.email}</td>
            <td><span class="${pillClass(u.plan)}">${u.plan}</span></td>
            <td class="muted">${fmtDate(u.joined)}</td>
            <td><span class="status ${u.status.toLowerCase()}"><span class="dot"></span>${u.status}</span></td>
            <td class="actions-cell">
              <button class="act-btn" type="button" title="View" aria-label="View">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z"/><circle cx="12" cy="12" r="3"/></svg>
              </button>
              <div class="act-menu-wrap">
                <button class="act-btn act-more" type="button" data-id="${u.id}" aria-label="More actions" aria-haspopup="menu" aria-expanded="false">
                  <svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="1.7"/><circle cx="12" cy="12" r="1.7"/><circle cx="12" cy="19" r="1.7"/></svg>
                </button>
                <div class="act-menu" role="menu">
                  <a href="#" role="menuitem"><span class="mi-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8"/></svg></span>View Profile</a>
                  <a href="#" role="menuitem"><span class="mi-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z"/></svg></span>Edit Membership</a>
                  <a href="#" role="menuitem"><span class="mi-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><line x1="12" y1="8" x2="12" y2="12"/><circle cx="12" cy="16" r="0.6" fill="currentColor"/></svg></span>Suspend Account</a>
                  <a href="#" role="menuitem"><span class="mi-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg></span>Reset Password</a>
                  <a href="#" role="menuitem"><span class="mi-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="2" y="7" width="20" height="12" rx="2"/><line x1="2" y1="11" x2="22" y2="11"/></svg></span>View Uploaded Licenses</a>
                </div>
              </div>
            </td>
          </tr>
        `).join('');
    
        empty.style.display = rows.length === 0 ? 'block' : 'none';
        count.textContent   = rows.length
          ? `Showing ${rows.length} of ${usersData.length} users` + (selectedIds.size ? `  ·  ${selectedIds.size} selected` : '')
          : '';
    
        // Sync "select all"
        const sa = $('select-all');
        if (sa) {
          const visibleIds = rows.map(r => r.id);
          sa.checked = visibleIds.length > 0 && visibleIds.every(id => selectedIds.has(id));
          sa.indeterminate = !sa.checked && visibleIds.some(id => selectedIds.has(id));
        }
      }
    
      /* ----- Wire up filter inputs ----- */
      $('filter-name').addEventListener('input', e => {
        filters.name = e.target.value; renderTable();
      });
      $('filter-state').addEventListener('change', e => {
        filters.state = e.target.value; renderTable();
      });
      $('filter-membership').addEventListener('change', e => {
        filters.plan = e.target.value; renderTable();
      });
      $('filter-status').addEventListener('change', e => {
        filters.status = e.target.value; renderTable();
      });
      $('filter-joindate').addEventListener('change', e => {
        filters.date = e.target.value; renderTable();
      });
      $('users-view').addEventListener('change', e => {
        filters.view = e.target.value; renderTable();
      });

      $('filter-reset').addEventListener('click', () => {
        filters.name = filters.state = filters.plan = filters.status = filters.date = filters.topSearch = '';
        filters.view = 'all';
        $('filter-name').value = '';
        $('filter-state').value = '';
        $('filter-membership').value = '';
        $('filter-status').value = '';
        $('filter-joindate').value = '';
        $('top-search').value = '';
        $('users-view').value = 'all';
        selectedIds.clear();
        renderTable();
      });
    
      /* ----- Top search bar ----- */
      $('top-search').addEventListener('input', e => {
        filters.topSearch = e.target.value; renderTable();
      });
    
      /* ----- Row checkboxes (event delegation) ----- */
      tbody.addEventListener('change', e => {
        if (!e.target.classList.contains('row-check')) return;
        const id = +e.target.getAttribute('data-id');
        if (e.target.checked) selectedIds.add(id); else selectedIds.delete(id);
        renderTable();
      });

      /* ----- Actions 3-dot menu toggle ----- */
      tbody.addEventListener('click', e => {
        const trigger = e.target.closest('.act-more');
        if (trigger) {
          e.stopPropagation();
          const wrap = trigger.parentElement;
          const wasOpen = wrap.classList.contains('open');
          document.querySelectorAll('.act-menu-wrap.open').forEach(el => el.classList.remove('open'));
          if (!wasOpen) wrap.classList.add('open');
          return;
        }
        if (e.target.closest('.act-menu a')) {
          document.querySelectorAll('.act-menu-wrap.open').forEach(el => el.classList.remove('open'));
        }
      });
      document.addEventListener('click', () => {
        document.querySelectorAll('.act-menu-wrap.open').forEach(el => el.classList.remove('open'));
      });
    
      /* ----- Select all ----- */
      const selectAll = $('select-all');
      if (selectAll) {
        selectAll.addEventListener('change', e => {
          const visibleIds = applyFilters().map(r => r.id);
          if (e.target.checked) visibleIds.forEach(id => selectedIds.add(id));
          else                  visibleIds.forEach(id => selectedIds.delete(id));
          renderTable();
        });
      }
    
      /* ----- Public API ----- */
      window.usersPage = {
        data: usersData,
        render: renderTable,
        addUser(u) { u.id = Math.max(0, ...usersData.map(x => x.id)) + 1; usersData.push(u); renderTable(); },
        removeUser(id) {
          const idx = usersData.findIndex(u => u.id === id);
          if (idx >= 0) usersData.splice(idx, 1);
          selectedIds.delete(id);
          renderTable();
        },
        getSelected() { return usersData.filter(u => selectedIds.has(u.id)); }
      };
    
      renderTable();
    })();
  }

  /* ==========================================================================
     PAGE: leaderboard  (from leaderboard.html)
     ========================================================================== */
  if (body.classList.contains('page-leaderboard')) {
    /* ============================================================
       LEADERBOARD — data + search + pagination + donut
    ============================================================ */
    (function () {
      'use strict';
    
      const NAMES   = ['John Smith','Sarah Michael','Mike Thomson','John Smith','Jessica Lee','Davin William','John Smith','Emma Michael','Hannah Thomson','Mason Garcia','John Smith','Emma Michael','Hannah Thomson','Mason Garcia'];
      const STATES  = ['Colorado','Florida','Colorado','Delaware','Arizona','Alaska','Georgia','Idaho','Kentucky','Minnesota','Georgia','Idaho','Kentucky','Minnesota'];
      const AVATARS = [12,47,33,15,45,52,22,48,24,11,15,48,24,11];
      const COUNTS  = [24,12,34,67,17,89,35,60,56,20,35,60,56,20];
    
      const lbData = NAMES.map((name, i) => ({
        id: i + 1,
        rank: i + 1,
        name,
        state: STATES[i],
        avatar: AVATARS[i],
        score: 9800,
        licenses:  COUNTS[i],
        resources: COUNTS[i],
        posts:     COUNTS[i]
      }));
    
      const TOTAL_RECORDS = 45000;
      const filters = { search: '' };
      let currentPage = 1;
      const PAGES_DISPLAY = 15;
    
      const topPerformers = [
        { rank:1, name:'John Smith',    avatar:12, score:9800 },
        { rank:2, name:'Sarah Michael', avatar:47, score:9800 },
        { rank:3, name:'Mike Thomson',  avatar:33, score:9800 },
        { rank:4, name:'John Smith',    avatar:15, score:9800 },
        { rank:5, name:'Jessica Lee',   avatar:45, score:9800 },
        { rank:6, name:'Davin William', avatar:52, score:9800 }
      ];
    
      const distData = [
        { label:'5000+ (18%)',    value:18, color:'#5da3f5' },
        { label:'2,500+ (32%)',   value:32, color:'#1f3d18' },
        { label:'1000+ (18%)',    value:18, color:'#6b5ca5' },
        { label:'1200+ (18%)',    value:18, color:'#d4c79a' },
        { label:'>10000+ (18%)',  value:18, color:'#9a9a9a' }
      ];
    
      const $ = id => document.getElementById(id);
    
      /* Badge icons reused per row — shield with a star */
      const BADGE_SHIELD = c =>
        `<svg viewBox="0 0 24 24"><path d="M12 2l8 3v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V5z" fill="${c}"/>` +
        `<path d="M12 6.6l1.45 2.94 3.25.47-2.35 2.29.55 3.23L12 14.0l-2.9 1.53.55-3.23L7.3 10.01l3.25-.47z" fill="#fff"/></svg>`;
      const BADGE_SVGS = [
        BADGE_SHIELD('#e6b32e'),
        BADGE_SHIELD('#9a4a4a'),
        BADGE_SHIELD('#7c8794')
      ];
    
      function applyFilters() {
        const q = filters.search.toLowerCase().trim();
        return lbData.filter(r => {
          if (q) {
            const hay = (r.name + ' ' + r.state).toLowerCase();
            if (!q.split(/\s+/).every(w => hay.includes(w))) return false;
          }
          return true;
        });
      }
    
      function renderTable() {
        const rows  = applyFilters();
        const tbody = $('lb-tbody');
        const empty = $('lb-empty');
    
        tbody.innerHTML = rows.map(r => `
          <tr data-id="${r.id}">
            <td class="rank-cell">#${r.rank}</td>
            <td><div class="user-cell"><img class="avatar" src="https://i.pravatar.cc/60?img=${r.avatar}" alt=""> ${r.name}</div></td>
            <td>${r.state}</td>
            <td class="score-cell">${r.score.toLocaleString()}</td>
            <td>${r.licenses}</td>
            <td>${r.resources}</td>
            <td>${r.posts}</td>
            <td>
              <div class="badges-cell">
                <span class="badge-ic">${BADGE_SVGS[0]}</span>
                <span class="badge-ic">${BADGE_SVGS[1]}</span>
                <span class="badge-ic">${BADGE_SVGS[2]}</span>
                <span class="badge-more">+5</span>
                <button class="badge-menu" data-row-action="more" data-id="${r.id}" title="More">
                  <svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="12" cy="19" r="1.6"/></svg>
                </button>
              </div>
            </td>
          </tr>
        `).join('');
    
        empty.style.display = rows.length === 0 ? 'block' : 'none';
        $('lb-count').textContent = `Showing 1 to ${rows.length} of ${TOTAL_RECORDS.toLocaleString()} users`;
        renderPagination();
      }
    
      function renderPagination() {
        const wrap = $('pagination');
        if (!wrap) return;
        const last = PAGES_DISPLAY;
        let html = '';
        html += `<button id="page-prev" ${currentPage === 1 ? 'disabled' : ''}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
        </button>`;
        const pages = [];
        pages.push(1);
        if (currentPage > 4) pages.push('…');
        for (let p = Math.max(2, currentPage - 1); p <= Math.min(last - 1, currentPage + 1); p++) pages.push(p);
        if (currentPage < last - 3) pages.push('…');
        if (last > 1) pages.push(last);
        pages.forEach(p => {
          if (p === '…') html += `<span class="ellipsis">…</span>`;
          else html += `<button class="${p === currentPage ? 'active' : ''}" data-page="${p}">${p}</button>`;
        });
        html += `<button id="page-next" ${currentPage === last ? 'disabled' : ''}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
        </button>`;
        wrap.innerHTML = html;
        wrap.querySelectorAll('button[data-page]').forEach(btn => {
          btn.addEventListener('click', () => { currentPage = +btn.getAttribute('data-page'); renderTable(); });
        });
        const prev = $('page-prev'), next = $('page-next');
        if (prev) prev.addEventListener('click', () => { if (currentPage > 1) { currentPage--; renderTable(); } });
        if (next) next.addEventListener('click', () => { if (currentPage < PAGES_DISPLAY) { currentPage++; renderTable(); } });
      }
    
      function renderPerformers() {
        $('perf-list').innerHTML = topPerformers.map(p => `
          <div class="perf-row">
            <span class="rk">#${p.rank}</span>
            <img class="avatar" src="https://i.pravatar.cc/60?img=${p.avatar}" alt="">
            <span class="nm">${p.name}</span>
            <span class="sc">${p.score.toLocaleString()}</span>
          </div>
        `).join('');
      }
    
      function renderDistDonut() {
        const svg = $('chart-dist');
        const legend = $('dist-legend');
        const total = distData.reduce((s, x) => s + x.value, 0) || 1;
        const cx = 100, cy = 100, r = 68, sw = 30;
    
        let html = `<g transform="rotate(-90 ${cx} ${cy})">`;
        let offset = 0;
        distData.forEach(s => {
          const pct = (s.value / total) * 100;
          html += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none"
            stroke="${s.color}" stroke-width="${sw}" pathLength="100"
            stroke-dasharray="${pct.toFixed(2)} ${(100 - pct).toFixed(2)}"
            stroke-dashoffset="${(-offset).toFixed(2)}"
            class="donut-seg" data-tip="${s.label} — ${pct.toFixed(1)}%"/>`;
          offset += pct;
        });
        html += '</g>';
        svg.innerHTML = html;
    
        legend.innerHTML = distData.map(s => `
          <div class="row">
            <span class="sw" style="background:${s.color}"></span>
            <span class="lbl">${s.label}</span>
          </div>
        `).join('');
      }
    
      /* ---------- Wire up ---------- */
      $('top-search').addEventListener('input', e => {
        filters.search = e.target.value;
        currentPage = 1;
        renderTable();
      });
    
      $('lb-tbody').addEventListener('click', e => {
        const btn = e.target.closest('button[data-row-action]');
        if (!btn) return;
        const id = +btn.getAttribute('data-id');
        const item = lbData.find(r => r.id === id);
        if (item) alert(`Rank #${item.rank} — ${item.name}\nScore: ${item.score.toLocaleString()}\nState: ${item.state}`);
      });
    
      $('create-notif').addEventListener('click', () => alert('Create new notification — coming soon'));
      $('view-all-lb').addEventListener('click', () => alert('Full leaderboard — coming soon'));
    
      window.leaderboardPage = {
        data: lbData,
        render() { renderTable(); renderPerformers(); renderDistDonut(); }
      };
    
      renderTable();
      renderPerformers();
      renderDistDonut();
    })();
  }

  /* ==========================================================================
     PAGE: community  (from community.html)
     ========================================================================== */
  if (body.classList.contains('page-community')) {
    /* ============================================================
       COMMUNITY POSTS — data + filter + table + review wiring
    ============================================================ */
    (function () {
      'use strict';
    
      // Same image placeholders for all posts (varies by id seed)
      function postImg(seed)  { return `https://picsum.photos/seed/post${seed}/640/360`; }
      function thumbImg(seed) { return `https://picsum.photos/seed/post${seed}/120/80`; }
    
      const postsData = [
        { id:'#3456', user:'John Smith',    handle:'@johnsmith',    avatar:12, media:'Photo', date:'2025-06-12', likes:342, comments:58, reports:0, status:'Approved', state:'Texas',     text:'Great morning hunt in th wood!', tags:'#Deerhunting #OnSPOT', location:'Texas. 06/12/2025 10:25 am', summary:{ inappropriate:1, spam:1, harassment:0, others:0 } },
        { id:'#4520', user:'Sarah Michael', handle:'@sarahm',       avatar:47, media:'Video', date:'2025-06-12', likes:342, comments:58, reports:1, status:'Rejected', state:'Florida',   text:'Loved this fishing spot!', tags:'#Fishing #Outdoors', location:'Florida. 06/12/2025 11:10 am', summary:{ inappropriate:1, spam:0, harassment:1, others:0 } },
        { id:'#5242', user:'Davin William', handle:'@davinw',       avatar:52, media:'Photo', date:'2025-06-12', likes:342, comments:58, reports:0, status:'Approved', state:'Colorado',  text:'Beautiful trail today.', tags:'#Hiking #Trails', location:'Colorado. 06/12/2025 09:45 am', summary:{ inappropriate:0, spam:0, harassment:0, others:0 } },
        { id:'#3456', user:'Jessica Brown', handle:'@jessb',        avatar:23, media:'Video', date:'2025-06-12', likes:342, comments:58, reports:1, status:'Rejected', state:'Kansas',    text:'Lake conditions today.', tags:'#Lake #Fishing', location:'Kansas. 06/12/2025 14:20 pm', summary:{ inappropriate:0, spam:1, harassment:0, others:1 } },
        { id:'#3456', user:'John Smith',    handle:'@johnsmith',    avatar:12, media:'Photo', date:'2025-06-12', likes:342, comments:58, reports:0, status:'Approved', state:'Texas',     text:'Big buck spotted!', tags:'#Deer #Hunt', location:'Texas. 06/12/2025 16:00 pm', summary:{ inappropriate:0, spam:0, harassment:0, others:0 } },
        { id:'#5242', user:'Davin William', handle:'@davinw',       avatar:52, media:'Photo', date:'2025-06-12', likes:342, comments:58, reports:0, status:'Approved', state:'Colorado',  text:'Cabin life is the best.', tags:'#Outdoors #Cabin', location:'Colorado. 06/12/2025 17:30 pm', summary:{ inappropriate:0, spam:0, harassment:0, others:0 } },
        { id:'#3456', user:'Jessica Brown', handle:'@jessb',        avatar:23, media:'Video', date:'2025-06-12', likes:342, comments:58, reports:1, status:'Rejected', state:'Kansas',    text:'Pond was packed today.', tags:'#Pond #Fishing', location:'Kansas. 06/12/2025 12:00 pm', summary:{ inappropriate:1, spam:0, harassment:0, others:0 } },
        { id:'#3456', user:'John Smith',    handle:'@johnsmith',    avatar:12, media:'Photo', date:'2025-06-12', likes:342, comments:58, reports:0, status:'Approved', state:'Texas',     text:'Sunset over the ranch.', tags:'#Ranch #Sunset', location:'Texas. 06/12/2025 18:50 pm', summary:{ inappropriate:0, spam:0, harassment:0, others:0 } },
        { id:'#6561', user:'Maria Martin',  handle:'@mariam',       avatar:36, media:'Video', date:'2025-06-12', likes:342, comments:58, reports:1, status:'Rejected', state:'Maryland',  text:'Got my first catch!', tags:'#Catch #Fishing', location:'Maryland. 06/12/2025 08:15 am', summary:{ inappropriate:0, spam:0, harassment:1, others:1 } },
        { id:'#5555', user:'Jacob Anderson',handle:'@jacoba',       avatar:60, media:'Photo', date:'2025-06-12', likes:342, comments:58, reports:0, status:'Approved', state:'Kansas',    text:'Camp setup is done.', tags:'#Camp #Outdoors', location:'Kansas. 06/12/2025 15:40 pm', summary:{ inappropriate:0, spam:0, harassment:0, others:0 } },
        { id:'#5642', user:'Sarah Michael', handle:'@sarahm',       avatar:47, media:'Video', date:'2025-06-12', likes:342, comments:58, reports:1, status:'Rejected', state:'Florida',   text:'Sunset fishing.', tags:'#Sunset #Fishing', location:'Florida. 06/12/2025 19:00 pm', summary:{ inappropriate:0, spam:1, harassment:0, others:0 } },
        { id:'#115',  user:'Asher White',   handle:'@asherw',       avatar:8,  media:'Photo', date:'2025-06-12', likes:342, comments:58, reports:0, status:'Approved', state:'Maryland',  text:'River walks at dawn.', tags:'#River #Dawn', location:'Maryland. 06/12/2025 06:30 am', summary:{ inappropriate:0, spam:0, harassment:0, others:0 } }
      ];
    
      const TOTAL_RECORDS = 45000;
      const filters = { status:'', media:'', user:'', state:'', report:'', search:'' };
      let currentPage = 1;
      const PAGES_DISPLAY = 15;
      let selectedId = postsData[0].id + '_0';
    
      const $ = id => document.getElementById(id);
    
      function fmtDate(iso) {
        const d = new Date(iso);
        if (isNaN(d)) return iso;
        return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
      }
    
      function applyFilters() {
        const q = filters.search.toLowerCase().trim();
        return postsData.filter((r, idx) => {
          if (filters.status && r.status !== filters.status) return false;
          if (filters.media  && r.media  !== filters.media)  return false;
          if (filters.user   && r.user   !== filters.user)   return false;
          if (filters.state  && r.state  !== filters.state)  return false;
          if (filters.report !== '') {
            const want = +filters.report;
            if (want === 0 && r.reports !== 0) return false;
            if (want === 1 && r.reports === 0) return false;
          }
          if (q) {
            const hay = (r.user + ' ' + r.text + ' ' + r.tags + ' ' + r.id + ' ' + r.state).toLowerCase();
            if (!q.split(/\s+/).every(w => hay.includes(w))) return false;
          }
          return true;
        });
      }
    
      function statusBadge(s) {
        const cls = s === 'Approved' ? 'approved' : s === 'Rejected' ? 'rejected' : 'pending';
        return `<span class="badge ${cls}">${s}</span>`;
      }
    
      function rowKey(r, idx) { return `${r.id}_${idx}`; }
    
      function renderTable() {
        const rows  = applyFilters();
        const tbody = $('posts-tbody');
        const empty = $('posts-empty');
    
        tbody.innerHTML = rows.map((r, idx) => {
          const key = rowKey(r, idx);
          const seed = (r.id + idx).replace(/#/g, '');
          return `
            <tr data-key="${key}" class="${selectedId === key ? 'selected' : ''}">
              <td>${r.id}</td>
              <td><div class="user-cell"><img class="avatar" src="https://i.pravatar.cc/60?img=${r.avatar}" alt=""> ${r.user}</div></td>
              <td>
                <div class="media-cell">
                  <span class="media-thumb ${r.media === 'Video' ? 'video' : ''}" style="background-image:url('${thumbImg(seed)}')"></span>
                  ${r.media}
                </div>
              </td>
              <td>${fmtDate(r.date)}</td>
              <td>${r.likes}/${r.comments}</td>
              <td>${r.reports}</td>
              <td>${statusBadge(r.status)}</td>
              <td>
                <div class="row-actions">
                  <button data-row-action="view" data-key="${key}" title="View"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg></button>
                  <button data-row-action="flag" data-key="${key}" title="Flag"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 22V4a1 1 0 0 1 1-1h13l-2 5 2 5H6"/></svg></button>
                  <button data-row-action="more" data-key="${key}" title="More"><svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="12" cy="19" r="1.6"/></svg></button>
                </div>
              </td>
            </tr>
          `;
        }).join('');
    
        empty.style.display = rows.length === 0 ? 'block' : 'none';
        $('posts-count').textContent = `Showing 1 to ${rows.length} of ${TOTAL_RECORDS.toLocaleString()} users`;
    
        renderPagination();
      }
    
      function renderPagination() {
        const wrap = $('pagination');
        if (!wrap) return;
        const last = PAGES_DISPLAY;
        let html = '';
        html += `<button id="page-prev" ${currentPage === 1 ? 'disabled' : ''}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
        </button>`;
        const pages = [];
        pages.push(1);
        if (currentPage > 4) pages.push('…');
        for (let p = Math.max(2, currentPage - 1); p <= Math.min(last - 1, currentPage + 1); p++) pages.push(p);
        if (currentPage < last - 3) pages.push('…');
        if (last > 1) pages.push(last);
    
        pages.forEach(p => {
          if (p === '…') html += `<span class="ellipsis">…</span>`;
          else html += `<button class="${p === currentPage ? 'active' : ''}" data-page="${p}">${p}</button>`;
        });
        html += `<button id="page-next" ${currentPage === last ? 'disabled' : ''}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
        </button>`;
        wrap.innerHTML = html;
        wrap.querySelectorAll('button[data-page]').forEach(btn => {
          btn.addEventListener('click', () => { currentPage = +btn.getAttribute('data-page'); renderTable(); });
        });
        const prev = $('page-prev'), next = $('page-next');
        if (prev) prev.addEventListener('click', () => { if (currentPage > 1) { currentPage--; renderTable(); } });
        if (next) next.addEventListener('click', () => { if (currentPage < PAGES_DISPLAY) { currentPage++; renderTable(); } });
      }
    
      function getSelectedPost() {
        let found = null;
        postsData.forEach((p, idx) => { if (rowKey(p, idx) === selectedId) found = { p, idx }; });
        return found || { p: postsData[0], idx: 0 };
      }
    
      function renderPostReview() {
        const { p, idx } = getSelectedPost();
        const seed = (p.id + idx).replace(/#/g, '');
        $('post-review').innerHTML = `
          <img class="post-img" src="${postImg(seed)}" alt="" />
          <div class="post-author">
            <img src="https://i.pravatar.cc/80?img=${p.avatar}" alt="">
            <div class="meta">
              <div class="nm">${p.user}</div>
              <div class="h">${p.handle}</div>
            </div>
            <div class="stats">
              <span>${p.likes}</span>
              <span>${p.comments}</span>
            </div>
          </div>
          <div class="post-text">${p.text}</div>
          <div class="post-tags">${p.tags}</div>
          <div class="post-meta">${p.location}</div>
        `;
        renderReportSummary(p);
      }
    
      function renderReportSummary(p) {
        const s = p.summary;
        $('report-summary').innerHTML = `
          <div class="summary-row"><span class="lbl">Inappropriate Content</span><span class="cnt">${s.inappropriate}</span></div>
          <div class="summary-row"><span class="lbl">Spam</span><span class="cnt">${s.spam}</span></div>
          <div class="summary-row"><span class="lbl">Harassment</span><span class="cnt">${s.harassment}</span></div>
          <div class="summary-row"><span class="lbl">Others</span><span class="cnt">${s.others}</span></div>
        `;
        $('btn-reports').textContent = `View Reports (${p.reports})`;
      }
    
      /* ---------- Wire up ---------- */
      $('filter-status').addEventListener('change', e => { filters.status = e.target.value; currentPage = 1; renderTable(); });
      $('filter-media').addEventListener('change',  e => { filters.media  = e.target.value; currentPage = 1; renderTable(); });
      $('filter-user').addEventListener('change',   e => { filters.user   = e.target.value; currentPage = 1; renderTable(); });
      $('filter-state').addEventListener('change',  e => { filters.state  = e.target.value; currentPage = 1; renderTable(); });
      $('filter-report').addEventListener('change', e => { filters.report = e.target.value; currentPage = 1; renderTable(); });
    
      function setSearch(v) { filters.search = v; currentPage = 1; renderTable(); }
      $('top-search').addEventListener('input',   e => { setSearch(e.target.value); $('right-search').value = e.target.value; });
      $('right-search').addEventListener('input', e => { setSearch(e.target.value); $('top-search').value   = e.target.value; });
    
      $('filters-btn').addEventListener('click', () => {
        document.querySelector('.filter-row').scrollIntoView({ behavior:'smooth', block:'center' });
        $('filter-status').focus();
      });
    
      $('export-btn').addEventListener('click', () => {
        const rows = applyFilters();
        const header = ['ID','User','Media','Date','Likes','Comments','Reports','Status','State'];
        const csv = [header.join(',')].concat(
          rows.map(r => [r.id, r.user, r.media, r.date, r.likes, r.comments, r.reports, r.status, r.state]
            .map(v => `"${(v + '').replace(/"/g,'""')}"`).join(','))
        ).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url  = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = 'community-posts.csv';
        document.body.appendChild(a); a.click();
        setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 0);
      });
    
      $('post-settings-btn').addEventListener('click', () => alert('Post Settings — coming soon'));
    
      /* Row interactions */
      $('posts-tbody').addEventListener('click', e => {
        const btn = e.target.closest('button[data-row-action]');
        const tr  = e.target.closest('tr[data-key]');
        if (btn) {
          const key = btn.getAttribute('data-key');
          const action = btn.getAttribute('data-row-action');
          let post = null, idx = -1;
          postsData.forEach((p, i) => { if (rowKey(p, i) === key) { post = p; idx = i; } });
          if (!post) return;
          if (action === 'view') { selectedId = key; renderTable(); renderPostReview(); }
          if (action === 'flag') {
            if (confirm(`Flag post ${post.id} from ${post.user}?`)) {
              post.reports += 1; renderTable();
              if (rowKey(post, idx) === selectedId) renderPostReview();
            }
          }
          if (action === 'more') alert(`More for ${post.user} (${post.id})`);
          e.stopPropagation();
          return;
        }
        if (tr) {
          selectedId = tr.getAttribute('data-key');
          renderTable();
          renderPostReview();
        }
      });
    
      /* Post action buttons */
      $('btn-approve').addEventListener('click', () => {
        const { p } = getSelectedPost();
        p.status = 'Approved';
        renderTable(); renderPostReview();
      });
      $('btn-remove').addEventListener('click', () => {
        const { p, idx } = getSelectedPost();
        if (!confirm(`Remove post ${p.id} from ${p.user}?`)) return;
        const pos = postsData.findIndex(x => x === p);
        if (pos >= 0) postsData.splice(pos, 1);
        // pick first remaining row as selection
        selectedId = postsData.length ? rowKey(postsData[0], 0) : '';
        renderTable(); renderPostReview();
      });
      $('btn-reports').addEventListener('click', () => {
        const { p } = getSelectedPost();
        alert(`Reports for ${p.id} (${p.reports}):\nInappropriate: ${p.summary.inappropriate}\nSpam: ${p.summary.spam}\nHarassment: ${p.summary.harassment}\nOthers: ${p.summary.others}`);
      });
      $('btn-ban').addEventListener('click', () => {
        const { p } = getSelectedPost();
        if (confirm(`Ban user ${p.user} (${p.handle})?`)) alert(`${p.user} has been banned.`);
      });
    
      $('view-all-reports').addEventListener('click', () => alert('All reports view — coming soon'));
    
      window.communityPage = {
        data: postsData,
        render() { renderTable(); renderPostReview(); },
        addPost(p) { postsData.unshift(p); renderTable(); }
      };
    
      renderTable();
      renderPostReview();
    })();
  }

  /* ==========================================================================
     PAGE: notifications  (from notifications.html)
     ========================================================================== */
  if (body.classList.contains('page-notifications')) {
    /* ============================================================
       NOTIFICATIONS / ANNOUNCEMENTS — data + filter + pagination
    ============================================================ */
    (function () {
      'use strict';
    
      const notifData = [
        { id:1,  title:'Membership Renewal Reminder',     sub:'Reminder for upcoming membership renewal',   audience:'All Users',         type:'Push',  date:'2028-04-03', openRate:52.4, status:'Sent'  },
        { id:2,  title:'Premium Plan Offer -  20%',        sub:'Special discount for premium users',         audience:'Premium Users',     type:'Email', date:'2028-04-03', openRate:34.4, status:'Sent'  },
        { id:3,  title:'System Maintenance Notice',        sub:'Scheduled maintenances for the platform',    audience:'State: California', type:'Email', date:'2027-03-27', openRate:76.4, status:'Draft' },
        { id:4,  title:'New Features Updates',             sub:'Official deer seasons dates, bag limits and rules.', audience:'Premium Users', type:'Email', date:'2030-03-25', openRate:52.4, status:'Draft' },
        { id:5,  title:'Exclusive Premium Benefits',       sub:'Official deer seasons dates, bag limits and rules.', audience:'All Users',     type:'Push',  date:'2026-03-16', openRate:34.4, status:'Sent'  },
        { id:6,  title:'Special Promotion',                sub:'Official deer seasons dates, bag limits and rules.', audience:'All Users',     type:'Push',  date:'2028-03-25', openRate:76.4, status:'Sent'  },
        { id:7,  title:'State Safety Regulation Updates',  sub:'Official deer seasons dates, bag limits and rules.', audience:'All Users',     type:'Push',  date:'2028-03-25', openRate:52.4, status:'Draft' },
        { id:8,  title:'Basic Plan changes',               sub:'Official deer seasons dates, bag limits and rules.', audience:'Premium Users', type:'Push',  date:'2028-03-25', openRate:76.4, status:'Draft' },
        { id:9,  title:'Annual charges updation',          sub:'Official deer seasons dates, bag limits and rules.', audience:'Premium Users', type:'Push',  date:'2028-03-25', openRate:52.4, status:'Sent'  },
        { id:10, title:'State Safety Regulation Updates',  sub:'Official deer seasons dates, bag limits and rules.', audience:'Premium Users', type:'Push',  date:'2028-03-25', openRate:76.4, status:'Sent'  }
      ];
    
      const TOTAL_RECORDS = 45000;
      const filters = { audience:'', type:'', status:'', date:'', search:'' };
      let currentPage = 1;
      const PAGES_DISPLAY = 15;
    
      const $ = id => document.getElementById(id);
      function fmtDate(iso) {
        const d = new Date(iso);
        if (isNaN(d)) return iso;
        return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
      }
    
      function audPill(a) {
        if (a === 'All Users')     return 'pill all';
        if (a === 'Premium Users') return 'pill premium';
        return 'pill state';
      }
      function openBarColor(pct) {
        if (pct < 40) return '#e23b3b';   // low — red
        if (pct < 60) return '#6b5ca5';   // mid — purple
        return '#2f9e44';                 // high — green
      }
    
      function applyFilters() {
        const q = filters.search.toLowerCase().trim();
        return notifData.filter(r => {
          if (filters.audience && r.audience !== filters.audience) return false;
          if (filters.type     && r.type     !== filters.type)     return false;
          if (filters.status   && r.status   !== filters.status)   return false;
          if (q) {
            const hay = (r.title + ' ' + r.sub + ' ' + r.audience + ' ' + r.type + ' ' + r.status).toLowerCase();
            if (!q.split(/\s+/).every(w => hay.includes(w))) return false;
          }
          return true;
        });
      }
    
      function renderTable() {
        const rows  = applyFilters();
        const tbody = $('nt-tbody');
        const empty = $('nt-empty');
    
        tbody.innerHTML = rows.map(r => `
          <tr data-id="${r.id}">
            <td>
              <div class="nt-title">${r.title}</div>
              <div class="nt-sub">${r.sub}</div>
            </td>
            <td><span class="${audPill(r.audience)}">${r.audience}</span></td>
            <td><span class="type-${r.type.toLowerCase()}">${r.type}</span></td>
            <td>${fmtDate(r.date)}</td>
            <td>
              <div class="open-cell">
                <div class="open-pct">${r.openRate.toFixed(1)}%</div>
                <div class="open-bar-bg"><div class="open-bar" style="width:${r.openRate}%; background:${openBarColor(r.openRate)}"></div></div>
              </div>
            </td>
            <td><span class="badge ${r.status.toLowerCase()}">${r.status}</span></td>
            <td>
              <div class="row-actions">
                <button data-row-action="view" data-id="${r.id}" title="View"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg></button>
                <button data-row-action="more" data-id="${r.id}" title="More"><svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="12" cy="19" r="1.6"/></svg></button>
              </div>
            </td>
          </tr>
        `).join('');
    
        empty.style.display = rows.length === 0 ? 'block' : 'none';
        $('nt-count').textContent = `Showing 1 to ${rows.length} of ${TOTAL_RECORDS.toLocaleString()} users`;
        renderPagination();
      }
    
      function renderPagination() {
        const wrap = $('pagination');
        if (!wrap) return;
        const last = PAGES_DISPLAY;
        let html = '';
        html += `<button id="page-prev" ${currentPage === 1 ? 'disabled' : ''}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
        </button>`;
        const pages = [];
        pages.push(1);
        if (currentPage > 4) pages.push('…');
        for (let p = Math.max(2, currentPage - 1); p <= Math.min(last - 1, currentPage + 1); p++) pages.push(p);
        if (currentPage < last - 3) pages.push('…');
        if (last > 1) pages.push(last);
        pages.forEach(p => {
          if (p === '…') html += `<span class="ellipsis">…</span>`;
          else html += `<button class="${p === currentPage ? 'active' : ''}" data-page="${p}">${p}</button>`;
        });
        html += `<button id="page-next" ${currentPage === last ? 'disabled' : ''}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
        </button>`;
        wrap.innerHTML = html;
        wrap.querySelectorAll('button[data-page]').forEach(btn => {
          btn.addEventListener('click', () => { currentPage = +btn.getAttribute('data-page'); renderTable(); });
        });
        const prev = $('page-prev'), next = $('page-next');
        if (prev) prev.addEventListener('click', () => { if (currentPage > 1) { currentPage--; renderTable(); } });
        if (next) next.addEventListener('click', () => { if (currentPage < PAGES_DISPLAY) { currentPage++; renderTable(); } });
      }
    
      /* ---------- Wire up ---------- */
      $('filter-audience').addEventListener('change', e => { filters.audience = e.target.value; currentPage = 1; renderTable(); });
      $('filter-type').addEventListener('change',     e => { filters.type     = e.target.value; currentPage = 1; renderTable(); });
      $('filter-status').addEventListener('change',   e => { filters.status   = e.target.value; currentPage = 1; renderTable(); });
      $('filter-date').addEventListener('change',     e => { filters.date     = e.target.value; currentPage = 1; renderTable(); });
    
      function setSearch(v) { filters.search = v; currentPage = 1; renderTable(); }
      $('top-search').addEventListener('input',   e => { setSearch(e.target.value); $('right-search').value = e.target.value; });
      $('right-search').addEventListener('input', e => { setSearch(e.target.value); $('top-search').value   = e.target.value; });
    
      $('reset-btn').addEventListener('click', () => {
        filters.audience = filters.type = filters.status = filters.date = filters.search = '';
        $('filter-audience').value = '';
        $('filter-type').value = '';
        $('filter-status').value = '';
        $('filter-date').value = '';
        $('top-search').value = '';
        $('right-search').value = '';
        currentPage = 1;
        renderTable();
      });
    
      $('create-notif').addEventListener('click', () => alert('Create new notification — coming soon'));
    
      $('nt-tbody').addEventListener('click', e => {
        const btn = e.target.closest('button[data-row-action]');
        if (!btn) return;
        const id = +btn.getAttribute('data-id');
        const action = btn.getAttribute('data-row-action');
        const item = notifData.find(r => r.id === id);
        if (!item) return;
        if (action === 'view') alert(`${item.title}\n${item.sub}\nAudience: ${item.audience}\nType: ${item.type}\nOpen Rate: ${item.openRate}%\nStatus: ${item.status}`);
        if (action === 'more') alert(`More actions for: ${item.title}`);
      });
    
      document.querySelectorAll('.send-item').forEach(el => {
        el.addEventListener('click', () => {
          const kind = el.getAttribute('data-send');
          alert((kind === 'push' ? 'New Push Notification' : 'New Email Notification') + ' — coming soon');
        });
      });
    
      window.notificationsPage = {
        data: notifData,
        render: renderTable,
        addNotification(n) {
          n.id = Math.max(0, ...notifData.map(x => x.id)) + 1;
          notifData.unshift(n); renderTable();
        }
      };
    
      renderTable();
    })();
  }

  /* ==========================================================================
     PAGE: memberships  (from memberships.html)
     ========================================================================== */
  if (body.classList.contains('page-memberships')) {
    /* ----- Plans table action menu toggle ----- */
    document.querySelectorAll('.plans-table .act-more').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        const wrap = btn.parentElement;
        const wasOpen = wrap.classList.contains('open');
        document.querySelectorAll('.act-menu-wrap.open').forEach(el => el.classList.remove('open'));
        if (!wasOpen) wrap.classList.add('open');
      });
    });
    document.querySelectorAll('.plans-table .act-menu a').forEach(link => {
      link.addEventListener('click', () => {
        document.querySelectorAll('.act-menu-wrap.open').forEach(el => el.classList.remove('open'));
      });
    });
    document.addEventListener('click', () => {
      document.querySelectorAll('.plans-table .act-menu-wrap.open').forEach(el => el.classList.remove('open'));
    });

    /* ----- Add New Plan modal ----- */
    (function () {
      const modal = document.getElementById('add-plan-modal');
      const trigger = document.querySelector('.btn-add-plan');
      const form = document.getElementById('add-plan-form');
      if (!modal || !trigger || !form) return;

      const closeBtn = modal.querySelector('.modal-close');
      const cancelBtn = modal.querySelector('.btn-cancel');

      function open() {
        modal.classList.add('open');
        modal.setAttribute('aria-hidden', 'false');
        const first = form.querySelector('input,select,textarea');
        if (first) first.focus();
      }
      function close() {
        modal.classList.remove('open');
        modal.setAttribute('aria-hidden', 'true');
        form.reset();
      }

      trigger.addEventListener('click', open);
      closeBtn.addEventListener('click', close);
      cancelBtn.addEventListener('click', close);
      modal.addEventListener('click', e => { if (e.target === modal) close(); });
      document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && modal.classList.contains('open')) close();
      });

      form.addEventListener('submit', e => {
        e.preventDefault();
        const fd = new FormData(form);
        const planName = (fd.get('planName') || '').toString().trim();
        let price = (fd.get('price') || '').toString().trim();
        if (price && !price.startsWith('$')) price = '$' + price; // always show currency
        const billing = (fd.get('billing') || 'month').toString();
        const description = (fd.get('description') || '').toString().trim();
        const features = (fd.get('features') || '').toString().split('\n').map(s => s.trim()).filter(Boolean);
        const active = fd.get('active') === 'on';

        const tbody = document.querySelector('.plans-table tbody');
        if (tbody) {
          const billLabel = billing === 'forever' ? 'Forever' : billing === 'year' ? 'Year' : 'Month';
          const featuresHTML = features.map(f =>
            `<div class="feature"><span class="chk"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><polyline points="20 6 9 17 4 12"/></svg></span>${f}</div>`
          ).join('');
          const tr = document.createElement('tr');
          tr.innerHTML = `
            <td>
              <div class="plan-name">
                <span class="plan-ico">
                  <svg viewBox="0 0 24 24" fill="#86b367" stroke="#4a6b3f" stroke-width="1.5" stroke-linejoin="round"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19.2 2c1 1.5 1.5 4.5 1.5 6 0 5-3 11.5-9.7 12z"/></svg>
                </span>
                <div>
                  <div class="ttl-row">
                    ${planName}
                    ${active ? '<span class="badge-active"><span class="dot"></span>Active</span>' : ''}
                  </div>
                  <div class="desc">${description}</div>
                </div>
              </div>
            </td>
            <td>
              <div class="price-main">${price}</div>
              <div class="price-sub">${billLabel}</div>
            </td>
            <td><div class="features">${featuresHTML}</div></td>
            <td><div class="sub-main">0</div><div class="sub-sub">(0%)</div></td>
            <td><div class="rev-wrap"><div><div class="rev-main">$0</div><div class="rev-sub">0% of total</div></div></div></td>
            <td>
              <div class="actions-cell">
                <button class="act-btn" type="button" title="Edit plan" aria-label="Edit plan">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                </button>
              </div>
            </td>`;
          tbody.appendChild(tr);
        }
        close();
      });
    })();

    /* ============================================================
       MEMBERSHIPS CHART DATA
       ----------------------------------------------------------
       Edit `membershipData` to update the donut + revenue bars.
       Call membershipCharts.render() after edits, or use setters.
    ============================================================ */
    (function () {
      'use strict';
    
      const membershipData = {
        distribution: [
          { label: 'Free',    value: 58.4, color: '#3a5230' },
          { label: 'Basic',   value: 21.3, color: '#d4c79a' },
          { label: 'Premium', value: 20.3, color: '#5da3f5' }
        ],
        distributionCenter: { total: '24,564', label: 'Total Users' },
    
        // Heights (0–100) for the mini revenue bars per plan
        revenueBars: {
          basic:   [30, 55, 80],
          premium: [40, 70, 100]
        },
    
        promoCodes: [
          { id:1, code:'WELCOME20', discount:'20% OFF (Basic & Premium)', validUntil:'30 June 2025', used:1243, max:5000, status:'Active' },
          { id:2, code:'PREMIUM50', discount:'50% OFF (Premium Only)',    validUntil:'15 July 2025', used:1243, max:5000, status:'Active' },
          { id:3, code:'BASIC10',   discount:'10% OFF (Basic Plan)',      validUntil:'31 May 2025',  used:2350, max:5000, status:'Active' },
          { id:4, code:'WELCOME20', discount:'20% OFF (Basic & Premium)', validUntil:'30 June 2025', used:1243, max:5000, status:'Active' },
          { id:5, code:'PREMIUM50', discount:'50% OFF (Premium Only)',    validUntil:'15 July 2025', used:1243, max:5000, status:'Active' },
          { id:6, code:'SUMMER25',  discount:'25% OFF (All Plans)',       validUntil:'01 Sep 2025',  used:560,  max:3000, status:'Active' },
          { id:7, code:'BLACKFRI',  discount:'70% OFF (Premium Only)',    validUntil:'30 Nov 2024',  used:5000, max:5000, status:'Inactive' }
        ]
      };
    
      const ui = { promoSearch: '', showAllPromos: false };
    
      function renderDonut(svg, segs, center) {
        if (!segs.length) { svg.innerHTML = ''; return; }
        const cx = 100, cy = 100, r = 70, sw = 40;
        const total = segs.reduce((s, x) => s + x.value, 0) || 1;
    
        let html = `<g transform="rotate(-90 ${cx} ${cy})">`;
        let offset = 0;
        segs.forEach(s => {
          const pct = (s.value / total) * 100;
          html += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none"
            stroke="${s.color}" stroke-width="${sw}" pathLength="100"
            stroke-dasharray="${pct.toFixed(2)} ${(100 - pct).toFixed(2)}"
            stroke-dashoffset="${(-offset).toFixed(2)}"
            class="donut-seg" data-tip="${s.label} — ${pct.toFixed(1)}%"/>`;
          offset += pct;
        });
        html += '</g>';
    
        if (center) {
          html += `<text x="${cx}" y="${cy - 2}" text-anchor="middle" font-size="18" font-weight="700" fill="#1f1f1f" font-family="Segoe UI">${center.total}</text>
            <text x="${cx}" y="${cy + 14}" text-anchor="middle" font-size="9" fill="#888" font-family="Segoe UI">${center.label}</text>`;
        }
    
        let cum = 0;
        segs.forEach(s => {
          const pct = (s.value / total) * 100;
          const mid = cum + pct / 2;
          const a = (mid / 100) * 2 * Math.PI - Math.PI / 2;
          const lx = cx + r * Math.cos(a);
          const ly = cy + r * Math.sin(a);
          html += `<text x="${lx.toFixed(1)}" y="${(ly + 3).toFixed(1)}" text-anchor="middle" font-size="11" font-weight="700" fill="#fff" font-family="Segoe UI">${pct.toFixed(1)}%</text>`;
          cum += pct;
        });
    
        svg.innerHTML = html;
      }
    
      function renderRevBars(el, heights) {
        if (!heights || !heights.length) { el.innerHTML = ''; return; }
        const max = Math.max(...heights) || 1;
        el.innerHTML = heights.map(h => {
          const pct = (h / max) * 100;
          return `<span style="height:${pct.toFixed(0)}%"></span>`;
        }).join('');
      }
    
      function fmtNum(n) {
        return n.toLocaleString('en-US');
      }
    
      function renderPromoTable() {
        const tbody  = document.getElementById('promo-tbody');
        const toggle = document.getElementById('promo-toggle-all');
        if (!tbody) return;
    
        const q = ui.promoSearch.toLowerCase().trim();
        let rows = membershipData.promoCodes.filter(p => {
          if (!q) return true;
          return (p.code + ' ' + p.discount + ' ' + p.status).toLowerCase().includes(q);
        });
    
        const cap = 5;
        const truncated = !ui.showAllPromos && rows.length > cap;
        const displayed = truncated ? rows.slice(0, cap) : rows;
    
        tbody.innerHTML = displayed.map(p => `
          <tr data-id="${p.id}">
            <td class="promo-code">${p.code}</td>
            <td>${p.discount}</td>
            <td>${p.validUntil}</td>
            <td>${fmtNum(p.used)} / ${fmtNum(p.max)}</td>
            <td><span class="status ${p.status.toLowerCase()}"><span class="dot"></span>${p.status}</span></td>
            <td>
              <div class="actions">
                <button class="act-btn" data-action="edit" data-id="${p.id}" title="Edit">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4z"/></svg>
                </button>
                <button class="act-btn" data-action="delete" data-id="${p.id}" title="Delete">
                  <svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="12" cy="19" r="1.6"/></svg>
                </button>
              </div>
            </td>
          </tr>
        `).join('');
    
        if (!rows.length) {
          tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:24px; color:#999;">No promo codes match.</td></tr>`;
        }
    
        if (toggle) {
          if (membershipData.promoCodes.length <= cap && !q) {
            toggle.style.display = 'none';
          } else {
            toggle.style.display = '';
            toggle.textContent = ui.showAllPromos ? 'Show less' : `View all Promo Codes (${rows.length})`;
          }
        }
      }
    
      function renderAll() {
        const donut = document.getElementById('chart-distribution');
        if (donut) renderDonut(donut, membershipData.distribution, membershipData.distributionCenter);
    
        document.querySelectorAll('[data-bars]').forEach(el => {
          const key = el.getAttribute('data-bars');
          if (membershipData.revenueBars[key]) renderRevBars(el, membershipData.revenueBars[key]);
        });
    
        renderPromoTable();
      }
    
      /* ----- Promo table interactions ----- */
      function wirePromoInteractions() {
        const tbody  = document.getElementById('promo-tbody');
        const toggle = document.getElementById('promo-toggle-all');
        const search = document.getElementById('top-search');
    
        if (tbody) {
          tbody.addEventListener('click', e => {
            const btn = e.target.closest('button[data-action]');
            if (!btn) return;
            const id     = +btn.getAttribute('data-id');
            const action = btn.getAttribute('data-action');
            const promo  = membershipData.promoCodes.find(p => p.id === id);
            if (!promo) return;
    
            if (action === 'edit') {
              const next = prompt(`Edit discount text for ${promo.code}:`, promo.discount);
              if (next !== null && next.trim()) {
                promo.discount = next.trim();
                renderPromoTable();
              }
            } else if (action === 'delete') {
              if (confirm(`Delete promo code "${promo.code}"?`)) {
                const idx = membershipData.promoCodes.findIndex(p => p.id === id);
                if (idx >= 0) membershipData.promoCodes.splice(idx, 1);
                renderPromoTable();
              }
            }
          });
        }
    
        if (toggle) {
          toggle.addEventListener('click', () => {
            ui.showAllPromos = !ui.showAllPromos;
            renderPromoTable();
          });
        }
    
        if (search) {
          search.addEventListener('input', e => {
            ui.promoSearch = e.target.value;
            renderPromoTable();
          });
        }
      }
    
      window.membershipCharts = {
        data: membershipData,
        render: renderAll,
        setDistribution(segs, center) {
          membershipData.distribution = segs;
          if (center) membershipData.distributionCenter = center;
          renderAll();
        },
        setRevenueBars(key, heights) {
          membershipData.revenueBars[key] = heights;
          renderAll();
        },
        addPromo(p) {
          p.id = Math.max(0, ...membershipData.promoCodes.map(x => x.id)) + 1;
          membershipData.promoCodes.push(p);
          renderPromoTable();
        }
      };
    
      function init() {
        renderAll();
        wirePromoInteractions();
      }
    
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
      } else {
        init();
      }
    })();
  }

  /* ==========================================================================
     PAGE: licenses  (from licenses.html)
     ========================================================================== */
  if (body.classList.contains('page-licenses')) {
    /* ============================================================
       LICENSES PAGE — data + filter wiring
    ============================================================ */
    (function () {
      'use strict';
    
      const licensesData = [
        { id:1,  name:'John Smith',    avatar:12, type:'Deer Hunting',    state:'Florida',       upload:'2026-04-03', expiry:'2028-04-03', status:'Approved' },
        { id:2,  name:'Sarah Michael', avatar:47, type:'Fishing Hunting', state:'Florida',       upload:'2026-04-03', expiry:'2028-04-03', status:'Rejected' },
        { id:3,  name:'Mike Thomson',  avatar:33, type:'Duck Hunting',    state:'Colorado',      upload:'2026-03-27', expiry:'2027-03-27', status:'Pending Review' },
        { id:4,  name:'John Smith',    avatar:15, type:'Fishing Hunting', state:'Delaware',      upload:'2026-03-25', expiry:'2030-03-25', status:'Approved' },
        { id:5,  name:'Jessica Lee',   avatar:45, type:'Deer Hunting',    state:'Arizona',       upload:'2026-03-16', expiry:'2026-03-16', status:'Rejected' },
        { id:6,  name:'Davin William', avatar:52, type:'Fishing Hunting', state:'Alaska',        upload:'2026-03-25', expiry:'2028-03-25', status:'Pending Review' },
        { id:7,  name:'John Smith',    avatar:22, type:'Duck Hunting',    state:'Georgia',       upload:'2026-04-03', expiry:'2028-03-25', status:'Pending Review' },
        { id:8,  name:'Emma Michael',  avatar:48, type:'Fishing Hunting', state:'Idaho',         upload:'2026-04-03', expiry:'2028-03-25', status:'Rejected' },
        { id:9,  name:'Hannah Thomson',avatar:24, type:'Deer Hunting',    state:'Kentucky',      upload:'2026-03-27', expiry:'2028-03-25', status:'Approved' },
        { id:10, name:'Mason Garcia',  avatar:11, type:'Fishing Hunting', state:'Minnesota',     upload:'2026-03-25', expiry:'2028-03-25', status:'Approved' },
        { id:11, name:'Jessica Brown', avatar:23, type:'Duck Hunting',    state:'Massachusetts', upload:'2026-03-16', expiry:'2028-03-25', status:'Approved' },
        { id:12, name:'Elias Davis',   avatar:13, type:'Fishing Hunting', state:'Kansas',        upload:'2026-03-25', expiry:'2028-03-25', status:'Approved' },
        { id:13, name:'Luke Thomson',  avatar:18, type:'Deer Hunting',    state:'Idaho',         upload:'2026-03-27', expiry:'2028-03-25', status:'Rejected' },
        { id:14, name:'Jacob Anderson',avatar:60, type:'Fishing Hunting', state:'Kansas',        upload:'2026-03-25', expiry:'2028-03-25', status:'Rejected' },
        { id:15, name:'Maria Martin',  avatar:36, type:'Duck Hunting',    state:'Maryland',      upload:'2026-03-16', expiry:'2028-03-25', status:'Pending Review' },
        { id:16, name:'Asher White',   avatar:8,  type:'Fishing Hunting', state:'Maryland',      upload:'2026-03-25', expiry:'2028-03-25', status:'Pending Review' }
      ];
    
      const totalUsersCount = 45000;
      const filters = { state:'', type:'', status:'', dateRange:'30', topSearch:'', user:'' };
      const selected = new Set();
    
      const $ = id => document.getElementById(id);
      const tbody = $('licenses-tbody');
      const empty = $('licenses-empty');
      const count = $('licenses-count');
    
      function fmtDate(iso) {
        const d = new Date(iso);
        if (isNaN(d)) return iso;
        return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
      }
    
      function statusClass(s) {
        if (s === 'Approved')              return 'approved';
        if (s === 'Rejected')              return 'rejected';
        if (s === 'Pending Review')        return 'pending';
        if (s === 'Resubmission Requested')return 'resub';
        return '';
      }
    
      function applyFilters() {
        const q = filters.topSearch.toLowerCase().trim();
        return licensesData.filter(r => {
          if (filters.state  && r.state  !== filters.state)  return false;
          if (filters.type   && r.type   !== filters.type)   return false;
          if (filters.status && r.status !== filters.status) return false;
          if (filters.user   && r.name   !== filters.user)   return false;
          if (filters.dateRange) {
            const days = +filters.dateRange;
            if (days) {
              const d  = new Date(r.upload);
              const ms = Date.now() - d.getTime();
              if (ms / (1000 * 60 * 60 * 24) > days * 365) return false; // permissive — full data is "recent enough"
            }
          }
          if (q) {
            const hay = (r.name + ' ' + r.type + ' ' + r.state + ' ' + r.status).toLowerCase();
            if (!q.split(/\s+/).every(w => hay.includes(w))) return false;
          }
          return true;
        });
      }
    
      function renderTable() {
        const rows = applyFilters();
        tbody.innerHTML = rows.map(r => `
          <tr data-id="${r.id}">
            <td><input type="checkbox" class="checkbox row-check" data-id="${r.id}" ${selected.has(r.id) ? 'checked' : ''}></td>
            <td><div class="user-cell"><img class="avatar" src="https://i.pravatar.cc/60?img=${r.avatar}" alt=""> ${r.name}</div></td>
            <td>${r.type}</td>
            <td>${r.state}</td>
            <td>${fmtDate(r.upload)}</td>
            <td>${fmtDate(r.expiry)}</td>
            <td><span class="badge ${statusClass(r.status)}">${r.status}</span></td>
            <td class="lic-actions">
              <button class="lic-act-btn" type="button" data-act="view" data-id="${r.id}" aria-label="View">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z"/><circle cx="12" cy="12" r="3"/></svg>
              </button>
              <button class="lic-act-btn approve" type="button" data-act="approve" data-id="${r.id}" aria-label="Approve">
                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M9 21h9a2 2 0 0 0 2-1.74l1-7A2 2 0 0 0 19 10h-5.34l.74-3.55v-.17a1 1 0 0 0-.29-.71L13.4 5l-7.41 7.41A2 2 0 0 0 5.36 14H9zm-7-1v-8a2 2 0 1 1 4 0v8a2 2 0 1 1-4 0z"/></svg>
              </button>
              <button class="lic-act-btn reject" type="button" data-act="reject" data-id="${r.id}" aria-label="Reject">
                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M15 3H6a2 2 0 0 0-2 1.74l-1 7A2 2 0 0 0 5 14h5.34l-.74 3.55v.17a1 1 0 0 0 .29.71L10.6 19l7.41-7.41A2 2 0 0 0 18.64 10H15zm7 1v8a2 2 0 1 1-4 0V4a2 2 0 1 1 4 0z"/></svg>
              </button>
              <button class="lic-act-btn" type="button" data-act="mail" data-id="${r.id}" aria-label="Email">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
              </button>
            </td>
          </tr>
        `).join('');
    
        empty.style.display = rows.length === 0 ? 'block' : 'none';
    
        if (count) {
          const sel = selected.size ? `  ·  ${selected.size} selected` : '';
          count.textContent = `Showing 1 to ${rows.length} of ${totalUsersCount.toLocaleString()} users${sel}`;
        }
    
        const sa = $('select-all');
        if (sa) {
          const visibleIds = rows.map(r => r.id);
          sa.checked = visibleIds.length > 0 && visibleIds.every(id => selected.has(id));
          sa.indeterminate = !sa.checked && visibleIds.some(id => selected.has(id));
        }
      }

      /* ----- Pagination (visual only) ----- */
      const pag = document.getElementById('licenses-pagination');
      if (pag) {
        pag.addEventListener('click', e => {
          const btn = e.target.closest('.pg-num');
          if (!btn) return;
          pag.querySelectorAll('.pg-num').forEach(el => el.classList.remove('active'));
          btn.classList.add('active');
        });
      }

      /* ----- Populate "Filter by User" with each user's license count ----- */
      const userFilterEl = $('filter-user');
      if (userFilterEl) {
        const counts = {};
        licensesData.forEach(r => { counts[r.name] = (counts[r.name] || 0) + 1; });
        Object.keys(counts).sort().forEach(name => {
          const n = counts[name];
          const opt = document.createElement('option');
          opt.value = name;
          opt.textContent = `${name} (${n} license${n > 1 ? 's' : ''})`;
          userFilterEl.appendChild(opt);
        });
      }

      /* ----- Filter wiring ----- */
      $('filter-state').addEventListener('change',  e => { filters.state  = e.target.value; renderTable(); });
      $('filter-type').addEventListener('change',   e => { filters.type   = e.target.value; renderTable(); });
      $('filter-status').addEventListener('change', e => { filters.status = e.target.value; renderTable(); });
      $('filter-date').addEventListener('change',   e => { filters.dateRange = e.target.value; renderTable(); });
      if (userFilterEl) userFilterEl.addEventListener('change', e => { filters.user = e.target.value; renderTable(); });
      $('top-search').addEventListener('input',     e => { filters.topSearch = e.target.value; renderTable(); });

      /* ----- Row checkboxes ----- */
      tbody.addEventListener('change', e => {
        if (!e.target.classList.contains('row-check')) return;
        const id = +e.target.getAttribute('data-id');
        if (e.target.checked) selected.add(id); else selected.delete(id);
        renderTable();
      });

      /* ----- Select all ----- */
      const selectAllEl = $('select-all');
      if (selectAllEl) {
        selectAllEl.addEventListener('change', e => {
          const ids = applyFilters().map(r => r.id);
          if (e.target.checked) ids.forEach(id => selected.add(id));
          else                  ids.forEach(id => selected.delete(id));
          renderTable();
        });
      }
    
      /* ----- Bulk action buttons ----- */
      document.querySelectorAll('.action-item').forEach(el => {
        el.addEventListener('click', () => {
          const action = el.getAttribute('data-action');
          if (!selected.size) {
            alert('Select at least one license row first.');
            return;
          }
          const targets = licensesData.filter(r => selected.has(r.id));
          if (action === 'view') {
            alert('Viewing documents for: ' + targets.map(t => t.name).join(', '));
            return;
          }
          const labelMap = {
            approve: 'Approved',
            reject:  'Rejected',
            resub:   'Resubmission Requested'
          };
          const newStatus = labelMap[action];
          if (!newStatus) return;
          if (!confirm(`Set ${targets.length} license(s) to "${newStatus}"?`)) return;
          targets.forEach(t => t.status = newStatus);
          selected.clear();
          renderTable();
        });
      });
    
      window.licensesPage = {
        data: licensesData,
        render: renderTable,
        addLicense(l) {
          l.id = Math.max(0, ...licensesData.map(x => x.id)) + 1;
          licensesData.push(l); renderTable();
        },
        getSelected() { return licensesData.filter(x => selected.has(x.id)); }
      };
    
      renderTable();
    })();
  }

  /* ==========================================================================
     PAGE: revenue  (from revenue.html)
     ========================================================================== */
  if (body.classList.contains('page-revenue')) {
    /* ============================================================
       REVENUE & MONETIZATION — data + filters + charts + table
    ============================================================ */
    (function () {
      'use strict';
    
      const txnData = [
        { id:1,  date:'2028-04-03', type:'Subscription', source:'Premium Plan', amount:577.89,  method:'Credit Card', status:'Completed' },
        { id:2,  date:'2028-04-03', type:'Ad Revenue',   source:'Banner Ads',   amount:577.89,  method:'Paypal',      status:'Refunded'  },
        { id:3,  date:'2027-03-27', type:'Refund',       source:'Basic Plan',   amount:577.89,  method:'Debit Card',  status:'Refunded'  },
        { id:4,  date:'2030-03-25', type:'Ad Revenue',   source:'Video Ads',    amount:120.89,  method:'-',           status:'Completed', neg:true },
        { id:5,  date:'2026-03-16', type:'Subscription', source:'Premium Plan', amount:9.90,    method:'Debit Card',  status:'Completed' },
        { id:6,  date:'2028-04-03', type:'Subscription', source:'Premium Plan', amount:577.89,  method:'Credit Card', status:'Completed' },
        { id:7,  date:'2028-04-03', type:'Ad Revenue',   source:'Banner Ads',   amount:577.89,  method:'Paypal',      status:'Refunded'  },
        { id:8,  date:'2028-04-03', type:'Subscription', source:'Premium Plan', amount:432.50,  method:'Credit Card', status:'Completed' },
        { id:9,  date:'2027-03-27', type:'Refund',       source:'Basic Plan',   amount:88.00,   method:'Debit Card',  status:'Refunded'  },
        { id:10, date:'2026-03-16', type:'Ad Revenue',   source:'Video Ads',    amount:210.10,  method:'Paypal',      status:'Completed' }
      ];
    
      const TOTAL_RECORDS = 45000;
      const filters = { range:'', user:'', plan:'', payment:'', search:'' };
      let currentPage = 1;
      const PAGES_DISPLAY = 15;
    
      const planRevenue = [
        { label:'Free',    value:68.3, count:16346, color:'#3a5230' },
        { label:'Basic',   value:21.3, count:21346, color:'#d4c79a' },
        { label:'Premium', value:20.3, count:5346,  color:'#5da3f5' }
      ];
      const monthRevenue = [
        { l:'Jan 2025',  v:32459 },
        { l:'Feb 2025',  v:37459 },
        { l:'Mar 2025',  v:40459 },
        { l:'Apr 2025',  v:45459 },
        { l:'May 2025',  v:54459 },
        { l:'June 2025', v:65459 }
      ];
    
      const $ = id => document.getElementById(id);
      function fmtDate(iso) {
        const d = new Date(iso);
        if (isNaN(d)) return iso;
        return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
      }
      function fmtMoney(n) {
        return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      }
    
      /* ---------- Filters + table ---------- */
      function applyFilters() {
        const q = filters.search.toLowerCase().trim();
        return txnData.filter(r => {
          if (filters.user    && filters.user)    { /* user not in txn data — skip */ }
          if (filters.plan    && r.source  !== filters.plan)    return false;
          if (filters.payment && r.method  !== filters.payment) return false;
          if (q) {
            const hay = (r.type + ' ' + r.source + ' ' + r.method + ' ' + r.status).toLowerCase();
            if (!q.split(/\s+/).every(w => hay.includes(w))) return false;
          }
          return true;
        });
      }
    
      function renderTable() {
        const rows  = applyFilters();
        const tbody = $('txn-tbody');
        const empty = $('txn-empty');
    
        tbody.innerHTML = rows.map(r => `
          <tr data-id="${r.id}">
            <td>${fmtDate(r.date)}</td>
            <td>${r.type}</td>
            <td>${r.source}</td>
            <td class="amount ${r.neg ? 'neg' : ''}">${fmtMoney(r.amount)}</td>
            <td>${r.method}</td>
            <td><span class="badge ${r.status.toLowerCase()}">${r.status}</span></td>
          </tr>
        `).join('');
    
        empty.style.display = rows.length === 0 ? 'block' : 'none';
        $('txn-count').textContent = `Showing 1 to ${rows.length} of ${TOTAL_RECORDS.toLocaleString()} users`;
        renderPagination();
      }
    
      function renderPagination() {
        const wrap = $('pagination');
        if (!wrap) return;
        const last = PAGES_DISPLAY;
        let html = '';
        html += `<button id="page-prev" ${currentPage === 1 ? 'disabled' : ''}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
        </button>`;
        const pages = [];
        pages.push(1);
        if (currentPage > 4) pages.push('…');
        for (let p = Math.max(2, currentPage - 1); p <= Math.min(last - 1, currentPage + 1); p++) pages.push(p);
        if (currentPage < last - 3) pages.push('…');
        if (last > 1) pages.push(last);
        pages.forEach(p => {
          if (p === '…') html += `<span class="ellipsis">…</span>`;
          else html += `<button class="${p === currentPage ? 'active' : ''}" data-page="${p}">${p}</button>`;
        });
        html += `<button id="page-next" ${currentPage === last ? 'disabled' : ''}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
        </button>`;
        wrap.innerHTML = html;
        wrap.querySelectorAll('button[data-page]').forEach(btn => {
          btn.addEventListener('click', () => { currentPage = +btn.getAttribute('data-page'); renderTable(); });
        });
        const prev = $('page-prev'), next = $('page-next');
        if (prev) prev.addEventListener('click', () => { if (currentPage > 1) { currentPage--; renderTable(); } });
        if (next) next.addEventListener('click', () => { if (currentPage < PAGES_DISPLAY) { currentPage++; renderTable(); } });
      }
    
      /* ---------- Donut: Revenue by Plan ---------- */
      function renderPlanDonut() {
        const svg = $('chart-plan');
        const legend = $('legend-plan');
        const total = planRevenue.reduce((s, x) => s + x.value, 0) || 1;
        const cx = 100, cy = 100, r = 68, sw = 46;
    
        let html = `<g transform="rotate(-90 ${cx} ${cy})">`;
        let offset = 0;
        planRevenue.forEach(s => {
          const pct = (s.value / total) * 100;
          html += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none"
            stroke="${s.color}" stroke-width="${sw}" pathLength="100"
            stroke-dasharray="${pct.toFixed(2)} ${(100 - pct).toFixed(2)}"
            stroke-dashoffset="${(-offset).toFixed(2)}"
            class="donut-seg" data-tip="${s.label} — ${pct.toFixed(1)}%"/>`;
          offset += pct;
        });
        html += '</g>';
        html += `<text x="${cx}" y="${cy - 2}" text-anchor="middle" font-size="20" font-weight="700" fill="#1f1f1f" font-family="Segoe UI">24,564</text>
          <text x="${cx}" y="${cy + 16}" text-anchor="middle" font-size="11" fill="#888" font-family="Segoe UI">Total Users</text>`;
    
        let cum = 0;
        planRevenue.forEach(s => {
          const pct = (s.value / total) * 100;
          const mid = cum + pct / 2;
          const a = (mid / 100) * 2 * Math.PI - Math.PI / 2;
          const lx = cx + r * Math.cos(a);
          const ly = cy + r * Math.sin(a);
          html += `<text x="${lx.toFixed(1)}" y="${(ly + 3).toFixed(1)}" text-anchor="middle" font-size="11" font-weight="700" fill="#fff" font-family="Segoe UI">${pct.toFixed(1)}%</text>`;
          cum += pct;
        });
        svg.innerHTML = html;
    
        legend.innerHTML = planRevenue.map(s => `
          <div class="row">
            <span class="sw" style="background:${s.color}"></span>
            <div>
              <div class="ttl">${s.label}</div>
              <div class="sub">${s.value.toFixed(1)}% (${s.count.toLocaleString()})</div>
            </div>
          </div>
        `).join('');
      }
    
      /* ---------- Area: Revenue by Month ---------- */
      function renderMonthChart() {
        const svg = $('chart-month');
        const W = 420, H = 240, pL = 44, pR = 14, pT = 18, pB = 32;
        const cw = W - pL - pR, ch = H - pT - pB;
        const max = 80000;        // matches the $80k axis cap in the design
        const yTicks = 5;         // 0, 20k, 40k, 60k, 80k
    
        let html = '<g stroke="#f1f1ed" stroke-dasharray="2 4">';
        for (let i = 0; i < yTicks; i++) {
          const y = pT + (i / (yTicks - 1)) * ch;
          html += `<line x1="${pL}" y1="${y}" x2="${W - pR}" y2="${y}"/>`;
        }
        html += '</g>';
    
        html += '<g font-size="9" fill="#a0a0a0" font-family="Segoe UI">';
        for (let i = 0; i < yTicks; i++) {
          const v = max * (1 - i / (yTicks - 1));
          const y = pT + (i / (yTicks - 1)) * ch;
          const lbl = v === 0 ? '$0' : '$' + (v / 1000) + 'k';
          html += `<text x="6" y="${y + 3}">${lbl}</text>`;
        }
        html += '</g>';
    
        const points = monthRevenue.map((p, i) => ({
          x: pL + (i / (monthRevenue.length - 1)) * cw,
          y: pT + ch - (p.v / max) * ch,
          label: p.l, v: p.v
        }));
        const linePath = points.map((p, i) => (i ? 'L' : 'M') + p.x.toFixed(1) + ',' + p.y.toFixed(1)).join(' ');
        const areaPath = linePath + ` L${points[points.length-1].x.toFixed(1)},${pT + ch} L${points[0].x.toFixed(1)},${pT + ch} Z`;
    
        html += `<defs><linearGradient id="month_grad" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stop-color="#5da3f5" stop-opacity=".4"/>
          <stop offset="100%" stop-color="#5da3f5" stop-opacity="0"/>
        </linearGradient></defs>
        <path d="${areaPath}" fill="url(#month_grad)"/>
        <path d="${linePath}" fill="none" stroke="#3a86d6" stroke-width="2.2"/>`;
    
        html += '<g fill="#fff" stroke="#3a86d6" stroke-width="2">';
        points.forEach(p => { html += `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="3.5"/>`; });
        html += '</g>';
    
        // Value labels above points
        html += '<g font-size="9" fill="#444" font-family="Segoe UI" text-anchor="middle" font-weight="600">';
        points.forEach(p => {
          html += `<text x="${p.x.toFixed(1)}" y="${(p.y - 9).toFixed(1)}">$${p.v.toLocaleString()}</text>`;
        });
        html += '</g>';
    
        // X labels
        html += '<g font-size="9" fill="#a0a0a0" font-family="Segoe UI" text-anchor="middle">';
        points.forEach(p => { html += `<text x="${p.x.toFixed(1)}" y="${H - 12}">${p.label}</text>`; });
        html += '</g>';
    
        svg.innerHTML = html;
      }
    
      /* ---------- Wire up ---------- */
      function setSearch(v) { filters.search = v; currentPage = 1; renderTable(); }
      $('top-search').addEventListener('input', e => setSearch(e.target.value));
    
      $('apply-filters').addEventListener('click', () => {
        filters.range   = $('filter-range').value;
        filters.user    = $('filter-user').value;
        filters.plan    = $('filter-plan').value;
        filters.payment = $('filter-payment').value;
        currentPage = 1;
        renderTable();
      });
    
      $('reset-filters').addEventListener('click', () => {
        filters.range = filters.user = filters.plan = filters.payment = filters.search = '';
        $('filter-range').value = '';
        $('filter-user').value = '';
        $('filter-plan').value = '';
        $('filter-payment').value = '';
        $('top-search').value = '';
        currentPage = 1;
        renderTable();
      });
    
      document.querySelectorAll('.qa-list a').forEach(a => {
        a.addEventListener('click', () => {
          const map = {
            pricing:  'Manage Pricing Plans',
            analytics:'View Detailed Analytics',
            coupons:  'Manage Coupons',
            payout:   'Payout Settings'
          };
          alert(map[a.getAttribute('data-qa')] + ' — coming soon');
        });
      });
    
      window.revenuePage = {
        data: txnData,
        render() { renderTable(); renderPlanDonut(); renderMonthChart(); },
        addTransaction(t) {
          t.id = Math.max(0, ...txnData.map(x => x.id)) + 1;
          txnData.unshift(t); renderTable();
        }
      };
    
      renderTable();
      renderPlanDonut();
      renderMonthChart();
    })();
  }

  /* ==========================================================================
     PAGE: reports  (from reports.html)
     ========================================================================== */
  if (body.classList.contains('page-reports')) {
    /* ============================================================
       REPORTS & MODERATION — data + filter + table + detail panel
    ============================================================ */
    (function () {
      'use strict';
    
      const reportsData = [
        { id:'#2455',  rid:'#R-65124', user:'John Smith',     handle:'@john.anderson', avatar:12, reason:'Harassment', reportedBy:'Emily Clark', reportedByHandle:'@emily.clark', reasonBy:'Spam Content',           date:'2026-05-12', dateLong:'June 11, 2025 at 10:30 AM', status:'Resolved' },
        { id:'#1845',  rid:'#R-65125', user:'Luke Thomson',   handle:'@luke.thomson',  avatar:18, reason:'Harassment', reportedBy:'Maria Martin',reportedByHandle:'@maria.m',     reasonBy:'Inappropriate Content', date:'2026-05-12', dateLong:'June 11, 2025 at 11:05 AM', status:'Under Review' },
        { id:'#9854',  rid:'#R-65126', user:'Jacob Anderson', handle:'@jacob.a',       avatar:60, reason:'Harassment', reportedBy:'Asher White', reportedByHandle:'@asher.w',     reasonBy:'Spam Content',           date:'2026-05-12', dateLong:'June 11, 2025 at 12:20 PM', status:'Pending Review' },
        { id:'#6545',  rid:'#R-65127', user:'Asher White',    handle:'@asher.white',   avatar:8,  reason:'Harassment', reportedBy:'John Smith',  reportedByHandle:'@john.s',      reasonBy:'Harassment',            date:'2026-05-12', dateLong:'June 11, 2025 at 01:00 PM', status:'Resolved' },
        { id:'#1334',  rid:'#R-65128', user:'Jessica Lee',    handle:'@jessica.lee',   avatar:45, reason:'Harassment', reportedBy:'Emma Michael',reportedByHandle:'@emma.m',      reasonBy:'Spam Content',           date:'2026-05-12', dateLong:'June 11, 2025 at 02:15 PM', status:'Under Review' },
        { id:'#0555',  rid:'#R-65129', user:'Emma Michael',   handle:'@emma.michael',  avatar:48, reason:'Harassment', reportedBy:'Mike Thomson',reportedByHandle:'@mike.t',      reasonBy:'Inappropriate Content', date:'2026-05-12', dateLong:'June 11, 2025 at 03:30 PM', status:'Pending Review' },
        { id:'#14552', rid:'#R-65130', user:'Mike Thomson',   handle:'@mike.thomson',  avatar:33, reason:'Harassment', reportedBy:'Jessica Lee', reportedByHandle:'@jessica.l',   reasonBy:'Spam Content',           date:'2026-05-12', dateLong:'June 11, 2025 at 04:45 PM', status:'Resolved' },
        { id:'#27785', rid:'#R-65131', user:'John Smith',     handle:'@john.smith2',   avatar:15, reason:'Harassment', reportedBy:'Luke Thomson',reportedByHandle:'@luke.t',      reasonBy:'Harassment',            date:'2026-05-12', dateLong:'June 11, 2025 at 05:10 PM', status:'Resolved' },
        { id:'#1142',  rid:'#R-65132', user:'Luke Thomson',   handle:'@luke.thomson2', avatar:52, reason:'Harassment', reportedBy:'Jacob Anderson',reportedByHandle:'@jacob.a',   reasonBy:'Spam Content',           date:'2026-05-12', dateLong:'June 11, 2025 at 06:25 PM', status:'Under Review' },
        { id:'#4111',  rid:'#R-65133', user:'Jacob Anderson', handle:'@jacob.a2',      avatar:24, reason:'Harassment', reportedBy:'Asher White', reportedByHandle:'@asher.w',     reasonBy:'Inappropriate Content', date:'2026-05-12', dateLong:'June 11, 2025 at 07:40 PM', status:'Pending Review' },
        { id:'#4224',  rid:'#R-65134', user:'Asher White',    handle:'@asher.white2',  avatar:11, reason:'Harassment', reportedBy:'Emma Michael',reportedByHandle:'@emma.m',      reasonBy:'Harassment',            date:'2026-05-12', dateLong:'June 11, 2025 at 08:55 PM', status:'Resolved' }
      ];
    
      const PREVIEW_TEXT = '"Lorem ipsum dolor sit amet, consectetur adipiscing elit, seddo eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris"';
    
      const TOTAL_RECORDS = 45000;
      const filters = { status:'', reason:'', date:'', search:'', name:'' };
      let currentPage = 1;
      const PAGES_DISPLAY = 15;
      let selectedId = reportsData[0].id;
      const selectedRows = new Set();
    
      const $ = id => document.getElementById(id);
      function fmtDate(iso) {
        const d = new Date(iso);
        if (isNaN(d)) return iso;
        return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
      }
      function statusClass(s) {
        if (s === 'Resolved')       return 'resolved';
        if (s === 'Under Review')   return 'review';
        if (s === 'Pending Review') return 'pending';
        return '';
      }
    
      function applyFilters() {
        const q = filters.search.toLowerCase().trim();
        return reportsData.filter(r => {
          if (filters.status && r.status !== filters.status) return false;
          if (filters.reason && r.reason !== filters.reason) return false;
          if (filters.name   && r.user   !== filters.name)   return false;
          if (q) {
            const hay = (r.id + ' ' + r.user + ' ' + r.reason + ' ' + r.status).toLowerCase();
            if (!q.split(/\s+/).every(w => hay.includes(w))) return false;
          }
          return true;
        });
      }
    
      function renderTable() {
        const rows  = applyFilters();
        const tbody = $('reports-tbody');
        const empty = $('reports-empty');
    
        tbody.innerHTML = rows.map(r => `
          <tr data-id="${r.id}" class="${selectedId === r.id ? 'selected' : ''}">
            <td>
              <input type="checkbox" class="checkbox row-check" data-id="${r.id}" ${selectedRows.has(r.id) ? 'checked' : ''}>
              <span style="margin-left:6px;">${r.id}</span>
            </td>
            <td><div class="user-cell"><img class="avatar" src="https://i.pravatar.cc/60?img=${r.avatar}" alt=""> ${r.user}</div></td>
            <td>${r.reason}</td>
            <td>${fmtDate(r.date)}</td>
            <td><span class="badge ${statusClass(r.status)}">${r.status}</span></td>
            <td>
              <div class="row-actions">
                <button class="mini-btn ok" data-row-action="resolve" data-id="${r.id}">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
                  Resolved
                </button>
                <button class="mini-btn danger" data-row-action="suspend" data-id="${r.id}">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="8" r="3.5"/><path d="M3 20a6 6 0 0 1 12 0"/><line x1="17" y1="8" x2="22" y2="13"/><line x1="22" y1="8" x2="17" y2="13"/></svg>
                  Suspend User
                </button>
                <button class="mini-btn icon" data-row-action="delete" data-id="${r.id}" title="Delete">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/></svg>
                </button>
              </div>
            </td>
          </tr>
        `).join('');
    
        empty.style.display = rows.length === 0 ? 'block' : 'none';
        $('reports-count').textContent = `Showing 1 to ${rows.length} of ${TOTAL_RECORDS.toLocaleString()} users`;
        renderPagination();
      }
    
      function renderPagination() {
        const wrap = $('pagination');
        if (!wrap) return;
        const last = PAGES_DISPLAY;
        let html = '';
        html += `<button id="page-prev" ${currentPage === 1 ? 'disabled' : ''}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
        </button>`;
        const pages = [];
        pages.push(1);
        if (currentPage > 4) pages.push('…');
        for (let p = Math.max(2, currentPage - 1); p <= Math.min(last - 1, currentPage + 1); p++) pages.push(p);
        if (currentPage < last - 3) pages.push('…');
        if (last > 1) pages.push(last);
        pages.forEach(p => {
          if (p === '…') html += `<span class="ellipsis">…</span>`;
          else html += `<button class="${p === currentPage ? 'active' : ''}" data-page="${p}">${p}</button>`;
        });
        html += `<button id="page-next" ${currentPage === last ? 'disabled' : ''}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
        </button>`;
        wrap.innerHTML = html;
        wrap.querySelectorAll('button[data-page]').forEach(btn => {
          btn.addEventListener('click', () => { currentPage = +btn.getAttribute('data-page'); renderTable(); });
        });
        const prev = $('page-prev'), next = $('page-next');
        if (prev) prev.addEventListener('click', () => { if (currentPage > 1) { currentPage--; renderTable(); } });
        if (next) next.addEventListener('click', () => { if (currentPage < PAGES_DISPLAY) { currentPage++; renderTable(); } });
      }
    
      function getSelected() {
        return reportsData.find(r => r.id === selectedId) || reportsData[0];
      }
    
      function renderDetail() {
        const r = getSelected();
        if (!r) { $('report-detail').innerHTML = '<div style="color:#999;padding:20px 0;">No report selected.</div>'; return; }
        $('report-detail').innerHTML = `
          <div class="detail-list">
            <div class="detail-row"><span class="d-label">Report ID:</span><span class="d-value">${r.rid}</span></div>
            <div class="detail-row"><span class="d-label">Reported User:</span><span class="d-value muted">${r.user} (${r.handle})</span></div>
            <div class="detail-row"><span class="d-label">Reported By:</span><span class="d-value muted">${r.reportedBy} (${r.reportedByHandle})</span></div>
            <div class="detail-row"><span class="d-label">Reason By:</span><span class="d-value muted">${r.reasonBy}</span></div>
            <div class="detail-row"><span class="d-label">Date:</span><span class="d-value muted">${r.dateLong}</span></div>
            <div class="detail-row"><span class="d-label">Status:</span><span class="d-value"><span class="badge ${statusClass(r.status)}">${r.status}</span></span></div>
          </div>
    
          <div class="section-title">Content Preview</div>
          <div class="content-preview">${PREVIEW_TEXT}</div>
    
          <div class="section-title">Moderation Actions</div>
          <div class="mod-actions">
            <button class="btn-block btn-resolve" id="md-resolve">Resolve Report</button>
            <button class="btn-block btn-suspend" id="md-suspend">Suspend User</button>
            <button class="btn-block btn-outline" id="md-remove">Remove Content</button>
            <button class="btn-block btn-outline" id="md-reject">Reject Report</button>
          </div>
        `;
    
        $('md-resolve').addEventListener('click', () => { r.status = 'Resolved'; renderTable(); renderDetail(); });
        $('md-suspend').addEventListener('click', () => {
          if (confirm(`Suspend ${r.user} (${r.handle})?`)) alert(`${r.user} has been suspended.`);
        });
        $('md-remove').addEventListener('click', () => {
          if (confirm(`Remove the reported content for ${r.rid}?`)) alert('Content removed.');
        });
        $('md-reject').addEventListener('click', () => {
          if (confirm(`Reject report ${r.rid}?`)) { r.status = 'Resolved'; renderTable(); renderDetail(); }
        });
      }
    
      /* ---------- Populate "Name" filter with reported users ---------- */
      const nameFilterEl = $('filter-name');
      if (nameFilterEl) {
        Array.from(new Set(reportsData.map(r => r.user))).sort().forEach(name => {
          const opt = document.createElement('option');
          opt.value = name;
          opt.textContent = name;
          nameFilterEl.appendChild(opt);
        });
      }

      /* ---------- Wire up ---------- */
      $('filter-status').addEventListener('change', e => { filters.status = e.target.value; currentPage = 1; renderTable(); });
      $('filter-reason').addEventListener('change', e => { filters.reason = e.target.value; currentPage = 1; renderTable(); });
      $('filter-date').addEventListener('change',   e => { filters.date   = e.target.value; currentPage = 1; renderTable(); });
      if (nameFilterEl) nameFilterEl.addEventListener('change', e => { filters.name = e.target.value; currentPage = 1; renderTable(); });
    
      function setSearch(v) { filters.search = v; currentPage = 1; renderTable(); }
      $('top-search').addEventListener('input',   e => { setSearch(e.target.value); $('right-search').value = e.target.value; });
      $('right-search').addEventListener('input', e => { setSearch(e.target.value); $('top-search').value   = e.target.value; });
    
      $('filters-btn').addEventListener('click', () => {
        document.querySelector('.filter-row').scrollIntoView({ behavior:'smooth', block:'center' });
        $('filter-status').focus();
      });
    
      /* Row interactions */
      $('reports-tbody').addEventListener('click', e => {
        const chk = e.target.closest('input.row-check');
        if (chk) {
          const id = chk.getAttribute('data-id');
          if (chk.checked) selectedRows.add(id); else selectedRows.delete(id);
          e.stopPropagation();
          return;
        }
        const btn = e.target.closest('button[data-row-action]');
        if (btn) {
          const id     = btn.getAttribute('data-id');
          const action = btn.getAttribute('data-row-action');
          const item   = reportsData.find(r => r.id === id);
          if (!item) return;
          if (action === 'resolve') { item.status = 'Resolved'; renderTable(); if (id === selectedId) renderDetail(); }
          if (action === 'suspend') {
            if (confirm(`Suspend ${item.user}?`)) alert(`${item.user} has been suspended.`);
          }
          if (action === 'delete') {
            if (confirm(`Delete report ${item.id}?`)) {
              const idx = reportsData.findIndex(x => x.id === id);
              if (idx >= 0) reportsData.splice(idx, 1);
              if (selectedId === id) selectedId = reportsData.length ? reportsData[0].id : '';
              renderTable(); renderDetail();
            }
          }
          e.stopPropagation();
          return;
        }
        const tr = e.target.closest('tr[data-id]');
        if (tr) {
          selectedId = tr.getAttribute('data-id');
          renderTable();
          renderDetail();
        }
      });
    
      /* ============================================================
         USER-SUBMITTED INCIDENT REPORTS
         Reads field reports (trash, poaching, etc.) submitted from the
         public report form (report-incident.html) via localStorage, so any
         logged-in admin can review them here.
      ============================================================ */
      const INCIDENT_KEY = 'spot_incident_reports';

      function loadIncidents() {
        try {
          const raw = localStorage.getItem(INCIDENT_KEY);
          return raw ? JSON.parse(raw) : [];
        } catch (err) {
          return [];
        }
      }
      function saveIncidents(list) {
        try { localStorage.setItem(INCIDENT_KEY, JSON.stringify(list)); } catch (err) {}
      }
      function incidentStatusClass(s) {
        if (s === 'Resolved')    return 'resolved';
        if (s === 'In Progress') return 'review';
        return 'pending'; // New
      }
      function escapeHtml(str) {
        return String(str == null ? '' : str)
          .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
      }
      function fmtIncidentDate(iso) {
        const d = new Date(iso);
        if (isNaN(d)) return iso || '-';
        return d.toLocaleString('en-US', { year:'numeric', month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' });
      }

      function renderIncidents() {
        const tbody = $('incident-tbody');
        const empty = $('incident-empty');
        if (!tbody) return;
        const list = loadIncidents().slice().sort((a, b) => new Date(b.date) - new Date(a.date));

        tbody.innerHTML = list.map(r => `
          <tr data-iid="${r.id}">
            <td>${fmtIncidentDate(r.date)}</td>
            <td>${escapeHtml(r.name) || '<span style="color:#999;">Anonymous</span>'}</td>
            <td>${escapeHtml(r.type)}</td>
            <td>${escapeHtml(r.location) || '-'}</td>
            <td style="max-width:320px;">${escapeHtml(r.description)}</td>
            <td><span class="badge ${incidentStatusClass(r.status)}">${escapeHtml(r.status)}</span></td>
            <td>
              <div class="row-actions">
                <button class="mini-btn ok" data-incident-action="resolve" data-iid="${r.id}">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
                  Resolve
                </button>
                <button class="mini-btn icon" data-incident-action="delete" data-iid="${r.id}" title="Delete">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/></svg>
                </button>
              </div>
            </td>
          </tr>
        `).join('');

        if (empty) empty.style.display = list.length === 0 ? 'block' : 'none';
      }

      const incidentTbody = $('incident-tbody');
      if (incidentTbody) {
        incidentTbody.addEventListener('click', e => {
          const btn = e.target.closest('button[data-incident-action]');
          if (!btn) return;
          const id     = btn.getAttribute('data-iid');
          const action = btn.getAttribute('data-incident-action');
          let list = loadIncidents();
          if (action === 'resolve') {
            list = list.map(r => String(r.id) === String(id) ? { ...r, status: 'Resolved' } : r);
            saveIncidents(list);
          } else if (action === 'delete') {
            if (!confirm('Delete this incident report?')) return;
            list = list.filter(r => String(r.id) !== String(id));
            saveIncidents(list);
          }
          renderIncidents();
        });
      }

      // Live-refresh when a user submits a report in another tab/window.
      window.addEventListener('storage', e => {
        if (e.key === INCIDENT_KEY) renderIncidents();
      });

      window.reportsPage = {
        data: reportsData,
        render() { renderTable(); renderDetail(); renderIncidents(); }
      };

      renderTable();
      renderDetail();
      renderIncidents();
    })();
  }

  /* ==========================================================================
     PAGE: resources  (from resources.html)
     ========================================================================== */
  if (body.classList.contains('page-resources')) {
    /* ============================================================
       RESOURCES PAGE — data + filter + pagination + actions
    ============================================================ */
    (function () {
      'use strict';
    
      const TITLES = [
        'Fishing License Requirement',
        'Boating & Water Safety Guidelines',
        'Boating & Water Safety Guidelines',
        'Moose Hunting Regulations',
        'Fishing License Requirement',
        'Spring Turkey Season Info',
        'Spring Turkey Season Info',
        'Trout Fishing Guide',
        '2025 Deer Hunting Regulations',
        'Boating & Water Safety Guidelines',
        'Boating & Water Safety Guidelines',
        'Moose Hunting Regulations',
        'Fishing License Requirement',
        'Spring Turkey Season Info',
        'Trout Fishing Guide',
        '2025 Deer Hunting Regulations'
      ];
      const STATES   = ['Florida','Florida','Colorado','Delaware','Arizona','Alaska','Georgia','Idaho','Kentucky','Minnesota','Massachusetts','Kansas','Idaho','Kansas','Maryland','Maryland'];
      const CATS     = ['Deer Hunting','Fishing Hunting','Duck Hunting','Fishing Hunting','Deer Hunting','Fishing Hunting','Duck Hunting','Fishing Hunting','Deer Hunting','Fishing Hunting','Duck Hunting','Fishing Hunting','Deer Hunting','Fishing Hunting','Duck Hunting','Fishing Hunting'];
      const TYPES    = ['PDF','Link','PDF','PDF','PDF','Link','PDF','PDF','Link','Link','PDF','PDF','PDF','PDF','Link','PDF'];
      const DATES    = ['2028-04-03','2028-04-03','2027-03-27','2030-03-25','2026-03-16','2028-03-25','2028-03-25','2028-03-25','2028-03-25','2028-03-25','2028-03-25','2028-03-25','2028-03-25','2028-03-25','2028-03-25','2028-03-25'];
      const VIS      = ['Published','Archived','Need Updated','Published','Archived','Need Updated','Need Updated','Archived','Published','Published','Published','Published','Archived','Archived','Need Updated','Need Updated'];
    
      // Build 16-row dataset (one page); total reflects the data the table claims to represent.
      const resourcesData = TITLES.map((t, i) => ({
        id: i + 1,
        title: t,
        sub: 'Official deer seasons dates, bag limits and rules.',
        state: STATES[i],
        category: CATS[i],
        type: TYPES[i],
        updated: DATES[i],
        visibility: VIS[i]
      }));
    
      const TOTAL_RECORDS = 45000;
      const PAGE_SIZE     = 16;
      const TOTAL_PAGES   = Math.ceil(TOTAL_RECORDS / PAGE_SIZE) ; // for UI display, capped at 15 in pagination
    
      const filters = { state:'', category:'', type:'', visibility:'', updated:'', search:'' };
      let currentPage = 1;
      const PAGES_DISPLAY = 15;   // matches the design "1 2 3 ... 15"
    
      const recentActivity = [
        { title: 'Deer Hunting Regulations (WI)',   sub: 'Updated by Admin User',  date: 'May 25, 2026' },
        { title: 'Fishing License Requiremnt (OH)', sub: 'Marked for update',      date: 'May 25, 2026' }
      ];
    
      const $ = id => document.getElementById(id);
    
      function fmtDate(iso) {
        const d = new Date(iso);
        if (isNaN(d)) return iso;
        return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
      }
      function visClass(v) {
        if (v === 'Published')    return 'published';
        if (v === 'Archived')     return 'archived';
        if (v === 'Need Updated') return 'need';
        return '';
      }
    
      function applyFilters() {
        const q = filters.search.toLowerCase().trim();
        return resourcesData.filter(r => {
          if (filters.state      && r.state      !== filters.state)      return false;
          if (filters.category   && r.category   !== filters.category)   return false;
          if (filters.type       && r.type       !== filters.type)       return false;
          if (filters.visibility && r.visibility !== filters.visibility) return false;
          if (q) {
            const hay = (r.title + ' ' + r.category + ' ' + r.state + ' ' + r.type + ' ' + r.visibility).toLowerCase();
            if (!q.split(/\s+/).every(w => hay.includes(w))) return false;
          }
          return true;
        });
      }
    
      function renderTable() {
        const rows = applyFilters();
        const tbody = $('resources-tbody');
        const empty = $('resources-empty');
    
        tbody.innerHTML = rows.map(r => `
          <tr data-id="${r.id}">
            <td>
              <div class="res-title">${r.title}</div>
              <div class="res-sub">${r.sub}</div>
            </td>
            <td>${r.state}</td>
            <td>${r.category}</td>
            <td>${r.type}</td>
            <td>${fmtDate(r.updated)}</td>
            <td><span class="badge ${visClass(r.visibility)}">${r.visibility === 'Published' ? 'Published' : r.visibility === 'Archived' ? 'Archived' : 'Need Updated'}</span></td>
            <td>
              <div class="row-actions">
                <button data-row-action="view" data-id="${r.id}" title="View">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                </button>
                <button data-row-action="edit" data-id="${r.id}" title="Edit">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4z"/></svg>
                </button>
                <button data-row-action="archive" data-id="${r.id}" title="Archive">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="4" rx="1"/><path d="M5 8v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8"/><line x1="10" y1="13" x2="14" y2="13"/></svg>
                </button>
                <button data-row-action="more" data-id="${r.id}" title="More">
                  <svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="12" cy="19" r="1.6"/></svg>
                </button>
              </div>
            </td>
          </tr>
        `).join('');
    
        empty.style.display = rows.length === 0 ? 'block' : 'none';
        $('resources-count').textContent =
          `Showing 1 to ${rows.length} of ${TOTAL_RECORDS.toLocaleString()} users`;
    
        renderPagination();
      }
    
      function renderPagination() {
        const wrap = $('pagination');
        if (!wrap) return;
    
        const last = PAGES_DISPLAY; // show "1 2 3 ... 15"
        let html = '';
    
        html += `<button id="page-prev" ${currentPage === 1 ? 'disabled' : ''}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
        </button>`;
    
        const pages = [];
        // Always show 1
        pages.push(1);
        if (currentPage > 4) pages.push('…');
        for (let p = Math.max(2, currentPage - 1); p <= Math.min(last - 1, currentPage + 1); p++) pages.push(p);
        if (currentPage < last - 3) pages.push('…');
        if (last > 1) pages.push(last);
    
        pages.forEach(p => {
          if (p === '…') {
            html += `<span class="ellipsis">…</span>`;
          } else {
            html += `<button class="${p === currentPage ? 'active' : ''}" data-page="${p}">${p}</button>`;
          }
        });
    
        html += `<button id="page-next" ${currentPage === last ? 'disabled' : ''}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
        </button>`;
    
        wrap.innerHTML = html;
    
        wrap.querySelectorAll('button[data-page]').forEach(btn => {
          btn.addEventListener('click', () => {
            currentPage = +btn.getAttribute('data-page');
            renderTable();
          });
        });
        const prev = $('page-prev'), next = $('page-next');
        if (prev) prev.addEventListener('click', () => { if (currentPage > 1) { currentPage--; renderTable(); } });
        if (next) next.addEventListener('click', () => { if (currentPage < PAGES_DISPLAY) { currentPage++; renderTable(); } });
      }
    
      function renderActivity() {
        const list = $('activity-list');
        list.innerHTML = recentActivity.map(a => `
          <div class="activity-item">
            <div>
              <div class="a-title">${a.title}</div>
              <div class="a-sub">${a.sub}</div>
            </div>
            <div class="a-date">${a.date}</div>
          </div>
        `).join('');
      }
    
      /* ---------- Wire up controls ---------- */
      $('filter-state').addEventListener('change',      e => { filters.state      = e.target.value; currentPage = 1; renderTable(); });
      $('filter-category').addEventListener('change',   e => { filters.category   = e.target.value; currentPage = 1; renderTable(); });
      $('filter-type').addEventListener('change',       e => { filters.type       = e.target.value; currentPage = 1; renderTable(); });
      $('filter-visibility').addEventListener('change', e => { filters.visibility = e.target.value; currentPage = 1; renderTable(); });
      $('filter-updated').addEventListener('change',    e => { filters.updated    = e.target.value; currentPage = 1; renderTable(); });
    
      function setSearch(v) { filters.search = v; currentPage = 1; renderTable(); }
      $('top-search').addEventListener('input',   e => { setSearch(e.target.value);     $('right-search').value = e.target.value; });
      $('right-search').addEventListener('input', e => { setSearch(e.target.value);     $('top-search').value   = e.target.value; });
    
      $('filters-btn').addEventListener('click', () => {
        document.querySelector('.filter-row').scrollIntoView({ behavior:'smooth', block:'center' });
        $('filter-state').focus();
      });
    
      /* Row action buttons */
      document.getElementById('resources-tbody').addEventListener('click', e => {
        const btn = e.target.closest('button[data-row-action]');
        if (!btn) return;
        const id     = +btn.getAttribute('data-id');
        const action = btn.getAttribute('data-row-action');
        const item   = resourcesData.find(r => r.id === id);
        if (!item) return;
    
        if (action === 'view')    alert(`Viewing: ${item.title}`);
        if (action === 'edit')    alert(`Editing: ${item.title}`);
        if (action === 'archive') {
          if (confirm(`Archive "${item.title}"?`)) {
            item.visibility = 'Archived';
            renderTable();
          }
        }
        if (action === 'more') alert(`More actions for: ${item.title}`);
      });
    
      /* Sidebar action links */
      document.querySelectorAll('.action-list a').forEach(a => {
        a.addEventListener('click', () => {
          const map = {
            add: 'Add New Resource',
            bulk: 'Bulk Upload Resources',
            import: 'Import from DNR Websites',
            categories: 'Manage Categories',
            visibility: 'Visibility Settings'
          };
          alert(map[a.getAttribute('data-action')] + ' — coming soon');
        });
      });
    
      /* Category click filters by category */
      document.querySelectorAll('.cat-row').forEach(row => {
        row.addEventListener('click', () => {
          const cat = row.getAttribute('data-cat');
          // 'Hunting' isn't a category in the filter list — use Deer Hunting fallback
          const map = { Hunting:'Deer Hunting', Fishing:'Fishing Hunting', Boating:'Duck Hunting' };
          const val = map[cat] || '';
          filters.category = val;
          $('filter-category').value = val;
          currentPage = 1;
          renderTable();
        });
      });
    
      $('view-all-activity').addEventListener('click', () => alert('All activity view — coming soon'));
    
      window.resourcesPage = {
        data: resourcesData,
        render: renderTable,
        addResource(r) {
          r.id = Math.max(0, ...resourcesData.map(x => x.id)) + 1;
          resourcesData.push(r); renderTable();
        }
      };
    
      renderTable();
      renderActivity();
    })();
  }

  /* ==========================================================================
     PAGE: gps  (from gps.html)
     ========================================================================== */
  if (body.classList.contains('page-gps')) {
    /* ============================================================
       GPS / TAGGING ACTIVITY — data + filter + pagination + charts
    ============================================================ */
    (function () {
      'use strict';
    
      const gpsData = [
        { id:1,  name:'John Smith',     avatar:12, loc:'Lake Fork Reservoir', coords:'45000, - 346786', state:'Colorado',      type:'Deer Hunting',    date:'2028-04-03', shared:'Yes' },
        { id:2,  name:'Sarah Michael',  avatar:47, loc:'Lake Fork Reservoir', coords:'45000, - 346786', state:'Florida',       type:'Fishing Hunting', date:'2028-04-03', shared:'No'  },
        { id:3,  name:'Mike Thomson',   avatar:33, loc:'Lake Fork Reservoir', coords:'45000, - 346786', state:'Colorado',      type:'Duck Hunting',    date:'2027-03-27', shared:'Yes' },
        { id:4,  name:'John Smith',     avatar:15, loc:'Lake Fork Reservoir', coords:'45000, - 346786', state:'Delaware',      type:'Fishing Hunting', date:'2030-03-25', shared:'No'  },
        { id:5,  name:'Jessica Lee',    avatar:45, loc:'Lake Fork Reservoir', coords:'45000, - 346786', state:'Arizona',       type:'Deer Hunting',    date:'2026-03-16', shared:'Yes' },
        { id:6,  name:'Davin William',  avatar:52, loc:'Lake Fork Reservoir', coords:'45000, - 346786', state:'Alaska',        type:'Fishing Hunting', date:'2028-03-25', shared:'No'  },
        { id:7,  name:'John Smith',     avatar:22, loc:'Lake Fork Reservoir', coords:'45000, - 346786', state:'Georgia',       type:'Duck Hunting',    date:'2028-03-25', shared:'Yes' },
        { id:8,  name:'Emma Michael',   avatar:48, loc:'Lake Fork Reservoir', coords:'45000, - 346786', state:'Idaho',         type:'Fishing Hunting', date:'2028-03-25', shared:'No'  },
        { id:9,  name:'Hannah Thomson', avatar:24, loc:'Lake Fork Reservoir', coords:'45000, - 346786', state:'Kentucky',      type:'Deer Hunting',    date:'2028-03-25', shared:'Yes' },
        { id:10, name:'Jessica Brown',  avatar:23, loc:'Lake Fork Reservoir', coords:'45000, - 346786', state:'Massachusetts', type:'Duck Hunting',    date:'2028-03-25', shared:'Yes' },
        { id:11, name:'Elias Davis',    avatar:13, loc:'Lake Fork Reservoir', coords:'45000, - 346786', state:'Kansas',        type:'Fishing Hunting', date:'2028-03-25', shared:'Yes' },
        { id:12, name:'Luke Thomson',   avatar:18, loc:'Lake Fork Reservoir', coords:'45000, - 346786', state:'Idaho',         type:'Deer Hunting',    date:'2028-03-25', shared:'Yes' },
        { id:13, name:'Jacob Anderson', avatar:60, loc:'Lake Fork Reservoir', coords:'45000, - 346786', state:'Kansas',        type:'Fishing Hunting', date:'2028-03-25', shared:'Yes' },
        { id:14, name:'Maria Martin',   avatar:36, loc:'Lake Fork Reservoir', coords:'45000, - 346786', state:'Maryland',      type:'Duck Hunting',    date:'2028-03-25', shared:'Yes' },
        { id:15, name:'Asher White',    avatar:8,  loc:'Lake Fork Reservoir', coords:'45000, - 346786', state:'Maryland',      type:'Fishing Hunting', date:'2028-03-25', shared:'Yes' },
        { id:16, name:'Mason Garcia',   avatar:11, loc:'Lake Fork Reservoir', coords:'45000, - 346786', state:'Minnesota',     type:'Fishing Hunting', date:'2028-03-25', shared:'Yes' }
      ];
    
      const TOTAL_RECORDS = 45000;
      const filters = { state:'', type:'', user:'', shared:'', search:'' };
      let currentPage = 1;
      const PAGES_DISPLAY = 15;
    
      /* Charts data */
      const activitySeries = {
        7:   [ {l:'Mon', v:1600}, {l:'Tue', v:1800}, {l:'Wed', v:1700}, {l:'Thu', v:2100}, {l:'Fri', v:2300}, {l:'Sat', v:2500}, {l:'Sun', v:2900} ],
        30:  [ {l:'May 13', v:600}, {l:'May 20', v:1300}, {l:'May 27', v:2000}, {l:'Jun 3', v:2400}, {l:'Jun 10', v:2900} ],
        90:  [ {l:'Apr', v:1500}, {l:'May', v:2100}, {l:'Jun', v:2900}, {l:'Jul', v:3300} ],
        365: [ {l:'Q1', v:8000}, {l:'Q2', v:11000}, {l:'Q3', v:13500}, {l:'Q4', v:15000} ]
      };
      let activityRange = 30;
    
      const topStatesData = [
        { name: 'Texas',        value: 2950 },
        { name: 'Florida',      value: 2600 },
        { name: 'Chio',         value: 1100 },
        { name: 'Michigan',     value: 1450 },
        { name: 'Pennslviana',  value: 2200 },
        { name: 'Wisconsin',    value: 2350 }
      ];
    
      const tagTypesData = [
        { label:'Fishing Spot', value: 6842, color:'#3b8ed6' },
        { label:'Hunting',      value: 2842, color:'#1f1f1f' },
        { label:'Scouting',     value: 2842, color:'#4a6b3f' },
        { label:'Boat Launch',  value: 2842, color:'#d4c79a' },
        { label:'Other',        value: 2842, color:'#9a9a9a' }
      ];
    
      const $ = id => document.getElementById(id);
    
      function fmtDate(iso) {
        const d = new Date(iso);
        if (isNaN(d)) return iso;
        return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
      }
      function fmtNum(n) {
        if (n >= 1000) {
          const k = n / 1000;
          return (k >= 10 ? Math.round(k) : k.toFixed(1).replace(/\.0$/, '')) + 'k';
        }
        return Math.round(n).toString();
      }
    
      /* ---------- Filters + table ---------- */
      function applyFilters() {
        const q = filters.search.toLowerCase().trim();
        return gpsData.filter(r => {
          if (filters.state  && r.state  !== filters.state)  return false;
          if (filters.type   && r.type   !== filters.type)   return false;
          if (filters.user   && r.name   !== filters.user)   return false;
          if (filters.shared && r.shared !== filters.shared) return false;
          if (q) {
            const hay = (r.name + ' ' + r.loc + ' ' + r.state + ' ' + r.type).toLowerCase();
            if (!q.split(/\s+/).every(w => hay.includes(w))) return false;
          }
          return true;
        });
      }
    
      function renderTable() {
        const rows = applyFilters();
        const tbody = $('gps-tbody');
        const empty = $('gps-empty');
    
        tbody.innerHTML = rows.map(r => `
          <tr data-id="${r.id}">
            <td><div class="user-cell"><img class="avatar" src="https://i.pravatar.cc/60?img=${r.avatar}" alt=""> ${r.name}</div></td>
            <td>
              <div class="loc-main">${r.loc}</div>
              <div class="loc-sub">${r.coords}</div>
            </td>
            <td>${r.state}</td>
            <td>${r.type}</td>
            <td>${fmtDate(r.date)}</td>
            <td><span class="badge ${r.shared === 'Yes' ? 'yes' : 'no'}">${r.shared}</span></td>
            <td>
              <div class="row-actions">
                <button data-row-action="view" data-id="${r.id}" title="View on map">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                </button>
                <button data-row-action="share" data-id="${r.id}" title="Share">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
                </button>
                <button data-row-action="more" data-id="${r.id}" title="More">
                  <svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="12" cy="19" r="1.6"/></svg>
                </button>
              </div>
            </td>
          </tr>
        `).join('');
    
        empty.style.display = rows.length === 0 ? 'block' : 'none';
        $('gps-count').textContent = `Showing 1 to ${rows.length} of ${TOTAL_RECORDS.toLocaleString()} users`;
        renderPagination();
      }
    
      function renderPagination() {
        const wrap = $('pagination');
        if (!wrap) return;
        const last = PAGES_DISPLAY;
        let html = '';
    
        html += `<button id="page-prev" ${currentPage === 1 ? 'disabled' : ''}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
        </button>`;
    
        const pages = [];
        pages.push(1);
        if (currentPage > 4) pages.push('…');
        for (let p = Math.max(2, currentPage - 1); p <= Math.min(last - 1, currentPage + 1); p++) pages.push(p);
        if (currentPage < last - 3) pages.push('…');
        if (last > 1) pages.push(last);
    
        pages.forEach(p => {
          if (p === '…') html += `<span class="ellipsis">…</span>`;
          else html += `<button class="${p === currentPage ? 'active' : ''}" data-page="${p}">${p}</button>`;
        });
    
        html += `<button id="page-next" ${currentPage === last ? 'disabled' : ''}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
        </button>`;
    
        wrap.innerHTML = html;
    
        wrap.querySelectorAll('button[data-page]').forEach(btn => {
          btn.addEventListener('click', () => { currentPage = +btn.getAttribute('data-page'); renderTable(); });
        });
        const prev = $('page-prev'), next = $('page-next');
        if (prev) prev.addEventListener('click', () => { if (currentPage > 1) { currentPage--; renderTable(); } });
        if (next) next.addEventListener('click', () => { if (currentPage < PAGES_DISPLAY) { currentPage++; renderTable(); } });
      }
    
      /* ---------- Activity area chart ---------- */
      function renderActivityChart() {
        const svg  = $('chart-activity');
        const pts  = activitySeries[activityRange] || activitySeries[30];
        const W = 320, H = 220, pL = 30, pR = 12, pT = 16, pB = 30;
        const cw = W - pL - pR, ch = H - pT - pB;
        const max = Math.max(...pts.map(p => p.v)) * 1.05;
        const yTicks = 5;
    
        let html = '<g stroke="#f1f1ed" stroke-dasharray="2 4">';
        for (let i = 0; i < yTicks; i++) {
          const y = pT + (i / (yTicks - 1)) * ch;
          html += `<line x1="${pL}" y1="${y}" x2="${W - pR}" y2="${y}"/>`;
        }
        html += '</g>';
    
        html += '<g font-size="9" fill="#a0a0a0" font-family="Segoe UI">';
        for (let i = 0; i < yTicks; i++) {
          const v = max * (1 - i / (yTicks - 1));
          const y = pT + (i / (yTicks - 1)) * ch;
          html += `<text x="0" y="${y + 3}">${fmtNum(v)}</text>`;
        }
        html += '</g>';
    
        const points = pts.map((p, i) => ({
          x: pL + (i / (pts.length - 1)) * cw,
          y: pT + ch - (p.v / max) * ch,
          label: p.l,
          v: p.v
        }));
    
        const linePath = points.map((p, i) => (i ? 'L' : 'M') + p.x.toFixed(1) + ',' + p.y.toFixed(1)).join(' ');
        const areaPath = linePath + ` L${points[points.length-1].x.toFixed(1)},${pT + ch} L${points[0].x.toFixed(1)},${pT + ch} Z`;
    
        html += `<defs><linearGradient id="act_grad" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stop-color="#5e9d6a" stop-opacity=".55"/>
          <stop offset="100%" stop-color="#5e9d6a" stop-opacity="0"/>
        </linearGradient></defs>
        <path d="${areaPath}" fill="url(#act_grad)"/>
        <path d="${linePath}" fill="none" stroke="#3a7a45" stroke-width="2"/>`;

        html += '<g>';
        points.forEach(p => {
          html += `<circle class="chart-pt" cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="4"
            fill="#34A853" stroke="#fff" stroke-width="1.6"
            data-tip="${p.label}: ${p.v.toLocaleString()}"/>`;
        });
        html += '</g>';

        html += '<g font-size="10" fill="#a0a0a0" font-family="Segoe UI" text-anchor="middle">';
        points.forEach(p => { html += `<text x="${p.x.toFixed(1)}" y="${H - 10}">${p.label}</text>`; });
        html += '</g>';
    
        svg.innerHTML = html;
      }
    
      /* ---------- Top states bars ---------- */
      function renderTopStates() {
        const wrap = $('top-states');
        const max = Math.max(...topStatesData.map(s => s.value)) || 1;
        wrap.innerHTML = topStatesData.map(s => `
          <div class="row">
            <span class="name">${s.name}</span>
            <span class="bar" style="width: ${(s.value / max * 100).toFixed(0)}%"></span>
          </div>
        `).join('');
      }
    
      /* ---------- Top tag types donut ---------- */
      function renderTagTypesDonut() {
        const svg = $('chart-tagtypes');
        const legend = $('legend-tagtypes');
        const total = tagTypesData.reduce((s, x) => s + x.value, 0) || 1;
        const cx = 100, cy = 100, r = 70, sw = 36;
    
        let html = `<g transform="rotate(-90 ${cx} ${cy})">`;
        let offset = 0;
        tagTypesData.forEach(s => {
          const pct = (s.value / total) * 100;
          html += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none"
            stroke="${s.color}" stroke-width="${sw}" pathLength="100"
            stroke-dasharray="${pct.toFixed(2)} ${(100 - pct).toFixed(2)}"
            stroke-dashoffset="${(-offset).toFixed(2)}"
            class="donut-seg" data-tip="${s.label} — ${pct.toFixed(1)}%"/>`;
          offset += pct;
        });
        html += '</g>';
        html += `<text x="${cx}" y="${cy - 2}" text-anchor="middle" font-size="20" font-weight="700" fill="#1f1f1f" font-family="Segoe UI">${total.toLocaleString()}</text>
          <text x="${cx}" y="${cy + 16}" text-anchor="middle" font-size="11" fill="#888" font-family="Segoe UI">Total Pins</text>`;
        svg.innerHTML = html;
    
        legend.innerHTML = tagTypesData.map(s => {
          const pct = ((s.value / total) * 100).toFixed(1);
          return `<div class="row">
            <span class="sw" style="background:${s.color}"></span>
            <span class="ttl">${s.label}</span>
            <span class="num">${s.value.toLocaleString()} (${pct}%)</span>
          </div>`;
        }).join('');
      }
    
      /* ---------- Wire up controls ---------- */
      $('filter-state').addEventListener('change',  e => { filters.state  = e.target.value; currentPage = 1; renderTable(); });
      $('filter-type').addEventListener('change',   e => { filters.type   = e.target.value; currentPage = 1; renderTable(); });
      $('filter-user').addEventListener('change',   e => { filters.user   = e.target.value; currentPage = 1; renderTable(); });
      $('filter-shared').addEventListener('change', e => { filters.shared = e.target.value; currentPage = 1; renderTable(); });
    
      function setSearch(v) { filters.search = v; currentPage = 1; renderTable(); }
      $('top-search').addEventListener('input',   e => { setSearch(e.target.value); $('right-search').value = e.target.value; });
      $('right-search').addEventListener('input', e => { setSearch(e.target.value); $('top-search').value   = e.target.value; });
    
      $('range-select').addEventListener('change', e => {
        activityRange = +e.target.value || 30;
        renderActivityChart();
      });
    
      $('filters-btn').addEventListener('click', () => {
        document.querySelector('.filter-row').scrollIntoView({ behavior:'smooth', block:'center' });
        $('filter-state').focus();
      });
    
      $('export-btn').addEventListener('click', () => {
        const rows = applyFilters();
        const header = ['User Name','Tagged Location','Coords','State','Tag Type','Date','Shared'];
        const csv = [header.join(',')].concat(
          rows.map(r => [r.name, r.loc, r.coords, r.state, r.type, r.date, r.shared]
            .map(v => `"${(v + '').replace(/"/g,'""')}"`).join(','))
        ).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url  = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = 'gps-activity.csv';
        document.body.appendChild(a); a.click();
        setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 0);
      });
    
      /* Row action buttons */
      $('gps-tbody').addEventListener('click', e => {
        const btn = e.target.closest('button[data-row-action]');
        if (!btn) return;
        const id = +btn.getAttribute('data-id');
        const action = btn.getAttribute('data-row-action');
        const item = gpsData.find(r => r.id === id);
        if (!item) return;
    
        if (action === 'view')  alert(`Viewing on map: ${item.loc} (${item.coords})`);
        if (action === 'share') {
          item.shared = item.shared === 'Yes' ? 'No' : 'Yes';
          renderTable();
        }
        if (action === 'more')  alert(`More actions for: ${item.name}`);
      });
    
      $('view-all-states').addEventListener('click', () => alert('Full state breakdown — coming soon'));
    
      window.gpsPage = {
        data: gpsData,
        render: renderTable,
        addEntry(e) {
          e.id = Math.max(0, ...gpsData.map(x => x.id)) + 1;
          gpsData.push(e); renderTable();
        }
      };
    
      renderTable();
      renderActivityChart();
      renderTopStates();
      renderTagTypesDonut();
    })();
  }

  /* ==========================================================================
     PAGE: ai  (from ai.html)
     ========================================================================== */
  if (body.classList.contains('page-ai')) {
    /* ============================================================
       AI ASSISTANT MONITORING — data + filter + charts
    ============================================================ */
    (function () {
      'use strict';
    
      const aiData = [
        { id:1,  name:'John Smith',     avatar:12, qa:48, qaSub:'+5 days', plan:'Premium', rating:4.8, ratingCount:32, lastUsed:'2028-04-03', status:'Active'   },
        { id:2,  name:'Sarah Michael',  avatar:47, qa:48, qaSub:'+5 days', plan:'Premium', rating:4.8, ratingCount:32, lastUsed:'2028-04-03', status:'Active'   },
        { id:3,  name:'Mike Thomson',   avatar:33, qa:48, qaSub:'+5 days', plan:'Free',    rating:4.8, ratingCount:32, lastUsed:'2027-03-27', status:'Inactive' },
        { id:4,  name:'John Smith',     avatar:15, qa:48, qaSub:'+5 days', plan:'Premium', rating:4.8, ratingCount:32, lastUsed:'2030-03-25', status:'Active'   },
        { id:5,  name:'Jessica Lee',    avatar:45, qa:48, qaSub:'+5 days', plan:'Free',    rating:4.8, ratingCount:32, lastUsed:'2026-03-16', status:'Active'   },
        { id:6,  name:'Davin William',  avatar:52, qa:48, qaSub:'+5 days', plan:'Basic',   rating:4.8, ratingCount:32, lastUsed:'2028-03-25', status:'Inactive' },
        { id:7,  name:'John Smith',     avatar:22, qa:48, qaSub:'+5 days', plan:'Premium', rating:4.8, ratingCount:32, lastUsed:'2028-03-25', status:'Active'   },
        { id:8,  name:'Emma Michael',   avatar:48, qa:48, qaSub:'+5 days', plan:'Premium', rating:4.8, ratingCount:32, lastUsed:'2028-03-25', status:'Active'   },
        { id:9,  name:'Hannah Thomson', avatar:24, qa:48, qaSub:'+5 days', plan:'Free',    rating:4.8, ratingCount:32, lastUsed:'2028-03-25', status:'Inactive' },
        { id:10, name:'Mason Garcia',   avatar:11, qa:48, qaSub:'+5 days', plan:'Premium', rating:4.8, ratingCount:32, lastUsed:'2028-03-25', status:'Active'   },
        { id:11, name:'Jessica Brown',  avatar:23, qa:48, qaSub:'+5 days', plan:'Free',    rating:4.8, ratingCount:32, lastUsed:'2028-03-25', status:'Active'   }
      ];
    
      const flaggedData = [
        { id:1, name:'John Smith',    avatar:12, email:'JohnSmith@gmail.com',  preview:'How can I hunt protect animals without getting caught?', reason:'Violates policy', date:'2028-03-25' },
        { id:2, name:'Jessica Brown', avatar:23, email:'Brownjess@gmail.com',  preview:'How can I hunt protect animals without getting caught?', reason:'Violates policy', date:'2028-03-25' }
      ];
    
      const TOTAL_RECORDS = 45000;
      const filters = { plan:'', user:'', status:'', search:'' };
      let currentPage = 1;
      const PAGES_DISPLAY = 15;
    
      const usageSeries = [
        { l:'May 13', v: 600 },
        { l:'May 20', v: 1300 },
        { l:'May 27', v: 2000 },
        { l:'Jun 3',  v: 2400 },
        { l:'Jun 10', v: 2900 }
      ];
      const plansData = [
        { label:'Free',    value: 68.3, count: 16346, color:'#3a5230' },
        { label:'Basic',   value: 21.3, count: 21346, color:'#d4c79a' },
        { label:'Premium', value: 20.3, count: 5346,  color:'#5da3f5' }
      ];
      const feedbackData = [
        { stars:5, pct:79, color:'#2f9e44' },
        { stars:4, pct:49, color:'#5e9d4a' },
        { stars:3, pct:37, color:'#d4c79a' },
        { stars:2, pct:13, color:'#e07b1c' },
        { stars:1, pct: 2, color:'#e23b3b' }
      ];
    
      const $ = id => document.getElementById(id);
      function fmtDate(iso) {
        const d = new Date(iso);
        if (isNaN(d)) return iso;
        return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
      }
      function fmtNum(n) {
        if (n >= 1000) {
          const k = n / 1000;
          return (k >= 10 ? Math.round(k) : k.toFixed(1).replace(/\.0$/, '')) + 'k';
        }
        return Math.round(n).toString();
      }
    
      function pillClass(p) {
        if (p === 'Premium') return 'pill premium';
        if (p === 'Basic')   return 'pill basic';
        return 'pill free';
      }
    
      function applyFilters() {
        const q = filters.search.toLowerCase().trim();
        return aiData.filter(r => {
          if (filters.plan   && r.plan   !== filters.plan)   return false;
          if (filters.user   && r.name   !== filters.user)   return false;
          if (filters.status && r.status !== filters.status) return false;
          if (q) {
            const hay = (r.name + ' ' + r.plan + ' ' + r.status).toLowerCase();
            if (!q.split(/\s+/).every(w => hay.includes(w))) return false;
          }
          return true;
        });
      }
    
      function renderTable() {
        const rows  = applyFilters();
        const tbody = $('ai-tbody');
        const empty = $('ai-empty');
    
        tbody.innerHTML = rows.map(r => `
          <tr data-id="${r.id}">
            <td><div class="user-cell"><img class="avatar" src="https://i.pravatar.cc/60?img=${r.avatar}" alt=""> ${r.name}</div></td>
            <td>
              <div class="qa-num">${r.qa}</div>
              <div class="qa-sub">${r.qaSub}</div>
            </td>
            <td><span class="${pillClass(r.plan)}">${r.plan}</span></td>
            <td><span class="rating">${r.rating.toFixed(1)} (${r.ratingCount}) <span class="star">★</span></span></td>
            <td>${fmtDate(r.lastUsed)}</td>
            <td><span class="status ${r.status.toLowerCase()}"><span class="dot"></span>${r.status}</span></td>
            <td>
              <div class="row-actions">
                <button data-row-action="view" data-id="${r.id}" title="View"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg></button>
                <button data-row-action="flag" data-id="${r.id}" title="Flag"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 22V4a1 1 0 0 1 1-1h13l-2 5 2 5H6"/></svg></button>
                <button data-row-action="more" data-id="${r.id}" title="More"><svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="12" cy="19" r="1.6"/></svg></button>
              </div>
            </td>
          </tr>
        `).join('');
    
        empty.style.display = rows.length === 0 ? 'block' : 'none';
        $('ai-count').textContent = `Showing 1 to ${rows.length} of ${TOTAL_RECORDS.toLocaleString()} users`;
        renderPagination();
      }
    
      function renderPagination() {
        const wrap = $('pagination');
        if (!wrap) return;
        const last = PAGES_DISPLAY;
        let html = '';
        html += `<button id="page-prev" ${currentPage === 1 ? 'disabled' : ''}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
        </button>`;
        const pages = [];
        pages.push(1);
        if (currentPage > 4) pages.push('…');
        for (let p = Math.max(2, currentPage - 1); p <= Math.min(last - 1, currentPage + 1); p++) pages.push(p);
        if (currentPage < last - 3) pages.push('…');
        if (last > 1) pages.push(last);
        pages.forEach(p => {
          if (p === '…') html += `<span class="ellipsis">…</span>`;
          else html += `<button class="${p === currentPage ? 'active' : ''}" data-page="${p}">${p}</button>`;
        });
        html += `<button id="page-next" ${currentPage === last ? 'disabled' : ''}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
        </button>`;
        wrap.innerHTML = html;
        wrap.querySelectorAll('button[data-page]').forEach(btn => {
          btn.addEventListener('click', () => { currentPage = +btn.getAttribute('data-page'); renderTable(); });
        });
        const prev = $('page-prev'), next = $('page-next');
        if (prev) prev.addEventListener('click', () => { if (currentPage > 1) { currentPage--; renderTable(); } });
        if (next) next.addEventListener('click', () => { if (currentPage < PAGES_DISPLAY) { currentPage++; renderTable(); } });
      }
    
      function renderFlagged() {
        const tbody = $('flagged-tbody');
        tbody.innerHTML = flaggedData.map(r => `
          <tr data-id="${r.id}">
            <td><div class="user-cell"><img class="avatar" src="https://i.pravatar.cc/60?img=${r.avatar}" alt=""> ${r.name}</div></td>
            <td>${r.email}</td>
            <td style="max-width:240px; color:#7a7a7a;">${r.preview}</td>
            <td><span class="pill violates">${r.reason}</span></td>
            <td>${fmtDate(r.date)}</td>
            <td>
              <div class="row-actions">
                <button data-flagged-action="view" data-id="${r.id}" title="View"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg></button>
                <button data-flagged-action="flag" data-id="${r.id}" title="Flag"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 22V4a1 1 0 0 1 1-1h13l-2 5 2 5H6"/></svg></button>
                <button data-flagged-action="more" data-id="${r.id}" title="More"><svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="12" cy="19" r="1.6"/></svg></button>
              </div>
            </td>
          </tr>
        `).join('');
      }
    
      /* Area chart */
      function renderUsageChart() {
        const svg = $('chart-usage');
        const W = 320, H = 220, pL = 30, pR = 12, pT = 16, pB = 30;
        const cw = W - pL - pR, ch = H - pT - pB;
        const max = Math.max(...usageSeries.map(p => p.v)) * 1.05;
        const yTicks = 5;
    
        let html = '<g stroke="#f1f1ed" stroke-dasharray="2 4">';
        for (let i = 0; i < yTicks; i++) {
          const y = pT + (i / (yTicks - 1)) * ch;
          html += `<line x1="${pL}" y1="${y}" x2="${W - pR}" y2="${y}"/>`;
        }
        html += '</g>';
        html += '<g font-size="9" fill="#a0a0a0" font-family="Segoe UI">';
        for (let i = 0; i < yTicks; i++) {
          const v = max * (1 - i / (yTicks - 1));
          const y = pT + (i / (yTicks - 1)) * ch;
          html += `<text x="0" y="${y + 3}">${fmtNum(v)}</text>`;
        }
        html += '</g>';
    
        const points = usageSeries.map((p, i) => ({
          x: pL + (i / (usageSeries.length - 1)) * cw,
          y: pT + ch - (p.v / max) * ch,
          label: p.l
        }));
        const linePath = points.map((p, i) => (i ? 'L' : 'M') + p.x.toFixed(1) + ',' + p.y.toFixed(1)).join(' ');
        const areaPath = linePath + ` L${points[points.length-1].x.toFixed(1)},${pT + ch} L${points[0].x.toFixed(1)},${pT + ch} Z`;
    
        html += `<defs><linearGradient id="usage_grad" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stop-color="#5e9d6a" stop-opacity=".55"/>
          <stop offset="100%" stop-color="#5e9d6a" stop-opacity="0"/>
        </linearGradient></defs>
        <path d="${areaPath}" fill="url(#usage_grad)"/>
        <path d="${linePath}" fill="none" stroke="#3a7a45" stroke-width="2"/>`;
    
        html += '<g font-size="10" fill="#a0a0a0" font-family="Segoe UI" text-anchor="middle">';
        points.forEach(p => { html += `<text x="${p.x.toFixed(1)}" y="${H - 10}">${p.label}</text>`; });
        html += '</g>';
    
        svg.innerHTML = html;
      }
    
      /* Donut */
      function renderPlansDonut() {
        const svg = $('chart-plans');
        const legend = $('legend-plans');
        const total = plansData.reduce((s, x) => s + x.value, 0) || 1;
        const cx = 100, cy = 100, r = 68, sw = 46;
    
        let html = `<g transform="rotate(-90 ${cx} ${cy})">`;
        let offset = 0;
        plansData.forEach(s => {
          const pct = (s.value / total) * 100;
          html += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none"
            stroke="${s.color}" stroke-width="${sw}" pathLength="100"
            stroke-dasharray="${pct.toFixed(2)} ${(100 - pct).toFixed(2)}"
            stroke-dashoffset="${(-offset).toFixed(2)}"
            class="donut-seg" data-tip="${s.label} — ${pct.toFixed(1)}%"/>`;
          offset += pct;
        });
        html += '</g>';
        html += `<text x="${cx}" y="${cy - 2}" text-anchor="middle" font-size="20" font-weight="700" fill="#1f1f1f" font-family="Segoe UI">24,564</text>
          <text x="${cx}" y="${cy + 16}" text-anchor="middle" font-size="11" fill="#888" font-family="Segoe UI">Total Users</text>`;
    
        let cum = 0;
        plansData.forEach(s => {
          const pct = (s.value / total) * 100;
          const mid = cum + pct / 2;
          const a = (mid / 100) * 2 * Math.PI - Math.PI / 2;
          const lx = cx + r * Math.cos(a);
          const ly = cy + r * Math.sin(a);
          html += `<text x="${lx.toFixed(1)}" y="${(ly + 3).toFixed(1)}" text-anchor="middle" font-size="11" font-weight="700" fill="#fff" font-family="Segoe UI">${pct.toFixed(1)}%</text>`;
          cum += pct;
        });
        svg.innerHTML = html;
    
        legend.innerHTML = plansData.map(s => `
          <div class="row">
            <span class="sw" style="background:${s.color}"></span>
            <div>
              <div class="ttl">${s.label}</div>
              <div class="sub">${s.value.toFixed(1)}% (${s.count.toLocaleString()})</div>
            </div>
          </div>
        `).join('');
      }
    
      /* Feedback bars */
      function renderFeedback() {
        const list = $('feedback-list');
        list.innerHTML = feedbackData.map(f => `
          <div class="feedback-row">
            <span class="lbl">${f.stars} Star${f.stars > 1 ? 's' : ''}</span>
            <div class="bar-bg"><div class="bar" style="width:${f.pct}%; background:${f.color}"></div></div>
            <span class="pct">${f.pct}%</span>
          </div>
        `).join('');
      }
    
      /* ---------- Wire up ---------- */
      $('filter-plan').addEventListener('change',   e => { filters.plan   = e.target.value; currentPage = 1; renderTable(); });
      $('filter-user').addEventListener('change',   e => { filters.user   = e.target.value; currentPage = 1; renderTable(); });
      $('filter-status').addEventListener('change', e => { filters.status = e.target.value; currentPage = 1; renderTable(); });
    
      function setSearch(v) { filters.search = v; currentPage = 1; renderTable(); }
      $('top-search').addEventListener('input',   e => { setSearch(e.target.value); $('right-search').value = e.target.value; });
      $('right-search').addEventListener('input', e => { setSearch(e.target.value); $('top-search').value   = e.target.value; });
    
      $('filters-btn').addEventListener('click', () => {
        document.querySelector('.filter-row').scrollIntoView({ behavior:'smooth', block:'center' });
        $('filter-plan').focus();
      });
    
      $('reset-btn').addEventListener('click', () => {
        filters.plan = filters.user = filters.status = filters.search = '';
        $('filter-plan').value = '';
        $('filter-user').value = '';
        $('filter-status').value = '';
        $('top-search').value = '';
        $('right-search').value = '';
        currentPage = 1;
        renderTable();
      });
    
      $('ai-tbody').addEventListener('click', e => {
        const btn = e.target.closest('button[data-row-action]');
        if (!btn) return;
        const id     = +btn.getAttribute('data-id');
        const action = btn.getAttribute('data-row-action');
        const item   = aiData.find(r => r.id === id);
        if (!item) return;
        if (action === 'view') alert(`${item.name}\nQuestions: ${item.qa}\nPlan: ${item.plan}\nRating: ${item.rating}`);
        if (action === 'flag') {
          flaggedData.push({
            id: Math.max(0, ...flaggedData.map(x => x.id)) + 1,
            name: item.name, avatar: item.avatar,
            email: (item.name.replace(/\s+/g, '') + '@gmail.com'),
            preview: 'Manually flagged prompt for review.',
            reason: 'Violates policy',
            date: new Date().toISOString().slice(0, 10)
          });
          renderFlagged();
        }
        if (action === 'more') alert(`More for ${item.name}`);
      });
    
      $('flagged-tbody').addEventListener('click', e => {
        const btn = e.target.closest('button[data-flagged-action]');
        if (!btn) return;
        const id     = +btn.getAttribute('data-id');
        const action = btn.getAttribute('data-flagged-action');
        const item   = flaggedData.find(r => r.id === id);
        if (!item) return;
        if (action === 'view') alert(`Prompt: ${item.preview}\nReason: ${item.reason}`);
        if (action === 'flag') {
          if (confirm(`Dismiss flagged prompt from ${item.name}?`)) {
            const idx = flaggedData.findIndex(x => x.id === id);
            if (idx >= 0) flaggedData.splice(idx, 1);
            renderFlagged();
          }
        }
        if (action === 'more') alert(`More for ${item.name}`);
      });
    
      $('view-all-flagged').addEventListener('click',  () => alert('All flagged prompts — coming soon'));
      $('view-all-feedback').addEventListener('click', () => alert('All feedback — coming soon'));
    
      window.aiPage = {
        data: aiData,
        flagged: flaggedData,
        render() { renderTable(); renderFlagged(); }
      };
    
      renderTable();
      renderFlagged();
      renderUsageChart();
      renderPlansDonut();
      renderFeedback();
    })();
  }

  /* ==========================================================================
     PAGE: settings  (from settings.html)
     ========================================================================== */
  if (body.classList.contains('page-settings')) {
    /* ============================================================
       ADMIN SETTINGS — data + interactivity
    ============================================================ */
    (function () {
      'use strict';
    
      const plansData = [
        { id:1, name:'Premium',   price:'$45.67', cycle:'Annually', features:'All Premium Fetures', status:'Active'   },
        { id:2, name:'Basic Plan',price:'$28.9',  cycle:'Monthly',  features:'Basic features',      status:'Active'   },
        { id:3, name:'Free Plan', price:'$0.00',  cycle:'Annually', features:'Limited Features',    status:'Inactive' },
        { id:4, name:'Premium',   price:'$45.67', cycle:'Annually', features:'All Premium Fetures', status:'Active'   },
        { id:5, name:'Premium',   price:'$45.67', cycle:'Annually', features:'All Premium Fetures', status:'Active'   },
        { id:6, name:'Premium',   price:'$45.67', cycle:'Annually', features:'All Premium Fetures', status:'Inactive' }
      ];
    
      const categoriesData = [
        { id:1, name:'Hunting Guides',  status:'Active' },
        { id:2, name:'Gear & Equipment',status:'Active' },
        { id:3, name:'Services',        status:'Active' },
        { id:4, name:'Outdoor Learning',status:'Active' }
      ];
    
      const rolesData = [
        { id:1, name:'Super Admin',   desc:'Full access to all features and settings', users:5, status:'Active'   },
        { id:2, name:'Moderators',    desc:'Manage content, users and reports',        users:3, status:'Active'   },
        { id:3, name:'Support Agent', desc:'Manage users supports and Inquires',       users:1, status:'Inactive' },
        { id:4, name:'State Manager', desc:'Manage state date and configuration',      users:4, status:'Active'   }
      ];
    
      let adCategories = ['General', 'Hunting', 'Outdoor Gear'];
    
      const $ = id => document.getElementById(id);
    
      const editSvg   = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4z"/></svg>';
      const delSvg    = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/></svg>';
      const dotsSvg   = '<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="12" cy="19" r="1.6"/></svg>';
    
      function statusBadge(s) {
        return `<span class="status ${s.toLowerCase()}"><span class="dot"></span>${s}</span>`;
      }
    
      /* ----- Membership Pricing ----- */
      function renderPlans() {
        $('plans-tbody').innerHTML = plansData.map(p => `
          <tr data-id="${p.id}">
            <td class="strong">${p.name}</td>
            <td>${p.price}</td>
            <td>${p.cycle}</td>
            <td>${p.features}</td>
            <td>${statusBadge(p.status)}</td>
            <td>
              <div class="row-actions">
                <button data-plan-action="edit" data-id="${p.id}" title="Edit">${editSvg}</button>
                <button class="del" data-plan-action="delete" data-id="${p.id}" title="Delete">${delSvg}</button>
              </div>
            </td>
          </tr>
        `).join('');
      }
    
      /* ----- Resources Categories ----- */
      function renderCategories() {
        $('cat-list').innerHTML = categoriesData.map(c => `
          <div class="cat-row" data-id="${c.id}">
            <span class="cat-name">${c.name}</span>
            <div class="cat-right">
              ${statusBadge(c.status)}
              <button class="cat-menu" data-cat-action="more" data-id="${c.id}" title="More">${dotsSvg}</button>
            </div>
          </div>
        `).join('');
      }
    
      /* ----- Roles & Permissions ----- */
      function renderRoles() {
        $('roles-tbody').innerHTML = rolesData.map(r => `
          <tr data-id="${r.id}">
            <td class="strong">${r.name}</td>
            <td>${r.desc}</td>
            <td>${r.users}</td>
            <td>${statusBadge(r.status)}</td>
            <td>
              <div class="row-actions">
                <button data-role-action="edit" data-id="${r.id}" title="Edit">${editSvg}</button>
                <button class="del" data-role-action="delete" data-id="${r.id}" title="Delete">${delSvg}</button>
              </div>
            </td>
          </tr>
        `).join('');
      }
    
      /* ----- Ad category chips ----- */
      function renderAdChips() {
        $('ad-chips').innerHTML = adCategories.map((c, i) => `
          <span class="chip">${c}
            <button data-chip-index="${i}" title="Remove">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/></svg>
            </button>
          </span>
        `).join('');
      }
    
      /* ---------- Wire up ---------- */
      $('plans-tbody').addEventListener('click', e => {
        const btn = e.target.closest('button[data-plan-action]');
        if (!btn) return;
        const id = +btn.getAttribute('data-id');
        const action = btn.getAttribute('data-plan-action');
        const plan = plansData.find(p => p.id === id);
        if (!plan) return;
        if (action === 'edit') {
          const next = prompt(`Edit price for "${plan.name}":`, plan.price);
          if (next !== null && next.trim()) {
            let v = next.trim();
            if (!v.startsWith('$')) v = '$' + v; // always show currency
            plan.price = v; renderPlans();
          }
        }
        if (action === 'delete') {
          if (confirm(`Delete plan "${plan.name}"?`)) {
            const idx = plansData.findIndex(p => p.id === id);
            if (idx >= 0) plansData.splice(idx, 1);
            renderPlans();
          }
        }
      });
    
      $('roles-tbody').addEventListener('click', e => {
        const btn = e.target.closest('button[data-role-action]');
        if (!btn) return;
        const id = +btn.getAttribute('data-id');
        const action = btn.getAttribute('data-role-action');
        const role = rolesData.find(r => r.id === id);
        if (!role) return;
        if (action === 'edit') {
          const next = prompt(`Edit description for "${role.name}":`, role.desc);
          if (next !== null && next.trim()) { role.desc = next.trim(); renderRoles(); }
        }
        if (action === 'delete') {
          if (confirm(`Delete role "${role.name}"?`)) {
            const idx = rolesData.findIndex(r => r.id === id);
            if (idx >= 0) rolesData.splice(idx, 1);
            renderRoles();
          }
        }
      });
    
      $('cat-list').addEventListener('click', e => {
        const btn = e.target.closest('button[data-cat-action]');
        if (!btn) return;
        const id = +btn.getAttribute('data-id');
        const cat = categoriesData.find(c => c.id === id);
        if (!cat) return;
        if (confirm(`Toggle status for "${cat.name}"?`)) {
          cat.status = cat.status === 'Active' ? 'Inactive' : 'Active';
          renderCategories();
        }
      });
    
      $('ad-chips').addEventListener('click', e => {
        const btn = e.target.closest('button[data-chip-index]');
        if (!btn) return;
        const i = +btn.getAttribute('data-chip-index');
        adCategories.splice(i, 1);
        renderAdChips();
      });
    
      $('add-plan').addEventListener('click', () => {
        const name = prompt('New plan name:');
        if (!name || !name.trim()) return;
        plansData.push({
          id: Math.max(0, ...plansData.map(p => p.id)) + 1,
          name: name.trim(), price: '$0.00', cycle: 'Monthly',
          features: 'New plan features', status: 'Active'
        });
        renderPlans();
      });
    
      $('add-role').addEventListener('click', () => {
        const name = prompt('New role name:');
        if (!name || !name.trim()) return;
        rolesData.push({
          id: Math.max(0, ...rolesData.map(r => r.id)) + 1,
          name: name.trim(), desc: 'New role description', users: 0, status: 'Active'
        });
        renderRoles();
      });
    
      /* Setting Menu jump links */
      document.querySelectorAll('.menu-list a').forEach(a => {
        a.addEventListener('click', () => {
          const target = document.getElementById(a.getAttribute('data-jump'));
          if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
      });
    
      /* Manage links */
      [['manage-ai','AI Settings'],['manage-cats','Categories'],['manage-roles','Roles & Permissions'],
       ['manage-ads','Ad Settings'],['manage-state','State Settings'],['view-all-plans','All Membership Plans']
      ].forEach(([id, label]) => {
        const el = $(id);
        if (el) el.addEventListener('click', () => alert(label + ' — coming soon'));
      });
    
      window.settingsPage = {
        plans: plansData, categories: categoriesData, roles: rolesData,
        render() { renderPlans(); renderCategories(); renderRoles(); renderAdChips(); }
      };
    
      renderPlans();
      renderCategories();
      renderRoles();
      renderAdChips();
    })();
  }
})();
