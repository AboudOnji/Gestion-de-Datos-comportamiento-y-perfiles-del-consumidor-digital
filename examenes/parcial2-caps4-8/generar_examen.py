# -*- coding: utf-8 -*-
"""[Módulo de apoyo; el punto de entrada es generar_versiones.py]
Genera la versión A del 2.º parcial (Sesiones 4-8 + Influencers) y su clave comentada de revisión.

Opción múltiple con UNA A TRES correctas por reactivo. El orden de las opciones se permuta con una semilla
(balance de letras correctas y sin repetir el mismo conjunto de claves en reactivos consecutivos).
Las versiones B y C se generarán con otra semilla y otro orden de reactivos una vez aprobada la A.

Uso:  python generar_examen.py  &&  ./compilar.sh
"""
import json, random, re
from pathlib import Path
from banco_reactivos import BANCO

AQUI = Path(__file__).resolve().parent
LET = "abcd"
SEMILLA_A = 2026


def permutar(semilla):
    rng = random.Random(semilla)
    for _ in range(200000):
        perms = [rng.sample(range(4), 4) for _ in BANCO]
        claves = [tuple(sorted(p_i for p_i, idx in enumerate(p) if r["o"][idx][1])) for p, r in zip(perms, BANCO)]
        if any(claves[i] == claves[i + 1] for i in range(len(claves) - 1)):
            continue
        cuenta = [sum(1 for c in claves if l in c) for l in range(4)]
        if max(cuenta) - min(cuenta) > 2:
            continue
        # sin 4 reactivos seguidos que contengan la misma letra correcta
        if any(all(l in claves[i + k] for k in range(4)) for l in range(4) for i in range(len(claves) - 3)):
            continue
        return perms, claves, cuenta
    raise RuntimeError("sin permutación válida")


FIG = {
"serie": r"""\begin{center}
\begin{tikzpicture}\begin{axis}[width=8.0cm,height=3.3cm,xmin=1,xmax=104,ymin=0,ymax=100,xlabel={semana},ylabel={índice de interés},
 axis lines*=left,ymajorgrids,grid style={black!15},tick label style={font=\tiny},label style={font=\tiny},xtick={1,13,26,39,52,65,78,91,104},ytick={0,50,100},xlabel style={yshift=3pt},ylabel style={yshift=-3pt}]
\fill[black!22] (axis cs:101,0) rectangle (axis cs:104,100);
\addplot[black,line width=0.7pt,mark=none] coordinates {%s};
\end{axis}\end{tikzpicture}\\[-1pt]{\tiny\textbf{Figura 1.} Interés de búsqueda de la marca, 2 años (sintético). Sombreado: semanas 101--104.}
\end{center}""",
"markov": r"""\begin{center}
\begin{tikzpicture}[>=stealth,scale=0.92,transform shape,
 e/.style={circle,draw,thick,minimum size=0.95cm,font=\scriptsize,align=center,inner sep=1pt},
 a/.style={rectangle,draw,thick,rounded corners=2pt,minimum width=1.1cm,minimum height=0.7cm,font=\scriptsize,align=center,fill=black!10},
 p/.style={font=\tiny,inner sep=1pt}]
\node[e](I) at (0,0){Interés}; \node[e](D) at (3.0,0){Deseo};
\node[a](C) at (6.0,0){Conv.}; \node[a](A) at (3.0,-1.9){Aband.};
\draw[->,thick](I) to[out=120,in=60,looseness=6] node[p,above]{0.5}(I);
\draw[->,thick](D) to[out=120,in=60,looseness=6] node[p,above]{0.4}(D);
\draw[->,thick](I) to[bend left=20] node[p,above]{0.3}(D);
\draw[->,thick](D) to[bend left=20] node[p,below]{0.2}(I);
\draw[->,thick](D) -- node[p,above]{0.3}(C);
\draw[->,thick](D) -- node[p,right]{0.1}(A);
\draw[->,thick](I) -- node[p,below left]{0.2}(A);
\end{tikzpicture}\\[-1pt]{\tiny\textbf{Figura 2.} Cadena de Markov simplificada del recorrido (probabilidades de transición).}
\end{center}""",
"embudo": r"""\begin{center}{\scriptsize\renewcommand{\arraystretch}{1.05}\begin{tabular}{@{}lrr@{}}\toprule
Paso (evento) & Móvil & Escritorio\\\midrule
\texttt{view\_item} & 12\,000 & 8\,000\\ \texttt{add\_to\_cart} & 3\,000 & 2\,800\\
\texttt{begin\_checkout} & 1\,500 & 1\,960\\ \texttt{purchase} & 900 & 1\,372\\\bottomrule\end{tabular}}\\[1pt]{\tiny\textbf{Tabla 1.} Embudo de Google Analytics por dispositivo (usuarios).}\end{center}""",
"reglas": r"""\begin{center}{\scriptsize\renewcommand{\arraystretch}{1.05}\begin{tabular}{@{}lccc@{}}\toprule
Alternativa & Precio & Calidad & Entrega\\\midrule
A & 9 & 4 & 8\\ B & 6 & 7 & 6\\ C & 8 & 9 & 2\\ D & 5 & 6 & 9\\\bottomrule\end{tabular}}\\[1pt]{\tiny\textbf{Tabla 2.} Puntajes normalizados 0--10 (10 = lo mejor).}\end{center}""",
"creadores": r"""\begin{center}{\scriptsize\renewcommand{\arraystretch}{1.05}\begin{tabular}{@{}lrrr@{}}\toprule
Creador & Seguidores & Interacciones & Tarifa (MXN)\\\midrule
A & 40\,000 & 1\,600 & \$8\,000\\ B & 500\,000 & 5\,000 & \$60\,000\\ C & 120\,000 & 3\,600 & \$18\,000\\\bottomrule\end{tabular}}\\[1pt]{\tiny\textbf{Tabla 5.} Cotizaciones por publicación (hipotéticas).}\end{center}""",
}
FIG["escenarios"] = r"""\begin{center}\resizebox{\columnwidth}{!}{\scriptsize\renewcommand{\arraystretch}{1.05}\begin{tabular}{@{}lccc@{}}\toprule
Escenario & \% que convierte & Contactos hasta salir & Redes: último clic / remoción\\\midrule
A: base & 30 & 4.0 & 4\,\% / 20\,\%\\ B: más retrocesos & 22 & 5.5 & 3\,\% / 17\,\%\\ C: más redes, mejor directo & 36 & 3.8 & 6\,\% / 31\,\%\\\bottomrule\end{tabular}}\\[1pt]{\tiny\textbf{Tabla 3.} Resultados hipotéticos de un modelo de recorrido.}\end{center}"""
FIG["creadores2"] = r"""\begin{center}{\scriptsize\renewcommand{\arraystretch}{1.05}\begin{tabular}{@{}lrrr@{}}\toprule
Creador & Seguidores & Interacciones & Tarifa (MXN)\\\midrule
X & 30\,000 & 1\,200 & \$6\,000\\ Y & 300\,000 & 3\,000 & \$36\,000\\ Z & 90\,000 & 9\,900 & \$18\,000\\\bottomrule\end{tabular}}\\[1pt]{\tiny\textbf{Tabla 4.} Cotizaciones por publicación (hipotéticas).}\end{center}"""


def serie_coords():
    import numpy as np
    t = np.arange(1, 105)
    rng = np.random.default_rng(11)
    y = np.round(45 + 0.12 * t + 38 * np.sin(2 * np.pi * (t - 49) / 52) + rng.normal(0, 1.8, t.size), 1)
    return " ".join(f"({a},{b})" for a, b in zip(t, y))


def figura(clave):
    s = FIG[clave]
    return (s % serie_coords()) if clave == "serie" else s


PRE = r"""\documentclass[10pt,letterpaper]{article}
\usepackage[utf8]{inputenc}\usepackage[T1]{fontenc}\usepackage{lmodern}
\usepackage[spanish,es-noshorthands]{babel}\usepackage{csquotes}
\usepackage[top=0.8cm,bottom=0.9cm,left=1.0cm,right=1.0cm,nohead,nofoot]{geometry}
\usepackage{needspace,multicol,amsmath,amssymb,graphicx,xcolor,array,enumitem,booktabs}
\usepackage{pgfplots}\pgfplotsset{compat=1.17}\usetikzlibrary{arrows.meta}
\definecolor{guinda}{HTML}{6F1D46}\definecolor{tinta}{HTML}{000000}
\makeatletter\newcommand{\nb}{\@itempenalty=10000 }\newcommand{\br}{\@itempenalty=-51 }\makeatother
\newcommand{\cas}{\framebox[1.0em]{\rule{0pt}{1.05ex}}}
\pagestyle{empty}\setlength{\parindent}{0pt}\setlength{\columnsep}{0.55cm}\setlength{\columnseprule}{0.3pt}
"""


def examen(perms, version="A"):
    L = [PRE, r"\begin{document}\fontsize{8.9}{10.3}\selectfont\color{tinta}"]
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
{\small\textbf{Nombre:} \rule{7.2cm}{0.3pt} \hfill \textbf{Grupo:} \rule{1.6cm}{0.3pt} \hfill \textbf{Fecha:} \rule{2.2cm}{0.3pt} \hfill \textbf{Calif.:} \rule{1.5cm}{0.3pt}}\\[3pt]
{\footnotesize\textbf{Duración: 50 min.} Contesta \textbf{en esta misma hoja}, con lápiz. Cada reactivo tiene cuatro opciones (a--d) y \textbf{puede haber de una a tres correctas}: marca con una \textbf{X} el cuadro de \textbf{todas} las que consideres correctas y deja \textbf{vacío} el de las demás. Si te equivocas, borra por completo la marca. Cada opción correcta marcada suma $1/k$ y cada incorrecta marcada resta $1/k$ ($k$ = número de correctas del reactivo); el mínimo por reactivo es 0, así que marcar todas las opciones no conviene. Cada reactivo vale $10/24$ de punto. Algunos reactivos piden leer figuras o tablas; los datos \enquote{hipotéticos} son casos construidos para el examen. Lee con atención cada enunciado.}
\vspace{2pt}\hrule\vspace{4pt}
""".replace("@@V@@", version))
    L.append(r"""{\footnotesize\noindent\fbox{\parbox{\dimexpr\linewidth-2\fboxsep-2\fboxrule}{\textbf{Ecuaciones de apoyo} (para los reactivos que las requieran). \textit{Regla aditiva:} $U_i=\sum_j w_j\,s_{ij}$; \textit{conjuntiva:} se exige $s_{ij}\geq u$ en todos los atributos; \textit{lexicográfica:} gana la mejor alternativa en el atributo prioritario y se considera empatada la que quede a $\tau$ o menos de ella. \textit{Creadores:} $ER=100\times\text{interacciones}/\text{seguidores}$;\ \ $CPE=\text{costo}/\text{interacciones}$;\ \ $CPM_{seg}=1000\times\text{costo}/\text{seguidores}$.}}}\vspace{3pt}""")
    L.append(r"\begin{multicols}{2}")
    for n, (r, p) in enumerate(zip(BANCO, perms), 1):
        L.append(r"\begin{minipage}[t]{\columnwidth}\noindent\textbf{%d.} %s" % (n, r["q"]))
        if r.get("fig"):
            L.append(figura(r["fig"]))
        elif r.get("tabla"):
            L.append(figura(r["tabla"]))
        L.append(r"\vspace{1pt}\begin{enumerate}[label=\cas\ \alph*),leftmargin=2.3em,itemsep=1.6pt,topsep=1pt,parsep=0pt,partopsep=0pt]")
        for k, idx in enumerate(p):
            L.append(r"\item " + r["o"][idx][0])
        L.append(r"\end{enumerate}")
        L.append(r"\end{minipage}\par\vspace{4pt}")
    L.append(r"\end{multicols}\end{document}")
    return "\n".join(L)


def clave(perms, claves, cuenta, version="A"):
    ses_nom = {"S4": "Sesión 4 (Cap. 4)", "S5": "Sesión 5 (GA4, Cap. 5)", "S6": "Sesión 6 (Cap. 6)",
               "S7": "Sesión 7 (Cap. 7)", "S8": "Sesión 8 (Cap. 8, teoría)", "INF": "Influencers"}
    L = [r"""\documentclass[10pt,letterpaper]{article}
\usepackage[utf8]{inputenc}\usepackage[T1]{fontenc}\usepackage{lmodern}
\usepackage[spanish,es-noshorthands]{babel}\usepackage{csquotes}
\usepackage[margin=1.7cm]{geometry}\usepackage{amsmath,amssymb,xcolor,array,booktabs,enumitem,longtable}
\definecolor{guinda}{HTML}{6F1D46}
\setlength{\parindent}{0pt}\setlength{\parskip}{3pt}
\begin{document}
{\color{guinda}\large\textbf{Clave comentada para revisión — Examen del segundo parcial, versión """ + version + r"""}}\\
{\small Sesiones 4 a 8 (sin el laboratorio de la 8) e Influencers · 24 reactivos · opción múltiple con 1 a 3 correctas · \textbf{documento del profesor}}
\vspace{4pt}\hrule\vspace{4pt}
\textbf{Calificación propuesta.} Por reactivo: $\max\{0,\ (A-E)/k\}$, con $A$ = correctas marcadas, $E$ = incorrectas marcadas y $k$ = correctas del reactivo. Cada reactivo vale $10/24=0.4167$ puntos.
\textbf{Distribución de claves en la versión """ + version + r""":} """ + ", ".join(f"{LET[i]}: {cuenta[i]}" for i in range(4)) + r""" (total 52 opciones correctas: 7 reactivos con 3 correctas, 14 con 2 y 3 con 1).

\subsection*{Resumen de claves}
\begin{center}\footnotesize\begin{tabular}{@{}rllcl@{}}\toprule
N.º & Sesión & Tema & Correctas & Dificultad\\\midrule
"""]
    for n, (r, c) in enumerate(zip(BANCO, claves), 1):
        L.append(r"%d & %s & %s & \textbf{%s} & %s\\" % (n, ses_nom[r["ses"]], r["tema"], ", ".join(LET[i] for i in c), r["dif"]))
    L.append(r"\bottomrule\end{tabular}\end{center}")
    L.append(r"\subsection*{Justificación por reactivo}")
    for n, (r, p, c) in enumerate(zip(BANCO, perms, claves), 1):
        L.append(r"\vspace{3pt}\noindent\textbf{%d.} \textit{%s} — correctas: \textbf{%s}\\[-1pt]" % (n, r["tema"], ", ".join(LET[i] for i in c)))
        L.append(r"{\scriptsize Fuente: %s}" % r["fuente"])
        L.append(r"\begin{itemize}[leftmargin=1.2em,itemsep=0pt,topsep=1pt,parsep=0pt]")
        for pos, idx in enumerate(p):
            t, ok, why = r["o"][idx]
            why = re.sub(r"(?<!\\)%", r"\\%", why)
            L.append(r"\item[\textbf{%s)}] {\footnotesize \textbf{[%s]} %s\\ \textit{Por qué:} %s}" % (LET[pos], "correcta" if ok else "incorrecta", t, why))
        L.append(r"\end{itemize}")
    L.append(r"\end{document}")
    return "\n".join(L)


if __name__ == "__main__":
    print("Usa generar_versiones.py (este módulo solo aporta FIG y la permutación de la versión A aprobada).")
