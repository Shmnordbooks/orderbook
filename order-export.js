/* ═══════════════════════════════════════════════════════════════
   SHIMANO ORDER EXPORT — one Excel export for every catalog
   window.ShimanoOrderExport(items, dealerName) -> Promise
   items: [{source, catalog, code, desc1, desc2, qty}]
   Adds status, list / campaign / net prices, line totals, SRP excl. VAT,
   in-stock vs ETD totals and the minimum-order note (pricing.js).
   Never blocks: the file always downloads; the note tells the dealer
   whether the shippable value meets the minimum.
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  var STYLE_URL = 'https://cdn.jsdelivr.net/npm/xlsx-js-style@1.2.0/dist/xlsx.bundle.js';
  var X = null;

  function inject(url) {
    return new Promise(function (res, rej) {
      var s = document.createElement('script');
      s.src = url; s.onload = res; s.onerror = rej;
      document.head.appendChild(s);
    });
  }
  function loadXLSX() {
    if (X) return Promise.resolve();
    var prev = window.XLSX;  // keep the page's own SheetJS untouched
    return inject(STYLE_URL).then(function () { X = window.XLSX; if (prev) window.XLSX = prev; });
  }
  function loadInfo() {
    if (window.SHIMANO_PRODUCT_INFO) return Promise.resolve();
    return inject('product-info.js?v=' + Date.now()).catch(function () {});
  }
  function infoFor(code) {
    var db = window.SHIMANO_PRODUCT_INFO || {};
    var r = db[String(code || '').trim().toUpperCase().replace(/^\+/, '')];
    return r ? { ean: r[0] || '', hs: r[1] || '', origin: r[2] || '', kg: Number(r[3]) || 0 } : { ean: '', hs: '', origin: '', kg: 0 };
  }

  function build(items, dealerName) {
    var PR = window.ShimanoPricing;
    var wb = X.utils.book_new();
    var now = new Date();
    var ymd = now.getFullYear() + String(now.getMonth() + 1).padStart(2, '0') + String(now.getDate()).padStart(2, '0');
    var orderNo = 'SHM-' + ymd + '-' + String(Math.floor(Math.random() * 9000) + 1000);
    var dDisp = String(now.getDate()).padStart(2, '0') + '/' + String(now.getMonth() + 1).padStart(2, '0') + '/' + now.getFullYear();

    var HEAD = ['Catalog', 'Item Code', 'Description', 'Model / Spec', 'Status', 'QTY', 'List Price', 'Campaign',
      'Net Price', 'Line Total', 'SRP excl. VAT', 'EAN', 'HS Code', 'Origin', 'Weight (kg)'];
    var NC = HEAD.length, C = {};
    HEAD.forEach(function (h, i) { C[h] = i; });
    var blank = function () { var a = []; for (var k = 0; k < NC; k++) a.push(''); return a; };

    var t = PR.totals(items), note = PR.minOrderNote(t);
    var rows = [];
    var r0 = blank(); r0[0] = 'Order:'; r0[1] = orderNo; r0[2] = 'Date:'; r0[3] = dDisp; r0[4] = 'Dealer:'; r0[5] = dealerName;
    rows.push(r0);                                                       // 0
    var rn = blank(); rn[0] = (note.ok ? '✓ ' : '⚠ ') + note.text; rows.push(rn);   // 1 note
    var ri = blank(); ri[0] = 'Prices in EUR, FCA Venray (NL), excl. VAT. Price list of ' + PR.generated +
      '. Campaign prices apply to available (in-stock) items only. Minimum order: \u20ac' +
      Number(PR.minOrder).toLocaleString('en-US') +
      ' of available items.'; rows.push(ri);                              // 2 info
    rows.push(blank());                                                  // 3
    rows.push(HEAD.slice());                                             // 4 header
    var first = rows.length, totQty = 0, totKg = 0, anyKg = false;

    items.forEach(function (it) {
      var p = PR.info(it.code), f = infoFor(it.code), q = Number(it.qty) || 0;
      var st = !p ? '' : p.status === 'available' ? 'Available' : p.status === 'etd' ? 'ETD (backorder)' : 'N/A';
      var kg = f.kg ? Math.round(f.kg * q * 1000) / 1000 : '';
      if (f.kg) { totKg += f.kg * q; anyKg = true; }
      totQty += q;
      var r = blank();
      r[C['Catalog']] = it.source; r[C['Item Code']] = it.code; r[C['Description']] = it.desc1;
      r[C['Model / Spec']] = it.desc2; r[C['Status']] = st; r[C['QTY']] = q;
      if (p) {
        r[C['List Price']] = p.list;
        r[C['Campaign']] = p.campaign ? p.campaign.label : '';
        r[C['Net Price']] = p.net;
        r[C['Line Total']] = Math.round(p.net * q * 100) / 100;
        r[C['SRP excl. VAT']] = p.srp || '';
      } else {
        r[C['List Price']] = 'Price on request';
      }
      r[C['EAN']] = f.ean; r[C['HS Code']] = f.hs; r[C['Origin']] = f.origin; r[C['Weight (kg)']] = kg;
      rows.push(r);
    });
    var last = rows.length - 1;
    rows.push(blank());
    var LT = C['Line Total'], LBL = C['Net Price'];
    function sumRow(label, val) { var r = blank(); r[LBL] = label; r[LT] = Math.round(val * 100) / 100; rows.push(r); return rows.length - 1; }
    var rAv = sumRow('Available (shippable)', t.available);
    var rEtd = sumRow('ETD (backorder)', t.etd);
    var rTot = sumRow('ORDER TOTAL', t.grand);
    var rSave = t.savings > 0 ? sumRow('Campaign savings (included)', t.savings) : -1;
    rows[rTot][C['QTY']] = totQty;
    rows[rTot][C['Weight (kg)']] = anyKg ? Math.round(totKg * 100) / 100 : '';

    var ws = X.utils.aoa_to_sheet(rows);
    ws['!cols'] = [{ wch: 13 }, { wch: 20 }, { wch: 34 }, { wch: 26 }, { wch: 15 }, { wch: 6 }, { wch: 10 }, { wch: 16 },
      { wch: 10 }, { wch: 12 }, { wch: 12 }, { wch: 15 }, { wch: 11 }, { wch: 12 }, { wch: 10 }];
    ws['!merges'] = [{ s: { r: 1, c: 0 }, e: { r: 1, c: NC - 1 } }, { s: { r: 2, c: 0 }, e: { r: 2, c: NC - 1 } }];
    ws['!rows'] = []; ws['!rows'][1] = { hpt: 30 };
    if (!ws['!sheetViews']) ws['!sheetViews'] = [{}];
    ws['!sheetViews'][0].showGridLines = false;

    var none = { top: { style: 'none' }, bottom: { style: 'none' }, left: { style: 'none' }, right: { style: 'none' } };
    var range = X.utils.decode_range(ws['!ref']);
    var money = [C['List Price'], C['Net Price'], C['Line Total'], C['SRP excl. VAT']];
    for (var r = range.s.r; r <= range.e.r; r++) {
      for (var c = range.s.c; c <= range.e.c; c++) {
        var a = X.utils.encode_cell({ r: r, c: c });
        if (!ws[a]) ws[a] = { v: '', t: 's' };
        var s = { font: { name: 'Arial', sz: 10, color: { rgb: '222222' } }, border: none, alignment: { horizontal: 'left', vertical: 'center' } };
        if (r === 0) s.font = { name: 'Arial', sz: 10, bold: c % 2 === 0, color: { rgb: c % 2 === 0 ? '555555' : '000000' } };
        if (r === 1) {
          s.font = { name: 'Arial', sz: 11, bold: true, color: { rgb: note.ok ? '0B6B47' : '7A4B00' } };
          s.fill = { fgColor: { rgb: note.ok ? 'E3F6EE' : 'FFF1C7' } };
          s.alignment = { horizontal: 'left', vertical: 'center', wrapText: true };
        }
        if (r === 2) s.font = { name: 'Arial', sz: 9, italic: true, color: { rgb: '666666' } };
        if (r === first - 1) {
          s = { font: { name: 'Arial', bold: true, sz: 10, color: { rgb: 'FFFFFF' } }, fill: { fgColor: { rgb: '0082CA' } },
            alignment: { horizontal: 'center', vertical: 'center', wrapText: true }, border: none };
        }
        if (r >= first && r <= last) {
          if (c >= C['EAN']) s.font.color = { rgb: '555555' };
          if (c === C['QTY'] || c === C['Weight (kg)']) s.alignment = { horizontal: 'center' };
          if (c === C['Status']) s.font.color = { rgb: ws[a].v === 'Available' ? '0B8A5A' : 'B26B00' };
          if (c === C['Campaign'] && ws[a].v) s.font = { name: 'Arial', sz: 9, bold: true, color: { rgb: 'C8102E' } };
          if (r % 2 === 0) s.fill = { fgColor: { rgb: 'F6F8FA' } };
        }
        if (r > last + 1) {
          s.font = { name: 'Arial', sz: 10, bold: r === rTot || r === rAv, color: { rgb: r === rSave ? '0B8A5A' : '222222' } };
          if (r === rSave) s.font.italic = true;
          if (r === rTot) s.border = { top: { style: 'thin', color: { rgb: '0082CA' } } };
          if (c === LBL) s.alignment = { horizontal: 'right' };
          if (c === C['QTY'] || c === C['Weight (kg)']) s.alignment = { horizontal: 'center' };
        }
        if (money.indexOf(c) > -1 && typeof ws[a].v === 'number' && r >= first) {
          ws[a].z = '#,##0.00'; s.numFmt = '#,##0.00'; s.alignment = { horizontal: 'right' };
        }
        if ((c === C['EAN'] || c === C['HS Code']) && r >= first && r <= last && ws[a].v !== '') {
          ws[a].t = 's'; ws[a].v = String(ws[a].v); ws[a].z = '@';
        }
        ws[a].s = s;
      }
    }
    X.utils.book_append_sheet(wb, ws, 'Order');
    X.writeFile(wb, 'Shimano_Order_' + ymd + '_' + String(dealerName).replace(/[^a-zA-Z0-9]/g, '_') + '.xlsx');
  }

  window.ShimanoOrderExport = function (items, dealerName) {
    if (!window.ShimanoPricing) return Promise.reject(new Error('pricing not loaded'));
    return Promise.all([loadXLSX(), loadInfo()]).then(function () { build(items, dealerName); });
  };
})();
