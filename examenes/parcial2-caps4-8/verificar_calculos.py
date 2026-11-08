# -*- coding: utf-8 -*-
"""Verifica las cifras de los reactivos numéricos del 2.º parcial y genera los datos de la Figura 1."""
import numpy as np

print("== Q8 embudo GA4 ==")
mov = [12000, 3000, 1500, 900]; esc = [8000, 2800, 1960, 1372]
for n, v in (("móvil", mov), ("escritorio", esc)):
    p = [v[i+1]/v[i] for i in range(3)]
    print(n, [f"{x:.1%}" for x in p], "abandono", [f"{1-x:.1%}" for x in p], "global", f"{v[-1]/v[0]:.2%}")

print("== Q10 reglas de decisión ==")
alt = {"A": (9, 4, 8), "B": (6, 7, 6), "C": (8, 9, 2), "D": (5, 6, 9)}
w = np.array([.5, .3, .2]); assert abs(w.sum()-1) < 1e-12
for k, s in alt.items(): print(k, "U =", round(float(w @ np.array(s)), 2))
for u in (5, 6):
    print("conjuntiva u=%d:" % u, [k for k, s in alt.items() if min(s) >= u])
for j, nom in enumerate(("precio", "calidad", "entrega")):
    mx = max(s[j] for s in alt.values())
    print("lexicográfica prioridad", nom, "tol 0.5:", [k for k, s in alt.items() if s[j] >= mx-0.5])

print("== Q15 Markov ==")
Q = np.array([[.5, .3], [.2, .4]]); R = np.array([[0, .2], [.3, .1]])
assert np.allclose(Q.sum(1)+R.sum(1), 1)
N = np.linalg.inv(np.eye(2)-Q); B = N @ R
print("N=\n", N, "\nB=\n", B, "\nE[T]=", N @ np.ones(2))

print("== Q23 influencers ==")
for n, seg, inter, tar in (("A", 40000, 1600, 8000), ("B", 500000, 5000, 60000), ("C", 120000, 3600, 18000)):
    print(n, f"ER={inter/seg:.2%}", f"CPE=${tar/inter:.2f}", f"CPM_seg=${tar/seg*1000:.2f}")

print("== Fig.1 serie ==")
rng = np.random.default_rng(2026)
t = np.arange(1, 105)
y = 45 + 0.12*t + 38*np.sin(2*np.pi*(t-49)/52) + rng.normal(0, 2.5, t.size)
y = np.round(y, 1)
print(" ".join(f"({a},{b})" for a, b in zip(t, y)))
print("sem 49-52:", y[48:52], "| 101-104:", y[100:104], "| 97-100:", y[96:100], "| 45-48:", y[44:48])
# promedio móvil centrado de 52 semanas (tendencia)
ma = np.convolve(y, np.ones(52)/52, mode="valid"); print("tendencia MA52 (n=%d) rango:" % ma.size, ma.min().round(1), ma.max().round(1))
