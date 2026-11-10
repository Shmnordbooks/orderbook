/* ═══════════════════════════════════════════════════════════════
   SHIMANO WEBSITES — websites.html veri dosyası
   Yeni link eklemek için ilgili grubun "items" listesine bir satır ekle.
     title : kart başlığı
     desc  : kısa açıklama (İngilizce, bayi görür)
     url   : tam adres (https://...)
     host  : kartta gösterilen kısa alan adı
     tag   : (opsiyonel) küçük rozet, ör. "MANUALS"
   Gruplar ekranda bu sırayla çıkar.
   ═══════════════════════════════════════════════════════════════ */
const SHIMANO_WEBSITES = [
  {
    group: "Training - Online Training",
    blurb: "Online product and technical training for your workshop and sales team.",
    color: "#22c55e",
    items: [
      {
        title: "Shimano Tec - Online Training",
        desc: "Shimano's online training site for workshop and sales staff. Open it to browse and take the available courses.",
        url: "https://www.shimano-tec.com/",
        host: "shimano-tec.com",
        tag: "TRAINING"
      }
    ]
  },
  {
    group: "Technical documents & service",
    blurb: "Manuals, parts diagrams, error codes and compatibility — the pages a workshop uses every day.",
    color: "#0ea5e9",
    items: [
      {
        title: "Manuals & Technical Documents",
        desc: "Dealer's manuals, user manuals, service instructions, exploded views and quick manuals for Shimano components. Search by model number.",
        url: "https://si.shimano.com/en/manual/search",
        host: "si.shimano.com",
        tag: "MANUALS"
      },
      {
        title: "Manual Update Information",
        desc: "See which manuals and technical documents were added or revised recently.",
        url: "https://si.shimano.com/en/manual/update-info",
        host: "si.shimano.com",
        tag: "MANUALS"
      },
      {
        title: "Di2 / E-Bike Error Codes",
        desc: "Look up error and warning codes for Di2 and SHIMANO E-BIKE systems and see what to do next.",
        url: "https://si.shimano.com/en/error",
        host: "si.shimano.com",
        tag: "DIAGNOSTICS"
      },
      {
        title: "Product Compatibility",
        desc: "Official compatibility charts: drivetrain, brakes, hubs, E-BIKE and Di2 (E-TUBE) combinations.",
        url: "https://productinfo.shimano.com/en/compatibility",
        host: "productinfo.shimano.com",
        tag: "COMPATIBILITY"
      },
      {
        title: "Footwear Parts Guide",
        desc: "Identify and look up replacement parts for Shimano shoes.",
        url: "https://bike.shimano.com/en-UK/support-and-service/shimano-footwear-parts-guide.html",
        host: "bike.shimano.com",
        tag: "PARTS"
      },
      {
        title: "Shimano Service Center",
        desc: "Shimano's official global service center site.",
        url: "https://www.shimanoservicecenter.com/global/",
        host: "shimanoservicecenter.com",
        tag: "SERVICE"
      }
    ]
  },
  {
    group: "Software & apps",
    blurb: "E-TUBE tools for firmware updates, setup and ride data on Di2 and E-BIKE systems.",
    color: "#10b981",
    items: [
      {
        title: "E-TUBE Hub",
        desc: "Start page for the E-TUBE apps, with download links and release notes.",
        url: "https://bike.shimano.com/e-tube.html",
        host: "bike.shimano.com",
        tag: "E-TUBE"
      },
      {
        title: "E-TUBE PROJECT Professional",
        desc: "Windows application for dealers: wired check-ups, firmware updates, maintenance and customization.",
        url: "https://bike.shimano.com/en-UK/products/apps/e-tube-project-professional.html",
        host: "bike.shimano.com",
        tag: "DEALER TOOL"
      },
      {
        title: "E-TUBE PROJECT Cyclist",
        desc: "Smartphone app to update firmware and customize shifting and E-BIKE assist settings wirelessly.",
        url: "https://e-tubeproject.shimano.com/",
        host: "e-tubeproject.shimano.com",
        tag: "APP"
      },
      {
        title: "E-TUBE RIDE",
        desc: "Cycle-computer app: route map, live ride data, assist mode change and ride recording.",
        url: "https://bike.shimano.com/e-tube/ride.html",
        host: "bike.shimano.com",
        tag: "APP"
      },
      {
        title: "All Shimano Apps",
        desc: "Overview of every Shimano app, including SHIMANO CONNECT Lab for ride-data analysis.",
        url: "https://bike.shimano.com/en-UK/products/apps.html",
        host: "bike.shimano.com",
        tag: "APPS"
      }
    ]
  },
  {
    group: "Support, warranty & product information",
    blurb: "Answers for end users and dealers: FAQ, warranty terms, product recalls and discontinued items.",
    color: "#f59e0b",
    items: [
      {
        title: "FAQ",
        desc: "Frequently asked questions across Shimano product categories and E-TUBE.",
        url: "https://bike.shimano.com/en-UK/support-and-service/faq.html",
        host: "bike.shimano.com",
        tag: "SUPPORT"
      },
      {
        title: "Warranty",
        desc: "Shimano's official warranty information.",
        url: "https://bike.shimano.com/en-UK/support-and-service/warranty.html",
        host: "bike.shimano.com",
        tag: "WARRANTY"
      },
      {
        title: "Crash Replacement Program",
        desc: "Information on Shimano's crash replacement program for wheels.",
        url: "https://bike.shimano.com/en-UK/information/crash-replacement-program.html",
        host: "bike.shimano.com",
        tag: "WARRANTY"
      },
      {
        title: "Corrective Actions",
        desc: "Official notices on product corrective actions.",
        url: "https://bike.shimano.com/en-UK/information/customer-services/corrective-actions.html",
        host: "bike.shimano.com",
        tag: "SAFETY"
      },
      {
        title: "Discontinued Products",
        desc: "List of Shimano products that are no longer in the range.",
        url: "https://bike.shimano.com/en-UK/products/discontinued.html",
        host: "bike.shimano.com",
        tag: "PRODUCTS"
      }
    ]
  }
];
