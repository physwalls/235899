import random
import time
import tracemalloc
from math import log2
from main import resolver

# mapas aleatorios: 20% paredes y 10% lodo; inicio, cafe (centro) y meta siempre libres
def generar_mapa(t, semilla):
    rnd = random.Random(semilla)
    grid = [[0] * t for _ in range(t)]
    for i in range(t):
        for j in range(t):
            x = rnd.random()
            if x < 0.20:
                grid[i][j] = 1
            elif x < 0.30:
                grid[i][j] = 2
    c = t // 2
    for (i, j) in [(0, 0), (c, c), (t - 1, t - 1)]:
        grid[i][j] = 0
    return grid

def mapa_con_solucion(t, semilla):
    # se prueban semillas hasta que exista ruta completa (si no, la medicion no sirve)
    while True:
        g = generar_mapa(t, semilla)
        c = t // 2
        ruta, _ = resolver(g, [0, 0], [c, c], [t - 1, t - 1])
        if ruta:
            return g
        semilla += 1000

TAMANOS = [10, 20, 50, 100, 200, 300, 500]
REPETICIONES = 5

print("Pruebas de rendimiento A* (inicio -> cafe -> meta)\n")
print(f"{'Mapa':<9}{'V':>8}{'V log2 V':>12}{'Tiempo (ms)':>14}{'Expansiones':>14}{'Exp/V':>8}{'Memoria (KB)':>15}")
print("-" * 80)

for t in TAMANOS:
    c = t // 2
    tiempos, exps = [], []
    for r in range(REPETICIONES):
        g = mapa_con_solucion(t, semilla=t * 100 + r)
        ini = time.perf_counter()
        ruta, e = resolver(g, [0, 0], [c, c], [t - 1, t - 1])
        fin = time.perf_counter()
        tiempos.append((fin - ini) * 1000)
        exps.append(e)
    # la memoria se mide aparte porque tracemalloc hace mas lento el programa
    g = mapa_con_solucion(t, semilla=t * 100)
    tracemalloc.start()
    resolver(g, [0, 0], [c, c], [t - 1, t - 1])
    _, pico = tracemalloc.get_traced_memory()
    tracemalloc.stop()

    V = t * t
    t_prom = sum(tiempos) / len(tiempos)
    e_prom = sum(exps) / len(exps)
    print(f"{t}x{t:<6}{V:>8}{V * log2(V):>12.0f}{t_prom:>14.2f}{e_prom:>14.0f}{e_prom / V:>8.2f}{pico / 1024:>15.1f}")