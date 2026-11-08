# -*- coding: utf-8 -*-
"""Variantes numéricas (versiones B y C) de los reactivos con cálculo o cifras.

Cada variante conserva la ESTRUCTURA del reactivo de la versión A (mismo número de correctas k, mismas
afirmaciones verdaderas y falsas, mismo orden de redacción) y solo cambia cifras, tablas y series.
Cada constructor verifica con `assert` que la variante cumple las condiciones que hacen verdadera o falsa
cada opción; si una cifra rompiera la lógica, el generador se detiene.

Reactivos con variante (id base): 3 (serie), 8 (embudo), 10 (reglas de decisión), 15 (escenarios),
16 (atribución), 18 y 23 (comparación de creadores).
"""
import copy
import random
import numpy as np
from banco_reactivos import BANCO, O


def fmt(n):
    """Miles con espacio fino de LaTeX: 12000 -> 12\\,000."""
    s = f"{int(n):,}".replace(",", "\\,")
    return s


def pc(x):
    """Proporción -> porcentaje sin ceros sobrantes (0.25 -> 25; 0.1715 -> 17.15)."""
    return f"{x * 100:.2f}".rstrip("0").rstrip(".")


def money(x):
    return f"\\${x:,.2f}".replace(",", "\\,")


def base(n):
    q = copy.deepcopy(BANCO[n - 1])
    q["id"] = n
    return q


# ------------------------------------------------------------------ Reactivo 3: serie de tiempo
def serie_datos(w, amp, tend, nivel, semilla, ruido=1.8):
    t = np.arange(1, 105)
    rng = np.random.default_rng(semilla)
    y = np.round(nivel + tend * t + amp * np.sin(2 * np.pi * (t - (w - 52)) / 52) + rng.normal(0, ruido, t.size), 1)
    return t, y


def buscar_serie(w, amp, tend, nivel, rango=(12.5, 17.0)):
    """Semilla con alzas comparables en [w-52, w-49] y [w, w+3] (misma temporada, un ciclo después)."""
    for semilla in range(1, 20000):
        t, y = serie_datos(w, amp, tend, nivel, semilla)
        a1, a2 = y[w - 52 + 2] - y[w - 52 - 1], y[w + 2] - y[w - 1]
        if rango[0] <= a1 <= rango[1] and rango[0] <= a2 <= rango[1] and abs(a1 - a2) < 0.8 and 3 < y.min() and y.max() < 97:
            return semilla, t, y, a1, a2
    raise RuntimeError("sin semilla de serie")


FIG_SERIE = r"""\begin{center}
\begin{tikzpicture}\begin{axis}[width=8.0cm,height=3.3cm,xmin=1,xmax=104,ymin=0,ymax=100,xlabel={semana},ylabel={índice de interés},
 axis lines*=left,ymajorgrids,grid style={black!15},tick label style={font=\tiny},label style={font=\tiny},xtick={1,13,26,39,52,65,78,91,104},ytick={0,50,100},xlabel style={yshift=3pt},ylabel style={yshift=-3pt}]
\fill[black!22] (axis cs:@W0@,0) rectangle (axis cs:@W1@,100);
\addplot[black,line width=0.7pt,mark=none] coordinates {@COORD@};
\end{axis}\end{tikzpicture}\\[-1pt]{\tiny\textbf{Figura 1.} Interés de búsqueda de la marca, 2 años (sintético). Sombreado: semanas @W0@--@W1@.}
\end{center}"""


def q3(w, amp, tend, nivel):
    semilla, t, y, a1, a2 = buscar_serie(w, amp, tend, nivel)
    q = base(3)
    r = round((a1 + a2) / 2)
    coords = " ".join(f"({a},{b})" for a, b in zip(t, y))
    q["extra"] = FIG_SERIE.replace("@W0@", str(w)).replace("@W1@", str(w + 3)).replace("@COORD@", coords)
    q["fig"] = None
    q["q"] = ("La Figura 1 muestra, durante 104 semanas, el índice de interés de búsqueda de una marca (datos sintéticos). "
              f"El equipo observa el alza de las semanas {w}--{w + 3} (zona sombreada), coincidente con una campaña de "
              "\\textit{influencer marketing}, y quiere duplicar el presupuesto. ¿Qué afirmaciones son válidas?")
    o = q["o"]
    o[0] = O(f"El alza de unos {r} puntos en las semanas {w}--{w + 3} es evidencia suficiente de que la campaña funciona.", False,
             f"Antes de atribuir un salto a la campaña: ¿pasó lo mismo en esta época el año pasado? Aquí sí (semanas {w - 52}--{w - 49}, alza de ~{r} puntos).")
    o[1] = O(f"El alza equivalente de las semanas {w - 52}--{w - 49}, sin campaña, sugiere un patrón anual que podría explicar el salto.", True,
             "Es la «firma de la estacionalidad»: el mismo salto un ciclo antes.")
    q["resumen"] = f"alza {w}--{w+3} (equivalente {w-52}--{w-49}); alzas {a1:.1f} y {a2:.1f} pts; semilla {semilla}"
    return q


# ------------------------------------------------------------------ Reactivo 8: embudo
def t_embudo(m, e):
    pasos = ["view\\_item", "add\\_to\\_cart", "begin\\_checkout", "purchase"]
    filas = "\\\\ ".join(f"\\texttt{{{p}}} & {fmt(a)} & {fmt(b)}" for p, a, b in zip(pasos, m, e))
    return (r"\begin{center}{\scriptsize\renewcommand{\arraystretch}{1.05}\begin{tabular}{@{}lrr@{}}\toprule" "\n"
            r"Paso (evento) & Móvil & Escritorio\\\midrule" "\n" + filas +
            r"\\\bottomrule\end{tabular}}\\[1pt]{\tiny\textbf{Tabla @T@.} Embudo de Google Analytics por dispositivo (usuarios).}\end{center}")


def q8(m, e):
    pm = [m[i + 1] / m[i] for i in range(3)]
    pe = [e[i + 1] / e[i] for i in range(3)]
    assert pm.index(min(pm)) == 0 and pe.index(min(pe)) == 0, "el mayor abandono debe ser el primer paso"
    assert pe[2] > pm[2], "el último paso debe avanzar más en escritorio"
    assert 1 - pm[2] < 1 - pm[0] and 1 - pe[2] < 1 - pe[0], "el pago no debe ser el mayor abandono"
    q = base(8)
    q["extra"] = t_embudo(m, e); q["tabla"] = None
    o = q["o"]
    o[0] = O(f"En ambos dispositivos el mayor abandono ocurre entre \\texttt{{view\\_item}} y \\texttt{{add\\_to\\_cart}} ({pc(1 - pm[0])}\\,\\% en móvil; {pc(1 - pe[0])}\\,\\% en escritorio).", True,
             f"Móvil: {fmt(m[1])}/{fmt(m[0])} = {pc(pm[0])} % avanza; escritorio: {fmt(e[1])}/{fmt(e[0])} = {pc(pe[0])} % avanza.")
    o[1] = O(o[1][0], False,
             f"El mayor abandono es el primer paso, no el pago (\\texttt{{begin\\_checkout}}$\\to$\\texttt{{purchase}}: {pc(1 - pm[2])} % y {pc(1 - pe[2])} %).")
    o[2] = O(f"El paso \\texttt{{begin\\_checkout}}$\\to$\\texttt{{purchase}} avanza más en escritorio ({pc(pe[2])}\\,\\%) que en móvil ({pc(pm[2])}\\,\\%).", True,
             f"{fmt(m[3])}/{fmt(m[2])} = {pc(pm[2])} %; {fmt(e[3])}/{fmt(e[2])} = {pc(pe[2])} %.")
    o[3] = O(f"La conversión de punta a punta es {pc(m[3] / m[0])}\\,\\% en móvil y {pc(e[3] / e[0])}\\,\\% en escritorio.", True,
             f"{fmt(m[3])}/{fmt(m[0])} = {pc(m[3] / m[0])} %; {fmt(e[3])}/{fmt(e[0])} = {pc(e[3] / e[0])} %.")
    q["resumen"] = f"móvil {m}; escritorio {e}; conversión {pc(m[3]/m[0])} % y {pc(e[3]/e[0])} %"
    return q


# ------------------------------------------------------------------ Reactivo 10: reglas de decisión
ATR = ["precio", "calidad", "entrega"]


def buscar_reglas(w, u, p, semilla):
    rng = random.Random(semilla)
    while True:
        T = {k: tuple(rng.randint(2, 9) for _ in range(3)) for k in "ABCD"}
        U = {k: sum(wi * si for wi, si in zip(w, T[k])) for k in T}          # décimas
        orden = sorted(U, key=U.get, reverse=True)
        W = orden[0]
        if U[W] - U[orden[1]] < 3:
            continue
        col = lambda j: [T[k][j] for k in T]
        f = min(range(3), key=lambda j: T[W][j])
        if sorted(col(f)).count(T[W][f]) != 1 or sorted(col(f))[0] != T[W][f] or T[W][f] >= u:
            continue
        S = [k for k in T if min(T[k]) >= u]
        if len(S) != 2:
            continue
        mx = max(col(p))
        L = [k for k in T if T[k][p] >= mx - 0.5]
        if len(L) != 1 or L[0] in S or L[0] == W:
            continue
        for qj in range(3):
            if qj == p:
                continue
            mxq = max(col(qj))
            if col(qj).count(mxq) == 1:
                M = [k for k in T if T[k][qj] == mxq][0]
                if M not in (L[0], W):
                    return T, U, W, f, S, L[0], M, qj


def t_reglas(T):
    filas = "\\\\ ".join(f"{k} & " + " & ".join(str(x) for x in T[k]) for k in sorted(T))
    return (r"\begin{center}{\scriptsize\renewcommand{\arraystretch}{1.05}\begin{tabular}{@{}lccc@{}}\toprule" "\n"
            r"Alternativa & Precio & Calidad & Entrega\\\midrule" "\n" + filas +
            r"\\\bottomrule\end{tabular}}\\[1pt]{\tiny\textbf{Tabla @T@.} Puntajes normalizados 0--10 (10 = lo mejor).}\end{center}")


def q10(w, u, p, semilla):
    T, U, W, f, S, L, M, qj = buscar_reglas(w, u, p, semilla)
    q = base(10)
    ws = [f"{x / 10:.1f}" for x in w]
    q["extra"] = t_reglas(T); q["tabla"] = None
    q["q"] = ("La tabla da los puntajes ya normalizados de 0 a 10 (10 = lo mejor; precio y entrega ya están invertidos) de cuatro alternativas ficticias. "
              f"Pesos: precio {ws[0]}, calidad {ws[1]}, entrega {ws[2]}. Reglas: aditiva; conjuntiva con umbral {u} en cada atributo; "
              f"lexicográfica con prioridad en {ATR[p]} (tolerancia 0.5). ¿Qué afirmaciones son correctas?")
    o = q["o"]
    Us = "; ".join(f"{k}={U[k] / 10:.1f}" for k in sorted(U))
    o[0] = O(f"La regla aditiva elige {W} ({U[W] / 10:.1f}), aunque tenga el puntaje de {ATR[f]} más bajo.", True, Us + ".")
    o[1] = O(f"La regla lexicográfica con prioridad en {ATR[p]} elige {M}, porque su {ATR[qj]} es la mejor.", False,
             f"Con prioridad en {ATR[p]} gana {L}; el {ATR[qj]} no decide, solo desempata si el atributo prioritario empata dentro de la tolerancia.")
    o[2] = O(f"La regla conjuntiva con umbral {u} deja pasar solo a {S[0]} y a {S[1]}.", True,
             f"{W} falla en {ATR[f]} ({T[W][f]}); {', '.join(k for k in T if k not in S and k != W)} también quedan fuera por tener un puntaje menor a {u}.")
    o[3] = O(f"{W} gana con la aditiva y queda fuera con la conjuntiva porque la primera deja que un atributo compense a otro y la segunda exige un mínimo en cada uno.", True,
             "Diferencia entre regla compensatoria y no compensatoria.")
    q["resumen"] = f"pesos {ws}; umbral {u}; prioridad {ATR[p]}; aditiva {W}; conjuntiva {S}; lexicográfica {L}; tabla {T}"
    return q


# ------------------------------------------------------------------ Reactivo 15: comparación de escenarios
def t_escenarios(r):
    nombres = ["A: base", "B: más retrocesos", "C: más redes, mejor directo"]
    filas = "\\\\ ".join(f"{n} & {c} & {t} & {uc}\\,\\% / {rm}\\,\\%" for n, (c, t, uc, rm) in zip(nombres, r))
    return (r"\begin{center}\resizebox{\columnwidth}{!}{\scriptsize\renewcommand{\arraystretch}{1.05}\begin{tabular}{@{}lccc@{}}\toprule" "\n"
            r"Escenario & \% que convierte & Contactos hasta salir & Redes: último clic / remoción\\\midrule" "\n" + filas +
            r"\\\bottomrule\end{tabular}}\\[1pt]{\tiny\textbf{Tabla @T@.} Resultados hipotéticos de un modelo de recorrido.}\end{center}")


def q15(r):
    (cA, tA, ucA, rA), (cB, tB, ucB, rB), (cC, tC, ucC, rC) = r
    assert cB < cA and tB > tA and cC > cA and ucC > ucA and rC > rA and rA > ucA and rC > ucC
    q = base(15)
    q["extra"] = t_escenarios(r); q["tabla"] = None
    o = q["o"]
    o[0] = O(o[0][0], True, f"{cA} % $\\to$ {cB} % y {tA} $\\to$ {tB} contactos; el costo de volver atrás.")
    o[2] = O(o[2][0], False,
             f"Redes pasa de {ucA} % a {ucC} % con el último clic, pero de {rA} % a {rC} % con la remoción: miden cosas distintas y el último clic sigue subestimándola.")
    q["resumen"] = f"escenarios (conv, contactos, UC, remoción) = {r}"
    return q


# ------------------------------------------------------------------ Reactivo 16: atribución
def q16(uc, rem):
    assert sum(uc) == 100
    q = base(16)
    a = "redes sociales 4\\,\\%, búsqueda 52\\,\\%, directo 38\\,\\%, correo 6\\,\\%"
    b = f"redes sociales {uc[0]}\\,\\%, búsqueda {uc[1]}\\,\\%, directo {uc[2]}\\,\\%, correo {uc[3]}\\,\\%"
    assert a in q["q"] and "cerca de 20\\,\\%" in q["q"]
    q["q"] = q["q"].replace(a, b).replace("cerca de 20\\,\\%", f"cerca de {rem}\\,\\%")
    q["resumen"] = f"último clic {uc}; remoción de redes ~{rem} %"
    return q


# ------------------------------------------------------------------ Reactivos 18 y 23: creadores
def metricas(seg, inter, tarifa):
    return dict(er=100 * inter / seg, cpe=tarifa / inter, cpm=tarifa / seg * 1000)


def t_creadores(nombres, filas):
    cuerpo = "\\\\ ".join(f"{n} & {fmt(s)} & {fmt(i)} & \\${fmt(t)}" for n, (s, i, t) in zip(nombres, filas))
    return (r"\begin{center}{\scriptsize\renewcommand{\arraystretch}{1.05}\begin{tabular}{@{}lrrr@{}}\toprule" "\n"
            r"Creador & Seguidores & Interacciones & Tarifa (MXN)\\\midrule" "\n" + cuerpo +
            r"\\\bottomrule\end{tabular}}\\[1pt]{\tiny\textbf{Tabla @T@.} Cotizaciones por publicación (hipotéticas).}\end{center}")


def er_txt(x):
    return f"{x:.1f}".rstrip("0").rstrip(".") if abs(x - round(x)) > 1e-9 else str(int(round(x)))


def q18(X, Y, Z):
    mx, my, mz = metricas(*X), metricas(*Y), metricas(*Z)
    assert mz["er"] > 10 and mz["er"] > mx["er"] > my["er"], "Z con engagement sospechoso y el mayor; X > Y"
    assert mz["cpe"] < mx["cpe"] < my["cpe"], "CPE: Z < X < Y"
    assert Y[1] > X[1], "Y suma más interacciones totales que X"
    assert my["cpm"] < mx["cpm"], "Y más eficiente que X por alcance"
    q = base(18)
    q["extra"] = t_creadores("XYZ", [X, Y, Z]); q["tabla"] = None
    o = q["o"]
    o[0] = O(f"Z tiene el \\textit{{engagement rate}} más alto ({er_txt(mz['er'])}\\,\\%) y el menor costo por interacción ({money(mz['cpe'])}), pero un engagement tan alto justifica auditar su audiencia antes de elegirlo.", True,
             f"ER de Z = {fmt(Z[1])}/{fmt(Z[0])} = {er_txt(mz['er'])} %; CPE = {money(mz['cpe'])}. Un engagement muy superior a 10 % en Instagram es señal de alerta de audiencia inflada.")
    o[1] = O(f"Y tiene un \\textit{{engagement rate}} mayor que X porque suma más interacciones totales ({fmt(Y[1])} frente a {fmt(X[1])}).", False,
             f"ER de X = {er_txt(mx['er'])} %; ER de Y = {er_txt(my['er'])} %: el ER se calcula sobre los seguidores, no sobre el total de interacciones.")
    o[2] = O(o[2][0], True,
             f"Y: {money(my['cpm'])} vs. X: {money(mx['cpm'])} por mil seguidores; X: {money(mx['cpe'])} vs. Y: {money(my['cpe'])} por interacción. Primero el objetivo, luego el creador.")
    q["resumen"] = f"X={X}, Y={Y}, Z={Z}"
    return q


def q23(A, B, C):
    ma, mb, mc = metricas(*A), metricas(*B), metricas(*C)
    assert abs(ma["cpe"] - mc["cpe"]) < 1e-9 and ma["er"] > mc["er"], "A y C mismo CPE; ER de A mayor"
    assert ma["er"] > mc["er"] > mb["er"], "ER: A > C > B"
    assert mb["cpm"] < mc["cpm"] < ma["cpm"] and mb["cpe"] > ma["cpe"], "B más barato por alcance pero con mayor CPE"
    q = base(23)
    q["extra"] = t_creadores("ABC", [A, B, C]); q["tabla"] = None
    o = q["o"]
    o[1] = O(f"A y C tienen el mismo costo por interacción ({money(ma['cpe'])}), aunque A tiene mayor \\textit{{engagement rate}}.", True,
             f"A: {fmt(A[2])}/{fmt(A[1])} = {ma['cpe']:.2f}; C: {fmt(C[2])}/{fmt(C[1])} = {mc['cpe']:.2f}. ER de A = {er_txt(ma['er'])} %; de C = {er_txt(mc['er'])} %.")
    o[2] = O(f"C tiene el \\textit{{engagement rate}} más alto ({er_txt(mc['er'])}\\,\\%).", False,
             f"A: {er_txt(ma['er'])} %; C: {er_txt(mc['er'])} %; B: {er_txt(mb['er'])} %.")
    o[3] = O(f"B es el más barato por cada mil seguidores ({money(mb['cpm'])}), pero tiene el \\textit{{engagement rate}} más bajo de los tres ({er_txt(mb['er'])}\\,\\%).", True,
             f"A: {money(ma['cpm'])}; B: {money(mb['cpm'])}; C: {money(mc['cpm'])}.")
    o[0] = O(o[0][0], False,
             f"El CPM mide costo por alcance potencial; B tiene el CPE más alto ({money(mb['cpe'])}). Primero el objetivo, luego el creador.")
    q["resumen"] = f"A={A}, B={B}, C={C}"
    return q


# ------------------------------------------------------------------ definición de las versiones
VARIANTES = {
    "B": {
        3: q3(w=98, amp=34, tend=0.10, nivel=48),
        8: q8([15000, 4500, 2250, 1350], [10000, 4000, 3000, 2400]),
        10: q10((4, 3, 3), 4, 2, semilla=11),
        15: q15([(28, 4.2, 5, 22), (21, 5.6, 4, 18), (35, 3.9, 8, 33)]),
        16: q16([3, 55, 36, 6], 25),
        18: q18((20000, 900, 4500), (250000, 2500, 25000), (60000, 7500, 15000)),
        23: q23((60000, 2100, 10500), (800000, 6400, 80000), (250000, 6250, 31250)),
    },
    "C": {
        3: q3(w=95, amp=40, tend=0.14, nivel=44),
        8: q8([20000, 4000, 2400, 1440], [12000, 3600, 2520, 1890]),
        10: q10((3, 5, 2), 4, 0, semilla=23),
        15: q15([(33, 3.8, 6, 24), (25, 5.1, 5, 20), (40, 3.4, 9, 36)]),
        16: q16([6, 49, 39, 6], 15),
        18: q18((50000, 1750, 8750), (400000, 3200, 32000), (80000, 10400, 20800)),
        23: q23((30000, 1500, 7500), (400000, 3200, 40000), (150000, 5250, 26250)),
    },
}

if __name__ == "__main__":
    for v, d in VARIANTES.items():
        for n, q in d.items():
            assert sum(1 for x in q["o"] if x[1]) == sum(1 for x in BANCO[n - 1]["o"] if x[1]), (v, n)
            print(v, n, q["resumen"])
