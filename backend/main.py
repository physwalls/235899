from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import heapq

app = FastAPI()

# configuracion cors para frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# definicion del payload con punto de control
class DatosMapa(BaseModel):
    grid: list[list[int]]
    inicio: list[int]
    meta: list[int]
    cafe: list[int]

# distancia manhattan
def distancia_manhattan(origen, destino):
    return abs(origen[0] - destino[0]) + abs(origen[1] - destino[1])

# a* con insercion perezosa: un nodo puede entrar varias veces al heap,
# pero solo se expande la primera vez que sale (el resto se ignora)
def algoritmo_a_star(grid, inicio, meta):
    filas = len(grid)
    columnas = len(grid[0])
    inicio = tuple(inicio)
    meta = tuple(meta)

    open_set = [(distancia_manhattan(inicio, meta), inicio)]
    came_from = {}
    g_score = {inicio: 0}
    cerrados = set()

    while open_set:
        _, current = heapq.heappop(open_set)
        if current in cerrados:
            continue  # copia vieja del nodo en el heap
        cerrados.add(current)

        if current == meta:
            ruta = [list(current)]
            while current in came_from:
                current = came_from[current]
                ruta.append(list(current))
            return ruta[::-1], len(cerrados)

        vecinos = [
            (current[0] - 1, current[1]),
            (current[0] + 1, current[1]),
            (current[0], current[1] - 1),
            (current[0], current[1] + 1),
        ]
        for v in vecinos:
            if 0 <= v[0] < filas and 0 <= v[1] < columnas:
                if grid[v[0]][v[1]] == 1:  # ignorar paredes
                    continue
                # pesos del grafo ponderado
                costo_movimiento = 5 if grid[v[0]][v[1]] == 2 else 1
                tentative_g = g_score[current] + costo_movimiento
                if v not in g_score or tentative_g < g_score[v]:
                    g_score[v] = tentative_g
                    came_from[v] = current
                    heapq.heappush(open_set, (tentative_g + distancia_manhattan(v, meta), v))

    return [], len(cerrados)

# enrutamiento multietapa: inicio -> cafe -> meta
def resolver(grid, inicio, cafe, meta):
    ruta_al_cafe, exp1 = algoritmo_a_star(grid, inicio, cafe)
    if not ruta_al_cafe:
        return [], exp1
    ruta_a_la_meta, exp2 = algoritmo_a_star(grid, cafe, meta)
    if not ruta_a_la_meta:
        return [], exp1 + exp2
    # union de sub-rutas eliminando el nodo duplicado
    return ruta_al_cafe + ruta_a_la_meta[1:], exp1 + exp2

@app.post("/calcular-ruta")
def calcular_ruta(datos: DatosMapa):
    ruta, expansiones = resolver(datos.grid, datos.inicio, datos.cafe, datos.meta)
    return {"ruta": ruta, "expansiones": expansiones}