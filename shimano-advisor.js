/* ═══════════════════════════════════════════════════════════════════════
   SHOE & CLEAT FINDER — shoe finder + cleat compatibility
   ───────────────────────────────────────────────────────────────────────
   Drop-in widget for the dealer order book. One line per page, next to
   shared-cart.js:

       <script src="shimano-advisor.js"></script>

   Replaces the earlier cleat-advisor.js (delete that file).

   TWO FLOWS, ONE PANEL
     • Which shoe?  — discipline → fit → level → matching models
     • Which cleat? — pedal → shoe → float → part number

   WHERE THE ANSWERS COME FROM
     Shoe answers are read from the page's own SHOE_DATA and SHOE_DETAILS
     at run time. Nothing about the range is duplicated here, so models
     added to or removed from the catalog appear and disappear on their
     own, and sizes, colours, widths and fitment always match the order
     book. Pedal-system labels are derived from each model's own
     description rather than a hand-kept list.

     Cleat answers are a fixed decision tree. That part is deliberately
     not an AI chatbot: GitHub Pages is static, so any API key shipped
     in the page would be readable from view-source, and the answer space
     is small, closed and costly to get wrong. Verified 17 Sep 2026
     against bike.shimano.com SPD-SLR technology, ride.shimano.com
     product pages (pd-r9300, pd-r8200, cl-sl130) and Shimano's statement
     to the cycling press.

   The shoe flow hides itself on pages without SHOE_DATA (pedals.html),
   where the widget runs as a cleat advisor only.
   ═══════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  if (window.__shimanoAdvisorLoaded) return;
  window.__shimanoAdvisorLoaded = true;

  /* ── Settings ──────────────────────────────────────────────────────
     SHOW_SEARCH adds a lookup box under the question chips. It searches
     model and part numbers in this catalog only — a closed set, so it
     either finds the product or says it does not stock it. It replaced
     a free-text "ask" box, which could not answer much and made the
     widget look like a chatbot that had run out of ideas.
     Set it to false to drop the box entirely; nothing else changes. */
  var SHOW_SEARCH = true;

  /* All the visible wording, in one place. The standing label beside the
     button and the panel's own heading deliberately read the same, so the
     thing the dealer clicked and the thing that opened share a name.
     Named for the job rather than the brand: this is a dealer tool, not a
     Shimano product, and "advisor" said nothing about what it does. */
  var WORDS = {
    shoes: {
      label: 'Shoe & cleat finder',
      title: 'SHOE & CLEAT FINDER',
      sub:   'Pick the model, then the cleat that fits it'
    },
    cleats: {
      label: 'Cleat compatibility',
      title: 'CLEAT COMPATIBILITY',
      sub:   'SPD-SL and SPD-SLR — what fits what'
    }
  };

  /* ═══ 1. LIVE CATALOG ACCESS ══════════════════════════════════════ */

  /* SHOE_DATA / SHOE_DETAILS are declared with `const` at page scope, so
     they are global lexical bindings rather than window properties —
     reachable by bare name, but only behind a typeof guard. */
  function rawData() {
    try { return (typeof SHOE_DATA !== 'undefined' && SHOE_DATA) || null; }
    catch (e) { return null; }
  }
  function rawDetails() {
    try { return (typeof SHOE_DETAILS !== 'undefined' && SHOE_DETAILS) || {}; }
    catch (e) { return {}; }
  }

  var SKIP_CATS = { 'SHOE CLEATS': 1, 'SHOE COVERS': 1 };

  function shoeGroups() {
    var d = rawData();
    if (!d || !d.length) return [];
    return d.filter(function (g) { return g && g.cat && !SKIP_CATS[g.cat]; });
  }

  var HAS_SHOES = shoeGroups().length > 0;

  /* ── Derived facts, all computed from the catalog ───────────────── */

  /* "Black Narrow 42.0" → width Narrow, colour Black, size 42 */
  function variants(g) {
    var widths = {}, colours = {}, sizes = [];
    (g.items || []).forEach(function (it) {
      var d = String(it.desc2 || '').trim();
      var mz = d.match(/([0-9]+(?:\.[0-9]+)?)\s*$/);
      if (mz) sizes.push(parseFloat(mz[1]));
      var rest = mz ? d.slice(0, mz.index).trim() : d;
      var w = /\bwide\b/i.test(rest) ? 'Wide' : (/\bnarrow\b/i.test(rest) ? 'Narrow' : 'Standard');
      widths[w] = 1;
      var col = rest.replace(/\b(wide|narrow)\b/ig, '').replace(/\s+/g, ' ').trim();
      if (col) colours[col] = 1;
    });
    var order = { Standard: 0, Narrow: 1, Wide: 2 };
    return {
      widths:  Object.keys(widths).sort(function (a, b) { return order[a] - order[b]; }),
      colours: Object.keys(colours),
      min: sizes.length ? Math.min.apply(null, sizes) : null,
      max: sizes.length ? Math.max.apply(null, sizes) : null,
      skus: (g.items || []).length
    };
  }

  /* Shimano's numbering carries the tier: 9xx flagship … 1xx entry. */
  function tier(group) {
    var m = String(group).match(/(\d+)/);
    if (!m) return null;
    var first = +m[1].charAt(0);
    if (first >= 9) return 'flagship';
    if (first >= 7) return 'performance';
    if (first >= 5) return 'versatile';
    return 'entry';
  }
  var TIER_LABEL = {
    flagship:    'Flagship',
    performance: 'Performance',
    versatile:   'Versatile',
    entry:       'Entry'
  };

  /* Pedal interface, read out of the model's own description. */
  function pedalSys(group) {
    var d = rawDetails()[group];
    if (!d) return null;
    var t = (String(d.desc || '') + ' ' + JSON.stringify(d.features || [])).toLowerCase();
    if (t.indexOf('spd-slr') !== -1)
      return { key: 'slr',  label: 'Road 3-bolt &middot; built for SPD-SLR' };
    if (t.indexOf('spd-sl') !== -1 || t.indexOf('3-bolt') !== -1 || t.indexOf('three-bolt') !== -1)
      return { key: 'road', label: 'Road 3-bolt &middot; SPD-SL' };
    if (t.indexOf('2-bolt') !== -1 || t.indexOf('two-bolt') !== -1)
      return { key: 'spd',  label: 'SPD 2-bolt' };
    if (t.indexOf('flat pedal') !== -1 || t.indexOf('flat-pedal') !== -1)
      return { key: 'flat', label: 'Flat pedal &middot; no cleat' };
    if (t.indexOf('spd') !== -1)
      return { key: 'spd',  label: 'SPD 2-bolt' };
    return null;
  }

  /* SPD cleat part numbers, taken from the catalog rather than memory. */
  function spdCleatCodes() {
    var d = rawData() || [], out = [];
    d.forEach(function (g) {
      if (!/SPD \(MTB\)/i.test(g.group || '')) return;
      (g.items || []).forEach(function (it) {
        var m = String(it.desc1 || '').match(/\b(SM-SH\d+|CL-MT\d+)\b/);
        if (m && out.indexOf(m[1]) === -1) out.push(m[1]);
      });
    });
    return out;
  }

  /* ── Jumping to a model's card in the catalog ───────────────────── */

  /* Cleat part numbers live inside the SHOE CLEATS groups, so a part
     number has to be resolved to the group whose card holds it. */
  function cleatGroupFor(pn) {
    var d = rawData() || [];
    for (var i = 0; i < d.length; i++) {
      if (d[i].cat !== 'SHOE CLEATS') continue;
      var items = d[i].items || [];
      for (var j = 0; j < items.length; j++) {
        if (String(items[j].desc1 || '').indexOf(pn) !== -1) return d[i].group;
      }
    }
    return null;
  }

  /* Any part or model number → the catalog group that shows it. */
  function resolveGroup(name) {
    var d = rawData() || [];
    for (var i = 0; i < d.length; i++) if (d[i].group === name) return d[i];
    var cg = cleatGroupFor(name);
    if (cg) for (var k = 0; k < d.length; k++) if (d[k].group === cg) return d[k];
    return null;
  }

  /* Drives the page's own setCat / toggleCard rather than touching the
     DOM directly, so the catalog stays in a state it built itself. */
  function jumpToModel(name) {
    var g = resolveGroup(name);
    if (!g) return false;
    close();
    try {
      if (typeof clearSearch === 'function') clearSearch();
    } catch (e) {}
    try {
      var chip = document.querySelector('.cat-chip[data-cat="' + g.cat + '"]');
      if (chip && typeof setCat === 'function') setCat(g.cat, chip);
    } catch (e) {}
    setTimeout(function () {
      var card = document.getElementById('mc-' + g.group);
      if (!card) return;
      /* Open first: expanding the card changes its height, so scrolling
         before that lands on the wrong place. */
      try {
        if (!card.classList.contains('open') && typeof toggleCard === 'function') toggleCard(g.group);
      } catch (e) {}
      card.classList.add('ca-flash');
      setTimeout(function () {
        /* scrollIntoView would tuck the card under the sticky header, so
           offset by the header's real height instead. */
        var head = document.querySelector('header');
        var off = (head && getComputedStyle(head).position === 'sticky')
          ? head.getBoundingClientRect().height : 0;
        var y = card.getBoundingClientRect().top + (window.pageYOffset || 0) - off - 16;
        y = Math.max(0, y);
        try { window.scrollTo({ top: y, behavior: 'smooth' }); }
        catch (e) { window.scrollTo(0, y); }
      }, 140);
      setTimeout(function () { card.classList.remove('ca-flash'); }, 2600);
    }, 120);
    return true;
  }

  /* On a page without the shoe catalog, the link has to cross over to
     shoes.html; the advisor loads there too and picks the model up. */
  function catalogHref(name) {
    return 'shoes.html?skip=true&model=' + encodeURIComponent(name);
  }

  function groupsWithWidth(w) {
    return shoeGroups().filter(function (g) { return variants(g).widths.indexOf(w) !== -1; });
  }
  function groupsByPedal(key) {
    return shoeGroups().filter(function (g) {
      var p = pedalSys(g.group);
      return p && p.key === key;
    });
  }
  function categories() {
    var seen = [], out = [];
    shoeGroups().forEach(function (g) {
      if (seen.indexOf(g.cat) === -1) { seen.push(g.cat); out.push(g.cat); }
    });
    return out;
  }
  function findGroup(name) {
    var all = shoeGroups();
    for (var i = 0; i < all.length; i++) if (all[i].group === name) return all[i];
    return null;
  }
  /* "NEW" is whatever the page itself badges as new, if it exposes it. */
  function newGroups() {
    try {
      if (typeof NEW_GROUPS !== 'undefined' && NEW_GROUPS && NEW_GROUPS.length) return NEW_GROUPS.slice();
    } catch (e) {}
    return [];
  }

  /* ═══ 2. CLEAT DECISION TREE (fixed, verified) ════════════════════ */

  var CLEAT = {
    'SM-SH10':  { sys: 'SPD-SL',  colour: 'Red',    hex: '#cf2b36', float: 'Fixed, 0&deg;' },
    'SM-SH11':  { sys: 'SPD-SL',  colour: 'Yellow', hex: '#e0a500', float: '6&deg; (&plusmn;3&deg;)' },
    'SM-SH12':  { sys: 'SPD-SL',  colour: 'Blue',   hex: '#1170b8', float: '2&deg; (&plusmn;1&deg;)' },
    'CL-SL100': { sys: 'SPD-SLR', colour: 'Red',    hex: '#cf2b36', float: 'Fixed, 0&deg;' },
    'CL-SL110': { sys: 'SPD-SLR', colour: 'Yellow', hex: '#e0a500', float: '6&deg; (&plusmn;3&deg;)' },
    'CL-SL120': { sys: 'SPD-SLR', colour: 'Blue',   hex: '#1170b8', float: '2&deg; (&plusmn;1&deg;)' },
    'CL-SL130': { sys: 'SPD-SLR', colour: 'Grey',   hex: '#8b949f', float: '6&deg; + extended adjustment' }
  };

  var NEVER_MIX = 'SM-SH cleats do not fit SPD-SLR pedals, and CL-SL cleats do not fit SPD-SL pedals. ' +
                  'There is no adapter and no backward compatibility in either direction.';

  var STEPS = {

    home: {
      q: 'What do you need to work out?',
      opts: [
        { label: 'Which shoe?', sub: 'Find the right model by discipline, fit and level', go: 'shoe_cat', needsShoes: true },
        { label: 'Which cleat?', sub: 'Match a cleat to the pedal and shoe the rider has', go: 'start' }
      ]
    },

    start: {
      q: 'Which pedal will the rider use?',
      hint: 'The pedal decides the cleat &mdash; the shoe only matters further down.',
      opts: [
        { label: 'SPD-SL &mdash; existing pedals', sub: 'PD-R9100, PD-R8000, PD-R7000, PD-R550 and earlier', go: 'sl_float' },
        { label: 'SPD-SLR &mdash; new pedals',     sub: 'PD-R9300 (Dura-Ace), PD-R8200 (Ultegra)',           go: 'slr_shoe' },
        { label: 'SPD &mdash; off-road, 2-bolt',   sub: 'MTB, gravel, touring and indoor pedals',            go: 'r_spd' },
        { label: 'Not sure which one they have',   sub: 'Help me tell them apart',                            go: 'identify' }
      ]
    },

    identify: {
      q: 'How to tell the road systems apart',
      body: [
        'SPD-SLR launched on 17 September 2026 and appears only on the PD-R9300 and PD-R8200. Any Shimano road pedal bought before that date is SPD-SL.',
        'On the pedal itself: SPD-SLR has a wider front catch area and an integrated stainless steel contact plate across the body. The model number is printed on the pedal body or the axle end.',
        'Fastest check of all: look at the cleat already on the shoe. A part number starting SM-SH is SPD-SL. One starting CL-SL is SPD-SLR.',
        'A pedal the rider can clip into from both sides, with a small metal cleat, is SPD &mdash; the off-road system, unaffected by any of this.'
      ],
      opts: [
        { label: 'It is SPD-SL',  sub: 'PD-R9100 and earlier', go: 'sl_float' },
        { label: 'It is SPD-SLR', sub: 'PD-R9300 or PD-R8200', go: 'slr_shoe' }
      ]
    },

    sl_float: {
      q: 'How much float does the rider want?',
      hint: 'Float is the rotation allowed before the foot releases.',
      opts: [
        { label: 'Standard &mdash; 6&deg;', sub: 'Suits most riders', go: 'r_SM-SH11' },
        { label: 'Limited &mdash; 2&deg;',  sub: 'More stable, still some movement', go: 'r_SM-SH12' },
        { label: 'None &mdash; fixed 0&deg;', sub: 'Locked in; sprinters and racers', go: 'r_SM-SH10' }
      ]
    },

    slr_shoe: {
      q: 'Which shoes will the rider use?',
      hint: 'On SPD-SLR, fore-aft adjustment lives in the shoe, so this changes the answer.',
      opts: [
        { label: 'New Shimano SPD-SLR shoes', sub: 'RC910, RC810', go: 'slr_float' },
        { label: 'Older Shimano road shoes',  sub: 'RC903, RC703, RC503 and similar', go: 'r_older' },
        { label: 'Non-Shimano shoes',         sub: 'Any other three-bolt road shoe', go: 'r_CL-SL130' },
        { label: 'Not sure yet',              sub: 'Shoe not decided', go: 'r_undecided' }
      ]
    },

    slr_float: {
      q: 'How much float does the rider want?',
      hint: 'All three mount to the RC910 and RC810 and keep the full low-stack benefit.',
      opts: [
        { label: 'Standard &mdash; 6&deg;', sub: 'Suits most riders; supplied in the pedal box', go: 'r_CL-SL110' },
        { label: 'Limited &mdash; 2&deg;',  sub: 'More stable, still some movement', go: 'r_CL-SL120' },
        { label: 'None &mdash; fixed 0&deg;', sub: 'Locked in; sprinters and racers', go: 'r_CL-SL100' }
      ]
    },

    'r_SM-SH11': { result: 'SM-SH11', lead: 'Order the yellow SM-SH11.',
      body: ['The standard choice and the one most riders run. Shoe brand is irrelevant &mdash; it fits any three-bolt road shoe.'],
      warn: NEVER_MIX },

    'r_SM-SH12': { result: 'SM-SH12', lead: 'Order the blue SM-SH12.',
      body: ['Two degrees of float, pivoting at the front centre. Shoe brand is irrelevant &mdash; it fits any three-bolt road shoe.'],
      warn: NEVER_MIX },

    'r_SM-SH10': { result: 'SM-SH10', lead: 'Order the red SM-SH10.',
      body: ['Fully fixed, no float. Shoe brand is irrelevant &mdash; it fits any three-bolt road shoe.'],
      warn: NEVER_MIX },

    'r_CL-SL110': { result: 'CL-SL110', lead: 'Order the yellow CL-SL110 &mdash; or take the pair in the box.',
      body: ['Every PD-R9300 and PD-R8200 already ships with a set of CL-SL110 yellow cleats. The rider may not need to buy anything at all.',
             'Order a separate pair only as a spare, or once the originals wear out.'],
      warn: NEVER_MIX },

    'r_CL-SL120': { result: 'CL-SL120', lead: 'Order the blue CL-SL120.',
      body: ['One degree of float each way. Full low-stack benefit on the RC910 and RC810.',
             'Note that the yellow CL-SL110 in the pedal box will go unused.'],
      warn: NEVER_MIX },

    'r_CL-SL100': { result: 'CL-SL100', lead: 'Order the red CL-SL100.',
      body: ['Fully fixed, no float, for the most direct power transfer. Full low-stack benefit on the RC910 and RC810.',
             'Note that the yellow CL-SL110 in the pedal box will go unused.'],
      warn: NEVER_MIX },

    'r_CL-SL130': { result: 'CL-SL130', lead: 'Order the grey CL-SL130.',
      body: ['All four SPD-SLR cleats use the standard three-bolt pattern, so a CL-SL110 would physically bolt on. The problem is position, not fitment.',
             'SPD-SLR moves fore-aft adjustment out of the cleat and into the shoe &mdash; that is where the 2.3 mm stack reduction comes from. The RC910 and RC810 carry extended cleat slots to compensate; most other shoes do not, so the rider may be unable to reach their preferred position.',
             'The CL-SL130 restores the same adjustment range as the old SPD-SL cleats, giving up the lower stack height and the weight saving in exchange.'],
      note: 'Shimano states it works with <em>most</em> &mdash; not all &mdash; non-Shimano three-hole road shoes. On an unusual outsole, check the slot range before promising a fit.',
      warn: 'The yellow CL-SL110 supplied in the pedal box will not give this rider a workable position. Tell them before they pay, not afterwards.' },

    'r_older': { result: 'CL-SL110', alt: 'CL-SL130', lead: 'Start with CL-SL100 / CL-SL110 / CL-SL120 to the rider’s preferred float.',
      body: ['Shimano confirms that riders on previous SPD-SL shoes &mdash; RC703 and RC503 among them &mdash; keep whatever adjustment range that shoe already offers. In most cases that is enough.',
             'If the rider cannot reach their usual cleat position within those slots, switch them to the grey CL-SL130, which restores the full SPD-SL adjustment range.'],
      note: 'Fit the cleats supplied in the pedal box first and check the position on the bike before selling a second pair.' },

    'r_undecided': { lead: 'The shoe decides it &mdash; here is the whole picture.',
      body: ['<strong>Buying RC910 or RC810:</strong> the yellow CL-SL110 in the pedal box is ready to go. Swap to CL-SL100 (0&deg;) or CL-SL120 (2&deg;) only if the rider wants different float.',
             '<strong>Keeping non-Shimano shoes:</strong> order the grey CL-SL130 as well. The yellow cleats in the box will not give a workable position.',
             '<strong>Keeping older Shimano shoes:</strong> try the cleats in the box first; move to CL-SL130 only if the position cannot be reached.'],
      warn: NEVER_MIX },

    r_spd: { dyn: 'spdCleat' },

    /* Built fresh from the catalog each time it is shown. */
    shoe_cat: { dyn: 'shoeCat' }
  };

  /* ═══ 3. SHOE FINDER ══════════════════════════════════════════════ */

  var pick = { cat: null, fit: null, tier: null };

  /* Categories, fits and tiers are all generated from what is actually
     in the catalog, so an empty option is never offered. */

  function stepShoeCat() {
    var cats = categories();
    return {
      q: 'What kind of riding?',
      hint: 'Straight from the catalog &mdash; ' + shoeGroups().length + ' models across ' + cats.length + ' categories.',
      opts: cats.map(function (c) {
        var n = shoeGroups().filter(function (g) { return g.cat === c; }).length;
        return { label: titleCase(c), sub: n + (n === 1 ? ' model' : ' models'), act: 'cat:' + c };
      })
    };
  }

  function stepShoeFit() {
    var pool = shoeGroups().filter(function (g) { return g.cat === pick.cat; });
    var wide = pool.filter(function (g) { return variants(g).widths.indexOf('Wide') !== -1; }).length;
    var narrow = pool.filter(function (g) { return variants(g).widths.indexOf('Narrow') !== -1; }).length;
    var opts = [{ label: 'Standard fit is fine', sub: 'No particular width requirement', act: 'fit:any' }];
    if (wide)   opts.push({ label: 'Needs a wide fit',   sub: wide + ' of these come in Wide',   act: 'fit:Wide' });
    if (narrow) opts.push({ label: 'Needs a narrow fit', sub: narrow + ' of these come in Narrow', act: 'fit:Narrow' });
    return {
      q: 'Any fit requirement?',
      hint: wide || narrow
        ? 'The most common complaint is a shoe that is too tight across the forefoot &mdash; worth asking every time.'
        : 'Nothing in this category comes in a second width.',
      opts: opts
    };
  }

  function stepShoeTier() {
    var pool = filterPool();
    var order = ['flagship', 'performance', 'versatile', 'entry'];
    var present = order.filter(function (t) {
      return pool.some(function (g) { return tier(g.group) === t; });
    });
    var subs = {
      flagship:    'S-PHYRE and equivalent &mdash; top of the range',
      performance: 'Serious riders, carbon soles',
      versatile:   'All-round, everyday use',
      entry:       'Value and first-time buyers'
    };
    return {
      q: 'What level?',
      hint: pool.length + (pool.length === 1 ? ' model matches' : ' models match') + ' so far.',
      opts: present.map(function (t) {
        var n = pool.filter(function (g) { return tier(g.group) === t; }).length;
        return { label: TIER_LABEL[t], sub: subs[t] + ' · ' + n, act: 'tier:' + t };
      }).concat([{ label: 'No preference', sub: 'Show every match', act: 'tier:any' }])
    };
  }

  function filterPool() {
    return shoeGroups().filter(function (g) {
      if (pick.cat && g.cat !== pick.cat) return false;
      if (pick.fit && pick.fit !== 'any' && variants(g).widths.indexOf(pick.fit) === -1) return false;
      if (pick.tier && pick.tier !== 'any' && tier(g.group) !== pick.tier) return false;
      return true;
    });
  }

  /* ═══ 4. RENDERING ════════════════════════════════════════════════ */

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function titleCase(s) {
    return String(s).toLowerCase().replace(/\b[a-z]/g, function (c) { return c.toUpperCase(); });
  }

  /* One shape for "go to the catalog", used by every result — a filled
     accent block that reads as an instruction, not a caption. */
  function catalogCta(name) {
    if (HAS_SHOES && !resolveGroup(name)) return '';
    var inner = '<b>Click to open ' + esc(name) + ' in the catalog' +
                '<span class="ca-arrow">&#8599;</span></b>' +
                '<span>Jumps to the card with every size and colour, ready to add to the order</span>';
    return HAS_SHOES
      ? '<button class="ca-opt ca-opt-go" data-act="jump:' + esc(name) + '">' + inner + '</button>'
      : '<a class="ca-opt ca-opt-go" href="' + catalogHref(name) + '">' + inner + '</a>';
  }

  function partLinkable(pn) {
    if (!CLEAT[pn]) return false;
    return HAS_SHOES ? !!resolveGroup(pn) : true;
  }

  /* The part number is the link: it takes the dealer to the card that
     sells it, on this page or on shoes.html. */
  function partRow(pn) {
    var c = CLEAT[pn];
    if (!c) return '';
    var inner =
      '<span class="ca-dot" style="background:' + c.hex + '"></span>' +
      '<span class="ca-pn">' + pn + '<span class="ca-arrow">&#8599;</span></span>' +
      '<span class="ca-meta">' + c.float + '<br>' + c.sys + ' &middot; ' + c.colour + '</span>';
    if (HAS_SHOES) {
      if (!resolveGroup(pn)) return '<div class="ca-part">' + inner + '</div>';
      return '<button class="ca-part ca-part-link" data-act="jump:' + pn + '" ' +
             'title="Open ' + pn + ' in the catalog">' + inner + '</button>';
    }
    return '<a class="ca-part ca-part-link" href="' + catalogHref(pn) + '" ' +
           'title="Open ' + pn + ' in the shoes catalog">' + inner + '</a>';
  }

  function paras(arr) {
    return (arr || []).map(function (t) { return '<p class="ca-p">' + t + '</p>'; }).join('');
  }

  /* Compact row in a result list */
  function shoeRow(g) {
    var v = variants(g), p = pedalSys(g.group), d = rawDetails()[g.group] || {};
    var t = tier(g.group);
    var isNew = newGroups().indexOf(g.group) !== -1;
    /* Two separate buttons side by side — never nested, which would be
       invalid and would swallow one of the two clicks. */
    return '<div class="ca-shoe-wrap">' +
      '<button class="ca-shoe" data-act="shoe:' + esc(g.group) + '">' +
        '<span class="ca-shoe-top"><b>' + esc(g.group) + '</b>' +
          (isNew ? '<span class="ca-new">NEW</span>' : '') +
          (t ? '<span class="ca-tier">' + TIER_LABEL[t] + '</span>' : '') + '</span>' +
        (d.tagline ? '<span class="ca-shoe-tag">' + esc(String(d.tagline).split('—')[1] || d.tagline).trim() + '</span>' : '') +
        '<span class="ca-shoe-meta">' +
          (p ? p.label : 'Fitment: see catalog') +
          (v.widths.length > 1 ? ' &middot; ' + v.widths.join(' / ') : '') +
          (v.min !== null ? ' &middot; ' + v.min + '&ndash;' + v.max : '') +
        '</span>' +
      '</button>' +
      '<button class="ca-jump" data-act="jump:' + esc(g.group) + '" ' +
        'aria-label="Open ' + esc(g.group) + ' in the catalog" ' +
        'title="Open ' + esc(g.group) + ' in the catalog">&#8599;</button>' +
    '</div>';
  }

  function shoeList(list, title, hint) {
    if (!list.length) {
      return '<p class="ca-q">' + title + '</p>' +
             '<p class="ca-hint">Nothing in the catalog matches that combination right now. ' +
             'Loosen one of the answers, or check the order book directly.</p>';
    }
    return '<p class="ca-q">' + title + '</p>' +
           (hint ? '<p class="ca-hint">' + hint + '</p>' : '') +
           '<div class="ca-shoes">' + list.map(shoeRow).join('') + '</div>';
  }

  /* Full detail card for one model */
  function shoeDetail(name) {
    var g = findGroup(name);
    if (!g) return '<p class="ca-q">Not in the catalog</p>';
    var v = variants(g), p = pedalSys(name), d = rawDetails()[name] || {};
    var t = tier(name);
    var html = '<div class="ca-res">';
    html += '<button class="ca-lead ca-lead-link" data-act="jump:' + esc(name) + '" ' +
            'title="Open ' + esc(name) + ' in the catalog">' + esc(g.name || name) +
            '<span class="ca-arrow">&#8599;</span></button>';
    if (d.tagline) html += '<p class="ca-p" style="margin-bottom:12px">' + esc(d.tagline) + '</p>';
    html += '<div class="ca-spec">';
    if (p) html += '<div><span>Fitment</span>' + p.label + '</div>';
    html += '<div><span>Widths</span>' + v.widths.join(', ') + '</div>';
    if (v.min !== null) html += '<div><span>Sizes</span>' + v.min + ' &ndash; ' + v.max + '</div>';
    if (v.colours.length) html += '<div><span>Colours</span>' + esc(v.colours.join(', ')) + '</div>';
    if (t) html += '<div><span>Level</span>' + TIER_LABEL[t] + '</div>';
    /* The catalog's `weight` field holds a real weight on most models but a
       sizes/colours blurb on others — show it only when it is a weight, so
       the card never repeats the rows just above it. */
    if (d.weight && /(^\s*~|\d\s*g\b)/.test(String(d.weight)))
      html += '<div><span>Weight</span>' + esc(d.weight) + '</div>';
    html += '<div><span>SKUs</span>' + v.skus + ' in the order book</div>';
    html += '</div></div>';

    /* Straight under the spec block, before the prose — the dealer should
       not have to read to the bottom to find the way into the catalog. */
    html += catalogCta(name);

    if (d.desc) html += '<p class="ca-p">' + esc(d.desc) + '</p>';
    if (d.features && d.features.length) {
      html += '<p class="ca-lbl" style="margin-top:14px">KEY FEATURES</p><ul class="ca-feat">' +
        d.features.slice(0, 6).map(function (f) { return '<li>' + esc(f) + '</li>'; }).join('') + '</ul>';
    }

    /* Cleat hand-off, routed by this shoe's own fitment */
    if (p && (p.key === 'slr' || p.key === 'road')) {
      html += '<div style="margin-top:14px"><button class="ca-opt" data-go="start">' +
        '<b>Which cleat does this shoe take?</b>' +
        '<span>Three-bolt road shoe &mdash; the answer depends on the pedal</span></button></div>';
    } else if (p && p.key === 'spd') {
      var codes = spdCleatCodes();
      html += '<div class="ca-note" style="margin-top:14px"><strong>Cleats:</strong> SPD two-bolt' +
        (codes.length ? ' &mdash; ' + codes.join(', ') + ' in the order book' : '') +
        '. The SPD-SL and SPD-SLR road cleats do not fit this shoe.</div>';
    } else if (p && p.key === 'flat') {
      html += '<div class="ca-note" style="margin-top:14px"><strong>No cleats.</strong> ' +
        'A flat-pedal shoe &mdash; there is nothing to bolt on.</div>';
    }
    return html;
  }

  /* ═══ 5. FAQ ══════════════════════════════════════════════════════ */

  var FAQ = [
    { id: 'wide', shoes: true, chip: 'Show every wide-fit shoe',
      build: function () {
        var l = groupsWithWidth('Wide');
        return shoeList(l, 'Shoes available in a Wide fit',
          l.length + ' of ' + shoeGroups().length + ' models. On the RC910 and RC810 the Wide is wider than before, ' +
          'because DYNALAST 2.0 adds 3 mm at the toes and 2 mm at the ball of the foot.');
      } },

    { id: 'narrow', shoes: true, chip: 'Show every narrow-fit shoe',
      build: function () {
        var l = groupsWithWidth('Narrow');
        return shoeList(l, 'Shoes available in a Narrow fit',
          'On the RC910 and RC810 the Narrow is a unisex option that replaces the previous women’s-specific last.');
      } },

    { id: 'flat', shoes: true, chip: 'Flat pedal shoes',
      build: function () {
        return shoeList(groupsByPedal('flat'), 'Flat pedal shoes',
          'No cleats at all &mdash; the sole grips the pedal pins.');
      } },

    { id: 'spdshoes', shoes: true, chip: 'Which shoes take SPD (2-bolt)?',
      build: function () {
        var codes = spdCleatCodes();
        return shoeList(groupsByPedal('spd'), 'Shoes on the SPD two-bolt system',
          'Off-road, gravel, touring and indoor. Cleats' +
          (codes.length ? ': ' + codes.join(', ') : ' are the SPD range') +
          ' &mdash; the road cleats do not fit these.');
      } },

    { id: 'road3', shoes: true, chip: 'Which shoes are road 3-bolt?',
      build: function () {
        var l = groupsByPedal('slr').concat(groupsByPedal('road'));
        return shoeList(l, 'Road three-bolt shoes',
          'These take SPD-SL or SPD-SLR cleats, decided by the pedal rather than the shoe.');
      } },

    { id: 'newshoes', shoes: true, chip: 'What is new this season?',
      build: function () {
        var ng = newGroups().map(findGroup).filter(Boolean);
        if (!ng.length) {
          return '<p class="ca-q">New this season</p>' +
            paras(['The RC910 and RC810 arrived with the SPD-SLR launch on 17 September 2026, together with the RP102 road shoe and the CL-SL cleat range.',
                   'Both new S-PHYRE models use DYNALAST 2.0: 3 mm wider at the toes, 2 mm wider at the ball of the foot, in Standard, Narrow and Wide.']);
        }
        return shoeList(ng, 'New this season',
          'Flagged as NEW in this catalog.');
      } },

    { id: 'sphyre', shoes: true, chip: 'What does S-PHYRE mean?',
      build: function () {
        return '<p class="ca-q">S-PHYRE</p>' +
          paras(['S-PHYRE is Shimano’s top tier &mdash; the 9-series in each discipline. RC910 on the road, XC903 off-road, RX910 on gravel, TR903 for triathlon.',
                 'Below it the numbering steps down in order: 8 and 7 series for performance, 5 and 6 for versatile all-rounders, 1 to 3 for entry level. The first digit of the model number is the quickest way to place any shoe in the range.']) +
          shoeList(shoeGroups().filter(function (g) { return tier(g.group) === 'flagship'; }),
            'Flagship models in this catalog', '');
      } },

    { id: 'box',
      chip: 'What comes in the pedal box?',
      q: 'Which cleat is supplied with the pedals?',
      a: ['Both the PD-R9300 and the PD-R8200 ship with a set of <strong>CL-SL110 yellow</strong> cleats, with 6&deg; of float (&plusmn;3&deg;).',
          'This matters at the counter: a customer on non-Shimano shoes who needs the CL-SL130 will end up with an unused yellow set. Tell them before they pay.'] },

    { id: 'mix',
      chip: 'Do the old cleats fit the new pedals?',
      q: 'Are SPD-SL and SPD-SLR interchangeable?',
      a: ['No, in neither direction. ' + NEVER_MIX,
          'SPD-SLR is the first change to Shimano’s road pedal interface in over 20 years, and compatibility with SPD-SL was deliberately dropped to lower the stack height.'] },

    { id: 'nonshimano',
      chip: 'Customer has non-Shimano shoes',
      q: 'Which cleat for a non-Shimano shoe?',
      a: ['<strong>On SPD-SL pedals:</strong> nothing changes &mdash; SM-SH10, SM-SH11 or SM-SH12 as before. Shoe brand is irrelevant.',
          '<strong>On the new SPD-SLR pedals:</strong> order the grey <strong>CL-SL130</strong>. The low-stack cleats have almost no fore-aft adjustment of their own, and a non-Shimano shoe usually lacks the extended slots that compensate for it. The CL-SL130 restores the old adjustment range, trading away the lower stack and the weight saving.',
          'Shimano says it works with <em>most</em> &mdash; not all &mdash; non-Shimano three-hole road shoes.'] },

    { id: 'discontinued',
      chip: 'Is SPD-SL discontinued?',
      q: 'Is SPD-SL being dropped?',
      a: ['No. Shimano has confirmed it will continue to supply the full range of SPD-SL cleats for as long as there is meaningful demand.',
          'A customer on SPD-SL pedals has no reason to change anything. SM-SH10, SM-SH11 and SM-SH12 remain in the order book alongside the new CL-SL range.'] },

    { id: 'whatschanged',
      chip: 'What changed with SPD-SLR?',
      q: 'What is new about SPD-SLR?',
      a: ['<strong>Stack height</strong> drops 2.3 mm at the pedal and cleat interface, bringing the foot closer to the axle.',
          '<strong>Engagement</strong> is easier: a wider catch zone and an entry angle of 10.5&deg;, down from 15.5&deg; on SPD-SL.',
          '<strong>Cleats</strong> are up to 22% lighter than the SPD-SL equivalents.',
          '<strong>Adjustment</strong> moves from the cleat into the shoe, which is why the new RC910 and RC810 have extended cleat slots.'] },

    { id: 'float',
      chip: 'Which float should they pick?',
      q: 'How do the float options compare?',
      a: ['<strong>6&deg; (&plusmn;3&deg;), yellow</strong> &mdash; SM-SH11 or CL-SL110. The default, and right for most riders.',
          '<strong>2&deg; (&plusmn;1&deg;), blue</strong> &mdash; SM-SH12 or CL-SL120. More stable, with a little movement left.',
          '<strong>0&deg;, red</strong> &mdash; SM-SH10 or CL-SL100. Fully locked in, for sprinters and racers.',
          'If the rider is happy with what they run now, match the colour across to the other system.'] }
  ];

  function activeFaq() {
    return FAQ.filter(function (f) { return !f.shoes || HAS_SHOES; });
  }

  /* ═══ 6. PANEL SHELL ══════════════════════════════════════════════ */

  var CSS = [
    '.ca-fab{position:fixed;bottom:88px;right:20px;z-index:9998;width:56px;height:56px;',
      'border-radius:14px;background:linear-gradient(135deg,#0082CA,#005f95);border:none;cursor:pointer;',
      'display:flex;align-items:center;justify-content:center;box-shadow:0 4px 20px rgba(0,130,202,.35);',
      'transition:transform .25s,box-shadow .25s}',
    '.ca-fab:hover{transform:translateY(-2px);box-shadow:0 6px 28px rgba(0,130,202,.5)}',
    '.ca-fab:focus-visible{outline:2px solid #7fd0ff;outline-offset:3px}',
    '.ca-fab svg{width:25px;height:25px;color:#fff}',
    '.ca-fab::after{content:"";position:absolute;inset:0;border-radius:14px;border:2px solid #0082CA;',
      'opacity:0;pointer-events:none;animation:caPulse 2.1s ease-out 3}',
    '@keyframes caPulse{0%{opacity:.8;transform:scale(1)}',
      '65%{opacity:0;transform:scale(1.5)}100%{opacity:0;transform:scale(1.5)}}',

    '.ca-tip{position:fixed;bottom:98px;right:86px;z-index:9998;background:#101922;color:#dfeaf5;',
      'border:1px solid #27394b;border-left:3px solid #0082CA;border-radius:8px;padding:8px 13px;',
      'font-family:"Barlow Condensed",Arial,sans-serif;font-size:14.5px;font-weight:600;',
      'letter-spacing:.05em;white-space:nowrap;cursor:pointer;',
      'transition:opacity .25s,transform .16s,border-color .16s;box-shadow:0 6px 22px rgba(0,0,0,.45)}',
    '.ca-tip:hover{transform:translateY(-2px);border-color:#0082CA}',
    '.ca-tip:focus-visible{outline:2px solid #7fd0ff;outline-offset:3px}',
    '.ca-tip.ca-hide{opacity:0;pointer-events:none}',

    '.ca-overlay{position:fixed;inset:0;background:rgba(0,0,0,.55);backdrop-filter:blur(3px);',
      'z-index:10000;opacity:0;pointer-events:none;transition:opacity .3s}',
    '.ca-overlay.open{opacity:1;pointer-events:all}',

    '.ca-panel{position:fixed;top:0;right:0;width:440px;max-width:96vw;height:100%;z-index:10001;',
      'background:#0f1520;border-left:1px solid #222e3d;display:flex;flex-direction:column;',
      'transform:translateX(100%);transition:transform .35s cubic-bezier(.22,1,.36,1);',
      'box-shadow:-8px 0 40px rgba(0,0,0,.5);font-family:Barlow,Arial,sans-serif;color:#dfe8f2}',
    '.ca-panel.open{transform:translateX(0)}',

    '.ca-head{padding:16px 20px;border-bottom:1px solid #222e3d;display:flex;align-items:center;',
      'justify-content:space-between;gap:12px;flex-shrink:0}',
    '.ca-head h3{font-family:"Barlow Condensed",Arial,sans-serif;font-size:17px;font-weight:700;',
      'letter-spacing:.09em;margin:0;color:#eef4fa}',
    '.ca-head p{margin:2px 0 0;font-size:12px;color:#7d8c9c}',
    '.ca-x{background:none;border:none;color:#7d8c9c;cursor:pointer;font-size:24px;line-height:1;',
      'padding:2px 6px;border-radius:6px;flex-shrink:0}',
    '.ca-x:hover{color:#dfe8f2;background:rgba(255,255,255,.06)}',

    '.ca-body{flex:1;overflow-y:auto;padding:18px 20px 24px;scrollbar-width:thin}',
    '.ca-body::-webkit-scrollbar{width:4px}',
    '.ca-body::-webkit-scrollbar-thumb{background:#222e3d;border-radius:2px}',

    /* Questions and result headings take the accent so they never read as
       just another option title; option titles sit a shade below white. */
    '.ca-q{font-family:"Barlow Condensed",Arial,sans-serif;font-size:21px;font-weight:600;',
      'line-height:1.25;margin:0 0 4px;color:#63b8e8;letter-spacing:.01em}',
    '.ca-hint{margin:0 0 15px;font-size:13px;color:#8496a6;line-height:1.5}',

    '.ca-opt{display:block;width:100%;text-align:left;background:#161f2b;border:1px solid #24313f;',
      'border-left:3px solid #24313f;border-radius:7px;padding:12px 14px;margin-bottom:9px;',
      'cursor:pointer;font-family:inherit;color:inherit;text-decoration:none;box-sizing:border-box;',
      'transition:border-color .16s,background .16s}',
    '.ca-opt:hover{background:#1b2634;border-color:#0082CA;border-left-color:#0082CA}',
    '.ca-opt:focus-visible{outline:2px solid #7fd0ff;outline-offset:2px}',
    '.ca-opt b{display:block;font-family:"Barlow Condensed",Arial,sans-serif;font-size:17px;',
      'font-weight:600;letter-spacing:.02em;color:#ccd9e6;margin-bottom:1px}',
    /* Direct child only — otherwise this also catches the inline arrow
       inside <b> and drops it onto a line of its own. */
    '.ca-opt > span{display:block;font-size:12.5px;color:#8496a6;line-height:1.45}',

    /* shoe result rows */
    '.ca-shoes{display:flex;flex-direction:column;gap:8px;margin-top:4px}',
    '.ca-shoe{display:block;width:100%;text-align:left;background:#161f2b;border:1px solid #24313f;',
      'border-left:3px solid #2c8fb5;border-radius:7px;padding:11px 13px;cursor:pointer;',
      'font-family:inherit;color:inherit;transition:border-color .16s,background .16s}',
    '.ca-shoe:hover{background:#1b2634;border-color:#0082CA;border-left-color:#0082CA}',
    '.ca-shoe:focus-visible{outline:2px solid #7fd0ff;outline-offset:2px}',
    '.ca-shoe-top{display:flex;align-items:center;gap:7px;margin-bottom:2px}',
    '.ca-shoe-top b{font-family:"Barlow Condensed",Arial,sans-serif;font-size:18px;font-weight:700;',
      'letter-spacing:.03em;color:#fff}',
    '.ca-new{font-family:"Barlow Condensed",Arial,sans-serif;font-size:9.5px;font-weight:800;',
      'letter-spacing:.12em;color:#fff;background:linear-gradient(135deg,#0ea5e9,#0284c7);',
      'padding:2px 6px;border-radius:9px}',
    '.ca-tier{margin-left:auto;font-size:11px;color:#7d8c9c;letter-spacing:.04em}',
    '.ca-shoe-tag{display:block;font-size:13px;color:#c3d0dc;line-height:1.4;margin-bottom:3px}',
    '.ca-shoe-meta{display:block;font-size:11.5px;color:#7d8c9c;line-height:1.4}',

    '.ca-spec{display:grid;grid-template-columns:1fr;gap:6px;margin-top:4px}',
    '.ca-spec div{display:flex;gap:10px;font-size:13px;color:#cdd9e4;line-height:1.45}',
    '.ca-spec span{flex:0 0 74px;color:#7d8c9c;font-size:11.5px;letter-spacing:.06em;padding-top:1px}',

    '.ca-feat{margin:0;padding-left:18px}',
    '.ca-feat li{font-size:13.5px;color:#c3d0dc;line-height:1.5;margin-bottom:4px}',

    '.ca-res{background:#12202c;border:1px solid #1d4763;border-radius:8px;padding:15px 17px;margin-bottom:14px}',
    '.ca-res .ca-lead{font-family:"Barlow Condensed",Arial,sans-serif;font-size:20px;font-weight:600;',
      'line-height:1.28;margin:0 0 12px;color:#63b8e8}',
    '.ca-part{display:flex;align-items:center;gap:10px;padding:10px 12px;background:#0d1822;',
      'border:1px solid #1d2c3a;border-radius:6px;margin-bottom:8px;width:100%;box-sizing:border-box;',
      'text-align:left;font-family:inherit;color:inherit;text-decoration:none}',
    '.ca-part:last-child{margin-bottom:0}',
    '.ca-part-link{cursor:pointer;transition:border-color .16s,background .16s}',
    '.ca-part-link:hover{background:#12222f;border-color:#0082CA}',
    '.ca-part-link:hover .ca-arrow{opacity:1;transform:translate(1px,-1px)}',
    '.ca-part-link:focus-visible{outline:2px solid #7fd0ff;outline-offset:2px}',
    '.ca-panel .ca-arrow{display:inline-block;margin-left:5px;font-size:.82em;color:#4aa8e0;',
      'opacity:.75;line-height:1;transition:opacity .16s,transform .16s}',

    '.ca-lead-link{display:block;width:100%;text-align:left;background:none;border:none;padding:0;',
      'cursor:pointer;color:#63b8e8;font-family:"Barlow Condensed",Arial,sans-serif;font-size:20px;',
      'font-weight:600;line-height:1.28;margin:0 0 12px}',
    '.ca-lead-link:hover{color:#a5dcf8;text-decoration:underline;text-underline-offset:3px}',
    '.ca-lead-link:focus-visible{outline:2px solid #7fd0ff;outline-offset:3px;border-radius:4px}',

    '.ca-shoe-wrap{display:flex;gap:6px;align-items:stretch}',
    '.ca-shoe-wrap .ca-shoe{flex:1;min-width:0}',
    '.ca-jump{flex:0 0 38px;background:#161f2b;border:1px solid #24313f;border-radius:7px;',
      'color:#4aa8e0;font-size:16px;cursor:pointer;font-family:inherit;',
      'transition:border-color .16s,background .16s,color .16s}',
    '.ca-jump:hover{background:#1b2634;border-color:#0082CA;color:#8ed0f7}',
    '.ca-jump:focus-visible{outline:2px solid #7fd0ff;outline-offset:2px}',

    /* The primary action, so it carries the accent rather than sitting
       in the same grey as the neutral options. */
    '.ca-opt-go{background:#123048;border-color:#1d5a80;border-left-color:#0082CA;margin-bottom:14px}',
    '.ca-opt-go:hover{background:#163a57}',
    '.ca-opt-go b{color:#9ad8fa}',
    '.ca-opt-go .ca-arrow{opacity:1;color:#9ad8fa}',


    /* the catalog card the dealer lands on, briefly outlined */
    '.ca-flash{outline:2px solid #0082CA !important;outline-offset:3px;',
      'border-radius:10px;transition:outline-color .4s}',
    '.ca-dot{width:15px;height:15px;border-radius:50%;flex-shrink:0;box-shadow:inset 0 0 0 1px rgba(0,0,0,.35)}',
    '.ca-pn{font-family:"Barlow Condensed",Arial,sans-serif;font-size:19px;font-weight:700;',
      'letter-spacing:.03em;color:#fff}',
    '.ca-meta{font-size:12px;color:#8496a6;margin-left:auto;text-align:right;line-height:1.4}',

    '.ca-p{font-size:14px;line-height:1.6;margin:0 0 10px;color:#c3d0dc}',
    '.ca-p:last-child{margin-bottom:0}',
    '.ca-p strong{color:#e8f0f8;font-weight:600}',
    '.ca-p em{color:#e8f0f8;font-style:italic}',

    '.ca-warn{background:#2a1418;border-left:3px solid #d9535f;border-radius:0 6px 6px 0;',
      'padding:11px 14px;margin:12px 0 0;font-size:13px;line-height:1.55;color:#f0c5c9}',
    '.ca-note{background:#0f2028;border-left:3px solid #2c8fb5;border-radius:0 6px 6px 0;',
      'padding:11px 14px;margin:12px 0 0;font-size:13px;line-height:1.55;color:#bcd9e6}',
    '.ca-note strong{color:#e6f2f8}',

    '.ca-sep{height:1px;background:#222e3d;margin:20px 0 16px;border:0}',
    '.ca-lbl{font-family:"Barlow Condensed",Arial,sans-serif;font-size:12px;font-weight:700;',
      'letter-spacing:.16em;color:#6f8090;margin:0 0 9px}',

    '.ca-chips{display:flex;flex-wrap:wrap;gap:7px}',
    '.ca-chip{background:#161f2b;border:1px solid #24313f;border-radius:99px;padding:6px 12px;',
      'font-family:inherit;font-size:12.5px;color:#b8c7d6;cursor:pointer;transition:all .16s}',
    '.ca-chip:hover{border-color:#0082CA;color:#eef4fa;background:#1b2634}',
    '.ca-chip:focus-visible{outline:2px solid #7fd0ff;outline-offset:2px}',

    '.ca-ask{display:flex;gap:7px;margin-top:8px}',
    '.ca-sug{display:flex;flex-direction:column;gap:6px;margin-top:8px}',
    '.ca-sug-row{display:block;width:100%;text-align:left;background:#161f2b;border:1px solid #24313f;',
      'border-left:3px solid #2c8fb5;border-radius:7px;padding:9px 12px;cursor:pointer;',
      'font-family:inherit;color:inherit;transition:border-color .16s,background .16s}',
    '.ca-sug-row:hover{background:#1b2634;border-color:#0082CA;border-left-color:#0082CA}',
    '.ca-sug-row:focus-visible{outline:2px solid #7fd0ff;outline-offset:2px}',
    '.ca-sug-row b{display:block;font-family:"Barlow Condensed",Arial,sans-serif;font-size:16px;',
      'font-weight:700;letter-spacing:.03em;color:#e8f0f8}',
    '.ca-sug-row span{display:block;font-size:11.5px;color:#7d8c9c;line-height:1.4;margin-top:1px}',
    '.ca-sug-none{margin:8px 0 0;font-size:12.5px;color:#7d8c9c;line-height:1.5}',
    '.ca-ask input{flex:1;min-width:0;background:#0d1520;border:1px solid #24313f;border-radius:7px;',
      'padding:10px 12px;font-family:inherit;font-size:13.5px;color:#dfe8f2}',
    '.ca-ask input::placeholder{color:#63737f}',
    '.ca-ask input:focus{outline:none;border-color:#0082CA}',


    '.ca-foot{padding:12px 20px;border-top:1px solid #222e3d;display:flex;gap:8px;flex-shrink:0}',
    '.ca-btn{flex:1;background:#161f2b;border:1px solid #24313f;border-radius:7px;padding:9px 12px;',
      'font-family:"Barlow Condensed",Arial,sans-serif;font-size:14px;font-weight:600;letter-spacing:.06em;',
      'color:#b8c7d6;cursor:pointer;transition:all .16s}',
    '.ca-btn:hover{border-color:#0082CA;color:#eef4fa}',
    '.ca-btn:focus-visible{outline:2px solid #7fd0ff;outline-offset:2px}',
    '.ca-btn[hidden]{display:none}',

    '.ca-src{margin-top:18px;padding-top:12px;border-top:1px solid #1b2531;font-size:11px;',
      'line-height:1.55;color:#5f6e7c}',

    '@media (max-width:520px){.ca-fab{bottom:82px;right:16px;width:50px;height:50px}',
      '.ca-fab svg{width:22px;height:22px}',
      '.ca-tip{bottom:90px;right:74px;font-size:13px;padding:6px 10px}',
      '.ca-panel{width:100%;max-width:100%}}',
    '@media (prefers-reduced-motion:reduce){.ca-panel,.ca-overlay,.ca-fab,.ca-tip{transition:none}',
      '.ca-fab::after{animation:none}}'
  ].join('');

  var style = document.createElement('style');
  style.id = 'shimanoAdvisorStyle';
  style.textContent = CSS;
  (document.head || document.documentElement).appendChild(style);

  var W = HAS_SHOES ? WORDS.shoes : WORDS.cleats;

  var root = document.createElement('div');
  root.innerHTML =
    '<button class="ca-fab" id="caFab" aria-label="Open the shoe and cleat finder">' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" ' +
      'stroke-linecap="round" stroke-linejoin="round">' +
      '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="2.6"/>' +
      '<path d="M12 3v3.2M12 17.8V21M3 12h3.2M17.8 12H21"/></svg></button>' +
    '<div class="ca-tip" id="caTip" role="button" tabindex="0">' + esc(W.label) + '</div>' +
    '<div class="ca-overlay" id="caOverlay"></div>' +
    '<aside class="ca-panel" id="caPanel" role="dialog" aria-modal="true" aria-labelledby="caTitle">' +
      '<div class="ca-head">' +
        '<div><h3 id="caTitle">' + esc(W.title) + '</h3>' +
        '<p>' + esc(W.sub) + '</p></div>' +
        '<button class="ca-x" id="caClose" aria-label="Close">&times;</button>' +
      '</div>' +
      '<div class="ca-body" id="caBody"></div>' +
      '<div class="ca-foot">' +
        '<button class="ca-btn" id="caBack" hidden>&larr; BACK</button>' +
        '<button class="ca-btn" id="caRestart">START OVER</button>' +
      '</div>' +
    '</aside>';
  document.body.appendChild(root);

  var fab     = document.getElementById('caFab');
  var tip     = document.getElementById('caTip');
  var overlay = document.getElementById('caOverlay');
  var panel   = document.getElementById('caPanel');
  var bodyEl  = document.getElementById('caBody');
  var backBtn = document.getElementById('caBack');

  var HOME = HAS_SHOES ? 'home' : 'start';
  var trail = [];

  function askBlock() {
    var list = activeFaq();
    return '<hr class="ca-sep"><p class="ca-lbl">COMMON QUESTIONS</p><div class="ca-chips">' +
      list.map(function (f) { return '<button class="ca-chip" data-faq="' + f.id + '">' + f.chip + '</button>'; }).join('') +
      '</div>' +
      (SHOW_SEARCH
        ? '<p class="ca-lbl" style="margin-top:16px">FIND A MODEL OR PART NUMBER</p>' +
          '<div class="ca-ask"><input id="caInput" type="text" autocomplete="off" ' +
          'placeholder="RC910, XC703, CL-SL130\u2026" aria-label="Search a model or part number">' +
          '</div><div class="ca-sug" id="caSug"></div>'
        : '') +
      '<p class="ca-src">' +
      (HAS_SHOES ? 'Shoe answers are read live from this catalog, so they always match the order book. ' : '') +
      'Cleat answers follow a fixed, verified path &mdash; nothing here is generated text. ' +
      'Shimano technical material, 17 September 2026.</p>';
  }

  function paint(html, key) {
    if (key) trail.push(key);
    backBtn.hidden = trail.length < 2;
    bodyEl.innerHTML = html + askBlock();
    bodyEl.scrollTop = 0;
  }

  function stepHtml(s) {
    var html = '';
    if (s.result || s.lead) {
      html += '<div class="ca-res"><p class="ca-lead">' + s.lead + '</p>';
      if (s.result) html += partRow(s.result);
      if (s.alt)    html += partRow(s.alt);
      html += '</div>';
      /* The way into the catalog, before the explanation — same block the
         shoe card uses, one per recommended part. */
      if (s.result) html += catalogCta(s.result);
      if (s.alt)    html += catalogCta(s.alt);
    }
    if (s.q && !s.lead) html += '<p class="ca-q">' + s.q + '</p>';
    if (s.hint) html += '<p class="ca-hint">' + s.hint + '</p>';
    if (s.body) html += paras(s.body);
    if (s.note) html += '<div class="ca-note">' + s.note + '</div>';
    if (s.warn) html += '<div class="ca-warn">' + s.warn + '</div>';
    if (s.opts) {
      html += '<div style="margin-top:14px">' + s.opts.filter(function (o) {
        return !o.needsShoes || HAS_SHOES;
      }).map(function (o) {
        var attr = o.act ? 'data-act="' + o.act + '"' : 'data-go="' + o.go + '"';
        return '<button class="ca-opt" ' + attr + '><b>' + o.label + '</b>' +
               (o.sub ? '<span>' + o.sub + '</span>' : '') + '</button>';
      }).join('') + '</div>';
    }
    return html;
  }

  function spdCleatResult() {
    var codes = spdCleatCodes();
    return stepHtml({
      lead: 'SPD two-bolt &mdash; a separate system entirely.',
      body: ['The off-road SPD system is untouched by the SPD-SLR launch. Nothing about it has changed.',
             codes.length
               ? 'In this catalog: <strong>' + codes.join('</strong>, <strong>') + '</strong>. ' +
                 'SM-SH51 is single-release, SM-SH56 multi-release &mdash; the multi-release lets the foot come out at more angles, which suits nervous or newer riders.'
               : 'Order the SPD cleats from the Shoe Cleats SPD (MTB) group in the order book.'],
      warn: 'Neither the SPD-SL nor the SPD-SLR road cleats fit SPD pedals, and SPD cleats do not fit road pedals.'
    });
  }

  function go(key) {
    var s = STEPS[key];
    if (!s) return;
    if (s.dyn === 'spdCleat') { paint(spdCleatResult(), key); return; }
    if (s.dyn === 'shoeCat') {
      pick = { cat: null, fit: null, tier: null };
      paint(stepHtml(stepShoeCat()), key);
      return;
    }
    paint(stepHtml(s), key);
  }

  /* ── Shoe flow actions ── */
  function act(a) {
    var kind = a.split(':')[0], val = a.slice(kind.length + 1);
    if (kind === 'cat')  { pick.cat = val;  pick.fit = null; pick.tier = null; paint(stepHtml(stepShoeFit()), a); return; }
    if (kind === 'fit')  { pick.fit = val;  pick.tier = null; paint(stepHtml(stepShoeTier()), a); return; }
    if (kind === 'tier') {
      pick.tier = val;
      var pool = filterPool();
      var bits = [titleCase(pick.cat)];
      if (pick.fit && pick.fit !== 'any') bits.push(pick.fit + ' fit');
      if (pick.tier && pick.tier !== 'any') bits.push(TIER_LABEL[pick.tier]);
      paint(shoeList(pool, bits.join(' &middot; '),
        'Tap a model for sizes, colours, fitment and features.'), a);
      return;
    }
    if (kind === 'shoe') { paint(shoeDetail(val), a); return; }
    if (kind === 'jump') {
      if (!jumpToModel(val)) {
        /* Not in this page's catalog — hand over to the shoes page. */
        window.location.href = catalogHref(val);
      }
      return;
    }
  }

  function showFaq(f) {
    var html = f.build ? f.build() : ('<p class="ca-q">' + f.q + '</p>' + paras(f.a));
    paint(html, 'faq:' + f.id);
  }

  /* ── Catalog lookup ────────────────────────────────────────────────
     Everything searchable, built from the catalog plus the cleat table.
     A closed set, so a miss is a plain "not stocked" rather than a
     failed attempt at understanding a sentence. */
  function searchIndex() {
    var out = [];
    shoeGroups().forEach(function (g) {
      var p = pedalSys(g.group), v = variants(g);
      out.push({
        label: g.group,
        sub: (p ? p.label : titleCase(g.cat)) +
             (v.min !== null ? ' &middot; ' + v.min + '&ndash;' + v.max : ''),
        act: 'shoe:' + g.group
      });
    });
    Object.keys(CLEAT).forEach(function (pn) {
      var c = CLEAT[pn];
      out.push({ label: pn, sub: c.sys + ' &middot; ' + c.colour + ' &middot; ' + c.float, act: 'jump:' + pn });
    });
    return out;
  }

  function lookup(q) {
    var t = String(q).toLowerCase().replace(/[^a-z0-9]/g, '');
    if (t.length < 2) return [];
    var starts = [], holds = [];
    searchIndex().forEach(function (e) {
      var k = e.label.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (k.indexOf(t) === 0) starts.push(e);
      else if (k.indexOf(t) !== -1) holds.push(e);
    });
    return starts.concat(holds).slice(0, 8);
  }

  /* Rewrites only the suggestion list, so the field keeps focus and the
     caret while the dealer is still typing. */
  function renderSuggestions() {
    var box = document.getElementById('caSug');
    var input = document.getElementById('caInput');
    if (!box || !input) return;
    var q = input.value.trim();
    if (q.replace(/[^a-zA-Z0-9]/g, '').length < 2) { box.innerHTML = ''; return; }
    var hits = lookup(q);
    if (!hits.length) {
      box.innerHTML = '<p class="ca-sug-none">Nothing in this catalog matches &ldquo;' +
        esc(q) + '&rdquo;. Check the spelling, or browse with the guided questions above.</p>';
      return;
    }
    box.innerHTML = hits.map(function (h) {
      return '<button class="ca-sug-row" data-act="' + h.act + '">' +
             '<b>' + h.label + '</b><span>' + h.sub + '</span></button>';
    }).join('');
  }

  /* ── Events ── */

  bodyEl.addEventListener('click', function (e) {
    if (!e.target.closest) return;
    var a = e.target.closest('[data-act]');
    if (a) {
      var v = a.getAttribute('data-act');
      if (v === 'reset') { reset(); return; }
      act(v);
      return;
    }
    var o = e.target.closest('[data-go]');
    if (o) { go(o.getAttribute('data-go')); return; }
    var c = e.target.closest('[data-faq]');
    if (c) {
      var id = c.getAttribute('data-faq');
      var f = FAQ.filter(function (x) { return x.id === id; })[0];
      if (f) showFaq(f);
      return;
    }

  });

  bodyEl.addEventListener('input', function (e) {
    if (e.target && e.target.id === 'caInput') renderSuggestions();
  });

  bodyEl.addEventListener('keydown', function (e) {
    if (!e.target || e.target.id !== 'caInput') return;
    if (e.key === 'Enter') {
      e.preventDefault();
      var first = document.querySelector('#caSug .ca-sug-row');
      if (first) first.click();
    }
  });

  function reset() {
    trail = [];
    pick = { cat: null, fit: null, tier: null };
    go(HOME);
  }

  function replay(key) {
    if (!key) { reset(); return; }
    if (key.indexOf(':') !== -1 && /^(cat|fit|tier|shoe):/.test(key)) act(key);
    else if (key.indexOf('faq:') === 0) {
      var f = FAQ.filter(function (x) { return x.id === key.slice(4); })[0];
      if (f) showFaq(f); else reset();
    } else if (STEPS[key]) go(key);
    else reset();
  }

  backBtn.addEventListener('click', function () {
    trail.pop();
    var prev = trail.pop();
    replay(prev);
  });

  function open() {
    if (!trail.length) reset();
    overlay.classList.add('open');
    panel.classList.add('open');
    tip.classList.add('ca-hide');
    fab.style.setProperty('animation', 'none');
    setTimeout(function () {
      var f = panel.querySelector('.ca-opt, .ca-shoe, .ca-chip');
      if (f) f.focus();
    }, 360);
  }
  function close() {
    overlay.classList.remove('open');
    panel.classList.remove('open');
    tip.classList.remove('ca-hide');
    fab.focus();
  }

  fab.addEventListener('click', open);
  tip.addEventListener('click', open);
  tip.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); }
  });
  overlay.addEventListener('click', close);
  document.getElementById('caClose').addEventListener('click', close);
  document.getElementById('caRestart').addEventListener('click', reset);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && panel.classList.contains('open')) close();
  });

  reset();

  /* ── Deep link: shoes.html?model=RC910 lands straight on the card ──
     The advisor runs on this page anyway, so it handles its own links
     and the catalog page needs no code of its own. */
  (function deepLink() {
    if (!HAS_SHOES) return;
    var m;
    try { m = new URLSearchParams(window.location.search).get('model'); } catch (e) { return; }
    if (!m) return;
    function run() {
      if (!jumpToModel(m)) return;
      try {
        var u = new URL(window.location.href);
        u.searchParams.delete('model');
        window.history.replaceState({}, '', u.pathname + (u.search || '') + u.hash);
      } catch (e) {}
    }
    /* The catalog renders on DOMContentLoaded; wait for the card to exist. */
    setTimeout(run, 400);
  })();
})();
