#!/usr/bin/env python3
"""
Builds prices-data.js (dealer list price, SRP incl. VAT, stock flag, campaigns)
for every SKU that appears in the six catalog pages.

Inputs — one Excel workbook (normally all_items.xlsm, or a values-only copy):
  * "Prices"          pivot exported from the price report: Base Price + Retail Price
                      for SBX / SFCC / SIB / SSP (EUR). Required.
  * "Pricing Params"  optional two-column sheet (Parameter | Value), see DEFAULTS.
  * "Campaigns"       optional; one row per campaign, see CAMPAIGN_COLUMNS.

Run it right after the daily stock update has rewritten the catalog pages, so the
stock flags in prices-data.js match what the pages show:

    python tools/build_prices.py --xlsx "C:\\...\\all_items.xlsm"

Pricing rules (agreed Oct 2026):
  reference base = median of the offices' base prices (missing ones ignored)
  list price     = max(reference / (1 + extra cost), reference * (1 - max discount))
  SRP            = highest office retail price, VAT included as published (decided 13 Oct 2026)
  campaign       = only for items in stock; highest active campaign wins (no stacking);
                   never below reference * (1 - campaign floor)
Dealer-facing text (campaign labels) must be English.
"""
import argparse, json, math, re, statistics, sys
from datetime import date, datetime
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from gen_ticker_auto import PAGES, parse  # same item/status parser as the ticker

ROOT = Path(__file__).resolve().parent.parent
OFFICES = ["SBX", "SFCC", "SIB", "SSP"]

DEFAULTS = {
    "extra cost": 0.15,          # freight + duty + clearance share of goods value (single price for all dealers)
    "max discount": 0.20,        # list price never more than this below the EU reference base
    "campaign floor": 0.35,      # campaign price never more than this below the EU reference base
    "minimum order": 7500,       # EUR, in-stock (shippable) value
    "rounding": 0.01,
    "vat SBX": 0.21, "vat SFCC": 0.20, "vat SIB": 0.22, "vat SSP": 0.21,
}
CAMPAIGN_COLUMNS = ["Active", "Label", "Discount %", "Start", "End", "Product Group", "Brand", "SKUs"]


def load_sheet(xlsx, name):
    import openpyxl
    wb = openpyxl.load_workbook(xlsx, read_only=True, data_only=True)
    for ws in wb.worksheets:
        if ws.title.strip().lower() == name.lower():
            return [list(r) for r in ws.iter_rows(values_only=True)]
    return None


def num(v):
    try:
        f = float(v)
        return f if f > 0 and math.isfinite(f) else None
    except (TypeError, ValueError):
        return None


def read_prices(rows):
    """Pivot layout: a header row containing 'Item Number', two rows above it the
    'Base Price' / 'Retail Price' band, one row above it the office codes."""
    hi = next(i for i, r in enumerate(rows) if any(str(c).strip() == "Item Number" for c in r if c))
    head = [str(c).strip() if c else "" for c in rows[hi]]
    band, offs = rows[hi - 2], rows[hi - 1]
    col = {h: i for i, h in enumerate(head) if h}
    kind, base_cols, srp_cols = None, {}, {}
    for i in range(len(offs)):
        b = str(band[i]).strip().lower() if i < len(band) and band[i] else ""
        if "base" in b:
            kind = "base"
        elif "retail" in b:
            kind = "srp"
        o = str(offs[i]).strip() if offs[i] else ""
        if o in OFFICES and kind:
            (base_cols if kind == "base" else srp_cols)[o] = i
    out = {}
    for r in rows[hi + 1:]:
        sku = r[col["Item Number"]] if col["Item Number"] < len(r) else None
        if not sku:
            continue
        sku = str(sku).strip()
        out[sku] = {
            "brand": str(r[col.get("Brand", 1)] or "").strip(),
            "pg": str(r[col.get("Product Group", 2)] or "").strip(),
            "desc": str(r[col.get("Description1", 4)] or "").strip(),
            "base": {o: num(r[i]) for o, i in base_cols.items()},
            "srp": {o: num(r[i]) for o, i in srp_cols.items()},
        }
    return out


def read_params(rows):
    p = dict(DEFAULTS)
    for r in rows or []:
        if not r or not r[0] or len(r) < 2:
            continue
        k = str(r[0]).strip().lower()
        for d in DEFAULTS:
            if k == d.lower():
                v = r[1]
                if isinstance(v, str):
                    v = float(v.replace("%", "").replace(",", ".")) / (100 if "%" in v else 1)
                p[d] = float(v)
    return p


def to_date(v):
    if v in (None, ""):
        return None
    if isinstance(v, datetime):
        return v.date()
    if isinstance(v, date):
        return v
    for f in ("%d.%m.%Y", "%Y-%m-%d", "%d/%m/%Y"):
        try:
            return datetime.strptime(str(v).strip(), f).date()
        except ValueError:
            pass
    raise ValueError(f"Unreadable date in Campaigns: {v!r}")


def read_campaigns(rows, prices, warnings):
    if not rows:
        return []
    hi = next((i for i, r in enumerate(rows) if r and any(str(c).strip() == "Label" for c in r if c)), None)
    if hi is None:
        return []
    head = {str(c).strip(): i for i, c in enumerate(rows[hi]) if c}
    get = lambda r, k: r[head[k]] if k in head and head[k] < len(r) else None
    out = []
    for r in rows[hi + 1:]:
        label = get(r, "Label")
        if not label or str(get(r, "Active") or "Y").strip().upper() not in ("Y", "YES", "1", "TRUE"):
            continue
        pct = get(r, "Discount %")
        pct = float(str(pct).replace("%", "").replace(",", ".")) if pct not in (None, "") else 0
        if pct > 1:
            pct /= 100
        if not 0 < pct < 1:
            warnings.append(f"Campaign '{label}': discount {pct!r} ignored")
            continue
        pgs = {s.strip().lower() for s in str(get(r, "Product Group") or "").split(",") if s.strip()}
        brands = {s.strip().lower() for s in str(get(r, "Brand") or "").split(",") if s.strip()}
        skus = {s.strip().upper() for s in re.split(r"[,\s;]+", str(get(r, "SKUs") or "")) if s.strip()}
        if not (pgs or brands or skus):
            warnings.append(f"Campaign '{label}': no Product Group / Brand / SKUs given, ignored")
            continue
        out.append({"label": str(label).strip(), "pct": round(pct, 4),
                    "start": to_date(get(r, "Start")), "end": to_date(get(r, "End")),
                    "pgs": pgs, "brands": brands, "skus": skus})
    return out


def rnd(x, step):
    return round(round(x / step) * step, 2)


def build(xlsx, today=None):
    today = today or date.today()
    warnings = []
    prices = read_prices(load_sheet(xlsx, "Prices"))
    P = read_params(load_sheet(xlsx, "Pricing Params"))
    camps = read_campaigns(load_sheet(xlsx, "Campaigns"), prices, warnings)

    stock = {}
    for page, _ in PAGES:
        for code, (st, *_rest) in parse((ROOT / page).read_text(encoding="utf-8")).items():
            stock[code] = st

    items, missing, active = {}, [], []
    for c in camps:
        live = (c["start"] is None or c["start"] <= today) and (c["end"] is None or today <= c["end"])
        if live:
            active.append(c)
    camp_out = [{"id": i, "label": c["label"], "pct": c["pct"],
                 "end": c["end"].isoformat() if c["end"] else ""} for i, c in enumerate(active)]

    for code, st in stock.items():
        pr = prices.get(code)
        bases = [v for v in (pr["base"].values() if pr else []) if v]
        if not pr or not bases or statistics.median(bases) < 0.5:
            missing.append(code)
            continue
        ref = statistics.median(bases)
        lst = rnd(max(ref / (1 + P["extra cost"]), ref * (1 - P["max discount"])), P["rounding"])
        srps = [v for v in pr["srp"].values() if v]  # VAT included, as the offices publish it
        srp = round(max(srps), 2) if srps else 0
        flag = {"available": 1, "etd": 2}.get(st, 0)
        rec = [lst, srp, flag]
        best = None
        for i, c in enumerate(active):
            hit = code.upper() in c["skus"] or (
                (c["pgs"] or c["brands"]) and
                (not c["pgs"] or pr["pg"].lower() in c["pgs"]) and
                (not c["brands"] or pr["brand"].lower() in c["brands"]))
            if hit and (best is None or c["pct"] > active[best]["pct"]):
                best = i
        if best is not None:
            floor = ref * (1 - P["campaign floor"])
            net = rnd(lst * (1 - active[best]["pct"]), P["rounding"])
            if net < floor:
                warnings.append(f"{code}: campaign '{active[best]['label']}' capped at floor")
                net = rnd(floor, P["rounding"])
            if net < lst:
                rec.append(best)
                rec.append(net)
        items[code] = rec

    data = {
        "generated": datetime.now().strftime("%Y-%m-%d %H:%M"),
        "currency": "EUR",
        "minOrder": P["minimum order"],
        "campaigns": camp_out,
        "items": items,  # code: [list, srpInclVat, stock(1=avail,2=etd,0=n/a), campaignId?, campaignNet?]
    }
    return data, missing, warnings


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--xlsx", required=True)
    ap.add_argument("--out", default=str(ROOT / "prices-data.js"))
    ap.add_argument("--today", help="YYYY-MM-DD, for testing campaign dates")
    a = ap.parse_args()
    today = datetime.strptime(a.today, "%Y-%m-%d").date() if a.today else None
    data, missing, warnings = build(a.xlsx, today)
    js = ("/* Generated by tools/build_prices.py — do not edit by hand. */\n"
          "window.SHIMANO_PRICES = " + json.dumps(data, separators=(",", ":"), ensure_ascii=False) + ";\n")
    Path(a.out).write_text(js, encoding="utf-8")
    print(f"prices-data.js: {len(data['items'])} priced SKUs, {len(missing)} without price, "
          f"{len(data['campaigns'])} active campaign(s), "
          f"{sum(1 for v in data['items'].values() if len(v) > 3)} SKUs on campaign")
    for w in warnings[:50]:
        print("WARNING:", w)


if __name__ == "__main__":
    main()
