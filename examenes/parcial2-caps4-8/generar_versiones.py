# -*- coding: utf-8 -*-
"""Genera las versiones A, B y C del 2.º parcial, sus claves comentadas, el archivo maestro de claves
(claves.json, que usará el calificador de escaneos) y la rúbrica con las claves de respuesta.

Estrategia de versiones
  1. Mismos 24 conceptos y mismo número de correctas k por reactivo (mismo puntaje máximo).
  2. Variantes numéricas en los reactivos 3, 8, 10, 15, 16, 18 y 23 (variantes.py), con la misma estructura.
  3. Orden de los reactivos: los 6 bloques temáticos rotan (A: S4..INF; B empieza en S6; C empieza en S8) y
     dentro de cada bloque el orden cambia: ningún reactivo ocupa la misma posición en dos versiones.
  4. Orden de las opciones permutado; el conjunto de letras correctas de un mismo reactivo es distinto en A, B y C.
La versión A es la aprobada: se genera con la misma semilla y las mismas claves que antes.

Uso:  python generar_versiones.py && ./compilar.sh
"""
import itertools
import json
import random
import re
from pathlib import Path

from banco_reactivos import BANCO
from variantes import VARIANTES
import generar_examen as G        # reutiliza FIG, permutar (versión A aprobada) y serie_coords

AQUI = Path(__file__).resolve().parent
LET = "abcd"
SEMILLAS = {"A": 2026, "B": 2027, "C": 2028}
BLOQUES = [list(range(i, i + 4)) for i in range(1, 25, 4)]          # ids base 1-4, 5-8, ...
NOM_BLOQUE = ["Sesión 4", "Sesión 5 (Google Analytics)", "Sesión 6", "Sesión 7", "Sesión 8 (teoría)", "Influencers"]
ROT = {"A": 0, "B": 2, "C": 4}

# las tablas se numeran por orden de aparición en cada versión
FIG = {k: (re.sub(r"Tabla \d\.", "Tabla @T@.", v) if v else v) for k, v in G.FIG.items()}


# ------------------------------------------------------------------ preguntas, orden y permutaciones
def pregunta(v, base_id):
    if v != "A" and base_id in VARIANTES[v]:
        return VARIANTES[v][base_id]
    q = dict(BANCO[base_id - 1]); q["id"] = base_id
    return q


def orden_version(v):
    """Lista de ids base en el orden de la versión v."""
    if v == "A":
        return list(range(1, 25))
    rng = random.Random(SEMILLAS[v] * 7)
    previos = {"A": BLOQUES}
    bloques = [BLOQUES[(i + ROT[v]) % 6] for i in range(6)]
    out = []
    for b in bloques:
        for _ in range(1000):
            p = b[:]; rng.shuffle(p)
            if all(p[i] != b[i] for i in range(4)):          # ningún reactivo en su posición relativa de A
                break
        out += p
    return out


def permutar(qs, semilla, prev):
    """Permutación de opciones: letras balanceadas, sin repetir el conjunto de claves de versiones previas
    para el mismo reactivo ni en reactivos consecutivos, y sin 4 seguidos con la misma letra correcta."""
    rng = random.Random(semilla)
    cand = []
    for q in qs:
        c = []
        for p in itertools.permutations(range(4)):
            key = tuple(sorted(pos for pos, idx in enumerate(p) if q["o"][idx][1]))
            if key not in prev.get(q["id"], set()):
                c.append((p, key))
        cand.append(c)
    for _ in range(400000):
        sel = [rng.choice(c) for c in cand]
        claves = [s[1] for s in sel]
        if any(claves[i] == claves[i + 1] for i in range(len(claves) - 1)):
            continue
        cuenta = [sum(1 for c in claves if l in c) for l in range(4)]
        if max(cuenta) - min(cuenta) > 2:
            continue
        if any(all(l in claves[i + k] for k in range(4)) for l in range(4) for i in range(len(claves) - 3)):
            continue
        return [s[0] for s in sel], claves, cuenta
    raise RuntimeError("sin permutación válida")


def construir():
    ver, prev = {}, {}
    for v in "ABC":
        ids = orden_version(v)
        qs = [pregunta(v, i) for i in ids]
        if v == "A":
            perms, claves, cuenta = G.permutar(G.SEMILLA_A)     # exactamente la versión A aprobada
        else:
            perms, claves, cuenta = permutar(qs, SEMILLAS[v], prev)
        for q, c in zip(qs, claves):
            prev.setdefault(q["id"], set()).add(tuple(c))
        ver[v] = dict(ids=ids, qs=qs, perms=perms, claves=claves, cuenta=cuenta)
    # coherencia: mismo k por reactivo en las tres versiones
    for i in range(1, 25):
        ks = {len(ver[v]["claves"][ver[v]["ids"].index(i)]) for v in "ABC"}
        assert len(ks) == 1, i
    return ver


# ------------------------------------------------------------------ examen
PRE = r"""\documentclass[10pt,letterpaper]{article}
\usepackage[utf8]{inputenc}\usepackage[T1]{fontenc}\usepackage{lmodern}
\usepackage[spanish,es-noshorthands]{babel}\usepackage{csquotes}
\usepackage[top=1.55cm,bottom=0.9cm,left=1.0cm,right=1.0cm,headheight=0.5cm,headsep=0.25cm,nofoot]{geometry}
\usepackage{needspace,multicol,amsmath,amssymb,graphicx,xcolor,array,enumitem,booktabs,fancyhdr,lastpage}
\usepackage{pgfplots}\pgfplotsset{compat=1.17}\usetikzlibrary{arrows.meta}
\definecolor{guinda}{HTML}{6F1D46}\definecolor{tinta}{HTML}{000000}
\newcommand{\cas}{\framebox[1.0em]{\rule{0pt}{1.05ex}}}
\fancypagestyle{cont}{\fancyhf{}\renewcommand{\headrulewidth}{0.3pt}%
 \fancyhead[L]{\footnotesize\textbf{Nombre:} \rule{7.2cm}{0.3pt}\quad\textbf{Boleta:} \rule{2.4cm}{0.3pt}}%
 \fancyhead[R]{\footnotesize\textbf{Versión @V@} · hoja \thepage\ de \pageref{LastPage}}}
\pagestyle{cont}
\setlength{\parindent}{0pt}\setlength{\columnsep}{0.55cm}\setlength{\columnseprule}{0.3pt}
"""

ECUACIONES = (r"""{\footnotesize\noindent\fbox{\parbox{\dimexpr\linewidth-2\fboxsep-2\fboxrule}{\textbf{Ecuaciones de apoyo} (para los reactivos que las requieran). \textit{Regla aditiva:} $U_i=\sum_j w_j\,s_{ij}$; \textit{conjuntiva:} se exige $s_{ij}\geq u$ en todos los atributos; \textit{lexicográfica:} gana la mejor alternativa en el atributo prioritario y se considera empatada la que quede a $\tau$ o menos de ella. \textit{Creadores:} $ER=100\times\text{interacciones}/\text{seguidores}$;\ \ $CPE=\text{costo}/\text{interacciones}$;\ \ $CPM_{seg}=1000\times\text{costo}/\text{seguidores}$.}}}\vspace{3pt}""")

INSTR = (r"""{\footnotesize\textbf{Duración: 50 min.} Contesta \textbf{en esta misma hoja}, con lápiz. Cada reactivo tiene cuatro opciones (a--d) y \textbf{puede haber de una a tres correctas}: marca con una \textbf{X} el cuadro de \textbf{todas} las que consideres correctas y deja \textbf{vacío} el de las demás. Si te equivocas, borra por completo la marca. Cada opción correcta marcada suma $1/k$ y cada incorrecta marcada resta $1/k$ ($k$ = número de correctas del reactivo); el mínimo por reactivo es 0, así que marcar todas las opciones no conviene. Cada reactivo vale $10/24$ de punto. \textbf{Escribe tu nombre en cada hoja.} Algunos reactivos piden leer figuras o tablas; los datos \enquote{hipotéticos} son casos construidos para el examen. Lee con atención cada enunciado.}""")


def extra_tex(q):
    if q.get("extra"):
        return q["extra"]
    if q.get("fig"):
        return G.figura(q["fig"])
    if q.get("tabla"):
        return FIG[q["tabla"]]
    return ""


def examen(d, v):
    L = [PRE.replace("@V@", v), r"\begin{document}\fontsize{8.7}{10.0}\selectfont\color{tinta}\thispagestyle{empty}\vspace*{-0.7cm}"]
    L.append(r"""\begin{minipage}{0.09\textwidth}\includegraphics[height=1.15cm]{ipn-escudo.png}\end{minipage}%
\begin{minipage}{0.70\textwidth}\centering
{\color{guinda}\textbf{\large Instituto Politécnico Nacional · ESCA Unidad Santo Tomás}}\\[-1pt]
{\small Laboratorio: Gestión de datos, comportamiento y perfiles del consumidor digital}\\[1pt]
{\normalsize\textbf{Examen del 2.º parcial (Sesiones 4 a 8 e Influencers)}} \hfill {\small \textbf{Dr. Aboud Barsekh-Onji}}
\end{minipage}%
\begin{minipage}{0.19\textwidth}\centering
{\color{guinda}\fbox{\parbox[c][1.0cm][c]{1.3cm}{\centering\textbf{\scriptsize VERSIÓN}\\[-2pt]{\Huge\textbf{@@V@@}}}}}
\end{minipage}
\vspace{2pt}\hrule\vspace{3pt}
{\small\textbf{Nombre:} \rule{7.2cm}{0.3pt} \hfill \textbf{Boleta:} \rule{2.4cm}{0.3pt} \hfill \textbf{Fecha:} \rule{2.2cm}{0.3pt} \hfill \textbf{Calif.:} \rule{1.5cm}{0.3pt}}\\[3pt]
""".replace("@@V@@", v) + INSTR + r"""
\vspace{2pt}\hrule\vspace{4pt}
""" + ECUACIONES)
    L.append(r"\begin{multicols}{2}")
    nt = 0
    for n, (q, p) in enumerate(zip(d["qs"], d["perms"]), 1):
        ex = extra_tex(q)
        while "@T@" in ex:
            nt += 1
            ex = ex.replace("@T@", str(nt), 1)
        L.append(r"\begin{minipage}[t]{\columnwidth}\noindent\textbf{%d.} %s" % (n, q["q"]))
        if ex:
            L.append(ex)
        L.append(r"\vspace{1pt}\begin{enumerate}[label=\cas\ \alph*),leftmargin=2.3em,itemsep=1.2pt,topsep=1pt,parsep=0pt,partopsep=0pt]")
        for idx in p:
            L.append(r"\item " + q["o"][idx][0])
        L.append(r"\end{enumerate}\end{minipage}\par\vspace{3pt}")
    L.append(r"\end{multicols}\end{document}")
    return "\n".join(L)


# ------------------------------------------------------------------ clave comentada por versión
CLAVE_PRE = r"""\documentclass[10pt,letterpaper]{article}
\usepackage[utf8]{inputenc}\usepackage[T1]{fontenc}\usepackage{lmodern}
\usepackage[spanish,es-noshorthands]{babel}\usepackage{csquotes}
\usepackage[margin=1.7cm]{geometry}\usepackage{amsmath,amssymb,xcolor,array,booktabs,enumitem,longtable}
\definecolor{guinda}{HTML}{6F1D46}
\setlength{\parindent}{0pt}\setlength{\parskip}{3pt}
"""


def esc_pct(s):
    return re.sub(r"(?<!\\)%", r"\\%", s)


def clave_comentada(d, v):
    L = [CLAVE_PRE, r"\begin{document}",
         r"{\color{guinda}\large\textbf{Clave comentada — Examen del 2.º parcial, versión %s}}\\" % v,
         r"{\small Sesiones 4 a 8 (sin el laboratorio de la 8) e Influencers · 24 reactivos · 1 a 3 correctas · \textbf{documento del profesor}}",
         r"\vspace{4pt}\hrule\vspace{4pt}",
         r"\textbf{Calificación:} por reactivo $\max\{0,(A-E)/k\}$; cada reactivo vale $10/24$. Letras correctas en esta versión: " +
         ", ".join(f"{LET[i]}: {d['cuenta'][i]}" for i in range(4)) + ".",
         r"\subsection*{Resumen de claves}\begin{center}\footnotesize\begin{tabular}{@{}rllcl@{}}\toprule N.º & Bloque & Tema & Correctas & Dificultad\\\midrule"]
    for n, (q, c) in enumerate(zip(d["qs"], d["claves"]), 1):
        L.append(r"%d & %s & %s & \textbf{%s} & %s\\" % (n, NOM_BLOQUE[(q["id"] - 1) // 4], q["tema"], ", ".join(LET[i] for i in c), q["dif"]))
    L.append(r"\bottomrule\end{tabular}\end{center}\subsection*{Justificación por reactivo}")
    for n, (q, p, c) in enumerate(zip(d["qs"], d["perms"], d["claves"]), 1):
        L.append(r"\vspace{3pt}\noindent\textbf{%d.} \textit{%s} (reactivo base %d) — correctas: \textbf{%s}\\[-1pt]" % (n, q["tema"], q["id"], ", ".join(LET[i] for i in c)))
        L.append(r"{\scriptsize Fuente: %s}" % q["fuente"])
        if q.get("resumen"):
            L.append(r"\\{\scriptsize Variante: %s}" % esc_pct(q["resumen"]).replace("_", r"\_").replace("{", "").replace("}", "").replace("'", ""))
        L.append(r"\begin{itemize}[leftmargin=1.2em,itemsep=0pt,topsep=1pt,parsep=0pt]")
        for pos, idx in enumerate(p):
            t, ok, why = q["o"][idx]
            L.append(r"\item[\textbf{%s)}] {\footnotesize \textbf{[%s]} %s\\ \textit{Por qué:} %s}" % (LET[pos], "correcta" if ok else "incorrecta", t, esc_pct(why)))
        L.append(r"\end{itemize}")
    L.append(r"\end{document}")
    return "\n".join(L)


# ------------------------------------------------------------------ rúbrica y claves de respuesta
def tabla_puntaje(k):
    filas = []
    for A in range(k + 1):
        for E in range(0, 5 - k):
            if A == 0 and E == 0:
                continue
            filas.append((A, E, max(0.0, (A - E) / k)))
    return filas


def rubrica(ver):
    L = [CLAVE_PRE.replace("margin=1.7cm", "margin=1.6cm"), r"\begin{document}",
         r"{\color{guinda}\large\textbf{Rúbrica de calificación y claves de respuesta — 2.º parcial}}\\",
         r"{\small Laboratorio: Gestión de datos, comportamiento y perfiles del consumidor digital · Sesiones 4 a 8 e Influencers · \textbf{documento del profesor}}",
         r"\vspace{3pt}\hrule\vspace{3pt}",
         r"\subsection*{1. Criterio de puntuación}",
         r"El examen tiene 24 reactivos de cuatro opciones con \textbf{una a tres correctas} ($k$). En cada reactivo se cuenta: $A$ = opciones correctas marcadas; $E$ = opciones incorrectas marcadas.",
         r"\[ \text{puntaje del reactivo}=\max\left\{0,\ \frac{A-E}{k}\right\}\in[0,1],\qquad \text{calificación}=\frac{10}{24}\sum_{n=1}^{24}\text{puntaje}_n \]",
         r"Marcar todas las opciones da 0 siempre; no marcar nada da 0; marcar solo las correctas da 1. El puntaje de un reactivo con $k=2$ se otorga en pasos de 0.5; con $k=3$, en pasos de $1/3$.",
         r"\subsection*{2. Resultados posibles por reactivo}",
         r"\begin{center}\footnotesize\begin{tabular}{@{}ccc@{\hspace{2em}}ccc@{\hspace{2em}}ccc@{}}\toprule",
         r"\multicolumn{3}{c}{$k=1$} & \multicolumn{3}{c}{$k=2$} & \multicolumn{3}{c}{$k=3$}\\ $A$ & $E$ & Punt. & $A$ & $E$ & Punt. & $A$ & $E$ & Punt.\\\midrule"]
    t1, t2, t3 = tabla_puntaje(1), tabla_puntaje(2), tabla_puntaje(3)
    n = max(len(t1), len(t2), len(t3))
    def cel(t, i):
        if i >= len(t): return "&&"
        a, e, p = t[i]
        return f"{a} & {e} & {p:.2f}"
    for i in range(n):
        L.append(" & ".join([cel(t1, i), cel(t2, i), cel(t3, i)]) + r"\\")
    L.append(r"\bottomrule\end{tabular}\end{center}")
    L.append(r"\textbf{Ejemplos.} $k=3$ (correctas a, b, d): marca a, b y c $\Rightarrow A=2,E=1\Rightarrow(2-1)/3=0.33$. $k=2$ (correctas b, c): marca b, c y d $\Rightarrow(2-1)/2=0.50$. $k=1$ (correcta c): marca c y d $\Rightarrow(1-1)/1=0$.")
    L.append(r"\subsection*{3. Lectura de las hojas escaneadas}")
    L.append(r"\begin{itemize}[leftmargin=1.2em,itemsep=1pt,topsep=1pt]")
    for t in [r"Opción \textbf{marcada}: casilla con una X, tache o relleno visible dentro del cuadro. Casilla vacía: no marcada.",
              r"Marca borrada: si queda residuo tenue y no se distingue de la marca, se revisa a mano; el criterio es la intención clara del alumno.",
              r"Marca fuera del cuadro o ambigua: se marca para revisión y no se califica de forma automática.",
              r"Reactivo sin ninguna casilla marcada: 0 puntos (no se penaliza).",
              r"La versión (A, B o C) está impresa en el encabezado de \textbf{cada hoja} y el nombre se escribe en cada una; se califica con la clave de la versión impresa. Si falta el nombre en una hoja, se asocia con las otras hojas del mismo examen por el número de hoja y la versión.",
              r"Calificación final con dos decimales; el redondeo lo decide el profesor."]:
        L.append(r"\item " + t)
    L.append(r"\end{itemize}")
    L.append(r"\subsection*{4. Estrategia de versiones}")
    L.append(r"Las tres versiones contienen los mismos 24 reactivos, con el mismo número de correctas por reactivo (mismo puntaje máximo). Difieren en: (a) el orden de los reactivos (los seis bloques temáticos rotan y cambia el orden dentro de cada bloque); (b) el orden de las opciones, con letras correctas distintas para un mismo reactivo; y (c) las cifras de los reactivos con cálculo (3, 8, 10, 15, 16, 18 y 23), con la misma estructura y verificadas por programa.")
    # claves por versión
    L.append(r"\subsection*{5. Claves de respuesta}")
    L.append(r"\begin{center}\footnotesize\begin{tabular}{@{}rl|rl|rl@{}}\toprule \multicolumn{2}{c|}{Versión A} & \multicolumn{2}{c|}{Versión B} & \multicolumn{2}{c}{Versión C}\\ N.º & Correctas & N.º & Correctas & N.º & Correctas\\\midrule")
    for i in range(24):
        celdas = []
        for v in "ABC":
            celdas.append(f"{i + 1} & \\textbf{{{', '.join(LET[x] for x in ver[v]['claves'][i])}}}")
        L.append(" & ".join(celdas) + r"\\")
    L.append(r"\bottomrule\end{tabular}\end{center}")
    L.append(r"\subsection*{6. Equivalencia de reactivos y bloques (para retroalimentación por tema)}")
    L.append(r"\begin{center}\footnotesize\begin{longtable}{@{}rllrrrc@{}}\toprule Base & Bloque & Tema (versión A) & A & B & C & $k$\\\midrule\endhead")
    for b in range(1, 25):
        qa = ver["A"]["qs"][b - 1]
        k = len(ver["A"]["claves"][b - 1])
        L.append(r"%d & %s & %s & %d & %d & %d & %d\\" % (b, NOM_BLOQUE[(b - 1) // 4], qa["tema"], ver["A"]["ids"].index(b) + 1,
                                                       ver["B"]["ids"].index(b) + 1, ver["C"]["ids"].index(b) + 1, k))
    L.append(r"\bottomrule\end{longtable}\end{center}")
    L.append(r"\subsection*{7. Qué cambia en los reactivos con cálculo}")
    L.append(r"\begin{itemize}[leftmargin=1.2em,itemsep=1pt,topsep=1pt]\footnotesize")
    for n in (3, 8, 10, 15, 16, 18, 23):
        L.append(r"\item \textbf{Base %d} --- A: %s" % (n, "versión aprobada.") )
        for v in "BC":
            L.append(r"\\ \hspace{1em}%s: %s" % (v, esc_pct(VARIANTES[v][n]["resumen"]).replace("_", r"\_").replace("{", "(").replace("}", ")").replace("'", "")))
    L.append(r"\end{itemize}")
    L.append(r"\end{document}")
    return "\n".join(L)


def maestro(ver):
    out = {"puntaje": "max(0, (aciertos - errores)/k) por reactivo; calificación = 10/24 * suma", "versiones": {}}
    for v in "ABC":
        d = ver[v]
        out["versiones"][v] = {str(n): {"base": q["id"], "bloque": NOM_BLOQUE[(q["id"] - 1) // 4], "k": len(c),
                                        "correctas": [LET[i] for i in c]}
                               for n, (q, c) in enumerate(zip(d["qs"], d["claves"]), 1)}
    return out


if __name__ == "__main__":
    ver = construir()
    for v in "ABC":
        d = ver[v]
        (AQUI / f"examen_{v}.tex").write_text(examen(d, v), encoding="utf-8")
        (AQUI / f"clave_comentada_{v}.tex").write_text(clave_comentada(d, v), encoding="utf-8")
        print(v, "letras correctas:", dict(zip(LET, d["cuenta"])), "| orden:", d["ids"])
    (AQUI / "rubrica_y_claves.tex").write_text(rubrica(ver), encoding="utf-8")
    (AQUI / "claves.json").write_text(json.dumps(maestro(ver), ensure_ascii=False, indent=1), encoding="utf-8")
