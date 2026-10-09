/* ═══════════════════════════════════════════════════════════════════════
   CROSS-SELL — "Complete the setup" suggestions in the ALL ORDERS panel
   ───────────────────────────────────────────────────────────────────────
   Pilot scope: pedals, shoes and cleats.

   Load it on any catalog page, right after shared-cart.js:

       <script src="cross-sell.js"></script>

   To switch it off, remove that line. Nothing else depends on it.

   How it works
   - Reads the shared cart (localStorage 'shimano_all_orders').
   - Works out which pedal systems the cart touches: SPD, SPD-SL,
     SPD-SLR, FLAT. Pedals carry their system in PEDAL_DATA (cat). Shoes
     do not, so SHOE_SYSTEM below holds it, checked against Shimano.
   - For each system it fills the gaps: pedals without shoes -> shoes,
     shoes without pedals -> pedals, no spare cleats -> cleats.
   - Stock comes live from PEDAL_DATA / SHOE_DATA. On pages that do not
     hold that data, pedals.html / shoes.html are fetched once and the
     arrays are read from them, so the daily stock update applies here
     too. Unavailable items are never suggested.
   - Rule-based on purpose: a wrong compatibility suggestion costs a
     wrong order. A shoe model missing from SHOE_SYSTEM gets no
     suggestions rather than a guessed one.
   ═══════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  if (window.__crossSell) return;

  var SHARED_KEY = 'shimano_all_orders';
  var PEDALS_LS_KEY = 'shimano_pedals_order';
  var MAX_PER_BLOCK = 4;

  /* ── Shoe model -> pedal systems (checked 9 Oct 2026) ────────────────
     First entry is the shoe's primary system. RC910/RC810 are built for
     SPD-SLR but keep the 3-bolt pattern, so they also work on SPD-SL.
     IC100 takes both 2-bolt and 3-bolt cleats. GE = clipless, GF = flat. */
  var SHOE_SYSTEM = {
    RC910: ['SPD-SLR', 'SPD-SL'], RC810: ['SPD-SLR', 'SPD-SL'],
    RC703: ['SPD-SL'], RC503: ['SPD-SL'], RC302: ['SPD-SL'], RC102: ['SPD-SL'], RP102: ['SPD-SL'],
    TR903: ['SPD-SL'], TR501: ['SPD-SL'],
    XC903: ['SPD'], XC703: ['SPD'], XC503: ['SPD'], XC302: ['SPD'], XC102: ['SPD'],
    MW502: ['SPD'], MW702: ['SPD'],
    RX910: ['SPD'], RX801: ['SPD'], RX710: ['SPD'], RX600: ['SPD'],
    GE900: ['SPD'], GE700: ['SPD'], GE500: ['SPD'],
    SD5: ['SPD'], EX900: ['SPD'], EX700: ['SPD'], EX500: ['SPD'], EX300: ['SPD'],
    ET701: ['SPD'], ET501: ['SPD'], IC500: ['SPD'], IC100: ['SPD', 'SPD-SL'],
    GF800: ['FLAT'], GF800GTX: ['FLAT'], GF600: ['FLAT'], GF400: ['FLAT'], MX101: ['FLAT']
  };

  /* Riding family, used only to order suggestions (MTB pedal -> MTB
     shoes first). Compatibility never depends on it. */
  var SHOE_FAMILY = { MTB: 'mtb', GRAVEL: 'mtb', ENDURO: 'tour', EXPLORER: 'tour',
                      'BIKE TOUR': 'tour', INDOOR: 'tour', ROAD: 'road', TRIATHLON: 'road' };
  var TOUR_PEDALS = { 'PD-T8000': 1, 'PD-T421': 1, 'PD-EH500': 1, 'PD-EH510': 1, 'PD-ED500': 1,
                      'PD-ES600': 1, 'PD-ME700': 1, 'PD-M324': 1 };
  function pedalFamily(g) {
    if (g.cat === 'SPD-SL' || g.cat === 'SPD-SLR') return 'road';
    return TOUR_PEDALS[g.group] ? 'tour' : 'mtb';
  }

  var CLEAT_SYSTEM = {
    ICLSL100: 'SPD-SLR', ICLSL110: 'SPD-SLR', ICLSL120: 'SPD-SLR', ICLSL130: 'SPD-SLR',
    ISMSH10: 'SPD-SL', ISMSH11: 'SPD-SL', ISMSH12: 'SPD-SL',
    ISMSH51: 'SPD', ISMSH51A: 'SPD', ISMSH56: 'SPD', ISMSH56A: 'SPD', ICLMT001: 'SPD', ICLMT001A: 'SPD'
  };
  /* Cleat named in a pedal's description -> spare cleat codes, best first */
  var SPARE_FOR_BOX = {
    'SM-SH51': ['ISMSH51', 'ISMSH51A'], 'SM-SH56': ['ISMSH56', 'ISMSH56A'],
    'CL-MT001': ['ICLMT001', 'ICLMT001A'],
    'SM-SH11': ['ISMSH11', 'ISMSH12', 'ISMSH10'], 'SM-SH12': ['ISMSH12', 'ISMSH11', 'ISMSH10'],
    'CL-SL11': ['ICLSL110', 'ICLSL120', 'ICLSL100', 'ICLSL130']
  };
  var DEFAULT_SPARES = {
    'SPD': ['ISMSH51', 'ISMSH56', 'ICLMT001'],
    'SPD-SL': ['ISMSH11', 'ISMSH12', 'ISMSH10'],
    'SPD-SLR': ['ICLSL110', 'ICLSL120', 'ICLSL100', 'ICLSL130']
  };

  var SYS_LABEL = { 'SPD': 'SPD', 'SPD-SL': 'SPD-SL', 'SPD-SLR': 'SPD-SLR', 'FLAT': 'Flat' };
  var SYS_ORDER = ['SPD-SLR', 'SPD-SL', 'SPD', 'FLAT'];

  /* ── Data: live PEDAL_DATA / SHOE_DATA ─────────────────────────────── */
  var data = { pedals: null, shoes: null };
  var loading = null;

  function extractArray(text, name) {
    var i = text.indexOf('const ' + name + ' =');
    if (i < 0) return null;
    var j = text.indexOf('[', i), depth = 0, inStr = false, q = '', k;
    for (k = j; k < text.length; k++) {
      var c = text[k];
      if (inStr) { if (c === '\\') { k++; continue; } if (c === q) inStr = false; continue; }
      if (c === '"' || c === "'" || c === '`') { inStr = true; q = c; continue; }
      if (c === '[' || c === '{') depth++;
      else if (c === ']' || c === '}') { depth--; if (!depth) break; }
    }
    var lit = text.slice(j, k + 1);
    try { return JSON.parse(lit); } catch (e) {}
    try { return (new Function('return ' + lit))(); } catch (e2) { return null; }
  }

  function fetchArray(url, name) {
    return fetch(url, { credentials: 'same-origin', cache: 'no-cache' })
      .then(function (r) { return r.ok ? r.text() : ''; })
      .then(function (t) { return extractArray(t, name); })
      .catch(function () { return null; });
  }

  /* Top-level const in a classic script is a global binding, not a
     window property, so read it by name. */
  function pageGlobal(name) {
    try { return (new Function('return typeof ' + name + ' !== "undefined" ? ' + name + ' : null'))(); }
    catch (e) { return null; }
  }

  function loadData() {
    if (data.pedals && data.shoes) return Promise.resolve();
    if (loading) return loading;
    data.pedals = data.pedals || pageGlobal('PEDAL_DATA');
    data.shoes = data.shoes || pageGlobal('SHOE_DATA');
    loading = Promise.all([
      data.pedals ? data.pedals : fetchArray('pedals.html', 'PEDAL_DATA'),
      data.shoes ? data.shoes : fetchArray('shoes.html', 'SHOE_DATA')
    ]).then(function (res) {
      data.pedals = res[0] || [];
      data.shoes = res[1] || [];
      indexData();
    });
    return loading;
  }

  var idx = { pedalByCode: {}, shoeByCode: {}, cleatItem: {} };
  function indexData() {
    data.pedals.forEach(function (g) {
      (g.items || []).forEach(function (it) { idx.pedalByCode[it.code] = g; });
    });
    data.shoes.forEach(function (g) {
      (g.items || []).forEach(function (it) {
        idx.shoeByCode[it.code] = g;
        if (CLEAT_SYSTEM[it.code]) idx.cleatItem[it.code] = it;
      });
    });
  }

  /* ── Cart ──────────────────────────────────────────────────────────── */
  function getShared() {
    try { return JSON.parse(localStorage.getItem(SHARED_KEY)) || {}; } catch (e) { return {}; }
  }
  function pageId() {
    return (document.body && document.body.getAttribute('data-catalog') || '').toLowerCase();
  }

  function analyseCart() {
    var shared = getShared(), sys = {}, inCart = {}, families = {}, boxCleats = {};
    function slot(s) { return sys[s] || (sys[s] = { pedal: false, shoe: false, cleat: false }); }

    Object.keys(shared.pedals || {}).forEach(function (code) {
      inCart[code] = 1;
      var g = idx.pedalByCode[code];
      if (!g || !SYS_LABEL[g.cat]) return;
      slot(g.cat).pedal = true;
      families[g.cat + ':' + pedalFamily(g)] = 1;
      var it = (g.items || []).filter(function (x) { return x.code === code; })[0];
      var m = it && String(it.desc1).match(/SM-SH\d+|CL-MT\d+|CL-SL\d+/);
      if (m) boxCleats[g.cat] = boxCleats[g.cat] || m[0];
    });

    Object.keys(shared.shoes || {}).forEach(function (code) {
      inCart[code] = 1;
      if (CLEAT_SYSTEM[code]) { slot(CLEAT_SYSTEM[code]).cleat = true; return; }
      var g = idx.shoeByCode[code];
      var list = g && SHOE_SYSTEM[g.group];
      if (!list) return;
      list.forEach(function (s, n) {
        slot(s).shoe = true;
        if (n === 0) families[s + ':' + (SHOE_FAMILY[g.cat] || 'mtb')] = 1;
      });
    });

    return { sys: sys, inCart: inCart, families: families, boxCleats: boxCleats };
  }

  /* ── Suggestions ───────────────────────────────────────────────────── */
  function usable(it) { return it && (it.status === 'available' || it.status === 'etd'); }
  function bestItem(items) {
    var av = items.filter(function (i) { return i.status === 'available'; });
    if (av.length) return av[0];
    var etd = items.filter(function (i) { return i.status === 'etd'; });
    return etd[0] || null;
  }
  function famRank(fam, system, families) {
    return families[system + ':' + fam] ? 0 : 1;
  }

  function shoesFor(system, a) {
    var out = [];
    data.shoes.forEach(function (g, order) {
      var list = SHOE_SYSTEM[g.group];
      if (!list || list[0] !== system) return;
      var items = g.items || [];
      var avail = items.filter(function (i) { return i.status === 'available'; }).length;
      var etd = items.filter(function (i) { return i.status === 'etd'; }).length;
      if (!avail && !etd) return;
      out.push({ kind: 'shoe', group: g.group, name: g.name, cat: g.cat, avail: avail, etd: etd,
                 rank: famRank(SHOE_FAMILY[g.cat] || 'mtb', system, a.families), order: order });
    });
    out.sort(function (x, y) { return (x.rank - y.rank) || ((y.avail > 0) - (x.avail > 0)) || (x.order - y.order); });
    return out.slice(0, MAX_PER_BLOCK);
  }

  function pedalsFor(system, a) {
    var out = [];
    data.pedals.forEach(function (g, order) {
      if (g.cat !== system) return;
      var it = bestItem(g.items || []);
      if (!it || a.inCart[it.code]) return;
      out.push({ kind: 'pedal', group: g.group, name: g.name, item: it,
                 rank: famRank(pedalFamily(g), system, a.families), order: order });
    });
    out.sort(function (x, y) { return (x.rank - y.rank) || ((y.item.status === 'available') - (x.item.status === 'available')) || (x.order - y.order); });
    return out.slice(0, MAX_PER_BLOCK);
  }

  function cleatsFor(system, a) {
    var codes = (a.boxCleats[system] && SPARE_FOR_BOX[a.boxCleats[system]]) || DEFAULT_SPARES[system] || [];
    var out = [];
    codes.forEach(function (code) {
      var it = idx.cleatItem[code];
      if (!usable(it) || a.inCart[code]) return;
      out.push({ kind: 'cleat', item: it });
    });
    return out.slice(0, 3);
  }

  function buildBlocks(a) {
    var blocks = [];
    SYS_ORDER.forEach(function (s) {
      var st = a.sys[s];
      if (!st) return;
      var label = SYS_LABEL[s];
      if (st.pedal && !st.shoe) {
        var sh = shoesFor(s, a);
        if (sh.length) blocks.push({ title: label + ' shoes for the pedals in this order', rows: sh });
      }
      if (st.shoe && !st.pedal) {
        var pd = pedalsFor(s, a);
        if (pd.length) blocks.push({ title: label + ' pedals for the shoes in this order', rows: pd });
      }
      if (s !== 'FLAT' && (st.pedal || st.shoe) && !st.cleat) {
        var cl = cleatsFor(s, a);
        if (cl.length) blocks.push({ title: 'Spare ' + label + ' cleats', rows: cl,
          note: s === 'SPD-SLR' ? 'SPD-SLR pedals take CL-SL cleats only. SM-SH cleats do not fit.' : '' });
      }
    });

    /* Mixed-system warning: SPD-SLR pedals with only SM-SH road cleats */
    var slr = a.sys['SPD-SLR'], sl = a.sys['SPD-SL'];
    if (slr && slr.pedal && !slr.cleat && sl && sl.cleat && !sl.pedal) {
      blocks.unshift({ warn: 'This order has SPD-SLR pedals and SM-SH (SPD-SL) cleats. They do not fit each other. SPD-SLR pedals need CL-SL cleats.' });
    }
    return blocks;
  }

  /* ── Add to cart ───────────────────────────────────────────────────── */
  function addItem(catalog, it) {
    var shared = getShared();
    var slotObj = shared[catalog] || (shared[catalog] = {});
    var cur = slotObj[it.code];
    var qty = (cur && cur.qty ? cur.qty : 0) + 1;
    var entry = { qty: qty, desc1: it.desc1 || '', desc2: it.desc2 || '', price: '' };
    slotObj[it.code] = entry;
    try { localStorage.setItem(SHARED_KEY, JSON.stringify(shared)); } catch (e) {}

    if (pageId() === catalog && window.orderMap && typeof window.orderMap === 'object') {
      /* Same page: write into the page's own order so its sync keeps it */
      window.orderMap[it.code] = { qty: qty, desc1: entry.desc1, desc2: entry.desc2,
        status: it.status || '', etd: it.etd || '', price: catalog === 'shoes' ? (Number(it.price) || 0) : '' };
      var inputs = document.querySelectorAll('.qty-input[data-code="' + it.code + '"]');
      for (var i = 0; i < inputs.length; i++) { inputs[i].value = qty; inputs[i].dataset.hasValue = 'true'; }
      if (typeof window.saveOrder === 'function') window.saveOrder();
      if (typeof window.updateOrderPanel === 'function') window.updateOrderPanel();
      if (typeof window.updateStats === 'function') window.updateStats();
    } else if (catalog === 'pedals') {
      /* pedals.html restores from its own key first; keep it in step */
      try {
        var own = JSON.parse(localStorage.getItem(PEDALS_LS_KEY)) || {};
        if (Object.keys(own).length) {
          own[it.code] = { qty: qty, desc1: entry.desc1, desc2: entry.desc2,
                           status: it.status || '', etd: it.etd || '', price: '' };
          localStorage.setItem(PEDALS_LS_KEY, JSON.stringify(own));
        }
      } catch (e2) {}
    }
    if (typeof window._aoRefresh === 'function') window._aoRefresh();
  }

  function openShoe(group) {
    if (pageId() === 'shoes') {
      var inp = document.getElementById('searchInput');
      if (inp) {
        inp.value = group;
        inp.dispatchEvent(new Event('input', { bubbles: true }));
        if (typeof window._aoClose === 'function') window._aoClose();
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
    }
    location.href = 'shoes.html?skip=true&xs=' + encodeURIComponent(group);
  }

  /* On shoes.html opened from a suggestion: pre-fill the search */
  function applyIncomingSearch() {
    if (pageId() !== 'shoes') return;
    var g = new URLSearchParams(location.search).get('xs');
    if (!g) return;
    setTimeout(function () {
      var inp = document.getElementById('searchInput');
      if (!inp) return;
      inp.value = g;
      inp.dispatchEvent(new Event('input', { bubbles: true }));
    }, 500);
  }

  /* ── Render ────────────────────────────────────────────────────────── */
  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function statusTag(it) {
    if (it.status === 'available') return '<span class="xs-st xs-ok">In stock</span>';
    return '<span class="xs-st xs-etd">ETD ' + esc(it.etd || '') + '</span>';
  }

  var actions = [];
  function rowHtml(r) {
    var n = actions.length;
    if (r.kind === 'shoe') {
      actions.push(function () { openShoe(r.group); });
      var stock = r.avail ? r.avail + ' SKUs in stock' : 'ETD only';
      return '<div class="xs-row"><div class="xs-main"><span class="xs-code">SH-' + esc(r.group) + '</span>' +
        '<span class="xs-desc">' + esc(r.cat) + ' · ' + stock + '</span></div>' +
        '<button class="xs-btn" data-xs="' + n + '">Sizes →</button></div>';
    }
    var it = r.item, catalog = r.kind === 'pedal' ? 'pedals' : 'shoes';
    actions.push(function () { addItem(catalog, it); });
    var desc = r.kind === 'pedal' ? (r.name || it.desc2) : (it.desc1.replace(/^Shoe Cleats (Set )?(SPD-SLR |SPD-SL )?/, '') + ' · ' + it.desc2);
    return '<div class="xs-row"><div class="xs-main"><span class="xs-code">' + esc(it.code) + '</span>' +
      '<span class="xs-desc">' + esc(desc) + ' ' + statusTag(it) + '</span></div>' +
      '<button class="xs-btn" data-xs="' + n + '">+ Add</button></div>';
  }

  var cssDone = false;
  function injectCss() {
    if (cssDone) return; cssDone = true;
    var css = document.createElement('style');
    css.textContent =
      '.xs-wrap{margin:14px 14px 18px;border:1px solid rgba(0,130,202,.35);border-radius:10px;' +
      'background:rgba(0,130,202,.06);overflow:hidden}' +
      '.xs-head{padding:10px 14px;font-family:"Barlow Condensed",Arial,sans-serif;font-size:12px;font-weight:700;' +
      'letter-spacing:.12em;text-transform:uppercase;color:#0082CA;border-bottom:1px solid rgba(0,130,202,.2)}' +
      '.xs-sub{padding:8px 14px 4px;font-size:11px;color:var(--text-muted,#6b6b82);font-weight:600}' +
      '.xs-note{padding:0 14px 6px;font-size:11px;color:#f59e0b}' +
      '.xs-warn{margin:10px 14px 0;padding:8px 10px;border-radius:6px;background:rgba(239,68,68,.1);' +
      'border:1px solid rgba(239,68,68,.3);color:#ef4444;font-size:11.5px;line-height:1.4}' +
      '.xs-row{display:flex;align-items:center;gap:8px;padding:6px 14px}' +
      '.xs-main{flex:1;min-width:0;display:flex;flex-direction:column}' +
      '.xs-code{font-family:"Barlow Condensed",Arial,sans-serif;font-weight:700;font-size:13px;color:var(--text,#e8e8f0)}' +
      '.xs-desc{font-size:11px;color:var(--text-muted,#6b6b82);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
      '.xs-st{font-size:10px;font-weight:700;margin-left:4px}.xs-ok{color:var(--avail,#00c896)}.xs-etd{color:#f59e0b}' +
      '.xs-btn{flex-shrink:0;padding:5px 10px;border-radius:6px;border:1px solid #0082CA;background:transparent;' +
      'color:#0082CA;font-family:"Barlow Condensed",Arial,sans-serif;font-size:12px;font-weight:700;' +
      'letter-spacing:.05em;cursor:pointer;transition:all .15s}' +
      '.xs-btn:hover{background:#0082CA;color:#fff}' +
      '.xs-pad{height:6px}';
    document.head.appendChild(css);
  }

  function render() {
    var body = document.getElementById('aoBody');
    if (!body) return;
    var old = document.getElementById('xsWrap');
    if (old) old.remove();

    var shared = getShared();
    var relevant = Object.keys(shared.pedals || {}).length || Object.keys(shared.shoes || {}).length;
    if (!relevant) return;

    if (!(data.pedals && data.shoes && loading)) { loadData().then(render); return; }

    var blocks = buildBlocks(analyseCart());
    if (!blocks.length) return;

    injectCss();
    actions = [];
    var html = '<div class="xs-head">Complete the setup</div>';
    blocks.forEach(function (b) {
      if (b.warn) { html += '<div class="xs-warn">' + esc(b.warn) + '</div>'; return; }
      html += '<div class="xs-sub">' + esc(b.title) + '</div>';
      if (b.note) html += '<div class="xs-note">' + esc(b.note) + '</div>';
      b.rows.forEach(function (r) { html += rowHtml(r); });
    });
    html += '<div class="xs-pad"></div>';

    var wrap = document.createElement('div');
    wrap.className = 'xs-wrap'; wrap.id = 'xsWrap';
    wrap.innerHTML = html;
    wrap.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-xs]');
      if (!btn) return;
      var fn = actions[Number(btn.getAttribute('data-xs'))];
      if (fn) fn();
    });
    body.appendChild(wrap);
  }

  window.__crossSell = { render: render, _analyse: function () { return analyseCart(); } };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', applyIncomingSearch);
  else applyIncomingSearch();
})();
