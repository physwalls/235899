import osmnx as ox

# coordenadas de IIT como el centro del mapa
CENTRO = (31.742332786198123, -106.43321041449813)
# radio en metros a tomar alrededor del centro para generar el mapa
RADIO_M = 1500

G = ox.graph_from_point(CENTRO, dist=RADIO_M, network_type='drive')

print("Nodos (cruces):", len(G.nodes))
print("Aristas (calles):", len(G.edges))    