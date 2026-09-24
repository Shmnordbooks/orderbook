
/* ═══════════════════════════════════════════════════════════════════════
   N/A GUARD — items marked N/A (unavailable) cannot be added to the order.
   Self-contained: wraps each catalog's own quantity functions after the page
   has loaded; if anything goes wrong it switches itself off silently.
   ═══════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  var NA_MSG = ' is not available and cannot be added to the order.';
  var naMap = null;          // code → true (N/A) / false (orderable)

  function isNAValue(o) {
    var s = String(o.status != null ? o.status : (o.st != null ? o.st : '')).trim().toLowerCase();
    if (s === 'unavailable' || s === 'unavail' || s === 'n/a' || s === 'na' || s === 'u') return true;
    if (o.status == null && o.st == null && String(o.etd || '').toLowerCase() === 'unavail') return true; // Lazer
    return false;
  }
  function codeOf(o) {
    var c = o.code != null ? o.code : (o.sku != null ? o.sku : o.s);
    return typeof c === 'string' ? c.trim().toUpperCase() : '';
  }
  function walk(node, depth) {
    if (!node || typeof node !== 'object' || depth > 8) return;
    if (Array.isArray(node)) { for (var i = 0; i < node.length; i++) walk(node[i], depth + 1); return; }
    var c = codeOf(node);
    if (c && (node.status != null || node.st != null || node.etd != null)) {
      var na = isNAValue(node);
      // Blocked only if EVERY occurrence of the code is N/A
      naMap[c] = (c in naMap) ? (naMap[c] && na) : na;
    }
    for (var k in node) if (Object.prototype.hasOwnProperty.call(node, k) && node[k] && typeof node[k] === 'object') walk(node[k], depth + 1);
  }
  function buildMap() {
    naMap = {};
    var srcs = [];
    try { srcs.push(CATALOG); } catch (e) {}
    try { srcs.push(GROUPSETS); } catch (e) {}
    try { srcs.push(SHOE_DATA); } catch (e) {}
    try { srcs.push(PEDAL_DATA); } catch (e) {}
    try { srcs.push(EYEWEAR_DATA); } catch (e) {}
    try { srcs.push(PRO_DATA); } catch (e) {}
    try { srcs.push(RAW); } catch (e) {}
    try { srcs.push(HARDGOODS_DATA); } catch (e) {}
    for (var i = 0; i < srcs.length; i++) walk(srcs[i], 0);
  }
  function isNA(code) {
    if (!code) return false;
    if (!naMap) buildMap();
    return naMap[String(code).trim().toUpperCase()] === true;
  }

  // ── Warning toast (own styling so it looks the same on every page) ──
  var toastEl = null, toastTimer = null;
  function warn(text) {
    if (!toastEl) {
      toastEl = document.createElement('div');
      toastEl.setAttribute('role', 'alert');
      toastEl.style.cssText = 'position:fixed;left:50%;bottom:28px;transform:translateX(-50%);z-index:2147483647;' +
        'max-width:min(92vw,520px);padding:12px 18px;border-radius:10px;background:#2a1215;color:#ffd7dc;' +
        'border:1px solid #e5484d;box-shadow:0 8px 28px rgba(0,0,0,.45);font:600 13px/1.45 system-ui,-apple-system,Segoe UI,sans-serif;' +
        'letter-spacing:.01em;text-align:center;transition:opacity .25s;opacity:0;pointer-events:none';
      document.body.appendChild(toastEl);
    }
    toastEl.textContent = '⛔  ' + text;
    toastEl.style.opacity = '1';
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.style.opacity = '0'; }, 3200);
  }
  function clearInputs(code) {
    var sel = '[data-code="' + code + '"],[data-sku="' + code + '"],#q-' + (window.CSS && CSS.escape ? CSS.escape(code) : code);
    var els; try { els = document.querySelectorAll(sel); } catch (e) { return; }
    for (var i = 0; i < els.length; i++) {
      if (els[i].tagName === 'INPUT') { els[i].value = ''; els[i].dataset.hasValue = 'false'; if (els[i].classList) els[i].classList.remove('has-val'); }
    }
  }
  function block(code) { clearInputs(code); warn(code + NA_MSG); }

  // ── Wrap the page's own quantity functions ──
  function wrap(name, getCode, getQty, onlyIf) {
    var orig = window[name];
    if (typeof orig !== 'function' || orig.__naGuard) return;
    if (onlyIf && !onlyIf(orig)) return;
    var w = function () {
      try {
        var code = getCode.apply(null, arguments);
        var qty = getQty.apply(null, arguments);
        if (qty > 0 && isNA(code)) { block(code); return; }
      } catch (e) { /* never break ordering because of the guard */ }
      return orig.apply(this, arguments);
    };
    w.__naGuard = true;
    window[name] = w;
  }
  var num = function (v) { var n = parseInt(v, 10); return isNaN(n) ? 0 : n; };

  function install() {
    // Hardgoods: setQty(code, desc, value) and Order Summary edits
    wrap('setQty', function (c) { return c; }, function (c, d, v) { return num(v); });
    wrap('updateQtyFromSummary', function (c) { return c; }, function (c, v) { return num(v); });
    // Shoes / Pedals / PRO / Eyewear: updateQty(input)
    wrap('updateQty', function (inp) { return inp && inp.dataset ? inp.dataset.code : ''; },
                      function (inp) { return inp ? num(inp.value) : 0; });
    // Lazer: handleQty(input), adjQ(sku, +/-1), toggle(sku, model, variant, price, desc)
    wrap('handleQty', function (inp) { return inp && inp.dataset ? inp.dataset.sku : ''; },
                      function (inp) { return inp ? num(inp.value) : 0; });
    wrap('adjQ', function (sku) { return sku; }, function (sku, d) { return d > 0 ? 1 : 0; });
    wrap('toggle', function (sku) { return sku; },
         function (sku) { try { return oMap[sku] ? 0 : 1; } catch (e) { return 0; } },
         function (fn) { return fn.length === 5; });
  }

  // ── Remove N/A items that were already in this page's order ──
  function purgeExisting() {
    var map = null, removed = [];
    try { if (typeof orderList === 'object' && orderList) map = orderList; } catch (e) {}
    try { if (!map && typeof orderMap === 'object' && orderMap) map = orderMap; } catch (e) {}
    try { if (!map && typeof oMap === 'object' && oMap) map = oMap; } catch (e) {}
    if (!map) return;
    Object.keys(map).forEach(function (code) {
      if (isNA(code)) { delete map[code]; clearInputs(code); removed.push(code); }
    });
    if (!removed.length) return;
    ['updateOrderPanel', 'updateStats', 'saveOrder', 'sync', 'updB', 'updateSummaryChip'].forEach(function (f) {
      try { if (typeof window[f] === 'function') window[f](); } catch (e) {}
    });
    warn(removed.length === 1
      ? removed[0] + ' is no longer available and was removed from your order.'
      : removed.length + ' items are no longer available and were removed from your order: ' + removed.slice(0, 6).join(', ') + (removed.length > 6 ? '…' : ''));
  }

  function start() {
    try { install(); } catch (e) {}
    // shared-cart restores the saved order ~350 ms after load; clean up after that
    setTimeout(function () { try { purgeExisting(); } catch (e) {} }, 1200);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
