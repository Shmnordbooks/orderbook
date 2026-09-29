/* ============================================================
   UPCOMING EVENTS — data file
   Region: GCC, Kazakhstan, Uzbekistan
   ------------------------------------------------------------
   How to add an event: copy one block, change the fields.
     name     : event name
     start    : "YYYY-MM-DD"
     end      : "YYYY-MM-DD"  (same as start for one-day events)
     city     : city / area
     country  : UAE, KSA, OMN, QAT, BHR, KWT, KAZ, UZB
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
   - Gran fondo    : ucigranfondoworldseries.com, granfondoguide.com,
                     battistrada.com
   - Aggregators   : finishers.com, ahotu.com (filter by country + cycling)
   - UAE           : dubaifitnesschallenge.com, abudhabi media office,
                     cyclechallenge.ae (Spinneys 92 + Build-Up Rides)
   - KSA           : riyadhwheelers.com, experiencealula.com, racearabia.sa
   - OMN           : tour-of-oman.com, timesofoman.com
   - QAT           : qatarcycling.org/events/calendar
   - BHR           : calendar.bh
   - KAZ           : cycling.kz (federation), athletex.kz (Tengri series)
   - UZB           : velosport.uz (federation), ozsport.uz
   Last checked: 2026-09-29
   ============================================================ */
/* Email address that receives "Suggest an event" forms from dealers.
   Leave empty ("") to hide the Suggest button. */
window.SHIMANO_EVENTS_CONTACT = "";

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
    name: "Spinneys Build-Up Ride 2",
    start: "2026-10-18", end: "2026-10-18",
    city: "Al Qudra", country: "UAE",
    type: "community", label: "Gran Fondo",
    url: "https://cyclechallenge.ae/"
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
  }
];
