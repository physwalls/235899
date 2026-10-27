import json
import os

import osmnx as ox

# coordenadas de IIT como el centro del mapa
CENTRO = (31.742332786198123, -106.43321041449813)
# radio en metros a tomar alrededor del centro para generar el mapa
RADIO_M = 1500

DATA = os.path.join(os.path.dirname(__file__), 'data') 
os.makedirs(DATA, exist_ok=True)

# generar el grafo de calles a partir de las coordenadas del centro y el radio especificado
G = ox.graph_from_point(CENTRO, dist=RADIO_M, network_type='drive')
G = ox.truncate.largest_component(G, strongly=True)

# asignacion de id a cada tramo de la calle en sus dos sentidos
nodos = {str(n): [d['y'], d['x']] for n, d in G.nodes(data=True)}

# aristas y calles
ids = {}
mejores = {}
features = {} 

for u, v, d in G.edges(data=True):
    id_calle = ids.setdefault(frozenset((u, v)), len(ids))
    if (u, v) not in mejores or d['length'] < mejores[(u, v)][0]:
        mejores[(u, v)] = (d['length'], id_calle)
    if id_calle not in features:
        if "geometry" in d:
            coords = [[y, x] for x, y in d['geometry'].coords]
        else:
            coords = [[G.nodes[u]['x'], G.nodes[u]['y']], 
                      [G.nodes[v]['x'], G.nodes[v]['y']]]
        features[id_calle] = {
            "type": "Feature",
            "properties": {
                "id": id_calle},
            "geometry": {"type": "LineString", "coordinates": coords}}

aristas = [[u, v, round(largo, 2), i] for (u, v), (largo, i) in mejores.items()]

with open(os.path.join(DATA, "graph.json"), "w", encoding="utf-8") as f:
    json.dump({"nodos": nodos, "aristas": aristas}, f)
with open(os.path.join(DATA, "calles.geojson"), "w", encoding="utf-8") as f:
    json.dump({"type": "FeatureCollection", "features": list(features.values())}, f)     