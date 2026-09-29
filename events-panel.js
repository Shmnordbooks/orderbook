/* ============================================================
   UPCOMING EVENTS PANEL — cover page (index.html)
   Reads window.SHIMANO_EVENTS from events-data.js.
   Injects its own CSS + HTML into #coverPage; touches nothing else.
   ============================================================ */
(function () {
  var root = document.getElementById('coverPage');
  var DATA = window.SHIMANO_EVENTS;
  if (!root || !DATA || !DATA.length) return;

  var PER_PAGE = 4;        // rows visible at once
  var ROTATE_MS = 7000;    // page rotation interval
  var MONTHS = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
  var DAY = 86400000;
  var CONTACT = window.SHIMANO_EVENTS_CONTACT || '';   // email that receives dealer suggestions

  function parse(s) {
    var p = String(s).split('-');
    return new Date(+p[0], +p[1] - 1, +p[2]);
  }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function up(s) { return String(s || '').toLocaleUpperCase('en-US'); }

  var today = new Date(); today.setHours(0, 0, 0, 0);

  var events = [];
  for (var i = 0; i < DATA.length; i++) {
    var e = DATA[i];
    if (!e || !e.start) continue;
    var s = parse(e.start), en = parse(e.end || e.start);
    if (isNaN(s) || isNaN(en) || en < today) continue;
    events.push({ e: e, s: s, en: en });
  }
  if (!events.length) return;
  events.sort(function (a, b) { return a.s - b.s; });

  /* ---------- styles ---------- */
  var css = [
    '#evPanel{position:absolute;right:48px;bottom:84px;z-index:3;width:340px;',
    'background:rgba(4,8,18,0.62);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);',
    'border:1px solid rgba(0,130,202,0.28);border-left:2px solid #0082CA;border-radius:4px;',
    "font-family:'Barlow Condensed',sans-serif;color:#fff;text-align:left;",
    'box-shadow:0 12px 40px rgba(0,0,0,0.45);animation:evIn .8s .7s ease both;}',
    '@keyframes evIn{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}',
    '#evPanel .ev-head{display:flex;align-items:center;gap:8px;padding:11px 14px 9px;border-bottom:1px solid rgba(0,130,202,0.18);}',
    '#evPanel .ev-dot{width:6px;height:6px;border-radius:50%;background:#00c896;animation:evPulse 2s infinite;}',
    '@keyframes evPulse{0%{box-shadow:0 0 0 0 rgba(0,200,150,.55)}70%{box-shadow:0 0 0 7px rgba(0,200,150,0)}100%{box-shadow:0 0 0 0 rgba(0,200,150,0)}}',
    '#evPanel .ev-title{white-space:nowrap;font-size:11px;font-weight:700;letter-spacing:.28em;color:#0082CA;}',
    '#evPanel .ev-region{white-space:nowrap;margin-left:auto;font-size:9.5px;font-weight:600;letter-spacing:.18em;color:rgba(255,255,255,.35);}',
    '#evPanel .ev-list{transition:opacity .45s ease;}',
    '#evPanel .ev-list.fade{opacity:0;}',
    '#evPanel a.ev-row{display:grid;grid-template-columns:52px 1fr auto;align-items:center;gap:12px;',
    'padding:9px 14px;text-decoration:none;color:inherit;border-bottom:1px solid rgba(255,255,255,0.05);transition:background .15s;}',
    '#evPanel a.ev-row:last-child{border-bottom:none;}',
    '#evPanel a.ev-row:hover{background:rgba(0,130,202,0.12);}',
    '#evPanel .ev-date{text-align:center;line-height:1;border-right:1px solid rgba(255,255,255,0.08);padding-right:10px;}',
    '#evPanel .ev-day{font-size:19px;font-weight:800;color:#fff;white-space:nowrap;}',
    '#evPanel .ev-day.range{font-size:15px;}',
    '#evPanel .ev-mon{font-size:9.5px;font-weight:700;letter-spacing:.14em;color:rgba(255,255,255,.45);margin-top:3px;white-space:nowrap;}',
    '#evPanel .ev-name{font-size:15px;font-weight:700;letter-spacing:.03em;line-height:1.1;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;}',
    '#evPanel .ev-meta{font-size:10px;font-weight:600;letter-spacing:.14em;color:rgba(255,255,255,.42);margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}',
    '#evPanel .ev-side{display:flex;flex-direction:column;align-items:flex-end;gap:4px;}',
    '#evPanel .ev-tag{font-size:8.5px;font-weight:700;letter-spacing:.12em;padding:2px 6px;border-radius:2px;white-space:nowrap;}',
    '#evPanel .ev-tag.pro{color:#4db4ff;background:rgba(0,130,202,.14);border:1px solid rgba(0,130,202,.35);}',
    '#evPanel .ev-tag.community{color:#00c896;background:rgba(0,200,150,.1);border:1px solid rgba(0,200,150,.3);}',
    '#evPanel .ev-tag.triathlon{color:#c49bff;background:rgba(150,90,255,.12);border:1px solid rgba(150,90,255,.35);}',
    '#evPanel .ev-tag.local{color:rgba(255,255,255,.7);background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.2);}',
    '#evPanel .ev-tbc{font-size:8.5px;font-weight:700;letter-spacing:.12em;color:#ff9500;}',
    '#evPanel .ev-count{font-size:9.5px;font-weight:700;letter-spacing:.12em;color:rgba(255,255,255,.55);white-space:nowrap;}',
    '#evPanel .ev-count.live{color:#00c896;}',
    '#evPanel .ev-foot{display:flex;align-items:center;justify-content:space-between;padding:7px 14px 9px;',
    'white-space:nowrap;overflow:hidden;border-top:1px solid rgba(0,130,202,0.12);font-size:9px;letter-spacing:.14em;color:rgba(255,255,255,.28);}',
    '#evPanel .ev-pages{display:flex;gap:5px;}',
    '#evPanel .ev-pg{width:5px;height:5px;border-radius:50%;background:rgba(0,130,202,.3);}',
    '#evPanel .ev-pg.on{background:#0082CA;}',
    '#evPanel .ev-suggest{background:none;border:none;padding:0;cursor:pointer;font-family:inherit;font-size:10px;font-weight:700;letter-spacing:.16em;color:#0082CA;transition:color .15s;}',
    '#evPanel .ev-suggest:hover{color:#4db4ff;}',
    '#evModal{position:absolute;inset:0;z-index:20;display:none;align-items:center;justify-content:center;background:rgba(2,5,12,.72);backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px);padding:16px;}',
    '#evModal.open{display:flex;}',
    '#evModal .evm-box{width:100%;max-width:460px;max-height:calc(100vh - 32px);overflow:auto;background:#070d1a;border:1px solid rgba(0,130,202,.35);border-top:2px solid #0082CA;border-radius:4px;',
    "font-family:'Barlow Condensed',sans-serif;color:#fff;text-align:left;box-shadow:0 20px 60px rgba(0,0,0,.6);}",
    '#evModal .evm-head{display:flex;align-items:center;justify-content:space-between;padding:16px 20px 10px;}',
    '#evModal .evm-title{font-size:18px;font-weight:800;letter-spacing:.14em;}',
    '#evModal .evm-x{background:none;border:none;color:rgba(255,255,255,.5);font-size:22px;line-height:1;cursor:pointer;}',
    '#evModal .evm-x:hover{color:#fff;}',
    '#evModal .evm-intro{padding:0 20px 12px;font-family:Barlow,sans-serif;font-size:13px;color:rgba(255,255,255,.55);line-height:1.45;}',
    '#evModal form{padding:0 20px 20px;display:grid;grid-template-columns:1fr 1fr;gap:12px;}',
    '#evModal .evm-f{display:flex;flex-direction:column;gap:5px;}',
    '#evModal .evm-f.full{grid-column:1 / -1;}',
    '#evModal label{font-size:10.5px;font-weight:700;letter-spacing:.16em;color:rgba(255,255,255,.55);}',
    '#evModal label b{color:#0082CA;font-weight:700;}',
    '#evModal input,#evModal select,#evModal textarea{width:100%;box-sizing:border-box;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.14);border-radius:3px;',
    'color:#fff;font-family:Barlow,sans-serif;font-size:14px;padding:8px 10px;outline:none;color-scheme:dark;}',
    '#evModal select option{background:#070d1a;color:#fff;}',
    '#evModal textarea{resize:vertical;min-height:60px;}',
    '#evModal input:focus,#evModal select:focus,#evModal textarea:focus{border-color:#0082CA;background:rgba(0,130,202,.08);}',
    '#evModal .evm-err{border-color:#ff5a5a !important;}',
    '#evModal .evm-actions{grid-column:1 / -1;display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:4px;}',
    '#evModal .evm-note{font-family:Barlow,sans-serif;font-size:11.5px;color:rgba(255,255,255,.4);line-height:1.4;}',
    '#evModal .evm-send{flex:none;background:#0082CA;border:none;border-radius:3px;color:#fff;cursor:pointer;font-family:inherit;font-size:13px;font-weight:700;letter-spacing:.16em;padding:10px 18px;}',
    '#evModal .evm-send:hover{background:#0095e6;}',
    '#evModal .evm-done{display:none;padding:8px 20px 22px;font-family:Barlow,sans-serif;font-size:14px;color:rgba(255,255,255,.75);line-height:1.5;}',
    '#evModal.sent form,#evModal.sent .evm-intro{display:none;}',
    '#evModal.sent .evm-done{display:block;}',
    '@media (max-width:520px){#evModal form{grid-template-columns:1fr;}}',
    '@media (max-width:1500px){#evPanel{right:24px;width:290px;}#evPanel .ev-name{font-size:14px;}}',
    '@media (max-width:768px){#evPanel{left:16px;right:16px;width:auto;bottom:62px;}',
    '#evPanel a.ev-row:nth-child(n+2){display:none;}#evPanel .ev-foot{display:none;}}',
    '@media (max-height:680px) and (min-width:769px){#evPanel a.ev-row:nth-child(n+3){display:none;}}'
  ].join('');
  var st = document.createElement('style');
  st.id = 'evPanelStyle';
  st.textContent = css;
  document.head.appendChild(st);

  /* ---------- rows ---------- */
  function dateBlock(s, en) {
    if (+s === +en) return '<div class="ev-day">' + s.getDate() + '</div><div class="ev-mon">' + MONTHS[s.getMonth()] + '</div>';
    var mon = s.getMonth() === en.getMonth() ? MONTHS[s.getMonth()] : MONTHS[s.getMonth()] + '/' + MONTHS[en.getMonth()];
    return '<div class="ev-day range">' + s.getDate() + '–' + en.getDate() + '</div><div class="ev-mon">' + mon + '</div>';
  }
  function countdown(s, en) {
    if (s <= today && en >= today) return '<span class="ev-count live">● LIVE NOW</span>';
    var d = Math.round((s - today) / DAY);
    if (d === 1) return '<span class="ev-count">TOMORROW</span>';
    if (d <= 120) return '<span class="ev-count">IN ' + d + ' DAYS</span>';
    return '<span class="ev-count">' + s.getFullYear() + '</span>';
  }
  function row(o) {
    var e = o.e;
    var type = ({ pro: 1, triathlon: 1, community: 1, local: 1 })[e.type] ? e.type : 'pro';
    var meta = [e.city, e.country].filter(Boolean).map(up).join(' · ');
    var href = e.url ? ' href="' + esc(e.url) + '" target="_blank" rel="noopener"' : '';
    return '<a class="ev-row"' + href + ' title="' + esc(e.name) + '">' +
      '<div class="ev-date">' + dateBlock(o.s, o.en) + '</div>' +
      '<div style="min-width:0"><div class="ev-name">' + esc(up(e.name)) + '</div>' +
      '<div class="ev-meta">' + esc(meta) + '</div></div>' +
      '<div class="ev-side">' +
        (e.label ? '<span class="ev-tag ' + type + '">' + esc(up(e.label)) + '</span>' : '') +
        (e.tbc ? '<span class="ev-tbc">DATES TBC</span>' : countdown(o.s, o.en)) +
      '</div></a>';
  }

  /* ---------- panel ---------- */
  var pages = Math.ceil(events.length / PER_PAGE);
  var dots = '';
  if (pages > 1) for (var p = 0; p < pages; p++) dots += '<span class="ev-pg' + (p === 0 ? ' on' : '') + '"></span>';
  var panel = document.createElement('div');
  panel.id = 'evPanel';
  panel.innerHTML =
    '<div class="ev-head"><span class="ev-dot"></span><span class="ev-title">UPCOMING EVENTS</span>' +
    '<span class="ev-region">GCC · KAZ · UZB</span></div>' +
    '<div class="ev-list"></div>' +
    '<div class="ev-foot">' + (CONTACT ? '<button type="button" class="ev-suggest">+ SUGGEST AN EVENT</button>' : '<span>DATES MAY CHANGE</span>') +
    '<span class="ev-pages">' + dots + '</span></div>';
  root.appendChild(panel);

  var listEl = panel.querySelector('.ev-list');
  var dotEls = panel.querySelectorAll('.ev-pg');
  var page = 0;
  function render() {
    var html = '';
    var slice = events.slice(page * PER_PAGE, page * PER_PAGE + PER_PAGE);
    for (var k = 0; k < slice.length; k++) html += row(slice[k]);
    listEl.innerHTML = html;
    for (var j = 0; j < dotEls.length; j++) dotEls[j].className = 'ev-pg' + (j === page ? ' on' : '');
  }
  render();

  var paused = false;
  if (pages > 1) {
    panel.addEventListener('mouseenter', function () { paused = true; });
    panel.addEventListener('mouseleave', function () { paused = false; });
    setInterval(function () {
      if (paused) return;
      listEl.classList.add('fade');
      setTimeout(function () {
        page = (page + 1) % pages;
        render();
        listEl.classList.remove('fade');
      }, 450);
    }, ROTATE_MS);
  }

  /* ---------- suggest an event (mailto) ---------- */
  if (CONTACT) {
    var COUNTRIES = [['UAE','United Arab Emirates'],['KSA','Saudi Arabia'],['OMN','Oman'],['QAT','Qatar'],['BHR','Bahrain'],['KWT','Kuwait'],['KAZ','Kazakhstan'],['UZB','Uzbekistan'],['OTHER','Other']];
    var TYPES = [['Pro race (UCI)','Pro race (UCI)'],['Triathlon / Duathlon','Triathlon / Duathlon'],['Gran fondo / Mass ride','Gran fondo / Mass ride'],['Club / Local race','Club / Local race'],['MTB / Gravel','MTB / Gravel'],['Other','Other']];
    function opts(list) {
      var h = '<option value="">Select…</option>';
      for (var q = 0; q < list.length; q++) h += '<option value="' + esc(list[q][0]) + '">' + esc(list[q][1]) + '</option>';
      return h;
    }
    var modal = document.createElement('div');
    modal.id = 'evModal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.innerHTML =
      '<div class="evm-box">' +
        '<div class="evm-head"><span class="evm-title">SUGGEST AN EVENT</span><button type="button" class="evm-x" aria-label="Close">×</button></div>' +
        '<div class="evm-intro">Know a cycling or triathlon event in your region? Share the details and we will add it to the calendar after review.</div>' +
        '<form novalidate>' +
          '<div class="evm-f full"><label>EVENT NAME <b>*</b></label><input name="name" maxlength="80" required></div>' +
          '<div class="evm-f"><label>START DATE <b>*</b></label><input type="date" name="start" required></div>' +
          '<div class="evm-f"><label>END DATE</label><input type="date" name="end"></div>' +
          '<div class="evm-f"><label>CITY <b>*</b></label><input name="city" maxlength="50" required></div>' +
          '<div class="evm-f"><label>COUNTRY <b>*</b></label><select name="country" required>' + opts(COUNTRIES) + '</select></div>' +
          '<div class="evm-f full"><label>EVENT TYPE <b>*</b></label><select name="type" required>' + opts(TYPES) + '</select></div>' +
          '<div class="evm-f full"><label>WEBSITE OR SOCIAL MEDIA LINK</label><input type="url" name="url" placeholder="https://"></div>' +
          '<div class="evm-f full"><label>YOUR NAME &amp; COMPANY <b>*</b></label><input name="from" maxlength="80" required></div>' +
          '<div class="evm-f full"><label>NOTES</label><textarea name="notes" maxlength="500" placeholder="Distances, registration deadline, expected participants…"></textarea></div>' +
          '<div class="evm-actions"><span class="evm-note">Your email app will open with the details filled in. Just press send.</span>' +
          '<button type="submit" class="evm-send">SEND</button></div>' +
        '</form>' +
        '<div class="evm-done">Thank you! Your email app should now be open with the event details. Please press <b>Send</b> to complete your suggestion.<br><br>' +
        'If nothing opened, email the details to <a href="mailto:' + esc(CONTACT) + '" style="color:#4db4ff">' + esc(CONTACT) + '</a>.</div>' +
      '</div>';
    root.appendChild(modal);

    var form = modal.querySelector('form');
    function openModal() {
      modal.classList.remove('sent');
      modal.classList.add('open');
      paused = true;
      setTimeout(function () { form.elements.name.focus(); }, 30);
    }
    function closeModal() { modal.classList.remove('open'); paused = false; }
    panel.querySelector('.ev-suggest').addEventListener('click', openModal);
    modal.querySelector('.evm-x').addEventListener('click', closeModal);
    modal.addEventListener('click', function (ev) { if (ev.target === modal) closeModal(); });
    document.addEventListener('keydown', function (ev) { if (ev.key === 'Escape' && modal.classList.contains('open')) closeModal(); });

    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var f = form.elements, ok = true;
      ['name', 'start', 'city', 'country', 'type', 'from'].forEach(function (k) {
        var bad = !String(f[k].value).trim();
        f[k].classList.toggle('evm-err', bad);
        if (bad) ok = false;
      });
      if (f.end.value && f.start.value && f.end.value < f.start.value) { f.end.classList.add('evm-err'); ok = false; }
      else f.end.classList.remove('evm-err');
      if (!ok) return;
      var v = function (k) { return String(f[k].value || '').trim(); };
      var body =
        'EVENT SUGGESTION — Shimano Order Book\n\n' +
        'Event name : ' + v('name') + '\n' +
        'Start date : ' + v('start') + '\n' +
        'End date   : ' + (v('end') || v('start')) + '\n' +
        'City       : ' + v('city') + '\n' +
        'Country    : ' + v('country') + '\n' +
        'Type       : ' + v('type') + '\n' +
        'Link       : ' + (v('url') || '-') + '\n' +
        'Suggested by: ' + v('from') + '\n\n' +
        'Notes:\n' + (v('notes') || '-') + '\n';
      var href = 'mailto:' + CONTACT +
        '?subject=' + encodeURIComponent('Event suggestion: ' + v('name') + ' (' + v('country') + ', ' + v('start') + ')') +
        '&body=' + encodeURIComponent(body);
      window.location.href = href;
      modal.classList.add('sent');
      form.reset();
    });
  }
})();
