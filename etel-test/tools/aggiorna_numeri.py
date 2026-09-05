# -*- coding: utf-8 -*-
"""Aggiorna i numeri della dashboard leggendoli dalla fonte pubblica (Openpolis).

Pensato per girare sia in locale sia in GitHub Actions (settimanale).
Se il fetch fallisce o i dati non sono plausibili, NON tocca il file esistente:
meglio numeri vecchi ma corretti che numeri sbagliati.
"""
import json, os, re, sys, html, urllib.request, datetime

URL = "https://parlamento19.openpolis.it/persone/etelwardo-sigismondi-1974-09-29"
UA = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/122.0 Safari/537.36")

HERE = os.path.dirname(os.path.abspath(__file__))
SITE = os.environ.get("ETEL_SITE_DIR") or os.path.join(os.path.dirname(HERE), "etel-test")
OUT = os.path.join(SITE, "assets", "data", "numeri.json")


def fetch(url):
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept-Language": "it-IT,it;q=0.9"})
    with urllib.request.urlopen(req, timeout=45) as r:
        return r.read().decode("utf-8", "ignore")


def to_text(page):
    t = re.sub(r"<script.*?</script>|<style.*?</style>", " ", page, flags=re.S)
    t = html.unescape(re.sub(r"<[^>]+>", "\n", t))
    return [l.strip() for l in t.split("\n") if l.strip()]


def num(s):
    return float(s.replace(".", "").replace(",", "."))


def parse(lines):
    """Estrae i numeri dalla pagina Openpolis. Ritorna dict o solleva ValueError."""
    joined = "\n".join(lines)
    d = {}

    m = re.search(r"(\d{1,3},\d)\s*%?\s*\n\s*/?([\d.]+)\s*\n\s*/?([\d.]+)\s*\n\s*([\d.]+)\s+votazioni", joined)
    if m:
        d["presenza_pct"] = num(m.group(1))
        d["votazioni"] = int(num(m.group(4)))
    else:
        m2 = re.search(r"([\d.]+)\s+votazioni", joined)
        if not m2:
            raise ValueError("numero votazioni non trovato")
        d["votazioni"] = int(num(m2.group(1)))
        m3 = re.search(r"Presenze\s*\n\s*Assenze\s*\n\s*Missioni\s*\n\s*(\d{1,3},\d)", joined)
        if not m3:
            raise ValueError("percentuale presenze non trovata")
        d["presenza_pct"] = num(m3.group(1))

    m = re.search(r"Voti di fiducia\s*\n\s*(\d+)\s*\n\s*Votazione", joined)
    if not m:
        m = re.search(r"\.\s*\n\s*Voti di fiducia\s*\n\s*(\d+)", joined)
    if m:
        d["fiducia"] = int(m.group(1))

    m = re.search(r"Voti ribelli\s*\n\s*(\d+)\s*\n\s*Votazione", joined)
    if m:
        d["ribelli"] = int(m.group(1))

    m = re.search(r"I disegni di legge presentati come primo firmatario\s*\n\s*(\d+)", joined)
    if m:
        d["ddl"] = int(m.group(1))

    for i, l in enumerate(lines):
        if "indice di affidabilit" in l.lower():
            for cand in lines[i:i + 25]:
                mm = re.fullmatch(r"(\d{1,3},\d)\s*%?", cand)
                if mm:
                    d["affidabilita"] = num(mm.group(1))
                    break
            if "affidabilita" in d:
                break
    return d


def plausible(d):
    ok = (0 < d.get("presenza_pct", 0) <= 100
          and 1000 < d.get("votazioni", 0) < 100000
          and 0 <= d.get("fiducia", 0) < 1000
          and 0 <= d.get("ddl", 0) < 200)
    if "affidabilita" in d and not (0 < d["affidabilita"] <= 100):
        return False
    return ok


def main():
    prev = {}
    if os.path.exists(OUT):
        try:
            prev = json.load(open(OUT, encoding="utf-8"))
        except Exception:
            prev = {}

    try:
        d = parse(to_text(fetch(URL)))
    except Exception as e:
        print("FETCH/PARSE FALLITO:", e)
        if prev:
            print("Mantengo i valori precedenti:", {k: prev.get(k) for k in ("presenza_pct", "votazioni")})
            return 0
        return 1

    if not plausible(d):
        print("Valori non plausibili, scartati:", d)
        return 1

    # dati non presenti su Openpolis, mantenuti manualmente
    d["comunicati"] = prev.get("comunicati", 41)
    d["fonte"] = URL
    d["aggiornato"] = datetime.date.today().isoformat()

    changed = any(prev.get(k) != d.get(k) for k in
                  ("presenza_pct", "votazioni", "fiducia", "ddl", "affidabilita", "ribelli", "comunicati"))
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    json.dump(d, open(OUT, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print(("AGGIORNATI" if changed else "invariati") + ":", json.dumps(d, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    sys.exit(main())
