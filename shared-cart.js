// ============================================================================
// SHARED CART — Cross-page cart sync via localStorage
// Loaded at the bottom of hardgoods.html, shoes.html, pedals.html
// ============================================================================
(function() {
  var CART_KEY = 'shimano_shared_cart';
  var PAGE_KEY = location.pathname.split('/').pop().replace('.html','') || 'unknown';

  // Detect which page we're on and get the local order object
  function getLocalOrder() {
    if (typeof orderList !== 'undefined') return orderList;   // hardgoods
    if (typeof orderMap  !== 'undefined') return orderMap;    // shoes, pedals
    return {};
  }

  // Normalize an entry to {qty, desc, desc2, status, etd, source}
  function normalize(code, entry, source) {
    if (typeof entry === 'number') return { qty: entry, desc: code, desc2: '', status: '', etd: '', source: source };
    return {
      qty:    entry.qty    || 0,
      desc:   entry.desc   || entry.desc1 || code,
      desc2:  entry.desc2  || '',
      status: entry.status || '',
      etd:    entry.etd    || '',
      price:  entry.price  || 0,
      source: source
    };
  }

  // Write the current page's order into the shared cart (merge, not overwrite)
  function syncToSharedCart() {
    var cart = {};
    try { var s = localStorage.getItem(CART_KEY); if (s) cart = JSON.parse(s); } catch(e) {}

    // Remove items previously written by THIS page
    Object.keys(cart).forEach(function(k) {
      if (cart[k] && cart[k].source === PAGE_KEY) delete cart[k];
    });

    // Write current page's items
    var local = getLocalOrder();
    Object.keys(local).forEach(function(code) {
      var entry = local[code];
      var qty = typeof entry === 'object' ? (entry.qty || 0) : (parseInt(entry) || 0);
      if (qty > 0) {
        cart[code] = normalize(code, entry, PAGE_KEY);
      }
    });

    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  }

  // Read the full shared cart (all pages combined)
  window.getSharedCart = function() {
    try {
      var s = localStorage.getItem(CART_KEY);
      return s ? JSON.parse(s) : {};
    } catch(e) { return {}; }
  };

  // Clear shared cart entries for current page
  window.clearSharedCartPage = function() {
    var cart = window.getSharedCart();
    Object.keys(cart).forEach(function(k) {
      if (cart[k] && cart[k].source === PAGE_KEY) delete cart[k];
    });
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  };

  // Clear entire shared cart
  window.clearSharedCartAll = function() {
    localStorage.removeItem(CART_KEY);
  };

  // Count items in the shared cart
  window.getSharedCartCount = function() {
    return Object.keys(window.getSharedCart()).length;
  };

  // Hook into existing functions to auto-sync after any change
  // We patch updateOrderPanel (exists in all 3 pages)
  var origUOP = window.updateOrderPanel;
  if (typeof origUOP === 'function') {
    window.updateOrderPanel = function() {
      origUOP.apply(this, arguments);
      syncToSharedCart();
      updateSharedBadge();
    };
  }

  // Also sync on any setQty / updateQty call
  var origSetQty = window.setQty;
  if (typeof origSetQty === 'function') {
    window.setQty = function() {
      origSetQty.apply(this, arguments);
      syncToSharedCart();
      updateSharedBadge();
    };
  }
  var origUpdateQty = window.updateQty;
  if (typeof origUpdateQty === 'function') {
    window.updateQty = function() {
      origUpdateQty.apply(this, arguments);
      syncToSharedCart();
      updateSharedBadge();
    };
  }

  // Also sync when clearOrder/clearAllOrders is called
  var origClearOrder = window.clearOrder;
  if (typeof origClearOrder === 'function') {
    window.clearOrder = function() {
      origClearOrder.apply(this, arguments);
      window.clearSharedCartPage();
      updateSharedBadge();
    };
  }
  var origClearAll = window.clearAllOrders;
  if (typeof origClearAll === 'function') {
    window.clearAllOrders = function() {
      origClearAll.apply(this, arguments);
      window.clearSharedCartPage();
      updateSharedBadge();
    };
  }

  // ── Badge updater for Order Summary sidebar link ──
  function updateSharedBadge() {
    var badge = document.getElementById('sharedCartBadge');
    if (!badge) return;
    var count = window.getSharedCartCount();
    badge.textContent = count;
    badge.style.display = count > 0 ? 'inline-flex' : 'none';
  }

  // ── Inject Order Summary button into sidebar (pinned after Main Page) ──
  function injectOrderSummaryLink() {
    var sidebar = document.querySelector('.sidebar, #sidebar, nav.sidebar, aside.sidebar');
    if (!sidebar) return;

    // Find the Main Page link/button
    var mainPageEl = null;
    var allChips = sidebar.querySelectorAll('.cat-chip, a.cat-chip, button.cat-chip');
    for (var i = 0; i < allChips.length; i++) {
      if (allChips[i].textContent.trim().toLowerCase().indexOf('main page') !== -1) {
        mainPageEl = allChips[i];
        break;
      }
    }

    // Also check coverChip (hardgoods builds it dynamically)
    if (!mainPageEl) mainPageEl = document.getElementById('coverChip');

    if (!mainPageEl) return; // Can't find main page link

    // Don't inject twice
    if (document.getElementById('sharedOrderSummaryBtn')) return;

    // Create separator
    var sep = document.createElement('div');
    sep.className = 'sidebar-sep';
    sep.style.margin = '4px 16px';

    // Create Order Summary button
    var btn = document.createElement('a');
    btn.id = 'sharedOrderSummaryBtn';
    btn.href = 'hardgoods.html#openOrderSummary';
    btn.className = 'cat-chip';
    btn.style.cssText = 'margin:2px 8px;width:calc(100% - 16px);text-decoration:none;border-left:3px solid #0082CA;color:#0082CA;font-weight:800;background:rgba(0,130,202,0.08);';
    btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" style="width:14px;height:14px;flex-shrink:0;opacity:0.8"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg> Order Summary <span class="order-chip-badge" id="sharedCartBadge" style="display:none;background:#0082CA;color:white;font-family:Barlow Condensed,sans-serif;font-size:10px;font-weight:800;border-radius:10px;padding:1px 6px;min-width:18px;line-height:1.4;margin-left:auto;text-align:center;">0</span>';

    // On hardgoods page, open the summary page directly instead of navigating
    if (PAGE_KEY === 'hardgoods' || PAGE_KEY === 'shimano_catalog_') {
      btn.href = '#';
      btn.onclick = function(e) {
        e.preventDefault();
        if (typeof openSummaryPage === 'function') openSummaryPage();
      };
    }

    // Insert: after mainPageEl
    var nextEl = mainPageEl.nextElementSibling;
    if (nextEl) {
      sidebar.insertBefore(sep, nextEl);
      sidebar.insertBefore(btn, nextEl);
    } else {
      sidebar.appendChild(sep);
      sidebar.appendChild(btn);
    }

    // If hardgoods page and catFilters is the container, insert there instead
    var catFilters = document.getElementById('catFilters');
    if (catFilters && catFilters.contains(mainPageEl)) {
      var nextInCF = mainPageEl.nextElementSibling;
      if (nextInCF) {
        catFilters.insertBefore(sep, nextInCF);
        catFilters.insertBefore(btn, nextInCF);
      } else {
        catFilters.appendChild(sep);
        catFilters.appendChild(btn);
      }
    }

    updateSharedBadge();
  }

  // ── Patch renderSummaryPage on hardgoods to use shared cart ──
  function patchRenderSummary() {
    if (typeof renderSummaryPage !== 'function') return;
    if (typeof CATALOG === 'undefined' && typeof GROUPSETS === 'undefined') return;

    window._origRenderSummaryPage = window.renderSummaryPage;
    window.renderSummaryPage = function() {
      var cart = window.getSharedCart();
      var keys = Object.keys(cart);
      var statsEl = document.getElementById('osSummaryStats');
      var contentEl = document.getElementById('osSummaryContent');

      if (!statsEl || !contentEl) return;

      if (keys.length === 0) {
        statsEl.style.display = 'none';
        contentEl.innerHTML = '<div class="os-empty"><div class="os-empty-icon">\uD83D\uDED2</div><h3>Your order list is empty</h3><p>Add items from Hardgoods, Shoes, or Pedals catalogs.</p></div>';
        return;
      }

      statsEl.style.display = 'flex';

      // Group by source page
      var bySource = {};
      var totalSkus = 0, totalQty = 0;
      keys.forEach(function(code) {
        var item = cart[code];
        var src = item.source || 'other';
        var label = src === 'hardgoods' || src === 'shimano_catalog_' ? 'HARDGOODS' : src.toUpperCase();
        if (!bySource[label]) bySource[label] = [];
        bySource[label].push({ code: code, qty: item.qty, desc: item.desc || code, desc2: item.desc2 || '', status: item.status || '', etd: item.etd || '' });
        totalSkus++;
        totalQty += (item.qty || 0);
      });

      // Count by status
      var availCount = 0, etdCount = 0, unavailCount = 0;
      keys.forEach(function(code) {
        var s = cart[code].status || '';
        if (s === 'available') availCount++;
        else if (s === 'etd') etdCount++;
        else if (s === 'unavailable') unavailCount++;
      });

      statsEl.innerHTML =
        '<div class="os-stat"><div class="os-stat-val accent">' + totalSkus + '</div><div class="os-stat-label">Total SKUs</div></div>' +
        '<div class="os-stat-divider"></div>' +
        '<div class="os-stat"><div class="os-stat-val">' + totalQty + '</div><div class="os-stat-label">Total Units</div></div>' +
        '<div class="os-stat-divider"></div>' +
        '<div class="os-stat"><div class="os-stat-val avail">' + availCount + '</div><div class="os-stat-label">In Stock</div></div>' +
        '<div class="os-stat"><div class="os-stat-val etd">' + etdCount + '</div><div class="os-stat-label">ETD Items</div></div>' +
        (unavailCount > 0 ? '<div class="os-stat"><div class="os-stat-val" style="color:var(--unavail)">' + unavailCount + '</div><div class="os-stat-label">Unavailable</div></div>' : '') +
        '<div class="os-stat-divider"></div>' +
        '<div class="os-stat"><div class="os-stat-val" style="font-size:14px;padding-top:4px;color:var(--text-muted)">March 2026</div><div class="os-stat-label">Order Date</div></div>';

      // Table
      var html = '';
      var sourceOrder = ['HARDGOODS', 'SHOES', 'PEDALS'];
      sourceOrder.forEach(function(srcLabel) {
        var items = bySource[srcLabel];
        if (!items || !items.length) return;
        html += '<div class="os-table-wrap" style="margin-bottom:20px;">';
        html += '<div class="os-cat-header" style="background:rgba(0,130,202,0.06);font-size:13px;font-weight:800;letter-spacing:0.12em;">' + srcLabel + '<span class="os-cat-count">' + items.length + ' item' + (items.length > 1 ? 's' : '') + '</span></div>';
        items.forEach(function(item) {
          var badge = '';
          if (item.status === 'available') badge = '<span class="badge avail"><span class="badge-dot"></span>Available</span>';
          else if (item.status === 'etd') badge = '<span class="badge etd"><span class="badge-dot"></span>' + (item.etd || 'ETD') + '</span>';
          else if (item.status === 'unavailable') badge = '<span class="badge unavail"><span class="badge-dot"></span>N/A</span>';
          html += '<div class="os-row">' +
            '<div class="os-row-code">' + item.code + '</div>' +
            '<div class="os-row-desc">' + (item.desc || '\u2014') + '</div>' +
            '<div class="os-row-model">' + (item.desc2 || '') + '</div>' +
            '<div>' + badge + '</div>' +
            '<div style="text-align:center"><span class="os-row-qty">' + item.qty + '</span></div>' +
            '<div style="text-align:center"><button class="os-row-remove" onclick="removeFromSharedCart(\'' + item.code + '\')" title="Remove">\u2715</button></div>' +
          '</div>';
        });
        html += '</div>';
      });
      // Any remaining sources
      Object.keys(bySource).forEach(function(srcLabel) {
        if (sourceOrder.indexOf(srcLabel) !== -1) return;
        var items = bySource[srcLabel];
        if (!items || !items.length) return;
        html += '<div class="os-table-wrap" style="margin-bottom:20px;">';
        html += '<div class="os-cat-header">' + srcLabel + '<span class="os-cat-count">' + items.length + ' item' + (items.length > 1 ? 's' : '') + '</span></div>';
        items.forEach(function(item) {
          html += '<div class="os-row">' +
            '<div class="os-row-code">' + item.code + '</div>' +
            '<div class="os-row-desc">' + (item.desc || '\u2014') + '</div>' +
            '<div class="os-row-model">' + (item.desc2 || '') + '</div>' +
            '<div></div>' +
            '<div style="text-align:center"><span class="os-row-qty">' + item.qty + '</span></div>' +
            '<div style="text-align:center"><button class="os-row-remove" onclick="removeFromSharedCart(\'' + item.code + '\')" title="Remove">\u2715</button></div>' +
          '</div>';
        });
        html += '</div>';
      });
      contentEl.innerHTML = html;
    };
  }

  // Remove from shared cart (called from summary page)
  window.removeFromSharedCart = function(code) {
    var cart = window.getSharedCart();
    delete cart[code];
    localStorage.setItem(CART_KEY, JSON.stringify(cart));

    // Also remove from local order if on same page
    if (typeof orderList !== 'undefined' && orderList[code]) {
      delete orderList[code];
      document.querySelectorAll('.qty-input[data-code="' + code + '"]').forEach(function(el) { el.value = ''; el.dataset.hasValue = 'false'; });
      if (typeof updateOrderPanel === 'function') origUOP.call(window);
      if (typeof updateSummaryChip === 'function') updateSummaryChip();
    }
    if (typeof orderMap !== 'undefined' && orderMap[code]) {
      delete orderMap[code];
      document.querySelectorAll('.qty-input[data-code="' + code + '"]').forEach(function(el) { el.value = ''; el.dataset.hasValue = 'false'; });
      if (typeof updateOrderPanel === 'function') origUOP.call(window);
    }

    updateSharedBadge();
    if (typeof renderSummaryPage === 'function') renderSummaryPage();
  };

  // ── Auto-open Order Summary if hash says so ──
  function checkHashForSummary() {
    if (location.hash === '#openOrderSummary') {
      history.replaceState(null, '', location.pathname + location.search);
      setTimeout(function() {
        if (typeof openSummaryPage === 'function') openSummaryPage();
      }, 300);
    }
  }

  // ── Initial sync on page load ──
  syncToSharedCart();

  // Wait for DOM ready then inject
  function init() {
    injectOrderSummaryLink();
    patchRenderSummary();
    updateSharedBadge();
    checkHashForSummary();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    // Small delay to let page scripts finish building sidebar
    setTimeout(init, 200);
  }

  // Also re-inject after sidebar might be built dynamically (hardgoods)
  setTimeout(function() {
    injectOrderSummaryLink();
    patchRenderSummary();
    updateSharedBadge();
  }, 800);
})();
