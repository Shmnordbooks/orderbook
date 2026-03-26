/* ═══════════════════════════════════════════════════════════════
   SHIMANO ALL ORDERS — Cross-Catalog Order Sync  v3.0
   ═══════════════════════════════════════════════════════════════ */
(function(){
  'use strict';

  var CDN_URLS = [
    'https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js'
  ];
  function loadSheetJS() {
    if (window.XLSX) return Promise.resolve();
    return new Promise(function(resolve, reject) {
      var idx = 0;
      (function tryNext() {
        if (idx >= CDN_URLS.length) return reject();
        var s = document.createElement('script');
        s.src = CDN_URLS[idx++];
        s.onload = resolve;
        s.onerror = function(){ document.head.removeChild(s); tryNext(); };
        document.head.appendChild(s);
      })();
    });
  }

  var SHARED_KEY   = 'shimano_all_orders';
  var PAGE_LABELS  = { hardgoods:'HARDGOODS', shoes:'SHOES', pedals:'PEDALS' };
  var PAGE_COLORS  = { hardgoods:'#0ea5e9', shoes:'#f59e0b', pedals:'#10b981' };
  var POLL_MS      = 400;
  var PAGE_ID      = null; // lazy — set in init()

  function getPageId() {
    if (!PAGE_ID) {
      PAGE_ID = (document.body && document.body.getAttribute('data-catalog') || 'unknown').toLowerCase();
    }
    return PAGE_ID;
  }

  function getShared() {
    try { return JSON.parse(localStorage.getItem(SHARED_KEY)) || {}; } catch(e){ return {}; }
  }
  function saveShared(d) {
    try { localStorage.setItem(SHARED_KEY, JSON.stringify(d)); } catch(e){}
  }

  /* ─── Snapshot current page orders ──────────────────── */
  function snapshotPage() {
    var result = {};
    if (window.orderList && typeof window.orderList === 'object') {
      var keys = Object.keys(window.orderList);
      for (var i = 0; i < keys.length; i++) {
        var code = keys[i], v = window.orderList[code];
        if (typeof v === 'object' && v) {
          result[code] = { qty:v.qty||0, desc1:v.desc||v.desc1||'', desc2:v.desc2||'', price:v.price||'' };
        } else {
          result[code] = { qty:Number(v)||0, desc1:code, desc2:'', price:'' };
        }
      }
    }
    if (window.orderMap && typeof window.orderMap === 'object') {
      var keys2 = Object.keys(window.orderMap);
      for (var j = 0; j < keys2.length; j++) {
        var code2 = keys2[j], v2 = window.orderMap[code2];
        if (typeof v2 === 'object' && v2) {
          result[code2] = { qty:v2.qty||0, desc1:v2.desc1||v2.desc||'', desc2:v2.desc2||'', price:v2.price||'' };
        }
      }
    }
    return result;
  }

  /* ─── Sync: ONLY update this page's slot, NEVER touch others ── */
  var _lastHash = '';
  var _restored = false; // set to true after restorePageFromShared runs
  function syncToShared() {
    var pid = getPageId();
    if (pid === 'unknown') return;
    var snap = snapshotPage();
    var hash = JSON.stringify(snap);
    if (hash === _lastHash) return;
    _lastHash = hash;

    var shared = getShared();
    // Only write THIS page's data — never delete other pages
    if (Object.keys(snap).length === 0) {
      // Don't wipe the shared slot until restore has had a chance to run
      if (!_restored) return;
      // Page has no orders — remove only this page's entry
      if (shared[pid]) {
        delete shared[pid];
        saveShared(shared);
      }
    } else {
      shared[pid] = snap;
      saveShared(shared);
    }
    updateBadge();
  }

  /* ─── Delete single item from shared cart ───────────── */
  function deleteItem(catalog, code) {
    var shared = getShared();
    if (!shared[catalog] || !shared[catalog][code]) return;
    delete shared[catalog][code];
    if (Object.keys(shared[catalog]).length === 0) delete shared[catalog];
    saveShared(shared);

    // If deleting from current page, also remove from live order
    var pid = getPageId();
    if (catalog === pid) {
      if (window.orderList && window.orderList[code]) {
        delete window.orderList[code];
        if (typeof window.updateOrderPanel === 'function') window.updateOrderPanel();
        // Clear the input field too
        var inputs = document.querySelectorAll('.qty-input[data-code="' + code + '"]');
        for (var i = 0; i < inputs.length; i++) { inputs[i].value = ''; inputs[i].dataset.hasValue = 'false'; }
      }
      if (window.orderMap && window.orderMap[code]) {
        delete window.orderMap[code];
        if (typeof window.saveOrder === 'function') window.saveOrder();
        if (typeof window.updateOrderPanel === 'function') window.updateOrderPanel();
        if (typeof window.updateStats === 'function') window.updateStats();
        var inputs2 = document.querySelectorAll('.qty-input[data-code="' + code + '"]');
        for (var j = 0; j < inputs2.length; j++) { inputs2[j].value = ''; inputs2[j].dataset.hasValue = 'false'; }
      }
      _lastHash = ''; // force re-sync
    }

    updateBadge();
    var pn = document.getElementById('aoPanel');
    if (pn && pn.classList.contains('open')) renderPanel();
  }
  // Expose globally for onclick
  window._aoDeleteItem = deleteItem;

  /* ─── Totals ────────────────────────────────────────── */
  function getTotals() {
    var shared = getShared(), totalItems = 0;
    var pages = Object.keys(shared);
    for (var p = 0; p < pages.length; p++) {
      var items = shared[pages[p]], codes = Object.keys(items);
      for (var c = 0; c < codes.length; c++) totalItems += (items[codes[c]].qty || 0);
    }
    return totalItems;
  }

  function collectAll() {
    var shared = getShared(), all = [], order = ['hardgoods','shoes','pedals'];
    for (var o = 0; o < order.length; o++) {
      var pg = order[o], items = shared[pg];
      if (!items) continue;
      var codes = Object.keys(items);
      for (var c = 0; c < codes.length; c++) {
        var code = codes[c], v = items[code];
        all.push({ source:PAGE_LABELS[pg]||pg.toUpperCase(), catalog:pg, code:code,
          desc1:v.desc1||'', desc2:v.desc2||'', qty:v.qty||0, price:v.price||'' });
      }
    }
    return all;
  }

  /* ═══════════════════════════════════════════════════════
     UI
     ═══════════════════════════════════════════════════════ */
  function injectUI() {
    var css = document.createElement('style');
    css.textContent = '\
.ao-fab{position:fixed;bottom:20px;right:20px;z-index:9999;width:56px;height:56px;border-radius:14px;\
background:linear-gradient(135deg,#0066cc,#0044aa);border:none;cursor:pointer;\
display:flex;align-items:center;justify-content:center;\
box-shadow:0 4px 20px rgba(0,102,204,.35);transition:all .25s}\
.ao-fab:hover{transform:translateY(-2px);box-shadow:0 6px 28px rgba(0,102,204,.5)}\
.ao-fab svg{width:24px;height:24px;color:#fff}\
.ao-badge{position:absolute;top:-5px;right:-5px;background:#e8003d;color:#fff;font-size:11px;\
font-weight:700;min-width:21px;height:21px;border-radius:99px;display:flex;align-items:center;\
justify-content:center;padding:0 5px;font-family:"Barlow Condensed",Arial,sans-serif;\
transform:scale(0);transition:transform .3s cubic-bezier(.34,1.56,.64,1)}\
.ao-badge.vis{transform:scale(1)}\
.ao-overlay{position:fixed;inset:0;background:rgba(0,0,0,.5);backdrop-filter:blur(3px);\
z-index:10000;opacity:0;pointer-events:none;transition:opacity .3s}\
.ao-overlay.open{opacity:1;pointer-events:all}\
.ao-panel{position:fixed;top:0;right:0;width:460px;max-width:96vw;height:100vh;\
background:var(--surface,#111118);border-left:1px solid var(--border,#1e1e2e);\
z-index:10001;display:flex;flex-direction:column;transform:translateX(100%);\
transition:transform .35s cubic-bezier(.22,1,.36,1);box-shadow:-8px 0 40px rgba(0,0,0,.45)}\
.ao-panel.open{transform:translateX(0)}\
.ao-head{padding:16px 20px;border-bottom:1px solid var(--border,#1e1e2e);display:flex;\
align-items:center;justify-content:space-between}\
.ao-head h3{font-family:"Barlow Condensed",Arial,sans-serif;font-size:17px;font-weight:700;\
letter-spacing:.08em;text-transform:uppercase;color:var(--text,#e8e8f0);margin:0;\
display:flex;align-items:center;gap:8px}\
.ao-count{font-size:12px;color:var(--text-muted,#6b6b82);font-weight:400;text-transform:none;letter-spacing:0}\
.ao-close{background:none;border:none;color:var(--text-muted,#6b6b82);cursor:pointer;\
padding:6px;border-radius:6px;display:flex;transition:all .2s}\
.ao-close:hover{color:var(--text,#e8e8f0);background:rgba(255,255,255,.06)}\
.ao-body{flex:1;overflow-y:auto;padding:0}\
.ao-body::-webkit-scrollbar{width:4px}\
.ao-body::-webkit-scrollbar-thumb{background:var(--border,#1e1e2e);border-radius:4px}\
.ao-sh{padding:10px 20px;font-family:"Barlow Condensed",Arial,sans-serif;font-size:11px;\
font-weight:700;letter-spacing:.12em;text-transform:uppercase;display:flex;\
align-items:center;gap:8px;position:sticky;top:0;\
background:var(--surface,#111118);z-index:1;border-bottom:1px solid rgba(255,255,255,.04)}\
.ao-dot{width:7px;height:7px;border-radius:50%;flex-shrink:0}\
.ao-sc{color:var(--text-muted,#6b6b82);font-weight:400;letter-spacing:.04em}\
.ao-row{display:grid;grid-template-columns:100px 1fr 36px 24px;gap:6px;padding:6px 20px;\
border-bottom:1px solid rgba(255,255,255,.025);font-size:12px;align-items:center}\
.ao-rc{font-family:"Barlow Condensed",Arial,sans-serif;font-weight:700;font-size:12px;\
color:var(--text,#e8e8f0);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}\
.ao-rd{color:var(--text-muted,#6b6b82);white-space:nowrap;overflow:hidden;\
text-overflow:ellipsis;font-size:11px}\
.ao-rq{font-family:"Barlow Condensed",Arial,sans-serif;font-weight:700;font-size:13px;\
color:var(--avail,#00c896);text-align:right}\
.ao-rx{background:none;border:none;color:var(--text-muted,#6b6b82);cursor:pointer;\
padding:2px;border-radius:4px;display:flex;align-items:center;justify-content:center;\
transition:all .15s;opacity:.5}\
.ao-rx:hover{opacity:1;color:#ef4444;background:rgba(239,68,68,.1)}\
.ao-empty{display:flex;flex-direction:column;align-items:center;justify-content:center;\
height:100%;color:var(--text-muted,#6b6b82);gap:12px;padding:40px;opacity:.5}\
.ao-foot{border-top:1px solid var(--border,#1e1e2e);padding:16px 20px;background:var(--card,#16161f)}\
.ao-fr{display:flex;justify-content:space-between;align-items:center;margin-bottom:10px}\
.ao-fl{font-size:12px;color:var(--text-muted,#6b6b82)}\
.ao-ft{font-family:"Barlow Condensed",Arial,sans-serif;font-size:22px;font-weight:700;color:var(--text,#e8e8f0)}\
.ao-chips{display:flex;gap:6px;flex-wrap:wrap;margin-top:4px}\
.ao-chip{font-size:10px;padding:2px 8px;border-radius:4px;font-weight:600;\
font-family:"Barlow Condensed",Arial,sans-serif;letter-spacing:.05em}\
.ao-export{width:100%;padding:12px;border-radius:8px;border:none;\
background:linear-gradient(135deg,#0066cc,#0044aa);\
color:#fff;font-family:"Barlow Condensed",Arial,sans-serif;font-size:13px;font-weight:700;\
letter-spacing:.08em;text-transform:uppercase;cursor:pointer;transition:all .25s;\
display:flex;align-items:center;justify-content:center;gap:8px}\
.ao-export:hover{background:linear-gradient(135deg,#3399ff,#0066cc);box-shadow:0 4px 16px rgba(0,102,204,.3)}\
.ao-export:disabled{opacity:.4;cursor:not-allowed}\
.ao-spin{display:none;width:14px;height:14px;border:2px solid rgba(255,255,255,.3);\
border-top-color:#fff;border-radius:50%;animation:aospin .6s linear infinite}\
@keyframes aospin{to{transform:rotate(360deg)}}\
.ao-clear{width:100%;padding:8px;border-radius:6px;border:1px solid rgba(239,68,68,.2);\
background:rgba(239,68,68,.06);color:#ef4444;font-family:"Barlow Condensed",Arial,sans-serif;\
font-size:11px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;cursor:pointer;\
margin-top:8px;transition:all .2s}\
.ao-clear:hover{background:rgba(239,68,68,.12)}\
@media(max-width:768px){.ao-panel{width:100vw}.ao-fab{bottom:14px;right:14px;width:50px;height:50px;border-radius:12px}\
.ao-row{grid-template-columns:80px 1fr 30px 22px}}';
    document.head.appendChild(css);

    var fab = document.createElement('button');
    fab.className = 'ao-fab';
    fab.title = 'All Orders';
    fab.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg><span class="ao-badge" id="aoBadge">0</span>';
    fab.onclick = togglePanel;
    document.body.appendChild(fab);

    var ov = document.createElement('div');
    ov.className = 'ao-overlay'; ov.id = 'aoOverlay'; ov.onclick = togglePanel;
    document.body.appendChild(ov);

    var pn = document.createElement('div');
    pn.className = 'ao-panel'; pn.id = 'aoPanel';
    pn.innerHTML = '<div class="ao-head">' +
      '<h3><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg> ALL ORDERS <span class="ao-count" id="aoCount"></span></h3>' +
      '<button class="ao-close" id="aoClose"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button></div>' +
      '<div class="ao-body" id="aoBody"></div>' +
      '<div class="ao-foot" id="aoFoot">' +
        '<div class="ao-fr"><div><div class="ao-fl">Total SKUs</div><div class="ao-chips" id="aoChips"></div></div>' +
        '<div class="ao-ft" id="aoTotal">0</div></div>' +
        '<button class="ao-export" id="aoExport"><span class="ao-spin" id="aoSpin"></span>' +
        '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg> EXPORT TO EXCEL</button>' +
        '<button class="ao-clear" id="aoClear">\u2715 Clear All Orders</button>' +
      '</div>';
    document.body.appendChild(pn);

    document.getElementById('aoClose').onclick = togglePanel;
    document.getElementById('aoExport').onclick = doExport;
    document.getElementById('aoClear').onclick = doClear;
  }

  function togglePanel() {
    var ov = document.getElementById('aoOverlay'), pn = document.getElementById('aoPanel');
    if (!ov || !pn) return;
    var isOpen = pn.classList.contains('open');
    ov.classList.toggle('open', !isOpen);
    pn.classList.toggle('open', !isOpen);
    if (!isOpen) renderPanel();
  }

  function updateBadge() {
    var badge = document.getElementById('aoBadge');
    if (!badge) return;
    var t = getTotals();
    badge.textContent = t;
    badge.classList.toggle('vis', t > 0);
  }

  function renderPanel() {
    var body = document.getElementById('aoBody'), chips = document.getElementById('aoChips'),
        totalEl = document.getElementById('aoTotal'), foot = document.getElementById('aoFoot'),
        countEl = document.getElementById('aoCount');
    if (!body) return;

    var shared = getShared(), allCount = 0, html = '', totalQty = 0;
    var pageOrder = ['hardgoods','shoes','pedals'];

    for (var p = 0; p < pageOrder.length; p++) {
      var pg = pageOrder[p], items = shared[pg];
      if (!items || Object.keys(items).length === 0) continue;
      var entries = Object.entries(items), qtySum = 0;
      for (var e = 0; e < entries.length; e++) qtySum += (entries[e][1].qty || 0);
      allCount += entries.length;
      totalQty += qtySum;
      var color = PAGE_COLORS[pg] || '#888', label = PAGE_LABELS[pg] || pg.toUpperCase();

      html += '<div><div class="ao-sh"><span class="ao-dot" style="background:' + color + '"></span> ' +
        label + ' <span class="ao-sc">(' + entries.length + ' SKUs, ' + qtySum + ' pcs)</span></div>';

      for (var i = 0; i < entries.length; i++) {
        var code = entries[i][0], v = entries[i][1];
        var desc = [v.desc1, v.desc2].filter(Boolean).join(' \u00B7 ');
        html += '<div class="ao-row">' +
          '<span class="ao-rc">' + code + '</span>' +
          '<span class="ao-rd" title="' + desc.replace(/"/g,'&quot;') + '">' + desc + '</span>' +
          '<span class="ao-rq">\u00D7' + v.qty + '</span>' +
          '<button class="ao-rx" onclick="_aoDeleteItem(\'' + pg + '\',\'' + code.replace(/'/g,"\\'") + '\')" title="Remove">' +
            '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>' +
          '</button></div>';
      }
      html += '</div>';
    }

    if (allCount === 0) {
      body.innerHTML = '<div class="ao-empty"><svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg><span style="font-size:13px">No orders yet</span><span style="font-size:11px;opacity:.7">Add items from any catalog</span></div>';
      foot.style.display = 'none'; countEl.textContent = ''; return;
    }

    foot.style.display = '';
    body.innerHTML = html;
    totalEl.textContent = totalQty + ' pcs';
    countEl.textContent = ' \u2014 ' + allCount + ' SKUs';

    var chipHtml = '';
    for (var cp = 0; cp < pageOrder.length; cp++) {
      var cpg = pageOrder[cp], ci = shared[cpg];
      if (!ci || Object.keys(ci).length === 0) continue;
      var cq = 0, cv = Object.values(ci);
      for (var cx = 0; cx < cv.length; cx++) cq += (cv[cx].qty || 0);
      chipHtml += '<span class="ao-chip" style="background:' + PAGE_COLORS[cpg] + '22;color:' + PAGE_COLORS[cpg] + '">' + PAGE_LABELS[cpg] + ': ' + cq + '</span>';
    }
    chips.innerHTML = chipHtml;
  }

  /* ═══════════════════════════════════════════════════════
     EXPORT
     ═══════════════════════════════════════════════════════ */
  function doExport() {
    var allItems = collectAll();
    if (!allItems.length) return;
    var btn = document.getElementById('aoExport'), spin = document.getElementById('aoSpin');
    if (btn) btn.disabled = true;
    if (spin) spin.style.display = 'inline-block';
    loadSheetJS().then(function() { exportSheetJS(allItems); })
      .catch(function() { exportXML(allItems); })
      .finally(function() { if (btn) btn.disabled = false; if (spin) spin.style.display = 'none'; });
  }

  function exportSheetJS(items) {
    var X = window.XLSX, wb = X.utils.book_new();
    var rows = [['Catalog','SKU','Description 1','Description 2','QTY','Price']];
    var tq = 0;
    for (var i = 0; i < items.length; i++) {
      var it = items[i];
      rows.push([it.source, it.code, it.desc1, it.desc2, it.qty, it.price===''?'':Number(it.price)||it.price]);
      tq += it.qty;
    }
    rows.push([]); rows.push(['','','','TOTAL', tq, '']);
    var ws = X.utils.aoa_to_sheet(rows);
    ws['!cols'] = [{wch:12},{wch:20},{wch:35},{wch:30},{wch:8},{wch:12}];
    X.utils.book_append_sheet(wb, ws, 'All Orders');
    var d = new Date().toISOString().slice(0,10);
    try { X.writeFile(wb,'shimano_all_orders_'+d+'.xlsm',{bookType:'xlsm'}); }
    catch(e) { X.writeFile(wb,'shimano_all_orders_'+d+'.xlsx',{bookType:'xlsx'}); }
  }

  function exportXML(items) {
    var tq=0; for(var t=0;t<items.length;t++) tq+=items[t].qty;
    var x='<?xml version="1.0"?>\n<?mso-application progid="Excel.Sheet"?>\n'+
      '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">\n'+
      '<Styles><Style ss:ID="h"><Font ss:Bold="1" ss:Size="11"/><Interior ss:Color="#D9E1F2" ss:Pattern="Solid"/></Style>'+
      '<Style ss:ID="t"><Font ss:Bold="1" ss:Size="11"/></Style><Style ss:ID="d"><Font ss:Size="10"/></Style></Styles>\n'+
      '<Worksheet ss:Name="All Orders"><Table>\n'+
      '<Column ss:Width="80"/><Column ss:Width="130"/><Column ss:Width="220"/><Column ss:Width="200"/><Column ss:Width="55"/><Column ss:Width="80"/>\n'+
      '<Row ss:StyleID="h"><Cell><Data ss:Type="String">Catalog</Data></Cell><Cell><Data ss:Type="String">SKU</Data></Cell>'+
      '<Cell><Data ss:Type="String">Description 1</Data></Cell><Cell><Data ss:Type="String">Description 2</Data></Cell>'+
      '<Cell><Data ss:Type="String">QTY</Data></Cell><Cell><Data ss:Type="String">Price</Data></Cell></Row>\n';
    for(var i=0;i<items.length;i++){var it=items[i];
      x+='<Row ss:StyleID="d"><Cell><Data ss:Type="String">'+esc(it.source)+'</Data></Cell>'+
        '<Cell><Data ss:Type="String">'+esc(it.code)+'</Data></Cell>'+
        '<Cell><Data ss:Type="String">'+esc(it.desc1)+'</Data></Cell>'+
        '<Cell><Data ss:Type="String">'+esc(it.desc2)+'</Data></Cell>'+
        '<Cell><Data ss:Type="Number">'+it.qty+'</Data></Cell>'+
        '<Cell><Data ss:Type="'+(it.price!==''&&!isNaN(Number(it.price))?'Number':'String')+'">'+esc(String(it.price||''))+'</Data></Cell></Row>\n';
    }
    x+='<Row/><Row ss:StyleID="t"><Cell/><Cell/><Cell/><Cell><Data ss:Type="String">TOTAL</Data></Cell>'+
      '<Cell><Data ss:Type="Number">'+tq+'</Data></Cell><Cell/></Row>\n</Table></Worksheet></Workbook>';
    var b=new Blob([x],{type:'application/vnd.ms-excel'}),u=URL.createObjectURL(b),a=document.createElement('a');
    a.href=u; a.download='shimano_all_orders_'+new Date().toISOString().slice(0,10)+'.xls'; a.click();
    setTimeout(function(){URL.revokeObjectURL(u);},1000);
  }
  function esc(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}

  function doClear() {
    if (!confirm('All orders from every catalog will be cleared.\nAre you sure?')) return;

    // 1. Wipe the shared cart key
    localStorage.removeItem(SHARED_KEY);

    // 2. Wipe known page-specific localStorage keys so they
    //    cannot resurrect orders on the next page load.
    //    (Pedals keeps its own key: shimano_pedals_order)
    var PAGE_LS_KEYS = ['shimano_pedals_order'];
    for (var lk = 0; lk < PAGE_LS_KEYS.length; lk++) {
      try { localStorage.removeItem(PAGE_LS_KEYS[lk]); } catch(e){}
    }

    // 3. Empty the in-memory order objects on the current page
    if (window.orderList) { var k=Object.keys(window.orderList); for(var i=0;i<k.length;i++) delete window.orderList[k[i]]; }
    if (window.orderMap)  { var k2=Object.keys(window.orderMap);  for(var j=0;j<k2.length;j++) delete window.orderMap[k2[j]]; }

    // 4. Persist the now-empty state through the page's own save function
    if (typeof window.saveOrder === 'function') window.saveOrder();

    // 5. Reset every qty input in the DOM so stale values
    //    cannot leak back into the order on re-render or interaction
    var allInputs = document.querySelectorAll('.qty-input');
    for (var q = 0; q < allInputs.length; q++) {
      allInputs[q].value = '';
      allInputs[q].dataset.hasValue = 'false';
    }

    // 6. Refresh the page's own UI panels
    if (typeof window.updateOrderPanel === 'function') window.updateOrderPanel();
    if (typeof window.updateStats === 'function') window.updateStats();
    // Re-render catalog so inputs are rebuilt from the (now-empty) orderMap
    if (typeof window.renderCatalog === 'function') window.renderCatalog();

    // 7. Reset sync state and refresh the shared-cart UI
    _lastHash = '';
    updateBadge(); renderPanel();
  }

  window.addEventListener('storage', function(e) {
    if (e.key === SHARED_KEY) { updateBadge(); var pn=document.getElementById('aoPanel'); if(pn&&pn.classList.contains('open')) renderPanel(); }
  });

  /* ─── Restore current page's orders from shared localStorage on load ── */
  function restorePageFromShared() {
    var pid = getPageId();
    if (pid === 'unknown') return;
    var shared = getShared();
    var saved = shared[pid];
    if (!saved || Object.keys(saved).length === 0) return;

    var codes = Object.keys(saved);

    // HARDGOODS: uses window.orderList + setQty()
    if (pid === 'hardgoods' && window.orderList && typeof window.orderList === 'object') {
      if (Object.keys(window.orderList).length > 0) return; // page already has live orders, don't overwrite
      for (var i = 0; i < codes.length; i++) {
        var c = codes[i], v = saved[c];
        window.orderList[c] = { qty: v.qty||0, desc: v.desc1||c, desc2: v.desc2||'' };
        // Also update the qty input fields in the DOM
        var inputs = document.querySelectorAll('.qty-input[data-code="' + c + '"]');
        for (var k = 0; k < inputs.length; k++) {
          inputs[k].value = v.qty;
          inputs[k].dataset.hasValue = 'true';
        }
      }
      if (typeof window.updateOrderPanel === 'function') window.updateOrderPanel();
    }

    // SHOES: uses window.orderMap (no own localStorage)
    if (pid === 'shoes' && window.orderMap && typeof window.orderMap === 'object') {
      if (Object.keys(window.orderMap).length > 0) return;
      for (var j = 0; j < codes.length; j++) {
        var c2 = codes[j], v2 = saved[c2];
        window.orderMap[c2] = { qty: v2.qty||0, desc1: v2.desc1||'', desc2: v2.desc2||'', price: v2.price||'' };
        var inputs2 = document.querySelectorAll('.qty-input[data-code="' + c2 + '"]');
        for (var m = 0; m < inputs2.length; m++) {
          inputs2[m].value = v2.qty;
          inputs2[m].dataset.hasValue = 'true';
        }
      }
      if (typeof window.updateOrderPanel === 'function') window.updateOrderPanel();
      if (typeof window.updateStats === 'function') window.updateStats();
    }

    // PEDALS: already has its own localStorage persistence (shimano_pedals_order),
    // but if that key is empty and shared cart has data, restore from shared
    if (pid === 'pedals' && window.orderMap && typeof window.orderMap === 'object') {
      if (Object.keys(window.orderMap).length > 0) return;
      for (var n = 0; n < codes.length; n++) {
        var c3 = codes[n], v3 = saved[c3];
        window.orderMap[c3] = { qty: v3.qty||0, desc1: v3.desc1||'', desc2: v3.desc2||'', price: v3.price||'' };
        var inputs3 = document.querySelectorAll('.qty-input[data-code="' + c3 + '"]');
        for (var p = 0; p < inputs3.length; p++) {
          inputs3[p].value = v3.qty;
          inputs3[p].dataset.hasValue = 'true';
        }
      }
      if (typeof window.saveOrder === 'function') window.saveOrder();
      if (typeof window.updateOrderPanel === 'function') window.updateOrderPanel();
      if (typeof window.updateStats === 'function') window.updateStats();
    }
  }

  function startPolling() { syncToShared(); setInterval(syncToShared, POLL_MS); }

  function init() {
    var oldFab = document.querySelector('.sc-fab'); if(oldFab) oldFab.remove();
    var oldOv = document.getElementById('scOverlay'); if(oldOv) oldOv.remove();
    var oldPn = document.getElementById('scPanel'); if(oldPn) oldPn.remove();
    getPageId(); // initialize PAGE_ID now that body exists
    injectUI();
    setTimeout(function() {
      restorePageFromShared();
      _restored = true;
      startPolling();
    }, 350);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else setTimeout(init, 150);
})();
