#!/usr/bin/env python3
"""
Generates ticker-auto.js from stock changes between two git revisions.

Run by .github/workflows/ticker-auto.yml after every push that touches a
catalog page (the daily 10:00 stock update). Compares the catalogs at
--old-ref with the working tree and writes window.SHIMANO_TICKER_AUTO:

  * "<CATALOG>: N new products"     -> codes that did not exist before
  * "<CATALOG>: N back in stock"    -> unavailable/ETD before, available now
  * "Stock updated: 06 Oct 2026"    -> always present, refreshed every run

Change lines carry "items": [{"c": code, "n": desc1, "d": desc2, "g": group}],
which
news-ticker.js shows in a popup when a dealer hovers/taps the line.

Lines live for LIFETIME_DAYS (via "expires"), so a quiet day does not blank
the ticker. English only: dealer-facing text.

Usage: python3 tools/gen_ticker_auto.py --old-ref <git-sha> [--out ticker-auto.js]
"""
import argparse, json, os, re, subprocess, sys
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
MAX_ITEMS_PER_LINE = 400   # product list shown in the ticker hover popup
MAX_JSON_BYTES = 250000

OBJ = re.compile(r"\{[^{}]*\}")
CODE = re.compile(r"""["']?(?:code|sku|s)["']?\s*:\s*["']([A-Za-z0-9._-]{5,})["']""")
STATUS = re.compile(r"""["']?status["']?\s*:\s*["'](\w+)["']""")
ETD_VALUE = re.compile(r"""["']?etd["']?\s*:\s*["']([^"']*)["']""")
PRO_STATUS = re.compile(r"""\bst\s*:\s*["'](\w)["']""")
DESC1 = re.compile(r"""["']?(?:desc1|d1)["']?\s*:\s*["']([^"']*)["']""")
DESC2 = re.compile(r"""["']?(?:desc2|d2)["']?\s*:\s*["']([^"']*)["']""")
GROUP = re.compile(r"""["']?(?:group|sub)["']?\s*:\s*["']([^"']*)["']""")


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
    """-> {code: (status, desc1, desc2, group)} for every item-looking object in a page."""
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
        d, d2, g = DESC1.search(o), DESC2.search(o), GROUP.search(o)
        out[c.group(1)] = (status, d.group(1).strip() if d else "",
                           d2.group(1).strip() if d2 else "", g.group(1).strip() if g else "")
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


def line(label, page, n, what, pairs):
    """pairs: [(code, (status, desc1, desc2, group)), ...] -> one ticker line + product list."""
    descs = [v[1] for _, v in pairs]
    nm = names(descs)
    if 0 < len(nm) <= NAME_LIMIT:
        title = f"{label}: {what} – " + ", ".join(nm)
    else:
        title = f"{label}: {n} {what}" if what != "new" else f"{label}: {n} new products added"
    items = []
    for c, v in sorted(pairs, key=lambda p: (p[1][3].lower(), p[1][1], p[1][2], p[0])):
        it = {"c": c, "n": v[1]}
        if v[2]:
            it["d"] = v[2]
        if v[3]:
            it["g"] = v[3]
        items.append(it)
    return {"title": title, "link": page, "items": items[:MAX_ITEMS_PER_LINE]}


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


def dump(items):
    """Pretty top level, one product per line (keeps the file small and diffable)."""
    rows = []
    for x in items:
        head = {k: v for k, v in x.items() if k != "items"}
        txt = json.dumps(head, indent=2, ensure_ascii=False)
        if x.get("items"):
            prods = ",\n".join("    " + json.dumps(i, ensure_ascii=False) for i in x["items"])
            txt = txt[:-2] + ',\n  "items": [\n' + prods + "\n  ]\n}"
        rows.append("\n".join("  " + l for l in txt.split("\n")))
    return "[\n" + ",\n".join(rows) + "\n]"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--old-ref", required=True)
    ap.add_argument("--out", default="ticker-auto.js")
    a = ap.parse_args()
    out_path = ROOT / a.out
    today = date.fromisoformat(os.environ["TICKER_TODAY"]) if os.environ.get("TICKER_TODAY") else date.today()   # TICKER_TODAY: test only
    exp = (today + timedelta(days=LIFETIME_DAYS)).isoformat()

    fresh = []
    current = {}                          # page -> parse() of today's catalog
    for page, label in PAGES:
        new_t = (ROOT / page).read_text(encoding="utf-8")
        current[page] = parse(new_t)
        old_t = old_text(a.old_ref, page)
        if old_t is None:
            continue
        new, old = current[page], parse(old_t)
        if not old:                       # parser found nothing before: do not guess
            print(f"! {page}: no items parsed from old revision, skipped", file=sys.stderr)
            continue
        added = [(c, v) for c, v in new.items() if c not in old and v[0] != "unavailable"]
        back = [(c, v) for c, v in new.items()
                if c in old and old[c][0] != "available" and v[0] == "available"]
        print(f"{page}: parsed {len(new)} (old {len(old)}), new {len(added)}, back {len(back)}")
        if added:
            fresh.append(line(label, page, len(added), "new", added))
        if back:
            fresh.append(line(label, page, len(back), "back in stock", back))

    for f in fresh:
        f["added"] = today.isoformat()
        f["expires"] = exp
        f["auto"] = "change"
        for it in f.get("items", []):
            it["t"] = today.isoformat()      # day this product entered the line

    stamp = {"title": f"Stock updated: {stock_stamp()}", "added": today.isoformat(),
             "expires": exp, "auto": "stamp"}

    kept = [x for x in read_existing(out_path)
            if x.get("auto") == "change" and x.get("expires", "") >= today.isoformat()]

    # One line per catalogue and kind: "back in stock" (or "new") lines from several
    # stock updates are merged instead of scrolling past one after another.
    # Every product keeps its own date ("t") and leaves the line LIFETIME_DAYS
    # after that day, so the count is "back in stock in the last 7 days" and
    # never just keeps growing.
    cutoff = (today - timedelta(days=LIFETIME_DAYS - 1)).isoformat()
    labels = dict(PAGES)
    merged, order = {}, []
    for x in fresh + kept:                # newest first
        page = x.get("link", "")
        kind = "back in stock" if "back in stock" in x.get("title", "") else "new"
        key = (page, kind)
        if key not in merged:
            merged[key] = {"codes": [], "t": {}}
            order.append(key)
        m = merged[key]
        for it in x.get("items", []):
            c, t = it.get("c"), it.get("t") or x.get("added", "")
            if not c or t < cutoff:
                continue                       # older than a week: drop
            if c not in m["t"]:
                m["codes"].append(c)
                m["t"][c] = t
            else:
                m["t"][c] = max(m["t"][c], t)
    lines = []
    for page, kind in order:
        m, cur = merged[(page, kind)], current.get(page, {})
        # keep only products that are still in the catalogue and still in that state
        if kind == "back in stock":
            pairs = [(c, cur[c]) for c in m["codes"] if c in cur and cur[c][0] == "available"]
        else:
            pairs = [(c, cur[c]) for c in m["codes"] if c in cur and cur[c][0] != "unavailable"]
        if not pairs or page not in labels:
            continue
        ln = line(labels[page], page, len(pairs), "new" if kind == "new" else kind, pairs)
        for it in ln["items"]:
            it["t"] = m["t"][it["c"]]
        newest = max(it["t"] for it in ln["items"])
        ln.update({"added": newest, "auto": "change",
                   "expires": (date.fromisoformat(newest) + timedelta(days=LIFETIME_DAYS)).isoformat()})
        lines.append(ln)

    # "Stock updated" always first
    items = [stamp] + lines
    while len(json.dumps(items)) > MAX_JSON_BYTES and len(items) > 1:
        items.pop()

    body = ("/* AUTO-GENERATED by tools/gen_ticker_auto.py — do not edit by hand.\n"
            "   Replaced on every stock update push. */\n"
            "window.SHIMANO_TICKER_AUTO = " + dump(items) + ";\n")
    out_path.write_text(body, encoding="utf-8")
    print(f"wrote {out_path.name}: {len(items)} items")


if __name__ == "__main__":
    main()
