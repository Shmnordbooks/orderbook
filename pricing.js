/* ═══════════════════════════════════════════════════════════════
   SHIMANO PRICING — dealer list price, SRP, campaigns, minimum order
   Data: prices-data.js (window.SHIMANO_PRICES), written daily by
   tools/build_prices.py. Shared by all catalog pages, the cart panel
   (shared-cart.js) and the Excel export (order-export.js).
   Rules: campaign prices apply to IN-STOCK items only; ETD items keep
   the list price. Minimum order counts in-stock value only.
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  var D = window.SHIMANO_PRICES;
  if (!D || !D.items) return;

  var MIN = Number(D.minOrder) || 7500;
  var CAMP = {};
  (D.campaigns || []).forEach(function (c) { CAMP[c.id] = c; });

  function eur(n) {
    return '€' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  function normStatus(s) {
    s = String(s || '').toLowerCase();
    if (s === 'available' || s === 'a' || s === 'avail') return 'available';
    if (s === 'etd' || s === 'e' || /^\d{8}$/.test(s)) return 'etd';
    if (!s) return '';
    return 'unavailable';
  }
  var FLAG = { 1: 'available', 2: 'etd', 0: 'unavailable' };

  /* Price for one SKU. statusHint (from the page) wins over the daily flag. */
  function info(code, statusHint) {
    var r = D.items[String(code || '').trim()];
    if (!r) return null;
    var status = normStatus(statusHint) || FLAG[r[2]] || 'unavailable';
    var out = { list: r[0], srp: r[1], net: r[0], status: status, campaign: null };
    if (r.length > 4 && status === 'available' && CAMP[r[3]]) {
      out.net = r[4];
      out.campaign = CAMP[r[3]];
    }
    return out;
  }

  /* Cart totals: items = [{code, qty, ...}] */
  function totals(items) {
    var t = { available: 0, etd: 0, other: 0, noPrice: 0, savings: 0 };
    items.forEach(function (it) {
      var q = Number(it.qty) || 0, p = info(it.code);
      if (!q) return;
      if (!p) { t.noPrice += q; return; }
      var line = p.net * q;
      if (p.status === 'available') t.available += line;
      else if (p.status === 'etd') t.etd += line;
      else t.other += line;
      if (p.campaign) t.savings += (p.list - p.net) * q;
    });
    t.grand = t.available + t.etd + t.other;
    t.min = MIN;
    t.missing = Math.max(0, MIN - t.available);
    t.ok = t.available >= MIN;
    return t;
  }

  /* English dealer-facing note — same text in panel and Excel */
  function minOrderNote(t) {
    var M = '\u20ac' + Number(t.min).toLocaleString('en-US', { maximumFractionDigits: 0 });
    if (t.ok) {
      return { ok: true, text: 'Your available items total ' + eur(t.available) + ' and meet the ' + M +
        ' minimum.' + (t.etd > 0 ? ' ETD items (' + eur(t.etd) + ') will be shipped when they become available.' : '') };
    }
    if (t.grand >= t.min) {
      return { ok: false, text: 'Your total order value is ' + eur(t.grand) + ', but the shippable (available) value is ' +
        eur(t.available) + ', below the ' + M + ' minimum. Please add ' + eur(t.missing) +
        ' more in available items to qualify for shipment.' };
    }
    return { ok: false, text: 'Your order total is ' + eur(t.grand) + ', below the ' + M +
      ' minimum order value. Please add ' + eur(t.missing) + ' more in available items to qualify for shipment.' };
  }

  /* HTML block for the cart panel footer */
  function panelHTML(items) {
    var t = totals(items), pct = Math.min(100, t.available / t.min * 100), n = minOrderNote(t);
    return '<div class="pp-sum">' +
      '<div class="pp-sum-row"><span>Available</span><b>' + eur(t.available) + '</b></div>' +
      (t.etd > 0 ? '<div class="pp-sum-row pp-muted"><span>ETD (backorder)</span><b>' + eur(t.etd) + '</b></div>' : '') +
      '<div class="pp-sum-row pp-grand"><span>Order total</span><b>' + eur(t.grand) + '</b></div>' +
      (t.savings > 0 ? '<div class="pp-sum-row pp-save"><span>Campaign savings (included)</span><b>' + eur(t.savings) + '</b></div>' : '') +
      '<div class="pp-bar"><i style="width:' + pct.toFixed(1) + '%" class="' + (t.ok ? 'ok' : '') + '"></i></div>' +
      '<div class="pp-note ' + (t.ok ? 'ok' : 'warn') + '">' + n.text + '</div>' +
      (t.noPrice > 0 ? '<div class="pp-note pp-muted">' + t.noPrice + ' pcs without a list price (price on request) are not included.</div>' : '') +
      '</div>';
  }

  /* ─── Catalog rows ─────────────────────────────────────── */
  var css = document.createElement('style');
  css.textContent =
    '.pp-price{display:flex;flex-direction:column;align-items:flex-end;justify-content:center;line-height:1.15;' +
    'font-family:"Barlow Condensed",Arial,sans-serif;white-space:nowrap}' +
    '.pp-line{display:flex;flex-direction:row;align-items:baseline;flex-wrap:wrap;gap:0 6px;margin-top:2px;line-height:1.2}' +
    '.pp-net{font-size:14px;font-weight:700;color:var(--text,#e8e8f0)}' +
    '.pp-line .pp-net{font-size:13px}' +
    '.pp-net.pp-deal{color:#00c896}' +
    '.pp-old{font-size:11px;color:var(--text-muted,#6b6b82);text-decoration:line-through}' +
    '.pp-srp{font-size:10px;color:var(--text-muted,#6b6b82);letter-spacing:.02em}' +
    '.pp-tag{font-size:9px;font-weight:700;letter-spacing:.06em;color:#fff;background:#e8003d;border-radius:3px;padding:1px 5px;margin-bottom:2px}' +
    '.pp-line .pp-tag{margin-bottom:0;align-self:center}' +
    '.pp-na{font-size:10px;color:var(--text-muted,#6b6b82);font-style:italic}' +
    'td.pp-td{text-align:right;padding-right:10px}' +
    '.pp-sum{margin:0 0 12px;font-family:"Barlow Condensed",Arial,sans-serif}' +
    '.pp-sum-row{display:flex;justify-content:space-between;font-size:13px;color:var(--text,#e8e8f0);padding:1px 0}' +
    '.pp-sum-row.pp-muted,.pp-note.pp-muted{color:var(--text-muted,#6b6b82)}' +
    '.pp-sum-row.pp-save b{color:#00c896}' +
    '.pp-sum-row.pp-grand{font-size:16px;border-top:1px solid var(--border,#1e1e2e);margin-top:4px;padding-top:4px}' +
    '.pp-bar{height:6px;border-radius:3px;background:rgba(255,255,255,.08);margin:8px 0 6px;overflow:hidden}' +
    '.pp-bar i{display:block;height:100%;background:#f59e0b;border-radius:3px}.pp-bar i.ok{background:#00c896}' +
    '.pp-note{font-family:Barlow,Arial,sans-serif;font-size:11px;line-height:1.4;padding:6px 8px;border-radius:6px;margin-top:4px}' +
    '.pp-note.warn{background:rgba(245,158,11,.12);color:#f5b544}.pp-note.ok{background:rgba(0,200,150,.1);color:#00c896}' +
    '.ao-row.pp-ao{grid-template-columns:96px 1fr 34px 66px 22px !important}' +
    '.pp-ao-p{font-family:"Barlow Condensed",Arial,sans-serif;font-size:12px;text-align:right;color:var(--text,#e8e8f0)}' +
    '.pp-ao-p.etd{color:var(--text-muted,#6b6b82)}' +
    '@media(max-width:768px){.pp-price{min-width:52px}.pp-net{font-size:12px}.pp-srp{font-size:9px}' +
    '.ao-row.pp-ao{grid-template-columns:76px 1fr 28px 58px 20px !important}}';
  (document.head || document.documentElement).appendChild(css);

  function rowStatus(input, row) {
    if (input.dataset.status) return input.dataset.status;
    var b = row && row.querySelector('.badge');
    if (b) {
      if (b.classList.contains('avail')) return 'available';
      if (b.classList.contains('etd')) return 'etd';
      if (b.classList.contains('unavail')) return 'unavailable';
    }
    return '';
  }

  function priceHTML(p) {
    if (!p) return '<span class="pp-na">Price on request</span>';
    var h = '';
    if (p.campaign) {
      h += '<span class="pp-tag">' + p.campaign.label + '</span>' +
        '<span class="pp-old">' + eur(p.list) + '</span>' +
        '<span class="pp-net pp-deal">' + eur(p.net) + '</span>';
    } else {
      h += '<span class="pp-net">' + eur(p.list) + '</span>';
    }
    if (p.srp) h += '<span class="pp-srp">SRP ' + eur(p.srp) + '</span>';
    return h;
  }

  function decorate(input) {
    var code = input.dataset.code || input.dataset.sku;
    if (!code) return;
    var row = input.closest('tr') || input.closest('.item-row');
    if (!row) return;
    var st = rowStatus(input, row), key = code + '|' + st;
    if (input.dataset.ppKey === key && row.querySelector('.pp-price, .pp-line')) return;
    input.dataset.ppKey = key;
    var p = info(code, st);
    // never show prices on items that cannot be ordered
    var html = normStatus(st) === 'unavailable' ? '' : priceHTML(p);
    var box = row.querySelector('.pp-price, .pp-line');
    if (!box) {
      box = document.createElement('span');
      box.className = 'pp-price';
      if (row.tagName === 'TR') {
        var td = document.createElement('td');
        td.className = 'pp-td';
        td.appendChild(box);
        var cell = input.closest('td');
        row.insertBefore(td, cell);
        addHeader(row);
      } else {
        // card rows: price goes under the item code, so the code is never squeezed
        box.className = 'pp-line';
        var infoEl = row.querySelector('.item-info');
        if (infoEl) infoEl.appendChild(box); else row.insertBefore(box, row.firstChild);
      }
    }
    box.innerHTML = html;
  }

  function addHeader(tr) {
    var table = tr.closest('table');
    if (!table || table.querySelector('th.pp-th')) return;
    var hr = table.querySelector('thead tr');
    if (!hr) return;
    var ths = hr.querySelectorAll('th');
    var th = document.createElement('th');
    th.className = 'pp-th';
    th.textContent = 'Price (EUR)';
    th.style.textAlign = 'right';
    hr.insertBefore(th, ths[ths.length - 1]);
  }

  var pending = false;
  function scan() {
    pending = false;
    var ins = document.querySelectorAll('input.qty-input[data-code], input.qty-input[data-sku]');
    for (var i = 0; i < ins.length; i++) decorate(ins[i]);
  }
  function schedule() {
    if (pending) return;
    pending = true;
    (window.requestAnimationFrame || setTimeout)(scan);
  }

  function start() {
    scan();
    new MutationObserver(schedule).observe(document.body, { childList: true, subtree: true });
  }
  if (document.body) start(); else document.addEventListener('DOMContentLoaded', start);

  /* Page-level "Export" buttons → the one cross-catalog export with prices */
  function unifyExport() {
    if (typeof window._aoDoExport === 'function') window.exportOrder = window._aoDoExport;
  }
  window.addEventListener('load', function () { unifyExport(); setTimeout(unifyExport, 1500); });

  window.ShimanoPricing = { info: info, totals: totals, minOrderNote: minOrderNote, panelHTML: panelHTML, eur: eur,
    generated: D.generated, minOrder: MIN };
})();
