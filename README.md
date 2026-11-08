# Operación Pokedulce: Simulador Heurístico A\*

Simulador interactivo desarrollado para visualizar y analizar el comportamiento del algoritmo de búsqueda A\* en entornos de grafos ponderados y enrutamiento multietapa.

Proyecto académico de Ingeniería en Sistemas Computacionales (Instituto de Ingeniería y Tecnología - UACJ).

## Contexto del Proyecto

El simulador resuelve un problema de optimización de rutas con sub-metas obligatorias. El objetivo del algoritmo es encontrar la ruta más eficiente para que un agente origen llegue a su destino, realizando una parada obligatoria en un nodo intermedio.

### Características Técnicas:

- **Grafos Ponderados:** El algoritmo calcula el costo de movimiento además de la distancia espacial. Los obstáculos perimetrales bloquean el paso, mientras que el terreno pesado incrementa el costo del trayecto (factor x5), forzando al sistema a recalcular la ruta óptima.
- **Enrutamiento Multietapa:** Ejecución heurística en dos fases continuas (Inicio -> Checkpoint -> Meta), ajustando la distancia Manhattan de forma dinámica.
- **Complejidad Algorítmica (Peor Caso):**
  - Tiempo: $O(V \log V)$ utilizando colas de prioridad (`heapq`).
  - Espacio: $O(V)$ para el almacenamiento de los nodos en memoria.

## Stack Tecnológico

Arquitectura cliente-servidor:

- **Backend:** Python 3 + FastAPI. Encargado de procesar matrices de hasta 2,500 nodos (nivel 50x50) y ejecutar el cálculo matemático del ruteo.
- **Frontend:** React.js + Vite. Interfaz gráfica responsiva con renderizado dinámico del grid y panel de telemetría en tiempo real.

---

## Instrucciones de Ejecución Local

Para inicializar el entorno de desarrollo, es necesario levantar los servicios de backend y frontend en procesos de terminal independientes.

### 1. Inicialización del Backend (API)

Comandos requeridos para instalar dependencias y ejecutar el servidor en Python:

```bash
cd backend
pip install fastapi uvicorn pydantic
python -m uvicorn main:app --reload
```

### 2. Inicialización del Frontend

Comandos requeridos para instalar dependencias y ejecutar el servidor:

```bash
cd frontend
npm install
npm run dev
```
