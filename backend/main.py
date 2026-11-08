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

# heuristica a*
def algoritmo_a_star(grid, inicio, meta):
    filas = len(grid)
    columnas = len(grid[0])
    
    open_set = []
    heapq.heappush(open_set, (0, tuple(inicio)))
    came_from = {}
    g_score = {tuple(inicio): 0}
    f_score = {tuple(inicio): distancia_manhattan(inicio, meta)}
    
    while open_set:
        current = heapq.heappop(open_set)[1]
        
        if list(current) == meta:
            ruta = []
            while current in came_from:
                ruta.append(list(current))
                current = came_from[current]
            ruta.append(inicio)
            return ruta[::-1]
            
        vecinos = [
            (current[0] - 1, current[1]),
            (current[0] + 1, current[1]),
            (current[0], current[1] - 1),
            (current[0], current[1] + 1) 
        ]
        
        for v in vecinos:
            if 0 <= v[0] < filas and 0 <= v[1] < columnas:
                if grid[v[0]][v[1]] == 1: # ignorar paredes
                    continue
                    
                # pesos del grafo ponderado
                costo_movimiento = 5 if grid[v[0]][v[1]] == 2 else 1
                tentative_g_score = g_score[current] + costo_movimiento
                
                if v not in g_score or tentative_g_score < g_score[v]:
                    came_from[v] = current
                    g_score[v] = tentative_g_score
                    f_score[v] = tentative_g_score + distancia_manhattan(v, meta)
                    
                    if not any(v == item[1] for item in open_set):
                        heapq.heappush(open_set, (f_score[v], v))
                        
    return []

# endpoint de enrutamiento multietapa
@app.post("/calcular-ruta")
def calcular_ruta(datos: DatosMapa):
    # fase 1: sub-ruta inicial
    ruta_al_cafe = algoritmo_a_star(datos.grid, datos.inicio, datos.cafe)
    if not ruta_al_cafe:
        return {"ruta": []}
        
    # fase 2: sub-ruta final
    ruta_a_la_meta = algoritmo_a_star(datos.grid, datos.cafe, datos.meta)
    if not ruta_a_la_meta:
        return {"ruta": []} 
        
    # union de sub-rutas eliminando el nodo duplicado
    ruta_completa = ruta_al_cafe + ruta_a_la_meta[1:]
    
    return {"ruta": ruta_completa}