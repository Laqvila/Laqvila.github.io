# -*- coding: utf-8 -*-
"""Riscrive i KPI dentro le pagine HTML gia' pubblicate, leggendoli da numeri.json.

Serve all'automazione settimanale: aggiorna_numeri.py aggiorna il JSON, questo script
propaga i nuovi valori nel markup statico. Senza di lui il numero visibile senza
JavaScript resterebbe fermo all'ultima generazione del sito.

Non rigenera nulla e non ha bisogno dei sorgenti in _source/: tocca soltanto gli
attributi data-count e il testo dei contatori, piu' la data di ultimo aggiornamento.
"""
import json
import os
import re
import sys

SITE = os.environ.get("ETEL_SITE_DIR") or os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
NUMERI = os.path.join(SITE, "assets", "data", "numeri.json")


# decimali e suffisso per chiave: il markup v6 non li porta piu' come attributi
FORMATO = {"presenza_pct": (1, "%"), "affidabilita": (1, "%")}


def fmt_num(v, lang, decimals, suffix):
    """Stessa formattazione di _source/gen_site.py (il francese separa le migliaia con lo spazio insecabile)."""
    if lang == "en":
        dec_sep, tho_sep = ".", ","
    elif lang == "fr":
        dec_sep, tho_sep = ",", " "
    else:
        dec_sep, tho_sep = ",", "."
    if decimals:
        s = ("%.*f" % (decimals, float(v))).replace(".", dec_sep)
    else:
        s = "%d" % round(float(v))
        if abs(float(v)) >= 1000:
            head, groups = s.lstrip("-"), []
            while len(head) > 3:
                groups.insert(0, head[-3:])
                head = head[:-3]
            groups.insert(0, head)
            s = ("-" if s.startswith("-") else "") + tho_sep.join(groups)
    return s + suffix


def main():
    try:
        num = json.load(open(NUMERI, encoding="utf-8"))
    except (OSError, ValueError) as e:
        print("numeri.json illeggibile (%s): non tocco le pagine." % e)
        return 1

    # Un KPI pubblico non puo' diventare 0 o vuoto: se il dato non e' utilizzabile,
    # e' meglio lasciare in pagina il valore precedente, che era reale.
    usabili = {k: v for k, v in num.items()
               if isinstance(v, (int, float)) and not isinstance(v, bool) and v != 0}
    if not usabili:
        print("Nessun valore utilizzabile in numeri.json: pagine invariate.")
        return 1

    data_iso = num.get("aggiornato", "")
    # markup v6: <div class="kpi-value" data-num-key="KEY" data-count="VAL">VAL formattato</div>
    span_re = re.compile(
        r'(<div class="kpi-value" data-num-key="([a-z_]+)" data-count=")([^"]*)(">)([^<]*)(</div>)')
    # markup v6: <time datetime="AAAA-MM-GG" data-num-updated>data formattata</time>
    upd_re = re.compile(r'(<time datetime=")([^"]*)(" data-num-updated>)([^<]*)(</time>)')

    toccate = 0
    for root, _dirs, files in os.walk(SITE):
        for fn in files:
            if not fn.endswith(".html"):
                continue
            path = os.path.join(root, fn)
            src = open(path, encoding="utf-8").read()
            m = re.search(r'<html lang="([a-z]{2})"', src)
            lang = m.group(1) if m else "it"

            def sub(mo):
                key = mo.group(2)
                if key not in usabili:
                    return mo.group(0)
                dec, suf = FORMATO.get(key, (0, ""))
                val = usabili[key]
                return "%s%s%s%s%s" % (mo.group(1), val, mo.group(4),
                                       fmt_num(val, lang, dec, suf), mo.group(6))

            out = span_re.sub(sub, src)
            if data_iso and len(data_iso) == 10:
                y, mth, d = data_iso.split("-")
                if lang == "de":
                    shown = "%s.%s.%s" % (d, mth, y)
                else:
                    shown = "%s/%s/%s" % (d, mth, y)
                out = upd_re.sub(lambda mo: mo.group(1) + data_iso + mo.group(3) + shown + mo.group(5), out)
            if out != src:
                open(path, "w", encoding="utf-8").write(out)
                toccate += 1

    print("Pagine aggiornate: %d" % toccate)
    return 0


if __name__ == "__main__":
    sys.exit(main())
