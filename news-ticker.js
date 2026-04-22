/* ═══════════════════════════════════════════════════════════════
   SHIMANO NEWS TICKER — TV-style scrolling marquee
   Reads TWO sources:
     - window.SHIMANO_NEWS   (full news, from news-data.js)
     - window.SHIMANO_TICKER (ticker-only items, from ticker-data.js)
   Ticker-only items show first (highest priority), then news.
   Items with ticker:false are excluded from the strip.
   ═══════════════════════════════════════════════════════════════ */
(function(){
  'use strict';
  if (window.__shimanoTickerLoaded) return;
  window.__shimanoTickerLoaded = true;

  if (sessionStorage.getItem('shimano_ticker_hidden') === '1') return;

  function boot(){
    var newsArr = Array.isArray(window.SHIMANO_NEWS) ? window.SHIMANO_NEWS : [];
    var tickerArr = Array.isArray(window.SHIMANO_TICKER) ? window.SHIMANO_TICKER : [];
    if (!newsArr.length && !tickerArr.length){
      return setTimeout(function(){
        var n = Array.isArray(window.SHIMANO_NEWS) ? window.SHIMANO_NEWS : [];
        var t = Array.isArray(window.SHIMANO_TICKER) ? window.SHIMANO_TICKER : [];
        if (n.length || t.length) build(n, t);
      }, 300);
    }
    build(newsArr, tickerArr);
  }

  function build(newsArr, tickerArr){
    var newsFiltered = newsArr.filter(function(n){ return n && n.ticker !== false; });
    var tickerFiltered = tickerArr.filter(function(n){ return n && n.title; });
    var items = tickerFiltered.concat(newsFiltered);
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
      + '#shimano-ticker:hover .st-strip{animation-play-state:paused}'
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

    function itemHTML(n){
      var date = n.date ? '<span class="st-date">' + escapeHTML(n.date) + '</span>' : '';
      var title = escapeHTML(n.title || '');
      var href = n.link || '';
      if (href){
        var target = /^https?:/i.test(href) ? ' target="_blank" rel="noopener"' : '';
        return '<a class="st-item" href="' + escapeAttr(href) + '"' + target + '>'
             + date + title + '</a><span class="st-sep">•</span>';
      }
      return '<span class="st-item st-nolink">' + date + title + '</span><span class="st-sep">•</span>';
    }

    /* Single pass, NO duplication. Duplication caused the "pops in middle" bug
       because the keyframe used translateX(-50%) which places the 2nd copy
       already visible at t=0. Now the whole strip enters from the right. */
    strip.innerHTML = items.map(itemHTML).join('');

    var closeBtn = document.createElement('button');
    closeBtn.className = 'st-close';
    closeBtn.setAttribute('aria-label', 'Close news ticker');
    closeBtn.innerHTML = '&times;';
    closeBtn.onclick = function(){
      sessionStorage.setItem('shimano_ticker_hidden', '1');
      bar.style.transition = 'transform .3s ease';
      bar.style.transform = 'translateY(100%)';
      setTimeout(function(){ bar.remove(); }, 320);
    };
    bar.appendChild(closeBtn);

    document.body.appendChild(bar);
    document.body.style.paddingBottom = '34px';

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
    });
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
