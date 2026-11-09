/* ═══════════════════════════════════════════════════════════════
   SHIMANO TICKER-ONLY ITEMS
   Hızlı altyazılar — sadece alt bardaki kayan yazıda görünür.
   news.html sayfasında gösterilmez.
   Yeni altyazıları ticker-admin.html üzerinden üretip
   buradaki listenin en başına yapıştırın.

   OTOMATİK KALKMA (hepsi isteğe bağlı):
     expires   : "YYYY-MM-DD"  bu günden sonra gizlenir
     publishAt : "YYYY-MM-DD"  bu güne kadar gizli kalır (önceden planla)
     pin       : true          asla otomatik kalkmaz
     first     : true          kayan yazının en başında döner (ör. çalışma saatleri)
     added     : "YYYY-MM-DD"  expires/pin yoksa 21 gün sonra kendiliğinden kalkar
   Not: Stok değişimi ve yaklaşan etkinlik satırları otomatiktir
   (ticker-auto.js, events-data.js) — buraya elle yazılmaz.
   ═══════════════════════════════════════════════════════════════ */
window.SHIMANO_TICKER = [

  {
    title: "Due to a technical issue, some product images are temporarily unavailable. We apologise for the inconvenience.",
    added: "2026-11-09",
    pin: true,
    first: true
  },

  {
    title: "Office Hours: Mon-Fri : 09:00-18:00 GMT+3",
    pin: true,
    first: true
  },

  {
    title: "---Welcome to New Shimano Order Book Webpage ---",
    added: "2026-04-22"
  },

   {
    title: "---New Flat Pedals \" PD-G8040\" and \"PD-M8240\" and Flat/SPD  Pedal \"PD-EH510\" added in PEDALS page---",
    added: "2026-04-22"
  },


];