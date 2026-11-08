import { useState } from "react";
import "./App.css";
// importacion de assets
import imgProfe from "./assets/bretagod.png";
import imgDulce from "./assets/pokedulce.png";
import imgCafe from "./assets/cafecito.png";
import imgPared from "./assets/pared.jpg";
import imgLodo from "./assets/lodito.jpg";

function App() {
  const [tamano, setTamano] = useState(10);
  const [inicio, setInicio] = useState([0, 0]);
  const [meta, setMeta] = useState([9, 9]);
  const [cafe, setCafe] = useState([4, 4]);

  const [paredes, setParedes] = useState([]);
  const [lodo, setLodo] = useState([]);
  const [herramienta, setHerramienta] = useState("pared");
  const [cargando, setCargando] = useState(false);

  // animaciones y metricas
  const [rutaAnimada, setRutaAnimada] = useState([]);
  const [metricas, setMetricas] = useState(null);

  // cuadrito por cuadrito animado
  const animarPasos = (rutaCompleta) => {
    setRutaAnimada([]);
    rutaCompleta.forEach((paso, index) => {
      // turbo de renderizado en matrices grandes
      const velocidad = rutaCompleta.length > 100 ? 10 : 100;
      setTimeout(() => {
        setRutaAnimada((rutaActual) => [...rutaActual, paso]);
      }, index * velocidad);
    });
  };

  // generacion aleatoria y modo manual
  const generarNivel = (dificultad) => {
    setRutaAnimada([]);
    setMetricas(null);
    setLodo([]);

    let nuevoTamano = tamano;
    let probabilidad = 0.15;

    // configuracion de variables por dificultad
    if (dificultad === "manual") {
      setParedes([]);
      return;
    } else if (dificultad === "facil") {
      nuevoTamano = 10;
      probabilidad = 0.15;
    } else if (dificultad === "medio") {
      nuevoTamano = 20;
      probabilidad = 0.25;
    } else if (dificultad === "iit") {
      nuevoTamano = 50;
      probabilidad = 0.35;
    }

    setTamano(nuevoTamano);
    setInicio([0, 0]);
    setMeta([nuevoTamano - 1, nuevoTamano - 1]);

    // calculo del checkpoint central
    let centro = Math.floor(nuevoTamano / 2);
    let metaTemp = [nuevoTamano - 1, nuevoTamano - 1];
    let cafeTemp = [centro, centro];
    setCafe(cafeTemp);

    // validacion bfs para solvencia del mapa
    const bfs = (origen, destino, paredesPrueba) => {
      let gridTest = Array(nuevoTamano)
        .fill()
        .map(() => Array(nuevoTamano).fill(0));
      paredesPrueba.forEach((p) => {
        gridTest[p[0]][p[1]] = 1;
      });
      let visitados = Array(nuevoTamano)
        .fill()
        .map(() => Array(nuevoTamano).fill(false));
      let cola = [origen];
      visitados[origen[0]][origen[1]] = true;

      while (cola.length > 0) {
        let [r, c] = cola.shift();
        if (r === destino[0] && c === destino[1]) return true;

        const vecinos = [
          [r - 1, c],
          [r + 1, c],
          [r, c - 1],
          [r, c + 1],
        ];
        for (let [vr, vc] of vecinos) {
          if (
            vr >= 0 &&
            vr < nuevoTamano &&
            vc >= 0 &&
            vc < nuevoTamano &&
            gridTest[vr][vc] === 0 &&
            !visitados[vr][vc]
          ) {
            visitados[vr][vc] = true;
            cola.push([vr, vc]);
          }
        }
      }
      return false;
    };

    let esValido = false;
    let nuevasParedes = [];

    // regeneracion iterativa hasta obtener solucion completa
    while (!esValido) {
      nuevasParedes = [];
      for (let i = 0; i < nuevoTamano; i++) {
        for (let j = 0; j < nuevoTamano; j++) {
          if (
            (i === 0 && j === 0) ||
            (i === metaTemp[0] && j === metaTemp[1]) ||
            (i === cafeTemp[0] && j === cafeTemp[1])
          )
            continue;
          if (Math.random() < probabilidad) nuevasParedes.push([i, j]);
        }
      }
      let llegaAlCafe = bfs([0, 0], cafeTemp, nuevasParedes);
      let llegaAlDulce = bfs(cafeTemp, metaTemp, nuevasParedes);
      esValido = llegaAlCafe && llegaAlDulce;
    }

    setParedes(nuevasParedes);
  };

  const resolverLaberinto = async () => {
    setCargando(true);
    setMetricas(null);
    const tiempoInicio = performance.now();

    try {
      // 0 es libre, 1 es pared, 2 es lodo
      let grid = Array(tamano)
        .fill()
        .map(() => Array(tamano).fill(0));
      paredes.forEach((p) => {
        grid[p[0]][p[1]] = 1;
      });
      lodo.forEach((p) => {
        grid[p[0]][p[1]] = 2;
      });

      const response = await fetch("http://localhost:8000/calcular-ruta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ grid, inicio, meta, cafe }),
      });

      const data = await response.json();
      const tiempoFin = performance.now();
      const tiempoTotal = (tiempoFin - tiempoInicio).toFixed(2);

      if (data.ruta && data.ruta.length > 0) {
        animarPasos(data.ruta);

        // calculo metrico del recorrido final
        let costoReal = 0;
        data.ruta.forEach((paso) => {
          const esPasoLodo = lodo.some(
            (l) => l[0] === paso[0] && l[1] === paso[1],
          );
          costoReal += esPasoLodo ? 5 : 1;
        });

        setMetricas({
          tiempo: tiempoTotal,
          pasos: data.ruta.length,
          costo: costoReal,
        });
      } else {
        alert("El laberinto no tiene solución. Revisa los obstáculos.");
      }
    } catch (error) {
      console.error("error:", error);
      alert("Error de conexión. Asegúrate de encender el servidor de Python.");
    }
    setCargando(false);
  };

  const clickCelda = (i, j) => {
    if (
      (i === inicio[0] && j === inicio[1]) ||
      (i === meta[0] && j === meta[1]) ||
      (i === cafe[0] && j === cafe[1])
    )
      return;

    const esPared = paredes.some((p) => p[0] === i && p[1] === j);
    const esLodo = lodo.some((p) => p[0] === i && p[1] === j);

    // limpia celda
    let nuevasParedes = paredes.filter((p) => p[0] !== i || p[1] !== j);
    let nuevoLodo = lodo.filter((p) => p[0] !== i || p[1] !== j);

    // aplica terreno activo
    if (herramienta === "pared" && !esPared) {
      nuevasParedes.push([i, j]);
    } else if (herramienta === "lodo" && !esLodo) {
      nuevoLodo.push([i, j]);
    }

    setParedes(nuevasParedes);
    setLodo(nuevoLodo);
  };

  const renderGrid = () => {
    let gridJSX = [];
    // escalado responsivo del grid
    const pixelesCelda = tamano === 10 ? 45 : tamano === 20 ? 30 : 20;

    for (let i = 0; i < tamano; i++) {
      let fila = [];
      for (let j = 0; j < tamano; j++) {
        const esInicio = i === inicio[0] && j === inicio[1];
        const esMeta = i === meta[0] && j === meta[1];
        const esCafe = i === cafe[0] && j === cafe[1];

        const esPared = paredes.some((p) => p[0] === i && p[1] === j);
        const esLodo = lodo.some((p) => p[0] === i && p[1] === j);
        const esCamino = rutaAnimada.some((p) => p[0] === i && p[1] === j);

        let claseCelda = "celda ";
        if (esPared) claseCelda += "pared ";
        if (esLodo) claseCelda += "lodo ";
        if (esCamino && !esInicio && !esMeta && !esCafe)
          claseCelda += "camino ";

        let bgImage = "none";
        if (esPared) bgImage = `url(${imgPared})`;
        if (esLodo) bgImage = `url(${imgLodo})`;

        fila.push(
          <div
            key={`${i}-${j}`}
            onClick={() => clickCelda(i, j)}
            className={claseCelda}
            style={{
              width: `${pixelesCelda}px`,
              height: `${pixelesCelda}px`,
              minWidth: `${pixelesCelda}px`,
              backgroundImage: bgImage,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            {esInicio && (
              <img
                src={imgProfe}
                className="sprite"
                alt="profe"
                style={{ transform: "scale(1.4)" }}
              />
            )}
            {esCafe && (
              <img
                src={imgCafe}
                className="sprite animacion-flotar"
                alt="cafe"
                style={{ transform: "scale(0.8)" }}
              />
            )}
            {esMeta && (
              <img
                src={imgDulce}
                className="sprite animacion-flotar"
                alt="dulce"
                style={{ transform: "scale(1.3)" }}
              />
            )}
          </div>,
        );
      }
      gridJSX.push(
        <div key={i} className="fila">
          {fila}
        </div>,
      );
    }
    return gridJSX;
  };

  return (
    <div className="contenedor">
      <div className="cabecera">
        <h1>Operación Pokedulce</h1>
        <p className="subtitulo">
          Simulador Heurístico A* (Grafos con costo y checkpoints)
        </p>
        <p className="autor">Hecho por Ingrid Morales Romo</p>
      </div>

      {/* nuevo bloque de contexto y lore */}
      <div className="instrucciones" style={{ marginBottom: "15px" }}>
        <h3 style={{ color: "#ff9f1c", marginBottom: "10px" }}>
          Contexto de la Misión
        </h3>
        <p style={{ marginBottom: "10px", lineHeight: "1.5" }}>
          El profesor Bretagod necesita llegar urgentemente a su preciado
          Pokedulce. Sin embargo, la jornada en el IIT es pesada y es un
          requisito obligatorio hacer una parada técnica por un café antes de
          llegar a su destino final.
        </p>
        <p style={{ margin: 0, lineHeight: "1.5", color: "#e9c46a" }}>
          <strong>¿Cómo calculamos la ruta?</strong> El simulador utiliza el
          algoritmo <strong>A* (A-Estrella)</strong> en un enrutamiento
          multietapa. El sistema evalúa los caminos calculando el costo real de
          movimiento (esquivando paredes y penalizando terrenos pesados como el
          lodo) sumado a la distancia estimada (heurística de Manhattan) hacia
          el objetivo.
        </p>
      </div>

      <div className="instrucciones">
        <h3>Instrucciones de Uso:</h3>
        <ul>
          <li>
            1. Selecciona un nivel predeterminado o utiliza el lienzo en blanco.
          </li>
          <li>
            2. Dibuja con los pinceles paredes (bloqueo total) o lodo (terreno
            pesado que multiplica el costo por 5).
          </li>
          <li>
            <strong>Objetivo:</strong> El algoritmo trazará la ruta óptima desde
            el punto de inicio hacia el café, y finalmente hacia la meta.
          </li>
        </ul>
      </div>

      <div className="herramientas">
        <button
          className={herramienta === "pared" ? "btn-activo" : "btn-inactivo"}
          onClick={() => setHerramienta("pared")}
        >
          Pincel de Pared
        </button>
        <button
          className={
            herramienta === "lodo" ? "btn-activo-lodo" : "btn-inactivo"
          }
          onClick={() => setHerramienta("lodo")}
        >
          Pincel de Lodo (Costo +5)
        </button>
      </div>

      <div className="niveles-panel">
        <button className="btn-nivel" onClick={() => generarNivel("manual")}>
          Lienzo en Blanco
        </button>
        <button className="btn-nivel" onClick={() => generarNivel("facil")}>
          Nivel Fácil (10x10)
        </button>
        <button className="btn-nivel" onClick={() => generarNivel("medio")}>
          Nivel Medio (20x20)
        </button>
        <button
          className="btn-nivel btn-dios"
          onClick={() => generarNivel("iit")}
        >
          Nivel Dios (50x50)
        </button>
      </div>

      <div className="tablero-wrapper">
        <div className="tablero">{renderGrid()}</div>
      </div>

      <div className="controles">
        <button
          className="btn-accion"
          onClick={resolverLaberinto}
          disabled={cargando}
        >
          {cargando ? "Procesando..." : "Ejecutar Algoritmo A*"}
        </button>
        <button
          className="btn-accion btn-borrar"
          onClick={() => {
            setParedes([]);
            setLodo([]);
            setRutaAnimada([]);
            setMetricas(null);
          }}
        >
          Borrar Todo
        </button>
      </div>

      {metricas && (
        <div className="panel-telemetria">
          <h3>Reporte de Ejecución</h3>
          <div className="metricas-grid">
            <p>
              <strong>Tamaño de Matriz:</strong> {tamano}x{tamano} (
              {tamano * tamano} nodos)
            </p>
            <p>
              <strong>Tiempo de Respuesta:</strong> {metricas.tiempo} ms
            </p>
            <p>
              <strong>Nodos Visitados:</strong> {metricas.pasos} pasos
            </p>
            <p className="metrica-destacada">
              <strong>Costo Total del Trayecto:</strong> {metricas.costo}{" "}
              unidades
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
