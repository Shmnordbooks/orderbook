#!/usr/bin/env python3
"""
Generates ticker-auto.js from stock changes between two git revisions.

Run by .github/workflows/ticker-auto.yml after every push that touches a
catalog page (the daily 10:00 stock update). Compares the catalogs at
--old-ref with the working tree and writes window.SHIMANO_TICKER_AUTO:

  * "<CATALOG>: N new products"     -> codes that did not exist before
  * "<CATALOG>: N back in stock"    -> unavailable/ETD before, available now
  * "Stock updated: 06 Oct 2026"    -> always present, refreshed every run

Lines live for LIFETIME_DAYS (via "expires"), so a quiet day does not blank
the ticker. English only: dealer-facing text.

Usage: python3 tools/gen_ticker_auto.py --old-ref <git-sha> [--out ticker-auto.js]
"""
import argparse, json, re, subprocess, sys
from datetime import date, timedelta
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PAGES = [  # (file, label shown to dealers)
    ("hardgoods.html", "HARDGOODS"),
    ("shoes.html", "SHOES"),
    ("pedals.html", "PEDALS"),
    ("eyewear.html", "EYEWEAR"),
    ("lazer.html", "LAZER"),
    ("pro.html", "PRO"),
]
LIFETIME_DAYS = 7
NAME_LIMIT = 3        # list product names when at most this many distinct ones
MAX_JSON_BYTES = 20000

OBJ = re.compile(r"\{[^{}]*\}")
CODE = re.compile(r"""["']?(?:code|sku|s)["']?\s*:\s*["']([A-Za-z0-9._-]{5,})["']""")
STATUS = re.compile(r"""["']?status["']?\s*:\s*["'](\w+)["']""")
ETD_VALUE = re.compile(r"""["']?etd["']?\s*:\s*["']([^"']*)["']""")
PRO_STATUS = re.compile(r"""\bst\s*:\s*["'](\w)["']""")
DESC1 = re.compile(r"""["']?(?:desc1|d1)["']?\s*:\s*["']([^"']*)["']""")


def norm(code_status):
    s = (code_status or "").lower()
    if s in ("available", "a"):
        return "available"
    if s in ("etd", "e"):
        return "etd"
    return "unavailable"


def norm_etd_value(v):
    """lazer.html keeps the status inside the etd field."""
    v = (v or "").strip().lower()
    if v == "available":
        return "available"
    if not v or v.startswith("unavail") or v == "n/a":
        return "unavailable"
    return "etd"


def parse(text):
    """-> {code: (status, desc1)} for every item-looking object in a page."""
    out = {}
    for m in OBJ.finditer(text):
        o = m.group(0)
        c = CODE.search(o)
        if not c:
            continue
        st = STATUS.search(o)
        if st:
            status = norm(st.group(1))
        else:
            p = PRO_STATUS.search(o)
            e = ETD_VALUE.search(o)
            if p:
                status = norm(p.group(1))
            elif e:
                status = norm_etd_value(e.group(1))
            else:
                continue
        d = DESC1.search(o)
        out[c.group(1)] = (status, d.group(1).strip() if d else "")
    return out


def old_text(ref, path):
    r = subprocess.run(["git", "show", f"{ref}:{path}"], cwd=ROOT,
                       capture_output=True, text=True, encoding="utf-8")
    return r.stdout if r.returncode == 0 else None


def names(descs):
    seen = []
    for d in descs:
        d = re.sub(r"^(Bicycle Shoes|Pedal|Eyewear)\s+", "", d).strip()
        if d and d not in seen:
            seen.append(d)
    return seen


def line(label, page, n, what, descs):
    nm = names(descs)
    if 0 < len(nm) <= NAME_LIMIT:
        title = f"{label}: {what} – " + ", ".join(nm)
    else:
        title = f"{label}: {n} {what}" if what != "new" else f"{label}: {n} new products added"
    return {"title": title, "link": page}


def read_existing(path):
    if not path.exists():
        return []
    t = path.read_text(encoding="utf-8")
    m = re.search(r"SHIMANO_TICKER_AUTO\s*=\s*(\[.*\]);", t, re.S)
    try:
        return json.loads(m.group(1)) if m else []
    except ValueError:
        return []


def stock_stamp():
    t = (ROOT / "hardgoods.html").read_text(encoding="utf-8")
    m = re.search(r'id="stockUpdatedTime"[^>]*>\s*(\d{1,2} \w{3} \d{4})', t)
    return m.group(1) if m else date.today().strftime("%d %b %Y")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--old-ref", required=True)
    ap.add_argument("--out", default="ticker-auto.js")
    a = ap.parse_args()
    out_path = ROOT / a.out
    today = date.today()
    exp = (today + timedelta(days=LIFETIME_DAYS)).isoformat()

    fresh = []
    for page, label in PAGES:
        new_t = (ROOT / page).read_text(encoding="utf-8")
        old_t = old_text(a.old_ref, page)
        if old_t is None:
            continue
        new, old = parse(new_t), parse(old_t)
        if not old:                       # parser found nothing before: do not guess
            print(f"! {page}: no items parsed from old revision, skipped", file=sys.stderr)
            continue
        added = [(c, v) for c, v in new.items() if c not in old and v[0] != "unavailable"]
        back = [(c, v) for c, v in new.items()
                if c in old and old[c][0] != "available" and v[0] == "available"]
        print(f"{page}: parsed {len(new)} (old {len(old)}), new {len(added)}, back {len(back)}")
        if added:
            fresh.append(line(label, page, len(added), "new", [v[1] for _, v in added]))
        if back:
            fresh.append(line(label, page, len(back), "back in stock", [v[1] for _, v in back]))

    for f in fresh:
        f["added"] = today.isoformat()
        f["expires"] = exp
        f["auto"] = "change"

    stamp = {"title": f"Stock updated: {stock_stamp()}", "added": today.isoformat(),
             "expires": exp, "auto": "stamp"}

    kept = [x for x in read_existing(out_path)
            if x.get("auto") == "change" and x.get("expires", "") >= today.isoformat()
            and x.get("title") not in {f["title"] for f in fresh}]
    items = fresh + kept + [stamp]
    while len(json.dumps(items)) > MAX_JSON_BYTES and len(items) > 1:
        items.pop(-2)

    body = ("/* AUTO-GENERATED by tools/gen_ticker_auto.py — do not edit by hand.\n"
            "   Replaced on every stock update push. */\n"
            "window.SHIMANO_TICKER_AUTO = " + json.dumps(items, indent=2, ensure_ascii=False) + ";\n")
    out_path.write_text(body, encoding="utf-8")
    print(f"wrote {out_path.name}: {len(items)} items")


if __name__ == "__main__":
    main()
