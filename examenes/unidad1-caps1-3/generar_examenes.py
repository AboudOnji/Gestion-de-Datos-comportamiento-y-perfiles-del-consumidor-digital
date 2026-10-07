# -*- coding: utf-8 -*-
"""Genera las tres versiones (A, B, C) del examen de la Unidad I, la HOJA DE RESPUESTAS
independiente (para escanear), la clave del profesor y las plantillas de acetato.

Misma prueba, distinto orden: las versiones difieren en el orden de los reactivos y de las
opciones. Las letras correctas siguen un orden IRREGULAR fijo (10 a, 10 b, 10 c por versión, sin
rachas largas ni escaleras a-b-c) y la letra correcta de un mismo reactivo es distinta en A, B y C.
Los alumnos contestan en hoja_respuestas.pdf (con marcas de registro y casillas de versión);
calificar_hojas.py lee los escaneos y califica. Las plantillas de acetato (plantilla_X.pdf) son el
respaldo manual: se imprimen al 100 % y se colocan sobre la hoja del alumno.

Uso:  conda run -n research python generar_examenes.py && ./compilar.sh
"""
import json
import random
from pathlib import Path
from banco_reactivos import BANCO

AQUI = Path(__file__).resolve().parent
N = len(BANCO)                      # 30
LETRAS = "abc"
SEMILLA = 2026
DURACION = 50
DESP = 11   # desplazamiento del orden base: cada reactivo cambia de número entre versiones

# ---- orden de los reactivos por versión
base = list(range(N))
random.Random(SEMILLA).shuffle(base)
ORDEN = {v: base[DESP * k:] + base[:DESP * k] for k, v in enumerate("ABC")}


# ---- letras correctas: irregulares, balanceadas y distintas entre versiones para cada reactivo
def secuencia_ok(seq):
    """Sin 3 iguales seguidos y a lo sumo 2 'escaleras' cíclicas (abc, bca, cab) de 3 consecutivas."""
    if any(seq[i] == seq[i + 1] == seq[i + 2] for i in range(len(seq) - 2)):
        return False
    esc = sum(1 for i in range(len(seq) - 2) if seq[i + 1] == (seq[i] + 1) % 3 and seq[i + 2] == (seq[i] + 2) % 3)
    return esc <= 2


def asignar_letras():
    rng = random.Random(SEMILLA + 7)
    while True:
        A = [i % 3 for i in range(N)]; rng.shuffle(A)
        B = [rng.choice([x for x in range(3) if x != a]) for a in A]
        if any(B.count(x) != N // 3 for x in range(3)):
            continue
        C = [3 - a - b for a, b in zip(A, B)]          # la tercera letra: balanceada por construcción
        L = {"A": A, "B": B, "C": C}
        if all(secuencia_ok([L[v][i] for i in ORDEN[v]]) for v in "ABC"):
            return L


LET = asignar_letras()      # LET[v][indice_en_BANCO] -> 0,1,2


def armar(version):
    """Lista de (número, reactivo, opciones[3], índice correcto)."""
    filas = []
    for pos, idx in enumerate(ORDEN[version]):
        r = BANCO[idx]
        correcta = LET[version][idx]
        d = r["d"][:]
        random.Random(f"{SEMILLA}-{version}-{r['id']}").shuffle(d)
        it = iter(d)
        ops = [r["ok"] if j == correcta else next(it) for j in range(3)]
        filas.append((pos + 1, r, ops, correcta))
    return filas


PREAMBULO = r"""\documentclass[10pt,letterpaper]{article}
\usepackage[utf8]{inputenc}\usepackage[T1]{fontenc}\usepackage{lmodern}
\usepackage[spanish,es-noshorthands]{babel}
\usepackage[top=0.8cm,bottom=0.8cm,left=1.0cm,right=1.0cm,nohead,nofoot]{geometry}
\usepackage{multicol,amsmath,graphicx,xcolor,array,enumitem,tabularx,booktabs}
\usepackage{pgfplots}\pgfplotsset{compat=1.17}\usetikzlibrary{patterns}
\definecolor{dorado}{HTML}{B8975A}
@COLORES@
\pagestyle{empty}\setlength{\parindent}{0pt}\setlength{\columnsep}{0.55cm}
\setlength{\columnseprule}{0.3pt}
\newlength{\wbola}\settowidth{\wbola}{\scriptsize$\bigcirc$}
"""
COLORES_EXAMEN = r"\definecolor{guinda}{HTML}{6F1D46}\definecolor{tinta}{HTML}{000000}"
COLORES_PLANTILLA = r"\definecolor{guinda}{HTML}{FFFFFF}\definecolor{tinta}{HTML}{FFFFFF}"   # todo blanco = no imprime

BOLA = r"$\bigcirc$"
ANILLO = r"\makebox[0pt][l]{\makebox[\wbola][c]{\raisebox{0pt}[0pt][0pt]{\textcolor{black}{\scalebox{1.9}{$\bigcirc$}}}}}\textcolor{white}{$\bigcirc$}"


def cabecera(v, plantilla=False):
    return r"""
\begin{minipage}{0.09\textwidth}@LOGO@\end{minipage}%
\begin{minipage}{0.70\textwidth}\centering
{\color{guinda}\textbf{\large Instituto Politécnico Nacional · ESCA Unidad Santo Tomás}}\\[-1pt]
{\small Laboratorio: Gestión de datos, comportamiento y perfiles del consumidor digital}\\[1pt]
{\normalsize\textbf{Examen de la Unidad I (Capítulos 1 a 3)}} \hfill {\small Profesor: \textbf{Dr. Aboud Barsekh-Onji}}
\end{minipage}%
\begin{minipage}{0.19\textwidth}\centering
{\color{guinda}\fbox{\parbox[c][1.0cm][c]{1.3cm}{\centering\textbf{\scriptsize VERSIÓN}\\[-2pt]{\Huge\textbf{@V@}}}}}
\end{minipage}
\vspace{2pt}\hrule\vspace{3pt}
{\small\textbf{Nombre:} \rule{7.2cm}{0.3pt} \hfill \textbf{Grupo:} \rule{1.6cm}{0.3pt} \hfill \textbf{Fecha:} \rule{2.2cm}{0.3pt} \hfill \textbf{Calif.:} \rule{1.5cm}{0.3pt}}\\[3pt]
{\footnotesize\textbf{Duración: @D@ min.} @N@ reactivos de opción múltiple con \textbf{una sola} respuesta correcta. Contesta en la \textbf{hoja de respuestas única} (es la misma para las tres versiones): rellena por completo un solo círculo por reactivo y \textbf{anota la versión que te tocó} (la letra de la esquina de este examen). Cada acierto vale $10/@N@$ de punto. Algunos reactivos piden analizar las figuras y resultados de arriba. Lee con atención cada enunciado.}
\vspace{2pt}\hrule\vspace{4pt}
""".replace("@LOGO@", r"\rule{0pt}{1.15cm}" if plantilla else r"\includegraphics[height=1.15cm]{ipn-escudo.png}").replace("@V@", v).replace("@D@", str(DURACION)).replace("@N@", str(N))


# ------------------------------------------------------------------ hoja de respuestas independiente
W, H = 21.59, 27.94                      # carta, en cm
FID = {"TL": (0.9, 0.9, 1.0), "TR": (W - 1.6, 0.9, 0.7), "BL": (0.9, H - 1.6, 0.7), "BR": (W - 1.6, H - 1.6, 0.7)}  # x, y, lado
R_BURBUJA = 0.31                         # radio de cada círculo (cm)
BLOQUES_X = [3.0, 9.2, 15.4]             # x del primer círculo (a) de cada bloque de 10 reactivos
PASO_LETRA, Y0_FILAS, PASO_FILA = 1.25, 11.9, 1.40
VERSION_XY = {"A": (9.2, 8.7), "B": (10.6, 8.7), "C": (12.0, 8.7)}


def layout():
    fid = {k: [x + l / 2, y + l / 2, l] for k, (x, y, l) in FID.items()}
    preg = []
    for q in range(N):
        b, r = divmod(q, 10)
        for j, L in enumerate(LETRAS):
            preg.append({"q": q + 1, "letra": L, "x": BLOQUES_X[b] + PASO_LETRA * j, "y": Y0_FILAS + PASO_FILA * r})
    return {"pagina_cm": [W, H], "fiduciales": fid, "radio_cm": R_BURBUJA,
            "version": {k: {"x": x, "y": y} for k, (x, y) in VERSION_XY.items()}, "preguntas": preg,
            "campos_nombre_cm": [1.6, 3.2, W - 1.6, 8.0]}   # recorte x0,y0,x1,y1 con nombre, grupo y matrícula


def hoja_tex(plantilla=False, version=None):
    """Hoja de respuestas (una página carta). Con plantilla=True solo imprime marcas de registro,
    anillo en las respuestas correctas de `version` y la rotulación (para acetato)."""
    L = [r"""\documentclass[10pt,letterpaper]{article}
\usepackage[utf8]{inputenc}\usepackage[T1]{fontenc}\usepackage{lmodern}
\usepackage[spanish,es-noshorthands]{babel}
\usepackage[margin=0pt]{geometry}
\usepackage{tikz,graphicx,xcolor}\pagestyle{empty}\setlength{\parindent}{0pt}
\definecolor{guinda}{HTML}{6F1D46}
\begin{document}\noindent
\begin{tikzpicture}[remember picture,overlay,shift={(current page.north west)},x=1cm,y=-1cm]""".replace("\\", "\\")]
    for k, (x, y, l) in FID.items():
        L.append(rf"\fill[black] ({x},{y}) rectangle ++({l},{l});")
    ring = lambda x, y: rf"\draw[line width=0.9pt,black] ({x:.3f},{y:.3f}) circle ({R_BURBUJA * 1.55:.3f});"
    if plantilla:
        L.append(rf"\node[anchor=north west,font=\small\bfseries,text=black] at (2.2,2.2) {{PLANTILLA — VERSIÓN {version}}};")
        L.append(r"\node[anchor=north west,font=\scriptsize,text=black] at (2.2,2.8) {Imprimir al 100\,\% en acetato y alinear los cuadros negros con los de la hoja del alumno. Anillo = respuesta correcta.};")
        for p in layout()["preguntas"]:
            if LETRAS[LET[version][ORDEN[version][p["q"] - 1]]] == p["letra"]:
                L.append(ring(p["x"], p["y"]))
        L.append(ring(*VERSION_XY[version]))
    else:
        L.append(r"\node[anchor=north west] at (2.4,1.0) {\includegraphics[height=1.35cm]{ipn-escudo.png}};")
        L.append(r"\node[anchor=north west,font=\large\bfseries,text=guinda] at (4.2,1.0) {Instituto Politécnico Nacional · ESCA Unidad Santo Tomás};")
        L.append(r"\node[anchor=north west,font=\small] at (4.2,1.65) {Laboratorio: Gestión de datos, comportamiento y perfiles del consumidor digital};")
        L.append(r"\node[anchor=north west,font=\normalsize\bfseries] at (4.2,2.25) {HOJA DE RESPUESTAS — Examen de la Unidad I (Caps. 1 a 3)};")
        L.append(r"\node[anchor=north west,font=\small] at (4.2,2.85) {Profesor: \textbf{Dr. Aboud Barsekh-Onji}};")
        for etiqueta, y, x1 in (("Nombre completo:", 3.9, 15.2), ("Grupo:", 5.0, 6.6), ("Matrícula / boleta:", 5.0, 15.2), ("Fecha:", 6.1, 6.6)):
            x0 = 1.6 if etiqueta in ("Nombre completo:", "Grupo:", "Fecha:") else 8.0
            L.append(rf"\node[anchor=south west,font=\small\bfseries] at ({x0},{y - 0.05}) {{{etiqueta}}};")
            xl = x0 + {"Nombre completo:": 3.3, "Grupo:": 1.5, "Matrícula / boleta:": 3.6, "Fecha:": 1.4}[etiqueta]
            L.append(rf"\draw[line width=0.4pt] ({xl},{y}) -- ({x1},{y});")
        L.append(r"\node[anchor=north west,font=\footnotesize,text width=17.5cm] at (1.6,6.6) {Escribe tus datos con letra clara. \textbf{Rellena por completo un solo círculo por reactivo} con pluma o lápiz oscuro (sin palomitas, cruces ni tachaduras). No escribas fuera de los círculos ni dobles esta hoja.};")
        L.append(r"\node[anchor=south west,font=\normalsize\bfseries,text=guinda] at (1.6,8.15) {ANOTA LA VERSIÓN QUE TE TOCÓ (la letra de la esquina de tu examen): rellena un círculo};")
        L.append(r"\node[anchor=west,font=\small] at (14.2,%.2f) {y escríbela aquí: \rule{1.2cm}{0.3pt}};" % VERSION_XY["A"][1])
        for k, (x, y) in VERSION_XY.items():
            L.append(rf"\draw[line width=0.5pt] ({x},{y}) circle ({R_BURBUJA});")
            L.append(rf"\node[anchor=west,font=\small\bfseries] at ({x + 0.45},{y}) {{{k}}};")
        for b, x0 in enumerate(BLOQUES_X):
            for j, Lt in enumerate(LETRAS):
                L.append(rf"\node[font=\small\bfseries,text=guinda] at ({x0 + PASO_LETRA * j},{Y0_FILAS - 0.85}) {{{Lt}}};")
            for r in range(10):
                q = b * 10 + r + 1
                L.append(rf"\node[anchor=east,font=\small\bfseries] at ({x0 - 0.5},{Y0_FILAS + PASO_FILA * r}) {{{q}}};")
        for p in layout()["preguntas"]:
            L.append(rf"\draw[line width=0.5pt] ({p['x']},{p['y']}) circle ({R_BURBUJA});")
        L.append(r"\node[anchor=south west,font=\small] at (1.6,%.2f) {Aciertos: \rule{1.6cm}{0.3pt}\ /\ %d \quad Calificación: \rule{1.6cm}{0.3pt}\ /\ 10 \quad \textit{(uso del profesor)}};" % (H - 2.05, N))
    L.append(r"\end{tikzpicture}\end{document}")
    return "\n".join(L) + "\n"


FIGURAS = r"""
\begingroup\tiny\pgfplotsset{every axis/.append style={tick label style={font=\tiny},label style={font=\tiny},title style={font=\tiny},
  every axis plot/.append style={line width=0.6pt}, xlabel style={yshift=2pt}, ylabel style={yshift=-2pt}}}
\noindent\begin{minipage}[t]{0.215\textwidth}\centering
\begin{tikzpicture}[baseline=(current bounding box.north)]\begin{axis}[width=4.5cm,height=4.1cm,xlabel={periodo},ylabel={tasa de adopción},xmin=0,xmax=20,ymin=0,ymax=0.16,
 axis lines*=left,ytick={0,0.05,0.1,0.15},xtick={0,5,10,15,20}]
\addplot[domain=0:20,samples=60,black,dashed]{(0.18)^2*exp(-0.18*x)/0.08/(1+0.10/0.08*exp(-0.18*x))^2};
\addplot[domain=0:20,samples=60,black]{(0.41)^2*exp(-0.41*x)/0.03/(1+0.38/0.03*exp(-0.41*x))^2};
\addplot[domain=0:20,samples=60,black,dotted,line width=1pt]{(0.56)^2*exp(-0.56*x)/0.01/(1+0.55/0.01*exp(-0.56*x))^2};
\node[font=\tiny] at (axis cs:2.6,0.097) {A}; \node[font=\tiny] at (axis cs:4.5,0.125) {B}; \node[font=\tiny] at (axis cs:11.2,0.14) {C};
\end{axis}\end{tikzpicture}\\[-2pt]{\tiny\textbf{Figura 1.} Tasa de adopción (Bass).\\ A: $p{=}.08,q{=}.10$; B: $p{=}.03,q{=}.38$; C: $p{=}.01,q{=}.55$}
\end{minipage}\hfill
\begin{minipage}[t]{0.285\textwidth}\centering
\vspace*{0.5cm}{\tiny\renewcommand{\arraystretch}{1.1}\setlength{\tabcolsep}{2.5pt}\begin{tabular}{@{}lcccc@{}}\toprule
Caso & Arquet. & Traslape & Silueta & \% ambig.\\\midrule
A & 3 & base & 0.58 & 14.6\\ B & 3 & mayor & 0.41 & 36.7\\ C & 4 & base & 0.58 & 21.6\\\bottomrule\end{tabular}}\\[1pt]
\begin{tikzpicture}[baseline=(current bounding box.north)]\begin{axis}[xbar stacked,width=5.0cm,height=2.5cm,bar width=5pt,xmin=0,xmax=100,symbolic y coords={Cl.4,Cl.3,Cl.2,Cl.1},ytick=data,
 xlabel={pertenencia (\%)},axis lines*=left,enlarge y limits=0.22]
\addplot[fill=black!25,draw=black!60] coordinates{(92,Cl.1)(78,Cl.2)(48,Cl.3)(15,Cl.4)};
\addplot[fill=black!55,draw=black!70] coordinates{(5,Cl.1)(12,Cl.2)(44,Cl.3)(20,Cl.4)};
\addplot[fill=white,draw=black!70,pattern=north east lines] coordinates{(3,Cl.1)(10,Cl.2)(8,Cl.3)(65,Cl.4)};
\end{axis}\end{tikzpicture}\\[-2pt]{\tiny\textbf{Figura 2.} Corridas del laboratorio (arriba) y pertenencias de cuatro clientes (abajo, hipotéticas): segmento 1 gris claro, 2 gris oscuro, 3 rayado}
\end{minipage}\hfill
\begin{minipage}[t]{0.215\textwidth}\centering
\begin{tikzpicture}[baseline=(current bounding box.north)]\begin{axis}[ybar,width=4.5cm,height=4.1cm,bar width=8pt,symbolic x coords={18--24,25--34,35--44,55--64,65+},xtick=data,ymin=0,ymax=7,
 xlabel={edad (años)},ylabel={horas diarias de internet},axis lines*=left,enlarge x limits=0.15,nodes near coords,nodes near coords style={font=\tiny},ytick={0,2,4,6},x tick label style={font=\tiny,rotate=45,anchor=east}]
\addplot[fill=black!40,draw=black!70] coordinates{(18--24,5.7)(25--34,5.6)(35--44,4.7)(55--64,3.2)(65+,3.0)};
\end{axis}\end{tikzpicture}\\[-2pt]{\tiny\textbf{Figura 3.} Uso diario de internet por edad en México (ENDUTIH 2024; no se muestra 45--54)}
\end{minipage}\hfill
\begin{minipage}[t]{0.255\textwidth}\centering
\begin{tikzpicture}[baseline=(current bounding box.north)]\begin{axis}[ybar,width=4.9cm,height=4.1cm,bar width=11pt,symbolic x coords={Mujeres,Hombres,Total},xtick=data,ymin=0,ymax=100,
 ylabel={\% con producto financiero formal},axis lines*=left,enlarge x limits=0.3,nodes near coords,nodes near coords style={font=\tiny},ytick={0,25,50,75,100}]
\addplot[fill=black!40,draw=black!70] coordinates{(Mujeres,72.8)(Hombres,80.9)(Total,76.5)};
\end{axis}\end{tikzpicture}\\[-2pt]{\tiny\textbf{Figura 4.} Personas con un producto financiero formal (ENIF 2024, INEGI/CNBV)}
\end{minipage}
\endgroup
"""


def examen(v, plantilla=False):
    filas = armar(v)
    cuerpo = ""
    for num, r, ops, _ in filas:
        cuerpo += rf"\noindent\textbf{{{num}.}} {r['q']}" + "\n\\vspace{-3pt}\n"
        cuerpo += r"\begin{enumerate}[label=\alph*),leftmargin=1.1em,itemsep=0pt,topsep=1pt,parsep=0pt,partopsep=0pt]" + "\n"
        cuerpo += "\n".join(rf"\item {o}" for o in ops) + "\n\\end{enumerate}\n\\vspace{2pt}\n"
    pre = PREAMBULO.replace("@COLORES@", COLORES_PLANTILLA if plantilla else COLORES_EXAMEN)
    return (pre + r"\begin{document}\fontsize{8.1}{9.15}\selectfont\color{tinta}\columnseprulecolor{\color{tinta}}" + "\n" + r"\begingroup\color{tinta}" + cabecera(v, plantilla) + r"\endgroup" +
            FIGURAS + r"\vspace{2pt}\hrule\vspace{3pt}" + "\n" +
            ("" if plantilla else r"\begin{multicols}{2}" + "\n" + cuerpo + r"\end{multicols}" + "\n") + r"\end{document}" + "\n")


def claves_texto(v):
    c = [LETRAS[LET[v][i]] for i in ORDEN[v]]
    return " ".join("".join(c[i:i + 5]) for i in range(0, N, 5))


def clave():
    pre = PREAMBULO.replace("@COLORES@", COLORES_EXAMEN).replace("top=0.8cm,bottom=0.8cm", "top=1.3cm,bottom=1.2cm")
    t = pre + r"\begin{document}\small\color{tinta}" + "\n"
    t += r"{\color{guinda}\textbf{\large Clave de respuestas — Examen de la Unidad I (Caps. 1 a 3)}}\hfill{\footnotesize\textbf{Uso exclusivo del profesor} · Dr. Aboud Barsekh-Onji}" + "\n\\vspace{2pt}\\hrule\\vspace{4pt}\n"
    t += (r"Las tres versiones son \textbf{el mismo examen}: cambian el orden de los reactivos y de las opciones. "
          r"Duración: @D@ min. Calificación: aciertos $\times\,10/@N@$. La clave es \textbf{irregular} (10 a, 10 b y 10 c por versión), de modo que no puede deducirse del examen. "
          r"Los alumnos contestan en \texttt{hoja\_respuestas.pdf}, \textbf{una sola hoja para las tres versiones}, en la que anotan la versión que les tocó. \textbf{Corrección principal:} escanear las hojas y correr \texttt{calificar\_hojas.py} "
          r"(lee las casillas, aplica la clave de la versión marcada y genera una tabla con las incidencias). \textbf{Respaldo manual:} \texttt{plantilla\_A/B/C.pdf}, impresa al 100\,\% en acetato, "
          r"alineando los cuadros negros con los de la hoja; o la clave escrita de abajo.".replace("@D@", str(DURACION)).replace("@N@", str(N)) + "\n\n\\vspace{3pt}\n")
    t += r"\begin{center}\renewcommand{\arraystretch}{1.25}\begin{tabular}{@{}cl@{}}\toprule \textbf{Versión} & \textbf{Respuestas correctas, reactivos 1 a %d (grupos de cinco)}\\\midrule" % N + "\n"
    for v in "ABC":
        t += rf"\textbf{{{v}}} & \texttt{{\textbf{{{claves_texto(v)}}}}}\\" + "\n"
    t += r"\bottomrule\end{tabular}\end{center}" + "\n\n\\vspace{2pt}\n"
    t += r"\textbf{Correspondencia y justificación de cada reactivo}\\[2pt]" + "\n"
    t += r"{\scriptsize\renewcommand{\arraystretch}{1.08}\setlength{\tabcolsep}{3pt}" + "\n"
    t += r"\begin{tabularx}{\textwidth}{@{}l c c c c X@{}}\toprule" + "\n"
    t += r"\textbf{ID} & \textbf{N.º A} & \textbf{N.º B} & \textbf{N.º C} & \textbf{Clave} & \textbf{Tema y justificación (fuente en el libro)}\\\midrule" + "\n"
    pos = {v: {idx: p for p, idx in enumerate(ORDEN[v])} for v in "ABC"}
    for i, r in enumerate(BANCO):
        nums = [pos[v][i] + 1 for v in "ABC"]
        letras = "/".join(LETRAS[LET[v][i]] for v in "ABC")
        t += rf"{r['id']} & {nums[0]} & {nums[1]} & {nums[2]} & {letras} & \textbf{{{r['tema']}}}. {r['just']}\\" + "\n"
        if i in (9, 19):
            t += r"\midrule" + "\n"
    t += r"\bottomrule\end{tabularx}}" + "\n"
    t += (r"\\[3pt]{\scriptsize Clave: letra correcta en las versiones A/B/C. Distribución: 10 reactivos por capítulo (1.01--1.10, 2.01--2.10, 3.01--3.10). "
          r"Los casos marcados como hipotéticos en los enunciados se construyeron para el examen; las demás cifras son las del libro.}" + "\n")
    return t + r"\end{document}" + "\n"


if __name__ == "__main__":
    for v in "ABC":
        (AQUI / f"examen_{v}.tex").write_text(examen(v), encoding="utf-8")
        (AQUI / f"plantilla_{v}.tex").write_text(hoja_tex(True, v), encoding="utf-8")
    (AQUI / "hoja_respuestas.tex").write_text(hoja_tex(), encoding="utf-8")
    (AQUI / "hoja_layout.json").write_text(json.dumps(layout(), ensure_ascii=False), encoding="utf-8")
    (AQUI / "claves.json").write_text(json.dumps({v: "".join(LETRAS[LET[v][i]] for i in ORDEN[v]) for v in "ABC"}), encoding="utf-8")
    (AQUI / "clave_profesor.tex").write_text(clave(), encoding="utf-8")
    # ---- comprobaciones de integridad
    for v in "ABC":
        c = [LET[v][i] for i in ORDEN[v]]
        assert all(c.count(x) == N // 3 for x in range(3)), "balance 10/10/10"
        assert secuencia_ok(c), "clave sin rachas ni escaleras"
        assert sorted(r["id"] for _, r, _, _ in armar(v)) == sorted(r["id"] for r in BANCO), "mismos reactivos"
    for i in range(N):
        assert len({LET[v][i] for v in "ABC"}) == 3, "letra repetida entre versiones"
        assert len({ORDEN[v].index(i) for v in "ABC"}) == 3, "posición repetida entre versiones"
    print("OK: examen_A/B/C.tex, hoja_respuestas.tex, plantilla_X.tex, claves.json, hoja_layout.json y clave_profesor.tex")
    for v in "ABC":
        print(v, claves_texto(v))
