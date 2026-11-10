/* ═══════════════════════════════════════════════════════════════════════
   TOP PICKS — "Most requested" strip under the category video
   ───────────────────────────────────────────────────────────────────────
   Load on hardgoods.html AFTER the main script and shared-cart.js:

       <script src="top-picks.js"></script>

   To switch it off, remove that line. Nothing else depends on it.

   Adding a group: add an entry to TOP_PICKS below, keyed by the CATALOG
   group name (same key as CATEGORY_VIDEOS), with 3-6 item codes.

   Rules
   - Stock is read live from allItems, so the daily stock update applies.
   - Unavailable or missing codes are skipped; fewer than 3 valid picks
     hides the strip for that group.
   - Add uses the page's own setQty(), so the cart, N/A guard and
     shared cart behave exactly like the table rows below.
   ═══════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  if (window.__topPicks) return;
  window.__topPicks = true;

  var MIN_PICKS = 3;

  /* Picks ranked per group by a blend of 2026 revenue (60%) and units (40%),
     invoiced + open, from the TUG sales report (9 Nov 2026), limited to items
     that exist in this catalog and are available / ETD. Refresh from a new report. */
  window.TOP_PICKS = window.TOP_PICKS || {
    'Bottom Bracket': {
      title: 'Top Picks',
      sub: 'Best sellers · 2026',
      picks: [
        { code: 'ISMBB9241B', model: 'SM-BB92', tag: 'Bottom bracket', spec: 'PrFit 86.5mm · Road' },
        { code: 'IBBR9100B', model: 'BB-R9100', tag: 'Bottom bracket', spec: 'BSA' },
        { code: 'ISMBB7241B', model: 'SM-BB72', tag: 'Bottom bracket', spec: 'PrFit 86.5mm · Road' },
        { code: 'ISMBBR60B', model: 'SM-BBR60', tag: 'Road', spec: 'Ultegra · BSA 68mm · Hollowtech II' },
        { code: 'IBBR9100I', model: 'BB-R9100', tag: 'Road', spec: 'Dura-Ace · Italian 70mm' },
        { code: 'EBBRS501B', model: 'BB-RS501', tag: 'Road + MTB', spec: 'BSA threaded · Hollowtech II' },
        { code: 'ISMBB93B', model: 'SM-BB93', tag: 'MTB · XTR', spec: 'BSA 68mm · Hollowtech II' },
        { code: 'ISMBB7141B', model: 'SM-BB71', tag: 'Bottom bracket', spec: 'PrFit 86.5mm · Road' },
        { code: 'EBBUN300C18X', model: 'BB-UN300', tag: 'Bottom bracket', spec: 'BSA 118/73mm · Square' },
        { code: 'EBBRS500PB', model: 'BB-RS500', tag: 'Road', spec: 'Press-fit · Hollowtech II' }
      ]
    },
    'Chain': {
      title: 'Top Picks',
      sub: 'Best sellers · 2026',
      picks: [
        { code: 'ICNM9100126Q', model: 'CN-M9100', tag: 'Chain', spec: '126 Links · 11/12-speed' },
        { code: 'ICNM8100126Q', model: 'CN-M8100', tag: 'MTB · Deore XT', spec: '12-speed · 126 links · Quick Link' },
        { code: 'ECNHG71C116I', model: 'CN-HG71', tag: '6/7/8-speed', spec: '6/7/8-speed · 116 links' },
        { code: 'ICNHG60111116Q', model: 'CN-HG601', tag: 'Road + MTB', spec: '11-speed · 116 links · Quick Link' },
        { code: 'ICNM7100126Q', model: 'CN-M7100', tag: 'Chain', spec: '126 Links · SLX 12-speed' },
        { code: 'ECNHG40116Q', model: 'CN-HG40', tag: 'Entry · 6/7/8-speed', spec: '6/7/8-speed · 116 links' },
        { code: 'ICNM9100138Q', model: 'CN-M9100', tag: 'Chain', spec: '138 Links · 11/12-speed' },
        { code: 'ICNHG90111116Q', model: 'CN-HG901', tag: 'Chain', spec: '116 Links · 11-speed' },
        { code: 'ICNHG70111126Q', model: 'CN-HG701', tag: 'Chain', spec: '126 Links · 11-speed' },
        { code: 'ICNHG70111116Q', model: 'CN-HG701', tag: 'Road + MTB', spec: '11-speed · 116 links · Quick Link' }
      ]
    },
    'Cassettes': {
      title: 'Top Picks',
      sub: 'Best sellers · 2026',
      picks: [
        { code: 'ICSR920012130', model: 'CS-R9200', tag: 'Cassette', spec: '12-speed 11-30T · Dura-Ace' },
        { code: 'ICSR920012134', model: 'CS-R9200', tag: 'Cassette', spec: '12-speed 11-34T · Dura-Ace' },
        { code: 'ICSR810112130', model: 'CS-R8101', tag: 'Cassette', spec: '12-speed 11-30T · Ultegra' },
        { code: 'ICSR810112134', model: 'CS-R8101', tag: 'Road · Ultegra', spec: '12-speed · 11-34T' },
        { code: 'ICSR710112134', model: 'CS-R7101', tag: 'Road · 105', spec: '12-speed · 11-34T' },
        { code: 'ICSR800011132', model: 'CS-R8000', tag: 'Cassette', spec: '11-speed 11-32T · Ultegra' },
        { code: 'ICSR700011132', model: 'CS-R7000', tag: 'Cassette', spec: '11-speed 11-32T · 105' },
        { code: 'ICSHG508225', model: 'CS-HG50', tag: 'Cassette', spec: '8-speed 12-25T · Claris' },
        { code: 'ICSR800011128', model: 'CS-R8000', tag: 'Cassette', spec: '11-speed 11-28T · Ultegra' },
        { code: 'ECSHG318134', model: 'CS-HG31', tag: 'Cassette', spec: '8-speed 11-34T · Altus' }
      ]
    },
    'Crankset': {
      title: 'Top Picks',
      sub: 'Best sellers · 2026',
      picks: [
        { code: 'IFCR9200PAXXF', model: 'FC-R9200', tag: 'Crankset', spec: '12-speed · 165mm w/o CR' },
        { code: 'IFCR9200AX26', model: 'FC-R9200', tag: 'Crankset', spec: '12-speed · 52/36T 165mm' },
        { code: 'IFCR8100AX26', model: 'FC-R8100', tag: 'Crankset', spec: '12-speed · 52/36T 165mm' },
        { code: 'IFCR9200PXCX40', model: 'FC-R9200PX', tag: 'Crankset', spec: '11-speed · 54/40T 170mm' },
        { code: 'IFCR8100CX26', model: 'FC-R8100', tag: 'Road · Ultegra', spec: '2x12 · 52/36T · 170mm' },
        { code: 'IFCR9200CX40', model: 'FC-R9200', tag: 'Crankset', spec: '12-speed · 54/40T 170mm' },
        { code: 'IFCR9200MX40', model: 'FC-R9200', tag: 'Crankset', spec: '12-speed · 54/40T 160mm w/o CG' },
        { code: 'IFCR9200PCXXF', model: 'FC-R9200', tag: 'Crankset', spec: '12-speed · 170mm w/o CR' },
        { code: 'IFCR7100AX26', model: 'FC-R7100', tag: 'Crankset', spec: '12-speed Black · 52/36T 165mm' },
        { code: 'IFCR9200PDXXF', model: 'FC-R9200', tag: 'Crankset', spec: '12-speed · 172.5mm w/o CR' }
      ]
    },
    'Rotors': {
      title: 'Top Picks',
      sub: 'Best sellers · 2026',
      picks: [
        { code: 'IRTCL900SI', model: 'RT-CL900 · 160mm', tag: 'Road', spec: 'Center Lock · internal lockring' },
        { code: 'IRTCL900SSI', model: 'RT-CL900', tag: 'Disc rotor', spec: '140mm Lock Int. · w/LRing' },
        { code: 'IRTCL800SI', model: 'RT-CL800 · 160mm', tag: 'Gravel · GRX', spec: 'Center Lock · internal lockring' },
        { code: 'IRTCL800SSI', model: 'RT-CL800', tag: 'Disc rotor', spec: '140mm Lock Int. · w/LRing' },
        { code: 'IRTCL800SE', model: 'RT-CL800 · 160mm', tag: 'Gravel · GRX', spec: 'Center Lock · external lockring' },
        { code: 'IRTCL800SSE', model: 'RT-CL800', tag: 'Disc rotor', spec: '140mm Lock Ext. · w/LRing' },
        { code: 'IRTCL900SE', model: 'RT-CL900', tag: 'Disc rotor', spec: '160mm Lock Ext. · w/LRing' },
        { code: 'ERTCL700SSI', model: 'RT-CL700', tag: 'Disc rotor', spec: '140mm Lock Int. · w/LRing' },
        { code: 'ESMRT66SP', model: 'SM-RT66', tag: 'Disc rotor', spec: '160mm 6-Bolt' },
        { code: 'ESMRT64SSI3C', model: 'SM-RT64', tag: 'Disc rotor', spec: '140mm Lock Int. · w/LRing Black' }
      ]
    },
    'DiscBreakPads': {
      title: 'Top Picks',
      sub: 'Best sellers · 2026',
      picks: [
        { code: 'EBPL05ARFA', model: 'L05A', tag: 'Resin · Road', spec: '1 pair · 105 / Ultegra / Dura-Ace disc' },
        { code: 'IBPL04CMFA', model: 'L04C', tag: 'Metal', spec: '1 pair' },
        { code: 'EBPL05ARFBS', model: 'L05A', tag: 'Resin pads', spec: '25 Pairs' },
        { code: 'EBPB05SRXA', model: 'B05S', tag: 'Resin · MTB', spec: '1 pair · for BR-MT200 / MT400 / MT500' },
        { code: 'EBPK05SRXA', model: 'K05S', tag: 'Resin pads', spec: '1 pair' },
        { code: 'EBPJ05ARFA', model: 'J05A', tag: 'Resin', spec: '1 pair' },
        { code: 'EBPB05SRXCS', model: 'B05S', tag: 'Resin pads', spec: '50 Pairs' },
        { code: 'EBPD03SRXA', model: 'D03S', tag: 'Resin', spec: '1 pair' },
        { code: 'IBPK05TIRXA', model: 'K05T', tag: 'Resin pads', spec: '1 pair' },
        { code: 'IBPJ04CMFA', model: 'J04C', tag: 'Metal', spec: '1 pair · XTR / XT / SLX / Deore 2-piston' }
      ]
    },
    'Dreailleur': {
      title: 'Top Picks',
      sub: 'Best sellers · 2026',
      picks: [
        { code: 'IRDR9250F', model: 'RD-R9250', tag: 'Rear derailleur', spec: '12-speed Di2 · Dura-Ace' },
        { code: 'IRDR8150F', model: 'RD-R8150', tag: 'Rear derailleur', spec: '12-speed Di2 · Ultegra' },
        { code: 'IFDR9250F', model: 'FD-R9250', tag: 'Front derailleur', spec: '12-speed Di2 · Brazed-On' },
        { code: 'ERDTY300D', model: 'RD-TY300', tag: 'Tourney', spec: '6/7-speed' },
        { code: 'IRDR7150E', model: 'RD-R7150', tag: 'Rear derailleur', spec: '12-speed Di2 · 105' },
        { code: 'ERDU4000GS', model: 'RD-U4000', tag: 'Rear derailleur', spec: '9-speed SGS · Cues' },
        { code: 'ERDU6000GS', model: 'RD-U6000', tag: 'Rear derailleur', spec: '10/11-speed GS · Cues' },
        { code: 'IFDR8150F', model: 'FD-R8150', tag: 'Front derailleur', spec: '12-speed Di2 · DS Brazed-On' },
        { code: 'ERDM310DL', model: 'RD-M310', tag: 'MTB · Altus', spec: '7/8-speed' },
        { code: 'ERDTX800SGSL', model: 'RD-TX800', tag: 'Rear derailleur', spec: '7/8-speed Black · Tourney TX' }
      ]
    },
    'STI Shifters Sets': {
      title: 'Top Picks',
      sub: 'Best sellers · 2026',
      picks: [
        { code: 'ISTR8170LF', model: 'ST-R8170', tag: 'STI lever · left', spec: '2-speed Di2 · Ultegra' },
        { code: 'ISTR9180R', model: 'ST-R9180', tag: 'STI lever · right', spec: '11-speed Di2 · Dura-Ace TT' },
        { code: 'ESTEF5004PV8A3', model: 'ST-EF500 · set', tag: 'MTB / Trekking', spec: 'Left + right · 3x8-speed' },
        { code: 'ISTR9180L', model: 'ST-R9180', tag: 'STI lever · left', spec: '2-speed Di2 · Dura-Ace TT/Tri' },
        { code: 'ISTR9270LF', model: 'ST-R9270', tag: 'STI lever · left', spec: '2-speed · Dura-Ace' },
        { code: 'ISTR9270RF', model: 'ST-R9270', tag: 'STI lever · right', spec: '12-speed · Dura-Ace' },
        { code: 'ESTR2000RIA', model: 'ST-R2000-R', tag: 'STI lever · right', spec: '8-speed · Claris' },
        { code: 'ESTR3000RIA', model: 'ST-R3000', tag: 'STI lever · right', spec: '9-speed · Sora' },
        { code: 'ESTR2000LIA', model: 'ST-R2000-L', tag: 'STI lever · left', spec: '2-speed · Claris' },
        { code: 'ESTR3000LIA', model: 'ST-R3000', tag: 'STI lever · left', spec: '2-speed · Sora' }
      ]
    },
    'HUBS': {
      title: 'Top Picks',
      sub: 'Best sellers and featured hubs',
      picks: [
        { code: 'EFHQC300HMBZBP', model: 'FH-QC300-HM', tag: 'Rear hub', spec: '8/11-speed 135/32 Black · Disc Brake CL' },
        { code: 'EHBQC300BALP', model: 'HB-QC300', tag: 'Front hub', spec: '100/32 Black · Disc Brake CL' },
        { code: 'EHBTC50015B', model: 'HB-TC500-15', tag: 'Front · Trekking / MTB', spec: 'Thru axle · Center Lock' },
        { code: 'EFHTC500HMB', model: 'FH-TC500-HM', tag: 'Rear · 8/11-speed', spec: 'Thru axle · Center Lock' },
        { code: 'EFHTC500HMBC', model: 'FH-TC500-HM-B', tag: 'Rear · 8/11-speed', spec: 'Thru axle · Center Lock' },
        { code: 'EFHTC500MSA', model: 'FH-TC500-MS', tag: 'Rear · 12-speed', spec: 'Thru axle · Center Lock' },
        { code: 'EHBM8110BX', model: 'HB-M8110', tag: 'Front · Deore XT', spec: 'Thru axle · Center Lock' },
        { code: 'EFHM8110B', model: 'FH-M8110', tag: 'Rear · Deore XT', spec: '12-speed · Center Lock' },
        { code: 'EFHM8110BB', model: 'FH-M8110-B', tag: 'Rear · Deore XT', spec: '12-speed · Center Lock' },
        { code: 'EHBM5100B', model: 'HB-M5100', tag: 'Front · Deore', spec: 'Center Lock' }
      ]
    },
    'Wheels': {
      title: 'Top Picks',
      sub: 'Best sellers · 2026',
      picks: [
        { code: 'EWHRS370LREDB', model: 'WH-RS370 · rear', tag: 'Wheel', spec: 'Tubeless Disc Brake E-thru' },
        { code: 'EWHRS370LFEDB', model: 'WH-RS370 · front', tag: 'Wheel', spec: 'Tubeless Disc Brake E-thru' },
        { code: 'EWHR9270C60LREDX', model: 'WH-R9270-C60 · rear', tag: 'Wheel', spec: 'Carbon Tubeless Disc brake E-thru' },
        { code: 'EWHR9270C60LFEDX', model: 'WH-R9270-C60 · front', tag: 'Wheel', spec: 'Carbon Tubeless Disc brake E-thru' },
        { code: 'EWHR8170C60LRED', model: 'WH-R8170-C60 · rear', tag: 'Wheel', spec: 'Tubeless Disc Brake E-thru' },
        { code: 'EWHR8170C60LFED', model: 'WH-R8170-C60 · front', tag: 'Wheel', spec: 'Tubeless Disc Brake E-thru' },
        { code: 'EWHRS100RCB', model: 'WH-RS100 · rear', tag: 'Wheel', spec: 'Clincher Rim Brake QR' },
        { code: 'EWHR9270C36LREDX', model: 'WH-R9270-C36 · rear', tag: 'Wheel', spec: 'Tubeless Disc Brake E-thru' },
        { code: 'EWHRS100FB', model: 'WH-RS100 · front', tag: 'Wheel', spec: 'Clincher Rim Brake QR' },
        { code: 'EWHR9270C50LREDX', model: 'WH-R9270-C50 · rear', tag: 'Wheel', spec: 'Carbon Tubeless Disc brake E-thru' }
      ]
    },
    'Cables': {
      title: 'Top Picks',
      sub: 'Best sellers · 2026',
      picks: [
        { code: 'ISMBH90JKSSL170', model: 'SM-BH90-JK-SSR', tag: 'Brake hose', spec: '1700mm Black' },
        { code: 'ISMBH90BOX01', model: 'SM-BH90', tag: 'Brake hose', spec: '30m · Black' },
        { code: 'ESMSCINNER', model: '1.2x2100mm 100pcs', tag: 'Shift Inner Cable Box', spec: '' },
        { code: 'ISMBH90JKSSL100', model: 'SM-BH90-JK-SSR', tag: 'Brake hose', spec: '1000mm Black' },
        { code: 'ISMBH90SBL170', model: 'SM-BH90-SB', tag: 'Brake hose', spec: '1700mm Black' },
        { code: 'ISMBH59SBL170', model: 'SM-BH59-SB', tag: 'Disc brake hose', spec: '1700mm' },
        { code: 'Y63Z27000', model: 'ST-9000', tag: 'Cable cap', spec: 'w/ Short Nose' },
        { code: 'ESMBH59JKL100', model: 'SM-BH59', tag: 'Brake hose', spec: '1000mm Black' },
        { code: 'ESMBH59BOX01', model: 'SM-BH59', tag: 'Brake hose', spec: '30m · Black' },
        { code: 'ISMBH90SBLSL200', model: 'SM-BH90-SBLS', tag: 'Brake hose', spec: '2000mm Black · Saint' }
      ]
    },
    'Brake Sets': {
      title: 'Top Picks',
      sub: 'Best sellers · 2026',
      picks: [
        { code: 'IR9270DRRDSC170F', model: 'BR-R9270 · rear', tag: 'Disc brake set', spec: 'ST-R9270 lever set' },
        { code: 'IR8170DRRDSC170F', model: 'BR-R8170 · rear', tag: 'Disc brake set', spec: 'ST-R8170 lever set' },
        { code: 'IR8170DLF6SC100F', model: 'BR-R8170 · front', tag: 'Disc brake set', spec: 'ST-R8170 lever set' },
        { code: 'IR9270DLF6SC100F', model: 'BR-R9270 · front', tag: 'Disc brake set', spec: 'ST-R9270 lever set' },
        { code: 'IR7170DRRDSC170E', model: 'BR-7170 · rear', tag: 'Disc brake set', spec: 'ST-R7170 lever set' },
        { code: 'IR7170DLF6SC100E', model: 'BR-7170 · front', tag: 'Disc brake set', spec: 'ST-R7170 lever set' },
        { code: 'EMT201KLFPRA100', model: 'BR-MT200 · front', tag: 'MTB · Altus', spec: 'Front set' },
        { code: 'EMT201KRRXRA170', model: 'BR-MT200 · rear', tag: 'MTB · Altus', spec: 'Rear set' },
        { code: 'ESMRTAD05', model: 'SM-RTAD05', tag: 'Rotor adapter', spec: 'for 6 Bolt Disc' },
        { code: 'EBLMT200RL', model: 'BL-MT200', tag: 'Brake lever · right', spec: '3-fgr Black · Altus Disc Brake' }
      ]
    },
    'Brake Shoes': {
      title: 'Top Picks',
      sub: 'Best sellers · 2026',
      picks: [
        { code: 'Y8L298071', model: 'BR-9000', tag: 'Brake Shoes R55C4 Carbon', spec: '/7900 Dura-Ace 50 pairs' },
        { code: 'Y8PP98060', model: 'BR-R9100', tag: 'Brake Shoes R55C4 Carbon', spec: 'Dura-Ace 1 pair' },
        { code: 'Y8BM9810A', model: 'BR-MX70', tag: 'Brake shoes', spec: 'M70T3 · Deore 1 pair' },
        { code: 'Y8BM9803A', model: 'BR-MX70', tag: 'Brake shoes', spec: 'M70T4 · Deore 1 pair' },
        { code: 'Y8L298070', model: 'BR-9000', tag: 'Brake Shoes R55C4 Carbon', spec: '/7900 Dura-Ace 1 pair' },
        { code: 'Y8GP9810A', model: 'BR-M420', tag: 'Brake shoes', spec: 'S65T · 10 pairs' },
        { code: 'Y8L298062', model: 'BR-9000', tag: 'Brake Shoes R55C4 Cart-t', spec: '/7900 Dura-Ace 2 pairs' },
        { code: 'Y2J398010', model: 'BR-R8100', tag: 'Brake shoes', spec: 'R55C4 · Ultegra 1 pair' },
        { code: 'Y8L298050', model: 'BR-9000', tag: 'Brake shoes', spec: 'Set R55C4 Cart-type · Dura-Ace 1 pair' },
        { code: 'Y88T98020', model: 'BR-5800', tag: 'Brake shoes', spec: 'Set R55C4 Cart-type · Black 105 1 pair' }
      ]
    },
    'DI2': {
      title: 'Top Picks',
      sub: 'Best sellers · 2026',
      picks: [
        { code: 'IEWEC300A', model: 'EW-EC300', tag: 'Charging cable', spec: '1500mm' },
        { code: 'IEWSD300L120', model: 'EW-SD300 · 1200mm', tag: 'Di2 wire', spec: 'External routing' },
        { code: 'IEWSD300L140', model: 'EW-SD300', tag: 'Di2 wire', spec: '1400mm Black · External Routing' },
        { code: 'IEWSD300L160', model: 'EW-SD300', tag: 'Di2 wire', spec: '1600mm Black · External Routing' },
        { code: 'IEWSD300L100', model: 'EW-SD300 · 1000mm', tag: 'Di2 wire', spec: 'External routing' },
        { code: 'IEWSD300L090', model: 'EW-SD300', tag: 'Di2 wire', spec: '900mm Black · External Routing' },
        { code: 'IEWSD300L080', model: 'EW-SD300 · 800mm', tag: 'Di2 wire', spec: 'External routing' },
        { code: 'IEWAD305', model: 'EW-AD305', tag: 'Adapter', spec: '' },
        { code: 'IEWJC130MM', model: 'EW-JC130-MM', tag: 'Y-Split Rooting', spec: 'E-Tube Connector' },
        { code: 'IEWSD300L060', model: 'EW-SD300 · 600mm', tag: 'Di2 wire', spec: 'External routing' }
      ]
    },
    'Battery Charger': {
      title: 'Top Picks',
      sub: 'Best sellers · 2026',
      picks: [
        { code: 'ISMBCR2', model: 'SM-BCR2', tag: 'Charger', spec: 'For SM-BTR2' },
        { code: 'IECDN100A', model: 'EC-DN100', tag: 'Charger', spec: 'Di2 / STEPS' },
        { code: 'IECE80041A', model: 'EC-E6002', tag: 'Charger', spec: 'STEPS' },
        { code: 'IECE6002D', model: 'EC-E8004-1', tag: 'Charger', spec: 'STEPS' }
      ]
    },
    'SHIMANO TOOLS': {
      title: 'Top Picks',
      sub: 'Best sellers · 2026',
      picks: [
        { code: 'Y13098570', model: 'TL-BH62', tag: 'Disc Brake Hose Cut & Set Tool', spec: '' },
        { code: 'Y13098630', model: 'TL-BR', tag: 'Disc Brake Bleed Kit Prof', spec: '' },
        { code: 'Y12009230', model: 'TL-LR15', tag: 'Lock Ring Tool w/ Guide Pin', spec: 'for SM-RT96/RT77' },
        { code: 'Y46098630', model: 'TL-PD63', tag: 'Pedal Cone Adjusting Tool', spec: '' },
        { code: 'Y20W01000', model: 'TL-DH20', tag: 'Hub Cap Assembly Tool', spec: '' },
        { code: 'Y40098020', model: 'TL-PD400', tag: 'Cone Adjusting Tool Set', spec: '' },
        { code: 'Y25U15000', model: 'TL-LR20', tag: 'Lock Ring Tool', spec: 'for SM-RT80' },
        { code: 'Y0T498030', model: 'TL-LR21', tag: 'Lock Ring Tool', spec: '' },
        { code: 'Y70811000', model: 'TL-AF30', tag: 'L.H. Inner Dust Cap Inst. Tool', spec: '' },
        { code: 'Y13000090', model: 'TL-BR002', tag: 'Funnel Unit', spec: 'for Shift Brake Lever' }
      ]
    },
    'Parktool': {
      title: 'Top Picks',
      sub: 'Best sellers · 2026',
      picks: [
        { code: 'PTDT52', model: 'DT-5.2', tag: 'Tools Disc Brake', spec: '' },
        { code: 'PTPCS42', model: 'PCS-4-2', tag: 'Repair Stand', spec: 'Deluxe Home Mechanic' },
        { code: 'PTBKM12', model: 'BKM-1.2', tag: 'Hydraul BrakeBleedKit', spec: 'Mineral' },
        { code: 'PTCT15', model: 'CT-15', tag: 'Chain Tool', spec: 'Professional' },
        { code: 'PT100523', model: 'GP-2C', tag: 'Super Patch Kit', spec: 'Pre-Glued' },
        { code: 'PTTW52', model: 'TW-5.2', tag: 'Torque Wrench', spec: 'Ratcheting Click-Type' },
        { code: 'PTPCS93', model: 'PCS-9.3', tag: 'Mech Repair Stand', spec: 'Home' },
        { code: 'PTRC1', model: 'RC-1', tag: 'Press Fit Retain Comp', spec: 'Bottle 100ml' },
        { code: 'PTPRS25', model: 'PRS-25', tag: 'Repair Stand', spec: 'Team Issue' },
        { code: 'PTFR52GT', model: 'FR-5.2GT', tag: 'Cassette LockringTool', spec: 'with 12mm Guide Pin' }
      ]
    },
    'Vittoria': {
      title: 'Top Picks',
      sub: 'Best sellers · 2026',
      picks: [
        { code: '1TA00012', model: '700x20/28c', tag: 'Standard inner tube', spec: 'Presta 80mm' },
        { code: '1TA00011', model: '700x20/28c', tag: 'Standard inner tube', spec: 'Presta 60mm RVC' },
        { code: '1TA00010', model: '700x20/28c', tag: 'Standard inner tube', spec: 'Presta 48mm RVC' },
        { code: '11A00738', model: 'MTB Terreno XC Race Brwn', tag: 'Tire', spec: '60-622/29x2.4 TLR G2' },
        { code: '11A00713', model: 'MTB Peyote XC Race FBlk', tag: 'Tire', spec: '60-622/29x2.4 TLR G2' },
        { code: '1TA00002', model: '700x25/28c', tag: 'Competition Latex inner tube', spec: 'Presta 48mm RVC' },
        { code: '1AA00093', model: 'Valve Alloy Blk', tag: 'Tubeless valve', spec: '80mm (2pcs)' },
        { code: '1TA00038', model: '29x1.95/2.50', tag: 'Standard inner tube', spec: 'Presta 48mm' },
        { code: '11A00527', model: 'Road Ride Armor II FBlk', tag: 'Tire', spec: '28-622/700x28c TLR G2' },
        { code: '11A00563', model: 'Pista Oro Tan/Blk/Blk', tag: 'Tire', spec: '23x28" Tubular TPU G2' }
      ]
    },
    'Spare Parts': {
      title: 'Top Picks',
      sub: 'Best sellers · 2026',
      picks: [
        { code: 'Y8JA98020', model: 'SM-BH90', tag: 'Olive + connecting insert', spec: '1 pc · brake hose' },
        { code: 'Y8H298040', model: 'SM-BH59', tag: 'Olive + connecting insert', spec: '1 pc · brake hose' },
        { code: 'ISMCN91012A', model: 'SM-CN910-12', tag: 'Chain quick link', spec: '12-speed · 2 pcs · CN-M9100' },
        { code: 'Y8K198010', model: 'SM-RT81', tag: 'Lock ring + washer', spec: 'Center Lock rotor' },
        { code: 'Y0MX98010', model: 'ST-R9270', tag: 'Bracket cover pair', spec: 'Dura-Ace' },
        { code: 'Y8JA98026', model: 'SM-BH90', tag: 'Connecting insert', spec: '100 pcs' },
        { code: 'Y0DK98010', model: 'ST-R8000', tag: 'Bracket cover pair', spec: 'Ultegra' },
        { code: 'Y0CA98010', model: 'ST-R9170', tag: 'Bracket cover pair', spec: 'Dura-Ace' },
        { code: 'Y0RM98010', model: 'ST-R7170', tag: 'Bracket cover pair', spec: '105 Di2' },
        { code: 'Y0F398010', model: 'ST-R7020', tag: 'Bracket cover pair', spec: '105' }
      ]
    },
    'Spokes': {
      title: 'Top Picks',
      sub: 'Best sellers · 2026',
      picks: [
        { code: 'EWHSPOKEY000B', model: '300mm spoke', tag: 'Spoke set', spec: 'WH-M9200-TL-R12-B-29' },
        { code: 'EWHSPOKEY0005', model: '298mm spoke', tag: 'Spoke set', spec: 'WH-M8200-TL-F15-B-29' },
        { code: 'EWHSPOKEY0007', model: '278mm spoke', tag: 'Spoke set', spec: 'WH-M8200-TL-R12-B-29' },
        { code: 'EWHSPOKEY000C', model: '299mm spoke', tag: 'Spoke set', spec: 'WH-M9220-TL-R12-B-29' },
        { code: 'EWHSPOKEY000A', model: '299mm spoke', tag: 'Spoke set', spec: 'WH-M9220-TL-F15-B-29' },
        { code: 'Y0KLS1000', model: '273mm spoke', tag: 'Spoke', spec: 'WH-MT620-TL-F15-B-275' },
        { code: 'Y0TX98010', model: '298mm spoke', tag: 'Spoke R.H.', spec: 'WH-M9200-TL-R12-B-29' },
        { code: 'Y0H7S1000', model: '290mm spoke', tag: 'Spoke', spec: 'WH-RS171-CL-F12-700C' },
        { code: 'Y0LSS1000', model: '290mm spoke', tag: 'Spoke', spec: 'WH-MT601-TL-F15-29' },
        { code: 'Y0D1S1000', model: '280.5mm spoke', tag: 'Spoke', spec: 'WH-RS700-C30-TL-F' }
      ]
    },
    'Chainring': {
      title: 'Top Picks',
      sub: 'Best sellers · 2026',
      picks: [
        { code: 'Y0MZ98030', model: '54T-NJ', tag: 'Chainring', spec: 'Dura-Ace · FC-R9200' },
        { code: 'Y0MZ40000', model: '40T-NJ', tag: 'Chainring', spec: 'Dura-Ace · FC-R9200' },
        { code: 'Y1W898040', model: '53T-MW', tag: 'Chainring', spec: 'Ultegra · FC-R8000 for 53-39T' },
        { code: 'Y0MZ98020', model: '52T-NH', tag: 'Chainring', spec: 'Dura-Ace · FC-R9200' },
        { code: 'Y0NG98020', model: '52T-NH', tag: 'Chainring', spec: 'Ultegra · FC-R8100' },
        { code: 'Y1WV98050', model: '53T-MW', tag: 'Chainring', spec: '105 · FC-R7000 for 53-39T Black' },
        { code: 'Y1VP98040', model: '54T-MX', tag: 'Chainring', spec: 'Dura-Ace · FC-R9100 for 54-42T' },
        { code: 'Y1WV98030', model: '52T-MT', tag: 'Chainring', spec: '105 · FC-R7000 for 52-36T Black' },
        { code: 'Y0RS98070', model: '52T-NH', tag: 'Chainring', spec: '105 · FC-R7100' },
        { code: 'Y1W839000', model: '39T-MW', tag: 'Chainring', spec: 'Ultegra · FC-R8000 for 53-39T' }
      ]
    },
    'Pulley': {
      title: 'Top Picks',
      sub: 'Best sellers · 2026',
      picks: [
        { code: 'Y3J198010', model: 'RD-R8150', tag: 'Pulley set', spec: '' },
        { code: 'Y3GK98010', model: 'RD-R9250', tag: 'Pulley set', spec: '' },
        { code: 'Y3FW98010', model: 'RD-M8100', tag: 'Pulley set', spec: '' },
        { code: 'Y3F398010', model: 'RD-R7000', tag: 'Pulley set', spec: '' },
        { code: 'Y3FY98010', model: 'RD-M7100', tag: 'Pulley set', spec: '' },
        { code: 'Y3HY98010', model: 'RD-R7150', tag: 'Pulley set', spec: '' },
        { code: 'Y3JE98010', model: 'RD-U8020', tag: 'Pulley set', spec: '' },
        { code: 'Y5ZR98010', model: 'RD-R9100', tag: 'Pulley set', spec: '' },
        { code: 'Y5YE98090', model: 'RD-5800', tag: 'Pulley set', spec: '' },
        { code: 'Y3E998010', model: 'RD-R8000', tag: 'Pulley set', spec: '' }
      ]
    },
    'Switch': {
      title: 'Top Picks',
      sub: 'Best sellers · 2026',
      picks: [
        { code: 'ISWR9160', model: 'SW-R9160', tag: 'Shift Switch R & L Di2', spec: 'for TT-Handle' },
        { code: 'ISWRS801S', model: 'SW-RS801', tag: 'Shift Switch Set', spec: '(100mm)' },
        { code: 'ISWR9150', model: 'SW-R9150', tag: 'Shift Switch R & L', spec: '' },
        { code: 'ISWRS801T', model: 'SW-RS801', tag: 'Shift Switch Set', spec: '(260mm)' },
        { code: 'ISWR610', model: 'SW-R610', tag: 'Shift Switch Set', spec: 'Sprint for 9070/6870' },
        { code: 'ISWRS801E', model: 'SW-RS801', tag: 'Shift Switch Set', spec: '(740mm)' },
        { code: 'ISWM8250RB', model: 'SW-M8250-R', tag: 'Shift Switch Right', spec: 'Deore XT' },
        { code: 'ISWM8250IRB', model: 'SW-M8250-IR', tag: 'Shift Switch Right', spec: 'Deore XT' },
        { code: 'ISWM6250IRA', model: 'SW-M6250-IR', tag: 'Shift Switch Right', spec: 'Deore' },
        { code: 'ISWE7000L400', model: 'SW-E7000-L', tag: 'Switch Left E-Bike', spec: 'Fitted Type (400mm)' }
      ]
    },
    'Shifters': {
      title: 'Top Picks',
      sub: 'Best sellers · 2026',
      picks: [
        { code: 'ESLU600010RAP', model: 'SL-U6000-10R', tag: 'Shift Lever Right 10-speed', spec: 'Cues Black' },
        { code: 'ESLM3158RA', model: 'SL-M315-8R', tag: 'Shift Lever Right 8-speed', spec: '' },
        { code: 'ESLR2000DPA', model: 'SL-R2000', tag: 'Shift Lever Set 2x8-speed', spec: 'Claris' },
        { code: 'ESLU40009RAP', model: 'SL-U4000-9R', tag: 'Shift Lever Rear 9-speed', spec: '' },
        { code: 'ESLM3152LB', model: 'SL-M315-2L', tag: 'Shift Lever Left 2-speed', spec: '' },
        { code: 'ESLR3000LB', model: 'SL-R3000', tag: 'Shift Lever Left 2-speed', spec: 'Sora' },
        { code: 'ESLU40509RAP', model: 'SL-U4050-9R', tag: 'Shift Lever Right 9-speed', spec: 'Cues Black' },
        { code: 'ESLR3000RA', model: 'SL-R3000', tag: 'Shift Lever Right 9-speed', spec: 'Sora' },
        { code: 'ESLRV4008RA', model: 'SL-RV400-8R', tag: 'Shift Lever Right 8-speed', spec: '' },
        { code: 'ESLM3100RA', model: 'SL-M3100-R', tag: 'Shift Lever Right 9-speed', spec: '' }
      ]
    },
    'Freewheel': {
      title: 'Top Picks',
      sub: 'Best sellers · 2026',
      picks: [
        { code: 'EMFTZ5007428', model: 'MF-TZ500', tag: 'Freewheel 7-speed', spec: '14-16-18-20-22-24-34T' },
        { code: 'EMFTZ5006428', model: 'MF-TZ510', tag: 'Freewheel 6-speed', spec: '14-16-18-21-24-28T' },
        { code: 'EMFTZ5107428', model: 'MF-TZ500', tag: 'Freewheel 7-speed', spec: '14-16-18-20-22-24-28T' },
        { code: 'EMFTZ5106428', model: 'MF-TZ510', tag: 'Freewheel 7-speed', spec: '14-16-18-20-22-24-34T' },
        { code: 'EMFTZ5107434', model: 'MF-TZ510', tag: 'Freewheel 7-speed', spec: '14-16-18-20-22-24-28T' }
      ]
    }
  };

  var css =
    '.tp-wrap{margin:-6px 0 14px 0}' +
    '.tp-head{display:flex;align-items:baseline;gap:10px;margin:0 0 6px 2px}' +
    '.tp-title{font-family:"Barlow Condensed",Arial,sans-serif;font-weight:700;font-size:16px;letter-spacing:.1em;text-transform:uppercase;color:var(--text,#fff)}' +
    '.tp-title i{font-style:normal;color:#0082CA}' +
    '.tp-sub{font-size:11px;color:var(--text2,#9aa);letter-spacing:.03em}' +
    '.tp-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:7px}' +
    '.tp-card{display:flex;flex-direction:column;gap:3px;padding:8px 9px 7px;min-width:0;' +
      'background:var(--surface,#111118);border:1px solid var(--border,#1e1e2e);border-radius:8px;' +
      'box-shadow:inset 0 2px 0 #0082CA}' +
    '.tp-tag{font-size:9px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#0082CA;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
    '.tp-model{align-self:flex-start;font-family:"Barlow Condensed",Arial,sans-serif;font-weight:700;font-size:17px;line-height:1.05;color:var(--text,#fff)}' +
    '.tp-model.tp-ph{cursor:zoom-in;border-bottom:1px dotted #0082CA}' +
    '.tp-model.tp-ph::after{content:"";display:inline-block;width:13px;height:13px;margin-left:5px;vertical-align:-1px;opacity:.85;background:url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27%230082CA%27 stroke-width=%272%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27%3E%3Cpath d=%27M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z%27/%3E%3Ccircle cx=%2712%27 cy=%2713%27 r=%274%27/%3E%3C/svg%3E") center/contain no-repeat}' +
    '.tp-model.tp-ph:hover::after{opacity:1}' +
    '.tp-code{font-size:10px;color:var(--text3,#6b7280);letter-spacing:.04em}' +
    '.tp-spec{font-size:11px;line-height:1.3;color:var(--text2,#9aa);min-height:28px}' +
    '.tp-foot{display:flex;align-items:center;justify-content:space-between;gap:6px;margin-top:auto;padding-top:3px}' +
    '.tp-st{font-size:10px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;white-space:nowrap}' +
    '.tp-st.av{color:#00c896}.tp-st.etd{color:#f5a623}' +
    '.tp-add{display:flex;align-items:center;gap:4px}' +
    '.tp-qty{width:38px;padding:4px 2px;text-align:center;background:var(--surface,#111118);color:var(--text,#fff);' +
      'border:1px solid var(--border,#1e1e2e);border-radius:5px;font-family:"Barlow Condensed",sans-serif;font-size:13px;font-weight:600}' +
    '.tp-btn{padding:5px 9px;border:0;border-radius:5px;background:#0082CA;color:#fff;cursor:pointer;' +
      'font-family:"Barlow Condensed",Arial,sans-serif;font-weight:700;font-size:13px;letter-spacing:.06em;text-transform:uppercase}' +
    '.tp-btn:hover{background:#0a94e0}' +
    '#tpPhoto{position:fixed;z-index:99999;display:none;width:240px;height:240px;padding:6px;box-sizing:border-box;' +
      'background:#fff;border:1px solid rgba(0,130,202,.6);border-radius:10px;box-shadow:0 14px 40px rgba(0,0,0,.55);pointer-events:none}' +
    '#tpPhoto img{width:100%;height:100%;object-fit:contain;display:block}' +
    '@media(max-width:1200px){.tp-grid{grid-template-columns:repeat(4,1fr)}}' +
    '@media(max-width:900px){.tp-grid{grid-template-columns:repeat(2,1fr);gap:6px}.tp-sub{display:none}.tp-spec{min-height:0}}';

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function ensureHost() {
    var host = document.getElementById('topPicks');
    if (host) return host;
    var anchor = document.getElementById('categoryVideo');
    if (!anchor || !anchor.parentNode) return null;
    var st = document.createElement('style');
    st.textContent = css;
    document.head.appendChild(st);
    host = document.createElement('div');
    host.id = 'topPicks';
    host.className = 'tp-wrap';
    host.setAttribute('lang', 'en');
    host.style.display = 'none';
    anchor.parentNode.insertBefore(host, anchor.nextSibling);
    return host;
  }

  function itemByCode(code) {
    if (typeof allItems === 'undefined') return null;
    for (var i = 0; i < allItems.length; i++) if (allItems[i].code === code) return allItems[i];
    return null;
  }

  function stBadge(it) {
    if (it.status === 'available') return '<span class="tp-st av">In stock</span>';
    return '<span class="tp-st etd">ETD' + (it.etd ? ' ' + esc(it.etd) : '') + '</span>';
  }

  /* Photo on hover: reuses the page's product-photo map (pvHas / pvUrls). On touch screens a tap toggles it. */
  function hasPhoto(code) { return typeof window.pvHas === 'function' && window.pvHas(code); }
  var pop = null, popImg = null;
  function getPop() {
    if (pop) return pop;
    pop = document.createElement('div'); pop.id = 'tpPhoto';
    popImg = document.createElement('img'); popImg.alt = '';
    pop.appendChild(popImg); document.body.appendChild(pop);
    return pop;
  }
  function showPhoto(el) {
    var code = el.getAttribute('data-code');
    var urls = (typeof window.pvUrls === 'function') ? window.pvUrls(code) : [];
    if (!urls.length) return;
    var p = getPop(), url = urls[0];
    popImg.onerror = function () {
      if (popImg.getAttribute('data-step') !== '1') {
        popImg.setAttribute('data-step', '1');
        popImg.src = 'https://wsrv.nl/?url=' + encodeURIComponent(url.replace(/^https:/, 'http:')) + '&w=500&we&output=jpg';
      } else { p.style.display = 'none'; }
    };
    popImg.setAttribute('data-step', '0');
    popImg.src = url;
    var r = el.getBoundingClientRect(), W = 240, H = 240;
    var left = Math.max(8, Math.min(r.left, window.innerWidth - W - 8));
    var top = r.bottom + 8;
    if (top + H > window.innerHeight - 8) top = Math.max(8, r.top - H - 8);
    p.style.left = left + 'px'; p.style.top = top + 'px'; p.style.display = 'block';
  }
  function hidePhoto() { if (pop) pop.style.display = 'none'; }

  document.addEventListener('mouseover', function (e) {
    var m = e.target && e.target.closest ? e.target.closest('.tp-model.tp-ph') : null;
    if (m) showPhoto(m);
  });
  document.addEventListener('mouseout', function (e) {
    var m = e.target && e.target.closest ? e.target.closest('.tp-model.tp-ph') : null;
    if (m) hidePhoto();
  });
  document.addEventListener('click', function (e) {
    var m = e.target && e.target.closest ? e.target.closest('.tp-model.tp-ph') : null;
    if (m && window.matchMedia && window.matchMedia('(hover: none)').matches) {
      if (pop && pop.style.display === 'block') hidePhoto(); else showPhoto(m);
    } else if (!m) hidePhoto();
  });
  window.addEventListener('scroll', hidePhoto, true);

  function render() {
    var host = ensureHost();
    if (!host) return;
    var cfg = null;
    try {
      cfg = (typeof currentCat !== 'undefined' && !searchQuery) ? window.TOP_PICKS[currentCat] : null;
    } catch (e) { cfg = null; }
    if (!cfg) { hidePhoto(); host.style.display = 'none'; host.innerHTML = ''; return; }

    var cards = [];
    cfg.picks.forEach(function (p) {
      var it = itemByCode(p.code);
      if (!it || (it.status !== 'available' && it.status !== 'etd')) return;
      cards.push(
        '<div class="tp-card">' +
          '<div class="tp-tag">' + esc(p.tag) + '</div>' +
          '<div class="tp-model' + (hasPhoto(it.code) ? ' tp-ph' : '') + '" data-code="' + esc(it.code) + '">' + esc(p.model || it.desc2 || it.desc1) + '</div>' +
          '<div class="tp-spec">' + esc(p.spec || it.desc1) + '</div>' +
          '<div class="tp-code">' + esc(it.code) + '</div>' +
          '<div class="tp-foot">' + stBadge(it) +
            '<span class="tp-add"><input class="tp-qty" type="number" min="1" value="1" aria-label="Quantity">' +
            '<button class="tp-btn" type="button" data-code="' + esc(it.code) + '">Add</button></span>' +
          '</div>' +
        '</div>');
    });

    if (cards.length < MIN_PICKS) { host.style.display = 'none'; host.innerHTML = ''; return; }
    host.innerHTML =
      '<div class="tp-head"><span class="tp-title"><i>★</i> ' + esc(cfg.title || 'Top Picks') + '</span>' +
      '<span class="tp-sub">' + esc(cfg.sub || '') + '</span></div>' +
      '<div class="tp-grid">' + cards.join('') + '</div>';
    host.style.display = '';
  }

  /* One delegated click handler: adds the typed quantity on top of what is already in the order */
  document.addEventListener('click', function (e) {
    var b = e.target && e.target.closest ? e.target.closest('.tp-btn') : null;
    if (!b) return;
    var code = b.getAttribute('data-code');
    var it = itemByCode(code);
    if (!it || typeof setQty !== 'function') return;
    var card = b.closest('.tp-card');
    var add = parseInt(card.querySelector('.tp-qty').value, 10);
    if (!add || add < 1) add = 1;
    var cur = (typeof orderList !== 'undefined' && orderList[code]) ? (orderList[code].qty || orderList[code]) : 0;
    cur = parseInt(cur, 10) || 0;
    var total = cur + add;
    setQty(code, it.desc1 || code, String(total));
    document.querySelectorAll('.qty-input[data-code="' + code + '"]').forEach(function (el) { el.value = total; });
  });

  /* Re-render whenever the page redraws the category banner (category / search / page changes) */
  var orig = window.updateCategoryBanner;
  if (typeof orig === 'function') {
    window.updateCategoryBanner = function () {
      var r = orig.apply(this, arguments);
      try { render(); } catch (e) {}
      return r;
    };
  }
  document.addEventListener('DOMContentLoaded', function () { try { render(); } catch (e) {} });
  try { render(); } catch (e) {}
})();
