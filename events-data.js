/* ============================================================
   UPCOMING EVENTS — data file
   Region: GCC, Kazakhstan, Uzbekistan, Egypt, Morocco
   ------------------------------------------------------------
   How to add an event: copy one block, change the fields.
     name     : event name
     start    : "YYYY-MM-DD"
     end      : "YYYY-MM-DD"  (same as start for one-day events)
     city     : city / area
     country  : UAE, KSA, OMN, QAT, BHR, KWT, KAZ, UZB, EGY, MAR
     type     : "pro"       -> UCI / professional race        (blue)
                "triathlon" -> triathlon / duathlon / Ironman (purple)
                "community" -> mass ride, gran fondo, open    (green)
                "local"     -> club race, local MTB / TT      (grey)
     label    : short tag shown on the right (e.g. "UCI WorldTour")
     tbc      : true if dates are not final yet (orange "DATES TBC")
     url      : official page (opens in new tab)
   Past events disappear automatically the day after "end".

   WHERE TO CHECK FOR NEW EVENTS
   - Pro road      : UCI calendar, Wikipedia "UCI Asia Tour / ProSeries",
                     velowire.com, procyclingstats.com
   - Triathlon     : triathlon.org/events, ironman.com, t100triathlon.com
                     (Dubai + Saudi T100), challenge-family (Sir Bani Yas)
   - Gran fondo    : ucigranfondoworldseries.com, granfondoguide.com,
                     battistrada.com
   - Aggregators   : finishers.com, ahotu.com (filter by country + cycling)
   - Registration  : hopasports.com (UAE MTB/road/triathlon — best local source),
                     sported.ae/event-type/cycling + /triathlon (very complete for UAE),
                     premieronline.com, supersportsuae.com
   - Councils      : mediaoffice.abudhabi (Bike Abu Dhabi Gran Fondo),
                     dubai.letapeseries.com (L'Etape Dubai, January)
   - UAE           : dubaifitnesschallenge.com, abudhabi media office,
                     cyclechallenge.ae (Spinneys 92 + Build-Up Rides)
   - KSA           : riyadhwheelers.com, experiencealula.com, racearabia.sa
   - OMN           : tour-of-oman.com, timesofoman.com
   - QAT           : qatarcycling.org/events/calendar
   - BHR           : calendar.bh
   - KAZ           : cycling.kz (federation), athletex.kz (Tengri series)
   - UZB           : velosport.uz (federation), ozsport.uz
   Last checked: 2026-10-07
   ============================================================ */
/* Email address that receives "Suggest an event" forms from dealers.
   Leave empty ("") to hide the Suggest button. */
window.SHIMANO_EVENTS_CONTACT = "tuncay.gecim@shimano-eu.com";

window.SHIMANO_EVENTS = [
  {
    name: "Riyadh 25 Mile TT",
    start: "2026-10-02", end: "2026-10-02",
    city: "Riyadh", country: "KSA",
    type: "local", label: "Club Race",
    url: "https://riyadhwheelers.com/race-schedule/"
  },
  {
    name: "Ak Bulak XCO",
    start: "2026-10-04", end: "2026-10-04",
    city: "Ak Bulak", country: "KAZ",
    type: "local", label: "MTB",
    url: "https://athletex.kz/"
  },
  {
    name: "IRONMAN 70.3 Dhofar",
    start: "2026-10-24", end: "2026-10-24",
    city: "Salalah", country: "OMN",
    type: "triathlon", label: "IRONMAN 70.3",
    url: "https://timesofoman.com/article/175243-middle-east-ironman-703-team-championship-to-be-held-in-dhofar-on-24-october-2026"
  },
  {
    name: "IRONMAN 70.3 Agadir",
    start: "2026-10-25", end: "2026-10-25",
    city: "Agadir", country: "MAR",
    type: "triathlon", label: "IRONMAN 70.3",
    url: "https://barlamantoday.com/2026/09/22/agadir-to-host-second-ironman-70-3-triathlon-in-october/"
  },
  {
    name: "Spinneys Build-Up Ride 2",
    start: "2026-10-18", end: "2026-10-18",
    city: "Al Qudra", country: "UAE",
    type: "community", label: "Gran Fondo",
    url: "https://cyclechallenge.ae/"
  },
  {
    name: "Khorfakkan Triathlon",
    start: "2026-11-01", end: "2026-11-01",
    city: "Khor Fakkan", country: "UAE",
    type: "triathlon", label: "Triathlon",
    url: "https://www.hopasports.com/en/event/oceanic-khorfakkan-triathlon-series-race-1-of-2-2"
  },
  {
    name: "Dubai Ride",
    start: "2026-11-01", end: "2026-11-01",
    city: "Dubai", country: "UAE",
    type: "community", label: "Community Ride",
    url: "https://www.dubairide.com/"
  },
  {
    name: "Riyadh 100K Road Race",
    start: "2026-11-13", end: "2026-11-13",
    city: "Riyadh", country: "KSA",
    type: "local", label: "Club Race",
    url: "https://riyadhwheelers.com/race-schedule/"
  },
  {
    name: "World Triathlon Champs",
    start: "2026-11-13", end: "2026-11-22",
    city: "Abu Dhabi", country: "UAE",
    type: "triathlon", label: "World Champs",
    url: "https://triathlon.org/events/2026-world-triathlon-multisport-championships-abu-dhabi/schedule"
  },
  {
    name: "Spinneys Build-Up Ride 3",
    start: "2026-11-22", end: "2026-11-22",
    city: "Al Qudra", country: "UAE",
    type: "community", label: "Gran Fondo",
    url: "https://cyclechallenge.ae/"
  },
  {
    name: "T100 Qatar",
    start: "2026-12-10", end: "2026-12-12",
    city: "Lusail", country: "QAT",
    type: "triathlon", label: "T100 Final",
    url: "https://t100triathlon.com/qatar/participate/event-info/"
  },
  {
    name: "Spinneys Build-Up Ride 4",
    start: "2027-01-09", end: "2027-01-09",
    city: "Al Qudra", country: "UAE",
    type: "community", label: "Gran Fondo",
    url: "https://cyclechallenge.ae/"
  },
  {
    name: "AlUla Tour",
    start: "2027-01-27", end: "2027-01-31",
    city: "AlUla", country: "KSA",
    type: "pro", label: "UCI ProSeries",
    tbc: true,
    url: "https://www.experiencealula.com/en/whats-on/events/alula-tour"
  },
  {
    name: "UAE Tour Women",
    start: "2027-02-03", end: "2027-02-06",
    city: "Abu Dhabi", country: "UAE",
    type: "pro", label: "UCI Women's WT",
    url: "https://www.mediaoffice.abudhabi/en/sport/organised-by-abu-dhabi-sports-council-and-empowered-by-ad-ports-group-uae-tour-men-and-uae-tour-women-2027-to-take-place-in-february/"
  },
  {
    name: "IRONMAN 70.3 Oman",
    start: "2027-02-06", end: "2027-02-06",
    city: "Muscat", country: "OMN",
    type: "triathlon", label: "IRONMAN 70.3",
    url: "https://www.ahotu.com/event/ironman-70-3-oman"
  },
  {
    name: "Spinneys Dubai 92",
    start: "2027-02-07", end: "2027-02-07",
    city: "Expo City Dubai", country: "UAE",
    type: "community", label: "UCI Gran Fondo",
    url: "https://cyclechallenge.ae/"
  },
  {
    name: "UAE Tour",
    start: "2027-02-15", end: "2027-02-21",
    city: "Abu Dhabi", country: "UAE",
    type: "pro", label: "UCI WorldTour",
    url: "https://www.mediaoffice.abudhabi/en/sport/organised-by-abu-dhabi-sports-council-and-empowered-by-ad-ports-group-uae-tour-men-and-uae-tour-women-2027-to-take-place-in-february/"
  },
  {
    name: "IRONMAN 70.3 Doha",
    start: "2027-03-18", end: "2027-03-20",
    city: "Doha", country: "QAT",
    type: "triathlon", label: "IRONMAN 70.3",
    url: "https://blog.wego.com/ironman-70-3-doha/"
  },
  {
    name: "Gran Fondo Kazakhstan",
    start: "2027-04-24", end: "2027-04-24",
    city: "Taldykurgan", country: "KAZ",
    type: "community", label: "Gran Fondo",
    tbc: true,
    url: "https://www.granfondoguide.com/Events/Index/6650/gran-fondo-kazakhstan"
  },
  {
    name: "Tengri Ultra",
    start: "2027-05-01", end: "2027-05-03",
    city: "Ile River Valley", country: "KAZ",
    type: "community", label: "Ultra Ride",
    url: "https://athletex.kz/"
  },
  {
    name: "Mleiha MTB Challenge",
    start: "2026-10-11", end: "2026-10-11",
    city: "Mleiha, Sharjah", country: "UAE",
    type: "local", label: "MTB",
    url: "https://www.hopasports.com/"
  },
  {
    name: "IRONMAN 70.3 Sharm",
    start: "2026-10-16", end: "2026-10-16",
    city: "Sharm El-Sheikh", country: "EGY",
    type: "triathlon", label: "IRONMAN 70.3",
    url: "https://egyptianstreets.com/2026/05/27/ironman-70-3-to-take-place-in-sharm-el-sheikh-in-october-2026/"
  },
  {
    name: "Ajman Triathlon",
    start: "2026-10-18", end: "2026-10-18",
    city: "Ajman", country: "UAE",
    type: "triathlon", label: "Triathlon",
    url: "https://www.hopasports.com/"
  },
  {
    name: "Masfout MTB Challenge",
    start: "2026-10-25", end: "2026-10-25",
    city: "Masfout", country: "UAE",
    type: "local", label: "MTB",
    url: "https://www.hopasports.com/"
  },
  {
    name: "Khorfakkan Clouds Race",
    start: "2026-10-31", end: "2026-10-31",
    city: "Khor Fakkan", country: "UAE",
    type: "community", label: "Road Race",
    url: "https://www.hopasports.com/"
  },
  {
    name: "Dubai T100",
    start: "2026-11-13", end: "2026-11-15",
    city: "Al Mamzar, Dubai", country: "UAE",
    type: "triathlon", label: "T100",
    url: "https://gulfnews.com/sport/uae-sport/50-days-to-dubai-t100-moves-to-al-mamzar-new-olympic-distance-and-an-all-female-pro-race-1.500686138"
  },
  {
    name: "Road To Awareness",
    start: "2026-11-20", end: "2026-11-22",
    city: "Fujairah", country: "UAE",
    type: "community", label: "Road Ride",
    url: "https://www.hopasports.com/"
  },
  {
    name: "Saudi Arabia T100",
    start: "2026-11-27", end: "2026-11-28",
    city: "Venue TBA", country: "KSA",
    type: "triathlon", label: "T100",
    url: "https://t100triathlon.com/saudi-arabia/participate/"
  },
  {
    name: "Fujairah Int. Triathlon",
    start: "2026-12-13", end: "2026-12-13",
    city: "Fujairah", country: "UAE",
    type: "triathlon", label: "Triathlon",
    url: "https://www.hopasports.com/"
  },
  {
    name: "Challenge Sir Bani Yas",
    start: "2027-01-30", end: "2027-01-31",
    city: "Sir Bani Yas Island", country: "UAE",
    type: "triathlon", label: "Challenge",
    url: "https://www.ahotu.com/calendar/triathlon/united-arab-emirates"
  },
  {
    name: "Falcon Daman Series R1",
    start: "2026-10-06", end: "2026-10-06",
    city: "Hudayriyat, Abu Dhabi", country: "UAE",
    type: "local", label: "Race Series",
    url: "https://www.sported.ae/event-type/cycling/"
  },
  {
    name: "Dubai Police Triathlon",
    start: "2026-10-11", end: "2026-10-11",
    city: "Al Mamzar, Dubai", country: "UAE",
    type: "triathlon", label: "Triathlon",
    url: "https://www.sported.ae/event-type/triathlon/"
  },
  {
    name: "Mamzar Triathlon R1",
    start: "2026-10-25", end: "2026-10-25",
    city: "Al Mamzar, Dubai", country: "UAE",
    type: "triathlon", label: "Triathlon",
    url: "https://www.sported.ae/event-type/triathlon/"
  },
  {
    name: "Ajman Cycling Race",
    start: "2026-11-22", end: "2026-11-22",
    city: "Ajman", country: "UAE",
    type: "community", label: "Road Race",
    url: "https://www.ahotu.com/calendar/cycling/united-arab-emirates"
  },
  {
    name: "JAIS Ride",
    start: "2026-12-05", end: "2026-12-05",
    city: "Jebel Jais, RAK", country: "UAE",
    type: "community", label: "Mountain Ride",
    url: "https://www.ahotu.com/calendar/cycling/united-arab-emirates"
  },
  {
    name: "IRONMAN 70.3 Bahrain",
    start: "2026-12-11", end: "2026-12-11",
    city: "Manama", country: "BHR",
    type: "triathlon", label: "IRONMAN 70.3",
    tbc: true,
    url: "https://www.ahotu.com/calendar/triathlon/bahrain"
  }
];
