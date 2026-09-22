/* ═══════════════════════════════════════════════════════════════════════
   CLEAT ADVISOR — SPD-SL / SPD-SLR compatibility assistant
   ───────────────────────────────────────────────────────────────────────
   Drop-in widget for the dealer order book. Add one line to any catalog
   page, next to shared-cart.js:

       <script src="cleat-advisor.js"></script>

   Deliberately rule-based, not an AI chatbot. GitHub Pages is static, so
   any API key shipped in the page would be readable by anyone who opens
   view-source. The answer space here is small and closed, and a wrong
   answer costs a wrong order — so every reply below is a fixed, verified
   path rather than something generated at run time.

   Sources for every claim (17 Sep 2026 SPD-SLR launch):
     bike.shimano.com/en-NA/technologies/details/spd-slr.html
     ride.shimano.com/products/{pd-r9300, pd-r8200, cl-sl130}
     Shimano statement to the cycling press, 17 September 2026
   ═══════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  if (window.__cleatAdvisorLoaded) return;
  window.__cleatAdvisorLoaded = true;

  /* ── Product reference ───────────────────────────────────────────── */

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

  /* ── Decision flow ───────────────────────────────────────────────── */

  var STEPS = {

    start: {
      q: 'Which pedal will the rider use?',
      hint: 'The pedal decides the cleat &mdash; the shoe only matters further down.',
      opts: [
        { label: 'SPD-SL &mdash; existing pedals', sub: 'PD-R9100, PD-R8000, PD-R7000, PD-R550 and earlier', go: 'sl_float' },
        { label: 'SPD-SLR &mdash; new pedals',     sub: 'PD-R9300 (Dura-Ace), PD-R8200 (Ultegra)',           go: 'slr_shoe' },
        { label: 'Not sure which one they have',   sub: 'Help me tell them apart',                            go: 'identify' }
      ]
    },

    identify: {
      q: 'How to tell the two apart',
      body: [
        'SPD-SLR launched on 17 September 2026 and appears only on the PD-R9300 and PD-R8200. Any Shimano road pedal bought before that date is SPD-SL.',
        'On the pedal itself: SPD-SLR has a wider front catch area and an integrated stainless steel contact plate across the body. The model number is printed on the pedal body or the axle end.',
        'Fastest check of all: look at the cleat already on the shoe. A part number starting SM-SH is SPD-SL. One starting CL-SL is SPD-SLR.'
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

    /* ── Results ── */

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
      warn: NEVER_MIX }
  };

  /* ── FAQ bank. keys[] drives both the chips and the free-text match ── */

  var FAQ = [
    { id: 'box',
      chip: 'What comes in the pedal box?',
      q: 'Which cleat is supplied with the pedals?',
      a: ['Both the PD-R9300 and the PD-R8200 ship with a set of <strong>CL-SL110 yellow</strong> cleats, with 6&deg; of float (&plusmn;3&deg;).',
          'This matters at the counter: a customer on non-Shimano shoes who needs the CL-SL130 will end up with an unused yellow set. Tell them before they pay.'],
      keys: ['box', 'included', 'include', 'supplied', 'comes with', 'in the pedal', 'free cleat', 'which cleat comes'] },

    { id: 'mix',
      chip: 'Do the old cleats fit the new pedals?',
      q: 'Are SPD-SL and SPD-SLR interchangeable?',
      a: ['No, in neither direction. ' + NEVER_MIX,
          'SPD-SLR is the first change to Shimano’s road pedal interface in over 20 years, and compatibility with SPD-SL was deliberately dropped to lower the stack height.'],
      keys: ['interchange', 'fit the new', 'fit my old', 'old cleat', 'backward', 'compatible', 'adapter', 'mix', 'work with spd-sl', 'sm-sh on'] },

    { id: 'nonshimano',
      chip: 'Customer has non-Shimano shoes',
      q: 'Which cleat for a non-Shimano shoe?',
      a: ['<strong>On SPD-SL pedals:</strong> nothing changes &mdash; SM-SH10, SM-SH11 or SM-SH12 as before. Shoe brand is irrelevant.',
          '<strong>On the new SPD-SLR pedals:</strong> order the grey <strong>CL-SL130</strong>. The low-stack cleats have almost no fore-aft adjustment of their own, and a non-Shimano shoe usually lacks the extended slots that compensate for it. The CL-SL130 restores the old adjustment range, trading away the lower stack and the weight saving.',
          'Shimano says it works with <em>most</em> &mdash; not all &mdash; non-Shimano three-hole road shoes.'],
      keys: ['non-shimano', 'non shimano', 'other brand', 'specialized', 'fizik', 'sidi', 'giro', 'bont', 'lake', 'different shoe', 'not shimano', 'third party'] },

    { id: 'discontinued',
      chip: 'Is SPD-SL discontinued?',
      q: 'Is SPD-SL being dropped?',
      a: ['No. Shimano has confirmed it will continue to supply the full range of SPD-SL cleats for as long as there is meaningful demand.',
          'A customer on SPD-SL pedals has no reason to change anything. SM-SH10, SM-SH11 and SM-SH12 remain in the order book alongside the new CL-SL range.'],
      keys: ['discontinu', 'dropped', 'phase out', 'phased out', 'stop selling', 'still available', 'end of life', 'obsolete'] },

    { id: 'whatschanged',
      chip: 'What actually changed with SPD-SLR?',
      q: 'What is new about SPD-SLR?',
      a: ['<strong>Stack height</strong> drops 2.3 mm at the pedal and cleat interface, bringing the foot closer to the axle.',
          '<strong>Engagement</strong> is easier: a wider catch zone and an entry angle of 10.5&deg;, down from 15.5&deg; on SPD-SL.',
          '<strong>Cleats</strong> are up to 22% lighter than the SPD-SL equivalents.',
          '<strong>Adjustment</strong> moves from the cleat into the shoe, which is why the new RC910 and RC810 have extended cleat slots.'],
      keys: ['what changed', 'what is new', 'whats new', 'difference between', 'why spd-slr', 'better', 'stack', 'improve', 'benefit'] },

    { id: 'needshoes',
      chip: 'Do they need new shoes too?',
      q: 'Are new shoes required for SPD-SLR?',
      a: ['No. SPD-SLR cleats mount to any standard three-bolt shoe, so the rider can keep their current pair.',
          'But the full benefit &mdash; the lower stack height and the cleat position range it depends on &mdash; only arrives with an SPD-SLR shoe. On any other shoe, check that the rider can still reach their preferred cleat position, and reach for the CL-SL130 if they cannot.'],
      keys: ['new shoes', 'need shoes', 'buy shoes', 'keep my shoes', 'existing shoes', 'must i buy', 'have to buy shoes'] },

    { id: 'newshoes',
      chip: 'Which shoes are new this season?',
      q: 'What are the new shoe models?',
      a: ['<strong>S-PHYRE RC910</strong> &mdash; the flagship, built around SPD-SLR. Carbon Hollow Core midsole, carbon heel cup with Anti-Twist Stabilization, extended cleat slots. Blue, Black, White in Standard, Narrow and Wide.',
          '<strong>RC810</strong> &mdash; dual BOA Li2 dials, external heel stabiliser, rigid carbon midsole. Peach, Black, White in Standard, Narrow and Wide.',
          '<strong>RP102</strong> &mdash; value road shoe for newer riders. Black and White.',
          'The RC910 and RC810 both use DYNALAST 2.0, which is 3 mm wider at the toes and 2 mm wider at the ball of the foot. The Wide fit is wider than before, and a unisex Narrow replaces the old women’s-specific last.'],
      keys: ['new shoe', 'rc910', 'rc810', 'rp102', 'which shoes', 'shoe model', 'dynalast', 'wide', 'narrow', 'sizing', 'fit'] },

    { id: 'grey',
      chip: 'Why is the grey cleat different?',
      q: 'What makes the CL-SL130 different?',
      a: ['It is the only SPD-SLR cleat that keeps the adjustment range of the old SPD-SL cleats, which is exactly what a shoe without extended slots needs.',
          'The trade-off is that it does not deliver the lower stack height or the weight saving of the CL-SL100, CL-SL110 and CL-SL120 &mdash; it has to be bulkier to span a wider range of shoe slots.',
          'It has no SPD-SL equivalent. It exists purely to carry the old system’s adjustment onto the new pedals.'],
      keys: ['grey', 'gray', 'cl-sl130', 'sl130', '130', 'why different', 'transition'] },

    { id: 'float',
      chip: 'Which float should they pick?',
      q: 'How do the float options compare?',
      a: ['<strong>6&deg; (&plusmn;3&deg;), yellow</strong> &mdash; SM-SH11 or CL-SL110. The default, and right for most riders.',
          '<strong>2&deg; (&plusmn;1&deg;), blue</strong> &mdash; SM-SH12 or CL-SL120. More stable, with a little movement left.',
          '<strong>0&deg;, red</strong> &mdash; SM-SH10 or CL-SL100. Fully locked in, for sprinters and racers.',
          'If the rider is happy with what they run now, match the colour across to the other system.'],
      keys: ['float', 'degree', 'yellow or blue', 'red cleat', 'how much movement', 'rotation', 'which colour', 'which color'] }
  ];

  /* ── Styles ──────────────────────────────────────────────────────── */

  var CSS = [
    /* FAB sits directly above the shared-cart FAB (bottom:20 right:20, 56px) */
    '.ca-fab{position:fixed;bottom:88px;right:20px;z-index:9998;width:56px;height:56px;',
      'border-radius:14px;background:linear-gradient(135deg,#0082CA,#005f95);border:none;cursor:pointer;',
      'display:flex;align-items:center;justify-content:center;box-shadow:0 4px 20px rgba(0,130,202,.35);',
      'transition:transform .25s,box-shadow .25s}',
    '.ca-fab:hover{transform:translateY(-2px);box-shadow:0 6px 28px rgba(0,130,202,.5)}',
    '.ca-fab:focus-visible{outline:2px solid #7fd0ff;outline-offset:3px}',
    '.ca-fab svg{width:25px;height:25px;color:#fff}',
    /* Attention ring: three pulses on load, then it settles down for good. */
    '.ca-fab::after{content:"";position:absolute;inset:0;border-radius:14px;border:2px solid #0082CA;',
      'opacity:0;pointer-events:none;animation:caPulse 2.1s ease-out 3}',
    '@keyframes caPulse{0%{opacity:.8;transform:scale(1)}',
      '65%{opacity:0;transform:scale(1.5)}100%{opacity:0;transform:scale(1.5)}}',

    /* Standing label — always on, and clickable so the target is bigger. */
    '.ca-tip{position:fixed;bottom:98px;right:86px;z-index:9998;background:#101922;color:#dfeaf5;',
      'border:1px solid #27394b;border-left:3px solid #0082CA;border-radius:8px;padding:8px 13px;',
      'font-family:"Barlow Condensed",Arial,sans-serif;font-size:14.5px;font-weight:600;',
      'letter-spacing:.05em;white-space:nowrap;cursor:pointer;',
      'transition:opacity .25s,transform .16s,border-color .16s;',
      'box-shadow:0 6px 22px rgba(0,0,0,.45)}',
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

    '.ca-q{font-family:"Barlow Condensed",Arial,sans-serif;font-size:21px;font-weight:600;',
      'line-height:1.25;margin:0 0 4px;color:#f2f7fc}',
    '.ca-hint{margin:0 0 15px;font-size:13px;color:#8496a6;line-height:1.5}',

    '.ca-opt{display:block;width:100%;text-align:left;background:#161f2b;border:1px solid #24313f;',
      'border-left:3px solid #24313f;border-radius:7px;padding:12px 14px;margin-bottom:9px;',
      'cursor:pointer;font-family:inherit;color:inherit;transition:border-color .16s,background .16s}',
    '.ca-opt:hover{background:#1b2634;border-color:#0082CA;border-left-color:#0082CA}',
    '.ca-opt:focus-visible{outline:2px solid #7fd0ff;outline-offset:2px}',
    '.ca-opt b{display:block;font-family:"Barlow Condensed",Arial,sans-serif;font-size:17px;',
      'font-weight:600;letter-spacing:.02em;color:#eef4fa;margin-bottom:1px}',
    '.ca-opt span{display:block;font-size:12.5px;color:#8496a6;line-height:1.45}',

    /* result card */
    '.ca-res{background:#12202c;border:1px solid #1d4763;border-radius:8px;padding:15px 17px;margin-bottom:14px}',
    '.ca-res .ca-lead{font-family:"Barlow Condensed",Arial,sans-serif;font-size:20px;font-weight:600;',
      'line-height:1.28;margin:0 0 12px;color:#f2f7fc}',
    '.ca-part{display:flex;align-items:center;gap:10px;padding:10px 12px;background:#0d1822;',
      'border:1px solid #1d2c3a;border-radius:6px;margin-bottom:8px}',
    '.ca-part:last-child{margin-bottom:0}',
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

    '.ca-sep{height:1px;background:#222e3d;margin:20px 0 16px;border:0}',
    '.ca-lbl{font-family:"Barlow Condensed",Arial,sans-serif;font-size:12px;font-weight:700;',
      'letter-spacing:.16em;color:#6f8090;margin:0 0 9px}',

    '.ca-chips{display:flex;flex-wrap:wrap;gap:7px}',
    '.ca-chip{background:#161f2b;border:1px solid #24313f;border-radius:99px;padding:6px 12px;',
      'font-family:inherit;font-size:12.5px;color:#b8c7d6;cursor:pointer;transition:all .16s}',
    '.ca-chip:hover{border-color:#0082CA;color:#eef4fa;background:#1b2634}',
    '.ca-chip:focus-visible{outline:2px solid #7fd0ff;outline-offset:2px}',

    '.ca-ask{display:flex;gap:7px;margin-top:10px}',
    '.ca-ask input{flex:1;min-width:0;background:#0d1520;border:1px solid #24313f;border-radius:7px;',
      'padding:10px 12px;font-family:inherit;font-size:13.5px;color:#dfe8f2}',
    '.ca-ask input::placeholder{color:#63737f}',
    '.ca-ask input:focus{outline:none;border-color:#0082CA}',
    '.ca-ask button{background:#0082CA;border:none;border-radius:7px;padding:0 15px;color:#fff;',
      'font-family:"Barlow Condensed",Arial,sans-serif;font-size:14px;font-weight:700;letter-spacing:.08em;cursor:pointer}',
    '.ca-ask button:hover{background:#0092e2}',

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

  /* ── Build DOM ───────────────────────────────────────────────────── */

  var style = document.createElement('style');
  style.id = 'cleatAdvisorStyle';
  style.textContent = CSS;
  (document.head || document.documentElement).appendChild(style);

  var root = document.createElement('div');
  root.innerHTML =
    '<button class="ca-fab" id="caFab" aria-label="Open the cleat compatibility advisor">' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" ' +
      'stroke-linecap="round" stroke-linejoin="round">' +
      '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="2.6"/>' +
      '<path d="M12 3v3.2M12 17.8V21M3 12h3.2M17.8 12H21"/></svg></button>' +
    '<div class="ca-tip" id="caTip" role="button" tabindex="0">Cleat compatibility</div>' +
    '<div class="ca-overlay" id="caOverlay"></div>' +
    '<aside class="ca-panel" id="caPanel" role="dialog" aria-modal="true" aria-labelledby="caTitle">' +
      '<div class="ca-head">' +
        '<div><h3 id="caTitle">CLEAT ADVISOR</h3><p>SPD-SL and SPD-SLR compatibility</p></div>' +
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

  var history = [];

  /* ── Rendering helpers ───────────────────────────────────────────── */

  function partRow(pn) {
    var c = CLEAT[pn];
    if (!c) return '';
    return '<div class="ca-part"><span class="ca-dot" style="background:' + c.hex + '"></span>' +
           '<span class="ca-pn">' + pn + '</span>' +
           '<span class="ca-meta">' + c.float + '<br>' + c.sys + ' &middot; ' + c.colour + '</span></div>';
  }

  function paras(arr) {
    return (arr || []).map(function (t) { return '<p class="ca-p">' + t + '</p>'; }).join('');
  }

  function askBlock() {
    return '<hr class="ca-sep"><p class="ca-lbl">COMMON QUESTIONS</p><div class="ca-chips">' +
      FAQ.map(function (f, i) {
        return '<button class="ca-chip" data-faq="' + i + '">' + f.chip + '</button>';
      }).join('') +
      '</div>' +
      '<div class="ca-ask"><input id="caInput" type="text" autocomplete="off" ' +
      'placeholder="Or type a question…" aria-label="Type a question">' +
      '<button id="caSend">ASK</button></div>' +
      '<p class="ca-src">Rule-based advisor &mdash; every answer is a fixed path, not generated text. ' +
      'Based on Shimano technical material and product pages, 17 September 2026. ' +
      'Check the order book for current availability.</p>';
  }

  function render(key, skipHistory) {
    var s = STEPS[key];
    if (!s) return;
    if (!skipHistory) history.push(key);
    backBtn.hidden = history.length < 2;

    var html = '';
    if (s.result || s.lead) {
      html += '<div class="ca-res">';
      html += '<p class="ca-lead">' + s.lead + '</p>';
      if (s.result) html += partRow(s.result);
      if (s.alt)    html += partRow(s.alt);
      html += '</div>';
    }
    if (s.q && !s.lead) html += '<p class="ca-q">' + s.q + '</p>';
    if (s.hint)  html += '<p class="ca-hint">' + s.hint + '</p>';
    if (s.body)  html += paras(s.body);
    if (s.note)  html += '<div class="ca-note">' + s.note + '</div>';
    if (s.warn)  html += '<div class="ca-warn">' + s.warn + '</div>';

    if (s.opts) {
      html += '<div style="margin-top:14px">';
      html += s.opts.map(function (o, i) {
        return '<button class="ca-opt" data-go="' + o.go + '"><b>' + o.label + '</b>' +
               (o.sub ? '<span>' + o.sub + '</span>' : '') + '</button>';
      }).join('');
      html += '</div>';
    }

    html += askBlock();
    bodyEl.innerHTML = html;
    bodyEl.scrollTop = 0;
  }

  function showFaq(f) {
    history.push('faq:' + f.id);
    backBtn.hidden = history.length < 2;
    bodyEl.innerHTML =
      '<p class="ca-q">' + f.q + '</p>' + paras(f.a) + askBlock();
    bodyEl.scrollTop = 0;
  }

  function noMatch(text) {
    history.push('nomatch');
    backBtn.hidden = history.length < 2;
    bodyEl.innerHTML =
      '<p class="ca-q">No stored answer for that</p>' +
      '<p class="ca-hint">This advisor answers from a fixed set of verified replies rather than guessing, ' +
      'so it will not invent one.</p>' +
      paras(['Try one of the common questions below, or run the guided check &mdash; it reaches the right cleat in two or three taps.',
             'For anything outside cleat and pedal compatibility, contact your Shimano representative.']) +
      '<div style="margin-top:14px"><button class="ca-opt" data-go="start">' +
        '<b>Run the guided check</b><span>Which pedal, which shoe, which float</span></button></div>' +
      askBlock();
    bodyEl.scrollTop = 0;
  }

  /* ── Free-text matching ──────────────────────────────────────────── */

  function match(text) {
    var t = ' ' + String(text).toLowerCase().replace(/[^a-z0-9\s-]/g, ' ').replace(/\s+/g, ' ') + ' ';
    var best = null, bestScore = 0;
    for (var i = 0; i < FAQ.length; i++) {
      var score = 0;
      for (var k = 0; k < FAQ[i].keys.length; k++) {
        var key = FAQ[i].keys[k];
        if (t.indexOf(key) !== -1) score += key.length;
      }
      if (score > bestScore) { bestScore = score; best = FAQ[i]; }
    }
    return bestScore >= 3 ? best : null;
  }

  function submitAsk() {
    var input = document.getElementById('caInput');
    if (!input) return;
    var v = input.value.trim();
    if (!v) return;
    var hit = match(v);
    if (hit) showFaq(hit); else noMatch(v);
  }

  /* ── Events ──────────────────────────────────────────────────────── */

  bodyEl.addEventListener('click', function (e) {
    var opt = e.target.closest ? e.target.closest('[data-go]') : null;
    if (opt) { render(opt.getAttribute('data-go')); return; }
    var chip = e.target.closest ? e.target.closest('[data-faq]') : null;
    if (chip) { showFaq(FAQ[+chip.getAttribute('data-faq')]); return; }
    if (e.target && e.target.id === 'caSend') submitAsk();
  });

  bodyEl.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && e.target && e.target.id === 'caInput') {
      e.preventDefault();
      submitAsk();
    }
  });

  function open() {
    if (!history.length) render('start');
    overlay.classList.add('open');
    panel.classList.add('open');
    tip.classList.add('ca-hide');
    // The ring has done its job once the panel has been opened.
    fab.style.setProperty('animation', 'none');
    setTimeout(function () {
      var f = panel.querySelector('.ca-opt, .ca-chip');
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

  document.getElementById('caRestart').addEventListener('click', function () {
    history = [];
    render('start');
  });

  backBtn.addEventListener('click', function () {
    history.pop();                       // current
    var prev = history.pop();            // target, re-pushed by render
    if (!prev || prev.indexOf('faq:') === 0 || prev === 'nomatch') {
      history = [];
      render('start');
    } else {
      render(prev);
    }
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && panel.classList.contains('open')) close();
  });

  render('start', true);
  history = ['start'];
  backBtn.hidden = true;
})();
