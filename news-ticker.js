/* ═══════════════════════════════════════════════════════════════
   SHIMANO NEWS TICKER — TV-style scrolling marquee
   Sources (in display order):
     1. window.SHIMANO_TICKER      (manual quick lines, ticker-data.js)
     2. window.SHIMANO_TICKER_AUTO (auto lines from stock changes, ticker-auto.js —
                                    written by .github/workflows/ticker-auto.yml)
     3. window.SHIMANO_EVENTS      (events-data.js — events starting within
                                    EVENT_WINDOW_DAYS appear automatically)
     4. window.SHIMANO_NEWS        (full news, news-data.js; ticker:false hides)
   ticker-auto.js and events-data.js are loaded by this file itself, so no
   HTML page needs editing.

   Auto lines with an "items" list (new / back-in-stock products) get a small
   caret; hovering (desktop) or tapping (touch) opens an upward product popup.
   Clicking a product opens its catalog with ?find=CODE, which this file also
   handles: the code is typed into that catalog's search box.

   Lifetime rules for items in sources 1-2 (all optional):
     publishAt : "YYYY-MM-DD"  hidden until this day
     expires   : "YYYY-MM-DD"  hidden after this day (inclusive)
     pin       : true          never auto-hides
     added     : "YYYY-MM-DD"  with no expires/pin, item hides after
                               DEFAULT_TTL_DAYS days
   ═══════════════════════════════════════════════════════════════ */
(function(){
  'use strict';
  if (window.__shimanoTickerLoaded) return;
  window.__shimanoTickerLoaded = true;

  /* ?find=CODE (sent by the ticker product popup): type the code into this
     catalog's own search box once the page is ready. Runs even when the
     ticker itself is hidden. */
  (function applyFindParam(){
    var code = '';
    try { code = new URLSearchParams(location.search).get('find') || ''; } catch(e){}
    code = code.trim();
    if (!code) return;
    try {
      var u = new URL(location.href);
      u.searchParams.delete('find');
      history.replaceState(history.state, '', u.pathname + u.search + u.hash);
    } catch(e){}
    /* wait for the page's own scripts (search listeners, intro skip, first
       render) to finish, otherwise the catalog may redraw over our search */
    var tries = 0;
    function wait(){
      if (window.__shimanoTickerFind && window.__shimanoTickerFind(code)) return;
      if (++tries < 40) setTimeout(wait, 250);
    }
    function start(){ setTimeout(wait, 500); }
    if (document.readyState === 'complete') start();
    else window.addEventListener('load', start);
  })();

  window.__shimanoTickerFind = function(code){
    var inp = document.getElementById('searchInput') || document.getElementById('sI');
    if (!inp) return false;
    /* shoes/eyewear only search inside the selected category; widen to all
       categories so the product is found wherever it sits */
    try {
      /* global "let" bindings of the catalog page are reachable by name */
      if (typeof getFilteredModels === 'function' && typeof currentCat === 'string'
          && /currentCat\s*===\s*'ALL'/.test(String(getFilteredModels)) && currentCat !== 'ALL') {
        currentCat = 'ALL'; // eslint-disable-line no-undef
      }
    } catch(e){}
    inp.value = code;
    inp.dispatchEvent(new Event('input', { bubbles: true }));
    inp.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true }));
    try { window.scrollTo({ top: 0, behavior: 'smooth' }); } catch(e){ window.scrollTo(0, 0); }
    return true;
  };

  if (sessionStorage.getItem('shimano_ticker_hidden') === '1') return;

  var DEFAULT_TTL_DAYS = 21;   /* manual lines with "added" and no expires/pin */
  var EVENT_WINDOW_DAYS = 30;  /* show events starting within this many days */
  var EVENT_MAX = 6;           /* at most this many event lines */
  var MONTHS = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];

  function loadScript(src, done){
    var s = document.createElement('script');
    s.src = src + '?v=' + Date.now();
    s.onload = s.onerror = function(){ done(); };
    document.head.appendChild(s);
  }

  function boot(){
    var pending = 0, fired = false;
    function finish(){
      if (fired) return; fired = true;
      build(
        Array.isArray(window.SHIMANO_NEWS) ? window.SHIMANO_NEWS : [],
        Array.isArray(window.SHIMANO_TICKER) ? window.SHIMANO_TICKER : [],
        Array.isArray(window.SHIMANO_TICKER_AUTO) ? window.SHIMANO_TICKER_AUTO : [],
        Array.isArray(window.SHIMANO_EVENTS) ? window.SHIMANO_EVENTS : []
      );
    }
    function need(src){ pending++; loadScript(src, function(){ if (--pending === 0) finish(); }); }
    /* events-data.js is only on index.html by default — load it everywhere */
    if (!Array.isArray(window.SHIMANO_EVENTS)) need('events-data.js');
    if (!Array.isArray(window.SHIMANO_TICKER_AUTO)) need('ticker-auto.js');
    if (!pending) finish();
    else setTimeout(finish, 2500); /* never block the ticker on a slow/missing file */
  }

  /* ---- date helpers (local midnight, "YYYY-MM-DD") ---- */
  function parseDay(str){
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(str || ''));
    return m ? new Date(+m[1], +m[2] - 1, +m[3]) : null;
  }
  function today(){ var d = new Date(); return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
  function dayDiff(a, b){ return Math.round((a - b) / 86400000); }

  /* Is a manual/auto ticker item currently live? */
  function isLive(n){
    if (!n || !n.title) return false;
    var t = today();
    var pub = parseDay(n.publishAt);
    if (pub && t < pub) return false;
    var exp = parseDay(n.expires);
    if (exp) return t <= exp;
    if (n.pin === true) return true;
    var added = parseDay(n.added);
    if (added) return dayDiff(t, added) <= DEFAULT_TTL_DAYS;
    return true;
  }

  /* Upcoming/ongoing events inside the window, soonest first */
  function eventItems(evts){
    var t = today(), out = [];
    evts.forEach(function(e){
      var s = parseDay(e && e.start), en = parseDay(e && (e.end || e.start));
      if (!s || !en || !e.name) return;
      if (en < t) return;                          /* already over */
      if (dayDiff(s, t) > EVENT_WINDOW_DAYS) return; /* too far ahead */
      var loc = [e.city, e.country].filter(Boolean).join(', ');
      var when = s <= t ? 'NOW' : s.getDate() + ' ' + MONTHS[s.getMonth()];
      out.push({
        _s: s,
        date: 'EVENT \u00B7 ' + when + (e.tbc ? ' (TBC)' : ''),
        title: e.name + (loc ? ' \u2013 ' + loc : ''),
        link: e.url || ''
      });
    });
    out.sort(function(a, b){ return a._s - b._s; });
    return out.slice(0, EVENT_MAX);
  }

  function build(newsArr, tickerArr, autoArr, eventsArr){
    var newsFiltered = newsArr.filter(function(n){ return n && n.ticker !== false; });
    var tickerFiltered = tickerArr.filter(isLive);
    var autoFiltered = autoArr.filter(isLive);
    var items = tickerFiltered.concat(autoFiltered, eventItems(eventsArr), newsFiltered);
    if (!items.length) return;

    var sidebar = document.querySelector('.sidebar');
    var sidebarW = 0;
    if (sidebar){
      var cs = getComputedStyle(sidebar);
      if (cs.position === 'fixed') sidebarW = sidebar.offsetWidth;
    }

    var css = ''
      + '#shimano-ticker{position:fixed;left:' + sidebarW + 'px;right:0;bottom:0;'
      +   'height:34px;background:linear-gradient(180deg,#0a0a12 0%,#050508 100%);'
      +   'border-top:1px solid #1e1e2e;z-index:9998;display:flex;align-items:center;'
      +   'font-family:"Barlow Condensed",sans-serif;overflow:hidden;'
      +   'box-shadow:0 -4px 20px rgba(0,0,0,.4)}'
      + '#shimano-ticker .st-label{flex-shrink:0;height:100%;display:flex;align-items:center;'
      +   'padding:0 14px;background:#0066cc;color:#fff;font-weight:700;font-size:12px;'
      +   'letter-spacing:.14em;text-transform:uppercase;position:relative;z-index:2;'
      +   'box-shadow:2px 0 8px rgba(0,102,204,.3)}'
      + '#shimano-ticker .st-label::after{content:"";position:absolute;right:-10px;top:0;'
      +   'width:0;height:0;border-left:10px solid #0066cc;border-top:17px solid transparent;'
      +   'border-bottom:17px solid transparent}'
      + '#shimano-ticker .st-dot{display:inline-block;width:6px;height:6px;border-radius:50%;'
      +   'background:#ff3b3b;margin-right:8px;animation:st-pulse 1.4s infinite}'
      + '@keyframes st-pulse{0%,100%{opacity:1;box-shadow:0 0 0 0 rgba(255,59,59,.6)}'
      +   '50%{opacity:.6;box-shadow:0 0 0 6px rgba(255,59,59,0)}}'
      /* IMPORTANT: track is the scroll viewport. overflow:hidden clips the strip
         until it scrolls into view from the right edge, character by character.
         Left-side fade kept for soft exit; right side is sharp so text enters crisply. */
      + '#shimano-ticker .st-track{flex:1;overflow:hidden;position:relative;height:100%;'
      +   'mask-image:linear-gradient(90deg,transparent 0,#000 30px,#000 100%);'
      +   '-webkit-mask-image:linear-gradient(90deg,transparent 0,#000 30px,#000 100%)}'
      + '#shimano-ticker .st-strip{display:inline-flex;align-items:center;height:100%;'
      +   'white-space:nowrap;will-change:transform;'
      +   'animation:st-scroll var(--st-dur,90s) linear infinite}'
      + '#shimano-ticker:hover .st-strip,#shimano-ticker.st-hold .st-strip{animation-play-state:paused}'
      /* Strip starts fully OFF-SCREEN to the right (translateX = track width in px)
         and ends fully OFF-SCREEN to the left (translateX = -stripWidth).
         Values are injected as CSS vars after measuring, so the first frame
         is already past the right edge — letters emerge one by one. */
      + '@keyframes st-scroll{'
      +   '0%{transform:translate3d(var(--st-start,100%),0,0)}'
      +   '100%{transform:translate3d(calc(-1 * var(--st-end,100%)),0,0)}}'
      + '#shimano-ticker .st-item{display:inline-flex;align-items:center;gap:10px;'
      +   'padding:0 28px;color:#e8e8f0;font-size:14px;font-weight:500;'
      +   'text-decoration:none;letter-spacing:.02em;transition:color .2s}'
      + '#shimano-ticker .st-item.st-nolink{cursor:default}'
      + '#shimano-ticker .st-item:not(.st-nolink):hover{color:#3b9eff}'
      + '#shimano-ticker .st-item .st-date{color:#6b6b82;font-size:12px;font-weight:600;'
      +   'letter-spacing:.1em;text-transform:uppercase}'
      + '#shimano-ticker .st-sep{color:#1e1e2e;font-size:18px;user-select:none;padding:0 4px}'
      + '#shimano-ticker .st-close{flex-shrink:0;background:none;border:none;color:#6b6b82;'
      +   'cursor:pointer;padding:0 14px;height:100%;font-size:18px;line-height:1;'
      +   'transition:color .15s;border-left:1px solid #1e1e2e}'
      + '#shimano-ticker .st-close:hover{color:#ff3b3b}'
      /* product-list lines: small caret hints that a list opens upwards */
      + '#shimano-ticker .st-item .st-caret{display:inline-block;margin-left:2px;color:#0082CA;'
      +   'font-size:10px;transform:translateY(-1px);transition:transform .2s,color .2s}'
      + '#shimano-ticker .st-item.st-active{color:#3b9eff}'
      + '#shimano-ticker .st-item.st-active .st-caret{transform:translateY(-3px);color:#3b9eff}'
      /* ---- product popup ---- */
      + '#st-pop{position:fixed;z-index:9999;width:420px;max-width:calc(100vw - 24px);'
      +   'max-height:min(62vh,500px);display:flex;flex-direction:column;'
      +   'background:#0c0c15;border:1px solid #24243a;border-radius:10px;'
      +   'box-shadow:0 -12px 40px rgba(0,0,0,.6),0 0 0 1px rgba(0,130,202,.08);'
      +   'font-family:"Barlow Condensed",sans-serif;color:#e8e8f0;'
      +   'opacity:0;transform:translateY(8px);pointer-events:none;'
      +   'transition:opacity .16s ease,transform .16s ease}'
      + '#st-pop.open{opacity:1;transform:none;pointer-events:auto}'
      + '#st-pop::after{content:"";position:absolute;bottom:-6px;left:var(--sp-arrow,50%);'
      +   'width:10px;height:10px;margin-left:-5px;background:#0c0c15;'
      +   'border-right:1px solid #24243a;border-bottom:1px solid #24243a;transform:rotate(45deg)}'
      /* invisible bridge so the mouse can travel from the line to the popup */
      + '#st-pop::before{content:"";position:absolute;left:0;right:0;bottom:-14px;height:14px}'
      + '#st-pop .sp-head{display:flex;align-items:center;gap:10px;padding:12px 12px 10px 16px;'
      +   'border-bottom:1px solid #1c1c2c}'
      + '#st-pop .sp-title{flex:1;min-width:0;font-size:15px;font-weight:700;letter-spacing:.06em;'
      +   'text-transform:uppercase;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}'
      + '#st-pop .sp-title small{display:block;font-size:11px;font-weight:600;letter-spacing:.12em;color:#6b6b82}'
      + '#st-pop .sp-count{flex-shrink:0;background:#0082CA;color:#fff;font-weight:700;font-size:12px;'
      +   'padding:2px 9px;border-radius:999px;letter-spacing:.04em}'
      + '#st-pop .sp-x{flex-shrink:0;background:none;border:none;color:#6b6b82;font-size:20px;'
      +   'line-height:1;cursor:pointer;padding:2px 4px}'
      + '#st-pop .sp-x:hover{color:#ff3b3b}'
      + '#st-pop .sp-search{margin:10px 12px 4px;padding:7px 10px;background:#06060c;color:#e8e8f0;'
      +   'border:1px solid #24243a;border-radius:6px;font:500 14px "Barlow Condensed",sans-serif;outline:none}'
      + '#st-pop .sp-search:focus{border-color:#0082CA}'
      + '#st-pop .sp-list{overflow-y:auto;overscroll-behavior:contain;padding:4px 0 6px;'
      +   'scrollbar-width:thin;scrollbar-color:#2a2a40 transparent}'
      + '#st-pop .sp-grp{position:sticky;top:0;z-index:1;background:#0c0c15;padding:8px 16px 4px;'
      +   'font-size:11px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:#6b6b82}'
      + '#st-pop .sp-grp span{color:#3a3a52;margin-left:6px}'
      + '#st-pop .sp-row{display:flex;align-items:baseline;gap:12px;padding:5px 16px;'
      +   'text-decoration:none;color:inherit;border-left:2px solid transparent}'
      + '#st-pop .sp-row:hover{background:#13132a;border-left-color:#0082CA}'
      + '#st-pop .sp-txt{flex:1;min-width:0}'
      + '#st-pop .sp-n{display:block;font-size:14px;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}'
      + '#st-pop .sp-d{display:block;font-size:12px;color:#8a8aa2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}'
      + '#st-pop .sp-c{flex-shrink:0;font-size:12px;font-weight:600;color:#3b9eff;letter-spacing:.04em;'
      +   'font-variant-numeric:tabular-nums}'
      + '#st-pop .sp-empty{padding:16px;color:#6b6b82;font-size:13px;text-align:center}'
      + '#st-pop .sp-foot{display:block;padding:10px 16px;border-top:1px solid #1c1c2c;color:#3b9eff;'
      +   'font-size:13px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;text-decoration:none}'
      + '#st-pop .sp-foot:hover{background:#13132a}'
      + '@media(max-width:700px){#shimano-ticker{left:0}#shimano-ticker .st-label{font-size:10px;padding:0 10px}'
      +   '#shimano-ticker .st-item{font-size:12px;padding:0 18px}}';

    var style = document.createElement('style');
    style.id = 'shimano-ticker-style';
    style.textContent = css;
    document.head.appendChild(style);

    var bar = document.createElement('div');
    bar.id = 'shimano-ticker';

    var label = document.createElement('div');
    label.className = 'st-label';
    label.innerHTML = '<span class="st-dot"></span>NEWS';
    bar.appendChild(label);

    var track = document.createElement('div');
    track.className = 'st-track';
    var strip = document.createElement('div');
    strip.className = 'st-strip';
    track.appendChild(strip);
    bar.appendChild(track);

    function itemHTML(n, i){
      var date = n.date ? '<span class="st-date">' + escapeHTML(n.date) + '</span>' : '';
      var title = escapeHTML(n.title || '');
      var href = n.link || '';
      var hasList = Array.isArray(n.items) && n.items.length > 0;
      var listAttr = hasList ? ' data-st-list="' + i + '"' : '';
      var caret = hasList ? '<span class="st-caret" aria-hidden="true">&#9650;</span>' : '';
      if (href){
        var target = /^https?:/i.test(href) ? ' target="_blank" rel="noopener"' : '';
        return '<a class="st-item' + (hasList ? ' st-haslist' : '') + '" href="' + escapeAttr(href) + '"'
             + target + listAttr + '>' + date + title + caret + '</a><span class="st-sep">•</span>';
      }
      return '<span class="st-item st-nolink' + (hasList ? ' st-haslist' : '') + '"' + listAttr + '>'
           + date + title + caret + '</span><span class="st-sep">•</span>';
    }

    /* Single pass, NO duplication. Duplication caused the "pops in middle" bug
       because the keyframe used translateX(-50%) which places the 2nd copy
       already visible at t=0. Now the whole strip enters from the right. */
    strip.innerHTML = items.map(function(n, i){ return itemHTML(n, i); }).join('');

    var closeBtn = document.createElement('button');
    closeBtn.className = 'st-close';
    closeBtn.setAttribute('aria-label', 'Close news ticker');
    closeBtn.innerHTML = '&times;';
    closeBtn.onclick = function(){
      if (pop) pop.hide(true);
      sessionStorage.setItem('shimano_ticker_hidden', '1');
      bar.style.transition = 'transform .3s ease';
      bar.style.transform = 'translateY(100%)';
      setTimeout(function(){ bar.remove(); }, 320);
    };
    bar.appendChild(closeBtn);

    var pop = null;
    document.body.appendChild(bar);
    document.body.style.paddingBottom = '34px';
    pop = setupPopup(bar, strip, items);

    /* Measure after mount. Start = trackWidth (first char sits just past right edge).
       End   = stripWidth (last char has just cleared left edge).
       Duration = total travel distance / speed — keeps visual speed constant
       regardless of message length or viewport width. */
    function calibrate(){
      var trackW = track.clientWidth;
      var stripW = strip.scrollWidth;
      if (!trackW || !stripW) return;
      var speed = 90; /* pixels per second */
      var dist = trackW + stripW;
      var dur = Math.max(20, Math.round(dist / speed));
      strip.style.setProperty('--st-start', trackW + 'px');
      strip.style.setProperty('--st-end',   stripW + 'px');
      strip.style.setProperty('--st-dur',   dur + 's');
      /* Restart animation so new vars apply from frame 0 */
      strip.style.animation = 'none';
      void strip.offsetWidth; // force reflow
      strip.style.animation = '';
    }
    calibrate();
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(calibrate).catch(function(){});
    }
    setTimeout(calibrate, 400);

    window.addEventListener('resize', function(){
      if (sidebar){
        var cs = getComputedStyle(sidebar);
        bar.style.left = (cs.position === 'fixed' ? sidebar.offsetWidth : 0) + 'px';
      }
      calibrate();
      if (pop) pop.hide(true);
    });
  }

  /* ═══ Product popup ═══════════════════════════════════════════════
     Lines carrying "items" (ticker-auto.js) open an upward panel listing
     the products. Desktop: hover (ticker pauses, panel stays while the
     mouse is on it). Touch: first tap opens, second tap follows the link. */
  function setupPopup(bar, strip, items){
    if (!strip.querySelector('[data-st-list]')) return null;

    var canHover = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    var SEARCH_FROM = 12;   /* show the filter box when the list is longer than this */
    var el = document.createElement('div');
    el.id = 'st-pop';
    el.setAttribute('role', 'dialog');
    el.setAttribute('lang', 'en');   /* English uppercase (no Turkish dotted İ) */
    document.body.appendChild(el);

    var openIdx = -1, anchor = null, showT = 0, hideT = 0;

    function pageName(link){ return String(link || '').replace(/\.html.*$/i, '').toUpperCase(); }
    function samePage(link){
      var a = String(link || '').split(/[?#]/)[0].toLowerCase();
      var here = location.pathname.split('/').pop().toLowerCase() || 'index.html';
      return a && a === here;
    }

    function rowsHTML(n, q){
      var list = n.items, page = n.link || '';
      if (q){
        q = q.toLowerCase();
        list = list.filter(function(p){
          return [p.c, p.n, p.d, p.g].join(' ').toLowerCase().indexOf(q) !== -1;
        });
      }
      if (!list.length) return '<div class="sp-empty">No matching products</div>';
      /* group by catalog group when present, otherwise by product name
         (e.g. all sizes of one shoe model sit under one heading) */
      var useName = !list.some(function(p){ return p.g; });
      var groups = [], byKey = {};
      list.forEach(function(p){
        var k = (useName ? p.n : p.g) || 'Other';
        if (!byKey[k]){ byKey[k] = []; groups.push(k); }
        byKey[k].push(p);
      });
      var showHeads = groups.length > 1 && groups.length < list.length;
      var html = '';
      groups.forEach(function(k){
        if (showHeads) html += '<div class="sp-grp">' + escapeHTML(k)
                           + '<span>' + byKey[k].length + '</span></div>';
        byKey[k].forEach(function(p){
          var main = (showHeads && useName) ? (p.d || p.n) : (p.n || p.d || p.c);
          var sub  = (showHeads && useName) ? '' : (p.n ? p.d : '');
          var href = page ? page + '?skip=true&find=' + encodeURIComponent(p.c) : '';
          html += '<a class="sp-row"' + (href ? ' href="' + escapeAttr(href) + '"' : '')
               +  ' data-code="' + escapeAttr(p.c) + '">'
               +  '<span class="sp-txt"><span class="sp-n">' + escapeHTML(main) + '</span>'
               +  (sub ? '<span class="sp-d">' + escapeHTML(sub) + '</span>' : '')
               +  '</span><span class="sp-c">' + escapeHTML(p.c) + '</span></a>';
        });
      });
      return html;
    }

    function render(n){
      var title = String(n.title || '');
      var cat = title.split(':')[0];
      var what = /back in stock/i.test(title) ? 'Back in stock' : (/new/i.test(title) ? 'New products' : 'Products');
      var html = '<div class="sp-head"><div class="sp-title">' + escapeHTML(cat)
               + '<small>' + what + '</small></div>'
               + '<span class="sp-count">' + n.items.length + '</span>'
               + '<button class="sp-x" type="button" aria-label="Close">&times;</button></div>';
      if (n.items.length > SEARCH_FROM)
        html += '<input class="sp-search" type="text" placeholder="Filter by code or name..." autocomplete="off">';
      html += '<div class="sp-list">' + rowsHTML(n, '') + '</div>';
      if (n.link && !samePage(n.link)) html += '<a class="sp-foot" href="' + escapeAttr(n.link) + '">Open ' + escapeHTML(pageName(n.link)) + ' catalogue &rarr;</a>';
      el.innerHTML = html;
      var list = el.querySelector('.sp-list');
      var search = el.querySelector('.sp-search');
      if (search) search.addEventListener('input', function(){
        list.innerHTML = rowsHTML(n, search.value.trim());
        list.scrollTop = 0;
      });
      el.querySelector('.sp-x').onclick = function(){ hide(true); };
    }

    function place(){
      if (!anchor) return;
      var r = anchor.getBoundingClientRect();
      var barTop = bar.getBoundingClientRect().top;
      var w = el.offsetWidth, vw = document.documentElement.clientWidth;
      var mid = r.left + r.width / 2;
      var left = Math.max(12, Math.min(mid - w / 2, vw - w - 12));
      el.style.left = left + 'px';
      el.style.bottom = (window.innerHeight - barTop + 10) + 'px';
      el.style.setProperty('--sp-arrow', Math.max(16, Math.min(mid - left, w - 16)) + 'px');
    }

    function show(a){
      var idx = +a.getAttribute('data-st-list');
      var n = items[idx];
      if (!n || !n.items) return;
      clearTimeout(hideT);
      if (anchor && anchor !== a) anchor.classList.remove('st-active');
      anchor = a;
      a.classList.add('st-active');
      bar.classList.add('st-hold');
      if (openIdx !== idx){ render(n); openIdx = idx; }
      place();
      el.classList.add('open');
    }

    function hide(now){
      clearTimeout(showT); clearTimeout(hideT);
      function go(){
        el.classList.remove('open');
        bar.classList.remove('st-hold');
        if (anchor) anchor.classList.remove('st-active');
        anchor = null; openIdx = -1;
      }
      if (now === true) go(); else hideT = setTimeout(go, 260);
    }

    function listItem(t){ return t && t.closest ? t.closest('[data-st-list]') : null; }

    if (canHover){
      strip.addEventListener('mouseover', function(e){
        var a = listItem(e.target);
        if (!a) return;
        clearTimeout(hideT); clearTimeout(showT);
        if (anchor === a) return;
        showT = setTimeout(function(){ show(a); }, anchor ? 0 : 140);
      });
      strip.addEventListener('mouseout', function(e){
        var a = listItem(e.target);
        if (!a || a.contains(e.relatedTarget)) return;
        clearTimeout(showT);
        if (anchor) hide();
      });
      el.addEventListener('mouseenter', function(){ clearTimeout(hideT); });
      el.addEventListener('mouseleave', function(e){
        if (anchor && anchor.contains(e.relatedTarget)) return;
        hide();
      });
    }

    /* touch (and keyboard): first activation opens the list instead of navigating */
    strip.addEventListener('click', function(e){
      var a = listItem(e.target);
      if (!a) return;
      if (anchor !== a || !el.classList.contains('open')){
        e.preventDefault();
        show(a);
      }
    });

    /* a product on the page we are already on: just run the search, no reload */
    el.addEventListener('click', function(e){
      var row = e.target.closest && e.target.closest('.sp-row');
      if (!row || !anchor) return;
      var n = items[openIdx];
      if (n && samePage(n.link) && window.__shimanoTickerFind){
        e.preventDefault();
        hide(true);
        window.__shimanoTickerFind(row.getAttribute('data-code'));
      }
    });

    document.addEventListener('click', function(e){
      if (!el.classList.contains('open')) return;
      if (el.contains(e.target) || listItem(e.target)) return;
      hide(true);
    }, true);
    document.addEventListener('keydown', function(e){ if (e.key === 'Escape') hide(true); });

    return { hide: hide };
  }

  function escapeHTML(s){
    return String(s).replace(/[&<>"']/g, function(c){
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];
    });
  }
  function escapeAttr(s){ return escapeHTML(s); }

  if (document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
