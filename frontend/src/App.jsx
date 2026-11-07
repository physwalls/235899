import { useState } from "react";
import "./App.css";
// importamos sprites desde la carpeta assets
import imgProfe from "./assets/bretagod.png";
import imgDulce from "./assets/pokedulce.png";

function App() {
  // ahora el tamano cambia segun el nivel
  const [tamano, setTamano] = useState(10);
  const [inicio, setInicio] = useState([0, 0]);
  const [meta, setMeta] = useState([9, 9]);
  const [paredes, setParedes] = useState([]);
  const [cargando, setCargando] = useState(false);

  // animaciones y metricas
  const [rutaAnimada, setRutaAnimada] = useState([]);
  const [metricas, setMetricas] = useState(null);

  // cuadrito por cuadrito animado
  const animarPasos = (rutaCompleta) => {
    setRutaAnimada([]);
    rutaCompleta.forEach((paso, index) => {
      // si el mapa es de 50x50, le metemos turbo a la animacion para no esperar mil anos
      const velocidad = rutaCompleta.length > 100 ? 10 : 100;
      setTimeout(() => {
        setRutaAnimada((rutaActual) => [...rutaActual, paso]);
      }, index * velocidad);
    });
  };

  // laberintos aleatorios y uno en blanco por si queremos personalizar
  const generarNivel = (dificultad) => {
    setRutaAnimada([]);
    setMetricas(null);

    let nuevoTamano = tamano;
    let probabilidad = 0.15;

    // ajustamos tamano y probabilidad segun el boton
    if (dificultad === "manual") {
      setParedes([]);
      return; // en manual respetamos el tamano actual
    } else if (dificultad === "facil") {
      nuevoTamano = 10;
      probabilidad = 0.15;
    } else if (dificultad === "medio") {
      nuevoTamano = 20;
      probabilidad = 0.25;
    } else if (dificultad === "iit") {
      nuevoTamano = 50;
      probabilidad = 0.35; // nivel dios, 2500 celdas y un monton de muros
    }

    setTamano(nuevoTamano);
    setInicio([0, 0]);
    setMeta([nuevoTamano - 1, nuevoTamano - 1]);

    let nuevasParedes = [];
    for (let i = 0; i < nuevoTamano; i++) {
      for (let j = 0; j < nuevoTamano; j++) {
        if (
          (i === 0 && j === 0) ||
          (i === nuevoTamano - 1 && j === nuevoTamano - 1)
        )
          continue;
        if (Math.random() < probabilidad) nuevasParedes.push([i, j]);
      }
    }
    setParedes(nuevasParedes);
  };

  const resolverLaberinto = async () => {
    setCargando(true);
    setMetricas(null);
    const tiempoInicio = performance.now();

    try {
      let grid = Array(tamano)
        .fill()
        .map(() => Array(tamano).fill(0));
      paredes.forEach((p) => {
        grid[p[0]][p[1]] = 1;
      });

      const response = await fetch("http://localhost:8000/calcular-ruta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ grid, inicio, meta }),
      });

      const data = await response.json();
      const tiempoFin = performance.now();
      const tiempoTotal = (tiempoFin - tiempoInicio).toFixed(2);

      if (data.ruta && data.ruta.length > 0) {
        animarPasos(data.ruta);
        setMetricas({ tiempo: tiempoTotal, pasos: data.ruta.length });
      } else {
        alert("¡el laberinto no tiene solucion! bloqueaste todos los caminos.");
      }
    } catch (error) {
      console.error("error:", error);
      alert("prende el server de python pa que jale");
    }
    setCargando(false);
  };

  const clickCelda = (i, j) => {
    if (
      (i === inicio[0] && j === inicio[1]) ||
      (i === meta[0] && j === meta[1])
    )
      return;
    const esPared = paredes.some((p) => p[0] === i && p[1] === j);
    if (esPared) {
      setParedes(paredes.filter((p) => p[0] !== i || p[1] !== j));
    } else {
      setParedes([...paredes, [i, j]]);
    }
  };

  const renderGrid = () => {
    let gridJSX = [];
    // calculamos los pixeles exactos para que el tablero siempre mida 500px de ancho total
    const pixelesCelda = 500 / tamano;

    for (let i = 0; i < tamano; i++) {
      let fila = [];
      for (let j = 0; j < tamano; j++) {
        const esInicio = i === inicio[0] && j === inicio[1];
        const esMeta = i === meta[0] && j === meta[1];
        const esPared = paredes.some((p) => p[0] === i && p[1] === j);
        const esCamino = rutaAnimada.some((p) => p[0] === i && p[1] === j);

        fila.push(
          <div
            key={`${i}-${j}`}
            onClick={() => clickCelda(i, j)}
            className={`celda ${esPared ? "pared" : ""} ${esCamino && !esInicio && !esMeta ? "camino" : ""}`}
            style={{ width: `${pixelesCelda}px`, height: `${pixelesCelda}px` }}
          >
            {/* etiquetas img para el profe y el dulce */}
            {esInicio && <img src={imgProfe} className="sprite" alt="profe" />}
            {esMeta && (
              <img
                src={imgDulce}
                className="sprite animacion-flotar"
                alt="dulce"
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
      <h1>operacion dulce</h1>
      <p>simulador heuristico A*</p>

      {/* botones para los niveles generados al azar */}
      <div
        className="niveles-panel"
        style={{
          marginBottom: "20px",
          display: "flex",
          gap: "10px",
          justifyContent: "center",
          flexWrap: "wrap",
        }}
      >
        <button
          style={{ backgroundColor: "#4a4e69" }}
          onClick={() => generarNivel("manual")}
        >
          lienzo en blanco
        </button>
        <button className="reset" onClick={() => generarNivel("facil")}>
          nivel facil (10x10)
        </button>
        <button className="reset" onClick={() => generarNivel("medio")}>
          nivel medio (20x20)
        </button>
        <button
          style={{ backgroundColor: "#ff0033" }}
          onClick={() => generarNivel("iit")}
        >
          nivel dios (50x50)
        </button>
      </div>

      {/* forzamos el tablero a 500px para que los cuadritos se ajusten dentro */}
      <div className="tablero" style={{ width: "500px", height: "500px" }}>
        {renderGrid()}
      </div>

      <div className="controles" style={{ marginTop: "20px" }}>
        <button onClick={resolverLaberinto} disabled={cargando}>
          {cargando ? "procesando..." : "ejecutar algoritmo A*"}
        </button>
        <button
          className="reset"
          onClick={() => {
            setParedes([]);
            setRutaAnimada([]);
            setMetricas(null);
          }}
        >
          borrar todo
        </button>
      </div>

      {/* panel de telemetria al final */}
      {metricas && (
        <div
          style={{
            marginTop: "20px",
            padding: "15px",
            background: "#1e1e24",
            borderRadius: "8px",
            border: "1px solid #8d99ae",
          }}
        >
          <h3 style={{ color: "#ff9f1c", margin: "0 0 10px 0" }}>
            ⚡ reporte de ejecucion
          </h3>
          <p style={{ margin: "5px 0" }}>
            <strong>tamaño de matriz:</strong> {tamano}x{tamano} (
            {tamano * tamano} nodos)
          </p>
          <p style={{ margin: "5px 0" }}>
            <strong>tiempo de respuesta:</strong> {metricas.tiempo} ms
          </p>
          <p style={{ margin: "5px 0" }}>
            <strong>nodos en ruta optima:</strong> {metricas.pasos} pasos
          </p>
        </div>
      )}
    </div>
  );
}

export default App;
