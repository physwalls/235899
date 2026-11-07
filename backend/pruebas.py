import time
import tracemalloc
import heapq
import random

# calculamos la distancia manhattan entre dos puntos
def distancia_manhattan(origen, destino):
    return abs(origen[0] - destino[0]) + abs(origen[1] - destino[1])

# el mero mero algoritmo a estrella
def algoritmo_a_star(grid, inicio, meta):
    filas = len(grid)
    columnas = len(grid[0])
    
    open_set = []
    # metemos el nodo inicial a la cola
    heapq.heappush(open_set, (0, tuple(inicio)))
    came_from = {}
    g_score = {tuple(inicio): 0}
    f_score = {tuple(inicio): distancia_manhattan(inicio, meta)}
    
    while open_set:
        current = heapq.heappop(open_set)[1]
        
        # si ya llegamos a la meta nos salimos
        if list(current) == meta:
            return True 
            
        # checamos arriba, abajo, izq, der
        vecinos = [(current[0]-1, current[1]), (current[0]+1, current[1]), 
                   (current[0], current[1]-1), (current[0], current[1]+1)]
        
        for v in vecinos:
            # validamos que no se salga del mapa y que no sea pared
            if 0 <= v[0] < filas and 0 <= v[1] < columnas and grid[v[0]][v[1]] == 0:
                tentative_g_score = g_score[current] + 1
                
                if v not in g_score or tentative_g_score < g_score[v]:
                    came_from[v] = current
                    g_score[v] = tentative_g_score
                    f_score[v] = tentative_g_score + distancia_manhattan(v, meta)
                    
                    if not any(v == item[1] for item in open_set):
                        heapq.heappush(open_set, (f_score[v], v))
                        
    # si no encontro ruta regresa false
    return False

# funcion pa generar los mapas random para las pruebas
def generar_mapa(tamano):
    grid = [[0 for _ in range(tamano)] for _ in range(tamano)]
    for i in range(tamano):
        for j in range(tamano):
            # le metemos un 20% de probabilidad de que sea pared pa simular bloqueos
            if random.random() < 0.2: 
                grid[i][j] = 1
                
    # nos aseguramos que el inicio y la meta siempre esten libres pa que no truene
    grid[0][0] = 0 
    grid[tamano-1][tamano-1] = 0 
    return grid

# los tamanios de matriz que voy a calar
tamanos = [10, 50, 100, 500]
print("Pruebas de Rendimiento A*\n")
print(f"{'Mapa':<10} | {'Celdas (N)':<12} | {'Tiempo (ms)':<15} | {'Memoria (KB)':<15}")
print("-" * 60)

for t in tamanos:
    mapa = generar_mapa(t)
    inicio = [0, 0]
    meta = [t-1, t-1]
    
    # empezamos a medir la ram
    tracemalloc.start()
    # empezamos a medir el tiempo
    inicio_tiempo = time.perf_counter()
    
    # corremos el algoritmo
    algoritmo_a_star(mapa, inicio, meta)
    
    # paramos el cronometro y sacamos lo de la memoria
    fin_tiempo = time.perf_counter()
    current, peak = tracemalloc.get_traced_memory()
    tracemalloc.stop()
    
    # calculamos los ms y los kb
    tiempo_ms = (fin_tiempo - inicio_tiempo) * 1000
    memoria_kb = peak / 1024
    
    # imprimimos los resultados para ponerlos en el reporte del iit
    print(f"{t}x{t:<8} | {t*t:<12} | {tiempo_ms:<15.2f} | {memoria_kb:<15.2f}")